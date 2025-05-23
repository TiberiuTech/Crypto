document.addEventListener('DOMContentLoaded', () => {
    fixXRPValue();
    
    fetchCoinData().then(() => {
        initializeModals();
        initializePortfolioChart();
        initializeDepositDropdown();
        initializeSwapModal();
        setupCustomNotifications();
        
        removeNoAssetsMessage();
        
        initializeBalanceVisibilityToggle();
        
        startPriceFluctuation();
        
        restoreWalletUI();
        
        updateCoinValues();
        
        updateWalletDisplay();
        
        setupEventListeners();
    });
});

let wallet = {
    totalBalance: 0,
    change: 0,
    coins: {},
    transactions: []
};

const savedWallet = localStorage.getItem('wallet');
if (savedWallet) {
    try {
        wallet = JSON.parse(savedWallet);
    } catch (e) {
        console.error('Error parsing wallet from localStorage:', e);
    }
}

const coinData = {};

const coinPrices = {
    btc: 0,
    eth: 0,
    orx: 0,
    xrp: 0
};

const exchangeRates = {
    btc_eth: 13.54,
    btc_orx: 5000,
    eth_btc: 0.0738,
    eth_orx: 369.25,
    orx_btc: 0.0002,
    orx_eth: 0.00271
};

async function fetchCoinData() {
    try {
        const coinIds = [
            'bitcoin', 'ethereum', 'binancecoin', 'ripple', 
            'cardano', 'solana', 'polkadot', 'dogecoin'
        ];
        
        // Folosim serverul proxy local pentru a evita limitele de rate
        const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false&locale=en`;
        const localProxyUrl = 'http://127.0.0.1:5000/api/proxy?url=';
        
        // Încercăm să folosim endpoint-ul specializat pentru prețuri
        let response;
        try {
            response = await fetch('http://127.0.0.1:5000/api/prices');
        } catch (proxyError) {
            console.log('Nu am putut folosi endpoint-ul dedicat, utilizăm proxy general', proxyError);
            response = await fetch(localProxyUrl + encodeURIComponent(apiUrl));
        }
        
        if (!response.ok) {
            throw new Error('Could not fetch coin data from API proxy');
        }
        
        const data = await response.json();
        
        data.forEach(coin => {
            coinData[coin.id] = {
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                price: coin.current_price,
                image: coin.image,
                price_change_percentage_24h: coin.price_change_percentage_24h || 0
            };
            
            if (coin.id === 'bitcoin') coinPrices.btc = coin.current_price;
            if (coin.id === 'ethereum') coinPrices.eth = coin.current_price;
            if (coin.id === 'ripple') coinPrices.xrp = coin.current_price;
        });
        
        coinPrices.orx = 4.5;
        
        updateExchangeRates();
        
        console.log('Coin data loaded from proxy:', coinData);
        return coinData;
    } catch (error) {
        console.error('Error fetching coin data:', error);
        coinPrices.btc = 47000;
        coinPrices.eth = 1800;
        coinPrices.orx = 4.5;
        coinPrices.xrp = 0.85;
        
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
        
        coinData.ripple = {
            name: 'XRP',
            symbol: 'XRP',
            price: coinPrices.xrp,
            image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
            price_change_percentage_24h: 0.3
        };
        
        return coinData;
    }
}

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

function initializeDepositDropdown() {
    const coinOptions = document.getElementById('coinOptions');
    const selectedCoin = document.getElementById('selectedCoin');
    const depositCoinInput = document.getElementById('depositCoin');
    const depositCoinSymbol = document.getElementById('depositCoinSymbol');
    const previewSymbol = document.getElementById('previewSymbol');
    
    if (coinOptions) {
        let optionsHTML = '';
        
        if (Object.keys(coinData).length > 0) {
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
        
        if (selectedCoin) {
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
            
            if (depositCoinInput) depositCoinInput.value = 'bitcoin';
            if (depositCoinSymbol) depositCoinSymbol.textContent = 'BTC';
            if (previewSymbol) previewSymbol.textContent = 'BTC';
            
            updateDepositPreview();
        }
        
        document.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const symbol = this.getAttribute('data-symbol');
                const icon = this.querySelector('.coin-icon').src;
                const name = this.querySelector('.coin-name').textContent;
                
                selectedCoin.innerHTML = `
                    <img src="${icon}" alt="${name}" class="coin-icon">
                    <span class="coin-name">${name}</span>
                    <i class="fas fa-chevron-down dropdown-arrow"></i>
                `;

                depositCoinInput.value = value;
                
                if (depositCoinSymbol) depositCoinSymbol.textContent = symbol;
                if (previewSymbol) previewSymbol.textContent = symbol;
                
                document.querySelector('.custom-dropdown').classList.remove('open');
                
                updateDepositPreview();
            });
        });
        
        if (selectedCoin) {
            selectedCoin.addEventListener('click', function() {
                document.querySelector('.custom-dropdown').classList.toggle('open');
            });
        }
        
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

function updateDepositPreview() {
    const depositAmount = document.getElementById('depositAmount');
    const previewAmount = document.getElementById('previewAmount');
    const previewValue = document.getElementById('previewValue');
    const depositCoin = document.getElementById('depositCoin');
    
    if (depositAmount && previewAmount && previewValue && depositCoin) {
        const amount = parseFloat(depositAmount.value) || 0;
        const coinId = depositCoin.value;
        
        previewAmount.textContent = amount.toFixed(8);
        
        const coinPrice = coinData[coinId] ? coinData[coinId].price : getCurrentPrice(coinId);
        
        const estimatedValue = amount * coinPrice;
        previewValue.textContent = estimatedValue.toFixed(2);
    }
}

function initializeSwapModal() {
    const swapModal = document.getElementById('swapModal');
    let fromCoinSelect = document.getElementById('fromCoin');
    let toCoinSelect = document.getElementById('toCoin');
    let fromAmount = document.getElementById('fromAmount');
    let toAmount = document.getElementById('toAmount');
    const swapDirectionBtn = document.getElementById('swapDirectionBtn');
    const swapSubmitBtn = document.getElementById('swapSubmitBtn');
    
    console.log("Initializing swap modal, elements found:", {
        fromCoinSelect: !!fromCoinSelect,
        toCoinSelect: !!toCoinSelect,
        fromAmount: !!fromAmount,
        toAmount: !!toAmount,
        swapDirectionBtn: !!swapDirectionBtn, 
        swapSubmitBtn: !!swapSubmitBtn
    });
    
    if (!swapModal) {
        console.log("create swap modal");
        const modal = document.createElement('div');
        modal.id = 'swapModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Swap Crypto</h2>
                    <span class="modal-close">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="swap-container">
                        <div class="swap-form">
                            <div class="swap-row">
                                <div class="swap-label">From:</div>
                                <div class="swap-inputs">
                                    <select id="fromCoin" class="swap-select"></select>
                                    <input type="number" id="fromAmount" class="swap-input" placeholder="0.00" min="0" step="any">
                                </div>
                            </div>
                            <div class="swap-info">
                                <div>Available: <span id="fromAvailable">0.00</span> <span id="fromSymbol">BTC</span></div>
                            </div>
                            <div class="swap-direction">
                                <button id="swapDirectionBtn" class="swap-direction-btn">
                                    <i class="fas fa-exchange-alt"></i>
                                </button>
                            </div>
                            <div class="swap-row">
                                <div class="swap-label">To:</div>
                                <div class="swap-inputs">
                                    <select id="toCoin" class="swap-select"></select>
                                    <input type="number" id="toAmount" class="swap-input" placeholder="0.00" readonly>
                                </div>
                            </div>
                            <div class="swap-info">
                                <div>Exchange rate: <span id="exchangeRate">1 BTC = 13.54 ETH</span></div>
                            </div>
                            <div class="swap-fee-info">
                                <div>Swap fee: 0.1%</div>
                            </div>
                        </div>
                        <button id="swapSubmitBtn" class="submit-btn">Swap Now</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        fromCoinSelect = document.getElementById('fromCoin');
        toCoinSelect = document.getElementById('toCoin');
        fromAmount = document.getElementById('fromAmount');
        toAmount = document.getElementById('toAmount');
        
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    } else if (!fromCoinSelect || !toCoinSelect) {
        console.log("Modalul există dar lipsesc elementele din interior");
        
        const modalBody = swapModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="swap-container">
                    <div class="swap-form">
                        <div class="swap-row">
                            <div class="swap-label">From:</div>
                            <div class="swap-inputs">
                                <select id="fromCoin" class="swap-select"></select>
                                <input type="number" id="fromAmount" class="swap-input" placeholder="0.00" min="0" step="any">
                            </div>
                        </div>
                        <div class="swap-info">
                            <div>Available: <span id="fromAvailable">0.00</span> <span id="fromSymbol">BTC</span></div>
                        </div>
                        <div class="swap-direction">
                            <button id="swapDirectionBtn" class="swap-direction-btn">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                        </div>
                        <div class="swap-row">
                            <div class="swap-label">To:</div>
                            <div class="swap-inputs">
                                <select id="toCoin" class="swap-select"></select>
                                <input type="number" id="toAmount" class="swap-input" placeholder="0.00" readonly>
                            </div>
                        </div>
                        <div class="swap-info">
                            <div>Exchange rate: <span id="exchangeRate">1 BTC = 13.54 ETH</span></div>
                        </div>
                        <div class="swap-fee-info">
                            <div>Swap fee: 0.1%</div>
                        </div>
                    </div>
                    <button id="swapSubmitBtn" class="submit-btn">Swap Now</button>
                </div>
            `;
            
            fromCoinSelect = document.getElementById('fromCoin');
            toCoinSelect = document.getElementById('toCoin');
            fromAmount = document.getElementById('fromAmount');
            toAmount = document.getElementById('toAmount');
        }
    }
    
    if (!fromCoinSelect || !toCoinSelect) {
        console.error("Elementele esențiale lipsă în initializeSwapModal: fromCoinSelect sau toCoinSelect");
        return;
    }
    
    populateSwapCoinDropdowns(fromCoinSelect, toCoinSelect);
    
    fromCoinSelect.addEventListener('change', function() {
        updateSwapInfo();
    });
    
    toCoinSelect.addEventListener('change', function() {
        updateSwapInfo();
    });
    
    if (fromAmount) {
        fromAmount.setAttribute('min', '0');
        
        fromAmount.addEventListener('input', function() {
            if (parseFloat(this.value) < 0 || this.value.startsWith('-')) {
                this.value = 0;
            }
            
            updateToAmount();
        });
    }
    
    if (swapDirectionBtn) {
        swapDirectionBtn.addEventListener('click', function() {
            const fromCoin = fromCoinSelect.value;
            const toCoin = toCoinSelect.value;
            
            fromCoinSelect.value = toCoin;
            toCoinSelect.value = fromCoin;
            
            updateSwapInfo();
        });
    }
    
    const newSwapSubmitBtn = document.getElementById('swapSubmitBtn');
    if (newSwapSubmitBtn) {
        newSwapSubmitBtn.onclick = function() {
            console.log("Swap button clicked");
            
            if (!fromCoinSelect || !toCoinSelect || !fromAmount || !toAmount) {
                console.error("Missing elements for swap");
                return false;
            }
            
            const fromCoin = fromCoinSelect.value;
            const toCoin = toCoinSelect.value;
            const fromAmountValue = parseFloat(fromAmount.value);
            const toAmountValue = parseFloat(toAmount.value);
            
            if (!fromCoin || !toCoin || !fromAmountValue || isNaN(fromAmountValue) || fromAmountValue <= 0) {
                console.error("Invalid swap parameters", {
                    fromCoin,
                    toCoin,
                    fromAmount: fromAmountValue
                });
                return false;
            }
            
            if (!wallet.coins[fromCoin] || wallet.coins[fromCoin].amount < fromAmountValue) {
                console.error("Insufficient funds for swap", {
                    available: wallet.coins[fromCoin] ? wallet.coins[fromCoin].amount : 0,
                    requested: fromAmountValue
                });
                return false;
            }
            
            executeSwap(fromCoin, toCoin, fromAmountValue, toAmountValue);
            
            const swapModal = document.getElementById('swapModal');
            if (swapModal) {
                swapModal.style.display = 'none';
            }
            
            console.log("Swap completed successfully");
            return false;
        };
    }
    
    updateSwapInfo();
}

function populateSwapCoinDropdowns(fromSelect, toSelect) {
    const currentFromCoin = fromSelect.value;
    const currentToCoin = toSelect.value;
    
    fromSelect.innerHTML = '';
    toSelect.innerHTML = '';
    
    const availableCoins = [];
    
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
    
    if (currentFromCoin && fromSelect.querySelector(`option[value="${currentFromCoin}"]`)) {
        fromSelect.value = currentFromCoin;
    }
    
    if (currentToCoin && toSelect.querySelector(`option[value="${currentToCoin}"]`)) {
        toSelect.value = currentToCoin;
    }
    
    if (fromSelect.value === toSelect.value && availableCoins.length > 1) {
        for (let i = 0; i < toSelect.options.length; i++) {
            if (toSelect.options[i].value !== fromSelect.value) {
                toSelect.selectedIndex = i;
                break;
            }
        }
    }
}

function updateSwapInfo() {
    const fromCoinSelect = document.getElementById('fromCoin');
    const toCoinSelect = document.getElementById('toCoin');
    const fromAvailable = document.getElementById('fromAvailable');
    const fromSymbol = document.getElementById('fromSymbol');
    const exchangeRateElement = document.getElementById('exchangeRate');
    
    if (!fromCoinSelect || !toCoinSelect) {
        console.error("Missing elements in DOM: fromCoin or toCoin");
        return;
    }
    
    const fromCoin = fromCoinSelect.value;
    const toCoin = toCoinSelect.value;
    
    if (fromCoin === toCoin) {
        const toSelect = document.getElementById('toCoin');
        const options = toSelect.options;
        
        for (let i = 0; i < options.length; i++) {
            if (options[i].value !== fromCoin) {
                toSelect.selectedIndex = i;
                return updateSwapInfo();
            }
        }
    }
    
    const fromCoinInfo = wallet.coins[fromCoin];
    
    if (fromSymbol) {
        fromSymbol.textContent = fromCoin.toUpperCase();
    }
    
    if (fromAvailable) {
        fromAvailable.textContent = fromCoinInfo ? fromCoinInfo.amount.toFixed(4) : "0.00";
    }
    
    const rate = calculateExchangeRate(fromCoin, toCoin);
    
    if (exchangeRateElement) {
        exchangeRateElement.textContent = `1 ${fromCoin.toUpperCase()} = ${rate.toFixed(2)} ${toCoin.toUpperCase()}`;
    }
    
    updateToAmount();
}

function calculateExchangeRate(fromCoin, toCoin) {
    const rateKey = `${fromCoin}_${toCoin}`;
    if (exchangeRates[rateKey]) {
        return exchangeRates[rateKey];
    }
    
    const fromPrice = getCurrentPrice(fromCoin);
    const toPrice = getCurrentPrice(toCoin);
    
    if (fromPrice && toPrice) {
        return fromPrice / toPrice;
    }
    
    return 1;
}

function updateToAmount() {
    const fromCoinSelect = document.getElementById('fromCoin');
    const toCoinSelect = document.getElementById('toCoin');
    const fromAmountInput = document.getElementById('fromAmount');
    const toAmount = document.getElementById('toAmount');
    
    if (!fromCoinSelect || !toCoinSelect || !fromAmountInput || !toAmount) {
        console.error("Missing elements in DOM for updateToAmount");
        return;
    }
    
    const fromCoin = fromCoinSelect.value;
    const toCoin = toCoinSelect.value;
    const fromAmount = parseFloat(fromAmountInput.value) || 0;
    
    const rate = calculateExchangeRate(fromCoin, toCoin);
    
    const fee = 0.001; 
    const amountAfterFee = fromAmount * (1 - fee);
    
    const calculatedAmount = amountAfterFee * rate;
    
    toAmount.value = calculatedAmount.toFixed(6);
}

function executeSwap(fromCoin, toCoin, fromAmount, toAmount) {
    console.log(`Executing swap: ${fromAmount} ${fromCoin} to ${toAmount} ${toCoin}`);

    if (!wallet.coins[fromCoin]) {
        console.error(`Source coin ${fromCoin} not found in wallet`);
        return;
    }
    
    if (wallet.coins[fromCoin].amount < fromAmount) {
        console.error(`Insufficient funds for ${fromCoin}`, {
            available: wallet.coins[fromCoin].amount,
            requested: fromAmount
        });
        return;
    }
    
    wallet.coins[fromCoin].amount -= fromAmount;
    wallet.coins[fromCoin].value = wallet.coins[fromCoin].amount * getCurrentPrice(fromCoin);
    
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
    
    updateWalletDisplay();
    
    updateAssetUI(fromCoin);
    
    const toAssetItem = findAssetElement(toCoin);
    if (toAssetItem) {
        updateAssetUI(toCoin);
    } else {
        const assetsList = document.getElementById('assetsList');
        if (assetsList) {
            const noAssetsMessage = assetsList.querySelector('.no-assets-message');
            if (noAssetsMessage) {
                noAssetsMessage.style.display = 'none';
            }
            
            const newAssetItem = createAssetElement(toCoin);
            assetsList.appendChild(newAssetItem);
        }
    }
    
    addSwapToHistory(fromCoin, toCoin, fromAmount, toAmount);
}

function addSwapToHistory(fromCoin, toCoin, fromAmount, toAmount) {
    console.log(`Adding swap to history: ${fromAmount} ${fromCoin} to ${toAmount} ${toCoin}`);
    
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
    
    wallet.transactions.unshift(newTransaction);
    
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) {
        console.error("transactionsList element not found");
        return;
    }
    
    const noTransactionsMessage = transactionsList.querySelector('.no-transactions-message');
    if (noTransactionsMessage) {
        noTransactionsMessage.style.display = 'none';
    }
    
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
    
    if (transactionsList.firstChild) {
        transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    } else {
        transactionsList.appendChild(transactionItem);
    }
    
    console.log("Swap transaction added to history");
}

function initializeModals() {
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
        
        let data;
        if (coin === 'btc') {
            data = [45000, 46200, 45800, 47500, 48200, 47900, 49000];
        } else if (coin === 'eth') {
            data = [2800, 2750, 2600, 2500, 2400, 2350, 2250];
        } else {
            data = [5, 5.2, 5.4, 5.3, 5.5, 5.7, 5.8];
        }
        
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

function setupCustomNotifications() {
    let notificationContainer = document.getElementById('notificationContainer');
    
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

function showNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notificationContainer');
    
    if (!notificationContainer) {
        console.error('Notification container not found');
        return;
    }
    
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
    
    const icon = type === 'success' ? '<i class="fas fa-check-circle" style="margin-right: 10px; font-size: 18px;"></i>' : 
                                     '<i class="fas fa-exclamation-circle" style="margin-right: 10px; font-size: 18px;"></i>';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center;">
            ${icon}
            <span>${message}</span>
        </div>
        <button class="close-notification" style="background: transparent; border: none; color: white; cursor: pointer; margin-left: 10px;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notificationContainer.appendChild(notification);
    
    const closeBtn = notification.querySelector('.close-notification');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                notificationContainer.removeChild(notification);
            }, 300);
        });
    }
    
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

document.addEventListener('DOMContentLoaded', addNotificationStyles);

function setupEventListeners() {
    console.log("Setting up event listeners...");
    const actionButtons = document.querySelectorAll('.action-button');
    
    // Adaug listeners pentru fiecare buton
    actionButtons.forEach(button => {
        const buttonText = button.querySelector('span').textContent;
        console.log("Found button:", buttonText);
        
        button.addEventListener('click', () => {
            const action = button.querySelector('span').textContent.toLowerCase();
            console.log("Button clicked:", action);
            
            if (action === 'deposit') {
                // Acum și butonul Deposit deschide modalul
                console.log("Deposit button clicked - opening deposit modal");
                const depositModal = document.getElementById('depositModal');
                if (depositModal) {
                    depositModal.style.display = 'block';
                } else {
                    console.error("depositModal element not found!");
                }
            } else if (action === 'withdraw') {
                console.log("Opening withdraw modal");
                
                populateWithdrawCoinDropdown();
                
                const withdrawModal = document.getElementById('withdrawModal');
                withdrawModal.style.display = 'block';
                
                const withdrawBtn = document.getElementById('withdrawSubmitBtn');
                if (!withdrawBtn) {
                    console.error("withdrawSubmitBtn not found, trying alternative selector");
                    const altBtn = withdrawModal.querySelector('button.submit-btn') || 
                                 withdrawModal.querySelector('button:contains("Withdraw Now")');
                    if (altBtn) {
                        console.log("Found button with alternative selector:", altBtn);
                        altBtn.id = 'withdrawSubmitBtn'; 
                    }
                }
                
                const allButtons = withdrawModal.querySelectorAll('button');
                console.log("All buttons in withdraw modal:", allButtons.length);
                allButtons.forEach((btn, index) => {
                    console.log(`Button ${index}:`, btn.textContent, btn.className);
                    
                    if (btn.textContent.includes('Withdraw') || btn.className.includes('submit') || index === allButtons.length - 1) {
                        btn.addEventListener('click', function(e) {
                            console.log("Potential withdraw button clicked:", this.textContent);
                        });
                    }
                });
                
                setupWithdrawEvents();
                
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
                
                initializeSwapModal();
                
                const swapModal = document.getElementById('swapModal');
                swapModal.style.display = 'block';
                
                const swapBtn = document.getElementById('swapSubmitBtn');
                if (!swapBtn) {
                    console.log("swapSubmitBtn not found, trying alternative selector");
                    const altBtn = swapModal.querySelector('button.submit-btn') || 
                                 swapModal.querySelector('button:contains("Swap Now")');
                    if (altBtn) {
                        console.log("Found swap button with alternative selector:", altBtn);
                        altBtn.id = 'swapSubmitBtn';
                        
                        altBtn.onclick = function() {
                            console.log("Alternative swap button clicked");
                        };
                    }
                }
                
                const allSwapButtons = swapModal.querySelectorAll('button');
                console.log("All buttons in swap modal:", allSwapButtons.length);
                allSwapButtons.forEach((btn, index) => {
                    console.log(`Swap button ${index}:`, btn.textContent, btn.className);
                    
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
            } else if (action === 'add funds') {
                // Deschidem direct modalul cu detalii card pentru Add Funds
                console.log("Opening card details modal from Add Funds button");
                
                // Moneda implicită
                const defaultCoin = 'bitcoin';
                const defaultSymbol = 'BTC';
                
                // Resetăm input-ul pentru sumă
                const cardDetailsModal = document.getElementById('cardDetailsModal');
                if (cardDetailsModal) {
                    const amountInput = document.getElementById('cardPaymentInput');
                    if (amountInput) {
                        amountInput.value = '';
                    }
                    
                    cardDetailsModal.style.display = 'block';
                }
            }
        });
    });
    
    // Adaug event listener specific pentru butonul Add Funds folosind ID-ul
    const addFundsButton = document.getElementById('addFundsButton');
    if (addFundsButton) {
        console.log("Found addFundsButton by ID");
        addFundsButton.addEventListener('click', function() {
            console.log("Add Funds button clicked by ID");
            
            // Moneda implicită
            const defaultCoin = 'bitcoin';
            const defaultSymbol = 'BTC';
            
            // Resetăm input-ul pentru sumă
            const cardDetailsModal = document.getElementById('cardDetailsModal');
            if (cardDetailsModal) {
                const amountInput = document.getElementById('cardPaymentInput');
                if (amountInput) {
                    amountInput.value = '';
                }
                
                cardDetailsModal.style.display = 'block';
            }
        });
    } else {
        console.error("addFundsButton element not found by ID!");
    }
    
    // Restaurăm restul codului care a fost șters
    const depositAmount = document.getElementById('depositAmount');
    if (depositAmount) {
        depositAmount.addEventListener('input', function() {
            if (parseFloat(this.value) < 0 || this.value.startsWith('-')) {
                this.value = 0;
            }
            updateDepositPreview();
        });
    }
    
    const depositSubmitBtn = document.getElementById('depositSubmitBtn');
    if (depositSubmitBtn) {
        depositSubmitBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('depositAmount').value);
            const coin = document.getElementById('depositCoin').value;
            const symbol = document.getElementById('previewSymbol').textContent;
            
            if (!amount || isNaN(amount) || amount <= 0) {
                return;
            }
            
            console.log(`Depozit inițiat: ${amount} ${symbol} (${coin})`);
            
            // În loc să închidem modalul și să continuăm direct,
            // verificăm și cerem confirmare
            checkAndConfirmDeposit(amount, coin, symbol);
        });
    }
    
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
    
    document.addEventListener('click', function(event) {
        let target = event.target;
        let swapBtn = null;
        
        if (target.classList.contains('swap-btn')) {
            swapBtn = target;
        } else if (target.parentElement && target.parentElement.classList.contains('swap-btn')) {
            swapBtn = target.parentElement;
        }
        
        if (swapBtn) {
            const coinId = swapBtn.getAttribute('data-coin-id');
            const swapModal = document.getElementById('swapModal');
            if (swapModal) {
                initializeSwapModal();
                
                const fromCoinSelect = document.getElementById('fromCoin');
                if (fromCoinSelect) {
                    const options = fromCoinSelect.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value === coinId) {
                            fromCoinSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                updateSwapInfo();
                
                swapModal.style.display = 'block';
            }
        }
    });
}

function updateAssetAfterDeposit(coin, amount) {
    const coinId = coin.includes('coin') || Object.keys(coinData).includes(coin) ? coin : getCoinIdFromSymbol(coin);
    
    console.log('Deposit for coin:', coin, 'CoinGecko ID:', coinId);
    
    if (!wallet.coins[coinId]) {
        wallet.coins[coinId] = {
            id: coinId,
            name: getCoinName(coin),
            ticker: typeof coin === 'string' ? coin.toUpperCase() : 'COIN',
            amount: 0,
            value: 0,
            change: coinData[coinId] ? coinData[coinId].price_change_percentage_24h : 0.5
        };
    }
    
    wallet.coins[coinId].amount += amount;
    wallet.coins[coinId].value += amount * getCurrentPrice(coin);
    
    updateWalletDisplay();
    
    const assetsList = document.getElementById('assetsList');
    if (!assetsList) return;
    
    const noAssetsMessage = assetsList.querySelector('.no-assets-message');
    if (noAssetsMessage) {
        noAssetsMessage.style.display = 'none';
    }
    
    const existingAsset = findAssetElement(coinId);
    
    if (existingAsset) {
        const assetAmountElement = existingAsset.querySelector('.asset-amount');
        const assetValueElement = existingAsset.querySelector('.asset-value');
        
        if (assetAmountElement) {
            assetAmountElement.textContent = `${wallet.coins[coinId].amount.toFixed(4)} ${wallet.coins[coinId].ticker}`;
        }
        
        if (assetValueElement) {
            assetValueElement.textContent = `$${wallet.coins[coinId].value.toFixed(2)}`;
        }
    } else {
        const assetItem = createAssetElement(coinId);
        assetsList.appendChild(assetItem);
    }
}

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

function createAssetElement(coinId) {
    const coinInfo = wallet.coins[coinId];
    const isPositive = coinInfo.change >= 0;
    
    const assetItem = document.createElement('div');
    assetItem.className = 'asset-item';
    assetItem.setAttribute('data-coin-id', coinId);
    
    let imageUrl;
    
    if (coinData[coinId] && coinData[coinId].image) {
        imageUrl = coinData[coinId].image;
    } else {
        imageUrl = getCoinImageUrl(coinId);
    }
    
    console.log('Creating asset for coin:', coinId, 'Image:', imageUrl);
    
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
    
    setTimeout(() => {
        const canvas = assetItem.querySelector('.mini-chart');
        if (canvas) {
            initializeSingleMiniChart(canvas);
        }
    }, 0);
    
    const swapButton = assetItem.querySelector('.swap-btn');
    if (swapButton) {
        swapButton.addEventListener('click', function() {
            const coinId = this.getAttribute('data-coin-id');
            
            const swapModal = document.getElementById('swapModal');
            if (swapModal) {
                initializeSwapModal();
                
                const fromCoinSelect = document.getElementById('fromCoin');
                if (fromCoinSelect) {
                    const options = fromCoinSelect.options;
                    for (let i = 0; i < options.length; i++) {
                        if (options[i].value === coinId) {
                            fromCoinSelect.selectedIndex = i;
                            break;
                        }
                    }
                }
                
                updateSwapInfo();
                
                swapModal.style.display = 'block';
            }
        });
    }
    
    return assetItem;
}

function initializeSingleMiniChart(chartCanvas) {
    if (!chartCanvas) return;

    const existingChart = window.Chart && window.Chart.getChart ? window.Chart.getChart(chartCanvas) : null;
    if (existingChart) {
        existingChart.destroy();
    }

    const ctx = chartCanvas;
    const coin = chartCanvas.dataset.coin;
    
    let data = [45000, 46200, 45800, 47500, 48200, 47900, 49000];
    if (coin === 'eth') {
        data = [2800, 2750, 2600, 2500, 2400, 2350, 2250];
    } else if (coin === 'orx') {
        data = [5, 5.2, 5.4, 5.3, 5.5, 5.7, 5.8];
    }

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

function addTransactionToHistory(coinId, amount) {
    const newTransaction = {
        type: 'receive',
        coin: coinId,
        amount: amount,
        value: amount * getCurrentPrice(coinId),
        date: new Date(),
        status: 'completed'
    };
    
    wallet.transactions.unshift(newTransaction);
    
    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
        const noTransactionsMessage = transactionsList.querySelector('.no-transactions-message');
        if (noTransactionsMessage) {
            noTransactionsMessage.style.display = 'none';
        }
        
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
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
        
        if (transactionsList.firstChild) {
            transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
        } else {
            transactionsList.appendChild(transactionItem);
        }
    }
}

function getCurrentPrice(coinId) {
    if (coinId === 'xrp' || coinId === 'ripple') {
        if (coinData['ripple'] && coinData['ripple'].price) {
            return coinData['ripple'].price;
        }
        if (coinPrices.xrp && coinPrices.xrp > 0) {
            return coinPrices.xrp;
        }
        return 1.35;
    }
    
    if (coinData[coinId]) {
        return coinData[coinId].price;
    }
    
    return coinPrices[coinId] || 0;
}

function getCoinName(coinId) {
    if (coinData[coinId]) {
        return coinData[coinId].name;
    }
    
    const names = {
        btc: 'Bitcoin',
        eth: 'Ethereum',
        orx: 'Orionix'
    };
    
    return names[coinId] || coinId.toUpperCase();
}

function getCoinImageUrl(coin) {
    if (coinData[coin] && coinData[coin].image) {
        return coinData[coin].image;
    }
    
    const coinId = getCoinIdFromSymbol(coin);
    if (coinId && coinData[coinId] && coinData[coinId].image) {
        return coinData[coinId].image;
    }
    
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
            return 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png';
    }
}

function getCoinIdFromSymbol(symbol) {
    if (!symbol) return null;
    
    if (Object.keys(coinData).includes(symbol)) {
        return symbol;
    }
    
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
    
    const normalizedSymbol = symbol.toLowerCase();
    
    return symbolToId[normalizedSymbol] || normalizedSymbol;
}

function updateWalletDisplay() {
    console.log('Updating wallet display. Current wallet state:', wallet);
    
    const totalBalance = Number(wallet.totalBalance || 0);
    console.log('Total Balance to display:', totalBalance);

    // Actualizăm Total Balance folosind selectorul exact din HTML
    const totalBalanceElement = document.querySelector('.balance-amount');
    if (totalBalanceElement) {
        totalBalanceElement.textContent = '$' + formatNumber(totalBalance);
        console.log('Updated total balance element:', totalBalanceElement.textContent);
    } else {
        console.error('Total balance element not found with class .balance-amount');
    }

    // Actualizăm și label-ul de balance dacă există
    const balanceLabelElement = document.querySelector('.balance-label');
    if (balanceLabelElement) {
        balanceLabelElement.textContent = 'Total Balance';
    }

    // Actualizăm Portfolio Overview
    const portfolioValue = calculatePortfolioValue();
    const portfolioValueElement = document.querySelector('.portfolio-overview span');
    if (portfolioValueElement) {
        portfolioValueElement.textContent = '$' + formatNumber(portfolioValue);
        console.log('Updated portfolio value:', portfolioValueElement.textContent);
    }

    // Actualizăm lista de active
    updateAssetsList();

    // Salvăm starea în localStorage
    saveWalletToStorage();
}

// Helper function pentru calculul valorii portofoliului
function calculatePortfolioValue() {
    let portfolioValue = 0;
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        if (coin && coin.amount > 0) {
            const currentPrice = getCurrentPrice(coinId);
            portfolioValue += coin.amount * currentPrice;
        }
    }
    return portfolioValue;
}

function calculateTotalBalance() {
    // Începem cu USDT disponibil (fondurile adăugate)
    let totalBalance = wallet.totalBalance || 0;
    
    // Adăugăm valoarea tuturor monedelor
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        if (coin && coin.amount > 0) {
            const currentPrice = getCurrentPrice(coinId);
            const coinValue = coin.amount * currentPrice;
            totalBalance += coinValue;
        }
    }
    
    return totalBalance;
}

function updateAssetsList() {
    const assetsList = document.getElementById('walletAssetsList');
    if (!assetsList) return;
    
    assetsList.innerHTML = '';
    
    if (!wallet.coins || Object.keys(wallet.coins).length === 0) {
        const emptyWallet = document.createElement('div');
        emptyWallet.className = 'wallet-asset-placeholder';
        emptyWallet.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>No assets found in your wallet</span>
        `;
        assetsList.appendChild(emptyWallet);
        return;
    }
    
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        if (!coin || coin.amount <= 0) continue;
        
        const currentPrice = getCurrentPrice(coinId);
        const value = coin.amount * currentPrice;
        const changePercent = coinData[coinId]?.price_change_percentage_24h || 0;
        
        const assetItem = document.createElement('div');
        assetItem.className = 'wallet-asset-item';
        assetItem.innerHTML = `
            <div class="wallet-asset-icon ${coinId.toLowerCase()}-icon">${getIconContent(coinId)}</div>
            <div class="wallet-asset-details">
                <div class="wallet-asset-name-row">
                    <span class="wallet-asset-name">${getCoinName(coinId)}</span>
                    <span class="wallet-asset-symbol">${coinData[coinId]?.symbol || coinId.toUpperCase()}</span>
                </div>
                <div class="wallet-asset-amount-row">
                    <span class="wallet-asset-amount">${coin.amount.toFixed(4)} ${coinData[coinId]?.symbol || coinId.toUpperCase()}</span>
                    <span class="wallet-asset-change ${changePercent >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-caret-${changePercent >= 0 ? 'up' : 'down'}"></i>
                        <span>${Math.abs(changePercent).toFixed(1)}%</span>
                    </span>
                </div>
                <div class="wallet-asset-value-row">
                    <span class="wallet-asset-value">$${formatNumber(value)}</span>
                </div>
            </div>
        `;
        
        assetsList.appendChild(assetItem);
    }
}

function saveWalletToStorage() {
    localStorage.setItem('wallet', JSON.stringify(wallet));
}

function restoreWalletUI() {
    const assetsList = document.getElementById('assetsList');
    if (assetsList) {
        assetsList.innerHTML = '';
        for (const coinId in wallet.coins) {
            if (wallet.coins[coinId].amount > 0) {
                const assetItem = createAssetElement(coinId);
                assetsList.appendChild(assetItem);
            }
        }
    }

    const transactionsList = document.getElementById('transactionsList');
    if (transactionsList) {
        transactionsList.innerHTML = '';
        if (!wallet.transactions || wallet.transactions.length === 0) {
            const noTransactionsMessage = document.createElement('div');
            noTransactionsMessage.className = 'no-transactions-message';
            noTransactionsMessage.innerHTML = '<p>No transactions yet. Your transaction history will appear here.</p>';
            transactionsList.appendChild(noTransactionsMessage);
        } else {
            wallet.transactions.forEach(tx => {
                const transactionItem = createTransactionElement(tx);
                transactionsList.appendChild(transactionItem);
            });
        }
    }
}

function createTransactionElement(tx) {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    let title = '';
    let amountStr = '';
    let valueStr = '';
    let iconClass = '';
    let status = tx.status || 'completed';
    let dateStr = 'Just now';
    if (tx.date) {
        const d = new Date(tx.date);
        dateStr = d.toLocaleString();
    }
    if (tx.type === 'swap') {
        title = `Swapped ${tx.fromCoin.toUpperCase()} to ${tx.toCoin.toUpperCase()}`;
        amountStr = `${tx.fromAmount} ${tx.fromCoin.toUpperCase()} → ${tx.toAmount} ${tx.toCoin.toUpperCase()}`;
        valueStr = `$${(tx.value || 0).toFixed(2)}`;
        iconClass = 'fa-exchange-alt';
    } else if (tx.type === 'withdraw') {
        title = `Withdrew ${tx.coin.toUpperCase()}`;
        amountStr = `-${tx.amount} ${tx.coin.toUpperCase()}`;
        valueStr = `-$${(tx.value || 0).toFixed(2)}`;
        iconClass = 'fa-arrow-up';
    } else if (tx.type === 'receive') {
        title = `Received ${tx.coin.toUpperCase()}`;
        amountStr = `+${tx.amount} ${tx.coin.toUpperCase()}`;
        valueStr = `+$${(tx.value || 0).toFixed(2)}`;
        iconClass = 'fa-arrow-down';
    } else {
        title = 'Transaction';
        amountStr = '';
        valueStr = '';
        iconClass = 'fa-info-circle';
    }
    div.innerHTML = `
        <div class="transaction-icon"><i class="fas ${iconClass}"></i></div>
        <div class="transaction-details">
            <div class="transaction-title">${title}</div>
            <div class="transaction-date">${dateStr}</div>
        </div>
        <div class="transaction-amount">
            <div class="amount">${amountStr}</div>
            <div class="value">${valueStr}</div>
        </div>
        <div class="transaction-status">
            <span class="status ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        </div>
    `;
    return div;
}

document.addEventListener('DOMContentLoaded', restoreWalletUI);

function fixXRPValue() {
    try {
        const savedWallet = localStorage.getItem('wallet');
        if (savedWallet) {
            const walletData = JSON.parse(savedWallet);
            
            if (walletData.coins && walletData.coins.ripple) {
                console.log("XRP value fix started");
                console.log("Old value:", walletData.coins.ripple.value);
                
                const correctPrice = 1.38;
                walletData.coins.ripple.price = correctPrice;
                walletData.coins.ripple.value = walletData.coins.ripple.amount * correctPrice;
                walletData.coins.ripple.valueUSD = walletData.coins.ripple.value;
                walletData.coins.ripple.changePercent = 2.2;
                
                console.log("New value:", walletData.coins.ripple.value);
                
                if (walletData.coins.bitcoin) {
                    walletData.coins.bitcoin.price = 101126.52 / walletData.coins.bitcoin.amount;
                    walletData.coins.bitcoin.value = 101126.52;
                    walletData.coins.bitcoin.valueUSD = 101126.52;
                    walletData.coins.bitcoin.changePercent = 4.2;
                }
                
                let total = 0;
                for (const coinId in walletData.coins) {
                    total += walletData.coins[coinId].value;
                }
                walletData.totalBalance = total;
                
                localStorage.setItem('wallet', JSON.stringify(walletData));
                console.log("Wallet fixed and saved in localStorage");
            }
        }
    } catch (error) {
        console.error("Error fixing XRP value:", error);
    }
}

window.fixXRPValueInWallet = function() {
    console.log("Starting XRP value fix from browser console...");
    
    fixXRPValue();
    
    if (wallet.coins && wallet.coins.ripple) {
        console.log("XRP value fix in current memory...");
        const correctPrice = 1.38;
        wallet.coins.ripple.price = correctPrice;
        wallet.coins.ripple.value = wallet.coins.ripple.amount * correctPrice;
        wallet.coins.ripple.valueUSD = wallet.coins.ripple.value;
        wallet.coins.ripple.changePercent = 2.2;
        
        if (wallet.coins.bitcoin) {
            wallet.coins.bitcoin.price = 101126.52 / wallet.coins.bitcoin.amount;
            wallet.coins.bitcoin.value = 101126.52;
            wallet.coins.bitcoin.valueUSD = 101126.52;
            wallet.coins.bitcoin.changePercent = 4.2;
        }
        
        updateWalletDisplay();
        
        console.log("XRP value fixed in current memory:", wallet.coins.ripple);
    } else {
        console.log("No XRP in current wallet.");
    }
    
    updateUI();
    return "XRP value fix completed, check updated values!";
};

// Adăugăm actualizarea valorii portofoliului
function updatePortfolioValue(value) {
    const portfolioValueElement = document.getElementById('portfolioValue');
    if (portfolioValueElement) {
        portfolioValueElement.textContent = formatNumber(value);
    }
}

// La încărcarea inițială și după actualizări, actualizăm ambele valori
function calculateTotalBalance() {
    // Calculăm suma valorilor tuturor monedelor
    let coinsTotal = 0;
    for (const coin in wallet.coins) {
        coinsTotal += wallet.coins[coin].value;
    }
    
    // Ne asigurăm că avem cel puțin valoarea stocată în totalBalance
    // Aceasta permite adăugarea de fonduri fără a adăuga monede specifice
    return coinsTotal > wallet.totalBalance ? coinsTotal : wallet.totalBalance;
}

// Funcție pentru formatarea numerelor monetare
function formatNumber(value) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function prepareCardDetailsModal(coin, symbol) {
    // Arătăm modalul
    const cardDetailsModal = document.getElementById('cardDetailsModal');
    if (cardDetailsModal) {
        cardDetailsModal.style.display = 'block';
    }
    
    // Adăugăm event listener pentru butonul de procesare plată
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    if (processPaymentBtn) {
        processPaymentBtn.onclick = function() {
            const amountInput = document.getElementById('cardPaymentInput');
            const amount = parseFloat(amountInput.value);
            
            if (!amount || isNaN(amount) || amount <= 0) {
                showNotification('Please enter a valid amount', 'error');
                return;
            }
            
            processCardPayment(amount, coin, symbol);
        };
    }
}

function processCardPayment(amount, coin, symbol) {
    console.log('Processing card payment:', { amount, coin, symbol });
    
    // Validăm suma
    if (!amount || isNaN(amount) || amount <= 0) {
        console.error('Invalid amount:', amount);
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    try {
        // Convertim suma la număr
        const amountNumber = Number(amount);
        
        // Adăugăm fondurile în wallet
        wallet.totalBalance = Number(wallet.totalBalance || 0) + amountNumber;
        console.log('New wallet balance:', wallet.totalBalance);
        
        // Actualizăm UI-ul imediat
        updateWalletDisplay();
        
        // Adăugăm tranzacția
        if (!wallet.transactions) {
            wallet.transactions = [];
        }
        
        const newTransaction = {
            type: 'deposit',
            description: 'Funds added',
            amount: amountNumber,
            value: amountNumber,
            date: new Date(),
            status: 'completed'
        };
        
        wallet.transactions.unshift(newTransaction);
        updateTransactionsList();
        
        // Salvăm în localStorage
        saveWalletToStorage();
        
        // Ascundem modalul cardDetailsModal
        const cardDetailsModal = document.getElementById('cardDetailsModal');
        if (cardDetailsModal) {
            cardDetailsModal.style.display = 'none';
        }
        
        // Generăm un ID de tranzacție pentru confirmare
        const txId = 'TX' + Math.floor(Math.random() * 1000000000);
        
        // Arătăm modalul de confirmare
        const confirmationModal = document.getElementById('paymentConfirmationModal');
        if (confirmationModal) {
            // Actualizăm detaliile în modal
            const confirmationAmount = document.getElementById('confirmationAmount');
            const confirmationCrypto = document.getElementById('confirmationCrypto');
            const confirmationSymbol = document.getElementById('confirmationSymbol');
            const confirmationTxId = document.getElementById('confirmationTxId');
            
            if (confirmationAmount) confirmationAmount.textContent = formatNumber(amountNumber);
            if (confirmationCrypto) confirmationCrypto.textContent = amountNumber.toFixed(8);
            if (confirmationSymbol) confirmationSymbol.textContent = symbol;
            if (confirmationTxId) confirmationTxId.textContent = txId;
            
            confirmationModal.style.display = 'block';
            
            // Adăugăm event listener pentru butonul Done
            const doneBtn = document.getElementById('confirmationDoneBtn');
            if (doneBtn) {
                doneBtn.onclick = function() {
                    confirmationModal.style.display = 'none';
                    // Actualizăm UI-ul încă o dată pentru siguranță
                    updateWalletDisplay();
                };
            }
        }
        
        // Afișăm notificarea de succes
        showNotification(`Successfully added $${formatNumber(amountNumber)} to your wallet!`, 'success');
        
    } catch (error) {
        console.error('Error processing payment:', error);
        showNotification('Error processing payment. Please try again.', 'error');
    }
}

// Funcție pentru actualizarea valorilor monedelor
function updateCoinValues() {
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        const price = getCurrentPrice(coinId);
        if (price) {
            coin.value = coin.amount * price;
        }
    }
    
    updateWalletDisplay();
}

// Funcție pentru a elimina mesajul "No assets" dacă există active
function removeNoAssetsMessage() {
    const assetsList = document.getElementById('assetsList');
    if (assetsList) {
        const noAssetsMessage = assetsList.querySelector('.no-assets-message');
        if (noAssetsMessage && Object.keys(wallet.coins).length > 0) {
            noAssetsMessage.style.display = 'none';
        }
    }
}

// Funcție pentru a activa/dezactiva vizibilitatea soldului
function initializeBalanceVisibilityToggle() {
    const toggleBtn = document.getElementById('toggleBalanceBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const balanceAmount = document.getElementById('balanceAmount');
            const hiddenBalance = document.getElementById('hiddenBalance');
            
            if (balanceAmount && hiddenBalance) {
                if (balanceAmount.style.display === 'none') {
                    balanceAmount.style.display = '';
                    hiddenBalance.style.display = 'none';
                    toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
                } else {
                    balanceAmount.style.display = 'none';
                    hiddenBalance.style.display = '';
                    toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
                }
            }
        });
    }
}

// Funcție pentru a simula fluctuații de preț
function startPriceFluctuation() {
    setInterval(() => {
        // Simulăm mici fluctuații aleatorii în prețuri
        for (const coinId in coinPrices) {
            const fluctuation = (Math.random() - 0.5) * 0.01; // ±0.5%
            coinPrices[coinId] *= (1 + fluctuation);
        }
        
        // Actualizăm valorile portofelului
        updateCoinValues();
    }, 60000); // O dată pe minut
}

// Funcție pentru a adăuga fonduri direct la Total Balance
function addFundsToTotalBalance(amount) {
    console.log('Adding funds - Current balance:', wallet.totalBalance);
    console.log('Amount to add:', amount);
    
    // Convertim suma la număr și o adăugăm la totalBalance
    const amountNumber = Number(amount);
    wallet.totalBalance = Number(wallet.totalBalance || 0) + amountNumber;
    
    console.log('New balance after adding funds:', wallet.totalBalance);
    
    // Adăugăm tranzacția
    if (!wallet.transactions) {
        wallet.transactions = [];
    }
    
    const newTransaction = {
        type: 'deposit',
        description: 'Funds added',
        amount: amountNumber,
        value: amountNumber,
        date: new Date(),
        status: 'completed'
    };
    
    wallet.transactions.unshift(newTransaction);
    
    // Actualizăm tot UI-ul
    updateWalletDisplay();
    
    // Actualizăm lista de tranzacții
    updateTransactionsList();
    
    // Salvăm în localStorage
    saveWalletToStorage();
    
    // Afișăm notificarea
    showNotification(`Successfully added $${formatNumber(amountNumber)} to your wallet!`, 'success');
}

function updateTransactionsList() {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    // Curățăm lista existentă
    transactionsList.innerHTML = '';
    
    if (!wallet.transactions || wallet.transactions.length === 0) {
        const noTransactionsMessage = document.createElement('div');
        noTransactionsMessage.className = 'no-transactions-message';
        noTransactionsMessage.innerHTML = '<p>No transactions yet. Your transaction history will appear here.</p>';
        transactionsList.appendChild(noTransactionsMessage);
        return;
    }
    
    // Adăugăm fiecare tranzacție
    wallet.transactions.forEach(tx => {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        transactionItem.innerHTML = `
            <div class="transaction-icon ${tx.type}">
                <i class="fas ${tx.type === 'deposit' ? 'fa-arrow-down' : 'fa-exchange-alt'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${tx.description}</div>
                <div class="transaction-date">${new Date(tx.date).toLocaleString()}</div>
            </div>
            <div class="transaction-amount positive">
                <div class="amount">+$${formatNumber(tx.amount)}</div>
                <div class="value">+$${formatNumber(tx.value)}</div>
            </div>
            <div class="transaction-status">
                <span class="status ${tx.status}">${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
            </div>
        `;
        
        transactionsList.appendChild(transactionItem);
    });
}

// Funcție pentru verificarea și confirmarea depozitului
function checkAndConfirmDeposit(amount, coinId, symbol) {
    // Obținem prețul monedei
    const coinPrice = coinData[coinId] ? coinData[coinId].price : getCurrentPrice(coinId);
    const estimatedValue = amount * coinPrice;
    
    // Obținem soldul actual al utilizatorului
    const userBalance = wallet.totalBalance;
    
    // Setăm valorile în modalul de confirmare
    document.getElementById('confirmDepositAmount').textContent = amount.toFixed(8);
    document.getElementById('confirmDepositSymbol').textContent = symbol;
    document.getElementById('confirmDepositValue').textContent = estimatedValue.toFixed(2);
    document.getElementById('userCurrentBalance').textContent = formatNumber(userBalance);
    
    // Verificăm dacă utilizatorul are suficienți bani
    const hasSufficientFunds = userBalance >= estimatedValue;
    
    // Arătăm sau ascundem mesajul de fonduri insuficiente
    const insufficientFundsMessage = document.getElementById('insufficientFundsMessage');
    insufficientFundsMessage.style.display = hasSufficientFunds ? 'none' : 'block';
    
    // Activăm sau dezactivăm butonul de confirmare
    const confirmButton = document.getElementById('depositConfirmYesBtn');
    confirmButton.disabled = !hasSufficientFunds;
    confirmButton.style.opacity = hasSufficientFunds ? '1' : '0.5';
    confirmButton.style.cursor = hasSufficientFunds ? 'pointer' : 'not-allowed';
    
    // Arătăm modalul de confirmare
    const confirmModal = document.getElementById('depositConfirmModal');
    confirmModal.style.display = 'block';
    
    // Adăugăm event listeners pentru butoanele de confirmare
    const confirmYesBtn = document.getElementById('depositConfirmYesBtn');
    const confirmNoBtn = document.getElementById('depositConfirmNoBtn');
    const closeBtn = confirmModal.querySelector('.modal-close');
    
    // Resetăm event listeners anteriori dacă există
    const newConfirmYesBtn = confirmYesBtn.cloneNode(true);
    const newConfirmNoBtn = confirmNoBtn.cloneNode(true);
    const newCloseBtn = closeBtn.cloneNode(true);
    
    confirmYesBtn.parentNode.replaceChild(newConfirmYesBtn, confirmYesBtn);
    confirmNoBtn.parentNode.replaceChild(newConfirmNoBtn, confirmNoBtn);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    
    // Adăugăm noile event listeners
    newConfirmYesBtn.addEventListener('click', function() {
        if (hasSufficientFunds) {
            // Ascundem modalul de confirmare
            confirmModal.style.display = 'none';
            
            // Procesăm depozitul
            processDeposit(amount, coinId, symbol);
        }
    });
    
    newConfirmNoBtn.addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });
    
    newCloseBtn.addEventListener('click', function() {
        confirmModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
}

// Funcție pentru procesarea depozitului
function processDeposit(amount, coinId, symbol) {
    // Calculăm valoarea depozitului
    const coinPrice = coinData[coinId] ? coinData[coinId].price : getCurrentPrice(coinId);
    const estimatedValue = amount * coinPrice;
    
    // Scădem din totalBalance (simulăm o plată)
    wallet.totalBalance -= estimatedValue;
    
    // Adăugăm moneda în portofel
    updateAssetAfterDeposit(coinId, amount);
    
    // Adăugăm în istoric
    addTransactionToHistory(coinId, amount);
    
    // Afișăm o notificare
    showNotification(`Successfully deposited ${amount.toFixed(8)} ${symbol}!`, 'success');
    
    // Ascundem modalul de depozit
    document.getElementById('depositModal').style.display = 'none';
}

function getIconContent(coinId) {
    const icons = {
        'bitcoin': '₿',
        'ethereum': 'Ξ',
        'binancecoin': 'B',
        'ripple': 'X',
        'cardano': 'A',
        'solana': 'S',
        'polkadot': 'D',
        'dogecoin': 'Ð'
    };
    
    return icons[coinId.toLowerCase()] || coinId.substring(0, 1).toUpperCase();
}