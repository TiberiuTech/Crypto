const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const contractJsonPath = './OrionixToken.json';
  
  if (!fs.existsSync(contractJsonPath)) {
    console.error(`File ${contractJsonPath} does not exist. Compile the contract first.`);
    process.exit(1);
  }

  const contractJson = JSON.parse(fs.readFileSync(contractJsonPath, 'utf8'));
  const abi = contractJson.abi;
  const bytecode = contractJson.bytecode;

  const providerUrl = process.env.PROVIDER_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY";
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);

  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("Environment variable PRIVATE_KEY is not set!");
    process.exit(1);
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  const deployerAddress = await wallet.getAddress();
  console.log(`Deploying from address: ${deployerAddress}`);

  const balance = await provider.getBalance(deployerAddress);
  console.log(`ETH balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.eq(0)) {
    console.error("Address does not have ETH to deploy on Sepolia. Get ETH from a Sepolia faucet.");
    process.exit(1);
  }

  const contractFactory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  console.log("Deploying OrionixToken...");
  const deployTransaction = await contractFactory.getDeployTransaction(deployerAddress);
  
  const gasEstimate = await provider.estimateGas(deployTransaction);
  console.log(`Gas estimate: ${gasEstimate.toString()}`);
  
  const gasPrice = await provider.getGasPrice();
  console.log(`Gas price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
  
  const costEstimate = gasEstimate.mul(gasPrice);
  console.log(`Cost estimate: ${ethers.utils.formatEther(costEstimate)} ETH`);
  
  if (balance.lt(costEstimate)) {
    console.error(`Insufficient balance: you have ${ethers.utils.formatEther(balance)} ETH, required ${ethers.utils.formatEther(costEstimate)} ETH`);
    process.exit(1);
  }
  
  console.log("Sending deployment transaction...");
  const contract = await contractFactory.deploy(deployerAddress);
  
  console.log(`Waiting for transaction confirmation: ${contract.deployTransaction.hash}`);
  await contract.deployed();
  
  console.log(`Contract deployed at address: ${contract.address}`);
  
  updateContractAddress(contract.address);
  
  console.log("Deployment successful!");
}

function updateContractAddress(address) {
  const filePath = './orionix-interface.js';
  if (!fs.existsSync(filePath)) {
    console.warn(`File ${filePath} not found. Cannot update contract address automatically.`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  const pattern = /(contractAddress\s*:\s*)"[^"]*"/;
  const replacement = `$1"${address}"`;
  
  content = content.replace(pattern, replacement);
  
  fs.writeFileSync(filePath, content);
  console.log(`Contract address updated in ${filePath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during contract deployment:", error);
    process.exit(1);
  }); 