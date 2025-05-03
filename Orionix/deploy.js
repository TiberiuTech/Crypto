const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  // Citim ABI-ul și bytecode-ul contractului compilat
  const contractJsonPath = './OrionixToken.json';
  
  if (!fs.existsSync(contractJsonPath)) {
    console.error(`Fișierul ${contractJsonPath} nu există. Compilați contractul întâi.`);
    process.exit(1);
  }

  const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
  const abi = contractJson.abi;
  const bytecode = contractJson.bytecode;

  // Conectare la provider (Infura, Alchemy sau alt provider)
  // Utilizăm URL-ul nod Sepolia
  const providerUrl = process.env.PROVIDER_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);

  // Obținem wallet-ul pentru deployare
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Variabila de mediu PRIVATE_KEY nu este setată!");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddress = await wallet.getAddress();
  console.log(`Deploying from address: ${deployerAddress}`);

  // Verificăm soldul înainte de deployare
  const balance = await provider.getBalance(deployerAddress);
  console.log(`Sold ETH: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.eq(0)) {
    console.error("Adresa nu are ETH pentru a deployal pe Sepolia. Obțineți ETH de la un faucet Sepolia.");
    process.exit(1);
  }

  // Creăm contractul
  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  console.log("Deploying OrionixToken...");
  const deployTransaction = await contractFactory.getDeployTransaction(deployerAddress);
  
  // Estimăm costul gas
  const gasEstimate = await provider.estimateGas(deployTransaction);
  console.log(`Estimare gas: ${gasEstimate.toString()}`);
  
  // Obținem gas price
  const gasPrice = await provider.getGasPrice();
  console.log(`Gas price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
  
  // Calculăm costul total estimat
  const costEstimate = gasEstimate.mul(gasPrice);
  console.log(`Cost estimat: ${ethers.utils.formatEther(costEstimate)} ETH`);
  
  // Verificăm dacă avem destui ETH
  if (balance.lt(costEstimate)) {
    console.error(`Sold insuficient: aveți ${ethers.utils.formatEther(balance)} ETH, necesarul este de ${ethers.utils.formatEther(costEstimate)} ETH`);
    process.exit(1);
  }
  
  // Deployăm contractul
  console.log("Trimitem tranzacția de deployare...");
  const contract = await contractFactory.deploy(deployerAddress);
  
  console.log(`Așteptăm confirmarea tranzacției: ${contract.deployTransaction.hash}`);
  await contract.deployed();
  
  console.log(`Contract deployed la adresa: ${contract.address}`);
  
  // Salvăm adresa contractului în orionix-interface.js
  updateContractAddress(contract.address);
  
  console.log("Deployment finalizat cu succes!");
}

function updateContractAddress(address) {
  const filePath = './orionix-interface.js';
  if (!fs.existsSync(filePath)) {
    console.warn(`Nu s-a găsit fișierul ${filePath}. Nu putem actualiza automat adresa contractului.`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern pentru a căuta și înlocui adresa contractului
  const pattern = /(contractAddress\s*:\s*)"[^"]*"/;
  const replacement = `$1"${address}"`;
  
  content = content.replace(pattern, replacement);
  
  fs.writeFileSync(filePath, content);
  console.log(`Adresa contractului a fost actualizată în ${filePath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Eroare la deploymentul contractului:", error);
    process.exit(1);
  }); 