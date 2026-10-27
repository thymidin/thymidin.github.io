/* =====================================================================
   MISEENPAGE.JS — en-tête, pied de page, logo et marges des documents
   imprimés (courriers, certificats, ordonnances, observations, courbe)
   ---------------------------------------------------------------------
   Réglages dans « Profil praticien » → « Mise en page des documents ».
   Les marges sont produites par le document lui-même (et non par le
   navigateur) : elles sont donc respectées même si l'option « Marges :
   aucune » est choisie dans la fenêtre d'impression. Le pied de page est
   répété en bas de chaque page.
   ===================================================================== */

const CLE_MISE_EN_PAGE = CLE_STOCKAGE + '_miseEnPage';
const MARGES = {                    // haut, côtés, bas (mm)
  etroites: [12, 14, 12],
  normales: [18, 20, 16],
  larges: [25, 25, 22],
};
const MISE_EN_PAGE_DEFAUT = {
  logo: '', logoPosition: 'gauche', logoHauteur: 22,
  enteteMode: 'auto', enteteTexte: '',
  piedTexte: '', piedMentions: true,
  marges: 'normales', police: 'serif',
};

function lireMiseEnPage() {
  try { return { ...MISE_EN_PAGE_DEFAUT, ...(JSON.parse(localStorage.getItem(CLE_MISE_EN_PAGE) || '{}') || {}) }; }
  catch (erreur) { return { ...MISE_EN_PAGE_DEFAUT }; }
}
function ecrireMiseEnPage(mep) {
  try { localStorage.setItem(CLE_MISE_EN_PAGE, JSON.stringify(mep)); return true; }
  catch (erreur) { alert('Enregistrement impossible : le logo est peut-être trop volumineux. Essayez une image plus petite.'); return false; }
}

const lignesEnHtml = texte => String(texte || '').split('\n').map(l => l.trim()).filter(Boolean).map(echapper);

/** Lignes d'en-tête construites depuis le profil praticien. */
function lignesEnteteAuto(avecRpps, p = praticien || {}) {
  const nom = [p.titre || 'Dr', p.prenom, (p.nom || '').toUpperCase()].filter(Boolean).join(' ');
  return [
    p.nom ? `<b>${echapper(nom)}</b>` : '',
    p.specialite ? echapper(p.specialite) : '',
    p.etablissement ? echapper(p.etablissement) : '',
    p.adresse ? echapper(p.adresse) : '',
    p.telephone ? 'Tél. ' + echapper(p.telephone) : '',
    avecRpps ? 'N° RPPS : ' + echapper(p.rpps || '………………………') : '',
  ].filter(Boolean);
}

/**
 * En-tête du document (première page).
 * avecRpps : ordonnances (mention du RPPS obligatoire, ajoutée si absente du texte personnalisé).
 */
function enteteImpression({ avecRpps = false, mep = lireMiseEnPage(), p = praticien || {} } = {}) {
  let lignes;
  if (mep.enteteMode === 'perso' && mep.enteteTexte.trim()) {
    lignes = lignesEnHtml(mep.enteteTexte);
    if (lignes.length) lignes[0] = `<b>${lignes[0]}</b>`;
    if (avecRpps && !/rpps/i.test(mep.enteteTexte)) lignes.push('N° RPPS : ' + echapper(p.rpps || '………………………'));
  } else {
    lignes = lignesEnteteAuto(avecRpps, p);
  }
  if (!lignes.length && !mep.logo) return '';
  const logo = mep.logo ? `<img class="impr-logo" src="${mep.logo}" alt="" style="height:${Number(mep.logoHauteur) || 22}mm">` : '';
  return `<div class="ordo-entete impr-entete logo-${mep.logoPosition}">${logo}<div class="impr-entete-texte">${lignes.join('<br>')}</div></div>`;
}

/* Mention ajoutée en bas de page selon la nature du document (désactivable dans la mise en page).
   Les certificats remis au patient portent leur propre formule dans le corps du texte. */
const MENTIONS_PIED = {
  observation: 'Document de travail à usage médical, destiné aux professionnels participant à la prise en charge. Il n’a pas valeur de certificat médical.',
  courrier: 'Correspondance médicale destinée aux professionnels participant à la prise en charge. Elle n’a pas valeur de certificat médical.',
};

/** Pied de page (répété sur chaque page). nature : 'observation', 'courrier' ou rien. */
function piedImpression(mep = lireMiseEnPage(), nature = '') {
  const lignes = lignesEnHtml(mep.piedTexte);
  if (mep.piedMentions !== false && MENTIONS_PIED[nature]) lignes.push(`<i>${echapper(MENTIONS_PIED[nature])}</i>`);
  return lignes.length ? `<div class="impr-pied">${lignes.join('<br>')}</div>` : '';
}

/** Enveloppe un document pour l'impression : marges, pied de page répété, police. */
function envelopperImpression(html, nature = '', mep = lireMiseEnPage()) {
  const [haut, cotes, bas] = MARGES[mep.marges] || MARGES.normales;
  const pied = piedImpression(mep, nature);
  const hauteurPied = pied ? 6 + 4.2 * (pied.match(/<br>/g) || []).length + 4 : 0;   // mm réservés au pied
  return `
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; min-height: 0 !important; height: auto !important; }
      #zoneOrdonnance { padding: 0 ${cotes}mm; }
      #zoneOrdonnance .impr-pied-fixe { position: fixed; left: ${cotes}mm; right: ${cotes}mm; bottom: ${bas - 6 > 4 ? bas - 6 : 4}mm; }
    </style>
    ${pied ? `<div class="impr-pied-fixe">${pied}</div>` : ''}
    <table class="impr-page police-${mep.police}">
      <thead><tr><td><div style="height:${haut}mm"></div></td></tr></thead>
      <tfoot><tr><td><div style="height:${bas + hauteurPied}mm"></div></td></tr></tfoot>
      <tbody><tr><td>${html}</td></tr></tbody>
    </table>`;
}

/* ---------- Réglages : section ajoutée à la fenêtre « Profil praticien » ---------- */
function htmlReglagesMiseEnPage() {
  return `
  <details class="mep" id="mepZone">
    <summary>Mise en page des documents imprimés (en-tête, logo, pied de page, marges)</summary>
    <div class="mep-grille">
      <div class="mep-reglages">
        <label>Logo (PNG, JPEG ou SVG)</label>
        <div class="mep-logo-ligne">
          <input type="file" id="mepLogoFichier" accept="image/png,image/jpeg,image/svg+xml" hidden>
          <button type="button" id="mepLogoChoisir">Choisir une image…</button>
          <button type="button" id="mepLogoRetirer" class="danger">Retirer</button>
        </div>
        <div class="g">
          <div><label for="mepLogoPosition">Position du logo</label>
            <select id="mepLogoPosition"><option value="gauche">À gauche du texte</option><option value="droite">À droite du texte</option><option value="centre">Centré au-dessus</option></select></div>
          <div><label for="mepLogoHauteur">Hauteur du logo</label>
            <select id="mepLogoHauteur"><option value="14">Petite (14 mm)</option><option value="22">Moyenne (22 mm)</option><option value="30">Grande (30 mm)</option></select></div>
        </div>
        <label for="mepEnteteMode">En-tête</label>
        <select id="mepEnteteMode"><option value="auto">Automatique (nom, spécialité, établissement, adresse, téléphone)</option><option value="perso">Personnalisé</option></select>
        <div id="mepEntetePersoZone">
          <label for="mepEnteteTexte">Texte de l’en-tête (une ligne par ligne imprimée ; la première est en gras)</label>
          <textarea id="mepEnteteTexte" rows="5" placeholder="Dr Prénom NOM&#10;Psychiatre – Ancien interne des hôpitaux&#10;Service de psychiatrie adulte&#10;Adresse&#10;Secrétariat : 04 …"></textarea>
          <div class="sec">Sur les ordonnances, le n° RPPS du profil est ajouté s’il ne figure pas dans ce texte.</div>
        </div>
        <label for="mepPiedTexte">Pied de page (répété en bas de chaque page)</label>
        <textarea id="mepPiedTexte" rows="3" placeholder="ex. Secrétariat : 04 … · secretariat@… · En cas d’urgence : 15 ou 3114"></textarea>
        <label class="ligne-case"><input type="checkbox" id="mepPiedMentions"> Mention adaptée au document : observations et courriers « n’ont pas valeur de certificat médical »</label>
        <div class="g">
          <div><label for="mepMarges">Marges</label>
            <select id="mepMarges"><option value="etroites">Étroites</option><option value="normales">Normales</option><option value="larges">Larges</option></select></div>
          <div><label for="mepPolice">Police</label>
            <select id="mepPolice"><option value="serif">Classique (Georgia)</option><option value="sans">Moderne (sans empattement)</option></select></div>
        </div>
      </div>
      <div><label>Aperçu (haut et bas de la première page)</label><div class="mep-apercu" id="mepApercu"></div></div>
    </div>
  </details>`;
}

let mepEdition = null;              // réglages en cours de modification (appliqués à l'enregistrement du profil)

function lireFormulaireMiseEnPage() {
  Object.assign(mepEdition, {
    logoPosition: $('mepLogoPosition').value, logoHauteur: Number($('mepLogoHauteur').value),
    enteteMode: $('mepEnteteMode').value, enteteTexte: $('mepEnteteTexte').value,
    piedTexte: $('mepPiedTexte').value, piedMentions: $('mepPiedMentions').checked,
    marges: $('mepMarges').value, police: $('mepPolice').value,
  });
}
function afficherApercuMiseEnPage() {
  lireFormulaireMiseEnPage();
  $('mepEntetePersoZone').hidden = mepEdition.enteteMode !== 'perso';
  $('mepLogoRetirer').hidden = !mepEdition.logo;
  // Le profil en cours de saisie sert à l'aperçu de l'en-tête automatique.
  const p = {};
  CHAMPS_PRATICIEN.forEach(c => { p[c] = $('prat_' + c).value.trim(); });
  const [haut, cotes, bas] = MARGES[mepEdition.marges];
  const echelle = 0.42;              // aperçu réduit d'une page A4 (210 mm)
  $('mepApercu').innerHTML = `
    <div class="mep-feuille police-${mepEdition.police}" style="padding:${haut * echelle * 3.78}px ${cotes * echelle * 3.78}px ${bas * echelle * 3.78}px">
      <div class="mep-zoom">
        <div class="ordo">${enteteImpression({ avecRpps: true, mep: mepEdition, p })}
          <p>Marseille, le ${new Date().toLocaleDateString('fr-FR')}</p><p>Cher confrère,</p>
          <p class="mep-faux-texte"></p><p class="mep-faux-texte"></p><p class="mep-faux-texte court"></p>
        </div>
        <div class="mep-pied-apercu">${piedImpression(mepEdition, 'courrier')}</div>
      </div>
    </div>`;
}

/** Réduit le logo (largeur maximale 900 px) pour limiter la place occupée dans le navigateur. */
function chargerLogo(fichier) {
  if (!fichier) return;
  if (fichier.size > 5 * 1024 * 1024) return alert('Image trop volumineuse (5 Mo maximum).');
  const lecteur = new FileReader();
  lecteur.onload = () => {
    if (fichier.type === 'image/svg+xml') { mepEdition.logo = lecteur.result; afficherApercuMiseEnPage(); return; }
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, 900 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * ratio); c.height = Math.round(img.height * ratio);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let url = c.toDataURL('image/png');
      if (url.length > 400000) {                 // photo lourde : JPEG sur fond blanc
        const ctx = c.getContext('2d');
        ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        url = c.toDataURL('image/jpeg', 0.85);
      }
      mepEdition.logo = url;
      afficherApercuMiseEnPage();
    };
    img.onerror = () => alert('Image illisible.');
    img.src = lecteur.result;
  };
  lecteur.readAsDataURL(fichier);
}

function remplirReglagesMiseEnPage() {
  mepEdition = lireMiseEnPage();
  $('mepLogoPosition').value = mepEdition.logoPosition;
  $('mepLogoHauteur').value = String(mepEdition.logoHauteur);
  $('mepEnteteMode').value = mepEdition.enteteMode;
  $('mepEnteteTexte').value = mepEdition.enteteTexte;
  $('mepPiedTexte').value = mepEdition.piedTexte;
  $('mepPiedMentions').checked = mepEdition.piedMentions !== false;
  $('mepMarges').value = mepEdition.marges;
  $('mepPolice').value = mepEdition.police;
  afficherApercuMiseEnPage();
}

(function brancherMiseEnPage() {
  const actions = document.querySelector('#formPraticien > .act');
  actions.insertAdjacentHTML('beforebegin', htmlReglagesMiseEnPage());
  $('mepLogoChoisir').onclick = () => $('mepLogoFichier').click();
  $('mepLogoFichier').onchange = () => { chargerLogo($('mepLogoFichier').files[0]); $('mepLogoFichier').value = ''; };
  $('mepLogoRetirer').onclick = () => { mepEdition.logo = ''; afficherApercuMiseEnPage(); };
  $('mepZone').addEventListener('input', afficherApercuMiseEnPage);
  $('mepZone').addEventListener('change', afficherApercuMiseEnPage);
  document.querySelector('#formPraticien .g').addEventListener('input', () => { if ($('mepZone').open) afficherApercuMiseEnPage(); });
  // Remplir à chaque ouverture du profil (quel que soit le bouton qui l'ouvre) ; enregistrer avec le profil.
  const ouvrirProfilSeul = ouvrirProfilPraticien;
  ouvrirProfilPraticien = function () { ouvrirProfilSeul(); remplirReglagesMiseEnPage(); };
  $('btnPraticien').onclick = ouvrirProfilPraticien;
  $('btnOrdoPraticien').onclick = ouvrirProfilPraticien;
  $('formPraticien').addEventListener('submit', () => {
    if (!mepEdition) return;
    lireFormulaireMiseEnPage();
    if (ecrireMiseEnPage(mepEdition) && $('fenetreOrdonnance').open) rendreOrdonnance();
  });
})();
