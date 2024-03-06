import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import {
  getAllPosts, createPost, getPostById, updatePostById, deletePostById,
} from '../db.js';
import cors from  'cors';


const app = express();
app.use(express.json());
app.use(cors());

const swaggerDocument = yaml.load(fs.readFileSync('src/api-docs/swagger.yml', 'utf8'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
});

app.post('/posts', async (req, res) => {
  const {
    title, content, result, winnerImageUrl
  } = req.body;
  try {
    if (!title || !content || !result || !winnerImageUrl) {
      return res.status(400).json({ error: 'Se requieren todos los campos (title, content, result, winnerImageUrl)' });
    }
    const postId = await createPost(title, content, result, winnerImageUrl);
    res.status(201).json({ id: postId, message: 'Post creado correctamente' });
  } catch (error) {
    console.error('Error al crear el post:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.get('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await getPostById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' });
      return;
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el post' });
  }
});


app.put('/posts/:postId', async (req, res) => {
  const postId = req.params.postId;
  const {
    title, content, result, winnerImageUrl} = req.body;
  try {
    if (!title || !content || !result || !winnerImageUrl) {
      return res.status(400).json({ error: 'Se requieren todos los campos (title, content, result, winnerImageUrl)' });
    }
    await updatePostById(postId, title, content, result, winnerImageUrl);
    res.status(200).json({ message: 'Post actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el post:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/posts/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    await deletePostById(postId);
    res.json({ message: 'Post eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el post' });
  }
});
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    res.status(400).json({ error: 'Formato de datos incorrecto en el cuerpo de la solicitud' });
  } else {
    next();
  }
});

app.all('/posts', (req, res) => {
  res.status(501).json({ error: 'Método no implementado para este endpoint' });
});

app.use('*', (req, res) => {
  res.status(400).json({ error: 'Ruta no encontrada' });
});


const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
