/* =====================================================================
   DEMO.JS — patients FICTIFS pour présenter le portail
   ---------------------------------------------------------------------
   Dix situations cliniques inventées (noms, dates, numéros de dossier
   « DEMO-xx »). Les dates sont calculées par rapport au jour du
   chargement : il y a donc toujours des consultations « aujourd'hui »,
   des bilans en retard, des rappels échus…
   Les fiches de démonstration portent `demo: true` et se retirent d'un
   clic sans toucher aux vraies fiches.
   ===================================================================== */

function genererPatientsDemo() {
  const j = n => versIso(ajouterJours(aujourdhui(), n));          // date relative au jour
  const AUCUNE_IDEE = ['Absence d’idées suicidaires'];

  // Courbe de l'humeur sur `jours` jours à partir d'une fonction (jour → niveau de -3 à +3).
  const humeur = (jours, f, sommeil = () => 7) => {
    const mood = {};
    for (let i = jours; i >= 0; i--) {
      if (i % 11 === 5 && i > 20) continue;                         // quelques jours non renseignés, comme en vrai
      const bruit = Math.sin(i * 1.7) * 0.45 + Math.sin(i * 0.37) * 0.3; // variations d'un jour à l'autre
      const v = Math.max(-3, Math.min(3, Math.round(f(i) + bruit)));
      mood[j(-i)] = { v, sl: Math.round(sommeil(i, v) * 2) / 2, ir: Math.abs(v) >= 2 && i % 4 === 0 ? 1 : 0, mx: false, n: '' };
    }
    return { mood, tx: [] };
  };
  const score = (echelle, jour, total, max, interpretation, sous = []) =>
    ({ id: `demo-${echelle}-${jour}`, echelle, date: j(jour), total, max, sous, interpretation, manquants: 0, rep: [] });
  const note = (jour, type, texte, etat = {}) => ({ id: `demo-note-${jour}-${Math.abs(texte.length)}`, type, date: j(jour), texte, etat: { suicide: AUCUNE_IDEE, ...etat } });

  return [
    {
      id: 'demo-01', demo: true, nom: 'Fabre', prenom: 'Léa', ddn: '1992-03-14', sexe: 'F', dossier: 'DEMO-01',
      dp: 'F31.8 – Trouble bipolaire de type II', ds: '', allergies: 'Pénicilline',
      synthese: 'Trouble bipolaire de type II diagnostiqué en 2018 après deux épisodes dépressifs et un épisode hypomaniaque du post-partum. Stabilisée sous lithium, lamotrigine introduite pour une dépression résiduelle.',
      rythme: 'Mensuel', prochain: j(0), tel: 'Dr Arnaud, médecin traitant', ald: true, aldTexte: 'ALD 23',
      aRelayer: false, priorite: 3, statut: 'À faire',
      trt: [
        { g: 'fond', nom: 'Lithium (Téralithe LP)', dose: '800 mg le soir', intro: j(-400), pre: j(-400), bil: { li: j(-120), bio: j(-100), ac: j(-300) } },
        { g: 'fond', nom: 'Lamotrigine (Lamictal)', dose: '100 mg/j (titration)', intro: j(-35), bil: { peau: j(-20) } },
        { g: 'somat', nom: 'Contraception œstroprogestative', dose: '1 cp/j', intro: j(-900), bil: {} },
      ],
      ech: [score('qids', -150, 19, 27, 'Dépression sévère (16-20)'), score('qids', -90, 15, 27, 'Dépression modérée (11-15)'),
            score('qids', -45, 11, 27, 'Dépression modérée (11-15)'), score('qids', -7, 7, 27, 'Dépression légère (6-10)')],
      humeur: humeur(180, i => (i > 140 ? -2.6 : i > 35 ? -2.6 + (140 - i) * 0.02 : i > 20 ? -0.5 : Math.sin(i / 5) * 0.5), (i, v) => 7.5 - v * 0.4),
      obs: [
        note(-35, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nAmélioration partielle de la thymie, persistance d’une anhédonie et d’une fatigue matinale. Reprise du travail envisagée.\n\nTRAITEMENT\nLithium 800 mg (lithémie 0,72 mmol/l). Bonne tolérance. Introduction de la lamotrigine 25 mg avec titration progressive ; information sur le risque cutané.\n\nCONDUITE À TENIR\n- Titration de la lamotrigine\n- Revoir dans un mois', { humeur: ['Humeur triste', 'Anhédonie'] }),
        note(-7, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nÉvolution favorable. Thymie proche de l’euthymie, reprise des activités. Sommeil régulier.\n\nTRAITEMENT\nLamotrigine 100 mg/j sans éruption cutanée. Lithium inchangé.\n\nCONDUITE À TENIR\n- Poursuite du traitement actuel\n- Lithémie et bilan de surveillance à faire', { humeur: ['Humeur neutre (euthymique)'] }),
      ],
      rappels: [{ id: 'demo-r1', texte: 'Vérifier le résultat de la lithémie', date: j(-2), fait: false }],
    },
    {
      id: 'demo-02', demo: true, nom: 'Benali', prenom: 'Karim', ddn: '1985-09-02', sexe: 'M', dossier: 'DEMO-02',
      dp: 'F20.0 – Schizophrénie paranoïde', ds: 'F12.2 – Cannabis : dépendance',
      synthese: 'Schizophrénie paranoïde résistante (échec de rispéridone et d’olanzapine à posologie efficace). Clozapine depuis 6 mois avec nette réduction des hallucinations. Vit seul, curatelle simple.',
      vigilance: 1, vigtxt: 'Rupture de soins en 2023 avec hospitalisation en SDRE',
      rythme: 'Tous les 15 jours', prochain: j(0), tel: 'IDE CMP : Mme Rossi', ald: true, aldTexte: 'ALD 23',
      aRelayer: true, priorite: 1, statut: 'À faire', typeRelais: 'CMP', cmp: 'CMP secteur 13G05', relaisVers: 'Sénior',
      trt: [
        { g: 'fond', nom: 'Clozapine (Léponex)', dose: '350 mg/j', intro: j(-185), pre: j(-190), bil: { pnn: j(-40), met: j(-100) } },
        { g: 'symp', nom: 'Cyamémazine (Tercian)', dose: '25 mg si besoin', intro: j(-185), bil: {} },
        { g: 'somat', nom: 'Metformine', dose: '850 mg x 2/j', intro: j(-60), bil: {} },
      ],
      ech: [],
      obs: [note(-14, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nStabilité clinique. Hallucinations acoustico-verbales rares et peu envahissantes. Consommation de cannabis en baisse (2 joints/semaine).\n\nTRAITEMENT\nClozapine 350 mg/j. Hypersialorrhée nocturne, constipation surveillée. Prise de poids de 4 kg depuis l’instauration.\n\nCONDUITE À TENIR\n- NFS à faire (carnet de suivi)\n- Relais CMP à organiser avant mon départ', { delire: ['Idées délirantes de persécution'] })],
      rappels: [{ id: 'demo-r2', texte: 'Appeler l’IDE du CMP pour le relais', date: j(3), fait: false }],
    },
    {
      id: 'demo-03', demo: true, nom: 'Garnier', prenom: 'Sophie', ddn: '1974-06-21', sexe: 'F', dossier: 'DEMO-03',
      dp: 'F33.2 – Trouble dépressif récurrent, épisode actuel sévère', ds: 'F51.0 – Insomnie non organique',
      synthese: 'Troisième épisode dépressif caractérisé, contexte de licenciement. Antécédent de tentative de suicide médicamenteuse en 2015. Vit avec sa fille de 16 ans.',
      vigilance: 1, vigtxt: 'TS par intoxication médicamenteuse en 2015',
      rythme: 'Hebdomadaire', prochain: j(0), tel: 'Dr Morin, médecin traitant',
      aRelayer: false, priorite: 3, statut: 'À faire', allergies: '',
      trt: [
        { g: 'fond', nom: 'Venlafaxine LP (Effexor)', dose: '150 mg/j', intro: j(-28), bil: {} },
        { g: 'symp', nom: 'Zopiclone (Imovane)', dose: '7,5 mg au coucher', intro: j(-28), bil: {} },
        { g: 'somat', nom: 'Lévothyroxine (Levothyrox)', dose: '75 µg/j', intro: j(-2000), bil: {} },
      ],
      ech: [score('qids', -28, 20, 27, 'Dépression sévère (16-20)'), score('qids', -2, 18, 27, 'Dépression sévère (16-20)'),
            score('phq9', -2, 19, 27, 'Dépression modérément sévère (15-19)')],
      obs: [note(-2, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nPas d’amélioration notable à quatre semaines de venlafaxine. Isolement, ruminations sur la perte d’emploi.\n\nEXAMEN PSYCHIATRIQUE\nHumeur triste avec désespoir et dévalorisation. Ralentissement psychomoteur. Insomnie d’endormissement.\n\nÉVALUATION DU RISQUE\nElle rapporte des idées suicidaires actives sans scénario élaboré. Facteurs de protection : sa fille, l’alliance thérapeutique. Risque moyen, urgence faible.\n\nCONDUITE À TENIR\n- Majoration de la venlafaxine à 225 mg\n- Plan de sécurité à établir\n- Revoir dans une semaine',
        { suicide: ['Idées suicidaires actives'], risque: ['Moyen'], urgence: ['Faible'], humeur: ['Humeur triste', 'Désespoir', 'Dévalorisation'] })],
      rappels: [{ id: 'demo-r3', texte: 'Rappeler la patiente (tolérance de la majoration)', date: j(0), fait: false }],
    },
    {
      id: 'demo-04', demo: true, nom: 'Roux', prenom: 'Thomas', ddn: '1999-11-08', sexe: 'M', dossier: 'DEMO-04',
      dp: 'Évaluation d’un trouble du spectre de l’autisme', ds: 'F41.1 – Anxiété généralisée',
      synthese: 'Étudiant en master d’informatique adressé par la médecine universitaire pour difficultés relationnelles anciennes, intérêts restreints, hypersensibilité sensorielle. Démarche diagnostique TSA en cours.',
      rythme: 'Ponctuel / à la demande', prochain: j(3), tel: 'Service de santé universitaire',
      aRelayer: false, priorite: 3, statut: 'À faire',
      trt: [],
      ech: [score('aq', -10, 36, 50, 'Score ≥ 32 (max. 50) : 80 % des patients avec syndrome d’Asperger ont un score égal ou supérieur à 32'),
            score('eq', -10, 18, 80, 'Score ≤ 30 (max. 80) : 80 % des patients avec syndrome d’Asperger ont un score égal ou inférieur à 30'),
            score('raads', -10, 142, 240, 'Score ≥ 65 : seuil de Ritvo et al. (2011) atteint ou dépassé, compatible avec un trouble du spectre de l’autisme (à confirmer par une évaluation diagnostique)'),
            score('gad7', -10, 12, 21, 'Anxiété modérée (10-14)')],
      obs: [note(-10, 'premiere', 'OBSERVATION PSYCHIATRIQUE\n\nCONTEXTE\nPremière consultation, adressé par le service de santé universitaire.\n\nHISTOIRE\nDifficultés relationnelles depuis l’enfance, scolarité brillante mais isolement. Routines rigides, intérêt envahissant pour les systèmes ferroviaires. Hypersensibilité au bruit.\n\nCONDUITE À TENIR\n- Autoquestionnaires AQ, EQ, RAADS-R\n- Bilan neuropsychologique et ADOS-2 à prévoir\n- Recueil de l’anamnèse développementale auprès des parents')],
      rappels: [{ id: 'demo-r4', texte: 'Envoyer la demande de bilan neuropsychologique', date: j(5), fait: false }],
    },
    {
      id: 'demo-05', demo: true, nom: 'Morel', prenom: 'Inès', ddn: '2002-01-30', sexe: 'F', dossier: 'DEMO-05',
      dp: 'F41.0 – Trouble panique', ds: 'F41.1 – Anxiété généralisée',
      synthese: 'Attaques de panique depuis 1 an avec agoraphobie débutante. Escitalopram introduit récemment ; TCC demandée.',
      rythme: 'Mensuel', prochain: j(2), tel: 'Dr Vidal, médecin traitant',
      aRelayer: false, priorite: 3, statut: 'À faire',
      trt: [
        { g: 'fond', nom: 'Escitalopram (Seroplex)', dose: '10 mg/j', intro: j(-10), bil: {} },
        { g: 'symp', nom: 'Hydroxyzine (Atarax)', dose: '25 mg si besoin, max 50 mg/j', intro: j(-10), bil: {} },
      ],
      ech: [score('gad7', -40, 17, 21, 'Anxiété sévère (15-21)'), score('gad7', -10, 16, 21, 'Anxiété sévère (15-21)')],
      obs: [note(-10, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nAttaques de panique pluri-hebdomadaires, évitement des transports en commun.\n\nCONDUITE À TENIR\n- Introduction escitalopram 5 mg puis 10 mg\n- ECG de contrôle (association hydroxyzine)\n- Orientation vers une TCC')],
    },
    {
      id: 'demo-06', demo: true, nom: 'Lefort', prenom: 'Marc', ddn: '1967-04-17', sexe: 'M', dossier: 'DEMO-06',
      dp: 'F10.2 – Alcool : dépendance', ds: 'F32.1 – Épisode dépressif moyen',
      synthese: 'Dépendance à l’alcool ancienne, sevrage ambulatoire réussi il y a 4 mois, abstinent depuis. Épisode dépressif secondaire en amélioration.',
      rythme: 'Toutes les 6 semaines', prochain: j(6), tel: 'CSAPA du secteur',
      aRelayer: true, priorite: 2, statut: 'Courrier / synthèse envoyée', typeRelais: 'Autre structure (CSAPA, CMPP, hôpital de jour, centre expert…)', cmp: 'CSAPA Marseille Centre', relaisVers: 'Interne',
      trt: [
        { g: 'fond', nom: 'Sertraline (Zoloft)', dose: '100 mg/j', intro: j(-110), bil: {} },
        { g: 'fond', nom: 'Acamprosate (Aotal)', dose: '2 cp x 3/j', intro: j(-120), bil: {} },
        { g: 'somat', nom: 'Thiamine (vitamine B1)', dose: '250 mg/j', intro: j(-120), bil: {} },
      ],
      ech: [score('phq9', -110, 16, 27, 'Dépression modérément sévère (15-19)'), score('phq9', -20, 8, 27, 'Dépression légère (5-9)')],
      obs: [note(-20, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nAbstinence maintenue depuis 4 mois. Thymie améliorée, reprise de la pêche avec son frère.\n\nCONDUITE À TENIR\n- Poursuite du traitement actuel\n- Relais vers le CSAPA (courrier envoyé)')],
      docs: [{ id: 'demo-doc-06', type: 'relais', date: j(-20), valeurs: {}, texte: 'Courrier de relais adressé au CSAPA Marseille Centre (exemple fictif).' }],
    },
    {
      id: 'demo-07', demo: true, nom: 'Perrin', prenom: 'Julie', ddn: '1995-07-05', sexe: 'F', dossier: 'DEMO-07',
      dp: 'F90.0 – TDAH de l’adulte, présentation mixte', ds: '',
      synthese: 'TDAH diagnostiqué à 29 ans (bilan neuropsychologique concordant). Méthylphénidate efficace sur la concentration au travail.',
      rythme: 'Trimestriel', prochain: j(5), tel: 'Dr Arnaud, médecin traitant',
      aRelayer: true, priorite: 3, statut: 'Courrier / synthèse envoyée', typeRelais: 'Psychiatre libéral', cmp: 'Dr Lemaire, psychiatre libéral (Aix-en-Provence)',
      trt: [{ g: 'fond', nom: 'Méthylphénidate LP (Concerta)', dose: '36 mg le matin', intro: j(-200), bil: {} }],
      ech: [],
      obs: [note(-85, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nBonne efficacité, meilleure organisation professionnelle. Appétit diminué le midi, poids stable. TA 118/72, FC 78.\n\nCONDUITE À TENIR\n- Renouvellement (ordonnance sécurisée, 28 jours)')],
      rappels: [{ id: 'demo-r7', texte: 'Renouvellement annuel du méthylphénidate', date: j(20), fait: false }],
    },
    {
      id: 'demo-08', demo: true, nom: 'Blanc', prenom: 'Gérard', ddn: '1960-12-12', sexe: 'M', dossier: 'DEMO-08',
      dp: 'F25.0 – Trouble schizo-affectif, type maniaque', ds: '',
      synthese: 'Trouble schizo-affectif évoluant depuis 30 ans, stabilisé sous aripiprazole injectable et valproate. Vit en famille d’accueil.',
      rythme: 'Mensuel', prochain: j(12), tel: 'Famille d’accueil : M. et Mme Ortiz', ald: true, aldTexte: 'ALD 23',
      aRelayer: true, priorite: 3, statut: 'RDV fixé avec le receveur', typeRelais: 'CMP', cmp: 'CMP secteur 13G03', relaisVers: 'Interne',
      trt: [
        { g: 'fond', nom: 'Aripiprazole LP injectable (Abilify Maintena)', dose: '400 mg/mois', intro: j(-1500), pre: j(-1500), bil: { bio: j(-200) } },
        { g: 'fond', nom: 'Valproate (Dépakote)', dose: '1000 mg/j', intro: j(-3000), pre: j(-3000), bil: { bio: j(-150) } },
        { g: 'somat', nom: 'Amlodipine', dose: '5 mg/j', intro: j(-800), bil: {} },
      ],
      ech: [],
      obs: [note(-30, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nStabilité thymique et comportementale. Bonne observance des injections.\n\nCONDUITE À TENIR\n- Poursuite du traitement actuel\n- Relais CMP : rendez-vous fixé')],
    },
    {
      id: 'demo-09', demo: true, nom: 'Haddad', prenom: 'Nadia', ddn: '1981-02-24', sexe: 'F', dossier: 'DEMO-09',
      dp: 'F43.1 – Trouble de stress post-traumatique', ds: '',
      synthese: 'Trouble de stress post-traumatique après un accident de la route en 2024. Cauchemars, évitement de la conduite. Psychothérapie EMDR en cours.',
      rythme: 'Mensuel', prochain: j(9), tel: 'Psychologue : M. Durand',
      aRelayer: false, priorite: 3, statut: 'À faire',
      trt: [
        { g: 'fond', nom: 'Sertraline (Zoloft)', dose: '150 mg/j', intro: j(-240), bil: {} },
        { g: 'symp', nom: 'Prazosine', dose: '2 mg au coucher', intro: j(-60), bil: {} },
      ],
      ech: [score('phq9', -240, 14, 27, 'Dépression modérée (10-14)'), score('phq9', -120, 10, 27, 'Dépression modérée (10-14)'), score('phq9', -30, 6, 27, 'Dépression légère (5-9)')],
      obs: [note(-30, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nCauchemars nettement moins fréquents depuis la prazosine. A repris la conduite sur de courts trajets.\n\nCONDUITE À TENIR\n- Poursuite du traitement actuel\n- Poursuite de l’EMDR')],
    },
    {
      id: 'demo-10', demo: true, nom: 'Lambert', prenom: 'Hugo', ddn: '2006-05-19', sexe: 'M', dossier: 'DEMO-10',
      dp: 'F23.1 – Trouble psychotique aigu polymorphe avec symptômes schizophréniques', ds: 'F12.1 – Cannabis : usage nocif',
      synthese: 'Premier épisode psychotique il y a 2 mois dans un contexte de consommation de cannabis. Hospitalisation de 3 semaines. Suivi intensif post-hospitalisation.',
      vigilance: 1, vigtxt: 'Premier épisode : risque de rupture de soins et de rechute',
      rythme: 'Tous les 15 jours', prochain: j(1), tel: 'Parents (accord du patient)',
      aRelayer: true, priorite: 2, statut: 'À faire', typeRelais: 'Autre structure (CSAPA, CMPP, hôpital de jour, centre expert…)', cmp: 'Équipe premiers épisodes', relaisVers: 'Sénior',
      trt: [{ g: 'fond', nom: 'Aripiprazole (Abilify)', dose: '10 mg/j', intro: j(-60), bil: {} }],
      ech: [],
      obs: [note(-12, 'suivi', 'NOTE DE SUIVI\n\nÉVOLUTION\nAmendement des idées délirantes. Persistance d’un émoussement affectif. Abstinence de cannabis déclarée depuis la sortie.\n\nCONDUITE À TENIR\n- Bilan métabolique de surveillance\n- Orientation vers l’équipe de premiers épisodes')],
    },
  ];
}

/** Rendez-vous fictifs autour d'aujourd'hui (jours ouvrés). */
function genererRdvDemo() {
  const ouvre = n => { let d = ajouterJours(aujourdhui(), n); while (d.getDay() === 0 || d.getDay() === 6) d = ajouterJours(d, n < 0 ? -1 : 1); return versIso(d); };
  const R = [];
  const add = (patientId, jour, debut, type = 'Consultation de suivi', statut = 'Prévu', duree = 30, lieu = 'Cabinet / bureau', libelle = '', notes = '') =>
    R.push({ id: `demo-rdv-${R.length}`, demo: true, patientId, libelle, date: ouvre(jour), debut, duree, type, lieu, statut, notes });
  add('demo-01', 0, '09:00', 'Consultation de suivi', 'Confirmé');
  add('demo-02', 0, '09:45', 'Consultation de suivi', 'Prévu', 30, 'CMP', '', 'Apporter le carnet de suivi clozapine.');
  add('demo-03', 0, '10:30', 'Consultation de suivi', 'Prévu', 45);
  add('', 0, '13:30', 'Réunion, synthèse', 'Prévu', 60, 'Service', 'Synthèse d’équipe');
  add('demo-10', 1, '09:30', 'Consultation post-hospitalisation', 'Prévu', 45);
  add('demo-05', 2, '15:00');
  add('', 2, '12:00', 'Indisponibilité', 'Prévu', 120, '', 'Formation');
  add('demo-04', 3, '14:00', 'Consultation de suivi', 'Prévu', 60, 'Cabinet / bureau', '', 'Restitution des autoquestionnaires.');
  add('demo-07', 4, '16:30', 'Téléconsultation', 'Prévu', 20, 'Téléconsultation');
  add('demo-06', 5, '09:30');
  add('demo-09', 8, '11:00');
  add('demo-08', 10, '10:00', 'Injection retard / soin', 'Prévu', 20, 'CMP');
  add('demo-01', -7, '09:00', 'Consultation de suivi', 'Honoré');
  add('demo-05', -2, '15:00', 'Consultation de suivi', 'Honoré');
  add('demo-03', -6, '10:30', 'Consultation de suivi', 'Honoré', 45);
  add('demo-09', -3, '11:00', 'Consultation de suivi', 'Non venu');
  add('demo-02', -14, '09:45', 'Consultation de suivi', 'Honoré', 30, 'CMP');
  add('demo-06', -4, '14:00', 'Consultation de suivi', 'Annulé (patient)');
  return R;
}

function chargerDemo() {
  const deja = patients.some(p => p.demo);
  if (deja && !confirm('Des patients fictifs sont déjà chargés. Les remplacer par une version à jour ?')) return;
  patients = patients.filter(p => !p.demo).concat(genererPatientsDemo());
  // Deux équipes infirmières fictives, rattachées à deux patients.
  if (typeof lireEquipesIde === 'function') {
    ecrireEquipesIde([...lireEquipesIde().filter(e => !e.demo),
      { id: 'demo-ide-1', demo: true, nom: 'Cabinet infirmier des Oliviers (fictif)', type: 'Cabinet infirmier libéral', secteur: 'Marseille 4e, 5e, 12e', telephone: '04 00 00 00 10', telephone2: '06 00 00 00 10', email: 'cabinet.oliviers@exemple.mssante.fr', adresse: '10 rue Exemple, 13005 Marseille', contacts: 'Mme MARTIN (référente), M. DURAND', notes: 'Passages 7 j/7 matin et soir ; injections retard au domicile.' },
      { id: 'demo-ide-2', demo: true, nom: 'IDE du CMP secteur 13G03 (fictif)', type: 'IDE du CMP / secteur', telephone: '04 00 00 00 20', notes: 'Visites à domicile du lundi au vendredi.' }]);
    patients.forEach(p => { if (p.id === 'demo-02') p.ideEquipe = 'demo-ide-1'; if (p.id === 'demo-08') p.ideEquipe = 'demo-ide-2'; });
  }
  if (typeof lireRdv === 'function') {
    ecrireRdv([...lireRdv().filter(r => !r.demo), ...genererRdvDemo()]);
    synchroniserProchain(patients.filter(p => p.demo).map(p => p.id));
  }
  sauvegarderPatients();
  definirPatientCourant('demo-01', true);
  afficherTableau();
  changerOnglet('accueil');
  toast('10 patients fictifs chargés (dossiers « DEMO- »).');
}
function retirerDemo() {
  const n = patients.filter(p => p.demo).length;
  if (!n) return toast('Aucun patient fictif à retirer.');
  if (!confirm(`Retirer les ${n} patients fictifs ? Les vraies fiches ne sont pas touchées.`)) return;
  patients = patients.filter(p => !p.demo);
  if (typeof lireEquipesIde === 'function') ecrireEquipesIde(lireEquipesIde().filter(e => !e.demo));
  if (typeof lireRdv === 'function') ecrireRdv(lireRdv().filter(r => !r.demo));
  sauvegarderPatients();
  if (typeof consPatientId !== 'undefined' && String(consPatientId).startsWith('demo-')) definirPatientCourant('', true);
  afficherTableau();
  changerOnglet('accueil');
  toast('Patients fictifs retirés.');
}
