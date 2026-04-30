// src/main/ipc/db.cjs
//
// BUG FIX: ce fichier enregistrait un handler "db:backup" qui entre en conflit
// avec celui déjà défini dans backup.cjs (lequel est importé dans main.cjs).
// Si les deux fichiers étaient chargés simultanément, Electron lancerait :
//   "Attempted to register a second handler for 'db:backup'"
//
// Solution: le handler db:backup est géré exclusivement par backup.cjs
// (version avec dialog de sélection du dossier, meilleure UX).
// Ce fichier est conservé comme point d'extension pour de futurs IPC DB
// mais n'enregistre plus de canaux dupliqués.
//
// Note: ce fichier n'est pas importé par main.cjs — si vous l'ajoutez,
// assurez-vous d'abord de supprimer le require('./ipc/backup.cjs') pour éviter
// tout conflit de handlers.

module.exports = {};
