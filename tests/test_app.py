import pytest
from datetime import date
from app import app, db, Transacao, CATEGORIAS


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["WTF_CSRF_ENABLED"] = False
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.drop_all()


def test_index_empty(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "Nenhuma transação" in response.data.decode("utf-8")


def test_index_shows_summary(client):
    with app.app_context():
        db.session.add(Transacao(descricao="Salário", valor=5000.0, tipo="receita", categoria="Salário", data=date.today()))
        db.session.add(Transacao(descricao="Aluguel", valor=1500.0, tipo="despesa", categoria="Moradia", data=date.today()))
        db.session.commit()

    response = client.get("/")
    body = response.data.decode("utf-8")
    assert response.status_code == 200
    assert "5000.00" in body
    assert "1500.00" in body
    assert "3500.00" in body  # saldo


def test_adicionar_get(client):
    response = client.get("/adicionar")
    assert response.status_code == 200
    assert "Nova Transação" in response.data.decode("utf-8")


def test_adicionar_post_valida(client):
    response = client.post(
        "/adicionar",
        data={
            "descricao": "Freelance",
            "valor": "2000",
            "tipo": "receita",
            "categoria": "Freelance",
            "data": str(date.today()),
        },
        follow_redirects=True,
    )
    assert response.status_code == 200
    assert "Transação adicionada com sucesso" in response.data.decode("utf-8")

    with app.app_context():
        assert Transacao.query.count() == 1


def test_adicionar_post_descricao_vazia(client):
    response = client.post(
        "/adicionar",
        data={
            "descricao": "   ",
            "valor": "100",
            "tipo": "despesa",
            "categoria": "Outros",
            "data": str(date.today()),
        },
    )
    assert response.status_code == 200
    assert "descrição é obrigatória" in response.data.decode("utf-8")


def test_adicionar_post_valor_invalido(client):
    response = client.post(
        "/adicionar",
        data={
            "descricao": "Teste",
            "valor": "abc",
            "tipo": "despesa",
            "categoria": "Outros",
            "data": str(date.today()),
        },
    )
    assert response.status_code == 200
    assert "valor válido" in response.data.decode("utf-8")


def test_adicionar_post_valor_negativo(client):
    response = client.post(
        "/adicionar",
        data={
            "descricao": "Teste",
            "valor": "-50",
            "tipo": "despesa",
            "categoria": "Outros",
            "data": str(date.today()),
        },
    )
    assert response.status_code == 200
    assert "valor válido" in response.data.decode("utf-8")


def test_adicionar_post_tipo_invalido(client):
    response = client.post(
        "/adicionar",
        data={
            "descricao": "Teste",
            "valor": "100",
            "tipo": "invalido",
            "categoria": "Outros",
            "data": str(date.today()),
        },
    )
    assert response.status_code == 200
    assert "Tipo inválido" in response.data.decode("utf-8")


def test_adicionar_post_categoria_invalida(client):
    response = client.post(
        "/adicionar",
        data={
            "descricao": "Teste",
            "valor": "100",
            "tipo": "despesa",
            "categoria": "Categoria Estranha",
            "data": str(date.today()),
        },
    )
    assert response.status_code == 200
    assert "Categoria inválida" in response.data.decode("utf-8")


def test_excluir(client):
    with app.app_context():
        t = Transacao(descricao="Teste", valor=100.0, tipo="despesa", categoria="Outros", data=date.today())
        db.session.add(t)
        db.session.commit()
        tid = t.id

    response = client.post(f"/excluir/{tid}", follow_redirects=True)
    assert response.status_code == 200
    assert "Transação excluída com sucesso" in response.data.decode("utf-8")

    with app.app_context():
        assert Transacao.query.count() == 0


def test_excluir_inexistente(client):
    response = client.post("/excluir/9999")
    assert response.status_code == 404


def test_categorias_definidas():
    assert len(CATEGORIAS) > 0
    assert "Salário" in CATEGORIAS
    assert "Alimentação" in CATEGORIAS
