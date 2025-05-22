// ÎNAINTE - cererile directe către CoinGecko (care duc la erori 429)
/*
async function fetchCryptoData() {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=true&price_change_percentage=24h');
    const data = await response.json();
    return data;
}

async function fetchCoinDetails(coinId) {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    const data = await response.json();
    return data;
}
*/

// DUPĂ - cererile trec prin serverul proxy (evită erorile 429)
async function fetchCryptoData() {
    try {
        // Folosește endpoint-ul /api/prices optimizat din proxy
        const response = await fetch('http://127.0.0.1:5000/api/prices');
        return await response.json();
    } catch (error) {
        console.error('Eroare la preluarea datelor:', error);
        return [];
    }
}

async function fetchCoinDetails(coinId) {
    try {
        // Folosește proxy-ul general pentru detalii specifice
        const encodedUrl = encodeURIComponent(`https://api.coingecko.com/api/v3/coins/${coinId}`);
        const response = await fetch(`http://127.0.0.1:5000/api/proxy?url=${encodedUrl}`);
        return await response.json();
    } catch (error) {
        console.error(`Eroare la preluarea detaliilor pentru ${coinId}:`, error);
        return null;
    }
}

// Pentru multiple cereri într-o singură solicitare
async function fetchMultipleCoins(coinIds) {
    try {
        const urls = coinIds.map(id => `https://api.coingecko.com/api/v3/coins/${id}`);
        
        const response = await fetch('http://127.0.0.1:5000/api/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls }),
        });
        
        return await response.json();
    } catch (error) {
        console.error('Eroare la preluarea datelor multiple:', error);
        return {};
    }
}

// Exemplu de utilizare în pagină
document.addEventListener('DOMContentLoaded', async () => {
    // Încarcă lista de criptomonede
    const cryptoList = await fetchCryptoData();
    
    // Afișează criptomonedele în pagină
    displayCryptoList(cryptoList);
    
    // Adaugă event listener pentru click pe criptomonede
    document.querySelectorAll('.crypto-item').forEach(item => {
        item.addEventListener('click', async () => {
            const coinId = item.dataset.id;
            const coinDetails = await fetchCoinDetails(coinId);
            displayCoinDetails(coinDetails);
        });
    });
});

// Funcții helper pentru afișare (trebuie adaptate la HTML-ul tău)
function displayCryptoList(cryptoList) {
    const container = document.getElementById('crypto-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    cryptoList.forEach(coin => {
        const item = document.createElement('div');
        item.className = 'crypto-item';
        item.dataset.id = coin.id;
        
        item.innerHTML = `
            <img src="${coin.image}" alt="${coin.name}">
            <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
            <p>$${coin.current_price.toLocaleString()}</p>
            <p class="${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coin.price_change_percentage_24h.toFixed(2)}%
            </p>
        `;
        
        container.appendChild(item);
    });
}

function displayCoinDetails(coinDetails) {
    if (!coinDetails) return;
    
    const detailsContainer = document.getElementById('coin-details');
    if (!detailsContainer) return;
    
    detailsContainer.innerHTML = `
        <div class="coin-header">
            <img src="${coinDetails.image.large}" alt="${coinDetails.name}">
            <h2>${coinDetails.name} (${coinDetails.symbol.toUpperCase()})</h2>
        </div>
        <div class="coin-price">
            <h3>$${coinDetails.market_data.current_price.usd.toLocaleString()}</h3>
            <p class="${coinDetails.market_data.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}">
                ${coinDetails.market_data.price_change_percentage_24h.toFixed(2)}%
            </p>
        </div>
        <div class="coin-stats">
            <div class="stat">
                <span>Market Cap</span>
                <span>$${coinDetails.market_data.market_cap.usd.toLocaleString()}</span>
            </div>
            <div class="stat">
                <span>24h Volume</span>
                <span>$${coinDetails.market_data.total_volume.usd.toLocaleString()}</span>
            </div>
            <div class="stat">
                <span>Circulating Supply</span>
                <span>${coinDetails.market_data.circulating_supply.toLocaleString()} ${coinDetails.symbol.toUpperCase()}</span>
            </div>
        </div>
        <div class="coin-description">
            <h3>Despre ${coinDetails.name}</h3>
            <p>${coinDetails.description.en.substring(0, 300)}...</p>
        </div>
    `;
    
    detailsContainer.style.display = 'block';
} 