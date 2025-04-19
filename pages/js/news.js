document.addEventListener('DOMContentLoaded', () => {
    const newsGridContainer = document.getElementById('news-grid-container');
    if (newsGridContainer) { 
        console.log("News page specific script loaded.");

        const paginationControls = document.getElementById('pagination-controls');
        const searchInput = document.getElementById('news-search');
        const searchButton = document.querySelector('.search-button');
        const sourceFilter = document.getElementById('source-filter');
        const newsTitle = document.querySelector('.news-title');

        const API_KEY = 'bf3377596e9ff67662bd43919805d92f1416e7721a7a2d7e60a96486f027f343';
        const API_ENDPOINT = 'https://min-api.cryptocompare.com/data/v2/news/';
        const ARTICLES_PER_PAGE = 9;
        let currentPage = 1;
        let totalFilteredArticles = 0;
        let allArticles = [];
        let filteredArticles = [];
        
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
             if (!newsGridContainer || !paginationControls || !newsTitle) return;
             const controls = document.querySelector('.controls-container');
             if (isLoading) {
                 newsTitle.textContent = 'Loading News...'; 
                 newsGridContainer.innerHTML = '<p style="text-align: center; padding: 40px;">Fetching latest articles...</p>';
                 paginationControls.innerHTML = '';
                 if (controls) controls.style.display = 'none'; 
             } else {
                 newsTitle.textContent = 'Latest Crypto News'; 
                 if (controls) controls.style.display = 'flex'; 
             }
        }
        
        function displayUI() {
            displayNews(currentPage);
            displayPagination();
        }

        function displayNews(page) {
            if (!newsGridContainer) return;
            displayLoading(false); 

            const startIndex = (page - 1) * ARTICLES_PER_PAGE;
            const endIndex = startIndex + ARTICLES_PER_PAGE;
            const articlesToShow = filteredArticles.slice(startIndex, endIndex);
            
            newsGridContainer.innerHTML = ''; 
            
            if (articlesToShow.length === 0) {
                 let message = 'No news articles found at the moment.'; 
                 if (totalFilteredArticles === 0 && (searchInput?.value || sourceFilter?.value)) {
                     message = 'No news articles match your criteria.';
                 } else if (page > 1) {
                     message = 'No more news articles on this page.';
                 }
                 newsGridContainer.innerHTML = `<p class="no-results-message">${message}</p>`;
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
            let startPage, endPage;
            if (totalPages <= maxPagesToShow + 2) { 
                 startPage = 1;
                 endPage = totalPages;
             } else {
                 const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
                 const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
                 if (currentPage <= maxPagesBeforeCurrent + 1) {
                     startPage = 1;
                     endPage = maxPagesToShow;
                 } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                     startPage = totalPages - maxPagesToShow + 1;
                     endPage = totalPages;
                 } else {
                     startPage = currentPage - maxPagesBeforeCurrent;
                     endPage = currentPage + maxPagesAfterCurrent;
                 }
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
            button.addEventListener('click', (e) => { 
                e.preventDefault(); 
                goToPage(pageNumber); 
            });
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
            if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
            
            currentPage = pageNumber;
            displayUI(); 
            window.scrollTo({ 
                top: 0,
                behavior: 'smooth'
            }); 
        }
        
        function displayError(message) {
             if (newsGridContainer) {
                  newsGridContainer.innerHTML = `<p class="no-results-message" style="color: red;">${message}</p>`;
             }
             if (paginationControls) {
                  paginationControls.innerHTML = ''; 
             }
             displayLoading(false); 
             if (newsTitle) newsTitle.textContent = 'Error Loading News'; 
        }
    
        let searchTimeout;
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                applyFiltersAndSearch();
            });
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    applyFiltersAndSearch();
                }
            });
            
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFiltersAndSearch, 400);
            });
        }
        if (sourceFilter) {
            sourceFilter.addEventListener('change', applyFiltersAndSearch);
        }

        async function initializeNews() {
           displayLoading(true);
           const success = await fetchNews(); 
           displayLoading(false); 
           if (success) {
                populateSourceFilter(); 
                applyFiltersAndSearch(); 
           } 
        }
        
        initializeNews();

    } 
});
