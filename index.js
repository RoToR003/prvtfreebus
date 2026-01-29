// ============================================
// КОНСТАНТИ ТА НАЛАШТУВАННЯ
// ============================================

const CONFIG = {
    TICKET_DURATION: 60 * 60, // 60 хвилин у секундах
    TICKET_PRICE: 12.00,
    STORAGE_KEY: 'transport_tickets',
    SESSION_KEY: 'new_ticket_data',
    STORAGE_ENABLED_KEY: 'storage_enabled'
};

// ============================================
// ДОПОМІЖНІ ФУНКЦІЇ - ДАТА ТА ЧАС
// ============================================

/**
 * Отримати поточну дату та час у ISO форматі
 */
function getCurrentDateTime() {
    return new Date().toISOString();
}

/**
 * Форматувати дату у форматі DD.MM.YYYY
 */
function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Форматувати час у форматі HH:MM:SS
 */
function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Розрахувати скільки секунд пройшло від початкового часу
 */
function calculateElapsedTime(startTimeISO) {
    const startTime = new Date(startTimeISO);
    const currentTime = new Date();
    const elapsedMs = currentTime - startTime;
    return Math.floor(elapsedMs / 1000);
}

/**
 * Форматувати таймер у форматі MM:SS
 */
function formatTimer(seconds) {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const minStr = String(minutes).padStart(2, '0');
    const secStr = String(secs).padStart(2, '0');
    return `${minStr}:${secStr}`;
}

// ============================================
// ДОПОМІЖНІ ФУНКЦІЇ - ГЕНЕРАЦІЯ ДАНИХ
// ============================================

/**
 * Згенерувати унікальний серійний номер (9 цифр)
 */
function generateSerialNumber() {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
}

/**
 * Згенерувати масив серійних номерів залежно від кількості пасажирів
 */
function generateSerialNumbers(count) {
    const serials = [];
    for (let i = 0; i < count; i++) {
        serials.push(generateSerialNumber());
    }
    return serials;
}

/**
 * Форматувати серійні номери з переносом після кожних 2 номерів
 */
function formatSerialNumbers(serialsArray) {
    const parts = [];
    for (let i = 0; i < serialsArray.length; i += 2) {
        const pair = serialsArray.slice(i, i + 2);
        parts.push(pair.join(', '));
    }
    return parts.join(',<br>');
}

/**
 * Згенерувати рандомний баланс від 0.01 до 5000
 */
function generateRandomBalance() {
    const balance = Math.random() * 5000;
    return balance.toFixed(2);
}

/**
 * Згенерувати останні 4 цифри номера картки
 */
function generateCardLast4() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Згенерувати код IBAN (останні 4 цифри)
 */
function generateIbanLast4() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Згенерувати унікальний ID для квитка
 */
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ============================================
// РОБОТА З LOCALSTORAGE
// ============================================

/**
 * Завантажити всі квитки з LocalStorage
 */
function loadTickets() {
    try {
        const data = localStorage.getItem(CONFIG.STORAGE_KEY);
        const tickets = data ? JSON.parse(data) : [];
        
        // Міграція старих квитків до нового формату
        const migratedTickets = tickets.map(ticket => {
            if (!ticket.serialNumbers && ticket.serialNumber) {
                // Старий формат - конвертуємо в новий
                return {
                    ...ticket,
                    serialNumbers: [ticket.serialNumber],
                    passengers: ticket.passengers || 1
                };
            }
            return ticket;
        });
        
        // Якщо були міграції - зберегти оновлені дані
        if (JSON.stringify(tickets) !== JSON.stringify(migratedTickets)) {
            saveTickets(migratedTickets);
            return migratedTickets;
        }
        
        return tickets;
    } catch (error) {
        console.error('Помилка завантаження квитків:', error);
        return [];
    }
}

/**
 * Зберегти всі квитки в LocalStorage
 */
function saveTickets(tickets) {
    try {
        // Перевірити чи увімкнене локальне збереження
        if (!isStorageEnabled()) {
            console.log('Локальне збереження вимкнено');
            return false;
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tickets));
        return true;
    } catch (error) {
        console.error('Помилка збереження квитків:', error);
        return false;
    }
}

/**
 * Додати новий квиток
 */
function addTicket(ticketData) {
    const tickets = loadTickets();
    const serialNumbers = generateSerialNumbers(ticketData.passengers);
    
    const newTicket = {
        id: generateUniqueId(),
        serialNumbers: serialNumbers, // Масив серійних номерів
        transportNumber: ticketData.transportNumber,
        passengers: ticketData.passengers,
        purchaseTime: getCurrentDateTime(),
        duration: CONFIG.TICKET_DURATION,
        isExpired: false
    };
    tickets.unshift(newTicket); // Додаємо на початок масиву
    saveTickets(tickets);
    return newTicket;
}

/**
 * Оновити статус квитка (expired)
 */
function updateTicketStatus(ticketId, isExpired) {
    const tickets = loadTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.isExpired = isExpired;
        saveTickets(tickets);
    }
}

// ============================================
// ПЕРЕВІРКА СТАНУ КВИТКА
// ============================================

/**
 * Отримати залишковий час для квитка (в секундах)
 */
function getRemainingTime(ticket) {
    const elapsed = calculateElapsedTime(ticket.purchaseTime);
    const remaining = ticket.duration - elapsed;
    return remaining > 0 ? remaining : 0;
}

/**
 * Перевірити чи прострочений квиток
 */
function isTicketExpired(ticket) {
    return getRemainingTime(ticket) <= 0;
}

// ============================================
// ГЕНЕРАЦІЯ HTML КАРТКИ КВИТКА
// ============================================

/**
 * Створити HTML картку квитка
 */
function createTicketCard(ticket) {
    const isExpired = isTicketExpired(ticket);
    const expiredClass = isExpired ? 'expired' : '';
    const remainingTime = getRemainingTime(ticket);
    
    // Форматуємо серійні номери з перевіркою на старі квитки
    let serialNumbersFormatted;
    if (ticket.serialNumbers && Array.isArray(ticket.serialNumbers)) {
        // Новий формат - масив серійних номерів
        serialNumbersFormatted = formatSerialNumbers(ticket.serialNumbers);
    } else if (ticket.serialNumber) {
        // Старий формат - один серійний номер
        serialNumbersFormatted = ticket.serialNumber;
    } else {
        // Якщо немає серійних номерів взагалі
        serialNumbersFormatted = generateSerialNumber();
    }
    
    // Таймер тільки для активних квитків
    const timerHTML = !isExpired ? `
        <div class="timer" data-ticket-id="${ticket.id}" data-remaining="${remainingTime}">
            ${formatTimer(remainingTime)}
        </div>
    ` : '';

    return `
        <div class="card ${expiredClass}" data-ticket-id="${ticket.id}">
            <div class="card-header">
                <div class="logo-box">
                    <img src="https://i.ibb.co/9m9Gx8wS/Picsart-26-01-29-01-00-20-922.jpg" alt="Logo">
                </div>
                <div class="card-info">
                    <div class="city-name">Вінниця</div>
                    <div class="company-name">КП Вінницька транспортна<br>компанія</div>
                    <div class="serial-block">
                        <span class="serial-label">Серія</span>
                        <span class="serial-value">${serialNumbersFormatted}</span>
                    </div>
                </div>
                <div class="info-icon" onclick="openModal()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="11" stroke="#3b9dfc" stroke-width="2"/>
                        <path d="M12 11V17" stroke="#3b9dfc" stroke-width="2" stroke-linecap="round"/>
                        <circle cx="12" cy="7" r="1.5" fill="#3b9dfc"/>
                    </svg>
                </div>
            </div>

            <div class="main-visual">
                <img src="https://i.ibb.co/9mn9jMK6/Picsart-26-01-29-00-59-56-789.jpg" alt="Ticket Visual">
            </div>

            <div class="transport-number">№${ticket.transportNumber}</div>
            <div class="transport-type">Вагон</div>

            <div class="data-grid">
                <div class="data-item">
                    <div class="data-label">Дата</div>
                    <div class="data-value">${formatDate(ticket.purchaseTime)}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Час</div>
                    <div class="data-value">${formatTime(ticket.purchaseTime)}</div>
                </div>
                <div class="data-item">
                    <div class="data-label">Пасажири</div>
                    <div class="data-value">${ticket.passengers}</div>
                </div>
            </div>

            <div class="status-text">Квиток разового використання</div>
            
            ${timerHTML}
        </div>
    `;
}

// ============================================
// РОБОТА З ТАЙМЕРАМИ
// ============================================

let timerIntervals = [];

/**
 * Запустити таймер для квитка
 */
function startTimer(ticketId, timerElement, initialSeconds) {
    let remainingSeconds = initialSeconds;

    const interval = setInterval(() => {
        remainingSeconds--;

        if (remainingSeconds <= 0) {
            // Час вийшов
            clearInterval(interval);
            timerElement.textContent = '00:00';
            
            // Додати клас expired до картки
            const card = document.querySelector(`[data-ticket-id="${ticketId}"]`);
            if (card) {
                card.classList.add('expired');
            }
            
            // Оновити статус у LocalStorage
            updateTicketStatus(ticketId, true);
            
            // Видалити таймер
            timerElement.remove();
        } else {
            timerElement.textContent = formatTimer(remainingSeconds);
        }
    }, 1000);

    timerIntervals.push(interval);
}

/**
 * Зупинити всі таймери
 */
function stopAllTimers() {
    timerIntervals.forEach(interval => clearInterval(interval));
    timerIntervals = [];
}

/**
 * Ініціалізувати всі таймери на сторінці
 */
function initializeTimers() {
    try {
        stopAllTimers();
        
        const timerElements = document.querySelectorAll('.timer[data-ticket-id]');
        timerElements.forEach(timerEl => {
            const ticketId = timerEl.dataset.ticketId;
            const remaining = parseInt(timerEl.dataset.remaining);
            
            if (remaining > 0) {
                startTimer(ticketId, timerEl, remaining);
            }
        });
    } catch (error) {
        console.error('Помилка ініціалізації таймерів:', error);
    }
}

// ============================================
// ВІДОБРАЖЕННЯ КВИТКІВ НА СТОРІНЦІ
// ============================================

/**
 * Відобразити квитки на головній сторінці (index.html)
 */
function displayTicketsOnIndexPage() {
    try {
        const tickets = loadTickets();
        
        // Знайти контейнер перед футером
        const footerBtn = document.querySelector('.footer-btn-container');
        if (!footerBtn) return;
        
        // Видалити всі існуючі картки (крім статичних прострочених)
        const existingCards = document.querySelectorAll('.card[data-ticket-id]');
        existingCards.forEach(card => card.remove());
        
        // Відобразити всі квитки
        tickets.forEach(ticket => {
            const cardHTML = createTicketCard(ticket);
            footerBtn.insertAdjacentHTML('beforebegin', cardHTML);
        });
        
        // Ініціалізувати таймери
        initializeTimers();
    } catch (error) {
        console.error('Помилка відображення квитків:', error);
    }
}

// ============================================
// QR СТОРІНКА (qr.html)
// ============================================

/**
 * Ініціалізація QR сторінки
 */
function initQRPage() {
    // При кліку на будь-яку область екрану переходимо на оплату
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            // Якщо клік не на кнопку закриття
            if (!e.target.closest('.icon-btn')) {
                // Зберегти мітку про сканування
                sessionStorage.setItem('qr_scanned', 'true');
                // Перейти на сторінку оплати
                window.location.href = 'payment.html';
            }
        });
    }
}

// ============================================
// СТОРІНКА ОПЛАТИ (payment.html)
// ============================================

/**
 * Ініціалізація сторінки оплати
 */
function initPaymentPage() {
    try {
        const buyBtn = document.querySelector('.buy-btn');
        const transportInput = document.querySelector('.transport-input');
        const qtyInput = document.getElementById('qty-input');
        
        if (!buyBtn || !transportInput || !qtyInput) return;
        
        // Генерація рандомних даних картки
        generateRandomCardData();
        
        // Обробник кнопки "Купити"
        buyBtn.addEventListener('click', function() {
            const transportNumber = transportInput.value.trim();
            const passengers = parseInt(qtyInput.value);
            
            // Валідація
            if (!transportNumber) {
                alert('Будь ласка, введіть номер транспорту');
                transportInput.focus();
                return;
            }
            
            if (!passengers || passengers < 1) {
                alert('Кількість пасажирів має бути не менше 1');
                return;
            }
            
            // Створити та зберегти квиток
            const newTicket = addTicket({
                transportNumber: transportNumber,
                passengers: passengers
            });
            
            // Зберегти в session для відображення на головній сторінці
            sessionStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify(newTicket));
            
            // Очистити мітку сканування
            sessionStorage.removeItem('qr_scanned');
            
            // Перейти на головну сторінку
            window.location.href = 'index.html';
        });
        
        // Валідація вводу - тільки цифри
        transportInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    } catch (error) {
        console.error('Помилка ініціалізації payment page:', error);
    }
}

/**
 * Генерація рандомних даних картки на сторінці оплати
 */
function generateRandomCardData() {
    // Генеруємо дані
    const balance = generateRandomBalance();
    const cardLast4 = generateCardLast4();
    const ibanLast4 = generateIbanLast4();
    
    // Оновлюємо баланс
    const balanceEl = document.querySelector('.card-balance');
    if (balanceEl) {
        balanceEl.textContent = `${balance} UAH`;
    }
    
    // Оновлюємо номер картки
    const cardNumberEl = document.querySelector('.card-number');
    if (cardNumberEl) {
        cardNumberEl.textContent = `•••• ${cardLast4} | UA53 •••• ${ibanLast4}`;
    }
}

// ============================================
// ГОЛОВНА СТОРІНКА (index.html) - АРХІВ
// ============================================

/**
 * Ініціалізація головної сторінки
 */
function initIndexPage() {
    try {
        // Перевірити чи є новий квиток з оплати
        const newTicketData = sessionStorage.getItem(CONFIG.SESSION_KEY);
        if (newTicketData) {
            sessionStorage.removeItem(CONFIG.SESSION_KEY);
            // Просто перезавантажити квитки - новий вже збережений
        }
        
        // Відобразити всі квитки
        displayTicketsOnIndexPage();
    } catch (error) {
        console.error('Помилка ініціалізації index page:', error);
    }
}

// ============================================
// СТОРІНКА НАЛАШТУВАНЬ (settings.html)
// ============================================

/**
 * Перевірити чи увімкнене локальне збереження
 */
function isStorageEnabled() {
    const enabled = localStorage.getItem(CONFIG.STORAGE_ENABLED_KEY);
    return enabled === null || enabled === 'true'; // За замовчуванням увімкнено
}

/**
 * Отримати статистику поїздок
 */
function getTicketStatistics() {
    if (!isStorageEnabled()) {
        return {
            today: 0,
            week: 0,
            month: 0,
            total: 0,
            totalSpent: 0
        };
    }

    const tickets = loadTickets();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let totalSpent = 0;

    tickets.forEach(ticket => {
        const ticketDate = new Date(ticket.purchaseTime);
        const ticketCost = (ticket.passengers || 1) * CONFIG.TICKET_PRICE;
        
        totalSpent += ticketCost;

        if (ticketDate >= todayStart) {
            todayCount += ticket.passengers || 1;
        }
        if (ticketDate >= weekStart) {
            weekCount += ticket.passengers || 1;
        }
        if (ticketDate >= monthStart) {
            monthCount += ticket.passengers || 1;
        }
    });

    return {
        today: todayCount,
        week: weekCount,
        month: monthCount,
        total: tickets.reduce((sum, t) => sum + (t.passengers || 1), 0),
        totalSpent: totalSpent.toFixed(2)
    };
}

/**
 * Оновити відображення статистики
 */
function updateStatisticsDisplay() {
    const stats = getTicketStatistics();
    
    const todayEl = document.getElementById('stat-today');
    const weekEl = document.getElementById('stat-week');
    const monthEl = document.getElementById('stat-month');
    const totalEl = document.getElementById('stat-total');
    const spentEl = document.getElementById('total-spent');

    if (todayEl) todayEl.textContent = stats.today;
    if (weekEl) weekEl.textContent = stats.week;
    if (monthEl) monthEl.textContent = stats.month;
    if (totalEl) totalEl.textContent = stats.total;
    if (spentEl) spentEl.textContent = `${stats.totalSpent} UAH`;
}

/**
 * Перемкнути локальне збереження
 */
function toggleLocalStorage() {
    const toggle = document.getElementById('storage-toggle');
    const currentState = isStorageEnabled();
    const newState = !currentState;
    
    localStorage.setItem(CONFIG.STORAGE_ENABLED_KEY, newState.toString());
    
    if (toggle) {
        if (newState) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    }
    
    // Оновити статистику
    updateStatisticsDisplay();
    
    if (!newState) {
        alert('Локальне збереження вимкнено. Нові квитки не будуть зберігатися.');
    }
}

/**
 * Увімкнути/вимкнути повноекранний режим
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Помилка входу в fullscreen:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

/**
 * Показати модальне вікно очищення історії
 */
function showClearHistoryModal() {
    const modal = document.getElementById('clearModal');
    if (modal) {
        modal.classList.add('show');
    }
}

/**
 * Закрити модальне вікно очищення історії
 */
function closeClearModal() {
    const modal = document.getElementById('clearModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Підтвердити очищення історії
 */
function confirmClearHistory() {
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    closeClearModal();
    updateStatisticsDisplay();
    alert('Історію успішно очищено!');
}

/**
 * Ініціалізація сторінки налаштувань
 */
function initSettingsPage() {
    try {
        // Оновити статистику
        updateStatisticsDisplay();
        
        // Встановити стан перемикача локального збереження
        const toggle = document.getElementById('storage-toggle');
        if (toggle) {
            if (isStorageEnabled()) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    } catch (error) {
        console.error('Помилка ініціалізації settings page:', error);
    }
}

/**
 * Ініціалізувати подвійний клік для fullscreen
 */
let lastTap = 0;
function initDoubleClickFullscreen() {
    document.addEventListener('click', function(e) {
        // Ігнорувати кліки на кнопках та інших інтерактивних елементах
        if (e.target.closest('button, a, input, .card, .setting-item, .danger-item')) {
            return;
        }
        
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            // Подвійний клік
            toggleFullscreen();
            lastTap = 0;
        } else {
            lastTap = currentTime;
        }
    });
}

// ============================================
// АВТОМАТИЧНА ІНІЦІАЛІЗАЦІЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Визначити поточну сторінку та ініціалізувати відповідний функціонал
    if (currentPage === 'index.html' || currentPage === '') {
        initIndexPage();
    } else if (currentPage === 'payment.html') {
        initPaymentPage();
    } else if (currentPage === 'qr.html') {
        initQRPage();
    } else if (currentPage === 'settings.html') {
        initSettingsPage();
    }
    
    // Ініціалізувати подвійний клік для fullscreen на всіх сторінках
    initDoubleClickFullscreen();
});

// ============================================
// ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ HTML
// ============================================

// Функції для модального вікна (вже є в HTML, але виносимо сюди)
function openModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
}

function closeModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function copyData() {
    const dataToCopy = `КП ВІННИЦЬКА ТРАНСПОРТНА КОМПАНІЯ\nКод ЄДРПОУ: 03327925\nЗареєстровано: 28.10.1993\nАдреса: 21037, м. Вінниця, вул. Хмельницьке шосе, 29\nТелефон: +38-067-435-05-25`;
    navigator.clipboard.writeText(dataToCopy).then(() => {
        alert("Дані скопійовано!");
    }).catch(err => {
        console.error('Не вдалося скопіювати: ', err);
    });
}

// Закриття модального вікна при кліку поза ним
window.onclick = function(event) {
    const modal = document.getElementById('infoModal');
    if (event.target == modal) {
        closeModal();
    }
}
