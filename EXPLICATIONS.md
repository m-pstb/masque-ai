# Comprendre et expliquer le projet

Ce document sert à préparer l'oral. Il explique le projet sans prérequis en programmation.

---

## 1. Le projet en 30 secondes

> « Les salariés collent souvent des e-mails clients dans ChatGPT pour les résumer. Ces textes contiennent des données personnelles qui sortent alors de l'entreprise. Mon application anonymise le texte avant : elle remplace les e-mails, téléphones, IBAN, cartes, numéros de sécurité sociale et adresses IP par des étiquettes. Tout se passe dans le navigateur, rien n'est envoyé ni stocké, et j'ai verrouillé le site pour que ce soit techniquement impossible. »

---

## 2. Comment le site est construit

Un site web front-end, c'est trois langages qui se répartissent le travail :

| Fichier | Langage | Rôle | Image simple |
|---|---|---|---|
| `index.html` | HTML | Ce qu'il y a sur la page : titres, zones de texte, boutons | Les murs de la maison |
| `css/style.css` | CSS | L'apparence : couleurs, tailles, disposition | La peinture et la déco |
| `js/app.js` | JavaScript | Ce qui se passe quand on clique | L'électricité |
| `fonts/`, `img/` | Fichiers | Polices et logo, stockés dans le site | Les meubles, achetés une fois et rangés chez soi |

« Front-end » veut dire que tout s'exécute **dans le navigateur de l'utilisateur**. Il n'y a pas de serveur qui reçoit et traite les données (pas de « back-end »).

---

## 3. Comment marche l'anonymisation

### Le principe

Le JavaScript cherche des **motifs** dans le texte, puis les remplace. Ces motifs s'appellent des **expressions régulières** (« regex »). Une regex décrit la *forme* d'une donnée, pas la donnée elle-même.

### Les briques de base d'une regex

| Symbole | Signification | Exemple |
|---|---|---|
| `\d` | un chiffre | `\d\d` = deux chiffres |
| `{4}` | répété 4 fois | `\d{4}` = 4 chiffres |
| `{2,}` | au moins 2 fois | `[A-Za-z]{2,}` = au moins 2 lettres |
| `[...]` | un caractère parmi la liste | `[12]` = 1 ou 2 |
| `[A-Z]` | une lettre majuscule | |
| `\s` | un espace | |
| `?` | facultatif | `\s?` = un espace, ou pas |
| `+` | une ou plusieurs fois | |
| `(?: ... )` | un groupe (pour répéter un morceau) | |
| `\|` | « ou » | `\+33\|0` = « +33 » ou « 0 » |
| `\b` | début ou fin d'un mot | évite de couper un nombre en deux |
| `\.` | un vrai point | (le point seul a un autre sens) |

### Les 6 règles, décomposées

**E-mail** — `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`
→ des lettres/chiffres, puis `@`, puis un nom de domaine, puis un point et au moins 2 lettres.
*Ex :* `jean.martin@exemple.fr`

**IBAN français** — `FR\d{2}(?:\s?[A-Z0-9]{4}){5}\s?[A-Z0-9]{3}`
→ « FR », 2 chiffres, puis 5 groupes de 4 caractères, puis 3 caractères. Les espaces sont facultatifs.
*Ex :* `FR76 3000 6000 0112 3456 7890 189`

**Carte bancaire** — `(?:\d{4}[\s-]?){3}\d{4}`
→ 3 fois « 4 chiffres + éventuel espace ou tiret », puis 4 chiffres. Soit 16 chiffres.
*Ex :* `4970 1012 3456 7890`

**Sécurité sociale** — `[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}`
→ 1 ou 2 (sexe), année, mois (01 à 12), département (ou 2A/2B pour la Corse), commune, ordre, clé.
*Ex :* `1 85 05 75 123 456 78`

**Adresse IP** — `(?:\d{1,3}\.){3}\d{1,3}`
→ 3 fois « 1 à 3 chiffres + un point », puis 1 à 3 chiffres.
*Ex :* `192.168.1.42`

**Téléphone** — `(?:\+33\s?[1-9]|0[1-9])(?:[\s.-]?\d{2}){4}`
→ « +33 » ou « 0 », un chiffre de 1 à 9, puis 4 groupes de 2 chiffres.
*Ex :* `06 12 34 56 78` ou `+33 1 23 45 67 89`

### Pourquoi l'ordre des règles compte

Un IBAN contient des suites de chiffres qui pourraient ressembler à un téléphone. On cherche donc d'abord les données **les plus longues** (IBAN, carte, sécurité sociale), puis les plus courtes (IP, téléphone). Une fois remplacé par `[IBAN]`, le morceau ne peut plus être pris pour autre chose.

### La fonction principale, en français

```
pour chaque règle de la liste :
    chercher toutes les données qui correspondent au motif
    s'il y en a :
        les remplacer par l'étiquette
        noter combien on en a trouvé
renvoyer le texte modifié et le bilan
```

---

## 4. Les balises et mesures de sécurité

Pour chacune : **la menace**, puis **la protection**. C'est ce que le jury attend.

### Vue d'ensemble : faille → protection (sans back-end)

| Faille | Ce que fait le pirate | Protection dans le site | Où |
|---|---|---|---|
| **XSS** (injection de script) | Glisse du code dans la page pour voler le texte | CSP `script-src 'self'`, `textContent` / `createElement`, Trusted Types | `index.html`, `js/app.js` |
| **Exfiltration de données** | Envoie le texte collé vers son serveur | CSP `connect-src 'none'`, `form-action 'none'` | `index.html` |
| **Fichier modifié** (supply chain) | Remplace un script ou un style sur l'hébergement | SRI : attribut `integrity="sha384-…"` | `<script>` et `<link>` |
| **Ressource externe piégée** | Compromet un CDN, une police, une bibliothèque | `default-src 'none'` + tout hébergé dans le site | CSP, `fonts/` |
| **Clickjacking** | Affiche le site dans un cadre invisible | Script anti-cadre | `js/anti-cadre.js` |
| **Interception réseau** (Wi-Fi public) | Modifie un fichier non chiffré en transit | `upgrade-insecure-requests` + HTTPS GitHub Pages | CSP |
| **Détournement des liens** | Change l'adresse de base des liens relatifs | `base-uri 'none'` | CSP |
| **Tabnabbing** | La page ouverte prend le contrôle de l'onglet d'origine | `rel="noopener noreferrer"` | liens externes |
| **Fuite de l'adresse visitée** | Récupère d'où vient le visiteur | `<meta name="referrer" content="no-referrer">` | `<head>` |
| **Fuite par le correcteur / l'auto-complétion** | Récupère le texte via un service du navigateur | `spellcheck="false"`, `autocomplete="off"` | `<textarea>` |
| **Déni de service local** | Colle un texte énorme pour bloquer la page | `maxlength="20000"` | `<textarea>` |
| **Vol de données stockées** | Lit les cookies ou le stockage du navigateur | Aucun stockage, aucun cookie | conception |

### 4.1 Content-Security-Policy (CSP) — la plus importante

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self';
               font-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none';
               require-trusted-types-for 'script'; upgrade-insecure-requests">
```

- **Menace** : un pirate parvient à injecter du code dans la page (attaque **XSS**, *Cross-Site Scripting*, rangée dans la catégorie « Injection » du classement OWASP Top 10). Ce code pourrait lire le texte collé et l'envoyer à son serveur.
- **Protection** : la CSP est une **liste blanche** donnée au navigateur. Tout ce qui n'est pas autorisé est bloqué.

| Directive | En clair |
|---|---|
| `default-src 'none'` | Par défaut, on interdit **tout** |
| `script-src 'self'` | Seuls les scripts venant de mon site sont autorisés. Un script écrit dans la page ou venant d'ailleurs est bloqué |
| `style-src 'self'` / `img-src 'self'` / `font-src 'self'` | Pareil pour les styles, les images et les polices : rien ne vient de Google Fonts ou d'un autre site |
| `connect-src 'none'` | **Aucune connexion réseau** depuis le JavaScript. Même un code injecté ne pourrait pas envoyer le texte |
| `form-action 'none'` | Aucun formulaire ne peut être envoyé |
| `base-uri 'none'` | Empêche un pirate de changer l'adresse de base des liens |
| `require-trusted-types-for 'script'` | Bloque `innerHTML` et les autres fonctions qui transforment du texte en code |
| `upgrade-insecure-requests` | Force le chargement de chaque fichier en HTTPS (chiffré) |

**Preuve à montrer** : dans la console du navigateur (F12), taper `fetch('https://example.com')` → erreur. Le navigateur refuse.

### 4.2 Referrer-Policy

```html
<meta name="referrer" content="no-referrer">
```

- **Menace** : quand on clique sur un lien, le navigateur dit au site suivant d'où l'on vient (le « referrer »). Cela peut révéler des informations.
- **Protection** : `no-referrer` supprime totalement cette information.

### 4.3 `textContent` et `createElement` au lieu de `innerHTML`

```js
const etiquette = document.createElement("span"); // crée une balise vide
etiquette.textContent = morceau;                    // y met du TEXTE
zone.appendChild(document.createTextNode(morceau)); // ajoute du TEXTE
```

- **Menace** : si l'on affiche un texte avec `innerHTML`, et que ce texte contient `<img src=x onerror=alert(1)>`, le navigateur l'exécute comme du code → XSS.
- **Protection** : `textContent` affiche **toujours du texte brut**. Le code HTML s'affiche, mais ne s'exécute pas.

Pour colorer les étiquettes `[EMAIL]` dans le résultat, on aurait pu écrire le HTML d'un coup avec `innerHTML` : c'est plus court, mais dangereux. On construit donc chaque balise une par une avec `createElement`, et on y place le texte avec `textContent`.

**Preuve à montrer** : coller `<img src=x onerror=alert(1)>` dans l'outil et anonymiser → aucune alerte, le texte reste affiché tel quel.

### 4.4 Attributs de la zone de saisie

```html
<textarea maxlength="20000" autocomplete="off" spellcheck="false" autocapitalize="off">
```

| Attribut | Menace | Protection |
|---|---|---|
| `spellcheck="false"` | Certains correcteurs orthographiques avancés envoient le texte à un serveur pour l'analyser | Pas de correction, donc pas d'envoi |
| `autocomplete="off"` | Le navigateur mémorise ce qu'on tape et le propose plus tard | Rien n'est mémorisé |
| `maxlength="20000"` | Un texte gigantesque bloque la page (déni de service local) | Taille limitée |

### 4.5 Script dans un fichier séparé, avec `defer`

```html
<script src="js/app.js" defer></script>
```

- Le code JavaScript n'est **jamais** écrit dans la page HTML ni dans des attributs comme `onclick="..."`. C'est ce qui permet une CSP stricte : tout script dans la page est considéré comme suspect et bloqué.
- Les clics sont gérés dans `app.js` avec `addEventListener`.

### 4.6 `rel="noopener noreferrer"` sur les liens externes

```html
<a href="https://cyber.gouv.fr/" target="_blank" rel="noopener noreferrer">
```

- **Menace** : le *tabnabbing*. Un lien ouvert dans un nouvel onglet (`target="_blank"`) peut, sans protection, modifier l'onglet d'origine et le remplacer par une fausse page.
- **Protection** : `noopener` coupe le lien entre les deux onglets, `noreferrer` cache la page d'origine.

### 4.7 Mesures de conception (sans balise)

| Mesure | Pourquoi |
|---|---|
| **Aucune bibliothèque externe** | Une bibliothèque piégée ou vulnérable est un risque réel (attaques « supply chain »). Pas de dépendance = pas de risque de ce type |
| **Aucun stockage** (ni cookie, ni `localStorage`) | Ce qui n'est pas stocké ne peut pas fuiter |
| **`"use strict"`** | Mode plus rigoureux de JavaScript : certaines erreurs silencieuses deviennent visibles |
| **`Object.freeze(REGLES)`** | La liste des règles ne peut pas être modifiée pendant l'exécution |
| **Copie du texte anonymisé uniquement** | Le texte d'origine ne passe jamais par le presse-papiers |
| **HTTPS via GitHub Pages** | Le site ne peut pas être modifié pendant le transport |

### 4.8 Intégrité des fichiers : SRI (*Subresource Integrity*)

```html
<link rel="stylesheet" href="css/style.css" integrity="sha384-pQVF…">
<script src="js/app.js" integrity="sha384-Bg9R…" defer></script>
```

- **Menace** : un pirate accède à l'hébergement (compte GitHub volé, par exemple) et ajoute du code malveillant dans `app.js`. C'est une attaque de la **chaîne d'approvisionnement** (*supply chain*).
- **Protection** : `integrity` contient l'**empreinte** du fichier, calculée avec l'algorithme SHA-384. C'est comme une empreinte digitale : si un seul caractère change, l'empreinte change complètement. Le navigateur recalcule l'empreinte au chargement et **refuse** le fichier si elle ne correspond pas.
- **Conséquence pratique** : après chaque modification d'un fichier CSS ou JS, il faut recalculer les empreintes, sinon le site s'affiche sans style ou sans JavaScript. Le script `outils/calculer-sri.py` le fait automatiquement :

```bash
python outils/calculer-sri.py
```

**Preuve à montrer** : modifier une ligne de `css/style.css` sans relancer le script, recharger la page → elle s'affiche sans mise en forme, et la console (F12) indique que l'empreinte ne correspond pas.

### 4.9 Protection contre le clickjacking

```js
if (window.top !== window.self) {
  document.documentElement.style.display = "none";
  ...
}
```

- **Menace** : le *clickjacking* (« détournement de clic »). Un site pirate affiche notre page dans un cadre (`<iframe>`) **invisible**, posé par-dessus ses propres boutons. L'utilisateur croit cliquer chez le pirate, mais clique en réalité sur notre site.
- **Protection idéale** : l'en-tête serveur `X-Frame-Options: DENY`. Mais il ne fonctionne pas dans une balise `<meta>`, et GitHub Pages ne permet pas de l'ajouter.
- **Protection front-end** : le fichier `js/anti-cadre.js` vérifie si la page est dans un cadre (`window.top` est la fenêtre du haut, `window.self` notre page : s'ils sont différents, on est encadré). Si oui, il cache toute la page et tente de l'ouvrir en plein écran. Il est chargé **en premier et sans `defer`** pour agir avant l'affichage.

### 4.10 Animations et accessibilité

| Animation | Comment | Pourquoi |
|---|---|---|
| Phrase de démonstration de l'accueil | CSS uniquement (`@keyframes`) : un fond jaune s'étale (surligneur), puis un bloc vert recouvre la donnée et affiche l'étiquette | Montrer en 3 secondes ce que fait l'outil, sans rien lire |
| Étiquettes du résultat | Chaque `[EMAIL]`… apparaît comme un tampon, l'une après l'autre. Le JavaScript donne à chacune un numéro (`--i`), le CSS s'en sert pour décaler son apparition | Voir ce qui a été masqué |
| Pastilles du bilan | Elles montent l'une après l'autre | Même principe |

- Les animations sont **en CSS, dans un fichier local** : aucune bibliothèque, donc compatibles avec la CSP.
- `@media (prefers-reduced-motion: reduce)` : si l'utilisateur a demandé à son système de réduire les animations (vertiges, épilepsie), elles sont coupées et on affiche directement l'état final.
- Le texte de la démonstration est caché aux lecteurs d'écran (`aria-hidden="true"`) et remplacé par une phrase descriptive (`sr-only`).

---

## 5. Questions probables du jury

**« Pourquoi ne pas avoir fait de back-end ? »**
Parce qu'un serveur recevrait les données sensibles : il faudrait le sécuriser, et il deviendrait une cible. En traitant tout dans le navigateur, les données ne quittent jamais l'appareil. C'est le principe de minimisation du RGPD.

**« Pourquoi pas de compte utilisateur ? »**
Un vrai compte demande un serveur qui stocke les identifiants et vérifie les mots de passe : c'est un back-end, hors du périmètre. Simuler un compte dans le navigateur serait une fausse sécurité, contournable en quelques secondes depuis la console. Et passer par un service externe ferait sortir des données personnelles. Sans compte, il n'y a rien à voler.

**« Pourquoi héberger les polices vous-même ? »**
Charger une police depuis Google Fonts envoie l'adresse IP du visiteur à Google ; un tribunal allemand l'a d'ailleurs jugé contraire au RGPD en 2022. Et cela obligerait à ouvrir la CSP à un domaine externe. Hébergées dans le site, elles ne posent aucun de ces problèmes.

**« Votre application est-elle soumise à l'AI Act ? »**
Non. Elle ne contient pas d'intelligence artificielle : elle applique des règles fixes. Elle sert justement à mieux utiliser des IA tierces.

**« Que se passe-t-il avec un nom ou une adresse ? »**
Ils ne sont pas détectés, car ils n'ont pas de format fixe. C'est une limite assumée, affichée sur la page. Pour la lever, il faudrait un modèle de reconnaissance d'entités nommées, ce qui serait une évolution future.

**« Qu'est-ce qu'une attaque XSS ? »**
L'injection d'un script malveillant dans une page web, qui s'exécute ensuite dans le navigateur des visiteurs. Je m'en protège de deux façons : `textContent` (le texte n'est jamais exécuté) et la CSP (même s'il l'était, il serait bloqué et ne pourrait rien envoyer).

**« Pourquoi pas de X-Frame-Options ? »**
C'est un en-tête qui doit être envoyé par le serveur ; il ne fonctionne pas dans une balise `<meta>`, et GitHub Pages ne permet pas de le configurer. Je le compense par un script anti-cadre côté navigateur. Sur un hébergeur comme Netlify, on ajouterait le vrai en-tête dans un fichier de configuration.

**« À quoi sert l'attribut integrity ? »**
C'est l'empreinte SHA-384 du fichier. Si le fichier est modifié sur l'hébergement, l'empreinte ne correspond plus et le navigateur refuse de l'exécuter. Ça protège contre une attaque de la chaîne d'approvisionnement.

**« Qu'est-ce que la CSP, en une phrase ? »**
Une liste blanche qui dit au navigateur ce que la page a le droit de charger et d'exécuter ; tout le reste est bloqué.

**« Comment avez-vous testé la sécurité ? »**
Cinq tests : un texte contenant du code HTML piégé (non exécuté), une tentative d'envoi réseau depuis la console (bloquée par la CSP), une tentative d'utiliser `innerHTML` (bloquée par Trusted Types), un fichier CSS modifié sans mise à jour de l'empreinte (refusé grâce au SRI), et la page affichée dans une `<iframe>` (cachée par l'anti-cadre). Plus la vérification que la console n'affiche aucune erreur.

---

## 6. Démonstration conseillée à l'oral (5 minutes)

1. Montrer la page, cliquer sur **Essayer un exemple fictif**, puis **Anonymiser** → bilan des 7 données masquées.
2. Coller `<img src=x onerror=alert(1)>` et anonymiser → rien ne s'exécute.
3. Ouvrir la console (F12), taper `fetch('https://example.com')` → erreur CSP.
4. Ouvrir la page **Sécurité du site**.
5. Montrer `index.html` et pointer la balise CSP, puis les attributs `integrity`.

---

## 7. Publier sur GitHub (pas à pas)

1. Créer un compte sur <https://github.com> si besoin.
2. Cliquer sur **New repository**, nom : `masque-ai`, visibilité **Public**, puis **Create repository**.
3. Sur la page du dépôt vide, cliquer sur **uploading an existing file**, glisser tous les fichiers et dossiers du projet, puis **Commit changes**.
4. Activer GitHub Pages (voir le README).

Avec Git en ligne de commande (si installé) :

```bash
cd masque-ai
git init
git add .
git commit -m "Première version de Masque AI"
git branch -M main
git remote add origin https://github.com/<votre-pseudo>/masque-ai.git
git push -u origin main
```

Conseil : faites plusieurs commits au fil de la journée (« ajout du cadrage », « ajout de la CSP »…). Votre guide de projet demande un historique de commits lisible.
