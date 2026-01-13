const API_URL = import.meta.env.VITE_API_URL;

interface VoteData {
    postId: number; // Обязательное поле
    userId?: number; // Необязательное поле
    status: number; // Статус голосования
    ip: string; // IP адрес
    created_at: string; // Дата голосования в строковом формате
}

// Получение всех функций
export const getFunctions = async (): Promise<any> => {
    try {
        const response = await fetch(`${API_URL}/functions`);
        if (!response.ok) {
            throw new Error('Ошибка при получении функций');
        }
        const data = await response.json();
        console.log('Полученные данные функций:', data);
        return data;
    } catch (error) {
        console.error('Ошибка при получении функций:', error);
        throw error;
    }
};

// Голосование за пост
export const voteForPost = async (voteData: VoteData): Promise<any> => {
    try {
        console.log('Данные для отправки на сервер:', voteData);
        const response = await fetch(`${API_URL}/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(voteData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Ошибка сети: ${errorData.message || 'Неизвестная ошибка'}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Ошибка при голосовании:', error);
        throw error;
    }
};

// Получение всех голосов
export const fetchVotesData = async (): Promise<any[]> => {
    try {
        const response = await fetch(`${API_URL}/votes`);
        if (!response.ok) {
            throw new Error('Ошибка при получении данных голосования');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка при получении данных голосования:', error);
        return [];
    }
};