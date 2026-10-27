/* =====================================================================
   OUTILS.JS — petites fonctions utilitaires (dates, texte)
   Rien à régler ici. Utilisé par tous les autres fichiers.
   ===================================================================== */

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Raccourci : récupère un élément de la page par son id. */
const $ = id => document.getElementById(id);

/** Protège un texte avant de l'insérer dans du HTML (évite toute injection). */
function echapper(texte) {
  const remplacements = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(texte ?? '').replace(/[&<>"']/g, caractere => remplacements[caractere]);
}

/* ---------- Dates ----------
   Dans les fiches, les dates sont des textes « AAAA-MM-JJ » (format des
   champs date HTML). Ces fonctions les convertissent en vraies dates. */

/** Aujourd'hui à minuit (heure locale). */
function aujourdhui() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/** « 2026-03-15 » → objet Date (ou null si vide). */
function versDate(texteIso) {
  return texteIso ? new Date(texteIso + 'T00:00') : null;
}

/** Objet Date → « 2026-03-15 » (heure locale). */
function versIso(date) {
  const decalage = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - decalage).toISOString().slice(0, 10);
}

/** Ajoute (ou retire, si négatif) un nombre de jours à une date. */
function ajouterJours(date, jours) {
  const resultat = new Date(date);
  resultat.setDate(resultat.getDate() + Math.round(jours));
  return resultat;
}

/** « 2026-03-15 » → « 15/03/2026 » (affichage). */
function formaterDate(texteIso) {
  return texteIso ? versDate(texteIso).toLocaleDateString('fr-FR') : '';
}

/** Âge en années à partir d'une date de naissance « AAAA-MM-JJ ». */
function calculerAge(texteIso) {
  return texteIso ? Math.floor((Date.now() - new Date(texteIso)) / 31557600000) : '';
}

/** Remplit une liste déroulante.
 *  options = [[valeur, texte], …] ; premiereOption = texte d'une entrée « tous » (facultatif). */
function remplirSelect(select, options, premiereOption) {
  const entetes = premiereOption ? `<option value="">${premiereOption}</option>` : '';
  select.innerHTML = entetes + options
    .map(([valeur, texte]) => `<option value="${echapper(valeur)}">${echapper(texte)}</option>`)
    .join('');
}

/* ---------- Ajouts du portail unifié (courbe, échelles, MDPH) ---------- */

/** « DUPONT Marie » à partir d'une fiche. */
function nomPatient(patient) {
  return patient ? `${(patient.nom || '').toUpperCase()} ${patient.prenom || ''}`.trim() : '';
}

/** Remplit une liste déroulante de patients (triés par nom).
 *  texteVide = libellé d'une première option vide (facultatif). */
function remplirSelectPatients(select, valeur, texteVide) {
  const tries = [...patients].sort((a, b) => nomPatient(a).localeCompare(nomPatient(b), 'fr'));
  remplirSelect(select, tries.map(p => [p.id, nomPatient(p) + (p.dossier ? ' · ' + p.dossier : '')]), texteVide);
  select.value = tries.some(p => p.id === valeur) ? valeur : (texteVide ? '' : (tries[0] ? tries[0].id : ''));
}

/** Imprime un document HTML seul (le reste de la page est masqué à l'impression).
 *  Réutilise la zone d'impression de l'ordonnance. */
function imprimerDocument(html) {
  $('zoneOrdonnance').innerHTML = html;
  document.body.classList.add('impression-ordonnance');
  const nettoyer = () => {
    document.body.classList.remove('impression-ordonnance');
    $('zoneOrdonnance').innerHTML = '';
    window.removeEventListener('afterprint', nettoyer);
  };
  window.addEventListener('afterprint', nettoyer);
  print();
}

/** Copie un texte dans le presse-papiers ; renvoie une promesse (true si réussi). */
function copierTexte(texte) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texte).then(() => true, () => copierTexteAncien(texte));
  }
  return Promise.resolve(copierTexteAncien(texte));
}
function copierTexteAncien(texte) {
  const zone = document.createElement('textarea');
  zone.value = texte;
  zone.style.position = 'fixed'; zone.style.opacity = '0';
  document.body.appendChild(zone);
  zone.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (erreur) { ok = false; }
  zone.remove();
  return ok;
}

/** Petit message temporaire à côté d'un bouton. */
function signaler(element, texte) {
  if (!element) return;
  element.textContent = texte;
  clearTimeout(element._minuteur);
  element._minuteur = setTimeout(() => { element.textContent = ''; }, 3500);
}

/** Date du jour au format « AAAA-MM-JJ » (heure locale). */
const aujourdhuiIso = () => versIso(aujourdhui());

/** Traitements en cours d'un patient : { psy: [...], somat: [...] } (textes « molécule posologie »). */
function traitementsActifs(patient) {
  const actifs = (patient.trt || []).filter(t => t.nom && !t.fin);
  const texte = t => `${t.nom}${t.dose ? ' ' + t.dose : ''}`;
  return { psy: actifs.filter(t => t.g !== 'somat').map(texte), somat: actifs.filter(t => t.g === 'somat').map(texte) };
}
/** Texte des traitements en cours, les non psychiatriques à part. separateur = ' ; ' ou '\n'. */
function texteTraitements(patient, separateur = ' ; ') {
  const { psy, somat } = traitementsActifs(patient);
  return [psy.join(separateur), somat.length ? 'Traitements non psychiatriques : ' + somat.join(separateur) : ''].filter(Boolean).join(separateur === '\n' ? '\n' : '. ');
}

/** Étiquette « Relais vers interne / sénior » (partie relais de la fiche). */
function etiquetteRelaisVers(p) {
  if (!p || !p.relaisVers) return '';
  const v = p.relaisVers.toLowerCase();
  const classe = v.includes('sénior') || v.includes('senior') ? 'senior' : v.includes('interne') ? 'interne' : '';
  return `<div><span class="etiquette-relais ${classe}">Vers ${echapper(v)}</span></div>`;
}
