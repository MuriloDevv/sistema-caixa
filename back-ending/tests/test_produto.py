
import pytest
from app import app


@pytest.fixture
def cliente():
    return app.test_client()


def test_nome_do_teste(cliente):
    post = cliente.post('/produto', json={
        "quantidade": 2,
        "preco": 200.0,
        "desconto": 10.0
    })

    assert post.status_code == 200

    resposta = post.get_json()

    assert resposta["total"] == 360.0


def test_desconto_invalido(cliente):
    post = cliente.post('/produto', json={
        "quantidade": 2,
        "preco": 200.0,
        "desconto": 150.0
    })

    assert post.status_code == 400

    resposta = post.get_json()

    assert resposta["erro"] == "Valores inválidos. Quantidade deve ser positiva, preço não negativo e desconto entre 0 e 100."


def test_quantidade_negativa(cliente):
    post = cliente.post('/produto', json={
        "quantidade": -2,
        "preco": 200.0,
        "desconto": 10.0
    })

    assert post.status_code == 400

    resposta = post.get_json()

    assert resposta["erro"] == "Valores inválidos. Quantidade deve ser positiva, preço não negativo e desconto entre 0 e 100."


def test_quantidade_tipo_invalido(cliente):
    post = cliente.post('/produto', json={
        "quantidade": "dois",
        "preco": 200.0,
        "desconto": 10.0
    })

    assert post.status_code == 400

    resposta = post.get_json()

    assert resposta["erro"] == "Tipos de dados inválidos"
