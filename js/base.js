/* Rampant — prototipo cliccabile. Base comune: utilità, dati salvati nel browser, indirizzi delle
   schermate, menu, finestre, avvisi, ricerca, notifiche, guida ai percorsi.
   Ogni file di schermate registra le sue rotte con R.rotta() e le sue azioni in R.azioni. */
(function () {
  'use strict';

  const R = (window.R = {});
  R.versioneDati = 1;
  const CHIAVE = 'rampant-prototipo-v1';

  /* ---------------- Utilità ---------------- */
  R.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /* In italiano Intl non mette il punto delle migliaia sotto 10.000: lo forziamo (2.340, non 2340). */
  const conPunto = (s) => s.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  R.euro = (n) => (n == null || n === '' ? '—' : conPunto(String(Math.round(n))) + ' €');
  R.numero = (n) => (Number.isInteger(n) ? conPunto(String(n)) : new Intl.NumberFormat('it-IT').format(n));
  R.milioni = (n) => (n >= 1e6 ? (n / 1e6).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' mln €' : R.euro(n));
  R.id = (p) => (p || 'x') + Math.random().toString(36).slice(2, 9);
  R.iniziali = (nome) => String(nome || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
  R.oggi = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  /* Data a n giorni da oggi, con ora facoltativa "hh:mm". */
  R.giorniDa = (n, ora) => {
    const d = R.oggi();
    d.setDate(d.getDate() + n);
    if (ora) { const [h, m] = ora.split(':'); d.setHours(+h, +m, 0, 0); } else d.setHours(9, 0, 0, 0);
    return d.toISOString();
  };
  R.adesso = () => new Date().toISOString();
  R.data = (iso) => new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  R.dataBreve = (iso) => new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  R.dataLunga = (iso) => new Date(iso).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  R.ora = (iso) => new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  R.diffGiorni = (iso) => {
    const d = new Date(iso); d.setHours(0, 0, 0, 0);
    return Math.round((d - R.oggi()) / 86400000);
  };
  /* "oggi", "domani", "ieri", "lunedì", "3 giorni fa", "12 nov" */
  R.giornoRelativo = (iso) => {
    const g = R.diffGiorni(iso);
    if (g === 0) return 'oggi';
    if (g === 1) return 'domani';
    if (g === -1) return 'ieri';
    if (g < -1 && g >= -6) return -g + ' giorni fa';
    if (g > 1 && g <= 6) return new Date(iso).toLocaleDateString('it-IT', { weekday: 'long' });
    return R.dataBreve(iso);
  };
  R.quandoBreve = (iso) => {
    const g = R.giornoRelativo(iso);
    return g.charAt(0).toUpperCase() + g.slice(1) + ' ' + R.ora(iso);
  };
  R.maiuscola = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  /* Aggiunge regole di stile proprie di un gruppo di schermate (una volta sola per nome). */
  R.stile = (nome, css) => {
    if (document.getElementById('stile-' + nome)) return;
    const s = document.createElement('style');
    s.id = 'stile-' + nome;
    s.textContent = css;
    document.head.appendChild(s);
  };
  R.dormi = (ms) => new Promise((ok) => setTimeout(ok, ms));

  /* ---------------- Dati salvati nel browser ---------------- */
  R.estensioniDati = [];
  /* Ogni file di schermate può aggiungere i propri dati iniziali: R.estendiDati(function (stato) { ... }) */
  R.estendiDati = (fn) => R.estensioniDati.push(fn);
  R.carica = () => {
    try {
      const s = localStorage.getItem(CHIAVE);
      if (s) { const d = JSON.parse(s); if (d && d.versione === R.versioneDati) return d; }
    } catch (e) { /* il prototipo funziona anche senza memoria del browser */ }
    return null;
  };
  R.salva = () => { try { localStorage.setItem(CHIAVE, JSON.stringify(R.stato)); } catch (e) { /* niente */ } };
  R.nuoviDati = () => {
    const s = R.datiIniziali();
    R.estensioniDati.forEach((fn) => fn(s));
    return s;
  };
  R.ricomincia = () => {
    try { localStorage.removeItem(CHIAVE); } catch (e) { /* niente */ }
    R.stato = R.nuoviDati();
    R.salva();
    R.chiudiModale(true, true);
    if (location.hash === '#/dashboard') R.disegna(); else location.hash = '#/dashboard';
    R.avviso('Prototipo ricominciato con i dati di partenza');
  };

  /* ---------------- Chi sta usando il software ---------------- */
  R.utente = () => R.stato.utenti.find((u) => u.id === R.stato.utenteAttivo);
  R.utenteDa = (id) => R.stato.utenti.find((u) => u.id === id) || { nome: '—', breve: '—', iniziali: '?', colore: '#E6E1D8' };
  R.azienda = () => R.stato.aziende.find((a) => a.id === R.stato.aziendaAttiva);
  R.amministratore = () => ['generale', 'azienda'].includes(R.utente().ruolo);
  /* permessi: vedeTutti, esportare, eliminare, funnel, automazioni, reportTutti, inviiMultipli */
  R.puo = (permesso) => R.amministratore() || !!(R.utente().permessi || {})[permesso];
  R.affareVisibile = (a) => R.puo('vedeTutti') || a.responsabile === R.utente().id || (a.seguaci || []).includes(R.utente().id);
  R.contattoVisibile = (c) => {
    if (R.puo('vedeTutti')) return true;
    const me = R.utente().id;
    if (c.responsabile === me) return true;
    return R.stato.affari.some((a) => a.contatto === c.id && !a.eliminato && (a.responsabile === me || (a.seguaci || []).includes(me)));
  };
  R.contatto = (id) => R.stato.contatti.find((c) => c.id === id);
  R.affare = (id) => R.stato.affari.find((a) => a.id === id);
  R.percorso = (id) => R.stato.percorsi.find((p) => p.id === id);
  R.fase = (percorsoId, faseId) => (R.percorso(percorsoId) || { fasi: [] }).fasi.find((f) => f.id === faseId);
  R.faseVinta = (percorsoId) => R.percorso(percorsoId).fasi.find((f) => f.tipo === 'vinto');
  R.fasePersa = (percorsoId) => R.percorso(percorsoId).fasi.find((f) => f.tipo === 'perso');

  /* ---------------- Indirizzi delle schermate ---------------- */
  R.rotte = [];
  /* R.rotta('/contatto/:id', { menu: 'affari', disegna(p, q) { return html }, dopo(p, q) {}, pieno: false, pubblica: false }) */
  R.rotta = (schema, opzioni) => {
    const chiavi = [];
    const re = new RegExp('^' + schema.replace(/:(\w+)/g, (_, k) => { chiavi.push(k); return '([^/]+)'; }) + '$');
    R.rotte.push(Object.assign({ re, chiavi, schema }, opzioni));
  };
  R.posizione = () => {
    const h = decodeURI(location.hash.slice(1)) || '/dashboard';
    const [percorso, qs] = h.split('?');
    return { percorso, query: Object.fromEntries(new URLSearchParams(qs || '')) };
  };
  R.vai = (hash) => {
    if (modaleAperta) R.chiudiModale(true, true);
    if (location.hash === hash) R.disegna(); else location.hash = hash;
  };
  const scorrimenti = {};
  let ultimoPercorso = null;

  R.menu = [
    { id: 'dashboard', testo: 'Dashboard', href: '#/dashboard', icona: 'casa' },
    { id: 'affari', testo: 'Affari', href: '#/affari', icona: 'colonne' },
    { id: 'contatti', testo: 'Contatti', href: '#/contatti', icona: 'persone' },
    { id: 'attivita', testo: 'Attività', href: '#/attivita', icona: 'spunta' },
    { id: 'calendario', testo: 'Calendario', href: '#/calendario', icona: 'calendario' },
    { id: 'marketing', testo: 'Marketing', href: '#/marketing/funnel', icona: 'pagina', permesso: 'funnel' },
    { id: 'automazioni', testo: 'Automazioni', href: '#/automazioni', icona: 'fulmine', permesso: 'automazioni' },
    { id: 'whatsapp', testo: 'WhatsApp', href: '#/whatsapp', icona: 'whatsapp' },
    { id: 'report', testo: 'Report', href: '#/report', icona: 'grafico' },
    { id: 'impostazioni', testo: 'Impostazioni', href: '#/impostazioni', icona: 'ingranaggio', soloAmministratori: true },
  ];
  R.vociMenu = () => R.menu.filter((v) => (!v.permesso || R.puo(v.permesso)) && (!v.soloAmministratori || R.amministratore()));

  function trovaRotta(percorso) {
    for (const r of R.rotte) {
      const m = percorso.match(r.re);
      if (m) { const p = {}; r.chiavi.forEach((k, i) => (p[k] = decodeURIComponent(m[i + 1]))); return { rotta: r, parametri: p }; }
    }
    return null;
  }

  R.disegna = (mantieniScorrimento) => {
    const { percorso, query } = R.posizione();
    const trovata = trovaRotta(percorso) || trovaRotta('/dashboard') || trovaRotta('/non-nel-prototipo');
    const { rotta, parametri } = trovata;
    if (rotta.menu && !R.vociMenu().some((v) => v.id === rotta.menu) && !rotta.libera) {
      document.getElementById('app').innerHTML = R.struttura(rotta, `<div class="riquadro vuoto spazio-sopra"><p class="grassetto">Non hai il permesso per aprire questa pagina.</p><p>Chiedi a un amministratore di darti il permesso. <a href="#/dashboard" class="link verde">Torna alla Dashboard</a></p></div>`);
      return;
    }
    const y = window.scrollY;
    if (ultimoPercorso && !mantieniScorrimento) scorrimenti[ultimoPercorso] = y;
    let corpo;
    try { corpo = rotta.disegna(parametri, query); } catch (e) { console.error(e); corpo = `<div class="riquadro vuoto">Questa schermata del prototipo ha un errore: ${R.esc(e.message)}</div>`; }
    document.getElementById('app').innerHTML = R.struttura(rotta, corpo);
    document.title = (rotta.titolo ? (typeof rotta.titolo === 'function' ? rotta.titolo(parametri) : rotta.titolo) + ' · ' : '') + 'Rampant · prototipo';
    if (rotta.dopo) { try { rotta.dopo(parametri, query); } catch (e) { console.error(e); } }
    if (mantieniScorrimento) window.scrollTo(0, y);
    else if (ultimoPercorso !== percorso) window.scrollTo(0, scorrimenti[percorso] || 0);
    ultimoPercorso = percorso;
  };
  /* Ridisegna la schermata attuale senza perdere lo scorrimento. */
  R.aggiorna = () => R.disegna(true);

  /* ---------------- Struttura della pagina ---------------- */
  R.struttura = (rotta, corpo) => {
    const striscia = `<div class="striscia-prototipo"><span><b>Prototipo da provare</b> · dati inventati<span class="nascondi-telefono"> · nessun messaggio parte davvero</span></span><button data-azione="apri-guida">Percorsi da provare</button><button data-azione="ricomincia">Ricomincia</button></div>`;
    if (rotta.pubblica) return striscia + corpo;
    if (rotta.pieno) return striscia + R.bannerGlobali() + corpo + R.menuBasso(rotta);
    const voci = R.vociMenu();
    const a = R.azienda();
    const u = R.utente();
    const nonLette = R.stato.notifiche.filter((n) => !n.letta && (!n.per || n.per === u.id)).length;
    const menu = voci.map((v) => `<a href="${v.href}" class="${rotta.menu === v.id ? 'attivo' : ''}">${v.testo}</a>`).join('');
    return `${striscia}
      <header class="barra-alta">
        <button class="logo" data-azione="vai" data-dove="#/dashboard" aria-label="Dashboard">${R.esc(a.iniziale)}</button>
        <button class="selettore-azienda" data-azione="scegli-azienda">${R.esc(a.nome)} ${R.utente().ruolo === 'generale' ? R.icona('giu', 14) : ''}</button>
        <nav class="menu-principale" aria-label="Menu principale">${menu}</nav>
        <div class="destra-barra">
          <button class="cerchio" data-azione="cerca" aria-label="Cerca (Ctrl+K)">${R.icona('cerca')}</button>
          <button class="cerchio" data-azione="notifiche" aria-label="Notifiche">${R.icona('campanella')}${nonLette ? `<span class="pallino">${nonLette}</span>` : ''}</button>
          <button class="cerchio pesca" data-azione="menu-utente" aria-label="Il mio profilo">${R.esc(u.iniziali)}</button>
        </div>
      </header>
      <main class="contenuto">${R.bannerGlobali()}${corpo}</main>
      ${R.menuBasso(rotta)}`;
  };

  R.menuBasso = (rotta) => {
    const voci = [
      { id: 'dashboard', testo: 'Dashboard', href: '#/dashboard', icona: 'casa' },
      { id: 'affari', testo: 'Affari', href: '#/affari', icona: 'colonne' },
      { id: 'attivita', testo: 'Attività', href: '#/attivita', icona: 'spunta' },
      { id: 'calendario', testo: 'Calendario', href: '#/calendario', icona: 'calendario' },
    ];
    const altroAttivo = !voci.some((v) => v.id === rotta.menu);
    return `<nav class="menu-basso" aria-label="Menu">${voci.map((v) => `<a href="${v.href}" class="${rotta.menu === v.id ? 'attivo' : ''}">${R.icona(v.icona, 20)}<span>${v.testo}</span></a>`).join('')}
      <button data-azione="menu-altro" class="${altroAttivo ? 'attivo' : ''}">${R.icona('griglia', 20)}<span>Altro</span></button></nav>`;
  };

  /* Banner che compaiono in tutte le pagine (connessione) */
  R.bannerGlobali = () => {
    if (!R.stato.offline) return '';
    const n = R.stato.inAttesa.length;
    return `<div class="banner offline">${R.icona('wifi-no')}<div class="principale"><b>Sei offline.</b> Puoi modificare campi, scrivere note e segnare attività come fatte: restano in attesa${n ? ` (${n} in attesa)` : ''} e si salvano appena torna la connessione. Non puoi creare contatti, inviare messaggi o pubblicare.</div><button class="btn lime piccolo" data-azione="torna-online">Simula: torna la connessione</button></div>`;
  };

  /* ---------------- Azioni (clic su elementi con data-azione) ---------------- */
  R.azioni = {};
  document.addEventListener('click', (ev) => {
    if (tendinaAperta && !ev.target.closest('.tendina') && !ev.target.closest('[data-tendina-ancora]')) R.chiudiTendina();
    const el = ev.target.closest('[data-azione]');
    if (!el || el.disabled) return;
    const fn = R.azioni[el.dataset.azione];
    if (fn) { ev.preventDefault(); fn(el, ev); } else console.warn('Azione non trovata:', el.dataset.azione);
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-cambia]');
    if (el && R.azioni[el.dataset.cambia]) R.azioni[el.dataset.cambia](el, ev);
  });
  document.addEventListener('input', (ev) => {
    const el = ev.target.closest('[data-digita]');
    if (el && R.azioni[el.dataset.digita]) R.azioni[el.dataset.digita](el, ev);
    if (modaleAperta && ev.target.closest('.modale')) modaleAperta.modificata = true;
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (tendinaAperta) { R.chiudiTendina(); return; }
      if (modaleAperta) { R.chiudiModale(); return; }
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') { ev.preventDefault(); R.azioni.cerca(); }
  });

  R.azioni.vai = (el) => R.vai(el.dataset.dove);
  R.azioni.ricomincia = () => R.modale({
    titolo: 'Ricominciare la prova?',
    sottotitolo: 'Tutto quello che hai cambiato nel prototipo sparisce e tornano i dati inventati di partenza.',
    classe: 'stretta',
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Ricomincia', classe: 'primario', fai: () => R.ricomincia() }],
  });

  /* ---------------- Finestre (pop-up) ---------------- */
  let modaleAperta = null;
  let ignoraPop = false;
  /* R.modale({ titolo, sottotitolo, corpo, pulsanti: [{testo, classe, fai(finestra) | chiudi:true}], classe: 'larga'|'stretta', proteggi: true, alChiudere }) */
  R.modale = (o) => {
    if (modaleAperta) R.chiudiModale(true, true);
    const sfondo = document.createElement('div');
    sfondo.className = 'sfondo-modale';
    const pulsanti = (o.pulsanti || []).map((p, i) => `<button class="btn ${p.classe || 'secondario-campo'}" data-azione="__pulsante-modale" data-i="${i}" ${p.disabilitato ? 'disabled' : ''}>${p.testo}</button>`).join('');
    sfondo.innerHTML = `<div class="modale ${o.classe || ''}" role="dialog" aria-modal="true" aria-label="${R.esc(o.titolo || '')}">
      <div class="testata-modale"><div>${o.titolo ? `<h2>${o.titolo}</h2>` : ''}${o.sottotitolo ? `<div class="sottotitolo-modale">${o.sottotitolo}</div>` : ''}</div>
      <button class="chiudi" data-azione="chiudi-modale" aria-label="Chiudi">${R.icona('x')}</button></div>
      <div class="corpo-modale">${o.corpo || ''}</div>
      ${pulsanti ? `<div class="piede-modale">${pulsanti}</div>` : ''}
      <div class="avviso-modifiche"></div></div>`;
    sfondo.addEventListener('mousedown', (ev) => { if (ev.target === sfondo) R.chiudiModale(); });
    document.body.appendChild(sfondo);
    modaleAperta = { el: sfondo, o, modificata: false };
    if (!(history.state && history.state.rampantModale)) history.pushState({ rampantModale: true }, '');
    const primo = sfondo.querySelector('input:not([type=checkbox]):not([type=radio]), textarea, select');
    if (primo && !o.senzaFuoco) setTimeout(() => primo.focus(), 30);
    if (o.dopo) o.dopo(sfondo.querySelector('.modale'));
    return sfondo.querySelector('.modale');
  };
  R.modaleAperta = () => (modaleAperta ? modaleAperta.el.querySelector('.modale') : null);
  /* Chiude la finestra. Se ci sono modifiche non salvate e la finestra è protetta, chiede cosa fare. */
  R.chiudiModale = (forza, senzaStoria) => {
    if (!modaleAperta) return;
    const m = modaleAperta;
    if (!forza && m.o.proteggi && m.modificata) {
      const zona = m.el.querySelector('.avviso-modifiche');
      zona.innerHTML = `<div class="banner giallo spazio-sopra" style="margin-bottom:0"><div class="principale"><b>Hai modifiche non salvate.</b></div>
        <button class="btn piccolo primario" data-azione="__modale-salva">Salva</button><button class="btn piccolo" data-azione="__modale-scarta">Scarta</button><button class="btn piccolo" data-azione="__modale-continua">Continua a modificare</button></div>`;
      if (senzaStoria) history.pushState({ rampantModale: true }, '');
      return;
    }
    modaleAperta = null;
    m.el.remove();
    if (!senzaStoria && history.state && history.state.rampantModale) { ignoraPop = true; history.back(); }
    if (m.o.alChiudere) m.o.alChiudere();
  };
  window.addEventListener('popstate', () => {
    if (ignoraPop) { ignoraPop = false; return; }
    if (modaleAperta) R.chiudiModale(false, true);
  });
  R.azioni['chiudi-modale'] = () => R.chiudiModale();
  R.azioni['__pulsante-modale'] = (el) => {
    if (!modaleAperta) return;
    const p = modaleAperta.o.pulsanti[+el.dataset.i];
    if (p.chiudi) { R.chiudiModale(); return; }
    if (p.fai) {
      const finestra = modaleAperta.el.querySelector('.modale');
      const esito = p.fai(finestra);
      if (esito !== false && modaleAperta && modaleAperta.el.contains(finestra) && !p.restaAperta) R.chiudiModale(true);
    }
  };
  R.azioni['__modale-salva'] = () => {
    const p = (modaleAperta.o.pulsanti || []).find((x) => x.classe && x.classe.includes('primario'));
    if (p && p.fai) { const f = modaleAperta.el.querySelector('.modale'); if (p.fai(f) !== false) R.chiudiModale(true); } else R.chiudiModale(true);
  };
  R.azioni['__modale-scarta'] = () => R.chiudiModale(true);
  R.azioni['__modale-continua'] = () => { modaleAperta.el.querySelector('.avviso-modifiche').innerHTML = ''; };
  /* Legge i valori dei campi con attributo name dentro un elemento. */
  R.valori = (el) => {
    const v = {};
    el.querySelectorAll('[name]').forEach((c) => {
      if (c.type === 'checkbox') v[c.name] = c.checked;
      else if (c.type === 'radio') { if (c.checked) v[c.name] = c.value; }
      else v[c.name] = c.value.trim();
    });
    return v;
  };
  /* Mostra un errore sotto un campo della finestra. */
  R.erroreCampo = (finestra, nome, testo) => {
    const c = finestra.querySelector(`[name="${nome}"]`);
    if (!c) return;
    c.classList.add('con-errore');
    let e = c.parentElement.querySelector('.errore-campo');
    if (!e) { e = document.createElement('div'); e.className = 'errore-campo'; c.insertAdjacentElement('afterend', e); }
    e.textContent = testo;
    c.focus();
  };

  /* ---------------- Avvisi temporanei ---------------- */
  /* R.avviso('Affare spostato', { annulla: fn, alScadere: fn }) — con Annulla resta 10 secondi */
  R.avviso = (testo, o) => {
    o = o || {};
    const zona = document.getElementById('avvisi');
    const el = document.createElement('div');
    el.className = 'avviso';
    el.innerHTML = `<span>${testo}</span>${o.annulla ? '<button>Annulla</button>' : ''}`;
    zona.appendChild(el);
    let annullato = false;
    const durata = o.durata || (o.annulla ? 10000 : 3800);
    const t = setTimeout(() => { el.remove(); if (!annullato && o.alScadere) o.alScadere(); }, durata);
    if (o.annulla) el.querySelector('button').addEventListener('click', () => { annullato = true; clearTimeout(t); el.remove(); o.annulla(); });
    while (zona.children.length > 3) zona.firstChild.remove();
  };

  /* ---------------- Menu a tendina ---------------- */
  let tendinaAperta = null;
  R.tendina = (ancora, html) => {
    R.chiudiTendina();
    const t = document.createElement('div');
    t.className = 'tendina';
    t.innerHTML = html;
    document.body.appendChild(t);
    const r = ancora.getBoundingClientRect();
    const larg = t.offsetWidth;
    let left = r.left + window.scrollX;
    if (left + larg > window.scrollX + window.innerWidth - 10) left = window.scrollX + window.innerWidth - larg - 10;
    t.style.left = Math.max(10, left) + 'px';
    let top = r.bottom + window.scrollY + 6;
    if (r.bottom + t.offsetHeight + 10 > window.innerHeight && r.top > t.offsetHeight) top = r.top + window.scrollY - t.offsetHeight - 6;
    t.style.top = top + 'px';
    ancora.setAttribute('data-tendina-ancora', '');
    tendinaAperta = { t, ancora };
    return t;
  };
  R.chiudiTendina = () => {
    if (!tendinaAperta) return;
    tendinaAperta.t.remove();
    tendinaAperta.ancora.removeAttribute('data-tendina-ancora');
    tendinaAperta = null;
  };

  /* ---------------- Salvataggio dei campi (con connessione simulata) ---------------- */
  /* Da chiamare quando un campo cambia: aggiorna l'indicatore e, se offline, mette la modifica in attesa. */
  R.salvataggioCampo = (indicatore, descrizione) => {
    R.salva();
    if (R.stato.offline) {
      R.stato.inAttesa.push({ descrizione, quando: R.adesso() });
      R.salva();
      if (indicatore) { indicatore.className = 'stato-salvataggio attesa'; indicatore.innerHTML = `${R.icona('orologio', 14)} In attesa · si salva quando torna la connessione`; }
      return;
    }
    if (indicatore) {
      indicatore.className = 'stato-salvataggio';
      indicatore.innerHTML = `${R.icona('orologio', 14)} Salvataggio…`;
      setTimeout(() => { indicatore.className = 'stato-salvataggio ok'; indicatore.innerHTML = `${R.icona('spunta', 14)} Salvato`; }, 650);
    }
  };
  /* Per le azioni che non si possono fare senza connessione. Restituisce false se offline. */
  R.serveConnessione = (cosa) => {
    if (!R.stato.offline) return true;
    R.avviso(`Sei offline: ${cosa || 'questa azione'} si può fare quando torna la connessione`);
    return false;
  };
  R.azioni['simula-offline'] = () => { R.chiudiTendina(); R.chiudiModale(true); R.stato.offline = true; R.salva(); R.aggiorna(); R.avviso('Simulazione: connessione assente'); };
  R.azioni['torna-online'] = () => {
    const n = R.stato.inAttesa.length;
    R.stato.offline = false;
    R.stato.inAttesa = [];
    R.salva();
    R.aggiorna();
    R.avviso(n ? `Connessione tornata · ${n} ${n === 1 ? 'modifica salvata' : 'modifiche salvate'}` : 'Connessione tornata');
    document.querySelectorAll('.stato-salvataggio.attesa').forEach((i) => { i.className = 'stato-salvataggio ok'; i.innerHTML = `${R.icona('spunta', 14)} Salvato`; });
  };

  /* ---------------- Barra in alto: azienda, ricerca, notifiche, profilo ---------------- */
  R.azioni['scegli-azienda'] = (el) => {
    const u = R.utente();
    if (u.ruolo !== 'generale') return;
    const voci = R.stato.aziende.filter((a) => a.stato !== 'chiusa').map((a) => `<button data-azione="entra-azienda" data-id="${a.id}"><span class="quadratino" style="width:28px;height:28px;border-radius:9px;background:${a.colore};color:#fff">${R.esc(a.iniziale)}</span>${R.esc(a.nome)}${a.id === R.stato.aziendaAttiva ? ' · sei qui' : ''}</button>`).join('');
    R.tendina(el, `<div class="titolo-tendina">Le tue aziende</div>${voci}<button data-azione="vai" data-dove="#/impostazioni/aziende">${R.icona('piu')} Gestisci le aziende</button>`);
  };
  R.azioni['entra-azienda'] = (el) => {
    R.chiudiTendina();
    const a = R.stato.aziende.find((x) => x.id === el.dataset.id);
    if (!a) return;
    if (a.id !== 'a1') {
      R.avviso(`Nel prototipo si lavora solo dentro Inizio Impresa: le altre aziende servono per vedere il selettore`);
      return;
    }
    R.stato.aziendaAttiva = a.id; R.salva(); R.vai('#/dashboard');
  };
  R.azioni['menu-utente'] = (el) => {
    const u = R.utente();
    const altri = R.stato.utenti.filter((x) => x.id !== u.id && x.stato === 'attivo');
    R.tendina(el, `<div class="titolo-tendina">${R.esc(u.nome)} · ${R.nomeRuolo(u.ruolo)}</div>
      <button data-azione="mio-profilo">${R.icona('persona')} Il mio profilo</button>
      <div class="titolo-tendina">Prova come un'altra persona</div>
      ${altri.map((x) => `<button data-azione="prova-come" data-id="${x.id}"><span class="avatar" style="background:${x.colore}">${x.iniziali}</span>${R.esc(x.nome)} · ${R.nomeRuolo(x.ruolo)}</button>`).join('')}
      <div class="titolo-tendina">Simulazioni del prototipo</div>
      ${R.stato.offline ? `<button data-azione="torna-online">${R.icona('wifi')} Torna la connessione</button>` : `<button data-azione="simula-offline">${R.icona('wifi-no')} Simula: senza connessione</button>`}
      <button data-azione="ricomincia">${R.icona('ricarica')} Ricomincia la prova</button>`);
  };
  R.nomeRuolo = (r) => ({ generale: 'amministratore generale', azienda: 'amministratore dell\'azienda', collaboratore: 'collaboratore' }[r] || r);
  R.azioni['prova-come'] = (el) => {
    R.chiudiTendina();
    R.stato.utenteAttivo = el.dataset.id;
    R.salva();
    const u = R.utente();
    R.vai('#/dashboard');
    R.avviso(`Ora stai provando come ${u.breve} (${R.nomeRuolo(u.ruolo)})`);
  };
  R.azioni['mio-profilo'] = () => {
    R.chiudiTendina();
    const u = R.utente();
    R.modale({
      titolo: 'Il mio profilo',
      sottotitolo: 'I tuoi dati e come vuoi ricevere gli avvisi. Valgono in tutte le tue aziende.',
      proteggi: true,
      corpo: `<div class="griglia g-2">
        <div class="gruppo-campo"><label class="etichetta-campo">Nome e cognome</label><input class="campo" name="nome" value="${R.esc(u.nome)}"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Email</label><input class="campo" name="email" value="${R.esc(u.email)}"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Numero per gli avvisi (WhatsApp)</label><input class="campo" name="numeroAvvisi" value="${R.esc(u.numeroAvvisi || '')}"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Assente dal… al… (non ricevi nuovi contatti a turno)</label><input class="campo" name="assenza" placeholder="es. 10/11 – 14/11" value="${R.esc(u.assenza || '')}"></div>
      </div>
      <div class="titolo-riquadro piccolo spazio-sopra">Come ti avvisiamo</div>
      <div class="riga-impostazione"><span>Nel software (campanella)</span><label class="interruttore"><input type="checkbox" name="avvisoSoftware" ${u.avvisi.software ? 'checked' : ''}><span></span></label></div>
      <div class="riga-impostazione"><span>WhatsApp sul tuo telefono (solo nell'orario dell'azienda)</span><label class="interruttore"><input type="checkbox" name="avvisoWhatsapp" ${u.avvisi.whatsapp ? 'checked' : ''}><span></span></label></div>
      <div class="riga-impostazione"><span>Email (anche fuori orario)</span><label class="interruttore"><input type="checkbox" name="avvisoEmail" ${u.avvisi.email ? 'checked' : ''}><span></span></label></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il tuo nome.'); return false; }
          Object.assign(u, { nome: v.nome, email: v.email, numeroAvvisi: v.numeroAvvisi, assenza: v.assenza });
          u.avvisi = { software: v.avvisoSoftware, whatsapp: v.avvisoWhatsapp, email: v.avvisoEmail };
          R.salva(); R.aggiorna(); R.avviso('Profilo salvato');
        },
      }],
    });
  };

  R.azioni.notifiche = (el) => {
    const u = R.utente();
    const lista = R.stato.notifiche.filter((n) => !n.per || n.per === u.id).slice(0, 8);
    const html = lista.length ? lista.map((n) => `<button data-azione="apri-notifica" data-id="${n.id}" style="align-items:flex-start">${n.letta ? '' : '<span class="puntino" style="color:var(--errore-t);margin-top:6px"></span>'}<span><span style="display:block;${n.letta ? '' : 'font-weight:600'}">${n.testo}</span><span class="piccolo secondario">${R.esc(n.azienda ? n.azienda + ' · ' : '')}${R.quandoBreve(n.quando)}</span></span></button>`).join('') : '<div class="vuoto">Nessun avviso. Quando arriva qualcosa di nuovo lo trovi qui.</div>';
    const t = R.tendina(el, `<div class="titolo-tendina">Avvisi</div>${html}`);
    t.style.width = '340px';
  };
  R.azioni['apri-notifica'] = (el) => {
    const n = R.stato.notifiche.find((x) => x.id === el.dataset.id);
    R.chiudiTendina();
    if (!n) return;
    n.letta = true; R.salva();
    if (n.link) R.vai(n.link); else R.aggiorna();
  };
  /* Aggiunge un avviso alla campanella. */
  R.notifica = (testo, link, per) => {
    R.stato.notifiche.unshift({ id: R.id('no'), testo, link, per: per || null, quando: R.adesso(), letta: false, azienda: R.azienda().nome });
    R.salva();
  };

  /* Ricerca veloce (Ctrl+K) */
  R.azioni.cerca = () => {
    R.modale({
      titolo: 'Cerca',
      sottotitolo: 'Contatti, aziende, affari, telefoni, partite IVA e pagine. Scorciatoia: Ctrl+K.',
      corpo: `<div class="ricerca">${R.icona('cerca')}<input class="campo" style="background:var(--campo)" data-digita="cerca-digita" placeholder="Scrivi un nome, un telefono o una partita IVA"></div><div id="risultati-ricerca" class="elenco spazio-sopra"></div>`,
    });
    R.azioni['cerca-digita']({ value: '' });
  };
  R.azioni['cerca-digita'] = (el) => {
    const q = (el.value || '').toLowerCase().replace(/\s/g, '');
    const box = document.getElementById('risultati-ricerca');
    if (!box) return;
    if (!q) { box.innerHTML = '<div class="vuoto">Inizia a scrivere per cercare.</div>'; return; }
    const contatti = R.stato.contatti.filter((c) => !c.eliminato && R.contattoVisibile(c) && [c.nome, c.referente, c.telefono, c.email, c.piva].join(' ').toLowerCase().replace(/\s/g, '').includes(q)).slice(0, 6);
    const pagine = (R.stato.funnel || []).filter((f) => R.puo('funnel') && f.nome.toLowerCase().replace(/\s/g, '').includes(q)).slice(0, 3);
    let html = contatti.map((c) => `<div class="riga cliccabile" data-azione="vai" data-dove="#/contatto/${c.id}"><span class="quadratino ${c.colore || 'salvia'}">${R.iniziali(c.nome)}</span><div class="principale"><div class="titolo-riga">${R.esc(c.nome)}</div><div class="sotto">${R.esc(c.referente)} · ${R.esc(c.telefono)}</div></div></div>`).join('');
    html += pagine.map((f) => `<div class="riga cliccabile" data-azione="vai" data-dove="#/marketing/funnel/${f.id}"><span class="quadratino lavanda">${R.icona('pagina', 16)}</span><div class="principale"><div class="titolo-riga">${R.esc(f.nome)}</div><div class="sotto">Funnel · ${R.esc(f.indirizzo || '')}</div></div></div>`).join('');
    box.innerHTML = html || '<div class="vuoto">Nessun risultato. Prova con il telefono o la partita IVA.</div>';
  };

  /* Menu "Altro" sul telefono */
  R.azioni['menu-altro'] = () => {
    const voci = R.vociMenu().filter((v) => !['dashboard', 'affari', 'attivita', 'calendario'].includes(v.id));
    R.modale({
      titolo: 'Altro',
      corpo: `<div class="elenco">${voci.map((v) => `<a class="riga cliccabile" style="text-decoration:none" href="${v.href}"><span class="quadratino salvia">${R.icona(v.icona, 18)}</span><div class="principale titolo-riga">${v.testo}</div>${R.icona('destra', 16)}</a>`).join('')}
        <a class="riga cliccabile" style="text-decoration:none" href="#/cestino"><span class="quadratino pesca">${R.icona('cestino', 18)}</span><div class="principale titolo-riga">Cestino</div>${R.icona('destra', 16)}</a>
        <button class="riga cliccabile" style="border-left:0;border-right:0;border-top:0;background:none;width:100%;text-align:left" data-azione="apri-guida"><span class="quadratino lavanda">${R.icona('bussola', 18)}</span><div class="principale titolo-riga">Percorsi da provare</div>${R.icona('destra', 16)}</button></div>`,
    });
  };
  window.addEventListener('hashchange', (ev) => { R.precedente = ev.oldURL; if (modaleAperta) R.chiudiModale(true, true); R.chiudiTendina(); R.disegna(); });

  /* ---------------- Guida ai 12 percorsi del capitolo 7 ---------------- */
  R.percorsiGuida = [
    { n: 1, titolo: 'Nuovo contatto da landing page', come: 'Apri la pagina pubblica come un visitatore, compila il modulo e guarda cosa succede in Affari e nella campanella.', dove: '#/pagina/zes2026' },
    { n: 2, titolo: 'Mattina del collaboratore', come: 'Prova come Lucia (dal cerchio con le iniziali in alto a destra), guarda "Oggi" in Dashboard e apri un contatto.', dove: '#/dashboard', prima: 'prova-lucia' },
    { n: 3, titolo: 'Chiamata e prossimo passo', come: 'Nella scheda di Bianchi srl tocca il numero di telefono: scegli com\'è andata e il prossimo passo.', dove: '#/contatto/c1' },
    { n: 4, titolo: 'Invio della brochure', come: 'Nella scheda premi "Invia file", scegli la brochure e invia. Guarda lo stato del messaggio nella chat.', dove: '#/contatto/c1' },
    { n: 5, titolo: 'Avanzamento fino al contratto firmato', come: 'In Affari trascina una scheda (o usa "Sposta in…") fino a "Contratto firmato".', dove: '#/affari' },
    { n: 6, titolo: 'Affare perso', come: 'Apri un affare e premi "Segna come perso": una sola finestra con motivo, nota e attività.', dove: '#/contatto/c4' },
    { n: 7, titolo: 'Servizio WhatsApp in difficoltà', come: 'Nella pagina WhatsApp simula il servizio A fermo, poi il numero scollegato.', dove: '#/whatsapp' },
    { n: 8, titolo: 'Nuova azienda per un cliente', come: 'In Impostazioni → Le tue aziende premi "Nuova azienda per un cliente" e segui il primo avvio.', dove: '#/impostazioni/aziende' },
    { n: 9, titolo: 'Pagina creata con l\'AI e pubblicata', come: 'In Marketing premi "Crea con l\'AI", descrivi la pagina, ritoccala e pubblicala.', dove: '#/marketing/funnel' },
    { n: 10, titolo: 'Automazione da modello', come: 'In Automazioni scegli il modello "Benvenuto nuovo contatto", provalo con un contatto finto e attivalo.', dove: '#/automazioni' },
    { n: 11, titolo: 'Errore e recupero', come: 'Elimina un affare, premi "Annulla"; poi eliminalo di nuovo e ripristinalo dal Cestino.', dove: '#/affari' },
    { n: 12, titolo: 'Lavoro senza connessione', come: 'Dal cerchio con le iniziali scegli "Simula: senza connessione", modifica un campo in una scheda, poi fai tornare la connessione.', dove: '#/contatto/c2' },
  ];
  R.azioni['apri-guida'] = () => {
    R.chiudiTendina();
    R.modale({
      titolo: 'Percorsi da provare',
      sottotitolo: 'Sono i 12 percorsi del capitolo 7. Provali da computer e da telefono e annota cosa non ti convince. I dati sono inventati e nessun messaggio parte davvero.',
      classe: 'larga',
      corpo: `<div>${R.percorsiGuida.map((p) => `<div class="percorso-guida"><span class="n">${p.n}</span><div class="principale"><div class="grassetto">${p.titolo}</div><div class="secondario" style="font-size:13px">${p.come}</div></div><button class="btn piccolo primario" data-azione="inizia-percorso" data-n="${p.n}">Inizia</button></div>`).join('')}</div>`,
    });
  };
  R.azioni['inizia-percorso'] = (el) => {
    const p = R.percorsiGuida.find((x) => x.n === +el.dataset.n);
    R.chiudiModale(true);
    if (p.prima === 'prova-lucia') { R.stato.utenteAttivo = 'u2'; R.salva(); R.avviso('Ora stai provando come Lucia (collaboratrice)'); }
    else if (R.stato.utenteAttivo !== 'u1' && p.n !== 2) { R.stato.utenteAttivo = 'u1'; R.salva(); R.avviso('Ora stai provando come Salvatore (amministratore generale)'); }
    R.vai(p.dove);
  };

  /* ---------------- Icone (linee sottili) ---------------- */
  const ICONE = {
    casa: '<path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4z"/>',
    colonne: '<rect x="4" y="4" width="4.5" height="16" rx="1.5"/><rect x="10" y="4" width="4.5" height="11" rx="1.5"/><rect x="16" y="4" width="4" height="8" rx="1.5"/>',
    persone: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9.5" r="2.5"/><path d="M15.5 14.3c2.4-.2 4.3 1.3 5 4.2"/>',
    persona: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.8 3.6-5.8 7-5.8s6.2 2 7 5.8"/>',
    spunta: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    calendario: '<rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    pagina: '<rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    fulmine: '<path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12z"/>',
    whatsapp: '<path d="M5 19.5 6.1 16A7.5 7.5 0 1 1 8.6 18.6z"/><path d="M9.3 9.2c.3 2.5 2.4 4.6 5 5l1-1.3-1.8-1-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-1-1.8z"/>',
    grafico: '<path d="M5 20V10M10.5 20V5M16 20v-7M3.5 20h17"/>',
    ingranaggio: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"/>',
    campanella: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>',
    cerca: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.6-4.6"/>',
    telefono: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>',
    email: '<rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="m4.5 7 7.5 6 7.5-6"/>',
    orologio: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    nota: '<path d="M5 19.5h4l10-10-4-4-10 10z"/><path d="m13.5 7 3.5 3.5"/>',
    graffetta: '<path d="m19 11.5-7.2 7.2a4.5 4.5 0 0 1-6.4-6.4l7.6-7.6a3 3 0 0 1 4.3 4.3l-7.3 7.3a1.5 1.5 0 0 1-2.1-2.1l6.6-6.6"/>',
    file: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5v4h4"/>',
    piu: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    giu: '<path d="m7 10 5 5 5-5"/>',
    su: '<path d="m7 14 5-5 5 5"/>',
    destra: '<path d="m10 7 5 5-5 5"/>',
    sinistra: '<path d="m14 7-5 5 5 5"/>',
    freccia: '<path d="M5 12h13M13 7l5 5-5 5"/>',
    'freccia-sinistra': '<path d="M19 12H6M11 7l-5 5 5 5"/>',
    puntini: '<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>',
    cestino: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    annulla: '<path d="M9 7 5 11l4 4"/><path d="M5 11h9a5 5 0 0 1 0 10h-2"/>',
    ripeti: '<path d="m15 7 4 4-4 4"/><path d="M19 11h-9a5 5 0 0 0 0 10h2"/>',
    occhio: '<path d="M3 12s3.3-6 9-6 9 6 9 6-3.3 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/>',
    computer: '<rect x="3.5" y="5" width="17" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>',
    tablet: '<rect x="5.5" y="3.5" width="13" height="17" rx="2.5"/><path d="M11 17.5h2"/>',
    cellulare: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
    stelline: '<path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    filtro: '<path d="M4 6h16l-6 7.5V19l-4 1.5v-7z"/>',
    'wifi-no': '<path d="M4 9.5a12 12 0 0 1 4-2.3M12 6.5c2.9 0 5.6 1.1 8 3M7 13a7 7 0 0 1 2.5-1.5M14.8 11.6c.9.4 1.6.9 2.2 1.4M10 16.5a3 3 0 0 1 4 0M4 4l16 16"/>',
    wifi: '<path d="M4 9.5a12.5 12.5 0 0 1 16 0M7 13a8 8 0 0 1 10 0M10 16.5a3 3 0 0 1 4 0"/><circle cx="12" cy="19.5" r=".8"/>',
    allarme: '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    lucchetto: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    copia: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    pausa: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    griglia: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    sposta: '<path d="M12 3.5v17M3.5 12h17M9 6.5l3-3 3 3M9 17.5l3 3 3-3M6.5 9l-3 3 3 3M17.5 9l3 3-3 3"/>',
    trascina: '<circle cx="9" cy="6.5" r="1.2"/><circle cx="15" cy="6.5" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="17.5" r="1.2"/><circle cx="15" cy="17.5" r="1.2"/>',
    immagine: '<rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m5 17 4.5-4.5 3 3 2.5-2.5L20 17.5"/>',
    video: '<rect x="3.5" y="6" width="12.5" height="12" rx="2.5"/><path d="m16 10.5 4.5-2.5v8L16 13.5z"/>',
    testo: '<path d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5"/>',
    modulo: '<rect x="4" y="4.5" width="16" height="15" rx="3"/><path d="M8 9h8M8 12.5h8M8 16h4"/>',
    mappa: '<path d="M12 20.5s6-5.6 6-10.2a6 6 0 0 0-12 0c0 4.6 6 10.2 6 10.2z"/><circle cx="12" cy="10.3" r="2.2"/>',
    stella: '<path d="m12 4.5 2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 16.4l-4.6 2.4.9-5.2-3.8-3.6 5.2-.7z"/>',
    domanda: '<circle cx="12" cy="12" r="8"/><path d="M9.8 9.6a2.3 2.3 0 0 1 4.4 1c0 1.6-2.2 2-2.2 3.4M12 16.8v.2"/>',
    globo: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.2 2.3 3.2 5 3.2 8s-1 5.7-3.2 8c-2.2-2.3-3.2-5-3.2-8s1-5.7 3.2-8z"/>',
    carica: '<path d="M12 15.5V4.5M7.5 9 12 4.5 16.5 9M5 15v4h14v-4"/>',
    scarica: '<path d="M12 4.5v11M7.5 11l4.5 4.5 4.5-4.5M5 15v4h14v-4"/>',
    bussola: '<circle cx="12" cy="12" r="8"/><path d="m15 9-1.8 4.2L9 15l1.8-4.2z"/>',
    ricarica: '<path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19.5 4.5V8H16"/>',
    invia: '<path d="M4.5 12 19.5 5l-3.5 14.5-4.2-5.3z"/><path d="m11.8 14.2 7.7-9.2"/>',
    colonna: '<rect x="4" y="5" width="7" height="14" rx="2"/><rect x="13" y="5" width="7" height="14" rx="2"/>',
    timer: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.5 1.5M9.5 3.5h5"/>',
    divisore: '<path d="M4 12h16M8 7h8M8 17h8"/>',
    codice: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4"/>',
    barra: '<rect x="3.5" y="10" width="17" height="4" rx="2"/><path d="M3.5 12h9"/>',
    social: '<circle cx="7" cy="12" r="2.3"/><circle cx="17" cy="6.5" r="2.3"/><circle cx="17" cy="17.5" r="2.3"/><path d="m9 11 6-3.4M9 13l6 3.4"/>',
    galleria: '<rect x="3.5" y="5.5" width="11" height="9" rx="2"/><path d="M17.5 8.5h3v10h-11v-3"/>',
    occhio_no: '<path d="M4 4l16 16M10.6 6.1A8.6 8.6 0 0 1 12 6c5.7 0 9 6 9 6a15 15 0 0 1-2.2 3M6.6 7.6C4.4 9.2 3 12 3 12s3.3 6 9 6c1.3 0 2.5-.3 3.6-.8"/>',
  };
  R.icona = (nome, dim) => `<svg width="${dim || 18}" height="${dim || 18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONE[nome] || ICONE.puntini}</svg>`;

  /* ---------------- Pagina non trovata ---------------- */
  R.rotta('/non-nel-prototipo', {
    menu: 'dashboard',
    disegna: () => `<div class="testata"><div><h1 class="titolo-pagina">Non è nel prototipo</h1></div></div><div class="riquadro vuoto">Questa schermata non fa parte del prototipo: esisterà nel software vero. <a class="link verde" href="#/dashboard">Torna alla Dashboard</a></div>`,
  });
})();
