import React from "react";
import { fetchVotesData } from '../api/posts';
import styles from '../src/Components/Modal.module.sass';

const CsvDownload = () => {
  const handleDownload = async () => {
    try {
      // Получаем данные голосования из API
      const votesData = await fetchVotesData();

      if (!votesData || votesData.length === 0) {
        console.error('Нет данных для экспорта');
        return;
      }

      // Создаем CSV строку
      interface VoteData {
        id: number;
        id_user: number;
        id_functions: number;
        id_vote: number;
        status: string;
        ip: string;
        created_at: Date;
      }

      const csvRows: string[] = [];

      // Обрабатываем каждую запись для создания таблицы
      votesData.forEach((row: VoteData) => {
        const headers = ["id", "id_user", "id_functions", "id_vote", "status", "ip", "created_at"];
        const values = [
          row.id,
          row.id_user,
          row.id_functions,
          row.id_vote,
          row.status,
          row.ip,
          row.created_at
        ];

        // Добавляем заголовки и значения в строки CSV
        headers.forEach((header, index) => {
          csvRows.push(`${header},${values[index]}`);
        });

        // Добавляем пустую строку между записями
        csvRows.push('');
      });

      const csvContent = csvRows.join("\n");

      // Создаем Blob для скачивания
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      // Создаем ссылку для скачивания
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "votes_data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    }
  };

  return (
      <div>
        <a onClick={handleDownload} className={styles.docs}>
          <img src="./doc.png" alt="doc"/>
        </a>
      </div>
  );
};

export default CsvDownload;
