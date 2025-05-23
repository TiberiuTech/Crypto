document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing components");
    
    const swapModal = document.getElementById('swapModal');
    if (swapModal) {
        swapModal.remove();
        console.log("Swap modal removed from DOM");
    }
    
    if (typeof fixXRPValue === 'function') {
        console.log("Calling fixXRPValue() to ensure consistent values");
        fixXRPValue();
    } else {
        console.warn("Function fixXRPValue not found, possible XRP values will not be displayed correctly");
        window.fixXRPValue = function() {
            console.log("fixXRPValue dummy function");
        };
    }
    
    setupChart();
    initCustomDropdown();
    initEmptyUI();
    
    console.log("Initializing API and forcing data update");
    initCryptoAPI();
    
    setupEventListeners();
    
    startPriceUpdates();
    
    updateTradeBalance();
    
    initializeBalanceVisibilityToggle();
    
    setTimeout(() => {
        fetchCryptoData().then(() => {
            console.log("Data fetch updated, updating wallet assets");
            updateWalletAssetsDisplay();
        }).catch(err => {
            console.warn("Error updating wallet assets data:", err);
            updateWalletAssetsDisplay();
        });
    }, 500);
    
    setInterval(() => {
        updateWalletAssetsDisplay();
    }, 30000);
    
    setupOrderHistory();
});

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

const cryptoCompareSymbols = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE'];

let cryptoData = {};
let priceChartData = {};
let currentCoin = 'BTC';
let priceUpdateInterval;
let lastAPICall = 0;
const API_CALL_DELAY = 10000;

const COINGECKO_PROXY = 'https://cors-anywhere.herokuapp.com/';

let usingRealData = false;

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

let currentTimeframe = '1d';

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

function initCustomDropdown() {
    const customDropdown = document.querySelector('.custom-dropdown');
    const selectedOption = document.querySelector('.selected-option');
    const dropdownOptions = document.querySelector('.dropdown-options');
    const dropdownOptionItems = document.querySelectorAll('.dropdown-option');
    const hiddenSelect = document.getElementById('tradingPair');
    
    if (!customDropdown || !selectedOption || !hiddenSelect) {
        console.error("All necessary elements for dropdown not found!");
        return;
    }
    
    console.log("Custom dropdown initialization");
    
    function positionDropdown() {
        if (dropdownOptions) {
            const rect = selectedOption.getBoundingClientRect();
            dropdownOptions.style.width = rect.width + 'px';
            
            if (!document.body.contains(dropdownOptions)) {
                document.body.appendChild(dropdownOptions);
                
                const rectSelected = selectedOption.getBoundingClientRect();
                dropdownOptions.style.position = 'fixed';
                dropdownOptions.style.top = (rectSelected.bottom + 2) + 'px';
                dropdownOptions.style.left = rectSelected.left + 'px';
                dropdownOptions.style.width = rectSelected.width + 'px';
            }
        }
    }
    
    selectedOption.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (customDropdown.classList.contains('active')) {
            customDropdown.classList.remove('active');
        } else {
            customDropdown.classList.add('active');
            positionDropdown();
        }
        
        console.log("Dropdown toggle:", customDropdown.classList.contains('active'));
    });
    
    document.addEventListener('click', (e) => {
        if (!customDropdown.contains(e.target) && !dropdownOptions.contains(e.target)) {
            customDropdown.classList.remove('active');
        }
    });
    
    dropdownOptionItems.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const value = option.getAttribute('data-value');
            const iconElement = option.querySelector('.crypto-icon').cloneNode(true);
            const text = option.querySelector('span:not(.crypto-icon)').textContent;
            
            console.log("[DROPDOWN] Selected option:", value);
            
            const selectedIcon = selectedOption.querySelector('.crypto-icon');
            selectedIcon.className = iconElement.className;
            selectedIcon.innerHTML = iconElement.innerHTML;
            
            selectedOption.querySelector('span:not(.crypto-icon)').textContent = text;
            
            hiddenSelect.value = value;

            document.getElementById('lastPrice').textContent = `$---`;
            document.getElementById('priceChange').textContent = `---`;
            document.getElementById('highPrice').textContent = `$---`;
            document.getElementById('lowPrice').textContent = `$---`;
            document.getElementById('volume').textContent = `---`;
            
            const symbol = value.split('/')[0];
            currentCoin = symbol;
            
            updateSelectedSymbolDisplay(symbol);
            
            toggleLoadingIndicator(true);
            
            console.log("[DROPDOWN] Ready to trigger change for:", value);
            
            const event = new Event('change', { bubbles: true });
            hiddenSelect.dispatchEvent(event);
            
            customDropdown.classList.remove('active');
            
            setTimeout(() => {
                if (document.getElementById('lastPrice').textContent === '$---') {
                    console.log("[DROPDOWN] Forcing fetch after timeout");
                    cryptoData = {};
                    priceChartData = {};
                    
                    lastAPICall = 0;
                    
                    fetchFromBinance().then(success => {
                        if (success) {
                            console.log(`[DROPDOWN] Date updated successfully for ${symbol}`);
                            toggleLoadingIndicator(false);
                            
                            if (window.priceChart) window.priceChart.destroy();
                            initChartData();
                        } else {
                            useFallbackData();
                            toggleLoadingIndicator(false);
                        }
                    }).catch(error => {
                        console.error(`[DROPDOWN] Error updating data:`, error);
                        useFallbackData();
                        toggleLoadingIndicator(false);
                    });
                }
            }, 200);
        });
    });
    
    const firstOption = dropdownOptionItems[0];
    if (firstOption) {
        const value = firstOption.getAttribute('data-value');
        hiddenSelect.value = value;
        const symbol = value.split('/')[0];
        updateSelectedSymbolDisplay(symbol);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            customDropdown.classList.remove('active');
        }
    });
    
    window.addEventListener('resize', positionDropdown);
    
    positionDropdown();
}

function setupChart() {
    console.log("Chart.js initialization and plugins registration");
}

function initEmptyUI() {
    const openOrders = document.getElementById('openOrders');
    const noOpenOrders = document.getElementById('noOpenOrders');

    if (openOrders && noOpenOrders) {
        openOrders.innerHTML = '';
        noOpenOrders.style.display = 'flex';
    }
    
    const orderHistory = document.getElementById('orderHistory');
    const noOrderHistory = document.getElementById('noOrderHistory');
    
    if (orderHistory && noOrderHistory) {
        orderHistory.innerHTML = '';
        noOrderHistory.style.display = 'flex';
    }
    
}

function initTradingInterface() {
    const selectedPair = document.getElementById('tradingPair').value;
    
    if (cryptoData[selectedPair.split('/')[0]]) {
        updateMarketValues(selectedPair);
    }
}

function generateChartData(timeframe = '1d', numCandles = 200) {
    const now = new Date();
    const data = [];
    let lastClose = 10000 + Math.random() * 1000;
    const volatility = 0.02;
    
    let timeIncrement;
    
    switch(timeframe) {
        case '1h':
            timeIncrement = 5 * 60 * 1000; 
            break;
        case '4h':
            timeIncrement = 20 * 60 * 1000; 
            break;
        case '1d':
            timeIncrement = 2 * 60 * 60 * 1000; 
            break;
        case '1w':
            timeIncrement = 12 * 60 * 60 * 1000; 
            break;
        case '1m':
            timeIncrement = 24 * 60 * 60 * 1000; 
            break;
        default:
            timeIncrement = 2 * 60 * 60 * 1000; 
    }
    
    for (let i = numCandles; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * timeIncrement));
        const range = lastClose * volatility;
        
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

function initChartData() {
    const canvasElement = document.getElementById('tradingChart');
    if (!canvasElement) return;
    
    console.log("Chart initialization");
    const ctx = canvasElement.getContext('2d');
    const themeColors = getThemeColors();

    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    
    const prices = priceChartData[symbol] || 
                  generateChartData().map(item => ({
                      x: new Date(item.time),
                      y: item.close
                  }));
    
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
    
    window.priceChart = priceChart;
}

function changeTimeframe(timeframe) {
    if (!timeframeMap[timeframe]) {
        console.error(`Timeframe invalid: ${timeframe}`);
        return;
    }

    console.log(`[TIMEFRAME] Change interval to ${timeframe}`);
    currentTimeframe = timeframe;
    
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    const binanceSymbol = binanceSymbolMap[symbol];
    
    if (!binanceSymbol) {
        console.warn(`No Binance mapping for ${symbol}`);
        return;
    }
    
    toggleChartLoading(true);
    
    fetchHistoricalData(binanceSymbol, timeframe)
        .then(data => {
            if (data && data.length > 0) {
                const prices = data.map(candle => ({
                    x: new Date(candle[0]),
                    y: parseFloat(candle[4]) 
                }));
                
                priceChartData[symbol] = prices;
                
                updateChartWithTimeframe(symbol, timeframe);
            } else {
                console.warn(`[TIMEFRAME] No data received for ${timeframe}`);
                const chartData = generateChartData(timeframe);
                priceChartData[symbol] = chartData.map(item => ({
                    x: new Date(item.time),
                    y: item.close
                }));
                updateChartWithTimeframe(symbol, timeframe);
            }
        })
        .catch(error => {
            console.error(`[TIMEFRAME] Error fetching data for ${timeframe}:`, error);
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

function updateChartWithTimeframe(symbol, timeframe) {
    if (!window.priceChart || !priceChartData[symbol]) {
        console.warn(`[TIMEFRAME] No chart or data for ${symbol}`);
        return;
    }
    
    const priceChart = window.priceChart;
    const tf = timeframeMap[timeframe];
    
    priceChart.data.datasets[0].data = priceChartData[symbol];
    
    priceChart.options.scales.x.time.unit = tf.chartUnit;
    priceChart.options.scales.x.time.displayFormats = {
        [tf.chartUnit]: tf.displayFormat
    };
    
    priceChart.data.datasets[0].label = `${symbol}/USDT (${timeframe})`;
    
    priceChart.update();
    console.log(`[TIMEFRAME] Chart updated for ${symbol} with interval ${timeframe}`);
}

function toggleChartLoading(show) {
    const chartContainer = document.querySelector('.chart-container');
    
    if (!chartContainer) return;
    
    if (show) {
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
        const loader = document.getElementById('chartLoadingIndicator');
        if (loader) {
            loader.remove();
        }
    }
}

function forceVisualUpdate() {
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    if (!cryptoData[symbol]) return;
    
    const data = cryptoData[symbol];
    const volatility = 0.001; 
    const priceChange = data.price * volatility * (Math.random() * 2 - 1);
    const newPrice = data.price + priceChange;
    
    data.price = newPrice;
    data.priceChange24h = data.priceChange24h + (priceChange / data.price) * 100;
    
    if (newPrice > data.high24h) data.high24h = newPrice;
    if (newPrice < data.low24h) data.low24h = newPrice;
    
    syncAllPrices(newPrice, symbol);
    
    const priceChangeText = (data.priceChange24h >= 0 ? '+' : '') + data.priceChange24h.toFixed(2) + '%';
    const priceChangeEl = document.getElementById('priceChange');
    if (priceChangeEl) {
        priceChangeEl.textContent = priceChangeText;
        priceChangeEl.className = data.priceChange24h >= 0 ? 'positive' : 'negative';
    }
    
    const lastPriceEl = document.getElementById('lastPrice');
    if (lastPriceEl) {
        lastPriceEl.classList.add('price-flash');
        setTimeout(() => {
            lastPriceEl.classList.remove('price-flash');
        }, 300);
    }
}

(function addPriceFlashStyle() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes price-flash {
            0% { opacity: 0.5; }
            50% { opacity: 1; }
            100% { opacity: 1; }
        }
        .price-flash {
            animation: price-flash 0.3s ease-out;
        }
    `;
    document.head.appendChild(style);
})();

function startPriceUpdates() {
    const UPDATE_INTERVAL = 2000; 
    fetchCryptoData();
    
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    
    priceUpdateInterval = setInterval(() => {
        const selectedPair = document.getElementById('tradingPair').value;
        const symbol = selectedPair.split('/')[0];
        if (!document.hidden) {
            fetchCryptoData();
            
            forceVisualUpdate();
            
            updateChart(symbol);
            populateOrderBook(cryptoData[symbol]?.price);
        }
    }, UPDATE_INTERVAL);
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) fetchCryptoData();
});

const tradingPairEl = document.getElementById('tradingPair');
if (tradingPairEl) {
    tradingPairEl.addEventListener('change', function(event) {
        const pair = this.value;
        const symbol = pair.split('/')[0];
        currentCoin = symbol;
        
        console.log(`[CHANGE EVENT] Coin changed to ${pair}, source:`, event.target.id);
        
        updateSelectedSymbolDisplay(symbol);
        
        toggleLoadingIndicator(true);
        
        document.getElementById('lastPrice').textContent = `$---`;
        document.getElementById('priceChange').textContent = `---`;
        document.getElementById('highPrice').textContent = `$---`;
        document.getElementById('lowPrice').textContent = `$---`;
        document.getElementById('volume').textContent = `---`;
        
        cryptoData = {}; 
        priceChartData = {}; 
        
        console.log(`[CHANGE EVENT] Forcing complete update for ${pair}`);
        
        lastAPICall = 0;
        
        setTimeout(() => {
            fetchFromBinance().then(success => {
                if (success) {
                    console.log(`[CHANGE EVENT] Date actualizate cu succes pentru ${pair}`);

                    const data = cryptoData[symbol];
                    if (data) {
                        const currentSelectedPair = document.getElementById('tradingPair').value;
                        if (currentSelectedPair === pair) {
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
                    
                    toggleLoadingIndicator(false);
                    
                    if (window.priceChart) window.priceChart.destroy();
                    initChartData();
                } else {
                    console.warn(`[CHANGE EVENT] Failed to fetch data for ${pair}, using fallback`);
                    useFallbackData();
                    
                    toggleLoadingIndicator(false);
                    
                    if (window.priceChart) window.priceChart.destroy();
                    initChartData();
                }
            }).catch(error => {
                console.error(`[CHANGE EVENT] Error fetching data for ${pair}:`, error);
                useFallbackData();

                toggleLoadingIndicator(false);
                
                if (window.priceChart) window.priceChart.destroy();
                initChartData();
            });
        }, 50); 
    });
}

async function fetchCryptoData() {
    const now = Date.now();
    if (now - lastAPICall < API_CALL_DELAY) return;
    try {
        const success = await fetchFromBinance();
        if (!success) throw new Error('Binance did not return data');
        lastAPICall = now;
        
        updateWalletWithRealData();
        
        return true;
    } catch (error) {
        console.error('Error fetching data:', error);
        useFallbackData();
        showAPIErrorMessage();
        return false;
    }
}

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

async function fetchFromBinance() {
    try {
        const selectedPair = document.getElementById('tradingPair').value;
        const symbol = selectedPair.split('/')[0];
        const binanceSymbol = binanceSymbolMap[symbol];
        
        if (!binanceSymbol) {
            console.warn(`Coin ${symbol} does not have a Binance mapping`);
            return false;
        }
        
        console.log(`Attempting to fetch Binance for ${binanceSymbol}...`);
        
        const tickerUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`;
        console.log(`Fetch ticker URL: ${tickerUrl}`);
        
        let tickerResponse;
        try {
            tickerResponse = await fetch(tickerUrl);
            console.log(`Ticker response status: ${tickerResponse.status}`);
        } catch (err) {
            console.error(`Error fetching ticker: ${err.message}`);
            throw err;
        }
        
        if (!tickerResponse.ok) {
            console.error(`Ticker negative response: ${tickerResponse.status} ${tickerResponse.statusText}`);
            throw new Error(`Binance API error: ${tickerResponse.status}`);
        }
        
        const tickerData = await tickerResponse.json();
        console.log(`Ticker data received for ${binanceSymbol}:`, tickerData);
        
        if (!tickerData.lastPrice || !tickerData.highPrice || !tickerData.lowPrice) {
            console.error(`Invalid or incomplete ticker data:`, tickerData);
            throw new Error(`Invalid ticker data for ${binanceSymbol}`);
        }
        
        const klineUrl = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=15m&limit=100`;
        console.log(`Fetch kline URL: ${klineUrl}`);
        
        let klineResponse;
        try {
            klineResponse = await fetch(klineUrl);
            console.log(`Kline response status: ${klineResponse.status}`);
        } catch (err) {
            console.error(`Error fetching kline: ${err.message}`);
            throw err;
        }
        
        if (!klineResponse.ok) {
            console.error(`Kline negative response: ${klineResponse.status} ${klineResponse.statusText}`);
            throw new Error(`Binance Kline API error: ${klineResponse.status}`);
        }
        
        const klineData = await klineResponse.json();
        console.log(`Received ${klineData.length} candles for ${binanceSymbol}`);
        
        const currentPair = document.getElementById('tradingPair').value;
        if (currentPair !== selectedPair) {
            console.warn(`Selected coin changed between fetching (${selectedPair} → ${currentPair}), cancelling processing`);
            return false;
        }
        
        processBinanceData(symbol, tickerData, klineData);
        console.log(`Data processed successfully for ${symbol}`);
        return true;
    } catch (error) {
        console.error(`Binance error for ${document.getElementById('tradingPair').value.split('/')[0]}:`, error);
        usingRealData = false;
        return false;
    }
}

function processBinanceData(symbol, tickerData, klineData) {
    const currentPrice = parseFloat(tickerData.lastPrice);
    const priceChangePercent = parseFloat(tickerData.priceChangePercent);
    const high24h = parseFloat(tickerData.highPrice);
    const low24h = parseFloat(tickerData.lowPrice);
    const volume24h = parseFloat(tickerData.volume);
    
    const currentSelectedPair = document.getElementById('tradingPair').value;
    const currentSymbol = currentSelectedPair.split('/')[0];

    if (currentSymbol !== symbol) {
        console.warn(`Selected coin changed between processing data (${symbol} → ${currentSymbol}), cancelling update`);
        return;
    }
    
    console.log(`Processing data for ${symbol}, price: ${currentPrice}`);
    
    cryptoData[symbol] = {
        price: currentPrice,
        priceChange24h: priceChangePercent,
        high24h: high24h,
        low24h: low24h,
        volume: formatVolume(volume24h * currentPrice),
        lastUpdated: new Date()
    };
    
    const prices = klineData.map(candle => ({
        x: new Date(candle[0]),
        y: parseFloat(candle[4])
    }));
    
    priceChartData[symbol] = prices;
    
    usingRealData = true;
    
    const formattedPrice = currentPrice.toFixed(2);
    const formattedPriceWithDollar = `$${formattedPrice}`;
    
    const elementsToUpdate = [
        { id: 'lastPrice', format: formattedPriceWithDollar },
        { id: 'orderBookPrice', format: formattedPriceWithDollar },
        { id: 'orderPrice', format: formattedPrice, isInput: true },
        { id: 'highPrice', format: `$${high24h.toFixed(2)}` },
        { id: 'lowPrice', format: `$${low24h.toFixed(2)}` }
    ];
    
    elementsToUpdate.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            if (element.isInput) {
                el.value = element.format;
            } else {
                el.textContent = element.format;
            }
        }
    });
    
    syncAllPrices(currentPrice, symbol);
    
    const priceChangeText = (priceChangePercent >= 0 ? '+' : '') + priceChangePercent.toFixed(2) + '%';
    const priceChangeEl = document.getElementById('priceChange');
    if (priceChangeEl) {
        priceChangeEl.textContent = priceChangeText;
        priceChangeEl.className = priceChangePercent >= 0 ? 'positive' : 'negative';
    }
    
    const volumeEl = document.getElementById('volume');
    if (volumeEl) {
        volumeEl.textContent = formatVolume(volume24h * currentPrice);
    }
    
    updateMarketValues(currentSelectedPair);
    
    updateChartWithTimeframe(symbol, currentTimeframe);
    
    showDataSourceIndicator(true, `Binance: ${currentPrice.toFixed(2)} USD`);
}

function showDataSourceIndicator(isReal, priceText = '') {
    if (isReal) {
        console.log(`Real data used: ${priceText}`);
    } else {
        console.warn('Demo data used (fallback)');
    }
    
    const existingIndicator = document.getElementById('dataSourceIndicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
}

function useFallbackData() {
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    if (!marketData[selectedPair]) return;
    
    usingRealData = false;
    
    const basePrice = marketData[selectedPair].lastPrice;
    const fluctuation = Math.random() * 0.02 * basePrice;
    cryptoData[symbol] = {
        price: basePrice + fluctuation,
        priceChange24h: Math.random() * 4 - 2,
        high24h: basePrice * 1.03,
        low24h: basePrice * 0.97,
        volume: marketData[selectedPair].volume,
        lastUpdated: new Date()
    };
    
    generateHistoricalData(symbol);
    
    updateMarketValues(selectedPair);
    
    showDataSourceIndicator(false);
}

function updateMarketValues(pair) {
    const symbol = pair.split('/')[0];
    let data = cryptoData[symbol];

    const currentSelectedPair = document.getElementById('tradingPair').value;
    if (currentSelectedPair !== pair) {
        console.log(`Selected coin changed between updating (${pair} → ${currentSelectedPair}), not updating UI`);
        return;
    }

    if (!data || typeof data.price !== 'number' || isNaN(data.price)) {
        const fallback = marketData[pair];
        if (!fallback) {
            console.warn('Missing complete data for', symbol, pair);
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

    console.log(`Updating UI for ${pair} with price ${data.price}`);

    document.getElementById('lastPrice').textContent = `$${data.price.toFixed(2)}`;
    
    const priceChangeText = (data.priceChange24h >= 0 ? '+' : '') + data.priceChange24h.toFixed(2) + '%';
    document.getElementById('priceChange').textContent = priceChangeText;
    document.getElementById('priceChange').className = data.priceChange24h >= 0 ? 'positive' : 'negative';
    
    document.getElementById('highPrice').textContent = `$${data.high24h.toFixed(2)}`;
    document.getElementById('lowPrice').textContent = `$${data.low24h.toFixed(2)}`;
    document.getElementById('volume').textContent = data.volume;

    document.getElementById('orderPrice').value = data.price.toFixed(2);
    document.getElementById('orderBookPrice').textContent = `$${data.price.toFixed(2)}`;

    if (window.priceChart && priceChartData[symbol]) {
        window.priceChart.data.datasets[0].data = priceChartData[symbol];
        window.priceChart.data.datasets[0].label = `${symbol}/USDT`;
        window.priceChart.update();
    }

    populateOrderBook(data.price);
    populateTradeHistory();
}

function populateOrderBook(basePrice) {
    const sellOrders = document.getElementById('sellOrders');
    const buyOrders = document.getElementById('buyOrders');
    
    if (!sellOrders || !buyOrders) return;

    sellOrders.innerHTML = '';
    buyOrders.innerHTML = '';
    
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    basePrice = basePrice || (cryptoData[symbol]?.price || 1000);
    
    const amountHeader = document.querySelector('.book-header span:nth-child(2)');
    if (amountHeader) {
        amountHeader.textContent = `Amount (${symbol})`;
    }
    
    for (let i = 10; i > 0; i--) {
        const price = basePrice + (i * 50 + Math.random() * 20);
        const amount = 0.01 + Math.random() * 0.5;
        const total = price * amount;
        
        const depth = Math.random() * 0.8 + 0.1;
        
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
    
    for (let i = 1; i <= 10; i++) {
        const price = basePrice - (i * 50 + Math.random() * 20);
        const amount = 0.01 + Math.random() * 0.5;
        const total = price * amount;
        
        const depth = Math.random() * 0.8 + 0.1;
        
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
    
    const topBuyPrice = basePrice - 50;
    const bottomSellPrice = basePrice + 50;
    const spread = bottomSellPrice - topBuyPrice;
    const spreadPercent = (spread / bottomSellPrice) * 100;
    
    document.getElementById('spread').textContent = `$${spread.toFixed(2)} (${spreadPercent.toFixed(2)}%)`;
}

function populateTradeHistory() {
    const tradeHistory = document.getElementById('tradeHistory');
    if (!tradeHistory) return;
    
    if (tradeHistory.querySelector('.trade-row')) {
        return;
    }
    
    tradeHistory.innerHTML = '';
    
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-trades-message';
    emptyMessage.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <p>Your trades will appear here after placing a Buy or Sell order</p>
    `;
    tradeHistory.appendChild(emptyMessage);
    
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
    
    if (!document.getElementById('empty-trades-style')) {
        style.id = 'empty-trades-style';
        document.head.appendChild(style);
    }
}   

function addTradeToHistory(price, amount, isBuy) {
    const tradeHistory = document.getElementById('tradeHistory');
    if (!tradeHistory) return;
    
    console.log(`Adding trade to history: ${isBuy ? 'Buy' : 'Sell'} ${amount} at price $${price}`);
        
    const emptyMessage = tradeHistory.querySelector('.empty-trades-message');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    
    const tradeRow = document.createElement('div');
    tradeRow.className = `trade-row ${isBuy ? 'buy' : 'sell'}`;
    tradeRow.innerHTML = `
        <span class="price">$${price.toFixed(2)}</span>
        <span class="amount">${amount.toFixed(5)} ${symbol}</span>
        <span class="time">${timeStr}</span>
    `;
    
    tradeRow.style.animation = 'highlight-new-trade 1.5s ease-out';
    
    if (!document.getElementById('highlight-trade-style')) {
        const style = document.createElement('style');
        style.id = 'highlight-trade-style';
        style.textContent = `
            @keyframes highlight-new-trade {
                0% { background-color: var(--positive-color-transparent); }
                100% { background-color: transparent; }
            }
        `;
        document.head.appendChild(style);
    }
    
    if (tradeHistory.firstChild) {
        tradeHistory.insertBefore(tradeRow, tradeHistory.firstChild);
    } else {
        tradeHistory.appendChild(tradeRow);
    }
}

function addOrderToHistory(side, type, pair, price, amount) {
    const orderHistory = document.getElementById('orderHistory');
    const noOrderHistory = document.getElementById('noOrderHistory');
    
    if (!orderHistory || !noOrderHistory) return;
    
    noOrderHistory.style.display = 'none';
    
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
    
    if (orderHistory.querySelector('tr')) {
        orderHistory.insertBefore(row, orderHistory.querySelector('tr'));
    } else {
        orderHistory.appendChild(row);
    }
    
    const isBuy = side.toLowerCase().includes('buy') || side.toLowerCase().includes('long') || side.toLowerCase().includes('bought');
    addTradeToHistory(price, amount, isBuy);
}

function processOrder() {
    const pair = document.getElementById('tradingPair').value;
    const orderType = document.querySelector('.order-type-btn.active')?.getAttribute('data-order-type') || 'market';
    const side = document.querySelector('.action-tab-btn.active')?.getAttribute('data-action') || 'buy';
    let price = parseFloat(document.getElementById('orderPrice').value);
    let amount = parseFloat(document.getElementById('orderAmount').value);

    // Validări de bază
    if (isNaN(amount) || amount <= 0) {
        alert('Introduceți o cantitate validă');
        return;
    }

    if (orderType !== 'market' && (isNaN(price) || price <= 0)) {
        alert('Introduceți un preț valid');
        return;
    }

    // Pentru ordine de tip market, folosim prețul curent
    if (orderType === 'market') {
        const symbol = pair.split('/')[0];
        if (cryptoData[symbol] && cryptoData[symbol].price) {
            price = cryptoData[symbol].price;
        }
    }

    const total = price * amount;
    const symbol = pair.split('/')[0];
    const coinId = getCoinIdFromSymbol(symbol);

    // Verificăm wallet-ul
    const walletData = localStorage.getItem('wallet');
    let wallet = walletData ? JSON.parse(walletData) : null;

    if (!wallet || !wallet.coins) {
        wallet = {
            totalBalance: 0,
            coins: {}
        };
        localStorage.setItem('wallet', JSON.stringify(wallet));
    }

    // Pentru vânzare, verificăm dacă utilizatorul are suficiente fonduri
    if (side === 'sell') {
        if (!wallet.coins[coinId] || wallet.coins[coinId].amount < amount) {
            alert(`Nu aveți suficient ${symbol} pentru această tranzacție`);
            return;
        }
    }

    // Pentru cumpărare, verificăm dacă există suficiente fonduri USDT
    if (side === 'buy' && total > (wallet.totalBalance || 0)) {
        alert('Fonduri insuficiente pentru această tranzacție');
        return;
    }

    // Procesăm tranzacția
    if (side === 'buy') {
        updateWalletAfterPurchase(pair, amount, price);
    } else {
        updateWalletAfterSell(pair, amount, price);
    }

    // Adăugăm în istoric
    addOrderToHistory(
        side === 'buy' ? 'Bought' : 'Sold',
        orderType.charAt(0).toUpperCase() + orderType.slice(1),
        pair,
        price,
        amount
    );

    // Adăugăm în istoricul de tranzacții
    addTradeToHistory(price, amount, side === 'buy');

    // Afișăm notificare
    const notification = document.createElement('div');
    notification.className = 'trade-notification';
    notification.innerHTML = `
        <div class="notification-icon ${side}">
            <i class="fas fa-${side === 'buy' ? 'arrow-down' : 'arrow-up'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${side === 'buy' ? 'Cumpărare' : 'Vânzare'} reușită</div>
            <div class="notification-message">
                ${side === 'buy' ? 'Cumpărat' : 'Vândut'} ${amount.toFixed(5)} ${symbol} 
                la prețul de $${price.toFixed(2)}
            </div>
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
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Reset form
    document.getElementById('orderAmount').value = '';
    document.getElementById('orderTotal').value = '';

    // Actualizăm UI-ul
    updateWalletAssetsDisplay();
    updateTradeBalance();
}

function setupEventListeners() {
    const tradeTypeButtons = document.querySelectorAll('.nav-tab');
    
    let currentTradeType = 'spot';
    
    function updateTradeTypeUI(tradeType) {
        tradeTypeButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-trade-type') === tradeType) {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tradeType) {
                btn.classList.add('active');
            }
        });
        
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
        
        const leverageOptions = document.getElementById('leverageOptions');
        if (leverageOptions) {
            leverageOptions.style.display = (tradeType !== 'spot') ? 'block' : 'none';
            }
        
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
        
        currentTradeType = tradeType;
        
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
    
    tradeTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tradeType = this.getAttribute('data-trade-type');
            if (tradeType && tradeType !== currentTradeType) {
                updateTradeTypeUI(tradeType);
            }
        });
    });
    
    const timeframeButtons = document.querySelectorAll('.timeframe-btn');
    timeframeButtons.forEach(button => {
        button.addEventListener('click', function() {
            timeframeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const timeframe = this.getAttribute('data-timeframe');
            changeTimeframe(timeframe);
        });
    });
    
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
    
    const actionButtons = document.querySelectorAll('.action-tab-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            actionButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const placeOrderBtn = document.getElementById('buyBtcBtn');
            if (placeOrderBtn) {
                placeOrderBtn.className = 'place-order-btn ' + this.getAttribute('data-action');
                
                const pair = document.getElementById('tradingPair').value;
                const baseSymbol = pair.split('/')[0];
                placeOrderBtn.textContent = this.getAttribute('data-action') === 'buy' ? 
                    `Buy ${baseSymbol}` : `Sell ${baseSymbol}`;
            }
        });
    });
    
    const sliderButtons = document.querySelectorAll('.slider-btn');
    sliderButtons.forEach(button => {
        button.addEventListener('click', function() {
            const percent = parseInt(this.getAttribute('data-percent'));
            const balance = 15432.21;
            const price = parseFloat(document.getElementById('orderPrice').value) || 0;
            
            if (price > 0) {
                const amount = (balance * (percent / 100)) / price;
                document.getElementById('orderAmount').value = amount.toFixed(5);
                document.getElementById('orderTotal').value = (amount * price).toFixed(2);
                
                sliderButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            } else {
                alert('Enter a valid price before selecting the percentage');
            }
        });
    });
    
    const orderPrice = document.getElementById('orderPrice');
    const orderAmount = document.getElementById('orderAmount');
    const orderTotal = document.getElementById('orderTotal');
    
    if (orderPrice && orderAmount && orderTotal) {
        orderPrice.addEventListener('input', calculateTotal);
        orderAmount.addEventListener('input', calculateTotal);
        orderTotal.addEventListener('input', calculateAmount);
    }
    
    const placeOrderBtn = document.getElementById('buyBtcBtn');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', processOrder);
    }
    
    const orderTabButtons = document.querySelectorAll('.orders-tab-btn');
    orderTabButtons.forEach(button => {
        button.addEventListener('click', function() {
            orderTabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
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
    
    const swapButtons = document.querySelectorAll('.swap-btn');
    if (swapButtons.length > 0) {
        swapButtons.forEach(btn => {
            btn.style.display = 'none';
        });
    }
}

function calculateTotal() {
    const price = parseFloat(document.getElementById('orderPrice').value) || 0;
    const amount = parseFloat(document.getElementById('orderAmount').value) || 0;
    
    if (price > 0 && amount > 0) {
        const total = price * amount;
        document.getElementById('orderTotal').value = total.toFixed(2);
    }
}

function calculateAmount() {
    const price = parseFloat(document.getElementById('orderPrice').value) || 0;
    const total = parseFloat(document.getElementById('orderTotal').value) || 0;
    
    if (price > 0 && total > 0) {
        const amount = total / price;
        document.getElementById('orderAmount').value = amount.toFixed(5);
    }
}

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
        
        .slider-btn.active {
            background-color: rgba(16, 185, 129, 0.2);
            border-color: var(--positive-color);
            color: var(--positive-color);
            font-weight: bold;
        }
        
        .slider-btn:hover {
            background-color: rgba(16, 185, 129, 0.1);
        }
        
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

function toggleLoadingIndicator(show) {
    const statItems = document.querySelectorAll('.stat-value');
    
    statItems.forEach(item => {
        if (show) {
            if (item.textContent !== '$---.--' && item.textContent !== '---') {
                item.setAttribute('data-original', item.textContent);
            }
            item.classList.add('loading');
            item.textContent = item.id === 'priceChange' ? 'Loading...' : 'Loading...';
        } else {
            item.classList.remove('loading');
            if (item.getAttribute('data-original')) {
                item.textContent = item.getAttribute('data-original');
                item.removeAttribute('data-original');
            }
        }
    });
}

function initCryptoAPI() {
    console.log("Initializing API, fetching initial data...");

    toggleLoadingIndicator(true);
    
    lastAPICall = 0;
    
    fetchFromBinance().then(success => {
        toggleLoadingIndicator(false);
        
        if (success) {
            console.log("Initial data fetched successfully from Binance");
            const selectedPair = document.getElementById('tradingPair').value;
            updateMarketValues(selectedPair);
            
            initChartData();
            populateOrderBook();
            
        } else {
            console.warn("Failed to fetch initial data from Binance, using fallback");
            useFallbackData();
            
            initChartData();
            populateOrderBook();
        }
    }).catch(error => {
        toggleLoadingIndicator(false);
        
        console.error("Error fetching initial data:", error);
        useFallbackData();
        
        initChartData();
        populateOrderBook();
    });
}

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

function showAPIErrorMessage() {
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
            <div class="notification-title">Data update</div>
            <div class="notification-message">Prices are updated from external sources. Real prices may vary slightly.</div>
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
    }, 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

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

(function injectAPIErrorStyles() {
    const style = document.createElement('style');
    style.textContent = apiErrorStyles;
    document.head.appendChild(style);
})();

function generateHistoricalData(symbol) {
    if (!cryptoData[symbol]) return;
    
    const currentPrice = cryptoData[symbol].price;
    const volatility = Math.abs(cryptoData[symbol].priceChange24h) / 100;
    
    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const dataPoints = [];
    
    const trend = Math.random() > 0.5 ? 1 : -1;
    let lastPrice = currentPrice * (1 - (trend * volatility * 7));
    
    for (let i = 168; i >= 0; i--) {
        const timestamp = now - (i * hourMs);
        const randomChange = (Math.random() - 0.5) * volatility * currentPrice * 0.2;
        const trendChange = trend * (volatility / 24) * currentPrice;
        
        lastPrice = lastPrice + randomChange + trendChange;
        if (lastPrice <= 0) lastPrice = currentPrice * 0.01;

        dataPoints.push({
            x: new Date(timestamp),
            y: lastPrice
        });
    }
    
    if (dataPoints.length > 0) {
        dataPoints[dataPoints.length - 1].y = currentPrice;
    }
    
    priceChartData[symbol] = dataPoints;
    
    updateChart(symbol);
}

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

function updateInterfaceWithCoinData() {
    const selectedPair = document.getElementById('tradingPair').value;
    const symbol = selectedPair.split('/')[0];
    
    if (cryptoData[symbol]) {
        const data = cryptoData[symbol];
        
        syncAllPrices(data.price, symbol);
        
        const priceChangeText = (data.priceChange24h >= 0 ? '+' : '') + data.priceChange24h.toFixed(2) + '%';
        const priceChangeEl = document.getElementById('priceChange');
        if (priceChangeEl) {
            priceChangeEl.textContent = priceChangeText;
            priceChangeEl.className = 'stat-value ' + (data.priceChange24h >= 0 ? 'positive' : 'negative');
        }
        
        const volumeEl = document.getElementById('volume');
        if (volumeEl) {
            volumeEl.textContent = data.volume;
        }
        
        const spread = data.price * 0.0005;
        const spreadPercent = 0.05;
        const spreadEl = document.getElementById('spread');
        if (spreadEl) {
            spreadEl.textContent = `$${spread.toFixed(2)} (${spreadPercent.toFixed(2)}%)`;
        }
    }
}

function updateChart(symbol) {
    if (!window.priceChart || !priceChartData[symbol]) return;
    
    const chart = window.priceChart;
    const prices = priceChartData[symbol];
    
    chart.data.datasets[0].data = prices;
    chart.data.datasets[0].label = `${symbol}/USDT`;
    
    chart.update();
}

function updateSelectedSymbolDisplay(symbol) {
    const coinSymbolSpan = document.querySelector('.trade-header .coin-symbol');
    if (coinSymbolSpan) {
        coinSymbolSpan.textContent = symbol;
    }
    
    const amountLabel = document.querySelector('label[for="orderAmount"]');
    if (amountLabel) {
        amountLabel.textContent = `Amount (${symbol})`;
    }
    
    const placeOrderBtn = document.getElementById('buyBtcBtn');
    if (placeOrderBtn) {
        const action = placeOrderBtn.classList.contains('buy') ? 'Buy' : 'Sell';
        placeOrderBtn.textContent = `${action} ${symbol}`;
    }
}

function createLeverageOptions() {
    if (document.getElementById('leverageOptions')) {
        return;
    }
    
    const leverageContainer = document.createElement('div');
    leverageContainer.id = 'leverageOptions';
    leverageContainer.style.display = 'none';
    
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
    
    const balanceSection = document.querySelector('.balance-section');
    if (balanceSection) {
        balanceSection.parentNode.insertBefore(leverageContainer, balanceSection.nextSibling);
    } else {
        const navTabs = document.querySelector('.nav-tabs');
        if (navTabs) {
            navTabs.parentNode.insertBefore(leverageContainer, navTabs.nextSibling);
        }
    }
    
    const leverageSlider = document.getElementById('leverageSlider');
    const leverageValue = document.querySelector('.leverage-value');
    
    if (leverageSlider && leverageValue) {
        leverageSlider.addEventListener('input', function() {
            const value = this.value;
            leverageValue.textContent = value + 'x';
            
            updateLeverageBalance(value);
        });
    }
    
    const leverageLabels = document.querySelector('.leverage-labels');
    if (leverageLabels) {
        leverageLabels.style.display = 'flex';
        leverageLabels.style.justifyContent = 'space-between';
        leverageLabels.style.marginTop = '5px';
        leverageLabels.style.fontSize = '0.8rem';
        leverageLabels.style.color = 'var(--secondary-text-color)';
    }
}

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
    const toggleBtn = document.getElementById('toggleBalanceBtn');
    
    const walletData = localStorage.getItem('wallet');
    if (walletData && balanceElement) {
        const wallet = JSON.parse(walletData);
        const balance = wallet.totalBalance || 0;
        
        const isHidden = toggleBtn && toggleBtn.innerHTML.includes('fa-eye-slash');
        
        if (isHidden) {
            balanceElement.textContent = '$•••••';
        } else {
            balanceElement.textContent = '$' + balance.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
            });
        }
        
        balanceElement.setAttribute('data-real-value', '$' + balance.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }));
        
        const sliderButtons = document.querySelectorAll('.slider-btn');
        sliderButtons.forEach(button => {
            if (button.getAttribute('data-percent') === '100') {
                const price = parseFloat(document.getElementById('orderPrice').value) || 0;
                if (price > 0) {
                    const maxAmount = balance / price;
                    button.setAttribute('data-max-amount', maxAmount.toFixed(5));
                }
            }
        });
    }
}

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
    let stopPrice = null;
    let limitPrice = null;

    const tradeType = document.querySelector('.nav-tab.active')?.getAttribute('data-trade-type') || 'spot';

    if (orderType === 'market') {
        const symbol = pair.split('/')[0];
        if (window.cryptoData && window.cryptoData[symbol] && window.cryptoData[symbol].price) {
            price = window.cryptoData[symbol].price;
        } else if (window.marketData && window.marketData[pair] && window.marketData[pair].lastPrice) {
            price = window.marketData[pair].lastPrice;
        }
    }

    if (orderType === 'stop') {
        stopPrice = parseFloat(document.getElementById('orderStopPrice')?.value);
        limitPrice = parseFloat(document.getElementById('orderLimitPrice')?.value);
        if (isNaN(stopPrice) || stopPrice <= 0) {
            alert('Enter a valid Stop Price');
            return;
        }
        if (isNaN(limitPrice) || limitPrice <= 0) {
            alert('Enter a valid Limit Price');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Enter a valid amount');
            return;
        }
    }

    if (orderType !== 'stop') {
        if (orderType !== 'market' && (isNaN(price) || price <= 0)) {
            alert('Enter a valid price');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            alert('Enter a valid amount');
            return;
        }
    }

    let balance = 15432.21;
    if (tradeType === 'margin') {
        balance = 46296.63;
    } else if (tradeType === 'futures') {
        balance = 77161.05;
    }
    
    const walletData = localStorage.getItem('wallet');
    let wallet = null;
    if (walletData) {
        wallet = JSON.parse(walletData);
        balance = wallet.totalBalance || balance;
        if (tradeType === 'margin') balance *= 3;
        if (tradeType === 'futures') balance *= 5;
    }

    const total = price * amount;

    const isBuy = side.toLowerCase().includes('buy') || side.toLowerCase().includes('long') || side.toLowerCase().includes('bought');
    if (!isBuy && tradeType === 'spot') {
        const symbol = pair.split('/')[0];
        const coinId = getCoinIdFromSymbol(symbol);
        
        if (wallet && wallet.coins && wallet.coins[coinId]) {
            const availableAmount = wallet.coins[coinId].amount || 0;
            if (amount > availableAmount) {
                alert(`You don't have enough ${symbol} for this transaction. Available: ${availableAmount.toFixed(8)} ${symbol}`);
                return;
            }
        } else {
            alert(`You don't have ${symbol} in your wallet to sell.`);
            return;
        }
    }

    if (isBuy && total > balance) {
        alert(`Insufficient funds for this transaction (${tradeType})`);
        return;
    }

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

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateTimeStr = `${dateStr} ${timeStr}`;

    if (orderType === 'market') {
        addOrderToHistory(actionText, typeText, pair, price, amount);

        addTradeToHistory(price, amount, isBuy);
        
        if (tradeType === 'spot') {
            if (isBuy) {
                updateWalletAfterPurchase(pair, amount, price);
            } else {
                updateWalletAfterSell(pair, amount, price);
            }
        }
    } else {
        const newOrder = {
            dateTime: dateTimeStr,
            pair: pair,
            type: orderType === 'stop' ? 'Stop-Limit' : 'Limit',
            side: actionText,
            price: orderType === 'stop' ? limitPrice : price,
            stopPrice: orderType === 'stop' ? stopPrice : null,
            amount: amount,
            filled: 0,
            status: 'Open',
            tradeType: tradeType,
            isBuy: isBuy
        };
        
        openOrders.unshift(newOrder);
        saveOrders();
        renderOpenOrders();
        
        let typeStr = orderType === 'stop' ? 'Stop-Limit' : 'Limit';
        let priceStr = orderType === 'stop' ? 
            `Stop: $${stopPrice.toFixed(2)}, Limit: $${limitPrice.toFixed(2)}` : 
            `$${price.toFixed(2)}`;
        
        let notificationTitle = `Order ${typeStr} placed`;
        let notificationMessage = `Your ${actionText} ${amount.toFixed(5)} ${pair.split('/')[0]} at ${priceStr} has been added to Open Orders and will be executed automatically when the market price reaches the set limit.`;
    }

    const notification = document.createElement('div');
    notification.className = 'trade-notification';
        
    if (orderType === 'market') {
        const leverageText = tradeType !== 'spot' ? 
            ` with ${tradeType === 'margin' ? '3x' : '5x'} leverage` : '';
    
        const successMsg = `${side === 'buy' ? (tradeType === 'futures' ? 'Long' : 'Bought') : 
            (tradeType === 'futures' ? 'Short' : 'Sold')} ${amount.toFixed(5)} ${pair.split('/')[0]} 
            for $${total.toFixed(2)}${leverageText}`;
            
        notification.innerHTML = `
            <div class="notification-icon ${side === 'buy' ? 'buy' : 'sell'}">
                <i class="fas fa-${side === 'buy' ? 'arrow-down' : 'arrow-up'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${side === 'buy' ? 
                    (tradeType === 'futures' ? 'Long' : 'Bought') : 
                    (tradeType === 'futures' ? 'Short' : 'Sold')} successful (${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)})</div>
                <div class="notification-message">${successMsg}</div>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
    } else {
        let typeStr = orderType === 'stop' ? 'Stop-Limit' : 'Limit';
        let priceStr = orderType === 'stop' ? 
            `Stop: $${stopPrice.toFixed(2)}, Limit: $${limitPrice.toFixed(2)}` : 
            `$${price.toFixed(2)}`;
        
        notification.innerHTML = `
            <div class="notification-icon pending">
                <i class="fas fa-clock"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">Order ${typeStr} placed</div>
                <div class="notification-message">Your ${actionText} ${amount.toFixed(5)} ${pair.split('/')[0]} at ${priceStr} has been added to Open Orders and will be executed automatically when the market price reaches the set limit.</div>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
    }

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
    }, 5000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });

    document.getElementById('orderAmount').value = '';
    document.getElementById('orderTotal').value = '';
    if (document.getElementById('orderStopPrice')) document.getElementById('orderStopPrice').value = '';
    if (document.getElementById('orderLimitPrice')) document.getElementById('orderLimitPrice').value = '';
}

// La fiecare update de preț, execut ordinele Limit dacă e cazul
function checkLimitOrders() {
    // Dacă nu există ordine deschise, nu facem nimic
    if (!openOrders || openOrders.length === 0) return;
    
    console.log("Verificare ordine deschise...");
    
    // Pentru fiecare pereche de trading, obținem prețul curent
    const pairPrices = {};
    
    // Parcurgem ordinele deschise
    for (let i = openOrders.length - 1; i >= 0; i--) {
        const ord = openOrders[i];
        const pair = ord.pair;
        const symbol = pair.split('/')[0];
        
        // Obținem prețul curent al perechii (dacă nu l-am obținut deja)
        if (!pairPrices[pair]) {
            let currentPrice = 0;
            if (window.cryptoData && window.cryptoData[symbol] && window.cryptoData[symbol].price) {
                currentPrice = window.cryptoData[symbol].price;
            } else if (window.marketData && window.marketData[pair] && window.marketData[pair].lastPrice) {
                currentPrice = window.marketData[pair].lastPrice;
            } else {
                // Fallback: citim din UI
                const lastPriceEl = document.getElementById('lastPrice');
                if (lastPriceEl && lastPriceEl.textContent) {
                    currentPrice = parseFloat(lastPriceEl.textContent.replace(/[^0-9.]/g, ''));
                }
            }
            pairPrices[pair] = currentPrice;
        }
        
        const currentPrice = pairPrices[pair];
        if (!currentPrice) continue;
        
        // Flag pentru a urmări dacă ordinul trebuie executat
        let shouldExecute = false;
        
        // Verificăm condițiile în funcție de tipul ordinului (Limit sau Stop-Limit)
        if (ord.type === 'Limit') {
            // Pentru ordine Limit: 
            // - Buy: executăm când prețul <= prețul limit
            // - Sell: executăm când prețul >= prețul limit
            if (ord.side === 'Buy' || ord.side === 'Long' || ord.side === 'Bought (Margin)') {
                shouldExecute = currentPrice <= ord.price;
                
                if (shouldExecute) {
                    console.log(`Executăm ordin Limit Buy pentru ${ord.pair} la prețul ${currentPrice} <= ${ord.price}`);
                }
            } else {
                shouldExecute = currentPrice >= ord.price;
                
                if (shouldExecute) {
                    console.log(`Executăm ordin Limit Sell pentru ${ord.pair} la prețul ${currentPrice} >= ${ord.price}`);
                }
            }
        } else if (ord.type === 'Stop-Limit') {
            // Pentru ordine Stop-Limit, verificăm întâi dacă stop-ul a fost atins
            let stopTriggered = false;
            
            if (ord.side === 'Buy' || ord.side === 'Long' || ord.side === 'Bought (Margin)') {
                // Pentru Buy: stop se activează când prețul >= stop price
                stopTriggered = currentPrice >= ord.stopPrice;
                
                // Apoi verificăm dacă putem executa la prețul limit
                shouldExecute = stopTriggered && currentPrice <= ord.price;
                
                if (stopTriggered && !shouldExecute) {
                    console.log(`Stop activat pentru ${ord.pair} Buy Stop-Limit, dar prețul ${currentPrice} > ${ord.price}`);
                } else if (shouldExecute) {
                    console.log(`Executăm ordin Stop-Limit Buy pentru ${ord.pair} la prețul ${currentPrice}`);
                }
            } else {
                // Pentru Sell: stop se activează când prețul <= stop price
                stopTriggered = currentPrice <= ord.stopPrice;
                
                // Apoi verificăm dacă putem executa la prețul limit
                shouldExecute = stopTriggered && currentPrice >= ord.price;
                
                if (stopTriggered && !shouldExecute) {
                    console.log(`Stop activat pentru ${ord.pair} Sell Stop-Limit, dar prețul ${currentPrice} < ${ord.price}`);
                } else if (shouldExecute) {
                    console.log(`Executăm ordin Stop-Limit Sell pentru ${ord.pair} la prețul ${currentPrice}`);
                }
            }
            
            // Actualizăm statusul ordinului dacă stop-ul a fost activat dar nu s-a executat încă
            if (stopTriggered && !shouldExecute && ord.status === 'Open') {
                ord.status = 'Stop Triggered';
                saveOrders();
                renderOpenOrders();
            }
        }
        
        // Dacă ordinul trebuie executat, îl procesăm și îl scoatem din lista de ordine deschise
        if (shouldExecute) {
            // Adăugăm în istoricul de ordine
            orderHistory.unshift({
                dateTime: new Date().toLocaleString(),
                pair: ord.pair,
                type: ord.type,
                side: ord.side,
                price: currentPrice, // Folosim prețul curent de execuție
                amount: ord.amount,
                status: 'Filled'
            });
            
            // Adăugăm în istoricul de tranzacții
            addTradeToHistory(currentPrice, ord.amount, ord.isBuy);
            
            // Actualizăm portofelul dacă este tranzacție spot
            if (ord.tradeType === 'spot') {
                if (ord.isBuy) {
                    updateWalletAfterPurchase(ord.pair, ord.amount, currentPrice);
                } else {
                    updateWalletAfterSell(ord.pair, ord.amount, currentPrice);
                }
            }
            
            // Afișăm notificare de executare
            const symbol = ord.pair.split('/')[0];
            const actionText = ord.isBuy ? 'Cumpărat' : 'Vândut';
            const notification = document.createElement('div');
            notification.className = 'trade-notification';
            notification.innerHTML = `
                <div class="notification-icon ${ord.isBuy ? 'buy' : 'sell'}">
                    <i class="fas fa-${ord.isBuy ? 'arrow-down' : 'arrow-up'}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">Ordin ${ord.type} executat</div>
                    <div class="notification-message">${actionText} ${ord.amount.toFixed(5)} ${symbol} la prețul $${currentPrice.toFixed(2)}</div>
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
            
            // Eliminăm ordinul din lista de ordine deschise
            openOrders.splice(i, 1);
        }
    }
    
    // Salvăm și actualizăm UI-ul
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

// === AFIȘARE ASSETS DIN WALLET ===
function updateWalletAssetsDisplay() {
    const walletData = localStorage.getItem('wallet');
    const assetsList = document.getElementById('walletAssetsList');
    const portfolioOverview = document.querySelector('.portfolio-overview .value');
    const totalBalance = document.querySelector('.total-balance .value');
    
    if (!assetsList) return;
    
    assetsList.innerHTML = '';
    
    if (!walletData) {
        const emptyWallet = document.createElement('div');
        emptyWallet.className = 'wallet-asset-placeholder';
        emptyWallet.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>No assets found in your wallet</span>
        `;
        assetsList.appendChild(emptyWallet);
        if (portfolioOverview) portfolioOverview.textContent = '$0.00';
        if (totalBalance) totalBalance.textContent = '$0.00';
        return;
    }
    
    const wallet = JSON.parse(walletData);
    
    // Calculăm valoarea totală a portofoliului (doar monedele crypto, fără USDT)
    let portfolioValue = 0;
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        if (coin && coin.amount > 0) {
            const symbol = getCoinSymbolFromId(coinId);
            const currentPrice = cryptoData[symbol]?.price || coin.price;
            portfolioValue += coin.amount * currentPrice;
        }
    }
    
    // Afișăm Portfolio Overview (doar valoarea monedelor crypto)
    if (portfolioOverview) {
        portfolioOverview.textContent = '$' + portfolioValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Calculăm și afișăm Total Balance (USDT + valoarea monedelor)
    const totalValue = (wallet.totalBalance || 0) + portfolioValue;
    if (totalBalance) {
        totalBalance.textContent = '$' + totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Actualizăm și textul din Portfolio Overview header
    const portfolioOverviewHeader = document.querySelector('.portfolio-overview .value-label');
    if (portfolioOverviewHeader) {
        portfolioOverviewHeader.textContent = '$' + portfolioValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    if (!wallet.coins || Object.keys(wallet.coins).length === 0) {
        const emptyWallet = document.createElement('div');
        emptyWallet.className = 'wallet-asset-placeholder';
        emptyWallet.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>No assets found in your wallet</span>
        `;
        assetsList.appendChild(emptyWallet);
        return;
    }
    
    // Restul codului pentru afișarea activelor rămâne neschimbat
    // ... existing code ...
}

// Adăugăm stiluri CSS pentru a îmbunătăți afișarea
(function addWalletAssetStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .wallet-asset-item {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            transition: background-color 0.2s ease;
            cursor: pointer;
        }
        
        .wallet-asset-item:hover {
            background-color: var(--hover-bg);
        }
        
        .wallet-asset-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            margin-right: 16px;
            background: var(--accent-gradient);
            color: white;
        }
        
        .wallet-asset-details {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .wallet-asset-name-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }
        
        .wallet-asset-name {
            font-weight: 600;
            font-size: 15px;
        }
        
        .wallet-asset-symbol {
            color: var(--text-secondary);
            font-size: 13px;
        }
        
        .wallet-asset-amount-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }
        
        .wallet-asset-amount {
            font-weight: 500;
            font-size: 14px;
        }
        
        .wallet-asset-value {
            font-weight: 600;
            font-size: 14px;
        }
        
        .wallet-asset-change {
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .wallet-asset-change.positive {
            color: var(--positive-color);
        }
        
        .wallet-asset-change.negative {
            color: var(--negative-color);
        }
    `;
    document.head.appendChild(style);
})();

// Funcție pentru a obține conținutul iconițelor
function getIconContent(coinId) {
    const icons = {
        'bitcoin': '₿',
        'ethereum': 'Ξ',
        'binancecoin': 'B',
        'ripple': 'X',
        'cardano': 'A',
        'solana': 'S',
        'polkadot': 'D',
        'dogecoin': 'Ð'
    };
    
    return icons[coinId.toLowerCase()] || coinId.substring(0, 1).toUpperCase();
}

// Funcție pentru a obține numele afișabil al monedei
function getCoinName(coinId) {
    const names = {
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum',
        'binancecoin': 'Binance Coin',
        'ripple': 'XRP',
        'cardano': 'Cardano',
        'solana': 'Solana',
        'polkadot': 'Polkadot',
        'dogecoin': 'Dogecoin'
    };
    
    return names[coinId.toLowerCase()] || coinId;
}

// Asigurăm actualizarea UI-ului pentru wallet assets când se face o tranzacție
// Verificăm dacă originalProcessOrder este deja definit
if (typeof originalOrderProcessor === 'undefined') {
    const originalOrderProcessor = processOrder;
    processOrder = function() {
        // Apelăm funcția originală
        originalOrderProcessor.apply(this, arguments);
        
        // Actualizăm afișajul de wallet assets după procesarea ordinului
        setTimeout(updateWalletAssetsDisplay, 500);
    };
}

// Actualizăm periodic afișajul de wallet assets (la fiecare update de preț)
if (typeof originalVisualUpdater === 'undefined') {
    const originalVisualUpdater = forceVisualUpdate;
    forceVisualUpdate = function() {
        originalVisualUpdater.apply(this, arguments);
        
        // Actualizăm și afișajul de wallet assets
        updateWalletAssetsDisplay();
    };
}

// La încărcarea paginii, inițializăm afișajul cu asseturile din wallet
document.addEventListener('DOMContentLoaded', () => {
    // Funcțiile existente
    // ...
    // Adăugăm inițializarea afișajului de wallet assets
    updateWalletAssetsDisplay();
});

// Funcție pentru configurarea și inițializarea Order History
function setupOrderHistory() {
    console.log("Se configurează Order History...");
    
    // Verificăm dacă secțiunea de ordine există deja
    let ordersSection = document.querySelector('.orders-section');
    
    if (!ordersSection) {
        console.log("Creăm secțiunea de ordine");
        
        // Creăm secțiunea principală pentru ordine
        ordersSection = document.createElement('div');
        ordersSection.className = 'orders-section';
        
        // Adăugăm tab-urile
        ordersSection.innerHTML = `
            <div class="orders-tabs">
                <button class="orders-tab-btn active" data-orders-tab="open">Ordine deschise</button>
                <button class="orders-tab-btn" data-orders-tab="history">Istoric ordine</button>
            </div>
            <div class="orders-content">
                <div id="openOrdersTable" class="orders-table-container active">
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Pereche</th>
                                <th>Tip</th>
                                <th>Parte</th>
                                <th>Preț</th>
                                <th>Cantitate</th>
                                <th>Total</th>
                                <th>Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody id="openOrders">
                            <tr class="no-orders-message">
                                <td colspan="7">Nu aveți ordine deschise</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div id="historyOrdersTable" class="orders-table-container">
                    <table class="orders-table">
                        <thead>
                            <tr>
                                <th>Dată</th>
                                <th>Pereche</th>
                                <th>Tip</th>
                                <th>Parte</th>
                                <th>Preț</th>
                                <th>Cantitate</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="orderHistory">
                            <tr class="no-orders-message">
                                <td colspan="8">Nu aveți ordine în istoric</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Adăugăm la container-ul principal
        const tradeContainer = document.querySelector('.trade-container');
        if (tradeContainer) {
            tradeContainer.appendChild(ordersSection);
        } else {
            console.error("Nu s-a găsit container-ul principal (.trade-container)");
            document.body.appendChild(ordersSection);
        }
        
        // Adăugăm event listeners pentru tab-uri
        const orderTabButtons = ordersSection.querySelectorAll('.orders-tab-btn');
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
    
    // Verificăm dacă există elementele necesare pentru tabele
    if (!document.getElementById('openOrders')) {
        console.error("Elementul #openOrders nu există în DOM");
        // Cream elementul care lipsește
        const openOrdersTable = document.getElementById('openOrdersTable');
        if (openOrdersTable) {
            const table = document.createElement('table');
            table.className = 'orders-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Pereche</th>
                        <th>Tip</th>
                        <th>Parte</th>
                        <th>Preț</th>
                        <th>Cantitate</th>
                        <th>Total</th>
                        <th>Acțiuni</th>
                    </tr>
                </thead>
                <tbody id="openOrders">
                    <tr class="no-orders-message">
                        <td colspan="7">Nu aveți ordine deschise</td>
                    </tr>
                </tbody>
            `;
            openOrdersTable.appendChild(table);
        }
    }
    
    if (!document.getElementById('orderHistory')) {
        console.error("Elementul #orderHistory nu există în DOM");
        // Cream elementul care lipsește
        const historyOrdersTable = document.getElementById('historyOrdersTable');
        if (historyOrdersTable) {
            const table = document.createElement('table');
            table.className = 'orders-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Dată</th>
                        <th>Pereche</th>
                        <th>Tip</th>
                        <th>Parte</th>
                        <th>Preț</th>
                        <th>Cantitate</th>
                        <th>Total</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody id="orderHistory">
                    <tr class="no-orders-message">
                        <td colspan="8">Nu aveți ordine în istoric</td>
                    </tr>
                </tbody>
            `;
            historyOrdersTable.appendChild(table);
        }
    }
    
    // Inițializăm tabelele cu datele existente
    renderOpenOrders();
    renderOrderHistory();
    
    console.log("Order History configurat și inițializat cu succes");
}

// Funcție pentru actualizarea portofelului după o cumpărare
function updateWalletAfterPurchase(pair, amount, price) {
    console.log(`Actualizare portofel după cumpărare: ${amount} ${pair.split('/')[0]} la prețul $${price}`);
    
    const symbol = pair.split('/')[0];
    const coinId = getCoinIdFromSymbol(symbol);
    
    if (!coinId) {
        console.error(`Nu s-a putut determina coinId pentru simbolul ${symbol}`);
        return;
    }
    
    const valueUSD = amount * price;
    
    let wallet = JSON.parse(localStorage.getItem('wallet') || '{"totalBalance":0,"coins":{}}');
    
    // Verificăm dacă avem suficiente fonduri USDT
    if (valueUSD > wallet.totalBalance) {
        console.error(`Fonduri insuficiente: necesar $${valueUSD}, disponibil $${wallet.totalBalance}`);
        return;
    }
    
    // Scădem suma cheltuită din balanța totală
    wallet.totalBalance -= valueUSD;
    
    if (!wallet.coins) {
        wallet.coins = {};
    }
    
    // Adăugăm sau actualizăm moneda în portofel
    if (!wallet.coins[coinId]) {
        wallet.coins[coinId] = {
            amount: amount,
            price: price,
            value: valueUSD,
            valueUSD: valueUSD,
            changePercent: cryptoData[symbol]?.priceChange24h || 0
        };
    } else {
        const existingAmount = wallet.coins[coinId].amount || 0;
        const newAmount = existingAmount + amount;
        
        const existingValue = wallet.coins[coinId].value || 0;
        const newValue = existingValue + valueUSD;
        const newAvgPrice = newValue / newAmount;
        
        wallet.coins[coinId] = {
            amount: newAmount,
            price: newAvgPrice,
            value: newValue,
            valueUSD: newValue,
            changePercent: cryptoData[symbol]?.priceChange24h || wallet.coins[coinId].changePercent || 0
        };
    }
    
    // Calculăm valoarea totală a portofoliului (Portfolio Value)
    let portfolioValue = wallet.totalBalance; // Începem cu USDT disponibil
    for (const id in wallet.coins) {
        const coin = wallet.coins[id];
        if (coin && coin.amount > 0) {
            // Folosim prețul curent din cryptoData dacă este disponibil
            const currentPrice = cryptoData[getCoinSymbolFromId(id)]?.price || coin.price;
            portfolioValue += coin.amount * currentPrice;
        }
    }
    
    // Salvăm și valoarea portofoliului separat
    wallet.portfolioValue = portfolioValue;
    
    localStorage.setItem('wallet', JSON.stringify(wallet));
    
    console.log(`Portofel actualizat: ${amount} ${symbol} adăugat, total ${wallet.coins[coinId].amount} ${symbol}`);
    console.log(`Balanță USDT rămasă: $${wallet.totalBalance.toFixed(2)}`);
    console.log(`Valoare totală portofoliu: $${wallet.portfolioValue.toFixed(2)}`);
    
    setTimeout(updateWalletAssetsDisplay, 500);
    updateTradeBalance();
}

// Funcție pentru a determina coinId din simbolul monedei
function getCoinIdFromSymbol(symbol) {
    // Mapare inversă pentru a obține coinId din symbol
    const symbolToCoinId = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'SOL': 'solana',
        'DOT': 'polkadot',
        'DOGE': 'dogecoin'
    };
    
    return symbolToCoinId[symbol] || symbol.toLowerCase();
}

// Funcție pentru actualizarea portofelului după o vânzare
function updateWalletAfterSell(pair, amount, price) {
    console.log(`Actualizare portofel după vânzare: ${amount} ${pair.split('/')[0]} la prețul $${price}`);
    
    const symbol = pair.split('/')[0];
    const coinId = getCoinIdFromSymbol(symbol);
    
    if (!coinId) {
        console.error(`Nu s-a putut determina coinId pentru simbolul ${symbol}`);
        return;
    }
    
    const valueUSD = amount * price;
    
    let wallet = JSON.parse(localStorage.getItem('wallet'));
    
    if (!wallet || !wallet.coins || !wallet.coins[coinId]) {
        console.error(`Moneda ${symbol} nu există în portofel`);
        return;
    }
    
    const existingAmount = wallet.coins[coinId].amount || 0;
    if (existingAmount < amount) {
        console.error(`Fonduri insuficiente: disponibil ${existingAmount} ${symbol}, necesar ${amount} ${symbol}`);
        return;
    }
    
    // Adăugăm valoarea vânzării la balanța totală de USDT
    wallet.totalBalance += valueUSD;
    
    const newAmount = existingAmount - amount;
    
    if (newAmount <= 0) {
        delete wallet.coins[coinId];
        console.log(`Moneda ${symbol} a fost eliminată din portofel (cantitate epuizată)`);
    } else {
        const currentPrice = price;
        const newValue = newAmount * currentPrice;
        
        wallet.coins[coinId] = {
            amount: newAmount,
            price: currentPrice,
            value: newValue,
            valueUSD: newValue,
            changePercent: cryptoData[symbol]?.priceChange24h || wallet.coins[coinId].changePercent || 0
        };
    }
    
    // Calculăm valoarea totală a portofoliului (Portfolio Value)
    let portfolioValue = wallet.totalBalance; // Începem cu USDT disponibil
    for (const id in wallet.coins) {
        const coin = wallet.coins[id];
        if (coin && coin.amount > 0) {
            const currentPrice = cryptoData[getCoinSymbolFromId(id)]?.price || coin.price;
            portfolioValue += coin.amount * currentPrice;
        }
    }
    
    // Salvăm și valoarea portofoliului separat
    wallet.portfolioValue = portfolioValue;
    
    localStorage.setItem('wallet', JSON.stringify(wallet));
    
    console.log(`Portofel actualizat după vânzare: ${amount} ${symbol} vândut, nou sold: ${newAmount > 0 ? newAmount : 0} ${symbol}`);
    console.log(`Balanță USDT actuală: $${wallet.totalBalance.toFixed(2)}`);
    console.log(`Valoare totală portofoliu: $${wallet.portfolioValue.toFixed(2)}`);
    
    updateWalletAssetsDisplay();
    updateTradeBalance();
}

// Funcție pentru a verifica și actualiza valorile din wallet cu date reale
function updateWalletWithRealData() {
    const walletData = localStorage.getItem('wallet');
    if (!walletData) return;
    
    try {
        const wallet = JSON.parse(walletData);
        if (!wallet.coins) return;
        
        let updated = false;
        
        // Mapare între ID-urile din wallet și cele din cryptoData
        const coinIdToSymbol = {
            'bitcoin': 'BTC',
            'ethereum': 'ETH',
            'binancecoin': 'BNB',
            'ripple': 'XRP',
            'cardano': 'ADA',
            'solana': 'SOL',
            'polkadot': 'DOT',
            'dogecoin': 'DOGE'
        };
        
        // Pentru fiecare monedă, actualizăm prețul curent și procentajul
        for (const coinId in wallet.coins) {
            const coin = wallet.coins[coinId];
            const symbol = coinIdToSymbol[coinId] || coinId.toUpperCase();
            
            // Verificăm dacă avem date pentru această monedă
            if (cryptoData && cryptoData[symbol]) {
                const realPrice = cryptoData[symbol].price;
                const realChangePercent = cryptoData[symbol].priceChange24h;
                
                // Actualizăm datele din wallet dacă sunt disponibile și valide
                if (realPrice && !isNaN(realPrice) && isFinite(realPrice)) {
                    coin.price = realPrice;
                    updated = true;
                }
                
                if (realChangePercent !== undefined && !isNaN(realChangePercent) && isFinite(realChangePercent)) {
                    coin.changePercent = realChangePercent;
                    updated = true;
                }
                
                // Recalculăm valoarea în USD
                if (coin.amount && coin.price) {
                    coin.valueUSD = coin.amount * coin.price;
                    updated = true;
                }
            }
        }
        
        // Recalculăm totalBalance dacă am făcut actualizări
        if (updated) {
            let totalBalance = 0;
            for (const coinId in wallet.coins) {
                const coin = wallet.coins[coinId];
                if (coin.valueUSD) {
                    totalBalance += coin.valueUSD;
                }
            }
            wallet.totalBalance = totalBalance;
            
            // Salvăm wallet-ul actualizat
            localStorage.setItem('wallet', JSON.stringify(wallet));
            console.log("Wallet actualizat cu prețuri reale");
        }
    } catch (error) {
        console.error("Eroare la actualizarea wallet-ului:", error);
    }
}

// Modificăm funcția fetchCryptoData pentru a actualiza și wallet-ul
async function fetchCryptoData() {
    const now = Date.now();
    if (now - lastAPICall < API_CALL_DELAY) return;
    try {
        const success = await fetchFromBinance();
        if (!success) throw new Error('Binance nu a returnat date');
        lastAPICall = now;
        
        // După ce obținem date reale, actualizăm și wallet-ul
        updateWalletWithRealData();
        
        return true;
    } catch (error) {
        console.error('Eroare la preluarea datelor:', error);
        useFallbackData();
        showAPIErrorMessage();
        return false;
    }
}

// Funcție pentru inițializarea funcționalității de toggle pentru vizibilitatea soldului
function initializeBalanceVisibilityToggle() {
    const toggleBtn = document.getElementById('toggleBalanceBtn');
    const balanceElement = document.getElementById('availableBalance');
    
    if (!toggleBtn || !balanceElement) {
        console.error('Nu s-au găsit elementele necesare pentru toggle-ul de vizibilitate al soldului');
        return;
    }
    
    // Creăm un element pentru afișarea balanței ascunse
    const hiddenBalanceText = '•••••';
    let isVisible = true;
    
    // Adăugăm event listener pentru buton
    toggleBtn.addEventListener('click', function(e) {
        // Prevenim propagarea evenimentului pentru a evita comportamente nedorite
        e.preventDefault();
        e.stopPropagation();
        
        isVisible = !isVisible;
        
        if (isVisible) {
            // Arătăm soldul - folosim valoarea reală salvată în atribut
            const realValue = balanceElement.getAttribute('data-real-value');
            balanceElement.textContent = realValue || balanceElement.textContent;
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.title = 'Hide Balance';
        } else {
            // Ascundem soldul
            balanceElement.textContent = '$' + hiddenBalanceText;
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            toggleBtn.title = 'Show Balance';
        }
    });
}

// Adăugăm o funcție de utilitate pentru a sincroniza toate prețurile din interfață
function syncAllPrices(price, symbol) {
    if (!price || isNaN(price)) {
        console.warn('Încercare de sincronizare cu un preț invalid:', price);
        return false;
    }
    
    // Verificăm dacă avem obiectul de date pentru simbol
    if (!cryptoData[symbol]) {
        console.warn(`Nu avem date pentru simbolul ${symbol}`);
        return false;
    }
    
    const data = cryptoData[symbol];
    
    // Formatăm prețul pentru a fi folosit consecvent
    const formattedPrice = parseFloat(price).toFixed(2);
    const formattedPriceWithDollar = `$${formattedPrice}`;
    
    // Actualizăm toate elementele de preț din interfață cu aceeași valoare
    const elementsToUpdate = [
        { id: 'lastPrice', format: formattedPriceWithDollar },
        { id: 'orderBookPrice', format: formattedPriceWithDollar },
        { id: 'orderPrice', format: formattedPrice, isInput: true },
        { id: 'highPrice', format: `$${data.high24h.toFixed(2)}` },
        { id: 'lowPrice', format: `$${data.low24h.toFixed(2)}` }
    ];
    
    // Actualizăm toate elementele din listă cu verificări pentru null
    elementsToUpdate.forEach(element => {
        const el = document.getElementById(element.id);
        if (el) {
            if (element.isInput) {
                el.value = element.format;
            } else {
                el.textContent = element.format;
            }
        }
    });
    
    // Actualizăm și celelalte componente dependente de preț
    try {
        // Recalculăm totalul în orice formular de tranzacționare activ
        if (typeof calculateTotal === 'function') calculateTotal();
        
        // Actualizăm orderbook-ul și graficul cu valorile sincronizate
        if (typeof updateChart === 'function') updateChart(symbol);
        if (typeof populateOrderBook === 'function') populateOrderBook(parseFloat(price));
        
        // Actualizăm portofelul cu noile prețuri
        if (typeof updateWalletWithRealData === 'function') updateWalletWithRealData();
    } catch (error) {
        console.error('Eroare la sincronizarea prețurilor:', error);
        return false;
    }
    
    return true;
}

function getCoinSymbolFromId(coinId) {
    const coinIdToSymbol = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'binancecoin': 'BNB',
        'ripple': 'XRP',
        'cardano': 'ADA',
        'solana': 'SOL',
        'polkadot': 'DOT',
        'dogecoin': 'DOGE'
    };
    
    return coinIdToSymbol[coinId] || coinId.toUpperCase();
}