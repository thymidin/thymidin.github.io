/* =====================================================================
   AGENDA.JS — planning des consultations (vues jour, semaine, mois)
   ---------------------------------------------------------------------
   Données (dans ce navigateur, incluses dans la sauvegarde chiffrée) :
     CLE_STOCKAGE + '_rdv'              liste des rendez-vous
     CLE_STOCKAGE + '_agendaReglages'   horaires, pas, jours affichés
   Un rendez-vous : { id, patientId | '', libelle, date 'AAAA-MM-JJ',
     debut 'HH:MM', duree (min), type, lieu, statut, notes, serie }
   Le champ « prochaine consultation » de la fiche est tenu à jour à
   partir de l'agenda.
   ===================================================================== */

const CLE_RDV = CLE_STOCKAGE + '_rdv';
const CLE_AGENDA_REGLAGES = CLE_STOCKAGE + '_agendaReglages';
const TYPES_RDV = {
  'Consultation de suivi': 'suivi',
  'Première consultation': 'premiere',
  'Consultation post-hospitalisation': 'posthospit',
  'Téléconsultation': 'teleconsult',
  'Injection retard / soin': 'soin',
  'Entretien familial': 'famille',
  'Visite à domicile': 'domicile',
  'Réunion, synthèse': 'reunion',
  'Indisponibilité': 'indispo',
};
const STATUTS_RDV = ['Prévu', 'Confirmé', 'Honoré', 'Non venu', 'Annulé (patient)', 'Annulé (praticien)'];
const LIEUX_RDV = ['Cabinet / bureau', 'CMP', 'Téléconsultation', 'Domicile', 'Service hospitalier'];
const REGLAGES_AGENDA_DEFAUT = { debut: '08:00', fin: '19:00', pas: 15, duree: 30, jours: 5 };
const HAUTEUR_PAS = 18;          // pixels par pas de temps (vue jour / semaine)
const JOURS_COURTS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

let agendaVue = 'semaine';       // 'jour', 'semaine', 'mois'
let agendaDate = aujourdhuiIso();
let rdvEdition = null;

/* ---------- Données ---------- */
function lireRdv() { try { const l = JSON.parse(localStorage.getItem(CLE_RDV) || '[]'); return Array.isArray(l) ? l : []; } catch (erreur) { return []; } }
function ecrireRdv(liste) {
  try { localStorage.setItem(CLE_RDV, JSON.stringify(liste)); } catch (erreur) { alert('Enregistrement impossible dans ce navigateur.'); }
}
function reglagesAgenda() {
  try { return { ...REGLAGES_AGENDA_DEFAUT, ...(JSON.parse(localStorage.getItem(CLE_AGENDA_REGLAGES) || '{}') || {}) }; }
  catch (erreur) { return { ...REGLAGES_AGENDA_DEFAUT }; }
}
const minutes = hhmm => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const hhmm = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const dateLocale = iso => { const [a, m, j] = iso.split('-').map(Number); return new Date(a, m - 1, j); };
const lundiDe = iso => { const d = dateLocale(iso); return versIso(ajouterJours(d, -((d.getDay() + 6) % 7))); };
const estActif = r => !/^Annulé/.test(r.statut || '');
const classeType = r => TYPES_RDV[r.type] || 'suivi';
const classeStatut = r => 'st-' + (r.statut || 'Prévu').normalize('NFD').replace(/[^A-Za-z]/g, '');

function rdvDuPatient(id) { return lireRdv().filter(r => r.patientId === id).sort((a, b) => (a.date + a.debut < b.date + b.debut ? -1 : 1)); }
/** Prochain rendez-vous actif d'un patient (aujourd'hui inclus). */
function prochainRdv(id) {
  const maintenant = aujourdhuiIso();
  return rdvDuPatient(id).find(r => estActif(r) && r.date >= maintenant && r.statut !== 'Honoré' && r.statut !== 'Non venu') || null;
}
function libelleRdv(r, court) {
  const p = r.patientId && patients.find(x => x.id === r.patientId);
  if (!p) return r.libelle || r.type || 'Rendez-vous';
  return court ? `${(p.nom || '').toUpperCase()} ${(p.prenom || '').charAt(0)}.` : nomPatient(p);
}
/** Met à jour le champ « prochaine consultation » des fiches concernées. */
function synchroniserProchain(ids) {
  let modif = false;
  ids.filter(Boolean).forEach(id => {
    const p = patients.find(x => x.id === id);
    if (!p) return;
    const r = prochainRdv(id);
    if (r && p.prochain !== r.date) { p.prochain = r.date; modif = true; }
  });
  if (modif) sauvegarderPatients();
}

/* ---------- Vue ---------- */
function htmlBarreAgenda() {
  const d = dateLocale(agendaDate);
  let titre;
  if (agendaVue === 'jour') titre = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  else if (agendaVue === 'mois') titre = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  else {
    const l = dateLocale(lundiDe(agendaDate)), f = ajouterJours(l, reglagesAgenda().jours - 1);
    titre = `${l.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${f.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return `
    <div class="agenda-barre">
      <div class="agenda-nav">
        <button type="button" data-ag="prec" title="Précédent" aria-label="Précédent">‹</button>
        <button type="button" data-ag="auj">Aujourd’hui</button>
        <button type="button" data-ag="suiv" title="Suivant" aria-label="Suivant">›</button>
        <h2 class="agenda-titre">${titre.charAt(0).toUpperCase() + titre.slice(1)}</h2>
      </div>
      <div class="agenda-outils">
        <div class="segments">${['jour', 'semaine', 'mois'].map(v => `<button type="button" data-ag-vue="${v}" class="${agendaVue === v ? 'on' : ''}">${v.charAt(0).toUpperCase() + v.slice(1)}</button>`).join('')}</div>
        <button type="button" class="main" data-ag="nouveau">+ Rendez-vous</button>
        <details class="menu-plus"><summary>Plus</summary><div class="menu-plus-liste">
          <button type="button" data-ag="imprimer">Imprimer la liste du jour</button>
          <button type="button" data-ag="ics">Exporter la période (.ics, initiales)</button>
          <button type="button" data-ag="reglages">Horaires et affichage…</button>
        </div></details>
      </div>
    </div>`;
}

function htmlGrille(jours) {
  const reg = reglagesAgenda();
  const debut = minutes(reg.debut), fin = minutes(reg.fin), pas = Number(reg.pas) || 15;
  const nbPas = Math.ceil((fin - debut) / pas);
  const auj = aujourdhuiIso();
  const tous = lireRdv();
  const lignesHeures = [];
  for (let m = debut; m < fin; m += 60) lignesHeures.push(`<div class="ag-heure" style="top:${((m - debut) / pas) * HAUTEUR_PAS}px">${hhmm(m)}</div>`);
  const maintenant = new Date(), minMaintenant = maintenant.getHours() * 60 + maintenant.getMinutes();
  const colonnes = jours.map(iso => {
    const d = dateLocale(iso);
    const liste = tous.filter(r => r.date === iso).sort((a, b) => minutes(a.debut) - minutes(b.debut));
    // Chevauchements : rendez-vous côte à côte.
    const pistes = [];
    liste.forEach(r => {
      const s = minutes(r.debut), e = s + (Number(r.duree) || 30);
      let i = pistes.findIndex(fin => fin <= s);
      if (i < 0) { i = pistes.length; pistes.push(0); }
      pistes[i] = e; r._piste = i;
    });
    const largeur = 100 / Math.max(1, pistes.length);
    const evts = liste.map(r => {
      const s = minutes(r.debut), duree = Number(r.duree) || 30;
      const top = Math.max(0, (s - debut) / pas) * HAUTEUR_PAS, h = Math.max(HAUTEUR_PAS - 2, (duree / pas) * HAUTEUR_PAS - 2);
      return `<button type="button" class="ag-rdv t-${classeType(r)} ${classeStatut(r)}" draggable="true" data-rdv="${r.id}"
        style="top:${top}px;height:${h}px;left:${r._piste * largeur}%;width:calc(${largeur}% - 3px)"
        title="${echapper(`${r.debut} · ${libelleRdv(r)} · ${r.type}${r.lieu ? ' · ' + r.lieu : ''} · ${r.statut || 'Prévu'}${r.notes ? '\n' + r.notes : ''}`)}">
        <b>${r.debut}</b> ${echapper(libelleRdv(r, true))}${h > 30 ? `<span>${echapper(r.type)}</span>` : ''}${r.statut === 'Honoré' ? ' ✓' : r.statut === 'Non venu' ? ' ✗' : ''}</button>`;
    }).join('');
    const ligneMaintenant = iso === auj && minMaintenant >= debut && minMaintenant <= fin ? `<div class="ag-maintenant" style="top:${((minMaintenant - debut) / pas) * HAUTEUR_PAS}px"></div>` : '';
    const ferme = d.getDay() === 0 || (d.getDay() === 6 && reg.jours < 6);
    return `<div class="ag-col ${iso === auj ? 'auj' : ''}">
      <div class="ag-col-tete ${iso === auj ? 'auj' : ''}" data-ag-jour="${iso}">${JOURS_COURTS[(d.getDay() + 6) % 7]} <b>${d.getDate()}</b>
        <span class="sec">${liste.filter(r => estActif(r) && r.type !== 'Indisponibilité').length || ''}</span></div>
      <div class="ag-col-corps ${ferme ? 'ferme' : ''}" data-ag-date="${iso}" style="height:${nbPas * HAUTEUR_PAS}px;--pas:${HAUTEUR_PAS}px;--heure:${(60 / pas) * HAUTEUR_PAS}px">${evts}${ligneMaintenant}</div>
    </div>`;
  }).join('');
  return `<div class="ag-grille" style="--nbjours:${jours.length}">
    <div class="ag-heures"><div class="ag-col-tete"></div><div class="ag-heures-corps" style="height:${nbPas * HAUTEUR_PAS}px">${lignesHeures.join('')}</div></div>
    ${colonnes}</div>`;
}

function htmlMois() {
  const d = dateLocale(agendaDate);
  const premier = new Date(d.getFullYear(), d.getMonth(), 1);
  const debut = dateLocale(lundiDe(versIso(premier)));
  const auj = aujourdhuiIso();
  const tous = lireRdv();
  let cases = '';
  for (let i = 0; i < 42; i++) {
    const jour = ajouterJours(debut, i), iso = versIso(jour);
    if (i >= 35 && jour.getMonth() !== d.getMonth()) break;
    const liste = tous.filter(r => r.date === iso).sort((a, b) => minutes(a.debut) - minutes(b.debut));
    cases += `<div class="ag-mois-case ${jour.getMonth() !== d.getMonth() ? 'hors' : ''} ${iso === auj ? 'auj' : ''}" data-ag-jour="${iso}">
      <div class="ag-mois-num">${jour.getDate()}</div>
      ${liste.slice(0, 4).map(r => `<button type="button" class="ag-mini t-${classeType(r)} ${classeStatut(r)}" data-rdv="${r.id}">${r.debut} ${echapper(libelleRdv(r, true))}</button>`).join('')}
      ${liste.length > 4 ? `<div class="sec">+ ${liste.length - 4} autre(s)</div>` : ''}</div>`;
  }
  return `<div class="ag-mois">${JOURS_COURTS.map(j => `<div class="ag-mois-tete">${j}</div>`).join('')}${cases}</div>`;
}

function statistiquesPeriode(jours) {
  const l = lireRdv().filter(r => jours.includes(r.date) && r.type !== 'Indisponibilité');
  const n = s => l.filter(r => r.statut === s).length;
  return `${l.filter(estActif).length} rendez-vous${n('Honoré') ? ` · ${n('Honoré')} honoré(s)` : ''}${n('Non venu') ? ` · <b class="texte-retard">${n('Non venu')} non venu(s)</b>` : ''}${l.length - l.filter(estActif).length ? ` · ${l.length - l.filter(estActif).length} annulé(s)` : ''}`;
}

function joursAffiches() {
  if (agendaVue === 'jour') return [agendaDate];
  if (agendaVue === 'mois') {
    const d = dateLocale(agendaDate), n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => versIso(new Date(d.getFullYear(), d.getMonth(), i + 1)));
  }
  const l = dateLocale(lundiDe(agendaDate));
  return Array.from({ length: reglagesAgenda().jours }, (_, i) => versIso(ajouterJours(l, i)));
}

function afficherAgenda() {
  const jours = joursAffiches();
  $('vueAgenda').innerHTML = `<div class="carte agenda">${htmlBarreAgenda()}
    <div class="agenda-stats sec">${statistiquesPeriode(jours)}</div>
    <div class="agenda-corps">${agendaVue === 'mois' ? htmlMois() : htmlGrille(jours)}</div>
    <p class="sec agenda-aide">Cliquer sur un créneau pour créer un rendez-vous · glisser un rendez-vous pour le déplacer · cliquer dessus pour le modifier, le marquer honoré ou non venu.</p></div>`;
  // Faire défiler jusqu'à l'heure courante (ou au début de journée).
  const corps = $('vueAgenda').querySelector('.agenda-corps');
  const ligne = $('vueAgenda').querySelector('.ag-maintenant');
  if (corps && ligne) corps.scrollTop = Math.max(0, parseInt(ligne.style.top, 10) - 120);
}

/* ---------- Fenêtre « rendez-vous » ---------- */
function creerFenetreRdv() {
  const d = document.createElement('dialog');
  d.id = 'fenetreRdv';
  d.innerHTML = `
    <form id="formRdv" style="padding:18px 22px">
      <h2 id="rdvTitre" style="margin:0 0 10px;font-size:19px">Rendez-vous</h2>
      <div class="g">
        <div class="full"><label for="rdvPatient">Patient (rechercher par nom, prénom ou dossier)</label>
          <input id="rdvPatient" list="rdvListePatients" autocomplete="off" placeholder="Laisser vide pour une réunion ou une indisponibilité">
          <datalist id="rdvListePatients"></datalist></div>
        <div class="full" id="rdvLibelleZone"><label for="rdvLibelle">Intitulé (sans patient)</label><input id="rdvLibelle" placeholder="ex. Synthèse d’équipe, formation, congés"></div>
        <div><label for="rdvType">Type</label><select id="rdvType">${Object.keys(TYPES_RDV).map(t => `<option>${t}</option>`).join('')}</select></div>
        <div><label for="rdvLieu">Lieu</label><input id="rdvLieu" list="rdvListeLieux"><datalist id="rdvListeLieux">${LIEUX_RDV.map(l => `<option value="${l}">`).join('')}</datalist></div>
        <div><label for="rdvDate">Date</label><input id="rdvDate" type="date" required></div>
        <div class="g" style="gap:8px"><div><label for="rdvDebut">Heure</label><input id="rdvDebut" type="time" step="300" required></div>
          <div><label for="rdvDuree">Durée</label><select id="rdvDuree">${[10, 15, 20, 30, 45, 60, 90, 120, 240].map(m => `<option value="${m}">${m < 60 ? m + ' min' : (m / 60) + ' h'}</option>`).join('')}</select></div></div>
        <div><label for="rdvStatut">Statut</label><select id="rdvStatut">${STATUTS_RDV.map(s => `<option>${s}</option>`).join('')}</select></div>
        <div id="rdvRecurrenceZone"><label for="rdvRecurrence">Répéter</label>
          <div class="g" style="gap:8px"><select id="rdvRecurrence"><option value="0">Non</option><option value="7">Chaque semaine</option><option value="14">Toutes les 2 semaines</option><option value="21">Toutes les 3 semaines</option><option value="28">Toutes les 4 semaines</option><option value="mois">Chaque mois</option></select>
          <select id="rdvOccurrences">${[2, 3, 4, 6, 8, 10, 12].map(n => `<option value="${n}">${n} fois</option>`).join('')}</select></div></div>
        <div class="full"><label for="rdvNotes">Notes (motif, consignes, transport…)</label><textarea id="rdvNotes" rows="2" style="min-height:0"></textarea></div>
      </div>
      <p class="ordo-alerte" id="rdvConflit" hidden></p>
      <div class="act" style="flex-wrap:wrap">
        <button type="button" class="danger" id="rdvSupprimer">Supprimer</button>
        <button type="button" id="rdvDossier">Ouvrir le dossier</button>
        <button type="button" id="rdvNote">Note de suivi</button>
        <span class="sp"></span>
        <button type="button" onclick="this.closest('dialog').close()">Annuler</button>
        <button type="submit" class="main">Enregistrer</button>
      </div>
    </form>`;
  document.body.appendChild(d);
  const verifier = () => verifierConflit();
  ['rdvDate', 'rdvDebut', 'rdvDuree'].forEach(id => $(id).addEventListener('change', verifier));
  $('rdvPatient').addEventListener('input', () => { $('rdvLibelleZone').hidden = !!patientSaisi(); verifier(); });
  $('rdvType').addEventListener('change', () => { if ($('rdvType').value === 'Téléconsultation') $('rdvLieu').value = 'Téléconsultation'; });
  $('formRdv').onsubmit = e => { e.preventDefault(); enregistrerRdv(); };
  $('rdvSupprimer').onclick = supprimerRdv;
  $('rdvDossier').onclick = () => { const p = patientSaisi(); if (!p) return; d.close(); definirPatientCourant(p.id); changerOnglet('consultation', p.id); };
  $('rdvNote').onclick = () => {
    const p = patientSaisi(); if (!p) return;
    if (['Prévu', 'Confirmé'].includes($('rdvStatut').value)) $('rdvStatut').value = 'Honoré';
    enregistrerRdv(true);
    definirPatientCourant(p.id);
    actionConsultationDepuisAgenda(p.id);
  };
}
function actionConsultationDepuisAgenda(id) {
  changerOnglet('observation', id);
  if (obsType !== 'suivi') changerTypeObs('suivi');
  else if (!Object.keys(obsEtat).length || obsPatientId !== id) nouvelleObservation(false, 'suivi');
}

const etiquettePatient = p => `${nomPatient(p)}${p.dossier ? ' · ' + p.dossier : ''}`;
function patientSaisi() {
  const v = $('rdvPatient').value.trim();
  if (!v) return null;
  return patients.find(p => etiquettePatient(p) === v) || patients.find(p => nomPatient(p).toLowerCase() === v.toLowerCase()) || null;
}
function verifierConflit() {
  const date = $('rdvDate').value, s = minutes($('rdvDebut').value), e = s + Number($('rdvDuree').value);
  const autres = lireRdv().filter(r => r.date === date && r.id !== (rdvEdition && rdvEdition.id) && estActif(r)
    && minutes(r.debut) < e && minutes(r.debut) + (Number(r.duree) || 30) > s);
  $('rdvConflit').hidden = !autres.length;
  $('rdvConflit').textContent = autres.length ? `Chevauchement avec : ${autres.map(r => `${r.debut} ${libelleRdv(r)}`).join(', ')}.` : '';
  const p = patientSaisi();
  if (p && !$('rdvConflit').hidden) return;
  if ($('rdvPatient').value.trim() && !p) { $('rdvConflit').hidden = false; $('rdvConflit').textContent = 'Patient non trouvé : choisissez-le dans la liste proposée (ou videz le champ pour un rendez-vous sans patient).'; }
}

/** Ouvre la fenêtre : r = rendez-vous existant, ou valeurs initiales { date, debut, patientId }. */
function ouvrirRdv(r, init = {}) {
  if (!$('fenetreRdv')) creerFenetreRdv();
  const reg = reglagesAgenda();
  rdvEdition = r && r.id ? r : null;
  const v = rdvEdition || {};
  $('rdvListePatients').innerHTML = [...patients].sort((a, b) => nomPatient(a).localeCompare(nomPatient(b), 'fr')).map(p => `<option value="${echapper(etiquettePatient(p))}">`).join('');
  const p = patients.find(x => x.id === (v.patientId || init.patientId));
  $('rdvPatient').value = p ? etiquettePatient(p) : '';
  $('rdvLibelle').value = v.libelle || '';
  $('rdvLibelleZone').hidden = !!p;
  $('rdvType').value = v.type || init.type || (p && !(p.obs || []).length ? 'Première consultation' : 'Consultation de suivi');
  $('rdvLieu').value = v.lieu || '';
  $('rdvDate').value = v.date || init.date || agendaDate;
  $('rdvDebut').value = v.debut || init.debut || '09:00';
  $('rdvDuree').value = String(v.duree || init.duree || reg.duree);
  if (!$('rdvDuree').value) $('rdvDuree').value = '30';
  $('rdvStatut').value = v.statut || 'Prévu';
  $('rdvNotes').value = v.notes || '';
  $('rdvRecurrence').value = '0';
  $('rdvRecurrenceZone').hidden = !!rdvEdition;
  $('rdvTitre').textContent = rdvEdition ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous';
  $('rdvSupprimer').hidden = !rdvEdition;
  $('rdvDossier').hidden = $('rdvNote').hidden = !p;
  verifierConflit();
  $('fenetreRdv').showModal();
  if (!p && !rdvEdition) $('rdvPatient').focus();
}

function enregistrerRdv(silencieux) {
  const p = patientSaisi();
  if ($('rdvPatient').value.trim() && !p) { verifierConflit(); return; }
  if (!$('rdvDate').value || !$('rdvDebut').value) return;
  const base = {
    patientId: p ? p.id : '', libelle: p ? '' : $('rdvLibelle').value.trim(),
    type: $('rdvType').value, lieu: $('rdvLieu').value.trim(), date: $('rdvDate').value, debut: $('rdvDebut').value,
    duree: Number($('rdvDuree').value), statut: $('rdvStatut').value, notes: $('rdvNotes').value.trim(),
  };
  const liste = lireRdv();
  const anciensPatients = rdvEdition ? [rdvEdition.patientId] : [];
  if (rdvEdition) Object.assign(liste.find(x => x.id === rdvEdition.id) || {}, base);
  else {
    const rec = $('rdvRecurrence').value, n = rec === '0' ? 1 : Number($('rdvOccurrences').value);
    const serie = n > 1 ? 'serie-' + Date.now().toString(36) : '';
    for (let i = 0; i < n; i++) {
      let date = dateLocale(base.date);
      if (rec === 'mois') date = new Date(date.getFullYear(), date.getMonth() + i, date.getDate());
      else date = ajouterJours(date, i * Number(rec));
      liste.push({ ...base, date: versIso(date), id: 'rdv-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), serie });
    }
  }
  ecrireRdv(liste);
  synchroniserProchain([base.patientId, ...anciensPatients]);
  $('fenetreRdv').close();
  if (!silencieux) toast(rdvEdition ? 'Rendez-vous modifié.' : 'Rendez-vous enregistré.');
  rafraichirApresRdv();
}

function supprimerRdv() {
  if (!rdvEdition) return;
  const serie = rdvEdition.serie && lireRdv().filter(r => r.serie === rdvEdition.serie && r.date >= rdvEdition.date).length > 1;
  let tous = false;
  if (serie) tous = confirm('Ce rendez-vous fait partie d’une série.\nOK = supprimer aussi les suivants de la série ; Annuler = seulement celui-ci.');
  else if (!confirm('Supprimer ce rendez-vous ?')) return;
  const garde = r => !(r.id === rdvEdition.id || (tous && r.serie === rdvEdition.serie && r.date >= rdvEdition.date));
  ecrireRdv(lireRdv().filter(garde));
  synchroniserProchain([rdvEdition.patientId]);
  $('fenetreRdv').close();
  rafraichirApresRdv();
}

function rafraichirApresRdv() {
  if (onglet === 'agenda') afficherAgenda();
  if (onglet === 'accueil') afficherAccueil();
  if (onglet === 'consultation' && typeof afficherConsultation === 'function') afficherConsultation();
  if (typeof majBandeauPatient === 'function') majBandeauPatient();
  if ($('nbAccueil') && typeof compteurAccueil === 'function') $('nbAccueil').textContent = compteurAccueil() || '';
}

/* ---------- Export, impression, réglages ---------- */
function exporterIcs() {
  const jours = joursAffiches();
  const l = lireRdv().filter(r => jours.includes(r.date) && estActif(r));
  if (!l.length) return toast('Aucun rendez-vous sur la période affichée.');
  const t = (date, min) => date.replace(/-/g, '') + 'T' + hhmm(min).replace(':', '') + '00';
  const initiales = r => { const p = patients.find(x => x.id === r.patientId); return p ? `${(p.nom || '?').charAt(0)}.${(p.prenom || '?').charAt(0)}.` : (r.libelle || ''); };
  const lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Portail psy//FR', 'CALSCALE:GREGORIAN',
    ...l.flatMap(r => ['BEGIN:VEVENT', `UID:${r.id}@portail-psy`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
      `DTSTART:${t(r.date, minutes(r.debut))}`, `DTEND:${t(r.date, minutes(r.debut) + (Number(r.duree) || 30))}`,
      `SUMMARY:${(r.type + ' ' + initiales(r)).replace(/[,;]/g, ' ')}`, r.lieu ? `LOCATION:${r.lieu.replace(/[,;]/g, ' ')}` : '', 'END:VEVENT'].filter(Boolean)),
    'END:VCALENDAR'];
  telecharger(`agenda-${jours[0]}.ics`, lignes.join('\r\n'), 'text/calendar');
  toast('Export : seules les initiales des patients figurent dans le fichier.');
}

function imprimerJour() {
  const iso = agendaVue === 'jour' ? agendaDate : (joursAffiches().includes(aujourdhuiIso()) ? aujourdhuiIso() : agendaDate);
  const l = lireRdv().filter(r => r.date === iso).sort((a, b) => minutes(a.debut) - minutes(b.debut));
  const titre = dateLocale(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  imprimerDocument(`<div class="ordo doc"><h2 style="text-align:left">Consultations du ${titre}</h2>
    <table class="tableau-doc" style="width:100%"><tbody>${l.map(r => {
      const p = patients.find(x => x.id === r.patientId);
      return `<tr><td>${r.debut}</td><td>${r.duree} min</td><td><b>${echapper(libelleRdv(r))}</b>${p && p.dossier ? ' · ' + echapper(p.dossier) : ''}</td><td>${echapper(r.type)}</td><td>${echapper(r.lieu || '')}</td><td>${echapper(r.statut || '')}</td></tr>`;
    }).join('') || '<tr><td>Aucun rendez-vous.</td></tr>'}</tbody></table></div>`);
}

function ouvrirReglagesAgenda() {
  const reg = reglagesAgenda();
  const debut = prompt('Heure de début de journée (HH:MM)', reg.debut); if (debut === null) return;
  const fin = prompt('Heure de fin de journée (HH:MM)', reg.fin); if (fin === null) return;
  const duree = prompt('Durée par défaut d’un rendez-vous (minutes)', reg.duree); if (duree === null) return;
  const jours = prompt('Jours affichés dans la semaine : 5 (lundi-vendredi), 6 (jusqu’au samedi) ou 7', reg.jours); if (jours === null) return;
  const ok = /^\d{1,2}:\d{2}$/.test(debut) && /^\d{1,2}:\d{2}$/.test(fin) && minutes(fin) > minutes(debut);
  if (!ok) return alert('Horaires invalides.');
  try {
    localStorage.setItem(CLE_AGENDA_REGLAGES, JSON.stringify({ ...reg, debut, fin, duree: Number(duree) || 30, jours: [5, 6, 7].includes(Number(jours)) ? Number(jours) : 5 }));
  } catch (erreur) { /* ignoré */ }
  afficherAgenda();
}

/* ---------- Événements ---------- */
function initialiserAgenda() {
  const v = $('vueAgenda');
  v.addEventListener('click', e => {
    const rdv = e.target.closest('[data-rdv]');
    if (rdv) { ouvrirRdv(lireRdv().find(r => r.id === rdv.dataset.rdv)); return; }
    const nav = e.target.closest('[data-ag]');
    if (nav) {
      const a = nav.dataset.ag, d = dateLocale(agendaDate);
      const pas = agendaVue === 'jour' ? 1 : agendaVue === 'semaine' ? 7 : 0;
      if (a === 'auj') agendaDate = aujourdhuiIso();
      if (a === 'prec' || a === 'suiv') {
        const s = a === 'prec' ? -1 : 1;
        agendaDate = pas ? versIso(ajouterJours(d, s * pas)) : versIso(new Date(d.getFullYear(), d.getMonth() + s, 1));
      }
      if (a === 'nouveau') return ouvrirRdv(null, { date: agendaVue === 'jour' ? agendaDate : aujourdhuiIso() });
      if (a === 'imprimer') return imprimerJour();
      if (a === 'ics') return exporterIcs();
      if (a === 'reglages') return ouvrirReglagesAgenda();
      afficherAgenda();
      return;
    }
    const vue = e.target.closest('[data-ag-vue]');
    if (vue) { agendaVue = vue.dataset.agVue; afficherAgenda(); return; }
    const jour = e.target.closest('[data-ag-jour]');
    if (jour) { agendaDate = jour.dataset.agJour; agendaVue = 'jour'; afficherAgenda(); return; }
    const col = e.target.closest('.ag-col-corps');
    if (col) ouvrirRdv(null, { date: col.dataset.agDate, debut: heureDepuisPosition(col, e) });
  });
  // Glisser-déposer : déplacer un rendez-vous (vues jour et semaine).
  v.addEventListener('dragstart', e => { const r = e.target.closest('.ag-rdv'); if (r) e.dataTransfer.setData('text/plain', r.dataset.rdv); });
  v.addEventListener('dragover', e => { if (e.target.closest('.ag-col-corps')) e.preventDefault(); });
  v.addEventListener('drop', e => {
    const col = e.target.closest('.ag-col-corps');
    const id = e.dataTransfer.getData('text/plain');
    if (!col || !id) return;
    e.preventDefault();
    const liste = lireRdv(), r = liste.find(x => x.id === id);
    if (!r) return;
    r.date = col.dataset.agDate;
    r.debut = heureDepuisPosition(col, e);
    ecrireRdv(liste);
    synchroniserProchain([r.patientId]);
    afficherAgenda();
    toast(`Déplacé au ${formaterDate(r.date)} à ${r.debut}.`);
  });
}
function heureDepuisPosition(col, e) {
  const reg = reglagesAgenda(), pas = Number(reg.pas) || 15;
  const y = e.clientY - col.getBoundingClientRect().top;
  const m = minutes(reg.debut) + Math.max(0, Math.floor(y / HAUTEUR_PAS)) * pas;
  return hhmm(Math.min(m, minutes(reg.fin) - pas));
}
initialiserAgenda();
