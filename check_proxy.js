// Script pentru verificarea disponibilității serverului proxy
(function() {
    const proxyUrl = 'http://127.0.0.1:5000/api/cache/status';
    
    async function checkProxyServer() {
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Serverul proxy este disponibil');
                console.log(`✅ Cache curent: ${data.cache_entries} intrări`);
                
                // Adaugă un indicator vizual că proxy-ul este activ
                showProxyStatus(true, data.cache_entries);
            } else {
                console.error('❌ Serverul proxy a răspuns cu eroare:', response.status);
                showProxyStatus(false);
            }
        } catch (error) {
            console.error('❌ Serverul proxy nu este disponibil:', error);
            showProxyStatus(false);
            showProxyWarning();
        }
    }
    
    function showProxyStatus(isActive, cacheEntries = 0) {
        // Eliminăm un indicator anterior, dacă există
        const existingStatus = document.getElementById('proxy-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Creează un indicator pentru a arăta starea proxy-ului
        const statusElement = document.createElement('div');
        statusElement.id = 'proxy-status';
        statusElement.style.position = 'fixed';
        statusElement.style.bottom = '10px';
        statusElement.style.right = '10px';
        statusElement.style.padding = '8px 12px';
        statusElement.style.borderRadius = '4px';
        statusElement.style.backgroundColor = isActive ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)';
        statusElement.style.color = 'white';
        statusElement.style.fontWeight = 'bold';
        statusElement.style.fontSize = '12px';
        statusElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
        statusElement.style.zIndex = '9999';
        statusElement.style.display = 'flex';
        statusElement.style.alignItems = 'center';
        statusElement.style.gap = '6px';
        
        // Adaugă un dot indicator
        statusElement.innerHTML = `
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: white;"></div>
            <div>Proxy ${isActive ? 'Activ' : 'Inactiv'}</div>
            ${isActive ? `<span style="margin-left: 3px; font-size: 10px; opacity: 0.9;">(${cacheEntries} în cache)</span>` : ''}
        `;
        
        // Adaugă un tooltip
        statusElement.title = isActive ? 
            `Serverul proxy este activ cu ${cacheEntries} intrări în cache. API-ul nu va fi limitat.` : 
            'Serverul proxy nu este activ - site-ul poate întâmpina erori 429 (Too Many Requests)';
        
        // Adaugă eventListener pentru a afișa detalii când se face clic pe el
        statusElement.style.cursor = 'pointer';
        statusElement.addEventListener('click', function() {
            const existingDetails = document.getElementById('proxy-details');
            if (existingDetails) {
                existingDetails.remove();
                return;
            }
            
            if (isActive) {
                showProxyDetails(cacheEntries);
            }
        });
        
        // Adaugă elementul la DOM
        document.body.appendChild(statusElement);
    }
    
    function showProxyDetails(cacheEntries) {
        // Creează un panou de detalii
        const detailsElement = document.createElement('div');
        detailsElement.id = 'proxy-details';
        detailsElement.style.position = 'fixed';
        detailsElement.style.bottom = '50px';
        detailsElement.style.right = '10px';
        detailsElement.style.padding = '15px';
        detailsElement.style.borderRadius = '6px';
        detailsElement.style.backgroundColor = 'rgba(31, 41, 55, 0.95)';
        detailsElement.style.color = 'white';
        detailsElement.style.maxWidth = '300px';
        detailsElement.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
        detailsElement.style.zIndex = '9998';
        
        detailsElement.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 14px;">Detalii Server Proxy</h3>
            <div style="margin-bottom: 8px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <strong>Status:</strong>
                    <span style="color: #10b981;">Activ</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <strong>Cache:</strong>
                    <span>${cacheEntries} intrări</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <strong>Durată cache:</strong>
                    <span>5 minute</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <strong>API-uri:</strong>
                    <span>CoinGecko, CryptoCompare</span>
                </div>
            </div>
            <div style="font-size: 10px; opacity: 0.7; text-align: right; margin-top: 8px;">Click pentru a închide</div>
        `;
        
        // Adaugă event listener pentru închidere
        detailsElement.addEventListener('click', function() {
            detailsElement.remove();
        });
        
        // Adaugă elementul la DOM
        document.body.appendChild(detailsElement);
    }
    
    function showProxyWarning() {
        // Eliminăm un avertisment anterior, dacă există
        const existingWarning = document.getElementById('proxy-warning');
        if (existingWarning) {
            existingWarning.remove();
        }
        
        // Creează un mesaj de avertizare
        const warningElement = document.createElement('div');
        warningElement.id = 'proxy-warning';
        warningElement.style.position = 'fixed';
        warningElement.style.top = '70px';
        warningElement.style.left = '50%';
        warningElement.style.transform = 'translateX(-50%)';
        warningElement.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
        warningElement.style.color = 'white';
        warningElement.style.padding = '10px 20px';
        warningElement.style.borderRadius = '4px';
        warningElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        warningElement.style.zIndex = '9999';
        warningElement.style.maxWidth = '600px';
        warningElement.style.textAlign = 'center';
        
        warningElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">Serverul proxy nu este pornit!</div>
                    <div>Site-ul poate întâmpina erori 429 (Too Many Requests). Pornește serverul proxy cu comanda:</div>
                    <code style="display: block; background: rgba(0,0,0,0.2); padding: 5px; margin-top: 5px; font-family: monospace;">python proxy_server.py</code>
                </div>
                <button id="close-warning" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">×</button>
            </div>
        `;
        
        // Adaugă elementul la DOM
        document.body.appendChild(warningElement);
        
        // Adaugă event listener pentru închiderea avertismentului
        document.getElementById('close-warning').addEventListener('click', function() {
            warningElement.remove();
        });
    }
    
    // Rulează verificarea după ce documentul a fost încărcat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkProxyServer);
    } else {
        checkProxyServer();
    }
    
    // Reîmprospătează starea la fiecare 30 de secunde
    setInterval(checkProxyServer, 30000);
})(); 