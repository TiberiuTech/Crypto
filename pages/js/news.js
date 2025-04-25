document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded - News");
    
    const newsGridContainer = document.getElementById('news-grid-container');
    console.log("News grid container found:", newsGridContainer ? "Yes" : "No");
    
    if (newsGridContainer) { 
        console.log("News page specific script loaded.");

        // Elemente DOM
        const searchInput = document.getElementById('news-search');
        const searchButton = document.querySelector('.search-button');
        const sourceFilter = document.getElementById('source-filter');
        const categoryFilter = document.getElementById('category-filter');
        const coinFilter = document.getElementById('coin-filter');
        const tradingFilter = document.getElementById('trading-filter');
        const newsGrid = newsGridContainer.querySelector('.news-grid');
        const paginationContainer = document.getElementById('news-pagination');
        
        console.log(":", {
            searchInput: searchInput ? "Yes" : "No",
            sourceFilter: sourceFilter ? "Yes" : "No",
            categoryFilter: categoryFilter ? "Yes" : "No",
            coinFilter: coinFilter ? "Yes" : "No",
            tradingFilter: tradingFilter ? "Yes" : "No",
            newsGrid: newsGrid ? "Yes" : "No",
            paginationContainer: paginationContainer ? "Yes" : "No"
        });

        // Variabile pentru date
        let allArticles = [];
        let filteredArticles = [];
        let searchTimeout;
        
        // Variabile pentru paginare
        const itemsPerPage = 5; // 5 rânduri per pagină (15 știri totale cu 3 pe rând)
        let currentPage = 1;
        let totalPages = 1;

        // Configurație pentru API - fără proxy pentru a testa direct
        // const CORS_PROXY = 'https://corsproxy.io/?';
        const CORS_PROXY = '';  // Încercăm direct fără proxy
        const MIN_REQUEST_INTERVAL = 5 * 60 * 1000;
        const CRYPTO_COMPARE_API_KEY = '';
        const apiCache = {
            lastFetchTimestamp: 0,
            cryptoCompareData: null
        };

        // Formateaza data primită de la API
        function formatDate(timestamp) {
            const date = new Date(timestamp * 1000);
            const options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            return date.toLocaleDateString('ro-RO', options);
        }

        // Scurtează textul dacă e nevoie
        function truncateText(text, maxLength) {
            if (!text) return '';
            return text.length > maxLength 
                ? text.substring(0, maxLength) + '...' 
                : text;
        }

        // Arată indicator de încărcare
        function showLoading() {
            if (!newsGrid) return;
            console.log("Showing loading indicator");
            newsGrid.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner"></div>
                </div>
            `;
        }

        // Arată mesaj când nu există rezultate
        function showNoResults(message = 'No articles found matching your search criteria.') {
            if (!newsGrid) return;
            console.log("Showing no results message:", message);
            newsGrid.innerHTML = `
                <div class="no-results">
                    <p>${message}</p>
                </div>
            `;
        }

        // Pentru a afișa date de test când API-ul nu funcționează
        function getTestArticles() {
            return [
                {
                    title: "Bitcoin reaches a new all-time high of $80,000",
                    description: "Bitcoin price has surpassed $80,000 for the first time in history, marking a 400% increase from the start of the year.",
                    url: "#",
                    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800",
                    publishedAt: Math.floor(Date.now() / 1000) - 3600,
                    source: "CoinDesk",
                    category: "bitcoin",
                    coins: ["btc"],
                    tradingType: "analysis"
                },
                {
                    title: "Ethereum completes the Shanghai upgrade",
                    description: "The Ethereum network has successfully completed the Shanghai upgrade, allowing ETH to be unstaked and significantly reducing transaction costs.",
                    url: "#",
                    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800",
                    publishedAt: Math.floor(Date.now() / 1000) - 7200,
                    source: "Cointelegraph",
                    category: "ethereum",
                    coins: ["eth"],
                    tradingType: "trends"
                },
                {
                    title: "Cardano launches the smart contract platform",
                    description: "The Cardano foundation has officially launched support for smart contracts on the mainnet, opening the way for DeFi applications on the ADA blockchain.",
                    url: "#",
                    imageUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55?auto=format&fit=crop&w=800",
                    publishedAt: Math.floor(Date.now() / 1000) - 14400,
                    source: "CryptoNews",
                    category: "altcoins",
                    coins: ["ada"],
                    tradingType: "strategy"
                },
                {
                    title: "Solana records a massive increase in DeFi activity",
                    description: "The Solana ecosystem has recorded a 300% increase in TVL (Total Value Locked) in the last month, attracting investor attention.",
                    url: "#",
                    imageUrl: "https://images.unsplash.com/photo-1639762681885-7159c0c17e85?auto=format&fit=crop&w=800",
                    publishedAt: Math.floor(Date.now() / 1000) - 21600,
                    source: "DeFi Pulse",
                    category: "defi",
                    coins: ["sol"],
                    tradingType: "signals"
                },
                {
                    title: "The Bored Ape Yacht Club collection ranks in top 5 transactions",
                    description: "The Bored Ape Yacht Club collection recorded record sales, with an NFT sold for 500 ETH, equivalent to over $1.5 million.",
                    url: "#",
                    imageUrl: "https://images.unsplash.com/photo-1643101809609-1348578b3d52?auto=format&fit=crop&w=800",
                    publishedAt: Math.floor(Date.now() / 1000) - 28800,
                    source: "NFT Herald",
                    category: "nft",
                    coins: ["eth"],
                    tradingType: "trends"
                },
                {
                    title: "Polkadot launches parachains for interoperability",
                    description: "The Polkadot network has activated the first parachains, allowing for increased interoperability between different blockchains and opening new opportunities.",
                    url: "#",
                    imageUrl: "https://images.unsplash.com/photo-1642933946309-26fbca0e0675?auto=format&fit=crop&w=800",
                    publishedAt: Math.floor(Date.now() / 1000) - 36000,
                    source: "Crypto Briefing",
                    category: "altcoins",
                    coins: ["dot"],
                    tradingType: "analysis"
                }
            ];
        }

        // Obține știri de la CryptoCompare API
        async function fetchCryptoCompareNews() {
            try {
                console.log("Începe fetchCryptoCompareNews");
                
                // Verifică dacă avem deja datele în cache
                if (apiCache.cryptoCompareData && 
                    (Date.now() - apiCache.lastFetchTimestamp < MIN_REQUEST_INTERVAL)) {
                    console.log('Using cached data for CryptoCompare news');
                    return apiCache.cryptoCompareData;
                }

                const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';
                const proxyUrl = CORS_PROXY ? `${CORS_PROXY}${encodeURIComponent(url)}` : url;
                
                console.log(`New fetch for CryptoCompare news: ${proxyUrl}`);
                
                try {
                    const response = await fetch(proxyUrl);
                    console.log("Received response:", response.status, response.statusText);
                    
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    console.log("Received data:", data ? "Yes" : "No", data && data.Data ? `Articles: ${data.Data.length}` : "No articles");
                    
                    if (!data || !data.Data || !Array.isArray(data.Data)) {
                        throw new Error('Invalid API format or no results for CryptoCompare news');
                    }
                    
                    // Salvăm datele în cache
                    apiCache.cryptoCompareData = data;
                    apiCache.lastFetchTimestamp = Date.now();
                    
                    return data;
                } catch (fetchError) {
                    console.error("Fetch error:", fetchError);
                    throw fetchError;
                }
            } catch (error) {
                console.warn(`Error fetching news from CryptoCompare:`, error);
                throw error;
            }
        }
        
        // Încarcă știrile
        async function fetchNews() {
            showLoading();
            
            try {
                let articles = [];
                try {
                    const cryptoCompareData = await fetchCryptoCompareNews();
                    
                    if (!cryptoCompareData || !cryptoCompareData.Data || !Array.isArray(cryptoCompareData.Data)) {
                        throw new Error('Invalid API format or no results for CryptoCompare news');
                    }
                    
                    // Procesăm datele primite
                    articles = cryptoCompareData.Data.map(article => {
                        // Adăugăm proprietăți pentru filtrele noi basate pe conținut
                        const title = article.title.toLowerCase();
                        const body = article.body.toLowerCase();
                        
                        // Detectăm categoria
                        let category = '';
                        if (title.includes('bitcoin') || body.includes('bitcoin') || title.includes('btc') || body.includes('btc')) {
                            category = 'bitcoin';
                        } else if (title.includes('ethereum') || body.includes('ethereum') || title.includes('eth') || body.includes('eth')) {
                            category = 'ethereum';
                        } else if (title.includes('defi') || body.includes('defi') || title.includes('decentralized finance') || body.includes('decentralized finance')) {
                            category = 'defi';
                        } else if (title.includes('nft') || body.includes('nft') || title.includes('non-fungible') || body.includes('non-fungible')) {
                            category = 'nft';
                        } else if (title.includes('altcoin') || body.includes('altcoin')) {
                            category = 'altcoins';
                        }
                        
                        // Detectăm monede
                        const coins = [];
                        if (title.includes('bitcoin') || body.includes('bitcoin') || title.includes('btc') || body.includes('btc')) {
                            coins.push('btc');
                        }
                        if (title.includes('ethereum') || body.includes('ethereum') || title.includes('eth') || body.includes('eth')) {
                            coins.push('eth');
                        }
                        if (title.includes('solana') || body.includes('solana') || title.includes('sol') || body.includes('sol')) {
                            coins.push('sol');
                        }
                        if (title.includes('cardano') || body.includes('cardano') || title.includes('ada') || body.includes('ada')) {
                            coins.push('ada');
                        }
                        if (title.includes('polkadot') || body.includes('polkadot') || title.includes('dot') || body.includes('dot')) {
                            coins.push('dot');
                        }
                        
                        // Detectăm tipul de trading
                        let tradingType = '';
                        if (title.includes('analysis') || body.includes('analysis') || title.includes('analiză') || body.includes('analiză')) {
                            tradingType = 'analysis';
                        } else if (title.includes('signal') || body.includes('signal') || title.includes('semnal') || body.includes('semnal')) {
                            tradingType = 'signals';
                        } else if (title.includes('trend') || body.includes('trend') || title.includes('tendință') || body.includes('tendință')) {
                            tradingType = 'trends';
                        } else if (title.includes('strategy') || body.includes('strategy') || title.includes('strategie') || body.includes('strategie')) {
                            tradingType = 'strategy';
                        }
                        
                        return {
                            title: article.title,
                            description: article.body,
                            url: article.url,
                            imageUrl: article.imageurl || "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800",
                            publishedAt: article.published_on,
                            source: article.source || "CryptoCompare",
                            category: category,
                            coins: coins,
                            tradingType: tradingType
                        };
                    });
                } catch (apiError) {
                    console.warn("Using test data due to API error:", apiError);
                    articles = getTestArticles();
                }
                
                allArticles = articles;
                console.log(`Loaded ${allArticles.length} articles`);
                
                // Actualizăm interfața cu articolele obținute
                filteredArticles = [...allArticles];
                displayNews(filteredArticles);
                populateSourceFilter();
                
                return true;
            } catch (error) {
                console.error('Failed to load news:', error);
                
                // Încercăm cu date de test
                allArticles = getTestArticles();
                filteredArticles = [...allArticles];
                
                console.log("Displaying test articles in case of error");
                displayNews(filteredArticles);
                populateSourceFilter();
                
                return false;
            }
        }

        // Populează filtrul de surse
        function populateSourceFilter() {
            if (!sourceFilter) return;
            
            // Extragem sursele unice
            const sources = [...new Set(allArticles.map(article => article.source))].sort(); 
            console.log("Available sources:", sources);
            
            // Resetăm conținutul
            sourceFilter.innerHTML = '<option value="">All sources</option>'; 
            
            // Adăugăm opțiunile
            sources.forEach(source => {
                const option = document.createElement('option');
                option.value = source;
                option.textContent = source;
                sourceFilter.appendChild(option);
            });
        }

        // Afișăm articolele în interfață
        function displayNews(articles) {
            if (!newsGrid) {
                console.error("News grid element not found");
                return;
            }
            
            // Verificăm dacă avem articole de afișat
            if (!articles || articles.length === 0) {
                showNoResults();
                updatePagination(0, 1); // Resetăm paginarea
                return;
            }
            
            // Calculăm numărul total de pagini
            totalPages = Math.ceil(articles.length / itemsPerPage);
            
            // Asigurăm că pagina curentă este validă
            if (currentPage > totalPages) {
                currentPage = totalPages;
            }
            
            // Calculăm intervalul de articole pentru pagina curentă
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, articles.length);
            const currentPageArticles = articles.slice(startIndex, endIndex);
            
            console.log(`Displaying ${currentPageArticles.length} articles out of total ${articles.length}, page ${currentPage}/${totalPages}`);
            
            // Construim HTML-ul pentru fiecare card
            let cardsHTML = '';
            
            currentPageArticles.forEach(article => {
                const formattedDate = formatDate(article.publishedAt);
                const truncatedDescription = truncateText(article.description, 150);
                
                cardsHTML += `
                <div class="news-card">
                    <div class="news-image">
                        <img src="${article.imageUrl}" alt="${article.title}" onerror="this.src='https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=800'">
                    </div>
                    <div class="news-content">
                        <span class="news-source">${article.source}</span>
                        <h3 class="news-title">${article.title}</h3>
                        <p class="news-description">${truncatedDescription}</p>
                        <div class="news-footer">
                            <span class="news-date">${formattedDate}</span>
                            <a href="${article.url}" class="news-link" target="_blank">Read</a>
                        </div>
                    </div>
                </div>
                `;
            });
            
            // Actualizăm conținutul grid-ului
            newsGrid.innerHTML = cardsHTML;
            console.log("HTML of card elements generated and inserted into DOM");
            
            // Actualizăm paginarea
            updatePagination(articles.length, totalPages);
        }
        
        // Actualizează butoanele de paginare
        function updatePagination(totalItems, totalPages) {
            if (!paginationContainer) return;
            
            // Ascundem paginarea dacă avem o singură pagină sau niciun articol
            if (totalItems === 0 || totalPages <= 1) {
                paginationContainer.style.display = 'none';
                return;
            }
            
            // Afișăm paginarea dacă avem mai multe pagini
            paginationContainer.style.display = 'flex';
            
            // Generăm butoanele de paginare
            let paginationHTML = `
                <button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''}>
                    << Prev
                </button>
            `;
            
            // Adăugăm butoanele pentru paginile vizibile
            for (let i = 1; i <= totalPages; i++) {
                paginationHTML += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            }
            
            // Buton Următor
            paginationHTML += `
                <button class="pagination-btn next" ${currentPage === totalPages ? 'disabled' : ''}>
                    Next >>
                </button>
            `;
            
            // Actualizăm DOM-ul
            paginationContainer.innerHTML = paginationHTML;
            
            // Adăugăm event listeners pentru butoanele de paginare
            const pageButtons = paginationContainer.querySelectorAll('.pagination-btn');
            pageButtons.forEach(button => {
                button.addEventListener('click', function() {
                    if (this.classList.contains('prev')) {
                        // Previous button
                        if (currentPage > 1) {
                            currentPage--;
                            displayNews(filteredArticles);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } else if (this.classList.contains('next')) {
                        // Next button
                        if (currentPage < totalPages) {
                            currentPage++;
                            displayNews(filteredArticles);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    } else {
                        // Number buttons
                        const page = parseInt(this.getAttribute('data-page'));
                        if (page !== currentPage) {
                            currentPage = page;
                            displayNews(filteredArticles);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }
                });
            });
        }

        // Aplică filtrele și căutarea
        function applyFiltersAndSearch() {
            const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
            const selectedSource = sourceFilter ? sourceFilter.value : '';
            const selectedCategory = categoryFilter ? categoryFilter.value : '';
            const selectedCoin = coinFilter ? coinFilter.value : '';
            const selectedTradingType = tradingFilter ? tradingFilter.value : '';
            
            filteredArticles = allArticles.filter(article => {
                const titleMatch = article.title.toLowerCase().includes(searchTerm);
                const descriptionMatch = article.description.toLowerCase().includes(searchTerm);
                const sourceMatch = selectedSource === '' || article.source === selectedSource;
                
                // Filtrare pentru categorii
                const categoryMatch = selectedCategory === '' || article.category === selectedCategory;
                
                // Filtrare pentru monede
                const coinMatch = selectedCoin === '' || (article.coins && article.coins.includes(selectedCoin));
                
                // Filtrare pentru tipul de trading
                const tradingMatch = selectedTradingType === '' || article.tradingType === selectedTradingType;
                
                return (titleMatch || descriptionMatch) && sourceMatch && categoryMatch && coinMatch && tradingMatch;
            });
            
            console.log(`Filtered to ${filteredArticles.length} articles`);
            
            // Resetăm la prima pagină când aplicăm filtre noi
            currentPage = 1;
            
            // Afișăm rezultatele filtrate
            displayNews(filteredArticles);
        }

        // Inițializare
        function initialize() {
            console.log("Starting initialization");
            
            // Load news
            fetchNews();
            
            // Add event listeners
            if (searchInput) {
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        applyFiltersAndSearch();
                    }, 300);
                });
            }
            
            if (sourceFilter) {
                sourceFilter.addEventListener('change', () => {
                    applyFiltersAndSearch();
                });
            }
            
            // Adăugăm event listeners pentru filtrele noi
            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => {
                    applyFiltersAndSearch();
                });
            }
            
            if (coinFilter) {
                coinFilter.addEventListener('change', () => {
                    applyFiltersAndSearch();
                });
            }
            
            if (tradingFilter) {
                tradingFilter.addEventListener('change', () => {
                    applyFiltersAndSearch();
                });
            }
            
            console.log("Initialization complete");
        }

        // Start the application
        initialize();
    } 
});
