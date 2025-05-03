/**
 * Helper pentru deployarea contractului Orionix Token pe rețeaua Sepolia
 * 
 * Acest script te ghidează prin procesul de deployment al contractului Orionix Token
 * pe rețeaua de test Sepolia, folosind Hardhat.
 */

const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// Crează o interfață readline pentru interacțiunea cu utilizatorul
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Funcție pentru a pune o întrebare utilizatorului
function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

// Funcție pentru a afișa titluri formatate
function displayTitle(title) {
  console.log('\n' + '='.repeat(80));
  console.log(' ' + title);
  console.log('='.repeat(80) + '\n');
}

// Funcție pentru a genera un fișier .env nou
async function createEnvFile() {
  console.log('\nCreare fișier .env pentru configurarea deployment-ului...');
  
  if (fs.existsSync('.env')) {
    const overwrite = await askQuestion('Fișierul .env există deja. Doriți să îl suprascrieți? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Se folosește fișierul .env existent.');
      return;
    }
  }
  
  // Obținem configurația de la utilizator
  console.log('\nAveți nevoie de următoarele informații:');
  console.log('1. O cheie privată pentru un cont cu fonduri pe Sepolia');
  console.log('2. Un URL pentru accesarea rețelei Sepolia (Infura, Alchemy etc.)');
  console.log('3. Opțional: Un API key pentru Etherscan (pentru verificarea contractului)\n');
  
  let privateKey = await askQuestion('Introduceți cheia privată (fără 0x prefix): ');
  // Verificăm formatul cheii private
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.substring(2);
  }
  
  if (privateKey.length !== 64) {
    console.log('\n⚠️ ATENȚIE: Cheia privată nu are 64 de caractere (32 de bytes). Este posibil să fie invalidă.');
    const proceed = await askQuestion('Doriți să continuați? (y/n): ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Deployment anulat.');
      process.exit(1);
    }
  }
  
  let rpcUrl = await askQuestion('Introduceți URL-ul RPC pentru Sepolia (sau apăsați Enter pentru a folosi URL-ul public): ');
  if (!rpcUrl) {
    rpcUrl = 'https://ethereum-sepolia.publicnode.com';
    console.log(`Se folosește URL-ul public: ${rpcUrl}`);
  }
  
  let etherscanKey = await askQuestion('Introduceți API key-ul Etherscan (opțional, apăsați Enter pentru a sări): ');
  
  // Scriem configurația în fișierul .env
  const envContent = `# Configurare pentru deployment pe Sepolia testnet
# Adăugată de scriptul deployment-helper.js la ${new Date().toLocaleString()}
PRIVATE_KEY=${privateKey}
SEPOLIA_RPC_URL=${rpcUrl}
ETHERSCAN_API_KEY=${etherscanKey}
`;

  fs.writeFileSync('.env', envContent);
  console.log('\n✅ Fișierul .env a fost creat cu succes.');
}

// Funcție pentru a compila contractul
async function compileContract() {
  console.log('\nCompilare contract...');
  
  try {
    execSync('npx hardhat clean', { stdio: 'inherit' });
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log('✅ Compilare reușită!');
    return true;
  } catch (error) {
    console.error('\n❌ Eroare la compilare:', error.message);
    return false;
  }
}

// Funcție pentru a deploiya contractul
async function deployContract() {
  console.log('\nDeployment contract Orionix Token pe rețeaua Sepolia...');
  console.log('⚠️ Asigurați-vă că aveți fonduri suficiente pe contul din .env pentru a plăti taxa de gas.');
  
  const proceed = await askQuestion('Continuați cu deployment-ul? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('Deployment anulat.');
    return false;
  }
  
  try {
    console.log('\nSe execută deployment...');
    execSync('npx hardhat run ./deploy.js --network sepolia', { stdio: 'inherit' });
    console.log('\n✅ Deployment reușit!');
    
    // Citim fișierul orionix-interface.js pentru a verifica adresa contractului
    const interfaceFilePath = path.join(__dirname, 'orionix-interface.js');
    if (fs.existsSync(interfaceFilePath)) {
      const content = fs.readFileSync(interfaceFilePath, 'utf8');
      const match = content.match(/contractAddress\s*:\s*"(0x[a-fA-F0-9]+)"/);
      
      if (match && match[1] && match[1] !== '0x0000000000000000000000000000000000000000') {
        console.log(`\nAdresa contractului: ${match[1]}`);
        console.log('Adresa a fost actualizată automat în fișierul orionix-interface.js');
        
        // Actualizăm și flag-ul contractDeployed
        const updatedContent = content.replace(
          /contractDeployed\s*:\s*false/,
          'contractDeployed: true'
        );
        fs.writeFileSync(interfaceFilePath, updatedContent);
        
        return true;
      } else {
        console.log('\n⚠️ Adresa contractului nu a fost actualizată în orionix-interface.js');
        return false;
      }
    } else {
      console.log('\n⚠️ Nu s-a găsit fișierul orionix-interface.js');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Eroare la deployment:', error.message);
    return false;
  }
}

// Funcție pentru a verifica existența și configurația MetaMask
async function checkMetaMask() {
  console.log('\nPentru a interacționa cu contractul Orionix Token, veți avea nevoie de:');
  console.log('1. Extensia MetaMask instalată în browser');
  console.log('2. Un cont în MetaMask configurat pentru rețeaua Sepolia');
  console.log('3. ETH Sepolia în contul dvs. (puteți obține de la un faucet)\n');
  
  const hasMM = await askQuestion('Aveți MetaMask instalat și configurat pentru Sepolia? (y/n): ');
  if (hasMM.toLowerCase() !== 'y') {
    console.log('\nVă recomandăm să:');
    console.log('1. Instalați MetaMask de la https://metamask.io/');
    console.log('2. Adăugați rețeaua Sepolia în MetaMask');
    console.log('3. Obțineți ETH Sepolia de la un faucet precum https://sepolia-faucet.pk910.de/\n');
  }
}

// Funcție pentru a verifica existența fișierelor necesare
function checkProjectFiles() {
  const requiredFiles = [
    './contracts/OrionixToken.sol',
    './scripts/deploy.js',
    './hardhat.config.js',
    './orionix-interface.js'
  ];
  
  let allFilesExist = true;
  
  console.log('\nVerificare fișiere necesare:');
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} există`);
    } else {
      console.log(`❌ ${file} lipsește`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

// Funcție principală pentru execuția scriptului
async function main() {
  try {
    displayTitle('DEPLOYMENT HELPER PENTRU ORIONIX TOKEN');
    
    console.log('Acest script vă va ghida prin procesul de deployment al contractului Orionix Token');
    console.log('pe rețeaua de test Sepolia folosind Hardhat.\n');
    
    // Verificăm fișierele necesare
    const filesOk = checkProjectFiles();
    if (!filesOk) {
      console.log('\n⚠️ Unele fișiere necesare lipsesc. Vă rugăm să verificați structura proiectului.');
      const proceed = await askQuestion('Doriți să continuați oricum? (y/n): ');
      if (proceed.toLowerCase() !== 'y') {
        console.log('Deployment anulat.');
        return;
      }
    }
    
    // Creare fișier .env
    await createEnvFile();
    
    // Compilare contract
    const compileOk = await compileContract();
    if (!compileOk) {
      console.log('\n⚠️ Compilarea a eșuat. Verificați erorile și încercați din nou.');
      return;
    }
    
    // Verificare MetaMask
    await checkMetaMask();
    
    // Deployment contract
    const deployOk = await deployContract();
    
    if (deployOk) {
      console.log('\n🎉 Felicitări! Contractul Orionix Token a fost deploiat cu succes.');
      console.log('\nUrmătorii pași:');
      console.log('1. Deschideți index.html în browser');
      console.log('2. Conectați-vă cu MetaMask folosind butonul "Conectează MetaMask"');
      console.log('3. Interacționați cu contractul Orionix Token\n');
    } else {
      console.log('\n⚠️ Deployment-ul nu a fost complet. Verificați erorile și încercați din nou.');
    }
    
  } catch (error) {
    console.error('\n❌ A apărut o eroare neașteptată:', error);
  } finally {
    rl.close();
  }
}

// Rulăm funcția principală
main(); 