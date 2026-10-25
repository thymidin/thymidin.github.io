/* =====================================================================
   HUMEUR.JS — courbe de l'humeur (life chart) de chaque patient
   ---------------------------------------------------------------------
   Reprend l'ancienne application « Courbe de l'humeur », rattachée
   désormais à une fiche patient :
     - humeur jour par jour (ou par période), sommeil, instabilité,
       caractéristiques mixtes, notes ;
     - traitements : ceux de la fiche patient s'affichent automatiquement
       (introduction → arrêt) ; on peut ajouter des traitements anciens
       qui ne sont pas dans la fiche ;
     - scores QIDS-SR16 enregistrés dans l'onglet Échelles, en repère.

   Données enregistrées dans la fiche : patient.humeur = { mood: {date: {...}}, tx: [...] }
   (même format que l'ancienne application : son export JSON s'importe ici).
   ===================================================================== */

const NIVEAUX_HUMEUR = [
  { v: 3,  s: 'Manie',         l: 'Épisode maniaque',         c: '#d9480f' },
  { v: 2,  s: 'Hypomanie',     l: 'Épisode hypomaniaque',     c: '#f08c00' },
  { v: 1,  s: 'Infraclin. ↑',  l: 'Infraclinique (élevé)',    c: '#f2c230' },
  { v: 0,  s: 'Euthymie',      l: 'Euthymie',                 c: '#2f9e44' },
  { v: -1, s: 'Infraclin. ↓',  l: 'Infraclinique (abaissé)',  c: '#74c0fc' },
  { v: -2, s: 'Dépr. légère',  l: 'Dépression légère',        c: '#4c8dff' },
  { v: -3, s: 'Dépr. modérée', l: 'Dépression modérée',       c: '#3b5bdb' },
  { v: -4, s: 'Dépr. sévère',  l: 'Dépression sévère',        c: '#2b2d8f' },
];
const COULEURS_TRAITEMENTS = ['#7048e8', '#0c8599', '#c2255c', '#5c940d', '#e67700', '#1971c2', '#862e9c', '#495057'];
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Dates en « numéro de jour » (UTC) pour des calculs simples et sans décalage horaire.
const jourNum = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;
const numJour = n => new Date(n * 864e5).toISOString().slice(0, 10);
const niveauHumeur = v => NIVEAUX_HUMEUR.find(l => l.v === v);

let humPatientId = '';
let humPeriode = 180;
let humNiveau = null;

const patientHumeur = () => patients.find(p => p.id === humPatientId);
function donneesHumeur(patient) {
  if (!patient.humeur || typeof patient.humeur !== 'object') patient.humeur = { mood: {}, tx: [] };
  patient.humeur.mood = patient.humeur.mood || {};
  patient.humeur.tx = patient.humeur.tx || [];
  return patient.humeur;
}

/** Traitements à tracer : ceux de la fiche (avec une date de début) + ceux ajoutés ici. */
function traitementsFrise(patient) {
  const deFiche = (patient.trt || [])
    .filter(t => t.nom && (t.intro || t.reprise) && t.g !== 'somat')     // traitements psychiatriques seulement
    .map((t, i) => ({
      id: 'fiche' + i, nom: t.nom, dose: t.dose || '', debut: t.intro || t.reprise, fin: t.fin || '',
      couleur: COULEURS_TRAITEMENTS[i % COULEURS_TRAITEMENTS.length], fiche: true,
      approx: !t.intro,
    }));
  const ajoutes = donneesHumeur(patient).tx.map(t => ({
    id: t.id, nom: t.name, dose: t.dose || '', debut: t.start, fin: t.end || '', couleur: t.color || '#495057', fiche: false,
  }));
  return [...deFiche, ...ajoutes];
}


/* ---------- Structure de l'onglet ---------- */
function htmlVueHumeur() {
  return `
  <div class="carte">
    <div class="bar" style="margin-top:0">
      <label for="humPatient" style="margin:0">Patient</label>
      <select id="humPatient" style="max-width:340px"></select>
      <span id="humPeriodes" class="groupe-boutons"></span>
      <span class="sp" style="flex:1"></span>
      <button type="button" id="humImprimer">Imprimer la courbe</button>
    </div>
    <div class="defile"><svg id="humGraphe" class="frise" role="img" aria-label="Courbe de l’humeur"></svg></div>
    <div class="puces" id="humStats"></div>
  </div>

  <div class="hum-grille">
    <div class="carte">
      <h3 class="h3">Saisir l’humeur</h3>
      <div class="g">
        <div><label for="humDebut">Date (ou début de période)</label><input type="date" id="humDebut"></div>
        <div><label for="humFin">Fin de période (facultatif)</label><input type="date" id="humFin"></div>
      </div>
      <label style="margin-top:10px">Niveau d’humeur (un clic sur une barre du graphique recharge le jour)</label>
      <div id="humNiveaux" class="hum-niveaux"></div>
      <div class="g" style="margin-top:8px">
        <div><label for="humSommeil">Sommeil (heures)</label><input type="number" id="humSommeil" min="0" max="24" step="0.5"></div>
        <div><label for="humInstab">Instabilité émotionnelle / irritabilité</label>
          <select id="humInstab"><option value="0">Aucune</option><option value="1">Légère</option><option value="2">Modérée</option><option value="3">Forte</option></select></div>
        <div class="full chk"><input type="checkbox" id="humMixte"><label for="humMixte">Caractéristiques mixtes</label></div>
        <div class="full"><label for="humNotes">Notes (facteurs déclenchants, événements de vie…)</label><input id="humNotes"></div>
      </div>
      <div class="act"><button type="button" class="main" id="humEnregistrer">Enregistrer</button>
        <button type="button" id="humSupprimer">Supprimer ces jours</button><span class="sec" id="humMsg"></span></div>
      <p class="sec">Une période remplit chaque jour de l’intervalle avec le même niveau : pratique pour un épisode entier.</p>
    </div>

    <div class="carte">
      <h3 class="h3">Traitements sur la frise</h3>
      <p class="sec">Les traitements de la fiche patient (date d’introduction → arrêt) s’affichent automatiquement.
      Ajoutez ici les traitements antérieurs qui n’y figurent pas.</p>
      <div class="g">
        <div><label for="humTxNom">Molécule</label><input id="humTxNom" list="listeMolecules"></div>
        <div><label for="humTxDose">Dose</label><input id="humTxDose"></div>
        <div><label for="humTxDebut">Début</label><input type="date" id="humTxDebut"></div>
        <div><label for="humTxFin">Fin (vide = en cours)</label><input type="date" id="humTxFin"></div>
      </div>
      <div class="act"><button type="button" id="humTxAjouter">Ajouter</button><span class="sec" id="humTxMsg"></span></div>
      <div id="humTxListe"></div>

      <details class="src" style="margin-top:14px">
        <summary>Importer / exporter (ancienne application « Courbe de l’humeur »)</summary>
        <p>Dans l’ancienne courbe : onglet « Données », bouton « Exporter (JSON) », copiez le texte et collez-le ci-dessous.
        Les jours sont fusionnés dans la courbe du patient choisi (un jour déjà saisi est remplacé).</p>
        <textarea id="humJson" rows="4" spellcheck="false" placeholder='{"mood":{…},"tx":[…]}'></textarea>
        <div class="act"><button type="button" id="humImporter">Importer dans ce patient</button>
          <button type="button" id="humExporter">Exporter ce patient (JSON)</button><span class="sec" id="humJsonMsg"></span></div>
      </details>
    </div>
  </div>`;
}

function initialiserHumeur() {
  $('vueHumeur').innerHTML = htmlVueHumeur();
  $('humDebut').value = aujourdhuiIso();
  $('humPatient').onchange = () => { humPatientId = $('humPatient').value; viderSaisieHumeur(); dessinerHumeur(); };

  $('humPeriodes').onclick = e => {
    const b = e.target.closest('button[data-p]');
    if (!b) return;
    humPeriode = +b.dataset.p;
    afficherPeriodes();
    dessinerHumeur();
  };
  $('humNiveaux').onclick = e => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    humNiveau = +b.dataset.v;
    afficherNiveaux();
  };
  $('humGraphe').onclick = e => {
    const d = e.target.dataset && e.target.dataset.d;
    if (d) { chargerJour(d); $('humDebut').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
  $('humDebut').onchange = () => {
    const p = patientHumeur();
    if (p && donneesHumeur(p).mood[$('humDebut').value]) chargerJour($('humDebut').value);
  };
  $('humEnregistrer').onclick = enregistrerHumeur;
  $('humSupprimer').onclick = supprimerHumeur;
  $('humTxAjouter').onclick = ajouterTraitementFrise;
  $('humTxListe').onclick = e => {
    const id = e.target.dataset && e.target.dataset.retirer;
    const p = patientHumeur();
    if (!id || !p) return;
    donneesHumeur(p).tx = donneesHumeur(p).tx.filter(t => t.id !== id);
    sauvegarderPatients();
    dessinerHumeur();
  };
  $('humImporter').onclick = importerHumeur;
  $('humExporter').onclick = () => {
    const p = patientHumeur();
    if (!p) return;
    const h = donneesHumeur(p);
    $('humJson').value = JSON.stringify({ mood: h.mood, tx: h.tx });
    $('humJson').select();
    signaler($('humJsonMsg'), 'Copiez ce texte pour le sauvegarder.');
  };
  $('humImprimer').onclick = imprimerHumeur;

  afficherPeriodes();
  afficherNiveaux();
}

/** Ouvre l'onglet (appelé par interface.js), éventuellement sur un patient donné. */
function afficherVueHumeur(idPatient) {
  if (idPatient !== undefined) humPatientId = idPatient;
  remplirSelectPatients($('humPatient'), humPatientId);
  humPatientId = $('humPatient').value;
  dessinerHumeur();
}

function afficherPeriodes() {
  const periodes = [[30, '1 mois'], [90, '3 mois'], [180, '6 mois'], [365, '1 an'], [0, 'Tout']];
  $('humPeriodes').innerHTML = periodes.map(([n, t]) => `<button type="button" data-p="${n}" class="${n === humPeriode ? 'on' : ''}">${t}</button>`).join('');
}
function afficherNiveaux() {
  $('humNiveaux').innerHTML = NIVEAUX_HUMEUR.map(l =>
    `<button type="button" data-v="${l.v}" class="${humNiveau === l.v ? 'on' : ''}" style="border-left-color:${l.c}">${l.l}</button>`).join('');
}
function viderSaisieHumeur() {
  humNiveau = null;
  $('humSommeil').value = ''; $('humInstab').value = '0'; $('humMixte').checked = false; $('humNotes').value = '';
  afficherNiveaux();
}
function chargerJour(d) {
  const p = patientHumeur();
  if (!p) return;
  const e = donneesHumeur(p).mood[d];
  $('humDebut').value = d; $('humFin').value = '';
  if (e) {
    humNiveau = e.v;
    $('humSommeil').value = e.sl ?? '';
    $('humInstab').value = e.ir || 0;
    $('humMixte').checked = !!e.mx;
    $('humNotes').value = e.n || '';
  }
  afficherNiveaux();
}
function intervalleSaisi() {
  const a = $('humDebut').value, b = $('humFin').value || a;
  if (!a) return null;
  let x = jourNum(a), y = jourNum(b);
  if (y < x) [x, y] = [y, x];
  return y - x > 1500 ? null : [x, y];
}

function enregistrerHumeur() {
  const p = patientHumeur();
  if (!p) return signaler($('humMsg'), 'Choisissez d’abord un patient.');
  const plage = intervalleSaisi();
  if (!plage) return signaler($('humMsg'), 'Choisissez une date valide (période de 4 ans maximum).');
  if (humNiveau === null) return signaler($('humMsg'), 'Choisissez un niveau d’humeur.');
  const sommeil = $('humSommeil').value;
  const h = donneesHumeur(p);
  for (let n = plage[0]; n <= plage[1]; n++) {
    h.mood[numJour(n)] = {
      v: humNiveau, sl: sommeil === '' ? null : +sommeil, ir: +$('humInstab').value,
      mx: $('humMixte').checked, n: $('humNotes').value.trim(),
    };
  }
  sauvegarderPatients();
  dessinerHumeur();
  signaler($('humMsg'), plage[1] > plage[0] ? `${plage[1] - plage[0] + 1} jours enregistrés.` : 'Enregistré.');
}
function supprimerHumeur() {
  const p = patientHumeur();
  const plage = intervalleSaisi();
  if (!p || !plage) return signaler($('humMsg'), 'Choisissez une date.');
  const h = donneesHumeur(p);
  for (let n = plage[0]; n <= plage[1]; n++) delete h.mood[numJour(n)];
  sauvegarderPatients();
  dessinerHumeur();
  signaler($('humMsg'), 'Supprimé.');
}

function ajouterTraitementFrise() {
  const p = patientHumeur();
  if (!p) return signaler($('humTxMsg'), 'Choisissez d’abord un patient.');
  const nom = $('humTxNom').value.trim(), debut = $('humTxDebut').value, fin = $('humTxFin').value;
  if (!nom || !debut) return signaler($('humTxMsg'), 'Molécule et date de début requises.');
  if (fin && fin < debut) return signaler($('humTxMsg'), 'La fin précède le début.');
  const h = donneesHumeur(p);
  h.tx.push({
    id: Date.now() + Math.random().toString(36).slice(2, 6), name: nom, dose: $('humTxDose').value.trim(),
    start: debut, end: fin, color: COULEURS_TRAITEMENTS[(traitementsFrise(p).length) % COULEURS_TRAITEMENTS.length],
  });
  $('humTxNom').value = ''; $('humTxDose').value = ''; $('humTxDebut').value = ''; $('humTxFin').value = '';
  sauvegarderPatients();
  dessinerHumeur();
  signaler($('humTxMsg'), 'Ajouté.');
}

function importerHumeur() {
  const p = patientHumeur();
  if (!p) return signaler($('humJsonMsg'), 'Choisissez d’abord un patient.');
  let o;
  try { o = JSON.parse($('humJson').value); } catch (erreur) { return signaler($('humJsonMsg'), 'Texte JSON invalide.'); }
  if (!o || typeof o.mood !== 'object' || !Array.isArray(o.tx)) return signaler($('humJsonMsg'), 'Ce n’est pas un export de la courbe de l’humeur.');
  const jours = Object.keys(o.mood).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && niveauHumeur(o.mood[d] && o.mood[d].v));
  if (!confirm(`Importer ${jours.length} jour(s) et ${o.tx.length} traitement(s) dans la courbe de ${nomPatient(p)} ?`)) return;
  const h = donneesHumeur(p);
  jours.forEach(d => { h.mood[d] = o.mood[d]; });
  const idsConnus = new Set(h.tx.map(t => t.id));
  o.tx.filter(t => t && t.name && t.start && !idsConnus.has(t.id)).forEach(t => h.tx.push(t));
  sauvegarderPatients();
  dessinerHumeur();
  $('humJson').value = '';
  signaler($('humJsonMsg'), 'Import réussi.');
}


/* ---------- Le graphique ---------- */
function svgHumeur(patient) {
  const h = donneesHumeur(patient);
  const txs0 = traitementsFrise(patient);
  const qids = (patient.ech || []).filter(s => s.echelle === 'qids');
  const jours = Object.keys(h.mood).sort();
  const auj = jourNum(aujourdhuiIso());
  const fin = Math.max(auj, jours.length ? jourNum(jours[jours.length - 1]) : 0);
  const debut = humPeriode ? fin - humPeriode + 1
    : Math.min(auj, ...jours.map(jourNum), ...txs0.map(t => jourNum(t.debut)), ...qids.map(s => jourNum(s.date)));
  const nbJours = fin - debut + 1;

  const W = 1000, G = 150, D = 10, H0 = 42, RH = 28, PH = RH * 8, largeur = W - G - D, bw = largeur / nbJours;
  const X = n => G + (n - debut) * bw;
  const Y = v => H0 + (3.5 - v) * RH;
  const txs = txs0.filter(t => jourNum(t.debut) <= fin && (!t.fin || jourNum(t.fin) >= debut))
    .sort((a, b) => (a.debut < b.debut ? -1 : 1));
  const yQ = H0 + PH + 34;                                 // ligne des scores QIDS
  const yT = yQ + 30;                                      // début des traitements
  const hauteur = yT + 18 + txs.length * 24 + 12;

  let o = `<defs><pattern id="hachures" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" fill="#fff" opacity=".6"/></pattern></defs>`;
  o += `<rect x="${G}" y="${H0}" width="${largeur}" height="${PH}" fill="var(--surf)" stroke="var(--line)"/>`;
  NIVEAUX_HUMEUR.forEach(l => {
    o += `<rect x="${G}" y="${Y(l.v + .5)}" width="${largeur}" height="${RH}" fill="${l.c}" opacity=".1"/>`
       + `<text x="${G - 8}" y="${Y(l.v) + 4}" text-anchor="end" font-size="11" fill="var(--mute)">${l.s}</text>`;
  });
  o += `<line x1="${G}" x2="${W - D}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--mute)" stroke-dasharray="4 4" opacity=".6"/>`;
  o += `<text x="${G - 8}" y="${H0 - 24}" text-anchor="end" font-size="11" fill="var(--mute)">Instabilité</text>`
     + `<text x="${G - 8}" y="${H0 - 6}" text-anchor="end" font-size="11" fill="var(--mute)">Caract. mixtes</text>`;

  // Graduations (lundis sur une période courte, 1er du mois sinon).
  const lundi = jourNum('2024-01-01') % 7;
  for (let n = debut; n <= fin; n++) {
    const d = numJour(n);
    let lib = '';
    if (nbJours <= 62) { if (n % 7 === lundi) lib = d.slice(8) + '/' + d.slice(5, 7); }
    else if (d.slice(8) === '01') lib = MOIS_COURTS[+d.slice(5, 7) - 1] + (d.slice(5, 7) === '01' ? ' ' + d.slice(0, 4) : '');
    if (lib) o += `<line x1="${X(n)}" x2="${X(n)}" y1="${H0}" y2="${H0 + PH}" stroke="var(--line)" opacity=".7"/>`
               + `<text x="${X(n) + 3}" y="${H0 + PH + 14}" font-size="11" fill="var(--mute)">${lib}</text>`;
  }

  // Barres d'humeur.
  const largeurBarre = Math.max(bw - (bw > 4 ? .6 : 0), .6).toFixed(2);
  for (let n = debut; n <= fin; n++) {
    const d = numJour(n), e = h.mood[d];
    if (!e) continue;
    const l = niveauHumeur(e.v);
    if (!l) continue;
    let y, ht;
    if (e.v > 0) { y = Y(e.v + .5); ht = Y(.5) - y; }
    else if (e.v === 0) { y = Y(.5); ht = RH; }
    else { y = Y(-.5); ht = Y(e.v - .5) - y; }
    const bulle = `${formaterDate(d)} — ${l.l}` + (e.sl != null && e.sl !== '' ? ` · sommeil ${e.sl} h` : '')
      + (e.ir > 0 ? ` · instabilité ${e.ir}/3` : '') + (e.mx ? ' · caractéristiques mixtes' : '') + (e.n ? ` · ${echapper(e.n)}` : '');
    o += `<rect data-d="${d}" x="${X(n).toFixed(2)}" y="${y}" width="${largeurBarre}" height="${ht}" fill="${l.c}" style="cursor:pointer"><title>${bulle}</title></rect>`;
    if (e.mx) {
      const cx = X(n) + bw / 2;
      o += `<rect x="${X(n).toFixed(2)}" y="${y}" width="${largeurBarre}" height="${ht}" fill="url(#hachures)" style="pointer-events:none"/>`
         + `<polygon points="${cx},${H0 - 13} ${cx + 4},${H0 - 9} ${cx},${H0 - 5} ${cx - 4},${H0 - 9}" fill="#9c36b5"><title>${formaterDate(d)} — caractéristiques mixtes</title></polygon>`;
    }
    if (e.ir > 0) o += `<circle cx="${(X(n) + bw / 2).toFixed(2)}" cy="${H0 - 29}" r="${Math.min(2 + e.ir * 1.3, Math.max(bw / 2, 2.5)).toFixed(1)}" fill="#e8590c" opacity=".85"><title>${formaterDate(d)} — instabilité ${e.ir}/3</title></circle>`;
  }

  // Scores QIDS-SR16.
  o += `<text x="${G - 8}" y="${yQ + 4}" text-anchor="end" font-size="11" fill="var(--mute)">QIDS-SR16</text>`
     + `<line x1="${G}" x2="${W - D}" y1="${yQ}" y2="${yQ}" stroke="var(--line)"/>`;
  qids.filter(s => jourNum(s.date) >= debut && jourNum(s.date) <= fin).forEach(s => {
    const cx = X(jourNum(s.date)) + bw / 2;
    const couleur = s.total >= 16 ? '#b3261e' : s.total >= 11 ? '#e67700' : s.total >= 6 ? '#4c8dff' : '#2f9e44';
    o += `<circle cx="${cx.toFixed(1)}" cy="${yQ}" r="9" fill="${couleur}"><title>QIDS-SR16 du ${formaterDate(s.date)} : ${s.total}/27, ${echapper(s.interpretation)}</title></circle>`
       + `<text x="${cx.toFixed(1)}" y="${yQ + 3.5}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#fff" style="pointer-events:none">${s.total}</text>`;
  });

  // Traitements.
  o += `<text x="${G - 8}" y="${yT + 4}" text-anchor="end" font-size="11" font-weight="600" fill="var(--ink)">Traitements</text>`;
  txs.forEach((t, i) => {
    const a = Math.max(jourNum(t.debut), debut), b = Math.min(t.fin ? jourNum(t.fin) : fin, fin);
    const x = X(a), w = Math.max((b - a + 1) * bw, 3), y = yT + 14 + i * 24;
    const nom = t.nom.length > 20 ? t.nom.slice(0, 19) + '…' : t.nom;
    o += `<text x="${G - 8}" y="${y + 13}" text-anchor="end" font-size="11" fill="var(--ink)">${echapper(nom)}</text>`
       + `<rect x="${x}" y="${y}" width="${w}" height="18" rx="4" fill="${echapper(t.couleur)}" ${t.approx ? 'opacity=".6"' : ''}>`
       + `<title>${echapper(t.nom)} ${echapper(t.dose)} (${formaterDate(t.debut)}${t.approx ? ', date de reprise' : ''} → ${t.fin ? formaterDate(t.fin) : 'en cours'})${t.fiche ? ' · fiche patient' : ''}</title></rect>`;
    if (t.dose && w > t.dose.length * 6.5 + 10) o += `<text x="${x + 6}" y="${y + 13}" font-size="10.5" fill="#fff" style="pointer-events:none">${echapper(t.dose)}</text>`;
  });
  if (!txs.length) o += `<text x="${G}" y="${yT + 4}" font-size="11" fill="var(--mute)">Aucun traitement daté sur la période</text>`;

  // Statistiques de la période.
  const compte = {}; let total = 0, mixtes = 0;
  for (let n = debut; n <= fin; n++) {
    const e = h.mood[numJour(n)];
    if (e) { compte[e.v] = (compte[e.v] || 0) + 1; total++; if (e.mx) mixtes++; }
  }
  const stats = total
    ? NIVEAUX_HUMEUR.filter(l => compte[l.v]).map(l => `<span class="puce"><i style="background:${l.c}"></i>${l.l} : ${compte[l.v]} j (${Math.round(100 * compte[l.v] / total)} %)</span>`).join('')
      + (mixtes ? `<span class="puce"><i style="background:#9c36b5"></i>dont caractéristiques mixtes : ${mixtes} j</span>` : '')
    : '<span class="puce">Aucune humeur saisie sur la période.</span>';

  return { svg: o, viewBox: `0 0 ${W} ${hauteur}`, stats, txs };
}

function dessinerHumeur() {
  const p = patientHumeur();
  if (!p) {
    $('humGraphe').setAttribute('viewBox', '0 0 1000 60');
    $('humGraphe').innerHTML = '<text x="20" y="35" font-size="14" fill="var(--mute)">Aucun patient : créez une fiche dans l’onglet « Suivi de la file active ».</text>';
    $('humStats').innerHTML = '';
    $('humTxListe').innerHTML = '';
    return;
  }
  const g = svgHumeur(p);
  $('humGraphe').setAttribute('viewBox', g.viewBox);
  $('humGraphe').innerHTML = g.svg;
  $('humStats').innerHTML = g.stats;

  const tous = traitementsFrise(p);
  $('humTxListe').innerHTML = tous.length ? `<table class="ech-sous"><tbody>${tous.map(t => `
    <tr><td><i class="pastille" style="background:${echapper(t.couleur)}"></i></td><td>${echapper(t.nom)} <span class="sec">${echapper(t.dose)}</span></td>
    <td class="sec">${formaterDate(t.debut)} → ${t.fin ? formaterDate(t.fin) : 'en cours'}</td>
    <td>${t.fiche ? '<span class="sec">fiche</span>' : `<button type="button" data-retirer="${echapper(t.id)}">Retirer</button>`}</td></tr>`).join('')}</tbody></table>`
    : '<p class="sec">Aucun traitement daté.</p>';
}

function imprimerHumeur() {
  const p = patientHumeur();
  if (!p) return;
  const g = svgHumeur(p);
  imprimerDocument(`
    <div class="doc">
      <h2 style="text-align:left">Courbe de l’humeur · ${echapper(nomPatient(p))}</h2>
      <p>${p.ddn ? 'Né(e) le ' + formaterDate(p.ddn) + ' · ' : ''}Édité le ${formaterDate(aujourdhuiIso())}</p>
      <svg class="frise" viewBox="${g.viewBox}" style="min-width:0">${g.svg}</svg>
      <div class="puces">${g.stats}</div>
    </div>`);
}
