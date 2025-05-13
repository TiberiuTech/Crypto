# Crypto-Platform – Full Documentation

## 1. Project Overview

**Crypto-Platform** is a modern web application designed to provide users with a seamless experience for tracking, trading, and managing cryptocurrencies. The platform features real-time price tracking, news aggregation, wallet management, and a custom ERC-20 token called **Orionix (ORX)**.

---

## 2. Technologies Used

### Frontend
- **HTML5 & CSS3**: Semantic markup and modern, responsive layouts.
- **JavaScript (ES6+)**: For dynamic UI, data fetching, and interactivity.
- **Chart.js**: For rendering interactive price and performance charts.
- **Font Awesome**: For consistent, scalable vector icons.
- **Responsive Design**: Media queries and flexible layouts for mobile and desktop.

### Backend / Blockchain
- **Firebase**: For authentication, user management, and (optionally) real-time database.
- **Ethereum Blockchain**: The Orionix (ORX) token is deployed as an ERC-20 smart contract on the Ethereum network (Testnet: Sepolia).
- **MetaMask**: For wallet connection and blockchain transactions.

### Other
- **LocalStorage**: For theme persistence and user preferences.
- **CDN Libraries**: For fast loading of third-party scripts and styles.

---

## 3. Project Structure

Project root:
- index.html                # Landing page (features, hero, etc.)
- styles.css                # Main global styles
- script.js                 # Main JS logic (UI, theme, etc.)

pages/
- prices.html               # Crypto prices, charts, and stats
- news.html                 # Crypto news aggregation
- wallet.html               # User wallet, balances, transactions
- trade.html                # Trading interface
- orionix.html              # About Orionix token

pages/css/
- prices.css
- news.css
- wallet.css
- trade.css

pages/js/
- prices.js
- news.js
- wallet.js
- trade.js
- firebase-config.js

assets/
- (images, icons, logos)

Orionix/
- orionix-interface.js      # Blockchain interaction logic
- deployment-helper.js      # Deployment scripts for token

---

## 4. Features & Functionality

### 4.1. Landing Page
- **Hero Section**: Gradient title, platform description, and call-to-action.
- **Features Grid**: Highlights wallet, news, trading, and Orionix token.

### 4.2. Prices Page
- **Live Crypto Prices**: Real-time data for major coins.
- **Search & Filter**: Find coins quickly.
- **Charts**: Interactive 24h/7d/30d/1y price charts (Chart.js).
- **Stats Cards**: Market cap, volume, supply, etc.

### 4.3. News Page
- **Aggregated News**: Latest crypto news from multiple sources.
- **Filters**: By category, coin, trading type, and source.
- **Responsive Grid**: Modern card layout for articles.

### 4.4. Wallet Page
- **Balance Overview**: Total and per-coin balances.
- **Quick Actions**: Deposit, withdraw, swap, trade.
- **Transaction History**: Recent and extended logs.
- **Modals**: For deposit, withdraw, swap, and payment.

### 4.5. Trade Page
- **Trading Interface**: Place buy/sell orders, select pairs, view order book.
- **Charts**: Candlestick and line charts for selected pairs.
- **Order Management**: Open orders, trade history, and order actions.

### 4.6. Orionix Token Page
- **About ORX**: Detailed description, supply, contract address, and network.
- **Connect Wallet**: MetaMask integration for viewing and transferring ORX.
- **Token Actions**: Transfer, view balance, and participate in governance (future).

---

## 5. The Orionix (ORX) Token

### 5.1. What is Orionix?
Orionix (ORX) is a custom ERC-20 token created for the Crypto-Platform ecosystem. It is designed for fast, secure, and low-fee transactions, and can be used for platform fees, governance, and exclusive features.

### 5.2. How was ORX created?
- **Smart Contract**: Written in Solidity, following the ERC-20 standard.
- **Deployment**: Deployed on the Ethereum Sepolia Testnet for development and testing.
- **Initial Supply**: 1,000,000 ORX tokens, fixed supply.
- **Security**: The contract is immutable and verified on Etherscan.
- **Ownership**: The contract owner can renounce ownership for full decentralization.

#### Example (Solidity):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Orionix is ERC20 {
    constructor() ERC20("Orionix", "ORX") {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }
}
```

### 5.3. What can ORX do?
- **Pay Platform Fees**: Reduced fees for using ORX.
- **Access Features**: Unlock premium features and analytics.
- **Governance**: Vote on platform proposals (future).
- **Rewards**: Earn ORX through platform activity and referrals.

---

## 6. User Experience (UX) & Design

- **Modern UI**: Gradients, glassmorphism, and smooth transitions.
- **Dark/Light Mode**: Theme toggle with persistence.
- **Accessibility**: Large, readable fonts and high-contrast colors.
- **Mobile-First**: Fully responsive, touch-friendly controls.
- **Animations**: Subtle fade-ins, hover effects, and ripple feedback.

---

## 7. Security & Best Practices

- **MetaMask Integration**: Secure wallet connection, no private keys stored.
- **Input Validation**: All forms and actions are validated client-side.
- **HTTPS**: All API and blockchain calls are made over secure connections.
- **No Sensitive Data**: User data is not stored on the server unless authenticated via Firebase.
