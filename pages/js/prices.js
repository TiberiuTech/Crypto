document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'bf3377596e9ff67662bd43919805d92f1416e7721a7a2d7e60a96486f027f343';
    // Lista extinsă de monede
    const ALL_COINS = [
        // Top 10 după capitalizare
        'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE', 'AVAX', 'MATIC',
        // Următoarele 20 monede populare
        'LINK', 'UNI', 'ATOM', 'LTC', 'ETC', 'XLM', 'ALGO', 'VET', 'MANA', 'SAND',
        'AAVE', 'AXS', 'GRT', 'FTM', 'THETA', 'XTZ', 'EOS', 'CAKE', 'NEO', 'BAT',
        // DeFi și Layer 2
        'CRV', 'COMP', 'MKR', 'SNX', 'YFI', 'SUSHI', '1INCH', 'LRC', 'PERP', 'BAL',
        // Gaming și Metaverse
        'ENJ', 'ILV', 'GALA', 'ALICE', 'SLP', 'CHR', 'SUPER', 'TLM', 'HERO', 'PLA',
        // Layer 1 și Infrastructure
        'NEAR', 'ONE', 'EGLD', 'HBAR', 'ICX', 'ZIL', 'CELR', 'ROSE', 'KAVA', 'CELO',
        // Exchange & Trading
        'KCS', 'HT', 'FTT', 'OKB', 'LEO', 'CRO', 'GT', 'WOO', 'SRM', 'DYDX',
        // Privacy & Storage
        'XMR', 'ZEC', 'DASH', 'FIL', 'AR', 'SC', 'STORJ', 'KEEP', 'NMR', 'OCEAN'
    ];
    const CAROUSEL_COINS = ALL_COINS.slice(0, 10); // Păstrăm primele 10 pentru carusel
    const ITEMS_PER_PAGE = 15;
    let currentPage = 1;
    let tableData = [];

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

    async function fetchCoinData() {
        try {
            const response = await fetch(
                `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${CAROUSEL_COINS.join(',')}&tsyms=USD&api_key=${API_KEY}`
            );
            const data = await response.json();
            
            // Fetch historical data for charts
            const historicalPromises = CAROUSEL_COINS.map(coin => 
                fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${coin}&tsym=USD&limit=24&api_key=${API_KEY}`)
                    .then(res => res.json())
            );
            
            const historicalData = await Promise.all(historicalPromises);
            
            // Salvăm poziția curentă înainte de actualizare
            const oldPosition = currentPosition;
            const wasScrolling = animationId !== null;
            
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            
            coinData = CAROUSEL_COINS.map((coin, index) => {
                const rawData = data.RAW[coin].USD;
                const historical = historicalData[index].Data.Data;
                return {
                    symbol: coin,
                    name: rawData.FROMSYMBOL,
                    price: rawData.PRICE,
                    change24h: rawData.CHANGEPCT24HOUR,
                    imageUrl: `https://www.cryptocompare.com${rawData.IMAGEURL}`,
                    historicalData: historical.map(point => point.close)
                };
            });
            
            // Actualizăm conținutul păstrând poziția
            renderCarouselWithPosition(oldPosition);
            
            // Repornim scroll-ul doar dacă era activ înainte
            if (wasScrolling && !isHovered) {
                startAutoScroll();
            }
        } catch (error) {
            console.error('Error fetching coin data:', error);
            carouselTrack.innerHTML = '<p class="error-message">Failed to load crypto prices. Please try again later.</p>';
        }
    }

    function renderCarouselWithPosition(savedPosition) {
        carouselTrack.innerHTML = '';
        carouselTrack.style.transition = 'none';
        
        // Creăm trei seturi de carduri pentru o derulare mai lină
        const repeatedData = [...coinData, ...coinData, ...coinData];
        
        repeatedData.forEach((coin, index) => {
            const card = createCoinCardElement(coin, index);
            carouselTrack.appendChild(card);
            initializeMiniChart(card, coin);
        });
        
        // Setăm poziția inițială la începutul celui de-al doilea set
        const initialOffset = -coinData.length * CARD_WIDTH_WITH_MARGIN;
        currentPosition = savedPosition !== undefined ? savedPosition : initialOffset; // Use saved position if available
        carouselTrack.style.transform = `translateX(${currentPosition}px)`;
        console.log(`Carousel rendered. Initial position: ${currentPosition}`);
        
        addCoinClickListeners();

        // Stop any previous animation first
        stopAutoScroll(); 

        // Start autoscroll immediately if not hovered (no timeout)
        if (!isHovered) { 
            startAutoScroll();
        } else {
        }
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
        const ctx = canvas.getContext('2d');
        
        // Ajustare HiDPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return; // Nu inițializa dacă nu e vizibil
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

        new Chart(ctx, {
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

    async function fetchTableData() {
        try {
            // Fetch current prices (remains the same)
            const priceResponse = await fetch(
                `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${ALL_COINS.join(',')}&tsyms=USD&api_key=${API_KEY}`
            );
            const priceData = await priceResponse.json();

            // Fetch 7-day HOURLY historical data for charts
            console.log("Fetching HOURLY historical data for table charts...");
            const historicalPromises = ALL_COINS.map(coin => 
                // Change to histohour and limit to 7 days * 24 hours
                fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${coin}&tsym=USD&limit=168&api_key=${API_KEY}`)
                    .then(res => res.json())
                    .catch(err => {
                        console.error(`Failed to fetch hourly history for ${coin}:`, err);
                        return { Data: { Data: [] } }; // Return empty data on error for this coin
                    })
            );
            
            const historicalData = await Promise.all(historicalPromises);
            
            tableData = ALL_COINS.map((coin, index) => {
                const rawData = priceData.RAW?.[coin]?.USD;
                const historical = historicalData[index]?.Data?.Data || []; // Ensure fallback to empty array
                
                // Handle cases where current price data might be missing for a coin
                if (!rawData) {
                    console.warn(`Missing price data for ${coin}`);
                    return null; // Skip this coin if essential data is missing
                }

                return {
                    symbol: coin,
                    name: rawData.FROMSYMBOL || coin, // Fallback name
                    price: rawData.PRICE,
                    change24h: rawData.CHANGEPCT24HOUR,
                    volume24h: rawData.VOLUME24HOUR,
                    marketCap: rawData.MKTCAP,
                    imageUrl: rawData.IMAGEURL ? `https://www.cryptocompare.com${rawData.IMAGEURL}` : '', // Handle missing image URL
                    // Filter historical data just in case API returns nulls, and take only 'close' price
                    historicalData: historical.map(point => point.close).filter(price => price !== null && !isNaN(price))
                };
            }).filter(coin => coin !== null); // Filter out any null entries from missing data

            filteredData = [...tableData]; // Inițializăm filteredData cu toate datele
            renderTable();
            renderPagination();
        } catch (error) {
            console.error('Error fetching table data:', error);
            document.getElementById('cryptoTableBody').innerHTML = '<tr><td colspan="7">Failed to load crypto data. Please try again later.</td></tr>';
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

    function renderTable() {
        const tableBody = document.getElementById('cryptoTableBody');
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = filteredData.slice(startIndex, endIndex);

        // Actualizăm headerele tabelului
        document.querySelector('.crypto-table thead tr').innerHTML = `
            <th>Coin</th>
            <th>Price</th>
            <th>24h %</th>
            <th>Volume 24h</th>
            <th>Market Cap</th>
            <th>Chart 7d</th>
            <th>Actions</th>
        `;

        tableBody.innerHTML = pageData.map(coin => `
            <tr>
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
                <td class="chart-cell">
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

        // Initialize mini charts 
        pageData.forEach(coin => {
            const canvas = document.getElementById(`chart-${coin.symbol}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            
            // Adjust for HiDPI
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            const gradient = ctx.createLinearGradient(0, 0, 0, 60); // Keep height for table chart
            if (coin.change24h >= 0) {
                gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
                gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else {
                gradient.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
                gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }

            new Chart(ctx, {
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
        });
        addCoinClickListeners();
    }

    function renderPagination() {
        const pagination = document.getElementById('tablePagination');
        const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
        
        let paginationHTML = `
            <button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                << Prev
            </button>
        `;

        // Afișăm toate numerele de pagină
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

    // Adăugăm funcția de schimbare a paginii în contextul global
    window.changePage = function(page) {
        currentPage = page;
        renderTable();
        renderPagination();
    };

    // Initial fetch pentru carusel
    fetchCoinData();
    
    // Initial fetch pentru tabel
    fetchTableData();
    
    // Refresh data every minute
    setInterval(() => {
        fetchCoinData();
        fetchTableData();
    }, 60000);

    // Funcție pentru afișarea modalului
    async function showCoinDetails(symbol) {
        try {
            currentCoin = symbol;
            modal.style.display = 'block';
            
            // Fetch coin details
            const [priceData, coinInfo] = await Promise.all([
                fetch(`https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${symbol}&tsyms=USD&api_key=${API_KEY}`).then(res => res.json()),
                fetch(`https://min-api.cryptocompare.com/data/all/coinlist?fsym=${symbol}&api_key=${API_KEY}`).then(res => res.json())
            ]);

            const rawData = priceData.RAW[symbol].USD;
            const coinDetails = coinInfo.Data[symbol];

            // Actualizăm informațiile de bază
            document.getElementById('modalCoinImage').src = `https://www.cryptocompare.com${rawData.IMAGEURL}`;
            document.getElementById('modalCoinName').textContent = coinDetails.FullName;
            document.getElementById('modalCoinSymbol').textContent = symbol;
            
            // Actualizăm prețurile
            document.getElementById('modalPrice').textContent = `$${rawData.PRICE.toFixed(2)}`;
            const change24h = document.getElementById('modal24hChange');
            change24h.textContent = `${rawData.CHANGEPCT24HOUR >= 0 ? '+' : ''}${rawData.CHANGEPCT24HOUR.toFixed(2)}%`;
            change24h.className = rawData.CHANGEPCT24HOUR >= 0 ? 'positive' : 'negative';
            
            // Actualizăm statisticile
            document.getElementById('modal24hHigh').textContent = `$${rawData.HIGH24HOUR.toFixed(2)}`;
            document.getElementById('modal24hLow').textContent = `$${rawData.LOW24HOUR.toFixed(2)}`;
            document.getElementById('modal24hVolume').textContent = `$${formatNumber(rawData.VOLUME24HOUR)}`;
            document.getElementById('modalMarketCap').textContent = `$${formatNumber(rawData.MKTCAP)}`;
            
            // Inițializăm graficul (apelul corect)
            await loadChartData('24h');
        } catch (error) {
            console.error('Error loading coin details:', error);
        }
    }

    // Funcție pentru încărcarea datelor graficului
    async function loadChartData(period) {
        currentChartPeriod = period; // Update the stored period
        console.log(`Attempting to load chart data for ${currentCoin}, period: ${period}`);
        try {
            let endpoint;
            let limit;
            let aggregation;
            
            switch(period) {
                case '24h':
                    endpoint = 'histohour';
                    limit = 24;
                    aggregation = 1;
                    break;
                case '7d':
                    endpoint = 'histoday';
                    limit = 7;
                    aggregation = 1;
                    break;
                case '30d':
                    endpoint = 'histoday';
                    limit = 30;
                    aggregation = 1;
                    break;
                case '1y':
                    endpoint = 'histoday';
                    limit = 365;
                    aggregation = 1;
                    break;
            }
            
            console.log(`Fetching from endpoint: ${endpoint}, limit: ${limit}`);
            const response = await fetch(
                `https://min-api.cryptocompare.com/data/v2/${endpoint}?fsym=${currentCoin}&tsym=USD&limit=${limit}&aggregate=${aggregation}&api_key=${API_KEY}`
            );
            const data = await response.json();
            console.log('Raw chart data received:', data);
            
            if (!data || !data.Data || !data.Data.Data) {
                console.error('Invalid chart data structure received:', data);
                return; // Exit if data structure is invalid
            }

            const chartData = data.Data.Data;

            // Filtrăm datele aberante și valorile null/undefined
            const cleanData = chartData.filter(point => {
                return point.close !== null && 
                       point.close !== undefined && 
                       !isNaN(point.close) &&
                       point.close > 0;
            });
            console.log('Cleaned data points:', cleanData.length);

            // Calculăm media și deviația standard pentru a detecta outlier-ii
            const prices = cleanData.map(point => point.close);
            if (prices.length === 0) {
                 console.error('No valid price data after cleaning.');
                 return; // Exit if no valid data
            }
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            const stdDev = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / prices.length);

            // Filtrăm valorile care sunt în afara a 3 deviații standard
            const filteredData = cleanData.filter(point => {
                return Math.abs(point.close - mean) <= 3 * stdDev;
            });
            console.log('Filtered data points (outliers removed):', filteredData.length);
            
            if (filteredData.length === 0) {
                console.error('No data left after outlier filtering.');
                // Consider maybe showing unfiltered data or a message
                return; 
            }

            const canvas = document.getElementById('modalChart');
            const ctx = canvas.getContext('2d');
            console.log('Canvas context acquired:', ctx);

            // Adjust canvas for high DPI displays
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;
            console.log(`Adjusted canvas for DPR: ${dpr}. Render size: ${canvas.width}x${canvas.height}, Display size: ${canvas.style.width}x${canvas.style.height}`);
            
            if (modalChart) {
                console.log('Destroying previous chart instance.');
                modalChart.destroy();
            }

            // Calculăm min și max pentru scalare
            const minPrice = Math.min(...filteredData.map(point => point.close));
            const maxPrice = Math.max(...filteredData.map(point => point.close));
            const padding = (maxPrice - minPrice) * 0.1; // 10% padding

            console.log('Initializing new Chart instance.');
            modalChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: filteredData.map(point => {
                        const date = new Date(point.time * 1000);
                        if (period === '24h') {
                            return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
                        } else {
                            return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
                        }
                    }),
                    datasets: [{
                        data: filteredData.map(point => point.close),
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
                                color: 'rgba(255, 255, 255, 0.6)',
                                maxTicksLimit: period === '24h' ? 6 : 8,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        y: {
                            position: 'right',
                            grid: {
                                color: 'rgba(255, 255, 255, 0.08)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
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
            console.log('Chart initialized successfully.');
        } catch (error) {
            console.error('Error loading or rendering chart data:', error);
        }
    }

    // Event listeners pentru modal
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

    // Event listeners pentru perioadele graficului
    document.querySelectorAll('.chart-period').forEach(button => {
        button.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-period').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadChartData(e.target.dataset.period);
        });
    });

    // Adăugăm event listeners pentru click pe monede în carusel și tabel
    function addCoinClickListeners() {
        // Pentru carusel
        document.querySelectorAll('.coin-card').forEach(card => {
            card.addEventListener('click', () => {
                const symbol = card.querySelector('.coin-symbol').textContent;
                showCoinDetails(symbol);
            });
        });
        
        // Pentru tabel
        document.querySelectorAll('.crypto-table tbody tr').forEach(row => {
            row.addEventListener('click', () => {
                const symbol = row.querySelector('.coin-symbol').textContent;
                showCoinDetails(symbol);
            });
        });
    }

    // Gestionare butoane perioadă
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

    // --- Responsive Chart Handling ---
    let resizeTimeout;
    function debounce(func, delay) {
        return function(...args) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    const handleResize = debounce(() => {
        // Check if the modal is currently visible and a coin is selected
        const coinModal = document.getElementById('coinModal');
        if (coinModal.style.display === 'block' && currentCoin) {
            console.log('Window resized, redrawing chart...');
            loadChartData(currentChartPeriod); // Redraw with the current period
        }
    }, 250); // Debounce time of 250ms

    window.addEventListener('resize', handleResize);
    // --- End Responsive Chart Handling ---

    // Funcție helper pentru calcularea tensiunii curbei
    function calculateTension(coin) {
        // Tensiune bazată pe volatilitate și volum
        const volumeScore = Math.min(coin.volume24h / 1e9, 1); // Normalizăm volumul la 1B
        const volatilityScore = Math.min(Math.abs(coin.change24h) / 10, 1); // Normalizăm volatilitatea la 10%
        
        // Combinăm scorurile pentru a obține o tensiune între 0 (linie dreaptă) și 0.6 (foarte curbată)
        return 0.2 + (volumeScore + volatilityScore) * 0.2;
    }

    // Adăugăm funcțiile pentru gestionarea modalurilor
    window.openAlertModal = function(symbol, currentPrice) {
        const modal = document.createElement('div');
        modal.className = 'modal alert-modal';
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
                            <input type="number" class="target-price" placeholder="0.00" step="0.01">
                        </div>
                        
                        <div class="notification-options">
                            <label>Notification Method:</label>
                            <div class="checkbox-group">
                                <input type="checkbox" id="browser-notify" checked>
                                <label for="browser-notify">Browser Notification</label>
                            </div>
                            <div class="checkbox-group">
                                <input type="checkbox" id="email-notify">
                                <label for="email-notify">Email</label>
                            </div>
                        </div>
                        
                        <button class="set-alert-btn">Set Alert</button>
                    </div>
                    
                    <div class="active-alerts">
                        <h3>Active Alerts</h3>
                        <div class="alerts-list">
                            <!-- Lista de alerte active va fi populată dinamic -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => modal.remove();
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    };

    // Adăugăm event listeners pentru căutare și filtrare
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        filterAndDisplayData();
    });

    filterSelect.addEventListener('change', (e) => {
        filterValue = e.target.value;
        filterAndDisplayData();
    });

    function filterAndDisplayData() {
        filteredData = tableData.filter(coin => {
            const matchesSearch = 
                coin.name.toLowerCase().includes(searchTerm) ||
                coin.symbol.toLowerCase().includes(searchTerm);

            if (!matchesSearch) return false;

            switch (filterValue) {
                case 'market_cap':
                    return coin.marketCap > 1000000000; // > 1B
                case 'volume':
                    return coin.volume24h > 100000000; // > 100M
                case 'price':
                    return coin.price > 100; // > $100
                case 'change':
                    return Math.abs(coin.change24h) > 5; // > 5%
                default:
                    return true;
            }
        });

        currentPage = 1; // Reset to first page when filtering
        renderTable();
        renderPagination();
    }
}); 