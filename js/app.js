/*
 * Masque AI — logique de l'application
 * ---------------------------------------------
 * Rôle de ce fichier : lire le texte collé par l'utilisateur,
 * repérer les données personnelles et les remplacer par une étiquette.
 *
 * Principe de sécurité : tout se passe ici, dans le navigateur.
 * Ce fichier ne fait AUCUN appel réseau (et la CSP l'interdirait de toute façon).
 */

// "use strict" active un mode plus rigoureux de JavaScript :
// certaines erreurs silencieuses deviennent de vraies erreurs.
"use strict";

/* =====================================================================
 * 1. LES RÈGLES DE DÉTECTION
 * Chaque règle a :
 *   - un nom (affiché dans le bilan)
 *   - une étiquette (qui remplace la donnée trouvée)
 *   - un motif, appelé "expression régulière", qui décrit la forme
 *     de la donnée à chercher.
 *
 * L'ORDRE COMPTE : on cherche d'abord les données les plus longues
 * (IBAN, carte, sécurité sociale) pour qu'un morceau ne soit pas
 * pris par erreur pour un numéro de téléphone.
 *
 * Le "g" à la fin de chaque motif veut dire "global" :
 * on remplace TOUTES les occurrences, pas seulement la première.
 * Le "i" veut dire "insensible à la casse" (majuscules = minuscules).
 * ===================================================================== */
const REGLES = Object.freeze([
  {
    nom: "Adresse e-mail",
    etiquette: "[EMAIL]",
    // des lettres/chiffres/points, puis @, puis un nom de domaine, un point
    // et au moins 2 lettres (ex : jean.dupont@exemple.fr)
    motif: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
  },
  {
    nom: "IBAN français",
    etiquette: "[IBAN]",
    // FR + 2 chiffres, puis 5 groupes de 4 caractères, puis 3 caractères
    // (espaces facultatifs) — ex : FR76 3000 6000 0112 3456 7890 189
    motif: /\bFR\d{2}(?:\s?[A-Z0-9]{4}){5}\s?[A-Z0-9]{3}\b/gi
  },
  {
    nom: "Numéro de carte bancaire",
    etiquette: "[CARTE]",
    // 4 groupes de 4 chiffres, séparés ou non par un espace ou un tiret
    motif: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g
  },
  {
    nom: "Numéro de sécurité sociale",
    etiquette: "[N°SÉCU]",
    // 1 ou 2 (sexe), année (2 chiffres), mois (01 à 12),
    // département (2 chiffres, ou 2A/2B pour la Corse),
    // commune (3 chiffres), ordre (3 chiffres), clé (2 chiffres)
    motif: /\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}\b/gi
  },
  {
    nom: "Adresse IP",
    etiquette: "[IP]",
    // 4 nombres de 1 à 3 chiffres séparés par des points (ex : 192.168.1.42)
    motif: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
  },
  {
    nom: "Numéro de téléphone",
    etiquette: "[TÉLÉPHONE]",
    // commence par +33 ou par 0, puis un chiffre de 1 à 9,
    // puis 4 groupes de 2 chiffres (séparés ou non par espace, point, tiret)
    motif: /(?:\+33\s?[1-9]|\b0[1-9])(?:[\s.-]?\d{2}){4}\b/g
  }
]);

/* =====================================================================
 * 2. TEXTE D'EXEMPLE — 100 % FICTIF
 * Pour tester sans jamais utiliser de vraies données personnelles.
 * Le domaine "exemple.fr" et les numéros ci-dessous sont inventés.
 * ===================================================================== */
const TEXTE_EXEMPLE =
  "Bonjour, peux-tu résumer ce mail client ?\n\n" +
  "Le client nous écrit depuis jean.martin@exemple.fr et demande à être rappelé " +
  "au 06 12 34 56 78 ou au +33 1 23 45 67 89.\n" +
  "Il souhaite modifier son IBAN : FR76 3000 6000 0112 3456 7890 189.\n" +
  "Il nous a aussi donné son numéro de carte : 4970 1012 3456 7890.\n" +
  "Numéro de sécurité sociale : 1 85 05 75 123 456 78.\n" +
  "Connexion suspecte détectée depuis l'adresse 192.168.1.42.";

/* =====================================================================
 * 3. LA FONCTION QUI ANONYMISE
 * Entrée  : le texte d'origine
 * Sortie  : le texte anonymisé + le nombre de données trouvées par type
 * Cette fonction ne touche pas à la page : elle calcule seulement.
 * ===================================================================== */
function anonymiser(texte) {
  let resultat = texte;
  const bilan = [];

  // On applique les règles une par une, dans l'ordre.
  for (const regle of REGLES) {
    // match() renvoie la liste des données trouvées (ou null si aucune)
    const trouvees = resultat.match(regle.motif);
    const nombre = trouvees ? trouvees.length : 0;

    if (nombre > 0) {
      // replace() remplace chaque donnée trouvée par l'étiquette
      resultat = resultat.replace(regle.motif, regle.etiquette);
      bilan.push({ nom: regle.nom, nombre: nombre });
    }
  }

  return { texte: resultat, bilan: bilan };
}

/* =====================================================================
 * 4. AFFICHER LE RÉSULTAT AVEC LES ÉTIQUETTES EN COULEUR
 * On découpe le texte anonymisé en morceaux : du texte normal
 * et des étiquettes ([EMAIL], [IBAN]…). Chaque étiquette est placée
 * dans une balise <span> pour être colorée et animée.
 *
 * SÉCURITÉ : on crée les balises avec createElement() et on y met
 * le texte avec textContent / createTextNode(). On n'utilise JAMAIS
 * innerHTML : même si le texte contient du code, il reste du texte.
 * ===================================================================== */

// Liste des étiquettes possibles, construite à partir des règles.
const ETIQUETTES = REGLES.map(function (regle) { return regle.etiquette; });

function afficherResultat(zone, texte) {
  zone.replaceChildren(); // vide le panneau

  // On coupe le texte autour des étiquettes. Grâce aux parenthèses,
  // split() garde les étiquettes dans la liste des morceaux.
  const morceaux = texte.split(/(\[[A-ZÉ°]+\])/);
  let numero = 0;

  for (const morceau of morceaux) {
    if (ETIQUETTES.includes(morceau)) {
      const etiquette = document.createElement("span");
      etiquette.className = "etiquette";
      etiquette.textContent = morceau;
      // --i : sert au CSS à décaler l'apparition de chaque étiquette
      etiquette.style.setProperty("--i", numero);
      numero++;
      zone.appendChild(etiquette);
    } else {
      zone.appendChild(document.createTextNode(morceau));
    }
  }

  // Relance la petite animation d'apparition du panneau
  zone.classList.remove("nouveau");
  void zone.offsetWidth; // force le navigateur à "oublier" l'animation précédente
  zone.classList.add("nouveau");
}

/* =====================================================================
 * 5. LIEN AVEC LA PAGE
 * On attend que la page soit chargée, puis on récupère les éléments
 * HTML par leur identifiant (id) et on réagit aux clics.
 * ===================================================================== */
document.addEventListener("DOMContentLoaded", function () {
  const zoneOrigine   = document.getElementById("texte-origine");
  const zoneResultat  = document.getElementById("texte-resultat");
  const message       = document.getElementById("message");
  const listeBilan    = document.getElementById("liste-bilan");
  const boutonCopier  = document.getElementById("bouton-copier");

  // Le dernier texte anonymisé, gardé en mémoire (dans une variable,
  // jamais sur le disque) pour pouvoir le copier.
  let dernierResultat = "";

  // Remet le panneau de résultat dans son état de départ.
  function viderResultat() {
    const vide = document.createElement("span");
    vide.className = "vide";
    vide.textContent = "Le texte nettoyé apparaîtra ici.";
    zoneResultat.replaceChildren(vide);
    dernierResultat = "";
    boutonCopier.disabled = true;
  }

  // Affiche le bilan sous les zones de texte, une pastille par type de donnée.
  function afficherBilan(bilan) {
    listeBilan.replaceChildren(); // vide la liste précédente

    if (bilan.length === 0) {
      message.textContent = "Aucune donnée personnelle détectée. Relisez quand même le texte.";
      return;
    }

    let total = 0;
    bilan.forEach(function (ligne, position) {
      total += ligne.nombre;
      const element = document.createElement("li");
      const nombre = document.createElement("strong");
      nombre.textContent = ligne.nombre;
      element.appendChild(nombre);
      element.appendChild(document.createTextNode(ligne.nom));
      element.style.setProperty("--i", position);
      listeBilan.appendChild(element);
    });
    message.textContent = total + (total > 1 ? " données masquées" : " donnée masquée");
  }

  // Bouton "Anonymiser"
  document.getElementById("bouton-anonymiser").addEventListener("click", function () {
    const texte = zoneOrigine.value;

    if (texte.trim() === "") {
      message.textContent = "Collez d'abord un texte dans la zone « Votre texte ».";
      listeBilan.replaceChildren();
      zoneOrigine.focus();
      return;
    }

    const analyse = anonymiser(texte);
    dernierResultat = analyse.texte;
    afficherResultat(zoneResultat, analyse.texte);
    afficherBilan(analyse.bilan);
    boutonCopier.disabled = false;
  });

  // Bouton "Essayer un exemple fictif"
  document.getElementById("bouton-exemple").addEventListener("click", function () {
    zoneOrigine.value = TEXTE_EXEMPLE;
    viderResultat();
    message.textContent = "Exemple chargé. Cliquez sur « Anonymiser ».";
    listeBilan.replaceChildren();
  });

  // Bouton "Tout effacer" : vide les deux zones (rien n'est conservé).
  document.getElementById("bouton-effacer").addEventListener("click", function () {
    zoneOrigine.value = "";
    viderResultat();
    message.textContent = "Tout a été effacé.";
    listeBilan.replaceChildren();
  });

  // Bouton "Copier le texte anonymisé"
  // On copie UNIQUEMENT le texte anonymisé, jamais le texte d'origine.
  boutonCopier.addEventListener("click", function () {
    if (dernierResultat === "") { return; }
    // L'API presse-papiers ne fonctionne que sur un site sécurisé (HTTPS).
    navigator.clipboard.writeText(dernierResultat).then(
      function () {
        boutonCopier.textContent = "Copié";
        // Le bouton reprend son texte après 2 secondes
        setTimeout(function () { boutonCopier.textContent = "Copier le texte anonymisé"; }, 2000);
      },
      function () { message.textContent = "Copie impossible : sélectionnez le texte et faites Ctrl+C."; }
    );
  });
});
