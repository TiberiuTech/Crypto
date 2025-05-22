# Server Proxy pentru API

Acest server proxy pentru API este construit cu Flask pentru a reduce numărul de cereri către API-uri externe prin cache-ing și combinarea cererilor. Contribuie la evitarea limitărilor de rate (rate limiting) din partea API-urilor precum CoinGecko.

## Funcționalități Noi

- **Prefetch Automat**: Serverul extrage automat cele mai importante date la fiecare 15 minute, indiferent dacă sunt cerute sau nu.
- **Cache Extins la 30 minute**: Datele sunt păstrate în cache pentru 30 de minute pentru a reduce și mai mult numărul de cereri.
- **Rate Limiting Local**: Se asigură că nu se fac mai mult de o cerere la 5 secunde către același API.
- **Reîncărcare Automată**: După golirea cache-ului, datele importante sunt automat reîncărcate în fundal.
- **Job Scheduler**: Sistem automat de programare a task-urilor pentru menținerea datelor proaspete.

## Funcționalități Existente
- **Cache optimizat**: Răspunsurile API sunt stocate temporar pentru a reduce numărul de cereri.
- **Toleranță la erori**: Folosește multiple surse API alternative și returnează date din cache când API-urile eșuează.
- **Thread-safety**: Operațiuni pe cache protejate pentru utilizare concurentă.
- **Logging**: Înregistrare detaliată a activității pentru depanare ușoară.
- **Cereri în lot (batch)**: Permite combinarea mai multor cereri API într-una singură.
- **Pagină de status**: Monitorizarea stării serverului și a cache-ului în timp real.
- **Headers aleatorii**: Evită detectarea ca bot prin rotația user-agent-urilor.

## Instalare

1. Instalați dependințele:
```bash
pip install -r requirements.txt
```

2. Rulați serverul:
```bash
python proxy_server.py
```

Serverul va rula pe `http://localhost:5000`.

## Cum funcționează prefetch-ul automat

Serverul proxy preîncarcă date din următoarele surse la fiecare 15 minute:

- **Prețuri BTC & ETH**: Asigură disponibilitatea continuă a prețurilor pentru Bitcoin și Ethereum
- **Stare piață globală**: Informații generale despre piața crypto
- **Monede populare**: Lista monedelor în tendință

Acest sistem asigură că site-ul va funcționa chiar și când API-urile externe sunt indisponibile sau au probleme de rate limiting.

## Utilizare

### 1. Proxy pentru API individual

```javascript
// În loc de a apela direct API-ul
fetch('https://api.coingecko.com/api/v3/coins/bitcoin')
  .then(response => response.json())
  .then(data => console.log(data));

// Folosește proxy-ul 
fetch('http://localhost:5000/api/proxy?url=https://api.coingecko.com/api/v3/coins/bitcoin')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 2. Endpoint dedicat pentru prețuri

```javascript
// Endpoint optimizat cu multiple surse de rezervă
fetch('http://localhost:5000/api/prices')
  .then(response => response.json())
  .then(data => console.log(data));

// Cu parametri opționali
fetch('http://localhost:5000/api/prices?vs_currency=eur&per_page=10&ids=bitcoin,ethereum,tether')
  .then(response => response.json())
  .then(data => console.log(data));
```

### 3. Cereri în lot (batch)

```javascript
// În loc de a face mai multe cereri separate
fetch('http://localhost:5000/api/batch', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urls: [
      'https://api.coingecko.com/api/v3/coins/bitcoin',
      'https://api.coingecko.com/api/v3/coins/ethereum',
      'https://api.coingecko.com/api/v3/global'
    ]
  }),
})
.then(response => response.json())
.then(data => {
  // Datele pentru fiecare URL sunt disponibile ca proprietăți ale obiectului răspuns
  console.log(data['https://api.coingecko.com/api/v3/coins/bitcoin']);
});
```

### 4. Gestionarea cache-ului

```javascript
// Vizualizarea stării cache-ului
fetch('http://localhost:5000/api/cache/status')
  .then(response => response.json())
  .then(data => console.log(data));

// Golirea cache-ului când este necesar
fetch('http://localhost:5000/api/cache/clear', {
  method: 'POST'
})
.then(response => response.json())
.then(data => console.log(data));
```

## Integrare cu proiectul Crypto

Pentru integrarea completă, s-au făcut următoarele modificări:

1. **Verificare stare proxy**: A fost adăugat `check_proxy.js` care afișează un indicator în colțul dreapta-jos, arătând dacă proxy-ul este activ și numărul de intrări din cache.

2. **Refactorizare script.js**: Funcția `fetchCryptoData()` a fost actualizată pentru a folosi endpoint-ul `/api/prices` al proxy-ului.

3. **Eliminarea erorilor 429**: Soluție completă pentru eliminarea erorilor "Too Many Requests" prin:
   - Prefetch automat proactiv
   - Cache extins la 30 minute
   - Rate limiting local
   - Multiple surse alternative
   - Date de backup pentru orice situație

## Arhitectura serverului

```
┌─────────────────┐     ┌──────────────────┐
│ Website Frontend │────▶│ API Proxy Server │
└─────────────────┘     │ (Flask)          │
                        └───────┬──────────┘
                          ┌─────┴─────┐
                          ▼           ▼
                 ┌────────────┐  ┌──────────────┐
                 │ Cache      │  │ Job Scheduler│
                 │ (30 min)   │  │ (15 min)     │
                 └──────┬─────┘  └───────┬──────┘
                        │                │
                        │  ┌─────────────┘
                        │  │
                        ▼  ▼
                     ┌───────────┐
                     │ Prefetch  │
                     │ Engine    │
                     └─────┬─────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ API Sources      │
                  ├──────────────────┤
                  │ 1. CoinGecko     │
                  │ 2. CryptoCompare │
                  │ 3. Fallback data │
                  └──────────────────┘
```

## Observații și bune practici

- **Producție**: Pentru producție, folosiți Gunicorn sau alt server WSGI.
  ```bash
  gunicorn -w 4 -b 0.0.0.0:5000 proxy_server:app
  ```

- **Memorie**: Monitorizați memoria, deoarece cache-ul este stocat în RAM. Pentru servere cu trafic mare, considerați Redis ca back-end pentru cache.

- **Programarea prefetch-ului**: Puteți ajusta intervalul de prefetch din codul sursă (variabila `cache_refresh_interval`).

- **Scalare**: Pentru multiple instanțe, considerați un cache distribuit cu Redis sau Memcached.

- **Întreținere**: Verificați periodic dacă API-urile externe și-au schimbat formatul sau endpoint-urile. 