const express = require('express');
const router = express.Router();
const db = require('../db');  


router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});


router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Пользователя не существует' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка БД' });
  }
});


// router.post('/', async (req, res) => {
//   const { name, email } = req.body;
//   try {
//     const [result] = await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
//     res.status(201).json({ id: result.insertId, name, email });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Database error' });
//   }
// });


module.exports = router;