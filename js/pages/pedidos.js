'use strict';
/* ══ HERMES — Page: Pedidos de Clientes ══ */
Hermes.pages.pedidos = {
template: `
<div class="page-header">
  <div><h1>Pedidos</h1><p class="page-subtitle">Pedidos de clientes com produtos do estoque</p></div>
  <button class="btn btn-primary" id="ped-btn-novo"><i data-lucide="plus"></i> Novo Pedido</button>
</div>
<div class="filter-bar">
  <div class="search-wrap"><i data-lucide="search"></i><input type="text" id="ped-search" placeholder="Buscar por destinatário, ID ou produto..."></div>
  <select id="ped-status-filter" style="width:auto">
    <option value="">Todos os status</option>
    <option value="pendente">Pendente</option>
    <option value="separando">Separando</option>
    <option value="entregue">Entregue</option>
    <option value="cancelado">Cancelado</option>
  </select>
</div>
<div class="table-wrapper">
  <table><thead><tr><th>ID</th><th>Destinatário</th><th>Recebedor</th><th>Itens</th><th>Total</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
  <tbody id="ped-tbody"></tbody></table>
  <div id="ped-empty" class="empty-state hidden">
    <i data-lucide="clipboard-list"></i><p>Nenhum pedido cadastrado.</p>
    <button class="btn btn-primary" id="ped-btn-novo-e"><i data-lucide="plus"></i> Criar Pedido</button>
  </div>
</div>`,

_statusChip(s){
  const m={pendente:'chip-aberta',separando:'chip-avencer',entregue:'chip-paga',cancelado:'chip-vencida'};
  return `<span class="chip ${m[s]||'chip'}">${s.charAt(0).toUpperCase()+s.slice(1)}</span>`;
},

init(){
  document.getElementById('ped-btn-novo').addEventListener('click',()=>this.openModal());
  document.getElementById('ped-btn-novo-e')?.addEventListener('click',()=>this.openModal());
  document.getElementById('ped-search').addEventListener('input',()=>this.render());
  document.getElementById('ped-status-filter').addEventListener('change',()=>this.render());
  this.render();
},

render(){
  const q=document.getElementById('ped-search').value.toLowerCase();
  const sf=document.getElementById('ped-status-filter').value;
  let list=[...DB.getPedidos()].sort((a,b)=>new Date(b.criadoEm)-new Date(a.criadoEm)).filter(p=>{
    if(sf&&p.status!==sf) return false;
    if(q&&!p.destinatario?.toLowerCase().includes(q)&&
        !p.recebedor?.toLowerCase().includes(q)&&
        !String(p.numero).includes(q)&&
        !p.itens?.some(i=>i.produtoNome.toLowerCase().includes(q))) return false;
    return true;
  });
  const tbody=document.getElementById('ped-tbody');
  const empty=document.getElementById('ped-empty');
  if(!list.length){ tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML=list.map(p=>{
    const itensTxt=p.itens?.map(i=>`${i.quantidade}× ${i.produtoNome}`).join(', ')||'—';
    const total=p.itens?.reduce((s,i)=>s+i.quantidade*i.precoUnit,0)||0;
    return `<tr>
      <td><strong>#${p.numero}</strong></td>
      <td>${p.destinatario||'—'}</td>
      <td>${p.recebedor||'—'}</td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${itensTxt}">${itensTxt}</td>
      <td><strong>${fmt(total)}</strong></td>
      <td style="white-space:nowrap">${fmtDate(p.criadoEm)}</td>
      <td>${this._statusChip(p.status)}</td>
      <td style="display:flex;gap:5px">
        <button class="btn-icon" onclick="Hermes.pages.pedidos.openDetalhe('${p.id}')" title="Ver detalhes"><i data-lucide="eye"></i></button>
        ${p.status!=='entregue'&&p.status!=='cancelado'?`<button class="btn btn-green btn-sm" onclick="Hermes.pages.pedidos.avancarStatus('${p.id}')" title="Avançar status"><i data-lucide="chevron-right"></i></button>`:''}
        <button class="btn-icon del" onclick="confirm2('Excluir pedido','Esta ação não pode ser desfeita.',()=>{DB.deletePedido('${p.id}');Hermes.pages.pedidos.render();})" title="Excluir"><i data-lucide="trash-2"></i></button>
      </td>
    </tr>`;
  }).join('');
  lucide.createIcons({nodes:[tbody]});
},

avancarStatus(id){
  const p=DB.getPedido(id); if(!p) return;
  const flow={pendente:'separando',separando:'entregue'};
  const proximo=flow[p.status];
  if(!proximo) return;
  if(proximo==='entregue'){
    confirm2('Marcar como Entregue',`Baixar o estoque dos itens do pedido #${p.numero} automaticamente?`,()=>{
      p.itens?.forEach(it=>{
        const prod=DB.getProduto(it.produtoId);
        if(prod){ prod.estoque=Math.max(0,prod.estoque-it.quantidade); DB.saveProduto(prod); }
      });
      p.status='entregue'; p.entregueEm=new Date().toISOString();
      DB.savePedido(p); toast(`Pedido #${p.numero} entregue!`); this.render(); updateGlobalStatus();
    });
  } else {
    p.status=proximo; DB.savePedido(p);
    toast(`Pedido #${p.numero} → ${proximo}`,'info'); this.render();
  }
},

openDetalhe(id){
  const p=DB.getPedido(id); if(!p) return;
  const total=p.itens?.reduce((s,i)=>s+i.quantidade*i.precoUnit,0)||0;
  openModal(`<div class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header"><h2>Pedido #${p.numero}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="form-grid" style="margin-bottom:12px">
          <div class="form-group"><label>Destinatário</label><p style="color:var(--t1)">${p.destinatario||'—'}</p></div>
          <div class="form-group"><label>Recebedor</label><p style="color:var(--t1)">${p.recebedor||'—'}</p></div>
          <div class="form-group"><label>Status</label>${this._statusChip(p.status)}</div>
          <div class="form-group"><label>Data</label><p style="color:var(--t1)">${fmtDate(p.criadoEm)}</p></div>
        </div>
        ${p.obs?`<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--t3)">Observações</label><p style="color:var(--t2)">${p.obs}</p></div>`:''}
        <div class="table-wrapper bare"><table>
          <thead><tr><th>Produto</th><th>Qtd.</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
          <tbody>${p.itens?.map(i=>`<tr>
            <td>${i.produtoNome}</td><td>${i.quantidade}</td>
            <td>${fmt(i.precoUnit)}</td><td><strong>${fmt(i.quantidade*i.precoUnit)}</strong></td>
          </tr>`).join('')||'<tr><td colspan="4">—</td></tr>'}
          </tbody></table></div>
        <div style="text-align:right;margin-top:12px;font-size:16px">
          Total: <strong style="color:var(--accent)">${fmt(total)}</strong>
        </div>
      </div>
      <div class="modal-footer"><button class="btn btn-ghost" data-close-modal>Fechar</button></div>
    </div></div>`);
},

openModal(){
  const prods=DB.getProdutos();
  const cart=[];
  openModal(`<div class="modal-backdrop">
    <div class="modal-box modal-lg">
      <div class="modal-header"><h2>Novo Pedido</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group"><label>Destinatário *</label><input id="ped-dest" placeholder="Nome do destinatário"></div>
          <div class="form-group"><label>Quem Recebe</label><input id="ped-receb" placeholder="Nome do responsável pelo recebimento"></div>
          <div class="form-group col-2"><label>Observações</label><input id="ped-obs" placeholder="Informações adicionais..."></div>
        </div>
        <hr style="border-color:var(--border);margin:14px 0">
        <div class="form-group" style="margin-bottom:8px">
          <label>Adicionar Produto</label>
          <div class="venda-search-wrap">
            <input type="text" id="ped-busca" placeholder="🔍 Buscar produto..." autocomplete="off">
            <div id="ped-dropdown" class="venda-dropdown hidden"></div>
          </div>
        </div>
        <div id="ped-cart-area">
          <div id="ped-cart-empty" style="text-align:center;color:var(--t3);padding:12px 0;font-size:13px">Nenhum produto adicionado.</div>
          <table id="ped-cart-table" class="venda-cart-table" style="display:none">
            <thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th><th></th></tr></thead>
            <tbody id="ped-cart-tbody"></tbody>
          </table>
        </div>
        <div id="ped-total-area" style="text-align:right;margin-top:10px;display:none">
          Total: <strong id="ped-total" style="color:var(--accent);font-size:16px">—</strong>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="ped-save"><i data-lucide="save"></i> Criar Pedido</button>
      </div>
    </div></div>`);

  const buscaEl=document.getElementById('ped-busca');
  const dropEl=document.getElementById('ped-dropdown');
  const renderDrop=(q)=>{
    const term=q.toLowerCase().trim();
    const res=term===''?prods.slice(0,12):prods.filter(p=>p.nome.toLowerCase().includes(term)||p.sku?.toLowerCase().includes(term)).slice(0,10);
    dropEl.innerHTML=res.length?res.map(p=>`<div class="vd-item" data-id="${p.id}">
      <div class="vd-nome">${p.nome}</div>
      <div class="vd-meta">${p.sku||''} · estoque: <strong>${p.estoque}</strong> · ${fmt(p.preco)}</div>
    </div>`).join(''):'<div class="vd-item vd-none">Nenhum produto</div>';
    dropEl.classList.remove('hidden');
    dropEl.querySelectorAll('.vd-item[data-id]').forEach(el=>el.addEventListener('click',()=>{
      const prod=DB.getProduto(el.dataset.id);
      const ex=cart.find(i=>i.produtoId===prod.id);
      if(ex) ex.quantidade++;
      else cart.push({produtoId:prod.id,produtoNome:prod.nome,quantidade:1,precoUnit:prod.preco,estoque:prod.estoque});
      buscaEl.value=''; dropEl.classList.add('hidden'); renderCart();
    }));
  };
  buscaEl.addEventListener('focus',()=>renderDrop(buscaEl.value));
  buscaEl.addEventListener('input',()=>renderDrop(buscaEl.value));
  document.addEventListener('click',(e)=>{ if(!e.target.closest('.venda-search-wrap')) dropEl.classList.add('hidden'); });

  const renderCart=()=>{
    const tbody=document.getElementById('ped-cart-tbody');
    const table=document.getElementById('ped-cart-table');
    const empty=document.getElementById('ped-cart-empty');
    const tArea=document.getElementById('ped-total-area');
    if(!cart.length){ table.style.display='none'; empty.style.display=''; tArea.style.display='none'; return; }
    table.style.display=''; empty.style.display='none'; tArea.style.display='';
    tbody.innerHTML=cart.map((it,idx)=>`<tr>
      <td><strong>${it.produtoNome}</strong></td>
      <td><input type="number" class="cart-qty" data-idx="${idx}" value="${it.quantidade}" min="1" style="width:60px"></td>
      <td><input type="number" class="cart-preco" data-idx="${idx}" value="${it.precoUnit}" step="0.01" min="0" style="width:90px"></td>
      <td><strong>${fmt(it.precoUnit*it.quantidade)}</strong></td>
      <td><button class="btn-icon del" data-rm="${idx}"><i data-lucide="x"></i></button></td>
    </tr>`).join('');
    lucide.createIcons({nodes:[tbody]});
    tbody.querySelectorAll('.cart-qty').forEach(el=>el.addEventListener('input',()=>{ cart[+el.dataset.idx].quantidade=Math.max(1,+el.value||1); renderCart(); }));
    tbody.querySelectorAll('.cart-preco').forEach(el=>el.addEventListener('input',()=>{ cart[+el.dataset.idx].precoUnit=+el.value||0; renderCart(); }));
    tbody.querySelectorAll('[data-rm]').forEach(el=>el.addEventListener('click',()=>{ cart.splice(+el.dataset.rm,1); renderCart(); }));
    const total=cart.reduce((s,i)=>s+i.precoUnit*i.quantidade,0);
    document.getElementById('ped-total').textContent=fmt(total);
  };

  document.getElementById('ped-save').addEventListener('click',()=>{
    const dest=document.getElementById('ped-dest').value.trim();
    if(!dest){ toast('Informe o destinatário.','error'); return; }
    if(!cart.length){ toast('Adicione pelo menos um produto.','error'); return; }
    DB.savePedido({destinatario:dest,recebedor:document.getElementById('ped-receb').value.trim(),
      obs:document.getElementById('ped-obs').value.trim(),
      itens:cart.map(i=>({produtoId:i.produtoId,produtoNome:i.produtoNome,quantidade:i.quantidade,precoUnit:i.precoUnit})),
      status:'pendente'});
    closeModal(); toast('Pedido criado!'); this.render();
  });
}
};
