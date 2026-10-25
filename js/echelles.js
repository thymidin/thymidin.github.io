/* =====================================================================
   ECHELLES.JS — cotation des échelles : QIDS-SR16, RAADS-R, AQ, EQ
   ---------------------------------------------------------------------
   Principe : le patient remplit le questionnaire papier (texte officiel) ;
   vous reportez ici ses réponses item par item, ou d'un coup en « saisie
   rapide » (une suite de chiffres). Le score total, les sous-scores, les
   seuils et une interprétation sont calculés, puis enregistrés dans la
   fiche du patient si vous le souhaitez.

   Intitulés des items : extraits des versions françaises du service
   (js/intitules.js) et affichés en face de chaque item ; pour la QIDS-SR16,
   chaque item affiche ses 4 propositions. Les réponses sont libellées comme
   sur ces versions (« Fortement d'accord »… pour l'AQ et l'EQ, « Vrai
   maintenant et quand j'avais moins de 16 ans »… pour la RAADS-R).
   Une autre version peut être collée dans « Intitulés des items ».

   Références des clés de cotation et des seuils :
     QIDS-SR16 : Rush et al., Biol Psychiatry 2003.
     AQ        : Baron-Cohen et al., J Autism Dev Disord 2001 (seuil 32) ;
                 Woodbury-Smith et al., J Autism Dev Disord 2005 (seuil 26).
     EQ        : Baron-Cohen & Wheelwright, J Autism Dev Disord 2004 (seuil 30).
     RAADS-R   : Ritvo et al., J Autism Dev Disord 2011 (seuil 65).
   Ces outils aident au dépistage et au suivi ; ils ne posent pas de diagnostic.
   ===================================================================== */

const intervalle = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Libellés des réponses tels qu'ils figurent sur les versions françaises utilisées.
const CHOIX_ACCORD = ['Fortement d’accord', 'Légèrement d’accord', 'Légèrement en désaccord', 'Fortement en désaccord'];

const ECHELLES = {

  /* ----- QIDS-SR16 ----- */
  qids: {
    nom: 'QIDS-SR16',
    titre: 'Inventaire rapide de symptomatologie dépressive, auto-questionnaire, 16 items',
    periode: 'Sur les 7 derniers jours',
    choix: ['0', '1', '2', '3'],
    saisieRapide: 'Chiffres 0 à 3, un par item (ex. 1203…). Un point « . » pour un item non répondu.',
    chiffreVersIndice: c => ('0123'.includes(c) ? +c : undefined),
    items: [
      'Endormissement', 'Sommeil pendant la nuit (réveils)', 'Réveil trop précoce', 'Sommeil excessif',
      'Tristesse', 'Diminution de l’appétit', 'Augmentation de l’appétit',
      'Perte de poids (2 dernières semaines)', 'Prise de poids (2 dernières semaines)',
      'Concentration, prise de décision', 'Image de soi', 'Idées de mort ou de suicide',
      'Intérêt général', 'Niveau d’énergie', 'Sentiment de ralentissement', 'Sentiment d’agitation',
    ],
  },

  /* ----- AQ (Autism-Spectrum Quotient) ----- */
  aq: {
    nom: 'AQ',
    titre: 'Quotient du spectre autistique, 50 items',
    choix: CHOIX_ACCORD,
    saisieRapide: 'Chiffres 1 à 5, un par item, comme sur la feuille de cotation : 1 = fortement d’accord, 2 = légèrement d’accord, 3 = légèrement en désaccord, 4 = fortement en désaccord, 5 = pas de réponse.',
    chiffreVersIndice: c => ('1234'.includes(c) ? +c - 1 : c === '5' ? null : undefined),
    nbItems: 50,
    // Items cotés 1 point si « d'accord » (tout à fait ou plutôt) ; les autres si « pas d'accord ».
    accord: [2, 4, 5, 6, 7, 9, 12, 13, 16, 18, 19, 20, 21, 22, 23, 26, 33, 35, 39, 41, 42, 43, 45, 46],
    sousEchelles: [
      ['Compétences sociales', [1, 11, 13, 15, 22, 36, 44, 45, 47, 48]],
      ['Flexibilité attentionnelle', [2, 4, 10, 16, 25, 32, 34, 37, 43, 46]],
      ['Attention aux détails', [5, 6, 9, 12, 19, 23, 28, 29, 30, 49]],
      ['Communication', [7, 17, 18, 26, 27, 31, 33, 35, 38, 39]],
      ['Imagination', [3, 8, 14, 20, 21, 24, 40, 41, 42, 50]],
    ],
  },

  /* ----- EQ (Empathy Quotient), 60 items -----
     Même clé que la feuille de cotation du service (macro AQ/EQ) : 40 items cotés, total sur 80.
     Les 20 autres items figurent dans le questionnaire mais ne comptent pas ; un bouton permet
     de les afficher ou de les masquer dans la saisie. */
  eq: {
    nom: 'EQ',
    titre: 'Quotient d’empathie (EQ), 60 items',
    choix: CHOIX_ACCORD,
    saisieRapide: 'Chiffres 1 à 5, un par item (60 items, dans l’ordre du questionnaire), comme sur la feuille de cotation : 1 = fortement d’accord, 2 = légèrement d’accord, 3 = légèrement en désaccord, 4 = fortement en désaccord, 5 = pas de réponse.',
    chiffreVersIndice: c => ('1234'.includes(c) ? +c - 1 : c === '5' ? null : undefined),
    nbItems: 60,
    // « Fortement d'accord » = 2, « légèrement d'accord » = 1
    positifs: [1, 6, 19, 22, 25, 26, 35, 36, 37, 38, 41, 42, 43, 44, 52, 54, 55, 57, 58, 59, 60],
    // « Fortement en désaccord » = 2, « légèrement en désaccord » = 1
    negatifs: [4, 8, 10, 11, 12, 14, 15, 18, 21, 27, 28, 29, 32, 34, 39, 46, 48, 49, 50],
    nonCotes: [2, 3, 5, 7, 9, 13, 16, 17, 20, 23, 24, 30, 31, 33, 40, 45, 47, 51, 53, 56],
  },

  /* ----- PHQ-9 (Kroenke et al., 2001) ----- */
  phq9: {
    nom: 'PHQ-9',
    titre: 'Patient Health Questionnaire, 9 items (dépression)',
    periode: 'Au cours des 2 dernières semaines',
    choix: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'],
    saisieRapide: 'Chiffres 0 à 3, un par item : 0 = jamais, 1 = plusieurs jours, 2 = plus de la moitié des jours, 3 = presque tous les jours.',
    chiffreVersIndice: c => ('0123'.includes(c) ? +c : undefined),
    items: ['Peu d’intérêt ou de plaisir à faire les choses', 'Tristesse, déprime ou désespoir', 'Troubles du sommeil (endormissement, réveils, ou trop de sommeil)',
            'Fatigue ou manque d’énergie', 'Appétit diminué ou augmenté', 'Mauvaise image de soi, sentiment d’échec ou de culpabilité',
            'Difficultés de concentration', 'Ralentissement ou au contraire agitation', 'Pensées qu’il vaudrait mieux être mort(e) ou de se faire du mal'],
  },

  /* ----- GAD-7 (Spitzer et al., 2006) ----- */
  gad7: {
    nom: 'GAD-7',
    titre: 'Generalized Anxiety Disorder, 7 items (anxiété)',
    periode: 'Au cours des 2 dernières semaines',
    choix: ['Jamais', 'Plusieurs jours', 'Plus de la moitié des jours', 'Presque tous les jours'],
    saisieRapide: 'Chiffres 0 à 3, un par item : 0 = jamais, 1 = plusieurs jours, 2 = plus de la moitié des jours, 3 = presque tous les jours.',
    chiffreVersIndice: c => ('0123'.includes(c) ? +c : undefined),
    items: ['Sentiment de nervosité, d’anxiété ou de tension', 'Incapacité à arrêter de s’inquiéter ou à contrôler ses inquiétudes',
            'Inquiétudes excessives à propos de tout et de rien', 'Difficultés à se détendre', 'Agitation, difficulté à tenir en place',
            'Irritabilité, tendance à s’énerver facilement', 'Peur que quelque chose de terrible arrive'],
  },

  /* ----- RAADS-R ----- */
  raads: {
    nom: 'RAADS-R',
    titre: 'Ritvo Autism Asperger Diagnostic Scale – révisée, 80 items',
    choix: ['Vrai maintenant et quand j’avais moins de 16 ans', 'Vrai seulement maintenant', 'Vrai seulement quand j’avais moins de 16 ans', 'Jamais vrai'],
    saisieRapide: 'Chiffres 1 à 4, un par item : 1 = vrai maintenant et quand j’avais moins de 16 ans, 2 = vrai seulement maintenant, 3 = vrai seulement quand j’avais moins de 16 ans, 4 = jamais vrai. « . » = non répondu.',
    chiffreVersIndice: c => ('1234'.includes(c) ? +c - 1 : undefined),
    nbItems: 80,
    // Items « normatifs » à cotation inversée (0-1-2-3 au lieu de 3-2-1-0).
    inverses: [1, 6, 11, 18, 23, 26, 33, 37, 43, 47, 48, 53, 58, 62, 68, 72, 77],
    sousEchelles: [
      ['Relations sociales', [1, 3, 5, 6, 8, 11, 12, 14, 17, 18, 20, 21, 22, 23, 25, 26, 28, 31, 37, 38, 39, 43, 44, 45, 47, 48, 53, 54, 55, 60, 61, 64, 68, 69, 72, 76, 77, 79, 80], 31],
      ['Intérêts restreints', [9, 13, 24, 30, 32, 40, 41, 50, 52, 56, 63, 70, 75, 78], 15],
      ['Langage', [2, 7, 15, 27, 35, 58, 66], 4],
      ['Sensori-moteur', [4, 10, 16, 19, 29, 33, 34, 36, 42, 46, 49, 51, 57, 59, 62, 65, 67, 71, 73, 74], 16],
    ],
  },
};

const nbItemsEchelle = id => ECHELLES[id].items ? ECHELLES[id].items.length : ECHELLES[id].nbItems;


/* ---------------------------------------------------------------------
   1. CALCUL DES SCORES
   Chaque fonction reçoit les réponses (indices 0-3 ou null) et renvoie :
   { total, max, manquants: [n° d'items], sous: [{nom, score, max, seuil, atteint}],
     niveau: 'ok' | 'bientot' | 'retard' (couleur), interpretation, alertes: [] }
   --------------------------------------------------------------------- */
function manquantsParmi(rep, numeros) {
  return numeros.filter(n => rep[n - 1] === null || rep[n - 1] === undefined);
}

function calculerQids(rep) {
  const v = n => rep[n - 1];
  const maxDe = numeros => {
    const valeurs = numeros.map(v).filter(x => x !== null && x !== undefined);
    return valeurs.length ? Math.max(...valeurs) : 0;
  };
  const domaines = [
    ['Sommeil (max. items 1-4)', maxDe([1, 2, 3, 4])],
    ['Tristesse (5)', v(5) ?? 0],
    ['Appétit / poids (max. items 6-9)', maxDe([6, 7, 8, 9])],
    ['Concentration (10)', v(10) ?? 0],
    ['Image de soi (11)', v(11) ?? 0],
    ['Idées de mort / suicide (12)', v(12) ?? 0],
    ['Intérêt (13)', v(13) ?? 0],
    ['Énergie (14)', v(14) ?? 0],
    ['Psychomotricité (max. items 15-16)', maxDe([15, 16])],
  ];
  const total = domaines.reduce((s, [, x]) => s + x, 0);

  let interpretation, niveau;
  if (total <= 5)       { interpretation = 'Pas de dépression (0-5)'; niveau = 'ok'; }
  else if (total <= 10) { interpretation = 'Dépression légère (6-10)'; niveau = 'ok'; }
  else if (total <= 15) { interpretation = 'Dépression modérée (11-15)'; niveau = 'bientot'; }
  else if (total <= 20) { interpretation = 'Dépression sévère (16-20)'; niveau = 'retard'; }
  else                  { interpretation = 'Dépression très sévère (21-27)'; niveau = 'retard'; }

  const alertes = [];
  if ((v(12) ?? 0) >= 1) alertes.push(`Item 12 (idées de mort ou de suicide) coté ${v(12)} : évaluation du risque suicidaire à faire ou à documenter.`);

  return {
    total, max: 27, manquants: manquantsParmi(rep, intervalle(1, 16)),
    sous: domaines.map(([nom, score]) => ({ nom, score, max: 3 })),
    niveau, interpretation, alertes,
  };
}

function calculerAq(rep) {
  const e = ECHELLES.aq;
  const point = n => {
    const r = rep[n - 1];
    if (r === null || r === undefined) return 0;
    const daccord = r <= 1;
    return e.accord.includes(n) ? (daccord ? 1 : 0) : (daccord ? 0 : 1);
  };
  const total = intervalle(1, 50).reduce((s, n) => s + point(n), 0);
  const sous = e.sousEchelles.map(([nom, numeros]) => ({ nom, score: numeros.reduce((s, n) => s + point(n), 0), max: 10 }));

  let interpretation, niveau;
  if (total >= 32)      { interpretation = 'Score ≥ 32 (max. 50) : 80 % des patients avec syndrome d’Asperger ont un score égal ou supérieur à 32'; niveau = 'retard'; }
  else if (total >= 26) { interpretation = 'Score de 26 à 31 (max. 50) : sous le seuil de 32, au-dessus du seuil de dépistage de 26 (Woodbury-Smith et al., 2005)'; niveau = 'bientot'; }
  else                  { interpretation = 'Score < 26 (max. 50) : sous les seuils de 26 et 32'; niveau = 'ok'; }

  return { total, max: 50, manquants: manquantsParmi(rep, intervalle(1, 50)), sous, niveau, interpretation, alertes: [] };
}

function calculerEq(rep) {
  const e = ECHELLES.eq;
  const cotes = [...e.positifs, ...e.negatifs].sort((x, y) => x - y);
  const point = n => {
    const r = rep[n - 1];
    if (!cotes.includes(n)) return 0;                             // item non coté
    if (r === null || r === undefined) return 1;                 // pas de réponse : 1 point (feuille de cotation du service)
    if (e.positifs.includes(n)) return r === 0 ? 2 : r === 1 ? 1 : 0;
    return r === 3 ? 2 : r === 2 ? 1 : 0;
  };
  const total = intervalle(1, 60).reduce((s, n) => s + point(n), 0);

  let interpretation, niveau;
  if (total <= 30) { interpretation = 'Score ≤ 30 (max. 80) : 80 % des patients avec syndrome d’Asperger ont un score égal ou inférieur à 30'; niveau = 'retard'; }
  else             { interpretation = 'Score > 30 (max. 80) : au-dessus du seuil de 30'; niveau = 'ok'; }

  return {
    total, max: 80,
    manquants: manquantsParmi(rep, eqNonCotesVisibles() ? intervalle(1, 60) : cotes),
    noteManquants: 'Score provisoire : un item coté sans réponse compte 1 point (convention de la feuille de cotation).',
    sous: [], niveau, interpretation, alertes: [],
  };
}

/* Affichage des items non cotés de l'EQ (réglage mémorisé dans ce navigateur). */
const CLE_EQ_NON_COTES = CLE_STOCKAGE + '_eqNonCotes';
function eqNonCotesVisibles() {
  try { return localStorage.getItem(CLE_EQ_NON_COTES) !== 'masques'; } catch (erreur) { return true; }
}
function basculerEqNonCotes() {
  try { localStorage.setItem(CLE_EQ_NON_COTES, eqNonCotesVisibles() ? 'masques' : 'visibles'); } catch (erreur) { /* ignoré */ }
  afficherEchelle();
}

function calculerRaads(rep) {
  const e = ECHELLES.raads;
  const point = n => {
    const r = rep[n - 1];
    if (r === null || r === undefined) return 0;
    return e.inverses.includes(n) ? r : 3 - r;
  };
  const total = intervalle(1, 80).reduce((s, n) => s + point(n), 0);
  const sous = e.sousEchelles.map(([nom, numeros, seuil]) => {
    const score = numeros.reduce((s, n) => s + point(n), 0);
    return { nom, score, max: numeros.length * 3, seuil, atteint: score >= seuil,
             sur7: numeros.length === 7 ? null : Math.round(score * 7 / numeros.length * 10) / 10 };   // « /7 items » de la feuille de cotation
  });

  let interpretation, niveau;
  if (total >= 65) { interpretation = 'Score ≥ 65 : seuil de Ritvo et al. (2011) atteint ou dépassé, compatible avec un trouble du spectre de l’autisme (à confirmer par une évaluation diagnostique)'; niveau = 'retard'; }
  else             { interpretation = 'Score < 65 : sous le seuil de Ritvo et al. (2011)'; niveau = 'ok'; }

  return { total, max: 240, manquants: manquantsParmi(rep, intervalle(1, 80)), sous, niveau, interpretation, alertes: [] };
}

function calculerSomme(id, bornes) {
  return rep => {
    const n = nbItemsEchelle(id);
    const total = intervalle(1, n).reduce((s, i) => s + (rep[i - 1] ?? 0), 0);
    const [interpretation, niveau] = bornes.find(([max]) => total <= max).slice(1);
    const alertes = [];
    if (id === 'phq9' && (rep[8] ?? 0) >= 1) alertes.push(`Item 9 (idées de mort ou d’auto-agression) coté ${rep[8]} : évaluation du risque suicidaire à faire ou à documenter.`);
    return { total, max: n * 3, manquants: manquantsParmi(rep, intervalle(1, n)), sous: [], niveau, interpretation, alertes };
  };
}
const calculerPhq9 = calculerSomme('phq9', [[4, 'Symptômes dépressifs minimes (0-4)', 'ok'], [9, 'Dépression légère (5-9)', 'ok'], [14, 'Dépression modérée (10-14)', 'bientot'], [19, 'Dépression modérément sévère (15-19)', 'retard'], [27, 'Dépression sévère (20-27)', 'retard']]);
const calculerGad7 = calculerSomme('gad7', [[4, 'Anxiété minime (0-4)', 'ok'], [9, 'Anxiété légère (5-9)', 'ok'], [14, 'Anxiété modérée (10-14)', 'bientot'], [21, 'Anxiété sévère (15-21)', 'retard']]);

const CALCULS = { qids: calculerQids, aq: calculerAq, eq: calculerEq, raads: calculerRaads, phq9: calculerPhq9, gad7: calculerGad7 };

/** Résumé d'une ligne, pour le dossier (« QIDS-SR16 du 24/10/2026 : 14/27, dépression modérée… »). */
function resumeScore(id, date, res) {
  const e = ECHELLES[id];
  const sous = res.sous.length && id !== 'qids'
    ? ' ; ' + res.sous.map(s => `${s.nom} ${s.score}/${s.max}${s.seuil !== undefined ? (s.atteint ? ' (≥ seuil ' + s.seuil + ')' : '') : ''}`).join(', ')
    : '';
  const incomplet = res.manquants.length ? ` [incomplet : ${res.manquants.length} item(s) non répondu(s)]` : '';
  return `${e.nom} du ${formaterDate(date)} : ${res.total}/${res.max}. ${res.interpretation}${sous}.${incomplet}`
    + (res.alertes.length ? ' ' + res.alertes.join(' ') : '');
}


/* ---------------------------------------------------------------------
   2. INTERFACE
   --------------------------------------------------------------------- */
let echelleCourante = 'qids';
let reponses = [];                       // réponses en cours de saisie
let echPatientId = '';

function htmlVueEchelles() {
  return `
  <div class="ech-grille">
    <div class="carte">
      <div class="g">
        <div><label for="echPatient">Patient</label><select id="echPatient"></select></div>
        <div><label for="echChoix">Échelle</label>
          <select id="echChoix">${Object.entries(ECHELLES).map(([id, e]) => `<option value="${id}">${e.nom}</option>`).join('')}</select></div>
        <div><label for="echDate">Date de passation</label><input type="date" id="echDate"></div>
      </div>
      <p class="sec" id="echTitre"></p>
      <div class="g">
        <div class="full"><label for="echRapide">Saisie rapide</label>
          <div class="bar" style="margin:0"><input id="echRapide" autocomplete="off" spellcheck="false" style="flex:1;font-family:ui-monospace,monospace">
          <button type="button" id="echRemplir">Remplir</button><button type="button" id="echEffacer">Tout effacer</button>
          <button type="button" class="main" id="echTablette" title="Le patient répond lui-même, en plein écran, un item à la fois">Passation sur tablette</button></div>
          <div class="sec" id="echAideRapide"></div>
        </div>
      </div>
      <div class="sec" id="echLegende" style="margin-top:8px"></div>
      <div id="echItems" class="ech-items"></div>

      <details class="src" id="echIntitulesZone" style="margin-top:14px">
        <summary><b>Intitulés des items</b> <span id="echIntitulesEtat"></span></summary>
        <div class="sec" id="echIntitulesAide" style="margin:8px 0"></div>
        <textarea id="echIntitules" rows="10" spellcheck="false" style="font-family:ui-monospace,monospace;font-size:12.5px"></textarea>
        <div class="act"><button type="button" class="main" id="echIntitulesOk">Enregistrer les intitulés</button>
          <button type="button" class="danger" id="echIntitulesSuppr">Retirer</button><span class="sec" id="echIntitulesMsg"></span></div>
      </details>
    </div>

    <div class="carte ech-resultat" id="echResultat"></div>
  </div>

  <div class="carte">
    <h3 class="h3">Historique du patient</h3>
    <div id="echHistorique"></div>
  </div>`;
}

function initialiserEchelles() {
  $('vueEchelles').innerHTML = htmlVueEchelles();
  $('echDate').value = aujourdhuiIso();
  $('echChoix').onchange = () => { echelleCourante = $('echChoix').value; nouvelleSaisie(); };
  $('echPatient').onchange = () => { echPatientId = $('echPatient').value; afficherHistoriqueEchelles(); };
  $('echRemplir').onclick = remplirRapide;
  $('echRapide').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); remplirRapide(); } });
  $('echEffacer').onclick = () => { if (confirm('Effacer toutes les réponses saisies ?')) nouvelleSaisie(); };
  chargerIntitules();
  $('echTablette').onclick = ouvrirModeTablette;
  $('echIntitulesOk').onclick = () => {
    const resultat = analyserIntitules(echelleCourante, $('echIntitules').value);
    if (resultat.erreur) return signaler($('echIntitulesMsg'), resultat.erreur);
    intitules[echelleCourante] = resultat;
    sauvegarderIntitules();
    afficherEchelle();
    signaler($('echIntitulesMsg'), `${resultat.titres.length} intitulés enregistrés` + (resultat.options ? ' avec leurs propositions.' : '.'));
  };
  $('echIntitulesSuppr').onclick = () => {
    if (!intitules[echelleCourante] || !confirm('Retirer les intitulés personnalisés et revenir à la version intégrée ?')) return;
    delete intitules[echelleCourante];
    sauvegarderIntitules();
    afficherEchelle();
  };

  // Clic sur une réponse.
  $('echItems').addEventListener('click', e => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    const i = +b.dataset.i, v = +b.dataset.v;
    reponses[i] = reponses[i] === v ? null : v;                 // second clic = efface
    afficherItems(i);
    afficherResultat();
  });
  // Clavier : sur une ligne, un chiffre coche la réponse et passe à la suivante.
  $('echItems').addEventListener('keydown', e => {
    const ligne = e.target.closest('.ech-ligne');
    if (!ligne) return;
    const i = +ligne.dataset.ligne;
    const e2 = ECHELLES[echelleCourante];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      focaliserLigne(i + (e.key === 'ArrowDown' ? 1 : -1), e.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    const indice = e2.chiffreVersIndice(e.key);
    if (indice === undefined) return;                          // (null = « pas de réponse »)
    e.preventDefault();
    reponses[i] = indice;
    afficherItems();
    afficherResultat();
    focaliserLigne(i + 1);
  });

  $('echResultat').addEventListener('click', e => {
    if (e.target.id === 'echEnregistrer') enregistrerScore();
    if (e.target.id === 'echCopier') {
      const res = CALCULS[echelleCourante](reponses);
      copierTexte(resumeScore(echelleCourante, $('echDate').value, res))
        .then(ok => signaler($('echMsg'), ok ? 'Copié.' : 'Copie impossible ici.'));
    }
  });
  $('echHistorique').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const patient = patients.find(p => p.id === echPatientId);
    if (!patient) return;
    const score = (patient.ech || []).find(s => s.id === b.dataset.id);
    if (!score) return;
    if (b.dataset.action === 'recharger') {
      echelleCourante = score.echelle;
      $('echChoix').value = score.echelle;
      reponses = [...score.rep];
      $('echDate').value = score.date;
      afficherEchelle();
      $('vueEchelles').scrollIntoView({ behavior: 'smooth' });
    } else if (b.dataset.action === 'supprimer') {
      if (!confirm('Supprimer ce résultat ?')) return;
      patient.ech = patient.ech.filter(s => s.id !== score.id);
      sauvegarderPatients();
      afficherHistoriqueEchelles();
    }
  });
  nouvelleSaisie();
}

function focaliserLigne(i, sens = 1) {
  let ligne = document.querySelector(`.ech-ligne[data-ligne="${i}"]`);
  while (ligne && ligne.hidden) { i += sens; ligne = document.querySelector(`.ech-ligne[data-ligne="${i}"]`); }
  if (ligne) ligne.focus();
}

/** Ouvre l'onglet (appelé par interface.js), éventuellement sur un patient donné. */
function afficherVueEchelles(idPatient) {
  if (idPatient !== undefined) echPatientId = idPatient;
  remplirSelectPatients($('echPatient'), echPatientId, '— Sans patient (calcul seul) —');
  echPatientId = $('echPatient').value;
  afficherHistoriqueEchelles();
}

function nouvelleSaisie() {
  reponses = Array(nbItemsEchelle(echelleCourante)).fill(null);
  $('echRapide').value = '';
  afficherEchelle();
}

function afficherEchelle() {
  const e = ECHELLES[echelleCourante];
  $('echTitre').textContent = e.titre + (e.periode ? ' · ' + e.periode : '');
  $('echAideRapide').textContent = e.saisieRapide;
  $('echLegende').innerHTML = echelleCourante === 'qids'
    ? 'Cochez la proposition choisie par le patient (cotée 0 à 3). Clavier : chiffre 0 à 3 puis passage automatique à l’item suivant.'
    : 'Clavier : ' + e.choix.map((c, i) => `<b>${e.chiffreVersIndice('0') === 0 ? i : i + 1}</b> = ${echapper(c)}`).join(' · ')
      + ', puis passage automatique à l’item suivant.'
      + (echelleCourante === 'aq' || echelleCourante === 'eq' ? ' <b>5</b> = pas de réponse.' : '')
      + (echelleCourante === 'eq'
        ? ` <button type="button" id="echBasculeNonCotes" style="margin-left:6px">${eqNonCotesVisibles() ? 'Masquer' : 'Afficher'} les 20 items non cotés</button>`
        : '');
  const bouton = $('echBasculeNonCotes');
  if (bouton) bouton.onclick = basculerEqNonCotes;
  afficherItems();
  afficherResultat();
}

function afficherItems(seulementIndex) {
  const e = ECHELLES[echelleCourante];
  const n = nbItemsEchelle(echelleCourante);
  const textes = intitulesEchelle(echelleCourante);
  const qids = echelleCourante === 'qids';
  const masques = echelleCourante === 'eq' && !eqNonCotesVisibles() ? new Set(e.nonCotes.map(n => n - 1)) : new Set();
  const ligne = i => {
    if (masques.has(i)) return `<div class="ech-ligne" data-ligne="${i}" hidden></div>`;
    const titre = (textes.titres && textes.titres[i]) || (e.items ? e.items[i] : '');
    const propositions = qids && textes.options && textes.options[i];
    const boutons = e.choix.map((c, v) => {
      const libelle = propositions ? `<b>${v}</b> ${echapper(propositions[v] || '')}` : qids ? String(v) : echapper(c);
      return `<button type="button" data-i="${i}" data-v="${v}" title="${echapper(qids ? 'Cotation ' + v : c)}" class="${reponses[i] === v ? 'on' : ''}" tabindex="-1">${libelle}</button>`;
    }).join('');
    return `<div class="ech-ligne${reponses[i] === null ? ' vide' : ''}${propositions ? ' avec-propositions' : ''}" tabindex="0" data-ligne="${i}">
      <span class="ech-num">${i + 1}</span>
      <span class="ech-lib">${echapper(titre) || '<span class="sec">Item ' + (i + 1) + '</span>'}</span>
      <span class="ech-choix${qids ? '' : ' larges'}${propositions ? ' propositions' : ''}">${boutons}</span>
    </div>`;
  };
  if (seulementIndex !== undefined && $('echItems').children.length === n) {
    $('echItems').children[seulementIndex].outerHTML = ligne(seulementIndex);
    return;
  }
  $('echItems').innerHTML = intervalle(0, n - 1).map(ligne).join('');
  afficherEtatIntitules();
}

/* ---------- Intitulés des items (texte officiel fourni par l'utilisateur) ---------- */
const CLE_INTITULES = CLE_STOCKAGE + '_intitules';
let intitules = {};                                  // intitulés collés par l'utilisateur (prioritaires)
/** Intitulés affichés : ceux collés par l'utilisateur, sinon ceux des versions intégrées (js/intitules.js). */
function intitulesEchelle(id) {
  if (intitules[id] && intitules[id].titres && intitules[id].titres.length === nbItemsEchelle(id)) return intitules[id];
  return (typeof INTITULES_OFFICIELS !== 'undefined' && INTITULES_OFFICIELS[id]) || {};
}
function chargerIntitules() {
  try { intitules = JSON.parse(localStorage.getItem(CLE_INTITULES) || '{}') || {}; } catch (erreur) { intitules = {}; }
}
function sauvegarderIntitules() {
  try { localStorage.setItem(CLE_INTITULES, JSON.stringify(intitules)); }
  catch (erreur) { alert('Enregistrement impossible dans ce navigateur.'); }
}

/** Analyse le texte collé.
 *  AQ, EQ, RAADS-R : un item par ligne (numérotation « 1. », « 1) », « 1 - » retirée).
 *  QIDS-SR16 : un bloc par item, séparé par une ligne vide : la 1re ligne = intitulé,
 *  les 4 suivantes = propositions cotées 0, 1, 2, 3 ; ou bien 16 lignes d'intitulés seuls. */
function analyserIntitules(id, texte) {
  const n = nbItemsEchelle(id);
  const sansNumero = l => l.replace(/^\s*(?:item\s*|q\s*)?\d{1,2}\s*[.):\-–]\s*/i, '').trim();
  const sansCotation = l => l.replace(/^\s*[0-3]\s*(?:[.):\-–=]|pts?\b|points?\b)?\s*/i, '').trim();
  const brut = texte.replace(/\r/g, '').trim();
  if (!brut) return { erreur: 'Rien à enregistrer.' };

  if (id === 'qids') {
    const blocs = brut.split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(b => b.length);
    if (blocs.length === n && blocs.every(b => b.length >= 5)) {
      return { titres: blocs.map(b => sansNumero(b[0])), options: blocs.map(b => b.slice(1, 5).map(sansCotation)) };
    }
    const lignes = brut.split('\n').map(l => l.trim()).filter(Boolean);
    if (lignes.length === n) return { titres: lignes.map(sansNumero) };
    return { erreur: `QIDS-SR16 : ${blocs.length} bloc(s) et ${lignes.length} ligne(s) trouvés. Attendu : 16 blocs (intitulé + 4 propositions) séparés par une ligne vide, ou 16 lignes.` };
  }
  const lignes = brut.split('\n').map(l => l.trim()).filter(Boolean);
  if (lignes.length !== n) return { erreur: `${lignes.length} ligne(s) trouvée(s), ${n} attendues (un item par ligne).` };
  return { titres: lignes.map(sansNumero) };
}

function afficherEtatIntitules() {
  const e = ECHELLES[echelleCourante];
  const perso = intitules[echelleCourante];
  const t = intitulesEchelle(echelleCourante);
  $('echIntitulesEtat').innerHTML = perso
    ? `<span class="badge bientot">intitulés personnalisés (${perso.titres.length})</span>`
    : t.titres ? `<span class="badge ok">${echapper(t.source || 'version intégrée')}</span>` : '<span class="badge bientot">non chargés</span>';
  $('echIntitulesAide').innerHTML = (echelleCourante === 'qids'
    ? `Pour remplacer les intitulés par une autre version de la ${e.nom} : un bloc par item, séparé du suivant par une ligne vide ;
       1<sup>re</sup> ligne = intitulé, puis les 4 propositions cotées 0, 1, 2 et 3 (une par ligne).`
    : `Pour remplacer les intitulés par une autre version de l’${e.nom} : un item par ligne, ${nbItemsEchelle(echelleCourante)} lignes.`)
    + (perso ? ' « Retirer » revient à la version intégrée.' : '');
  if (document.activeElement !== $('echIntitules')) {
    $('echIntitules').value = t.titres
      ? t.titres.map((titre, i) => (t.options ? `${i + 1}. ${titre}\n${t.options[i].map((o, k) => `${k} ${o}`).join('\n')}` : `${i + 1}. ${titre}`)).join(t.options ? '\n\n' : '\n')
      : '';
  }
}

function remplirRapide() {
  const e = ECHELLES[echelleCourante];
  const texte = $('echRapide').value.replace(/\s/g, '');
  // Items à remplir dans l'ordre (les items non cotés de l'EQ sont sautés quand ils sont masqués).
  const masques = echelleCourante === 'eq' && !eqNonCotesVisibles() ? e.nonCotes : [];
  const positions = intervalle(0, nbItemsEchelle(echelleCourante) - 1).filter(i => !masques.includes(i + 1));
  let k = 0, ignores = 0;
  for (const c of texte) {
    if (k >= positions.length) { ignores++; continue; }
    if (c === '.' || c === '-' || c === '_') { reponses[positions[k++]] = null; continue; }
    const v = e.chiffreVersIndice(c);
    if (v === undefined) { ignores++; continue; }
    reponses[positions[k++]] = v;                                // null = pas de réponse (« 5 » pour l'AQ et l'EQ)
  }
  afficherItems();
  afficherResultat();
  const n = positions.length;
  $('echAideRapide').textContent = `${k} item(s) rempli(s)` + (ignores ? `, ${ignores} caractère(s) ignoré(s)` : '')
    + (k < n ? ` ; il reste ${n - k} item(s) à saisir.` : '.') + (masques.length ? ' (items non cotés masqués : sautés)' : '');
}

function afficherResultat() {
  const e = ECHELLES[echelleCourante];
  const res = CALCULS[echelleCourante](reponses);
  const pct = Math.round(res.total / res.max * 100);
  const patient = patients.find(p => p.id === echPatientId);

  $('echResultat').innerHTML = `
    <div class="sec">${echapper(e.nom)}</div>
    <div class="ech-total"><b>${res.total}</b><span> / ${res.max}</span></div>
    <div class="ech-jauge"><i class="${res.niveau}" style="width:${pct}%"></i></div>
    <p><span class="badge ${res.niveau}">${echapper(res.interpretation)}</span></p>
    ${res.manquants.length ? `<p class="texte-bientot">${res.manquants.length} item(s) non répondu(s) : ${res.manquants.slice(0, 20).join(', ')}${res.manquants.length > 20 ? '…' : ''}. ${echapper(res.noteManquants || 'Score provisoire (items sans réponse comptés 0).')}</p>` : '<p class="sec">Questionnaire complet.</p>'}
    ${res.alertes.map(a => `<p class="vig">⚠ ${echapper(a)}</p>`).join('')}
    ${res.sous.length ? `<table class="ech-sous"><tbody>${res.sous.map(s => `
      <tr><td>${echapper(s.nom)}</td><td><b>${s.score}</b>/${s.max}${s.sur7 !== undefined && s.sur7 !== null ? `<div class="sec">${String(s.sur7).replace('.', ',')} /7 items</div>` : ''}</td>
      <td>${s.seuil !== undefined ? (s.atteint ? `<span class="badge retard">≥ ${s.seuil}</span>` : `<span class="sec">seuil ≥ ${s.seuil}</span>`) : ''}</td></tr>`).join('')}</tbody></table>` : ''}
    <div class="act" style="flex-wrap:wrap">
      <button type="button" class="main" id="echEnregistrer" ${patient ? '' : 'disabled title="Choisissez un patient"'}>Enregistrer dans la fiche</button>
      <button type="button" id="echCopier">Copier le résumé</button>
      <span class="sec" id="echMsg"></span>
    </div>
    <p class="sec">Outil de dépistage et de suivi : ne pose pas de diagnostic.</p>`;
}

function enregistrerScore() {
  const patient = patients.find(p => p.id === echPatientId);
  if (!patient) return;
  const date = $('echDate').value || aujourdhuiIso();
  const res = CALCULS[echelleCourante](reponses);
  if (res.manquants.length && !confirm(`${res.manquants.length} item(s) non répondu(s). Enregistrer quand même ce score provisoire ?`)) return;

  patient.ech = patient.ech || [];
  patient.ech.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    echelle: echelleCourante, date,
    total: res.total, max: res.max,
    sous: res.sous.map(s => [s.nom, s.score, s.max]),
    interpretation: res.interpretation,
    manquants: res.manquants.length,
    rep: [...reponses],
  });
  patient.ech.sort((a, b) => (a.date < b.date ? -1 : 1));
  sauvegarderPatients();
  afficherHistoriqueEchelles();
  signaler($('echMsg'), 'Enregistré dans la fiche.');
}

function afficherHistoriqueEchelles() {
  const patient = patients.find(p => p.id === echPatientId);
  afficherResultat();
  if (!patient) {
    $('echHistorique').innerHTML = '<p class="sec">Choisissez un patient pour enregistrer les scores et voir leur évolution.</p>';
    return;
  }
  const liste = [...(patient.ech || [])].reverse();
  const parEchelle = {};
  (patient.ech || []).forEach(s => { (parEchelle[s.echelle] = parEchelle[s.echelle] || []).push(s); });
  const courbes = Object.entries(parEchelle).filter(([, l]) => l.length >= 2)
    .map(([id, l]) => `<div class="courbe-echelle"><div class="sec"><b>${echapper(ECHELLES[id].nom)}</b> · évolution</div>${courbeScores(l, ECHELLES[id])}</div>`).join('');
  $('echHistorique').innerHTML = (courbes ? `<div class="courbes-echelles">${courbes}</div>` : '') + (liste.length ? `
    <div class="wrap"><table style="min-width:640px"><thead><tr><th>Date</th><th>Échelle</th><th>Score</th><th>Interprétation</th><th></th></tr></thead><tbody>
    ${liste.map(s => `<tr style="cursor:default">
      <td>${formaterDate(s.date)}</td><td>${echapper(ECHELLES[s.echelle].nom)}</td>
      <td><b>${s.total}</b>/${s.max}${s.manquants ? ` <span class="texte-bientot">(${s.manquants} manquant(s))</span>` : ''}</td>
      <td class="sec">${echapper(s.interpretation)}</td>
      <td style="white-space:nowrap"><button type="button" data-action="recharger" data-id="${s.id}">Revoir</button>
        <button type="button" class="danger" data-action="supprimer" data-id="${s.id}">Supprimer</button></td></tr>`).join('')}
    </tbody></table></div>` : `<p class="sec">Aucun score enregistré pour ${echapper(nomPatient(patient))}.</p>`);
}

/** Courbe des scores d'une échelle dans le temps (axe des dates proportionnel). */
function courbeScores(liste, e) {
  const L = 420, H = 150, G = 34, D = 10, Hh = 12, B = 24;
  const t = liste.map(s => jourNum(s.date));
  const t0 = Math.min(...t), t1 = Math.max(...t) === t0 ? t0 + 1 : Math.max(...t);
  const max = liste[0].max;
  const X = d => G + (d - t0) / (t1 - t0) * (L - G - D);
  const Y = v => Hh + (1 - v / max) * (H - Hh - B);
  const pts = liste.map(s => `${X(jourNum(s.date)).toFixed(1)},${Y(s.total).toFixed(1)}`);
  const seuils = { qids: [6, 11, 16, 21], phq9: [5, 10, 15, 20], gad7: [5, 10, 15], aq: [26, 32], eq: [30], raads: [65] }[Object.keys(ECHELLES).find(k => ECHELLES[k] === e)] || [];
  return `<svg viewBox="0 0 ${L} ${H}" class="courbe-scores" role="img" aria-label="Évolution des scores">
    ${seuils.map(v => `<line x1="${G}" x2="${L - D}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-dasharray="4 4"/><text x="${G - 4}" y="${Y(v) + 3}" font-size="9" text-anchor="end" fill="var(--mute)">${v}</text>`).join('')}
    <line x1="${G}" x2="${L - D}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line)"/>
    <text x="${G - 4}" y="${Y(max) + 3}" font-size="9" text-anchor="end" fill="var(--mute)">${max}</text>
    <polyline points="${pts.join(' ')}" fill="none" stroke="var(--pri)" stroke-width="2.2" stroke-linejoin="round"/>
    ${liste.map((s, i) => `<circle cx="${pts[i].split(',')[0]}" cy="${pts[i].split(',')[1]}" r="4" fill="var(--pri)"><title>${formaterDate(s.date)} : ${s.total}/${s.max}</title></circle>
      <text x="${pts[i].split(',')[0]}" y="${+pts[i].split(',')[1] - 8}" font-size="10" text-anchor="middle" fill="var(--ink)">${s.total}</text>`).join('')}
    <text x="${G}" y="${H - 6}" font-size="10" fill="var(--mute)">${formaterDate(liste[0].date)}</text>
    <text x="${L - D}" y="${H - 6}" font-size="10" text-anchor="end" fill="var(--mute)">${formaterDate(liste[liste.length - 1].date)}</text>
  </svg>`;
}

/* ---------------------------------------------------------------------
   MODE TABLETTE : le patient répond lui-même, un item à la fois, en plein
   écran, sans voir le score ni le reste du portail. Les réponses arrivent
   dans la saisie en cours ; le médecin enregistre ensuite dans la fiche.
   --------------------------------------------------------------------- */
let tabletteIndex = 0;
function itemsTablette() {
  const e = ECHELLES[echelleCourante];
  const masques = echelleCourante === 'eq' && !eqNonCotesVisibles() ? e.nonCotes : [];
  return intervalle(0, nbItemsEchelle(echelleCourante) - 1).filter(i => !masques.includes(i + 1));
}
function ouvrirModeTablette() {
  let fond = $('tablette');
  if (!fond) {
    fond = document.createElement('div');
    fond.id = 'tablette';
    fond.className = 'tablette';
    document.body.appendChild(fond);
    fond.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.v !== undefined) {
        const items = itemsTablette();
        reponses[items[tabletteIndex]] = +b.dataset.v;
        if (tabletteIndex < items.length - 1) { tabletteIndex++; setTimeout(afficherItemTablette, 160); }
        else afficherFinTablette();
        b.classList.add('on');
      }
      if (b.dataset.nav === 'prec' && tabletteIndex > 0) { tabletteIndex--; afficherItemTablette(); }
      if (b.dataset.nav === 'suiv') { const items = itemsTablette(); if (tabletteIndex < items.length - 1) { tabletteIndex++; afficherItemTablette(); } else afficherFinTablette(); }
      if (b.dataset.nav === 'quitter' && confirm('Interrompre la passation ? Les réponses déjà données sont conservées.')) fermerModeTablette();
      if (b.dataset.nav === 'rendre') fermerModeTablette();
    });
  }
  const items = itemsTablette();
  const premiereVide = items.findIndex(i => reponses[i] === null || reponses[i] === undefined);
  tabletteIndex = premiereVide === -1 ? 0 : premiereVide;
  fond.hidden = false;
  document.body.classList.add('mode-tablette');
  try { document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); } catch (erreur) { /* ignoré */ }
  afficherItemTablette();
}
function afficherItemTablette() {
  const e = ECHELLES[echelleCourante];
  const items = itemsTablette();
  const i = items[tabletteIndex];
  const textes = intitulesEchelle(echelleCourante);
  const titre = (textes.titres && textes.titres[i]) || (e.items ? e.items[i] : 'Item ' + (i + 1));
  const propositions = echelleCourante === 'qids' && textes.options ? textes.options[i] : null;
  const libelles = propositions || e.choix;
  $('tablette').innerHTML = `
    <div class="tablette-haut"><span>${echapper(e.nom)}${e.periode ? ' · ' + echapper(e.periode) : ''}</span>
      <span>${tabletteIndex + 1} / ${items.length}</span>
      <button type="button" data-nav="quitter" class="tablette-quitter" aria-label="Interrompre">✕</button></div>
    <div class="tablette-progression"><i style="width:${Math.round(tabletteIndex / items.length * 100)}%"></i></div>
    <div class="tablette-item">${echapper(titre)}</div>
    <div class="tablette-choix">${libelles.map((l, v) => `<button type="button" data-v="${v}" class="${reponses[i] === v ? 'on' : ''}">${echapper(l)}</button>`).join('')}</div>
    <div class="tablette-bas"><button type="button" data-nav="prec" ${tabletteIndex === 0 ? 'disabled' : ''}>← Précédent</button>
      <button type="button" data-nav="suiv">${tabletteIndex === items.length - 1 ? 'Terminer' : 'Passer →'}</button></div>`;
}
function afficherFinTablette() {
  $('tablette').innerHTML = `<div class="tablette-fin"><div class="tablette-item">Merci, le questionnaire est terminé.</div>
    <p>Vous pouvez rendre la tablette à votre médecin.</p>
    <button type="button" data-nav="rendre" class="main">Rendre au médecin</button></div>`;
}
function fermerModeTablette() {
  $('tablette').hidden = true;
  document.body.classList.remove('mode-tablette');
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (erreur) { /* ignoré */ }
  afficherItems();
  afficherResultat();
}

/** Résumé des derniers scores d'un patient (fiche patient, certificat MDPH). */
function derniersScores(patient) {
  const derniers = {};
  (patient.ech || []).forEach(s => { derniers[s.echelle] = s; });            // liste triée par date
  return Object.values(derniers);
}
function texteScore(s) {
  return `${ECHELLES[s.echelle].nom} (${formaterDate(s.date)}) : ${s.total}/${s.max}, ${s.interpretation}`
    + (s.sous && s.sous.length && s.echelle !== 'qids' ? ' ; ' + s.sous.map(([n, v, m]) => `${n} ${v}/${m}`).join(', ') : '');
}
