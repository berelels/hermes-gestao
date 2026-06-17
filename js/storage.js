'use strict';
/* ══ HERMES v2 — Storage (LocalStorage façade) ══ */
const DB = {
  K: {
    PRODUTOS:'h_produtos', VENDAS:'h_vendas',
    CAIXA:'h_caixa',        MOVIMENTOS:'h_movimentos',
    CPAGAR:'h_cpagar',      CRECEBER:'h_creceber',
    NFS:'h_nfs',            CLIENTES:'h_clientes',
    NF_SEQ:'h_nf_seq',
  },
  _g(k){ try{return JSON.parse(localStorage.getItem(k))||[];}catch{return [];} },
  _s(k,v){ localStorage.setItem(k,JSON.stringify(v)); },
  _id(p){ return p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6); },

  /* ── PRODUTOS ── */
  getProdutos(){ return this._g(this.K.PRODUTOS); },
  getProduto(id){ return this.getProdutos().find(p=>p.id===id)||null; },
  saveProduto(p){
    const list=this.getProdutos();
    if(!p.id){ p.id=this._id('p'); p.criadoEm=new Date().toISOString(); }
    const i=list.findIndex(x=>x.id===p.id);
    i>-1?list[i]=p:list.push(p);
    this._s(this.K.PRODUTOS,list); return p;
  },
  deleteProduto(id){ this._s(this.K.PRODUTOS,this.getProdutos().filter(p=>p.id!==id)); },

  /* ── VENDAS ── */
  getVendas(){ return this._g(this.K.VENDAS); },
  saveVenda(v){
    v.id=this._id('v'); v.criadoEm=new Date().toISOString();
    const list=this.getVendas(); list.push(v);
    this._s(this.K.VENDAS,list); return v;
  },
  deleteVenda(id){ this._s(this.K.VENDAS,this.getVendas().filter(v=>v.id!==id)); },

  /* ── CAIXA ── */
  getCaixaSessoes(){ return this._g(this.K.CAIXA); },
  getCaixaAberto(){
    return this.getCaixaSessoes().find(c=>c.status==='aberto')||null;
  },
  abrirCaixa(saldoInicial){
    if(this.getCaixaAberto()) throw new Error('Caixa já está aberto.');
    const c={id:this._id('c'),aberturaEm:new Date().toISOString(),fechamentoEm:null,
              saldoInicial:+saldoInicial,saldoFinal:null,status:'aberto'};
    const list=this.getCaixaSessoes(); list.push(c);
    this._s(this.K.CAIXA,list); return c;
  },
  fecharCaixa(){
    const list=this.getCaixaSessoes();
    const c=list.find(x=>x.status==='aberto');
    if(!c) throw new Error('Nenhum caixa aberto.');
    const movs=this.getMovimentos().filter(m=>m.caixaId===c.id);
    const entradas=movs.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
    const saidas  =movs.filter(m=>m.tipo==='saida'  ).reduce((s,m)=>s+m.valor,0);
    c.saldoFinal=+(c.saldoInicial+entradas-saidas).toFixed(2);
    c.fechamentoEm=new Date().toISOString(); c.status='fechado';
    this._s(this.K.CAIXA,list); return c;
  },
  getSaldoCaixa(){
    const c=this.getCaixaAberto(); if(!c) return 0;
    const movs=this.getMovimentos().filter(m=>m.caixaId===c.id);
    const e=movs.filter(m=>m.tipo==='entrada').reduce((s,m)=>s+m.valor,0);
    const s=movs.filter(m=>m.tipo==='saida'  ).reduce((s,m)=>s+m.valor,0);
    return +(c.saldoInicial+e-s).toFixed(2);
  },

  /* ── MOVIMENTOS ── */
  getMovimentos(){ return this._g(this.K.MOVIMENTOS); },
  addMovimento(m){
    m.id=this._id('mov'); m.data=m.data||new Date().toISOString();
    const list=this.getMovimentos(); list.push(m);
    this._s(this.K.MOVIMENTOS,list); return m;
  },
  deleteMovimento(id){ this._s(this.K.MOVIMENTOS,this.getMovimentos().filter(m=>m.id!==id)); },

  /* ── CONTAS A PAGAR ── */
  getContasPagar(){ return this._g(this.K.CPAGAR); },
  saveContaPagar(c){
    const list=this.getContasPagar();
    if(!c.id){ c.id=this._id('cp'); c.criadoEm=new Date().toISOString(); }
    const i=list.findIndex(x=>x.id===c.id);
    i>-1?list[i]=c:list.push(c);
    this._s(this.K.CPAGAR,list); return c;
  },
  deleteContaPagar(id){ this._s(this.K.CPAGAR,this.getContasPagar().filter(c=>c.id!==id)); },
  pagarConta(id){
    const caixa=this.getCaixaAberto();
    if(!caixa) throw new Error('Caixa fechado. Abra o caixa antes de pagar contas.');
    const list=this.getContasPagar();
    const c=list.find(x=>x.id===id);
    if(!c) throw new Error('Conta não encontrada.');
    if(c.status==='paga') throw new Error('Conta já foi paga.');
    const mov=this.addMovimento({caixaId:caixa.id,tipo:'saida',categoria:'pagamento',
      descricao:`Pgto: ${c.fornecedor} — ${c.descricao}`,valor:c.valor,referencia:c.id});
    c.status='paga'; c.pagaEm=new Date().toISOString(); c.movimentoId=mov.id;
    this._s(this.K.CPAGAR,list); return c;
  },

  /* ── CONTAS A RECEBER ── */
  getContasReceber(){ return this._g(this.K.CRECEBER); },
  saveContaReceber(c){
    const list=this.getContasReceber();
    if(!c.id){ c.id=this._id('cr'); c.criadoEm=new Date().toISOString(); }
    const i=list.findIndex(x=>x.id===c.id);
    i>-1?list[i]=c:list.push(c);
    this._s(this.K.CRECEBER,list); return c;
  },
  deleteContaReceber(id){ this._s(this.K.CRECEBER,this.getContasReceber().filter(c=>c.id!==id)); },
  receberConta(id){
    const caixa=this.getCaixaAberto();
    if(!caixa) throw new Error('Caixa fechado. Abra o caixa antes de registrar recebimento.');
    const list=this.getContasReceber();
    const c=list.find(x=>x.id===id);
    if(!c) throw new Error('Conta não encontrada.');
    if(c.status==='recebida') throw new Error('Conta já foi recebida.');
    const mov=this.addMovimento({caixaId:caixa.id,tipo:'entrada',categoria:'recebimento',
      descricao:`Receb: ${c.cliente} — ${c.descricao}`,valor:c.valor,referencia:c.id});
    c.status='recebida'; c.recebidaEm=new Date().toISOString(); c.movimentoId=mov.id;
    this._s(this.K.CRECEBER,list); return c;
  },

  /* ── CLIENTES ── */
  getClientes(){ return this._g(this.K.CLIENTES); },
  saveCliente(c){
    const list=this.getClientes();
    if(!c.id){ c.id=this._id('cli'); }
    const i=list.findIndex(x=>x.id===c.id);
    i>-1?list[i]=c:list.push(c);
    this._s(this.K.CLIENTES,list); return c;
  },

  /* ── NOTAS FISCAIS ── */
  getNFs(){ return this._g(this.K.NFS); },
  getNFSeq(){ const n=(+localStorage.getItem(this.K.NF_SEQ)||0)+1; localStorage.setItem(this.K.NF_SEQ,n); return n; },
  saveNF(nf){
    nf.id=this._id('nf'); nf.numero=this.getNFSeq(); nf.emitidaEm=new Date().toISOString();
    const list=this.getNFs(); list.push(nf);
    this._s(this.K.NFS,list); return nf;
  },
  cancelarNF(id){
    const list=this.getNFs(); const nf=list.find(x=>x.id===id);
    if(nf){ nf.status='cancelada'; this._s(this.K.NFS,list); }
  },

  /* ── HELPERS ── */
  generateSKU(categoria){
    if(!categoria) return '';
    const prefix=categoria.trim()[0].toUpperCase();
    const regex=new RegExp(`^${prefix}(\\d+)$`);
    let max=0;
    this.getProdutos().forEach(p=>{
      if(p.sku){ const m=p.sku.match(regex); if(m) max=Math.max(max,+m[1]); }
    });
    return prefix+String(max+1).padStart(2,'0');
  },

  atualizarStatusContas(){
    const hoje=new Date().toDateString();
    ['CPAGAR','CRECEBER'].forEach(k=>{
      const list=this._g(this.K[k]);
      let changed=false;
      list.forEach(c=>{
        if(c.status==='aberta'&&new Date(c.vencimento)<new Date(hoje)){ c.status='vencida'; changed=true; }
      });
      if(changed) this._s(this.K[k],list);
    });
  },
  countAlertasFinanceiros(){
    this.atualizarStatusContas();
    const v=this.getContasPagar().filter(c=>c.status==='vencida').length;
    const r=this.getContasReceber().filter(c=>c.status==='vencida').length;
    return v+r;
  },

  /* ── CLEAR ── */
  clear(){
    Object.values(this.K).forEach(k=>localStorage.removeItem(k));
  },

  /* ── SEED ── */
  seed(){
    this.clear();
    // Produtos
    const cats=['Eletrônicos','Vestuário','Alimentos','Beleza','Casa'];
    const nomes=[['Fone Bluetooth','Cabo USB-C','Carregador 65W'],['Camiseta Básica','Calça Jeans','Tênis Casual'],
      ['Café Premium 500g','Azeite Extra Virgem','Chocolate 70%'],['Sérum Vitamina C','Protetor Solar','Shampoo'],['Luminária LED','Tapete Sala','Vaso Decorativo']];
    const prods=[];
    nomes.forEach((g,ci)=>g.forEach(nome=>{
      const custo=+(10+Math.random()*90).toFixed(2);
      const margem=+(25+Math.random()*55).toFixed(1);
      const preco=+(custo*(1+margem/100)).toFixed(2);
      prods.push(this.saveProduto({nome,categoria:cats[ci],sku:nome.slice(0,3).toUpperCase()+'-'+Math.floor(100+Math.random()*900),
        custo,margem,preco,estoque:Math.floor(5+Math.random()*95),minimo:Math.floor(5+Math.random()*15),descricao:''}));
    }));

    // Abrir caixa
    const cx=this.abrirCaixa(2000);

    // Vendas históricas (90 dias)
    const now=new Date();
    prods.forEach(prod=>{
      const n=Math.floor(3+Math.random()*20);
      for(let i=0;i<n;i++){
        const dias=Math.floor(Math.random()*90);
        const data=new Date(now); data.setDate(data.getDate()-dias);
        const qty=Math.floor(1+Math.random()*5);
        const preco=+(prod.preco*(0.9+Math.random()*.2)).toFixed(2);
        const venda=this.saveVenda({produtoId:prod.id,produtoNome:prod.nome,categoria:prod.categoria,
          quantidade:qty,precoUnit:preco,custoUnit:prod.custo,
          total:+(preco*qty).toFixed(2),lucro:+((preco-prod.custo)*qty).toFixed(2),
          data:data.toISOString(),canal:['loja','online','whatsapp','marketplace'][Math.floor(Math.random()*4)]});
        this.addMovimento({caixaId:cx.id,tipo:'entrada',categoria:'venda',
          descricao:`Venda: ${prod.nome} x${qty}`,valor:venda.total,referencia:venda.id,data:data.toISOString()});
      }
    });

    // Contas a pagar
    const fornecedores=['Distribuidora ABC','Logística XYZ','Fornecedor Silva','Energia Elétrica','Aluguel'];
    fornecedores.forEach((f,i)=>{
      const venc=new Date(now); venc.setDate(venc.getDate()+(i%2===0?-5:10+i*5));
      this.saveContaPagar({fornecedor:f,descricao:`Fatura ${i+1}`,valor:+(200+Math.random()*800).toFixed(2),
        vencimento:venc.toISOString().slice(0,10),status:i<2?'vencida':'aberta',pagaEm:null,movimentoId:null});
    });

    // Contas a receber
    const clientes2=['Cliente Souza','Empresa Beta','João Silva','Maria Costa','Loja Norte'];
    clientes2.forEach((c,i)=>{
      const venc=new Date(now); venc.setDate(venc.getDate()+(i%3===0?-3:7+i*4));
      this.saveContaReceber({cliente:c,descricao:`Pedido ${1000+i}`,valor:+(300+Math.random()*1200).toFixed(2),
        vencimento:venc.toISOString().slice(0,10),status:i===0?'vencida':'aberta',recebidaEm:null,movimentoId:null});
    });

    // Clientes para NF
    ['João Silva','Maria Costa','Empresa Beta Ltda'].forEach(nome=>{
      this.saveCliente({nome,cpfCnpj:nome.includes('Ltda')?'12.345.678/0001-90':'000.000.000-00',email:'',telefone:'',endereco:''});
    });

    this.atualizarStatusContas();
  }
};
