document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM încărcat, inițializăm componentele");
    
    // Inițializăm interfața fără a actualiza valorile încă
    setupChart();
    initCustomDropdown();
    initEmptyUI(); // Doar inițializare UI fără valori
    
    // Inițializăm API-ul și forțăm actualizarea imediată a datelor
    console.log("Inițializăm API și forțăm update-ul datelor");
    initCryptoAPI();
    
    // Restul inițializărilor după obținerea datelor
    setupEventListeners();
    
    // Inițiem actualizarea periodică a prețurilor
    startPriceUpdates();
    
    updateTradeBalance();
});

// Date de market demo cu valori neutre
const marketData = {
    'BTC/USDT': {
        lastPrice: 0.00,
        priceChange: 0.00,
        high24h: 0.00,
        low24h: 0.00,
        volume: '$0',
        availableBalance: 15432.21
    },
    'ETH/USDT': {
        lastPrice: 0.00,
        priceChange: 0.00,
        high24h: 0.00,
        low24h: 0.00,
        volume: '$0',
        availableBalance: 15432.21
    },
    'BNB/USDT': {
        lastPrice: 0.00,
        priceChange: 0.00,
        high24h: 0.00,
        low24h: 0.00,
        volume: '$0',
        availableBalance: 15432.21
    }
};

// Mapare simboluri monede către ID-urile CoinGecko
const coinGeckoIdMap = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin'
};

// Mapare pentru API-ul CryptoCompare
const cryptoCompareSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE'];

// Stocăm datele primite de la API
let cryptoData = {};
let priceChartData = {};
let currentCoin = 'BTC';
let priceUpdateInterval;
let lastAPICall = 0;
const API_CALL_DELAY = 10000; // 10 secunde între apeluri pentru a evita limitarea

// Schimb proxy-ul cu unul mai fiabil
const COINGECKO_PROXY = 'https://cors-anywhere.herokuapp.com/';

// Flag global pentru a indica dacă folosim date reale sau demo
let usingRealData = false;

// Mapare a intervalelor UI către formatul Binance
const timeframeMap = {
    '1h': {
        binanceInterval: '1m',
        limit: 60,
        chartUnit: 'minute',
        displayFormat: 'HH:mm'
    },
    '4h': {
        binanceInterval: '5m',
        limit: 48,
        chartUnit: 'hour',
        displayFormat: 'HH:mm'
    },
    '1d': {
        binanceInterval: '15m',
        limit: 96,
        chartUnit: 'hour',
        displayFormat: 'HH:mm'
    },
    '1w': {
        binanceInterval: '2h',
        limit: 84,
        chartUnit: 'day',
        displayFormat: 'MMM d'
    },
    '1m': {
        binanceInterval: '8h',
        limit: 90,
        chartUnit: 'day',
        displayFormat: 'MMM d'
    }
};

// Interval curent activ (default: 1d)
let currentTimeframe = '1d';

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

// Inițializare dropdown personalizat cu iconițe
function initCustomDropdown() {
    const customDropdown = document.querySelector('.custom-dropdown');
    const selectedOption = document.querySelector('.selected-option');
    const dropdownOptions = document.querySelector('.dropdown-options');
    const dropdownOptionItems = document.querySelectorAll('.dropdown-option');
    const hiddenSelect = document.getElementById('tradingPair');
    
    if (!customDropdown || !selectedOption || !hiddenSelect) {
        console.error("Nu s-au găsit toate elementele necesare pentru dropdown!");
        return;
    }
    
    console.log("Inițializare dropdown personalizat");
    
    // Asigurăm poziționarea corectă a meniului dropdown
    function positionDropdown() {
        if (dropdownOptions) {
            // Forțăm dropdown-ul să aibă aceeași lățime ca și elementul selectat
            const rect = selectedOption.getBoundingClientRect();
            dropdownOptions.style.width = rect.width + 'px';
            
            // Mută dropdown-ul în body pentru a evita probleme de overflow/z-index
            if (!document.body.contains(dropdownOptions)) {
                document.body.appendChild(dropdownOptions);
                
                // Poziționează-l sub elementul selectat
                const rectSelected = selectedOption.getBoundingClientRect();
                dropdownOptions.style.position = 'fixed';
                dropdownOptions.style.top = (rectSelected.bottom + 2) + 'px';
                dropdownOptions.style.left = rectSelected.left + 'px';
                dropdownOptions.style.width = rectSelected.width + 'px';
            }
        }
    }
    
    // Toggle dropdown la click pe elementul selectat
    selectedOption.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevenim propagarea evenimentului
        
        // Dacă este deja activ, îl ascundem
        if (customDropdown.classList.contains('active')) {
            customDropdown.classList.remove('active');
        } else {
            // Altfel îl afișăm și poziționăm corect
            customDropdown.classList.add('active');
            positionDropdown();
        }
        
        console.log("Dropdown toggle:", customDropdown.classList.contains('active'));
    });
    
    // Închide dropdown la click în afara acestuia
    document.addEventListener('click', (e) => {
        if (!customDropdown.contains(e.target) && !dropdownOptions.contains(e.target)) {
            customDropdown.classList.remove('active');
        }
    });
    
    // Adăugăm handler pentru opțiuni
    dropdownOptionItems.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevenim propagarea evenimentului
            
            const value = option.getAttribute('data-value');
            const iconElement = option.querySelector('.crypto-icon').cloneNode(true);
            const text = option.querySelector('span:not(.crypto-icon)').textContent;
            
            console.log("[DROPDOWN] Opțiune selectată:", value);
            
            // Actualizăm opțiunea selectată
            const selectedIcon = selectedOption.querySelector('.crypto-icon');
            selectedIcon.className = iconElement.className; // Copiem toate clasele CSS
            selectedIcon.innerHTML = iconElement.innerHTML; // Copiem conținutul (text/simbol)
            
            selectedOption.querySelector('span:not(.crypto-icon)').textContent = text;
            
            // Actualizăm selectul ascuns
            hiddenSelect.value = value;
            
            // Forțăm actualizări UI pentru a evita probleme cu event handling
            // Mai întâi setăm toate valorile din header la loading
            document.getElementById('lastPrice').textContent = `$---`;
            document.getElementById('priceChange').textContent = `---`;
            document.getElementById('highPrice').textContent = `$---`;
            document.getElementById('lowPrice').textContent = `$---`;
            document.getElementById('volume').textContent = `---`;
            
            // Resetăm datele existente
            const symbol = value.split('/')[0];
            currentCoin = symbol;
            
            // Actualizăm UI-ul pentru simbolul selectat
            updateSelectedSymbolDisplay(symbol);
            
            // Arătăm indicatorul de loading
            toggleLoadingIndicator(true);
            
            console.log("[DROPDOWN] Pregătit să declanșez change pentru:", value);
            
            // Declanșăm event change pentru select
            const event = new Event('change', { bubbles: true });
            hiddenSelect.dispatchEvent(event);
            
            // Închidem dropdown-ul
            customDropdown.classList.remove('active');
            
            // Verificăm dacă event change a fost procesat corect, altfel forțăm actualizarea
            setTimeout(() => {
                if (document.getElementById('lastPrice').textContent === '$---') {
                    console.log("[DROPDOWN] Forțez fetch după timeout");
                    // Dacă încă nu avem date după 200ms, forțăm un fetch direct
                    cryptoData = {}; // Resetăm tot obiectul
                    priceChartData = {}; // Resetăm toate datele graficului
                    
                    // Resetăm timer-ul de API pentru a permite actualizarea imediată
                    lastAPICall = 0;
                    
                    // Apelăm direct fetchFromBinance
                    fetchFromBinance().then(success => {
                        if (success) {
                            console.log(`[DROPDOWN] Date actualizate cu succes pentru ${symbol}`);
                            toggleLoadingIndicator(false);
                            
                            // Reinițializăm graficul
                            if (window.priceChart) window.priceChart.destroy();
                            initChartData();
                        } else {
                            useFallbackData();
                            toggleLoadingIndicator(false);
                        }
                    }).catch(error => {
                        console.error(`[DROPDOWN] Eroare la actualizare:`, error);
                        useFallbackData();
                        toggleLoadingIndicator(false);
                    });
                }
            }, 200);
        });
    });
    
    // Inițializăm cu prima opțiune
    const firstOption = dropdownOptionItems[0];
    if (firstOption) {
        const value = firstOption.getAttribute('data-value');
        hiddenSelect.value = value;
        const symbol = value.split('/')[0];
        updateSelectedSymbolDisplay(symbol);
    }
    
    // Adăugăm un event listener global pentru taste
    document.addEventListener('keydown', (e) => {
        // Închidem dropdown-ul la apăsarea tastei Escape
        if (e.key === 'Escape') {
            customDropdown.classList.remove('active');
        }
    });
    
    // Repoziționăm la redimensionarea ferestrei
    window.addEventListener('resize', positionDropdown);
    
    // Poziționare inițială
    positionDropdown();
}

// Configurarea Chart.js
function setupChart() {
    // În Chart.js v3, plugin-urile se înregistrează automat,
    // deci nu este nevoie de înregistrare manuală
    console.log("Inițializare Chart.js și plugin-uri");
}

// Inițializarea interfaței fără a afișa valori, doar configurăm componentele
function initEmptyUI() {
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
    
    // Inițializăm graficul după ce primim datele reale
    // Nu apelăm acum initChartData
}

// Modificăm funcția inițială care afișa valori demo
function initTradingInterface() {
    // Obține perechea selectată
    const selectedPair = document.getElementById('tradingPair').value;
    
    // Actualizează valori de market cu datele reale
    // Dar doar dacă datele sunt disponibile
    if (cryptoData[selectedPair.split('/')[0]]) {
        updateMarketValues(selectedPair);
    }
}

// Modificăm funcția pentru a nu mai folosi 47000 ca preț de referință
function generateChartData(timeframe = '1d', numCandles = 200) {
    const now = new Date();
    const data = [];
    // Folosim un preț de referință neutru, nu 47000
    let lastClose = 10000 + Math.random() * 1000;
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
    const themeColors = getThemeColors();
    
    // Verificăm dacă avem date de la CoinGecko
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    
    // Folosim date de la CoinGecko dacă sunt disponibile, altfel generăm date aleatorii
    const prices = priceChartData[symbol] || 
                  generateChartData().map(item => ({
                      x: new Date(item.time),
                      y: item.close
                  }));
    
    // Creăm chart-ul principal pentru prețuri ca grafic de linie
    const priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: `${symbol}/USDT`,
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
    if (!timeframeMap[timeframe]) {
        console.error(`Timeframe invalid: ${timeframe}`);
        return;
    }

    console.log(`[TIMEFRAME] Schimbare interval la ${timeframe}`);
    currentTimeframe = timeframe;
    
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    const binanceSymbol = binanceSymbolMap[symbol];
    
    if (!binanceSymbol) {
        console.warn(`Nu există mapare Binance pentru ${symbol}`);
        return;
    }
    
    // Arătăm indicator de loading pentru grafic
    toggleChartLoading(true);
    
    // Facem fetch pentru datele istorice conform timeframe-ului selectat
    fetchHistoricalData(binanceSymbol, timeframe)
        .then(data => {
            if (data && data.length > 0) {
                // Formatul datelor primite: [[time, open, high, low, close, volume, ...], ...]
                const prices = data.map(candle => ({
                    x: new Date(candle[0]),
                    y: parseFloat(candle[4]) // close price
                }));
                
                // Actualizăm datele pentru grafic
                priceChartData[symbol] = prices;
                
                // Actualizăm graficul
                updateChartWithTimeframe(symbol, timeframe);
            } else {
                console.warn(`[TIMEFRAME] Nu s-au primit date pentru ${timeframe}`);
                // Generăm date demo dacă nu am primit nimic
                const chartData = generateChartData(timeframe);
                priceChartData[symbol] = chartData.map(item => ({
                    x: new Date(item.time),
                    y: item.close
                }));
                updateChartWithTimeframe(symbol, timeframe);
            }
        })
        .catch(error => {
            console.error(`[TIMEFRAME] Eroare la preluarea datelor pentru ${timeframe}:`, error);
            // Generăm date demo în caz de eroare
            const chartData = generateChartData(timeframe);
            priceChartData[symbol] = chartData.map(item => ({
                x: new Date(item.time),
                y: item.close
            }));
            updateChartWithTimeframe(symbol, timeframe);
        })
        .finally(() => {
            toggleChartLoading(false);
        });
}

// Funcție pentru preluarea datelor istorice de la Binance
async function fetchHistoricalData(binanceSymbol, timeframe) {
    const tf = timeframeMap[timeframe];
    
    if (!tf) {
        throw new Error(`Timeframe invalid: ${timeframe}`);
    }
    
    const klineUrl = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${tf.binanceInterval}&limit=${tf.limit}`;
    console.log(`[TIMEFRAME] Fetch URL: ${klineUrl}`);
    
    try {
        const response = await fetch(klineUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[TIMEFRAME] Primite ${data.length} candle-uri pentru ${binanceSymbol} (${timeframe})`);
        return data;
    } catch (error) {
        console.error(`[TIMEFRAME] Eroare fetch: ${error.message}`);
        throw error;
    }
}

// Funcție pentru actualizarea graficului cu noile date și timeframe
function updateChartWithTimeframe(symbol, timeframe) {
    if (!window.priceChart || !priceChartData[symbol]) {
        console.warn(`[TIMEFRAME] Nu există grafic sau date pentru ${symbol}`);
        return;
    }
    
    const priceChart = window.priceChart;
    const tf = timeframeMap[timeframe];
    
    // Actualizăm datele
    priceChart.data.datasets[0].data = priceChartData[symbol];
    
    // Actualizăm opțiunile pentru axa X
    priceChart.options.scales.x.time.unit = tf.chartUnit;
    priceChart.options.scales.x.time.displayFormats = {
        [tf.chartUnit]: tf.displayFormat
    };
    
    // Actualizăm titlul
    priceChart.data.datasets[0].label = `${symbol}/USDT (${timeframe})`;
    
    // Aplicăm modificările
    priceChart.update();
    console.log(`[TIMEFRAME] Grafic actualizat pentru ${symbol} cu intervalul ${timeframe}`);
}

// Funcție pentru afișarea/ascunderea loading-ului pe grafic
function toggleChartLoading(show) {
    const chartContainer = document.querySelector('.chart-container');
    
    if (!chartContainer) return;
    
    if (show) {
        // Verificăm dacă există deja un indicator de loading
        if (!document.getElementById('chartLoadingIndicator')) {
            const loader = document.createElement('div');
            loader.id = 'chartLoadingIndicator';
            loader.innerHTML = '<div class="spinner"></div><span>Loading data...</span>';
            loader.style.position = 'absolute';
            loader.style.top = '50%';
            loader.style.left = '50%';
            loader.style.transform = 'translate(-50%, -50%)';
            loader.style.backgroundColor = 'rgba(15, 23, 42, 0.8)';
            loader.style.padding = '15px 20px';
            loader.style.borderRadius = '8px';
            loader.style.display = 'flex';
            loader.style.alignItems = 'center';
            loader.style.zIndex = '100';
            
            // Stiluri pentru spinner
            const style = document.createElement('style');
            style.textContent = `
                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 3px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: #10b981;
                    animation: spin 1s ease-in-out infinite;
                    margin-right: 10px;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(loader);
        }
    } else {
        // Eliminăm loading-ul dacă există
        const loader = document.getElementById('chartLoadingIndicator');
        if (loader) {
            loader.remove();
        }
    }
}

// Actualizare periodică optimizată
function startPriceUpdates() {
    const UPDATE_INTERVAL = 10000;
    fetchCryptoData();
    priceUpdateInterval = setInterval(() => {
        const selectedPair = document.getElementById('tradingPair').value;
        const symbol = selectedPair.split('/')[0];
        if (!document.hidden) {
            fetchCryptoData();
            updateChart(symbol);
            populateOrderBook(cryptoData[symbol]?.price);
            // Eliminăm apelul către populateTradeHistory() pentru a nu genera automat
            // istoricul de tranzacții la fiecare actualizare
        }
    }, UPDATE_INTERVAL);
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchCryptoData();
});

// Modificăm event listener-ul pentru perechea de tranzacționare pentru forțare mai puternică
const tradingPairEl = document.getElementById('tradingPair');
if (tradingPairEl) {
    tradingPairEl.addEventListener('change', function(event) {
        const pair = this.value;
        const symbol = pair.split('/')[0];
        currentCoin = symbol;
        
        console.log(`[CHANGE EVENT] Schimbare monedă către ${pair}, source:`, event.target.id);
        
        // Actualizăm textul simbolului în UI
        updateSelectedSymbolDisplay(symbol);
        
        // Arătăm indicatorul de loading
        toggleLoadingIndicator(true);
        
        // *** HACK PENTRU A FORȚA CURĂȚAREA DATELOR VECHI ***
        // Mai întâi setăm toate valorile din header la zero/loading
        document.getElementById('lastPrice').textContent = `$---`;
        document.getElementById('priceChange').textContent = `---`;
        document.getElementById('highPrice').textContent = `$---`;
        document.getElementById('lowPrice').textContent = `$---`;
        document.getElementById('volume').textContent = `---`;
        
        // Resetăm datele existente
        cryptoData = {}; // Resetăm tot obiectul, nu doar moneda curentă
        priceChartData = {}; // Resetăm toate datele graficului
        
        console.log(`[CHANGE EVENT] Forțăm actualizarea completă pentru ${pair}`);
        
        // Resetăm timer-ul de API pentru a permite actualizarea imediată
        lastAPICall = 0;
        
        // Adăugăm un setTimeout suplimentar pentru a ne asigura că UI-ul este actualizat
        setTimeout(() => {
            // Apelăm direct fetchFromBinance pentru a sări peste verificările de throttling
            fetchFromBinance().then(success => {
                if (success) {
                    console.log(`[CHANGE EVENT] Date actualizate cu succes pentru ${pair}`);
                    
                    // Forțăm actualizarea UI-ului direct din callback pentru a evita race conditions
                    const data = cryptoData[symbol];
                    if (data) {
                        // Verificăm încă o dată ce monedă este selectată acum
                        const currentSelectedPair = document.getElementById('tradingPair').value;
                        if (currentSelectedPair === pair) {
                            // Actualizăm manual toate elementele din UI
                            document.getElementById('lastPrice').textContent = `$${data.price.toFixed(2)}`;
                            
                            const priceChangeText = (data.priceChange24h >= 0 ? '+' : '') + data.priceChange24h.toFixed(2) + '%';
                            document.getElementById('priceChange').textContent = priceChangeText;
                            document.getElementById('priceChange').className = data.priceChange24h >= 0 ? 'positive' : 'negative';
                            
                            document.getElementById('highPrice').textContent = `$${data.high24h.toFixed(2)}`;
                            document.getElementById('lowPrice').textContent = `$${data.low24h.toFixed(2)}`;
                            document.getElementById('volume').textContent = data.volume;
                            
                            document.getElementById('orderPrice').value = data.price.toFixed(2);
                            document.getElementById('orderBookPrice').textContent = `$${data.price.toFixed(2)}`;

                            console.log(`[CHANGE EVENT] UI actualizat manual pentru ${symbol} cu prețul ${data.price}`);
                        }
                    }
                    
                    // Ascundem loading-ul după ce datele sunt încărcate
                    toggleLoadingIndicator(false);
                    
                    // Reinițializăm graficul doar dacă fetch-ul a reușit
                    if (window.priceChart) window.priceChart.destroy();
                    initChartData();
                } else {
                    console.warn(`[CHANGE EVENT] Nu s-au putut prelua date pentru ${pair}, folosim fallback`);
                    useFallbackData();
                    
                    // Ascundem loading-ul
                    toggleLoadingIndicator(false);
                    
                    // Reinițializăm graficul oricum
                    if (window.priceChart) window.priceChart.destroy();
                    initChartData();
                }
            }).catch(error => {
                console.error(`[CHANGE EVENT] Eroare la preluarea datelor pentru ${pair}:`, error);
                useFallbackData();
                
                // Ascundem loading-ul în caz de eroare
                toggleLoadingIndicator(false);
                
                // Reinițializăm graficul chiar și cu eroare
                if (window.priceChart) window.priceChart.destroy();
                initChartData();
            });
        }, 50); // O mică pauză pentru a permite UI-ului să se actualizeze înainte de fetch
    });
}

// Schimb logica de fetch să folosească API-ul Binance în loc de CoinGecko
async function fetchCryptoData() {
    const now = Date.now();
    if (now - lastAPICall < API_CALL_DELAY) return;
    try {
        const success = await fetchFromBinance();
        if (!success) throw new Error('Binance nu a returnat date');
        lastAPICall = now;
    } catch (error) {
        console.error('Eroare la preluarea datelor:', error);
        useFallbackData();
        showAPIErrorMessage();
    }
}

// Mapare simboluri pentru API-ul Binance
const binanceSymbolMap = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'BNB': 'BNBUSDT',
    'XRP': 'XRPUSDT',
    'ADA': 'ADAUSDT',
    'SOL': 'SOLUSDT',
    'DOT': 'DOTUSDT',
    'DOGE': 'DOGEUSDT'
};

// Fetch de la API-ul Binance
async function fetchFromBinance() {
    try {
        const selectedPair = document.getElementById('tradingPair').value;
        const symbol = selectedPair.split('/')[0];
        const binanceSymbol = binanceSymbolMap[symbol];
        
        if (!binanceSymbol) {
            console.warn(`Moneda ${symbol} nu are mapare Binance`);
            return false;
        }
        
        console.log(`Încercăm fetch Binance pentru ${binanceSymbol}...`);
        
        // API Binance pentru prețul ticker (24h stats)
        const tickerUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
        console.log(`Fetch ticker URL: ${tickerUrl}`);
        
        let tickerResponse;
        try {
            tickerResponse = await fetch(tickerUrl);
            console.log(`Răspuns ticker status: ${tickerResponse.status}`);
        } catch (err) {
            console.error(`Eroare la fetch ticker: ${err.message}`);
            throw err;
        }
        
        if (!tickerResponse.ok) {
            console.error(`Răspuns ticker negativ: ${tickerResponse.status} ${tickerResponse.statusText}`);
            throw new Error(`Eroare Binance API: ${tickerResponse.status}`);
        }
        
        const tickerData = await tickerResponse.json();
        console.log(`Date ticker primite pentru ${binanceSymbol}:`, tickerData);
        
        // Verificăm dacă formatul datelor este cel așteptat
        if (!tickerData.lastPrice || !tickerData.highPrice || !tickerData.lowPrice) {
            console.error(`Date ticker invalide sau incomplete:`, tickerData);
            throw new Error(`Date ticker invalide pentru ${binanceSymbol}`);
        }
        
        // API Binance pentru date kline/candlestick (pentru grafic)
        const klineUrl = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=15m&limit=100`;
        console.log(`Fetch kline URL: ${klineUrl}`);
        
        let klineResponse;
        try {
            klineResponse = await fetch(klineUrl);
            console.log(`Răspuns kline status: ${klineResponse.status}`);
        } catch (err) {
            console.error(`Eroare la fetch kline: ${err.message}`);
            throw err;
        }
        
        if (!klineResponse.ok) {
            console.error(`Răspuns kline negativ: ${klineResponse.status} ${klineResponse.statusText}`);
            throw new Error(`Eroare Binance Kline API: ${klineResponse.status}`);
        }
        
        const klineData = await klineResponse.json();
        console.log(`Primite ${klineData.length} candle-uri pentru ${binanceSymbol}`);
        
        // Verificăm moneda selectată curent pentru a ne asigura că nu s-a schimbat între timp
        const currentPair = document.getElementById('tradingPair').value;
        if (currentPair !== selectedPair) {
            console.warn(`Moneda selectată s-a schimbat între timp (${selectedPair} → ${currentPair}), anulăm procesarea`);
            return false;
        }
        
        // Procesăm datele
        processBinanceData(symbol, tickerData, klineData);
        console.log(`Date procesate cu succes pentru ${symbol}`);
        return true;
    } catch (error) {
        console.error(`Eroare Binance pentru ${document.getElementById('tradingPair').value.split('/')[0]}:`, error);
        usingRealData = false;
        return false;
    }
}

// Modificăm processBinanceData pentru a actualiza și graficul cu timeframe-ul curent
function processBinanceData(symbol, tickerData, klineData) {
    // Ticker data format:
    // {"symbol":"BTCUSDT","priceChange":"-1071.81000000","priceChangePercent":"-2.157","weightedAvgPrice":"49208.43443907","prevClosePrice":"49688.67000000","lastPrice":"48616.86000000",...
    const currentPrice = parseFloat(tickerData.lastPrice);
    const priceChangePercent = parseFloat(tickerData.priceChangePercent);
    const high24h = parseFloat(tickerData.highPrice);
    const low24h = parseFloat(tickerData.lowPrice);
    const volume24h = parseFloat(tickerData.volume);
    
    // Verificăm din nou dacă moneda selectată în UI este cea pentru care procesăm datele
    const currentSelectedPair = document.getElementById('tradingPair').value;
    const currentSymbol = currentSelectedPair.split('/')[0];
    
    if (currentSymbol !== symbol) {
        console.warn(`Moneda selectată s-a schimbat între procesarea datelor (${symbol} → ${currentSymbol}), anulăm actualizarea`);
        return;
    }
    
    console.log(`Procesăm datele pentru ${symbol}, preț: ${currentPrice}`);
    
    // Stocare date pentru UI
    cryptoData[symbol] = {
        price: currentPrice,
        priceChange24h: priceChangePercent,
        high24h: high24h,
        low24h: low24h,
        volume: formatVolume(volume24h * currentPrice), // Convert to USD volume
        lastUpdated: new Date()
    };
    
    // Procesare date pentru grafic
    // Kline data format: [[time, open, high, low, close, volume, closetime, quote asset volume,...], ...]
    const prices = klineData.map(candle => ({
        x: new Date(candle[0]),
        y: parseFloat(candle[4]) // close price
    }));
    
    priceChartData[symbol] = prices;
    
    // Setăm flag-ul de date reale
    usingRealData = true;
    
    // *** ACTUALIZARE FORȚATĂ DIRECTĂ ***
    // Actualizăm direct elementele din UI pentru a evita orice probleme de sincronizare
    document.getElementById('lastPrice').textContent = `$${currentPrice.toFixed(2)}`;
    
    const priceChangeText = (priceChangePercent >= 0 ? '+' : '') + priceChangePercent.toFixed(2) + '%';
    document.getElementById('priceChange').textContent = priceChangeText;
    document.getElementById('priceChange').className = priceChangePercent >= 0 ? 'positive' : 'negative';
    
    document.getElementById('highPrice').textContent = `$${high24h.toFixed(2)}`;
    document.getElementById('lowPrice').textContent = `$${low24h.toFixed(2)}`;
    document.getElementById('volume').textContent = formatVolume(volume24h * currentPrice);
    
    document.getElementById('orderPrice').value = currentPrice.toFixed(2);
    document.getElementById('orderBookPrice').textContent = `$${currentPrice.toFixed(2)}`;
    
    // Actualizare UI
    updateMarketValues(currentSelectedPair);
    
    // Actualizăm graficul cu timeframe-ul curent
    updateChartWithTimeframe(symbol, currentTimeframe);
    
    // Indicator vizual pentru utilizator
    showDataSourceIndicator(true, `Binance: ${currentPrice.toFixed(2)} USD`);
}

// Funcție modificată pentru indicator de sursă date - dezactivată
function showDataSourceIndicator(isReal, priceText = '') {
    // Nu mai afișăm nimic, doar logăm în consolă
    if (isReal) {
        console.log(`Date reale folosite: ${priceText}`);
    } else {
        console.warn('Date demo folosite (fallback)');
    }
    
    // Ștergem indicator-ul existent dacă există
    const existingIndicator = document.getElementById('dataSourceIndicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
}

// Modificare funcția useFallbackData să afișeze indicator pentru date demo
function useFallbackData() {
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    if (!marketData[selectedPair]) return;
    
    // Setăm flag-ul de date demo
    usingRealData = false;
    
    // Generare date simulate realiste
    const basePrice = marketData[selectedPair].lastPrice;
    const fluctuation = Math.random() * 0.02 * basePrice; // ±2%
    cryptoData[symbol] = {
        price: basePrice + fluctuation,
        priceChange24h: Math.random() * 4 - 2, // între -2% și +2%
        high24h: basePrice * 1.03,
        low24h: basePrice * 0.97,
        volume: marketData[selectedPair].volume,
        lastUpdated: new Date()
    };
    
    // Generare date istorice simulate
    generateHistoricalData(symbol);
    
    updateMarketValues(selectedPair);
    
    // Indicator vizual pentru utilizator
    showDataSourceIndicator(false);
}

// Actualizare dinamică a întregii interfețe
function updateMarketValues(pair) {
    const symbol = pair.split('/')[0];
    let data = cryptoData[symbol];

    // Verificăm dacă moneda selectată în UI este aceeași cu cea pentru care actualizăm
    const currentSelectedPair = document.getElementById('tradingPair').value;
    if (currentSelectedPair !== pair) {
        console.log(`Moneda selectată s-a schimbat între timp (${pair} → ${currentSelectedPair}), nu actualizăm UI-ul`);
        return;
    }

    // Dacă nu există date reale, construim un obiect compatibil din marketData
    if (!data || typeof data.price !== 'number' || isNaN(data.price)) {
        const fallback = marketData[pair];
        if (!fallback) {
            console.warn('Date lipsă complet pentru', symbol, pair);
            return;
        }
        data = {
            price: fallback.lastPrice,
            priceChange24h: fallback.priceChange,
            high24h: fallback.high24h,
            low24h: fallback.low24h,
            volume: fallback.volume,
            lastUpdated: new Date()
        };
    }

    console.log(`Actualizare UI pentru ${pair} cu prețul ${data.price}`);

    // Actualizăm interfața cu datele (reale sau fallback)
    document.getElementById('lastPrice').textContent = `$${data.price.toFixed(2)}`;
    
    // Folosim direct priceChange24h din API în loc să calculăm față de valorile demo
    const priceChangeText = (data.priceChange24h >= 0 ? '+' : '') + data.priceChange24h.toFixed(2) + '%';
    document.getElementById('priceChange').textContent = priceChangeText;
    document.getElementById('priceChange').className = data.priceChange24h >= 0 ? 'positive' : 'negative';
    
    // Actualizăm și valorile de high, low și volume
    document.getElementById('highPrice').textContent = `$${data.high24h.toFixed(2)}`;
    document.getElementById('lowPrice').textContent = `$${data.low24h.toFixed(2)}`;
    document.getElementById('volume').textContent = data.volume;

    // Actualizăm prețul în alte componente UI
    document.getElementById('orderPrice').value = data.price.toFixed(2);
    document.getElementById('orderBookPrice').textContent = `$${data.price.toFixed(2)}`;

    // Actualizăm graficul
    if (window.priceChart && priceChartData[symbol]) {
        window.priceChart.data.datasets[0].data = priceChartData[symbol];
        window.priceChart.data.datasets[0].label = `${symbol}/USDT`;
        window.priceChart.update();
    }

    // Regenerăm orderbook și istoric
    populateOrderBook(data.price);
    populateTradeHistory();
}

// Populăm orderbook-ul cu date demo sau bazate pe prețul actual
function populateOrderBook(basePrice) {
    const sellOrders = document.getElementById('sellOrders');
    const buyOrders = document.getElementById('buyOrders');
    
    if (!sellOrders || !buyOrders) return;
    
    // Curățăm conținutul existent
    sellOrders.innerHTML = '';
    buyOrders.innerHTML = '';
    
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    basePrice = basePrice || (cryptoData[symbol]?.price || 1000);
    
    // Aflăm simbolul monedei curente pentru afișare corectă în header-ul orderbook
    // Actualizăm header-ul la amount pentru orderbook
    const amountHeader = document.querySelector('.book-header span:nth-child(2)');
    if (amountHeader) {
        amountHeader.textContent = `Amount (${symbol})`;
    }
    
    // Generăm ordine de vânzare (în ordine descrescătoare)
    for (let i = 10; i > 0; i--) {
        const price = basePrice + (i * 50 + Math.random() * 20);
        const amount = 0.01 + Math.random() * 0.5;
        const total = price * amount;
        
        // Adăugăm adâncime de piață - folosim o scală mai mică pentru noua stilizare
        const depth = Math.random() * 0.8 + 0.1; // între 10% și 90%
        
        const orderRow = document.createElement('div');
        orderRow.className = 'sell-order-row';
        orderRow.innerHTML = `
            <span class="price">$${price.toFixed(2)}</span>
            <span class="amount">${amount.toFixed(5)}</span>
            <span class="total">$${total.toFixed(2)}</span>
            <div class="order-depth sell-depth" style="height: ${depth * 100}%"></div>
        `;
        
        sellOrders.appendChild(orderRow);
    }
    
    // Generăm ordine de cumpărare
    for (let i = 1; i <= 10; i++) {
        const price = basePrice - (i * 50 + Math.random() * 20);
        const amount = 0.01 + Math.random() * 0.5;
        const total = price * amount;
        
        // Adăugăm adâncime de piață - folosim o scală mai mică pentru noua stilizare
        const depth = Math.random() * 0.8 + 0.1; // între 10% și 90%
        
        const orderRow = document.createElement('div');
        orderRow.className = 'buy-order-row';
        orderRow.innerHTML = `
            <span class="price">$${price.toFixed(2)}</span>
            <span class="amount">${amount.toFixed(5)}</span>
            <span class="total">$${total.toFixed(2)}</span>
            <div class="order-depth buy-depth" style="height: ${depth * 100}%"></div>
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
    
    // Nu mai generăm date demo, lăsăm istoricul gol la început
    // Tranzacțiile vor fi adăugate doar când utilizatorul face Buy/Sell
    
    // Adăugăm un mesaj pentru utilizator
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-trades-message';
    emptyMessage.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <p>Tranzacțiile tale vor apărea aici după ce plasezi un ordin de Buy sau Sell</p>
    `;
    tradeHistory.appendChild(emptyMessage);
    
    // Adăugăm stiluri pentru mesajul de "no trades"
    const style = document.createElement('style');
    style.textContent = `
        .empty-trades-message {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px 15px;
            color: var(--secondary-text-color);
            text-align: center;
            font-size: 0.9rem;
        }
        
        .empty-trades-message i {
            font-size: 2rem;
            margin-bottom: 10px;
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);
}

// Adăugăm o tranzacție nouă în istoricul de tranzacții
function addTradeToHistory(price, amount, isBuy) {
    const tradeHistory = document.getElementById('tradeHistory');
    if (!tradeHistory) return;
    
    // Verificăm dacă există mesajul de tranzacții goale și îl ștergem
    const emptyMessage = tradeHistory.querySelector('.empty-trades-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Obținem simbolul monedei curente
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    
    const tradeRow = document.createElement('div');
    tradeRow.className = `trade-row ${isBuy ? 'buy' : 'sell'}`;
    tradeRow.innerHTML = `
        <span class="price">$${price.toFixed(2)}</span>
        <span class="amount">${amount.toFixed(5)} ${symbol}</span>
        <span class="time">${timeStr}</span>
    `;
    
    // Adăugăm tranzacția nouă la începutul listei
    if (tradeHistory.firstChild) {
        tradeHistory.insertBefore(tradeRow, tradeHistory.firstChild);
    } else {
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
    
    // Adăugăm și tranzacția în istoricul de tranzacții
    // side poate fi 'Buy', 'Sell', 'Long', 'Short', 'Bought (Margin)', 'Sold (Margin)'
    const isBuy = side.toLowerCase().includes('buy') || side.toLowerCase().includes('long') || side.toLowerCase().includes('bought');
    addTradeToHistory(price, amount, isBuy);
}

// Procesăm un ordin nou
function processOrder() {
    // Obținem datele din formular
    const pair = document.getElementById('tradingPair').value;
    const orderType = document.querySelector('.order-type-btn.active')?.getAttribute('data-order-type') || 'limit';
    const side = document.querySelector('.action-tab-btn.active')?.getAttribute('data-action') || 'buy';
    let price = parseFloat(document.getElementById('orderPrice').value);
    let amount = parseFloat(document.getElementById('orderAmount').value);
    let stopPrice = null;
    let limitPrice = null;

    // Determinăm tipul de tranzacționare activ
    const tradeType = document.querySelector('.nav-tab.active')?.getAttribute('data-trade-type') || 'spot';

    // Pentru Market, folosim prețul pieței
    if (orderType === 'market') {
        // Încearcă să folosești prețul din cryptoData sau marketData
        const symbol = pair.split('/')[0];
        if (window.cryptoData && window.cryptoData[symbol] && window.cryptoData[symbol].price) {
            price = window.cryptoData[symbol].price;
        } else if (window.marketData && window.marketData[pair] && window.marketData[pair].lastPrice) {
            price = window.marketData[pair].lastPrice;
        }
    }

    // Pentru Stop-Limit, citește stopPrice și limitPrice
    if (orderType === 'stop') {
        stopPrice = parseFloat(document.getElementById('orderStopPrice')?.value);
        limitPrice = parseFloat(document.getElementById('orderLimitPrice')?.value);
        // Validare
        if (isNaN(stopPrice) || stopPrice <= 0) {
            alert('Introduceți un Stop Price valid');
            return;
        }
        if (isNaN(limitPrice) || limitPrice <= 0) {
            alert('Introduceți un Limit Price valid');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Introduceți o cantitate validă');
            return;
        }
        // Simulăm: când prețul pieței ajunge la stopPrice, plasăm un limit la limitPrice
        // Pentru demo, executăm direct limitul dacă stopPrice <= prețul pieței (buy) sau >= (sell)
        const symbol = pair.split('/')[0];
        let marketPrice = '';
        if (window.cryptoData && window.cryptoData[symbol] && window.cryptoData[symbol].price) {
            marketPrice = window.cryptoData[symbol].price.toFixed(2);
        } else if (window.marketData && window.marketData[pair] && window.marketData[pair].lastPrice) {
            marketPrice = window.marketData[pair].lastPrice.toFixed(2);
        } else {
            // Fallback: citește din UI
            const lastPriceEl = document.getElementById('lastPrice');
            if (lastPriceEl && lastPriceEl.textContent) {
                marketPrice = lastPriceEl.textContent.replace(/[^0-9.]/g, '');
            }
        }
        if (!marketPrice || marketPrice === '0' || marketPrice === '0.00') {
            marketPrice = '1.00'; // fallback de siguranță
        }
        let stopTriggered = false;
        if (side === 'buy' && marketPrice >= stopPrice) stopTriggered = true;
        if (side === 'sell' && marketPrice <= stopPrice) stopTriggered = true;
        if (stopTriggered) {
            price = limitPrice;
            // Continuă ca la un ordin limit
        } else {
            alert('Ordinul Stop-Limit nu a fost activat (prețul pieței nu a atins stop-ul).');
            return;
        }
    }

    // Validare pentru Limit și Market
    if (orderType !== 'stop') {
        if (orderType !== 'market' && (isNaN(price) || price <= 0)) {
            alert('Introduceți un preț valid');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Introduceți o cantitate validă');
            return;
        }
    }

    // Verificăm balanța disponibilă în funcție de tipul de tranzacționare
    let balance = 15432.21; // Valoarea pentru spot
    if (tradeType === 'margin') {
        balance = 46296.63; // 3x leverage
    } else if (tradeType === 'futures') {
        balance = 77161.05; // 5x leverage
    }
    // Suprascrie cu balanța reală dacă există
    const walletData = localStorage.getItem('wallet');
    if (walletData) {
        const wallet = JSON.parse(walletData);
        balance = wallet.totalBalance || balance;
        if (tradeType === 'margin') balance *= 3;
        if (tradeType === 'futures') balance *= 5;
    }

    const total = price * amount;

    if (side === 'buy' && total > balance) {
        alert(`Fonduri insuficiente pentru această tranzacție (${tradeType})`);
        return;
    }

    // Generăm texte specifice pentru fiecare tip de tranzacționare
    let actionText, typeText;
    if (tradeType === 'futures') {
        actionText = side === 'buy' ? 'Long' : 'Short';
        typeText = 'Futures';
    } else if (tradeType === 'margin') {
        actionText = side === 'buy' ? 'Bought (Margin)' : 'Sold (Margin)';
        typeText = 'Margin';
    } else {
        actionText = side === 'buy' ? 'Bought' : 'Sold';
        typeText = orderType.charAt(0).toUpperCase() + orderType.slice(1);
    }

    // Procesăm ordinul instant (în versiunea demo)
    addOrderToHistory(actionText, typeText, pair, price, amount);

    // Notificare specială pentru Stop-Limit
    let extraMsg = '';
    if (orderType === 'stop') {
        extraMsg = ` (Stop: $${stopPrice}, Limit: $${limitPrice})`;
    }

    // Actualizăm datele și UI-ul
    const leverageText = tradeType !== 'spot' ? 
        ` cu ${tradeType === 'margin' ? '3x' : '5x'} leverage` : '';

    const successMsg = `${side === 'buy' ? (tradeType === 'futures' ? 'Long' : 'Cumpărat') : 
        (tradeType === 'futures' ? 'Short' : 'Vândut')} ${amount.toFixed(5)} ${pair.split('/')[0]} 
        pentru $${total.toFixed(2)}${leverageText}${extraMsg}`;

    // Afișăm un mesaj de succes
    const notification = document.createElement('div');
    notification.className = 'trade-notification';
    notification.innerHTML = `
        <div class="notification-icon ${side === 'buy' ? 'buy' : 'sell'}">
            <i class="fas fa-${side === 'buy' ? 'arrow-down' : 'arrow-up'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${side === 'buy' ? 
                (tradeType === 'futures' ? 'Long' : 'Cumpărare') : 
                (tradeType === 'futures' ? 'Short' : 'Vânzare')} reușită (${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)})</div>
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
    if (document.getElementById('orderStopPrice')) document.getElementById('orderStopPrice').value = '';
    if (document.getElementById('orderLimitPrice')) document.getElementById('orderLimitPrice').value = '';
}

// Configurăm event listeners
function setupEventListeners() {
    // Adăugăm listener pentru butoanele de tip de tranzacționare (Spot, Margin, Futures)
    const tradeTypeButtons = document.querySelectorAll('.nav-tab');
    
    // Setăm tipul de tranzacție curent
    let currentTradeType = 'spot'; // Default: spot
    
    // Funcție pentru actualizarea UI în funcție de tipul de tranzacționare
    function updateTradeTypeUI(tradeType) {
        // Actualizăm stilul butoanelor
        tradeTypeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-trade-type') === tradeType) {
                btn.classList.add('active');
            }
        });
        
        // De asemenea actualizăm și atributul data-tab pentru compatibilitate cu alte funcții existente
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tradeType) {
                btn.classList.add('active');
            }
        });
        
        // Actualizăm afișarea balanței disponibile în funcție de tipul de tranzacționare
        const balanceValue = document.getElementById('availableBalance');
        if (balanceValue) {
            const walletData = localStorage.getItem('wallet');
            let balance = 0;
            if (walletData) {
                const wallet = JSON.parse(walletData);
                balance = wallet.totalBalance || 0;
            }
            if (tradeType === 'spot') {
                balanceValue.textContent = '$' + balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else if (tradeType === 'margin' || tradeType === 'futures') {
                // Citește leverage-ul din slider dacă există
                let leverage = 1;
                const leverageSlider = document.getElementById('leverageSlider');
                if (leverageSlider) {
                    leverage = parseInt(leverageSlider.value) || 1;
                } else {
                    leverage = tradeType === 'margin' ? 3 : 5;
                }
                balanceValue.textContent = '$' + (balance * leverage).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }
        
        // Actualizăm eticheta pentru Buy/Sell button pentru futures
        const buyBtn = document.querySelector('.action-tab-btn[data-action="buy"]');
        const sellBtn = document.querySelector('.action-tab-btn[data-action="sell"]');
        
        if (buyBtn && sellBtn) {
            if (tradeType === 'futures') {
                buyBtn.textContent = 'Long';
                sellBtn.textContent = 'Short';
            } else {
                buyBtn.textContent = 'Buy';
                sellBtn.textContent = 'Sell';
            }
        }
        
        // Afișăm/ascundem opțiunile specifice pentru fiecare tip de tranzacționare
        const leverageOptions = document.getElementById('leverageOptions');
        if (leverageOptions) {
            leverageOptions.style.display = (tradeType !== 'spot') ? 'block' : 'none';
        }
        
        // Actualizăm butonul principal de tranzacționare
        const mainBtn = document.getElementById('buyBtcBtn');
        if (mainBtn) {
            const symbol = document.getElementById('tradingPair').value.split('/')[0];
            if (tradeType === 'futures') {
                mainBtn.textContent = document.querySelector('.action-tab-btn.active')?.getAttribute('data-action') === 'buy' ? 
                    `Long ${symbol}` : `Short ${symbol}`;
            } else {
                mainBtn.textContent = document.querySelector('.action-tab-btn.active')?.getAttribute('data-action') === 'buy' ? 
                    `Buy ${symbol}` : `Sell ${symbol}`;
            }
        }
        
        // Salvăm tipul curent pentru a putea fi folosit în alte funcții
        currentTradeType = tradeType;
        
        // Afișăm o notificare despre schimbarea tipului de tranzacționare
        const typeNames = {
            'spot': 'Spot Trading',
            'margin': 'Margin Trading (3x Leverage)',
            'futures': 'Futures Trading (5x Leverage)'
        };
        
        const notification = document.createElement('div');
        notification.className = 'trade-notification';
        notification.innerHTML = `
            <div class="notification-icon ${tradeType}">
                <i class="fas fa-exchange-alt"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">Switched to ${typeNames[tradeType]}</div>
                <div class="notification-message">Trading interface updated</div>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
    
    // Adăugăm event listener pentru fiecare buton de tip tranzacționare
    tradeTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tradeType = this.getAttribute('data-trade-type');
            if (tradeType && tradeType !== currentTradeType) {
                updateTradeTypeUI(tradeType);
            }
        });
    });
    
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
            
            const orderType = this.getAttribute('data-order-type');
            const priceInput = document.getElementById('orderPrice');
            let marketPrice = getCurrentMarketPrice();
            
            if (orderType === 'market') {
                priceInput.disabled = true;
                priceInput.classList.add('locked');
                priceInput.value = marketPrice;
            } else if (orderType === 'stop') {
                priceInput.disabled = false;
                priceInput.classList.remove('locked');
                priceInput.value = marketPrice;
            } else if (orderType === 'limit') {
                priceInput.disabled = false;
                priceInput.classList.remove('locked');
                if (!priceInput.value || priceInput.value === '0' || parseFloat(priceInput.value) === 0) {
                    priceInput.value = marketPrice;
                }
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
            const placeOrderBtn = document.getElementById('buyBtcBtn');
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
                
                // Adăugăm clasa active doar la butonul curent
                sliderButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            } else {
                alert('Introduceți un preț valid înainte de a selecta procentul');
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
    const placeOrderBtn = document.getElementById('buyBtcBtn');
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
        
        .notification-icon.spot {
            background-color: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
        }
        
        .notification-icon.margin {
            background-color: rgba(217, 119, 6, 0.2);
            color: #d97706;
        }
        
        .notification-icon.futures {
            background-color: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
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
        
        /* Stiluri pentru butoanele de procent active */
        .slider-btn.active {
            background-color: rgba(16, 185, 129, 0.2);
            border-color: var(--positive-color);
            color: var(--positive-color);
            font-weight: bold;
        }
        
        /* Stiluri pentru hover pe butoanele de procent */
        .slider-btn:hover {
            background-color: rgba(16, 185, 129, 0.1);
        }
        
        /* Stiluri pentru butoanele de tip tranzacționare (Spot, Margin, Futures) */
        .nav-tab {
            opacity: 0.7;
            transition: all 0.3s ease;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            padding-bottom: 5px;
        }
        
        .nav-tab.active {
            opacity: 1;
            border-bottom: 2px solid #3b82f6;
            font-weight: bold;
        }
        
        .nav-tab:hover {
            opacity: 0.9;
        }
        
        /* Stiluri pentru opțiunile de leverage (pentru Margin și Futures) */
        #leverageOptions {
            display: none;
            margin-top: 15px;
            margin-bottom: 15px;
            background-color: rgba(59, 130, 246, 0.1);
            padding: 10px;
            border-radius: 8px;
            font-size: 0.9rem;
        }
        
        .leverage-slider {
            width: 100%;
            margin-top: 8px;
        }
        
        .leverage-value {
            font-weight: bold;
            color: #3b82f6;
        }
    `;
    document.head.appendChild(style);
})();

// Funcție pentru a arăta/ascunde indicatorul de loading
function toggleLoadingIndicator(show) {
    const statItems = document.querySelectorAll('.stat-value');
    
    statItems.forEach(item => {
        if (show) {
            // Salvăm conținutul curent dacă nu este "---"
            if (item.textContent !== '$---.--' && item.textContent !== '---') {
                item.setAttribute('data-original', item.textContent);
            }
            item.classList.add('loading');
            item.textContent = item.id === 'priceChange' ? 'Loading...' : 'Loading...';
        } else {
            item.classList.remove('loading');
            // Dacă nu avem conținut salvat, lăsăm textul actualizat de updateMarketValues
            if (item.getAttribute('data-original')) {
                item.textContent = item.getAttribute('data-original');
                item.removeAttribute('data-original');
            }
        }
    });
}

// Modificăm initCryptoAPI pentru a arăta loading
function initCryptoAPI() {
    console.log("Inițializare API, preluare date inițiale...");
    
    // Arătăm indicatorul de loading
    toggleLoadingIndicator(true);
    
    // Forțăm actualizarea imediată, ignorând throttling
    lastAPICall = 0;
    
    // Obținem datele imediat pentru perechea activă
    fetchFromBinance().then(success => {
        // Ascundem loading-ul
        toggleLoadingIndicator(false);
        
        if (success) {
            console.log("Date inițiale preluate cu succes de la Binance");
            const selectedPair = document.getElementById('tradingPair').value;
            updateMarketValues(selectedPair);
            
            // Inițializăm graficul după ce avem datele
            initChartData();
            populateOrderBook();
            // Nu mai apelăm populateTradeHistory() la inițializare
            
        } else {
            console.warn("Nu s-au putut prelua date inițiale de la Binance, folosim fallback");
            useFallbackData();
            
            // Inițializăm graficul chiar și cu datele de fallback
            initChartData();
            populateOrderBook();
            // Nu mai apelăm populateTradeHistory() la inițializare
        }
    }).catch(error => {
        // Ascundem loading-ul și în caz de eroare
        toggleLoadingIndicator(false);
        
        console.error("Eroare la preluarea datelor inițiale:", error);
        useFallbackData();
        
        // Inițializăm graficul chiar și cu eroare
        initChartData();
        populateOrderBook();
        // Nu mai apelăm populateTradeHistory() la inițializare
    });
}

// Stiluri CSS pentru loading
(function addLoadingStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .stat-value.loading {
            position: relative;
            color: transparent;
            overflow: hidden;
        }
        
        .stat-value.loading::after {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 300%;
            height: 100%;
            background: linear-gradient(90deg, 
                          transparent, 
                          rgba(255, 255, 255, 0.2), 
                          transparent);
            animation: loading-shimmer 1.5s infinite;
        }
        
        @keyframes loading-shimmer {
            0% { transform: translateX(0); }
            100% { transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
})();

// Afișează un mesaj de eroare pentru probleme cu API-ul
function showAPIErrorMessage() {
    // Verificăm dacă este deja afișat un mesaj de eroare
    if (document.querySelector('.api-error-notification')) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'api-error-notification';
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">Actualizare date</div>
            <div class="notification-message">Prețurile sunt actualizate din surse externe. Prețurile reale pot varia ușor.</div>
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
}

// Stiluri pentru notificarea de eroare API
const apiErrorStyles = `
.api-error-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: rgba(220, 53, 69, 0.9);
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

html[data-theme="light"] .api-error-notification {
    background: rgba(220, 53, 69, 0.8);
}

.api-error-notification .notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 1.2rem;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
}

.api-error-notification .notification-content {
    flex: 1;
    color: white;
}

.api-error-notification .notification-title {
    font-weight: 600;
    margin-bottom: 5px;
}

.api-error-notification .notification-message {
    font-size: 0.9rem;
    opacity: 0.9;
}

.api-error-notification .notification-close {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 5px;
    font-size: 0.9rem;
    transition: color 0.2s ease;
}

.api-error-notification .notification-close:hover {
    opacity: 0.8;
}
`;

// Injectăm stilurile pentru notificarea de eroare API
(function injectAPIErrorStyles() {
    const style = document.createElement('style');
    style.textContent = apiErrorStyles;
    document.head.appendChild(style);
})();

// Generăm date istorice simulate pentru grafice
function generateHistoricalData(symbol) {
    if (!cryptoData[symbol]) return;
    
    const currentPrice = cryptoData[symbol].price;
    const volatility = Math.abs(cryptoData[symbol].priceChange24h) / 100;
    
    // Generăm date pentru ultimele 7 zile cu 168 de puncte (1 la fiecare oră)
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dataPoints = [];
    
    // Generăm o tendință generală (trend)
    const trend = Math.random() > 0.5 ? 1 : -1;
    let lastPrice = currentPrice * (1 - (trend * volatility * 7)); // Începem de la un preț de acum 7 zile
    
    for (let i = 168; i >= 0; i--) {
        const timestamp = now - (i * hourMs);
        const randomChange = (Math.random() - 0.5) * volatility * currentPrice * 0.2;
        const trendChange = trend * (volatility / 24) * currentPrice;
        
        lastPrice = lastPrice + randomChange + trendChange;
        if (lastPrice <= 0) lastPrice = currentPrice * 0.01; // Evităm prețurile negative
        
        dataPoints.push({
            x: new Date(timestamp),
            y: lastPrice
        });
    }
    
    // Ultimul punct trebuie să fie prețul actual
    if (dataPoints.length > 0) {
        dataPoints[dataPoints.length - 1].y = currentPrice;
    }
    
    // Stocăm datele pentru grafic
    priceChartData[symbol] = dataPoints;
    
    // Actualizăm graficul cu noile date
    updateChart(symbol);
}

// Formatează volumul pentru afișare
function formatVolume(volume) {
    if (volume >= 1e9) {
        return `$${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
        return `$${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
        return `$${(volume / 1e3).toFixed(1)}K`;
    }
    return `$${volume.toFixed(2)}`;
}

// Actualizează interfața cu datele despre criptomonede
function updateInterfaceWithCoinData() {
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0]; // E.g. "BTC" din "BTC/USDT"
    
    if (cryptoData[symbol]) {
        const data = cryptoData[symbol];
        
        // Actualizăm valorile în interfață
        document.getElementById('lastPrice').textContent = `$${data.price.toFixed(2)}`;
        
        const priceChangeEl = document.getElementById('priceChange');
        priceChangeEl.textContent = (data.priceChange24h >= 0 ? '+' : '') + data.priceChange24h.toFixed(2) + '%';
        priceChangeEl.className = 'stat-value ' + (data.priceChange24h >= 0 ? 'positive' : 'negative');
        
        document.getElementById('highPrice').textContent = `$${data.high24h.toFixed(2)}`;
        document.getElementById('lowPrice').textContent = `$${data.low24h.toFixed(2)}`;
        document.getElementById('volume').textContent = data.volume;
        
        // Actualizăm prețul în formularul de tranzacționare
        document.getElementById('orderPrice').value = data.price.toFixed(2);
        
        // Actualizăm prețul în orderbook
        document.getElementById('orderBookPrice').textContent = `$${data.price.toFixed(2)}`;
        
        // Actualizăm spread-ul aproximativ (bazat pe o valoare de 0.05% din preț)
        const spread = data.price * 0.0005;
        const spreadPercent = 0.05;
        document.getElementById('spread').textContent = `$${spread.toFixed(2)} (${spreadPercent.toFixed(2)}%)`;
        
        // Re-populăm orderbook-ul cu valorile actualizate
        populateOrderBook(data.price);
    }
}

// Actualizează graficul cu datele pentru o monedă specifică
function updateChart(symbol) {
    if (!window.priceChart || !priceChartData[symbol]) return;
    
    const chart = window.priceChart;
    const prices = priceChartData[symbol];
    
    // Actualizăm datele și titlul graficului
    chart.data.datasets[0].data = prices;
    chart.data.datasets[0].label = `${symbol}/USDT`;
    
    // Actualizăm graficul
    chart.update();
}

// Adaug actualizarea textului simbolului în UI
function updateSelectedSymbolDisplay(symbol) {
    // Actualizăm și textul din headerul tabelului trade history
    const coinSymbolSpan = document.querySelector('.trade-header .coin-symbol');
    if (coinSymbolSpan) {
        coinSymbolSpan.textContent = symbol;
    }
    
    // Actualizăm și textul din formular pentru Amount și butonul Buy/Sell
    const amountLabel = document.querySelector('label[for="orderAmount"]');
    if (amountLabel) {
        amountLabel.textContent = `Amount (${symbol})`;
    }
    
    // Actualizăm butonul de cumpărare/vânzare
    const placeOrderBtn = document.getElementById('buyBtcBtn');
    if (placeOrderBtn) {
        const action = placeOrderBtn.classList.contains('buy') ? 'Buy' : 'Sell';
        placeOrderBtn.textContent = `${action} ${symbol}`;
    }
}

// Adăugăm o funcție pentru a crea și adăuga opțiunile de leverage în interfață
function createLeverageOptions() {
    // Verificăm dacă există deja elementul, dacă da, nu îl mai creăm
    if (document.getElementById('leverageOptions')) {
        return;
    }
    
    // Creăm container-ul pentru opțiunile de leverage
    const leverageContainer = document.createElement('div');
    leverageContainer.id = 'leverageOptions';
    leverageContainer.style.display = 'none'; // Inițial ascuns, va fi afișat doar pentru margin și futures
    
    // Adăugăm conținut pentru opțiunile de leverage
    leverageContainer.innerHTML = `
        <div class="leverage-header">
            <span>Leverage: <span class="leverage-value">3x</span></span>
        </div>
        <input type="range" min="1" max="10" value="3" class="leverage-slider" id="leverageSlider">
        <div class="leverage-labels">
            <span>1x</span>
            <span>5x</span>
            <span>10x</span>
        </div>
    `;
    
    // Adăugăm container-ul în interfață după secțiunea de balance
    const balanceSection = document.querySelector('.balance-section');
    if (balanceSection) {
        balanceSection.parentNode.insertBefore(leverageContainer, balanceSection.nextSibling);
    } else {
        // Alternativ, îl adăugăm după secțiunea de tabs pentru tipul de tranzacționare
        const navTabs = document.querySelector('.nav-tabs');
        if (navTabs) {
            navTabs.parentNode.insertBefore(leverageContainer, navTabs.nextSibling);
        }
    }
    
    // Adăugăm event listener pentru slider-ul de leverage
    const leverageSlider = document.getElementById('leverageSlider');
    const leverageValue = document.querySelector('.leverage-value');
    
    if (leverageSlider && leverageValue) {
        leverageSlider.addEventListener('input', function() {
            const value = this.value;
            leverageValue.textContent = value + 'x';
            
            // Actualizăm balanța disponibilă în funcție de leverage
            updateLeverageBalance(value);
        });
    }
    
    // Stilizăm etichete pentru slider
    const leverageLabels = document.querySelector('.leverage-labels');
    if (leverageLabels) {
        leverageLabels.style.display = 'flex';
        leverageLabels.style.justifyContent = 'space-between';
        leverageLabels.style.marginTop = '5px';
        leverageLabels.style.fontSize = '0.8rem';
        leverageLabels.style.color = 'var(--secondary-text-color)';
    }
}

// Funcție pentru actualizarea balanței disponibile în funcție de leverage
function updateLeverageBalance(leverageValue) {
    const balanceValue = document.getElementById('availableBalance');
    let baseBalance = 0;
    const walletData = localStorage.getItem('wallet');
    if (walletData) {
        const wallet = JSON.parse(walletData);
        baseBalance = wallet.totalBalance || 0;
    }
    if (balanceValue) {
        const tradeType = document.querySelector('.nav-tab.active')?.getAttribute('data-trade-type') || 'spot';
        if (tradeType === 'spot') {
            balanceValue.textContent = '$' + baseBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            // Calculăm balanța în funcție de leverage
            const newBalance = baseBalance * leverageValue;
            balanceValue.textContent = '$' + newBalance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }
}

function updateTradeBalance() {
    const balanceElement = document.getElementById('availableBalance');
    const walletData = localStorage.getItem('wallet');
    if (walletData && balanceElement) {
        const wallet = JSON.parse(walletData);
        balanceElement.textContent = '$' + (wallet.totalBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// CSS pentru lacăt (poate fi adăugat dinamic dacă nu există deja)
(function addLockedInputStyles() {
    const style = document.createElement('style');
    style.textContent = `
        input.locked {
            background-image: url('data:image/svg+xml;utf8,<svg fill="white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 1a3 3 0 0 0-3 3v3H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1V4a3 3 0 0 0-3-3zm-2 3a2 2 0 1 1 4 0v3H6V4zm-2 5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"/></svg>');
            background-repeat: no-repeat;
            background-position: right 10px center;
            background-size: 18px 18px;
        }
    `;
    document.head.appendChild(style);
})();

function getCurrentMarketPrice() {
    const pair = document.getElementById('tradingPair').value;
    const symbol = pair.split('/')[0];
    let marketPrice = '';
    if (window.cryptoData && window.cryptoData[symbol] && window.cryptoData[symbol].price) {
        marketPrice = window.cryptoData[symbol].price.toFixed(2);
    } else if (window.marketData && window.marketData[pair] && window.marketData[pair].lastPrice) {
        marketPrice = window.marketData[pair].lastPrice.toFixed(2);
    } else {
        const lastPriceEl = document.getElementById('lastPrice');
        if (lastPriceEl && lastPriceEl.textContent) {
            marketPrice = lastPriceEl.textContent.replace(/[^0-9.]/g, '');
        }
    }
    if (!marketPrice || marketPrice === '0' || marketPrice === '0.00') {
        marketPrice = '1.00';
    }
    return marketPrice;
}

// === GESTIONARE ORDINE LIMIT ===
// Array pentru ordinele deschise și istoricul de ordine
let openOrders = JSON.parse(localStorage.getItem('openOrders') || '[]');
let orderHistory = JSON.parse(localStorage.getItem('orderHistory') || '[]');

function saveOrders() {
    localStorage.setItem('openOrders', JSON.stringify(openOrders));
    localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
}

function renderOpenOrders() {
    const tbody = document.getElementById('openOrders');
    const noOrders = document.getElementById('noOpenOrders');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (openOrders.length === 0) {
        if (noOrders) noOrders.style.display = 'flex';
        return;
    }
    if (noOrders) noOrders.style.display = 'none';
    openOrders.forEach((ord, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ord.dateTime}</td>
            <td>${ord.pair}</td>
            <td>${ord.type}</td>
            <td class="${ord.side.toLowerCase()}">${ord.side}</td>
            <td>$${ord.price.toFixed(2)}</td>
            <td>${ord.amount.toFixed(5)}</td>
            <td>0</td>
            <td>$${(ord.price * ord.amount).toFixed(2)}</td>
            <td>Open</td>
            <td><button class="cancel-btn" data-idx="${idx}">Cancel</button></td>
        `;
        tbody.appendChild(tr);
    });
    // Cancel order
    tbody.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(this.getAttribute('data-idx'));
            openOrders.splice(idx, 1);
            saveOrders();
            renderOpenOrders();
        };
    });
}

function renderOrderHistory() {
    const tbody = document.getElementById('orderHistory');
    const noOrders = document.getElementById('noOrderHistory');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (orderHistory.length === 0) {
        if (noOrders) noOrders.style.display = 'flex';
        return;
    }
    if (noOrders) noOrders.style.display = 'none';
    orderHistory.forEach(ord => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${ord.dateTime}</td>
            <td>${ord.pair}</td>
            <td>${ord.type}</td>
            <td class="${ord.side.toLowerCase()}">${ord.side}</td>
            <td>$${ord.price.toFixed(2)}</td>
            <td>${ord.amount.toFixed(5)}</td>
            <td>$${(ord.price * ord.amount).toFixed(2)}</td>
            <td>Filled</td>
        `;
        tbody.appendChild(tr);
    });
}

// Modific processOrder pentru Limit
const originalProcessOrder = processOrder;
processOrder = function() {
    const pair = document.getElementById('tradingPair').value;
    const orderType = document.querySelector('.order-type-btn.active')?.getAttribute('data-order-type') || 'limit';
    const side = document.querySelector('.action-tab-btn.active')?.getAttribute('data-action') || 'buy';
    let price = parseFloat(document.getElementById('orderPrice').value);
    let amount = parseFloat(document.getElementById('orderAmount').value);
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateTimeStr = `${dateStr} ${timeStr}`;
    if (orderType === 'limit') {
        // Validare
        if (isNaN(price) || price <= 0 || isNaN(amount) || amount <= 0) {
            alert('Introduceți un preț și o cantitate validă');
            return;
        }
        // Adaug ordinul în openOrders
        openOrders.unshift({
            dateTime: dateTimeStr,
            pair,
            type: 'Limit',
            side: side === 'buy' ? 'Buy' : 'Sell',
            price,
            amount
        });
        saveOrders();
        renderOpenOrders();
        // Notificare
        const notification = document.createElement('div');
        notification.className = 'trade-notification';
        notification.innerHTML = `<div class="notification-icon buy"><i class="fas fa-arrow-down"></i></div><div class="notification-content"><div class="notification-title">Ordin Limit plasat</div><div class="notification-message">Ordinul tău a fost adăugat la Open Orders și va fi executat automat când prețul pieței ajunge la limita ta.</div></div><button class="notification-close"><i class="fas fa-times"></i></button>`;
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.opacity = '1'; notification.style.transform = 'translateX(0)'; }, 100);
        setTimeout(() => { notification.style.opacity = '0'; notification.style.transform = 'translateX(100%)'; setTimeout(() => { notification.remove(); }, 300); }, 5000);
        notification.querySelector('.notification-close').addEventListener('click', () => { notification.style.opacity = '0'; notification.style.transform = 'translateX(100%)'; setTimeout(() => { notification.remove(); }, 300); });
        // Reset formular
        document.getElementById('orderAmount').value = '';
        document.getElementById('orderTotal').value = '';
        return;
    }
    // Pentru celelalte tipuri, comportament original
    originalProcessOrder();
};

// La fiecare update de preț, execut ordinele Limit dacă e cazul
function checkLimitOrders() {
    const pair = document.getElementById('tradingPair').value;
    const symbol = pair.split('/')[0];
    let marketPrice = 0;
    if (window.cryptoData && window.cryptoData[symbol] && window.cryptoData[symbol].price) {
        marketPrice = window.cryptoData[symbol].price;
    } else if (window.marketData && window.marketData[pair] && window.marketData[pair].lastPrice) {
        marketPrice = window.marketData[pair].lastPrice;
    }
    // Parcurg ordinele deschise
    for (let i = openOrders.length - 1; i >= 0; i--) {
        const ord = openOrders[i];
        if (ord.pair !== pair || ord.type !== 'Limit') continue;
        if ((ord.side === 'Buy' && marketPrice <= ord.price) || (ord.side === 'Sell' && marketPrice >= ord.price)) {
            // Execut ordinul
            orderHistory.unshift({ ...ord });
            openOrders.splice(i, 1);
        }
    }
    saveOrders();
    renderOpenOrders();
    renderOrderHistory();
}

// Apelez checkLimitOrders la fiecare update de preț
const originalUpdateMarketValues = updateMarketValues;
updateMarketValues = function(pair) {
    originalUpdateMarketValues(pair);
    checkLimitOrders();
};
// Apelez și la load
document.addEventListener('DOMContentLoaded', () => {
    renderOpenOrders();
    renderOrderHistory();
});