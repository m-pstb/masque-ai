# Cadrage du projet — Masque AI

> Bachelor 3 Tech for Business — spécialité Cybersécurité — PST&B 2026/27
> Application front-end, sans back-end, sans données personnelles réelles.

## Contexte

De plus en plus de salariés collent des e-mails, des comptes rendus ou des extraits de fichiers clients dans des outils d'intelligence artificielle (ChatGPT, Claude, Copilot…) pour les résumer ou les reformuler. Ces textes contiennent souvent des données personnelles : adresses e-mail, téléphones, IBAN, numéros de sécurité sociale. Une fois envoyées, ces données sortent du contrôle de l'entreprise, ce qui pose un problème de conformité au RGPD et un risque de fuite.

---

## MVP

### 1. Objectif de l'application

Permettre à un utilisateur d'**anonymiser un texte avant de l'envoyer à une IA**. L'application repère automatiquement les données personnelles à format fixe et les remplace par une étiquette (`[EMAIL]`, `[TÉLÉPHONE]`, `[IBAN]`…). Le traitement a lieu **entièrement dans le navigateur** : le texte n'est jamais envoyé, ni stocké.

### 2. Utilisateurs et rôles

| Rôle | Qui | Ce qu'il peut faire |
|---|---|---|
| Utilisateur | Tout salarié qui utilise une IA dans son travail (support client, RH, comptabilité, IT…) | Coller un texte, l'anonymiser, copier le résultat, tout effacer |

Un seul rôle, sans compte ni connexion. C'est un choix de sécurité : sans compte, aucune donnée personnelle sur l'utilisateur n'est collectée, et il n'y a pas d'identifiants à protéger.

### 3. Fonctionnalités

| N° | Fonctionnalité | Description |
|---|---|---|
| F1 | Anonymiser un texte | Détection et remplacement de 6 types de données : e-mail, téléphone français, IBAN français, carte bancaire, numéro de sécurité sociale, adresse IP |
| F2 | Bilan de l'analyse | Nombre de données masquées, par type |
| F3 | Copier le résultat | Copie du texte anonymisé uniquement (jamais du texte d'origine) |
| F4 | Exemple fictif | Charge un texte de test inventé, pour démontrer l'outil sans vraies données |
| F5 | Tout effacer | Vide les deux zones de texte |
| F6 | Page « Sécurité du site » | Explique aux visiteurs les protections mises en place |

### 4. Langages

| Langage | Rôle | Pourquoi ce choix |
|---|---|---|
| HTML5 | Structure des pages et balises de sécurité (`<meta>` CSP, Referrer-Policy) | Standard du web, aucun outil à installer |
| CSS3 | Mise en forme, animations, mode sombre, affichage mobile | Fichier local, compatible avec une CSP stricte ; animations sans bibliothèque |
| JavaScript (sans framework) | Détection par expressions régulières, gestion des boutons | Aucune dépendance externe : moins de code tiers, donc moins de surface d'attaque |

Hébergement prévu : **GitHub Pages** (gratuit, HTTPS automatique, obligatoire pour la fonction « Copier »).

### 5. Ce que l'application ne fait pas aujourd'hui, et pourquoi

| Non fait | Pourquoi |
|---|---|
| Détecter les noms, prénoms et adresses postales | Ils n'ont pas de format fixe : une expression régulière ne suffit pas. Il faudrait un modèle d'IA de reconnaissance d'entités, qui alourdirait l'application et pourrait la faire relever de l'AI Act. Évolution possible. |
| Détecter les formats étrangers (IBAN non français, téléphones internationaux hors +33) | Périmètre volontairement limité à la France pour livrer un MVP fiable en une journée. |
| Rétablir les données d'origine dans la réponse de l'IA | Il faudrait conserver la correspondance étiquette ↔ donnée réelle, donc stocker des données sensibles dans le navigateur. Refusé par principe de minimisation (RGPD). |
| Stocker ou historiser les textes | Aucun stockage, ni cookie, ni `localStorage` : ce qui n'est pas stocké ne peut pas fuiter. |
| Comptes utilisateurs, back-end | Un vrai compte exige un serveur pour stocker les identifiants et vérifier les mots de passe : impossible sans back-end. Un faux compte stocké dans le navigateur serait contournable en quelques secondes, et un service externe (Firebase, Supabase) ferait sortir des données personnelles (e-mail) et ouvrirait la CSP au réseau. Sans compte, il n'y a ni identifiant à voler ni donnée personnelle à protéger. |
| En-têtes HTTP serveur (X-Frame-Options, X-Content-Type-Options, `frame-ancestors`) | GitHub Pages ne permet pas de les configurer, et ils n'ont pas d'effet dans une balise `<meta>`. Limite documentée. |

---

## Cadre réglementaire

- **RGPD** : l'application ne collecte, ne transmet et ne conserve aucune donnée. Elle aide au contraire à appliquer le **principe de minimisation** (article 5) avant un envoi vers un service tiers. Les tests se font uniquement avec des **données fictives**.
- **AI Act (règlement (UE) 2024/1689)** : l'application **n'est pas un système d'IA** (elle fonctionne par règles fixes). Elle ne relève donc ni des pratiques interdites, ni du haut risque. Elle accompagne l'usage d'outils d'IA tiers.
- **NIS 2 / Cyber Resilience Act** : non applicables directement à ce projet étudiant. Les bonnes pratiques du CRA (sécurité dès la conception, peu de dépendances, vulnérabilités documentées) ont toutefois été suivies.

## Critères d'acceptation

- [x] Les 6 types de données de l'exemple fictif sont tous masqués.
- [x] Aucune requête réseau n'est possible depuis la page (vérifié : `fetch` bloqué par la CSP).
- [x] Un texte contenant du code HTML ou JavaScript n'est jamais exécuté (vérifié : `innerHTML` bloqué).
- [x] Aucune erreur dans la console du navigateur.
- [x] Affichage correct sur ordinateur et sur téléphone.
