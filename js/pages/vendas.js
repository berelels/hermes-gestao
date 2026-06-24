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
  <table><thead><tr><th>Data</th><th>Produto(s)</th><th>Canal</th><th>Qtd.</th><th>Total</th><th>Lucro</th><th>Markup</th><th>Ações</th></tr></thead>
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
    const nome=(v.produtoNome||v.itens?.map(i=>i.produtoNome).join(' ')||'').toLowerCase();
    if(q&&!nome.includes(q)) return false;
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
  const st=(a)=>({fat:a.reduce((s,v)=>s+v.total,0),luc:a.reduce((s,v)=>s+v.lucro,0),un:a.reduce((s,v)=>s+(v.quantidade||v.itens?.reduce((x,i)=>x+i.quantidade,0)||0),0)});
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
  tbody.innerHTML=list.map(v=>{
    // support both old single-item and new multi-item
    const totalQtd=v.quantidade||(v.itens?.reduce((s,i)=>s+i.quantidade,0)||0);
    const nomeProd=v.produtoNome||(v.itens?.map(i=>`${i.quantidade}× ${i.produtoNome}`).join(', ')||'—');
    const mkup=v.total>0?fmtPct(v.lucro/v.total*100):'—';
    return `<tr>
    <td style="white-space:nowrap">${fmtDT(v.data)}</td>
    <td><strong style="font-size:13px">${nomeProd}</strong></td>
    <td><span class="chip chip-aberta" style="font-size:10px">${v.canal||'—'}</span></td>
    <td>${totalQtd}</td>
    <td><strong>${fmt(v.total)}</strong></td>
    <td style="color:var(--green)">${fmt(v.lucro)}</td>
    <td>${mkup}</td>
    <td><button class="btn-icon del" onclick="Hermes.pages.vendas._excluir('${v.id}')" title="Excluir"><i data-lucide="trash-2"></i></button></td>
  </tr>`;
  }).join('');
  lucide.createIcons({nodes:[tbody]});
},

_excluir(vid){
  confirm2('Excluir venda','Esta ação não pode ser desfeita. O estoque será restaurado.',()=>{
    const _v=DB.getVendas().find(x=>x.id===vid);
    if(_v){
      // restore estoque for each item
      const itens=_v.itens||[{produtoId:_v.produtoId,quantidade:_v.quantidade}];
      itens.forEach(it=>{
        const _p=DB.getProduto(it.produtoId);
        if(_p){ _p.estoque+=it.quantidade; DB.saveProduto(_p); }
      });
      const movs=DB.getMovimentos().filter(m=>m.referencia===vid);
      movs.forEach(m=>DB.deleteMovimento(m.id));
    }
    DB.deleteVenda(vid);
    Hermes.pages.vendas.render(); updateGlobalStatus();
    toast('Venda excluída e estoque restaurado.','warning');
  });
},

/* ── Modal de venda multi-produto ── */
openModal(){
  const caixa=DB.getCaixaAberto();
  if(!caixa){
    toast('Caixa fechado! Abra o caixa antes de registrar vendas.','error',5000);
    openModal(`<div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="modal-header"><h2>Caixa Fechado</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
        <div class="modal-body"><p style="color:var(--t2);line-height:1.7">O caixa precisa estar <strong>aberto</strong> para registrar vendas.<br><br>Vá até a aba <strong>Financeiro</strong> para abrir o caixa.</p></div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-close-modal>Cancelar</button>
          <button class="btn btn-primary" onclick="closeModal();Hermes.navigate('financeiro')"><i data-lucide="landmark"></i> Ir para Financeiro</button>
        </div>
      </div></div>`);
    return;
  }

  // cart state
  const cart=[];
  const prods=DB.getProdutos().filter(p=>p.estoque>0);

  openModal(`<div class="modal-backdrop">
    <div class="modal-box modal-lg">
      <div class="modal-header"><h2>Registrar Venda</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <!-- Busca de produto -->
        <div class="form-group" style="margin-bottom:8px">
          <label>Adicionar Produto</label>
          <div class="venda-search-wrap">
            <input type="text" id="mv-busca" placeholder="🔍 Buscar por nome, SKU ou cód. barras..." autocomplete="off">
            <div id="mv-dropdown" class="venda-dropdown hidden"></div>
          </div>
        </div>
        <!-- Carrinho -->
        <div id="mv-cart-area" style="margin-bottom:12px">
          <div id="mv-cart-empty" style="text-align:center;color:var(--t3);padding:16px 0;font-size:13px">Nenhum produto adicionado ainda.</div>
          <table id="mv-cart-table" class="venda-cart-table" style="display:none">
            <thead><tr><th>Produto</th><th>Estoque</th><th>Qtd.</th><th>Preço Unit.</th><th>Subtotal</th><th></th></tr></thead>
            <tbody id="mv-cart-tbody"></tbody>
          </table>
        </div>
        <!-- Totais + canal -->
        <div class="venda-preview" id="mv-totais" style="display:none">
          <div class="vp-row"><span>Total de itens:</span><strong id="mv-t-itens">—</strong></div>
          <div class="vp-row"><span>Total geral:</span><strong id="mv-t-total" class="vp-hi">—</strong></div>
          <div class="vp-row"><span>Lucro estimado:</span><strong id="mv-t-lucro" class="vp-gr">—</strong></div>
        </div>
        <div class="form-grid" style="margin-top:12px">
          <div class="form-group">
            <label>Data/Hora *</label>
            <input type="datetime-local" id="mv-data" value="${new Date().toISOString().slice(0,16)}">
          </div>
          <div class="form-group">
            <label>Canal</label>
            <select id="mv-canal">
              <option value="loja">Loja Física</option><option value="online">Online</option>
              <option value="whatsapp">WhatsApp</option><option value="marketplace">Marketplace</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="mv-save"><i data-lucide="check"></i> Confirmar Venda</button>
      </div>
    </div></div>`);

  /* ── Busca híbrida ── */
  const buscaEl=document.getElementById('mv-busca');
  const dropEl=document.getElementById('mv-dropdown');

  const renderDrop=(q)=>{
    const term=q.toLowerCase().trim();
    const res=term.length===0
      ? prods.slice(0,12)
      : prods.filter(p=>p.nome.toLowerCase().includes(term)||p.sku?.toLowerCase().includes(term)||p.codigoBarras?.includes(term)).slice(0,10);
    if(!res.length){ dropEl.innerHTML='<div class="vd-item vd-none">Nenhum produto encontrado</div>'; }
    else dropEl.innerHTML=res.map(p=>`<div class="vd-item" data-id="${p.id}">
      <div class="vd-nome">${p.nome}</div>
      <div class="vd-meta">${p.sku||''}${p.codigoBarras?' · 🔖'+p.codigoBarras:''} · estoque: <strong>${p.estoque}</strong> · ${fmt(p.preco)}</div>
    </div>`).join('');
    dropEl.classList.remove('hidden');
    dropEl.querySelectorAll('.vd-item[data-id]').forEach(el=>el.addEventListener('click',()=>{
      addToCart(DB.getProduto(el.dataset.id));
      buscaEl.value=''; dropEl.classList.add('hidden');
    }));
  };
  buscaEl.addEventListener('focus',()=>renderDrop(buscaEl.value));
  buscaEl.addEventListener('input',()=>renderDrop(buscaEl.value));
  document.addEventListener('click',(e)=>{ if(!e.target.closest('.venda-search-wrap')) dropEl.classList.add('hidden'); },{once:false,capture:false});

  /* ── Carrinho ── */
  const addToCart=(prod)=>{
    if(!prod) return;
    const existing=cart.find(i=>i.produtoId===prod.id);
    if(existing){ existing.quantidade=Math.min(existing.quantidade+1,prod.estoque); }
    else cart.push({produtoId:prod.id,produtoNome:prod.nome,categoria:prod.categoria,
      custoUnit:+(prod.custo*(1+(prod.impostoPercent||0)/100)).toFixed(2),
      precoUnit:prod.preco,quantidade:1,estoque:prod.estoque});
    renderCart();
  };

  const renderCart=()=>{
    const tbody=document.getElementById('mv-cart-tbody');
    const table=document.getElementById('mv-cart-table');
    const empty=document.getElementById('mv-cart-empty');
    const totais=document.getElementById('mv-totais');
    if(!cart.length){ table.style.display='none'; empty.style.display=''; totais.style.display='none'; return; }
    table.style.display=''; empty.style.display='none'; totais.style.display='flex';
    tbody.innerHTML=cart.map((it,idx)=>`<tr>
      <td><strong>${it.produtoNome}</strong></td>
      <td>${it.estoque}</td>
      <td><input type="number" class="cart-qty" data-idx="${idx}" value="${it.quantidade}" min="1" max="${it.estoque}" style="width:60px;text-align:center"></td>
      <td><input type="number" class="cart-preco" data-idx="${idx}" value="${it.precoUnit}" step="0.01" min="0" style="width:90px;text-align:right"></td>
      <td><strong>${fmt(it.precoUnit*it.quantidade)}</strong></td>
      <td><button class="btn-icon del" data-rm="${idx}"><i data-lucide="x"></i></button></td>
    </tr>`).join('');
    lucide.createIcons({nodes:[tbody]});
    // bind inputs
    tbody.querySelectorAll('.cart-qty').forEach(el=>el.addEventListener('input',()=>{
      const i=+el.dataset.idx; cart[i].quantidade=Math.min(Math.max(1,+el.value||1),cart[i].estoque); renderCart();
    }));
    tbody.querySelectorAll('.cart-preco').forEach(el=>el.addEventListener('input',()=>{
      const i=+el.dataset.idx; cart[i].precoUnit=+el.value||0; renderCart();
    }));
    tbody.querySelectorAll('[data-rm]').forEach(el=>el.addEventListener('click',()=>{
      cart.splice(+el.dataset.rm,1); renderCart();
    }));
    // totais
    const total=cart.reduce((s,i)=>s+i.precoUnit*i.quantidade,0);
    const lucro=cart.reduce((s,i)=>s+(i.precoUnit-i.custoUnit)*i.quantidade,0);
    const unids=cart.reduce((s,i)=>s+i.quantidade,0);
    document.getElementById('mv-t-itens').textContent=`${cart.length} produto(s) / ${unids} unid.`;
    document.getElementById('mv-t-total').textContent=fmt(total);
    document.getElementById('mv-t-lucro').textContent=fmt(lucro);
  };

  /* ── Salvar ── */
  document.getElementById('mv-save').addEventListener('click',()=>{
    if(!cart.length){ toast('Adicione pelo menos um produto.','error'); return; }
    // validate quantities
    for(const it of cart){
      if(it.quantidade<1||it.quantidade>it.estoque){
        toast(`Quantidade inválida para "${it.produtoNome}" (estoque: ${it.estoque}).`,'error'); return;
      }
      if(!it.precoUnit||it.precoUnit<0){
        toast(`Preço inválido para "${it.produtoNome}".`,'error'); return;
      }
    }
    const data=document.getElementById('mv-data').value;
    const canal=document.getElementById('mv-canal').value;
    const total=+(cart.reduce((s,i)=>s+i.precoUnit*i.quantidade,0)).toFixed(2);
    const lucro=+(cart.reduce((s,i)=>s+(i.precoUnit-i.custoUnit)*i.quantidade,0)).toFixed(2);
    const qtdTotal=cart.reduce((s,i)=>s+i.quantidade,0);

    // Save venda with items array
    const venda=DB.saveVenda({
      itens:cart.map(i=>({produtoId:i.produtoId,produtoNome:i.produtoNome,categoria:i.categoria,
        quantidade:i.quantidade,precoUnit:+i.precoUnit.toFixed(2),custoUnit:i.custoUnit,
        subtotal:+(i.precoUnit*i.quantidade).toFixed(2),
        lucro:+((i.precoUnit-i.custoUnit)*i.quantidade).toFixed(2)})),
      produtoNome:cart.length===1?cart[0].produtoNome:`${cart.length} produtos`,
      quantidade:qtdTotal, total, lucro, data, canal,
    });

    // Baixar estoque + movimento por item
    const cx=DB.getCaixaAberto();
    cart.forEach(it=>{
      const prod=DB.getProduto(it.produtoId);
      if(prod){ prod.estoque-=it.quantidade; DB.saveProduto(prod); }
    });
    if(cx) DB.addMovimento({caixaId:cx.id,tipo:'entrada',categoria:'venda',
      descricao:`Venda: ${venda.produtoNome}`,valor:total,referencia:venda.id,data});

    closeModal(); toast('Venda registrada!'); this.render(); updateGlobalStatus();

    // Verificar estoque mínimo
    const alertas=cart.map(it=>{
      const p=DB.getProduto(it.produtoId);
      return p&&p.estoque<=p.minimo?p:null;
    }).filter(Boolean);
    if(alertas.length){
      const nomes=alertas.map(p=>`<strong>${p.nome}</strong> (${p.estoque} unid.)`).join(', ');
      setTimeout(()=>toast(`⚠️ Estoque baixo ou no mínimo: ${nomes}`,'warning',8000),500);
    }
  });
}
};
