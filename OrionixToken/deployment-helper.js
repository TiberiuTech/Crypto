/**
 * Script pentru actualizarea adresei contractului după deployment în fișierele de interfață
 */
const fs = require('fs');
const path = require('path');

// Adresa contractului obținută după deployment
const contractAddress = process.argv[2];

if (!contractAddress) {
    console.error('Te rog să furnizezi adresa contractului ca argument!');
    console.error('Exemplu: node deployment-helper.js 0x1234567890abcdef1234567890abcdef12345678');
    process.exit(1);
}

// Calea către fișierul de interfață
const interfaceFilePath = path.join(__dirname, '..', 'orionix-interface.js');

// Verificăm dacă fișierul de interfață există
if (!fs.existsSync(interfaceFilePath)) {
    console.error(`Fișierul de interfață nu a fost găsit la: ${interfaceFilePath}`);
    process.exit(1);
}

// Citim conținutul fișierului
let interfaceContent = fs.readFileSync(interfaceFilePath, 'utf8');

// Actualizăm adresa contractului
interfaceContent = interfaceContent.replace(
    /contractAddress: ".*"/,
    `contractAddress: "${contractAddress}"`
);

// Scriem fișierul actualizat
fs.writeFileSync(interfaceFilePath, interfaceContent);

console.log(`Adresa contractului (${contractAddress}) a fost actualizată în orionix-interface.js`);
console.log('');
console.log('IMPORTANT: Pentru a folosi tokenul în interfață:');
console.log('1. Conectați-vă cu MetaMask la Sepolia Testnet');
console.log('2. Importați tokenul în MetaMask folosind adresa contractului');
console.log('3. Accesați pagina Orionix din aplicație pentru a interacționa cu tokenul');
console.log('');
console.log(`Adresă contract: ${contractAddress}`);
console.log(''); 