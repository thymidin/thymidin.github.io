/* =====================================================================
   MENTIONS.JS — mentions légales, conditions d'utilisation et
   acceptation obligatoire à la première ouverture
   ---------------------------------------------------------------------
   Le texte est versionné (VERSION_CGU) : toute modification importante
   doit incrémenter ce numéro pour redemander l'acceptation.
   L'acceptation est propre à chaque navigateur ; elle n'est pas incluse
   dans la sauvegarde chiffrée et n'est pas effacée par une restauration.
   ===================================================================== */

const VERSION_CGU = 1;
const DATE_CGU = '27 octobre 2026';
const CLE_CGU = CLE_STOCKAGE + '_cgu';

const MENTIONS_HTML = `
<h3>1. Objet et statut de l’outil</h3>
<p>Le « Portail de suivi psychiatrique » est un outil personnel d’aide à l’organisation du suivi et à la rédaction,
développé par un praticien et mis à disposition <b>à titre gracieux, personnel et non officiel</b>.</p>
<ul>
  <li>Il n’est <b>ni fourni, ni validé, ni maintenu</b> par un établissement de santé, sa direction des systèmes
  d’information, son délégué à la protection des données ou un éditeur de logiciel.</li>
  <li>Ce n’est <b>pas un dossier patient</b> ni un logiciel métier homologué ; il n’est pas compatible avec le DMP et ne
  permet ni l’identification du professionnel par carte CPS / e-CPS, ni la vérification de l’identité des patients (INS).</li>
  <li>Il n’a fait l’objet d’<b>aucun marquage CE</b> ni d’aucune évaluation au titre de la réglementation des dispositifs
  médicaux. Il ne pose aucun diagnostic et ne prend aucune décision : il <b>ne remplace en aucun cas le jugement
  clinique</b> du praticien.</li>
</ul>

<h3>2. Absence de garantie et responsabilité</h3>
<ul>
  <li>L’outil est fourni <b>« en l’état »</b>, sans garantie d’aucune sorte (exactitude, exhaustivité, mise à jour,
  disponibilité, absence d’erreur ou de perte de données).</li>
  <li>Dans toute la mesure permise par la loi, l’auteur <b>ne peut être tenu responsable</b> des conséquences directes ou
  indirectes de son utilisation, notamment des décisions cliniques, prescriptions, certificats, courriers ou documents
  produits, ni d’une perte, d’une altération ou d’une divulgation de données.</li>
  <li>Chaque utilisateur <b>reste seul responsable</b> de sa pratique, de la vérification de tout contenu généré avant
  usage, et des documents qu’il date et signe.</li>
</ul>

<h3>3. Contenus médicaux, réglementaires et administratifs</h3>
<ul>
  <li><b>Échelles</b> : les cotations et seuils sont fournis à titre indicatif ; un score est une aide au repérage, jamais
  un diagnostic. Vérifier la version de référence de chaque échelle et ses conditions d’utilisation (section 6).</li>
  <li><b>Surveillance biologique et règles de prescription</b> : rappels indicatifs, susceptibles d’être incomplets ou
  dépassés. Les résumés des caractéristiques du produit, les recommandations de la HAS, les décisions de l’ANSM et la
  réglementation en vigueur font foi.</li>
  <li><b>Certificats de soins sans consentement</b> : modèles construits d’après le code de la santé publique, à vérifier
  avec les modèles et procédures de l’établissement ; le certificat décrit les constatations personnelles du signataire.</li>
  <li><b>Certificat MDPH</b> : le formulaire officiel (Cerfa 15695*01) est rempli sans modification de sa présentation ;
  le contenu relève du seul médecin signataire. Vérifier qu’il s’agit de la version en vigueur.</li>
  <li><b>Textes rédigés automatiquement</b> (observations, notes, courriers) : propositions à relire, corriger et
  compléter ; elles ne doivent pas être reportées sans vérification.</li>
</ul>

<h3>4. Données personnelles et données de santé</h3>
<ul>
  <li><b>Aucune donnée n’est transmise par l’outil</b> : tout est enregistré dans le navigateur de l’appareil utilisé.
  L’outil n’est pas hébergé : il n’existe ni serveur, ni hébergement certifié de données de santé (HDS).</li>
  <li>Les données saisies sont des données de santé couvertes par le <b>secret médical</b> (code de la santé publique)
  et par le <b>RGPD</b>. L’utilisateur qui y saisit des données identifiantes en assume la responsabilité.</li>
  <li><b>En établissement de santé</b> : l’outil n’ayant pas été validé par l’établissement, son usage doit respecter la
  politique de sécurité des systèmes d’information et les consignes du délégué à la protection des données. En cas de
  doute, <b>demander leur avis avant toute saisie de données identifiantes</b>, et privilégier un identifiant pseudonymisé
  (initiales et numéro de dossier).</li>
  <li><b>En exercice libéral</b> : le praticien est responsable du traitement des données de ses patients (information
  des patients, registre des traitements, sécurité, durée de conservation).</li>
  <li><b>Le dossier officiel reste le dossier patient</b> de l’établissement ou du cabinet : toute information utile à
  la prise en charge doit y être reportée. Le portail n’en est ni une copie ni un substitut.</li>
</ul>

<h3>5. Sécurité : règles d’usage</h3>
<ul>
  <li>Utiliser un <b>poste professionnel</b>, protégé par une session personnelle et un mot de passe ; jamais un ordinateur
  public ou partagé, ni la navigation privée (les données y sont effacées à la fermeture).</li>
  <li>Les données enregistrées dans le navigateur <b>ne sont pas chiffrées</b> sur le disque : quiconque accède à la
  session peut les lire. Verrouiller le poste en s’absentant.</li>
  <li>Faire des <b>sauvegardes chiffrées</b> régulières ; le mot de passe d’une sauvegarde ne peut pas être récupéré.</li>
  <li>Ne pas conserver de sauvegarde, d’export CSV ou JSON (non chiffrés) sur un stockage en ligne non certifié HDS
  (messagerie personnelle, Drive, Dropbox…), ni sur un support amovible non chiffré.</li>
  <li>Ne pas transmettre de données de patients à un service d’intelligence artificielle ou à tout tiers non autorisé.</li>
  <li>Ne pas modifier le code sans en mesurer les conséquences : une modification peut fausser les cotations ou les
  échéances de surveillance (les tests fournis permettent de vérifier les cotations).</li>
</ul>

<h3>6. Propriété intellectuelle</h3>
<ul>
  <li>Le portail (code, textes, mise en page) : <b>tous droits réservés</b>. Son utilisation gratuite est autorisée aux
  personnes à qui il a été remis, pour leur usage professionnel. Toute modification, rediffusion, publication ou
  exploitation commerciale est soumise à l’accord préalable de l’auteur.</li>
  <li><b>Échelles</b> : les questionnaires restent la propriété de leurs auteurs et éditeurs respectifs (QIDS-SR16 : Rush
  et coll. ; AQ et EQ : Baron-Cohen et coll., Autism Research Centre, Université de Cambridge ; RAADS-R : Ritvo et coll. ;
  PHQ-9 et GAD-7 : Spitzer, Kroenke, Williams et coll.). Les intitulés intégrés proviennent des versions françaises
  fournies par l’utilisateur ; leur usage doit respecter les conditions fixées par leurs auteurs.</li>
  <li><b>Formulaire Cerfa 15695*01</b> : document administratif officiel, reproduit sans modification.</li>
  <li><b>Composants tiers</b> : pdf-lib (licence MIT, © Andrew Dillon) et ses dépendances, sous leurs licences respectives.</li>
</ul>

<h3>7. Évolution des conditions</h3>
<p>Ces conditions peuvent évoluer avec les versions du portail ; une nouvelle acceptation est alors demandée.
Version ${VERSION_CGU} du ${DATE_CGU}.</p>
`;

function lireAcceptation() {
  try { return JSON.parse(localStorage.getItem(CLE_CGU) || 'null'); } catch (erreur) { return null; }
}

function creerFenetreMentions() {
  const d = document.createElement('dialog');
  d.id = 'fenetreMentions';
  d.className = 'fenetre-mentions';
  d.innerHTML = `
    <div class="mentions-entete"><h2>Mentions légales et conditions d’utilisation</h2>
      <p class="sec" id="mentionsEtat"></p></div>
    <div class="mentions-texte">${MENTIONS_HTML}</div>
    <div class="mentions-pied">
      <label class="mentions-accord" id="mentionsAccordZone"><input type="checkbox" id="mentionsAccord">
        J’ai lu ces conditions et je les accepte. Je reste seul(e) responsable de l’usage que je fais de cet outil et des
        données que j’y saisis.</label>
      <div class="act"><button type="button" id="mentionsImprimer">Imprimer</button><span class="sp"></span>
        <button type="button" class="main" id="mentionsValider">Fermer</button></div>
    </div>`;
  document.body.appendChild(d);
  // Tant que les conditions ne sont pas acceptées, la fenêtre ne peut pas être fermée par Échap.
  d.addEventListener('cancel', e => { if (!lireAcceptation() || lireAcceptation().version < VERSION_CGU) e.preventDefault(); });
  $('mentionsAccord').onchange = () => { $('mentionsValider').disabled = !$('mentionsAccord').checked; };
  $('mentionsImprimer').onclick = () => {
    const aAccepter = !$('mentionsAccordZone').hidden;
    d.close();
    imprimerDocument(`<div class="mentions-impression"><h2>Portail de suivi psychiatrique — mentions légales et conditions d’utilisation</h2>${MENTIONS_HTML}</div>`);
    ouvrirMentions(aAccepter);
  };
  $('mentionsValider').onclick = () => {
    const acc = lireAcceptation();
    if (!acc || acc.version < VERSION_CGU) {
      if (!$('mentionsAccord').checked) return;
      try { localStorage.setItem(CLE_CGU, JSON.stringify({ version: VERSION_CGU, date: new Date().toISOString() })); } catch (erreur) { /* ignoré */ }
      toast('Conditions d’utilisation acceptées.');
    }
    d.close();
  };
}

/** Ouvre les mentions ; `obligatoire` = première ouverture ou nouvelle version à accepter. */
function ouvrirMentions(obligatoire) {
  if (!$('fenetreMentions')) creerFenetreMentions();
  const acc = lireAcceptation();
  const aAccepter = obligatoire || !acc || acc.version < VERSION_CGU;
  $('mentionsAccordZone').hidden = !aAccepter;
  $('mentionsAccord').checked = false;
  $('mentionsValider').disabled = aAccepter;
  $('mentionsValider').textContent = aAccepter ? 'Accepter et continuer' : 'Fermer';
  $('mentionsEtat').textContent = aAccepter
    ? 'À lire et accepter avant la première utilisation.'
    : `Acceptées dans ce navigateur le ${new Date(acc.date).toLocaleDateString('fr-FR')} (version ${acc.version}).`;
  $('fenetreMentions').showModal();
  $('fenetreMentions').querySelector('.mentions-texte').scrollTop = 0;
}

// Lien permanent dans le menu latéral et dans l'aide.
(function brancherMentions() {
  const ref = $('btnParametres');
  if (ref) ref.insertAdjacentHTML('afterend', `<button type="button" class="tabs-reglage" id="btnMentions">
    <span data-icone="note"></span><span class="libelle-onglet">Mentions légales</span></button>`);
  $('btnMentions').onclick = () => ouvrirMentions(false);
  const aide = document.querySelector('#fenetreAide .act');
  if (aide) aide.insertAdjacentHTML('afterbegin', '<button type="button" onclick="this.closest(\'dialog\').close(); ouvrirMentions(false)">Mentions légales</button>');
  const acc = lireAcceptation();
  if (!acc || acc.version < VERSION_CGU) ouvrirMentions(true);
})();
