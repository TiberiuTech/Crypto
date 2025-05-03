require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // Rețeaua locală Hardhat pentru dezvoltare și testare
    hardhat: {},
    
    // Configurație pentru testnet Sepolia
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    }
  },
  
  // Configurații pentru surse Etherscan pentru verificare
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  
  // Setări pentru solidity-coverage
  mocha: {
    timeout: 40000,
  },
  
  // Adăugăm path-uri pentru contracte, teste, etc.
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
}; 