/* Rampant — prototipo. Avvio: carica i dati salvati nel browser (o quelli di partenza) e disegna la schermata.
   Se i dati salvati sono di una versione precedente del prototipo, aggiunge le parti nuove che mancano. */
(function () {
  'use strict';
  const R = window.R;
  const salvati = R.carica();
  if (salvati) {
    const nuovi = R.nuoviDati();
    Object.keys(nuovi).forEach((k) => { if (!(k in salvati)) salvati[k] = nuovi[k]; });
    R.stato = salvati;
  } else {
    R.stato = R.nuoviDati();
  }
  R.salva();
  R.disegna();
})();
