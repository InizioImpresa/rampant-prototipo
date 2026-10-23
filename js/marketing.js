/* Rampant — prototipo. Schermate Marketing: barra Marketing, Funnel (elenco e dettaglio), editor delle pagine
   classico e con l'AI, pagina pubblica con modulo, Moduli, Email marketing, Libreria file, Domini.
   Azioni con prefisso "mk-". Dati propri aggiunti con R.estendiDati (pagine, moduli, campagne, domini). */
(function () {
  'use strict';
  const R = window.R;
  const esc = (s) => R.esc(s);
  /* Numeri con il punto delle migliaia anche sotto 10.000 (2.340), come nelle immagini */
  const num = (n) => { try { return new Intl.NumberFormat('it-IT', { useGrouping: 'always' }).format(n); } catch (e) { return R.numero(n); } };

  /* ================= Utilità ================= */
  const sottodominio = () => ((R.azienda() && R.azienda().sottodominio) || 'azienda') + '.rampant.it';
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'pagina';
  const percento = (a, b) => (b ? (a / b * 100).toLocaleString('it-IT', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '%' : '—');
  const telefono = () => window.matchMedia('(max-width: 767px)').matches;
  const funnel = (id) => (R.stato.funnel || []).find((f) => f.id === id);
  const pagina = (id) => (R.stato.pagine || []).find((p) => p.id === id);
  const pagineDi = (idFunnel) => (R.stato.pagine || []).filter((p) => p.funnel === idFunnel).sort((a, b) => a.ordine - b.ordine);
  const principale = (idFunnel) => pagineDi(idFunnel)[0];
  const indirizzoPagina = (p) => { const f = funnel(p.funnel); return f.dominio + '/' + f.percorsoPagina + (p.sotto ? '/' + p.sotto : ''); };
  const percorsoPubblico = (p) => { const f = funnel(p.funnel); return '#/pagina/' + f.percorsoPagina + (p.sotto ? '/' + p.sotto : ''); };
  const modulo = (id) => (R.stato.moduli || []).find((m) => m.id === id);
  const fra = (iso) => {
    const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'adesso';
    if (min === 1) return '1 minuto fa';
    if (min < 60) return min + ' minuti fa';
    if (R.diffGiorni(iso) === 0) return 'alle ' + R.ora(iso);
    return R.giornoRelativo(iso) + ' alle ' + R.ora(iso);
  };
  const etichettaStato = (f) => ({ online: '<span class="etichetta salvia">Online</span>', bozza: '<span class="etichetta pesca">Bozza</span>', pausa: '<span class="etichetta cielo">In pausa</span>' }[f.stato] || '');
  const nuovoBlocco = (tipo, props) => Object.assign({ id: R.id('b'), tipo, telefono: true, sfondo: 'bianco', colonna: '', dimensione: 'M', arrotondamento: 100, colore: 'primario', azione: 'modulo' }, props || {});

  /* ================= Dati di partenza propri ================= */
  const MARCHI = {
    rosso: { primario: '#D63B3B', scuro: '#2A2B31', tenue: '#F5F3EF', immagine: '#DCE7F3', logo: 'inizio' },
    blu: { primario: '#1F3A5A', scuro: '#1F3A5A', tenue: '#F2F5F9', immagine: '#8FB2D6', logo: 'inizio' },
    verde: { primario: '#2E6650', scuro: '#1F4D3A', tenue: '#F1F6F2', immagine: '#C9DDCD', logo: 'inizio' },
  };

  function pagineZes() {
    const b = nuovoBlocco;
    return [
      b('intestazione', { testo: 'inizio', pulsante: 'Scrivici su WhatsApp', colore: 'primario' }),
      b('titolo', { sfondo: 'scuro', testo: 'Hai in programma investimenti nel 2026?', colore: 'primario', dimensione: 'L' }),
      b('titolo', { sfondo: 'scuro', testo: 'Con la ZES Unica puoi ottenere fino al 60% di credito d\'imposta.', colore: 'chiaro', dimensione: 'M' }),
      b('testo', { sfondo: 'scuro', testo: 'Verifichiamo gratis se la tua azienda può accedere.' }),
      b('pulsante', { sfondo: 'scuro', testo: 'Scarica la brochure gratuita', azione: 'modulo', colore: 'primario' }),
      b('immagine', { colonna: 'sx', titolo: 'Esempio di acquisto', testo: 'Foto: macchinario CNC', sotto: 'Macchinario da 250.000 € → credito d\'imposta fino a 150.000 €' }),
      b('modulo', { colonna: 'dx', modulo: 'mo1', testo: 'Richiedi la verifica gratuita', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Richiedi la verifica gratuita', colore: 'primario' }),
      b('video', { sfondo: 'tenue', testo: 'Come funziona la ZES Unica, in 2 minuti' }),
      b('whatsapp', { testo: 'Preferisci scriverci? Ti rispondiamo su WhatsApp in orario di ufficio.', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' }),
      b('faq', { sfondo: 'tenue', testo: 'Domande frequenti', voci: [
        { d: 'Chi può accedere alla ZES Unica?', r: 'Le imprese che investono in beni nuovi in una struttura del Mezzogiorno: Campania, Puglia, Basilicata, Calabria, Sicilia, Sardegna, Molise e Abruzzo.' },
        { d: 'Quanto costa la verifica?', r: 'Niente. Guardiamo i tuoi dati e ti diciamo se la tua azienda può accedere e quanto puoi ottenere.' },
        { d: 'Quali documenti servono?', r: 'Per iniziare bastano visura camerale, ultimi bilanci e preventivi dei beni che vuoi acquistare.' },
      ] }),
      b('mappa', { testo: 'Dove siamo', sotto: 'Via Toledo 156, Napoli · dal lunedì al venerdì, 9–18' }),
      b('galleria', { sfondo: 'tenue', testo: 'Alcuni progetti che abbiamo seguito', voci: ['Officina meccanica · Caserta', 'Frantoio · Bari', 'Laboratorio alimentare · Salerno', 'Capannone logistico · Lecce'] }),
    ];
  }
  function pagineRestoAlSud() {
    const b = nuovoBlocco;
    return [
      b('intestazione', { testo: 'inizio', pulsante: 'WhatsApp', colore: 'whatsapp' }),
      b('titolo', { sfondo: 'marchio', colonna: 'sx', etichetta: 'Under 35 · Campania', testo: 'Apri la tua attività con Resto al Sud 2.0', colore: 'chiaro', dimensione: 'L' }),
      b('testo', { sfondo: 'marchio', colonna: 'sx', testo: 'Fino al 75% a fondo perduto. Ti seguiamo noi, dalla domanda all\'avvio.' }),
      b('pulsante', { sfondo: 'marchio', colonna: 'sx', testo: 'Verifica se puoi accedere', colore: 'chiaro', azione: 'modulo' }),
      b('immagine', { sfondo: 'marchio', colonna: 'dx', testo: 'Foto: giovane artigiano' }),
      b('riquadri', { voci: [
        { t: 'Chi può partecipare', s: 'Giovani dai 18 ai 35 anni che vogliono aprire un\'attività al Sud.' },
        { t: 'Quanto puoi ottenere', s: 'Fino al 75% a fondo perduto sulle spese per avviare l\'attività.' },
        { t: 'Come funziona', s: 'Verifichiamo i requisiti, prepariamo la domanda e ti seguiamo fino all\'avvio.' },
      ] }),
      b('modulo', { sfondo: 'tenue', modulo: 'mo1', testo: 'Verifica gratis se puoi accedere', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Verifica se puoi accedere', colore: 'primario' }),
      b('faq', { testo: 'Domande frequenti', voci: [
        { d: 'Devo avere già una partita IVA?', r: 'No. Puoi chiedere l\'agevolazione anche prima di aprire l\'attività.' },
        { d: 'Quanto tempo ci vuole?', r: 'Di solito la risposta arriva in 2–3 mesi dalla domanda.' },
      ] }),
    ];
  }
  function pagineMicrocredito() {
    const b = nuovoBlocco;
    return [
      b('intestazione', { testo: 'inizio', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' }),
      b('titolo', { sfondo: 'scuro', testo: 'Microcredito fino a 50.000 € senza garanzie', colore: 'chiaro', dimensione: 'L' }),
      b('testo', { sfondo: 'scuro', testo: 'Per chi apre o fa crescere una piccola attività. Ti spieghiamo tutto in una telefonata.' }),
      b('pulsante', { sfondo: 'scuro', testo: 'Chiedi una consulenza gratuita', colore: 'chiaro', azione: 'modulo' }),
      b('riquadri', { voci: [{ t: 'A chi serve', s: 'Ditte individuali, società e professionisti con partita IVA da meno di 5 anni.' }, { t: 'Quanto', s: 'Fino a 50.000 €, da restituire in 7 anni.' }, { t: 'Cosa facciamo noi', s: 'Prepariamo la domanda e ti accompagniamo fino all\'erogazione.' }] }),
      b('modulo', { sfondo: 'tenue', modulo: 'mo2', testo: 'Chiedi una consulenza gratuita', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Invia la richiesta', colore: 'primario' }),
    ];
  }
  function paginaGrazie(testoExtra) {
    const b = nuovoBlocco;
    return [
      b('intestazione', { testo: 'inizio', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' }),
      b('titolo', { sfondo: 'tenue', testo: 'Grazie, ti chiamiamo noi', colore: 'scuro', dimensione: 'L' }),
      b('testo', { sfondo: 'tenue', testo: 'Abbiamo ricevuto la tua richiesta. Ti richiamiamo entro 1 ora di lavoro (dal lunedì al venerdì, 9–18).' + (testoExtra ? ' ' + testoExtra : '') }),
      b('whatsapp', { testo: 'Hai fretta? Scrivici subito, ti risponde una persona del nostro gruppo.', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' }),
    ];
  }

  function datiMarketing(s) {
    const unMinutoFa = new Date(Date.now() - 65000).toISOString();
    (s.funnel || []).forEach((f) => {
      if (!f.dominio) f.dominio = (f.indirizzo || '').split('/')[0] || sottodominioDi(s);
      if (f.linkCorto == null) f.linkCorto = { fu1: 'inizio.it/zes', fu2: 'inizio.it/sud' }[f.id] || '';
      if (f.pixel == null) f.pixel = f.stato === 'online';
      if (f.analytics == null) f.analytics = f.stato === 'online';
      if (!f.campagna) f.campagna = { fu1: 'ZES 2026', fu2: 'Resto al Sud', fu3: 'Microcredito' }[f.id] || f.nome;
      if (!f.modulo) f.modulo = f.id === 'fu3' ? 'mo2' : 'mo1';
    });
    if (!s.pagine) {
      const pag = (id, fu, ordine, nome, sotto, tipo, marchio, blocchi, pubblicata) => ({ id, funnel: fu, ordine, nome, sotto, tipo, marchio: Object.assign({}, MARCHI[marchio]), blocchi, pubblicati: pubblicata ? JSON.parse(JSON.stringify(blocchi)) : null, salvato: unMinutoFa, chat: [], ab: null });
      s.pagine = [
        pag('pg1', 'fu1', 1, 'Presentazione e modulo', '', 'principale', 'rosso', pagineZes(), true),
        pag('pg1g', 'fu1', 2, 'Grazie, ti chiamiamo noi', 'grazie', 'grazie', 'rosso', paginaGrazie(), true),
        pag('pg2', 'fu2', 1, 'Presentazione e modulo', '', 'principale', 'blu', pagineRestoAlSud(), true),
        pag('pg2g', 'fu2', 2, 'Grazie, ti chiamiamo noi', 'grazie', 'grazie', 'blu', paginaGrazie(), true),
        pag('pg3', 'fu3', 1, 'Presentazione e modulo', '', 'principale', 'verde', pagineMicrocredito(), false),
        pag('pg3g', 'fu3', 2, 'Grazie, ti chiamiamo noi', 'grazie', 'grazie', 'verde', paginaGrazie(), false),
      ];
      s.pagine.find((p) => p.id === 'pg1').ab = { attiva: true, divisione: 50, titoloB: 'Investi nel 2026? Recupera fino al 60% con la ZES Unica', visiteA: 1170, visiteB: 1170, contattiA: 66, contattiB: 76 };
    }
    if (!s.moduli) {
      const c = (tipo, domanda, extra) => Object.assign({ id: R.id('cm'), tipo, domanda, obbligatorio: false, risposte: [], salvaNel: '' }, extra || {});
      const base = () => [
        c('nome', 'Nome e cognome', { obbligatorio: true, segnaposto: 'Mario Rossi', salvaNel: 'Nome del contatto' }),
        c('telefono', 'Telefono', { segnaposto: '333 123 4567', salvaNel: 'Telefono' }),
        c('email', 'Email', { segnaposto: 'mario@esempio.it', salvaNel: 'Email' }),
      ];
      const consensi = () => [
        c('privacy', 'Ho letto l\'informativa privacy e acconsento a essere ricontattato', { obbligatorio: true }),
        c('consensoWa', 'Voglio ricevere aggiornamenti su WhatsApp'),
        c('consensoEmail', 'Voglio ricevere aggiornamenti per email'),
        c('nascosto', 'Fonte e campagna (dall\'indirizzo della pubblicità)', { salvaNel: 'Fonte e campagna' }),
      ];
      s.moduli = [
        { id: 'mo1', nome: 'Verifica gratuita ZES 2026', titolo: 'Richiedi la verifica gratuita', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Richiedi la verifica gratuita',
          campi: base().concat([
            c('tendina', 'In quale settore lavori?', { risposte: ['Manifattura', 'Commercio', 'Turismo e ristorazione', 'Agricoltura'], salvaNel: 'Settore / Ateco', segnaposto: 'Scegli il settore' }),
            c('scelta', 'Quanto vuoi investire?', { risposte: ['Fino a 100.000 €', '100–500.000 €', 'Oltre 500.000 €'], salvaNel: 'Valore dell\'affare' }),
          ]).concat(consensi()),
          dopo: { percorso: 'p1', fase: 'f1', responsabile: 'turno', fisso: 'u2', pagina: 'grazie', avvisa: 'responsabile', automazione: 'au1', promemoria: true, ore: 1 } },
        { id: 'mo2', nome: 'Consulenza Microcredito', titolo: 'Chiedi una consulenza gratuita', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Invia la richiesta',
          campi: base().concat([c('ragione', 'Ragione sociale', { salvaNel: 'Ragione sociale' })]).concat(consensi()),
          dopo: { percorso: 'p1', fase: 'f1', responsabile: 'fisso', fisso: 'u3', pagina: 'grazie', avvisa: 'responsabile', automazione: 'au1', promemoria: true, ore: 1 } },
        { id: 'mo3', nome: 'Contatto rapido dal sito', titolo: 'Scrivici', sotto: 'Rispondiamo in giornata.', pulsante: 'Invia',
          campi: base().concat(consensi()),
          dopo: { percorso: 'p2', fase: 'm1', responsabile: 'turno', fisso: 'u3', pagina: 'grazie', avvisa: 'amministratori', automazione: '', promemoria: true, ore: 1 } },
      ];
    }
    if (!s.campagne) {
      s.campagne = [
        { id: 'em1', nome: 'Nuovo bando ZES 2026: fino al 60%', destinatari: 'Finanza agevolata', numero: 1240, quando: R.giorniDa(-9, '10:00'), stato: 'inviata', aperte: 46, clic: 12, oggetto: 'Nuovo bando ZES 2026: fino al 60% di credito d\'imposta', testo: 'Ciao Mario,\nse hai in programma investimenti nel 2026, questo bando può coprire fino al 60% della spesa.', pulsante: 'Verifica gratis', marchio: 'rosso' },
        { id: 'em2', nome: 'Resto al Sud: le domande più frequenti', destinatari: 'under 35', numero: 860, quando: R.giorniDa(-16, '10:00'), stato: 'inviata', aperte: 38, clic: 7, oggetto: 'Resto al Sud 2.0: le 5 domande che ci fate di più', testo: 'Ciao Mario,\nabbiamo raccolto le domande che ci fanno più spesso su Resto al Sud 2.0, con le risposte in breve.', pulsante: 'Leggi le risposte', marchio: 'blu' },
        { id: 'em3', nome: 'Ultimi giorni per la ZES: hai i documenti?', destinatari: 'fase Documenti richiesti', numero: 312, quando: R.giorniDa(5, '09:00'), stato: 'programmata', aperte: null, clic: null, oggetto: 'Ultimi giorni per la ZES: hai preparato i documenti?', testo: 'Ciao Mario,\nmancano pochi giorni: ti ricordiamo i documenti che ci servono per la domanda.', pulsante: 'Vedi l\'elenco', marchio: 'rosso' },
        { id: 'em4', nome: 'Newsletter di novembre', destinatari: 'tutti i contatti', numero: null, quando: null, stato: 'bozza', aperte: null, clic: null, oggetto: 'Le novità di novembre sui bandi', testo: 'Ciao Mario,\necco i bandi aperti a novembre e le scadenze da non perdere.', pulsante: 'Scopri i bandi', marchio: 'verde' },
      ];
      s.emailMese = { inviate: 3420, aperte: 41, cliccate: 9, affari: 17 };
    }
    if (!s.domini) {
      s.domini = [
        { id: 'do1', nome: 'agevolazioni.inizioimpresa.it', stato: 'verde', nota: 'Collegato e protetto', reindirizzamenti: [{ da: 'agevolazioni.inizioimpresa.it/zes', a: 'agevolazioni.inizioimpresa.it/zes2026' }] },
        { id: 'do2', nome: 'inizio.it', stato: 'verde', nota: 'Usato per i link corti', reindirizzamenti: [{ da: 'inizio.it/zes', a: 'agevolazioni.inizioimpresa.it/zes2026' }, { da: 'inizio.it/sud', a: 'agevolazioni.inizioimpresa.it/restoalsud' }] },
        { id: 'do3', nome: 'offerte.inizioimpresa.it', stato: 'giallo', nota: 'In verifica: di solito basta qualche ora', reindirizzamenti: [] },
        { id: 'do4', nome: 'bandi-sud.it', stato: 'rosso', nota: 'Non punta più al software: controlla le impostazioni presso chi ti vende il dominio', reindirizzamenti: [] },
      ];
    }
    if (!s.spazio) s.spazio = { usatoMb: 1650, limiteMb: 2048 };
    if (!s.copieFunnel) s.copieFunnel = [];
  }
  function sottodominioDi(s) { const a = (s.aziende || []).find((x) => x.id === s.aziendaAttiva); return ((a && a.sottodominio) || 'azienda') + '.rampant.it'; }
  R.estendiDati(datiMarketing);
  /* Se nel browser ci sono dati salvati prima di questo file, aggiunge quelli mancanti. */
  function assicura() {
    if (!R.stato) return;
    if (!R.stato.filtri) R.stato.filtri = {};
    if (!R.stato.pagine || !R.stato.moduli || !R.stato.campagne || !R.stato.domini || !R.stato.spazio || !R.stato.copieFunnel || (R.stato.funnel || []).some((f) => !f.dominio || !f.modulo || !f.campagna)) { datiMarketing(R.stato); R.salva(); }
  }

  /* ================= Stile proprio ================= */
  R.stile('marketing', `
.mk-barra { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; margin: 4px 0 6px; padding-bottom: 2px; }
.mk-barra::-webkit-scrollbar { display: none; }
.mk-barra a { flex: none; background: var(--bianco); border-radius: 999px; padding: 8px 15px; font-size: 13.5px; color: var(--testo-3); text-decoration: none; white-space: nowrap; font-weight: 500; }
.mk-barra a.attivo { background: var(--scuro); color: #fff; font-weight: 600; }
.mk-schede { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 18px; }
.mk-schede button { border: 0; background: var(--bianco); border-radius: 999px; padding: 10px 16px; font-size: 13.5px; font-weight: 500; color: var(--testo-3); min-height: 40px; }
.mk-schede button.attivo { background: var(--scuro); color: #fff; font-weight: 600; }
.mk-cerca { width: 250px; }
.mk-cerca .campo { background: var(--bianco); }
.mk-griglia-funnel { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--spazio); }
.mk-card { background: var(--bianco); border-radius: var(--r-grande); padding: 14px 14px 20px; cursor: pointer; border: 0; text-align: left; width: 100%; display: block; color: inherit; }
.mk-card:hover .mk-anteprima { filter: brightness(.98); }
.mk-anteprima { height: 170px; border-radius: 22px; position: relative; overflow: hidden; padding: 18px; }
.mk-anteprima i { display: block; height: 10px; border-radius: 999px; margin-bottom: 9px; }
.mk-anteprima .bott { position: absolute; left: 18px; bottom: 18px; width: 120px; height: 24px; border-radius: 999px; }
.mk-anteprima .foto { position: absolute; right: 18px; top: 18px; bottom: 18px; width: 36%; border-radius: 14px; }
.mk-card-info { padding: 14px 6px 0; }
.mk-card-nome { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.mk-card-nome b { font-family: var(--titoli); font-size: 20px; letter-spacing: -0.02em; font-weight: 700; }
.mk-url { font-size: 12.5px; color: var(--testo-3); word-break: break-all; }
.mk-numeri { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 14px; }
.mk-numeri span { display: block; font-size: 11.5px; color: var(--testo-2); }
.mk-numeri b { font-size: 17px; font-weight: 600; }
.mk-nuovo { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 300px; cursor: pointer; width: 100%; color: var(--testo-3); }
.mk-nuovo .tondo-bianco { width: 56px; height: 56px; border-radius: 50%; background: var(--bianco); display: grid; place-items: center; }
.mk-pagine { display: flex; gap: 14px; align-items: stretch; overflow-x: auto; padding-bottom: 4px; }
.mk-pag { flex: 1 1 420px; min-width: 300px; background: var(--campo); border-radius: 22px; padding: 14px; display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 14px; }
.mk-pag .mini { height: 150px; border-radius: 14px; padding: 12px; position: relative; overflow: hidden; }
.mk-pag .mini i { display: block; height: 7px; border-radius: 999px; margin-bottom: 7px; }
.mk-pag .mini .bott { position: absolute; left: 12px; bottom: 12px; width: 60px; height: 14px; border-radius: 999px; }
.mk-freccia { align-self: center; color: var(--testo-2); flex: none; }
.mk-aggiungi { flex: 0 0 150px; border: 2px dashed #D9D3C7; background: transparent; border-radius: 22px; color: var(--testo-3); font-weight: 600; font-size: 13px; min-height: 150px; }
.mk-due { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: var(--spazio); align-items: start; }
.mk-catena { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.mk-anello { background: var(--scuro-2); border-radius: 999px; padding: 9px 14px; font-size: 13.5px; }
.mk-anello b { color: var(--lime); font-weight: 600; }
.mk-catena .sep { color: #8E928A; }
.mk-riga-ind { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; border: 0; background: var(--campo); border-radius: 999px; padding: 10px 16px; margin-bottom: 9px; min-height: 44px; text-align: left; font-size: 13.5px; }
.mk-riga-ind span:first-child { color: var(--testo-2); }
.mk-riga-ind b { font-weight: 600; text-align: right; word-break: break-all; }
.mk-riga-ind b.verde { color: var(--verde); }
.mk-riga-ind select { border: 0; background: transparent; font-weight: 600; text-align: right; max-width: 60%; }
.mk-tile-griglia { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.mk-tile { background: var(--campo); border: 0; border-radius: 18px; min-height: 74px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12.5px; padding: 8px; text-align: center; line-height: 1.2; }
.mk-tile:hover { background: #ECE8E0; }
.mk-tile.salvia { background: var(--salvia); color: var(--salvia-t); }
.mk-tile.lavanda { background: var(--lavanda); color: var(--lavanda-t); }
.mk-livello { display: flex; align-items: center; gap: 6px; border-radius: 14px; padding: 4px 4px 4px 12px; margin-bottom: 6px; background: var(--campo); font-size: 13px; min-height: 44px; }
.mk-livello.sel { background: var(--salvia); color: var(--salvia-t); font-weight: 600; }
.mk-livello .principale { flex: 1; min-width: 0; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mk-livello button { border: 0; background: transparent; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; }
.mk-livello button:hover { background: rgba(0,0,0,.06); }
.mk-foglio { background: #fff; border-radius: 14px; overflow: hidden; margin: 0 auto; max-width: 1000px; transition: max-width .2s; }
.mk-foglio.tablet { max-width: 600px; }
.mk-foglio.telefono { max-width: 375px; }
.mk-tela { padding: 22px; }
.mk-pannello { position: sticky; top: 12px; }
.mk-colori { display: flex; gap: 9px; flex-wrap: wrap; }
.mk-colori button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #E2DED6; padding: 0; }
.mk-colori button.scelto { box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--scuro); }
.mk-taglie { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.mk-taglie button { border: 0; background: var(--campo); border-radius: 999px; min-height: 38px; font-weight: 600; }
.mk-taglie button.attivo { background: var(--scuro); color: #fff; }
input[type=range].mk-range { width: 100%; accent-color: var(--verde); height: 30px; }
.mk-ai { background: var(--lavanda); color: var(--lavanda-t); }
.mk-ai .campo { background: var(--bianco); }
.mk-ai textarea.campo { min-height: 70px; }
.btn.mk-viola { background: #45285C; color: #fff; }
.mk-avviso-tel { background: var(--pesca); color: var(--pesca-t); border-radius: 22px; padding: 14px 18px; margin: 14px var(--margine) 0; font-size: 13.5px; }
.mk-stato-salv { font-size: 12px; color: var(--testo-2); }
.mk-stato-salv.ok { color: var(--verde); }
.mk-chat { background: var(--scuro); color: var(--scuro-t); border-radius: var(--r-grande); padding: 18px; display: flex; flex-direction: column; min-height: 640px; position: sticky; top: 12px; max-height: calc(100vh - 120px); }
.mk-chat .msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; }
.mk-msg { border-radius: 20px; padding: 12px 15px; font-size: 13.5px; line-height: 1.45; }
.mk-msg.tu { background: var(--verde-2); color: #fff; }
.mk-msg.ai { background: var(--scuro-2); }
.mk-msg .chip { display: inline-block; background: rgba(255,255,255,.08); border-radius: 999px; padding: 5px 10px; margin: 6px 6px 0 0; font-size: 12.5px; border: 0; color: inherit; }
.mk-msg .chip.attivo { background: var(--cielo); color: var(--cielo-t); }
.mk-suggerimenti { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
.mk-suggerimenti button { border: 0; background: var(--scuro-2); color: var(--scuro-t); border-radius: 999px; padding: 8px 12px; font-size: 12.5px; min-height: 36px; }
.mk-scrivi { display: flex; gap: 8px; background: var(--scuro-2); border-radius: 999px; padding: 5px 5px 5px 16px; align-items: center; }
.mk-scrivi input { flex: 1; background: transparent; border: 0; color: var(--scuro-t); min-height: 40px; outline: none; min-width: 0; }
.mk-scrivi input::placeholder { color: #8E928A; }
.mk-ai-area { display: grid; grid-template-columns: 360px minmax(0, 1fr) 260px; gap: var(--spazio); padding: 14px var(--margine) 40px; align-items: start; }
.mk-zona { background: #E6E1D8; border-radius: var(--r-grande); padding: 16px 18px 20px; }
.mk-zona .cartellino { display: block; width: fit-content; margin: 0 auto 12px; background: var(--bianco); border-radius: 999px; padding: 4px 12px; font-size: 12.5px; }
.mk-barra-ai { display: flex; gap: 4px; background: var(--scuro); border-radius: 999px; padding: 6px; width: fit-content; max-width: 100%; margin: 14px auto 0; overflow-x: auto; }
.mk-barra-ai button { border: 0; background: transparent; color: var(--scuro-t); border-radius: 999px; padding: 9px 14px; font-size: 13px; white-space: nowrap; }
.mk-barra-ai button.lime { background: var(--lime); color: var(--scuro); font-weight: 600; }
.mk-cornice { width: 232px; margin: 0 auto; border: 8px solid var(--scuro); border-radius: 34px; overflow: hidden auto; height: 470px; background: #fff; scrollbar-width: none; }
.mk-cornice > .pp { width: 375px; zoom: 0.576; }
.mk-costruzione { border: 2px dashed #C9C2B4; border-radius: 14px; padding: 30px; text-align: center; color: var(--testo-2); margin: 16px; }
.mk-numero-tile { border-radius: var(--r-grande); padding: 22px 22px 18px; }
.mk-numero-tile .etichetta-numero { font-size: 13.5px; }
.mk-campagna { display: grid; grid-template-columns: minmax(0, 2.2fr) 1fr 1fr .8fr auto; gap: 10px; align-items: center; padding: 14px 0; border-bottom: 1px solid var(--linea); cursor: pointer; }
.mk-campagna:last-child { border-bottom: 0; }
.mk-campagna.sel .nome { color: var(--verde); }
.mk-campagna .nome { font-weight: 600; font-size: 14.5px; }
.mk-email { background: #fff; border-radius: 22px; overflow: hidden; max-width: 380px; margin: 0 auto; }
.mk-email .testa { padding: 22px 22px 18px; color: #fff; }
.mk-email .testa h3 { font-family: var(--titoli); font-size: 20px; line-height: 1.15; letter-spacing: -0.02em; margin: 6px 0 0; }
.mk-email .corpo { padding: 18px 22px 22px; font-size: 13.5px; color: var(--testo-3); white-space: pre-line; }
.mk-email .btn-email { display: inline-block; margin-top: 14px; border-radius: 999px; padding: 11px 18px; color: #fff; font-weight: 600; }
.mk-chips { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-top: 14px; }
.mk-chips button { border: 0; background: var(--bianco); border-radius: 999px; padding: 7px 12px; font-size: 12.5px; min-height: 36px; }
.mk-spazio { height: 12px; background: var(--campo); border-radius: 999px; overflow: hidden; margin: 10px 0 6px; }
.mk-spazio span { display: block; height: 100%; background: var(--verde); border-radius: 999px; }
.mk-spazio.pieno span { background: var(--pesca-t); }
.mk-semaforo { width: 14px; height: 14px; border-radius: 50%; flex: none; display: inline-block; }
.mk-semaforo.verde { background: #2F8F5B; } .mk-semaforo.giallo { background: #E0A43A; } .mk-semaforo.rosso { background: var(--errore-t); }
.mk-codice { background: var(--scuro); color: var(--lime); border-radius: 18px; padding: 14px 16px; font-family: ui-monospace, Consolas, monospace; font-size: 12.5px; word-break: break-all; }
.mk-fasi-pubblica { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.mk-fasi-pubblica div { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.mk-fasi-pubblica .ok { color: var(--verde); font-weight: 600; }
.mk-link-pubblico { display: flex; gap: 8px; align-items: center; background: var(--salvia); color: var(--salvia-t); border-radius: 999px; padding: 6px 6px 6px 16px; margin-top: 14px; }
.mk-link-pubblico a { flex: 1; font-weight: 600; word-break: break-all; }
.mk-dopo .riga-impostazione .valore { font-size: 13.5px; }
.mk-campo-mod { position: relative; border-radius: 16px; padding: 8px; margin: 0 -8px 6px; cursor: pointer; }
.mk-campo-mod:hover { box-shadow: inset 0 0 0 1px #D9D3C7; }
.mk-campo-mod.sel { outline: 2px dashed #6FA287; outline-offset: 2px; }
.mk-barretta { position: absolute; right: 0; top: -18px; display: flex; gap: 2px; background: var(--scuro); border-radius: 999px; padding: 4px; z-index: 3; }
.mk-barretta button { border: 0; background: transparent; color: #fff; font-size: 12px; padding: 4px 9px; border-radius: 999px; min-height: 28px; }
.mk-barretta button.dup { color: var(--lime); } .mk-barretta button.eli { color: #F4A79D; }
.mk-barretta b { color: #fff; font-size: 12px; padding: 4px 8px; font-weight: 600; }
.mk-modulo-anteprima { background: #fff; border-radius: 22px; padding: 26px 28px; max-width: 580px; margin: 0 auto; }
.mk-modulo-anteprima h2 { font-family: var(--titoli); font-size: 26px; letter-spacing: -0.02em; margin: 0 0 6px; }
.mk-ab { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mk-ab > div { background: var(--campo); border-radius: 20px; padding: 14px 16px; }
.mk-ab > div.vince { background: var(--salvia); color: var(--salvia-t); }
.mk-placeholder { min-height: 220px; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 10px; }
@media (max-width: 1180px) {
  .mk-griglia-funnel { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .mk-ai-area { grid-template-columns: 320px minmax(0, 1fr); }
  .mk-ai-area > .mk-zona-tel { grid-column: 1 / -1; }
  .mk-due { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 767px) {
  .mk-barra a, .mk-schede button { min-height: 44px; display: inline-flex; align-items: center; }
  .mk-griglia-funnel { grid-template-columns: minmax(0, 1fr); }
  .mk-cerca { width: 100%; }
  .mk-pagine { flex-direction: column; }
  .mk-pag { min-width: 0; flex-basis: auto; grid-template-columns: 84px minmax(0, 1fr); }
  .mk-pag .mini { height: 110px; }
  .mk-freccia { transform: rotate(90deg); }
  .mk-aggiungi { flex-basis: auto; min-height: 64px; }
  .mk-ai-area { grid-template-columns: minmax(0, 1fr); }
  .mk-chat { min-height: 0; position: static; max-height: none; }
  .mk-chat .msgs { max-height: 340px; }
  .mk-campagna { grid-template-columns: minmax(0, 1fr) auto; }
  .mk-campagna .solo-largo { display: none; }
  .mk-ab { grid-template-columns: 1fr; }
  .mk-tela { padding: 10px; }
  .mk-modulo-anteprima { padding: 20px 16px; }
  .mk-numero-tile .numero-grande { font-size: 44px; }
}
/* ---------- Pagine pubbliche: colori del marchio della pagina, non dell'interfaccia ---------- */
.pp { container-type: inline-size; background: #fff; color: #1B1D1A; font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 16px; line-height: 1.5; }
.pp-sez { padding: 34px 28px; }
.pp-dentro { max-width: 1000px; margin: 0 auto; }
.pp-sez.scuro { background: var(--pp-scuro); color: #fff; }
.pp-sez.marchio { background: var(--pp-primario); color: #fff; }
.pp-sez.tenue { background: var(--pp-tenue); }
.pp-testata { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 28px; background: #fff; }
.pp-logo { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-weight: 700; font-size: 22px; letter-spacing: -0.02em; display: flex; align-items: center; gap: 8px; }
.pp-logo .marchio-img { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; color: #fff; font-size: 15px; }
.pp-titolo { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-weight: 700; letter-spacing: -0.02em; line-height: 1.08; margin: 0 0 12px; }
.pp-titolo.S { font-size: 22px; } .pp-titolo.M { font-size: 28px; } .pp-titolo.L { font-size: 38px; }
.pp-etichetta { display: inline-block; background: rgba(255,255,255,.88); color: #1B1D1A; border-radius: 999px; padding: 3px 10px; font-size: 12.5px; margin-bottom: 10px; }
.pp-testo { margin: 0 0 14px; opacity: .92; white-space: pre-line; }
.pp-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 0 26px; font-weight: 600; font-size: 16px; border: 0; text-decoration: none; cursor: pointer; font-family: inherit; }
.pp-btn.S { min-height: 44px; font-size: 14px; padding: 0 18px; } .pp-btn.L { min-height: 58px; font-size: 18px; padding: 0 32px; }
.pp-col2 { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 28px; align-items: start; }
.pp-col2 > div > *:last-child { margin-bottom: 0; }
.pp-img { background: var(--pp-immagine); border-radius: 16px; aspect-ratio: 16 / 10; display: flex; align-items: flex-end; padding: 12px; color: #1B1D1A; font-size: 12.5px; margin-bottom: 10px; }
.pp-img span { background: rgba(255,255,255,.88); border-radius: 999px; padding: 3px 10px; }
.pp-h3 { font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin: 0 0 12px; }
.pp-didascalia { font-size: 14px; opacity: .85; }
.pp-form { background: #F4F4F2; color: #1B1D1A; border-radius: 16px; padding: 22px; }
.pp-form .sotto { font-size: 14px; color: #5E625C; margin: -6px 0 14px; }
.pp-grp { margin-bottom: 12px; }
.pp-grp > label { display: block; font-size: 14px; font-weight: 600; margin-bottom: 5px; }
.pp-campo { width: 100%; min-height: 48px; border-radius: 10px; border: 1px solid #D9D6CF; padding: 0 14px; font-size: 16px; background: #fff; color: #1B1D1A; font-family: inherit; }
.pp-campo.errore { border-color: #B3261E; }
.pp-tel { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 8px; }
.pp-scelte { display: flex; flex-wrap: wrap; gap: 8px; }
.pp-scelte label { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1px solid #D9D6CF; border-radius: 999px; padding: 0 14px; min-height: 44px; font-size: 14px; cursor: pointer; }
.pp-check { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; padding: 8px 0; min-height: 44px; cursor: pointer; }
.pp-check input { width: 20px; height: 20px; margin: 1px 0 0; flex: none; accent-color: var(--pp-primario); }
.pp-err { color: #B3261E; font-size: 13.5px; margin-top: 4px; }
.pp-nota { font-size: 12.5px; color: #5E625C; margin-top: 10px; }
.pp-faq details { background: #fff; border-radius: 12px; margin-bottom: 8px; border: 1px solid #E6E3DC; }
.pp-sez.tenue .pp-faq details { border-color: transparent; }
.pp-faq summary { cursor: pointer; padding: 14px 16px; font-weight: 600; min-height: 48px; color: #1B1D1A; }
.pp-faq details p { margin: 0; padding: 0 16px 14px; color: #4A4E48; }
.pp-riquadri { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.pp-riquadri div { background: var(--pp-tenue); border-radius: 14px; padding: 18px; color: #1B1D1A; }
.pp-riquadri b { display: block; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 18px; margin-bottom: 6px; }
.pp-galleria { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.pp-galleria div { aspect-ratio: 1; border-radius: 12px; background: var(--pp-immagine); display: flex; align-items: flex-end; padding: 8px; font-size: 12px; }
.pp-galleria div:nth-child(2n) { filter: saturate(.6) brightness(1.06); }
.pp-mappa { border-radius: 14px; background: #E8EDE6; min-height: 200px; display: grid; place-items: center; text-align: center; color: #4A4E48; padding: 20px; }
.pp-video { aspect-ratio: 16 / 9; border-radius: 14px; background: #1B1D1A; color: #fff; display: grid; place-items: center; width: 100%; border: 0; cursor: pointer; font-family: inherit; }
.pp-video .play { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,.15); display: grid; place-items: center; margin: 0 auto 10px; }
.pp-recensioni { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.pp-recensioni div { background: #fff; border: 1px solid #E6E3DC; border-radius: 14px; padding: 16px; font-size: 14px; color: #1B1D1A; }
.pp-conto { display: flex; gap: 10px; flex-wrap: wrap; }
.pp-conto div { background: rgba(127,127,127,.12); border-radius: 12px; padding: 10px 14px; text-align: center; min-width: 70px; }
.pp-conto b { display: block; font-family: "Bricolage Grotesque", system-ui, sans-serif; font-size: 28px; }
.pp-wa { text-align: center; }
.pp-hr { border: 0; border-top: 1px solid #E6E3DC; margin: 0; }
.pp-piede { padding: 22px 28px 30px; font-size: 12.5px; color: #5E625C; text-align: center; background: #fff; }
.pp-el { position: relative; margin-bottom: 14px; }
.pp-el:last-child { margin-bottom: 0; }
.pp-el.pp-intestazione { margin: 0; }
.pp-modo-editor .pp-el { cursor: pointer; border-radius: 10px; }
.pp-modo-editor .pp-el:hover { outline: 1px dashed rgba(111,162,135,.8); outline-offset: 4px; }
.pp-modo-editor .pp-el.sel { outline: 2px dashed #6FA287; outline-offset: 5px; }
.pp-modo-editor .pp-el.nascosto-tel { opacity: .45; }
.pp-modo-editor .pp-intestazione.sel { outline-offset: -3px; }
.pp-cartello { position: absolute; left: 0; top: -30px; background: #1F4D3A; color: #fff; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; z-index: 3; font-family: "Plus Jakarta Sans", system-ui; }
.pp-el .mk-barretta { top: -34px; left: 0; right: auto; white-space: nowrap; }
.pp-el.pp-el-stretto { width: fit-content; max-width: 100%; }
.pp-modo-editor .pp-el.sel:not(:first-child):not(.pp-intestazione) { margin-top: 40px; }
.pp-modo-editor .pp-sez { padding-top: 40px; }
.pp-pubblica-vuota { min-height: 70vh; display: grid; place-items: center; text-align: center; padding: 30px 20px; color: #4A4E48; background: #fff; }
.mk-cosa-successo { background: var(--scuro); color: var(--scuro-t); border-radius: 28px; padding: 24px; margin: 26px auto 40px; max-width: 760px; font-family: var(--testi); font-size: 14px; }
.mk-cosa-successo h2 { font-family: var(--titoli); font-size: 22px; letter-spacing: -0.02em; margin: 0 0 4px; }
.mk-cosa-successo ul { list-style: none; padding: 0; margin: 14px 0 18px; }
.mk-cosa-successo li { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #33362F; }
.mk-cosa-successo li svg { color: var(--lime); flex: none; margin-top: 2px; }
.mk-separatore-prototipo { background: var(--sfondo); padding: 4px 16px 1px; }
@container (max-width: 560px) {
  .pp-sez { padding: 26px 18px; }
  .pp-testata { padding: 12px 18px; }
  .pp-col2, .pp-riquadri, .pp-recensioni { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .pp-titolo.L { font-size: 29px; } .pp-titolo.M { font-size: 23px; }
  .pp-galleria { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pp-btn { width: 100%; }
  .pp-testata .pp-btn { width: auto; min-height: 40px; font-size: 13px; padding: 0 14px; }
  .pp-form { padding: 18px 14px; }
  .pp-solo-computer { display: none !important; }
  .pp-el.pp-el-stretto { width: auto; }
}
`);

  /* ================= Disegno delle pagine (uguale in editor, anteprime e pagina pubblica) ================= */
  const NOMI = { intestazione: 'Intestazione', titolo: 'Titolo', testo: 'Testo', pulsante: 'Pulsante', immagine: 'Immagine', video: 'Video', modulo: 'Modulo', riquadri: 'Colonne', conto: 'Conto alla rovescia', faq: 'Domande frequenti', whatsapp: 'Pulsante WhatsApp', recensioni: 'Recensioni', mappa: 'Mappa', galleria: 'Galleria', divisore: 'Divisore' };
  const scuroSfondo = (sf) => sf === 'scuro' || sf === 'marchio';
  const coloreDa = (m, k) => ({ primario: m.primario, scuro: m.scuro, chiaro: '#FFFFFF', verde: '#1F4D3A', whatsapp: '#1B7F43' }[k] || (String(k || '').startsWith('#') ? k : m.primario));
  const testoSu = (hex) => {
    const h = String(hex).replace('#', '');
    if (h.length !== 6) return '#fff';
    const [r, g, b] = [0, 2, 4].map((i) => { const c = parseInt(h.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#1B1D1A' : '#FFFFFF';
  };
  function coloreTitolo(b, m) {
    const sc = scuroSfondo(b.sfondo);
    if (b.colore === 'chiaro') return sc ? '#FFFFFF' : '#1B1D1A';
    if (b.colore === 'scuro') return sc ? '#FFFFFF' : m.scuro;
    if (b.colore === 'primario' && b.sfondo === 'marchio') return '#FFFFFF';
    return coloreDa(m, b.colore);
  }
  function coloreBottone(b, m) {
    let c = coloreDa(m, b.colore);
    if (c === '#FFFFFF' && !scuroSfondo(b.sfondo)) c = m.scuro;
    if (b.colore === 'primario' && b.sfondo === 'marchio') c = '#FFFFFF';
    return c;
  }
  const raggio = (b) => Math.round(((b.arrotondamento == null ? 100 : b.arrotondamento) / 100) * 29) + 'px';
  function bottone(b, m, testo, o, tipo) {
    const bg = coloreBottone(b, m);
    const azione = o.modo === 'pubblica' ? ` data-azione="mk-pp-clic" data-tipo="${esc(tipo || b.azione || 'modulo')}" data-pagina="${o.paginaId || ''}"` : ' tabindex="-1"';
    return `<button type="button" class="pp-btn ${esc(b.dimensione || 'M')}" style="background:${bg};color:${testoSu(bg)};border-radius:${raggio(b)}"${azione}>${tipo === 'whatsapp' || b.tipo === 'whatsapp' ? R.icona('whatsapp', 18) : ''}${esc(testo)}</button>`;
  }

  function campoModulo(c, o, idForm) {
    const pub = o.modo === 'pubblica';
    const dis = pub ? '' : ' disabled';
    const id = idForm + '-' + c.id;
    const nome = ['nome', 'telefono', 'email', 'privacy', 'consensoWa', 'consensoEmail'].includes(c.tipo) ? c.tipo : 'c_' + c.id;
    const ob = c.obbligatorio ? ' *' : '';
    const lab = `<label for="${id}">${esc(c.domanda)}${ob}</label>`;
    switch (c.tipo) {
      case 'telefono': {
        const pref = ['+39', '+41', '+33', '+49', '+44', '+34', '+1'].map((p) => `<option ${p === '+39' ? 'selected' : ''}>${p}</option>`).join('');
        return `<div class="pp-grp" data-campo="telefono">${lab}<div class="pp-tel"><select class="pp-campo" name="prefisso" aria-label="Prefisso"${dis}>${pref}</select><input class="pp-campo" id="${id}" name="telefono" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="${esc(c.segnaposto || '')}"${dis}></div></div>`;
      }
      case 'email': return `<div class="pp-grp" data-campo="email">${lab}<input class="pp-campo" id="${id}" name="email" type="email" inputmode="email" autocomplete="email" placeholder="${esc(c.segnaposto || '')}"${dis}></div>`;
      case 'nome': return `<div class="pp-grp" data-campo="nome">${lab}<input class="pp-campo" id="${id}" name="nome" autocomplete="name" placeholder="${esc(c.segnaposto || '')}"${dis}></div>`;
      case 'tendina': case 'settore': case 'regione':
        return `<div class="pp-grp" data-campo="${nome}">${lab}<select class="pp-campo" id="${id}" name="${nome}"${dis}><option value="">${esc(c.segnaposto || 'Scegli')}</option>${(c.risposte || []).map((r) => `<option>${esc(r)}</option>`).join('')}</select></div>`;
      case 'scelta':
        return `<div class="pp-grp" data-campo="${nome}"><label>${esc(c.domanda)}${ob}</label><div class="pp-scelte">${(c.risposte || []).map((r, i) => `<label><input type="radio" name="${nome}" value="${esc(r)}" ${i === 1 && !pub ? 'checked' : ''}${dis}>${esc(r)}</label>`).join('')}</div></div>`;
      case 'data': return `<div class="pp-grp" data-campo="${nome}">${lab}<input class="pp-campo" id="${id}" name="${nome}" type="date"${dis}></div>`;
      case 'file': return `<div class="pp-grp" data-campo="${nome}">${lab}<input class="pp-campo" id="${id}" name="${nome}" type="file" style="padding-top:11px"${dis}><div class="pp-nota">File fino a 25 MB.</div></div>`;
      case 'privacy': case 'consensoWa': case 'consensoEmail':
        return `<div data-campo="${nome}"><label class="pp-check"><input type="checkbox" name="${nome}"${dis}><span>${esc(c.domanda)}${c.tipo === 'privacy' ? ' (<span style="text-decoration:underline">informativa</span>)' : ''}${ob}</span></label></div>`;
      case 'nascosto': return pub ? `<input type="hidden" name="${nome}" value="">` : `<div class="pp-nota" style="background:#EFE4F6;color:#45285C;border-radius:10px;padding:8px 12px">Campo nascosto: ${esc(c.domanda)}</div>`;
      default: return `<div class="pp-grp" data-campo="${nome}">${lab}<input class="pp-campo" id="${id}" name="${nome}" placeholder="${esc(c.segnaposto || '')}"${dis}></div>`;
    }
  }
  function htmlModulo(b, m, o) {
    const mo = modulo(b.modulo) || modulo('mo1');
    const idForm = 'f-' + b.id;
    const campi = mo.campi.map((c) => campoModulo(c, o, idForm)).join('');
    const haTel = mo.campi.some((c) => c.tipo === 'telefono');
    const haEmail = mo.campi.some((c) => c.tipo === 'email');
    return `<form class="pp-form" id="${idForm}" novalidate onsubmit="return false" data-modulo="${mo.id}">
      <h3 class="pp-h3">${esc(b.testo || mo.titolo)}</h3>${b.sotto ? `<p class="sotto">${esc(b.sotto)}</p>` : ''}
      ${campi}
      ${haTel && haEmail ? '<div class="pp-nota" style="margin:0 0 8px">Scrivi almeno il telefono o l\'email.</div>' : ''}
      <div style="margin-top:10px">${o.modo === 'pubblica'
        ? `<button type="submit" class="pp-btn ${esc(b.dimensione || 'M')}" style="width:100%;background:${coloreBottone(b, m)};color:${testoSu(coloreBottone(b, m))};border-radius:${raggio(b)}" data-azione="mk-pp-invia" data-pagina="${o.paginaId}" data-blocco="${b.id}">${esc(b.pulsante || mo.pulsante)}</button>`
        : `<span class="pp-btn ${esc(b.dimensione || 'M')}" style="width:100%;background:${coloreBottone(b, m)};color:${testoSu(coloreBottone(b, m))};border-radius:${raggio(b)}">${esc(b.pulsante || mo.pulsante)}</span>`}</div>
    </form>`;
  }

  function htmlBlocco(b, p, o, primoTitolo) {
    const m = p.marchio;
    switch (b.tipo) {
      case 'titolo': {
        const tag = primoTitolo ? 'h1' : 'h2';
        return `${b.etichetta ? `<span class="pp-etichetta">${esc(b.etichetta)}</span>` : ''}<${tag} class="pp-titolo ${esc(b.dimensione || 'M')}" style="color:${coloreTitolo(b, m)}">${esc(b.testo)}</${tag}>`;
      }
      case 'testo': return `<p class="pp-testo">${esc(b.testo)}</p>`;
      case 'pulsante': return bottone(b, m, b.testo, o);
      case 'immagine': return `${b.titolo ? `<h3 class="pp-h3">${esc(b.titolo)}</h3>` : ''}<div class="pp-img"><span>${esc(b.testo || 'Immagine')}</span></div>${b.sotto ? `<div class="pp-didascalia">${esc(b.sotto)}</div>` : ''}`;
      case 'video': return `${b.testo ? `<h3 class="pp-h3">${esc(b.testo)}</h3>` : ''}<button type="button" class="pp-video" ${o.modo === 'pubblica' ? 'data-azione="mk-pp-clic" data-tipo="video"' : 'tabindex="-1"'}><span><span class="play">${R.icona('play', 28)}</span><span style="font-size:13px;opacity:.8">Il video si carica quando lo tocchi</span></span></button>`;
      case 'modulo': return htmlModulo(b, m, o);
      case 'riquadri': return `<div class="pp-riquadri">${(b.voci || []).map((v) => `<div><b>${esc(v.t)}</b>${esc(v.s)}</div>`).join('')}</div>`;
      case 'conto': {
        const g = Math.max(0, +b.giorni || 0);
        return `${b.testo ? `<h3 class="pp-h3">${esc(b.testo)}</h3>` : ''}<div class="pp-conto"><div><b>${g}</b>giorni</div><div><b>07</b>ore</div><div><b>42</b>minuti</div><div><b>10</b>secondi</div></div>`;
      }
      case 'faq': return `${b.testo ? `<h3 class="pp-h3">${esc(b.testo)}</h3>` : ''}<div class="pp-faq">${(b.voci || []).map((v, i) => `<details ${i === 0 && o.modo !== 'pubblica' ? 'open' : ''}><summary>${esc(v.d)}</summary><p>${esc(v.r)}</p></details>`).join('')}</div>`;
      case 'whatsapp': return `<div class="pp-wa">${b.testo ? `<p class="pp-testo">${esc(b.testo)}</p>` : ''}${bottone(Object.assign({}, b, { colore: b.colore || 'whatsapp' }), m, b.pulsante || 'Scrivici su WhatsApp', o, 'whatsapp')}</div>`;
      case 'recensioni': return `${b.testo ? `<h3 class="pp-h3">${esc(b.testo)}</h3>` : ''}<div class="pp-recensioni">${(b.voci || []).map((v) => `<div><div style="color:#C98A00">${R.icona('stella', 16).repeat(5)}</div><p style="margin:6px 0">${esc(v.t)}</p><b>${esc(v.n)}</b></div>`).join('')}</div>`;
      case 'mappa': return `${b.testo ? `<h3 class="pp-h3">${esc(b.testo)}</h3>` : ''}<div class="pp-mappa"><div>${R.icona('mappa', 30)}<div style="margin-top:6px;font-weight:600">${esc(b.sotto || 'Indirizzo')}</div><div class="pp-nota">La mappa si carica quando la tocchi</div></div></div>`;
      case 'galleria': return `${b.testo ? `<h3 class="pp-h3">${esc(b.testo)}</h3>` : ''}<div class="pp-galleria">${(b.voci || []).map((v) => `<div><span class="pp-etichetta" style="margin:0">${esc(v)}</span></div>`).join('')}</div>`;
      case 'divisore': return '<hr class="pp-hr">';
      default: return '';
    }
  }

  function barretta(b, o) {
    if (o.solo) return '';
    return `<span class="mk-barretta" role="toolbar" aria-label="Azioni sull'elemento"><b>${NOMI[b.tipo] || ''}${b.telefono ? '' : ' · nascosto sul telefono'}</b><button type="button" data-azione="mk-ed-sposta" data-id="${b.id}" data-verso="-1" aria-label="Sposta su">${R.icona('su', 14)}</button><button type="button" data-azione="mk-ed-sposta" data-id="${b.id}" data-verso="1" aria-label="Sposta giù">${R.icona('giu', 14)}</button><button type="button" class="dup" data-azione="mk-ed-duplica" data-id="${b.id}">Duplica</button><button type="button" class="eli" data-azione="mk-ed-elimina" data-id="${b.id}">Elimina</button></span>`;
  }

  /* o: { modo: 'editor' | 'anteprima' | 'pubblica', sel, disp, blocchi, paginaId, solo (telefono: niente barretta) } */
  function htmlPagina(p, o) {
    o = Object.assign({ modo: 'anteprima' }, o || {});
    const blocchi = o.blocchi || p.blocchi;
    const m = p.marchio;
    const editor = o.modo === 'editor';
    let primoTitolo = true;
    const avvolgi = (b, interno, classeExtra) => {
      const sel = editor && o.sel === b.id;
      const cls = ['pp-el', classeExtra || (b.tipo === 'pulsante' ? 'pp-el-stretto' : ''), sel ? 'sel' : '', !b.telefono && editor && o.disp === 'telefono' ? 'nascosto-tel' : '', !b.telefono && !editor ? 'pp-solo-computer' : ''].join(' ');
      const attr = editor ? ` data-azione="mk-ed-seleziona" data-id="${b.id}"` : '';
      return `<div class="${cls}"${attr} id="${editor ? 'el-' : 'pp-'}${b.id}">${sel ? (o.solo ? `<span class="pp-cartello">${NOMI[b.tipo] || ''}${b.telefono ? '' : ' · nascosto sul telefono'}</span>` : barretta(b, o)) : ''}${interno}</div>`;
    };
    const r = (b) => { const h = htmlBlocco(b, p, o, b.tipo === 'titolo' && primoTitolo); if (b.tipo === 'titolo') primoTitolo = false; return avvolgi(b, h); };
    let html = '';
    let i = 0;
    while (i < blocchi.length) {
      const b = blocchi[i];
      if (b.tipo === 'intestazione') {
        const logo = m.logoAzienda ? `<span class="marchio-img" style="background:${m.primario}">${esc((R.azienda() || {}).iniziale || 'i')}</span>${esc((R.azienda() || {}).nome || b.testo)}` : esc(b.testo || 'logo');
        const bt = bottone(Object.assign({}, b, { dimensione: 'S', arrotondamento: 100, sfondo: 'bianco' }), m, b.pulsante || 'WhatsApp', o, 'whatsapp');
        html += avvolgi(b, `<header class="pp-testata"><div class="pp-logo">${logo}</div>${b.pulsante ? bt : ''}</header>`, 'pp-intestazione');
        i++;
        continue;
      }
      const sf = b.sfondo || 'bianco';
      const gruppo = [];
      while (i < blocchi.length && blocchi[i].tipo !== 'intestazione' && (blocchi[i].sfondo || 'bianco') === sf) gruppo.push(blocchi[i++]);
      let dentro = '';
      let j = 0;
      while (j < gruppo.length) {
        if (gruppo[j].colonna) {
          const sx = []; const dx = [];
          while (j < gruppo.length && gruppo[j].colonna) { (gruppo[j].colonna === 'dx' ? dx : sx).push(gruppo[j]); j++; }
          dentro += `<div class="pp-col2 pp-el-col"><div>${sx.map(r).join('')}</div><div>${dx.map(r).join('')}</div></div>`;
        } else dentro += r(gruppo[j++]);
      }
      html += `<section class="pp-sez ${sf}"><div class="pp-dentro">${dentro}</div></section>`;
    }
    if (!blocchi.length) html = `<div class="mk-costruzione">${o.vuoto || 'Pagina vuota. Aggiungi un elemento dalla colonna a sinistra.'}</div>`;
    const piede = o.modo === 'pubblica' ? `<footer class="pp-piede">${esc((R.azienda() || {}).nome || '')} · <button type="button" class="link" style="font-size:12.5px;color:inherit" data-azione="mk-pp-clic" data-tipo="privacy">Informativa privacy</button> · <button type="button" class="link" style="font-size:12.5px;color:inherit" data-azione="mk-pp-clic" data-tipo="cookie">Cookie</button></footer>` : '';
    const stile = `--pp-primario:${m.primario};--pp-scuro:${m.scuro};--pp-tenue:${m.tenue};--pp-immagine:${m.immagine}`;
    return `<div class="pp ${editor ? 'pp-modo-editor' : ''}" style="${stile}">${html}${piede}</div>`;
  }

  /* Anteprima colorata in piccolo (elenco funnel e pagine del funnel) */
  function anteprima(p, mini) {
    const cls = mini ? 'mini' : 'mk-anteprima';
    if (!p) return `<div class="${cls}" style="background:#EDEAE3"></div>`;
    const m = p.marchio;
    const bl = (p.blocchi.length ? p.blocchi : (p.pubblicati || [])).filter((b) => b.tipo !== 'intestazione');
    const prima = bl[0];
    const sf = prima ? prima.sfondo : 'bianco';
    const bg = { scuro: m.scuro, marchio: m.primario, tenue: m.tenue, bianco: '#F5F3EF' }[sf] || '#F5F3EF';
    const sc = scuroSfondo(sf);
    const tit = bl.find((b) => b.tipo === 'titolo');
    const btn = bl.find((b) => b.tipo === 'pulsante' || b.tipo === 'whatsapp' || b.tipo === 'modulo');
    const cT = tit ? coloreTitolo(tit, m) : (sc ? '#fff' : '#1B1D1A');
    const cB = btn ? coloreBottone(btn, m) : m.primario;
    const foto = bl.some((b) => b.colonna === 'dx' && b.tipo === 'immagine' && b.sfondo === sf);
    const k = foto ? 0.62 : 1;
    const cl = sc ? 'rgba(255,255,255,.9)' : 'rgba(27,29,26,.55)';
    return `<div class="${cls}" style="background:${bg}" aria-hidden="true"><i style="width:${14 * k}%;background:${cB}"></i><i style="width:${73 * k}%;background:${cT}"></i><i style="width:${59 * k}%;background:${cl}"></i><i style="width:${50 * k}%;background:${cl}"></i>${foto ? `<span class="foto" style="background:${sc ? 'rgba(255,255,255,.92)' : m.immagine}"></span>` : ''}<span class="bott" style="background:${cB}"></span></div>`;
  }

  /* ================= Barra Marketing ================= */
  const VOCI_MK = [
    ['funnel', 'Funnel e pagine'], ['siti', 'Siti web'], ['moduli', 'Moduli'], ['sondaggi', 'Sondaggi'], ['blog', 'Blog'],
    ['email', 'Email marketing'], ['libreria', 'Libreria file'], ['domini', 'Domini'],
  ];
  const barraMk = (attiva) => `<nav class="mk-barra" aria-label="Sezioni di Marketing">${VOCI_MK.map(([id, t]) => `<a href="#/marketing/${id}" class="${id === attiva ? 'attivo' : ''}"${id === attiva ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
  const aggiornaIndirizzo = (f) => { f.indirizzo = f.dominio + '/' + f.percorsoPagina; };
  const segnaModifica = (f) => { if (f) f.ultimaModifica = { chi: R.utente().id, quando: R.adesso() }; };

  function creaFunnel(o) {
    const id = R.id('fu');
    let base = slug(o.nome);
    while (R.stato.funnel.some((f) => f.percorsoPagina === base)) base += '-2';
    const f = { id, nome: o.nome, cartella: o.cartella || 'Finanza agevolata', stato: 'bozza', dominio: sottodominio(), percorsoPagina: base, visite: 0, contatti: 0, automazione: 'au1', modulo: 'mo1', campagna: o.nome, linkCorto: '', pixel: false, analytics: false };
    aggiornaIndirizzo(f);
    segnaModifica(f);
    R.stato.funnel.push(f);
    const marchio = Object.assign({}, MARCHI[o.marchio || 'verde']);
    const pg = { id: R.id('pg'), funnel: id, ordine: 1, nome: 'Pagina principale', sotto: '', tipo: 'principale', marchio, blocchi: o.blocchi || [], pubblicati: null, salvato: R.adesso(), chat: [], ab: null };
    const pgG = { id: R.id('pg'), funnel: id, ordine: 2, nome: 'Grazie, ti chiamiamo noi', sotto: 'grazie', tipo: 'grazie', marchio: Object.assign({}, marchio), blocchi: paginaGrazie(), pubblicati: null, salvato: R.adesso(), chat: [], ab: null };
    R.stato.pagine.push(pg, pgG);
    R.salva();
    return { f, pg };
  }

  /* ================= Elenco funnel (immagine 13) ================= */
  R.rotta('/marketing/funnel', {
    menu: 'marketing',
    titolo: 'Funnel e pagine',
    disegna() {
      assicura();
      const fl = R.stato.filtri || (R.stato.filtri = {});
      const tutti = R.stato.funnel.filter((f) => !f.eliminato);
      const filtro = fl.mkCartella || 'tutti';
      const cerca = (fl.mkCerca || '').toLowerCase();
      const cartelle = [...new Set(tutti.map((f) => f.cartella || 'Senza cartella'))];
      const bozze = tutti.filter((f) => f.stato === 'bozza').length;
      const visibili = tutti.filter((f) => filtro === 'tutti' || (filtro === 'bozze' ? f.stato === 'bozza' : (f.cartella || 'Senza cartella') === filtro));
      const visite = tutti.reduce((s, f) => s + (f.visite || 0), 0);
      const contatti = tutti.reduce((s, f) => s + (f.contatti || 0), 0);
      const pill = (val, testo) => `<button class="pillola ${filtro === val ? 'attiva' : ''}" data-azione="mk-filtro-funnel" data-valore="${esc(val)}">${testo}</button>`;
      const card = (f) => {
        const conv = f.visite ? (f.contatti / f.visite) * 100 : 0;
        const numeri = f.stato === 'bozza'
          ? `<div class="secondario" style="margin-top:14px;font-size:13px">Ultima modifica: ${f.ultimaModifica ? esc(R.giornoRelativo(f.ultimaModifica.quando) + ', ' + R.utenteDa(f.ultimaModifica.chi).breve) : 'mai'}</div>`
          : `<div class="mk-numeri"><div><span>Visite</span><b>${num(f.visite || 0)}</b></div><div><span>Contatti</span><b>${num(f.contatti || 0)}</b></div><div><span>Conversione</span><b style="color:${conv >= 5 ? 'var(--verde)' : conv < 3 ? 'var(--errore-t)' : 'inherit'}">${percento(f.contatti || 0, f.visite || 0)}</b></div></div>`;
        const nasc = cerca && !f.nome.toLowerCase().includes(cerca) ? ' hidden' : '';
        return `<a class="mk-card" href="#/marketing/funnel/${f.id}" style="text-decoration:none" data-nome="${esc(f.nome.toLowerCase())}"${nasc}>${anteprima(principale(f.id))}<div class="mk-card-info"><div class="mk-card-nome"><b>${esc(f.nome)}</b>${etichettaStato(f)}</div><div class="mk-url">${esc(f.dominio + '/' + f.percorsoPagina)}</div>${numeri}</div></a>`;
      };
      return `${barraMk('funnel')}
        <div class="testata">
          <div><div class="sopratitolo">${tutti.length} funnel · ${num(visite)} visite e ${num(contatti)} contatti questo mese</div><h1 class="titolo-pagina">Funnel e pagine</h1><div class="spiegazione">Le pagine che raccolgono contatti, in ordine di visita. Da qui le crei, le modifichi e le pubblichi.</div></div>
          <div class="azioni-testata">
            <div class="ricerca mk-cerca">${R.icona('cerca')}<input class="campo" type="search" placeholder="Cerca un funnel" aria-label="Cerca un funnel" value="${esc(fl.mkCerca || '')}" data-digita="mk-cerca-funnel"></div>
            <button class="btn lavanda" data-azione="mk-crea-ai">${R.icona('stelline', 16)} Crea con l'AI</button>
            <button class="btn primario" data-azione="mk-nuovo-funnel">${R.icona('piu', 16)} Nuovo funnel</button>
          </div>
        </div>
        <div class="pillole spazio-sotto">${pill('tutti', 'Tutti')}${cartelle.map((c) => pill(c, esc(c) + ' · ' + tutti.filter((f) => (f.cartella || 'Senza cartella') === c).length)).join('')}${bozze ? pill('bozze', 'Bozze · ' + bozze) : ''}</div>
        <div class="mk-griglia-funnel" id="mk-griglia-funnel">
          ${visibili.map(card).join('')}
          <button class="riquadro tratteggiato mk-nuovo" data-azione="mk-nuovo-funnel"><span class="tondo-bianco">${R.icona('piu', 22)}</span><span class="grassetto" style="font-size:15px">Nuovo funnel</span><span class="piccolo secondario">da zero, da un modello o con l'AI</span></button>
        </div>
        <div class="riquadro vuoto spazio-sopra" id="mk-nessun-funnel" ${visibili.some((f) => !cerca || f.nome.toLowerCase().includes(cerca)) ? 'hidden' : ''}>Nessun funnel con questo nome. Prova un'altra parola oppure <button class="link verde" data-azione="mk-nuovo-funnel">crea un nuovo funnel</button>.</div>`;
    },
  });
  R.azioni['mk-filtro-funnel'] = (el) => { R.stato.filtri.mkCartella = el.dataset.valore; R.salva(); R.aggiorna(); };
  R.azioni['mk-cerca-funnel'] = (el) => {
    const q = el.value.trim().toLowerCase();
    R.stato.filtri.mkCerca = el.value; R.salva();
    let n = 0;
    document.querySelectorAll('#mk-griglia-funnel .mk-card').forEach((c) => { const ok = !q || c.dataset.nome.includes(q); c.hidden = !ok; if (ok) n++; });
    const v = document.getElementById('mk-nessun-funnel');
    if (v) v.hidden = n > 0;
  };

  R.azioni['mk-nuovo-funnel'] = () => R.modale({
    titolo: 'Nuovo funnel',
    sottotitolo: 'Scegli come vuoi partire. Potrai cambiare tutto dopo: nasce in bozza e va online solo quando premi Pubblica.',
    corpo: `<button class="opzione" data-azione="mk-nuovo-da" data-come="ai"><span class="quadratino lavanda">${R.icona('stelline')}</span><span class="principale"><b>Con l'AI</b><span class="sotto">Descrivi la pagina con parole tue: l'AI la costruisce, tu la ritocchi.</span></span>${R.icona('destra', 16)}</button>
      <button class="opzione" data-azione="mk-nuovo-da" data-come="modello"><span class="quadratino cielo">${R.icona('griglia')}</span><span class="principale"><b>Da un modello</b><span class="sotto">Pagine pronte per bandi, raccolta contatti e video.</span></span>${R.icona('destra', 16)}</button>
      <button class="opzione" data-azione="mk-nuovo-da" data-come="zero"><span class="quadratino salvia">${R.icona('pagina')}</span><span class="principale"><b>Da zero</b><span class="sotto">Una pagina semplice con intestazione, titolo, testo e modulo.</span></span>${R.icona('destra', 16)}</button>`,
  });
  const MODELLI = {
    bando: { nome: 'Bando con modulo e domande frequenti', sotto: 'Apertura scura, esempio, modulo, WhatsApp, domande, mappa e galleria', marchio: 'rosso', blocchi: () => pagineZes() },
    contatti: { nome: 'Raccolta contatti semplice', sotto: 'Titolo, tre vantaggi e modulo', marchio: 'verde', blocchi: () => pagineMicrocredito() },
    video: { nome: 'Pagina con video', sotto: 'Titolo, video, pulsante e modulo', marchio: 'blu', blocchi: () => [nuovoBlocco('intestazione', { testo: 'inizio', pulsante: 'WhatsApp', colore: 'whatsapp' }), nuovoBlocco('titolo', { sfondo: 'marchio', testo: 'Guarda come funziona in 2 minuti', colore: 'chiaro', dimensione: 'L' }), nuovoBlocco('video', { sfondo: 'marchio', testo: '' }), nuovoBlocco('pulsante', { sfondo: 'marchio', testo: 'Voglio saperne di più', colore: 'chiaro' }), nuovoBlocco('modulo', { sfondo: 'tenue', modulo: 'mo3', testo: 'Lascia i tuoi dati', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Invia' })] },
  };
  R.azioni['mk-nuovo-da'] = (el) => {
    const come = el.dataset.come;
    if (come === 'ai') { R.azioni['mk-crea-ai'](); return; }
    if (come === 'modello') {
      R.modale({ titolo: 'Scegli un modello', sottotitolo: 'I testi sono di esempio: li cambi nell\'editor.', corpo: Object.keys(MODELLI).map((k) => `<button class="opzione" data-azione="mk-nome-funnel" data-modello="${k}"><span class="quadratino cielo">${R.icona('pagina')}</span><span class="principale"><b>${MODELLI[k].nome}</b><span class="sotto">${MODELLI[k].sotto}</span></span>${R.icona('destra', 16)}</button>`).join('') });
      return;
    }
    R.azioni['mk-nome-funnel']({ dataset: {} });
  };
  R.azioni['mk-nome-funnel'] = (el) => {
    const mod = MODELLI[el.dataset.modello];
    const cartelle = [...new Set(R.stato.funnel.map((f) => f.cartella).filter(Boolean))];
    R.modale({
      titolo: 'Come si chiama il funnel?',
      sottotitolo: mod ? 'Modello: ' + mod.nome : 'Partirai da una pagina semplice.',
      classe: 'stretta',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-nf-nome">Nome</label><input class="campo" id="mk-nf-nome" name="nome" placeholder="es. Bonus assunzioni 2026"></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-nf-cartella">Cartella</label><select class="campo" id="mk-nf-cartella" name="cartella">${cartelle.map((c) => `<option>${esc(c)}</option>`).join('')}<option>Marketing</option></select></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Crea e apri l\'editor', classe: 'primario', fai(f) {
          const v = R.valori(f);
          if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome del funnel.'); return false; }
          const blocchi = mod ? mod.blocchi() : [nuovoBlocco('intestazione', { testo: 'inizio', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' }), nuovoBlocco('titolo', { sfondo: 'scuro', testo: v.nome, colore: 'chiaro', dimensione: 'L' }), nuovoBlocco('testo', { sfondo: 'scuro', testo: 'Scrivi qui in due righe cosa offri e a chi.' }), nuovoBlocco('pulsante', { sfondo: 'scuro', testo: 'Richiedi informazioni', colore: 'primario' }), nuovoBlocco('modulo', { sfondo: 'tenue', modulo: 'mo3', testo: 'Lascia i tuoi dati', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Invia' })];
          const { f: nuovo, pg } = creaFunnel({ nome: v.nome, cartella: v.cartella, marchio: mod ? mod.marchio : 'verde', blocchi });
          R.vai('#/editor/' + pg.id);
          R.avviso(`Funnel "${esc(nuovo.nome)}" creato in bozza`);
        },
      }],
    });
  };

  /* ---------- Percorso 9: crea con l'AI ---------- */
  const ESEMPIO_AI = { nome: 'Bonus giovani Campania', descrizione: 'Crea una landing per Resto al Sud 2.0, per giovani fino a 35 anni in Campania. Voglio un modulo, il pulsante WhatsApp e le domande frequenti. Colori blu e bianco.' };
  R.azioni['mk-crea-ai'] = () => R.modale({
    titolo: 'Descrivi la pagina',
    sottotitolo: 'Scrivi con parole tue a chi si rivolge, cosa offri e cosa deve fare il visitatore. L\'AI prepara una prima versione in bozza, poi la ritocchi.',
    proteggi: true,
    corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-ai-nome">Nome della pagina</label><input class="campo" id="mk-ai-nome" name="nome" placeholder="es. Bonus giovani Campania"></div>
      <div class="gruppo-campo"><label class="etichetta-campo" for="mk-ai-desc">Cosa deve contenere</label><textarea class="campo" id="mk-ai-desc" name="descrizione" rows="4" placeholder="es. Landing per giovani under 35 che vogliono aprire un'attività: modulo, WhatsApp e domande frequenti. Colori blu e bianco."></textarea></div>
      <div class="riga-flex"><button class="btn piccolo lavanda" data-azione="mk-ai-esempio">${R.icona('stelline', 15)} Usa un esempio</button><span class="piccolo secondario">L'AI non riceve i dati dei tuoi contatti. Oggi puoi usarla ancora 48 volte.</span></div>`,
    pulsanti: [{ testo: 'Annulla', chiudi: true }, {
      testo: 'Crea la pagina', classe: 'primario', fai(f) {
        const v = R.valori(f);
        if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome della pagina.'); return false; }
        if (v.descrizione.length < 15) { R.erroreCampo(f, 'descrizione', 'Descrivi la pagina in almeno una frase: a chi si rivolge e cosa offri.'); return false; }
        if (!R.serveConnessione('la creazione con l\'AI')) return false;
        const d = v.descrizione.toLowerCase();
        const marchio = /\bblu|azzurr/.test(d) ? 'blu' : /\brosso|rossa/.test(d) ? 'rosso' : 'verde';
        const { pg } = creaFunnel({ nome: v.nome, cartella: /marketing|ristorant|evento/.test(d) ? 'Marketing' : 'Finanza agevolata', marchio, blocchi: [] });
        pg.costruisci = v.descrizione;
        pg.chat = [{ da: 'tu', testo: v.descrizione }];
        R.salva();
        R.vai('#/editor-ai/' + pg.id);
      },
    }],
  });
  R.azioni['mk-ai-esempio'] = () => {
    const f = R.modaleAperta();
    if (!f) return;
    f.querySelector('[name=nome]').value = ESEMPIO_AI.nome;
    f.querySelector('[name=descrizione]').value = ESEMPIO_AI.descrizione;
  };

  /* ---------- Siti web, Sondaggi, Blog: non nel prototipo ---------- */
  [['siti', 'Siti web', 'Siti a più pagine con menu.', 'globo'], ['sondaggi', 'Sondaggi', 'Sondaggi e quiz a più passaggi, con le risposte salvate nei campi del contatto.', 'domanda'], ['blog', 'Blog', 'Articoli, categorie e impostazioni per Google.', 'nota']].forEach(([id, nome, spieg, icona]) => R.rotta('/marketing/' + id, {
    menu: 'marketing',
    titolo: nome,
    disegna: () => `${barraMk(id)}<div class="testata"><div><div class="sopratitolo">Marketing</div><h1 class="titolo-pagina">${nome}</h1><div class="spiegazione">${spieg}</div></div></div>
      <div class="riquadro mk-placeholder"><span class="quadratino lavanda">${R.icona(icona)}</span><div class="titolo-riquadro piccolo" style="margin:0">Questa sezione non è nel prototipo</div><p style="margin:0" class="secondario">Esisterà nel software vero, con lo stesso editor delle pagine.</p><a class="btn secondario-campo" href="#/marketing/funnel">Vai a Funnel e pagine</a></div>`,
  }));

  /* ================= Dettaglio funnel (immagine 14) ================= */
  const uguali = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const linkAnteprima = (p) => (funnel(p.funnel).stato === 'online' && p.pubblicati && uguali(p.blocchi, p.pubblicati) ? percorsoPubblico(p) : percorsoPubblico(p) + '?anteprima=1');
  function catena(f) {
    const mo = modulo(f.modulo) || modulo('mo1');
    const d = mo.dopo;
    const perc = R.percorso(d.percorso) || { nome: '—' };
    const fase = R.fase(d.percorso, d.fase) || { nome: '—' };
    const aut = (R.stato.automazioni || []).find((a) => a.id === f.automazione);
    const anelli = [
      `Entra in <b>Affari · ${esc(perc.nome)} · ${esc(fase.nome)}</b>`,
      `Assegnato <b>${d.responsabile === 'turno' ? 'a turno' : 'a ' + esc(R.utenteDa(d.fisso).breve)}</b>`,
    ];
    if (aut) anelli.push('WhatsApp di benvenuto <b>subito</b>', 'Brochure <b>dopo 2 minuti</b>');
    if (d.promemoria) anelli.push(`Promemoria: richiamare <b>entro ${d.ore || 1} ${(+d.ore || 1) === 1 ? 'ora' : 'ore'}</b>`);
    return { html: anelli.map((a, i) => (i ? '<span class="sep" aria-hidden="true">→</span>' : '') + `<span class="mk-anello">${a}</span>`).join(''), aut, mo };
  }

  R.rotta('/marketing/funnel/:id', {
    menu: 'marketing',
    titolo: (p) => (funnel(p.id) || {}).nome || 'Funnel',
    disegna(par, q) {
      assicura();
      const f = funnel(par.id);
      if (!f || f.eliminato) return `${barraMk('funnel')}<div class="riquadro vuoto spazio-sopra">Questo funnel non esiste più. <a class="link verde" href="#/marketing/funnel">Torna a Funnel e pagine</a></div>`;
      const scheda = q.scheda || 'pagine';
      const pagine = pagineDi(f.id);
      const generale = R.utente().ruolo === 'generale';
      const copie = (R.stato.copieFunnel || []).filter((c) => c.funnel === f.id);
      const url = f.stato === 'online'
        ? `<a class="link verde" style="font-weight:500;font-size:14px;text-decoration:none" href="${percorsoPubblico(pagine[0])}">${esc(f.indirizzo)} ${R.icona('freccia', 13)}</a>`
        : `<span class="secondario" style="font-size:14px">${esc(f.indirizzo)} · ${f.stato === 'pausa' ? 'in pausa: chi apre l\'indirizzo vede un messaggio neutro' : 'non ancora online'}</span>`;
      const tab = (id, t) => `<button class="${scheda === id ? 'attivo' : ''}" data-azione="vai" data-dove="#/marketing/funnel/${f.id}${id === 'pagine' ? '' : '?scheda=' + id}">${t}</button>`;
      let corpo = '';
      if (scheda === 'pagine') {
        const c = catena(f);
        const card = (p, i) => {
          const tipo = p.tipo === 'grazie' ? 'Pagina di ringraziamento' : i === 0 ? 'Pagina principale' : 'Pagina';
          const stat = p.tipo === 'principale' && f.visite
            ? `${num(f.visite)} visite · ${num(f.contatti)} moduli · ${percento(f.contatti, f.visite)}`
            : p.tipo === 'grazie' ? (p.blocchi.some((b) => b.tipo === 'whatsapp') ? 'con il pulsante "Scrivici su WhatsApp"' : 'dopo l\'invio del modulo') : 'ancora nessuna visita';
          const modifiche = p.pubblicati && !uguali(p.blocchi, p.pubblicati) ? '<span class="etichetta pesca" style="margin-top:6px">Modifiche non pubblicate</span>' : '';
          return `${i ? `<span class="mk-freccia" aria-hidden="true">${R.icona('freccia', 22)}</span>` : ''}<div class="mk-pag">${anteprima(p, true)}<div style="min-width:0"><div class="piccolo secondario">${i + 1} · ${tipo}</div><div class="grassetto" style="font-size:16px;margin:2px 0">${esc(p.nome)}</div><div class="piccolo" style="color:var(--verde-2)">/${esc(f.percorsoPagina + (p.sotto ? '/' + p.sotto : ''))}</div><div class="piccolo secondario">${stat}</div>${modifiche}
            <div class="riga-flex" style="margin-top:12px;gap:6px"><a class="btn piccolo primario" href="#/editor/${p.id}">Modifica</a><a class="btn piccolo" href="${linkAnteprima(p)}">Anteprima</a>${p.tipo === 'principale' ? `<button class="btn piccolo lavanda" data-azione="mk-ab" data-id="${p.id}">Prova A/B${p.ab && p.ab.attiva ? ' · in corso' : ''}</button>` : ''}</div></div></div>`;
        };
        corpo = `<div class="riquadro"><h2 class="titolo-riquadro">Le pagine, in ordine</h2><div class="mk-pagine">${pagine.map(card).join('')}<button class="mk-aggiungi" data-azione="mk-aggiungi-pagina" data-id="${f.id}">+ Aggiungi pagina</button></div></div>
          <div class="mk-due spazio-sopra">
            <div class="riquadro scuro"><div class="intestazione-riquadro" style="flex-wrap:wrap"><h2 class="titolo-riquadro">Quando qualcuno compila il modulo</h2>${c.aut ? `<a class="link" style="color:var(--lime)" href="#/automazioni/${c.aut.id}">Modifica automazione</a>` : `<a class="link" style="color:var(--lime)" href="#/automazioni">Collega un'automazione</a>`}</div>
              <div class="mk-catena">${c.html}</div>
              <div class="piccolo spazio-sopra" style="opacity:.8">Modulo: ${esc(c.mo.nome)} · <a class="link" style="color:var(--scuro-t)" href="#/marketing/moduli/${c.mo.id}">cambia dove va il contatto</a>${c.aut ? ' · Automazione: ' + esc(c.aut.nome) : ''}</div></div>
            <div class="riquadro"><h2 class="titolo-riquadro">Indirizzo e collegamenti</h2>
              <label class="mk-riga-ind"><span>Dominio</span><select data-cambia="mk-funnel-dominio" data-id="${f.id}" aria-label="Dominio">${[sottodominio()].concat(R.stato.domini.filter((d) => d.stato !== 'rosso' && d.id !== 'do2').map((d) => d.nome)).map((d) => `<option value="${esc(d)}" ${d === f.dominio ? 'selected' : ''}>${esc(d)}${d === sottodominio() ? ' (gratuito)' : ''}</option>`).join('')}</select></label>
              <button class="mk-riga-ind" data-azione="mk-funnel-percorso" data-id="${f.id}"><span>Indirizzo della pagina</span><b>/${esc(f.percorsoPagina)}</b></button>
              <div class="mk-riga-ind"><span>Sottodominio gratuito</span><b>${esc(sottodominio())}/${esc(f.percorsoPagina)}</b></div>
              <button class="mk-riga-ind" data-azione="mk-funnel-codice" data-id="${f.id}" data-cosa="pixel"><span>Pixel di Facebook</span><b class="${f.pixel ? 'verde' : ''}">${f.pixel ? 'Collegato' : 'Collega'}</b></button>
              <button class="mk-riga-ind" data-azione="mk-funnel-codice" data-id="${f.id}" data-cosa="analytics"><span>Google Analytics</span><b class="${f.analytics ? 'verde' : ''}">${f.analytics ? 'Collegato' : 'Collega'}</b></button>
              <button class="mk-riga-ind" data-azione="mk-funnel-link" data-id="${f.id}"><span>Link corto</span><b>${f.linkCorto ? esc(f.linkCorto) : 'Crea'}</b></button>
              <div class="piccolo secondario" style="margin:4px 4px 0">Pixel e Google Analytics partono solo dopo il consenso ai cookie del visitatore.</div>
            </div>
          </div>`;
      } else if (scheda === 'statistiche') {
        const giorni = [38, 52, 41, 66, 58, 71, 49].map((v) => Math.round(v * (f.visite || 0) / 2340));
        const max = Math.max(1, ...giorni);
        corpo = `<div class="griglia g-3"><div class="riquadro"><div class="etichetta-numero">Visite</div><div class="numero-medio">${num(f.visite || 0)}</div></div><div class="riquadro"><div class="etichetta-numero">Contatti dal modulo</div><div class="numero-medio">${num(f.contatti || 0)}</div></div><div class="riquadro salvia"><div class="etichetta-numero">Conversione</div><div class="numero-medio">${percento(f.contatti || 0, f.visite || 0)}</div></div></div>
          <div class="riquadro spazio-sopra"><h2 class="titolo-riquadro piccolo">Visite negli ultimi 7 giorni</h2>${f.visite ? `<div class="barre">${giorni.map((g, i) => `<span class="${i === 6 ? 'ultima' : ''}" style="height:${Math.max(6, g / max * 100)}%" title="${g} visite"></span>`).join('')}</div>` : '<div class="vuoto">Ancora nessuna visita. Pubblica la pagina e condividi il link per vedere i numeri.</div>'}</div>`;
      } else if (scheda === 'google') {
        const p = pagine[0];
        corpo = `<div class="riquadro" style="max-width:760px"><h2 class="titolo-riquadro">Google e social</h2><p class="secondario" style="margin-top:-6px">Come appare la pagina nelle ricerche e quando la condividi su WhatsApp o Facebook.</p>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-g-tit">Titolo per Google</label><input class="campo" id="mk-g-tit" data-digita="mk-funnel-seo" data-id="${f.id}" data-cosa="seoTitolo" value="${esc(f.seoTitolo || f.nome + ' · ' + (R.azienda().nome))}"></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-g-desc">Descrizione</label><textarea class="campo" id="mk-g-desc" data-digita="mk-funnel-seo" data-id="${f.id}" data-cosa="seoDescrizione">${esc(f.seoDescrizione || (p && (p.blocchi.find((b) => b.tipo === 'testo') || {}).testo) || '')}</textarea></div>
          <div class="riga-flex"><span class="quadratino cielo">${R.icona('immagine')}</span><span class="principale secondario" style="flex:1">Immagine per i social: la prima immagine della pagina</span><span class="stato-salvataggio" id="mk-seo-salv"></span></div></div>`;
      } else {
        const tog = (k, t, sotto) => `<div class="riga-impostazione"><span>${t}${sotto ? `<span class="piccolo secondario" style="display:block">${sotto}</span>` : ''}</span><label class="interruttore"><input type="checkbox" data-cambia="mk-funnel-opzione" data-id="${f.id}" data-cosa="${k}" ${f[k] !== false && (f[k] || k !== 'chat') ? 'checked' : ''} aria-label="${t}"><span></span></label></div>`;
        corpo = `<div class="griglia g-2"><div class="riquadro"><h2 class="titolo-riquadro">Impostazioni</h2>
            <div class="gruppo-campo"><label class="etichetta-campo" for="mk-imp-nome">Nome del funnel</label><input class="campo" id="mk-imp-nome" data-digita="mk-funnel-seo" data-id="${f.id}" data-cosa="nome" value="${esc(f.nome)}"></div>
            ${tog('cookie', 'Banner cookie', 'Pixel e statistiche partono solo dopo il consenso')}${tog('privacy', 'Pagina privacy', 'Collegata in fondo a ogni pagina')}${tog('chat', 'Chat sul sito', 'Chiede nome e telefono o email all\'inizio')}
            <span class="stato-salvataggio" id="mk-seo-salv"></span></div>
          <div class="riquadro"><h2 class="titolo-riquadro">Stato</h2><p class="secondario" style="margin-top:-6px">${f.stato === 'online' ? 'Il funnel è online. Se lo metti in pausa, chi apre l\'indirizzo vede un messaggio neutro.' : f.stato === 'pausa' ? 'Il funnel è in pausa.' : 'Il funnel è in bozza: va online quando pubblichi una pagina.'}</p>
            ${f.stato === 'online' ? `<button class="btn secondario-campo" data-azione="mk-funnel-pausa" data-id="${f.id}">${R.icona('pausa', 16)} Metti in pausa</button>` : f.stato === 'pausa' ? `<button class="btn primario" data-azione="mk-funnel-pausa" data-id="${f.id}">${R.icona('play', 16)} Rimetti online</button>` : `<a class="btn primario" href="#/editor/${pagine[0].id}">Apri l'editor e pubblica</a>`}
            <p class="piccolo secondario spazio-sopra">Icona del browser, codici in testa e in fondo alla pagina: nel software vero sono qui, non nel prototipo.</p></div></div>`;
      }
      return `${barraMk('funnel')}
        <div class="testata">
          <div><a class="indietro" href="#/marketing/funnel">${R.icona('freccia-sinistra', 14)} Funnel e pagine</a>
            <div class="riga-flex"><h1 class="titolo-pagina">${esc(f.nome)}</h1>${etichettaStato(f)}</div>
            <div style="margin-top:8px">${url}</div>
            ${copie.length ? `<div class="piccolo secondario" style="margin-top:4px">Copiato in: ${copie.map((c) => esc((R.stato.aziende.find((a) => a.id === c.azienda) || {}).nome || '') + ' (bozza, ' + R.dataBreve(c.quando) + ')').join(', ')}</div>` : ''}
          </div>
          <div class="azioni-testata"><button class="btn" data-azione="mk-duplica" data-id="${f.id}">${R.icona('copia', 16)} Duplica</button>${generale ? `<button class="btn" data-azione="mk-copia-azienda" data-id="${f.id}">Copia in un'altra azienda</button>` : ''}<a class="btn primario" href="#/editor/${pagine[0] ? pagine[0].id : ''}">Apri l'editor</a></div>
        </div>
        <div class="mk-schede">${tab('pagine', 'Pagine')}${tab('statistiche', 'Statistiche')}${tab('google', 'Google e social')}${tab('impostazioni', 'Impostazioni')}</div>
        ${corpo}`;
    },
  });

  /* ---------- Azioni del dettaglio funnel ---------- */
  R.azioni['mk-funnel-dominio'] = (el) => {
    const f = funnel(el.dataset.id);
    const prima = f.dominio;
    f.dominio = el.value; aggiornaIndirizzo(f); segnaModifica(f); R.salva();
    R.avviso(f.stato === 'online' ? `Dominio cambiato: la pagina ora risponde su ${esc(f.indirizzo)}. Il vecchio indirizzo porta al nuovo` : 'Dominio scelto: vale dalla prossima pubblicazione', { annulla() { f.dominio = prima; aggiornaIndirizzo(f); R.salva(); R.aggiorna(); } });
    R.aggiorna();
  };
  R.azioni['mk-funnel-percorso'] = (el) => {
    const f = funnel(el.dataset.id);
    R.modale({
      titolo: 'Indirizzo della pagina', sottotitolo: 'È la parte finale dell\'indirizzo. Usa parole brevi, senza spazi.', classe: 'stretta',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-perc">${esc(f.dominio)}/</label><input class="campo" id="mk-perc" name="percorso" value="${esc(f.percorsoPagina)}"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai(fin) {
        const v = slug(R.valori(fin).percorso);
        if (R.stato.funnel.some((x) => x.id !== f.id && x.percorsoPagina === v && x.dominio === f.dominio)) { R.erroreCampo(fin, 'percorso', 'Questo indirizzo è già usato da un\'altra pagina. Scegline un altro.'); return false; }
        f.percorsoPagina = v; aggiornaIndirizzo(f); segnaModifica(f); R.salva(); R.aggiorna();
        R.avviso(f.stato === 'online' ? 'Indirizzo cambiato: il vecchio porta al nuovo' : 'Indirizzo salvato');
      } }],
    });
  };
  R.azioni['mk-funnel-codice'] = (el) => {
    const f = funnel(el.dataset.id);
    const cosa = el.dataset.cosa;
    const nome = cosa === 'pixel' ? 'Pixel di Facebook' : 'Google Analytics';
    R.modale({
      titolo: nome, classe: 'stretta',
      sottotitolo: 'Serve per misurare le visite e i risultati della pubblicità. Parte solo dopo il consenso ai cookie del visitatore.',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-cod">${cosa === 'pixel' ? 'Numero del Pixel' : 'Codice di misurazione (inizia con G-)'}</label><input class="campo" id="mk-cod" name="codice" value="${f[cosa] ? (cosa === 'pixel' ? '1234567890123' : 'G-INIZIO26') : ''}" placeholder="${cosa === 'pixel' ? 'es. 1234567890123' : 'es. G-AB12CD34'}"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }].concat(f[cosa] ? [{ testo: 'Scollega', classe: 'secondario-campo', fai() { f[cosa] = false; R.salva(); R.aggiorna(); R.avviso(nome + ' scollegato'); } }] : []).concat([{ testo: 'Salva', classe: 'primario', fai(fin) {
        const v = R.valori(fin).codice;
        if (!v) { R.erroreCampo(fin, 'codice', 'Scrivi il codice. Lo trovi nel tuo account ' + (cosa === 'pixel' ? 'di Meta.' : 'Google.')); return false; }
        f[cosa] = true; R.salva(); R.aggiorna(); R.avviso(nome + ' collegato');
      } }]),
    });
  };
  R.azioni['mk-funnel-link'] = (el) => {
    const f = funnel(el.dataset.id);
    R.modale({
      titolo: 'Link corto', classe: 'stretta', sottotitolo: 'Un indirizzo breve da scrivere nei messaggi e sui volantini: porta alla pagina.',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-lc">Link corto</label><input class="campo" id="mk-lc" name="link" value="${esc(f.linkCorto || 'inizio.it/' + f.percorsoPagina.slice(0, 8))}"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai(fin) {
        const v = R.valori(fin).link;
        if (!/^[a-z0-9.-]+\.[a-z]{2,}\/[a-z0-9-]+$/i.test(v)) { R.erroreCampo(fin, 'link', 'Scrivi il link nella forma dominio/parola, per esempio inizio.it/zes.'); return false; }
        f.linkCorto = v; R.salva(); R.aggiorna(); R.avviso('Link corto salvato');
      } }],
    });
  };
  R.azioni['mk-funnel-seo'] = (el) => {
    const f = funnel(el.dataset.id);
    f[el.dataset.cosa] = el.value;
    if (el.dataset.cosa === 'nome' && !el.value.trim()) return;
    clearTimeout(el._t);
    el._t = setTimeout(() => R.salvataggioCampo(document.getElementById('mk-seo-salv'), 'Impostazioni del funnel'), 700);
  };
  R.azioni['mk-funnel-opzione'] = (el) => { const f = funnel(el.dataset.id); f[el.dataset.cosa] = el.checked; R.salvataggioCampo(document.getElementById('mk-seo-salv'), 'Impostazioni del funnel'); };
  R.azioni['mk-funnel-pausa'] = (el) => {
    const f = funnel(el.dataset.id);
    if (!R.serveConnessione(f.stato === 'online' ? 'la pausa' : 'la pubblicazione')) return;
    const prima = f.stato;
    f.stato = prima === 'online' ? 'pausa' : 'online';
    R.salva(); R.aggiorna();
    R.avviso(f.stato === 'pausa' ? 'Funnel in pausa: chi apre l\'indirizzo vede un messaggio neutro' : 'Funnel di nuovo online', { annulla() { f.stato = prima; R.salva(); R.aggiorna(); } });
  };

  function clonaPagine(daFunnel, aFunnel) {
    pagineDi(daFunnel).forEach((p) => {
      const c = JSON.parse(JSON.stringify(p));
      c.id = R.id('pg'); c.funnel = aFunnel; c.pubblicati = null; c.ab = null; c.chat = []; c.salvato = R.adesso(); delete c.costruisci;
      c.blocchi.forEach((b) => { b.id = R.id('b'); });
      R.stato.pagine.push(c);
    });
  }
  R.azioni['mk-duplica'] = (el) => {
    const f = funnel(el.dataset.id);
    const n = R.stato.funnel.filter((x) => x.nome.startsWith(f.nome + ' (copia')).length;
    const c = Object.assign(JSON.parse(JSON.stringify(f)), { id: R.id('fu'), nome: f.nome + (n ? ` (copia ${n + 1})` : ' (copia)'), stato: 'bozza', visite: 0, contatti: 0, linkCorto: '' });
    let base = f.percorsoPagina + '-copia';
    while (R.stato.funnel.some((x) => x.percorsoPagina === base)) base += '-2';
    c.percorsoPagina = base; aggiornaIndirizzo(c); segnaModifica(c);
    R.stato.funnel.push(c);
    clonaPagine(f.id, c.id);
    R.salva();
    R.vai('#/marketing/funnel/' + c.id);
    R.avviso(`Creata la copia "${esc(c.nome)}" in bozza`);
  };

  /* Copia in un'altra azienda (solo amministratore generale) */
  R.azioni['mk-copia-azienda'] = (el) => {
    if (R.utente().ruolo !== 'generale') { R.avviso('Solo l\'amministratore generale può copiare in un\'altra azienda'); return; }
    const f = funnel(el.dataset.id);
    const aziende = R.stato.aziende.filter((a) => a.id !== R.stato.aziendaAttiva && a.stato === 'attiva');
    R.modale({
      titolo: 'Copia in un\'altra azienda',
      sottotitolo: `Si copia tutta la catena di "${esc(f.nome)}": pagine, modulo e automazione collegata. Statistiche, versioni e prove A/B non si copiano. La copia è indipendente dall'originale.`,
      corpo: `<div class="etichetta-campo">In quale azienda?</div>${aziende.map((a, i) => `<label class="opzione"><input type="radio" name="azienda" value="${a.id}" ${i === 0 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--verde)"><span class="quadratino" style="background:${a.colore};color:#fff">${esc(a.iniziale)}</span><span class="principale"><b>${esc(a.nome)}</b><span class="sotto">${esc(a.settore)} · ${a.utenti} utenti</span></span></label>`).join('')}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Avanti', classe: 'primario', restaAperta: true, fai(fin) {
        const id = R.valori(fin).azienda;
        if (!id) return false;
        daSistemare(f, R.stato.aziende.find((a) => a.id === id));
        return false;
      } }],
    });
  };
  function daSistemare(f, az) {
    const mo = modulo(f.modulo) || modulo('mo1');
    const perc = R.percorso(mo.dopo.percorso) || { nome: '—', fasi: [] };
    const aut = (R.stato.automazioni || []).find((a) => a.id === f.automazione);
    const sel = (nome, opz) => `<select class="campo" name="${nome}" style="min-height:42px">${opz.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`;
    const riga = (titolo, spieg, campo) => `<div style="padding:12px 0;border-bottom:1px solid var(--linea)"><div class="grassetto">${titolo}</div><div class="piccolo secondario" style="margin-bottom:8px">${spieg}</div>${campo || ''}</div>`;
    R.modale({
      titolo: 'Da sistemare', classe: 'larga',
      sottotitolo: `Prima di creare la copia in ${esc(az.nome)}, scegli come abbinare quello che non si può copiare così com'è. Campi, etichette e file si copiano da soli.`,
      corpo: riga(`Percorso "${esc(perc.nome)}" e le sue ${perc.fasi.length} fasi`, 'Abbinalo a un percorso che esiste già oppure crealo uguale.', sel('percorso', [`Crea un percorso uguale in ${az.nome}`, `Abbina a "Vendite" di ${az.nome} (le fasi si abbinano per nome)`]))
        + riga('Responsabile dei nuovi contatti', `In ${esc(R.azienda().nome)}: ${mo.dopo.responsabile === 'turno' ? 'a turno' : esc(R.utenteDa(mo.dopo.fisso).nome)}. Gli utenti non passano da un'azienda all'altra.`, sel('responsabile', [`A turno tra gli utenti di ${az.nome}`, `Il titolare di ${az.nome}`]))
        + riga('Numero WhatsApp per il benvenuto', 'Un numero appartiene a una sola azienda.', sel('numero', [`Numero aziendale di ${az.nome}`, 'Nessuno per ora: il benvenuto resta fermo']))
        + riga(`Dominio "${esc(f.dominio)}"`, 'Un dominio non passa mai a un\'altra azienda: la copia usa il sottodominio gratuito.', sel('dominio', [`${az.sottodominio}.rampant.it (gratuito)`]))
        + riga('Campo "Settore / Ateco"', `In ${esc(az.nome)} esiste già un campo con questo nome ma di tipo diverso: si crea "Settore / Ateco (copia)".`)
        + (aut ? riga(`Automazione "${esc(aut.nome)}"`, 'Si copia disattivata: la accendi tu quando è tutto pronto.') : ''),
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Crea la copia in bozza', classe: 'primario', fai() {
        const n = R.stato.copieFunnel.filter((c) => c.funnel === f.id && c.azienda === az.id).length;
        const nome = f.nome + (n ? ` (copia ${n + 1})` : ' (copia)');
        R.stato.copieFunnel.push({ id: R.id('cf'), funnel: f.id, azienda: az.id, nome, quando: R.adesso(), da: R.utente().id });
        R.salva(); R.aggiorna();
        setTimeout(() => R.modale({
          titolo: 'Copia creata', classe: 'stretta',
          sottotitolo: `"${esc(nome)}" è in ${esc(az.nome)}: pagine in Bozza${aut ? ', automazione disattivata' : ''}, indirizzo sul sottodominio ${esc(az.sottodominio)}.rampant.it.`,
          corpo: '<p class="secondario" style="margin:0">Nel prototipo si lavora solo dentro Inizio Impresa: nel software vero la trovi entrando nell\'altra azienda, in Marketing.</p>',
          pulsanti: [{ testo: 'Ho capito', classe: 'primario', chiudi: true }],
        }), 30);
      } }],
    });
  }

  /* Aggiungi pagina al funnel */
  R.azioni['mk-aggiungi-pagina'] = (el) => {
    const f = funnel(el.dataset.id);
    const tipi = [['contenuto', 'Pagina di contenuto', 'Titolo e testo, per spiegare meglio'], ['modulo', 'Pagina con modulo', 'Titolo, vantaggi e modulo'], ['video', 'Pagina con video', 'Video con pulsante sotto'], ['grazie', 'Pagina di ringraziamento', 'Dopo l\'invio del modulo, con WhatsApp']];
    R.modale({
      titolo: 'Aggiungi una pagina', sottotitolo: 'Si aggiunge in fondo al funnel, in bozza.',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-ap-nome">Nome della pagina</label><input class="campo" id="mk-ap-nome" name="nome" placeholder="es. Come funziona"></div>${tipi.map(([k, t, s], i) => `<label class="opzione"><input type="radio" name="tipo" value="${k}" ${i === 0 ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--verde)"><span class="principale"><b>${t}</b><span class="sotto">${s}</span></span></label>`).join('')}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Aggiungi e modifica', classe: 'primario', fai(fin) {
        const v = R.valori(fin);
        if (!v.nome) { R.erroreCampo(fin, 'nome', 'Scrivi il nome della pagina.'); return false; }
        const pr = principale(f.id);
        const b = nuovoBlocco;
        const blocchi = v.tipo === 'grazie' ? paginaGrazie() : [b('intestazione', { testo: 'inizio', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' }), b('titolo', { sfondo: 'tenue', testo: v.nome, colore: 'scuro', dimensione: 'L' })]
          .concat(v.tipo === 'video' ? [b('video', { testo: '' }), b('pulsante', { testo: 'Richiedi informazioni' })] : v.tipo === 'modulo' ? [b('riquadri', { voci: [{ t: 'Vantaggio 1', s: 'Scrivi qui il primo vantaggio.' }, { t: 'Vantaggio 2', s: 'Scrivi qui il secondo.' }, { t: 'Vantaggio 3', s: 'E qui il terzo.' }] }), b('modulo', { sfondo: 'tenue', modulo: f.modulo || 'mo1', testo: 'Lascia i tuoi dati', pulsante: 'Invia' })] : [b('testo', { testo: 'Scrivi qui il testo della pagina.' })]);
        let sotto = slug(v.nome);
        while (pagineDi(f.id).some((p) => p.sotto === sotto)) sotto += '-2';
        const pg = { id: R.id('pg'), funnel: f.id, ordine: Math.max(...pagineDi(f.id).map((p) => p.ordine)) + 1, nome: v.nome, sotto, tipo: v.tipo === 'grazie' ? 'grazie' : 'contenuto', marchio: Object.assign({}, pr.marchio), blocchi, pubblicati: null, salvato: R.adesso(), chat: [], ab: null };
        R.stato.pagine.push(pg); segnaModifica(f); R.salva();
        R.vai('#/editor/' + pg.id);
      } }],
    });
  };

  /* Prova A/B */
  R.azioni['mk-ab'] = (el) => {
    const p = pagina(el.dataset.id);
    const f = funnel(p.funnel);
    const tit = p.blocchi.find((b) => b.tipo === 'titolo') || { testo: '' };
    const ab = p.ab;
    if (ab && ab.attiva) {
      const cA = ab.contattiA / ab.visiteA; const cB = ab.contattiB / ab.visiteB;
      const vinceB = cB > cA;
      const totale = ab.visiteA + ab.visiteB;
      R.modale({
        titolo: 'Prova A/B in corso', sottotitolo: `Metà dei visitatori vede la versione A, metà la B (divisione ${ab.divisione}% · ${100 - ab.divisione}%). Lo stesso visitatore vede sempre la stessa versione.`,
        corpo: `<div class="mk-ab"><div class="${vinceB ? '' : 'vince'}"><div class="piccolo">Versione A</div><div class="grassetto" style="margin:4px 0 10px">${esc(tit.testo)}</div><div class="piccolo">${num(ab.visiteA)} visite · ${ab.contattiA} contatti</div><div class="numero-medio">${percento(ab.contattiA, ab.visiteA)}</div></div>
          <div class="${vinceB ? 'vince' : ''}"><div class="piccolo">Versione B</div><div class="grassetto" style="margin:4px 0 10px">${esc(ab.titoloB)}</div><div class="piccolo">${num(ab.visiteB)} visite · ${ab.contattiB} contatti</div><div class="numero-medio">${percento(ab.contattiB, ab.visiteB)}</div></div></div>
          <p class="secondario spazio-sopra" style="margin-bottom:0">${totale >= 1000 ? `La versione ${vinceB ? 'B' : 'A'} sta andando meglio. Ci sono abbastanza visite (${num(totale)}) per sceglierla con sicurezza.` : `Servono almeno 1.000 visite per scegliere con sicurezza: ne mancano ${num(1000 - totale)}.`}</p>`,
        pulsanti: [{ testo: 'Ferma la prova', classe: 'secondario-campo', fai() { p.ab.attiva = false; R.salva(); R.aggiorna(); R.avviso('Prova A/B fermata: tutti vedono la versione A'); } },
          { testo: `Scegli la vincente: ${vinceB ? 'B' : 'A'}`, classe: 'primario', disabilitato: totale < 1000, fai() {
            if (!R.serveConnessione('la scelta della vincente')) return false;
            if (vinceB) [p.blocchi, p.pubblicati].forEach((arr) => { const t = (arr || []).find((b) => b.tipo === 'titolo'); if (t) t.testo = ab.titoloB; });
            p.ab.attiva = false; R.salva(); R.aggiorna();
            R.avviso(`Versione ${vinceB ? 'B' : 'A'} scelta: ora la vedono tutti i visitatori`);
          } }],
      });
      return;
    }
    R.modale({
      titolo: 'Prova A/B del titolo', sottotitolo: 'Due versioni del titolo, ognuna vista da una parte dei visitatori. Dopo almeno 1.000 visite ti suggeriamo la vincente.',
      corpo: `<div class="gruppo-campo"><div class="etichetta-campo">Versione A (quella di adesso)</div><div class="riga-impostazione" style="border-radius:20px">${esc(tit.testo)}</div></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-ab-b">Versione B</label><input class="campo" id="mk-ab-b" name="titoloB" value="${esc((ab && ab.titoloB) || '')}" placeholder="Scrivi un titolo diverso"></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-ab-div">Divisione del traffico: <b id="mk-ab-et">A 50% · B 50%</b></label><input class="mk-range" type="range" id="mk-ab-div" name="divisione" min="10" max="90" step="10" value="50" data-digita="mk-ab-divisione"></div>
        <p class="piccolo secondario" style="margin:0">${f.stato === 'online' ? 'La prova parte subito sulla pagina online.' : 'La pagina non è ancora online: la prova parte quando la pubblichi.'}</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Avvia la prova', classe: 'primario', fai(fin) {
        const v = R.valori(fin);
        if (!v.titoloB) { R.erroreCampo(fin, 'titoloB', 'Scrivi il titolo della versione B.'); return false; }
        if (f.stato === 'online' && !R.serveConnessione('l\'avvio della prova')) return false;
        p.ab = { attiva: true, divisione: +v.divisione, titoloB: v.titoloB, visiteA: 0, visiteB: 0, contattiA: 0, contattiB: 0 };
        R.salva(); R.aggiorna(); R.avviso('Prova A/B avviata');
      } }],
    });
  };
  R.azioni['mk-ab-divisione'] = (el) => { const e = document.getElementById('mk-ab-et'); if (e) e.textContent = `A ${el.value}% · B ${100 - el.value}%`; };

  /* ================= Editor classico (immagine 15) ================= */
  const ed = { id: null, sel: null, disp: 'computer', scheda: 'elementi', indietro: [], avanti: [], ultimaDigitazione: 0, scorri: false, proposta: null };
  const ELEMENTI = [
    ['titolo', 'Titolo', '<b style="font-family:var(--titoli);font-size:20px;line-height:1">T</b>'], ['testo', 'Testo', R.icona('testo', 20)],
    ['pulsante', 'Pulsante', '<span style="display:block;width:34px;height:13px;border-radius:99px;background:var(--verde)"></span>'], ['immagine', 'Immagine', R.icona('immagine', 20)],
    ['video', 'Video', R.icona('play', 20)], ['modulo', 'Modulo', R.icona('modulo', 20), 'salvia'],
    ['riquadri', 'Colonne', R.icona('colonna', 20)], ['conto', 'Conto alla rovescia', '<b style="font-size:15px">00:59</b>'],
    ['faq', 'Domande frequenti', R.icona('domanda', 20)], ['whatsapp', 'Pulsante WhatsApp', R.icona('whatsapp', 20), 'salvia'],
    ['recensioni', 'Recensioni', R.icona('stella', 20)], ['mappa', 'Mappa', R.icona('mappa', 20)],
    ['galleria', 'Galleria', R.icona('galleria', 20)], ['divisore', 'Divisore', R.icona('divisore', 20)],
  ];
  const NUOVI = {
    titolo: { testo: 'Scrivi qui il titolo', colore: 'scuro' },
    testo: { testo: 'Scrivi qui il testo: frasi brevi e chiare.' },
    pulsante: { testo: 'Richiedi informazioni', azione: 'modulo', colore: 'primario' },
    immagine: { testo: 'Scegli una foto dalla libreria', titolo: '', sotto: '' },
    video: { testo: 'Titolo del video' },
    modulo: { modulo: 'mo1', testo: 'Lascia i tuoi dati', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Invia' },
    riquadri: { voci: [{ t: 'Primo punto', s: 'Scrivi qui.' }, { t: 'Secondo punto', s: 'Scrivi qui.' }, { t: 'Terzo punto', s: 'Scrivi qui.' }] },
    conto: { testo: 'Il bando chiude tra', giorni: 12 },
    faq: { testo: 'Domande frequenti', voci: [{ d: 'Scrivi una domanda', r: 'Scrivi la risposta.' }] },
    whatsapp: { testo: 'Hai domande? Scrivici.', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' },
    recensioni: { testo: 'Cosa dicono di noi', voci: [{ n: 'Giuseppe, Caserta', t: 'Ci hanno seguito in tutto, dalla domanda all\'erogazione.' }, { n: 'Anna, Bari', t: 'Risposte veloci e chiare, anche su WhatsApp.' }, { n: 'Marco, Salerno', t: 'Consigliati a chi vuole investire senza perdere tempo.' }] },
    mappa: { testo: 'Dove siamo', sotto: 'Via Toledo 156, Napoli' },
    galleria: { testo: 'Galleria', voci: ['Foto 1', 'Foto 2', 'Foto 3', 'Foto 4'] },
    divisore: {},
  };
  const b = nuovoBlocco;
  const SEZIONI = [
    ['Apertura con titolo e pulsante', 'Sfondo scuro, titolo, testo e pulsante', () => [b('titolo', { sfondo: 'scuro', testo: 'Il titolo che fa fermare chi legge', colore: 'chiaro', dimensione: 'L' }), b('testo', { sfondo: 'scuro', testo: 'Una frase che spiega cosa offri e a chi.' }), b('pulsante', { sfondo: 'scuro', testo: 'Verifica gratis' })]],
    ['Esempio con modulo accanto', 'Immagine a sinistra, modulo a destra', () => [b('immagine', { colonna: 'sx', titolo: 'Un esempio concreto', testo: 'Foto', sotto: 'Scrivi qui l\'esempio in una riga.' }), b('modulo', { colonna: 'dx', modulo: 'mo1', testo: 'Richiedi la verifica gratuita', pulsante: 'Invia' })]],
    ['Tre vantaggi', 'Titolo e tre riquadri', () => [b('titolo', { testo: 'Perché sceglierci', colore: 'scuro', dimensione: 'M' }), b('riquadri', JSON.parse(JSON.stringify(NUOVI.riquadri)))]],
    ['Domande frequenti', 'Domande e risposte che si aprono', () => [b('faq', Object.assign({ sfondo: 'tenue' }, JSON.parse(JSON.stringify(NUOVI.faq))))]],
    ['Contatti e mappa', 'Pulsante WhatsApp e indirizzo', () => [b('whatsapp', Object.assign({}, NUOVI.whatsapp)), b('mappa', Object.assign({}, NUOVI.mappa))]],
    ['Recensioni', 'Tre opinioni di clienti', () => [b('recensioni', JSON.parse(JSON.stringify(NUOVI.recensioni)))]],
  ];
  function apriEditor(id) { if (ed.id !== id) Object.assign(ed, { id, sel: null, indietro: [], avanti: [], scheda: 'elementi', proposta: null, ultimaDigitazione: 0 }); }
  const istantanea = (p) => JSON.stringify({ blocchi: p.blocchi, marchio: p.marchio });
  function memorizza(p) { ed.indietro.push(istantanea(p)); if (ed.indietro.length > 60) ed.indietro.shift(); ed.avanti = []; }
  const statoSalv = (p) => `${p.pubblicati ? (uguali(p.blocchi, p.pubblicati) ? 'Pubblicata' : 'Modifiche non pubblicate') : 'Bozza'} · Salvato ${fra(p.salvato)} · ${esc(indirizzoPagina(p))}`;
  function salvaBozza(p) {
    p.salvato = R.adesso();
    segnaModifica(funnel(p.funnel));
    R.salva();
    const ind = document.getElementById('mk-salv');
    if (R.stato.offline) {
      const d = 'Bozza della pagina ' + p.nome;
      if (!R.stato.inAttesa.some((x) => x.descrizione === d)) { R.stato.inAttesa.push({ descrizione: d, quando: R.adesso() }); R.salva(); }
      if (ind) { ind.className = 'mk-stato-salv'; ind.textContent = 'Bozza in attesa · si salva quando torna la connessione'; }
      return;
    }
    if (!ind) return;
    ind.className = 'mk-stato-salv';
    ind.textContent = 'Salvataggio…';
    clearTimeout(ed.tSalv);
    ed.tSalv = setTimeout(() => { const i = document.getElementById('mk-salv'); if (i) { i.className = 'mk-stato-salv ok'; i.textContent = 'Bozza salvata adesso · ' + indirizzoPagina(p); } }, 700);
  }
  function imposta(obj, percorso, v) {
    const parti = percorso.split('.');
    let o = obj;
    for (let i = 0; i < parti.length - 1; i++) o = o[isNaN(parti[i]) ? parti[i] : +parti[i]];
    o[isNaN(parti[parti.length - 1]) ? parti[parti.length - 1] : +parti[parti.length - 1]] = v;
  }
  function ridisegnaTele(p) {
    const fo = document.getElementById('mk-foglio');
    if (fo) fo.innerHTML = htmlPagina(p, { modo: 'editor', sel: ed.sel, disp: ed.disp, solo: telefono() });
    const fc = document.getElementById('mk-ai-computer');
    if (fc) fc.innerHTML = htmlPagina(p, { modo: 'editor', sel: ed.sel, solo: true, vuoto: 'La pagina si sta costruendo…' });
    const ft = document.getElementById('mk-ai-telefono');
    if (ft) ft.innerHTML = htmlPagina(p, { modo: 'anteprima', vuoto: '…' });
    document.querySelectorAll('[data-azione="mk-ed-annulla"]').forEach((x) => { x.disabled = !ed.indietro.length; });
    document.querySelectorAll('[data-azione="mk-ed-ripeti"]').forEach((x) => { x.disabled = !ed.avanti.length; });
  }
  const breve = (bl) => String(bl.testo || bl.pulsante || bl.titolo || (bl.voci && bl.voci[0] && (bl.voci[0].t || bl.voci[0].d || bl.voci[0])) || '').slice(0, 28);

  /* Campi di testo modificabili per tipo di elemento: [etichetta, proprietà, area di testo] */
  function campiTesto(bl) {
    const t = [];
    switch (bl.tipo) {
      case 'intestazione': t.push(['Logo (testo)', 'testo'], ['Testo del pulsante WhatsApp', 'pulsante']); break;
      case 'titolo': t.push(['Testo', 'testo', true], ['Etichetta sopra (facoltativa)', 'etichetta']); break;
      case 'testo': t.push(['Testo', 'testo', true]); break;
      case 'pulsante': t.push(['Testo', 'testo']); break;
      case 'immagine': t.push(['Titolo sopra', 'titolo'], ['Descrizione della foto', 'testo'], ['Didascalia sotto', 'sotto']); break;
      case 'video': t.push(['Titolo', 'testo']); break;
      case 'modulo': t.push(['Titolo', 'testo'], ['Sottotitolo', 'sotto'], ['Testo del pulsante', 'pulsante']); break;
      case 'riquadri': (bl.voci || []).forEach((v, i) => t.push([`Colonna ${i + 1} · titolo`, `voci.${i}.t`], [`Colonna ${i + 1} · testo`, `voci.${i}.s`, true])); break;
      case 'conto': t.push(['Titolo', 'testo']); break;
      case 'faq': t.push(['Titolo', 'testo']); (bl.voci || []).forEach((v, i) => t.push([`Domanda ${i + 1}`, `voci.${i}.d`], [`Risposta ${i + 1}`, `voci.${i}.r`, true])); break;
      case 'whatsapp': t.push(['Testo', 'testo', true], ['Testo del pulsante', 'pulsante']); break;
      case 'recensioni': t.push(['Titolo', 'testo']); (bl.voci || []).forEach((v, i) => t.push([`Recensione ${i + 1}`, `voci.${i}.t`, true], [`Chi la scrive`, `voci.${i}.n`])); break;
      case 'mappa': t.push(['Titolo', 'testo'], ['Indirizzo', 'sotto']); break;
      case 'galleria': t.push(['Titolo', 'testo']); (bl.voci || []).forEach((v, i) => t.push([`Foto ${i + 1} · didascalia`, `voci.${i}`])); break;
      default: break;
    }
    return t;
  }
  const leggi = (obj, percorso) => percorso.split('.').reduce((o, k) => (o == null ? '' : o[isNaN(k) ? k : +k]), obj);
  const htmlCampiTesto = (bl, attr) => campiTesto(bl).map(([et, pr, area], i) => `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-${i}">${et}</label>${area ? `<textarea class="campo" id="mk-p-${i}" rows="3" ${attr(pr)}>${esc(leggi(bl, pr))}</textarea>` : `<input class="campo" id="mk-p-${i}" ${attr(pr)} value="${esc(leggi(bl, pr))}">`}</div>`).join('');

  function pannelloElemento(p, bl) {
    const attr = (pr) => `data-digita="mk-ed-prop" data-prop="${pr}"`;
    const conColore = ['titolo', 'pulsante', 'modulo', 'whatsapp', 'intestazione'].includes(bl.tipo);
    const conForma = ['pulsante', 'modulo', 'whatsapp'].includes(bl.tipo);
    const conDim = ['titolo', 'pulsante', 'modulo', 'whatsapp'].includes(bl.tipo);
    const m = p.marchio;
    const colori = [['primario', 'Colore del marchio'], ['scuro', 'Scuro'], ['verde', 'Verde'], ['whatsapp', 'Verde WhatsApp'], ['chiaro', 'Bianco']];
    return `<div class="riquadro medio" style="padding:18px"><h2 class="titolo-riquadro">${NOMI[bl.tipo]}</h2>
      ${htmlCampiTesto(bl, attr)}
      ${bl.tipo === 'pulsante' ? `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-az">Quando si clicca</label><select class="campo" id="mk-p-az" data-cambia="mk-ed-prop" data-prop="azione">${[['modulo', 'Porta al modulo'], ['whatsapp', 'Apri WhatsApp'], ['link', 'Apri un link'], ['successiva', 'Va alla pagina successiva'], ['file', 'Scarica un file']].map(([k, t]) => `<option value="${k}" ${bl.azione === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>` : ''}
      ${bl.tipo === 'modulo' ? `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-mo">Quale modulo</label><select class="campo" id="mk-p-mo" data-cambia="mk-ed-prop" data-prop="modulo">${R.stato.moduli.map((mo) => `<option value="${mo.id}" ${bl.modulo === mo.id ? 'selected' : ''}>${esc(mo.nome)}</option>`).join('')}</select><a class="link verde" style="display:inline-block;margin:8px 0 0 6px" href="#/marketing/moduli/${bl.modulo}">Modifica i campi del modulo</a></div>` : ''}
      ${bl.tipo === 'conto' ? `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-gg">Giorni alla scadenza</label><input class="campo" type="number" min="0" id="mk-p-gg" data-digita="mk-ed-prop" data-prop="giorni" data-numero="1" value="${+bl.giorni || 0}"></div>` : ''}
      ${bl.tipo === 'faq' ? '<button class="btn piccolo secondario-campo spazio-sotto" data-azione="mk-ed-faq">+ Aggiungi domanda</button>' : ''}
      ${conColore ? `<div class="gruppo-campo"><div class="etichetta-campo">Colore</div><div class="mk-colori">${colori.map(([k, t]) => `<button class="${bl.colore === k ? 'scelto' : ''}" style="background:${coloreDa(m, k)}" data-azione="mk-ed-colore" data-colore="${k}" aria-label="${t}" title="${t}"></button>`).join('')}</div></div>` : ''}
      ${conForma ? `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-arr">Arrotondamento</label><input class="mk-range" type="range" min="0" max="100" step="10" id="mk-p-arr" value="${bl.arrotondamento == null ? 100 : bl.arrotondamento}" data-digita="mk-ed-prop" data-prop="arrotondamento" data-numero="1"></div>` : ''}
      ${conDim ? `<div class="gruppo-campo"><div class="etichetta-campo">Dimensione</div><div class="mk-taglie">${['S', 'M', 'L'].map((d) => `<button class="${(bl.dimensione || 'M') === d ? 'attivo' : ''}" data-azione="mk-ed-dim" data-dim="${d}">${d}</button>`).join('')}</div></div>` : ''}
      ${bl.tipo !== 'intestazione' ? `<div><div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-sf">Sfondo della sezione</label><select class="campo" id="mk-p-sf" data-cambia="mk-ed-prop" data-prop="sfondo">${[['bianco', 'Bianco'], ['tenue', 'Chiaro'], ['scuro', 'Scuro'], ['marchio', 'Colore del marchio']].map(([k, t]) => `<option value="${k}" ${bl.sfondo === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-p-col">Posizione</label><select class="campo" id="mk-p-col" data-cambia="mk-ed-prop" data-prop="colonna">${[['', 'Tutta la larghezza'], ['sx', 'Colonna sinistra'], ['dx', 'Colonna destra']].map(([k, t]) => `<option value="${k}" ${(bl.colonna || '') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>` : ''}
      <div class="riga-impostazione" style="margin:0"><span>Mostra sul telefono</span><label class="interruttore"><input type="checkbox" data-cambia="mk-ed-prop" data-prop="telefono" ${bl.telefono ? 'checked' : ''} aria-label="Mostra sul telefono"><span></span></label></div>
    </div>`;
  }
  function pannelloPagina(p) {
    return `<div class="riquadro medio" style="padding:18px"><h2 class="titolo-riquadro">Pagina</h2><p class="secondario" style="margin-top:-6px;font-size:13px">Clicca un elemento sulla pagina per cambiarlo. Qui scegli i colori del marchio di tutta la pagina.</p>
      <div class="etichetta-campo">Colori del marchio</div><div class="mk-colori spazio-sotto">${Object.keys(MARCHI).map((k) => `<button class="${p.marchio.primario === MARCHI[k].primario ? 'scelto' : ''}" style="background:${MARCHI[k].primario}" data-azione="mk-ed-marchio" data-marchio="${k}" aria-label="Colori ${k}" title="${R.maiuscola(k)}"></button>`).join('')}</div>
      <div class="riga-impostazione"><span>Usa il logo dell'azienda</span><label class="interruttore"><input type="checkbox" data-cambia="mk-ed-logo" ${p.marchio.logoAzienda ? 'checked' : ''} aria-label="Usa il logo dell'azienda"><span></span></label></div>
      <div class="piccolo secondario">Caratteri: Bricolage Grotesque e Plus Jakarta Sans, caricati dal nostro server (conformi alla privacy).</div></div>`;
  }
  function pannelloAI(bl) {
    const pr = ed.proposta;
    return `<div class="riquadro medio mk-ai spazio-sopra" style="padding:18px"><h2 class="titolo-riquadro" style="color:var(--lavanda-t)">Chiedi all'AI</h2><p style="margin:-6px 0 10px;font-size:13px">Scrive e migliora i testi della pagina</p>
      <textarea class="campo" id="mk-ai-richiesta" aria-label="Cosa chiedere all'AI">${bl && bl.tipo === 'pulsante' ? 'Rendi il pulsante più invitante' : bl && bl.tipo === 'testo' ? 'Rendi il testo più breve e chiaro' : 'Rendi il titolo più convincente per un imprenditore del Sud'}</textarea>
      ${pr ? `<div class="riquadro medio spazio-sopra" style="background:#fff;padding:12px 14px"><div class="piccolo secondario">Proposta per: ${esc(NOMI[(pr.tipo)] || '')}</div><div class="grassetto" style="margin:4px 0 10px">${esc(pr.testo)}</div><div class="riga-flex" style="gap:6px"><button class="btn piccolo primario" data-azione="mk-ed-ai-usa">Usa questo testo</button><button class="btn piccolo secondario-campo" data-azione="mk-ed-ai">Un'altra</button></div></div>` : ''}
      <button class="btn mk-viola largo spazio-sopra" data-azione="mk-ed-ai">Genera</button></div>`;
  }

  R.rotta('/editor/:id', {
    menu: 'marketing', pieno: true,
    titolo: (par) => { const p = pagina(par.id); return p ? 'Editor · ' + p.nome : 'Editor'; },
    disegna(par) {
      assicura();
      const p = pagina(par.id);
      if (!p || !funnel(p.funnel)) return '<div class="riquadro vuoto" style="margin:20px">Questa pagina non esiste più. <a class="link verde" href="#/marketing/funnel">Torna a Funnel e pagine</a></div>';
      apriEditor(p.id);
      const f = funnel(p.funnel);
      const tel = telefono();
      const sel = p.blocchi.find((x) => x.id === ed.sel);
      const scheda = (id, t) => `<button class="${ed.scheda === id ? 'attivo' : ''}" style="flex:1" data-azione="mk-ed-scheda" data-scheda="${id}">${t}</button>`;
      let sinistra = '';
      if (ed.scheda === 'elementi') sinistra = `<p class="piccolo secondario" style="margin:10px 4px">Clicca per aggiungere sotto l'elemento scelto</p><div class="mk-tile-griglia">${ELEMENTI.map(([t, n, ic, cl]) => `<button class="mk-tile ${cl || ''}" data-azione="mk-ed-aggiungi" data-tipo="${t}">${ic}<span>${n}</span></button>`).join('')}</div>`;
      else if (ed.scheda === 'sezioni') sinistra = `<p class="piccolo secondario" style="margin:10px 4px">Sezioni pronte: si aggiungono sotto l'elemento scelto</p>${SEZIONI.map(([n, s], i) => `<button class="opzione" data-azione="mk-ed-sezione" data-i="${i}"><span class="principale"><b style="font-size:13.5px">${n}</b><span class="sotto">${s}</span></span>${R.icona('piu', 16)}</button>`).join('')}`;
      else sinistra = `<p class="piccolo secondario" style="margin:10px 4px">L'ordine degli elementi. Usa le frecce per spostarli.</p>${p.blocchi.map((x, i) => `<div class="mk-livello ${x.id === ed.sel ? 'sel' : ''}"><span class="principale" data-azione="mk-ed-seleziona" data-id="${x.id}">${NOMI[x.tipo]} <span class="piccolo secondario">${esc(breve(x))}</span></span><button data-azione="mk-ed-sposta" data-id="${x.id}" data-verso="-1" aria-label="Sposta su" ${i === 0 ? 'disabled' : ''}>${R.icona('su', 16)}</button><button data-azione="mk-ed-sposta" data-id="${x.id}" data-verso="1" aria-label="Sposta giù" ${i === p.blocchi.length - 1 ? 'disabled' : ''}>${R.icona('giu', 16)}</button><button data-azione="mk-ed-tel" data-id="${x.id}" aria-label="${x.telefono ? 'Nascondi' : 'Mostra'} sul telefono" title="${x.telefono ? 'Visibile' : 'Nascosto'} sul telefono">${R.icona(x.telefono ? 'occhio' : 'occhio_no', 16)}</button></div>`).join('')}`;
      return `<div class="barra-editor">
          <a class="btn tondo secondario-campo" href="#/marketing/funnel/${f.id}" aria-label="Torna al funnel">${R.icona('freccia-sinistra')}</a>
          <div class="nome-editor"><b>${esc(f.nome)} · ${esc(p.nome)}</b><span id="mk-salv" class="mk-stato-salv">${statoSalv(p)}</span></div>
          ${tel ? '' : `<div class="selettore">${['computer', 'tablet', 'telefono'].map((d) => `<button class="${ed.disp === d ? 'attivo' : ''}" data-azione="mk-ed-disp" data-disp="${d}">${R.maiuscola(d)}</button>`).join('')}</div>`}
          <div class="riga-flex" style="gap:8px">
            ${tel ? '' : `<button class="btn tondo secondario-campo" data-azione="mk-ed-annulla" aria-label="Annulla" title="Annulla (Ctrl+Z)" ${ed.indietro.length ? '' : 'disabled'}>${R.icona('annulla', 16)}</button><button class="btn tondo secondario-campo" data-azione="mk-ed-ripeti" aria-label="Ripeti" title="Ripeti (Ctrl+Y)" ${ed.avanti.length ? '' : 'disabled'}>${R.icona('ripeti', 16)}</button>`}
            ${tel && f.stato !== 'bozza' ? `<button class="btn secondario-campo" data-azione="mk-funnel-pausa" data-id="${f.id}">${f.stato === 'online' ? 'Metti in pausa' : 'Rimetti online'}</button>` : ''}
            <a class="btn secondario-campo" href="${percorsoPubblico(p)}?anteprima=1">Anteprima</a>
            <button class="btn primario" data-azione="mk-pubblica" data-id="${p.id}">Pubblica</button>
          </div>
        </div>
        ${tel ? '<div class="mk-avviso-tel"><b>La costruzione completa si fa da computer:</b> dal telefono puoi vedere, correggere i testi, pubblicare e mettere in pausa. Tocca un testo della pagina per correggerlo.</div>' : ''}
        <div class="area-editor">
          ${tel ? '' : `<div class="riquadro medio" style="padding:14px"><div class="selettore su-bianco" style="display:flex;width:100%">${scheda('elementi', 'Elementi')}${scheda('sezioni', 'Sezioni')}${scheda('livelli', 'Livelli')}</div>${sinistra}</div>`}
          <div class="tela mk-tela"><div class="mk-foglio ${tel ? '' : ed.disp}" id="mk-foglio">${htmlPagina(p, { modo: 'editor', sel: ed.sel, disp: ed.disp, solo: tel })}</div></div>
          ${tel ? '' : `<div class="pannello-destro mk-pannello">${sel ? pannelloElemento(p, sel) : pannelloPagina(p)}${pannelloAI(sel)}</div>`}
        </div>`;
    },
    dopo() {
      if (ed.scorri) { ed.scorri = false; const el = document.getElementById('el-' + ed.sel); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    },
  });

  /* ---------- Azioni dell'editor classico ---------- */
  const pagEd = () => pagina(ed.id);
  function cambia(fn, avviso) {
    const p = pagEd();
    if (!p) return;
    memorizza(p);
    fn(p);
    salvaBozza(p);
    R.aggiorna();
    if (avviso) R.avviso(avviso.testo, avviso.annulla ? { annulla: avviso.annulla } : undefined);
  }
  function inserisci(p, nuovi) {
    const i = p.blocchi.findIndex((x) => x.id === ed.sel);
    const rif = p.blocchi[i];
    if (rif) nuovi.forEach((n, k) => { if (nuovi.length === 1) { if (rif.tipo !== 'intestazione') n.sfondo = rif.sfondo; n.colonna = rif.colonna || ''; } });
    p.blocchi.splice(i >= 0 ? i + 1 : p.blocchi.length, 0, ...nuovi);
    ed.sel = nuovi[0].id;
    ed.scorri = true;
  }
  R.azioni['mk-ed-seleziona'] = (el) => {
    const p = pagEd();
    if (!p) return;
    if (telefono() && location.hash.startsWith('#/editor/')) { ed.sel = el.dataset.id; correggiDaTelefono(p, p.blocchi.find((x) => x.id === ed.sel)); return; }
    if (ed.sel === el.dataset.id) return;
    ed.sel = el.dataset.id; ed.proposta = null;
    R.aggiorna();
  };
  function correggiDaTelefono(p, bl) {
    if (!bl) return;
    const campi = campiTesto(bl);
    if (!campi.length) { R.avviso('Questo elemento non ha testi: per cambiarlo usa il computer'); return; }
    R.modale({
      titolo: 'Correggi il testo', sottotitolo: NOMI[bl.tipo] + ' · le modifiche restano in bozza finché non pubblichi.', proteggi: true,
      corpo: htmlCampiTesto(bl, (pr) => `name="${pr}"`),
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai(fin) {
        memorizza(p);
        fin.querySelectorAll('[name]').forEach((c) => imposta(bl, c.name, c.value));
        salvaBozza(p); R.aggiorna(); R.avviso('Testo corretto · bozza salvata');
      } }],
    });
  }
  R.azioni['mk-ed-scheda'] = (el) => { ed.scheda = el.dataset.scheda; R.aggiorna(); };
  R.azioni['mk-ed-disp'] = (el) => { ed.disp = el.dataset.disp; R.aggiorna(); };
  R.azioni['mk-ed-aggiungi'] = (el) => {
    const t = el.dataset.tipo;
    cambia((p) => inserisci(p, [nuovoBlocco(t, JSON.parse(JSON.stringify(NUOVI[t] || {})))]));
    R.avviso(`${NOMI[t]} aggiunto alla pagina`);
  };
  R.azioni['mk-ed-sezione'] = (el) => {
    const s = SEZIONI[+el.dataset.i];
    cambia((p) => inserisci(p, s[2]()));
    R.avviso(`Sezione "${s[0]}" aggiunta`);
  };
  R.azioni['mk-ed-sposta'] = (el) => {
    const p = pagEd();
    const i = p.blocchi.findIndex((x) => x.id === el.dataset.id);
    const j = i + (+el.dataset.verso);
    if (i < 0 || j < 0 || j >= p.blocchi.length) return;
    cambia((pp) => { const [x] = pp.blocchi.splice(i, 1); pp.blocchi.splice(j, 0, x); ed.sel = x.id; });
  };
  R.azioni['mk-ed-duplica'] = (el) => {
    cambia((p) => {
      const i = p.blocchi.findIndex((x) => x.id === el.dataset.id);
      const c = Object.assign(JSON.parse(JSON.stringify(p.blocchi[i])), { id: R.id('b') });
      p.blocchi.splice(i + 1, 0, c);
      ed.sel = c.id;
    });
    R.avviso('Elemento duplicato');
  };
  R.azioni['mk-ed-elimina'] = (el) => {
    const p = pagEd();
    const i = p.blocchi.findIndex((x) => x.id === el.dataset.id);
    if (i < 0) return;
    const prima = istantanea(p);
    cambia((pp) => { pp.blocchi.splice(i, 1); ed.sel = (pp.blocchi[i] || pp.blocchi[i - 1] || {}).id || null; }, {
      testo: `${NOMI[p.blocchi[i].tipo]} eliminato`,
      annulla() { const q = pagEd(); if (!q) return; memorizza(q); Object.assign(q, JSON.parse(prima)); salvaBozza(q); R.aggiorna(); },
    });
  };
  R.azioni['mk-ed-annulla'] = () => {
    const p = pagEd();
    if (!p || !ed.indietro.length) return;
    ed.avanti.push(istantanea(p));
    Object.assign(p, JSON.parse(ed.indietro.pop()));
    if (!p.blocchi.some((x) => x.id === ed.sel)) ed.sel = null;
    salvaBozza(p); R.aggiorna();
  };
  R.azioni['mk-ed-ripeti'] = () => {
    const p = pagEd();
    if (!p || !ed.avanti.length) return;
    ed.indietro.push(istantanea(p));
    Object.assign(p, JSON.parse(ed.avanti.pop()));
    if (!p.blocchi.some((x) => x.id === ed.sel)) ed.sel = null;
    salvaBozza(p); R.aggiorna();
  };
  R.azioni['mk-ed-prop'] = (el) => {
    const p = pagEd();
    const bl = p && p.blocchi.find((x) => x.id === ed.sel);
    if (!bl) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.numero) v = +v;
    const scrittura = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type !== 'checkbox');
    const ora = Date.now();
    if (!scrittura || ora - ed.ultimaDigitazione > 1200) memorizza(p);
    ed.ultimaDigitazione = scrittura ? ora : 0;
    imposta(bl, el.dataset.prop, v);
    salvaBozza(p);
    if (scrittura) ridisegnaTele(p); else R.aggiorna();
  };
  R.azioni['mk-ed-colore'] = (el) => cambia((p) => { const bl = p.blocchi.find((x) => x.id === ed.sel); if (bl) bl.colore = el.dataset.colore; });
  R.azioni['mk-ed-dim'] = (el) => cambia((p) => { const bl = p.blocchi.find((x) => x.id === ed.sel); if (bl) bl.dimensione = el.dataset.dim; });
  R.azioni['mk-ed-tel'] = (el) => cambia((p) => { const bl = p.blocchi.find((x) => x.id === el.dataset.id); if (bl) bl.telefono = !bl.telefono; });
  R.azioni['mk-ed-faq'] = () => cambia((p) => { const bl = p.blocchi.find((x) => x.id === ed.sel); if (bl) bl.voci.push({ d: 'Nuova domanda', r: 'Scrivi la risposta.' }); });
  R.azioni['mk-ed-marchio'] = (el) => cambia((p) => { p.marchio = Object.assign({}, MARCHI[el.dataset.marchio], { logoAzienda: p.marchio.logoAzienda }); });
  R.azioni['mk-ed-logo'] = (el) => cambia((p) => { p.marchio.logoAzienda = el.checked; });

  /* "Chiedi all'AI" nell'editor classico: risposta simulata */
  const PROPOSTE = {
    zes: ['Investi nel 2026? Recupera fino al 60% con la ZES Unica', 'Fino al 60% del tuo investimento ti torna come credito d\'imposta', 'Macchinari e capannoni al Sud: la ZES Unica ne copre fino al 60%'],
    sud: ['Apri la tua attività al Sud con il 75% a fondo perduto', 'Hai meno di 35 anni e un\'idea? Resto al Sud la finanzia', 'La tua attività al Sud, finanziata fino al 75%'],
    titolo: ['Scopri in 2 minuti se puoi ottenere il contributo', 'Ti diciamo gratis quanto puoi ottenere', 'Il tuo progetto merita un aiuto: verifichiamo insieme'],
    pulsante: ['Verifica gratis se puoi accedere', 'Scopri quanto puoi ottenere', 'Richiedi la verifica gratuita'],
  };
  R.azioni['mk-ed-ai'] = (el) => {
    const p = pagEd();
    if (!p) return;
    if (!R.serveConnessione('la richiesta all\'AI')) return;
    const bl = p.blocchi.find((x) => x.id === ed.sel && ['titolo', 'testo', 'pulsante'].includes(x.tipo)) || p.blocchi.find((x) => x.tipo === 'titolo');
    if (!bl) { R.avviso('Aggiungi un titolo alla pagina, poi chiedi all\'AI di migliorarlo'); return; }
    el.disabled = true; el.textContent = 'In corso…';
    setTimeout(() => {
      const n = (ed.nProposte = (ed.nProposte || 0) + 1);
      let testo;
      if (bl.tipo === 'testo') testo = (String(bl.testo).split(/(?<=\.)\s/)[0] || bl.testo).replace(/\.$/, '') + '. Te lo diciamo gratis in una telefonata.';
      else {
        const t = (bl.testo + ' ' + funnel(p.funnel).nome).toLowerCase();
        const lista = bl.tipo === 'pulsante' ? PROPOSTE.pulsante : t.includes('zes') ? PROPOSTE.zes : t.includes('sud') ? PROPOSTE.sud : PROPOSTE.titolo;
        testo = lista[n % lista.length];
      }
      ed.proposta = { id: bl.id, tipo: bl.tipo, testo };
      ed.sel = bl.id;
      R.aggiorna();
    }, 900);
  };
  R.azioni['mk-ed-ai-usa'] = () => {
    const pr = ed.proposta;
    if (!pr) return;
    cambia((p) => { const bl = p.blocchi.find((x) => x.id === pr.id); if (bl) bl.testo = pr.testo; ed.proposta = null; });
    R.avviso('Testo dell\'AI usato nella bozza');
  };
  document.addEventListener('keydown', (ev) => {
    if (!/^#\/editor(-ai)?\//.test(location.hash) || !(ev.ctrlKey || ev.metaKey)) return;
    if (ev.target.closest('input, textarea, select') || R.modaleAperta()) return;
    const k = ev.key.toLowerCase();
    if (k === 'z' && !ev.shiftKey) { ev.preventDefault(); R.azioni['mk-ed-annulla'](); }
    else if (k === 'y' || (k === 'z' && ev.shiftKey)) { ev.preventDefault(); R.azioni['mk-ed-ripeti'](); }
  });
  let eraTelefono = telefono();
  window.addEventListener('resize', () => {
    const ora = telefono();
    if (ora === eraTelefono) return;
    eraTelefono = ora;
    if (/^#\/(editor|editor-ai|marketing\/moduli\/)/.test(location.hash) && !R.modaleAperta()) R.aggiorna();
  });

  /* ================= Pubblica (editor classico e con l'AI) ================= */
  function differenze(x) {
    if (!x.pubblicati) return null;
    const prima = new Map(x.pubblicati.map((y) => [y.id, JSON.stringify(y)]));
    const dopo = new Map(x.blocchi.map((y) => [y.id, JSON.stringify(y)]));
    let agg = 0; let mod = 0; let tolti = 0;
    dopo.forEach((v, k) => { if (!prima.has(k)) agg++; else if (prima.get(k) !== v) mod++; });
    prima.forEach((v, k) => { if (!dopo.has(k)) tolti++; });
    const parti = [];
    if (agg) parti.push(agg + (agg === 1 ? ' elemento nuovo' : ' elementi nuovi'));
    if (mod) parti.push(mod + (mod === 1 ? ' elemento modificato' : ' elementi modificati'));
    if (tolti) parti.push(tolti + (tolti === 1 ? ' elemento tolto' : ' elementi tolti'));
    if (!parti.length) parti.push('cambia l\'ordine o i colori degli elementi');
    return parti.join(', ');
  }
  R.azioni['mk-pubblica'] = (el) => {
    const p = pagina(el.dataset.id);
    const f = funnel(p.funnel);
    if (p.costruisci) { R.avviso('Aspetta che l\'AI finisca di costruire la pagina, poi pubblica'); return; }
    if (!p.blocchi.length) { R.avviso('La pagina è vuota: aggiungi almeno un elemento prima di pubblicare'); return; }
    const pagine = pagineDi(f.id);
    const daPubblicare = pagine.filter((x) => !x.pubblicati || !uguali(x.blocchi, x.pubblicati));
    if (f.stato === 'online' && !daPubblicare.length) {
      R.modale({ titolo: 'Niente da pubblicare', classe: 'stretta', sottotitolo: 'La pagina online è già uguale alla bozza.', corpo: `<div class="mk-link-pubblico"><a href="${percorsoPubblico(p)}">https://${esc(indirizzoPagina(p))}</a></div>`, pulsanti: [{ testo: 'Chiudi', chiudi: true }] });
      return;
    }
    const domini = [sottodominio()].concat(R.stato.domini.filter((d) => d.stato === 'verde' && d.id !== 'do2').map((d) => d.nome));
    const cosa = f.stato !== 'online'
      ? [`<b>${esc(f.nome)}</b> diventa visibile a tutti all'indirizzo qui sotto.`].concat(pagine.length > 1 ? [`Si pubblicano insieme ${pagine.length} pagine: ${pagine.map((x) => esc(x.nome)).join(', ')}.`] : [])
      : daPubblicare.map((x) => `<b>${esc(x.nome)}</b>: ${x.pubblicati ? differenze(x) : 'nuova pagina, diventa visibile'}.`);
    if (p.ab && p.ab.attiva && f.stato !== 'online') cosa.push('La prova A/B del titolo parte con la pubblicazione.');
    R.modale({
      titolo: f.stato === 'online' ? 'Pubblicare le modifiche?' : 'Pubblicare la pagina?',
      sottotitolo: 'Ecco cosa cambia online. Chi ha già la pagina aperta vede le novità al prossimo caricamento.',
      corpo: `<ul style="margin:0 0 16px;padding-left:20px;line-height:1.6">${cosa.map((c) => `<li>${c}</li>`).join('')}</ul>
        <div class="griglia g-2" style="gap:10px"><div class="gruppo-campo"><label class="etichetta-campo" for="mk-pub-dom">Dominio</label><select class="campo" id="mk-pub-dom" name="dominio">${domini.map((d) => `<option value="${esc(d)}" ${d === f.dominio ? 'selected' : ''}>${esc(d)}${d === sottodominio() ? ' (gratuito)' : ''}</option>`).join('')}</select></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-pub-perc">Indirizzo della pagina</label><input class="campo" id="mk-pub-perc" name="percorso" value="${esc(f.percorsoPagina)}"></div></div>
        <p class="piccolo secondario" style="margin:0">L'indirizzo sul sottodominio gratuito della tua azienda è sempre pronto. Un dominio tuo è facoltativo: lo colleghi in <a class="link verde" href="#/marketing/domini">Domini</a>.</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Pubblica', classe: 'primario', fai(fin) {
        const v = R.valori(fin);
        const perc = slug(v.percorso);
        if (!v.percorso) { R.erroreCampo(fin, 'percorso', 'Scrivi l\'indirizzo della pagina, per esempio bonus-giovani.'); return false; }
        if (R.stato.funnel.some((x) => x.id !== f.id && x.percorsoPagina === perc)) { R.erroreCampo(fin, 'percorso', 'Questo indirizzo è già usato da un\'altra pagina. Scegline un altro.'); return false; }
        if (!R.serveConnessione('la pubblicazione')) return false;
        f.dominio = v.dominio; f.percorsoPagina = perc; aggiornaIndirizzo(f);
        pagine.forEach((x) => { x.pubblicati = JSON.parse(JSON.stringify(x.blocchi)); });
        f.stato = 'online'; f.pubblicataIl = R.adesso(); segnaModifica(f);
        R.salva();
        setTimeout(() => avanzamentoPubblica(p), 20);
      } }],
    });
  };
  async function avanzamentoPubblica(p) {
    const f = funnel(p.funnel);
    const ind = indirizzoPagina(p);
    R.modale({ titolo: 'Pubblicazione', classe: 'stretta', corpo: '<div class="mk-fasi-pubblica" id="mk-fasi" aria-live="polite"></div><div id="mk-fine-pub"></div>', senzaFuoco: true });
    R.aggiorna();
    const zona = () => document.getElementById('mk-fasi');
    const passo = async (inCorso, fatto, ms) => {
      if (!zona()) return false;
      const riga = document.createElement('div');
      riga.innerHTML = `${R.icona('orologio', 18)}<span>${inCorso}</span>`;
      zona().appendChild(riga);
      await R.dormi(ms);
      riga.innerHTML = `${R.icona('spunta', 18)}<span class="ok">${fatto}</span>`;
      return true;
    };
    if (!(await passo('Pubblicazione delle pagine…', 'Pagine pubblicate', 700))) return;
    if (!(await passo('Controllo che la pagina risponda…', 'La pagina risponde', 1000))) return;
    const fine = document.getElementById('mk-fine-pub');
    if (!fine) return;
    fine.innerHTML = `<div class="mk-link-pubblico"><a href="${percorsoPubblico(p)}">https://${esc(ind)}</a><button class="btn piccolo" data-azione="mk-copia-link" data-link="https://${esc(ind)}">${R.icona('copia', 15)} Copia</button></div>
      <p class="piccolo secondario">${f.dominio === sottodominio() ? 'Pubblicata sul sottodominio gratuito della tua azienda.' : 'Pubblicata sul tuo dominio, con certificato di sicurezza.'} Nel prototipo il link apre la pagina dentro questo sito.</p>
      <div class="piede-modale" style="margin-top:12px"><button class="btn secondario-campo" data-azione="vai" data-dove="#/marketing/funnel/${f.id}">Vai al funnel</button><button class="btn primario" data-azione="vai" data-dove="${percorsoPubblico(p)}">Apri la pagina</button></div>`;
  }
  R.azioni['mk-copia-link'] = (el) => {
    try { navigator.clipboard.writeText(el.dataset.link); } catch (e) { /* il prototipo funziona anche senza */ }
    R.avviso('Link copiato');
  };

  /* ================= Editor con l'AI (immagine 16) e percorso 9 ================= */
  let costruzioneAttiva = null;
  function pianoAI(d, nome) {
    const n = nuovoBlocco;
    const wa = /whatsapp/.test(d);
    const regione = (d.match(/campania|puglia|calabria|sicilia|basilicata|sardegna|molise|abruzzo/) || [])[0];
    const giovani = /35|giovan/.test(d);
    const etichetta = [giovani ? 'Under 35' : '', regione ? R.maiuscola(regione) : ''].filter(Boolean).join(' · ');
    const titolo = /resto al sud/.test(d) ? 'Apri la tua attività con Resto al Sud 2.0' : /zes/.test(d) ? 'Investi al Sud con la ZES Unica 2026' : /microcredit/.test(d) ? 'Microcredito fino a 50.000 € senza garanzie' : nome;
    const sottotitolo = /resto al sud/.test(d) ? 'Fino al 75% a fondo perduto. Ti seguiamo noi, dalla domanda all\'avvio.' : 'Ti diciamo gratis se puoi accedere e quanto puoi ottenere.';
    const piano = [
      { nome: 'Apertura', blocchi: [n('intestazione', { testo: 'inizio', pulsante: wa ? 'WhatsApp' : '', colore: 'whatsapp' }), n('titolo', { sfondo: 'marchio', colonna: 'sx', etichetta, testo: titolo, colore: 'chiaro', dimensione: 'L' }), n('testo', { sfondo: 'marchio', colonna: 'sx', testo: sottotitolo }), n('pulsante', { sfondo: 'marchio', colonna: 'sx', testo: 'Verifica se puoi accedere', colore: 'chiaro' }), n('immagine', { sfondo: 'marchio', colonna: 'dx', testo: giovani ? 'Foto: giovane artigiano' : 'Foto: imprenditore al lavoro' })] },
      { nome: 'Chi può partecipare', blocchi: [n('riquadri', { voci: [{ t: 'Chi può partecipare', s: giovani ? 'Giovani dai 18 ai 35 anni' + (regione ? ' in ' + R.maiuscola(regione) : '') + '.' : 'Imprese e professionisti che vogliono investire.' }, { t: 'Quanto puoi ottenere', s: /resto al sud/.test(d) ? 'Fino al 75% a fondo perduto.' : 'Una parte dell\'investimento, a fondo perduto o come credito.' }, { t: 'Come funziona', s: 'Verifichiamo i requisiti, prepariamo la domanda e ti seguiamo.' }] })] },
    ];
    if (/video/.test(d)) piano.push({ nome: 'Video', blocchi: [n('video', { sfondo: 'tenue', testo: 'Come funziona, in 2 minuti' })] });
    if (/domand|faq/.test(d)) piano.push({ nome: 'Domande frequenti', blocchi: [n('faq', { sfondo: 'tenue', testo: 'Domande frequenti', voci: [{ d: 'Quanto costa la verifica?', r: 'Niente: ti diciamo gratis se puoi accedere.' }, { d: 'Quanto tempo ci vuole?', r: 'Di solito la risposta arriva in 2–3 mesi dalla domanda.' }, { d: 'Quali documenti servono?', r: 'Per iniziare bastano un documento d\'identità e una descrizione del progetto.' }] })] });
    piano.push({ nome: 'Modulo', blocchi: [n('modulo', { modulo: 'mo1', testo: 'Verifica gratis se puoi accedere', sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Verifica se puoi accedere' })] });
    if (wa) piano.push({ nome: 'WhatsApp', blocchi: [n('whatsapp', { sfondo: 'tenue', testo: 'Preferisci scriverci? Ti rispondiamo su WhatsApp.', pulsante: 'Scrivici su WhatsApp', colore: 'whatsapp' })] });
    if (/mappa|indirizzo|sede/.test(d)) piano.push({ nome: 'Mappa', blocchi: [n('mappa', { testo: 'Dove siamo', sotto: 'Via Toledo 156, Napoli' })] });
    return piano;
  }
  const chatAI = (p, testo, extra) => { p.chat.push(Object.assign({ da: 'ai', testo }, extra || {})); };
  const suEditorAI = (p) => location.hash.split('?')[0] === '#/editor-ai/' + p.id;
  async function costruisci(p) {
    if (costruzioneAttiva === p.id) return;
    costruzioneAttiva = p.id;
    p.blocchi = [];
    const f = funnel(p.funnel);
    const piano = pianoAI(p.costruisci.toLowerCase(), f.nome);
    chatAI(p, 'Sto costruendo la pagina, una sezione alla volta…', { lavoro: true });
    R.salva();
    if (suEditorAI(p)) R.aggiorna();
    for (let i = 0; i < piano.length; i++) {
      await R.dormi(750);
      if (!pagina(p.id)) { costruzioneAttiva = null; return; }
      p.blocchi.push(...piano[i].blocchi);
      p.chat[p.chat.length - 1].testo = `Sto costruendo la pagina: sezione ${i + 1} di ${piano.length}, ${piano[i].nome.toLowerCase()}…`;
      p.salvato = R.adesso();
      R.salva();
      if (suEditorAI(p)) { ridisegnaTele(p); aggiornaChat(p); }
    }
    p.chat.pop();
    chatAI(p, `Fatto. Ho creato ${piano.length} sezioni. Clicca su una per cambiarla:`, { sezioni: piano.map((s, i) => ({ n: (i + 1) + ' ' + s.nome, id: s.blocchi[s.nome === 'Apertura' ? 1 : 0].id })) });
    chatAI(p, 'Aggiunta. Vuoi provare anche una seconda versione del titolo per la prova A/B?');
    delete p.costruisci;
    costruzioneAttiva = null;
    salvaBozza(p);
    if (suEditorAI(p)) R.aggiorna();
  }
  function htmlChat(p) {
    return p.chat.map((m) => `<div class="mk-msg ${m.da === 'tu' ? 'tu' : 'ai'}">${esc(m.testo)}${m.sezioni ? `<div>${m.sezioni.map((s) => `<button class="chip ${s.id === ed.sel ? 'attivo' : ''}" data-azione="mk-ai-sezione" data-id="${s.id}">${esc(s.n)}</button>`).join('')}</div>` : ''}</div>`).join('');
  }
  function aggiornaChat(p) {
    const c = document.getElementById('mk-msgs');
    if (!c) return;
    c.innerHTML = htmlChat(p);
    c.scrollTop = c.scrollHeight;
  }

  R.rotta('/editor-ai/:id', {
    menu: 'marketing', pieno: true,
    titolo: 'Costruisci con l\'AI',
    disegna(par) {
      assicura();
      const p = pagina(par.id);
      if (!p || !funnel(p.funnel)) return '<div class="riquadro vuoto" style="margin:20px">Questa pagina non esiste più. <a class="link verde" href="#/marketing/funnel">Torna a Funnel e pagine</a></div>';
      apriEditor(p.id);
      const f = funnel(p.funnel);
      const tel = telefono();
      const inCostruzione = !!p.costruisci;
      const ultima = p.chat[p.chat.length - 1];
      const suggerimenti = inCostruzione ? [] : (ultima && /versione del titolo/.test(ultima.testo) && !(p.ab && p.ab.attiva) ? ['Sì, crea la versione B', 'Usa il mio logo', 'Testi più brevi'] : ['Testi più brevi', 'Usa il mio logo', 'Aggiungi il pulsante WhatsApp', 'Crea la versione B del titolo'])
        .filter((x) => !(/logo/i.test(x) && p.marchio.logoAzienda) && !(/whatsapp/i.test(x) && p.blocchi.some((y) => y.tipo === 'whatsapp')) && !(/versione b/i.test(x) && p.ab && p.ab.attiva));
      return `<div class="barra-editor">
          <a class="btn tondo secondario-campo" href="#/marketing/funnel/${f.id}" aria-label="Torna al funnel">${R.icona('freccia-sinistra')}</a>
          <div class="nome-editor"><b>${esc(f.nome)} · ${esc(p.nome)}</b><span id="mk-salv" class="mk-stato-salv">${p.pubblicati ? (uguali(p.blocchi, p.pubblicati) ? 'Pubblicata' : 'Modifiche non pubblicate') : 'Bozza'} · ${esc(indirizzoPagina(p))}</span></div>
          <div class="riga-flex" style="gap:8px">
            ${tel ? '' : `<a class="btn secondario-campo" href="#/editor/${p.id}">Modifica a mano</a>`}
            ${tel && f.stato !== 'bozza' ? `<button class="btn secondario-campo" data-azione="mk-funnel-pausa" data-id="${f.id}">${f.stato === 'online' ? 'Metti in pausa' : 'Rimetti online'}</button>` : ''}
            <a class="btn secondario-campo" href="${percorsoPubblico(p)}?anteprima=1">Anteprima</a>
            <button class="btn primario" data-azione="mk-pubblica" data-id="${p.id}" ${inCostruzione ? 'disabled' : ''}>Pubblica</button>
          </div>
        </div>
        ${tel ? '<div class="mk-avviso-tel"><b>La costruzione completa si fa da computer:</b> dal telefono puoi vedere, chiedere piccole modifiche, pubblicare e mettere in pausa.</div>' : ''}
        <div class="mk-ai-area">
          <section class="mk-chat" aria-label="Costruisci con l'AI">
            <div class="riga-flex" style="margin-bottom:14px;flex-wrap:nowrap"><span class="quadratino" style="background:var(--lime);color:var(--scuro);font-size:14px">AI</span><div><div style="font-family:var(--titoli);font-weight:700;font-size:20px;letter-spacing:-0.02em">Costruisci con l'AI</div><div class="piccolo" style="opacity:.75">Descrivi la pagina, poi ritocca</div></div></div>
            <div class="msgs" id="mk-msgs" aria-live="polite">${htmlChat(p)}</div>
            <div class="mk-suggerimenti">${suggerimenti.map((s) => `<button data-azione="mk-ai-suggerimento" data-testo="${esc(s)}">${esc(s)}</button>`).join('')}</div>
            <form class="mk-scrivi" onsubmit="return false"><input id="mk-ai-input" placeholder="Chiedi una modifica" aria-label="Chiedi una modifica" autocomplete="off" ${inCostruzione ? 'disabled' : ''}><button class="btn piccolo lime" data-azione="mk-ai-invia" ${inCostruzione ? 'disabled' : ''}>Invia</button></form>
          </section>
          ${tel ? '' : `<div class="mk-zona"><span class="cartellino">Computer</span><div class="mk-foglio" id="mk-ai-computer">${htmlPagina(p, { modo: 'editor', sel: ed.sel, solo: true, vuoto: 'La pagina si sta costruendo…' })}</div>
            <div class="mk-barra-ai" role="toolbar" aria-label="Aggiungi elementi"><button class="lime" data-azione="mk-ai-tendina" data-cosa="sezione">+ Sezione</button><button data-azione="mk-ed-aggiungi" data-tipo="testo">Testo</button><button data-azione="mk-ed-aggiungi" data-tipo="immagine">Immagine</button><button data-azione="mk-ed-aggiungi" data-tipo="pulsante">Pulsante</button><button data-azione="mk-ed-aggiungi" data-tipo="modulo">Modulo</button><button data-azione="mk-ai-tendina" data-cosa="colori">Colori e caratteri</button></div></div>`}
          <div class="mk-zona mk-zona-tel"><span class="cartellino">Telefono</span><div class="mk-cornice" id="mk-ai-telefono">${htmlPagina(p, { modo: 'anteprima', vuoto: '…' })}</div></div>
        </div>`;
    },
    dopo(par) {
      const p = pagina(par.id);
      if (!p) return;
      const c = document.getElementById('mk-msgs');
      if (c) c.scrollTop = c.scrollHeight;
      if (p.costruisci) costruisci(p);
    },
  });
  R.azioni['mk-ai-sezione'] = (el) => {
    const p = pagEd();
    if (!p) return;
    ed.sel = el.dataset.id;
    R.aggiorna();
    const bl = p.blocchi.find((x) => x.id === ed.sel);
    const inp = document.getElementById('mk-ai-input');
    if (inp && bl) { inp.placeholder = 'Cosa cambio in "' + NOMI[bl.tipo] + '"?'; inp.focus(); }
  };
  R.azioni['mk-ai-tendina'] = (el) => {
    if (el.dataset.cosa === 'sezione') R.tendina(el, `<div class="titolo-tendina">Aggiungi una sezione pronta</div>${SEZIONI.map(([n], i) => `<button data-azione="mk-ai-sezione-pronta" data-i="${i}">${R.icona('piu', 15)} ${n}</button>`).join('')}`);
    else R.tendina(el, `<div class="titolo-tendina">Colori del marchio</div>${Object.keys(MARCHI).map((k) => `<button data-azione="mk-ai-marchio" data-marchio="${k}"><span class="mk-semaforo" style="background:${MARCHI[k].primario}"></span>${R.maiuscola(k)}</button>`).join('')}<div class="titolo-tendina">Caratteri: Bricolage Grotesque e Plus Jakarta Sans</div>`);
  };
  R.azioni['mk-ai-sezione-pronta'] = (el) => { R.chiudiTendina(); R.azioni['mk-ed-sezione'](el); };
  R.azioni['mk-ai-marchio'] = (el) => { R.chiudiTendina(); R.azioni['mk-ed-marchio'](el); };
  R.azioni['mk-ai-suggerimento'] = (el) => { const i = document.getElementById('mk-ai-input'); if (i) i.value = el.dataset.testo; R.azioni['mk-ai-invia'](); };
  R.azioni['mk-ai-invia'] = async () => {
    const p = pagEd();
    const inp = document.getElementById('mk-ai-input');
    if (!p || !inp || p.costruisci) return;
    const testo = inp.value.trim();
    if (!testo) { inp.focus(); return; }
    if (!R.serveConnessione('la richiesta all\'AI')) return;
    inp.value = '';
    p.chat.push({ da: 'tu', testo });
    chatAI(p, 'Ci lavoro…');
    aggiornaChat(p);
    document.querySelectorAll('[data-azione="mk-ai-invia"], #mk-ai-input').forEach((x) => { x.disabled = true; });
    await R.dormi(900);
    p.chat.pop();
    memorizza(p);
    chatAI(p, rispostaAI(p, testo.toLowerCase()));
    salvaBozza(p);
    if (suEditorAI(p)) R.aggiorna();
  };
  /* Più richieste nella stessa frase ("testi più brevi e usa il mio logo"): le esegue tutte. */
  function rispostaAI(p, t) {
    const parti = t.split(/\s+e\s+|,|;|\.\s/).map((x) => x.trim()).filter(Boolean);
    if (parti.length > 1) {
      const risposte = [];
      let capite = 0;
      parti.forEach((x) => { const r = rispostaSingola(p, x, true); if (r) { risposte.push(r); capite++; } });
      if (capite) return risposte.join(' ');
    }
    return rispostaSingola(p, t, false);
  }
  function rispostaSingola(p, t, soloRegole) {
    const titoli = p.blocchi.filter((x) => x.tipo === 'titolo');
    const scelto = p.blocchi.find((x) => x.id === ed.sel);
    if (/brev|cort|riassum|meno test/.test(t)) {
      let n = 0;
      p.blocchi.forEach((x) => {
        if (x.tipo === 'testo' || x.tipo === 'whatsapp') { const c = String(x.testo).split(/(?<=\.)\s/)[0]; if (c !== x.testo) { x.testo = c; n++; } }
        if (x.tipo === 'riquadri' || x.tipo === 'faq') (x.voci || []).forEach((v) => { const k = v.s != null ? 's' : 'r'; const c = String(v[k]).split(/(?<=\.)\s/)[0]; if (c !== v[k]) { v[k] = c; n++; } });
      });
      return n ? `Fatto: ho accorciato ${n} ${n === 1 ? 'testo' : 'testi'}. I titoli restano uguali.` : 'I testi sono già brevi: una frase per sezione. Se vuoi, dimmi quale sezione accorciare ancora.';
    }
    if (/logo/.test(t)) { p.marchio.logoAzienda = true; return `Ho messo il logo di ${(R.azienda() || {}).nome} nell'intestazione, al posto della scritta.`; }
    if (/versione b|a\/b|\bab\b|seconda versione/.test(t)) {
      const tit = titoli[0];
      if (!tit) return 'La pagina non ha ancora un titolo: aggiungine uno e poi creo la versione B.';
      const lista = /sud/.test(tit.testo.toLowerCase()) ? PROPOSTE.sud : /zes/.test(tit.testo.toLowerCase()) ? PROPOSTE.zes : PROPOSTE.titolo;
      const titoloB = lista.find((x) => x !== tit.testo) || lista[0];
      p.ab = { attiva: true, divisione: 50, titoloB, visiteA: 0, visiteB: 0, contattiA: 0, contattiB: 0 };
      return `Ho creato la versione B del titolo: "${titoloB}". La prova A/B parte quando pubblichi: metà dei visitatori vedrà la A, metà la B.`;
    }
    const colore = (t.match(/\b(blu|verde|rosso|rossa)\b/) || [])[1];
    if (colore) { const k = colore.startsWith('ross') ? 'rosso' : colore; p.marchio = Object.assign({}, MARCHI[k], { logoAzienda: p.marchio.logoAzienda }); return `Ho cambiato i colori della pagina: ora è ${k === 'rosso' ? 'rossa' : k} e bianca.`; }
    if (/whatsapp/.test(t)) {
      if (p.blocchi.some((x) => x.tipo === 'whatsapp')) return 'Il pulsante WhatsApp c\'è già, in fondo alla pagina. Vuoi che lo metta anche in alto?';
      const i = p.blocchi.findIndex((x) => x.tipo === 'modulo');
      p.blocchi.splice(i >= 0 ? i + 1 : p.blocchi.length, 0, nuovoBlocco('whatsapp', Object.assign({ sfondo: 'tenue' }, NUOVI.whatsapp)));
      return 'Ho aggiunto il pulsante "Scrivici su WhatsApp" sotto il modulo.';
    }
    if (/domand|faq/.test(t)) {
      const fq = p.blocchi.find((x) => x.tipo === 'faq');
      if (fq) { fq.voci.push({ d: 'Posso chiedere la verifica anche se non ho ancora la partita IVA?', r: 'Sì: la verifica è gratuita e serve proprio a capire da dove partire.' }); return 'Ho aggiunto una domanda frequente sulla partita IVA.'; }
      p.blocchi.push(nuovoBlocco('faq', Object.assign({ sfondo: 'tenue' }, JSON.parse(JSON.stringify(NUOVI.faq)))));
      return 'Ho aggiunto la sezione Domande frequenti in fondo. Scrivimi le domande che ti fanno più spesso e le inserisco.';
    }
    if (/foto|immagine/.test(t)) {
      const im = p.blocchi.find((x) => x.tipo === 'immagine');
      const cosa = (t.match(/(?:foto|immagine) (?:di |con |del |della )?(.+)$/) || [])[1];
      if (im) { im.testo = 'Foto: ' + (cosa ? cosa.replace(/[.]$/, '') : 'persona al lavoro'); return `Ho cambiato la foto dell'apertura: "${im.testo}". Nel software vero la scegli dalla Libreria file o la carichi.`; }
      return 'Non c\'è un\'immagine nella pagina: aggiungila con il pulsante "Immagine" sotto l\'anteprima.';
    }
    if (soloRegole) return null;
    if (scelto &&['titolo', 'testo', 'pulsante'].includes(scelto.tipo)) {
      const lista = scelto.tipo === 'pulsante' ? PROPOSTE.pulsante : scelto.tipo === 'testo' ? null : PROPOSTE.titolo;
      if (lista) { scelto.testo = lista.find((x) => x !== scelto.testo); return `Ho riscritto ${NOMI[scelto.tipo].toLowerCase()}: "${scelto.testo}".`; }
      scelto.testo = String(scelto.testo).split(/(?<=\.)\s/)[0] + ' Te lo diciamo gratis in una telefonata.';
      return 'Ho reso il testo più diretto.';
    }
    return 'Ho capito. In questo prototipo so fare queste modifiche: testi più brevi, usare il tuo logo, cambiare i colori, aggiungere WhatsApp, domande frequenti o una foto, creare la versione B del titolo. Puoi anche cliccare una sezione e chiedermi di riscriverla.';
  }

  /* ================= Pagina pubblica (percorso 1) ================= */
  let ultimoInvio = null;
  const visitate = new Set();
  const neutro = (titolo, testo) => `<div class="pp"><div class="pp-pubblica-vuota"><div><div style="font-family:'Bricolage Grotesque',system-ui;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#1B1D1A">${titolo}</div><p style="margin:8px 0 0">${testo}</p></div></div></div>`;
  function versioneAB(p) {
    if (!p.ab || !p.ab.attiva) return 'A';
    let v = null;
    try { v = sessionStorage.getItem('mk-ab-' + p.id); } catch (e) { /* niente */ }
    if (!v) { v = Math.random() * 100 < p.ab.divisione ? 'A' : 'B'; try { sessionStorage.setItem('mk-ab-' + p.id, v); } catch (e) { /* niente */ } }
    return v;
  }
  function paginaPubblica(perc, sotto, q) {
    assicura();
    const f = R.stato.funnel.find((x) => x.percorsoPagina === perc && !x.eliminato);
    const anteprimaBozza = q.anteprima === '1';
    let p = f && pagineDi(f.id).find((x) => (x.sotto || '') === (sotto || ''));
    if (f && !p && sotto === 'grazie' && ultimoInvio && ultimoInvio.funnel === f.id) {
      const pr = principale(f.id);
      p = { id: 'grazie-' + f.id, funnel: f.id, sotto: 'grazie', tipo: 'grazie', nome: 'Grazie', marchio: pr.marchio, blocchi: paginaGrazie(), pubblicati: paginaGrazie() };
    }
    if (!f || !p) return neutro('Pagina non trovata', 'L\'indirizzo potrebbe essere sbagliato oppure la pagina non esiste più.');
    const pubblicati = p.pubblicati || (p.tipo === 'grazie' && ultimoInvio && ultimoInvio.funnel === f.id ? p.blocchi : null);
    if (!anteprimaBozza && (f.stato !== 'online' || !pubblicati)) return neutro('Questa pagina non è disponibile', 'Torna a trovarci più tardi.');
    let blocchi = anteprimaBozza ? p.blocchi : pubblicati;
    if (!anteprimaBozza && versioneAB(p) === 'B') {
      blocchi = JSON.parse(JSON.stringify(blocchi));
      const t = blocchi.find((x) => x.tipo === 'titolo');
      if (t) t.testo = p.ab.titoloB;
    }
    const barra = anteprimaBozza ? `<div class="mk-separatore-prototipo"><div class="banner giallo" style="margin:10px auto;max-width:1000px"><div class="principale"><b>Anteprima della bozza.</b> Così vedrà la pagina un visitatore. ${f.stato === 'online' && p.pubblicati ? 'Online c\'è ancora la versione pubblicata.' : 'Non è ancora online.'}</div>${pagina(p.id) ? `<a class="btn piccolo" href="#/editor/${p.id}">Torna all'editor</a>` : ''}</div></div>` : '';
    const esito = p.tipo === 'grazie' && !anteprimaBozza && ultimoInvio && ultimoInvio.funnel === f.id ? riquadroEsito(ultimoInvio) : '';
    return barra + htmlPagina(p, { modo: 'pubblica', blocchi, paginaId: p.id }) + esito;
  }
  function dopoPubblica(perc, sotto, q) {
    const f = R.stato.funnel.find((x) => x.percorsoPagina === perc);
    const chiave = perc + '/' + (sotto || '');
    if (!f || f.stato !== 'online' || q.anteprima === '1' || sotto || visitate.has(chiave)) return;
    visitate.add(chiave);
    f.visite = (f.visite || 0) + 1;
    R.salva();
  }
  R.rotta('/pagina/:percorso', { pubblica: true, titolo: (par) => { const f = R.stato.funnel.find((x) => x.percorsoPagina === par.percorso); return f ? f.nome : 'Pagina'; }, disegna: (par, q) => paginaPubblica(par.percorso, '', q), dopo: (par, q) => dopoPubblica(par.percorso, '', q) });
  R.rotta('/pagina/:percorso/:sotto', { pubblica: true, titolo: 'Grazie', disegna: (par, q) => paginaPubblica(par.percorso, par.sotto, q), dopo: (par, q) => dopoPubblica(par.percorso, par.sotto, q) });

  function riquadroEsito(u) {
    const r = u.r || null;
    const c = r ? (r.contatto && typeof r.contatto === 'object' ? r.contatto : R.contatto(r.contatto)) : null;
    const a = r ? (r.affare && typeof r.affare === 'object' ? r.affare : R.affare(r.affare)) : null;
    const f = funnel(u.funnel);
    const mo = modulo(f.modulo) || modulo('mo1');
    const perc = a ? R.percorso(a.percorso) : R.percorso(mo.dopo.percorso);
    const fase = a ? R.fase(a.percorso, a.fase) : R.fase(mo.dopo.percorso, mo.dopo.fase);
    const resp = a ? (a.responsabile ? R.utenteDa(a.responsabile).nome : null) : (mo.dopo.responsabile === 'turno' ? 'assegnato a turno' : R.utenteDa(mo.dopo.fisso).nome);
    const nome = esc((c && c.nome) || u.dati.nome);
    const voci = [
      u.collegato && r ? (r.nuovo === false ? `Contatto già presente: <b>${nome}</b> aggiornato. Il modulo riempie solo i campi vuoti; i valori diversi sono nella storia.` : `Contatto creato: <b>${nome}</b>`) : `Contatto creato o aggiornato: <b>${nome}</b> (stesso telefono o email = stesso contatto)`,
      `Affare in <b>${esc((perc || {}).nome || 'Finanza agevolata')} · ${esc((fase || {}).nome || 'Nuovo contatto')}</b>`,
      `Responsabile: <b>${resp ? esc(resp) : 'nessuno, promemoria a tutti gli amministratori'}</b>`,
      `WhatsApp di benvenuto <b>in coda</b>: parte subito se siete nell'orario di invio, altrimenti all'apertura${u.dati.consensoWhatsapp ? '' : ' (il visitatore non ha dato il consenso ai messaggi successivi)'}`,
      'Promemoria per il responsabile: <b>richiamare entro 1 ora di lavoro</b>',
      'Avviso nella campanella e su WhatsApp al responsabile',
      `Fonte e campagna salvate: <b>${esc(u.dati.campagna)}</b> · ${esc(u.dati.pagina)}`,
    ];
    return `<div class="mk-separatore-prototipo"><section class="mk-cosa-successo" aria-label="Prototipo: cosa è successo nel software">
      <div class="piccolo" style="color:var(--lime)">Questo riquadro non lo vede il visitatore</div>
      <h2>Prototipo · cosa è successo nel software</h2>
      ${!u.collegato ? '<p class="piccolo" style="opacity:.85;margin:6px 0 0">In questa versione del prototipo la parte che crea il contatto non è ancora collegata: ecco cosa farà il software.</p>' : ''}
      ${u.errore ? `<p class="piccolo" style="color:#F4A79D;margin:6px 0 0">Il prototipo ha avuto un errore nel creare il contatto: ${esc(u.errore)}</p>` : ''}
      <ul>${voci.map((v) => `<li>${R.icona('spunta', 16)}<span>${v}</span></li>`).join('')}</ul>
      <div class="riga-flex">${c ? `<a class="btn lime" href="#/contatto/${esc(c.id)}">Vedi il contatto</a>` : ''}<a class="btn" href="#/affari">Vai agli Affari</a><a class="btn scuro" style="background:var(--scuro-2)" href="#/marketing/funnel/${f.id}">Torna al funnel</a></div>
    </section></div>`;
  }

  R.azioni['mk-pp-clic'] = (el) => {
    const t = el.dataset.tipo;
    if (t === 'modulo') {
      const form = document.querySelector('.pp-form');
      if (form) { form.scrollIntoView({ behavior: 'smooth', block: 'start' }); const i = form.querySelector('input:not([type=hidden]), select'); if (i) setTimeout(() => i.focus({ preventScroll: true }), 450); }
      else R.avviso('Questa pagina non ha un modulo: aggiungilo nell\'editor');
      return;
    }
    if (t === 'successiva') {
      const p = pagina(el.dataset.pagina);
      const tutte = p ? pagineDi(p.funnel) : [];
      const dopo = tutte[tutte.findIndex((x) => x.id === p.id) + 1];
      if (dopo) { R.vai(percorsoPubblico(dopo)); return; }
    }
    const testi = { whatsapp: 'Prototipo: qui si aprirebbe WhatsApp con il numero dell\'azienda', video: 'Prototipo: qui si caricherebbe il video, solo dopo il tocco', file: 'Prototipo: qui partirebbe il download della brochure', link: 'Prototipo: qui si aprirebbe il link scelto nell\'editor', privacy: 'Prototipo: qui si aprirebbe l\'informativa privacy dell\'azienda', cookie: 'Prototipo: qui si aprirebbero le preferenze sui cookie', successiva: 'Questa è l\'ultima pagina del funnel' };
    R.avviso(testi[t] || 'Prototipo: azione simulata');
  };

  R.azioni['mk-pp-invia'] = (el) => {
    const form = el.closest('form');
    const p = pagina(el.dataset.pagina);
    if (!form || !p) return;
    const f = funnel(p.funnel);
    const mo = modulo(form.dataset.modulo) || modulo('mo1');
    form.querySelectorAll('.pp-err').forEach((e) => e.remove());
    form.querySelectorAll('.errore').forEach((e) => { e.classList.remove('errore'); e.removeAttribute('aria-invalid'); });
    const v = {};
    form.querySelectorAll('[name]').forEach((c) => { if (c.type === 'checkbox') v[c.name] = c.checked; else if (c.type === 'radio') { if (c.checked) v[c.name] = c.value; } else v[c.name] = (c.value || '').trim(); });
    const sbagliati = [];
    const errore = (campo, testo) => {
      const g = form.querySelector(`[data-campo="${campo}"]`);
      if (!g) return;
      const d = document.createElement('div');
      d.className = 'pp-err'; d.id = 'err-' + campo + '-' + p.id; d.textContent = testo;
      g.querySelectorAll('.pp-campo, input[type=checkbox]').forEach((c) => { c.classList.add('errore'); c.setAttribute('aria-invalid', 'true'); c.setAttribute('aria-describedby', d.id); });
      g.appendChild(d);
      sbagliati.push(g);
    };
    const haCampo = (tipo) => mo.campi.some((c) => c.tipo === tipo);
    const tel = (v.telefono || '').replace(/[\s.\-/()]/g, '');
    if (haCampo('nome') && !v.nome) errore('nome', 'Scrivi il tuo nome.');
    if (!tel && !v.email) { if (haCampo('telefono')) errore('telefono', 'Scrivi il telefono oppure l\'email, così possiamo ricontattarti.'); else errore('email', 'Scrivi l\'email, così possiamo ricontattarti.'); }
    if (tel && !/^\+?\d{6,15}$/.test(tel)) errore('telefono', 'Il numero non sembra giusto: scrivi solo cifre, per esempio 333 123 4567.');
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errore('email', 'L\'email non sembra giusta: controlla che ci sia la chiocciola, per esempio mario@esempio.it.');
    mo.campi.forEach((c) => { if (c.obbligatorio && !['nome', 'privacy', 'telefono', 'email', 'nascosto'].includes(c.tipo) && !v['c_' + c.id]) errore('c_' + c.id, 'Rispondi a questa domanda.'); });
    if (haCampo('privacy') && !v.privacy) errore('privacy', 'Per inviare la richiesta devi leggere e accettare l\'informativa privacy.');
    if (sbagliati.length) { const primo = sbagliati[0].querySelector('input, select'); if (primo) primo.focus(); return; }
    if (el.dataset.inviato) return;
    el.dataset.inviato = '1'; el.disabled = true; el.textContent = 'Invio in corso…';
    setTimeout(() => {
      const telefonoCompleto = tel ? (tel.startsWith('+') ? tel : (v.prefisso || '+39') + ' ' + v.telefono) : '';
      const dati = { nome: v.nome, telefono: telefonoCompleto, email: v.email, consensoWhatsapp: !!v.consensoWa, consensoEmail: !!v.consensoEmail, campagna: f.campagna || f.nome, pagina: f.indirizzo, funnel: f.id };
      let r = null; let err = null;
      if (typeof R.nuovoContattoDaModulo === 'function') { try { r = R.nuovoContattoDaModulo(dati); } catch (e) { console.error(e); err = e.message; } }
      f.contatti = (f.contatti || 0) + 1;
      if (p.ab && p.ab.attiva) { const k = versioneAB(p) === 'B' ? 'contattiB' : 'contattiA'; p.ab[k] = (p.ab[k] || 0) + 1; }
      R.salva();
      ultimoInvio = { funnel: f.id, dati, r, errore: err, collegato: typeof R.nuovoContattoDaModulo === 'function' };
      const grazie = pagineDi(f.id).find((x) => x.tipo === 'grazie');
      R.vai(grazie ? percorsoPubblico(grazie) : '#/pagina/' + f.percorsoPagina + '/grazie');
      window.scrollTo(0, 0);
    }, 600);
  };

  /* ================= Moduli (immagine 20) ================= */
  const pagineConModulo = (idMo) => (R.stato.pagine || []).filter((p) => p.blocchi.concat(p.pubblicati || []).some((x) => x.tipo === 'modulo' && x.modulo === idMo) && funnel(p.funnel) && !funnel(p.funnel).eliminato);
  const risposteModulo = (idMo) => [...new Set(pagineConModulo(idMo).map((p) => p.funnel))].reduce((s, id) => s + (funnel(id).contatti || 0), 0);
  const unici = ['nome', 'telefono', 'email', 'privacy', 'consensoWa', 'consensoEmail', 'nascosto'];
  const CAMPI_NUOVI = {
    nome: ['Nome e cognome', { segnaposto: 'Mario Rossi', salvaNel: 'Nome del contatto', obbligatorio: true }], telefono: ['Telefono', { segnaposto: '333 123 4567', salvaNel: 'Telefono' }], email: ['Email', { segnaposto: 'mario@esempio.it', salvaNel: 'Email' }],
    ragione: ['Ragione sociale', { salvaNel: 'Ragione sociale' }], piva: ['Partita IVA', { salvaNel: 'Partita IVA' }],
    settore: ['In quale settore lavori?', { risposte: ['Manifattura', 'Commercio', 'Turismo e ristorazione'], salvaNel: 'Settore / Ateco', segnaposto: 'Scegli il settore' }],
    regione: ['In quale regione?', { risposte: ['Campania', 'Puglia', 'Calabria', 'Sicilia', 'Basilicata'], salvaNel: 'Regione', segnaposto: 'Scegli la regione' }],
    tendina: ['Nuova domanda', { risposte: ['Risposta 1', 'Risposta 2'], segnaposto: 'Scegli' }], scelta: ['Nuova domanda', { risposte: ['Sì', 'No'] }],
    data: ['Data preferita per la chiamata', {}], file: ['Carica un documento', {}],
    privacy: ['Ho letto l\'informativa privacy e acconsento a essere ricontattato', { obbligatorio: true }], consensoWa: ['Voglio ricevere aggiornamenti su WhatsApp', {}], consensoEmail: ['Voglio ricevere aggiornamenti per email', {}],
    nascosto: ['Fonte e campagna (dall\'indirizzo della pubblicità)', { salvaNel: 'Fonte e campagna' }],
  };
  const GRUPPI_CAMPI = [['Persona', [['nome', 'Nome e cognome'], ['telefono', 'Telefono con prefisso'], ['email', 'Email']]], ['Azienda', [['ragione', 'Ragione sociale'], ['piva', 'Partita IVA'], ['settore', 'Settore / Ateco'], ['regione', 'Regione']]], ['Altro', [['tendina', 'Menu a tendina'], ['scelta', 'Scelta tra più risposte'], ['data', 'Data'], ['file', 'Carica un file'], ['privacy', 'Consenso privacy'], ['consensoWa', 'Consenso WhatsApp'], ['consensoEmail', 'Consenso email'], ['nascosto', 'Campo nascosto (fonte, campagna)']]]];
  const DOVE_SALVARE = ['Nome del contatto', 'Telefono', 'Email', 'Ragione sociale', 'Partita IVA', 'Settore / Ateco', 'Regione', 'Valore dell\'affare', 'Fonte e campagna', 'Nota dell\'affare'];

  R.rotta('/marketing/moduli', {
    menu: 'marketing', titolo: 'Moduli',
    disegna() {
      assicura();
      const righe = R.stato.moduli.map((mo) => { const n = pagineConModulo(mo.id).length; return `<a class="riga cliccabile" style="text-decoration:none" href="#/marketing/moduli/${mo.id}"><span class="quadratino salvia">${R.icona('modulo')}</span><div class="principale"><div class="titolo-riga">${esc(mo.nome)}</div><div class="sotto">${n ? 'Usato in ' + n + (n === 1 ? ' pagina' : ' pagine') : 'Non ancora usato in una pagina'} · ${num(risposteModulo(mo.id))} risposte · ${mo.campi.filter((c) => c.tipo !== 'nascosto').length} campi</div></div>${R.icona('destra', 16)}</a>`; }).join('');
      return `${barraMk('moduli')}<div class="testata"><div><div class="sopratitolo">Marketing</div><h1 class="titolo-pagina">Moduli</h1><div class="spiegazione">I moduli raccolgono i dati dei visitatori e decidono dove va il contatto: percorso, fase, responsabile e promemoria.</div></div>
        <div class="azioni-testata"><button class="btn primario" data-azione="mk-nuovo-modulo">${R.icona('piu', 16)} Nuovo modulo</button></div></div>
        <div class="riquadro"><div class="elenco">${righe || '<div class="vuoto">Nessun modulo. Crea il primo per raccogliere contatti dalle tue pagine.</div>'}</div></div>`;
    },
  });
  R.azioni['mk-nuovo-modulo'] = () => R.modale({
    titolo: 'Nuovo modulo', classe: 'stretta', sottotitolo: 'Parte con nome, telefono, email e consensi. Aggiungi le altre domande nell\'editor.',
    corpo: '<div class="gruppo-campo"><label class="etichetta-campo" for="mk-nm">Nome del modulo</label><input class="campo" id="mk-nm" name="nome" placeholder="es. Richiesta consulenza"></div>',
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Crea', classe: 'primario', fai(fin) {
      const v = R.valori(fin);
      if (!v.nome) { R.erroreCampo(fin, 'nome', 'Scrivi il nome del modulo.'); return false; }
      const base = modulo('mo3');
      const mo = { id: R.id('mo'), nome: v.nome, titolo: v.nome, sotto: 'Ti richiamiamo entro 1 ora di lavoro.', pulsante: 'Invia', campi: JSON.parse(JSON.stringify(base.campi)).map((c) => Object.assign(c, { id: R.id('cm') })), dopo: { percorso: 'p1', fase: 'f1', responsabile: 'turno', fisso: 'u2', pagina: 'grazie', avvisa: 'responsabile', automazione: '', promemoria: true, ore: 1 } };
      R.stato.moduli.push(mo); R.salva();
      R.vai('#/marketing/moduli/' + mo.id);
    } }],
  });

  const edm = { id: null, copia: null, sel: null, modificato: false };
  function apriModulo(id) {
    if (edm.id === id && edm.copia) return;
    const mo = modulo(id);
    Object.assign(edm, { id, copia: mo ? JSON.parse(JSON.stringify(mo)) : null, sel: null, modificato: false });
  }
  const modificaModulo = () => { edm.modificato = true; const s = document.getElementById('mk-mo-stato'); if (s) s.textContent = 'Modifiche non salvate'; };
  function rigaDopo(t, v) { return `<button class="riga-impostazione" style="width:100%;border:0;text-align:left;font-size:13.5px" data-azione="vai" data-dove="#/marketing/moduli/${edm.id}?scheda=dove"><span>${t}</span><span class="valore">${v}</span></button>`; }
  function riepilogoDopo(mo) {
    const d = mo.dopo;
    const perc = R.percorso(d.percorso) || { nome: '—' };
    const fase = R.fase(d.percorso, d.fase) || { nome: '—' };
    const aut = (R.stato.automazioni || []).find((a) => a.id === d.automazione);
    const avvisa = { responsabile: 'Il responsabile', amministratori: 'Gli amministratori', tutti: 'Responsabile e amministratori' }[d.avvisa] || '—';
    return `<div class="riquadro scuro mk-dopo spazio-sopra" style="padding:20px"><h2 class="titolo-riquadro">Dopo l'invio</h2>
      ${rigaDopo('Il contatto va in', esc(perc.nome + ' · ' + fase.nome))}${rigaDopo('Responsabile', d.responsabile === 'turno' ? 'A turno' : esc(R.utenteDa(d.fisso).breve))}${rigaDopo('Poi mostra', d.pagina === 'grazie' ? 'Pagina "Grazie"' : 'Messaggio nella pagina')}${rigaDopo('Avvisa', avvisa + ' su WhatsApp')}${rigaDopo('Avvia', aut ? esc(aut.nome) : 'Nessuna automazione')}${rigaDopo('Promemoria entro ' + (d.ore || 1) + ' ' + ((+d.ore || 1) === 1 ? 'ora' : 'ore') + ' di lavoro', d.promemoria ? 'Acceso' : 'Spento')}</div>`;
  }

  R.rotta('/marketing/moduli/:id', {
    menu: 'marketing', pieno: true,
    titolo: (par) => 'Modulo · ' + ((modulo(par.id) || {}).nome || ''),
    disegna(par, q) {
      assicura();
      apriModulo(par.id);
      const mo = edm.copia;
      if (!mo) return '<div class="riquadro vuoto" style="margin:20px">Questo modulo non esiste più. <a class="link verde" href="#/marketing/moduli">Torna ai moduli</a></div>';
      const scheda = q.scheda || 'modifica';
      const tel = telefono();
      const nPag = pagineConModulo(mo.id).length;
      const tab = (id, t) => `<button class="${scheda === id ? 'attivo' : ''}" data-azione="vai" data-dove="#/marketing/moduli/${mo.id}${id === 'modifica' ? '' : '?scheda=' + id}">${t}</button>`;
      const sel = mo.campi.find((c) => c.id === edm.sel);
      let corpo = '';
      if (scheda === 'modifica') {
        const campiHtml = mo.campi.map((c) => `<div class="mk-campo-mod ${c.id === edm.sel ? 'sel' : ''}" data-azione="mk-mo-sel" data-id="${c.id}">${c.id === edm.sel && !tel ? `<span class="mk-barretta"><button data-azione="mk-mo-sposta" data-verso="-1" aria-label="Sposta su">${R.icona('su', 14)}</button><button data-azione="mk-mo-sposta" data-verso="1" aria-label="Sposta giù">${R.icona('giu', 14)}</button>${unici.includes(c.tipo) ? '' : '<button class="dup" data-azione="mk-mo-duplica">Duplica</button>'}<button class="eli" data-azione="mk-mo-elimina">Elimina</button></span>` : ''}${campoModulo(c, { modo: 'anteprima' }, 'mo')}</div>`).join('');
        const anteprimaMod = `<div class="mk-modulo-anteprima pp" style="--pp-primario:#D63B3B"><h2>${esc(mo.titolo)}</h2><p class="secondario" style="margin:0 0 16px">${esc(mo.sotto)}</p>${campiHtml}<span class="pp-btn" style="width:100%;background:#D63B3B;color:#fff;border-radius:999px;margin-top:10px">${esc(mo.pulsante)}</span></div>`;
        const pannello = sel ? `<div class="riquadro medio" style="padding:18px"><h2 class="titolo-riquadro">Campo selezionato</h2>
            <div class="gruppo-campo"><label class="etichetta-campo" for="mk-mo-dom">Domanda</label><input class="campo" id="mk-mo-dom" data-digita="mk-mo-prop" data-prop="domanda" value="${esc(sel.domanda)}"></div>
            ${(sel.risposte || []).length || ['tendina', 'scelta', 'settore', 'regione'].includes(sel.tipo) ? `<div class="gruppo-campo"><div class="etichetta-campo">Risposte</div>${(sel.risposte || []).map((r, i) => `<div class="riga-flex" style="flex-wrap:nowrap;gap:6px;margin-bottom:6px"><input class="campo" style="min-height:40px" aria-label="Risposta ${i + 1}" data-digita="mk-mo-risposta" data-i="${i}" value="${esc(r)}"><button class="btn tondo secondario-campo" style="min-height:40px;width:40px" data-azione="mk-mo-togli-risposta" data-i="${i}" aria-label="Togli la risposta">${R.icona('x', 15)}</button></div>`).join('')}<button class="link verde" data-azione="mk-mo-aggiungi-risposta">+ Aggiungi risposta</button></div>` : ''}
            ${sel.tipo === 'nascosto' ? '<p class="piccolo secondario">Legge dall\'indirizzo della pubblicità la fonte e la campagna (per esempio Facebook · ZES 2026) e le salva nel contatto. Il visitatore non lo vede.</p>' : ''}
            ${['privacy', 'consensoWa', 'consensoEmail'].includes(sel.tipo) ? '' : `<label class="riga-impostazione"><span>Salva nel campo</span><select data-cambia="mk-mo-prop" data-prop="salvaNel" style="border:0;background:transparent;font-weight:600;text-align:right;max-width:60%">${['(non salvare)'].concat(DOVE_SALVARE).map((x) => `<option ${sel.salvaNel === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>`}
            ${sel.tipo === 'nascosto' ? '' : `<div class="riga-impostazione" style="margin:0"><span>Obbligatorio${sel.tipo === 'privacy' ? ' (sempre, per legge)' : sel.tipo === 'telefono' || sel.tipo === 'email' ? '<span class="piccolo secondario" style="display:block">Serve almeno il telefono o l\'email</span>' : ''}</span><label class="interruttore"><input type="checkbox" data-cambia="mk-mo-prop" data-prop="obbligatorio" ${sel.obbligatorio ? 'checked' : ''} ${sel.tipo === 'privacy' ? 'disabled' : ''} aria-label="Obbligatorio"><span></span></label></div>`}
          </div>` : `<div class="riquadro medio" style="padding:18px"><h2 class="titolo-riquadro">Modulo</h2><p class="secondario" style="margin-top:-6px;font-size:13px">Clicca un campo nell'anteprima per cambiarlo.</p>
            <div class="gruppo-campo"><label class="etichetta-campo" for="mk-mo-t">Titolo</label><input class="campo" id="mk-mo-t" data-digita="mk-mo-gen" data-prop="titolo" value="${esc(mo.titolo)}"></div>
            <div class="gruppo-campo"><label class="etichetta-campo" for="mk-mo-s">Sottotitolo</label><input class="campo" id="mk-mo-s" data-digita="mk-mo-gen" data-prop="sotto" value="${esc(mo.sotto)}"></div>
            <div class="gruppo-campo"><label class="etichetta-campo" for="mk-mo-p">Testo del pulsante</label><input class="campo" id="mk-mo-p" data-digita="mk-mo-gen" data-prop="pulsante" value="${esc(mo.pulsante)}"></div></div>`;
        corpo = `<div class="area-editor">
          ${tel ? '' : `<div class="riquadro medio" style="padding:16px"><h2 class="titolo-riquadro" style="margin-bottom:8px">Campi</h2><p class="piccolo secondario" style="margin:0 0 6px">Clicca per aggiungere sotto il campo scelto</p>${GRUPPI_CAMPI.map(([g, voci]) => `<div class="piccolo secondario" style="margin:12px 4px 6px">${g}</div>${voci.map(([t, n]) => `<button class="opzione ${t === 'nascosto' ? 'scelta' : ''}" style="padding:10px 14px;margin-bottom:6px;font-size:13.5px;${t === 'nascosto' ? 'background:var(--lavanda);color:var(--lavanda-t);box-shadow:none' : ''}" data-azione="mk-mo-aggiungi" data-tipo="${t}">${n}</button>`).join('')}`).join('')}</div>`}
          <div class="tela mk-tela">${anteprimaMod}</div>
          <div class="pannello-destro mk-pannello">${pannello}${riepilogoDopo(mo)}</div></div>`;
      } else if (scheda === 'dove') {
        const d = mo.dopo;
        const perc = R.percorso(d.percorso);
        const opz = (arr, val) => arr.map(([k, t]) => `<option value="${esc(k)}" ${k === val ? 'selected' : ''}>${esc(t)}</option>`).join('');
        const campoSel = (et, prop, arr) => `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-d-${prop}">${et}</label><select class="campo" id="mk-d-${prop}" data-cambia="mk-mo-dopo" data-prop="${prop}">${opz(arr, d[prop])}</select></div>`;
        corpo = `<div style="padding:14px var(--margine) 40px"><div class="griglia g-2" style="max-width:1100px;margin:0 auto">
          <div class="riquadro"><h2 class="titolo-riquadro">Dove va il contatto</h2>
            ${campoSel('Percorso', 'percorso', R.stato.percorsi.map((x) => [x.id, x.nome]))}
            ${campoSel('Fase', 'fase', perc.fasi.filter((x) => !x.tipo).map((x) => [x.id, x.nome]))}
            ${campoSel('Responsabile', 'responsabile', [['turno', 'A turno tra i collaboratori attivi'], ['fisso', 'Sempre la stessa persona']])}
            ${d.responsabile === 'fisso' ? campoSel('Chi', 'fisso', R.stato.utenti.filter((u) => u.stato === 'attivo').map((u) => [u.id, u.nome])) : ''}
            <p class="piccolo secondario" style="margin:0">Se il contatto ha già un responsabile attivo, il nuovo affare va a lui. Chi è assente non riceve contatti a turno.</p></div>
          <div class="riquadro"><h2 class="titolo-riquadro">Dopo l'invio</h2>
            ${campoSel('Pagina mostrata', 'pagina', [['grazie', 'Pagina di ringraziamento del funnel'], ['stessa', 'Messaggio nella stessa pagina']])}
            ${campoSel('Chi avvisare', 'avvisa', [['responsabile', 'Il responsabile (campanella e WhatsApp)'], ['amministratori', 'Gli amministratori'], ['tutti', 'Responsabile e amministratori']])}
            ${campoSel('Automazione da avviare', 'automazione', [['', 'Nessuna']].concat((R.stato.automazioni || []).map((a) => [a.id, a.nome])))}
            <div class="riga-impostazione"><span>Promemoria entro <input type="number" min="1" max="8" value="${+d.ore || 1}" data-digita="mk-mo-ore" aria-label="Ore di lavoro" style="width:48px;border:0;border-radius:999px;padding:4px 8px;text-align:center;font-weight:600"> ${(+d.ore || 1) === 1 ? 'ora' : 'ore'} di lavoro al responsabile</span><label class="interruttore"><input type="checkbox" data-cambia="mk-mo-dopo" data-prop="promemoria" ${d.promemoria ? 'checked' : ''} aria-label="Promemoria"><span></span></label></div>
            <p class="piccolo secondario" style="margin:0">Senza responsabile arriva un solo promemoria a tutti gli amministratori. Protezione anti-spam, controllo di telefono ed email e regole sui doppioni sono sempre attivi.</p></div>
        </div></div>`;
      } else if (scheda === 'sito') {
        const codice = `<script src="https://moduli.rampant.it/${R.azienda().sottodominio}/${mo.id}.js" async></script>`;
        const link = `https://${sottodominio()}/modulo/${mo.id}`;
        corpo = `<div style="padding:14px var(--margine) 40px"><div class="riquadro" style="max-width:820px;margin:0 auto"><h2 class="titolo-riquadro">Inserisci in un sito</h2><p class="secondario" style="margin-top:-6px">Puoi usare questo modulo anche fuori dalle pagine di Rampant: copia il codice nel tuo sito oppure condividi il link.</p>
          <div class="etichetta-campo">Codice da incollare nel sito</div><div class="mk-codice">${esc(codice)}</div><button class="btn piccolo secondario-campo spazio-sopra" data-azione="mk-copia-link" data-link="${esc(codice)}">${R.icona('copia', 15)} Copia il codice</button>
          <div class="etichetta-campo spazio-sopra">Link diretto al modulo</div><div class="mk-link-pubblico" style="margin-top:0"><a href="#/marketing/moduli/${mo.id}">${esc(link)}</a><button class="btn piccolo" data-azione="mk-copia-link" data-link="${esc(link)}">${R.icona('copia', 15)} Copia</button></div></div></div>`;
      } else if (scheda === 'risposte') {
        const indirizzi = [...new Set(pagineConModulo(mo.id).map((p) => funnel(p.funnel).indirizzo))];
        const lista = R.stato.contatti.filter((c) => !c.eliminato && indirizzi.includes(c.pagina) && R.contattoVisibile(c)).sort((a, b2) => new Date(b2.creato) - new Date(a.creato)).slice(0, 10);
        corpo = `<div style="padding:14px var(--margine) 40px"><div class="riquadro" style="max-width:1000px;margin:0 auto"><h2 class="titolo-riquadro">Risposte</h2><p class="secondario" style="margin-top:-6px">Le ultime persone che hanno compilato il modulo. Ogni risposta è anche nella scheda del contatto.</p><div class="elenco">${lista.map((c) => `<a class="riga cliccabile" style="text-decoration:none" href="#/contatto/${c.id}"><span class="quadratino ${c.colore || 'salvia'}">${R.iniziali(c.referente || c.nome)}</span><div class="principale"><div class="titolo-riga">${esc(c.referente || c.nome)} · ${esc(c.nome)}</div><div class="sotto">${esc(c.telefono)} · ${esc(c.fonte || '')}${c.campagna ? ' · ' + esc(c.campagna) : ''}</div></div><span class="piccolo secondario">${esc(R.quandoBreve(c.creato))}</span></a>`).join('') || '<div class="vuoto">Ancora nessuna risposta. Pubblica una pagina con questo modulo e condividi il link.</div>'}</div></div></div>`;
      } else {
        const visite = [...new Set(pagineConModulo(mo.id).map((p) => p.funnel))].reduce((s, id) => s + (funnel(id).visite || 0), 0);
        const inv = risposteModulo(mo.id);
        corpo = `<div style="padding:14px var(--margine) 40px"><div class="griglia g-3" style="max-width:1100px;margin:0 auto"><div class="riquadro"><div class="etichetta-numero">Visite alle pagine</div><div class="numero-medio">${num(visite)}</div></div><div class="riquadro"><div class="etichetta-numero">Moduli inviati</div><div class="numero-medio">${num(inv)}</div></div><div class="riquadro salvia"><div class="etichetta-numero">Conversione</div><div class="numero-medio">${percento(inv, visite)}</div></div>
          <div class="riquadro span-2"><h2 class="titolo-riquadro piccolo">Dove si fermano</h2><p class="secondario" style="margin:0">Il 18% inizia a compilare e non invia. Il campo lasciato più spesso a metà è "Quanto vuoi investire?": valuta se renderlo facoltativo.</p></div></div></div>`;
      }
      return `<div class="barra-editor">
          <button class="btn tondo secondario-campo" data-azione="mk-mo-esci" aria-label="Torna ai moduli">${R.icona('freccia-sinistra')}</button>
          <div class="nome-editor"><b>Modulo · ${esc(mo.nome)}</b><span>${nPag ? 'Usato in ' + nPag + (nPag === 1 ? ' pagina' : ' pagine') : 'Non ancora usato'} · ${num(risposteModulo(mo.id))} risposte · <span id="mk-mo-stato">${edm.modificato ? 'Modifiche non salvate' : 'Salvato'}</span></span></div>
          <div class="selettore">${tab('modifica', 'Modifica')}${tab('dove', 'Dove va il contatto')}${tab('sito', 'Inserisci in un sito')}${tab('risposte', 'Risposte')}${tab('statistiche', 'Statistiche')}</div>
          <div class="riga-flex" style="gap:8px"><button class="btn secondario-campo" data-azione="mk-mo-anteprima">Anteprima</button><button class="btn primario" data-azione="mk-mo-salva">Salva</button></div>
        </div>${tel && scheda === 'modifica' ? '<div class="mk-avviso-tel"><b>La costruzione completa si fa da computer:</b> dal telefono puoi vedere e correggere i testi del modulo.</div>' : ''}${corpo}`;
    },
  });

  /* ---------- Azioni dell'editor dei moduli ---------- */
  const campoSel = () => edm.copia && edm.copia.campi.find((c) => c.id === edm.sel);
  R.azioni['mk-mo-sel'] = (el) => { if (edm.sel === el.dataset.id) return; edm.sel = el.dataset.id; R.aggiorna(); };
  R.azioni['mk-mo-aggiungi'] = (el) => {
    const t = el.dataset.tipo;
    const mo = edm.copia;
    const esiste = unici.includes(t) && mo.campi.find((c) => c.tipo === t);
    if (esiste) { edm.sel = esiste.id; R.aggiorna(); R.avviso('Il modulo ha già questo campo: l\'abbiamo selezionato'); return; }
    const [domanda, extra] = CAMPI_NUOVI[t];
    const c = Object.assign({ id: R.id('cm'), tipo: t, domanda, obbligatorio: false, risposte: [], salvaNel: '' }, JSON.parse(JSON.stringify(extra)));
    const i = mo.campi.findIndex((x) => x.id === edm.sel);
    mo.campi.splice(i >= 0 ? i + 1 : mo.campi.length, 0, c);
    edm.sel = c.id; modificaModulo(); R.aggiorna();
  };
  R.azioni['mk-mo-sposta'] = (el) => {
    const mo = edm.copia;
    const i = mo.campi.findIndex((x) => x.id === edm.sel);
    const j = i + (+el.dataset.verso);
    if (i < 0 || j < 0 || j >= mo.campi.length) return;
    const [x] = mo.campi.splice(i, 1); mo.campi.splice(j, 0, x);
    modificaModulo(); R.aggiorna();
  };
  R.azioni['mk-mo-duplica'] = () => {
    const mo = edm.copia;
    const i = mo.campi.findIndex((x) => x.id === edm.sel);
    const c = Object.assign(JSON.parse(JSON.stringify(mo.campi[i])), { id: R.id('cm') });
    mo.campi.splice(i + 1, 0, c); edm.sel = c.id; modificaModulo(); R.aggiorna();
  };
  R.azioni['mk-mo-elimina'] = () => {
    const mo = edm.copia;
    const i = mo.campi.findIndex((x) => x.id === edm.sel);
    if (i < 0) return;
    if (mo.campi[i].tipo === 'nome') { R.avviso('Il nome serve sempre per creare il contatto: non si può togliere'); return; }
    if ((mo.campi[i].tipo === 'telefono' && !mo.campi.some((c) => c.tipo === 'email')) || (mo.campi[i].tipo === 'email' && !mo.campi.some((c) => c.tipo === 'telefono'))) { R.avviso('Serve almeno il telefono o l\'email: aggiungi l\'altro prima di togliere questo'); return; }
    const [tolto] = mo.campi.splice(i, 1);
    edm.sel = null; modificaModulo(); R.aggiorna();
    R.avviso(`Campo "${esc(tolto.domanda)}" tolto`, { annulla() { mo.campi.splice(i, 0, tolto); edm.sel = tolto.id; R.aggiorna(); } });
  };
  R.azioni['mk-mo-prop'] = (el) => {
    const c = campoSel();
    if (!c) return;
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.prop === 'salvaNel' && v === '(non salvare)') v = '';
    c[el.dataset.prop] = v;
    modificaModulo();
    if (el.type === 'checkbox' || el.tagName === 'SELECT') R.aggiorna();
    else {
      const box = document.querySelector(`.mk-campo-mod[data-id="${c.id}"]`);
      const t = box && (box.querySelector('label[for]') || box.querySelector('.pp-check > span') || box.querySelector('.pp-grp > label') || box.querySelector('.pp-nota'));
      if (t) t.textContent = (c.tipo === 'nascosto' ? 'Campo nascosto: ' : '') + v + (c.obbligatorio ? ' *' : '');
    }
  };
  R.azioni['mk-mo-gen'] = (el) => {
    edm.copia[el.dataset.prop] = el.value; modificaModulo();
    const a = document.querySelector('.mk-modulo-anteprima');
    if (!a) return;
    if (el.dataset.prop === 'titolo') a.querySelector('h2').textContent = el.value;
    if (el.dataset.prop === 'sotto') a.querySelector('h2 + p').textContent = el.value;
    if (el.dataset.prop === 'pulsante') a.querySelector('.pp-btn').textContent = el.value;
  };
  R.azioni['mk-mo-risposta'] = (el) => {
    const c = campoSel(); if (!c) return;
    c.risposte[+el.dataset.i] = el.value; modificaModulo();
  };
  R.azioni['mk-mo-aggiungi-risposta'] = () => { const c = campoSel(); if (!c) return; c.risposte = c.risposte || []; c.risposte.push('Nuova risposta'); modificaModulo(); R.aggiorna(); };
  R.azioni['mk-mo-togli-risposta'] = (el) => { const c = campoSel(); if (!c) return; if (c.risposte.length <= 1) { R.avviso('Serve almeno una risposta'); return; } c.risposte.splice(+el.dataset.i, 1); modificaModulo(); R.aggiorna(); };
  R.azioni['mk-mo-dopo'] = (el) => {
    const d = edm.copia.dopo;
    const k = el.dataset.prop;
    d[k] = el.type === 'checkbox' ? el.checked : el.value;
    if (k === 'percorso') d.fase = R.percorso(d.percorso).fasi[0].id;
    modificaModulo(); R.aggiorna();
  };
  R.azioni['mk-mo-ore'] = (el) => { const n = Math.max(1, Math.min(8, Math.round(+el.value || 1))); edm.copia.dopo.ore = n; modificaModulo(); };
  function salvaModulo(poi) {
    const mo = edm.copia;
    const online = pagineConModulo(mo.id).filter((p) => funnel(p.funnel).stato === 'online').length;
    const applica = () => {
      const i = R.stato.moduli.findIndex((x) => x.id === mo.id);
      R.stato.moduli[i] = JSON.parse(JSON.stringify(mo));
      edm.modificato = false; R.salva();
      R.avviso('Modulo salvato');
      if (poi) poi(); else R.aggiorna();
    };
    if (online && edm.modificato) {
      R.modale({
        titolo: 'Salvare le modifiche al modulo?', classe: 'stretta',
        sottotitolo: `"${esc(mo.nome)}" è usato in ${online} ${online === 1 ? 'pagina online' : 'pagine online'}: le modifiche si vedono subito lì, senza ripubblicare.`,
        pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai() { setTimeout(applica, 10); } }],
      });
    } else applica();
  }
  R.azioni['mk-mo-salva'] = () => {
    if (!edm.modificato) { R.avviso('Nessuna modifica da salvare'); return; }
    salvaModulo();
  };
  R.azioni['mk-mo-esci'] = () => {
    if (!edm.modificato) { edm.id = null; R.vai('#/marketing/moduli'); return; }
    R.modale({
      titolo: 'Hai modifiche non salvate', classe: 'stretta', sottotitolo: 'Vuoi salvarle prima di uscire?',
      pulsanti: [{ testo: 'Continua a modificare', chiudi: true }, { testo: 'Scarta', classe: 'secondario-campo', fai() { edm.id = null; edm.copia = null; R.vai('#/marketing/moduli'); } }, { testo: 'Salva', classe: 'primario', fai() { setTimeout(() => salvaModulo(() => { edm.id = null; R.vai('#/marketing/moduli'); }), 10); } }],
    });
  };
  R.azioni['mk-mo-anteprima'] = () => {
    const mo = edm.copia;
    const finto = { id: 'anteprima-modulo', marchio: MARCHI.rosso, blocchi: [] };
    const bl = nuovoBlocco('modulo', { modulo: mo.id, testo: mo.titolo, sotto: mo.sotto, pulsante: mo.pulsante });
    const salvato = modulo(mo.id);
    const i = R.stato.moduli.indexOf(salvato);
    R.stato.moduli[i] = mo;
    const html = htmlPagina(Object.assign(finto, { blocchi: [bl] }), { modo: 'anteprima' });
    R.stato.moduli[i] = salvato;
    R.modale({ titolo: 'Anteprima del modulo', sottotitolo: 'Così lo vede il visitatore. I campi qui non si possono compilare.', corpo: html, pulsanti: [{ testo: 'Chiudi', chiudi: true }] });
  };

  /* ================= Email marketing (immagine 22) ================= */
  const LIMITE_GIORNO = 300;
  function segmenti() {
    const conEmail = R.stato.contatti.filter((c) => !c.eliminato && c.email);
    const ok = (c) => c.consensi && c.consensi.email === 'si';
    const conAffare = (fn) => conEmail.filter((c) => R.stato.affari.some((a) => a.contatto === c.id && !a.eliminato && fn(a)));
    const s = [
      ['tutti', 'Tutti i contatti', conEmail], ['p1', 'Percorso Finanza agevolata', conAffare((a) => a.percorso === 'p1')],
      ['f1', 'Fase Nuovo contatto', conAffare((a) => a.fase === 'f1')], ['f3', 'Fase Documenti richiesti', conAffare((a) => a.fase === 'f3')],
      ['zes', 'Campagna ZES 2026', conEmail.filter((c) => c.campagna === 'ZES 2026')],
    ].map(([k, nome, l]) => ({ k, nome, totale: l.length, validi: l.filter(ok).length }));
    s.push({ k: 'newsletter', nome: 'Etichetta "Newsletter" (elenco importato)', totale: 1320, validi: 1240 });
    return s;
  }
  const giorniInvio = (n) => Math.max(1, Math.ceil(n / LIMITE_GIORNO));
  function anteprimaEmail(c) {
    const m = MARCHI[c.marchio || 'rosso'];
    return `<div class="mk-email"><div class="testa" style="background:${c.marchio === 'blu' ? m.primario : m.scuro}"><div class="grassetto" style="font-size:13px">${esc((R.azienda() || {}).nome || 'inizio')}</div><h3 style="color:${c.marchio === 'rosso' ? '#F06A62' : '#fff'}">${esc(c.oggetto || 'Oggetto dell\'email')}</h3></div><div class="corpo">${esc(c.testo || 'Scrivi il testo dell\'email.')}<br><span class="btn-email" style="background:${m.primario}">${esc(c.pulsante || 'Scopri di più')}</span></div></div>`;
  }
  R.rotta('/marketing/email', {
    menu: 'marketing', titolo: 'Email marketing',
    disegna() {
      assicura();
      const camp = R.stato.campagne;
      const scelta = camp.find((c) => c.id === R.stato.filtri.mkCampagna) || camp[0];
      const n = R.stato.emailMese;
      const mese = new Date().toLocaleDateString('it-IT', { month: 'long' });
      const statoEt = (c) => ({ inviata: '<span class="etichetta salvia">Inviata</span>', programmata: '<span class="etichetta cielo">Programmata</span>', bozza: '<span class="etichetta pesca">Bozza</span>', invio: '<span class="etichetta lavanda">In invio</span>' }[c.stato] || '');
      const riga = (c) => `<div class="mk-campagna ${scelta && c.id === scelta.id ? 'sel' : ''}" data-azione="mk-em-sel" data-id="${c.id}" role="button" tabindex="0"><div style="min-width:0"><div class="nome">${esc(c.nome)}</div><div class="piccolo secondario">${c.numero ? 'a ' + num(c.numero) + ' contatti · ' : ''}${esc(c.destinatari)}</div></div><div class="piccolo secondario solo-largo">${c.quando ? esc(R.dataBreve(c.quando) + (c.stato === 'programmata' ? ' · ' + R.ora(c.quando) : '')) : '—'}</div><div class="piccolo solo-largo">${c.aperte != null ? `<b>${c.aperte}%</b> aperte` : '—'}</div><div class="piccolo solo-largo">${c.clic != null ? `<b>${c.clic}%</b> clic` : '—'}</div><div>${statoEt(c)}</div></div>`;
      return `${barraMk('email')}
        <div class="testata"><div><div class="sopratitolo">Marketing</div><h1 class="titolo-pagina">Email marketing</h1><div class="spiegazione">Campagne email ai tuoi contatti. Chi non ha dato il consenso o ha chiesto di non riceverle viene escluso da solo.</div></div>
          <div class="azioni-testata"><button class="btn lavanda" data-azione="mk-em-ai">${R.icona('stelline', 16)} Scrivi con l'AI</button><button class="btn primario" data-azione="mk-em-nuova">${R.icona('piu', 16)} Nuova campagna</button></div></div>
        <div class="griglia g-4 spazio-sotto">
          <div class="riquadro verde mk-numero-tile"><div class="etichetta-numero">Email inviate a ${mese}</div><div class="numero-grande" style="font-size:52px">${num(n.inviate)}</div></div>
          <div class="riquadro mk-numero-tile"><div class="etichetta-numero secondario">Aperte</div><div class="numero-grande" style="font-size:52px">${n.aperte}%</div></div>
          <div class="riquadro mk-numero-tile"><div class="etichetta-numero secondario">Cliccate</div><div class="numero-grande" style="font-size:52px">${n.cliccate}%</div></div>
          <div class="riquadro pesca mk-numero-tile"><div class="etichetta-numero">Diventati affari</div><div class="numero-grande" style="font-size:52px">${n.affari}</div><div class="nota">affari creati entro 30 giorni da un clic</div></div>
        </div>
        <div class="mk-due">
          <div class="riquadro"><h2 class="titolo-riquadro">Campagne</h2>${camp.map(riga).join('')}
            <div class="riga-flex spazio-sopra" style="background:var(--campo);border-radius:20px;padding:12px 16px;flex-wrap:nowrap">${R.icona('email')}<span class="piccolo">Piano gratuito: puoi inviare fino a ${LIMITE_GIORNO} email al giorno in tutto. Le campagne più grandi partono in più giorni.</span></div></div>
          <div class="mk-zona" style="padding:20px">${scelta ? `<span class="cartellino">Anteprima · ${esc(scelta.nome)}</span>${anteprimaEmail(scelta)}
            <div class="mk-chips">${scelta.stato === 'bozza' ? `<button data-azione="mk-em-nuova" data-id="${scelta.id}" style="background:var(--verde);color:#fff;font-weight:600">Continua a scrivere</button>` : ''}<button data-azione="mk-em-modelli">Modelli</button><button data-azione="mk-em-ab" data-id="${scelta.id}">Prova A/B dell'oggetto</button><button data-azione="mk-em-prova" data-id="${scelta.id}">Invia una prova a me</button></div>` : '<div class="vuoto">Nessuna campagna. Crea la prima con "Nuova campagna".</div>'}</div>
        </div>`;
    },
  });
  R.azioni['mk-em-sel'] = (el) => { R.stato.filtri.mkCampagna = el.dataset.id; R.salva(); R.aggiorna(); };
  R.azioni['mk-em-prova'] = () => { if (!R.serveConnessione('l\'invio di prova')) return; R.avviso(`Email di prova inviata a ${esc(R.utente().email)} · simulato`); };
  R.azioni['mk-em-modelli'] = () => R.modale({
    titolo: 'Modelli di email', sottotitolo: 'Scegli un punto di partenza: testi e colori si cambiano dopo.',
    corpo: [['Nuovo bando', 'rosso', 'È uscito un nuovo bando: scopri se fa per te', 'Ciao Mario,\nè uscito un nuovo bando che può finanziare il tuo progetto. Ti diciamo gratis se puoi accedere.', 'Verifica gratis'], ['Promemoria documenti', 'blu', 'Ci mancano alcuni documenti', 'Ciao Mario,\nper andare avanti con la tua pratica ci servono ancora alcuni documenti.', 'Vedi cosa manca'], ['Newsletter', 'verde', 'Le novità del mese sui bandi', 'Ciao Mario,\necco i bandi aperti e le scadenze da non perdere.', 'Scopri i bandi']].map(([n, m, o, t, p], i) => `<button class="opzione" data-azione="mk-em-da-modello" data-i="${i}" data-m="${m}" data-o="${esc(o)}" data-t="${esc(t)}" data-p="${esc(p)}"><span class="quadratino" style="background:${MARCHI[m].primario};color:#fff">${R.icona('email', 18)}</span><span class="principale"><b>${n}</b><span class="sotto">${esc(o)}</span></span>${R.icona('destra', 16)}</button>`).join(''),
  });
  R.azioni['mk-em-da-modello'] = (el) => R.azioni['mk-em-nuova'](null, null, { nome: el.querySelector('b').textContent, oggetto: el.dataset.o, testo: el.dataset.t, pulsante: el.dataset.p, marchio: el.dataset.m });
  R.azioni['mk-em-ab'] = (el) => {
    const c = R.stato.campagne.find((x) => x.id === el.dataset.id);
    if (c.stato === 'inviata') {
      R.modale({ titolo: 'Prova A/B dell\'oggetto', classe: 'stretta', sottotitolo: 'Per questa campagna la prova è già finita.', corpo: `<div class="mk-ab"><div class="vince"><div class="piccolo">Oggetto A · vincente</div><div class="grassetto">${esc(c.oggetto)}</div><div class="numero-medio">${c.aperte}%</div><div class="piccolo">aperte</div></div><div><div class="piccolo">Oggetto B</div><div class="grassetto">${esc(c.oggettoB || 'Hai investimenti in vista? Leggi qui')}</div><div class="numero-medio">${Math.max(1, c.aperte - 6)}%</div><div class="piccolo">aperte</div></div></div>`, pulsanti: [{ testo: 'Chiudi', chiudi: true }] });
      return;
    }
    R.modale({
      titolo: 'Prova A/B dell\'oggetto', classe: 'stretta', sottotitolo: 'Il 20% dei destinatari riceve l\'oggetto A o B; dopo 4 ore tutti gli altri ricevono quello aperto di più.',
      corpo: `<div class="gruppo-campo"><div class="etichetta-campo">Oggetto A</div><div class="riga-impostazione" style="border-radius:20px">${esc(c.oggetto)}</div></div><div class="gruppo-campo"><label class="etichetta-campo" for="mk-em-b">Oggetto B</label><input class="campo" id="mk-em-b" name="oggettoB" value="${esc(c.oggettoB || '')}" placeholder="Scrivi un oggetto diverso"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai(f) { const v = R.valori(f); if (!v.oggettoB) { R.erroreCampo(f, 'oggettoB', 'Scrivi l\'oggetto B.'); return false; } c.oggettoB = v.oggettoB; R.salva(); R.avviso('Prova A/B dell\'oggetto pronta: parte con l\'invio'); } }],
    });
  };
  R.azioni['mk-em-ai'] = () => R.modale({
    titolo: 'Scrivi con l\'AI', sottotitolo: 'Scrivi in una riga di cosa parla l\'email: l\'AI prepara oggetto e testo, poi li correggi tu. L\'AI non riceve i dati dei tuoi contatti.',
    corpo: '<div class="gruppo-campo"><label class="etichetta-campo" for="mk-em-idea">Di cosa parla</label><textarea class="campo" id="mk-em-idea" name="idea" rows="3" placeholder="es. Ricorda che la ZES chiude a fine mese e che servono visura e bilanci"></textarea></div><button class="btn piccolo lavanda" data-azione="mk-em-ai-esempio">Usa un esempio</button>',
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Scrivi', classe: 'primario', restaAperta: true, fai(f) {
      const v = R.valori(f);
      if (v.idea.length < 10) { R.erroreCampo(f, 'idea', 'Scrivi almeno una frase su cosa vuoi comunicare.'); return false; }
      if (!R.serveConnessione('la scrittura con l\'AI')) return false;
      const b2 = f.querySelector('.piede-modale .primario');
      b2.disabled = true; b2.textContent = 'In corso…';
      const zes = /zes/i.test(v.idea);
      setTimeout(() => R.azioni['mk-em-nuova'](null, null, { nome: zes ? 'Ultima chiamata ZES' : 'Nuova campagna', oggetto: zes ? 'ZES Unica: ultimi giorni per preparare i documenti' : 'Una novità che può interessarti', testo: zes ? 'Ciao Mario,\nla ZES Unica chiude a fine mese. Se vuoi partecipare ci servono subito visura camerale e ultimi bilanci: ti aiutiamo noi a raccoglierli.' : 'Ciao Mario,\n' + v.idea.replace(/\.$/, '') + '. Rispondi a questa email o scrivici su WhatsApp per saperne di più.', pulsante: zes ? 'Invia i documenti' : 'Scopri di più', marchio: zes ? 'rosso' : 'verde' }), 1000);
      return false;
    } }],
  });
  R.azioni['mk-em-ai-esempio'] = () => { const t = document.getElementById('mk-em-idea'); if (t) t.value = 'Ricorda che la ZES chiude a fine mese e che servono visura e bilanci'; };

  R.azioni['mk-em-nuova'] = (el, ev, pre) => {
    const esistente = el && el.dataset && el.dataset.id ? R.stato.campagne.find((x) => x.id === el.dataset.id) : null;
    const c = Object.assign({ nome: '', segmento: 'p1', oggetto: '', testo: 'Ciao Mario,\n', pulsante: 'Scopri di più', marchio: 'rosso' }, esistente || {}, pre || {});
    const seg = segmenti();
    R.modale({
      titolo: esistente ? 'Campagna' : 'Nuova campagna', classe: 'larga', proteggi: true,
      sottotitolo: 'Scegli a chi scrivere e cosa. Prima di programmare puoi inviare una prova a te stesso.',
      corpo: `<div class="griglia g-2" style="gap:12px"><div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-c-nome">Nome della campagna (lo vedi solo tu)</label><input class="campo" id="mk-c-nome" name="nome" value="${esc(c.nome)}"></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-c-seg">Destinatari: filtri salvati, etichette e fasi</label><select class="campo" id="mk-c-seg" name="segmento" data-cambia="mk-em-seg">${seg.map((s) => `<option value="${s.k}" ${s.k === c.segmento ? 'selected' : ''}>${esc(s.nome)}</option>`).join('')}</select><div class="piccolo secondario" id="mk-c-info" style="margin:6px 0 0 6px"></div></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-c-ogg">Oggetto</label><input class="campo" id="mk-c-ogg" name="oggetto" value="${esc(c.oggetto)}"></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-c-testo">Testo</label><textarea class="campo" id="mk-c-testo" name="testo" rows="5">${esc(c.testo)}</textarea></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="mk-c-pul">Testo del pulsante</label><input class="campo" id="mk-c-pul" name="pulsante" value="${esc(c.pulsante)}"></div>
          <input type="hidden" name="marchio" value="${esc(c.marchio)}">
        </div><div class="mk-zona" style="padding:16px"><span class="cartellino">Anteprima</span><div id="mk-c-anteprima">${anteprimaEmail(c)}</div><p class="piccolo secondario" style="text-align:center;margin:10px 0 0">In fondo a ogni email c'è il link per non riceverne più. Si invia da un indirizzo del software con il nome dell'azienda, finché non verifichi il tuo dominio.</p></div></div>`,
      dopo(fin) {
        const aggiorna = () => {
          const v = R.valori(fin);
          const s = seg.find((x) => x.k === v.segmento);
          const g = giorniInvio(s.validi);
          fin.querySelector('#mk-c-info').innerHTML = `<b>${num(s.validi)} persone</b> riceveranno l'email · esclusi automaticamente ${num(s.totale - s.validi)} senza consenso o che hanno chiesto di non riceverle.<br>Puoi inviare fino a ${LIMITE_GIORNO} email al giorno: ${g === 1 ? 'questa campagna parte tutta nello stesso giorno' : `questa campagna partirà in ${g} giorni`}.`;
          fin.querySelector('#mk-c-anteprima').innerHTML = anteprimaEmail(v);
        };
        aggiorna();
        fin.addEventListener('input', aggiorna);
        fin.addEventListener('change', aggiorna);
      },
      pulsanti: [
        { testo: 'Invia una prova a me', classe: 'secondario-campo', restaAperta: true, fai(f) { const v = R.valori(f); if (!v.oggetto) { R.erroreCampo(f, 'oggetto', 'Scrivi l\'oggetto prima di inviare la prova.'); return false; } if (!R.serveConnessione('l\'invio di prova')) return false; R.avviso(`Prova inviata a ${esc(R.utente().email)} · simulato`); return false; } },
        { testo: 'Salva in bozza', classe: 'secondario-campo', fai(f) { const v = R.valori(f); if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome della campagna.'); return false; } salvaCampagna(esistente, v, 'bozza'); R.avviso('Campagna salvata in bozza'); } },
        { testo: 'Programma', classe: 'primario', fai(f) {
          const v = R.valori(f);
          if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome della campagna.'); return false; }
          if (!v.oggetto) { R.erroreCampo(f, 'oggetto', 'Scrivi l\'oggetto: è la prima cosa che si legge.'); return false; }
          if (!R.puo('inviiMultipli')) { R.erroreCampo(f, 'segmento', 'Per inviare a più contatti serve il permesso "Invii a più contatti": chiedilo a un amministratore. Intanto puoi salvarla in bozza.'); return false; }
          setTimeout(() => confermaProgramma(esistente, v), 20);
        } },
      ],
    });
  };
  R.azioni['mk-em-seg'] = () => { /* l'anteprima si aggiorna dentro la finestra */ };
  function salvaCampagna(esistente, v, stato, quando) {
    const s = segmenti().find((x) => x.k === v.segmento);
    const dati = { nome: v.nome, segmento: v.segmento, destinatari: s.nome, numero: s.validi, oggetto: v.oggetto, testo: v.testo, pulsante: v.pulsante, marchio: v.marchio || 'rosso', stato, quando: quando || null, aperte: null, clic: null };
    let c = esistente;
    if (c) Object.assign(c, dati); else { c = Object.assign({ id: R.id('em') }, dati); R.stato.campagne.unshift(c); }
    R.stato.filtri.mkCampagna = c.id;
    R.salva(); R.aggiorna();
    return c;
  }
  function confermaProgramma(esistente, v) {
    const s = segmenti().find((x) => x.k === v.segmento);
    const g = giorniInvio(s.validi);
    const dd = new Date(R.giorniDa(1, '09:00'));
    const due = (n) => String(n).padStart(2, '0');
    const domani = `${dd.getFullYear()}-${due(dd.getMonth() + 1)}-${due(dd.getDate())}T${due(dd.getHours())}:${due(dd.getMinutes())}`;
    R.modale({
      titolo: `Programmare l'invio a ${num(s.validi)} persone?`, classe: 'stretta',
      sottotitolo: `Esclusi automaticamente ${num(s.totale - s.validi)} contatti senza consenso o che hanno chiesto di non ricevere email.`,
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-c-quando">Quando parte</label><input class="campo" type="datetime-local" id="mk-c-quando" name="quando" value="${domani}"></div>
        <p style="margin:0 0 8px">Puoi inviare fino a ${LIMITE_GIORNO} email al giorno: ${g === 1 ? 'questa campagna parte tutta nello stesso giorno' : `questa campagna partirà in <b>${g} giorni</b>`}.</p>
        <p class="piccolo secondario" style="margin:0">Le email inviate non si possono annullare. Fino all'orario scelto puoi ancora fermare la campagna.</p>`,
      pulsanti: [{ testo: 'Torna a modificare', classe: 'secondario-campo', fai() { setTimeout(() => R.azioni['mk-em-nuova'](esistente ? { dataset: { id: esistente.id } } : null, null, Object.assign({}, v)), 20); } },
        { testo: `Programma per ${num(s.validi)} persone`, classe: 'primario', fai(f) {
          const q = R.valori(f).quando;
          if (!q || new Date(q) < new Date()) { R.erroreCampo(f, 'quando', 'Scegli una data e un\'ora future.'); return false; }
          if (!R.serveConnessione('la programmazione della campagna')) return false;
          salvaCampagna(esistente, v, 'programmata', new Date(q).toISOString());
          R.avviso(`Campagna programmata per ${R.dataBreve(q)} alle ${R.ora(new Date(q).toISOString())}`);
        } }],
    });
  }

  /* ================= Libreria file ================= */
  const mb = (peso) => { const n = parseFloat(String(peso).replace(',', '.')); return /GB/i.test(peso) ? n * 1024 : /KB/i.test(peso) ? n / 1024 : n || 0; };
  const pesoTesto = (m) => (m >= 1024 ? (m / 1024).toLocaleString('it-IT', { maximumFractionDigits: 2 }) + ' GB' : m.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' MB');
  const spazioUsato = () => R.stato.spazio.usatoMb + R.stato.libreria.reduce((s, f) => s + mb(f.peso), 0);
  const fileInAutomazione = (f) => /brochure zes/i.test(f.nome) ? ((R.stato.automazioni || []).find((a) => a.id === 'au1') || null) : null;
  R.rotta('/marketing/libreria', {
    menu: 'marketing', titolo: 'Libreria file',
    disegna() {
      assicura();
      const lib = R.stato.libreria;
      const cart = R.stato.filtri.mkCartellaFile || 'tutte';
      const cartelle = [...new Set(lib.map((f) => f.cartella || 'Senza cartella'))];
      const puo = R.amministratore() || R.puo('funnel');
      const usato = spazioUsato();
      const lim = R.stato.spazio.limiteMb;
      const perc = Math.round(usato / lim * 100);
      const vis = lib.filter((f) => cart === 'tutte' || (f.cartella || 'Senza cartella') === cart);
      const est = (n) => (String(n).split('.').pop() || '').toUpperCase().slice(0, 4);
      return `${barraMk('libreria')}
        <div class="testata"><div><div class="sopratitolo">Marketing · la trovi anche in Impostazioni</div><h1 class="titolo-pagina">Libreria file</h1><div class="spiegazione">File caricati una volta e inviati con un clic su WhatsApp ed email, anche dalle automazioni. Massimo 25 MB per file.</div></div>
          <div class="azioni-testata">${puo ? `<button class="btn primario" data-azione="mk-carica-file">${R.icona('carica', 16)} Carica file</button>` : '<span class="piccolo secondario">Per caricare file serve il permesso su pagine e moduli</span>'}</div></div>
        <div class="griglia" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start" id="mk-lib-griglia">
          <div class="riquadro"><div class="pillole su-bianco spazio-sotto">${['tutte'].concat(cartelle).map((c) => `<button class="pillola ${cart === c ? 'attiva' : ''}" data-azione="mk-cartella-file" data-valore="${esc(c)}">${c === 'tutte' ? 'Tutte' : esc(c) + ' · ' + lib.filter((f) => (f.cartella || 'Senza cartella') === c).length}</button>`).join('')}</div>
            <div class="elenco">${vis.map((f) => { const au = fileInAutomazione(f); return `<div class="riga"><span class="quadratino pesca" style="font-size:10.5px">${esc(est(f.nome))}</span><div class="principale"><div class="titolo-riga" style="word-break:break-word">${esc(f.nome)}</div><div class="sotto">${esc(f.peso)} · ${esc(f.cartella || 'Senza cartella')}${au ? ' · usato nell\'automazione "' + esc(au.nome) + '"' : ''}${f.da ? ' · caricato da ' + esc(R.utenteDa(f.da).breve) : ''}</div></div><button class="btn piccolo secondario-campo" data-azione="mk-file-anteprima" data-id="${f.id}">Anteprima</button>${puo ? `<button class="btn tondo secondario-campo" style="min-height:44px" data-azione="mk-file-elimina" data-id="${f.id}" aria-label="Elimina ${esc(f.nome)}">${R.icona('cestino', 16)}</button>` : ''}</div>`; }).join('') || '<div class="vuoto">Nessun file in questa cartella. Carica il primo con "Carica file".</div>'}</div></div>
          <div class="riquadro ${perc >= 80 ? 'pesca' : ''}"><h2 class="titolo-riquadro piccolo">Spazio dell'azienda</h2><div class="numero-medio">${perc}%</div><div class="mk-spazio ${perc >= 80 ? 'pieno' : ''}"><span style="width:${Math.min(100, perc)}%"></span></div><div class="piccolo">${pesoTesto(usato)} usati su ${pesoTesto(lim)}, contando anche i file ricevuti e inviati su WhatsApp.</div>
            ${perc >= 80 ? '<p style="margin:12px 0 0;font-size:13px"><b>Hai usato più dell\'80% dello spazio.</b> Elimina i file che non usi più. I file di WhatsApp si cancellano da soli dopo 12 mesi (resta il testo).</p>' : ''}</div>
        </div>`;
    },
  });
  R.stile('marketing-libreria', '#mk-lib-griglia .pillola.attiva { background: var(--verde); color: #fff; } @media (max-width: 1180px) { #mk-lib-griglia { grid-template-columns: minmax(0, 1fr) !important; } }');
  R.azioni['mk-cartella-file'] = (el) => { R.stato.filtri.mkCartellaFile = el.dataset.valore; R.salva(); R.aggiorna(); };
  R.azioni['mk-file-anteprima'] = (el) => {
    const f = R.stato.libreria.find((x) => x.id === el.dataset.id);
    R.modale({ titolo: esc(f.nome), sottotitolo: `${esc(f.peso)} · cartella ${esc(f.cartella || 'Senza cartella')}`, corpo: `<div class="tela" style="min-height:260px;display:grid;place-items:center;text-align:center"><div><span class="quadratino pesca" style="width:64px;height:72px;margin:0 auto 12px;font-size:13px">${esc((f.nome.split('.').pop() || '').toUpperCase())}</span><p class="secondario" style="margin:0">Nel prototipo non c'è il contenuto del file: nel software vero qui lo sfogli.</p></div></div>`, pulsanti: [{ testo: 'Chiudi', chiudi: true }] });
  };
  R.azioni['mk-file-elimina'] = (el) => {
    const lib = R.stato.libreria;
    const i = lib.findIndex((x) => x.id === el.dataset.id);
    if (i < 0) return;
    const f = lib[i];
    const togli = () => {
      lib.splice(i, 1); R.salva(); R.aggiorna();
      R.avviso(`"${esc(f.nome)}" eliminato`, { annulla() { lib.splice(i, 0, f); R.salva(); R.aggiorna(); } });
    };
    const au = fileInAutomazione(f);
    if (!au) { togli(); return; }
    R.modale({ titolo: 'Questo file è usato in un\'automazione', classe: 'stretta', sottotitolo: `"${esc(f.nome)}" viene inviato dall'automazione "${esc(au.nome)}". Se lo elimini, l'automazione non potrà più inviarlo e ti avviseremo a ogni tentativo.`, pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Elimina lo stesso', classe: 'rosso', fai: () => { setTimeout(togli, 10); } }] });
  };
  R.azioni['mk-carica-file'] = () => {
    if (!(R.amministratore() || R.puo('funnel'))) { R.avviso('Per caricare file serve il permesso su pagine e moduli: chiedilo a un amministratore'); return; }
    const cartelle = [...new Set(R.stato.libreria.map((f) => f.cartella))];
    R.modale({
      titolo: 'Carica file', sottotitolo: 'Massimo 25 MB per file. Nel prototipo il file non lascia il tuo computer: il caricamento è simulato.',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-cf-file">Scegli un file dal computer</label><input class="campo" type="file" id="mk-cf-file" name="file" style="padding-top:12px"></div>
        <div class="etichetta-campo">Oppure prova con un file di esempio</div>
        <label class="opzione"><input type="radio" name="esempio" value="Listino servizi 2026.pdf|1.2" style="width:18px;height:18px;accent-color:var(--verde)"><span class="principale">Listino servizi 2026.pdf<span class="sotto">1,2 MB</span></span></label>
        <label class="opzione"><input type="radio" name="esempio" value="Video presentazione.mp4|38" style="width:18px;height:18px;accent-color:var(--verde)"><span class="principale">Video presentazione.mp4<span class="sotto">38 MB</span></span></label>
        <div class="gruppo-campo spazio-sopra"><label class="etichetta-campo" for="mk-cf-cart">Cartella</label><select class="campo" id="mk-cf-cart" name="cartella">${cartelle.map((c) => `<option>${esc(c)}</option>`).join('')}<option value="__nuova">Nuova cartella…</option></select></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-cf-nc">Nome della nuova cartella (se l'hai scelta)</label><input class="campo" id="mk-cf-nc" name="nuovaCartella" placeholder="es. Listini"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Carica', classe: 'primario', restaAperta: true, fai(fin) {
        const v = R.valori(fin);
        const inp = fin.querySelector('[name=file]');
        let nome; let pesoMb;
        if (inp.files && inp.files[0]) { nome = inp.files[0].name; pesoMb = inp.files[0].size / 1048576; }
        else if (v.esempio) { [nome, pesoMb] = v.esempio.split('|'); pesoMb = +pesoMb; }
        if (!nome) { R.erroreCampo(fin, 'file', 'Scegli un file dal computer oppure uno di esempio.'); return false; }
        if (pesoMb > 25) { R.erroreCampo(fin, 'file', `Il file pesa ${pesoMb.toLocaleString('it-IT', { maximumFractionDigits: 1 })} MB: il massimo è 25 MB. Riducilo, oppure carica il video su YouTube e usa il link.`); return false; }
        if (spazioUsato() + pesoMb > R.stato.spazio.limiteMb) { R.erroreCampo(fin, 'file', 'Lo spazio dell\'azienda è pieno. Elimina qualche file e riprova.'); return false; }
        const cartella = v.cartella === '__nuova' ? v.nuovaCartella : v.cartella;
        if (!cartella) { R.erroreCampo(fin, 'nuovaCartella', 'Scrivi il nome della nuova cartella.'); return false; }
        if (!R.serveConnessione('il caricamento del file')) return false;
        const btn = fin.querySelector('.piede-modale .primario');
        btn.disabled = true; btn.textContent = 'Caricamento…';
        setTimeout(() => {
          R.stato.libreria.unshift({ id: R.id('l'), nome, peso: pesoMb.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' MB', cartella, da: R.utente().id, caricato: R.adesso() });
          R.salva(); R.chiudiModale(true); R.aggiorna();
          R.avviso(`"${esc(nome)}" caricato in ${esc(cartella)}`);
        }, 900);
        return false;
      } }],
    });
  };

  /* ================= Domini ================= */
  const nomeSemaforo = { verde: 'Funziona', giallo: 'In verifica', rosso: 'Non funziona' };
  R.rotta('/marketing/domini', {
    menu: 'marketing', titolo: 'Domini',
    disegna() {
      assicura();
      const sub = sottodominio();
      const collegati = (dom) => R.stato.funnel.filter((f) => !f.eliminato && (f.dominio === dom || (f.linkCorto || '').startsWith(dom + '/')));
      const riga = (d) => {
        const col = collegati(d.nome);
        return `<div class="riga" style="align-items:flex-start;flex-wrap:wrap"><span class="mk-semaforo ${d.stato}" style="margin-top:6px" aria-hidden="true"></span><div class="principale"><div class="titolo-riga">${esc(d.nome)} <span class="etichetta ${d.stato === 'verde' ? 'salvia' : d.stato === 'giallo' ? 'pesca' : 'errore'}">${nomeSemaforo[d.stato]}</span></div><div class="sotto">${esc(d.nota)}</div>
          <div class="sotto" style="margin-top:4px">Collegato: ${col.length ? col.map((f) => `<a class="link verde" style="font-size:12.5px" href="#/marketing/funnel/${f.id}">${esc(f.nome)}</a>`).join(', ') : 'niente per ora'}</div>
          ${(d.reindirizzamenti || []).map((r) => `<div class="sotto" style="margin-top:4px">${R.icona('freccia', 12)} ${esc(r.da)} porta a ${esc(r.a)}</div>`).join('')}</div>
          <div class="riga-flex" style="gap:6px">${d.stato !== 'verde' ? `<button class="btn piccolo primario" data-azione="mk-dom-verifica" data-id="${d.id}">Verifica di nuovo</button>` : ''}<button class="btn piccolo secondario-campo" data-azione="mk-dom-redir" data-id="${d.id}">Aggiungi reindirizzamento</button></div></div>`;
      };
      const rossi = R.stato.domini.filter((d) => d.stato === 'rosso');
      return `${barraMk('domini')}
        <div class="testata"><div><div class="sopratitolo">Marketing · li trovi anche in Impostazioni</div><h1 class="titolo-pagina">Domini</h1><div class="spiegazione">Gli indirizzi su cui pubblichi le pagine. Il sottodominio gratuito è sempre pronto; un dominio tuo è facoltativo.</div></div>
          <div class="azioni-testata"><button class="btn primario" data-azione="mk-dom-collega">${R.icona('piu', 16)} Collega un dominio</button></div></div>
        ${rossi.length ? `<div class="banner rosso">${R.icona('allarme')}<div class="principale"><b>${esc(rossi[0].nome)} non punta più al software.</b> Le pagine collegate non si aprono da quell'indirizzo: controlla le impostazioni presso chi ti vende il dominio, poi premi "Verifica di nuovo".</div></div>` : ''}
        <div class="griglia" style="grid-template-columns:minmax(0,1fr) minmax(0,2fr);align-items:start" id="mk-dom-griglia">
          <div class="riquadro salvia"><div class="etichetta-numero">Sottodominio gratuito</div><div style="font-family:var(--titoli);font-weight:700;font-size:24px;letter-spacing:-0.02em;margin:8px 0;word-break:break-all">${esc(sub)}</div><div class="riga-flex"><span class="mk-semaforo verde" aria-hidden="true"></span><span class="grassetto">Sempre attivo, con certificato di sicurezza</span></div>
            <p style="margin:12px 0 0;font-size:13px">Lo sceglie l'amministratore generale. Se cambia, il vecchio indirizzo porta al nuovo. Pagine pubblicate qui: ${collegati(sub).length || 'nessuna per ora'}.</p></div>
          <div class="riquadro"><h2 class="titolo-riquadro">Domini collegati</h2><div class="elenco">${R.stato.domini.map(riga).join('') || '<div class="vuoto">Nessun dominio collegato. Puoi pubblicare sul sottodominio gratuito oppure collegare un tuo dominio.</div>'}</div></div>
        </div>`;
    },
  });
  R.stile('marketing-domini', '@media (max-width: 1180px) { #mk-dom-griglia { grid-template-columns: minmax(0, 1fr) !important; } }');
  function verificaDominio(d, ms) {
    return new Promise((ok) => setTimeout(() => ok(d.stato === 'rosso' ? 'rosso' : 'verde'), ms));
  }
  R.azioni['mk-dom-verifica'] = async (el) => {
    const d = R.stato.domini.find((x) => x.id === el.dataset.id);
    if (!R.serveConnessione('la verifica del dominio')) return;
    el.disabled = true; el.textContent = 'Verifica in corso…';
    const esito = await verificaDominio(d, 1200);
    if (esito === 'verde') { d.stato = 'verde'; d.nota = 'Collegato e protetto'; R.salva(); R.aggiorna(); R.avviso(`${esc(d.nome)} funziona`); }
    else { R.aggiorna(); R.avviso(`${esc(d.nome)} punta ancora altrove: controlla la riga nelle impostazioni del dominio e riprova`); }
  };
  R.azioni['mk-dom-redir'] = (el) => {
    const d = R.stato.domini.find((x) => x.id === el.dataset.id);
    const destinazioni = R.stato.funnel.filter((f) => !f.eliminato).map((f) => f.indirizzo);
    R.modale({
      titolo: 'Aggiungi un reindirizzamento', classe: 'stretta', sottotitolo: 'Chi apre il primo indirizzo arriva al secondo. Utile per indirizzi vecchi o brevi.',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-rd-da">${esc(d.nome)}/</label><input class="campo" id="mk-rd-da" name="da" placeholder="es. promo"></div><div class="gruppo-campo"><label class="etichetta-campo" for="mk-rd-a">Porta a</label><select class="campo" id="mk-rd-a" name="a">${destinazioni.map((x) => `<option>${esc(x)}</option>`).join('')}</select></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Aggiungi', classe: 'primario', fai(fin) {
        const v = R.valori(fin);
        const da = slug(v.da);
        if (!v.da) { R.erroreCampo(fin, 'da', 'Scrivi la parte finale dell\'indirizzo, per esempio promo.'); return false; }
        if (d.reindirizzamenti.some((r) => r.da === d.nome + '/' + da)) { R.erroreCampo(fin, 'da', 'Questo indirizzo porta già da un\'altra parte. Scegline un altro.'); return false; }
        d.reindirizzamenti.push({ da: d.nome + '/' + da, a: v.a }); R.salva(); R.aggiorna(); R.avviso('Reindirizzamento aggiunto');
      } }],
    });
  };
  R.azioni['mk-dom-collega'] = () => R.modale({
    titolo: 'Collega un dominio', sottotitolo: 'Usa un dominio che hai già comprato (per esempio da Aruba o Register). Ti guidiamo passo per passo.',
    corpo: '<div class="gruppo-campo"><label class="etichetta-campo" for="mk-dc-nome">Il tuo dominio o sottodominio</label><input class="campo" id="mk-dc-nome" name="nome" placeholder="es. offerte.miaazienda.it" autocomplete="off"></div><p class="piccolo secondario" style="margin:0">Consiglio: usa un sottodominio (la parte prima del punto, come "offerte."), così il sito principale resta com\'è.</p>',
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Avanti', classe: 'primario', restaAperta: true, fai(fin) {
      const nome = R.valori(fin).nome.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(nome)) { R.erroreCampo(fin, 'nome', 'Scrivi il dominio senza spazi, per esempio offerte.miaazienda.it.'); return false; }
      if (R.stato.domini.some((d) => d.nome === nome) || nome.endsWith('rampant.it')) { R.erroreCampo(fin, 'nome', 'Questo dominio è già collegato oppure non si può usare. Scegline un altro.'); return false; }
      istruzioniDominio(nome);
      return false;
    } }],
  });
  function istruzioniDominio(nome) {
    const parte = nome.split('.').length > 2 ? nome.split('.')[0] : '@ (il dominio stesso)';
    R.modale({
      titolo: 'Ultimo passo: collega ' + esc(nome),
      sottotitolo: 'Vai dove hai comprato il dominio, apri le impostazioni del dominio (spesso si chiamano "Gestione DNS") e aggiungi una riga con questi valori.',
      corpo: `<div class="riga-impostazione"><span>Tipo di riga</span><span class="valore">CNAME</span></div><div class="riga-impostazione"><span>Nome</span><span class="valore">${esc(parte)}</span></div><div class="riga-impostazione"><span>Valore (dove punta)</span><span class="valore">pagine.rampant.it</span></div>
        <p class="piccolo secondario">Il certificato di sicurezza si attiva da solo. Di solito tutto funziona entro qualche ora: ti avvisiamo nella campanella.</p><div id="mk-dc-esito"></div>`,
      pulsanti: [{ testo: 'Lo faccio più tardi', classe: 'secondario-campo', fai() { aggiungiDominio(nome, 'giallo', 'In attesa: aggiungi la riga presso chi ti vende il dominio, poi premi "Verifica di nuovo"'); R.avviso('Dominio salvato: verificalo quando hai aggiunto la riga'); } },
        { testo: 'Ho fatto, verifica', classe: 'primario', restaAperta: true, fai(fin) {
          if (!R.serveConnessione('la verifica del dominio')) return false;
          const btn = fin.querySelector('.piede-modale .primario');
          btn.disabled = true; btn.textContent = 'Verifica in corso…';
          setTimeout(() => {
            const d = aggiungiDominio(nome, 'giallo', 'In verifica: di solito basta qualche ora');
            const z = document.getElementById('mk-dc-esito');
            if (z) z.innerHTML = `<div class="banner giallo" style="margin:10px 0 0"><span class="mk-semaforo giallo"></span><div class="principale"><b>Abbiamo trovato la riga.</b> Il dominio è in verifica: ti avvisiamo nella campanella quando è pronto (nel prototipo, tra qualche secondo).</div></div>`;
            btn.textContent = 'In verifica';
            setTimeout(() => { d.stato = 'verde'; d.nota = 'Collegato e protetto'; R.notifica(`Il dominio <b>${esc(nome)}</b> è collegato e protetto`, '#/marketing/domini'); R.salva(); if (location.hash === '#/marketing/domini' && !R.modaleAperta()) R.aggiorna(); R.avviso(`${esc(nome)} ora funziona`); }, 5000);
          }, 1300);
          return false;
        } }],
    });
  }
  function aggiungiDominio(nome, stato, nota) {
    let d = R.stato.domini.find((x) => x.nome === nome);
    if (!d) { d = { id: R.id('do'), nome, stato, nota, reindirizzamenti: [] }; R.stato.domini.push(d); }
    R.salva(); R.aggiorna();
    return d;
  }

  /* Ritocchi per il telefono: zone toccabili di almeno 44 px */
  R.stile('marketing-telefono', `@media (max-width: 767px) {
    .mk-pag .btn, .mk-chips button, .mk-suggerimenti button, .mk-msg .chip, .mk-riga-ind, .mk-barra-ai button { min-height: 44px; }
    .mk-barretta button { min-height: 36px; }
    .barra-editor .selettore { order: 5; width: 100%; }
    .barra-editor .riga-flex { width: 100%; }
    .barra-editor .riga-flex .btn { flex: 1; }
    .mk-cornice { width: 232px; }
  }`);
})();
