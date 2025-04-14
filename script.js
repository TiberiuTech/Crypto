document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleBtnMobile = document.getElementById('themeToggleBtnMobile');
    const newsGridContainer = document.getElementById('news-grid-container');
    const paginationControls = document.getElementById('pagination-controls');
    const searchInput = document.getElementById('search-input');
    const sourceFilter = document.getElementById('source-filter');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-item, .auth-btn').forEach(element => {
        element.addEventListener('click', () => {
            if (navLinks) {
                navLinks.classList.remove('active');
            }
        });
    });

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    if (themeToggleBtnMobile) {
        themeToggleBtnMobile.addEventListener('click', toggleTheme);
    }

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // --- Configurări --- 
    const API_KEY = 'bf3377596e9ff67662bd43919805d92f1416e7721a7a2d7e60a96486f027f343'; 
    const API_ENDPOINT = 'https://min-api.cryptocompare.com/data/v2/news/';
    const ARTICLES_PER_PAGE = 9; // Numărul de știri pe pagină

    let currentPage = 1;
    let totalFilteredArticles = 0;
    let allArticles = []; // Holds all fetched articles
    let filteredArticles = []; // Holds articles after search/filter

    // --- Funcții --- 

    // Funcție pentru a prelua știrile de la CryptoCompare
    async function fetchNews() {
        if (!newsGridContainer) return false;
        displayLoading(true); // Show loading state

        const url = `${API_ENDPOINT}?lang=EN`; 
        try {
            const response = await fetch(url, { headers: { 'Authorization': `Apikey ${API_KEY}` } });
            if (!response.ok) {
                let errorData = null; try { errorData = await response.json(); } catch (e) {}
                console.error('API Response Error Data:', errorData);
                throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData?.Message || ''}`);
            }
            const data = await response.json();
            if (data.Type !== 100 || !data.Data || !Array.isArray(data.Data)) {
                 console.error('Invalid API response format:', data);
                 throw new Error('Invalid API response format from CryptoCompare.');
            }
            allArticles = data.Data.map(article => ({ 
                title: article.title || 'No Title',
                description: article.body || '',
                url: article.url,
                imageUrl: article.imageurl || 'https://via.placeholder.com/300x200?text=No+Image',
                publishedAt: article.published_on ? new Date(article.published_on * 1000) : new Date(),
                source: article.source_info?.name || article.source || 'Unknown Source'
            }));
            console.log(`Fetched ${allArticles.length} articles initially.`);
            return true; 
        } catch (error) {
            console.error('Failed to fetch news:', error);
            displayError(`Failed to load news: ${error.message}`);
            return false; 
        }
    }

    // Funcție pentru a popula filtrul de surse
    function populateSourceFilter() {
        if (!sourceFilter) return;
        const sources = [...new Set(allArticles.map(article => article.source))].sort(); // Get unique sources
        
        // Clear previous options except the default 'All Sources'
        sourceFilter.innerHTML = '<option value="">All Sources</option>'; 

        sources.forEach(source => {
            const option = document.createElement('option');
            option.value = source;
            option.textContent = source;
            sourceFilter.appendChild(option);
        });
    }

    // Funcție pentru a filtra și căuta articolele
    function applyFiltersAndSearch() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const selectedSource = sourceFilter ? sourceFilter.value : '';

        filteredArticles = allArticles.filter(article => {
            const titleMatch = article.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = article.description.toLowerCase().includes(searchTerm);
            const sourceMatch = selectedSource === '' || article.source === selectedSource;
            
            return (titleMatch || descriptionMatch) && sourceMatch;
        });

        totalFilteredArticles = filteredArticles.length;
        currentPage = 1; // Reset to first page after filtering/searching
        displayUI(); // Update the displayed news and pagination
    }
    
    // Funcție pentru a afișa starea de încărcare
    function displayLoading(isLoading) {
         if (!newsGridContainer || !paginationControls) return;
         if (isLoading) {
             newsGridContainer.innerHTML = '<p>Loading news...</p>';
             paginationControls.innerHTML = ''; // Clear pagination while loading
         } else {
            // Clearing is handled by displayNews
         }
    }

    // Funcție combinată pentru a actualiza UI (știri + paginare)
    function displayUI() {
        displayNews(currentPage);
        displayPagination();
    }

    // Funcție pentru a afișa știrile pe pagina curentă
    function displayNews(page) {
        if (!newsGridContainer) return;
       
        const startIndex = (page - 1) * ARTICLES_PER_PAGE;
        const endIndex = startIndex + ARTICLES_PER_PAGE;
        // Use filteredArticles for display
        const articlesToShow = filteredArticles.slice(startIndex, endIndex);

        newsGridContainer.innerHTML = ''; // Clear previous content

        if (articlesToShow.length === 0) {
            if (totalFilteredArticles === 0 && (searchInput?.value || sourceFilter?.value)) {
                 newsGridContainer.innerHTML = '<p class="no-results-message">No news articles match your criteria.</p>';
            } else if (totalFilteredArticles === 0 && allArticles.length === 0) {
                 newsGridContainer.innerHTML = '<p class="no-results-message">No news articles found at the moment.</p>'; // Initial load, no results
            } else if (page > 1) {
                 newsGridContainer.innerHTML = '<p class="no-results-message">No more news articles on this page.</p>';
            } else {
                 // Fallback - should ideally be covered by above cases
                 newsGridContainer.innerHTML = '<p class="no-results-message">No news to display.</p>';
            }
             return;
        }
        
        articlesToShow.forEach(article => {
            const card = document.createElement('article');
            card.classList.add('news-card');

            // Formatarea datei
            const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = article.publishedAt.toLocaleDateString('en-US', dateOptions);

            card.innerHTML = `
                <div class="news-image">
                    <img src="${article.imageUrl}" alt="${article.title}" loading="lazy" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+Error'; this.alt='Image loading error';">
                </div>
                <div class="news-content">
                    <span class="news-category">${article.source}</span>
                    <h2>${article.title}</h2>
                    <p class="news-excerpt">${article.description ? article.description.substring(0, 120) + '...' : 'No description available.'}</p>
                    <div class="news-meta">
                        <span class="news-date">${formattedDate}</span>
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="read-more">Read More</a>
                    </div>
                </div>
            `;
            newsGridContainer.appendChild(card);
        });
    }

    // Funcție pentru a afișa controalele de paginare
    function displayPagination() {
        if (!paginationControls) return;
        paginationControls.innerHTML = ''; // Clear previous controls

        const totalPages = Math.ceil(totalFilteredArticles / ARTICLES_PER_PAGE);

        if (totalPages <= 1) return; 

        // Buton 'Previous'
        const prevButton = createPaginationButton('<< Prev', currentPage > 1 ? currentPage - 1 : 1);
        prevButton.disabled = currentPage === 1;
        paginationControls.appendChild(prevButton);

        // Logica pentru afișarea numerelor de pagină
        const maxPagesToShow = 5; 
        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }
         if (endPage === totalPages && totalPages > maxPagesToShow) {
             startPage = Math.max(1, totalPages - maxPagesToShow + 1);
         }

        if (startPage > 1) {
            paginationControls.appendChild(createPaginationButton('1', 1));
            if (startPage > 2) {
                paginationControls.appendChild(createPaginationEllipsis());
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageButton = createPaginationButton(i.toString(), i);
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            paginationControls.appendChild(pageButton);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationControls.appendChild(createPaginationEllipsis());
            }
            paginationControls.appendChild(createPaginationButton(totalPages.toString(), totalPages));
        }

        // Buton 'Next'
        const nextButton = createPaginationButton('Next >>', currentPage < totalPages ? currentPage + 1 : totalPages);
        nextButton.disabled = currentPage === totalPages;
        paginationControls.appendChild(nextButton);
    }

    // Funcție helper pentru a crea un buton de paginare
    function createPaginationButton(text, pageNumber) {
        const button = document.createElement('button');
        button.classList.add('pagination-btn');
        button.textContent = text;
        button.addEventListener('click', () => {
            goToPage(pageNumber);
        });
        return button;
    }

    // Funcție helper pentru a crea '...'
    function createPaginationEllipsis() {
        const span = document.createElement('span');
        span.classList.add('pagination-ellipsis');
        span.textContent = '...';
        return span;
    }

    // Funcție pentru a naviga la o pagină specifică
    function goToPage(pageNumber) {
        const totalPages = Math.ceil(totalFilteredArticles / ARTICLES_PER_PAGE);
        if (pageNumber < 1 || pageNumber > totalPages) return;
        currentPage = pageNumber;
        displayUI(); // Update news and pagination
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll lin la începutul paginii
    }
    
     // Funcție pentru a afișa erori
    function displayError(message) {
        if (newsGridContainer) {
             newsGridContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${message}</p>`;
        }
        if (paginationControls) {
             paginationControls.innerHTML = ''; // Clear pagination on error
        }
    }

    // --- Inițializare --- 
    async function initializeNews() {
       displayLoading(true);
       const success = await fetchNews(); 
       displayLoading(false);
       
       if (success) {
            populateSourceFilter(); // Populate filter after fetching data
            applyFiltersAndSearch(); // Apply initial filters (none) and display
       } else {
             // Error already displayed by fetchNews
       }
    }

    // --- Event Listeners pentru Elemente UI (Hamburger, Theme Toggle) --- 
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active'); // Optional: for styling the hamburger icon itself
        });
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.dataset.theme = 'dark';
            if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.dataset.theme = 'light';
            if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
        }
        localStorage.setItem('theme', theme);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    if (themeToggleBtnMobile) {
         themeToggleBtnMobile.addEventListener('click', () => {
            const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }
    
    // Aplică tema salvată sau preferința sistemului la încărcare
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    // Listener pentru căutare (cu debounce pentru performanță)
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFiltersAndSearch();
            }, 300); // Așteaptă 300ms după ce utilizatorul nu mai tastează
        });
    }

    // Listener pentru filtrare
    if (sourceFilter) {
        sourceFilter.addEventListener('change', () => {
            applyFiltersAndSearch();
        });
    }

    // --- Start aplicație știri --- 
    initializeNews();

}); 