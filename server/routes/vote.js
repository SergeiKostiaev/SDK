const express = require('express');
const router = express.Router();
const db = require('../db');

// Получение всех вариантов голосования
router.get('/api/vote', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vote');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Ошибка базы данных' });
    }
});


// Принятие голоса
// router.post('/', async (req, res) => {
//     const { id_functions, id_user, ip, id_vote } = req.body;
//
//     if (!id_functions || !id_user || !ip || !id_vote) {
//         return res.status(400).json({ error: 'Все поля должны быть заполнены' });
//     }
//
//     try {
//         const [result] = await db.query(
//             'INSERT INTO votes (id_functions, id_user, ip, id_vote) VALUES (?, ?, ?, ?)',
//             [id_functions, id_user, ip, id_vote]
//         );
//         res.status(201).json({ message: 'Голос успешно записан', voteId: result.insertId });
//     } catch (error) {
//         console.error('Ошибка записи голоса:', error);
//         res.status(500).json({ error: 'Ошибка при записи голоса' });
//     }
// });

module.exports = router;
