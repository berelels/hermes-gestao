<div align="center">

# ⚡ Hermes
### Sistema de Gestão Empresarial

**Estoque · Vendas · Financeiro · Relatórios · Nota Fiscal**

[![Status](https://img.shields.io/badge/status-fase%20de%20testes-f59e0b?style=flat-square)](#aviso-importante)
[![Versão](https://img.shields.io/badge/versão-2.0--beta-ff5c6a?style=flat-square)](#)
[![Tipo](https://img.shields.io/badge/tipo-demonstração-c084fc?style=flat-square)](#aviso-importante)

</div>

---

> [!CAUTION]
> ## ⚠️ AVISO IMPORTANTE — LEIA ANTES DE USAR
>
> **Este repositório contém uma versão de demonstração e testes do sistema Hermes.**
>
> - Esta versão é disponibilizada **temporária e exclusivamente** para fins de **avaliação e coleta de feedback**.
> - O produto **não está finalizado**. Funcionalidades, interface, comportamentos e dados podem mudar significativamente na versão final.
> - A versão final do Hermes **não será gratuita**, não será open-source e não estará disponível publicamente desta forma.
> - **Não utilize esta versão para fins comerciais ou produtivos.** Os dados são armazenados apenas no seu navegador e podem ser perdidos a qualquer momento.
> - Este repositório poderá ser tornado privado ou removido sem aviso prévio.
>
> © Todos os direitos reservados ao desenvolvedor. A disponibilização desta demo não implica cessão de qualquer direito sobre o software.

---

## 📋 Sobre esta Demo

O **Hermes** é um sistema de gestão empresarial em desenvolvimento. Esta versão beta foi disponibilizada para que usuários selecionados possam explorar as funcionalidades planejadas, reportar bugs e fornecer feedback sobre a experiência de uso.

> O objetivo desta fase é validar fluxos e usabilidade — **não** reflete a arquitetura, performance ou conjunto de funcionalidades da versão comercial final.

---

## ✨ Funcionalidades desta Demo

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

### 🛒 Vendas
- Registro de vendas com validação de estoque disponível
- Regra de negócio: caixa deve estar aberto para registrar vendas
- Suporte a múltiplos canais: Loja, Online, WhatsApp, Marketplace
- Histórico completo com filtros por produto e canal

### 💰 Financeiro
- **Caixa:** abertura/fechamento de sessões com saldo calculado
- **Contas a Pagar e Receber:** cadastro e controle de vencimentos
- **Movimentações:** extrato de entradas e saídas com lançamento manual
- Atualização automática de status das contas por data

### 📈 Relatórios
- Vendas, estoque, financeiro, margens, visão anual e contas
- Exportação para **XLSX** e impressão / **PDF** nativos

### 🧾 Nota Fiscal
- Emissão de NF simplificada para controle interno
- Histórico de NFs com reimpressão e cancelamento

---

## 🎯 Dados de Exemplo

Clique no botão **⚡ (banco de dados)** no cabeçalho para carregar dados de exemplo e explorar o sistema sem precisar cadastrar nada manualmente.

> ⚠️ Esta ação apaga todos os dados atuais do navegador.

---

## 💾 Limitações desta Versão

| Limitação | Detalhe |
|-----------|---------|
| **Sem nuvem** | Dados ficam **somente no seu navegador**. Limpar o cache apaga tudo. |
| **Sem multiusuário** | Um único perfil por navegador, sem login ou controle de acesso. |
| **Sem integração** | Não se conecta a ERPs, APIs fiscais ou sistemas externos. |
| **Sem backup automático** | Não há sincronização ou exportação automática de dados. |
| **NF simplificada** | A emissão de nota fiscal é apenas para controle interno — não tem validade fiscal. |

Estas limitações são **inerentes à natureza desta demo** e serão resolvidas na versão final do produto.

---

## 🛠️ Stack desta Demo

| Tecnologia | Uso |
|-----------|-----|
| HTML5 / CSS3 / JavaScript | Interface e lógica client-side |
| [Chart.js 4.4.2](https://www.chartjs.org/) | Gráficos |
| [Lucide 0.468.0](https://lucide.dev/) | Ícones |
| [SheetJS 0.20.1](https://sheetjs.com/) | Exportação XLSX |
| localStorage | Persistência local no navegador |

> A stack da versão final do produto será diferente.

---

## 📬 Feedback

Encontrou um bug ou tem uma sugestão? Abra uma [Issue](https://github.com/berelels/hermes-gestao/issues) neste repositório.

Todo feedback é bem-vindo e contribui diretamente para o desenvolvimento do produto final.

---

<div align="center">

**© Hermes — Todos os direitos reservados.**

*Esta demo é disponibilizada temporariamente para fins de avaliação.*
*A versão final é um produto comercial e não estará disponível gratuitamente.*

</div>
