/* =====================================================================
   ATTENTE.JS — liste d'attente des demandes de consultation
   ---------------------------------------------------------------------
   Une demande : { id, nom, prenom, ddn, sexe, telephone, adresseur,
     motif, type, priorite (1 urgent → 3 standard), demandeLe, statut,
     contacts: [{date, note}], disponibilites, notes, patientId, rdvId }
   « Planifier » crée la fiche patient (pré-remplie) si besoin et ouvre
   l'agenda sur un rendez-vous de première consultation ; la demande
   passe alors « planifiée ». Données : CLE_STOCKAGE + '_attente'.
   ===================================================================== */

const CLE_ATTENTE = CLE_STOCKAGE + '_attente';
const PRIORITES_ATTENTE = { 1: 'Urgent (< 1 semaine)', 2: 'Rapide (< 1 mois)', 3: 'Standard' };
const TYPES_DEMANDE = ['Première consultation', 'Avis diagnostique', 'Bilan TSA', 'Bilan TDAH', 'Évaluation bipolarité (centre expert)', 'Reprise de suivi (relais)', 'Psychothérapie', 'Autre'];
const STATUTS_ATTENTE = ['En attente', 'Contacté', 'RDV proposé', 'Planifié', 'Réorienté', 'Annulé'];
const SEUILS_ATTENTE = { 1: 7, 2: 30, 3: 90 };      // délai au-delà duquel la demande est signalée (jours)
let filtreAttente = 'actives';                     // 'actives', 'planifiees', 'archivees'
let attenteEdition = null;

function lireAttente() { try { const l = JSON.parse(localStorage.getItem(CLE_ATTENTE) || '[]'); return Array.isArray(l) ? l : []; } catch (erreur) { return []; } }
function ecrireAttente(l) {
  try { localStorage.setItem(CLE_ATTENTE, JSON.stringify(l)); } catch (erreur) { alert('Enregistrement impossible dans ce navigateur.'); }
  majCompteurAttente();
}
const demandeActive = d => !['Planifié', 'Réorienté', 'Annulé'].includes(d.statut);
const delaiJours = d => Math.max(0, Math.round((aujourdhui() - dateLocale(d.demandeLe || aujourdhuiIso())) / MS_PAR_JOUR));
const nomDemande = d => [(d.nom || '').toUpperCase(), d.prenom].filter(Boolean).join(' ') || 'Sans nom';
const enRetardAttente = d => demandeActive(d) && delaiJours(d) > (SEUILS_ATTENTE[d.priorite] || 90);

function majCompteurAttente() {
  const b = $('nbAttente');
  if (b) b.textContent = lireAttente().filter(demandeActive).length || '';
}

/* ---------- Vue ---------- */
function afficherAttente() {
  const toutes = lireAttente();
  const actives = toutes.filter(demandeActive);
  const liste = toutes.filter(d => filtreAttente === 'actives' ? demandeActive(d) : filtreAttente === 'planifiees' ? d.statut === 'Planifié' : ['Réorienté', 'Annulé'].includes(d.statut))
    .sort((a, b) => (filtreAttente === 'actives' ? (a.priorite - b.priorite) || (a.demandeLe < b.demandeLe ? -1 : 1) : (a.demandeLe < b.demandeLe ? 1 : -1)));
  const delais = actives.map(delaiJours);
  const moyen = delais.length ? Math.round(delais.reduce((s, x) => s + x, 0) / delais.length) : 0;
  const n = f => toutes.filter(d => f === 'actives' ? demandeActive(d) : f === 'planifiees' ? d.statut === 'Planifié' : ['Réorienté', 'Annulé'].includes(d.statut)).length;
  $('vueAttente').innerHTML = `
    <div class="stats">
      <div class="stat"><b>${actives.length}</b><span>demandes en attente</span></div>
      <div class="stat"><b>${actives.filter(d => d.priorite == 1).length}</b><span>urgentes</span></div>
      <div class="stat"><b>${actives.filter(enRetardAttente).length}</b><span>hors délai cible</span></div>
      <div class="stat"><b>${delais.length ? moyen + ' j' : '—'}</b><span>attente moyenne</span></div>
      <div class="stat"><b>${delais.length ? Math.max(...delais) + ' j' : '—'}</b><span>plus ancienne</span></div>
    </div>
    <div class="bar">
      <div class="segments">${[['actives', 'En attente'], ['planifiees', 'Planifiées'], ['archivees', 'Réorientées, annulées']].map(([f, l]) => `<button type="button" data-att-filtre="${f}" class="${filtreAttente === f ? 'on' : ''}">${l} <span class="n">${n(f)}</span></button>`).join('')}</div>
      <span class="sp" style="flex:1"></span>
      <button type="button" data-att="imprimer">Imprimer la liste</button>
      <button type="button" class="main" data-att="nouvelle">+ Nouvelle demande</button>
    </div>
    <div class="attente-liste">${liste.length ? liste.map(htmlDemande).join('') : `<p class="sec carte">${filtreAttente === 'actives' ? 'Aucune demande en attente. « + Nouvelle demande » pour inscrire un patient adressé.' : 'Aucune demande.'}</p>`}</div>
    <p class="sec">Délais cibles signalés : urgent ${SEUILS_ATTENTE[1]} j, rapide ${SEUILS_ATTENTE[2]} j, standard ${SEUILS_ATTENTE[3]} j (modifiables en tête de js/attente.js).</p>`;
}

function htmlDemande(d) {
  const jours = delaiJours(d), dernier = (d.contacts || []).slice(-1)[0];
  const age = d.ddn ? calculerAge(d.ddn) + ' ans' : '';
  const rdv = d.rdvId && typeof lireRdv === 'function' ? lireRdv().find(r => r.id === d.rdvId) : null;
  return `<div class="carte attente-demande ${enRetardAttente(d) ? 'retard' : ''}">
    <div class="attente-prio p${d.priorite}">${['', 'Urgent', 'Rapide', 'Standard'][d.priorite] || ''}</div>
    <div class="attente-corps">
      <div><b>${echapper(nomDemande(d))}</b> <span class="sec">${[libelleSexe(d.sexe), age, d.telephone && '☎ ' + d.telephone].filter(Boolean).map(echapper).join(' · ')}</span></div>
      <div>${echapper(d.type || '')}${d.motif ? ' · ' + echapper(d.motif) : ''}</div>
      <div class="sec">${d.adresseur ? 'Adressé par ' + echapper(d.adresseur) + ' · ' : ''}demande du ${formaterDate(d.demandeLe)} · <b class="${enRetardAttente(d) ? 'texte-retard' : ''}">${jours} j d’attente</b>
        ${dernier ? ` · dernier contact le ${formaterDate(dernier.date)}${dernier.note ? ' (' + echapper(dernier.note) + ')' : ''} · ${(d.contacts || []).length} tentative(s)` : ''}
        ${d.disponibilites ? ' · disponibilités : ' + echapper(d.disponibilites) : ''}</div>
      ${rdv ? `<div class="attente-rdv">RDV le ${formaterDate(rdv.date)} à ${rdv.debut} (${echapper(rdv.statut || '')})</div>` : ''}
      ${d.notes ? `<div class="sec">${echapper(d.notes)}</div>` : ''}
    </div>
    <div class="attente-actions">
      <span class="etiquette-statut">${echapper(d.statut || 'En attente')}</span>
      ${demandeActive(d) ? `<button type="button" class="main" data-att="planifier" data-id="${d.id}">Planifier</button>
        <button type="button" data-att="contact" data-id="${d.id}">Contact noté</button>` : ''}
      ${d.patientId ? `<button type="button" data-att="dossier" data-id="${d.id}">Dossier</button>` : ''}
      <button type="button" class="discret" data-att="modifier" data-id="${d.id}">Modifier</button>
    </div>
  </div>`;
}

/* ---------- Fenêtre « demande » ---------- */
function creerFenetreAttente() {
  const f = document.createElement('dialog');
  f.id = 'fenetreAttente';
  f.innerHTML = `
    <form id="formAttente" style="padding:18px 22px">
      <h2 id="attTitre" style="margin:0 0 10px;font-size:19px">Nouvelle demande</h2>
      <div class="g">
        <div><label for="att_nom">Nom *</label><input id="att_nom" required></div>
        <div><label for="att_prenom">Prénom</label><input id="att_prenom"></div>
        <div><label for="att_ddn">Date de naissance</label><input id="att_ddn" type="date"></div>
        <div><label for="att_sexe">Sexe</label><select id="att_sexe"><option value="">Non renseigné</option><option value="F">Femme</option><option value="M">Homme</option></select></div>
        <div><label for="att_telephone">Téléphone</label><input id="att_telephone" inputmode="tel"></div>
        <div><label for="att_demandeLe">Demande reçue le</label><input id="att_demandeLe" type="date"></div>
        <div class="full"><label for="att_adresseur">Adressé par</label><input id="att_adresseur" placeholder="ex. Dr X, médecin traitant ; urgences ; CMP Nord ; patient lui-même"></div>
        <div><label for="att_type">Type de demande</label><select id="att_type">${TYPES_DEMANDE.map(t => `<option>${t}</option>`).join('')}</select></div>
        <div><label for="att_priorite">Priorité</label><select id="att_priorite">${Object.entries(PRIORITES_ATTENTE).map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></div>
        <div class="full"><label for="att_motif">Motif de la demande</label><input id="att_motif" placeholder="ex. épisode dépressif résistant, avis sur le traitement"></div>
        <div><label for="att_statut">Statut</label><select id="att_statut">${STATUTS_ATTENTE.map(s => `<option>${s}</option>`).join('')}</select></div>
        <div><label for="att_disponibilites">Disponibilités du patient</label><input id="att_disponibilites" placeholder="ex. matins, pas le mercredi"></div>
        <div class="full"><label for="att_notes">Notes (courrier reçu, éléments de tri…)</label><textarea id="att_notes" rows="2" style="min-height:0"></textarea></div>
      </div>
      <div id="attContacts" class="sec" style="margin-top:8px"></div>
      <div class="act" style="flex-wrap:wrap">
        <button type="button" class="danger" id="attSupprimer">Supprimer</button>
        <span class="sp"></span>
        <button type="button" onclick="this.closest('dialog').close()">Annuler</button>
        <button type="submit" class="main">Enregistrer</button>
      </div>
    </form>`;
  document.body.appendChild(f);
  $('formAttente').onsubmit = e => { e.preventDefault(); enregistrerDemande(); };
  $('attSupprimer').onclick = () => {
    if (!attenteEdition || !confirm('Supprimer définitivement cette demande ?')) return;
    ecrireAttente(lireAttente().filter(d => d.id !== attenteEdition));
    f.close(); afficherAttente();
  };
}

const CHAMPS_ATTENTE = ['nom', 'prenom', 'ddn', 'sexe', 'telephone', 'demandeLe', 'adresseur', 'type', 'priorite', 'motif', 'statut', 'disponibilites', 'notes'];
function ouvrirDemande(id) {
  if (!$('fenetreAttente')) creerFenetreAttente();
  attenteEdition = id || null;
  const d = (id && lireAttente().find(x => x.id === id)) || { demandeLe: aujourdhuiIso(), priorite: 3, statut: 'En attente', type: TYPES_DEMANDE[0] };
  CHAMPS_ATTENTE.forEach(c => { $('att_' + c).value = d[c] ?? ''; });
  $('attTitre').textContent = id ? 'Modifier la demande' : 'Nouvelle demande';
  $('attSupprimer').hidden = !id;
  $('attContacts').innerHTML = (d.contacts || []).length ? 'Contacts : ' + d.contacts.map(c => `${formaterDate(c.date)}${c.note ? ' (' + echapper(c.note) + ')' : ''}`).join(' · ') : '';
  $('fenetreAttente').showModal();
  $('att_nom').focus();
}
function enregistrerDemande() {
  const liste = lireAttente();
  const v = {};
  CHAMPS_ATTENTE.forEach(c => { v[c] = $('att_' + c).value.trim(); });
  v.priorite = Number(v.priorite) || 3;
  if (!v.nom) return;
  if (attenteEdition) Object.assign(liste.find(x => x.id === attenteEdition), v);
  else liste.push({ id: 'att-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), contacts: [], ...v });
  ecrireAttente(liste);
  $('fenetreAttente').close();
  toast('Demande enregistrée.');
  afficherAttente();
}

/* ---------- Actions ---------- */
function noterContact(id) {
  const note = prompt('Contact (appel, message, courrier) : précision facultative', 'Message laissé');
  if (note === null) return;
  const liste = lireAttente(), d = liste.find(x => x.id === id);
  d.contacts = d.contacts || [];
  d.contacts.push({ date: aujourdhuiIso(), note: note.trim() });
  if (d.statut === 'En attente') d.statut = 'Contacté';
  ecrireAttente(liste);
  afficherAttente();
}

/** Crée (si besoin) la fiche patient puis ouvre un rendez-vous de première consultation. */
function planifierDemande(id) {
  const liste = lireAttente(), d = liste.find(x => x.id === id);
  if (!d) return;
  let p = d.patientId && patients.find(x => x.id === d.patientId);
  if (!p) {
    p = {
      id: 'p' + Date.now().toString(36), nom: d.nom, prenom: d.prenom, ddn: d.ddn, sexe: d.sexe, telPatient: d.telephone,
      tel: d.adresseur || '', synthese: [d.type, d.motif && 'Motif : ' + d.motif, d.adresseur && 'Adressé par ' + d.adresseur, `Demande du ${formaterDate(d.demandeLe)}`].filter(Boolean).join('. ') + '.',
      aRelayer: false, priorite: 3, statut: statuts[0], trt: [],
    };
    patients.push(p);
    sauvegarderPatients();
    d.patientId = p.id;
    ecrireAttente(liste);
    toast('Fiche patient créée à partir de la demande.');
  }
  const avant = new Set(lireRdv().map(r => r.id));
  ouvrirRdv(null, { patientId: p.id, type: d.type === 'Reprise de suivi (relais)' ? 'Consultation de suivi' : 'Première consultation', duree: 60, date: aujourdhuiIso() });
  $('fenetreRdv').addEventListener('close', () => {
    const nouveau = lireRdv().find(r => !avant.has(r.id) && r.patientId === p.id);
    if (!nouveau) return;
    const l = lireAttente(), x = l.find(y => y.id === id);
    if (x) { x.statut = 'Planifié'; x.rdvId = nouveau.id; ecrireAttente(l); }
    if (onglet === 'attente') afficherAttente();
    toast(`Demande planifiée : RDV le ${formaterDate(nouveau.date)} à ${nouveau.debut}.`);
  }, { once: true });
}

function imprimerAttente() {
  const liste = lireAttente().filter(demandeActive).sort((a, b) => (a.priorite - b.priorite) || (a.demandeLe < b.demandeLe ? -1 : 1));
  imprimerDocument(`<style>@page { size: A4 landscape; margin: 0; }</style>
    <div class="ordo doc tableau-relais-impr"><h2 style="text-align:left;margin:0 0 6px">Liste d’attente · ${liste.length} demande(s) · ${formaterDate(aujourdhuiIso())}</h2>
    <table><thead><tr><th>Priorité</th><th>Patient</th><th>Demande</th><th>Adressé par</th><th>Reçue le</th><th>Attente</th><th>Contacts</th><th>Statut</th></tr></thead><tbody>
    ${liste.map(d => `<tr><td>${['', 'Urgent', 'Rapide', 'Standard'][d.priorite]}</td><td><b>${echapper(nomDemande(d))}</b>${d.ddn ? '<br>' + formaterDate(d.ddn) : ''}${d.telephone ? '<br>' + echapper(d.telephone) : ''}</td>
      <td>${echapper(d.type || '')}${d.motif ? '<br>' + echapper(d.motif) : ''}</td><td>${echapper(d.adresseur || '')}</td><td>${formaterDate(d.demandeLe)}</td>
      <td>${delaiJours(d)} j</td><td>${(d.contacts || []).map(c => formaterDate(c.date)).join(', ')}</td><td>${echapper(d.statut || '')}</td></tr>`).join('')}
    </tbody></table><p style="font-size:9pt;margin-top:6px">Document de travail interne contenant des données personnelles.</p></div>`);
}

/* ---------- Branchement ---------- */
(function brancherAttente() {
  $('vueAttente').addEventListener('click', e => {
    const f = e.target.closest('[data-att-filtre]');
    if (f) { filtreAttente = f.dataset.attFiltre; afficherAttente(); return; }
    const b = e.target.closest('[data-att]');
    if (!b) return;
    const a = b.dataset.att, id = b.dataset.id;
    if (a === 'nouvelle') ouvrirDemande(null);
    if (a === 'modifier') ouvrirDemande(id);
    if (a === 'contact') noterContact(id);
    if (a === 'planifier') planifierDemande(id);
    if (a === 'imprimer') imprimerAttente();
    if (a === 'dossier') { const d = lireAttente().find(x => x.id === id); if (d && d.patientId) { definirPatientCourant(d.patientId); changerOnglet('consultation', d.patientId); } }
  });
  majCompteurAttente();
})();
