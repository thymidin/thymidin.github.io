/* =====================================================================
   MDPH.JS — remplissage du certificat médical MDPH officiel
   ---------------------------------------------------------------------
   Le formulaire officiel Cerfa n° 15695*01 (PDF remplissable, 8 pages,
   189 champs) est intégré au portail (js/cerfa15695.js). Ce module :
     1. affiche une saisie qui suit le PDF dans l'ordre, avec ses intitulés ;
     2. remplit les champs du PDF officiel avec pdf-lib (js/lib/pdf-lib.min.js),
        sans rien modifier d'autre (mise en page, textes, numérotation) ;
     3. produit le PDF rempli, à télécharger ou à ouvrir pour l'imprimer.
   Le PDF reste un formulaire : il peut encore être corrigé dans un lecteur PDF.

   Le brouillon est enregistré dans la fiche du patient (patient.mdph2).
   Le n° de sécurité sociale n'est JAMAIS enregistré : il n'est saisi que
   pour la génération du PDF en cours.

   Correspondance avec le PDF : chaque élément ci-dessous indique le nom du
   champ PDF (« champ ») et, pour les cases à plusieurs positions, l'indice
   de la case (« w », dans l'ordre des widgets du champ).
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. DESCRIPTION DU FORMULAIRE (ordre et intitulés du Cerfa)
   Types :
     titre / sous   : intitulés de rubrique
     note           : texte du formulaire, pour se repérer
     texte          : champ texte du PDF          { champ, label, lignes, date }
     choix          : une case parmi plusieurs    { cle, label, options: [[libellé, champ, w]] }
     case           : case à cocher simple         { champ, label }
     abcd           : ligne de grille A/B/C/D/NSP  { champ, label }
     nir            : n° de sécurité sociale (15 cases, non enregistré)
     bascule        : affichage seulement (pas dans le PDF), pour masquer des rubriques rarement utiles
   « si » : condition d'affichage (fonction de l'état v).
   --------------------------------------------------------------------- */
const opts = (champ, libelles, depart = 0) => libelles.map((l, i) => [l, champ, depart + i]);
const ABCD = ['A', 'B', 'C', 'D', 'NSP'];
const coche = (v, cle, libelle) => {
  const el = MDPH_ELEMENTS.find(e => e.cle === cle);
  return el && v[cle] !== null && v[cle] !== undefined && el.options[v[cle]] && el.options[v[cle]][0] === libelle;
};
const certificatSimplifie = v => v.q1 === 1 && v.q2 === 1 && v.q3 === 1;      // trois réponses « Non »
const complet = v => !certificatSimplifie(v);

const MDPH_ELEMENTS = [
  { t: 'titre', texte: 'Page 1 · À l’attention du médecin' },
  { t: 'sous', texte: 'Depuis votre précédent certificat médical :' },
  { t: 'choix', cle: 'q1', label: 'L’état de santé (diagnostic, signes cliniques) de votre patient a-t-il changé ?', options: opts('Case à cocher Option P1 1', ['Oui', 'Non']) },
  { t: 'choix', cle: 'q2', label: 'Les retentissements fonctionnels ou relationnels dans les différents domaines de la vie de votre patient (mobilité, communication, cognition, entretien personnel, vie quotidienne et domestique, vie sociale et familiale, scolarité et emploi) ont-ils changé ?', options: opts('Case à cocher Option P1 2', ['Oui', 'Non']) },
  { t: 'choix', cle: 'q3', label: 'La prise en charge thérapeutique de votre patient (médicamenteuse, y compris ses conséquences ; médicales ou paramédicales ; appareillages) a-t-elle été modifiée ?', options: [['Oui', 'Case à cocher Option P1 3', 0], ['Non', 'Case à cocher Option P1 4', 0]] },
  { t: 'note', texte: 'Si vous avez répondu oui à au moins une de ces trois questions, veuillez remplir la totalité du certificat médical. Dans le cas contraire, vous pouvez remplir le certificat médical simplifié.' },
  { t: 'sous', texte: 'Certificat médical simplifié', si: certificatSimplifie },
  { t: 'texte', w: 6, champ: 'Docteur', label: 'Je soussigné Docteur', si: certificatSimplifie },
  { t: 'texte', w: 6, champ: 'Monsieur Madame', label: 'certifie qu’il n’y a aucun changement dans la situation de M. ou Mme', si: certificatSimplifie },
  { t: 'texte', w: 3, champ: 'Date ', label: 'Date', date: true, si: certificatSimplifie },

  { t: 'titre', texte: 'Page 1 · À l’attention du patient' },
  { t: 'texte', w: 6, champ: 'nom de naissance', label: 'Nom de naissance' },
  { t: 'texte', w: 6, champ: 'nom d\'usage', label: 'Nom d’usage' },
  { t: 'texte', w: 6, champ: 'préno', label: 'Prénom' },
  { t: 'texte', w: 3, champ: 'date naissanc', label: 'Date de naissance', date: true },
  { t: 'texte', champ: 'Adresse', label: 'Adresse', lignes: 2, w: 12 },
  { t: 'nir', w: 6, label: 'N° d’immatriculation sécurité sociale (non enregistré)' },
  { t: 'texte', w: 6, champ: 'numéro dossier MDPH', label: 'N° de dossier auprès de la MDPH' },
  { t: 'texte', champ: 'Principaux Besoins', label: 'Quels sont les principaux besoins et attentes exprimés dans votre demande à la MDPH ?', lignes: 3 },

  { t: 'titre', texte: '1. Pathologie motivant la demande', si: complet },
  { t: 'texte', w: 12, champ: 'Pathologie motivant la demande :', label: 'Pathologie motivant la demande', liste: 'listeCim', si: complet },
  { t: 'texte', champ: 'Autres pathologies éventuelles : ', label: 'Autres pathologies éventuelles', lignes: 2, si: complet },
  { t: 'texte', champ: 'Eléments essentiels à retenir', label: 'Éléments essentiels à retenir (diagnostic, facteurs de gravité…)', lignes: 5, si: complet },

  { t: 'titre', texte: '2. Histoire de la pathologie motivant la demande', si: complet },
  { t: 'choix', w: 6, cle: 'origine', label: 'Origine, circonstances d’apparition', si: complet,
    options: [['Congénitale', 'Case à cocher Option P2 1', 0], ['Maladie', 'Case à cocher Option P2 1', 2], ['Accident vie privée', 'Case à cocher Option P2 1', 4],
              ['Accident du travail', 'Case à cocher Option P2 1', 1], ['Maladie professionnelle', 'Case à cocher Option P2 1', 3]] },
  { t: 'choix', w: 6, cle: 'apparition', label: 'Date d’apparition', si: complet,
    options: [['A la naissance', 'Case à cocher Option P2 2', 0], ['Depuis moins de un an', 'Case à cocher Option P2 2', 2],
              ['Depuis 1 à 5 ans', 'Case à cocher Option P2 2', 1], ['Depuis plus de 5 ans', 'Case à cocher Option P2 2', 3]] },
  { t: 'texte', champ: 'Antécédents médicaux', label: 'Antécédents médicaux, chirurgicaux, périnataux en rapport avec le handicap', lignes: 4, si: complet },
  { t: 'texte', champ: 'Pour un enfant, indiquer la présence éventuelle d’un retard dans les acquisitions principales', label: 'Pour un enfant, indiquer la présence éventuelle d’un retard dans les acquisitions principales (développement psychomoteur, langage…)', lignes: 2, si: v => complet(v) && v._enfant },

  { t: 'titre', texte: '3. Description clinique actuelle', si: complet },
  { t: 'texte', champ: 'KG', label: 'Poids (kg)', w: 2, si: complet },
  { t: 'texte', champ: 'CM', label: 'Taille (cm)', w: 2, si: complet },
  { t: 'choix', cle: 'lateralite', label: 'Latéralité dominante avant handicap', options: opts('Case à cocher Option P2 3', ['Droite', 'Gauche']), w: 8, si: complet },
  // Tableau « Description des signes cliniques invalidants et fréquence » : 3 lignes, comme le Cerfa.
  { t: 'signes', si: complet },
  ...[1, 2, 3].flatMap(n => [
    { t: 'texte', champ: 'Description des signes cliniques ' + n, label: `Signe clinique invalidant ${n}`, lignes: 2, cellule: true, si: complet },
    { t: 'choix', cle: 'freq' + n, label: 'Fréquence', cellule: true, si: complet,
      options: opts('Case à cocher Option P2 ' + (n + 3), ['Permanents', 'Réguliers', 'Ponctuel']) },
  ]),
  { t: 'texte', champ: 'Précisions P2', label: 'Précisions', lignes: 2, si: complet },

  { t: 'choix', cle: 'evolution', label: 'Perspective d’évolution globale', si: complet,
    options: [['Stabilité', 'Case à cocher Option P3 1', 0], ['Aggravation', 'Case à cocher Option P3 1', 1], ['Incapacité fluctuante', 'Case à cocher Option P3 1', 2],
              ['Evolutivité majeure', 'Case à cocher Option P3 1', 3], ['Amélioration', 'Case à cocher Option P3 1', 4], ['Non définie', 'Case à cocher Option P3 1', 5]] },
  { t: 'texte', w: 12, champ: 'Amélioration', label: 'Amélioration : préciser la durée prévisible des limitations fonctionnelles', si: v => complet(v) && coche(v, 'evolution', 'Amélioration') },
  { t: 'texte', champ: 'Comptes-rendus joints', label: 'Comptes-rendus joints. Préciser (par exemple bilan des Centres de Ressources Autisme, questionnaire sur le handicap psychique, bilan UEROS, etc.)', lignes: 2, si: complet },

  { t: 'titre', texte: '4. Déficiences sensorielles', si: complet },
  { t: 'bascule', cle: '_sensoriel', label: 'Déficience auditive ou visuelle à signaler', si: complet },
  { t: 'note', texte: 'En cas de déficience auditive avec un retentissement significatif, joindre le compte rendu type pour un bilan auditif rempli par un ORL (Volet 1 du cerfa n°15695*01).', si: v => complet(v) && v._sensoriel },
  { t: 'texte', champ: 'Observations P3 1', label: 'Déficience auditive : observations', lignes: 2, si: v => complet(v) && v._sensoriel },
  { t: 'note', texte: 'En cas de déficience visuelle avec un retentissement significatif, joindre le compte-rendu type pour un bilan ophtalmologique rempli par un ophtalmologiste (Volet 2 du cerfa n°15695*01).', si: v => complet(v) && v._sensoriel },
  { t: 'texte', champ: 'Observations P3 2', label: 'Déficience visuelle : observations', lignes: 2, si: v => complet(v) && v._sensoriel },

  { t: 'titre', texte: '5. Traitements et prises en charge thérapeutiques', si: complet },
  { t: 'note', texte: 'Contraintes et effets secondaires présents ayant un impact sur la vie quotidienne. Précisez dans chaque cas la fréquence et la durée.', si: complet },
  { t: 'texte', champ: 'Classes thérapeutiques ou nom des médicaments', label: 'Classes thérapeutiques ou nom des médicaments', lignes: 3, si: complet },
  { t: 'texte', champ: 'Effets secondaires du traitement', label: 'Effets secondaires du traitement', lignes: 2, si: complet },
  { t: 'texte', champ: 'Autres contraintes si connues', label: 'Autres contraintes si connues (modalités d’administration, nécessité de déplacement, recours à une tierce personne, répercussions sur la vie sociale, familiale et/ou professionnelle…)', lignes: 2, si: complet },
  { t: 'texte', champ: 'Régime alimentaire', label: 'Régime alimentaire', lignes: 2, si: complet },
  { t: 'sous', texte: 'Autre prise en charge concernant les soins', si: complet },
  { t: 'case', w: 6, champ: 'Case à cocher P3 1', label: 'Hospitalisations itératives ou programmées', si: complet },
  { t: 'case', w: 6, champ: 'Case à cocher P3 2', label: 'Soins ou traitements nocturnes (si oui, préciser)', si: complet },
  { t: 'case', w: 6, champ: 'Case à cocher P3 3', label: 'Suivi médical spécialisé', si: complet },
  { t: 'case', w: 6, champ: 'Case à cocher P3 4', label: 'Autres', si: complet },
  { t: 'texte', w: 4, champ: 'Fréquence P3', label: 'Fréquence', si: v => complet(v) && ['Case à cocher P3 1', 'Case à cocher P3 2', 'Case à cocher P3 3', 'Case à cocher P3 4'].some(c => v[c]) },
  { t: 'texte', champ: 'Précisions P3 2', label: 'Précisions', lignes: 3, si: v => complet(v) && ['Case à cocher P3 1', 'Case à cocher P3 2', 'Case à cocher P3 3', 'Case à cocher P3 4'].some(c => v[c]) },

  { t: 'sous', texte: 'Prise en charge sanitaire régulière (fréquence)', si: complet },
  ...['Ergothérapeute', 'Infirmière', 'Kinésithérapeute', 'Orthophoniste', 'Orthoptiste', 'Psychologue', 'Psychomotricien', 'Autre'].flatMap((l, i) => [
    { t: 'case', champ: 'Case à cocher P4 ' + (i + 1), label: l, w: 4, debutLigne: true, si: complet },
    ...(l === 'Autre' ? [{ t: 'texte', champ: 'Autre P4', label: 'Préciser', compact: true, w: 4, si: v => complet(v) && v['Case à cocher P4 8'] }] : []),
    { t: 'texte', champ: 'Fréquence P4 ' + (i + 1), label: 'Fréquence', compact: true, w: 4, si: v => complet(v) && v['Case à cocher P4 ' + (i + 1)] },
  ]),
  { t: 'sous', texte: 'Suivis pluridisciplinaires (modalité de suivi)', si: complet },
  ...['CMPP (Centre Médico Psycho-Pédagogique)', 'CMP (Centre Médico Psychologique)', 'CATTP (Centre d’Accueil Thérapeutique à Temps Partiel)', 'Hôpital de jour', 'Autre'].flatMap((l, i) => [
    { t: 'case', champ: 'Case à cocher P4 ' + (i + 9), label: l, w: 6, debutLigne: true, si: complet },
    ...(l === 'Autre' ? [{ t: 'texte', champ: 'Autre 2', label: 'Préciser', compact: true, w: 2, si: v => complet(v) && v['Case à cocher P4 13'] }] : []),
    { t: 'texte', champ: 'Modalité de suivi ' + (i + 1), label: 'Modalité de suivi', compact: true, w: l === 'Autre' ? 4 : 6, si: v => complet(v) && v['Case à cocher P4 ' + (i + 9)] },
  ]),
  { t: 'texte', champ: 'Projet Therapeutique', label: 'Projet thérapeutique', lignes: 5, si: complet },

  { t: 'sous', texte: 'Type d’appareillage', si: complet },
  { t: 'bascule', cle: '_appareillage', label: 'Le patient utilise un appareillage', si: complet },
  ...[
    ['choix', { cle: 'correction', label: 'Corrections auditives', options: opts('Case à cocher Option P4 1', ['Unilatérale', 'Bilatérale']) }],
    ['case', { champ: 'Case à cocher 20', label: 'Corrections auditives : appareillage' }],
    ['case', { champ: 'Case à cocher 21', label: 'Corrections auditives : implant' }],
    ['case', { champ: 'Case à cocher 22', label: 'Aide à mobilité : déambulateur' }],
    ['case', { champ: 'Case à cocher 23', label: 'Aide à mobilité : canne' }],
    ['case', { champ: 'Case à cocher 24', label: 'Aide à mobilité : orthèse, prothèse (préciser)' }],
    ['case', { champ: 'Case à cocher 25', label: 'Aide à mobilité : fauteuil roulant électrique' }],
    ['case', { champ: 'Case à cocher 26', label: 'Aide à mobilité : fauteuil roulant manuel' }],
    ['case', { champ: 'Case à cocher 27', label: 'Aide à mobilité : autre' }],
    ['texte', { champ: 'Autre préciser ( Ex : Scooter, …) ', label: 'Autre préciser (Ex : Scooter, …)', siCase: 'Case à cocher 27' }],
    ['case', { champ: 'Case à cocher 28', label: 'Appareillage visuel : télé-agrandisseur' }],
    ['case', { champ: 'Case à cocher 29', label: 'Appareillage visuel : terminal-braille' }],
    ['case', { champ: 'Case à cocher 30', label: 'Appareillage visuel : logiciel de basse vision' }],
    ['case', { champ: 'Case à cocher 31', label: 'Appareillage visuel : loupe' }],
    ['case', { champ: 'Case à cocher 32', label: 'Appareillage visuel : logiciel de synthèse vocale' }],
    ['case', { champ: 'Case à cocher 33', label: 'Alimentation / Élimination : gastro ou jéjunostomie d’alimentation' }],
    ['case', { champ: 'Case à cocher 34', label: 'Alimentation / Élimination : stomie digestive d’élimination' }],
    ['case', { champ: 'Case à cocher 35', label: 'Alimentation / Élimination : sonde urinaire' }],
    ['case', { champ: 'Case à cocher 36', label: 'Alimentation / Élimination : stomie urinaire' }],
    ['case', { champ: 'Case à cocher 37', label: 'Aides respiratoires : trachéotomie' }],
    ['case', { champ: 'Case à cocher 38', label: 'Aides respiratoires : O2' }],
    ['case', { champ: 'Case à cocher 39', label: 'Aides respiratoires : appareil de ventilation (préciser)' }],
    ['case', { champ: 'Case à cocher 40', label: 'Aide à la parole : prothèse phonatoire' }],
    ['texte', { champ: 'Autre appareillage', label: 'Autre appareillage' }],
    ['texte', { champ: 'Précisions (type, adaptation, circonstances d’utilisation, autonomie de la personne à l’utiliser, co', label: 'Précisions (type, adaptation, circonstances d’utilisation, autonomie de la personne à l’utiliser, compliance)', lignes: 2 }],
  ].map(([t, e]) => ({ t, w: t === 'case' ? 6 : 12, ...e, si: v => complet(v) && v._appareillage && (!e.siCase || v[e.siCase]) })),

  { t: 'titre', texte: '6. Retentissement fonctionnel et/ou relationnel', si: complet },
  { t: 'texte', w: 4, champ: 'Deplacement', label: 'Déplacement : périmètre de marche', si: complet },
  { t: 'bascule', cle: '_aidesTechniques', label: 'Utilise des aides techniques au déplacement (cannes, déambulateur, fauteuil)', si: complet },
  ...[['Cannes', 41], ['Déambulateur', 43], ['Fauteuil roulant manuel', 45], ['Fauteuil roulant électrique', 47]].flatMap(([l, n], i) => [
    { t: 'case', champ: 'Case à cocher ' + n, label: `${l} : en intérieur`, w: 4, debutLigne: true, si: v => complet(v) && v._aidesTechniques },
    { t: 'case', champ: 'Case à cocher ' + (n + 1), label: 'en extérieur', w: 3, si: v => complet(v) && v._aidesTechniques },
    { t: 'texte', champ: 'Fréquence d’utilisation ' + (i + 1), label: 'Fréquence d’utilisation', compact: true, w: 5,
      si: v => complet(v) && v._aidesTechniques && (v['Case à cocher ' + n] || v['Case à cocher ' + (n + 1)]) },
  ]),
  { t: 'choix', w: 4, cle: 'ralentissement', label: 'Ralentissement moteur', options: opts('Case à cocher Option P5 1', ['Oui', 'Non']), si: complet },
  { t: 'choix', w: 4, cle: 'pauses', label: 'Besoin de pauses', options: opts('Case à cocher Option P5 2', ['Oui', 'Non']), si: complet },
  { t: 'choix', w: 4, cle: 'accompagnement', label: 'Besoin d’accompagnement pour les déplacements extérieurs', options: opts('Case à cocher Option P5 3', ['Oui', 'Non']), si: complet },

  { t: 'legende', si: complet },
  { t: 'sous', texte: 'Mobilité, manipulation / Capacité motrice — maintien postural, déplacement, manipulation, préhension, contrôle de l’environnement', si: complet },
  ...[['Marcher', 4], ['Se déplacer à l’intérieur', 5], ['Se déplacer à l’extérieur', 6], ['Préhension main dominante', 7], ['Préhension main non dominante', 8], ['Motricité fine', 9]]
    .map(([l, n]) => ({ t: 'abcd', cle: 'P5_' + n, champ: 'Case à cocher Option P5 ' + n, label: l, si: complet })),
  { t: 'texte', champ: 'Précisions 3', label: 'Précisions', lignes: 2, si: complet },

  { t: 'sous', texte: 'Communication', si: complet },
  ...[['Communiquer avec les autres (s’exprimer, se faire comprendre…)', 10], ['Utiliser le téléphone', 11], ['Utiliser les autres appareils et techniques de communication (téléalarme, ordinateur…)', 12]]
    .map(([l, n]) => ({ t: 'abcd', cle: 'P5_' + n, champ: 'Case à cocher Option P5 ' + n, label: l, si: complet })),
  { t: 'choix', cle: 'aideHumaineCom', label: 'Nécessité d’un recours à une aide humaine (interprète, interface ou codeur LPC, etc.) avec appareillage', options: opts('Case à cocher Option P5 13', ['Oui', 'Non']), si: complet },
  { t: 'texte', champ: 'Précisions 4', label: 'Précisions', lignes: 2, si: complet },
  { t: 'note', texte: 'Bilan orthophonique à joindre en cas de troubles du langage oral et écrit avec un retentissement significatif.', si: complet },

  { t: 'sous', texte: 'Cognition / Capacité cognitive — attention, mémoire, apprentissage, praxie, raisonnement, orientation dans le temps ou l’espace…', si: complet },
  ...[['Orientation dans le temps', 1], ['Orientation dans l’espace', 2], ['Gestion de la sécurité personnelle', 3], ['Maîtrise du comportement', 4]]
    .map(([l, n]) => ({ t: 'abcd', cle: 'P6_' + n, champ: 'Case à cocher Option P6 ' + n, label: l, si: complet })),
  { t: 'texte', champ: 'Précisions P6 1', label: 'Précisions. Indiquer les autres atteintes sur le plan cognitif', lignes: 5, si: complet },
  { t: 'texte', champ: 'Conduite émotionnelle et comportementale', label: 'Conduite émotionnelle et comportementale (Ex : relation avec autrui dans la conduite émotionnelle et comportementale)', lignes: 4, si: complet },
  { t: 'choix', cle: 'vieRelationnelle', label: 'Retentissement sur la vie relationnelle, sociale et familiale (insuffisante gestion des situations à risque, mise en danger…)', options: opts('Case à cocher Option P6 5', ['Oui', 'Non', 'NSP']), si: complet },
  { t: 'sous', texte: 'La personne sait-elle :', si: complet },
  { t: 'case', champ: 'Case à cocher P6 1', label: 'Lire', w: 3, si: complet },
  { t: 'case', champ: 'Case à cocher P6 2', label: 'Écrire', w: 3, si: complet },
  { t: 'case', champ: 'Case à cocher P6 3', label: 'Calculer', w: 3, si: complet },
  { t: 'case', champ: 'Case à cocher P6 4', label: 'NSP', w: 3, si: complet },

  { t: 'sous', texte: 'Entretien personnel — toilette, habillage, continence, alimentation…', si: complet },
  ...[['Faire sa toilette', 6], ['S’habiller, se déshabiller', 7], ['Manger et boire des aliments préparés', 8], ['Couper ses aliments', 9], ['Assurer l’hygiène de l’élimination urinaire', 10], ['Assurer l’hygiène de l’élimination fécale', 11]]
    .map(([l, n]) => ({ t: 'abcd', cle: 'P6_' + n, champ: 'Case à cocher Option P6 ' + n, label: l, si: complet })),
  { t: 'texte', champ: 'Précisions (si incontinence, si supervision ou stimulation nécessaire…)', label: 'Précisions (si incontinence, si supervision ou stimulation nécessaire…)', lignes: 2, si: complet },

  { t: 'sous', texte: 'Vie quotidienne et vie domestique — travaux ménagers, courses, préparer un repas, gérer un budget, faire des démarches… (NB : à compléter par comparaison avec une personne du même âge)', si: complet },
  ...[['Prendre son traitement médical', 1], ['Gérer son suivi des soins', 2], ['Faire les courses', 3], ['Préparer un repas', 4], ['Assurer les tâches ménagères', 5], ['Faire des démarches administratives', 6], ['Gérer son budget', 7]]
    .map(([l, n]) => ({ t: 'abcd', cle: 'P7_' + n, champ: 'Case à cocher Option P7 ' + n, label: l, si: complet })),
  { t: 'texte', champ: 'Autre (préciser) :', label: 'Autre (préciser)', lignes: 2, si: complet },
  { t: 'texte', champ: 'Précisions P7', label: 'Précisions', lignes: 2, si: complet },

  { t: 'sous', texte: 'Retentissement sur vie sociale et familiale', si: complet },
  { t: 'choix', w: 6, cle: 'situationFamiliale', label: 'Situation familiale', options: opts('Case à cocher Option P5 8', ['Vie familiale', 'Isolement', 'Rupture', 'Autre (préciser)'], 5), si: complet },
  { t: 'choix', w: 6, cle: 'aidant', label: 'Présence d’un aidant familial', options: opts('Case à cocher Option P5 9', ['Oui', 'Non'], 5), si: complet },
  { t: 'texte', champ: 'Quel est le lien de l’aidant avec la personne en situation de handicap ? ', label: 'Quel est le lien de l’aidant avec la personne en situation de handicap ?', retrait: true, si: v => complet(v) && coche(v, 'aidant', 'Oui') },
  { t: 'texte', champ: 'Quel type d’intervention ?', label: 'Quel type d’intervention ?', lignes: 2, retrait: true, si: v => complet(v) && coche(v, 'aidant', 'Oui') },
  { t: 'texte', champ: 'Précisions P7 2', label: 'Précisions', lignes: 2, si: complet },

  { t: 'texte', champ: ' Retentissement sur la scolarité et les études supérieures :', label: 'Retentissement sur la scolarité et les études supérieures', lignes: 3, si: complet },

  { t: 'sous', texte: 'Retentissement sur l’emploi', si: complet },
  { t: 'note', texte: 'Avis du médecin du travail joint (si disponible).', si: complet },
  { t: 'choix', cle: 'aptitude', label: 'Si travaille actuellement, retentissement sur l’aptitude au poste et/ou le maintien dans l’emploi', options: opts('Case à cocher Option P5 10', ['Oui', 'Non', 'NSP'], 5), si: complet },
  { t: 'texte', champ: 'Si oui, préciser  2', label: 'Si oui, préciser', lignes: 2, retrait: true, si: v => complet(v) && coche(v, 'aptitude', 'Oui') },
  { t: 'choix', cle: 'rechercheEmploi', label: 'Si ne travaille pas actuellement, retentissement sur la recherche d’emploi ou le suivi de formation', options: opts('Case à cocher Option P5 11', ['Oui', 'Non', 'NSP'], 5), si: complet },
  { t: 'texte', champ: 'Si oui, préciser  3', label: 'Si oui, préciser', lignes: 2, retrait: true, si: v => complet(v) && coche(v, 'rechercheEmploi', 'Oui') },

  { t: 'titre', texte: '7. Remarques ou observations complémentaires si besoin', si: complet },
  { t: 'texte', champ: 'Remarques ou observations complémentaires si besoin ', label: 'Remarques ou observations complémentaires', lignes: 6, si: complet },

  { t: 'titre', texte: '8. Coordonnées et signature', si: complet },
  { t: 'texte', w: 6, champ: 'Docteur 2', label: 'Docteur', si: complet },
  { t: 'choix', w: 6, cle: 'medecinTraitant', label: 'Médecin traitant', options: opts('Case à cocher Option P8 1', ['Oui', 'Non']), si: complet },
  { t: 'texte', w: 3, champ: 'Identifiant RPPS :', label: 'Identifiant RPPS', si: complet },
  { t: 'texte', w: 3, champ: 'Identifiant ADELI :', label: 'Identifiant ADELI', si: complet },
  { t: 'texte', champ: 'Adresse postale :', label: 'Adresse postale', lignes: 2, si: complet },
  { t: 'texte', w: 4, champ: 'Téléphone : ', label: 'Téléphone', si: complet },
  { t: 'texte', w: 8, champ: 'Email', label: 'Email', si: complet },
  { t: 'texte', w: 6, champ: 'Document rédigé à la demande du patient', label: 'Document rédigé à la demande du patient et remis en main propre le', date: true, si: complet },
  { t: 'texte', w: 6, champ: 'Fait à', label: 'Fait à', si: complet },
  { t: 'note', texte: 'Signature du médecin et signature du patient (non obligatoire) : à apposer sur le document imprimé.', si: complet },
];

const NIR_CHAMPS = Array.from({ length: 15 }, (_, i) => 'N° immatriculation SS ' + (i + 1));

let mdphPatientId = '';
let mdphEtat = {};                 // v : valeurs saisies (textes, cases, choix, bascules)
let mdphNir = '';                  // n° de sécurité sociale : en mémoire seulement
const patientMdph = () => patients.find(p => p.id === mdphPatientId);
const elementVisible = el => !el.si || !!el.si(mdphEtat);


/* ---------------------------------------------------------------------
   2. INTERFACE
   --------------------------------------------------------------------- */
/** Largeur d'un élément dans la grille de 12 colonnes de sa rubrique. */
function largeurMdph(el) {
  if (el.w) return el.w;
  if (el.t === 'texte') return el.lignes ? 12 : 6;
  if (el.t === 'choix') return el.label.length > 70 ? 12 : 6;
  if (el.t === 'case') return 6;
  return 12;
}

const TITRES_ABCD = ['Réalisé sans difficulté et sans aucune aide', 'Réalisé avec difficulté mais sans aide humaine', 'Réalisé avec aide humaine : directe ou stimulation', 'Non réalisé', 'Ne se prononce pas'];

/** Contrôle de saisie seul (sans libellé ni enveloppe), réutilisé dans les cellules de tableau. */
function htmlControleMdph(el, i) {
  const v = mdphEtat;
  if (el.t === 'texte') {
    const valeur = echapper(v[el.champ] || '');
    const indice = el.compact ? ` placeholder="${echapper(el.label)}" aria-label="${echapper(el.label)}"` : el.date ? ' placeholder="JJ/MM/AAAA"' : '';
    return el.lignes
      ? `<textarea data-i="${i}" rows="${el.lignes}"${indice}>${valeur}</textarea>`
      : `<input data-i="${i}" value="${valeur}"${el.liste ? ` list="${el.liste}"` : ''}${indice}>`;
  }
  if (el.t === 'choix') {
    return `<div class="${el.options.length > 3 ? 'choix-multiples' : 'segments'}">${el.options.map(([l], k) =>
      `<button type="button" data-i="${i}" data-k="${k}" class="${v[el.cle] === k ? 'on' : ''}">${echapper(l)}</button>`).join('')}</div>`;
  }
  return '';
}

function htmlElementMdph(el, i) {
  const v = mdphEtat;
  const cache = elementVisible(el) ? '' : ' hidden';
  const style = ` style="grid-column: ${el.debutLigne ? '1 / ' : ''}span ${largeurMdph(el)}"`;
  const debut = el.debutLigne ? ' debut-ligne' : '';
  const attr = `data-el="${i}"${cache}`;
  switch (el.t) {
    case 'sous': return `<div class="mdph-sous" ${attr}${style}>${echapper(el.texte)}</div>`;
    case 'note': return `<div class="mdph-note" ${attr}${style}>${echapper(el.texte)}</div>`;
    case 'legende': return `<div class="mdph-legende" ${attr}${style}>
        <div class="sec">Grille d’appréciation du Cerfa</div>
        ${['A', 'B', 'C', 'D', 'NSP'].map((l, k) => `<span><b>${l}</b> ${TITRES_ABCD[k]}</span>`).join('')}</div>`;
    case 'texte':
      if (el.compact) return `<div class="mdph-champ${debut}" ${attr}${style}>${htmlControleMdph(el, i)}</div>`;
      return `<div class="mdph-champ${debut}" ${attr}${style}><label>${echapper(el.label)}</label>${htmlControleMdph(el, i)}</div>`;
    case 'choix':
      return `<div class="mdph-champ${debut}" ${attr}${style}><label>${echapper(el.label)}</label>${htmlControleMdph(el, i)}</div>`;
    case 'case':
    case 'bascule': {
      const cle = el.t === 'case' ? el.champ : el.cle;
      return `<label class="mdph-case${debut}${el.t === 'bascule' ? ' bascule' : ''}" ${attr}${style}><input type="checkbox" data-i="${i}" ${v[cle] ? 'checked' : ''}><span>${echapper(el.label)}</span></label>`;
    }
    case 'abcd':
      return `<div class="mdph-abcd" ${attr}${style}><span>${echapper(el.label)}</span><div class="segments abcd">${ABCD.map((l, k) =>
        `<button type="button" data-i="${i}" data-k="${k}" class="${v[el.cle] === k ? 'on' : ''}" title="${TITRES_ABCD[k]}">${l}</button>`).join('')}</div></div>`;
    case 'nir':
      return `<div class="mdph-champ" ${attr}${style}><label>${echapper(el.label)}</label><input id="mdphNir" inputmode="numeric" maxlength="21" autocomplete="off" value="${echapper(mdphNir)}" placeholder="15 chiffres, jamais enregistré"></div>`;
    case 'signes': {
      // Même disposition que le Cerfa : description à gauche, fréquence à droite, 3 lignes.
      const lignes = [1, 2, 3].map(n => {
        const iTexte = MDPH_ELEMENTS.findIndex(e => e.champ === 'Description des signes cliniques ' + n);
        const iFreq = MDPH_ELEMENTS.findIndex(e => e.cle === 'freq' + n);
        const freq = MDPH_ELEMENTS[iFreq];
        return `<tr><td class="num">${n}</td><td>${htmlControleMdph(MDPH_ELEMENTS[iTexte], iTexte)}</td>
          ${freq.options.map(([l], k) => `<td class="frequence"><button type="button" class="pastille-freq${v[freq.cle] === k ? ' on' : ''}" data-i="${iFreq}" data-k="${k}" aria-label="${l}">${v[freq.cle] === k ? '✓' : ''}</button></td>`).join('')}</tr>`;
      }).join('');
      return `<div class="mdph-signes" ${attr}${style}>
        <table><thead><tr><th></th><th>Description des signes cliniques invalidants et fréquence</th>
          <th>Permanents</th><th>Réguliers<small>&gt; 15 j par mois</small></th><th>Ponctuel<small>&lt; 15 j par mois</small></th></tr></thead>
        <tbody>${lignes}</tbody></table></div>`;
    }
    default: return '';
  }
}

/** Le formulaire est découpé en rubriques (une carte par titre du Cerfa), chacune en grille de 12 colonnes. */
function htmlFormulaireMdph() {
  const sections = [];
  MDPH_ELEMENTS.forEach((el, i) => {
    if (el.t === 'titre') sections.push({ titre: el, i, corps: [] });
    else if (!el.cellule && sections.length) sections[sections.length - 1].corps.push(htmlElementMdph(el, i));
  });
  return sections.map(sec => `
    <section class="mdph-section" data-el="${sec.i}"${elementVisible(sec.titre) ? '' : ' hidden'}>
      <h3 class="mdph-titre">${echapper(sec.titre.texte)}</h3>
      <div class="mdph-grille">${sec.corps.join('')}</div>
    </section>`).join('');
}

function htmlVueMdph() {
  return `
  <div class="carte">
    <div class="bar" style="margin-top:0">
      <label for="mdphPatient" style="margin:0">Patient</label>
      <select id="mdphPatient" style="max-width:340px"></select>
      <button type="button" id="mdphPreremplir">Pré-remplir depuis la fiche</button>
      <button type="button" id="mdphVider" class="danger">Vider</button>
      <span class="sp" style="flex:1"></span>
      <button type="button" id="mdphOuvrir">Ouvrir le PDF rempli</button>
      <button type="button" class="main" id="mdphTelecharger">Télécharger le PDF rempli</button>
    </div>
    <p class="sec" id="mdphMsg">Cerfa n° 15695*01 officiel : le portail remplit les champs du PDF sans rien modifier d’autre.
    Le brouillon est enregistré dans la fiche à chaque modification. Signatures à apposer sur le document imprimé.</p>
  </div>
  <div class="mdph-form" id="mdphForm"></div>`;
}

function initialiserMdph() {
  $('vueMdph').innerHTML = htmlVueMdph();
  $('mdphPatient').onchange = () => { mdphPatientId = $('mdphPatient').value; mdphNir = ''; chargerBrouillonMdph(); };
  $('mdphPreremplir').onclick = () => { preremplirMdph(); afficherFormulaireMdph(); signaler($('mdphMsg'), 'Champs vides complétés depuis la fiche et le profil praticien.'); };
  $('mdphVider').onclick = () => {
    if (!confirm('Vider tout le certificat de ce patient ?')) return;
    mdphEtat = { _enfant: mdphEtat._enfant }; mdphNir = '';
    enregistrerBrouillonMdph(); afficherFormulaireMdph();
  };
  $('mdphTelecharger').onclick = () => produirePdfMdph('telecharger');
  $('mdphOuvrir').onclick = () => produirePdfMdph('ouvrir');

  const form = $('mdphForm');
  form.addEventListener('click', e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const el = MDPH_ELEMENTS[+b.dataset.i], k = +b.dataset.k;
    mdphEtat[el.cle] = mdphEtat[el.cle] === k ? null : k;          // second clic = efface
    apresChangementMdph();
  });
  form.addEventListener('input', e => {
    if (e.target.id === 'mdphNir') { mdphNir = e.target.value; return; }
    const i = e.target.dataset.i;
    if (i === undefined) return;
    const el = MDPH_ELEMENTS[+i];
    if (el.t === 'texte') {
      mdphEtat[el.champ] = e.target.value;
      enregistrerBrouillonMdph();
    }
  });
  form.addEventListener('change', e => {
    const i = e.target.dataset.i;
    if (i === undefined || e.target.type !== 'checkbox') return;
    const el = MDPH_ELEMENTS[+i];
    mdphEtat[el.t === 'case' ? el.champ : el.cle] = e.target.checked;
    apresChangementMdph();
  });
}

function apresChangementMdph() {
  enregistrerBrouillonMdph();
  afficherSelectionsMdph();
  majVisibiliteMdph();
}

/** Met à jour l'état visuel des boutons sans redessiner (garde le défilement et le focus). */
function afficherSelectionsMdph() {
  document.querySelectorAll('#mdphForm button[data-i]').forEach(b => {
    const el = MDPH_ELEMENTS[+b.dataset.i];
    const actif = mdphEtat[el.cle] === +b.dataset.k;
    b.classList.toggle('on', actif);
    if (b.classList.contains('pastille-freq')) b.textContent = actif ? '✓' : '';
  });
}
function majVisibiliteMdph() {
  document.querySelectorAll('#mdphForm [data-el]').forEach(n => { n.hidden = !elementVisible(MDPH_ELEMENTS[+n.dataset.el]); });
}
function afficherFormulaireMdph() {
  $('mdphForm').innerHTML = htmlFormulaireMdph();
}

function afficherVueMdph(idPatient) {
  if (idPatient !== undefined && idPatient !== mdphPatientId) mdphNir = '';
  if (idPatient !== undefined) mdphPatientId = idPatient;
  remplirSelectPatients($('mdphPatient'), mdphPatientId);
  mdphPatientId = $('mdphPatient').value;
  chargerBrouillonMdph();
}

function chargerBrouillonMdph() {
  const p = patientMdph();
  mdphEtat = p && p.mdph2 ? JSON.parse(JSON.stringify(p.mdph2)) : {};
  const age = p && p.ddn ? calculerAge(p.ddn) : null;
  mdphEtat._enfant = age === null || age === '' || age < 20;            // champ « Pour un enfant » affiché si besoin
  if (p && !p.mdph2) preremplirMdph();
  afficherFormulaireMdph();
}

function enregistrerBrouillonMdph() {
  const p = patientMdph();
  if (!p) return;
  const copie = { ...mdphEtat, maj: new Date().toISOString() };
  delete copie._enfant;
  p.mdph2 = copie;
  sauvegarderPatients();
}

/** Complète les champs vides à partir de la fiche patient et du profil praticien (jamais d'écrasement). */
function preremplirMdph() {
  const p = patientMdph();
  if (!p) return;
  const v = mdphEtat;
  const siVide = (champ, valeur) => { if (!v[champ] && valeur) v[champ] = valeur; };
  const pr = praticien || {};
  const nomMedecin = pr.nom ? [pr.prenom, pr.nom.toUpperCase()].filter(Boolean).join(' ') : '';

  siVide('nom de naissance', (p.nom || '').toUpperCase());
  siVide('préno', p.prenom);
  if (p.ddn) siVide('date naissanc', formaterDate(p.ddn));
  siVide('Pathologie motivant la demande :', p.dp);
  siVide('Autres pathologies éventuelles : ', p.ds);
  const actifs = (p.trt || []).filter(t => t.nom && !t.fin);
  siVide('Classes thérapeutiques ou nom des médicaments', texteTraitements(p));
  if (p.rythme) { if (v['Case à cocher P4 10'] === undefined) v['Case à cocher P4 10'] = true; siVide('Modalité de suivi 2', p.rythme); }
  // Dernière note (observation ou suivi) : éléments essentiels, conduite émotionnelle, projet thérapeutique.
  const note = derniereNote(p);
  if (note) {
    siVide('Eléments essentiels à retenir', [etatNote(note, 'hypothese') ? 'Diagnostic : ' + etatNote(note, 'hypothese') + '.' : '', etatNote(note, 'synthese')].filter(Boolean).join('\n'));
    siVide('Conduite émotionnelle et comportementale', extraitNote(note, ['EXAMEN PSYCHIATRIQUE']));
    siVide('Projet Therapeutique', conduiteNote(note));
  }
  const scores = derniersScores(p);
  if (scores.length) siVide('Précisions P2', 'Échelles : ' + scores.map(texteScore).join(' ; ') + '.');

  // Coordonnées du médecin (profil praticien).
  siVide('Docteur', nomMedecin);
  siVide('Docteur 2', nomMedecin);
  siVide('Identifiant RPPS :', pr.rpps);
  siVide('Adresse postale :', [pr.etablissement, pr.adresse].filter(Boolean).join('\n'));
  siVide('Téléphone : ', pr.telephone);
  siVide('Fait à', pr.ville);
  siVide('Document rédigé à la demande du patient', formaterDate(aujourdhuiIso()));
  siVide('Monsieur Madame', [p.sexe === 'F' ? 'Mme' : p.sexe === 'M' ? 'M.' : '', (p.nom || '').toUpperCase(), p.prenom].filter(Boolean).join(' '));
  siVide('Date ', formaterDate(aujourdhuiIso()));
  enregistrerBrouillonMdph();
}


/* ---------------------------------------------------------------------
   3. REMPLISSAGE DU PDF OFFICIEL
   --------------------------------------------------------------------- */
function base64VersOctets(b64) {
  const binaire = atob(b64);
  const octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return octets;
}

/** Remplace les caractères absents de la police du formulaire (Helvetica, WinAnsi). */
function texteCompatible(texte, police) {
  const remplacements = { '≥': '>=', '≤': '<=', '→': '->', '←': '<-', '⚠': '!', ' ': ' ', ' ': ' ', ' ': ' ', '≈': '~', '×': 'x', '·': '-' };
  let sortie = '';
  for (const c of String(texte).replace(/\r/g, '')) {
    if (c === '\n') { sortie += c; continue; }
    const r = remplacements[c] !== undefined ? remplacements[c] : c;
    try { police.encodeText(r); sortie += r; } catch (erreur) { sortie += '?'; }
  }
  return sortie;
}

/** Prépare l'apparence d'un champ texte pour qu'il reste fidèle au formulaire :
 *  fond d'origine conservé, pas de cadre ajouté,
 *  police Times du formulaire, taille ajustée pour que le texte tienne dans la case. */
function preparerChampTexte(champ, texte, police, PDFName) {
  const widgets = champ.acroField.getWidgets();
  widgets.forEach(w => {
    // On garde le fond prévu par le formulaire (case blanche) et on retire seulement le cadre noir.
    const mk = w.dict.lookup(PDFName.of('MK'));
    if (mk && mk.delete) mk.delete(PDFName.of('BC'));
    w.getOrCreateBorderStyle().setWidth(0);
  });
  const rect = widgets[0].getRectangle();
  const taillePrevue = (() => {
    const m = /([\d.]+)\s+Tf/.exec(champ.acroField.getDefaultAppearance() || '');
    return m && +m[1] > 0 ? +m[1] : 10;
  })();
  const largeur = rect.width - 4, hauteur = rect.height - 2;
  if (!champ.isMultiline()) {
    let taille = Math.min(taillePrevue, Math.max(6, hauteur * 0.75));
    while (taille > 6 && police.widthOfTextAtSize(texte, taille) > largeur) taille -= 0.5;
    champ.setFontSize(taille);
    return;
  }
  // Multiligne : plus grande taille (10 à 6 pt) pour laquelle le texte replié tient en hauteur.
  const lignesPour = taille => texte.split('\n').reduce((total, paragraphe) => {
    let n = 1, ligne = '';
    paragraphe.split(' ').forEach(mot => {
      const essai = ligne ? ligne + ' ' + mot : mot;
      if (police.widthOfTextAtSize(essai, taille) > largeur && ligne) { n++; ligne = mot; } else ligne = essai;
    });
    return total + n;
  }, 0);
  let taille = Math.min(10, taillePrevue);
  while (taille > 6 && lignesPour(taille) * taille * 1.18 > hauteur) taille -= 0.5;
  champ.setFontSize(taille);
}

async function remplirCerfa() {
  const { PDFDocument, PDFName, StandardFonts } = PDFLib;
  const doc = await PDFDocument.load(base64VersOctets(CERFA_15695_BASE64));
  const form = doc.getForm();
  const police = await doc.embedFont(StandardFonts.TimesRoman);   // police prévue par le formulaire (TiRo)
  const v = mdphEtat;
  const tous = MDPH_ELEMENTS;

  // Textes (seulement ceux des rubriques affichées).
  tous.filter(el => el.t === 'texte' && elementVisible(el)).forEach(el => {
    const valeur = (v[el.champ] || '').trim();
    if (!valeur) return;
    const champ = form.getTextField(el.champ);
    if (!champ.isMultiline() && /\n/.test(valeur)) champ.enableMultiline();
    const texte = texteCompatible(valeur, police);
    preparerChampTexte(champ, texte, police, PDFName);
    champ.setText(texte);
  });

  // N° de sécurité sociale : un chiffre par case.
  const nir = (mdphNir || '').replace(/[^0-9AB]/gi, '').toUpperCase().slice(0, 15);
  NIR_CHAMPS.forEach((nom, i) => {
    if (!nir[i]) return;
    const champ = form.getTextField(nom);
    preparerChampTexte(champ, nir[i], police, PDFName);
    champ.setText(nir[i]);
  });

  // Cases : on calcule pour chaque champ PDF les widgets à cocher (un champ peut servir à plusieurs rubriques).
  const aCocher = {};                                                  // nom du champ → Set d'indices de widgets
  const ajouter = (champ, w) => { (aCocher[champ] = aCocher[champ] || new Set()).add(w); };
  tous.filter(elementVisible).forEach(el => {
    if (el.t === 'case' && v[el.champ]) ajouter(el.champ, 0);
    if (el.t === 'choix' && v[el.cle] !== null && v[el.cle] !== undefined && el.options[v[el.cle]]) {
      const [, champ, w] = el.options[v[el.cle]];
      ajouter(champ, w);
    }
    if (el.t === 'abcd' && v[el.cle] !== null && v[el.cle] !== undefined) ajouter(el.champ, v[el.cle]);
  });
  Object.entries(aCocher).forEach(([nom, indices]) => {
    const champ = form.getCheckBox(nom);
    const widgets = champ.acroField.getWidgets();
    let premiere = null;
    widgets.forEach((w, k) => {
      const valeurOn = w.getOnValue();
      if (indices.has(k) && valeurOn) {
        w.setAppearanceState(valeurOn);
        if (!premiere) premiere = valeurOn;
      } else {
        w.setAppearanceState(PDFName.of('Off'));
      }
    });
    if (premiere) champ.acroField.dict.set(PDFName.of('V'), premiere);
  });

  form.updateFieldAppearances(police);
  return doc.save({ updateFieldAppearances: false });
}

async function produirePdfMdph(action) {
  const p = patientMdph();
  if (typeof PDFLib === 'undefined' || typeof CERFA_15695_BASE64 === 'undefined') {
    return alert('Fichiers js/lib/pdf-lib.min.js ou js/cerfa15695.js introuvables : gardez tout le dossier du portail ensemble.');
  }
  signaler($('mdphMsg'), 'Remplissage du PDF…');
  try {
    const octets = await remplirCerfa();
    const url = URL.createObjectURL(new Blob([octets], { type: 'application/pdf' }));
    if (action === 'ouvrir') {
      const fenetre = window.open(url, '_blank');
      if (!fenetre) alert('Le navigateur a bloqué l’ouverture : utilisez « Télécharger le PDF rempli ».');
    } else {
      const lien = document.createElement('a');
      const nom = p ? `${(p.nom || 'patient')}_${(p.prenom || '')}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_') : 'patient';
      lien.href = url;
      lien.download = `cerfa_15695-01_${nom}_${aujourdhuiIso()}.pdf`;
      lien.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    signaler($('mdphMsg'), 'PDF officiel rempli.');
  } catch (erreur) {
    console.error(erreur);
    alert('Le PDF n’a pas pu être rempli : ' + erreur.message);
  }
}
