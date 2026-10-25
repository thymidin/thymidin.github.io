/* =====================================================================
   RACCOURCIS.JS — recherche globale d'un patient et raccourcis clavier
   ---------------------------------------------------------------------
     Ctrl+K (ou Cmd+K)  rechercher un patient → ouvre son écran Consultation
     Alt+1 … Alt+9      changer d'onglet (dans l'ordre affiché)
     Échap              fermer la recherche
   ===================================================================== */

function ouvrirRecherche() {
  let fond = $('rechercheGlobale');
  if (!fond) {
    fond = document.createElement('div');
    fond.id = 'rechercheGlobale';
    fond.className = 'palette-fond';
    fond.innerHTML = `<div class="palette" role="dialog" aria-label="Rechercher un patient">
      <input id="paletteSaisie" placeholder="Nom, prénom, n° de dossier, diagnostic…" autocomplete="off">
      <div id="paletteResultats"></div>
      <div class="sec palette-aide">↑ ↓ pour choisir · Entrée pour ouvrir · Échap pour fermer</div></div>`;
    document.body.appendChild(fond);
    fond.addEventListener('click', e => { if (e.target === fond) fermerRecherche(); });
    $('paletteSaisie').addEventListener('input', () => afficherResultatsRecherche(0));
    $('paletteSaisie').addEventListener('keydown', e => {
      const items = [...document.querySelectorAll('#paletteResultats [data-id]')];
      const actif = items.findIndex(x => x.classList.contains('actif'));
      if (e.key === 'ArrowDown') { e.preventDefault(); afficherResultatsRecherche(Math.min(actif + 1, items.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); afficherResultatsRecherche(Math.max(actif - 1, 0)); }
      if (e.key === 'Enter' && items[actif]) ouvrirDepuisRecherche(items[actif].dataset.id);
      if (e.key === 'Escape') fermerRecherche();
    });
    $('paletteResultats').addEventListener('click', e => {
      const x = e.target.closest('[data-id]');
      if (x) ouvrirDepuisRecherche(x.dataset.id);
    });
  }
  fond.hidden = false;
  $('paletteSaisie').value = '';
  afficherResultatsRecherche(0);
  $('paletteSaisie').focus();
}

function fermerRecherche() { if ($('rechercheGlobale')) $('rechercheGlobale').hidden = true; }

function afficherResultatsRecherche(indexActif) {
  const q = $('paletteSaisie').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const sansAccent = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const trouves = patients
    .filter(p => !q || sansAccent([p.nom, p.prenom, p.dossier, p.dp, p.ds, p.cmp].join(' ')).includes(q))
    .sort((a, b) => nomPatient(a).localeCompare(nomPatient(b), 'fr'))
    .slice(0, 12);
  $('paletteResultats').innerHTML = trouves.length ? trouves.map((p, i) => `
    <div class="palette-item${i === indexActif ? ' actif' : ''}" data-id="${p.id}">
      <b>${echapper(nomPatient(p))}</b> <span class="sec">${[p.ddn ? calculerAge(p.ddn) + ' ans' : '', p.dossier, p.dp].filter(Boolean).map(echapper).join(' · ')}</span>
      ${p.vigilance ? '<span class="vig"> ⚠</span>' : ''}</div>`).join('')
    : '<div class="sec" style="padding:10px">Aucun patient trouvé.</div>';
}

function ouvrirDepuisRecherche(id) {
  fermerRecherche();
  if (onglet === 'accueil' || ongletPatients()) { definirPatientCourant(id); changerOnglet('consultation', id); }
  else definirPatientCourant(id, true);              // on reste dans l'onglet en cours, sur le nouveau patient
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    ouvrirRecherche();
    return;
  }
  if (e.altKey && /^[1-9]$/.test(e.key)) {
    const ong = ONGLETS[+e.key - 1];
    if (ong) { e.preventDefault(); changerOnglet(ong[0]); }
  }
});

document.getElementById('btnRechercheGlobale').onclick = ouvrirRecherche;

// Le patient choisi dans n'importe quel module devient le « patient courant » (repris par les autres onglets).
['humPatient', 'echPatient', 'obsPatient', 'docPatient', 'mdphPatient'].forEach(id => {
  const liste = document.getElementById(id);
  if (liste) liste.addEventListener('change', () => { if (liste.value) consPatientId = liste.value; });
});
