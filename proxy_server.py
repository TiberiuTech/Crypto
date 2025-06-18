from flask import Flask, request, jsonify, Response
import requests
import json
from datetime import datetime, timedelta
import os
import time
import random
from flask_cors import CORS
import threading
import logging
import schedule  # Import pentru programarea task-urilor
import concurrent.futures  # Pentru rularea task-urilor în paralel

# Configurare logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

app = Flask(__name__)
CORS(app)  # Activare CORS pentru toate rutele

# Cache pentru stocarea răspunsurilor API
cache = {}
cache_lock = threading.Lock()  # Lock pentru operațiuni thread-safe pe cache
cache_duration = 1800  # Măresc durata cache-ului la 30 minute pentru a reduce radical cererile
cache_refresh_interval = 900  # Reîmprospătare în fundal la fiecare 15 minute

# Rate limiter pentru a limita numărul de cereri care ajung la API
# Limităm la maxim 1 cerere per API la fiecare 5 secunde
rate_limits = {}
rate_limit_lock = threading.Lock()
RATE_LIMIT_INTERVAL = 5  # secunde între cereri către același API

# Configurare pentru retry și rate limiting
MAX_RETRIES = 5  # Măresc numărul de încercări
RETRY_DELAY = 2  # secunde
USE_LAST_VALID_RESPONSE = True  # Returnăm ultimul răspuns valid din cache când API-ul eșuează

# Configurare pentru prefetch
PREFETCH_ENABLED = True
IMPORTANT_ENDPOINTS = [
    {
        "name": "bitcoin_price",
        "url": "https://api.coingecko.com/api/v3/coins/markets",
        "params": {
            "vs_currency": "usd",
            "ids": "bitcoin,ethereum",
            "order": "market_cap_desc",
            "per_page": "50",
            "page": "1",
            "sparkline": "false",
            "price_change_percentage": "24h"
        },
        "processor": None  # Va folosi procesarea implicită
    },
    {
        "name": "global_market",
        "url": "https://api.coingecko.com/api/v3/global",
        "params": None,
        "processor": None
    },
    {
        "name": "trending_coins",
        "url": "https://api.coingecko.com/api/v3/search/trending",
        "params": None,
        "processor": None
    }
]

# Date de backup pentru când toate încercările eșuează
FALLBACK_PRICES_DATA = [
    {
        "id": "bitcoin",
        "symbol": "btc",
        "name": "Bitcoin",
        "image": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
        "current_price": 95940,
        "market_cap": 750000000000,
        "market_cap_rank": 1,
        "total_volume": 21900000000,
        "price_change_percentage_24h": -1.03,
        "sparkline_in_7d": {"price": []}
    },
    {
        "id": "ethereum",
        "symbol": "eth",
        "name": "Ethereum",
        "image": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
        "current_price": 1825.0,
        "market_cap": 265000000000,
        "market_cap_rank": 2,
        "total_volume": 10500000000,
        "price_change_percentage_24h": -0.47,
        "sparkline_in_7d": {"price": []}
    }
]

@app.route('/')
def home():
    """Ruta principală cu instrucțiuni de bază"""
    return """
    <html>
        <head>
            <title>Server Proxy API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
                h1 { color: #333; }
                .endpoint { margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #3498db; }
                code { background-color: #f8f8f8; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
                .status { margin-top: 30px; padding: 10px; background-color: #e8f7f0; border-radius: 5px; }
                .status-good { color: #2ecc71; }
                .prefetch { margin-top: 20px; background-color: #f0f8ff; padding: 10px; border-radius: 5px; }
                .stats { display: flex; justify-content: space-between; margin-top: 20px; }
                .stat-box { flex: 1; margin: 0 10px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; text-align: center; }
                .stat-box h4 { margin-top: 0; }
            </style>
        </head>
        <body>
            <h1>Server Proxy API pentru Crypto Platform</h1>
            <p>Acest server proxy ajută la reducerea numărului de cereri către API-uri externe.</p>
            
            <div class="endpoint">
                <h3>1. API Proxy General: <code>/api/proxy?url=URL_ENCODED</code></h3>
                <p>Exemplu: <code>/api/proxy?url=https://api.coingecko.com/api/v3/coins/bitcoin</code></p>
            </div>
            
            <div class="endpoint">
                <h3>2. Cereri în Lot: <code>/api/batch</code> (POST)</h3>
                <p>Trimite un array de URL-uri pentru procesare simultană</p>
            </div>
            
            <div class="endpoint">
                <h3>3. Prețuri Criptomonede: <code>/api/prices</code></h3>
                <p>Endpoint optimizat pentru prețurile criptomonedelor</p>
                <p>Parametri opționali: vs_currency, order, per_page, page, sparkline, ids</p>
            </div>
            
            <div class="endpoint">
                <h3>4. Golire Cache: <code>/api/cache/clear</code> (POST)</h3>
                <p>Forțează reîmprospătarea datelor din cache</p>
            </div>
            
            <div class="endpoint">
                <h3>5. Stare Cache: <code>/api/cache/status</code></h3>
                <p>Verifică starea și dimensiunea cache-ului</p>
            </div>
            
            <div class="prefetch">
                <h3>Prefetch Automat</h3>
                <p>Serverul extrage automat datele următoarelor endpoint-uri la fiecare 15 minute:</p>
                <ul>
                    <li>Prețuri Bitcoin & Ethereum</li>
                    <li>Stare Piață Globală</li>
                    <li>Criptomonede Populare</li>
                </ul>
                <p>Acest mecanism asigură că datele sunt mereu disponibile chiar dacă API-urile externe au probleme.</p>
            </div>
            
            <div class="status">
                <h3>Stare server: <span class="status-good">Activ ✓</span></h3>
                <div class="stats">
                    <div class="stat-box">
                        <h4>Cache</h4>
                        <div id="cache-count">0</div>
                        <div style="font-size: 12px; opacity: 0.7;">intrări</div>
                    </div>
                    <div class="stat-box">
                        <h4>Durata Cache</h4>
                        <div>30</div>
                        <div style="font-size: 12px; opacity: 0.7;">minute</div>
                    </div>
                    <div class="stat-box">
                        <h4>Ultima Actualizare</h4>
                        <div id="last-update" style="font-size: 14px;">""" + datetime.now().strftime("%H:%M:%S") + """</div>
                        <div style="font-size: 12px; opacity: 0.7;">""" + datetime.now().strftime("%Y-%m-%d") + """</div>
                    </div>
                </div>
                <script>
                    // Auto-refresh pentru pagina home
                    setInterval(() => {
                        fetch('/api/cache/status')
                            .then(res => res.json())
                            .then(data => {
                                document.getElementById('cache-count').textContent = data.cache_entries;
                                document.getElementById('last-update').textContent = data.last_update.split(' ')[1];
                            });
                    }, 5000);
                </script>
            </div>
        </body>
    </html>
    """

def get_random_headers():
    """Generează headere aleatorii pentru a evita detectarea ca bot"""
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ]
    
    return {
        'User-Agent': random.choice(user_agents),
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Origin': 'https://www.google.com',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }

def can_make_request(api_domain):
    """Verifică dacă se poate face o cerere către un anumit API folosind rate limiting"""
    with rate_limit_lock:
        current_time = time.time()
        
        # Extragem domeniul din URL pentru rate limiting
        if api_domain not in rate_limits:
            rate_limits[api_domain] = 0
            return True
        
        # Verificăm dacă a trecut suficient timp de la ultima cerere
        if current_time - rate_limits[api_domain] >= RATE_LIMIT_INTERVAL:
            rate_limits[api_domain] = current_time
            return True
        
        return False

def make_request_with_retry(url, params=None):
    """Funcție pentru a face cereri cu retry și gestionare avansată a erorilor"""
    # Extragem domeniul pentru rate limiting
    from urllib.parse import urlparse
    parsed_url = urlparse(url)
    api_domain = parsed_url.netloc
    
    # Verificăm rate limit-ul
    if not can_make_request(api_domain):
        logging.warning(f"⚠️ Rate limit local atins pentru {api_domain}, așteptăm...")
        time.sleep(RATE_LIMIT_INTERVAL)
    
    for attempt in range(MAX_RETRIES):
        try:
            # Adăugăm header-uri pentru a evita detecția ca bot
            headers = get_random_headers()
            
            # Adăugăm un delay aleator pentru a evita detecția de cereri automatizate
            if attempt > 0:
                time.sleep(RETRY_DELAY * (1 + attempt))
            
            # Facem cererea cu timeout și verificare SSL
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=10,
                verify=True
            )
            
            # Verificăm codul de răspuns
            if response.status_code == 429:  # Too Many Requests
                logging.warning(f"⚠️ Rate limit API atins pentru {api_domain}, așteptăm...")
                time.sleep(RETRY_DELAY * (2 ** attempt))  # Exponential backoff
                continue
                
            response.raise_for_status()
            
            # Încercăm să decodăm JSON-ul
            try:
                data = response.json()
                logging.info(f"✅ Cerere reușită către {api_domain}")
                return data
            except json.JSONDecodeError as e:
                logging.error(f"❌ Eroare decodare JSON de la {api_domain}: {e}")
                if attempt == MAX_RETRIES - 1:
                    raise
                continue
                
        except requests.exceptions.RequestException as e:
            logging.error(f"❌ Eroare cerere către {api_domain}: {e}")
            if attempt == MAX_RETRIES - 1:
                raise
            continue
            
    raise Exception(f"Toate încercările au eșuat pentru {url}")

def get_cache_with_lock(key, default=None):
    """Obține o valoare din cache cu lock pentru thread safety"""
    with cache_lock:
        return cache.get(key, default)

def set_cache_with_lock(key, value):
    """Setează o valoare în cache cu lock pentru thread safety"""
    with cache_lock:
        cache[key] = value

def prefetch_important_data():
    """
    Funcție pentru a prelua și stoca în cache datele importante în fundal,
    astfel încât să fie întotdeauna disponibile.
    """
    if not PREFETCH_ENABLED:
        return
    
    logging.info("🔄 Începe prefetch pentru endpoint-urile importante...")
    
    # Folosim un executor pentru a face cererile în paralel
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = []
        
        for endpoint in IMPORTANT_ENDPOINTS:
            futures.append(
                executor.submit(
                    prefetch_single_endpoint,
                    endpoint["name"],
                    endpoint["url"],
                    endpoint["params"],
                    endpoint["processor"]
                )
            )
        
        # Așteptăm terminarea tuturor cererilor
        for future in concurrent.futures.as_completed(futures):
            try:
                endpoint_name, success = future.result()
                if success:
                    logging.info(f"✅ Prefetch reușit pentru {endpoint_name}")
                else:
                    logging.warning(f"⚠️ Prefetch eșuat pentru {endpoint_name}")
            except Exception as e:
                logging.error(f"❌ Eroare la prefetch: {e}")
    
    logging.info(f"🔄 Prefetch complet. Următorul prefetch în {cache_refresh_interval // 60} minute.")

def prefetch_single_endpoint(name, url, params, processor):
    """
    Face un singur prefetch pentru un endpoint specific.
    Returnează numele endpoint-ului și un boolean care indică succesul.
    """
    try:
        # Construiește cache key-ul
        if params:
            query_string = "&".join([f"{k}={v}" for k, v in params.items()])
            cache_key = f"{url}?{query_string}"
        else:
            cache_key = url
        
        # Face cererea
        data = make_request_with_retry(url, params)
        
        # Aplică procesarea dacă este specificată
        if processor and callable(processor):
            data = processor(data)
        
        # Salvează în cache
        set_cache_with_lock(cache_key, (datetime.now(), data))
        
        return name, True
    except Exception as e:
        logging.error(f"❌ Eroare la prefetch pentru {name}: {e}")
        return name, False

def schedule_prefetch_jobs():
    """Programează job-urile de prefetch"""
    if PREFETCH_ENABLED:
        # Rulăm imediat la pornirea serverului
        threading.Thread(target=prefetch_important_data).start()
        
        # Programăm să ruleze regulat
        schedule.every(cache_refresh_interval).seconds.do(
            lambda: threading.Thread(target=prefetch_important_data).start()
        )
        
        # Thread separat pentru a rula scheduler-ul
        def run_scheduler():
            while True:
                schedule.run_pending()
                time.sleep(1)
        
        scheduler_thread = threading.Thread(target=run_scheduler)
        scheduler_thread.daemon = True
        scheduler_thread.start()
        
        logging.info(f"🕒 Prefetch automat programat la fiecare {cache_refresh_interval // 60} minute")

@app.route('/api/proxy', methods=['GET'])
def proxy():
    """
    Endpoint proxy pentru apeluri API.
    Parametri:
    - url: URL-ul API-ului țintă
    - cache_time: timpul opțional de caching în secunde
    """
    target_url = request.args.get('url')
    if not target_url:
        return jsonify({'error': 'URL parametru lipsă'}), 400
    
    # Verifică timpul de cache personalizat
    cache_time = request.args.get('cache_time')
    if cache_time and cache_time.isdigit():
        current_cache_duration = int(cache_time)
    else:
        current_cache_duration = cache_duration
    
    # Verifică dacă răspunsul este în cache și dacă este încă valid
    cached_data = get_cache_with_lock(target_url)
    if cached_data:
        cache_time, cache_data = cached_data
        if datetime.now() < cache_time + timedelta(seconds=current_cache_duration):
            logging.info(f"✅ Folosesc date din cache pentru {target_url[:50]}...")
            return jsonify(cache_data)
    
    # Dacă nu există în cache sau a expirat, face cererea API
    try:
        logging.info(f"🌐 Preiau date noi pentru {target_url[:50]}...")
        data = make_request_with_retry(target_url)
        
        # Salvează răspunsul în cache
        set_cache_with_lock(target_url, (datetime.now(), data))
        
        return jsonify(data)
    except Exception as e:
        logging.error(f"❌ Eroare la preluarea datelor: {e}")
        
        # Dacă avem date în cache, le returnăm pe acelea chiar dacă au expirat
        cached_data = get_cache_with_lock(target_url)
        if USE_LAST_VALID_RESPONSE and cached_data:
            logging.warning(f"⚠️ Returnez ultimele date valide din cache pentru {target_url[:50]}")
            return jsonify(cached_data[1])
        
        return jsonify({'error': str(e), 'message': 'Nu s-au putut prelua date noi și nu există date în cache'}), 500

@app.route('/api/batch', methods=['POST'])
def batch():
    """
    Endpoint pentru cereri API în lot.
    Așteaptă un array de URL-uri în corpul cererii.
    """
    data = request.get_json()
    if not data or 'urls' not in data:
        return jsonify({'error': 'Array-ul de URL-uri lipsă'}), 400
    
    urls = data['urls']
    results = {}
    
    for url in urls:
        # Verifică dacă răspunsul este în cache și dacă este încă valid
        cached_data = get_cache_with_lock(url)
        if cached_data:
            cache_time, cache_data = cached_data
            if datetime.now() < cache_time + timedelta(seconds=cache_duration):
                results[url] = cache_data
                continue
        
        # Dacă nu există în cache sau a expirat, face cererea API
        try:
            logging.info(f"🌐 Preiau date noi pentru {url[:50]}...")
            data = make_request_with_retry(url)
            
            # Salvează răspunsul în cache
            set_cache_with_lock(url, (datetime.now(), data))
            
            results[url] = data
        except Exception as e:
            logging.error(f"❌ Eroare la preluarea datelor în batch: {e}")
            
            # Dacă avem date în cache, le returnăm pe acelea chiar dacă au expirat
            cached_data = get_cache_with_lock(url)
            if USE_LAST_VALID_RESPONSE and cached_data:
                logging.warning(f"⚠️ Returnez ultimele date valide din cache pentru {url[:50]}")
                results[url] = cached_data[1]
            else:
                results[url] = {'error': str(e)}
    
    return jsonify(results)

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Endpoint pentru golirea cache-ului."""
    with cache_lock:
        cache.clear()
    
    # După golirea cache-ului, inițiem un prefetch pentru a reîncărca datele importante
    if PREFETCH_ENABLED:
        threading.Thread(target=prefetch_important_data).start()
    
    return jsonify({'success': True, 'message': 'Cache golit cu succes, repopulare date în curs'})

@app.route('/api/cache/status', methods=['GET'])
def cache_status():
    """Endpoint pentru verificarea stării cache-ului."""
    with cache_lock:
        cache_entries = len(cache)
        cache_keys = list(cache.keys())[:10]  # Primele 10 chei pentru exemplificare
        
        # Calculam vechimea medie a datelor din cache
        now = datetime.now()
        cache_age_seconds = 0
        if cache_entries > 0:
            for key in cache:
                cache_time, _ = cache[key]
                cache_age_seconds += (now - cache_time).total_seconds()
            cache_age_seconds = cache_age_seconds / cache_entries
    
    with rate_limit_lock:
        rate_limit_stats = {}
        current_time = time.time()
        for domain, last_request_time in rate_limits.items():
            rate_limit_stats[domain] = {
                "last_request": int(current_time - last_request_time),
                "can_request": (current_time - last_request_time) >= RATE_LIMIT_INTERVAL
            }
    
    return jsonify({
        'success': True,
        'cache_entries': cache_entries,
        'sample_keys': cache_keys,
        'cache_age_avg_seconds': int(cache_age_seconds) if cache_entries > 0 else 0,
        'prefetch_enabled': PREFETCH_ENABLED,
        'prefetch_interval_minutes': cache_refresh_interval // 60,
        'rate_limits': rate_limit_stats,
        'last_update': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# Rută specifică pentru prețurile CoinGecko - direct compatibilă cu aplicația existentă
@app.route('/api/prices', methods=['GET'])
def get_prices():
    """
    Endpoint specific pentru prețurile CoinGecko, complet compatibil cu aplicația existentă.
    Acceptă și parametrul 'ids' pentru a filtra monedele.
    """
    coingecko_url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        "vs_currency": request.args.get('vs_currency', 'usd'),
        "order": request.args.get('order', 'market_cap_desc'),
        "per_page": request.args.get('per_page', '50'),  # Măresc la 50 pentru a acoperi mai multe monede
        "page": request.args.get('page', '1'),
        "sparkline": request.args.get('sparkline', 'false'),
        "price_change_percentage": request.args.get('price_change_percentage', '24h')
    }
    
    # Dacă sunt specificate ID-uri, le adăugăm la parametri
    if request.args.get('ids'):
        params['ids'] = request.args.get('ids')
    
    # Construiește URL-ul complet pentru cache key
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    cache_key = f"{coingecko_url}?{query_string}"
    
    # Verifică dacă răspunsul este în cache și dacă este încă valid
    cached_data = get_cache_with_lock(cache_key)
    if cached_data:
        cache_time, cache_data = cached_data
        if datetime.now() < cache_time + timedelta(seconds=cache_duration):
            logging.info("✅ Folosesc date din cache pentru prețuri")
            return jsonify(cache_data)
    
    # Alternăm între multiple surse de date pentru redundanță
    api_sources = [
        # Sursă primară: CoinGecko markets API - folosind proxy dedicat
        lambda: make_request_with_retry(coingecko_url, params),
        
        # Sursă secundară: CoinGecko simple price API
        lambda: convert_simple_price_format(
            make_request_with_retry(
                "https://api.coingecko.com/api/v3/simple/price",
                {
                    "ids": params.get('ids', 'bitcoin,ethereum'),
                    "vs_currencies": "usd",
                    "include_market_cap": "true",
                    "include_24hr_vol": "true",
                    "include_24hr_change": "true"
                }
            )
        ),
        
        # Sursă terțiară: CryptoCompare API
        lambda: convert_cryptocompare_format(
            make_request_with_retry(
                "https://min-api.cryptocompare.com/data/pricemultifull",
                {
                    "fsyms": "BTC,ETH",
                    "tsyms": "USD"
                }
            )
        )
    ]
    
    # Încercăm fiecare sursă pe rând
    last_error = None
    for source_index, source_fn in enumerate(api_sources):
        try:
            logging.info(f"🌐 Încercarea #{source_index+1}: Preiau date de la sursa de prețuri...")
            data = source_fn()
            
            # Validăm datele primite
            if not isinstance(data, list) or len(data) == 0:
                raise ValueError("Datele primite nu sunt în formatul așteptat")
            
            # Salvează răspunsul în cache
            set_cache_with_lock(cache_key, (datetime.now(), data))
            
            return jsonify(data)
        except Exception as e:
            last_error = e
            logging.warning(f"⚠️ Sursa #{source_index+1} a eșuat: {e}")
            continue  # Încercăm următoarea sursă
    
    # Toate sursele au eșuat, verificăm dacă avem date în cache
    cached_data = get_cache_with_lock(cache_key)
    if USE_LAST_VALID_RESPONSE and cached_data:
        logging.warning(f"⚠️ Toate sursele au eșuat. Returnez ultimele date valide din cache pentru prețuri")
        return jsonify(cached_data[1])
    
    # Nu avem date în cache, returnăm datele de backup
    logging.error(f"❌ Toate sursele au eșuat și nu există date în cache. Returnez datele de backup.")
    return jsonify(FALLBACK_PRICES_DATA)

def convert_simple_price_format(simple_price_data):
    """Convertește datele din formatul simple/price în formatul markets"""
    result = []
    
    if 'bitcoin' in simple_price_data:
        result.append({
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "image": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
            "current_price": simple_price_data['bitcoin']['usd'],
            "market_cap": simple_price_data['bitcoin'].get('usd_market_cap', 0),
            "market_cap_rank": 1,
            "total_volume": simple_price_data['bitcoin'].get('usd_24h_vol', 0),
            "price_change_percentage_24h": simple_price_data['bitcoin'].get('usd_24h_change', 0),
            "sparkline_in_7d": {"price": []}
        })
    
    if 'ethereum' in simple_price_data:
        result.append({
            "id": "ethereum",
            "symbol": "eth",
            "name": "Ethereum",
            "image": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
            "current_price": simple_price_data['ethereum']['usd'],
            "market_cap": simple_price_data['ethereum'].get('usd_market_cap', 0),
            "market_cap_rank": 2,
            "total_volume": simple_price_data['ethereum'].get('usd_24h_vol', 0),
            "price_change_percentage_24h": simple_price_data['ethereum'].get('usd_24h_change', 0),
            "sparkline_in_7d": {"price": []}
        })
    
    return result

def convert_cryptocompare_format(cryptocompare_data):
    """Convertește datele din formatul CryptoCompare în formatul CoinGecko markets"""
    result = []
    
    if 'RAW' in cryptocompare_data and 'BTC' in cryptocompare_data['RAW'] and 'USD' in cryptocompare_data['RAW']['BTC']:
        btc_data = cryptocompare_data['RAW']['BTC']['USD']
        result.append({
            "id": "bitcoin",
            "symbol": "btc",
            "name": "Bitcoin",
            "image": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
            "current_price": btc_data.get('PRICE', 0),
            "market_cap": btc_data.get('MKTCAP', 0),
            "market_cap_rank": 1,
            "total_volume": btc_data.get('VOLUME24HOUR', 0),
            "price_change_percentage_24h": btc_data.get('CHANGEPCT24HOUR', 0),
            "sparkline_in_7d": {"price": []}
        })
    
    if 'RAW' in cryptocompare_data and 'ETH' in cryptocompare_data['RAW'] and 'USD' in cryptocompare_data['RAW']['ETH']:
        eth_data = cryptocompare_data['RAW']['ETH']['USD']
        result.append({
            "id": "ethereum",
            "symbol": "eth",
            "name": "Ethereum",
            "image": "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
            "current_price": eth_data.get('PRICE', 0),
            "market_cap": eth_data.get('MKTCAP', 0),
            "market_cap_rank": 2,
            "total_volume": eth_data.get('VOLUME24HOUR', 0),
            "price_change_percentage_24h": eth_data.get('CHANGEPCT24HOUR', 0),
            "sparkline_in_7d": {"price": []}
        })
    
    return result

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Endpoint nu a fost găsit"}), 404

@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Eroare internă de server", "details": str(e)}), 500

if __name__ == '__main__':
    # Instalează pachetele necesare dacă lipsesc
    try:
        import schedule
    except ImportError:
        logging.info("Instalez pachetul 'schedule'...")
        import pip
        pip.main(['install', 'schedule'])
        import schedule
    
    # Inițiem prefetch-ul și job-urile programate
    schedule_prefetch_jobs()
    
    print("🚀 Server proxy pornit pe http://127.0.0.1:5000/")
    logging.info("Server proxy pornit")
    # Pentru producție, folosește un server WSGI precum Gunicorn
    app.run(debug=False, port=5000, host='127.0.0.1')