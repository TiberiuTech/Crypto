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
        
        updateTotalBalance();
        
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
    
    updateTotalBalance();
    
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
    const actionButtons = document.querySelectorAll('.action-button');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.querySelector('span').textContent.toLowerCase();
            
            if (action === 'deposit') {
                document.getElementById('depositModal').style.display = 'block';
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
            } else if (action === 'trade') {
                window.location.href = 'trade.html';
            }
        });
    });
    
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
            
            document.getElementById('depositModal').style.display = 'none';
            
            prepareCardDetailsModal(amount, coin, symbol);
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
    
    updateTotalBalance();
    
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

function updateTotalBalance() {
    let total = 0;
    for (const coin in wallet.coins) {
        total += wallet.coins[coin].value;
    }
    
    wallet.totalBalance = total;
    
    const amountElement = document.querySelector('.balance-amount .amount');
    if (amountElement) {
        amountElement.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function populateWithdrawCoinDropdown() {
    const withdrawCoinSelect = document.getElementById('withdrawCoin');
    const availableAmountElement = document.getElementById('availableAmount');
    const coinSymbolElement = document.getElementById('coinSymbol');
    const feeSymbolElement = document.getElementById('feeSymbol');
    const networkFeeElement = document.getElementById('networkFee');
    
    if (!withdrawCoinSelect) return;
    
    withdrawCoinSelect.innerHTML = '';
    
    if (Object.keys(wallet.coins).length === 0) {
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
    
    Object.keys(wallet.coins).forEach(coinId => {
        const coin = wallet.coins[coinId];
        if (coin.amount > 0) {
            const option = document.createElement('option');
            option.value = coinId;
            option.textContent = `${coin.name} (${coin.ticker})`;
            withdrawCoinSelect.appendChild(option);
        }
    });
    
    if (withdrawCoinSelect.options.length > 0) {
        const selectedCoinId = withdrawCoinSelect.value;
        const selectedCoin = wallet.coins[selectedCoinId];
        
        if (selectedCoin) {
            if (availableAmountElement) availableAmountElement.textContent = selectedCoin.amount.toFixed(8);
            if (coinSymbolElement) coinSymbolElement.textContent = selectedCoin.ticker;
            
            if (networkFeeElement && feeSymbolElement) {
                let fee = 0.0005;
                
                if (selectedCoin.ticker === 'ETH') {
                    fee = 0.005;
                } else if (selectedCoin.ticker === 'BNB') {
                    fee = 0.001;
                } else if (selectedCoin.ticker === 'XRP') {
                    fee = 0.01;
                }
                
                networkFeeElement.textContent = fee.toFixed(6);
                feeSymbolElement.textContent = selectedCoin.ticker;
                
                const feeTextElement = document.querySelector('.fee');
                if (feeTextElement) {
                    feeTextElement.innerHTML = `Network Fee: ~<span id="networkFee">${fee.toFixed(6)}</span> <span id="feeSymbol">${selectedCoin.ticker}</span>`;
                }
            }
        }
    }
}

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
    
    withdrawCoinSelect.addEventListener('change', function() {
        const selectedCoinId = this.value;
        const selectedCoin = wallet.coins[selectedCoinId];
        
        console.log("Withdraw coin changed:", selectedCoinId, selectedCoin);
        
        if (selectedCoin) {
            if (availableAmountElement) availableAmountElement.textContent = selectedCoin.amount.toFixed(8);
            if (coinSymbolElement) coinSymbolElement.textContent = selectedCoin.ticker;
            
            if (networkFeeElement && feeSymbolElement) {
                let fee = 0.0005;
                
                if (selectedCoin.ticker === 'ETH') {
                    fee = 0.005;
                } else if (selectedCoin.ticker === 'BNB') {
                    fee = 0.001;
                } else if (selectedCoin.ticker === 'XRP') {
                    fee = 0.01;
                }
                
                networkFeeElement.textContent = fee.toFixed(6);
                feeSymbolElement.textContent = selectedCoin.ticker;
                
                const feeTextElement = document.querySelector('.fee');
                if (feeTextElement) {
                    feeTextElement.innerHTML = `Network Fee: ~<span id="networkFee">${fee.toFixed(6)}</span> <span id="feeSymbol">${selectedCoin.ticker}</span>`;
                }
            }
        }
    });
    
    if (maxBtn && withdrawAmountInput) {
        maxBtn.addEventListener('click', function() {
            const selectedCoinId = withdrawCoinSelect.value;
            const selectedCoin = wallet.coins[selectedCoinId];
            
            console.log("MAX button clicked for coin:", selectedCoinId);
            
            if (selectedCoin) {
                const networkFee = parseFloat(networkFeeElement ? networkFeeElement.textContent : 0) || 0;
                const maxAmount = Math.max(0, selectedCoin.amount - networkFee);
                
                console.log("Setting max amount:", maxAmount, "networkFee:", networkFee);
                
                withdrawAmountInput.value = maxAmount.toFixed(8);
            }
        });
    }
    
    if (withdrawSubmitBtn) {
        console.log("Adding click event to withdraw button", withdrawSubmitBtn);
        
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
            
            if (!selectedCoinId) {
                console.error('No coin selected');
                return;
            }
            
            if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
                console.error('Invalid amount', withdrawAmountInput.value);
                return;
            }
            
            const selectedCoin = wallet.coins[selectedCoinId];
            
            if (!selectedCoin || selectedCoin.amount < withdrawAmount + networkFee) {
                console.error('Insufficient funds', { 
                    available: selectedCoin ? selectedCoin.amount : 0,
                    requested: withdrawAmount + networkFee
                });
                return;
            }
            
            executeWithdraw(selectedCoinId, withdrawAmount, networkFee);
            
            document.getElementById('withdrawModal').style.display = 'none';
            
            console.log("Withdraw successful and modal closed");
            return false;
        };
    } else {
        console.error("Withdraw button not found!");
        
        const otherButton = document.querySelector('button.submit-btn') || 
                           document.querySelector('button:contains("Withdraw Now")') ||
                           document.querySelector('.wallet-modal button.submit-btn');
        
        if (otherButton) {
            console.log("Found alternative button:", otherButton);
            otherButton.onclick = function() {
                console.log("Alternative withdraw button clicked!");
            };
        }
    }
}

function executeWithdraw(coinId, amount, fee) {
    console.log(`Executing withdraw: ${amount} of ${coinId} with fee ${fee}`);
    
    const coin = wallet.coins[coinId];
    if (!coin) {
        console.error("Coin not found in wallet", coinId);
        return;
    }
    
    const totalAmount = amount + fee;
    
    console.log(`Before withdraw: ${coin.ticker} balance: ${coin.amount}`);

    coin.amount -= totalAmount;
    coin.value = coin.amount * getCurrentPrice(coinId);
    
    console.log(`After withdraw: ${coin.ticker} balance: ${coin.amount}`);
    
    updateTotalBalance();
    
    updateAssetUI(coinId);
    
    addWithdrawToHistory(coinId, amount, fee);
}

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
    
    if (coin.amount <= 0) {
        console.log(`Asset ${coinId} has zero balance, removing from display`);
        
        assetItem.style.transition = "opacity 0.5s ease-out";
        assetItem.style.opacity = "0";
        
        setTimeout(() => {
            if (assetItem.parentNode) {
                assetItem.parentNode.removeChild(assetItem);
            }
            
            const assetsList = document.getElementById('assetsList');
            if (assetsList && assetsList.querySelectorAll('.asset-item').length === 0) {
            }
        }, 500);
        
        return;
    }
    
    const amountElement = assetItem.querySelector('.asset-amount');
    const valueElement = assetItem.querySelector('.asset-value');
    
    if (amountElement) {
        amountElement.textContent = `${coin.amount.toFixed(4)} ${coin.ticker}`;
    }
    
    if (valueElement) {
        valueElement.textContent = `$${coin.value.toFixed(2)}`;
    }
}

function addWithdrawToHistory(coinId, amount, fee) {
    console.log(`Adding withdraw to history: ${amount} ${coinId} (fee: ${fee})`);
    
    const newTransaction = {
        type: 'withdraw',
        coin: coinId,
        amount: amount,
        fee: fee,
        value: amount * getCurrentPrice(coinId),
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
    
    if (transactionsList.firstChild) {
        transactionsList.insertBefore(transactionItem, transactionsList.firstChild);
    } else {
        transactionsList.appendChild(transactionItem);
    }
    
    console.log("Withdraw transaction added to history");
    
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

function removeNoAssetsMessage() {
    const assetsList = document.getElementById('assetsList');
    if (assetsList) {
        const noAssetsMessage = assetsList.querySelector('.no-assets-message');
        if (noAssetsMessage) {
            noAssetsMessage.parentNode.removeChild(noAssetsMessage);
        }
            
        assetsList.style.marginTop = '0';
        assetsList.style.padding = '0';
        
        const assetItems = assetsList.querySelectorAll('.asset-item');
        assetItems.forEach(item => {
            item.style.marginBottom = '8px';
        });
    }
}

function initializeBalanceVisibilityToggle() {
    let toggleBtn = document.getElementById('toggleBalanceBtn');
    let balanceAmount = document.getElementById('balanceAmount');
    let hiddenBalance = document.getElementById('hiddenBalance');
    
    const balanceSection = document.querySelector('.balance-section') || document.querySelector('.wallet-balance');
    
    if (balanceSection) {
        if (!balanceAmount) {
            balanceAmount = balanceSection.querySelector('.balance-amount') || balanceSection.querySelector('.amount');
            
            if (balanceAmount) {
                balanceAmount.id = 'balanceAmount';
            } else {
                const balanceContainer = balanceSection.querySelector('.balance-main') || balanceSection;
                if (balanceContainer) {
                    balanceAmount = document.createElement('div');
                    balanceAmount.id = 'balanceAmount';
                    balanceAmount.className = 'balance-amount';
                    balanceAmount.innerHTML = `<span class="currency">$</span><span class="amount">${wallet.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>`;
                    balanceContainer.appendChild(balanceAmount);
                }
            }
        }
        
        if (!hiddenBalance) {
            const balanceContainer = balanceSection.querySelector('.balance-main') || balanceSection;
            if (balanceContainer) {
                hiddenBalance = document.createElement('div');
                hiddenBalance.id = 'hiddenBalance';
                hiddenBalance.className = 'balance-amount hidden';
                hiddenBalance.innerHTML = '<span class="currency">$</span><span class="amount">•••••</span>';
                hiddenBalance.style.display = 'none';
                balanceContainer.appendChild(hiddenBalance);
            }
        }
        
        if (!toggleBtn) {
            const balanceHeader = balanceSection.querySelector('.balance-header') || balanceSection;
            if (balanceHeader) {
                toggleBtn = document.createElement('button');
                toggleBtn.id = 'toggleBalanceBtn';
                toggleBtn.className = 'toggle-balance-btn';
                toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
                toggleBtn.title = 'Hide Balance';
                toggleBtn.style.background = 'transparent';
                toggleBtn.style.border = 'none';
                toggleBtn.style.cursor = 'pointer';
                toggleBtn.style.fontSize = '18px';
                toggleBtn.style.color = 'var(--text-color, #fff)';
                balanceHeader.appendChild(toggleBtn);
            }
        }
    }
    
    if (!toggleBtn || !balanceAmount || !hiddenBalance) {
        console.error('Balance visibility toggle elements not found');
        return;
    }
    
    let isVisible = true;
    
    toggleBtn.addEventListener('click', function() {
        isVisible = !isVisible;
        
        if (isVisible) {
            balanceAmount.style.display = '';
            hiddenBalance.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.title = 'Hide Balance';
        } else {
            balanceAmount.style.display = 'none';
            hiddenBalance.style.display = '';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            toggleBtn.title = 'Show Balance';
        }
    });
}

function prepareCardDetailsModal(amount, coin, symbol) {
    const estimatedValue = amount * getCurrentPrice(coin);
    
    document.getElementById('cardPaymentAmount').textContent = estimatedValue.toFixed(2);
    document.getElementById('cardPaymentCrypto').textContent = amount.toFixed(8);
    document.getElementById('cardPaymentSymbol').textContent = symbol;
    
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s+/g, '');
            
            if (/[^\d]/.test(value)) {
                value = value.replace(/[^\d]/g, '');
            }
            
            let formattedValue = '';
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            
            const cursorPosition = e.target.selectionStart;
            const difference = formattedValue.length - e.target.value.length;
            e.target.value = formattedValue;

            e.target.setSelectionRange(cursorPosition + difference, cursorPosition + difference);
        });
    }
    
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d]/g, '');
            
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            
            if (value.length > 5) {
                value = value.substring(0, 5);
            }
            
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
    
    const processPaymentBtn = document.getElementById('processPaymentBtn');
    if (processPaymentBtn) {
        const newProcessBtn = processPaymentBtn.cloneNode(true);
        processPaymentBtn.parentNode.replaceChild(newProcessBtn, processPaymentBtn);
        
        newProcessBtn.addEventListener('click', () => {
            const cardNumber = document.getElementById('cardNumber').value;
            const cardExpiry = document.getElementById('cardExpiry').value;
            const cardCVV = document.getElementById('cardCVV').value;
            const cardName = document.getElementById('cardName').value;
            
            if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
                console.log('Validation would happen here');
            }
            
            newProcessBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            newProcessBtn.disabled = true;
            
            setTimeout(() => {
                document.getElementById('cardDetailsModal').style.display = 'none';
                
                showPaymentConfirmation(amount, estimatedValue, coin, symbol);
                
                updateAssetAfterDeposit(coin, amount);
                
                addTransactionToHistory(coin, amount);
            }, 2000);
        });
    }
    
    const cardDetailsModal = document.getElementById('cardDetailsModal');
    if (cardDetailsModal) {
        cardDetailsModal.style.display = 'block';
        
        document.getElementById('cardNumber').value = '';
        document.getElementById('cardExpiry').value = '';
        document.getElementById('cardCVV').value = '';
        document.getElementById('cardName').value = '';
    }
}

function showPaymentConfirmation(amount, paymentAmount, coin, symbol) {
    const txId = 'TX' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    
    document.getElementById('confirmationAmount').textContent = paymentAmount.toFixed(2);
    document.getElementById('confirmationCrypto').textContent = amount.toFixed(8);
    document.getElementById('confirmationSymbol').textContent = symbol;
    document.getElementById('confirmationTxId').textContent = txId;
    
    const doneBtn = document.getElementById('confirmationDoneBtn');
    if (doneBtn) {
        const newDoneBtn = doneBtn.cloneNode(true);
        doneBtn.parentNode.replaceChild(newDoneBtn, doneBtn);
        
        newDoneBtn.addEventListener('click', () => {
            document.getElementById('paymentConfirmationModal').style.display = 'none';
        });
    }
    
    const confirmationModal = document.getElementById('paymentConfirmationModal');
    if (confirmationModal) {
        confirmationModal.style.display = 'block';
    }
}

function startPriceFluctuation() {
    if (!coinPrices.btc || coinPrices.btc === 0) coinPrices.btc = 47000 + Math.random() * 5000;
    if (!coinPrices.eth || coinPrices.eth === 0) coinPrices.eth = 1800 + Math.random() * 500;
    if (!coinPrices.orx || coinPrices.orx === 0) coinPrices.orx = 4.5 + Math.random() * 1;
    
    updateUI();
    
    setInterval(() => {
        fluctuatePrices();
        
        updateCoinValues();
        
        updateUI();
    }, 10000);
}

function fluctuatePrices() {
    const btcChange = (Math.random() - 0.5) * 0.01;
    const ethChange = (Math.random() - 0.5) * 0.01;
    const orxChange = (Math.random() - 0.5) * 0.01;
    
    coinPrices.btc = coinPrices.btc * (1 + btcChange);
    coinPrices.eth = coinPrices.eth * (1 + ethChange);
    coinPrices.orx = coinPrices.orx * (1 + orxChange);
    
    updateExchangeRates();
    
    if (wallet.coins.bitcoin) {
        wallet.coins.bitcoin.change += btcChange * 100;
        wallet.coins.bitcoin.change = Math.min(10, Math.max(-10, wallet.coins.bitcoin.change));
    }
    
    if (wallet.coins.ethereum) {
        wallet.coins.ethereum.change += ethChange * 100;
        wallet.coins.ethereum.change = Math.min(10, Math.max(-10, wallet.coins.ethereum.change));
    }
    
    if (wallet.coins.orx) {
        wallet.coins.orx.change += orxChange * 100;
        wallet.coins.orx.change = Math.min(10, Math.max(-10, wallet.coins.orx.change));
    }
    
    wallet.change = (wallet.change || 2.45) + (Math.random() - 0.5) * 0.1;
    wallet.change = Math.min(5, Math.max(-3, wallet.change));
}

function updateCoinValues() {
    for (const coinId in wallet.coins) {
        const coin = wallet.coins[coinId];
        const price = getCurrentPrice(coinId);
        coin.value = coin.amount * price;
    }
}

function updateUI() {
    updateTotalBalance();
    
    const changeElement = document.querySelector('.balance-change span');
    if (changeElement && wallet.change !== undefined) {
        changeElement.textContent = Math.abs(wallet.change).toFixed(2) + '%';
        
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
    
    for (const coinId in wallet.coins) {
        const assetItem = findAssetElement(coinId);
        if (assetItem) {
            updateAssetUI(coinId);
        }
    }
    saveWalletToStorage();
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
        
        updateTotalBalance();
        
        console.log("XRP value fixed in current memory:", wallet.coins.ripple);
    } else {
        console.log("No XRP in current wallet.");
    }
    
    updateUI();
    return "XRP value fix completed, check updated values!";
};