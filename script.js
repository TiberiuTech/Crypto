// Funcție helper pentru toggle parola (scop global)
function setupPasswordToggle(inputId, toggleIconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(toggleIconId);
    if (passwordInput && toggleIcon) {
        toggleIcon.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleIcon.classList.toggle('fa-eye');
            toggleIcon.classList.toggle('fa-eye-slash');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // ------------------ LOGICĂ GENERALĂ (rulează pe toate paginile) ------------------

    // Referințe elemente comune
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleBtnMobile = document.getElementById('themeToggleBtnMobile');

    // Listener Hamburger Menu
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Logică Tema
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Update button icons
        if (theme === 'dark') {
            if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }
    if (themeToggleBtnMobile) {
        themeToggleBtnMobile.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(initialTheme);

    // Activare Butoane Login/Sign Up
    const currentPagePath = window.location.pathname;
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const signupBtnMobile = document.getElementById('signupBtnMobile');
    if(loginBtn) loginBtn.classList.remove('active');
    if(loginBtnMobile) loginBtnMobile.classList.remove('active');
    if(signupBtn) signupBtn.classList.remove('active');
    if(signupBtnMobile) signupBtnMobile.classList.remove('active');
    if (currentPagePath.includes('login.html')) {
        if(loginBtn) loginBtn.classList.add('active');
        if(loginBtnMobile) loginBtnMobile.classList.add('active');
    } else if (currentPagePath.includes('signup.html')) {
        if(signupBtn) signupBtn.classList.add('active');
        if(signupBtnMobile) signupBtnMobile.classList.add('active');
    }

    // Inițializare Toggle Parole (rulează pe toate paginile, funcționează doar dacă elementele există)
    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('signup-password', 'toggle-signup-password');
    setupPasswordToggle('signup-confirm-password', 'toggle-signup-confirm-password');
    setupPasswordToggle('reset-new-password', 'toggle-reset-password');
    setupPasswordToggle('reset-confirm-password', 'toggle-reset-confirm-password');

    // ------------------ LOGICĂ SPECIFICĂ PAGINII NEWS ------------------
    const newsGridContainer = document.getElementById('news-grid-container');
    if (newsGridContainer) { 
        // Referințe elemente specifice paginii News
        const paginationControls = document.getElementById('pagination-controls');
        const searchInput = document.getElementById('search-input');
        const sourceFilter = document.getElementById('source-filter');

        // Configurări API și stare pagină
        const API_KEY = 'bf3377596e9ff67662bd43919805d92f1416e7721a7a2d7e60a96486f027f343'; 
        const API_ENDPOINT = 'https://min-api.cryptocompare.com/data/v2/news/';
        const ARTICLES_PER_PAGE = 9;
        let currentPage = 1;
        let totalFilteredArticles = 0;
        let allArticles = [];
        let filteredArticles = [];
        
        // Definiții Funcții Specifice News (fetchNews, populateSourceFilter, etc.)
        async function fetchNews() {
            displayLoading(true);
            const url = `${API_ENDPOINT}?lang=EN`; 
            try {
                const response = await fetch(url, { headers: { 'Authorization': `Apikey ${API_KEY}` } });
                if (!response.ok) {
                    let errorData = null; try { errorData = await response.json(); } catch (e) {}
                    throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData?.Message || ''}`);
                }
                const data = await response.json();
                if (data.Type !== 100 || !data.Data || !Array.isArray(data.Data)) {
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
        function populateSourceFilter() {
            if (!sourceFilter) return;
            const sources = [...new Set(allArticles.map(article => article.source))].sort(); 
            sourceFilter.innerHTML = '<option value="">All Sources</option>'; 
            sources.forEach(source => {
                const option = document.createElement('option');
                option.value = source;
                option.textContent = source;
                sourceFilter.appendChild(option);
            });
        }
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
            currentPage = 1; 
            displayUI(); 
        }
        function displayLoading(isLoading) {
             if (!newsGridContainer || !paginationControls) return;
             if (isLoading) {
                 newsGridContainer.innerHTML = '<p>Loading news...</p>';
                 paginationControls.innerHTML = '';
             }
        }
        function displayUI() {
            displayNews(currentPage);
            displayPagination();
        }
        function displayNews(page) {
            if (!newsGridContainer) return;
            const startIndex = (page - 1) * ARTICLES_PER_PAGE;
            const endIndex = startIndex + ARTICLES_PER_PAGE;
            const articlesToShow = filteredArticles.slice(startIndex, endIndex);
            newsGridContainer.innerHTML = '';
            if (articlesToShow.length === 0) {
                 if (totalFilteredArticles === 0 && (searchInput?.value || sourceFilter?.value)) {
                     newsGridContainer.innerHTML = '<p class="no-results-message">No news articles match your criteria.</p>';
                 } else if (totalFilteredArticles === 0 && allArticles.length === 0) {
                     newsGridContainer.innerHTML = '<p class="no-results-message">No news articles found at the moment.</p>';
                 } else if (page > 1) {
                     newsGridContainer.innerHTML = '<p class="no-results-message">No more news articles on this page.</p>';
                 } else {
                     newsGridContainer.innerHTML = '<p class="no-results-message">No news to display.</p>';
                 }
                 return;
            }
            articlesToShow.forEach(article => {
                const card = document.createElement('article');
                card.classList.add('news-card');
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
        function displayPagination() {
            if (!paginationControls) return;
            paginationControls.innerHTML = ''; 
            const totalPages = Math.ceil(totalFilteredArticles / ARTICLES_PER_PAGE);
            if (totalPages <= 1) return; 
            const prevButton = createPaginationButton('<< Prev', currentPage > 1 ? currentPage - 1 : 1);
            prevButton.disabled = currentPage === 1;
            paginationControls.appendChild(prevButton);
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
                if (startPage > 2) { paginationControls.appendChild(createPaginationEllipsis()); }
            }
            for (let i = startPage; i <= endPage; i++) {
                const pageButton = createPaginationButton(i.toString(), i);
                if (i === currentPage) { pageButton.classList.add('active'); }
                paginationControls.appendChild(pageButton);
            }
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) { paginationControls.appendChild(createPaginationEllipsis()); }
                paginationControls.appendChild(createPaginationButton(totalPages.toString(), totalPages));
            }
            const nextButton = createPaginationButton('Next >>', currentPage < totalPages ? currentPage + 1 : totalPages);
            nextButton.disabled = currentPage === totalPages;
            paginationControls.appendChild(nextButton);
        }
        function createPaginationButton(text, pageNumber) {
            const button = document.createElement('button');
            button.classList.add('pagination-btn');
            button.textContent = text;
            button.addEventListener('click', () => { goToPage(pageNumber); });
            return button;
        }
        function createPaginationEllipsis() {
            const span = document.createElement('span');
            span.classList.add('pagination-ellipsis');
            span.textContent = '...';
            return span;
        }
        function goToPage(pageNumber) {
            const totalPages = Math.ceil(totalFilteredArticles / ARTICLES_PER_PAGE);
            if (pageNumber < 1 || pageNumber > totalPages) return;
            currentPage = pageNumber;
            displayUI(); 
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
        }
        function displayError(message) {
            if (newsGridContainer) {
                 newsGridContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">${message}</p>`;
            }
            if (paginationControls) {
                 paginationControls.innerHTML = ''; 
            }
        }

        // Listeneri specifici paginii News
        let searchTimeout;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFiltersAndSearch, 300);
            });
        }
        if (sourceFilter) {
            sourceFilter.addEventListener('change', applyFiltersAndSearch);
        }

        // Funcția de inițializare specifică paginii News
        async function initializeNews() {
           displayLoading(true);
           const success = await fetchNews(); 
           displayLoading(false);
           if (success) {
                populateSourceFilter(); 
                applyFiltersAndSearch(); 
           } 
        }
        
        // Start logică News
        initializeNews();
    } // Sfârșitul if (newsGridContainer)

}); // Sfârșitul DOMContentLoaded