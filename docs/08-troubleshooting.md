# 08 — Troubleshooting

[← Torna all'indice](../README.md)

---

| Sintomo | Causa Probabile | Soluzione |
| :--- | :--- | :--- |
| **Il frontend è su ma il login non funziona** | Il `core` è ancora in fase di avvio (Liquibase, registrazione Eureka) — il frontend si avvia prima dei servizi Spring Boot | Attendere 2-3 minuti e riprovare. Verificare con `docker compose logs core --tail=30` che le migrazioni siano completate |
| **Servizi non compaiono in Eureka** | Race condition all'avvio: i servizi si registrano prima che Eureka sia completamente pronto | Attendere qualche minuto. Se il problema persiste riavviare il servizio interessato: `docker compose restart core` |
| **WebSocket non si connette** | Il `directs-service` non è ancora registrato in Eureka | Attendere che `DIRECTS-SERVICE` compaia nella dashboard Eureka (`http://localhost:8761`), poi ricaricare la pagina |
| **Errore 401 su tutte le chiamate** | Token JWT scaduto o cookie non presente | Effettuare logout e login per ottenere nuovi token |
| **Liquibase fallisce all'avvio** | Il database non è ancora pronto, oppure c'è un conflitto di changeset | Verificare i log: `docker compose logs core`. Per reset completo del DB: `docker compose down -v && docker compose up -d` |
| **Errore CORS dal frontend** | `API_URL` nel `.env` punta a una porta o host errato | Verificare che `API_URL=http://localhost:8080` (il gateway, non il core direttamente) |
| **Post senza immagini** | Azurite non avviato oppure variabili Azure mancanti nel `.env` | Verificare che il container `azurite` sia in esecuzione con `docker compose ps`. Controllare `AZURE_STORAGE_CONNECTION_STRING` e `AZURE_STORAGE_CONTAINER_NAME` nel `.env` |
| **Redis: errore di connessione** | Redis non ancora avviato | `docker compose ps` per verificare lo stato, poi `docker compose restart redis` |

---

[← Installazione](07-installazione.md) | [Torna all'indice](../README.md)
