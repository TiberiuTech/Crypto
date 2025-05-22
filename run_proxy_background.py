import subprocess
import os
import sys
import time
import logging
from datetime import datetime

# Configurare logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    filename='proxy_background.log'
)

def run_proxy_background():
    """Rulează serverul proxy în fundal ca un proces independent"""
    try:
        # Determinăm calea Python curentă
        python_path = sys.executable
        
        # Determinăm directorul curent
        current_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Calea către script-ul proxy
        proxy_script = os.path.join(current_dir, 'proxy_server.py')
        
        # Verificăm dacă fișierul există
        if not os.path.exists(proxy_script):
            print(f"❌ Eroare: Nu s-a găsit fișierul {proxy_script}")
            logging.error(f"Nu s-a găsit fișierul {proxy_script}")
            return False
        
        # Start time
        start_time = datetime.now()
        print(f"⏱️ Pornesc serverul proxy la {start_time.strftime('%H:%M:%S')}")
        
        # Creăm procesul detașat (creationflags disponibil doar pe Windows)
        if os.name == 'nt':  # Windows
            process = subprocess.Popen(
                [python_path, proxy_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW
            )
        else:  # Linux/Mac
            process = subprocess.Popen(
                [python_path, proxy_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True
            )
        
        # Așteptăm puțin pentru a ne asigura că procesul a pornit
        time.sleep(2)
        
        # Verificăm dacă procesul încă rulează
        if process.poll() is None:
            print(f"✅ Serverul proxy rulează în fundal (PID: {process.pid})")
            print(f"📝 Log-urile sunt salvate în 'proxy_background.log'")
            logging.info(f"Serverul proxy pornit cu succes (PID: {process.pid})")
            
            # Afișăm informații despre cum să accesăm interfața
            print("\nℹ️ Poți accesa manual interfața proxy-ului la: http://127.0.0.1:5000")
            print("ℹ️ Proxy-ul va continua să ruleze în fundal până când închizi computerul sau procesul")
            
            return True
        else:
            # Procesul s-a oprit - citim stderr pentru a vedea eroarea
            _, stderr = process.communicate()
            error_msg = stderr.decode('utf-8', errors='ignore')
            print(f"❌ Eroare la pornirea serverului proxy: {error_msg}")
            logging.error(f"Eroare la pornirea serverului: {error_msg}")
            return False
    
    except Exception as e:
        print(f"❌ Eroare neașteptată: {str(e)}")
        logging.error(f"Eroare neașteptată: {str(e)}")
        return False

if __name__ == '__main__':
    # Instalăm dependențele dacă este necesar
    try:
        import requests
        import flask
        import schedule
    except ImportError:
        print("📦 Instalez dependințele necesare...")
        subprocess.call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Rulăm proxy-ul în fundal
    success = run_proxy_background()
    
    if success:
        # Așteptăm un pic înainte de a ieși
        time.sleep(1)
    else:
        print("\n⚠️ Poți încerca să rulezi direct 'python proxy_server.py' pentru a vedea eroarea detaliată")
        input("\nApasă ENTER pentru a ieși...") 