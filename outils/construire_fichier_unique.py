#!/usr/bin/env python3
"""Construit portail-psychiatrie.html : tout le portail (page, styles, scripts, Cerfa) dans UN seul fichier.

Usage :  python3 outils/construire_fichier_unique.py      (depuis le dossier du portail)

Le fichier unique se copie et se met à jour facilement (un seul fichier à remplacer).
Les données restent dans le navigateur : dans Chrome et Edge, toutes les pages ouvertes
depuis le disque partagent le même stockage, le fichier unique retrouve donc les fiches
de la version « dossier ». Dans Firefox, le stockage dépend de l'emplacement du fichier :
faire une sauvegarde chiffrée puis la restaurer dans le fichier unique.
"""
import pathlib, re, sys

racine = pathlib.Path(__file__).resolve().parent.parent
page = (racine / 'index.html').read_text(encoding='utf-8')

def css(m):
    return '<style>\n' + (racine / m.group(1)).read_text(encoding='utf-8') + '\n</style>'

def js(m):
    code = (racine / m.group(1)).read_text(encoding='utf-8')
    return '<script>\n' + code.replace('</script', '<\\/script') + '\n</script>'

page = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css, page)
page = re.sub(r'<script src="([^"]+)"></script>', js, page)
sortie = racine / 'portail-psychiatrie.html'
sortie.write_text(page, encoding='utf-8')
print(f'{sortie.name} : {sortie.stat().st_size / 1e6:.1f} Mo')
