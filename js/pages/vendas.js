'use strict';
/* ══ HERMES — Page: Vendas ══ */
Hermes.pages.vendas = {
template: `
<div class="page-header">
  <div><h1>Vendas</h1><p class="page-subtitle">Registro e histórico de vendas</p></div>
  <button class="btn btn-primary" id="ven-btn-novo"><i data-lucide="plus"></i> Nova Venda</button>
</div>
<div class="mini-stats" id="ven-stats"></div>
<div class="filter-bar">
  <div class="search-wrap"><i data-lucide="search"></i><input type="text" id="ven-search" placeholder="Buscar produto..."></div>
  <select id="ven-canal" style="width:auto"><option value="">Todos os canais</option>
    <option value="loja">Loja</option><option value="online">Online</option>
    <option value="whatsapp">WhatsApp</option><option value="marketplace">Marketplace</option></select>
</div>
<div class="table-wrapper">
  <table><thead><tr><th>Data</th><th>Produto</th><th>Canal</th><th>Qtd.</th><th>Preço Unit.</th><th>Total</th><th>Lucro</th><th>Margem</th><th>Ações</th></tr></thead>
  <tbody id="ven-tbody"></tbody></table>
  <div id="ven-empty" class="empty-state hidden"><i data-lucide="shopping-bag"></i><p>Nenhuma venda registrada.</p>
    <button class="btn btn-primary" id="ven-btn-novo-e"><i data-lucide="plus"></i> Registrar</button></div>
</div>`,

init(){
  document.getElementById('ven-btn-novo').addEventListener('click',()=>this.openModal());
  document.getElementById('ven-btn-novo-e')?.addEventListener('click',()=>this.openModal());
  document.getElementById('ven-search').addEventListener('input',()=>this.render());
  document.getElementById('ven-canal').addEventListener('change',()=>this.render());
  this.render();
},
render(){
  const q=document.getElementById('ven-search').value.toLowerCase();
  const canal=document.getElementById('ven-canal').value;
  let list=[...DB.getVendas()].sort((a,b)=>new Date(b.data)-new Date(a.data)).filter(v=>{
    if(q&&!v.produtoNome.toLowerCase().includes(q)) return false;
    if(canal&&v.canal!==canal) return false;
    return true;
  });
  // mini stats
  const now=new Date();
  const s0=new Date(now); s0.setHours(0,0,0,0);
  const s7=new Date(now); s7.setDate(now.getDate()-7);
  const sm=new Date(now.getFullYear(),now.getMonth(),1);
  const all=DB.getVendas();
  const sl=(from)=>all.filter(v=>new Date(v.data)>=from);
  const st=(a)=>({fat:a.reduce((s,v)=>s+v.total,0),luc:a.reduce((s,v)=>s+v.lucro,0),un:a.reduce((s,v)=>s+v.quantidade,0)});
  const h=st(sl(s0)),s=st(sl(s7)),m=st(sl(sm));
  document.getElementById('ven-stats').innerHTML=`
    <div class="ms-card"><div class="ms-label">Hoje</div><div class="ms-value">${fmt(h.fat)}</div><div class="ms-sub">${h.un} unid.</div></div>
    <div class="ms-card"><div class="ms-label">7 dias</div><div class="ms-value">${fmt(s.fat)}</div><div class="ms-sub">${s.un} unid.</div></div>
    <div class="ms-card"><div class="ms-label">Este mês</div><div class="ms-value">${fmt(m.fat)}</div><div class="ms-sub">${m.un} unid.</div></div>
    <div class="ms-card hi"><div class="ms-label">Lucro do mês</div><div class="ms-value">${fmt(m.luc)}</div><div class="ms-sub">líquido</div></div>`;
  // table
  const tbody=document.getElementById('ven-tbody');
  const empty=document.getElementById('ven-empty');
  if(!list.length){ tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  tbody.innerHTML=list.map(v=>`<tr>
    <td style="white-space:nowrap">${fmtDT(v.data)}</td>
    <td><strong>${v.produtoNome}</strong></td>
    <td><span class="chip chip-aberta" style="font-size:10px">${v.canal||'—'}</span></td>
    <td>${v.quantidade}</td><td>${fmt(v.precoUnit)}</td>
    <td><strong>${fmt(v.total)}</strong></td>
    <td style="color:var(--green)">${fmt(v.lucro)}</td>
    <td>${v.total>0?fmtPct(v.lucro/v.total*100):'—'}</td>
    <td><button class="btn-icon del" onclick="confirm2('Excluir venda','Esta ação não pode ser desfeita. O estoque será restaurado.',()=>{const _v=DB.getVendas().find(x=>x.id==='${v.id}');if(_v){const _p=DB.getProduto(_v.produtoId);if(_p){_p.estoque+=_v.quantidade;DB.saveProduto(_p);}const _m=DB.getMovimentos().find(m=>m.referencia==='${v.id}');if(_m)DB.deleteMovimento(_m.id);}DB.deleteVenda('${v.id}');Hermes.pages.vendas.render();updateGlobalStatus();toast('Venda excluída e estoque restaurado.','warning');})" title="Excluir"><i data-lucide="trash-2"></i></button></td>
  </tr>`).join('');
  lucide.createIcons({nodes:[tbody]});
},
openModal(){
  const caixa=DB.getCaixaAberto();
  if(!caixa){
    toast('Caixa fechado! Abra o caixa antes de registrar vendas.','error',5000);
    openModal(`<div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="modal-header"><h2>Caixa Fechado</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
        <div class="modal-body"><p style="color:var(--t2);line-height:1.7">O caixa precisa estar <strong>aberto</strong> para registrar vendas, pois o valor é automaticamente contabilizado.<br><br>Vá até a aba <strong>Financeiro</strong> para abrir o caixa.</p></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-close-modal>Cancelar</button>
          <button class="btn btn-primary" onclick="closeModal();Hermes.navigate('financeiro')"><i data-lucide="landmark"></i> Ir para Financeiro</button>
        </div>
      </div></div>`);
    return;
  }
  const prods=DB.getProdutos().filter(p=>p.estoque>0);
  openModal(`<div class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header"><h2>Registrar Venda</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group col-2"><label>Produto *</label>
            <select id="mv-prod"${!prods.length?' disabled':''}><option value="">Selecione um produto...</option>
            ${prods.map(p=>`<option value="${p.id}" data-preco="${p.preco}" data-custo="${p.custo}" data-est="${p.estoque}">${p.nome} — estoque: ${p.estoque}</option>`).join('')}
            </select>
            ${!prods.length?'<span class="field-hint" style="color:var(--red)">Nenhum produto com estoque disponível.</span>':''}
          </div>
          <div class="form-group"><label>Quantidade *</label><input type="number" id="mv-qty" value="1" min="1" step="1"></div>
          <div class="form-group"><label>Preço Unit. (R$) *</label><input type="number" id="mv-preco" step="0.01" min="0"></div>
          <div class="form-group"><label>Data/Hora *</label><input type="datetime-local" id="mv-data" value="${new Date().toISOString().slice(0,16)}"></div>
          <div class="form-group"><label>Canal</label>
            <select id="mv-canal"><option value="loja">Loja Física</option><option value="online">Online</option>
              <option value="whatsapp">WhatsApp</option><option value="marketplace">Marketplace</option></select></div>
        </div>
        <div class="venda-preview" id="mv-preview" style="display:none">
          <div class="vp-row"><span>Estoque disponível:</span><strong id="mv-est">—</strong></div>
          <div class="vp-row"><span>Custo unit.:</span><strong id="mv-custo-u">—</strong></div>
          <div class="vp-row"><span>Total:</span><strong id="mv-total" class="vp-hi">—</strong></div>
          <div class="vp-row"><span>Lucro estimado:</span><strong id="mv-lucro" class="vp-gr">—</strong></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="mv-save"${!prods.length?' disabled':''}><i data-lucide="check"></i> Confirmar Venda</button>
      </div>
    </div></div>`);
  const upd=()=>{
    const opt=document.getElementById('mv-prod').selectedOptions[0];
    if(!opt?.value){ document.getElementById('mv-preview').style.display='none'; return; }
    const custo=+opt.dataset.custo, est=+opt.dataset.est;
    if(!document.getElementById('mv-preco').value) document.getElementById('mv-preco').value=opt.dataset.preco;
    const preco=+document.getElementById('mv-preco').value||0;
    const qty=+document.getElementById('mv-qty').value||1;
    document.getElementById('mv-preview').style.display='flex';
    document.getElementById('mv-est').textContent=est+' unid.';
    document.getElementById('mv-custo-u').textContent=fmt(custo);
    document.getElementById('mv-total').textContent=fmt(preco*qty);
    document.getElementById('mv-lucro').textContent=fmt((preco-custo)*qty);
  };
  document.getElementById('mv-prod').addEventListener('change',upd);
  document.getElementById('mv-qty').addEventListener('input',upd);
  document.getElementById('mv-preco').addEventListener('input',upd);
  document.getElementById('mv-save').addEventListener('click',()=>{
    const opt=document.getElementById('mv-prod').selectedOptions[0];
    if(!opt?.value){ toast('Selecione um produto.','error'); return; }
    const qty=+document.getElementById('mv-qty').value;
    const preco=+document.getElementById('mv-preco').value;
    const est=+opt.dataset.est;
    if(qty<1||qty>est){ toast('Quantidade inválida ou maior que o estoque disponível.','error'); return; }
    if(!preco||preco<0){ toast('Preço inválido.','error'); return; }
    const prod=DB.getProduto(opt.value);
    const venda=DB.saveVenda({produtoId:prod.id,produtoNome:prod.nome,categoria:prod.categoria,
      quantidade:qty,precoUnit:preco,custoUnit:prod.custo,
      total:+(preco*qty).toFixed(2),lucro:+((preco-prod.custo)*qty).toFixed(2),
      data:document.getElementById('mv-data').value,canal:document.getElementById('mv-canal').value});
    prod.estoque-=qty; DB.saveProduto(prod);
    const cx=DB.getCaixaAberto();
    if(cx) DB.addMovimento({caixaId:cx.id,tipo:'entrada',categoria:'venda',
      descricao:`Venda: ${prod.nome} x${qty}`,valor:venda.total,referencia:venda.id});
    closeModal(); toast('Venda registrada!'); this.render(); updateGlobalStatus();
  });
}
};
