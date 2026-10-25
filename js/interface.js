/* =====================================================================
   INTERFACE.JS — affichage du tableau, fiche patient, boutons
   ---------------------------------------------------------------------
   Découpage du fichier :
     A. État de l'interface
     B. Listes déroulantes et onglets
     C. Tableau principal (vues : liste, par CMP, bilans à faire)
     D. Compteurs
     E. Éditeur de traitements (dans la fiche patient)
     F. Fiche patient (ouvrir, enregistrer, supprimer)
     G. Boutons et événements
     H. Démarrage
   Rien à régler ici : les réglages sont dans config.js.

   Deux modes (onglets) :
     'active'  Suivi de la file active : tous les patients.
     'relais'  Gestion des relais CMP : seulement les patients « à relayer ».
   ===================================================================== */


/* ---------------------------------------------------------------------
   A. ÉTAT DE L'INTERFACE
   --------------------------------------------------------------------- */
let onglet = 'accueil';            // onglet affiché : 'active', 'relais', 'observation', 'humeur', 'echelles' ou 'mdph'
let triColonne = 'nom';           // colonne de tri actuelle
let triSens = 1;                  // 1 = croissant, -1 = décroissant
let fichePatientId = null;        // id de la fiche ouverte (null = nouveau patient)
let traitementsEnEdition = [];    // copie de travail des traitements de la fiche ouverte

const enRelais = () => onglet === 'relais';

/** Profil (sexe, âge) du patient de la fiche ouverte, lu dans le formulaire : sert à adapter
 *  les bilans affichés dans la fiche, même avant l'enregistrement. */
function contexteFormulaire(traitement) {
  const ddn = $('ddn').value;
  return {
    sexe: $('sexe').value,
    age: ddn ? calculerAge(ddn) : null,
    forcerProcreation: !!(traitement && traitement.fap),
  };
}

// Champs texte de la fiche : chaque id de champ = propriété enregistrée.
const CHAMPS_FICHE = [
  'nom', 'prenom', 'ddn', 'sexe', 'dossier', 'aldTexte', 'allergies', 'dp', 'ds', 'synthese', 'vigtxt',
  'rythme', 'prochain', 'tel', 'notes', 'priorite', 'statut', 'cmp',
];


/* ---------------------------------------------------------------------
   B. LISTES DÉROULANTES ET ONGLETS
   --------------------------------------------------------------------- */

/** Remplit les listes qui dépendent des statuts / rythmes (modifiables). */
function remplirListesModifiables() {
  remplirSelect($('statut'), statuts.map(s => [s, s]));
  remplirSelect($('rythme'), rythmes.map(r => [r, r]));

  const filtreActuel = $('filtreStatut').value;               // on garde la sélection en cours
  remplirSelect($('filtreStatut'), statuts.map(s => [s, s]), 'Tous statuts');
  $('filtreStatut').value = filtreActuel;
}

/** Remplit les listes fixes (priorités) et les suggestions (médicaments, CIM-10). */
function remplirListesFixes() {
  remplirSelect(
    $('priorite'),
    Object.entries(PRIORITES).map(([numero, p]) => [numero, `${p.libelle} – ${p.aide}`])
  );
  remplirSelect(
    $('filtrePriorite'),
    Object.entries(PRIORITES).map(([numero, p]) => [numero, p.libelle]),
    'Toutes priorités'
  );
  $('listeMolecules').innerHTML = MEDICAMENTS_SUGGERES.map(m => `<option value="${echapper(m)}">`).join('');
  $('listeCim').innerHTML = DIAGNOSTICS_CIM10.map(d => `<option value="${echapper(d)}">`).join('');
}

// Onglets du portail : [valeur, bouton, section affichée].
// Ordre = ordre affiché dans la navigation (et raccourcis Alt+1 … Alt+9).
const ONGLETS = [
  ['accueil', 'ongletAccueil', 'vueAccueil'],
  ['consultation', 'ongletConsultation', 'vueConsultation'],
  ['observation', 'ongletObservation', 'vueObservation'],
  ['echelles', 'ongletEchelles', 'vueEchelles'],
  ['humeur', 'ongletHumeur', 'vueHumeur'],
  ['documents', 'ongletDocuments', 'vueDocuments'],
  ['mdph', 'ongletMdph', 'vueMdph'],
  ['active', 'ongletActive', 'vuePatients'],
  ['relais', 'ongletRelais', 'vuePatients'],
];
const ongletPatients = () => onglet === 'active' || onglet === 'relais';

/** Met à jour l'apparence des onglets, les filtres propres aux relais et les vues proposées. */
function afficherOnglets() {
  ONGLETS.forEach(([valeur, bouton]) => $(bouton).setAttribute('aria-selected', String(onglet === valeur)));
  const sectionVisible = (ONGLETS.find(([valeur]) => valeur === onglet) || ONGLETS[0])[2];
  ['vuePatients', 'vueObservation', 'vueHumeur', 'vueEchelles', 'vueMdph', 'vueConsultation', 'vueDocuments', 'vueAccueil'].forEach(id => { $(id).hidden = id !== sectionVisible; });

  // Filtres « priorité » et « statut du relais » : uniquement dans l'onglet relais.
  document.querySelectorAll('.relais-seul').forEach(element => { element.hidden = !enRelais(); });

  // Vues proposées : « Par CMP » n'existe que dans l'onglet relais.
  const vueActuelle = $('vue').value;
  const vues = [['liste', 'Vue liste']];
  if (enRelais()) vues.push(['cmp', 'Vue par CMP']);
  vues.push(['bilans', 'Bilans à faire']);
  remplirSelect($('vue'), vues);
  $('vue').value = vues.some(([valeur]) => valeur === vueActuelle) ? vueActuelle : 'liste';
}

/** Change d'onglet (et mémorise le choix). idPatient : patient à ouvrir dans un module (facultatif). */
function changerOnglet(nouvelOnglet, idPatient) {
  onglet = nouvelOnglet;
  try { localStorage.setItem(CLE_ONGLET, onglet); } catch (erreur) { /* ignoré */ }
  afficherOnglets();
  if (ongletPatients()) {
    triColonne = enRelais() ? 'priorite' : 'nom';
    triSens = 1;
    afficherTableau();
  } else {
    afficherModule(idPatient);
  }
}

/** Affiche le module de l'onglet courant (observation, courbe, échelles, MDPH). */
function afficherModule(idPatient) {
  // Sans patient précisé, les modules reprennent le patient ouvert dans l'écran Consultation.
  if (idPatient === undefined && typeof consPatientId !== 'undefined' && consPatientId) idPatient = consPatientId;
  if (onglet === 'observation') afficherVueObservation(idPatient);
  if (onglet === 'humeur') afficherVueHumeur(idPatient);
  if (onglet === 'echelles') afficherVueEchelles(idPatient);
  if (onglet === 'mdph') afficherVueMdph(idPatient);
  if (onglet === 'consultation') afficherVueConsultation(idPatient);
  if (onglet === 'documents') afficherVueDocuments(idPatient);
  if (onglet === 'accueil') afficherAccueil();
  synchroniserPatientCourant();
}

/** Résumé, dans la fiche, des échelles, observations et jours de courbe enregistrés. */
function afficherResumeModulesFiche(patient) {
  if (!patient || !patient.id) { $('zoneScoresFiche').innerHTML = 'Enregistrez la fiche pour coter des échelles, rédiger une observation ou tenir une courbe de l’humeur.'; return; }
  const scores = derniersScores(patient);
  const nbObs = (patient.obs || []).length;
  const nbJours = patient.humeur && patient.humeur.mood ? Object.keys(patient.humeur.mood).length : 0;
  const morceaux = [];
  if (scores.length) morceaux.push(scores.map(s => echapper(texteScore(s))).join('<br>'));
  const autres = [
    nbObs ? `${nbObs} observation(s) enregistrée(s)` : '',
    nbJours ? `courbe de l’humeur : ${nbJours} jour(s) saisi(s)` : '',
    patient.mdph2 ? `certificat MDPH en cours (${formaterDate((patient.mdph2.maj || '').slice(0, 10))})` : '',
  ].filter(Boolean);
  if (autres.length) morceaux.push(autres.join(' · '));
  $('zoneScoresFiche').innerHTML = morceaux.join('<br>') || 'Aucune échelle cotée.';
}


/* ---------------------------------------------------------------------
   C. TABLEAU PRINCIPAL
   --------------------------------------------------------------------- */

/** Colonnes du tableau selon l'onglet et la vue : [propriété de tri (0 = non triable), titre]. */
function definirColonnes() {
  const vue = $('vue').value;

  if (vue === 'bilans') {
    const colonnes = [
      [0, 'Retard'], [0, 'Patient'], [0, 'Traitement'], [0, 'Bilan à faire'],
      [0, 'Échéance'], [0, 'Dernier bilan'],
    ];
    if (enRelais()) colonnes.push([0, 'Priorité']);
    return colonnes;
  }

  if (enRelais()) {
    return [
      ['priorite', 'Priorité'], ['nom', 'Patient'], ['dp', 'Diagnostics'], [0, 'Synthèse clinique'],
      ['rythme', 'Suivi actuel'], [0, 'Traitements et bilans'], ['statut', 'Relais'],
    ];
  }

  return [
    ['nom', 'Patient'], ['dp', 'Diagnostics'], [0, 'Synthèse clinique'],
    ['rythme', 'Suivi actuel'], [0, 'Traitements et bilans'], [0, 'Relais'],
  ];
}

function afficherEntete() {
  $('enteteTableau').innerHTML = '<tr>' + definirColonnes()
    .map(([propriete, titre]) => `<th${propriete ? ` data-tri="${propriete}"` : ''}>${titre}</th>`)
    .join('') + '</tr>';
}

/** Patients de l'onglet courant, après application de la recherche et des filtres. */
function patientsFiltres() {
  const recherche = $('recherche').value.toLowerCase();
  const priorite = enRelais() ? $('filtrePriorite').value : '';
  const statut = enRelais() ? $('filtreStatut').value : '';
  const seulementRetard = $('filtreBilans').value;
  const base = enRelais() ? patients.filter(estARelayer) : patients;

  return base.filter(p => {
    if (priorite && p.priorite != priorite) return false;
    if (statut && p.statut !== statut) return false;
    if (seulementRetard && !listerAlertes(p).some(a => a.statut === 'retard')) return false;

    if (recherche) {
      const texte = [p.nom, p.prenom, p.dossier, p.dp, p.ds, p.synthese, p.cmp].join(' ').toLowerCase();
      if (!texte.includes(recherche)) return false;
    }
    return true;
  });
}

/** Tri : colonne choisie, puis vigilance d'abord, puis ordre alphabétique. */
function trierPatients(liste) {
  liste.sort((a, b) => {
    const x = a[triColonne] ?? '';
    const y = b[triColonne] ?? '';
    const comparaison = triColonne === 'priorite' ? x - y : String(x).localeCompare(String(y), 'fr');
    const resultat = comparaison || (b.vigilance - a.vigilance) || a.nom.localeCompare(b.nom, 'fr');
    return resultat * triSens;
  });
}

/** Colonne « Traitements et bilans » : noms par groupe + marqueur de retard. */
function htmlResumeTraitements(patient) {
  const traitements = patient.trt || [];
  if (!traitements.length) return '<span class="sec">—</span>';

  const alertes = listerAlertes(patient);

  const lignesDuGroupe = groupe => traitements
    .filter(t => t.g === groupe && !t.fin)
    .map(t => {
      const enRetard = alertes.some(a => a.traitement === t && a.statut === 'retard');
      return `<div>${echapper(t.nom)}`
        + (t.dose ? ` <span class="sec">${echapper(t.dose)}</span>` : '')
        + (enRetard ? ' <span class="texte-retard">⏰ bilan en retard</span>' : '')
        + '</div>';
    })
    .join('');

  const fond = lignesDuGroupe('fond');
  const symptomatique = lignesDuGroupe('symp');
  const somatique = lignesDuGroupe('somat');

  return (fond ? '<div class="sec">Fond</div>' + fond : '')
       + (symptomatique ? '<div class="sec">Symptomatique</div>' + symptomatique : '')
       + (somatique ? '<div class="sec">Non psychiatrique</div>' + somatique : '')
       || '<span class="sec">—</span>';
}

/** Une ligne du tableau (vues « liste » et « par CMP »). Les colonnes dépendent de l'onglet. */
function htmlLignePatient(p) {
  const synthese = p.synthese || '';
  const syntheseCourte = synthese.slice(0, LONGUEUR_SYNTHESE_TABLEAU) + (synthese.length > LONGUEUR_SYNTHESE_TABLEAU ? '…' : '');
  const pastillePriorite = `<span class="tag t${p.priorite}">${libellePriorite(p)}</span>`;

  const cellulePriorite = `<td>${pastillePriorite}</td>`;

  const cellulePatient = `
      <td>
        <b>${echapper(p.nom.toUpperCase())}</b> ${echapper(p.prenom)}${p.ald ? ' <span class="tag t4">ALD</span>' : ''}
        <div class="sec">
          ${[libelleSexe(p.sexe), p.ddn ? formaterDate(p.ddn) + ' · ' + calculerAge(p.ddn) + ' ans' : ''].filter(Boolean).join(' · ')}
          ${p.dossier ? '<br>N° ' + echapper(p.dossier) : ''}
        </div>
        ${p.vigilance ? '<div class="vig">⚠ Vigilance</div>' : ''}
      </td>`;

  const celluleDiagnostics = `
      <td>
        ${echapper(p.dp) || '<span class="sec">—</span>'}
        ${p.ds ? `<div class="sec">+ ${echapper(p.ds)}</div>` : ''}
      </td>`;

  const celluleSynthese = `
      <td class="syn">
        ${echapper(syntheseCourte)}
        ${p.vigilance && p.vigtxt ? `<div class="vig">${echapper(p.vigtxt)}</div>` : ''}
      </td>`;

  const celluleSuivi = `
      <td>
        ${echapper(p.rythme)}
        <div class="sec">${p.prochain ? 'Consult. ' + formaterDate(p.prochain) : ''}</div>
      </td>`;

  const celluleTraitements = `<td>${htmlResumeTraitements(p)}</td>`;

  // Colonne « Relais » : dans l'onglet relais, statut + CMP ; dans la file active,
  // rappel discret (priorité + statut) ou « Non concerné ».
  let celluleRelais;
  if (enRelais()) {
    const clos = statuts.indexOf(p.statut) === statuts.length - 2;
    celluleRelais = `
      <td class="st ${clos ? 'clos' : ''}">
        ${echapper(p.statut)}
        ${p.cmp ? `<div class="sec">${echapper(p.cmp)}</div>` : ''}
      </td>`;
  } else if (estARelayer(p)) {
    celluleRelais = `<td class="st">${pastillePriorite}<div class="sec">${echapper(p.statut)}${p.cmp ? ' · ' + echapper(p.cmp) : ''}</div></td>`;
  } else {
    celluleRelais = '<td class="st"><span class="sec">Non concerné</span></td>';
  }

  const cellules = enRelais()
    ? [cellulePriorite, cellulePatient, celluleDiagnostics, celluleSynthese, celluleSuivi, celluleTraitements, celluleRelais]
    : [cellulePatient, celluleDiagnostics, celluleSynthese, celluleSuivi, celluleTraitements, celluleRelais];

  return `<tr data-id="${p.id}" tabindex="0">${cellules.join('')}</tr>`;
}

/** Vue « Par CMP » (onglet relais) : patients regroupés par CMP receveur. */
function htmlVueParCmp(liste) {
  const groupes = {};
  liste.forEach(p => {
    const cle = p.cmp || LIBELLE_SANS_CMP;
    (groupes[cle] = groupes[cle] || []).push(p);
  });

  return Object.keys(groupes)
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map(cmp => {
      const membres = groupes[cmp];
      const clos = membres.filter(p => estClos(p.statut)).length;
      const urgents = membres.filter(p => p.priorite == 1 && !estClos(p.statut)).length;
      const titre = `${echapper(cmp)} : ${membres.length} patient(s), ${membres.length - clos} à relayer`
                  + (urgents ? `, dont ${urgents} urgent(s)` : '');
      return `<tr class="grp"><td colspan="${definirColonnes().length}">${titre}</td></tr>` + membres.map(htmlLignePatient).join('');
    })
    .join('');
}

/** Vue « Bilans à faire » : toutes les alertes, de la plus ancienne à la plus récente. */
function htmlVueBilans(liste) {
  const nbColonnes = definirColonnes().length;
  const alertes = [];
  liste.forEach(p => listerAlertes(p).forEach(a => alertes.push({ patient: p, ...a })));
  alertes.sort((a, b) => (a.echeance || 0) - (b.echeance || 0));

  if (!alertes.length) {
    return `<tr><td colspan="${nbColonnes}" class="sec">Aucun bilan en retard ni à échéance sous ${SEUIL_BIENTOT_JOURS} jours.</td></tr>`;
  }

  return alertes.map(a => `
    <tr data-id="${a.patient.id}" tabindex="0">
      <td>${a.statut === 'retard'
            ? `<span class="texte-retard">⏰ ${a.joursRetard} j de retard</span>`
            : '<span class="texte-bientot">Bientôt</span>'}</td>
      <td>
        <b>${echapper(a.patient.nom.toUpperCase())}</b> ${echapper(a.patient.prenom)}
        <div class="sec">${a.patient.dossier ? 'N° ' + echapper(a.patient.dossier) : ''}</div>
      </td>
      <td>
        ${echapper(a.traitement.nom)}
        <div class="sec">${echapper(a.traitement.dose || '')} ${({ fond: '(fond)', symp: '(symptomatique)', somat: '(non psychiatrique)' })[a.traitement.g] || ''}</div>
      </td>
      <td>${echapper(a.libelle)}</td>
      <td>${a.echeance ? formaterDate(versIso(a.echeance)) : '—'}</td>
      <td>${a.dernier ? formaterDate(versIso(a.dernier)) : 'non noté'}</td>
      ${enRelais() ? `<td><span class="tag t${a.patient.priorite}">${libellePriorite(a.patient)}</span></td>` : ''}
    </tr>`).join('');
}

/** Redessine tout le tableau (appelé après chaque changement). */
function afficherTableau() {
  // Suggestions de CMP déjà saisis (évite les doublons de graphie).
  const cmpConnus = [...new Set(patients.map(p => p.cmp).filter(Boolean))];
  $('listeCmp').innerHTML = cmpConnus.map(c => `<option value="${echapper(c)}">`).join('');

  afficherEntete();

  const liste = patientsFiltres();
  trierPatients(liste);

  const vue = $('vue').value;
  if (vue === 'bilans')                  $('lignesTableau').innerHTML = htmlVueBilans(liste);
  else if (vue === 'cmp' && enRelais())  $('lignesTableau').innerHTML = htmlVueParCmp(liste);
  else                                   $('lignesTableau').innerHTML = liste.map(htmlLignePatient).join('');

  $('messageVide').hidden = liste.length > 0;
  $('messageVide').textContent = enRelais()
    ? 'Aucun patient à relayer. Cochez « Patient à relayer vers un CMP » dans une fiche.'
    : 'Aucun patient. Cliquez sur « Nouveau patient » pour commencer.';
  afficherStatistiques();
  if ($('nbAccueil')) $('nbAccueil').textContent = compteurAccueil() || '';
}


/* ---------------------------------------------------------------------
   D. COMPTEURS (propres à chaque onglet)
   --------------------------------------------------------------------- */
function afficherStatistiques() {
  const aRelayer = patients.filter(estARelayer);
  $('nbActive').textContent = patients.length;
  $('nbRelais').textContent = aRelayer.length;

  const compterAlertes = (liste, statut) =>
    liste.reduce((somme, p) => somme + listerAlertes(p).filter(a => a.statut === statut).length, 0);

  let compteurs;
  if (enRelais()) {
    const total = aRelayer.length;
    const clos = aRelayer.filter(p => estClos(p.statut)).length;
    const urgents = aRelayer.filter(p => p.priorite == 1 && !estClos(p.statut)).length;
    compteurs = [
      [total,                                      'à relayer'],
      [total - clos,                               'relais restants'],
      [urgents,                                    'urgents non relayés'],
      [clos,                                       'relais clos'],
      [total ? Math.round(clos / total * 100) + ' %' : '—', 'avancement'],
      [compterAlertes(aRelayer, 'retard'),         'bilans en retard'],
    ];
  } else {
    const surveilles = patients.filter(p => (p.trt || []).some(t => trouverRegle(t.nom) && !t.fin)).length;
    compteurs = [
      [patients.length,                            'patients suivis'],
      [aRelayer.length,                            'à relayer'],
      [surveilles,                                 'sous traitement surveillé'],
      [compterAlertes(patients, 'retard'),         'bilans en retard'],
      [compterAlertes(patients, 'bientot'),        `bilans à venir (${SEUIL_BIENTOT_JOURS} j)`],
    ];
  }

  $('statistiques').innerHTML = compteurs
    .map(([valeur, titre]) => `<div class="stat"><b>${valeur}</b><span>${titre}</span></div>`)
    .join('');
}


/* ---------------------------------------------------------------------
   E. ÉDITEUR DE TRAITEMENTS (dans la fiche patient)
   --------------------------------------------------------------------- */

/** Attributs HTML « data-champ + valeur » d'un champ de traitement. */
const attributsChamp = (champ, valeur) => `data-champ="${champ}" value="${echapper(valeur || '')}"`;

/** Carte d'un traitement : champs de saisie + bilans de surveillance (adaptés au sexe du patient). */
function htmlCarteTraitement(traitement, index) {
  const regle = trouverRegle(traitement.nom);
  const ctx = contexteFormulaire(traitement);
  const etats = calculerEcheances(traitement, ctx);
  const ancien = !!traitement.ancien;

  // Traitement ancien : dispense des bilans initiaux, suivi repris à une date donnée.
  const htmlAncien = regle
    ? `<div class="full chk">
         <input type="checkbox" data-champ="ancien" id="anc${index}" ${ancien ? 'checked' : ''}>
         <label for="anc${index}"><b>Traitement ancien / suivi repris</b> : ne pas exiger les bilans initiaux, reprendre le suivi à la date indiquée</label>
       </div>
       ${ancien ? `<div><label>Suivi repris le</label><input type="date" ${attributsChamp('reprise', traitement.reprise)}></div>` : ''}`
    : '';

  // Bloc de surveillance (uniquement si le médicament est reconnu).
  let htmlSurveillance = '';
  if (regle) {
    // Détail d'un bilan : examens de biologie (adaptés au patient) + éléments à voir en consultation.
    const detail = (examens, autres) => {
      const biologie = listeExamens(examens, ctx).map(x => x.texte);
      return [
        biologie.length ? 'Biologie : ' + biologie.join(', ') : '',
        (autres || []).length ? 'En consultation : ' + autres.join(', ') : '',
      ].filter(Boolean).join(' · ');
    };

    const lignesBilans = etats.map(etat => {
      const precision = detail(etat.bilan.examens, etat.bilan.autres);
      return `
      <div class="mr">
        <span>${echapper(etat.libelle)}${precision ? `<small>${echapper(precision)}</small>` : ''}</span>
        <input type="date" data-bilan="${etat.bilan.id}" value="${echapper((traitement.bil || {})[etat.bilan.id] || '')}">
        <span class="badge ${etat.statut}">${texteEtatBilan(etat)}</span>
        <button type="button" data-aujourdhui="${etat.bilan.id}">Fait aujourd’hui</button>
      </div>`;
    }).join('');

    // État du bilan pré-thérapeutique : réalisé / non exigé (ancien) / non documenté.
    let classePre = 'retard', textePre = '⏰ Non documenté';
    if (traitement.pre)  { classePre = 'ok';      textePre = 'Réalisé'; }
    else if (ancien)     { classePre = 'termine'; textePre = 'Non exigé (traitement ancien)'; }

    // Message d'aide selon la situation.
    let aide = '';
    if (!traitement.intro && !ancien) {
      aide = 'Renseignez la date d’introduction, ou cochez « traitement ancien » si elle est inconnue ou lointaine.';
    } else if (ancien && !traitement.intro) {
      const prudence = regle.bilans.some(b => b.ensuiteSansDateIntro !== undefined);
      aide = 'Date d’introduction inconnue : seul le suivi d’entretien est calculé, à partir du dernier bilan connu ou de la date de reprise.'
           + (prudence ? ' Par prudence, la fréquence maximale est appliquée tant que la date d’introduction n’est pas renseignée.' : '');
    } else {
      aide = '« Dernier fait le » = date du dernier bilan réalisé.';
    }

    // Avertissement si le sexe manque alors que des examens en dépendent.
    const avertissementSexe = (regleDependDuSexe(regle) && !ctx.sexe)
      ? '<div class="texte-bientot">⚠ Sexe du patient non renseigné (en haut de la fiche) : les éléments qui en dépendent (β-hCG, prolactinémie, valproate…) sont proposés « sous réserve ».</div>'
      : '';
    const remarques = remarquesPatient(regle, ctx).map(t => `<div class="sec">${echapper(t)}</div>`).join('');

    htmlSurveillance = `
      <div class="mon">
        <div class="sec"><b>${regle.nom}</b> : surveillance recommandée${traitement.fin ? ' (traitement arrêté, suivi suspendu)' : ''}</div>
        ${avertissementSexe}
        ${regle.sansPreTherapeutique ? `<div class="sec">${echapper(regle.preTherapeutique.autres.join(' ; '))}</div>` : `<div class="mr">
          <span>Bilan pré-thérapeutique<small>${echapper(detail(regle.preTherapeutique.biologie, regle.preTherapeutique.autres))}</small></span>
          <input type="date" data-champ="pre" value="${echapper(traitement.pre || '')}">
          <span class="badge ${classePre}">${textePre}</span>
          <button type="button" data-aujourdhui="pre">Fait aujourd’hui</button>
        </div>`}
        ${lignesBilans}
        <div class="sec">${aide}</div>
        <div class="sec">${echapper(regle.remarque)}</div>
        ${remarques}
      </div>`;
  } else if (traitement.nom) {
    htmlSurveillance = '<div class="sec">Pas de surveillance biologique spécifique configurée pour cette molécule.</div>';
  }

  return `
    <div class="tc" data-index="${index}">
      <div class="g">
        <div><label>Molécule / spécialité</label><input list="listeMolecules" ${attributsChamp('nom', traitement.nom)}></div>
        <div><label>Posologie</label><input ${attributsChamp('dose', traitement.dose)}></div>
        <div><label>Introduit le${ancien ? ' (facultatif)' : ''}</label><input type="date" ${attributsChamp('intro', traitement.intro)}></div>
        <div><label>Dernière modification de dose</label><input type="date" ${attributsChamp('chg', traitement.chg)}></div>
        <div><label>Arrêté le</label><input type="date" ${attributsChamp('fin', traitement.fin)}></div>
        ${htmlAncien}
      </div>
      ${htmlSurveillance}
      <div class="act"><span class="sp"></span><button type="button" class="danger" data-retirer>Retirer</button></div>
    </div>`;
}

/** Redessine les deux groupes de traitements (fond / symptomatiques). */
function afficherTraitements() {
  $('zoneTraitements').innerHTML = Object.keys(GROUPES_TRAITEMENT).map(groupe => `
    <div class="tg">
      <div class="tgh">
        <b>${GROUPES_TRAITEMENT[groupe]}</b>
        <button type="button" data-ajouter="${groupe}">+ Ajouter</button>
      </div>
      ${traitementsEnEdition.map((t, i) => (t.g === groupe ? htmlCarteTraitement(t, i) : '')).join('')}
    </div>`).join('');
}

/** Clics dans la zone des traitements : ajouter, retirer, « fait aujourd'hui ». */
function gererClicTraitements(evenement) {
  const bouton = evenement.target.closest('button');
  if (!bouton) return;

  const carte = bouton.closest('.tc');
  const traitement = carte && traitementsEnEdition[+carte.dataset.index];

  if (bouton.dataset.ajouter) {
    traitementsEnEdition.push({ g: bouton.dataset.ajouter, nom: '', dose: '', intro: '', chg: '', fin: '', pre: '', bil: {} });

  } else if (bouton.hasAttribute('data-retirer')) {
    if (!confirm('Retirer ce traitement ?')) return;
    traitementsEnEdition.splice(+carte.dataset.index, 1);

  } else if (bouton.dataset.aujourdhui) {
    const aujourdhuiIso = versIso(aujourdhui());
    if (bouton.dataset.aujourdhui === 'pre') {
      traitement.pre = aujourdhuiIso;
    } else {
      traitement.bil = traitement.bil || {};
      traitement.bil[bouton.dataset.aujourdhui] = aujourdhuiIso;
    }
  }
  afficherTraitements();
}

/** Modification d'un champ d'un traitement (nom, dates, posologie, bilans…). */
function gererChangementTraitements(evenement) {
  const champ = evenement.target;
  const carte = champ.closest('.tc');
  if (!carte) return;

  const traitement = traitementsEnEdition[+carte.dataset.index];

  if (champ.dataset.bilan) {                        // date d'un bilan de suivi
    traitement.bil = traitement.bil || {};
    traitement.bil[champ.dataset.bilan] = champ.value;
  } else if (champ.dataset.champ) {                 // autre champ du traitement
    traitement[champ.dataset.champ] = champ.type === 'checkbox' ? champ.checked : champ.value;

    // Case « traitement ancien » cochée : le suivi reprend par défaut aujourd'hui.
    if (champ.dataset.champ === 'ancien' && champ.checked && !traitement.reprise) {
      traitement.reprise = versIso(aujourdhui());
    }
  }
  afficherTraitements();                            // recalcule les échéances
}


/* ---------------------------------------------------------------------
   F. FICHE PATIENT
   --------------------------------------------------------------------- */

/** Affiche ou masque les champs de relais selon la case « Patient à relayer ». */
function afficherSectionRelais() {
  $('sectionRelais').hidden = !$('aRelayer').checked;
}

/** Affiche ou masque le champ « ALD : numéro / intitulé » selon la case ALD. */
function afficherSectionAld() {
  $('sectionAld').hidden = !$('ald').checked;
}

/** Ouvre la fiche d'un patient (id) ou une fiche vide (null). */
function ouvrirFiche(id) {
  fichePatientId = id;
  // Valeurs initiales d'une nouvelle fiche : « à relayer » seulement si on est dans l'onglet relais.
  const patient = patients.find(p => p.id === id)
    || { priorite: 3, statut: statuts[0], rythme: rythmes[2], aRelayer: enRelais() };

  $('titreFiche').textContent = id ? 'Modifier la fiche' : 'Nouveau patient';
  $('btnSupprimer').hidden = !id;

  CHAMPS_FICHE.forEach(champ => { $(champ).value = patient[champ] ?? ''; });
  $('vigilance').checked = !!patient.vigilance;
  $('aRelayer').checked = estARelayer(patient);
  $('ald').checked = !!patient.ald;
  afficherSectionAld();
  afficherSectionRelais();

  traitementsEnEdition = JSON.parse(JSON.stringify(patient.trt || []));   // copie : « Annuler » ne change rien
  afficherTraitements();
  afficherResumeModulesFiche(id ? patient : null);
  ['btnFicheConsultation', 'btnFicheObservation', 'btnFicheHumeur', 'btnFicheEchelles', 'btnFicheMdph'].forEach(b => { $(b).hidden = !id; });

  $('fenetrePatient').showModal();
  $('nom').focus();
}

/** Enregistre la fiche (nouvelle ou modifiée). */
function enregistrerFiche() {
  const fiche = {};
  CHAMPS_FICHE.forEach(champ => { fiche[champ] = $(champ).value.trim(); });

  fiche.priorite = +$('priorite').value;
  fiche.vigilance = $('vigilance').checked ? 1 : 0;
  fiche.aRelayer = $('aRelayer').checked;
  fiche.ald = $('ald').checked;
  fiche.maj = new Date().toISOString();
  fiche.trt = traitementsEnEdition.filter(t => (t.nom || '').trim());   // ignore les lignes vides

  if (fichePatientId) {
    Object.assign(patients.find(p => p.id === fichePatientId), fiche);
  } else {
    fiche.id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
    patients.push(fiche);
  }
  sauvegarderPatients();
  afficherTableau();
  // La fiche enregistrée devient le patient courant ; l'écran ouvert est rafraîchi.
  definirPatientCourant(fichePatientId || fiche.id, true);
  if (onglet === 'accueil') afficherAccueil();
}

/** Ajoute un diagnostic (choisi dans la liste CIM-10) aux diagnostics secondaires. */
function ajouterDiagnosticSecondaire() {
  const saisie = $('dsAjout');
  const valeur = saisie.value.trim();
  if (!valeur) return;

  const champ = $('ds');
  champ.value = champ.value ? champ.value + ' ; ' + valeur : valeur;
  saisie.value = '';
}


/* ---------------------------------------------------------------------
   G. BOUTONS ET ÉVÉNEMENTS
   --------------------------------------------------------------------- */
function brancherEvenements() {
  // --- Onglets ---
  $('ongletActive').onclick = () => changerOnglet('active');
  $('ongletRelais').onclick = () => changerOnglet('relais');
  $('ongletObservation').onclick = () => changerOnglet('observation');
  $('ongletHumeur').onclick = () => changerOnglet('humeur');
  $('ongletEchelles').onclick = () => changerOnglet('echelles');
  $('ongletMdph').onclick = () => changerOnglet('mdph');
  $('ongletConsultation').onclick = () => changerOnglet('consultation');
  $('ongletDocuments').onclick = () => changerOnglet('documents');
  $('ongletAccueil').onclick = () => changerOnglet('accueil');
  $('btnNouveauGlobal').onclick = () => ouvrirFiche(null);

  // Depuis la fiche : ouvrir un module sur ce patient (la fiche est enregistrée d'abord).
  [['btnFicheConsultation', 'consultation'], ['btnFicheObservation', 'observation'], ['btnFicheHumeur', 'humeur'], ['btnFicheEchelles', 'echelles'], ['btnFicheMdph', 'mdph']]
    .forEach(([bouton, cible]) => {
      $(bouton).onclick = () => {
        if (!fichePatientId) return;
        if (!$('formPatient').reportValidity()) return;
        enregistrerFiche();
        const id = fichePatientId;
        $('fenetrePatient').close();
        changerOnglet(cible, id);
      };
    });

  // --- Fiche patient ---
  $('formPatient').addEventListener('submit', enregistrerFiche);
  $('btnAnnuler').onclick = () => $('fenetrePatient').close();
  $('btnNouveau').onclick = () => ouvrirFiche(null);
  $('aRelayer').addEventListener('change', afficherSectionRelais);
  $('ald').addEventListener('change', afficherSectionAld);
  $('btnSupprimer').onclick = () => {
    if (!confirm('Supprimer définitivement cette fiche ?')) return;
    patients = patients.filter(p => p.id !== fichePatientId);
    sauvegarderPatients();
    afficherTableau();
    $('fenetrePatient').close();
    if (consPatientId === fichePatientId) definirPatientCourant('', true);
  };

  $('dsAjout').addEventListener('change', ajouterDiagnosticSecondaire);
  $('dsAjout').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); ajouterDiagnosticSecondaire(); }   // Entrée ne doit pas valider la fiche
  });

  $('zoneTraitements').addEventListener('click', gererClicTraitements);
  $('zoneTraitements').addEventListener('change', gererChangementTraitements);

  // Sexe ou date de naissance modifiés : les bilans de la fiche sont recalculés.
  ['sexe', 'ddn'].forEach(id => $(id).addEventListener('change', afficherTraitements));

  // Profil du prescripteur et ordonnances (js/ordonnance.js)
  brancherOrdonnance();

  // --- Tableau : ouvrir une fiche au clic ou à la touche Entrée ---
  const ouvrirDepuisLigne = e => {
    const ligne = e.target.closest('tr');
    if (ligne && ligne.dataset.id) ouvrirFiche(ligne.dataset.id);
  };
  $('lignesTableau').addEventListener('click', ouvrirDepuisLigne);
  $('lignesTableau').addEventListener('keydown', e => { if (e.key === 'Enter') ouvrirDepuisLigne(e); });

  // --- Tableau : tri en cliquant sur un en-tête ---
  $('enteteTableau').addEventListener('click', e => {
    const entete = e.target.closest('th[data-tri]');
    if (!entete) return;
    const colonne = entete.dataset.tri;
    triSens = (triColonne === colonne) ? -triSens : 1;
    triColonne = colonne;
    afficherTableau();
  });

  // --- Recherche, filtres, choix de la vue ---
  ['recherche', 'filtrePriorite', 'filtreStatut', 'filtreBilans', 'vue']
    .forEach(id => $(id).addEventListener('input', afficherTableau));

  // --- Import / export / impression ---
  $('btnJson').onclick = exporterJson;
  $('btnCsv').onclick = exporterCsv;
  $('btnImprimer').onclick = () => print();
  $('btnImporter').onclick = () => $('fichierImport').click();
  $('fichierImport').onchange = e => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    importerJson(fichier, () => { migrerAnciennesDonnees(); remplirListesModifiables(); afficherTableau(); });
    e.target.value = '';                                   // permet de réimporter le même fichier
  };

  // --- Paramètres (statuts et rythmes modifiables sans toucher au code) ---
  $('btnParametres').onclick = () => {
    $('paramStatuts').value = statuts.join('\n');
    $('paramRythmes').value = rythmes.join('\n');
    $('fenetreParametres').showModal();
  };
  $('btnParamAnnuler').onclick = () => $('fenetreParametres').close();
  $('formParametres').addEventListener('submit', evenement => {
    const lignes = id => $(id).value.split('\n').map(x => x.trim()).filter(Boolean);
    const nouveauxStatuts = lignes('paramStatuts');
    const nouveauxRythmes = lignes('paramRythmes');

    if (nouveauxStatuts.length < 2 || !nouveauxRythmes.length) {
      evenement.preventDefault();                          // garde la fenêtre ouverte
      alert('Il faut au moins 2 statuts et 1 rythme.');
      return;
    }

    // Renommer un libellé met à jour les fiches existantes (par position dans la liste).
    patients.forEach(p => {
      const iStatut = statuts.indexOf(p.statut);
      const iRythme = rythmes.indexOf(p.rythme);
      if (iStatut > -1) p.statut = nouveauxStatuts[Math.min(iStatut, nouveauxStatuts.length - 1)];
      if (iRythme > -1) p.rythme = nouveauxRythmes[Math.min(iRythme, nouveauxRythmes.length - 1)];
    });

    statuts = nouveauxStatuts;
    rythmes = nouveauxRythmes;
    sauvegarderReglages();
    sauvegarderPatients();
    remplirListesModifiables();
    afficherTableau();
  });

  // --- Avis de confidentialité ---
  try { if (localStorage.getItem(CLE_AVIS)) $('avis').hidden = true; } catch (erreur) { /* ignoré */ }
  $('btnAvisCompris').onclick = () => {
    $('avis').hidden = true;
    try { localStorage.setItem(CLE_AVIS, '1'); } catch (erreur) { /* ignoré */ }
  };
}


/* ---------------------------------------------------------------------
   H. DÉMARRAGE
   --------------------------------------------------------------------- */
chargerDonnees();
completerListesDepuisPatients();

// Dernier onglet ouvert (la file active par défaut).
try {
  const memorise = localStorage.getItem(CLE_ONGLET);
  if (ONGLETS.some(([valeur]) => valeur === memorise)) onglet = memorise;
} catch (erreur) { /* ignoré */ }
triColonne = enRelais() ? 'priorite' : 'nom';

remplirListesFixes();
remplirListesModifiables();
initialiserObservation();
initialiserHumeur();
initialiserEchelles();
initialiserMdph();
initialiserConsultation();
initialiserDocuments();
initialiserAccueil();
afficherOnglets();
brancherEvenements();
brancherSauvegarde();
afficherTableau();
if (!ongletPatients()) afficherModule();
