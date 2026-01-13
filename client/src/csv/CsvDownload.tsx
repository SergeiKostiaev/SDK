import React from "react";
import { fetchVotesData } from '../api/posts';
import styles from '../Components/Modal.module.sass';

interface VoteRow {
  id: number;
  id_user: number;
  id_functions: number;
  id_vote: number;
  status: string;
  ip: string;
  created_at: string;
}

const CsvDownload: React.FC = () => {
  const handleDownload = async () => {
    try {
      // Получаем данные голосования из API
      const votesData: VoteRow[] = await fetchVotesData();

      if (!votesData || votesData.length === 0) {
        console.error('Нет данных для экспорта');
        return;
      }

      // Создаем CSV строку
      const csvRows: string[] = [];

      // Добавляем заголовки только один раз
      const headers = ["id", "id_user", "id_functions", "id_vote", "status", "ip", "created_at"];
      csvRows.push(headers.join(","));

      // Обрабатываем каждую запись для создания таблицы
      votesData.forEach(row => {
        const values = [
          row.id,
          row.id_user,
          row.id_functions,
          row.id_vote,
          row.status,
          row.ip,
          row.created_at
        ];
        csvRows.push(values.join(","));
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
          <img src="./doc.png" alt="Скачать" />
        </a>
      </div>
  );
};

export default CsvDownload;
