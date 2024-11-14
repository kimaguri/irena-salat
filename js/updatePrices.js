// Конфигурация
const SHEET_ID = '1SvbaAkGzPWs-s6OmCCdwiBhXDoETJd0GS3pJGMdTXRc';
const API_KEY = 'AIzaSyDxVeX5tNyuVqF_RBAHvA_B3TuwBE7HVOU';
const RANGE = 'A2:D100'; // Диапазон ячеек с данными

// Функция создания лоадера
function showLoader() {
    const contentContainer = document.getElementById('price-content');
    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="loader-container">
                <div class="loader"></div>
                <div class="loader-text">Загрузка данных...</div>
            </div>
        `;
    }
}

// Функция получения данных из Google Sheets
// Функция получения данных из Google Sheets
async function fetchPriceData() {
    try {
        // Показываем лоадер до начала загрузки
        showLoader();

        // Добавляем искусственную задержку в 1 секунду для демонстрации лоадера
        // await new Promise(resolve => setTimeout(resolve, 1000));

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

        // Добавляем еще задержку после получения данных
        // await new Promise(resolve => setTimeout(resolve, 500));

        return processData(data.values);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
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
        // Проверяем, что строка содержит все необходимые данные
        if (!row[0] || !row[1]) return; // Пропускаем строки без категории или названия

        const category = row[0].trim(); // Убираем лишние пробелы
        const item = {
            name: row[1].trim(),
            wholesale: row[2] ? row[2].trim() : '-',
            retail: row[3] ? row[3].trim() : '-'
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
    if (!items.length) return ''; // Не создаем пустые категории

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
    if (!contentContainer) {
        console.error('Контейнер для цен не найден');
        return;
    }

    if (Object.keys(categories).length === 0) {
        contentContainer.innerHTML = `
            <div class="loader-container">
                <div style="text-align: center; color: #666;">
                    Нет данных для отображения
                </div>
            </div>
        `;
        return;
    }

    const categoriesHTML = Object.entries(categories)
        .map(([category, items]) => createCategoryHTML(category, items))
        .join('');

    contentContainer.innerHTML = categoriesHTML;
}

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Показываем лоадер сразу при загрузке страницы
    showLoader();

    // Небольшая задержка перед запросом данных
    // await new Promise(resolve => setTimeout(resolve, 500));

    const data = await fetchPriceData();
    if (data) {
        updatePriceList(data);
    }
});