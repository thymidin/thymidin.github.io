/* =====================================================================
   SURVEILLANCE.JS — calcul des échéances de bilans et des retards
   ---------------------------------------------------------------------
   Ce fichier applique les règles décrites dans config.js
   (REGLES_SURVEILLANCE) aux traitements saisis dans les fiches.
   Les calendriers eux-mêmes se modifient dans config.js, pas ici.

   Vocabulaire des statuts d'un bilan :
     'retard'   échéance dépassée                       (rouge)
     'bientot'  échéance dans les SEUIL_BIENTOT_JOURS    (orange)
     'ok'       échéance plus lointaine                  (bleu)
     'termine'  séquence de bilans terminée              (bleu)

   Adaptation au sexe du patient :
     Les examens et bilans de config.js peuvent porter une condition « pour »
     ('femme', 'homme', 'procreation', 'femmeMoins25'). Elle est évaluée avec le
     sexe et l'âge du patient. Si le sexe n'est pas renseigné, l'élément est
     conservé « sous réserve » (signalé) plutôt que supprimé silencieusement.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. PROFIL DU PATIENT ET CONDITIONS
   --------------------------------------------------------------------- */

/** Profil utilisé pour adapter les bilans : sexe ('F', 'M' ou ''), âge (ou null). */
function contextePatient(patient, traitement) {
  const age = patient && patient.ddn ? calculerAge(patient.ddn) : null;
  return {
    sexe: (patient && patient.sexe) || '',
    age: age === '' ? null : age,
    forcerProcreation: !!(traitement && traitement.fap),   // ancien réglage manuel, conservé pour compatibilité
  };
}

/** Évalue une condition pour un profil. Renvoie true, false, ou null (= sexe non renseigné). */
function evaluerCondition(condition, ctx) {
  if (!condition) return true;
  if (condition === 'procreation' && ctx.forcerProcreation) return true;
  if (!ctx.sexe) return null;                                  // sexe inconnu : on ne peut pas trancher

  switch (condition) {
    case 'femme':
      return ctx.sexe === 'F';
    case 'homme':
      return ctx.sexe === 'M';
    case 'procreation':                                        // femme en âge de procréer
      if (ctx.sexe !== 'F') return false;
      if (ctx.age === null) return true;                       // âge inconnu : on ne peut pas l'exclure
      return ctx.age >= PROCREATION_AGE_MIN && ctx.age <= PROCREATION_AGE_MAX;
    case 'femmeMoins25':
      if (ctx.sexe !== 'F') return false;
      return ctx.age === null ? null : ctx.age < AGE_PROLACTINE_FEMME;
    default:
      return true;
  }
}

/** Transforme une liste d'examens de config.js en liste adaptée au patient.
 *  Chaque élément renvoyé : { base, texte, incertain }
 *    base      = intitulé de l'examen (utilisé sur l'ordonnance)
 *    texte     = intitulé affiché (avec « (si femme…) » quand le sexe est inconnu)
 *    incertain = true si l'examen dépend d'un sexe non renseigné */
function listeExamens(liste, ctx) {
  const resultat = [];
  (liste || []).forEach(element => {
    const base = typeof element === 'string' ? element : element.examen;
    const condition = typeof element === 'string' ? null : element.pour;
    const applicable = evaluerCondition(condition, ctx);
    if (applicable === false) return;                          // examen non concerné par ce patient
    resultat.push({
      base,
      texte: applicable === null ? base + (LIBELLES_CONDITIONS[condition] || '') : base,
      incertain: applicable === null,
    });
  });
  return resultat;
}

/** Remarques propres au sexe / à l'âge (remarquesSelonPatient) applicables à ce patient. */
function remarquesPatient(regle, ctx) {
  return (regle.remarquesSelonPatient || [])
    .filter(remarque => evaluerCondition(remarque.pour, ctx) !== false)
    .map(remarque => remarque.texte);
}

/** Vrai si la règle contient au moins un élément dépendant du sexe. */
function regleDependDuSexe(regle) {
  const aUneCondition = liste => (liste || []).some(e => typeof e === 'object' && e.pour);
  return aUneCondition(regle.preTherapeutique && regle.preTherapeutique.biologie)
      || (regle.remarquesSelonPatient || []).length > 0
      || regle.bilans.some(b => b.pour || aUneCondition(b.examens));
}


/* ---------------------------------------------------------------------
   2. RÈGLES ET ÉCHÉANCES
   --------------------------------------------------------------------- */

/** Trouve la règle de surveillance correspondant à un nom de médicament
 *  (ou null si le médicament n'est pas surveillé). */
function trouverRegle(nomMedicament) {
  // On compare sans accents et en minuscules : « Dépakote » → « depakote ».
  const nom = (nomMedicament || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

  for (const regle of Object.values(REGLES_SURVEILLANCE)) {
    if (regle.motsCles.test(nom)) return regle;
  }
  return null;
}

/** Calcule, pour un traitement, l'état de chacun de ses bilans de suivi.
 *  `ctx` = profil du patient (voir contextePatient) ; sans lui, le sexe est « inconnu ».
 *  Renvoie une liste d'objets { bilan, libelle, incertain, dernier, echeance, joursRetard, statut }.
 *
 *  Principe : on parcourt le calendrier du bilan. Un point du calendrier est
 *  « fait » si le dernier bilan réalisé date de ce point (ou de moins de
 *  `tolerance` jours avant). Le premier point non fait donne l'échéance.
 *  Une fois le calendrier épuisé, l'échéance = dernier bilan + `ensuite`.
 *
 *  Traitement « ancien » (case cochée dans la fiche) : les points du calendrier
 *  antérieurs à la date de reprise du suivi sont ignorés, et si le calendrier est
 *  épuisé (ou la date d'introduction inconnue), le suivi d'entretien repart
 *  du dernier bilan connu ou, à défaut, de la date de reprise. */
function calculerEcheances(traitement, ctx) {
  ctx = ctx || { sexe: '', age: null, forcerProcreation: false };
  const regle = trouverRegle(traitement.nom);
  const ancien = !!traitement.ancien;

  // Pas de surveillance si : molécule non surveillée, traitement arrêté,
  // ou impossible de situer le traitement (ni date d'introduction, ni « ancien »).
  if (!regle || traitement.fin) return [];
  if (!traitement.intro && !ancien) return [];

  const aujourdhuiMinuit = aujourdhui();
  const introduction = versDate(traitement.intro);                    // peut être null si « ancien »
  const changementDose = versDate(traitement.chg);
  const reprise = ancien ? (versDate(traitement.reprise) || aujourdhuiMinuit) : null;

  return regle.bilans
    .filter(bilan => evaluerCondition(bilan.pour, ctx) !== false)     // bilans non concernés par le sexe / l'âge
    .map(bilan => {
      const incertain = evaluerCondition(bilan.pour, ctx) === null;

      // Date de départ du calendrier (l'introduction, ou la dernière augmentation
      // de dose pour les médicaments dont la séquence « repart »).
      const repartApresChangement = bilan.repartirApresChangementDose && changementDose
        && (!introduction || changementDose > introduction);
      const origine = repartApresChangement ? changementDose : introduction;

      const dernier = versDate((traitement.bil || {})[bilan.id]);     // dernier bilan réalisé
      let echeance = null;

      // 1) Contrôle demandé après un changement de dose (ex. lithémie à J+5).
      if (bilan.apresChangementDose && changementDose) {
        const limite = ajouterJours(changementDose, bilan.apresChangementDose - bilan.tolerance);
        if (!dernier || dernier < limite) {
          echeance = ajouterJours(changementDose, bilan.apresChangementDose);
        }
      }

      // 2) Premier point du calendrier non encore couvert par un bilan réalisé.
      //    (sans date d'origine, par exemple ancien traitement sans date, on passe cette étape)
      if (!echeance && origine) {
        for (const jours of bilan.calendrier) {
          const pointCalendrier = ajouterJours(origine, jours);
          if (reprise && pointCalendrier < reprise) continue;         // étape antérieure à la reprise : ignorée
          const dejaFait = dernier && dernier >= ajouterJours(pointCalendrier, -bilan.tolerance);
          if (!dejaFait) {
            echeance = pointCalendrier;
            break;
          }
        }
      }

      // 3) Calendrier épuisé : bilan à répéter à intervalle régulier.
      const dateInconnue = ancien && !introduction;
      const intervalle = (dateInconnue && bilan.ensuiteSansDateIntro !== undefined)
        ? bilan.ensuiteSansDateIntro
        : bilan.ensuite;
      if (!echeance && intervalle) {
        const base = dernier || (ancien ? reprise : origine);
        echeance = ajouterJours(base, intervalle);
      }

      // Statut selon l'écart avec aujourd'hui.
      const joursRetard = echeance ? Math.round((aujourdhuiMinuit - echeance) / MS_PAR_JOUR) : null;
      let statut;
      if (!echeance)                                  statut = 'termine';
      else if (joursRetard > 0)                       statut = 'retard';
      else if (joursRetard >= -SEUIL_BIENTOT_JOURS)   statut = 'bientot';
      else                                            statut = 'ok';

      const libelle = bilan.libelle + (incertain ? ' (sexe non renseigné)' : '');
      return { bilan, libelle, incertain, dernier, echeance, joursRetard, statut };
    });
}

/** Liste toutes les alertes d'un patient : bilans en retard ou proches,
 *  et bilans pré-thérapeutiques non documentés (sauf traitement ancien).
 *  Renvoie des objets { traitement, libelle, echeance, joursRetard, statut, dernier }. */
function listerAlertes(patient) {
  const alertes = [];

  (patient.trt || []).forEach(traitement => {
    if (!trouverRegle(traitement.nom) || traitement.fin) return;
    const ctx = contextePatient(patient, traitement);

    // Bilan pré-thérapeutique jamais noté → compté « en retard »,
    // sauf pour un traitement ancien où il n'est pas exigé.
    if (!traitement.pre && !traitement.ancien && !trouverRegle(traitement.nom).sansPreTherapeutique) {
      alertes.push({
        traitement,
        libelle: 'Bilan pré-thérapeutique non documenté',
        echeance: versDate(traitement.intro),
        joursRetard: traitement.intro ? Math.round((aujourdhui() - versDate(traitement.intro)) / MS_PAR_JOUR) : 0,
        statut: 'retard',
        dernier: null,
      });
    }

    // Bilans de suivi en retard ou à échéance proche.
    calculerEcheances(traitement, ctx).forEach(etat => {
      if (etat.statut === 'retard' || etat.statut === 'bientot') {
        alertes.push({
          traitement,
          libelle: etat.libelle,
          echeance: etat.echeance,
          joursRetard: etat.joursRetard,
          statut: etat.statut,
          dernier: etat.dernier,
        });
      }
    });
  });

  return alertes;
}

/** Texte de la pastille d'un bilan dans la fiche. */
function texteEtatBilan(etat) {
  if (etat.statut === 'termine') return 'Séquence terminée';
  if (etat.statut === 'retard') {
    return `⏰ En retard de ${etat.joursRetard} j (dû le ${formaterDate(versIso(etat.echeance))})`;
  }
  const suffixe = etat.statut === 'bientot' ? ' (bientôt)' : '';
  return `Prochain : ${formaterDate(versIso(etat.echeance))}${suffixe}`;
}
