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


