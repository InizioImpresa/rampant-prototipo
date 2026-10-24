/* Rampant — prototipo. Regole di qualificazione comuni a moduli, sondaggi e moduli Meta
   (decisione di Salvatore del 24/10/2026): "Se il contatto risponde così → mandalo lì".
   Le regole si controllano in ordine e vale la prima che corrisponde; se nessuna corrisponde,
   valgono le impostazioni predefinite del modulo ("Altrimenti").

   Formato di una regola:
   { id, modo: 'tutte' | 'almeno-una',
     condizioni: [{ domanda: chiave, operatore: 'uguale'|'diverso'|'contiene'|'maggiore'|'minore'|'compilato'|'vuoto', valore }],
     azioni: { fase: 'p1|f1' | '', responsabile: 'turno' | 'u2' | '', etichette: 'testo, testo' | '',
               automazione: 'au1' | 'nessuna' | '', pagina: 'grazie' | 'neutra' | '', promemoria: 'si' | 'no' | '' } }
   Un valore vuoto vuol dire "come le impostazioni predefinite". */
(function () {
  'use strict';
  const R = window.R;

  const OPERATORI = [['uguale', 'è'], ['diverso', 'non è'], ['contiene', 'contiene'], ['maggiore', 'è più di'], ['minore', 'è meno di'], ['compilato', 'ha una risposta'], ['vuoto', 'non ha risposta']];
  const SENZA_VALORE = ['compilato', 'vuoto'];
  const numero = (s) => Number(String(s == null ? '' : s).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.'));

  R.condizioneVera = (cond, risposte) => {
    const v = (risposte || {})[cond.domanda];
    const testo = (Array.isArray(v) ? v.join(', ') : String(v == null ? '' : v)).trim();
    const val = String(cond.valore == null ? '' : cond.valore).trim().toLowerCase();
    switch (cond.operatore) {
      case 'uguale': return testo.toLowerCase() === val;
      case 'diverso': return testo.toLowerCase() !== val;
      case 'contiene': return val !== '' && testo.toLowerCase().includes(val);
      case 'maggiore': return testo !== '' && numero(testo) > numero(cond.valore);
      case 'minore': return testo !== '' && numero(testo) < numero(cond.valore);
      case 'compilato': return testo !== '';
      case 'vuoto': return testo === '';
      default: return false;
    }
  };

  /* Restituisce { regola, numero (1, 2… oppure 0 se "altrimenti"), azioni } con le azioni già unite alle predefinite. */
  R.applicaRegole = (regole, risposte, predefinite) => {
    const base = Object.assign({ fase: '', responsabile: 'turno', etichette: '', automazione: '', pagina: 'grazie', promemoria: 'si' }, predefinite || {});
    const lista = regole || [];
    for (let i = 0; i < lista.length; i++) {
      const r = lista[i];
      const conds = (r.condizioni || []).filter((c) => c.domanda);
      if (!conds.length) continue;
      const ok = r.modo === 'almeno-una' ? conds.some((c) => R.condizioneVera(c, risposte)) : conds.every((c) => R.condizioneVera(c, risposte));
      if (ok) {
        const azioni = Object.assign({}, base);
        Object.entries(r.azioni || {}).forEach(([k, v]) => { if (v !== '' && v != null) azioni[k] = v; });
        if (r.azioni && r.azioni.etichette && base.etichette) azioni.etichette = base.etichette + ', ' + r.azioni.etichette;
        return { regola: r, numero: i + 1, azioni };
      }
    }
    return { regola: null, numero: 0, azioni: base };
  };

  /* Descrizione in italiano semplice di cosa succede. */
  R.descriviAzioni = (a) => {
    const parti = [];
    if (a.fase) { const [p, f] = a.fase.split('|'); const fase = R.fase(p, f); parti.push(`${R.percorso(p).nome} · ${fase ? fase.nome : '—'}`); }
    if (a.responsabile === 'turno') parti.push('responsabile a turno');
    else if (a.responsabile === 'nessuno') parti.push('senza responsabile (lo assegnano gli amministratori)');
    else if (a.responsabile) parti.push('responsabile ' + R.utenteDa(a.responsabile).breve);
    if (a.etichette) parti.push('etichetta «' + a.etichette + '»');
    if (a.automazione === 'nessuna') parti.push('nessuna automazione');
    else if (a.automazione) { const au = R.stato.automazioni.find((x) => x.id === a.automazione); parti.push('automazione «' + (au ? au.nome : a.automazione) + '»'); }
    if (a.pagina === 'neutra') parti.push('ringraziamento neutro');
    if (a.promemoria === 'no') parti.push('nessun promemoria di chiamata');
    else if (a.promemoria === 'si') parti.push('promemoria «richiamare entro 1 ora»');
    return parti.join(' · ');
  };

  /* ---------------- Editor delle regole (riutilizzabile) ----------------
     R.editorRegole({ chiave, regole (array, viene modificato), domande: [{ chiave, etichetta, risposte? }], alCambio(), titolo? })
     restituisce l'html; il contenitore si ridisegna da solo a ogni modifica. */
  const contesti = {};
  R.editorRegole = (cfg) => {
    contesti[cfg.chiave] = cfg;
    return `<div class="editor-regole" id="regole-${cfg.chiave}">${corpoEditor(cfg)}</div>`;
  };
  R.ridisegnaRegole = (chiave) => {
    const el = document.getElementById('regole-' + chiave);
    if (el && contesti[chiave]) el.innerHTML = corpoEditor(contesti[chiave]);
  };
  const opzione = (v, t, scelto) => `<option value="${R.esc(v)}" ${String(scelto) === String(v) ? 'selected' : ''}>${R.esc(t)}</option>`;

  function corpoEditor(cfg) {
    const k = cfg.chiave;
    const fasi = [];
    R.stato.percorsi.forEach((p) => p.fasi.forEach((f) => fasi.push([p.id + '|' + f.id, p.nome + ' · ' + f.nome])));
    const persone = R.stato.utenti.filter((u) => u.stato === 'attivo');
    const automazioni = R.stato.automazioni.filter((a) => !a.eliminata);
    const regole = cfg.regole;
    const cards = regole.map((r, i) => {
      const condizioni = (r.condizioni || []).map((c, j) => {
        const d = cfg.domande.find((x) => x.chiave === c.domanda);
        const valore = SENZA_VALORE.includes(c.operatore) ? '' : d && d.risposte && d.risposte.length && ['uguale', 'diverso'].includes(c.operatore)
          ? `<select class="campo su-beige re-campo" aria-label="Risposta" data-cambia="re-campo" data-k="${k}" data-r="${i}" data-c="${j}" data-p="valore">${opzione('', 'scegli la risposta', c.valore)}${d.risposte.map((x) => opzione(x, x, c.valore)).join('')}</select>`
          : `<input class="campo su-beige re-campo" aria-label="Valore" placeholder="${c.operatore === 'maggiore' || c.operatore === 'minore' ? 'es. 30000' : 'scrivi il valore'}" value="${R.esc(c.valore || '')}" data-cambia="re-campo" data-k="${k}" data-r="${i}" data-c="${j}" data-p="valore">`;
        return `<div class="re-condizione"><span class="re-se">${j === 0 ? 'Se' : r.modo === 'almeno-una' ? 'oppure' : 'e'}</span>
          <select class="campo su-beige re-campo" aria-label="Domanda" data-cambia="re-campo" data-k="${k}" data-r="${i}" data-c="${j}" data-p="domanda">${opzione('', 'scegli la domanda', c.domanda)}${cfg.domande.map((d2) => opzione(d2.chiave, d2.etichetta, c.domanda)).join('')}</select>
          <select class="campo su-beige re-campo" aria-label="Confronto" data-cambia="re-campo" data-k="${k}" data-r="${i}" data-c="${j}" data-p="operatore">${OPERATORI.map(([v, t]) => opzione(v, t, c.operatore)).join('')}</select>
          ${valore}
          <button class="btn mini secondario-campo" data-azione="re-togli-condizione" data-k="${k}" data-r="${i}" data-c="${j}" aria-label="Togli questa condizione">${R.icona('x', 14)}</button></div>`;
      }).join('');
      const a = r.azioni || {};
      return `<div class="riquadro beige re-regola">
        <div class="riga-flex" style="justify-content:space-between;margin-bottom:8px"><b>Regola ${i + 1}</b>
          <div class="riga-flex" style="gap:6px">
            <select class="campo su-beige" style="min-height:34px;width:auto;font-size:12.5px" aria-label="Quando vale" data-cambia="re-modo" data-k="${k}" data-r="${i}">${opzione('tutte', 'devono valere tutte le condizioni', r.modo)}${opzione('almeno-una', 'basta una condizione', r.modo)}</select>
            <button class="btn mini secondario-campo su-bianco" style="background:#fff" data-azione="re-sposta" data-k="${k}" data-r="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Sposta su">${R.icona('su', 14)}</button>
            <button class="btn mini" style="background:#fff" data-azione="re-sposta" data-k="${k}" data-r="${i}" data-d="1" ${i === regole.length - 1 ? 'disabled' : ''} aria-label="Sposta giù">${R.icona('giu', 14)}</button>
            <button class="btn mini" style="background:#fff" data-azione="re-elimina" data-k="${k}" data-r="${i}" aria-label="Elimina la regola ${i + 1}">${R.icona('cestino', 14)}</button>
          </div></div>
        ${condizioni}
        <button class="link verde" style="margin:2px 0 10px 4px" data-azione="re-aggiungi-condizione" data-k="${k}" data-r="${i}">+ Aggiungi condizione</button>
        <div class="re-allora">Allora</div>
        <div class="griglia g-2" style="gap:8px">
          <label><span class="etichetta-campo">Percorso e fase</span><select class="campo" style="background:#fff" data-cambia="re-azione" data-k="${k}" data-r="${i}" data-p="fase">${opzione('', 'come predefinito', a.fase)}${fasi.map(([v, t]) => opzione(v, t, a.fase)).join('')}</select></label>
          <label><span class="etichetta-campo">Responsabile</span><select class="campo" style="background:#fff" data-cambia="re-azione" data-k="${k}" data-r="${i}" data-p="responsabile">${opzione('', 'come predefinito', a.responsabile)}${opzione('turno', 'a turno', a.responsabile)}${opzione('nessuno', 'nessuno (lo assegnano gli amministratori)', a.responsabile)}${persone.map((u) => opzione(u.id, u.nome, a.responsabile)).join('')}</select></label>
          <label><span class="etichetta-campo">Aggiungi l'etichetta</span><input class="campo" style="background:#fff" placeholder="es. non qualificato" value="${R.esc(a.etichette || '')}" data-cambia="re-azione" data-k="${k}" data-r="${i}" data-p="etichette"></label>
          <label><span class="etichetta-campo">Automazione</span><select class="campo" style="background:#fff" data-cambia="re-azione" data-k="${k}" data-r="${i}" data-p="automazione">${opzione('', 'come predefinito', a.automazione)}${opzione('nessuna', 'nessuna', a.automazione)}${automazioni.map((x) => opzione(x.id, x.nome, a.automazione)).join('')}</select></label>
          <label><span class="etichetta-campo">Pagina mostrata dopo l'invio</span><select class="campo" style="background:#fff" data-cambia="re-azione" data-k="${k}" data-r="${i}" data-p="pagina">${opzione('', 'come predefinito', a.pagina)}${opzione('grazie', 'ringraziamento "ti chiamiamo noi"', a.pagina)}${opzione('neutra', 'ringraziamento neutro (senza promesse di chiamata)', a.pagina)}</select></label>
          <label><span class="etichetta-campo">Promemoria "richiamare entro 1 ora"</span><select class="campo" style="background:#fff" data-cambia="re-azione" data-k="${k}" data-r="${i}" data-p="promemoria">${opzione('', 'come predefinito', a.promemoria)}${opzione('si', 'sì', a.promemoria)}${opzione('no', 'no', a.promemoria)}</select></label>
        </div></div>`;
    }).join('');
    return `${regole.length ? cards : `<div class="riquadro beige" style="padding:14px 16px"><span class="secondario">Nessuna regola: tutti i contatti seguono le impostazioni predefinite.</span></div>`}
      <div class="riga-flex spazio-sopra"><button class="btn piccolo primario" data-azione="re-aggiungi" data-k="${k}">${R.icona('piu', 16)} Aggiungi regola</button>${regole.length ? `<button class="btn piccolo secondario-campo" data-azione="re-prova" data-k="${k}">Prova le regole</button>` : ''}</div>
      <p class="piccolo secondario" style="margin:10px 4px 0">Le regole si controllano in ordine: vale la prima che corrisponde. <b>Altrimenti</b> valgono le impostazioni predefinite.</p>`;
  }

  function cambiato(k) { const cfg = contesti[k]; if (cfg.alCambio) cfg.alCambio(cfg.regole); R.ridisegnaRegole(k); }
  R.azioni['re-aggiungi'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const d = cfg.domande.find((x) => x.risposte && x.risposte.length) || cfg.domande[0] || { chiave: '' };
    cfg.regole.push({ id: R.id('rg'), modo: 'tutte', condizioni: [{ domanda: d.chiave, operatore: 'uguale', valore: '' }], azioni: {} });
    cambiato(el.dataset.k);
  };
  R.azioni['re-elimina'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const tolta = cfg.regole.splice(+el.dataset.r, 1)[0];
    cambiato(el.dataset.k);
    R.avviso('Regola eliminata', { annulla: () => { cfg.regole.splice(+el.dataset.r, 0, tolta); cambiato(el.dataset.k); } });
  };
  R.azioni['re-sposta'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const i = +el.dataset.r; const j = i + +el.dataset.d;
    if (j < 0 || j >= cfg.regole.length) return;
    [cfg.regole[i], cfg.regole[j]] = [cfg.regole[j], cfg.regole[i]];
    cambiato(el.dataset.k);
  };
  R.azioni['re-aggiungi-condizione'] = (el) => {
    const cfg = contesti[el.dataset.k];
    cfg.regole[+el.dataset.r].condizioni.push({ domanda: '', operatore: 'uguale', valore: '' });
    cambiato(el.dataset.k);
  };
  R.azioni['re-togli-condizione'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const r = cfg.regole[+el.dataset.r];
    r.condizioni.splice(+el.dataset.c, 1);
    if (!r.condizioni.length) r.condizioni.push({ domanda: '', operatore: 'uguale', valore: '' });
    cambiato(el.dataset.k);
  };
  R.azioni['re-campo'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const c = cfg.regole[+el.dataset.r].condizioni[+el.dataset.c];
    c[el.dataset.p] = el.value;
    if (el.dataset.p === 'domanda') c.valore = '';
    cambiato(el.dataset.k);
  };
  R.azioni['re-modo'] = (el) => { const cfg = contesti[el.dataset.k]; cfg.regole[+el.dataset.r].modo = el.value; cambiato(el.dataset.k); };
  R.azioni['re-azione'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const r = cfg.regole[+el.dataset.r];
    r.azioni = r.azioni || {};
    r.azioni[el.dataset.p] = el.value.trim();
    if (cfg.alCambio) cfg.alCambio(cfg.regole);
  };
  /* "Prova le regole": si scelgono risposte finte e si vede quale regola vale. */
  R.azioni['re-prova'] = (el) => {
    const cfg = contesti[el.dataset.k];
    const campi = cfg.domande.map((d) => `<div class="gruppo-campo"><label class="etichetta-campo">${R.esc(d.etichetta)}</label>${d.risposte && d.risposte.length ? `<select class="campo" name="${R.esc(d.chiave)}" data-cambia="re-prova-calcola">${opzione('', 'nessuna risposta', '')}${d.risposte.map((x) => opzione(x, x, '')).join('')}</select>` : `<input class="campo" name="${R.esc(d.chiave)}" data-digita="re-prova-calcola">`}</div>`).join('');
    R.modale({
      titolo: 'Prova le regole',
      sottotitolo: 'Scegli delle risposte finte: vedi subito quale regola vale e cosa succederebbe. Non si crea nessun contatto.',
      corpo: `<div class="griglia g-2">${campi}</div><div class="riquadro scuro" id="re-esito" data-k="${R.esc(el.dataset.k)}" style="padding:16px 18px"></div>`,
      pulsanti: [{ testo: 'Chiudi', chiudi: true }],
      dopo: () => R.azioni['re-prova-calcola'](),
    });
  };
  R.azioni['re-prova-calcola'] = () => {
    const box = document.getElementById('re-esito');
    if (!box) return;
    const cfg = contesti[box.dataset.k];
    const risposte = R.valori(R.modaleAperta());
    const e = R.applicaRegole(cfg.regole, risposte, cfg.predefinite ? cfg.predefinite() : {});
    box.innerHTML = `<div style="color:var(--lime);font-size:12.5px">${e.numero ? 'Vale la regola ' + e.numero : 'Nessuna regola corrisponde: valgono le impostazioni predefinite'}</div><div class="grassetto" style="margin-top:4px">${R.esc(R.descriviAzioni(e.azioni)) || 'Impostazioni predefinite'}</div>`;
  };

  R.stile('regole', `
    .re-regola { padding: 14px 16px; margin-bottom: 10px; }
    .re-condizione { display: grid; grid-template-columns: 52px minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.2fr) auto; gap: 6px; align-items: center; margin-bottom: 6px; }
    .re-condizione .campo { min-height: 38px; font-size: 13px; padding: 0 12px; background-color: #fff; }
    .re-se { font-weight: 600; font-size: 13px; color: var(--verde); }
    .re-allora { font-weight: 600; font-size: 13px; color: var(--verde); margin: 4px 0 6px; }
    @media (max-width: 767px) { .re-condizione { grid-template-columns: minmax(0,1fr) auto; } .re-condizione .re-se { grid-column: 1 / -1; } .re-condizione select, .re-condizione input { grid-column: 1 / 2; } }
  `);
})();
