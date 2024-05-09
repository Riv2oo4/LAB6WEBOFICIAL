import express from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import {
  getAllPosts, createPost, getPostById, updatePostById, deletePostById,
  getAllusers,
  createUser,
  getUserByUsername,
  comparePasswords
} from '../db.js';
import cors from  'cors';
import CryptoJS from 'crypto-js';
import  jwt from 'jsonwebtoken';
import dotenv  from "dotenv";


const app = express();
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  const rutas = ['/users', '/log','/posts'];
  if (rutas.includes(req.path)) {
    next();
  } else {
    const token = req.headers.authorization;
    console.log(token);
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }
  
    // Separar el token del prefijo "Bearer"
    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }
  
    const tokenWithoutBearer = tokenParts[1];
    console.log(tokenWithoutBearer)
  
    try {
      const decoded = jwt.verify(tokenWithoutBearer, secretKey);
  
      // Verificar la fecha de expiración
      if (decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({ error: 'Token expirado' });
      }
  
      // Token válido, continuar con la solicitud
      req.user = decoded.user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
});

dotenv.config()
const  secretKey=process.env.JSONKEY
function createToken(user) {
  try{
    const token = jwt.sign({ user },secretKey ,{ expiresIn: '30m' });
    return token

  }
  catch(error){
    console.log(error)
  }
}
console.log(secretKey)

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


app.get('/users', async (req, res) => {
  try {
    const posts = await getAllusers();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los posts' });
  }
});

app.post('/users', async (req, res) => {
  const { username, contrasenia } = req.body;
  try {
    if (!username || !contrasenia) {
      return res.status(400).json({ error: 'Se requieren todos los campos (username, contrasenia)' });
    }

    const hashedPassword = CryptoJS.SHA256(contrasenia).toString();

    const userId = await createUser(username, hashedPassword);
    
    res.status(201).json({ id: userId, message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/log', async (req, res) => {
  const { username, contrasenia } = req.body;
  try {
    if (!username || !contrasenia) {
      return res.status(400).json({ error: 'Se requieren todos los campos (username, contrasenia)' });
    }
        const user = await getUserByUsername(username);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
      const passwordMatch = comparePasswords(contrasenia, user.contrasenia);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }else{
      const token = createToken(user);
      res.status(200).json({ token:token});
      
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
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






