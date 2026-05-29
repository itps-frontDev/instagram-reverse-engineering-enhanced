# 08 — Troubleshooting

[← Torna all'indice](../README.md)

---

| Sintomo | Causa Probabile | Soluzione |
| :--- | :--- | :--- |
| **Servizi non compaiono in Eureka** | Race condition: i servizi si avviano prima che Eureka sia pronto | Attendere 30-60 secondi. Se il problema persiste: `docker-compose restart core` |
| **"Connection refused" dal Core** | Il Core si è avviato prima che il Config Server fosse pronto | `docker-compose restart core` |
| **WebSocket non si connette** | Il `directs-service` non è ancora registrato in Eureka al momento della connessione | Attendere che `DIRECTS-SERVICE` compaia in Eureka (`http://localhost:8761`), poi ricaricare la pagina |
| **Errore 401 su tutte le chiamate** | Token JWT scaduto o non inviato dal frontend | Logout e login per ottenere un nuovo token |
| **Liquibase fallisce all'avvio** | DB non ancora pronto, oppure conflitto di changeset | Verificare i log: `docker-compose logs core`. Per reset completo: `docker-compose down -v && docker-compose up -d` |
| **Errore CORS dal frontend** | Il frontend chiama direttamente il Core (porta 8081) invece del Gateway (porta 8080) | Verificare che `NEXT_PUBLIC_API_URL` punti a `http://localhost:8080` |
| **Redis: errore di connessione** | Redis non ancora avviato | `docker-compose ps` per verificare lo stato, poi `docker-compose restart redis` |
| **Post senza immagini (errore upload)** | Configurazione Azure Blob Storage mancante | Verificare le variabili `AZURE_STORAGE_*` in `config-server/src/main/resources/config/core.properties` |

---

[← Torna all'indice](../README.md)
