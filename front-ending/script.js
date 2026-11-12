
const produtos = [];
const vendas = [];

const paginas = document.querySelectorAll('.page');
const botoesMenu = document.querySelectorAll('.nav-item');

const modalProduto = document.getElementById('modal-produto');
const modalVenda = document.getElementById('modal-venda');

// GRÁFICOS
let graficoFaturamento = null;
let graficoEstoque = null;

// FORMATAÇÃO DE VALORES
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

// NAVEGAÇÃO
function abrirPagina(nome) {
    paginas.forEach(pagina => {
        pagina.classList.toggle('ativa', pagina.id === nome);
    });

    botoesMenu.forEach(botao => {
        botao.classList.toggle('ativo', botao.dataset.page === nome);
    });
}

botoesMenu.forEach(botao => {
    botao.addEventListener('click', () => {
        abrirPagina(botao.dataset.page);
    });
});

// ATALHOS DO DASHBOARD
document.querySelectorAll('[data-go]').forEach(botao => {
    botao.addEventListener('click', () => {
        abrirPagina(botao.dataset.go);

        if (
            botao.classList.contains('quick-action') &&
            botao.dataset.go === 'produtos'
        ) {
            modalProduto.classList.add('aberto');
            document.getElementById('nome-cadastro').focus();
        }
    });
});

// DATA ATUAL
document.getElementById('data-atual').textContent =
    new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

// ABRIR MODAIS
document.getElementById('abrir-produto').addEventListener('click', () => {
    modalProduto.classList.add('aberto');
});

document.getElementById('abrir-venda').addEventListener('click', abrirModalVenda);
document.getElementById('abrir-venda-2').addEventListener('click', abrirModalVenda);

function abrirModalVenda() {
    atualizarSelecaoProdutos();
    modalVenda.classList.add('aberto');
}

// FECHAR MODAIS
document.querySelectorAll('[data-close]').forEach(botao => {
    botao.addEventListener('click', () => {
        document.getElementById(botao.dataset.close).classList.remove('aberto');
    });
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', evento => {
        if (evento.target === modal) {
            modal.classList.remove('aberto');
        }
    });
});

// CADASTRAR PRODUTO
document.getElementById('form-produto').addEventListener('submit', evento => {
    evento.preventDefault();

    const nome = document.getElementById('nome-cadastro').value.trim();
    const preco = Number(document.getElementById('preco-cadastro').value);
    const estoque = Number(document.getElementById('estoque-cadastro').value);

    if (
        !nome ||
        !Number.isFinite(preco) ||
        preco <= 0 ||
        !Number.isInteger(estoque) ||
        estoque < 0
    ) {
        alert('Confira os dados do produto.');
        return;
    }

    const nomeExiste = produtos.some(produto =>
        produto.nome.toLowerCase() === nome.toLowerCase()
    );

    if (nomeExiste) {
        alert('Já existe um produto com esse nome.');
        return;
    }

    produtos.push({
        id: Date.now(),
        nome,
        preco,
        estoque
    });

    evento.target.reset();
    modalProduto.classList.remove('aberto');

    atualizarSistema();
    alert('Produto cadastrado com sucesso!');
});

// ATUALIZAR OPÇÕES DE VENDA
function atualizarSelecaoProdutos() {
    const selecao = document.getElementById('produto-venda');

    selecao.innerHTML = '<option value="">Selecione um produto</option>';

    produtos.forEach(produto => {
        if (produto.estoque > 0) {
            const opcao = document.createElement('option');
            opcao.value = produto.id;
            opcao.textContent = `${produto.nome} — ${formatarMoeda(produto.preco)} (${produto.estoque} disponíveis)`;
            selecao.appendChild(opcao);
        }
    });

    calcularTotalVenda();
}

// CALCULAR TOTAL DA VENDA
function calcularTotalVenda() {
    const id = Number(document.getElementById('produto-venda').value);
    const quantidade = Number(document.getElementById('quantidade-venda').value);

    const produto = produtos.find(item => item.id === id);

    const total = produto && Number.isInteger(quantidade) && quantidade > 0
        ? produto.preco * quantidade
        : 0;

    document.getElementById('valor-calculado').textContent = formatarMoeda(total);
}

document.getElementById('produto-venda').addEventListener('change', calcularTotalVenda);
document.getElementById('quantidade-venda').addEventListener('input', calcularTotalVenda);

// REGISTRAR VENDA
document.getElementById('form-venda').addEventListener('submit', evento => {
    evento.preventDefault();

    const id = Number(document.getElementById('produto-venda').value);
    const quantidade = Number(document.getElementById('quantidade-venda').value);

    const produto = produtos.find(item => item.id === id);

    if (!produto) {
        alert('Selecione um produto válido.');
        return;
    }

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
        alert('Informe uma quantidade válida.');
        return;
    }

    if (quantidade > produto.estoque) {
        alert(`Estoque insuficiente. Disponível: ${produto.estoque}`);
        return;
    }

    const total = produto.preco * quantidade;

    vendas.push({
        id: Date.now(),
        produto: produto.nome,
        quantidade,
        preco: produto.preco,
        total,
        data: new Date()
    });

    produto.estoque -= quantidade;

    evento.target.reset();
    modalVenda.classList.remove('aberto');

    atualizarSistema();
    alert('Venda registrada com sucesso!');
});

// CRIAR GRÁFICOS
function criarGraficos() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não foi carregado.');
        return;
    }

    const canvasFaturamento = document.getElementById('grafico-faturamento');
    const canvasEstoque = document.getElementById('grafico-estoque');

    if (!canvasFaturamento || !canvasEstoque) {
        console.error('Não foi possível encontrar os elementos dos gráficos.');
        return;
    }

    // GRÁFICO DE FATURAMENTO
    graficoFaturamento = new Chart(canvasFaturamento, {
        type: 'line',

        data: {
            labels: [],
            datasets: [{
                label: 'Faturamento',
                data: [],
                borderColor: '#42d392',
                backgroundColor: 'rgba(66, 211, 146, 0.12)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: '#42d392'
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    callbacks: {
                        label: contexto => formatarMoeda(contexto.raw)
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#91a198'
                    }
                },

                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(145, 161, 152, 0.12)'
                    },
                    ticks: {
                        color: '#91a198',
                        callback: valor => 'R$ ' + valor
                    }
                }
            }
        }
    });

    // GRÁFICO DE ESTOQUE
    graficoEstoque = new Chart(canvasEstoque, {
        type: 'doughnut',

        data: {
            labels: ['Estoque normal', 'Estoque baixo'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#42d392', '#e16b65'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    atualizarGraficos();
}

// ATUALIZAR GRÁFICO DE FATURAMENTO
function atualizarGraficoFaturamento() {
    const hoje = new Date();
    const labels = [];
    const valores = [];

    for (let i = 6; i >= 0; i--) {
        const dia = new Date(hoje);
        dia.setDate(hoje.getDate() - i);

        const dataFormatada = dia.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });

        const faturamentoDia = vendas
            .filter(venda =>
                venda.data.toDateString() === dia.toDateString()
            )
            .reduce((soma, venda) => soma + venda.total, 0);

        labels.push(dataFormatada);
        valores.push(faturamentoDia);
    }

    graficoFaturamento.data.labels = labels;
    graficoFaturamento.data.datasets[0].data = valores;

    graficoFaturamento.update();
}

// ATUALIZAR GRÁFICO DE ESTOQUE
function atualizarGraficoEstoque() {
    const estoqueNormal = produtos.filter(produto => produto.estoque > 5).length;
    const estoqueBaixo = produtos.filter(produto => produto.estoque <= 5).length;

    if (produtos.length === 0) {
        graficoEstoque.data.labels = ['Sem produtos'];
        graficoEstoque.data.datasets[0].data = [1];
        graficoEstoque.data.datasets[0].backgroundColor = ['#34443a'];
    } else {
        graficoEstoque.data.labels = ['Estoque normal', 'Estoque baixo'];
        graficoEstoque.data.datasets[0].data = [estoqueNormal, estoqueBaixo];
        graficoEstoque.data.datasets[0].backgroundColor = ['#42d392', '#e16b65'];
    }

    graficoEstoque.update();
}

// ATUALIZAR OS DOIS GRÁFICOS
function atualizarGraficos() {
    if (!graficoFaturamento || !graficoEstoque) {
        return;
    }

    atualizarGraficoFaturamento();
    atualizarGraficoEstoque();
}

// ATUALIZAR DASHBOARD E TABELAS
function atualizarSistema() {
    const faturamento = vendas.reduce((soma, venda) => soma + venda.total, 0);

    document.getElementById('total-vendas').textContent = formatarMoeda(faturamento);
    document.getElementById('quantidade-vendas').textContent = vendas.length;
    document.getElementById('quantidade-produtos').textContent = produtos.length;

    const baixoEstoque = produtos.filter(produto => produto.estoque <= 5).length;
    document.getElementById('estoque-baixo').textContent = baixoEstoque;

    document.getElementById('contador-produtos').textContent =
        `${produtos.length} ITENS`;

    document.getElementById('contador-vendas').textContent =
        `${vendas.length} VENDAS`;

    atualizarTabelaProdutos();
    atualizarTabelaEstoque();
    atualizarTabelaVendas();
    atualizarTabelaRecentes();

    atualizarGraficos();
}

// TABELA DE PRODUTOS
function atualizarTabelaProdutos() {
    const tabela = document.getElementById('tabela-produtos');
    tabela.innerHTML = '';

    if (produtos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="4" class="empty">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    produtos.forEach(produto => {
        const situacao = produto.estoque <= 5
            ? '<span class="stock-tag baixo">Estoque baixo</span>'
            : '<span class="stock-tag">Disponível</span>';

        tabela.innerHTML += `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${formatarMoeda(produto.preco)}</td>
                <td>${produto.estoque}</td>
                <td>${situacao}</td>
            </tr>
        `;
    });
}

// TABELA DE ESTOQUE
function atualizarTabelaEstoque() {
    const tabela = document.getElementById('tabela-estoque');
    tabela.innerHTML = '';

    if (produtos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="3" class="empty">Nenhum produto cadastrado.</td></tr>';
        return;
    }

    produtos.forEach(produto => {
        const situacao = produto.estoque <= 5
            ? '<span class="stock-tag baixo">Repor estoque</span>'
            : '<span class="stock-tag">Normal</span>';

        tabela.innerHTML += `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${produto.estoque}</td>
                <td>${situacao}</td>
            </tr>
        `;
    });
}

// TABELA DE VENDAS
function atualizarTabelaVendas() {
    const tabela = document.getElementById('tabela-vendas');
    tabela.innerHTML = '';

    if (vendas.length === 0) {
        tabela.innerHTML = '<tr><td colspan="4" class="empty">Nenhuma venda registrada.</td></tr>';
        return;
    }

    [...vendas].reverse().forEach(venda => {
        tabela.innerHTML += `
            <tr>
                <td>${escaparHTML(venda.produto)}</td>
                <td>${venda.quantidade}</td>
                <td>${formatarMoeda(venda.preco)}</td>
                <td><strong>${formatarMoeda(venda.total)}</strong></td>
            </tr>
        `;
    });
}

// VENDAS RECENTES
function atualizarTabelaRecentes() {
    const tabela = document.getElementById('tabela-recentes');
    tabela.innerHTML = '';

    if (vendas.length === 0) {
        tabela.innerHTML = '<tr><td colspan="3" class="empty">Nenhuma venda registrada.</td></tr>';
        return;
    }

    [...vendas].reverse().slice(0, 5).forEach(venda => {
        tabela.innerHTML += `
            <tr>
                <td>${escaparHTML(venda.produto)}</td>
                <td>${venda.quantidade}</td>
                <td><strong>${formatarMoeda(venda.total)}</strong></td>
            </tr>
        `;
    });
}

// PROTEGER TEXTO INSERIDO PELO USUÁRIO NA TABELA
function escaparHTML(texto) {
    return texto.replace(/[&<>"']/g, caractere => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[caractere]);
}

// ESTADO INICIAL
criarGraficos();
atualizarSistema();
