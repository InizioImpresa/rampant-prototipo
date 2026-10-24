/* Rampant — prototipo. Vendite: regole comuni su contatti, affari, attività e messaggi,
   finestre condivise (nuovo affare, chiamata, perso/vinto, invio file), Dashboard e Affari a colonne. */
(function () {
  'use strict';
  const R = window.R;

  /* Spesa pubblicitaria del mese per campagna (per il costo per contatto). */
  R.estendiDati((s) => {
    s.spese = { 'Facebook · ZES 2026': 56, 'Facebook · Resto al Sud': 38, 'Google · Microcredito': 40 };
    s.turno = 0;
    s.campiCarte = { etichette: true, valore: true, regione: true, prossima: true };
  });

  /* ---------------- Regole comuni ---------------- */
  const TIPI_ATT = {
    tel: { sigla: 'TEL', testo: 'Chiamata', colore: 'pesca' },
    doc: { sigla: 'DOC', testo: 'Documenti', colore: 'cielo' },
    wa: { sigla: 'WA', testo: 'WhatsApp', colore: 'salvia' },
    app: { sigla: 'APP', testo: 'Appuntamento', colore: 'salvia' },
  };
  R.tipiAttivita = TIPI_ATT;
  const COLORI_PERSONA = { u1: 'lavanda', u2: 'salvia', u3: 'cielo', u4: 'pesca' };
  R.colorePersona = (id) => COLORI_PERSONA[id] || 'salvia';

  R.affariVivi = () => R.stato.affari.filter((a) => !a.eliminato && !(R.contatto(a.contatto) || {}).eliminato);
  R.affariDelContatto = (cId) => R.affariVivi().filter((a) => a.contatto === cId);
  R.attivitaAperte = (filtro) => R.stato.attivita.filter((t) => !t.fatta && !t.annullata && !(R.affare(t.affare) || {}).eliminato && (!filtro || filtro(t)));
  R.prossimaAttivita = (affareId) => R.attivitaAperte((t) => t.affare === affareId).sort((a, b) => new Date(a.quando) - new Date(b.quando))[0] || null;
  R.scaduta = (t) => new Date(t.quando) < new Date() && R.diffGiorni(t.quando) < 0;
  R.maiRichiamato = (a) => a.stato === 'aperto' && (!a.tentativi || a.tentativi.length === 0);
  R.nomeFase = (a) => (R.fase(a.percorso, a.fase) || {}).nome || '—';
  R.registraStoria = (contatto, affare, tipo, testo, autore) => {
    const e = { id: R.id('s'), contatto, affare, tipo, testo, quando: R.adesso(), autore: autore || R.utente().id };
    R.stato.storia.push(e);
    return e;
  };
  R.nomeAutore = (autore) => (!autore ? '' : String(autore).startsWith('Automazione') ? autore : R.utenteDa(autore).breve);
  R.inOrarioDiInvio = (data) => {
    const d = data || new Date();
    const o = R.stato.impostazioni.orario;
    const g = d.getDay() === 0 ? 7 : d.getDay();
    if (!o.giorni.includes(g)) return false;
    const festivo = (o.festivi || []).includes(String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'));
    if (festivo) return false;
    const hm = d.getHours() * 60 + d.getMinutes();
    const [ih, im] = o.inizio.split(':').map(Number);
    const [fh, fm] = o.fine.split(':').map(Number);
    return hm >= ih * 60 + im && hm < fh * 60 + fm;
  };
  /* Prossimo momento in cui si apre l'orario di invio (da adesso). */
  R.prossimaApertura = () => {
    const o = R.stato.impostazioni.orario;
    const [ih, im] = o.inizio.split(':').map(Number);
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const c = new Date(d); c.setDate(d.getDate() + i); c.setHours(ih, im, 0, 0);
      if (c > d && R.inOrarioDiInvio(new Date(c.getTime() + 60000))) return c;
    }
    return d;
  };
  /* Aggiunge ore di lavoro (orario di invio dell'azienda) a una data. */
  R.aggiungiOreLavoro = (ore) => {
    let d = new Date();
    if (!R.inOrarioDiInvio(d)) d = R.prossimaApertura();
    let resta = ore * 60;
    while (resta > 0) {
      const n = new Date(d.getTime() + 60000);
      if (R.inOrarioDiInvio(d)) resta -= 1;
      d = R.inOrarioDiInvio(n) ? n : R.prossimaAperturaDa(n);
    }
    return d;
  };
  R.prossimaAperturaDa = (da) => {
    const o = R.stato.impostazioni.orario;
    const [ih, im] = o.inizio.split(':').map(Number);
    for (let i = 0; i < 14; i++) {
      const c = new Date(da); c.setDate(da.getDate() + i); c.setHours(ih, im, 0, 0);
      if (c >= da && R.inOrarioDiInvio(new Date(c.getTime() + 60000))) return c;
    }
    return da;
  };
  R.numeroDelContatto = (c) => {
    const ultimoRicevuto = R.stato.messaggi.filter((m) => m.contatto === c.id && m.direzione === 'in').sort((a, b) => new Date(b.quando) - new Date(a.quando))[0];
    if (ultimoRicevuto && ultimoRicevuto.numero) return ultimoRicevuto.numero;
    const n = R.stato.numeri.find((x) => x.utente && x.utente === c.responsabile);
    return n ? n.id : (R.stato.numeri.find((x) => x.predefinito) || R.stato.numeri[0]).id;
  };
  R.datiNumero = (id) => R.stato.numeri.find((n) => n.id === id);

  /* ---------------- Invio WhatsApp simulato ---------------- */
  R.inviaMessaggio = (contattoId, o) => {
    o = o || {};
    const c = R.contatto(contattoId);
    const numId = o.numero || R.numeroDelContatto(c);
    const num = R.datiNumero(numId);
    const m = {
      id: R.id('m'), contatto: contattoId, direzione: 'out', testo: o.testo || '', file: o.file || null, quando: R.adesso(),
      autore: o.automatico ? (o.autore || 'auto') : R.utente().id, automatico: !!o.automatico, numero: numId, servizio: 'A', stato: 'in coda', nota: '',
    };
    const fuoriOrario = o.automatico && !R.inOrarioDiInvio();
    if (num.statoA === 'scollegato' || (num.statoA !== 'collegato' && num.statoB !== 'invia')) {
      m.nota = 'Il numero è scollegato da WhatsApp: il messaggio resta in coda e parte quando lo ricolleghi.';
    } else if (fuoriOrario) {
      const ap = R.prossimaApertura();
      m.nota = `Fuori dall'orario di invio: parte ${R.giornoRelativo(ap.toISOString())} alle ${R.ora(ap.toISOString())}.`;
    } else {
      m.servizio = num.statoA === 'collegato' ? 'A' : 'B';
      setTimeout(() => cambiaStatoMessaggio(m.id, 'inviato'), 900);
      setTimeout(() => cambiaStatoMessaggio(m.id, 'consegnato'), 2400);
      if (o.automatico) num.oggi = Math.min(num.limite, num.oggi + 1);
    }
    R.stato.messaggi.push(m);
    R.salva();
    return m;
  };
  function cambiaStatoMessaggio(id, nuovo) {
    const m = R.stato.messaggi.find((x) => x.id === id);
    if (!m) return;
    m.stato = nuovo;
    R.salva();
    if (R.ridisegnaChat) R.ridisegnaChat(m.contatto);
  }

  /* ---------------- Automazioni avviate dalle vendite ---------------- */
  R.avviaAutomazione = (id, o) => {
    const au = R.stato.automazioni.find((x) => x.id === id);
    const c = R.contatto(o.contatto);
    if (!au || !c) return;
    const autore = 'Automazione: ' + au.nome;
    if (au.stato !== 'attiva') {
      R.registraStoria(c.id, o.affare, 'automazione', `L'automazione «${au.nome}» è in pausa: non è partita`, autore);
      R.salva();
      return;
    }
    au.passate = (au.passate || 0) + 1;
    R.registraStoria(c.id, o.affare, 'automazione', `Avviata l'automazione «${au.nome}»${o.perche ? ' · ' + o.perche : ''}`, autore);
    const consenso = (c.consensi || {}).whatsapp;
    const puoWA = consenso === 'si';
    if (Array.isArray(au.passi) && au.passi.length) { eseguiPassi(au, c, o, puoWA, autore); R.salva(); return; }
    if (id === 'au1' || id === 'au2') {
      if (!puoWA) {
        R.registraStoria(c.id, o.affare, 'automazione', 'WhatsApp automatico non inviato: manca il consenso WhatsApp del contatto', autore);
      } else if (id === 'au1') {
        const resp = R.utenteDa(c.responsabile);
        R.inviaMessaggio(c.id, { automatico: true, autore, testo: `Ciao ${c.referente.split(' ')[0]}, sono ${c.responsabile ? resp.breve : 'il team'} di Inizio Impresa. Abbiamo ricevuto la tua richiesta${c.campagna ? ' per ' + c.campagna : ''}: a che ora preferisci essere chiamato?` });
      } else {
        R.inviaMessaggio(c.id, { automatico: true, autore, testo: `Ciao ${c.referente.split(' ')[0]}, ti mando l'elenco dei documenti che servono per la prefattibilità.`, file: { nome: 'Elenco documenti prefattibilità.pdf', peso: '0,3 MB' } });
        R.registraStoria(c.id, o.affare, 'automazione', 'Sollecito automatico fissato tra 3 giorni se i documenti non arrivano', autore);
      }
    }
    R.salva();
  };
  /* Esegue i passaggi iniziali di un'automazione scritta nell'editor (gestione.js) finché non arriva
     un'attesa lunga o una condizione. Nel prototipo le attese di pochi minuti durano pochi secondi. */
  function eseguiPassi(au, c, o, puoWA, autore) {
    const sostituisci = (t) => String(t || '').replace(/\{nome\}/g, c.referente.split(' ')[0]).replace(/\{responsabile\}/g, c.responsabile ? R.utenteDa(c.responsabile).breve : 'il team');
    let ritardo = 0;
    let avvisoConsenso = false;
    for (const p of au.passi) {
      if (p.dopo) { R.registraStoria(c.id, o.affare, 'automazione', `In attesa: «${p.titolo || p.tipo}» tra ${p.dopo.quanto} ${p.dopo.unita}`, autore); break; }
      if (p.tipo === 'aspetta') {
        if (p.unita === 'minuti' && p.quanto <= 10) { ritardo += p.quanto * 1000; continue; }
        R.registraStoria(c.id, o.affare, 'automazione', `In attesa per ${p.quanto} ${p.unita}, poi l'automazione continua`, autore);
        break;
      }
      if (p.tipo === 'se') { R.registraStoria(c.id, o.affare, 'automazione', 'In attesa di sapere se la condizione si verifica', autore); break; }
      if (p.tipo === 'whatsapp') {
        if (!puoWA) { if (!avvisoConsenso) R.registraStoria(c.id, o.affare, 'automazione', 'WhatsApp automatico non inviato: manca il consenso WhatsApp del contatto', autore); avvisoConsenso = true; continue; }
        const l = p.file ? R.stato.libreria.find((x) => x.id === p.file) : null;
        const invia = () => { R.inviaMessaggio(c.id, { automatico: true, autore, testo: sostituisci(p.testo), file: l ? { nome: l.nome, peso: l.peso } : null }); if (R.ridisegnaChat) R.ridisegnaChat(c.id); };
        if (ritardo) setTimeout(invia, ritardo); else invia();
      } else if (p.tipo === 'email') {
        if ((c.consensi || {}).email === 'si' && c.email) R.registraStoria(c.id, o.affare, 'email', `Email automatica: ${sostituisci(p.oggetto || p.titolo)}`, autore);
        else R.registraStoria(c.id, o.affare, 'automazione', 'Email automatica non inviata: manca l\'email o il consenso', autore);
      } else if (p.tipo === 'promemoria') {
        R.stato.attivita.push({ id: R.id('t'), affare: o.affare, contatto: c.id, tipo: 'tel', titolo: p.titolo || 'Promemoria', quando: R.aggiungiOreLavoro(p.entro || 1).toISOString(), responsabile: c.responsabile, fatta: false, fattaAlle: null, annullata: false });
      } else if (p.tipo === 'avvisa') {
        if (c.responsabile) R.notifica(`${R.esc(sostituisci(p.testo || 'Avviso automatico'))} · <b>${R.esc(c.nome)}</b>`, '#/contatto/' + c.id, c.responsabile);
      }
    }
  }

  /* ---------------- Nuovo contatto da un modulo pubblico (percorso 1) ---------------- */
  R.normalizzaTelefono = (t) => {
    let s = String(t || '').replace(/[^\d+]/g, '');
    if (!s) return '';
    if (s.startsWith('00')) s = '+' + s.slice(2);
    if (!s.startsWith('+')) s = R.stato.impostazioni.prefisso + s;
    return s;
  };
  R.formattaTelefono = (t) => {
    const s = R.normalizzaTelefono(t);
    const m = s.match(/^(\+\d{2})(\d{3})(\d{3})(\d+)$/);
    return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : s;
  };
  R.trovaDoppione = (telefono, email) => {
    const t = R.normalizzaTelefono(telefono);
    const vivi = R.stato.contatti.filter((c) => !c.eliminato);
    if (t) {
      const perTel = vivi.find((c) => [c.telefono].concat(c.altriTelefoni || []).some((x) => R.normalizzaTelefono(x) === t));
      if (perTel) return perTel;
    }
    if (email) {
      const e = email.toLowerCase();
      return vivi.find((c) => [c.email].concat(c.altreEmail || []).some((x) => (x || '').toLowerCase() === e)) || null;
    }
    return null;
  };
  R.prossimoDiTurno = () => {
    const candidati = R.stato.utenti.filter((u) => u.ruolo === 'collaboratore' && u.stato === 'attivo' && !u.assenza);
    if (!candidati.length) return null;
    const u = candidati[R.stato.turno % candidati.length];
    R.stato.turno += 1;
    return u.id;
  };
  /* Contatto da un modulo (pagina pubblica, sondaggio o modulo pubblicitario Meta).
     Oltre a nome, telefono, email e consensi accetta l'esito delle regole di qualificazione (regole.js):
     d.fonte ('Landing' | 'Facebook' | 'Instagram'…), d.risposte { domanda: risposta },
     d.azioni { fase: 'p1|f1', responsabile: 'turno'|'nessuno'|'u2', etichette, automazione: 'au1'|'nessuna', promemoria: 'si'|'no' },
     d.regola (testo che spiega quale regola ha deciso). Senza azioni: Finanza agevolata · Nuovo contatto, a turno, benvenuto au1. */
  R.nuovoContattoDaModulo = (d) => {
    const azioni = Object.assign({ fase: 'p1|f1', responsabile: 'turno', etichette: '', automazione: 'au1', promemoria: 'si' }, d.azioni || {});
    if (!azioni.fase) azioni.fase = 'p1|f1';
    if (!azioni.automazione) azioni.automazione = 'au1';
    const [percorsoId, faseId] = azioni.fase.split('|');
    const esistente = R.trovaDoppione(d.telefono, d.email);
    const campagna = d.campagna || '';
    const pagina = d.pagina || '';
    const daMeta = d.fonte && d.fonte !== 'Landing';
    const modulo = daMeta ? `modulo ${d.fonte}${d.moduloMeta ? ' «' + d.moduloMeta + '»' : ''}` : '';
    const origine = daMeta ? 'il ' + modulo : `il modulo della pagina ${pagina || campagna}`;
    const daOrigine = daMeta ? 'dal ' + modulo : `dalla pagina ${pagina || campagna}`;
    const risposteTxt = Object.entries(d.risposte || {}).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ');
    let c = esistente;
    let nuovo = false;
    if (c) {
      const diversi = [];
      if (d.email && c.email && c.email.toLowerCase() !== d.email.toLowerCase()) diversi.push('email ' + d.email);
      if (d.nome && c.referente && c.referente.toLowerCase() !== d.nome.toLowerCase() && c.nome.toLowerCase() !== d.nome.toLowerCase()) diversi.push('nome ' + d.nome);
      if (!c.email && d.email) c.email = d.email;
      if (!c.telefono && d.telefono) c.telefono = R.formattaTelefono(d.telefono);
      R.registraStoria(c.id, null, 'modulo', `Ha compilato di nuovo ${origine}${diversi.length ? ' · dati diversi da quelli salvati: ' + diversi.join(', ') + ' (non sovrascritti)' : ''}`, 'Modulo');
    } else {
      nuovo = true;
      const resp = azioni.responsabile === 'turno' ? R.prossimoDiTurno() : azioni.responsabile === 'nessuno' ? null : azioni.responsabile;
      c = {
        id: R.id('c'), nome: d.nome, referente: d.nome, ruoloReferente: '', telefono: d.telefono ? R.formattaTelefono(d.telefono) : '', altriTelefoni: [], email: d.email || '', altreEmail: [], piva: '', ateco: '', regione: '', dipendenti: '',
        fonte: d.fonte || 'Landing', campagna, pagina, responsabile: resp, creato: R.adesso(), colore: 'salvia', etichette: [], nonLetti: 0,
        consensi: { whatsapp: d.consensoWhatsapp ? 'si' : 'non-registrato', email: d.consensoEmail ? 'si' : 'non-registrato' },
      };
      c.numeroUsato = (R.stato.numeri.find((x) => x.utente && x.utente === resp) || R.stato.numeri.find((x) => x.predefinito) || R.stato.numeri[0]).id;
      R.stato.contatti.push(c);
      R.registraStoria(c.id, null, 'modulo', `Arrivato ${daOrigine}`, 'Modulo');
    }
    if (risposteTxt) { c.risposte = Object.assign({}, c.risposte, d.risposte); R.registraStoria(c.id, null, 'modulo', 'Risposte: ' + risposteTxt, 'Modulo'); }
    if (azioni.etichette) c.etichette = Array.from(new Set((c.etichette || []).concat(azioni.etichette.split(',').map((x) => x.trim()).filter(Boolean))));
    if (d.regola) R.registraStoria(c.id, null, 'modulo', d.regola, 'Regole di qualificazione');
    let affare = R.affariDelContatto(c.id).find((a) => a.percorso === percorsoId && a.stato === 'aperto');
    if (affare) {
      if (affare.responsabile) R.notifica(`<b>${R.esc(c.nome)}</b> ha compilato di nuovo il modulo: ha già un affare aperto`, '#/contatto/' + c.id, affare.responsabile);
    } else {
      const fase = R.fase(percorsoId, faseId) || R.percorso(percorsoId).fasi[0];
      affare = { id: R.id('d'), contatto: c.id, percorso: percorsoId, fase: fase.id, nome: (campagna || 'Nuova richiesta') + ' · da modulo', bando: campagna, valore: null, responsabile: c.responsabile, seguaci: [], creato: R.adesso(), stato: fase.tipo === 'perso' ? 'perso' : fase.tipo === 'vinto' ? 'vinto' : 'aperto', documenti: [], tentativi: [], faseCambiata: R.adesso() };
      R.stato.affari.push(affare);
      if (affare.stato === 'aperto' && azioni.promemoria !== 'no') {
        const quando = R.aggiungiOreLavoro(1).toISOString();
        R.stato.attivita.push({ id: R.id('t'), affare: affare.id, contatto: c.id, tipo: 'tel', titolo: 'Richiamare entro 1 ora di lavoro', quando, responsabile: c.responsabile, fatta: false, fattaAlle: null, annullata: false, perTuttiGliAmministratori: !c.responsabile });
      }
      const nomeFase = R.percorso(percorsoId).nome + ' · ' + fase.nome;
      if (c.responsabile) R.notifica(`Nuovo contatto: <b>${R.esc(c.nome)}</b> ${R.esc(daOrigine)} · ${R.esc(nomeFase)}`, '#/contatto/' + c.id, c.responsabile);
      if (!c.responsabile) R.notifica(`Nuovo contatto senza responsabile: <b>${R.esc(c.nome)}</b> · ${R.esc(nomeFase)}`, '#/contatto/' + c.id, 'u1');
      else R.notifica(`Nuovo contatto: <b>${R.esc(c.nome)}</b> ${R.esc(daOrigine)} · ${R.esc(nomeFase)}`, '#/contatto/' + c.id, 'u1');
      if (azioni.automazione !== 'nessuna' && affare.stato === 'aperto') R.avviaAutomazione(azioni.automazione, { contatto: c.id, affare: affare.id, perche: d.fonte && d.fonte !== 'Landing' ? 'contatto da ' + d.fonte : 'modulo compilato' });
    }
    R.salva();
    return { contatto: c, affare, nuovo, azioni };
  };

  /* ---------------- Spostare un affare di fase ---------------- */
  R.spostaAffare = (affareId, faseId) => {
    const a = R.affare(affareId);
    if (!a || a.fase === faseId) return;
    const fase = R.fase(a.percorso, faseId);
    if (fase.tipo === 'perso') return R.finestraChiusura(a.id, 'perso');
    if (fase.tipo === 'vinto') return R.finestraChiusura(a.id, 'vinto');
    const au = fase.automazione && R.stato.automazioni.find((x) => x.id === fase.automazione && x.stato === 'attiva');
    if (au) {
      R.modale({
        titolo: 'Spostando qui partirà un\'automazione',
        sottotitolo: `In «${R.esc(fase.nome)}» parte da sola l'automazione «${R.esc(au.nome)}» per ${R.esc(R.contatto(a.contatto).nome)}.`,
        classe: 'stretta',
        pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Sposta e fai partire', classe: 'primario', fai: () => { eseguiSpostamento(a, faseId, au); } }],
      });
      return;
    }
    eseguiSpostamento(a, faseId, null);
  };
  function eseguiSpostamento(a, faseId, au) {
    const prima = a.fase;
    const faseVecchia = R.fase(a.percorso, prima);
    a.fase = faseId;
    a.faseCambiata = R.adesso();
    const ev = R.registraStoria(a.contatto, a.id, 'fase', `Fase: ${faseVecchia.nome} → ${R.nomeFase(a)}`);
    R.salva();
    R.aggiorna();
    R.avviso(`Affare spostato in ${R.esc(R.nomeFase(a))}`, {
      annulla: () => {
        a.fase = prima;
        R.stato.storia = R.stato.storia.filter((x) => x.id !== ev.id);
        R.salva(); R.aggiorna();
        R.avviso('Spostamento annullato');
      },
      alScadere: () => {
        if (au) { R.avviaAutomazione(au.id, { contatto: a.contatto, affare: a.id, perche: 'affare spostato in ' + R.nomeFase(a) }); (a.automazioniAvviate = a.automazioniAvviate || []).push(au.id); R.salva(); if (R.posizione().percorso.includes(a.contatto)) R.aggiorna(); }
        if (faseVecchia.automazione && (a.automazioniAvviate || []).includes(faseVecchia.automazione)) {
          const vecchia = R.stato.automazioni.find((x) => x.id === faseVecchia.automazione);
          R.modale({
            titolo: 'Fermare l\'automazione per questo contatto?',
            sottotitolo: `La fase «${R.esc(faseVecchia.nome)}» aveva avviato «${R.esc(vecchia.nome)}». Vuoi fermarla per ${R.esc(R.contatto(a.contatto).nome)}?`,
            classe: 'stretta',
            pulsanti: [{ testo: 'Lascia continuare', chiudi: true }, { testo: 'Fermala', classe: 'primario', fai: () => { a.automazioniAvviate = a.automazioniAvviate.filter((x) => x !== vecchia.id); R.registraStoria(a.contatto, a.id, 'automazione', `Automazione «${vecchia.nome}» fermata per questo contatto`); R.salva(); R.avviso('Automazione fermata per questo contatto'); } }],
          });
        }
      },
    });
  }

  /* Finestra unica per Perso e Vinto (percorso 6) */
  R.finestraChiusura = (affareId, tipo) => {
    const a = R.affare(affareId);
    const c = R.contatto(a.contatto);
    const fase = tipo === 'perso' ? R.fasePersa(a.percorso) : R.faseVinta(a.percorso);
    const aperte = R.attivitaAperte((t) => t.affare === a.id);
    const motivi = tipo === 'perso' ? `<div class="etichetta-campo">Perché è perso? (puoi saltare)</div>${R.stato.motiviPerdita.map((m, i) => `<label class="opzione"><input type="radio" name="motivo" value="${R.esc(m)}" ${i === 0 ? '' : ''} style="accent-color:var(--verde)"> <span class="principale">${R.esc(m)}</span></label>`).join('')}` : '';
    R.modale({
      titolo: tipo === 'perso' ? 'Segna come perso' : `Segna come «${R.esc(fase.nome)}»`,
      sottotitolo: `${R.esc(c.nome)} · ${R.esc(a.nome)}`,
      corpo: `${motivi}
        <div class="gruppo-campo spazio-sopra"><label class="etichetta-campo">Nota (facoltativa)</label><textarea class="campo" name="nota" placeholder="${tipo === 'perso' ? 'Es. ha preferito aspettare il prossimo bando' : 'Es. firmato in sede, proforma pagata'}"></textarea></div>
        ${aperte.length ? `<label class="riga-impostazione"><span>Chiudi le ${aperte.length} attività aperte di questo affare</span><span class="interruttore"><input type="checkbox" name="chiudiAttivita" checked><span></span></span></label><div class="piccolo secondario" style="margin:0 8px 8px">Le attività chiuse così risultano "annullate" e non contano come fatte.</div>` : ''}
        <div class="piccolo secondario" style="margin:8px">Le automazioni impostate per fermarsi quando l'affare è ${tipo === 'perso' ? 'perso' : 'vinto'} si fermano per questo affare. Potrai riaprirlo in qualsiasi momento.</div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }].concat(tipo === 'perso' ? [{ testo: 'Salta', fai: (f) => chiudiAffare(a, tipo, Object.assign(R.valori(f), { motivo: '' })) }] : []).concat([{ testo: tipo === 'perso' ? 'Segna come perso' : 'Conferma', classe: 'primario', fai: (f) => chiudiAffare(a, tipo, R.valori(f)) }]),
    });
  };
  function chiudiAffare(a, tipo, v) {
    const prima = { fase: a.fase, stato: a.stato, motivo: a.motivoPerdita };
    const fase = tipo === 'perso' ? R.fasePersa(a.percorso) : R.faseVinta(a.percorso);
    a.ultimaFaseAperta = a.fase;
    a.fase = fase.id;
    a.stato = tipo;
    a.faseCambiata = R.adesso();
    if (tipo === 'perso') { a.motivoPerdita = v.motivo || ''; a.persoIl = R.adesso(); } else a.vintoIl = R.adesso();
    const chiuse = [];
    if (v.chiudiAttivita) R.attivitaAperte((t) => t.affare === a.id).forEach((t) => { t.annullata = true; chiuse.push(t.id); });
    const testo = tipo === 'perso' ? `Affare perso${a.motivoPerdita ? ' · motivo: ' + a.motivoPerdita : ' · motivo non indicato'}${v.nota ? ' · ' + v.nota : ''}` : `Fase: ${R.fase(a.percorso, prima.fase).nome} → ${fase.nome}${v.nota ? ' · ' + v.nota : ''}`;
    const ev = R.registraStoria(a.contatto, a.id, 'fase', testo);
    if (v.nota) R.registraStoria(a.contatto, a.id, 'nota', v.nota);
    R.salva();
    R.aggiorna();
    R.avviso(tipo === 'perso' ? 'Affare segnato come perso' : `Affare in «${R.esc(fase.nome)}»`, {
      annulla: () => {
        a.fase = prima.fase; a.stato = prima.stato; a.motivoPerdita = prima.motivo;
        R.stato.attivita.forEach((t) => { if (chiuse.includes(t.id)) t.annullata = false; });
        R.stato.storia = R.stato.storia.filter((x) => x.id !== ev.id);
        R.salva(); R.aggiorna(); R.avviso('Annullato');
      },
    });
  }
  R.riapriAffare = (affareId) => {
    const a = R.affare(affareId);
    const annullate = R.stato.attivita.filter((t) => t.affare === a.id && t.annullata);
    const fase = R.fase(a.percorso, a.ultimaFaseAperta) || R.percorso(a.percorso).fasi[0];
    R.modale({
      titolo: 'Riaprire l\'affare?',
      sottotitolo: `Torna nella fase «${R.esc(fase.nome)}».`,
      classe: 'stretta',
      corpo: annullate.length ? `<div class="etichetta-campo">Quali attività vuoi riaprire?</div>${annullate.map((t) => `<label class="riga-impostazione"><span>${R.esc(t.titolo)} · ${R.quandoBreve(t.quando)}</span><span class="interruttore"><input type="checkbox" name="t_${t.id}" checked><span></span></span></label>`).join('')}` : '<p class="secondario">Non ci sono attività da riaprire.</p>',
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Riapri', classe: 'primario', fai: (f) => {
          const v = R.valori(f);
          annullate.forEach((t) => { if (v['t_' + t.id]) t.annullata = false; });
          a.fase = fase.id; a.stato = 'aperto'; a.faseCambiata = R.adesso();
          R.registraStoria(a.contatto, a.id, 'fase', `Affare riaperto in «${fase.nome}»`);
          R.salva(); R.aggiorna(); R.avviso('Affare riaperto');
        },
      }],
    });
  };

  /* ---------------- Eliminare e ripristinare ---------------- */
  R.eliminaAffare = (affareId, dopo) => {
    const a = R.affare(affareId);
    const c = R.contatto(a.contatto);
    if (!R.puo('eliminare')) { R.avviso('Non hai il permesso di eliminare affari: chiedilo a un amministratore'); return; }
    a.eliminato = true;
    const voce = { id: R.id('ce'), tipo: 'affare', rif: a.id, nome: `${c.nome} · ${a.nome}`, eliminatoDa: R.utente().id, quando: R.adesso() };
    R.stato.cestino.unshift(voce);
    R.salva();
    if (dopo) dopo(); else R.aggiorna();
    R.avviso('Affare eliminato · lo trovi nel Cestino per 30 giorni', {
      annulla: () => { a.eliminato = false; R.stato.cestino = R.stato.cestino.filter((x) => x.id !== voce.id); R.salva(); R.aggiorna(); R.avviso('Affare ripristinato'); },
    });
  };
  R.ripristina = (voceId) => {
    const v = R.stato.cestino.find((x) => x.id === voceId);
    if (!v) return;
    if (v.tipo === 'affare') { const a = R.affare(v.rif); if (a) a.eliminato = false; }
    if (v.tipo === 'contatto') {
      const c = R.contatto(v.rif);
      if (c) {
        const doppione = R.stato.contatti.find((x) => x.id !== c.id && !x.eliminato && R.normalizzaTelefono(x.telefono) === R.normalizzaTelefono(c.telefono));
        c.eliminato = false;
        (v.affari || []).forEach((id) => { const a = R.affare(id); if (a) a.eliminato = false; });
        if (doppione) R.notifica(`Ripristinato <b>${R.esc(c.nome)}</b>: esiste già <b>${R.esc(doppione.nome)}</b> con lo stesso telefono. Valuta "Unisci".`, '#/contatto/' + c.id, R.utente().id);
      }
    }
    R.stato.cestino = R.stato.cestino.filter((x) => x.id !== voceId);
    R.salva();
    return v;
  };

  /* ---------------- Attività fatte ---------------- */
  R.segnaFatta = (attivitaId) => {
    const t = R.stato.attivita.find((x) => x.id === attivitaId);
    if (!t) return;
    const prima = { fatta: t.fatta, fattaAlle: t.fattaAlle };
    t.fatta = !t.fatta;
    t.fattaAlle = t.fatta ? R.adesso() : null;
    R.registraStoria(t.contatto, t.affare, 'attivita', `${t.fatta ? 'Fatto' : 'Riaperto'}: ${t.titolo}`);
    if (t.fatta && t.ricorrente) {
      const prossima = new Date(t.quando);
      if (t.ricorrente === 'giorno') prossima.setDate(prossima.getDate() + 1);
      if (t.ricorrente === 'settimana') prossima.setDate(prossima.getDate() + 7);
      if (t.ricorrente === 'mese') prossima.setMonth(prossima.getMonth() + 1);
      R.stato.attivita.push(Object.assign({}, t, { id: R.id('t'), quando: prossima.toISOString(), fatta: false, fattaAlle: null }));
    }
    if (R.stato.offline) R.stato.inAttesa.push({ descrizione: 'attività ' + t.titolo });
    R.salva();
    R.aggiorna();
    if (t.fatta) R.avviso(`Fatto: ${R.esc(t.titolo)}${R.stato.offline ? ' · in attesa della connessione' : ''}`, { annulla: () => { t.fatta = prima.fatta; t.fattaAlle = prima.fattaAlle; R.salva(); R.aggiorna(); } });
    else R.avviso('Attività riaperta');
  };

  /* ---------------- Finestra: nuovo affare / nuovo contatto ---------------- */
  R.finestraNuovoAffare = (o) => {
    o = o || {};
    if (!R.serveConnessione('la creazione di un affare')) return;
    const visibili = R.stato.contatti.filter((c) => !c.eliminato && R.contattoVisibile(c)).sort((a, b) => a.nome.localeCompare(b.nome));
    const percorsoId = o.percorso || (R.stato.filtri.affari || {}).percorso || 'p1';
    const fasi = R.percorso(percorsoId).fasi.filter((f) => !f.tipo);
    const utenti = R.stato.utenti.filter((u) => u.stato === 'attivo');
    R.modale({
      titolo: 'Nuovo affare',
      sottotitolo: 'Per un contatto nuovo bastano il nome e il telefono oppure l\'email.',
      proteggi: true,
      corpo: `<div class="gruppo-campo"><label class="etichetta-campo">Contatto</label>
          <select class="campo" name="contatto" data-cambia="ve-scelta-contatto"><option value="">Nuovo contatto</option>${visibili.map((c) => `<option value="${c.id}" ${o.contatto === c.id ? 'selected' : ''}>${R.esc(c.nome)} · ${R.esc(c.referente)}</option>`).join('')}</select></div>
        <div id="campi-nuovo-contatto" ${o.contatto ? 'hidden' : ''}>
          <div class="griglia g-2"><div class="gruppo-campo"><label class="etichetta-campo">Nome della persona o dell'azienda</label><input class="campo" name="nome" placeholder="Es. Bianchi srl"></div>
          <div class="gruppo-campo"><label class="etichetta-campo">Referente</label><input class="campo" name="referente" placeholder="Es. Mario Bianchi"></div>
          <div class="gruppo-campo"><label class="etichetta-campo">Telefono</label><input class="campo" name="telefono" inputmode="tel" placeholder="+39 333 123 4567"></div>
          <div class="gruppo-campo"><label class="etichetta-campo">Email</label><input class="campo" name="email" inputmode="email" placeholder="nome@azienda.it"></div></div>
        </div>
        <div class="griglia g-2">
          <div class="gruppo-campo"><label class="etichetta-campo">Percorso e fase</label><select class="campo" name="fase">${fasi.map((f) => `<option value="${percorsoId}|${f.id}" ${o.fase === f.id ? 'selected' : ''}>${R.esc(R.percorso(percorsoId).nome)} · ${R.esc(f.nome)}</option>`).join('')}</select></div>
          <div class="gruppo-campo"><label class="etichetta-campo">Interesse o bando</label><input class="campo" name="bando" placeholder="Es. ZES 2026"></div>
          <div class="gruppo-campo"><label class="etichetta-campo">Valore (facoltativo)</label><input class="campo" name="valore" inputmode="numeric" placeholder="Es. 250000"></div>
          <div class="gruppo-campo"><label class="etichetta-campo">Responsabile</label>${R.amministratore() ? `<select class="campo" name="responsabile">${utenti.map((u) => `<option value="${u.id}" ${u.id === R.utente().id ? 'selected' : ''}>${R.esc(u.nome)}</option>`).join('')}</select>` : `<input class="campo" value="${R.esc(R.utente().nome)}" disabled><input type="hidden" name="responsabile" value="${R.utente().id}">`}</div>
        </div><div id="avviso-doppione"></div>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Crea affare', classe: 'primario', fai: (f) => creaAffareDaFinestra(f) }],
    });
  };
  R.azioni['ve-scelta-contatto'] = (el) => { document.getElementById('campi-nuovo-contatto').hidden = !!el.value; };
  function creaAffareDaFinestra(f) {
    const v = R.valori(f);
    let c;
    if (v.contatto) c = R.contatto(v.contatto);
    else {
      if (!v.nome) { R.erroreCampo(f, 'nome', 'Scrivi il nome della persona o dell\'azienda.'); return false; }
      if (!v.telefono && !v.email) { R.erroreCampo(f, 'telefono', 'Serve il telefono oppure l\'email.'); return false; }
      if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) { R.erroreCampo(f, 'email', 'Controlla l\'email: manca qualcosa (es. nome@azienda.it).'); return false; }
      const dop = R.trovaDoppione(v.telefono, v.email);
      if (dop) {
        const box = f.querySelector('#avviso-doppione');
        if (R.contattoVisibile(dop)) box.innerHTML = `<div class="banner giallo">${R.icona('allarme')}<div class="principale"><b>Questo contatto esiste già:</b> ${R.esc(dop.nome)} (${R.esc(dop.telefono)}). Sceglilo dall'elenco "Contatto" invece di crearne un altro.</div><button class="btn piccolo" data-azione="vai" data-dove="#/contatto/${dop.id}">Apri la scheda</button></div>`;
        else { box.innerHTML = `<div class="banner giallo">${R.icona('allarme')}<div class="principale"><b>Questo contatto è già seguito da un collega:</b> lo abbiamo avvisato.</div></div>`; R.notifica(`${R.esc(R.utente().breve)} ha provato a creare un contatto che segui già: <b>${R.esc(dop.nome)}</b>`, '#/contatto/' + dop.id, dop.responsabile); }
        return false;
      }
      c = { id: R.id('c'), nome: v.nome, referente: v.referente || v.nome, ruoloReferente: '', telefono: v.telefono ? R.formattaTelefono(v.telefono) : '', altriTelefoni: [], email: v.email, altreEmail: [], piva: '', ateco: '', regione: '', dipendenti: '', fonte: 'Inserito a mano', campagna: '', pagina: '', responsabile: v.responsabile || null, creato: R.adesso(), colore: 'salvia', etichette: [], nonLetti: 0, consensi: { whatsapp: 'non-registrato', email: 'non-registrato' } };
      R.stato.contatti.push(c);
      R.registraStoria(c.id, null, 'modifica', 'Contatto creato a mano');
    }
    const [percorso, fase] = v.fase.split('|');
    const a = { id: R.id('d'), contatto: c.id, percorso, fase, nome: (v.bando || 'Nuovo affare'), bando: v.bando, valore: v.valore ? Number(v.valore.replace(/\D/g, '')) : null, responsabile: v.responsabile || R.utente().id, seguaci: [], creato: R.adesso(), stato: 'aperto', documenti: [], tentativi: [], faseCambiata: R.adesso() };
    R.stato.affari.push(a);
    if (!c.responsabile) c.responsabile = a.responsabile;
    R.registraStoria(c.id, a.id, 'fase', `Affare creato in «${R.fase(percorso, fase).nome}»`);
    R.salva();
    R.chiudiModale(true);
    R.vai(`#/contatto/${c.id}?affare=${a.id}`);
    R.avviso('Affare creato');
    return false;
  }

  /* ---------------- Chiamata e prossimo passo (percorso 3) ---------------- */
  R.chiama = (contattoId, affareId) => {
    const c = R.contatto(contattoId);
    const a = affareId ? R.affare(affareId) : R.affariDelContatto(c.id).find((x) => x.stato === 'aperto');
    const telefono = R.esc(c.telefono || '—');
    /* Il tentativo si registra subito: se chiudi senza rispondere vale come "esito non indicato". */
    const quando = R.adesso();
    R.affariDelContatto(c.id).filter((x) => x.stato === 'aperto' && (R.amministratore() || x.responsabile === R.utente().id || (x.seguaci || []).includes(R.utente().id))).forEach((x) => (x.tentativi = (x.tentativi || []).concat([quando])));
    const ev = R.registraStoria(c.id, a && a.id, 'chiamata', 'Chiamata · esito non indicato');
    R.salva();
    const telefonoReale = window.matchMedia('(max-width: 767px)').matches;
    R.modale({
      titolo: 'Com\'è andata?',
      sottotitolo: telefonoReale ? `Sul telefono si apre la chiamata a ${R.esc(c.referente)}. Quando hai finito, scegli com'è andata.` : `Componi questo numero dal tuo telefono, poi scegli com'è andata.`,
      classe: 'stretta',
      senzaFuoco: true,
      corpo: `${telefonoReale ? '' : `<div class="riquadro beige" style="text-align:center;margin-bottom:14px"><div class="secondario">${R.esc(c.referente)} · ${R.esc(c.nome)}</div><div class="numero-medio" style="font-size:34px">${telefono}</div></div>`}
        <button class="opzione" data-azione="ve-esito" data-esito="ha risposto" data-ev="${ev.id}" data-c="${c.id}" data-a="${a ? a.id : ''}"><span class="quadratino salvia">${R.icona('spunta')}</span><span class="principale">Ha risposto</span></button>
        <button class="opzione" data-azione="ve-esito" data-esito="non risponde" data-ev="${ev.id}" data-c="${c.id}" data-a="${a ? a.id : ''}"><span class="quadratino pesca">${R.icona('telefono')}</span><span class="principale">Non risponde</span></button>
        <button class="opzione" data-azione="ve-esito" data-esito="numero errato" data-ev="${ev.id}" data-c="${c.id}" data-a="${a ? a.id : ''}"><span class="quadratino" style="background:var(--errore);color:var(--errore-t)">${R.icona('x')}</span><span class="principale">Numero errato</span></button>
        <p class="piccolo secondario" style="margin:10px 6px 0">La chiamata è già segnata nella storia. Se chiudi senza scegliere, resta "esito non indicato".</p>`,
      alChiudere: () => R.aggiorna(),
    });
  };
  R.azioni['ve-esito'] = (el) => {
    const e = R.stato.storia.find((x) => x.id === el.dataset.ev);
    if (e) e.testo = 'Chiamata · ' + el.dataset.esito;
    R.salva();
    R.prossimoPasso(el.dataset.c, el.dataset.a, `Chiamata · ${el.dataset.esito}`);
  };
  /* Finestra "Prossimo passo": domani, tra 3 giorni, data a scelta o sposta di fase. */
  R.prossimoPasso = (contattoId, affareId, titolo) => {
    const a = affareId ? R.affare(affareId) : null;
    const fasi = a ? R.percorso(a.percorso).fasi.filter((f) => f.id !== a.fase) : [];
    const oraTxt = oraSensata();
    R.modale({
      titolo: 'Prossimo passo',
      sottotitolo: R.esc(titolo || '') + ' · ' + R.esc(R.contatto(contattoId).nome),
      classe: 'stretta',
      senzaFuoco: true,
      corpo: `<button class="opzione" data-azione="ve-passo" data-giorni="1" data-c="${contattoId}" data-a="${affareId || ''}"><span class="principale">Richiamare domani<span class="sotto">${R.dataLunga(lavorativoDa(1, oraTxt))} alle ${oraTxt}</span></span>${R.icona('destra')}</button>
        <button class="opzione" data-azione="ve-passo" data-giorni="3" data-c="${contattoId}" data-a="${affareId || ''}"><span class="principale">Richiamare tra 3 giorni<span class="sotto">${R.dataLunga(lavorativoDa(3, oraTxt))} alle ${oraTxt}</span></span>${R.icona('destra')}</button>
        <div class="opzione" style="flex-wrap:wrap"><span class="principale">Data a scelta</span><input type="datetime-local" class="campo su-beige" name="data" style="max-width:230px"><button class="btn piccolo primario" data-azione="ve-passo-data" data-c="${contattoId}" data-a="${affareId || ''}">Fissa</button></div>
        ${a ? `<div class="opzione" style="flex-wrap:wrap"><span class="principale">Sposta di fase</span><select class="campo su-beige" name="fase" style="max-width:230px">${fasi.map((f) => `<option value="${f.id}">${R.esc(f.nome)}</option>`).join('')}</select><button class="btn piccolo" data-azione="ve-passo-fase" data-a="${a.id}">Sposta</button></div>` : ''}`,
      pulsanti: [{ testo: 'Nessun prossimo passo', chiudi: true }],
      alChiudere: () => R.aggiorna(),
    });
  };
  /* Ora proposta per i promemoria: quella attuale (arrotondata) se è dentro l'orario di lavoro, altrimenti l'apertura. */
  function oraSensata() {
    const o = R.stato.impostazioni.orario;
    const ora = new Date();
    const hm = ora.getHours() * 60 + ora.getMinutes();
    const [ih, im] = o.inizio.split(':').map(Number);
    const [fh, fm] = o.fine.split(':').map(Number);
    if (hm < ih * 60 + im || hm >= fh * 60 + fm - 30) return o.inizio;
    const h = ora.getMinutes() < 30 ? ora.getHours() : ora.getHours() + 1;
    return String(h).padStart(2, '0') + ':' + (ora.getMinutes() < 30 ? '30' : '00');
  }
  function lavorativoDa(giorni, ora) {
    const d = new Date(R.giorniDa(giorni, ora));
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  function creaPromemoria(contattoId, affareId, quando, titolo) {
    const c = R.contatto(contattoId);
    R.stato.attivita.push({ id: R.id('t'), affare: affareId || (R.affariDelContatto(contattoId)[0] || {}).id, contatto: contattoId, tipo: 'tel', titolo: titolo || `Richiamare ${c.referente.split(' ')[0]}`, quando, responsabile: R.utente().id, fatta: false, fattaAlle: null, annullata: false });
    R.registraStoria(contattoId, affareId, 'attivita', `Promemoria fissato: ${R.quandoBreve(quando)}`);
    R.salva();
  }
  R.creaPromemoria = creaPromemoria;
  R.azioni['ve-passo'] = (el) => {
    const quando = lavorativoDa(+el.dataset.giorni, oraSensata());
    creaPromemoria(el.dataset.c, el.dataset.a, quando);
    R.chiudiModale(true);
    R.aggiorna();
    R.avviso(`Promemoria fissato: ${R.quandoBreve(quando)}`);
  };
  R.azioni['ve-passo-data'] = (el) => {
    const inp = el.parentElement.querySelector('input');
    if (!inp.value) { inp.classList.add('con-errore'); inp.focus(); return; }
    const quando = new Date(inp.value).toISOString();
    creaPromemoria(el.dataset.c, el.dataset.a, quando);
    R.chiudiModale(true);
    R.aggiorna();
    R.avviso(`Promemoria fissato: ${R.quandoBreve(quando)}`);
  };
  R.azioni['ve-passo-fase'] = (el) => {
    const sel = el.parentElement.querySelector('select');
    R.chiudiModale(true);
    R.spostaAffare(el.dataset.a, sel.value);
  };

  /* ---------------- Invio di un file dalla libreria (percorso 4) ---------------- */
  R.finestraInviaFile = (contattoId) => {
    const c = R.contatto(contattoId);
    const num = R.datiNumero(R.numeroDelContatto(c));
    R.modale({
      titolo: 'Invia un file',
      sottotitolo: `Scegli dalla libreria dell'azienda. Partirà su WhatsApp a ${R.esc(c.referente)}.`,
      corpo: `<div id="scelta-file">${R.stato.libreria.map((l, i) => `<label class="opzione ${i === 0 ? 'scelta' : ''}" data-azione="ve-scegli-file" data-id="${l.id}"><span class="quadratino" style="background:#fff;color:var(--errore-t);font-weight:700">PDF</span><span class="principale">${R.esc(l.nome)}<span class="sotto">${R.esc(l.cartella)} · ${R.esc(l.peso)}</span></span><input type="radio" name="file" value="${l.id}" ${i === 0 ? 'checked' : ''} hidden></label>`).join('')}</div>
        <div class="riquadro beige spazio-sopra">
          <div class="riga-flex"><span class="secondario">A</span><b>${R.esc(c.referente)} · ${R.esc(c.telefono)}</b></div>
          <div class="riga-flex" style="margin-top:6px"><span class="secondario">Dal numero</span><b>${R.esc(num.nome)} (${R.esc(num.telefono)})</b> <span class="etichetta salvia">${R.esc(R.statoNumero ? R.statoNumero(num.id) : 'A collegato · B pronto')}</span></div>
          <div class="gruppo-campo spazio-sopra" style="margin-bottom:0"><label class="etichetta-campo">Messaggio (facoltativo)</label><input class="campo su-beige" name="testo" placeholder="Es. Ecco la brochure di cui parlavamo"></div>
        </div>
        <p class="piccolo secondario" style="margin:10px 6px 0">Un messaggio inviato non si può annullare.</p>`,
      senzaFuoco: true,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, {
        testo: 'Invia', classe: 'primario', fai: (f) => {
          if (!R.serveConnessione('l\'invio')) return false;
          const v = R.valori(f);
          const l = R.stato.libreria.find((x) => x.id === v.file);
          if (!R.controllaConsensoWA(c)) return false;
          R.inviaMessaggio(c.id, { testo: v.testo, file: { nome: l.nome, peso: l.peso } });
          R.registraStoria(c.id, null, 'wa', `WhatsApp: inviato il file ${l.nome}`);
          dopoMessaggioAMano(c);
          R.salva();
          R.aggiorna();
          R.avviso(`${R.esc(l.nome)} in invio a ${R.esc(c.referente)}`);
        },
      }],
    });
  };
  R.azioni['ve-scegli-file'] = (el) => {
    el.parentElement.querySelectorAll('.opzione').forEach((o) => o.classList.remove('scelta'));
    el.classList.add('scelta');
    el.querySelector('input').checked = true;
  };
  /* Consenso WhatsApp per i messaggi scritti a mano (capitolo 13 e 9.14). */
  R.controllaConsensoWA = (c) => {
    const s = (c.consensi || {}).whatsapp;
    if (s === 'no') { R.avviso(`${R.esc(c.referente)} ha detto no ai messaggi WhatsApp: non puoi scrivergli`); return false; }
    if (s === 'non-disturbare') {
      const ultimoIn = R.stato.messaggi.filter((m) => m.contatto === c.id && m.direzione === 'in').sort((a, b) => new Date(b.quando) - new Date(a.quando))[0];
      if (!ultimoIn || new Date(ultimoIn.quando) < new Date(c.stopIl || 0)) { R.avviso(`${R.esc(c.referente)} ha chiesto di non essere disturbato: puoi rispondere solo se ti riscrive`); return false; }
    }
    return true;
  };
  /* Dopo un messaggio scritto a mano: conta come tentativo e, se manca, propone il prossimo passo. */
  function dopoMessaggioAMano(c) {
    const quando = R.adesso();
    R.affariDelContatto(c.id).filter((x) => x.stato === 'aperto').forEach((x) => (x.tentativi = (x.tentativi || []).concat([quando])));
    c.nonLetti = 0;
  }
  R.dopoMessaggioAMano = dopoMessaggioAMano;

  /* ---------------- Elementi grafici comuni ---------------- */
  R.avatar = (uId, dim) => {
    const u = R.utenteDa(uId);
    return `<span class="avatar ${dim === 'grande' ? 'grande' : ''}" style="background:${u.colore}" title="${R.esc(u.nome)}">${R.esc(u.iniziali)}</span>`;
  };
  R.pillolaProssima = (a, conAvatar) => {
    const t = R.prossimaAttivita(a.id);
    if (a.stato !== 'aperto') return '';
    if (!t) {
      if (R.maiRichiamato(a)) { const g = Math.max(0, -R.diffGiorni(a.creato)); return `<div class="prossima manca"><span>Mai richiamato · ${g === 0 ? 'arrivato oggi' : g + (g === 1 ? ' giorno' : ' giorni')}</span>${conAvatar && a.responsabile ? R.avatar(a.responsabile) : ''}</div>`; }
      return `<div class="prossima manca"><span>Nessun prossimo passo</span>${conAvatar && a.responsabile ? R.avatar(a.responsabile) : ''}</div>`;
    }
    const scad = R.scaduta(t) || (new Date(t.quando) < new Date() && R.diffGiorni(t.quando) === 0 && false);
    const classe = R.scaduta(t) ? 'scaduta' : R.diffGiorni(t.quando) === 0 ? 'oggi' : '';
    const quando = R.scaduta(t) ? `Scaduto ${R.giornoRelativo(t.quando)}` : `${R.maiuscola(R.giornoRelativo(t.quando))} ${R.ora(t.quando)}`;
    return `<div class="prossima ${classe}"><span>${quando} · ${R.esc(t.titolo.toLowerCase())}</span>${conAvatar && t.responsabile ? R.avatar(t.responsabile) : ''}</div>`;
  };

  /* ================= DASHBOARD ================= */
  R.rotta('/dashboard', {
    menu: 'dashboard',
    titolo: 'Dashboard',
    disegna: (p, q) => {
      const u = R.utente();
      const filtro = R.stato.filtri.dashboard || { periodo: 'mese', percorso: 'p1' };
      const percorso = R.percorso(filtro.percorso);
      const mieiAffari = R.affariVivi().filter((a) => a.percorso === percorso.id && (R.puo('vedeTutti') || R.affareVisibile(a)));
      const ora = new Date().getHours();
      const saluto = ora < 13 ? 'Buongiorno' : ora < 18 ? 'Buon pomeriggio' : 'Buonasera';
      const oggi = R.oggi();
      const collaboratore = !R.puo('vedeTutti');
      // Nuovi contatti di oggi (per il collaboratore: nuovi affari assegnati a lui)
      const nuoviOggi = collaboratore
        ? R.affariVivi().filter((a) => a.responsabile === u.id && new Date(a.creato) >= oggi).length
        : R.stato.contatti.filter((c) => !c.eliminato && new Date(c.creato) >= oggi).length;
      // Periodo
      const inizio = new Date(oggi);
      if (filtro.periodo === 'mese') inizio.setDate(1); else inizio.setDate(oggi.getDate() - ((oggi.getDay() + 6) % 7));
      const inizioPrec = new Date(inizio);
      if (filtro.periodo === 'mese') inizioPrec.setMonth(inizio.getMonth() - 1); else inizioPrec.setDate(inizio.getDate() - 7);
      const contattiDi = (da, a) => (collaboratore
        ? R.affariVivi().filter((x) => x.responsabile === u.id && new Date(x.creato) >= da && new Date(x.creato) < a).length
        : R.stato.contatti.filter((c) => !c.eliminato && new Date(c.creato) >= da && new Date(c.creato) < a).length);
      const domani = new Date(oggi); domani.setDate(oggi.getDate() + 1);
      const nPeriodo = contattiDi(inizio, domani);
      const nPrec = contattiDi(inizioPrec, inizio);
      const diff = nPrec ? Math.round(((nPeriodo - nPrec) / nPrec) * 100) : null;
      const barre = [];
      for (let i = 7; i >= 0; i--) {
        const da = new Date(oggi); da.setDate(oggi.getDate() - i * 7 - 6);
        const a = new Date(oggi); a.setDate(oggi.getDate() - i * 7 + 1);
        barre.push(contattiDi(da, a));
      }
      const max = Math.max(1, ...barre);
      const vinta = R.faseVinta(percorso.id);
      const vinti = mieiAffari.filter((a) => a.stato === 'vinto' && a.vintoIl && new Date(a.vintoIl) >= inizio).length;
      const creati = mieiAffari.filter((a) => new Date(a.creato) >= inizio).length;
      const perc = creati ? ((vinti / creati) * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 }) : '0';
      const mai = mieiAffari.filter((a) => R.maiRichiamato(a)).length;
      const nomeMese = (d) => d.toLocaleDateString('it-IT', { month: 'long' });
      const etPeriodo = filtro.periodo === 'mese' ? `Contatti di ${nomeMese(oggi)}` : 'Contatti di questa settimana';
      const etPrec = filtro.periodo === 'mese' ? `su ${nomeMese(inizioPrec)}` : 'sulla settimana scorsa';
      // Da dove arrivano
      const fonti = {};
      R.stato.contatti.filter((c) => !c.eliminato && new Date(c.creato) >= inizio && R.contattoVisibile(c)).forEach((c) => {
        const k = c.campagna ? `${c.fonte === 'Landing' ? 'Landing' : c.fonte} · ${c.campagna}` : c.fonte;
        fonti[k] = (fonti[k] || 0) + 1;
      });
      const coloriFonti = ['salvia', 'cielo', 'lavanda', 'beige'];
      const elencoFonti = Object.entries(fonti).sort((a, b) => b[1] - a[1]).slice(0, 4);
      // Avanzamento nelle fasi
      const fasiAperte = percorso.fasi.filter((f) => !f.tipo);
      // Oggi
      const oggiTxt = R.attivitaAperte((t) => R.diffGiorni(t.quando) === 0 && (t.responsabile === u.id || (t.perTuttiGliAmministratori && R.amministratore())))
        .map((t) => ({ quando: t.quando, titolo: t.titolo, sotto: (R.contatto(t.contatto) || {}).nome, link: '#/contatto/' + t.contatto }))
        .concat(R.stato.appuntamenti.filter((ap) => R.diffGiorni(ap.quando) === 0 && ap.persona === u.id && new Date(ap.quando) > new Date()).map((ap) => ({ quando: ap.quando, titolo: ap.titolo, sotto: 'Appuntamento', link: '#/contatto/' + ap.contatto })))
        .sort((a, b) => new Date(a.quando) - new Date(b.quando));
      const scaduti = R.attivitaAperte((t) => R.scaduta(t) && t.responsabile === u.id).length;
      const senzaResp = R.amministratore() ? R.stato.contatti.filter((c) => !c.eliminato && !c.responsabile).length : 0;
      const nomeVinti = vinta.plurale || vinta.nome;
      return `
        <div class="testata">
          <div><div class="sopratitolo">${R.maiuscola(R.dataLunga(R.adesso()))}</div>
          <h1 class="titolo-pagina">${saluto} ${R.esc(u.breve)},<br>oggi hai <a href="#/contatti?filtro=oggi" style="color:inherit;text-decoration-thickness:3px;text-underline-offset:6px">${nuoviOggi} ${nuoviOggi === 1 ? 'nuovo contatto' : 'nuovi contatti'}</a>.</h1>
          <div class="spiegazione">Qui vedi a colpo d'occhio come vanno i contatti e cosa devi fare oggi.</div></div>
          <div class="azioni-testata">
            <div class="selettore" role="group" aria-label="Periodo"><button class="${filtro.periodo === 'settimana' ? 'attivo' : ''}" data-azione="ve-dash-filtro" data-periodo="settimana">Settimana</button><button class="${filtro.periodo === 'mese' ? 'attivo' : ''}" data-azione="ve-dash-filtro" data-periodo="mese">Mese</button></div>
            ${R.stato.percorsi.length > 1 ? `<select class="campo" style="width:auto;background-color:#fff;min-height:44px" data-cambia="ve-dash-percorso">${R.stato.percorsi.map((x) => `<option value="${x.id}" ${x.id === percorso.id ? 'selected' : ''}>${R.esc(x.nome)}</option>`).join('')}</select>` : ''}
            <button class="btn primario" data-azione="ve-nuovo-affare">${R.icona('piu')} Nuovo affare</button>
          </div>
        </div>
        ${R.bannerWhatsApp ? R.bannerWhatsApp() : ''}
        ${R.bannerMeta ? R.bannerMeta() : ''}
        ${senzaResp ? `<div class="banner giallo">${R.icona('persona')}<div class="principale"><b>${senzaResp} ${senzaResp === 1 ? 'contatto è' : 'contatti sono'} senza responsabile.</b> Li vedono solo gli amministratori finché non li assegni.</div><button class="btn piccolo" data-azione="vai" data-dove="#/contatti?filtro=senza">Assegna</button></div>` : ''}
        <div class="griglia" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)" id="dash-r1">
          <div class="riquadro verde" style="min-height:270px">
            <div class="intestazione-riquadro" style="margin:0"><span class="etichetta-numero">${etPeriodo}</span>${diff != null ? `<span class="etichetta" style="background:var(--verde-2);color:#fff">${diff >= 0 ? '+' : ''}${diff}% ${etPrec}</span>` : ''}</div>
            <div class="numero-grande">${nPeriodo}</div>
            <div class="barre" aria-label="Contatti delle ultime 8 settimane">${barre.map((b, i) => `<span class="${i === 7 ? 'ultima' : ''}" style="height:${Math.max(12, (b / max) * 100)}%" title="${b} contatti"></span>`).join('')}</div>
          </div>
          <div class="riquadro" style="display:flex;flex-direction:column;justify-content:space-between;min-height:270px">
            <span class="etichetta-numero secondario">${R.esc(nomeVinti)}</span>
            <div class="numero-grande">${vinti}</div>
            <span class="nota" style="color:var(--verde)">${perc}% degli affari creati</span>
          </div>
          <div class="riquadro pesca" style="display:flex;flex-direction:column;justify-content:space-between;min-height:270px">
            <span class="etichetta-numero">Mai richiamati</span>
            <div class="numero-grande">${mai}</div>
            <button class="link" style="text-align:left" data-azione="vai" data-dove="#/affari?filtro=mai">Chiamali ora</button>
          </div>
        </div>
        <div class="griglia spazio-sopra" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr)" id="dash-r2">
          <div class="riquadro">
            <div class="intestazione-riquadro"><h2 class="titolo-riquadro">Da dove arrivano</h2><span class="riga-flex"><span class="piccolo secondario">tutti i percorsi</span><a class="link verde" href="#/report">Vedi tutto</a></span></div>
            <div class="griglia g-2">${elencoFonti.length ? elencoFonti.map(([k, n], i) => {
              const spesa = R.stato.spese[k];
              return `<div class="riquadro medio ${coloriFonti[i]}" style="padding:16px 18px"><div style="font-size:13px">${R.esc(k)}</div><div class="numero-medio">${n}</div><div class="piccolo">${spesa ? (spesa / n).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) + ' a contatto' : k.startsWith('Landing') ? 'dal sito' : 'senza spesa pubblicitaria'}</div></div>`;
            }).join('') : '<div class="vuoto">Nessun contatto in questo periodo. Quando arrivano, qui vedi da dove.</div>'}</div>
          </div>
          <div class="riquadro">
            <h2 class="titolo-riquadro">Percorso</h2>
            <div class="elenco">${fasiAperte.map((f) => { const n = mieiAffari.filter((a) => a.fase === f.id).length; return `<a class="riga" style="text-decoration:none;min-height:46px;padding:10px 0" href="#/affari?percorso=${percorso.id}"><span class="principale">${R.esc(f.nome)}</span><b>${n}</b></a>`; }).join('')}
            <a class="riga" style="text-decoration:none;min-height:46px;padding:10px 0" href="#/affari?percorso=${percorso.id}"><span class="principale">${R.esc(vinta.nome)}</span><b>${mieiAffari.filter((a) => a.stato === 'vinto').length}</b></a></div>
          </div>
          <div class="riquadro scuro">
            <h2 class="titolo-riquadro">Oggi</h2>
            ${oggiTxt.length ? oggiTxt.slice(0, 3).map((x) => `<a href="${x.link}" class="riquadro medio" style="display:block;background:var(--scuro-2);text-decoration:none;margin-bottom:10px"><div style="color:var(--lime);font-size:12.5px">${R.ora(x.quando)}</div><div class="grassetto">${R.esc(x.titolo)}</div><div class="piccolo" style="opacity:.75">${R.esc(x.sotto || '')}</div></a>`).join('') : '<p style="opacity:.8">Per oggi non hai altro in programma. Ottimo momento per richiamare chi aspetta.</p>'}
            ${oggiTxt.length > 3 ? `<a class="link" href="#/attivita" style="color:var(--scuro-t)">Altre ${oggiTxt.length - 3} cose da fare</a><br>` : ''}
            ${scaduti ? `<a class="link" href="#/attivita" style="color:var(--pesca)">${scaduti} ${scaduti === 1 ? 'promemoria scaduto' : 'promemoria scaduti'}</a>` : ''}
          </div>
        </div>`;
    },
  });
  R.stile('dashboard', '@media (max-width: 1000px) { #dash-r1, #dash-r2 { grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important; } #dash-r1 > :first-child, #dash-r2 > :first-child { grid-column: 1 / -1; } } @media (max-width: 767px) { #dash-r1, #dash-r2 { grid-template-columns: minmax(0,1fr) !important; } #dash-r1 > div { min-height: 0 !important; } }');
  R.azioni['ve-dash-filtro'] = (el) => { R.stato.filtri.dashboard = Object.assign({ percorso: 'p1' }, R.stato.filtri.dashboard, { periodo: el.dataset.periodo }); R.salva(); R.aggiorna(); };
  R.azioni['ve-dash-percorso'] = (el) => { R.stato.filtri.dashboard = Object.assign({ periodo: 'mese' }, R.stato.filtri.dashboard, { percorso: el.value }); R.salva(); R.aggiorna(); };
  R.azioni['ve-nuovo-affare'] = (el) => R.finestraNuovoAffare({ fase: el.dataset.fase, percorso: el.dataset.percorso });

  /* ================= AFFARI A COLONNE ================= */
  R.rotta('/affari', {
    menu: 'affari',
    titolo: 'Affari',
    disegna: (p, q) => {
      const f = R.stato.filtri.affari = Object.assign({ percorso: 'p1', vista: 'colonne', soloMiei: false, senzaPasso: false }, R.stato.filtri.affari);
      if (q.percorso) f.percorso = q.percorso;
      const mai = q.filtro === 'mai';
      const percorso = R.percorso(f.percorso);
      let affari = R.affariVivi().filter((a) => a.percorso === percorso.id && R.affareVisibile(a));
      if (f.soloMiei) affari = affari.filter((a) => a.responsabile === R.utente().id);
      if (f.senzaPasso) affari = affari.filter((a) => a.stato === 'aperto' && !R.prossimaAttivita(a.id));
      if (mai) affari = affari.filter((a) => R.maiRichiamato(a));
      const aperti = R.affariVivi().filter((a) => a.percorso === percorso.id && R.affareVisibile(a) && a.stato === 'aperto').length;
      const filtriAttivi = [f.soloMiei && 'solo i miei', f.senzaPasso && 'senza prossimo passo'].filter(Boolean);
      const intestazione = `
        <div class="testata" style="margin-bottom:14px"><div><h1 class="titolo-pagina">Affari</h1><div class="spiegazione">Ogni colonna è una fase: sposta gli affari trascinandoli oppure con "Sposta in…".</div></div></div>
        <div class="riga-flex" style="justify-content:space-between;margin-bottom:18px">
          <div class="riga-flex">
            <button class="btn" data-azione="ve-scegli-percorso">${R.esc(percorso.nome)} · ${aperti} aperti ${R.icona('giu', 14)}</button>
            <div class="selettore"><button class="${f.vista === 'colonne' ? 'attivo' : ''}" data-azione="ve-vista" data-vista="colonne">Colonne</button><button class="${f.vista === 'elenco' ? 'attivo' : ''}" data-azione="ve-vista" data-vista="elenco">Elenco</button><a href="#/attivita">Attività</a><a href="#/calendario">Calendario</a></div>
          </div>
          <div class="riga-flex">
            <button class="btn" data-azione="ve-filtri-affari">${R.icona('filtro', 16)} Filtri${filtriAttivi.length ? ' · ' + filtriAttivi.join(', ') : ''}</button>
            <button class="btn nascondi-telefono" data-azione="ve-personalizza">Personalizza colonne e campi</button>
            <button class="btn primario" data-azione="ve-nuovo-affare" data-percorso="${percorso.id}">${R.icona('piu')} Nuovo affare</button>
          </div>
        </div>
        ${mai ? `<div class="banner giallo"><div class="principale"><b>Stai vedendo solo i ${affari.length} affari mai richiamati.</b> Tocca il numero nella scheda per chiamare.</div><a class="btn piccolo" href="#/affari">Togli il filtro</a></div>` : ''}`;
      if (f.vista === 'elenco') return intestazione + elencoAffari(affari);
      const campi = R.stato.campiCarte;
      const colonne = percorso.fasi.map((fase) => {
        const qui = affari.filter((a) => a.fase === fase.id).sort((a, b) => new Date(b.faseCambiata || b.creato) - new Date(a.faseCambiata || a.creato));
        const totale = qui.reduce((s, a) => s + (a.valore || 0), 0);
        const mostrati = fase.tipo ? qui.slice(0, 6) : qui;
        return `<section class="colonna ${fase.colore}" data-fase="${fase.id}" aria-label="${R.esc(fase.nome)}">
          <div class="testata-colonna"><div><h3>${R.esc(fase.nome)}</h3><div class="totale">${totale ? R.milioni(totale) + (fase.id === percorso.fasi[0].id ? ' di investimenti' : '') : 'nessun valore'}</div></div><span class="conto">${qui.length}</span></div>
          ${mostrati.map((a) => cartaAffare(a, campi)).join('')}
          ${qui.length > mostrati.length ? `<div class="piccolo" style="padding:4px 8px 10px">e altri ${qui.length - mostrati.length} · <button class="link" data-azione="ve-vista" data-vista="elenco">vedi in elenco</button></div>` : ''}
          ${!qui.length && !fase.tipo ? `<div class="piccolo" style="padding:4px 8px 12px;opacity:.85">Nessun affare in questa fase. Aggiungi un affare rapido.</div>` : ''}
          ${fase.tipo ? '' : `<div class="zona-rapido"><button class="affare-rapido" data-azione="ve-affare-rapido" data-fase="${fase.id}">+ Affare rapido</button></div>`}
        </section>`;
      }).join('');
      return intestazione + `<div class="colonne" id="colonne">${colonne}</div>`;
    },
    dopo: () => attivaTrascinamento(),
  });

  function cartaAffare(a, campi) {
    const c = R.contatto(a.contatto);
    const t = R.prossimaAttivita(a.id);
    const fonte = c.fonte === 'Landing' ? 'Landing' : c.fonte;
    return `<article class="scheda-affare" draggable="true" data-affare="${a.id}" data-azione="ve-apri-affare" data-c="${c.id}" tabindex="0">
      <div class="riga-flex" style="justify-content:space-between;align-items:flex-start;flex-wrap:nowrap"><div style="min-width:0"><div class="nome">${R.esc(c.nome)}</div><div class="referente">${R.esc(c.referente)}</div></div>${c.nonLetti ? `<span class="etichetta whatsapp">${c.nonLetti} WhatsApp</span>` : ''}</div>
      ${campi.etichette ? `<div class="riga-flex" style="gap:6px;margin-top:8px">${a.bando ? `<span class="etichetta salvia">${R.esc(a.bando)}</span>` : ''}<span class="etichetta">${R.esc(fonte)}</span>${!a.responsabile ? '<span class="etichetta errore">senza responsabile</span>' : ''}</div>` : ''}
      ${campi.valore || campi.regione ? `<div class="dettagli">${[campi.valore ? R.euro(a.valore) : '', campi.regione ? R.esc(c.regione) : ''].filter((x) => x && x !== '—').join(' · ') || 'Valore da definire'}</div>` : ''}
      ${a.documenti && a.documenti.length && a.fase !== 'f1' ? `<div class="dettagli">Documenti ${a.documenti.filter((d) => d.ricevuto).length} di ${a.documenti.length}</div><div class="barra-avanzamento"><span style="width:${(a.documenti.filter((d) => d.ricevuto).length / a.documenti.length) * 100}%"></span></div>` : ''}
      ${campi.prossima ? R.pillolaProssima(a, true) : ''}
      ${a.stato === 'perso' && a.motivoPerdita ? `<div class="dettagli">Motivo: ${R.esc(a.motivoPerdita)}</div>` : ''}
      ${a.stato === 'aperto' ? `<div class="azioni-scheda">
        <button data-azione="ve-chiama" data-c="${c.id}" data-a="${a.id}" aria-label="Chiama ${R.esc(c.referente)}">${R.icona('telefono', 14)} Chiama</button>
        <button data-azione="ve-wa-rapido" data-c="${c.id}" aria-label="WhatsApp a ${R.esc(c.referente)}">${R.icona('whatsapp', 14)} WhatsApp</button>
        ${t ? `<button data-azione="ve-fatta" data-id="${t.id}" aria-label="Segna fatta: ${R.esc(t.titolo)}">${R.icona('spunta', 14)} Fatto</button>` : ''}
        <button data-azione="ve-sposta-menu" data-a="${a.id}" aria-label="Sposta in un'altra fase">${R.icona('freccia', 14)} Sposta</button>
      </div>` : ''}
    </article>`;
  }

  function elencoAffari(affari) {
    if (!affari.length) return '<div class="riquadro vuoto">Nessun affare con questi filtri. Togli un filtro oppure crea un nuovo affare.</div>';
    const righe = affari.sort((a, b) => new Date(b.creato) - new Date(a.creato)).map((a) => {
      const c = R.contatto(a.contatto);
      const t = R.prossimaAttivita(a.id);
      return `<tr data-azione="ve-apri-affare" data-c="${c.id}" data-affare="${a.id}">
        <td><div class="riga-flex" style="flex-wrap:nowrap"><span class="quadratino ${c.colore}" style="width:34px;height:34px">${R.iniziali(c.nome)}</span><div><div class="grassetto">${R.esc(c.nome)}</div><div class="piccolo secondario">${R.esc(a.nome)}</div></div></div></td>
        <td>${R.esc(R.nomeFase(a))}</td><td>${R.euro(a.valore)}</td><td>${a.responsabile ? R.esc(R.utenteDa(a.responsabile).breve) : '<span class="etichetta errore">nessuno</span>'}</td>
        <td>${t ? `<span class="${R.scaduta(t) ? 'grassetto' : ''}" style="${R.scaduta(t) ? 'color:var(--errore-t)' : ''}">${R.quandoBreve(t.quando)}</span> · ${R.esc(t.titolo)}` : a.stato === 'aperto' ? '<span style="color:var(--errore-t)">Nessun prossimo passo</span>' : '—'}</td>
        <td class="secondario">${R.dataBreve(a.creato)}</td>
        <td><button class="btn mini" data-azione="ve-sposta-menu" data-a="${a.id}">Sposta in…</button></td></tr>`;
    }).join('');
    return `<div class="riquadro"><div class="contenitore-tabella"><table class="tabella"><thead><tr><th>Affare</th><th>Fase</th><th>Valore</th><th>Responsabile</th><th>Prossima attività</th><th>Creato</th><th></th></tr></thead><tbody>${righe}</tbody></table></div></div>`;
  }

  /* Trascinamento delle schede tra le colonne (sul computer). Sul telefono si usa "Sposta in…". */
  function attivaTrascinamento() {
    const box = document.getElementById('colonne');
    if (!box) return;
    let trascinato = null;
    box.addEventListener('dragstart', (ev) => {
      const carta = ev.target.closest('.scheda-affare');
      if (!carta) return;
      trascinato = carta.dataset.affare;
      carta.classList.add('trascinata');
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', trascinato);
    });
    box.addEventListener('dragend', (ev) => { const carta = ev.target.closest('.scheda-affare'); if (carta) carta.classList.remove('trascinata'); box.querySelectorAll('.colonna.sopra').forEach((c) => c.classList.remove('sopra')); });
    box.addEventListener('dragover', (ev) => {
      const col = ev.target.closest('.colonna');
      if (!col || !trascinato) return;
      ev.preventDefault();
      box.querySelectorAll('.colonna.sopra').forEach((c) => c !== col && c.classList.remove('sopra'));
      col.classList.add('sopra');
    });
    box.addEventListener('drop', (ev) => {
      const col = ev.target.closest('.colonna');
      if (!col || !trascinato) return;
      ev.preventDefault();
      col.classList.remove('sopra');
      const id = trascinato;
      trascinato = null;
      R.spostaAffare(id, col.dataset.fase);
    });
  }

  R.azioni['ve-apri-affare'] = (el, ev) => {
    if (ev.target.closest('button') && ev.target.closest('button') !== el) return;
    R.vai(`#/contatto/${el.dataset.c}?affare=${el.dataset.affare}`);
  };
  R.azioni['ve-chiama'] = (el) => R.chiama(el.dataset.c, el.dataset.a);
  R.azioni['ve-wa-rapido'] = (el) => R.vai(`#/contatto/${el.dataset.c}?chat=1`);
  R.azioni['ve-fatta'] = (el) => R.segnaFatta(el.dataset.id);
  R.azioni['ve-sposta-menu'] = (el) => {
    const a = R.affare(el.dataset.a);
    const fasi = R.percorso(a.percorso).fasi;
    R.tendina(el, `<div class="titolo-tendina">Sposta in…</div>${fasi.map((f) => `<button data-azione="ve-sposta" data-a="${a.id}" data-fase="${f.id}" ${f.id === a.fase ? 'disabled style="opacity:.45"' : ''}><span class="puntino" style="color:var(--${f.colore === 'verde' ? 'verde' : f.colore === 'errore' ? 'errore-t' : f.colore + '-t'})"></span>${R.esc(f.nome)}${f.id === a.fase ? ' · qui adesso' : ''}</button>`).join('')}`);
  };
  R.azioni['ve-sposta'] = (el) => { R.chiudiTendina(); R.spostaAffare(el.dataset.a, el.dataset.fase); };
  R.azioni['ve-vista'] = (el) => { R.stato.filtri.affari.vista = el.dataset.vista; R.salva(); R.aggiorna(); };
  R.azioni['ve-scegli-percorso'] = (el) => {
    R.tendina(el, `<div class="titolo-tendina">Percorsi di vendita</div>${R.stato.percorsi.map((p) => `<button data-azione="ve-percorso" data-id="${p.id}">${R.esc(p.nome)} · ${R.affariVivi().filter((a) => a.percorso === p.id && a.stato === 'aperto' && R.affareVisibile(a)).length} aperti</button>`).join('')}`);
  };
  R.azioni['ve-percorso'] = (el) => { R.chiudiTendina(); R.stato.filtri.affari.percorso = el.dataset.id; R.salva(); R.vai('#/affari'); };
  R.azioni['ve-filtri-affari'] = (el) => {
    const f = R.stato.filtri.affari;
    R.tendina(el, `<div class="titolo-tendina">Filtri</div>
      <button data-azione="ve-filtro-affari" data-chiave="soloMiei">${f.soloMiei ? R.icona('spunta', 16) : '<span style="width:16px"></span>'} Solo i miei</button>
      <button data-azione="ve-filtro-affari" data-chiave="senzaPasso">${f.senzaPasso ? R.icona('spunta', 16) : '<span style="width:16px"></span>'} Senza prossimo passo</button>
      <button data-azione="vai" data-dove="#/affari?filtro=mai"><span style="width:16px"></span> Mai richiamati</button>`);
  };
  R.azioni['ve-filtro-affari'] = (el) => { R.chiudiTendina(); const f = R.stato.filtri.affari; f[el.dataset.chiave] = !f[el.dataset.chiave]; R.salva(); R.aggiorna(); };
  R.azioni['ve-personalizza'] = () => {
    const c = R.stato.campiCarte;
    const voce = (k, t) => `<label class="riga-impostazione"><span>${t}</span><span class="interruttore"><input type="checkbox" name="${k}" ${c[k] ? 'checked' : ''}><span></span></span></label>`;
    R.modale({
      titolo: 'Personalizza colonne e campi',
      sottotitolo: 'Scegli cosa mostrare sulle schede degli affari. Vale per tutta l\'azienda.',
      classe: 'stretta',
      corpo: voce('etichette', 'Bando e fonte') + voce('valore', 'Valore') + voce('regione', 'Regione') + voce('prossima', 'Prossima attività') + `<p class="piccolo secondario" style="margin:10px 6px 0">I campi da chiedere quando si crea un affare e le fasi si cambiano in Impostazioni · Percorsi di vendita.</p>`,
      pulsanti: [{ testo: 'Annulla', chiudi: true }, { testo: 'Salva', classe: 'primario', fai: (f) => { Object.assign(R.stato.campiCarte, R.valori(f)); R.salva(); R.aggiorna(); R.avviso('Schede aggiornate'); } }],
    });
  };
  R.azioni['ve-affare-rapido'] = (el) => {
    if (!R.serveConnessione('la creazione di un affare')) return;
    const zona = el.parentElement;
    zona.innerHTML = `<div class="scheda-affare" style="cursor:default"><input class="campo" name="nome" placeholder="Nome o azienda" style="margin-bottom:8px"><input class="campo" name="telefono" placeholder="Telefono" inputmode="tel" style="margin-bottom:8px"><div class="riga-flex"><button class="btn piccolo primario" data-azione="ve-salva-rapido" data-fase="${el.dataset.fase}">Aggiungi</button><button class="btn piccolo secondario-campo" data-azione="ve-annulla-rapido">Annulla</button></div></div>`;
    zona.querySelector('input').focus();
  };
  R.azioni['ve-annulla-rapido'] = () => R.aggiorna();
  R.azioni['ve-salva-rapido'] = (el) => {
    const box = el.closest('.scheda-affare');
    const nome = box.querySelector('[name=nome]').value.trim();
    const tel = box.querySelector('[name=telefono]').value.trim();
    if (!nome) { box.querySelector('[name=nome]').classList.add('con-errore'); box.querySelector('[name=nome]').focus(); return; }
    if (!tel) { box.querySelector('[name=telefono]').classList.add('con-errore'); box.querySelector('[name=telefono]').focus(); return; }
    const dop = R.trovaDoppione(tel, '');
    if (dop) { R.avviso(R.contattoVisibile(dop) ? `Esiste già: ${R.esc(dop.nome)}. Aprilo dalla ricerca` : 'Questo contatto è già seguito da un collega: lo abbiamo avvisato'); return; }
    const percorso = R.stato.filtri.affari.percorso;
    const c = { id: R.id('c'), nome, referente: nome, ruoloReferente: '', telefono: R.formattaTelefono(tel), altriTelefoni: [], email: '', altreEmail: [], piva: '', ateco: '', regione: '', dipendenti: '', fonte: 'Inserito a mano', campagna: '', pagina: '', responsabile: R.utente().id, creato: R.adesso(), colore: 'salvia', etichette: [], nonLetti: 0, consensi: { whatsapp: 'non-registrato', email: 'non-registrato' } };
    R.stato.contatti.push(c);
    R.stato.affari.push({ id: R.id('d'), contatto: c.id, percorso, fase: el.dataset.fase, nome: 'Nuovo affare', bando: '', valore: null, responsabile: R.utente().id, seguaci: [], creato: R.adesso(), stato: 'aperto', documenti: [], tentativi: [], faseCambiata: R.adesso() });
    R.registraStoria(c.id, null, 'modifica', 'Creato con "Affare rapido"');
    R.salva(); R.aggiorna(); R.avviso(`Affare creato per ${R.esc(nome)}`);
  };
})();
