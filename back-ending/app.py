import flask
from flask import Flask, Blueprint, jsonify, request

app = Flask(__name__)

status_bp = Blueprint('status', __name__)

@app.route('/')
def home():
    return "bem vindo a pagina inicial"

@status_bp.route('/status', methods=['GET'])
def status() -> flask.Response:
    return jsonify({
        "status": "ok",
        "sistema": "online",
        "versão": "1.0.0"
    })

app.register_blueprint(status_bp)


@app.route('/produto', methods=['POST'])
def criar_produto():
    produto = request.get_json()

    if not isinstance(produto, dict):
        return jsonify({"erro": "JSON inválido ou não enviado"}), 400

    quantidade = produto.get('quantidade', 0)
    preco = produto.get('preco', 0.0)
    desconto = produto.get('desconto', 0.0)

    if (
        isinstance(quantidade, bool) or
        not isinstance(quantidade, int) or
        isinstance(preco, bool) or
        not isinstance(preco, (int, float)) or
        isinstance(desconto, bool) or
        not isinstance(desconto, (int, float))
    ):
        return jsonify({"erro": "Tipos de dados inválidos"}), 400

    if quantidade <= 0 or preco < 0 or desconto < 0 or desconto > 100:
        return jsonify({
            "erro": "Valores inválidos. Quantidade deve ser positiva, preço não negativo e desconto entre 0 e 100."
        }), 400

    preco_final = preco - (preco * desconto / 100)
    total = preco_final * quantidade
    desconto_total = preco * quantidade - total

    return jsonify({
        "preco_final": preco_final,
        "total": total,
        "desconto_total": desconto_total
    })


if __name__ == '__main__':
    app.run(debug=True)