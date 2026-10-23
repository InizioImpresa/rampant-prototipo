/* Rampant — prototipo. Elenchi: Contatti (immagine 21), Attività (immagine 11), Calendario (immagine 10), Cestino. */
(function () {
  'use strict';
  const R = window.R;

  R.estendiDati((s) => {
    s.occupatoGoogle = [{ persona: 'u1', quando: R.giorniDa(2, '14:00'), durata: 90 }, { persona: 'u2', quando: R.giorniDa(1, '09:00'), durata: 60 }];
    s.filtriSalvati = [];
  });

  /* ================= CONTATTI ================= */
  const NOMI_RAPIDI = { tutti: 'Tutti', oggi: 'Arrivati oggi', nuovi: 'Nuovi questa settimana', facebook: 'Da Facebook', mai: 'Mai richiamati', fermi: 'Fermi da 30 giorni', senza: 'Senza responsabile' };
  function ultimoMovimento(c) {
    const ev = R.stato.storia.filter((e) => e.contatto === c.id).concat(R.stato.messaggi.filter((m) => m.contatto === c.id).map((m) => ({ tipo: 'wa', quando: m.quando }))).sort((a, b) => new Date(b.quando) - new Date(a.quando))[0];
    return ev || null;
  }
  function etichettaUltima(c) {
    const affari = R.affariDelContatto(c.id).filter((a) => a.stato === 'aperto');
    if (affari.some((a) => R.attivitaAperte((t) => t.affare === a.id && R.scaduta(t)).length)) return '<span style="color:var(--errore-t)">promemoria scaduto</span>';
    if (affari.some((a) => R.maiRichiamato(a))) return '<span style="color:var(--errore-t)">mai richiamato</span>';
    const u = ultimoMovimento(c);
    if (!u) return '<span class="secondario">—</span>';
    const nomi = { wa: 'WhatsApp', email: 'Email', chiamata: 'Chiamata', modulo: 'Modulo', fase: 'Fase', nota: 'Nota', attivita: 'Attività', modifica: 'Modifica', automazione: 'Automazione' };
    const g = R.giornoRelativo(u.quando);
    return `<span style="${u.tipo === 'wa' ? 'color:var(--verde)' : ''}">${nomi[u.tipo] || 'Attività'} · ${g.replace(' fa', '')}</span>`;
  }
  function contattiFiltrati() {
    const f = R.stato.filtri.contatti;
    const oggi = R.oggi();
    const lunedi = new Date(oggi); lunedi.setDate(oggi.getDate() - ((oggi.getDay() + 6) % 7));
    let lista = R.stato.contatti.filter((c) => !c.eliminato && R.contattoVisibile(c));
    const q = (f.q || '').toLowerCase().replace(/\s/g, '');
    if (q) lista = lista.filter((c) => [c.nome, c.referente, c.telefono, c.piva, c.email].join(' ').toLowerCase().replace(/\s/g, '').includes(q));
    if (f.rapido === 'nuovi') lista = lista.filter((c) => new Date(c.creato) >= lunedi);
    if (f.rapido === 'oggi') lista = lista.filter((c) => new Date(c.creato) >= oggi);
    if (f.rapido === 'facebook') lista = lista.filter((c) => c.fonte === 'Facebook');
    if (f.rapido === 'mai') lista = lista.filter((c) => R.affariDelContatto(c.id).some((a) => R.maiRichiamato(a)));
    if (f.rapido === 'fermi') lista = lista.filter((c) => { const u = ultimoMovimento(c); return !u || R.diffGiorni(u.quando) <= -30; });
    if (f.rapido === 'senza') lista = lista.filter((c) => !c.responsabile);
    if (f.rapido && f.rapido.startsWith('salvato:')) {
      const s = R.stato.filtriSalvati.find((x) => x.id === f.rapido.slice(8));
      if (s) { const q2 = s.q.toLowerCase().replace(/\s/g, ''); lista = lista.filter((c) => [c.nome, c.referente, c.telefono, c.piva, c.email, c.fonte, c.campagna, c.regione].join(' ').toLowerCase().replace(/\s/g, '').includes(q2)); }
    }
    return lista.sort((a, b) => new Date(b.creato) - new Date(a.creato));
  }
  const COLONNE = [['telefono', 'Telefono'], ['fonte', 'Fonte'], ['bando', 'Bando'], ['fase', 'Fase'], ['responsabile', 'Responsabile'], ['ultima', 'Ultima attività'], ['creato', 'Creato'], ['regione', 'Regione'], ['email', 'Email']];
  function tabellaContatti() {
    const f = R.stato.filtri.contatti;
    const lista = contattiFiltrati();
    const col = f.colonne;
    if (!lista.length) return `<div class="vuoto">${f.q ? 'Nessun contatto trovato. Prova con il telefono o la partita IVA.' : 'Nessun contatto con questo filtro.'} <button class="link verde" data-azione="el-nuovo-contatto">Aggiungi un contatto</button></div>`;
    const testa = `<tr><th style="width:36px"><input type="checkbox" aria-label="Seleziona tutti" data-cambia="el-sel-tutti" ${lista.every((c) => f.selezionati.includes(c.id)) ? 'checked' : ''}></th><th>Contatto</th>${COLONNE.filter(([k]) => col[k]).map(([, t]) => `<th>${t}</th>`).join('')}</tr>`;
    const righe = lista.map((c) => {
      const a = R.affariDelContatto(c.id).filter((x) => R.affareVisibile(x)).sort((x, y) => (x.stato === 'aperto' ? -1 : 1) - (y.stato === 'aperto' ? -1 : 1))[0];
      const sel = f.selezionati.includes(c.id);
      const celle = {
        telefono: R.esc(c.telefono),
        fonte: `<span class="etichetta ${c.fonte === 'Facebook' || c.fonte === 'Google' ? 'cielo' : ''}">${R.esc(c.fonte)}</span>`,
        bando: a && a.bando ? `<span class="etichetta salvia">${R.esc(a.bando)}</span>` : '—',
        fase: a ? R.esc(R.nomeFase(a)) : '<span class="secondario">nessun affare</span>',
        responsabile: c.responsabile ? R.esc(R.utenteDa(c.responsabile).breve) : '<span class="etichetta errore">nessuno</span>',
        ultima: etichettaUltima(c),
        creato: `<span class="secondario">${R.dataBreve(c.creato)}</span>`,
        regione: R.esc(c.regione || '—'),
        email: R.esc(c.email || '—'),
      };
      return `<tr class="${sel ? 'selezionata' : ''}" data-azione="el-apri" data-c="${c.id}"><td><input type="checkbox" ${sel ? 'checked' : ''} data-cambia="el-sel" data-c="${c.id}" aria-label="Seleziona ${R.esc(c.nome)}"></td>
        <td><div class="riga-flex" style="flex-wrap:nowrap"><span class="quadratino ${c.colore || 'salvia'}" style="width:38px;height:38px">${R.iniziali(c.nome)}</span><div><div class="grassetto">${R.esc(c.nome)}</div><div class="piccolo secondario">${R.esc(c.referente)}</div></div></div></td>
        ${COLONNE.filter(([k]) => col[k]).map(([k]) => `<td>${celle[k]}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="contenitore-tabella"><table class="tabella"><thead>${testa}</thead><tbody>${righe}</tbody></table></div>`;
  }
  function barraSelezione() {
    const n = R.stato.filtri.contatti.selezionati.length;
    if (!n) return '';
    return `<div class="barra-scura" role="toolbar" aria-label="Azioni sui selezionati"><span class="conteggio">${n} ${n === 1 ? 'selezionato' : 'selezionati'}</span>
      ${R.puo('inviiMultipli') ? '<button class="evidenza" data-azione="el-multi-wa">Invia WhatsApp</button><button data-azione="el-multi-email">Invia email</button>' : ''}
      <button data-azione="el-multi-etichetta">Aggiungi etichetta</button>
      ${R.amministratore() ? '<button data-azione="el-multi-assegna">Assegna a</button>' : ''}
      ${R.puo('automazioni') ? '<button data-azione="el-multi-automazione">Avvia automazione</button>' : ''}
      ${R.puo('esportare') ? '<button data-azione="el-multi-esporta">Esporta</button>' : ''}
      ${R.puo('eliminare') ? '<button data-azione="el-multi-elimina">Elimina</button>' : ''}
      <button data-azione="el-deseleziona" aria-label="Togli la selezione">${R.icona('x', 16)}</button></div>`;
  }
  R.rotta('/contatti', {
    menu: 'contatti',
    titolo: 'Contatti',
    disegna: (p, q) => {
      const f = R.stato.filtri.contatti = Object.assign({ q: '', rapido: 'tutti', selezionati: [], colonne: { telefono: true, fonte: true, bando: true, fase: true, responsabile: true, ultima: true, creato: true, regione: false, email: false } }, R.stato.filtri.contatti);
      if (q.filtro && NOMI_RAPIDI[q.filtro]) f.rapido = q.filtro;
      const tutti = R.stato.contatti.filter((c) => !c.eliminato && R.contattoVisibile(c));
      const oggi = R.oggi(); const lunedi = new Date(oggi); lunedi.setDate(oggi.getDate() - ((oggi.getDay() + 6) % 7));
      const nuovi = tutti.filter((c) => new Date(c.creato) >= lunedi).length;
      const rapidi = ['tutti', 'oggi', 'nuovi', 'facebook', 'mai', 'fermi'].concat(R.amministratore() ? ['senza'] : []);
      const nCol = Object.values(f.colonne).filter(Boolean).length + 1;
      return `
        <div class="testata"><div><div class="sopratitolo">${R.numero(tutti.length)} contatti · ${nuovi} nuovi questa settimana</div><h1 class="titolo-pagina">Contatti</h1></div>
          <div class="azioni-testata"><div class="ricerca" style="width:min(320px,100%)">${R.icona('cerca')}<input class="campo" placeholder="Cerca nome, azienda, telefono, P. IVA" value="${R.esc(f.q)}" data-digita="el-cerca" aria-label="Cerca contatti"></div>
          <button class="btn" data-azione="el-importa">Importa</button><button class="btn primario" data-azione="el-nuovo-contatto">${R.icona('piu')} Nuovo contatto</button></div></div>
        <div class="riga-flex" style="justify-content:space-between;margin-bottom:16px"><div class="pillole">
          ${rapidi.map((k) => `<button class="pillola ${f.rapido === k ? 'attiva' : ''}" data-azione="el-rapido" data-k="${k}">${NOMI_RAPIDI[k]}</button>`).join('')}
          ${R.stato.filtriSalvati.map((s) => `<button class="pillola ${f.rapido === 'salvato:' + s.id ? 'attiva' : ''}" data-azione="el-rapido" data-k="salvato:${s.id}">${R.esc(s.nome)}</button>`).join('')}
          <button class="pillola tratteggiata" data-azione="el-salva-filtro">+ Salva filtro</button></div>
          <button class="btn" data-azione="el-colonne">Colonne · ${nCol}</button></div>
        <div class="riquadro" style="padding:14px" id="tabella-contatti">${tabellaContatti()}</div>
        <div id="barra-selezione">${barraSelezione()}</div>`;
    },
  });
  function ridisegnaTabella() {
    const t = document.getElementById('tabella-contatti');
    if (t) t.innerHTML = tabellaContatti();
    const b = document.getElementById('barra-selezione');
    if (b) b.innerHTML = barraSelezione();
  }
  R.azioni['el-cerca'] = (el) => { R.stato.filtri.contatti.q = el.value; R.salva(); ridisegnaTabella(); };
  R.azioni['el-rapido'] = (el) => { const f = R.stato.filtri.contatti; f.rapido = el.dataset.k; f.selezionati = []; R.salva(); R.vai('#/contatti'); };
  R.azioni['el-apri'] = (el, ev) => { if (ev.target.closest('input')) return; R.vai('#/contatto/' + el.dataset.c); };
  R.azioni['el-sel'] = (el) => {
    const f = R.stato.filtri.contatti;
    f.selezionati = el.checked ? Array.from(new Set(f.selezionati.concat([el.dataset.c]))) : f.selezionati.filter((x) => x !== el.dataset.c);
    R.salva(); ridisegnaTabella();
  };
  R.azioni['el-sel-tutti'] = (el) => { const f = R.stato.filtri.contatti; f.selezionati = el.checked ? contattiFiltrati().map((c) => c.id) : []; R.salva(); ridisegnaTabella(); };
  R.azioni['el-deseleziona'] = () => { R.stato.filtri.contatti.selezionati = []; R.salva(); ridisegnaTabella(); };
  R.azioni['el-salva-filtro'] = () => {
    const f = R.stato.filtri.contatti;
    R.modale({
      titolo: 'Salva filtro', sottotitolo: 'Il filtro compare tra le pillole, pronto da riusare.', classe: 'stretta',
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo">Nome del filtro</label><input class="campo" name="nome" placeholder="Es. Puglia ZES"></div><div class="gruppo-campo"><label class="etichetta-campo">Cerca</label><input class="campo" name="q" value="${R.esc(f.q)}" placeholder="Es. Puglia"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai: (fin) => { const v = R.valori(fin); if (!v.nome) { R.erroreCampo(fin, 'nome', 'Dai un nome al filtro.'); return false; } if (!v.q) { R.erroreCampo(fin, 'q', 'Scrivi cosa cercare.'); return false; } const s = { id: R.id('fs'), nome: v.nome, q: v.q }; R.stato.filtriSalvati.push(s); f.rapido = 'salvato:' + s.id; f.q = ''; R.salva(); R.aggiorna(); R.avviso('Filtro salvato'); } }],
    });
  };
  R.azioni['el-colonne'] = () => {
    const col = R.stato.filtri.contatti.colonne;
    R.modale({
      titolo: 'Colonne', sottotitolo: 'Scegli quali informazioni vedere nell\'elenco.', classe: 'stretta',
      corpo: COLONNE.map(([k, t]) => `<label class="riga-impostazione"><span>${t}</span><span class="interruttore"><input type="checkbox" name="${k}" ${col[k] ? 'checked' : ''}><span></span></span></label>`).join(''),
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai: (fin) => { Object.assign(col, R.valori(fin)); R.salva(); R.aggiorna(); } }],
    });
  };
  R.azioni['el-nuovo-contatto'] = () => {
    if (!R.serveConnessione('la creazione di un contatto')) return;
    R.modale({
      titolo: 'Nuovo contatto', sottotitolo: 'Bastano il nome e il telefono oppure l\'email. Il resto puoi aggiungerlo dopo.', proteggi: true,
      corpo: `<div class="griglia g-2"><div class="gruppo-campo"><label class="etichetta-campo">Nome della persona o dell'azienda</label><input class="campo" name="nome" placeholder="Es. Bianchi srl"></div><div class="gruppo-campo"><label class="etichetta-campo">Referente</label><input class="campo" name="referente" placeholder="Es. Mario Bianchi"></div><div class="gruppo-campo"><label class="etichetta-campo">Telefono</label><input class="campo" name="telefono" inputmode="tel" placeholder="+39 333 123 4567"></div><div class="gruppo-campo"><label class="etichetta-campo">Email</label><input class="campo" name="email" inputmode="email" placeholder="nome@azienda.it"></div></div><div id="avviso-doppione-c"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Crea contatto', classe: 'primario', fai: (fin) => {
          const v = R.valori(fin);
          if (!v.nome) { R.erroreCampo(fin, 'nome', 'Scrivi il nome della persona o dell\'azienda.'); return false; }
          if (!v.telefono && !v.email) { R.erroreCampo(fin, 'telefono', 'Serve il telefono oppure l\'email.'); return false; }
          if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) { R.erroreCampo(fin, 'email', 'Controlla l\'email: manca qualcosa (es. nome@azienda.it).'); return false; }
          const dop = R.trovaDoppione(v.telefono, v.email);
          if (dop) {
            const box = fin.querySelector('#avviso-doppione-c');
            if (R.contattoVisibile(dop)) box.innerHTML = `<div class="banner giallo">${R.icona('allarme')}<div class="principale"><b>Esiste già:</b> ${R.esc(dop.nome)} · ${R.esc(dop.telefono)}. Stesso telefono o stessa email vuol dire stesso contatto.</div><button class="btn piccolo" data-azione="vai" data-dove="#/contatto/${dop.id}">Apri la scheda</button></div>`;
            else { box.innerHTML = `<div class="banner giallo">${R.icona('allarme')}<div class="principale"><b>Questo contatto è già seguito da un collega:</b> lo abbiamo avvisato.</div></div>`; R.notifica(`${R.esc(R.utente().breve)} ha provato a creare un contatto che segui già: <b>${R.esc(dop.nome)}</b>`, '#/contatto/' + dop.id, dop.responsabile); }
            return false;
          }
          const c = { id: R.id('c'), nome: v.nome, referente: v.referente || v.nome, ruoloReferente: '', telefono: v.telefono ? R.formattaTelefono(v.telefono) : '', altriTelefoni: [], email: v.email, altreEmail: [], piva: '', ateco: '', regione: '', dipendenti: '', fonte: 'Inserito a mano', campagna: '', pagina: '', responsabile: R.utente().id, creato: R.adesso(), colore: 'salvia', etichette: [], nonLetti: 0, consensi: { whatsapp: 'non-registrato', email: 'non-registrato' } };
          R.stato.contatti.push(c);
          R.registraStoria(c.id, null, 'modifica', 'Contatto creato a mano');
          R.salva(); R.chiudiModale(true); R.vai('#/contatto/' + c.id); R.avviso('Contatto creato · consensi "Non registrato" finché non li raccogli');
          return false;
        },
      }],
    });
  };
  R.azioni['el-importa'] = () => {
    if (!R.serveConnessione('l\'importazione')) return;
    R.modale({
      titolo: 'Importa da Excel o CSV', sottotitolo: 'Nel prototipo l\'importazione è simulata con un file di esempio.', classe: 'larga',
      corpo: `<div class="griglia g-3">
        <div class="riquadro beige"><div class="grassetto">1 · Scegli il file</div><div class="piccolo secondario" style="margin:6px 0 10px">contatti-fiera.xlsx · 3 righe</div><span class="etichetta salvia">Caricato</span></div>
        <div class="riquadro beige"><div class="grassetto">2 · Abbina le colonne</div><div class="piccolo" style="margin-top:6px">Ragione sociale → Nome<br>Cellulare → Telefono<br>Mail → Email<br>Consenso WA → Consenso WhatsApp</div></div>
        <div class="riquadro beige"><div class="grassetto">3 · Controlla</div><div class="piccolo" style="margin-top:6px">2 nuovi contatti<br><span style="color:var(--pesca-t)">1 possibile doppione: Bianchi srl (stesso telefono) · verrà saltato</span></div></div></div>
        <p class="piccolo secondario" style="margin:12px 6px 0">I telefoni senza prefisso prendono +39. Senza la colonna del consenso, il consenso resta "Non registrato".</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Importa 2 contatti', classe: 'primario', fai: () => {
          [['Bar Centrale', 'Nicola Esposito', '+39 333 765 4321'], ['Gommista Ruotafacile', 'Gianni De Santis', '+39 339 888 1234']].forEach(([nome, ref, tel]) => {
            const c = { id: R.id('c'), nome, referente: ref, ruoloReferente: '', telefono: tel, altriTelefoni: [], email: '', altreEmail: [], piva: '', ateco: '', regione: 'Campania', dipendenti: '', fonte: 'Importato', campagna: '', pagina: '', responsabile: R.utente().id, creato: R.adesso(), colore: 'cielo', etichette: ['fiera'], nonLetti: 0, consensi: { whatsapp: 'si', email: 'non-registrato' } };
            R.stato.contatti.push(c);
            R.registraStoria(c.id, null, 'modifica', 'Importato da contatti-fiera.xlsx (consenso WhatsApp dalla colonna del file)');
          });
          R.salva(); R.aggiorna(); R.avviso('Importati 2 contatti · 1 doppione saltato');
        },
      }],
    });
  };
  /* Azioni sui contatti selezionati */
  const selezionati = () => R.stato.filtri.contatti.selezionati.map(R.contatto).filter(Boolean);
  R.azioni['el-multi-wa'] = () => {
    if (!R.serveConnessione('l\'invio dei messaggi')) return;
    const lista = selezionati();
    const conConsenso = lista.filter((c) => (c.consensi || {}).whatsapp === 'si');
    const esclusi = lista.length - conConsenso.length;
    const numeri = R.stato.numeri.filter((n) => R.amministratore() || n.utente === R.utente().id || n.predefinito);
    const calcola = (numId) => { const n = R.datiNumero(numId); const quota = Math.max(0, Math.floor(n.limite / 2) - (n.multiOggi || 0)); const oggi = Math.min(quota, conConsenso.length); const resto = conConsenso.length - oggi; return { oggi, giorni: resto ? Math.ceil(resto / Math.floor(n.limite / 2)) : 0 }; };
    const c0 = calcola(numeri[0].id);
    R.modale({
      titolo: `Invia WhatsApp a ${conConsenso.length} ${conConsenso.length === 1 ? 'persona' : 'persone'}`,
      sottotitolo: `${esclusi ? `${esclusi} esclusi perché senza consenso WhatsApp. ` : ''}Gli invii a più contatti contano come automatici: rispettano limite, pause e orario di invio. Un messaggio inviato non si può annullare.`,
      proteggi: true,
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo">Messaggio</label><textarea class="campo" name="testo" placeholder="Ciao {nome}, ..."></textarea></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Da quale numero (uno solo per tutto l'invio)</label><select class="campo" name="numero" data-cambia="el-calcola-quota">${numeri.map((n) => `<option value="${n.id}">${R.esc(n.nome)} · ${R.esc(n.telefono)}</option>`).join('')}</select></div>
        <div class="banner giallo" id="quota-invio" style="margin:0">${R.icona('orologio')}<div class="principale">Partono <b>${c0.oggi} oggi</b>${c0.giorni ? `, gli altri nei prossimi ${c0.giorni} ${c0.giorni === 1 ? 'giorno' : 'giorni'}` : ''}. Potrai annullare quelli in attesa.</div></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Invia', classe: 'primario', fai: (fin) => {
          const v = R.valori(fin);
          if (!v.testo) { R.erroreCampo(fin, 'testo', 'Scrivi il messaggio.'); return false; }
          const { oggi } = calcola(v.numero);
          const n = R.datiNumero(v.numero);
          conConsenso.forEach((c, i) => {
            const m = R.inviaMessaggio(c.id, { testo: v.testo.replace('{nome}', c.referente.split(' ')[0]), numero: v.numero, automatico: true, autore: 'Invio a più contatti' });
            if (i >= oggi) { m.stato = 'in coda'; m.nota = 'Invio a più contatti: parte nei prossimi giorni per rispettare il limite del numero.'; }
          });
          n.multiOggi = (n.multiOggi || 0) + oggi;
          R.stato.filtri.contatti.selezionati = [];
          R.salva(); R.aggiorna(); R.avviso(`Invio avviato · ${oggi} oggi, ${conConsenso.length - oggi} in attesa`);
        },
      }],
    });
  };
  R.azioni['el-calcola-quota'] = (el) => {
    const n = R.datiNumero(el.value);
    const lista = selezionati().filter((c) => (c.consensi || {}).whatsapp === 'si');
    const quota = Math.max(0, Math.floor(n.limite / 2) - (n.multiOggi || 0));
    const oggi = Math.min(quota, lista.length);
    const resto = lista.length - oggi;
    const giorni = resto ? Math.ceil(resto / Math.floor(n.limite / 2)) : 0;
    document.getElementById('quota-invio').innerHTML = `${R.icona('orologio')}<div class="principale">Partono <b>${oggi} oggi</b>${giorni ? `, gli altri nei prossimi ${giorni} ${giorni === 1 ? 'giorno' : 'giorni'}` : ''}. Potrai annullare quelli in attesa.</div>`;
  };
  R.azioni['el-multi-email'] = () => {
    if (!R.serveConnessione('l\'invio delle email')) return;
    const lista = selezionati();
    const ok = lista.filter((c) => c.email && (c.consensi || {}).email === 'si');
    R.modale({
      titolo: `Invia email a ${ok.length} ${ok.length === 1 ? 'persona' : 'persone'}`, sottotitolo: `${lista.length - ok.length ? `${lista.length - ok.length} esclusi (senza email o senza consenso). ` : ''}Le risposte arrivano nella storia di ogni contatto.`, proteggi: true,
      corpo: '<div class="gruppo-campo"><label class="etichetta-campo">Oggetto</label><input class="campo" name="oggetto"></div><div class="gruppo-campo"><label class="etichetta-campo">Testo</label><textarea class="campo" name="testo"></textarea></div>',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Invia', classe: 'primario', fai: (fin) => { const v = R.valori(fin); if (!v.oggetto) { R.erroreCampo(fin, 'oggetto', 'Scrivi l\'oggetto.'); return false; } ok.forEach((c) => R.registraStoria(c.id, null, 'email', 'Email: ' + v.oggetto)); R.stato.filtri.contatti.selezionati = []; R.salva(); R.aggiorna(); R.avviso(`Email in invio a ${ok.length} persone`); } }],
    });
  };
  R.azioni['el-multi-etichetta'] = () => R.modale({
    titolo: 'Aggiungi etichetta', classe: 'stretta', corpo: '<div class="gruppo-campo"><label class="etichetta-campo">Etichetta</label><input class="campo" name="etichetta" placeholder="Es. fiera ottobre"></div>',
    pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Aggiungi', classe: 'primario', fai: (fin) => { const v = R.valori(fin); if (!v.etichetta) { R.erroreCampo(fin, 'etichetta', 'Scrivi l\'etichetta.'); return false; } selezionati().forEach((c) => { c.etichette = Array.from(new Set((c.etichette || []).concat([v.etichetta]))); }); const n = selezionati().length; R.stato.filtri.contatti.selezionati = []; R.salva(); R.aggiorna(); R.avviso(`Etichetta aggiunta a ${n} contatti`); } }],
  });
  R.azioni['el-multi-assegna'] = () => {
    const lista = selezionati();
    const persone = R.stato.utenti.filter((u) => u.stato === 'attivo');
    R.modale({
      titolo: `Assegna ${lista.length} ${lista.length === 1 ? 'contatto' : 'contatti'}`, sottotitolo: 'Cambia il responsabile dei contatti e dei loro affari aperti. Il nuovo responsabile riceve un avviso.', classe: 'stretta',
      corpo: `<select class="campo" name="u">${persone.map((u) => `<option value="${u.id}">${R.esc(u.nome)}</option>`).join('')}</select>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Assegna', classe: 'primario', fai: (fin) => { const u = R.valori(fin).u; lista.forEach((c) => { c.responsabile = u; R.affariDelContatto(c.id).filter((a) => a.stato === 'aperto').forEach((a) => (a.responsabile = u)); R.registraStoria(c.id, null, 'modifica', 'Responsabile cambiato in ' + R.utenteDa(u).breve); }); R.notifica(`Ti sono stati assegnati <b>${lista.length} contatti</b>`, '#/contatti', u); R.stato.filtri.contatti.selezionati = []; R.salva(); R.aggiorna(); R.avviso(`${lista.length} contatti assegnati a ${R.esc(R.utenteDa(u).breve)}`); } }],
    });
  };
  R.azioni['el-multi-automazione'] = () => {
    const lista = selezionati();
    const attive = R.stato.automazioni.filter((a) => a.stato === 'attiva');
    R.modale({
      titolo: 'Avvia un\'automazione', sottotitolo: `Per ${lista.length} contatti. Chi è già dentro quell'automazione non entra una seconda volta.`, classe: 'stretta',
      corpo: `<select class="campo" name="au">${attive.map((a) => `<option value="${a.id}">${R.esc(a.nome)}</option>`).join('')}</select>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Avvia', classe: 'primario', fai: (fin) => { const au = R.valori(fin).au; lista.forEach((c) => R.avviaAutomazione(au, { contatto: c.id, perche: 'avviata a mano da ' + R.utente().breve })); R.stato.filtri.contatti.selezionati = []; R.salva(); R.aggiorna(); R.avviso(`Automazione avviata per ${lista.length} contatti`); } }],
    });
  };
  R.azioni['el-multi-esporta'] = () => {
    const n = selezionati().length;
    R.modale({ titolo: 'Esporta', sottotitolo: `${n} contatti in un file Excel. L'esportazione resta nel registro delle azioni.`, classe: 'stretta', corpo: '<div class="riquadro beige">contatti-selezionati.xlsx · nel prototipo il file non viene creato davvero</div>', pulsanti: [{ testo: 'Chiudi', chiudi: true }] });
  };
  R.azioni['el-multi-elimina'] = () => {
    const lista = selezionati();
    R.modale({
      titolo: `Eliminare ${lista.length} ${lista.length === 1 ? 'contatto' : 'contatti'}?`, sottotitolo: `${lista.slice(0, 4).map((c) => R.esc(c.nome)).join(', ')}${lista.length > 4 ? ` e altri ${lista.length - 4}` : ''}. Li trovi nel Cestino per 30 giorni, insieme ai loro affari.`, classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: `Elimina ${lista.length}`, classe: 'rosso', fai: () => { lista.forEach((c) => { const ids = R.affariDelContatto(c.id).map((a) => { a.eliminato = true; return a.id; }); c.eliminato = true; R.stato.cestino.unshift({ id: R.id('ce'), tipo: 'contatto', rif: c.id, affari: ids, nome: c.nome, eliminatoDa: R.utente().id, quando: R.adesso() }); }); R.stato.filtri.contatti.selezionati = []; R.salva(); R.aggiorna(); R.avviso(`${lista.length} contatti nel Cestino`); } }],
    });
  };

  /* ================= ATTIVITÀ ================= */
  R.rotta('/attivita', {
    menu: 'attivita',
    titolo: 'Attività',
    disegna: () => {
      const u = R.utente();
      const f = R.stato.filtri.attivita = Object.assign({ chi: 'mie', tipo: null }, R.stato.filtri.attivita);
      if (f.chi === 'team' && !R.puo('vedeTutti')) f.chi = 'mie';
      const mia = (t) => t.responsabile === u.id || (t.perTuttiGliAmministratori && R.amministratore());
      const base = R.stato.attivita.filter((t) => !t.annullata && !(R.affare(t.affare) || {}).eliminato && (f.chi === 'team' ? R.affareVisibile(R.affare(t.affare) || {}) || mia(t) : mia(t)));
      const conTipo = base.filter((t) => !f.tipo || t.tipo === f.tipo);
      const aperte = conTipo.filter((t) => !t.fatta);
      const ritardo = aperte.filter((t) => R.scaduta(t)).sort((a, b) => new Date(a.quando) - new Date(b.quando));
      const oggi = conTipo.filter((t) => R.diffGiorni(t.quando) === 0 && (!t.fatta || R.diffGiorni(t.fattaAlle) === 0)).sort((a, b) => new Date(a.quando) - new Date(b.quando));
      const domani = aperte.filter((t) => R.diffGiorni(t.quando) === 1).sort((a, b) => new Date(a.quando) - new Date(b.quando));
      const prossimi = aperte.filter((t) => R.diffGiorni(t.quando) > 1).sort((a, b) => new Date(a.quando) - new Date(b.quando));
      const conteggio = (tipo) => base.filter((t) => !t.fatta && t.tipo === tipo && R.diffGiorni(t.quando) <= 0).length;
      const settimana = base.filter((t) => { const d = R.diffGiorni(t.quando); const g = (new Date().getDay() + 6) % 7; return d >= -g && d <= 6 - g; });
      const fatteSett = settimana.filter((t) => t.fatta).length;
      const nOggi = ritardo.length + oggi.length;
      const gruppo = (titolo, lista, classe, vuoto) => `<div class="riquadro"><div class="riga-flex" style="margin-bottom:6px"><h2 class="titolo-riquadro" style="margin:0;${classe === 'ritardo' ? 'color:var(--errore-t)' : ''}">${titolo}</h2>${lista.length ? `<span class="etichetta ${classe === 'ritardo' ? 'errore' : 'pesca'}">${lista.length}</span>` : ''}</div><div class="elenco">${lista.length ? lista.map(rigaAttivita).join('') : `<div class="vuoto">${vuoto}</div>`}</div></div>`;
      return `
        <div class="testata"><div><div class="sopratitolo">Attività da fare</div><h1 class="titolo-pagina">Oggi hai ${nOggi} ${nOggi === 1 ? 'cosa' : 'cose'} da fare,<br>${ritardo.length} ${ritardo.length === 1 ? 'è' : 'sono'} in ritardo.</h1></div>
          <div class="azioni-testata"><button class="btn primario" data-azione="at-nuova">${R.icona('piu')} Nuova attività</button></div></div>
        <div class="riga-flex" style="margin-bottom:18px">
          ${R.puo('vedeTutti') ? `<div class="selettore"><button class="${f.chi === 'mie' ? 'attivo' : ''}" data-azione="at-chi" data-chi="mie">Le mie</button><button class="${f.chi === 'team' ? 'attivo' : ''}" data-azione="at-chi" data-chi="team">Di tutto il team</button></div>` : '<div class="selettore"><button class="attivo">Le mie</button></div>'}
          ${[['tel', 'Chiamate'], ['wa', 'WhatsApp'], ['doc', 'Documenti'], ['app', 'Appuntamenti']].map(([k, t]) => `<button class="pillola ${f.tipo === k ? 'attiva' : ''}" data-azione="at-tipo" data-tipo="${k}">${t} · ${conteggio(k)}</button>`).join('')}
        </div>
        <div class="griglia" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start" id="att-colonne">
          <div class="griglia">
            ${gruppo('In ritardo', ritardo, 'ritardo', 'Niente in ritardo. Bel lavoro.')}
            ${gruppo('Oggi', oggi, 'oggi', 'Per oggi non hai altro. Puoi fissare il prossimo passo ai contatti che aspettano.')}
            ${gruppo('Domani', domani, '', 'Niente per domani.')}
            ${prossimi.length ? gruppo('Prossimi giorni', prossimi, '', '') : ''}
          </div>
          <div class="griglia">
            <div class="riquadro scuro">
              <h2 class="titolo-riquadro">Come ti avvisiamo</h2>
              <div style="opacity:.8;font-size:13px;margin:-6px 0 14px">Quando arriva l'ora di un'attività</div>
              <label class="riga-impostazione"><span>Avviso nel software</span><span class="interruttore"><input type="checkbox" data-cambia="at-avviso" data-k="software" ${u.avvisi.software ? 'checked' : ''}><span></span></span></label>
              <label class="riga-impostazione"><span>WhatsApp sul tuo telefono</span><span class="interruttore"><input type="checkbox" data-cambia="at-avviso" data-k="whatsapp" ${u.avvisi.whatsapp ? 'checked' : ''}><span></span></span></label>
              <label class="riga-impostazione"><span>Email</span><span class="interruttore"><input type="checkbox" data-cambia="at-avviso" data-k="email" ${u.avvisi.email ? 'checked' : ''}><span></span></span></label>
              <div class="riga-impostazione"><span>Quanto prima</span><select data-cambia="at-anticipo" style="background:transparent;border:0;color:var(--lime);font-weight:600">${[5, 15, 30, 60].map((m) => `<option value="${m}" style="color:#000" ${(u.anticipo || 15) === m ? 'selected' : ''}>${m} minuti</option>`).join('')}</select></div>
              <div class="piccolo" style="opacity:.75;margin-top:6px">Su WhatsApp gli avvisi arrivano solo nell'orario di invio dell'azienda; fuori orario restano nel software e arrivano per email.</div>
            </div>
            <div class="riquadro salvia"><h2 class="titolo-riquadro">Questa settimana</h2><div class="numero-medio" style="font-size:44px">${fatteSett} fatte</div><div class="nota">su ${settimana.length} previste${f.chi === 'mie' && fatteSett ? ' · brava ' + R.esc(u.breve) : ''}</div></div>
          </div>
        </div>`;
    },
  });
  R.stile('attivita', '@media (max-width: 900px) { #att-colonne { grid-template-columns: minmax(0,1fr) !important; } }');
  function rigaAttivita(t) {
    const tipo = R.tipiAttivita[t.tipo] || R.tipiAttivita.tel;
    const c = R.contatto(t.contatto) || { nome: '—' };
    const a = R.affare(t.affare) || {};
    const ritardo = !t.fatta && R.scaduta(t);
    const quando = ritardo ? R.giornoRelativo(t.quando) + (R.diffGiorni(t.quando) === -1 ? ' ' + R.ora(t.quando) : '') : R.diffGiorni(t.quando) <= 1 ? R.ora(t.quando) : `${R.giornoRelativo(t.quando)} ${R.ora(t.quando)}`;
    const chiamaOra = !t.fatta && t.tipo === 'tel' && R.diffGiorni(t.quando) === 0;
    return `<div class="riga">
      <button class="cerchio-spunta ${t.fatta ? 'fatto' : ''}" data-azione="ve-fatta" data-id="${t.id}" aria-label="${t.fatta ? 'Riapri' : 'Segna come fatta'}: ${R.esc(t.titolo)}">${t.fatta ? R.icona('spunta', 16) : ''}</button>
      <span class="quadratino ${tipo.colore}">${tipo.sigla}</span>
      <div class="principale"><div class="titolo-riga" style="${t.fatta ? 'text-decoration:line-through;color:var(--testo-2)' : ''}">${R.esc(t.titolo)}${t.ricorrente ? ` <span class="etichetta">ogni ${t.ricorrente}</span>` : ''}</div>
        <div class="sotto">${t.fatta ? `fatta alle ${R.ora(t.fattaAlle)}` : `<a href="#/contatto/${c.id}${a.id ? '?affare=' + a.id : ''}" style="color:var(--verde-2);text-decoration:none">${R.esc(c.nome)}${a.bando ? ' · ' + R.esc(a.bando) : ''}</a>`}${t.perTuttiGliAmministratori ? ' · <span class="etichetta errore">senza responsabile</span>' : ''}${R.stato.filtri.attivita.chi === 'team' && t.responsabile && t.responsabile !== R.utente().id ? ' · ' + R.esc(R.utenteDa(t.responsabile).breve) : ''}</div></div>
      <span class="${ritardo ? 'grassetto' : ''}" style="font-size:13px;${ritardo ? 'color:var(--errore-t)' : t.fatta ? 'color:var(--testo-2)' : ''}">${quando}</span>
      ${t.fatta ? '' : chiamaOra ? `<button class="btn piccolo primario" data-azione="ve-chiama" data-c="${c.id}" data-a="${a.id || ''}">Chiama</button>` : `<button class="btn piccolo secondario-campo" data-azione="at-sposta" data-id="${t.id}">Sposta</button>`}
    </div>`;
  }
  R.azioni['at-chi'] = (el) => { R.stato.filtri.attivita.chi = el.dataset.chi; R.salva(); R.aggiorna(); };
  R.azioni['at-tipo'] = (el) => { const f = R.stato.filtri.attivita; f.tipo = f.tipo === el.dataset.tipo ? null : el.dataset.tipo; R.salva(); R.aggiorna(); };
  R.azioni['at-avviso'] = (el) => { R.utente().avvisi[el.dataset.k] = el.checked; R.salva(); R.avviso('Preferenza salvata'); };
  R.azioni['at-anticipo'] = (el) => { R.utente().anticipo = +el.value; R.salva(); R.avviso(`Ti avvisiamo ${el.value} minuti prima`); };
  R.azioni['at-sposta'] = (el) => {
    R.tendina(el, `<div class="titolo-tendina">Sposta a…</div>${[['ora', 'Tra un\'ora'], ['1', 'Domani'], ['3', 'Tra 3 giorni'], ['lun', 'Lunedì prossimo']].map(([k, t]) => `<button data-azione="at-sposta-a" data-id="${el.dataset.id}" data-k="${k}">${t}</button>`).join('')}<button data-azione="at-sposta-data" data-id="${el.dataset.id}">Scegli data e ora…</button>`);
  };
  function spostaAttivita(t, quando) {
    const prima = t.quando;
    t.quando = quando;
    R.registraStoria(t.contatto, t.affare, 'attivita', `Spostato a ${R.quandoBreve(quando)}: ${t.titolo}`);
    R.salva(); R.aggiorna();
    R.avviso(`Spostata a ${R.quandoBreve(quando)}`, { annulla: () => { t.quando = prima; R.salva(); R.aggiorna(); } });
  }
  R.azioni['at-sposta-a'] = (el) => {
    R.chiudiTendina();
    const t = R.stato.attivita.find((x) => x.id === el.dataset.id);
    const ora = new Date(t.quando);
    const hh = String(ora.getHours()).padStart(2, '0') + ':' + String(ora.getMinutes()).padStart(2, '0');
    let q;
    if (el.dataset.k === 'ora') q = new Date(Date.now() + 3600000).toISOString();
    else if (el.dataset.k === 'lun') { const d = R.oggi(); const g = (8 - d.getDay()) % 7 || 7; q = R.giorniDa(g, hh); }
    else q = R.giorniDa(+el.dataset.k, hh);
    spostaAttivita(t, q);
  };
  R.azioni['at-sposta-data'] = (el) => {
    R.chiudiTendina();
    const t = R.stato.attivita.find((x) => x.id === el.dataset.id);
    R.modale({ titolo: 'Sposta l\'attività', sottotitolo: R.esc(t.titolo), classe: 'stretta', corpo: '<input type="datetime-local" class="campo" name="quando">', pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Sposta', classe: 'primario', fai: (f) => { const v = R.valori(f); if (!v.quando) { R.erroreCampo(f, 'quando', 'Scegli data e ora.'); return false; } spostaAttivita(t, new Date(v.quando).toISOString()); } }] });
  };
  R.azioni['at-nuova'] = () => {
    const affari = R.affariVivi().filter((a) => a.stato === 'aperto' && R.affareVisibile(a)).sort((a, b) => R.contatto(a.contatto).nome.localeCompare(R.contatto(b.contatto).nome));
    const persone = R.stato.utenti.filter((u) => u.stato === 'attivo');
    R.modale({
      titolo: 'Nuova attività', sottotitolo: 'Di solito nasce dalla scheda del cliente; qui puoi crearla per qualsiasi affare.', proteggi: true,
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo">Cosa devi fare</label><input class="campo" name="titolo" placeholder="Es. Richiamare per i documenti"></div>
        <div class="griglia g-2"><div class="gruppo-campo"><label class="etichetta-campo">Tipo</label><select class="campo" name="tipo"><option value="tel">Chiamata</option><option value="wa">WhatsApp</option><option value="doc">Documenti</option><option value="app">Appuntamento</option></select></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Quando</label><input type="datetime-local" class="campo" name="quando"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Cliente e affare</label><select class="campo" name="affare">${affari.map((a) => `<option value="${a.id}">${R.esc(R.contatto(a.contatto).nome)} · ${R.esc(a.nome)}</option>`).join('')}</select></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Si ripete</label><select class="campo" name="ricorrente"><option value="">No</option><option value="giorno">Ogni giorno</option><option value="settimana">Ogni settimana</option><option value="mese">Ogni mese</option></select></div>
        ${R.amministratore() ? `<div class="gruppo-campo"><label class="etichetta-campo">Chi la fa</label><select class="campo" name="responsabile">${persone.map((u) => `<option value="${u.id}" ${u.id === R.utente().id ? 'selected' : ''}>${R.esc(u.nome)}</option>`).join('')}</select></div>` : ''}</div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!v.titolo) { R.erroreCampo(f, 'titolo', 'Scrivi cosa devi fare.'); return false; }
          if (!v.quando) { R.erroreCampo(f, 'quando', 'Scegli data e ora.'); return false; }
          const a = R.affare(v.affare);
          R.stato.attivita.push({ id: R.id('t'), affare: a.id, contatto: a.contatto, tipo: v.tipo, titolo: v.titolo, quando: new Date(v.quando).toISOString(), responsabile: v.responsabile || R.utente().id, fatta: false, fattaAlle: null, annullata: false, ricorrente: v.ricorrente || null });
          R.registraStoria(a.contatto, a.id, 'attivita', `Attività creata: ${v.titolo}`);
          R.salva(); R.aggiorna(); R.avviso('Attività creata');
        },
      }],
    });
  };

  /* ================= CALENDARIO ================= */
  const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  function appuntamentiVisibili() {
    const f = R.stato.filtri.calendario;
    return R.stato.appuntamenti.filter((ap) => !ap.annullato && f.persone[ap.persona] !== false && (ap.persona === R.utente().id || R.puo('vedeTutti') || (R.affare(ap.affare) && R.affareVisibile(R.affare(ap.affare)))));
  }
  function promemoriaDel(giorno) {
    return R.attivitaAperte((t) => t.responsabile === R.utente().id && new Date(t.quando).toDateString() === giorno.toDateString());
  }
  R.rotta('/calendario', {
    menu: 'calendario',
    titolo: 'Calendario',
    disegna: () => {
      const f = R.stato.filtri.calendario = Object.assign({ vista: 'mese', mese: null, giorno: null, persone: {} }, R.stato.filtri.calendario);
      const oggi = R.oggi();
      const base = f.mese ? new Date(f.mese) : new Date(oggi.getFullYear(), oggi.getMonth(), 1);
      const scelto = f.giorno ? new Date(f.giorno) : oggi;
      const titolo = base.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      const aps = appuntamentiVisibili();
      const occupati = R.stato.occupatoGoogle.filter((o) => f.persone[o.persona] !== false && (o.persona === R.utente().id || R.puo('vedeTutti')));
      let corpo = '';
      if (f.vista === 'mese') {
        const primo = new Date(base.getFullYear(), base.getMonth(), 1);
        const inizio = new Date(primo); inizio.setDate(primo.getDate() - ((primo.getDay() + 6) % 7));
        const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        const celle = [];
        for (let d = new Date(inizio); d <= ultimo || d.getDay() !== 1; d.setDate(d.getDate() + 1)) {
          const g = new Date(d);
          const fuori = g.getMonth() !== base.getMonth();
          const delGiorno = aps.filter((ap) => new Date(ap.quando).toDateString() === g.toDateString()).sort((a, b) => new Date(a.quando) - new Date(b.quando));
          const occ = occupati.filter((o) => new Date(o.quando).toDateString() === g.toDateString());
          const prom = promemoriaDel(g).length;
          const isOggi = g.toDateString() === oggi.toDateString();
          const fine = g.getDay() === 0 || g.getDay() === 6;
          celle.push(`<button class="giorno ${fuori ? 'fuori' : ''} ${isOggi ? 'oggi' : ''} ${fine && !isOggi ? 'festivo' : ''} ${g.toDateString() === scelto.toDateString() ? 'scelto' : ''}" data-azione="ca-giorno" data-g="${g.toISOString()}" aria-label="${R.dataLunga(g.toISOString())}: ${delGiorno.length} appuntamenti">
            <span class="num">${g.getDate()}${isOggi ? ' · oggi' : ''}</span>
            ${delGiorno.slice(0, 3).map((ap) => `<span class="evento-cal" style="background:var(--${R.colorePersona(ap.persona)});color:var(--${R.colorePersona(ap.persona)}-t)">${R.ora(ap.quando)} ${R.esc(ap.titolo.split(' ·')[0])}</span>`).join('')}
            ${occ.map((o) => `<span class="evento-cal" style="background:#ECE8E0;color:var(--testo-3)">${R.ora(o.quando)} Occupato</span>`).join('')}
            ${prom ? `<span class="${isOggi ? 'promemoria-cal' : 'piccolo'}" style="${isOggi ? '' : 'color:var(--testo-2)'}">+${prom} promemoria</span>` : ''}
          </button>`);
        }
        corpo = `<div class="riquadro"><div class="mese">${GIORNI.map((g) => `<div class="nome-giorno">${g}</div>`).join('')}${celle.join('')}</div></div>`;
      } else {
        const giorni = [];
        if (f.vista === 'settimana') { const l = new Date(scelto); l.setDate(scelto.getDate() - ((scelto.getDay() + 6) % 7)); for (let i = 0; i < 7; i++) { const g = new Date(l); g.setDate(l.getDate() + i); giorni.push(g); } } else giorni.push(scelto);
        corpo = `<div class="riquadro"><div class="griglia" style="grid-template-columns:repeat(${giorni.length === 1 ? 1 : 'auto-fill'}, minmax(150px,1fr))">${giorni.map((g) => {
          const lista = aps.filter((ap) => new Date(ap.quando).toDateString() === g.toDateString()).sort((a, b) => new Date(a.quando) - new Date(b.quando));
          return `<div><div class="grassetto" style="margin-bottom:8px;${g.toDateString() === oggi.toDateString() ? 'color:var(--verde)' : ''}">${R.maiuscola(R.dataLunga(g.toISOString()))}</div>${lista.length ? lista.map((ap) => `<a href="#/contatto/${ap.contatto}" class="riquadro medio ${R.colorePersona(ap.persona)}" style="display:block;text-decoration:none;margin-bottom:8px"><div class="piccolo">${R.ora(ap.quando)} · ${R.esc(R.utenteDa(ap.persona).breve)}</div><div class="grassetto">${R.esc(ap.titolo)}</div></a>`).join('') : '<div class="piccolo secondario">Nessun appuntamento</div>'}</div>`;
        }).join('')}</div></div>`;
      }
      const delScelto = aps.filter((ap) => new Date(ap.quando).toDateString() === scelto.toDateString()).sort((a, b) => new Date(a.quando) - new Date(b.quando));
      const promScelto = promemoriaDel(scelto);
      const occScelto = occupati.filter((o) => new Date(o.quando).toDateString() === scelto.toDateString());
      const persone = R.stato.utenti.filter((u) => u.stato === 'attivo' && (R.puo('vedeTutti') || u.id === R.utente().id));
      return `
        <div class="testata"><div><h1 class="titolo-pagina">${R.maiuscola(titolo)}</h1><div class="spiegazione">Gli appuntamenti sono colorati per persona; i promemoria degli affari sono in nero.</div></div>
          <div class="azioni-testata">
            <div class="riga-flex" style="gap:6px"><button class="btn tondo" data-azione="ca-mese" data-d="-1" aria-label="Mese precedente">${R.icona('sinistra')}</button><button class="btn piccolo" data-azione="ca-oggi">Oggi</button><button class="btn tondo" data-azione="ca-mese" data-d="1" aria-label="Mese successivo">${R.icona('destra')}</button></div>
            <div class="selettore"><button class="${f.vista === 'giorno' ? 'attivo' : ''}" data-azione="ca-vista" data-v="giorno">Giorno</button><button class="${f.vista === 'settimana' ? 'attivo' : ''}" data-azione="ca-vista" data-v="settimana">Settimana</button><button class="${f.vista === 'mese' ? 'attivo' : ''}" data-azione="ca-vista" data-v="mese">Mese</button></div>
            <button class="btn primario" data-azione="ca-nuovo">${R.icona('piu')} Appuntamento</button>
          </div></div>
        <div class="griglia" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start" id="cal-colonne">
          ${corpo}
          <div class="griglia">
            <div class="riquadro">
              <div class="secondario" style="font-size:13px">Giorno selezionato</div>
              <h2 class="titolo-riquadro" style="font-size:26px;margin-top:4px">${R.maiuscola(R.dataLunga(scelto.toISOString()))}</h2>
              ${delScelto.map((ap) => `<a href="#/contatto/${ap.contatto}" class="riquadro medio ${R.colorePersona(ap.persona)}" style="display:block;text-decoration:none;margin-bottom:10px"><div class="piccolo">${R.ora(ap.quando)} · ${R.esc(R.utenteDa(ap.persona).breve)}</div><div class="grassetto" style="font-size:15px">${R.esc(ap.titolo)}</div></a>`).join('')}
              ${occScelto.map((o) => `<div class="riquadro medio beige" style="margin-bottom:10px"><div class="piccolo">${R.ora(o.quando)} · ${R.esc(R.utenteDa(o.persona).breve)}</div><div class="grassetto">Occupato (Google Calendar)</div></div>`).join('')}
              ${promScelto.map((t) => `<a href="#/contatto/${t.contatto}" class="riquadro medio scuro" style="display:block;text-decoration:none;margin-bottom:10px"><div class="piccolo" style="color:var(--lime)">${R.ora(t.quando)} · promemoria</div><div class="grassetto" style="font-size:15px">${R.esc(t.titolo)}</div></a>`).join('')}
              ${!delScelto.length && !promScelto.length && !occScelto.length ? '<div class="vuoto" style="padding:14px 0">Giornata libera. Puoi fissare un appuntamento.</div>' : ''}
              <button class="btn piccolo secondario-campo" data-azione="ca-nuovo" data-g="${scelto.toISOString()}">${R.icona('piu', 16)} Appuntamento in questo giorno</button>
            </div>
            <div class="riquadro">
              <h2 class="titolo-riquadro">Colori</h2>
              ${persone.map((u) => `<label class="riga" style="min-height:40px;padding:6px 0;cursor:pointer"><input type="checkbox" data-cambia="ca-persona" data-u="${u.id}" ${f.persone[u.id] !== false ? 'checked' : ''} style="accent-color:var(--verde);width:18px;height:18px"><span class="puntino" style="width:12px;height:12px;border-radius:4px;color:${u.colore}"></span><span class="principale">${R.esc(u.breve)}</span></label>`).join('')}
              <div class="riga" style="min-height:40px;padding:6px 0"><span style="width:18px"></span><span class="puntino" style="width:12px;height:12px;border-radius:4px;color:var(--scuro)"></span><span class="principale">Promemoria degli affari</span></div>
              <div class="riga" style="min-height:40px;padding:6px 0"><span style="width:18px"></span><span class="puntino" style="width:12px;height:12px;border-radius:4px;color:#D6D0C4"></span><span class="principale">Occupato (Google Calendar, senza dettagli)</span></div>
            </div>
            <div class="riquadro cielo">
              <h2 class="titolo-riquadro piccolo">Il tuo link di prenotazione</h2>
              <div class="piccolo">I clienti scelgono un orario libero; gli orari occupati su Google Calendar sono esclusi. Conferma e promemoria partono da soli per email e, se c'è il consenso, su WhatsApp.</div>
              <button class="btn piccolo spazio-sopra" data-azione="ca-link">Vedi e imposta</button>
            </div>
          </div>
        </div>`;
    },
  });
  R.stile('calendario', '@media (max-width: 1000px) { #cal-colonne { grid-template-columns: minmax(0,1fr) !important; } }');
  R.azioni['ca-giorno'] = (el) => { R.stato.filtri.calendario.giorno = el.dataset.g; R.salva(); R.aggiorna(); if (window.matchMedia('(max-width: 1000px)').matches) document.querySelector('#cal-colonne > .griglia').scrollIntoView({ behavior: 'smooth' }); };
  R.azioni['ca-vista'] = (el) => { R.stato.filtri.calendario.vista = el.dataset.v; R.salva(); R.aggiorna(); };
  R.azioni['ca-mese'] = (el) => {
    const f = R.stato.filtri.calendario;
    const d = f.mese ? new Date(f.mese) : new Date(R.oggi().getFullYear(), R.oggi().getMonth(), 1);
    if (f.vista === 'mese') d.setMonth(d.getMonth() + +el.dataset.d);
    else { const g = f.giorno ? new Date(f.giorno) : R.oggi(); g.setDate(g.getDate() + (f.vista === 'settimana' ? 7 : 1) * +el.dataset.d); f.giorno = g.toISOString(); d.setTime(new Date(g.getFullYear(), g.getMonth(), 1).getTime()); }
    f.mese = d.toISOString(); R.salva(); R.aggiorna();
  };
  R.azioni['ca-oggi'] = () => { const f = R.stato.filtri.calendario; f.mese = null; f.giorno = null; R.salva(); R.aggiorna(); };
  R.azioni['ca-persona'] = (el) => { R.stato.filtri.calendario.persone[el.dataset.u] = el.checked; R.salva(); R.aggiorna(); };
  R.azioni['ca-nuovo'] = (el) => {
    if (!R.serveConnessione('la creazione di un appuntamento')) return;
    const contatti = R.stato.contatti.filter((c) => !c.eliminato && R.contattoVisibile(c)).sort((a, b) => a.nome.localeCompare(b.nome));
    const g = el.dataset.g ? new Date(el.dataset.g) : R.oggi();
    const pad = (n) => String(n).padStart(2, '0');
    const dataTxt = `${g.getFullYear()}-${pad(g.getMonth() + 1)}-${pad(g.getDate())}`;
    const persone = R.stato.utenti.filter((u) => u.stato === 'attivo');
    R.modale({
      titolo: 'Nuovo appuntamento', sottotitolo: 'Ogni appuntamento è collegato a un cliente. Conferma e promemoria partono da soli.', proteggi: true,
      corpo: `<div class="griglia g-2"><div class="gruppo-campo"><label class="etichetta-campo">Cliente</label><select class="campo" name="contatto">${contatti.map((c) => `<option value="${c.id}">${R.esc(c.nome)}</option>`).join('')}</select></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Titolo</label><input class="campo" name="titolo" placeholder="Es. Consulenza ZES"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Giorno</label><input type="date" class="campo" name="data" value="${dataTxt}"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Ora</label><input type="time" class="campo" name="ora" value="10:00"></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Durata</label><select class="campo" name="durata"><option value="30">30 minuti</option><option value="60" selected>1 ora</option><option value="90">1 ora e mezza</option></select></div>
        <div class="gruppo-campo"><label class="etichetta-campo">Con chi</label>${R.amministratore() ? `<select class="campo" name="persona">${persone.map((u) => `<option value="${u.id}" ${u.id === R.utente().id ? 'selected' : ''}>${R.esc(u.nome)}</option>`).join('')}</select>` : `<input class="campo" disabled value="${R.esc(R.utente().nome)}"><input type="hidden" name="persona" value="${R.utente().id}">`}</div></div>
        <label class="riga-impostazione"><span>Manda conferma e promemoria al cliente (email e WhatsApp se c'è il consenso)</span><span class="interruttore"><input type="checkbox" name="conferma" checked><span></span></span></label><div id="avviso-occupato"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Salva', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          if (!v.titolo) { R.erroreCampo(f, 'titolo', 'Scrivi il titolo.'); return false; }
          if (!v.data || !v.ora) { R.erroreCampo(f, 'data', 'Scegli giorno e ora.'); return false; }
          const quando = new Date(`${v.data}T${v.ora}`);
          const conflitto = R.stato.appuntamenti.concat(R.stato.occupatoGoogle.map((o) => Object.assign({ titolo: 'Occupato' }, o))).find((ap) => !ap.annullato && ap.persona === v.persona && Math.abs(new Date(ap.quando) - quando) < 60 * 60000);
          const box = f.querySelector('#avviso-occupato');
          if (conflitto && !box.dataset.confermato) { box.dataset.confermato = '1'; box.innerHTML = `<div class="banner giallo spazio-sopra">${R.icona('allarme')}<div class="principale"><b>${R.esc(R.utenteDa(v.persona).breve)} è già impegnato</b> alle ${R.ora(conflitto.quando)} (${R.esc(conflitto.titolo)}). Premi di nuovo Salva per confermare lo stesso.</div></div>`; return false; }
          const c = R.contatto(v.contatto);
          const affare = R.affariDelContatto(c.id)[0];
          R.stato.appuntamenti.push({ id: R.id('ap'), contatto: c.id, affare: affare && affare.id, titolo: `${c.nome.split(' ')[0]} · ${v.titolo}`, quando: quando.toISOString(), durata: +v.durata, persona: v.persona });
          R.registraStoria(c.id, affare && affare.id, 'appuntamento', `Appuntamento fissato: ${v.titolo} · ${R.quandoBreve(quando.toISOString())}${v.conferma ? ' · conferma inviata al cliente' : ''}`);
          R.stato.filtri.calendario.giorno = quando.toISOString();
          R.salva(); R.aggiorna(); R.avviso('Appuntamento salvato' + (v.conferma ? ' · conferma inviata al cliente' : ''));
        },
      }],
    });
  };
  R.azioni['ca-link'] = () => R.modale({
    titolo: 'Il tuo link di prenotazione', sottotitolo: 'Puoi metterlo nelle pagine e nei messaggi. Vale per tutte le tue aziende.',
    corpo: `<div class="riga-impostazione"><span>Indirizzo</span><span class="valore">inizioimpresa.rampant.it/prenota/${R.esc(R.utente().breve.toLowerCase())}</span></div>
      <div class="riga-impostazione"><span>Giorni e orari disponibili</span><span class="valore">lun–ven 10–13 e 15–18</span></div>
      <div class="riga-impostazione"><span>Durata</span><span class="valore">45 minuti</span></div>
      <div class="riga-impostazione"><span>Pausa tra due appuntamenti</span><span class="valore">15 minuti</span></div>
      <div class="riga-impostazione"><span>Anticipo minimo</span><span class="valore">4 ore</span></div>
      <p class="piccolo secondario" style="margin:10px 6px 0">Nel prototipo questi valori non si modificano.</p>`,
    pulsanti: [{ testo: 'Chiudi', chiudi: true }, { testo: 'Copia il link', classe: 'primario', fai: () => R.avviso('Link copiato') }],
  });

  /* ================= CESTINO ================= */
  R.rotta('/cestino', {
    menu: 'impostazioni',
    libera: true,
    titolo: 'Cestino',
    disegna: () => {
      const lista = R.stato.cestino.filter((v) => R.amministratore() || v.eliminatoDa === R.utente().id);
      const nomi = { affare: 'Affare', contatto: 'Contatto', pagina: 'Pagina', automazione: 'Automazione', attivita: 'Attività', file: 'File' };
      return `
        <div class="testata"><div><div class="sopratitolo">${R.amministratore() ? 'Tutto ciò che è stato eliminato nell\'azienda' : 'Ciò che hai eliminato tu'}</div><h1 class="titolo-pagina">Cestino</h1><div class="spiegazione">Gli elementi restano qui 30 giorni, poi si cancellano da soli. "Ripristina" li riporta con i loro collegamenti e la loro storia.</div></div></div>
        <div class="riquadro">${lista.length ? `<div class="elenco">${lista.map((v) => `<div class="riga"><span class="quadratino pesca">${R.icona('cestino', 18)}</span><div class="principale"><div class="titolo-riga">${R.esc(v.nome)}</div><div class="sotto">${nomi[v.tipo] || 'Elemento'} · eliminato da ${R.esc(R.utenteDa(v.eliminatoDa).breve)} ${R.giornoRelativo(v.quando)} alle ${R.ora(v.quando)} · si cancella da solo tra ${30 + R.diffGiorni(v.quando)} giorni</div></div>
          <button class="btn piccolo primario" data-azione="ce-ripristina" data-id="${v.id}">Ripristina</button>${R.amministratore() ? `<button class="btn piccolo secondario-campo" data-azione="ce-definitivo" data-id="${v.id}">Elimina per sempre</button>` : ''}</div>`).join('')}</div>` : '<div class="vuoto">Il Cestino è vuoto. Quando elimini qualcosa, lo ritrovi qui per 30 giorni.</div>'}</div>`;
    },
  });
  R.azioni['ce-ripristina'] = (el) => {
    const v = R.ripristina(el.dataset.id);
    if (!v) return;
    R.aggiorna();
    const link = v.tipo === 'affare' ? (() => { const a = R.affare(v.rif); return a ? `#/contatto/${a.contatto}?affare=${a.id}` : null; })() : v.tipo === 'contatto' ? '#/contatto/' + v.rif : null;
    R.avviso(`Ripristinato: ${R.esc(v.nome)}${link ? ` · <a href="${link}" style="color:var(--lime)">Apri</a>` : ''}`);
  };
  R.azioni['ce-definitivo'] = (el) => {
    const v = R.stato.cestino.find((x) => x.id === el.dataset.id);
    R.modale({
      titolo: 'Eliminare per sempre?', sottotitolo: `«${R.esc(v.nome)}» sparirà per sempre, con la sua storia. Non si può annullare.`, classe: 'stretta',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Elimina per sempre', classe: 'rosso', fai: () => {
        if (v.tipo === 'affare') { R.stato.affari = R.stato.affari.filter((a) => a.id !== v.rif); R.stato.attivita = R.stato.attivita.filter((t) => t.affare !== v.rif); }
        if (v.tipo === 'contatto') { R.stato.contatti = R.stato.contatti.filter((c) => c.id !== v.rif); R.stato.affari = R.stato.affari.filter((a) => a.contatto !== v.rif); }
        R.stato.cestino = R.stato.cestino.filter((x) => x.id !== v.id);
        R.salva(); R.aggiorna(); R.avviso('Eliminato per sempre');
      } }],
    });
  };
})();
