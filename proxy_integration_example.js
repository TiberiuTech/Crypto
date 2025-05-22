// Exemplu de integrare a serverului proxy în proiectul existent

// 1. INTEGRARE API PROXY - EXEMPLU SIMPLU
// În loc de a face o cerere directă la CoinGecko:
// const fetchPrices = async () => {
//     const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=true&price_change_percentage=24h');
//     const data = await response.json();
//     return data;
// };

// Folosim ruta /api/prices din serverul proxy pentru același efect:
const fetchPrices = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/prices');
        return await response.json();
    } catch (error) {
        console.error('Eroare la preluarea prețurilor:', error);
        return [];
    }
};

// 2. INTEGRARE API PROXY GENERAL - EXEMPLU
// Pentru orice alt API:
const fetchApiData = async (apiUrl) => {
    try {
        const encodedUrl = encodeURIComponent(apiUrl);
        const response = await fetch(`http://localhost:5000/api/proxy?url=${encodedUrl}`);
        return await response.json();
    } catch (error) {
        console.error('Eroare la preluarea datelor de la API:', error);
        return null;
    }
};

// Exemplu de utilizare: 
// Preluare date despre un anumit coin
const fetchCoinData = async (coinId) => {
    return await fetchApiData(`https://api.coingecko.com/api/v3/coins/${coinId}`);
};

// 3. INTEGRARE CERERI BATCH - EXEMPLU
// Pentru a combina mai multe cereri într-una singură:
const fetchMultipleCoins = async (coinIds) => {
    try {
        const urls = coinIds.map(id => `https://api.coingecko.com/api/v3/coins/${id}`);
        
        const response = await fetch('http://localhost:5000/api/batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls }),
        });
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Eroare la preluarea datelor multiple:', error);
        return {};
    }
};

// 4. EXEMPLU DE UTILIZARE ÎN PAGINĂ
document.addEventListener('DOMContentLoaded', async () => {
    // Exemplu de utilizare a funcțiilor proxy
    const prices = await fetchPrices();
    console.log('Prețuri preluate prin proxy:', prices);
    
    // Exemplu de preluare informații pentru Bitcoin
    const bitcoinData = await fetchCoinData('bitcoin');
    console.log('Date Bitcoin preluate prin proxy:', bitcoinData);
    
    // Exemplu de preluare date pentru mai mulți coini într-o singură cerere
    const multipleCoins = await fetchMultipleCoins(['bitcoin', 'ethereum', 'ripple']);
    console.log('Date multiple preluate prin proxy:', multipleCoins);
});

// 5. MODIFICAREA FUNCȚIILOR EXISTENTE
// Exemplu de cum să modifici o funcție existentă pentru a folosi proxy-ul
// De la:
// async function getMarketData() {
//     const response = await fetch('https://api.coingecko.com/api/v3/global');
//     const data = await response.json();
//     return data.data;
// }

// La:
async function getMarketData() {
    const data = await fetchApiData('https://api.coingecko.com/api/v3/global');
    return data ? data.data : null;
}

// 6. GESTIUNEA ERORILOR
// Exemplu de funcție cu gestiunea erorilor API
const fetchWithErrorHandling = async (apiUrl) => {
    try {
        const encodedUrl = encodeURIComponent(apiUrl);
        const response = await fetch(`http://localhost:5000/api/proxy?url=${encodedUrl}`);
        
        if (!response.ok) {
            throw new Error(`Proxy a returnat status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`API a returnat eroare: ${data.error}`);
        }
        
        return data;
    } catch (error) {
        console.error('Eroare la preluarea datelor:', error);
        
        // Afișează un mesaj de eroare în interfață
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = `Nu s-au putut prelua datele. Verificați conexiunea și încercați din nou.`;
            errorElement.style.display = 'block';
        }
        
        return null;
    }
};

// Export pentru a putea fi utilizate în alte fișiere JavaScript
export {
    fetchPrices,
    fetchApiData,
    fetchCoinData,
    fetchMultipleCoins,
    getMarketData,
    fetchWithErrorHandling
}; 