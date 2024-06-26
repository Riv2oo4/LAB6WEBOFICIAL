import pool from './conn.js';
import CryptoJS from 'crypto-js';

export async function getAllPosts() {
  const [rows] = await pool.query('SELECT * FROM blog_posts');
  return rows;
}
export async function getAllusers() {
  const [rows] = await pool.query('SELECT * FROM users');
  return rows;
}

export async function createPost(title, content, result, winnerImageUrl) {
  try {
    const [resultado] = await pool.query(
      'INSERT INTO blog_posts (title, content, result, winner_image_url) VALUES (?, ?, ?, ?)',
      [title, content, result, winnerImageUrl]
    )
    return resultado.insertId
  } catch (error) {
    console.error('Error al crear el post:', error)
    throw error
  }
}

export function hashPassword(contrasenia) {
  return CryptoJS.SHA256(contrasenia).toString();
}

export function comparePasswords(plainContrasenia, hashedPassword) {
  const hashedPlainPassword = hashPassword(plainContrasenia);
  return hashedPlainPassword === hashedPassword;
}


export async function deletePostById(postId) {
  const conn = await pool.getConnection()
  try {
    await conn.query('DELETE FROM blog_posts WHERE id = ?', [postId])
  } catch (error) {
    console.error('Error al borrar el post:', error)
    throw error
  } finally {
    conn.release()
  }
}

export async function getPostById(id) {
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query('SELECT * FROM blog_posts WHERE id = ?', [id])
    return rows[0]
  } catch (error) {
    console.error('Error al obtener el post:', error)
    throw error
  } finally {
    conn.release()
  }
}

export async function updatePostById(postId, title, content, result, winnerImageUrl) {
  const conn = await pool.getConnection()
  try {
    await conn.query(
      'UPDATE blog_posts SET title = ?, content = ?, result = ?, winner_image_url = ? WHERE id = ?',
      [title, content, result, winnerImageUrl, postId]
    )
  } catch (error) {
    console.error('Error al actualizar el post:', error)
    throw error
  } finally {
    conn.release()
  }
}

export async function createUser(username, contrasenia) {
  try {
    const [resultado] = await pool.query(
      'INSERT INTO users (username,contrasenia) VALUES (?, ?)',
      [username, contrasenia]
    )
    return resultado.insertId
  } catch (error) {
    console.error('Error al crear el post:', error)
    throw error
  }
}
export async function getUserByUsername(username) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  } catch (error) {
    console.error('Error al obtener el usuario por nombre de usuario:', error);
    throw error;
  }
}

