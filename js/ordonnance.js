/* =====================================================================
   ORDONNANCE.JS — profil du prescripteur et ordonnances de bilans pré-remplies
   ---------------------------------------------------------------------
   Depuis une fiche patient, le bouton « Ordonnance de bilans » prépare une
   ordonnance d'examens de biologie à partir des bilans à faire (en retard
   ou proches), adaptée au sexe et à l'âge du patient. Elle s'imprime pour être
   DATÉE ET SIGNÉE par le prescripteur.

   ⚠ Pas d'identification par CPS / e-CPS :
   cette application fonctionne en local, sans serveur ni Internet. Pro Santé
   Connect (le service d'authentification CPS / e-CPS de l'ANS) exige un service
   web déclaré auprès de l'ANS, avec des identifiants confidentiels et une
   adresse de redirection sécurisée : impossible depuis un fichier ouvert sur
   un poste. Le profil du prescripteur est donc saisi à la main (bouton
   « Profil praticien ») et l'ordonnance n'a de valeur qu'une fois signée.

   Les examens associés à chaque bilan se règlent dans config.js
   (propriétés `examens`, `preTherapeutique`, `consigne`).
   ===================================================================== */

const CLE_PRATICIEN = CLE_STOCKAGE + '_praticien';
const CHAMPS_PRATICIEN = ['titre', 'prenom', 'nom', 'specialite', 'rpps', 'etablissement', 'adresse', 'telephone', 'ville'];

let praticien = {};                                   // profil du prescripteur (enregistré dans ce navigateur)

// État de la fenêtre d'ordonnance en cours :
let ordonnance = {
  elements: [],          // bilans proposés
  coches: new Set(),     // identifiants des bilans cochés
  exclus: new Set(),     // examens décochés (clés normalisées)
  vus: new Set(),        // examens déjà présentés (pour décocher d'office ceux « sous réserve »)
};


/* ---------------------------------------------------------------------
   A. PROFIL DU PRESCRIPTEUR
   --------------------------------------------------------------------- */
function chargerPraticien() {
  try { praticien = JSON.parse(localStorage.getItem(CLE_PRATICIEN) || '{}') || {}; }
  catch (erreur) { praticien = {}; }
}

/** Le profil est « complet » s'il comporte au moins le nom et le n° RPPS. */
const praticienRenseigne = () => !!(praticien.nom && praticien.rpps);

function ouvrirProfilPraticien() {
  const parDefaut = { titre: 'Dr', specialite: SPECIALITE_PAR_DEFAUT };
  CHAMPS_PRATICIEN.forEach(champ => { $('prat_' + champ).value = praticien[champ] ?? parDefaut[champ] ?? ''; });
  $('fenetrePraticien').showModal();
}

function enregistrerProfilPraticien(evenement) {
  const profil = {};
  CHAMPS_PRATICIEN.forEach(champ => { profil[champ] = $('prat_' + champ).value.trim(); });
  profil.rpps = profil.rpps.replace(/\s/g, '');

  if (profil.rpps && !/^\d{11}$/.test(profil.rpps)) {
    if (!confirm('Un numéro RPPS comporte 11 chiffres. Enregistrer quand même ?')) {
      evenement.preventDefault();                     // garde la fenêtre ouverte
      return;
    }
  }
  praticien = profil;
  try { localStorage.setItem(CLE_PRATICIEN, JSON.stringify(profil)); }
  catch (erreur) { alert('Enregistrement impossible dans ce navigateur.'); }

  if ($('fenetreOrdonnance').open) rendreOrdonnance();   // met à jour l'aperçu
}


/* ---------------------------------------------------------------------
   B. CONSTRUCTION DE L'ORDONNANCE
   --------------------------------------------------------------------- */

/** Clé de comparaison d'un examen (sans accents, minuscules) pour éviter les doublons. */
const cleExamen = texte => texte.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Bilans proposés : pour chaque traitement surveillé de la fiche ouverte (modifications
 *  non enregistrées comprises), le bilan pré-thérapeutique éventuel et les bilans de suivi.
 *  Seuls les bilans comportant des examens de biologie sont retenus. */
function construireElementsOrdonnance() {
  const elements = [];

  traitementsEnEdition.forEach((traitement, index) => {
    const regle = trouverRegle(traitement.nom);
    if (!regle || traitement.fin) return;
    const ctx = contexteFormulaire(traitement);

    if (!traitement.pre && !traitement.ancien && !regle.sansPreTherapeutique) {
      elements.push({
        id: index + ':pre',
        traitement: traitement.nom,
        libelle: 'Bilan pré-thérapeutique',
        statut: 'retard',
        texteEtat: '⏰ Non documenté',
        examens: listeExamens(regle.preTherapeutique.biologie, ctx),
        consigne: regle.preTherapeutique.consigne || '',
      });
    }

    calculerEcheances(traitement, ctx).forEach(etat => {
      elements.push({
        id: index + ':' + etat.bilan.id,
        traitement: traitement.nom,
        libelle: etat.libelle,
        statut: etat.statut,
        texteEtat: texteEtatBilan(etat),
        examens: listeExamens(etat.bilan.examens, ctx),
        consigne: etat.bilan.consigne || '',
      });
    });
  });

  return elements.filter(element => element.examens.length);
}

/** Examens des bilans cochés, sans doublon (la NFS demandée par trois bilans
 *  n'apparaît qu'une fois). Les examens « sous réserve » (sexe inconnu) sont
 *  décochés d'office : à vous de les cocher si besoin. */
function examensRetenus() {
  const liste = [];
  const dejaVus = new Set();

  ordonnance.elements
    .filter(element => ordonnance.coches.has(element.id))
    .forEach(element => element.examens.forEach(examen => {
      const cle = cleExamen(examen.base);
      if (dejaVus.has(cle)) return;
      dejaVus.add(cle);
      liste.push({ cle, base: examen.base, texte: examen.texte, incertain: examen.incertain });

      if (!ordonnance.vus.has(cle)) {
        ordonnance.vus.add(cle);
        if (examen.incertain) ordonnance.exclus.add(cle);
      }
    }));

  return liste;
}

/** Ouvre la fenêtre d'ordonnance pour la fiche en cours d'édition. */
function ouvrirOrdonnance() {
  if (!$('nom').value.trim()) {
    alert('Renseignez au moins le nom du patient avant de préparer une ordonnance.');
    return;
  }

  ordonnance.elements = construireElementsOrdonnance();
  // Pré-cochés : bilans en retard ou à échéance proche.
  ordonnance.coches = new Set(
    ordonnance.elements.filter(e => e.statut === 'retard' || e.statut === 'bientot').map(e => e.id)
  );
  ordonnance.exclus = new Set();
  ordonnance.vus = new Set();

  const molecules = [...new Set(ordonnance.elements.map(e => e.traitement))];
  $('ordoRenseignements').value = molecules.length
    ? 'Surveillance biologique d’un traitement par ' + molecules.join(', ') + '.'
    : '';
  $('ordoLibre').value = '';
  $('ordoLieu').value = 'au laboratoire';
  $('ordoType').value = 'auto';
  $('ordoAld').value = 'rapport';
  $('ordoAldZone').hidden = !$('ald').checked;      // choix proposé seulement si le patient est en ALD

  $('fenetreOrdonnance').showModal();
  rendreOrdonnance();
}


/* ---------------------------------------------------------------------
   C. AFFICHAGE DE LA FENÊTRE ET DU DOCUMENT
   --------------------------------------------------------------------- */

/** Redessine les listes de choix (bilans, examens) puis l'aperçu. */
function rendreOrdonnance() {
  // Bilans proposés, groupés par traitement.
  const groupes = {};
  ordonnance.elements.forEach(e => (groupes[e.traitement] = groupes[e.traitement] || []).push(e));

  $('ordoBilans').innerHTML = ordonnance.elements.length
    ? Object.keys(groupes).map(nom => `
        <div class="ordo-groupe"><b>${echapper(nom)}</b>
          ${groupes[nom].map(e => `
            <label class="ligne-case">
              <input type="checkbox" data-ordo-bilan="${echapper(e.id)}" ${ordonnance.coches.has(e.id) ? 'checked' : ''}>
              <span>${echapper(e.libelle)}</span>
              <span class="badge ${e.statut}">${echapper(e.texteEtat)}</span>
            </label>`).join('')}
        </div>`).join('')
    : '<div class="sec">Aucun bilan de biologie à proposer (ajoutez un traitement surveillé avec sa date d’introduction, ou saisissez des examens ci-dessous).</div>';

  // Examens qui en résultent (décochables un par un).
  const examens = examensRetenus();
  $('ordoExamens').innerHTML = examens.length
    ? examens.map(x => `
        <label class="ligne-case">
          <input type="checkbox" data-ordo-exam="${echapper(x.cle)}" ${ordonnance.exclus.has(x.cle) ? '' : 'checked'}>
          <span>${echapper(x.texte)}</span>
          ${x.incertain ? '<span class="badge bientot">sexe non renseigné : à confirmer</span>' : ''}
        </label>`).join('')
    : '<div class="sec">Aucun examen sélectionné.</div>';

  $('ordoAlertePraticien').hidden = praticienRenseigne();
  rendreApercu();
}

function rendreApercu() {
  $('ordoApercu').innerHTML = htmlOrdonnance();
}

/** Examens finalement prescrits : cochés, puis lignes libres saisies à la main. */
function examensPrescrits() {
  const coches = examensRetenus().filter(x => !ordonnance.exclus.has(x.cle)).map(x => x.base);
  const libres = $('ordoLibre').value.split('\n').map(l => l.trim()).filter(Boolean);
  return [...coches, ...libres];
}

/** Consignes de prélèvement (à jeun, lithémie…) déduites des bilans et examens retenus. */
function consignesPrelevement(examens) {
  const consignes = [];
  ordonnance.elements
    .filter(e => ordonnance.coches.has(e.id) && e.consigne)
    .forEach(e => { if (!consignes.includes(e.consigne)) consignes.push(e.consigne); });
  if (examens.some(texte => /jeun/i.test(texte))) consignes.unshift('Prélèvement à jeun.');
  return consignes;
}

/** HTML du document d'ordonnance (aperçu et impression). */
function htmlOrdonnance() {
  const point = '………………………';                       // à compléter à la main si le profil est vide
  const p = praticien;
  const nomPraticien = [p.titre, p.prenom, (p.nom || '').toUpperCase()].filter(Boolean).join(' ') || point;

  const ddn = $('ddn').value;
  const identitePatient = `${echapper($('nom').value.trim().toUpperCase())} ${echapper($('prenom').value.trim())}`;
  const naissance = ddn ? `Né(e) le ${formaterDate(ddn)}` : '';
  const sexe = libelleSexe($('sexe').value);

  const examens = examensPrescrits();
  const consignes = consignesPrelevement(examens);
  const renseignements = $('ordoRenseignements').value.trim();

  // Formulation : « Faire pratiquer à domicile / au laboratoire, un bilan sanguin / urinaire… »
  const estUrinaire = texte => /urin|protéinurie|proteinurie|créatininurie|creatininurie|ecbu/i.test(texte);
  let typeBilan = $('ordoType').value;
  if (typeBilan === 'auto') {
    const urinaire = examens.some(estUrinaire);
    const sanguin = examens.some(texte => !estUrinaire(texte));
    typeBilan = urinaire && sanguin ? 'sanguin et urinaire' : urinaire ? 'urinaire' : 'sanguin';
  }
  const phrase = TEXTE_ORDONNANCE.phrase($('ordoLieu').value, typeBilan);

  // Patient en ALD : ordonnance bizone (prescription en rapport ou non avec l'ALD).
  let htmlAld = '';
  if ($('ald').checked) {
    const enRapport = $('ordoAld').value === 'rapport';
    const precision = enRapport && $('aldTexte').value.trim() ? ' : ' + $('aldTexte').value.trim() : '';
    htmlAld = `<p class="ordo-ald"><b>${echapper(enRapport ? TEXTE_ORDONNANCE.aldEnRapport : TEXTE_ORDONNANCE.aldSansRapport)}</b>${echapper(precision)}</p>`;
  }
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <div class="ordo">
      <div class="ordo-entete">
        <div><b>${echapper(nomPraticien)}</b></div>
        ${p.specialite ? `<div>${echapper(p.specialite)}</div>` : ''}
        ${p.etablissement ? `<div>${echapper(p.etablissement)}</div>` : ''}
        ${p.adresse ? `<div>${echapper(p.adresse)}</div>` : ''}
        ${p.telephone ? `<div>Tél. ${echapper(p.telephone)}</div>` : ''}
        <div>N° RPPS : ${echapper(p.rpps || point)}</div>
      </div>

      <h2>${echapper(TEXTE_ORDONNANCE.titre)}</h2>
      <p class="ordo-date">Fait à ${echapper(p.ville || point)}, le ${echapper(date)}</p>

      <p class="ordo-patient">
        <b>Patient :</b> ${identitePatient}<br>
        ${[naissance, sexe && 'Sexe : ' + sexe].filter(Boolean).map(echapper).join(' · ')}
      </p>

      ${renseignements ? `<p><b>Renseignements cliniques :</b> ${echapper(renseignements)}</p>` : ''}

      ${htmlAld}

      <p>${echapper(phrase)}</p>
      ${examens.length
        ? `<ul class="ordo-examens">${examens.map(x => `<li>${echapper(x)}</li>`).join('')}</ul>`
        : '<p class="manquant">(aucun examen sélectionné)</p>'}

      ${consignes.length ? `<p class="ordo-consignes">${consignes.map(echapper).join('<br>')}</p>` : ''}

      <div class="ordo-signature">Signature et cachet du prescripteur</div>
    </div>`;
}

/** Imprime uniquement l'ordonnance (le reste de la page est masqué à l'impression). */
function imprimerOrdonnance() {
  if (!examensPrescrits().length) {
    alert('Aucun examen sélectionné.');
    return;
  }
  $('zoneOrdonnance').innerHTML = htmlOrdonnance();
  document.body.classList.add('impression-ordonnance');

  const nettoyer = () => {
    document.body.classList.remove('impression-ordonnance');
    $('zoneOrdonnance').innerHTML = '';
    window.removeEventListener('afterprint', nettoyer);
  };
  window.addEventListener('afterprint', nettoyer);
  print();
}


/* ---------------------------------------------------------------------
   D. ÉVÉNEMENTS (appelé au démarrage par interface.js)
   --------------------------------------------------------------------- */
function brancherOrdonnance() {
  chargerPraticien();

  // Profil du prescripteur
  $('btnPraticien').onclick = ouvrirProfilPraticien;
  $('btnOrdoPraticien').onclick = ouvrirProfilPraticien;
  $('btnPraticienAnnuler').onclick = () => $('fenetrePraticien').close();
  $('formPraticien').addEventListener('submit', enregistrerProfilPraticien);

  // Ordonnance
  $('btnOrdonnance').onclick = ouvrirOrdonnance;
  $('btnOrdoFermer').onclick = () => $('fenetreOrdonnance').close();
  $('btnOrdoImprimer').onclick = imprimerOrdonnance;

  $('fenetreOrdonnance').addEventListener('change', evenement => {
    const cible = evenement.target;
    if (cible.dataset.ordoBilan) {                         // case d'un bilan
      const id = cible.dataset.ordoBilan;
      if (cible.checked) ordonnance.coches.add(id); else ordonnance.coches.delete(id);
      rendreOrdonnance();
    } else if (cible.dataset.ordoExam) {                   // case d'un examen
      const cle = cible.dataset.ordoExam;
      if (cible.checked) ordonnance.exclus.delete(cle); else ordonnance.exclus.add(cle);
      rendreApercu();
    }
  });
  ['ordoLibre', 'ordoRenseignements', 'ordoLieu', 'ordoType', 'ordoAld']
    .forEach(id => $(id).addEventListener('input', rendreApercu));
}
