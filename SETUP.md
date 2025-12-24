# 🚀 Setup Rapido

## Prerequisiti

- **Node.js v22** (non v24!)
- **pnpm**

```bash
# Verifica
node -v   # deve essere v22.x
pnpm -v
```

---

## Installazione

```bash
pnpm install
pnpm db:reset
pnpm dev
```

Apri **http://localhost:3000**

---

## Comandi Utili

| Comando | Descrizione |
|---------|-------------|
| `pnpm dev` | Server sviluppo |
| `pnpm db:reset` | Ricrea database |
| `pnpm build` | Build produzione |

---

## Problemi?

### "Could not locate the bindings file"
```bash
pnpm approve-builds   # seleziona better-sqlite3, conferma con 'y'
pnpm rebuild better-sqlite3
```

### Database non funziona
```bash
pnpm db:reset
```

