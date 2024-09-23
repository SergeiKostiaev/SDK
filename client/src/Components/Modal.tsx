import React from 'react';
import { useState, useEffect } from 'react';
import {fetchVotesData, getFunctions, voteForPost} from '../api/posts';
import styles from './Modal.module.sass';
import CsvDownload from "../csv/CsvDownload";

interface Feature {
    id: number;
    title: string;
    description: string;
    id_functions: number;
}

interface Category {
    id: number;
    title: string;
}

interface ModalProps {
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ onClose }) => {
    const [step, setStep] = useState<number>(1);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [features, setFeatures] = useState<Feature[]>([]);
    const [emailError, setEmailError] = useState<string>('');
    const [votedFunctions, setVotedFunctions] = useState<Set<number>>(new Set());
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    // const [newCategoryTitle, setNewCategoryTitle] = useState<string>('');

    useEffect(() => {
        if (email) {
            const checkAdminStatus = () => {
                setIsAdmin(email === 'admin@admin.ru');
            };

            checkAdminStatus();
        }
    }, [email]);


    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getFunctions();
                setCategories(data);
            } catch (error) {
                console.error('Ошибка при загрузке категорий:', error);
            }
        };

        fetchCategories();
    }, []);

    // Загрузка всех фич
    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                const response = await fetch('http://31.172.64.158:3000/api/features');
                if (!response.ok) {
                    throw new Error('Ошибка при загрузке фич');
                }
                const data = await response.json();
                setFeatures(data);
            } catch (error) {
                console.error('Ошибка при загрузке фич:', error);
            }
        };

        fetchFeatures();
    }, []);

    // Загрузка из localStorage
    useEffect(() => {
        const votedFunctionsFromStorage = Object.keys(localStorage)
            .filter(key => key.startsWith('voted_'))
            .map(key => parseInt(key.split('_')[1]));
        setVotedFunctions(new Set(votedFunctionsFromStorage));
    }, []);


    // Фильтрация фич по категории
    const filteredFeatures = features.filter(feature => feature.id_functions === selectedCategory?.id);

    const goToNextStep = () => setStep(step + 1);

    const goToPreviousStep = () => setStep(step - 1);


    const getFeatureDetails = async (featureId: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/features/${featureId}`);
            if (!response.ok) {
                const text = await response.text(); // Получаем текст ответа для отладки
                console.error('Ошибка при получении данных фичи:', text); // Выводим текст
                throw new Error('Ошибка при получении данных фичи');
            }
            return await response.json(); // Возвращаем данные фичи, включая id_vote
        } catch (error) {
            console.error('Ошибка при получении данных фичи:', error);
            return null;
        }
    };

    const handleVote = async (feature: FeatureType, rating: number) => {
        try {
            const userId = 2; // Замените на динамический userId
            const response = await fetch('https://api.ipify.org?format=json');
            const { ip } = await response.json();

            // Проверяем, голосовал ли уже пользователь
            if (votedFunctions.has(feature.id)) {
                console.log('Вы уже голосовали за эту функцию');
                return;
            }

            // Получаем id_vote для выбранной функции
            let featureDetails = await getFeatureDetails(feature.id);

            if (!featureDetails) {
                console.error('Не удалось получить данные фичи');
                return;
            }

            // Если id_vote еще не установлен, используем id фичи
            if (!featureDetails.id_vote) {
                featureDetails.id_vote = feature.id;
            }

            const voteData = {
                postId: featureDetails.id_functions, // Добавляем postId
                userId: userId, // Можно передать userId или оставить undefined
                status: rating,
                ip,
                created_at: new Date().toISOString(), // Форматируем дату в строку
            };

            console.log('Отправляемые данные голосования:', voteData);

            const result = await voteForPost(voteData);

            if (result) {
                console.log('Голос успешно отправлен');
                localStorage.setItem(`voted_${feature.id}`, 'true');
                setVotedFunctions((prev) => new Set(prev).add(feature.id));
            } else {
                throw new Error('Ошибка при голосовании');
            }
        } catch (error) {
            console.error('Ошибка при голосовании:', error);
        }
    };


    // Обновляем логику валидации
    const isFormValid = () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return name.trim().length >= 2 && emailPattern.test(email);
    };

// Функция для обработки изменения имени
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);

// Функция для обработки изменения email
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const emailValue = e.target.value;
        setEmail(emailValue);

        // Проверка правильности введенного email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailError(emailPattern.test(emailValue) ? '' : 'Указан неверный Емейл');
    };

    // const isFormValid = () => name.trim() !== '' && emailError === '';

    const getSmileyIcon = (rating: number) => {
        const smileys: Record<number, string> = {
            1: '😡', // Очень не доволен
            2: '🙁', // Не доволен
            3: '😐', // Нейтрально
            4: '🙂', // Доволен
            5: '😃', // Очень доволен
        };
        return smileys[rating] || '';
    };

    const handleDownload = async (functionId: number) => {
        // Проверка, является ли пользователь администратором
        if (!isAdmin) {
            console.error('Только администраторы могут загружать данные.');
            return;
        }

        try {
            const votesData = await fetchVotesData();

            if (!votesData || votesData.length === 0) {
                console.error('Нет данных для экспорта');
                return;
            }

            // Фильтруем данные по id_functions
            const filteredVotes: VoteType[] = votesData.filter((vote: VoteType) => vote.id_functions === functionId);

            if (filteredVotes.length === 0) {
                console.error('Нет голосов для данной функции');
                return;
            }

            // Создаем CSV строку
            const csvRows:string[] = [];

            // Обрабатываем каждую запись для создания таблицы
            filteredVotes.forEach(row => {
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
            link.setAttribute("download", `votes_data_function_${functionId}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
        }
    };

    const [votesData, setVotesData] = useState([]);

    type VoteType = {
        id: number;
        id_functions: number;
        id_user: number;
        id_vote: number;
        status: number;
        ip: string;
        created_at: string;
    };

    useEffect(() => {
        const fetchVotesData = async () => {
            const response = await fetch('http://31.172.64.158:3000/api/votes'); // ваш API
            const data = await response.json();
            setVotesData(data);
        };
        fetchVotesData();
    }, []);

    type FeatureType = {
        id: number;
        title: string;
        description: string;
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {isAdmin && (
                    <div className={styles.adminNav}>
                        <a className={styles.dashboardButton} onClick={() => setStep(4)}>
                            <img src="./dashboard.png" alt="dashboard"/>
                        </a>
                        <CsvDownload />
                    </div>
                )}
                <span className={styles.closeIcon} onClick={onClose}>
                    <img src="/close.svg" alt="Закрыть" />
                </span>

                {step === 1 && (
                    <>
                        <h2 className={styles.welc_title}>Голосование</h2>
                        <p className={styles.welc_about}>Выберите функционал для голосования</p>
                        <div className={styles.functionList}>
                            {categories.length > 0 ? (
                                categories.map((category) => (
                                    <div
                                        key={category.id}
                                        className={`${styles.functionItem} ${selectedCategory?.id === category.id ? styles.selectedItem : ''}`}
                                        onClick={() => setSelectedCategory(category)}
                                    >
                                        <p>{category.title}</p>
                                        {isAdmin && (
                                        <a
                                            onClick={() => handleDownload(category.id)}
                                            className={styles.downloadButton}
                                            title={!isAdmin ? 'Только администраторы могут загружать данные.' : ''}
                                        >
                                            <img src="./doc.png" alt="doc"/>
                                        </a>
                                            )}
                                    </div>
                                ))
                            ) : (
                                <p>Нет доступных категорий для голосования.</p>
                            )}
                        </div>

                        {selectedCategory && (
                            <div className={styles.nextButtonContainer}>
                                <button className={styles.nextButton} onClick={goToNextStep}>
                                    Далее
                                </button>
                            </div>
                        )}
                    </>
                )}

                {step === 2 && selectedCategory && (
                    <>
                        <h2 className={styles.welc_title}>Голосование за: {selectedCategory.title}</h2>
                        <p className={styles.welc_about}>Оставьте свой голос за понравившуюся вам функцию</p>
                        <div className={styles.featureList}>
                            {filteredFeatures.length > 0 ? (
                                <>
                                    {filteredFeatures
                                        .filter(feature => !votedFunctions.has(feature.id)) // Непроголосованные функции
                                        .map(feature => (
                                            <div key={feature.id} className={styles.featureItem}>
                                                <div className={styles.about_feature}>
                                                    <p>{feature.title}</p>
                                                    <p className={styles.about_title}>{feature.description}</p>
                                                </div>
                                                <div className={styles.smileyContainer}>
                                                    <div className={styles.smileyWrapper}>
                                                        {[1, 2, 3, 4, 5].map(rating => (
                                                            <span
                                                                key={rating}
                                                                className={`${styles.smiley} ${styles.clickable}`}
                                                                onClick={() => handleVote(feature, rating)}
                                                            >
                                {getSmileyIcon(rating)}
                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {filteredFeatures
                                        .filter(feature => votedFunctions.has(feature.id)) // Проголосованные функции
                                        .map(feature => (
                                            <div key={feature.id} className={`${styles.featureItem} ${styles.disabled}`}>
                                                <div className={styles.about_feature}>
                                                    <p>{feature.title}</p>
                                                    <p className={styles.about_title}>{feature.description}</p>
                                                </div>
                                                <div className={styles.voteMessage}>
                                                    <p>Ваш голос отправлен!</p> {/* Сообщение вместо смайлов */}
                                                </div>
                                            </div>
                                        ))}
                                </>
                            ) : (
                                <p>Нет доступных функций для голосования.</p>
                            )}
                        </div>
                        <div className={styles.buttonContainer}>
                            <button className={styles.prevButton} onClick={goToPreviousStep}>
                                Назад
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Modal;
