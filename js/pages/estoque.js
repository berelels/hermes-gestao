'use strict';
/* ══ HERMES — Page: Estoque ══ */
Hermes.pages.estoque = {
template: `
<div class="page-header">
  <div><h1>Estoque</h1><p class="page-subtitle">Catálogo de produtos, custos e markup</p></div>
  <div style="display:flex;gap:8px">
    <button class="btn btn-ghost" id="est-btn-importar"><i data-lucide="file-spreadsheet"></i> Importar Planilha</button>
    <button class="btn btn-primary" id="est-btn-novo"><i data-lucide="plus"></i> Novo Produto</button>
  </div>
</div>
<div class="filter-bar">
  <div class="search-wrap"><i data-lucide="search"></i><input type="text" id="est-search" placeholder="Buscar produto, SKU ou cód. barras..." /></div>
  <select id="est-cat" style="width:auto"><option value="">Todas categorias</option></select>
  <select id="est-status" style="width:auto">
    <option value="">Todos status</option><option value="ok">OK</option><option value="baixo">Baixo</option><option value="zerado">Zerado</option>
  </select>
  <select id="est-markup" style="width:auto">
    <option value="">Todo markup</option>
    <option value="alto">🟢 Alto (≥25%)</option>
    <option value="medio">🟡 Médio (20–25%)</option>
    <option value="baixo">🔴 Baixo (12–20%)</option>
    <option value="critico">⚫ Crítico (&lt;12%)</option>
  </select>
</div>
<div class="table-wrapper">
  <table><thead><tr><th>Produto</th><th>Categoria</th><th>Custo s/imp.</th><th>Imposto</th><th>Markup</th><th>Preço</th><th>Estoque</th><th>Mín.</th><th>Status</th><th>Ações</th></tr></thead>
  <tbody id="est-tbody"></tbody></table>
  <div id="est-empty" class="empty-state hidden"><i data-lucide="package-open"></i><p>Nenhum produto ainda.</p>
    <button class="btn btn-primary" id="est-btn-novo-empty"><i data-lucide="plus"></i> Adicionar</button></div>
</div>`,

init(){
  document.getElementById('est-btn-novo').addEventListener('click',()=>this.openModal());
  document.getElementById('est-btn-novo-empty')?.addEventListener('click',()=>this.openModal());
  document.getElementById('est-btn-importar').addEventListener('click',()=>this.importarPlanilha());
  document.getElementById('est-search').addEventListener('input',()=>this.render());
  document.getElementById('est-cat').addEventListener('change',()=>this.render());
  document.getElementById('est-status').addEventListener('change',()=>this.render());
  document.getElementById('est-markup').addEventListener('change',()=>this.render());
  this.render();
},
getStatus(p){ return p.estoque===0?'zerado':p.estoque<=p.minimo?'baixo':'ok'; },
markupColor(mk){
  if(mk>=25) return {cls:'chip-markup-alto',   lbl:'Alto',   bar:'var(--green)'};
  if(mk>=20) return {cls:'chip-markup-medio',  lbl:'Médio',  bar:'var(--yellow)'};
  if(mk>=12) return {cls:'chip-markup-baixo',  lbl:'Baixo',  bar:'var(--orange)'};
  return           {cls:'chip-markup-critico', lbl:'Crítico',bar:'var(--red)'};
},
render(){
  const q=document.getElementById('est-search').value.toLowerCase();
  const cat=document.getElementById('est-cat').value;
  const sts=document.getElementById('est-status').value;
  const mkf=document.getElementById('est-markup').value;
  let list=DB.getProdutos().filter(p=>{
    if(q&&!p.nome.toLowerCase().includes(q)&&!p.sku?.toLowerCase().includes(q)&&!p.codigoBarras?.includes(q)) return false;
    if(cat&&p.categoria!==cat) return false;
    if(sts&&this.getStatus(p)!==sts) return false;
    if(mkf&&DB.markupClass(DB.calcMarkup(p))!==mkf) return false;
    return true;
  });
  // update cats
  const cats=[...new Set(DB.getProdutos().map(p=>p.categoria))].sort();
  const catSel=document.getElementById('est-cat'); const curCat=catSel.value;
  catSel.innerHTML='<option value="">Todas categorias</option>'+cats.map(c=>`<option value="${c}"${c===curCat?' selected':''}>${c}</option>`).join('');
  const tbody=document.getElementById('est-tbody');
  const empty=document.getElementById('est-empty');
  if(!list.length){ tbody.innerHTML=''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  const chipMap={ok:'chip-ok',baixo:'chip-baixo',zerado:'chip-zerado'};
  const chipLbl={ok:'OK',baixo:'Baixo',zerado:'Zerado'};
  tbody.innerHTML=list.map(p=>{
    const s=this.getStatus(p);
    const mk=DB.calcMarkup(p);
    const mc=this.markupColor(mk);
    const barW=Math.min(100,Math.max(0,mk));
    return `<tr>
      <td><strong>${p.nome}</strong>${p.sku?`<br><small style="color:var(--t3)">${p.sku}</small>`:''}${p.codigoBarras?`<br><small style="color:var(--t3);font-size:10px">🔖 ${p.codigoBarras}</small>`:''}</td>
      <td>${p.categoria}</td>
      <td>${fmt(p.custo)}</td>
      <td>${p.impostos?.length?p.impostos.map(i=>`<span class="chip" style="font-size:10px;margin:1px">${i.nome} ${fmtPct(i.valor)}</span>`).join('')+`<br><small style="color:var(--t3)">${fmtPct(p.impostoPercent||0)} total</small>`:'—'}</td>
      <td><div style="display:flex;align-items:center;gap:6px">
        <div style="width:50px;height:4px;background:var(--bg-input);border-radius:9px;overflow:hidden">
          <div style="height:100%;width:${barW}%;background:${mc.bar};border-radius:9px"></div></div>
        <span class="chip ${mc.cls}" style="font-size:10px;padding:2px 6px">${mc.lbl}</span>
        <span style="font-size:11px;color:var(--t2)">${fmtPct(mk)}</span></div></td>
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
  const v=p?JSON.parse(JSON.stringify(p)):{nome:'',categoria:'',sku:'',codigoBarras:'',impostos:[],custo:'',preco:'',estoque:'',minimo:'',descricao:''};
  // compat: migrate old impostoPercent
  if(!v.impostos||!v.impostos.length) v.impostos=v.impostoPercent?[{nome:'Imposto',valor:v.impostoPercent}]:[];
  const cats=[...new Set(DB.getProdutos().map(x=>x.categoria))].filter(Boolean).sort();
  const hasBarcodeAPI=('BarcodeDetector' in window);
  const totalImp=()=>v.impostos.reduce((s,i)=>s+(+i.valor||0),0);
  const initMk=DB.calcMarkup(v)||'';
  const initCi=+(( (v.custo||0)*(1+totalImp()/100) )).toFixed(2);

  openModal(`<div class="modal-backdrop">
    <div class="modal-box modal-lg">
      <div class="modal-header"><h2>${p?'Editar Produto':'Novo Produto'}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group col-2"><label>Nome *</label><input id="mp-nome" value="${v.nome}" placeholder="Ex: Camiseta Básica"></div>
          <div class="form-group">
            <label>Categoria *</label>
            <select id="mp-cat-sel">
              <option value="">— Selecione —</option>
              ${cats.map(c=>`<option value="${c}"${c===v.categoria?' selected':''}>${c}</option>`).join('')}
              <option value="__nova__">+ Nova categoria...</option>
            </select>
            <input id="mp-cat-nova" placeholder="Digite a nova categoria..." style="display:none;margin-top:6px">
          </div>
          <div class="form-group"><label>SKU</label><input id="mp-sku" value="${v.sku||''}" placeholder="Auto pela categoria"></div>
          <div class="form-group">
            <label>Código de Barras</label>
            <div style="display:flex;gap:6px">
              <input id="mp-barras" value="${v.codigoBarras||''}" placeholder="EAN-13, QR..." style="flex:1">
              ${hasBarcodeAPI?`<button type="button" class="btn btn-ghost btn-sm" id="mp-scan-btn"><i data-lucide="scan-barcode"></i></button>`:''}
            </div>
          </div>
          <div class="form-group"><label>Custo sem Impostos (R$) *</label><input type="number" id="mp-custo" value="${v.custo}" step="0.01" min="0" placeholder="0,00"></div>
          <div class="form-group"><label>Custo c/ Impostos</label><input type="number" id="mp-custo-ci" value="${initCi||''}" readonly style="opacity:.7"></div>
          <div class="form-group"><label>Markup (%) *</label><input type="number" id="mp-markup" value="${initMk}" step="0.1" min="0" placeholder="30"></div>
          <div class="form-group"><label>Preço de Venda</label><input type="number" id="mp-preco" value="${v.preco}" readonly style="opacity:.7"></div>
          <div class="form-group"><label>Estoque *</label><input type="number" id="mp-estoque" value="${v.estoque}" min="0" step="1"></div>
          <div class="form-group"><label>Estoque Mínimo *</label><input type="number" id="mp-minimo" value="${v.minimo}" min="0" step="1"></div>
        </div>
        <!-- IMPOSTOS -->
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <label style="font-size:11.5px;font-weight:600;color:var(--t2)">Impostos</label>
            <button type="button" class="btn btn-ghost btn-sm" id="mp-add-imp"><i data-lucide="plus"></i> Adicionar</button>
          </div>
          <div id="mp-imp-list"></div>
          <div id="mp-imp-total" style="font-size:12px;color:var(--t3);margin-top:4px"></div>
        </div>
        <!-- PREVIEW -->
        <div class="pricing-preview">
          <div class="pp-item"><span>Custo s/imp</span><strong id="pp-c">${fmt(v.custo)}</strong></div>
          <div class="pp-arrow"><i data-lucide="arrow-right"></i></div>
          <div class="pp-item"><span>Impostos</span><strong id="pp-imp">${fmtPct(totalImp())}</strong></div>
          <div class="pp-arrow"><i data-lucide="arrow-right"></i></div>
          <div class="pp-item"><span>Markup</span><strong id="pp-m">${fmtPct(initMk)}</strong></div>
          <div class="pp-arrow"><i data-lucide="arrow-right"></i></div>
          <div class="pp-item hi"><span>Preço</span><strong id="pp-p">${fmt(v.preco)}</strong></div>
          <div class="pp-item gr"><span>Lucro Unit.</span><strong id="pp-l">${fmt((v.preco||0)-initCi)}</strong></div>
        </div>
        <div id="mp-markup-alert" style="margin-top:8px"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" data-close-modal>Cancelar</button>
        <button class="btn btn-primary" id="mp-save"><i data-lucide="save"></i> Salvar</button>
      </div>
    </div></div>`);

  // ── Render lista de impostos ──
  const renderImpostos=()=>{
    const list=document.getElementById('mp-imp-list');
    list.innerHTML=v.impostos.length?v.impostos.map((imp,idx)=>`
      <div class="imp-row" style="display:flex;gap:6px;margin-bottom:4px">
        <input class="imp-nome" data-idx="${idx}" value="${imp.nome}" placeholder="Ex: ICMS" style="flex:2">
        <input type="number" class="imp-val" data-idx="${idx}" value="${imp.valor}" step="0.01" min="0" placeholder="%" style="flex:1">
        <span style="display:flex;align-items:center;color:var(--t3);font-size:12px">%</span>
        <button class="btn-icon del imp-rm" data-idx="${idx}"><i data-lucide="x"></i></button>
      </div>`).join(''):'<p style="font-size:12px;color:var(--t3)">Nenhum imposto. Clique em Adicionar.</p>';
    lucide.createIcons({nodes:[list]});
    list.querySelectorAll('.imp-nome').forEach(el=>el.addEventListener('input',()=>{v.impostos[+el.dataset.idx].nome=el.value;upd();}));
    list.querySelectorAll('.imp-val').forEach(el=>el.addEventListener('input',()=>{v.impostos[+el.dataset.idx].valor=+el.value||0;upd();}));
    list.querySelectorAll('.imp-rm').forEach(el=>el.addEventListener('click',()=>{v.impostos.splice(+el.dataset.idx,1);renderImpostos();upd();}));
    const tot=totalImp();
    document.getElementById('mp-imp-total').textContent=v.impostos.length?`Total impostos: ${fmtPct(tot)}`:'';
  };
  document.getElementById('mp-add-imp').addEventListener('click',()=>{v.impostos.push({nome:'',valor:0});renderImpostos();upd();});
  renderImpostos();

  // ── Recalcular preview ──
  const upd=()=>{
    const c=+document.getElementById('mp-custo').value||0;
    const tot=totalImp();
    const mk=+document.getElementById('mp-markup').value||0;
    const ci=+(c*(1+tot/100)).toFixed(2);
    const pr=+(ci*(1+mk/100)).toFixed(2);
    document.getElementById('mp-custo-ci').value=ci||'';
    document.getElementById('mp-preco').value=pr||'';
    document.getElementById('pp-c').textContent=fmt(c);
    document.getElementById('pp-imp').textContent=fmtPct(tot);
    document.getElementById('pp-m').textContent=fmtPct(mk);
    document.getElementById('pp-p').textContent=fmt(pr);
    document.getElementById('pp-l').textContent=fmt(pr-ci);
    const al=document.getElementById('mp-markup-alert');
    const mc=DB.markupColor(mk);
    const lbl={alto:'Alta ✅',medio:'Média ⚠️',baixo:'Baixa 🔴',critico:'Crítico ⛔'};
    al.innerHTML=mk>0?`<div class="markup-alert-bar ${mc.cls}">Markup: <strong>${lbl[DB.markupClass(mk)]}</strong></div>`:'';
    if(mk>0)lucide.createIcons({nodes:[al]});
  };
  document.getElementById('mp-custo').addEventListener('input',upd);
  document.getElementById('mp-markup').addEventListener('input',upd);
  upd();

  // ── Categoria: fix display ──
  const catSel=document.getElementById('mp-cat-sel');
  const catNova=document.getElementById('mp-cat-nova');
  const showNova=(show)=>{ catNova.style.display=show?'block':'none'; if(show)catNova.focus(); };
  catSel.addEventListener('change',()=>{ showNova(catSel.value==='__nova__'); if(!p)genSKU(); });
  if(v.categoria&&!cats.includes(v.categoria)){ catSel.value='__nova__'; catNova.value=v.categoria; showNova(true); }

  // ── Auto-SKU ──
  const skuEl=document.getElementById('mp-sku');
  const genSKU=()=>{ if(skuEl.dataset.manual)return; const cat=catSel.value==='__nova__'?catNova.value.trim():catSel.value; if(cat)skuEl.value=DB.generateSKU(cat); };
  if(!p){ skuEl.addEventListener('input',()=>{skuEl.dataset.manual='1';}); catNova.addEventListener('input',genSKU); }

  // ── Barcode scan ──
  if(hasBarcodeAPI) document.getElementById('mp-scan-btn')?.addEventListener('click',()=>this.scanBarcode());

  // ── Salvar ──
  document.getElementById('mp-save').addEventListener('click',()=>{
    const custo=+document.getElementById('mp-custo').value;
    const mk=+document.getElementById('mp-markup').value;
    const nome=document.getElementById('mp-nome').value.trim();
    const cat=catSel.value==='__nova__'?catNova.value.trim():catSel.value;
    if(!nome||!cat||isNaN(custo)||isNaN(mk)){ toast('Preencha os campos obrigatórios.','error'); return; }
    const tot=totalImp();
    const ci=+(custo*(1+tot/100)).toFixed(2);
    const preco=+(ci*(1+mk/100)).toFixed(2);
    DB.saveProduto({...v,id:p?.id||null,nome,categoria:cat,
      sku:document.getElementById('mp-sku').value.trim(),
      codigoBarras:document.getElementById('mp-barras').value.trim(),
      impostos:v.impostos,impostoPercent:tot,custo,preco,
      estoque:+document.getElementById('mp-estoque').value,
      minimo:+document.getElementById('mp-minimo').value});
    closeModal(); toast(p?'Produto atualizado!':'Produto criado!'); this.render();
  });
},

/* Importar XLSX */
importarPlanilha(){
  if(typeof XLSX==='undefined'){ toast('Biblioteca XLSX não carregada.','error'); return; }
  const input=document.createElement('input'); input.type='file'; input.accept='.xlsx,.xls,.csv';
  input.onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const wb=XLSX.read(ev.target.result,{type:'binary'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(rows.length<2){ toast('Planilha vazia ou sem dados.','warning'); return; }
      // detectar linha de cabeçalho: primeira linha que tenha >3 células não vazias
      let hdrIdx=0;
      for(let i=0;i<Math.min(rows.length,15);i++){
        if(rows[i].filter(c=>String(c).trim()).length>3){ hdrIdx=i; break; }
      }
      const headers=rows[hdrIdx].map((h,i)=>({label:String(h).trim()||`Col ${i+1}`,idx:i}));
      const dataRows=rows.slice(hdrIdx+1).filter(r=>r.some(c=>String(c).trim()));
      // auto-mapear
      const autoMap=(kws)=>{ const lc=kws.map(k=>k.toLowerCase()); return headers.find(h=>lc.some(k=>h.label.toLowerCase().includes(k)))?.idx??''; };
      const mNome=autoMap(['descrição','descricao','nome','produto']);
      const mBarras=autoMap(['ean','gtin','código de barras','barcode','cód. produto']);
      const mPreco=autoMap(['preço','preco','price','valor venda','p. venda']);
      const mCusto=autoMap(['custo','cost']);
      const mCat=autoMap(['categoria','grupo','departamento']);
      const mSku=autoMap(['sku','cod.','código','cód. fornec']);
      const mkOpts=(selected)=>headers.map(h=>`<option value="${h.idx}"${h.idx===selected?' selected':''}>${h.label}</option>`).join('');
      openModal(`<div class="modal-backdrop"><div class="modal-box modal-lg">
        <div class="modal-header"><h2>Importar Planilha — ${file.name}</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
        <div class="modal-body">
          <p style="color:var(--t2);margin-bottom:14px;font-size:13px">Linha de cabeçalho detectada: <strong>#${hdrIdx+1}</strong> · <strong>${dataRows.length}</strong> produtos encontrados</p>
          <div class="form-grid">
            <div class="form-group"><label>Nome / Descrição *</label><select id="imp-nome"><option value="">— ignorar —</option>${mkOpts(mNome)}</select></div>
            <div class="form-group"><label>Código de Barras (EAN)</label><select id="imp-barras"><option value="">— ignorar —</option>${mkOpts(mBarras)}</select></div>
            <div class="form-group"><label>Preço de Venda</label><select id="imp-preco"><option value="">— ignorar —</option>${mkOpts(mPreco)}</select></div>
            <div class="form-group"><label>Custo</label><select id="imp-custo"><option value="">— ignorar —</option>${mkOpts(mCusto)}</select></div>
            <div class="form-group"><label>Categoria</label><select id="imp-cat"><option value="">— ignorar —</option>${mkOpts(mCat)}</select></div>
            <div class="form-group"><label>SKU</label><select id="imp-sku"><option value="">— ignorar —</option>${mkOpts(mSku)}</select></div>
            <div class="form-group"><label>Estoque Inicial (fixo)</label><input type="number" id="imp-est" value="0" min="0"></div>
            <div class="form-group"><label>Estoque Mínimo (fixo)</label><input type="number" id="imp-min" value="5" min="0"></div>
          </div>
          <div style="max-height:150px;overflow-y:auto;margin-top:8px">
            <table style="width:100%;font-size:11px;border-collapse:collapse">
              <thead><tr>${headers.map(h=>`<th style="padding:4px 8px;background:var(--bg-card2);border:1px solid var(--border)">${h.label}</th>`).join('')}</tr></thead>
              <tbody>${dataRows.slice(0,5).map(r=>`<tr>${headers.map(h=>`<td style="padding:3px 8px;border:1px solid var(--border);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r[h.idx]??''}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-close-modal>Cancelar</button>
          <button class="btn btn-primary" id="imp-ok"><i data-lucide="download"></i> Importar</button>
        </div>
      </div></div>`);
      document.getElementById('imp-ok').addEventListener('click',()=>{
        const gv=(id)=>{ const v=document.getElementById(id).value; return v===''?null:+v; };
        const gi=(id)=>{ const v=document.getElementById(id).value; return v===''?null:+v; };
        const nomIdx=gi('imp-nome'); if(nomIdx===null){ toast('Mapeie o campo Nome.','error'); return; }
        const barIdx=gi('imp-barras'), preIdx=gi('imp-preco'), cusIdx=gi('imp-custo'), catIdx=gi('imp-cat'), skuIdx=gi('imp-sku');
        const estIni=+document.getElementById('imp-est').value||0;
        const estMin=+document.getElementById('imp-min').value||0;
        let cnt=0;
        dataRows.forEach(r=>{
          const nome=String(r[nomIdx]??'').trim(); if(!nome) return;
          const obj={nome,categoria:catIdx!==null?String(r[catIdx]??'').trim()||'Importado':'Importado',
            sku:skuIdx!==null?String(r[skuIdx]??'').trim():'',
            codigoBarras:barIdx!==null?String(r[barIdx]??'').trim():'',
            impostos:[],impostoPercent:0,
            custo:cusIdx!==null?+(String(r[cusIdx]).replace(',','.')||0):0,
            preco:preIdx!==null?+(String(r[preIdx]).replace(',','.')||0):0,
            estoque:estIni,minimo:estMin};
          DB.saveProduto(obj); cnt++;
        });
        closeModal(); toast(`${cnt} produtos importados!`,'success'); this.render(); updateGlobalStatus();
      });
    };
    reader.readAsBinaryString(file);
  };
  input.click();
},

/* Scan via BarcodeDetector API */
async scanBarcode(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    openModal(`<div class="modal-backdrop">
      <div class="modal-box modal-sm">
        <div class="modal-header"><h2>Escanear Código</h2><button class="modal-close" id="scan-close"><i data-lucide="x"></i></button></div>
        <div class="modal-body" style="padding:0">
          <video id="scan-video" autoplay playsinline style="width:100%;border-radius:0 0 8px 8px;max-height:280px;object-fit:cover"></video>
          <p style="padding:12px;text-align:center;color:var(--t2);font-size:13px">Aponte a câmera para o código de barras</p>
        </div>
      </div></div>`);
    lucide.createIcons({nodes:[document.getElementById('modal-container')]});
    const video=document.getElementById('scan-video');
    video.srcObject=stream;
    const detector=new BarcodeDetector({formats:['ean_13','ean_8','qr_code','code_128','code_39','upc_a','upc_e']});
    let active=true;
    const stop=()=>{ active=false; stream.getTracks().forEach(t=>t.stop()); };
    document.getElementById('scan-close').addEventListener('click',()=>{ stop(); closeModal(); });
    const scan=async()=>{
      if(!active) return;
      try{
        const results=await detector.detect(video);
        if(results.length>0){
          const code=results[0].rawValue;
          stop(); closeModal();
          // try to re-open same modal context — we just fill the field
          const barEl=document.getElementById('mp-barras');
          if(barEl){ barEl.value=code; toast('Código lido: '+code,'info'); }
          else { toast('Código: '+code+' (cole manualmente se necessário)','info',6000); }
          return;
        }
      }catch(e){}
      if(active) requestAnimationFrame(scan);
    };
    video.addEventListener('play',()=>requestAnimationFrame(scan));
  }catch(e){
    toast('Câmera não disponível: '+e.message,'error');
  }
}
};
