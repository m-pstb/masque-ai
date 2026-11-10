"""
Masque AI — calcul des empreintes SRI (Subresource Integrity)
-------------------------------------------------------------
À QUOI ÇA SERT
Chaque balise <script> et <link rel="stylesheet"> du site porte un
attribut integrity="sha384-..." : c'est l'empreinte du fichier.
Le navigateur recalcule cette empreinte au chargement ; si le fichier
a été modifié (par un pirate, ou par vous sans mettre à jour l'empreinte),
il refuse de l'utiliser.

QUAND LE LANCER
Après CHAQUE modification d'un fichier .css ou .js, depuis le dossier du projet :
    python outils/calculer-sri.py

CE QU'IL FAIT
1. Il lit chaque page HTML.
2. Pour chaque fichier CSS ou JS cité, il calcule l'empreinte SHA-384.
3. Il écrit cette empreinte dans l'attribut integrity.
"""
import base64
import hashlib
import pathlib
import re

DOSSIER = pathlib.Path(__file__).resolve().parent.parent   # dossier du projet
PAGES = ["index.html", "securite.html"]

# Repère une balise qui cite un fichier (src="..." ou href="...")
# suivi de son attribut integrity="...".
MOTIF = re.compile(r'((?:src|href)="([^"]+\.(?:js|css))"[^>]*?integrity=")([^"]*)(")')


def empreinte(chemin):
    """Calcule l'empreinte SHA-384 d'un fichier, au format attendu par le navigateur."""
    contenu = (DOSSIER / chemin).read_bytes()
    return "sha384-" + base64.b64encode(hashlib.sha384(contenu).digest()).decode()


for page in PAGES:
    fichier = DOSSIER / page
    html = fichier.read_text(encoding="utf-8")
    html = MOTIF.sub(lambda m: m.group(1) + empreinte(m.group(2)) + m.group(4), html)
    fichier.write_text(html, encoding="utf-8")
    print(page, ": empreintes mises à jour")
