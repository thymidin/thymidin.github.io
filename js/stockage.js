/* =====================================================================
   STOCKAGE.JS — enregistrement des données et import / export
   ---------------------------------------------------------------------
   Les données restent dans le navigateur (localStorage), sur cet appareil.
   Rien n'est envoyé sur Internet. Pensez aux sauvegardes JSON régulières.
   Rien à régler ici (les réglages sont dans config.js).
   ===================================================================== */

/* ---------- État partagé ---------- */

let patients = [];                                        // toutes les fiches
let statuts = [...STATUTS_RELAIS_PAR_DEFAUT];             // listes en cours d'usage
let rythmes = [...RYTHMES_SUIVI_PAR_DEFAUT];              // (copies : config.js reste intact)

const CLE_REGLAGES = CLE_STOCKAGE + '_cfg';               // réglages modifiés via « Paramètres »
const CLE_AVIS = CLE_STOCKAGE + '_n';                     // avis de confidentialité masqué
const CLE_ONGLET = CLE_STOCKAGE + '_onglet';              // dernier onglet ouvert


/* ---------- Lecture / écriture ---------- */

/** Charge les fiches et les réglages enregistrés. */
function chargerDonnees() {
  try {
    patients = JSON.parse(localStorage.getItem(CLE_STOCKAGE) || '[]');
  } catch (erreur) {
    patients = [];
  }
  migrerAnciennesDonnees();

  try {
    const reglages = JSON.parse(localStorage.getItem(CLE_REGLAGES) || 'null');
    if (reglages) {
      if (reglages.s && reglages.s.length >= 2) statuts = reglages.s;
      if (reglages.r && reglages.r.length) rythmes = reglages.r;
    }
  } catch (erreur) { /* réglages absents ou illisibles : valeurs par défaut */ }
  // Statut renommé (« RDV CMP fixé » → « RDV fixé avec le receveur ») : reprise des fiches existantes.
  if (statuts.includes('RDV fixé avec le receveur') && !statuts.includes('RDV CMP fixé')) {
    patients.forEach(p => { if (p.statut === 'RDV CMP fixé') p.statut = 'RDV fixé avec le receveur'; });
  }
}

/** Reprise des fiches créées avec une version antérieure : le champ libre « traitement »
 *  (supprimé du formulaire, remplacé par les lignes de traitement) est recopié dans les notes. */
function migrerAnciennesDonnees() {
  let modifie = false;
  patients.forEach(patient => {
    if (patient.traitement && String(patient.traitement).trim()) {
      const ancienTexte = 'Traitement (ancienne saisie libre) : ' + String(patient.traitement).trim();
      patient.notes = patient.notes ? patient.notes + '\n' + ancienTexte : ancienTexte;
      modifie = true;
    }
    if ('traitement' in patient) { delete patient.traitement; modifie = true; }
  });
  if (modifie) sauvegarderPatients();
}

/** Enregistre les fiches. */
function sauvegarderPatients() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(patients));
  } catch (erreur) {
    alert('Enregistrement impossible dans ce navigateur. Exportez une sauvegarde JSON.');
  }
}

/** Enregistre les listes de statuts et de rythmes. */
function sauvegarderReglages() {
  try {
    localStorage.setItem(CLE_REGLAGES, JSON.stringify({ s: statuts, r: rythmes }));
  } catch (erreur) { /* sans gravité : les valeurs par défaut reviendront */ }
}

/** Un statut est « clos » s'il fait partie des deux derniers de la liste. */
function estClos(statut) {
  return statuts.indexOf(statut) >= statuts.length - 2;
}

/** Un patient est « à relayer » sauf indication contraire : les fiches créées avant
 *  l'ajout des onglets (sans cette information) le sont toutes. */
function estARelayer(patient) {
  return patient.aRelayer !== false;
}

/** Sexe du patient : 'F' → « Femme », 'M' → « Homme », sinon vide. */
function libelleSexe(sexe) {
  return sexe === 'F' ? 'Femme' : sexe === 'M' ? 'Homme' : '';
}

/** Libellé de la priorité d'un patient (vide si non renseignée). */
function libellePriorite(patient) {
  return (PRIORITES[patient.priorite] || {}).libelle || '';
}

/** Après un import : ajoute aux listes les statuts / rythmes inconnus des fiches. */
function completerListesDepuisPatients() {
  let modifie = false;
  patients.forEach(patient => {
    if (patient.statut && !statuts.includes(patient.statut)) {
      statuts.splice(statuts.length - 2, 0, patient.statut);   // avant les statuts « clos »
      modifie = true;
    }
    if (patient.rythme && !rythmes.includes(patient.rythme)) {
      rythmes.push(patient.rythme);
      modifie = true;
    }
  });
  if (modifie) sauvegarderReglages();
}


/* ---------- Téléchargements ---------- */

/** Déclenche le téléchargement d'un fichier texte. */
function telecharger(nomFichier, contenu, typeMime) {
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob([contenu], { type: typeMime }));
  lien.download = nomFichier;
  lien.click();
  setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
}

const dateDuJour = () => versIso(new Date());                // date locale (et non UTC)

/** Sauvegarde complète (à garder en lieu sûr ; réimportable). */
function exporterJson() {
  telecharger(`relais-cmp-${dateDuJour()}.json`, JSON.stringify(patients, null, 1), 'application/json');
}

/** Valeur d'une colonne de l'export CSV (certaines sont calculées). */
function valeurCsv(patient, propriete) {
  if (propriete === 'ald') return patient.ald ? 'Oui' + (patient.aldTexte ? ' : ' + patient.aldTexte : '') : 'Non';
  if (propriete === 'sexe') return libelleSexe(patient.sexe);
  if (propriete === 'arelayer') return estARelayer(patient) ? 'Oui' : 'Non';
  // Priorité, statut et CMP n'ont de sens que pour les patients à relayer.
  if (['priorite', 'statut', 'cmp', 'typeRelais', 'relaisVers'].includes(propriete) && !estARelayer(patient)) return '';
  if (propriete === 'priorite') return libellePriorite(patient);

  if (propriete === 'trt') {
    return (patient.trt || [])
      .map(t => `${({ fond: '[fond]', symp: '[sympt.]', somat: '[non psy.]' })[t.g] || ''} ${t.nom} ${t.dose || ''}${t.fin ? ' (arrêté)' : ''}`)
      .join(' | ');
  }

  if (propriete === 'retard') {
    return listerAlertes(patient)
      .filter(alerte => alerte.statut === 'retard')
      .map(alerte => `${alerte.traitement.nom}: ${alerte.libelle}`)
      .join(' | ');
  }

  return patient[propriete];
}

/** Export tableur : séparateur « ; » et BOM pour qu'Excel lise bien les accents. */
function exporterCsv() {
  const entoure = valeur => '"' + String(valeur ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
  const entetes = COLONNES_CSV.map(([, titre]) => entoure(titre)).join(';');
  const lignes = patients.map(patient =>
    COLONNES_CSV.map(([propriete]) => entoure(valeurCsv(patient, propriete))).join(';')
  );
  telecharger(`relais-cmp-${dateDuJour()}.csv`, '\ufeff' + [entetes, ...lignes].join('\r\n'), 'text/csv;charset=utf-8');
}

/** Importe une sauvegarde JSON et la fusionne avec les fiches existantes. */
function importerJson(fichier, quandTermine) {
  const lecteur = new FileReader();
  lecteur.onload = () => {
    try {
      const importes = JSON.parse(lecteur.result);
      if (!Array.isArray(importes)) throw new Error('format');

      const question = `Importer ${importes.length} fiche(s) ? OK = fusionner avec l’existant, Annuler = abandonner.`;
      if (confirm(question)) {
        const idsExistants = new Set(patients.map(p => p.id));
        importes.forEach(fiche => {
          if (!fiche || !fiche.nom) return;
          if (idsExistants.has(fiche.id)) {
            patients = patients.map(p => (p.id === fiche.id ? fiche : p));   // remplace la fiche
          } else {
            patients.push(fiche);                                            // nouvelle fiche
          }
        });
        completerListesDepuisPatients();
        sauvegarderPatients();
        quandTermine();
      }
    } catch (erreur) {
      alert('Fichier invalide : choisissez une sauvegarde JSON de cette application.');
    }
  };
  lecteur.readAsText(fichier);
}
