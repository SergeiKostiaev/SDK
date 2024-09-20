const API_URL = 'http://localhost:3000/api/posts';


// Получение всех функций
export const getFunctions = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/functions');
        if (!response.ok) {
            throw new Error('Ошибка при получении функций');
        }
        const data = await response.json();
        console.log('Полученные данные функций:', data);
        return data;
    } catch (error) {
        console.error('Ошибка при получении функций:', error);
    }
};

// Голосование за пост
export const voteForPost = async (voteData) => {
    try {
        const response = await fetch('http://localhost:3000/api/votes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(voteData),
        });

        if (!response.ok) {
            throw new Error('Ошибка сети');
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при голосовании:', error);
        throw error;
    }
};

export const checkIfAdmin = async (email) => {
    try {
        const response = await fetch('http://localhost:3000/api/users/is-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            throw new Error('Ошибка при проверке администратора');
        }

        const data = await response.json();
        return data.isAdmin;  // Возвращаем результат проверки администратора
    } catch (error) {
        console.error('Ошибка проверки администратора:', error);
        return false;  // В случае ошибки возвращаем значение по умолчанию
    }
};

// Функция для добавления новой категории
export const handleAddCategory = async () => {
    if (!newCategoryTitle.trim()) return;
    try {
        const response = await fetch('http://localhost:3000/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title: newCategoryTitle }),
        });

        if (!response.ok) {
            throw new Error('Ошибка добавления категории');
        }

        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        setNewCategoryTitle(''); // Очистка поля
    } catch (error) {
        console.error('Ошибка добавления категории:', error);
    }
};

// Функция для удаления категории
export const handleDeleteCategory = async (categoryId) => {
    try {
        const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Ошибка удаления категории');
        }

        // Обновляем список категорий после удаления
        setCategories(categories.filter((category) => category.id !== categoryId));
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
    }
};

// Еще не подключено

// Получение всех постов
export const getPosts = async () => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Ошибка при получении постов');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};

export const getAllFeatures = async () => {
    const response = await fetch('/api/vote'); // Путь к API, который возвращает все функции
    if (!response.ok) {
        throw new Error('Ошибка при загрузке данных');
    }
    return response.json();
};

// Получение поста по ID
export const getPostById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            throw new Error('Ошибка при получении поста');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};

// Создание нового поста
export const createPost = async (post) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            throw new Error('Ошибка при создании поста');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};

// Изменение поста
export const updatePost = async (id, post) => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(post),
        });
        if (!response.ok) {
            throw new Error('Ошибка при обновлении поста');
        }
        return await response.json();
    } catch (error) {
        console.error(error);
    }
};






