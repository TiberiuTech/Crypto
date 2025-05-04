document.addEventListener('DOMContentLoaded', function() {
    initPortfolioChart();
    initMiniCharts();
    setupEventListeners();
});

function initPortfolioChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    // Date pentru grafic - ultimele 7 zile
    const data = {
        labels: ['6 zile', '5 zile', '4 zile', '3 zile', '2 zile', 'Ieri', 'Azi'],
        datasets: [{
            label: 'Valoarea Portofelului',
            data: [82450, 81200, 83100, 85600, 84900, 86700, 87429],
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            fill: true
        }]
    };
    
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    };
    
    new Chart(ctx, config);
}

function initMiniCharts() {
    const miniCharts = document.querySelectorAll('.mini-chart');
    
    // Date pentru mini grafice
    const chartData = {
        btc: {
            data: [47200, 48500, 49100, 52300, 53800, 56700, 58400],
            color: '#F7931A'
        },
        eth: {
            data: [1850, 1820, 1780, 1840, 1920, 2050, 1980],
            color: '#627EEA'
        },
        orx: {
            data: [3.8, 3.9, 4.1, 4.3, 4.2, 4.5, 4.8],
            color: '#3b82f6'
        }
    };
    
    miniCharts.forEach(canvas => {
        const coin = canvas.dataset.coin;
        const ctx = canvas.getContext('2d');
        
        if (!chartData[coin]) return;
        
        const data = {
            labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Azi'],
            datasets: [{
                data: chartData[coin].data,
                borderColor: chartData[coin].color,
                backgroundColor: `${chartData[coin].color}10`,
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
                fill: true
            }]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        display: false
                    }
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
    });
}

function setupEventListeners() {
    // Ascultător pentru butoanele de acțiune rapidă
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.querySelector('span').textContent.toLowerCase();
            console.log(`Action clicked: ${action}`);
            
            // Aici s-ar implementa funcționalitatea specifică fiecărei acțiuni
            alert(`Funcționalitatea "${action}" va fi implementată în curând!`);
        });
    });
    
    // Ascultător pentru butoanele de filtru
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Eliminăm clasa activă de la toate butoanele
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Adăugăm clasa activă la butonul curent
            this.classList.add('active');
            
            const filter = this.textContent.toLowerCase();
            console.log(`Filter selected: ${filter}`);
            
            // Aici s-ar implementa filtrarea activelor
        });
    });
    
    // Ascultător pentru butonul View All din secțiunea tranzacții
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function() {
            console.log('View all transactions clicked');
            
            // Aici s-ar implementa deschiderea unei pagini cu toate tranzacțiile
            alert('Pagina cu toate tranzacțiile va fi disponibilă în curând!');
        });
    }
    
    // Ascultător pentru rândurile de active
    const assetItems = document.querySelectorAll('.asset-item');
    assetItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Verificăm dacă click-ul a fost pe un buton de acțiune
            if (e.target.closest('.asset-action-btn')) {
                // Dacă da, nu facem nimic aici (acțiunea va fi gestionată de ascultătorul butonului)
                return;
            }
            
            const assetName = this.querySelector('.asset-name').textContent;
            console.log(`Asset clicked: ${assetName}`);
            
            // Aici s-ar implementa deschiderea unei pagini detaliate a activului
            // alert(`Detalii pentru ${assetName} vor fi disponibile în curând!`);
        });
    });
    
    // Ascultător pentru butoanele de acțiune ale activelor
    const assetActionButtons = document.querySelectorAll('.asset-action-btn');
    assetActionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Previne propagarea click-ului la rândul de active
            
            const action = this.getAttribute('title').toLowerCase();
            const assetName = this.closest('.asset-item').querySelector('.asset-name').textContent;
            console.log(`Action ${action} for ${assetName}`);
            
            // Aici s-ar implementa funcționalitatea specifică fiecărei acțiuni
            alert(`Funcționalitatea "${action}" pentru ${assetName} va fi implementată în curând!`);
        });
    });
    
    // Ascultător pentru butonul Refresh Balance
    const refreshBtn = document.querySelector('.refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.classList.add('rotating');
            
            // Simulăm un refresh
            setTimeout(() => {
                this.classList.remove('rotating');
                // Aici s-ar reîmprospăta datele de balanță
                alert('Balanțele au fost actualizate!');
            }, 1000);
        });
    }
    
    // Adăugăm stilul pentru animația de rotație
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rotating {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }
        
        .rotating {
            animation: rotating 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
} 