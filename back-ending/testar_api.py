import requests

url = "http://127.0.0.1:5000/produto"

dados = {
    "quantidade": 2,
    "preco": 200.0,
    "desconto": 150.0
}

respostas = requests.post (url, json=dados)
print(respostas.status_code)
print(respostas.json())
