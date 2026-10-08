#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de mise en forme du rapport VitaSang (mon rapport.html)
- Ajoute un en-tête HTML complet avec CSS professionnel
- Insère les tableaux manquants du Chapitre 2
"""

import re

INPUT_FILE  = "/home/ing-dev/Bureau/Gestion de stock/my-app/mon rapport.html"
OUTPUT_FILE = "/home/ing-dev/Bureau/Gestion de stock/my-app/mon rapport.html"

# ── 1. CSS / HEAD ──────────────────────────────────────────────────────────────
HTML_HEAD = """<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rapport de Stage – VitaSang | HOUSE INNOVATION SARL</title>
<meta name="description" content="Rapport de fin de stage en Génie Logiciel – Application mobile VitaSang, don de sang au Cameroun.">
<style>
:root {
  --primary-blue: #132b45;
  --accent-blue:  #5d8aa8;
  --light-blue:   #dee7ed;
  --text-dark:    #1f1f1f;
  --text-body:    #2c2c2c;
  --border-color: #a3bccd;
  --font-main: 'Times New Roman', Times, serif;
  --page-width:   21cm;
  --margin-top:   2.5cm;
  --margin-bottom:2.5cm;
  --margin-left:  3cm;
  --margin-right: 2.5cm;
}
*{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{
  font-family:var(--font-main);
  font-size:12pt;
  line-height:1.5;
  color:var(--text-body);
  background:#e8e8e8;
  -webkit-font-smoothing:antialiased;
}

/* ── DOCUMENT WRAPPER ── */
.document-wrapper{
  max-width:var(--page-width);
  margin:0 auto;
  background:#fff;
  padding:var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);
  box-shadow:0 4px 20px rgba(0,0,0,.15),0 1px 3px rgba(0,0,0,.12);
  min-height:29.7cm;
}

/* ── TITRES ── */
h1{
  font-family:var(--font-main);font-size:20pt;font-weight:bold;
  color:var(--primary-blue);text-align:justify;line-height:1.5;
  margin-top:24pt;margin-bottom:12pt;page-break-after:avoid;
  border-left:5px solid var(--accent-blue);padding-left:12pt;
}
h2{
  font-family:var(--font-main);font-size:16pt;font-weight:bold;
  color:var(--primary-blue);text-align:justify;line-height:1.5;
  margin-top:14pt;margin-bottom:8pt;page-break-after:avoid;
  border-bottom:2px solid var(--accent-blue);padding-bottom:4pt;
}
h3{
  font-family:var(--font-main);font-size:14pt;font-weight:bold;
  color:var(--text-dark);text-align:justify;line-height:1.5;
  margin-top:10pt;margin-bottom:6pt;page-break-after:avoid;
}
h4{
  font-family:var(--font-main);font-size:12pt;font-weight:bold;
  color:var(--text-dark);text-align:justify;line-height:1.5;
  margin-top:8pt;margin-bottom:4pt;
}

/* ── TEXTE ── */
p{
  font-family:var(--font-main);font-size:12pt;color:var(--text-dark);
  text-align:justify;line-height:1.5;margin-bottom:6pt;
}

/* ── LISTES ── */
ul,ol{padding-left:40px;margin-top:4pt;margin-bottom:8pt}
ul li,ol li{
  font-family:var(--font-main);font-size:12pt;color:var(--text-dark);
  line-height:1.5;margin-bottom:3pt;text-align:justify;
}
ul li::marker{color:var(--accent-blue)}

/* ── TABLEAUX ── */
table{
  width:100%;border-collapse:collapse;
  margin-top:8pt;margin-bottom:12pt;
  font-size:11pt;font-family:var(--font-main);
  page-break-inside:avoid;
}
table td,table th{
  border:.5pt solid #000;
  padding:4pt 6pt;vertical-align:middle;
  text-align:justify;line-height:1.5;color:var(--text-dark);
}

/* ── IMAGES ── */
img{max-width:100%;height:auto;display:block;margin:8pt auto}

/* ── LIENS ── */
a{color:var(--accent-blue);text-decoration:none}
a:hover{text-decoration:underline;color:var(--primary-blue)}

/* ── NOUVELLE TABLE AJOUTÉE (style cohérent) ── */
.added-table{
  border-collapse:collapse;width:100%;
  margin-top:8pt;margin-bottom:12pt;
  font-size:11pt;font-family:var(--font-main);
  page-break-inside:avoid;
}
.added-table th{
  background-color:#5d8aa8 !important;
  color:#ffffff !important;
  font-weight:bold;
  border:.5pt solid #000;
  padding:5pt 7pt;
  text-align:center;
}
.added-table td{
  border:.5pt solid #000;
  padding:4pt 6pt;
  vertical-align:middle;
  text-align:justify;
  line-height:1.5;
  color:#1f1f1f;
}
.added-table tr:nth-child(even) td{background-color:#dee7ed}

/* ── CAPTION DE TABLE ── */
.table-caption{
  font-size:9pt;font-style:italic;
  color:#1a2a3a;text-align:center;
  margin-bottom:4pt;
}

/* ── IMPRESSION ── */
@media print{
  body{background:#fff !important;font-size:12pt}
  .document-wrapper{box-shadow:none;margin:0;padding:var(--margin-top) var(--margin-right) var(--margin-bottom) var(--margin-left);max-width:100%}
  h1,h2,h3,h4{page-break-after:avoid}
  table{page-break-inside:avoid}
  @page{size:A4;margin:2.5cm 2.5cm 2.5cm 3cm}
}

/* ── RESPONSIVE ── */
@media screen and (max-width:700px){
  .document-wrapper{padding:16px;box-shadow:none}
  h1{font-size:16pt} h2{font-size:14pt} h3{font-size:13pt}
  table{font-size:9pt}
  table td,table th{padding:3pt 4pt}
}
</style>
</head>
<body>
<div class="document-wrapper">
"""

# ── 2. Tableau 6 : Diagnostic du système ────────────────────────────────────
TABLE_6 = """
<p class="table-caption">Tableau 6 – Diagnostic du système actuel et opportunités offertes par VitaSang</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Points Critiques</th>
      <th>Conséquences Directes</th>
      <th>Apport de VitaSang</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Bouche à oreille</td>
      <td>Délai de réponse trop long</td>
      <td>Notifications Push instantanées</td>
    </tr>
    <tr>
      <td>Stocks inconnus</td>
      <td>Déplacements inutiles des donneurs</td>
      <td>Consultation du stock via API REST</td>
    </tr>
    <tr>
      <td>Dons non suivis</td>
      <td>Risque sanitaire et manque de suivi</td>
      <td>Historique de don sécurisé en BD</td>
    </tr>
  </tbody>
</table>
"""

# ── 3. Tableau 7 : Analyse de la valeur ────────────────────────────────────
TABLE_7 = """
<p class="table-caption">Tableau 7 – Analyse de la valeur ajoutée par profil utilisateur</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Profil Utilisateur</th>
      <th>Besoin Fondamental</th>
      <th>Fonctionnalité Clé</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Donneur</td>
      <td>Sauver des vies en toute simplicité</td>
      <td>Système d'alerte SOS Géo-localisée</td>
    </tr>
    <tr>
      <td>Hôpital / Centre</td>
      <td>Localiser du sang en urgence absolue</td>
      <td>Recherche filtrée par groupe et distance</td>
    </tr>
    <tr>
      <td>Administrateur</td>
      <td>Assurer la fiabilité des données</td>
      <td>Dashboard de modération et statistiques</td>
    </tr>
  </tbody>
</table>
"""

# ── 4. Tableau 9 : Dictionnaire de données ─────────────────────────────────
TABLE_9_DICT = """
<p class="table-caption">Tableau 9 – Dictionnaire de données simplifié (Extrait du MCD)</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Entité</th>
      <th>Attribut Principal</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Utilisateur</td>
      <td>email, password</td>
      <td>String</td>
      <td>Identifiants d'accès sécurisés</td>
    </tr>
    <tr>
      <td>Groupe Sanguin</td>
      <td>label</td>
      <td>String</td>
      <td>Type (A+, O-, B+, etc.)</td>
    </tr>
    <tr>
      <td>Alerte SOS</td>
      <td>coordinates</td>
      <td>GeoJSON</td>
      <td>Point GPS de l'urgence émise</td>
    </tr>
    <tr>
      <td>Don</td>
      <td>date_don</td>
      <td>DateTime</td>
      <td>Historisation des prélèvements</td>
    </tr>
  </tbody>
</table>
"""

# ── 5. Tableau 10 : WBS / Planning ─────────────────────────────────────────
TABLE_10_WBS = """
<p class="table-caption">Tableau 10 – Décomposition des tâches et planning (WBS)</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Phase du Projet</th>
      <th>Activités Principales</th>
      <th style="text-align:center">Durée Estimée (Jours)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Analyse &amp; Design</td>
      <td>Étude de l'existant, Conception UML, MCD</td>
      <td style="text-align:center">10</td>
    </tr>
    <tr>
      <td>Développement Back</td>
      <td>API Node.js, Sequelize, Authentification JWT</td>
      <td style="text-align:center">25</td>
    </tr>
    <tr>
      <td>Développement Mobile</td>
      <td>UI/UX React Native, Intégration Maps, SOS</td>
      <td style="text-align:center">35</td>
    </tr>
    <tr>
      <td>Qualité &amp; Tests</td>
      <td>Tests Postman, Corrections, Déploiement</td>
      <td style="text-align:center">10</td>
    </tr>
    <tr>
      <td><strong>TOTAL GÉNÉRAL</strong></td>
      <td></td>
      <td style="text-align:center"><strong>80 Jours</strong></td>
    </tr>
  </tbody>
</table>
<p style="font-size:10pt;font-style:italic;margin-top:-6pt;margin-bottom:10pt;">
  <strong>Note sur l'écart COCOMO&nbsp;:</strong> L'effort théorique calculé (9 mois) a été optimisé
  à 4,5 mois réels grâce à l'utilisation de frameworks de productivité (Expo, Sequelize)
  et une architecture modulaire.
</p>
"""

# ── 6. Tableau 15 : Matrice de Sécurité ────────────────────────────────────
TABLE_15_SEC = """
<p class="table-caption">Tableau 15 – Matrice de Sécurité et d'Intégrité Applicative</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Domaine de Sécurité</th>
      <th>Technologie / Méthode</th>
      <th>Objectif de Protection</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Confidentialité</td>
      <td>Algorithme Bcrypt</td>
      <td>Chiffrement irréversible des mots de passe</td>
    </tr>
    <tr>
      <td>Authentification</td>
      <td>JSON Web Tokens (JWT)</td>
      <td>Signature numérique des sessions REST</td>
    </tr>
    <tr>
      <td>Intégrité Flux</td>
      <td>encodeURIComponent</td>
      <td>Protection des groupes sanguins (ex : A+)</td>
    </tr>
  </tbody>
</table>
"""

# ── 7. Tableau 16 : Cahier de recette ──────────────────────────────────────
TABLE_16_TESTS = """
<p class="table-caption">Tableau 16 – Cahier de recette et résultats des tests</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Code Test</th>
      <th>Description du Cas</th>
      <th>Résultat Attendu</th>
      <th>Statut Final</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:center"><strong>T01</strong></td>
      <td>Connexion avec Token</td>
      <td>Accès autorisé aux routes privées</td>
      <td style="text-align:center;color:#155724;font-weight:bold">✅ Succès</td>
    </tr>
    <tr>
      <td style="text-align:center"><strong>T02</strong></td>
      <td>Calcul de proximité</td>
      <td>Rayon d'alerte &lt; 10 km respecté</td>
      <td style="text-align:center;color:#155724;font-weight:bold">✅ Succès</td>
    </tr>
    <tr>
      <td style="text-align:center"><strong>T03</strong></td>
      <td>Sécurité Injection</td>
      <td>Requêtes SQL filtrées par l'ORM</td>
      <td style="text-align:center;color:#155724;font-weight:bold">✅ Succès</td>
    </tr>
  </tbody>
</table>
"""

# ── 8. Tableau 17 : Matrice des risques ────────────────────────────────────
TABLE_17_RISKS = """
<h2 style="text-align:justify;line-height:150%;margin-top:14pt;margin-bottom:8pt;border-bottom:2px solid #5d8aa8;padding-bottom:4pt;">
  <span style="font-family:'Times New Roman';font-size:16pt;color:#132b45;"><b>ANALYSE DES RISQUES</b></span>
</h2>
<p style="text-align:justify;line-height:150%;margin-bottom:8pt;">
  <span style="font-family:'Times New Roman';font-size:12pt;color:#000000;">
  La matrice suivante identifie les principaux risques du projet, leur impact potentiel et les stratégies
  de mitigation mises en place pour garantir la continuité et la robustesse de l'application VitaSang.
  </span>
</p>
<p class="table-caption">Tableau 17 – Matrice des risques et plans de secours</p>
<table class="added-table">
  <thead>
    <tr>
      <th>Nature du Risque</th>
      <th>Impact</th>
      <th>Probabilité</th>
      <th>Stratégie de Mitigation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Technique</td>
      <td>Majeur</td>
      <td>Faible</td>
      <td>Utilisation de Sequelize (ORM robuste)</td>
    </tr>
    <tr>
      <td>Adoption Sociale</td>
      <td>Critique</td>
      <td>Haute</td>
      <td>Sensibilisation via le MINSANTÉ</td>
    </tr>
    <tr>
      <td>Intégrité Données</td>
      <td>Majeur</td>
      <td>Moyenne</td>
      <td>Backups automatiques MySQL</td>
    </tr>
  </tbody>
</table>
"""

# ── Lecture du fichier ──────────────────────────────────────────────────────
print("Lecture du fichier source…")
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    content = f.read()

print(f"Taille originale : {len(content):,} octets")

# ── Remplacement de l'en-tête HTML (lignes 1-2) ────────────────────────────
OLD_HEADER = "<html>\n\t<body>"
NEW_HEADER = HTML_HEAD
content = content.replace(OLD_HEADER, NEW_HEADER, 1)

# ── Fermeture du document ──────────────────────────────────────────────────
OLD_FOOTER = "\t</body>\n</html>"
NEW_FOOTER = "\t</body>\n</div>\n</body>\n</html>"
content = content.replace(OLD_FOOTER, NEW_FOOTER, 1)

# ── Insertion Tableau 6 (après II.1.2 Diagnostic critique) ─────────────────
# On insère juste avant la balise </ol> qui ferme la liste des 3 failles
ANCHOR_6 = "Absence de suivi du donneur : risque de dons trop fréquents, sans carnet numérique centralisé."
if ANCHOR_6 in content:
    # Trouver la position après le paragraphe contenant la phrase,
    # puis après le </li> et le </ol> suivants
    idx = content.index(ANCHOR_6)
    # Chercher la fermeture de l'<ol> (2 </li> + </ol>)
    ol_close = content.find("</ol>", idx)
    if ol_close != -1:
        insert_pos = ol_close + len("</ol>")
        content = content[:insert_pos] + "\n" + TABLE_6 + content[insert_pos:]
        print("✅ Tableau 6 inséré (après II.1.2 Diagnostic critique)")
    else:
        print("⚠️  </ol> introuvable après l'ancre Tableau 6")
else:
    print("⚠️  Ancre Tableau 6 introuvable")

# ── Insertion Tableau 7 (après le Tableau 3 «Acteurs et besoins») ───────────
# On cible la légende "Tableau 3 Acteurs et besoins du système VitaSang"
ANCHOR_7 = "Acteurs et besoins du système VitaSang"
if ANCHOR_7 in content:
    idx = content.index(ANCHOR_7)
    # Chercher la fin du tableau (premier </table> après cette position)
    tbl_close = content.find("</table>", idx)
    if tbl_close != -1:
        insert_pos = tbl_close + len("</table>")
        content = content[:insert_pos] + "\n" + TABLE_7 + content[insert_pos:]
        print("✅ Tableau 7 inséré (après Tableau 3 Acteurs/besoins)")
    else:
        print("⚠️  </table> introuvable après l'ancre Tableau 7")
else:
    print("⚠️  Ancre Tableau 7 introuvable")

# ── Insertion Tableau 9 Dictionnaire (après ancre "Tableau 9") ─────────────
# Le fichier contient déjà "Tableau 9" comme référence en Table des matières
# On cherche la vraie section II.3 Modélisation UML
ANCHOR_9 = "III.1 ENVIRONNEMENT DE DÉVELOPPEMENT"
if ANCHOR_9 in content:
    # On insère avant le début du Chapitre III
    idx = content.index(ANCHOR_9)
    # Reculer jusqu'à la balise <h2 ou <h1 de ce titre
    h_open = content.rfind("<h", 0, idx)
    if h_open != -1:
        content = content[:h_open] + "\n" + TABLE_9_DICT + TABLE_10_WBS + content[h_open:]
        print("✅ Tableaux 9 & 10 insérés (avant Chapitre III)")
    else:
        print("⚠️  balise <h introuvable avant l'ancre Chapitre III")
else:
    print("⚠️  Ancre Chapitre III introuvable")

# ── Insertion Tableau 15 Sécurité (après «III.2» ou avant «III.3») ──────────
ANCHOR_15 = "III.3"
if ANCHOR_15 in content:
    idx = content.index(ANCHOR_15)
    h_open = content.rfind("<h", 0, idx)
    if h_open != -1:
        content = content[:h_open] + "\n" + TABLE_15_SEC + content[h_open:]
        print("✅ Tableau 15 (Sécurité) inséré (avant III.3)")
    else:
        print("⚠️  balise <h introuvable avant l'ancre Tableau 15")
else:
    print("⚠️  Ancre III.3 introuvable")

# ── Insertion Tableau 16 Tests (après le tableau des difficultés T20/T21) ───
ANCHOR_16 = "À l'issue du stage, nous estimons avoir réalisé environ 75 %"
if ANCHOR_16 in content:
    idx = content.index(ANCHOR_16)
    p_end = content.rfind("<p ", 0, idx)
    if p_end != -1:
        content = content[:p_end] + "\n" + TABLE_16_TESTS + content[p_end:]
        print("✅ Tableau 16 (Tests) inséré")
    else:
        print("⚠️  position introuvable pour Tableau 16")
else:
    print("⚠️  Ancre Tableau 16 introuvable")

# ── Insertion Tableau 17 Risques (après les Résultats obtenus ch3.3.2) ──────
ANCHOR_17 = "III.3.3 Perspectives"
if ANCHOR_17 in content:
    idx = content.index(ANCHOR_17)
    h_open = content.rfind("<h", 0, idx)
    if h_open != -1:
        content = content[:h_open] + "\n" + TABLE_17_RISKS + content[h_open:]
        print("✅ Tableau 17 (Risques) inséré (avant III.3.3)")
    else:
        print("⚠️  balise <h introuvable avant III.3.3")
else:
    print("⚠️  Ancre III.3.3 introuvable")

# ── Écriture du fichier de sortie ──────────────────────────────────────────
print(f"\nÉcriture du fichier de sortie…")
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Taille finale : {len(content):,} octets")
print(f"\n✅ Mise en forme terminée → {OUTPUT_FILE}")
