Vérifications rapides et tests

1. Vérifier qu'il n'y a plus de références à `serial_number` :

```bash
node scripts/check-serials.js
```

Le script retourne code 0 si aucun fichier `src` ne contient `serial_number`, sinon il liste les fichiers et retourne code 1.

Remarques:

- Ce script est un check statique simple pour s'assurer que l'UI et le code renderer n'utilisent plus les numéros de série.
- Des migrations/colonnes DB peuvent toujours contenir `serial_number` (le schéma est conservé pour compatibilité). Si vous voulez retirer la colonne de la base, faites une migration SQL en connaissance de cause.
