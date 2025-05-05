document.addEventListener('DOMContentLoaded', () => {
    // Ne asigurăm că toate plugin-urile sunt înregistrate înainte de a inițializa graficul
    console.log("DOM încărcat, inițializăm componentele");
    setupChart();
    initTradingInterface();
    initChartData();
    setupEventListeners();
    populateOrderBook();
    populateTradeHistory();
});

// Date de market demo
const marketData = {
    'BTC/USDT': {
        lastPrice: 47265.35,
        priceChange: 2.75,
        high24h: 48112.87,
        low24h: 46398.21,
        volume: '$32.5B',
        availableBalance: 15432.21
    },
    'ETH/USDT': {
        lastPrice: 1825.72,
        priceChange: -0.52,
        high24h: 1855.30,
        low24h: 1805.14,
        volume: '$18.2B',
        availableBalance: 15432.21
    },
    'BNB/USDT': {
        lastPrice: 312.48,
        priceChange: 1.35,
        high24h: 318.25,
        low24h: 308.77,
        volume: '$950M',
        availableBalance: 15432.21
    }
};

// Culori pentru tema dark/light
function getThemeColors() {
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    
    return {
        gridColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        textColor: isDarkTheme ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        candlePositiveColor: 'rgba(16, 185, 129, 1)',
        candleNegativeColor: 'rgba(239, 68, 68, 1)',
        candlePositiveBorderColor: 'rgba(16, 185, 129, 1)',
        candleNegativeBorderColor: 'rgba(239, 68, 68, 1)',
        volumePositiveColor: 'rgba(16, 185, 129, 0.3)',
        volumeNegativeColor: 'rgba(239, 68, 68, 0.3)',
        crosshairColor: isDarkTheme ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        backgroundColor: isDarkTheme ? 'rgba(25, 30, 45, 0.5)' : 'rgba(255, 255, 255, 0.8)'
    };
}

// Configurarea Chart.js
function setupChart() {
    // În Chart.js v3, plugin-urile se înregistrează automat,
    // deci nu este nevoie de înregistrare manuală
    console.log("Inițializare Chart.js și plugin-uri");
}

// Inițializare interfață
function initTradingInterface() {
    // Obține perechea selectată
    const selectedPair = document.getElementById('tradingPair').value;
    
    // Actualizează valori de market
    updateMarketValues(selectedPair);
    
    // Inițializare ordine deschise
    const openOrders = document.getElementById('openOrders');
    const noOpenOrders = document.getElementById('noOpenOrders');
    
    if (openOrders && noOpenOrders) {
        openOrders.innerHTML = '';
        noOpenOrders.style.display = 'flex';
    }
    
    // Inițializare istoric ordine
    const orderHistory = document.getElementById('orderHistory');
    const noOrderHistory = document.getElementById('noOrderHistory');
    
    if (orderHistory && noOrderHistory) {
        orderHistory.innerHTML = '';
        noOrderHistory.style.display = 'flex';
    }
}

// Generăm date istorice pentru grafic
function generateChartData(timeframe = '1d', numCandles = 200) {
    const now = new Date();
    const data = [];
    let lastClose = 47200 + Math.random() * 1000;
    const volatility = 0.02;
    
    let timeIncrement;
    
    switch(timeframe) {
        case '1h':
            timeIncrement = 5 * 60 * 1000; // 5 minute
            break;
        case '4h':
            timeIncrement = 20 * 60 * 1000; // 20 minute
            break;
        case '1d':
            timeIncrement = 2 * 60 * 60 * 1000; // 2 ore
            break;
        case '1w':
            timeIncrement = 12 * 60 * 60 * 1000; // 12 ore
            break;
        case '1m':
            timeIncrement = 24 * 60 * 60 * 1000; // 1 zi
            break;
        default:
            timeIncrement = 2 * 60 * 60 * 1000; // 2 ore (default)
    }
    
    // Generăm date pentru ultimele numCandles perioade
    for (let i = numCandles; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * timeIncrement));
        const range = lastClose * volatility;
        
        // Generăm valori random pentru open, high, low, close
        const change = (Math.random() - 0.5) * range;
        const open = lastClose;
        const close = open + change;
        const high = Math.max(open, close) + (Math.random() * range * 0.5);
        const low = Math.min(open, close) - (Math.random() * range * 0.5);
        const volume = 1000 + Math.random() * 5000;
        
        data.push({
            time: timestamp,
            open: open,
            high: high,
            low: low,
            close: close,
            volume: volume
        });
        
        lastClose = close;
    }
    
    return data;
}

// Inițializare date pentru grafic
function initChartData() {
    const canvasElement = document.getElementById('tradingChart');
    if (!canvasElement) return;
    
    console.log("Inițializare grafic");
    const ctx = canvasElement.getContext('2d');
    const chartData = generateChartData();
    const themeColors = getThemeColors();
    
    // Utilizăm un grafic de tip linie simplu pentru a evita problemele cu extensiile
    const prices = chartData.map(item => ({
        x: new Date(item.time),
        y: item.close
    }));
    
    // Creăm chart-ul principal pentru prețuri ca grafic de linie
    const priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'BTC/USDT',
                data: prices,
                borderColor: themeColors.candlePositiveColor,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM d'
                        }
                    },
                    grid: {
                        color: themeColors.gridColor
                    },
                    ticks: {
                        color: themeColors.textColor
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: themeColors.gridColor
                    },
                    ticks: {
                        color: themeColors.textColor
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Preț: $' + context.parsed.y.toFixed(2);
                        }
                    }
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x'
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x'
                    }
                }
            }
        }
    });
    
    // Salvăm referința la chart pentru actualizări viitoare
    window.priceChart = priceChart;
    
    // Inițializăm butonul de reset zoom
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    if (resetZoomBtn) {
        resetZoomBtn.addEventListener('click', function() {
            priceChart.resetZoom();
        });
    }
    
    // Inițializăm butonul de fullscreen
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            const chartSection = document.querySelector('.chart-section');
            if (!document.fullscreenElement) {
                if (chartSection.requestFullscreen) {
                    chartSection.requestFullscreen();
                } else if (chartSection.mozRequestFullScreen) {
                    chartSection.mozRequestFullScreen();
                } else if (chartSection.webkitRequestFullscreen) {
                    chartSection.webkitRequestFullscreen();
                } else if (chartSection.msRequestFullscreen) {
                    chartSection.msRequestFullscreen();
                }
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        });
    }
}

// Funcție pentru schimbarea timeframe-ului
function changeTimeframe(timeframe) {
    const chartData = generateChartData(timeframe);
    if (!window.priceChart) return;
    
    const priceChart = window.priceChart;
    
    // Actualizăm datele pentru graficul de linie
    priceChart.data.datasets[0].data = chartData.map(item => ({
        x: new Date(item.time),
        y: item.close
    }));
    
    // Actualizăm opțiunile pentru timeframe
    const timeOptions = {
        '1h': {
            unit: 'minute',
            displayFormats: {
                minute: 'HH:mm'
            }
        },
        '4h': {
            unit: 'hour',
            displayFormats: {
                hour: 'HH:mm'
            }
        },
        '1d': {
            unit: 'hour',
            displayFormats: {
                hour: 'HH:mm'
            }
        },
        '1w': {
            unit: 'day',
            displayFormats: {
                day: 'MMM d'
            }
        },
        '1m': {
            unit: 'day',
            displayFormats: {
                day: 'MMM d'
            }
        }
    };
    
    if (timeOptions[timeframe]) {
        priceChart.options.scales.x.time = timeOptions[timeframe];
    }
    
    priceChart.update();
}

// Funcție pentru actualizarea valorilor de market
function updateMarketValues(pair) {
    const data = marketData[pair] || marketData['BTC/USDT'];
    
    // Actualizăm valorile în interfață
    document.getElementById('lastPrice').textContent = '$' + data.lastPrice.toFixed(2);
    
    const priceChangeEl = document.getElementById('priceChange');
    priceChangeEl.textContent = (data.priceChange >= 0 ? '+' : '') + data.priceChange.toFixed(2) + '%';
    priceChangeEl.className = 'stat-value ' + (data.priceChange >= 0 ? 'positive' : 'negative');
    
    document.getElementById('highPrice').textContent = '$' + data.high24h.toFixed(2);
    document.getElementById('lowPrice').textContent = '$' + data.low24h.toFixed(2);
    document.getElementById('volume').textContent = data.volume;
    
    // Actualizăm simbolul în formularul de cumpărare/vânzare
    const pairSymbols = pair.split('/');
    const baseSymbol = pairSymbols[0]; // BTC, ETH, etc.
    const quoteSymbol = pairSymbols[1]; // USDT, etc.
    
    // Actualizăm label-urile pentru prețuri și cantități
    const amountLabel = document.querySelector('label[for="orderAmount"]');
    if (amountLabel) amountLabel.textContent = `Amount (${baseSymbol})`;
    
    const priceLabel = document.querySelector('label[for="orderPrice"]');
    if (priceLabel) priceLabel.textContent = `Price (${quoteSymbol})`;
    
    const totalLabel = document.querySelector('label[for="orderTotal"]');
    if (totalLabel) totalLabel.textContent = `Total (${quoteSymbol})`;
    
    // Actualizăm textul butonului de cumpărare
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        if (placeOrderBtn.classList.contains('buy')) {
            placeOrderBtn.textContent = `Buy ${baseSymbol}`;
        } else {
            placeOrderBtn.textContent = `Sell ${baseSymbol}`;
        }
    }
    
    // Actualizăm balanța disponibilă
    document.getElementById('availableBalance').textContent = '$' + data.availableBalance.toFixed(2);
    
    // Actualizăm prețul în formularul de tranzacționare
    document.getElementById('orderPrice').value = data.lastPrice.toFixed(2);
    
    // Actualizăm prețul în orderbook
    document.getElementById('orderBookPrice').textContent = '$' + data.lastPrice.toFixed(2);
}

// Populăm orderbook-ul cu date demo
function populateOrderBook() {
    const sellOrders = document.getElementById('sellOrders');
    const buyOrders = document.getElementById('buyOrders');
    
    if (!sellOrders || !buyOrders) return;
    
    // Curățăm conținutul existent
    sellOrders.innerHTML = '';
    buyOrders.innerHTML = '';
    
    const selectedPair = document.getElementById('tradingPair').value;
    const basePrice = marketData[selectedPair]?.lastPrice || 47000;
    
    // Generăm ordine de vânzare (în ordine descrescătoare)
    for (let i = 10; i > 0; i--) {
        const price = basePrice + (i * 50 + Math.random() * 20);
        const amount = 0.01 + Math.random() * 0.5;
        const total = price * amount;
        
        // Adăugăm adâncime de piață
        const depth = Math.random() * 0.6 + 0.1; // între 10% și 70%
        
        const orderRow = document.createElement('div');
        orderRow.className = 'sell-order-row';
        orderRow.innerHTML = `
            <span class="price">$${price.toFixed(2)}</span>
            <span class="amount">${amount.toFixed(5)}</span>
            <span class="total">$${total.toFixed(2)}</span>
            <div class="order-depth sell-depth" style="width: ${depth * 100}%"></div>
        `;
        
        sellOrders.appendChild(orderRow);
    }
    
    // Generăm ordine de cumpărare
    for (let i = 1; i <= 10; i++) {
        const price = basePrice - (i * 50 + Math.random() * 20);
        const amount = 0.01 + Math.random() * 0.5;
        const total = price * amount;
        
        // Adăugăm adâncime de piață
        const depth = Math.random() * 0.6 + 0.1; // între 10% și 70%
        
        const orderRow = document.createElement('div');
        orderRow.className = 'buy-order-row';
        orderRow.innerHTML = `
            <span class="price">$${price.toFixed(2)}</span>
            <span class="amount">${amount.toFixed(5)}</span>
            <span class="total">$${total.toFixed(2)}</span>
            <div class="order-depth buy-depth" style="width: ${depth * 100}%"></div>
        `;
        
        buyOrders.appendChild(orderRow);
    }
    
    // Actualizăm spread-ul
    const topBuyPrice = basePrice - 50;
    const bottomSellPrice = basePrice + 50;
    const spread = bottomSellPrice - topBuyPrice;
    const spreadPercent = (spread / bottomSellPrice) * 100;
    
    document.getElementById('spread').textContent = `$${spread.toFixed(2)} (${spreadPercent.toFixed(2)}%)`;
}

// Populăm istoricul tranzacțiilor cu date demo
function populateTradeHistory() {
    const tradeHistory = document.getElementById('tradeHistory');
    if (!tradeHistory) return;
    
    // Curățăm conținutul existent
    tradeHistory.innerHTML = '';
    
    const selectedPair = document.getElementById('tradingPair').value;
    const basePrice = marketData[selectedPair]?.lastPrice || 47000;
    const now = new Date();
    
    // Generăm tranzacții istorice
    for (let i = 0; i < 30; i++) {
        const isBuy = Math.random() > 0.5;
        const price = basePrice + (Math.random() - 0.5) * 100;
        const amount = 0.001 + Math.random() * 0.1;
        
        // Calculăm timpul în trecut (în ultimele 60 minute)
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        const pastTime = new Date(now.getTime() - ((minutes * 60 + seconds) * 1000));
        const timeStr = pastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const tradeRow = document.createElement('div');
        tradeRow.className = `trade-row ${isBuy ? 'buy' : 'sell'}`;
        tradeRow.innerHTML = `
            <span class="price">$${price.toFixed(2)}</span>
            <span class="amount">${amount.toFixed(5)}</span>
            <span class="time">${timeStr}</span>
        `;
        
        tradeHistory.appendChild(tradeRow);
    }
}

// Adăugăm un ordin în istorie
function addOrderToHistory(side, type, pair, price, amount) {
    const orderHistory = document.getElementById('orderHistory');
    const noOrderHistory = document.getElementById('noOrderHistory');
    
    if (!orderHistory || !noOrderHistory) return;
    
    // Ascundem mesajul "no order history"
    noOrderHistory.style.display = 'none';
    
    // Creăm rândul pentru istoric
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateTimeStr = `${dateStr} ${timeStr}`;
    
    const total = price * amount;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${dateTimeStr}</td>
        <td>${pair}</td>
        <td>${type}</td>
        <td class="${side.toLowerCase()}">${side}</td>
        <td>$${price.toFixed(2)}</td>
        <td>${amount.toFixed(5)}</td>
        <td>$${total.toFixed(2)}</td>
        <td>Filled</td>
    `;
    
    // Adăugăm rândul la început
    if (orderHistory.querySelector('tr')) {
        orderHistory.insertBefore(row, orderHistory.querySelector('tr'));
    } else {
        orderHistory.appendChild(row);
    }
}

// Procesăm un ordin nou
function processOrder() {
    // Obținem datele din formular
    const pair = document.getElementById('tradingPair').value;
    const orderType = document.querySelector('.order-type-btn.active').getAttribute('data-order-type');
    const side = document.querySelector('.action-tab-btn.active').getAttribute('data-action');
    const price = parseFloat(document.getElementById('orderPrice').value);
    const amount = parseFloat(document.getElementById('orderAmount').value);
    
    // Validăm datele
    if (isNaN(price) || price <= 0) {
        alert('Please enter a valid price');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Procesăm ordinul instant (în versiunea demo)
    addOrderToHistory(side === 'buy' ? 'Buy' : 'Sell', 
                      orderType.charAt(0).toUpperCase() + orderType.slice(1), 
                      pair, price, amount);
    
    // Actualizăm datele și UI-ul
    const total = price * amount;
    const successMsg = `${side === 'buy' ? 'Bought' : 'Sold'} ${amount.toFixed(5)} ${pair.split('/')[0]} for $${total.toFixed(2)}`;
    
    // Afișăm un mesaj de succes
    const notification = document.createElement('div');
    notification.className = 'trade-notification';
    notification.innerHTML = `
        <div class="notification-icon ${side === 'buy' ? 'buy' : 'sell'}">
            <i class="fas fa-${side === 'buy' ? 'arrow-down' : 'arrow-up'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${side === 'buy' ? 'Purchase' : 'Sale'} Successful</div>
            <div class="notification-message">${successMsg}</div>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Animăm notificarea
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Închidem notificarea după 5 secunde
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
    
    // Event handler pentru butonul de închidere
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Resetăm formularul
    document.getElementById('orderAmount').value = '';
    document.getElementById('orderTotal').value = '';
}

// Configurăm event listeners
function setupEventListeners() {
    // Listener pentru schimbarea perechii de tranzacționare
    const tradingPair = document.getElementById('tradingPair');
    if (tradingPair) {
        tradingPair.addEventListener('change', function() {
            const selectedPair = this.value;
            updateMarketValues(selectedPair);
            populateOrderBook();
            populateTradeHistory();
        });
    }
    
    // Listeners pentru timeframe
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    timeframeButtons.forEach(button => {
        button.addEventListener('click', function() {
            timeframeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const timeframe = this.getAttribute('data-timeframe');
            changeTimeframe(timeframe);
        });
    });
    
    // Listeners pentru tipuri de ordine
    const orderTypeButtons = document.querySelectorAll('.order-type-btn');
    orderTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            orderTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // În funcție de tipul ordinului, dezactivăm/activăm câmpul de preț
            const orderType = this.getAttribute('data-order-type');
            const priceInput = document.getElementById('orderPrice');
            
            if (orderType === 'market') {
                priceInput.disabled = true;
                priceInput.value = marketData[document.getElementById('tradingPair').value]?.lastPrice.toFixed(2) || '';
            } else {
                priceInput.disabled = false;
            }
        });
    });
    
    // Listeners pentru acțiuni (buy/sell)
    const actionButtons = document.querySelectorAll('.action-tab-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            actionButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Schimbăm culoarea butonului de plasare ordin
            const placeOrderBtn = document.getElementById('placeOrderBtn');
            if (placeOrderBtn) {
                placeOrderBtn.className = 'place-order-btn ' + this.getAttribute('data-action');
                
                // Actualizăm și textul butonului
                const pair = document.getElementById('tradingPair').value;
                const baseSymbol = pair.split('/')[0];
                placeOrderBtn.textContent = this.getAttribute('data-action') === 'buy' ? 
                    `Buy ${baseSymbol}` : `Sell ${baseSymbol}`;
            }
        });
    });
    
    // Listeners pentru butoanele de procent (25%, 50%, etc.)
    const sliderButtons = document.querySelectorAll('.slider-btn');
    sliderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const percent = parseInt(this.getAttribute('data-percent'));
            const balance = 15432.21; // Valoarea hardcodată pentru demo
            const price = parseFloat(document.getElementById('orderPrice').value) || 0;
            
            if (price > 0) {
                // Calculăm cantitatea bazată pe procent și preț
                const amount = (balance * (percent / 100)) / price;
                document.getElementById('orderAmount').value = amount.toFixed(5);
                document.getElementById('orderTotal').value = (amount * price).toFixed(2);
            }
        });
    });
    
    // Listeners pentru câmpurile de preț și cantitate pentru a calcula totalul
    const orderPrice = document.getElementById('orderPrice');
    const orderAmount = document.getElementById('orderAmount');
    const orderTotal = document.getElementById('orderTotal');
    
    if (orderPrice && orderAmount && orderTotal) {
        orderPrice.addEventListener('input', calculateTotal);
        orderAmount.addEventListener('input', calculateTotal);
        orderTotal.addEventListener('input', calculateAmount);
    }
    
    // Listener pentru butonul de plasare ordin
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', processOrder);
    }
    
    // Listeners pentru tabs-urile de ordine
    const orderTabButtons = document.querySelectorAll('.orders-tab-btn');
    orderTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            orderTabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Schimbăm conținutul vizibil
            const tabId = this.getAttribute('data-orders-tab');
            const containers = document.querySelectorAll('.orders-table-container');
            containers.forEach(container => {
                container.classList.remove('active');
            });
            
            const activeContainer = document.getElementById(tabId + 'OrdersTable');
            if (activeContainer) {
                activeContainer.classList.add('active');
            }
        });
    });
}

// Calculează totalul bazat pe preț și cantitate
function calculateTotal() {
    const price = parseFloat(document.getElementById('orderPrice').value) || 0;
    const amount = parseFloat(document.getElementById('orderAmount').value) || 0;
    
    if (price > 0 && amount > 0) {
        const total = price * amount;
        document.getElementById('orderTotal').value = total.toFixed(2);
    }
}

// Calculează cantitatea bazată pe preț și total
function calculateAmount() {
    const price = parseFloat(document.getElementById('orderPrice').value) || 0;
    const total = parseFloat(document.getElementById('orderTotal').value) || 0;
    
    if (price > 0 && total > 0) {
        const amount = total / price;
        document.getElementById('orderAmount').value = amount.toFixed(5);
    }
}

// Adăugăm stiluri CSS pentru notificări
(function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .trade-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(25, 30, 45, 0.9);
            border-radius: 8px;
            padding: 15px;
            width: 300px;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
        }
        
        html[data-theme="light"] .trade-notification {
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        
        .notification-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 1.2rem;
        }
        
        .notification-icon.buy {
            background-color: rgba(16, 185, 129, 0.2);
            color: var(--positive-color);
        }
        
        .notification-icon.sell {
            background-color: rgba(239, 68, 68, 0.2);
            color: var(--negative-color);
        }
        
        .notification-content {
            flex: 1;
        }
        
        .notification-title {
            font-weight: 600;
            margin-bottom: 5px;
            color: var(--text-color);
        }
        
        .notification-message {
            font-size: 0.9rem;
            color: var(--secondary-text-color);
        }
        
        .notification-close {
            background: transparent;
            border: none;
            color: var(--secondary-text-color);
            cursor: pointer;
            padding: 5px;
            font-size: 0.9rem;
            transition: color 0.2s ease;
        }
        
        .notification-close:hover {
            color: var(--text-color);
        }
    `;
    document.head.appendChild(style);
})(); 