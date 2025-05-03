@echo off
echo Adaugă modificările pentru modul de simulare în staging...
git add orionix-interface.js
git add index.html

echo Creare commit pentru modul de simulare...
git commit -m "Adaugă modul de simulare pentru Orionix token"

echo Commit finalizat! Acum poți folosi 'git push' pentru a trimite modificările. 