# Meus Gastos 💰

Aplicativo de controle financeiro pessoal — PWA offline-first com sincronização em nuvem via Firebase.

## Funcionalidades

- **Despesas** — cadastro com categorias, vencimento, status (Pago / Falta Pagar / Débito auto) e busca por texto
- **Receitas** — controle de entradas com categorias e status (Recebido / Aguardando), incluindo busca por texto
- **Visão geral** — cartões com totais do mês, barra de progresso (gastos vs receita) e gráficos históricos
- **Alertas** — notificações de contas a vencer nos próximos 3 dias
- **Múltiplos perfis** — perfis separados protegidos por PIN de 4 dígitos
- **Exportação CSV** — exporte despesas ou receitas para planilha com um clique
- **Lançamento rápido** — interpretação de texto natural, ex: `"mercado 150"` ou `"aluguel 1200 recorrente 12"`
- **Modo escuro/claro** — alterne pelo ícone no cabeçalho
- **PWA instalável** — funciona offline e pode ser instalado como app no celular

## Categorias de despesa

Moradia · Gastos Fixos · Transporte · Alimentação · Streaming · Saúde · Educação · Financeiro · Lazer · Compras · Outros

## Como usar

1. Acesse o app pelo navegador ou instale como PWA ("Adicionar à tela inicial")
2. Faça login ou crie uma conta
3. Use o botão **+** na barra de navegação para adicionar lançamentos
4. Navegue entre as abas: **Geral · Despesas · Receitas · Alertas**
5. Para exportar dados, clique no botão **⬇ CSV** na tabela correspondente

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML5 · CSS3 · JavaScript (vanilla) |
| Gráficos | Chart.js 4.4.1 |
| Banco de dados | Firebase Firestore (offline-first) |
| Autenticação | Firebase Auth |
| Hospedagem | Qualquer servidor estático (GitHub Pages, Vercel, Netlify…) |
| PWA | Service Worker + Web App Manifest |

## Deploy

O aplicativo é um conjunto de arquivos estáticos — basta hospedar os arquivos abaixo:

```
index.html
manifest.json
sw.js
icon-192.png
icon-512.png
```

Não há etapa de build. Qualquer serviço de hospedagem estática funciona.

## Privacidade

Os dados financeiros são armazenados no Firestore vinculado à sua conta e em cache local no navegador (localStorage / IndexedDB). Nenhum dado é compartilhado com terceiros.
