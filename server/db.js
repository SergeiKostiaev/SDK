// db.js
const mysql = require('mysql2');


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 't1',
  port: 3306,
});

pool.execute('SELECT 1 + 1 AS result', (err, results) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
  } else {
    console.log('Подключение к базе данных успешно:', results);
  }
});

module.exports = pool.promise();
