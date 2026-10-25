/* =====================================================================
   SAUVEGARDE.JS — sauvegarde complète chiffrée et rappel de sauvegarde
   ---------------------------------------------------------------------
   Les données du portail ne vivent que dans ce navigateur. Ce module :
     - produit un fichier unique « .portail » contenant TOUTES les données
       (patients, profil praticien, réglages, intitulés d'échelles…),
       chiffré par mot de passe (AES-GCM 256 bits, clé dérivée PBKDF2-SHA-256,
       310 000 itérations), avec l'outil de chiffrement intégré au navigateur ;
     - restaure ce fichier (mot de passe nécessaire) ;
     - rappelle de sauvegarder si la dernière sauvegarde date de plus de 7 jours.
   Sans le mot de passe, la sauvegarde est illisible : il n'existe aucun moyen
   de le récupérer. Rien n'est envoyé sur Internet.
   ===================================================================== */

const VERSION_FORMAT = 2;                                     // version du format des données
const CLE_DERNIERE_SAUVEGARDE = CLE_STOCKAGE + '_derniereSauvegarde';
const DELAI_RAPPEL_JOURS = 7;

const enBase64 = octets => btoa(Array.from(new Uint8Array(octets), c => String.fromCharCode(c)).join(''));
const depuisBase64 = texte => Uint8Array.from(atob(texte), c => c.charCodeAt(0));

/** Toutes les clés du portail présentes dans ce navigateur. */
function clesPortail() {
  const cles = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(CLE_STOCKAGE)) cles.push(k);
  }
  return cles;
}

async function deriverCle(motDePasse, sel) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(motDePasse), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: sel, iterations: 310000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

function chiffrementDisponible() {
  if (window.crypto && crypto.subtle) return true;
  alert('Le chiffrement n’est pas disponible dans ce navigateur. Utilisez une version récente de Chrome, Edge ou Firefox.');
  return false;
}

async function sauvegardeChiffree() {
  if (!chiffrementDisponible()) return;
  const mdp = prompt('Choisissez un mot de passe pour chiffrer la sauvegarde (12 caractères ou plus conseillés).\nSans ce mot de passe, la sauvegarde sera illisible.');
  if (!mdp) return;
  if (mdp.length < 8 && !confirm('Mot de passe court (moins de 8 caractères). Continuer quand même ?')) return;
  if (prompt('Confirmez le mot de passe :') !== mdp) return alert('Les deux mots de passe ne correspondent pas. Sauvegarde annulée.');

  const contenu = { version: VERSION_FORMAT, date: new Date().toISOString(), donnees: {} };
  clesPortail().filter(k => k !== CLE_DERNIERE_SAUVEGARDE).forEach(k => { contenu.donnees[k] = localStorage.getItem(k); });

  const sel = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cle = await deriverCle(mdp, sel);
  const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, new TextEncoder().encode(JSON.stringify(contenu)));
  const fichier = {
    application: 'portail-psychiatrie', version: VERSION_FORMAT, date: contenu.date,
    chiffrement: 'AES-GCM-256 / PBKDF2-SHA-256 / 310000', sel: enBase64(sel), iv: enBase64(iv), donnees: enBase64(chiffre),
  };
  telecharger(`portail-sauvegarde-${dateDuJour()}.portail`, JSON.stringify(fichier), 'application/octet-stream');
  noterSauvegarde();
}

function restaurerSauvegarde(fichier) {
  const lecteur = new FileReader();
  lecteur.onload = async () => {
    try {
      const f = JSON.parse(lecteur.result);
      if (f.application !== 'portail-psychiatrie' || !f.donnees) throw new Error('format');
      const mdp = prompt(`Sauvegarde du ${new Date(f.date).toLocaleString('fr-FR')}.\nMot de passe :`);
      if (!mdp) return;
      let contenu;
      try {
        const cle = await deriverCle(mdp, depuisBase64(f.sel));
        const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: depuisBase64(f.iv) }, cle, depuisBase64(f.donnees));
        contenu = JSON.parse(new TextDecoder().decode(clair));
      } catch (erreur) {
        return alert('Mot de passe incorrect ou fichier endommagé.');
      }
      const fiches = JSON.parse(contenu.donnees[CLE_STOCKAGE] || '[]');
      if (contenu.version > VERSION_FORMAT && !confirm('Cette sauvegarde vient d’une version plus récente du portail. Restaurer quand même ?')) return;
      if (!confirm(`Restaurer ${fiches.length} fiche(s) et tous les réglages de cette sauvegarde ?\nLes données actuelles de ce navigateur seront REMPLACÉES.`)) return;
      clesPortail().forEach(k => localStorage.removeItem(k));
      Object.entries(contenu.donnees).forEach(([k, val]) => localStorage.setItem(k, val));
      noterSauvegarde();
      location.reload();
    } catch (erreur) {
      alert('Ce fichier n’est pas une sauvegarde chiffrée du portail (.portail).');
    }
  };
  lecteur.readAsText(fichier);
}

function noterSauvegarde() {
  try { localStorage.setItem(CLE_DERNIERE_SAUVEGARDE, new Date().toISOString()); } catch (erreur) { /* ignoré */ }
  afficherRappelSauvegarde();
}

function afficherRappelSauvegarde() {
  const zone = $('rappelSauvegarde');
  if (!zone) return;
  let derniere = null;
  try { derniere = localStorage.getItem(CLE_DERNIERE_SAUVEGARDE); } catch (erreur) { /* ignoré */ }
  const jours = derniere ? Math.floor((Date.now() - new Date(derniere)) / MS_PAR_JOUR) : null;
  const afficher = patients.length > 0 && (jours === null || jours >= DELAI_RAPPEL_JOURS) && !sessionStorage.getItem('rappelReporte');
  zone.hidden = !afficher;
  if (typeof onglet !== 'undefined' && onglet === 'accueil' && typeof afficherAccueil === 'function') afficherAccueil();
  if (!afficher) return;
  zone.innerHTML = `<div><b>Sauvegarde.</b> ${jours === null ? 'Aucune sauvegarde n’a encore été faite' : `Dernière sauvegarde il y a ${jours} jours`}.
    Les données ne sont que dans ce navigateur : vider le cache ou changer de poste les ferait perdre.</div>
    <button type="button" class="main" id="rappelSauver">Sauvegarde chiffrée</button>
    <button type="button" id="rappelPlusTard">Plus tard</button>`;
  $('rappelSauver').onclick = sauvegardeChiffree;
  $('rappelPlusTard').onclick = () => { try { sessionStorage.setItem('rappelReporte', '1'); } catch (erreur) { /* ignoré */ } zone.hidden = true; if (onglet === 'accueil') afficherAccueil(); };
}

function brancherSauvegarde() {
  const entree = document.createElement('input');
  entree.type = 'file'; entree.accept = '.portail,application/json'; entree.hidden = true;
  document.body.appendChild(entree);
  entree.onchange = () => { if (entree.files[0]) restaurerSauvegarde(entree.files[0]); entree.value = ''; };
  $('btnSauvegardeChiffree').onclick = sauvegardeChiffree;
  $('btnRestaurer').onclick = () => entree.click();
  // La sauvegarde JSON (non chiffrée) compte aussi comme sauvegarde.
  const exportJson = $('btnJson').onclick;
  $('btnJson').onclick = () => { exportJson && exportJson(); noterSauvegarde(); };
  afficherRappelSauvegarde();
}
