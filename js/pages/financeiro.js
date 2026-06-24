'use strict';
/* ══ HERMES — Page: Financeiro ══ */
Hermes.pages.financeiro = {
template: `
<div class="page-header">
  <div><h1>Financeiro</h1><p class="page-subtitle">Caixa, contas a pagar/receber e movimentações</p></div>
</div>
<div class="sub-tabs">
  <button class="sub-tab active" data-sub="caixa"><i data-lucide="landmark"></i> Caixa</button>
  <button class="sub-tab" data-sub="cpagar"><i data-lucide="arrow-up-circle"></i> Contas a Pagar</button>
  <button class="sub-tab" data-sub="creceber"><i data-lucide="arrow-down-circle"></i> Contas a Receber</button>
  <button class="sub-tab" data-sub="movimentos"><i data-lucide="list"></i> Movimentações</button>
</div>
<div id="sub-caixa" class="sub-panel active"></div>
<div id="sub-cpagar" class="sub-panel"></div>
<div id="sub-creceber" class="sub-panel"></div>
<div id="sub-movimentos" class="sub-panel"></div>`,

init(){
  document.querySelectorAll('.sub-tab').forEach(t=>t.addEventListener('click',()=>{
    document.querySelectorAll('.sub-tab').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.sub-panel').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('sub-'+t.dataset.sub).classList.add('active');
    this['render_'+t.dataset.sub]?.();
  }));
  this.render_caixa();
},

/* ── STATUS CHIP ── */
_statusChip(status){
  const map={
    aberta: `<span class="chip chip-aberta">Aberta</span>`,
    avencer:`<span class="chip chip-avencer">⚠️ A vencer hoje</span>`,
    vencida:`<span class="chip chip-vencida">Vencida</span>`,
    paga:   `<span class="chip chip-paga">Paga</span>`,
    recebida:`<span class="chip chip-paga">Recebida</span>`,
  };
  return map[status]||`<span class="chip">${status}</span>`;
},

/* ── CAIXA ── */
render_caixa(){
  const caixa=DB.getCaixaAberto();
  const saldo=DB.getSaldoCaixa();
  const sessoes=[...DB.getCaixaSessoes()].sort((a,b)=>new Date(b.aberturaEm)-new Date(a.aberturaEm)).slice(0,8);
  const el=document.getElementById('sub-caixa');
  el.innerHTML=`
    <div class="caixa-banner ${caixa?'aberto':'fechado'}" style="margin-bottom:20px">
      <div class="cb-info"><div class="cb-dot"></div>
        <div><div class="cb-title">${caixa?'Caixa Aberto':'Caixa Fechado'}</div>
          <div class="cb-sub">${caixa?'Desde '+fmtDT(caixa.aberturaEm):'Nenhuma sessão aberta'}</div></div>
      </div>
      ${caixa?`<div class="cb-saldo">${fmt(saldo)}</div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary btn-sm" id="cx-add-mov"><i data-lucide="plus"></i> Lançamento</button>
          <button class="btn btn-red btn-sm" id="cx-fechar"><i data-lucide="lock"></i> Fechar Caixa</button>
        </div>`
        :`<button class="btn btn-green" id="cx-abrir"><i data-lucide="unlock"></i> Abrir Caixa</button>`}
    </div>
    <div class="chart-card full">
      <div class="chart-card-header"><h2>Histórico de Sessões</h2></div>
      ${sessoes.length?`<div class="table-wrapper bare"><table>
        <thead><tr><th>Abertura</th><th>Fechamento</th><th>Saldo Inicial</th><th>Saldo Final</th><th>Status</th></tr></thead>
        <tbody>${sessoes.map(s=>`<tr>
          <td>${fmtDT(s.aberturaEm)}</td><td>${s.fechamentoEm?fmtDT(s.fechamentoEm):'—'}</td>
          <td>${fmt(s.saldoInicial)}</td><td>${s.saldoFinal!=null?fmt(s.saldoFinal):'—'}</td>
          <td><span class="chip ${s.status==='aberto'?'chip-aberta':'chip-paga'}">${s.status==='aberto'?'Aberto':'Fechado'}</span></td>
        </tr>`).join('')}</tbody></table></div>`
        :'<div class="empty-state"><i data-lucide="inbox"></i><p>Nenhuma sessão registrada.</p></div>'}
    </div>`;
  lucide.createIcons({nodes:[el]});
  document.getElementById('cx-abrir')?.addEventListener('click',()=>this.openCaixaModal());
  document.getElementById('cx-fechar')?.addEventListener('click',()=>{
    confirm2('Fechar Caixa',`Saldo atual: <strong>${fmt(saldo)}</strong>. Confirmar fechamento?`,()=>{
      try{ const c=DB.fecharCaixa(); toast(`Caixa fechado. Saldo final: ${fmt(c.saldoFinal)}`); this.render_caixa(); updateGlobalStatus(); }
      catch(e){ toast(e.message,'error'); }
    });
  });
  document.getElementById('cx-add-mov')?.addEventListener('click',()=>this.openMovModal());
},
openCaixaModal(){
  const sugerido=DB.getSaldoInicialSugerido();
  openModal(`<div class="modal-backdrop"><div class="modal-box modal-sm">
    <div class="modal-header"><h2>Abrir Caixa</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
    <div class="modal-body">
      ${sugerido>0?`<div class="info-banner" style="margin-bottom:12px"><i data-lucide="info"></i> Saldo sugerido baseado no fechamento anterior: <strong>${fmt(sugerido)}</strong></div>`:''}
      <div class="form-group"><label>Saldo Inicial (R$) *</label><input type="number" id="cx-saldo" value="${sugerido}" min="0" step="0.01"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>Cancelar</button>
      <button class="btn btn-primary" id="cx-abrir-ok"><i data-lucide="unlock"></i> Abrir</button>
    </div></div></div>`);
  lucide.createIcons({nodes:[document.getElementById('modal-container')]});
  document.getElementById('cx-abrir-ok').addEventListener('click',()=>{
    try{ DB.abrirCaixa(+document.getElementById('cx-saldo').value);
      closeModal(); toast('Caixa aberto!'); this.render_caixa(); updateGlobalStatus(); }
    catch(e){ toast(e.message,'error'); }
  });
},
openMovModal(){
  openModal(`<div class="modal-backdrop"><div class="modal-box modal-sm">
    <div class="modal-header"><h2>Lançamento Manual</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
    <div class="modal-body">
      <div class="form-grid">
        <div class="form-group"><label>Tipo *</label>
          <select id="mov-tipo"><option value="entrada">Entrada</option><option value="saida">Saída</option></select></div>
        <div class="form-group"><label>Valor (R$) *</label><input type="number" id="mov-valor" min="0" step="0.01" placeholder="0,00"></div>
        <div class="form-group col-2"><label>Descrição *</label><input type="text" id="mov-desc" placeholder="Ex: Recebimento de cliente"></div>
        <div class="form-group col-2"><label>Data</label><input type="datetime-local" id="mov-data" value="${new Date().toISOString().slice(0,16)}"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>Cancelar</button>
      <button class="btn btn-primary" id="mov-save"><i data-lucide="check"></i> Lançar</button>
    </div></div></div>`);
  document.getElementById('mov-save').addEventListener('click',()=>{
    const cx=DB.getCaixaAberto();
    if(!cx){ toast('Caixa fechado.','error'); return; }
    const valor=+document.getElementById('mov-valor').value;
    const desc=document.getElementById('mov-desc').value.trim();
    if(!valor||!desc){ toast('Preencha todos os campos.','error'); return; }
    DB.addMovimento({caixaId:cx.id,tipo:document.getElementById('mov-tipo').value,
      categoria:'manual',descricao:desc,valor,referencia:null,data:document.getElementById('mov-data').value});
    closeModal(); toast('Lançamento registrado!'); this.render_caixa(); this.render_movimentos?.(); updateGlobalStatus();
  });
},

/* ── CONTAS A PAGAR ── */
render_cpagar(){
  DB.atualizarStatusContas();
  let list=[...DB.getContasPagar()];
  const filtroAtual=document.getElementById('cp-filtro')?.value||'';
  const sortAtual=document.getElementById('cp-sort')?.value||'venc';
  const _filter=(l)=>{
    if(!filtroAtual) return l;
    return l.filter(c=>c.status===filtroAtual);
  };
  const _sort=(l)=>{
    if(sortAtual==='venc') return l.sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento));
    if(sortAtual==='valor') return l.sort((a,b)=>b.valor-a.valor);
    return l;
  };
  list=_sort(_filter(list));
  const el=document.getElementById('sub-cpagar');
  el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap">
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <select id="cp-filtro" style="width:auto">
        <option value="">Todos status</option>
        <option value="aberta" ${filtroAtual==='aberta'?'selected':''}>Abertas</option>
        <option value="avencer" ${filtroAtual==='avencer'?'selected':''}>A vencer hoje</option>
        <option value="vencida" ${filtroAtual==='vencida'?'selected':''}>Vencidas</option>
        <option value="paga" ${filtroAtual==='paga'?'selected':''}>Pagas</option>
      </select>
      <select id="cp-sort" style="width:auto">
        <option value="venc" ${sortAtual==='venc'?'selected':''}>Mais próx. do venc.</option>
        <option value="valor" ${sortAtual==='valor'?'selected':''}>Maior valor</option>
      </select>
    </div>
    <button class="btn btn-primary" id="cp-novo"><i data-lucide="plus"></i> Nova Conta</button>
  </div>
  <div class="table-wrapper">
  <table><thead><tr><th>Fornecedor</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
  <tbody>${list.length?list.map(c=>`<tr>
    <td><strong>${c.fornecedor}</strong></td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
    <td style="${c.status==='vencida'?'color:var(--red)':c.status==='avencer'?'color:var(--yellow)':''}">${fmtDate(c.vencimento)}</td>
    <td>${this._statusChip(c.status)}</td>
    <td style="display:flex;gap:5px">
      ${c.status!=='paga'?`<button class="btn btn-green btn-sm" onclick="Hermes.pages.financeiro.pagarConta('${c.id}')"><i data-lucide="check"></i> Pagar</button>`:''}
      <button class="btn-icon del" onclick="confirm2('Excluir conta','Esta ação não pode ser desfeita.',()=>{DB.deleteContaPagar('${c.id}');Hermes.pages.financeiro.render_cpagar();})"><i data-lucide="trash-2"></i></button>
    </td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:30px">Nenhuma conta cadastrada.</td></tr>'}
  </tbody></table></div>`;
  lucide.createIcons({nodes:[el]});
  document.getElementById('cp-novo').addEventListener('click',()=>this.openContaModal('pagar'));
  document.getElementById('cp-filtro')?.addEventListener('change',()=>this.render_cpagar());
  document.getElementById('cp-sort')?.addEventListener('change',()=>this.render_cpagar());
},
pagarConta(id){
  try{ DB.pagarConta(id); toast('Conta paga!'); this.render_cpagar(); updateGlobalStatus(); }
  catch(e){ toast(e.message,'error'); }
},

/* ── CONTAS A RECEBER ── */
render_creceber(){
  DB.atualizarStatusContas();
  let list=[...DB.getContasReceber()];
  const filtroAtual=document.getElementById('cr-filtro')?.value||'';
  const sortAtual=document.getElementById('cr-sort')?.value||'venc';
  const _filter=(l)=>filtroAtual?l.filter(c=>c.status===filtroAtual):l;
  const _sort=(l)=>{
    if(sortAtual==='venc') return l.sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento));
    if(sortAtual==='valor') return l.sort((a,b)=>b.valor-a.valor);
    return l;
  };
  list=_sort(_filter(list));
  const el=document.getElementById('sub-creceber');
  el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap">
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <select id="cr-filtro" style="width:auto">
        <option value="">Todos status</option>
        <option value="aberta" ${filtroAtual==='aberta'?'selected':''}>Abertas</option>
        <option value="avencer" ${filtroAtual==='avencer'?'selected':''}>A vencer hoje</option>
        <option value="vencida" ${filtroAtual==='vencida'?'selected':''}>Vencidas</option>
        <option value="recebida" ${filtroAtual==='recebida'?'selected':''}>Recebidas</option>
      </select>
      <select id="cr-sort" style="width:auto">
        <option value="venc" ${sortAtual==='venc'?'selected':''}>Mais próx. do venc.</option>
        <option value="valor" ${sortAtual==='valor'?'selected':''}>Maior valor</option>
      </select>
    </div>
    <button class="btn btn-primary" id="cr-novo"><i data-lucide="plus"></i> Nova Conta</button>
  </div>
  <div class="table-wrapper">
  <table><thead><tr><th>Fonte</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
  <tbody>${list.length?list.map(c=>`<tr>
    <td><strong>${c.fonte||c.cliente||'—'}</strong></td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
    <td style="${c.status==='vencida'?'color:var(--red)':c.status==='avencer'?'color:var(--yellow)':''}">${fmtDate(c.vencimento)}</td>
    <td>${this._statusChip(c.status)}</td>
    <td style="display:flex;gap:5px">
      ${c.status!=='recebida'?`<button class="btn btn-green btn-sm" onclick="Hermes.pages.financeiro.receberConta('${c.id}')"><i data-lucide="check"></i> Receber</button>`:''}
      <button class="btn-icon del" onclick="confirm2('Excluir conta','',()=>{DB.deleteContaReceber('${c.id}');Hermes.pages.financeiro.render_creceber();})"><i data-lucide="trash-2"></i></button>
    </td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:30px">Nenhuma conta cadastrada.</td></tr>'}
  </tbody></table></div>`;
  lucide.createIcons({nodes:[el]});
  document.getElementById('cr-novo').addEventListener('click',()=>this.openContaModal('receber'));
  document.getElementById('cr-filtro')?.addEventListener('change',()=>this.render_creceber());
  document.getElementById('cr-sort')?.addEventListener('change',()=>this.render_creceber());
},
receberConta(id){
  try{ DB.receberConta(id); toast('Recebimento registrado!'); this.render_creceber(); updateGlobalStatus(); }
  catch(e){ toast(e.message,'error'); }
},
openContaModal(tipo){
  const isPagar=tipo==='pagar';
  openModal(`<div class="modal-backdrop"><div class="modal-box modal-sm">
    <div class="modal-header"><h2>${isPagar?'Nova Conta a Pagar':'Nova Conta a Receber'}</h2>
      <button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
    <div class="modal-body"><div class="form-grid">
      <div class="form-group col-2"><label>${isPagar?'Fornecedor':'Fonte'} *</label><input type="text" id="ct-part" placeholder="Nome..."></div>
      <div class="form-group col-2"><label>Descrição *</label><input type="text" id="ct-desc" placeholder="Ex: Fatura de energia"></div>
      <div class="form-group"><label>Valor (R$) *</label><input type="number" id="ct-valor" min="0" step="0.01"></div>
      <div class="form-group"><label>Vencimento *</label><input type="date" id="ct-venc" value="${new Date().toISOString().slice(0,10)}"></div>
    </div></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>Cancelar</button>
      <button class="btn btn-primary" id="ct-save"><i data-lucide="save"></i> Salvar</button>
    </div></div></div>`);
  document.getElementById('ct-save').addEventListener('click',()=>{
    const part=document.getElementById('ct-part').value.trim();
    const desc=document.getElementById('ct-desc').value.trim();
    const valor=+document.getElementById('ct-valor').value;
    const venc=document.getElementById('ct-venc').value;
    if(!part||!desc||!valor||!venc){ toast('Preencha todos os campos.','error'); return; }
    if(isPagar) DB.saveContaPagar({fornecedor:part,descricao:desc,valor,vencimento:venc,status:'aberta',pagaEm:null,movimentoId:null});
    else DB.saveContaReceber({fonte:part,descricao:desc,valor,vencimento:venc,status:'aberta',recebidaEm:null,movimentoId:null});
    DB.atualizarStatusContas();
    closeModal(); toast('Conta salva!');
    isPagar?this.render_cpagar():this.render_creceber();
    updateGlobalStatus();
  });
},

/* ── MOVIMENTOS ── */
render_movimentos(){
  const cx=DB.getCaixaAberto();
  // Filtro
  const periodoAtual=document.getElementById('mov-periodo')?.value||'hoje';
  const now=new Date();
  let desde=new Date(now); desde.setHours(0,0,0,0);
  if(periodoAtual==='7d'){ desde=new Date(now); desde.setDate(now.getDate()-7); }
  else if(periodoAtual==='mes'){ desde=new Date(now.getFullYear(),now.getMonth(),1); }
  else if(periodoAtual==='tudo'){ desde=new Date(0); }
  else if(periodoAtual==='custom'){
    const dEl=document.getElementById('mov-custom-from');
    if(dEl?.value) desde=new Date(dEl.value+'T00:00:00');
  }
  let movs=[...DB.getMovimentos()]
    .filter(m=>new Date(m.data)>=desde)
    .sort((a,b)=>new Date(b.data)-new Date(a.data));
  // custom to date
  if(periodoAtual==='custom'){
    const dEl2=document.getElementById('mov-custom-to');
    if(dEl2?.value){ const ate=new Date(dEl2.value+'T23:59:59'); movs=movs.filter(m=>new Date(m.data)<=ate); }
  }
  const total_e=movs.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
  const total_s=movs.filter(m=>m.tipo==='saida').reduce((s,m)=>s+m.valor,0);
  const el=document.getElementById('sub-movimentos');
  el.innerHTML=`
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
      <select id="mov-periodo" style="width:auto">
        <option value="hoje" ${periodoAtual==='hoje'?'selected':''}>Hoje</option>
        <option value="7d" ${periodoAtual==='7d'?'selected':''}>Últimos 7 dias</option>
        <option value="mes" ${periodoAtual==='mes'?'selected':''}>Este mês</option>
        <option value="tudo" ${periodoAtual==='tudo'?'selected':''}>Tudo</option>
        <option value="custom" ${periodoAtual==='custom'?'selected':''}>Personalizado</option>
      </select>
      <div id="mov-custom-dates" style="${periodoAtual==='custom'?'display:flex':'display:none'};gap:6px;align-items:center">
        <input type="date" id="mov-custom-from" style="width:auto" value="${now.toISOString().slice(0,10)}">
        <span style="color:var(--t3)">até</span>
        <input type="date" id="mov-custom-to" style="width:auto" value="${now.toISOString().slice(0,10)}">
      </div>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px">
      <div class="ms-card" style="flex:1"><div class="ms-label">Entradas</div><div class="ms-value" style="color:var(--green)">${fmt(total_e)}</div></div>
      <div class="ms-card" style="flex:1"><div class="ms-label">Saídas</div><div class="ms-value" style="color:var(--red)">${fmt(total_s)}</div></div>
      <div class="ms-card hi" style="flex:1"><div class="ms-label">Saldo</div><div class="ms-value">${fmt(total_e-total_s)}</div></div>
      ${cx?`<button class="btn btn-primary" style="align-self:center" onclick="Hermes.pages.financeiro.openMovModal()"><i data-lucide="plus"></i> Lançamento</button>`:''}
    </div>
    <div class="table-wrapper"><table>
      <thead><tr><th>Data</th><th>Tipo</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr></thead>
      <tbody>${movs.length?movs.map(m=>`<tr>
        <td>${fmtDT(m.data)}</td>
        <td><span class="chip chip-${m.tipo}">${m.tipo}</span></td>
        <td>${m.categoria}</td><td>${m.descricao}</td>
        <td style="color:${m.tipo==='entrada'?'var(--green)':'var(--red)'}"><strong>${m.tipo==='entrada'?'+':'-'}${fmt(m.valor)}</strong></td>
      </tr>`).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:30px">Nenhuma movimentação no período.</td></tr>'}
      </tbody></table></div>`;
  lucide.createIcons({nodes:[el]});
  document.getElementById('mov-periodo')?.addEventListener('change',()=>this.render_movimentos());
  const custom=document.getElementById('mov-custom-dates');
  document.getElementById('mov-periodo')?.addEventListener('change',(e)=>{
    if(custom) custom.style.display=e.target.value==='custom'?'flex':'none';
    this.render_movimentos();
  });
  document.getElementById('mov-custom-from')?.addEventListener('change',()=>this.render_movimentos());
  document.getElementById('mov-custom-to')?.addEventListener('change',()=>this.render_movimentos());
}
};
