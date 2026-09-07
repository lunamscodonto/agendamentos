const dataInicio = document.getElementById("dataInicio");
const dataFim = document.getElementById("dataFim");
const dentistaId = document.getElementById("dentistaId");
const btnGerar = document.getElementById("btnGerar");
const resultado = document.getElementById("resultado");
const totalAtendidos = document.getElementById("totalAtendidos");
const totalRealizado = document.getElementById("totalRealizado");
const ticketMedio = document.getElementById("ticketMedio");
const mensagem = document.getElementById("mensagem");
const btnImprimir = document.getElementById("btnImprimir");
const btnExcel = document.getElementById("btnExcel");

let ultimoRelatorio = null;

let dentistas = [];

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}

function mostrarMensagem(texto, erro = false) {
    mensagem.textContent = texto;
    mensagem.className =
        erro ? "mensagem erro" : "mensagem";
    mensagem.style.display = "block";

    setTimeout(() => {
        mensagem.style.display = "none";
    }, 3000);
}

function dataISOInicio(data) {
    return `${data}T00:00:00`;
}

function dataISOFim(data) {
    const [ano, mes, dia] = data.split("-").map(Number);
    const fim = new Date(ano, mes - 1, dia);
    fim.setDate(fim.getDate() + 1);

    const y = fim.getFullYear();
    const m = String(fim.getMonth() + 1).padStart(2, "0");
    const d = String(fim.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}T00:00:00`;
}

function definirPeriodoInicial() {
    const hoje = new Date();

    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    dataInicio.value = `${ano}-${mes}-01`;
    dataFim.value = `${ano}-${mes}-${dia}`;
}

async function carregarDentistas() {

    try {

        const resposta =
            await fetch("/dentistas");

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível carregar os dentistas."
            );
        }

        dentistas =
            dados.dentistas || [];

        dentistaId.innerHTML = `
            <option value="">
                Todos os dentistas
            </option>
        `;

        dentistas.forEach(dentista => {

            const option =
                document.createElement("option");

            option.value =
                dentista.id;

            option.textContent =
                dentista.especialidade
                    ? `${dentista.nome} - ${dentista.especialidade}`
                    : dentista.nome;

            dentistaId.appendChild(option);
        });

    } catch (erro) {

        console.error(
            "Erro ao carregar dentistas:",
            erro
        );

        mostrarMensagem(
            erro.message,
            true
        );
    }
}

async function gerarRelatorio() {

    if (!dataInicio.value || !dataFim.value) {
        mostrarMensagem(
            "Informe a data inicial e a data final.",
            true
        );
        return;
    }

    if (dataInicio.value > dataFim.value) {
        mostrarMensagem(
            "A data inicial não pode ser maior que a data final.",
            true
        );
        return;
    }

    resultado.innerHTML = `
        <div class="estado">
            ⏳ Carregando relatório...
        </div>
    `;

    try {

        let url =
            `/agendamentos?data_inicio=${encodeURIComponent(
                dataISOInicio(dataInicio.value)
            )}&data_fim=${encodeURIComponent(
                dataISOFim(dataFim.value)
            )}`;

        if (dentistaId.value) {
            url +=
                `&dentista_id=${encodeURIComponent(
                    dentistaId.value
                )}`;
        }

        const resposta =
            await fetch(url);

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro ||
                "Não foi possível carregar o relatório."
            );
        }

        const agendamentos =
            dados.agendamentos || [];

        const atendidos =
            agendamentos.filter(
                item =>
                    item.status === "atendido"
            );

        ultimoRelatorio = {
            atendidos,
            dataInicio: dataInicio.value,
            dataFim: dataFim.value,
            dentista: dentistaId.options[dentistaId.selectedIndex]?.text || "Todos os dentistas"
        };

        const total =
            atendidos.reduce(
                (soma, item) =>
                    soma + Number(item.valor || 0),
                0
            );

        totalAtendidos.textContent =
            atendidos.length;

        totalRealizado.textContent =
            formatarMoeda(total);

        ticketMedio.textContent =
            formatarMoeda(
                atendidos.length
                    ? total / atendidos.length
                    : 0
            );

        renderizarPorDentista(
            atendidos
        );

    } catch (erro) {

        console.error(
            "Erro ao gerar relatório:",
            erro
        );

        resultado.innerHTML = `
            <div class="estado">
                ⚠️ Não foi possível carregar o relatório.
            </div>
        `;

        mostrarMensagem(
            erro.message,
            true
        );
    }
}

function renderizarPorDentista(atendidos) {

    if (!atendidos.length) {

        resultado.innerHTML = `
            <div class="estado">
                Nenhum atendimento realizado
                encontrado no período informado.
            </div>
        `;

        return;
    }

    const grupos = {};

    atendidos.forEach(item => {

        const id =
            item.dentista_id ||
            item.dentistas?.id ||
            "sem-dentista";

        const nome =
            item.dentistas?.nome ||
            "Dentista não informado";

        if (!grupos[id]) {

            grupos[id] = {
                nome,
                atendimentos: 0,
                total: 0
            };
        }

        grupos[id].atendimentos += 1;

        grupos[id].total +=
            Number(item.valor || 0);
    });

    const linhas =
        Object.values(grupos)
            .sort(
                (a, b) =>
                    b.total - a.total
            )
            .map(item => {

                const ticket =
                    item.atendimentos
                        ? item.total /
                          item.atendimentos
                        : 0;

                return `
                    <tr>
                        <td>
                            <strong>
                                🦷 ${escaparHTML(item.nome)}
                            </strong>
                        </td>

                        <td>
                            ${item.atendimentos}
                        </td>

                        <td class="valor">
                            ${formatarMoeda(item.total)}
                        </td>

                        <td>
                            ${formatarMoeda(ticket)}
                        </td>
                    </tr>
                `;
            })
            .join("");

    const inicioFormatado =
        dataInicio.value.split("-").reverse().join("/");

    const fimFormatado =
        dataFim.value.split("-").reverse().join("/");

    resultado.innerHTML = `
        <div class="periodo-relatorio">
            Período: <strong>${inicioFormatado}</strong>
            até <strong>${fimFormatado}</strong>
            • Dentista: <strong>${escaparHTML(
                dentistaId.options[dentistaId.selectedIndex]?.text ||
                "Todos os dentistas"
            )}</strong>
        </div>

        <div class="tabela-wrap">

            <table>

                <thead>
                    <tr>
                        <th>Dentista</th>
                        <th>Atendimentos</th>
                        <th>Total realizado</th>
                        <th>Ticket médio</th>
                    </tr>
                </thead>

                <tbody>
                    ${linhas}
                </tbody>

            </table>

        </div>
    `;
}

function escaparHTML(texto) {

    if (
        texto === null ||
        texto === undefined
    ) {
        return "";
    }

    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

btnGerar.addEventListener(
    "click",
    gerarRelatorio
);

definirPeriodoInicial();

carregarDentistas();


// =====================================================
// IMPRESSÃO / PDF
// =====================================================

function imprimirRelatorio() {

    if (!ultimoRelatorio) {
        mostrarMensagem(
            "Gere o relatório antes de imprimir.",
            true
        );
        return;
    }

    window.print();
}


// =====================================================
// EXPORTAR PARA EXCEL
// =====================================================

function escaparExcel(texto) {

    return String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}

function exportarExcel() {

    if (!ultimoRelatorio) {
        mostrarMensagem(
            "Gere o relatório antes de exportar.",
            true
        );
        return;
    }

    const atendidos =
        ultimoRelatorio.atendidos || [];

    const grupos = {};

    atendidos.forEach(item => {

        const id =
            item.dentista_id ||
            item.dentistas?.id ||
            "sem-dentista";

        const nome =
            item.dentistas?.nome ||
            "Dentista não informado";

        if (!grupos[id]) {
            grupos[id] = {
                nome,
                atendimentos: 0,
                total: 0
            };
        }

        grupos[id].atendimentos += 1;

        grupos[id].total +=
            Number(item.valor || 0);
    });

    const inicio =
        ultimoRelatorio.dataInicio
            .split("-")
            .reverse()
            .join("/");

    const fim =
        ultimoRelatorio.dataFim
            .split("-")
            .reverse()
            .join("/");

    const linhas =
        Object.values(grupos)
            .sort(
                (a, b) =>
                    b.total - a.total
            )
            .map(item => {

                const ticket =
                    item.atendimentos
                        ? item.total /
                          item.atendimentos
                        : 0;

                return `
                    <tr>
                        <td>${escaparExcel(item.nome)}</td>
                        <td>${item.atendimentos}</td>
                        <td>${item.total.toFixed(2).replace(".", ",")}</td>
                        <td>${ticket.toFixed(2).replace(".", ",")}</td>
                    </tr>
                `;
            })
            .join("");

    const total =
        atendidos.reduce(
            (soma, item) =>
                soma + Number(item.valor || 0),
            0
        );

    const tabela = `
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body>

            <h2>Resumo Financeiro</h2>

            <p>
                Período: ${inicio} até ${fim}
            </p>

            <p>
                Dentista:
                ${escaparExcel(
                    ultimoRelatorio.dentista
                )}
            </p>

            <table border="1">
                <thead>
                    <tr>
                        <th>Dentista</th>
                        <th>Atendimentos</th>
                        <th>Total realizado (R$)</th>
                        <th>Ticket médio (R$)</th>
                    </tr>
                </thead>

                <tbody>
                    ${linhas}

                    <tr>
                        <th>TOTAL GERAL</th>
                        <th>${atendidos.length}</th>
                        <th>${total.toFixed(2).replace(".", ",")}</th>
                        <th>${
                            atendidos.length
                                ? (total / atendidos.length)
                                    .toFixed(2)
                                    .replace(".", ",")
                                : "0,00"
                        }</th>
                    </tr>
                </tbody>
            </table>

        </body>
        </html>
    `;

    const blob =
        new Blob(
            ["\ufeff", tabela],
            {
                type:
                    "application/vnd.ms-excel;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        `relatorio_financeiro_${ultimoRelatorio.dataInicio}_${ultimoRelatorio.dataFim}.xls`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

btnImprimir.addEventListener(
    "click",
    imprimirRelatorio
);

btnExcel.addEventListener(
    "click",
    exportarExcel
);
