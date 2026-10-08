# Rapport de Modifications - Flexy Store

Ce document résume les corrections et optimisations apportées au système de gestion **Flexy Store**.

## 1. Corrections des Calculs Financiers
*   **Total Cumulé :** Correction de la logique de calcul dans la page **Analyses**. Le total utilise désormais l'ID unique de chaque vente (`invoice_total`) au lieu de sommer les lignes d'articles, ce qui garantit l'exactitude même en cas de remises globales.
*   **Prise en compte des remises :** Le montant net est maintenant correctement affiché dans les rapports.

## 2. Optimisation du Catalogue Produits
*   **Mise à jour des catégories :** Le système prend désormais en charge les catégories spécifiques du magasin :
    *   Ordinateurs (Portable & Fixe)
    *   Tablettes
    *   Stockage (HDD, SSD, Clés USB, Cartes Mémoire)
    *   Périphériques (Souris, Claviers)
    *   Audio (Casques, Écouteurs)
    *   Logiciels & Antivirus
    *   Composants & Accessoires divers.

## 3. Gestion du Matériel Défectueux (Maintenance)
*   **Signalement par Lot :** Plus besoin de saisir un numéro de série par unité. Vous pouvez désormais signaler plusieurs unités défectueuses d'un coup (ex: 10 souris défectueuses).
*   **Tableau de Bord Maintenance :** Les articles en maintenance sont regroupés par modèle avec une colonne "Quantité HS".
*   **Restauration Simplifiée :** Possibilité de remettre en stock une quantité précise après réparation (ex: restaurer 5 unités sur 10 en attente).

## 4. Reporting et Exportation
*   **Export CSV Professionnel :** Ajout d'une fonctionnalité d'exportation complète dans la page **Analyses**.
*   **Format Excel :** Le fichier est généré au format `.csv` avec séparateur point-virgule (`;`) pour une compatibilité parfaite avec Excel.
*   **Dossier de sortie :** Les rapports sont automatiquement sauvegardés dans le dossier **Téléchargements** de l'ordinateur.
*   **Colonnes incluses :** ID Vente, Date, Client, Produit, Quantité, Prix Unitaire, Total Ligne, Total Facture, Mode de Paiement.

## 5. Identité Visuelle
*   **Rebranding :** L'application a été renommée **FLEXY STORE** sur l'écran de connexion et les interfaces principales.
*   **Langue :** Interface et notifications intégralement en français.

---
*Date de mise à jour : 15 Mars 2026*
