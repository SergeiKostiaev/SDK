import { useState, useEffect } from 'react';
import { getFunctions, voteForPost, checkIfAdmin, handleDeleteCategory, handleAddCategory } from '../../api/posts.js';
import styles from './Modal.module.sass';

const Modal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [features, setFeatures] = useState([]);
    const [emailError, setEmailError] = useState('');
    const [votedFunctions, setVotedFunctions] = useState(new Set());
    const [isAdmin, setIsAdmin] = useState(false);

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

    // Проверка на администратора при изменении email
    useEffect(() => {
        if (email) {
            const checkAdminStatus = async () => {
                try {
                    const isAdminUser = await checkIfAdmin(email);
                    setIsAdmin(isAdminUser);
                } catch (error) {
                    console.error('Ошибка при проверке статуса администратора:', error);
                }
            };

            checkAdminStatus();
        }
    }, [email]);

    // Фильтрация фич по категории
    const filteredFeatures = features.filter(feature => feature.id_functions === selectedCategory?.id);

    const goToNextStep = () => setStep(step + 1);

    const goToPreviousStep = () => setStep(step - 1);

    const handleVote = async (feature, rating) => {
        try {
            const userId = 2; // Замените на динамический userId
            const response = await fetch('https://api.ipify.org?format=json');
            const { ip } = await response.json();

            // Проверяем, голосовал ли уже пользователь
            if (votedFunctions.has(feature.id)) {
                console.log('Вы уже голосовали за эту функцию');
                return;
            }

            const voteData = {
                id_functions: feature.id,
                id_user: userId,
                status: rating,
                id_vote: 2,
                ip,
                created_at: new Date()
            };

            console.log('Отправляемые данные голосования:', voteData);

            const result = await voteForPost(voteData);

            if (result) {
                console.log('Голос успешно отправлен');
                localStorage.setItem(`voted_${feature.id}`, 'true');
                setVotedFunctions(prev => new Set(prev).add(feature.id));
            } else {
                throw new Error('Ошибка при голосовании');
            }
        } catch (error) {
            console.error('Ошибка при голосовании:', error);
        }
    };

    const handleNameChange = (e) => setName(e.target.value);

    const handleEmailChange = (e) => {
        const emailValue = e.target.value;
        setEmail(emailValue);

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setEmailError(emailPattern.test(emailValue) ? '' : 'Указан неверный Емейл');
    };

    const isFormValid = () => name.trim() !== '' && emailError === '';

    const getSmileyIcon = (rating) => {
        const smileys = {
            1: '😡', // Очень не доволен
            2: '🙁', // Не доволен
            3: '😐', // Нейтрально
            4: '🙂', // Доволен
            5: '😃', // Очень доволен
        };
        return smileys[rating] || '';
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <span className={styles.closeIcon} onClick={onClose}>
                    <img src="/close.svg" alt="Закрыть" />
                </span>

                {step === 1 && (
                    <>
                        <h2 className={styles.welc_title}>Голосование</h2>
                        <p className={styles.welc_about}>Введите свое имя и E-mail</p>
                        <div className={styles.formGroupInpt}>
                            <div className={styles.formGroup}>
                                <label>Имя</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                    placeholder="Иван"
                                    className={styles.inpt_name}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    placeholder="Введите ваш email"
                                    className={styles.inpt_name}
                                />
                                {emailError && <p className={`${styles.error} ${styles.show}`}>{emailError}</p>}
                            </div>
                        </div>

                        {isFormValid() && (
                            <div className={styles.nextButtonContainer}>
                                <button className={styles.nextButton} onClick={goToNextStep}>
                                    Далее
                                </button>
                            </div>
                        )}
                    </>
                )}

                {step === 2 && (
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
                                        {isAdmin && ( // Если админ
                                            <button
                                                className={styles.deleteButton}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Предотвращаем выбор категории при клике
                                                    handleDeleteCategory(category.id);
                                                }}
                                            >
                                                <img src="./close.png" alt="close"/>
                                            </button>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p>Нет доступных категорий для голосования.</p>
                            )}
                        </div>

                        {isAdmin && ( // Если админ
                            <div className={styles.functionsInpt}>
                                <input
                                    type="text"
                                    placeholder="Добавить новый функционал"
                                    value={newCategoryTitle}
                                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                                />
                                <button onClick={handleAddCategory}>Добавить</button>
                            </div>
                        )}

                        {selectedCategory && (
                            <div className={styles.nextButtonContainer}>
                                <button className={styles.nextButton} onClick={goToNextStep}>
                                    Далее
                                </button>
                                <button className={styles.prevButton} onClick={goToPreviousStep} disabled={step === 1}>
                                    Назад
                                </button>
                            </div>
                        )}
                    </>
                )}


                {step === 3 && selectedCategory && (
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
                                                <div className={styles.smileyContainer}>
                                                    <div className={styles.smileyWrapper}>
                                                        {[1, 2, 3, 4, 5].map(rating => (
                                                            <span key={rating} className={`${styles.smiley} ${styles.disabled}`}>
                                                {getSmileyIcon(rating)}
                                            </span>
                                                        ))}
                                                    </div>
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
