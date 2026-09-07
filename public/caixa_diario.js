const $ = id => document.getElementById(id);

const formas = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    transferencia: "Transferência",
    outro: "Outros"
};

const moeda = valor =>
    Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

const esc = texto =>
    String(texto ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

function hoje() {
    const d = new Date();

    return `${d.getFullYear()}-${String(
        d.getMonth() + 1
    ).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;
}

function intervalo(data) {
    const inicio =
        new Date(`${data}T00:00:00`);

    const fim = new Date(inicio);

    fim.setDate(fim.getDate() + 1);

    return [
        inicio.toISOString(),
        fim.toISOString()
    ];
}

async function buscarJSON(url) {
    const resposta =
        await fetch(url);

    const texto =
        await resposta.text();

    let resultado;

    try {
        resultado =
            texto ? JSON.parse(texto) : {};
    } catch {
        throw new Error(
            `O servidor retornou uma resposta inválida (${resposta.status}).`
        );
    }

    if (!resposta.ok) {
        throw new Error(
            resultado.erro ||
            resultado.message ||
            "Erro ao consultar o servidor."
        );
    }

    return resultado;
}

async function carregar() {

    const data =
        $("data").value;

    if (!data) {
        return;
    }

    document.querySelectorAll(
        "#formas,#dentistas,#detalhamento"
    ).forEach(elemento => {
        elemento.innerHTML =
            '<div class="estado">⏳ Carregando...</div>';
    });

    try {

        const [inicio, fim] =
            intervalo(data);

        const pagamentosURL =
            `/financeiro/pagamentos?data_inicio=${encodeURIComponent(
                inicio
            )}&data_fim=${encodeURIComponent(
                fim
            )}`;

        const agendamentosURL =
            `/agendamentos?data_inicio=${encodeURIComponent(
                inicio
            )}&data_fim=${encodeURIComponent(
                fim
            )}`;

        const [
            pagamentosResultado,
            agendamentosResultado
        ] = await Promise.all([
            buscarJSON(pagamentosURL),
            buscarJSON(agendamentosURL)
        ]);

        const pagamentos =
            pagamentosResultado.pagamentos || [];

        const agendamentos =
            (agendamentosResultado.agendamentos || [])
                .filter(item =>
                    item.status === "atendido"
                );

        renderizar(
            pagamentos,
            agendamentos
        );

    } catch (erro) {

        console.error(
            "Erro no Caixa Diário:",
            erro
        );

        document.querySelectorAll(
            "#formas,#dentistas,#detalhamento"
        ).forEach(elemento => {
            elemento.innerHTML =
                `<div class="estado">
                    ⚠️ ${esc(erro.message)}
                </div>`;
        });
    }
}

function totalPago(
    agendamentoId,
    pagamentos
) {
    return pagamentos
        .filter(
            pagamento =>
                pagamento.agendamento_id ===
                agendamentoId
        )
        .reduce(
            (total, pagamento) =>
                total +
                Number(pagamento.valor || 0),
            0
        );
}

function renderizar(
    pagamentos,
    agendamentos
) {

    const formasTotal = {};
    const dentistasTotal = {};

    let totalRecebido = 0;
    let saldoPendente = 0;
    let parciais = 0;

    /*
     * RECEBIMENTOS DO DIA
     */
    pagamentos.forEach(
        pagamento => {

            const valor =
                Number(pagamento.valor || 0);

            totalRecebido += valor;

            const forma =
                pagamento.forma_pagamento ||
                "outro";

            formasTotal[forma] =
                (formasTotal[forma] || 0) +
                valor;

            const dentista =
                pagamento
                    .agendamentos
                    ?.dentistas
                    ?.nome ||
                "Dentista não informado";

            if (!dentistasTotal[dentista]) {
                dentistasTotal[dentista] = {
                    valor: 0,
                    quantidade: 0
                };
            }

            dentistasTotal[dentista].valor +=
                valor;

            dentistasTotal[dentista].quantidade++;
        }
    );

    /*
     * SALDO PENDENTE REAL DO DIA
     *
     * Considera os atendimentos realizados
     * no dia, mesmo que ainda não tenham
     * nenhum pagamento registrado.
     */
    const detalhes = [];

    agendamentos.forEach(
        agendamento => {

            const valorConsulta =
                Number(
                    agendamento.valor || 0
                );

            const pago =
                totalPago(
                    agendamento.id,
                    pagamentos
                );

            /*
             * Compatibilidade com registros
             * antigos marcados diretamente
             * como "pago".
             */
            const pagoFinal =
                pago > 0
                    ? pago
                    : agendamento.pagamento_status === "pago"
                        ? valorConsulta
                        : 0;

            const saldo =
                Math.max(
                    0,
                    valorConsulta -
                    pagoFinal
                );

            let status = "Pendente";

            if (saldo <= 0.005) {
                status = "Pago";
            } else if (pagoFinal > 0) {
                status = "Parcial";
                parciais++;
            } else {
                saldoPendente += saldo;
            }

            if (status === "Parcial") {
                saldoPendente += saldo;
            }

            detalhes.push({
                id: agendamento.id,
                paciente:
                    agendamento
                        .pacientes
                        ?.nome ||
                    "Paciente",
                dentista:
                    agendamento
                        .dentistas
                        ?.nome ||
                    "Dentista não informado",
                procedimento:
                    agendamento
                        .procedimentos
                        ?.nome ||
                    "Procedimento",
                valor: valorConsulta,
                pago: pagoFinal,
                saldo,
                status
            });
        }
    );

    $("total").textContent =
        moeda(totalRecebido);

    $("atendimentos").textContent =
        agendamentos.length;

    $("pendente").textContent =
        moeda(saldoPendente);

    $("parcial").textContent =
        parciais;

    /*
     * FORMAS DE PAGAMENTO
     */
    const formasLista =
        Object.entries(formasTotal)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );

    $("formas").innerHTML =
        formasLista.length
            ? formasLista
                .map(
                    ([forma, valor]) => `
                        <div class="linha">
                            <span>
                                ${esc(
                                    formas[forma] ||
                                    "Outros"
                                )}
                            </span>

                            <strong>
                                ${moeda(valor)}
                            </strong>
                        </div>
                    `
                )
                .join("")
            : `
                <div class="estado">
                    Nenhum recebimento no dia.
                </div>
            `;

    /*
     * POR DENTISTA
     */
    const dentistasLista =
        Object.entries(dentistasTotal)
            .sort(
                (a, b) =>
                    b[1].valor -
                    a[1].valor
            );

    $("dentistas").innerHTML =
        dentistasLista.length
            ? dentistasLista
                .map(
                    ([nome, item]) => `
                        <div class="linha">

                            <span>
                                🦷
                                ${esc(nome)}

                                <br>

                                <small>
                                    ${item.quantidade}
                                    pagamento(s)
                                </small>
                            </span>

                            <strong>
                                ${moeda(item.valor)}
                            </strong>

                        </div>
                    `
                )
                .join("")
            : `
                <div class="estado">
                    Nenhum recebimento por dentista.
                </div>
            `;

    /*
     * DETALHAMENTO COMPLETO
     */
    detalhes.sort(
        (a, b) =>
            b.valor - a.valor
    );

    $("detalhamento").innerHTML =
        detalhes.length
            ? detalhes
                .map(
                    item => {

                        let classe =
                            "pendente";

                        if (
                            item.status ===
                            "Pago"
                        ) {
                            classe = "pago";
                        }

                        if (
                            item.status ===
                            "Parcial"
                        ) {
                            classe = "parcial";
                        }

                        return `
                            <div class="linha">

                                <span>

                                    <strong>
                                        ${esc(
                                            item.paciente
                                        )}
                                    </strong>

                                    <br>

                                    <small>
                                        🦷
                                        ${esc(
                                            item.dentista
                                        )}
                                        •
                                        ${esc(
                                            item.procedimento
                                        )}
                                    </small>

                                    <br>

                                    <small>
                                        Valor:
                                        ${moeda(
                                            item.valor
                                        )}
                                        |
                                        Pago:
                                        ${moeda(
                                            item.pago
                                        )}
                                        |
                                        Saldo:
                                        ${moeda(
                                            item.saldo
                                        )}
                                    </small>

                                </span>

                                <strong>
                                    ${item.status}
                                </strong>

                            </div>
                        `;
                    }
                )
                .join("")
            : `
                <div class="estado">
                    Nenhum atendimento realizado
                    neste dia.
                </div>
            `;
}

$("data").value =
    hoje();

$("consultar").addEventListener(
    "click",
    carregar
);

$("btnImprimir").addEventListener(
    "click",
    () => window.print()
);

carregar();
