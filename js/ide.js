/* =====================================================================
   IDE.JS — annuaire des équipes infirmières (cabinets libéraux, IDE du
   CMP, HAD, SSIAD…) et rattachement d'un patient à une équipe
   ---------------------------------------------------------------------
   Données : localStorage CLE_STOCKAGE + '_equipesIde' (incluses dans la
   sauvegarde chiffrée). Le patient garde l'identifiant de son équipe
   dans patient.ideEquipe. L'ordonnance de soins infirmiers est dans
   documents.js (type « ordoIde »).
   ===================================================================== */

const CLE_EQUIPES_IDE = CLE_STOCKAGE + '_equipesIde';
const TYPES_EQUIPE_IDE = ['Cabinet infirmier libéral', 'IDE du CMP / secteur', 'Hospitalisation à domicile (HAD)', 'SSIAD', 'Autre'];

function lireEquipesIde() {
  try { const l = JSON.parse(localStorage.getItem(CLE_EQUIPES_IDE) || '[]'); return Array.isArray(l) ? l : []; }
  catch (erreur) { return []; }
}
function ecrireEquipesIde(liste) {
  try { localStorage.setItem(CLE_EQUIPES_IDE, JSON.stringify(liste)); } catch (erreur) { alert('Enregistrement impossible dans ce navigateur.'); }
  remplirSelectEquipesIde();
}
const equipeIde = id => lireEquipesIde().find(e => e.id === id) || null;
const equipeDuPatient = p => (p && p.ideEquipe ? equipeIde(p.ideEquipe) : null);

/** « Cabinet Les Oliviers · 04 … » : résumé d'une équipe pour l'affichage. */
function resumeEquipeIde(e, avecContacts = true) {
  if (!e) return '';
  return [e.nom, avecContacts ? e.telephone : '', avecContacts ? e.email : ''].filter(Boolean).join(' · ');
}

/** Liste déroulante de la fiche patient. */
function remplirSelectEquipesIde() {
  const s = $('ideEquipe');
  if (!s) return;
  const valeur = s.value;
  const liste = lireEquipesIde().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  remplirSelect(s, liste.map(e => [e.id, e.nom + (e.type ? ' (' + e.type.replace(/ \(.*\)$/, '') + ')' : '')]), 'Aucune');
  s.value = liste.some(e => e.id === valeur) ? valeur : '';
}

/* ---------- Fenêtre « Équipes infirmières » ---------- */
let equipeEnEdition = null;

function creerFenetreEquipesIde() {
  const d = document.createElement('dialog');
  d.id = 'fenetreEquipesIde';
  d.innerHTML = `
    <div style="padding:18px 22px">
      <h2 style="margin:0 0 4px;font-size:19px">Équipes infirmières</h2>
      <p class="sec" style="margin:0 0 12px">Cabinets libéraux, IDE du CMP, HAD, SSIAD… Rattachez ensuite chaque patient à son équipe dans sa fiche.
      Préférez une messagerie sécurisée de santé (MSSanté) pour transmettre des informations sur un patient.</p>
      <div id="ideListe"></div>
      <form id="ideForm" class="carte ide-form" hidden>
        <h3 class="h3" id="ideFormTitre">Nouvelle équipe</h3>
        <div class="g">
          <div class="full"><label for="ide_nom">Nom de l’équipe ou du cabinet *</label><input id="ide_nom" required placeholder="ex. Cabinet infirmier des Oliviers"></div>
          <div><label for="ide_type">Type</label><select id="ide_type">${TYPES_EQUIPE_IDE.map(t => `<option>${t}</option>`).join('')}</select></div>
          <div><label for="ide_secteur">Secteur, communes couvertes</label><input id="ide_secteur" placeholder="ex. Marseille 4e, 5e, 12e"></div>
          <div><label for="ide_telephone">Téléphone</label><input id="ide_telephone" inputmode="tel"></div>
          <div><label for="ide_telephone2">Autre numéro (portable, astreinte)</label><input id="ide_telephone2" inputmode="tel"></div>
          <div class="full"><label for="ide_email">Messagerie sécurisée (MSSanté) ou courriel</label><input id="ide_email" placeholder="ex. cabinet.oliviers@infirmier.mssante.fr"></div>
          <div class="full"><label for="ide_adresse">Adresse</label><input id="ide_adresse"></div>
          <div class="full"><label for="ide_contacts">Infirmier(e)s, référent(e)</label><input id="ide_contacts" placeholder="ex. Mme DUPONT (référente), M. MARTIN"></div>
          <div class="full"><label for="ide_notes">Notes (horaires, soins réalisés, injections, week-ends…)</label><textarea id="ide_notes" rows="2" style="min-height:0"></textarea></div>
        </div>
        <div class="act"><button type="button" id="ideAnnuler">Annuler</button><span class="sp"></span><button type="submit" class="main">Enregistrer l’équipe</button></div>
      </form>
      <div class="act"><button type="button" id="ideAjouter">+ Ajouter une équipe</button><span class="sp"></span>
        <button type="button" class="main" onclick="this.closest('dialog').close()">Fermer</button></div>
    </div>`;
  document.body.appendChild(d);
  $('ideAjouter').onclick = () => editerEquipeIde(null);
  $('ideAnnuler').onclick = () => { $('ideForm').hidden = true; };
  $('ideForm').onsubmit = e => { e.preventDefault(); enregistrerEquipeIde(); };
  $('ideListe').onclick = e => {
    const b = e.target.closest('button[data-ide]');
    if (!b) return;
    if (b.dataset.ide === 'modifier') editerEquipeIde(b.dataset.id);
    if (b.dataset.ide === 'supprimer') supprimerEquipeIde(b.dataset.id);
  };
  d.addEventListener('close', () => { if (typeof afficherTableau === 'function') afficherTableau(); });
}

function afficherEquipesIde() {
  const liste = lireEquipesIde().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const nbPatients = id => patients.filter(p => p.ideEquipe === id).length;
  $('ideListe').innerHTML = liste.length ? liste.map(e => `
    <div class="ide-carte">
      <div class="ide-carte-texte">
        <b>${echapper(e.nom)}</b> <span class="sec">${echapper(e.type || '')}${e.secteur ? ' · ' + echapper(e.secteur) : ''}</span>
        <div>${[e.telephone && '☎ ' + e.telephone, e.telephone2 && '☎ ' + e.telephone2, e.email && '✉ ' + e.email].filter(Boolean).map(echapper).join(' · ')}</div>
        ${e.adresse ? `<div class="sec">${echapper(e.adresse)}</div>` : ''}
        ${e.contacts ? `<div class="sec">${echapper(e.contacts)}</div>` : ''}
        ${e.notes ? `<div class="sec">${echapper(e.notes)}</div>` : ''}
        <div class="sec">${nbPatients(e.id)} patient(s) rattaché(s)</div>
      </div>
      <div class="ide-carte-actions"><button type="button" data-ide="modifier" data-id="${e.id}">Modifier</button>
        <button type="button" class="danger" data-ide="supprimer" data-id="${e.id}">Supprimer</button></div>
    </div>`).join('') : '<p class="sec">Aucune équipe enregistrée.</p>';
}

function editerEquipeIde(id) {
  equipeEnEdition = id;
  const e = (id && equipeIde(id)) || {};
  ['nom', 'secteur', 'telephone', 'telephone2', 'email', 'adresse', 'contacts', 'notes'].forEach(c => { $('ide_' + c).value = e[c] || ''; });
  $('ide_type').value = e.type || TYPES_EQUIPE_IDE[0];
  $('ideFormTitre').textContent = id ? 'Modifier l’équipe' : 'Nouvelle équipe';
  $('ideForm').hidden = false;
  $('ide_nom').focus();
}

function enregistrerEquipeIde() {
  const e = { id: equipeEnEdition || 'ide-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
  ['nom', 'type', 'secteur', 'telephone', 'telephone2', 'email', 'adresse', 'contacts', 'notes'].forEach(c => { e[c] = $('ide_' + c).value.trim(); });
  if (!e.nom) return;
  const liste = lireEquipesIde();
  const ancienne = liste.find(x => x.id === e.id);
  if (ancienne) Object.assign(ancienne, e); else liste.push(e);
  ecrireEquipesIde(liste);
  $('ideForm').hidden = true;
  afficherEquipesIde();
  toast('Équipe enregistrée.');
}

function supprimerEquipeIde(id) {
  const n = patients.filter(p => p.ideEquipe === id).length;
  if (!confirm(`Supprimer cette équipe ?${n ? `\n${n} patient(s) y sont rattachés : le rattachement sera retiré.` : ''}`)) return;
  ecrireEquipesIde(lireEquipesIde().filter(e => e.id !== id));
  if (n) { patients.forEach(p => { if (p.ideEquipe === id) delete p.ideEquipe; }); sauvegarderPatients(); }
  afficherEquipesIde();
}

function ouvrirEquipesIde(nouvelle) {
  if (!$('fenetreEquipesIde')) creerFenetreEquipesIde();
  $('ideForm').hidden = true;
  afficherEquipesIde();
  $('fenetreEquipesIde').showModal();
  if (nouvelle) editerEquipeIde(null);
}

(function brancherIde() {
  remplirSelectEquipesIde();
  const ref = $('btnPraticien');
  if (ref) ref.insertAdjacentHTML('afterend', `<button type="button" class="tabs-reglage" id="btnEquipesIde">
    <span data-icone="ide"></span><span class="libelle-onglet">Équipes infirmières</span></button>`);
  $('btnEquipesIde').onclick = () => ouvrirEquipesIde(false);
  $('ideGerer').onclick = () => {
    ouvrirEquipesIde(!lireEquipesIde().length);
    // De retour dans la fiche : liste à jour, nouvelle équipe présélectionnée si la fiche n'en avait pas.
    $('fenetreEquipesIde').addEventListener('close', () => {
      const avant = $('ideEquipe').value;
      remplirSelectEquipesIde();
      if (!avant && equipeEnEdition === null) { const l = lireEquipesIde(); if (l.length === 1) $('ideEquipe').value = l[0].id; }
    }, { once: true });
  };
})();
