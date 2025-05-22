document.addEventListener('DOMContentLoaded', () => {
    // Adăugăm stil pentru graficele din tabel - mai înalte și mai puțin late
    const style = document.createElement('style');
    style.textContent = `
        .chart-cell {
            width: 150px;
            height: 80px;
            padding: 8px 2px !important;
        }
        .mini-chart {
            height: 100% !important;
            width: 100% !important;
        }
        
        /* Stil pentru anteturile coloanelor */
        .header-content {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .sort-arrow {
            margin-top: 2px;
        }
        
        /* Stil pentru valorile din celule */
        .column-value {
            display: flex;
            justify-content: center;
            text-align: center;
        }
        
        .volume-cell, .market-cap-cell {
            text-align: center;
        }
        
        .price-cell, .change-cell {
            text-align: center;
        }
        
        /* Ajustări pentru layout */
        .crypto-table th {
            text-align: center;
            vertical-align: middle;
        }
        
        /* Fixare dimensiuni carusel - SOLUȚIE COMPLETĂ */
        .carousel-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            position: relative !important;
            box-sizing: border-box !important;
            margin-left: auto !important;
            margin-right: auto !important;
            height: 190px !important; /* Înălțime fixă pentru container */
        }
        
        #carouselTrack {
            display: flex !important;
            width: max-content !important;
            transition: none !important; /* Dezactivăm tranziția inițială complet */
            height: 190px !important; /* Înălțime fixă pentru track */
        }
        
        .coin-card {
            width: 240px !important;
            height: 190px !important; /* Înălțime fixă pentru carduri */
            flex-shrink: 0 !important;
            flex-grow: 0 !important;
            margin-right: 15px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            padding: 16px !important;
        }
        
        .coin-card .chart-container {
            flex: 1 !important;
            height: 50px !important; /* Înălțime fixă pentru container grafic */
            max-height: 50px !important;
            min-height: 50px !important;
            overflow: hidden !important;
            margin-top: 8px !important;
        }
        
        /* Când modalul este deschis, asigură-te că caruselul rămâne stabil */
        body.modal-open {
            overflow: auto !important;
            padding-right: 0 !important; /* Previne shiftarea conținutului */
        }
        
        body.modal-open .carousel-container,
        .coinModal.active ~ .carousel-container,
        #coinModal.active ~ .carousel-container {
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            height: 190px !important;
        }
        
        /* Asigură poziționarea corectă a modalului */
        #coinModal {
            position: fixed !important;
            z-index: 1000 !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            margin: 0 !important;
        }
        
        /* Previne probleme de scroll */
        html, body {
            overflow-x: hidden !important;
        }
        
        /* Forțează scroll-ul să rămână vizibil */
        body::-webkit-scrollbar {
            width: auto !important;
            display: block !important;
        }
        
        /* Stiluri specifice pentru modal */
        #coinModal .chart-container {
            height: 400px !important;
            max-height: 400px !important;
            min-height: 300px !important;
            width: 100% !important;
            overflow: visible !important;
        }
        
        #modalChart {
            width: 100% !important;
            height: 100% !important;
        }
        
        .period-button {
            padding: 5px 15px;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            background: var(--card-background);
            color: var(--text-color);
            cursor: pointer;
            transition: all 0.2s;
            margin-right: 5px;
        }
        
        .period-button.active, .period-button:hover {
            background: var(--accent-color);
            color: white;
        }
        
        /* Marginea de jos pentru butoanele de perioadă */
        .chart-periods {
            margin-bottom: 15px;
        }
        
        /* Ajustări pentru statistici în modal */
        .modal-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: var(--card-background);
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .stat-label {
            color: var(--secondary-text-color);
            font-size: 0.9rem;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 1.2rem;
            font-weight: 500;
        }
        
        .stat-change {
            font-size: 0.9rem;
            margin-left: 5px;
        }
        
        .stat-change.positive {
            color: var(--positive-color);
        }
        
        .stat-change.negative {
            color: var(--negative-color);
        }
    `;
    document.head.appendChild(style);
    
    // Dezactivăm tranziția caruselului la început direct
    const carouselTrackInlineStyle = document.createElement('style');
    carouselTrackInlineStyle.textContent = `
        #carouselTrack {
            transition: none !important;
        }
    `;
    document.head.appendChild(carouselTrackInlineStyle);

    // Lista extinsă de monede folosind ID-urile CoinGecko
    const ALL_COINS = [
        // Top 10 după capitalizare
        'bitcoin', 'ethereum', 'binancecoin', 'ripple', 'cardano', 'solana', 'polkadot', 'dogecoin', 'avalanche-2', 'matic-network',
        // Următoarele 20 monede populare
        'chainlink', 'uniswap', 'cosmos', 'litecoin', 'ethereum-classic', 'stellar', 'algorand', 'vechain', 'decentraland', 'the-sandbox'
        // Limităm numărul de monede pentru a evita depășirea ratei API
    ];
    
    // Mapare pentru simboluri
    const COIN_SYMBOLS = {
        'bitcoin': 'BTC', 'ethereum': 'ETH', 'binancecoin': 'BNB', 'ripple': 'XRP', 'cardano': 'ADA',
        'solana': 'SOL', 'polkadot': 'DOT', 'dogecoin': 'DOGE', 'avalanche-2': 'AVAX', 'matic-network': 'MATIC',
        'chainlink': 'LINK', 'uniswap': 'UNI', 'cosmos': 'ATOM', 'litecoin': 'LTC', 'ethereum-classic': 'ETC',
        'stellar': 'XLM', 'algorand': 'ALGO', 'vechain': 'VET', 'decentraland': 'MANA', 'the-sandbox': 'SAND'
    };
    
    // Mapare pentru numele complete
    const COIN_NAMES = {
        'bitcoin': 'Bitcoin', 'ethereum': 'Ethereum', 'binancecoin': 'Binance Coin', 'ripple': 'XRP', 'cardano': 'Cardano',
        'solana': 'Solana', 'polkadot': 'Polkadot', 'dogecoin': 'Dogecoin', 'avalanche-2': 'Avalanche', 'matic-network': 'Polygon',
        'chainlink': 'Chainlink', 'uniswap': 'Uniswap', 'cosmos': 'Cosmos', 'litecoin': 'Litecoin', 'ethereum-classic': 'Ethereum Classic',
        'stellar': 'Stellar', 'algorand': 'Algorand', 'vechain': 'VeChain', 'decentraland': 'Decentraland', 'the-sandbox': 'The Sandbox'
    };
    
    // Mapare pentru tipurile de blockchain (Nativ/Token)
    const BLOCKCHAIN_TYPES = {
        'bitcoin': 'Nativ', 
        'ethereum': 'Nativ', 
        'binancecoin': 'Nativ', 
        'ripple': 'Nativ', 
        'cardano': 'Nativ',
        'solana': 'Nativ', 
        'polkadot': 'Nativ', 
        'dogecoin': 'Nativ', 
        'avalanche-2': 'Nativ', 
        'matic-network': 'Nativ',
        'cosmos': 'Nativ',
        'litecoin': 'Nativ',
        'ethereum-classic': 'Nativ',
        'stellar': 'Nativ',
        'algorand': 'Nativ',
        'vechain': 'Nativ',
        'chainlink': 'Token ERC-20', 
        'uniswap': 'Token ERC-20', 
        'decentraland': 'Token ERC-20', 
        'the-sandbox': 'Token ERC-20'
    };
    
    // Serviciul de proxy CORS pentru a ocoli restricțiile
    const CORS_PROXY = 'https://corsproxy.io/?';
    
    // Cache pentru datele API pentru a reduce numărul de cereri
    const apiCache = {
        lastFetchTimestamp: 0,
        marketData: null,
        historicalData: {},
        coinDetails: {}
    };
    
    // Timpul minim între cereri (15 secunde) - mărim timpul pentru a reduce numărul total de cereri
    const MIN_REQUEST_INTERVAL = 60 * 1000; // 60 secunde între cereri
    
    const CAROUSEL_COINS = ALL_COINS.slice(0, 10); // Păstrăm primele 10 pentru carusel
    const ITEMS_PER_PAGE = 15;
    let currentPage = 1;
    let tableData = [];

    // Cache pentru date demonstrative în caz că API-ul eșuează
    const demoDataCache = {};
    
    const carouselTrack = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carouselContainer = document.querySelector('.carousel-container');

    let coinData = []; // Datele pentru carduri
    let currentPosition = 0; // Poziția curentă a track-ului (translateX)
    let animationId = null; // ID-ul returnat de requestAnimationFrame, null dacă nu rulează
    let isHovered = false; // Starea hover
    const CARD_WIDTH_WITH_MARGIN = 255; // Lățime card (240px) + margine dreapta (15px)
    let speed = 0.2; // Viteza de scroll (redusă)

    const modal = document.getElementById('coinModal');
    const modalClose = document.querySelector('.modal-close');
    let currentCoin = null;
    let modalChart = null;
    let currentChartPeriod = '24h'; // Store the currently selected period

    // Adăugăm variabile pentru căutare și filtrare
    let searchTerm = '';
    let filterValue = 'all';
    let blockchainTypeFilter = 'all'; // New variable to track blockchain type filter
    let filteredData = [];
    
    let currentSort = { key: null, direction: 'desc' };

    // Adaug referințe pentru mini-charts
    const miniCharts = {};
    
    // Adaug cache pentru graficele din tabel
    const tableCharts = {};

    // Funcția care lipsește - creează elementul DOM pentru un card de monedă
    function createCoinCardElement(coin, index) {
        const card = document.createElement('div');
        card.className = 'coin-card';
        card.setAttribute('data-index', index);
        card.setAttribute('data-id', coin.id);
        
        // Determinăm clasa pentru schimbarea de preț (pozitivă sau negativă)
        const changeClass = coin.change24h >= 0 ? 'positive' : 'negative';
        const changeSign = coin.change24h >= 0 ? '+' : '';
        
        // Construim conținutul HTML al cardului
        card.innerHTML = `
            <div class="coin-info">
                <img src="${coin.imageUrl}" alt="${coin.symbol}" class="coin-icon">
                <div class="coin-name-container">
                    <span class="coin-name">${coin.name}</span>
                    <span class="coin-symbol">${coin.symbol}</span>
                </div>
            </div>
            <div class="coin-price-container">
                <div class="coin-price">$${coin.price.toFixed(2)}</div>
                <div class="coin-change ${changeClass}">${changeSign}${coin.change24h.toFixed(2)}%</div>
            </div>
            <div class="chart-container">
                <canvas id="mini-chart-${index}" width="220" height="50"></canvas>
            </div>
        `;
        
        return card;
    }

    // Funcție pentru inițializarea unui mini-grafic în cardul unei monede
    function initializeMiniChart(card, coin) {
        const index = card.getAttribute('data-index');
        const canvas = card.querySelector(`#mini-chart-${index}`);
        
        if (!canvas) return;
        
        try {
            const ctx = canvas.getContext('2d');
            
            // Setăm dimensiunile canvas-ului
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            
            // Configurăm culorile
            const isPositive = coin.change24h >= 0;
            const positiveColor = '#10b981'; // verde
            const negativeColor = '#ef4444'; // roșu
            const lineColor = isPositive ? positiveColor : negativeColor;
            
            // Creăm un gradient mai elegant pentru fundal
            const gradient = ctx.createLinearGradient(0, 0, 0, 50);
            const alpha = Math.min(Math.abs(coin.change24h) / 10, 0.4);
            if (isPositive) {
                gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(16, 185, 129, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);
            } else {
                gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(239, 68, 68, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
            }
            
            // Verificăm formatul datelor
            let priceData;
            if (Array.isArray(coin.historicalData)) {
                priceData = coin.historicalData;
            } else if (coin.historicalData && coin.historicalData.prices) {
                priceData = coin.historicalData.prices;
            } else {
                priceData = Array(12).fill(0).map(() => coin.price * (1 + (Math.random() * 0.1 - 0.05)));
            }
            
            // Utilizăm toate punctele disponibile pentru un grafic mai detaliat
            const compactData = priceData.slice(0, 24);
            
            // Calculăm volatilitatea pentru a ajusta aspectul graficului
            const volatility = Math.abs(coin.change24h) / 100;
            let tension = 0.35; // tensiune de bază
            
            // Ajustăm tensiunea în funcție de volatilitate
            if (volatility > 0.05) tension = 0.25;
            if (volatility > 0.1) tension = 0.2;
            
            // Calculăm grosimea liniei în funcție de volatilitate
            const lineWidth = Math.min(2.5, 1.5 + volatility * 12);
            
            // Distrugem orice grafic existent pentru acest element
            if (miniCharts[index]) {
                miniCharts[index].destroy();
                delete miniCharts[index];
            }
            
            // Creăm și salvăm instanța graficului
            miniCharts[index] = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: compactData.map(() => ''),
                    datasets: [{
                        data: compactData,
                        borderColor: lineColor,
                        borderWidth: lineWidth,
                        fill: true,
                        backgroundColor: gradient,
                        tension: tension,
                        pointRadius: 0, // fără puncte
                        pointHoverRadius: 0,
                        cubicInterpolationMode: 'monotone'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 500 // Animație moderată
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        } catch (err) {
            console.error(`Eroare la crearea mini-graficului pentru ${coin.symbol}:`, err);
        }
    }

    // Funcție pentru a apela un URL prin proxy CORS cu gestionare avansată a erorilor
    async function fetchWithProxy(url, forceRefresh = false) {
        try {
            // Verificăm dacă avem deja date în cache
            if (!forceRefresh) {
                if (url.includes('markets?') && apiCache.marketData && Date.now() - apiCache.lastFetchTimestamp < MIN_REQUEST_INTERVAL) {
                    console.log('Folosim datele din cache pentru toate monedele.');
                    return apiCache.marketData;
                } else if (url.includes('market_chart')) {
                    const coinId = url.split('/coins/')[1].split('/')[0];
                    const period = url.includes('days=1') ? '24h' : 
                                url.includes('days=7') ? '7d' : 
                                url.includes('days=30') ? '30d' : '1y';
                    
                    const cacheKey = `${coinId}-${period}`;
                    const cachedData = apiCache.historicalData[cacheKey];
                    
                    if (cachedData && Date.now() - cachedData.timestamp < MIN_REQUEST_INTERVAL * 10) {
                        console.log(`Folosim datele din cache pentru ${coinId} (${period}).`);
                        return cachedData.data;
                    }
                } else if (url.includes('/coins/') && !url.includes('market_chart')) {
                    const coinId = url.split('/coins/')[1].split('?')[0];
                    const cachedData = apiCache.coinDetails[coinId];
                    
                    if (cachedData && Date.now() - cachedData.timestamp < MIN_REQUEST_INTERVAL * 20) {
                        console.log(`Folosim datele din cache pentru detaliile monedei ${coinId}.`);
                        return cachedData.data;
                    }
                }
            }
            
            // Adăugăm un delay aleator pentru a evita prea multe cereri simultane
            await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
            
            // Folosim proxy-ul local pentru toate cererile API
            const localProxyUrl = 'http://127.0.0.1:5000/api/proxy?url=';
            
            // Verificăm dacă putem folosi endpoint-ul dedicat pentru prețuri
            let response;
            let data;
            
            if (url.includes('markets?vs_currency=usd&ids=') && !url.includes('sparkline=true')) {
                // Pentru cereri de piață, utilizăm ruta /api/prices direct
                console.log(`Utilizăm endpoint-ul dedicat /api/prices`);
                response = await fetch('http://127.0.0.1:5000/api/prices');
            } else {
                // Pentru alte cereri, folosim proxy-ul general
                console.log(`Fetch nou prin proxy: ${url}`);
                response = await fetch(localProxyUrl + encodeURIComponent(url));
            }
            
            if (response.status === 429) {
                console.warn('Rate limit depășit la CoinGecko. Folosim datele demo.');
                showRateLimitNotification();
                throw new Error('RATE_LIMIT_EXCEEDED');
            }
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            data = await response.json();
            
            // Salvăm datele în cache
            if (url.includes('markets?')) {
                apiCache.marketData = data;
                apiCache.lastFetchTimestamp = Date.now();
            } else if (url.includes('market_chart')) {
                const coinId = url.split('/coins/')[1].split('/')[0];
                const period = url.includes('days=1') ? '24h' : 
                              url.includes('days=7') ? '7d' : 
                              url.includes('days=30') ? '30d' : '1y';
                              
                const cacheKey = `${coinId}-${period}`;
                apiCache.historicalData[cacheKey] = {
                    data: data,
                    timestamp: Date.now()
                };
            } else if (url.includes('/coins/') && !url.includes('market_chart')) {
                const coinId = url.split('/coins/')[1].split('?')[0];
                
                apiCache.coinDetails[coinId] = {
                    data: data,
                    timestamp: Date.now()
                };
            }
            
            return data;
        } catch (error) {
            console.warn(`Error fetching from ${url}:`, error);
            
            // Adăugăm o notificare vizuală că API-ul a eșuat
            if (error.message === 'RATE_LIMIT_EXCEEDED') {
                showRateLimitNotification();
                // Generăm date demo corespunzătoare tipului de cerere
                if (url.includes('markets?')) {
                    return ALL_COINS.map((coin, index) => generateDemoData(coin, index));
                } else if (url.includes('/coins/') && !url.includes('market_chart')) {
                    const coinId = url.split('/coins/')[1].split('?')[0];
                    const coin = tableData.find(c => c.id === coinId) || generateDemoData(coinId, 0);
                    
                    if (coin) {
                        console.log(`Generăm date demo pentru ${coinId} după rate limit`);
                        return {
                            id: coin.id,
                            symbol: coin.symbol.toLowerCase(),
                            name: coin.name,
                            market_data: {
                                current_price: { usd: coin.price },
                                price_change_percentage_24h: coin.change24h,
                                market_cap: { usd: coin.marketCap },
                                total_volume: { usd: coin.volume24h },
                                high_24h: { usd: coin.price * 1.05 },
                                low_24h: { usd: coin.price * 0.95 }
                            }
                        };
                    }
                } else if (url.includes('market_chart')) {
                    const coinId = url.split('/coins/')[1].split('/')[0];
                    const coin = tableData.find(c => c.id === coinId) || generateDemoData(coinId, 0);
                    const points = url.includes('days=1') ? 24 : 
                                url.includes('days=7') ? 168 : 
                                url.includes('days=30') ? 720 : 365;
                    
                    const historicalData = generateHistoricalData(coin.price, coin.change24h, points);
                    
                    // Format similar with what the API would return
                    return {
                        prices: historicalData.prices.map((price, i) => [historicalData.timestamps[i].getTime(), price])
                    };
                }
            }
            
            throw error;
        }
    }
    
    // Funcție pentru afișarea notificării de rate limit
    function showRateLimitNotification() {
        // Verificăm dacă există deja o notificare
        if (document.querySelector('.api-limit-notification')) {
            return;
        }
        
        const notificationElement = document.createElement('div');
        notificationElement.className = 'api-limit-notification';
        notificationElement.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-exclamation-circle"></i>
                <span>Limită API atinsă. Unele date pot fi aproximative.</span>
            </div>
        `;
        
        // Stilizăm notificarea
        notificationElement.style.position = 'fixed';
        notificationElement.style.bottom = '20px';
        notificationElement.style.right = '20px';
        notificationElement.style.background = 'rgba(255, 177, 0, 0.9)';
        notificationElement.style.color = '#333';
        notificationElement.style.padding = '10px 15px';
        notificationElement.style.borderRadius = '4px';
        notificationElement.style.zIndex = '2000';
        notificationElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        
        document.body.appendChild(notificationElement);
        
        // Eliminăm după 5 secunde
        setTimeout(() => {
            notificationElement.style.opacity = '0';
            notificationElement.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                try {
                    if (notificationElement.parentNode) {
                        notificationElement.parentNode.removeChild(notificationElement);
                    }
                } catch (e) {
                    console.warn('Eroare la eliminarea notificării:', e);
                }
            }, 500);
        }, 5000);
    }

    // Funcție pentru generarea datelor demonstrative
    function generateDemoData(coin, index) {
        // Verificăm dacă avem deja date generate pentru această monedă
        if (demoDataCache[coin]) {
            return demoDataCache[coin];
        }
        
        // Prețuri de bază pentru monede principale
        const basePrices = {
            'bitcoin': 60000, 'ethereum': 3500, 'binancecoin': 450, 'ripple': 0.5, 'cardano': 0.6,
            'solana': 120, 'polkadot': 20, 'dogecoin': 0.1, 'avalanche-2': 30, 'matic-network': 1.2
        };
        
        // Preț implicit pentru monede care nu au preț definit
        const basePrice = basePrices[coin] || (100 / (index + 1));
        
        // Generăm o variație de ±5%
        const priceVariation = (Math.random() * 10 - 5) / 100;
        const price = basePrice * (1 + priceVariation);
        
        // Generăm un procent de schimbare între -10% și +10%
        const change24h = (Math.random() * 20 - 10);
        
        // Generăm volume și market cap bazate pe price
        const volume24h = price * 1000000 * (1 + Math.random() * 2);
        const marketCap = price * 10000000 * (1 + Math.random() * 3);
        
        // Generăm date istorice pentru grafice (24 puncte pentru oră)
        const historicalData = Array(24).fill(0).map((_, i) => {
            // Variație de ±3%
            const hourlyVariation = (Math.random() * 6 - 3) / 100;
            return price * (1 + hourlyVariation);
        });
        
        const demoData = {
            id: coin,
            symbol: COIN_SYMBOLS[coin] || coin.substring(0, 4).toUpperCase(),
            name: COIN_NAMES[coin] || coin.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            price: price,
            change24h: change24h,
            volume24h: volume24h,
            marketCap: marketCap,
            imageUrl: getCoinImageUrl(coin),
            historicalData: historicalData,
            blockchainType: BLOCKCHAIN_TYPES[coin] || 'Token'
        };
        
        // Salvăm în cache
        demoDataCache[coin] = demoData;
        
        return demoData;
    }
    
    // URL-uri pentru imagini de monede
    function getCoinImageUrl(coinId) {
        // Folosim API-ul CoinGecko pentru imagini
        const imageMap = {
            'bitcoin': 'bitcoin', 
            'ethereum': 'ethereum', 
            'binancecoin': 'binance-coin', 
            'ripple': 'xrp', 
            'cardano': 'cardano'
        };
        
        const formattedId = imageMap[coinId] || coinId;
        return `https://assets.coingecko.com/coins/images/1/small/${formattedId}.png`;
    }

    // Funcție unificată pentru a obține toate datele și a actualiza caruselul și tabelul
    async function fetchAllCoinData(forceRefresh = false) {
        try {
            let allData;
            // Folosește cache dacă nu e nevoie de refresh
            if (Date.now() - apiCache.lastFetchTimestamp < MIN_REQUEST_INTERVAL && apiCache.marketData && !forceRefresh) {
                console.log('Folosim datele din cache pentru toate monedele.');
                allData = apiCache.marketData;
            } else {
                const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ALL_COINS.join(',')}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
                allData = await fetchWithProxy(url, forceRefresh);
                if (!allData || !Array.isArray(allData) || allData.length === 0) {
                    throw new Error('Nu am primit date de la API');
                }
                apiCache.marketData = allData;
                apiCache.lastFetchTimestamp = Date.now();
            }
            
            // Actualizează datele pentru carusel (primele 10)
            coinData = allData.slice(0, 10).map((coin) => {
                const historicalData = generateHistoricalData(coin.current_price, coin.price_change_percentage_24h, 24);
                return {
                    id: coin.id,
                    symbol: coin.symbol.toUpperCase(),
                    name: coin.name,
                    price: coin.current_price,
                    change24h: coin.price_change_percentage_24h,
                    volume24h: coin.total_volume,
                    marketCap: coin.market_cap,
                    imageUrl: coin.image,
                    historicalData: historicalData,
                    blockchainType: BLOCKCHAIN_TYPES[coin.id] || 'Token'
                };
            });
            
            // Actualizează datele pentru tabel (toate)
            tableData = allData.map(coin => {
                const historicalData = generateHistoricalData(coin.current_price, coin.price_change_percentage_24h, 7);
                return {
                    id: coin.id,
                    symbol: coin.symbol.toUpperCase(),
                    name: coin.name,
                    price: coin.current_price,
                    change24h: coin.price_change_percentage_24h || 0,
                    volume24h: coin.total_volume || 0,
                    marketCap: coin.market_cap || 0,
                    imageUrl: coin.image,
                    historicalData: historicalData,
                    blockchainType: BLOCKCHAIN_TYPES[coin.id] || 'Token'
                };
            });
            
            // Asigurăm că avem suficiente monede token pentru test
            if (tableData.filter(c => c.blockchainType === 'Token').length < 5) {
                console.log("Adăugăm monede token suplimentare pentru testare");
                // Adăugăm câteva monede token demo
                const tokenCoins = [
                    {id: 'usdc', name: 'USD Coin', symbol: 'USDC', price: 1.00},
                    {id: 'dai', name: 'Dai', symbol: 'DAI', price: 1.00},
                    {id: 'chainlink', name: 'Chainlink', symbol: 'LINK', price: 15.25},
                    {id: 'uniswap', name: 'Uniswap', symbol: 'UNI', price: 8.50},
                    {id: 'wrapped-bitcoin', name: 'Wrapped Bitcoin', symbol: 'WBTC', price: 108000.00}
                ];
                
                tokenCoins.forEach((tokenCoin, index) => {
                    if (!tableData.find(c => c.id === tokenCoin.id)) {
                        const demoData = generateDemoData(tokenCoin.id, 100 + index);
                        demoData.blockchainType = 'Token';
                        tableData.push(demoData);
                    }
                });
            }
            
            filteredData = [...tableData];
            
            // Afișăm distribuția tipurilor pentru debugging
            const nativeCount = tableData.filter(c => c.blockchainType === 'Nativ').length;
            const tokenCount = tableData.filter(c => c.blockchainType === 'Token').length;
            console.log(`Distribuție monede: ${nativeCount} native, ${tokenCount} token`);
        } catch (error) {
            console.warn('Eroare la actualizarea datelor din API:', error);
            // Fallback la date demo pentru carusel și tabel
            coinData = CAROUSEL_COINS.map((coin, index) => generateDemoData(coin, index));
            tableData = ALL_COINS.map((coin, index) => generateDemoData(coin, index));
            
            // Asigurăm că avem suficiente monede token pentru test
            if (tableData.filter(c => c.blockchainType === 'Token').length < 5) {
                console.log("Adăugăm monede token suplimentare pentru testare");
                // Adăugăm câteva monede token demo
                for (let i = 0; i < 5; i++) {
                    const demoToken = {
                        id: `token-${i}`,
                        name: `Token Demo ${i+1}`,
                        symbol: `TKN${i+1}`,
                        price: 10 + i*5,
                        change24h: (Math.random() * 10) - 5,
                        volume24h: 1000000 * (i+1),
                        marketCap: 10000000 * (i+2),
                        imageUrl: getCoinImageUrl('ethereum'),
                        historicalData: generateHistoricalData(10 + i*5, (Math.random() * 10) - 5, 24),
                        blockchainType: 'Token'
                    };
                    tableData.push(demoToken);
                }
            }
            
            filteredData = [...tableData];
            
            // Afișăm distribuția tipurilor pentru debugging
            const nativeCount = tableData.filter(c => c.blockchainType === 'Nativ').length;
            const tokenCount = tableData.filter(c => c.blockchainType === 'Token').length;
            console.log(`Distribuție monede (demo): ${nativeCount} native, ${tokenCount} token`);
        }
        // Actualizează UI-ul fără a porni animația caruselului
        renderCarouselWithPosition(currentPosition); // Păstrăm poziția curentă
        renderTable();
        checkPriceAlerts();
        renderPagination();
    }

    // Generăm date istorice bazate pe prețul curent și schimbarea procentuală
    function generateHistoricalData(currentPrice, percentChange, points) {
        // Calculăm prețul de start bazat pe schimbarea procentuală
        const startPrice = currentPrice / (1 + percentChange/100);
        const data = [];
        const timestamps = [];
        const ohlcData = [];
        
        // Calculăm volatilitatea în funcție de schimbarea procentuală
        const volatility = Math.abs(percentChange) / 100 * 0.5;
        
        // Data curentă
        const now = new Date();
        
        // Generăm mai multe puncte pentru grafice mai detaliate
        for (let i = 0; i < points; i++) {
            // Calculăm un punct pe linia de trend
            const progress = i / (points - 1); // 0 la început, 1 la final
            const trendPrice = startPrice + (currentPrice - startPrice) * progress;
            
            // Adăugăm o componentă aleatoare pentru a face graficele să arate natural
            const randomFactor = (Math.random() * 0.04 - 0.02);
            const price = trendPrice * (1 + randomFactor);
            data.push(price);
            
            // Generăm un timestamp pentru acest punct
            const date = new Date();
            // Ajustăm cu numărul de ore în trecut
            date.setHours(date.getHours() - (points - i));
            timestamps.push(date);
            
            // Generăm date OHLC pentru fiecare interval
            const priceVariation = price * volatility * (Math.random() * 0.5 + 0.5);
            const open = Math.max(0, price - priceVariation * (Math.random() - 0.5));
            const close = price;
            const high = Math.max(open, close) + priceVariation * Math.random() * 0.3;
            const low = Math.min(open, close) - priceVariation * Math.random() * 0.3;
            
            ohlcData.push({
                x: new Date(date.getTime()), // Creăm o nouă instanță a obiectului Date pentru a evita referințe
                o: open,
                h: high,
                l: low,
                c: close
            });
        }
        
        return {
            prices: data,
            timestamps: timestamps,
            ohlc: ohlcData
        };
    }

    // Separăm crearea elementelor DOM de manipularea lor pentru a reduce reflow-urile
    function renderCarouselWithPosition(savedPosition) {
        // Oprim tranzițiile complet în timpul randării inițiale
        carouselTrack.style.transition = 'none';
        
        // Pregătim tot conținutul într-un fragment pentru a minimiza reflow-urile
        const fragment = document.createDocumentFragment();
        const repeatedData = [...coinData, ...coinData, ...coinData];
        
        repeatedData.forEach((coin, index) => {
            const card = createCoinCardElement(coin, index);
            fragment.appendChild(card);
        });
        
        // Golim caruselul
        while (carouselTrack.firstChild) {
            carouselTrack.removeChild(carouselTrack.firstChild);
        }
        
        // Adăugăm conținutul nou într-o singură operație DOM
        carouselTrack.appendChild(fragment);
        
        // Setăm poziția fără tranziție
        const initialOffset = -coinData.length * CARD_WIDTH_WITH_MARGIN;
        
        // Dacă avem o poziție salvată și nu e zero, o folosim
        // Altfel, începem de la poziția de mijloc (setul din mijloc)
        currentPosition = (savedPosition !== undefined && savedPosition !== 0) ? 
                          savedPosition : initialOffset;
        
        carouselTrack.style.transform = `translateX(${currentPosition}px)`;
        
        // Întârziem inițializarea graficelor pentru a permite browserului să termine primul render
        requestAnimationFrame(() => {
            repeatedData.forEach((coin, index) => {
                const card = carouselTrack.children[index];
                if (card) {
                    initializeMiniChart(card, coin);
                }
            });
            
            // NU reactivăm tranziția aici - o vom activa doar în checkWrapAround și animateScroll
            addCoinClickListeners();
        });
    }

    function startAutoScroll() {
        stopAutoScroll(); 
        console.log("Starting autoscroll");
        isHovered = false;
        
        // Setăm o viteză și mai mare pentru mișcare mai rapidă
        speed = 0.2; // Mărită semnificativ pentru o mișcare mult mai rapidă
        
        animationId = requestAnimationFrame(animateScroll); // Pornim animația caruselului
    }

    function stopAutoScroll() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            console.log(`Stopped animation frame: ${animationId}`);
            animationId = null;
        }
    }

    function checkWrapAround() {
        if (coinData.length === 0) return;
        const totalWidth = CARD_WIDTH_WITH_MARGIN * coinData.length;
        
        // Când ajungem la sfârșitul celui de-al doilea set, resetăm la mijloc
        // Acest lucru creează un scroll infinit fără a "o lua înapoi"
        if (currentPosition <= -(totalWidth * 2)) { 
            // Resetăm la începutul setului din mijloc imediat, fără tranziție
            currentPosition += totalWidth;
            carouselTrack.style.transition = 'none';
            carouselTrack.style.transform = `translateX(${currentPosition}px)`;
            // Forțăm un reflow pentru a aplica schimbarea înainte de a reactiva tranziția
            void carouselTrack.offsetHeight;
            // Reactivăm tranziția după un scurt timeout
            setTimeout(() => {
                carouselTrack.style.transition = 'transform 0.5s ease';
            }, 50);
            console.log('Wrapped around end -> middle');
        } 
        else if (currentPosition >= -totalWidth) { 
            // Dacă cumva ajungem la început, resetăm la setul din mijloc
            currentPosition -= totalWidth;
            carouselTrack.style.transition = 'none';
            carouselTrack.style.transform = `translateX(${currentPosition}px)`;
            // Forțăm un reflow pentru a aplica schimbarea înainte de a reactiva tranziția
            void carouselTrack.offsetHeight;
            // Reactivăm tranziția după un scurt timeout
            setTimeout(() => {
                carouselTrack.style.transition = 'transform 0.5s ease';
            }, 50);
            console.log('Wrapped around start -> middle');
        }
    }

    function formatNumber(number, decimals = 2) {
        if (number >= 1e9) {
            return (number / 1e9).toFixed(decimals) + 'B';
        } else if (number >= 1e6) {
            return (number / 1e6).toFixed(decimals) + 'M';
        } else if (number >= 1e3) {
            return (number / 1e3).toFixed(decimals) + 'K';
        }
        return number.toFixed(decimals);
    }

    // Funcția pentru formatarea valorilor monetare
    function formatCurrency(value) {
        if (value >= 1e9) {
            return '$' + (value / 1e9).toFixed(2) + 'B';
        } else if (value >= 1e6) {
            return '$' + (value / 1e6).toFixed(2) + 'M';
        } else if (value >= 1e3) {
            return '$' + (value / 1e3).toFixed(2) + 'K';
        } else {
            return '$' + value.toFixed(2);
        }
    }

    function renderTable() {
        const tableBody = document.getElementById('cryptoTableBody');
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = filteredData.slice(startIndex, endIndex);

        document.querySelector('.crypto-table thead tr').innerHTML = `
            <th>#</th>
            <th>Coin</th>
            <th class="type-column sortable" data-sort="type">
                <div class="type-header">
                    Type <span class="sort-arrow"></span>
                </div>
            </th>
            <th class="sortable" data-sort="price">Price <span class="sort-arrow"></span></th>
            <th class="sortable" data-sort="change24h">24h % <span class="sort-arrow"></span></th>
            <th class="sortable" data-sort="volume24h">Volume 24h <span class="sort-arrow"></span></th>
            <th class="sortable" data-sort="marketCap">Market Cap <span class="sort-arrow"></span></th>
            <th>Chart 7d</th>
            <th>Actions</th>
        `;

        // Adaugă event listener-ele pentru sortare după fiecare re-redare a header-ului
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.getAttribute('data-sort');
                sortTableBy(key);
            });
        });

        // Distrugem toate instanțele de grafice existente
        Object.keys(tableCharts).forEach(chartId => {
            if (tableCharts[chartId]) {
                try {
                    tableCharts[chartId].destroy();
                } catch (err) {
                    console.warn(`Eroare la distrugerea graficului ${chartId}:`, err);
                }
                delete tableCharts[chartId];
            }
        });

        tableBody.innerHTML = pageData.map((coin, idx) => `
            <tr>
                <td>${startIndex + idx + 1}</td>
                <td>
                    <div class="coin-info">
                        <img src="${coin.imageUrl}" alt="${coin.symbol}">
                        <div class="coin-name-container">
                            <span>${coin.name}</span>
                            <span class="coin-symbol">${coin.symbol}</span>
                        </div>
                    </div>
                </td>
                <td class="blockchain-type" data-type="${coin.blockchainType || 'Token'}">${coin.blockchainType || 'Token'}</td>
                <td class="price-cell">
                    <div class="column-value">$${coin.price.toFixed(2)}</div>
                </td>
                <td class="change-cell ${coin.change24h >= 0 ? 'positive' : 'negative'}">
                    <div class="column-value">${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%</div>
                </td>
                <td class="volume-cell">
                    <div class="column-value">$${formatNumber(coin.volume24h)}</div>
                </td>
                <td class="market-cap-cell">
                    <div class="column-value">$${formatNumber(coin.marketCap)}</div>
                </td>
                <td class="chart-cell" align="center">
                    <canvas id="chart-${coin.symbol}" class="mini-chart" width="150" height="80"></canvas>
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="action-btn trade-btn" onclick="window.location.href='trade.html?symbol=${coin.symbol}&price=${coin.price}'">
                            <i class="fas fa-exchange-alt"></i>
                            <span>Trade</span>
                        </button>
                        <button class="action-btn alert-btn" onclick="openAlertModal('${coin.symbol}', ${coin.price})">
                            <i class="fas fa-bell"></i>
                            <span>Alert</span>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Utilizăm un setTimeout pentru a permite browser-ului să termine renderizarea HTML
        // înainte de a inițializa graficele - acest lucru ajută la evitarea conflictelor
        setTimeout(() => {
            pageData.forEach(coin => {
                const canvasId = `chart-${coin.symbol}`;
                const canvas = document.getElementById(canvasId);
                if (!canvas) return;
                
                try {
                    const ctx = canvas.getContext('2d');
                    
                    // Setăm dimensiunile canvas-ului
                    const dpr = window.devicePixelRatio || 1;
                    const rect = canvas.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;
                    ctx.scale(dpr, dpr);
                    canvas.style.width = `${rect.width}px`;
                    canvas.style.height = `${rect.height}px`;
                    
                    // Configurăm culorile
                    const isPositive = coin.change24h >= 0;
                    const positiveColor = '#10b981'; // verde
                    const negativeColor = '#ef4444'; // roșu
                    const lineColor = isPositive ? positiveColor : negativeColor;
                    
                    // Creăm un gradient mai elegant pentru fundal
                    const gradient = ctx.createLinearGradient(0, 0, 0, 70);
                    const alpha = Math.min(Math.abs(coin.change24h) / 10, 0.4);
                    if (isPositive) {
                        gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
                        gradient.addColorStop(0.3, `rgba(16, 185, 129, ${alpha * 0.7})`);
                        gradient.addColorStop(0.7, `rgba(16, 185, 129, ${alpha * 0.3})`);
                        gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);
                    } else {
                        gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
                        gradient.addColorStop(0.3, `rgba(239, 68, 68, ${alpha * 0.7})`);
                        gradient.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.3})`);
                        gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
                    }
                    
                    // Verificăm dacă historicalData este în formatul nou (obiect) sau vechi (array)
                    let priceData;
                    if (Array.isArray(coin.historicalData)) {
                        // Format vechi - historicalData este direct un array de valori
                        priceData = coin.historicalData;
                    } else if (coin.historicalData && coin.historicalData.prices) {
                        // Format nou - historicalData este un obiect cu proprietăți
                        priceData = coin.historicalData.prices;
                    } else {
                        // Fallback - creăm date demo
                        priceData = Array(12).fill(0).map(() => coin.price * (1 + (Math.random() * 0.1 - 0.05)));
                    }
                    
                    // Utilizăm toate punctele disponibile pentru un grafic mai detaliat
                    const compactData = priceData.slice(0, 24);
                    
                    // Calculăm volatilitatea pentru a ajusta aspectul graficului
                    const volatility = Math.abs(coin.change24h) / 100;
                    let tension = 0.35; // tensiune de bază
                    
                    // Ajustăm tensiunea în funcție de volatilitate
                    if (volatility > 0.05) tension = 0.25;
                    if (volatility > 0.1) tension = 0.2;
                    
                    // Calculăm grosimea liniei în funcție de volatilitate și mărimea graficului
                    const lineWidth = Math.min(2.5, 1.5 + volatility * 12);
                    
                    // Creăm și salvăm instanța graficului
                    tableCharts[canvasId] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: compactData.map(() => ''),
                            datasets: [{
                                data: compactData,
                                borderColor: lineColor,
                                borderWidth: lineWidth,
                                fill: true,
                                backgroundColor: gradient,
                                tension: tension,
                                pointRadius: 0, // fără puncte, ca în carusel
                                pointHoverRadius: 3,
                                pointBackgroundColor: lineColor,
                                pointBorderColor: '#fff',
                                pointBorderWidth: 1,
                                cubicInterpolationMode: 'monotone'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            animation: {
                                duration: 500 // Animație moderată
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    enabled: true,
                                    mode: 'index',
                                    intersect: false,
                                    callbacks: {
                                        title: () => '',
                                        label: (item) => `$${item.raw.toFixed(2)}`
                                    }
                                }
                            },
                            scales: {
                                x: { display: false },
                                y: { display: false }
                            }
                        }
                    });
                } catch (err) {
                    console.error(`Eroare la crearea graficului pentru ${coin.symbol}:`, err);
                }
            });
            
            addCoinClickListeners();
        }, 50);
    }

    function renderPagination() {
        const pagination = document.getElementById('tablePagination');
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        
        let paginationHTML = `
            <button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                << Prev
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn next" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                Next >>
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    }

    // Adaug funcția de verificare și inițializare a elementelor UI
    function ensureUIElements() {
        // Verificăm modalul
        const modal = document.getElementById('coinModal');
        const modalClose = modal ? modal.querySelector('.modal-close') : null;
        const modalChart = document.getElementById('modalChart');
        
        if (!modal) {
            console.error("Modalul lipsește din DOM!");
            return false;
        }
        
        if (!modalChart) {
            console.error("Canvas-ul pentru grafic lipsește din modal!");
            
            // Verificăm dacă există containerul pentru grafic
            const chartContainer = modal.querySelector('.chart-container');
            if (chartContainer) {
                // Dacă containerul există dar canvas-ul nu, îl creăm
                const canvas = document.createElement('canvas');
                canvas.id = 'modalChart';
                canvas.width = 800;
                canvas.height = 400;
                chartContainer.appendChild(canvas);
                console.log("Am creat elementul canvas pentru grafic");
            } else {
                console.error("Containerul pentru grafic lipsește din modal!");
                return false;
            }
        }
        
        console.log("Modal găsit:", modal);
        console.log("Canvas modal găsit:", modalChart || document.getElementById('modalChart'));
        
        // Definim variabilele globale
        window.modal = modal;
        window.modalClose = modalClose;
        
        // Adăugăm un observer pentru modal care menține dimensiunile caruselului
        const forceCarouselSize = () => {
            const carousel = document.querySelector('.carousel-container');
            const track = document.getElementById('carouselTrack');
            const cards = document.querySelectorAll('.coin-card');
            
            if (carousel) {
                carousel.style.height = '190px';
                carousel.style.maxHeight = '190px';
                carousel.style.overflow = 'hidden';
            }
            
            if (track) {
                track.style.height = '190px';
            }
            
            cards.forEach(card => {
                card.style.height = '190px';
                const chartContainer = card.querySelector('.chart-container');
                if (chartContainer) {
                    chartContainer.style.height = '50px';
                    chartContainer.style.maxHeight = '50px';
                    chartContainer.style.overflow = 'hidden';
                }
            });
        };
        
        // Rulăm o dată la început
        forceCarouselSize();
        
        // Adăugăm ca listener pentru modal
        modal.addEventListener('transitionstart', forceCarouselSize);
        modal.addEventListener('transitionend', forceCarouselSize);
        
        // Și rulăm și la un interval scurt pentru siguranță
        setInterval(forceCarouselSize, 500);
        
        return true;
    }

    // Inițializăm aplicația
    function init() {
        console.log('Inițializare aplicație...');
        
        // Verificăm toate elementele UI
        if (!ensureUIElements()) {
            console.error("Eroare la inițializarea elementelor UI. Reîncerc în 1 secundă...");
            setTimeout(init, 1000);
            return;
        }
        
        // Ascundem butoanele de navigare
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        
        async function updateAll() {
            await fetchAllCoinData(true);
        }
        // Inițializare inițială fără animație
        updateAll().then(() => {
            setupEventListeners();
            addCoinClickListeners();
            // Apelăm setupTypeFilter pentru a activa filtrul de tip
            setupTypeFilter();
            // Randam inițial fără animație
            renderCarouselWithPosition(0);
            
            // Pornim animația cu o mică întârziere, fără nicio tranziție vizibilă
            setTimeout(() => {
                // Asigurăm-ne că tranziția este dezactivată la început
                carouselTrack.style.transition = 'none';
                // Pornim animația fără efecte vizibile inițiale
                startAutoScroll();
                // Activăm tranziția doar după ce animația este deja în mișcare
                setTimeout(() => {
                    carouselTrack.style.transition = 'transform 0.5s ease';
                }, 200);
            }, 500);
        });
        // Actualizare periodică sincronizată
        setInterval(updateAll, 15000);
    }
    
    function setupEventListeners() {
        carouselContainer.addEventListener('mouseenter', () => {
            isHovered = true;
            stopAutoScroll();
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            isHovered = false;
            // Repornim animația când mouse-ul părăsește zona caruselului
            setTimeout(startAutoScroll, 500);
        });
        
        // Restul event listener-ilor...
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                if (modal) {
                    if (modal.style) modal.style.display = 'none';
                    if (modal.classList) modal.classList.remove('active');
                }
                if (modalChart) {
                    modalChart.destroy();
                    modalChart = null;
                }
                // Eliminăm clasa 'modal-open' când închdem modalul
                document.body.classList.remove('modal-open');
            });
        }

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                if (modal) {
                    if (modal.style) modal.style.display = 'none';
                    if (modal.classList) modal.classList.remove('active');
                }
                if (modalChart) {
                    modalChart.destroy();
                    modalChart = null;
                }
                // Eliminăm clasa 'modal-open' când închdem modalul
                document.body.classList.remove('modal-open');
            }
        });

        document.querySelectorAll('.chart-period').forEach(button => {
            button.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-period').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                loadChartData(e.target.dataset.period);
            });
        });
        
        const periodButtons = document.querySelectorAll('.period-button');
        periodButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                periodButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if (currentCoin) {
                    loadChartData(button.dataset.period);
                }
            });
        });
        
        // Adăugăm event listener pentru filtrarea după tip
        const typeFilterElem = document.getElementById('typeFilter');
        if (typeFilterElem) {
            typeFilterElem.addEventListener('change', function() {
                console.log('Type filter changed to:', this.value);
                filterAndDisplayData();
            });
        }
        
        const searchInput = document.querySelector('.search-input');
        const filterSelect = document.querySelector('.filter-select');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value.toLowerCase();
                filterAndDisplayData();
            });
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                filterValue = e.target.value;
                filterAndDisplayData();
            });
        }
    }
    
    // Definim window.changePage pentru a putea fi accesată global
    window.changePage = function(page) {
        currentPage = page;
        renderTable();
        renderPagination();
    };
    
    // Definim window.openAlertModal pentru a putea fi accesată global
    window.openAlertModal = function(symbol, currentPrice) {
        const modal = document.createElement('div');
        modal.className = 'modal alert-modal';
        // Aplică tema curentă la deschidere
        modal.classList.remove('light-theme', 'dark-theme');
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            modal.classList.add('light-theme');
        } else {
            modal.classList.add('dark-theme');
        }
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Set Price Alert for ${symbol}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="current-price-info">
                        <span>Current Price:</span>
                        <span class="current-price">$${currentPrice.toFixed(2)}</span>
                    </div>
                    <div class="alert-form">
                        <div class="input-group">
                            <label>Alert me when price is:</label>
                            <select class="condition-select">
                                <option value="above">Above</option>
                                <option value="below">Below</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Target Price (USD)</label>
                            <input type="number" class="target-price" placeholder="0.00" step="0.01" min="0">
                        </div>
                        <button class="set-alert-btn">Set Alert</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // Actualizez tema la schimbare
        const themeObserver = new MutationObserver(() => {
            modal.classList.remove('light-theme', 'dark-theme');
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'light') {
                modal.classList.add('light-theme');
            } else {
                modal.classList.add('dark-theme');
            }
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        // Închidere modal
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => { themeObserver.disconnect(); modal.remove(); };
        modal.onclick = (e) => { if (e.target === modal) { themeObserver.disconnect(); modal.remove(); } };
        // Set Alert (păstrăm funcționalitatea de salvare, dar nu mai afișăm lista)
        let alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
        modal.querySelector('.set-alert-btn').onclick = () => {
            const condition = modal.querySelector('.condition-select').value;
            const price = parseFloat(modal.querySelector('.target-price').value);
            if (isNaN(price) || price <= 0) {
                alert('Please enter a valid price!');
                return;
            }
            const id = symbol + '-' + Date.now();
            alerts.push({
                id,
                symbol,
                condition,
                price,
                triggered: false,
                lastTriggered: null,
                created: Date.now()
            });
            localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
            modal.querySelector('.target-price').value = '';
            if (typeof updateAlertBadgeAndDropdown === 'function') {
                updateAlertBadgeAndDropdown();
            }
            themeObserver.disconnect();
            modal.remove();
        };
        // Adaug update la datele monedelor după setarea unei alerte
        const setAlertBtn = modal.querySelector('.set-alert-btn');
        if (setAlertBtn) {
            const originalSetAlert = setAlertBtn.onclick;
            setAlertBtn.onclick = function() {
                if (originalSetAlert) originalSetAlert();
                fetchAllCoinData(true); // Forțează update la datele monedelor
            };
        }
    };

    // Începem inițializarea aplicației cu un mic delay pentru a permite browserului să termine renderizarea inițială
    setTimeout(() => {
        init();
        updateSortArrows();
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.getAttribute('data-sort');
                sortTableBy(key);
            });
        });
        
        // Asigurăm-ne că filtrul de tip este setat corect
        const typeFilterElem = document.getElementById('typeFilter');
        if (typeFilterElem) {
            typeFilterElem.addEventListener('change', function() {
                console.log('Type filter changed:', this.value);
                filterAndDisplayData();
            });
        }

        // Apelăm explicit setupTypeFilter după ce pagina s-a încărcat
        setupTypeFilter();
    }, 0);

    async function showCoinDetails(coinId) {
        // Forțăm dimensiunile caruselului înainte de a deschide modalul
        const forceCarouselSize = () => {
            const carousel = document.querySelector('.carousel-container');
            const track = document.getElementById('carouselTrack');
            const cards = document.querySelectorAll('.coin-card');
            
            if (carousel) {
                carousel.style.height = '190px';
                carousel.style.maxHeight = '190px';
                carousel.style.overflow = 'hidden';
            }
            
            if (track) {
                track.style.height = '190px';
            }
            
            cards.forEach(card => {
                card.style.height = '190px';
                const chartContainer = card.querySelector('.chart-container');
                if (chartContainer) {
                    chartContainer.style.height = '50px';
                    chartContainer.style.maxHeight = '50px';
                    chartContainer.style.overflow = 'hidden';
                }
            });
        };
        
        // Forțăm dimensiunile înainte
        forceCarouselSize();
        
        // Căutăm moneda după ID sau Symbol
        let currentCoin;
        
        // Verificăm dacă coinId este un ID sau un simbol
        currentCoin = tableData.find(coin => coin.id === coinId || coin.symbol === coinId);
        
        if (!currentCoin) {
            console.error(`Nu s-a găsit moneda cu ID sau symbol: ${coinId}`);
            return;
        }
        
        console.log("Deschid modal pentru moneda:", currentCoin);
        
        // Actualizăm variabilele globale
        window.currentCoin = currentCoin;
        
        document.getElementById('modalCoinName').textContent = currentCoin.name;
        document.getElementById('modalCoinSymbol').textContent = currentCoin.symbol;
        document.getElementById('modalCoinImage').src = currentCoin.imageUrl;
        document.getElementById('modalPrice').textContent = formatCurrency(currentCoin.price);
        
        const change24h = document.getElementById('modal24hChange');
        change24h.textContent = formatNumber(currentCoin.change24h, 2) + '%';
        change24h.className = currentCoin.change24h >= 0 ? 'stat-change positive' : 'stat-change negative';
        
        document.getElementById('modalMarketCap').textContent = formatCurrency(currentCoin.marketCap);
        document.getElementById('modal24hVolume').textContent = formatCurrency(currentCoin.volume24h);
        
        // Set blockchain type in the modal
        const modalBlockchainType = document.getElementById('modalBlockchainType');
        if (modalBlockchainType) {
            modalBlockchainType.textContent = currentCoin.blockchainType || 'Token';
            
            // Add class based on blockchain type
            modalBlockchainType.className = currentCoin.blockchainType === 'Nativ' ? 'native' : 'token';
        }
        
        // Încărcăm datele pentru grafic
        loadChartData(currentChartPeriod);
        
        // Forțăm din nou dimensiunile caruselului
        forceCarouselSize();
        
        // Adăugăm clasa 'modal-open' pe body pentru a fixa dimensiunile
        document.body.classList.add('modal-open');
        
        // Afișăm modalul - folosim referința globală
        const modalElement = window.modal || document.getElementById('coinModal');
        
        if (modalElement) {
            console.log("Afișez modalul:", modalElement);
            modalElement.style.display = 'block';
            modalElement.classList.add('active');
        } else {
            console.error("Modalul nu este disponibil!");
        }
        
        // Forțăm dimensiunile o ultimă dată
        setTimeout(forceCarouselSize, 10);
        setTimeout(forceCarouselSize, 100);
        setTimeout(forceCarouselSize, 500);
        
        // Adăugăm event listener pentru butoanele de perioadă
        document.querySelectorAll('.period-button').forEach(button => {
            button.addEventListener('click', function() {
                const period = this.getAttribute('data-period');
                
                // Actualizăm perioada activă
                document.querySelectorAll('.period-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                
                // Încărcăm datele pentru perioada selectată
                currentChartPeriod = period;
                loadChartData(period);
            });
        });
        
        try {
            // Încercăm să obținem informații suplimentare despre monedă
            const url = `https://api.coingecko.com/api/v3/coins/${currentCoin.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
            const coinData = await fetchWithProxy(url);
            
            if (coinData && coinData.market_data) {
                // Actualizăm high/low
                const high24h = coinData.market_data.high_24h?.usd;
                const low24h = coinData.market_data.low_24h?.usd;
                
                if (high24h) document.getElementById('modal24hHigh').textContent = formatCurrency(high24h);
                if (low24h) document.getElementById('modal24hLow').textContent = formatCurrency(low24h);
            }
        } catch (error) {
            console.warn('Eroare la obținerea datelor suplimentare:', error);
            
            // Folosim valori aproximative pentru high/low
            const variance = currentCoin.price * 0.05; // +/- 5%
            document.getElementById('modal24hHigh').textContent = formatCurrency(currentCoin.price + variance);
            document.getElementById('modal24hLow').textContent = formatCurrency(currentCoin.price - variance);
        }
        
        // Adăugăm clasa 'modal-open' pe body pentru a fixa dimensiunile
        document.body.classList.add('modal-open');
    }

    async function loadChartData(period) {
        try {
            // Utilizăm variabila globală currentCoin
            const coinData = window.currentCoin;
            
            if (!coinData) {
                console.error("Nu există date pentru monedă în loadChartData");
                return;
            }
            
            console.log("Loading chart data for:", coinData.symbol, "Period:", period);
            
            const container = document.querySelector('.chart-container');
            if (!container) return;
            
            // Resetăm height-ul containerului din modal (NU cel din carusel)
            const modalContainer = document.querySelector('#coinModal .chart-container');
            if (modalContainer) {
                modalContainer.style.height = '400px';
                modalContainer.style.maxHeight = '400px';
                modalContainer.style.overflow = 'visible';
            }
            
            // Setăm perioada activă
            document.querySelectorAll('.period-button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activePeriodBtn = document.querySelector(`.period-button[data-period="${period}"]`);
            if (activePeriodBtn) {
                activePeriodBtn.classList.add('active');
            }
            
            // Configurăm datele pentru perioadă
            let dataPoints;
            switch(period) {
                case '24h': dataPoints = 24; break;
                case '7d': dataPoints = 28; break;
                case '30d': dataPoints = 30; break;
                case '1y': dataPoints = 12; break;
                default: dataPoints = 24;
            }
            
            // Culorile pentru grafic
            const isPositive = coinData.change24h >= 0;
            const positiveColor = '#10b981'; // verde
            const negativeColor = '#ef4444'; // roșu
            const lineColor = isPositive ? positiveColor : negativeColor;
            
            // Tema curentă
            const theme = document.documentElement.getAttribute('data-theme');
            const axisColor = theme === 'dark' ? 'rgba(200, 200, 200, 0.6)' : 'rgba(60, 60, 60, 0.6)';
            const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
            
            // Generăm datele pentru grafic
            const historicalData = generateHistoricalData(coinData.price, coinData.change24h, dataPoints);
            const priceData = historicalData.prices;
            
            // Calculăm min și max pentru axa Y
            const minPrice = Math.min(...priceData);
            const maxPrice = Math.max(...priceData);
            const range = maxPrice - minPrice;
            const padding = range * 0.1;
            
            // Distrugem graficul existent
            if (modalChart) {
                try {
                    modalChart.destroy();
                } catch (err) {
                    console.warn('Eroare la distrugerea graficului modal:', err);
                }
                modalChart = null;
            }
            
            // Creem gradient pentru fundal
            const modalChartElement = document.getElementById('modalChart');
            if (!modalChartElement) {
                console.error("Elementul canvas 'modalChart' nu există!");
                return;
            }
            
            // Resetăm canvas-ul pentru grafic cu dimensiuni corecte
            modalChartElement.width = 800;
            modalChartElement.height = 400;
            modalChartElement.style.width = '100%';
            modalChartElement.style.height = '100%';
            
            const ctx = modalChartElement.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            if (isPositive) {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
                gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
                gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            
            // Generăm etichete pentru axa X
            const labels = [];
            for (let i = 0; i < priceData.length; i++) {
                if (period === '24h') {
                    // Afișăm ora pentru 24h
                    const hour = new Date().getHours() - (priceData.length - i - 1);
                    labels.push(i % 2 === 0 ? (hour < 0 ? `${24 + hour}:00` : `${hour}:00`) : '');
                } else if (period === '7d') {
                    // Afișăm ziua pentru 7d
                    const date = new Date();
                    date.setDate(date.getDate() - (Math.floor(priceData.length / 4) - Math.floor(i / 4)));
                    labels.push(i % 4 === 0 ? date.toLocaleDateString('ro-RO', { weekday: 'short' }) : '');
                } else if (period === '30d') {
                    // Afișăm data pentru 30d
                    const date = new Date();
                    date.setDate(date.getDate() - (priceData.length - i - 1));
                    labels.push(i % 3 === 0 ? `${date.getDate()}/${date.getMonth() + 1}` : '');
                } else {
                    // Afișăm luna pentru 1y
                    const date = new Date();
                    date.setMonth(date.getMonth() - (priceData.length - i - 1));
                    labels.push(date.toLocaleDateString('ro-RO', { month: 'short' }));
                }
            }
            
            // Calculăm volatilitatea pentru a ajusta aspectul graficului
            const volatility = Math.abs(coinData.change24h) / 100;
            let tension = 0.35; // tensiune de bază
            
            // Ajustăm tensiunea în funcție de volatilitate
            if (volatility > 0.05) tension = 0.25;
            if (volatility > 0.1) tension = 0.2;
            
            // Calculăm grosimea liniei în funcție de volatilitate
            const lineWidth = Math.min(3, 1.8 + volatility * 12);
            
            // Creăm graficul
            modalChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: priceData,
                        borderColor: lineColor,
                        borderWidth: lineWidth,
                        fill: true,
                        backgroundColor: gradient,
                        tension: tension,
                        pointRadius: (ctx) => {
                            // Afișăm puncte doar la anumite intervale
                            const index = ctx.dataIndex;
                            if (period === '24h') {
                                return index % 4 === 0 ? 3 : 0;
                            } else if (period === '7d') {
                                return index % 4 === 0 ? 4 : 0;
                            } else {
                                return index % 3 === 0 ? 4 : 0;
                            }
                        },
                        pointHoverRadius: 6,
                        pointBackgroundColor: lineColor,
                        pointBorderColor: '#fff',
                        pointBorderWidth: 1.5,
                        cubicInterpolationMode: 'monotone'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 800 // Animație mai lungă pentru efect vizual
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                title: function(context) {
                                    return context[0] ? labels[context[0].dataIndex] || '' : '';
                                },
                                label: function(context) {
                                    return `Preț: $${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            display: true,
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: axisColor,
                                font: {
                                    size: 10
                                }
                            }
                        },
                        y: { 
                            display: true,
                            position: 'right',
                            grid: {
                                color: gridColor
                            },
                            ticks: {
                                color: axisColor,
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                },
                                font: {
                                    size: 10
                                }
                            },
                            min: minPrice - padding,
                            max: maxPrice + padding
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Eroare la încărcarea datelor pentru grafic:', error);
        }
    }

    function filterAndDisplayData() {
        // Aplicăm filtrarea în funcție de textul de căutare
        if (searchTerm.trim() === '') {
            filteredData = [...tableData];
        } else {
            const searchLower = searchTerm.toLowerCase();
            filteredData = tableData.filter(coin => 
                coin.name.toLowerCase().includes(searchLower) ||
                coin.symbol.toLowerCase().includes(searchLower)
            );
        }
        
        // Aplicăm filtrarea după tip de blockchain folosind typeFilter
        const typeFilterElem = document.getElementById('typeFilter');
        if (typeFilterElem && typeFilterElem.value !== 'all') {
            const selectedType = typeFilterElem.value;
            filteredData = filteredData.filter(coin => coin.blockchainType === selectedType);
        }
        
        // Reset current page to 1 when filtering
        currentPage = 1;
        
        // Actualizăm tabelul
        renderTable();
        renderPagination();
    }

    function addCoinClickListeners() {
        document.querySelectorAll('.coin-card').forEach(card => {
            card.addEventListener('click', () => {
                const symbol = card.querySelector('.coin-symbol').textContent;
                console.log("Click pe card, moneda cu simbol:", symbol);
                showCoinDetails(symbol);
            });
        });
        document.querySelectorAll('.crypto-table tbody tr').forEach(row => {
            row.addEventListener('click', function (e) {
                // Dacă s-a dat click pe un buton din Actions, nu deschide detalii
                if (e.target.closest('.action-btn')) return;
                const symbol = row.querySelector('.coin-symbol').textContent;
                console.log("Click pe tabel, moneda cu simbol:", symbol);
                showCoinDetails(symbol);
            });
        });
        // Previne propagarea clickului pe butoanele din Actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        });
    }

    let resizeTimeout;
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const handleResize = debounce(() => {
        const coinModal = document.getElementById('coinModal');
        // Verificăm atât modalul cât și variabila currentCoin
        if (coinModal && (coinModal.style.display === 'block' || coinModal.classList.contains('active')) && window.currentCoin) {
            console.log('Window resized, redrawing chart...');
            loadChartData(currentChartPeriod);
        }
    }, 250);

    window.addEventListener('resize', handleResize);

    function calculateTension(coin) {
        const volumeScore = Math.min(coin.volume24h / 1e9, 1);
        const volatilityScore = Math.min(Math.abs(coin.change24h) / 10, 1);
        
        return 0.2 + (volumeScore + volatilityScore) * 0.2;
    }

    function sortTableBy(key) {
        if (currentSort.key === key) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.key = key;
            currentSort.direction = 'desc';
        }
        filteredData.sort((a, b) => {
            let valueA, valueB;
            
            // Use blockchainType for sorting when key is 'type'
            if (key === 'type') {
                valueA = a.blockchainType || '';
                valueB = b.blockchainType || '';
            } else {
                valueA = a[key];
                valueB = b[key];
            }

            if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
        renderTable();
        renderPagination();
        updateSortArrows();
    }

    function updateSortArrows() {
        document.querySelectorAll('.sortable').forEach(th => {
            const arrow = th.querySelector('.sort-arrow');
            const key = th.getAttribute('data-sort');
            th.classList.remove('active');
            if (currentSort.key === key) {
                arrow.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
                th.classList.add('active');
            } else {
                arrow.textContent = '▲'; // Săgeata neutră vizibilă mereu
            }
        });
    }

    // Detectează schimbarea temei și actualizează modalul dacă este deschis
    const observer = new MutationObserver(() => {
        const modal = document.getElementById('coinModal');
        if (modal && modal.style.display === 'block') {
            // Forțează re-redarea pentru a aplica stilurile noi
            modal.classList.remove('light-theme', 'dark-theme');
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'light') {
                modal.classList.add('light-theme');
            } else {
                modal.classList.add('dark-theme');
            }
            // Reîncarcă graficul cu noile culori
            if (typeof currentCoin === 'string' && currentCoin) {
                loadChartData(currentChartPeriod);
            }
        }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Adaug update la badge și dropdown la schimbarea temei
    observer.disconnect();
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    document.documentElement.addEventListener('data-theme-change', updateAlertBadgeAndDropdown);
    // Forțez update la fiecare schimbare de temă
    const origSetAttribute = document.documentElement.setAttribute;
    document.documentElement.setAttribute = function(attr, value) {
        origSetAttribute.call(this, attr, value);
        if (attr === 'data-theme') {
            updateAlertBadgeAndDropdown();
        }
    };

    function updateAlertBadgeAndDropdown() {
        // Badge
        const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
        const count = alerts.length;
        document.querySelectorAll('.notification-btn').forEach(btn => {
            let badge = btn.querySelector('.alert-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'alert-badge';
                btn.appendChild(badge);
            }
            badge.textContent = count > 0 ? count : '';
            badge.style.display = count > 0 ? 'flex' : 'none';
        });
        // Dropdown
        let dropdown = document.getElementById('alertDropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'alert-dropdown';
            dropdown.id = 'alertDropdown';
            document.body.appendChild(dropdown);
        }
        if (count === 0) {
            dropdown.innerHTML = `<h4>Active Alerts</h4><div class='no-alerts'>No alerts set yet.</div>`;
        } else {
            dropdown.innerHTML = `<h4>Active Alerts</h4><div class='alert-list'>${alerts.map(a => `
                <div class='alert-row'>
                    <span class='alert-symbol'>${a.symbol}</span>
                    <span class='alert-condition'>${a.condition === 'above' ? 'Above' : 'Below'}</span>
                    <span class='alert-price'>$${a.price}</span>
                    <button class='remove-alert-btn' data-id='${a.id}' title='Remove'>&times;</button>
                </div>`).join('')}</div>`;
            dropdown.querySelectorAll('.remove-alert-btn').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    const newAlerts = alerts.filter(a => a.id !== id);
                    localStorage.setItem('cryptoAlerts', JSON.stringify(newAlerts));
                    updateAlertBadgeAndDropdown();
                };
            });
        }
        // Aplica tema pe dropdown
        if (dropdown) {
            dropdown.classList.remove('light-theme', 'dark-theme');
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'light') {
                dropdown.classList.add('light-theme');
            } else {
                dropdown.classList.add('dark-theme');
            }
        }
    }
    // Deschidere/închidere dropdown la click pe clopoțel
    function setupAlertDropdownEvents() {
        document.querySelectorAll('.notification-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('alertDropdown');
                if (!dropdown) return;
                // Poziționează sub clopoțel, dar mai spre stânga
                const rect = btn.getBoundingClientRect();
                dropdown.style.top = (rect.bottom + window.scrollY + 6) + 'px';
                dropdown.style.left = (rect.right - 320) + 'px'; // era 270, acum mai spre stânga
                dropdown.classList.toggle('active');
                // Închide la click în afara dropdown-ului
                function closeDropdown(ev) {
                    if (!dropdown.contains(ev.target) && ev.target !== btn) {
                        dropdown.classList.remove('active');
                        document.removeEventListener('click', closeDropdown);
                    }
                }
                setTimeout(() => document.addEventListener('click', closeDropdown), 10);
            };
        });
    }
    // Actualizez badge și dropdown la încărcare și la orice modificare alertă
    updateAlertBadgeAndDropdown();
    setupAlertDropdownEvents();
    window.addEventListener('storage', updateAlertBadgeAndDropdown);
    // Actualizez și după setarea unei alerte
    const originalOpenAlertModal = window.openAlertModal;
    window.openAlertModal = function(symbol, currentPrice) {
        originalOpenAlertModal(symbol, currentPrice);
        setTimeout(() => {
            updateAlertBadgeAndDropdown();
            setupAlertDropdownEvents();
        }, 100);
    };

    // Functie pentru a afisa alerta pe mijlocul ecranului
    function showCenterAlert(message) {
        let alertDiv = document.getElementById('centerScreenAlert');
        if (!alertDiv) {
            alertDiv = document.createElement('div');
            alertDiv.id = 'centerScreenAlert';
            alertDiv.style.position = 'fixed';
            alertDiv.style.top = '50%';
            alertDiv.style.left = '50%';
            alertDiv.style.transform = 'translate(-50%, -50%)';
            alertDiv.style.background = 'var(--card-background)';
            alertDiv.style.color = 'var(--text-color)';
            alertDiv.style.padding = '24px 32px';
            alertDiv.style.borderRadius = '12px';
            alertDiv.style.fontSize = '1.1rem';
            alertDiv.style.zIndex = '9999';
            alertDiv.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
            alertDiv.style.textAlign = 'center';
            alertDiv.style.minWidth = '300px';
            alertDiv.style.maxWidth = '90vw';
            alertDiv.style.pointerEvents = 'auto';
            alertDiv.style.border = '1px solid var(--border-color)';
            alertDiv.style.fontFamily = 'inherit';
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            alertDiv.style.backdropFilter = 'blur(8px)';
            alertDiv.style.display = 'flex';
            alertDiv.style.alignItems = 'center';
            alertDiv.style.gap = '16px';
            
            // Icon de alertă
            const icon = document.createElement('div');
            icon.innerHTML = '<i class="fas fa-bell" style="color: var(--accent-color); font-size: 1.5rem;"></i>';
            
            // Buton X
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '12px';
            closeBtn.style.right = '12px';
            closeBtn.style.background = 'transparent';
            closeBtn.style.border = 'none';
            closeBtn.style.color = 'var(--secondary-text-color)';
            closeBtn.style.fontSize = '1rem';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '4px';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.transition = 'all 0.2s ease';
            closeBtn.onmouseover = () => {
                closeBtn.style.color = 'var(--accent-color)';
                closeBtn.style.transform = 'rotate(90deg)';
            };
            closeBtn.onmouseout = () => {
                closeBtn.style.color = 'var(--secondary-text-color)';
                closeBtn.style.transform = 'rotate(0deg)';
            };
            closeBtn.onclick = () => {
                alertDiv.style.opacity = '0';
                alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
                setTimeout(() => {
                    alertDiv.style.display = 'none';
                }, 300);
            };
            
            alertDiv.appendChild(closeBtn);
            alertDiv.appendChild(icon);
            document.body.appendChild(alertDiv);
        } else {
            alertDiv.innerHTML = '';
            const icon = document.createElement('div');
            icon.innerHTML = '<i class="fas fa-bell" style="color: var(--accent-color); font-size: 1.5rem;"></i>';
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '<i class="fas fa-times"></i>';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '12px';
            closeBtn.style.right = '12px';
            closeBtn.style.background = 'transparent';
            closeBtn.style.border = 'none';
            closeBtn.style.color = 'var(--secondary-text-color)';
            closeBtn.style.fontSize = '1rem';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.padding = '4px';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.transition = 'all 0.2s ease';
            closeBtn.onmouseover = () => {
                closeBtn.style.color = 'var(--accent-color)';
                closeBtn.style.transform = 'rotate(90deg)';
            };
            closeBtn.onmouseout = () => {
                closeBtn.style.color = 'var(--secondary-text-color)';
                closeBtn.style.transform = 'rotate(0deg)';
            };
            closeBtn.onclick = () => {
                alertDiv.style.opacity = '0';
                alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
                setTimeout(() => {
                    alertDiv.style.display = 'none';
                }, 300);
            };
            alertDiv.appendChild(closeBtn);
            alertDiv.appendChild(icon);
        }
        
        // Mesajul
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        msgSpan.style.flex = '1';
        alertDiv.appendChild(msgSpan);
        
        // Animație de intrare
        alertDiv.style.display = 'flex';
        alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => {
            alertDiv.style.opacity = '1';
            alertDiv.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }

    // Actualizare automată la revenirea pe tab
    if (typeof fetchAllCoinData === 'function') {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Actualizăm doar datele, fără a porni caruselul
                fetchAllCoinData(true).then(() => {
                    // Actualizăm UI-ul fără a porni autoScroll
                    renderTable();
                    renderPagination();
                    // Nu mai apelăm startAutoScroll - caruselul rămâne static
                });
            }
        });
    }

    function checkPriceAlerts() {
        const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
        if (!alerts.length) return;
        
        const activeAlerts = alerts.filter(a => !a.triggered);
        if (activeAlerts.length === 0) return;
        
        let triggered = false;
        const now = Date.now();
        
        activeAlerts.forEach(alert => {
            // Găsește moneda în tableData (datele reale)
            const coin = tableData.find(c => c.symbol === alert.symbol);
            if (!coin) {
                console.log(`[Prices] Nu s-a găsit moneda ${alert.symbol} în datele tabelului`);
                return;
            }
            
            // Adăugăm logging pentru debugging
            console.log(`[Prices] Verificare alertă: ${alert.symbol}, condiție: ${alert.condition}, preț țintă: ${alert.price}, preț actual: ${coin.price}`);
            
            // Verifică corect ambele condiții (above/below)
            const shouldTrigger = 
                (alert.condition === 'above' && coin.price >= alert.price) ||
                (alert.condition === 'below' && coin.price <= alert.price);
                
            if (shouldTrigger) {
                showCenterAlert(`Alerta ta pentru ${coin.name} (${coin.symbol}) a fost declanșată! Prețul a ajuns la $${coin.price.toFixed(2)} (${alert.condition === 'above' ? 'peste' : 'sub'} $${alert.price})`);
                alert.triggered = true;
                alert.lastTriggered = now;
                triggered = true;
            }
        });
        
        if (triggered) {
            localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
            if (typeof updateAlertBadgeAndDropdown === 'function') updateAlertBadgeAndDropdown();
        }
    }

    // Reactivăm funcția animateScroll pentru a permite mișcarea automată
    function animateScroll() {
        if (!animationId) {
            return; 
        }

        // Verificăm dacă tranziția e activă, altfel nu aplicăm tranziția vizuală
        const hasTransition = carouselTrack.style.transition !== 'none';

        // Folosim o viteză constantă, moderată
        currentPosition -= speed;
        carouselTrack.style.transform = `translateX(${currentPosition}px)`;

        // Apelăm checkWrapAround pentru a gestiona cazul când ajungem la final
        checkWrapAround();

        // Continuăm animația
        animationId = requestAnimationFrame(animateScroll);
    }

    // Adaug implementarea pentru filtrarea după tip direct în antet
    function setupTypeFilter() {
        const typeFilter = document.getElementById('typeFilter');
        if (!typeFilter) return;
        
        console.log("Configurăm filtrul de tip...");
        
        // Adăugăm event listener pentru selectorul de tip
        typeFilter.addEventListener('change', function() {
            console.log("Filtru de tip schimbat:", this.value);
            filterAndDisplayData();
        });
        
        // Aplicăm filtrul implicit (prima opțiune) la încărcare
        if (typeFilter.value) {
            console.log("Aplicăm filtrul implicit:", typeFilter.value);
            setTimeout(() => filterAndDisplayData(), 100);
        }
    }

        // Adăugăm apelul funcției setupTypeFilter în init-ul existent pentru a activa filtrul    // setTypeFilter va fi apelat după ce pagina este încărcată complet

    // Nu modific restul codului, doar adaug aceste funcții la sfârșit
    // La documentul existent
}); 