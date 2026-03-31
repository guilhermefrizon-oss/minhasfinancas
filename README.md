# Minhas Finanças

Aplicativo web de controle financeiro pessoal desenvolvido com Python e Flask.

## Funcionalidades

- 📊 **Dashboard** com resumo de receitas, despesas e saldo
- ➕ **Adicionar transações** de receita ou despesa com categoria e data
- 🗑️ **Excluir transações**
- 🏷️ **Categorias** pré-definidas (Alimentação, Moradia, Transporte, Saúde, etc.)

## Pré-requisitos

- Python 3.10+

## Instalação e execução

```bash
# Clone o repositório
git clone https://github.com/guilhermefrizon-oss/minhasfinancas.git
cd minhasfinancas

# Crie e ative um ambiente virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt

# Execute o servidor
python app.py
```

Acesse [http://localhost:5000](http://localhost:5000) no seu navegador.

## Estrutura do projeto

```
minhasfinancas/
├── app.py              # Aplicação Flask (rotas, modelo, configuração)
├── requirements.txt    # Dependências Python
├── templates/
│   ├── base.html       # Layout base
│   ├── index.html      # Dashboard
│   └── adicionar.html  # Formulário de nova transação
└── tests/
    └── test_app.py     # Testes automatizados
```

## Executar os testes

```bash
pip install pytest
pytest tests/
```