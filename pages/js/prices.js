document.addEventListener('DOMContentLoaded', () => {
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
    const MIN_REQUEST_INTERVAL = 15 * 1000;
    
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
    let speed = 0.5; // Viteza de scroll

    const modal = document.getElementById('coinModal');
    const modalClose = document.querySelector('.modal-close');
    let currentCoin = null;
    let modalChart = null;
    let currentChartPeriod = '24h'; // Store the currently selected period

    // Adăugăm variabile pentru căutare și filtrare
    let searchTerm = '';
    let filterValue = 'all';
    let filteredData = [];
    
    let currentSort = { key: null, direction: 'desc' };

    // Adaug referințe pentru mini-charts
    const miniCharts = {};

    // Funcție pentru a apela un URL prin proxy CORS cu gestionare avansată a erorilor
    async function fetchWithProxy(url, forceRefresh = false) {
        try {
            // Nu mai adăugăm timestamp pentru evitarea cache-ului
            // Acest lucru contribuia semnificativ la problema de rate limit
            const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
            
            console.log(`Fetch nou: ${url}`);
            const response = await fetch(proxyUrl);
            
            if (response.status === 429) {
                console.warn('Rate limit depășit la CoinGecko. Folosim datele demo.');
                throw new Error('RATE_LIMIT_EXCEEDED');
            }
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            
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
            throw error;
        }
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
            historicalData: historicalData
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

    // Funcție pentru a obține date reale de la CoinGecko
    async function fetchCoinData() {
        const oldPosition = currentPosition;
        const wasScrolling = animationId !== null;
        
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
        
        try {
            // Verificăm dacă timpul scurs de la ultima cerere este mai mic decât intervalul minim
            // Sau dacă am depășit numărul maxim de cereri
            if (Date.now() - apiCache.lastFetchTimestamp < MIN_REQUEST_INTERVAL) {
                // Folosim datele din cache dacă există
                if (apiCache.marketData) {
                    console.log('Folosim datele din cache pentru carusel.');
                    
                    // Procesăm datele din cache în același mod ca datele noi
                    coinData = apiCache.marketData.map((coin) => {
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
                            historicalData: historicalData
                        };
                    });
                } else {
                    // Dacă nu există date în cache, generăm date demo
                    throw new Error('Nu există date în cache și limita de cereri a fost atinsă');
                }
            } else {
                // Obținem datele de la CoinGecko prin proxy
                const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CAROUSEL_COINS.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
                const apiData = await fetchWithProxy(url);
                
                if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
                    throw new Error('Format API nevalid sau niciun rezultat');
                }
                
                // În loc să facem cereri separate pentru date istorice, le generăm pe baza schimbării din 24h
                // Astfel reducem numărul de cereri API și evităm limitarea ratei
                
                // Construim datele pentru carusel
                coinData = apiData.map((coin) => {
                    // Generăm date istorice folosind prețul curent și schimbarea procentuală
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
                        historicalData: historicalData
                    };
                });
                
                if (coinData.length === 0) {
                    throw new Error('Nu am primit date de la API');
                }
            }
        } catch (error) {
            console.warn('Folosim date demonstrative pentru carusel:', error);
            coinData = CAROUSEL_COINS.map((coin, index) => generateDemoData(coin, index));
        }
        
        // Actualizăm caruselul
        renderCarouselWithPosition(oldPosition);
        
        // Repornim scroll-ul doar dacă era activ înainte
        if (wasScrolling && !isHovered) {
            startAutoScroll();
        }
    }

    // Generăm date istorice bazate pe prețul curent și schimbarea procentuală
    function generateHistoricalData(currentPrice, percentChange, points) {
        // Calculăm prețul de start bazat pe schimbarea procentuală
        const startPrice = currentPrice / (1 + percentChange/100);
        
        // Generăm mai multe puncte pentru grafice mai detaliate
        return Array(points).fill(0).map((_, i) => {
            // Adăugăm o componentă aleatoare pentru a face graficele să arate natural
            const progress = i / (points - 1); // 0 la început, 1 la final
            const randomNoise = (Math.random() * 0.04 - 0.02) * currentPrice; // ±2% variație
            return startPrice + (currentPrice - startPrice) * progress + randomNoise;
        });
    }

    // Separăm crearea elementelor DOM de manipularea lor pentru a reduce reflow-urile
    function renderCarouselWithPosition(savedPosition) {
        // Oprim tranzițiile în timp ce construim DOM-ul
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
        
        // Setăm poziția înainte de a activa tranzițiile
        const initialOffset = -coinData.length * CARD_WIDTH_WITH_MARGIN;
        currentPosition = savedPosition !== undefined ? savedPosition : initialOffset;
        carouselTrack.style.transform = `translateX(${currentPosition}px)`;
        
        // Întârziem inițializarea graficelor pentru a permite browserului să termine primul render
        requestAnimationFrame(() => {
            repeatedData.forEach((coin, index) => {
                const card = carouselTrack.children[index];
                if (card) {
                    initializeMiniChart(card, coin);
                }
            });
            
            // Reactivăm tranzițiile după ce DOM-ul este actualizat complet
            requestAnimationFrame(() => {
                carouselTrack.style.transition = '';
                
                // Adăugăm listeners pentru evenimente
                addCoinClickListeners();
                
                // Pornim autoScroll dacă este necesar
                if (!isHovered) { 
                    startAutoScroll();
                }
            });
        });
    }

    function createCoinCardElement(coin, index) {
        const card = document.createElement('div');
        card.className = 'coin-card';
        const changeClass = coin.change24h >= 0 ? 'positive' : 'negative';
        const changeIcon = coin.change24h >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        card.innerHTML = `
            <div class="coin-header">
                <img src="${coin.imageUrl}" alt="${coin.name}" class="coin-image">
                <div>
                    <div class="coin-name">${coin.name}</div>
                    <div class="coin-symbol">${coin.symbol}</div>
                </div>
            </div>
            <div class="coin-price">$${coin.price.toFixed(2)}</div>
            <div class="price-change ${changeClass}">
                <i class="fas ${changeIcon}"></i>
                ${Math.abs(coin.change24h).toFixed(2)}%
            </div>
            <div class="chart-container">
                <canvas id="chart-${coin.symbol}-${index}"></canvas>
            </div>
        `;
        return card;
    }

    function initializeMiniChart(cardElement, coin) {
        const canvas = cardElement.querySelector(`canvas`);
        if (!canvas) return;

        // Dacă există deja un chart pe acest canvas, îl distrugem
        if (miniCharts[canvas.id]) {
            miniCharts[canvas.id].destroy();
        }

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const gradient = ctx.createLinearGradient(0, 0, 0, 50);
        if (coin.change24h >= 0) {
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
        }

        miniCharts[canvas.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: coin.historicalData.map(point => ''),
                datasets: [{
                    data: coin.historicalData,
                    borderColor: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                    borderWidth: Math.abs(coin.change24h) > 2 ? 2 : 1.5,
                    fill: true,
                    backgroundColor: (context) => {
                        const gradient = ctx.createLinearGradient(0, 0, 0, 50);
                        const alpha = Math.min(Math.abs(coin.change24h) / 10, 0.3);
                        if (coin.change24h >= 0) {
                            gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
                            gradient.addColorStop(1, `rgba(16, 185, 129, 0)`);
                        } else {
                            gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
                            gradient.addColorStop(1, `rgba(239, 68, 68, 0)`);
                        }
                        return gradient;
                    },
                    tension: 0.6,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: (items) => {
                                if (!items.length) return '';
                                const hoursAgo = 24 - items[0].dataIndex;
                                const date = new Date();
                                date.setHours(date.getHours() - hoursAgo);
                                return date.toLocaleString('ro-RO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            },
                            label: (item) => `$${item.raw.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: { display: false },
                    y: {
                        display: false,
                        min: (context) => {
                            const values = context.chart.data.datasets[0].data;
                            const min = Math.min(...values);
                            const range = Math.max(...values) - min;
                            const padding = range * (Math.abs(coin.change24h) / 100);
                            return min - padding;
                        },
                        max: (context) => {
                            const values = context.chart.data.datasets[0].data;
                            const max = Math.max(...values);
                            const range = max - Math.min(...values);
                            const padding = range * (Math.abs(coin.change24h) / 100);
                            return max + padding;
                        }
                    }
                }
            }
        });
    }

    function animateScroll() {
        if (isHovered || !animationId) {
            console.log(`Animation halting. Hovered: ${isHovered}, Animation ID: ${animationId}`);
            animationId = null;
            return; 
        }

        currentPosition -= speed;
        carouselTrack.style.transform = `translateX(${currentPosition}px)`;

        checkWrapAround();

        animationId = requestAnimationFrame(animateScroll);
    }

    function startAutoScroll() {
        stopAutoScroll(); 
        console.log("Starting autoscroll...");
        isHovered = false;
        animationId = requestAnimationFrame(animateScroll);
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
        
        if (currentPosition <= -(totalWidth * 2)) { 
            currentPosition += totalWidth;
            carouselTrack.style.transition = 'none';
            carouselTrack.style.transform = `translateX(${currentPosition}px)`;
            carouselTrack.offsetHeight;
            carouselTrack.style.transition = '';
            console.log('Wrapped around end -> start');
        } 
        else if (currentPosition >= -totalWidth) { 
            currentPosition -= totalWidth;
            carouselTrack.style.transition = 'none';
            carouselTrack.style.transform = `translateX(${currentPosition}px)`;
            carouselTrack.offsetHeight;
            carouselTrack.style.transition = '';
            console.log('Wrapped around start -> end');
        }
    }

    // Optimizăm și funcția fetchTableData pentru a obține date reale
    async function fetchTableData(forceRefresh = false) {
        try {
            if (Date.now() - apiCache.lastFetchTimestamp < MIN_REQUEST_INTERVAL) {
                if (apiCache.marketData && !forceRefresh) {
                    console.log('Folosim datele din cache pentru tabel.');
                    tableData = apiCache.marketData.map(coin => {
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
                            historicalData: historicalData
                        };
                    });
                } else {
                    throw new Error('Nu există date în cache și limita de cereri a fost atinsă');
                }
            } else {
                const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ALL_COINS.join(',')}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
                const allData = await fetchWithProxy(url, forceRefresh);
                if (!allData || !Array.isArray(allData) || allData.length === 0) {
                    throw new Error('Nu am primit date de la API');
                }
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
                        historicalData: historicalData
                    };
                });
            }
        } catch (error) {
            console.warn('Eroare la actualizarea datelor din API:', error);
            // Nu actualizăm tableData cu demoData!
            // Poți adăuga aici un mesaj de eroare vizibil dacă vrei
            return;
        }
        filteredData = [...tableData];
        setTimeout(() => {
            renderTable();
            setTimeout(() => {
                renderPagination();
            }, 0);
        }, 0);
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

    function renderTable() {
        const tableBody = document.getElementById('cryptoTableBody');
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = filteredData.slice(startIndex, endIndex);

        document.querySelector('.crypto-table thead tr').innerHTML = `
            <th>#</th>
            <th>Coin</th>
            <th class="sortable" data-sort="price">Price <span class="sort-arrow">▲</span></th>
            <th class="sortable" data-sort="change24h">24h % <span class="sort-arrow">▲</span></th>
            <th class="sortable" data-sort="volume24h">Volume 24h <span class="sort-arrow">▲</span></th>
            <th class="sortable" data-sort="marketCap">Market Cap <span class="sort-arrow">▲</span></th>
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
                <td class="price-cell">$${coin.price.toFixed(2)}</td>
                <td class="change-cell ${coin.change24h >= 0 ? 'positive' : 'negative'}">
                    ${coin.change24h >= 0 ? '+' : ''}${coin.change24h.toFixed(2)}%
                </td>
                <td class="volume-cell">$${formatNumber(coin.volume24h)}</td>
                <td class="market-cap-cell">$${formatNumber(coin.marketCap)}</td>
                <td class="chart-cell" align="center">
                    <canvas id="chart-${coin.symbol}" class="mini-chart"></canvas>
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

        pageData.forEach(coin => {
            const canvas = document.getElementById(`chart-${coin.symbol}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            // Generate more detailed historical data - 24 points instead of just 7
            const detailedHistoricalData = generateHistoricalData(coin.price, coin.change24h, 36);
            
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const gradient = ctx.createLinearGradient(0, 0, 0, rect.height);
            if (coin.change24h >= 0) {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: detailedHistoricalData.map((_, i) => {
                        const date = new Date();
                        date.setHours(date.getHours() - (36 - i));
                        return date.toLocaleTimeString('en-US', { hour: '2-digit' });
                    }),
                    datasets: [{
                        data: detailedHistoricalData,
                        borderColor: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                        borderWidth: 2.5,
                        fill: true,
                        backgroundColor: gradient,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointBackgroundColor: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                        pointHoverBackgroundColor: coin.change24h >= 0 ? '#10b981' : '#ef4444',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            enabled: true,
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#fff',
                            bodyColor: '#fff',
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                title: (items) => {
                                    if (!items.length) return '';
                                    const hoursAgo = 36 - items[0].dataIndex;
                                    const date = new Date();
                                    date.setHours(date.getHours() - hoursAgo);
                                    return date.toLocaleString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                },
                                label: (item) => `$${item.raw.toFixed(2)}`
                            }
                        }
                    },
                    scales: {
                        x: { 
                            display: false,
                            grid: {
                                display: false
                            },
                            ticks: {
                                display: false
                            }
                        },
                        y: {
                            display: false,
                            position: 'right',
                            grid: {
                                display: false
                            },
                            ticks: {
                                display: false
                            },
                            min: (context) => {
                                const values = context.chart.data.datasets[0].data;
                                const min = Math.min(...values);
                                const range = Math.max(...values) - min;
                                const padding = range * 0.15;
                                return min - padding;
                            },
                            max: (context) => {
                                const values = context.chart.data.datasets[0].data;
                                const max = Math.max(...values);
                                const range = max - Math.min(...values);
                                const padding = range * 0.15;
                                return max + padding;
                            }
                        }
                    }
                }
            });
        });
        addCoinClickListeners();
        checkPriceAlerts();
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

    // Inițializăm aplicația
    function init() {
        console.log('Inițializare aplicație...');
        
        // Funcție pentru actualizarea sincronizată a ambelor componente
        async function updateBothComponents() {
            try {
                await Promise.all([
                    fetchCoinData(),
                    fetchTableData(true)
                ]);
            } catch (error) {
                console.error('Eroare la actualizarea datelor:', error);
            }
        }

        // Inițializare inițială
        updateBothComponents().then(() => {
            setupEventListeners();
            addCoinClickListeners();
            renderCarouselWithPosition(0);
            startAutoScroll();
        });

        // Actualizare periodică sincronizată
        setInterval(updateBothComponents, 15000);
    }
    
    function setupEventListeners() {
        carouselContainer.addEventListener('mouseenter', () => {
            isHovered = true;
            stopAutoScroll();
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            isHovered = false;
            startAutoScroll();
        });
        
        // Restul event listener-ilor...
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
            if (modalChart) {
                modalChart.destroy();
                modalChart = null;
            }
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                if (modalChart) {
                    modalChart.destroy();
                    modalChart = null;
                }
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
            alerts.push({ id, symbol, condition, price });
            localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
            modal.querySelector('.target-price').value = '';
            if (typeof updateAlertBadgeAndDropdown === 'function') {
                updateAlertBadgeAndDropdown();
            }
            themeObserver.disconnect();
            modal.remove();
        };
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
    }, 0);

    async function showCoinDetails(symbol) {
        try {
            currentCoin = symbol;
            modal.style.display = 'block';
            
            // Găsim moneda în datele tabelului
            const coinData = tableData.find(c => c.symbol === symbol);
            
            if (!coinData) {
                throw new Error(`No data found for coin ${symbol}`);
            }
            
            // Actualizăm interfața cu datele din tabel - evităm o cerere API în plus
            document.getElementById('modalCoinImage').src = coinData.imageUrl;
            document.getElementById('modalCoinName').textContent = coinData.name;
            document.getElementById('modalCoinSymbol').textContent = coinData.symbol;
            
            // Actualizăm prețurile
            document.getElementById('modalPrice').textContent = `$${coinData.price.toFixed(2)}`;
            const change24h = document.getElementById('modal24hChange');
            change24h.textContent = `${coinData.change24h >= 0 ? '+' : ''}${coinData.change24h.toFixed(2)}%`;
            change24h.className = coinData.change24h >= 0 ? 'positive' : 'negative';
            
            // Actualizăm statisticile aproximative
            const highPrice = coinData.price * 1.05; // +5%
            const lowPrice = coinData.price * 0.95;  // -5%
            document.getElementById('modal24hHigh').textContent = `$${highPrice.toFixed(2)}`;
            document.getElementById('modal24hLow').textContent = `$${lowPrice.toFixed(2)}`;
            document.getElementById('modal24hVolume').textContent = `$${formatNumber(coinData.volume24h)}`;
            document.getElementById('modalMarketCap').textContent = `$${formatNumber(coinData.marketCap)}`;
            
            // Încercăm să obținem date suplimentare doar dacă nu am depășit rata limită
            try {
                // Verificăm dacă timpul scurs de la ultima cerere este suficient ȘI dacă nu am depășit numărul maxim de cereri
                if (Date.now() - apiCache.lastFetchTimestamp > MIN_REQUEST_INTERVAL) {
                    const url = `https://api.coingecko.com/api/v3/coins/${coinData.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
                    const detailedData = await fetchWithProxy(url);
                    
                    if (detailedData && detailedData.market_data) {
                        // Actualizăm statisticile doar dacă am primit date noi
                        document.getElementById('modal24hHigh').textContent = `$${detailedData.market_data.high_24h.usd.toFixed(2)}`;
                        document.getElementById('modal24hLow').textContent = `$${detailedData.market_data.low_24h.usd.toFixed(2)}`;
                    }
                } else {
                    console.log('Skipping request for additional details due to rate limiting or maximum request count');
                }
            } catch (error) {
                console.warn('Could not get additional detailed data:', error);
                // Continuăm cu datele pe care le avem deja
            }
            
            // Inițializăm graficul fără cereri API suplimentare
            await loadChartData('24h');
        } catch (error) {
            console.error('Error displaying coin details:', error);
        }
    }

    async function loadChartData(period) {
        currentChartPeriod = period;
        
        // Găsim moneda în datele tabelului
        const coinData = tableData.find(c => c.symbol === currentCoin);
        
        if (!coinData) {
            console.error(`No data found for coin ${currentCoin}`);
            return;
        }
        
        // Generăm date demonstrative pentru grafic pentru a evita cereri API suplimentare
        const dataPoints = period === '24h' ? 24 : period === '7d' ? 7 : period === '30d' ? 30 : 52;
        const historicalData = generateHistoricalData(coinData.price, coinData.change24h, dataPoints);
        
        const chartData = [];
        const now = new Date();
        const timeStep = period === '24h' ? 3600000 : 86400000; // 1 oră sau 1 zi în milisecunde
        
        for (let i = 0; i < dataPoints; i++) {
            chartData.push({
                time: now.getTime() - (dataPoints - i - 1) * timeStep,
                close: historicalData[i]
            });
        }
        
        // Desenam graficul cu datele generate
        const canvas = document.getElementById('modalChart');
        const ctx = canvas.getContext('2d');
        
        // Adjust canvas for high DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        
        if (modalChart) {
            modalChart.destroy();
        }
        
        // Calculăm min și max pentru scalare
        const minPrice = Math.min(...chartData.map(point => point.close));
        const maxPrice = Math.max(...chartData.map(point => point.close));
        const padding = (maxPrice - minPrice) * 0.1; // 10% padding
        
        // --- Detectează tema curentă pentru axă și grid ---
        const theme = document.documentElement.getAttribute('data-theme');
        const axisColor = theme === 'light' ? 'rgba(60,60,60,0.7)' : 'rgba(255,255,255,0.7)';
        const gridColor = theme === 'light' ? 'rgba(60,60,60,0.08)' : 'rgba(255,255,255,0.08)';
        modalChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(point => {
                    const date = new Date(point.time);
                    if (period === '24h') {
                        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    } else {
                        return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                    }
                }),
                datasets: [{
                    data: chartData.map(point => point.close),
                    borderColor: '#4a90e2',
                    borderWidth: 2.5,
                    fill: true,
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#4a90e2',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => `$${context.raw.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            color: axisColor,
                            maxTicksLimit: period === '24h' ? 6 : 8,
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: axisColor,
                            callback: (value) => `$${value.toFixed(2)}`,
                            font: {
                                size: 11
                            },
                            padding: 8
                        },
                        min: minPrice - padding,
                        max: maxPrice + padding,
                        beginAtZero: false
                    }
                }
            }
        });
        
        // Dacă avem date în cache sau avem timp suficient între cereri,
        // încercăm să obținem date reale de la API pentru a îmbunătăți graficul
        try {
            // Verificăm dacă avem suficient timp între cereri pentru a nu depăși rata limită
            // ȘI dacă nu am depășit numărul maxim de cereri
            if (Date.now() - apiCache.lastFetchTimestamp > MIN_REQUEST_INTERVAL) {
                const cacheKey = `${coinData.id}-${period}`;
                
                // Doar dacă nu avem deja datele în cache
                if (!apiCache.historicalData[cacheKey]) {
                    console.log(`Trying to get real data for chart: ${coinData.id}, period: ${period}`);
                    
                    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 365;
                    const url = `https://api.coingecko.com/api/v3/coins/${coinData.id}/market_chart?vs_currency=usd&days=${days}`;
                    
                    const historyData = await fetchWithProxy(url);
                    
                    if (historyData && historyData.prices && Array.isArray(historyData.prices) && historyData.prices.length > 0) {
                        const realChartData = historyData.prices.map(point => ({
                            time: point[0],
                            close: point[1]
                        }));
                        
                        // Actualizăm graficul cu date reale
                        if (modalChart) {
                            modalChart.data.labels = realChartData.map(point => {
                                const date = new Date(point.time);
                                if (period === '24h') {
                                    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                                } else {
                                    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                                }
                            });
                            modalChart.data.datasets[0].data = realChartData.map(point => point.close);
                            
                            // Recalculăm min și max
                            const minPrice = Math.min(...realChartData.map(point => point.close));
                            const maxPrice = Math.max(...realChartData.map(point => point.close));
                            const padding = (maxPrice - minPrice) * 0.1;
                            
                            modalChart.options.scales.y.min = minPrice - padding;
                            modalChart.options.scales.y.max = maxPrice + padding;
                            
                            modalChart.update();
                            console.log('Chart updated with real data');
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Could not get real data for chart, continuing with previously generated data:', error);
            // Graficul rămâne cu datele generate anterior
        }
    }

    function filterAndDisplayData() {
        filteredData = tableData.filter(coin => {
            const matchesSearch = 
                coin.name.toLowerCase().includes(searchTerm) ||
                coin.symbol.toLowerCase().includes(searchTerm);

            if (!matchesSearch) return false;

            switch (filterValue) {
                case 'market_cap':
                    return coin.marketCap > 1000000000;
                case 'volume':
                    return coin.volume24h > 100000000;
                case 'price':
                    return coin.price > 100;
                case 'change':
                    return Math.abs(coin.change24h) > 5;
                default:
                    return true;
            }
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    function addCoinClickListeners() {
        document.querySelectorAll('.coin-card').forEach(card => {
            card.addEventListener('click', () => {
                const symbol = card.querySelector('.coin-symbol').textContent;
                showCoinDetails(symbol);
            });
        });
        document.querySelectorAll('.crypto-table tbody tr').forEach(row => {
            row.addEventListener('click', function (e) {
                // Dacă s-a dat click pe un buton din Actions, nu deschide detalii
                if (e.target.closest('.action-btn')) return;
                const symbol = row.querySelector('.coin-symbol').textContent;
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
        if (coinModal.style.display === 'block' && currentCoin) {
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
            if (a[key] < b[key]) return currentSort.direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return currentSort.direction === 'asc' ? 1 : -1;
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

    // Functie pentru a verifica alertele la fiecare update de pret
    function checkPriceAlerts() {
        const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
        if (!alerts.length) return;
        // Cautam in datele din tabel (tableData)
        alerts.forEach(alert => {
            const coin = tableData.find(c => c.symbol === alert.symbol);
            if (!coin) return;
            if (
                (alert.condition === 'above' && coin.price >= alert.price) ||
                (alert.condition === 'below' && coin.price <= alert.price)
            ) {
                showCenterAlert(`Alerta: ${coin.name} (${coin.symbol}) a atins pragul de $${alert.price}!`);
                // Stergem alerta dupa ce a fost declansata
                const newAlerts = alerts.filter(a => a.id !== alert.id);
                localStorage.setItem('cryptoAlerts', JSON.stringify(newAlerts));
                if (typeof updateAlertBadgeAndDropdown === 'function') updateAlertBadgeAndDropdown();
            }
        });
    }

    // Apeleaza checkPriceAlerts dupa fiecare actualizare de tabel
    const originalRenderTable = renderTable;
    renderTable = function() {
        originalRenderTable();
        checkPriceAlerts();
    };
}); 