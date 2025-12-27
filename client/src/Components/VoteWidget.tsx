import {useEffect, useState} from 'react';
import Modal from './Modal';
import styles from './VoteWidget.module.sass';

const VoteWidget = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const openModal = () => {
        setIsModalOpen(true);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            openModal();
        }, 50000); // 50 сек

        // Чистим таймер при размонтировании компонента
        return () => clearTimeout(timer);
    }, []);

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className={styles.voteIcon} onClick={openModal} >
                <span>
                    <img src="../iconVote.png" alt="iconVote"/>
                </span>
            </div>
            {isModalOpen && <Modal onClose={closeModal} />}
        </div>
    );
};

export default VoteWidget;