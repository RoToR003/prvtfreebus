// ============================================
// КОНСТАНТИ ТА НАЛАШТУВАННЯ
// ============================================

const CONFIG = {
    TICKET_DURATION: 60 * 60, // 60 хвилин у секундах
    TICKET_PRICE: 12.00,
    STORAGE_KEY: 'transport_tickets',
    SESSION_KEY: 'new_ticket_data',
    STORAGE_ENABLED_KEY: 'storage_enabled',
    STATISTICS_KEY: 'transport_statistics',
    CACHE_KEY: 'transport_cache',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 години в мілісекундах
    FULLSCREEN_KEY: 'fullscreen_enabled'
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
    
    // Також зберігаємо статистику окремо (для можливості залишити її після очищення)
    updateStatisticsStorage(newTicket);
    
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

// QR Camera state
let qrCameraState = {
    currentFacingMode: 'environment',
    currentDeviceId: null,
    html5QrCode: null,
    isScanning: false
};

/**
 * Start the camera for QR scanning
 */
async function startQRCamera() {
    const qrReaderElement = document.getElementById('qr-reader');
    const fallbackElement = document.getElementById('camera-fallback');
    
    if (!qrReaderElement || !fallbackElement) return;
    
    if (qrCameraState.isScanning) {
        return;
    }

    try {
        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            console.error('Html5Qrcode library not loaded');
            showQRCameraFallback();
            return;
        }

        // Initialize html5-qrcode scanner
        if (!qrCameraState.html5QrCode) {
            qrCameraState.html5QrCode = new Html5Qrcode("qr-reader");
        }

        // Get saved camera device ID
        const savedDeviceId = localStorage.getItem('selected_camera_id');
        
        // Determine which camera to use
        let cameraId;
        if (savedDeviceId && qrCameraState.currentDeviceId === null) {
            cameraId = savedDeviceId;
        } else if (qrCameraState.currentDeviceId) {
            cameraId = qrCameraState.currentDeviceId;
        } else {
            // Get list of cameras and choose based on facing mode
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                // Try to find camera matching facing mode
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
                const frontCamera = devices.find(d => d.label.toLowerCase().includes('front'));
                
                if (qrCameraState.currentFacingMode === 'environment' && backCamera) {
                    cameraId = backCamera.id;
                } else if (qrCameraState.currentFacingMode === 'user' && frontCamera) {
                    cameraId = frontCamera.id;
                } else {
                    cameraId = devices[0].id;
                }
                qrCameraState.currentDeviceId = cameraId;
            }
        }

        // Configuration for QR scanning
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 16/9
        };

        // Start scanning
        await qrCameraState.html5QrCode.start(
            cameraId || { facingMode: qrCameraState.currentFacingMode },
            config,
            (decodedText, decodedResult) => {
                // QR Code detected! Stop scanning and go to payment
                onQRCodeDetected(decodedText);
            },
            (errorMessage) => {
                // Scanning errors - ignore them (no QR code in view)
            }
        );

        qrCameraState.isScanning = true;
        fallbackElement.classList.remove('active');
        
        // Hide video element if present
        const videoElement = document.getElementById('camera-stream');
        if (videoElement) {
            videoElement.style.display = 'none';
        }
    } catch (error) {
        console.error("Помилка запуску QR сканера:", error);
        showQRCameraFallback();
    }
}

/**
 * Handle QR code detection
 */
function onQRCodeDetected(qrCodeData) {
    console.log('QR код розпізнано:', qrCodeData);
    
    // Stop scanning
    if (qrCameraState.html5QrCode && qrCameraState.isScanning) {
        qrCameraState.html5QrCode.stop().then(() => {
            qrCameraState.isScanning = false;
            goToPaymentFromQR();
        }).catch((err) => {
            console.error("Помилка зупинки сканера:", err);
            qrCameraState.isScanning = false;
            goToPaymentFromQR();
        });
    } else {
        goToPaymentFromQR();
    }
}

/**
 * Show camera fallback
 */
function showQRCameraFallback() {
    const videoElement = document.getElementById('camera-stream');
    const fallbackElement = document.getElementById('camera-fallback');
    if (videoElement && fallbackElement) {
        videoElement.style.display = 'none';
        fallbackElement.classList.add('active');
    }
}

/**
 * Stop the camera
 */
function stopQRCamera() {
    if (qrCameraState.html5QrCode && qrCameraState.isScanning) {
        qrCameraState.html5QrCode.stop().then(() => {
            qrCameraState.isScanning = false;
        }).catch((err) => {
            console.error("Помилка зупинки камери:", err);
            qrCameraState.isScanning = false;
        });
    }
    
    // Also stop video element if present
    const videoElement = document.getElementById('camera-stream');
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => track.stop());
        videoElement.srcObject = null;
    }
}

/**
 * Switch camera (front/back)
 */
function switchQRCamera() {
    qrCameraState.currentFacingMode = (qrCameraState.currentFacingMode === 'environment') ? 'user' : 'environment';
    qrCameraState.currentDeviceId = null; // Скидаємо deviceId при перемиканні
    
    // Stop current scanner and restart with new camera
    if (qrCameraState.html5QrCode && qrCameraState.isScanning) {
        qrCameraState.html5QrCode.stop().then(() => {
            qrCameraState.isScanning = false;
            startQRCamera();
        }).catch((err) => {
            console.error("Помилка перемикання камери:", err);
            qrCameraState.isScanning = false;
            startQRCamera();
        });
    } else {
        startQRCamera();
    }
}

/**
 * Go to payment from QR page
 */
function goToPaymentFromQR() {
    // Зберегти мітку про сканування
    sessionStorage.setItem('qr_scanned', 'true');
    // Перейти на сторінку оплати
    goToPage('payment');
}

/**
 * Ініціалізація QR сторінки
 */
function initQRPage() {
    // Start camera
    startQRCamera();
    
    // Setup switch camera button
    const switchBtn = document.querySelector('.circle-btn[onclick*="switchCamera"]');
    if (switchBtn) {
        switchBtn.removeAttribute('onclick');
        switchBtn.addEventListener('click', switchQRCamera);
    }
    
    // Setup payment button
    const paymentBtn = document.querySelector('.circle-btn[onclick*="goToPayment"]');
    if (paymentBtn) {
        paymentBtn.removeAttribute('onclick');
        paymentBtn.addEventListener('click', goToPaymentFromQR);
    }
    
    // При кліку на будь-яку область екрану переходимо на оплату
    const overlay = document.querySelector('.overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            // Якщо клік не на кнопку закриття або інші кнопки
            if (!e.target.closest('.icon-btn') && !e.target.closest('.circle-btn')) {
                goToPaymentFromQR();
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
        const minusBtn = document.getElementById('btn-minus');
        const plusBtn = document.getElementById('btn-plus');
        const totalPriceEl = document.getElementById('total-price');
        const pricePerTicket = 12.00;
        
        if (!buyBtn || !transportInput || !qtyInput) return;
        
        // Генерація рандомних даних картки
        generateRandomCardData();
        
        // Логіка лічильника пасажирів
        if (plusBtn && minusBtn && totalPriceEl) {
            const updateTotal = (qty) => {
                const total = (qty * pricePerTicket).toFixed(2);
                totalPriceEl.textContent = `${total} UAH`;
            };
            
            plusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value);
                val++;
                qtyInput.value = val;
                updateTotal(val);
            });

            minusBtn.addEventListener('click', () => {
                let val = parseInt(qtyInput.value);
                if (val > 1) {
                    val--;
                    qtyInput.value = val;
                    updateTotal(val);
                }
            });
        }
        
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
            goToPage('index');
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
    // Використовуємо кеш для даних картки (генеруємо раз на добу)
    const cardData = getCachedOrGenerate('payment_card_data', () => {
        return {
            balance: generateRandomBalance(),
            cardLast4: generateCardLast4(),
            ibanLast4: generateIbanLast4()
        };
    });
    
    // Оновлюємо баланс
    const balanceEl = document.querySelector('.card-balance');
    if (balanceEl) {
        balanceEl.textContent = `${cardData.balance} UAH`;
    }
    
    // Оновлюємо номер картки
    const cardNumberEl = document.querySelector('.card-number');
    if (cardNumberEl) {
        cardNumberEl.textContent = `•••• ${cardData.cardLast4} | UA53 •••• ${cardData.ibanLast4}`;
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
 * Завантажити статистику з окремого сховища
 */
function loadStatistics() {
    try {
        const data = localStorage.getItem(CONFIG.STATISTICS_KEY);
        return data ? JSON.parse(data) : { tickets: [] };
    } catch (error) {
        console.error('Помилка завантаження статистики:', error);
        return { tickets: [] };
    }
}

/**
 * Зберегти статистику в окреме сховище
 */
function saveStatistics(stats) {
    try {
        localStorage.setItem(CONFIG.STATISTICS_KEY, JSON.stringify(stats));
        return true;
    } catch (error) {
        console.error('Помилка збереження статистики:', error);
        return false;
    }
}

/**
 * Оновити статистику при додаванні нового квитка
 */
function updateStatisticsStorage(newTicket) {
    const stats = loadStatistics();
    
    // Зберігаємо тільки необхідні дані для статистики
    stats.tickets.push({
        purchaseTime: newTicket.purchaseTime,
        passengers: newTicket.passengers
    });
    
    saveStatistics(stats);
}

// ============================================
// КЕШУВАННЯ ДАНИХ
// ============================================

/**
 * Завантажити кеш
 */
function loadCache() {
    try {
        const data = localStorage.getItem(CONFIG.CACHE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (error) {
        console.error('Помилка завантаження кешу:', error);
        return {};
    }
}

/**
 * Зберегти дані в кеш
 */
function saveCache(cache) {
    try {
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(cache));
        return true;
    } catch (error) {
        console.error('Помилка збереження кешу:', error);
        return false;
    }
}

/**
 * Отримати дані з кешу або згенерувати нові
 * @param {string} key - ключ кешу
 * @param {function} generator - функція для генерації даних
 * @returns {any} - дані з кешу або нові згенеровані
 */
function getCachedOrGenerate(key, generator) {
    const cache = loadCache();
    const now = Date.now();
    
    // Перевірити чи є дані в кеші і чи не застарілі
    if (cache[key] && cache[key].timestamp && 
        (now - cache[key].timestamp < CONFIG.CACHE_DURATION)) {
        return cache[key].data;
    }
    
    // Згенерувати нові дані
    const newData = generator();
    
    // Зберегти в кеш
    cache[key] = {
        data: newData,
        timestamp: now
    };
    saveCache(cache);
    
    return newData;
}

/**
 * Очистити кеш
 */
function clearCache() {
    localStorage.removeItem(CONFIG.CACHE_KEY);
}

/**
 * Очистити застарілі дані з кешу
 */
function cleanExpiredCache() {
    const cache = loadCache();
    const now = Date.now();
    let hasChanges = false;
    
    Object.keys(cache).forEach(key => {
        if (cache[key].timestamp && 
            (now - cache[key].timestamp >= CONFIG.CACHE_DURATION)) {
            delete cache[key];
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        saveCache(cache);
    }
}

/**
 * Попередньо завантажити зображення для кешування браузером
 */
function preloadImages() {
    const images = [
        'https://i.ibb.co/9m9Gx8wS/Picsart-26-01-29-01-00-20-922.jpg', // Logo
        'https://i.ibb.co/9mn9jMK6/Picsart-26-01-29-00-59-56-789.jpg', // Ticket Visual
        'https://i.ibb.co/ycpRSNp5/Picsart-26-01-29-17-42-01-646.jpg', // Archive icon
        'https://i.ibb.co/hTyK6Tx/Picsart-26-01-29-17-41-41-839.jpg', // Visa Card
        'https://i.ibb.co/0y9D9mD8/Picsart-26-01-29-18-17-06-761.jpg', // Visa logo
        'https://i.ibb.co/cSMjFD5Y/Picsart-26-01-29-15-08-37-387.jpg', // Transport icon
        'https://i.ibb.co/23Nbdh39/Picsart-26-01-29-15-09-08-727.jpg', // Train
        'https://i.ibb.co/5gkP5ZBv/Picsart-26-01-29-15-09-59-963.jpg', // Plane
        'https://i.ibb.co/v8p18zj/Picsart-26-01-29-15-18-22-163.jpg', // Bus
        'https://i.ibb.co/7JtyVry3/Picsart-26-01-29-15-19-07-001.jpg'  // City Transport
    ];
    
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
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

    // Завантажуємо статистику з окремого сховища
    const stats = loadStatistics();
    const tickets = stats.tickets || [];
    
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
        document.documentElement.requestFullscreen().then(() => {
            // Зберігаємо, що fullscreen активний
            sessionStorage.setItem(CONFIG.FULLSCREEN_KEY, 'true');
        }).catch(err => {
            console.log('Помилка входу в fullscreen:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => {
                // Видаляємо мітку fullscreen
                sessionStorage.removeItem(CONFIG.FULLSCREEN_KEY);
            });
        }
    }
}

/**
 * Відновити fullscreen при переході між сторінками
 */
function restoreFullscreenIfNeeded() {
    const wasFullscreen = sessionStorage.getItem(CONFIG.FULLSCREEN_KEY);
    if (wasFullscreen === 'true' && !document.fullscreenElement) {
        // Невелика затримка для завантаження сторінки
        setTimeout(() => {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Помилка відновлення fullscreen:', err);
            });
        }, 100);
    }
}

/**
 * Відстежувати вихід з fullscreen
 */
function monitorFullscreenChanges() {
    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement) {
            // Користувач вийшов з fullscreen вручну
            sessionStorage.removeItem(CONFIG.FULLSCREEN_KEY);
        }
    });
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
 * @param {boolean} clearAll - true: видалити все, false: залишити статистику
 */
function confirmClearHistory(clearAll) {
    if (clearAll) {
        // Видалити все (квитки + статистику + кеш)
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        localStorage.removeItem(CONFIG.STATISTICS_KEY);
        clearCache();
        closeClearModal();
        updateStatisticsDisplay();
        alert('Всю історію, статистику та кеш успішно очищено!');
    } else {
        // Видалити тільки квитки, залишити статистику та кеш
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        closeClearModal();
        updateStatisticsDisplay();
        alert('Квитки очищено! Статистика та кеш збережені.');
    }
}

/**
 * Очистити кеш з повідомленням
 */
function clearCacheAndNotify() {
    clearCache();
    updateCacheSizeDisplay();
    alert('Кеш успішно очищено! При наступному завантаженні дані будуть згенеровані заново.');
}

/**
 * Отримати список доступних камер
 */
async function getCameraList() {
    try {
        // Спочатку запитуємо дозвіл на камеру
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        return cameras;
    } catch (error) {
        console.error('Помилка отримання списку камер:', error);
        return [];
    }
}

/**
 * Відкрити селектор камери
 */
async function openCameraSelector() {
    const cameras = await getCameraList();
    const cameraList = document.getElementById('camera-list');
    const modal = document.getElementById('cameraModal');
    
    if (!cameraList || !modal) return;
    
    // Очистити список
    cameraList.innerHTML = '';
    
    if (cameras.length === 0) {
        cameraList.innerHTML = '<div class="modal-text">Камери не знайдено</div>';
    } else {
        const savedCameraId = localStorage.getItem('selected_camera_id');
        
        // Додати опцію "Автоматично"
        const autoItem = document.createElement('div');
        autoItem.className = 'camera-item' + (!savedCameraId ? ' selected' : '');
        autoItem.innerHTML = `
            <div class="camera-name">Автоматично</div>
            <svg class="camera-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        autoItem.onclick = () => selectCamera(null);
        cameraList.appendChild(autoItem);
        
        // Додати всі камери
        cameras.forEach((camera, index) => {
            const item = document.createElement('div');
            item.className = 'camera-item' + (camera.deviceId === savedCameraId ? ' selected' : '');
            
            const label = camera.label || `Камера ${index + 1}`;
            
            item.innerHTML = `
                <div class="camera-name">${label}</div>
                <svg class="camera-check" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            item.onclick = () => selectCamera(camera.deviceId);
            cameraList.appendChild(item);
        });
    }
    
    modal.classList.add('show');
}

/**
 * Закрити модальне вікно вибору камери
 */
function closeCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Вибрати камеру
 */
function selectCamera(deviceId) {
    if (deviceId) {
        localStorage.setItem('selected_camera_id', deviceId);
    } else {
        localStorage.removeItem('selected_camera_id');
    }
    
    // Оновити опис
    updateCameraDescription();
    
    closeCameraModal();
}

/**
 * Оновити опис вибраної камери
 */
async function updateCameraDescription() {
    const descEl = document.getElementById('camera-description');
    if (!descEl) return;
    
    const savedCameraId = localStorage.getItem('selected_camera_id');
    
    if (!savedCameraId) {
        descEl.textContent = 'Автоматично';
        return;
    }
    
    try {
        const cameras = await getCameraList();
        const camera = cameras.find(c => c.deviceId === savedCameraId);
        
        if (camera) {
            descEl.textContent = camera.label || 'Вибрана камера';
        } else {
            descEl.textContent = 'Автоматично';
        }
    } catch (error) {
        descEl.textContent = 'Автоматично';
    }
}

/**
 * Отримати розмір кешу в KB
 */
function getCacheSize() {
    try {
        const cache = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!cache) return 0;
        
        // Розмір в байтах (кожен символ = 2 байти в UTF-16)
        const bytes = new Blob([cache]).size;
        const kb = (bytes / 1024).toFixed(2);
        
        return kb;
    } catch (error) {
        return 0;
    }
}

/**
 * Оновити відображення розміру кешу
 */
function updateCacheSizeDisplay() {
    const cacheSizeEl = document.getElementById('cache-size');
    if (cacheSizeEl) {
        const size = getCacheSize();
        cacheSizeEl.textContent = `${size} KB`;
    }
}

/**
 * Ініціалізація сторінки налаштувань
 */
function initSettingsPage() {
    try {
        // Синхронізувати статистику зі старих квитків (якщо є)
        syncStatisticsFromTickets();
        
        // Оновити статистику
        updateStatisticsDisplay();
        
        // Оновити розмір кешу
        updateCacheSizeDisplay();
        
        // Оновити опис камери
        updateCameraDescription();
        
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
 * Синхронізувати статистику зі старих квитків
 */
function syncStatisticsFromTickets() {
    const stats = loadStatistics();
    
    // Якщо статистика порожня, але є квитки - синхронізувати
    if ((!stats.tickets || stats.tickets.length === 0)) {
        const tickets = loadTickets();
        if (tickets.length > 0) {
            stats.tickets = tickets.map(ticket => ({
                purchaseTime: ticket.purchaseTime,
                passengers: ticket.passengers || 1
            }));
            saveStatistics(stats);
        }
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
// SPA ROUTER
// ============================================

const SPA = {
    container: null,
    pageCache: {},
    currentPage: null,
    
    init() {
        this.container = document.getElementById('app-container');
        
        if (!this.container) {
            // Not in SPA mode, exit
            return false;
        }
        
        // Перехоплювати кліки по посиланнях
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                this.navigate(link.dataset.page);
            }
        });
        
        // Обробка кнопки "Назад"
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.loadPage(e.state.page, false);
            }
        });
        
        // Завантажити початкову сторінку
        const hash = window.location.hash.slice(1); // Remove #
        const initialPage = hash || 'transport';
        this.loadPage(initialPage, false);
        
        return true;
    },
    
    navigate(page) {
        this.loadPage(page, true);
    },
    
    async loadPage(page, pushState = true) {
        // Cleanup previous page
        this.cleanupCurrentPage();
        
        this.showTransition();
        
        try {
            let content;
            
            if (this.pageCache[page]) {
                content = this.pageCache[page];
            } else {
                const response = await fetch(`templates/${page}-content.html`);
                if (!response.ok) {
                    throw new Error(`Failed to load ${page}`);
                }
                content = await response.text();
                this.pageCache[page] = content;
            }
            
            // Remove all page-specific classes from container
            const pageClasses = ['index-page', 'payment-page', 'qr-page', 'settings-page', 'transport-page'];
            pageClasses.forEach(cls => this.container.classList.remove(cls));
            
            // Add page-specific class to container
            this.container.classList.add(`${page}-page`);
            
            this.container.innerHTML = content;
            
            if (pushState) {
                history.pushState({ page }, '', `#${page}`);
            }
            
            this.initPageFunctions(page);
            this.hideTransition();
            this.currentPage = page;
            
        } catch (error) {
            console.error('Помилка завантаження сторінки:', error);
            this.hideTransition();
        }
    },
    
    cleanupCurrentPage() {
        // Cleanup based on current page
        if (this.currentPage === 'qr') {
            // Stop camera when leaving QR page
            stopQRCamera();
        }
    },
    
    initPageFunctions(page) {
        switch(page) {
            case 'index': 
                initIndexPage(); 
                break;
            case 'payment': 
                initPaymentPage(); 
                break;
            case 'qr': 
                initQRPage(); 
                break;
            case 'settings': 
                initSettingsPage(); 
                break;
            case 'transport': 
                // Transport page has no special init
                break;
        }
    },
    
    showTransition() {
        const overlay = document.getElementById('page-transition');
        if (overlay) overlay.classList.add('active');
    },
    
    hideTransition() {
        const overlay = document.getElementById('page-transition');
        if (overlay) {
            setTimeout(() => overlay.classList.remove('active'), 50);
        }
    }
};

// Глобальна функція для навігації
function goToPage(page) {
    if (SPA.container) {
        SPA.navigate(page);
    } else {
        // Fallback for non-SPA mode
        window.location.href = `${page}.html`;
    }
}

// ============================================
// АВТОМАТИЧНА ІНІЦІАЛІЗАЦІЯ
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Очистити застарілий кеш при кожному завантаженні
    cleanExpiredCache();
    
    // Попередньо завантажити зображення
    preloadImages();
    
    // Відновити fullscreen якщо був активний
    restoreFullscreenIfNeeded();
    
    // Відстежувати зміни fullscreen
    monitorFullscreenChanges();
    
    // Спробувати ініціалізувати SPA
    const isSPA = SPA.init();
    
    if (!isSPA) {
        // Стара логіка для окремих HTML файлів (зворотна сумісність)
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
