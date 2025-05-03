# Proiect OrionixToken

Acest proiect implementează un token ERC-20 personalizat numit Orionix (ORX) utilizând contracte inteligente Solidity și framework-ul Hardhat.

## Configurare

1. Clonează repository-ul
2. Instalează dependențele:
   ```shell
   npm install
   ```
3. Redenumește fișierul `config.env.example` în `.env` și completează:
   - `PRIVATE_KEY`: Cheia privată a portofelului tău (fără 0x)
   - `SEPOLIA_RPC_URL`: URL-ul furnizorului RPC pentru Sepolia (implicit folosim un nod public)
   - `ETHERSCAN_API_KEY`: Opțional, pentru verificarea contractului

## Compilare și Testare

```shell
# Compilează contractele
npm run compile

# Rulează testele
npm run test

# Pornește un nod local Hardhat
npm run node
```

## Deployment

### Local (pentru testare)
```shell
npm run deploy:local
```

### Testnet (Sepolia)
```shell
npm run deploy:sepolia
```

## Despre Token

- Nume: Orionix
- Simbol: ORX
- Decimale: 18 (standard)
- Supply inițial: 1,000,000 ORX

Proprietarul tokenului poate emite tokeni suplimentari folosind funcția `mint`.

## Adresa de contact
Adresa creatorului: 0x9807C001b13521041aD3dbdda59e25bE074Eb63d
