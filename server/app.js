const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const functionsRouter = require('./routes/functions');
const featuresRouter = require('./routes/features');
const voteRouter = require('./routes/vote');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://31.172.64.158:5174', //5173
  methods: 'GET,POST,PUT,DELETE', // Методы HTTP, которые разрешены
  credentials: true // Если нужно передавать cookies или авторизационные заголовки
}));

app.use(bodyParser.json());

app.use('/api/functions', functionsRouter);
app.use('/api/features', featuresRouter);
app.use('/api/votes', voteRouter);

// Получение всех постов (GET /api/posts)
app.get('/api/posts', async (req, res) => {
  try {
    const [posts] = await db.query('SELECT * FROM posts');
    console.log('Полученные посты:', posts);
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

    // Добавляем фичи к функции
    func.features = featureRows;

    res.json(func);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

app.get('/api/votes', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM votes');
    if (!results) {
      console.log('Нет результатов');
      return res.status(404).send('Нет данных');
    }
    res.json(results);
  } catch (error) {
    console.error('Ошибка получения данных голосования:', error);
    res.status(500).send('Ошибка сервера');
  }
});

app.get('/api/features/:id', async (req, res) => {
  const featureId = req.params.id;

  try {
    const feature = await db.query(`
            SELECT f.id, f.title, f.description, f.status, f.created_at, f.id_functions, v.id_vote
            FROM features f
            LEFT JOIN votes v ON f.id = v.id_functions
            WHERE f.id = ?
        `, [featureId]);

    if (feature.length === 0) {
      return res.status(404).json({ message: 'Фича не найдена' });
    }

    // Возвращаем данные о фиче и соответствующий id_vote
    res.json(feature[0]);
  } catch (error) {
    console.error('Ошибка при получении данных фичи:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Принятие голосов (POST /api/votes)
app.post('/api/votes', async (req, res) => {
  console.log('Тело запроса:', req.body);

  const { id_user, id_functions, id_vote, status, ip } = req.body;

  if (!id_user || !id_functions || !id_vote || !status || !ip) {
    return res.status(400).json({ error: 'Все поля должны быть заполнены' });
  }

  try {
    const [result] = await db.query(
        'INSERT INTO votes (id_user, id_functions, id_vote, status, ip) VALUES (?, ?, ?, ?, ?)',
        [id_user, id_functions, id_vote, status, ip] // Убедитесь, что все поля передаются правильно
    );

    res.status(201).json({ message: 'Голос успешно зарегистрирован', vote_id: result.insertId });
  } catch (error) {
    console.error('Ошибка базы данных:', error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});


// Маршрут для проверки email
app.post('/api/users/is-admin', (req, res) => {
  const { email } = req.body; // Получаем email из тела запроса

  if (!email) {
    return res.status(400).json({ error: 'Email обязателен' });
  }

  // console.log('Полученные данные:', req.body);

  // SQL-запрос для проверки наличия email
  const query = 'SELECT email, role FROM users WHERE email = ? LIMIT 1'; // Получаем email и роль по переданному email

  db.query(query, [email], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения SQL-запроса:', error);
      return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }

    // Если результат найден, проверяем роль пользователя
    if (results.length > 0) {
      const user = results[0];

      // Проверяем, если роль = 'admin', то пользователь является администратором
      const isAdmin = user.role === '3';

      return res.json({ isAdmin, message: 'Пользователь найден' });
    } else {
      // Если email не найден в базе данных
      return res.status(404).json({ error: 'Пользователь с таким email не найден' });
    }
  });
});

app.post('/api/categories', (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Название категории обязательно' });
  }

  const query = 'INSERT INTO categories (title) VALUES (?)';
  db.query(query, [title], (error, results) => {
    if (error) {
      console.error('Ошибка при добавлении категории:', error);
      return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
    res.status(201).json({ id: results.insertId, title });
  });
});

// DELETE запрос для удаления категории
app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM categories WHERE id = ?';
  db.query(query, [id], (error, results) => {
    if (error) {
      console.error('Ошибка при удалении категории:', error);
      return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }
    res.status(200).json({ message: 'Категория успешно удалена' });
  });
});


// Добавление нового поста (POST /api/posts) - только для админа
// TODO: Добавить проверку авторизации и роли администратора
app.post('/api/posts', async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const [result] = await db.query(
        'INSERT INTO functions (title, description, status) VALUES (?, ?, ?)',
        [title, description, status || 'pending']
    );
    res.status(201).json({ id: result.insertId, title, description, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

// Изменение поста (PATCH /api/posts/:id) - только для админа
// TODO: Добавить проверку авторизации и роли администратора
app.patch('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const { title, description, status } = req.body;
  try {
    const [result] = await db.query(
        'UPDATE functions SET title = ?, description = ?, status = ? WHERE id = ?',
        [title, description, status, postId]
    );
    if (result.affectedRows > 0) {
      res.json({ message: 'Пост обновлен' });
    } else {
      res.status(404).json({ message: 'Пост не найден' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

// Удаление поста (DELETE /api/posts/:id) - только для админа
// TODO: Добавить проверку авторизации и роли администратора
app.delete('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    const [result] = await db.query('DELETE FROM functions WHERE id = ?', [postId]);
    if (result.affectedRows > 0) {
      res.json({ message: 'Пост удален' });
    } else {
      res.status(404).json({ message: 'Пост не найден' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});


// Добавление нового варианта голосования (POST /api/vote)
app.post('/api/vote', async (req, res) => {
  const { id_functions, title } = req.body;

  // Проверяем, что все необходимые данные присутствуют
  if (!id_functions || !title) {
    return res.status(400).json({ message: 'Недостаточно данных для добавления варианта голосования' });
  }

  try {
    // Вставляем новый вариант голосования в таблицу vote
    const [result] = await db.query(
        'INSERT INTO vote (id_functions, title) VALUES (?, ?)',
        [id_functions, title]
    );

    // Отправляем успешный ответ клиенту
    res.status(201).json({ message: 'Вариант голосования успешно добавлен', vote_id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
  }
});

// Статические файлы из директории dist
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://31.172.64.158:${port}`);
});
