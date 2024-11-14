// Конфигурация
const SHEET_ID = '1SvbaAkGzPWs-s6OmCCdwiBhXDoETJd0GS3pJGMdTXRc';
const API_KEY = 'AIzaSyDxVeX5tNyuVqF_RBAHvA_B3TuwBE7HVOU';
const RANGE = 'A2:D100'; // Диапазон ячеек с данными
const MINIMUM_LOADING_TIME = 2000; // Минимальное время показа лоадера в миллисекундах

// Функция создания лоадера
function showLoader() {
    const contentContainer = document.getElementById('price-content');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="loader-container">
                <div class="loader"></div>
                <div class="loader-text">Загрузка актуальных цен...</div>
            </div>
        `;
    }
}

// Функция задержки
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Функция получения данных из Google Sheets
async function fetchPriceData() {
    try {
        // Показываем лоадер и запоминаем время начала загрузки
        showLoader();
        const startTime = Date.now();

        // Запрашиваем данные
        const response = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.values || !Array.isArray(data.values)) {
            throw new Error('Неверный формат данных');
        }

        // Вычисляем, сколько времени прошло
        const elapsedTime = Date.now() - startTime;

        // Если прошло меньше минимального времени, добавляем задержку
        if (elapsedTime < MINIMUM_LOADING_TIME) {
            await delay(MINIMUM_LOADING_TIME - elapsedTime);
        }

        return processData(data.values);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        // Добавляем задержку и для показа ошибки
        await delay(MINIMUM_LOADING_TIME);

        const contentContainer = document.getElementById('price-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="loader-container" style="color: #dc3545;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.2rem; margin-bottom: 10px;">Ошибка загрузки данных</div>
                        <button onclick="location.reload()" 
                                style="padding: 8px 16px; 
                                       background-color: #4CAF50; 
                                       color: white; 
                                       border: none; 
                                       border-radius: 4px; 
                                       cursor: pointer;">
                            Обновить страницу
                        </button>
                    </div>
                </div>
            `;
        }
        return null;
    }
}

// Обработка данных и группировка по категориям
function processData(rows) {
    const categories = {};

    rows.forEach(row => {
        if (!row[0]) return;

        const category = row[0];
        const item = {
            name: row[1],
            wholesale: row[2] || '-',
            retail: row[3] || '-'
        };

        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(item);
    });

    return categories;
}

// Создание HTML для категории
function createCategoryHTML(categoryName, items) {
    return `
    <div class="category">
        <h2 class="category-title">${categoryName}</h2>
        <div class="price-header">
            <span class="header-name">Наименование</span>
            <span class="header-wholesale">Опт</span>
            <span class="header-retail">Розница</span>
        </div>
        ${items.map(item => `
            <div class="price-item">
                <span class="item-name">${item.name}</span>
                <span class="price-wholesale">${item.wholesale}${item.wholesale !== '-' ? ' ₽/кг' : ''}</span>
                <span class="price-retail">${item.retail}${item.retail !== '-' ? ' ₽/кг' : ''}</span>
            </div>
        `).join('')}
    </div>
    `;
}

// Обновление контента на странице
function updatePriceList(categories) {
    const contentContainer = document.getElementById('price-content');
    if (!contentContainer) return;

    const categoriesHTML = Object.entries(categories)
        .map(([category, items]) => createCategoryHTML(category, items))
        .join('');

    contentContainer.innerHTML = categoriesHTML;
}

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchPriceData();
    if (data) {
        updatePriceList(data);
    }
});