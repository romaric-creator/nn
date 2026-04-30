# IT-Manager Desktop

Application de gestion de stock informatique (Electron + React + SQLite)

## Démarrage en développement

```bash
npm install
npm run dev
```

## Build production (setup .exe)

```bash
npm run dist
```

## Structure
- `electron.main.js` : Processus principal Electron (sécurisé)
- `preload.js` : Bridge sécurisé entre Electron et React
- `src/` : Frontend React + Tailwind
- `sqlite3` : Base de données locale (à venir)

## Sécurité
- Isolation contextuelle Electron
- IPC strictement contrôlé
- Pas d’accès Node.js direct côté React

## Setup Windows
- Assistant d’installation (NSIS)
- Choix du dossier, raccourcis, etc.

---

Pour toute évolution, voir le cahier des charges.
