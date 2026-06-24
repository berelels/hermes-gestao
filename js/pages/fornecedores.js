'use strict';
/* ══ HERMES — Page: Fornecedores ══ */
Hermes.pages.fornecedores = {
template: `
<div class="page-header">
  <div><h1>Fornecedores</h1><p class="page-subtitle">Cadastro e entradas programadas de fornecedores</p></div>
  <button class="btn btn-primary" id="forn-btn-novo"><i data-lucide="plus"></i> Novo Fornecedor</button>
</div>
<div class="filter-bar">
  <div class="search-wrap"><i data-lucide="search"></i><input type="text" id="forn-search" placeholder="Buscar fornecedor..."></div>
</div>
<!-- Alertas de entrega hoje -->
<div id="forn-alertas"></div>
<div class="table-wrapper">
  <table><thead><tr><th>Fornecedor</th><th>Contato</th><th>Dia do Mês</th><th>Produtos</th><th>Próx. Entrega</th><th>Ações</th></tr></thead>
  <tbody id="forn-tbody"></tbody></table>
  <div id="forn-empty" class="empty-state hidden">
    <i data-lucide="truck"></i><p>Nenhum fornecedor cadastrado.</p>
    <button class="btn btn-primary" id="forn-btn-novo-e"><i data-lucide="plus"></i> Adicionar</button>
  </div>
</div>
<div id="forn-historico-area" style="margin-top:20px"></div>`,

init(){
  document.getElementById('forn-btn-novo').addEventListener('click',()=>this.openModal());
  document.getElementById('forn-btn-novo-e')?.addEventListener('click',()=>this.openModal());
  document.getElementById('forn-search').addEventListener('input',()=>this.render());
  this.render();
  this.checkEntregasHoje();
},

_proximaEntrega(dia){
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const ano=hoje.getFullYear(), mes=hoje.getMonth();
  let d=new Date(ano,mes,dia);
  if(d<hoje) d=new Date(ano,mes+1,dia);
  return d;
},

render(){
  const q=document.getElementById('forn-search').value.toLowerCase();
  const list=DB.getFornecedores().filter(f=>!q||f.nome.toLowerCase().includes(q)||f.contato?.toLowerCase().includes(q));
  const tbody=document.getElementById('forn-tbody');
  const empty=document.getElementById('forn-empty');
  if(!list.length){ tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  tbody.innerHTML=list.map(f=>{
    const prox=this._proximaEntrega(f.dia);
    const diasFaltam=Math.round((prox-hoje)/(1000*60*60*24));
    const proxTxt=diasFaltam===0?`<span style="color:var(--yellow);font-weight:600">Hoje!</span>`
      :diasFaltam===1?`<span style="color:var(--orange)">Amanhã</span>`
      :`em ${diasFaltam} dias (${fmtDate(prox.toISOString())})`;
    const numProds=f.itens?.length||0;
    return `<tr>
      <td><strong>${f.nome}</strong></td>
      <td>${f.contato||'—'}</td>
      <td>Dia <strong>${f.dia}</strong></td>
      <td>${numProds} produto(s)</td>
      <td>${proxTxt}</td>
      <td style="display:flex;gap:5px">
        <button class="btn-icon" onclick="Hermes.pages.fornecedores.openModal('${f.id}')" title="Editar"><i data-lucide="pencil"></i></button>
        ${diasFaltam===0?`<button class="btn btn-green btn-sm" onclick="Hermes.pages.fornecedores.registrarEntrega('${f.id}')"><i data-lucide="package-check"></i> Dar Entrada</button>`:''}
        <button class="btn-icon del" onclick="confirm2('Excluir fornecedor','',()=>{DB.deleteFornecedor('${f.id}');Hermes.pages.fornecedores.render();})" title="Excluir"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>`;
  }).join('');
  lucide.createIcons({nodes:[tbody]});
  this.renderHistorico();
},

checkEntregasHoje(){
  const hoje=new Date(); hoje.setHours(0,0,0,0);
  const forns=DB.getFornecedores().filter(f=>{
    const prox=this._proximaEntrega(f.dia);
    return Math.round((prox-hoje)/(1000*60*60*24))===0;
  });
  const el=document.getElementById('forn-alertas');
  if(!forns.length){ el.innerHTML=''; return; }
  el.innerHTML=`<div class="info-banner-warn" style="margin-bottom:16px">
    <i data-lucide="truck"></i>
    <strong>Entregas programadas para hoje:</strong>
    ${forns.map(f=>`<strong>${f.nome}</strong>`).join(', ')}
    — confirme a entrada dos produtos após receber.
  </div>`;
  lucide.createIcons({nodes:[el]});
},

registrarEntrega(id){
  const f=DB.getFornecedor(id); if(!f) return;
  if(!f.itens?.length){ toast('Nenhum produto configurado para este fornecedor.','warning'); return; }
  const rows=f.itens.map(it=>{
    const p=DB.getProduto(it.produtoId);
    return `<tr>
      <td>${p?p.nome:it.produtoNome||'—'}</td>
      <td><input type="number" class="ent-qty" data-id="${it.produtoId}" value="${it.qtdEsperada||1}" min="0" style="width:80px"></td>
      <td>${p?p.estoque:'—'} unid.</td>
    </tr>`;
  }).join('');
  openModal(`<div class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header"><h2>Confirmar Entrada — ${f.nome}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <p style="color:var(--t2);margin-bottom:14px">Confirme as quantidades recebidas. Elas serão adicionadas ao estoque.</p>
        <div class="table-wrapper bare"><table>
          <thead><tr><th>Produto</th><th>Qtd. Recebida</th><th>Estoque Atual</th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>
        <div class="form-group" style="margin-top:12px">
          <label>Observação (opcional)</label>
          <input type="text" id="ent-obs" placeholder="Ex: NF 12345">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="ent-confirmar"><i data-lucide="package-check"></i> Confirmar Entrada</button>
      </div>
    </div></div>`);

  document.getElementById('ent-confirmar').addEventListener('click',()=>{
    const qtdEls=document.querySelectorAll('.ent-qty');
    const log=[];
    qtdEls.forEach(el=>{
      const prodId=el.dataset.id;
      const qty=+el.value||0;
      if(qty>0){
        const p=DB.getProduto(prodId);
        if(p){ p.estoque+=qty; DB.saveProduto(p); log.push(`${p.nome}: +${qty}`); }
      }
    });
    if(!log.length){ toast('Nenhuma quantidade informada.','warning'); return; }
    const obs=document.getElementById('ent-obs').value.trim();
    // Registrar no histórico do fornecedor
    if(!f.historico) f.historico=[];
    f.historico.push({data:new Date().toISOString(),itens:log,obs});
    DB.saveFornecedor(f);
    closeModal();
    toast(`Entrada registrada: ${log.join(', ')}`,'success',6000);
    this.render(); updateGlobalStatus();
  });
},

renderHistorico(){
  const el=document.getElementById('forn-historico-area');
  const forns=DB.getFornecedores().filter(f=>f.historico?.length);
  if(!forns.length){ el.innerHTML=''; return; }
  el.innerHTML=`<div class="chart-card full">
    <div class="chart-card-header"><h2>Histórico de Entradas</h2></div>
    <div class="table-wrapper bare"><table>
      <thead><tr><th>Data</th><th>Fornecedor</th><th>Itens</th><th>Obs.</th></tr></thead>
      <tbody>${forns.flatMap(f=>f.historico.map(h=>`<tr>
        <td>${fmtDT(h.data)}</td>
        <td><strong>${f.nome}</strong></td>
        <td>${h.itens.join(', ')}</td>
        <td>${h.obs||'—'}</td>
      </tr>`)).join('')}
      </tbody></table></div>
  </div>`;
},

openModal(id=null){
  const f=id?DB.getFornecedor(id):null;
  const v=f?JSON.parse(JSON.stringify(f)):{nome:'',contato:'',dia:1,itens:[]};
  const prods=DB.getProdutos();
  const itensHtml=v.itens.map((it,idx)=>{
    const p=DB.getProduto(it.produtoId);
    return `<tr class="forn-item-row">
      <td>${p?p.nome:it.produtoNome||'—'}</td>
      <td><input type="number" class="forn-qty" data-idx="${idx}" value="${it.qtdEsperada||1}" min="1" style="width:70px"></td>
      <td><button class="btn-icon del forn-rm" data-idx="${idx}"><i data-lucide="x"></i></button></td>
    </tr>`;
  }).join('');
  openModal(`<div class="modal-backdrop">
    <div class="modal-box modal-lg">
      <div class="modal-header"><h2>${f?'Editar Fornecedor':'Novo Fornecedor'}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Nome *</label><input id="forn-nome" value="${v.nome}" placeholder="Ex: Distribuidora ABC"></div>
          <div class="form-group"><label>Contato</label><input id="forn-contato" value="${v.contato||''}" placeholder="Telefone, email..."></div>
          <div class="form-group"><label>Dia do Mês de Entrega *</label>
            <input type="number" id="forn-dia" value="${v.dia}" min="1" max="28" placeholder="Ex: 15">
            <span class="field-hint">Entre 1 e 28. Toda entrada será neste dia.</span>
          </div>
        </div>
        <hr style="border-color:var(--border);margin:14px 0">
        <label style="font-size:12px;color:var(--t3);font-weight:600;text-transform:uppercase;letter-spacing:.5px">Produtos desta entrega</label>
        <div style="display:flex;gap:8px;margin:8px 0 10px">
          <select id="forn-prod-sel" style="flex:1">
            <option value="">— Selecione um produto —</option>
            ${prods.map(p=>`<option value="${p.id}">${p.nome}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="forn-add-prod"><i data-lucide="plus"></i> Adicionar</button>
        </div>
        <div class="table-wrapper bare" style="margin-bottom:12px">
          <table id="forn-itens-table">
            <thead><tr><th>Produto</th><th>Qtd. Esperada</th><th></th></tr></thead>
            <tbody id="forn-itens-tbody">${itensHtml||'<tr><td colspan="3" style="color:var(--t3);text-align:center;padding:10px">Nenhum produto associado</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="forn-save"><i data-lucide="save"></i> Salvar</button>
      </div>
    </div></div>`);
  lucide.createIcons({nodes:[document.getElementById('modal-container')]});

  // Bind remove e qty dos itens existentes
  const bindItens=()=>{
    document.querySelectorAll('.forn-rm').forEach(btn=>btn.addEventListener('click',()=>{
      v.itens.splice(+btn.dataset.idx,1); rebuildItens();
    }));
    document.querySelectorAll('.forn-qty').forEach(el=>el.addEventListener('input',()=>{
      v.itens[+el.dataset.idx].qtdEsperada=Math.max(1,+el.value||1);
    }));
  };
  const rebuildItens=()=>{
    const tbody=document.getElementById('forn-itens-tbody');
    if(!v.itens.length){ tbody.innerHTML='<tr><td colspan="3" style="color:var(--t3);text-align:center;padding:10px">Nenhum produto associado</td></tr>'; return; }
    tbody.innerHTML=v.itens.map((it,idx)=>{
      const p=DB.getProduto(it.produtoId);
      return `<tr class="forn-item-row">
        <td>${p?p.nome:it.produtoNome||'—'}</td>
        <td><input type="number" class="forn-qty" data-idx="${idx}" value="${it.qtdEsperada||1}" min="1" style="width:70px"></td>
        <td><button class="btn-icon del forn-rm" data-idx="${idx}"><i data-lucide="x"></i></button></td>
      </tr>`;
    }).join('');
    lucide.createIcons({nodes:[document.getElementById('forn-itens-tbody')]});
    bindItens();
  };
  bindItens();

  document.getElementById('forn-add-prod').addEventListener('click',()=>{
    const sel=document.getElementById('forn-prod-sel');
    const pid=sel.value; if(!pid){ toast('Selecione um produto.','error'); return; }
    if(v.itens.find(i=>i.produtoId===pid)){ toast('Produto já adicionado.','warning'); return; }
    const p=DB.getProduto(pid);
    v.itens.push({produtoId:pid,produtoNome:p?.nome||'—',qtdEsperada:1});
    rebuildItens();
  });

  document.getElementById('forn-save').addEventListener('click',()=>{
    const nome=document.getElementById('forn-nome').value.trim();
    const dia=+document.getElementById('forn-dia').value;
    if(!nome||!dia||dia<1||dia>28){ toast('Preencha nome e dia (1–28).','error'); return; }
    DB.saveFornecedor({...v,id:f?.id||null,nome,contato:document.getElementById('forn-contato').value.trim(),dia});
    closeModal(); toast(f?'Fornecedor atualizado!':'Fornecedor cadastrado!'); this.render();
  });
}
};
