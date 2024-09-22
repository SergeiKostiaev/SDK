import React, { useState, useEffect } from 'react';
import styles from './Modal.module.sass';
import {fetchVotesData, getFunctions, voteForPost} from '../../api/posts';
import CsvDownload from "../../csv/CsvDownload";
import Cookies from 'js-cookie';

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
    const [votedFunctions, setVotedFunctions] = useState<Set<number>>(new Set());
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    // const [newCategoryTitle, setNewCategoryTitle] = useState<string>('');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        // Извлечение userId из cookies
        const userIdFromCookie:any = Cookies.get('userId');

        if (userIdFromCookie) {
            setUserId(userIdFromCookie);
        } else {
            console.log('User ID not found in cookies');
        }
    }, []);

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
                const response = await fetch('http://localhost:3000/api/features');
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


    const getFeatureDetails = async (featureId:any) => {
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

    const handleVote = async (feature:any, rating:any ) => {
        try {
            // const userId = Cookies.get('userId');
            //
            // if (!userId) {
            //     console.error('User ID не найден в cookies');
            //     return;
            // }
            const userId = 2;

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
                id_functions: feature.id,
                id_user: userId,
                status: rating,
                id_vote: featureDetails.id_vote, // Используем id_vote (или id фичи)
                ip,
                created_at: new Date()
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

    const handleDownload = async (functionId:any) => {
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
            const filteredVotes = votesData.filter((vote: { id_functions: any; }) => vote.id_functions === functionId);

            if (filteredVotes.length === 0) {
                console.error('Нет голосов для данной функции');
                return;
            }

            // Создаем CSV строку
            const csvRows:any = [];

            // Обрабатываем каждую запись для создания таблицы
            filteredVotes.forEach((row: { id: any; id_user: any; id_functions: any; id_vote: any; status: any; ip: any; created_at: any; }) => {
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

    useEffect(() => {
        const fetchVotesData = async () => {
            const response = await fetch('http://localhost:3000/api/votes'); // ваш API
            const data = await response.json();
            setVotesData(data);
        };
        fetchVotesData();
    }, []);


    class KanoModel extends React.Component<{ features: any, votesData: any }> {
        render() {
            let {features, votesData} = this.props;
            const totalVotes = votesData.length;

            const calculatePercentage = (featureId: any) => {
                const featureVotes = votesData.filter((vote: {
                    id_functions: any;
                }) => vote.id_functions === featureId).length;
                return totalVotes > 0 ? (featureVotes / totalVotes) * 100 : 0;
            };

            return (
                <div className={styles.kanoContainer}>
                    {features.map((feature: {
                        id: React.Key | null | undefined;
                        title: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined;
                    }) => {
                        const percentage = calculatePercentage(feature.id);
                        let barColor = '#007bff';
                        if (percentage > 75) {
                            barColor = '#0056b3';
                        } else if (percentage > 50) {
                            barColor = '#007bff';
                        } else if (percentage > 20) {
                            barColor = '#66b3ff';
                        } else {
                            barColor = '#e0e0e0';
                        }

                        return (
                            <div key={feature.id} className={styles.kanoItem}>
                                <div
                                    className={styles.kanoBar}
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: barColor
                                    }}
                                >
                            <span className={styles.kanoLabel}>
                                {feature.title} ({percentage.toFixed(2)}%)
                            </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
    }


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
                                <button className={styles.prevButton} onClick={goToPreviousStep}
                                        disabled={Number(step) === 1}>
                                    Назад
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

                {step === 3 && (
                    <>
                        <h2 className={styles.welc_title}>Dashboard</h2>
                        <p className={styles.welc_about}>В этом разделе вы можете увидеть аналитику</p>
                        <KanoModel features={features} votesData={votesData} />
                        <div className={styles.buttonContainer}>
                            <button className={styles.prevButton} onClick={() => setStep(1)}>
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
