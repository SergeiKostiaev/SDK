const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const functionsRouter = require('./routes/functions');
const featuresRouter = require('./routes/features');
const voteRouter = require('./routes/vote');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(bodyParser.json());

app.use('/api/functions', functionsRouter);
app.use('/api/features', featuresRouter);
app.use('/api/votes', voteRouter);

// Получение всех постов (GET /api/posts)
app.get('/api/posts', async (req, res) => {
  try {
    const [posts] = await db.query('SELECT * FROM posts');
    console.log('Полученные посты:', posts);  // Добавьте этот вывод для отладки
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
    // Получаем функцию
    const [functionRows] = await db.query('SELECT * FROM functions WHERE id = ?', [postId]);
    if (functionRows.length === 0) {
      return res.status(404).json({ message: 'Функция не найдена' });
    }

    const func = functionRows[0];

    // Получаем фичи для этой функции
    const [featureRows] = await db.query('SELECT * FROM features WHERE id_functions = ?', [postId]);

    // Добавляем фичи к функции
    func.features = featureRows;

    res.json(func);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка базы данных' });
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

  // Проверяем, что email был передан
  if (!email) {
    return res.status(400).json({ error: 'Email обязателен' });
  }

  // console.log('Полученные данные:', req.body); // Для отладки

  // SQL-запрос для проверки наличия email
  const query = 'SELECT email, role FROM users WHERE email = ? LIMIT 1'; // Получаем email и роль по переданному email

  db.query(query, [email], (error, results) => {
    if (error) {
      console.error('Ошибка выполнения SQL-запроса:', error);
      return res.status(500).json({ error: 'Ошибка сервера', details: error.message });
    }

    // Если результат найден, проверяем роль пользователя
    if (results.length > 0) {
      const user = results[0]; // Получаем информацию о пользователе

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

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
