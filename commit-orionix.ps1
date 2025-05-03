Write-Host "Adaugă componentele Orionix în staging..." -ForegroundColor Cyan

git add orionix-interface.js
git add ethers.min.js
git add deployment-helper.js
git add hardhat.config.js
git add sample.env
git add OrionixToken.sol
git add contracts/
git add scripts/
git add deploy.js

Write-Host "Creare commit pentru componenta Orionix..." -ForegroundColor Green
git commit -m "Adaugă token ERC-20 Orionix cu interfața de interacțiune"

Write-Host "Commit finalizat! Acum poți folosi 'git push' pentru a trimite modificările." -ForegroundColor Yellow 