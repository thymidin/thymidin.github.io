/* =====================================================================
   CONFIG.JS — TOUS LES RÉGLAGES DE L'APPLICATION
   =====================================================================
   C'est LE fichier à modifier pour adapter l'outil à votre pratique :
   libellés, listes déroulantes, calendriers de surveillance des
   traitements, médicaments suggérés, codes CIM-10…

   Aucune connaissance avancée n'est nécessaire : on modifie des listes
   et des nombres. Après modification, enregistrez le fichier puis
   rechargez la page (Ctrl+R ou F5).

   Plan du fichier :
     1. Outils pour écrire des durées
     2. Réglages généraux
     3. Priorités, statuts du relais, rythmes de suivi
     4. Groupes de traitement
     5. Surveillance biologique des psychotropes (le cœur clinique)
     6. Médicaments suggérés
     7. Diagnostics CIM-10 suggérés
     8. Colonnes de l'export CSV
   ===================================================================== */


/* ---------------------------------------------------------------------
   1. OUTILS POUR ÉCRIRE DES DURÉES
   Toutes les durées du fichier sont comptées en JOURS en interne.
   Ces petites fonctions permettent de les écrire de façon lisible :
     SEMAINES(3)  → 21 jours        MOIS(6)  → 183 jours
     ANS(1)       → 365 jours       JOURS(5) → 5 jours
     serie(a, b, pas) → liste de a à b, de pas en pas
        ex. serie(SEMAINES(1), SEMAINES(4), SEMAINES(1)) → 7, 14, 21, 28
   --------------------------------------------------------------------- */
const JOURS = n => n;
const SEMAINES = n => n * 7;
const MOIS = n => Math.round(n * 30.4375);
const ANS = n => n * 365;

function serie(debut, fin, pas) {
  const resultat = [];
  for (let valeur = debut; valeur <= fin; valeur += pas) {
    resultat.push(valeur);
  }
  return resultat;
}


/* ---------------------------------------------------------------------
   2. RÉGLAGES GÉNÉRAUX
   --------------------------------------------------------------------- */

// Nom sous lequel les données sont rangées dans le navigateur.
// ⚠ Ne le changez pas après avoir saisi des patients : les fiches existantes
//   ne seraient plus retrouvées (elles resteraient dans le navigateur, mais
//   invisibles). Pour repartir de zéro, changez-le volontairement.
const CLE_STOCKAGE = 'relais_cmp_v1';

// Un bilan est signalé « bientôt » (orange) quand son échéance est
// dans les N prochains jours. Au-delà de l'échéance : « en retard » (rouge).
const SEUIL_BIENTOT_JOURS = 14;

// Nombre de caractères de la synthèse clinique affichés dans le tableau
// (la fiche complète reste visible en cliquant sur la ligne).
const LONGUEUR_SYNTHESE_TABLEAU = 260;

// Intitulé de la ligne regroupant les patients sans CMP dans la « Vue par CMP ».
const LIBELLE_SANS_CMP = 'Sans destinataire attribué';

// Adaptation des bilans au sexe : « femme en âge de procréer » = sexe féminin et âge
// compris entre ces deux bornes (si l'âge est inconnu, la femme est considérée concernée).
const PROCREATION_AGE_MIN = 12;
const PROCREATION_AGE_MAX = 50;

// Prolactinémie avant antipsychotique : systématique chez la femme de moins de N ans.
const AGE_PROLACTINE_FEMME = 25;

// Texte ajouté à un examen « sous réserve » quand le sexe du patient n'est pas renseigné.
const LIBELLES_CONDITIONS = {
  femme:        ' (si femme)',
  homme:        ' (si homme)',
  procreation:  ' (si femme en âge de procréer)',
  femmeMoins25: ' (si femme de moins de 25 ans)',
};


/* ---------------------------------------------------------------------
   3. PRIORITÉS, STATUTS DU RELAIS, RYTHMES DE SUIVI
   --------------------------------------------------------------------- */

// Priorité de relais. Les numéros (1 à 4) sont enregistrés dans les fiches :
// vous pouvez changer les libellés, mais gardez les numéros.
// (La couleur de chaque niveau se règle dans css/style.css : .t1 à .t4)
const PRIORITES = {
  1: { libelle: '1 · Urgent',   aide: 'À relayer en premier, avant le départ' },
  2: { libelle: '2 · Élevé',    aide: 'À relayer rapidement' },
  3: { libelle: '3 · Standard', aide: 'Relais planifié' },
  4: { libelle: '4 · Faible',   aide: 'Peu de risque, peut attendre' },
};

// Statuts du relais, dans l'ordre d'avancement.
// ⚠ Les DEUX DERNIERS comptent comme « relais clos » (compteurs, vue par CMP).
// Ces listes sont des valeurs par défaut : le bouton « Paramètres » de
// l'application permet de les modifier sans toucher au code, et ces
// modifications ont alors la priorité sur celles de ce fichier.
const STATUTS_RELAIS_PAR_DEFAUT = [
  'À faire',
  'Courrier / synthèse envoyée',
  'RDV fixé avec le receveur',
  'Relais effectué',                         // ← avant-dernier : relais clos (affiché en vert)
  'Pas de relais (sortie de file active)',   // ← dernier : relais clos
];

// Rythmes de suivi proposés dans la fiche (valeurs par défaut, modifiables
// aussi via « Paramètres »).
// Relais : à qui le patient est confié (champ « Relais vers » de la partie relais de la fiche).
// Les libellés sont enregistrés dans les fiches : en cas de modification, les anciennes fiches
// gardent l'ancien libellé (affiché tel quel).
// Type de relais (champ « Relais vers » de la fiche) : CMP, exercice libéral ou autre structure.
const TYPES_RELAIS = [
  'CMP',
  'Psychiatre libéral',
  'Médecin traitant',
  'Autre structure (CSAPA, CMPP, hôpital de jour, centre expert…)',
];
// Types pour lesquels la précision « interne / sénior » n'a pas de sens.
const RELAIS_SANS_NIVEAU = ['Psychiatre libéral', 'Médecin traitant'];

const RELAIS_VERS = [
  'Interne',
  'Sénior',
];

const RYTHMES_SUIVI_PAR_DEFAUT = [
  'Hebdomadaire',
  'Tous les 15 jours',
  'Mensuel',
  'Toutes les 6 semaines',
  'Trimestriel',
  'Semestriel',
  'Ponctuel / à la demande',
];


/* ---------------------------------------------------------------------
   4. GROUPES DE TRAITEMENT
   Les clés (fond, symp) sont enregistrées dans les fiches : ne pas les changer.
   --------------------------------------------------------------------- */
const GROUPES_TRAITEMENT = {
  fond: 'Traitements de fond',
  symp: 'Traitements symptomatiques',
  somat: 'Traitements non psychiatriques',   // traitements somatiques (cardiologie, endocrinologie, contraception…)
};


/* ---------------------------------------------------------------------
   5. SURVEILLANCE BIOLOGIQUE DES PSYCHOTROPES
   ---------------------------------------------------------------------
   Pour chaque famille de médicaments à surveiller :

     nom                      Nom affiché dans la fiche.
     motsCles                 Expression qui reconnaît le médicament à partir
                              du nom saisi. Le texte saisi est mis en minuscules
                              et SANS accents avant comparaison : écrivez donc
                              « depakot » et non « dépakot ». Le signe | signifie « ou ».
     preTherapeutique         Bilan à faire AVANT de débuter :
                                biologie : examens de biologie (servent aussi à l'ordonnance)
                                autres   : éléments à voir en consultation (ECG, poids, PA…)
     remarque                 Texte d'aide affiché sous les bilans.
     remarquesSelonPatient (facultatif)  Remarques qui ne s'affichent que pour certains
                              patients : [ { pour: 'femme', texte: '…' }, … ]
     bilans                   Liste des bilans de suivi (voir ci-dessous).

   ADAPTATION AU SEXE ET À L'ÂGE : un examen, un bilan ou une remarque peut porter une
   condition « pour » :
        'femme'         patient de sexe féminin
        'homme'         patient de sexe masculin
        'procreation'   femme en âge de procréer (âges réglés en section 2)
        'femmeMoins25'  femme de moins de 25 ans (prolactinémie avant antipsychotique)
   Dans une liste d'examens, un examen conditionnel s'écrit { examen: 'β-hCG', pour: 'procreation' }.
   Si le sexe du patient n'est pas renseigné, l'élément est conservé « sous réserve ».

   Pour chaque bilan de suivi :

     id                       Identifiant interne, UNIQUE dans le médicament.
                              ⚠ À ne pas modifier après usage : les dates de
                              bilans déjà saisies y sont rattachées.
     libelle                  Texte affiché.
     calendrier               Liste des moments (en jours après l'introduction)
                              où le bilan est attendu. Ex. [JOURS(15), MOIS(3)].
     ensuite                  Une fois le calendrier terminé, bilan à répéter tous
                              les N jours après le dernier réalisé. 0 = ne plus répéter.
     tolerance                Un bilan fait jusqu'à N jours AVANT l'échéance compte
                              quand même comme réalisé.
     apresChangementDose (facultatif)  Contrôle à faire N jours après chaque
                              changement de dose (ex. lithémie J+5).
     repartirApresChangementDose (facultatif)  true = après une augmentation de
                              dose, le calendrier repart de zéro à cette date
                              (cas de l'agomélatine).
     examens                  Examens de biologie du bilan (liste de textes ou d'examens conditionnels) ;
                              ils alimentent l'ordonnance de bilans.
     autres (facultatif)      Éléments à voir en consultation (poids, ECG…), hors ordonnance.
     consigne (facultatif)    Consigne de prélèvement imprimée sur l'ordonnance.
     pour (facultatif)        Condition sur le patient (voir ci-dessus) : le bilan n'existe que
                              si elle est remplie (ex. réévaluation annuelle du valproate chez l'homme).

     ensuiteSansDateIntro (facultatif)  Pour un traitement marqué « ancien » dont la date
                              d'introduction est inconnue : intervalle à utiliser à la place
                              de « ensuite » (ex. clozapine : mensuel par prudence, tant que
                              la date d'introduction n'est pas renseignée).

   TRAITEMENTS ANCIENS : dans la fiche, la case « traitement ancien / suivi repris » dispense
   des bilans initiaux (pré-thérapeutique, calendrier de début de traitement) et fait repartir
   le suivi à la date de reprise indiquée. Si la date d'introduction est connue, les étapes du
   calendrier déjà dépassées à cette date sont considérées comme couvertes ; sinon seul le
   rythme d'entretien (« ensuite ») s'applique.

   Pour ajouter un médicament : copiez un bloc existant, changez sa clé
   (ex. « topiramate »), son nom, ses motsCles et ses bilans.
   Pour changer un rythme : modifiez simplement les nombres du calendrier.

   ⚠ SOURCES : La Revue du Praticien (bilans biologiques en psychiatrie),
   RCP et communications de l'ANSM (Valdoxan, Léponex, lithium). Ces schémas
   sont des repères ; le RCP en vigueur et le protocole de votre service
   font foi. Les éléments marqués « indicatif » ne viennent pas de ces sources.
   --------------------------------------------------------------------- */

// Calendrier commun au valproate et à la carbamazépine :
// mensuel pendant 6 mois, puis trimestriel pendant 1 an (9, 12, 15, 18 mois).
const CALENDRIER_ANTICONVULSIVANTS = [
  MOIS(1), MOIS(2), MOIS(3), MOIS(4), MOIS(5), MOIS(6),
  MOIS(9), MOIS(12), MOIS(15), MOIS(18),
];

// Examens communs à plusieurs molécules (évite de les recopier).
const BILAN_HEPATIQUE = 'Bilan hépatique (ASAT, ALAT, GGT, PAL, TP)';
const BILAN_METABOLIQUE = ['Glycémie à jeun', 'Bilan lipidique'];

const REGLES_SURVEILLANCE = {

  /* ----- LITHIUM ----- */
  lithium: {
    nom: 'Lithium',
    motsCles: /lithi|teralithe|lithiofor/,
    preTherapeutique: {
      biologie: [
        'Créatinine avec estimation du DFG',
        'Ionogramme sanguin',
        'Calcémie',
        'Protéinurie rapportée à la créatininurie (échantillon urinaire)',
        'TSH',
        'NFS',
        BILAN_HEPATIQUE,
        ...BILAN_METABOLIQUE,
        { examen: 'β-hCG plasmatiques', pour: 'procreation' },
      ],
      autres: ['ECG', 'Poids / IMC'],
    },
    remarque:
      'Lithémie 5 j après toute modification de dose, interaction (AINS, diurétiques, ' +
      'IEC/ARA2) ou déshydratation. Après 3 mois : anticorps antithyroïdiens.',
    remarquesSelonPatient: [
      { pour: 'procreation',
        texte: 'Femme en âge de procréer : contraception efficace à discuter ; en cas de grossesse ' +
               'ou de projet de grossesse, avis spécialisé immédiat.' },
    ],
    bilans: [
      {
        id: 'li',
        libelle: 'Lithémie',
        examens: ['Lithémie'],
        consigne: 'Lithémie : prélèvement 12 h après la dernière prise, avant la prise suivante.',
        calendrier: [JOURS(5), JOURS(10), MOIS(1), MOIS(3)],
        ensuite: MOIS(6),
        tolerance: JOURS(3),
        apresChangementDose: JOURS(5),
      },
      {
        id: 'bio',
        libelle: 'Bilan biologique de surveillance',
        examens: [
          'Créatinine avec estimation du DFG', 'Ionogramme sanguin', 'Calcémie', 'TSH', 'NFS',
          BILAN_HEPATIQUE, ...BILAN_METABOLIQUE,
        ],
        calendrier: [JOURS(15), MOIS(3)],
        ensuite: MOIS(6),
        tolerance: JOURS(7),
      },
      {
        id: 'ac',
        libelle: 'Anticorps anti-thyroïdiens (une fois, à 3 mois)',
        examens: ['Anticorps anti-TPO', 'Anticorps anti-thyroglobuline', 'Anticorps anti-récepteur de la TSH (TRAK)'],
        calendrier: [MOIS(3)],
        ensuite: 0,                       // une seule fois
        tolerance: JOURS(14),
      },
    ],
  },

  /* ----- VALPROATE (Dépakote, Dépakine, Dépamide, Micropakine…) -----
     Chez la femme en âge de procréer : programme de prévention de la grossesse.
     Chez l'homme : précautions ANSM / PRAC (réévaluation au moins annuelle par un spécialiste). */
  valproate: {
    nom: 'Valproate',
    motsCles: /valpro|depakot|depakin|depamide|micropakine/,
    preTherapeutique: {
      biologie: [
        'NFS avec plaquettes',
        BILAN_HEPATIQUE,
        ...BILAN_METABOLIQUE,
        { examen: 'β-hCG plasmatiques', pour: 'procreation' },
      ],
      autres: ['Poids / IMC'],
    },
    remarque:
      'Dosage plasmatique à l’initiation (après 5 demi-vies), après modification de dose ' +
      'ou nouvelle interaction.',
    remarquesSelonPatient: [
      { pour: 'procreation',
        texte: 'Femme en âge de procréer : programme de prévention de la grossesse ' +
               '(contraception efficace, information annuelle de la patiente).' },
      { pour: 'homme',
        texte: 'Homme : risque potentiel de troubles du neurodéveloppement chez l’enfant en cas ' +
               'd’exposition paternelle dans les 3 mois précédant la conception ; contraception efficace ' +
               'et pas de don de sperme pendant le traitement et 3 mois après l’arrêt ; réévaluation ' +
               'au moins annuelle par un spécialiste (ANSM / PRAC).' },
    ],
    bilans: [
      {
        id: 'bio',
        libelle: 'NFS-plaquettes + bilan hépatique',
        examens: ['NFS avec plaquettes', BILAN_HEPATIQUE],
        calendrier: CALENDRIER_ANTICONVULSIVANTS,
        ensuite: MOIS(6),
        tolerance: JOURS(7),
      },
      {
        id: 'ppg',
        libelle: 'Programme de prévention de la grossesse : réévaluation annuelle',
        pour: 'procreation',               // seulement pour une femme en âge de procréer
        calendrier: [],
        ensuite: ANS(1),
        tolerance: JOURS(30),
      },
      {
        id: 'rea_h',
        libelle: 'Réévaluation annuelle du traitement par un spécialiste (patient de sexe masculin)',
        pour: 'homme',                     // seulement pour un homme
        calendrier: [],
        ensuite: ANS(1),
        tolerance: JOURS(30),
      },
    ],
  },

  /* ----- CARBAMAZÉPINE (Tégrétol) ----- */
  carbamazepine: {
    nom: 'Carbamazépine',
    motsCles: /carbamaz|tegretol/,
    preTherapeutique: {
      biologie: [
        'NFS',
        'Natrémie (ionogramme sanguin)',
        BILAN_HEPATIQUE,
        'Créatinine avec estimation du DFG',
        { examen: 'β-hCG plasmatiques', pour: 'procreation' },
      ],
      autres: ['ECG', 'HLA-B*1502 si origine ancestrale à risque (Asie du Sud-Est)'],
    },
    remarque:
      'Dosage plasmatique à l’initiation, après modification de dose ou interaction ' +
      '(inducteur enzymatique).',
    remarquesSelonPatient: [
      { pour: 'procreation',
        texte: 'Femme en âge de procréer : inducteur enzymatique réduisant l’efficacité de nombreux ' +
               'contraceptifs hormonaux (contraception à adapter) ; avis spécialisé avant toute grossesse.' },
    ],
    bilans: [
      {
        id: 'bio',
        libelle: 'NFS + natrémie + bilan hépatique',
        examens: ['NFS', 'Natrémie (ionogramme sanguin)', BILAN_HEPATIQUE],
        calendrier: CALENDRIER_ANTICONVULSIVANTS,
        ensuite: MOIS(6),
        tolerance: JOURS(7),
      },
    ],
  },

  /* ----- AGOMÉLATINE (Valdoxan) ----- */
  agomelatine: {
    nom: 'Agomélatine',
    motsCles: /agomel|valdoxan/,
    preTherapeutique: {
      biologie: ['Transaminases (ASAT, ALAT)'],
      autres: ['Contre-indiquée si transaminases > 3 N ou insuffisance hépatique'],
    },
    remarque:
      'Séquence à renouveler après toute augmentation de dose (renseigner la date de ' +
      'modification). Contrôle sous 48 h si élévation des transaminases.',
    bilans: [
      {
        id: 'tr',
        libelle: 'Transaminases (ASAT/ALAT)',
        examens: ['Transaminases (ASAT, ALAT)'],
        calendrier: [SEMAINES(3), SEMAINES(6), SEMAINES(12), SEMAINES(24)],
        ensuite: 0,                       // ensuite : « si cliniquement nécessaire »
        tolerance: JOURS(5),
        repartirApresChangementDose: true,
      },
    ],
  },

  /* ----- CLOZAPINE (Léponex) -----
     ⚠ Calendrier PNN actualisé par l'ANSM en 2026 : à confirmer sur le RCP en vigueur. */
  clozapine: {
    nom: 'Clozapine',
    motsCles: /clozap|leponex/,
    preTherapeutique: {
      biologie: [
        'NFS avec numération des polynucléaires neutrophiles (PNN)',
        ...BILAN_METABOLIQUE,
        BILAN_HEPATIQUE,
        'Créatinine avec estimation du DFG',
        { examen: 'β-hCG plasmatiques', pour: 'procreation' },
      ],
      autres: ['ECG', 'Poids / IMC', 'Carnet de suivi ANSM'],
    },
    remarque:
      'Arrêt si PNN < 1,0 G/L ; PNN jusqu’à 4 semaines après l’arrêt ; clozapinémie ' +
      'indispensable. Calendrier PNN actualisé ANSM 2026 : à confirmer sur le RCP en vigueur.',
    bilans: [
      {
        id: 'pnn',
        libelle: 'PNN (carnet de suivi ANSM)',
        examens: ['NFS avec numération des polynucléaires neutrophiles (PNN)'],
        calendrier: [
          ...serie(SEMAINES(1),  SEMAINES(18),  SEMAINES(1)),    // hebdomadaire, 18 semaines
          ...serie(SEMAINES(22), SEMAINES(52),  SEMAINES(4)),    // mensuel jusqu'à 1 an
          ...serie(SEMAINES(64), SEMAINES(100), SEMAINES(12)),   // toutes les 12 semaines, 2e année
        ],
        ensuite: ANS(1),                  // puis annuel (si aucune neutropénie)
        ensuiteSansDateIntro: MOIS(1),    // ancien traitement, date inconnue : mensuel par prudence
        tolerance: JOURS(3),
      },
      {
        id: 'met',
        libelle: 'Bilan métabolique et cardiaque (indicatif)',
        examens: [...BILAN_METABOLIQUE],
        autres: ['Poids / IMC', 'ECG'],
        calendrier: [MOIS(3), MOIS(6), MOIS(12)],
        ensuite: ANS(1),
        tolerance: JOURS(30),
      },
    ],
  },

  /* ----- ANTIPSYCHOTIQUES (hors clozapine) -----
     Bilan trimestriel 1 an, semestriel 1 an, puis annuel.
     Prolactinémie avant traitement : pour une femme de moins de 25 ans (et si signes cliniques). */
  antipsychotique: {
    nom: 'Antipsychotique',
    motsCles: new RegExp(
      'aripip|abilify|olanzap|zyprexa|risper|palip|invega|xeplion|trevicta|quetiap|' +
      'xeroquel|seroquel|amisulp|solian|haloper|haldol|cyamem|tercian|levomepr|nozinan|' +
      'loxap|sulpir|dogmatil|cariprazin|reagila|lurasidon|latuda|asenapin|sycrest|' +
      'brexpip|rexulti|zuclopent|clopixol|flupent|fluanxol|pipotiaz|piportil|ziprasid|sertindol|' +
      'zypadhera|maintena|consta|largactil|chlorpromaz|modecate|fluphen|perphen|pimozid|\\borap\\b|' +
      'neuleptil|propericiaz'
    ),
    preTherapeutique: {
      biologie: [
        'NFS',
        'Ionogramme sanguin',
        'Créatinine avec estimation du DFG',
        BILAN_HEPATIQUE,
        ...BILAN_METABOLIQUE,
        'Hémostase (TP, TCA) si injection IM ou forme retard prévue',
        { examen: 'Prolactinémie', pour: 'femmeMoins25' },
        { examen: 'β-hCG plasmatiques', pour: 'procreation' },
      ],
      autres: ['Poids / IMC / tour de taille', 'Pression artérielle', 'ECG (QTc)'],
    },
    remarque:
      'Trimestriel 1 an, semestriel 1 an, puis annuel (lipides tous les 5 ans).',
    remarquesSelonPatient: [
      { pour: 'femme',
        texte: 'Prolactinémie à doser en cas de signes d’hyperprolactinémie (troubles des règles, ' +
               'galactorrhée, troubles sexuels) ou de désir de grossesse.' },
      { pour: 'homme',
        texte: 'Prolactinémie à doser en cas de signes d’hyperprolactinémie (gynécomastie, ' +
               'troubles sexuels, signes d’hypogonadisme).' },
    ],
    bilans: [
      {
        id: 'bio',
        libelle: 'Bilan biologique et métabolique',
        examens: [
          'NFS', 'Ionogramme sanguin', 'Créatinine avec estimation du DFG',
          BILAN_HEPATIQUE, ...BILAN_METABOLIQUE,
        ],
        autres: ['Poids / IMC / tour de taille', 'Pression artérielle'],
        calendrier: [MOIS(3), MOIS(6), MOIS(9), MOIS(12), MOIS(18), MOIS(24)],
        ensuite: ANS(1),
        tolerance: JOURS(14),
      },
    ],
  },

  /* ----- LAMOTRIGINE (Lamictal) -----
     Pas de bilan biologique systématique : surveillance cutanée pendant la titration. */
  lamotrigine: {
    nom: 'Lamotrigine',
    motsCles: /lamotrig|lamictal/,
    sansPreTherapeutique: true,
    preTherapeutique: { biologie: [], autres: ['Vérifier les associations (valproate : doses à réduire de moitié ; inducteurs : doses augmentées)'] },
    remarque:
      'Titration lente obligatoire (risque de toxidermie grave, surtout les 8 premières semaines et en association au valproate). ' +
      'Arrêt immédiat en cas d’éruption cutanée. Après une interruption de plus de 5 demi-vies, reprendre la titration.',
    bilans: [
      {
        id: 'peau',
        libelle: 'Surveillance cutanée pendant la titration (indicatif)',
        examens: [],
        autres: ['Examen cutané, information sur les signes d’alerte'],
        calendrier: [SEMAINES(2), SEMAINES(4), SEMAINES(6), SEMAINES(8)],
        ensuite: 0,
        tolerance: JOURS(4),
        repartirApresChangementDose: true,
      },
    ],
  },

  /* ----- MOLÉCULES ALLONGEANT LE QT (hors antipsychotiques, déjà couverts) ----- */
  qt: {
    nom: 'Risque d’allongement du QT',
    motsCles: /citalopram|seropram|seroplex|hydroxyzin|atarax|methadon|domperidon|motilium/,
    sansPreTherapeutique: true,                // ECG avant traitement seulement si facteurs de risque (voir remarque)
    preTherapeutique: { biologie: ['Ionogramme sanguin (kaliémie)', 'Magnésémie'], autres: ['ECG (QTc) avant traitement si facteurs de risque'] },
    remarque:
      'ECG avant traitement si facteurs de risque (cardiopathie, hypokaliémie, association à d’autres molécules allongeant le QT, âge), ' +
      'puis après augmentation de dose. Respecter les doses maximales selon l’âge (citalopram, escitalopram).',
    bilans: [
      {
        id: 'ecg',
        libelle: 'ECG de contrôle (QTc) après instauration ou augmentation de dose (indicatif)',
        examens: [],
        autres: ['ECG (QTc)'],
        calendrier: [SEMAINES(2)],
        ensuite: 0,
        tolerance: JOURS(7),
        apresChangementDose: SEMAINES(2),
      },
    ],
  },
};

/* ---------------------------------------------------------------------
   6. MÉDICAMENTS SUGGÉRÉS
   Simple aide à la saisie (liste de suggestions dans le champ « Molécule »).
   Vous pouvez saisir n'importe quel nom : seuls ceux reconnus par un
   « motsCles » ci-dessus déclenchent une surveillance.
   --------------------------------------------------------------------- */
const MEDICAMENTS_SUGGERES = [

  // --- Thymorégulateurs et antiépileptiques ---
  'Lithium (Téralithe)',
  'Lithium LP (Téralithe LP 400)',
  'Valproate de sodium (Dépakote)',
  'Valproate de sodium (Dépakine)',
  'Valpromide (Dépamide)',
  'Carbamazépine (Tégrétol)',
  'Oxcarbazépine (Trileptal)',
  'Lamotrigine (Lamictal)',
  'Topiramate (Epitomax)',
  'Gabapentine (Neurontin)',
  'Prégabaline (Lyrica)',
  'Lévétiracétam (Keppra)',
  'Clonazépam (Rivotril)',

  // --- Antipsychotiques par voie orale ---
  'Clozapine (Léponex)',
  'Olanzapine (Zyprexa)',
  'Rispéridone (Risperdal)',
  'Aripiprazole (Abilify)',
  'Amisulpride (Solian)',
  'Quétiapine (Xeroquel)',
  'Quétiapine LP (Xeroquel LP)',
  'Palipéridone (Invega)',
  'Cariprazine (Reagila)',
  'Lurasidone (Latuda)',
  'Asénapine (Sycrest)',
  'Brexpiprazole (Rexulti)',
  'Halopéridol (Haldol)',
  'Cyamémazine (Tercian)',
  'Lévomépromazine (Nozinan)',
  'Loxapine (Loxapac)',
  'Chlorpromazine (Largactil)',
  'Sulpiride (Dogmatil)',
  'Pimozide (Orap)',
  'Zuclopenthixol (Clopixol)',
  'Propériciazine (Neuleptil)',
  'Tiapride (Tiapridal)',

  // --- Antipsychotiques à action prolongée (injectables) ---
  'Rispéridone LAI (Risperdal Consta)',
  'Palipéridone 1 mois (Xeplion)',
  'Palipéridone 3 mois (Trevicta)',
  'Aripiprazole LAI (Abilify Maintena)',
  'Olanzapine LAI (Zypadhera)',
  'Halopéridol décanoate (Haldol Décanoas)',
  'Zuclopenthixol décanoate (Clopixol Action Prolongée)',
  'Fluphénazine décanoate (Modécate)',
  'Pipotiazine palmitate (Piportil L4)',

  // --- Antidépresseurs ---
  'Sertraline (Zoloft)',
  'Escitalopram (Seroplex)',
  'Citalopram (Seropram)',
  'Paroxétine (Deroxat)',
  'Fluoxétine (Prozac)',
  'Fluvoxamine (Floxyfral)',
  'Venlafaxine (Effexor)',
  'Duloxétine (Cymbalta)',
  'Milnacipran (Ixel)',
  'Mirtazapine (Norset)',
  'Miansérine (Athymil)',
  'Trazodone (Désyrel)',
  'Vortioxétine (Brintellix)',
  'Agomélatine (Valdoxan)',
  'Moclobémide (Moclamine)',
  'Iproniazide (Marsilid)',
  'Tranylcypromine (Parnate, importation)',
  'Clomipramine (Anafranil)',
  'Amitriptyline (Laroxyl)',
  'Imipramine (Tofranil)',
  'Eskétamine (Spravato)',

  // --- Anxiolytiques et hypnotiques ---
  'Hydroxyzine (Atarax)',
  'Alprazolam (Xanax)',
  'Lorazépam (Temesta)',
  'Bromazépam (Lexomil)',
  'Diazépam (Valium)',
  'Clorazépate (Tranxène)',
  'Prazépam (Lysanxia)',
  'Oxazépam (Séresta)',
  'Étifoxine (Stresam)',
  'Buspirone (Buspar)',
  'Zopiclone (Imovane)',
  'Zolpidem (Stilnox)',
  'Mélatonine (Circadin)',

  // --- Addictologie ---
  'Méthadone',
  'Buprénorphine (Subutex)',
  'Buprénorphine-naloxone (Suboxone)',
  'Naltrexone (Révia)',
  'Nalméfène (Selincro)',
  'Acamprosate (Aotal)',
  'Baclofène',
  'Disulfirame (Espéral)',
  'Varénicline (Champix)',
  'Bupropion (Zyban)',

  // --- TDAH ---
  'Méthylphénidate (Ritaline)',
  'Méthylphénidate LP (Concerta LP)',
  'Méthylphénidate LP (Quasym LP)',
  'Lisdexamfétamine (Xelevia)',
  'Atomoxétine (Strattera)',
  'Guanfacine LP (Intuniv)',

  // --- Adjuvants et potentialisations (souvent hors AMM dans l'indication psychiatrique) ---
  'Pramipexole LI (Sifrol)',
  'Pramipexole LP (Sifrol LP)',
  'Liothyronine (Cynomel)',
  'Liothyronine (Thybon)',
  'Modafinil (Modiodal)',
  'Kétamine (voie IV ou IM)',
  'Mémantine (Ebixa)',
  'N-acétylcystéine',
  'Prazosine (Alpress LP)',
  'Clonidine (Catapressan)',
  'Minocycline (Mynocine)',

  // --- Traitements non psychiatriques fréquents (interactions, surveillance) ---
  'Lévothyroxine (Levothyrox)',
  'Metformine (Glucophage)',
  'Ramipril (Triatec)',
  'Amlodipine (Amlor)',
  'Bisoprolol (Cardensiel)',
  'Atorvastatine (Tahor)',
  'Hydrochlorothiazide (Esidrex)',
  'Furosémide (Lasilix)',
  'Oméprazole (Mopral)',
  'Ibuprofène (Advil)',
  'Paracétamol (Doliprane)',
  'Tramadol (Contramal)',
  'Apixaban (Eliquis)',
  'Contraception œstroprogestative',
  'Contraception progestative',
  'Salbutamol (Ventoline)',

  // --- Traitements symptomatiques : digestifs ---
  'Macrogol (Forlax)',
  'Macrogol (Movicol)',
  'Macrogol (Transipeg)',
  'Lactulose (Duphalac)',
  'Lactitol (Importal)',
  'Bisacodyl (Dulcolax)',
  'Huile de paraffine (Lansoÿl)',
  'Sterculia (Normacol)',
  'Lavement (Microlax)',
  'Suppositoire à la glycérine',
  'Diosmectite (Smecta)',
  'Lopéramide (Imodium)',
  'Phloroglucinol (Spasfon)',
  'Trimébutine (Débridat)',
  'Métoclopramide (Primpéran)',
  'Dompéridone (Motilium)',
  'Ondansétron (Zophren)',
  'Ésoméprazole (Inexium)',
  'Pantoprazole (Inipomp)',
  'Alginate (Gaviscon)',
  'Siméticone',

  // --- Traitements symptomatiques : autres ---
  'Scopolamine patch (Scopoderm) – hypersialorrhée',
  'Atropine collyre 1 % en sublingual – hypersialorrhée (hors AMM)',
  'Desmopressine (Minirin) – énurésie',
  'Heptaminol (Hept-a-myl) – hypotension orthostatique',
  'Midodrine (Gutron) – hypotension orthostatique',
  'Néfopam (Acupan)',
  'Alimémazine (Théralène)',
  'Prométhazine (Phénergan)',
  'Doxylamine (Donormyl)',
  'Thiamine (Bévitine)',
  'Pyridoxine (vitamine B6)',
  'Acide folique (Spéciafoldine)',
  'Cholécalciférol (Uvédose, Zymad)',
  'Nicotine transdermique (Nicopatch)',
  'Nicotine orale (Nicorette)',

  // --- Correcteurs et autres ---
  'Propranolol (Avlocardyl)',
  'Trihexyphénidyle (Artane)',
  'Tropatépine (Lepticur)',
];


/* ---------------------------------------------------------------------
   7. DIAGNOSTICS CIM-10 SUGGÉRÉS
   Format : 'CODE – Libellé'. Libellés abrégés, sans valeur de référence
   officielle. Ajoutez ou retirez des lignes librement.
   --------------------------------------------------------------------- */
// Codes F10 à F19 (troubles liés aux substances) : mêmes sous-codes pour chaque
// substance, générés automatiquement pour ne pas répéter 100 lignes.
// Pour retirer une substance ou un sous-code, supprimez simplement sa ligne ci-dessous.
const SUBSTANCES_CIM10 = [
  ['F10', 'Alcool'],
  ['F11', 'Opiacés'],
  ['F12', 'Cannabis'],
  ['F13', 'Sédatifs/hypnotiques'],
  ['F14', 'Cocaïne'],
  ['F15', 'Autres stimulants (dont caféine)'],
  ['F16', 'Hallucinogènes'],
  ['F17', 'Tabac'],
  ['F18', 'Solvants volatils'],
  ['F19', 'Polyconsommation / autres substances'],
];
const SOUS_CODES_SUBSTANCE = [
  ['.0', 'intoxication aiguë'],
  ['.1', 'usage nocif'],
  ['.2', 'syndrome de dépendance'],
  ['.3', 'syndrome de sevrage'],
  ['.4', 'sevrage avec délirium'],
  ['.5', 'trouble psychotique'],
  ['.6', 'syndrome amnésique'],
  ['.7', 'trouble résiduel ou psychotique de survenue tardive'],
  ['.8', 'autre trouble mental ou du comportement'],
  ['.9', 'trouble sans précision'],
];
const DIAGNOSTICS_ADDICTIONS = SUBSTANCES_CIM10.flatMap(([code, substance]) =>
  SOUS_CODES_SUBSTANCE.map(([sousCode, libelle]) => `${code}${sousCode} – ${substance} : ${libelle}`)
);

const DIAGNOSTICS_CIM10 = [

  // --- Troubles mentaux organiques (F00-F09) ---
  'F00.0 – Démence de la maladie d’Alzheimer, début précoce',
  'F00.1 – Démence de la maladie d’Alzheimer, début tardif',
  'F00.9 – Démence de la maladie d’Alzheimer, sans précision',
  'F01.9 – Démence vasculaire, sans précision',
  'F02 – Démence au cours d’autres maladies (Parkinson, Lewy…)',
  'F03 – Démence, sans précision',
  'F04 – Syndrome amnésique organique',
  'F05.0 – Délirium non surajouté à une démence',
  'F05.9 – Délirium, sans précision',
  'F06.0 – Hallucinose organique',
  'F06.2 – Trouble délirant organique',
  'F06.3 – Trouble de l’humeur organique',
  'F06.4 – Trouble anxieux organique',
  'F06.7 – Trouble cognitif léger',
  'F07.0 – Trouble de la personnalité organique',
  'F07.2 – Syndrome post-commotionnel',
  'F09 – Trouble mental organique ou symptomatique, sans précision',

  // --- Troubles liés aux substances (F10-F19) : générés ci-dessus ---
  ...DIAGNOSTICS_ADDICTIONS,

  // --- Schizophrénie et troubles psychotiques (F20-F29) ---
  'F20.0 – Schizophrénie paranoïde',
  'F20.1 – Schizophrénie hébéphrénique',
  'F20.2 – Schizophrénie catatonique',
  'F20.3 – Schizophrénie indifférenciée',
  'F20.4 – Dépression post-schizophrénique',
  'F20.5 – Schizophrénie résiduelle',
  'F20.6 – Schizophrénie simple',
  'F20.9 – Schizophrénie, sans précision',
  'F21 – Trouble schizotypique',
  'F22.0 – Trouble délirant persistant',
  'F22.8 – Autres troubles délirants persistants',
  'F22.9 – Trouble délirant persistant, sans précision',
  'F23.0 – Trouble psychotique aigu polymorphe sans symptômes de schizophrénie',
  'F23.1 – Trouble psychotique aigu polymorphe avec symptômes de schizophrénie',
  'F23.2 – Trouble psychotique aigu de type schizophrénique',
  'F23.9 – Trouble psychotique aigu et transitoire, sans précision',
  'F24 – Trouble délirant induit',
  'F25.0 – Trouble schizo-affectif, type maniaque',
  'F25.1 – Trouble schizo-affectif, type dépressif',
  'F25.2 – Trouble schizo-affectif, type mixte',
  'F25.9 – Trouble schizo-affectif, sans précision',
  'F28 – Autres troubles psychotiques non organiques',
  'F29 – Psychose non organique, sans précision',

  // --- Troubles de l'humeur (F30-F39) ---
  'F30.0 – Hypomanie',
  'F30.1 – Manie sans symptômes psychotiques',
  'F30.2 – Manie avec symptômes psychotiques',
  'F30.9 – Épisode maniaque, sans précision',
  'F31.0 – Bipolaire : épisode actuel hypomaniaque',
  'F31.1 – Bipolaire : épisode actuel maniaque sans symptômes psychotiques',
  'F31.2 – Bipolaire : épisode actuel maniaque avec symptômes psychotiques',
  'F31.3 – Bipolaire : épisode actuel dépressif léger ou moyen',
  'F31.4 – Bipolaire : épisode actuel dépressif sévère sans symptômes psychotiques',
  'F31.5 – Bipolaire : épisode actuel dépressif sévère avec symptômes psychotiques',
  'F31.6 – Bipolaire : épisode actuel mixte',
  'F31.7 – Bipolaire : actuellement en rémission',
  'F31.8 – Autres troubles affectifs bipolaires (dont bipolaire II)',
  'F31.9 – Trouble affectif bipolaire, sans précision',
  'F32.0 – Épisode dépressif léger',
  'F32.1 – Épisode dépressif moyen',
  'F32.2 – Épisode dépressif sévère sans symptômes psychotiques',
  'F32.3 – Épisode dépressif sévère avec symptômes psychotiques',
  'F32.8 – Autres épisodes dépressifs',
  'F32.9 – Épisode dépressif, sans précision',
  'F33.0 – Dépression récurrente, épisode actuel léger',
  'F33.1 – Dépression récurrente, épisode actuel moyen',
  'F33.2 – Dépression récurrente, épisode actuel sévère sans symptômes psychotiques',
  'F33.3 – Dépression récurrente, épisode actuel sévère avec symptômes psychotiques',
  'F33.4 – Dépression récurrente, actuellement en rémission',
  'F33.9 – Trouble dépressif récurrent, sans précision',
  'F34.0 – Cyclothymie',
  'F34.1 – Dysthymie',
  'F34.8 – Autres troubles persistants de l’humeur',
  'F38 – Autres troubles de l’humeur',
  'F39 – Trouble de l’humeur, sans précision',

  // --- Troubles névrotiques, liés au stress, somatoformes (F40-F48) ---
  'F40.0 – Agoraphobie',
  'F40.1 – Phobies sociales',
  'F40.2 – Phobies spécifiques',
  'F40.9 – Trouble phobique, sans précision',
  'F41.0 – Trouble panique',
  'F41.1 – Anxiété généralisée',
  'F41.2 – Trouble mixte anxieux et dépressif',
  'F41.3 – Autres troubles anxieux mixtes',
  'F41.9 – Trouble anxieux, sans précision',
  'F42.0 – Trouble obsessionnel : idées obsédantes prédominantes',
  'F42.1 – Trouble obsessionnel : comportements compulsifs prédominants',
  'F42.2 – Trouble obsessionnel compulsif mixte',
  'F42.9 – Trouble obsessionnel compulsif, sans précision',
  'F43.0 – Réaction aiguë à un facteur de stress',
  'F43.1 – État de stress post-traumatique',
  'F43.2 – Trouble de l’adaptation',
  'F43.8 – Autres réactions à un facteur de stress sévère',
  'F43.9 – Réaction à un facteur de stress sévère, sans précision',
  'F44.0 – Amnésie dissociative',
  'F44.1 – Fugue dissociative',
  'F44.4 – Troubles dissociatifs de la motricité',
  'F44.5 – Convulsions dissociatives',
  'F44.8 – Autres troubles dissociatifs (de conversion)',
  'F44.9 – Trouble dissociatif, sans précision',
  'F45.0 – Somatisation',
  'F45.2 – Trouble hypocondriaque',
  'F45.3 – Dysfonction neurovégétative somatoforme',
  'F45.4 – Syndrome douloureux somatoforme persistant',
  'F48.0 – Neurasthénie',
  'F48.1 – Syndrome de dépersonnalisation-déréalisation',

  // --- Syndromes comportementaux : alimentation, sommeil, sexualité (F50-F59) ---
  'F50.0 – Anorexie mentale',
  'F50.1 – Anorexie mentale atypique',
  'F50.2 – Boulimie (bulimia nervosa)',
  'F50.3 – Boulimie atypique',
  'F50.4 – Hyperphagie associée à d’autres perturbations psychologiques',
  'F50.9 – Trouble des conduites alimentaires, sans précision',
  'F51.0 – Insomnie non organique',
  'F51.1 – Hypersomnie non organique',
  'F51.2 – Trouble non organique du rythme veille-sommeil',
  'F51.3 – Somnambulisme',
  'F51.4 – Terreurs nocturnes',
  'F51.5 – Cauchemars',
  'F52.0 – Absence ou perte du désir sexuel',
  'F53.0 – Trouble mental léger du post-partum',
  'F53.1 – Trouble mental sévère du post-partum',

  // --- Troubles de la personnalité et du comportement adulte (F60-F69) ---
  'F60.0 – Personnalité paranoïaque',
  'F60.1 – Personnalité schizoïde',
  'F60.2 – Personnalité dyssociale',
  'F60.30 – Personnalité émotionnellement labile, type impulsif',
  'F60.31 – Personnalité émotionnellement labile, type borderline',
  'F60.4 – Personnalité histrionique',
  'F60.5 – Personnalité anankastique',
  'F60.6 – Personnalité anxieuse (évitante)',
  'F60.7 – Personnalité dépendante',
  'F60.8 – Autres troubles spécifiques de la personnalité (narcissique…)',
  'F60.9 – Trouble de la personnalité, sans précision',
  'F61 – Troubles mixtes et autres troubles de la personnalité',
  'F62.0 – Modification durable de la personnalité après une expérience de catastrophe',
  'F63.0 – Jeu pathologique',
  'F63.1 – Pyromanie',
  'F63.2 – Vol pathologique (kleptomanie)',
  'F63.3 – Trichotillomanie',
  'F68.1 – Production intentionnelle de symptômes (trouble factice)',

  // --- Retard mental et troubles du développement (F70-F89) ---
  'F70 – Retard mental léger',
  'F71 – Retard mental moyen',
  'F72 – Retard mental grave',
  'F79 – Retard mental, sans précision',
  'F80 – Troubles spécifiques du développement de la parole et du langage',
  'F81 – Troubles spécifiques du développement des acquisitions scolaires',
  'F82 – Trouble spécifique du développement moteur',
  'F84.0 – Autisme infantile',
  'F84.1 – Autisme atypique',
  'F84.5 – Syndrome d’Asperger',
  'F84.9 – Trouble envahissant du développement, sans précision',

  // --- Troubles du comportement de l'enfant et de l'adolescent (F90-F98) ---
  'F90.0 – Perturbation de l’activité et de l’attention (TDAH)',
  'F90.1 – Trouble hyperkinétique et trouble des conduites',
  'F90.9 – Trouble hyperkinétique, sans précision',
  'F91 – Troubles des conduites',
  'F92.0 – Trouble des conduites avec dépression',
  'F93.0 – Anxiété de séparation de l’enfance',
  'F94.0 – Mutisme sélectif',
  'F95.2 – Syndrome de Gilles de la Tourette',
  'F98.0 – Énurésie non organique',
  'F99 – Trouble mental, sans précision',

  // --- Autres codes utiles en psychiatrie ---
  'T14.91 – Tentative de suicide',
  'Z91.5 – Antécédent d’automutilation / tentative de suicide',

  // --- Comorbidités somatiques fréquentes (suivi des traitements) ---
  'E66.9 – Obésité, sans précision',
  'E11.9 – Diabète de type 2',
  'E78.5 – Hyperlipidémie, sans précision',
  'E03.9 – Hypothyroïdie, sans précision',
  'I10 – Hypertension essentielle',
  'G40.9 – Épilepsie, sans précision',
  'G47.3 – Apnée du sommeil',
  'N18.9 – Insuffisance rénale chronique, sans précision',
];


/* ---------------------------------------------------------------------
   8. COLONNES DE L'EXPORT CSV
   Format : [ propriété, titre de la colonne ]. Réordonnez ou retirez des
   lignes pour changer l'export. Propriétés spéciales calculées :
   'sexe' (Femme/Homme), 'ald' (Oui/Non), 'arelayer' (Oui/Non), 'priorite' (libellé), 'trt' (traitements), 'retard' (bilans en retard).
   --------------------------------------------------------------------- */
const COLONNES_CSV = [
  ['nom',        'Nom'],
  ['prenom',     'Prénom'],
  ['ddn',        'Naissance'],
  ['ald',        'ALD'],
  ['sexe',       'Sexe'],
  ['dossier',    'Dossier'],
  ['dp',         'Diagnostic principal'],
  ['ds',         'Diagnostics secondaires'],
  ['synthese',   'Synthèse'],
  ['vigtxt',     'Vigilance'],
  ['rythme',     'Rythme'],
  ['relaisVers', 'Relais vers'],
  ['prochain',   'Consultation'],
  ['arelayer',   'À relayer'],
  ['priorite',   'Priorité'],
  ['statut',     'Statut relais'],
  ['typeRelais', 'Type de relais'],
  ['cmp',        'Destinataire du relais'],
  ['tel',        'Contact'],
  ['trt',        'Traitements'],
  ['retard',     'Bilans en retard'],
  ['notes',      'Notes'],
];


/* ---------------------------------------------------------------------
   9. ORDONNANCES DE BILANS
   Textes imprimés sur l'ordonnance. Les examens de chaque bilan se règlent
   dans la section 5 (propriétés `examens` et `preTherapeutique`).
   --------------------------------------------------------------------- */
const SPECIALITE_PAR_DEFAUT = 'Psychiatrie';

const TEXTE_ORDONNANCE = {
  titre: 'Ordonnance : examens de biologie médicale',

  // Phrase d'introduction de la liste des examens.
  //   lieu = « à domicile » ou « au laboratoire » ; type = « sanguin », « urinaire » ou « sanguin et urinaire ».
  phrase: (lieu, type) => `Faire pratiquer ${lieu}, un bilan ${type} comprenant les paramètres suivants :`,

  // Mentions de l'ordonnance bizone pour un patient en ALD (affection de longue durée).
  aldEnRapport: 'Prescription en rapport avec l’affection de longue durée (ALD exonérante)',
  aldSansRapport: 'Prescription sans rapport avec l’affection de longue durée',
};
