import os
from flask import Flask, render_template, request, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import date

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///minhasfinancas.db"
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "minhasfinancas-dev-secret-key")

db = SQLAlchemy(app)

CATEGORIAS = [
    "Alimentação",
    "Moradia",
    "Transporte",
    "Saúde",
    "Educação",
    "Lazer",
    "Roupas",
    "Salário",
    "Freelance",
    "Investimentos",
    "Outros",
]


class Transacao(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    descricao = db.Column(db.String(200), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    tipo = db.Column(db.String(10), nullable=False)  # "receita" or "despesa"
    categoria = db.Column(db.String(50), nullable=False)
    data = db.Column(db.Date, nullable=False, default=date.today)

    def __repr__(self):
        return f"<Transacao {self.descricao} {self.valor}>"


with app.app_context():
    db.create_all()


@app.route("/")
def index():
    transacoes = Transacao.query.order_by(Transacao.data.desc()).all()
    total_receitas = sum(t.valor for t in transacoes if t.tipo == "receita")
    total_despesas = sum(t.valor for t in transacoes if t.tipo == "despesa")
    saldo = total_receitas - total_despesas
    return render_template(
        "index.html",
        transacoes=transacoes,
        total_receitas=total_receitas,
        total_despesas=total_despesas,
        saldo=saldo,
    )


@app.route("/adicionar", methods=["GET", "POST"])
def adicionar():
    if request.method == "POST":
        descricao = request.form["descricao"].strip()
        valor_str = request.form["valor"].strip()
        tipo = request.form["tipo"]
        categoria = request.form["categoria"]
        data_str = request.form["data"]

        if not descricao:
            flash("A descrição é obrigatória.", "danger")
            return render_template("adicionar.html", categorias=CATEGORIAS)

        try:
            valor = float(valor_str.replace(",", "."))
            if valor <= 0:
                raise ValueError
        except ValueError:
            flash("Informe um valor válido maior que zero.", "danger")
            return render_template("adicionar.html", categorias=CATEGORIAS)

        if tipo not in ("receita", "despesa"):
            flash("Tipo inválido.", "danger")
            return render_template("adicionar.html", categorias=CATEGORIAS)

        if categoria not in CATEGORIAS:
            flash("Categoria inválida.", "danger")
            return render_template("adicionar.html", categorias=CATEGORIAS)

        try:
            data_transacao = date.fromisoformat(data_str)
        except ValueError:
            flash("Data inválida.", "danger")
            return render_template("adicionar.html", categorias=CATEGORIAS)

        transacao = Transacao(
            descricao=descricao,
            valor=valor,
            tipo=tipo,
            categoria=categoria,
            data=data_transacao,
        )
        db.session.add(transacao)
        db.session.commit()
        flash("Transação adicionada com sucesso!", "success")
        return redirect(url_for("index"))

    return render_template("adicionar.html", categorias=CATEGORIAS)


@app.route("/excluir/<int:id>", methods=["POST"])
def excluir(id):
    transacao = db.get_or_404(Transacao, id)
    db.session.delete(transacao)
    db.session.commit()
    flash("Transação excluída com sucesso!", "success")
    return redirect(url_for("index"))


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug)
