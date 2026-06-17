'use strict';
/* ══ HERMES — Page: Estoque ══ */
Hermes.pages.estoque = {
template: `
<div class="page-header">
  <div><h1>Estoque</h1><p class="page-subtitle">Catálogo de produtos, custos e margens</p></div>
  <button class="btn btn-primary" id="est-btn-novo"><i data-lucide="plus"></i> Novo Produto</button>
</div>
<div class="filter-bar">
  <div class="search-wrap"><i data-lucide="search"></i><input type="text" id="est-search" placeholder="Buscar produto ou SKU..." /></div>
  <select id="est-cat" style="width:auto"><option value="">Todas categorias</option></select>
  <select id="est-status" style="width:auto">
    <option value="">Todos status</option><option value="ok">OK</option><option value="baixo">Baixo</option><option value="zerado">Zerado</option>
  </select>
</div>
<div class="table-wrapper">
  <table><thead><tr><th>Produto</th><th>Categoria</th><th>Custo</th><th>Margem</th><th>Preço</th><th>Estoque</th><th>Mín.</th><th>Status</th><th>Ações</th></tr></thead>
  <tbody id="est-tbody"></tbody></table>
  <div id="est-empty" class="empty-state hidden"><i data-lucide="package-open"></i><p>Nenhum produto ainda.</p>
    <button class="btn btn-primary" id="est-btn-novo-empty"><i data-lucide="plus"></i> Adicionar</button></div>
</div>`,

init(){
  document.getElementById('est-btn-novo').addEventListener('click',()=>this.openModal());
  document.getElementById('est-btn-novo-empty')?.addEventListener('click',()=>this.openModal());
  document.getElementById('est-search').addEventListener('input',()=>this.render());
  document.getElementById('est-cat').addEventListener('change',()=>this.render());
  document.getElementById('est-status').addEventListener('change',()=>this.render());
  this.render();
},
getStatus(p){ return p.estoque===0?'zerado':p.estoque<=p.minimo?'baixo':'ok'; },
render(){
  const q=document.getElementById('est-search').value.toLowerCase();
  const cat=document.getElementById('est-cat').value;
  const sts=document.getElementById('est-status').value;
  let list=DB.getProdutos().filter(p=>{
    if(q&&!p.nome.toLowerCase().includes(q)&&!p.sku?.toLowerCase().includes(q)) return false;
    if(cat&&p.categoria!==cat) return false;
    if(sts&&this.getStatus(p)!==sts) return false;
    return true;
  });
  // update cats
  const cats=[...new Set(DB.getProdutos().map(p=>p.categoria))].sort();
  const catSel=document.getElementById('est-cat'); const curCat=catSel.value;
  catSel.innerHTML='<option value="">Todas categorias</option>'+cats.map(c=>`<option value="${c}"${c===curCat?' selected':''}>${c}</option>`).join('');
  // datalist for modal
  const tbody=document.getElementById('est-tbody');
  const empty=document.getElementById('est-empty');
  if(!list.length){ tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  const chipMap={ok:'chip-ok',baixo:'chip-baixo',zerado:'chip-zerado'};
  const chipLbl={ok:'OK',baixo:'Baixo',zerado:'Zerado'};
  tbody.innerHTML=list.map(p=>{
    const s=this.getStatus(p);
    const mb=Math.min(100,p.margem);
    return `<tr>
      <td><strong>${p.nome}</strong>${p.sku?`<br><small style="color:var(--t3)">${p.sku}</small>`:''}</td>
      <td>${p.categoria}</td><td>${fmt(p.custo)}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div style="width:50px;height:4px;background:var(--bg-input);border-radius:9px;overflow:hidden">
          <div style="height:100%;width:${mb}%;background:var(--green);border-radius:9px"></div></div>
        ${fmtPct(p.margem)}</div></td>
      <td><strong>${fmt(p.preco)}</strong></td><td>${p.estoque}</td><td>${p.minimo}</td>
      <td><span class="chip ${chipMap[s]}">${chipLbl[s]}</span></td>
      <td style="display:flex;gap:5px">
        <button class="btn-icon" onclick="Hermes.pages.estoque.openModal('${p.id}')" title="Editar"><i data-lucide="pencil"></i></button>
        <button class="btn-icon del" onclick="confirm2('Excluir produto','Excluir <strong>${p.nome.replace(/'/g,"\\'")}',()=>{DB.deleteProduto('${p.id}');Hermes.pages.estoque.render();toast('Produto excluído.','warning');updateGlobalStatus();})" title="Excluir"><i data-lucide="trash-2"></i></button>
      </td></tr>`;
  }).join('');
  lucide.createIcons({nodes:[document.getElementById('est-tbody')]});
  updateGlobalStatus();
},
openModal(id=null){
  const p=id?DB.getProduto(id):null;
  const v=p?JSON.parse(JSON.stringify(p)):{nome:'',categoria:'',sku:'',custo:'',margem:'',preco:'',estoque:'',minimo:'',descricao:''};
  const cats=[...new Set(DB.getProdutos().map(x=>x.categoria))].sort();
  openModal(`<div class="modal-backdrop">
    <div class="modal-box">
      <div class="modal-header"><h2>${p?'Editar Produto':'Novo Produto'}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group col-2"><label>Nome *</label><input id="mp-nome" value="${v.nome}" placeholder="Ex: Camiseta Básica"></div>
          <div class="form-group"><label>Categoria *</label><input id="mp-cat" value="${v.categoria}" list="mp-cats" placeholder="Ex: Vestuário">
            <datalist id="mp-cats">${cats.map(c=>`<option value="${c}">`).join('')}</datalist></div>
          <div class="form-group"><label>SKU <span style="font-weight:400;color:var(--t3)">(auto pela categoria)</span></label><input id="mp-sku" value="${v.sku||''}" placeholder="Ex: A01"></div>
          <div class="form-group"><label>Custo (R$) *</label><input type="number" id="mp-custo" value="${v.custo}" step="0.01" min="0" placeholder="0,00"></div>
          <div class="form-group"><label>Margem (%) *</label><input type="number" id="mp-margem" value="${v.margem}" step="0.1" min="0" placeholder="30"></div>
          <div class="form-group"><label>Preço Venda</label><input type="number" id="mp-preco" value="${v.preco}" readonly></div>
          <div class="form-group"><label>Estoque *</label><input type="number" id="mp-estoque" value="${v.estoque}" min="0" step="1"></div>
          <div class="form-group"><label>Estoque Mínimo *</label><input type="number" id="mp-minimo" value="${v.minimo}" min="0" step="1"></div>
        </div>
        <div class="pricing-preview">
          <div class="pp-item"><span>Custo</span><strong id="pp-c">${fmt(v.custo)}</strong></div>
          <div class="pp-arrow"><i data-lucide="arrow-right"></i></div>
          <div class="pp-item"><span>Margem</span><strong id="pp-m">${fmtPct(v.margem)}</strong></div>
          <div class="pp-arrow"><i data-lucide="arrow-right"></i></div>
          <div class="pp-item hi"><span>Preço</span><strong id="pp-p">${fmt(v.preco)}</strong></div>
          <div class="pp-item gr"><span>Lucro Unit.</span><strong id="pp-l">${fmt((v.preco||0)-(v.custo||0))}</strong></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="mp-save"><i data-lucide="save"></i> Salvar</button>
      </div>
    </div></div>`);
  const upd=()=>{
    const c=+document.getElementById('mp-custo').value||0;
    const m=+document.getElementById('mp-margem').value||0;
    const pr=+(c*(1+m/100)).toFixed(2);
    document.getElementById('mp-preco').value=pr||'';
    document.getElementById('pp-c').textContent=fmt(c);
    document.getElementById('pp-m').textContent=fmtPct(m);
    document.getElementById('pp-p').textContent=fmt(pr);
    document.getElementById('pp-l').textContent=fmt(pr-c);
  };
  document.getElementById('mp-custo').addEventListener('input',upd);
  document.getElementById('mp-margem').addEventListener('input',upd);

  /* Auto-SKU apenas para produtos novos */
  if(!p){
    const catEl=document.getElementById('mp-cat');
    const skuEl=document.getElementById('mp-sku');
    const genSKU=()=>{
      if(skuEl.dataset.manual) return;
      const cat=catEl.value.trim();
      if(cat){ skuEl.value=DB.generateSKU(cat); }
    };
    skuEl.addEventListener('input',()=>{ skuEl.dataset.manual='1'; });
    catEl.addEventListener('input',genSKU);
    catEl.addEventListener('change',genSKU);
  }

  document.getElementById('mp-save').addEventListener('click',()=>{
    const custo=+document.getElementById('mp-custo').value;
    const margem=+document.getElementById('mp-margem').value;
    const nome=document.getElementById('mp-nome').value.trim();
    const categoria=document.getElementById('mp-cat').value.trim();
    if(!nome||!categoria||isNaN(custo)||isNaN(margem)){ toast('Preencha os campos obrigatórios.','error'); return; }
    DB.saveProduto({...v,id:p?.id||null,nome,categoria,sku:document.getElementById('mp-sku').value.trim(),
      custo,margem,preco:+(custo*(1+margem/100)).toFixed(2),
      estoque:+document.getElementById('mp-estoque').value,
      minimo:+document.getElementById('mp-minimo').value});
    closeModal(); toast(p?'Produto atualizado!':'Produto criado!'); this.render();
  });
}
};
