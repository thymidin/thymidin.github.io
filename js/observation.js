/* =====================================================================
   OBSERVATION.JS — première observation clinique en consultation
   ---------------------------------------------------------------------
   Formulaire standardisé, pensé pour aller vite : la plupart des items
   se cochent d'un clic (pastilles), quelques champs courts complètent.
   Le bouton « Examen normal » coche en une fois les éléments sans
   particularité des rubriques restées vides ; cocher ensuite un élément
   pathologique retire automatiquement l'élément normal correspondant.

   Le texte d'observation est généré au fil de la saisie, modifiable,
   copiable dans le dossier et enregistrable dans la fiche du patient
   (patient.obs = [{ id, date, etat, texte }]).

   Réglages (dans ce fichier, section 1) : chaque pastille s'écrit
   '*Texte|groupe' :
     *        = élément « normal » (coché par le bouton Examen normal)
     |groupe  = cocher un élément pathologique du même groupe décoche
                l'élément normal de ce groupe (groupe par défaut : la rubrique)
   « (e) » s'accorde automatiquement selon le sexe renseigné dans la fiche.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. CONTENU DU FORMULAIRE
   Types : 'p1' = une seule pastille ; 'p' = plusieurs pastilles ;
           'texte' = ligne ; 'zone' = paragraphe ; 'date'.
   Le libellé sert aussi de début de phrase dans le texte généré.
   --------------------------------------------------------------------- */
const OBS_SECTIONS = [
  { titre: 'Contexte de la consultation', champs: [
    { id: 'cadre', type: 'p1', label: 'Cadre', options: ['Première consultation', 'Relais de suivi', 'Consultation post-urgences', 'Consultation post-hospitalisation', 'Consultation aux urgences', 'Consultation de liaison', 'Téléconsultation'] },
    { id: 'relaisDe', type: 'texte', label: 'Relais de', aide: 'ex. Dr X, psychiatre libéral ; CMP de … ; service de …', si: v => (v.cadre || [])[0] === 'Relais de suivi' },
    { id: 'adresse', type: 'p1', label: 'Adressé(e) par', options: ['Son médecin traitant', 'Un psychiatre', 'Un psychologue', 'Le service des urgences', 'Un service hospitalier', 'Un CMP', 'Sa propre initiative', 'Son entourage', 'Un service social', 'Une autorité judiciaire'] },
    { id: 'accompagne', type: 'texte', label: 'Accompagné(e) de', aide: 'ex. sa mère, son conjoint' },
    { id: 'motif', type: 'zone', label: 'Motif de consultation', aide: 'Demande exprimée par le patient, dans ses mots si possible' },
  ] },

  { titre: 'Mode de vie', champs: [
    { id: 'famille', type: 'p1', label: 'Situation familiale', options: ['Célibataire', 'En couple', 'Marié(e) ou pacsé(e)', 'Séparé(e) ou divorcé(e)', 'Veuf(ve)'] },
    { id: 'enfants', type: 'texte', label: 'Enfants', aide: 'ex. 2 enfants (8 et 12 ans), garde alternée' },
    { id: 'logement', type: 'p1', label: 'Logement', options: ['Logement autonome', 'Vit chez ses parents', 'Hébergé(e) par un tiers', 'Foyer ou résidence sociale', 'Sans domicile stable'] },
    { id: 'entourage', type: 'p', label: 'Entourage', options: ['Vit seul(e)', 'Entourage soutenant', 'Isolement social', 'Conflits familiaux'] },
    { id: 'etudes', type: 'texte', label: 'Niveau d’études', aide: 'ex. BTS, arrêt en seconde' },
    { id: 'profession', type: 'texte', label: 'Activité professionnelle', aide: 'ex. aide-soignante, en arrêt de travail depuis mars' },
    { id: 'ressources', type: 'p', label: 'Ressources', options: ['Salaire', 'Allocation chômage', 'RSA', 'AAH', 'Pension d’invalidité', 'Bourse étudiante', 'Sans ressources'] },
    { id: 'protection', type: 'p1', label: 'Mesure de protection', options: ['Aucune', 'Curatelle simple', 'Curatelle renforcée', 'Tutelle', 'Habilitation familiale', 'Sauvegarde de justice', 'Demande en cours'] },
    { id: 'biographie', type: 'zone', label: 'Éléments biographiques', aide: 'Fratrie, enfance, événements marquants, parcours…' },
  ] },

  { titre: 'Antécédents', champs: [
    { id: 'suivi', type: 'p1', label: 'Suivi psychiatrique', options: ['Aucun suivi antérieur', 'Suivi antérieur interrompu', 'Suivi en cours'] },
    { id: 'suiviDetail', si: v => ['Suivi antérieur interrompu', 'Suivi en cours'].includes((v.suivi || [])[0]),  type: 'texte', label: 'Précisions sur le suivi', aide: 'ex. suivi au CMP de … de 2018 à 2021' },
    { id: 'hospit', type: 'p1', label: 'Hospitalisations en psychiatrie', options: ['Aucune', 'Une', 'Plusieurs'] },
    { id: 'hospitDetail', si: v => ['Une', 'Plusieurs'].includes((v.hospit || [])[0]),  type: 'texte', label: 'Précisions sur les hospitalisations', aide: 'dates, durées, motifs' },
    { id: 'ssc', si: v => ['Une', 'Plusieurs'].includes((v.hospit || [])[0]),  type: 'p', label: 'Soins sans consentement', options: ['Jamais', 'Antécédent de SPDT', 'Antécédent de SPDRE', 'Programme de soins en cours'] },
    { id: 'ts', type: 'p1', label: 'Tentatives de suicide', options: ['Aucune', 'Une', 'Plusieurs'] },
    { id: 'tsDetail', si: v => ['Une', 'Plusieurs'].includes((v.ts || [])[0]),  type: 'texte', label: 'Précisions sur les tentatives de suicide', aide: 'dates, modalités, gravité, contexte' },
    { id: 'automut', type: 'p1', label: 'Automutilations', options: ['Aucune', 'Anciennes', 'Actuelles'] },
    { id: 'diagAnt', type: 'texte', label: 'Diagnostics antérieurs', liste: 'listeCim' },
    { id: 'ttAnt', type: 'zone', label: 'Traitements antérieurs', aide: 'molécules, posologies, efficacité, tolérance, motif d’arrêt' },
    { id: 'atcdMed', type: 'zone', label: 'Antécédents médicaux et chirurgicaux', aide: 'dont épilepsie, traumatisme crânien, cardiopathie, troubles thyroïdiens…' },
    { id: 'allergie', type: 'p1', label: 'Allergies', options: ['Pas d’allergie connue', 'Allergie(s)'] },
    { id: 'allergieDetail', si: v => (v.allergie || [])[0] === 'Allergie(s)',  type: 'texte', label: 'Précisions sur les allergies' },
    { id: 'contraception', si: () => { const p = patientObs(); return !p || p.sexe !== 'M'; },  type: 'texte', label: 'Contraception / grossesse', aide: 'si pertinent' },
    { id: 'atcdFam', type: 'p', label: 'Antécédents familiaux psychiatriques', options: ['Aucun connu', 'Trouble de l’humeur', 'Trouble psychotique', 'Suicide', 'Tentative de suicide', 'Addiction', 'Trouble du neurodéveloppement'] },
    { id: 'atcdFamDetail', si: v => (v.atcdFam || []).some(t => t !== 'Aucun connu'),  type: 'texte', label: 'Précisions sur les antécédents familiaux', aide: 'ex. père : trouble bipolaire de type I' },
  ] },

  { titre: 'Consommations', champs: [
    { id: 'tabac', type: 'p1', label: 'Tabac', options: ['Non-fumeur', 'Fumeur', 'Sevré'] },
    { id: 'tabacQ', si: v => ['Fumeur', 'Sevré'].includes((v.tabac || [])[0]),  type: 'texte', label: 'Quantité de tabac', aide: 'ex. 15 cigarettes par jour, 20 PA' },
    { id: 'alcool', type: 'p1', label: 'Alcool', options: ['Pas de consommation', 'Consommation occasionnelle', 'Usage nocif', 'Dépendance', 'Sevré'] },
    { id: 'alcoolQ', si: v => (v.alcool || []).length && (v.alcool || [])[0] !== 'Pas de consommation',  type: 'texte', label: 'Quantité d’alcool', aide: 'ex. 4 verres standard par jour' },
    { id: 'cannabis', type: 'p1', label: 'Cannabis', options: ['Pas de consommation', 'Consommation occasionnelle', 'Consommation régulière', 'Consommation quotidienne', 'Sevré'] },
    { id: 'cannabisQ', si: v => (v.cannabis || []).length && (v.cannabis || [])[0] !== 'Pas de consommation',  type: 'texte', label: 'Quantité de cannabis', aide: 'ex. 5 joints par jour' },
    { id: 'autresToxiques', type: 'texte', label: 'Autres substances / addictions comportementales', aide: 'cocaïne, opiacés, jeux…' },
  ] },

  { titre: 'Traitement actuel et histoire de la maladie', champs: [
    { id: 'ttActuel', type: 'zone', label: 'Traitement actuel', aide: 'Repris automatiquement de la fiche patient si renseigné' },
    { id: 'histoire', type: 'zone', label: 'Histoire de la maladie', lignes: 6, aide: 'Début des troubles, évolution, facteurs déclenchants, épisodes antérieurs…' },
  ] },

  { titre: 'Examen psychiatrique', examen: true, champs: [
    { id: 'presentation', type: 'p', label: 'Présentation', options: ['*Tenue adaptée|tenue', '*Hygiène correcte|hyg', 'Tenue négligée|tenue', 'Incurie|hyg', 'Tenue extravagante|tenue', 'Amaigrissement visible'] },
    { id: 'contact', type: 'p', label: 'Contact', options: ['*Contact de bonne qualité', '*Calme et coopérant(e)|calme', 'Réticent(e)', 'Méfiant(e)', 'Contact fuyant', 'Froid(e) et distant(e)', 'Familier(e), désinhibé(e)|calme', 'Hostile|calme', 'Opposant(e)|calme'] },
    { id: 'psychomot', type: 'p', label: 'Psychomotricité', options: ['*Sans particularité', 'Ralentissement psychomoteur', 'Agitation psychomotrice', 'Tension interne', 'Clinophilie', 'Signes catatoniques', 'Mouvements anormaux'] },
    { id: 'humeur', type: 'p', label: 'Humeur', options: ['*Humeur neutre (euthymique)', 'Humeur triste', 'Humeur expansive', 'Irritabilité', 'Labilité thymique', 'Anhédonie', 'Aboulie', 'Sentiment de culpabilité', 'Dévalorisation', 'Désespoir'] },
    { id: 'affects', type: 'p', label: 'Affects', options: ['*Affects adaptés et mobilisables', 'Émoussement affectif', 'Discordance idéo-affective', 'Hyperesthésie affective', 'Pleurs au cours de l’entretien'] },
    { id: 'anxiete', type: 'p', label: 'Anxiété', options: ['*Pas d’anxiété au premier plan', 'Anxiété flottante', 'Attaques de panique', 'Ruminations anxieuses', 'Évitements phobiques', 'Obsessions', 'Compulsions'] },
    { id: 'discours', type: 'p', label: 'Discours', options: ['*Discours cohérent et informatif', 'Logorrhée', 'Discours pauvre', 'Discours diffluent', 'Latence des réponses', 'Néologismes', 'Mutisme'] },
    { id: 'cours', type: 'p', label: 'Cours de la pensée', options: ['*Fluide', 'Tachypsychie', 'Fuite des idées', 'Bradypsychie', 'Barrages', 'Relâchement des associations'] },
    { id: 'delire', type: 'p', label: 'Contenu de la pensée', options: ['*Absence d’idées délirantes', 'Idées délirantes de persécution', 'de référence', 'mégalomaniaques', 'mystiques', 'de jalousie', 'd’influence', 'hypochondriaques', 'de ruine ou de culpabilité', 'Idées obsédantes'] },
    { id: 'mecanismes', si: v => (v.delire || []).some(t => !['Absence d’idées délirantes', 'Idées obsédantes'].includes(t)),  type: 'p', label: 'Mécanismes délirants', options: ['Interprétatif', 'Intuitif', 'Imaginatif', 'Hallucinatoire'] },
    { id: 'adhesion', si: v => (v.delire || []).some(t => !['Absence d’idées délirantes', 'Idées obsédantes'].includes(t)),  type: 'p1', label: 'Adhésion au délire', options: ['Totale', 'Partielle', 'Critique'] },
    { id: 'perceptions', type: 'p', label: 'Perceptions', options: ['*Absence d’hallucinations', 'Hallucinations acoustico-verbales', 'Hallucinations visuelles', 'Hallucinations cénesthésiques', 'Hallucinations olfactives ou gustatives', 'Attitude d’écoute', 'Automatisme mental', 'Dépersonnalisation, déréalisation'] },
    { id: 'instinct', type: 'p', label: 'Conduites instinctuelles', options: ['*Sommeil conservé|som', 'Insomnie d’endormissement|som', 'Réveils nocturnes|som', 'Réveil précoce|som', 'Hypersomnie|som', 'Réduction du besoin de sommeil|som', '*Appétit conservé|app', 'Perte d’appétit|app', 'Hyperphagie|app', 'Perte de poids|app', 'Prise de poids|app', 'Troubles de la libido'] },
    { id: 'cognition', type: 'p', label: 'Fonctions cognitives', options: ['*Orienté(e) dans le temps et l’espace|ori', '*Pas de plainte cognitive|pl', 'Plainte mnésique|pl', 'Troubles attentionnels|pl', 'Désorientation temporo-spatiale|ori', 'Confusion|ori'] },
    { id: 'insight', type: 'p', label: 'Insight', options: ['*Bonne conscience des troubles|ins', 'Conscience partielle des troubles|ins', 'Absence de conscience des troubles|ins', '*Demandeur(se) de soins|dem', 'Ambivalence vis-à-vis des soins|dem', 'Opposition aux soins|dem'] },
    { id: 'jugement', type: 'p1', label: 'Jugement', options: ['*Préservé', 'Altéré'] },
  ] },

  { titre: 'Évaluation du risque', examen: true, champs: [
    { id: 'suicide', type: 'p', label: 'Idées suicidaires', options: ['*Absence d’idées suicidaires', 'Idées passives de mort', 'Idées suicidaires actives', 'Scénario élaboré', 'Moyens à disposition', 'Date ou lieu envisagés', 'Préparatifs (lettre, dons…)', 'Passage à l’acte récent'] },
    { id: 'facteursProtection', si: v => (v.suicide || []).some(t => t !== 'Absence d’idées suicidaires'),  type: 'p', label: 'Facteurs de protection', options: ['Entourage soutenant', 'Enfants à charge', 'Projets d’avenir', 'Convictions personnelles ou religieuses', 'Alliance thérapeutique', 'Critique des idées suicidaires'] },
    { id: 'risque', si: v => (v.suicide || []).some(t => t !== 'Absence d’idées suicidaires'),  type: 'p1', label: 'Risque suicidaire', options: ['Faible', 'Moyen', 'Élevé'] },
    { id: 'urgence', si: v => (v.suicide || []).some(t => t !== 'Absence d’idées suicidaires'),  type: 'p1', label: 'Urgence suicidaire', options: ['Faible', 'Moyenne', 'Élevée'] },
    { id: 'dangerosite', si: v => (v.suicide || []).some(t => !['Absence d’idées suicidaires', 'Idées passives de mort'].includes(t)),  type: 'p1', label: 'Dangerosité du scénario', options: ['Faible', 'Moyenne', 'Élevée'] },
    { id: 'hetero', type: 'p', label: 'Risque hétéro-agressif', options: ['*Pas d’élément en faveur d’un risque hétéro-agressif', 'Antécédents de violence', 'Menaces verbales', 'Idées hétéro-agressives', 'Accès à une arme'] },
  ] },

  { titre: 'Examen somatique et paraclinique', replie: true, champs: [
    { id: 'somatique', type: 'zone', label: 'Examen somatique', lignes: 2, aide: 'constantes, poids, IMC, examen neurologique…' },
    { id: 'paraclinique', type: 'zone', label: 'Examens complémentaires', lignes: 2, aide: 'ECG (QTc), biologie, imagerie…' },
  ] },

  { titre: 'Conclusion', champs: [
    { id: 'synthese', type: 'zone', label: 'Synthèse', lignes: 4 },
    { id: 'hypothese', type: 'texte', label: 'Hypothèse diagnostique principale', liste: 'listeCim' },
    { id: 'differentiel', type: 'texte', label: 'Diagnostics différentiels / comorbidités' },
    { id: 'conduite', type: 'p', label: 'Conduite à tenir', options: ['Instauration d’un traitement', 'Adaptation du traitement', 'Poursuite du traitement actuel', 'Suivi psychiatrique régulier', 'Orientation vers un CMP', 'Suivi infirmier', 'Prise en charge psychologique', 'Orientation CATTP / hôpital de jour', 'Bilan biologique', 'ECG', 'Bilan neuropsychologique', 'Évaluation diagnostique spécialisée', 'Arrêt de travail', 'Lien avec le médecin traitant', 'Hospitalisation proposée', 'Information sur le 3114 et le 15'] },
    { id: 'conduiteDetail', type: 'zone', label: 'Précisions sur la prise en charge', lignes: 3, aide: 'molécules et posologies, orientations, démarches sociales…' },
    { id: 'prochainRdv', type: 'date', label: 'Prochain rendez-vous' },
  ] },
];

/* Note de suivi : plus courte ; l'examen et l'évaluation du risque sont les mêmes que pour la première observation. */
const OBS_SECTIONS_SUIVI = [
  { titre: 'Consultation de suivi', champs: [
    { id: 'cadreSuivi', type: 'p1', label: 'Cadre', options: ['Consultation de suivi', 'Téléconsultation de suivi', 'Consultation non programmée'] },
    { id: 'accompagne', type: 'texte', label: 'Accompagné(e) de', aide: 'ex. sa mère, son conjoint' },
    { id: 'evolution', type: 'p1', label: 'Évolution depuis la dernière consultation', options: ['Amélioration', 'Stabilité', 'Aggravation', 'Rechute'] },
    { id: 'evenements', type: 'zone', label: 'Événements depuis la dernière consultation', aide: 'Faits marquants, hospitalisation, arrêt de travail, conflits, consommations…' },
    { id: 'plainte', type: 'zone', label: 'Plainte et demande du jour' },
  ] },
  { titre: 'Traitement', champs: [
    { id: 'ttActuel', type: 'zone', label: 'Traitement actuel', aide: 'Repris automatiquement de la fiche patient si renseigné' },
    { id: 'observance', type: 'p1', label: 'Observance', options: ['Bonne observance', 'Observance partielle', 'Non-observance', 'Arrêt du traitement par le patient'] },
    { id: 'tolerance', type: 'p', label: 'Tolérance', options: ['*Bonne tolérance', 'Sédation|x', 'Prise de poids|x', 'Effets extrapyramidaux|x', 'Akathisie|x', 'Troubles sexuels|x', 'Troubles digestifs|x', 'Autres effets indésirables|x'].map(o => o.replace('|x', '')) },
    { id: 'toleranceDetail', type: 'texte', label: 'Précisions sur la tolérance', si: v => (v.tolerance || []).some(t => t !== 'Bonne tolérance') },
    { id: 'consoSuivi', type: 'p1', label: 'Consommations', options: ['Pas de consommation', 'Consommations stables', 'Diminution', 'Augmentation', 'Reprise'] },
    { id: 'consoSuiviDetail', type: 'texte', label: 'Précisions sur les consommations', si: v => (v.consoSuivi || []).length && (v.consoSuivi || [])[0] !== 'Pas de consommation' },
  ] },
];
const OBS_EXAMEN_RISQUE = OBS_SECTIONS.filter(s => s.examen);
const OBS_CONCLUSION_SUIVI = { titre: 'Conclusion', champs: [
  { id: 'synthese', type: 'zone', label: 'Synthèse', lignes: 3 },
  { id: 'conduite', type: 'p', label: 'Conduite à tenir', options: OBS_SECTIONS.find(s => s.titre === 'Conclusion').champs.find(c => c.id === 'conduite').options },
  { id: 'conduiteDetail', type: 'zone', label: 'Précisions sur la prise en charge', lignes: 3, aide: 'molécules et posologies, orientations…' },
  { id: 'prochainRdv', type: 'date', label: 'Prochain rendez-vous' },
] };
OBS_SECTIONS_SUIVI.push(...OBS_EXAMEN_RISQUE, OBS_CONCLUSION_SUIVI);

let obsType = 'premiere';

/* Brouillons : la note en cours est gardée automatiquement par patient (rien n'est perdu si l'onglet se ferme). */
const CLE_BROUILLONS = CLE_STOCKAGE + '_brouillons';
function lireBrouillons() { try { return JSON.parse(localStorage.getItem(CLE_BROUILLONS) || '{}') || {}; } catch (erreur) { return {}; } }
function ecrireBrouillons(b) { try { localStorage.setItem(CLE_BROUILLONS, JSON.stringify(b)); } catch (erreur) { /* ignoré */ } }
let minuteurBrouillon = null;
function enregistrerBrouillonObs() {
  if (!obsPatientId) return;
  clearTimeout(minuteurBrouillon);
  minuteurBrouillon = setTimeout(() => {
    const b = lireBrouillons();
    b[obsPatientId] = { type: obsType, etat: obsEtat, date: $('obsDate').value, editionId: obsEditionId,
                        texte: obsTexteModifie ? $('obsTexte').value : null, maj: new Date().toISOString() };
    ecrireBrouillons(b);
  }, 400);
}
function supprimerBrouillonObs(id) {
  clearTimeout(minuteurBrouillon);
  const b = lireBrouillons();
  if (b[id || obsPatientId]) { delete b[id || obsPatientId]; ecrireBrouillons(b); }
}
/** Restaure le brouillon du patient s'il existe (renvoie vrai si restauré). */
function restaurerBrouillonObs(typeImpose) {
  const br = lireBrouillons()[obsPatientId];
  if (!br || (typeImpose && br.type !== typeImpose)) return false;
  if (br.type !== obsType) changerTypeObs(br.type, true);
  obsEtat = br.etat || {};
  obsEditionId = br.editionId || null;
  $('obsDate').value = br.date || aujourdhuiIso();
  ecrireFormulaireObs();
  if (br.texte) { $('obsTexte').value = br.texte; obsTexteModifie = true; } else { obsTexteModifie = false; majObservation(); }
  signaler(null, `Brouillon du ${new Date(br.maj).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} restauré · « ${obsType === 'suivi' ? 'Nouvelle note' : 'Nouvelle observation'} » pour repartir de zéro.`);
  return true;
}                     // 'premiere' (première observation) ou 'suivi'
const sectionsObs = () => (obsType === 'suivi' ? OBS_SECTIONS_SUIVI : OBS_SECTIONS);
// Tous les champs des deux formulaires (un même identifiant = un même champ).
const OBS_CHAMPS = [...OBS_SECTIONS, ...OBS_SECTIONS_SUIVI].flatMap(s => s.champs)
  .filter((c, i, tous) => tous.findIndex(x => x.id === c.id) === i);

/** '*Texte|groupe' → { texte, normal, groupe } */
function lireOption(option, champId) {
  const normal = option.startsWith('*');
  const [texte, groupe] = option.replace(/^\*/, '').split('|');
  return { texte, normal, groupe: groupe || champId };
}


/* ---------------------------------------------------------------------
   2. ÉTAT ET INTERFACE
   --------------------------------------------------------------------- */
let obsPatientId = '';
let obsEtat = {};                 // { idChamp: valeur (texte) ou liste de textes (pastilles) }
let obsEditionId = null;          // observation enregistrée en cours de modification
let obsTexteModifie = false;      // le texte généré a été retouché à la main

const patientObs = () => patients.find(p => p.id === obsPatientId);

function htmlChampObs(c) {
  return htmlChampObsBrut(c).replace(/^<div/, `<div data-champ-obs="${c.id}"${c.si && !c.si(obsEtat) ? ' hidden' : ''}`);
}
function champObsVisible(id) {
  const c = OBS_CHAMPS.find(x => x.id === id);
  return !c || !c.si || !!c.si(obsEtat);
}
function majVisibiliteObs() {
  document.querySelectorAll('#obsForm [data-champ-obs]').forEach(n => {
    const c = OBS_CHAMPS.find(x => x.id === n.dataset.champObs);
    n.hidden = !!(c.si && !c.si(obsEtat));
  });
}
function htmlChampObsBrut(c) {
  const id = 'obs_' + c.id;
  const aide = c.aide ? ` placeholder="${echapper(c.aide)}"` : '';
  if (c.type === 'p' || c.type === 'p1') {
    return `<div class="obs-champ full"><span class="obs-lib">${c.label}</span><span class="pastilles" data-champ="${c.id}">${c.options.map(o => {
      const opt = lireOption(o, c.id);
      return `<button type="button" class="pastille-choix${opt.normal ? ' normal' : ''}" data-opt="${echapper(opt.texte)}">${echapper(opt.texte)}</button>`;
    }).join('')}</span></div>`;
  }
  if (c.type === 'zone') return `<div class="full"><label for="${id}">${c.label}</label><textarea id="${id}" data-champ="${c.id}" rows="${c.lignes || 2}" style="min-height:0"${aide}></textarea></div>`;
  if (c.type === 'date') return `<div><label for="${id}">${c.label}</label><input type="date" id="${id}" data-champ="${c.id}"></div>`;
  return `<div${c.liste ? ' class="full"' : ''}><label for="${id}">${c.label}</label><input id="${id}" data-champ="${c.id}"${aide}${c.liste ? ` list="${c.liste}"` : ''}></div>`;
}

function htmlVueObservation() {
  return `
  <div class="carte">
    <div class="bar" style="margin-top:0">
      <label for="obsPatient" style="margin:0">Patient</label>
      <select id="obsPatient" style="max-width:320px"></select>
      <label for="obsDate" style="margin:0">Date</label><input type="date" id="obsDate" style="width:auto">
      <div class="segments" id="obsType">
        <button type="button" data-type="premiere" class="on">Première observation</button>
        <button type="button" data-type="suivi">Note de suivi</button>
      </div>
      <span class="sp" style="flex:1"></span>
      <button type="button" id="obsReprendre" hidden title="Reprend l’examen et l’évaluation du risque de la dernière note enregistrée">Reprendre l’examen précédent</button>
      <button type="button" id="obsNormal" title="Coche les éléments normaux des rubriques d’examen encore vides">Examen normal</button>
      <button type="button" id="obsNouveau">Nouvelle observation</button>
    </div>
    <p class="sec">Un clic coche une pastille, un second la décoche. « Examen normal » remplit les rubriques d’examen vides ;
    cocher ensuite un élément pathologique retire l’élément normal correspondant. Les rubriques vides n’apparaissent pas dans le texte.</p>
  </div>

  <div class="obs-grille">
    <form id="obsForm" onsubmit="return false"></form>

    <div class="carte obs-sortie">
      <div class="bar" style="margin-top:0"><h3 class="h3" style="margin:0">Texte d’observation</h3><span class="sp" style="flex:1"></span>
        <span class="sec" id="obsMsg"></span></div>
      <textarea id="obsTexte" spellcheck="true"></textarea>
      <div class="act" style="flex-wrap:wrap;margin-top:8px">
        <button type="button" id="obsRegenerer" title="Remplace le texte par celui généré à partir du formulaire">Régénérer</button>
        <button type="button" id="obsCopier">Copier</button>
        <button type="button" id="obsImprimer">Imprimer</button>
        <span class="sp"></span>
        <button type="button" class="main" id="obsEnregistrer">Enregistrer dans la fiche</button>
      </div>
      <div id="obsHistorique" style="margin-top:12px"></div>
    </div>
  </div>`;
}

function htmlFormulaireObs() {
  return sectionsObs().map((s, i) => `
    <details class="carte rubrique" ${s.replie ? '' : 'open'}>
      <summary><b>${s.titre}</b> <span class="sec" data-compte="${i}"></span></summary>
      <div class="g" style="margin-top:10px">${s.champs.map(htmlChampObs).join('')}</div>
    </details>`).join('');
}

/** Change le type de note (première observation / note de suivi). */
function changerTypeObs(type, sansReinitialiser) {
  obsType = type;
  document.querySelectorAll('#obsType button').forEach(b => b.classList.toggle('on', b.dataset.type === type));
  $('obsReprendre').hidden = type !== 'suivi';
  $('obsNouveau').textContent = type === 'suivi' ? 'Nouvelle note' : 'Nouvelle observation';
  $('obsForm').innerHTML = htmlFormulaireObs();
  if (!sansReinitialiser) nouvelleObservation(false, type);
}

/** Reprend, dans la note en cours, l'examen et l'évaluation du risque de la dernière note enregistrée. */
function reprendreExamenPrecedent() {
  const p = patientObs();
  const derniere = p && [...(p.obs || [])].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (!derniere) return signaler($('obsMsg'), 'Aucune note enregistrée pour ce patient.');
  OBS_EXAMEN_RISQUE.flatMap(s => s.champs).forEach(c => {
    if (derniere.etat && derniere.etat[c.id] !== undefined) obsEtat[c.id] = JSON.parse(JSON.stringify(derniere.etat[c.id]));
  });
  afficherPastilles();
  majObservation();
  signaler($('obsMsg'), `Examen repris de la note du ${formaterDate(derniere.date)} : cochez ce qui a changé.`);
}

function initialiserObservation() {
  $('vueObservation').innerHTML = htmlVueObservation();
  $('obsForm').innerHTML = htmlFormulaireObs();
  $('obsType').onclick = e => {
    const b = e.target.closest('button[data-type]');
    if (!b || b.dataset.type === obsType) return;
    if (Object.keys(obsEtat).length > 1 && !confirm('Changer de type de note efface le formulaire en cours. Continuer ?')) return;
    changerTypeObs(b.dataset.type);
  };
  $('obsReprendre').onclick = reprendreExamenPrecedent;
  $('obsDate').value = aujourdhuiIso();

  $('obsPatient').onchange = () => { obsPatientId = $('obsPatient').value; nouvelleObservation(); };
  $('obsForm').addEventListener('click', e => {
    const b = e.target.closest('button[data-opt]');
    if (!b) return;
    basculerPastille(b.closest('[data-champ]').dataset.champ, b.dataset.opt);
  });
  $('obsForm').addEventListener('input', e => {
    const champ = e.target.dataset && e.target.dataset.champ;
    if (!champ) return;
    obsEtat[champ] = e.target.value;
    majObservation();
    enregistrerBrouillonObs();
  });
  $('obsTexte').addEventListener('input', () => { obsTexteModifie = true; enregistrerBrouillonObs(); });
  $('obsNormal').onclick = examenNormal;
  $('obsNouveau').onclick = () => {
    if (Object.keys(obsEtat).length > 1 && !confirm('Effacer le formulaire en cours ?')) return;
    supprimerBrouillonObs();
    nouvelleObservation(true);
  };
  $('obsRegenerer').onclick = () => { obsTexteModifie = false; majObservation(); };
  $('obsCopier').onclick = () => copierTexte($('obsTexte').value).then(ok => signaler($('obsMsg'), ok ? 'Copié.' : 'Copie impossible ici.'));
  $('obsImprimer').onclick = imprimerObservation;
  $('obsEnregistrer').onclick = enregistrerObservation;
  $('obsDate').onchange = majObservation;
  $('obsHistorique').onclick = e => {
    const b = e.target.closest('button[data-id]');
    const p = patientObs();
    if (!b || !p) return;
    const o = (p.obs || []).find(x => x.id === b.dataset.id);
    if (!o) return;
    if (b.dataset.action === 'ouvrir') {
      if ((o.type || 'premiere') !== obsType) changerTypeObs(o.type || 'premiere', true);
      obsEditionId = o.id;
      obsEtat = JSON.parse(JSON.stringify(o.etat || {}));
      $('obsDate').value = o.date;
      ecrireFormulaireObs();
      $('obsTexte').value = o.texte;
      obsTexteModifie = true;                                    // garde le texte tel qu'enregistré
      signaler($('obsMsg'), 'Observation du ' + formaterDate(o.date) + ' rouverte.');
    } else if (b.dataset.action === 'supprimer') {
      if (!confirm('Supprimer cette observation ?')) return;
      p.obs = p.obs.filter(x => x.id !== o.id);
      if (obsEditionId === o.id) obsEditionId = null;
      sauvegarderPatients();
      afficherHistoriqueObs();
    }
  };
}

function afficherVueObservation(idPatient) {
  const change = idPatient !== undefined && idPatient !== obsPatientId;
  if (idPatient !== undefined) obsPatientId = idPatient;
  remplirSelectPatients($('obsPatient'), obsPatientId, '— Sans patient —');
  obsPatientId = $('obsPatient').value;
  if (change) nouvelleObservation();
  else { afficherHistoriqueObs(); if (!Object.keys(obsEtat).length) nouvelleObservation(); }
}

function nouvelleObservation(sansBrouillon, typeImpose) {
  majObservation.prevenu = false;
  if (!sansBrouillon && obsPatientId && restaurerBrouillonObs(typeImpose)) return;
  obsEtat = {};
  obsEditionId = null;
  obsTexteModifie = false;
  $('obsDate').value = aujourdhuiIso();
  const p = patientObs();
  // Pré-remplissage depuis la fiche patient.
  if (p) {
    const tt = texteTraitements(p);
    if (tt) obsEtat.ttActuel = tt;
    if (p.ald && p.aldTexte) obsEtat.atcdMed = 'ALD : ' + p.aldTexte;
    if (p.allergies) { obsEtat.allergie = ['Allergie(s)']; obsEtat.allergieDetail = p.allergies; }
  }
  ecrireFormulaireObs();
  majObservation();
}

function ecrireFormulaireObs() {
  OBS_CHAMPS.forEach(c => {
    if (c.type === 'p' || c.type === 'p1' || !$('obs_' + c.id)) return;
    $('obs_' + c.id).value = obsEtat[c.id] || '';
  });
  afficherPastilles();
  afficherHistoriqueObs();
}

function afficherPastilles() {
  document.querySelectorAll('#obsForm [data-champ] .pastille-choix, #obsForm .pastilles .pastille-choix').forEach(b => {
    const champ = b.closest('[data-champ]').dataset.champ;
    b.classList.toggle('on', (obsEtat[champ] || []).includes(b.dataset.opt));
  });
  sectionsObs().forEach((s, i) => {
    const n = s.champs.filter(c => {
      const v = obsEtat[c.id];
      return Array.isArray(v) ? v.length : v;
    }).length;
    const compte = document.querySelector(`[data-compte="${i}"]`);
    if (compte) compte.textContent = n ? `· ${n}/${s.champs.length}` : '';
  });
}

function basculerPastille(champId, texte) {
  const c = OBS_CHAMPS.find(x => x.id === champId);
  let liste = Array.isArray(obsEtat[champId]) ? [...obsEtat[champId]] : [];
  if (liste.includes(texte)) {
    liste = liste.filter(x => x !== texte);
  } else if (c.type === 'p1') {
    liste = [texte];
  } else {
    const opts = c.options.map(o => lireOption(o, c.id));
    const choisi = opts.find(o => o.texte === texte);
    // Un élément pathologique retire l'élément normal du même groupe, et inversement.
    liste = liste.filter(x => {
      const o = opts.find(y => y.texte === x);
      return !o || o.groupe !== choisi.groupe || o.normal === choisi.normal;
    });
    liste.push(texte);
    // Garde l'ordre du formulaire.
    liste.sort((a, b) => opts.findIndex(o => o.texte === a) - opts.findIndex(o => o.texte === b));
  }
  obsEtat[champId] = liste;
  afficherPastilles();
  majObservation();
  enregistrerBrouillonObs();
}

function examenNormal() {
  let n = 0;
  sectionsObs().filter(s => s.examen).forEach(s => s.champs.forEach(c => {
    if (!(c.type === 'p' || c.type === 'p1')) return;
    const normaux = c.options.map(o => lireOption(o, c.id)).filter(o => o.normal);
    if (!normaux.length) return;
    const actuel = Array.isArray(obsEtat[c.id]) ? obsEtat[c.id] : [];
    const groupesRemplis = new Set(actuel.map(t => (c.options.map(o => lireOption(o, c.id)).find(o => o.texte === t) || {}).groupe));
    const ajout = normaux.filter(o => !groupesRemplis.has(o.groupe)).map(o => o.texte);
    if (ajout.length) {
      const opts = c.options.map(o => lireOption(o, c.id));
      obsEtat[c.id] = [...actuel, ...ajout].sort((a, b) => opts.findIndex(o => o.texte === a) - opts.findIndex(o => o.texte === b));
      n += ajout.length;
    }
  }));
  afficherPastilles();
  majObservation();
  enregistrerBrouillonObs();
  signaler($('obsMsg'), n ? `${n} élément(s) normal(aux) ajouté(s).` : 'Rubriques d’examen déjà renseignées.');
}


/* ---------------------------------------------------------------------
   3. GÉNÉRATION DU TEXTE
   --------------------------------------------------------------------- */

/** Accord de « (e) », « (se) », « (ve) » selon le sexe ('F', 'M' ou '' = inchangé). */
function accorder(texte, sexe) {
  if (sexe === 'F') return texte.replace(/f\(ve\)/g, 've').replace(/r\(se\)/g, 'se').replace(/\(e\)/g, 'e');
  if (sexe === 'M') return texte.replace(/\((ve|se|e)\)/g, '');
  return texte;
}
const majuscule = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
const minusculeDebut = t => (/^[A-ZÉÈÀ][a-zéèàêîôûç’' ]/.test(t) && !/^(CMP|CATTP|ECG|RSA|AAH|SPD|BTS|TDAH)/.test(t)) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
const point = t => (t && !/[.!?…]$/.test(t.trim()) ? t.trim() + '.' : (t || '').trim());

/** Liste de pastilles → « a, b et c ». */
function enumerer(liste) {
  const l = liste.map((t, i) => (i === 0 ? t : minusculeDebut(t)));
  return l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : (l[0] || '');
}

function genererObservation() {
  if (obsType === 'suivi') return genererNoteSuivi();
  const p = patientObs();
  const sexe = p ? p.sexe : '';
  const v = id => obsEtat[id];
  const pastilles = id => (champObsVisible(id) && Array.isArray(v(id)) ? v(id) : []);
  const texte = id => (champObsVisible(id) && typeof v(id) === 'string' ? v(id).trim() : '');
  const lignes = [];
  const ajouter = t => { if (t) lignes.push(accorder(t, sexe)); };
  const rubrique = (titre, contenu) => {
    const corps = contenu.filter(Boolean);
    if (corps.length) { lignes.push('', titre.toUpperCase()); corps.forEach(ajouter); }
  };
  // « Humeur : triste, anhédonie » (le mot de la rubrique n'est pas répété en tête de pastille).
  const sansLibelle = (label, t) => {
    const mot = label.toLowerCase();
    return t.toLowerCase().startsWith(mot + ' ') ? t.slice(mot.length + 1) : t;
  };
  const phrase = (label, id) => (pastilles(id).length
    ? `${label} : ${point(pastilles(id).map(t => minusculeDebut(sansLibelle(label, t))).join(', '))}`
    : '');
  const ligneTexte = (label, id) => (texte(id) ? `${label} : ${point(texte(id))}` : '');

  // En-tête
  const date = $('obsDate').value || aujourdhuiIso();
  if (p) {
    const age = p.ddn ? calculerAge(p.ddn) : '';
    const civilite = sexe === 'F' ? 'Mme' : sexe === 'M' ? 'M.' : '';
    lignes.push(`OBSERVATION PSYCHIATRIQUE DU ${formaterDate(date)}`);
    lignes.push([civilite, nomPatient(p)].filter(Boolean).join(' ') + (age !== '' ? `, ${age} ans` : '') + (p.ddn ? ` (né${sexe === 'F' ? 'e' : sexe === 'M' ? '' : '(e)'} le ${formaterDate(p.ddn)})` : '') + '.');
  } else {
    lignes.push(`OBSERVATION PSYCHIATRIQUE DU ${formaterDate(date)}`);
  }

  // Contexte
  const cadre = pastilles('cadre')[0];
  const adresse = pastilles('adresse')[0];
  const venue = !adresse ? '' : adresse === 'Sa propre initiative' ? 'venu(e) de sa propre initiative' : 'adressé(e) par ' + minusculeDebut(adresse);
  const relais = cadre === 'Relais de suivi' && texte('relaisDe') ? 'relais de ' + texte('relaisDe') : '';
  const contexte = [cadre === 'Relais de suivi' && relais ? 'Relais de suivi (' + relais.replace(/^relais de /, '') + ')' : cadre, venue, texte('accompagne') ? 'accompagné(e) de ' + texte('accompagne') : '']
    .filter(Boolean).map((t, i) => (i === 0 ? majuscule(t) : t)).join(', ');
  rubrique('Contexte', [
    contexte ? point(contexte) : '',
    ligneTexte('Motif de consultation', 'motif'),
  ]);

  // Mode de vie
  const famille = [pastilles('famille')[0], texte('enfants')].filter(Boolean).map((t, i) => (i ? minusculeDebut(t) : t)).join(', ');
  rubrique('Mode de vie', [
    famille ? point(majuscule(famille)) : '',
    pastilles('logement').length || pastilles('entourage').length
      ? point(majuscule([...pastilles('logement'), ...pastilles('entourage')].map((t, i) => (i ? minusculeDebut(t) : t)).join(', ')))
      : '',
    ligneTexte('Niveau d’études', 'etudes'),
    ligneTexte('Activité professionnelle', 'profession'),
    phrase('Ressources', 'ressources'),
    pastilles('protection')[0] ? (pastilles('protection')[0] === 'Aucune' ? 'Pas de mesure de protection.' : `Mesure de protection : ${point(minusculeDebut(pastilles('protection')[0]))}`) : '',
    texte('biographie') ? point(texte('biographie')) : '',
  ]);

  // Antécédents
  const hospit = pastilles('hospit')[0];
  const ts = pastilles('ts')[0];
  const automut = pastilles('automut')[0];
  rubrique('Antécédents psychiatriques personnels', [
    pastilles('suivi')[0] ? point(pastilles('suivi')[0] + (texte('suiviDetail') ? ' : ' + texte('suiviDetail') : '')) : ligneTexte('Suivi', 'suiviDetail'),
    hospit ? point((hospit === 'Aucune' ? 'Aucune hospitalisation en psychiatrie' : hospit === 'Une' ? 'Une hospitalisation en psychiatrie' : 'Plusieurs hospitalisations en psychiatrie') + (texte('hospitDetail') ? ' : ' + texte('hospitDetail') : ''))
      : ligneTexte('Hospitalisations', 'hospitDetail'),
    pastilles('ssc').length ? (pastilles('ssc').includes('Jamais') ? 'Jamais de soins sans consentement.' : phrase('Soins sans consentement', 'ssc')) : '',
    ts ? point((ts === 'Aucune' ? 'Pas d’antécédent de tentative de suicide' : ts === 'Une' ? 'Une tentative de suicide' : 'Plusieurs tentatives de suicide') + (texte('tsDetail') ? ' : ' + texte('tsDetail') : ''))
      : ligneTexte('Tentatives de suicide', 'tsDetail'),
    automut ? point(automut === 'Aucune' ? 'Pas d’automutilation' : 'Automutilations ' + minusculeDebut(automut)) : '',
    ligneTexte('Diagnostics antérieurs', 'diagAnt'),
    ligneTexte('Traitements antérieurs', 'ttAnt'),
  ]);
  rubrique('Antécédents médicaux et chirurgicaux', [
    texte('atcdMed') ? point(texte('atcdMed')) : '',
    pastilles('allergie')[0] === 'Pas d’allergie connue' ? 'Pas d’allergie connue.'
      : (pastilles('allergie')[0] || texte('allergieDetail')) ? point('Allergie(s)' + (texte('allergieDetail') ? ' : ' + texte('allergieDetail') : '')) : '',
    ligneTexte('Contraception / grossesse', 'contraception'),
  ]);
  rubrique('Antécédents familiaux', [
    pastilles('atcdFam').length
      ? (pastilles('atcdFam').length === 1 && pastilles('atcdFam')[0] === 'Aucun connu'
          ? 'Pas d’antécédent psychiatrique familial connu.'
          : point('Antécédents familiaux de ' + enumerer(pastilles('atcdFam').filter(t => t !== 'Aucun connu').map(t => minusculeDebut(t)))))
      : '',
    texte('atcdFamDetail') ? point(texte('atcdFamDetail')) : '',
  ]);

  // Consommations
  const conso = (label, id, q) => {
    const x = pastilles(id)[0];
    if (!x && !texte(q)) return '';
    return point(`${label} : ${minusculeDebut(x || '')}${x && texte(q) ? ', ' : ''}${texte(q)}`);
  };
  rubrique('Consommations', [
    conso('Tabac', 'tabac', 'tabacQ'), conso('Alcool', 'alcool', 'alcoolQ'), conso('Cannabis', 'cannabis', 'cannabisQ'),
    ligneTexte('Autres', 'autresToxiques'),
  ]);

  rubrique('Traitement actuel', [texte('ttActuel') ? point(texte('ttActuel')) : '']);
  rubrique('Histoire de la maladie', [texte('histoire') ? point(texte('histoire')) : '']);

  // Examen psychiatrique et évaluation du risque : phrases rédigées (voir redigerExamen / redigerRisque).
  const examen = redigerExamen(pastilles, sexe);
  if (examen) { lignes.push('', 'EXAMEN PSYCHIATRIQUE', accorder(examen, sexe)); }
  const risque = redigerRisque(pastilles, sexe);
  if (risque) { lignes.push('', 'ÉVALUATION DU RISQUE', accorder(risque, sexe)); }

  rubrique('Examen somatique et paraclinique', [ligneTexte('Examen somatique', 'somatique'), ligneTexte('Examens complémentaires', 'paraclinique')]);

  rubrique('Conclusion', [
    texte('synthese') ? point(texte('synthese')) : '',
    ligneTexte('Hypothèse diagnostique', 'hypothese'),
    ligneTexte('Diagnostics différentiels / comorbidités', 'differentiel'),
  ]);
  rubrique('Conduite à tenir', [
    ...pastilles('conduite').map(t => '- ' + t),
    texte('conduiteDetail') ? point(texte('conduiteDetail')) : '',
    texte('prochainRdv') ? `Prochain rendez-vous le ${formaterDate(texte('prochainRdv'))}.` : '',
  ]);

  return lignes.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ---------------------------------------------------------------------
   RÉDACTION DE L'EXAMEN ET DE L'ÉVALUATION DU RISQUE
   Chaque pastille est transformée en groupe nominal ou en proposition,
   puis assemblée en phrases (« Elle se présente avec une tenue adaptée et
   une hygiène correcte. Le contact est de bonne qualité… »).
   --------------------------------------------------------------------- */
const GN = {                                   // pastille → groupe nominal avec article
  'Tenue adaptée': 'une tenue adaptée', 'Hygiène correcte': 'une hygiène correcte', 'Tenue négligée': 'une tenue négligée',
  'Incurie': 'une incurie', 'Tenue extravagante': 'une tenue extravagante', 'Amaigrissement visible': 'un amaigrissement visible',
  'Ralentissement psychomoteur': 'un ralentissement psychomoteur', 'Agitation psychomotrice': 'une agitation psychomotrice',
  'Tension interne': 'une tension interne', 'Clinophilie': 'une clinophilie', 'Signes catatoniques': 'des signes catatoniques',
  'Mouvements anormaux': 'des mouvements anormaux',
  'Irritabilité': 'une irritabilité', 'Labilité thymique': 'une labilité thymique', 'Anhédonie': 'une anhédonie', 'Aboulie': 'une aboulie',
  'Sentiment de culpabilité': 'un sentiment de culpabilité', 'Dévalorisation': 'une dévalorisation', 'Désespoir': 'un vécu de désespoir',
  'Émoussement affectif': 'un émoussement affectif', 'Discordance idéo-affective': 'une discordance idéo-affective',
  'Hyperesthésie affective': 'une hyperesthésie affective', 'Pleurs au cours de l’entretien': 'des pleurs au cours de l’entretien',
  'Anxiété flottante': 'une anxiété flottante', 'Attaques de panique': 'des attaques de panique', 'Ruminations anxieuses': 'des ruminations anxieuses',
  'Évitements phobiques': 'des évitements phobiques', 'Obsessions': 'des obsessions', 'Compulsions': 'des compulsions',
  'Latence des réponses': 'une latence des réponses', 'Néologismes': 'des néologismes',
  'Tachypsychie': 'une tachypsychie', 'Fuite des idées': 'une fuite des idées', 'Bradypsychie': 'une bradypsychie', 'Barrages': 'des barrages',
  'Relâchement des associations': 'un relâchement des associations',
  'Hallucinations acoustico-verbales': 'des hallucinations acoustico-verbales', 'Hallucinations visuelles': 'des hallucinations visuelles',
  'Hallucinations cénesthésiques': 'des hallucinations cénesthésiques', 'Hallucinations olfactives ou gustatives': 'des hallucinations olfactives ou gustatives',
  'Attitude d’écoute': 'une attitude d’écoute', 'Automatisme mental': 'un automatisme mental', 'Dépersonnalisation, déréalisation': 'un vécu de dépersonnalisation-déréalisation',
  'Insomnie d’endormissement': 'une insomnie d’endormissement', 'Réveils nocturnes': 'des réveils nocturnes', 'Réveil précoce': 'un réveil précoce',
  'Hypersomnie': 'une hypersomnie', 'Réduction du besoin de sommeil': 'une réduction du besoin de sommeil',
  'Perte d’appétit': 'une perte d’appétit', 'Hyperphagie': 'une hyperphagie', 'Perte de poids': 'une perte de poids', 'Prise de poids': 'une prise de poids',
  'Troubles de la libido': 'des troubles de la libido',
  'Plainte mnésique': 'une plainte mnésique', 'Troubles attentionnels': 'des troubles attentionnels',
  'Idées passives de mort': 'des idées passives de mort', 'Idées suicidaires actives': 'des idées suicidaires actives',
  'Scénario élaboré': 'un scénario élaboré', 'Moyens à disposition': 'des moyens à disposition', 'Date ou lieu envisagés': 'une date ou un lieu envisagés',
  'Préparatifs (lettre, dons…)': 'des préparatifs (lettre, dons…)',
  'Entourage soutenant': 'un entourage soutenant', 'Enfants à charge': 'des enfants à charge', 'Projets d’avenir': 'des projets d’avenir',
  'Convictions personnelles ou religieuses': 'des convictions personnelles ou religieuses', 'Alliance thérapeutique': 'une alliance thérapeutique de qualité',
  'Critique des idées suicidaires': 'une critique des idées suicidaires',
  'Antécédents de violence': 'des antécédents de violence', 'Menaces verbales': 'des menaces verbales', 'Idées hétéro-agressives': 'des idées hétéro-agressives',
  'Accès à une arme': 'un accès à une arme',
};
const gn = t => GN[t] || t.charAt(0).toLowerCase() + t.slice(1);
const et = liste => {
  if (liste.length < 2) return liste[0] || '';
  if (liste.some(t => / et /.test(t))) return liste.join(', ');            // évite « calme et coopérant et méfiant »
  return liste.slice(0, -1).join(', ') + ' et ' + liste[liste.length - 1];
};
const phraseFinie = t => (t ? t.charAt(0).toUpperCase() + t.slice(1).replace(/[\s.]+$/, '') + '.' : '');

function sujet(sexe) { return sexe === 'F' ? 'Elle' : sexe === 'M' ? 'Il' : 'Le patient'; }

function redigerExamen(pastilles, sexe) {
  const P = sujet(sexe);
  const a = id => pastilles(id);
  const sauf = (liste, ...exclus) => liste.filter(t => !exclus.includes(t));
  const phrases = [];

  // Présentation
  if (a('presentation').length) phrases.push(`${P} se présente avec ${et(a('presentation').map(gn))}.`);

  // Contact
  const contact = a('contact');
  if (contact.length) {
    const qualite = contact.includes('Contact de bonne qualité') ? 'de bonne qualité' : contact.includes('Contact fuyant') ? 'fuyant' : '';
    const attitudes = sauf(contact, 'Contact de bonne qualité', 'Contact fuyant').map(t => t.charAt(0).toLowerCase() + t.slice(1));
    const morceaux = [];
    if (qualite) morceaux.push('le contact est ' + qualite);
    if (attitudes.length) morceaux.push((qualite ? (sexe === 'F' ? 'elle' : sexe === 'M' ? 'il' : 'le patient') : P) + ' est ' + et(attitudes));
    phrases.push(phraseFinie(morceaux.join(', ')));
  }

  // Psychomotricité
  const psy = a('psychomot');
  if (psy.includes('Sans particularité')) phrases.push('Pas d’anomalie psychomotrice.');
  else if (psy.length) phrases.push(`On note ${et(psy.map(gn))}.`);

  // Humeur et affects
  const humeur = a('humeur');
  if (humeur.length) {
    const qualif = humeur.includes('Humeur neutre (euthymique)') ? 'neutre (euthymique)' : humeur.includes('Humeur triste') ? 'triste' : humeur.includes('Humeur expansive') ? 'expansive' : '';
    const autres = sauf(humeur, 'Humeur neutre (euthymique)', 'Humeur triste', 'Humeur expansive').map(gn);
    if (humeur.includes('Humeur triste') && humeur.includes('Humeur expansive')) phrases.push(`L’humeur est fluctuante, tantôt triste, tantôt expansive${autres.length ? ', avec ' + et(autres) : ''}.`);
    else if (qualif) phrases.push(`L’humeur est ${qualif}${autres.length ? ', avec ' + et(autres) : ''}.`);
    else phrases.push(`On retrouve ${et(autres)}.`);
  }
  const affects = a('affects');
  if (affects.includes('Affects adaptés et mobilisables')) phrases.push('Les affects sont adaptés et mobilisables.');
  else if (affects.length) phrases.push(`Sur le plan affectif, on note ${et(affects.map(gn))}.`);

  // Anxiété
  const anx = a('anxiete');
  if (anx.includes('Pas d’anxiété au premier plan')) phrases.push('L’anxiété n’est pas au premier plan.');
  else if (anx.length) phrases.push(`${P} décrit ${et(anx.map(gn))}.`);

  // Discours et cours de la pensée
  const disc = a('discours');
  if (disc.includes('Mutisme')) phrases.push(`${P} reste mutique durant l’entretien.`);
  const adjDisc = { 'Discours cohérent et informatif': 'cohérent et informatif', 'Logorrhée': 'logorrhéique', 'Discours pauvre': 'pauvre', 'Discours diffluent': 'diffluent' };
  const adjectifs = disc.filter(t => adjDisc[t]).map(t => adjDisc[t]);
  const avecDisc = disc.filter(t => !adjDisc[t] && t !== 'Mutisme').map(gn);
  const cours = a('cours');
  const coursFluide = cours.includes('Fluide');
  const coursAnomalies = sauf(cours, 'Fluide').map(gn);
  if (adjectifs.length || avecDisc.length) {
    let ph = adjectifs.length ? `Le discours est ${et(adjectifs)}` : 'Le discours est marqué par ' + et(avecDisc);
    if (adjectifs.length && avecDisc.length) ph += `, avec ${et(avecDisc)}`;
    if (coursFluide) ph += ', la pensée fluide';
    phrases.push(ph + '.');
  } else if (coursFluide) phrases.push('La pensée est fluide.');
  if (coursAnomalies.length) phrases.push(`Le cours de la pensée est marqué par ${et(coursAnomalies)}.`);

  // Contenu de la pensée
  const delire = a('delire');
  if (delire.length) {
    const themes = delire.filter(t => !['Absence d’idées délirantes', 'Idées obsédantes'].includes(t))
      .map(t => t.replace(/^Idées délirantes /, ''));
    if (themes.length) {
      let ph = `On retrouve des idées délirantes ${et(themes)}`;
      if (a('mecanismes').length) ph += `, à mécanisme ${et(a('mecanismes').map(t => t.toLowerCase()))}`;
      if (a('adhesion')[0]) ph += a('adhesion')[0] === 'Critique' ? ', critiquées par ' + (sexe === 'F' ? 'la patiente' : 'le patient') : `, avec une adhésion ${a('adhesion')[0].toLowerCase()}`;
      phrases.push(ph + '.');
    } else if (delire.includes('Absence d’idées délirantes')) phrases.push('Pas d’idée délirante retrouvée.');
    if (delire.includes('Idées obsédantes')) phrases.push('On note des idées obsédantes.');
  }

  // Perceptions
  const perc = a('perceptions');
  if (perc.includes('Absence d’hallucinations')) phrases.push('Pas d’élément hallucinatoire.');
  else if (perc.length) phrases.push(`Sur le plan perceptif, on retrouve ${et(perc.map(gn))}.`);

  // Conduites instinctuelles
  const inst = a('instinct');
  if (inst.length) {
    const sommeil = ['Insomnie d’endormissement', 'Réveils nocturnes', 'Réveil précoce', 'Hypersomnie', 'Réduction du besoin de sommeil'].filter(t => inst.includes(t));
    const appetit = ['Perte d’appétit', 'Hyperphagie', 'Perte de poids', 'Prise de poids'].filter(t => inst.includes(t));
    const sOk = inst.includes('Sommeil conservé'), aOk = inst.includes('Appétit conservé');
    if (sOk && aOk) phrases.push('Le sommeil et l’appétit sont conservés.');
    else {
      if (sommeil.length) phrases.push(`Sur le plan du sommeil, ${P.toLowerCase() === 'le patient' ? 'le patient' : (sexe === 'F' ? 'elle' : 'il')} rapporte ${et(sommeil.map(gn))}.`);
      else if (sOk) phrases.push('Le sommeil est conservé.');
      if (appetit.length) phrases.push(`Sur le plan alimentaire, on note ${et(appetit.map(gn))}.`);
      else if (aOk) phrases.push('L’appétit est conservé.');
    }
    if (inst.includes('Troubles de la libido')) phrases.push('On note des troubles de la libido.');
  }

  // Fonctions cognitives
  const cog = a('cognition');
  if (cog.length) {
    let ph = cog.includes('Confusion') ? `${P} présente un tableau confusionnel`
      : cog.includes('Désorientation temporo-spatiale') ? `${P} est désorienté(e) dans le temps et l’espace`
      : cog.includes('Orienté(e) dans le temps et l’espace') ? `${P} est orienté(e) dans le temps et l’espace` : '';
    const plaintes = ['Plainte mnésique', 'Troubles attentionnels'].filter(t => cog.includes(t)).map(gn);
    if (plaintes.length) ph = ph ? `${ph}, avec ${et(plaintes)}` : `On note ${et(plaintes)}`;
    else if (cog.includes('Pas de plainte cognitive')) ph = ph ? `${ph}, sans plainte cognitive` : 'Pas de plainte cognitive';
    phrases.push(phraseFinie(ph));
  }

  // Insight et jugement
  const ins = a('insight');
  if (ins.length) {
    const conscience = ins.includes('Bonne conscience des troubles') ? 'a une bonne conscience de ses troubles'
      : ins.includes('Conscience partielle des troubles') ? 'a une conscience partielle de ses troubles'
      : ins.includes('Absence de conscience des troubles') ? 'n’a pas conscience de ses troubles' : '';
    const soins = ins.includes('Demandeur(se) de soins') ? 'est demandeur(se) de soins'
      : ins.includes('Ambivalence vis-à-vis des soins') ? 'se montre ambivalent(e) vis-à-vis des soins'
      : ins.includes('Opposition aux soins') ? 's’oppose aux soins' : '';
    // « mais » quand conscience des troubles et rapport aux soins vont en sens inverse.
    const consciencePositive = ins.includes('Bonne conscience des troubles');
    const soinsPositifs = ins.includes('Demandeur(se) de soins');
    const contraste = conscience && soins && consciencePositive !== soinsPositifs;
    phrases.push(`${P} ${contraste ? `${conscience} mais ${soins}` : et([conscience, soins].filter(Boolean))}.`);
  }
  const jug = a('jugement')[0];
  if (jug) phrases.push(`Le jugement est ${jug.toLowerCase()}.`);

  return phrases.filter(Boolean).join(' ');
}

function redigerRisque(pastilles, sexe) {
  const P = sujet(sexe);
  const phrases = [];
  const sui = pastilles('suicide');
  if (sui.includes('Absence d’idées suicidaires')) phrases.push(`${P} ne rapporte pas d’idée suicidaire.`);
  const idees = ['Idées passives de mort', 'Idées suicidaires actives'].filter(t => sui.includes(t)).map(gn);
  const elements = ['Scénario élaboré', 'Moyens à disposition', 'Date ou lieu envisagés', 'Préparatifs (lettre, dons…)'].filter(t => sui.includes(t)).map(gn);
  if (idees.length) phrases.push(`${P} rapporte ${et(idees)}${elements.length ? ', avec ' + et(elements) : ''}.`);
  else if (elements.length) phrases.push(`On retrouve ${et(elements)}.`);
  if (sui.includes('Passage à l’acte récent')) phrases.push('Notion de passage à l’acte suicidaire récent.');

  const prot = pastilles('facteursProtection');
  if (prot.length) phrases.push(`On retrouve comme facteur${prot.length > 1 ? 's' : ''} de protection ${et(prot.map(gn))}.`);

  const r = pastilles('risque')[0], u = pastilles('urgence')[0], d = pastilles('dangerosite')[0];
  if (r || u || d) {
    const base = x => ({ faible: 'faible', moyen: 'moyen', moyenne: 'moyen', 'élevé': 'élevé', 'élevée': 'élevé' })[x.toLowerCase()];
    const pluriel = { faible: 'faibles', moyen: 'moyens', 'élevé': 'élevés' };
    const presents = [r, u, d].filter(Boolean);
    if (r && u && presents.length >= 2 && new Set(presents.map(base)).size === 1) {
      phrases.push(`Le risque${d ? ', l’urgence et la dangerosité' : ' et l’urgence'} suicidaires sont évalués ${pluriel[base(r)]}.`);
    } else {
      const suite = [];
      if (u) suite.push(`une urgence ${u.toLowerCase()}`);
      if (d) suite.push(`une dangerosité ${d.toLowerCase()}`);
      phrases.push(r ? `Le risque suicidaire est évalué ${r.toLowerCase()}${suite.length ? ', avec ' + et(suite) : ''}.`
                     : phraseFinie('On retient ' + et(suite)));
    }
  }

  const het = pastilles('hetero');
  if (het.includes('Pas d’élément en faveur d’un risque hétéro-agressif')) phrases.push('Pas d’élément en faveur d’un risque hétéro-agressif.');
  else if (het.length) phrases.push(`Sur le plan hétéro-agressif, on note ${et(het.map(gn))}.`);
  return phrases.join(' ');
}

function genererNoteSuivi() {
  const p = patientObs();
  const sexe = p ? p.sexe : '';
  const P = sujet(sexe);
  const pastilles = id => (champObsVisible(id) && Array.isArray(obsEtat[id]) ? obsEtat[id] : []);
  const texte = id => (champObsVisible(id) && typeof obsEtat[id] === 'string' ? obsEtat[id].trim() : '');
  const date = $('obsDate').value || aujourdhuiIso();
  const lignes = [`NOTE DE SUIVI DU ${formaterDate(date)}`];
  if (p) lignes.push(`${[sexe === 'F' ? 'Mme' : sexe === 'M' ? 'M.' : '', nomPatient(p)].filter(Boolean).join(' ')}${p.ddn ? ', ' + calculerAge(p.ddn) + ' ans' : ''}${p.dp ? ' · ' + p.dp : ''}.`);

  // Évolution et contexte
  const debut = [];
  const cadre = pastilles('cadreSuivi')[0];
  if (cadre) debut.push(cadre + (texte('accompagne') ? ', accompagné(e) de ' + texte('accompagne') : '') + '.');
  const evo = pastilles('evolution')[0];
  const evolutions = { 'Amélioration': 'Depuis la dernière consultation, l’évolution est favorable.', 'Stabilité': 'L’état clinique est stable depuis la dernière consultation.',
                       'Aggravation': 'On note une aggravation clinique depuis la dernière consultation.', 'Rechute': 'Le tableau est celui d’une rechute.' };
  if (evo) debut.push(evolutions[evo]);
  if (texte('evenements')) debut.push(point(texte('evenements')));
  if (texte('plainte')) debut.push('Demande du jour : ' + point(texte('plainte').charAt(0).toLowerCase() + texte('plainte').slice(1)));
  if (debut.length) lignes.push('', 'ÉVOLUTION', accorder(debut.join(' '), sexe));

  // Traitement
  const tt = [];
  if (texte('ttActuel')) tt.push('Traitement en cours : ' + point(texte('ttActuel')));
  const obs = pastilles('observance')[0];
  const observances = { 'Bonne observance': 'Bonne observance rapportée.', 'Observance partielle': 'Observance partielle.', 'Non-observance': 'Non-observance du traitement.', 'Arrêt du traitement par le patient': `${P} a arrêté son traitement.` };
  if (obs) tt.push(observances[obs]);
  const tol = pastilles('tolerance');
  if (tol.includes('Bonne tolérance')) tt.push('Bonne tolérance.');
  const effets = tol.filter(t => t !== 'Bonne tolérance').map(t => ({ 'Sédation': 'une sédation', 'Prise de poids': 'une prise de poids', 'Effets extrapyramidaux': 'des effets extrapyramidaux', 'Akathisie': 'une akathisie', 'Troubles sexuels': 'des troubles sexuels', 'Troubles digestifs': 'des troubles digestifs', 'Autres effets indésirables': 'd’autres effets indésirables' })[t]);
  if (effets.length) tt.push(`Sur le plan de la tolérance, on note ${et(effets)}${texte('toleranceDetail') ? ' (' + texte('toleranceDetail') + ')' : ''}.`);
  const conso = pastilles('consoSuivi')[0];
  const consos = { 'Pas de consommation': 'Pas de consommation de toxiques.', 'Consommations stables': 'Consommations stables', 'Diminution': 'Diminution des consommations', 'Augmentation': 'Augmentation des consommations', 'Reprise': 'Reprise des consommations' };
  if (conso) tt.push(conso === 'Pas de consommation' ? consos[conso] : point(consos[conso] + (texte('consoSuiviDetail') ? ' : ' + texte('consoSuiviDetail') : '')));
  if (tt.length) lignes.push('', 'TRAITEMENT', accorder(tt.join(' '), sexe));

  const examen = redigerExamen(pastilles, sexe);
  if (examen) lignes.push('', 'EXAMEN PSYCHIATRIQUE', accorder(examen, sexe));
  const risque = redigerRisque(pastilles, sexe);
  if (risque) lignes.push('', 'ÉVALUATION DU RISQUE', accorder(risque, sexe));

  const fin = [];
  if (texte('synthese')) fin.push(point(texte('synthese')));
  if (pastilles('conduite').length) fin.push(...pastilles('conduite').map(t => '- ' + t));
  if (texte('conduiteDetail')) fin.push(point(texte('conduiteDetail')));
  if (texte('prochainRdv')) fin.push(`Prochain rendez-vous le ${formaterDate(texte('prochainRdv'))}.`);
  if (fin.length) lignes.push('', 'CONDUITE À TENIR', ...fin.map(t => accorder(t, sexe)));
  return lignes.join('\n').trim();
}

function majObservation() {
  majVisibiliteObs();
  if (!obsTexteModifie) $('obsTexte').value = genererObservation();
  else if (!majObservation.prevenu) { majObservation.prevenu = true; signaler(null, 'Texte retouché à la main : « Régénérer » pour reprendre le formulaire.'); }
}


/* ---------------------------------------------------------------------
   4. ENREGISTREMENT, HISTORIQUE, IMPRESSION
   --------------------------------------------------------------------- */
function enregistrerObservation() {
  const p = patientObs();
  if (!p) return signaler($('obsMsg'), 'Choisissez un patient pour enregistrer (ou copiez le texte).');
  p.obs = p.obs || [];
  const donnees = { type: obsType, date: $('obsDate').value || aujourdhuiIso(), etat: JSON.parse(JSON.stringify(obsEtat)), texte: $('obsTexte').value };
  const existante = obsEditionId && p.obs.find(o => o.id === obsEditionId);
  if (existante) Object.assign(existante, donnees);
  else {
    obsEditionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    p.obs.push({ id: obsEditionId, ...donnees });
  }
  // Report de quelques éléments dans la fiche, seulement s'ils y sont vides.
  if (!p.dp && obsEtat.hypothese) p.dp = obsEtat.hypothese;
  if (!p.prochain && obsEtat.prochainRdv) p.prochain = obsEtat.prochainRdv;
  sauvegarderPatients();
  supprimerBrouillonObs();
  afficherHistoriqueObs();
  signaler($('obsMsg'), existante ? 'Note mise à jour dans la fiche.' : 'Note enregistrée dans la fiche.');
}

function afficherHistoriqueObs() {
  const p = patientObs();
  if (!p) { $('obsHistorique').innerHTML = ''; return; }
  const liste = [...(p.obs || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  $('obsHistorique').innerHTML = liste.length
    ? '<div class="sec" style="margin-bottom:4px">Notes enregistrées</div>' + liste.map(o => `
      <div class="obs-hist"><span>${formaterDate(o.date)} · ${o.type === 'suivi' ? 'note de suivi' : 'première observation'}${o.id === obsEditionId ? ' <b>(en cours)</b>' : ''}</span>
        <span><button type="button" data-action="ouvrir" data-id="${o.id}">Rouvrir</button>
        <button type="button" class="danger" data-action="supprimer" data-id="${o.id}">Supprimer</button></span></div>`).join('')
    : '';
}

function imprimerObservation() {
  const p = patientObs();
  const pr = praticien || {};
  const nomMedecin = [pr.titre || 'Dr', pr.prenom, (pr.nom || '').toUpperCase()].filter(Boolean).join(' ');
  imprimerDocument(`<div class="ordo doc">
    ${enteteImpression()}
    <div style="white-space:pre-wrap">${echapper($('obsTexte').value)}</div>
  </div>`, 'observation');
}
