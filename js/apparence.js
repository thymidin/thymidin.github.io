/* =====================================================================
   APPARENCE.JS — icônes, thème clair / sombre, aide, notifications,
   raccourcis Ctrl+S et « ? », sélecteurs de patient unifiés
   ===================================================================== */

/* ---------- Icônes (tracés simples, couleur du texte) ---------- */
const ICONES = {
  recherche: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  sauver: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  restaurer: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  aide: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  accueil: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  consultation: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  note: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  echelle: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
  courbe: '<path d="M3 3v18h18"/><path d="m7 15 4-6 4 4 5-7"/>',
  document: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  mdph: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3"/>',
  liste: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 6"/>',
  relais: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  praticien: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17a4 4 0 0 1 8 0"/>',
  reglages: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  crayon: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  changer: '<path d="M7 7h12l-3-3M17 17H5l3 3"/>',
  fermer: '<path d="M6 6l12 12M18 6 6 18"/>',
  'theme-auto': '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18z" fill="currentColor" stroke="none"/>',
  'theme-clair': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  'theme-sombre': '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
};
function svgIcone(nom) {
  return `<svg class="icone" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nom] || ''}</svg>`;
}
function poserIcones(racine = document) {
  racine.querySelectorAll('[data-icone]').forEach(el => {
    const nom = el.dataset.icone === 'theme' ? 'theme-' + themeActuel() : el.dataset.icone;
    if (el.dataset.iconePosee !== nom) { el.innerHTML = svgIcone(nom); el.dataset.iconePosee = nom; }
  });
}

/* ---------- Thème : automatique (système), clair, sombre ---------- */
const CLE_THEME = CLE_STOCKAGE + '_theme';
function themeActuel() { try { return localStorage.getItem(CLE_THEME) || 'auto'; } catch (erreur) { return 'auto'; } }
function appliquerTheme() {
  const t = themeActuel();
  if (t === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t === 'sombre' ? 'dark' : 'light';
  const b = $('btnTheme');
  if (b) { b.title = `Thème : ${{ auto: 'automatique (système)', clair: 'clair', sombre: 'sombre' }[t]} · cliquer pour changer`; poserIcones(b.parentNode); }
}
function basculerTheme() {
  const suivant = { auto: 'clair', clair: 'sombre', sombre: 'auto' }[themeActuel()];
  try { localStorage.setItem(CLE_THEME, suivant); } catch (erreur) { /* ignoré */ }
  appliquerTheme();
  toast(`Thème ${{ auto: 'automatique', clair: 'clair', sombre: 'sombre' }[suivant]}`);
}

/* ---------- Notifications ---------- */
function toast(texte, type = 'info') {
  const zone = $('toasts');
  if (!zone || !texte) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = texte;
  zone.appendChild(t);
  requestAnimationFrame(() => t.classList.add('visible'));
  setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3200);
}
// Les messages des modules passent désormais par les notifications.
signaler = function (element, texte) {
  if (!texte) return;
  const erreur = /impossible|choisissez|incorrect|invalide|indiquez|aucun/i.test(texte);
  toast(texte, erreur ? 'alerte' : 'info');
};

/* ---------- Sélecteurs de patient : un seul, dans le bandeau ---------- */
function masquerSelecteursModules() {
  ['consPatient', 'humPatient', 'obsPatient', 'docPatient', 'mdphPatient', 'echPatient'].forEach(id => {
    const s = $(id);
    if (!s) return;
    s.classList.add('selecteur-masque');
    const l = document.querySelector(`label[for="${id}"]`);
    if (l) l.classList.add('selecteur-masque');
    if (id === 'echPatient') s.closest('div').classList.add('selecteur-masque');
  });
  const barreCons = document.querySelector('#vueConsultation .cons-barre');
  if (barreCons) barreCons.hidden = true;
}

/* ---------- Raccourcis : Ctrl+S (enregistrer), « ? » (aide) ---------- */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    const actions = {
      observation: () => enregistrerObservation(),
      documents: () => enregistrerDocument(),
      echelles: () => (patients.find(p => p.id === echPatientId) ? enregistrerScore() : signaler(null, 'Choisissez un patient pour enregistrer.')),
    };
    if (actions[onglet] && !document.querySelector('dialog[open]')) { e.preventDefault(); actions[onglet](); }
    return;
  }
  const dansChamp = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if (e.key === '?' && !dansChamp && !document.querySelector('dialog[open]')) { e.preventDefault(); $('fenetreAide').showModal(); }
});

/* ---------- Démarrage ---------- */
appliquerTheme();
poserIcones();
masquerSelecteursModules();
majBandeauPatient();
$('btnTheme').onclick = basculerTheme;
$('btnAide').onclick = () => $('fenetreAide').showModal();
// Les icônes des contenus redessinés (bandeau, consultation…) sont posées au fil de l'eau.
new MutationObserver(() => poserIcones()).observe(document.body, { childList: true, subtree: true });

// Les menus déroulants « Plus » et « Ouvrir… » se referment après un choix ou un clic ailleurs.
document.addEventListener('click', e => {
  document.querySelectorAll('details.menu-plus[open]').forEach(d => {
    if (!d.contains(e.target) || e.target.closest('.menu-plus-liste button')) d.open = false;
  });
});
