# Masque AI

Application web qui **anonymise un texte avant de l'envoyer à une intelligence artificielle**. Elle repère les e-mails, téléphones, IBAN, numéros de carte bancaire, numéros de sécurité sociale et adresses IP, et les remplace par des étiquettes comme `[EMAIL]` ou `[IBAN]`.

**Tout se passe dans le navigateur** : aucun serveur, aucun envoi, aucun stockage.

> Projet de Bachelor 3 Tech for Business — spécialité Cybersécurité — PST&B 2026/27.
> Le cadrage complet (MVP en 5 points) est dans [`cadrage.md`](cadrage.md).

## Démonstration

1. Ouvrez le site.
2. Cliquez sur **Essayer un exemple fictif**.
3. Cliquez sur **Anonymiser** : le texte de droite ne contient plus aucune donnée personnelle, et le bilan indique ce qui a été masqué.

## Structure du dépôt

```
masque-ai/
├── index.html        Page principale (outil d'anonymisation)
├── securite.html     Page qui explique les protections du site
├── css/
│   └── style.css     Mise en forme
├── js/
│   └── app.js        Règles de détection et gestion des boutons
├── fonts/          Polices hébergées dans le site (licence OFL)
├── img/
│   ├── logo.svg        Logo (fond clair)
│   ├── logo-sombre.svg Logo (mode sombre)
│   └── icone.svg       Icône de l'onglet
├── cadrage.md        Cadrage du projet et MVP
├── EXPLICATIONS.md   Explication du code et des balises de sécurité
└── README.md         Ce fichier
```

## Lancer le projet

**En ligne** : via GitHub Pages (voir ci-dessous).

**En local** : la CSP bloque certaines choses quand on ouvre le fichier directement (`file://`). Lancez plutôt un petit serveur depuis le dossier du projet :

```bash
python -m http.server 8000
```

Puis ouvrez <http://localhost:8000> dans le navigateur.

## Mettre en ligne sur GitHub Pages

1. Sur GitHub, dépôt → **Settings** → **Pages**.
2. *Source* : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Enregistrez : le site est disponible quelques minutes plus tard à l'adresse `https://<votre-pseudo>.github.io/masque-ai/`.

## Sécurité mise en place

| Mesure | Où | Protège contre |
|---|---|---|
| Content-Security-Policy stricte | `<meta>` dans les pages HTML | Injection de script (XSS), chargement de ressources externes, fuite du texte par le réseau |
| `require-trusted-types-for 'script'` | Dans la CSP | Utilisation de `innerHTML` et des fonctions qui transforment du texte en code |
| `font-src 'self'` | Dans la CSP | Polices chargées uniquement depuis le site (pas de Google Fonts) |
| Referrer-Policy `no-referrer` | `<meta>` | Fuite de l'adresse de la page vers d'autres sites |
| `textContent` au lieu de `innerHTML` | `js/app.js` | XSS : le texte collé n'est jamais interprété comme du code |
| `spellcheck="false"`, `autocomplete="off"` | Zone de saisie | Envoi du texte à un correcteur en ligne, mémorisation par le navigateur |
| `maxlength` | Zone de saisie | Blocage de la page par un texte énorme |
| `rel="noopener noreferrer"` | Liens externes | Prise de contrôle de l'onglet (*tabnabbing*) |
| Aucune dépendance, aucun stockage | Tout le projet | Composant tiers piégé, fuite de données conservées |

Le détail de chaque mesure est expliqué dans [`EXPLICATIONS.md`](EXPLICATIONS.md).

## Design et animations

- Polices **Bricolage Grotesque** et **JetBrains Mono** (licence SIL Open Font License), hébergées dans `fonts/`.
- Animation de démonstration en CSS pur dans l'accueil, étiquettes qui apparaissent une à une après l'anonymisation.
- Le réglage système « réduire les animations » est respecté (`prefers-reduced-motion`).
- Mode sombre automatique, affichage adapté au téléphone, navigation au clavier.

## Données

Le dépôt ne contient **aucune donnée personnelle réelle**. Le texte d'exemple utilise un domaine fictif (`exemple.fr`) et des numéros inventés.

## Limites connues

- Les noms, prénoms et adresses postales ne sont pas détectés.
- Seuls les formats français sont reconnus (IBAN FR, téléphones 0X ou +33).
- Les en-têtes HTTP serveur (X-Frame-Options, X-Content-Type-Options) ne peuvent pas être configurés sur GitHub Pages.

## Déclaration d'usage de l'intelligence artificielle

> Conformément au guide du projet (section « Usage de l'IA »), l'usage d'outils d'IA générative est déclaré ci-dessous. **À compléter par l'étudiant.**

| Outil | Étape du projet | Usage | Principales invites |
|---|---|---|---|
| Claude (Anthropic) | Choix du sujet, développement, documentation | Proposition de sujets, génération du code commenté, rédaction du README, du cadrage et des explications | « Propose un sujet original de site front-end cybersécurité », « Construis l'application avec les balises de sécurité » |

## Auteur

*Votre nom* — Bachelor 3 Cybersécurité, PST&B.
