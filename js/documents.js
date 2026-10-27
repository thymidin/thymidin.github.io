/* =====================================================================
   DOCUMENTS.JS — courriers, plan de sécurité, certificats de soins
   psychiatriques sans consentement
   ---------------------------------------------------------------------
   Chaque document est rédigé à partir de la fiche patient, de la dernière
   note (observation ou note de suivi) et du profil praticien, puis reste
   entièrement modifiable avant impression. Les documents peuvent être
   enregistrés dans la fiche (patient.docs).

   Certificats de soins sans consentement : formules construites d'après
   le code de la santé publique (L. 3211-2-2, L. 3212-1, L. 3212-3,
   L. 3212-7, L. 3213-1, L. 3213-3). Ce sont des modèles : à vérifier
   avec les modèles en vigueur dans votre établissement. Un certificat
   doit être descriptif (constatations personnelles), daté, signé, lisible.
   ===================================================================== */

const TYPES_DOCUMENTS = [
  { groupe: 'Ordonnances', types: [
    ['ordoTtt', 'Ordonnance de traitement (renouvellement)'],
    ['ordoBio', 'Ordonnance de bilans biologiques (surveillance)'],
    ['ordoBioLibre', 'Bilan biologique en texte libre'],
  ] },
  { groupe: 'Courriers', types: [
    ['cr', 'Compte rendu au médecin traitant'],
    ['relais', 'Courrier de relais (CMP, confrère)'],
    ['confrere', 'Réponse à un confrère'],
  ] },
  { groupe: 'Certificats', types: [
    ['certificat', 'Certificat médical remis au patient'],
  ] },
  { groupe: 'Prévention du suicide', types: [
    ['plan', 'Plan de sécurité (à remettre au patient)'],
  ] },
  { groupe: 'Soins psychiatriques sans consentement', types: [
    ['sdt', 'SDT : certificat initial (demande d’un tiers)'],
    ['sdtu', 'SDT en urgence : certificat initial'],
    ['sppi', 'Péril imminent : certificat initial'],
    ['sdre', 'SDRE : certificat initial'],
    ['c24', 'Certificat de 24 heures'],
    ['c72', 'Certificat de 72 heures'],
    ['c58', 'SDT : certificat entre le 5e et le 8e jour'],
    ['mensuelSdt', 'SDT : certificat mensuel'],
    ['mensuelSdre', 'SDRE : certificat mensuel'],
  ] },
];
const libelleDocument = type => TYPES_DOCUMENTS.flatMap(g => g.types).find(([t]) => t === type)[1];
const estCertificat = type => ['sdt', 'sdtu', 'sppi', 'sdre', 'c24', 'c72', 'c58', 'mensuelSdt', 'mensuelSdre'].includes(type);

/* Champs propres à chaque document. Types : texte, zone, choix (boutons), case, date. */
const CHAMPS_DOCUMENTS = {
  ordoTtt: [
    { id: 'lignes', type: 'zone', lignes: 6, label: 'Traitements prescrits (un médicament par ligne : molécule, dosage, posologie)', defaut: p => lignesOrdonnance(p, false) },
    { id: 'avecSomat', type: 'case', label: 'Ajouter les traitements non psychiatriques de la fiche', si: p => traitementsActifs(p).somat.length > 0 },
    { id: 'duree', type: 'choix', label: 'Durée du traitement', options: ['28 jours', '1 mois', '3 mois'], defaut: () => '1 mois' },
    { id: 'renouvellement', type: 'choix', label: 'Renouvellement', options: ['Non renouvelable', 'À renouveler 1 fois', 'À renouveler 2 fois'], defaut: () => 'Non renouvelable' },
    { id: 'ald', type: 'choix', label: 'Patient en ALD : cette prescription est', options: ['En rapport avec l’ALD', 'Sans rapport avec l’ALD'], defaut: () => 'En rapport avec l’ALD', si: p => !!p.ald },
    { id: 'mentions', type: 'zone', lignes: 2, label: 'Mentions complémentaires (facultatif)', aide: 'ex. délivrance fractionnée par 7 jours ; non substituable (motif) ; prise du soir…' },
  ],
  certificat: [
    { id: 'objet', type: 'choix', label: 'Objet', options: ['Présence en consultation', 'Suivi en cours', 'Constatations (texte libre)'], defaut: () => 'Présence en consultation' },
    { id: 'dateConsult', type: 'texte', label: 'Date de la consultation', defaut: () => formaterDate(aujourdhuiIso()), si: (p, v) => (v || docValeurs).objet === 'Présence en consultation' },
    { id: 'horaire', type: 'texte', label: 'Horaire (facultatif)', aide: 'ex. de 14 h 00 à 14 h 45', si: (p, v) => (v || docValeurs).objet === 'Présence en consultation' },
    { id: 'depuis', type: 'texte', label: 'Suivi depuis (facultatif)', aide: 'ex. mars 2025', si: (p, v) => (v || docValeurs).objet === 'Suivi en cours' },
    { id: 'contenu', type: 'zone', lignes: 4, label: 'Constatations ou précisions (facultatif)', aide: 'Uniquement ce qui est nécessaire à la demande ; pas de diagnostic sans l’accord exprès du patient.' },
    { id: 'remise', type: 'choix', label: 'Remis', options: ['En main propre à l’intéressé(e)', 'Au représentant légal'], defaut: () => 'En main propre à l’intéressé(e)' },
    { id: 'representant', type: 'texte', label: 'Identité du représentant légal', si: (p, v) => (v || docValeurs).remise === 'Au représentant légal' },
  ],
  ordoBioLibre: [
    { id: 'examens', type: 'zone', lignes: 7, label: 'Examens prescrits (un par ligne)', aide: 'ex. NFS, plaquettes\nIonogramme sanguin, créatinine avec DFG\nTSH' },
    { id: 'raccourcis', type: 'ajout', cible: 'examens', label: 'Ajouter un examen courant', options: ['NFS, plaquettes', 'Ionogramme sanguin', 'Créatinine avec estimation du DFG', 'Bilan hépatique (ASAT, ALAT, γGT, PAL, bilirubine)', 'Glycémie à jeun', 'HbA1c', 'Bilan lipidique (EAL)', 'TSH', 'CRP', 'Vitamine B12, folates', 'Vitamine D (25-OH)', 'Ferritine', 'Calcémie', 'Prolactinémie', 'β-HCG plasmatiques', 'CPK', 'Sérologies VIH, VHB, VHC', 'Lithémie (12 h après la dernière prise)', 'Dosage plasmatique de :'] },
    { id: 'aJeun', type: 'case', label: 'Prélèvement à jeun' },
    { id: 'lieu', type: 'choix', label: 'Lieu du prélèvement', options: ['Au laboratoire', 'À domicile'], defaut: () => 'Au laboratoire' },
    { id: 'renseignements', type: 'texte', label: 'Renseignements cliniques (facultatif ; limiter au nécessaire)' },
    { id: 'ald', type: 'choix', label: 'Patient en ALD : cette prescription est', options: ['En rapport avec l’ALD', 'Sans rapport avec l’ALD'], defaut: () => 'En rapport avec l’ALD', si: p => !!p.ald },
  ],
  cr: [
    { id: 'destinataire', type: 'texte', label: 'Destinataire', defaut: p => p.tel || '' },
    { id: 'motif', type: 'texte', label: 'Motif de la consultation', defaut: (p, n) => etatNote(n, 'motif') },
    { id: 'clinique', type: 'zone', lignes: 6, label: 'Éléments cliniques', defaut: (p, n) => extraitNote(n, ['EXAMEN PSYCHIATRIQUE', 'ÉVALUATION DU RISQUE']) },
    { id: 'diagnostic', type: 'texte', label: 'Hypothèse diagnostique', defaut: (p, n) => etatNote(n, 'hypothese') || p.dp || '' },
    { id: 'traitement', type: 'zone', lignes: 2, label: 'Traitement', defaut: p => traitementsEnCours(p) },
    { id: 'conduite', type: 'zone', lignes: 3, label: 'Conduite à tenir', defaut: (p, n) => conduiteNote(n) },
  ],
  relais: [
    { id: 'destinataire', type: 'texte', label: 'Destinataire (CMP, confrère)', defaut: p => p.cmp || '' },
    { id: 'motifRelais', type: 'texte', label: 'Motif du relais', aide: 'ex. fin de mon exercice dans le service ; déménagement ; réorientation…' },
    { id: 'histoire', type: 'zone', lignes: 5, label: 'Synthèse clinique', defaut: p => p.synthese || '' },
    { id: 'diagnostic', type: 'texte', label: 'Diagnostics', defaut: p => [p.dp, p.ds].filter(Boolean).join(' ; ') },
    { id: 'traitement', type: 'zone', lignes: 3, label: 'Traitement actuel', defaut: p => traitementsEnCours(p) },
    { id: 'surveillance', type: 'zone', lignes: 2, label: 'Surveillance biologique à prévoir', defaut: p => bilansAPrevoir(p) },
    { id: 'vigilance', type: 'zone', lignes: 2, label: 'Points de vigilance', defaut: p => (p.vigilance ? (p.vigtxt || 'Point de vigilance signalé') : '') },
    { id: 'suivi', type: 'texte', label: 'Rythme de suivi actuel', defaut: p => p.rythme || '' },
  ],
  confrere: [
    { id: 'destinataire', type: 'texte', label: 'Confrère', aide: 'ex. Dr Martin, psychiatre' },
    { id: 'question', type: 'texte', label: 'Question posée', aide: 'ex. avis diagnostique, avis thérapeutique', defaut: (p, n) => etatNote(n, 'motif') },
    { id: 'clinique', type: 'zone', lignes: 6, label: 'Éléments cliniques', defaut: (p, n) => extraitNote(n, ['EXAMEN PSYCHIATRIQUE', 'ÉVALUATION DU RISQUE']) },
    { id: 'avis', type: 'zone', lignes: 4, label: 'Avis', defaut: (p, n) => [etatNote(n, 'hypothese') ? 'Hypothèse diagnostique : ' + etatNote(n, 'hypothese') + '.' : '', etatNote(n, 'synthese')].filter(Boolean).join('\n') },
    { id: 'conduite', type: 'zone', lignes: 3, label: 'Propositions', defaut: (p, n) => conduiteNote(n) },
  ],
  plan: [
    { id: 'signes', type: 'zone', lignes: 3, label: '1. Mes signaux d’alerte (pensées, émotions, situations qui annoncent une crise)' },
    { id: 'strategies', type: 'zone', lignes: 3, label: '2. Ce que je peux faire seul(e) pour me détendre ou me changer les idées' },
    { id: 'lieux', type: 'zone', lignes: 2, label: '3. Personnes et lieux qui me changent les idées' },
    { id: 'proches', type: 'zone', lignes: 2, label: '4. Personnes à qui je peux demander de l’aide (nom, téléphone)' },
    { id: 'professionnels', type: 'zone', lignes: 3, label: '5. Professionnels à contacter (nom, téléphone, horaires)', defaut: () => {
      const pr = praticien || {};
      return [pr.nom ? `${pr.titre || 'Dr'} ${pr.prenom || ''} ${pr.nom.toUpperCase()}`.replace(/\s+/g, ' ') + (pr.telephone ? ' : ' + pr.telephone : '') : '', pr.etablissement || ''].filter(Boolean).join('\n');
    } },
    { id: 'environnement', type: 'zone', lignes: 2, label: '6. Rendre mon environnement plus sûr (moyens à éloigner, à confier)' },
    { id: 'raisons', type: 'zone', lignes: 2, label: 'Ce qui compte le plus pour moi, mes raisons de vivre', defaut: (p, n) => facteursProtectionNote(n) },
  ],
};
// Champs communs aux certificats.
const CHAMPS_CERTIFICAT = [
  { id: 'lieu', type: 'texte', label: 'Lieu de l’examen', defaut: () => (praticien || {}).etablissement || '' },
  { id: 'heure', type: 'texte', label: 'Date et heure de l’examen', defaut: () => `${formaterDate(aujourdhuiIso())} à ${new Date().toTimeString().slice(0, 5)}` },
  { id: 'adresse', type: 'texte', label: 'Adresse du patient (si connue)', defaut: p => (p.mdph2 && p.mdph2.Adresse) || '' },
  { id: 'constatations', type: 'zone', lignes: 8, label: 'Constatations (description clinique, sans diagnostic : présentation, contact, humeur, idées, comportement, risque, contexte)',
    defaut: (p, n) => extraitNote(n, ['EXAMEN PSYCHIATRIQUE', 'ÉVALUATION DU RISQUE']) },
  { id: 'consentement', type: 'choix', label: 'Consentement', options: ['Refus des soins', 'Consentement impossible du fait des troubles', 'Adhésion fluctuante, non fiable'] },
  { id: 'information', type: 'case', label: 'Le patient a été informé de la mesure et de ses droits', defaut: () => true },
];
const CHAMPS_SPECIFIQUES = {
  sdt: [{ id: 'surveillance', type: 'choix', label: 'Surveillance nécessaire', options: ['Constante (hospitalisation complète)', 'Régulière (autre forme de prise en charge)'] },
        { id: 'exterieur', type: 'case', label: 'Je n’exerce pas dans l’établissement d’accueil (obligatoire pour le premier certificat)', defaut: () => true }],
  sdtu: [{ id: 'risqueGrave', type: 'zone', lignes: 2, label: 'Éléments caractérisant le risque grave d’atteinte à l’intégrité du malade' }],
  sppi: [{ id: 'peril', type: 'zone', lignes: 2, label: 'Éléments caractérisant le péril imminent pour la santé' },
         { id: 'tiers', type: 'zone', lignes: 2, label: 'Impossibilité d’obtenir une demande de tiers (démarches effectuées)' },
         { id: 'exterieur', type: 'case', label: 'Je n’exerce pas dans l’établissement d’accueil', defaut: () => true }],
  sdre: [{ id: 'surete', type: 'zone', lignes: 2, label: 'Éléments compromettant la sûreté des personnes ou portant gravement atteinte à l’ordre public' },
         { id: 'exterieur', type: 'case', label: 'Je ne suis pas psychiatre de l’établissement d’accueil', defaut: () => true }],
  c24: [{ id: 'conclusion', type: 'choix', label: 'Conclusion', options: ['Maintien des soins sans consentement', 'Levée de la mesure'] },
        { id: 'somatique', type: 'case', label: 'Examen somatique complet réalisé dans les 24 heures', defaut: () => true }],
  c72: [{ id: 'conclusion', type: 'choix', label: 'Conclusion', options: ['Maintien des soins sans consentement', 'Levée de la mesure'] },
        { id: 'forme', type: 'choix', label: 'Forme de prise en charge proposée', options: ['Hospitalisation complète', 'Programme de soins'] }],
  c58: [{ id: 'conclusion', type: 'choix', label: 'Conclusion', options: ['Les soins restent nécessaires', 'Levée de la mesure'] },
        { id: 'forme', type: 'choix', label: 'Forme de prise en charge', options: ['Hospitalisation complète', 'Programme de soins'] }],
  mensuelSdt: [{ id: 'conclusion', type: 'choix', label: 'Conclusion', options: ['Les soins restent nécessaires', 'Levée de la mesure'] },
               { id: 'forme', type: 'choix', label: 'Forme de prise en charge', options: ['Hospitalisation complète', 'Programme de soins'] }],
  mensuelSdre: [{ id: 'conclusion', type: 'choix', label: 'Conclusion', options: ['Maintien des soins sans consentement', 'Levée de la mesure'] },
                { id: 'forme', type: 'choix', label: 'Forme de prise en charge', options: ['Hospitalisation complète', 'Programme de soins'] }],
};
const champsDocument = type => (estCertificat(type) ? [...CHAMPS_CERTIFICAT, ...(CHAMPS_SPECIFIQUES[type] || [])] : CHAMPS_DOCUMENTS[type] || [])
  .filter(c => !c.si || (patientDoc() && c.si(patientDoc())));

/* ---------- Ordonnance de traitement ---------- */
function lignesOrdonnance(p, somat) {
  return (p.trt || []).filter(t => t.nom && !t.fin && (somat ? t.g === 'somat' : t.g !== 'somat'))
    .map(t => `${t.nom}${t.dose ? ' : ' + t.dose : ''}`).join('\n');
}
/* Règles de prescription à rappeler (repères généraux ; le RCP et la réglementation en vigueur font foi). */
const REGLES_PRESCRIPTION = [
  [/methylphenidat|ritaline|concerta|quasym|medikinet/, 'Méthylphénidate : stupéfiant. Ordonnance sécurisée, 28 jours maximum, quantités en toutes lettres, prescription initiale et renouvellement annuel par un neurologue, un psychiatre ou un pédiatre (hospitalier ou de ville depuis 2021).'],
  [/methadon/, 'Méthadone : stupéfiant. Ordonnance sécurisée, 14 jours maximum, délivrance fractionnée (7 jours) sauf mention contraire, nom du pharmacien sur l’ordonnance.'],
  [/bupreno|subutex|suboxone|orobupre/, 'Buprénorphine : ordonnance sécurisée, 28 jours maximum, délivrance fractionnée (7 jours) sauf mention contraire, nom du pharmacien sur l’ordonnance.'],
  [/clonazepam|rivotril/, 'Clonazépam : ordonnance sécurisée, 12 semaines maximum ; prescription initiale annuelle par un neurologue ou un pédiatre.'],
  [/zolpidem|stilnox/, 'Zolpidem : ordonnance sécurisée, 28 jours maximum.'],
  [/zopiclone|imovane|lormetazepam|loprazolam|temazepam|estazolam|nitrazepam/, 'Hypnotique : durée de prescription limitée à 4 semaines (sevrage compris).'],
  [/alprazolam|xanax|lorazepam|temesta|bromazepam|lexomil|diazepam|valium|clorazepate|tranxene|prazepam|lysanxia|oxazepam|seresta/, 'Benzodiazépine anxiolytique : durée de prescription limitée à 12 semaines (sevrage compris).'],
  [/ketamin/, 'Kétamine : stupéfiant réservé à l’usage hospitalier ; en psychiatrie, usage hors AMM (seule l’eskétamine a une AMM dans la dépression).'],
  [/pramipexol|sifrol|liothyronin|cynomel|thybon|modafinil|modiodal|ketamin|memantin|ebixa|acetylcystein|mucomyst|prazosin|alpress|minipress|clonidin|catapressan|minocyclin|mynocine|guanfacin|intuniv|atomoxetin|strattera|lisdexamfetamin|xelevia|tranylcypromin|parnate/,
    'Si l’indication est hors AMM : informer le patient (absence d’alternative autorisée, risques, bénéfices attendus, conditions de remboursement), porter sur l’ordonnance la mention « Prescription hors autorisation de mise sur le marché » et motiver la prescription dans le dossier (art. L. 5121-12-1 du code de la santé publique).'],
  [/clozap|leponex/, 'Clozapine : délivrance conditionnée au contrôle des polynucléaires neutrophiles (carnet de suivi ANSM).'],
  [/valpro|depakot|depakin|depamide/, 'Valproate : chez la femme en âge de procréer, prescription initiale et annuelle par un spécialiste et accord de soins signé ; chez l’homme, précautions ANSM.'],
  [/lithi|teralithe/, 'Lithium : rappeler la surveillance de la lithémie et les interactions (AINS, diurétiques, IEC/ARA2).'],
];
function alertesPrescription(texte) {
  const t = String(texte || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return REGLES_PRESCRIPTION.filter(([motif]) => motif.test(t)).map(([, message]) => message);
}


/* ---------- Données reprises de la fiche et des notes ---------- */
function derniereNote(p) {
  return p ? [...(p.obs || [])].sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null : null;
}
const etatNote = (n, id) => (n && n.etat && typeof n.etat[id] === 'string' ? n.etat[id].trim() : '');
function extraitNote(n, rubriques) {
  if (!n || !n.texte) return '';
  const blocs = n.texte.split(/\n\s*\n/);
  return blocs.filter(b => rubriques.some(r => b.startsWith(r))).map(b => b.split('\n').slice(1).join('\n')).join('\n');
}
function conduiteNote(n) {
  if (!n || !n.etat) return '';
  return [...(n.etat.conduite || []), etatNote(n, 'conduiteDetail'), etatNote(n, 'prochainRdv') ? 'Prochain rendez-vous le ' + formaterDate(etatNote(n, 'prochainRdv')) + '.' : '']
    .filter(Boolean).join('\n');
}
function facteursProtectionNote(n) {
  return n && n.etat && Array.isArray(n.etat.facteursProtection) ? n.etat.facteursProtection.join(', ') : '';
}
function traitementsEnCours(p) {
  return texteTraitements(p, '\n');
}
function bilansAPrevoir(p) {
  return listerAlertes(p).map(a => `${a.traitement.nom} : ${a.libelle}${a.echeance ? ' (échéance ' + formaterDate(versIso(a.echeance)) + ')' : ''}`).join('\n');
}


/* ---------- Rédaction ---------- */
function nomMedecinComplet() {
  const pr = praticien || {};
  return pr.nom ? [pr.titre || 'Dr', pr.prenom, pr.nom.toUpperCase()].filter(Boolean).join(' ') : 'Dr ……………………';
}
function identitePatient(p, v) {
  const sexe = p.sexe;
  return `${[sexe === 'F' ? 'Mme' : sexe === 'M' ? 'M.' : 'M./Mme', (p.nom || '').toUpperCase(), p.prenom].filter(Boolean).join(' ')}`
    + (p.ddn ? `, né${sexe === 'F' ? 'e' : sexe === 'M' ? '' : '(e)'} le ${formaterDate(p.ddn)}` : '')
    + (v && v.adresse ? `, demeurant ${v.adresse}` : '');
}
const ligneSi = (titre, valeur) => (valeur && valeur.trim() ? `${titre} :\n${valeur.trim()}\n` : '');

function redigerDocument(type, p, v) {
  const pr = praticien || {};
  const ville = pr.ville || '……………';
  const date = formaterDate(aujourdhuiIso());
  const fe = p.sexe === 'F' ? 'e' : '';
  const ident = identitePatient(p, v);
  const nom = nomMedecinComplet();

  if (type === 'ordoTtt') {
    const somat = v.avecSomat ? lignesOrdonnance(p, true) : '';
    const lignes = [v.lignes, somat].filter(Boolean).join('\n').split('\n').map(l => l.trim()).filter(Boolean);
    const ald = p.ald && v.ald;
    const enTete = ald ? (v.ald === 'En rapport avec l’ALD'
      ? 'Prescriptions relatives au traitement de l’affection de longue durée reconnue (affection exonérante)'
      : 'Prescriptions sans rapport avec l’affection de longue durée (maladies intercurrentes)') : '';
    return [`${ville}, le ${date}`, '',
      `${ident}${p.ddn ? ', ' + calculerAge(p.ddn) + ' ans' : ''}`,
      p.allergies ? `Allergies, contre-indications : ${p.allergies}` : '', '',
      ald ? enTete.toUpperCase() + '\n' : '',
      ...lignes.map(l => '- ' + l), '',
      `Traitement pour ${v.duree || '1 mois'}. ${v.renouvellement || 'Non renouvelable'}.`,
      (v.mentions || '').trim()].filter((l, i, t) => !(l === '' && t[i - 1] === '')).join('\n').trim();
  }
  if (type === 'certificat') {
    const fe = p.sexe === 'F' ? 'e' : p.sexe === 'M' ? '' : '(e)';
    const corps = v.objet === 'Suivi en cours'
      ? `certifie que ${ident}${p.ddn ? ',' : ''} bénéficie d’un suivi médical régulier${v.depuis ? ' depuis ' + v.depuis.trim() : ''}.`
      : v.objet === 'Constatations (texte libre)'
        ? `certifie avoir examiné ${ident} le ${date} et avoir constaté :`
        : `certifie que ${ident}${p.ddn ? ',' : ''} s’est présenté${fe} à ma consultation le ${(v.dateConsult || date).trim()}${v.horaire ? ', ' + v.horaire.trim() : ''}.`;
    const remise = v.remise === 'Au représentant légal'
      ? `Certificat établi à la demande ${v.representant ? 'de ' + v.representant.trim() + ', représentant légal de l’intéressé' + fe : 'du représentant légal de l’intéressé' + fe} et remis en main propre.`
      : `Certificat établi à la demande de l’intéressé${fe} et remis en main propre.`;
    return [
      `Je soussigné(e), ${nom}, ${corps}`, '',
      (v.contenu || '').trim(), '',
      remise, '',
      `Fait à ${ville}, le ${date}.`].filter((l, i, t) => !(l === '' && t[i - 1] === '')).join('\n').trim();
  }
  if (type === 'ordoBioLibre') {
    const examens = String(v.examens || '').split('\n').map(l => l.trim()).filter(Boolean);
    const ald = p.ald && v.ald;
    return [`${ville}, le ${date}`, '',
      `${ident}${p.ddn ? ', ' + calculerAge(p.ddn) + ' ans' : ''}${p.sexe ? ' · ' + libelleSexe(p.sexe) : ''}`, '',
      ald ? (v.ald === 'En rapport avec l’ALD'
        ? 'PRESCRIPTIONS RELATIVES AU TRAITEMENT DE L’AFFECTION DE LONGUE DURÉE RECONNUE (AFFECTION EXONÉRANTE)'
        : 'PRESCRIPTIONS SANS RAPPORT AVEC L’AFFECTION DE LONGUE DURÉE (MALADIES INTERCURRENTES)') + '\n' : '',
      `Faire pratiquer ${(v.lieu || 'Au laboratoire').toLowerCase()} le bilan suivant${v.aJeun ? ', à jeun' : ''} :`,
      ...(examens.length ? examens.map(l => '- ' + l) : ['- ……………………………']), '',
      v.renseignements ? `Renseignements cliniques : ${v.renseignements.trim()}` : '',
      'Merci de transmettre les résultats au prescripteur.'].filter((l, i, t) => !(l === '' && t[i - 1] === '')).join('\n').trim();
  }
  if (type === 'cr') {
    return [`${ville}, le ${date}`, '', v.destinataire ? `À l’attention de ${v.destinataire}` : '', '',
      'Cher confrère, chère consœur,', '',
      `J’ai reçu en consultation ${ident}${v.motif ? `, que vous m’avez adressé${fe} pour ${v.motif.charAt(0).toLowerCase() + v.motif.slice(1).replace(/\.$/, '')}` : ''}.`, '',
      ligneSi('Éléments cliniques', v.clinique), ligneSi('Hypothèse diagnostique', v.diagnostic), ligneSi('Traitement', v.traitement), ligneSi('Conduite à tenir', v.conduite),
      'Je reste à votre disposition pour tout renseignement complémentaire.', '', 'Bien confraternellement,', '', nom]
      .join('\n').replace(/\n{3,}/g, '\n\n');
  }
  if (type === 'relais') {
    return [`${ville}, le ${date}`, '', v.destinataire ? `À l’attention de ${v.destinataire}` : '', '', 'Objet : relais de prise en charge', '',
      'Cher confrère, chère consœur,', '',
      `Je vous adresse ${ident}, que je suis${v.suivi ? ` (suivi ${v.suivi.toLowerCase()})` : ''}, pour la poursuite de sa prise en charge${v.motifRelais ? ', ' + v.motifRelais.replace(/\.$/, '') : ''}.`, '',
      ligneSi('Diagnostics', v.diagnostic), ligneSi('Synthèse clinique', v.histoire), ligneSi('Traitement actuel', v.traitement),
      ligneSi('Surveillance biologique à prévoir', v.surveillance), ligneSi('Points de vigilance', v.vigilance),
      'Je vous remercie de bien vouloir assurer la suite de la prise en charge et reste à votre disposition.', '', 'Bien confraternellement,', '', nom]
      .join('\n').replace(/\n{3,}/g, '\n\n');
  }
  if (type === 'confrere') {
    return [`${ville}, le ${date}`, '', v.destinataire ? `À l’attention de ${v.destinataire}` : '', '',
      'Cher confrère,', '',
      `Je vous remercie de m’avoir adressé ${ident}${v.question ? ` pour ${v.question.charAt(0).toLowerCase() + v.question.slice(1).replace(/\.$/, '')}` : ''}, que j’ai reçu${fe} en consultation le ${date}.`, '',
      ligneSi('Éléments cliniques', v.clinique), ligneSi('Avis', v.avis), ligneSi('Propositions', v.conduite),
      'Je reste à votre disposition pour en discuter.', '', 'Bien confraternellement,', '', nom]
      .join('\n').replace(/\n{3,}/g, '\n\n');
  }
  if (type === 'plan') {
    const champs = CHAMPS_DOCUMENTS.plan;
    return [`MON PLAN DE SÉCURITÉ`, `${[p.prenom, (p.nom || '').toUpperCase()].filter(Boolean).join(' ')} · établi le ${date} avec ${nom}`, '',
      ...champs.map(c => `${accorder(c.label, p.sexe).toUpperCase()}\n${(v[c.id] || '').trim() || '…………………………………………………………'}\n`),
      'EN CAS D’URGENCE',
      '3114 : numéro national de prévention du suicide (24 h/24, 7 j/7, gratuit)',
      '15 : SAMU · 112 : numéro d’urgence européen',
      'Se rendre aux urgences de l’hôpital le plus proche.'].join('\n');
  }

  // ---- Certificats ----
  const entete = `Je soussigné${pr.sexe === 'F' ? 'e' : '(e)'}, ${nom}${pr.rpps ? ', RPPS ' + pr.rpps : ''}${pr.specialite ? ', ' + pr.specialite.toLowerCase() : ''}, certifie avoir examiné ${v.heure ? 'le ' + v.heure : 'ce jour'}${v.lieu ? ', à ' + v.lieu : ''}, ${ident}.`;
  const constat = `J’ai constaté les éléments suivants :\n${(v.constatations || '…').trim()}`;
  // Pour les certificats initiaux, l'impossibilité de consentir figure déjà dans la formule légale.
  const consentDejaDit = ['sdt', 'sdtu', 'sppi'].includes(type) && v.consentement === 'Consentement impossible du fait des troubles';
  const consent = consentDejaDit ? '' : {
    'Refus des soins': `${p.sexe === 'F' ? 'La patiente' : 'Le patient'} refuse les soins qui lui sont proposés.`,
    'Consentement impossible du fait des troubles': 'Les troubles mentaux constatés rendent impossible son consentement aux soins.',
    'Adhésion fluctuante, non fiable': 'Son adhésion aux soins est fluctuante et ne permet pas d’obtenir un consentement fiable.',
  }[v.consentement] || '';
  const info = v.information ? `${p.sexe === 'F' ? 'La patiente' : 'Le patient'} a été informé${fe} de la mesure envisagée et de ses droits, dans la mesure où son état le permet.` : '';
  const parente = 'Je certifie n’être ni parent ni allié, au quatrième degré inclusivement, du directeur de l’établissement d’accueil ni de la personne examinée.';
  const exterieur = v.exterieur ? (type === 'sdre' ? 'Je ne suis pas psychiatre de l’établissement d’accueil.' : 'Je n’exerce pas dans l’établissement d’accueil.') : '';
  const fin = [`Fait à ${ville}, le ${date}.`, '', nom];
  const corps = {
    sdt: [
      `Les troubles mentaux constatés rendent impossible son consentement et son état mental impose des soins immédiats assortis d’une surveillance médicale ${String(v.surveillance || '').startsWith('Régulière') ? 'régulière justifiant une prise en charge sous une autre forme qu’une hospitalisation complète' : 'constante justifiant une hospitalisation complète'}.`,
      'En conséquence, cet état nécessite l’admission en soins psychiatriques à la demande d’un tiers, en application de l’article L. 3212-1 (II, 1°) du code de la santé publique.',
      exterieur],
    sdtu: [
      'Les troubles mentaux constatés rendent impossible son consentement et son état mental impose des soins immédiats assortis d’une surveillance médicale constante justifiant une hospitalisation complète.',
      `Il existe un risque grave d’atteinte à l’intégrité du malade${v.risqueGrave ? ' : ' + v.risqueGrave.trim().replace(/\.$/, '') : ''}.`,
      'En conséquence, cet état nécessite l’admission en soins psychiatriques à la demande d’un tiers selon la procédure d’urgence prévue à l’article L. 3212-3 du code de la santé publique.'],
    sppi: [
      'Les troubles mentaux constatés rendent impossible son consentement et son état mental impose des soins immédiats assortis d’une surveillance médicale constante justifiant une hospitalisation complète.',
      `Il existe, à la date de l’admission, un péril imminent pour la santé de la personne${v.peril ? ' : ' + v.peril.trim().replace(/\.$/, '') : ''}.`,
      `Il est impossible d’obtenir une demande de tiers${v.tiers ? ' : ' + v.tiers.trim().replace(/\.$/, '') : ''}.`,
      'En conséquence, cet état nécessite l’admission en soins psychiatriques en cas de péril imminent, en application de l’article L. 3212-1 (II, 2°) du code de la santé publique.',
      exterieur],
    sdre: [
      `Les troubles mentaux constatés nécessitent des soins et compromettent la sûreté des personnes ou portent atteinte de façon grave à l’ordre public${v.surete ? ' : ' + v.surete.trim().replace(/\.$/, '') : ''}.`,
      'En conséquence, cet état nécessite l’admission en soins psychiatriques sur décision du représentant de l’État, en application de l’article L. 3213-1 du code de la santé publique.',
      exterieur],
    c24: [
      'Certificat établi dans les vingt-quatre heures suivant l’admission (article L. 3211-2-2 du code de la santé publique).',
      v.somatique ? 'Un examen somatique complet a été réalisé.' : '',
      v.conclusion === 'Levée de la mesure'
        ? 'Les conditions ayant motivé l’admission en soins psychiatriques sans consentement ne sont plus réunies. Je conclus à la levée de la mesure.'
        : 'Les conditions ayant motivé l’admission en soins psychiatriques sans consentement sont toujours réunies. Je conclus à la nécessité de maintenir les soins psychiatriques.'],
    c72: [
      'Certificat établi dans les soixante-douze heures suivant l’admission (article L. 3211-2-2 du code de la santé publique).',
      v.conclusion === 'Levée de la mesure'
        ? 'Les conditions ayant motivé l’admission en soins psychiatriques sans consentement ne sont plus réunies. Je conclus à la levée de la mesure.'
        : `Les conditions ayant motivé l’admission en soins psychiatriques sans consentement sont toujours réunies. Je conclus à la nécessité de maintenir les soins psychiatriques et propose une prise en charge sous la forme ${v.forme === 'Programme de soins' ? 'd’un programme de soins' : 'd’une hospitalisation complète'}.`],
    c58: [
      'Certificat établi entre le cinquième et le huitième jour suivant l’admission (article L. 3212-7 du code de la santé publique).',
      v.conclusion === 'Levée de la mesure' ? 'Les soins psychiatriques sans consentement ne sont plus nécessaires.'
        : `Les soins psychiatriques sans consentement restent nécessaires, sous la forme ${v.forme === 'Programme de soins' ? 'd’un programme de soins' : 'd’une hospitalisation complète'}.`],
    mensuelSdt: [
      'Certificat mensuel (article L. 3212-7 du code de la santé publique).',
      v.conclusion === 'Levée de la mesure' ? 'Les soins psychiatriques sans consentement ne sont plus nécessaires.'
        : `Les soins psychiatriques sans consentement restent nécessaires, sous la forme ${v.forme === 'Programme de soins' ? 'd’un programme de soins' : 'd’une hospitalisation complète'}.`],
    mensuelSdre: [
      'Certificat mensuel (article L. 3213-3 du code de la santé publique).',
      v.conclusion === 'Levée de la mesure' ? 'Les troubles ayant motivé la mesure ne justifient plus de soins sans consentement. Je conclus à la levée de la mesure.'
        : `L’état de ${p.sexe === 'F' ? 'la patiente' : 'le patient'} justifie le maintien des soins psychiatriques sur décision du représentant de l’État, sous la forme ${v.forme === 'Programme de soins' ? 'd’un programme de soins' : 'd’une hospitalisation complète'}.`],
  }[type];
  const sansParente = ['c24', 'c72', 'c58', 'mensuelSdt', 'mensuelSdre'].includes(type);
  return [`CERTIFICAT MÉDICAL · ${libelleDocument(type).toUpperCase()}`, '', entete, '', constat, '', consent, info, '', ...corps.filter(Boolean), '', sansParente ? '' : parente, '', ...fin]
    .filter((l, i, t) => !(l === '' && t[i - 1] === '')).join('\n').trim();
}


/* ---------- Interface ---------- */
let docPatientId = '';
let docType = 'ordoTtt';
let docValeurs = {};
let docTexteModifie = false;
const patientDoc = () => patients.find(p => p.id === docPatientId);

// Raccourcis affichés en permanence ; tous les autres documents sont dans la liste déroulante.
const DOCUMENTS_RAPIDES = [['ordoTtt', 'Ordonnance'], ['ordoBioLibre', 'Bilan biologique'], ['cr', 'Compte rendu'], ['relais', 'Relais'], ['certificat', 'Certificat']];

function htmlVueDocuments() {
  return `
  <div class="carte doc-choix">
    <select id="docPatient" class="selecteur-masque" aria-hidden="true" tabindex="-1"></select>
    <label for="docTypeChoix">Document</label>
    <select id="docTypeChoix">${TYPES_DOCUMENTS.map(g => `<optgroup label="${echapper(g.groupe)}">${g.types.map(([t, l]) => `<option value="${t}">${echapper(l)}</option>`).join('')}</optgroup>`).join('')}</select>
    <div class="doc-rapides" id="docTypes">${DOCUMENTS_RAPIDES.map(([t, l]) => `<button type="button" data-type="${t}">${l}</button>`).join('')}</div>
  </div>
  <div class="obs-grille">
    <div class="carte"><div class="g" id="docChamps"></div><p class="sec" id="docAvertissement"></p></div>
    <div class="carte obs-sortie">
      <div class="doc-sortie-entete">
        <div><h3 class="h3" style="margin:0" id="docTitre"></h3><div class="sec" id="docSource"></div></div>
        <span class="sp"></span>
        <button type="button" class="discret" id="docCopier" title="Copier le texte">Copier</button>
        <button type="button" class="discret" id="docRegenerer" title="Annuler les retouches manuelles et reprendre le formulaire">Régénérer</button>
      </div>
      <textarea id="docTexte" spellcheck="true"></textarea>
      <div class="act" style="margin-top:8px">
        <span class="sec" id="docMsg"></span><span class="sp"></span>
        <button type="button" id="docImprimer">Imprimer</button>
        <button type="button" class="main" id="docEnregistrer">Enregistrer</button>
      </div>
      <div id="docHistorique" style="margin-top:12px"></div>
    </div>
  </div>`;
}

function htmlChampDoc(c) {
  const v = docValeurs[c.id];
  if (c.type === 'zone') return `<div class="full"><label>${c.label}</label><textarea data-doc="${c.id}" rows="${c.lignes || 3}" style="min-height:0"${c.aide ? ` placeholder="${echapper(c.aide)}"` : ''}>${echapper(v || '')}</textarea></div>`;
  if (c.type === 'choix') return `<div class="full"><label>${c.label}</label><div class="choix-multiples">${c.options.map(o => `<button type="button" data-doc-choix="${c.id}" data-opt="${echapper(o)}" class="${v === o ? 'on' : ''}">${echapper(o)}</button>`).join('')}</div></div>`;
  if (c.type === 'ajout') return `<div class="full"><select data-doc-ajout="${c.cible}" aria-label="${echapper(c.label)}"><option value="">+ ${echapper(c.label)}…</option>${c.options.map(o => `<option value="${echapper(o)}">${echapper(o)}</option>`).join('')}</select></div>`;
  if (c.type === 'case') return `<div class="full chk"><input type="checkbox" id="doc_${c.id}" data-doc="${c.id}" ${v ? 'checked' : ''}><label for="doc_${c.id}">${c.label}</label></div>`;
  return `<div class="full"><label>${c.label}</label><input data-doc="${c.id}" value="${echapper(v || '')}"${c.aide ? ` placeholder="${echapper(c.aide)}"` : ''}></div>`;
}

function initialiserDocuments() {
  $('vueDocuments').innerHTML = htmlVueDocuments();
  $('docPatient').onchange = () => { docPatientId = $('docPatient').value; nouveauDocument(); };
  const choisirType = type => {
    if (type === 'ordoBio') {                      // ordonnance de surveillance : fenêtre dédiée de la fiche
      $('docTypeChoix').value = docType;
      if (!docPatientId) return signaler(null, 'Choisissez d’abord un patient.');
      ouvrirFiche(docPatientId); setTimeout(() => $('btnOrdonnance').click(), 0);
      return;
    }
    docType = type;
    nouveauDocument();
  };
  $('docTypes').onclick = e => { const b = e.target.closest('button[data-type]'); if (b) choisirType(b.dataset.type); };
  $('docTypeChoix').onchange = () => choisirType($('docTypeChoix').value);
  $('docChamps').addEventListener('change', e => {
    const s = e.target.closest('select[data-doc-ajout]');
    if (!s || !s.value) return;
    const id = s.dataset.docAjout, ajout = s.value;
    const lignes = String(docValeurs[id] || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (!lignes.includes(ajout)) lignes.push(ajout);
    docValeurs[id] = lignes.join('\n');
    const zone = $('docChamps').querySelector(`[data-doc="${id}"]`);
    if (zone) { zone.value = docValeurs[id]; if (/:$/.test(ajout)) { zone.focus(); zone.selectionStart = zone.selectionEnd = zone.value.length; } }
    s.value = '';
    majDocument();
  });
  $('docChamps').addEventListener('input', e => {
    const id = e.target.dataset.doc;
    if (!id) return;
    docValeurs[id] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    majDocument();
    if (docType === 'ordoTtt') afficherAvertissementOrdo();
  });
  $('docChamps').addEventListener('click', e => {
    const ajout = e.target.closest('button[data-doc-ajout]');
    if (ajout) {                                   // ajoute une ligne d'examen (texte libre)
      const id = ajout.dataset.docAjout;
      const lignes = String(docValeurs[id] || '').split('\n').map(l => l.trim()).filter(Boolean);
      if (!lignes.includes(ajout.dataset.opt)) lignes.push(ajout.dataset.opt);
      docValeurs[id] = lignes.join('\n');
      const zone = $('docChamps').querySelector(`[data-doc="${id}"]`);
      if (zone) { zone.value = docValeurs[id]; if (/:$/.test(ajout.dataset.opt)) { zone.focus(); zone.selectionStart = zone.selectionEnd = zone.value.length; } }
      majDocument();
      return;
    }
    const b = e.target.closest('button[data-doc-choix]');
    if (!b) return;
    const id = b.dataset.docChoix;
    docValeurs[id] = docValeurs[id] === b.dataset.opt ? '' : b.dataset.opt;
    $('docChamps').querySelectorAll(`[data-doc-choix="${id}"]`).forEach(x => x.classList.toggle('on', x.dataset.opt === docValeurs[id]));
    // Champs conditionnels (certificat : date de consultation, représentant légal…) : réafficher.
    if (CHAMPS_DOCUMENTS[docType] && CHAMPS_DOCUMENTS[docType].some(c => c.si && c.si.length >= 2)) afficherChampsDocument();
    majDocument();
  });
  $('docTexte').addEventListener('input', () => { docTexteModifie = true; });
  $('docRegenerer').onclick = () => { docTexteModifie = false; majDocument(); };
  $('docCopier').onclick = () => copierTexte($('docTexte').value).then(ok => signaler($('docMsg'), ok ? 'Copié.' : 'Copie impossible ici.'));
  $('docImprimer').onclick = imprimerDocumentCourant;
  $('docEnregistrer').onclick = enregistrerDocument;
  $('docHistorique').onclick = e => {
    const b = e.target.closest('button[data-id]');
    const p = patientDoc();
    if (!b || !p) return;
    const d = (p.docs || []).find(x => x.id === b.dataset.id);
    if (!d) return;
    if (b.dataset.action === 'ouvrir') {
      docType = d.type; docValeurs = { ...d.valeurs }; afficherChampsDocument();
      $('docTexte').value = d.texte; docTexteModifie = true;
    } else if (confirm('Supprimer ce document ?')) {
      p.docs = p.docs.filter(x => x.id !== d.id); sauvegarderPatients(); afficherHistoriqueDocs();
    }
  };
}

function afficherVueDocuments(idPatient, type) {
  const change = idPatient !== undefined && idPatient !== docPatientId;
  if (idPatient !== undefined) docPatientId = idPatient;
  if (type) docType = type;
  remplirSelectPatients($('docPatient'), docPatientId);
  docPatientId = $('docPatient').value;
  if (change || type || !Object.keys(docValeurs).length) nouveauDocument();
  else afficherHistoriqueDocs();
}

function nouveauDocument() {
  const p = patientDoc();
  docValeurs = {};
  docTexteModifie = false;
  if (p) {
    const n = derniereNote(p);
    champsDocument(docType).forEach(c => { if (c.defaut) docValeurs[c.id] = c.defaut(p, n); });
    // Plan de sécurité déjà établi : on le reprend.
    if (docType === 'plan' && p.planSecurite) Object.assign(docValeurs, p.planSecurite);
    const source = derniereNote(p);
    $('docSource').textContent = source ? `Repris de la note du ${formaterDate(source.date)} et de la fiche` : 'Aucune note enregistrée : repris de la fiche';
  }
  afficherChampsDocument();
  majDocument();
}

function afficherChampsDocument() {
  document.querySelectorAll('#docTypes button').forEach(b => b.classList.toggle('on', b.dataset.type === docType));
  if ($('docTypeChoix')) $('docTypeChoix').value = docType;
  $('docTitre').textContent = libelleDocument(docType);
  $('docChamps').innerHTML = champsDocument(docType).map(htmlChampDoc).join('');
  if (docType === 'ordoTtt') {
    const alertes = alertesPrescription([docValeurs.lignes, docValeurs.avecSomat ? lignesOrdonnance(patientDoc() || {}, true) : ''].join('\n'));
    $('docAvertissement').innerHTML = (alertes.length ? '<b>À vérifier :</b><br>' + alertes.map(echapper).join('<br>') + '<br>' : '')
      + 'Ordonnance pré-remplie à vérifier, dater et signer. Les médicaments sur ordonnance sécurisée doivent être prescrits sur le papier sécurisé.';
    afficherHistoriqueDocs();          // (oubli corrigé : l'historique n'apparaissait pas sur l'ordonnance, type affiché par défaut)
    return;
  }
  $('docAvertissement').textContent = estCertificat(docType)
    ? 'Modèle construit d’après le code de la santé publique : vérifiez-le avec les modèles de votre établissement. Le certificat doit décrire vos constatations personnelles (pas de diagnostic), être daté, signé et lisible.'
    : docType === 'plan' ? 'À remplir avec le patient, dans ses mots. Le plan imprimé lui est remis ; il est aussi gardé dans sa fiche.' : '';
  afficherHistoriqueDocs();
}

function afficherAvertissementOrdo() {
  const alertes = alertesPrescription([docValeurs.lignes, docValeurs.avecSomat ? lignesOrdonnance(patientDoc() || {}, true) : ''].join('\n'));
  $('docAvertissement').innerHTML = (alertes.length ? '<b>À vérifier :</b><br>' + alertes.map(echapper).join('<br>') + '<br>' : '')
    + 'Ordonnance pré-remplie à vérifier, dater et signer. Les médicaments sur ordonnance sécurisée doivent être prescrits sur le papier sécurisé.';
}

function majDocument() {
  const p = patientDoc();
  if (!p) { $('docTexte').value = ''; return; }
  if (!docTexteModifie) $('docTexte').value = redigerDocument(docType, p, docValeurs);
}

function enregistrerDocument() {
  const p = patientDoc();
  if (!p) return;
  p.docs = p.docs || [];
  p.docs.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), type: docType, date: aujourdhuiIso(), valeurs: { ...docValeurs }, texte: $('docTexte').value });
  if (docType === 'plan') p.planSecurite = { ...docValeurs, date: aujourdhuiIso() };
  sauvegarderPatients();
  afficherHistoriqueDocs();
  signaler($('docMsg'), 'Enregistré dans la fiche.');
}

function afficherHistoriqueDocs() {
  const p = patientDoc();
  const liste = p ? [...(p.docs || [])].reverse() : [];
  $('docHistorique').innerHTML = liste.length ? '<div class="sec" style="margin-bottom:4px">Documents enregistrés</div>' + liste.map(d => `
    <div class="obs-hist"><span>${formaterDate(d.date)} · ${echapper(libelleDocument(d.type))}</span>
      <span><button type="button" data-action="ouvrir" data-id="${d.id}">Rouvrir</button>
      <button type="button" class="danger" data-action="supprimer" data-id="${d.id}">Supprimer</button></span></div>`).join('') : '';
}

function imprimerDocumentCourant() {
  const ordonnance = ['ordoTtt', 'ordoBioLibre'].includes(docType);
  const entete = docType !== 'plan' ? enteteImpression({ avecRpps: ordonnance || estCertificat(docType) || docType === 'certificat' }) : '';
  const titre = docType === 'ordoBioLibre' ? '<h2>Ordonnance</h2>' : docType === 'certificat' ? '<h2>Certificat médical</h2>' : '';
  imprimerDocument(`<div class="ordo doc${docType === 'plan' ? ' plan-securite' : ''}">${entete}${titre}<div style="white-space:pre-wrap">${echapper($('docTexte').value)}</div>
    ${estCertificat(docType) || ['cr', 'relais', 'confrere', 'ordoTtt', 'ordoBioLibre', 'certificat'].includes(docType) ? `<div class="ordo-signature">${ordonnance ? 'Signature et cachet du prescripteur' : 'Signature'}</div>` : ''}</div>`,
    ['cr', 'relais', 'confrere'].includes(docType) ? 'courrier' : '');
}
