/* =====================================================================
   ACCUEIL.JS — « Aujourd'hui » : tableau de bord de la journée
   ---------------------------------------------------------------------
   Rassemble ce qui demande une action : consultations prévues, rappels
   échus, alertes cliniques (idées suicidaires sans plan de sécurité,
   scores élevés), bilans en retard, relais prioritaires, notes en
   brouillon, état de la sauvegarde. Un clic ouvre le patient.
   ===================================================================== */

function initialiserAccueil() {
  $('vueAccueil').addEventListener('click', e => {
    const x = e.target.closest('[data-patient]');
    if (x) {
      definirPatientCourant(x.dataset.patient);
      changerOnglet(x.dataset.vers || 'consultation', x.dataset.patient);
      return;
    }
    const a = e.target.closest('[data-accueil]');
    if (a && a.dataset.accueil === 'sauvegarde') sauvegardeChiffree();
    if (a && a.dataset.accueil === 'nouveau') ouvrirFiche(null);
    if (a && a.dataset.accueil === 'agenda') changerOnglet('agenda');
  });
}

function elementsAccueil() {
  const auj = aujourdhuiIso();
  const dans7 = versIso(ajouterJours(aujourdhui(), 7));
  const brouillons = typeof lireBrouillons === 'function' ? lireBrouillons() : {};
  const r = { rdvJour: [], rdvSemaine: [], rappels: [], alertes: [], bilans: [], relais: [], brouillons: [], nonVenus: [] };
  // Rendez-vous de l'agenda (les fiches sans rendez-vous gardent leur date « prochaine consultation »).
  const agenda = typeof lireRdv === 'function' ? lireRdv().filter(x => x.patientId && estActif(x)) : [];
  const avecRdv = new Set();
  agenda.forEach(x => {
    const p = patients.find(y => y.id === x.patientId);
    if (!p) return;
    if (x.date === auj) { r.rdvJour.push({ p, rdv: x }); avecRdv.add(p.id + auj); }
    else if (x.date > auj && x.date <= dans7) { r.rdvSemaine.push({ p, date: x.date, rdv: x }); avecRdv.add(p.id + x.date); }
  });
  const il14 = versIso(ajouterJours(aujourdhui(), -14));
  agenda.filter(x => x.statut === 'Non venu' && x.date >= il14 && x.date <= auj).forEach(x => {
    const p = patients.find(y => y.id === x.patientId);
    if (p && !(prochainRdv(p.id)) && !r.nonVenus.some(n => n.p.id === p.id)) r.nonVenus.push({ p, rdv: x });
  });

  patients.forEach(p => {
    if (p.prochain === auj && !avecRdv.has(p.id + auj)) r.rdvJour.push({ p });
    else if (p.prochain > auj && p.prochain <= dans7 && !avecRdv.has(p.id + p.prochain) && !r.rdvSemaine.some(x => x.p.id === p.id)) r.rdvSemaine.push({ p, date: p.prochain });

    (p.rappels || []).filter(x => !x.fait && x.date <= dans7).forEach(x => r.rappels.push({ p, rappel: x, echu: x.date <= auj }));

    const n = derniereNote(p);
    const idees = n && n.etat && (n.etat.suicide || []).some(t => t !== 'Absence d’idées suicidaires');
    if (idees && !p.planSecurite) r.alertes.push({ p, texte: `Idées suicidaires notées le ${formaterDate(n.date)}, pas de plan de sécurité`, vers: 'documents' });
    const scores = derniersScores(p);
    scores.forEach(s => {
      const eleve = (s.echelle === 'qids' && s.total >= 16) || (s.echelle === 'phq9' && s.total >= 15) || (s.echelle === 'gad7' && s.total >= 15);
      if (eleve) r.alertes.push({ p, texte: `${ECHELLES[s.echelle].nom} ${s.total}/${s.max} le ${formaterDate(s.date)}`, vers: 'echelles' });
    });

    const retard = listerAlertes(p).filter(a => a.statut === 'retard');
    if (retard.length) r.bilans.push({ p, liste: retard });

    if (estARelayer(p) && !estClos(p.statut) && (p.priorite == 1 || p.priorite == 2)) r.relais.push({ p });

    if (brouillons[p.id]) r.brouillons.push({ p, maj: brouillons[p.id].maj });
  });
  r.rdvJour.sort((a, b) => ((a.rdv ? a.rdv.debut : '99') < (b.rdv ? b.rdv.debut : '99') ? -1 : 1));
  r.rdvSemaine.sort((a, b) => (a.date + (a.rdv ? a.rdv.debut : '') < b.date + (b.rdv ? b.rdv.debut : '') ? -1 : 1));
  r.rappels.sort((a, b) => (a.rappel.date < b.rappel.date ? -1 : 1));
  r.relais.sort((a, b) => a.p.priorite - b.p.priorite);
  return r;
}

/** Nombre d'éléments demandant une action aujourd'hui (pastille de l'onglet). */
function compteurAccueil() {
  const r = elementsAccueil();
  return r.rdvJour.length + r.rappels.filter(x => x.echu).length + r.alertes.length + r.nonVenus.length;
}

function afficherAccueil() {
  const r = elementsAccueil();
  const pr = praticien || {};
  const heure = new Date().getHours();
  const salut = heure < 18 ? 'Bonjour' : 'Bonsoir';
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  let derniere = null;
  try { derniere = localStorage.getItem(CLE_DERNIERE_SAUVEGARDE); } catch (erreur) { /* ignoré */ }
  const joursSauvegarde = derniere ? Math.floor((Date.now() - new Date(derniere)) / MS_PAR_JOUR) : null;

  const ligne = (p, detail, vers, classe = '') => `
    <button type="button" class="accueil-ligne ${classe}" data-patient="${p.id}" ${vers ? `data-vers="${vers}"` : ''}>
      <b>${echapper(nomPatient(p))}</b><span class="sec">${detail}</span></button>`;
  // Les cartes vides (sauf « Consultations du jour ») sont résumées en une ligne « rien à signaler ».
  const calmes = [];
  const carte = (titre, contenu, vide, classe = '', toujours = false) => {
    if (!contenu && !toujours) { calmes.push(titre.replace(/<[^>]+>.*$/, '').trim().toLowerCase()); return ''; }
    return `<div class="carte accueil-carte ${classe}"><h3 class="h3">${titre}</h3>${contenu || `<p class="sec">${vide}</p>`}</div>`;
  };

  $('nbAccueil').textContent = compteurAccueil() || '';

  if (!patients.length) {
    $('vueAccueil').innerHTML = `<div class="carte accueil-bienvenue">
      <h2>${salut}${pr.nom ? ' ' + echapper((pr.titre || 'Dr') + ' ' + pr.nom.toUpperCase()) : ''}</h2>
      <p>Bienvenue dans le portail. Pour commencer : renseignez votre <b>profil praticien</b> (en-têtes des ordonnances et
      courriers), puis créez une première fiche patient.</p>
      <div class="act"><button type="button" class="main" data-accueil="nouveau">+ Nouveau patient</button>
      <button type="button" onclick="ouvrirProfilPraticien()">Profil praticien</button>
      <button type="button" onclick="chargerDemo()">Découvrir avec 10 patients fictifs</button></div></div>`;
    return;
  }

  const entete = `
      <div><h2>${salut}${pr.nom ? ' ' + echapper((pr.titre || 'Dr') + ' ' + pr.nom.toUpperCase()) : ''}</h2>
        <div class="sec">${date.charAt(0).toUpperCase() + date.slice(1)} · ${patients.length} patient(s) dans la file active</div></div>
      ${$('rappelSauvegarde') && !$('rappelSauvegarde').hidden ? '' /* le bandeau de rappel s'en charge déjà */ : `
      <div class="accueil-sauvegarde ${joursSauvegarde === null || joursSauvegarde >= 7 ? 'alerte' : ''}">
        ${joursSauvegarde === null ? 'Aucune sauvegarde' : joursSauvegarde === 0 ? '✓ Sauvegardé aujourd’hui' : `Dernière sauvegarde il y a ${joursSauvegarde} j`}
        <button type="button" data-accueil="sauvegarde">Sauvegarder</button></div>`}
`;
  const grille = `
      ${carte(`Consultations du jour <span class="n">${r.rdvJour.length}</span>`,
        r.rdvJour.map(x => ligne(x.p, [x.rdv ? `<b>${x.rdv.debut}</b> ${echapper(x.rdv.type)}${x.rdv.statut === 'Honoré' ? ' ✓' : ''}` : '', echapper(x.p.dp || '')].filter(Boolean).join(' · '))).join(''),
        'Aucune consultation prévue aujourd’hui. <button type="button" class="discret" data-accueil="agenda">Ouvrir l’agenda</button>', 'accent', true)}
      ${carte(`Non venus, à recontacter <span class="n">${r.nonVenus.length}</span>`,
        r.nonVenus.map(x => ligne(x.p, `absent le ${formaterDate(x.rdv.date)} à ${x.rdv.debut} · aucun nouveau rendez-vous`, '', 'rouge')).join(''), '')}
      ${carte(`Alertes cliniques <span class="n">${r.alertes.length}</span>`,
        r.alertes.map(x => ligne(x.p, echapper(x.texte), x.vers, 'rouge')).join(''), 'Aucune alerte.', r.alertes.length ? 'rouge' : '')}
      ${carte(`Rappels <span class="n">${r.rappels.length}</span>`,
        r.rappels.map(x => ligne(x.p, `${x.echu ? '<b class="texte-retard">échu</b> · ' : ''}${formaterDate(x.rappel.date)} · ${echapper(x.rappel.texte)}`)).join(''),
        'Aucun rappel dans les 7 jours.')}
      ${carte(`Cette semaine <span class="n">${r.rdvSemaine.length}</span>`,
        r.rdvSemaine.map(x => ligne(x.p, `${new Date(x.date + 'T00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}${x.rdv ? ' à ' + x.rdv.debut : ''}`)).join(''),
        'Aucune consultation prévue dans les 7 jours.')}
      ${carte(`Bilans en retard <span class="n">${r.bilans.length}</span>`,
        r.bilans.map(x => ligne(x.p, x.liste.slice(0, 2).map(a => `${echapper(a.traitement.nom.split(' (')[0])} : ${echapper(a.libelle)}`).join(' · ') + (x.liste.length > 2 ? ` · +${x.liste.length - 2}` : ''))).join(''),
        'Aucun bilan en retard.')}
      ${carte(`Relais prioritaires <span class="n">${r.relais.length}</span>`,
        r.relais.map(x => ligne(x.p, `${echapper(libellePriorite(x.p))} · ${echapper(x.p.statut || '')}${x.p.cmp || x.p.typeRelais ? ' · ' + echapper(libelleDestinataire(x.p)) : ''}${x.p.relaisVers && !RELAIS_SANS_NIVEAU.includes(x.p.typeRelais) ? ' · vers ' + echapper(x.p.relaisVers.toLowerCase()) : ''}`)).join(''),
        'Aucun relais urgent ou élevé en attente.')}
      ${r.brouillons.length ? carte(`Notes en brouillon <span class="n">${r.brouillons.length}</span>`,
        r.brouillons.map(x => ligne(x.p, `modifiée le ${new Date(x.maj).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`, 'observation')).join(''), '') : ''}`;
  $('vueAccueil').innerHTML = `
    <div class="accueil-entete">${entete}</div>
    <div class="accueil-grille">${grille}</div>
    ${calmes.length ? `<p class="sec accueil-calme">✓ Rien à signaler : ${calmes.join(', ')}.</p>` : ''}`;
}
