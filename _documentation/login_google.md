Per integrare il login con Google in FastAPI, possiamo utilizzare **OAuth2 con Google** tramite la libreria `authlib`. Ecco i passi principali:

---

## 🔹 **Passaggi per l'integrazione**
1. **Configurare un OAuth Client su Google Cloud**
2. **Installare la libreria necessaria**
3. **Aggiungere un endpoint per la login con Google**
4. **Gestire la callback e autenticare l'utente**
5. **Generare un token JWT per l'utente**

---

## 🔹 **1. Configurare un OAuth Client su Google Cloud**
Devi registrare la tua applicazione su Google Cloud Console:

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un progetto
3. Attiva il servizio "OAuth 2.0"
4. Crea credenziali OAuth2 con:
   - Tipo di applicazione: **Web**
   - URI di reindirizzamento: `http://localhost:8000/auth/callback`
5. Ottieni `CLIENT_ID` e `CLIENT_SECRET`

---

## 🔹 **2. Installare la libreria necessaria**
Nel tuo ambiente virtuale, installa `authlib`:

```sh
pip install authlib
```

---

## 🔹 **3. Aggiungere un endpoint per il login con Google**
Modifichiamo la tua app FastAPI per includere il flusso OAuth con Google.

```python
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
import os
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from db_config.db_config import get_db
from auth.auth_utils import create_access_token
from models import User
from crud.crud import get_user_by_email, create_user

load_dotenv()

app = FastAPI()

# Configurazione OAuth per Google
oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params={"scope": "openid email profile"},
    access_token_url="https://oauth2.googleapis.com/token",
    client_kwargs={"scope": "openid email profile"},
)

@app.get("/auth/login")
async def auth_login():
    """
    Avvia il login con Google
    """
    redirect_uri = "http://localhost:8000/auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    """
    Callback di Google dopo il login
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.parse_id_token(request, token)

        if not user_info:
            raise HTTPException(status_code=400, detail="Google authentication failed")

        # Verifica se l'utente esiste nel database
        user = get_user_by_email(db, user_info["email"])
        if not user:
            # Se l'utente non esiste, creiamo un nuovo account
            user_data = {
                "username": user_info["name"],
                "email": user_info["email"],
                "password_hash": None,  # Nessuna password poiché usa Google
                "is_verified": True,  # L'email è verificata da Google
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            user = create_user(db, user_data)

        # Genera un token JWT per l'utente
        access_token = create_access_token(data={"sub": user.email})

        return {"access_token": access_token, "token_type": "bearer", "user": user_info}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")
```

---

## 🔹 **4. Come Funziona?**
1. L'utente visita `http://localhost:8000/auth/login`
2. Viene reindirizzato a Google per autenticarsi
3. Dopo il login, Google chiama `http://localhost:8000/auth/callback`
4. La tua app recupera i dati dell'utente e genera un token JWT
5. L'utente è autenticato nella tua app

---

## 🔹 **5. Proteggere gli Endpoint con il Login Google**
Ora possiamo proteggere gli endpoint con il token JWT ricevuto dal login:

```python
from fastapi import Depends
from auth.dependencies import get_current_user

@app.get("/secure-google-data")
def read_secure_google_data(current_user: str = Depends(get_current_user)):
    return {"message": f"Hello, {current_user}! You accessed a protected endpoint with Google login."}
```

---

### ✅ **Ora hai il login con Google integrato in FastAPI!** 🎉  
Se vuoi fare il deploy, dovrai cambiare gli **URI di reindirizzamento** con il tuo dominio effettivo.

Vuoi che integriamo anche il **login con Snipcart o Paddle**? 🚀





scusa e la registrazione invece?



Ottima domanda! Con il login via Google, la **registrazione** può essere gestita automaticamente:  
- Se l'utente esiste già nel database → lo autentichiamo e generiamo un token  
- Se l'utente **non esiste** → lo registriamo automaticamente  

---

## 🔹 **Come Funziona la Registrazione Automatica?**
1. L'utente fa il login con Google
2. Recuperiamo i suoi dati (`email`, `name`, ecc.)
3. Se l'utente **non è nel database**, lo creiamo automaticamente
4. Generiamo un token JWT e lo restituiamo

---

## 🔹 **Modifica della Callback per Gestire la Registrazione**
Aggiorniamo il nostro **endpoint di callback** per gestire sia login che registrazione:

### **🔹 Endpoint `/auth/callback`**
```python
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Request
from auth.auth_utils import create_access_token
from db_config.db_config import get_db
from models import User
from crud.crud import get_user_by_email, create_user

@app.get("/auth/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    """
    Callback di Google per autenticazione e registrazione automatica
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.parse_id_token(request, token)

        if not user_info:
            raise HTTPException(status_code=400, detail="Google authentication failed")

        email = user_info["email"]
        name = user_info["name"]

        # 🔹 Controlliamo se l'utente esiste già
        user = get_user_by_email(db, email)
        
        if not user:
            # Se l'utente NON esiste → REGISTRAZIONE AUTOMATICA
            user_data = {
                "username": name,
                "email": email,
                "password_hash": None,  # Google gestisce l'autenticazione
                "is_verified": True,  # Google verifica le email
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            user = create_user(db, user_data)

        # 🔹 Generiamo il token JWT per l'accesso
        access_token = create_access_token(data={"sub": user.email})

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"email": email, "name": name},
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")
```

---

## 🔹 **Gestione Utenti nel Database**
Dobbiamo assicurarci di avere un modello **User** nel database.  
Se non l'hai ancora, ecco una possibile struttura con SQLAlchemy:

### **🔹 Modello `User`**
```python
from sqlalchemy import Column, String, Boolean, DateTime
from db_config.base import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True, unique=True)
    username = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)  # Solo per utenti non Google
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## 🔹 **Risultato Finale**
✅ Se l'utente esiste → fa il login  
✅ Se l'utente NON esiste → viene creato automaticamente  
✅ Il tutto avviene con un singolo click su "Accedi con Google" 🎉  

---

### 🔹 **Vuoi aggiungere anche un sistema di logout o gestione ruoli?** 🚀