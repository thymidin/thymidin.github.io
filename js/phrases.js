/* =====================================================================
   PHRASES.JS — « Mes phrases types » : formulations personnelles
   réutilisables, insérées d'un clic dans le texte en cours
   (observation, note de suivi, documents). Gardées dans ce navigateur
   et incluses dans la sauvegarde chiffrée.
   ===================================================================== */
const CLE_PHRASES = CLE_STOCKAGE + '_phrases';
const PHRASES_DEPART = [
  'Information délivrée sur le traitement, ses effets indésirables et les modalités de surveillance.',
  'Numéros d’urgence communiqués (3114, 15) ; consigne de reconsulter en cas d’aggravation.',
  'Accord du patient pour un lien avec le médecin traitant.',
  'Pas d’élément en faveur d’une dangerosité psychiatrique immédiate à l’issue de l’entretien.',
  'Entretien réalisé en présence d’un proche, avec l’accord du patient.',
  'Arrêt progressif expliqué ; ne pas interrompre brutalement le traitement.',
];
let derniereZoneTexte = {};                 // dernier champ de texte actif, par module

function lirePhrases() {
  try { const p = JSON.parse(localStorage.getItem(CLE_PHRASES) || 'null'); return Array.isArray(p) ? p : [...PHRASES_DEPART]; }
  catch (erreur) { return [...PHRASES_DEPART]; }
}
function ecrirePhrases(liste) { try { localStorage.setItem(CLE_PHRASES, JSON.stringify(liste)); } catch (erreur) { /* ignoré */ } }

function htmlPhrases(module) {
  return `<details class="phrases" data-phrases="${module}"><summary>Mes phrases types</summary>
    <div class="sec">Un clic insère la phrase à l’endroit du curseur (dans le dernier champ utilisé, sinon dans le texte final).</div>
    <div class="phrases-liste"></div>
    <div class="phrases-ajout"><input placeholder="Nouvelle phrase type…" aria-label="Nouvelle phrase type"><button type="button" data-phrase-ajouter>Ajouter</button></div>
  </details>`;
}
function afficherPhrases() {
  const liste = lirePhrases();
  document.querySelectorAll('[data-phrases] .phrases-liste').forEach(zone => {
    zone.innerHTML = liste.map((t, i) => `<span class="phrase"><button type="button" data-phrase="${i}" title="Insérer">${echapper(t)}</button>
      <button type="button" class="suppr" data-phrase-suppr="${i}" title="Supprimer cette phrase" aria-label="Supprimer">×</button></span>`).join('')
      || '<span class="sec">Aucune phrase : ajoutez la vôtre ci-dessous.</span>';
  });
}
function insererTexte(zone, texte) {
  const debut = zone.selectionStart ?? zone.value.length, fin = zone.selectionEnd ?? zone.value.length;
  const avant = zone.value.slice(0, debut), apres = zone.value.slice(fin);
  const sep = avant && !/\s$/.test(avant) ? ' ' : '';
  zone.value = avant + sep + texte + apres;
  zone.selectionStart = zone.selectionEnd = (avant + sep + texte).length;
  zone.dispatchEvent(new Event('input', { bubbles: true }));
  zone.focus();
}

function brancherPhrases() {
  // Observation : sous le texte généré ; Documents : sous le document.
  $('obsHistorique').insertAdjacentHTML('beforebegin', htmlPhrases('observation'));
  $('docHistorique').insertAdjacentHTML('beforebegin', htmlPhrases('documents'));
  afficherPhrases();
  // Mémorise le dernier champ texte utilisé dans chaque module.
  document.addEventListener('focusin', e => {
    const z = e.target;
    if (!/TEXTAREA|INPUT/.test(z.tagName) || (z.type && !/text|search/.test(z.type) && z.tagName === 'INPUT')) return;
    if (z.closest('#vueObservation')) derniereZoneTexte.observation = z;
    if (z.closest('#vueDocuments')) derniereZoneTexte.documents = z;
  });
  document.addEventListener('click', e => {
    const bloc = e.target.closest('[data-phrases]');
    if (!bloc) return;
    const module = bloc.dataset.phrases;
    const liste = lirePhrases();
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.phrase !== undefined) {
      const zone = (derniereZoneTexte[module] && document.contains(derniereZoneTexte[module]) && !derniereZoneTexte[module].closest('.phrases-ajout'))
        ? derniereZoneTexte[module] : $(module === 'observation' ? 'obsTexte' : 'docTexte');
      if (zone.id === 'obsTexte') obsTexteModifie = true;
      if (zone.id === 'docTexte') docTexteModifie = true;
      insererTexte(zone, liste[+b.dataset.phrase]);
    }
    if (b.dataset.phraseSuppr !== undefined && confirm('Supprimer cette phrase type ?')) {
      liste.splice(+b.dataset.phraseSuppr, 1); ecrirePhrases(liste); afficherPhrases();
    }
    if (b.hasAttribute('data-phrase-ajouter')) {
      const champ = bloc.querySelector('.phrases-ajout input');
      const t = champ.value.trim();
      if (!t) return;
      liste.push(t); ecrirePhrases(liste); champ.value = ''; afficherPhrases();
      toast('Phrase type ajoutée.');
    }
  });
}
brancherPhrases();
