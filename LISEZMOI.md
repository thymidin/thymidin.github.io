# Portail de suivi psychiatrique

Application locale : aucune installation, aucun serveur, aucune connexion Internet.
**Ouvrez `index.html` dans Chrome, Edge ou Firefox** (double-clic). Conservez tout le dossier
ensemble : la page charge les fichiers `css/` et `js/` qui l'accompagnent.

Les données sont enregistrées dans le navigateur, sur cet appareil. Faites des sauvegardes JSON
régulières (bouton « Sauvegarder » en haut : fichier chiffré par mot de passe) et gardez-les en lieu sûr.


## Mentions légales et conditions d'utilisation

À la **première ouverture**, le portail affiche ses mentions légales et conditions d'utilisation : elles doivent être
lues et acceptées (case à cocher) avant toute utilisation. Elles restent consultables et imprimables à tout moment
(menu latéral « Mentions légales », ou aide « ? »). Points essentiels : outil personnel, gratuit et **non officiel**,
ni fourni ni validé par un établissement ; pas un dossier patient ni un dispositif médical marqué CE ; fourni « en
l'état », sans garantie ; chaque utilisateur reste responsable de sa pratique et des données qu'il saisit ; en
établissement, respecter la politique de sécurité et les consignes du DPO ; tous droits réservés.

L'acceptation est propre à chaque navigateur : elle n'est pas transmise par une sauvegarde. Pour modifier le texte,
éditer `js/mentions.js` et **incrémenter `VERSION_CGU`** afin que l'acceptation soit redemandée.

## Documents imprimés : en-tête, logo, pied de page, marges

« Profil praticien » → **Mise en page des documents imprimés** : logo (PNG, JPEG ou SVG ; position et taille), en-tête
automatique (tiré du profil) ou personnalisé (texte libre, première ligne en gras), pied de page répété en bas de chaque
page (secrétariat, urgences…), mention adaptée au document (observations et courriers : « n’a pas valeur de certificat médical »), marges (étroites,
normales, larges) et police, avec aperçu. S'applique aux courriers, certificats, ordonnances, observations et à la courbe
de l'humeur. Les marges sont désormais produites par le document lui-même : elles sont respectées quel que soit le
réglage « Marges » de la fenêtre d'impression du navigateur. Sur les ordonnances et certificats, le n° RPPS est ajouté
s'il ne figure pas dans un en-tête personnalisé.

**Certificat médical remis au patient** (Documents → Certificats) : présence en consultation (date, horaire), suivi en
cours ou constatations libres ; formule finale « Certificat établi à la demande de l’intéressé(e) et remis en main
propre », ou au représentant légal nommé. N’y mentionner que ce qui est nécessaire à la demande, sans diagnostic sauf
accord exprès du patient.

**Bilan biologique en texte libre** : Documents → « Bilan biologique » (examens saisis
librement ou ajoutés depuis la liste « Ajouter un examen courant » : NFS, ionogramme, TSH, bilan hépatique…, à jeun, lieu de prélèvement, mention ALD).
La fenêtre « Ordonnance de bilans » de surveillance garde aussi sa zone « Prescription libre ».

## Version 4 : vers un dossier patient

**Agenda** (onglet « Agenda », Alt+2) : vues jour, semaine et mois ; un clic sur un créneau crée un rendez-vous, un
glisser-déposer le déplace, un clic l'ouvre. Rendez-vous : patient (recherche par nom ou dossier) ou intitulé libre
(réunion, indisponibilité), type (suivi, première consultation, post-hospitalisation, téléconsultation, injection,
entretien familial, visite à domicile, réunion), lieu, durée, statut (prévu, confirmé, honoré, non venu, annulé),
notes, répétition (chaque semaine, toutes les 2, 3 ou 4 semaines, chaque mois). Chevauchements signalés. Bouton « Note
de suivi » : marque le rendez-vous honoré et ouvre la note. Impression de la liste du jour ; export .ics de la période
affichée (initiales seulement) ; horaires, durée par défaut et jours affichés réglables. La date « prochaine
consultation » des fiches est tenue à jour par l'agenda. « Aujourd'hui » affiche les rendez-vous du jour avec leur
heure et une carte « Non venus, à recontacter » ; l'écran Consultation affiche le prochain rendez-vous, le nombre de
non-venues sur 6 mois et un bouton « + Planifier ».

**Fiche patient en trois onglets** : 1 · Identité (identité, coordonnées, ALD, allergies, médecin traitant, équipe
infirmière, personne de confiance, mesure de protection et mandataire), 2 · Synthèse et traitements (diagnostics,
synthèse, vigilance, suivi, traitements, échelles, notes), 3 · Relais. Un nouveau patient s'ouvre sur l'identité
(bouton « Suivant »), un patient existant sur la synthèse ; un point signale un relais en cours.

## Nouveautés de la version 3 (ergonomie)

**Équipes infirmières** (menu latéral « Équipes infirmières », ou bouton « Gérer… » dans la fiche) : annuaire des
cabinets infirmiers libéraux, IDE du CMP, HAD, SSIAD… (téléphones, messagerie sécurisée, adresse, référent(e)s,
notes). Chaque patient peut être rattaché à une équipe : elle s'affiche sur l'écran Consultation et dans le courrier de
relais. Une pastille **IDE** signale les patients rattachés à une équipe : bandeau du patient (un clic ouvre l'annuaire),
drapeaux de l'écran Consultation, file active et onglet Relais (le survol affiche l'équipe et ses coordonnées).

**Ordonnance de soins infirmiers** (Documents → « Soins infirmiers ») : administration et surveillance de la prise du
traitement oral (avec la mention d'impossibilité de s'auto-administrer le traitement), pilulier, injection d'antipsychotique
d'action prolongée (reprise de la fiche), surveillance clinique, constantes, prélèvement à domicile, BSI pour un patient
dépendant ; lieu, durée, dimanches et jours fériés, renouvellement, mention ALD. Rappels NGAP indicatifs affichés.

**Relais hors CMP** : dans la fiche, « Type de relais » (CMP, psychiatre libéral, médecin traitant, autre structure :
CSAPA, CMPP, hôpital de jour, centre expert…) et « Destinataire du relais ». La précision « Interne ou sénior » n'est
proposée que pour un relais vers une équipe. L'onglet s'appelle désormais « Relais » ; filtre par type de relais, vue
par destinataire, colonne dans l'export CSV. Le statut par défaut « RDV CMP fixé » devient « RDV fixé avec le
receveur » (fiches existantes reprises automatiquement si vous n'aviez pas personnalisé les statuts).

**Traitements symptomatiques** : suggestions ajoutées (laxatifs et traitements digestifs, hypersialorrhée, énurésie,
hypotension orthostatique, vitamines, substituts nicotiniques…).

**Onglet Documents épuré** : une liste déroulante « Document » (tous les modèles, classés par catégorie) et cinq
raccourcis (Ordonnance, Bilan biologique, Compte rendu, Relais, Certificat) ; « Copier » et « Régénérer » discrets au
-dessus du texte ; « Imprimer » et « Enregistrer » en bas.

**Démonstration** : « Plus » → « Charger les patients fictifs » (ou le bouton de l'écran d'accueil quand le portail est
vide) ajoute 10 patients inventés (dossiers « DEMO-01 » à « DEMO-10 ») : bipolaire sous lithium et lamotrigine avec
courbe de l'humeur, schizophrénie sous clozapine avec relais urgent, dépression sévère avec idées suicidaires sans plan
de sécurité, bilan TSA (AQ, EQ, RAADS-R), trouble panique, dépendance à l'alcool, TDAH, trouble schizo-affectif,
TSPT, premier épisode psychotique. Les dates sont calculées à partir du jour du chargement. « Retirer les patients
fictifs » les supprime sans toucher aux vraies fiches.

**Nouvelle disposition.** Menu latéral avec icônes, barre du haut avec la recherche, la sauvegarde, le thème et l'aide.
**Un seul patient ouvert pour tout le portail** : le bandeau en haut (nom, sexe, âge, dossier, allergies, vigilance)
le garde d'un onglet à l'autre ; crayon = fiche, flèches = changer de patient, croix = fermer. Les listes « Patient »
de chaque module ont disparu.

**Onglet « Aujourd'hui »** (ouvert au démarrage) : consultations du jour (date « prochaine consultation » de la fiche),
alertes cliniques (idées suicidaires sans plan de sécurité, QIDS ≥ 16, PHQ-9 ou GAD-7 ≥ 15), rappels échus ou à 7 jours,
consultations de la semaine, bilans en retard, relais urgents ou élevés, notes restées en brouillon. Les rubriques vides
sont résumées en une ligne « Rien à signaler ». La pastille du menu compte ce qui demande une action aujourd'hui.

**Rappels par patient** (écran Consultation) : « rappeler le patient », « vérifier la lithémie »… avec une date ; ils
remontent dans « Aujourd'hui » à l'échéance.

**Brouillons automatiques** : une note ou une observation en cours est enregistrée à chaque frappe ; fermer l'onglet
ou changer de patient ne fait rien perdre. Le brouillon est proposé à la réouverture.

**Mes phrases types** (sous le texte d'observation et sous les documents) : vos formulations habituelles, insérées
d'un clic à l'endroit du curseur. Six exemples fournis, à supprimer ou compléter ; elles font partie de la sauvegarde
chiffrée.

**Ordonnance de traitement** (Documents → Ordonnances) : reprend les traitements de la fiche, avec des rappels de
règles de prescription (durées maximales des hypnotiques et anxiolytiques, ordonnance sécurisée, carnet de suivi de la
clozapine, information valproate…). Rappels indicatifs : la réglementation en vigueur fait foi.

**Allergies et contre-indications** : nouveau champ de la fiche, affiché en clair dans le bandeau (⚠ suivi du texte ; texte complet au survol) ; un clic sur la pastille ouvre la fiche directement sur ce champ. Repris dans l'observation.

**Fiche patient allégée** : les raccourcis vers les modules sont regroupés dans le menu « Ouvrir… » en bas de la fiche.

**« Portail psy »** en haut à gauche ramène à l'accueil.

**Relais vers interne ou sénior** (fiche, partie relais, à côté du CMP receveur) : précise si le patient peut être relayé à un interne ou doit l'être à un sénior. Affiché dans la colonne Relais de la file active et de l'onglet Relais, dans le drapeau de l'écran Consultation et dans « Relais prioritaires » ; filtre dédié dans l'onglet Relais ; colonne dans l'export CSV. Libellés modifiables dans `js/config.js` (`RELAIS_VERS`).

**Confort** : thème clair, sombre ou automatique (bouton demi-lune) ; notifications discrètes en bas de l'écran ;
**Ctrl+S** enregistre la note, le document ou le score en cours ; **?** ouvre l'aide et le déroulé type d'une
consultation ; mise en page adaptée à la tablette et au téléphone ; impression sans le menu.

**Rédaction** : « n'a pas conscience de ses troubles *mais* est demandeur de soins » quand insight et rapport aux soins
vont en sens inverse.

## Nouveautés de la version 2

**Deux façons de l’ouvrir.** `index.html` (dossier complet) ou `portail-psychiatrie.html` (tout en un seul fichier,
plus simple à copier et à mettre à jour ; régénéré par `python3 outils/construire_fichier_unique.py`). Dans Chrome et
Edge, les deux retrouvent les mêmes données ; dans Firefox, passer par une sauvegarde chiffrée puis la restaurer.

**Écran Consultation**. Tout le patient sur un écran : identité, diagnostics, drapeaux (vigilance,
idées suicidaires à la dernière note, QIDS ≥ 16, bilans en retard, ALD, relais en cours), traitements avec leurs bilans,
dernière note, échelles avec courbe de tendance, humeur des 90 derniers jours, documents, et les actions du jour
(note de suivi, première observation, échelle, passation sur tablette, ordonnance de bilans, courriers, plan de
sécurité, certificat, MDPH). Le patient ouvert ici est repris par les autres onglets.

**Note de suivi** (onglet Observation, bouton « Note de suivi ») : évolution, événements, observance, tolérance,
consommations, examen et risque rédigés en phrases. « Reprendre l’examen précédent » recopie l’examen de la dernière
note : il ne reste qu’à cocher ce qui a changé.

**Documents** : compte rendu au médecin traitant, courrier de relais (avec traitements, bilans à prévoir et points de
vigilance), réponse à un confrère, plan de sécurité (6 étapes, numéros d’urgence, à remettre au patient), certificats de
soins sans consentement (SDT, SDT en urgence, péril imminent, SDRE, 24 h, 72 h, 5e-8e jour, mensuels SDT et SDRE).
Tout est pré-rédigé depuis la fiche et la dernière note, modifiable, imprimable avec l’en-tête du praticien et
enregistrable dans la fiche. Les certificats sont des modèles d’après le code de la santé publique : à vérifier avec
les modèles de votre établissement.

**Échelles** : PHQ-9 et GAD-7 ajoutées (libellés courts ; collez la version française officielle dans « Intitulés des
items » si vous le souhaitez) ; **passation sur tablette** (le patient répond seul, en plein écran, un item à la fois,
sans voir le score) ; **courbes d’évolution** de chaque échelle dans l’historique du patient.

**Sauvegarde chiffrée** (en haut à droite) : un fichier `.portail` contenant toutes les données, chiffré par mot de
passe (AES-GCM 256 bits, clé PBKDF2-SHA-256 à 310 000 itérations, outil intégré au navigateur). « Restaurer » le
recharge. Un bandeau rappelle de sauvegarder si la dernière sauvegarde date de plus de 7 jours. Sans le mot de passe,
la sauvegarde est illisible et ne peut pas être récupérée.

**Surveillance** : lamotrigine (titration, surveillance cutanée, sans bilan biologique exigé) ; molécules allongeant le
QT hors antipsychotiques (citalopram, escitalopram, hydroxyzine, méthadone, dompéridone : ECG de contrôle).

**MDPH** : le pré-remplissage reprend aussi la dernière note (éléments essentiels, conduite émotionnelle et
comportementale, projet thérapeutique).

**Traitements non psychiatriques** : troisième groupe dans la fiche (« + Ajouter » sous « Traitements non
psychiatriques »), à côté des traitements de fond et symptomatiques. Ils sont affichés à part partout (tableau, écran
Consultation, notes, courriers, MDPH) et ne figurent pas sur la courbe de l’humeur. Les règles de surveillance s’y
appliquent aussi (ex. dompéridone et QT).

**Raccourcis** : Ctrl+K (ou Cmd+K) rechercher un patient ; Alt+1 à Alt+9 changer d’onglet (Aujourd’hui, Agenda, Consultation, Observation, Échelles, Humeur, Documents, MDPH, File active ; Relais par le menu).

**Tests** : ouvrir `tests.html` vérifie les clés de cotation, les intitulés et les échéances de surveillance
(27 tests). À ouvrir après toute modification des échelles ou des règles.

**Limites** : outil local, mono-poste, sans authentification ; ce n’est pas un dossier patient. Un usage partagé ou
hébergé imposerait un hébergement certifié HDS et les formalités RGPD.

## Organisation des fichiers

| Fichier | Rôle | Le modifier ? |
|---|---|---|
| `index.html` | Structure de la page, textes affichés, avis de confidentialité | Rarement |
| `css/style.css` | Couleurs et mise en page (couleurs regroupées en haut du fichier) | Pour l'apparence |
| **`js/config.js`** | **Tous les réglages** : priorités, statuts, rythmes, calendriers de surveillance, médicaments et diagnostics suggérés, colonnes CSV | **Oui, c'est le fichier à adapter** |
| `js/outils.js` | Petites fonctions (dates, texte) | Non |
| `js/stockage.js` | Enregistrement, import / export JSON et CSV | Non |
| `js/surveillance.js` | Calcul des échéances de bilans, des retards, adaptation au sexe | Non (les règles sont dans `config.js`) |
| `js/ordonnance.js` | Profil du prescripteur et ordonnances de bilans | Non (textes et examens dans `config.js`) |
| `js/observation.js` | Formulaire de première observation et texte généré | Pour ajouter ou renommer des pastilles (section 1) |
| `js/humeur.js` | Courbe de l’humeur (life chart) par patient | Non |
| `js/echelles.js` | Cotation QIDS-SR16, AQ, EQ, RAADS-R | Non (clés de cotation vérifiées) |
| `js/mdph.js` | Aide au certificat médical MDPH (Cerfa 15695*01) | Rarement (rubriques) |
| `js/consultation.js` | Écran Consultation | Non |
| `js/documents.js` | Courriers, plan de sécurité, certificats de soins sans consentement | Pour adapter les modèles |
| `js/sauvegarde.js` | Sauvegarde chiffrée, restauration, rappel | Non |
| `js/raccourcis.js` | Recherche globale (Ctrl+K), raccourcis clavier | Non |
| `js/accueil.js` | Onglet « Aujourd'hui » | Non (seuils d'alerte en tête de `elementsAccueil`) |
| `js/apparence.js` | Icônes, thème, notifications, aide, Ctrl+S | Non |
| `js/demo.js` | Patients fictifs de démonstration | Non |
| `js/miseenpage.js` | En-tête, logo, pied de page et marges des documents imprimés | Non (réglages dans le profil praticien) |
| `js/mentions.js` | Mentions légales, conditions d'utilisation, acceptation | Pour changer le texte (incrémenter `VERSION_CGU`) |
| `js/agenda.js` | Agenda des consultations | Non (types de rendez-vous en tête du fichier) |
| `js/fiche.js` | Fiche patient en onglets | Non |
| `js/ide.js` | Annuaire des équipes infirmières | Non |
| `js/phrases.js` | Mes phrases types (exemples de départ en tête du fichier) | Pour changer les exemples |
| `js/interface.js` | Affichage du tableau, fiche patient, onglets, boutons | Non |
| `tests.html` | Tests des cotations et de la surveillance | Non |
| `outils/construire_fichier_unique.py` | Fabrique `portail-psychiatrie.html` | Non |

Après toute modification, enregistrez le fichier puis rechargez la page (F5).

## Mise à jour depuis la version précédente

Remplacez les fichiers **dans le même dossier** (même emplacement sur le disque) : la clé de stockage
`relais_cmp_v1` n'a pas changé, vos fiches réapparaissent telles quelles. Par sécurité, faites d'abord
une « Sauvegarde JSON » dans l'ancienne version.

**Reprendre l'ancienne courbe de l'humeur** : dans l'ancienne page, onglet « Données » → « Exporter (JSON) »,
copiez le texte ; dans le portail, onglet « Courbe de l'humeur », choisissez le patient, ouvrez
« Importer / exporter », collez puis « Importer dans ce patient ».

## Les onglets

| Onglet | Rôle |
|---|---|
| Aujourd’hui | Ce qui demande une action : consultations, alertes, rappels, bilans, relais, brouillons |
| Consultation | Le patient ouvert sur un écran, et les actions du jour |
| Documents | Ordonnances, courriers, plan de sécurité, certificats |
| Suivi de la file active | Tous les patients, traitements, bilans |
| Gestion des relais CMP | Patients à relayer : priorité, statut, CMP |
| Observation | Première observation clinique en consultation : texte généré à partir de pastilles |
| Courbe de l’humeur | Life chart du patient : humeur, sommeil, instabilité, traitements de la fiche, scores QIDS |
| Échelles | Cotation QIDS-SR16, AQ, EQ, RAADS-R, enregistrement dans la fiche |
| Certificat MDPH | Rubriques du Cerfa 15695*01 pré-remplies depuis la fiche, aperçu et impression |

Dans une fiche patient enregistrée, les boutons « Observation », « Courbe de l’humeur », « Échelles » et
« Certificat MDPH » ouvrent directement le module sur ce patient ; la fiche affiche un résumé des derniers scores.

## Observation (première consultation)

- Un clic coche une pastille ; « Examen normal » coche en une fois les éléments sans particularité des rubriques
  d’examen et de risque encore vides ; cocher ensuite un élément pathologique (ex. « Humeur triste ») retire
  l’élément normal correspondant.
- Utilisable en CMP comme en libéral : cadre « Première consultation » ou « Relais de suivi » (avec le praticien ou la
  structure qui passe le relais), adressage par médecin traitant, psychiatre, psychologue, CMP, urgences…
- Formulaire adaptatif : les précisions n’apparaissent que si elles servent (détail des hospitalisations ou des TS si
  « Une » / « Plusieurs », quantités si consommation, mécanismes et adhésion seulement en présence d’idées délirantes,
  facteurs de protection et évaluation RUD seulement en présence d’idées suicidaires…). L’examen somatique est replié.
- L’examen psychiatrique et l’évaluation du risque sont rédigés en phrases (« Elle se présente avec une tenue adaptée et
  une hygiène correcte. Le contact est de bonne qualité… »), et non en liste « rubrique : élément ».
- Le texte se construit au fil de la saisie (rubriques vides omises, accords selon le sexe de la fiche). Il reste
  modifiable ; « Régénérer » le reconstruit à partir du formulaire.
- « Enregistrer dans la fiche » garde le texte et l’état du formulaire (« Rouvrir » pour reprendre). L’hypothèse
  diagnostique et le prochain rendez-vous sont reportés dans la fiche seulement si ces champs y sont vides.
- Pastilles et rubriques modifiables dans `js/observation.js`, section 1 (syntaxe expliquée en tête du fichier).

## Échelles

Chaque item s’affiche avec son intitulé et les réponses propres à l’échelle (« Fortement d’accord… » pour l’AQ, « Tout à fait d’accord… » pour l’EQ,
« Vrai maintenant et quand j’avais moins de 16 ans… » pour la RAADS-R, les 4 propositions cotées 0 à 3 pour la QIDS-SR16).
Saisie au clic, au clavier (chiffre puis passage automatique à l’item suivant) ou en « saisie rapide ».

**Intitulés** : le texte des items vient des versions françaises du service (QIDS-SR16 version belge avec ses
propositions, RAADS-R, AQ, EQ), intégré dans `js/intitules.js`. Pour utiliser une autre version, collez-la dans
« Intitulés des items » (un item par ligne ; pour la QIDS, un bloc par item : intitulé puis les 4 propositions) :
elle remplace la version intégrée dans ce navigateur ; « Retirer » y revient.

| Échelle | Cotation | Seuils affichés |
|---|---|---|
| QIDS-SR16 | 9 domaines (max. des items sommeil 1-4, appétit/poids 6-9, psychomotricité 15-16), 0-27 | 0-5 / 6-10 / 11-15 / 16-20 / 21-27 ; alerte si item 12 ≥ 1 |
| AQ | 50 items, 1 point par réponse « autistique » (sans réponse = 0), 5 sous-échelles /10 | ≥ 26 (Woodbury-Smith 2005), ≥ 32 (Baron-Cohen 2001) |
| EQ (version à 40 items) | 2 points / 1 point pour « Tout à fait d’accord » / « Plutôt d’accord » aux items 1, 3, 11, 13-15, 21-24, 26-29, 34-40 ; sens inverse aux items 2, 4-10, 12, 16-20, 25, 30-33 ; sans réponse = 1 point ; 0-80 | ≤ 30 (Baron-Cohen & Wheelwright 2004) |
| RAADS-R | 80 items 3-2-1-0, 17 items normatifs inversés, 4 sous-échelles | Total ≥ 65 ; relations sociales ≥ 31, intérêts restreints ≥ 15, langage ≥ 4, sensori-moteur ≥ 16 (Ritvo 2011) ; sous-échelles aussi « ramenées à 7 items » comme la feuille de cotation |

Un questionnaire incomplet est signalé et son score marqué provisoire. Les scores QIDS apparaissent sur la courbe de l’humeur.
Ce sont des outils de dépistage et de suivi : ils ne posent pas de diagnostic.

## Certificat MDPH (Cerfa 15695*01 officiel)

- Le PDF officiel remplissable est intégré (`js/cerfa15695.js`) et rempli par `js/lib/pdf-lib.min.js` (bibliothèque libre,
  licence MIT, fonctionne hors ligne). Seuls les champs du formulaire sont remplis : mise en page, textes et numérotation
  restent ceux du Cerfa. Le PDF produit reste modifiable dans un lecteur PDF.
- La saisie suit le PDF dans l’ordre, avec ses intitulés. Cotations A / B / C / D / NSP et réponses Oui / Non en boutons
  (un second clic efface).
- Champs conditionnels : « Si oui, préciser » n’apparaît que si « Oui » est coché (emploi, aidant familial…), les fréquences
  et modalités de suivi que si la case correspondante est cochée, la durée prévisible que si « Amélioration » est choisie,
  etc. Si les trois questions de la page 1 sont à « Non », seul le certificat simplifié est proposé.
- Rubriques rarement utiles en psychiatrie (déficiences sensorielles, appareillage, aides techniques au déplacement)
  repliées derrière une case d’affichage.
- « Pré-remplir depuis la fiche » complète les champs vides : identité, diagnostics, traitements en cours, suivi CMP,
  derniers scores, coordonnées du médecin (Profil praticien).
- Brouillon enregistré à chaque modification dans la fiche. Le n° de sécurité sociale n’est jamais enregistré : il sert
  uniquement au PDF en cours de génération.
- « Télécharger le PDF rempli » ou « Ouvrir le PDF rempli » (pour imprimer). Signatures à apposer sur le document imprimé.

## Deux modes de fonctionnement pour les patients (onglets file active / relais)

- **Suivi de la file active** : tous vos patients, avec diagnostics, synthèse, traitements, bilans et retards.
  Vues « liste » et « bilans à faire ».
- **Gestion des relais CMP** : uniquement les patients marqués « à relayer » (priorité, statut, CMP receveur).
  Vues « liste », « par CMP » et « bilans à faire », avec filtres par priorité et statut.

Un patient est à relayer si la case **« Patient à relayer vers un CMP »** est cochée dans sa fiche ; les champs
de relais (priorité, statut, CMP) n'apparaissent alors qu'à ce moment-là. Les fiches créées avec la version
précédente sont toutes considérées « à relayer ». Les traitements sont saisis une seule fois, en lignes
(fond / symptomatiques) : l'ancien champ texte libre a été supprimé, son contenu éventuel a été recopié
dans les notes de la fiche.

## Traitements anciens (suivi repris de longue date)

Pour un traitement surveillé, cochez **« Traitement ancien / suivi repris »** :

- le bilan pré-thérapeutique n'est plus exigé ;
- la date d'introduction devient facultative (inutile de retrouver des bilans vieux de plusieurs années) ;
- le suivi reprend à la **date de reprise** (aujourd'hui par défaut, modifiable) : les étapes de début de
  traitement antérieures sont ignorées, et la prochaine échéance est calculée à partir du dernier bilan
  connu ou, à défaut, de la date de reprise.

Si la date d'introduction est renseignée, le calendrier reste exact pour un traitement récent (par exemple une
clozapine de 14 mois). Si elle est inconnue, seule la fréquence d'entretien s'applique, avec une fréquence
prudente pour la clozapine (mensuelle) tant que la date n'est pas connue.

## Sexe du patient et bilans adaptés

La fiche comporte un champ **Sexe** (Femme / Homme / Non renseigné). Il adapte les examens et les bilans :

| Situation | Adaptation |
|---|---|
| Femme en âge de procréer (12 à 50 ans, réglable) | β-hCG au bilan pré-thérapeutique (lithium, valproate, carbamazépine, antipsychotiques, clozapine) ; programme de prévention de la grossesse annuel (valproate) ; remarque contraception (carbamazépine, lithium) |
| Femme de moins de 25 ans | Prolactinémie avant un antipsychotique |
| Homme sous valproate | Bilan « réévaluation annuelle par un spécialiste » et rappel des précautions ANSM / PRAC (contraception, pas de don de sperme, 3 mois après l'arrêt) |
| Sexe non renseigné | Les éléments dépendants du sexe sont conservés **sous réserve** (signalés), jamais supprimés en silence |

Les âges, les examens et les remarques se règlent dans `js/config.js` (propriété `pour` : `femme`, `homme`,
`procreation`, `femmeMoins25`). Le sexe sert uniquement à adapter les bilans.

## Ordonnances de bilans

Dans une fiche patient, **« Ordonnance de bilans… »** prépare une ordonnance d'examens de biologie :

1. les bilans en retard ou à échéance proche sont pré-cochés (le bilan pré-thérapeutique non documenté aussi) ;
2. les examens correspondants, **sans doublon** et adaptés au sexe et à l'âge, sont listés et décochables un par un ;
3. vous pouvez ajouter des examens (clozapinémie, ECG…) et des renseignements cliniques ;
4. **Lieu et type** : choix « à domicile » / « au laboratoire » et « sanguin » / « urinaire » / « sanguin et urinaire »
   (automatique par défaut). La phrase générée est : « Faire pratiquer [lieu], un bilan [type] comprenant les paramètres
   suivants : » (modifiable dans `TEXTE_ORDONNANCE.phrase`, `config.js`).
5. **ALD** : case « Patient en ALD » dans la fiche (+ numéro/intitulé facultatif). Pour ces patients, l'ordonnance propose
   « en rapport avec l'ALD » ou « sans rapport avec l'ALD » et l'affiche en encadré.
6. Marges A4 : 22 mm haut, 20 mm côtés/bas (`@page` dans `css/style.css`).
7. « Imprimer » n'imprime que l'ordonnance (consigne « à jeun » ou lithémie à 12 h ajoutée si besoin).

L'en-tête vient du **Profil praticien** (bouton de la barre d'outils) : nom, RPPS, spécialité, établissement,
adresse. Ce profil est enregistré dans ce navigateur, séparément des patients.

### Pas d'authentification CPS / e-CPS

L'identification par CPS ou e-CPS n'est **pas** possible dans cette application. Elle passe par Pro Santé
Connect, le service d'authentification de l'ANS, qui impose un service web déclaré auprès de l'ANS (raccordement,
identifiants client confidentiels, adresse de redirection sécurisée). Une page ouverte localement ne peut pas
satisfaire ces exigences, et simuler une connexion donnerait une fausse impression de sécurité.
Conséquences : le profil praticien est saisi à la main, et **l'ordonnance imprimée est un document pré-rempli
qui doit être vérifié, daté et signé** par le prescripteur. Pour une signature électronique ou une
ordonnance numérique opposable, il faut passer par le logiciel métier de l'établissement.

## Modifications courantes (dans `js/config.js`)

**Changer un rythme de surveillance.** Les calendriers sont des listes de durées depuis
l'introduction du traitement. Exemple : faire passer le bilan antipsychotique de « trimestriel
la première année » à « tous les 4 mois » :

```js
calendrier: [MOIS(4), MOIS(8), MOIS(12), MOIS(18), MOIS(24)],
```

**Ajouter un médicament surveillé** : copier un bloc existant dans `REGLES_SURVEILLANCE`,
changer la clé, le `nom`, les `motsCles` (en minuscules, sans accents, séparés par `|`) et les `bilans`.
Les champs sont décrits en commentaire au début de la section 5.

**Ajouter des suggestions** : ajouter une ligne à `MEDICAMENTS_SUGGERES` (environ 90 molécules : thymorégulateurs, antipsychotiques oraux et injectables, antidépresseurs, anxiolytiques, addictologie, TDAH…) ou à `DIAGNOSTICS_CIM10` (environ 260 codes : chapitre F complet avec sous-codes des troubles liés aux substances, et comorbidités somatiques fréquentes).

**Changer le seuil « bientôt »** (orange) : `SEUIL_BIENTOT_JOURS`.

**Statuts du relais et rythmes de suivi** : modifiables sans code via le bouton « Paramètres ».
Les deux derniers statuts comptent comme « relais clos ».

## À ne pas modifier après avoir saisi des patients

- `CLE_STOCKAGE` : les fiches existantes ne seraient plus retrouvées.
- Les `id` des bilans (ex. `'li'`, `'bio'`) et les numéros de priorité (1 à 4) : les dates de bilans
  et les priorités déjà saisies y sont rattachées.

## Reprendre les données de l'ancienne version (fichier unique `relais-cmp.html`)

Chaque emplacement de fichier a son propre stockage. Dans l'ancienne version : « Sauvegarde JSON »,
puis dans la nouvelle : « Importer ». Le format des fiches est identique.

## Rappel important

Les calendriers de surveillance sont des repères issus de La Revue du Praticien et des RCP / communications
de l'ANSM (Valdoxan, Léponex, lithium). Ils ne remplacent ni le RCP en vigueur ni le protocole de votre
service. Les éléments marqués « indicatif » n'en font pas partie. Le calendrier PNN de la clozapine,
actualisé par l'ANSM en 2026, est à confirmer sur le RCP en vigueur.


## Ordonnances : ALD, lieu de prélèvement, marges
- Fiche patient : case « Patient en ALD » (+ numéro/intitulé facultatif), exportée en CSV (colonne `ald`).
- Dialogue d'ordonnance : lieu (à domicile / au laboratoire), type de bilan (automatique, sanguin, urinaire, les deux) et, si le patient est en ALD, choix « en rapport / sans rapport avec l'ALD ».
- Phrase générée : « Faire pratiquer [lieu], un bilan [type] comprenant les paramètres suivants : » (modifiable dans `js/config.js`, `TEXTE_ORDONNANCE`).
- Marges A4 réglables dans `css/style.css` (`@page`). La mention de pied de page a été supprimée.

## Concordance avec les feuilles de cotation du service

Les clés du portail ont été vérifiées contre `Cotation_Adulte_AQ_EQ.xlsm` (macro AQ/EQ) et `RAADSV2_cotation.xlsx` :
mêmes items cotés et inversés, mêmes sous-échelles, mêmes scores sur des réponses d’essai. En saisie rapide, l’AQ et
l’EQ acceptent le code 5 (« pas de réponse ») de la feuille de cotation.
