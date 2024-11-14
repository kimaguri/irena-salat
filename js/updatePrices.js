// Конфигурация
const SHEET_ID = '1SvbaAkGzPWs-s6OmCCdwiBhXDoETJd0GS3pJGMdTXRc';
const API_KEY = 'AIzaSyDxVeX5tNyuVqF_RBAHvA_B3TuwBE7HVOU';
const RANGE = 'A2:D100'; // Диапазон ячеек с данными

// Функция получения данных из Google Sheets
async function fetchPriceData() {
    try {
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

        return processData(data.values);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        // Можно добавить отображение ошибки на странице
        document.getElementById('price-content').innerHTML =
            '<div class="error">Ошибка загрузки данных. Пожалуйста, обновите страницу.</div>';
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

    const categoriesHTML = Object.entries(categories)
        .map(([category, items]) => createCategoryHTML(category, items))
        .join('');

    contentContainer.innerHTML = categoriesHTML || '<div class="error">Нет данных для отображения</div>';
}

// Загрузка данных при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const data = await fetchPriceData();
    if (data) {
        updatePriceList(data);
    }
});