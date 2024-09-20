import React from "react";
import { getFunctions, voteForPost } from '../../api/posts.js';

const CsvDownload = () => {
  const handleDownload = () => {
    // Данные для CSV файла
    const data = [
      { name: "John Doe", age: 28, email: "john@example.com" },
      { name: "Jane Doe", age: 24, email: "jane@example.com" },
      { name: "Sam Smith", age: 30, email: "sam@example.com" }
    ];

    // Создаем CSV строку вручную
    const headers = ["Name", "Age", "Email"];
    const csvRows = [
      headers.join(","),
      ...data.map(row => [row.name, row.age, row.email].join(","))
    ];

    const csvContent = csvRows.join("\n");

    // Создаем Blob для скачивания
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    // Создаем ссылку для скачивания
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <button onClick={handleDownload}>Download CSV</button>
    </div>
  );
};

export default CsvDownload;