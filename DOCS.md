Snipcart supporta la vendita di abbonamenti utilizzando prodotti ricorrenti. Puoi configurare un prodotto in abbonamento direttamente nel tuo frontend Jekyll specificando i parametri richiesti da Snipcart, come il ciclo di fatturazione (settimanale/mensile).

### Passaggi per gestire gli abbonamenti con Snipcart:

1. **Configurare il prodotto come abbonamento**  
   Nel tuo codice Jekyll, definisci il pulsante di acquisto includendo i parametri di abbonamento di Snipcart:
   ```html
   <button class="snipcart-add-item"
       data-item-id="oroscopo-mensile"
       data-item-name="Abbonamento Oroscopo Mensile"
       data-item-price="9.99"
       data-item-recurring-interval="1 month"
       data-item-recurring="true"
       data-item-url="/prodotti/oroscopo-mensile">
       Abbonati
   </button>
   ```
   Per un abbonamento settimanale, cambia `data-item-recurring-interval="1 week"`.

2. **Gestire la generazione dell'oroscopo con FastAPI**  
   Dopo l'acquisto, Snipcart ti permette di ricevere webhook sugli eventi di pagamento. Puoi usare il webhook `subscription.created` per attivare la generazione automatica dell'oroscopo per il cliente.

3. **Webhook per automatizzare la consegna**  
   Configura un webhook in Snipcart che notifichi il tuo backend FastAPI quando un nuovo pagamento di abbonamento è andato a buon fine. Nel backend, puoi inviare l'oroscopo via email o renderlo disponibile in un'area riservata.

4. **Autenticazione degli utenti**  
   Snipcart gestisce automaticamente gli utenti iscritti. Puoi usare la funzione di autenticazione Snipcart per permettere agli abbonati di accedere alla loro area personale e consultare gli oroscopi.

Vuoi aiuto su una parte specifica, come la configurazione dei webhook o l'integrazione con FastAPI?



Perfetto! Divideremo il lavoro in due parti:  

1. **Configurazione dei webhook su Snipcart**  
2. **Gestione delle richieste webhook con FastAPI per inviare l'oroscopo agli utenti**

---

### **1. Configurazione dei Webhook su Snipcart**
Snipcart offre webhook che notificano il tuo backend sugli eventi importanti, come la creazione di un abbonamento o il pagamento di una rata.

#### **Passaggi:**
1. Vai su **Snipcart Dashboard** → **Developer** → **Webhooks**.
2. Clicca su **Add new webhook**.
3. Inserisci l'URL del tuo backend FastAPI che riceverà la richiesta, ad esempio:  
   ```
   https://mio-backend.com/webhook/subscription
   ```
4. Seleziona gli eventi da monitorare, in particolare:
   - `subscription.created` → Quando un utente acquista un abbonamento.
   - `subscription.renewed` → Quando un pagamento ricorrente viene completato con successo.
   - `subscription.cancelled` → Se l'utente annulla l'abbonamento.

5. Salva il webhook. Ora Snipcart invierà notifiche al tuo FastAPI ogni volta che si verifica uno di questi eventi.

---

### **2. Gestione dei Webhook in FastAPI**
Dobbiamo ora creare un endpoint in FastAPI per ricevere i webhook e inviare l'oroscopo all'utente.

#### **Installiamo le dipendenze necessarie**
Se non lo hai già fatto, assicurati di avere `FastAPI` e `uvicorn` installati:
```bash
pip install fastapi uvicorn requests
```

#### **Creiamo il file `webhooks.py`**
```python
from fastapi import FastAPI, Request, HTTPException
import json

app = FastAPI()

@app.post("/webhook/subscription")
async def handle_subscription_webhook(request: Request):
    payload = await request.json()
    
    event_type = payload.get("eventName")
    subscription_data = payload.get("content", {})

    if not subscription_data:
        raise HTTPException(status_code=400, detail="Invalid webhook payload")

    customer_email = subscription_data.get("user", {}).get("email")
    subscription_id = subscription_data.get("id")

    if event_type == "subscription.created":
        message = f"Nuovo abbonamento creato! Invio l'oroscopo a {customer_email}"
        send_horoscope(customer_email)

    elif event_type == "subscription.renewed":
        message = f"Pagamento ricorrente confermato per {customer_email}. Invio nuovo oroscopo."
        send_horoscope(customer_email)

    elif event_type == "subscription.cancelled":
        message = f"Abbonamento annullato per {customer_email}. Niente più oroscopi."

    else:
        message = f"Evento non gestito: {event_type}"

    print(message)
    return {"message": message}

def send_horoscope(email):
    """
    Funzione per inviare l'oroscopo all'utente via email.
    Qui puoi integrare un servizio come SendGrid, Mailgun o SMTP.
    """
    print(f"Invio oroscopo a {email}")  
    # Qui va l'integrazione con il sistema di invio email.
```

---

### **3. Configurare FastAPI per ricevere Webhook**
Ora avvia FastAPI:
```bash
uvicorn webhooks:app --host 0.0.0.0 --port 8000
```
Se usi un server pubblico, assicurati che il dominio sia accessibile da Snipcart.

---

### **4. Integrazione con il Sistema di Invio Email**
Nel metodo `send_horoscope(email)`, devi implementare un sistema per inviare l'oroscopo via email.  
Puoi usare un servizio come **SendGrid**, **Mailgun** o SMTP.

Ad esempio, con **SendGrid**:
```bash
pip install sendgrid
```
E nel codice:
```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

SENDGRID_API_KEY = "TUA_CHIAVE_API"

def send_horoscope(email):
    message = Mail(
        from_email="tuo@email.com",
        to_emails=email,
        subject="Il tuo oroscopo",
        html_content="<p>Ecco il tuo oroscopo del mese!</p>")  

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"Email inviata a {email}: {response.status_code}")
    except Exception as e:
        print(f"Errore nell'invio dell'email: {e}")
```

---

### **Conclusione**
🔹 Snipcart invierà un webhook a FastAPI quando un cliente si abbona.  
🔹 FastAPI riceverà la notifica e invierà l'oroscopo via email.  
🔹 Se l'abbonamento viene rinnovato, verrà automaticamente mandato un nuovo oroscopo.  

📌 **Vuoi aggiungere un'area riservata per gli utenti dove scaricare gli oroscopi?** 🚀




Snipcart raccoglie già i dati di base dell'utente in fase di checkout, come:  
✔ Nome  
✔ Email  
✔ Indirizzo di fatturazione  
✔ Metodo di pagamento  

Tuttavia, per il tuo servizio hai bisogno di **nome, data di nascita e luogo di nascita**.  
Puoi raccogliere questi dati personalizzando il checkout di Snipcart con **custom fields**.

---

### **Aggiungere Campi Personalizzati nel Checkout di Snipcart**
Snipcart permette di aggiungere campi extra ai prodotti usando `data-item-customX-name`.

Modifichiamo i pulsanti di abbonamento per raccogliere i dati necessari:

```html
<button class="btn btn-success mt-3 snipcart-add-item"
    data-item-id="oroscopo-settimanale"
    data-item-name="Abbonamento Oroscopo Settimanale"
    data-item-price="4.99"
    data-item-recurring="true"
    data-item-recurring-interval="1 week"
    data-item-url="/prodotti/oroscopo-settimanale"
    data-item-custom1-name="Data di Nascita"
    data-item-custom1-type="date"
    data-item-custom1-required="true"
    data-item-custom2-name="Luogo di Nascita"
    data-item-custom2-type="text"
    data-item-custom2-required="true">
    Abbonati Ora
</button>
```

Lo stesso va aggiunto al pulsante per l'abbonamento mensile.

---

### **Come Recuperare Questi Dati?**
Quando un utente completa l'acquisto, Snipcart ti invia un webhook con tutti i dati, inclusi quelli personalizzati.  
Nel tuo endpoint FastAPI, puoi recuperare i valori così:

```python
@app.post("/webhook/subscription")
async def handle_subscription_webhook(request: Request):
    payload = await request.json()
    subscription_data = payload.get("content", {})

    customer_email = subscription_data.get("user", {}).get("email")
    birth_date = subscription_data.get("customFields", {}).get("Data di Nascita", "N/A")
    birth_place = subscription_data.get("customFields", {}).get("Luogo di Nascita", "N/A")

    print(f"Nuovo abbonamento: {customer_email}, Nato il: {birth_date}, a: {birth_place}")
```

---

Ora Snipcart raccoglierà e invierà questi dati al tuo backend! 🚀  
📌 Ti serve aiuto per testare i webhook o integrarli nel tuo sistema?