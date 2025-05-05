document.addEventListener('DOMContentLoaded', () => {
    // Obținem datele despre monede înainte de inițializare
    fetchCoinData().then(() => {
        initializeModals();
        initializePortfolioChart();
        initializeMiniCharts();
        initializeDepositDropdown();
        initializeSwapModal();
        setupEventListeners();
        setupCustomNotifications();
        
        // Eliminăm complet mesajul "No assets yet" și reorganizăm spațiul
        removeNoAssetsMessage();
        
        // Inițializăm funcționalitatea de toggle pentru vizibilitatea soldului
        initializeBalanceVisibilityToggle();
        
        // Adăugăm fluctuația prețurilor pentru un efect mai realist
        startPriceFluctuation();
    });
});

// Inițializăm portofelul gol
const wallet = {
    totalBalance: 0,
    change: 0,
    coins: {}, // Gol - va fi populat prin depozite
    transactions: [] // Gol - va fi populat prin tranzacții
};

// Obiect pentru stocarea datelor despre monede primite de la CoinGecko
const coinData = {};

// Prețuri pentru monede - vor fi actualizate de la API
const coinPrices = {
    btc: 0,
    eth: 0,
    orx: 0
};

// Exchange rates pentru swap
const exchangeRates = {
    btc_eth: 13.54,
    btc_orx: 5000,
    eth_btc: 0.0738,
    eth_orx: 369.25,
    orx_btc: 0.0002,
    orx_eth: 0.00271
};

// Funcție pentru a obține datele despre monede de la CoinGecko API
async function fetchCoinData() {
    try {
        // Lista de monede dorite
        const coinIds = [
            'bitcoin', 'ethereum', 'binancecoin', 'ripple', 
            'cardano', 'solana', 'polkadot', 'dogecoin'
        ];
        
        // Request către CoinGecko API
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en`);
        
        if (!response.ok) {
            throw new Error('Could not fetch coin data from CoinGecko API');
        }
        
        const data = await response.json();
        
        // Populăm datele pentru fiecare monedă
        data.forEach(coin => {
            coinData[coin.id] = {
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                price: coin.current_price,
                image: coin.image,
                price_change_percentage_24h: coin.price_change_percentage_24h || 0
            };
            
            // Actualizăm și prețurile pentru monedele principale
            if (coin.id === 'bitcoin') coinPrices.btc = coin.current_price;
            if (coin.id === 'ethereum') coinPrices.eth = coin.current_price;
        });
        
        // Setăm un preț demonstrativ pentru Orionix (dacă nu există în API)
        coinPrices.orx = 4.5;
        
        // Actualizăm ratele de schimb bazate pe prețurile noi
        updateExchangeRates();
        
        console.log('Coin data loaded from CoinGecko:', coinData);
        return coinData;
    } catch (error) {
        console.error('Error fetching coin data:', error);
        // În caz de eroare, menținem prețurile demonstrative
        coinPrices.btc = 47000;
        coinPrices.eth = 1800;
        coinPrices.orx = 4.5;
        
        // Completăm manual datele pentru monedele principale
        coinData.bitcoin = {
            name: 'Bitcoin',
            symbol: 'BTC',
            price: coinPrices.btc,
            image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
            price_change_percentage_24h: 0.5
        };
        
        coinData.ethereum = {
            name: 'Ethereum',
            symbol: 'ETH',
            price: coinPrices.eth,
            image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            price_change_percentage_24h: 0.5
        };
        
        return coinData;
    }
}

// Funcție pentru actualizarea ratelor de schimb
function updateExchangeRates() {
    if (coinPrices.btc > 0 && coinPrices.eth > 0) {
        exchangeRates.btc_eth = coinPrices.btc / coinPrices.eth;
        exchangeRates.eth_btc = coinPrices.eth / coinPrices.btc;
    }
    
    if (coinPrices.btc > 0 && coinPrices.orx > 0) {
        exchangeRates.btc_orx = coinPrices.btc / coinPrices.orx;
        exchangeRates.orx_btc = coinPrices.orx / coinPrices.btc;
    }
    
    if (coinPrices.eth > 0 && coinPrices.orx > 0) {
        exchangeRates.eth_orx = coinPrices.eth / coinPrices.orx;
        exchangeRates.orx_eth = coinPrices.orx / coinPrices.eth;
    }
}

// Inițializează dropdown-ul de selectare a monedelor din modalul de depozit
function initializeDepositDropdown() {
    const coinOptions = document.getElementById('coinOptions');
    const selectedCoin = document.getElementById('selectedCoin');
    const depositCoinInput = document.getElementById('depositCoin');
    const depositCoinSymbol = document.getElementById('depositCoinSymbol');
    const previewSymbol = document.getElementById('previewSymbol');
    
    // Populăm opțiunile dropdown-ului folosind datele din API
    if (coinOptions) {
        let optionsHTML = '';
        
        // Verificăm dacă avem date de la API
        if (Object.keys(coinData).length > 0) {
            // Folosim datele din API
            Object.keys(coinData).forEach(coinId => {
                const coin = coinData[coinId];
                optionsHTML += `
                    <div class="dropdown-option" data-value="${coinId}" data-symbol="${coin.symbol}">
                        <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
                        <span class="coin-name">${coin.name} (${coin.symbol})</span>
                    </div>
                `;
            });
        } else {
            // Dacă nu avem date de la API, folosim opțiunile hardcodate
            const defaultCoins = [
                { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
                { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
                { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' }
            ];
            
            defaultCoins.forEach(coin => {
                optionsHTML += `
                    <div class="dropdown-option" data-value="${coin.id}" data-symbol="${coin.symbol}">
                        <img src="${coin.image}" alt="${coin.name}" class="coin-icon">
                        <span class="coin-name">${coin.name} (${coin.symbol})</span>
                    </div>
                `;
            });
        }
        
        coinOptions.innerHTML = optionsHTML;
        
        // Setăm valoarea inițială
        if (selectedCoin) {
            // Folosim Bitcoin ca monedă implicită
            const defaultCoin = coinData.bitcoin || {
                name: 'Bitcoin',
                symbol: 'BTC',
                image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
            };
            
            selectedCoin.innerHTML = `
                <img src="${defaultCoin.image}" alt="${defaultCoin.name}" class="coin-icon">
                <span class="coin-name">${defaultCoin.name} (${defaultCoin.symbol})</span>
                <i class="fas fa-chevron-down dropdown-arrow"></i>
            `;
            
            // Setăm valorile inițiale pentru depozit
            if (depositCoinInput) depositCoinInput.value = 'bitcoin';
            if (depositCoinSymbol) depositCoinSymbol.textContent = 'BTC';
            if (previewSymbol) previewSymbol.textContent = 'BTC';
            
            // Actualizăm previzualizarea
            updateDepositPreview();
        }
        
        // Adăugăm listener pentru fiecare opțiune
        document.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const symbol = this.getAttribute('data-symbol');
                const icon = this.querySelector('.coin-icon').src;
                const name = this.querySelector('.coin-name').textContent;
                
                // Actualizăm opțiunea selectată
                selectedCoin.innerHTML = `
                    <img src="${icon}" alt="${name}" class="coin-icon">
                    <span class="coin-name">${name}</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                `;
                
                // Actualizăm inputul hidden
                depositCoinInput.value = value;
                
                // Actualizăm simbolul monedei în interfață
                if (depositCoinSymbol) depositCoinSymbol.textContent = symbol;
                if (previewSymbol) previewSymbol.textContent = symbol;
                
                // Închidem dropdown-ul
                document.querySelector('.custom-dropdown').classList.remove('open');
                
                // Actualizăm valorile de previzualizare
                updateDepositPreview();
            });
        });
        
        // Adăugăm funcționalitatea toggle pentru dropdown
        if (selectedCoin) {
            selectedCoin.addEventListener('click', function() {
                document.querySelector('.custom-dropdown').classList.toggle('open');
            });
        }
        
        // Închide dropdown-ul când se face click în afara lui
        document.addEventListener('click', function(event) {
            const dropdown = document.querySelector('.custom-dropdown');
            if (!dropdown) return;
            
            const isClickInside = dropdown.contains(event.target);
            
            if (!isClickInside && dropdown.classList.contains('open')) {
                dropdown.classList.remove('open');
            }
        });
    }
}

// Actualizează previzualizarea depozitului
function updateDepositPreview() {
    const depositAmount = document.getElementById('depositAmount');
    const previewAmount = document.getElementById('previewAmount');
    const previewValue = document.getElementById('previewValue');
    const depositCoin = document.getElementById('depositCoin');
    
    if (depositAmount && previewAmount && previewValue && depositCoin) {
        const amount = parseFloat(depositAmount.value) || 0;
        const coinId = depositCoin.value;
        
        // Actualizăm previzualizarea sumei
        previewAmount.textContent = amount.toFixed(8);
        
        // Obținem prețul actual al monedei
        const coinPrice = coinData[coinId] ? coinData[coinId].price : getCurrentPrice(coinId);
        
        // Calculăm valoarea estimată în USD
        const estimatedValue = amount * coinPrice;
        previewValue.textContent = estimatedValue.toFixed(2);
    }
}

// Modificăm funcția pentru inițializarea swap-ului
function initializeSwapModal() {
    const fromCoinSelect = document.getElementById('fromCoin');
    const toCoinSelect = document.getElementById('toCoin');
    const fromAmount = document.getElementById('fromAmount');
    const toAmount = document.getElementById('toAmount');
    const fromAvailable = document.getElementById('fromAvailable');
    const fromSymbol = document.getElementById('fromSymbol');
    const exchangeRate = document.getElementById('exchangeRate');
    const swapDirectionBtn = document.getElementById('swapDirectionBtn');
    const swapSubmitBtn = document.getElementById('swapSubmitBtn');
    
    console.log("Initializing swap modal, elements found:", {
        fromCoinSelect: !!fromCoinSelect,
        toCoinSelect: !!toCoinSelect,
        fromAmount: !!fromAmount,
        swapSubmitBtn: !!swapSubmitBtn
    });
    
    // Populăm dropdown-urile cu monedele disponibile
    if (fromCoinSelect && toCoinSelect) {
        populateSwapCoinDropdowns(fromCoinSelect, toCoinSelect);
    }
    
    // Actualizare la schimbarea monedei "From"
    if (fromCoinSelect) {
        fromCoinSelect.addEventListener('change', function() {
            updateSwapInfo();
        });
    }
    
    // Actualizare la schimbarea monedei "To"
    if (toCoinSelect) {
        toCoinSelect.addEventListener('change', function() {
            updateSwapInfo();
        });
    }
    
    // Actualizare la schimbarea sumei și prevenirea valorilor negative
    if (fromAmount) {
        // Adaugă atributul min="0" pentru a preveni valorile negative în HTML
        fromAmount.setAttribute('min', '0');
        
        fromAmount.addEventListener('input', function() {
            // Verifică și corectează valori negative
            if (parseFloat(this.value) < 0 || this.value.startsWith('-')) {
                this.value = 0;
            }
            
            updateToAmount();
        });
    }
    
    // Butonul pentru schimbarea direcției
    if (swapDirectionBtn) {
        swapDirectionBtn.addEventListener('click', function() {
            const fromCoin = fromCoinSelect.value;
            const toCoin = toCoinSelect.value;
            
            fromCoinSelect.value = toCoin;
            toCoinSelect.value = fromCoin;
            
            updateSwapInfo();
        });
    }
    
    // Butonul pentru executarea swap-ului
    if (swapSubmitBtn) {
        swapSubmitBtn.onclick = function() {
            console.log("Swap button clicked");
            
            const fromCoin = fromCoinSelect.value;
            const toCoin = toCoinSelect.value;
            const fromAmountValue = parseFloat(fromAmount.value);
            const toAmountValue = parseFloat(toAmount.value);
            
            // Verificăm dacă avem valori valide
            if (!fromCoin || !toCoin || !fromAmountValue || isNaN(fromAmountValue) || fromAmountValue <= 0) {
                console.error("Invalid swap parameters", {
                    fromCoin,
                    toCoin,
                    fromAmount: fromAmountValue
                });
                return false;
            }
            
            // Verificăm dacă avem fonduri suficiente
            if (!wallet.coins[fromCoin] || wallet.coins[fromCoin].amount < fromAmountValue) {
                console.error("Insufficient funds for swap", {
                    available: wallet.coins[fromCoin] ? wallet.coins[fromCoin].amount : 0,
                    requested: fromAmountValue
                });
                return false;
            }
            
            // Executăm swap-ul
            executeSwap(fromCoin, toCoin, fromAmountValue, toAmountValue);
            
            // Închidem modalul
            document.getElementById('swapModal').style.display = 'none';
            
            console.log("Swap completed successfully");
            return false;
        };
    }
    
    // Inițializare la încărcare
    updateSwapInfo();
}

// Funcție pentru popularea dropdown-urilor de swap
function populateSwapCoinDropdowns(fromSelect, toSelect) {
    // Salvăm selecțiile curente dacă există
    const currentFromCoin = fromSelect.value;
    const currentToCoin = toSelect.value;
    
    // Golim dropdown-urile
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    // Lista de monede disponibile
    const availableCoins = [];
    
    // Adăugăm monedele din portofel
    Object.keys(wallet.coins).forEach(coinId => {
        const coin = wallet.coins[coinId];
        if (coin.amount > 0) {
            availableCoins.push({
                id: coinId,
                name: coin.name,
                ticker: coin.ticker
            });
        }
    });
    
    // Dacă nu avem monede în portofel, adăugăm monede implicite
    if (availableCoins.length === 0) {
        const defaultCoins = [
            { id: 'btc', name: 'Bitcoin', ticker: 'BTC' },
            { id: 'eth', name: 'Ethereum', ticker: 'ETH' },
            { id: 'bnb', name: 'Binance Coin', ticker: 'BNB' },
            { id: 'orx', name: 'Orionix', ticker: 'ORX' }
        ];
        
        defaultCoins.forEach(coin => {
            availableCoins.push(coin);
        });
    }
    
    // Populăm dropdown-urile
    availableCoins.forEach(coin => {
        const fromOption = document.createElement('option');
        fromOption.value = coin.id;
        fromOption.textContent = coin.ticker;
        fromSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = coin.id;
        toOption.textContent = coin.ticker;
        toSelect.appendChild(toOption);
    });
    
    // Încercăm să restaurăm selecțiile anterioare
    if (currentFromCoin && fromSelect.querySelector(`option[value="${currentFromCoin}"]`)) {
        fromSelect.value = currentFromCoin;
    }
    
    if (currentToCoin && toSelect.querySelector(`option[value="${currentToCoin}"]`)) {
        toSelect.value = currentToCoin;
    }
    
    // Dacă selecțiile sunt identice, modificăm a doua selecție
    if (fromSelect.value === toSelect.value && availableCoins.length > 1) {
        for (let i = 0; i < toSelect.options.length; i++) {
            if (toSelect.options[i].value !== fromSelect.value) {
                toSelect.selectedIndex = i;
                break;
            }
        }
    }
}

// Funcție pentru actualizarea informațiilor de swap
function updateSwapInfo() {
    const fromCoin = document.getElementById('fromCoin').value;
    const toCoin = document.getElementById('toCoin').value;
    const fromAvailable = document.getElementById('fromAvailable');
    const fromSymbol = document.getElementById('fromSymbol');
    const exchangeRateElement = document.getElementById('exchangeRate');
    
    // Evită swap între aceeași monedă
    if (fromCoin === toCoin) {
        // Alege o monedă diferită
        const toSelect = document.getElementById('toCoin');
        const options = toSelect.options;
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].value !== fromCoin) {
                toSelect.selectedIndex = i;
                return updateSwapInfo();
            }
        }
    }
    
    // Actualizează informațiile disponibile pentru moneda sursă
    const fromCoinInfo = wallet.coins[fromCoin];
    
    if (fromSymbol) {
        fromSymbol.textContent = fromCoin.toUpperCase();
    }
    
    if (fromAvailable) {
        fromAvailable.textContent = fromCoinInfo ? fromCoinInfo.amount.toFixed(4) : "0.00";
    }
    
    // Calculează și afișează rata de schimb
    const rate = calculateExchangeRate(fromCoin, toCoin);
    
    if (exchangeRateElement) {
        exchangeRateElement.textContent = `1 ${fromCoin.toUpperCase()} = ${rate.toFixed(2)} ${toCoin.toUpperCase()}`;
    }
    
    // Recalculează suma rezultată
    updateToAmount();
}

// Funcție pentru calcularea ratei de schimb între două monede
function calculateExchangeRate(fromCoin, toCoin) {
    // Verificăm dacă avem o rată predefinită în exchangeRates
    const rateKey = `${fromCoin}_${toCoin}`;
    if (exchangeRates[rateKey]) {
        return exchangeRates[rateKey];
    }
    
    // Altfel, calculăm rata bazată pe prețuri
    const fromPrice = getCurrentPrice(fromCoin);
    const toPrice = getCurrentPrice(toCoin);
    
    if (fromPrice && toPrice) {
        return fromPrice / toPrice;
    }
    
    // Valoare implicită
    return 1;
}

// Funcție pentru actualizarea sumei rezultate în swap
function updateToAmount() {
    const fromCoin = document.getElementById('fromCoin').value;
    const toCoin = document.getElementById('toCoin').value;
    const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
    const toAmount = document.getElementById('toAmount');
    
    // Obținem rata de schimb
    const rate = calculateExchangeRate(fromCoin, toCoin);
    
    // Aplicăm taxa de 0.1%
    const fee = 0.001; // 0.1%
    const amountAfterFee = fromAmount * (1 - fee);
    
    // Calculăm suma finală
    const calculatedAmount = amountAfterFee * rate;
    
    if (toAmount) {
        toAmount.value = calculatedAmount.toFixed(6);
    }
}

// Funcție pentru executarea swap-ului
function executeSwap(fromCoin, toCoin, fromAmount, toAmount) {
    console.log(`Executing swap: ${fromAmount} ${fromCoin} to ${toAmount} ${toCoin}`);
    
    // Verificăm dacă avem monedele în portofel
    if (!wallet.coins[fromCoin]) {
        console.error(`Source coin ${fromCoin} not found in wallet`);
        return;
    }
    
    // Verificăm dacă avem suficiente fonduri
    if (wallet.coins[fromCoin].amount < fromAmount) {
        console.error(`Insufficient funds for ${fromCoin}`, {
            available: wallet.coins[fromCoin].amount,
            requested: fromAmount
        });
        return;
    }
    
    // Scădem din moneda sursă
    wallet.coins[fromCoin].amount -= fromAmount;
    wallet.coins[fromCoin].value = wallet.coins[fromCoin].amount * getCurrentPrice(fromCoin);
    
    // Adăugăm în moneda destinație (creăm dacă nu există)
    if (!wallet.coins[toCoin]) {
        wallet.coins[toCoin] = {
            id: toCoin,
            name: getCoinName(toCoin),
            ticker: toCoin.toUpperCase(),
            amount: 0,
            value: 0,
            change: 0
        };
    }
    
    wallet.coins[toCoin].amount += toAmount;
    wallet.coins[toCoin].value = wallet.coins[toCoin].amount * getCurrentPrice(toCoin);
    
    // Actualizăm balanța totală
    updateTotalBalance();
    
    // Actualizăm UI-ul pentru moneda sursă (care acum va ascunde elementul dacă balanța e zero)
    updateAssetUI(fromCoin);
    
    // Actualizăm/adăugăm UI-ul pentru moneda destinație
    const toAssetItem = findAssetElement(toCoin);
    if (toAssetItem) {
        // Dacă elementul există, actualizăm doar valorile
        updateAssetUI(toCoin);
    } else {
        // Dacă elementul nu există, îl creăm
        const assetsList = document.getElementById('assetsList');
        if (assetsList) {
            // Ascundem mesajul "no assets" dacă există
            const noAssetsMessage = assetsList.querySelector('.no-assets-message');
            if (noAssetsMessage) {
                noAssetsMessage.style.display = 'none';
            }
            
            // Creăm și adăugăm noul element de asset
            const newAssetItem = createAssetElement(toCoin);
            assetsList.appendChild(newAssetItem);
        }
    }
    
    // Adăugăm tranzacția în istoric
    addSwapToHistory(fromCoin, toCoin, fromAmount, toAmount);
}

// Funcție pentru adăugarea unei tranzacții de swap în istoric
function addSwapToHistory(fromCoin, toCoin, fromAmount, toAmount) {
    console.log(`Adding swap to history: ${fromAmount} ${fromCoin} to ${toAmount} ${toCoin}`);
    
    // Creează o nouă tranzacție
    const newTransaction = {
        type: 'swap',
        fromCoin: fromCoin,
        toCoin: toCoin,
        fromAmount: fromAmount,
        toAmount: toAmount,
        value: fromAmount * getCurrentPrice(fromCoin),
        date: new Date(),
        status: 'completed'
    };
    
    // Adaugă tranzacția la lista existentă
    wallet.transactions.unshift(newTransaction);
    
    // Actualizează UI-ul
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) {
        console.error("transactionsList element not found");
        return;
    }
    
    // Ascunde mesajul "no transactions" dacă există
    const noTransactionsMessage = transactionsList.querySelector('.no-transactions-message');
    if (noTransactionsMessage) {
        noTransactionsMessage.style.display = 'none';
    }
    
    // Creează elementul pentru noua tranzacție
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    
    const fromCoinInfo = wallet.coins[fromCoin];
    const toCoinInfo = wallet.coins[toCoin];
    
    const fromTicker = fromCoinInfo ? fromCoinInfo.ticker : fromCoin.toUpperCase();
    const toTicker = toCoinInfo ? toCoinInfo.ticker : toCoin.toUpperCase();
    
    transactionItem.innerHTML = `
        <div class="transaction-icon swap">
            <i class="fas fa-exchange-alt"></i>
        </div>
        <div class="transaction-details">
            <div class="transaction-title">Swapped ${fromTicker} to ${toTicker}</div>
            <div class="transaction-date">Just now</div>
        </div>
        <div class="transaction-amount">
            <div class="amount">${fromAmount.toFixed(6)} ${fromTicker} → ${toAmount.toFixed(6)} ${toTicker}</div>
            <div class="value">$${(fromAmount * getCurrentPrice(fromCoin)).toFixed(2)}</div>
        </div>
        <div class="transaction-status">
            <span class="status completed">Completed</span>
        </div>
    `;
    
    // Adaugă la începutul listei
    if (transactionsList.firstChild) {
        transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    } else {
        transactionsList.appendChild(transactionItem);
    }
    
    console.log("Swap transaction added to history");
}

// Restul funcțiilor existente
function initializeModals() {
    // Inițializarea modalelor
    const modals = ['depositModal', 'withdrawModal', 'swapModal', 'historyModal', 'cardDetailsModal', 'paymentConfirmationModal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
        
        // Închide modalul când se face click în afara conținutului
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function initializePortfolioChart() {
    const ctx = document.getElementById('portfolioChart');
    if (!ctx) return;
    
    // Date demonstrative pentru grafic cu mai multe fluctuații
    const data = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Portfolio Value',
            data: [65000, 72000, 68000, 75000, 72000, 80000, 85000, 82000, 90000, 85000, 95000, 87000],
            fill: true,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 6
        }]
    };
    
    const options = {
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
                display: false,
                min: Math.min(...data.datasets[0].data) * 0.9,
                max: Math.max(...data.datasets[0].data) * 1.1
            }
        },
        elements: {
            line: {
                borderWidth: 2
            }
        }
    };
    
    new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

function initializeMiniCharts() {
    const charts = document.querySelectorAll('.mini-chart');
    
    charts.forEach(chartCanvas => {
        const ctx = chartCanvas;
        const coin = chartCanvas.dataset.coin;
        
        // Date demonstrative personalizate pentru fiecare monedă
        let data;
        if (coin === 'btc') {
            data = [45000, 46200, 45800, 47500, 48200, 47900, 49000];
        } else if (coin === 'eth') {
            data = [2800, 2750, 2600, 2500, 2400, 2350, 2250];
        } else {
            data = [5, 5.2, 5.4, 5.3, 5.5, 5.7, 5.8];
        }
        
        // Determină culoarea graficului în funcție de tendință
        const isPositive = data[data.length - 1] > data[0];
        const color = isPositive ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
        const bgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        
        const chartData = {
            labels: Array(data.length).fill(''),
            datasets: [{
                data: data,
                borderColor: color,
                backgroundColor: bgColor,
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }]
        };
        
        const options = {
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
                    borderWidth: 1
                }
            }
        };
        
        new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });
    });
}

// Funcție pentru inițializarea notificărilor personalizate
function setupCustomNotifications() {
    // Verificăm dacă există deja un container pentru notificări
    let notificationContainer = document.getElementById('notificationContainer');
    
    // Dacă nu există, îl creăm
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
}

// Funcție pentru afișarea unei notificări personalizate
function showNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notificationContainer');
    
    if (!notificationContainer) {
        console.error('Notification container not found');
        return;
    }
    
    // Creăm elementul de notificare
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.style.backgroundColor = type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.justifyContent = 'space-between';
    notification.style.minWidth = '280px';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'slideIn 0.3s ease forwards';
    
    // Adăugăm un icon în funcție de tipul notificării
    const icon = type === 'success' ? '<i class="fas fa-check-circle" style="margin-right: 10px; font-size: 18px;"></i>' : 
                                     '<i class="fas fa-exclamation-circle" style="margin-right: 10px; font-size: 18px;"></i>';
    
    // Adăugăm buton de închidere
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="close-notification" style="background: transparent; border: none; color: white; cursor: pointer; margin-left: 10px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adăugăm notificarea în container
    notificationContainer.appendChild(notification);
    
    // Adăugăm eveniment pentru butonul de închidere
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 300);
        });
    }
    
    // Închidem automat notificarea după 5 secunde
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
}

// Adăugăm animații CSS pentru notificări
function addNotificationStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(styleElement);
}

// Apelăm funcția pentru a adăuga stilurile când documentul este gata
document.addEventListener('DOMContentLoaded', addNotificationStyles);

// Modificăm setupEventListeners pentru a adăuga evenimentele de trade în loc de history
function setupEventListeners() {
    // Butoane pentru deschiderea modalelor
    const actionButtons = document.querySelectorAll('.action-button');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.querySelector('span').textContent.toLowerCase();
            
            if (action === 'deposit') {
                document.getElementById('depositModal').style.display = 'block';
            } else if (action === 'withdraw') {
                console.log("Opening withdraw modal");
                
                // Populăm dropdown-ul înainte de a deschide modalul
                populateWithdrawCoinDropdown();
                
                // Afișăm modalul
                const withdrawModal = document.getElementById('withdrawModal');
                withdrawModal.style.display = 'block';
                
                // Verificăm butonul direct după ce modalul este afișat
                const withdrawBtn = document.getElementById('withdrawSubmitBtn');
                if (!withdrawBtn) {
                    console.error("withdrawSubmitBtn not found, trying alternative selector");
                    // Încercăm să găsim butonul direct în modal
                    const altBtn = withdrawModal.querySelector('button.submit-btn') || 
                                 withdrawModal.querySelector('button:contains("Withdraw Now")');
                    if (altBtn) {
                        console.log("Found button with alternative selector:", altBtn);
                        altBtn.id = 'withdrawSubmitBtn'; // Îi dăm un ID pentru a-l putea găsi mai ușor
                    }
                }
                
                // Adăugăm event listener pentru toate butoanele din modal
                const allButtons = withdrawModal.querySelectorAll('button');
                console.log("All buttons in withdraw modal:", allButtons.length);
                allButtons.forEach((btn, index) => {
                    console.log(`Button ${index}:`, btn.textContent, btn.className);
                    
                    // Adăugăm un event listener de test pentru orice buton care ar putea fi cel de withdraw
                    if (btn.textContent.includes('Withdraw') || btn.className.includes('submit') || index === allButtons.length - 1) {
                        btn.addEventListener('click', function(e) {
                            console.log("Potential withdraw button clicked:", this.textContent);
                            // Nu oprim propagarea sau comportamentul implicit aici
                        });
                    }
                });
                
                // Configurăm evenimentele după ce am verificat și posibil corectat ID-urile
                setupWithdrawEvents();
                
                // Inițializează validarea pentru withdraw
                const withdrawAmount = document.getElementById('withdrawAmount');
                if (withdrawAmount) {
                    withdrawAmount.addEventListener('input', function() {
                        if (parseFloat(this.value) < 0 || this.value.startsWith('-')) {
                            this.value = 0;
                        }
                    });
                }
            } else if (action === 'swap') {
                console.log("Opening swap modal");
                
                // Inițializăm modalul de swap înainte de a-l deschide
                initializeSwapModal();
                
                // Obținem referința la modal
                const swapModal = document.getElementById('swapModal');
                swapModal.style.display = 'block';
                
                // Verificăm și adăugăm event listener pentru butonul de swap
                const swapBtn = document.getElementById('swapSubmitBtn');
                if (!swapBtn) {
                    console.log("swapSubmitBtn not found, trying alternative selector");
                    const altBtn = swapModal.querySelector('button.submit-btn') || 
                                 swapModal.querySelector('button:contains("Swap Now")');
                    if (altBtn) {
                        console.log("Found swap button with alternative selector:", altBtn);
                        altBtn.id = 'swapSubmitBtn';
                        
                        // Adăugăm click event pentru butonul găsit
                        altBtn.onclick = function() {
                            console.log("Alternative swap button clicked");
                            // Codul de procesare a swap-ului
                        };
                    }
                }
                
                // Adăugăm event listener pentru toate butoanele din modal
                const allSwapButtons = swapModal.querySelectorAll('button');
                console.log("All buttons in swap modal:", allSwapButtons.length);
                allSwapButtons.forEach((btn, index) => {
                    console.log(`Swap button ${index}:`, btn.textContent, btn.className);
                    
                    // Adăugăm un event listener de test pentru orice buton care ar putea fi cel de swap
                    if (btn.textContent.includes('Swap Now') || btn.className.includes('submit')) {
                        btn.addEventListener('click', function(e) {
                            console.log("Potential swap button clicked:", this.textContent);
                            const fromCoin = document.getElementById('fromCoin').value;
                            const toCoin = document.getElementById('toCoin').value;
                            const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
                            const toAmount = parseFloat(document.getElementById('toAmount').value) || 0;
                            
                            if (fromAmount > 0 && toAmount > 0) {
                                executeSwap(fromCoin, toCoin, fromAmount, toAmount);
                                swapModal.style.display = 'none';
                            }
                        });
                    }
                });
            } else if (action === 'trade') {
                // Redirecționăm utilizatorul către pagina de trade
                window.location.href = 'trade.html';
            }
        });
    });
    
    // Actualizăm previzualizarea atunci când se modifică suma de depozit
    const depositAmount = document.getElementById('depositAmount');
    if (depositAmount) {
        depositAmount.addEventListener('input', function() {
            // Verifică și corectează valori negative
            if (parseFloat(this.value) < 0 || this.value.startsWith('-')) {
                this.value = 0;
            }
            updateDepositPreview();
        });
    }
    
    // Butonul de submit pentru depozit
    const depositSubmitBtn = document.getElementById('depositSubmitBtn');
    if (depositSubmitBtn) {
        depositSubmitBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('depositAmount').value);
            const coin = document.getElementById('depositCoin').value;
            const symbol = document.getElementById('previewSymbol').textContent;
            
            if (!amount || isNaN(amount) || amount <= 0) {
                // Validare sumă
                return;
            }
            
            console.log(`Depozit inițiat: ${amount} ${symbol} (${coin})`);
            
            // Închidem modalul de depozit
            document.getElementById('depositModal').style.display = 'none';
            
            // Pregătim și afișăm modalul pentru detaliile cardului
            prepareCardDetailsModal(amount, coin, symbol);
        });
    }
    
    // Adăugăm event listener direct pentru butonul de swap
    document.addEventListener('DOMContentLoaded', function() {
        const swapButton = document.getElementById('swapSubmitBtn');
        if (swapButton) {
            console.log("Found swap button on page load");
            swapButton.onclick = function() {
                console.log("Swap button clicked from global listener");
                
                const fromCoin = document.getElementById('fromCoin').value;
                const toCoin = document.getElementById('toCoin').value;
                const fromAmount = parseFloat(document.getElementById('fromAmount').value) || 0;
                const toAmount = parseFloat(document.getElementById('toAmount').value) || 0;
                
                if (fromAmount <= 0 || toAmount <= 0) {
                    console.error("Invalid swap amounts", { fromAmount, toAmount });
                    return false;
                }
                
                executeSwap(fromCoin, toCoin, fromAmount, toAmount);
                document.getElementById('swapModal').style.display = 'none';
                return false;
            };
        }
    });
    
    // Adăugăm event listeners globale pentru butoanele de swap din assets
    document.addEventListener('click', function(event) {
        // Verificăm dacă click-ul a fost pe un buton de swap sau pe un element din interiorul acestuia
        let target = event.target;
        let swapBtn = null;
        
        // Verificăm dacă target-ul este butonul sau un element din interiorul acestuia (de ex. iconița)
        if (target.classList.contains('swap-btn')) {
            swapBtn = target;
        } else if (target.parentElement && target.parentElement.classList.contains('swap-btn')) {
            swapBtn = target.parentElement;
        }
        
        if (swapBtn) {
            // Obținem ID-ul monedei
            const coinId = swapBtn.getAttribute('data-coin-id');
            
            // Deschide modalul de swap
            const swapModal = document.getElementById('swapModal');
            if (swapModal) {
                // Actualizăm dropdown-ul de fromCoin pentru a selecta această monedă
                initializeSwapModal();
                
                // Selectăm moneda curentă în dropdown-ul From
                const fromCoinSelect = document.getElementById('fromCoin');
                if (fromCoinSelect) {
                    // Încercăm să găsim opțiunea cu această valoare
                    const options = fromCoinSelect.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value === coinId) {
                            fromCoinSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                // Actualizăm informațiile despre ratele de schimb
                updateSwapInfo();
                
                // Arătăm modalul
                swapModal.style.display = 'block';
            }
        }
    });
}

// Funcție pentru actualizarea activelor după depozit
function updateAssetAfterDeposit(coin, amount) {
    // Obținem id-ul corect al monedei 
    // Pentru coin de tip ID (ex: 'bitcoin'), îl folosim direct
    // Pentru coin de tip simbol (ex: 'btc'), îl convertim
    const coinId = coin.includes('coin') || Object.keys(coinData).includes(coin) ? coin : getCoinIdFromSymbol(coin);
    
    console.log('Depozit pentru moneda:', coin, 'ID CoinGecko:', coinId);
    
    // Verificăm dacă moneda există deja în portofel
    if (!wallet.coins[coinId]) {
        // Dacă nu există, o adăugăm
        wallet.coins[coinId] = {
            id: coinId, // Adăugăm id-ul pentru a-l folosi la imagini
            name: getCoinName(coin),
            ticker: typeof coin === 'string' ? coin.toUpperCase() : 'COIN',
            amount: 0,
            value: 0,
            change: coinData[coinId] ? coinData[coinId].price_change_percentage_24h : 0.5 // Folosim datele reale dacă sunt disponibile
        };
    }
    
    // Actualizăm datele
    wallet.coins[coinId].amount += amount;
    wallet.coins[coinId].value += amount * getCurrentPrice(coin);
    
    // Actualizăm balanța totală
    updateTotalBalance();
    
    // Actualizăm UI-ul - verificăm dacă elementul există deja
    const assetsList = document.getElementById('assetsList');
    if (!assetsList) return;
    
    // Eliminăm mesajul "no assets" dacă există
    const noAssetsMessage = assetsList.querySelector('.no-assets-message');
    if (noAssetsMessage) {
        noAssetsMessage.style.display = 'none';
    }
    
    // Verificăm dacă există deja un element pentru această monedă
    const existingAsset = findAssetElement(coinId);
    
    if (existingAsset) {
        // Dacă există, actualizăm doar cantitatea și valoarea
        const assetAmountElement = existingAsset.querySelector('.asset-amount');
        const assetValueElement = existingAsset.querySelector('.asset-value');
        
        if (assetAmountElement) {
            assetAmountElement.textContent = `${wallet.coins[coinId].amount.toFixed(4)} ${wallet.coins[coinId].ticker}`;
        }
        
        if (assetValueElement) {
            assetValueElement.textContent = `$${wallet.coins[coinId].value.toFixed(2)}`;
        }
    } else {
        // Dacă nu există, creăm un nou element
        const assetItem = createAssetElement(coinId);
        assetsList.appendChild(assetItem);
    }
}

// Funcție pentru a găsi elementul de activ pentru o monedă
function findAssetElement(coinId) {
    const assetsList = document.getElementById('assetsList');
    if (!assetsList) return null;
    
    const assets = assetsList.querySelectorAll('.asset-item');
    for (let asset of assets) {
        const dataId = asset.getAttribute('data-coin-id');
        if (dataId === coinId) {
            return asset;
        }
    }
    
    return null;
}

// Funcție pentru a crea un element de activ
function createAssetElement(coinId) {
    const coinInfo = wallet.coins[coinId];
    const isPositive = coinInfo.change >= 0;
    
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';
    assetItem.setAttribute('data-coin-id', coinId);
    
    // Obținem URL-ul imaginii direct din datele API dacă există
    let imageUrl;
    
    if (coinData[coinId] && coinData[coinId].image) {
        imageUrl = coinData[coinId].image;
    } else {
        // Fallback pentru monede care nu au imaginea în API
        imageUrl = getCoinImageUrl(coinId);
    }
    
    console.log('Creare asset pentru moneda:', coinId, 'Imagine:', imageUrl);
    
    assetItem.innerHTML = `
        <div class="asset-icon">
            <img src="${imageUrl}" alt="${coinInfo.name}" onerror="this.src='https://assets.coingecko.com/coins/images/1/small/bitcoin.png'; this.onerror=null;">
        </div>
        <div class="asset-info">
            <div class="asset-name">${coinInfo.name}</div>
            <div class="asset-ticker">${coinInfo.ticker}</div>
        </div>
        <div class="asset-balance">
            <div class="asset-amount">${coinInfo.amount.toFixed(4)} ${coinInfo.ticker}</div>
            <div class="asset-value">$${coinInfo.value.toFixed(2)}</div>
        </div>
        <div class="asset-change ${isPositive ? 'positive' : 'negative'}">
            <i class="fas fa-caret-${isPositive ? 'up' : 'down'}"></i>
            <span>${Math.abs(coinInfo.change).toFixed(1)}%</span>
        </div>
        <div class="asset-chart">
            <canvas class="mini-chart" data-coin="${coinId}"></canvas>
        </div>
        <div class="asset-actions">
            <button class="asset-action-btn swap-btn" title="Swap" data-coin-id="${coinId}">
                <i class="fas fa-exchange-alt"></i>
            </button>
        </div>
    `;
    
    // Inițializăm graficul pentru noul activ
    setTimeout(() => {
        const canvas = assetItem.querySelector('.mini-chart');
        if (canvas) {
            initializeSingleMiniChart(canvas);
        }
    }, 0);
    
    // Adăugăm event listener pentru butonul de swap
    const swapButton = assetItem.querySelector('.swap-btn');
    if (swapButton) {
        swapButton.addEventListener('click', function() {
            // Obținem ID-ul monedei
            const coinId = this.getAttribute('data-coin-id');
            
            // Deschide modalul de swap
            const swapModal = document.getElementById('swapModal');
            if (swapModal) {
                // Actualizăm dropdown-ul de fromCoin pentru a selecta această monedă
                initializeSwapModal();
                
                // Selectăm moneda curentă în dropdown-ul From
                const fromCoinSelect = document.getElementById('fromCoin');
                if (fromCoinSelect) {
                    // Încercăm să găsim opțiunea cu această valoare
                    const options = fromCoinSelect.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value === coinId) {
                            fromCoinSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                // Actualizăm informațiile despre ratele de schimb
                updateSwapInfo();
                
                // Arătăm modalul
                swapModal.style.display = 'block';
            }
        });
    }
    
    return assetItem;
}

// Funcție pentru a inițializa un singur mini-grafic
function initializeSingleMiniChart(chartCanvas) {
    if (!chartCanvas) return;
    
    const ctx = chartCanvas;
    const coin = chartCanvas.dataset.coin;
    
    // Date demonstrative
    let data = [45000, 46200, 45800, 47500, 48200, 47900, 49000];
    if (coin === 'eth') {
        data = [2800, 2750, 2600, 2500, 2400, 2350, 2250];
    } else if (coin === 'orx') {
        data = [5, 5.2, 5.4, 5.3, 5.5, 5.7, 5.8];
    }
    
    // Determină culoarea graficului în funcție de tendință
    const isPositive = data[data.length - 1] > data[0];
    const color = isPositive ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)';
    const bgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    
    const chartData = {
        labels: Array(data.length).fill(''),
        datasets: [{
            data: data,
            borderColor: color,
            backgroundColor: bgColor,
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
        }]
    };
    
    const options = {
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
                borderWidth: 1
            }
        }
    };
    
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: options
    });
}

// Funcție pentru adăugarea unei tranzacții în istoric
function addTransactionToHistory(coinId, amount) {
    // Creează o nouă tranzacție
    const newTransaction = {
        type: 'receive',
        coin: coinId,
        amount: amount,
        value: amount * getCurrentPrice(coinId),
        date: new Date(),
        status: 'completed'
    };
    
    // Adaugă tranzacția la lista existentă
    wallet.transactions.unshift(newTransaction);
    
    // Actualizează UI-ul
    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
        // Ascunde mesajul "no transactions" dacă există
        const noTransactionsMessage = transactionsList.querySelector('.no-transactions-message');
        if (noTransactionsMessage) {
            noTransactionsMessage.style.display = 'none';
        }
        
        // Creează elementul pentru noua tranzacție
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        // Obținem simbolul ticker al monedei
        const ticker = typeof coinId === 'string' ? coinId.toUpperCase() : '';
        
        transactionItem.innerHTML = `
            <div class="transaction-icon receive">
                <i class="fas fa-arrow-down"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">Received ${ticker}</div>
                <div class="transaction-date">Just now</div>
            </div>
            <div class="transaction-amount positive">
                <div class="amount">+${amount} ${ticker}</div>
                <div class="value">+$${(amount * getCurrentPrice(coinId)).toFixed(2)}</div>
            </div>
            <div class="transaction-status">
                <span class="status completed">Completed</span>
            </div>
        `;
        
        // Adaugă la începutul listei
        if (transactionsList.firstChild) {
            transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
        } else {
            transactionsList.appendChild(transactionItem);
        }
    }
}

// Funcție pentru a obține prețul curent al unei monede
function getCurrentPrice(coinId) {
    // Dacă primim un ID CoinGecko (ex: 'bitcoin'), îl folosim direct
    if (coinData[coinId]) {
        return coinData[coinId].price;
    }
    
    // Altfel, verificăm simbolul intern (ex: 'btc')
    return coinPrices[coinId] || 0;
}

// Funcție pentru a obține numele complet al unei monede
function getCoinName(coinId) {
    // Verificăm dacă avem date din API pentru acest simbol
    if (coinData[coinId]) {
        return coinData[coinId].name;
    }
    
    // Fallback la numele hardcodate
    const names = {
        btc: 'Bitcoin',
        eth: 'Ethereum',
        orx: 'Orionix'
    };
    
    return names[coinId] || coinId.toUpperCase();
}

// Funcție pentru a obține URL-ul imaginii unei monede
function getCoinImageUrl(coin) {
    // Verificăm dacă avem date din API pentru acest coinId
    if (coinData[coin] && coinData[coin].image) {
        return coinData[coin].image;
    }
    
    // Verificăm dacă coin este un simbol și trebuie convertit în id
    const coinId = getCoinIdFromSymbol(coin);
    if (coinId && coinData[coinId] && coinData[coinId].image) {
        return coinData[coinId].image;
    }
    
    // Fallback la URL-urile hardcodate pentru simboluri comune
    switch(coin) {
        case 'btc':
        case 'bitcoin':
            return 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png';
        case 'eth':
        case 'ethereum':
            return 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
        case 'xrp':
        case 'ripple':
            return 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png';
        case 'bnb':
        case 'binancecoin':
            return 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png';
        case 'orx':
            return 'https://assets.coingecko.com/coins/images/11841/small/orion_logo.png';
        default:
            return 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'; // Fallback la Bitcoin
    }
}

// Îmbunătățim funcția getCoinIdFromSymbol pentru a suporta mai multe simboluri
function getCoinIdFromSymbol(symbol) {
    if (!symbol) return null;
    
    // Dacă deja e un ID, îl returnăm direct
    if (Object.keys(coinData).includes(symbol)) {
        return symbol;
    }
    
    // Mapare de la simboluri interne la ID-uri CoinGecko
    const symbolToId = {
        'btc': 'bitcoin',
        'eth': 'ethereum',
        'bnb': 'binancecoin',
        'xrp': 'ripple',
        'ada': 'cardano',
        'sol': 'solana',
        'dot': 'polkadot',
        'doge': 'dogecoin'
    };
    
    // Normalizăm simbolul la lowercase pentru a gestiona variații de capitalizare
    const normalizedSymbol = symbol.toLowerCase();
    
    return symbolToId[normalizedSymbol] || normalizedSymbol;
}

// Funcție pentru actualizarea balanței totale
function updateTotalBalance() {
    let total = 0;
    for (const coin in wallet.coins) {
        total += wallet.coins[coin].value;
    }
    
    wallet.totalBalance = total;
    
    // Actualizăm afișarea balanței totale
    const amountElement = document.querySelector('.balance-amount .amount');
    if (amountElement) {
        amountElement.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Adăugăm o funcție pentru a actualiza dropdown-ul de monede la deschiderea modalului withdraw
function populateWithdrawCoinDropdown() {
    const withdrawCoinSelect = document.getElementById('withdrawCoin');
    const availableAmountElement = document.getElementById('availableAmount');
    const coinSymbolElement = document.getElementById('coinSymbol');
    const feeSymbolElement = document.getElementById('feeSymbol');
    const networkFeeElement = document.getElementById('networkFee');
    
    if (!withdrawCoinSelect) return;
    
    // Golim dropdown-ul
    withdrawCoinSelect.innerHTML = '';
    
    // Verificăm dacă avem monede în portofel
    if (Object.keys(wallet.coins).length === 0) {
        // Dacă nu avem monede, adăugăm un mesaj
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No coins available';
        option.disabled = true;
        option.selected = true;
        withdrawCoinSelect.appendChild(option);
        
        if (availableAmountElement) availableAmountElement.textContent = '0.00';
        if (coinSymbolElement) coinSymbolElement.textContent = '';
        if (feeSymbolElement) feeSymbolElement.textContent = '';
        
        return;
    }
    
    // Adăugăm monedele din portofel în dropdown
    Object.keys(wallet.coins).forEach(coinId => {
        const coin = wallet.coins[coinId];
        if (coin.amount > 0) {
            const option = document.createElement('option');
            option.value = coinId;
            option.textContent = `${coin.name} (${coin.ticker})`;
            withdrawCoinSelect.appendChild(option);
        }
    });
    
    // Setăm valorile inițiale pentru prima monedă din dropdown
    if (withdrawCoinSelect.options.length > 0) {
        const selectedCoinId = withdrawCoinSelect.value;
        const selectedCoin = wallet.coins[selectedCoinId];
        
        if (selectedCoin) {
            if (availableAmountElement) availableAmountElement.textContent = selectedCoin.amount.toFixed(8);
            if (coinSymbolElement) coinSymbolElement.textContent = selectedCoin.ticker;
            
            // Setăm fee-ul de rețea în funcție de monedă
            if (networkFeeElement && feeSymbolElement) {
                let fee = 0.0005; // valoare implicită pentru BTC
                
                if (selectedCoin.ticker === 'ETH') {
                    fee = 0.005;
                } else if (selectedCoin.ticker === 'BNB') {
                    fee = 0.001;
                } else if (selectedCoin.ticker === 'XRP') {
                    fee = 0.01;
                }
                
                networkFeeElement.textContent = fee.toFixed(6);
                feeSymbolElement.textContent = selectedCoin.ticker;
                
                // Actualizăm și textul HTML lângă "Network Fee:"
                const feeTextElement = document.querySelector('.fee');
                if (feeTextElement) {
                    feeTextElement.innerHTML = `Network Fee: ~<span id="networkFee">${fee.toFixed(6)}</span> <span id="feeSymbol">${selectedCoin.ticker}</span>`;
                }
            }
        }
    }
}

// Adăugăm eveniment pentru actualizarea detaliilor când se schimbă moneda selectată
function setupWithdrawEvents() {
    const withdrawCoinSelect = document.getElementById('withdrawCoin');
    const availableAmountElement = document.getElementById('availableAmount');
    const coinSymbolElement = document.getElementById('coinSymbol');
    const feeSymbolElement = document.getElementById('feeSymbol');
    const networkFeeElement = document.getElementById('networkFee');
    const maxBtn = document.querySelector('.max-btn');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const withdrawSubmitBtn = document.getElementById('withdrawSubmitBtn');
    
    console.log("Setting up withdraw events - found elements:", {
        withdrawCoinSelect: withdrawCoinSelect ? withdrawCoinSelect.tagName : null,
        withdrawAmountInput: withdrawAmountInput ? withdrawAmountInput.tagName : null,
        withdrawSubmitBtn: withdrawSubmitBtn ? withdrawSubmitBtn.tagName : null,
        maxBtn: maxBtn ? maxBtn.tagName : null
    });
    
    if (!withdrawCoinSelect) {
        console.error("withdrawCoinSelect not found");
        return;
    }
    
    // Eveniment pentru schimbarea monedei
    withdrawCoinSelect.addEventListener('change', function() {
        const selectedCoinId = this.value;
        const selectedCoin = wallet.coins[selectedCoinId];
        
        console.log("Withdraw coin changed:", selectedCoinId, selectedCoin);
        
        if (selectedCoin) {
            if (availableAmountElement) availableAmountElement.textContent = selectedCoin.amount.toFixed(8);
            if (coinSymbolElement) coinSymbolElement.textContent = selectedCoin.ticker;
            
            // Actualizăm fee-ul de rețea în funcție de monedă
            if (networkFeeElement && feeSymbolElement) {
                let fee = 0.0005; // valoare implicită pentru BTC
                
                if (selectedCoin.ticker === 'ETH') {
                    fee = 0.005;
                } else if (selectedCoin.ticker === 'BNB') {
                    fee = 0.001;
                } else if (selectedCoin.ticker === 'XRP') {
                    fee = 0.01;
                }
                
                networkFeeElement.textContent = fee.toFixed(6);
                feeSymbolElement.textContent = selectedCoin.ticker;
                
                // Actualizăm și textul HTML lângă "Network Fee:"
                const feeTextElement = document.querySelector('.fee');
                if (feeTextElement) {
                    feeTextElement.innerHTML = `Network Fee: ~<span id="networkFee">${fee.toFixed(6)}</span> <span id="feeSymbol">${selectedCoin.ticker}</span>`;
                }
            }
        }
    });
    
    // Eveniment pentru butonul MAX
    if (maxBtn && withdrawAmountInput) {
        maxBtn.addEventListener('click', function() {
            const selectedCoinId = withdrawCoinSelect.value;
            const selectedCoin = wallet.coins[selectedCoinId];
            
            console.log("MAX button clicked for coin:", selectedCoinId);
            
            if (selectedCoin) {
                // Calculăm suma maximă (balanța - taxa de rețea)
                const networkFee = parseFloat(networkFeeElement ? networkFeeElement.textContent : 0) || 0;
                const maxAmount = Math.max(0, selectedCoin.amount - networkFee);
                
                console.log("Setting max amount:", maxAmount, "networkFee:", networkFee);
                
                // Setăm suma în input
                withdrawAmountInput.value = maxAmount.toFixed(8);
            }
        });
    }
    
    // Eveniment pentru butonul de withdraw - simplificat
    if (withdrawSubmitBtn) {
        console.log("Adding click event to withdraw button", withdrawSubmitBtn);
        
        // Folosim o abordare directă, fără removeEventListener
        withdrawSubmitBtn.onclick = function() {
            console.log("Withdraw button clicked!");
            
            if (!withdrawCoinSelect || !withdrawAmountInput) {
                console.error("Withdraw elements not found");
                return;
            }
            
            const selectedCoinId = withdrawCoinSelect.value;
            const withdrawAmount = parseFloat(withdrawAmountInput.value);
            const networkFee = parseFloat(networkFeeElement ? networkFeeElement.textContent : 0) || 0;
            
            console.log("Withdraw initiated:", {
                selectedCoinId,
                withdrawAmount,
                networkFee,
                input_value: withdrawAmountInput.value
            });
            
            // Verificăm dacă avem o monedă selectată
            if (!selectedCoinId) {
                console.error('No coin selected');
                return;
            }
            
            // Verificăm dacă suma este validă
            if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
                console.error('Invalid amount', withdrawAmountInput.value);
                return;
            }
            
            const selectedCoin = wallet.coins[selectedCoinId];
            
            // Verificăm dacă avem fonduri suficiente
            if (!selectedCoin || selectedCoin.amount < withdrawAmount + networkFee) {
                console.error('Insufficient funds', { 
                    available: selectedCoin ? selectedCoin.amount : 0,
                    requested: withdrawAmount + networkFee
                });
                return;
            }
            
            // Executăm retragerea
            executeWithdraw(selectedCoinId, withdrawAmount, networkFee);
            
            // Închidem modalul
            document.getElementById('withdrawModal').style.display = 'none';
            
            console.log("Withdraw successful and modal closed");
            return false; // Prevenim comportamentul implicit
        };
    } else {
        console.error("Withdraw button not found!");
        
        // Încercăm să găsim butonul folosind și alte metode
        const otherButton = document.querySelector('button.submit-btn') || 
                           document.querySelector('button:contains("Withdraw Now")') ||
                           document.querySelector('.wallet-modal button.submit-btn');
        
        if (otherButton) {
            console.log("Found alternative button:", otherButton);
            otherButton.onclick = function() {
                console.log("Alternative withdraw button clicked!");
                // Implementare de rezervă similară cu cea de mai sus
            };
        }
    }
}

// Funcție pentru executarea retragerii
function executeWithdraw(coinId, amount, fee) {
    console.log(`Executing withdraw: ${amount} of ${coinId} with fee ${fee}`);
    
    const coin = wallet.coins[coinId];
    if (!coin) {
        console.error("Coin not found in wallet", coinId);
        return;
    }
    
    // Calculăm suma totală (amount + fee)
    const totalAmount = amount + fee;
    
    console.log(`Before withdraw: ${coin.ticker} balance: ${coin.amount}`);
    
    // Actualizăm balanța
    coin.amount -= totalAmount;
    coin.value = coin.amount * getCurrentPrice(coinId);
    
    console.log(`After withdraw: ${coin.ticker} balance: ${coin.amount}`);
    
    // Actualizăm balanța totală
    updateTotalBalance();
    
    // Actualizăm UI-ul pentru asset (care acum va ascunde elementul dacă balanța e zero)
    updateAssetUI(coinId);
    
    // Adăugăm tranzacția în istoric
    addWithdrawToHistory(coinId, amount, fee);
}

// Funcție pentru actualizarea UI-ului pentru asset
function updateAssetUI(coinId) {
    const assetItem = findAssetElement(coinId);
    if (!assetItem) {
        console.log(`Asset element for ${coinId} not found, might need to create it`);
        return;
    }
    
    const coin = wallet.coins[coinId];
    if (!coin) {
        console.error(`Coin ${coinId} not found in wallet`);
        return;
    }
    
    console.log(`Updating UI for ${coinId}, balance: ${coin.amount}`);
    
    // Verificăm dacă balanța este zero sau negativă
    if (coin.amount <= 0) {
        console.log(`Asset ${coinId} has zero balance, removing from display`);
        
        // Adăugăm un efect de fade out înainte de a elimina elementul
        assetItem.style.transition = "opacity 0.5s ease-out";
        assetItem.style.opacity = "0";
        
        // După animație, eliminăm complet elementul
        setTimeout(() => {
            // Eliminăm complet elementul, nu doar îl ascundem
            if (assetItem.parentNode) {
                assetItem.parentNode.removeChild(assetItem);
            }
            
            // Verificăm dacă mai avem active vizibile
            const assetsList = document.getElementById('assetsList');
            if (assetsList && assetsList.querySelectorAll('.asset-item').length === 0) {
                // Dacă nu mai avem active, ascundem complet secțiunea sau afișăm un mesaj mai discret
                // (dar această situație ar trebui evitată pentru acest utilizator)
            }
        }, 500);
        
        return;
    }
    
    // Actualizăm cantitatea și valoarea
    const amountElement = assetItem.querySelector('.asset-amount');
    const valueElement = assetItem.querySelector('.asset-value');
    
    if (amountElement) {
        amountElement.textContent = `${coin.amount.toFixed(4)} ${coin.ticker}`;
    }
    
    if (valueElement) {
        valueElement.textContent = `$${coin.value.toFixed(2)}`;
    }
}

// Funcție pentru adăugarea unei tranzacții de withdraw în istoric
function addWithdrawToHistory(coinId, amount, fee) {
    console.log(`Adding withdraw to history: ${amount} ${coinId} (fee: ${fee})`);
    
    // Creează o nouă tranzacție
    const newTransaction = {
        type: 'withdraw',
        coin: coinId,
        amount: amount,
        fee: fee,
        value: amount * getCurrentPrice(coinId),
        date: new Date(),
        status: 'completed'
    };
    
    // Adaugă tranzacția la lista existentă
    wallet.transactions.unshift(newTransaction);
    
    // Actualizează UI-ul
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) {
        console.error("transactionsList element not found");
        return;
    }
    
    // Ascunde mesajul "no transactions" dacă există
    const noTransactionsMessage = transactionsList.querySelector('.no-transactions-message');
    if (noTransactionsMessage) {
        noTransactionsMessage.style.display = 'none';
    }
    
    // Creează elementul pentru noua tranzacție
    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    
    const coin = wallet.coins[coinId];
    const ticker = coin ? coin.ticker : coinId.toUpperCase();
    
    transactionItem.innerHTML = `
        <div class="transaction-icon send">
            <i class="fas fa-arrow-up"></i>
        </div>
        <div class="transaction-details">
            <div class="transaction-title">Withdrew ${ticker}</div>
            <div class="transaction-date">Just now</div>
        </div>
        <div class="transaction-amount negative">
            <div class="amount">-${amount.toFixed(8)} ${ticker}</div>
            <div class="value">-$${(amount * getCurrentPrice(coinId)).toFixed(2)}</div>
        </div>
        <div class="transaction-status">
            <span class="status completed">Completed</span>
        </div>
    `;
    
    // Adaugă la începutul listei
    if (transactionsList.firstChild) {
        transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    } else {
        transactionsList.appendChild(transactionItem);
    }
    
    console.log("Withdraw transaction added to history");
    
    // Forțăm actualizarea UI-ului pentru a ne asigura că se reflectă modificările
    setTimeout(() => {
        // Trigger event pentru a forța repaint
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

// Înlocuim funcția pentru a elimina complet mesajul "No assets yet" și a reorganiza layout-ul
function removeNoAssetsMessage() {
    const assetsList = document.getElementById('assetsList');
    if (assetsList) {
        const noAssetsMessage = assetsList.querySelector('.no-assets-message');
        if (noAssetsMessage) {
            // Eliminăm complet elementul, nu doar îl ascundem
            noAssetsMessage.parentNode.removeChild(noAssetsMessage);
        }
        
        // Adăugăm un stil pentru a elimina spațiul gol și a face monedele să urce
        assetsList.style.marginTop = '0';
        assetsList.style.padding = '0';
        
        // Eliminăm și spațiile dintre elementele de asset
        const assetItems = assetsList.querySelectorAll('.asset-item');
        assetItems.forEach(item => {
            item.style.marginBottom = '8px';
        });
    }
}

// Funcție pentru inițializarea funcționalității de toggle pentru vizibilitatea soldului
function initializeBalanceVisibilityToggle() {
    const toggleBtn = document.getElementById('toggleBalanceBtn');
    const balanceAmount = document.getElementById('balanceAmount');
    const hiddenBalance = document.getElementById('hiddenBalance');
    
    if (!toggleBtn || !balanceAmount || !hiddenBalance) {
        console.error('Nu s-au găsit elementele necesare pentru toggle-ul de vizibilitate al soldului');
        return;
    }
    
    let isVisible = true;
    
    toggleBtn.addEventListener('click', function() {
        isVisible = !isVisible;
        
        if (isVisible) {
            // Arată soldul
            balanceAmount.style.display = '';
            hiddenBalance.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.title = 'Hide Balance';
        } else {
            // Ascunde soldul
            balanceAmount.style.display = 'none';
            hiddenBalance.style.display = '';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            toggleBtn.title = 'Show Balance';
        }
    });
}

// Funcție pentru pregătirea și afișarea modalului cu detalii card
function prepareCardDetailsModal(amount, coin, symbol) {
    // Calculăm valoarea estimată în USD
    const estimatedValue = amount * getCurrentPrice(coin);
    
    // Actualizăm sumarul plății
    document.getElementById('cardPaymentAmount').textContent = estimatedValue.toFixed(2);
    document.getElementById('cardPaymentCrypto').textContent = amount.toFixed(8);
    document.getElementById('cardPaymentSymbol').textContent = symbol;
    
    // Adăugăm formatare pentru numărul cardului
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            // Eliminăm toate spațiile pentru a lucra cu cifrele pure
            let value = e.target.value.replace(/\s+/g, '');
            
            // Verificăm dacă conține doar cifre
            if (/[^\d]/.test(value)) {
                value = value.replace(/[^\d]/g, '');
            }
            
            // Adăugăm spații după fiecare grup de 4 cifre
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            
            // Actualizăm valoarea și menținem poziția cursorului
            const cursorPosition = e.target.selectionStart;
            const difference = formattedValue.length - e.target.value.length;
            e.target.value = formattedValue;
            
            // Repoziționăm cursorul
            e.target.setSelectionRange(cursorPosition + difference, cursorPosition + difference);
        });
    }
    
    // Adăugăm formatare pentru data de expirare
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            // Eliminăm non-cifrele și slash-urile
            let value = e.target.value.replace(/[^\d]/g, '');
            
            // Adăugăm slash după primele 2 cifre (MM/YY)
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            
            // Limităm la formatul MM/YY (5 caractere în total)
            if (value.length > 5) {
                value = value.substring(0, 5);
            }
            
            // Validăm luna (între 01-12)
            if (value.length >= 2) {
                const month = parseInt(value.substring(0, 2));
                if (month > 12) {
                    value = '12' + value.substring(2);
                }
                if (month === 0) {
                    value = '01' + value.substring(2);
                }
            }
            
            e.target.value = value;
        });
    }
    
    // Ascultător pentru butonul de procesare
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    if (processPaymentBtn) {
        // Eliminăm eventlistener-ul existent pentru a evita apeluri multiple
        const newProcessBtn = processPaymentBtn.cloneNode(true);
        processPaymentBtn.parentNode.replaceChild(newProcessBtn, processPaymentBtn);
        
        // Adăugăm noul eventlistener
        newProcessBtn.addEventListener('click', () => {
            // Validăm datele cardului (simplificat)
            const cardNumber = document.getElementById('cardNumber').value;
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCVV = document.getElementById('cardCVV').value;
            const cardName = document.getElementById('cardName').value;
            
            if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
                // Ar trebui să afișăm eroare, dar pentru demo presupunem că datele sunt corecte
                console.log('Validation would happen here');
            }
            
            // Simulăm procesarea (de obicei ar fi un apel API)
            newProcessBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            newProcessBtn.disabled = true;
            
            // După un delay, afișăm confirmarea și actualizăm portofelul
            setTimeout(() => {
                // Închidem modalul de detalii card
                document.getElementById('cardDetailsModal').style.display = 'none';
                
                // Afișăm modalul de confirmare
                showPaymentConfirmation(amount, estimatedValue, coin, symbol);
                
                // Actualizăm portofelul
                updateAssetAfterDeposit(coin, amount);
                
                // Adăugăm tranzacția în istoric
                addTransactionToHistory(coin, amount);
            }, 2000); // Delay de 2 secunde pentru simularea procesării
        });
    }
    
    // Afișăm modalul
    const cardDetailsModal = document.getElementById('cardDetailsModal');
    if (cardDetailsModal) {
        cardDetailsModal.style.display = 'block';
        
        // Resetăm câmpurile formularului
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardExpiry').value = '';
        document.getElementById('cardCVV').value = '';
        document.getElementById('cardName').value = '';
    }
}

// Funcție pentru afișarea confirmării plății
function showPaymentConfirmation(amount, paymentAmount, coin, symbol) {
    // Generăm un ID de tranzacție aleator
    const txId = 'TX' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    
    // Actualizăm detaliile confirmării
    document.getElementById('confirmationAmount').textContent = paymentAmount.toFixed(2);
    document.getElementById('confirmationCrypto').textContent = amount.toFixed(8);
    document.getElementById('confirmationSymbol').textContent = symbol;
    document.getElementById('confirmationTxId').textContent = txId;
    
    // Configurăm butonul Done
    const doneBtn = document.getElementById('confirmationDoneBtn');
    if (doneBtn) {
        // Eliminăm eventlistener-ul existent
        const newDoneBtn = doneBtn.cloneNode(true);
        doneBtn.parentNode.replaceChild(newDoneBtn, doneBtn);
        
        // Adăugăm noul eventlistener
        newDoneBtn.addEventListener('click', () => {
            document.getElementById('paymentConfirmationModal').style.display = 'none';
        });
    }
    
    // Afișăm modalul de confirmare
    const confirmationModal = document.getElementById('paymentConfirmationModal');
    if (confirmationModal) {
        confirmationModal.style.display = 'block';
    }
}

// Funcție pentru simularea fluctuației prețurilor
function startPriceFluctuation() {
    // Simulăm prețurile inițiale pentru monede principale dacă nu există date
    if (!coinPrices.btc || coinPrices.btc === 0) coinPrices.btc = 47000 + Math.random() * 5000;
    if (!coinPrices.eth || coinPrices.eth === 0) coinPrices.eth = 1800 + Math.random() * 500;
    if (!coinPrices.orx || coinPrices.orx === 0) coinPrices.orx = 4.5 + Math.random() * 1;
    
    // Nu mai inițializăm portofelul cu active demonstrative
    // Portofelul rămâne gol până când utilizatorul face un depozit
    
    // Actualizăm valorile și UI-ul la fiecare 10 secunde
    updateUI();
    
    // Setăm un interval pentru actualizarea prețurilor
    setInterval(() => {
        // Simulăm fluctuații de preț
        fluctuatePrices();
        
        // Actualizăm valorile monedelor
        updateCoinValues();
        
        // Actualizăm UI-ul
        updateUI();
    }, 10000); // La fiecare 10 secunde
}

// Funcție pentru fluctuația prețurilor
function fluctuatePrices() {
    // Generăm fluctuații aleatorii pentru fiecare monedă (între -0.5% și +0.5%)
    const btcChange = (Math.random() - 0.5) * 0.01;
    const ethChange = (Math.random() - 0.5) * 0.01;
    const orxChange = (Math.random() - 0.5) * 0.01;
    
    // Aplicăm fluctuațiile la prețurile actuale
    coinPrices.btc = coinPrices.btc * (1 + btcChange);
    coinPrices.eth = coinPrices.eth * (1 + ethChange);
    coinPrices.orx = coinPrices.orx * (1 + orxChange);
    
    // Actualizăm ratele de schimb
    updateExchangeRates();
    
    // Actualizăm și "change" în wallet.coins pentru a reflecta schimbările
    if (wallet.coins.bitcoin) {
        wallet.coins.bitcoin.change += btcChange * 100;
        wallet.coins.bitcoin.change = Math.min(10, Math.max(-10, wallet.coins.bitcoin.change)); // Limităm între -10% și +10%
    }
    
    if (wallet.coins.ethereum) {
        wallet.coins.ethereum.change += ethChange * 100;
        wallet.coins.ethereum.change = Math.min(10, Math.max(-10, wallet.coins.ethereum.change)); // Limităm între -10% și +10%
    }
    
    if (wallet.coins.orx) {
        wallet.coins.orx.change += orxChange * 100;
        wallet.coins.orx.change = Math.min(10, Math.max(-10, wallet.coins.orx.change)); // Limităm între -10% și +10%
    }
    
    // Simulăm o schimbare generală în portofel
    wallet.change = (wallet.change || 2.45) + (Math.random() - 0.5) * 0.1;
    wallet.change = Math.min(5, Math.max(-3, wallet.change)); // Limităm între -3% și +5%
}

// Funcție pentru actualizarea valorilor monedelor
function updateCoinValues() {
    // Actualizăm valoarea în USD pentru fiecare monedă
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        const price = getCurrentPrice(coinId);
        coin.value = coin.amount * price;
    }
}

// Funcție pentru actualizarea UI-ului
function updateUI() {
    // Actualizăm balanța totală
    updateTotalBalance();
    
    // Actualizăm procentul de schimbare
    const changeElement = document.querySelector('.balance-change span');
    if (changeElement && wallet.change !== undefined) {
        changeElement.textContent = Math.abs(wallet.change).toFixed(2) + '%';
        
        // Actualizăm și clasa de culoare
        const balanceChangeEl = document.querySelector('.balance-change');
        if (balanceChangeEl) {
            if (wallet.change >= 0) {
                balanceChangeEl.classList.remove('negative');
                balanceChangeEl.classList.add('positive');
                balanceChangeEl.querySelector('i').className = 'fas fa-caret-up';
            } else {
                balanceChangeEl.classList.remove('positive');
                balanceChangeEl.classList.add('negative');
                balanceChangeEl.querySelector('i').className = 'fas fa-caret-down';
            }
        }
    }
    
    // Actualizăm UI-ul pentru fiecare monedă vizibilă
    for (const coinId in wallet.coins) {
        const assetItem = findAssetElement(coinId);
        if (assetItem) {
            updateAssetUI(coinId);
        }
    }
} 