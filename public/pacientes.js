let pacientes = [];


// =====================================================
// ELEMENTOS
// =====================================================
const modalEdicao =
    document.getElementById(
        "modalEdicao"
    );

const formEdicao =
    document.getElementById(
        "formEdicao"
    );

const editarId =
    document.getElementById(
        "editarId"
    );

const editarNome =
    document.getElementById(
        "editarNome"
    );

const editarCpf =
    document.getElementById(
        "editarCpf"
    );

const editarTelefone =
    document.getElementById(
        "editarTelefone"
    );

const editarEmail =
    document.getElementById(
        "editarEmail"
    );

const editarNascimento =
    document.getElementById(
        "editarNascimento"
    );

const editarEndereco =
    document.getElementById(
        "editarEndereco"
    );

const editarObservacoes =
    document.getElementById(
        "editarObservacoes"
    );

const editarAtivo =
    document.getElementById(
        "editarAtivo"
    );
const listaPacientes =
    document.getElementById(
        "listaPacientes"
    );

const buscaPaciente =
    document.getElementById(
        "buscaPaciente"
    );

const contador =
    document.getElementById(
        "contador"
    );

const btnAtualizar =
    document.getElementById(
        "btnAtualizar"
    );

const modalHistorico =
    document.getElementById(
        "modalHistorico"
    );

const historicoNome =
    document.getElementById(
        "historicoNome"
    );

const resumoHistorico =
    document.getElementById(
        "resumoHistorico"
    );

const listaHistorico =
    document.getElementById(
        "listaHistorico"
    );


// =====================================================
// CARREGAR PACIENTES
// =====================================================

async function carregarPacientes() {

    try {

        listaPacientes.innerHTML = `
            <div class="estado-vazio">

                <div class="icone">
                    ⏳
                </div>

                Carregando pacientes...

            </div>
        `;


        const resposta =
            await fetch(
                "/pacientes"
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Não foi possível carregar os pacientes."
            );

        }


        pacientes =
            resultado.pacientes || [];


        renderizarPacientes(
            pacientes
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar pacientes:",
            erro
        );


        listaPacientes.innerHTML = `
            <div class="estado-vazio">

                <div class="icone">
                    ⚠️
                </div>

                Erro ao carregar pacientes.

            </div>
        `;

        mostrarMensagem(
            erro.message,
            true
        );

    }

}


// =====================================================
// RENDERIZAR PACIENTES
// =====================================================

function renderizarPacientes(
    lista
) {

    contador.textContent =
        `${lista.length} paciente(s) encontrado(s)`;


    if (
        lista.length === 0
    ) {

        listaPacientes.innerHTML = `
            <div class="estado-vazio">

                <div class="icone">
                    👤
                </div>

                <strong>
                    Nenhum paciente encontrado.
                </strong>

                <p>
                    Tente alterar o termo da busca.
                </p>

            </div>
        `;

        return;

    }


    listaPacientes.innerHTML =
        lista
            .map(
                paciente => {

                    const nome =
                        paciente.nome ||
                        "Paciente";


                    const telefone =
                        paciente.telefone ||
                        "Não informado";


                    const cpf =
                        paciente.cpf ||
                        "Não informado";


                    const email =
                        paciente.email ||
                        "Não informado";


                    const nascimento =
                        paciente.data_nascimento
                            ? formatarData(
                                paciente.data_nascimento
                            )
                            : "Não informado";


                    const endereco =
                        paciente.endereco ||
                        "Não informado";


                    const observacoes =
                        paciente.observacoes ||
                        "";


                    const ativo =
                        paciente.ativo !== false;


                    return `
                        <div
                            class="paciente-card"
                        >

                            <div
                                class="paciente-cabecalho"
                            >

                                <div
                                    class="avatar-paciente"
                                >
                                    👤
                                </div>

                                <div>

                                    <div
                                        class="paciente-nome"
                                    >
                                        ${escaparHTML(
                                            nome
                                        )}
                                    </div>

                                    <div
                                        class="paciente-status"
                                        style="
                                            color:
                                            ${ativo
                                                ? "#16a34a"
                                                : "#dc2626"};
                                        "
                                    >
                                        ${ativo
                                            ? "● Cadastro ativo"
                                            : "● Cadastro inativo"}
                                    </div>

                                </div>

                            </div>


                            <div
                                class="dados-paciente"
                            >

                                <strong>
                                    📱 Telefone:
                                </strong>
                                ${escaparHTML(
                                    telefone
                                )}

                                <br>


                                <strong>
                                    🪪 CPF:
                                </strong>
                                ${escaparHTML(
                                    cpf
                                )}

                                <br>


                                <strong>
                                    📧 E-mail:
                                </strong>
                                ${escaparHTML(
                                    email
                                )}

                                <br>


                                <strong>
                                    🎂 Nascimento:
                                </strong>
                                ${escaparHTML(
                                    nascimento
                                )}

                                <br>


                                <strong>
                                    📍 Endereço:
                                </strong>
                                ${escaparHTML(
                                    endereco
                                )}

                                ${
                                    observacoes
                                        ? `
                                            <br>

                                            <strong>
                                                📝 Observações:
                                            </strong>
                                            ${escaparHTML(
                                                observacoes
                                            )}
                                        `
                                        : ""
                                }

                            </div>


                            <div
                                class="acoes-paciente"
                            >

                                <button
                                    type="button"
                                    class="btn-paciente btn-historico"
                                    onclick="verHistorico('${paciente.id}')"
                                >
                                    📋 Histórico
                                </button>


                                <button
                                    type="button"
                                    class="btn-paciente btn-editar"
                                    onclick="editarPaciente('${paciente.id}')"
                                >
                                    ✏️ Editar
                                </button>


                                <button
                                    type="button"
                                    class="btn-paciente btn-excluir"
                                    onclick="excluirPaciente('${paciente.id}')"
                                >
                                    🔴 Inativar
                                </button>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


// =====================================================
// BUSCA
// =====================================================

buscaPaciente.addEventListener(
    "input",
    function () {

        const termo =
            buscaPaciente.value
                .trim()
                .toLowerCase();


        if (!termo) {

            renderizarPacientes(
                pacientes
            );

            return;

        }


        const filtrados =
            pacientes.filter(
                paciente => {

                    const nome =
                        String(
                            paciente.nome || ""
                        ).toLowerCase();


                    const cpf =
                        String(
                            paciente.cpf || ""
                        ).toLowerCase();


                    const telefone =
                        String(
                            paciente.telefone || ""
                        ).toLowerCase();


                    return (
                        nome.includes(
                            termo
                        )
                        ||
                        cpf.includes(
                            termo
                        )
                        ||
                        telefone.includes(
                            termo
                        )
                    );

                }
            );


        renderizarPacientes(
            filtrados
        );

    }
);


// =====================================================
// ATUALIZAR
// =====================================================

btnAtualizar.addEventListener(
    "click",
    carregarPacientes
);


// =====================================================
// HISTÓRICO
// =====================================================

// =====================================================
// HISTÓRICO DO PACIENTE
// =====================================================

async function verHistorico(id) {

    const paciente =
        pacientes.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!paciente) {

        mostrarMensagem(
            "Paciente não encontrado.",
            true
        );

        return;

    }


    historicoNome.textContent =
        `${paciente.nome} • 📱 ${
            paciente.telefone || "Sem telefone"
        }`;


    modalHistorico.classList.add(
        "aberto"
    );


    listaHistorico.innerHTML = `
        <div class="estado-vazio">

            <div class="icone">
                ⏳
            </div>

            Carregando histórico...

        </div>
    `;


    try {

        const resposta =
            await fetch(
                "/agendamentos"
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Não foi possível carregar o histórico."
            );

        }


        const todosAgendamentos =
            resultado.agendamentos || [];


        // =============================================
        // FILTRAR PELO PACIENTE
        // =============================================

        const historico =
            todosAgendamentos.filter(
                agendamento =>
                    String(
                        agendamento.paciente_id
                    ) ===
                    String(
                        paciente.id
                    )
            );


        mostrarHistorico(
            historico
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar histórico:",
            erro
        );


        listaHistorico.innerHTML = `
            <div class="estado-vazio">

                <div class="icone">
                    ⚠️
                </div>

                Não foi possível carregar
                o histórico.

            </div>
        `;


        mostrarMensagem(
            erro.message,
            true
        );

    }

}


// =====================================================
// MOSTRAR HISTÓRICO
// =====================================================

function mostrarHistorico(
    historico
) {

    // =============================================
    // CONTADORES
    // =============================================

    const total =
        historico.length;


    const atendidos =
        historico.filter(
            item =>
                item.status ===
                "atendido"
        ).length;


    const cancelados =
        historico.filter(
            item =>
                item.status ===
                "cancelado"
        ).length;


    const faltas =
        historico.filter(
            item =>
                item.status ===
                "faltou"
        ).length;


    const valorRealizado =
        historico
            .filter(
                item =>
                    item.status ===
                    "atendido"
            )
            .reduce(
                (
                    totalValor,
                    item
                ) => {

                    return (
                        totalValor +
                        Number(
                            item.valor || 0
                        )
                    );

                },
                0
            );


    // =============================================
    // RESUMO
    // =============================================

    resumoHistorico.innerHTML = `

        <div
            style="
                background:#f3f4f6;
                padding:12px;
                border-radius:8px;
                text-align:center;
            "
        >

            <strong>
                ${total}
            </strong>

            <br>

            <small>
                Consultas
            </small>

        </div>


        <div
            style="
                background:#dcfce7;
                padding:12px;
                border-radius:8px;
                text-align:center;
            "
        >

            <strong>
                ${atendidos}
            </strong>

            <br>

            <small>
                Atendidos
            </small>

        </div>


        <div
            style="
                background:#fee2e2;
                padding:12px;
                border-radius:8px;
                text-align:center;
            "
        >

            <strong>
                ${cancelados}
            </strong>

            <br>

            <small>
                Cancelados
            </small>

        </div>

    `;


    // =============================================
    // SEM HISTÓRICO
    // =============================================

    if (
        historico.length === 0
    ) {

        listaHistorico.innerHTML = `

            <div class="estado-vazio">

                <div class="icone">
                    📋
                </div>

                <strong>
                    Nenhuma consulta encontrada.
                </strong>

            </div>

        `;

        return;

    }


    // =============================================
    // ORDENAR DO MAIS RECENTE
    // =============================================

    historico.sort(
        (
            a,
            b
        ) =>
            new Date(
                b.data_hora
            ) -
            new Date(
                a.data_hora
            )
    );


    // =============================================
    // MONTAR LISTA
    // =============================================

    listaHistorico.innerHTML =
        historico
            .map(
                agendamento => {

                    const data =
                        new Date(
                            agendamento.data_hora
                        );


                    const dataFormatada =
                        data.toLocaleDateString(
                            "pt-BR"
                        );


                    const horaFormatada =
                        data.toLocaleTimeString(
                            "pt-BR",
                            {
                                hour:
                                    "2-digit",
                                minute:
                                    "2-digit"
                            }
                        );


                    const dentista =
                        agendamento
                            .dentistas
                            ?.nome ||
                        "Dentista";


                    const procedimento =
                        agendamento
                            .procedimentos
                            ?.nome ||
                        "Procedimento";


                    const valor =
                        Number(
                            agendamento.valor ||
                            0
                        );


                    const status =
                        agendamento.status ||
                        "agendado";


                    return `

                        <div
                            style="
                                border:1px solid #e5e7eb;
                                border-radius:10px;
                                padding:15px;
                                margin-bottom:12px;
                                background:#fafafa;
                            "
                        >

                            <div
                                style="
                                    display:flex;
                                    justify-content:
                                        space-between;
                                    align-items:center;
                                    gap:10px;
                                "
                            >

                                <strong>
                                    📅
                                    ${dataFormatada}
                                    •
                                    ${horaFormatada}
                                </strong>


                                <span
                                    class="
                                        status-badge
                                        status-${status}
                                    "
                                >
                                    ${textoStatus(
                                        status
                                    )}
                                </span>

                            </div>


                            <div
                                style="
                                    margin-top:10px;
                                    line-height:1.7;
                                    color:#4b5563;
                                "
                            >

                                🦷
                                <strong>
                                    Dentista:
                                </strong>

                                ${escaparHTML(
                                    dentista
                                )}

                                <br>


                                🩺
                                <strong>
                                    Procedimento:
                                </strong>

                                ${escaparHTML(
                                    procedimento
                                )}

                                <br>


                                💰
                                <strong>
                                    Valor:
                                </strong>

                                ${formatarMoeda(
                                    valor
                                )}

                            </div>

                        </div>

                    `;

                }
            )
            .join("");


    // =============================================
    // TOTAL REALIZADO
    // =============================================

    listaHistorico.innerHTML += `

        <div
            style="
                margin-top:20px;
                padding:18px;
                border-radius:10px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
            "
        >

            <strong>
                💰 Total realizado:
            </strong>

            <span
                style="
                    font-size:20px;
                    font-weight:bold;
                    color:#1d4ed8;
                "
            >
                ${formatarMoeda(
                    valorRealizado
                )}
            </span>


            ${
                faltas > 0
                    ? `
                        <div
                            style="
                                margin-top:8px;
                                color:#6b7280;
                            "
                        >
                            ⚫ Faltas:
                            ${faltas}
                        </div>
                    `
                    : ""
            }

        </div>

    `;

}



// =====================================================
// FECHAR HISTÓRICO
// =====================================================

function fecharHistorico() {

    modalHistorico.classList.remove(
        "aberto"
    );

}


// =====================================================
// EVENTOS DO HISTÓRICO
// =====================================================

const botaoFecharHistorico =
    document.getElementById(
        "fecharHistorico"
    );


if (botaoFecharHistorico) {

    botaoFecharHistorico.addEventListener(
        "click",
        fecharHistorico
    );

}


if (modalHistorico) {

    modalHistorico.addEventListener(
        "click",
        function(evento) {

            if (
                evento.target ===
                modalHistorico
            ) {

                fecharHistorico();

            }

        }
    );

}
// =====================================================
// FORMATAR DATA
// =====================================================

function formatarData(data) {

    if (!data) {
        return "";
    }

    const partes =
        String(data).split("-");

    if (partes.length === 3) {

        return `${partes[2]}/${partes[1]}/${partes[0]}`;

    }

    return data;

}


// =====================================================
// MENSAGEM
// =====================================================

function mostrarMensagem(
    texto,
    erro = false
) {

    const elemento =
        document.getElementById(
            "mensagem"
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        texto;

    elemento.className =
        erro
            ? "mensagem erro"
            : "mensagem";

    elemento.style.display =
        "block";

    setTimeout(
        () => {

            elemento.style.display =
                "none";

        },
        3000
    );

}

// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTML(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }

    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// INICIAR
// =====================================================

carregarPacientes();