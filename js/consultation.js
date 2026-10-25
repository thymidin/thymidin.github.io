/* =====================================================================
   CONSULTATION.JS — écran de consultation d'un patient
   ---------------------------------------------------------------------
   Tout ce qui sert pendant une consultation, sur un seul écran :
   identité et points de vigilance, traitements et bilans à faire,
   dernière note, évolution des échelles, courbe de l'humeur récente,
   plan de sécurité, et les actions du jour (note de suivi, échelle,
   ordonnance de bilans, courrier, certificat, MDPH).
   Rien n'est stocké ici : l'écran lit la fiche et les autres modules.
   ===================================================================== */

let consPatientId = '';
const patientCons = () => patients.find(p => p.id === consPatientId);

function initialiserConsultation() {
  $('vueConsultation').innerHTML = `
    <div class="carte cons-barre">
      <div class="bar" style="margin:0">
        <label for="consPatient" style="margin:0">Patient</label>
        <select id="consPatient" style="max-width:360px"></select>
        <span class="sec">Ctrl+K : rechercher un patient</span>
        <span class="sp" style="flex:1"></span>
        <button type="button" id="consFiche">Modifier la fiche</button>
        <button type="button" class="main" id="consNouveau">+ Nouveau patient</button>
      </div>
    </div>
    <div id="consContenu"></div>`;
  $('consPatient').onchange = () => { consPatientId = $('consPatient').value; afficherConsultation(); };
  $('consFiche').onclick = () => { if (consPatientId) ouvrirFiche(consPatientId); };
  $('consNouveau').onclick = () => ouvrirFiche(null);
  $('consContenu').addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b || !consPatientId) return;
    actionConsultation(b.dataset.action, b.dataset);
  });
}

function afficherVueConsultation(idPatient) {
  if (idPatient !== undefined) consPatientId = idPatient;
  remplirSelectPatients($('consPatient'), consPatientId);
  consPatientId = $('consPatient').value;
  afficherConsultation();
}

function actionConsultation(action, d) {
  const id = consPatientId;
  const p = patientCons();
  switch (action) {
    case 'rappel-delai': {
      const date = ajouterJours(aujourdhui(), +d.jours);
      $('consRappelDate').value = versIso(date);
      return;
    }
    case 'rappel-ajouter': {
      const texte = $('consRappelTexte').value.trim(), date = $('consRappelDate').value;
      if (!texte || !date) return signaler(null, 'Indiquez le rappel et sa date.');
      p.rappels = p.rappels || [];
      p.rappels.push({ id: String(Date.now()) + Math.random().toString(36).slice(2, 5), texte, date, fait: false });
      sauvegarderPatients(); afficherConsultation(); signaler(null, 'Rappel ajouté.');
      return;
    }
    case 'rappel-fait': {
      const r = (p.rappels || []).find(x => x.id === d.id);
      if (r) { r.fait = !r.fait; sauvegarderPatients(); afficherConsultation(); }
      return;
    }
    case 'rappel-suppr': {
      p.rappels = (p.rappels || []).filter(x => x.id !== d.id);
      sauvegarderPatients(); afficherConsultation();
      return;
    }
  }
  switch (action) {
    case 'suivi': changerOnglet('observation', id); if (obsType !== 'suivi') changerTypeObs('suivi'); else if (!Object.keys(obsEtat).length || obsPatientId !== id) nouvelleObservation(false, 'suivi'); break;
    case 'premiere': changerOnglet('observation', id); if (obsType !== 'premiere') changerTypeObs('premiere'); else if (!Object.keys(obsEtat).length || obsPatientId !== id) nouvelleObservation(false, 'premiere'); break;
    case 'echelle': changerOnglet('echelles', id); if (d.echelle) { $('echChoix').value = d.echelle; $('echChoix').onchange(); } break;
    case 'tablette': changerOnglet('echelles', id); if (d.echelle) { $('echChoix').value = d.echelle; $('echChoix').onchange(); } ouvrirModeTablette(); break;
    case 'humeur': changerOnglet('humeur', id); break;
    case 'document': changerOnglet('documents', id); afficherVueDocuments(id, d.type); break;
    case 'mdph': changerOnglet('mdph', id); break;
    case 'ordonnance': ouvrirFiche(id); setTimeout(() => $('btnOrdonnance').click(), 0); break;
    case 'note': {
      const p = patientCons();
      const n = (p.obs || []).find(o => o.id === d.id);
      if (!n) return;
      changerOnglet('observation', id);
      document.querySelector(`#obsHistorique button[data-action="ouvrir"][data-id="${n.id}"]`)?.click();
      break;
    }
  }
}

/* ---------- Petits graphiques ---------- */
function sparkline(valeurs, max, couleur) {
  if (valeurs.length < 2) return '';
  const L = 160, H = 34, pas = L / (valeurs.length - 1);
  const pts = valeurs.map((v, i) => `${(i * pas).toFixed(1)},${(H - 3 - (v / max) * (H - 6)).toFixed(1)}`).join(' ');
  const dernier = pts.split(' ').pop().split(',');
  return `<svg class="sparkline" viewBox="0 0 ${L} ${H}" width="${L}" height="${H}" aria-hidden="true">
    <polyline points="${pts}" fill="none" stroke="${couleur}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${dernier[0]}" cy="${dernier[1]}" r="3" fill="${couleur}"/></svg>`;
}

function miniHumeur(p, jours = 90) {
  const mood = (p.humeur && p.humeur.mood) || {};
  if (!Object.keys(mood).length) return '<p class="sec">Aucune humeur saisie.</p>';
  const fin = jourNum(aujourdhuiIso()), debut = fin - jours + 1, L = 600, H = 70, bw = L / jours, Y = v => (3.5 - v) * (H / 8);
  let o = `<line x1="0" x2="${L}" y1="${Y(0)}" y2="${Y(0)}" stroke="var(--line)" stroke-dasharray="3 3"/>`;
  for (let n = debut; n <= fin; n++) {
    const e = mood[numJour(n)]; if (!e) continue;
    const l = niveauHumeur(e.v); if (!l) continue;
    const y0 = e.v >= 0 ? Y(e.v + 0.5) : Y(-0.5 + 1), ht = e.v === 0 ? H / 8 : Math.abs(e.v) * H / 8;
    o += `<rect x="${((n - debut) * bw).toFixed(1)}" y="${(e.v > 0 ? Y(e.v + .5) : e.v === 0 ? Y(.5) : Y(-.5)).toFixed(1)}" width="${Math.max(bw - .5, .8).toFixed(1)}" height="${ht.toFixed(1)}" fill="${l.c}"><title>${formaterDate(numJour(n))} — ${l.l}</title></rect>`;
  }
  return `<svg class="mini-humeur" viewBox="0 0 ${L} ${H}" preserveAspectRatio="none">${o}</svg>
    <div class="sec" style="display:flex;justify-content:space-between"><span>${formaterDate(numJour(debut))}</span><span>aujourd’hui</span></div>`;
}

/* ---------- Écran ---------- */
function afficherConsultation() {
  const p = patientCons();
  if (!p) {
    $('consContenu').innerHTML = `<div class="carte"><p>Aucun patient. Créez une fiche avec « + Nouveau patient ».</p></div>`;
    return;
  }
  const age = p.ddn ? calculerAge(p.ddn) : '';
  const alertes = listerAlertes(p);
  const retard = alertes.filter(a => a.statut === 'retard');
  const actifs = (p.trt || []).filter(t => t.nom && !t.fin);
  const notes = [...(p.obs || [])].sort((a, b) => (a.date < b.date ? 1 : -1));
  const derniere = notes[0];
  const ech = p.ech || [];
  const parEchelle = {};
  ech.forEach(s => { (parEchelle[s.echelle] = parEchelle[s.echelle] || []).push(s); });
  const dernierScoreQids = (parEchelle.qids || []).slice(-1)[0];
  const derniereNoteRisque = derniere && derniere.etat && (derniere.etat.suicide || []).some(t => t !== 'Absence d’idées suicidaires');

  const drapeaux = [
    p.vigilance ? `<span class="drapeau rouge">⚠ ${echapper(p.vigtxt || 'Point de vigilance')}</span>` : '',
    derniereNoteRisque ? `<span class="drapeau rouge">Idées suicidaires à la dernière note${derniere.etat.risque && derniere.etat.risque[0] ? ' · risque ' + derniere.etat.risque[0].toLowerCase() : ''}</span>` : '',
    dernierScoreQids && dernierScoreQids.total >= 16 ? `<span class="drapeau orange">QIDS ${dernierScoreQids.total}/27 (${formaterDate(dernierScoreQids.date)})</span>` : '',
    retard.length ? `<span class="drapeau orange">${retard.length} bilan(s) en retard</span>` : '',
    p.ald ? '<span class="drapeau gris">ALD</span>' : '',
    estARelayer(p) && !estClos(p.statut) ? `<span class="drapeau bleu">Relais CMP : ${echapper(p.statut || '')}</span>` : '',
  ].filter(Boolean).join('');

  const carteTraitements = `
    <div class="carte cons-carte"><h3 class="h3">Traitements</h3>
      ${actifs.length ? Object.entries(GROUPES_TRAITEMENT).map(([g, titre]) => {
        const duGroupe = actifs.filter(t => (t.g || 'fond') === g);
        if (!duGroupe.length) return '';
        return `<div class="cons-groupe${g === 'somat' ? ' somat' : ''}">${echapper(titre)}</div>` + duGroupe.map(t => {
          const al = alertes.filter(a => a.traitement === t);
          return `<div class="cons-trt"><b>${echapper(t.nom)}</b> <span class="sec">${echapper(t.dose || '')}</span>
            ${al.map(a => `<div class="${a.statut === 'retard' ? 'texte-retard' : 'texte-bientot'}">${a.statut === 'retard' ? '⏰' : '•'} ${echapper(a.libelle)}${a.echeance ? ' · ' + formaterDate(versIso(a.echeance)) : ''}</div>`).join('')}</div>`;
        }).join('');
      }).join('') : '<p class="sec">Aucun traitement renseigné.</p>'}
      <div class="act"><button type="button" data-action="ordonnance">Ordonnance de bilans</button></div>
    </div>`;

  const carteNote = `
    <div class="carte cons-carte cons-large"><h3 class="h3">Dernière note${derniere ? ` · ${formaterDate(derniere.date)} (${derniere.type === 'suivi' ? 'suivi' : 'première observation'})` : ''}</h3>
      ${derniere ? `<div class="cons-note">${echapper(derniere.texte.split('\n').slice(2).join('\n').trim().slice(0, 900))}${derniere.texte.length > 900 ? '…' : ''}</div>
        <div class="act"><button type="button" data-action="note" data-id="${derniere.id}">Ouvrir</button>
        <span class="sec">${notes.length} note(s) au total</span></div>` : '<p class="sec">Aucune note enregistrée.</p>'}
    </div>`;

  const carteEchelles = `
    <div class="carte cons-carte"><h3 class="h3">Échelles</h3>
      ${Object.keys(parEchelle).length ? Object.entries(parEchelle).map(([id, liste]) => {
        const d = liste[liste.length - 1];
        const couleur = id === 'qids' ? '#e67700' : '#3b5bdb';
        return `<div class="cons-echelle"><div><b>${echapper(ECHELLES[id] ? ECHELLES[id].nom : id)}</b> ${d.total}/${d.max}
          <div class="sec">${formaterDate(d.date)} · ${echapper(d.interpretation)}</div></div>${sparkline(liste.map(s => s.total), d.max, couleur)}</div>`;
      }).join('') : '<p class="sec">Aucun score enregistré.</p>'}
      <div class="act" style="flex-wrap:wrap">
        <button type="button" data-action="echelle" data-echelle="qids">Coter une QIDS</button>
        <button type="button" data-action="tablette" data-echelle="qids">Passation sur tablette</button>
        <button type="button" data-action="echelle">Autre échelle</button>
      </div>
    </div>`;

  const carteHumeur = `
    <div class="carte cons-carte cons-large"><h3 class="h3">Courbe de l’humeur · 90 derniers jours</h3>
      ${miniHumeur(p)}
      <div class="act"><button type="button" data-action="humeur">Ouvrir la courbe</button></div>
    </div>`;

  const docs = [...(p.docs || [])].reverse().slice(0, 4);
  const carteDocs = `
    <div class="carte cons-carte"><h3 class="h3">Documents</h3>
      ${p.planSecurite ? `<p>Plan de sécurité établi le ${formaterDate(p.planSecurite.date)}.</p>` : (derniereNoteRisque ? '<p class="texte-bientot">Pas de plan de sécurité alors que des idées suicidaires sont notées.</p>' : '')}
      ${docs.length ? docs.map(d => `<div class="sec">${formaterDate(d.date)} · ${echapper(libelleDocument(d.type))}</div>`).join('') : '<p class="sec">Aucun document enregistré.</p>'}
      <div class="act" style="flex-wrap:wrap">
        <button type="button" data-action="document" data-type="ordoTtt">Ordonnance</button>
        <button type="button" data-action="document" data-type="cr">Compte rendu</button>
        <button type="button" data-action="document" data-type="relais">Relais</button>
        <button type="button" data-action="document" data-type="plan">Plan de sécurité</button>
        <button type="button" data-action="document" data-type="sdt">Certificat SSC</button>
        <button type="button" data-action="mdph">MDPH</button>
      </div>
    </div>`;

  $('consContenu').innerHTML = `
    <div class="carte cons-entete">
      <div>
        <div class="cons-nom">${echapper(nomPatient(p))}</div>
        <div class="sec">${[libelleSexe(p.sexe), age !== '' ? age + ' ans' : '', p.dossier ? 'Dossier ' + echapper(p.dossier) : '', p.rythme ? 'Suivi ' + echapper(p.rythme.toLowerCase()) : '', p.prochain ? 'Consultation : ' + formaterDate(p.prochain) : ''].filter(Boolean).join(' · ')}</div>
        <div class="cons-diag">${echapper(p.dp || 'Diagnostic principal non renseigné')}${p.ds ? `<span class="sec"> · ${echapper(p.ds)}</span>` : ''}</div>
        ${drapeaux ? `<div class="drapeaux">${drapeaux}</div>` : ''}
      </div>
      <div class="cons-actions">
        <button type="button" class="main" data-action="suivi">Note de suivi</button>
        <button type="button" data-action="premiere">Première observation</button>
      </div>
    </div>
    <div class="cons-grille">${carteNote}${carteTraitements}${carteEchelles}${carteHumeur}${carteDocs}${carteRappels(p)}</div>`;
  if (typeof poserIcones === 'function') poserIcones($('consContenu'));
}


/* =====================================================================
   PATIENT COURANT : un seul patient ouvert pour tous les onglets,
   affiché dans le bandeau en haut de page.
   ===================================================================== */
const ONGLETS_SANS_PATIENT_OBLIGATOIRE = ['echelles', 'observation'];   // ces modules acceptent « sans patient »

/** Change le patient courant ; rafraichir = redessiner l'onglet ouvert. */
function definirPatientCourant(id, rafraichir) {
  consPatientId = id || '';
  majBandeauPatient();
  if (rafraichir && !ongletPatients()) afficherModule(consPatientId);
}

/** Après l'affichage d'un module qui impose un patient : le patient choisi par défaut devient le patient courant. */
function synchroniserPatientCourant() {
  if (consPatientId || ONGLETS_SANS_PATIENT_OBLIGATOIRE.includes(onglet) || ongletPatients() || onglet === 'accueil') { majBandeauPatient(); return; }
  const select = { consultation: 'consPatient', humeur: 'humPatient', documents: 'docPatient', mdph: 'mdphPatient' }[onglet];
  if (select && $(select) && $(select).value) consPatientId = $(select).value;
  majBandeauPatient();
}

function majBandeauPatient() {
  const zone = $('bandeauPatient');
  if (!zone) return;
  const p = patients.find(x => x.id === consPatientId);
  if (!p) {
    zone.innerHTML = `<button type="button" class="bandeau-vide" data-bandeau="chercher">Aucun patient ouvert · <b>Ctrl K</b> pour en ouvrir un</button>`;
  } else {
    const age = p.ddn ? calculerAge(p.ddn) : '';
    const derniere = derniereNote(p);
    const risque = derniere && derniere.etat && (derniere.etat.suicide || []).some(t => t !== 'Absence d’idées suicidaires');
    zone.innerHTML = `
      <button type="button" class="bandeau-nom" data-bandeau="consultation" title="Ouvrir l’écran Consultation">
        <b>${echapper(nomPatient(p))}</b><span class="sec">${[libelleSexe(p.sexe), age !== '' ? age + ' ans' : '', p.dossier].filter(Boolean).map(echapper).join(' · ')}</span>
      </button>
      ${p.allergies ? `<button type="button" class="pastille-bandeau allergie" data-bandeau="allergies" title="Allergies / contre-indications : ${echapper(p.allergies)} (cliquer pour modifier)">⚠ ${echapper(p.allergies)}</button>` : ''}
      ${p.vigilance ? `<span class="pastille-bandeau vigilance" title="${echapper(p.vigtxt || '')}">Vigilance</span>` : ''}
      ${risque ? '<span class="pastille-bandeau vigilance">Idées suicidaires</span>' : ''}
      <button type="button" class="outil" data-bandeau="fiche" title="Modifier la fiche"><span data-icone="crayon"></span></button>
      <button type="button" class="outil" data-bandeau="chercher" title="Changer de patient (Ctrl+K)"><span data-icone="changer"></span></button>
      <button type="button" class="outil" data-bandeau="fermer" title="Fermer le patient"><span data-icone="fermer"></span></button>`;
  }
  if (typeof poserIcones === 'function') poserIcones(zone);
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-bandeau]');
  if (!b) return;
  const action = b.dataset.bandeau;
  if (action === 'chercher') ouvrirRecherche();
  if (action === 'consultation') changerOnglet('consultation', consPatientId);
  if (action === 'fiche' && consPatientId) ouvrirFiche(consPatientId);
  if (action === 'allergies' && consPatientId) {
    ouvrirFiche(consPatientId);
    setTimeout(() => { const c = $('allergies'); if (c) { c.focus(); c.select(); } }, 50);
  }
  if (action === 'fermer') definirPatientCourant('', true);
});


/* ---------- Rappels et échéances du patient (renouvellement ALD, MDPH, certificat mensuel…) ---------- */
function carteRappels(p) {
  const liste = [...(p.rappels || [])].sort((a, b) => (a.fait - b.fait) || (a.date < b.date ? -1 : 1));
  const auj = aujourdhuiIso();
  return `
    <div class="carte cons-carte"><h3 class="h3">Rappels et échéances</h3>
      ${liste.length ? liste.map(r => `
        <div class="rappel${r.fait ? ' fait' : ''}${!r.fait && r.date <= auj ? ' echu' : ''}">
          <input type="checkbox" data-action="rappel-fait" data-id="${r.id}" ${r.fait ? 'checked' : ''} aria-label="Fait">
          <span><b>${formaterDate(r.date)}</b> · ${echapper(r.texte)}</span>
          <button type="button" class="outil" data-action="rappel-suppr" data-id="${r.id}" title="Supprimer"><span data-icone="fermer"></span></button>
        </div>`).join('') : '<p class="sec">Aucun rappel.</p>'}
      <div class="rappel-ajout">
        <input id="consRappelTexte" list="listeRappels" placeholder="ex. Renouveler l’ALD, certificat mensuel, réévaluer le traitement">
        <input id="consRappelDate" type="date" value="${versIso(ajouterJours(aujourdhui(), 30))}">
        <div class="choix-multiples">${[['7', '+1 sem.'], ['30', '+1 mois'], ['91', '+3 mois'], ['182', '+6 mois'], ['365', '+1 an']].map(([j, l]) => `<button type="button" data-action="rappel-delai" data-jours="${j}">${l}</button>`).join('')}</div>
        <button type="button" class="main" data-action="rappel-ajouter">Ajouter le rappel</button>
      </div>
      <datalist id="listeRappels">${['Renouveler l’ALD', 'Renouveler le dossier MDPH', 'Certificat mensuel de soins sans consentement', 'Réévaluer le traitement', 'Contrôler la lithémie', 'Bilan métabolique', 'ECG de contrôle', 'Coter une QIDS', 'Prévoir le relais CMP', 'Réévaluer le programme de soins']
        .map(t => `<option value="${t}">`).join('')}</datalist>
    </div>`;
}
