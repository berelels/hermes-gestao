<div align="center">

# ⚡ Hermes
### Sistema de Gestão Empresarial

**Estoque · Vendas · Financeiro · Relatórios · Nota Fiscal**

[![Status](https://img.shields.io/badge/status-beta-f59e0b?style=flat-square)](https://github.com/berelels/hermes-gestao)
[![Versão](https://img.shields.io/badge/versão-2.0-22d3a0?style=flat-square)](https://github.com/berelels/hermes-gestao)
[![Licença](https://img.shields.io/badge/licença-MIT-3b9eff?style=flat-square)](LICENSE)
[![100% Client-Side](https://img.shields.io/badge/backend-nenhum-c084fc?style=flat-square)](#)

</div>

---

## 📋 Sobre

**Hermes** é um sistema de gestão empresarial completo, leve e 100% client-side — sem servidor, sem banco de dados externo, sem instalação. Roda direto no navegador e persiste todos os dados via `localStorage`.

Desenvolvido como SPA (Single Page Application) com HTML, CSS e JavaScript puro, projetado para ser hospedado gratuitamente no **GitHub Pages**.

---

## ✨ Funcionalidades

### 📊 Dashboard
- KPIs em tempo real: faturamento, lucro, unidades vendidas e alertas
- Gráfico de vendas por período (7, 30 ou 90 dias)
- Ranking dos produtos mais vendidos
- Painel de alertas de estoque baixo e contas vencidas
- Banner de status do caixa com saldo atual

### 📦 Estoque
- Cadastro de produtos com nome, categoria, SKU, custo e margem
- Cálculo automático de preço de venda pela margem definida
- Preview visual de custo → margem → preço em tempo real
- Filtros por categoria, status (OK / Baixo / Zerado) e busca por nome/SKU
- Indicador visual de margem com barra de progresso

### 🛒 Vendas
- Registro de vendas com validação de estoque disponível
- Regra de negócio: **caixa deve estar aberto** para registrar vendas
- Suporte a múltiplos canais: Loja, Online, WhatsApp, Marketplace
- Preview em tempo real de total e lucro estimado antes de confirmar
- Histórico completo com filtros por produto e canal
- Exclusão de venda **restaura automaticamente** o estoque e remove o movimento financeiro

### 💰 Financeiro
- **Caixa:** abertura/fechamento de sessões com saldo inicial e final calculado
- **Contas a Pagar:** cadastro, pagamento e controle de vencimento
- **Contas a Receber:** cadastro, recebimento e controle de vencimento
- **Movimentações:** extrato completo de entradas e saídas com lançamento manual
- Badge de alertas para contas vencidas no menu de navegação
- Atualização automática de status das contas por data

### 📈 Relatórios
- **Vendas:** histórico completo com faturamento, lucro e margem total
- **Estoque:** posição atual de todos os produtos com alertas de reposição
- **Financeiro:** fluxo de caixa com total de entradas, saídas e resultado
- **Margens & Lucro:** ranking de lucratividade por produto
- **Visão Anual:** faturamento e lucro mês a mês com gráfico comparativo
- **Contas:** relatório consolidado de contas a pagar e receber
- Exportação para **XLSX** (Excel) e impressão / **PDF** nativos

### 🧾 Nota Fiscal
- Emissão de NF simplificada para controle interno
- Adição de múltiplos itens com preenchimento automático de preço
- Cálculo de desconto e total
- Histórico de NFs emitidas com opção de reimpressão e cancelamento
- Auto-preenchimento de dados do cliente via histórico
- Confirmação de impressão ao emitir

---

## 🛠️ Stack

| Tecnologia | Uso |
|-----------|-----|
| HTML5 | Estrutura e shell da aplicação |
| CSS3 (Vanilla) | Design system completo com variáveis e animações |
| JavaScript ES6+ | Lógica, roteamento SPA e manipulação de DOM |
| [Chart.js 4.4.2](https://www.chartjs.org/) | Gráficos de linha, barra e rosca |
| [Lucide 0.468.0](https://lucide.dev/) | Biblioteca de ícones |
| [SheetJS 0.20.1](https://sheetjs.com/) | Exportação para XLSX |
| localStorage | Persistência de dados client-side |

---

## 🚀 Como usar

### Online (GitHub Pages)
Acesse diretamente pelo navegador — nenhuma instalação necessária:
```
https://berelels.github.io/hermes-gestao
```

### Local
```bash
# Clone o repositório
git clone https://github.com/berelels/hermes-gestao.git

# Abra o index.html no navegador
# (ou sirva com qualquer servidor estático)
cd hermes-gestao
npx serve .
```

> Não é necessário `npm install`, build, compilação ou qualquer dependência local. Todas as bibliotecas são carregadas via CDN.

---

## 🗂️ Estrutura do Projeto

```
hermes-gestao/
├── index.html              # Shell da aplicação (header, nav, footer)
├── css/
│   └── style.css           # Design system completo
└── js/
    ├── app.js              # Roteador SPA, utilitários (toast, modal, clock)
    ├── storage.js          # Camada de dados (localStorage façade)
    ├── charts.js           # Helpers de gráficos (Chart.js)
    └── pages/
        ├── dashboard.js    # Página Dashboard
        ├── estoque.js      # Página Estoque
        ├── vendas.js       # Página Vendas
        ├── financeiro.js   # Página Financeiro
        ├── relatorios.js   # Página Relatórios
        └── notafiscal.js   # Página Nota Fiscal
```

---

## 🎯 Dados de Exemplo

Clique no botão **⚡ (banco de dados)** no cabeçalho para carregar dados de exemplo com:
- 15 produtos em 5 categorias
- Histórico de vendas dos últimos 90 dias
- Caixa aberto com movimentações
- Contas a pagar e receber (incluindo algumas vencidas)
- Clientes cadastrados para emissão de NF

> ⚠️ Esta ação apaga todos os dados atuais.

---

## 💾 Armazenamento de Dados

Todos os dados são salvos no `localStorage` do navegador sob as chaves:

| Chave | Conteúdo |
|-------|----------|
| `h_produtos` | Catálogo de produtos |
| `h_vendas` | Histórico de vendas |
| `h_caixa` | Sessões de caixa |
| `h_movimentos` | Movimentações financeiras |
| `h_cpagar` | Contas a pagar |
| `h_creceber` | Contas a receber |
| `h_nfs` | Notas fiscais emitidas |
| `h_clientes` | Cadastro de clientes |
| `h_nf_seq` | Sequencial de NF |

> Os dados ficam **apenas no seu navegador**. Limpar o cache do navegador apaga tudo.

---

## 📱 Responsividade

| Breakpoint | Layout |
|-----------|--------|
| > 1000px | Layout completo, todos os grids em múltiplas colunas |
| ≤ 1000px | KPIs e gráficos em 2 colunas |
| ≤ 700px | Layout totalmente em coluna única, textos da nav ocultados |

---

## 📄 Licença

MIT © [berelels](https://github.com/berelels)

---

<div align="center">
  <sub>Feito com ⚡ e muito achocolatado.</sub>
</div>
