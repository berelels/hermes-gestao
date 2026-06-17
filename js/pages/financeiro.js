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
  openModal(`<div class="modal-backdrop"><div class="modal-box modal-sm">
    <div class="modal-header"><h2>Abrir Caixa</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
    <div class="modal-body">
      <div class="form-group"><label>Saldo Inicial (R$) *</label><input type="number" id="cx-saldo" value="0" min="0" step="0.01"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>Cancelar</button>
      <button class="btn btn-primary" id="cx-abrir-ok"><i data-lucide="unlock"></i> Abrir</button>
    </div></div></div>`);
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
    closeModal(); toast('Lançamento registrado!'); this.render_caixa(); this.render_movimentos(); updateGlobalStatus();
  });
},

/* ── CONTAS A PAGAR ── */
render_cpagar(){
  DB.atualizarStatusContas();
  const list=[...DB.getContasPagar()].sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento));
  const el=document.getElementById('sub-cpagar');
  el.innerHTML=`<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
    <button class="btn btn-primary" id="cp-novo"><i data-lucide="plus"></i> Nova Conta</button></div>
    <div class="table-wrapper">
    <table><thead><tr><th>Fornecedor</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
    <tbody>${list.length?list.map(c=>`<tr>
      <td><strong>${c.fornecedor}</strong></td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
      <td style="${c.status==='vencida'?'color:var(--red)':''}">${fmtDate(c.vencimento)}</td>
      <td><span class="chip chip-${c.status}">${c.status}</span></td>
      <td style="display:flex;gap:5px">
        ${c.status!=='paga'?`<button class="btn btn-green btn-sm" onclick="Hermes.pages.financeiro.pagarConta('${c.id}')"><i data-lucide="check"></i> Pagar</button>`:''}
        <button class="btn-icon del" onclick="confirm2('Excluir conta','Esta ação não pode ser desfeita.',()=>{DB.deleteContaPagar('${c.id}');Hermes.pages.financeiro.render_cpagar();})"><i data-lucide="trash-2"></i></button>
      </td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:30px">Nenhuma conta cadastrada.</td></tr>'}
    </tbody></table></div>`;
  lucide.createIcons({nodes:[el]});
  document.getElementById('cp-novo').addEventListener('click',()=>this.openContaModal('pagar'));
},
pagarConta(id){
  try{ DB.pagarConta(id); toast('Conta paga!'); this.render_cpagar(); updateGlobalStatus(); }
  catch(e){ toast(e.message,'error'); }
},

/* ── CONTAS A RECEBER ── */
render_creceber(){
  DB.atualizarStatusContas();
  const list=[...DB.getContasReceber()].sort((a,b)=>new Date(a.vencimento)-new Date(b.vencimento));
  const el=document.getElementById('sub-creceber');
  el.innerHTML=`<div style="display:flex;justify-content:flex-end;margin-bottom:14px">
    <button class="btn btn-primary" id="cr-novo"><i data-lucide="plus"></i> Nova Conta</button></div>
    <div class="table-wrapper">
    <table><thead><tr><th>Cliente</th><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Ações</th></tr></thead>
    <tbody>${list.length?list.map(c=>`<tr>
      <td><strong>${c.cliente}</strong></td><td>${c.descricao}</td><td>${fmt(c.valor)}</td>
      <td style="${c.status==='vencida'?'color:var(--red)':''}">${fmtDate(c.vencimento)}</td>
      <td><span class="chip chip-${c.status}">${c.status}</span></td>
      <td style="display:flex;gap:5px">
        ${c.status!=='recebida'?`<button class="btn btn-green btn-sm" onclick="Hermes.pages.financeiro.receberConta('${c.id}')"><i data-lucide="check"></i> Receber</button>`:''}
        <button class="btn-icon del" onclick="confirm2('Excluir conta','',()=>{DB.deleteContaReceber('${c.id}');Hermes.pages.financeiro.render_creceber();})"><i data-lucide="trash-2"></i></button>
      </td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;color:var(--t3);padding:30px">Nenhuma conta cadastrada.</td></tr>'}
    </tbody></table></div>`;
  lucide.createIcons({nodes:[el]});
  document.getElementById('cr-novo').addEventListener('click',()=>this.openContaModal('receber'));
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
      <div class="form-group col-2"><label>${isPagar?'Fornecedor':'Cliente'} *</label><input type="text" id="ct-part" placeholder="Nome..."></div>
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
    else DB.saveContaReceber({cliente:part,descricao:desc,valor,vencimento:venc,status:'aberta',recebidaEm:null,movimentoId:null});
    DB.atualizarStatusContas();
    closeModal(); toast('Conta salva!');
    isPagar?this.render_cpagar():this.render_creceber();
    updateGlobalStatus();
  });
},

/* ── MOVIMENTOS ── */
render_movimentos(){
  const cx=DB.getCaixaAberto();
  const movs=[...DB.getMovimentos()].sort((a,b)=>new Date(b.data)-new Date(a.data)).slice(0,50);
  const el=document.getElementById('sub-movimentos');
  const total_e=movs.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
  const total_s=movs.filter(m=>m.tipo==='saida').reduce((s,m)=>s+m.valor,0);
  el.innerHTML=`<div style="display:flex;gap:12px;margin-bottom:16px">
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
    </tr>`).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--t3);padding:30px">Nenhuma movimentação.</td></tr>'}
    </tbody></table></div>`;
  lucide.createIcons({nodes:[el]});
}
};
