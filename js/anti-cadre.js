/*
 * Masque AI — protection contre le « clickjacking »
 * --------------------------------------------------
 * FAILLE : un site pirate peut afficher notre page dans un cadre
 * invisible (<iframe>) posé par-dessus ses propres boutons.
 * L'utilisateur croit cliquer chez le pirate, mais clique en réalité
 * sur notre site (par exemple sur « Copier »).
 *
 * La vraie protection serait l'en-tête serveur X-Frame-Options
 * (ou frame-ancestors dans la CSP), mais il ne fonctionne pas
 * dans une balise <meta> et GitHub Pages ne permet pas de l'ajouter.
 * On utilise donc la parade front-end : si la page est dans un cadre,
 * on la cache et on essaie d'en sortir.
 *
 * Ce fichier est chargé en premier, SANS "defer", pour agir
 * avant même que la page s'affiche.
 */
"use strict";

// window.self = cette page ; window.top = la fenêtre tout en haut.
// Si elles sont différentes, c'est que la page est dans un cadre.
if (window.top !== window.self) {
  // 1. On cache toute la page : rien à cliquer pour le pirate.
  document.documentElement.style.display = "none";

  // 2. On essaie d'ouvrir la page en plein écran, hors du cadre.
  //    (Peut échouer si le cadre l'interdit : la page reste alors cachée.)
  try {
    window.top.location.href = window.self.location.href;
  } catch (erreur) {
    // Rien à faire : la page reste invisible, c'est le but.
  }
}
