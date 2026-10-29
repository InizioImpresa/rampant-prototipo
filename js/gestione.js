/* Rampant — prototipo. Gestione: Automazioni (elenco, modelli pronti, editor a passaggi, prova con un contatto finto),
   Numeri WhatsApp con le simulazioni dei servizi A e B, Impostazioni (utenti e permessi, percorsi, collegamenti, orario…),
   Le tue aziende con il primo avvio guidato, Report.
   Offre agli altri file: R.bannerWhatsApp(), R.statoNumero(id), R.servizioAttivo(id), R.numeriReport(filtri). */
(function () {
  'use strict';
  const R = window.R;

  /* ================= UTILITÀ ================= */
  const clona = (x) => JSON.parse(JSON.stringify(x));
  const ddmm = (d) => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  const minuti = (hm) => { const [h, m] = String(hm || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
  const oraBreve = (hm) => String(hm || '').replace(/^0(\d)/, '$1');
  const NOMI_GIORNI = ['', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'];
  const GIORNI = [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Gio'], [5, 'Ven'], [6, 'Sab'], [7, 'Dom']];
  const PASTELLI = [['salvia', 'Salvia'], ['pesca', 'Pesca'], ['cielo', 'Cielo'], ['lavanda', 'Lavanda']];
  const COLORI_AZIENDA = ['#1F4D3A', '#1E3A57', '#45285C', '#B5541E', '#7A3A1C', '#2A2D28'];
  const P = (tipo, campi) => Object.assign({ id: R.id('ps'), tipo }, campi || {});
  const plurale = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`;
  const euroCent = (n) => n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  const percento = (n) => n.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + '%';

  function pasqua(anno) {
    const a = anno % 19, b = Math.floor(anno / 100), c = anno % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), gg = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - gg + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const x = h + l - 7 * m + 114;
    return new Date(anno, Math.floor(x / 31) - 1, (x % 31) + 1);
  }
  function festiviNazionali() {
    const p = pasqua(new Date().getFullYear());
    const lunedi = new Date(p); lunedi.setDate(p.getDate() + 1);
    return [['01/01', 'Capodanno'], ['06/01', 'Epifania'], [ddmm(p), 'Pasqua'], [ddmm(lunedi), 'Lunedì dell\'Angelo'], ['25/04', 'Liberazione'], ['01/05', 'Festa del lavoro'], ['02/06', 'Festa della Repubblica'], ['15/08', 'Ferragosto'], ['01/11', 'Ognissanti'], ['08/12', 'Immacolata'], ['25/12', 'Natale'], ['26/12', 'Santo Stefano']].map(([data, nome]) => ({ data, nome }));
  }

  /* Orario di invio dell'azienda (giorni 1 = lunedì … 7 = domenica, come in vendite.js) */
  function orarioTesto(o) {
    o = o || R.stato.impostazioni.orario;
    const gg = [...o.giorni].sort((a, b) => a - b);
    let giorni;
    if (!gg.length) giorni = 'nessun giorno';
    else if (gg.length > 2 && gg.every((d, i) => i === 0 || d === gg[i - 1] + 1)) giorni = NOMI_GIORNI[gg[0]] + '–' + NOMI_GIORNI[gg[gg.length - 1]];
    else giorni = gg.map((d) => NOMI_GIORNI[d]).join(', ');
    return `${giorni} · ${oraBreve(o.inizio)}–${oraBreve(o.fine)}`;
  }
  function inOrario(d, o) {
    o = o || R.stato.impostazioni.orario;
    const gs = d.getDay() === 0 ? 7 : d.getDay();
    if (!o.giorni.includes(gs)) return false;
    if ((o.festivi || []).includes(ddmm(d))) return false;
    const hm = d.getHours() * 60 + d.getMinutes();
    return hm >= minuti(o.inizio) && hm < minuti(o.fine);
  }
  function prossimaApertura(da, o) {
    o = o || R.stato.impostazioni.orario;
    if (inOrario(da, o)) return new Date(da);
    for (let i = 0; i < 40; i++) {
      const c = new Date(da); c.setDate(da.getDate() + i); c.setHours(0, minuti(o.inizio), 0, 0);
      if (c >= da && inOrario(c, o)) return c;
    }
    return new Date(da);
  }
  /* Minuti di lavoro (dentro l'orario di invio) tra due date. */
  function minutiLavoro(da, a, o) {
    o = o || R.stato.impostazioni.orario;
    da = new Date(da); a = new Date(a);
    if (a <= da) return 0;
    let tot = 0;
    const giorno = new Date(da); giorno.setHours(0, 0, 0, 0);
    for (let i = 0; i < 800 && giorno < a; i++) {
      const gs = giorno.getDay() === 0 ? 7 : giorno.getDay();
      if (o.giorni.includes(gs) && !(o.festivi || []).includes(ddmm(giorno))) {
        const ini = new Date(giorno); ini.setMinutes(minuti(o.inizio));
        const fin = new Date(giorno); fin.setMinutes(minuti(o.fine));
        const s = Math.max(ini.getTime(), da.getTime()), e = Math.min(fin.getTime(), a.getTime());
        if (e > s) tot += (e - s) / 60000;
      }
      giorno.setDate(giorno.getDate() + 1);
    }
    return Math.round(tot);
  }
  function aggiungiLavoro(da, min, o) {
    o = o || R.stato.impostazioni.orario;
    let t = prossimaApertura(new Date(da), o);
    let resta = min;
    for (let i = 0; i < 60 && resta > 0; i++) {
      const fin = new Date(t); fin.setHours(0, minuti(o.fine), 0, 0);
      const disp = (fin - t) / 60000;
      if (disp >= resta) return new Date(t.getTime() + resta * 60000);
      resta -= Math.max(0, disp);
      t = prossimaApertura(new Date(fin.getTime() + 60000), o);
    }
    return t;
  }
  function durataTesto(m) {
    if (m == null) return '—';
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + String(r).padStart(2, '0') : '');
  }
  const UNITA = { minuti: ['minuto', 'minuti', 1], ore: ['ora', 'ore', 60], giorni: ['giorno', 'giorni', 1440] };
  const durata = (d) => (d && d.quanto ? plurale(d.quanto, UNITA[d.unita || 'giorni'][0], UNITA[d.unita || 'giorni'][1]) : 'subito');
  const aggiungiDurata = (t, d) => new Date(new Date(t).getTime() + (d.quanto || 0) * UNITA[d.unita || 'giorni'][2] * 60000);
  const interruttore = (attr, acceso) => `<label class="interruttore"><input type="checkbox" ${attr} ${acceso ? 'checked' : ''}><span></span></label>`;
  const quandoMinuscolo = (iso) => { const t = R.quandoBreve(iso); return t.charAt(0).toLowerCase() + t.slice(1); };
  const sigla = (a) => (a.iniziale && a.iniziale.length > 1 ? a.iniziale : a.iniziale || R.iniziali(a.nome).length < 2 ? a.nome.replace(/[^A-Za-zÀ-ú]/g, '').slice(0, 2) : R.iniziali(a.nome)).toUpperCase();
  const slug = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
  const generale = () => R.utente().ruolo === 'generale';

  function ge() { return prepara(); }
  function registra(testo) { ge().registro.unshift({ quando: R.adesso(), chi: R.utente().id, testo }); }
  function avvisaAmministratori(testo, link, anche) {
    const ids = R.stato.utenti.filter((u) => ['generale', 'azienda'].includes(u.ruolo) && u.stato === 'attivo').map((u) => u.id);
    (anche || []).forEach((id) => { if (id && !ids.includes(id)) ids.push(id); });
    ids.forEach((id) => R.notifica(testo, link, id));
  }
  /* Elementi con role="button": Invio e Spazio fanno il clic (tastiera). */
  document.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches && ev.target.matches('[role="button"][data-azione]')) { ev.preventDefault(); ev.target.click(); }
  });

  /* ================= DATI DI PARTENZA DELLA GESTIONE ================= */
  const STORICO_INIZIALE = {
    au1: () => [
      { quando: R.giorniDa(0, '09:00'), contatto: 'c12', esito: 'attesa', testo: 'Al passaggio 5 «Ha risposto entro 1 ora?»' },
      { quando: R.giorniDa(0, '08:05'), contatto: 'c13', esito: 'attesa', testo: 'Aspetta l\'orario di invio: senza responsabile, nessun WhatsApp finché non viene assegnato' },
      { quando: R.giorniDa(-2, '22:30'), contatto: 'c1', esito: 'fatta', testo: 'Completata: ha risposto, promemoria creato per Lucia' },
      { quando: R.giorniDa(-7, '19:40'), contatto: 'c7', esito: 'errore', testo: 'WhatsApp non inviato: il contatto non ha dato il consenso per WhatsApp (Non registrato)' },
    ],
    au2: () => [
      { quando: R.giorniDa(-1, '17:50'), contatto: 'c1', esito: 'attesa', testo: 'Aspetta 3 giorni prima del controllo dei documenti' },
      { quando: R.giorniDa(-35, '10:00'), contatto: 'c5', esito: 'attesa', testo: 'Sollecito inviato, in attesa dei documenti mancanti' },
    ],
    au3: () => [
      { quando: R.giorniDa(-6, '15:05'), contatto: 'c4', esito: 'fatta', testo: 'Completata: nessuna risposta, spostato in «Da ricontattare»' },
      { quando: R.giorniDa(-8, '12:02'), contatto: 'c3', esito: 'fermata', testo: 'Fermata: il contatto ha risposto' },
    ],
  };
  const PASSI_INIZIALI = {
    au1: () => ({ quando: { tipo: 'modulo', modulo: 'ZES Unica 2026' }, passi: [
      P('affare', { azione: 'crea', percorso: 'p1', fase: 'f1' }),
      P('assegna', { modo: 'turno', persone: ['u2', 'u3'] }),
      P('whatsapp', { titolo: 'Messaggio di benvenuto', testo: 'Ciao {nome}, sono {responsabile} di Inizio Impresa. Abbiamo ricevuto la tua richiesta per la ZES 2026: a che ora preferisci essere chiamato?', file: null, numero: 'automatico', riserva: true }),
      P('aspetta', { quanto: 2, unita: 'minuti' }),
      P('whatsapp', { titolo: 'Invia la brochure ZES 2026.pdf', testo: '', file: 'l1', numero: 'automatico', riserva: true }),
      P('se', { condizione: 'risposto', ore: 1, si: [P('promemoria', { titolo: 'Chiamalo nell\'orario che ha scelto', entro: 1, a: 'responsabile' })], no: [
        P('whatsapp', { titolo: 'WhatsApp: «Ti chiamo oggi?»', testo: 'Ciao {nome}, ti chiamo oggi?', file: null, numero: 'automatico', riserva: true, dopo: { quanto: 1, unita: 'giorni' } }),
        P('affare', { azione: 'sposta', percorso: 'p1', fase: 'f2', dopo: { quanto: 3, unita: 'giorni' } }),
      ] }),
    ] }),
    au2: () => ({ quando: { tipo: 'fase', percorso: 'p1', fase: 'f3' }, passi: [
      P('whatsapp', { titolo: 'Elenco dei documenti', testo: 'Ciao {nome}, per la prefattibilità ci servono questi documenti: trovi l\'elenco nel file. Puoi mandarli qui o dal link che ti arriva per email.', file: 'l2', numero: 'automatico', riserva: true }),
      P('email', { titolo: 'Email con l\'elenco', oggetto: 'Elenco documenti per la prefattibilità', testo: 'Ciao {nome},\nti mando l\'elenco dei documenti che servono per la prefattibilità.\n{responsabile}', file: 'l2' }),
      P('aspetta', { quanto: 3, unita: 'giorni' }),
      P('se', { condizione: 'fase', percorso: 'p1', fase: 'f4', ore: 72, si: [P('avvisa', { chi: 'responsabile', testo: 'Documenti arrivati: controllali' })], no: [
        P('whatsapp', { titolo: 'Sollecito documenti', testo: 'Ciao {nome}, ti ricordo i documenti per la prefattibilità: ti manca qualcosa? Se vuoi ti aiuto io.', file: null, numero: 'automatico', riserva: true }),
        P('promemoria', { titolo: 'Chiama per i documenti mancanti', entro: 4, a: 'responsabile', dopo: { quanto: 2, unita: 'giorni' } }),
      ] }),
    ] }),
    au3: () => ({ quando: { tipo: 'silenzio', giorni: 3 }, passi: [
      P('whatsapp', { titolo: 'Messaggio di recupero', testo: 'Ciao {nome}, sono {responsabile}: hai avuto modo di pensarci? Se preferisci ti chiamo io, dimmi a che ora.', file: null, numero: 'automatico', riserva: true }),
      P('se', { condizione: 'risposto', ore: 48, si: [P('promemoria', { titolo: 'Richiamalo: ha risposto', entro: 2, a: 'responsabile' })], no: [
        P('affare', { azione: 'sposta', percorso: 'p1', fase: 'f2' }),
        P('etichetta', { azione: 'aggiungi', etichetta: 'Non risponde' }),
      ] }),
    ] }),
    au4: () => ({ quando: { tipo: 'appuntamento' }, passi: [
      P('whatsapp', { titolo: 'Conferma dell\'appuntamento', testo: 'Ciao {nome}, ti confermo l\'appuntamento di {data} alle {ora} con {responsabile}.', file: null, numero: 'responsabile', riserva: true }),
      P('aspetta', { quanto: 1, unita: 'giorni' }),
      P('whatsapp', { titolo: 'Promemoria del giorno prima', testo: 'Ciao {nome}, ti ricordo l\'appuntamento di domani alle {ora}. A presto.', file: null, numero: 'responsabile', riserva: true }),
    ] }),
    au5: () => ({ quando: { tipo: 'etichetta', etichetta: 'Interessato Microcredito' }, passi: [
      P('whatsapp', { titolo: 'Avviso del nuovo bando', testo: 'Ciao {nome}, è uscito il nuovo bando Microcredito: pensiamo possa interessarti. Vuoi che ti richiami?', file: 'l3', numero: 'predefinito', riserva: true }),
      P('se', { condizione: 'risposto', ore: 48, si: [P('promemoria', { titolo: 'Richiama per il Microcredito', entro: 4, a: 'responsabile' })], no: [] }),
    ] }),
    au6: () => ({ quando: { tipo: 'silenzio', giorni: 60 }, passi: [
      P('whatsapp', { titolo: 'Messaggio di riattivazione', testo: 'Ciao {nome}, ci sono novità sui bandi che potrebbero interessarti. Vuoi che ti aggiorni?', file: null, numero: 'automatico', riserva: true }),
      P('se', { condizione: 'risposto', ore: 72, si: [P('affare', { azione: 'sposta', percorso: 'p1', fase: 'f2' })], no: [P('etichetta', { azione: 'aggiungi', etichetta: 'Freddo' })] }),
    ] }),
  };

  function completaAutomazione(a) {
    if (!a.passi) {
      const f = PASSI_INIZIALI[a.id];
      const d = f ? f() : { quando: { tipo: 'modulo', modulo: '' }, passi: [] };
      if (!a.quando) a.quando = d.quando;
      a.passi = d.passi;
    }
    if (!a.quando) a.quando = { tipo: 'modulo', modulo: '' };
    if (!a.storico) a.storico = STORICO_INIZIALE[a.id] ? STORICO_INIZIALE[a.id]() : [];
    if (!a.versioni) a.versioni = [];
    if (a.fermaSeChiuso == null) a.fermaSeChiuso = true;
    if (a.nonDueVolte == null) a.nonDueVolte = true;
    if (a.bozza === undefined) a.bozza = null;
    if (a.passate == null) a.passate = 0;
    if (a.inAttesa == null) a.inAttesa = 0;
    if (!a.cartella) a.cartella = 'Senza cartella';
    if (!a.stato) a.stato = 'bozza';
  }

  function estendi(s) {
    const g = R.giorniDa;
    const fa = (min) => new Date(Date.now() - min * 60000).toISOString();
    if (!s.gestione) s.gestione = {};
    const e = s.gestione;
    if (!e.registro) e.registro = [
      { quando: g(-1, '18:10'), chi: 'u1', testo: 'Ha cambiato i permessi di Irene: ora può modificare funnel, pagine e moduli' },
      { quando: g(-1, '16:20'), chi: 'u1', testo: 'Ha invitato Marco Neri come collaboratore' },
      { quando: g(-3, '09:05'), chi: 'u1', testo: 'Ha esportato i contatti di ottobre' },
      { quando: g(-12, '10:00'), chi: 'u1', testo: 'Ha sospeso l\'azienda Auto Mediterranea' },
    ];
    if (!e.collegamenti) e.collegamenti = [
      { id: 'email', nome: 'Invio email', semaforo: 'verde', testo: 'Le email partono da inizioimpresa.it, dominio verificato', ultima: fa(48) },
      { id: 'domini', nome: 'Domini e certificati di sicurezza', semaforo: 'verde', testo: 'agevolazioni.inizioimpresa.it e inizioimpresa.rampant.it rispondono, certificati validi', ultima: fa(130) },
      { id: 'meta', nome: 'Moduli pubblicitari di Facebook e Instagram', semaforo: 'giallo', testo: 'In attesa della revisione di Meta: per ora i contatti arrivano tramite Pabbly', ultima: fa(95) },
      { id: 'pixel', nome: 'Pixel di Meta e Google Analytics', semaforo: 'verde', testo: 'Attivi sulle pagine online, solo dopo il consenso ai cookie', ultima: fa(20) },
      { id: 'calendar', nome: 'Google Calendar', semaforo: 'giallo', testo: 'Collegato per Salvatore e Lucia; Irene non l\'ha ancora collegato', ultima: fa(35) },
      { id: 'webhook', nome: 'Collegamenti con Pabbly, Zapier e Make (webhook)', semaforo: 'verde', testo: '1 collegamento attivo: Pabbly per i contatti di Meta', ultima: fa(95) },
      { id: 'fogli', nome: 'Google Fogli', semaforo: 'verde', testo: 'Ogni nuovo contatto ZES va nel foglio «Contatti ZES 2026»', ultima: fa(95) },
      { id: 'slack', nome: 'Slack', semaforo: 'spento', testo: 'Non collegato', ultima: null },
      { id: 'spese', nome: 'Spese pubblicitarie (Meta Ads e Google Ads)', semaforo: 'verde', testo: 'Spese di ieri aggiornate stanotte', ultima: fa(400) },
    ];
    if (!e.reportMensile) e.reportMensile = { attivo: false, destinatari: ['u1'], giorno: 1 };
    if (!e.festiviAzienda) e.festiviAzienda = [{ data: '19/09', nome: 'San Gennaro, patrono di Napoli' }];
    if (!e.archivioNumeri) e.archivioNumeri = [];
    if (!e.primoAvvioInizio) e.primoAvvioInizio = { completato: true };
    const imp = s.impostazioni;
    if (imp && imp.orario) {
      if (!imp.orario.festivi) imp.orario.festivi = [];
      festiviNazionali().concat(e.festiviAzienda).forEach((f) => { if (!imp.orario.festivi.includes(f.data)) imp.orario.festivi.push(f.data); });
      if (imp.cambioRiserva == null) imp.cambioRiserva = true;
      if (!imp.avvisiScollegato) imp.avvisiScollegato = 'Email + WhatsApp';
    }
    (s.utenti || []).forEach((u) => { if (u.stato === 'invitato' && !u.invitoIl) u.invitoIl = g(-1, '16:20'); });
    (s.aziende || []).forEach((a) => { if (a.stato === 'sospesa' && !a.sospesaIl) a.sospesaIl = g(-12, '10:00'); });
    (s.numeri || []).forEach((n) => { if (!n.provaA) n.provaA = fa(3); if (!n.provaB) n.provaB = fa(3); if (n.coda == null) n.coda = 0; });
    const p1 = (s.percorsi || []).find((p) => p.id === 'p1');
    if (p1 && !p1.tappeReport) p1.tappeReport = [{ fase: 'f3', nome: 'Documenti' }, { fase: 'f5', nome: 'Prefattibilità' }];
    if (s.automazioni) {
      const aggiungi = (o) => { if (!s.automazioni.some((a) => a.id === o.id)) s.automazioni.push(o); };
      aggiungi({ id: 'au4', nome: 'Promemoria appuntamento', stato: 'attiva', passate: 64, inAttesa: 5, cartella: 'Appuntamenti', descrizione: 'Quando un contatto prenota un appuntamento' });
      aggiungi({ id: 'au5', nome: 'Avviso nuovo bando Microcredito', stato: 'pausa', passate: 38, inAttesa: 4, cartella: 'Finanza agevolata', descrizione: 'Quando un contatto riceve l\'etichetta «Interessato Microcredito»' });
      aggiungi({ id: 'au6', nome: 'Riattivazione contatti fermi', stato: 'bozza', passate: 0, inAttesa: 0, cartella: 'Marketing locale', descrizione: 'Nessuna risposta da 60 giorni' });
      s.automazioni.forEach(completaAutomazione);
    }
    if (!e.meta) {
      e.meta = metaIniziale();
      if (s.notifiche && !s.notifiche.some((n) => n.id === 'no-meta1')) s.notifiche.unshift({ id: 'no-meta1', testo: 'Nuovo modulo Meta non collegato: <b>ZES 2026 – modulo verifica (copia 24/10)</b> · 3 contatti in attesa', link: '#/impostazioni/meta', per: 'u1', quando: fa(48), letta: false, azienda: 'Inizio Impresa' });
    }
    e.pronta = 1;
  }
  R.estendiDati(estendi);
  /* Se i dati salvati nel browser sono di prima di questo file, completa quello che manca (una volta per caricamento). */
  let statoPreparato = null;
  function prepara() {
    if (statoPreparato !== R.stato || !R.stato.gestione) { estendi(R.stato); R.salva(); statoPreparato = R.stato; }
    R.stato.automazioni.forEach(completaAutomazione);
    return R.stato.gestione;
  }

  /* ================= STILE ================= */
  R.stile('gestione', `
    .ge-banner-lavanda { background: var(--lavanda); color: var(--lavanda-t); }
    .ge-banner-info { background: var(--salvia); color: var(--salvia-t); }
    .ge-banner-bianco { background: var(--bianco); }
    /* Numeri WhatsApp */
    .ge-numeri { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--spazio); }
    .ge-numero { background: var(--bianco); border-radius: var(--r-grande); padding: 20px; display: flex; flex-direction: column; gap: 6px; min-height: 218px; min-width: 0; border: 0; text-align: left; }
    .ge-numero.rosso { background: var(--errore); color: var(--errore-t); }
    .ge-numero.nuovo { background: transparent; border: 2px dashed #D9D3C7; align-items: center; justify-content: center; gap: 10px; color: var(--testo-3); font-weight: 600; }
    .ge-numero .nome { font-family: var(--titoli); font-weight: 700; font-size: 22px; letter-spacing: -0.02em; line-height: 1.1; margin-top: 12px; }
    .ge-barra { height: 8px; background: var(--linea); border-radius: 999px; overflow: hidden; }
    .ge-barra span { display: block; height: 100%; background: var(--verde); border-radius: 999px; }
    .ge-barra.pieno span { background: var(--errore-t); }
    .ge-tre { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--spazio); align-items: start; }
    .ge-ordine { list-style: none; padding: 0; margin: 0; }
    .ge-ordine li { display: flex; gap: 12px; align-items: flex-start; padding: 6px 0; font-size: 14px; }
    .ge-ordine .n { width: 28px; height: 28px; border-radius: 50%; background: var(--verde); color: #fff; display: grid; place-items: center; font-weight: 600; font-size: 12.5px; flex: none; }
    .ge-qr { width: 132px; height: 132px; background: var(--campo); border-radius: 20px; display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr); gap: 6px; padding: 14px; margin: 4px auto 12px; }
    .ge-qr i { background: var(--scuro); border-radius: 3px; }
    .ge-qr i.v { background: transparent; }
    .ge-passi-qr { text-align: center; font-size: 13px; color: var(--testo-3); line-height: 1.6; }
    .ge-avviso-lavoro { background: var(--pesca); color: var(--pesca-t); border-radius: 18px; padding: 12px 14px; font-size: 13px; }
    .ge-sicurezza .riga-impostazione { font-size: 13.5px; }
    .ge-sicurezza .riga-impostazione .valore { white-space: nowrap; }
    .ge-sicurezza a.valore { color: var(--lime); text-decoration: underline; text-underline-offset: 3px; }
    .ge-servizi { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
    .ge-servizio { background: var(--campo); border-radius: 18px; padding: 12px 14px; font-size: 13px; }
    .ge-servizio b { display: block; font-size: 14px; }
    /* Automazioni: elenco */
    .ge-auto-riga { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--linea); min-height: 64px; }
    .ge-auto-riga:last-child { border-bottom: 0; }
    .ge-auto-riga .principale { flex: 1; min-width: 0; }
    .ge-auto-riga a.titolo-riga { text-decoration: none; font-weight: 600; font-size: 15px; }
    .ge-auto-numeri { font-size: 12.5px; color: var(--testo-2); text-align: right; white-space: nowrap; line-height: 1.5; }
    .ge-auto-numeri b { color: var(--testo); font-size: 14px; }
    .ge-modelli { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--spazio); }
    .ge-modello { background: var(--campo); border-radius: var(--r-medio); padding: 16px 18px; display: flex; flex-direction: column; gap: 8px; text-align: left; border: 0; min-width: 0; }
    .ge-modello .grassetto { font-size: 15px; }
    .ge-modello p { margin: 0; font-size: 13px; color: var(--testo-2); flex: 1; }
    /* Automazioni: editor */
    .ge-libreria { padding: 18px 16px !important; }
    .ge-libreria h2 { font-family: var(--titoli); font-size: 19px; letter-spacing: -0.02em; margin: 4px 4px 12px; }
    .ge-voce { display: flex; align-items: center; width: 100%; text-align: left; border: 0; background: var(--campo); border-radius: 14px; padding: 8px 12px; margin-bottom: 8px; font-size: 13.5px; min-height: 40px; color: var(--testo-3); }
    .ge-voce:hover { filter: brightness(0.97); }
    .ge-voce.attiva, .ge-voce.salvia { background: var(--salvia); color: var(--salvia-t); }
    .ge-voce.wa { background: var(--wa-inviato); color: var(--wa-inviato-t); }
    .ge-voce.cielo { background: var(--cielo); color: var(--cielo-t); }
    .ge-voce.pesca { background: var(--pesca); color: var(--pesca-t); }
    .ge-voce.lavanda { background: var(--lavanda); color: var(--lavanda-t); }
    .ge-tela { background: #E6E1D8; border-radius: var(--r-grande); padding: 24px 14px 30px; min-height: 560px; display: flex; flex-direction: column; align-items: center; overflow-x: auto; min-width: 0; }
    .ge-blocco { width: 392px; max-width: 100%; text-align: left; background: var(--bianco); border-radius: 20px; padding: 12px 16px; display: block; cursor: pointer; color: var(--testo); flex: none; }
    .ge-blocco:focus-visible { outline: 2px solid var(--verde); outline-offset: 2px; }
    .ge-blocco .ge-tipo { font-size: 10.5px; letter-spacing: .04em; text-transform: uppercase; color: var(--testo-2); }
    .ge-blocco .ge-sel { font-size: 10.5px; color: var(--testo-2); }
    .ge-blocco .ge-titolo { font-weight: 600; font-size: 15px; line-height: 1.3; margin-top: 2px; overflow-wrap: anywhere; }
    .ge-blocco .ge-sotto { font-size: 12px; color: var(--testo-2); margin-top: 2px; }
    .ge-blocco.quando { background: var(--verde); color: #fff; }
    .ge-blocco.quando .ge-tipo { color: var(--lime); }
    .ge-blocco.wa { background: var(--wa-inviato); color: var(--wa-inviato-t); }
    .ge-blocco.wa .ge-tipo, .ge-blocco.wa .ge-sel, .ge-blocco.wa .ge-sotto { color: #2B5A3B; }
    .ge-blocco.cielo { background: var(--cielo); color: var(--cielo-t); }
    .ge-blocco.cielo .ge-tipo, .ge-blocco.cielo .ge-sotto, .ge-blocco.cielo .ge-sel { color: var(--cielo-t); }
    .ge-blocco.pesca { background: var(--pesca); color: var(--pesca-t); }
    .ge-blocco.pesca .ge-tipo, .ge-blocco.pesca .ge-sotto, .ge-blocco.pesca .ge-sel { color: var(--pesca-t); }
    .ge-blocco.lavanda { background: var(--lavanda); color: var(--lavanda-t); }
    .ge-blocco.lavanda .ge-tipo, .ge-blocco.lavanda .ge-sotto, .ge-blocco.lavanda .ge-sel { color: var(--lavanda-t); }
    .ge-blocco.aspetta { background: #F7F4EE; text-align: center; border-radius: 999px; color: var(--testo-3); padding: 11px 16px; font-size: 14px; }
    .ge-blocco.scelto { box-shadow: inset 0 0 0 2px var(--verde); }
    .ge-blocco.quando.scelto { box-shadow: inset 0 0 0 3px var(--lime); }
    .ge-linea { width: 2px; height: 22px; background: #77796F; flex: none; }
    .ge-rami { display: grid; grid-template-columns: repeat(2, 256px); column-gap: 44px; justify-content: center; }
    .ge-ramo { display: flex; flex-direction: column; align-items: center; min-width: 0; }
    .ge-ramo .ge-blocco { width: 256px; }
    .ge-esito { background: var(--bianco); border-radius: 999px; padding: 2px 11px; font-size: 12px; font-weight: 600; color: var(--verde); }
    .ge-esito.no { color: var(--errore-t); }
    .ge-aggiungi { border: 1.5px dashed #9C978C; background: transparent; border-radius: 999px; padding: 8px 18px; font-weight: 600; font-size: 13px; color: var(--testo-3); min-height: 44px; }
    .ge-aggiungi:hover { background: rgba(255,255,255,.4); }
    .ge-aggiungi.piccola { min-height: 36px; padding: 4px 12px; font-size: 12px; }
    .ge-strumenti { display: flex; gap: 6px; margin-top: 9px; flex-wrap: wrap; }
    .ge-strumenti button { border: 0; background: rgba(255,255,255,.75); border-radius: 999px; min-height: 32px; padding: 0 11px; font-size: 12px; display: inline-flex; align-items: center; gap: 4px; color: var(--testo); font-weight: 500; }
    .ge-pill-attiva { display: inline-flex; align-items: center; gap: 9px; min-height: 44px; padding: 0 18px 0 14px; border-radius: 999px; border: 0; background: var(--campo); font-weight: 600; font-size: 14px; color: var(--testo-3); }
    .ge-pill-attiva .ge-casella { width: 18px; height: 18px; border-radius: 5px; background: var(--bianco); box-shadow: inset 0 0 0 1.5px #A8A398; display: grid; place-items: center; color: #fff; }
    .ge-pill-attiva.on { background: var(--salvia); color: var(--salvia-t); }
    .ge-pill-attiva.on .ge-casella { background: var(--verde); box-shadow: none; }
    .ge-pill-attiva.pausa { background: var(--pesca); color: var(--pesca-t); }
    .ge-pannello h2 { font-family: var(--titoli); font-size: 21px; letter-spacing: -0.02em; margin: 0 0 12px; }
    .ge-pannello .riga-impostazione { border-radius: 20px; }
    .ge-area-auto { grid-template-columns: 260px minmax(0, 1fr) 340px; }
    @media (max-width: 1180px) { .ge-area-auto { grid-template-columns: 230px minmax(0, 1fr); } }
    @media (max-width: 767px) { .ge-area-auto { grid-template-columns: minmax(0, 1fr); } }
    .ge-anteprima { margin-top: var(--spazio); }
    .ge-bolla { background: var(--wa-inviato); color: var(--wa-inviato-t); border-radius: 16px; padding: 12px 14px; font-size: 13.5px; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
    .ge-bolla + .ge-bolla { margin-top: 8px; }
    .ge-bolla.file { display: flex; gap: 10px; align-items: center; white-space: normal; }
    .ge-gettone { background: var(--salvia); color: var(--salvia-t); border-radius: 6px; padding: 0 4px; font-weight: 600; }
    .ge-prova-riga { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--linea); }
    .ge-prova-riga:last-child { border-bottom: 0; }
    .ge-prova-ora { font-size: 12.5px; font-weight: 600; color: var(--verde); background: var(--salvia); border-radius: 999px; padding: 4px 10px; text-align: center; align-self: start; }
    .ge-prova-riga.aspetta .ge-prova-ora { background: var(--campo); color: var(--testo-3); }
    .ge-prova-nota { font-size: 12.5px; color: var(--pesca-t); background: var(--pesca); border-radius: 12px; padding: 6px 10px; margin-top: 6px; }
    .ge-opzione-grande { display: block; width: 100%; text-align: left; }
    /* Impostazioni */
    .ge-imp { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: var(--spazio); align-items: start; }
    .ge-imp.tre { grid-template-columns: 240px minmax(0, 1fr) minmax(0, 445px); }
    .ge-menu-imp { background: var(--bianco); border-radius: var(--r-grande); padding: 12px; }
    .ge-menu-imp a { display: flex; align-items: center; justify-content: space-between; gap: 6px; padding: 9px 14px; border-radius: 999px; text-decoration: none; color: var(--testo-3); font-size: 14px; min-height: 40px; }
    .ge-menu-imp a:hover { background: var(--campo); }
    .ge-menu-imp a.attivo { background: var(--verde); color: #fff; font-weight: 600; }
    .ge-menu-imp a svg { opacity: .55; flex: none; }
    .ge-avatar { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 600; flex: none; }
    .ge-avatar.salvia { background: var(--salvia); color: var(--salvia-t); } .ge-avatar.pesca { background: var(--pesca); color: var(--pesca-t); }
    .ge-avatar.cielo { background: var(--cielo); color: var(--cielo-t); } .ge-avatar.lavanda { background: var(--lavanda); color: var(--lavanda-t); }
    .ge-chi { display: block; width: 100%; text-align: left; border: 0; background: var(--scuro-2); color: var(--scuro-t); border-radius: 18px; padding: 12px 16px; margin-bottom: 9px; }
    .ge-chi .grassetto { margin-bottom: 6px; }
    .ge-perm { display: inline-flex; border-radius: 999px; padding: 3px 9px; font-size: 11.5px; margin: 0 4px 4px 0; background: #3A3E37; color: #B5B1A7; font-weight: 500; }
    .ge-perm.on { background: var(--lime); color: var(--scuro); font-weight: 600; }
    .ge-azienda { display: flex; align-items: center; gap: 12px; background: var(--campo); border-radius: 20px; padding: 12px 14px; margin-bottom: 10px; min-height: 60px; }
    .ge-azienda.qui { background: var(--salvia); color: var(--salvia-t); }
    .ge-azienda .principale { flex: 1; min-width: 0; }
    .ge-azienda .titolo-riga { font-weight: 600; font-size: 15px; }
    .ge-azienda .sotto { font-size: 12px; color: var(--testo-2); }
    .ge-azienda.qui .sotto { color: var(--salvia-t); }
    .ge-azienda .quadratino { color: #fff; font-size: 12px; }
    .ge-azienda.chiusa { opacity: .7; }
    .ge-fase-riga { display: grid; grid-template-columns: 18px minmax(0, 1fr) 130px 72px auto; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--linea); }
    .ge-fase-riga:last-child { border-bottom: 0; }
    .ge-fase-riga .campo { min-height: 42px; }
    .ge-pallino { width: 18px; height: 18px; border-radius: 50%; background: var(--campo); }
    .ge-pallino.salvia { background: #A9C9B2; } .ge-pallino.pesca { background: #EDB794; } .ge-pallino.cielo { background: #A9C3E0; } .ge-pallino.lavanda { background: #D4BDE5; }
    .ge-pallino.verde { background: var(--verde); } .ge-pallino.errore { background: #E9A39C; }
    .ge-semaforo { width: 14px; height: 14px; border-radius: 50%; flex: none; background: #CFC8BA; }
    .ge-semaforo.verde { background: #2E8B57; } .ge-semaforo.giallo { background: #E0A33A; } .ge-semaforo.rosso { background: var(--errore-t); }
    .ge-giorni { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
    .ge-giorno { position: relative; display: inline-block; }
    .ge-giorno input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
    .ge-giorno span { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; min-width: 56px; padding: 0 14px; border-radius: 999px; background: var(--campo); font-weight: 600; font-size: 13.5px; color: var(--testo-3); }
    .ge-giorno input:checked + span { background: var(--verde); color: #fff; }
    .ge-giorno input:focus-visible + span { outline: 2px solid var(--verde); outline-offset: 2px; }
    .ge-chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 6px 8px 6px 13px; background: var(--campo); font-size: 13px; margin: 0 6px 8px 0; }
    .ge-chip button { border: 0; background: var(--bianco); width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; padding: 0; }
    .ge-chip.fisso { padding-right: 13px; }
    .ge-riga-aggiungi { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; }
    .ge-riga-aggiungi .campo { flex: 1; min-width: 140px; }
    .ge-elenco-modificabile .riga { min-height: 54px; padding: 6px 0; gap: 8px; }
    .ge-elenco-modificabile .campo { min-height: 42px; }
    /* Primo avvio */
    .ge-wizard { display: grid; grid-template-columns: 270px minmax(0, 1fr); gap: var(--spazio); align-items: start; }
    .ge-passi-wiz button { display: flex; gap: 10px; align-items: center; width: 100%; border: 0; background: transparent; text-align: left; padding: 8px 10px; border-radius: 16px; min-height: 44px; font-size: 13.5px; color: var(--testo-3); }
    .ge-passi-wiz button:hover { background: var(--campo); }
    .ge-passi-wiz button.attuale { background: var(--salvia); color: var(--salvia-t); font-weight: 600; }
    .ge-passi-wiz .n { width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; background: var(--campo); font-weight: 600; font-size: 12px; flex: none; }
    .ge-passi-wiz .n.fatto { background: var(--verde); color: #fff; }
    .ge-passi-wiz .n.saltato { background: var(--pesca); color: var(--pesca-t); }
    .ge-passi-wiz .stato { margin-left: auto; font-size: 11.5px; color: var(--testo-2); font-weight: 500; }
    .ge-piede-wiz { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--linea); }
    .ge-piede-wiz .sinistra { margin-right: auto; }
    .ge-colori { display: flex; gap: 10px; flex-wrap: wrap; }
    .ge-colori label { position: relative; }
    .ge-colori input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
    .ge-colori span { display: block; width: 44px; height: 44px; border-radius: 14px; }
    .ge-colori input:checked + span { box-shadow: 0 0 0 3px var(--bianco), 0 0 0 5px var(--verde); }
    .ge-colori input:focus-visible + span { outline: 2px solid var(--verde); outline-offset: 4px; }
    .ge-fasi-chip { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
    /* Report */
    .ge-rep { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: var(--spazio); align-items: start; }
    .ge-tab { width: 100%; border-collapse: collapse; min-width: 520px; }
    .ge-tab th { text-align: left; font-weight: 500; color: var(--testo-2); font-size: 12.5px; padding: 6px 8px; white-space: nowrap; }
    .ge-tab td { padding: 8px; font-size: 13.5px; vertical-align: middle; }
    .ge-tab td:first-child { white-space: nowrap; }
    .ge-tab.righe td { border-top: 1px solid var(--linea); padding: 13px 8px; }
    .ge-barra-fonte { height: 12px; background: var(--campo); border-radius: 999px; overflow: hidden; min-width: 80px; }
    .ge-barra-fonte span { display: block; height: 100%; border-radius: 999px; }
    .ge-tappa { background: var(--scuro-2); border-radius: 14px; padding: 10px 14px; display: flex; justify-content: space-between; gap: 12px; font-size: 15px; margin-bottom: 9px; min-width: 170px; }
    .ge-tappa b { font-family: var(--titoli); font-weight: 700; }
    .ge-tappa.ultima { background: var(--lime); color: var(--scuro); }
    .ge-pagina-r { background: var(--bianco); color: var(--testo); border-radius: 14px; padding: 11px 14px; display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; font-size: 14px; }
    .ge-pagina-r b { color: var(--verde); }
    .ge-dizionario dt { font-weight: 600; font-size: 13px; margin-top: 8px; }
    .ge-dizionario dd { margin: 2px 0 0; font-size: 12.5px; color: var(--testo-2); }
    @media (max-width: 1180px) {
      .ge-numeri { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ge-tre { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ge-modelli { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .ge-imp.tre { grid-template-columns: 220px minmax(0, 1fr); }
      .ge-imp.tre > .ge-colonna-destra { grid-column: 2; }
      .ge-imp { grid-template-columns: 220px minmax(0, 1fr); }
    }
    @media (max-width: 767px) {
      .ge-numeri, .ge-tre, .ge-modelli, .ge-servizi { grid-template-columns: minmax(0, 1fr); }
      .ge-numero { min-height: 0; }
      .ge-imp, .ge-imp.tre, .ge-wizard, .ge-rep { grid-template-columns: minmax(0, 1fr); }
      .ge-imp.tre > .ge-colonna-destra { grid-column: auto; }
      .ge-solo-computer { display: none !important; }
      .ge-blocco, .ge-ramo .ge-blocco { width: 100%; }
      .ge-rami { grid-template-columns: minmax(0, 1fr); row-gap: 6px; width: 100%; }
      .ge-tela { padding: 18px 12px 24px; min-height: 0; }
      .ge-auto-riga { flex-wrap: wrap; }
      .ge-auto-numeri { text-align: left; }
      .ge-fase-riga { grid-template-columns: 18px minmax(0, 1fr) auto; }
      .ge-fase-riga .ge-colore-sel, .ge-fase-riga .ge-conto { grid-column: 2 / -1; }
      .ge-prova-riga { grid-template-columns: minmax(0, 1fr); gap: 6px; }
      .ge-prova-ora { justify-self: start; }
    }
  `);

  /* ================= WHATSAPP: stato dei numeri e banner (offerti a vendite.js) ================= */
  const numeroDa = (id) => R.stato.numeri.find((n) => n.id === id);
  const predefinito = () => R.stato.numeri.find((n) => n.predefinito) || R.stato.numeri[0];
  const nomeNumero = (n) => (n.utente ? 'numero di ' + R.utenteDa(n.utente).breve : 'numero aziendale');
  /* Servizio che sta inviando per quel numero: 'A', 'B' oppure null (numero fermo). */
  R.servizioAttivo = (id) => {
    const n = numeroDa(id);
    if (!n) return null;
    if (n.statoA === 'collegato') return 'A';
    if (n.statoB === 'invia' || (n.statoA === 'fermo' && n.statoB === 'pronto')) return 'B';
    return null;
  };
  R.statoNumero = (id) => {
    const n = numeroDa(id);
    if (!n) return 'Numero non collegato';
    if (n.statoA === 'scollegato' && n.statoB === 'scollegato') return 'Scollegato da WhatsApp';
    if (n.statoA === 'collegato') return n.statoB === 'scollegato' ? 'A collegato · B da ricollegare' : 'A collegato · B pronto';
    if (R.servizioAttivo(id) === 'B') return 'A fermo · invia B';
    return 'Fermo su A e su B';
  };
  const numeroFermo = (n) => R.servizioAttivo(n.id) === null;
  const coloreStatoNumero = (n) => (numeroFermo(n) ? 'errore' : n.statoA === 'collegato' && n.statoB !== 'scollegato' ? 'salvia' : 'pesca');
  /* Tiene allineata la simulazione con lo stato dei numeri. */
  function allineaSimulazione() {
    const n = R.stato.numeri;
    R.stato.simulazioneWA = n.some((x) => x.statoA === 'fermo') ? 'a-fermo' : n.some((x) => numeroFermo(x)) ? 'numero-scollegato' : null;
  }
  R.bannerWhatsApp = () => {
    if (!R.stato || !R.stato.numeri) return '';
    const u = R.utente();
    const admin = R.amministratore();
    const suWhatsApp = R.posizione().percorso === '/whatsapp';
    let html = '';
    const riserva = R.stato.numeri.some((n) => n.statoA === 'fermo' && R.servizioAttivo(n.id) === 'B');
    if (admin && (R.stato.simulazioneWA === 'a-fermo' || riserva)) {
      html += `<div class="banner giallo">${R.icona('allarme')}<div class="principale"><b>Il servizio principale di WhatsApp non risponde.</b> Stiamo inviando con il servizio di riserva, non devi fare nulla.</div>${suWhatsApp ? '' : '<button class="btn piccolo" data-azione="vai" data-dove="#/whatsapp">Vedi i numeri</button>'}</div>`;
    }
    R.stato.numeri.filter((n) => numeroFermo(n) && (admin || n.utente === u.id)).forEach((n) => {
      const chi = n.utente === u.id ? 'Il tuo numero' : n.utente ? 'Il numero di ' + R.esc(R.utenteDa(n.utente).breve) : 'Il numero aziendale';
      const cosa = n.statoA === 'scollegato' ? 'è stato scollegato da WhatsApp' : 'è fermo su entrambi i servizi';
      html += `<div class="banner rosso">${R.icona('allarme')}<div class="principale"><b>${chi} (${R.esc(n.telefono)}) ${cosa}.</b> I messaggi restano in coda${n.coda ? ` (${n.coda})` : ''} e partono appena lo ricolleghi.</div><button class="btn rosso piccolo" data-azione="ge-ricollega" data-id="${n.id}">Ricollega con QR</button></div>`;
    });
    return html;
  };

  /* ---------- Pagina Numeri WhatsApp ---------- */
  const QR = (seme) => {
    const pieni = [0, 1, 3, 4, 5, 9, 10, 12, 14, 15, 17, 19, 20, 21, 23, 24];
    return `<div class="ge-qr" aria-label="Codice QR finto">${Array.from({ length: 25 }, (_, i) => `<i class="${pieni.includes((i * (seme || 1) + (seme || 0)) % 25) ? '' : 'v'}"></i>`).join('')}</div>`;
  };
  const passiQR = '<div class="ge-passi-qr">1. Apri WhatsApp sul telefono<br>2. Dispositivi collegati → Collega un dispositivo<br>3. Inquadra questo codice</div>';

  function schedaNumero(n) {
    const fermo = numeroFermo(n);
    const perc = Math.min(100, Math.round(((n.oggi || 0) / (n.limite || 20)) * 100));
    const persona = n.utente ? R.utenteDa(n.utente).breve : n.nome;
    let corpo;
    if (fermo) {
      corpo = `<p style="margin:6px 0 12px;font-size:13.5px">${n.scollegatoDa ? 'Da ' + quandoMinuscolo(n.scollegatoDa) + '. ' : ''}I messaggi restano in coda${n.coda ? ` (${n.coda} in attesa)` : ''} e partono appena lo ricolleghi.</p>
        <button class="btn rosso largo" style="margin-top:auto" data-azione="ge-ricollega" data-id="${n.id}">Ricollega con QR</button>`;
    } else {
      corpo = `${R.servizioAttivo(n.id) === 'B' ? '<p class="piccolo" style="margin:4px 0 0;color:var(--pesca-t)">Il servizio A non risponde: i messaggi partono dal servizio B, sullo stesso numero.</p>' : ''}
        ${n.statoB === 'scollegato' && n.statoA === 'collegato' ? '<p class="piccolo" style="margin:4px 0 0;color:var(--pesca-t)">La riserva B non è collegata: ricollegala da Gestisci.</p>' : ''}
        <div class="riga-flex" style="justify-content:space-between;margin-top:auto;font-size:12.5px;padding-top:8px"><span class="secondario">Automatici oggi${n.coda ? ` · ${n.coda} in coda` : ''}</span><b>${n.oggi || 0} di ${n.limite}</b></div>
        <div class="ge-barra ${perc >= 100 ? 'pieno' : ''}"><span style="width:${perc}%"></span></div>
        <button class="btn secondario-campo largo" style="margin-top:12px" data-azione="ge-gestisci-numero" data-id="${n.id}">Gestisci</button>`;
    }
    return `<div class="ge-numero ${fermo ? 'rosso' : ''}">
      <div class="riga-flex" style="justify-content:space-between;gap:6px"><span class="etichetta ${fermo ? 'bianca' : coloreStatoNumero(n)}" style="${fermo ? 'color:var(--errore-t)' : ''}"><span class="puntino"></span>${R.esc(R.statoNumero(n.id))}</span><span class="piccolo ${fermo ? '' : 'secondario'}">${n.predefinito ? 'Predefinito' : 'Servizi A e B'}</span></div>
      <div class="nome">${R.esc(persona)}</div>
      <div class="${fermo ? '' : 'secondario'}" style="font-size:13px">${R.esc(n.telefono)}</div>
      ${corpo}</div>`;
  }

  R.rotta('/whatsapp', {
    menu: 'whatsapp',
    titolo: 'Numeri WhatsApp',
    disegna: () => {
      prepara();
      const u = R.utente();
      const admin = R.amministratore();
      const imp = R.stato.impostazioni;
      const numeri = R.stato.numeri.filter((n) => admin || n.utente === u.id);
      const mio = R.stato.numeri.find((n) => n.utente === u.id);
      const totOggi = numeri.reduce((s, n) => s + (n.oggi || 0), 0);
      const fermi = numeri.filter(numeroFermo).length;
      const suB = numeri.filter((n) => R.servizioAttivo(n.id) === 'B').length;
      const riepilogo = fermi ? `${plurale(fermi, 'numero fermo', 'numeri fermi')}: i suoi messaggi restano in coda` : suB ? 'il servizio principale non risponde: invia la riserva' : numeri.length ? 'tutti i numeri funzionano' : 'nessun numero collegato';
      const puoCollegare = admin || !mio;
      const pred = predefinito();
      const sim = R.stato.simulazioneWA;
      const statoSim = sim === 'a-fermo' ? 'servizio A fermo, invia B' : sim === 'numero-scollegato' ? 'un numero è scollegato da WhatsApp' : 'tutto funziona';
      return `
        <div class="testata">
          <div><div class="sopratitolo">Oggi ${plurale(totOggi, 'messaggio automatico inviato', 'messaggi automatici inviati')} · ${riepilogo}</div>
          <h1 class="titolo-pagina">${admin ? 'Numeri WhatsApp' : 'Il tuo numero WhatsApp'}</h1>
          <div class="spiegazione">Ogni numero è collegato a due servizi: A invia, B è la riserva sullo stesso numero e parte da sola se A si ferma.</div></div>
          <div class="azioni-testata">${puoCollegare ? `<button class="btn primario" data-azione="ge-collega">${R.icona('piu')} ${admin ? 'Collega un numero' : 'Collega il tuo numero'}</button>` : ''}</div>
        </div>
        ${R.bannerWhatsApp()}
        <div class="ge-numeri">
          ${numeri.map(schedaNumero).join('')}
          ${!numeri.length ? `<div class="riquadro vuoto" style="grid-column:1/-1">Non hai ancora un numero collegato. Collegalo con il codice QR per scrivere ai tuoi contatti dal software.</div>` : ''}
          ${admin && numeri.length < 4 ? `<button class="ge-numero nuovo" data-azione="ge-collega">${R.icona('qr', 28)}<span>Collega un altro numero</span></button>` : ''}
        </div>
        <div class="ge-tre spazio-sopra">
          <div class="riquadro">
            <h2 class="titolo-riquadro">Da quale numero parte</h2>
            <p class="secondario" style="font-size:13px;margin:-6px 0 12px">In quest'ordine, il software sceglie da solo. Per ognuno usa il servizio A e, se A non funziona, il servizio B sullo stesso numero.</p>
            <ol class="ge-ordine">
              <li><span class="n">1</span><span>Il numero scelto a mano nel messaggio</span></li>
              <li><span class="n">2</span><span>Il numero a cui il cliente ha scritto per ultimo</span></li>
              <li><span class="n">3</span><span>Il numero del responsabile <span class="secondario piccolo">(dell'affare per le automazioni avviate da un affare, del contatto per le altre)</span></span></li>
              <li><span class="n">4</span><span>Il numero predefinito dell'azienda${pred ? ` <span class="secondario piccolo">(${R.esc(pred.nome)})</span>` : ''}</span></li>
            </ol>
          </div>
          <div class="riquadro scuro ge-sicurezza">
            <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Sicurezza dei numeri</h2>${admin ? '<button class="btn lime piccolo" data-azione="ge-sicurezza">Modifica</button>' : ''}</div>
            <div class="riga-impostazione"><span>Massimo messaggi automatici al giorno</span><span class="valore">${imp.limiteWA}</span></div>
            <div class="riga-impostazione"><span>Pausa tra un messaggio e l'altro</span><span class="valore">da ${imp.pausaMin} a ${imp.pausaMax} sec</span></div>
            <div class="riga-impostazione"><span>Orario di invio dell'azienda</span>${admin ? `<a class="valore" href="#/impostazioni/orario">${R.esc(orarioTesto())}</a>` : `<span class="valore">${R.esc(orarioTesto())}</span>`}</div>
            <div class="riga-impostazione"><span>Quando un numero è pieno</span><span class="valore">${imp.numeroPieno === 'aziendale' ? 'Passa al numero aziendale' : 'Aspetta il giorno dopo'}</span></div>
            <div class="riga-impostazione"><span>Invii a più contatti</span><span class="valore">al massimo ${Math.floor(imp.limiteWA / 2)} al giorno</span></div>
            <div class="riga-impostazione"><span>Cambio automatico sul servizio B</span><span class="valore">Acceso</span></div>
            <div class="riga-impostazione"><span>Avvisami se un numero si scollega</span><span class="valore">${R.esc(imp.avvisiScollegato || 'Email + WhatsApp')}</span></div>
            <p class="piccolo" style="opacity:.75;margin:10px 4px 0">Ordine della coda: prima conferme e promemoria degli appuntamenti, poi messaggi a un solo contatto, poi invii a più contatti.</p>
          </div>
          <div class="riquadro" style="text-align:center">
            <h2 class="titolo-riquadro">${admin || !mio ? 'Collega un numero' : 'Ricollega il tuo numero'}</h2>
            ${QR(3)}
            ${passiQR}
            <div class="ge-avviso-lavoro" style="margin:14px 0 12px;text-align:left"><b>Usa un numero dedicato al lavoro.</b> Salviamo solo le chat con persone che sono nel software: gruppi e stati mai.</div>
            ${puoCollegare ? `<button class="btn primario largo" data-azione="ge-collega">Collega ai servizi A e B</button>` : `<button class="btn primario largo" data-azione="ge-ricollega" data-id="${mio.id}">Ricollega con QR</button>`}
          </div>
        </div>
        <div class="riquadro tratteggiato spazio-sopra">
          <div class="intestazione-riquadro"><h2 class="titolo-riquadro piccolo">Prova del prototipo</h2><span class="etichetta">stato: ${statoSim}</span></div>
          <p class="secondario" style="margin-top:-6px">Simula i guasti per vedere cosa succede (percorso 7). Nessun numero vero viene toccato e nessun messaggio parte davvero.</p>
          <div class="riga-flex">
            <button class="btn" data-azione="ge-sim-a-fermo">Simula: servizio A fermo</button>
            <button class="btn" data-azione="ge-sim-scollegato">Simula: numero scollegato da WhatsApp</button>
            <button class="btn primario" data-azione="ge-sim-ok">Torna tutto a posto</button>
          </div>
        </div>`;
    },
  });

  /* ---------- Simulazioni (percorso 7) ---------- */
  R.azioni['ge-sim-a-fermo'] = () => {
    let quanti = 0;
    R.stato.numeri.forEach((n) => { if (n.statoA === 'collegato') { n.statoA = 'fermo'; n.statoB = n.statoB === 'scollegato' ? 'scollegato' : 'invia'; n.fermoDa = R.adesso(); quanti++; } });
    if (!quanti) { R.avviso('Il servizio A è già fermo su tutti i numeri'); return; }
    allineaSimulazione();
    avvisaAmministratori('Il servizio principale di WhatsApp non risponde. <b>Stiamo inviando con il servizio di riserva</b>, non devi fare nulla.', '#/whatsapp');
    R.salva(); R.aggiorna();
    R.avviso('Simulazione: servizio A fermo · gli invii passano al servizio B sullo stesso numero');
  };
  R.azioni['ge-sim-scollegato'] = () => {
    const n = R.stato.numeri.find((x) => x.utente === 'u2') || R.stato.numeri.find((x) => x.utente) || R.stato.numeri[0];
    if (!n) { R.avviso('Non ci sono numeri da scollegare: prima collegane uno'); return; }
    if (n.statoA === 'scollegato') { R.avviso('Il numero è già scollegato'); return; }
    n.statoA = 'scollegato'; n.statoB = 'scollegato'; n.scollegatoDa = R.adesso(); n.coda = (n.coda || 0) + 3;
    allineaSimulazione();
    const chi = n.utente ? 'di ' + R.esc(R.utenteDa(n.utente).breve) : 'aziendale';
    const testo = `<b>Il numero ${chi} (${R.esc(n.telefono)}) è stato scollegato da WhatsApp.</b> I messaggi restano in coda: ricollegalo con il QR.`;
    avvisaAmministratori(testo, '#/whatsapp', [n.utente]);
    R.salva(); R.aggiorna();
    R.avviso(`Simulazione: numero ${n.utente ? 'di ' + R.esc(R.utenteDa(n.utente).breve) : 'aziendale'} scollegato · avvisati amministratori${n.utente ? ' e ' + R.esc(R.utenteDa(n.utente).breve) : ''}`);
  };
  function rimettiInFunzione(n, servizio) {
    const suB = servizio === 'B';
    const inCoda = R.stato.messaggi.filter((m) => m.numero === n.id && m.direzione === 'out' && m.stato === 'in coda');
    inCoda.forEach((m) => { m.stato = 'inviato'; m.nota = ''; m.servizio = suB ? 'B' : 'A'; });
    n.statoA = suB ? 'fermo' : 'collegato'; n.statoB = suB ? 'invia' : 'pronto'; n.provaA = R.adesso(); n.provaB = R.adesso();
    delete n.scollegatoDa; delete n.fermoDa;
    const ripartiti = (n.coda || 0) + inCoda.length;
    n.coda = 0;
    return ripartiti;
  }
  R.azioni['ge-sim-ok'] = () => {
    let ripartiti = 0;
    const cerano = R.stato.numeri.some((n) => n.statoA !== 'collegato' || n.statoB !== 'pronto');
    R.stato.numeri.forEach((n) => { ripartiti += rimettiInFunzione(n); });
    allineaSimulazione();
    if (cerano) avvisaAmministratori('Il servizio principale di WhatsApp è tornato: gli invii sono di nuovo sul servizio A.', '#/whatsapp');
    R.salva(); R.aggiorna();
    R.avviso(cerano ? `Tutto a posto: gli invii tornano sul servizio A${ripartiti ? ` · ${ripartiti} messaggi in coda ripartono` : ''}` : 'Funzionava già tutto');
  };

  /* ---------- Collegare e ricollegare con il QR (simulato) ---------- */
  function finestraQR(titolo, servizio, passo, avanti, annulla) {
    R.modale({
      titolo,
      sottotitolo: servizio === 'A' ? `Passo ${passo}: servizio A, il principale.` : `Passo ${passo}: servizio B, la riserva sullo stesso numero. WhatsApp permette più dispositivi collegati.`,
      corpo: `<div style="text-align:center">${QR(servizio === 'A' ? 3 : 7)}${passiQR}</div><p class="piccolo secondario" style="text-align:center;margin-top:12px">Nel prototipo il codice è finto: premi il pulsante per simulare l'inquadratura.</p>`,
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true, fai: annulla }, { testo: `Simula: ho inquadrato (servizio ${servizio})`, classe: 'primario', fai: () => { avanti(); } }],
    });
  }
  function ricollega(n) {
    if (!R.serveConnessione('il collegamento del numero')) return;
    const titolo = `Ricollega il ${nomeNumero(n)}`;
    finestraQR(titolo, 'A', '1 di 2', () => finestraQR(titolo, 'B', '2 di 2', () => {
      const aFermo = R.stato.numeri.some((x) => x.id !== n.id && x.statoA === 'fermo');
      const ripartiti = rimettiInFunzione(n, aFermo ? 'B' : 'A');
      allineaSimulazione();
      registra(`Ha ricollegato il ${nomeNumero(n)} (${n.telefono}) ai servizi A e B`);
      R.salva(); R.aggiorna();
      R.avviso(`Numero ricollegato: ${aFermo ? 'per ora invia il servizio B, perché A non risponde' : 'A collegato · B pronto'}${ripartiti ? ` · ${ripartiti} messaggi in coda ripartono` : ''}`);
    }));
  }
  R.azioni['ge-ricollega'] = (el) => {
    const n = numeroDa(el.dataset.id);
    if (!n) return;
    if (!R.amministratore() && n.utente !== R.utente().id) { R.avviso('Puoi ricollegare solo il tuo numero: chiedi a un amministratore'); return; }
    if (R.posizione().percorso !== '/whatsapp') { R.vai('#/whatsapp'); setTimeout(() => ricollega(n), 160); } else ricollega(n);
  };

  R.azioni['ge-collega'] = () => {
    if (!R.serveConnessione('il collegamento di un numero')) return;
    const u = R.utente();
    const admin = R.amministratore();
    const conNumero = R.stato.numeri.map((n) => n.utente).filter(Boolean);
    const persone = admin ? R.stato.utenti.filter((x) => x.stato === 'attivo' && !conNumero.includes(x.id)) : [u];
    const opzioni = (admin ? [`<option value="">Numero aziendale (di tutta l'azienda)</option>`] : []).concat(persone.map((x) => `<option value="${x.id}">${R.esc(x.nome)}</option>`)).join('');
    R.modale({
      titolo: 'Collega un numero',
      sottotitolo: 'Lo colleghi ai due servizi con il codice QR: prima A (principale), poi B (riserva sullo stesso numero).',
      proteggi: true,
      corpo: `<div class="ge-avviso-lavoro spazio-sotto"><b>Usa un numero dedicato al lavoro.</b> Collegando il codice QR il software vede le chat del telefono: salviamo solo quelle con persone che sono nel software. Chat di gruppo e stati non vengono mai salvati.</div>
        <div class="griglia g-2">
          <div class="gruppo-campo"><label class="etichetta-campo" for="ge-n-persona">Di chi è il numero</label><select class="campo" id="ge-n-persona" name="persona" data-cambia="ge-collega-persona">${opzioni}</select></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="ge-n-tel">Numero di telefono</label><input class="campo" id="ge-n-tel" name="telefono" inputmode="tel" placeholder="es. 333 123 4567"></div>
        </div>
        <div class="riga-impostazione"><span>Crea un contatto per chi scrive e non è nel software<br><span class="piccolo secondario">Di base: no per i numeri dei collaboratori, sì per il numero aziendale</span></span>${interruttore('name="crea" id="ge-n-crea"', admin)}</div>`,
      dopo: (f) => { const s = f.querySelector('#ge-n-persona'); if (s) f.querySelector('#ge-n-crea').checked = !s.value; },
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Continua con il servizio A', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          const cifre = v.telefono.replace(/[^\d+]/g, '');
          if (cifre.replace(/\D/g, '').length < 8) { R.erroreCampo(f, 'telefono', 'Scrivi il numero completo, almeno 8 cifre.'); return false; }
          let tel = v.telefono.trim();
          if (!tel.startsWith('+')) tel = R.stato.impostazioni.prefisso + ' ' + tel.replace(/^0{2}/, '');
          const norm = (t) => t.replace(/\D/g, '').slice(-9);
          if (R.stato.numeri.some((n) => norm(n.telefono) === norm(tel))) { R.erroreCampo(f, 'telefono', 'Questo numero è già collegato: lo trovi tra i numeri qui sotto.'); return false; }
          const persona = admin ? v.persona : u.id;
          const nuovo = { id: R.id('n'), nome: persona ? R.utenteDa(persona).breve : 'Numero aziendale', utente: persona || null, telefono: tel, statoA: 'scollegato', statoB: 'scollegato', oggi: 0, limite: R.stato.impostazioni.limiteWA, creaContatti: !!v.crea, coda: 0 };
          const titolo = `Collega il ${persona ? 'numero di ' + R.utenteDa(persona).breve : 'numero aziendale'}`;
          finestraQR(titolo, 'A', '1 di 2', () => {
            nuovo.statoA = 'collegato'; nuovo.provaA = R.adesso();
            finestraQR(titolo, 'B', '2 di 2', () => {
              nuovo.statoB = 'pronto'; nuovo.provaB = R.adesso();
              if (!R.stato.numeri.some((n) => n.predefinito) && !persona) nuovo.predefinito = true;
              R.stato.numeri.push(nuovo);
              registra(`Ha collegato il ${nomeNumero(nuovo)} (${tel}) ai servizi A e B`);
              R.salva(); R.vai('#/whatsapp');
              R.avviso('Numero collegato: A collegato · B pronto (simulato)');
            });
          });
        },
      }],
    });
  };
  R.azioni['ge-collega-persona'] = (el) => { const f = el.closest('.modale'); if (f) f.querySelector('#ge-n-crea').checked = !el.value; };

  R.azioni['ge-gestisci-numero'] = (el) => {
    const n = numeroDa(el.dataset.id);
    if (!n) return;
    const admin = R.amministratore();
    const perc = Math.min(100, Math.round(((n.oggi || 0) / n.limite) * 100));
    const descr = (s, quale) => {
      if (quale === 'A') return s === 'collegato' ? 'Collegato · sta inviando' : s === 'fermo' ? 'Non risponde' : 'Scollegato';
      return s === 'pronto' ? 'Pronto, sullo stesso numero' : s === 'invia' ? 'Sta inviando al posto di A' : 'Scollegato';
    };
    R.modale({
      titolo: `${R.esc(n.utente ? R.utenteDa(n.utente).nome : n.nome)}`,
      sottotitolo: `${R.esc(n.telefono)} · ${R.esc(R.statoNumero(n.id))}`,
      proteggi: true,
      corpo: `<div class="ge-servizi">
          <div class="ge-servizio"><b>Servizio A · principale</b>${descr(n.statoA, 'A')}<br><span class="secondario piccolo">Ultima prova riuscita: ${n.provaA ? quandoMinuscolo(n.provaA) : 'mai'}</span></div>
          <div class="ge-servizio"><b>Servizio B · riserva</b>${descr(n.statoB, 'B')}<br><span class="secondario piccolo">Ultima prova riuscita: ${n.provaB ? quandoMinuscolo(n.provaB) : 'mai'}</span></div>
        </div>
        <div class="riga-flex" style="justify-content:space-between;font-size:13px"><span class="secondario">Messaggi automatici di oggi</span><b>${n.oggi || 0} di ${n.limite}</b></div>
        <div class="ge-barra spazio-sotto" style="margin-top:6px"><span style="width:${perc}%"></span></div>
        <div class="riga-impostazione"><span>Messaggi in coda</span><span class="valore">${n.coda || 0}</span></div>
        <div class="riga-impostazione"><span>Crea un contatto per chi scrive e non è nel software</span>${interruttore('name="crea"', n.creaContatti)}</div>
        ${admin ? `<div class="riga-impostazione"><span>Limite di messaggi automatici al giorno</span><input class="campo" type="number" min="1" max="60" name="limite" value="${n.limite}" style="width:90px;min-height:38px;background:#fff"></div>
        <div class="riga-impostazione"><span>Numero predefinito dell'azienda</span>${interruttore('name="predefinito"', n.predefinito)}</div>` : ''}
        <div class="riga-flex spazio-sopra"><button class="btn piccolo secondario-campo" data-azione="ge-ricollega" data-id="${n.id}">${R.icona('qr', 16)} Ricollega con QR</button><button class="btn piccolo pesca" data-azione="ge-scollega" data-id="${n.id}">Scollega il numero</button></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (admin) {
            const lim = parseInt(v.limite, 10);
            if (!(lim >= 1 && lim <= 60)) { R.erroreCampo(f, 'limite', 'Scrivi un numero da 1 a 60.'); return false; }
            n.limite = lim;
            if (v.predefinito && !n.predefinito) R.stato.numeri.forEach((x) => { x.predefinito = x.id === n.id; });
            if (!v.predefinito && n.predefinito) { R.avviso('Serve sempre un numero predefinito: scegline un altro prima di spegnerlo'); }
          }
          n.creaContatti = !!v.crea;
          registra(`Ha cambiato le impostazioni del ${nomeNumero(n)}`);
          R.salva(); R.aggiorna(); R.avviso('Impostazioni del numero salvate');
        },
      }],
    });
  };
  R.azioni['ge-scollega'] = (el) => {
    const n = numeroDa(el.dataset.id);
    if (!n) return;
    if (n.predefinito) { R.avviso('È il numero predefinito: scegli prima un altro numero predefinito'); return; }
    R.modale({
      titolo: `Scollegare il ${R.esc(nomeNumero(n))}?`,
      sottotitolo: 'I messaggi automatici che partivano da questo numero passano al numero predefinito dell\'azienda. Puoi ricollegarlo quando vuoi.',
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Scollega', classe: 'rosso', fai: () => {
          R.stato.numeri = R.stato.numeri.filter((x) => x.id !== n.id);
          ge().archivioNumeri.push(n);
          const pred = predefinito();
          R.stato.contatti.forEach((c) => { if (c.numeroUsato === n.id && pred) c.numeroUsato = pred.id; });
          allineaSimulazione();
          registra(`Ha scollegato il ${nomeNumero(n)} (${n.telefono})`);
          R.salva(); R.aggiorna(); R.avviso('Numero scollegato');
        },
      }],
    });
  };
  R.azioni['ge-sicurezza'] = () => {
    const imp = R.stato.impostazioni;
    R.modale({
      titolo: 'Sicurezza dei numeri',
      sottotitolo: 'Regole che proteggono i numeri dal blocco di WhatsApp. Valgono per tutti i messaggi automatici e gli invii a più contatti.',
      proteggi: true,
      corpo: `<div class="griglia g-3">
          <div class="gruppo-campo"><label class="etichetta-campo" for="ge-s-lim">Massimo al giorno per numero</label><input class="campo" id="ge-s-lim" type="number" min="1" max="60" name="limite" value="${imp.limiteWA}"></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="ge-s-min">Pausa minima (secondi)</label><input class="campo" id="ge-s-min" type="number" min="10" name="min" value="${imp.pausaMin}"></div>
          <div class="gruppo-campo"><label class="etichetta-campo" for="ge-s-max">Pausa massima (secondi)</label><input class="campo" id="ge-s-max" type="number" min="10" name="max" value="${imp.pausaMax}"></div>
        </div>
        <div class="etichetta-campo">Quando un numero raggiunge il limite</div>
        <label class="opzione"><input type="radio" name="pieno" value="aspetta" ${imp.numeroPieno !== 'aziendale' ? 'checked' : ''}><span class="principale">Aspetta il giorno dopo<span class="sotto">I messaggi partono all'apertura dell'orario di invio del giorno dopo.</span></span></label>
        <label class="opzione"><input type="radio" name="pieno" value="aziendale" ${imp.numeroPieno === 'aziendale' ? 'checked' : ''}><span class="principale">Passa al numero aziendale<span class="sotto">Mai al numero personale di un collega.</span></span></label>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          const lim = parseInt(v.limite, 10), mi = parseInt(v.min, 10), ma = parseInt(v.max, 10);
          if (!(lim >= 1 && lim <= 60)) { R.erroreCampo(f, 'limite', 'Scrivi un numero da 1 a 60.'); return false; }
          if (!(mi >= 10)) { R.erroreCampo(f, 'min', 'Almeno 10 secondi.'); return false; }
          if (!(ma >= mi)) { R.erroreCampo(f, 'max', 'Deve essere uguale o più lunga della pausa minima.'); return false; }
          Object.assign(imp, { limiteWA: lim, pausaMin: mi, pausaMax: ma, numeroPieno: v.pieno });
          R.stato.numeri.forEach((n) => { n.limite = lim; });
          registra('Ha cambiato le regole di sicurezza dei numeri WhatsApp');
          R.salva(); R.aggiorna(); R.avviso('Regole di sicurezza salvate');
        },
      }],
    });
  };

  /* ================= AUTOMAZIONI ================= */
  const QUANDO = [
    { tipo: 'modulo', nome: 'Modulo compilato' },
    { tipo: 'meta', nome: 'Contatto da Facebook o Instagram' },
    { tipo: 'fase', nome: 'Affare cambia fase' },
    { tipo: 'etichetta', nome: 'Etichetta aggiunta' },
    { tipo: 'appuntamento', nome: 'Appuntamento prenotato' },
    { tipo: 'silenzio', nome: 'Nessuna risposta da X giorni' },
    { tipo: 'data', nome: 'Giorno e ora precisi' },
    { tipo: 'wa', nome: 'WhatsApp ricevuto' },
    { tipo: 'email', nome: 'Email aperta o cliccata' },
    { tipo: 'campo', nome: 'Data in un campo' },
  ];
  const FAI = [
    { tipo: 'whatsapp', nome: 'Invia WhatsApp', etichetta: 'WhatsApp', colore: 'wa' },
    { tipo: 'email', nome: 'Invia email', etichetta: 'Email', colore: 'cielo' },
    { tipo: 'affare', nome: 'Crea o sposta affare', etichetta: 'Affare', colore: '' },
    { tipo: 'assegna', nome: 'Assegna a una persona', etichetta: 'Assegna', colore: '' },
    { tipo: 'promemoria', nome: 'Crea promemoria', etichetta: 'Promemoria', colore: 'pesca' },
    { tipo: 'aspetta', nome: 'Aspetta', etichetta: 'Aspetta', colore: '' },
    { tipo: 'se', nome: 'Se… altrimenti', etichetta: 'Se', colore: 'lavanda' },
    { tipo: 'etichetta', nome: 'Aggiungi o togli etichetta', etichetta: 'Etichetta', colore: '' },
    { tipo: 'campo', nome: 'Aggiorna un campo', etichetta: 'Campo', colore: '' },
    { tipo: 'avvisa', nome: 'Avvisa un collaboratore', etichetta: 'Avviso', colore: '' },
    { tipo: 'esterno', nome: 'Google Fogli · Slack · Webhook', etichetta: 'Collegamento', colore: '' },
  ];
  const FAI_TIPO = Object.fromEntries(FAI.map((f) => [f.tipo, f]));
  const ESEMPIO = { nome: 'Mario', responsabile: 'Lucia', azienda: 'Bianchi srl', bando: 'ZES 2026', data: 'giovedì 30 ottobre', ora: '10:30' };
  const DATI_CONTATTO = [['nome', 'Nome del contatto'], ['responsabile', 'Chi segue il contatto'], ['azienda', 'Ragione sociale'], ['bando', 'Bando di interesse'], ['data', 'Data dell\'appuntamento'], ['ora', 'Ora dell\'appuntamento']];
  const riempi = (t, dati) => R.esc(t || '').replace(/\{(\w+)\}/g, (m, k) => (dati[k] != null ? R.esc(dati[k]) : m));
  const anteprima = (t) => riempi(t, ESEMPIO);
  const fileDa = (id) => (id ? (R.stato.libreria || []).find((l) => l.id === id) : null);
  const elencoNomi = (n) => (n.length <= 1 ? n.join('') : n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1]);
  const chiAvvisare = (chi) => (chi === 'responsabile' || !chi ? 'il responsabile' : chi === 'amministratori' ? 'gli amministratori' : R.utenteDa(chi).breve);
  const anteprimaBreve = (t) => { t = String(t || '').trim(); return t.length > 60 ? t.slice(0, 58) + '…' : t; };
  const scelta = (attr, opzioni, valore) => `<select class="campo" ${attr}>${opzioni.map(([v, t]) => `<option value="${R.esc(v)}" ${String(v) === String(valore) ? 'selected' : ''}>${R.esc(t)}</option>`).join('')}</select>`;
  const gruppo = (etichetta, html, id, classe) => `<div class="gruppo-campo ${classe || ''}"><label class="etichetta-campo" ${id ? `for="${id}"` : ''}>${etichetta}</label>${html}</div>`;
  const dataTra = (giorni) => { const d = R.oggi(); d.setDate(d.getDate() + giorni); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  function nuovoPasso(tipo) {
    const collaboratori = R.stato.utenti.filter((u) => u.ruolo === 'collaboratore' && u.stato === 'attivo').map((u) => u.id);
    const base = {
      whatsapp: { titolo: 'Nuovo messaggio WhatsApp', testo: 'Ciao {nome}, ', file: null, numero: 'automatico', riserva: true },
      email: { titolo: 'Nuova email', oggetto: 'Un aggiornamento per te', testo: 'Ciao {nome},\n\n{responsabile}', file: null },
      affare: { azione: 'sposta', percorso: 'p1', fase: 'f2' },
      assegna: { modo: 'turno', persone: collaboratori },
      promemoria: { titolo: 'Richiamare', entro: 1, a: 'responsabile' },
      aspetta: { quanto: 1, unita: 'giorni' },
      se: { condizione: 'risposto', ore: 24, si: [], no: [] },
      etichetta: { azione: 'aggiungi', etichetta: 'Interessato' },
      campo: { campo: 'Bando di interesse', valore: '' },
      avvisa: { chi: 'responsabile', testo: 'Controlla questo contatto' },
      esterno: { servizio: 'fogli', dove: 'Contatti ZES 2026' },
    }[tipo];
    return P(tipo, clona(base || {}));
  }
  function quandoDiBase(tipo) {
    return {
      modulo: { tipo, modulo: '' }, meta: { tipo, modulo: '' }, fase: { tipo, percorso: 'p1', fase: 'f3' }, etichetta: { tipo, etichetta: 'Interessato' },
      appuntamento: { tipo }, silenzio: { tipo, giorni: 3 }, data: { tipo, data: dataTra(7), ora: '10:00', etichetta: '' }, wa: { tipo }, email: { tipo, email: '' }, campo: { tipo, campo: 'Scadenza del bando' },
    }[tipo] || { tipo: 'modulo', modulo: '' };
  }
  function testoQuando(q) {
    q = q || {};
    switch (q.tipo) {
      case 'modulo': return q.modulo ? `Qualcuno compila il modulo ${q.modulo}` : 'Qualcuno compila un modulo';
      case 'meta': return q.modulo ? `Arriva un contatto dal modulo Meta «${q.modulo}»` : 'Arriva un contatto da un modulo di Facebook o Instagram';
      case 'fase': { const f = R.fase(q.percorso, q.fase); return `Un affare entra in «${f ? f.nome : 'una fase'}»`; }
      case 'etichetta': return `Il contatto riceve l'etichetta «${q.etichetta || '…'}»`;
      case 'appuntamento': return 'Il contatto prenota un appuntamento';
      case 'silenzio': return `Nessuna risposta da ${plurale(q.giorni || 3, 'giorno', 'giorni')}`;
      case 'data': return `Il ${q.data ? new Date(q.data + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : 'giorno scelto'} alle ${q.ora || '10:00'}${q.etichetta ? `, a chi ha l'etichetta «${q.etichetta}»` : ''}`;
      case 'wa': return 'Il contatto scrive su WhatsApp';
      case 'email': return `Il contatto apre o clicca l'email${q.email ? ' «' + q.email + '»' : ''}`;
      case 'campo': return `Arriva la data del campo «${q.campo || 'Scadenza del bando'}»`;
      default: return 'Scegli quando parte';
    }
  }
  function testoCondizione(p) {
    if (p.condizione === 'fase') { const f = R.fase(p.percorso || 'p1', p.fase); return `È arrivato in «${f ? f.nome : '…'}»?`; }
    if (p.condizione === 'email') return `Ha aperto l'email entro ${plurale(p.ore || 24, 'ora', 'ore')}?`;
    if (p.condizione === 'etichetta') return `Ha l'etichetta «${p.etichetta || '…'}»?`;
    return `Ha risposto entro ${plurale(p.ore || 24, 'ora', 'ore')}?`;
  }
  function testoNumero(v) {
    if (v === 'responsabile') return 'dal numero di chi segue il contatto';
    if (v === 'predefinito') return 'dal numero aziendale predefinito';
    if (v && v !== 'automatico') { const n = numeroDa(v); return n ? 'sempre dal ' + nomeNumero(n) : 'da un numero non più collegato'; }
    return 'dal numero a cui ha scritto o di chi segue il contatto';
  }
  function titoloPasso(p) {
    switch (p.tipo) {
      case 'whatsapp': return p.titolo || anteprimaBreve(p.testo) || 'Messaggio WhatsApp';
      case 'email': return p.oggetto || p.titolo || 'Email';
      case 'affare': {
        const per = R.percorso(p.percorso) || {};
        const f = R.fase(p.percorso, p.fase);
        return p.azione === 'crea' ? `Crea affare in ${per.nome || '…'} · ${f ? f.nome : '…'}` : `Sposta in «${f ? f.nome : '…'}»`;
      }
      case 'assegna': {
        const nomi = (p.persone || []).map((id) => R.utenteDa(id).breve);
        if (p.modo === 'fisso') return `Sempre a ${nomi[0] || '…'}`;
        return nomi.length ? `A turno tra ${elencoNomi(nomi)}` : 'A turno: scegli le persone';
      }
      case 'promemoria': return p.titolo || 'Promemoria';
      case 'aspetta': return 'Aspetta ' + durata(p);
      case 'se': return testoCondizione(p);
      case 'etichetta': return `${p.azione === 'togli' ? 'Togli' : 'Aggiungi'} l'etichetta «${p.etichetta || '…'}»`;
      case 'campo': return `Scrivi «${p.valore || '…'}» in ${p.campo}`;
      case 'avvisa': return `Avvisa ${chiAvvisare(p.chi)}: «${p.testo || '…'}»`;
      case 'esterno': return p.servizio === 'slack' ? `Messaggio su Slack in ${p.dove || '…'}` : p.servizio === 'webhook' ? 'Manda i dati a un altro programma (webhook)' : `Aggiungi una riga in Google Fogli · ${p.dove || '…'}`;
      default: return '';
    }
  }
  function sottoPasso(p) {
    if (p.tipo === 'whatsapp') { const f = fileDa(p.file); return testoNumero(p.numero) + (p.riserva !== false ? ', riserva automatica' : '') + (f && !(p.titolo || '').toLowerCase().includes(f.nome.toLowerCase()) ? ' · ' + f.nome : ''); }
    if (p.tipo === 'email') { const f = fileDa(p.file); return 'nell\'orario di invio' + (f ? ' · allegato ' + f.nome : ''); }
    if (p.tipo === 'promemoria') return `per ${p.a === 'responsabile' || !p.a ? 'il responsabile' : R.utenteDa(p.a).breve}, entro ${plurale(p.entro || 1, 'ora', 'ore')} di lavoro`;
    return '';
  }

  const auto = (id) => R.stato.automazioni.find((a) => a.id === id && !a.eliminata);
  const lavoro = (a) => a.bozza || a;
  /* Un'automazione attiva o in pausa si modifica in bozza: cambia davvero solo con "Applica modifiche". */
  function modificabile(a) {
    if (a.stato === 'bozza') return a;
    if (!a.bozza) a.bozza = { nome: a.nome, quando: clona(a.quando), passi: clona(a.passi), da: R.adesso() };
    return a.bozza;
  }
  function trova(passi, id, genitore) {
    for (let i = 0; i < passi.length; i++) {
      const p = passi[i];
      if (p.id === id) return { lista: passi, i, passo: p, genitore: genitore || 'main' };
      if (p.tipo === 'se') {
        for (const r of ['si', 'no']) { const t = trova(p[r] || [], id, p.id + ':' + r); if (t) return t; }
      }
    }
    return null;
  }
  function trovaPrimo(passi, tipo) {
    for (const p of passi) {
      if (p.tipo === tipo) return p;
      if (p.tipo === 'se') { const t = trovaPrimo(p.si || [], tipo) || trovaPrimo(p.no || [], tipo); if (t) return t; }
    }
    return null;
  }
  function listaDa(w, dove) {
    if (!dove || dove === 'main') return w.passi;
    const [id, r] = dove.split(':');
    const t = trova(w.passi, id);
    return t ? (t.passo[r] = t.passo[r] || []) : null;
  }
  const contaPassi = (passi) => (passi || []).reduce((s, p) => s + 1 + (p.tipo === 'se' ? contaPassi(p.si) + contaPassi(p.no) : 0), 0);
  function rinnovaId(passi) { (passi || []).forEach((p) => { p.id = R.id('ps'); if (p.tipo === 'se') { rinnovaId(p.si); rinnovaId(p.no); } }); }
  function controllaPassi(w) {
    if (!w.passi.length) return 'Aggiungi almeno un passaggio: per esempio «Invia WhatsApp».';
    let errore = '';
    const giro = (lista) => lista.forEach((p) => {
      if (errore) return;
      if (p.tipo === 'whatsapp' && !String(p.testo || '').trim() && !p.file) errore = `Il passaggio «${titoloPasso(p)}» non ha né testo né file: scrivi il messaggio o scegli un file.`;
      if (p.tipo === 'email' && !String(p.oggetto || '').trim()) errore = 'Una email non ha l\'oggetto: scrivilo prima di continuare.';
      if (p.tipo === 'assegna' && !(p.persone || []).length) errore = 'Il passaggio «Assegna» non ha nessuna persona: scegline almeno una.';
      if (p.tipo === 'se') { giro(p.si || []); giro(p.no || []); }
    });
    giro(w.passi);
    return errore;
  }
  function nomeLibero(nome) {
    let n = 1, prova = nome;
    while (R.stato.automazioni.some((a) => !a.eliminata && a.nome === prova)) { n++; prova = `${nome} (${n})`; }
    return prova;
  }
  function nomeCopia(nome) {
    const base = nome.replace(/ \(copia( \d+)?\)$/, '');
    let n = 1, prova = base + ' (copia)';
    while (R.stato.automazioni.some((a) => a.nome === prova)) { n++; prova = `${base} (copia ${n})`; }
    return prova;
  }

  let sel = { auto: null, passo: 'quando' };
  const autoCorrente = () => auto(sel.auto);
  function salvato(a) {
    a.ultimaModifica = R.adesso();
    R.salva();
    const i = document.getElementById('ge-salvataggio');
    if (i) i.textContent = (a.stato === 'bozza' ? 'Salvato' : 'Modifiche in bozza, non ancora applicate · salvate') + ' alle ' + R.ora(a.ultimaModifica);
  }

  /* ---------- Modelli pronti ---------- */
  const MODELLI = [
    { id: 'benvenuto', nome: 'Benvenuto nuovo contatto', colore: 'salvia', icona: 'whatsapp', descrizione: 'Chi compila un modulo riceve subito il benvenuto e la presentazione su WhatsApp; se non risponde, un secondo messaggio il giorno dopo.',
      crea: () => ({ quando: { tipo: 'modulo', modulo: '' }, passi: [
        P('affare', { azione: 'crea', percorso: 'p1', fase: 'f1' }),
        P('assegna', { modo: 'turno', persone: ['u2', 'u3'] }),
        P('whatsapp', { titolo: 'Messaggio di benvenuto', testo: 'Ciao {nome}, sono {responsabile} di Inizio Impresa. Abbiamo ricevuto la tua richiesta: a che ora preferisci essere chiamato?', file: null, numero: 'automatico', riserva: true }),
        P('aspetta', { quanto: 2, unita: 'minuti' }),
        P('whatsapp', { titolo: 'Invia la presentazione', testo: '', file: 'l4', numero: 'automatico', riserva: true }),
        P('se', { condizione: 'risposto', ore: 1, si: [P('promemoria', { titolo: 'Chiamalo nell\'orario che ha scelto', entro: 1, a: 'responsabile' })], no: [
          P('whatsapp', { titolo: 'WhatsApp: «Ti chiamo oggi?»', testo: 'Ciao {nome}, ti chiamo oggi?', file: null, numero: 'automatico', riserva: true, dopo: { quanto: 1, unita: 'giorni' } }),
        ] }),
      ] }) },
    { id: 'recupero', nome: 'Recupero di chi non risponde', colore: 'pesca', icona: 'telefono', descrizione: 'Dopo 3 giorni senza risposta manda un messaggio gentile; se ancora tace, sposta l\'affare in «Da ricontattare».', crea: () => PASSI_INIZIALI.au3() },
    { id: 'riattivazione', nome: 'Riattivazione contatti fermi', colore: 'cielo', icona: 'ricarica', descrizione: 'Ai contatti fermi da 60 giorni propone le novità; chi risponde torna tra quelli da ricontattare.', crea: () => PASSI_INIZIALI.au6() },
    { id: 'documenti', nome: 'Richiesta documenti con sollecito', colore: 'lavanda', icona: 'file', descrizione: 'Quando l\'affare entra in «Documenti richiesti» manda l\'elenco; se dopo 3 giorni non arrivano, sollecita e crea un promemoria.', crea: () => PASSI_INIZIALI.au2() },
    { id: 'appuntamento', nome: 'Promemoria appuntamento', colore: 'salvia', icona: 'calendario', descrizione: 'Conferma l\'appuntamento appena prenotato e lo ricorda il giorno prima. Non aspetta l\'orario di invio.', crea: () => PASSI_INIZIALI.au4() },
    { id: 'offerta', nome: 'Avviso nuova offerta o bando', colore: 'pesca', icona: 'campanella', descrizione: 'Nel giorno scelto avvisa i contatti con un\'etichetta. È un invio a più contatti: usa al massimo metà del limite giornaliero.',
      crea: () => ({ quando: { tipo: 'data', data: dataTra(7), ora: '10:00', etichetta: 'Interessato ZES' }, passi: [
        P('whatsapp', { titolo: 'Avviso del nuovo bando', testo: 'Ciao {nome}, è uscito un nuovo bando che può interessarti: vuoi che ti spieghi come funziona?', file: null, numero: 'predefinito', riserva: true }),
        P('se', { condizione: 'risposto', ore: 48, si: [P('promemoria', { titolo: 'Richiama per il nuovo bando', entro: 4, a: 'responsabile' })], no: [] }),
      ] }) },
  ];
  function elencoPassiTesto(passi) {
    return `<ol style="margin:6px 0 0;padding-left:20px">${passi.map((p) => `<li style="margin:3px 0">${R.esc(p.dopo && p.dopo.quanto ? 'Dopo ' + durata(p.dopo) + ': ' : '')}${R.esc(titoloPasso(p))}${p.tipo === 'se' ? `<div class="piccolo secondario">Sì:</div>${(p.si || []).length ? elencoPassiTesto(p.si) : '<div class="piccolo secondario">finisce qui</div>'}<div class="piccolo secondario">No:</div>${(p.no || []).length ? elencoPassiTesto(p.no) : '<div class="piccolo secondario">finisce qui</div>'}` : ''}</li>`).join('')}</ol>`;
  }
  const cartaModello = (m) => {
    const d = m.crea();
    return `<div class="ge-modello"><span class="quadratino ${m.colore}">${R.icona(m.icona, 18)}</span><div class="grassetto">${R.esc(m.nome)}</div><p>${R.esc(m.descrizione)}</p><div class="piccolo secondario">${R.esc(testoQuando(d.quando))} · ${plurale(contaPassi(d.passi), 'passaggio', 'passaggi')}</div><button class="btn piccolo primario" style="align-self:flex-start;min-height:44px" data-azione="ge-modello" data-id="${m.id}">Usa il modello</button></div>`;
  };
  function nuovaAutomazione(nome, d, origine) {
    const a = { id: R.id('au'), nome: nomeLibero(nome), stato: 'bozza', passate: 0, inAttesa: 0, cartella: 'Finanza agevolata', quando: d.quando, passi: d.passi, descrizione: '', origine };
    completaAutomazione(a);
    R.stato.automazioni.push(a);
    return a;
  }
  function apriEditor(a) {
    const primo = trovaPrimo(a.passi, 'whatsapp');
    sel = { auto: a.id, passo: primo ? primo.id : 'quando' };
    R.vai('#/automazioni/' + a.id);
  }
  R.azioni['ge-modello'] = (el) => {
    const m = MODELLI.find((x) => x.id === el.dataset.id);
    if (!m) return;
    const d = m.crea();
    R.modale({
      titolo: R.esc(m.nome),
      sottotitolo: R.esc(m.descrizione),
      classe: 'larga',
      corpo: `<div class="riquadro medio beige"><div class="grassetto">Quando: ${R.esc(testoQuando(d.quando))}</div>${elencoPassiTesto(d.passi)}</div><p class="piccolo secondario spazio-sopra">Nasce disattivata: la personalizzi, la provi con un contatto finto e poi la attivi.</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Usa questo modello', classe: 'primario', fai: () => {
          const a = nuovaAutomazione(m.nome, d, 'modello');
          registra(`Ha creato l'automazione «${a.nome}» dal modello`);
          R.salva();
          apriEditor(a);
          R.avviso('Creata dal modello: personalizza il testo, provala e attivala');
        },
      }],
    });
  };
  R.azioni['ge-auto-nuova'] = () => R.modale({
    titolo: 'Nuova automazione',
    sottotitolo: 'Scegli da dove partire. Nasce disattivata finché non la attivi.',
    classe: 'stretta',
    corpo: `<button class="opzione" data-azione="ge-nuova-da" data-da="modello"><span class="quadratino salvia">${R.icona('griglia', 18)}</span><span class="principale"><b>Parti da un modello</b><span class="sotto">Benvenuto, recupero, documenti, appuntamenti…</span></span></button>
      <button class="opzione" data-azione="ge-nuova-da" data-da="ai"><span class="quadratino lavanda">${R.icona('stelline', 18)}</span><span class="principale"><b>Crea con l'AI da una frase</b><span class="sotto">Descrivi cosa deve fare, poi controlli i passaggi</span></span></button>
      <button class="opzione" data-azione="ge-nuova-da" data-da="zero"><span class="quadratino">${R.icona('piu', 18)}</span><span class="principale"><b>Parti da zero</b><span class="sotto">Scegli tu quando parte e cosa fa</span></span></button>`,
  });
  R.azioni['ge-nuova-da'] = (el) => {
    const da = el.dataset.da;
    if (da === 'modello') { R.chiudiModale(true); const m = document.getElementById('ge-modelli'); if (m) m.scrollIntoView({ behavior: 'smooth' }); return; }
    if (da === 'ai') { R.azioni['ge-auto-ai'](); return; }
    const a = nuovaAutomazione('Nuova automazione', { quando: { tipo: 'modulo', modulo: '' }, passi: [] }, 'zero');
    registra(`Ha creato l'automazione «${a.nome}»`);
    R.salva();
    sel = { auto: a.id, passo: 'quando' };
    R.vai('#/automazioni/' + a.id);
  };

  /* ---------- Creare con l'AI da una frase (simulato) ---------- */
  function automazioneDaFrase(frase) {
    const f = frase.toLowerCase();
    let quando = { tipo: 'modulo', modulo: '' };
    const funnel = (R.stato.funnel || []).find((x) => x.nome.toLowerCase().split(/\s+/).filter((p) => p.length > 3).some((p) => f.includes(p)));
    if (/appuntament|prenot/.test(f)) quando = { tipo: 'appuntamento' };
    else if (/non risponde|nessuna risposta|non ha risposto/.test(f) && !/modulo|compila/.test(f)) quando = { tipo: 'silenzio', giorni: (f.match(/(\d+)\s*giorn/) || [])[1] ? +f.match(/(\d+)\s*giorn/)[1] : 3 };
    else if (/document/.test(f) && /fase|entra/.test(f)) quando = { tipo: 'fase', percorso: 'p1', fase: 'f3' };
    else if (/etichetta/.test(f)) quando = { tipo: 'etichetta', etichetta: 'Interessato' };
    else if (/scrive su whatsapp|whatsapp ricevuto/.test(f)) quando = { tipo: 'wa' };
    else if (/facebook|instagram/.test(f)) quando = { tipo: 'meta', modulo: '' };
    if (quando.tipo === 'modulo' && funnel) quando.modulo = funnel.nome;
    const passi = [];
    const primoMessaggio = quando.tipo === 'silenzio' ? ['Messaggio di recupero', 'Ciao {nome}, sono {responsabile}: hai avuto modo di pensarci? Se preferisci ti chiamo io, dimmi a che ora.']
      : quando.tipo === 'appuntamento' ? ['Conferma dell\'appuntamento', 'Ciao {nome}, ti confermo l\'appuntamento di {data} alle {ora} con {responsabile}.']
      : ['Messaggio di benvenuto', 'Ciao {nome}, sono {responsabile} di Inizio Impresa. Abbiamo ricevuto la tua richiesta: a che ora preferisci essere chiamato?'];
    if (/benvenut|whatsapp|messaggio|scrivi|conferma/.test(f)) passi.push(P('whatsapp', { titolo: primoMessaggio[0], testo: primoMessaggio[1], file: null, numero: 'automatico', riserva: true }));
    if (/brochure|pdf|file|presentazione/.test(f)) passi.push(P('whatsapp', { titolo: 'Invia la brochure', testo: '', file: /resto/.test(f) ? 'l3' : 'l1', numero: 'automatico', riserva: true }));
    if (/email|mail/.test(f)) passi.push(P('email', { titolo: 'Email', oggetto: 'La tua richiesta', testo: 'Ciao {nome},\nabbiamo ricevuto la tua richiesta.\n{responsabile}', file: null }));
    const attesa = f.match(/dopo\s+(\d+)\s*(minut|or|giorn)/);
    if (attesa) passi.push(P('aspetta', { quanto: +attesa[1], unita: attesa[2] === 'minut' ? 'minuti' : attesa[2] === 'or' ? 'ore' : 'giorni' }));
    if (/se non risponde|se risponde|altrimenti/.test(f)) {
      passi.push(P('se', { condizione: 'risposto', ore: 24, si: [P('promemoria', { titolo: 'Richiamalo: ha risposto', entro: 1, a: 'responsabile' })], no: [P('promemoria', { titolo: 'Richiamare: non ha risposto', entro: 4, a: 'responsabile' })] }));
    } else if (/promemoria|richiam|chiama/.test(f)) passi.push(P('promemoria', { titolo: 'Richiamare', entro: 1, a: 'responsabile' }));
    if (/sposta|da ricontattare/.test(f)) passi.push(P('affare', { azione: 'sposta', percorso: 'p1', fase: 'f2' }));
    if (!passi.length) passi.push(P('whatsapp', { titolo: 'Messaggio', testo: 'Ciao {nome}, ', file: null, numero: 'automatico', riserva: true }));
    const nome = frase.trim().replace(/\s+/g, ' ');
    return { nome: R.maiuscola(nome.length > 48 ? nome.slice(0, 46).replace(/\s+\S*$/, '') + '…' : nome), quando, passi };
  }
  R.azioni['ge-auto-ai'] = () => {
    const esempi = ['Quando qualcuno compila il modulo Resto al Sud mandagli un WhatsApp di benvenuto con la brochure; se non risponde, crea un promemoria per richiamarlo', 'Quando un contatto prenota un appuntamento mandagli la conferma su WhatsApp', 'Se un contatto non risponde da 5 giorni scrivigli un messaggio gentile e spostalo in Da ricontattare'];
    R.modale({
      titolo: 'Crea con l\'AI da una frase',
      sottotitolo: 'Descrivi cosa deve fare. L\'AI prepara una bozza con i passaggi: la controlli, la provi e solo dopo la attivi. All\'AI arriva solo la tua frase, mai i dati dei contatti.',
      corpo: `${gruppo('Cosa deve fare l\'automazione', '<textarea class="campo" id="ge-ai-frase" name="frase" rows="4" placeholder="Es. quando qualcuno compila il modulo ZES mandagli un WhatsApp di benvenuto e dopo 2 giorni, se non risponde, crea un promemoria"></textarea>', 'ge-ai-frase')}
        <div class="etichetta-campo">Esempi</div>${esempi.map((e) => `<button class="opzione" data-azione="ge-ai-esempio" data-testo="${R.esc(e)}"><span class="principale" style="font-size:13px">${R.esc(e)}</span></button>`).join('')}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Crea la bozza', classe: 'primario', restaAperta: true, fai: (f) => {
          const v = R.valori(f);
          if (v.frase.length < 12) { R.erroreCampo(f, 'frase', 'Scrivi qualche parola in più: quando parte e cosa deve fare.'); return false; }
          if (!R.serveConnessione('la creazione con l\'AI')) return false;
          const b = f.querySelector('.piede-modale .btn.primario');
          if (b) { b.disabled = true; b.textContent = 'In corso…'; }
          setTimeout(() => {
            const d = automazioneDaFrase(v.frase);
            const a = nuovaAutomazione(d.nome, d, 'ai');
            registra(`Ha creato con l'AI l'automazione «${a.nome}»`);
            R.salva();
            apriEditor(a);
            R.avviso('Bozza creata dall\'AI: controlla ogni passaggio prima di attivarla');
          }, 1200);
          return false;
        },
      }],
    });
  };
  R.azioni['ge-ai-esempio'] = (el) => { const t = document.getElementById('ge-ai-frase'); if (t) { t.value = el.dataset.testo; t.focus(); } };

  /* ---------- Elenco ---------- */
  const etichettaStato = (a) => (a.stato === 'attiva' ? '<span class="etichetta salvia"><span class="puntino"></span>Attiva</span>' : a.stato === 'pausa' ? '<span class="etichetta pesca">In pausa · persone ferme</span>' : '<span class="etichetta">Disattivata</span>');
  const coloreAuto = (a) => (a.stato === 'attiva' ? 'salvia' : a.stato === 'pausa' ? 'pesca' : '');
  function rigaAuto(a) {
    return `<div class="ge-auto-riga">
      <span class="quadratino ${coloreAuto(a)}">${R.icona(a.stato === 'pausa' ? 'pausa' : 'fulmine', 18)}</span>
      <div class="principale"><a class="titolo-riga" href="#/automazioni/${a.id}">${R.esc(a.nome)}</a>
        <div class="sotto">${R.esc(testoQuando(a.quando))} · ${plurale(contaPassi(a.passi), 'passaggio', 'passaggi')} · ${R.esc(a.cartella)}</div>
        <div class="riga-flex" style="gap:6px;margin-top:6px">${etichettaStato(a)}${a.bozza ? '<span class="etichetta lavanda">Modifiche in bozza</span>' : ''}</div></div>
      <div class="ge-auto-numeri"><b>${R.numero(a.passate)}</b> passate<br><b>${a.inAttesa}</b> in attesa</div>
      <div class="riga-flex" style="gap:6px"><a class="btn secondario-campo" href="#/automazioni/${a.id}">Apri</a><button class="btn secondario-campo tondo" data-azione="ge-auto-menu" data-id="${a.id}" aria-label="Altre azioni per ${R.esc(a.nome)}">${R.icona('puntini')}</button></div>
    </div>`;
  }
  R.rotta('/automazioni', {
    menu: 'automazioni',
    titolo: 'Automazioni',
    disegna: () => {
      prepara();
      const f = R.stato.filtri.automazioni = Object.assign({ cartella: 'tutte' }, R.stato.filtri.automazioni);
      const tutte = R.stato.automazioni.filter((a) => !a.eliminata);
      const cartelle = [...new Set(tutte.map((a) => a.cartella))].sort();
      if (f.cartella !== 'tutte' && !cartelle.includes(f.cartella)) f.cartella = 'tutte';
      const elenco = tutte.filter((a) => f.cartella === 'tutte' || a.cartella === f.cartella);
      const attive = tutte.filter((a) => a.stato === 'attiva').length;
      const inAttesa = tutte.reduce((s, a) => s + (a.stato !== 'bozza' ? a.inAttesa : 0), 0);
      return `
        <div class="testata">
          <div><div class="sopratitolo">${plurale(attive, 'automazione attiva', 'automazioni attive')} · ${plurale(inAttesa, 'persona', 'persone')} in attesa · orario di invio ${R.esc(orarioTesto())}</div>
          <h1 class="titolo-pagina">Automazioni</h1>
          <div class="spiegazione">Fanno da sole i passaggi che si ripetono: messaggi, promemoria, spostamenti di fase. I messaggi partono solo nell'orario di invio dell'azienda.</div></div>
          <div class="azioni-testata"><button class="btn lavanda" data-azione="ge-auto-ai">${R.icona('stelline')} Crea con l'AI</button><button class="btn primario" data-azione="ge-auto-nuova">${R.icona('piu')} Nuova automazione</button></div>
        </div>
        ${R.bannerWhatsApp()}
        <div class="pillole spazio-sotto" role="group" aria-label="Cartelle">${['tutte'].concat(cartelle).map((c) => `<button class="pillola ${f.cartella === c ? 'attiva' : ''}" data-azione="ge-auto-cartella" data-cartella="${R.esc(c)}">${c === 'tutte' ? 'Tutte' : R.esc(c)} · ${c === 'tutte' ? tutte.length : tutte.filter((a) => a.cartella === c).length}</button>`).join('')}</div>
        <div class="riquadro"><div class="elenco">${elenco.map(rigaAuto).join('') || '<div class="vuoto">Nessuna automazione in questa cartella. Parti da un modello qui sotto.</div>'}</div></div>
        <div class="riquadro spazio-sopra" id="ge-modelli">
          <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Modelli pronti</h2><span class="secondario piccolo">Cambi i testi, provi con un contatto finto e attivi</span></div>
          <div class="ge-modelli">${MODELLI.map(cartaModello).join('')}</div>
        </div>`;
    },
  });
  R.azioni['ge-auto-cartella'] = (el) => { R.stato.filtri.automazioni = Object.assign({}, R.stato.filtri.automazioni, { cartella: el.dataset.cartella }); R.salva(); R.aggiorna(); };
  R.azioni['ge-auto-menu'] = (el) => {
    const a = auto(el.dataset.id);
    if (!a) return;
    const stato = a.stato === 'attiva' ? `<button data-azione="ge-auto-pausa" data-id="${a.id}">${R.icona('pausa')} Metti in pausa</button>` : a.stato === 'pausa' ? `<button data-azione="ge-auto-riattiva" data-id="${a.id}">${R.icona('play')} Riattiva</button>` : `<button data-azione="ge-auto-attiva" data-id="${a.id}">${R.icona('play')} Attiva</button>`;
    R.tendina(el, `<a href="#/automazioni/${a.id}">${R.icona('nota')} Apri e modifica</a>
      <button data-azione="ge-auto-duplica" data-id="${a.id}">${R.icona('copia')} Duplica</button>
      ${stato}
      <button data-azione="ge-auto-cartella-sposta" data-id="${a.id}">${R.icona('griglia')} Sposta in un'altra cartella</button>
      ${generale() ? `<button data-azione="ge-copia-aziende" data-auto="${a.id}">${R.icona('copia')} Copia in un'altra azienda</button>` : ''}
      ${R.amministratore() ? `<button data-azione="ge-auto-elimina" data-id="${a.id}">${R.icona('cestino')} Elimina</button>` : ''}`);
  };
  R.azioni['ge-auto-duplica'] = (el) => {
    R.chiudiTendina();
    const a = auto(el.dataset.id);
    if (!a) return;
    const c = clona(a);
    Object.assign(c, { id: R.id('au'), nome: nomeCopia(a.nome), stato: 'bozza', passate: 0, inAttesa: 0, storico: [], versioni: [], bozza: null, attivataIl: null, ultimaModifica: null });
    rinnovaId(c.passi);
    R.stato.automazioni.splice(R.stato.automazioni.indexOf(a) + 1, 0, c);
    registra(`Ha duplicato l'automazione «${a.nome}»`);
    R.salva(); R.aggiorna();
    R.avviso(`Duplicata come «${R.esc(c.nome)}» · nasce disattivata`);
  };
  R.azioni['ge-auto-pausa'] = (el) => { R.chiudiTendina(); const a = auto(el.dataset.id); if (a) chiediPausa(a); };
  R.azioni['ge-auto-riattiva'] = (el) => { R.chiudiTendina(); const a = auto(el.dataset.id); if (a) chiediRiattiva(a); };
  R.azioni['ge-auto-attiva'] = (el) => { R.chiudiTendina(); const a = auto(el.dataset.id); if (a) chiediAttivazione(a); };
  R.azioni['ge-auto-cartella-sposta'] = (el) => {
    R.chiudiTendina();
    const a = auto(el.dataset.id);
    if (!a) return;
    const cartelle = [...new Set(R.stato.automazioni.map((x) => x.cartella))];
    R.modale({
      titolo: 'Sposta in un\'altra cartella',
      sottotitolo: R.esc(a.nome),
      classe: 'stretta',
      corpo: `${gruppo('Cartella', `<input class="campo" id="ge-cart" name="cartella" list="ge-cartelle" value="${R.esc(a.cartella)}"><datalist id="ge-cartelle">${cartelle.map((c) => `<option value="${R.esc(c)}">`).join('')}</datalist>`, 'ge-cart')}<p class="piccolo secondario">Scegli una cartella esistente o scrivi il nome di una nuova.</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Sposta', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!v.cartella) { R.erroreCampo(f, 'cartella', 'Scrivi il nome della cartella.'); return false; }
          a.cartella = v.cartella; R.salva(); R.aggiorna(); R.avviso(`Spostata in «${R.esc(v.cartella)}»`);
        },
      }],
    });
  };
  R.azioni['ge-auto-elimina'] = (el) => {
    R.chiudiTendina();
    const a = auto(el.dataset.id);
    if (!a) return;
    if (!R.amministratore()) { R.avviso('Solo gli amministratori possono eliminare un\'automazione'); return; }
    const prima = a.stato;
    a.eliminata = true; a.statoPrima = prima;
    if (a.stato === 'attiva') a.stato = 'pausa';
    const voce = { id: R.id('ce'), tipo: 'automazione', rif: a.id, nome: a.nome, eliminatoDa: R.utente().id, quando: R.adesso() };
    R.stato.cestino.unshift(voce);
    registra(`Ha eliminato l'automazione «${a.nome}»`);
    R.salva(); R.aggiorna();
    R.avviso('Automazione eliminata · la trovi nel Cestino per 30 giorni', {
      annulla: () => { a.eliminata = false; a.stato = prima; R.stato.cestino = R.stato.cestino.filter((x) => x.id !== voce.id); R.salva(); R.aggiorna(); R.avviso('Automazione ripristinata'); },
    });
  };
  /* Ripristino dal Cestino (funzione di vendite.js): per le automazioni torna in pausa, nulla riparte da solo. */
  if (typeof R.ripristina === 'function') {
    const ripristinaOriginale = R.ripristina;
    R.ripristina = (voceId) => {
      const v = (R.stato.cestino || []).find((x) => x.id === voceId);
      if (v && v.tipo === 'automazione') {
        const a = R.stato.automazioni.find((x) => x.id === v.rif);
        if (a) { a.eliminata = false; a.stato = a.statoPrima === 'bozza' ? 'bozza' : 'pausa'; }
      }
      return ripristinaOriginale(voceId);
    };
  }

  /* ---------- Attivare, mettere in pausa, riattivare ---------- */
  function chiediAttivazione(a) {
    const w = lavoro(a);
    const problema = controllaPassi(w);
    if (problema) { R.modale({ titolo: 'Prima di attivarla manca qualcosa', sottotitolo: R.esc(problema), classe: 'stretta', pulsanti: [{ testo: 'Ho capito', classe: 'primario', chiudi: true }] }); return; }
    if (!R.stato.impostazioni.orario.giorni.length) { R.modale({ titolo: 'Manca l\'orario di invio', sottotitolo: 'Finché l\'orario di invio non è impostato, le automazioni non inviano. Impostalo in Impostazioni → Orario di invio e festivi.', classe: 'stretta', pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Imposta l\'orario', classe: 'primario', fai: () => R.vai('#/impostazioni/orario') }] }); return; }
    const q = testoQuando(w.quando);
    R.modale({
      titolo: `Attivare «${R.esc(w.nome)}»?`,
      sottotitolo: `Da adesso parte da sola: ${R.esc(q.charAt(0).toLowerCase() + q.slice(1))}. I messaggi partono solo nell'orario di invio (${R.esc(orarioTesto())}), al massimo ${R.stato.impostazioni.limiteWA} messaggi automatici al giorno per numero.`,
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Attiva', classe: 'primario', fai: () => {
          if (!R.serveConnessione('l\'attivazione')) return false;
          if (a.bozza) applicaBozza(a, 'nuovi');
          a.stato = 'attiva'; a.attivataIl = R.adesso();
          a.versioni.unshift({ id: R.id('v'), quando: R.adesso(), chi: R.utente().id, nota: 'Versione attivata', nome: a.nome, quandoT: clona(a.quando), passi: clona(a.passi) });
          a.storico.unshift({ quando: R.adesso(), esito: 'modifica', testo: `Attivata da ${R.utente().breve}` });
          registra(`Ha attivato l'automazione «${a.nome}»`);
          R.salva(); R.aggiorna();
          R.avviso('Automazione attivata: parte da sola dal prossimo contatto');
        },
      }],
    });
  }
  function chiediPausa(a) {
    R.modale({
      titolo: `Mettere in pausa «${R.esc(a.nome)}»?`,
      sottotitolo: `${a.inAttesa ? `Le ${a.inAttesa} persone in attesa restano ferme al loro passaggio e ripartono da lì quando la riattivi.` : 'Non ci sono persone in attesa.'} Nel frattempo non entra nessuno di nuovo.`,
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Metti in pausa', classe: 'primario', fai: () => {
          a.stato = 'pausa';
          a.storico.unshift({ quando: R.adesso(), esito: 'modifica', testo: `Messa in pausa da ${R.utente().breve}: ${a.inAttesa} persone ferme` });
          registra(`Ha messo in pausa l'automazione «${a.nome}»`);
          R.salva(); R.aggiorna(); R.avviso('Automazione in pausa: le persone dentro restano ferme');
        },
      }],
    });
  }
  function chiediRiattiva(a) {
    R.modale({
      titolo: `Riattivare «${R.esc(a.nome)}»?`,
      sottotitolo: `${a.inAttesa ? `Le ${a.inAttesa} persone ferme ripartono dal passaggio in cui erano.` : 'Riparte per i nuovi contatti.'}${a.bozza ? ' Le modifiche in bozza non sono comprese: applicale a parte.' : ''}`,
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Riattiva', classe: 'primario', fai: () => {
          if (!R.serveConnessione('la riattivazione')) return false;
          a.stato = 'attiva';
          a.storico.unshift({ quando: R.adesso(), esito: 'modifica', testo: `Riattivata da ${R.utente().breve}` });
          registra(`Ha riattivato l'automazione «${a.nome}»`);
          R.salva(); R.aggiorna(); R.avviso('Automazione riattivata');
        },
      }],
    });
  }
  function applicaBozza(a, modo) {
    if (!a.bozza) return;
    a.versioni.unshift({ id: R.id('v'), quando: R.adesso(), chi: R.utente().id, nota: 'Versione prima delle modifiche', nome: a.nome, quandoT: clona(a.quando), passi: clona(a.passi) });
    a.versioni = a.versioni.slice(0, 12);
    a.nome = a.bozza.nome; a.quando = a.bozza.quando; a.passi = a.bozza.passi; a.bozza = null; a.ultimaModifica = R.adesso();
    a.storico.unshift({ quando: R.adesso(), esito: 'modifica', testo: modo === 'tutti' ? `Modifiche applicate da ${R.utente().breve} a tutti (${a.inAttesa} in attesa)` : `Modifiche applicate da ${R.utente().breve} solo ai nuovi contatti` });
    registra(`Ha applicato le modifiche all'automazione «${a.nome}»`);
  }

  /* ---------- Editor ---------- */
  function blocco(p, numero) {
    const scelto = sel.passo === p.id;
    const strumenti = scelto ? `<div class="ge-strumenti ge-solo-computer"><button data-azione="ge-sposta" data-verso="su" aria-label="Sposta su">${R.icona('su', 14)} Su</button><button data-azione="ge-sposta" data-verso="giu" aria-label="Sposta giù">${R.icona('giu', 14)} Giù</button><button data-azione="ge-elimina-passo" aria-label="Elimina il passaggio">${R.icona('cestino', 14)} Elimina</button></div>` : '';
    if (p.tipo === 'aspetta') return `<div class="ge-blocco aspetta ${scelto ? 'scelto' : ''}" role="button" tabindex="0" data-azione="ge-scegli" data-id="${p.id}" id="ge-b-${p.id}"><span class="ge-titolo" style="font-weight:500">${R.esc(titoloPasso(p))}</span>${strumenti}</div>`;
    const info = FAI_TIPO[p.tipo] || { etichetta: p.tipo, colore: '' };
    const tipo = [numero || null, p.dopo && p.dopo.quanto ? 'dopo ' + durata(p.dopo) : null, info.etichetta].filter(Boolean).join(' · ');
    const sotto = sottoPasso(p);
    return `<div class="ge-blocco ${info.colore} ${scelto ? 'scelto' : ''}" role="button" tabindex="0" data-azione="ge-scegli" data-id="${p.id}" id="ge-b-${p.id}"><span class="ge-tipo">${R.esc(tipo)}</span>${scelto ? '<span class="ge-sel"> · selezionato</span>' : ''}<div class="ge-titolo">${R.esc(titoloPasso(p))}</div>${sotto ? `<div class="ge-sotto">${R.esc(sotto)}</div>` : ''}${strumenti}</div>`;
  }
  function rami(p) {
    return `<div class="ge-rami">${['si', 'no'].map((r) => `<div class="ge-ramo"><div class="ge-linea"></div><span class="ge-esito ${r}">${r === 'si' ? 'Sì' : 'No'}</span>
      ${(p[r] || []).map((x) => `<div class="ge-linea"></div>${blocco(x, null)}`).join('')}
      ${!(p[r] || []).length ? '<div class="ge-linea"></div><div class="piccolo secondario" style="background:#F7F4EE;border-radius:999px;padding:7px 14px">Nessun passaggio: finisce qui</div>' : ''}
      <div class="ge-linea ge-solo-computer"></div><button class="ge-aggiungi piccola ge-solo-computer" data-azione="ge-aggiungi-menu" data-dove="${p.id}:${r}">+ Aggiungi</button></div>`).join('')}</div>`;
  }
  function htmlFlusso(w) {
    let n = 0;
    const quando = `<div class="ge-blocco quando ${sel.passo === 'quando' ? 'scelto' : ''}" role="button" tabindex="0" data-azione="ge-scegli" data-id="quando"><span class="ge-tipo">Quando</span>${sel.passo === 'quando' ? '<span class="ge-sel" style="color:var(--lime)"> · selezionato</span>' : ''}<div class="ge-titolo">${R.esc(testoQuando(w.quando))}</div></div>`;
    const passi = w.passi.map((p) => { if (p.tipo !== 'aspetta') n++; return `<div class="ge-linea"></div>${blocco(p, p.tipo === 'aspetta' ? null : n)}${p.tipo === 'se' ? rami(p) : ''}`; }).join('');
    return quando + passi + `<div class="ge-linea ge-solo-computer"></div><button class="ge-aggiungi ge-solo-computer" data-azione="ge-aggiungi-menu" data-dove="main">+ Aggiungi passaggio</button>${!w.passi.length ? '<p class="secondario piccolo" style="margin-top:12px;text-align:center">Nessun passaggio: aggiungine uno o sceglilo dalla libreria a sinistra.</p>' : ''}`;
  }
  function htmlLibreria(w) {
    return `<h2>Quando succede</h2>${QUANDO.map((q) => `<button class="ge-voce ${w.quando.tipo === q.tipo ? 'attiva' : ''}" data-azione="ge-quando" data-tipo="${q.tipo}">${q.nome}</button>`).join('')}
      <h2 style="margin-top:18px">Allora fai</h2>${FAI.map((f) => `<button class="ge-voce ${f.colore}" data-azione="ge-aggiungi-tipo" data-tipo="${f.tipo}">${f.nome}</button>`).join('')}
      <p class="piccolo secondario" style="margin:8px 4px 0">Un clic aggiunge il passaggio dopo quello selezionato.</p>`;
  }
  function percorsoFase(id, obj, solo) {
    const c = (campo) => `data-cambia="ge-campo" data-id="${id}" data-campo="${campo}"`;
    const per = R.percorso(obj.percorso) || R.stato.percorsi[0];
    const fasi = per.fasi.filter((f) => !solo || !f.tipo);
    return `<div class="griglia g-2">${gruppo('Percorso', scelta(`id="ge-pf-p-${id}" ${c('percorso')}`, R.stato.percorsi.map((x) => [x.id, x.nome]), per.id), 'ge-pf-p-' + id)}${gruppo('Fase', scelta(`id="ge-pf-f-${id}" ${c('fase')}`, fasi.map((f) => [f.id, f.nome]), obj.fase), 'ge-pf-f-' + id)}</div>`;
  }
  function pannelloQuando(a, w) {
    const q = w.quando;
    const c = (campo) => `data-cambia="ge-campo" data-id="quando" data-campo="${campo}"`;
    const t = (campo) => `data-digita="ge-testo" data-id="quando" data-campo="${campo}"`;
    let dettagli;
    switch (q.tipo) {
      case 'modulo': dettagli = gruppo('Quale modulo', scelta(`id="ge-q-modulo" ${c('modulo')}`, [['', 'Qualsiasi modulo']].concat((R.stato.funnel || []).map((f) => [f.nome, 'Modulo della pagina ' + f.nome])), q.modulo || ''), 'ge-q-modulo'); break;
      case 'meta': {
        const nomi = ((ge().meta || {}).moduli || []).filter((m) => m.stato !== 'archiviato').map((m) => m.nome);
        if (q.modulo && !nomi.includes(q.modulo)) nomi.push(q.modulo);
        dettagli = gruppo('Quale modulo Meta', scelta(`id="ge-q-meta" ${c('modulo')}`, [['', 'Qualsiasi modulo della pagina']].concat(nomi.map((n) => [n, n])), q.modulo || ''), 'ge-q-meta')
          + '<p class="piccolo secondario" style="margin-top:-6px">I moduli si collegano in Impostazioni → <a class="link verde" href="#/impostazioni/meta">Moduli Meta</a>.</p>';
        break;
      }
      case 'fase': dettagli = percorsoFase('quando', q); break;
      case 'etichetta': dettagli = gruppo('Etichetta', `<input class="campo" id="ge-q-et" value="${R.esc(q.etichetta || '')}" ${t('etichetta')}>`, 'ge-q-et'); break;
      case 'silenzio': dettagli = gruppo('Giorni senza risposta, contati dall\'ultimo messaggio inviato', `<input class="campo" type="number" min="1" id="ge-q-g" value="${q.giorni || 3}" ${t('giorni')}>`, 'ge-q-g'); break;
      case 'data': dettagli = `<div class="griglia g-2">${gruppo('Giorno', `<input class="campo" type="date" id="ge-q-d" value="${R.esc(q.data || '')}" ${c('data')}>`, 'ge-q-d')}${gruppo('Ora', `<input class="campo" type="time" id="ge-q-o" value="${R.esc(q.ora || '10:00')}" ${c('ora')}>`, 'ge-q-o')}</div>${gruppo('A chi ha l\'etichetta', `<input class="campo" id="ge-q-de" value="${R.esc(q.etichetta || '')}" ${t('etichetta')}>`, 'ge-q-de')}<p class="piccolo" style="color:var(--pesca-t);margin-top:-4px">Parte verso più contatti: conta come invio a più contatti e usa al massimo metà del limite giornaliero di ogni numero.</p>`; break;
      case 'email': dettagli = gruppo('Quale email', `<input class="campo" id="ge-q-em" value="${R.esc(q.email || '')}" placeholder="es. Newsletter di novembre" ${t('email')}>`, 'ge-q-em'); break;
      case 'campo': dettagli = gruppo('Campo con la data', scelta(`id="ge-q-c" ${c('campo')}`, [['Scadenza del bando', 'Scadenza del bando'], ['Data di nascita', 'Data di nascita'], ['Fine del contratto', 'Fine del contratto']], q.campo || 'Scadenza del bando'), 'ge-q-c'); break;
      default: dettagli = '<p class="secondario piccolo">Non ci sono altre scelte per questo evento.</p>';
    }
    const suCosa = q.tipo === 'fase' ? 'Lavora sull\'affare che è cambiato di fase.' : 'Lavora sul contatto.';
    return `<div class="riquadro" style="padding:20px">
      <h2>Quando succede</h2>
      <p class="solo-telefono" style="margin-top:-6px">${R.esc(testoQuando(q))}</p>
      <div class="ge-solo-computer">
        ${gruppo('Cosa fa partire l\'automazione', scelta(`id="ge-q-tipo" ${c('tipo')}`, QUANDO.map((x) => [x.tipo, x.nome]), q.tipo), 'ge-q-tipo')}
        ${dettagli}
        <div class="riga-impostazione"><span style="font-size:13px">Si ferma quando l'affare è vinto o perso</span>${interruttore('data-cambia="ge-campo" data-id="automazione" data-campo="fermaSeChiuso" aria-label="Si ferma quando l\'affare è vinto o perso"', a.fermaSeChiuso)}</div>
        <div class="riga-impostazione"><span style="font-size:13px">Un contatto non entra due volte mentre è già dentro</span>${interruttore('data-cambia="ge-campo" data-id="automazione" data-campo="nonDueVolte" aria-label="Un contatto non entra due volte"', a.nonDueVolte)}</div>
      </div>
      <p class="piccolo secondario" style="margin:10px 4px 0">${suCosa} I messaggi partono solo verso chi ha dato il consenso: chi ha «No» o «Non disturbare» viene saltato; con «Non registrato» non parte nulla, salvo chi ha scritto per primo su WhatsApp.</p>
      <p class="solo-telefono piccolo secondario">Questa parte si modifica da computer.</p>
    </div>`;
  }
  function htmlPannello(a, w) {
    if (sel.passo === 'quando') return pannelloQuando(a, w);
    const t = trova(w.passi, sel.passo);
    if (!t) return pannelloQuando(a, w);
    const p = t.passo;
    const id = p.id;
    const c = (campo, extra) => `data-cambia="ge-campo" data-id="${id}" data-campo="${campo}" ${extra || ''}`;
    const tx = (campo, extra) => `data-digita="ge-testo" data-id="${id}" data-campo="${campo}" ${extra || ''}`;
    const utentiAttivi = R.stato.utenti.filter((u) => u.stato === 'attivo');
    const appuntamento = w.quando.tipo === 'appuntamento';
    const limite = R.stato.impostazioni.limiteWA;
    let corpo = '';
    let dopo = '';
    let soloComputer = true;
    const pillole = `<div class="riga-flex" style="gap:8px;margin:-4px 0 12px"><button class="pillola su-bianco" data-azione="ge-dato" data-id="${id}">+ Dato del contatto</button><button class="pillola su-bianco" data-azione="ge-file" data-id="${id}">+ File dalla libreria</button></div>`;
    const f = fileDa(p.file);
    const rigaFile = f ? `<div class="riga-impostazione"><span>${R.icona('file', 16)} ${R.esc(f.nome)}</span><button class="link" data-azione="ge-togli-file" data-id="${id}">Togli</button></div>` : '';
    const rigaOrario = `<div class="riga-impostazione"><span class="secondario">Orario</span>${appuntamento ? '<span class="valore">Anche fuori orario</span>' : `<a class="valore link verde" href="#/impostazioni/orario">Orario di invio dell'azienda</a>`}</div>
      <p class="piccolo secondario" style="margin:2px 8px 0">${appuntamento ? 'Conferme e promemoria degli appuntamenti non aspettano l\'orario di invio e passano per primi nella coda.' : `${R.esc(orarioTesto())} · si cambia in Impostazioni · fuori orario il messaggio aspetta l'apertura`}</p>`;
    switch (p.tipo) {
      case 'whatsapp': {
        soloComputer = false;
        const numOpz = [['automatico', 'In automatico'], ['responsabile', 'Quello di chi segue il contatto'], ['predefinito', 'Il predefinito dell\'azienda']].concat(R.stato.numeri.map((n) => [n.id, 'Sempre ' + (n.utente ? 'quello di ' + R.utenteDa(n.utente).breve : 'quello aziendale')]));
        corpo = `${gruppo('Nome del passaggio (lo vedi solo tu)', `<input class="campo" id="ge-f-titolo" value="${R.esc(p.titolo || '')}" ${tx('titolo')}>`, 'ge-f-titolo', 'ge-solo-computer')}
          ${gruppo('Messaggio', `<textarea class="campo" id="ge-f-testo" rows="5" ${tx('testo')}>${R.esc(p.testo || '')}</textarea>`, 'ge-f-testo')}
          ${pillole}${rigaFile}
          <div class="ge-solo-computer">${gruppo('Da quale numero', scelta(`id="ge-f-numero" ${c('numero')}`, numOpz, p.numero || 'automatico'), 'ge-f-numero')}
          ${(p.numero || 'automatico') === 'automatico' ? '<p class="piccolo secondario" style="margin:-8px 8px 12px">Nell\'ordine: quello a cui il cliente ha scritto per ultimo, poi quello del responsabile, poi il predefinito dell\'azienda.</p>' : ''}
          <div class="riga-impostazione"><span style="font-size:13px">Se il servizio principale non funziona: usa il servizio di riserva sullo stesso numero</span>${interruttore(c('riserva', 'aria-label="Usa il servizio di riserva sullo stesso numero"'), p.riserva !== false)}</div>
          <p class="piccolo secondario" style="margin:0 8px 10px">Al massimo ${limite} messaggi automatici al giorno per numero, con pause casuali tra un messaggio e l'altro.</p></div>
          ${rigaOrario}`;
        dopo = `<div class="riquadro scuro ge-anteprima"><h2 class="titolo-riquadro">Anteprima su WhatsApp</h2><div class="ge-bolla" id="ge-anteprima-testo" ${!String(p.testo || '').trim() && f ? 'hidden' : ''}>${String(p.testo || '').trim() ? anteprima(p.testo) : 'Scrivi il messaggio o scegli un file.'}</div>${f ? `<div class="ge-bolla file">${R.icona('file', 20)}<span><b>${R.esc(f.nome)}</b><br><span class="piccolo">${R.esc(f.peso)}</span></span></div>` : ''}<p class="piccolo" style="opacity:.7;margin:10px 2px 0">Con i dati di un contatto d'esempio: Mario, seguito da Lucia.</p></div>`;
        break;
      }
      case 'email':
        soloComputer = false;
        corpo = `${gruppo('Oggetto', `<input class="campo" id="ge-f-oggetto" value="${R.esc(p.oggetto || '')}" ${tx('oggetto')}>`, 'ge-f-oggetto')}
          ${gruppo('Testo', `<textarea class="campo" id="ge-f-testo" rows="6" ${tx('testo')}>${R.esc(p.testo || '')}</textarea>`, 'ge-f-testo')}
          ${pillole}${rigaFile}
          <p class="piccolo secondario" style="margin:0 8px 10px">Parte dal dominio verificato dell'azienda con il nome di chi segue il contatto; le risposte finiscono nella storia del contatto.</p>${rigaOrario}`;
        dopo = `<div class="riquadro beige ge-anteprima"><h2 class="titolo-riquadro piccolo">Anteprima dell'email</h2><div class="grassetto">${anteprima(p.oggetto || '')}</div><div class="ge-bolla" id="ge-anteprima-testo" style="background:var(--bianco);color:var(--testo);margin-top:8px">${anteprima(p.testo || '')}</div></div>`;
        break;
      case 'affare':
        corpo = `${gruppo('Cosa fa', scelta(`id="ge-f-az" ${c('azione')}`, [['crea', 'Crea un nuovo affare'], ['sposta', 'Sposta l\'affare in una fase']], p.azione), 'ge-f-az')}${percorsoFase(id, p)}
          <p class="piccolo secondario">Se la fase avvia un'altra automazione, parte anche quella. Oltre 10 passaggi automatici a catena in un minuto sullo stesso contatto, tutto si ferma e avvisiamo gli amministratori.</p>`;
        break;
      case 'assegna':
        corpo = `${gruppo('Come assegnare', scelta(`id="ge-f-modo" ${c('modo')}`, [['turno', 'A turno tra più persone'], ['fisso', 'Sempre alla stessa persona']], p.modo), 'ge-f-modo')}
          <div class="etichetta-campo">${p.modo === 'fisso' ? 'A chi (la prima accesa)' : 'Chi partecipa al turno'}</div>
          ${utentiAttivi.map((u) => `<div class="riga-impostazione"><span>${R.esc(u.nome)}</span>${interruttore(`data-cambia="ge-persona" data-id="${id}" data-persona="${u.id}" aria-label="${R.esc(u.nome)}"`, (p.persone || []).includes(u.id))}</div>`).join('')}
          <p class="piccolo secondario">Chi è segnato «Assente» nel suo profilo salta il turno.</p>`;
        break;
      case 'promemoria':
        corpo = `${gruppo('Cosa fare', `<input class="campo" id="ge-f-pt" value="${R.esc(p.titolo || '')}" ${tx('titolo')}>`, 'ge-f-pt')}
          <div class="griglia g-2">${gruppo('Entro (ore di lavoro)', `<input class="campo" type="number" min="0" id="ge-f-entro" value="${p.entro == null ? 1 : p.entro}" ${tx('entro')}>`, 'ge-f-entro')}${gruppo('Per chi', scelta(`id="ge-f-a" ${c('a')}`, [['responsabile', 'Il responsabile']].concat(utentiAttivi.map((u) => [u.id, u.nome])), p.a || 'responsabile'), 'ge-f-a')}</div>
          <p class="piccolo secondario">Le ore di lavoro sono quelle dell'orario di invio (${R.esc(orarioTesto())}).</p>`;
        break;
      case 'aspetta':
        corpo = `<div class="griglia g-2">${gruppo('Quanto', `<input class="campo" type="number" min="1" id="ge-f-q" value="${p.quanto || 1}" ${tx('quanto')}>`, 'ge-f-q')}${gruppo('Unità', scelta(`id="ge-f-u" ${c('unita')}`, [['minuti', 'minuti'], ['ore', 'ore'], ['giorni', 'giorni']], p.unita || 'giorni'), 'ge-f-u')}</div>
          <p class="piccolo secondario">L'attesa conta il tempo reale; i messaggi dopo l'attesa aspettano comunque l'orario di invio. Con le modifiche «per tutti», chi è già in attesa mantiene la scadenza fissata.</p>`;
        break;
      case 'se':
        corpo = `${gruppo('Condizione', scelta(`id="ge-f-cond" ${c('condizione')}`, [['risposto', 'Ha risposto su WhatsApp'], ['email', 'Ha aperto l\'email'], ['fase', 'È arrivato in una fase'], ['etichetta', 'Ha un\'etichetta']], p.condizione), 'ge-f-cond')}
          ${['risposto', 'email'].includes(p.condizione) ? gruppo('Entro quante ore', `<input class="campo" type="number" min="1" id="ge-f-ore" value="${p.ore || 24}" ${tx('ore')}>`, 'ge-f-ore') : ''}
          ${p.condizione === 'fase' ? percorsoFase(id, Object.assign({ percorso: 'p1' }, p)) : ''}
          ${p.condizione === 'etichetta' ? gruppo('Etichetta', `<input class="campo" id="ge-f-cet" value="${R.esc(p.etichetta || '')}" ${tx('etichetta')}>`, 'ge-f-cet') : ''}
          <p class="piccolo secondario">Nel ramo Sì e nel ramo No il passaggio successivo è quello dello stesso ramo. Aggiungi i passaggi con «+ Aggiungi» sotto Sì o No.</p>`;
        break;
      case 'etichetta':
        corpo = `${gruppo('Cosa fa', scelta(`id="ge-f-ea" ${c('azione')}`, [['aggiungi', 'Aggiunge l\'etichetta'], ['togli', 'Toglie l\'etichetta']], p.azione), 'ge-f-ea')}${gruppo('Etichetta', `<input class="campo" id="ge-f-et" value="${R.esc(p.etichetta || '')}" ${tx('etichetta')}>`, 'ge-f-et')}`;
        break;
      case 'campo':
        corpo = `${gruppo('Campo', scelta(`id="ge-f-campo" ${c('campo')}`, ['Bando di interesse', 'Regione', 'Investimento previsto', 'Cosa vuole acquistare'].map((x) => [x, x]), p.campo), 'ge-f-campo')}${gruppo('Valore da scrivere', `<input class="campo" id="ge-f-val" value="${R.esc(p.valore || '')}" ${tx('valore')}>`, 'ge-f-val')}<p class="piccolo secondario">La storia del contatto conserva il valore di prima.</p>`;
        break;
      case 'avvisa':
        corpo = `${gruppo('Chi avvisare', scelta(`id="ge-f-chi" ${c('chi')}`, [['responsabile', 'Il responsabile'], ['amministratori', 'Gli amministratori']].concat(utentiAttivi.map((u) => [u.id, u.nome])), p.chi || 'responsabile'), 'ge-f-chi')}${gruppo('Testo dell\'avviso', `<input class="campo" id="ge-f-at" value="${R.esc(p.testo || '')}" ${tx('testo')}>`, 'ge-f-at')}
          <p class="piccolo secondario">Arriva nella campanella e su WhatsApp al suo «Numero per gli avvisi» (solo nell'orario dell'azienda; fuori orario per email). Non conta nel limite.</p>`;
        break;
      case 'esterno':
        corpo = `${gruppo('Dove', scelta(`id="ge-f-srv" ${c('servizio')}`, [['fogli', 'Google Fogli: aggiungi una riga'], ['slack', 'Slack: manda un messaggio'], ['webhook', 'Un altro programma (webhook, es. Pabbly, Zapier, Make)']], p.servizio), 'ge-f-srv')}${gruppo(p.servizio === 'webhook' ? 'Indirizzo che riceve i dati' : p.servizio === 'slack' ? 'Canale' : 'Nome del foglio', `<input class="campo" id="ge-f-dove" value="${R.esc(p.dove || '')}" ${tx('dove')}>`, 'ge-f-dove')}
          <p class="piccolo secondario">Nel prototipo il collegamento è simulato. Lo stato dei collegamenti è in Impostazioni → Collegamenti esterni.</p>`;
        break;
      default: corpo = '';
    }
    const attesa = !['aspetta', 'se'].includes(p.tipo) ? `<div class="ge-solo-computer" style="margin-top:14px"><div class="etichetta-campo">Prima di questo passaggio aspetta</div><div class="griglia g-2"><input class="campo" type="number" min="0" aria-label="Quanto aspettare prima del passaggio" value="${(p.dopo && p.dopo.quanto) || 0}" ${tx('dopo.quanto')}>${scelta(`aria-label="Unità di tempo dell'attesa" ${c('dopo.unita')}`, [['minuti', 'minuti'], ['ore', 'ore'], ['giorni', 'giorni']], (p.dopo && p.dopo.unita) || 'giorni')}</div></div>` : '';
    const piede = `<div class="riga-flex ge-solo-computer" style="margin-top:16px;gap:8px"><button class="btn piccolo secondario-campo" data-azione="ge-sposta" data-verso="su">${R.icona('su', 14)} Sposta su</button><button class="btn piccolo secondario-campo" data-azione="ge-sposta" data-verso="giu">${R.icona('giu', 14)} Sposta giù</button><button class="btn piccolo pesca" data-azione="ge-elimina-passo">${R.icona('cestino', 14)} Elimina</button></div>`;
    return `<div class="riquadro" style="padding:20px">
        <h2>${R.esc((FAI_TIPO[p.tipo] || {}).nome || 'Passaggio')}</h2>
        <div class="${soloComputer ? 'ge-solo-computer' : ''}">${corpo}${attesa}</div>
        ${soloComputer ? `<p class="solo-telefono">${R.esc(titoloPasso(p))}</p><p class="solo-telefono piccolo secondario">Questo passaggio si modifica da computer.</p>` : ''}
        ${piede}
      </div>${dopo}`;
  }
  function disegnaEditor(p) {
    prepara();
    const a = auto(p.id);
    if (!a) return `<div class="contenuto"><div class="riquadro vuoto spazio-sopra">Questa automazione non c'è più: forse è stata eliminata. <a class="link verde" href="#/automazioni">Torna alle automazioni</a></div></div>`;
    if (sel.auto !== a.id) { const primo = trovaPrimo(lavoro(a).passi, 'whatsapp'); sel = { auto: a.id, passo: primo ? primo.id : 'quando' }; }
    const w = lavoro(a);
    if (sel.passo !== 'quando' && !trova(w.passi, sel.passo)) sel.passo = 'quando';
    const pubblicata = a.stato !== 'bozza';
    const pill = a.stato === 'attiva' ? ['on', 'Attiva'] : a.stato === 'pausa' ? ['pausa', 'In pausa'] : ['', 'Attiva'];
    const statoSalv = a.bozza ? 'Modifiche in bozza, non ancora applicate' : a.ultimaModifica ? 'Salvato alle ' + R.ora(a.ultimaModifica) : 'Salvato';
    return `
      <div class="barra-editor">
        <a class="btn tondo secondario-campo" href="#/automazioni" aria-label="Torna alle automazioni">${R.icona('freccia-sinistra')}</a>
        <div class="nome-editor"><b>${R.esc(w.nome)} <button class="link verde ge-solo-computer" style="font-weight:500;margin-left:6px" data-azione="ge-rinomina">Rinomina</button></b><span>${R.numero(a.passate)} persone passate di qui · ${a.inAttesa} adesso in attesa · <span id="ge-salvataggio">${statoSalv}</span></span></div>
        <button class="ge-pill-attiva ${pill[0]}" data-azione="ge-attiva" aria-pressed="${a.stato === 'attiva'}"><span class="ge-casella">${a.stato === 'attiva' ? R.icona('spunta', 13) : ''}</span>${pill[1]}<span class="nascosto-accessibile">${a.stato === 'attiva' ? ': premi per mettere in pausa' : a.stato === 'pausa' ? ': premi per riattivare' : ': premi per attivare'}</span></button>
        <button class="btn secondario-campo" data-azione="ge-prova">Prova con un contatto finto</button>
        <button class="btn secondario-campo" data-azione="ge-storico">Storico</button>
        ${pubblicata ? '<button class="btn primario" data-azione="ge-applica">Applica modifiche</button>' : '<button class="btn primario" data-azione="ge-salva-auto">Salva</button>'}
      </div>
      <div style="margin:14px var(--margine) 0">
        ${a.bozza ? `<div class="banner ge-banner-lavanda">${R.icona('nota')}<div class="principale"><b>Stai modificando una bozza.</b> Chi è già dentro continua con la versione attiva finché non premi «Applica modifiche».</div><button class="btn piccolo" data-azione="ge-scarta-bozza">Scarta le modifiche</button></div>` : ''}
        ${a.stato === 'pausa' ? `<div class="banner giallo">${R.icona('pausa')}<div class="principale"><b>Automazione in pausa.</b> ${plurale(a.inAttesa, 'persona è ferma', 'persone sono ferme')} al proprio passaggio e ripartono quando la riattivi.</div></div>` : ''}
        <div class="banner ge-banner-bianco solo-telefono">${R.icona('computer')}<div class="principale">La costruzione completa si fa da computer: dal telefono puoi vedere, correggere testi, pubblicare e mettere in pausa.</div></div>
      </div>
      <div class="area-editor ge-area-auto">
        <aside class="riquadro ge-libreria nascondi-telefono" aria-label="Libreria dei passaggi">${htmlLibreria(w)}</aside>
        <div class="ge-tela" aria-label="Passaggi dell'automazione">${htmlFlusso(w)}</div>
        <aside class="pannello-destro ge-pannello" aria-label="Impostazioni del passaggio selezionato">${htmlPannello(a, w)}</aside>
      </div>`;
  }
  R.rotta('/automazioni/:id', {
    menu: 'automazioni',
    pieno: true,
    titolo: (p) => { const a = R.stato && R.stato.automazioni && R.stato.automazioni.find((x) => x.id === p.id); return a ? lavoro(a).nome : 'Automazione'; },
    disegna: disegnaEditor,
  });

  /* ---------- Azioni dell'editor ---------- */
  R.azioni['ge-scegli'] = (el) => { sel.passo = el.dataset.id; R.aggiorna(); };
  function impostaCampo(obj, campo, v) {
    if (campo.startsWith('dopo.')) { obj.dopo = obj.dopo || { quanto: 0, unita: 'giorni' }; obj.dopo[campo.slice(5)] = v; return; }
    obj[campo] = v;
  }
  /* Campi di testo e numeri: aggiornano mentre scrivi, senza ridisegnare (così non perdi il punto in cui scrivi). */
  R.azioni['ge-testo'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    const w = modificabile(a);
    const campo = el.dataset.campo;
    const obj = el.dataset.id === 'quando' ? w.quando : (trova(w.passi, el.dataset.id) || {}).passo;
    if (!obj) return;
    let v = el.value;
    if (el.type === 'number') { v = parseInt(v, 10); if (!(v >= 0)) return; }
    impostaCampo(obj, campo, v);
    if (el.dataset.id === 'quando') {
      const q = document.querySelector('.ge-blocco.quando .ge-titolo');
      if (q) q.textContent = testoQuando(w.quando);
    } else {
      const b = document.getElementById('ge-b-' + obj.id);
      const t = b && b.querySelector('.ge-titolo');
      if (t) t.textContent = titoloPasso(obj);
    }
    if (campo === 'testo') {
      const pr = document.getElementById('ge-anteprima-testo');
      if (pr) { pr.hidden = false; pr.innerHTML = String(el.value).trim() ? anteprima(el.value) : 'Scrivi il messaggio o scegli un file.'; }
    }
    salvato(a);
  };
  /* Scelte, interruttori: aggiornano e ridisegnano. */
  R.azioni['ge-campo'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    const campo = el.dataset.campo;
    const v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.id === 'automazione') { a[campo] = v; salvato(a); R.aggiorna(); return; }
    const w = modificabile(a);
    if (el.dataset.id === 'quando') {
      if (campo === 'tipo') w.quando = quandoDiBase(v);
      else { impostaCampo(w.quando, campo, v); if (campo === 'percorso') { const per = R.percorso(v); w.quando.fase = per ? (per.fasi.find((f) => !f.tipo) || per.fasi[0]).id : ''; } }
    } else {
      const t = trova(w.passi, el.dataset.id);
      if (!t) return;
      impostaCampo(t.passo, campo, v);
      if (campo === 'percorso') { const per = R.percorso(v); t.passo.fase = per ? per.fasi[0].id : ''; }
      if (campo === 'condizione' && v === 'fase' && !t.passo.fase) { t.passo.percorso = 'p1'; t.passo.fase = 'f4'; }
    }
    salvato(a); R.aggiorna();
  };
  R.azioni['ge-persona'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    const w = modificabile(a);
    const t = trova(w.passi, el.dataset.id);
    if (!t) return;
    const lista = (t.passo.persone || []).filter((x) => x !== el.dataset.persona);
    if (el.checked) lista.push(el.dataset.persona);
    t.passo.persone = lista;
    salvato(a); R.aggiorna();
  };
  R.azioni['ge-quando'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    if (lavoro(a).quando.tipo !== el.dataset.tipo) { const w = modificabile(a); w.quando = quandoDiBase(el.dataset.tipo); salvato(a); }
    sel.passo = 'quando';
    R.aggiorna();
  };
  R.azioni['ge-aggiungi-menu'] = (el) => {
    R.tendina(el, `<div class="titolo-tendina">Allora fai</div>${FAI.filter((f) => !(f.tipo === 'se' && el.dataset.dove !== 'main')).map((f) => `<button data-azione="ge-aggiungi-tipo" data-tipo="${f.tipo}" data-dove="${R.esc(el.dataset.dove)}">${R.esc(f.nome)}</button>`).join('')}`);
  };
  R.azioni['ge-aggiungi-tipo'] = (el) => {
    R.chiudiTendina();
    const a = autoCorrente();
    if (!a) return;
    const tipo = el.dataset.tipo;
    const dove = el.dataset.dove;
    const prima = dove || (sel.passo === 'quando' ? 'main' : ((trova(lavoro(a).passi, sel.passo) || {}).genitore || 'main'));
    if (tipo === 'se' && prima !== 'main') { R.avviso('Un «Se… altrimenti» dentro un ramo si potrà fare nel software vero: nel prototipo aggiungilo nel percorso principale'); return; }
    const w = modificabile(a);
    const nuovo = nuovoPasso(tipo);
    let lista, indice;
    if (dove) { lista = listaDa(w, dove); indice = lista.length; }
    else if (sel.passo === 'quando') { lista = w.passi; indice = 0; }
    else { const t = trova(w.passi, sel.passo); if (t) { lista = t.lista; indice = t.i + 1; } else { lista = w.passi; indice = lista.length; } }
    lista.splice(indice, 0, nuovo);
    sel.passo = nuovo.id;
    salvato(a); R.aggiorna();
    R.avviso(`Passaggio aggiunto: ${R.esc(FAI_TIPO[tipo].nome)}`);
  };
  R.azioni['ge-sposta'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    const w = modificabile(a);
    const t = trova(w.passi, sel.passo);
    if (!t) return;
    const su = el.dataset.verso === 'su';
    const j = t.i + (su ? -1 : 1);
    if (j < 0 || j >= t.lista.length) { R.avviso(su ? 'È già il primo passaggio' : 'È già l\'ultimo passaggio'); return; }
    const idSpostato = t.passo.id;
    const scambia = () => {
      const x = trova(modificabile(a).passi, idSpostato);
      if (!x) return;
      const k = x.i + (su ? 1 : -1);
      if (k < 0 || k >= x.lista.length) return;
      [x.lista[x.i], x.lista[k]] = [x.lista[k], x.lista[x.i]];
    };
    [t.lista[t.i], t.lista[j]] = [t.lista[j], t.lista[t.i]];
    salvato(a); R.aggiorna();
    R.avviso('Passaggio spostato', { annulla: () => { scambia(); salvato(a); R.aggiorna(); } });
  };
  R.azioni['ge-elimina-passo'] = () => {
    const a = autoCorrente();
    if (!a) return;
    const w = modificabile(a);
    const t = trova(w.passi, sel.passo);
    if (!t) return;
    const [tolto] = t.lista.splice(t.i, 1);
    const dove = t.genitore, i = t.i;
    sel.passo = (t.lista[i] || t.lista[i - 1] || {}).id || 'quando';
    salvato(a); R.aggiorna();
    R.avviso('Passaggio eliminato', { annulla: () => { const l = listaDa(modificabile(a), dove); if (l) { l.splice(Math.min(i, l.length), 0, tolto); sel.passo = tolto.id; salvato(a); R.aggiorna(); } } });
  };
  R.azioni['ge-dato'] = (el) => {
    R.tendina(el, `<div class="titolo-tendina">Inserisci nel testo</div>${DATI_CONTATTO.map(([k, t]) => `<button data-azione="ge-dato-scelto" data-k="${k}"><span class="ge-gettone">{${k}}</span>${t}</button>`).join('')}`);
  };
  R.azioni['ge-dato-scelto'] = (el) => {
    R.chiudiTendina();
    const ta = document.getElementById('ge-f-testo');
    if (!ta) return;
    const tok = '{' + el.dataset.k + '}';
    const s = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    const e = ta.selectionEnd == null ? ta.value.length : ta.selectionEnd;
    ta.setRangeText(tok, s, e, 'end');
    ta.focus();
    R.azioni['ge-testo'](ta);
  };
  R.azioni['ge-file'] = (el) => {
    const lib = R.stato.libreria || [];
    R.tendina(el, `<div class="titolo-tendina">Libreria file</div>${lib.map((l) => `<button data-azione="ge-file-scelto" data-id="${el.dataset.id}" data-file="${l.id}">${R.icona('file')} ${R.esc(l.nome)} <span class="secondario piccolo">${R.esc(l.peso)}</span></button>`).join('') || '<div class="vuoto">La libreria è vuota: carica i file da Marketing → Libreria file.</div>'}`);
  };
  R.azioni['ge-file-scelto'] = (el) => {
    R.chiudiTendina();
    const a = autoCorrente();
    if (!a) return;
    const w = modificabile(a);
    const t = trova(w.passi, el.dataset.id);
    if (!t) return;
    t.passo.file = el.dataset.file;
    salvato(a); R.aggiorna();
    R.avviso('File aggiunto al messaggio');
  };
  R.azioni['ge-togli-file'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    const w = modificabile(a);
    const t = trova(w.passi, el.dataset.id);
    if (!t) return;
    t.passo.file = null;
    salvato(a); R.aggiorna();
  };
  R.azioni['ge-rinomina'] = () => {
    const a = autoCorrente();
    if (!a) return;
    R.modale({
      titolo: 'Rinomina l\'automazione',
      classe: 'stretta',
      corpo: gruppo('Nome', `<input class="campo" id="ge-rin" name="nome" value="${R.esc(lavoro(a).nome)}">`, 'ge-rin'),
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome.'); return false; }
          modificabile(a).nome = v.nome; salvato(a); R.aggiorna(); R.avviso(a.stato === 'bozza' ? 'Nome salvato' : 'Nome cambiato nella bozza');
        },
      }],
    });
  };
  R.azioni['ge-salva-auto'] = () => {
    const a = autoCorrente();
    if (!a) return;
    a.versioni.unshift({ id: R.id('v'), quando: R.adesso(), chi: R.utente().id, nota: 'Salvata', nome: a.nome, quandoT: clona(a.quando), passi: clona(a.passi) });
    a.versioni = a.versioni.slice(0, 12);
    salvato(a); R.aggiorna();
    R.avviso('Salvato · resta disattivata finché non premi «Attiva»');
  };
  R.azioni['ge-attiva'] = () => {
    const a = autoCorrente();
    if (!a) return;
    if (a.stato === 'attiva') chiediPausa(a);
    else if (a.stato === 'pausa') chiediRiattiva(a);
    else chiediAttivazione(a);
  };
  R.azioni['ge-scarta-bozza'] = () => {
    const a = autoCorrente();
    if (!a || !a.bozza) return;
    const b = a.bozza;
    a.bozza = null;
    R.salva(); R.aggiorna();
    R.avviso('Modifiche scartate: resta la versione attiva', { annulla: () => { a.bozza = b; R.salva(); R.aggiorna(); } });
  };
  R.azioni['ge-applica'] = () => {
    const a = autoCorrente();
    if (!a) return;
    if (!a.bozza) { R.avviso('Non ci sono modifiche da applicare: cambia un passaggio e poi premi «Applica modifiche»'); return; }
    const problema = controllaPassi(a.bozza);
    if (problema) { R.modale({ titolo: 'Prima di applicare manca qualcosa', sottotitolo: R.esc(problema), classe: 'stretta', pulsanti: [{ testo: 'Ho capito', classe: 'primario', chiudi: true }] }); return; }
    if (!R.serveConnessione('l\'applicazione delle modifiche')) return;
    if (!a.inAttesa) { applicaBozza(a, 'nuovi'); R.chiudiModale(true); R.salva(); R.aggiorna(); R.avviso('Modifiche applicate'); return; }
    R.modale({
      titolo: 'Applicare le modifiche?',
      sottotitolo: `In «${R.esc(a.bozza.nome)}» ci sono ${a.inAttesa} persone in attesa. Le modifiche valgono per tutti o solo per i nuovi?`,
      corpo: `<button class="opzione" data-azione="ge-applica-scelta" data-modo="tutti"><span class="principale"><b>Valgono per tutti (${a.inAttesa} in attesa)</b><span class="sotto">Chi era su un passaggio eliminato prosegue dal passaggio successivo rimasto; chi è in un'attesa mantiene la scadenza già fissata.</span></span>${R.icona('destra')}</button>
        <button class="opzione" data-azione="ge-applica-scelta" data-modo="nuovi"><span class="principale"><b>Solo per i nuovi</b><span class="sotto">Le ${a.inAttesa} persone già dentro finiscono con la versione di prima.</span></span>${R.icona('destra')}</button>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }],
    });
  };
  R.azioni['ge-applica-scelta'] = (el) => {
    const a = autoCorrente();
    R.chiudiModale(true);
    if (!a || !a.bozza) return;
    applicaBozza(a, el.dataset.modo);
    R.salva(); R.aggiorna();
    R.avviso(el.dataset.modo === 'tutti' ? `Modifiche applicate a tutti (${a.inAttesa} in attesa)` : 'Modifiche applicate ai nuovi contatti');
  };

  /* ---------- Storico ed elenco delle versioni ---------- */
  R.azioni['ge-storico'] = () => {
    const a = autoCorrente();
    if (!a) return;
    const ET = { attesa: ['cielo', 'In attesa'], fatta: ['salvia', 'Completata'], errore: ['errore', 'Errore'], fermata: ['', 'Fermata'], modifica: ['lavanda', 'Modifica'] };
    const righe = a.storico.map((s) => {
      const c = s.contatto ? R.contatto(s.contatto) : null;
      const et = ET[s.esito] || ['', s.esito];
      return `<div class="riga" style="align-items:flex-start"><span class="etichetta ${et[0]}" style="margin-top:3px">${et[1]}</span><div class="principale"><div class="titolo-riga">${c ? `<a href="#/contatto/${c.id}" style="text-decoration:none">${R.esc(c.nome)}</a>` : 'Automazione'}</div><div class="sotto">${R.esc(s.testo)}</div></div><span class="piccolo secondario" style="white-space:nowrap">${R.esc(R.quandoBreve(s.quando))}</span></div>`;
    }).join('') || '<div class="vuoto">Ancora nessuna esecuzione: quando la attivi, qui vedi ogni contatto che passa, con eventuali errori.</div>';
    const versioni = a.versioni.map((v) => `<div class="riga"><div class="principale"><div class="titolo-riga">${R.esc(v.nota)} · ${R.esc(R.utenteDa(v.chi).breve)}</div><div class="sotto">${R.esc(R.quandoBreve(v.quando))} · ${plurale(contaPassi(v.passi), 'passaggio', 'passaggi')}</div></div><button class="btn piccolo secondario-campo" data-azione="ge-ripristina-versione" data-v="${v.id}">Ripristina questa versione</button></div>`).join('') || '<div class="vuoto">Nessuna versione precedente: quando applichi delle modifiche, la versione di prima resta qui.</div>';
    R.modale({
      titolo: 'Storico',
      sottotitolo: `${R.esc(lavoro(a).nome)} · ogni esecuzione con eventuali errori, e le versioni precedenti`,
      classe: 'larga',
      corpo: `<div class="selettore su-bianco spazio-sotto" role="tablist"><button class="attivo" role="tab" data-azione="ge-storico-scheda" data-s="es">Esecuzioni</button><button role="tab" data-azione="ge-storico-scheda" data-s="ve">Versioni</button></div><div id="ge-st-es" class="elenco">${righe}</div><div id="ge-st-ve" class="elenco" hidden>${versioni}</div>`,
    });
  };
  R.azioni['ge-storico-scheda'] = (el) => {
    const m = el.closest('.modale');
    m.querySelectorAll('[data-azione="ge-storico-scheda"]').forEach((b) => b.classList.toggle('attivo', b === el));
    m.querySelector('#ge-st-es').hidden = el.dataset.s !== 'es';
    m.querySelector('#ge-st-ve').hidden = el.dataset.s !== 've';
  };
  R.azioni['ge-ripristina-versione'] = (el) => {
    const a = autoCorrente();
    if (!a) return;
    const v = a.versioni.find((x) => x.id === el.dataset.v);
    if (!v) return;
    const w = modificabile(a);
    w.nome = v.nome; w.quando = clona(v.quandoT); w.passi = clona(v.passi);
    sel.passo = 'quando';
    R.chiudiModale(true);
    salvato(a); R.aggiorna();
    R.avviso(a.stato === 'bozza' ? 'Versione ripristinata' : 'Versione ripristinata nella bozza: premi «Applica modifiche» per renderla attiva');
  };

  /* ---------- Prova con un contatto finto (simulata, senza invii reali) ---------- */
  function simula(w, opz) {
    const imp = R.stato.impostazioni;
    const righe = [];
    let t = new Date(opz.inizio);
    let resp = 'u2';
    let primoWA = false;
    let haScritto = false;
    const conteggi = {};
    const oggi = ddmm(new Date());
    const appuntamento = w.quando.tipo === 'appuntamento';
    const chiave = (n, d) => {
      const k = n.id + '|' + ddmm(d);
      if (conteggi[k] == null) conteggi[k] = ddmm(d) === oggi ? (opz.pieno && n.utente === 'u2' ? n.limite : n.oggi || 0) : 0;
      return k;
    };
    const numeroPer = (p) => {
      if (p.numero && !['automatico', 'responsabile', 'predefinito'].includes(p.numero)) return numeroDa(p.numero) || predefinito();
      if (p.numero === 'predefinito') return predefinito();
      return R.stato.numeri.find((n) => n.utente === resp) || predefinito();
    };
    const dati = () => Object.assign({}, ESEMPIO, { nome: 'Mario', responsabile: R.utenteDa(resp).breve });
    const quandoTxt = testoQuando(w.quando);
    righe.push({ ora: new Date(t), titolo: 'Parte: ' + quandoTxt.charAt(0).toLowerCase() + quandoTxt.slice(1), sotto: 'Contatto finto: Mario Rossi · +39 333 000 0000 · consenso WhatsApp: Sì' });
    const esegui = (lista) => { for (const p of lista) { if (righe.length > 45) return; passo(p); } };
    function invioOrario(note) {
      if (appuntamento) { note.push('Messaggio di appuntamento: non aspetta l\'orario di invio e passa per primo nella coda'); return; }
      if (!inOrario(t)) { const ap = prossimaApertura(t); note.push(`Fuori dall'orario di invio (${orarioTesto()}): aspetta fino a ${quandoMinuscolo(ap.toISOString())}`); t = ap; }
    }
    function passo(p) {
      if (p.dopo && p.dopo.quanto) { t = aggiungiDurata(t, p.dopo); righe.push({ ora: new Date(t), tipo: 'aspetta', titolo: 'Aspetta ' + durata(p.dopo) }); }
      switch (p.tipo) {
        case 'aspetta': t = aggiungiDurata(t, p); righe.push({ ora: new Date(t), tipo: 'aspetta', titolo: titoloPasso(p) }); break;
        case 'whatsapp': {
          const note = [];
          let n = numeroPer(p);
          if (!n) { righe.push({ ora: new Date(t), titolo: 'WhatsApp non inviato', nota: 'Non c\'è nessun numero collegato: collegane uno nella pagina WhatsApp' }); break; }
          if ((p.numero || 'automatico') === 'automatico' && !haScritto && !primoWA) note.push('Mario non ha ancora scritto a nessun numero: parte da quello di chi lo segue');
          primoWA = true;
          invioOrario(note);
          let k = chiave(n, t);
          if (!appuntamento && conteggi[k] >= n.limite) {
            if (imp.numeroPieno === 'aziendale' && !n.predefinito && predefinito()) {
              note.push(`Il ${nomeNumero(n)} ha già ${n.limite} messaggi automatici oggi: parte dal numero aziendale`);
              n = predefinito(); k = chiave(n, t);
            }
            if (conteggi[k] >= n.limite) {
              const dom = new Date(t); dom.setDate(dom.getDate() + 1); dom.setHours(0, 0, 0, 0);
              const ap = prossimaApertura(dom);
              note.push(`Il ${nomeNumero(n)} ha raggiunto il limite di ${n.limite} messaggi automatici oggi: aspetta ${quandoMinuscolo(ap.toISOString())}`);
              t = ap; k = chiave(n, t);
            }
          }
          if (!appuntamento) {
            const pausa = imp.pausaMin + ((righe.length * 37) % (imp.pausaMax - imp.pausaMin + 1));
            t = new Date(t.getTime() + pausa * 1000);
            note.push(`pausa casuale di ${pausa} secondi prima dell'invio`);
          }
          conteggi[k]++;
          const s = R.servizioAttivo(n.id);
          if (!s) note.push('Il numero è fermo: nel software vero il messaggio resterebbe in coda finché non lo ricolleghi');
          else if (s === 'B' && p.riserva === false) note.push('Riserva spenta in questo passaggio: il messaggio aspetterebbe che torni il servizio A');
          const f = fileDa(p.file);
          righe.push({ ora: new Date(t), titolo: `WhatsApp a Mario Rossi dal ${nomeNumero(n)} (${n.telefono})`, sotto: `${s === 'B' ? 'Servizio B, la riserva sullo stesso numero, perché A non risponde' : s === 'A' ? 'Servizio A' : 'Nessun servizio disponibile'} · ${appuntamento ? 'non conta nel limite' : `${conteggi[k]} di ${n.limite} automatici in quel giorno`}`, bolla: String(p.testo || '').trim() ? riempi(p.testo, dati()) : '', file: f ? f.nome : '', nota: note.join(' · ') });
          break;
        }
        case 'email': {
          const note = [];
          invioOrario(note);
          righe.push({ ora: new Date(t), titolo: `Email a mario.rossi@esempio.it: «${p.oggetto || 'senza oggetto'}»`, sotto: `Da ${R.utenteDa(resp).breve} – ${R.azienda().nome}${fileDa(p.file) ? ' · allegato ' + fileDa(p.file).nome : ''}`, nota: note.join(' · ') });
          break;
        }
        case 'assegna': {
          const persone = p.persone || [];
          if (persone.length) resp = persone[0];
          righe.push({ ora: new Date(t), titolo: persone.length ? `Assegnato a ${R.utenteDa(resp).breve}` : 'Nessuno a cui assegnarlo', sotto: p.modo === 'turno' && persone.length > 1 ? `A turno tra ${elencoNomi(persone.map((x) => R.utenteDa(x).breve))}: tocca a ${R.utenteDa(resp).breve}` : '' });
          break;
        }
        case 'promemoria': {
          const per = p.a && p.a !== 'responsabile' ? p.a : resp;
          const scade = aggiungiLavoro(t, (p.entro || 0) * 60);
          righe.push({ ora: new Date(t), titolo: `Promemoria per ${R.utenteDa(per).breve}: «${p.titolo}»`, sotto: `Scade ${quandoMinuscolo(scade.toISOString())}, entro ${plurale(p.entro || 0, 'ora', 'ore')} di lavoro · arriva nella campanella e su WhatsApp` });
          break;
        }
        case 'se': {
          if (opz.risponde) {
            t = new Date(t.getTime() + 14 * 60000);
            if (p.condizione === 'risposto') haScritto = true;
            righe.push({ ora: new Date(t), tipo: 'se', titolo: testoCondizione(p), sotto: p.condizione === 'risposto' ? 'Sì: Mario risponde dopo 14 minuti, va nel ramo Sì' : 'Sì: la condizione è vera, va nel ramo Sì' });
            esegui(p.si || []);
          } else {
            t = new Date(t.getTime() + (p.ore || 24) * 3600000);
            righe.push({ ora: new Date(t), tipo: 'se', titolo: testoCondizione(p), sotto: ['risposto', 'email'].includes(p.condizione) ? `No: nessuna risposta entro ${plurale(p.ore || 24, 'ora', 'ore')}, va nel ramo No` : 'No: la condizione non è vera, va nel ramo No' });
            esegui(p.no || []);
          }
          break;
        }
        default: righe.push({ ora: new Date(t), titolo: titoloPasso(p), sotto: p.tipo === 'esterno' ? 'Collegamento simulato' : p.tipo === 'affare' ? 'La storia del contatto lo registra con autore «Automazione: ' + w.nome + '»' : '' });
      }
    }
    esegui(w.passi);
    righe.push({ ora: new Date(t), tipo: 'aspetta', titolo: 'Fine: Mario Rossi esce dall\'automazione' });
    return righe;
  }
  function opzioniProva() {
    const v = (id, def) => { const el = document.getElementById(id); return el ? el.value : def; };
    const ini = v('ge-p-inizio', 'adesso');
    const inizio = new Date();
    if (ini === 'sera') inizio.setHours(22, 30, 0, 0);
    if (ini === 'sabato') { inizio.setDate(inizio.getDate() + (((6 - inizio.getDay() + 7) % 7) || 7)); inizio.setHours(10, 0, 0, 0); }
    return { inizio, risponde: v('ge-p-risp', 'si') === 'si', pieno: v('ge-p-pieno', 'no') === 'si' };
  }
  function htmlProva(w, opz) {
    const righe = simula(w, opz);
    return `<div class="elenco spazio-sopra">${righe.map((r) => `<div class="ge-prova-riga ${r.tipo === 'aspetta' ? 'aspetta' : ''}"><span class="ge-prova-ora">${R.esc(R.quandoBreve(r.ora.toISOString()))}</span><div><div class="grassetto">${R.esc(r.titolo)}</div>${r.sotto ? `<div class="piccolo secondario">${R.esc(r.sotto)}</div>` : ''}${r.bolla ? `<div class="ge-bolla" style="margin-top:8px;max-width:460px">${r.bolla}</div>` : ''}${r.file ? `<div class="ge-bolla file" style="margin-top:8px;max-width:460px">${R.icona('file', 18)} ${R.esc(r.file)}</div>` : ''}${r.nota ? `<div class="ge-prova-nota">${R.esc(r.nota)}</div>` : ''}</div></div>`).join('')}</div>
      <p class="piccolo secondario">Prova finita: nessun messaggio è partito e nessun dato è stato cambiato.</p>`;
  }
  function apriProva(a) {
    const w = lavoro(a);
    const numL = R.stato.numeri.find((n) => n.utente === 'u2');
    const corpo = `<div class="banner ge-banner-info">${R.icona('occhio')}<div class="principale"><b>Prova senza inviare nulla di reale.</b> Vedi passo per passo cosa succederebbe a un contatto finto${a.bozza ? ', con le modifiche in bozza' : ''}. Gli orari seguono l'orario di invio (${R.esc(orarioTesto())}) e il limite di ${R.stato.impostazioni.limiteWA} messaggi al giorno per numero.</div></div>
      <div class="griglia g-3">
        ${gruppo('Quando arriva il contatto finto', scelta('id="ge-p-inizio" data-cambia="ge-prova-ricalcola"', [['adesso', 'Adesso'], ['sera', 'Oggi alle 22:30'], ['sabato', 'Sabato alle 10:00']], 'adesso'), 'ge-p-inizio')}
        ${gruppo('Nelle domande «Se…»', scelta('id="ge-p-risp" data-cambia="ge-prova-ricalcola"', [['si', 'Risponde: ramo Sì'], ['no', 'Non risponde: ramo No']], 'si'), 'ge-p-risp')}
        ${numL ? gruppo('Messaggi di oggi del numero di Lucia', scelta('id="ge-p-pieno" data-cambia="ge-prova-ricalcola"', [['no', `Come adesso: ${numL.oggi} di ${numL.limite}`], ['si', `Già pieno: ${numL.limite} di ${numL.limite}`]], 'no'), 'ge-p-pieno') : ''}
      </div>
      <div id="ge-prova-righe">${htmlProva(w, opzioniProva())}</div>`;
    const pulsanti = [{ testo: 'Chiudi', chiudi: true }];
    if (a.stato === 'bozza') pulsanti.push({ testo: 'Attiva', classe: 'primario', fai: () => { chiediAttivazione(a); } });
    else if (a.bozza) pulsanti.push({ testo: 'Applica modifiche', classe: 'primario', fai: () => { R.azioni['ge-applica'](); } });
    R.modale({ titolo: 'Prova con un contatto finto', sottotitolo: R.esc(w.nome), classe: 'larga', corpo, pulsanti, senzaFuoco: true });
  }
  R.azioni['ge-prova'] = () => { const a = autoCorrente(); if (a) apriProva(a); };
  R.azioni['ge-prova-ricalcola'] = () => {
    const a = autoCorrente();
    const box = document.getElementById('ge-prova-righe');
    if (a && box) box.innerHTML = htmlProva(lavoro(a), opzioniProva());
  };

  /* ================= IMPOSTAZIONI ================= */
  R.stile('gestione-2', `
    .opzione input[type=radio] { width: 18px; height: 18px; accent-color: var(--verde); flex: none; margin: 0; }
    .opzione:has(input:checked) { background: var(--salvia); color: var(--salvia-t); box-shadow: inset 0 0 0 2px var(--verde); }
    .ge-perm.off { text-decoration: line-through; }
    .ge-fase-riga.wiz { grid-template-columns: 18px minmax(0, 1fr) 130px auto; }
    .ge-riga-invito { display: grid; grid-template-columns: minmax(0, 1fr) 230px 44px; gap: 10px; align-items: center; margin-bottom: 10px; }
    .ge-elenco-modificabile .riga { flex-wrap: wrap; }
    .ge-elenco-modificabile .riga .campo { flex: 1; min-width: 160px; width: auto; }
    .ge-riassegna { background: var(--campo); border-radius: var(--r-medio); padding: 14px 16px; margin-bottom: 10px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
    .ge-riassegna .testo { flex: 1; min-width: 220px; }
    .ge-riassegna .campo { background: var(--bianco); min-width: 200px; }
    @media (max-width: 767px) {
      .ge-fase-riga.wiz { grid-template-columns: 18px minmax(0, 1fr) auto; }
      .ge-riga-invito { grid-template-columns: minmax(0, 1fr) 44px; }
      .ge-riga-invito .campo:first-child { grid-column: 1 / -1; }
    }
  `);
  const SEZIONI = [
    { id: 'dati', nome: 'Dati dell\'azienda', descr: 'Nome, logo, colori del marchio e dati di contatto. Il sottodominio gratuito (inizioimpresa.rampant.it) lo sceglie l\'amministratore generale.' },
    { id: 'utenti', nome: 'Utenti e permessi' },
    { id: 'percorsi', nome: 'Percorsi di vendita' },
    { id: 'campi', nome: 'Campi personalizzati', descr: 'Campi di contatti e affari: testo, numero, valuta, data, scelta, scelta multipla, sì/no, file. Eliminare un campo mostra quanti dati si perdono e propone di nasconderlo.' },
    { id: 'etichette', nome: 'Etichette', descr: 'Le etichette condivise da tutta l\'azienda, con il loro colore. I collaboratori usano quelle esistenti.' },
    { id: 'libreria', nome: 'Libreria file', link: '#/marketing/libreria' },
    { id: 'whatsapp', nome: 'Numeri WhatsApp', link: '#/whatsapp' },
    { id: 'email', nome: 'Email', descr: 'Indirizzo e dominio di invio, firma, e l\'indirizzo per le risposte, che finiscono nella storia del contatto.' },
    { id: 'domini', nome: 'Domini', link: '#/marketing/domini' },
    { id: 'collegamenti', nome: 'Collegamenti esterni' },
    { id: 'meta', nome: 'Moduli Meta' },
    { id: 'claude', nome: 'Claude', solo: 'generale' },
    { id: 'avvisi', nome: 'Avvisi', descr: 'Quali avvisi ricevono amministratori e collaboratori. Ognuno sceglie i propri canali (campanella, WhatsApp, email) in «Il mio profilo».' },
    { id: 'motivi', nome: 'Motivi di perdita' },
    { id: 'orario', nome: 'Orario di invio e festivi' },
    { id: 'stop', nome: 'Parole STOP' },
    { id: 'prefisso', nome: 'Prefisso predefinito' },
    { id: 'cestino', nome: 'Cestino', link: '#/cestino' },
    { id: 'esportazione', nome: 'Esportazione dati', descr: 'Esportazione completa dei dati dell\'azienda in un file, con un link protetto valido 30 giorni. L\'esportazione viene scritta nel registro delle azioni.' },
    { id: 'registro', nome: 'Registro delle azioni' },
    { id: 'primo-avvio', nome: 'Primo avvio' },
    { id: 'aziende', nome: 'Le tue aziende', solo: 'generale' },
  ];
  const PERMESSI = [
    ['vedeTutti', 'Vede tutti i contatti e gli affari dell\'azienda', 'Spento: vede solo quelli di cui è responsabile o che segue.', 'Vede tutti'],
    ['esportare', 'Esportare i contatti', '', 'Esporta'],
    ['eliminare', 'Eliminare contatti e affari', 'Li mette nel Cestino; l\'eliminazione definitiva resta agli amministratori.', 'Elimina'],
    ['funnel', 'Modificare funnel, pagine e moduli', 'Senza questo permesso Marketing non compare nel suo menu.', 'Marketing'],
    ['automazioni', 'Modificare le automazioni', 'Senza questo permesso Automazioni non compare nel suo menu.', 'Automazioni'],
    ['reportTutti', 'Vedere i report di tutti', 'Spento: nei report vede solo i propri numeri.', 'Report di tutti'],
    ['inviiMultipli', 'Invii a più contatti', 'WhatsApp ed email a più destinatari insieme.', 'Invii a più contatti'],
  ];
  const emailValida = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const amministratoriAttivi = () => R.stato.utenti.filter((x) => ['generale', 'azienda'].includes(x.ruolo) && x.stato === 'attivo');

  function disegnaImpostazioni(p) {
    prepara();
    const u = R.utente();
    const visibile = (x) => (!x.solo || u.ruolo === x.solo) && (!x.amministratori || R.amministratore());
    const sezioni = SEZIONI.filter(visibile);
    const id = (p && p.sezione) || 'utenti';
    const s = SEZIONI.find((x) => x.id === id);
    let contenuto;
    if (!s || !visibile(s)) contenuto = '<div class="riquadro vuoto">Questa sezione non c\'è o non hai il permesso per aprirla. <a class="link verde" href="#/impostazioni">Torna alle impostazioni</a></div>';
    else if (s.link) contenuto = `<div class="riquadro"><h2 class="titolo-riquadro">${R.esc(s.nome)}</h2><p class="secondario">Questa parte ha una sua pagina.</p><a class="btn primario" href="${s.link}">Apri ${R.esc(s.nome)}</a></div>`;
    else contenuto = (SEZ[id] || sezioneNonPresente)(s);
    const tre = id === 'utenti' && u.ruolo === 'generale';
    const menu = `<nav class="ge-menu-imp nascondi-telefono" aria-label="Sezioni delle impostazioni">${sezioni.map((x) => `<a href="${x.link || '#/impostazioni/' + x.id}" class="${x.id === id ? 'attivo' : ''}" ${x.id === id ? 'aria-current="page"' : ''}><span>${R.esc(x.nome)}</span>${x.link ? R.icona('freccia', 14) : ''}</a>`).join('')}</nav>`;
    const menuTel = `<div class="solo-telefono gruppo-campo"><label class="etichetta-campo" for="ge-sez">Sezione</label>${scelta('id="ge-sez" data-cambia="ge-imp-sezione" style="background-color:#fff"', sezioni.map((x) => [x.id, x.nome + (x.link ? ' (apre la sua pagina)' : '')]), id)}</div>`;
    return `<div class="testata"><div><h1 class="titolo-pagina">Impostazioni</h1><div class="spiegazione">Le regole di ${R.esc(R.azienda().nome)}: valgono per tutti i suoi utenti. I tuoi dati personali e i tuoi avvisi sono in «Il mio profilo».</div></div></div>
      ${menuTel}
      <div class="ge-imp ${tre ? 'tre' : ''}">${menu}<div style="min-width:0">${contenuto}</div>${tre ? `<div class="ge-colonna-destra" style="min-width:0">${riquadroAziende()}</div>` : ''}</div>`;
  }
  R.rotta('/impostazioni', { menu: 'impostazioni', titolo: 'Impostazioni', disegna: () => disegnaImpostazioni({}) });
  R.rotta('/impostazioni/:sezione', { menu: 'impostazioni', titolo: 'Impostazioni', disegna: disegnaImpostazioni });
  R.azioni['ge-imp-sezione'] = (el) => { const s = SEZIONI.find((x) => x.id === el.value); if (s) R.vai(s.link || '#/impostazioni/' + s.id); };
  function sezioneNonPresente(s) {
    return `<div class="riquadro"><h2 class="titolo-riquadro">${R.esc(s.nome)}</h2><p>${R.esc(s.descr || '')}</p><div class="riquadro medio beige">Questa sezione non è nel prototipo: esisterà nel software vero.</div></div>`;
  }

  /* ---------- Utenti e permessi ---------- */
  function rigaUtente(u, i) {
    const n = R.stato.numeri.find((x) => x.utente === u.id);
    const wa = n ? 'WhatsApp ' + (numeroFermo(n) ? 'scollegato' : 'collegato') : 'nessun numero WhatsApp';
    let sotto, badge;
    if (u.stato === 'invitato') { sotto = `invito inviato ${R.giornoRelativo(u.invitoIl || R.adesso())} · ${u.email}`; badge = '<span class="etichetta pesca">In attesa</span>'; }
    else if (u.stato === 'disattivato') { sotto = `disattivato ${u.disattivatoIl ? R.giornoRelativo(u.disattivatoIl) : ''} · non può entrare`; badge = '<span class="etichetta">Disattivato</span>'; }
    else if (u.ruolo === 'generale') { sotto = 'vede tutto · entra in tutte le aziende'; badge = '<span class="etichetta scura">Amministratore</span>'; }
    else if (u.ruolo === 'azienda') { sotto = 'vede tutto in questa azienda · ' + wa; badge = '<span class="etichetta scura">Amministratore</span>'; }
    else { sotto = ((u.permessi || {}).vedeTutti ? 'vede tutti i contatti' : 'vede solo i suoi contatti') + ' · ' + wa; badge = '<span class="etichetta salvia">Collaboratore</span>'; }
    const cliccabile = u.ruolo !== 'generale' && u.stato !== 'disattivato';
    return `<div class="riga ${cliccabile ? 'cliccabile' : ''}" ${cliccabile ? `data-azione="ge-permessi" data-id="${u.id}" role="button" tabindex="0" aria-label="Permessi di ${R.esc(u.nome)}"` : ''}>
      <span class="ge-avatar ${['pesca', 'salvia', 'cielo', 'lavanda'][i % 4]}">${R.esc(u.iniziali)}</span>
      <div class="principale"><div class="titolo-riga">${R.esc(u.nome)}${u.id === R.utente().id ? ' <span class="secondario piccolo">(tu)</span>' : ''}</div><div class="sotto">${R.esc(sotto)}</div><div class="solo-telefono" style="margin-top:4px">${badge}</div></div>
      <span class="nascondi-telefono">${badge}</span>
      <button class="btn tondo secondario-campo" data-azione="ge-utente-menu" data-id="${u.id}" aria-label="Azioni per ${R.esc(u.nome)}">${R.icona('puntini')}</button>
    </div>`;
  }
  function chiVedeCosa() {
    const coll = R.stato.utenti.filter((u) => u.ruolo === 'collaboratore' && u.stato !== 'disattivato');
    const tuttiOn = coll.length && coll.every((u) => (u.permessi || {}).vedeTutti);
    return `<div class="riquadro scuro spazio-sopra">
      <h2 class="titolo-riquadro">Chi vede cosa</h2>
      <div class="riga-impostazione"><span>Amministratori: vedono e modificano tutto in questa azienda</span><span class="valore">Sempre</span></div>
      ${coll.map((u) => `<button class="ge-chi" data-azione="ge-permessi" data-id="${u.id}" aria-label="Cambia i permessi di ${R.esc(u.nome)}"><div class="grassetto">${R.esc(u.nome)}${u.stato === 'invitato' ? ' · invito in attesa' : ''}</div>${PERMESSI.map(([k, , , breve]) => { const on = !!(u.permessi || {})[k]; return `<span class="ge-perm ${on ? 'on' : 'off'}">${on ? '' : '<span class="nascosto-accessibile">non </span>'}${breve}</span>`; }).join('')}</button>`).join('') || '<p style="opacity:.8">Non ci sono collaboratori.</p>'}
      <div class="riga-impostazione"><span>Note: chi vede un cliente vede tutte le sue note</span><span class="valore">Sempre</span></div>
      <p class="piccolo" style="opacity:.75;margin:8px 4px 12px">In verde chiaro ciò che il collaboratore può fare. Tocca una persona per cambiare i suoi permessi.</p>
      ${coll.length ? `<button class="btn lime largo" data-azione="ge-vede-tutti" data-acceso="${tuttiOn ? '1' : ''}">${tuttiOn ? 'Spegni «Vede tutti» per tutti i collaboratori' : 'Accendi «Vede tutti» per tutti i collaboratori'}</button>` : ''}
    </div>`;
  }
  function sezUtenti() {
    return `<div class="riquadro"><div class="intestazione-riquadro"><h2 class="titolo-riquadro">Utenti di ${R.esc(R.azienda().nome)}</h2><button class="btn primario" data-azione="ge-invita">${R.icona('piu', 16)} Invita</button></div>
      <div class="elenco">${R.stato.utenti.map(rigaUtente).join('')}</div></div>${chiVedeCosa()}`;
  }
  R.azioni['ge-utente-menu'] = (el) => {
    const u = R.stato.utenti.find((x) => x.id === el.dataset.id);
    if (!u) return;
    const me = R.utente();
    const voci = [];
    if (u.ruolo !== 'generale' && u.stato !== 'disattivato') voci.push(`<button data-azione="ge-permessi" data-id="${u.id}">${R.icona('lucchetto')} Permessi e ruolo</button>`);
    if (u.stato === 'invitato') voci.push(`<button data-azione="ge-reinvita" data-id="${u.id}">${R.icona('invia')} Invia di nuovo l'invito</button>`, `<button data-azione="ge-annulla-invito" data-id="${u.id}">${R.icona('x')} Annulla l'invito</button>`);
    if (u.stato === 'attivo' && u.id !== me.id && u.ruolo !== 'generale') voci.push(`<button data-azione="ge-disattiva" data-id="${u.id}">${R.icona('persona')} Disattiva e riassegna il suo lavoro</button>`);
    if (u.stato === 'disattivato') voci.push(`<button data-azione="ge-riattiva-utente" data-id="${u.id}">${R.icona('ricarica')} Riattiva</button>`);
    if (!voci.length) voci.push(`<div class="titolo-tendina" style="max-width:260px">${u.id === me.id ? 'Sei tu: i tuoi dati sono in «Il mio profilo», dal cerchio con le iniziali.' : 'L\'amministratore generale non si modifica da qui.'}</div>`);
    R.tendina(el, voci.join(''));
  };
  R.azioni['ge-permessi'] = (el) => {
    R.chiudiTendina();
    const u = R.stato.utenti.find((x) => x.id === el.dataset.id);
    if (!u) return;
    if (u.ruolo === 'generale') { R.avviso('L\'amministratore generale vede e fa tutto: non ha permessi da cambiare'); return; }
    const perm = u.permessi || {};
    const n = R.stato.numeri.find((x) => x.utente === u.id);
    R.modale({
      titolo: `Permessi di ${R.esc(u.breve)}`,
      sottotitolo: `${R.esc(u.nome)} · ${R.esc(u.email)}. Ruolo e permessi valgono solo in ${R.esc(R.azienda().nome)}.`,
      proteggi: true,
      corpo: `${gruppo('Ruolo', scelta('id="ge-ruolo" name="ruolo"', [['collaboratore', 'Collaboratore'], ['azienda', 'Amministratore dell\'azienda (vede e modifica tutto)']], u.ruolo), 'ge-ruolo')}
        <div class="riga-impostazione"><span>Numero WhatsApp</span><span class="valore">${n ? R.esc(n.telefono + ' · ' + R.statoNumero(n.id)) : 'nessuno'}</span></div>
        <div class="etichetta-campo spazio-sopra">Cosa può fare da collaboratore</div>
        ${PERMESSI.map(([k, t, s]) => `<div class="riga-impostazione" style="border-radius:22px"><span>${t}${s ? `<br><span class="piccolo secondario">${s}</span>` : ''}</span>${interruttore(`name="${k}" aria-label="${R.esc(t)}"`, perm[k])}</div>`).join('')}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (u.ruolo === 'azienda' && v.ruolo !== 'azienda' && amministratoriAttivi().length <= 1) { R.erroreCampo(f, 'ruolo', 'È l\'ultimo amministratore: nomina prima un altro amministratore.'); return false; }
          u.permessi = Object.fromEntries(PERMESSI.map(([k]) => [k, !!v[k]]));
          const cambioRuolo = u.ruolo !== v.ruolo;
          u.ruolo = v.ruolo;
          registra(`Ha cambiato ${cambioRuolo ? 'ruolo e permessi' : 'i permessi'} di ${u.nome}`);
          R.salva(); R.aggiorna(); R.avviso(`Permessi di ${R.esc(u.breve)} salvati`);
        },
      }],
    });
  };
  R.azioni['ge-vede-tutti'] = (el) => {
    const coll = R.stato.utenti.filter((u) => u.ruolo === 'collaboratore' && u.stato !== 'disattivato');
    const accendi = !el.dataset.acceso;
    const nomi = elencoNomi(coll.map((u) => u.breve));
    R.modale({
      titolo: accendi ? 'Accendere «Vede tutti» per tutti i collaboratori?' : 'Spegnere «Vede tutti» per tutti i collaboratori?',
      sottotitolo: accendi ? `${R.esc(nomi)} vedranno tutti i contatti e gli affari dell'azienda, con chat, note e storia. Puoi spegnerlo per ognuno quando vuoi.` : `${R.esc(nomi)} vedranno solo i contatti e gli affari di cui sono responsabili o che seguono.`,
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: accendi ? 'Accendi per tutti' : 'Spegni per tutti', classe: 'primario', fai: () => {
          const prima = coll.map((u) => [u, !!(u.permessi || {}).vedeTutti]);
          coll.forEach((u) => { u.permessi = Object.assign({}, u.permessi, { vedeTutti: accendi }); });
          registra(accendi ? 'Ha acceso «Vede tutti» per tutti i collaboratori' : 'Ha spento «Vede tutti» per tutti i collaboratori');
          R.salva(); R.aggiorna();
          R.avviso(accendi ? '«Vede tutti» acceso per tutti i collaboratori' : '«Vede tutti» spento per tutti i collaboratori', { annulla: () => { prima.forEach(([u, v]) => { u.permessi.vedeTutti = v; }); R.salva(); R.aggiorna(); } });
        },
      }],
    });
  };
  R.azioni['ge-invita'] = () => {
    R.modale({
      titolo: 'Invita una persona',
      sottotitolo: `Riceve un'email per creare la password ed entra in ${R.esc(R.azienda().nome)}. Nel prototipo nessuna email parte davvero.`,
      proteggi: true,
      corpo: `<div class="griglia g-2">${gruppo('Email', '<input class="campo" id="ge-inv-email" name="email" type="email" placeholder="nome@esempio.it">', 'ge-inv-email')}${gruppo('Nome e cognome (facoltativo)', '<input class="campo" id="ge-inv-nome" name="nome">', 'ge-inv-nome')}</div>
        ${gruppo('Ruolo', scelta('id="ge-inv-ruolo" name="ruolo"', [['collaboratore', 'Collaboratore'], ['azienda', 'Amministratore dell\'azienda']], 'collaboratore'), 'ge-inv-ruolo')}
        <div class="riga-impostazione"><span>Vede tutti i contatti e gli affari<br><span class="piccolo secondario">Spento di base: vede solo quelli che gli assegni</span></span>${interruttore('name="vedeTutti" aria-label="Vede tutti i contatti"', false)}</div>
        <p class="piccolo secondario">Gli altri permessi partono spenti: li cambi quando vuoi da «Chi vede cosa».</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Invia l\'invito', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!emailValida(v.email)) { R.erroreCampo(f, 'email', 'Scrivi un\'email valida, per esempio nome@esempio.it.'); return false; }
          if (R.stato.utenti.some((x) => (x.email || '').toLowerCase() === v.email.toLowerCase())) { R.erroreCampo(f, 'email', 'Questa persona fa già parte dell\'azienda.'); return false; }
          if (!R.serveConnessione('l\'invito')) return false;
          const nome = v.nome || v.email.split('@')[0];
          const breve = R.maiuscola(nome.split(/\s+/)[0]);
          const colori = ['#7FB08F', '#8FB2D6', '#E7A98A', '#B79AD0'];
          R.stato.utenti.push({ id: R.id('u'), nome: R.maiuscola(nome), breve, iniziali: R.iniziali(nome) || breve.slice(0, 2).toUpperCase(), ruolo: v.ruolo, colore: colori[R.stato.utenti.length % 4], email: v.email, numeroAvvisi: '', assenza: '', stato: 'invitato', invitoIl: R.adesso(), avvisi: { software: true, whatsapp: false, email: true }, permessi: Object.fromEntries(PERMESSI.map(([k]) => [k, k === 'vedeTutti' ? !!v.vedeTutti : false])) });
          registra(`Ha invitato ${v.email} come ${v.ruolo === 'azienda' ? 'amministratore dell\'azienda' : 'collaboratore'}`);
          R.salva(); R.aggiorna(); R.avviso(`Invito inviato a ${R.esc(v.email)} (simulato)`);
        },
      }],
    });
  };
  R.azioni['ge-reinvita'] = (el) => {
    R.chiudiTendina();
    const u = R.stato.utenti.find((x) => x.id === el.dataset.id);
    if (!u || !R.serveConnessione('l\'invito')) return;
    u.invitoIl = R.adesso();
    R.salva(); R.aggiorna(); R.avviso(`Invito inviato di nuovo a ${R.esc(u.email)} (simulato)`);
  };
  R.azioni['ge-annulla-invito'] = (el) => {
    R.chiudiTendina();
    const u = R.stato.utenti.find((x) => x.id === el.dataset.id);
    if (!u || u.stato !== 'invitato') return;
    const i = R.stato.utenti.indexOf(u);
    R.stato.utenti.splice(i, 1);
    registra(`Ha annullato l'invito a ${u.email}`);
    R.salva(); R.aggiorna();
    R.avviso('Invito annullato: il link non funziona più', { annulla: () => { R.stato.utenti.splice(i, 0, u); R.salva(); R.aggiorna(); } });
  };
  function usaPersona(passi, uid) {
    return (passi || []).some((p) => (p.tipo === 'assegna' && (p.persone || []).includes(uid)) || (p.tipo === 'promemoria' && p.a === uid) || (p.tipo === 'avvisa' && p.chi === uid) || (p.tipo === 'se' && (usaPersona(p.si, uid) || usaPersona(p.no, uid))));
  }
  function togliPersona(passi, uid) {
    (passi || []).forEach((p) => {
      if (p.tipo === 'assegna') p.persone = (p.persone || []).filter((x) => x !== uid);
      if (p.tipo === 'promemoria' && p.a === uid) p.a = 'responsabile';
      if (p.tipo === 'avvisa' && p.chi === uid) p.chi = 'responsabile';
      if (p.tipo === 'se') { togliPersona(p.si, uid); togliPersona(p.no, uid); }
    });
  }
  R.azioni['ge-disattiva'] = (el) => {
    R.chiudiTendina();
    const u = R.stato.utenti.find((x) => x.id === el.dataset.id);
    if (!u) return;
    if (u.id === R.utente().id) { R.avviso('Non puoi disattivare te stesso'); return; }
    if (u.ruolo === 'generale') { R.avviso('L\'amministratore generale non si può disattivare'); return; }
    if (u.ruolo === 'azienda' && amministratoriAttivi().length <= 1) { R.avviso('È l\'ultimo amministratore: nomina prima un altro amministratore'); return; }
    const affari = R.stato.affari.filter((a) => !a.eliminato && a.responsabile === u.id && a.stato === 'aperto');
    const contatti = R.stato.contatti.filter((c) => !c.eliminato && c.responsabile === u.id);
    const attivita = R.stato.attivita.filter((t) => t.responsabile === u.id && !t.fatta && !t.annullata);
    const appuntamenti = R.stato.appuntamenti.filter((ap) => ap.persona === u.id && new Date(ap.quando) > new Date());
    const numeri = R.stato.numeri.filter((n) => n.utente === u.id);
    const autoUsate = R.stato.automazioni.filter((a) => !a.eliminata && (usaPersona(a.passi, u.id) || (a.bozza && usaPersona(a.bozza.passi, u.id))));
    const altri = R.stato.utenti.filter((x) => x.id !== u.id && x.stato === 'attivo');
    const predefinita = (altri.find((x) => x.ruolo === 'collaboratore') || altri[0] || {}).id;
    const persona = (name, testo) => scelta(`name="${name}" aria-label="${R.esc(testo)}"`, altri.map((x) => [x.id, 'Passa a ' + x.nome]), predefinita);
    const voce = (titolo, sotto, controllo) => `<div class="ge-riassegna"><div class="testo"><div class="grassetto">${titolo}</div><div class="piccolo secondario">${sotto}</div></div>${controllo || ''}</div>`;
    R.modale({
      titolo: `Disattivare ${R.esc(u.nome)}?`,
      sottotitolo: `Non potrà più entrare in ${R.esc(R.azienda().nome)}; le altre aziende in cui lavora non cambiano e la storia conserva il suo nome. Scegli a chi passare il suo lavoro.`,
      classe: 'larga',
      proteggi: true,
      corpo: voce(`Affari aperti (${affari.length}) e contatti seguiti (${contatti.length})`, 'Il nuovo responsabile riceve un avviso. I nuovi messaggi ai contatti partono dal suo numero o da quello aziendale.', persona('affari', 'A chi passare affari e contatti'))
        + voce(`Attività da fare (${attivita.length})`, 'Promemoria e cose da fare ancora aperti.', persona('attivita', 'A chi passare le attività'))
        + voce(`Appuntamenti futuri (${appuntamenti.length})`, '<label style="display:flex;gap:8px;align-items:center;margin-top:6px"><input type="checkbox" name="avvisaClienti" style="width:18px;height:18px;accent-color:var(--verde)"> Avvisa i clienti del cambio di persona (facoltativo)</label>', persona('appuntamenti', 'A chi passare gli appuntamenti'))
        + voce(`Automazioni, moduli e turni di assegnazione (${autoUsate.length})`, autoUsate.length ? `La togliamo da: ${R.esc(autoUsate.map((a) => a.nome).join(', '))}, e dai turni dei moduli.` : 'La togliamo dai turni di assegnazione dei moduli.')
        + voce('Link di prenotazione', 'Viene disattivato: chi lo apre vede un messaggio con il numero aziendale.')
        + voce(`Numeri WhatsApp (${numeri.length})`, numeri.length ? `${R.esc(numeri.map((n) => n.telefono).join(', '))} viene scollegato da questa azienda.` : 'Non ha numeri collegati.')
        + voce('Google Calendar', 'Smette di essere usato da questa azienda; resta collegato se lavora in altre aziende.'),
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Disattiva e riassegna', classe: 'rosso', fai: (f) => {
          const v = R.valori(f);
          if (!altri.length) { R.avviso('Non c\'è nessun altro utente attivo a cui passare il lavoro'); return false; }
          const nuovo = R.utenteDa(v.affari);
          const numNuovo = R.stato.numeri.find((n) => n.utente === v.affari) || predefinito();
          affari.forEach((a) => {
            a.responsabile = v.affari;
            if (R.registraStoria) R.registraStoria(a.contatto, a.id, 'modifica', `Responsabile: ${u.breve} → ${nuovo.breve} (${u.breve} disattivato da ${R.utente().breve})`);
          });
          contatti.forEach((c) => { c.responsabile = v.affari; if (numeri.some((n) => n.id === c.numeroUsato) && numNuovo) c.numeroUsato = numNuovo.id; });
          attivita.forEach((t) => { t.responsabile = v.attivita; });
          appuntamenti.forEach((ap) => { ap.persona = v.appuntamenti; });
          R.stato.automazioni.forEach((a) => { togliPersona(a.passi, u.id); if (a.bozza) togliPersona(a.bozza.passi, u.id); });
          numeri.forEach((n) => { R.stato.numeri = R.stato.numeri.filter((x) => x.id !== n.id); ge().archivioNumeri.push(n); });
          u.stato = 'disattivato'; u.disattivatoIl = R.adesso();
          R.notifica(`Ti sono stati assegnati ${plurale(affari.length, 'affare', 'affari')} e ${plurale(attivita.length, 'attività', 'attività')} di <b>${R.esc(u.breve)}</b>`, '#/affari', v.affari);
          registra(`Ha disattivato ${u.nome} e riassegnato il suo lavoro`);
          allineaSimulazione();
          R.salva(); R.aggiorna();
          R.avviso(`${R.esc(u.breve)} non può più entrare · lavoro riassegnato${v.avvisaClienti && appuntamenti.length ? ' · clienti avvisati (simulato)' : ''}`);
        },
      }],
    });
  };
  R.azioni['ge-riattiva-utente'] = (el) => {
    R.chiudiTendina();
    const u = R.stato.utenti.find((x) => x.id === el.dataset.id);
    if (!u) return;
    R.modale({
      titolo: `Riattivare ${R.esc(u.nome)}?`,
      sottotitolo: 'Può entrare di nuovo con la sua password. Affari, attività e numero WhatsApp non tornano da soli: riassegnali dagli Affari e ricollega il suo numero dalla pagina WhatsApp.',
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Riattiva', classe: 'primario', fai: () => { u.stato = 'attivo'; delete u.disattivatoIl; registra(`Ha riattivato ${u.nome}`); R.salva(); R.aggiorna(); R.avviso(`${R.esc(u.breve)} può di nuovo entrare`); } }],
    });
  };

  /* ---------- Le tue aziende ---------- */
  function rigaAzienda(a) {
    const qui = a.id === R.stato.aziendaAttiva;
    const pa = a.primoAvvio;
    const parti = [qui ? 'sei qui' : (a.tipo === 'cliente' ? 'cliente · ' : '') + plurale(a.utenti || 0, 'utente', 'utenti')];
    if (a.stato === 'sospesa') parti.push('sospesa' + (a.sospesaIl ? ' dal ' + R.dataBreve(a.sospesaIl) : ''));
    if (a.stato === 'chiusa') parti.push(`si può riaprire fino al ${R.dataBreve(a.eliminaIl)}`);
    if (pa && !pa.completato) parti.push(`primo avvio al passo ${pa.passo} di 8`);
    if (a.accordoAccettato === false && a.stato !== 'chiusa') parti.push('accordo privacy da accettare');
    const badge = a.stato === 'sospesa' ? '<span class="etichetta pesca">Sospesa</span>' : a.stato === 'chiusa' ? '<span class="etichetta errore">Chiusa</span>' : '';
    return `<div class="ge-azienda ${qui ? 'qui' : ''} ${a.stato === 'chiusa' ? 'chiusa' : ''}">
      <span class="quadratino" style="background:${R.esc(a.colore)}">${R.esc(sigla(a))}</span>
      <div class="principale"><div class="titolo-riga">${R.esc(a.nome)}</div><div class="sotto">${R.esc(parti.join(' · '))}</div></div>
      ${badge}
      ${!qui && a.stato !== 'chiusa' ? `<button class="link" style="min-height:44px;padding:0 4px" data-azione="ge-entra" data-id="${a.id}">Entra</button>` : ''}
      ${!qui ? `<button class="btn tondo" style="background:var(--bianco)" data-azione="ge-azienda-menu" data-id="${a.id}" aria-label="Azioni per ${R.esc(a.nome)}">${R.icona('puntini')}</button>` : ''}
    </div>`;
  }
  function riquadroAziende() {
    return `<div class="riquadro">
      <h2 class="titolo-riquadro" style="margin-bottom:6px">Le tue aziende</h2>
      <p class="secondario" style="font-size:13px;margin:0 0 14px">Ogni cliente ha il suo spazio separato, con i suoi utenti. Tu puoi entrare in tutte.</p>
      ${R.stato.aziende.map(rigaAzienda).join('')}
      <a class="btn primario largo spazio-sopra" href="#/aziende/nuova">${R.icona('piu')} Nuova azienda per un cliente</a>
      <button class="btn lavanda largo" style="margin-top:10px" data-azione="ge-copia-aziende">Copia funnel e automazioni da un'azienda all'altra</button>
    </div>`;
  }
  function sezAziende() {
    return riquadroAziende() + `<div class="riquadro medio beige spazio-sopra"><b>Cosa succede negli stati</b><ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--testo-3)">
      <li><b>Sospesa</b>: entra solo l'amministratore generale; le pagine pubbliche mostrano un messaggio neutro; automazioni in pausa; quello che arriva si salva ma non parte nulla.</li>
      <li><b>Chiusa</b>: prima mandiamo l'esportazione completa all'amministratore dell'azienda (link valido 30 giorni); numeri e domini scollegati; si può riaprire entro 90 giorni, poi i dati si eliminano (con avviso 7 giorni prima).</li></ul></div>`;
  }
  R.azioni['ge-azienda-menu'] = (el) => {
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    const voci = [];
    if (a.primoAvvio && !a.primoAvvio.completato) voci.push(`<a href="#/aziende/nuova?id=${a.id}">${R.icona('bussola')} Riprendi il primo avvio</a>`);
    if (a.primoAvvio && a.primoAvvio.completato) voci.push(`<a href="#/aziende/nuova?id=${a.id}&passo=fine">${R.icona('bussola')} Riepilogo del primo avvio</a>`);
    if (a.accordoAccettato === false && a.stato !== 'chiusa') voci.push(`<button data-azione="ge-invita-cliente" data-id="${a.id}">${R.icona('invia')} Invita il cliente</button>`);
    if (a.stato === 'attiva') voci.push(`<button data-azione="ge-sospendi" data-id="${a.id}">${R.icona('pausa')} Sospendi</button>`);
    if (a.stato === 'sospesa') voci.push(`<button data-azione="ge-riattiva-azienda" data-id="${a.id}">${R.icona('play')} Riattiva</button>`);
    if (a.stato !== 'chiusa') voci.push(`<button data-azione="ge-copia-aziende" data-a="${a.id}">${R.icona('copia')} Copia funnel e automazioni qui</button>`, `<button data-azione="ge-chiudi-azienda" data-id="${a.id}">${R.icona('lucchetto')} Chiudi l'azienda</button>`);
    if (a.stato === 'chiusa') voci.push(`<button data-azione="ge-riapri-azienda" data-id="${a.id}">${R.icona('ricarica')} Riapri</button>`);
    R.tendina(el, `<div class="titolo-tendina">${R.esc(a.nome)}</div>${voci.join('')}`);
  };
  R.azioni['ge-entra'] = (el) => {
    R.chiudiTendina();
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    if (a.id === R.stato.aziendaAttiva) { R.avviso('Sei già in questa azienda'); return; }
    R.modale({
      titolo: `Anteprima di ${R.esc(a.nome)}`,
      sottotitolo: 'Nel prototipo si lavora solo dentro Inizio Impresa: questa è un\'anteprima vuota di come la vedresti entrando. Nel software vero entri con un clic e il selettore in alto mostra la nuova azienda.',
      classe: 'larga',
      corpo: `<div style="background:var(--sfondo);border-radius:24px;padding:18px">
          <div class="riga-flex"><span class="quadratino" style="background:${R.esc(a.colore)};color:#fff">${R.esc(sigla(a))}</span><b>${R.esc(a.nome)}</b>${a.stato === 'sospesa' ? '<span class="etichetta pesca">Sospesa: entri solo tu</span>' : ''}${a.accordoAccettato === false ? '<span class="etichetta pesca">Accordo privacy da accettare: niente invii né pubblicazioni</span>' : ''}</div>
          <div style="font-family:var(--titoli);font-weight:700;font-size:28px;letter-spacing:-0.03em;line-height:1.1;margin:16px 0">Buongiorno ${R.esc(R.utente().breve)},<br>oggi hai 0 nuovi contatti.</div>
          <div class="griglia g-3"><div class="riquadro verde medio"><div class="nota">Contatti del mese</div><div class="numero-medio">0</div></div><div class="riquadro medio"><div class="nota secondario">Affari aperti</div><div class="numero-medio">0</div></div><div class="riquadro pesca medio"><div class="nota">Mai richiamati</div><div class="numero-medio">0</div></div></div>
          <div class="riquadro medio spazio-sopra vuoto" style="padding:18px">Nessun contatto ancora. Pubblica la prima pagina con il modulo: i contatti arriveranno qui.</div>
        </div>`,
      pulsanti: [{ testo: 'Torna a Inizio Impresa', classe: 'primario', chiudi: true }],
    });
  };
  R.azioni['ge-sospendi'] = (el) => {
    R.chiudiTendina();
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    if (a.id === R.stato.aziendaAttiva) { R.avviso('Non puoi sospendere l\'azienda in cui ti trovi'); return; }
    R.modale({
      titolo: `Sospendere ${R.esc(a.nome)}?`,
      sottotitolo: 'Entra solo l\'amministratore generale. Le pagine pubbliche mostrano un messaggio neutro e le automazioni vanno in pausa. Quello che arriva (moduli, WhatsApp, contatti di Meta) si salva, ma non parte nulla.',
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Sospendi', classe: 'rosso', fai: () => { a.stato = 'sospesa'; a.sospesaIl = R.adesso(); registra(`Ha sospeso l'azienda ${a.nome}`); R.salva(); R.aggiorna(); R.avviso(`${R.esc(a.nome)} sospesa`); } }],
    });
  };
  R.azioni['ge-riattiva-azienda'] = (el) => {
    R.chiudiTendina();
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    R.modale({
      titolo: `Riattivare ${R.esc(a.nome)}?`,
      sottotitolo: 'Durante la sospensione sono arrivati 3 contatti e 5 messaggi WhatsApp (simulati): sono già salvati. Scegli cosa fare con i messaggi automatici rimasti fermi.',
      corpo: `<button class="opzione" data-azione="ge-riattiva-scelta" data-id="${a.id}" data-modo="tutti"><span class="principale"><b>Riprendi</b><span class="sotto">Le automazioni ripartono e mandano anche i messaggi rimasti fermi.</span></span>${R.icona('destra')}</button>
        <button class="opzione" data-azione="ge-riattiva-scelta" data-id="${a.id}" data-modo="salta"><span class="principale"><b>Riprendi saltando i messaggi più vecchi di 24 ore</b><span class="sotto">Così nessuno riceve un benvenuto arrivato con giorni di ritardo.</span></span>${R.icona('destra')}</button>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }],
    });
  };
  R.azioni['ge-riattiva-scelta'] = (el) => {
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    R.chiudiModale(true);
    if (!a) return;
    a.stato = 'attiva'; delete a.sospesaIl;
    registra(`Ha riattivato l'azienda ${a.nome}${el.dataset.modo === 'salta' ? ' saltando i messaggi più vecchi di 24 ore' : ''}`);
    R.salva(); R.aggiorna();
    R.avviso(`${R.esc(a.nome)} di nuovo attiva${el.dataset.modo === 'salta' ? ' · saltati i messaggi più vecchi di 24 ore' : ''}`);
  };
  R.azioni['ge-chiudi-azienda'] = (el) => {
    R.chiudiTendina();
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    if (a.id === R.stato.aziendaAttiva) { R.avviso('Non puoi chiudere l\'azienda in cui ti trovi'); return; }
    const fine = new Date(); fine.setDate(fine.getDate() + 90);
    R.modale({
      titolo: `Chiudere ${R.esc(a.nome)}?`,
      sottotitolo: 'Prima di chiudere mandiamo all\'amministratore dell\'azienda l\'esportazione completa dei dati, con un link protetto valido 30 giorni.',
      corpo: `<ul style="margin:0 0 14px;padding-left:18px;line-height:1.7">
          <li>Nessuno potrà più entrare, tranne te.</li>
          <li>I numeri WhatsApp e i domini vengono scollegati.</li>
          <li>Puoi riaprirla entro 90 giorni, fino al ${R.esc(R.data(fine.toISOString()))}. Alla riapertura numeri e domini si ricollegano a mano.</li>
          <li>Dopo 90 giorni i dati si eliminano per sempre; ti avvisiamo 7 giorni prima.</li></ul>
        <label class="riga-impostazione" style="border-radius:22px"><span>Ho capito che dopo 90 giorni i dati di ${R.esc(a.nome)} si eliminano per sempre</span><input type="checkbox" name="capito" style="width:20px;height:20px;accent-color:var(--verde)"></label>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Esporta e chiudi', classe: 'rosso', fai: (f) => {
          if (!R.valori(f).capito) { R.erroreCampo(f, 'capito', 'Spunta la casella per confermare.'); return false; }
          if (!R.serveConnessione('la chiusura')) return false;
          a.stato = 'chiusa'; a.chiusaIl = R.adesso(); a.eliminaIl = fine.toISOString();
          registra(`Ha chiuso l'azienda ${a.nome} (esportazione inviata all'amministratore dell'azienda)`);
          R.salva(); R.aggiorna(); R.avviso(`${R.esc(a.nome)} chiusa · esportazione inviata (simulato)`);
        },
      }],
    });
  };
  R.azioni['ge-riapri-azienda'] = (el) => {
    R.chiudiTendina();
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    R.modale({
      titolo: `Riaprire ${R.esc(a.nome)}?`,
      sottotitolo: 'Torna attiva con tutti i suoi dati. Numeri WhatsApp e domini restano scollegati: si ricollegano a mano.',
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Riapri', classe: 'primario', fai: () => { a.stato = 'attiva'; delete a.chiusaIl; delete a.eliminaIl; registra(`Ha riaperto l'azienda ${a.nome}`); R.salva(); R.aggiorna(); R.avviso(`${R.esc(a.nome)} riaperta`); } }],
    });
  };
  function elencoCopia(da, autoScelta) {
    if (da !== 'a1') return '<div class="riquadro medio beige">Nel prototipo funnel e automazioni ci sono solo in Inizio Impresa: scegli Inizio Impresa in «Da».</div>';
    const casella = (name, on) => `<input type="checkbox" name="${name}" ${on ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--verde)">`;
    return `<div class="etichetta-campo">Funnel, con pagine e moduli</div>${(R.stato.funnel || []).map((fu) => `<label class="riga-impostazione"><span>${R.esc(fu.nome)} <span class="secondario piccolo">· ${fu.stato === 'online' ? 'online' : 'bozza'}</span></span>${casella('f_' + fu.id, false)}</label>`).join('') || '<p class="secondario">Nessun funnel.</p>'}
      <div class="etichetta-campo spazio-sopra">Automazioni</div>${R.stato.automazioni.filter((a) => !a.eliminata).map((a) => `<label class="riga-impostazione"><span>${R.esc(a.nome)}</span>${casella('a_' + a.id, a.id === autoScelta)}</label>`).join('')}`;
  }
  R.azioni['ge-copia-aziende'] = (el) => {
    R.chiudiTendina();
    if (!generale()) { R.avviso('Solo l\'amministratore generale copia tra aziende'); return; }
    const aperte = R.stato.aziende.filter((a) => a.stato !== 'chiusa');
    const verso = el.dataset.a || (aperte.find((a) => a.id !== 'a1') || {}).id;
    const autoScelta = el.dataset.auto;
    R.modale({
      titolo: 'Copia funnel e automazioni',
      sottotitolo: 'La copia è indipendente dall\'originale. Si copia tutta la catena: pagine, moduli e automazioni collegati. Statistiche, versioni e prove A/B non si copiano.',
      classe: 'larga',
      corpo: `<div class="griglia g-2">${gruppo('Da', scelta('id="ge-cp-da" name="da" data-cambia="ge-copia-da"', aperte.map((a) => [a.id, a.nome]), 'a1'), 'ge-cp-da')}${gruppo('A', scelta('id="ge-cp-a" name="a"', aperte.map((a) => [a.id, a.nome]), verso), 'ge-cp-a')}</div>
        <div id="ge-cp-elenco">${elencoCopia('a1', autoScelta)}</div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Copia', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (v.da === v.a) { R.erroreCampo(f, 'a', 'Scegli un\'azienda diversa da quella di partenza.'); return false; }
          const funnel = (R.stato.funnel || []).filter((x) => v['f_' + x.id]);
          const autos = R.stato.automazioni.filter((x) => v['a_' + x.id]);
          if (!funnel.length && !autos.length) { R.avviso('Scegli almeno un funnel o un\'automazione da copiare'); return false; }
          if (!R.serveConnessione('la copia')) return false;
          const dest = R.stato.aziende.find((x) => x.id === v.a);
          const daSistemare = [
            'Percorsi e fasi: «Finanza agevolata» non esiste in ' + dest.nome + ': abbinalo a un percorso esistente o crealo.',
            ...autos.map((x) => trovaPrimo(x.passi, 'assegna')).filter(Boolean).map((p) => `Persone: «${titoloPasso(p)}» va sostituito con le persone di ${dest.nome}.`).filter((t, i, arr) => arr.indexOf(t) === i),
            autos.length ? 'Numeri WhatsApp: scegli da quale numero partono i messaggi.' : null,
            funnel.length ? `Domini: le pagine vanno su ${dest.sottodominio}.rampant.it finché non scegli un dominio.` : null,
          ].filter(Boolean);
          registra(`Ha copiato ${plurale(funnel.length, 'funnel', 'funnel')} e ${plurale(autos.length, 'automazione', 'automazioni')} in ${dest.nome}`);
          R.salva();
          R.modale({
            titolo: `Copiati in ${R.esc(dest.nome)}`,
            sottotitolo: `${plurale(funnel.length, 'funnel nasce', 'funnel nascono')} in Bozza, ${plurale(autos.length, 'automazione nasce Disattivata', 'automazioni nascono Disattivate')}. Campi, etichette e file della libreria sono stati copiati.`,
            corpo: `<div class="etichetta-campo">Da sistemare</div>${daSistemare.map((t) => `<div class="riga-impostazione" style="border-radius:22px"><span>${R.esc(t)}</span></div>`).join('')}<p class="piccolo secondario">Una seconda copia si chiama «(copia 2)». Nel prototipo la copia è simulata: nessun dato viene creato nell'altra azienda.</p>`,
            pulsanti: [{ testo: 'Ho capito', classe: 'primario', chiudi: true }],
          });
        },
      }],
    });
  };
  R.azioni['ge-copia-da'] = (el) => { const box = document.getElementById('ge-cp-elenco'); if (box) box.innerHTML = elencoCopia(el.value); };

  /* ---------- Percorsi di vendita ---------- */
  function sezPercorsi() {
    const pid = R.stato.filtri.impPercorso && R.percorso(R.stato.filtri.impPercorso) ? R.stato.filtri.impPercorso : R.stato.percorsi[0].id;
    const p = R.percorso(pid);
    const conta = (f) => R.stato.affari.filter((a) => !a.eliminato && a.percorso === p.id && a.fase === f.id).length;
    const aperte = p.fasi.filter((f) => !f.tipo);
    const riga = (f, i) => {
      const au = f.automazione ? R.stato.automazioni.find((a) => a.id === f.automazione && !a.eliminata) : null;
      return `<div class="ge-fase-riga">
        <span class="ge-pallino ${f.colore}"></span>
        <div style="min-width:0"><input class="campo" value="${R.esc(f.nome)}" aria-label="Nome della fase ${i + 1}" data-cambia="ge-fase-nome" data-p="${p.id}" data-f="${f.id}">${au ? `<div class="piccolo secondario" style="margin:4px 0 0 10px">Avvia: <a class="link verde" href="#/automazioni/${au.id}">${R.esc(au.nome)}</a></div>` : ''}</div>
        <div class="ge-colore-sel">${scelta(`aria-label="Colore della fase ${R.esc(f.nome)}" data-cambia="ge-fase-colore" data-p="${p.id}" data-f="${f.id}"`, PASTELLI, f.colore)}</div>
        <span class="secondario piccolo ge-conto">${plurale(conta(f), 'affare', 'affari')}</span>
        <div class="riga-flex" style="gap:6px;flex-wrap:nowrap"><button class="btn tondo secondario-campo" data-azione="ge-fase-sposta" data-p="${p.id}" data-f="${f.id}" data-verso="su" aria-label="Sposta su ${R.esc(f.nome)}">${R.icona('su', 16)}</button><button class="btn tondo secondario-campo" data-azione="ge-fase-sposta" data-p="${p.id}" data-f="${f.id}" data-verso="giu" aria-label="Sposta giù ${R.esc(f.nome)}">${R.icona('giu', 16)}</button><button class="btn tondo pesca" data-azione="ge-fase-elimina" data-p="${p.id}" data-f="${f.id}" aria-label="Elimina ${R.esc(f.nome)}">${R.icona('cestino', 16)}</button></div>
      </div>`;
    };
    const finale = (f) => `<div class="ge-fase-riga">
        <span class="ge-pallino ${f.colore}"></span>
        <div><input class="campo" value="${R.esc(f.nome)}" aria-label="Nome della fase ${f.tipo === 'vinto' ? 'vinta' : 'persa'}" data-cambia="ge-fase-nome" data-p="${p.id}" data-f="${f.id}"></div>
        <span class="etichetta ${f.tipo === 'vinto' ? 'salvia' : 'errore'} ge-colore-sel" style="justify-self:start">${f.tipo === 'vinto' ? 'Finale positiva: vinto' : 'Finale negativa: perso'}</span>
        <span class="secondario piccolo ge-conto">${plurale(conta(f), 'affare', 'affari')}</span><span></span></div>`;
    return `<div class="riquadro">
      <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Percorsi di vendita</h2><button class="btn secondario-campo" data-azione="ge-nuovo-percorso">${R.icona('piu', 16)} Nuovo percorso</button></div>
      <div class="selettore su-bianco spazio-sotto" role="tablist">${R.stato.percorsi.map((x) => `<button class="${x.id === p.id ? 'attivo' : ''}" role="tab" data-azione="ge-imp-percorso" data-id="${x.id}">${R.esc(x.nome)}</button>`).join('')}</div>
      ${gruppo('Nome del percorso', `<input class="campo" id="ge-per-nome" value="${R.esc(p.nome)}" data-cambia="ge-percorso-nome" data-p="${p.id}">`, 'ge-per-nome')}
      <div class="etichetta-campo">Fasi, in ordine</div>
      <div>${aperte.map(riga).join('')}</div>
      <button class="ge-aggiungi spazio-sopra" data-azione="ge-fase-aggiungi" data-p="${p.id}">+ Aggiungi fase</button>
      <div class="etichetta-campo spazio-sopra">Fasi finali (il nome della fase vinta lo scegli tu)</div>
      ${p.fasi.filter((f) => f.tipo).map(finale).join('')}
      <p class="piccolo secondario spazio-sopra">Rinominare una fase non tocca gli affari. Per eliminare una fase con affari devi scegliere dove spostarli.</p>
    </div>`;
  }
  const fasePer = (el) => { const p = R.percorso(el.dataset.p); return p ? { p, f: p.fasi.find((x) => x.id === el.dataset.f) } : {}; };
  R.azioni['ge-imp-percorso'] = (el) => { R.stato.filtri.impPercorso = el.dataset.id; R.salva(); R.aggiorna(); };
  R.azioni['ge-percorso-nome'] = (el) => {
    const p = R.percorso(el.dataset.p);
    if (!p) return;
    if (!el.value.trim()) { el.value = p.nome; R.avviso('Il percorso deve avere un nome'); return; }
    p.nome = el.value.trim(); registra(`Ha rinominato il percorso in «${p.nome}»`); R.salva(); R.aggiorna(); R.avviso('Nome del percorso salvato');
  };
  R.azioni['ge-fase-nome'] = (el) => {
    const { f } = fasePer(el);
    if (!f) return;
    if (!el.value.trim()) { el.value = f.nome; R.avviso('La fase deve avere un nome'); return; }
    const prima = f.nome;
    f.nome = el.value.trim();
    registra(`Ha rinominato la fase «${prima}» in «${f.nome}»`);
    R.salva(); R.avviso('Fase rinominata: gli affari restano dove sono');
  };
  R.azioni['ge-fase-colore'] = (el) => { const { f } = fasePer(el); if (!f) return; f.colore = el.value; R.salva(); R.aggiorna(); };
  R.azioni['ge-fase-sposta'] = (el) => {
    const { p, f } = fasePer(el);
    if (!f) return;
    const aperte = p.fasi.filter((x) => !x.tipo);
    const i = aperte.indexOf(f);
    const j = i + (el.dataset.verso === 'su' ? -1 : 1);
    if (j < 0 || j >= aperte.length) { R.avviso(el.dataset.verso === 'su' ? 'È già la prima fase' : 'È già l\'ultima fase prima di quelle finali'); return; }
    const a = p.fasi.indexOf(f), b = p.fasi.indexOf(aperte[j]);
    [p.fasi[a], p.fasi[b]] = [p.fasi[b], p.fasi[a]];
    R.salva(); R.aggiorna();
    R.avviso('Fase spostata', { annulla: () => { [p.fasi[a], p.fasi[b]] = [p.fasi[b], p.fasi[a]]; R.salva(); R.aggiorna(); } });
  };
  R.azioni['ge-fase-aggiungi'] = (el) => {
    const p = R.percorso(el.dataset.p);
    if (!p) return;
    const primaFinale = p.fasi.findIndex((x) => x.tipo);
    const n = p.fasi.filter((x) => !x.tipo).length;
    const f = { id: R.id('f'), nome: 'Nuova fase', colore: PASTELLI[n % 4][0] };
    p.fasi.splice(primaFinale < 0 ? p.fasi.length : primaFinale, 0, f);
    registra(`Ha aggiunto una fase al percorso «${p.nome}»`);
    R.salva(); R.aggiorna();
    R.avviso('Fase aggiunta prima delle fasi finali: scrivi il suo nome');
  };
  R.azioni['ge-fase-elimina'] = (el) => {
    const { p, f } = fasePer(el);
    if (!f) return;
    const affari = R.stato.affari.filter((a) => !a.eliminato && a.percorso === p.id && a.fase === f.id);
    const aperte = p.fasi.filter((x) => !x.tipo);
    if (aperte.length <= 1) { R.avviso('Serve almeno una fase oltre a quelle finali'); return; }
    const auto = R.stato.automazioni.filter((a) => !a.eliminata && a.quando && a.quando.tipo === 'fase' && a.quando.fase === f.id);
    const togli = (dest) => {
      const i = p.fasi.indexOf(f);
      p.fasi.splice(i, 1);
      affari.forEach((a) => { a.fase = dest; a.faseCambiata = R.adesso(); });
      registra(`Ha eliminato la fase «${f.nome}» dal percorso «${p.nome}»`);
      R.salva(); R.aggiorna();
      return i;
    };
    if (!affari.length) {
      const i = togli(null);
      R.avviso(`Fase «${R.esc(f.nome)}» eliminata`, { annulla: () => { p.fasi.splice(i, 0, f); R.salva(); R.aggiorna(); } });
      return;
    }
    R.modale({
      titolo: `Eliminare la fase «${R.esc(f.nome)}»?`,
      sottotitolo: `Ci sono ${plurale(affari.length, 'affare', 'affari')} in questa fase: scegli dove spostarli. ${auto.length ? `Attenzione: la fase avvia «${R.esc(auto.map((a) => a.nome).join(', '))}», che resterà senza fase di partenza.` : ''}`,
      classe: 'stretta',
      corpo: gruppo('Sposta gli affari in', scelta('id="ge-fase-dest" name="dest"', [['', 'Scegli una fase']].concat(aperte.filter((x) => x !== f).map((x) => [x.id, x.nome])), ''), 'ge-fase-dest'),
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Sposta ed elimina', classe: 'rosso', fai: (fin) => {
          const v = R.valori(fin);
          if (!v.dest) { R.erroreCampo(fin, 'dest', 'Scegli dove spostare gli affari: è obbligatorio.'); return false; }
          togli(v.dest);
          R.avviso(`Fase eliminata · ${plurale(affari.length, 'affare spostato', 'affari spostati')} in «${R.esc(R.fase(p.id, v.dest).nome)}»`);
        },
      }],
    });
  };
  R.azioni['ge-nuovo-percorso'] = () => {
    R.modale({
      titolo: 'Nuovo percorso di vendita',
      sottotitolo: 'Ogni percorso ha le sue fasi e compare come scelta in Affari.',
      classe: 'stretta',
      corpo: `${gruppo('Nome', '<input class="campo" id="ge-np-nome" name="nome" placeholder="es. Consulenze private">', 'ge-np-nome')}${gruppo('Parti dalle fasi di', scelta('id="ge-np-mod" name="modello"', Object.entries(MODELLI_SETTORE).map(([k, m]) => [k, m.nome]), 'vuoto'), 'ge-np-mod')}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Crea', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome del percorso.'); return false; }
          if (R.stato.percorsi.some((x) => x.nome.toLowerCase() === v.nome.toLowerCase())) { R.erroreCampo(f, 'nome', 'Esiste già un percorso con questo nome.'); return false; }
          const m = MODELLI_SETTORE[v.modello];
          const p = { id: R.id('p'), nome: v.nome, fasi: m.fasi.map(([n, c]) => ({ id: R.id('f'), nome: n, colore: c })).concat([{ id: R.id('f'), nome: m.vinta, colore: 'verde', tipo: 'vinto' }, { id: R.id('f'), nome: 'Perso', colore: 'errore', tipo: 'perso' }]) };
          R.stato.percorsi.push(p);
          R.stato.filtri.impPercorso = p.id;
          registra(`Ha creato il percorso «${p.nome}»`);
          R.salva(); R.aggiorna(); R.avviso('Percorso creato');
        },
      }],
    });
  };

  /* ---------- Collegamenti esterni ---------- */
  function statoCollegamenti() {
    const num = R.stato.numeri;
    const fermo = num.find((n) => n.statoA === 'scollegato');
    const A = fermo ? ['rosso', `Il ${nomeNumero(fermo)} è scollegato da WhatsApp: ricollegalo con il QR`] : num.some((n) => n.statoA === 'fermo') ? ['giallo', 'Non risponde: invia il servizio B sullo stesso numero, non devi fare nulla'] : ['verde', `${plurale(num.length, 'numero collegato', 'numeri collegati')}, invia normalmente`];
    const B = num.some((n) => n.statoB === 'scollegato') ? ['rosso', 'Un numero non è collegato alla riserva'] : num.some((n) => n.statoB === 'invia') ? ['verde', 'Sta inviando al posto del servizio A'] : ['verde', 'Pronto su tutti i numeri'];
    const ultima = (k) => num.reduce((m, n) => (n[k] && (!m || n[k] > m) ? n[k] : m), null);
    return [
      { id: 'waA', nome: 'WhatsApp · servizio A (principale)', semaforo: A[0], testo: A[1], ultima: ultima('provaA') },
      { id: 'waB', nome: 'WhatsApp · servizio B (riserva sullo stesso numero)', semaforo: B[0], testo: B[1], ultima: ultima('provaB') },
    ].concat(ge().collegamenti.map((c) => (c.id === 'meta' ? rigaMetaCollegamenti(c) : c)));
  }
  const SEMAFORO = { verde: ['salvia', 'Funziona'], giallo: ['pesca', 'Da controllare'], rosso: ['errore', 'Interrotto'], spento: ['', 'Non collegato'] };
  function sezCollegamenti() {
    const elenco = statoCollegamenti();
    return `<div class="riquadro"><h2 class="titolo-riquadro">Collegamenti esterni</h2>
      <p class="secondario" style="margin-top:-6px">Se un collegamento si interrompe, quello che non è partito resta in coda e riparte da solo quando torna, senza doppioni. Il resto del software continua a funzionare.</p>
      <div class="elenco">${elenco.map((c) => `<div class="riga">
        <span class="ge-semaforo ${c.semaforo}" aria-hidden="true"></span>
        <div class="principale"><div class="titolo-riga">${R.esc(c.nome)} <span class="etichetta ${SEMAFORO[c.semaforo][0]}">${SEMAFORO[c.semaforo][1]}</span></div><div class="sotto">${R.esc(c.testo)} · ultima prova riuscita: ${c.ultima ? R.esc(quandoMinuscolo(c.ultima)) : 'mai'}</div></div>
        <button class="btn piccolo ${c.semaforo === 'rosso' ? 'rosso' : 'secondario-campo'}" data-azione="ge-collegamento" data-id="${c.id}">${c.id === 'meta' ? 'Gestisci' : c.semaforo === 'spento' ? 'Collega' : c.semaforo === 'verde' ? 'Prova ora' : 'Ricollega'}</button>
      </div>`).join('')}</div></div>`;
  }
  const ISTRUZIONI = {
    meta: ['Premi «Collega con Facebook» e accedi con l\'account che gestisce la pagina.', 'Scegli la pagina e i moduli pubblicitari da collegare.', 'Conferma: da quel momento ogni contatto arriva qui da solo.'],
    calendar: ['Ognuno collega il suo calendario da «Il mio profilo».', 'Premi «Collega Google Calendar» e accedi con il tuo account Google.', 'Gli impegni personali entrano solo come «occupato», senza titolo.'],
    slack: ['Premi «Collega Slack» e accedi al tuo spazio di lavoro.', 'Scegli il canale dove ricevere gli avvisi.', 'Conferma: nelle automazioni potrai usare «Messaggio su Slack».'],
    fogli: ['Premi «Collega Google Fogli» e accedi con il tuo account Google.', 'Scegli il foglio.', 'Conferma: nelle automazioni potrai aggiungere righe al foglio.'],
  };
  R.azioni['ge-collegamento'] = (el) => {
    const id = el.dataset.id;
    if (id === 'waA' || id === 'waB') { R.vai('#/whatsapp'); return; }
    if (id === 'meta') { R.vai('#/impostazioni/meta'); return; }
    const c = ge().collegamenti.find((x) => x.id === id);
    if (!c) return;
    if (c.semaforo === 'verde') {
      if (!R.serveConnessione('la prova del collegamento')) return;
      c.ultima = R.adesso(); R.salva(); R.aggiorna(); R.avviso(`Prova riuscita: ${R.esc(c.nome)} funziona`);
      return;
    }
    const passi = ISTRUZIONI[id] || ['Premi «Collega» e accedi con l\'account del servizio.', 'Dai il permesso a Rampant di leggere e scrivere solo ciò che serve.', 'Conferma: facciamo subito una prova.'];
    R.modale({
      titolo: `${c.semaforo === 'spento' ? 'Collega' : 'Ricollega'}: ${R.esc(c.nome)}`,
      sottotitolo: 'Tre passi semplici. Nel prototipo il collegamento è simulato.',
      corpo: `<ol class="ge-ordine">${passi.map((t, i) => `<li><span class="n">${i + 1}</span><span>${R.esc(t)}</span></li>`).join('')}</ol>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Simula: collegamento riuscito', classe: 'primario', fai: () => {
          if (!R.serveConnessione('il collegamento')) return false;
          const recuperati = c.semaforo !== 'spento' ? 2 : 0;
          c.semaforo = 'verde'; c.ultima = R.adesso();
          if (id === 'meta') c.testo = `Collegato direttamente a Meta · recuperati ${recuperati} contatti arrivati durante l'interruzione`;
          else if (c.testo === 'Non collegato' || id === 'calendar') c.testo = id === 'calendar' ? 'Collegato per tutte le persone' : 'Collegato';
          registra(`Ha collegato ${c.nome}`);
          R.salva(); R.aggiorna(); R.avviso(`${R.esc(c.nome)} collegato${recuperati ? ` · recuperati ${recuperati} elementi` : ''}`);
        },
      }],
    });
  };

  /* ---------- Orario di invio e festivi ---------- */
  function campiOrario(o) {
    return `<div class="etichetta-campo">Giorni</div>
      <div class="ge-giorni">${GIORNI.map(([n, nome]) => `<label class="ge-giorno"><input type="checkbox" name="g${n}" ${o.giorni.includes(n) ? 'checked' : ''} aria-label="${nome}"><span>${nome}</span></label>`).join('')}</div>
      <div class="griglia g-2" style="max-width:420px">${gruppo('Dalle', `<input class="campo" type="time" id="ge-or-ini" name="inizio" value="${R.esc(o.inizio)}">`, 'ge-or-ini')}${gruppo('Alle', `<input class="campo" type="time" id="ge-or-fin" name="fine" value="${R.esc(o.fine)}">`, 'ge-or-fin')}</div>`;
  }
  function leggiOrario(v, contenitore) {
    const giorni = GIORNI.map(([n]) => n).filter((n) => v['g' + n]);
    if (!giorni.length) { R.avviso('Scegli almeno un giorno'); return null; }
    if (!v.inizio || !v.fine || minuti(v.inizio) >= minuti(v.fine)) { R.erroreCampo(contenitore, 'fine', 'L\'ora di fine deve venire dopo quella di inizio.'); return null; }
    return { giorni, inizio: v.inizio, fine: v.fine };
  }
  function festiviHtml(aziendali, azioneTogli, azioneAggiungi) {
    return `<div class="etichetta-campo">Festivi nazionali (già caricati)</div>
      <div>${festiviNazionali().map((f) => `<span class="ge-chip fisso">${R.esc(f.data)} · ${R.esc(f.nome)}</span>`).join('')}</div>
      <div class="etichetta-campo spazio-sopra">Festivi dell'azienda</div>
      <div>${aziendali.map((f, i) => `<span class="ge-chip">${R.esc(f.data)} · ${R.esc(f.nome)}<button data-azione="${azioneTogli}" data-i="${i}" aria-label="Togli ${R.esc(f.nome)}">${R.icona('x', 14)}</button></span>`).join('') || '<p class="secondario piccolo" style="margin:0 0 8px">Nessun festivo aggiunto: per esempio il santo patrono.</p>'}</div>
      <div class="ge-riga-aggiungi"><input class="campo" id="ge-fest-data" placeholder="gg/mm, es. 19/09" aria-label="Data del festivo" style="max-width:170px"><input class="campo" id="ge-fest-nome" placeholder="Nome, es. Santo patrono" aria-label="Nome del festivo"><button class="btn secondario-campo" data-azione="${azioneAggiungi}">Aggiungi</button></div>`;
  }
  function leggiFestivo() {
    const d = document.getElementById('ge-fest-data'), n = document.getElementById('ge-fest-nome');
    const m = (d.value || '').trim().match(/^(\d{1,2})[/.-](\d{1,2})$/);
    if (!m || +m[1] < 1 || +m[1] > 31 || +m[2] < 1 || +m[2] > 12) { R.avviso('Scrivi la data come giorno/mese, per esempio 19/09'); d.focus(); return null; }
    return { data: m[1].padStart(2, '0') + '/' + m[2].padStart(2, '0'), nome: (n.value || '').trim() || 'Festivo dell\'azienda' };
  }
  function sezOrario() {
    const o = R.stato.impostazioni.orario;
    const adesso = new Date();
    const stato = inOrario(adesso) ? 'Adesso siamo nell\'orario di invio: i messaggi automatici partono.' : `Adesso siamo fuori orario: i messaggi automatici aspettano ${quandoMinuscolo(prossimaApertura(adesso).toISOString())}.`;
    return `<div class="riquadro" id="ge-orario">
        <h2 class="titolo-riquadro">Orario di invio</h2>
        <p class="secondario" style="margin-top:-6px">Un solo orario per tutti i messaggi automatici ai contatti (WhatsApp ed email): fuori orario aspettano. Non vale per i messaggi scritti a mano, le conferme di prenotazione, i promemoria degli appuntamenti e gli avvisi interni. Le scadenze «entro X ore» contano solo queste ore.</p>
        ${campiOrario(o)}
        <div class="riga-flex"><button class="btn primario" data-azione="ge-salva-orario">Salva l'orario</button><span class="secondario piccolo">${R.esc(stato)}</span></div>
      </div>
      <div class="riquadro spazio-sopra"><h2 class="titolo-riquadro">Festivi</h2><p class="secondario" style="margin-top:-6px">Nei festivi i messaggi automatici non partono e le ore di lavoro non contano.</p>${festiviHtml(ge().festiviAzienda, 'ge-festivo-togli', 'ge-festivo-aggiungi')}</div>`;
  }
  R.azioni['ge-salva-orario'] = () => {
    const box = document.getElementById('ge-orario');
    const o = leggiOrario(R.valori(box), box);
    if (!o) return;
    Object.assign(R.stato.impostazioni.orario, o);
    registra(`Ha cambiato l'orario di invio: ${orarioTesto()}`);
    R.salva(); R.aggiorna(); R.avviso(`Orario di invio salvato: ${R.esc(orarioTesto())}`);
  };
  R.azioni['ge-festivo-aggiungi'] = () => {
    const f = leggiFestivo();
    if (!f) return;
    const o = R.stato.impostazioni.orario;
    if (o.festivi.includes(f.data)) { R.avviso('Questo giorno è già festivo'); return; }
    ge().festiviAzienda.push(f); o.festivi.push(f.data);
    registra(`Ha aggiunto il festivo ${f.data} (${f.nome})`);
    R.salva(); R.aggiorna(); R.avviso('Festivo aggiunto');
  };
  R.azioni['ge-festivo-togli'] = (el) => {
    const lista = ge().festiviAzienda;
    const [f] = lista.splice(+el.dataset.i, 1);
    if (!f) return;
    const o = R.stato.impostazioni.orario;
    if (!festiviNazionali().some((x) => x.data === f.data)) o.festivi = o.festivi.filter((x) => x !== f.data);
    R.salva(); R.aggiorna();
    R.avviso('Festivo tolto', { annulla: () => { lista.push(f); if (!o.festivi.includes(f.data)) o.festivi.push(f.data); R.salva(); R.aggiorna(); } });
  };

  /* ---------- Motivi di perdita, parole STOP, prefisso, registro ---------- */
  function sezMotivi() {
    const m = R.stato.motiviPerdita;
    const conta = (x) => R.stato.affari.filter((a) => !a.eliminato && a.motivoPerdita === x).length;
    return `<div class="riquadro"><h2 class="titolo-riquadro">Motivi di perdita</h2>
      <p class="secondario" style="margin-top:-6px">L'elenco che compare quando segni un affare come perso. Il motivo è facoltativo: nella finestra si può saltare. Rinominare un motivo aggiorna anche gli affari che lo usano.</p>
      <div class="elenco ge-elenco-modificabile">${m.map((x, i) => `<div class="riga"><input class="campo" value="${R.esc(x)}" aria-label="Motivo ${i + 1}" data-cambia="ge-motivo-nome" data-i="${i}"><span class="secondario piccolo" style="white-space:nowrap">${plurale(conta(x), 'affare', 'affari')}</span><button class="btn tondo secondario-campo" data-azione="ge-motivo-sposta" data-i="${i}" data-verso="su" aria-label="Sposta su">${R.icona('su', 16)}</button><button class="btn tondo secondario-campo" data-azione="ge-motivo-sposta" data-i="${i}" data-verso="giu" aria-label="Sposta giù">${R.icona('giu', 16)}</button><button class="btn tondo pesca" data-azione="ge-motivo-elimina" data-i="${i}" aria-label="Elimina ${R.esc(x)}">${R.icona('cestino', 16)}</button></div>`).join('')}</div>
      <div class="ge-riga-aggiungi spazio-sopra"><input class="campo" id="ge-motivo-nuovo" placeholder="Nuovo motivo, es. Tempi troppo lunghi" aria-label="Nuovo motivo"><button class="btn primario" data-azione="ge-motivo-aggiungi">Aggiungi</button></div></div>`;
  }
  R.azioni['ge-motivo-nome'] = (el) => {
    const m = R.stato.motiviPerdita;
    const i = +el.dataset.i;
    const nuovo = el.value.trim();
    if (!nuovo) { el.value = m[i]; R.avviso('Il motivo non può essere vuoto: per toglierlo usa il cestino'); return; }
    if (m.some((x, j) => j !== i && x.toLowerCase() === nuovo.toLowerCase())) { el.value = m[i]; R.avviso('Questo motivo c\'è già'); return; }
    const prima = m[i];
    m[i] = nuovo;
    R.stato.affari.forEach((a) => { if (a.motivoPerdita === prima) a.motivoPerdita = nuovo; });
    R.salva(); R.aggiorna(); R.avviso('Motivo rinominato');
  };
  R.azioni['ge-motivo-sposta'] = (el) => {
    const m = R.stato.motiviPerdita;
    const i = +el.dataset.i, j = i + (el.dataset.verso === 'su' ? -1 : 1);
    if (j < 0 || j >= m.length) { R.avviso(j < 0 ? 'È già il primo' : 'È già l\'ultimo'); return; }
    [m[i], m[j]] = [m[j], m[i]];
    R.salva(); R.aggiorna();
  };
  R.azioni['ge-motivo-elimina'] = (el) => {
    const m = R.stato.motiviPerdita;
    const i = +el.dataset.i;
    const [x] = m.splice(i, 1);
    R.salva(); R.aggiorna();
    R.avviso(`Motivo «${R.esc(x)}» tolto dall'elenco: gli affari già persi lo conservano`, { annulla: () => { m.splice(i, 0, x); R.salva(); R.aggiorna(); } });
  };
  R.azioni['ge-motivo-aggiungi'] = () => {
    const c = document.getElementById('ge-motivo-nuovo');
    const v = (c.value || '').trim();
    if (!v) { R.avviso('Scrivi il motivo da aggiungere'); c.focus(); return; }
    if (R.stato.motiviPerdita.some((x) => x.toLowerCase() === v.toLowerCase())) { R.avviso('Questo motivo c\'è già'); return; }
    const m = R.stato.motiviPerdita;
    const altro = m.indexOf('Altro');
    m.splice(altro < 0 ? m.length : altro, 0, v);
    R.salva(); R.aggiorna(); R.avviso('Motivo aggiunto');
  };
  function sezStop() {
    const p = R.stato.impostazioni.paroleStop;
    return `<div class="riquadro"><h2 class="titolo-riquadro">Parole STOP</h2>
      <p class="secondario" style="margin-top:-6px">Se un contatto risponde su WhatsApp con una di queste parole, passa in «Non disturbare» per WhatsApp e il responsabile del contatto riceve un avviso. Torna a «Sì» solo con una nuova richiesta del cliente, registrata con data e fonte.</p>
      <div>${p.map((x, i) => `<span class="ge-chip">${R.esc(x)}<button data-azione="ge-stop-togli" data-i="${i}" aria-label="Togli ${R.esc(x)}">${R.icona('x', 14)}</button></span>`).join('')}</div>
      <div class="ge-riga-aggiungi spazio-sopra"><input class="campo" id="ge-stop-nuova" placeholder="es. non mi interessa" aria-label="Nuova parola STOP"><button class="btn primario" data-azione="ge-stop-aggiungi">Aggiungi</button></div></div>`;
  }
  R.azioni['ge-stop-aggiungi'] = () => {
    const c = document.getElementById('ge-stop-nuova');
    const v = (c.value || '').trim().toLowerCase();
    if (!v) { R.avviso('Scrivi la parola o la frase da aggiungere'); c.focus(); return; }
    const p = R.stato.impostazioni.paroleStop;
    if (p.includes(v)) { R.avviso('Questa parola c\'è già'); return; }
    p.push(v); registra(`Ha aggiunto la parola STOP «${v}»`); R.salva(); R.aggiorna(); R.avviso('Parola STOP aggiunta');
  };
  R.azioni['ge-stop-togli'] = (el) => {
    const p = R.stato.impostazioni.paroleStop;
    if (p.length <= 1) { R.avviso('Serve almeno una parola STOP'); return; }
    const i = +el.dataset.i;
    const [x] = p.splice(i, 1);
    R.salva(); R.aggiorna();
    R.avviso(`Tolta «${R.esc(x)}»`, { annulla: () => { p.splice(i, 0, x); R.salva(); R.aggiorna(); } });
  };
  const PREFISSI = [['+39', '+39 · Italia'], ['+41', '+41 · Svizzera'], ['+33', '+33 · Francia'], ['+49', '+49 · Germania'], ['+34', '+34 · Spagna'], ['+44', '+44 · Regno Unito'], ['+1', '+1 · Stati Uniti e Canada']];
  function sezPrefisso() {
    const pr = R.stato.impostazioni.prefisso;
    return `<div class="riquadro" id="ge-prefisso"><h2 class="titolo-riquadro">Prefisso predefinito</h2>
      <p class="secondario" style="margin-top:-6px">I telefoni si salvano sempre con il prefisso internazionale. Se qualcuno scrive un numero senza prefisso, usiamo questo.</p>
      <div style="max-width:360px">${gruppo('Prefisso', scelta('id="ge-pref" name="prefisso"', PREFISSI, pr), 'ge-pref')}</div>
      <p class="secondario">Esempio: chi scrive <b>333 123 4567</b> viene salvato come <b>${R.esc(pr)} 333 123 4567</b>.</p>
      <button class="btn primario" data-azione="ge-salva-prefisso">Salva</button></div>`;
  }
  R.azioni['ge-salva-prefisso'] = () => {
    const v = R.valori(document.getElementById('ge-prefisso'));
    R.stato.impostazioni.prefisso = v.prefisso;
    registra(`Ha cambiato il prefisso predefinito in ${v.prefisso}`);
    R.salva(); R.aggiorna(); R.avviso(`Prefisso predefinito: ${R.esc(v.prefisso)}`);
  };
  function sezRegistro() {
    const r = ge().registro;
    return `<div class="riquadro"><h2 class="titolo-riquadro">Registro delle azioni</h2>
      <p class="secondario" style="margin-top:-6px">Accessi, esportazioni, eliminazioni, ripristini, cambi di permessi e collegamenti. Le azioni dell'amministratore generale si registrano con il suo nome; i suoi ingressi nelle aziende dei clienti no.</p>
      <div class="elenco">${r.slice(0, 40).map((x) => `<div class="riga"><span class="avatar" style="background:${R.utenteDa(x.chi).colore}">${R.esc(R.utenteDa(x.chi).iniziali)}</span><div class="principale"><div class="titolo-riga" style="font-weight:500">${R.esc(x.testo)}</div><div class="sotto">${R.esc(R.utenteDa(x.chi).nome)} · ${R.esc(R.quandoBreve(x.quando))}</div></div></div>`).join('') || '<div class="vuoto">Ancora nessuna azione registrata.</div>'}</div></div>`;
  }
  function sezPrimoAvvio() {
    const create = R.stato.aziende.filter((a) => a.primoAvvio);
    return `<div class="riquadro"><h2 class="titolo-riquadro">Primo avvio</h2>
      <p class="secondario" style="margin-top:-6px">La procedura guidata in 8 passi per preparare un'azienda. Ogni passo si può saltare e riprendere da qui.</p>
      <div class="riquadro medio salvia">Il primo avvio di ${R.esc(R.azienda().nome)} è completo. Puoi cambiare tutto dalle singole sezioni: <a class="link" href="#/impostazioni/utenti">Utenti</a>, <a class="link" href="#/impostazioni/percorsi">Percorsi</a>, <a class="link" href="#/impostazioni/orario">Orario di invio</a>, <a class="link" href="#/whatsapp">Numeri WhatsApp</a>.</div>
      ${generale() ? `<div class="etichetta-campo spazio-sopra">Aziende dei clienti create con il primo avvio</div>
      <div class="elenco">${create.map((a) => { const pa = a.primoAvvio; const saltati = Object.values(pa.stati).filter((x) => x === 'saltato').length; return `<div class="riga"><span class="quadratino" style="background:${R.esc(a.colore)};color:#fff">${R.esc(sigla(a))}</span><div class="principale"><div class="titolo-riga">${R.esc(a.nome)}</div><div class="sotto">${pa.completato ? `finito${saltati ? ` · ${plurale(saltati, 'passo saltato', 'passi saltati')}` : ''}` : `al passo ${pa.passo} di 8`}</div></div><a class="btn piccolo secondario-campo" href="#/aziende/nuova?id=${a.id}${pa.completato ? '&passo=fine' : ''}">${pa.completato ? 'Riepilogo' : 'Riprendi'}</a></div>`; }).join('') || '<div class="vuoto">Nessuna azienda creata con il primo avvio.</div>'}</div>
      <a class="btn primario spazio-sopra" href="#/aziende/nuova">${R.icona('piu')} Nuova azienda per un cliente</a>` : ''}</div>`;
  }
  /* ---------- Claude (MCP) ---------- */
  function sezClaude() {
    const g = ge(); const c = g.claude || (g.claude = { collegato: false });
    const scade = (iso) => { const d = new Date(iso); d.setFullYear(d.getFullYear() + 3); return d.toISOString(); };
    const puo = ['Leggere contatti, affari, attività, storia e numeri della dashboard (solo quelli che vedi tu).', 'Creare e modificare in bozza pagine, funnel e moduli.', 'Creare e modificare in pausa le automazioni e provarle con un contatto finto.'];
    const non = ['Mandare messaggi ai clienti (WhatsApp o email).', 'Mettere online una pagina o accendere un\'automazione: lo fai tu con un clic.', 'Cancellare qualcosa per sempre: al massimo lo mette nel Cestino.'];
    const lista = (t, cls) => `<ul class="ge-claude-elenco ${cls}">${t.map((x) => `<li>${R.esc(x)}</li>`).join('')}</ul>`;
    const stato = c.collegato
      ? `<div class="riquadro medio salvia"><b>Claude è collegato</b> da ${R.esc(R.utenteDa(c.chi).nome)} il ${R.data(c.il)}. Il collegamento scade il ${R.data(scade(c.il))} (3 anni).</div>
         <button class="btn rosso spazio-sopra" data-azione="ge-claude-scollega">Scollega Claude</button>`
      : `<div class="riquadro medio beige">Claude non è collegato. Collegarlo è facile: premi il pulsante e segui i 4 passi.</div>
         <button class="btn primario spazio-sopra" data-azione="ge-claude-collega">Collega Claude</button>`;
    return `<div class="riquadro"><h2 class="titolo-riquadro">Claude</h2>
      <p class="secondario" style="margin-top:-6px">Claude può lavorare dentro Rampant con i tuoi stessi permessi. Lo collega solo l'amministratore generale; gli altri utenti non vedono questa voce. Ogni sua azione resta nella storia come «tramite Claude».</p>
      ${stato}
      <div class="etichetta-campo spazio-sopra">Cosa può fare</div>${lista(puo, 'si')}
      <div class="etichetta-campo">Cosa non fa mai</div>${lista(non, 'no')}
      <p class="piccolo secondario">Tutto ciò che crea nasce in bozza. Costo: 0 €.</p></div>`;
  }
  R.azioni['ge-claude-collega'] = () => {
    R.modale({
      titolo: 'Collega Claude', sottotitolo: 'Quattro passi. Nel prototipo il collegamento è simulato.',
      corpo: `<ol class="ge-ordine">${['Copia l\'indirizzo di Rampant che ti mostriamo (es. mcp.rampant.it).', 'In Claude apri Impostazioni → Connettori → Aggiungi connettore personalizzato e incollalo.', 'Si apre questa pagina: accedi come amministratore generale e leggi cosa potrà fare Claude.', 'Premi «Consenti». Niente chiavi da copiare.'].map((t, i) => `<li><span class="n">${i + 1}</span><span>${R.esc(t)}</span></li>`).join('')}</ol>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Simula: Consenti', classe: 'primario', fai: () => {
        const g = ge(); g.claude = { collegato: true, il: R.adesso(), chi: R.utente().id };
        registra('Ha collegato Claude (accesso di 3 anni)'); R.salva(); R.aggiorna(); R.avviso('Claude collegato');
      } }],
    });
  };
  R.azioni['ge-claude-scollega'] = () => {
    R.modale({
      titolo: 'Scollegare Claude?', sottotitolo: 'Claude non potrà più leggere né modificare nulla. Quello che ha già creato in bozza resta dov\'è. Puoi ricollegarlo quando vuoi.', classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Scollega', classe: 'rosso', fai: () => {
        ge().claude = { collegato: false }; registra('Ha scollegato Claude'); R.salva(); R.aggiorna(); R.avviso('Claude scollegato');
      } }],
    });
  };
  R.stile('gestione-claude', `
    .ge-claude-elenco { list-style: none; padding: 0; margin: 6px 0 14px; }
    .ge-claude-elenco li { padding: 6px 0 6px 26px; position: relative; font-size: 14px; }
    .ge-claude-elenco li::before { position: absolute; left: 0; top: 5px; width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
    .ge-claude-elenco.si li::before { content: '✓'; background: var(--lime); color: var(--scuro); }
    .ge-claude-elenco.no li::before { content: '✕'; background: var(--errore); color: var(--errore-t); }
  `);
  const SEZ = { claude: sezClaude, utenti: sezUtenti, aziende: sezAziende, percorsi: sezPercorsi, collegamenti: sezCollegamenti, meta: (s) => sezMeta(s), orario: sezOrario, motivi: sezMotivi, stop: sezStop, prefisso: sezPrefisso, registro: sezRegistro, 'primo-avvio': sezPrimoAvvio };

  /* ================= PRIMO AVVIO GUIDATO DI UNA NUOVA AZIENDA (capitolo 12, percorso 8) ================= */
  const MODELLI_SETTORE = {
    finanza: { nome: 'Finanza agevolata', percorso: 'Finanza agevolata', fasi: [['Nuovo contatto', 'salvia'], ['Da ricontattare', 'pesca'], ['Documenti richiesti', 'cielo'], ['Documenti ricevuti', 'lavanda'], ['Prefattibilità positiva', 'salvia'], ['Prefattibilità negativa', 'pesca'], ['Contratto e proforma inviati', 'cielo']], vinta: 'Contratto firmato', campi: 'ragione sociale, partita IVA, Ateco, regione, dipendenti, fatturato, forma giuridica, referente, bando di interesse, investimento previsto, cosa vuole acquistare; elenco dei documenti richiesti', automazioni: ['Benvenuto con brochure', 'Richiesta documenti con sollecito', 'Recupero di chi non risponde'], pagina: 'Pagina di un bando con modulo' },
    locale: { nome: 'Attività locale / eventi', percorso: 'Eventi', fasi: [['Nuovo contatto', 'salvia'], ['Contattato', 'pesca'], ['Proposta', 'cielo']], vinta: 'Confermato', campi: 'data dell\'evento, numero di persone, tipo di evento', automazioni: ['Benvenuto nuovo contatto', 'Promemoria appuntamento'], pagina: 'Scarica il menù eventi' },
    servizi: { nome: 'Servizi e impianti', percorso: 'Richieste di intervento', fasi: [['Nuova richiesta', 'salvia'], ['Sopralluogo fissato', 'pesca'], ['Preventivo inviato', 'cielo']], vinta: 'Preventivo accettato', campi: 'indirizzo dell\'intervento, tipo di impianto, urgenza', automazioni: ['Benvenuto nuovo contatto', 'Recupero di chi non risponde'], pagina: 'Richiedi un intervento o un preventivo' },
    vuoto: { nome: 'Vuoto', percorso: 'Vendite', fasi: [['Nuovo contatto', 'salvia']], vinta: 'Vinto', campi: 'solo nome, telefono ed email', automazioni: [], pagina: '' },
  };
  const PASSI_WIZ = ['Dati e logo', 'Modello di settore', 'Percorso e fasi', 'Utenti da invitare', 'Orario di invio', 'Numeri WhatsApp', 'Dominio', 'Prima pagina e modulo'];
  const percorsoDaModello = (k) => { const m = MODELLI_SETTORE[k] || MODELLI_SETTORE.vuoto; return { nome: m.percorso, fasi: m.fasi.map(([nome, colore]) => ({ nome, colore })), vinta: m.vinta }; };
  function indovinaModello(t) {
    t = String(t || '').toLowerCase();
    if (/bando|finanz|agevol|contribut/.test(t)) return 'finanza';
    if (/ristor|pizz|event|locale|bar|pub|club|trattoria|hotel/.test(t)) return 'locale';
    if (/impiant|idraul|elettr|serviz|install|manuten|riparaz/.test(t)) return 'servizi';
    return 'vuoto';
  }
  function wizCorrente() {
    const q = R.posizione().query;
    const az = q.id ? R.stato.aziende.find((a) => a.id === q.id && a.primoAvvio) : null;
    const passo = az ? (q.passo === 'fine' ? 'fine' : q.passo ? +q.passo : az.primoAvvio.passo) : 1;
    return { az, pa: az ? az.primoAvvio : null, passo };
  }
  function avanza(az, passo) {
    const pa = az.primoAvvio;
    if (passo >= 8) {
      pa.completato = true; pa.passo = 8;
      az.utenti = Math.max(az.utenti || 0, (pa.inviti || []).filter((x) => x.email).length);
      registra(`Ha finito il primo avvio di ${az.nome}`);
      R.salva(); R.vai(`#/aziende/nuova?id=${az.id}&passo=fine`);
      R.avviso(`${R.esc(az.nome)} è pronta e compare in «Le tue aziende»`);
      return;
    }
    pa.passo = Math.max(pa.completato ? 8 : pa.passo, passo + 1);
    R.salva(); R.vai(`#/aziende/nuova?id=${az.id}&passo=${passo + 1}`);
  }
  const PASSI_HTML = {
    1: (az) => {
      const d = az ? { nome: az.nome, settore: az.settore, telefono: az.telefono, email: az.emailAzienda, colore: az.colore } : (ge().bozzaAzienda || {});
      const colore = d.colore || COLORI_AZIENDA[0];
      return `<div class="griglia g-2">
          ${gruppo('Nome dell\'azienda', `<input class="campo" id="ge-w-nome" name="nome" value="${R.esc(d.nome || '')}" placeholder="es. Pizzeria Da Mario" data-digita="ge-wiz-bozza">`, 'ge-w-nome')}
          ${gruppo('Attività', `<input class="campo" id="ge-w-sett" name="settore" value="${R.esc(d.settore || '')}" placeholder="es. Ristorante con eventi" data-digita="ge-wiz-bozza">`, 'ge-w-sett')}
          ${gruppo('Telefono dell\'azienda', `<input class="campo" id="ge-w-tel" name="telefono" inputmode="tel" value="${R.esc(d.telefono || '')}" data-digita="ge-wiz-bozza">`, 'ge-w-tel')}
          ${gruppo('Email dell\'azienda', `<input class="campo" id="ge-w-email" name="email" type="email" value="${R.esc(d.email || '')}" data-digita="ge-wiz-bozza">`, 'ge-w-email')}
        </div>
        <div class="etichetta-campo">Colore del marchio (si usa nel logo e nelle pagine pubbliche, non cambia il software)</div>
        <div class="ge-colori">${COLORI_AZIENDA.map((c, i) => `<label><input type="radio" name="colore" value="${c}" ${c === colore ? 'checked' : ''} aria-label="Colore ${i + 1}" data-cambia="ge-wiz-bozza"><span style="background:${c}"></span></label>`).join('')}</div>
        <div class="riga-flex spazio-sopra"><span class="quadratino" id="ge-w-logo" style="width:56px;height:56px;border-radius:16px;background:${colore};color:#fff;font-size:16px">${R.esc(d.nome ? sigla({ nome: d.nome }) : 'AZ')}</span><button class="btn secondario-campo" data-azione="ge-wiz-logo">${R.icona('carica', 16)} Carica il logo</button><span class="piccolo secondario">Finché non carichi il logo usiamo le iniziali.</span></div>`;
    },
    2: (az, pa) => `<p class="secondario" style="margin-top:-6px">Il modello prepara percorso, fasi, campi e automazioni. Dopo puoi cambiare tutto. Cambiando modello, percorso e fasi tornano quelli del modello.</p>
      ${Object.entries(MODELLI_SETTORE).map(([k, m]) => `<button class="opzione ${pa.modello === k ? 'scelta' : ''}" data-azione="ge-wiz-modello" data-m="${k}" aria-pressed="${pa.modello === k}">
        <span class="principale"><b>${m.nome}</b><span class="sotto">Campi: ${R.esc(m.campi)}${m.automazioni.length ? ' · Automazioni: ' + R.esc(m.automazioni.join(', ')) : ''}${m.pagina ? ' · Pagina d\'esempio: ' + R.esc(m.pagina) : ''}</span>
        <span class="ge-fasi-chip">${m.fasi.map(([n, c]) => `<span class="etichetta ${c}">${R.esc(n)}</span>`).join('')}<span class="etichetta" style="background:var(--verde);color:#fff">${R.esc(m.vinta)}</span><span class="etichetta errore">Perso</span></span></span>
        ${pa.modello === k ? R.icona('spunta') : ''}</button>`).join('')}`,
    3: (az, pa) => `${gruppo('Nome del percorso', `<input class="campo" id="ge-w-pn" value="${R.esc(pa.percorso.nome)}" data-digita="ge-wiz-percorso" data-k="nome">`, 'ge-w-pn')}
      <div class="etichetta-campo">Fasi, in ordine</div>
      ${pa.percorso.fasi.map((f, i) => `<div class="ge-fase-riga wiz"><span class="ge-pallino ${f.colore}"></span><input class="campo" value="${R.esc(f.nome)}" aria-label="Nome della fase ${i + 1}" data-digita="ge-wiz-percorso" data-k="fase" data-i="${i}"><div class="ge-colore-sel">${scelta(`aria-label="Colore della fase ${i + 1}" data-cambia="ge-wiz-percorso" data-k="colore" data-i="${i}"`, PASTELLI, f.colore)}</div><div class="riga-flex" style="gap:6px;flex-wrap:nowrap"><button class="btn tondo secondario-campo" data-azione="ge-wiz-fase" data-op="su" data-i="${i}" aria-label="Sposta su">${R.icona('su', 16)}</button><button class="btn tondo secondario-campo" data-azione="ge-wiz-fase" data-op="giu" data-i="${i}" aria-label="Sposta giù">${R.icona('giu', 16)}</button><button class="btn tondo pesca" data-azione="ge-wiz-fase" data-op="elimina" data-i="${i}" aria-label="Elimina la fase">${R.icona('cestino', 16)}</button></div></div>`).join('')}
      <button class="ge-aggiungi spazio-sopra" data-azione="ge-wiz-fase" data-op="aggiungi">+ Aggiungi fase</button>
      ${gruppo('Nome della fase finale positiva (vinto)', `<input class="campo" id="ge-w-vinta" value="${R.esc(pa.percorso.vinta)}" data-digita="ge-wiz-percorso" data-k="vinta">`, 'ge-w-vinta', 'spazio-sopra')}
      <p class="piccolo secondario">C'è sempre anche la fase finale «Perso».</p>`,
    4: (az, pa) => {
      const righe = pa.inviti.length ? pa.inviti : [{ email: '', ruolo: 'azienda' }];
      return `<p class="secondario" style="margin-top:-6px">Chi lavorerà in questa azienda. Di solito il cliente è «Amministratore dell'azienda». Gli inviti partono quando premi «Invita il cliente» alla fine.</p>
        ${righe.map((x, i) => `<div class="ge-riga-invito"><input class="campo" type="email" name="inv_${i}" value="${R.esc(x.email)}" placeholder="nome@esempio.it" aria-label="Email della persona ${i + 1}" data-digita="ge-wiz-invito" data-i="${i}" data-k="email">${scelta(`aria-label="Ruolo della persona ${i + 1}" data-cambia="ge-wiz-invito" data-i="${i}" data-k="ruolo"`, [['azienda', 'Amministratore dell\'azienda'], ['collaboratore', 'Collaboratore']], x.ruolo)}<button class="btn tondo secondario-campo" data-azione="ge-wiz-invito-togli" data-i="${i}" aria-label="Togli la persona ${i + 1}">${R.icona('x', 16)}</button></div>`).join('')}
        <button class="ge-aggiungi" data-azione="ge-wiz-invito-piu">+ Aggiungi una persona</button>`;
    },
    5: (az, pa) => `<p class="secondario" style="margin-top:-6px">Un solo orario per tutti i messaggi automatici di questa azienda. Finché non è impostato, le automazioni non inviano. Per esempio Auto Mediterranea invia dal lunedì al sabato, dalle 9 alle 21.</p>
      ${campiOrario(pa.orario)}${festiviHtml(pa.orario.festivi || [], 'ge-wiz-festivo-togli', 'ge-wiz-festivo-aggiungi')}`,
    6: (az, pa) => {
      const c = pa.collegando;
      const elenco = pa.numeri.map((n) => `<div class="riga"><span class="quadratino salvia">${R.icona('whatsapp', 18)}</span><div class="principale"><div class="titolo-riga">${R.esc(n.nome)}</div><div class="sotto">${R.esc(n.telefono)} · ${n.crea ? 'crea i contatti di chi scrive' : 'non crea contatti nuovi'}</div></div><span class="etichetta salvia"><span class="puntino"></span>A collegato · B pronto</span></div>`).join('');
      let pannello;
      if (!c) pannello = '<button class="btn secondario-campo spazio-sopra" data-azione="ge-wiz-num-nuovo">+ Collega un numero</button>';
      else if (c.fase === 'dati') pannello = `<div class="riquadro medio beige spazio-sopra">
          <div class="griglia g-2">${gruppo('Nome sul riquadro', `<input class="campo su-beige" id="ge-wn-nome" name="wnNome" value="${R.esc(c.nome || 'Numero aziendale')}">`, 'ge-wn-nome')}${gruppo('Numero di telefono', `<input class="campo su-beige" id="ge-wn-tel" name="wnTel" inputmode="tel" value="${R.esc(c.telefono || '')}" placeholder="es. 081 123 4567">`, 'ge-wn-tel')}</div>
          <div class="riga-impostazione" style="background:#fff"><span>Crea un contatto per chi scrive e non è nel software<br><span class="piccolo secondario">Di base sì per il numero aziendale, no per quelli dei collaboratori</span></span>${interruttore('name="wnCrea"', c.crea !== false)}</div>
          <div class="riga-flex" style="justify-content:flex-end"><button class="btn" data-azione="ge-wiz-num-annulla">Annulla</button><button class="btn primario" data-azione="ge-wiz-num-a">Continua con il servizio A</button></div></div>`;
      else pannello = `<div class="riquadro medio beige spazio-sopra" style="text-align:center"><div class="grassetto">${c.fase === 'A' ? 'Passo 1 di 2: servizio A, il principale' : 'Passo 2 di 2: servizio B, la riserva sullo stesso numero'}</div>${c.fase === 'B' ? '<div class="piccolo" style="color:var(--verde);margin-top:4px">Servizio A collegato</div>' : ''}${QR(c.fase === 'A' ? 3 : 7)}${passiQR}
          <div class="riga-flex" style="justify-content:center;margin-top:12px"><button class="btn" data-azione="ge-wiz-num-annulla">Annulla</button><button class="btn primario" data-azione="ge-wiz-num-qr">Simula: ho inquadrato (servizio ${c.fase})</button></div></div>`;
      return `<div class="ge-avviso-lavoro spazio-sotto"><b>Usa numeri dedicati al lavoro.</b> Ogni numero si collega a due servizi: A (principale) e B (riserva sullo stesso numero). Chat di gruppo e stati non vengono mai salvati.</div>
        <div class="elenco">${elenco || (!c ? '<div class="vuoto">Nessun numero ancora. Puoi collegarli anche dopo, dalla pagina WhatsApp dell\'azienda.</div>' : '')}</div>${pannello}`;
    },
    7: (az, pa) => `<div class="riquadro medio salvia spazio-sotto"><b>Le pagine si possono già pubblicare su <span id="ge-w-sd-vedi">${R.esc(az.sottodominio)}</span>.rampant.it</b>, gratis. Il nome del sottodominio lo scegli tu, come amministratore generale.</div>
      ${gruppo('Sottodominio gratuito', `<div class="riga-flex" style="flex-wrap:nowrap;gap:8px"><input class="campo" id="ge-w-sd" name="sottodominio" value="${R.esc(az.sottodominio)}" data-digita="ge-wiz-sd" style="flex:1;min-width:0"><span class="grassetto" style="white-space:nowrap">.rampant.it</span></div>`, 'ge-w-sd')}
      <p class="piccolo secondario" style="margin-top:-6px">Se lo cambi più avanti, il vecchio indirizzo porta al nuovo. Un sottodominio non passa mai a un'altra azienda.</p>
      ${gruppo('Dominio proprio (facoltativo)', `<input class="campo" id="ge-w-dom" name="dominio" value="${R.esc(pa.dominio || '')}" placeholder="es. www.pizzeriadamario.it">`, 'ge-w-dom', 'spazio-sopra')}
      <p class="piccolo secondario">Lo colleghi quando vuoi da Marketing → Domini, con istruzioni semplici e verifica automatica.</p>`,
    8: (az, pa) => {
      const m = MODELLI_SETTORE[pa.modello] || MODELLI_SETTORE.vuoto;
      const opz = (m.pagina ? [['modello', `Usa la pagina d'esempio del modello: «${m.pagina}»`]] : []).concat([['ai', 'Creala con l\'AI: la descrivi a parole'], ['vuota', 'Parti da una pagina vuota'], ['dopo', 'La preparo dopo']]);
      const scelto = opz.some(([k]) => k === pa.pagina) ? pa.pagina : opz[0][0];
      return `${opz.map(([k, t]) => `<label class="opzione"><input type="radio" name="pagina" value="${k}" ${scelto === k ? 'checked' : ''}><span class="principale">${R.esc(t)}</span></label>`).join('')}
        <div class="etichetta-campo spazio-sopra">Il modulo della pagina chiede</div>
        <div class="riga-impostazione"><span>Nome e telefono con prefisso</span><span class="valore">Sempre</span></div>
        <div class="riga-impostazione"><span>Email</span>${interruttore('name="modEmail" aria-label="Chiedi l\'email"', pa.modulo.email)}</div>
        <div class="riga-impostazione"><span>Informativa privacy e consenso per canale (WhatsApp, email)</span><span class="valore">Sempre</span></div>
        <p class="piccolo secondario">Chi compila diventa un contatto nella prima fase del percorso, con il promemoria «richiamare entro 1 ora di lavoro» al responsabile.</p>
        <div class="banner giallo spazio-sopra">${R.icona('lucchetto')}<div class="principale"><b>Accordo sul trattamento dei dati da accettare dal cliente.</b> Finché non lo accetta puoi preparare tutto, ma non pubblicare la pagina né inviare messaggi.</div></div>`;
    },
  };
  const SALVA_PASSO = {
    1: (az, pa, v, form) => {
      if (!v.nome) { R.erroreCampo(form, 'nome', 'Scrivi il nome dell\'azienda: serve per crearla.'); return false; }
      if (v.email && !emailValida(v.email)) { R.erroreCampo(form, 'email', 'Scrivi un\'email valida o lascia vuoto.'); return false; }
      if (R.stato.aziende.some((a) => a !== az && a.nome.toLowerCase() === v.nome.toLowerCase())) { R.erroreCampo(form, 'nome', 'Esiste già un\'azienda con questo nome: scegline un altro.'); return false; }
      if (!az) {
        const base = slug(v.nome) || 'azienda';
        let sd = base, k = 2;
        while (R.stato.aziende.some((a) => a.sottodominio === sd)) sd = base + k++;
        const modello = indovinaModello(v.nome + ' ' + v.settore);
        az = { id: R.id('a'), nome: v.nome, iniziale: '', colore: v.colore || COLORI_AZIENDA[0], tipo: 'cliente', stato: 'attiva', utenti: 0, settore: v.settore, telefono: v.telefono, emailAzienda: v.email, sottodominio: sd, accordoAccettato: false, creataIl: R.adesso(),
          primoAvvio: { passo: 1, stati: {}, modello, percorso: percorsoDaModello(modello), inviti: [{ email: v.email || '', ruolo: 'azienda' }], orario: { giorni: [1, 2, 3, 4, 5], inizio: '09:00', fine: '18:00', festivi: [] }, numeri: [], collegando: null, dominio: '', pagina: 'modello', modulo: { email: true }, completato: false } };
        az.iniziale = sigla(az);
        R.stato.aziende.push(az);
        ge().bozzaAzienda = null;
        registra(`Ha creato l'azienda ${v.nome} per un cliente`);
      } else {
        Object.assign(az, { nome: v.nome, settore: v.settore, telefono: v.telefono, emailAzienda: v.email, colore: v.colore || az.colore });
        az.iniziale = sigla(Object.assign({}, az, { iniziale: '' }));
      }
      return az;
    },
    2: (az, pa) => { if (!pa.modello) { R.avviso('Scegli un modello, anche «Vuoto»'); return false; } return az; },
    3: (az, pa) => {
      if (!pa.percorso.nome.trim()) { R.avviso('Scrivi il nome del percorso'); return false; }
      if (pa.percorso.fasi.some((f) => !f.nome.trim())) { R.avviso('Ogni fase deve avere un nome'); return false; }
      if (!pa.percorso.vinta.trim()) { R.avviso('Scrivi il nome della fase finale positiva'); return false; }
      return az;
    },
    4: (az, pa, v, form) => {
      const righe = pa.inviti.length ? pa.inviti : [];
      for (let i = 0; i < righe.length; i++) { if (righe[i].email && !emailValida(righe[i].email)) { R.erroreCampo(form, 'inv_' + i, 'Questa email non sembra giusta: controllala.'); return false; } }
      pa.inviti = righe.filter((x) => x.email);
      return az;
    },
    5: (az, pa, v, form) => { const o = leggiOrario(v, form); if (!o) return false; Object.assign(pa.orario, o); return az; },
    6: (az, pa) => { if (pa.collegando) { R.avviso('Finisci di collegare il numero oppure premi «Annulla»'); return false; } return az; },
    7: (az, pa, v, form) => {
      const sd = slug(v.sottodominio);
      if (!sd) { R.erroreCampo(form, 'sottodominio', 'Scrivi un nome con lettere o numeri.'); return false; }
      if (R.stato.aziende.some((a) => a !== az && a.sottodominio === sd)) { R.erroreCampo(form, 'sottodominio', 'Questo nome è già usato da un\'altra azienda: scegline un altro.'); return false; }
      if (v.dominio && !/^[\w.-]+\.[a-z]{2,}$/i.test(v.dominio.replace(/^https?:\/\//, ''))) { R.erroreCampo(form, 'dominio', 'Scrivi il dominio come www.nomesito.it, oppure lascia vuoto.'); return false; }
      if (az.sottodominio !== sd) { az.sottodominiPrecedenti = (az.sottodominiPrecedenti || []).concat(az.sottodominio); az.sottodominio = sd; }
      pa.dominio = v.dominio.replace(/^https?:\/\//, '');
      return az;
    },
    8: (az, pa, v) => { pa.pagina = v.pagina || 'dopo'; pa.modulo.email = !!v.modEmail; return az; },
  };
  function riepilogoPasso(az, n) {
    const pa = az.primoAvvio;
    const m = MODELLI_SETTORE[pa.modello] || MODELLI_SETTORE.vuoto;
    if (pa.stati[n] !== 'fatto') return pa.stati[n] === 'saltato' ? 'Saltato: lo riprendi quando vuoi' : 'Da fare';
    switch (n) {
      case 1: return az.nome + (az.settore ? ' · ' + az.settore : '');
      case 2: return m.nome;
      case 3: return `${pa.percorso.nome}: ${pa.percorso.fasi.map((f) => f.nome).join(' → ')} → ${pa.percorso.vinta}`;
      case 4: return pa.inviti.length ? pa.inviti.map((x) => x.email + (x.ruolo === 'azienda' ? ' (amministratore)' : '')).join(', ') : 'Nessuna persona da invitare';
      case 5: return orarioTesto(pa.orario) + ((pa.orario.festivi || []).length ? ` · ${plurale(pa.orario.festivi.length, 'festivo', 'festivi')} dell'azienda` : '');
      case 6: return pa.numeri.length ? pa.numeri.map((x) => x.nome + ' ' + x.telefono).join(', ') + ' · A collegato · B pronto' : 'Nessun numero: si collegano dalla pagina WhatsApp';
      case 7: return `${az.sottodominio}.rampant.it${pa.dominio ? ' · dominio da collegare: ' + pa.dominio : ''}`;
      case 8: return { modello: 'Pagina d\'esempio: ' + m.pagina, ai: 'Pagina da creare con l\'AI', vuota: 'Pagina vuota', dopo: 'Da preparare dopo' }[pa.pagina] || 'Da preparare dopo';
      default: return '';
    }
  }
  function fineWizard(az) {
    const pa = az.primoAvvio;
    const cliente = pa.inviti.find((x) => x.ruolo === 'azienda') || pa.inviti[0];
    const voci = PASSI_WIZ.map((nome, i) => {
      const n = i + 1;
      const st = pa.stati[n];
      return `<div class="riga"><span class="quadratino ${st === 'fatto' ? 'salvia' : 'pesca'}">${st === 'fatto' ? R.icona('spunta', 16) : n}</span><div class="principale"><div class="titolo-riga">${nome}</div><div class="sotto">${R.esc(riepilogoPasso(az, n))}</div></div>${st === 'fatto' ? `<a class="link verde" href="#/aziende/nuova?id=${az.id}&passo=${n}">Cambia</a>` : `<a class="btn piccolo secondario-campo" href="#/aziende/nuova?id=${az.id}&passo=${n}">Riprendi</a>`}</div>`;
    }).join('');
    return `<div class="riquadro verde"><span class="etichetta" style="background:var(--lime);color:var(--scuro)">Primo avvio finito</span>
        <div class="titolo-pagina" style="color:#fff;margin-top:12px;font-size:38px">${R.esc(az.nome)} è pronta</div>
        <p style="margin:8px 0 0;opacity:.9">Stato: Attiva · indirizzo delle pagine: ${R.esc(az.sottodominio)}.rampant.it · la trovi in «Le tue aziende».</p>
        <div class="riga-flex spazio-sopra"><button class="btn lime" data-azione="ge-invita-cliente" data-id="${az.id}">${R.icona('invia', 16)} Invita il cliente</button><button class="btn" data-azione="ge-entra" data-id="${az.id}">Entra nell'azienda</button><a class="btn scuro" href="#/impostazioni/aziende">Torna a Le tue aziende</a></div></div>
      <div class="griglia g-2 spazio-sopra" style="align-items:start">
        <div class="riquadro"><h2 class="titolo-riquadro">Cosa hai impostato</h2><div class="elenco">${voci}</div></div>
        <div>
          <div class="riquadro ${az.accordoAccettato ? 'salvia' : 'pesca'}"><h2 class="titolo-riquadro">Accordo sul trattamento dei dati</h2>
            <p>${az.accordoAccettato ? 'Accettato dal cliente: si possono pubblicare pagine e inviare messaggi.' : 'Da accettare dal cliente: lo accetta al primo accesso, dopo l\'invito. Fino ad allora puoi configurare tutto, ma non inviare messaggi né pubblicare pagine.'}</p>
            ${az.accordoAccettato ? '' : `<button class="btn" data-azione="ge-accordo-sim" data-id="${az.id}">Simula: il cliente accetta l'accordo</button>`}</div>
          <div class="riquadro spazio-sopra"><h2 class="titolo-riquadro piccolo">Invito al cliente</h2>
            <p class="secondario" style="margin:0">${pa.invitoInviato ? `Inviato a ${R.esc(pa.invitoA)} ${R.esc(R.giornoRelativo(pa.invitoInviato))} alle ${R.ora(pa.invitoInviato)} (simulato).` : cliente ? `Pronto per ${R.esc(cliente.email)}: premi «Invita il cliente».` : 'Non hai indicato l\'email del cliente: la scrivi nella finestra dell\'invito.'}</p></div>
        </div>
      </div>`;
  }
  function disegnaPrimoAvvio(p, q) {
    prepara();
    if (!generale()) return '<div class="riquadro vuoto spazio-sopra">Solo l\'amministratore generale crea nuove aziende. <a class="link verde" href="#/impostazioni">Torna alle impostazioni</a></div>';
    const az = q.id ? R.stato.aziende.find((a) => a.id === q.id && a.primoAvvio) : null;
    if (q.id && !az) return '<div class="riquadro vuoto spazio-sopra">Questa azienda non ha un primo avvio da riprendere. <a class="link verde" href="#/impostazioni/aziende">Torna a Le tue aziende</a></div>';
    const intestazione = `<div class="testata"><div><a class="indietro" href="#/impostazioni/aziende">${R.icona('freccia-sinistra', 14)} Le tue aziende</a><h1 class="titolo-pagina">${az ? R.esc(az.nome) : 'Nuova azienda'}</h1><div class="spiegazione">Primo avvio guidato in 8 passi. Puoi saltarne qualcuno e riprenderlo quando vuoi da Impostazioni → Primo avvio.</div></div></div>`;
    if (!az && !q.nuova) {
      const inCorso = R.stato.aziende.filter((a) => a.primoAvvio && !a.primoAvvio.completato);
      if (inCorso.length) {
        return intestazione + `<div class="riquadro" style="max-width:720px"><h2 class="titolo-riquadro">Hai un primo avvio da finire</h2>
          <div class="elenco">${inCorso.map((a) => `<div class="riga"><span class="quadratino" style="background:${R.esc(a.colore)};color:#fff">${R.esc(sigla(a))}</span><div class="principale"><div class="titolo-riga">${R.esc(a.nome)}</div><div class="sotto">al passo ${a.primoAvvio.passo} di 8</div></div><a class="btn primario piccolo" href="#/aziende/nuova?id=${a.id}">Riprendi</a></div>`).join('')}</div>
          <a class="btn secondario-campo spazio-sopra" href="#/aziende/nuova?nuova=1">${R.icona('piu', 16)} Inizia un'altra azienda</a></div>`;
      }
    }
    const pa = az ? az.primoAvvio : null;
    let passo = az ? (q.passo === 'fine' ? 'fine' : q.passo ? +q.passo : pa.passo) : 1;
    if (az && pa.completato && !q.passo) passo = 'fine';
    if (passo === 'fine') return intestazione + fineWizard(az);
    if (!(passo >= 1 && passo <= 8)) passo = 1;
    const stepper = PASSI_WIZ.map((nome, i) => {
      const n = i + 1;
      const st = pa ? pa.stati[n] : null;
      return `<button class="${n === passo ? 'attuale' : ''}" data-azione="ge-wiz-vai" data-passo="${n}" ${n === passo ? 'aria-current="step"' : ''}><span class="n ${st || ''}">${st === 'fatto' ? R.icona('spunta', 14) : n}</span><span>${nome}</span><span class="stato">${st === 'fatto' ? 'fatto' : st === 'saltato' ? 'saltato' : ''}</span></button>`;
    }).join('');
    const piede = `<div class="ge-piede-wiz">${passo > 1 ? `<button class="btn secondario-campo sinistra" data-azione="ge-wiz-indietro">${R.icona('freccia-sinistra', 16)} Indietro</button>` : ''}${passo > 1 ? '<button class="btn secondario-campo" data-azione="ge-wiz-salta">Salta questo passo</button>' : ''}<button class="btn primario" data-azione="ge-wiz-avanti">${passo === 8 ? 'Salva e finisci' : 'Salva e continua'}</button></div>`;
    return intestazione + `<div class="ge-wizard">
      <nav class="riquadro ge-passi-wiz nascondi-telefono" style="padding:12px" aria-label="Passi del primo avvio">${stepper}</nav>
      <div class="riquadro" style="min-width:0"><div class="solo-telefono piccolo secondario" style="margin-bottom:6px">Passo ${passo} di 8${pa && pa.stati[passo] ? ' · ' + pa.stati[passo] : ''}</div>
        <h2 class="titolo-riquadro">${passo}. ${PASSI_WIZ[passo - 1]}</h2>
        <div id="ge-wiz-form">${PASSI_HTML[passo](az, pa)}</div>${piede}</div>
    </div>`;
  }
  R.rotta('/aziende/nuova', { menu: 'impostazioni', titolo: 'Nuova azienda', disegna: disegnaPrimoAvvio });

  R.azioni['ge-wiz-vai'] = (el) => {
    const { az } = wizCorrente();
    const n = +el.dataset.passo;
    if (!az && n > 1) { R.avviso('Prima scrivi il nome dell\'azienda e premi «Salva e continua»: serve per crearla'); return; }
    R.vai(`#/aziende/nuova?id=${az.id}&passo=${n}`);
  };
  R.azioni['ge-wiz-avanti'] = () => {
    const { az, pa, passo } = wizCorrente();
    const form = document.getElementById('ge-wiz-form');
    if (!form) return;
    const esito = SALVA_PASSO[passo](az, pa, R.valori(form), form);
    if (esito === false) return;
    esito.primoAvvio.stati[passo] = 'fatto';
    avanza(esito, passo);
  };
  R.azioni['ge-wiz-salta'] = () => {
    const { az, pa, passo } = wizCorrente();
    if (!az) return;
    if (pa.stati[passo] !== 'fatto') pa.stati[passo] = 'saltato';
    if (passo === 6) pa.collegando = null;
    avanza(az, passo);
    R.avviso(`Passo saltato: lo riprendi quando vuoi da Impostazioni → Primo avvio`);
  };
  R.azioni['ge-wiz-indietro'] = () => { const { az, passo } = wizCorrente(); if (az && passo > 1) R.vai(`#/aziende/nuova?id=${az.id}&passo=${passo - 1}`); };
  R.azioni['ge-wiz-bozza'] = () => {
    const form = document.getElementById('ge-wiz-form');
    if (!form) return;
    const v = R.valori(form);
    const { az } = wizCorrente();
    if (!az) { ge().bozzaAzienda = { nome: v.nome, settore: v.settore, telefono: v.telefono, email: v.email, colore: v.colore }; R.salva(); }
    const logo = document.getElementById('ge-w-logo');
    if (logo) { logo.style.background = v.colore || COLORI_AZIENDA[0]; logo.textContent = v.nome ? sigla({ nome: v.nome }) : 'AZ'; }
  };
  R.azioni['ge-wiz-logo'] = () => R.avviso('Nel prototipo il logo è simulato: usiamo le iniziali nel colore del marchio');
  R.azioni['ge-wiz-modello'] = (el) => {
    const { pa } = wizCorrente();
    if (!pa) return;
    if (pa.modello !== el.dataset.m) { pa.modello = el.dataset.m; pa.percorso = percorsoDaModello(el.dataset.m); pa.pagina = 'modello'; }
    R.salva(); R.aggiorna();
  };
  R.azioni['ge-wiz-percorso'] = (el) => {
    const { pa } = wizCorrente();
    if (!pa) return;
    const k = el.dataset.k;
    if (k === 'nome') pa.percorso.nome = el.value;
    else if (k === 'vinta') pa.percorso.vinta = el.value;
    else if (k === 'fase') pa.percorso.fasi[+el.dataset.i].nome = el.value;
    else if (k === 'colore') { pa.percorso.fasi[+el.dataset.i].colore = el.value; R.salva(); R.aggiorna(); return; }
    R.salva();
  };
  R.azioni['ge-wiz-fase'] = (el) => {
    const { pa } = wizCorrente();
    if (!pa) return;
    const f = pa.percorso.fasi;
    const i = +el.dataset.i;
    const op = el.dataset.op;
    if (op === 'aggiungi') f.push({ nome: 'Nuova fase', colore: PASTELLI[f.length % 4][0] });
    else if (op === 'elimina') { if (f.length <= 1) { R.avviso('Serve almeno una fase oltre a quelle finali'); return; } f.splice(i, 1); }
    else { const j = i + (op === 'su' ? -1 : 1); if (j < 0 || j >= f.length) { R.avviso(op === 'su' ? 'È già la prima fase' : 'È già l\'ultima fase'); return; } [f[i], f[j]] = [f[j], f[i]]; }
    R.salva(); R.aggiorna();
  };
  R.azioni['ge-wiz-invito'] = (el) => {
    const { pa } = wizCorrente();
    if (!pa) return;
    if (!pa.inviti.length) pa.inviti.push({ email: '', ruolo: 'azienda' });
    const x = pa.inviti[+el.dataset.i];
    if (x) x[el.dataset.k] = el.value.trim();
    R.salva();
  };
  R.azioni['ge-wiz-invito-piu'] = () => { const { pa } = wizCorrente(); if (!pa) return; if (!pa.inviti.length) pa.inviti.push({ email: '', ruolo: 'azienda' }); pa.inviti.push({ email: '', ruolo: 'collaboratore' }); R.salva(); R.aggiorna(); };
  R.azioni['ge-wiz-invito-togli'] = (el) => { const { pa } = wizCorrente(); if (!pa) return; pa.inviti.splice(+el.dataset.i, 1); R.salva(); R.aggiorna(); };
  R.azioni['ge-wiz-festivo-aggiungi'] = () => {
    const { pa } = wizCorrente();
    if (!pa) return;
    const form = document.getElementById('ge-wiz-form');
    const o = leggiOrario(R.valori(form), form);
    if (o) Object.assign(pa.orario, o);
    const f = leggiFestivo();
    if (!f) return;
    pa.orario.festivi = (pa.orario.festivi || []).filter((x) => x.data !== f.data).concat([f]);
    R.salva(); R.aggiorna(); R.avviso('Festivo aggiunto');
  };
  R.azioni['ge-wiz-festivo-togli'] = (el) => { const { pa } = wizCorrente(); if (!pa) return; pa.orario.festivi.splice(+el.dataset.i, 1); R.salva(); R.aggiorna(); };
  R.azioni['ge-wiz-num-nuovo'] = () => { const { pa } = wizCorrente(); if (!pa) return; pa.collegando = { fase: 'dati', nome: pa.numeri.length ? '' : 'Numero aziendale', telefono: '', crea: !pa.numeri.length }; R.salva(); R.aggiorna(); };
  R.azioni['ge-wiz-num-annulla'] = () => { const { pa } = wizCorrente(); if (!pa) return; pa.collegando = null; R.salva(); R.aggiorna(); };
  R.azioni['ge-wiz-num-a'] = () => {
    const { pa } = wizCorrente();
    const form = document.getElementById('ge-wiz-form');
    if (!pa || !form) return;
    const v = R.valori(form);
    if (!v.wnNome) { R.erroreCampo(form, 'wnNome', 'Scrivi un nome, per esempio «Numero aziendale» o il nome della persona.'); return; }
    if (v.wnTel.replace(/\D/g, '').length < 8) { R.erroreCampo(form, 'wnTel', 'Scrivi il numero completo, almeno 8 cifre.'); return; }
    if (!R.serveConnessione('il collegamento del numero')) return;
    let tel = v.wnTel.trim();
    if (!tel.startsWith('+')) tel = R.stato.impostazioni.prefisso + ' ' + tel;
    pa.collegando = { fase: 'A', nome: v.wnNome, telefono: tel, crea: !!v.wnCrea };
    R.salva(); R.aggiorna();
  };
  R.azioni['ge-wiz-num-qr'] = () => {
    const { pa } = wizCorrente();
    if (!pa || !pa.collegando) return;
    if (pa.collegando.fase === 'A') { pa.collegando.fase = 'B'; R.salva(); R.aggiorna(); return; }
    pa.numeri.push({ nome: pa.collegando.nome, telefono: pa.collegando.telefono, crea: pa.collegando.crea, statoA: 'collegato', statoB: 'pronto' });
    pa.collegando = null;
    R.salva(); R.aggiorna(); R.avviso('Numero collegato: A collegato · B pronto (simulato)');
  };
  R.azioni['ge-wiz-sd'] = (el) => { const s = document.getElementById('ge-w-sd-vedi'); if (s) s.textContent = slug(el.value) || '…'; };
  R.azioni['ge-invita-cliente'] = (el) => {
    R.chiudiTendina();
    const az = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!az) return;
    const pa = az.primoAvvio || { inviti: [] };
    const cliente = (pa.inviti || []).find((x) => x.ruolo === 'azienda') || (pa.inviti || [])[0] || { email: az.emailAzienda || '' };
    R.modale({
      titolo: `Invita il cliente in ${R.esc(az.nome)}`,
      sottotitolo: 'Riceve un\'email per creare la password. Al primo accesso accetta l\'accordo sul trattamento dei dati. Nel prototipo nessuna email parte davvero.',
      corpo: `${gruppo('Email del cliente', `<input class="campo" id="ge-ic-email" name="email" type="email" value="${R.esc(cliente.email || '')}" placeholder="nome@esempio.it">`, 'ge-ic-email')}
        <div class="etichetta-campo">Anteprima del messaggio</div>
        <div class="riquadro medio beige" style="font-size:13.5px">Ciao, ti ho preparato lo spazio di <b>${R.esc(az.nome)}</b> su Rampant. Crea la tua password da questo link e accetta l'accordo sul trattamento dei dati per iniziare. ${R.esc(R.utente().nome)}</div>
        ${(pa.inviti || []).filter((x) => x.email && x.email !== cliente.email).length ? `<p class="piccolo secondario spazio-sopra">Partono anche gli inviti a: ${R.esc(pa.inviti.filter((x) => x.email && x.email !== cliente.email).map((x) => x.email).join(', '))}.</p>` : ''}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Invia l\'invito', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!emailValida(v.email)) { R.erroreCampo(f, 'email', 'Scrivi un\'email valida, per esempio nome@esempio.it.'); return false; }
          if (!R.serveConnessione('l\'invito')) return false;
          if (az.primoAvvio) {
            if (!az.primoAvvio.inviti.some((x) => x.email === v.email)) az.primoAvvio.inviti.unshift({ email: v.email, ruolo: 'azienda' });
            az.primoAvvio.invitoInviato = R.adesso(); az.primoAvvio.invitoA = v.email;
            az.utenti = Math.max(az.utenti || 0, az.primoAvvio.inviti.filter((x) => x.email).length);
          }
          registra(`Ha invitato ${v.email} come amministratore di ${az.nome}`);
          R.salva(); R.aggiorna(); R.avviso(`Invito inviato a ${R.esc(v.email)} (simulato)`);
        },
      }],
    });
  };
  R.azioni['ge-accordo-sim'] = (el) => {
    const az = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!az) return;
    az.accordoAccettato = true;
    registra(`Il cliente di ${az.nome} ha accettato l'accordo sul trattamento dei dati`);
    R.salva(); R.aggiorna(); R.avviso('Accordo accettato (simulato): ora si può pubblicare e inviare');
  };

  /* ================= MODULI META (Lead Ads) — DECISIONI.md 6-bis, 24/10/2026 =================
     Rampant riceve i contatti di TUTTI i moduli della pagina: un modulo nuovo non collegato non perde contatti,
     li tiene in attesa e fa comparire un avviso. Offre alla Dashboard: R.bannerMeta(). */
  R.stile('gestione-meta', `
    .ge-meta-pagina { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--spazio); }
    .ge-meta-pagina .riga-impostazione { background: var(--bianco); border-radius: 18px; }
    .ge-meta-modulo { border-top: 1px solid var(--linea); padding: 16px 0; display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1.6fr) minmax(0, 1fr) 196px; gap: 16px; align-items: center; }
    .ge-meta-modulo:first-child { border-top: 0; padding-top: 4px; }
    .ge-meta-modulo .titolo-riga { font-weight: 600; font-size: 15px; }
    .ge-meta-modulo .sotto { font-size: 12.5px; color: var(--testo-2); }
    .ge-meta-modulo .dida { display: block; font-size: 11.5px; color: var(--testo-2); margin-bottom: 2px; }
    .ge-meta-modulo.archiviato { opacity: .62; }
    .ge-meta-modulo .azioni { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
    .ge-abbina { display: grid; grid-template-columns: minmax(0, 1fr) 22px minmax(0, 1fr); gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--linea); font-size: 13.5px; }
    .ge-abbina:last-child { border-bottom: 0; }
    .ge-abbina .campo { min-height: 40px; }
    .ge-meta-esito { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--linea); }
    .ge-meta-esito:last-child { border-bottom: 0; }
    @media (max-width: 1180px) { .ge-meta-modulo { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .ge-meta-modulo .azioni { justify-content: flex-start; } }
    @media (max-width: 767px) { .ge-meta-modulo, .ge-meta-pagina, .ge-abbina { grid-template-columns: minmax(0, 1fr); } .ge-abbina .freccia { display: none; } .ge-meta-esito { grid-template-columns: minmax(0, 1fr); } }
  `);
  const faMin = (min) => new Date(Date.now() - min * 60000).toISOString();
  function domandeZes(conPagatore) {
    return [
      { chiave: 'nome', etichetta: 'Nome e cognome', anagrafica: 'nome' },
      { chiave: 'telefono', etichetta: 'Numero di telefono', anagrafica: 'telefono' },
      { chiave: 'email', etichetta: 'Email', anagrafica: 'email' },
      { chiave: 'impresa', etichetta: 'Hai già un\'impresa?', risposte: ['Sì', 'No, la sto aprendo'] },
      { chiave: 'investimento', etichetta: 'Quanto vuoi investire?', risposte: ['Meno di 100.000 €', 'Da 100.000 a 500.000 €', 'Oltre 500.000 €'] },
    ].concat(conPagatore === false ? [] : [{ chiave: 'pagatore', etichetta: 'Hai segnalazioni come cattivo pagatore?', risposte: ['No', 'Sì'] }]);
  }
  const PREDEFINITE_META = () => ({ fase: 'p1|f1', responsabile: 'turno', automazione: 'au1', etichette: '', promemoria: 'si' });
  function metaIniziale() {
    const g = R.giorniDa;
    const lead = (nome, tel, risposte, min, fonte) => ({ id: R.id('ld'), nome, telefono: tel, email: nome.toLowerCase().replace(/[^a-z]+/g, '.') + '@esempio.it', fonte: fonte || 'Facebook', consensoWA: true, consensoEmail: false, risposte, quando: faMin(min) });
    return {
      pagina: 'Inizio Impresa – Finanza agevolata', idPagina: '104857362918274', semaforo: 'verde', ultimaProva: faMin(12), bm: 'verificato', app: 'revisione',
      autoCollega: { attivo: false, daModulo: null },
      moduli: [
        { id: 'mm1', nome: 'ZES 2026 – modulo verifica (ottobre)', codice: '1084729365520194', stato: 'collegato', creato: g(-23, '10:00'), campagna: 'ZES 2026', domande: domandeZes(),
          abbinamenti: { impresa: 'storia', investimento: 'campo:Investimento previsto', pagatore: 'storia' }, consensoWA: 'casella', consensoEmail: 'casella', predefinite: PREDEFINITE_META(),
          regole: [
            { id: 'rg-mm1-1', modo: 'tutte', condizioni: [{ domanda: 'pagatore', operatore: 'uguale', valore: 'Sì' }], azioni: { fase: 'p1|f6', etichette: 'non finanziabile', automazione: 'nessuna', promemoria: 'no' } },
            { id: 'rg-mm1-2', modo: 'tutte', condizioni: [{ domanda: 'investimento', operatore: 'uguale', valore: 'Oltre 500.000 €' }], azioni: { responsabile: 'u1', etichette: 'alto valore' } },
          ],
          contattiMeta: 46, ricevuti: 46, ultimo: faMin(140), inAttesa: [] },
        { id: 'mm2', nome: 'Resto al Sud 2.0 – modulo giovani', codice: '2219034718846602', stato: 'collegato', creato: g(-40, '09:30'), campagna: 'Resto al Sud',
          domande: [{ chiave: 'nome', etichetta: 'Nome e cognome', anagrafica: 'nome' }, { chiave: 'telefono', etichetta: 'Numero di telefono', anagrafica: 'telefono' }, { chiave: 'email', etichetta: 'Email', anagrafica: 'email' },
            { chiave: 'eta', etichetta: 'Quanti anni hai?', risposte: ['18–35', '36–55', 'Più di 55'] }, { chiave: 'regione', etichetta: 'In quale regione vuoi aprire?', risposte: ['Campania', 'Puglia', 'Calabria', 'Sicilia', 'Altra regione'] }],
          abbinamenti: { eta: 'storia', regione: 'campo:Regione' }, consensoWA: 'casella', consensoEmail: 'casella', predefinite: Object.assign(PREDEFINITE_META(), { responsabile: 'u3' }),
          regole: [{ id: 'rg-mm2-1', modo: 'tutte', condizioni: [{ domanda: 'eta', operatore: 'uguale', valore: 'Più di 55' }], azioni: { etichette: 'verificare i requisiti di età' } }],
          contattiMeta: 28, ricevuti: 28, ultimo: faMin(60 * 26), inAttesa: [] },
        { id: 'mm3', nome: 'ZES 2026 – modulo verifica (copia 24/10)', codice: '1093318842267715', stato: 'non-collegato', creato: faMin(55), campagna: 'ZES 2026', domande: domandeZes(), simileA: 'mm1',
          abbinamenti: {}, consensoWA: 'casella', consensoEmail: 'casella', predefinite: null, regole: [], contattiMeta: 3, ricevuti: 0, ultimo: faMin(9),
          inAttesa: [
            lead('Davide Esposito', '+39 333 410 2281', { impresa: 'Sì', investimento: 'Da 100.000 a 500.000 €', pagatore: 'No' }, 41),
            lead('Rosaria Ferraro', '+39 347 552 8013', { impresa: 'Sì', investimento: 'Oltre 500.000 €', pagatore: 'No' }, 22, 'Instagram'),
            lead('Gennaro Vitale', '+39 338 760 1946', { impresa: 'No, la sto aprendo', investimento: 'Meno di 100.000 €', pagatore: 'Sì' }, 9),
          ] },
        { id: 'mm4', nome: 'ZES 2026 – modulo (settembre)', codice: '9902184473310051', stato: 'archiviato', creato: g(-55, '10:00'), campagna: 'ZES 2026', domande: domandeZes(false),
          abbinamenti: { impresa: 'storia', investimento: 'campo:Investimento previsto' }, consensoWA: 'casella', consensoEmail: 'casella', predefinite: PREDEFINITE_META(), regole: [], contattiMeta: 61, ricevuti: 61, ultimo: g(-24, '18:40'), inAttesa: [] },
      ],
    };
  }
  const meta = () => prepara().meta;
  const moduloMeta = (id) => meta().moduli.find((m) => m.id === id);
  const domandeRegole = (m) => m.domande.filter((d) => !d.anagrafica).map((d) => ({ chiave: d.chiave, etichetta: d.etichetta, risposte: d.risposte || [] }));
  const codiceLeggibile = (c) => String(c).replace(/(\d{4})(?=\d)/g, '$1 ');
  const nonCollegati = () => meta().moduli.filter((m) => m.stato === 'non-collegato');
  const tuttiAmministratori = () => R.stato.utenti.filter((u) => ['generale', 'azienda'].includes(u.ruolo) && u.stato === 'attivo').map((u) => u.id);
  const ETICHETTA_STATO_META = { collegato: ['salvia', 'Collegato'], 'non-collegato': ['errore', 'Non collegato'], archiviato: ['', 'Archiviato in Meta'] };

  /* Fa entrare un contatto di un modulo collegato, con le sue regole di qualificazione. */
  function entraLead(m, l) {
    const risposte = {}, testi = {};
    m.domande.filter((d) => !d.anagrafica).forEach((d) => { const v = (l.risposte || {})[d.chiave]; if (v != null && v !== '') { risposte[d.chiave] = v; testi[d.etichetta] = v; } });
    const e = R.applicaRegole(m.regole || [], risposte, Object.assign(PREDEFINITE_META(), m.predefinite || {}));
    const descr = R.descriviAzioni(e.azioni);
    const r = R.nuovoContattoDaModulo({
      nome: l.nome, telefono: l.telefono, email: l.email,
      consensoWhatsapp: m.consensoWA === 'casella' && !!l.consensoWA, consensoEmail: m.consensoEmail === 'casella' && !!l.consensoEmail,
      campagna: m.campagna || '', pagina: '', fonte: l.fonte || 'Facebook', moduloMeta: m.nome, risposte: testi, azioni: e.azioni,
      regola: e.numero ? `Regola ${e.numero} del modulo Meta «${m.nome}»: ${descr}` : `Nessuna regola corrisponde: impostazioni predefinite del modulo Meta «${m.nome}» (${descr})`,
    });
    Object.entries(m.abbinamenti || {}).forEach(([k, dest]) => {
      if (risposte[k] == null || !r || !r.contatto) return;
      const d = m.domande.find((x) => x.chiave === k);
      const nomeCampo = dest === 'nuovo' ? (d ? d.etichetta : k) : dest.startsWith('campo:') ? dest.slice(6) : null;
      if (!nomeCampo) return;
      r.contatto.campi = Object.assign({}, r.contatto.campi, { [nomeCampo]: risposte[k] });
      if (nomeCampo === 'Regione' && !r.contatto.regione) r.contatto.regione = risposte[k];
    });
    m.ultimo = R.adesso();
    R.salva();
    return { r, e, descr, lead: l };
  }
  function rigaMetaCollegamenti(c) {
    const me = meta();
    const attesa = nonCollegati();
    const n = attesa.reduce((s, m) => s + m.inAttesa.length, 0);
    let semaforo, testo;
    if (me.semaforo !== 'verde') { semaforo = 'rosso'; testo = 'La pagina Facebook non risponde: ricollegala'; }
    else if (attesa.length) { semaforo = 'giallo'; testo = `${plurale(attesa.length, 'modulo nuovo non collegato', 'moduli nuovi non collegati')}${n ? ' · ' + plurale(n, 'contatto', 'contatti') + ' in attesa' : ''}`; }
    else if (me.app !== 'approvata') { semaforo = 'giallo'; testo = `Pagina «${me.pagina}» collegata · app in revisione da Meta: intanto i contatti arrivano con il ripiego (Pabbly)`; }
    else { semaforo = 'verde'; testo = `Pagina «${me.pagina}» collegata · ${plurale(me.moduli.filter((m) => m.stato === 'collegato').length, 'modulo collegato', 'moduli collegati')}`; }
    return Object.assign({}, c, { nome: 'Moduli pubblicitari Meta (Facebook e Instagram)', semaforo, testo, ultima: me.ultimaProva });
  }
  /* Banner per la Dashboard (solo amministratori): modulo Meta nuovo non collegato. */
  R.bannerMeta = () => {
    if (!R.stato || !R.stato.utenti || !R.amministratore()) return '';
    prepara();
    return nonCollegati().map((m) => {
      const n = m.inAttesa.length;
      const titolo = m.collegatoIl ? 'Modulo Meta scollegato' : 'Nuovo modulo Meta non collegato';
      return `<div class="banner ${n ? 'rosso' : 'giallo'}">${R.icona('social')}<div class="principale"><b>${titolo}: «${R.esc(m.nome)}»${n ? ` · ${plurale(n, 'contatto', 'contatti')} in attesa` : ''}.</b> ${n ? 'Collegalo per farli entrare: nessun contatto va perso.' : 'Collegalo: se nel frattempo arrivano contatti restano in attesa, nessuno va perso.'}</div><button class="btn piccolo ${n ? 'rosso' : ''}" data-azione="ge-meta-collega" data-id="${m.id}">Collega</button></div>`;
    }).join('');
  };

  let simMeta = { modulo: 'mm1', ultimo: null };
  function sezMeta() {
    const me = meta();
    const auto = me.autoCollega.attivo ? moduloMeta(me.autoCollega.daModulo) : null;
    const daControllare = me.moduli.filter((m) => m.collegatoDa === 'auto' && !m.controllato);
    const moduli = me.moduli.slice().sort((a, b) => ({ 'non-collegato': 0, collegato: 1, archiviato: 2 }[a.stato] - { 'non-collegato': 0, collegato: 1, archiviato: 2 }[b.stato]));
    const rigaModulo = (m) => {
      const et = ETICHETTA_STATO_META[m.stato];
      const ok = m.ricevuti === m.contattiMeta;
      const dove = m.stato === 'collegato' ? `${R.esc(R.descriviAzioni(Object.assign(PREDEFINITE_META(), m.predefinite || {})))}${(m.regole || []).length ? ` · <b>${plurale(m.regole.length, 'regola', 'regole')} di qualificazione</b>` : ''}`
        : m.stato === 'non-collegato' ? `<b style="color:var(--errore-t)">Da nessuna parte: ${m.inAttesa.length ? 'i contatti restano in attesa' : 'i prossimi contatti resteranno in attesa'}</b>` : 'Non riceve più contatti';
      const azioni = m.stato === 'collegato' ? `<button class="btn piccolo secondario-campo" data-azione="ge-meta-collega" data-id="${m.id}">Modifica</button><button class="btn piccolo secondario-campo" data-azione="ge-meta-scollega" data-id="${m.id}">Scollega</button>`
        : m.stato === 'non-collegato' ? `<button class="btn piccolo ${m.inAttesa.length ? 'rosso' : 'primario'}" data-azione="ge-meta-collega" data-id="${m.id}">Collega</button>` : '';
      return `<div class="ge-meta-modulo ${m.stato}">
        <div><div class="titolo-riga">${R.esc(m.nome)}</div><div class="sotto">Codice ${codiceLeggibile(m.codice)}</div>
          <div class="riga-flex" style="gap:6px;margin-top:6px"><span class="etichetta ${et[0]}"><span class="puntino"></span>${et[1]}</span>${m.collegatoDa === 'auto' ? '<span class="etichetta lavanda">collegato da solo</span>' : ''}</div></div>
        <div><span class="dida">Dove manda i contatti</span><span style="font-size:13.5px">${dove}</span></div>
        <div><span class="dida">Contatti arrivati</span><b>${m.ricevuti}</b>${m.ultimo ? ` <span class="piccolo secondario">· ultimo ${R.esc(quandoMinuscolo(m.ultimo))}</span>` : ''}
          <div style="margin-top:6px"><span class="etichetta ${ok ? 'salvia' : 'errore'}">Ricevuti in Rampant ${m.ricevuti} su ${m.contattiMeta} in Meta</span></div></div>
        <div class="azioni">${azioni}</div>
      </div>`;
    };
    const sim = moduloMeta(simMeta.modulo) && moduloMeta(simMeta.modulo).stato !== 'archiviato' ? moduloMeta(simMeta.modulo) : me.moduli.find((m) => m.stato !== 'archiviato');
    const u = simMeta.ultimo;
    return `${R.bannerMeta()}
      ${daControllare.map((m) => `<div class="banner giallo">${R.icona('social')}<div class="principale"><b>Modulo nuovo collegato da solo: «${R.esc(m.nome)}».</b> Ha preso le impostazioni di «${R.esc((moduloMeta(m.copiatoDa) || {}).nome || 'un altro modulo')}»: controlla che vadano bene.</div><button class="btn piccolo" data-azione="ge-meta-collega" data-id="${m.id}">Controlla</button><button class="btn piccolo" data-azione="ge-meta-controllato" data-id="${m.id}">Va bene così</button></div>`).join('')}
      <div class="riquadro">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Moduli Meta</h2><span class="etichetta ${me.semaforo === 'verde' ? 'salvia' : 'errore'}"><span class="puntino"></span>${me.semaforo === 'verde' ? 'Pagina collegata' : 'Pagina da ricollegare'}</span></div>
        <p class="secondario" style="margin-top:-6px">I contatti dei moduli pubblicitari di Facebook e Instagram entrano qui da soli, senza Pabbly né Bitrix. Rampant riceve i contatti di tutti i moduli della pagina: se in Meta nasce un modulo nuovo, te lo segnala e nessun contatto va perso.</p>
        <div class="ge-meta-pagina">
          <div class="riquadro medio beige">
            <div class="riga-flex" style="flex-wrap:nowrap;align-items:flex-start"><span class="ge-semaforo ${me.semaforo === 'verde' ? 'verde' : 'rosso'}" style="margin-top:5px" aria-hidden="true"></span><div style="min-width:0"><div class="grassetto">${R.esc(me.pagina)}</div><div class="piccolo secondario">Pagina Facebook · codice ${codiceLeggibile(me.idPagina)} · ultima prova riuscita ${R.esc(quandoMinuscolo(me.ultimaProva))}</div></div></div>
            <div class="riga-flex spazio-sopra"><button class="btn piccolo" data-azione="ge-meta-ricollega">${R.icona('ricarica', 16)} Ricollega</button><button class="btn piccolo" data-azione="ge-meta-prova-pagina">Prova ora</button></div>
          </div>
          <div class="riquadro medio beige">
            <div class="riga-impostazione"><span>Business Manager di Meta</span><span class="etichetta salvia">Verificato</span></div>
            <div class="riga-impostazione"><span>App Rampant</span><span class="etichetta ${me.app === 'approvata' ? 'salvia' : 'pesca'}">${me.app === 'approvata' ? 'Approvata da Meta' : 'In revisione da Meta'}</span></div>
            <p class="piccolo secondario" style="margin:6px 4px 0">${me.app === 'approvata' ? 'I contatti arrivano direttamente da Meta, in pochi secondi.' : 'Finché Meta non approva l\'app, i contatti arrivano con il ripiego (Pabbly, Zapier o Make) e li vedi qui lo stesso. Nel prototipo il collegamento diretto è simulato.'}</p>
          </div>
        </div>
        <div class="riga-impostazione spazio-sopra" style="border-radius:20px"><span><b>Moduli nuovi della pagina</b><br><span class="piccolo secondario">${auto ? `Si collegano da soli con le impostazioni di «${R.esc(auto.nome)}». Ti avvisiamo per un controllo.` : 'Restano in attesa finché non li colleghi: ti avvisiamo subito e i contatti non si perdono.'}</span></span>${auto ? '<button class="btn piccolo" style="background:#fff" data-azione="ge-meta-auto-spegni">Spegni</button>' : ''}</div>
      </div>
      <div class="riquadro spazio-sopra">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Moduli della pagina</h2><span class="secondario piccolo">${plurale(me.moduli.filter((m) => m.stato === 'collegato').length, 'collegato', 'collegati')} · ${plurale(nonCollegati().length, 'da collegare', 'da collegare')}</span></div>
        <div>${moduli.map(rigaModulo).join('')}</div>
      </div>
      <div class="riquadro tratteggiato spazio-sopra" id="ge-meta-sim">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro piccolo">Prova del prototipo</h2><span class="etichetta">solo nel prototipo</span></div>
        <p class="secondario" style="margin-top:-6px">Simula un contatto che compila un modulo su Facebook o Instagram: scegli le risposte oppure lasciale a caso e guarda dove lo mandano le regole.</p>
        <div class="griglia g-3">
          ${gruppo('Modulo', scelta('id="ge-ms-modulo" data-cambia="ge-meta-sim-modulo"', me.moduli.filter((m) => m.stato !== 'archiviato').map((m) => [m.id, m.nome + (m.stato === 'collegato' ? '' : ' (non collegato)')]), sim.id), 'ge-ms-modulo')}
          ${gruppo('Arriva da', scelta('id="ge-ms-fonte" name="fonte"', [['Facebook', 'Facebook'], ['Instagram', 'Instagram']], 'Facebook'), 'ge-ms-fonte')}
          ${domandeRegole(sim).map((d) => gruppo(R.esc(d.etichetta), scelta(`id="ge-ms-${d.chiave}" name="ms_${d.chiave}"`, [['', 'A caso']].concat(d.risposte.map((x) => [x, x])), ''), 'ge-ms-' + d.chiave)).join('')}
        </div>
        <div class="riga-flex">
          <button class="btn primario" data-azione="ge-meta-sim">Simula: arriva un contatto da Meta</button>
          <button class="btn" data-azione="ge-meta-nuovo-modulo">Simula: in Meta nasce un modulo nuovo</button>
          <button class="btn" data-azione="ge-meta-app">${me.app === 'approvata' ? 'Simula: app di nuovo in revisione' : 'Simula: Meta approva l\'app'}</button>
        </div>
        ${u ? `<div class="riquadro medio beige spazio-sopra"><div class="piccolo secondario">Ultimo contatto simulato</div>
          <div class="grassetto" style="margin:2px 0">${R.esc(u.nome)} · ${R.esc(u.modulo)}</div>
          <div style="font-size:13.5px">${u.attesa ? 'Modulo non collegato: è in attesa, entrerà quando lo colleghi.' : `${u.numero ? 'Regola ' + u.numero : 'Nessuna regola: impostazioni predefinite'} → ${R.esc(u.descr)}`}</div>
          ${u.contatto ? `<a class="link verde" href="#/contatto/${u.contatto}">Apri il contatto</a>` : ''}</div>` : ''}
      </div>`;
  }

  /* ---------- Finestra «Collega modulo» (anche «Modifica») ---------- */
  let bozzaMeta = null;
  const CAMPI_META = [['storia', 'Salva solo nella storia'], ['campo:Bando di interesse', 'Campo «Bando di interesse»'], ['campo:Investimento previsto', 'Campo «Investimento previsto»'], ['campo:Regione', 'Campo «Regione»'], ['nuovo', 'Nuovo campo personalizzato']];
  function predefiniteDalForm() {
    const f = R.modaleAperta();
    if (!f) return PREDEFINITE_META();
    const v = R.valori(f);
    return { fase: v.pd_fase || 'p1|f1', responsabile: v.pd_resp || 'turno', automazione: v.pd_auto || 'au1', etichette: v.pd_et || '', promemoria: v.pd_prom || 'si' };
  }
  function finestraCollegaMeta(m) {
    if (!m || m.stato === 'archiviato') return;
    const me = meta();
    const nuovo = m.stato !== 'collegato';
    const simile = nuovo && m.simileA ? moduloMeta(m.simileA) : null;
    const origine = m.predefinite ? m : simile && simile.predefinite ? simile : null;
    bozzaMeta = { id: m.id, regole: clona((origine && origine.regole) || []).map((r) => Object.assign(r, { id: R.id('rg') })) };
    const pd = Object.assign(PREDEFINITE_META(), (origine || {}).predefinite || {});
    const abb = Object.assign({}, (origine || {}).abbinamenti, m.abbinamenti);
    const autoAcceso = nuovo ? true : me.autoCollega.attivo && me.autoCollega.daModulo === m.id;
    const fasi = [];
    R.stato.percorsi.forEach((p) => p.fasi.forEach((f) => fasi.push([p.id + '|' + f.id, p.nome + ' · ' + f.nome])));
    const persone = R.stato.utenti.filter((x) => x.stato === 'attivo');
    const autos = R.stato.automazioni.filter((a) => !a.eliminata);
    const n = m.inAttesa.length;
    const righe = m.domande.map((d) => (d.anagrafica
      ? `<div class="ge-abbina"><span>${R.esc(d.etichetta)}</span><span class="freccia secondario">${R.icona('freccia', 16)}</span><span><b>${{ nome: 'Nome', telefono: 'Telefono (con prefisso)', email: 'Email' }[d.anagrafica]}</b> <span class="etichetta salvia">riconosciuto da solo</span></span></div>`
      : `<div class="ge-abbina"><label for="ge-ab-${d.chiave}">${R.esc(d.etichetta)}</label><span class="freccia secondario">${R.icona('freccia', 16)}</span>${scelta(`id="ge-ab-${d.chiave}" name="ab_${d.chiave}"`, CAMPI_META.map(([v, t]) => [v, v === 'nuovo' ? `${t} «${d.etichetta}»` : t]), abb[d.chiave] || 'storia')}</div>`)).join('');
    const titoletto = (t) => `<h3 class="titolo-riquadro piccolo" style="margin:20px 0 8px">${t}</h3>`;
    const corpo = `
      ${simile && nuovo && !m.predefinite ? `<div class="banner ge-banner-info">${R.icona('copia')}<div class="principale">Ha le stesse domande di «${R.esc(simile.nome)}»: abbiamo già copiato le sue impostazioni e le sue regole. Controlla e conferma.</div></div>` : ''}
      ${n ? `<div class="banner giallo">${R.icona('persone')}<div class="principale"><b>${plurale(n, 'contatto è in attesa', 'contatti sono in attesa')}.</b> Alla conferma entrano subito, con le impostazioni e le regole qui sotto.</div></div>` : ''}
      <div class="riga-impostazione"><span>Azienda</span><span class="valore">${R.esc(R.azienda().nome)}</span></div>
      <div class="riga-impostazione"><label for="ge-mc-camp">Campagna (per «Da dove arrivano»)</label><input class="campo" id="ge-mc-camp" name="campagna" value="${R.esc(m.campagna || '')}" style="max-width:220px;min-height:38px;background-color:#fff"></div>
      ${titoletto('Abbinamento delle domande')}
      <div>${righe}</div>
      ${titoletto('Consenso')}
      <p class="piccolo secondario" style="margin-top:-4px">Il modulo Meta ha l'informativa privacy obbligatoria e due caselle facoltative: «Accetto di essere contattato su WhatsApp» e «… per email». Senza la casella il consenso resta «Non registrato».</p>
      <div class="griglia g-2">${gruppo('WhatsApp', scelta('id="ge-mc-wa" name="cWA"', [['casella', 'Sì se ha spuntato la casella'], ['non-registrato', 'Sempre «Non registrato»']], m.consensoWA || 'casella'), 'ge-mc-wa')}${gruppo('Email', scelta('id="ge-mc-em" name="cEm"', [['casella', 'Sì se ha spuntato la casella'], ['non-registrato', 'Sempre «Non registrato»']], m.consensoEmail || 'casella'), 'ge-mc-em')}</div>
      ${titoletto('Dove vanno i contatti (impostazioni predefinite)')}
      <div class="griglia g-2">
        ${gruppo('Percorso e fase', scelta('id="ge-pd-fase" name="pd_fase"', fasi, pd.fase), 'ge-pd-fase')}
        ${gruppo('Responsabile', scelta('id="ge-pd-resp" name="pd_resp"', [['turno', 'A turno'], ['nessuno', 'Nessuno: lo assegnano gli amministratori']].concat(persone.map((x) => [x.id, x.nome])), pd.responsabile), 'ge-pd-resp')}
        ${gruppo('Automazione', scelta('id="ge-pd-auto" name="pd_auto"', [['nessuna', 'Nessuna']].concat(autos.map((a) => [a.id, a.nome])), pd.automazione), 'ge-pd-auto')}
        ${gruppo('Promemoria «richiamare entro 1 ora»', scelta('id="ge-pd-prom" name="pd_prom"', [['si', 'Sì'], ['no', 'No']], pd.promemoria), 'ge-pd-prom')}
        ${gruppo('Etichetta (facoltativa)', `<input class="campo" id="ge-pd-et" name="pd_et" value="${R.esc(pd.etichette || '')}" placeholder="es. ZES ottobre">`, 'ge-pd-et')}
      </div>
      ${titoletto('Regole di qualificazione')}
      <p class="piccolo secondario" style="margin-top:-4px">Se il contatto risponde così, mandalo lì. Vale la prima regola che corrisponde; altrimenti valgono le impostazioni predefinite qui sopra.</p>
      ${R.editorRegole({ chiave: 'ge-meta-' + m.id, regole: bozzaMeta.regole, domande: domandeRegole(m), alCambio: (r) => { if (bozzaMeta) bozzaMeta.regole = r; }, predefinite: predefiniteDalForm })}
      <div id="ge-meta-prova-regole"></div>
      <div class="riga-impostazione spazio-sopra" style="border-radius:20px"><span><b>Collega automaticamente i nuovi moduli di questa pagina con queste impostazioni</b><br><span class="piccolo secondario">Se modifichi il modulo in Meta e ne nasce uno nuovo, i contatti entrano lo stesso. Ti avvisiamo comunque per un controllo.</span></span>${interruttore('name="auto" aria-label="Collega automaticamente i nuovi moduli"', autoAcceso)}</div>`;
    R.modale({
      titolo: `${nuovo ? 'Collega' : 'Modifica'} «${R.esc(m.nome)}»`,
      sottotitolo: `Codice del modulo ${codiceLeggibile(m.codice)} · pagina ${R.esc(me.pagina)}`,
      classe: 'larga',
      proteggi: true,
      corpo,
      alChiudere: () => { bozzaMeta = null; },
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: nuovo ? (n ? `Collega e fai entrare ${plurale(n, 'contatto', 'contatti')}` : 'Collega') : 'Salva', classe: 'primario', fai: (f) => salvaCollegamentoMeta(m, f) }],
    });
  }
  function salvaCollegamentoMeta(m, f) {
    if (!bozzaMeta) return false;
    const incompleta = bozzaMeta.regole.findIndex((r) => !(r.condizioni || []).some((c) => c.domanda && (['compilato', 'vuoto'].includes(c.operatore) || String(c.valore || '').trim())));
    if (incompleta >= 0) { R.avviso(`La regola ${incompleta + 1} non ha una condizione completa: scegli domanda e risposta, oppure eliminala`); return false; }
    if (!R.serveConnessione('il collegamento del modulo')) return false;
    const v = R.valori(f);
    const me = meta();
    const prima = m.stato;
    m.abbinamenti = {};
    m.domande.filter((d) => !d.anagrafica).forEach((d) => { m.abbinamenti[d.chiave] = v['ab_' + d.chiave] || 'storia'; });
    m.consensoWA = v.cWA; m.consensoEmail = v.cEm; m.campagna = v.campagna;
    m.predefinite = predefiniteDalForm();
    m.regole = clona(bozzaMeta.regole);
    m.stato = 'collegato';
    if (prima !== 'collegato') m.collegatoIl = R.adesso();
    m.controllato = true;
    if (v.auto) me.autoCollega = { attivo: true, daModulo: m.id };
    else if (me.autoCollega.daModulo === m.id) me.autoCollega = { attivo: false, daModulo: null };
    const esiti = m.inAttesa.splice(0).map((l) => entraLead(m, l));
    m.ricevuti += esiti.length;
    (R.stato.notifiche || []).forEach((no) => { if (no.link === '#/impostazioni/meta' && no.testo.includes(m.nome)) no.letta = true; });
    registra(`Ha ${prima === 'collegato' ? 'modificato' : 'collegato'} il modulo Meta «${m.nome}»${esiti.length ? ` (entrati ${esiti.length} contatti in attesa)` : ''}`);
    bozzaMeta = null;
    R.salva(); R.aggiorna();
    if (!esiti.length) { R.avviso(prima === 'collegato' ? 'Impostazioni del modulo salvate' : 'Modulo collegato: i prossimi contatti entrano da soli'); return; }
    R.modale({
      titolo: `Entrati ${plurale(esiti.length, 'contatto', 'contatti')}`,
      sottotitolo: `«${R.esc(m.nome)}» è collegato. Ecco dove li hanno mandati le regole.`,
      corpo: esiti.map((x) => { const c = x.r && x.r.contatto; return `<div class="ge-meta-esito"><div><div class="grassetto">${R.esc(x.lead.nome)}</div><div class="piccolo secondario">${x.e.numero ? 'Regola ' + x.e.numero : 'Nessuna regola: impostazioni predefinite'} → ${R.esc(x.descr)}</div></div>${c ? `<a class="btn piccolo secondario-campo" href="#/contatto/${c.id}">Apri il contatto</a>` : ''}</div>`; }).join(''),
      pulsanti: [{ testo: 'Ho capito', classe: 'primario', chiudi: true }],
    });
  }
  /* «Prova le regole» dentro la finestra del modulo Meta: si prova lì, senza chiudere la finestra. */
  const provaRegoleOriginale = R.azioni['re-prova'];
  R.azioni['re-prova'] = (el) => {
    if (!String(el.dataset.k || '').startsWith('ge-meta-') || !bozzaMeta) { if (provaRegoleOriginale) provaRegoleOriginale(el); return; }
    const box = document.getElementById('ge-meta-prova-regole');
    if (!box) return;
    if (box.innerHTML.trim()) { box.innerHTML = ''; return; }
    const m = moduloMeta(bozzaMeta.id);
    box.innerHTML = `<div class="riquadro medio beige spazio-sopra"><div class="grassetto" style="margin-bottom:8px">Prova le regole con risposte finte</div>
      <div class="griglia g-3">${domandeRegole(m).map((d) => gruppo(R.esc(d.etichetta), scelta(`id="ge-pr-${d.chiave}" name="pr_${d.chiave}" data-cambia="ge-meta-prova-calcola" style="background-color:#fff"`, [['', 'nessuna risposta']].concat(d.risposte.map((x) => [x, x])), ''), 'ge-pr-' + d.chiave)).join('')}</div>
      <div class="riquadro scuro" id="ge-meta-esito-prova" style="padding:14px 16px"></div><p class="piccolo secondario" style="margin:8px 4px 0">Non si crea nessun contatto.</p></div>`;
    R.azioni['ge-meta-prova-calcola']();
  };
  R.azioni['ge-meta-prova-calcola'] = () => {
    const box = document.getElementById('ge-meta-esito-prova');
    if (!box || !bozzaMeta) return;
    const v = R.valori(document.getElementById('ge-meta-prova-regole'));
    const risposte = {};
    Object.keys(v).forEach((k) => { if (k.startsWith('pr_') && v[k]) risposte[k.slice(3)] = v[k]; });
    const e = R.applicaRegole(bozzaMeta.regole, risposte, predefiniteDalForm());
    box.innerHTML = `<div style="color:var(--lime);font-size:12.5px">${e.numero ? 'Vale la regola ' + e.numero : 'Nessuna regola corrisponde: valgono le impostazioni predefinite'}</div><div class="grassetto" style="margin-top:4px">${R.esc(R.descriviAzioni(e.azioni))}</div>`;
  };

  /* ---------- Azioni della sezione ---------- */
  R.azioni['ge-meta-collega'] = (el) => {
    const m = moduloMeta(el.dataset.id);
    if (!m) return;
    if (!R.amministratore()) { R.avviso('Solo gli amministratori collegano i moduli Meta'); return; }
    if (R.posizione().percorso !== '/impostazioni/meta') { R.vai('#/impostazioni/meta'); setTimeout(() => finestraCollegaMeta(m), 160); } else finestraCollegaMeta(m);
  };
  R.azioni['ge-meta-scollega'] = (el) => {
    const m = moduloMeta(el.dataset.id);
    if (!m) return;
    R.modale({
      titolo: `Scollegare «${R.esc(m.nome)}»?`,
      sottotitolo: 'I nuovi contatti di questo modulo resteranno in attesa finché non lo ricolleghi: nessuno va perso. I contatti già entrati restano dove sono.',
      classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Scollega', classe: 'rosso', fai: () => {
          m.stato = 'non-collegato'; delete m.collegatoDa;
          const me = meta();
          if (me.autoCollega.daModulo === m.id) me.autoCollega = { attivo: false, daModulo: null };
          registra(`Ha scollegato il modulo Meta «${m.nome}»`);
          R.salva(); R.aggiorna(); R.avviso('Modulo scollegato: i nuovi contatti restano in attesa');
        },
      }],
    });
  };
  R.azioni['ge-meta-controllato'] = (el) => { const m = moduloMeta(el.dataset.id); if (!m) return; m.controllato = true; R.salva(); R.aggiorna(); R.avviso('Segnato come controllato'); };
  R.azioni['ge-meta-auto-spegni'] = () => {
    const me = meta();
    const prima = Object.assign({}, me.autoCollega);
    me.autoCollega = { attivo: false, daModulo: null };
    R.salva(); R.aggiorna();
    R.avviso('I moduli nuovi resteranno in attesa finché non li colleghi', { annulla: () => { me.autoCollega = prima; R.salva(); R.aggiorna(); } });
  };
  R.azioni['ge-meta-ricollega'] = () => {
    const me = meta();
    R.modale({
      titolo: 'Ricollega la pagina Facebook',
      sottotitolo: 'Tre passi semplici. Nel prototipo il collegamento è simulato.',
      corpo: `<ol class="ge-ordine">${ISTRUZIONI.meta.map((t, i) => `<li><span class="n">${i + 1}</span><span>${R.esc(t)}</span></li>`).join('')}</ol>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Simula: collegamento riuscito', classe: 'primario', fai: () => {
          if (!R.serveConnessione('il collegamento')) return false;
          me.semaforo = 'verde'; me.ultimaProva = R.adesso();
          registra(`Ha ricollegato la pagina Facebook «${me.pagina}»`);
          R.salva(); R.aggiorna(); R.avviso(`Pagina ricollegata: vediamo ${plurale(me.moduli.filter((m) => m.stato !== 'archiviato').length, 'modulo attivo', 'moduli attivi')}`);
        },
      }],
    });
  };
  R.azioni['ge-meta-prova-pagina'] = () => {
    if (!R.serveConnessione('la prova del collegamento')) return;
    const me = meta();
    me.ultimaProva = R.adesso(); R.salva(); R.aggiorna();
    R.avviso(`Prova riuscita: la pagina risponde e vediamo ${plurale(me.moduli.filter((m) => m.stato !== 'archiviato').length, 'modulo attivo', 'moduli attivi')}`);
  };
  R.azioni['ge-meta-app'] = () => {
    const me = meta();
    me.app = me.app === 'approvata' ? 'revisione' : 'approvata';
    if (me.app === 'approvata') R.notifica('Meta ha approvato l\'app: i contatti dei moduli arrivano direttamente, senza ripiego', '#/impostazioni/meta', 'u1');
    R.salva(); R.aggiorna();
    R.avviso(me.app === 'approvata' ? 'Simulazione: app approvata da Meta' : 'Simulazione: app di nuovo in revisione');
  };
  R.azioni['ge-meta-sim-modulo'] = (el) => { simMeta.modulo = el.value; R.aggiorna(); };
  const NOMI_META = ['Davide', 'Rosaria', 'Chiara', 'Pasquale', 'Ilaria', 'Vincenzo', 'Marta', 'Ciro', 'Federica', 'Raffaele', 'Giusy', 'Alessandro'];
  const COGNOMI_META = ['Romano', 'Caruso', 'Greco', 'Marino', 'Rizzo', 'Bruno', 'Gallo', 'De Luca', 'Mancini', 'Longo', 'Costa', 'Fontana'];
  const aCaso = (lista) => lista[Math.floor(Math.random() * lista.length)];
  const cifre = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
  R.azioni['ge-meta-sim'] = () => {
    const box = document.getElementById('ge-meta-sim');
    const m = moduloMeta((document.getElementById('ge-ms-modulo') || {}).value || simMeta.modulo);
    if (!box || !m) return;
    const v = R.valori(box);
    const risposte = {};
    domandeRegole(m).forEach((d) => { risposte[d.chiave] = v['ms_' + d.chiave] || aCaso(d.risposte); });
    const nome = aCaso(NOMI_META) + ' ' + aCaso(COGNOMI_META);
    const l = { id: R.id('ld'), nome, telefono: `+39 3${20 + Math.floor(Math.random() * 79)} ${cifre(3)} ${cifre(4)}`, email: nome.toLowerCase().replace(/[^a-z]+/g, '.') + '@esempio.it', fonte: v.fonte || 'Facebook', consensoWA: Math.random() < 0.8, consensoEmail: Math.random() < 0.6, risposte, quando: R.adesso() };
    m.contattiMeta++;
    simMeta.modulo = m.id;
    if (m.stato !== 'collegato') {
      m.inAttesa.push(l); m.ultimo = R.adesso();
      simMeta.ultimo = { nome, modulo: m.nome, attesa: true };
      R.notifica(`Nuovo contatto in attesa dal modulo Meta non collegato <b>${R.esc(m.nome)}</b>: collegalo per farlo entrare`, '#/impostazioni/meta', 'u1');
      R.salva(); R.aggiorna();
      R.avviso(`Il modulo non è collegato: ${R.esc(nome)} resta in attesa, nessun contatto va perso`);
      return;
    }
    const x = entraLead(m, l);
    m.ricevuti++;
    simMeta.ultimo = { nome, modulo: m.nome, numero: x.e.numero, descr: x.descr, contatto: x.r && x.r.contatto ? x.r.contatto.id : null };
    R.salva(); R.aggiorna();
    R.avviso(`Arrivato ${R.esc(nome)} da «${R.esc(m.nome)}» · ${x.e.numero ? 'regola ' + x.e.numero : 'impostazioni predefinite'}${x.r && x.r.contatto ? ` · <a href="#/contatto/${x.r.contatto.id}" style="color:var(--lime)">Apri il contatto</a>` : ''}`, { durata: 9000 });
  };
  R.azioni['ge-meta-nuovo-modulo'] = () => {
    const me = meta();
    const fonte = me.moduli.find((m) => m.stato === 'collegato' && m.simileA == null && /ZES/.test(m.nome)) || me.moduli.find((m) => m.stato === 'collegato');
    if (!fonte) { R.avviso('Collega prima almeno un modulo'); return; }
    const adesso = new Date();
    const radice = fonte.nome.replace(/\s*\([^)]*\)\s*$/, '');
    let nomeNuovo = `${radice} (copia ${ddmm(adesso)} ${R.ora(adesso.toISOString())})`;
    for (let k = 2; me.moduli.some((m) => m.nome === nomeNuovo); k++) nomeNuovo = `${radice} (copia ${ddmm(adesso)} ${R.ora(adesso.toISOString())} · ${k})`;
    const nuovo = { id: R.id('mm'), nome: nomeNuovo, codice: '10' + cifre(14), stato: 'non-collegato', creato: R.adesso(), campagna: fonte.campagna, domande: clona(fonte.domande), simileA: fonte.id,
      abbinamenti: {}, consensoWA: 'casella', consensoEmail: 'casella', predefinite: null, regole: [], contattiMeta: 0, ricevuti: 0, ultimo: null, inAttesa: [] };
    const modello = me.autoCollega.attivo ? moduloMeta(me.autoCollega.daModulo) : null;
    if (modello) {
      Object.assign(nuovo, { stato: 'collegato', collegatoDa: 'auto', copiatoDa: modello.id, controllato: false, collegatoIl: R.adesso(), abbinamenti: clona(modello.abbinamenti || {}), consensoWA: modello.consensoWA, consensoEmail: modello.consensoEmail, campagna: modello.campagna, predefinite: clona(modello.predefinite), regole: clona(modello.regole || []) });
      tuttiAmministratori().forEach((id) => R.notifica(`Nuovo modulo Meta <b>${R.esc(nuovo.nome)}</b> collegato da solo con le impostazioni di «${R.esc(modello.nome)}»: controllalo`, '#/impostazioni/meta', id));
    } else {
      tuttiAmministratori().forEach((id) => R.notifica(`Nuovo modulo Meta non collegato: <b>${R.esc(nuovo.nome)}</b>. Collegalo: i contatti restano in attesa`, '#/impostazioni/meta', id));
    }
    me.moduli.unshift(nuovo);
    simMeta.modulo = nuovo.id;
    registra(`Meta ha creato il modulo «${nuovo.nome}» sulla pagina${modello ? ' (collegato da solo)' : ''}`);
    R.salva(); R.aggiorna();
    R.avviso(modello ? `Nuovo modulo in Meta: collegato da solo con le impostazioni di «${R.esc(modello.nome)}»` : 'Nuovo modulo in Meta: non è collegato, i suoi contatti resteranno in attesa');
  };

  /* ================= REPORT (capitolo 9.16, Dizionario dei numeri) ================= */
  function periodoDa(periodo) {
    const oggi = R.oggi();
    const inizio = new Date(oggi);
    if (periodo === 'settimana') inizio.setDate(oggi.getDate() - ((oggi.getDay() + 6) % 7));
    else if (periodo === 'anno') inizio.setMonth(0, 1);
    else inizio.setDate(1);
    const fine = new Date(oggi); fine.setDate(oggi.getDate() + 1);
    return { inizio, fine };
  }
  function testoPeriodo(inizio, fine) {
    const mese = (d) => d.toLocaleDateString('it-IT', { month: 'long' });
    fine = R.oggi();
    if (inizio.getMonth() === fine.getMonth() && inizio.getFullYear() === fine.getFullYear()) return `${inizio.getDate()} – ${fine.getDate()} ${mese(fine)} ${fine.getFullYear()}`;
    return `${inizio.getDate()} ${mese(inizio)} – ${fine.getDate()} ${mese(fine)} ${fine.getFullYear()}`;
  }
  /* Calcola i numeri del report dai dati, con le stesse regole della Dashboard (Dizionario dei numeri, DECISIONI.md sezione 4).
     Filtri: { periodo: 'settimana'|'mese'|'anno', percorso: id }. Senza il permesso «report di tutti» conta solo gli affari propri. */
  R.numeriReport = (o) => {
    o = Object.assign({ periodo: 'mese', percorso: (R.stato.percorsi[0] || {}).id }, o);
    const { inizio, fine } = periodoDa(o.periodo);
    const nel = (iso) => !!iso && new Date(iso) >= inizio && new Date(iso) < fine;
    const me = R.utente().id;
    const tutti = R.puo('reportTutti');
    const vivi = R.stato.affari.filter((a) => !a.eliminato && !(R.contatto(a.contatto) || {}).eliminato);
    const mio = (a) => a.responsabile === me || (a.seguaci || []).includes(me);
    const percorso = R.percorso(o.percorso) || R.stato.percorsi[0];
    const affariP = vivi.filter((a) => a.percorso === percorso.id && (tutti || mio(a)));
    const vinta = percorso.fasi.find((f) => f.tipo === 'vinto') || { nome: 'Vinti' };
    const giorniPeriodo = Math.max(1, Math.round((R.oggi() - inizio) / 86400000) + 1);
    /* Da dove arrivano: nuovi contatti del periodo (per il collaboratore: nuovi affari assegnati a lui), tutti i percorsi come in Dashboard */
    const arrivi = tutti ? R.stato.contatti.filter((c) => !c.eliminato && nel(c.creato)) : vivi.filter((a) => a.responsabile === me && nel(a.creato)).map((a) => R.contatto(a.contatto)).filter(Boolean);
    const chiave = (c) => (c.campagna ? `${c.fonte} · ${c.campagna}` : c.fonte || 'Altro');
    const gruppi = {};
    arrivi.forEach((c) => { const k = chiave(c); gruppi[k] = gruppi[k] || { nome: k, contatti: 0, vinti: 0 }; gruppi[k].contatti++; });
    vivi.filter((a) => a.stato === 'vinto' && nel(a.vintoIl) && (tutti || mio(a))).forEach((a) => {
      const c = R.contatto(a.contatto);
      if (!c) return;
      const k = chiave(c);
      gruppi[k] = gruppi[k] || { nome: k, contatti: 0, vinti: 0 };
      gruppi[k].vinti++;
    });
    const spese = R.stato.spese || {};
    const fattore = o.periodo === 'mese' ? 1 : giorniPeriodo / Math.max(1, R.oggi().getDate());
    const fonti = Object.values(gruppi).map((g) => {
      const s = tutti && spese[g.nome] != null ? spese[g.nome] * fattore : null;
      return Object.assign(g, { spesa: s, costo: s != null && g.contatti ? s / g.contatti : null });
    }).sort((a, b) => b.contatti - a.contatti || b.vinti - a.vinti);
    /* Dal contatto al contratto (percorso scelto) */
    const indice = (fid) => percorso.fasi.findIndex((f) => f.id === fid);
    const creati = affariP.filter((a) => nel(a.creato));
    const richiamati = creati.filter((a) => (a.tentativi || []).length > 0);
    const tappe = (percorso.tappeReport || percorso.fasi.filter((f) => !f.tipo).slice(1).map((f) => ({ fase: f.id, nome: f.nome }))).filter((t) => indice(t.fase) >= 0);
    const raggiunto = (a, fid) => a.stato === 'vinto' || (a.stato !== 'perso' && indice(a.fase) >= indice(fid));
    const vinti = affariP.filter((a) => a.stato === 'vinto' && nel(a.vintoIl));
    const percentuale = creati.length ? (vinti.length / creati.length) * 100 : 0;
    const imbuto = [{ nome: 'Nuovi affari', n: creati.length }, { nome: 'Richiamati', n: richiamati.length, perc: creati.length ? (richiamati.length / creati.length) * 100 : 0 }]
      .concat(tappe.map((t) => ({ nome: t.nome, n: creati.filter((a) => raggiunto(a, t.fase)).length })))
      .concat([{ nome: vinta.plurale || vinta.nome, n: vinti.length, ultima: true }]);
    /* Collaboratori */
    const idAffariP = new Set(affariP.map((a) => a.id));
    const persone = tutti ? R.stato.utenti.filter((u) => u.stato !== 'invitato' && (u.ruolo === 'collaboratore' || affariP.some((a) => a.responsabile === u.id))) : [R.utente()];
    const collaboratori = persone.map((u) => {
      const suoi = affariP.filter((a) => a.responsabile === u.id);
      const nuovi = suoi.filter((a) => nel(a.creato));
      const tempi = nuovi.filter((a) => (a.tentativi || []).length).map((a) => minutiLavoro(a.creato, a.tentativi.slice().sort()[0]));
      const att = R.stato.attivita.filter((t) => t.responsabile === u.id && !t.annullata && idAffariP.has(t.affare) && nel(t.quando) && new Date(t.quando) <= new Date());
      return { u, nuovi: nuovi.length, medio: tempi.length ? Math.round(tempi.reduce((s, x) => s + x, 0) / tempi.length) : null, fatte: att.filter((t) => t.fatta).length, dovute: att.length, vinti: suoi.filter((a) => a.stato === 'vinto' && nel(a.vintoIl)).length };
    });
    /* Pagine: conversione come nell'elenco dei funnel (contatti / visite dall'inizio) e contatti arrivati nel periodo */
    const pagine = (R.stato.funnel || []).map((f) => ({ nome: f.nome, stato: f.stato, conv: f.visite ? ((f.contatti || 0) / f.visite) * 100 : null, nelPeriodo: arrivi.filter((c) => c.pagina && c.pagina === f.indirizzo).length }))
      .filter((p) => p.conv != null || p.nelPeriodo).sort((a, b) => (b.conv || 0) - (a.conv || 0));
    /* Motivi di perdita */
    const persi = affariP.filter((a) => a.stato === 'perso' && nel(a.persoIl));
    const motivi = {};
    persi.forEach((a) => { const k = a.motivoPerdita || 'Nessun motivo indicato'; motivi[k] = (motivi[k] || 0) + 1; });
    return { inizio, fine, percorso, tutti, nuoviContatti: arrivi.length, fonti, imbuto, vinti: vinti.length, creati: creati.length, percentuale, collaboratori, pagine, motivi: Object.entries(motivi).sort((a, b) => b[1] - a[1]), persi: persi.length };
  };
  const COLORI_BARRE = ['#1F4D3A', '#2E6650', '#7FB08F', '#C8E6A0', '#A9C3E0', '#D4BDE5'];
  R.rotta('/report', {
    menu: 'report',
    titolo: 'Report',
    disegna: () => {
      prepara();
      const f = R.stato.filtri.report = Object.assign({ periodo: 'mese', percorso: R.stato.percorsi[0].id }, R.stato.filtri.report);
      if (!R.percorso(f.percorso)) f.percorso = R.stato.percorsi[0].id;
      const n = R.numeriReport(f);
      const vinta = n.percorso.fasi.find((x) => x.tipo === 'vinto') || { nome: 'Vinti' };
      const nomeVinti = vinta.plurale || vinta.nome;
      const rm = ge().reportMensile;
      const maxFonte = Math.max(1, ...n.fonti.map((x) => x.contatti));
      const maxImbuto = Math.max(1, ...n.imbuto.map((x) => x.n));
      const maxMotivo = Math.max(1, ...n.motivi.map((x) => x[1]));
      const fonti = n.fonti.length ? `<div class="contenitore-tabella"><table class="ge-tab"><thead><tr><th>Fonte</th><th style="width:42%"><span class="nascosto-accessibile">Barra</span></th><th>Contatti</th><th>${R.esc(nomeVinti)}</th><th>Costo per contatto</th></tr></thead><tbody>
          ${n.fonti.map((x, i) => `<tr><td>${R.esc(x.nome)}</td><td><div class="ge-barra-fonte"><span style="width:${Math.max(4, (x.contatti / maxFonte) * 100)}%;background:${COLORI_BARRE[i % COLORI_BARRE.length]}"></span></div></td><td><b>${x.contatti}</b></td><td>${x.vinti}</td><td>${x.costo != null ? euroCent(x.costo) : '—'}</td></tr>`).join('')}
        </tbody></table></div>` : '<div class="vuoto">Nessun contatto in questo periodo. Quando arrivano, qui vedi da dove.</div>';
      const tempo = (m) => (m == null ? '<span class="secondario">—</span>' : `<b style="color:${m <= 60 ? 'var(--verde)' : m > 240 ? 'var(--errore-t)' : 'var(--testo)'}">${durataTesto(m)}</b>`);
      const collaboratori = `<div class="contenitore-tabella"><table class="ge-tab righe"><thead><tr><th>Persona</th><th>Nuovi contatti</th><th>Tempo per richiamare</th><th>Attività fatte</th><th>${R.esc(nomeVinti)}</th></tr></thead><tbody>
          ${n.collaboratori.map((c) => `<tr><td><b>${R.esc(c.u.breve)}</b>${c.u.stato === 'disattivato' ? ' <span class="piccolo secondario">disattivato</span>' : ''}</td><td>${c.nuovi}</td><td>${tempo(c.medio)}</td><td>${c.dovute ? `${Math.round((c.fatte / c.dovute) * 100)}% <span class="piccolo secondario">(${c.fatte} di ${c.dovute})</span>` : '<span class="secondario">—</span>'}</td><td>${c.vinti}</td></tr>`).join('')}
        </tbody></table></div>`;
      return `
        <div class="testata">
          <div><div class="sopratitolo">${R.esc(testoPeriodo(n.inizio, n.fine))} · ${R.esc(n.percorso.nome)}${n.tutti ? '' : ' · solo i tuoi numeri'}</div>
          <h1 class="titolo-pagina">Report</h1>
          <div class="spiegazione">Da dove arrivano i contatti e come diventano contratti. Con gli stessi filtri i numeri sono quelli della Dashboard.</div></div>
          <div class="azioni-testata">
            <div class="selettore" role="group" aria-label="Periodo">${[['settimana', 'Settimana'], ['mese', 'Mese'], ['anno', 'Anno']].map(([k, t]) => `<button class="${f.periodo === k ? 'attivo' : ''}" data-azione="ge-rep-periodo" data-periodo="${k}" aria-pressed="${f.periodo === k}">${t}</button>`).join('')}</div>
            ${R.stato.percorsi.length > 1 ? `<select class="campo" style="width:auto;background-color:#fff;min-height:44px" aria-label="Percorso" data-cambia="ge-rep-percorso">${R.stato.percorsi.map((x) => `<option value="${x.id}" ${x.id === n.percorso.id ? 'selected' : ''}>${R.esc(x.nome)}</option>`).join('')}</select>` : ''}
            <button class="btn" data-azione="ge-rep-pdf">${R.icona('scarica', 16)} Scarica PDF</button>
            ${R.amministratore() ? `<button class="btn primario" data-azione="ge-rep-mensile">${rm.attivo ? R.icona('spunta', 16) + ' Invio mensile attivo' : 'Invia ogni mese'}</button>` : ''}
          </div>
        </div>
        ${n.tutti ? '' : '<div class="banner ge-banner-bianco">' + R.icona('lucchetto') + '<div class="principale">Vedi solo i tuoi numeri. Per vedere quelli di tutti serve il permesso «Vedere i report di tutti»: chiedilo a un amministratore.</div></div>'}
        <div class="ge-rep">
          <div class="riquadro"><div class="intestazione-riquadro"><h2 class="titolo-riquadro">Da dove arrivano i contatti</h2><span class="secondario piccolo">${n.nuoviContatti} in totale · tutti i percorsi</span></div>${fonti}
            ${n.tutti ? '<p class="piccolo secondario" style="margin:10px 0 0">Costo per contatto = spesa pubblicitaria del periodo per quella campagna, diviso i contatti arrivati da quella campagna.</p>' : ''}</div>
          <div class="riquadro scuro"><h2 class="titolo-riquadro">Dal contatto al contratto</h2>
            ${n.imbuto.map((t) => `<div class="ge-tappa ${t.ultima ? 'ultima' : ''}" style="width:${Math.max(34, (t.n / maxImbuto) * 100)}%"><span>${R.esc(t.nome)}</span><b>${t.n}${t.perc != null ? ' · ' + Math.round(t.perc) + '%' : ''}</b></div>`).join('')}
            <p class="piccolo" style="opacity:.75;margin:6px 2px 0">${R.esc(nomeVinti)}: ${percento(n.percentuale)} degli affari creati nel periodo.</p></div>
          <div class="riquadro"><h2 class="titolo-riquadro">Collaboratori</h2>${collaboratori}
            <p class="piccolo secondario" style="margin:10px 0 0">Tempo per richiamare: dalla creazione dell'affare al primo tentativo, contando solo le ore dell'orario di invio (${R.esc(orarioTesto())}).</p></div>
          <div class="riquadro salvia"><h2 class="titolo-riquadro">Le pagine che rendono di più</h2>
            ${n.pagine.map((p) => `<div class="ge-pagina-r"><span>${R.esc(p.nome)} <span class="piccolo secondario">· ${plurale(p.nelPeriodo, 'contatto', 'contatti')} nel periodo</span></span><b>${p.conv != null ? percento(p.conv) : '—'}</b></div>`).join('') || '<div class="vuoto" style="color:inherit">Nessuna pagina online. Pubblicane una da Marketing.</div>'}
            <p class="piccolo" style="margin:4px 2px 0">Percentuale di visitatori che lasciano il contatto, come nell'elenco dei funnel.</p></div>
          <div class="riquadro"><div class="intestazione-riquadro"><h2 class="titolo-riquadro">Motivi di perdita</h2><span class="secondario piccolo">${plurale(n.persi, 'affare perso', 'affari persi')}</span></div>
            ${n.motivi.length ? n.motivi.map(([k, v]) => `<div style="display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) 32px;gap:12px;align-items:center;padding:6px 0;font-size:13.5px"><span>${R.esc(k)}</span><div class="ge-barra-fonte"><span style="width:${(v / maxMotivo) * 100}%;background:var(--pesca-t)"></span></div><b>${v}</b></div>`).join('') : '<div class="vuoto">Nessun affare perso in questo periodo.</div>'}</div>
          <div class="riquadro"><h2 class="titolo-riquadro piccolo">Come contiamo i numeri</h2>
            <dl class="ge-dizionario" style="margin:0">
              <dt>Nuovi contatti</dt><dd>Contatti creati nel periodo; per il collaboratore, i nuovi affari assegnati a lui.</dd>
              <dt>Richiamati</dt><dd>Affari creati nel periodo con almeno un tentativo: un tocco sul numero o un messaggio scritto a mano.</dd>
              <dt>${R.esc(nomeVinti)}</dt><dd>Affari entrati nella fase «${R.esc(vinta.nome)}» nel periodo; la percentuale è sugli affari creati nel periodo.</dd>
              <dt>Tempo per richiamare</dt><dd>Dalla creazione dell'affare al primo tentativo, solo nelle ore di lavoro.</dd>
            </dl></div>
        </div>`;
    },
  });
  R.azioni['ge-rep-periodo'] = (el) => { R.stato.filtri.report = Object.assign({}, R.stato.filtri.report, { periodo: el.dataset.periodo }); R.salva(); R.aggiorna(); };
  R.azioni['ge-rep-percorso'] = (el) => { R.stato.filtri.report = Object.assign({}, R.stato.filtri.report, { percorso: el.value }); R.salva(); R.aggiorna(); };
  R.azioni['ge-rep-pdf'] = (el) => {
    if (!R.serveConnessione('lo scarico del PDF')) return;
    const f = R.stato.filtri.report || { periodo: 'mese' };
    const { inizio, fine } = periodoDa(f.periodo);
    const testo = el.innerHTML;
    el.disabled = true; el.textContent = 'In corso…';
    setTimeout(() => {
      el.disabled = false; el.innerHTML = testo;
      R.modale({
        titolo: 'Il PDF è pronto',
        sottotitolo: `Report di ${R.esc(R.azienda().nome)} · ${R.esc(testoPeriodo(inizio, fine))} · 2 pagine con tutti i riquadri di questa pagina.`,
        corpo: '<div class="riquadro medio beige">Nel prototipo non si scarica nessun file: nel software vero lo scaricamento parte da solo.</div>',
        classe: 'stretta',
        pulsanti: [{ testo: 'Ho capito', classe: 'primario', chiudi: true }],
      });
    }, 900);
  };
  R.azioni['ge-rep-mensile'] = () => {
    const rm = ge().reportMensile;
    const admin = R.stato.utenti.filter((u) => ['generale', 'azienda'].includes(u.ruolo) && u.stato === 'attivo');
    R.modale({
      titolo: 'Invia il report ogni mese',
      sottotitolo: 'Il giorno 1 di ogni mese alle 9:00 arriva per email il PDF del mese prima. Per le aziende dei clienti arriva anche al loro amministratore.',
      proteggi: true,
      corpo: `<div class="riga-impostazione"><span><b>Invio mensile</b></span>${interruttore('name="attivo" aria-label="Invio mensile acceso"', rm.attivo)}</div>
        <div class="etichetta-campo spazio-sopra">A chi</div>
        ${admin.map((u) => `<div class="riga-impostazione"><span>${R.esc(u.nome)} · ${R.esc(u.email)}<br><span class="piccolo secondario">${R.esc(R.nomeRuolo(u.ruolo))}</span></span>${interruttore(`name="d_${u.id}" aria-label="${R.esc(u.nome)}"`, rm.destinatari.includes(u.id))}</div>`).join('')}
        <p class="piccolo secondario">Nel prototipo nessuna email parte davvero.</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          const dest = admin.filter((u) => v['d_' + u.id]).map((u) => u.id);
          if (v.attivo && !dest.length) { R.avviso('Scegli almeno una persona a cui inviarlo'); return false; }
          rm.attivo = !!v.attivo; rm.destinatari = dest;
          registra(rm.attivo ? 'Ha acceso l\'invio mensile del report' : 'Ha spento l\'invio mensile del report');
          R.salva(); R.aggiorna(); R.avviso(rm.attivo ? 'Invio mensile acceso: il primo arriva il giorno 1 alle 9:00' : 'Invio mensile spento');
        },
      }],
    });
  };
})();
