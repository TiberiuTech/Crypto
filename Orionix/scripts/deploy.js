const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying OrionixToken...");
  
  // Obținem adresa pentru deployer (prima adresă din semneri)
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying from address: ${deployer.address}`);
  
  // Obținem soldul pentru a verifica dacă avem destul ETH
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Sold ETH: ${ethers.formatEther(balance)} ETH`);
  
  // Deployăm contractul
  const OrionixToken = await ethers.getContractFactory("OrionixToken");
  const token = await OrionixToken.deploy(deployer.address);
  await token.waitForDeployment();
  
  const tokenAddress = await token.getAddress();
  console.log(`Contract deployed la adresa: ${tokenAddress}`);
  
  // Salvăm adresa contractului în orionix-interface.js
  updateContractAddress(tokenAddress);
  
  console.log("Deployment finalizat cu succes!");
}

function updateContractAddress(address) {
  const filePath = path.join(__dirname, '..', 'orionix-interface.js');
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