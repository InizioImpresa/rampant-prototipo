/* Rampant — prototipo. Sequenze email dentro Marketing (decisione 29/10/2026, come l'autoresponder di GetResponse):
   una serie di messaggi in fila, con giorno, ora, giorni consentiti, consegnati/aperte/clic e un solo interruttore.
   Azioni con prefisso "mk-sq-". Dati inventati in R.stato.sequenze. */
(function () {
  'use strict';
  const R = window.R;
  const esc = (s) => R.esc(s);
  const num = (n) => new Intl.NumberFormat('it-IT', { useGrouping: 'always' }).format(n);
  const GIORNI_SETT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const tutti7 = () => [true, true, true, true, true, true, true];
  const msg = (giorno, quando, valore, oggetto, consegnati, aperte, clic) => ({ id: R.id('sm'), giorno, quando, valore, giorni: tutti7(), oggetto, consegnati, aperte, clic });

  function sequenze() {
    if (!R.stato.sequenze) {
      R.stato.sequenze = [
        { id: 'sq1', nome: 'Finanza agevolata · benvenuto', ingresso: 'Quando compila un modulo', attiva: true, messaggi: [
          msg(0, 'subito', 0, 'Grazie! Ecco la guida ai bandi', 214, 52, 21), msg(1, 'ora', '12:00', 'Cosa puoi finanziare con la ZES', 205, 47, 15),
          msg(3, 'ora', '19:00', 'I documenti che ti servono', 198, 44, 12), msg(5, 'ora', '12:00', 'Il caso di un cliente come te', 190, 38, 9),
          msg(7, 'ora', '12:00', 'Parliamone: fissa un appuntamento', 181, 41, 18)] },
        { id: 'sq2', nome: 'Evento · scarica il menu', ingresso: 'Quando entra in una lista', attiva: true, messaggi: [msg(0, 'subito', 0, 'Il menu eventi e compleanni', 303, 50, 15)] },
        { id: 'sq3', nome: 'Promemoria documenti', ingresso: 'Quando l\'affare passa a «Documenti richiesti»', attiva: false, messaggi: [msg(2, 'stesso', 0, 'Ci mancano alcuni documenti', 0, null, null), msg(5, 'stesso', 0, 'Ultimo promemoria documenti', 0, null, null)] },
      ];
      R.salva();
    }
    return R.stato.sequenze;
  }
  const fraseQuando = (m) => {
    const q = m.quando === 'subito' ? 'Invia subito' : m.quando === 'ora' ? 'Invia alle ' + m.valore : 'Invia alla stessa ora dell\'ingresso';
    const g = m.giorni.every(Boolean) ? 'qualsiasi giorno della settimana' : 'solo ' + GIORNI_SETT.filter((_, i) => m.giorni[i]).join(', ');
    return q + ', ' + g;
  };

  function dettaglio(sq) {
    const ms = sq.messaggi.slice().sort((a, b) => a.giorno - b.giorno);
    const primo = ms[0];
    const avviso = primo && primo.giorno !== 0 ? `<div class="banner giallo spazio-sotto">${R.icona('allarme')}<div class="principale">Il primo messaggio è al giorno ${primo.giorno}: chi entra nella sequenza lo riceve dopo ${primo.giorno} ${primo.giorno === 1 ? 'giorno' : 'giorni'}, non subito.</div></div>` : '';
    const passo = (i) => { const d = ms[i].giorno - ms[i - 1].giorno; return `<div class="mk-sq-passo">dopo ${d} ${d === 1 ? 'giorno' : 'giorni'}</div>`; };
    return `<div class="riquadro"><div class="riga-flex" style="justify-content:space-between;flex-wrap:wrap;gap:10px"><div><h2 class="titolo-riquadro" style="margin:0">${esc(sq.nome)}</h2><div class="piccolo secondario">${esc(sq.ingresso)} · si ferma se il contatto risponde, firma o perde</div></div>
        <label class="riga-flex" style="gap:8px;cursor:pointer"><span class="piccolo">${sq.attiva ? 'Attiva' : 'Spenta'}</span><span class="interruttore"><input type="checkbox" data-cambia="mk-sq-attiva" data-id="${sq.id}" ${sq.attiva ? 'checked' : ''} aria-label="Accendi o spegni la sequenza"><span></span></span></label></div>
      <div class="spazio-sopra">${avviso}${ms.map((m, i) => `${i ? passo(i) : ''}
        <div class="mk-sq-msg"><div class="mk-sq-giorno"><span class="piccolo">Giorno</span><b>${m.giorno}</b></div>
          <div class="principale" style="min-width:0"><div class="grassetto">${esc(m.oggetto)}</div><div class="piccolo secondario">${esc(fraseQuando(m))}</div></div>
          <div class="mk-sq-num"><b>${num(m.consegnati)}</b><span>consegnati</span></div><div class="mk-sq-num"><b>${m.aperte != null ? m.aperte + '%' : '—'}</b><span>aperte</span></div><div class="mk-sq-num"><b>${m.clic != null ? m.clic + '%' : '—'}</b><span>clic</span></div>
          <button class="btn piccolo secondario-campo" data-azione="mk-sq-modifica" data-s="${sq.id}" data-m="${m.id}">Modifica</button></div>`).join('')}
        <button class="mk-sq-aggiungi" data-azione="mk-sq-modifica" data-s="${sq.id}" data-m="">${R.icona('piu', 16)} Aggiungi un messaggio</button></div></div>`;
  }

  R.stile('sequenze', `
    .mk-sq-msg { display: grid; grid-template-columns: 64px minmax(0, 1fr) repeat(3, 76px) auto; gap: 12px; align-items: center; background: var(--bianco); border-radius: 22px; padding: 12px 16px; box-shadow: 0 0 0 1px var(--linea); }
    .mk-sq-giorno { background: var(--verde); color: #fff; border-radius: 16px; padding: 6px 0; text-align: center; display: flex; flex-direction: column; line-height: 1.1; }
    .mk-sq-giorno b { font-size: 24px; font-weight: 700; }
    .mk-sq-num { text-align: center; line-height: 1.2; } .mk-sq-num b { display: block; font-size: 16px; } .mk-sq-num span { font-size: 11px; color: var(--testo-3); }
    .mk-sq-passo { margin: 0 0 0 30px; padding: 6px 0 6px 14px; border-left: 2px solid var(--linea); font-size: 12px; color: var(--testo-3); }
    .mk-sq-aggiungi { margin-top: 12px; width: 100%; border: 1.5px dashed var(--linea); background: transparent; border-radius: 22px; padding: 14px; font-weight: 600; color: var(--verde); display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-family: inherit; }
    .mk-sq-riga { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; padding: 12px 14px; border-radius: 20px; cursor: pointer; }
    .mk-sq-riga.sel { background: var(--campo); }
    .mk-sq-due { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr); gap: var(--spazio); align-items: start; }
    @media (max-width: 767px) { .mk-sq-due { grid-template-columns: minmax(0, 1fr); } .mk-sq-msg { grid-template-columns: 56px minmax(0, 1fr); } .mk-sq-msg .mk-sq-num { display: none; } .mk-sq-msg .btn { grid-column: 1 / -1; } }
  `);

  R.rotta('/marketing/sequenze', {
    menu: 'marketing', titolo: 'Sequenze email',
    disegna() {
      const sq = sequenze();
      const scelta = sq.find((s) => s.id === R.stato.filtri.mkSequenza) || sq[0];
      const tutti = sq.flatMap((s) => s.messaggi);
      const inv = tutti.reduce((n, m) => n + m.consegnati, 0);
      const media = (k) => { const l = tutti.filter((m) => m[k] != null); return l.length ? Math.round(l.reduce((n, m) => n + m[k], 0) / l.length) : 0; };
      return `${R.barraMk('sequenze')}
        <div class="testata"><div><div class="sopratitolo">Marketing</div><h1 class="titolo-pagina">Sequenze email</h1><div class="spiegazione">Una serie di email che parte da sola quando il contatto entra: giorno dopo giorno, all'ora che scegli. Chi non ha dato il consenso viene escluso da solo.</div></div>
          <div class="azioni-testata"><button class="btn primario" data-azione="mk-sq-nuova">${R.icona('piu', 16)} Nuova sequenza</button></div></div>
        <div class="griglia g-4 spazio-sotto">
          <div class="riquadro verde mk-numero-tile"><div class="etichetta-numero">Sequenze attive</div><div class="numero-grande" style="font-size:52px">${sq.filter((s) => s.attiva).length}</div></div>
          <div class="riquadro mk-numero-tile"><div class="etichetta-numero secondario">Email consegnate</div><div class="numero-grande" style="font-size:52px">${num(inv)}</div></div>
          <div class="riquadro mk-numero-tile"><div class="etichetta-numero secondario">Aperte</div><div class="numero-grande" style="font-size:52px">${media('aperte')}%</div></div>
          <div class="riquadro pesca mk-numero-tile"><div class="etichetta-numero">Cliccate</div><div class="numero-grande" style="font-size:52px">${media('clic')}%</div></div>
        </div>
        <div class="mk-sq-due">
          <div class="riquadro"><h2 class="titolo-riquadro">Le tue sequenze</h2>${sq.map((s) => `<div class="mk-sq-riga ${s.id === scelta.id ? 'sel' : ''}" data-azione="mk-sq-sel" data-id="${s.id}" role="button" tabindex="0"><div style="min-width:0"><div class="grassetto">${esc(s.nome)}</div><div class="piccolo secondario">${s.messaggi.length} ${s.messaggi.length === 1 ? 'messaggio' : 'messaggi'}</div></div>${s.attiva ? '<span class="etichetta salvia">Attiva</span>' : '<span class="etichetta">Spenta</span>'}</div>`).join('')}</div>
          ${dettaglio(scelta)}
        </div>`;
    },
  });

  /* Per la scheda del contatto: in quale sequenza accesa si trova e a che giorno (solo se ha email e consenso email) */
  R.sequenzaDi = (c) => {
    if (!c || !c.email || !c.consensi || c.consensi.email !== 'si') return null;
    const sq = sequenze().find((s) => s.attiva && s.messaggi.length && s.id === 'sq1');
    if (!sq) return null;
    const giorno = Math.max(0, Math.floor((Date.now() - new Date(c.creato).getTime()) / 86400000));
    const ms = sq.messaggi.slice().sort((a, b) => a.giorno - b.giorno);
    if (giorno > ms[ms.length - 1].giorno) return null;
    return { nome: sq.nome, giorno, prossimo: ms.find((m) => m.giorno > giorno) || null };
  };
  R.azioni['mk-sq-sel'] = (el) => { R.stato.filtri.mkSequenza = el.dataset.id; R.salva(); R.aggiorna(); };
  R.azioni['mk-sq-attiva'] = (el) => {
    const s = sequenze().find((x) => x.id === el.dataset.id); s.attiva = el.checked; R.salva(); R.aggiorna();
    R.avviso(s.attiva ? 'Sequenza accesa: i nuovi contatti entrano da ora' : 'Sequenza spenta: chi è già dentro si ferma');
  };
  R.azioni['mk-sq-nuova'] = () => R.modale({
    titolo: 'Nuova sequenza', classe: 'stretta', sottotitolo: 'Dai un nome e scegli quando un contatto entra.',
    corpo: `<div class="gruppo-campo"><label class="etichetta-campo" for="mk-sq-n">Nome</label><input class="campo" id="mk-sq-n" name="nome" placeholder="es. Benvenuto nuovi contatti"></div>
      <div class="gruppo-campo"><label class="etichetta-campo" for="mk-sq-i">Entra quando</label><select class="campo" id="mk-sq-i" name="ingresso"><option>Quando compila un modulo</option><option>Quando entra in una lista</option><option>Quando l'affare passa a una fase</option></select></div>`,
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Crea', classe: 'primario', fai(f) {
      const v = R.valori(f);
      if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi un nome per la sequenza.'); return false; }
      const s = { id: R.id('sq'), nome: v.nome, ingresso: v.ingresso, attiva: false, messaggi: [] };
      sequenze().push(s); R.stato.filtri.mkSequenza = s.id; R.salva(); R.avviso('Sequenza creata, spenta: aggiungi i messaggi e poi accendila');
    } }],
  });
  R.azioni['mk-sq-modifica'] = (el) => {
    const s = sequenze().find((x) => x.id === el.dataset.s);
    const m = el.dataset.m ? s.messaggi.find((x) => x.id === el.dataset.m) : null;
    const g = m || { giorno: s.messaggi.length ? Math.max(...s.messaggi.map((x) => x.giorno)) + 2 : 0, quando: 'stesso', valore: '12:00', giorni: tutti7(), oggetto: '' };
    const inCorso = !m && s.attiva && s.messaggi.length > 0;
    R.modale({
      titolo: m ? 'Modifica il messaggio' : 'Aggiungi un messaggio', classe: 'stretta', sottotitolo: 'Giorno 0 è il giorno in cui il contatto entra.',
      corpo: `<div class="riga-flex" style="gap:10px;flex-wrap:wrap"><div class="gruppo-campo" style="flex:0 0 90px"><label class="etichetta-campo" for="mk-sq-g">Giorno</label><input class="campo" id="mk-sq-g" name="giorno" type="number" min="0" value="${g.giorno}"></div>
        <div class="gruppo-campo" style="flex:1;min-width:180px"><label class="etichetta-campo" for="mk-sq-q">Quando</label><select class="campo" id="mk-sq-q" name="quando"><option value="subito" ${g.quando === 'subito' ? 'selected' : ''}>Subito</option><option value="stesso" ${g.quando === 'stesso' ? 'selected' : ''}>Alla stessa ora dell'ingresso</option><option value="ora" ${g.quando === 'ora' ? 'selected' : ''}>A un'ora fissa</option></select></div>
        <div class="gruppo-campo" style="flex:0 0 120px"><label class="etichetta-campo" for="mk-sq-o">Ora</label><input class="campo" id="mk-sq-o" name="valore" type="time" value="${g.quando === 'ora' ? esc(g.valore) : '12:00'}"></div></div>
        <div class="gruppo-campo"><div class="etichetta-campo">Giorni in cui può partire</div><div class="riga-flex" style="gap:10px;flex-wrap:wrap">${GIORNI_SETT.map((n, i) => `<label class="riga-flex" style="gap:4px"><input type="checkbox" name="gs${i}" ${g.giorni[i] ? 'checked' : ''}> ${n}</label>`).join('')}</div><div class="piccolo secondario">Se il giorno è bloccato, il messaggio parte il primo giorno consentito, nell'orario di invio dell'azienda.</div></div>
        <div class="gruppo-campo"><label class="etichetta-campo" for="mk-sq-t">Oggetto</label><input class="campo" id="mk-sq-t" name="oggetto" value="${esc(g.oggetto)}" placeholder="es. Cosa puoi finanziare con la ZES"></div>
        ${inCorso ? `<div class="gruppo-campo"><div class="etichetta-campo">La sequenza è già in corso: cosa facciamo con chi ha già superato questo giorno?</div><label class="riga-flex" style="gap:6px"><input type="radio" name="chi" value="subito" checked> Mandalo subito anche a loro</label><label class="riga-flex" style="gap:6px"><input type="radio" name="chi" value="nuovi"> Mandalo solo a chi non ci è ancora arrivato</label></div>` : ''}`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai(f) {
        const v = R.valori(f);
        if (!v.oggetto) { R.erroreCampo(f, 'oggetto', 'Scrivi l\'oggetto del messaggio.'); return false; }
        const giorni = GIORNI_SETT.map((_, i) => !!v['gs' + i]);
        if (!giorni.some(Boolean)) { R.avviso('Scegli almeno un giorno della settimana'); return false; }
        const dati = { giorno: Math.max(0, parseInt(v.giorno, 10) || 0), quando: v.quando, valore: v.valore, giorni, oggetto: v.oggetto };
        if (m) Object.assign(m, dati); else s.messaggi.push(Object.assign(msg(0, 'stesso', 0, '', 0, null, null), dati));
        R.salva(); R.aggiorna();
        R.avviso(inCorso && v.chi === 'subito' ? 'Messaggio aggiunto: parte subito anche per chi ha già superato quel giorno · simulato' : 'Messaggio salvato');
      } }],
    });
  };
})();
