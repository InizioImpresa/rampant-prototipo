/* Rampant — prototipo. Schermata Funnel (decisione 29/10/2026, versione C): percorso dalla pubblicità al contratto
   firmato, vista Catena (tela scura con blocchi collegati) e vista Imbuto. Dati inventati, fissi nel codice.
   Azioni con prefisso "fn-". Stato dei filtri in R.stato.filtri (fnVista, fnFonte). */
(function () {
  'use strict';
  const R = window.R;
  const num = (n) => new Intl.NumberFormat('it-IT', { useGrouping: 'always' }).format(n);
  const eur = (n, dec) => (R.puo('reportTutti') ? new Intl.NumberFormat('it-IT', { useGrouping: 'always', minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }).format(n) + ' €' : '—');
  const pct = (a, b) => (b ? (a / b * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + '%' : '—');

  /* Numeri inventati della campagna "ZES 2026", ultimi 30 giorni, divisi per fonte */
  const FONTI = {
    meta: { spesa: 860, impress: 150100, clic: 2980, visite: 2670, contatti: 171, contattati: 135, app: 41, prop: 17, firm: 5 },
    google: { spesa: 380, impress: 32300, clic: 670, visite: 450, contatti: 43, contattati: 33, app: 11, prop: 4, firm: 1 },
  };
  const somma = () => Object.keys(FONTI.meta).reduce((o, k) => { o[k] = FONTI.meta[k] + FONTI.google[k]; return o; }, {});
  const dati = (f) => (f === 'meta' ? FONTI.meta : f === 'google' ? FONTI.google : somma());

  const LOGO_META = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4.5 12c0-3 1.6-5.5 3.8-5.5 4 0 5.4 11 9.4 11 2.2 0 3.8-2.5 3.8-5.5s-1.6-5.5-3.8-5.5c-4 0-5.4 11-9.4 11C6.1 17.5 4.5 15 4.5 12z"/></svg>';
  const LOGO_GOOGLE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><text x="12" y="18" text-anchor="middle" font-size="19" font-weight="700" font-family="Arial,sans-serif" fill="currentColor">G</text></svg>';

  R.stile('funnel', `
    .fn-tela { background: #12201A; background-image: radial-gradient(#27402F 1px, transparent 1px); background-size: 18px 18px; border-radius: 28px; padding: 18px; color: #EDEFE6; }
    .fn-cv { position: relative; width: 100%; max-width: 780px; margin: 10px auto 0; aspect-ratio: 648 / 312; }
    .fn-cv > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .fn-nd { position: absolute; width: 17.28%; height: 25.64%; background: #1B3026; border: 1px solid #35553F; border-radius: 14px; padding: 8px 10px; box-sizing: border-box; text-align: left; color: #EDEFE6; cursor: pointer; font: inherit; }
    .fn-nd:hover { border-color: #6FB28B; }
    .fn-nd .h { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #A9BDAE; line-height: 1.2; }
    .fn-nd .n { font-size: 20px; font-weight: 600; margin-top: 3px; color: #fff; }
    .fn-nd .s { font-size: 10.5px; color: #A9BDAE; }
    .fn-nd.ok { background: #C8E6A0; border-color: #C8E6A0; } .fn-nd.ok .h, .fn-nd.ok .s { color: #27402F; } .fn-nd.ok .n { color: #12201A; }
    .fn-nd.rosso { border-color: #F09595; } .fn-nd.rosso .s { color: #F7C1C1; }
    .fn-nd.vuoto { border-style: dashed; background: transparent; cursor: default; }
    .fn-lb { position: absolute; transform: translate(-50%, -50%); background: #C8E6A0; color: #12201A; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .fn-lb.r { background: #F09595; color: #501313; }
    .fn-logo { width: 22px; height: 22px; border-radius: 50%; display: inline-grid; place-items: center; flex: 0 0 22px; }
    .fn-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: space-between; }
    .fn-pill { border: 1px solid #35553F; background: transparent; color: #EDEFE6; border-radius: 999px; padding: 7px 15px; font-size: 13px; cursor: pointer; font-family: inherit; }
    .fn-pill.on { background: #C8E6A0; color: #12201A; border-color: #C8E6A0; font-weight: 600; }
    .fn-chip { background: #1B3026; border: 1px solid #35553F; border-radius: 999px; padding: 6px 13px; font-size: 12px; color: #A9BDAE; cursor: pointer; font-family: inherit; }
    .fn-alert { background: #FBE3E1; color: #9B2C24; border-radius: 20px; padding: 12px 16px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px; }
    .fn-imb { max-width: 780px; margin: 14px auto 0; }
    .fn-imb .r { display: grid; grid-template-columns: 62% 38%; align-items: center; margin-bottom: 2px; }
    .fn-imb .tr { display: flex; justify-content: center; }
    .fn-imb .tr div { height: 38px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #10231A; }
    .fn-imb .e { font-size: 12.5px; padding-left: 12px; display: flex; align-items: center; gap: 8px; }
    .fn-imb .e b { background: #C8E6A0; color: #12201A; border-radius: 999px; padding: 1px 8px; font-size: 11px; }
    .fn-lista { display: none; }
    .fn-lista .fn-nd { position: static; width: 100%; height: auto; display: block; }
    .fn-lista .freccia { display: flex; align-items: center; justify-content: center; gap: 8px; height: 34px; font-size: 11px; color: #A9BDAE; }
    @media (max-width: 767px) {
      .fn-cv { display: none; }
      .fn-imb .r { grid-template-columns: 50% 50%; } .fn-imb .e { font-size: 11.5px; padding-left: 8px; gap: 4px; flex-wrap: wrap; }
      .fn-lista { display: block; margin-top: 12px; }
      .fn-lista .due { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    }
  `);

  function blocchiCatena(f, d) {
    const meta = f !== 'google', goo = f !== 'meta';
    const lb = (x, y, t, r) => `<span class="fn-lb ${r ? 'r' : ''}" style="left:${x / 6.48}%;top:${y / 3.12}%">${t}</span>`;
    const nd = (x, y, cls, k, h, n, s) => `<button class="fn-nd ${cls}" data-azione="fn-apri" data-k="${k}" style="left:${x / 6.48}%;top:${y / 3.12}%"><div class="h">${h}</div><div class="n">${n}</div><div class="s">${s}</div></button>`;
    const logo = (t, bg, col) => `<span class="fn-logo" style="background:${bg};color:${col}">${t}</span>`;
    const curve = (y) => `<path d="M112 ${y} C 145 ${y}, 145 100, 178 100"/>`;
    return `<div class="fn-cv">
      <svg viewBox="0 0 648 312" aria-hidden="true"><defs><marker id="fnar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#6FB28B"/></marker></defs>
        <g fill="none" stroke="#6FB28B" stroke-width="2" marker-end="url(#fnar)">${meta ? curve(50) : ''}${goo ? curve(150) : ''}<path d="M290 100 L356 100"/><path d="M468 100 L536 100"/><path d="M592 140 L592 215"/><path d="M536 255 L468 255"/><path d="M356 255 L290 255"/></g></svg>
      ${meta ? nd(0, 10, '', 'meta', logo(LOGO_META, '#0866FF', '#fff') + 'Meta Ads', eur(FONTI.meta.spesa), num(FONTI.meta.clic) + ' clic') : ''}
      ${goo ? nd(0, 110, '', 'google', logo(LOGO_GOOGLE, '#fff', '#4285F4') + 'Google Ads', eur(FONTI.google.spesa), num(FONTI.google.clic) + ' clic') : ''}
      ${nd(178, 60, '', 'landing', 'Landing ZES 2026', num(d.visite), 'visite')}
      ${nd(356, 60, '', 'modulo', 'Modulo compilato', num(d.contatti), eur(d.spesa / d.contatti, 2) + ' l\'uno')}
      ${nd(536, 60, 'rosso', 'contattati', 'Contattati', num(d.contattati), num(d.contatti - d.contattati) + ' da richiamare')}
      ${nd(536, 215, '', 'app', 'Appuntamento', num(d.app), eur(d.spesa / d.app, 2) + ' l\'uno')}
      ${nd(356, 215, '', 'prop', 'Proposta', num(d.prop), '&nbsp;')}
      ${nd(178, 215, 'ok', 'firm', 'Contratto firmato', num(d.firm), eur(d.spesa / d.firm, 2) + ' l\'uno')}
      ${nd(0, 215, 'vuoto', 'totale', 'Totale speso', eur(d.spesa), num(d.contatti) + ' contatti')}
      ${lb(145, 100, pct(d.visite, d.clic))}${lb(323, 100, pct(d.contatti, d.visite))}${lb(502, 100, pct(d.contattati, d.contatti), 1)}${lb(592, 177, pct(d.app, d.contattati))}${lb(502, 255, pct(d.prop, d.app))}${lb(323, 255, pct(d.firm, d.prop))}
    </div>`;
  }

  function listaTelefono(f, d) {
    const meta = f !== 'google', goo = f !== 'meta';
    const nd = (cls, k, h, n, s) => `<button class="fn-nd ${cls}" data-azione="fn-apri" data-k="${k}"><div class="h">${h}</div><div class="n">${n}</div><div class="s">${s}</div></button>`;
    const fr = (t, r) => `<div class="freccia"><span>↓</span><span class="fn-lb ${r ? 'r' : ''}" style="position:static;transform:none">${t}</span></div>`;
    return `<div class="fn-lista"><div class="due">${meta ? nd('', 'meta', 'Meta Ads', eur(FONTI.meta.spesa), num(FONTI.meta.clic) + ' clic') : ''}${goo ? nd('', 'google', 'Google Ads', eur(FONTI.google.spesa), num(FONTI.google.clic) + ' clic') : ''}</div>
      ${fr(pct(d.visite, d.clic))}${nd('', 'landing', 'Landing ZES 2026', num(d.visite), 'visite')}
      ${fr(pct(d.contatti, d.visite))}${nd('', 'modulo', 'Modulo compilato', num(d.contatti), eur(d.spesa / d.contatti, 2) + ' l\'uno')}
      ${fr(pct(d.contattati, d.contatti), 1)}${nd('rosso', 'contattati', 'Contattati', num(d.contattati), num(d.contatti - d.contattati) + ' da richiamare')}
      ${fr(pct(d.app, d.contattati))}${nd('', 'app', 'Appuntamento', num(d.app), eur(d.spesa / d.app, 2) + ' l\'uno')}
      ${fr(pct(d.prop, d.app))}${nd('', 'prop', 'Proposta', num(d.prop), '&nbsp;')}
      ${fr(pct(d.firm, d.prop))}${nd('ok', 'firm', 'Contratto firmato', num(d.firm), eur(d.spesa / d.firm, 2) + ' l\'uno')}</div>`;
  }

  function imbuto(d) {
    const st = [['Viste', d.impress, ''], ['Clic', d.clic, pct(d.clic, d.impress)], ['Visite landing', d.visite, pct(d.visite, d.clic)], ['Contatti', d.contatti, pct(d.contatti, d.visite)], ['Contattati', d.contattati, pct(d.contattati, d.contatti)], ['Appuntamento', d.app, pct(d.app, d.contattati)], ['Proposta', d.prop, pct(d.prop, d.app)], ['Firmato', d.firm, pct(d.firm, d.prop)]];
    const lo = Math.log(Math.max(1, d.firm)), hi = Math.log(d.impress);
    const w = st.map((s) => 26 + 74 * (Math.log(Math.max(1, s[1])) - lo) / (hi - lo));
    const col = ['#7FAAF7', '#7FAAF7', '#F2A57F', '#F2A57F', '#6FB28B', '#6FB28B', '#6FB28B', '#C8E6A0'];
    return `<div class="fn-imb">${st.map((s, i) => {
      const next = i < st.length - 1 ? w[i + 1] : w[i] * 0.8, ins = ((w[i] - next) / 2) / w[i] * 100;
      return `<div class="r"><div class="tr"><div style="width:${w[i]}%;background:${col[i]};clip-path:polygon(0 0,100% 0,${100 - ins}% 100%,${ins}% 100%)">${num(s[1])}</div></div><div class="e">${s[0]}${s[2] ? ` <b>${s[2]}</b>` : ''}</div></div>`;
    }).join('')}</div>`;
  }

  R.rotta('/funnel', {
    menu: 'funnel', titolo: 'Funnel',
    disegna() {
      const fl = R.stato.filtri;
      const vista = fl.fnVista || 'catena', f = fl.fnFonte || 'tutte';
      const d = dati(f);
      const nome = f === 'meta' ? 'Meta' : f === 'google' ? 'Google' : 'Meta + Google';
      const b = (id, t, att, az) => `<button class="fn-pill ${att === id ? 'on' : ''}" data-azione="${az}" data-v="${id}">${t}</button>`;
      return `<div class="testata"><div><h1 class="titolo-pagina">Funnel</h1><div class="spiegazione">Dal budget speso su Meta e Google fino al contratto firmato, con la percentuale di passaggio a ogni gradino. Ogni blocco apre i contatti di quel passaggio.</div></div></div>
        <div class="fn-tela">
          <div class="fn-bar"><div><div style="font-size:20px;font-weight:600">ZES 2026</div><div style="font-size:12px;color:#A9BDAE">Ultimi 30 giorni · ${nome} · dati inventati</div></div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">${b('catena', 'Catena', vista, 'fn-vista')}${b('imbuto', 'Imbuto', vista, 'fn-vista')}</div></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px"><button class="fn-chip" data-azione="fn-fisso">Periodo: ultimi 30 giorni</button><button class="fn-chip" data-azione="fn-fisso">Campagna: ZES 2026</button>${[['tutte', 'Meta + Google'], ['meta', 'Solo Meta'], ['google', 'Solo Google']].map(([id, t]) => `<button class="fn-pill ${f === id ? 'on' : ''}" data-azione="fn-fonte" data-v="${id}" style="padding:5px 12px;font-size:12px">${t}</button>`).join('')}</div>
          ${vista === 'catena' ? blocchiCatena(f, d) + listaTelefono(f, d) : imbuto(d)}
        </div>
        <div class="fn-alert"><span>${R.icona('allarme', 16)} <b>Dove si perde di più:</b> ${num(d.contatti - d.contattati)} contatti su ${num(d.contatti)} non sono ancora stati contattati.</span><button class="btn rosso piccolo" data-azione="fn-apri" data-k="contattati">Apri i ${num(d.contatti - d.contattati)} contatti</button></div>
        <p class="piccolo secondario" style="margin-top:12px">Spesa, viste e clic arrivano da Meta Ads e Google Ads; visite e contatti dalle pagine; il resto dagli affari. Se Meta o Google non sono collegati, il loro blocco non compare e la catena parte dalla landing.</p>`;
    },
  });
  R.azioni['fn-vista'] = (el) => { R.stato.filtri.fnVista = el.dataset.v; R.salva(); R.aggiorna(); };
  R.azioni['fn-fonte'] = (el) => { R.stato.filtri.fnFonte = el.dataset.v; R.salva(); R.aggiorna(); };
  R.azioni['fn-fisso'] = () => R.avviso('Nel prototipo il periodo e la campagna sono fissi');
  R.azioni['fn-apri'] = (el) => { R.avviso('Qui si apre l\'elenco dei contatti di questo passaggio'); setTimeout(() => R.vai('#/contatti'), 600); };
})();
