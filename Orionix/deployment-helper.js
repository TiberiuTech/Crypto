const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function displayTitle(title) {
  console.log('\n' + '='.repeat(80));
  console.log(' ' + title);
  console.log('='.repeat(80) + '\n');
}

async function createEnvFile() {
  console.log('\nCreating .env file...');
  
  if (fs.existsSync('.env')) {
    const overwrite = await askQuestion('File .env already exists. Do you want to overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Using existing .env file.');
      return;
    }
  }
  
  console.log('\nYou need the following information:');
  console.log('1. A private key for a Sepolia account with funds');
  console.log('2. An URL for accessing the Sepolia network (Infura, Alchemy etc.)');
  console.log('3. Optional: An Etherscan API key (for contract verification)\n');
  
  let privateKey = await askQuestion('Enter your private key (without 0x prefix): ');
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.substring(2);
  }
  
  if (privateKey.length !== 64) {
    console.log('\nWARNING: The private key does not have 64 characters (32 bytes). It may be invalid.');
    const proceed = await askQuestion('Do you want to continue? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Deployment cancelled.');
      process.exit(1);
    }
  }
  
  let rpcUrl = await askQuestion('Enter the RPC URL for Sepolia (or press Enter to use the public URL): ');
  if (!rpcUrl) {
    rpcUrl = 'https://ethereum-sepolia.publicnode.com';
    console.log(`Using public URL: ${rpcUrl}`);
  }
  
  let etherscanKey = await askQuestion('Enter the Etherscan API key (optional, press Enter to skip): ');
  
  const envContent = `# Configuration for deployment on Sepolia testnet
# Added by deployment-helper.js at ${new Date().toLocaleString()}
PRIVATE_KEY=${privateKey}
SEPOLIA_RPC_URL=${rpcUrl}
ETHERSCAN_API_KEY=${etherscanKey}
`;

  fs.writeFileSync('.env', envContent);
  console.log('\n✅ .env file created successfully.');
}

// Function to compile the contract
async function compileContract() {
  console.log('\nCompiling contract...');
  
  try {
    execSync('npx hardhat clean', { stdio: 'inherit' });
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log('✅ Compilation successful!');
    return true;
  } catch (error) {
    console.error('\n❌ Compilation error:', error.message);
    return false;
  }
}

// Function to deploy the contract
async function deployContract() {
  console.log('\nDeploying Orionix Token on Sepolia network...');
  console.log('⚠️ Ensure you have enough funds in the account from .env to pay for gas.');
  
  const proceed = await askQuestion('Continue with deployment? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Deployment cancelled.');
    return false;
  }
  
  try {
    console.log('\nExecuting deployment...');
    execSync('npx hardhat run ./deploy.js --network sepolia', { stdio: 'inherit' });
    console.log('\nDeployment successful!');
    
    const interfaceFilePath = path.join(__dirname, 'orionix-interface.js');
    if (fs.existsSync(interfaceFilePath)) {
      const content = fs.readFileSync(interfaceFilePath, 'utf8');
      const match = content.match(/contractAddress\s*:\s*"(0x[a-fA-F0-9]+)"/);
      
      if (match && match[1] && match[1] !== '0x0000000000000000000000000000000000000000') {
        console.log(`\nContract address: ${match[1]}`);
        console.log('Address has been automatically updated in orionix-interface.js');
        
        const updatedContent = content.replace(
          /contractDeployed\s*:\s*false/,
          'contractDeployed: true'
        );
        fs.writeFileSync(interfaceFilePath, updatedContent);
        
        return true;
      } else {
        console.log('\n⚠️ Contract address not updated in orionix-interface.js');
        return false;
      }
    } else {
      console.log('\n⚠️ orionix-interface.js file not found');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Deployment error:', error.message);
    return false;
  }
}

// Function to check the existence and configuration of MetaMask
async function checkMetaMask() {
  console.log('\nTo interact with the Orionix Token contract, you will need:');
  console.log('1. The MetaMask extension installed in your browser');
  console.log('2. A MetaMask account configured for the Sepolia network');
  console.log('3. ETH Sepolia in your account (you can get it from a faucet)\n');
  
  const hasMM = await askQuestion('Do you have MetaMask installed and configured for Sepolia? (y/n): ');
  if (hasMM.toLowerCase() !== 'y') {
    console.log('\nWe recommend:');
    console.log('1. Install MetaMask from https://metamask.io/');
    console.log('2. Add the Sepolia network to MetaMask');
    console.log('3. Get ETH Sepolia from a faucet like https://sepolia-faucet.pk910.de/\n');
  }
}

// Function to check the existence of required files
function checkProjectFiles() {
  const requiredFiles = [
    './contracts/OrionixToken.sol',
    './scripts/deploy.js',
    './hardhat.config.js',
    './orionix-interface.js'
  ];
  
  let allFilesExist = true;
  
  console.log('\nChecking required files:');
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`${file} exists`);
    } else {
      console.log(`${file} is missing`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

async function main() {
  try {
    displayTitle('DEPLOYMENT HELPER FOR ORIONIX TOKEN');
    
    console.log('This script will guide you through the process of deploying the Orionix Token contract');
    console.log('on the Sepolia test network using Hardhat.\n');
    
    const filesOk = checkProjectFiles();
    if (!filesOk) {
      console.log('\nSome required files are missing. Please check the project structure.');
      const proceed = await askQuestion('Do you want to continue anyway? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Deployment cancelled.');
        return;
      }
    }
    
    await createEnvFile();
    
    const compileOk = await compileContract();
    if (!compileOk) {
      console.log('\nCompilation failed. Please check the errors and try again.');
      return;
    }
    
    await checkMetaMask();
    
    const deployOk = await deployContract();
    
    if (deployOk) {
      console.log('\n🎉 Congratulations! The Orionix Token contract has been deployed successfully.');
      console.log('\nNext steps:');
      console.log('1. Open index.html in your browser');
      console.log('2. Connect with MetaMask using the "Connect MetaMask" button');
      console.log('3. Interact with the Orionix Token contract\n');
    } else {
      console.log('\nDeployment failed. Please check the errors and try again.');
    }
    
  } catch (error) {
    console.error('\n❌ An unexpected error occurred:', error);
  } finally {
    rl.close();
  }
}

main(); 