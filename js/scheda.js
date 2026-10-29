/* Rampant — prototipo. Scheda del contatto (immagine 07, capitolo 9.3): dati, fasi, azioni, storia e chat WhatsApp. */
(function () {
  'use strict';
  const R = window.R;
  let inModifica = null; // id del contatto con i campi aperti in modifica
  let cercaChat = '';
  let timerCampo = null;

  const NOMI_CONSENSO = { si: 'Sì', 'non-registrato': 'Non registrato', no: 'No', 'non-disturbare': 'Non disturbare' };
  const CLASSE_CONSENSO = { si: 'salvia', 'non-registrato': '', no: 'errore', 'non-disturbare': 'pesca' };
  const CAMPI = [
    ['telefono', 'Telefono'], ['email', 'Email'], ['piva', 'Partita IVA'], ['ateco', 'Codice Ateco'],
    ['regione', 'Regione'], ['dipendenti', 'Dipendenti'], ['referente', 'Referente'], ['ruoloReferente', 'Ruolo del referente'],
  ];

  R.rotta('/contatto/:id', {
    menu: 'affari',
    titolo: (p) => (R.contatto(p.id) || {}).nome || 'Contatto',
    disegna: (p, q) => disegnaScheda(p.id, q),
    dopo: (p, q) => {
      if (q.chat) {
        const box = document.getElementById('chat-riquadro');
        if (box) { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => { const i = document.getElementById('scrivi-wa'); if (i) i.focus({ preventScroll: true }); }, 400); }
      }
      const area = document.getElementById('chat-area');
      if (area) area.scrollTop = area.scrollHeight;
    },
  });

  function affareScelto(c, q) {
    const affari = R.affariDelContatto(c.id).filter((a) => R.affareVisibile(a) || R.puo('vedeTutti'));
    if (q.affare) { const a = affari.find((x) => x.id === q.affare); if (a) return a; }
    return affari.filter((a) => a.stato === 'aperto').sort((a, b) => new Date(b.creato) - new Date(a.creato))[0] || affari[0] || null;
  }

  function disegnaScheda(id, q) {
    const c = R.contatto(id);
    if (!c || c.eliminato) return `<div class="riquadro vuoto spazio-sopra">Questo contatto non c'è più: forse è nel <a class="link verde" href="#/cestino">Cestino</a>.</div>`;
    if (!R.contattoVisibile(c)) return `<div class="riquadro vuoto spazio-sopra"><p class="grassetto">Questo contatto è seguito da un collega.</p><p>Non puoi vederne i dati. Se ti serve, chiedi a un amministratore di aggiungerti come seguace.</p><a class="btn" href="#/affari">Torna agli Affari</a></div>`;
    const a = affareScelto(c, q);
    const tuttiAffari = R.affariDelContatto(c.id);
    const percorso = a ? R.percorso(a.percorso) : null;
    const vinta = a ? R.faseVinta(a.percorso) : null;
    const resp = R.utenteDa(a ? a.responsabile : c.responsabile);
    const num = R.datiNumero(R.numeroDelContatto(c));
    const presenza = c.responsabile && c.responsabile !== R.utente().id && ['c1', 'c5', 'c3'].includes(c.id) ? R.utenteDa(c.responsabile) : null;

    const testata = `
      <div class="testata" style="margin-bottom:16px">
        <div style="min-width:0">
          <button class="indietro" data-azione="sc-indietro">${R.icona('freccia-sinistra', 14)} Affari${percorso ? ' · ' + R.esc(percorso.nome) : ''}</button>
          <h1 class="titolo-pagina">${R.esc(c.nome)}</h1>
          <div class="secondario" style="font-size:15px;margin-top:8px">${R.esc(c.referente)}${c.ruoloReferente ? ', ' + R.esc(c.ruoloReferente) : ''}${a && a.bando ? ' · ' + R.esc(a.bando) : ''} · ${a && a.responsabile || c.responsabile ? 'seguito da ' + R.esc(resp.breve) : '<span style="color:var(--errore-t)">senza responsabile</span>'}
          ${presenza ? `<span class="etichetta cielo" style="margin-left:6px">${R.esc(presenza.breve)} è su questa scheda</span>` : ''}</div>
        </div>
        <div class="azioni-testata">
          <button class="btn tondo" data-azione="sc-menu" data-c="${c.id}" data-a="${a ? a.id : ''}" aria-label="Altre azioni">${R.icona('puntini')}</button>
          ${a && a.stato === 'aperto' ? `<button class="btn" data-azione="sc-perso" data-a="${a.id}">Segna come perso</button><button class="btn" style="color:var(--verde)" data-azione="sc-vinto" data-a="${a.id}">${R.esc(vinta.nome)}</button>` : ''}
          ${a && a.stato !== 'aperto' ? `<span class="etichetta ${a.stato === 'vinto' ? 'salvia' : 'errore'}" style="font-size:13px;padding:8px 14px">${a.stato === 'vinto' ? R.esc(vinta.nome) : 'Perso' + (a.motivoPerdita ? ' · ' + R.esc(a.motivoPerdita) : '')}</span><button class="btn" data-azione="sc-riapri" data-a="${a.id}">Riapri</button>` : ''}
          <button class="btn whatsapp primo-telefono" style="min-height:50px;padding:0 26px;font-size:15px" data-azione="sc-vai-chat">${R.icona('whatsapp', 20)} WhatsApp</button>
        </div>
      </div>`;

    const selettoreAffari = tuttiAffari.length > 1 || !a ? `
      <div class="riga-flex" style="margin-bottom:12px"><span class="secondario piccolo">Affari di questo contatto:</span>
        ${tuttiAffari.map((x) => R.affareVisibile(x) || R.puo('vedeTutti')
          ? `<a class="pillola ${a && x.id === a.id ? 'attiva' : ''}" style="text-decoration:none" href="#/contatto/${c.id}?affare=${x.id}">${R.esc(x.nome)} · ${R.esc(R.nomeFase(x))}</a>`
          : `<span class="pillola" title="Affare seguito da un collega">${R.esc(x.nome)} · ${R.esc(R.nomeFase(x))} · ${R.esc(R.utenteDa(x.responsabile).breve)}</span>`).join('')}
        <button class="pillola tratteggiata" data-azione="sc-crea-affare" data-c="${c.id}">+ Crea affare</button></div>` : '';

    let barraFasi = '';
    if (a) {
      const fasi = percorso.fasi.filter((f) => f.tipo !== 'perso' || a.stato === 'perso');
      const idxAttuale = fasi.findIndex((f) => f.id === a.fase);
      barraFasi = `<div class="barra-fasi" role="group" aria-label="Fasi dell'affare" style="margin-bottom:var(--spazio)">${fasi.map((f, i) => {
        const cl = f.id === a.fase ? (a.stato === 'perso' ? 'persa' : 'attuale') : i < idxAttuale ? 'passata' : '';
        return `<button class="${cl}" data-azione="sc-fase" data-a="${a.id}" data-fase="${f.id}" ${f.id === a.fase ? 'aria-current="step"' : ''}>${R.esc(f.nome)}</button>`;
      }).join('')}</div>`;
    }

    return testata + selettoreAffari + barraFasi + `
      <div class="griglia" style="grid-template-columns:minmax(0,0.92fr) minmax(0,1.3fr)" id="scheda-colonne">
        <div class="griglia" style="align-content:start">${colonnaSinistra(c, a)}</div>
        <div class="griglia" style="align-content:start">${colonnaDestra(c, a, num)}${chiEConsensi(c, a)}</div>
      </div>
      ${riquadroChat(c, num)}`;
  }

  /* ---------------- Colonna sinistra: dati ---------------- */
  function colonnaSinistra(c, a) {
    const modifica = inModifica === c.id;
    const campo = ([k, et]) => {
      const v = c[k] == null ? '' : String(c[k]);
      if (modifica) return `<div><label class="etichetta-campo" for="campo-${k}" style="margin-left:0">${et}</label><input id="campo-${k}" class="campo" style="min-height:40px" value="${R.esc(v)}" data-digita="sc-campo" data-cambia="sc-campo-subito" data-campo="${k}" data-c="${c.id}"></div>`;
      let valore = v ? R.esc(v) : '<span class="secondario">—</span>';
      if (k === 'telefono' && v) valore = `<button class="link verde" style="font-size:14px;font-weight:600;text-decoration:none" data-azione="ve-chiama" data-c="${c.id}" data-a="${a ? a.id : ''}">${R.esc(v)}</button>`;
      if (k === 'email' && v) valore = `<button class="link verde" style="font-size:14px;font-weight:600;text-decoration:none" data-azione="sc-scheda-azione" data-tab="email">${R.esc(v)}</button>`;
      return `<div><div class="secondario" style="font-size:12.5px">${et}</div><div class="grassetto" style="font-size:14px;word-break:break-word">${valore}</div></div>`;
    };
    const doc = a && a.documenti && a.documenti.length ? a.documenti : null;
    const consensi = c.consensi || {};
    return `
      <div class="riquadro">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Azienda e referente</h2>
          <div class="riga-flex">${modifica ? `<span class="stato-salvataggio" id="indicatore-salvataggio">${R.stato.offline ? 'Sei offline: le modifiche restano in attesa' : 'Si salva da solo'}</span><button class="link verde" data-azione="sc-modifica" data-c="${c.id}">Fatto</button>` : `<button class="link verde" data-azione="sc-modifica" data-c="${c.id}">Modifica</button>`}</div></div>
        <div class="griglia" style="gap:14px 18px;grid-template-columns:repeat(2,minmax(0,1fr))">${CAMPI.slice(0, modifica ? 8 : 6).map(campo).join('')}</div>
        ${(c.altriTelefoni || []).length ? `<div class="piccolo secondario" style="margin-top:10px">Altri telefoni: ${c.altriTelefoni.map(R.esc).join(', ')}</div>` : ''}
      </div>
      ${a ? `<div class="riquadro salvia">
        <h2 class="titolo-riquadro" style="margin-bottom:6px">${a.percorso === 'p1' ? 'Bando e investimento' : 'Interesse e valore'}</h2>
        ${modifica ? `<input class="campo su-beige" style="font-family:var(--titoli);font-size:28px;font-weight:700;min-height:56px;margin:6px 0" value="${a.valore || ''}" inputmode="numeric" data-digita="sc-campo" data-cambia="sc-campo-subito" data-campo="valore" data-affare="${a.id}" data-c="${c.id}">` : `<div class="numero-medio" style="font-size:44px;margin:10px 0 6px">${a.valore ? R.euro(a.valore) : 'Da definire'}</div>`}
        <div>${R.esc(a.nome)}</div>
      </div>` : ''}
      ${doc ? `<div class="riquadro">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Documenti richiesti</h2><span class="etichetta ${doc.every((d) => d.ricevuto) ? 'salvia' : 'pesca'}">${doc.filter((d) => d.ricevuto).length} di ${doc.length} ricevuti</span></div>
        <div class="elenco">${doc.map((d, i) => `<label class="riga" style="min-height:46px;padding:8px 0;cursor:pointer"><input type="checkbox" ${d.ricevuto ? 'checked' : ''} data-cambia="sc-documento" data-a="${a.id}" data-i="${i}" style="width:20px;height:20px;accent-color:var(--verde)"><span class="principale">${R.esc(d.nome)}</span><span class="etichetta ${d.ricevuto ? 'salvia' : 'errore'}">${d.ricevuto ? 'ricevuto' : 'mancante'}</span></label>`).join('')}</div>
        <div class="riga-flex spazio-sopra"><button class="btn piccolo secondario-campo" data-azione="sc-portale" data-c="${c.id}">${R.icona('lucchetto', 16)} Invita al portale clienti</button><button class="btn piccolo secondario-campo" data-azione="sc-aggiungi-doc" data-a="${a.id}">${R.icona('piu', 16)} Aggiungi documento</button></div>
      </div>` : ''}
      <div class="riquadro">
        <h2 class="titolo-riquadro">Da dove arriva</h2>
        <div class="riga-flex" style="gap:8px">${c.fonte ? `<span class="etichetta cielo" style="font-size:12.5px;padding:6px 12px">${R.esc(c.fonte)}</span>` : ''}${c.campagna ? `<span class="etichetta" style="font-size:12.5px;padding:6px 12px">Campagna ${R.esc(c.campagna)}</span>` : ''}${c.pagina ? `<span class="etichetta" style="font-size:12.5px;padding:6px 12px">${R.esc(c.pagina)}</span>` : ''}</div>
        <div class="piccolo secondario" style="margin-top:10px">Arrivato ${R.giornoRelativo(c.creato)} alle ${R.ora(c.creato)}</div>
      </div>
      ${(() => { const q = R.sequenzaDi && R.sequenzaDi(c); return q ? `<div class="riquadro"><h2 class="titolo-riquadro">Sequenza email</h2><div class="grassetto" style="font-size:14px">${R.esc(q.nome)}</div><div class="piccolo secondario" style="margin-top:4px">Giorno ${q.giorno} · ${q.prossimo ? 'prossimo messaggio al giorno ' + q.prossimo.giorno + ' («' + R.esc(q.prossimo.oggetto) + '»)' : 'tutti i messaggi sono partiti'}</div><a class="link verde piccolo" href="#/marketing/sequenze" style="display:inline-block;margin-top:8px">Vedi la sequenza</a></div>` : ''; })()}
      <button class="riquadro tratteggiato" style="font-weight:600;cursor:pointer;color:var(--testo-3)" data-azione="sc-aggiungi-campo">+ Aggiungi sezione o campo</button>`;
  }

  /* ---------------- Chi lo segue e consensi (in fondo alla colonna destra) ---------------- */
  function chiEConsensi(c, a) {
    const consensi = c.consensi || {};
    return `
      <div class="riquadro">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Chi lo segue</h2></div>
        ${a ? `<div class="riga" style="padding-top:0"><span class="principale"><span class="secondario piccolo">Responsabile dell'affare</span><br>${a.responsabile ? `${R.avatar(a.responsabile)} <b>${R.esc(R.utenteDa(a.responsabile).nome)}</b>` : '<span style="color:var(--errore-t)">Nessuno</span>'}</span>
          ${R.amministratore() ? `<button class="btn piccolo secondario-campo" data-azione="sc-responsabile" data-a="${a.id}">${a.responsabile ? 'Cambia' : 'Assegna'}</button>` : a.responsabile === R.utente().id ? `<button class="btn piccolo secondario-campo" data-azione="sc-passa" data-a="${a.id}">Passa a un collega</button>` : ''}</div>` : ''}
        <div class="riga"><span class="principale"><span class="secondario piccolo">Responsabile del contatto (riceve gli avvisi del contatto)</span><br>${c.responsabile ? `${R.avatar(c.responsabile)} <b>${R.esc(R.utenteDa(c.responsabile).nome)}</b>` : '<span style="color:var(--errore-t)">Nessuno</span>'}</span></div>
        ${a ? `<div class="riga" style="padding-bottom:0"><span class="principale"><span class="secondario piccolo">Seguaci (vedono l'affare senza esserne responsabili)</span><br>${(a.seguaci || []).length ? a.seguaci.map((s) => `${R.avatar(s)} ${R.esc(R.utenteDa(s).breve)}`).join(' ') : '<span class="secondario">Nessuno</span>'}</span>${R.amministratore() || a.responsabile === R.utente().id ? `<button class="btn piccolo secondario-campo" data-azione="sc-seguace" data-a="${a.id}">Aggiungi</button>` : ''}</div>` : ''}
      </div>
      <div class="riquadro">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Consensi</h2>${R.amministratore() ? `<button class="link verde" data-azione="sc-consensi" data-c="${c.id}">Cambia</button>` : ''}</div>
        <div class="riga-flex"><span>WhatsApp</span><span class="etichetta ${CLASSE_CONSENSO[consensi.whatsapp] || ''}">${NOMI_CONSENSO[consensi.whatsapp] || 'Non registrato'}</span><span style="width:12px"></span><span>Email</span><span class="etichetta ${CLASSE_CONSENSO[consensi.email] || ''}">${NOMI_CONSENSO[consensi.email] || 'Non registrato'}</span></div>
        <div class="piccolo secondario" style="margin-top:8px">${consensi.whatsapp === 'si' ? 'Può ricevere messaggi automatici e campagne.' : consensi.whatsapp === 'non-registrato' ? 'Puoi scrivergli a mano; automazioni e campagne sono bloccate finché non c\'è il consenso.' : consensi.whatsapp === 'no' ? 'Nessun messaggio WhatsApp.' : 'Ha scritto STOP: rispondi solo se ti riscrive.'}</div>
      </div>
`;
  }

  /* ---------------- Colonna destra: azioni, prossima cosa, storia ---------------- */
  function colonnaDestra(c, a, num) {
    const f = R.stato.filtri.scheda = Object.assign({ tab: 'wa', storia: 'tutto' }, R.stato.filtri.scheda);
    const tab = f.tab;
    const nomeBreve = R.esc(c.referente.split(' ')[0]);
    const contenutoTab = {
      wa: `<div class="scrivi-chat" style="margin-top:12px"><input class="campo" id="scrivi-wa-rapido" placeholder="Scrivi a ${nomeBreve} su WhatsApp, dal numero di ${R.esc(num.nome)}" data-invio="sc-invia-rapido" data-c="${c.id}"><button class="btn piccolo nascondi-telefono" style="background:transparent" data-azione="sc-allega-brochure" data-c="${c.id}">Allega brochure</button><button class="btn primario" data-azione="sc-invia-rapido" data-c="${c.id}">Invia</button></div>`,
      email: `<div style="margin-top:12px"><input class="campo" name="oggetto" id="email-oggetto" placeholder="Oggetto" style="margin-bottom:8px"><textarea class="campo" id="email-testo" placeholder="Scrivi a ${nomeBreve} (${R.esc(c.email || 'nessuna email')})"></textarea><div class="riga-flex spazio-sopra" style="justify-content:space-between"><span class="piccolo secondario">Le risposte arrivano nella storia di questo contatto.</span><button class="btn primario" data-azione="sc-invia-email" data-c="${c.id}" data-a="${a ? a.id : ''}">Invia email</button></div></div>`,
      promemoria: `<div style="margin-top:12px"><input class="campo" id="prom-titolo" placeholder="Cosa devi fare? Es. Richiamare per i documenti" style="margin-bottom:8px"><div class="riga-flex"><input type="datetime-local" class="campo" id="prom-quando" style="max-width:250px"><button class="btn piccolo secondario-campo" data-azione="sc-prom-rapido" data-giorni="0">Oggi 18:00</button><button class="btn piccolo secondario-campo" data-azione="sc-prom-rapido" data-giorni="1">Domani</button><button class="btn piccolo secondario-campo" data-azione="sc-prom-rapido" data-giorni="3">Tra 3 giorni</button></div><div class="riga-flex spazio-sopra" style="justify-content:flex-end"><button class="btn primario" data-azione="sc-salva-promemoria" data-c="${c.id}" data-a="${a ? a.id : ''}">Salva promemoria</button></div></div>`,
      nota: `<div style="margin-top:12px"><textarea class="campo" id="nota-testo" placeholder="Scrivi una nota. La vedono tutti quelli che vedono questo cliente. Usa @ per avvisare un collega."></textarea><div class="riga-flex spazio-sopra" style="justify-content:flex-end"><button class="btn primario" data-azione="sc-salva-nota" data-c="${c.id}" data-a="${a ? a.id : ''}">Salva nota</button></div></div>`,
    };
    const t = a ? R.prossimaAttivita(a.id) : null;
    const prossima = a && a.stato === 'aperto' ? (t
      ? `<div class="riquadro scuro" style="padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px"><div><div style="color:var(--lime);font-size:12.5px">${R.scaduta(t) ? 'Scaduto' : 'Da fare'} · ${R.giornoRelativo(t.quando)} ${R.ora(t.quando)}</div><div class="grassetto" style="font-size:16px">${R.esc(t.titolo)}</div></div><button class="btn lime" data-azione="ve-fatta" data-id="${t.id}">Fatto</button></div>`
      : `<div class="riquadro scuro" style="padding:18px 22px"><div style="color:var(--pesca);font-size:12.5px">Nessun prossimo passo</div><div class="grassetto" style="font-size:16px;margin-bottom:10px">Cosa farai con ${nomeBreve}?</div><div class="riga-flex"><button class="btn piccolo lime" data-azione="sc-passo-rapido" data-giorni="1" data-c="${c.id}" data-a="${a.id}">Richiama domani</button><button class="btn piccolo" style="background:var(--scuro-2);color:#fff" data-azione="sc-passo-rapido" data-giorni="3" data-c="${c.id}" data-a="${a.id}">Tra 3 giorni</button><button class="btn piccolo" style="background:var(--scuro-2);color:#fff" data-azione="sc-prossimo-passo" data-c="${c.id}" data-a="${a.id}">Scegli…</button></div></div>`) : '';
    return `
      <div class="riquadro" style="padding:18px">
        <div class="pillole su-bianco">${[['wa', 'WhatsApp'], ['email', 'Email'], ['promemoria', 'Promemoria'], ['nota', 'Nota']].map(([k, t2]) => `<button class="pillola ${tab === k ? 'attiva' : ''}" style="${tab === k ? 'background:var(--salvia);color:var(--salvia-t)' : ''}" data-azione="sc-scheda-azione" data-tab="${k}">${t2}</button>`).join('')}<button class="pillola" data-azione="sc-invia-file" data-c="${c.id}">Invia file</button></div>
        ${contenutoTab[tab] || ''}
      </div>
      ${prossima}
      <div class="riquadro">
        <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Storia</h2>
        <div class="selettore su-bianco">${[['tutto', 'Tutto'], ['messaggi', 'Messaggi'], ['email', 'Email'], ['attivita', 'Attività'], ['modifiche', 'Modifiche']].map(([k, t2]) => `<button class="${f.storia === k ? 'attivo' : ''}" data-azione="sc-filtro-storia" data-f="${k}">${t2}</button>`).join('')}</div></div>
        <div class="elenco" id="storia">${storia(c, f.storia)}</div>
      </div>`;
  }

  function storia(c, filtro) {
    const visibile = (e) => !e.affare || (() => { const a = R.affare(e.affare); return !a || R.affareVisibile(a) || e.tipo === 'fase'; })();
    let eventi = R.stato.storia.filter((e) => e.contatto === c.id && visibile(e)).map((e) => Object.assign({}, e));
    // Messaggi WhatsApp raggruppati per giorno
    const perGiorno = {};
    R.stato.messaggi.filter((m) => m.contatto === c.id).forEach((m) => { const k = new Date(m.quando).toDateString(); (perGiorno[k] = perGiorno[k] || []).push(m); });
    Object.values(perGiorno).forEach((lista) => {
      lista.sort((x, y) => new Date(x.quando) - new Date(y.quando));
      const ultimi = lista.slice(-2);
      eventi.push({ tipo: 'wa', quando: lista[lista.length - 1].quando, testo: ultimi.map((m) => `${m.direzione === 'in' ? R.esc(c.referente.split(' ')[0]) : m.automatico ? 'Automatico' : R.esc(R.utenteDa(m.autore).breve)}: ${m.file ? R.esc(m.file.nome) : '«' + R.esc(m.testo) + '»'}`).join('<br>'), html: true, autore: null });
    });
    const gruppi = { messaggi: ['wa'], email: ['email'], attivita: ['attivita', 'chiamata', 'nota', 'appuntamento'], modifiche: ['modifica', 'fase'] };
    if (filtro !== 'tutto') eventi = eventi.filter((e) => gruppi[filtro].includes(e.tipo));
    eventi.sort((x, y) => new Date(y.quando) - new Date(x.quando));
    if (!eventi.length) return '<div class="vuoto">Qui comparirà tutto quello che succede con questo cliente.</div>';
    const icone = { wa: ['WA', 'salvia'], email: ['@', 'cielo'], fase: ['→', ''], modulo: ['✓', ''], nota: ['N', 'lavanda'], chiamata: ['TEL', 'pesca'], attivita: ['✓', 'salvia'], modifica: ['M', ''], automazione: ['A', 'lavanda'], appuntamento: ['APP', 'salvia'] };
    const nomi = { wa: 'WhatsApp', email: 'Email', fase: 'Fase', modulo: 'Modulo', nota: 'Nota', chiamata: 'Chiamata', attivita: 'Attività', modifica: 'Modifica', automazione: 'Automazione', appuntamento: 'Appuntamento' };
    return eventi.slice(0, 14).map((e) => {
      const [sig, col] = icone[e.tipo] || ['·', ''];
      const autore = R.nomeAutore(e.autore);
      return `<div class="evento"><span class="quadratino ${col}">${sig}</span><div><div class="quando">${nomi[e.tipo] || ''} · ${R.giornoRelativo(e.quando)} ${R.ora(e.quando)}${autore ? ' · ' + R.esc(autore) : ''}</div><div>${e.html ? e.testo : R.esc(e.testo)}</div></div></div>`;
    }).join('');
  }

  /* ---------------- Chat WhatsApp ---------------- */
  function riquadroChat(c, num) {
    const nomeBreve = R.esc(c.referente.split(' ')[0]);
    const statoNum = R.statoNumero ? R.statoNumero(num.id) : 'A collegato · B pronto';
    const guasto = /scollegato|fermo su entrambi/i.test(statoNum);
    return `
      <div class="riquadro spazio-sopra" id="chat-riquadro" style="padding:22px">
        <div class="intestazione-riquadro" style="flex-wrap:wrap">
          <div class="riga-flex" style="flex-wrap:nowrap"><span class="quadratino salvia" style="width:44px;height:44px">WA</span><div><h2 class="titolo-riquadro" style="font-size:24px">Chat WhatsApp con ${nomeBreve}</h2><div class="piccolo secondario">${R.esc(c.telefono)} · tutta la conversazione, anche i messaggi automatici</div></div></div>
          <div class="riga-flex">
            <span class="etichetta ${guasto ? 'errore' : 'bianca'}" style="background:${guasto ? '' : 'var(--campo)'};font-size:12.5px;padding:8px 14px;font-weight:500"><span class="puntino" style="color:${guasto ? 'var(--errore-t)' : 'var(--wa-pulsante)'}"></span> Dal numero di ${R.esc(num.nome)} · ${R.esc(statoNum.replace(/^A collegato · B pronto$/, 'riserva pronta'))}</span>
            <button class="btn piccolo secondario-campo" data-azione="sc-cerca-chat">${R.icona('cerca', 15)} Cerca nella chat</button>
          </div>
        </div>
        ${cercaChat !== null && cercaChat !== '' ? '' : ''}
        <div id="zona-cerca-chat"></div>
        <div class="chat-sfondo" id="chat-area">${messaggi(c)}</div>
        <div class="pillole" style="margin-top:14px">${R.stato.libreria.slice(0, 2).map((l) => `<button class="pillola" style="background:var(--lavanda);color:var(--lavanda-t);font-weight:600" data-azione="sc-invia-libreria" data-c="${c.id}" data-l="${l.id}">${R.esc(l.nome.replace(/\.pdf$/, ''))}</button>`).join('')}${R.stato.risposte.slice(0, 2).map((r) => `<button class="pillola su-bianco" style="background:var(--campo)" data-azione="sc-risposta" data-testo="${R.esc(r)}">Risposta pronta: «${R.esc(r)}»</button>`).join('')}</div>
        <div class="scrivi-chat"><button class="btn tondo secondario-campo" style="width:52px;height:52px" data-azione="sc-invia-file" data-c="${c.id}" aria-label="Allega un file">${R.icona('piu')}</button><input class="campo" id="scrivi-wa" placeholder="Scrivi un messaggio a ${nomeBreve}" data-invio="sc-invia" data-c="${c.id}"><button class="btn primario" style="min-height:52px;padding:0 26px" data-azione="sc-invia" data-c="${c.id}">Invia</button></div>
      </div>`;
  }

  function messaggi(c) {
    let lista = R.stato.messaggi.filter((m) => m.contatto === c.id).sort((a, b) => new Date(a.quando) - new Date(b.quando));
    if (cercaChat) lista = lista.filter((m) => (m.testo + ' ' + (m.file ? m.file.nome : '')).toLowerCase().includes(cercaChat.toLowerCase()));
    if (!lista.length) return `<div class="vuoto">${cercaChat ? 'Nessun messaggio con queste parole.' : `Nessun messaggio con ${R.esc(c.referente.split(' ')[0])}. Scrivi il primo qui sotto.`}</div>`;
    let giorno = '';
    return lista.map((m) => {
      let sep = '';
      const g = new Date(m.quando).toDateString();
      if (g !== giorno) { giorno = g; const rel = R.giornoRelativo(m.quando); sep = `<div class="giorno-chat"><span>${['oggi', 'ieri'].includes(rel) ? R.maiuscola(rel) : R.maiuscola(R.dataLunga(m.quando))}</span></div>`; }
      const inviato = m.direzione === 'out';
      const chi = inviato ? (m.automatico ? 'Messaggio automatico' : R.esc(R.utenteDa(m.autore).breve)) : R.esc(c.referente.split(' ')[0]);
      const numMsg = R.datiNumero(m.numero);
      const corpo = m.file
        ? `<div class="bolla file"><span class="doc">PDF</span><div><div class="grassetto">${R.esc(m.file.nome)}</div><div class="piccolo">dalla libreria · ${R.esc(m.file.peso)}</div>${m.testo ? `<div style="margin-top:4px">${R.esc(m.testo)}</div>` : ''}</div></div>`
        : `<div class="bolla">${R.esc(m.testo)}</div>`;
      let st = '';
      if (inviato) {
        const testi = { 'in coda': 'In coda', inviato: 'Inviato', consegnato: 'Consegnato', letto: 'Letto', 'non inviato': 'Non inviato', annullato: 'Annullato' };
        st = m.stato === 'non inviato'
          ? `<div class="stato-msg errore">Non inviato · <button class="link" style="color:inherit" data-azione="sc-riprova" data-id="${m.id}">Riprova</button></div>`
          : `<div class="stato-msg ${m.stato === 'in coda' && m.nota ? 'errore' : ''}">${testi[m.stato] || ''}${m.servizio === 'B' ? ' · con il servizio di riserva' : ''}${m.nota ? ' · ' + R.esc(m.nota) : ''}</div>`;
      }
      return `${sep}<div class="messaggio ${inviato ? 'inviato' : 'ricevuto'}"><div class="meta">${chi} · ${R.ora(m.quando)}${numMsg && R.stato.numeri.length > 1 && !inviato ? ' · al numero di ' + R.esc(numMsg.nome) : ''}</div>${corpo}${st}</div>`;
    }).join('');
  }

  /* Ridisegna solo la chat (es. quando un messaggio passa da "In coda" a "Consegnato"). */
  R.ridisegnaChat = (contattoId) => {
    const area = document.getElementById('chat-area');
    const pos = R.posizione();
    if (!area || pos.percorso !== '/contatto/' + contattoId) return;
    const c = R.contatto(contattoId);
    const giuInFondo = area.scrollTop + area.clientHeight >= area.scrollHeight - 30;
    area.innerHTML = messaggi(c);
    if (giuInFondo) area.scrollTop = area.scrollHeight;
  };

  /* ---------------- Azioni ---------------- */
  R.azioni['sc-indietro'] = () => { if (R.precedente && R.precedente.includes('#/') && !R.precedente.includes('#/contatto/')) history.back(); else R.vai('#/affari'); };
  R.azioni['sc-vai-chat'] = () => {
    const box = document.getElementById('chat-riquadro');
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('scrivi-wa').focus({ preventScroll: true }), 450);
  };
  R.azioni['sc-fase'] = (el) => R.spostaAffare(el.dataset.a, el.dataset.fase);
  R.azioni['sc-perso'] = (el) => R.finestraChiusura(el.dataset.a, 'perso');
  R.azioni['sc-vinto'] = (el) => R.finestraChiusura(el.dataset.a, 'vinto');
  R.azioni['sc-riapri'] = (el) => R.riapriAffare(el.dataset.a);
  R.azioni['sc-crea-affare'] = (el) => R.finestraNuovoAffare({ contatto: el.dataset.c });
  R.azioni['sc-scheda-azione'] = (el) => { R.stato.filtri.scheda.tab = el.dataset.tab; R.salva(); R.aggiorna(); const i = document.querySelector('#email-oggetto, #prom-titolo, #nota-testo, #scrivi-wa-rapido'); if (i) i.focus(); };
  R.azioni['sc-filtro-storia'] = (el) => { R.stato.filtri.scheda.storia = el.dataset.f; R.salva(); R.aggiorna(); };
  R.azioni['sc-modifica'] = (el) => { inModifica = inModifica === el.dataset.c ? null : el.dataset.c; R.aggiorna(); if (inModifica) { const i = document.getElementById('campo-telefono'); if (i) i.focus(); } };

  /* Salvataggio automatico dei campi: dopo 1 secondo di pausa e all'uscita dal campo. */
  R.azioni['sc-campo'] = (el) => { clearTimeout(timerCampo); timerCampo = setTimeout(() => salvaCampo(el), 1000); const ind = document.getElementById('indicatore-salvataggio'); if (ind) { ind.className = 'stato-salvataggio'; ind.textContent = 'Modifiche da salvare…'; } };
  R.azioni['sc-campo-subito'] = (el) => { clearTimeout(timerCampo); salvaCampo(el); };
  function salvaCampo(el) {
    const c = R.contatto(el.dataset.c);
    const k = el.dataset.campo;
    const ind = document.getElementById('indicatore-salvataggio');
    if (k === 'valore') {
      const a = R.affare(el.dataset.affare);
      const nuovo = el.value.replace(/\D/g, '') ? Number(el.value.replace(/\D/g, '')) : null;
      if (nuovo === a.valore) return;
      R.registraStoria(c.id, a.id, 'modifica', `Valore: da ${R.euro(a.valore)} a ${R.euro(nuovo)}`);
      a.valore = nuovo;
      R.salvataggioCampo(ind, 'valore di ' + c.nome);
      return;
    }
    let v = el.value.trim();
    if (k === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) { if (ind) { ind.className = 'stato-salvataggio attesa'; ind.textContent = 'Non salvato: controlla l\'email (es. nome@azienda.it)'; } return; }
    if (k === 'telefono' && v) {
      v = R.formattaTelefono(v);
      const dop = R.trovaDoppione(v, '');
      if (dop && dop.id !== c.id) { if (ind) { ind.className = 'stato-salvataggio attesa'; ind.textContent = `Non salvato: questo telefono è già di ${dop.nome}`; } return; }
    }
    if (String(c[k] == null ? '' : c[k]) === v) { if (ind && !R.stato.offline) { ind.className = 'stato-salvataggio ok'; ind.innerHTML = `${R.icona('spunta', 14)} Salvato`; } return; }
    const etichetta = (CAMPI.find((x) => x[0] === k) || [k, k])[1];
    R.registraStoria(c.id, null, 'modifica', `${etichetta}: da «${c[k] || '—'}» a «${v || '—'}»`);
    c[k] = v;
    R.salvataggioCampo(ind, etichetta.toLowerCase() + ' di ' + c.nome);
  }

  R.azioni['sc-documento'] = (el) => {
    const a = R.affare(el.dataset.a);
    const d = a.documenti[+el.dataset.i];
    d.ricevuto = el.checked;
    R.registraStoria(a.contatto, a.id, 'modifica', `Documento «${d.nome}»: ${d.ricevuto ? 'ricevuto' : 'di nuovo mancante'}`);
    if (R.stato.offline) R.stato.inAttesa.push({ descrizione: 'documento ' + d.nome });
    R.salva(); R.aggiorna();
    R.avviso(`${R.esc(d.nome)}: ${d.ricevuto ? 'ricevuto' : 'mancante'}${R.stato.offline ? ' · in attesa della connessione' : ''}`);
  };
  R.azioni['sc-aggiungi-doc'] = (el) => R.modale({
    titolo: 'Aggiungi un documento richiesto', classe: 'stretta',
    corpo: '<div class="gruppo-campo"><label class="etichetta-campo">Nome del documento</label><input class="campo" name="nome" placeholder="Es. Ultimo F24 pagato"></div>',
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Aggiungi', classe: 'primario', fai: (f) => { const v = R.valori(f); if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome del documento.'); return false; } const a = R.affare(el.dataset.a); a.documenti.push({ nome: v.nome, ricevuto: false }); R.salva(); R.aggiorna(); R.avviso('Documento aggiunto all\'elenco'); } }],
  });
  R.azioni['sc-portale'] = (el) => {
    const c = R.contatto(el.dataset.c);
    R.modale({
      titolo: 'Invita al portale clienti',
      sottotitolo: `${R.esc(c.referente)} riceve per email un link valido 7 giorni. Vede solo l'elenco dei documenti richiesti e i file che condividi, e può caricare i documenti mancanti (fino a 25 MB ciascuno). Non entra mai nel resto del software.`,
      classe: 'stretta',
      corpo: `<div class="riga-impostazione"><span>Email</span><span class="valore">${R.esc(c.email || 'manca: aggiungila nei dati')}</span></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Invia l\'invito', classe: 'primario', disabilitato: !c.email, fai: () => { if (!R.serveConnessione('l\'invio dell\'invito')) return false; R.registraStoria(c.id, null, 'email', 'Invito al portale clienti inviato (link valido 7 giorni)'); R.salva(); R.aggiorna(); R.avviso('Invito al portale inviato'); } }],
    });
  };

  R.azioni['sc-responsabile'] = (el) => scegliPersona(el.dataset.a, 'responsabile');
  R.azioni['sc-passa'] = (el) => scegliPersona(el.dataset.a, 'passa');
  R.azioni['sc-seguace'] = (el) => scegliPersona(el.dataset.a, 'seguace');
  function scegliPersona(affareId, modo) {
    const a = R.affare(affareId);
    const c = R.contatto(a.contatto);
    const persone = R.stato.utenti.filter((u) => u.stato === 'attivo' && u.id !== (modo === 'seguace' ? a.responsabile : a.responsabile));
    const titoli = { responsabile: 'Chi segue questo affare?', passa: 'Passa l\'affare a un collega', seguace: 'Aggiungi un seguace' };
    const sotto = { responsabile: 'Il nuovo responsabile riceve un avviso e vede il contatto, la chat e la storia.', passa: 'Il collega diventa responsabile e riceve un avviso. Tu resti come seguace e continui a vedere l\'affare.', seguace: 'Il seguace vede l\'affare senza esserne responsabile.' };
    R.modale({
      titolo: titoli[modo], sottotitolo: sotto[modo], classe: 'stretta',
      corpo: persone.map((u) => `<button class="opzione" data-azione="sc-persona-scelta" data-a="${a.id}" data-u="${u.id}" data-modo="${modo}">${R.avatar(u.id, 'grande')}<span class="principale">${R.esc(u.nome)}<span class="sotto">${R.nomeRuolo(u.ruolo)}${u.assenza ? ' · assente ' + R.esc(u.assenza) : ''}</span></span></button>`).join(''),
    });
  }
  R.azioni['sc-persona-scelta'] = (el) => {
    const a = R.affare(el.dataset.a);
    const c = R.contatto(a.contatto);
    const u = R.utenteDa(el.dataset.u);
    if (el.dataset.modo === 'seguace') {
      a.seguaci = Array.from(new Set((a.seguaci || []).concat([u.id])));
      R.registraStoria(c.id, a.id, 'modifica', `${u.breve} aggiunto come seguace`);
    } else {
      const prima = a.responsabile;
      a.responsabile = u.id;
      if (!c.responsabile || c.responsabile === prima) c.responsabile = u.id;
      if (el.dataset.modo === 'passa') a.seguaci = Array.from(new Set((a.seguaci || []).concat([R.utente().id])));
      R.registraStoria(c.id, a.id, 'modifica', `Responsabile: da ${prima ? R.utenteDa(prima).breve : 'nessuno'} a ${u.breve}`);
      R.notifica(`Ti è stato assegnato <b>${R.esc(c.nome)}</b>`, '#/contatto/' + c.id, u.id);
    }
    R.salva(); R.chiudiModale(true); R.aggiorna();
    R.avviso(el.dataset.modo === 'seguace' ? `${R.esc(u.breve)} ora segue l'affare` : `Affare assegnato a ${R.esc(u.breve)} · avvisato`);
  };
  R.azioni['sc-consensi'] = (el) => {
    const c = R.contatto(el.dataset.c);
    const opz = (canale) => Object.entries(NOMI_CONSENSO).map(([k, t]) => `<option value="${k}" ${(c.consensi || {})[canale] === k ? 'selected' : ''}>${t}</option>`).join('');
    R.modale({
      titolo: 'Consensi', sottotitolo: 'Ogni cambio si salva con data e fonte. "Sì" solo se il cliente l\'ha chiesto o accettato.', classe: 'stretta', proteggi: true,
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo">WhatsApp</label><select class="campo" name="whatsapp">${opz('whatsapp')}</select></div><div class="gruppo-campo"><label class="etichetta-campo">Email</label><select class="campo" name="email">${opz('email')}</select></div><div class="gruppo-campo"><label class="etichetta-campo">Fonte del consenso</label><input class="campo" name="fonte" placeholder="Es. richiesta scritta su WhatsApp del 12/10"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai: (f) => { const v = R.valori(f); if ((v.whatsapp === 'si' || v.email === 'si') && !v.fonte) { R.erroreCampo(f, 'fonte', 'Scrivi da dove arriva il consenso.'); return false; } c.consensi = { whatsapp: v.whatsapp, email: v.email }; R.registraStoria(c.id, null, 'modifica', `Consensi: WhatsApp ${NOMI_CONSENSO[v.whatsapp]}, email ${NOMI_CONSENSO[v.email]}${v.fonte ? ' · fonte: ' + v.fonte : ''}`); R.salva(); R.aggiorna(); R.avviso('Consensi salvati'); } }],
    });
  };
  R.azioni['sc-aggiungi-campo'] = () => R.modale({
    titolo: 'Aggiungi sezione o campo',
    sottotitolo: 'Il nuovo campo compare in tutte le schede dell\'azienda. Si gestisce anche da Impostazioni · Campi personalizzati.',
    classe: 'stretta',
    corpo: `<div class="gruppo-campo"><label class="etichetta-campo">Nome del campo</label><input class="campo" name="nome" placeholder="Es. Fatturato 2025"></div><div class="gruppo-campo"><label class="etichetta-campo">Tipo</label><select class="campo" name="tipo"><option>Testo</option><option>Numero</option><option>Valuta</option><option>Data</option><option>Scelta</option><option>Scelta multipla</option><option>Sì/No</option><option>File</option></select></div><div class="gruppo-campo"><label class="etichetta-campo">Sezione</label><select class="campo" name="sezione"><option>Azienda e referente</option><option>Nuova sezione…</option></select></div>`,
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Aggiungi', classe: 'primario', fai: (f) => { const v = R.valori(f); if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome del campo.'); return false; } R.avviso(`Campo «${R.esc(v.nome)}» aggiunto · nel prototipo non compare ancora nelle schede`); } }],
  });

  /* Composizione: WhatsApp, email, promemoria, nota */
  function inviaWA(contattoId, testo, campo) {
    const c = R.contatto(contattoId);
    if (!testo) { if (campo) { campo.classList.add('con-errore'); campo.focus(); } return; }
    if (!R.serveConnessione('l\'invio dei messaggi')) return;
    if (!R.controllaConsensoWA(c)) return;
    R.inviaMessaggio(c.id, { testo });
    R.dopoMessaggioAMano(c);
    R.salva();
    R.aggiorna();
    const area = document.getElementById('chat-area'); if (area) area.scrollTop = area.scrollHeight;
  }
  R.azioni['sc-invia'] = (el) => { const i = document.getElementById('scrivi-wa'); inviaWA(el.dataset.c, i.value.trim(), i); };
  R.azioni['sc-invia-rapido'] = (el) => { const i = document.getElementById('scrivi-wa-rapido'); inviaWA(el.dataset.c, i.value.trim(), i); };
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' || ev.shiftKey) return;
    const el = ev.target.closest('[data-invio]');
    if (!el) return;
    ev.preventDefault();
    R.azioni[el.dataset.invio](el);
  });
  R.azioni['sc-risposta'] = (el) => { const i = document.getElementById('scrivi-wa'); i.value = el.dataset.testo; i.focus(); };
  R.azioni['sc-invia-file'] = (el) => R.finestraInviaFile(el.dataset.c);
  R.azioni['sc-allega-brochure'] = (el) => R.finestraInviaFile(el.dataset.c);
  R.azioni['sc-invia-libreria'] = (el) => {
    R.finestraInviaFile(el.dataset.c);
    const m = R.modaleAperta();
    const scelta = m && m.querySelector(`[data-id="${el.dataset.l}"]`);
    if (scelta) R.azioni['ve-scegli-file'](scelta);
  };
  R.azioni['sc-riprova'] = (el) => {
    const m = R.stato.messaggi.find((x) => x.id === el.dataset.id);
    if (!m || !R.serveConnessione('il nuovo invio')) return;
    R.stato.messaggi = R.stato.messaggi.filter((x) => x.id !== m.id);
    R.inviaMessaggio(m.contatto, { testo: m.testo, file: m.file });
    R.aggiorna();
  };
  R.azioni['sc-cerca-chat'] = () => {
    const z = document.getElementById('zona-cerca-chat');
    if (z.innerHTML) { z.innerHTML = ''; cercaChat = ''; R.ridisegnaChat(R.posizione().percorso.split('/')[2]); return; }
    z.innerHTML = `<div class="ricerca" style="margin-bottom:12px">${R.icona('cerca')}<input class="campo" style="background:var(--campo)" placeholder="Cerca parole nella chat" data-digita="sc-cerca-digita"></div>`;
    z.querySelector('input').focus();
  };
  R.azioni['sc-cerca-digita'] = (el) => { cercaChat = el.value.trim(); R.ridisegnaChat(R.posizione().percorso.split('/')[2]); };

  R.azioni['sc-invia-email'] = (el) => {
    const c = R.contatto(el.dataset.c);
    const ogg = document.getElementById('email-oggetto');
    const testo = document.getElementById('email-testo');
    if (!c.email) { R.avviso('Questo contatto non ha un\'email: aggiungila nei dati'); return; }
    if (!ogg.value.trim()) { ogg.classList.add('con-errore'); ogg.focus(); return; }
    if ((c.consensi || {}).email === 'no') { R.avviso('Il contatto ha detto no alle email: non puoi scrivergli'); return; }
    if (!R.serveConnessione('l\'invio delle email')) return;
    R.registraStoria(c.id, el.dataset.a || null, 'email', `Email: ${ogg.value.trim()}`);
    R.dopoMessaggioAMano(c);
    R.salva(); R.aggiorna();
    R.avviso(`Email inviata a ${R.esc(c.email)} · le risposte arriveranno nella storia`);
  };
  R.azioni['sc-prom-rapido'] = (el) => {
    const d = new Date(R.giorniDa(+el.dataset.giorni, el.dataset.giorni === '0' ? '18:00' : '10:00'));
    const pad = (n) => String(n).padStart(2, '0');
    document.getElementById('prom-quando').value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  R.azioni['sc-salva-promemoria'] = (el) => {
    const titolo = document.getElementById('prom-titolo');
    const quando = document.getElementById('prom-quando');
    if (!titolo.value.trim()) { titolo.classList.add('con-errore'); titolo.focus(); return; }
    if (!quando.value) { quando.classList.add('con-errore'); quando.focus(); return; }
    R.creaPromemoria(el.dataset.c, el.dataset.a || null, new Date(quando.value).toISOString(), titolo.value.trim());
    R.aggiorna();
    R.avviso('Promemoria salvato');
  };
  R.azioni['sc-salva-nota'] = (el) => {
    const t = document.getElementById('nota-testo');
    if (!t.value.trim()) { t.classList.add('con-errore'); t.focus(); return; }
    R.registraStoria(el.dataset.c, el.dataset.a || null, 'nota', t.value.trim());
    if (R.stato.offline) R.stato.inAttesa.push({ descrizione: 'nota' });
    R.salva(); R.aggiorna();
    R.avviso(R.stato.offline ? 'Nota in attesa · si salva quando torna la connessione' : 'Nota salvata');
  };
  R.azioni['sc-passo-rapido'] = (el) => {
    const quando = R.giorniDa(+el.dataset.giorni, '10:00');
    R.creaPromemoria(el.dataset.c, el.dataset.a, quando);
    R.aggiorna();
    R.avviso(`Promemoria fissato: ${R.quandoBreve(quando)}`);
  };
  R.azioni['sc-prossimo-passo'] = (el) => R.prossimoPasso(el.dataset.c, el.dataset.a, 'Prossimo passo');

  /* Menu "altre azioni": elimina, cambia contatto, cancellazione privacy */
  R.azioni['sc-menu'] = (el) => {
    const a = el.dataset.a ? R.affare(el.dataset.a) : null;
    R.tendina(el, `<div class="titolo-tendina">Altre azioni</div>
      ${a ? `<button data-azione="sc-cambia-contatto" data-a="${a.id}">${R.icona('persona', 16)} Cambia il contatto di questo affare</button>` : ''}
      ${a ? `<button data-azione="sc-elimina-affare" data-a="${a.id}">${R.icona('cestino', 16)} Elimina questo affare</button>` : ''}
      ${R.amministratore() ? `<button data-azione="sc-elimina-contatto" data-c="${el.dataset.c}">${R.icona('cestino', 16)} Elimina il contatto</button>
      <button data-azione="sc-privacy" data-c="${el.dataset.c}" style="color:var(--errore-t)">${R.icona('lucchetto', 16)} Cancellazione per richiesta privacy</button>` : ''}`);
  };
  R.azioni['sc-elimina-affare'] = (el) => {
    R.chiudiTendina();
    R.eliminaAffare(el.dataset.a, () => R.vai('#/affari'));
  };
  R.azioni['sc-cambia-contatto'] = (el) => {
    R.chiudiTendina();
    const a = R.affare(el.dataset.a);
    const altri = R.stato.contatti.filter((c) => !c.eliminato && c.id !== a.contatto && R.contattoVisibile(c)).sort((x, y) => x.nome.localeCompare(y.nome));
    R.modale({
      titolo: 'Cambia il contatto dell\'affare', sottotitolo: 'Usalo se l\'affare è stato collegato al cliente sbagliato. Il cambio resta nella storia.', classe: 'stretta',
      corpo: `<select class="campo" name="contatto">${altri.map((c) => `<option value="${c.id}">${R.esc(c.nome)} · ${R.esc(c.referente)}</option>`).join('')}</select>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Cambia', classe: 'primario', fai: (f) => { const v = R.valori(f); const prima = R.contatto(a.contatto); a.contatto = v.contatto; R.registraStoria(v.contatto, a.id, 'modifica', `Affare spostato qui da ${prima.nome}`); R.registraStoria(prima.id, a.id, 'modifica', `Affare spostato su ${R.contatto(v.contatto).nome}`); R.salva(); R.chiudiModale(true); R.vai(`#/contatto/${v.contatto}?affare=${a.id}`); R.avviso('Contatto dell\'affare cambiato'); return false; } }],
    });
  };
  R.azioni['sc-elimina-contatto'] = (el) => {
    R.chiudiTendina();
    const c = R.contatto(el.dataset.c);
    const affari = R.affariDelContatto(c.id);
    const altri = R.stato.contatti.filter((x) => !x.eliminato && x.id !== c.id).sort((x, y) => x.nome.localeCompare(y.nome));
    R.modale({
      titolo: `Eliminare ${R.esc(c.nome)}?`,
      sottotitolo: `Lo trovi nel Cestino per 30 giorni. I messaggi in coda vengono annullati, le automazioni si fermano, gli appuntamenti futuri si annullano e il portale viene sospeso.`,
      corpo: affari.length ? `<div class="etichetta-campo">Ha ${affari.length} ${affari.length === 1 ? 'affare' : 'affari'}: cosa vuoi farne?</div>
        <label class="opzione"><input type="radio" name="cosa" value="elimina" checked style="accent-color:var(--verde)"><span class="principale">Eliminali insieme al contatto</span></label>
        <label class="opzione" style="flex-wrap:wrap"><input type="radio" name="cosa" value="sposta" style="accent-color:var(--verde)"><span class="principale">Spostali su un altro contatto</span><select class="campo su-beige" name="verso" style="max-width:260px">${altri.map((x) => `<option value="${x.id}">${R.esc(x.nome)}</option>`).join('')}</select></label>
        <label class="riga-impostazione spazio-sopra"><span>Avvisa il cliente degli appuntamenti annullati</span><span class="interruttore"><input type="checkbox" name="avvisa"><span></span></span></label>` : '',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Elimina', classe: 'rosso', fai: (f) => {
          const v = R.valori(f);
          const idsAffari = [];
          affari.forEach((a) => { if (v.cosa === 'sposta') { a.contatto = v.verso; R.registraStoria(v.verso, a.id, 'modifica', `Affare spostato qui da ${c.nome} (contatto eliminato)`); } else { a.eliminato = true; idsAffari.push(a.id); } });
          c.eliminato = true;
          R.stato.messaggi.forEach((m) => { if (m.contatto === c.id && m.stato === 'in coda') m.stato = 'annullato'; });
          R.stato.appuntamenti.forEach((ap) => { if (ap.contatto === c.id && new Date(ap.quando) > new Date()) ap.annullato = true; });
          const voce = { id: R.id('ce'), tipo: 'contatto', rif: c.id, affari: idsAffari, nome: c.nome, eliminatoDa: R.utente().id, quando: R.adesso() };
          R.stato.cestino.unshift(voce);
          R.salva(); R.chiudiModale(true); R.vai('#/contatti');
          R.avviso(`${R.esc(c.nome)} eliminato · nel Cestino per 30 giorni`, { annulla: () => { R.ripristina(voce.id); R.aggiorna(); R.avviso('Contatto ripristinato'); } });
          return false;
        },
      }],
    });
  };
  R.azioni['sc-privacy'] = (el) => {
    R.chiudiTendina();
    const c = R.contatto(el.dataset.c);
    R.modale({
      titolo: 'Cancellazione per richiesta privacy',
      sottotitolo: `Cancella subito e per sempre dati, chat, file e storia di ${R.esc(c.nome)}. Non passa dal Cestino e non si può annullare. Nel registro resta solo una riga senza nomi. Le copie di sicurezza scadono da sole entro 6 mesi.`,
      classe: 'stretta',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo">Per confermare scrivi il nome: ${R.esc(c.nome)}</label><input class="campo" name="conferma" autocomplete="off"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Cancella per sempre', classe: 'rosso', fai: (f) => {
          if (R.valori(f).conferma !== c.nome) { R.erroreCampo(f, 'conferma', 'Il nome non coincide.'); return false; }
          if (!R.serveConnessione('la cancellazione')) return false;
          R.stato.affari = R.stato.affari.filter((a) => a.contatto !== c.id);
          R.stato.attivita = R.stato.attivita.filter((t) => t.contatto !== c.id);
          R.stato.messaggi = R.stato.messaggi.filter((m) => m.contatto !== c.id);
          R.stato.storia = R.stato.storia.filter((s) => s.contatto !== c.id);
          R.stato.appuntamenti = R.stato.appuntamenti.filter((s) => s.contatto !== c.id);
          R.stato.contatti = R.stato.contatti.filter((x) => x.id !== c.id);
          R.salva(); R.chiudiModale(true); R.vai('#/contatti');
          R.avviso('Dati del contatto cancellati per sempre');
          return false;
        },
      }],
    });
  };

  R.stile('scheda', '@media (max-width: 900px) { #scheda-colonne { grid-template-columns: minmax(0,1fr) !important; } }');
})();
