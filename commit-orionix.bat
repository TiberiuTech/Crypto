@echo off
echo Adaugă componentele Orionix în staging...
git add orionix-interface.js
git add ethers.min.js
git add deployment-helper.js
git add hardhat.config.js
git add sample.env
git add OrionixToken.sol
git add contracts/
git add scripts/
git add deploy.js

echo Creare commit pentru componenta Orionix...
git commit -m "Adaugă token ERC-20 Orionix cu interfața de interacțiune"

echo Commit finalizat! Acum poți folosi 'git push' pentru a trimite modificările. 