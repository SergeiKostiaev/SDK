import React from 'react';
import VoteWidget from "../Components/VoteWidget";
import style from '../Pages/Home.module.sass';

const Home = () => {
    return (
        <>
            <header className={style.header}>
                <div className={style.header_wrap}>
                    <div>
                        <h1>Test Tech</h1>
                    </div>
                    <nav>
                        <ul className={style.nav}>
                            <li>О нас</li>
                            <li>Каталог</li>
                            <li>Проекты</li>
                            <li>Контакты</li>
                        </ul>
                    </nav>
                    <div className={style.tel}>
                        <a href="tel:+1111111111">+7(111)222-22-22</a>
                    </div>
                </div>
            </header>
            <main className={style.main}>
                <div className={style.main_content}>
                    <section id="hero">
                        <h1>Welcome to Our Website</h1>
                        <p>Your gateway to the best services and products. Discover more below!</p>
                        <a href="#about" class="btn-primary">Learn More</a>
                    </section>
                    <section id={style.nature_gallery}>
                        <h2>Discover the Beauty of Nature</h2>
                        <div className={style.gallery}>
                            <div className={style.gallery_item}>
                                <img src="https://img.freepik.com/free-photo/forest-landscape_71767-127.jpg" alt="Random Nature Image 1"/>
                            </div>
                            <div className={style.gallery_item}>
                                <img src="https://fotorelax.ru/wp-content/uploads/2020/09/The-splendor-of-nature-in-landscape-photos-01-min.jpg" alt="Random Nature Image 2"/>
                            </div>
                            <div className={style.gallery_item}>
                                <img src="https://www.classicgallery.ru/images/uploaded/robin_halioua.jpg" alt="Random Nature Image 3"/>
                            </div>
                            <div class={style.gallery_item}>
                                <img src="https://parksideresort.com/wp-content/uploads/Top-Five-Ways-to-Celebrate-Memorial-Day-Near-the-Great-Smoky-Mountains-Featured.jpeg" alt="Random Nature Image 4"/>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <VoteWidget/>
        </>
    );
};


export default Home;