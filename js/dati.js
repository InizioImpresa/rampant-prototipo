/* Rampant — prototipo. Dati inventati di partenza (nessun dato vero).
   Le date sono calcolate a partire da oggi, così "Oggi", "In ritardo" e il calendario hanno sempre senso. */
(function () {
  'use strict';
  const R = window.R;

  /* Numeri casuali ma sempre uguali (così i dati di partenza non cambiano a ogni prova). */
  function generatore(seme) {
    let s = seme;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  R.datiIniziali = function () {
    const g = R.giorniDa;
    const caso = generatore(42);
    const scegli = (arr) => arr[Math.floor(caso() * arr.length)];

    const stato = {
      versione: R.versioneDati,
      utenteAttivo: 'u1',
      aziendaAttiva: 'a1',
      offline: false,
      inAttesa: [],
      simulazioneWA: null, // null | 'a-fermo' | 'numero-scollegato'
      filtri: {},
      contatoreOperazioni: 0,

      aziende: [
        { id: 'a1', nome: 'Inizio Impresa', iniziale: 'i', colore: '#1F4D3A', tipo: 'propria', stato: 'attiva', utenti: 4, settore: 'Finanza agevolata', sottodominio: 'inizioimpresa', accordoAccettato: true },
        { id: 'a2', nome: 'Inizio Marketing', iniziale: 'IM', colore: '#2A2D28', tipo: 'propria', stato: 'attiva', utenti: 3, settore: 'Attività locale', sottodominio: 'iniziomarketing', accordoAccettato: true },
        { id: 'a3', nome: 'Pizzeria Il Forno', iniziale: 'PF', colore: '#B5541E', tipo: 'cliente', stato: 'attiva', utenti: 2, settore: 'Attività locale / eventi', sottodominio: 'pizzeriailforno', accordoAccettato: true },
        { id: 'a4', nome: 'Termoimpianti Sud', iniziale: 'TS', colore: '#1E3A57', tipo: 'cliente', stato: 'attiva', utenti: 1, settore: 'Servizi e impianti', sottodominio: 'termoimpiantisud', accordoAccettato: true },
        { id: 'a5', nome: 'Auto Mediterranea', iniziale: 'AM', colore: '#45285C', tipo: 'cliente', stato: 'sospesa', utenti: 4, settore: 'Concessionaria', sottodominio: 'automediterranea', accordoAccettato: true },
      ],

      utenti: [
        { id: 'u1', nome: 'Salvatore Gentile', breve: 'Salvatore', iniziali: 'SG', ruolo: 'generale', colore: '#B79AD0', email: 'salvatore@esempio.it', numeroAvvisi: '+39 333 000 0001', assenza: '', stato: 'attivo', avvisi: { software: true, whatsapp: true, email: false }, permessi: {} },
        { id: 'u2', nome: 'Lucia Conti', breve: 'Lucia', iniziali: 'LC', ruolo: 'collaboratore', colore: '#7FB08F', email: 'lucia@esempio.it', numeroAvvisi: '+39 328 924 1179', assenza: '', stato: 'attivo', avvisi: { software: true, whatsapp: true, email: false }, permessi: { vedeTutti: false, esportare: false, eliminare: false, funnel: false, automazioni: false, reportTutti: false, inviiMultipli: false } },
        { id: 'u3', nome: 'Irene Marchetti', breve: 'Irene', iniziali: 'IM', ruolo: 'collaboratore', colore: '#8FB2D6', email: 'irene@esempio.it', numeroAvvisi: '+39 331 927 8888', assenza: '', stato: 'attivo', avvisi: { software: true, whatsapp: true, email: true }, permessi: { vedeTutti: false, esportare: false, eliminare: true, funnel: true, automazioni: false, reportTutti: false, inviiMultipli: false } },
        { id: 'u4', nome: 'Marco Neri', breve: 'Marco', iniziali: 'MN', ruolo: 'collaboratore', colore: '#E7A98A', email: 'marco@esempio.it', numeroAvvisi: '', assenza: '', stato: 'invitato', avvisi: { software: true, whatsapp: false, email: true }, permessi: { vedeTutti: false, esportare: false, eliminare: false, funnel: false, automazioni: false, reportTutti: false, inviiMultipli: false } },
      ],

      percorsi: [
        {
          id: 'p1', nome: 'Finanza agevolata', fasi: [
            { id: 'f1', nome: 'Nuovo contatto', colore: 'salvia' },
            { id: 'f2', nome: 'Da ricontattare', colore: 'pesca' },
            { id: 'f3', nome: 'Documenti richiesti', colore: 'cielo', automazione: 'au2' },
            { id: 'f4', nome: 'Documenti ricevuti', colore: 'lavanda' },
            { id: 'f5', nome: 'Prefattibilità positiva', colore: 'salvia' },
            { id: 'f6', nome: 'Prefattibilità negativa', colore: 'pesca' },
            { id: 'f7', nome: 'Contratto e proforma inviati', colore: 'cielo' },
            { id: 'f8', nome: 'Contratto firmato', plurale: 'Contratti firmati', colore: 'verde', tipo: 'vinto' },
            { id: 'f9', nome: 'Perso', colore: 'errore', tipo: 'perso' },
          ],
        },
        {
          id: 'p2', nome: 'Marketing locale', fasi: [
            { id: 'm1', nome: 'Nuovo contatto', colore: 'salvia' },
            { id: 'm2', nome: 'Contattato', colore: 'pesca' },
            { id: 'm3', nome: 'Proposta', colore: 'cielo' },
            { id: 'm4', nome: 'Confermato', plurale: 'Confermati', colore: 'verde', tipo: 'vinto' },
            { id: 'm5', nome: 'Perso', colore: 'errore', tipo: 'perso' },
          ],
        },
      ],
      motiviPerdita: ['Non ha i requisiti', 'Non risponde più', 'Ha scelto un concorrente', 'Costo troppo alto', 'Progetto rimandato', 'Altro'],

      contatti: [],
      affari: [],
      attivita: [],
      appuntamenti: [],
      messaggi: [],
      storia: [],
      notifiche: [],
      cestino: [],

      numeri: [
        { id: 'n1', nome: 'Lucia', utente: 'u2', telefono: '+39 328 924 1179', statoA: 'collegato', statoB: 'pronto', oggi: 12, limite: 20, creaContatti: false },
        { id: 'n2', nome: 'Irene', utente: 'u3', telefono: '+39 331 927 8888', statoA: 'collegato', statoB: 'pronto', oggi: 9, limite: 20, creaContatti: false },
        { id: 'n3', nome: 'Numero aziendale', utente: null, telefono: '+39 081 000 1234', statoA: 'collegato', statoB: 'pronto', oggi: 16, limite: 20, predefinito: true, creaContatti: true },
      ],

      libreria: [
        { id: 'l1', nome: 'Brochure ZES 2026.pdf', peso: '2,4 MB', cartella: 'Brochure' },
        { id: 'l2', nome: 'Elenco documenti prefattibilità.pdf', peso: '0,3 MB', cartella: 'Documenti' },
        { id: 'l3', nome: 'Brochure Resto al Sud.pdf', peso: '1,8 MB', cartella: 'Brochure' },
        { id: 'l4', nome: 'Presentazione Inizio Impresa.pdf', peso: '3,1 MB', cartella: 'Presentazioni' },
      ],
      risposte: ['Ti richiamo a breve', 'Mi mandi la visura camerale?', 'Grazie, ho ricevuto i documenti', 'A che ora preferisci essere chiamato?'],

      funnel: [
        { id: 'fu1', nome: 'ZES Unica 2026', cartella: 'Finanza agevolata', stato: 'online', indirizzo: 'agevolazioni.inizioimpresa.it/zes2026', percorsoPagina: 'zes2026', visite: 2340, contatti: 142, automazione: 'au1', modulo: 'mo1' },
        { id: 'fu2', nome: 'Resto al Sud 2.0', cartella: 'Finanza agevolata', stato: 'online', indirizzo: 'agevolazioni.inizioimpresa.it/restoalsud', percorsoPagina: 'restoalsud', visite: 1410, contatti: 88, automazione: 'au1', modulo: 'mo1' },
        { id: 'fu3', nome: 'Microcredito', cartella: 'Finanza agevolata', stato: 'bozza', indirizzo: 'agevolazioni.inizioimpresa.it/microcredito', percorsoPagina: 'microcredito', visite: 0, contatti: 0, ultimaModifica: { chi: 'u3', quando: g(0, '09:40') } },
      ],

      automazioni: [
        { id: 'au1', nome: 'Benvenuto nuovi contatti · ZES 2026', stato: 'attiva', passate: 142, inAttesa: 3, cartella: 'Finanza agevolata', descrizione: 'Quando qualcuno compila il modulo ZES 2026' },
        { id: 'au2', nome: 'Richiesta documenti con sollecito', stato: 'attiva', passate: 71, inAttesa: 12, cartella: 'Finanza agevolata', descrizione: 'Quando un affare entra in "Documenti richiesti"' },
        { id: 'au3', nome: 'Recupero di chi non risponde', stato: 'attiva', passate: 230, inAttesa: 18, cartella: 'Finanza agevolata', descrizione: 'Nessuna risposta da 3 giorni' },
      ],

      impostazioni: {
        orario: { giorni: [1, 2, 3, 4, 5], inizio: '09:00', fine: '18:00', festivi: ['01/11', '08/12', '25/12', '26/12'] },
        prefisso: '+39',
        paroleStop: ['stop', 'basta', 'cancellami', 'non scrivermi'],
        limiteWA: 20, pausaMin: 40, pausaMax: 120,
        numeroPieno: 'aspetta',
      },
    };

    /* ---------- Contatti e affari principali (quelli delle immagini) ---------- */
    const principali = [
      { id: 'c1', nome: 'Bianchi srl', referente: 'Mario Bianchi', ruoloReferente: 'titolare', telefono: '+39 333 123 4567', email: 'mario@bianchisrl.it', piva: '01234567890', ateco: '25.62', regione: 'Campania', dipendenti: 12, fonte: 'Facebook', campagna: 'ZES 2026', pagina: 'agevolazioni.inizioimpresa.it/zes2026', responsabile: 'u2', creato: g(-2, '22:30'), colore: 'salvia', nonLetti: 2,
        affare: { id: 'd1', percorso: 'p1', fase: 'f3', bando: 'ZES 2026', valore: 250000, descrizione: 'ZES Unica 2026 · macchinario CNC', responsabile: 'u2', tentativi: [g(-1, '17:20')], documenti: [['Visura camerale', true], ['Bilanci 2024 e 2025', true], ['Preventivo del macchinario', true], ['Documento d\'identità', false], ['Business plan', false]] } },
      { id: 'c2', nome: 'Ferrante Costruzioni', referente: 'Anna Ferrante', ruoloReferente: 'amministratrice', telefono: '+39 340 555 1290', email: 'anna@ferrantecostruzioni.it', piva: '04567812345', ateco: '41.20', regione: 'Puglia', dipendenti: 8, fonte: 'Landing', campagna: 'Resto al Sud', pagina: 'agevolazioni.inizioimpresa.it/restoalsud', responsabile: 'u3', creato: g(-2, '11:05'), colore: 'pesca',
        affare: { id: 'd2', percorso: 'p1', fase: 'f1', bando: 'Resto al Sud', valore: 80000, descrizione: 'Resto al Sud 2.0 · nuovo capannone', responsabile: 'u3', tentativi: [] } },
      { id: 'c3', nome: 'Gallo Esposito snc', referente: 'Luca Gallo', ruoloReferente: 'socio', telefono: '+39 335 400 8812', email: 'luca@galloesposito.it', piva: '07788990011', ateco: '47.11', regione: 'Campania', dipendenti: 5, fonte: 'Facebook', campagna: 'Resto al Sud', pagina: 'agevolazioni.inizioimpresa.it/restoalsud', responsabile: 'u3', creato: g(-9, '10:00'), colore: 'cielo',
        affare: { id: 'd3', percorso: 'p1', fase: 'f2', bando: 'Resto al Sud', valore: 120000, descrizione: 'Resto al Sud 2.0 · ristrutturazione negozio', responsabile: 'u3', tentativi: [g(-8, '10:30')] } },
      { id: 'c4', nome: 'Meccanica Sud', referente: 'Giorgio Russo', ruoloReferente: 'titolare', telefono: '+39 347 210 9934', email: 'info@meccanicasud.it', piva: '03322114455', ateco: '28.41', regione: 'Calabria', dipendenti: 22, fonte: 'Sito', campagna: '', pagina: 'inizioimpresa.it', responsabile: 'u2', creato: g(-27, '09:15'), colore: 'pesca',
        affare: { id: 'd4', percorso: 'p1', fase: 'f2', bando: 'ZES 2026', valore: 600000, descrizione: 'ZES Unica 2026 · nuova linea produttiva', responsabile: 'u2', tentativi: [g(-20, '11:00'), g(-6, '15:00')] } },
      { id: 'c5', nome: 'Verdi Alimentari spa', referente: 'Chiara Verdi', ruoloReferente: 'direttrice', telefono: '+39 081 555 2233', email: 'chiara@verdialimentari.it', piva: '09988776655', ateco: '10.39', regione: 'Campania', dipendenti: 40, fonte: 'Passaparola', campagna: '', pagina: '', responsabile: 'u3', creato: g(-38, '16:00'), colore: 'cielo',
        affare: { id: 'd5', percorso: 'p1', fase: 'f3', bando: 'ZES 2026', valore: 950000, descrizione: 'ZES Unica 2026 · ampliamento stabilimento', responsabile: 'u3', tentativi: [g(-35, '10:00')], documenti: [['Visura camerale', true], ['Bilanci 2024 e 2025', false], ['Preventivi', true], ['Documento d\'identità', true], ['Business plan', false]] } },
      { id: 'c6', nome: 'Oleificio De Luca', referente: 'Antonio De Luca', ruoloReferente: 'titolare', telefono: '+39 329 777 1100', email: 'antonio@oleificiodeluca.it', piva: '05544332211', ateco: '10.41', regione: 'Puglia', dipendenti: 9, fonte: 'Google', campagna: 'Microcredito', pagina: 'agevolazioni.inizioimpresa.it/microcredito', responsabile: 'u2', creato: g(-20, '12:00'), colore: 'lavanda',
        affare: { id: 'd6', percorso: 'p1', fase: 'f5', bando: 'ZES 2026', valore: 420000, descrizione: 'ZES Unica 2026 · frantoio', responsabile: 'u2', seguaci: ['u1'], tentativi: [g(-19, '09:30')] } },
      { id: 'c7', nome: 'Pasticceria Lombardi', referente: 'Sara Lombardi', ruoloReferente: 'titolare', telefono: '+39 338 909 4410', email: 'sara@pasticcerialombardi.it', piva: '06677889900', ateco: '10.71', regione: 'Campania', dipendenti: 4, fonte: 'Facebook', campagna: 'Resto al Sud', pagina: 'agevolazioni.inizioimpresa.it/restoalsud', responsabile: 'u2', creato: g(-7, '19:40'), colore: 'pesca',
        affare: { id: 'd7', percorso: 'p1', fase: 'f1', bando: 'Resto al Sud', valore: 60000, descrizione: 'Resto al Sud 2.0 · laboratorio', responsabile: 'u2', tentativi: [g(-6, '10:00')] } },
      { id: 'c8', nome: 'Esposito Consulting', referente: 'Marco Esposito', ruoloReferente: 'titolare', telefono: '+39 349 123 9876', email: 'marco@espositoconsulting.it', piva: '01122334455', ateco: '70.22', regione: 'Campania', dipendenti: 3, fonte: 'Facebook', campagna: 'ZES 2026', pagina: 'agevolazioni.inizioimpresa.it/zes2026', responsabile: 'u2', creato: g(-15, '10:10'), colore: 'salvia',
        affare: { id: 'd8', percorso: 'p1', fase: 'f4', bando: 'ZES 2026', valore: 180000, descrizione: 'ZES Unica 2026 · software e arredi', responsabile: 'u2', tentativi: [g(-14, '11:00')] } },
      { id: 'c9', nome: 'Neri Arredamenti', referente: 'Paolo Neri', ruoloReferente: 'titolare', telefono: '+39 333 445 5667', email: 'paolo@neriarredamenti.it', piva: '02233445566', ateco: '31.09', regione: 'Lazio', dipendenti: 6, fonte: 'Google', campagna: 'Microcredito', pagina: 'agevolazioni.inizioimpresa.it/microcredito', responsabile: 'u3', creato: g(-30, '15:00'), colore: 'cielo',
        affare: { id: 'd9', percorso: 'p1', fase: 'f7', bando: 'Microcredito', valore: 35000, descrizione: 'Microcredito · attrezzature', responsabile: 'u3', tentativi: [g(-29, '09:00')] } },
      { id: 'c10', nome: 'Rossi Impianti', referente: 'Luigi Rossi', ruoloReferente: 'titolare', telefono: '+39 339 112 2334', email: 'luigi@rossiimpianti.it', piva: '03344556677', ateco: '43.21', regione: 'Campania', dipendenti: 15, fonte: 'Landing', campagna: 'ZES 2026', pagina: 'agevolazioni.inizioimpresa.it/zes2026', responsabile: 'u2', creato: g(-45, '09:00'), colore: 'salvia',
        affare: { id: 'd10', percorso: 'p1', fase: 'f8', bando: 'ZES 2026', valore: 150000, descrizione: 'ZES Unica 2026 · furgoni attrezzati', responsabile: 'u2', tentativi: [g(-44, '10:00')], vintoIl: g(-5, '12:00') } },
      { id: 'c11', nome: 'Colella Bio', referente: 'Giulia Colella', ruoloReferente: 'titolare', telefono: '+39 320 876 5432', email: 'giulia@colellabio.it', piva: '08877665544', ateco: '01.13', regione: 'Basilicata', dipendenti: 2, fonte: 'Facebook', campagna: 'Resto al Sud', pagina: 'agevolazioni.inizioimpresa.it/restoalsud', responsabile: 'u3', creato: g(-25, '18:00'), colore: 'lavanda',
        affare: { id: 'd11', percorso: 'p1', fase: 'f9', bando: 'Resto al Sud', valore: 95000, descrizione: 'Resto al Sud 2.0 · serre', responsabile: 'u3', tentativi: [g(-24, '10:00')], motivoPerdita: 'Non ha i requisiti', persoIl: g(-10, '11:00') } },
      { id: 'c12', nome: 'De Rosa Ottica', referente: 'Valeria De Rosa', ruoloReferente: 'titolare', telefono: '+39 351 234 5678', email: 'valeria@derosaottica.it', piva: '', ateco: '', regione: 'Campania', dipendenti: 3, fonte: 'Facebook', campagna: 'ZES 2026', pagina: 'agevolazioni.inizioimpresa.it/zes2026', responsabile: 'u2', creato: g(0, '07:12'), colore: 'cielo', nonLetti: 1,
        affare: { id: 'd12', percorso: 'p1', fase: 'f1', bando: 'ZES 2026', valore: 40000, descrizione: 'ZES Unica 2026 · nuovo negozio', responsabile: 'u2', tentativi: [] } },
      { id: 'c13', nome: 'Studio Marino', referente: 'Antonio Marino', ruoloReferente: 'commercialista', telefono: '+39 328 777 6655', email: 'studio@studiomarino.it', piva: '09911223344', ateco: '69.20', regione: 'Campania', dipendenti: 4, fonte: 'Sito', campagna: '', pagina: 'inizioimpresa.it', responsabile: null, creato: g(0, '08:05'), colore: 'salvia',
        affare: { id: 'd13', percorso: 'p1', fase: 'f1', bando: 'ZES 2026', valore: null, descrizione: 'ZES Unica 2026 · da capire', responsabile: null, tentativi: [] } },
      { id: 'c14', nome: 'Caruso Ceramiche', referente: 'Elena Caruso', ruoloReferente: 'titolare', telefono: '+39 347 998 1122', email: 'elena@carusoceramiche.it', piva: '04455667788', ateco: '23.41', regione: 'Sicilia', dipendenti: 11, fonte: 'Facebook', campagna: 'ZES 2026', pagina: 'agevolazioni.inizioimpresa.it/zes2026', responsabile: 'u2', creato: g(-18, '14:00'), colore: 'pesca',
        affare: { id: 'd14', percorso: 'p1', fase: 'f6', bando: 'ZES 2026', valore: 300000, descrizione: 'ZES Unica 2026 · forno industriale', responsabile: 'u2', tentativi: [g(-17, '10:00')] } },
      { id: 'c15', nome: 'Ristorante Da Gino', referente: 'Gino Russo', ruoloReferente: 'titolare', telefono: '+39 346 112 9087', email: 'gino@ristorantedagino.it', piva: '07766554433', ateco: '56.10', regione: 'Campania', dipendenti: 7, fonte: 'Sito', campagna: '', pagina: '', responsabile: 'u3', creato: g(-4, '13:00'), colore: 'pesca',
        affare: { id: 'd15', percorso: 'p2', fase: 'm2', bando: 'Marketing', valore: 3600, descrizione: 'Campagna Facebook per eventi', responsabile: 'u3', tentativi: [g(-3, '10:00')] } },
    ];

    const fasiAperteP1 = ['f1', 'f1', 'f1', 'f2', 'f2', 'f3', 'f3', 'f4', 'f5', 'f7'];
    const nomiAziende = ['Panificio Russo', 'Autofficina Marra', 'Hotel Belvedere', 'Tecnoplast', 'Agriturismo Le Querce', 'Studio Dentistico Sorrentino', 'Fabbro Iannone', 'Bio Farm Sud', 'Cartotecnica Vitale', 'Lavanderia Bianca', 'Edil Moderna', 'Cantina Aurora', 'Ferramenta Caputo', 'Farmacia Ruggiero', 'Officina Greco', 'Caseificio Santoro', 'Palestra Energy', 'B&B Il Faro', 'Tipografia Amato', 'Gelateria Polo', 'Sartoria Ferraro', 'Elettro Sud', 'Vivaio Conte', 'Pizzeria Napoli Bella', 'Studio Grafico Leone', 'Termoidraulica Rizzo', 'Salumificio Martino', 'Centro Estetico Luna', 'Falegnameria D\'Angelo', 'Trasporti Barbieri', 'Calzaturificio Moretti', 'Market Fontana', 'Laboratorio Orafo Riccio', 'Serramenti Pagano', 'Distilleria Serra', 'Ottica Visione', 'Ceramiche Mazza', 'Acetificio Gatti', 'Torrefazione Longo', 'Clinica Veterinaria Testa'];
    const nomiPersone = ['Giuseppe', 'Francesca', 'Antonio', 'Maria', 'Vincenzo', 'Anna', 'Salvatore', 'Rosa', 'Ciro', 'Teresa', 'Pasquale', 'Carmela', 'Gennaro', 'Lucia', 'Raffaele', 'Assunta', 'Domenico', 'Elena', 'Michele', 'Paola'];
    const fonti = [['Facebook', 'ZES 2026'], ['Facebook', 'ZES 2026'], ['Facebook', 'Resto al Sud'], ['Landing', 'Resto al Sud'], ['Google', 'Microcredito'], ['Sito', ''], ['Passaparola', '']];
    const regioni = ['Campania', 'Campania', 'Campania', 'Puglia', 'Calabria', 'Sicilia', 'Basilicata'];
    const colori = ['salvia', 'pesca', 'cielo', 'lavanda'];
    nomiAziende.forEach((nomeAz, i) => {
      const [fonte, campagna] = scegli(fonti);
      const persona = nomiPersone[i % nomiPersone.length];
      const cognome = nomeAz.split(' ').slice(-1)[0].replace(/[^A-Za-zàèéìòù']/g, '');
      const resp = scegli(['u2', 'u2', 'u3', 'u3', 'u1']);
      const giorniFa = -Math.floor(1 + caso() * 50);
      const fase = scegli(fasiAperteP1);
      const bando = campagna || scegli(['ZES 2026', 'Resto al Sud', 'Microcredito']);
      const valore = Math.round((20 + caso() * 480)) * 1000;
      const conTentativi = !(fase === 'f1' && caso() < 0.55);
      principali.push({
        id: 'cx' + i, nome: nomeAz, referente: persona + ' ' + cognome, ruoloReferente: 'titolare',
        telefono: '+39 3' + (20 + Math.floor(caso() * 79)) + ' ' + (100 + Math.floor(caso() * 899)) + ' ' + (1000 + Math.floor(caso() * 8999)),
        email: (persona + '@' + nomeAz.toLowerCase().replace(/[^a-z]/g, '') + '.it').toLowerCase(), piva: String(10000000000 + Math.floor(caso() * 89999999999)), ateco: '', regione: scegli(regioni), dipendenti: 1 + Math.floor(caso() * 30),
        fonte, campagna, pagina: campagna === 'ZES 2026' ? 'agevolazioni.inizioimpresa.it/zes2026' : campagna === 'Resto al Sud' ? 'agevolazioni.inizioimpresa.it/restoalsud' : '',
        responsabile: resp, creato: g(giorniFa, (9 + Math.floor(caso() * 10)) + ':' + String(Math.floor(caso() * 6) * 10).padStart(2, '0')), colore: colori[i % 4], storico: true,
        affare: { id: 'dx' + i, percorso: 'p1', fase, bando, valore, descrizione: bando + ' · investimento', responsabile: resp, tentativi: conTentativi ? [g(giorniFa + 1, '10:00')] : [] },
      });
    });

    principali.forEach((p) => {
      const a = p.affare;
      delete p.affare;
      stato.contatti.push(Object.assign({ altriTelefoni: [], altreEmail: [], consensi: { whatsapp: p.fonte === 'Passaparola' || p.fonte === 'Sito' ? 'non-registrato' : 'si', email: p.fonte === 'Passaparola' ? 'non-registrato' : 'si' }, etichette: [], nonLetti: 0, numeroUsato: p.responsabile === 'u3' ? 'n2' : p.responsabile ? 'n1' : 'n3' }, p));
      const percorso = stato.percorsi.find((x) => x.id === a.percorso);
      const fase = percorso.fasi.find((f) => f.id === a.fase);
      stato.affari.push(Object.assign({ contatto: p.id, nome: a.descrizione, seguaci: [], creato: p.creato, stato: fase.tipo === 'vinto' ? 'vinto' : fase.tipo === 'perso' ? 'perso' : 'aperto', documenti: [], faseCambiata: p.creato }, a, {
        documenti: (a.documenti || []).map(([nome, ricevuto]) => ({ nome, ricevuto })),
      }));
    });

    /* ---------- Attività (promemoria e cose da fare) ---------- */
    const att = (id, affare, tipo, titolo, quando, responsabile, extra) => {
      const af = stato.affari.find((x) => x.id === affare);
      stato.attivita.push(Object.assign({ id, affare, contatto: af.contatto, tipo, titolo, quando, responsabile, fatta: false, fattaAlle: null, annullata: false, ricorrente: null }, extra || {}));
    };
    att('t1', 'd1', 'tel', 'Richiamare per i documenti', g(0, '18:00'), 'u2');
    att('t2', 'd4', 'tel', 'Richiamare Giorgio Russo', g(-1, '17:00'), 'u2');
    att('t3', 'd5', 'doc', 'Sollecitare visura e bilanci', g(-3, '10:00'), 'u3');
    att('t4', 'd2', 'tel', 'Primo contatto Anna Ferrante', g(-2, '12:00'), 'u3');
    att('t5', 'd8', 'app', 'Consulenza Esposito', g(0, '10:00'), 'u2', { fatta: true, fattaAlle: g(0, '10:45') });
    att('t6', 'd3', 'doc', 'Ritiro documenti in sede', g(0, '16:30'), 'u3');
    att('t7', 'd6', 'wa', 'Mandare la proposta su WhatsApp', g(1, '11:00'), 'u2');
    att('t8', 'd3', 'tel', 'Richiamare Luca Gallo', g(3, '18:00'), 'u3');
    att('t9', 'd9', 'doc', 'Verificare firma del contratto', g(2, '15:00'), 'u3');
    att('t10', 'd7', 'tel', 'Richiamare Sara Lombardi', g(0, '15:00'), 'u2');
    att('t11', 'd14', 'tel', 'Spiegare l\'esito della prefattibilità', g(-1, '11:00'), 'u2');
    att('t12', 'd15', 'wa', 'Inviare la proposta di campagna', g(1, '10:00'), 'u3');
    stato.affari.filter((a) => a.id.startsWith('dx') && a.stato === 'aperto').forEach((a, i) => {
      if (i % 3 === 0) return; // alcuni senza prossimo passo
      const giorni = [-2, -1, 0, 1, 2, 3, 5, 7][i % 8];
      att('tx' + i, a.id, ['tel', 'doc', 'wa', 'tel'][i % 4], ['Richiamare', 'Sollecitare documenti', 'Inviare la brochure', 'Fissare la consulenza'][i % 4], g(giorni, ['09:30', '11:00', '15:00', '17:30'][i % 4]), a.responsabile);
    });

    /* ---------- Appuntamenti ---------- */
    const app = (id, contatto, affare, titolo, giorni, ora, persona) => {
      const d = new Date(g(giorni, ora));
      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + (giorni < 0 ? -1 : 1)); // niente appuntamenti nel fine settimana
      stato.appuntamenti.push({ id, contatto, affare, titolo, quando: d.toISOString(), durata: 60, persona });
    };
    app('ap1', 'c8', 'd8', 'Esposito · consulenza ZES', 0, '10:00', 'u2');
    app('ap2', 'c3', 'd3', 'Gallo srl · documenti', 0, '16:30', 'u3');
    app('ap3', 'c6', 'd6', 'De Luca · firma proposta', 1, '12:00', 'u1');
    app('ap4', 'c5', 'd5', 'Verdi · sopralluogo', 2, '11:00', 'u3');
    app('ap5', 'c4', 'd4', 'Russo · consulenza', -1, '11:00', 'u2');
    app('ap6', 'c9', 'd9', 'Neri · contratto', 4, '15:00', 'u3');
    app('ap7', 'c1', 'd1', 'Bianchi · consulenza ZES', -6, '09:30', 'u2');
    app('ap8', 'c10', 'd10', 'Rossi · firma contratto', -5, '12:00', 'u2');
    app('ap9', 'c14', 'd14', 'Caruso · esito prefattibilità', 6, '10:00', 'u2');
    app('ap10', 'c15', 'd15', 'Da Gino · proposta', 8, '15:30', 'u3');
    app('ap11', 'c2', 'd2', 'Riunione team', -9, '09:00', 'u1');
    app('ap12', 'c7', 'd7', 'Lombardi · primo incontro', -13, '16:00', 'u2');

    /* ---------- Chat WhatsApp ---------- */
    const msg = (contatto, direzione, testo, quando, extra) => stato.messaggi.push(Object.assign({ id: R.id('m'), contatto, direzione, testo, quando, autore: direzione === 'out' ? 'u2' : null, automatico: false, numero: 'n1', servizio: 'A', stato: direzione === 'out' ? 'letto' : null, file: null }, extra || {}));
    msg('c1', 'out', 'Ciao Mario, sono Lucia di Inizio Impresa. Abbiamo ricevuto la tua richiesta per la ZES 2026: a che ora preferisci essere chiamato?', g(-2, '22:33'), { automatico: true, autore: 'auto', stato: 'letto' });
    msg('c1', 'in', 'Nel pomeriggio, dopo le 17', g(-1, '09:22'));
    msg('c1', 'out', '', g(-1, '17:20'), { file: { nome: 'Brochure ZES 2026.pdf', peso: '2,4 MB' } });
    msg('c1', 'in', 'Grazie, possiamo sentirci oggi pomeriggio?', g(-1, '17:40'));
    msg('c1', 'out', 'Certo! Ti chiamo oggi alle 18.', g(-1, '17:42'));
    msg('c12', 'out', 'Ciao Valeria, sono Lucia di Inizio Impresa. Abbiamo ricevuto la tua richiesta per la ZES 2026: a che ora preferisci essere chiamata?', g(0, '09:00'), { automatico: true, autore: 'auto', stato: 'consegnato' });
    msg('c12', 'in', 'Buongiorno, va bene in tarda mattinata', g(0, '09:14'));
    msg('c4', 'out', 'Buongiorno Giorgio, le scrivo per la ZES: ha avuto modo di vedere la brochure?', g(-6, '15:05'));
    msg('c3', 'out', 'Ciao Luca, sono Irene di Inizio Impresa. Ti ho mandato la brochure di Resto al Sud.', g(-8, '10:40'), { autore: 'u3', numero: 'n2' });
    msg('c3', 'in', 'Grazie, la guardo con mio socio', g(-8, '12:02'), { numero: 'n2' });

    /* ---------- Storia ---------- */
    const ev = (contatto, affare, tipo, testo, quando, autore) => stato.storia.push({ id: R.id('s'), contatto, affare, tipo, testo, quando, autore });
    ev('c1', 'd1', 'modulo', 'Modulo dalla landing ZES 2026 · WhatsApp di benvenuto inviato da solo', g(-2, '22:30'), 'Automazione: Benvenuto nuovi contatti · ZES 2026');
    ev('c1', 'd1', 'fase', 'Fase: Da ricontattare → Documenti richiesti', g(-1, '17:50'), 'u2');
    ev('c1', 'd1', 'email', 'Email: Elenco documenti per la prefattibilità', g(-1, '17:55'), 'u2');
    ev('c1', 'd1', 'chiamata', 'Chiamata · ha risposto · prossimo passo: richiamare oggi alle 18', g(-1, '17:20'), 'u2');
    ev('c1', 'd1', 'nota', 'Mario ha già il preventivo del macchinario CNC, manca il business plan.', g(-1, '18:05'), 'u2');
    ev('c4', 'd4', 'chiamata', 'Chiamata · non risponde', g(-6, '15:00'), 'u2');
    ev('c11', 'd11', 'fase', 'Affare perso · motivo: Non ha i requisiti', g(-10, '11:00'), 'u3');
    ev('c10', 'd10', 'fase', 'Fase: Contratto e proforma inviati → Contratto firmato', g(-5, '12:00'), 'u2');

    /* ---------- Avvisi (campanella) ---------- */
    stato.notifiche.push(
      { id: 'no1', testo: 'Nuovo contatto: <b>De Rosa Ottica</b> dalla landing ZES 2026', link: '#/contatto/c12', per: null, quando: g(0, '07:12'), letta: false, azienda: 'Inizio Impresa' },
      { id: 'no2', testo: 'Nuovo contatto senza responsabile: <b>Studio Marino</b>', link: '#/contatto/c13', per: 'u1', quando: g(0, '08:05'), letta: false, azienda: 'Inizio Impresa' },
      { id: 'no3', testo: 'Mario Bianchi ha risposto su WhatsApp', link: '#/contatto/c1', per: null, quando: g(-1, '17:40'), letta: true, azienda: 'Inizio Impresa' },
    );

    /* Se si prova di notte, ciò che "è successo oggi" non può essere nel futuro: gli orari di oggi vengono
       compressi tra la mezzanotte e adesso, mantenendo l'ordine. */
    const adesso = Date.now();
    const inizioOggi = R.oggi().getTime();
    const passati = [].concat(stato.contatti.map((c) => c.creato), stato.affari.map((a) => a.creato), stato.messaggi.map((m) => m.quando), stato.storia.map((e) => e.quando), stato.notifiche.map((n) => n.quando)).map((x) => new Date(x).getTime());
    const massimo = Math.max(...passati);
    const nelPassato = (iso) => {
      const t = new Date(iso).getTime();
      if (massimo <= adesso || t < inizioOggi) return iso;
      const fine = Math.max(inizioOggi + 60000, adesso - 60000);
      return new Date(inizioOggi + ((t - inizioOggi) / (massimo - inizioOggi)) * (fine - inizioOggi)).toISOString();
    };
    stato.contatti.forEach((c) => { c.creato = nelPassato(c.creato); });
    stato.affari.forEach((a) => { a.creato = nelPassato(a.creato); a.faseCambiata = nelPassato(a.faseCambiata); });
    stato.messaggi.forEach((m) => { m.quando = nelPassato(m.quando); });
    stato.storia.forEach((e) => { e.quando = nelPassato(e.quando); });
    stato.notifiche.forEach((n) => { n.quando = nelPassato(n.quando); });

    return stato;
  };
})();
