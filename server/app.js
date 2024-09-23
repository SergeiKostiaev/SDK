const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const functionsRouter = require('./routes/functions');
const featuresRouter = require('./routes/features');
const voteRouter = require('./routes/vote');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
  origin: 'http://localhost:5173', // Разрешаем доступ только с этого адреса
}));

app.use(bodyParser.json());

// Подключаем маршруты
app.use('/api/functions', functionsRouter);
app.use('/api/features', featuresRouter);
app.use('/api/votes', voteRouter);

// Получение всех постов (GET /api/posts)
app.get('/api/posts', async (req, res) => {
  try {
    const [posts] = await db.query('SELECT * FROM posts');
    res.json(posts);
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

// Получение поста по ID (GET /api/posts/:id)
app.get('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    const [functionRows] = await db.query('SELECT * FROM functions WHERE id = ?', [postId]);
    if (functionRows.length === 0) {
      return res.status(404).json({ message: 'Функция не найдена' });
    }

    const func = functionRows[0];
    const [featureRows] = await db.query('SELECT * FROM features WHERE id_functions = ?', [postId]);
    func.features = featureRows;
    res.json(func);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

// Получение всех голосов
app.get('/api/votes', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM votes');
    if (results.length === 0) {
      return res.status(404).send('Нет данных');
    }
    res.json(results);
  } catch (error) {
    console.error('Ошибка получения данных голосования:', error);
    res.status(500).send('Ошибка сервера');
  }
});

// Добавление нового поста (POST /api/posts) - только для админа
app.post('/api/posts', async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const [result] = await db.query(
        'INSERT INTO functions (title, description, status) VALUES (?, ?, ?)',
        [title, description, status || 'pending']
    );
    res.status(201).json({ id: result.insertId, title, description, status });
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

// Другие маршруты...

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
