/* =====================================================================
   FICHE.JS — fiche patient en trois onglets : identité, synthèse et
   traitements, relais
   ---------------------------------------------------------------------
   Nouveau patient : la fiche s'ouvre sur « Identité » (bouton
   « Suivant » pour passer aux onglets suivants). Patient existant : elle
   s'ouvre sur « Synthèse et traitements ».
   ===================================================================== */

// Champs ajoutés à la fiche (identité, entourage).
CHAMPS_FICHE.push('telPatient', 'adresse', 'personneConfiance', 'protection', 'protecteur');
const ORDRE_ONGLETS_FICHE = ['identite', 'synthese', 'relais'];

function afficherOngletFiche(nom) {
  document.querySelectorAll('[data-fiche-onglet]').forEach(b => {
    const actif = b.dataset.ficheOnglet === nom;
    b.classList.toggle('on', actif);
    b.setAttribute('aria-selected', String(actif));
  });
  document.querySelectorAll('[data-fiche-panneau]').forEach(p => { p.hidden = p.dataset.fichePanneau !== nom; });
  $('ficheSuivant').hidden = nom === ORDRE_ONGLETS_FICHE[ORDRE_ONGLETS_FICHE.length - 1];
  majIndicateursFiche();
}

function majIndicateursFiche() {
  $('fichePastilleRelais').hidden = !$('aRelayer').checked;
  $('zoneProtecteur').hidden = !$('protection').value;
}

(function brancherFiche() {
  document.querySelector('.fiche-onglets').addEventListener('click', e => {
    const b = e.target.closest('[data-fiche-onglet]');
    if (b) afficherOngletFiche(b.dataset.ficheOnglet);
  });
  $('ficheSuivant').onclick = () => {
    const actuel = document.querySelector('[data-fiche-onglet].on').dataset.ficheOnglet;
    afficherOngletFiche(ORDRE_ONGLETS_FICHE[Math.min(ORDRE_ONGLETS_FICHE.indexOf(actuel) + 1, ORDRE_ONGLETS_FICHE.length - 1)]);
  };
  $('aRelayer').addEventListener('change', majIndicateursFiche);
  $('protection').addEventListener('change', majIndicateursFiche);
  // Champ obligatoire vide dans un onglet masqué : afficher cet onglet avant que le navigateur ne le signale.
  $('formPatient').addEventListener('invalid', e => {
    const panneau = e.target.closest('[data-fiche-panneau]');
    if (panneau && panneau.hidden) afficherOngletFiche(panneau.dataset.fichePanneau);
  }, true);
  // À chaque ouverture : onglet adapté (nouveau patient → identité ; patient existant → synthèse).
  const ouvrirFicheSeule = ouvrirFiche;
  ouvrirFiche = function (id, ...reste) {
    const r = ouvrirFicheSeule(id, ...reste);
    afficherOngletFiche(id ? 'synthese' : 'identite');
    if (!id) setTimeout(() => $('nom').focus(), 0);
    return r;
  };
})();
