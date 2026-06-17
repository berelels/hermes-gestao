'use strict';
/* ══ HERMES — Page: Nota Fiscal ══ */
Hermes.pages.notafiscal = {
_itens: [],
template: `
<div class="page-header">
  <div><h1>Nota Fiscal</h1><p class="page-subtitle">Emissão de NF simplificada para controle interno</p></div>
</div>
<div class="nf-layout">
  <!-- EMITIR NF -->
  <div class="chart-card">
    <div class="chart-card-header"><h2>Nova Nota Fiscal</h2></div>
    <div class="form-grid">
      <div class="form-group col-2"><label>Cliente / Destinatário *</label>
        <input type="text" id="nf-cliente" list="nf-clientes-dl" placeholder="Nome do cliente">
        <datalist id="nf-clientes-dl"></datalist>
      </div>
      <div class="form-group"><label>CPF / CNPJ</label><input type="text" id="nf-cpfcnpj" placeholder="000.000.000-00"></div>
      <div class="form-group"><label>Data de Emissão</label><input type="date" id="nf-data" value="${new Date().toISOString().slice(0,10)}"></div>
      <div class="form-group col-2"><label>Endereço</label><input type="text" id="nf-end" placeholder="Rua, nº, cidade - UF"></div>
      <div class="form-group col-2"><label>Observações</label><textarea id="nf-obs" rows="2" placeholder="Informações adicionais..."></textarea></div>
    </div>
    <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px">
      <div style="display:flex;align-items:flex-end;gap:8px;margin-bottom:10px">
        <div class="form-group" style="flex:2"><label>Produto</label>
          <select id="nf-prod"><option value="">Selecione...</option></select></div>
        <div class="form-group" style="flex:1"><label>Qtd.</label><input type="number" id="nf-qty" value="1" min="1" step="1"></div>
        <div class="form-group" style="flex:1"><label>Preço Unit.</label><input type="number" id="nf-preco" step="0.01" min="0" placeholder="0,00"></div>
        <button class="btn btn-primary btn-sm" id="nf-add-item" style="height:35px;align-self:flex-end"><i data-lucide="plus"></i></button>
      </div>
      <div id="nf-itens-table"></div>
      <div class="nf-total-row">
        <span>Desconto:</span>
        <input type="number" id="nf-desconto" value="0" min="0" step="0.01" style="width:90px;text-align:right">
        <span>Total:</span>
        <strong id="nf-total-val">R$ 0,00</strong>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">
      <button class="btn btn-ghost" id="nf-limpar"><i data-lucide="trash-2"></i> Limpar</button>
      <button class="btn btn-primary" id="nf-emitir"><i data-lucide="file-plus"></i> Emitir NF</button>
    </div>
  </div>
  <!-- HISTÓRICO -->
  <div class="chart-card">
    <div class="chart-card-header"><h2>Notas Emitidas</h2></div>
    <div id="nf-historico"></div>
  </div>
</div>`,

init(){
  this._itens=[];
  this.populateClientes();
  this.populateProdutos();
  document.getElementById('nf-prod').addEventListener('change',()=>{
    const opt=document.getElementById('nf-prod').selectedOptions[0];
    if(opt?.dataset.preco) document.getElementById('nf-preco').value=opt.dataset.preco;
  });
  document.getElementById('nf-add-item').addEventListener('click',()=>this.addItem());
  document.getElementById('nf-desconto').addEventListener('input',()=>this.updateTotal());
  document.getElementById('nf-limpar').addEventListener('click',()=>this.limpar());
  document.getElementById('nf-emitir').addEventListener('click',()=>this.emitir());
  this.renderItens();
  this.renderHistorico();
},
populateClientes(){
  const dl=document.getElementById('nf-clientes-dl');
  DB.getClientes().forEach(c=>{ const o=document.createElement('option'); o.value=c.nome; dl.appendChild(o); });
},
populateProdutos(){
  const sel=document.getElementById('nf-prod');
  sel.innerHTML='<option value="">Selecione um produto...</option>';
  DB.getProdutos().forEach(p=>{
    const o=document.createElement('option'); o.value=p.id; o.textContent=`${p.nome} (${p.estoque} unid.)`;
    o.dataset.preco=p.preco; o.dataset.nome=p.nome; o.dataset.custo=p.custo; o.dataset.est=p.estoque;
    sel.appendChild(o);
  });
},
addItem(){
  const opt=document.getElementById('nf-prod').selectedOptions[0];
  if(!opt?.value){ toast('Selecione um produto.','error'); return; }
  const qty=+document.getElementById('nf-qty').value||1;
  const preco=+document.getElementById('nf-preco').value;
  if(!preco){ toast('Informe o preço.','error'); return; }
  const existing=this._itens.find(i=>i.id===opt.value);
  if(existing){ existing.quantidade+=qty; existing.total=+(existing.precoUnit*existing.quantidade).toFixed(2); }
  else { this._itens.push({id:opt.value,nome:opt.dataset.nome,quantidade:qty,precoUnit:preco,custo:+opt.dataset.custo,total:+(preco*qty).toFixed(2)}); }
  this.renderItens(); this.updateTotal();
},
renderItens(){
  const el=document.getElementById('nf-itens-table');
  if(!this._itens.length){ el.innerHTML='<p style="color:var(--t3);font-size:13px;text-align:center;padding:12px">Nenhum item adicionado.</p>'; return; }
  el.innerHTML=`<table><thead><tr><th>Produto</th><th>Qtd.</th><th>Preço</th><th>Total</th><th></th></tr></thead><tbody>
    ${this._itens.map((it,i)=>`<tr>
      <td>${it.nome}</td><td>${it.quantidade}</td><td>${fmt(it.precoUnit)}</td><td>${fmt(it.total)}</td>
      <td><button class="btn-icon del" onclick="Hermes.pages.notafiscal._itens.splice(${i},1);Hermes.pages.notafiscal.renderItens();Hermes.pages.notafiscal.updateTotal()"><i data-lucide="x"></i></button></td>
    </tr>`).join('')}</tbody></table>`;
  lucide.createIcons({nodes:[el]});
},
updateTotal(){
  const sub=this._itens.reduce((s,i)=>s+i.total,0);
  const desc=+document.getElementById('nf-desconto').value||0;
  document.getElementById('nf-total-val').textContent=fmt(Math.max(0,sub-desc));
},
limpar(){
  this._itens=[];
  document.getElementById('nf-cliente').value='';
  document.getElementById('nf-cpfcnpj').value='';
  document.getElementById('nf-end').value='';
  document.getElementById('nf-obs').value='';
  document.getElementById('nf-desconto').value='0';
  this.renderItens(); this.updateTotal();
},
emitir(){
  const cliente=document.getElementById('nf-cliente').value.trim();
  if(!cliente){ toast('Informe o cliente.','error'); return; }
  if(!this._itens.length){ toast('Adicione ao menos um item.','error'); return; }
  const sub=this._itens.reduce((s,i)=>s+i.total,0);
  const desc=+document.getElementById('nf-desconto').value||0;
  const total=+(sub-desc).toFixed(2);
  const nf=DB.saveNF({
    cliente:{nome:cliente,cpfCnpj:document.getElementById('nf-cpfcnpj').value,endereco:document.getElementById('nf-end').value},
    itens:JSON.parse(JSON.stringify(this._itens)),
    subtotal:sub,desconto:desc,total,obs:document.getElementById('nf-obs').value,
    data:document.getElementById('nf-data').value,status:'emitida'
  });
  // Auto save client
  if(cliente) DB.saveCliente({nome:cliente,cpfCnpj:document.getElementById('nf-cpfcnpj').value,email:'',telefone:'',endereco:document.getElementById('nf-end').value});
  toast(`NF #${nf.numero} emitida!`);
  this.limpar(); this.renderHistorico();
  // Perguntar se deseja imprimir
  const nfId = nf.id;
  const nfNum = nf.numero;
  openModal(`<div class="modal-backdrop"><div class="modal-box modal-sm">
    <div class="modal-header"><h2>NF #${nfNum} Emitida!</h2><button class="modal-close" data-close-modal><i data-lucide="x"></i></button></div>
    <div class="modal-body"><p style="color:var(--t2);line-height:1.7">A nota fiscal foi salva com sucesso.<br>Deseja imprimir / salvar como PDF agora?</p></div>
    <div class="modal-footer">
      <button class="btn btn-ghost" data-close-modal>Agora não</button>
      <button class="btn btn-primary" id="nf-print-ok"><i data-lucide="printer"></i> Imprimir</button>
    </div></div></div>`);
  document.getElementById('nf-print-ok').addEventListener('click',()=>{ closeModal(); this.imprimirNF(nfId); });
},
renderHistorico(){
  const nfs=[...DB.getNFs()].sort((a,b)=>new Date(b.emitidaEm)-new Date(a.emitidaEm));
  const el=document.getElementById('nf-historico');
  if(!nfs.length){ el.innerHTML='<div class="empty-state"><i data-lucide="file-x"></i><p>Nenhuma NF emitida.</p></div>'; lucide.createIcons({nodes:[el]}); return; }
  el.innerHTML=`<div style="display:flex;flex-direction:column;gap:8px">
    ${nfs.map(nf=>`<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-card2);border-radius:var(--rs);border:1px solid var(--border)">
      <div style="flex:1">
        <div style="font-weight:600;font-size:13px">NF #${nf.numero} — ${nf.cliente.nome}</div>
        <div style="font-size:11px;color:var(--t2)">${fmtDate(nf.data)} · ${fmt(nf.total)}</div>
      </div>
      <span class="chip chip-${nf.status}">${nf.status}</span>
      <button class="btn-icon" onclick="Hermes.pages.notafiscal.imprimirNF('${nf.id}')" title="Imprimir"><i data-lucide="printer"></i></button>
      ${nf.status!=='cancelada'?`<button class="btn-icon del" onclick="confirm2('Cancelar NF','Cancelar NF #${nf.numero}?',()=>{DB.cancelarNF('${nf.id}');Hermes.pages.notafiscal.renderHistorico();})" title="Cancelar"><i data-lucide="x"></i></button>`:''}
    </div>`).join('')}
  </div>`;
  lucide.createIcons({nodes:[el]});
},
imprimirNF(id){
  const nf=DB.getNFs().find(x=>x.id===id); if(!nf) return;
  const printEl=document.getElementById('print-area');
  printEl.innerHTML=`
    <div class="print-header">
      <h1>NOTA FISCAL SIMPLIFICADA</h1>
      <p style="font-size:18px;font-weight:700">Hermes — Sistema de Gestão</p>
      <p>NF Nº ${nf.numero} &nbsp;|&nbsp; Emissão: ${fmtDate(nf.emitidaEm)}</p>
    </div>
    <div style="margin:16px 0;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px">
      <div><strong>Cliente:</strong> ${nf.cliente.nome}</div>
      <div><strong>CPF/CNPJ:</strong> ${nf.cliente.cpfCnpj||'—'}</div>
      <div style="grid-column:span 2"><strong>Endereço:</strong> ${nf.cliente.endereco||'—'}</div>
    </div>
    <table class="print-table">
      <thead><tr><th>#</th><th>Produto</th><th>Qtd.</th><th>Preço Unit.</th><th>Total</th></tr></thead>
      <tbody>${nf.itens.map((it,i)=>`<tr><td>${i+1}</td><td>${it.nome}</td><td>${it.quantidade}</td><td>${fmt(it.precoUnit)}</td><td>${fmt(it.total)}</td></tr>`).join('')}</tbody>
    </table>
    <div style="margin-top:12px;text-align:right;font-size:13px">
      <div>Subtotal: ${fmt(nf.subtotal)}</div>
      <div>Desconto: -${fmt(nf.desconto)}</div>
      <div style="font-size:18px;font-weight:800;margin-top:6px">Total: ${fmt(nf.total)}</div>
    </div>
    ${nf.obs?`<div style="margin-top:12px;font-size:12px;color:#555">Obs: ${nf.obs}</div>`:''}
    <div class="print-footer">Esta é uma NF simplificada para controle interno. Hermes v2.0</div>`;
  window.print();
}
};
