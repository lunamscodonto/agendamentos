const calendario =
    document.getElementById("calendario");

const tituloMes =
    document.getElementById("tituloMes");

const horarios =
    document.getElementById("horarios");

const dataSelecionada =
    document.getElementById("dataSelecionada");

const filtroDentista =
    document.getElementById("filtroDentista");

const mesAnterior =
    document.getElementById("mesAnterior");

const proximoMes =
    document.getElementById("proximoMes");

const modal =
    document.getElementById("modal");

const fecharModal =
    document.getElementById("fecharModal");

const cancelarModal =
    document.getElementById("cancelarModal");

const formAgendamento =
    document.getElementById("formAgendamento");

const pacienteSelect =
    document.getElementById("paciente_id");

const dentistaSelect =
    document.getElementById("dentista_id");

const procedimentoSelect =
    document.getElementById("procedimento_id");

const dataHoraInput =
    document.getElementById("data_hora");

const observacoesInput =
    document.getElementById("observacoes");

const resumoProcedimento =
    document.getElementById("resumoProcedimento");

const mensagem =
    document.getElementById("mensagem");


let dataAtual = new Date();

let dataSelecionadaAtual = null;

let pacientes = [];

let dentistas = [];

let procedimentos = [];

let agendamentos = [];
let retornos = [];


// =====================================================
// NOMES DOS MESES
// =====================================================

const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
];


// =====================================================
// INICIAR
// =====================================================

async function iniciar() {

    await Promise.all([
        carregarPacientes(),
        carregarDentistas(),
        carregarProcedimentos()
    ]);

    gerarCalendario();

    selecionarHoje();

}


// =====================================================
// CARREGAR PACIENTES
// =====================================================

async function carregarPacientes() {

    const resposta =
        await fetch("/pacientes");

    const resultado =
        await resposta.json();

    pacientes =
        resultado.pacientes || [];


    pacienteSelect.innerHTML = `
        <option value="">
            Selecione o paciente
        </option>
    `;


    pacientes.forEach(paciente => {

        const option =
            document.createElement("option");

        option.value =
            paciente.id;

        option.textContent =
            paciente.nome;

        pacienteSelect.appendChild(option);

    });

}


// =====================================================
// CARREGAR DENTISTAS
// =====================================================

async function carregarDentistas() {

    try {

        const resposta = await fetch("/dentistas");

        if (!resposta.ok) {
            throw new Error(
                "Não foi possível carregar os dentistas."
            );
        }

        const resultado = await resposta.json();

        console.log(
            "Dentistas recebidos:",
            resultado.dentistas
        );

        dentistas = resultado.dentistas || [];


        // =========================================
        // SELECT DO FORMULÁRIO DE AGENDAMENTO
        // =========================================

        dentistaSelect.innerHTML = `
            <option value="">
                Selecione o dentista
            </option>
        `;


        dentistas.forEach(dentista => {

            const option =
                document.createElement("option");

            option.value = dentista.id;

            option.textContent =
                dentista.especialidade
                    ? `${dentista.nome} - ${dentista.especialidade}`
                    : dentista.nome;

            dentistaSelect.appendChild(option);

        });


        // =========================================
        // FILTRO DA AGENDA
        // =========================================

        filtroDentista.innerHTML = `
            <option value="">
                Todos os dentistas
            </option>
        `;


        dentistas.forEach(dentista => {

            const option =
                document.createElement("option");

            option.value = dentista.id;

            option.textContent =
                dentista.especialidade
                    ? `${dentista.nome} - ${dentista.especialidade}`
                    : dentista.nome;

            filtroDentista.appendChild(option);

        });


    } catch (erro) {

        console.error(
            "Erro ao carregar dentistas:",
            erro
        );

        mostrarMensagem(
            "Não foi possível carregar os dentistas.",
            true
        );

    }

}

// =====================================================
// CARREGAR PROCEDIMENTOS
// =====================================================

async function carregarProcedimentos() {

    const resposta =
        await fetch("/procedimentos");

    const resultado =
        await resposta.json();

    procedimentos =
        resultado.procedimentos || [];


    procedimentoSelect.innerHTML = `
        <option value="">
            Selecione o procedimento
        </option>
    `;


    procedimentos.forEach(procedimento => {

        const option =
            document.createElement("option");

        option.value =
            procedimento.id;

        option.textContent =
            `${procedimento.nome} - ${formatarMoeda(procedimento.valor)}`;

        procedimentoSelect.appendChild(option);

    });

}


// =====================================================
// CARREGAR AGENDAMENTOS DO MÊS
// =====================================================

async function carregarAgendamentosMes() {

    const primeiroDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
    const ultimoDia = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1);
    const inicio = formatarISO(primeiroDia);
    const fim = formatarISO(ultimoDia);

    const respostaAgendamentos = await fetch(`/agendamentos?data_inicio=${encodeURIComponent(inicio)}&data_fim=${encodeURIComponent(fim)}`);
    const resultadoAgendamentos = await respostaAgendamentos.json();
    agendamentos = resultadoAgendamentos.agendamentos || [];

    const dataInicioRetornos = formatarDataISO(primeiroDia);
    const dataFimRetornos = formatarDataISO(new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0));
    const respostaRetornos = await fetch(`/retornos?data_inicio=${encodeURIComponent(dataInicioRetornos)}&data_fim=${encodeURIComponent(dataFimRetornos)}`);
    if (!respostaRetornos.ok) throw new Error('Não foi possível carregar os retornos na Agenda.');
    const resultadoRetornos = await respostaRetornos.json();
    retornos = resultadoRetornos.retornos || [];

}

// =====================================================
// CALENDÁRIO
// =====================================================


async function gerarCalendario() {

    await carregarAgendamentosMes();


    calendario.innerHTML = "";


    tituloMes.textContent =
        `${nomesMeses[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;


    const diasSemana = [
        "DOM",
        "SEG",
        "TER",
        "QUA",
        "QUI",
        "SEX",
        "SÁB"
    ];


    diasSemana.forEach(dia => {

        const elemento =
            document.createElement("div");

        elemento.className =
            "dia-semana";

        elemento.textContent =
            dia;

        calendario.appendChild(elemento);

    });


    const primeiroDiaSemana =
        new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth(),
            1
        ).getDay();


    const quantidadeDias =
        new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth() + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < primeiroDiaSemana;
        i++
    ) {

        const vazio =
            document.createElement("div");

        calendario.appendChild(vazio);

    }


    for (
        let dia = 1;
        dia <= quantidadeDias;
        dia++
    ) {

        const elemento =
            document.createElement("button");

        elemento.type =
            "button";

        elemento.className =
            "dia";

        elemento.textContent =
            dia;


        const dataDia =
            new Date(
                dataAtual.getFullYear(),
                dataAtual.getMonth(),
                dia
            );


        if (mesmoDia(
            dataDia,
            new Date()
        )) {

            elemento.classList.add(
                "hoje"
            );

        }


        if (
            dataSelecionadaAtual &&
            mesmoDia(
                dataDia,
                dataSelecionadaAtual
            )
        ) {

            elemento.classList.add(
                "selecionado"
            );

        }


        if (
            existeAgendamentoNoDia(
                dataDia
            )
        ) {

            elemento.classList.add(
                "ocupado"
            );

        }


        elemento.addEventListener(
            "click",
            () => selecionarData(dataDia)
        );


        calendario.appendChild(
            elemento
        );

    }

}


// =====================================================
// SELECIONAR HOJE
// =====================================================

function selecionarHoje() {

    const hoje =
        new Date();


    dataSelecionadaAtual =
        new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate()
        );


    mostrarHorarios(
        dataSelecionadaAtual
    );


    gerarCalendario();

}


// =====================================================
// SELECIONAR DATA
// =====================================================

async function selecionarData(data) {

    dataSelecionadaAtual =
        new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );


    await mostrarHorarios(
        dataSelecionadaAtual
    );


    gerarCalendario();

}


// =====================================================
// MOSTRAR HORÁRIOS
// =====================================================

async function mostrarHorarios(data) {
    dataSelecionada.textContent = formatarData(data);
    horarios.innerHTML = "";

    const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const fim = new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);

    const respostaAgendamentos = await fetch(`/agendamentos?data_inicio=${encodeURIComponent(formatarISO(inicio))}&data_fim=${encodeURIComponent(formatarISO(fim))}`);
    if (!respostaAgendamentos.ok) throw new Error("Não foi possível carregar os agendamentos.");
    const resultadoAgendamentos = await respostaAgendamentos.json();
    const agendamentosDia = resultadoAgendamentos.agendamentos || [];

    const dataISO = formatarDataISO(data);
    const respostaRetornos = await fetch(`/retornos?data_inicio=${encodeURIComponent(dataISO)}&data_fim=${encodeURIComponent(dataISO)}`);
    if (!respostaRetornos.ok) throw new Error("Não foi possível carregar os retornos.");
    const resultadoRetornos = await respostaRetornos.json();
    const retornosDia = resultadoRetornos.retornos || [];

    const dentistaSelecionado = filtroDentista.value;
    const agendamentosFiltrados = dentistaSelecionado ? agendamentosDia.filter(a => String(a.dentista_id) === String(dentistaSelecionado)) : agendamentosDia;
    const retornosFiltrados = dentistaSelecionado ? retornosDia.filter(r => String(r.dentista_id || "") === String(dentistaSelecionado)) : retornosDia;

    const inicioFuncionamento = 8 * 60;
    const fimFuncionamento = 18 * 60;

    for (let minutos = inicioFuncionamento; minutos < fimFuncionamento; minutos += 30) {
        const hora = Math.floor(minutos / 60);
        const minuto = minutos % 60;
        const horarioTexto = `${String(hora).padStart(2,"0")}:${String(minuto).padStart(2,"0")}`;
        const horarioData = new Date(data.getFullYear(), data.getMonth(), data.getDate(), hora, minuto);

        const agendamento = encontrarAgendamento(horarioData, agendamentosFiltrados);
        const retorno = agendamento ? null : encontrarRetorno(horarioData, retornosFiltrados);

        const elemento = document.createElement("div");
        elemento.className = "horario";
        const horaElemento = document.createElement("div");
        horaElemento.className = "hora";
        horaElemento.textContent = horarioTexto;
        elemento.appendChild(horaElemento);

        if (agendamento) {
            elemento.classList.add("horario-ocupado");
            const info = document.createElement("div");
            info.className = "agendamento-info";
            const nomePaciente = agendamento.pacientes?.nome || "Paciente";
            const nomeDentista = agendamento.dentistas?.nome || "Dentista";
            const nomeProcedimento = agendamento.procedimentos?.nome || "Procedimento";
            const duracao = agendamento.procedimentos?.duracao_minutos || 30;
            const status = agendamento.status || "agendado";
            const statusTexto = {agendado:"🟡 Agendado", confirmado:"🔵 Confirmado", atendido:"🟢 Atendido", cancelado:"🔴 Cancelado", faltou:"⚫ Faltou"}[status] || "🟡 Agendado";
            info.innerHTML = `<strong>${escaparHTML(nomePaciente)}</strong><small>${escaparHTML(nomeProcedimento)} • ${escaparHTML(nomeDentista)} • ${duracao} min</small><small>${statusTexto}</small>`;
            elemento.appendChild(info);

            const controleStatus = document.createElement("div");
            controleStatus.style.display="flex"; controleStatus.style.alignItems="center"; controleStatus.style.gap="8px"; controleStatus.style.marginTop="8px";
            const selectStatus = document.createElement("select");
            selectStatus.style.padding="6px"; selectStatus.style.borderRadius="6px"; selectStatus.style.border="1px solid #d1d5db";
            [["agendado","🟡 Agendado"],["confirmado","🔵 Confirmado"],["atendido","🟢 Atendido"],["faltou","⚫ Faltou"],["cancelado","🔴 Cancelado"]].forEach(([valor,texto])=>{const o=document.createElement("option");o.value=valor;o.textContent=texto;o.selected=valor===status;selectStatus.appendChild(o);});
            const salvar=document.createElement("button"); salvar.type="button"; salvar.textContent="Salvar"; salvar.style.padding="6px 10px"; salvar.style.fontSize="12px"; salvar.style.background="#2563eb"; salvar.style.color="white"; salvar.style.border="none"; salvar.style.borderRadius="6px"; salvar.style.cursor="pointer";
            salvar.addEventListener("click",()=>alterarStatusAgendamento(agendamento.id,selectStatus.value));
            controleStatus.append(selectStatus,salvar); info.appendChild(controleStatus);
            const acoesWhatsApp = document.createElement("div");
            acoesWhatsApp.style.display = "flex";
            acoesWhatsApp.style.flexDirection = "column";
            acoesWhatsApp.style.gap = "6px";

            acoesWhatsApp.appendChild(criarBotaoWhatsApp(agendamento));

            const cancelar=document.createElement("button");
            cancelar.className="btn-excluir";
            cancelar.textContent="Cancelar";
            cancelar.addEventListener("click",()=>cancelarAgendamento(agendamento.id));

            acoesWhatsApp.appendChild(cancelar);
            elemento.appendChild(acoesWhatsApp);
        } else if (retorno) {
            elemento.classList.add("horario-ocupado");
            const info = document.createElement("div"); info.className="agendamento-info";
            const nomePaciente = retorno.pacientes?.nome || "Paciente";
            const nomeDentista = retorno.dentistas?.nome || "Dentista não informado";
            const motivo = retorno.motivo || "Retorno";
            const status = retorno.status || "pendente";
            const statusTexto = {pendente:"🟡 Retorno pendente", realizado:"🟢 Retorno realizado", cancelado:"🔴 Retorno cancelado"}[status] || "🟡 Retorno pendente";
            info.innerHTML = `<strong>↩️ ${escaparHTML(nomePaciente)}</strong><small>${escaparHTML(motivo)} • ${escaparHTML(nomeDentista)}</small><small>${statusTexto}</small>`;
            elemento.appendChild(info);
        } else {
            elemento.classList.add("horario-livre");
            const info=document.createElement("div"); info.className="agendamento-info"; info.innerHTML=`<strong>Horário disponível</strong><small>Clique em Agendar para escolher o procedimento.</small>`; elemento.appendChild(info);
            const botao=document.createElement("button"); botao.className="btn-agendar-hora"; botao.textContent="Agendar"; botao.addEventListener("click",()=>abrirModal(horarioData)); elemento.appendChild(botao);
        }
        horarios.appendChild(elemento);
    }
}

// =====================================================
// ENCONTRAR AGENDAMENTO
// =====================================================


function encontrarAgendamento(
    horario,
    lista
) {

    return lista.find(
        agendamento => {

            // Agendamentos cancelados não ocupam horário
            if (
                agendamento.status === "cancelado"
            ) {
                return false;
            }


            const inicio =
                new Date(
                    agendamento.data_hora
                );


            const duracao =
                agendamento.procedimentos
                    ?.duracao_minutos || 30;


            const fim =
                new Date(
                    inicio.getTime() +
                    duracao * 60 * 1000
                );


            const horarioAtual =
                horario.getTime();


            const inicioTimestamp =
                inicio.getTime();


            const fimTimestamp =
                fim.getTime();


            return (
                horarioAtual >=
                    inicioTimestamp
                &&
                horarioAtual <
                    fimTimestamp
            );

        }
    );

}
// =====================================================
// VERIFICAR DIA OCUPADO
// =====================================================

function existeAgendamentoNoDia(data) {
    const possuiAgendamento = agendamentos.some(agendamento => {
        if (agendamento.status === "cancelado") return false;
        return mesmoDia(data, new Date(agendamento.data_hora));
    });
    if (possuiAgendamento) return true;
    const dataISO = formatarDataISO(data);
    return retornos.some(retorno => retorno.status !== "cancelado" && String(retorno.data_retorno) === dataISO);
}


// =====================================================
// ABRIR MODAL
// =====================================================


function abrirModal(horario) {

    modal.classList.add("aberto");

    dataHoraInput.value =
        formatarDateTimeLocal(horario);

filtroDentista.addEventListener(
    "change",
    async function () {

        if (dataSelecionadaAtual) {

            await mostrarHorarios(
                dataSelecionadaAtual
            );

        }

    }
);

}
// =====================================================
// FECHAR MODAL
// =====================================================

function fecharModalAgenda() {

    modal.classList.remove(
        "aberto"
    );


    formAgendamento.reset();

    resumoProcedimento.style.display =
        "none";

}


// =====================================================
// PROCEDIMENTO SELECIONADO
// =====================================================

procedimentoSelect.addEventListener(
    "change",
    function () {

        const procedimento =
            procedimentos.find(
                item =>
                    item.id ===
                    procedimentoSelect.value
            );


        if (!procedimento) {

            resumoProcedimento.style.display =
                "none";

            return;

        }


        resumoProcedimento.style.display =
            "block";


        resumoProcedimento.innerHTML = `
            <strong>
                ${escaparHTML(procedimento.nome)}
            </strong>

            <br>

            💰
            ${formatarMoeda(procedimento.valor)}

            <br>

            ⏱️
            ${procedimento.duracao_minutos}
            minutos
        `;

    }
);


// =====================================================
// SALVAR AGENDAMENTO
// =====================================================

formAgendamento.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();


        const dados = {

            paciente_id:
                pacienteSelect.value,

            dentista_id:
                dentistaSelect.value,

            procedimento_id:
                procedimentoSelect.value,

            data_hora:
                dataHoraInput.value,

            observacoes:
                observacoesInput.value.trim()

        };

// =========================================
// VERIFICAR DURAÇÃO DO PROCEDIMENTO
// =========================================

const procedimentoSelecionado =
    procedimentos.find(
        procedimento =>
            procedimento.id ===
            procedimentoSelect.value
    );


if (!procedimentoSelecionado) {

    mostrarMensagem(
        "Selecione um procedimento.",
        true
    );

    return;
}


const inicio =
    new Date(
        dataHoraInput.value
    );


const fim =
    new Date(
        inicio.getTime() +
        procedimentoSelecionado.duracao_minutos *
        60 *
        1000
    );


const horaFechamento =
    new Date(inicio);

horaFechamento.setHours(
    18,
    0,
    0,
    0
);


if (fim > horaFechamento) {

    mostrarMensagem(
        `Este procedimento dura ${procedimentoSelecionado.duracao_minutos} minutos e ultrapassa o horário de funcionamento da clínica.`,
        true
    );

    return;
}
        try {

            const resposta =
                await fetch(
                    "/agendamentos",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(dados)

                    }
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    resultado.erro ||
                    "Erro ao criar agendamento."
                );

            }


            mostrarMensagem(
                "Agendamento criado com sucesso!"
            );

            // Oferece a confirmação pelo WhatsApp usando os mesmos
            // dados escolhidos no formulário.
            const agendamentoCriado = {
                ...(resultado.agendamento || resultado),
                paciente_id: dados.paciente_id,
                dentista_id: dados.dentista_id,
                procedimento_id: dados.procedimento_id,
                data_hora: dados.data_hora,
                pacientes: pacientes.find(p => String(p.id) === String(dados.paciente_id)),
                dentistas: dentistas.find(d => String(d.id) === String(dados.dentista_id))
            };

            const telefonePaciente = obterTelefonePaciente(agendamentoCriado.pacientes);

            if (telefonePaciente) {
                const enviarWhatsApp = confirm(
                    "Agendamento criado com sucesso! Deseja enviar agora a confirmação pelo WhatsApp?"
                );

                if (enviarWhatsApp) {
                    abrirWhatsAppAgendamento(agendamentoCriado);
                }
            } else {
                mostrarMensagem(
                    "Agendamento criado. O paciente não possui telefone/WhatsApp cadastrado.",
                    true
                );
            }


            fecharModalAgenda();


            await gerarCalendario();


            if (dataSelecionadaAtual) {

                await mostrarHorarios(
                    dataSelecionadaAtual
                );

            }


        } catch (erro) {

            console.error(
                erro
            );


            mostrarMensagem(
                erro.message,
                true
            );

        }

    }
);


// =====================================================
// CANCELAR AGENDAMENTO
// =====================================================

async function cancelarAgendamento(
    id
) {

    const confirmar =
        confirm(
            "Deseja cancelar este agendamento?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `/agendamentos/${id}`,
                {
                    method: "DELETE"
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Erro ao cancelar agendamento."
            );

        }


        mostrarMensagem(
            "Agendamento cancelado."
        );


        await gerarCalendario();


        if (dataSelecionadaAtual) {

            await mostrarHorarios(
                dataSelecionadaAtual
            );

        }


    } catch (erro) {

        console.error(
            erro
        );


        mostrarMensagem(
            erro.message,
            true
        );

    }

}


// =====================================================
// NAVEGAÇÃO DO MÊS
// =====================================================

mesAnterior.addEventListener(
    "click",
    async function () {

        dataAtual.setMonth(
            dataAtual.getMonth() - 1
        );


        await gerarCalendario();

    }
);


proximoMes.addEventListener(
    "click",
    async function () {

        dataAtual.setMonth(
            dataAtual.getMonth() + 1
        );


        await gerarCalendario();

    }
);


// =====================================================
// FECHAR MODAL
// =====================================================

fecharModal.addEventListener(
    "click",
    fecharModalAgenda
);


cancelarModal.addEventListener(
    "click",
    fecharModalAgenda
);


modal.addEventListener(
    "click",
    function (evento) {

        if (
            evento.target === modal
        ) {

            fecharModalAgenda();

        }

    }
);


// =====================================================
// FORMATAÇÕES
// =====================================================

function formatarMoeda(
    valor
) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

}


function formatarData(
    data
) {

    return data.toLocaleDateString(
        "pt-BR",
        {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


function formatarISO(
    data
) {

    return data.toISOString();

}


function formatarDataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2,"0");
    const dia = String(data.getDate()).padStart(2,"0");
    return `${ano}-${mes}-${dia}`;
}

function encontrarRetorno(horario, lista) {
    return lista.find(retorno => {
        if (retorno.status === "cancelado" || !retorno.data_retorno || !retorno.horario) return false;
        const [ano, mes, dia] = String(retorno.data_retorno).split("-").map(Number);
        const [hora, minuto] = String(retorno.horario).slice(0,5).split(":").map(Number);
        const dataHoraRetorno = new Date(ano, mes - 1, dia, hora || 0, minuto || 0);
        return horario.getTime() === dataHoraRetorno.getTime();
    });
}


function formatarDateTimeLocal(
    data
) {

    const ano =
        data.getFullYear();

    const mes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            data.getDate()
        ).padStart(2, "0");

    const hora =
        String(
            data.getHours()
        ).padStart(2, "0");

    const minuto =
        String(
            data.getMinutes()
        ).padStart(2, "0");


    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;

}


function mesmoDia(
    a,
    b
) {

    return (
        a.getFullYear() ===
            b.getFullYear()
        &&
        a.getMonth() ===
            b.getMonth()
        &&
        a.getDate() ===
            b.getDate()
    );

}


function escaparHTML(
    texto
) {

    if (!texto) {
        return "";
    }


    return String(texto)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


function mostrarMensagem(
    texto,
    erro = false
) {

    mensagem.textContent =
        texto;


    mensagem.className =
        erro
            ? "mensagem erro"
            : "mensagem";


    mensagem.style.display =
        "block";


    setTimeout(
        () => {

            mensagem.style.display =
                "none";

        },
        3000
    );

}
// =====================================================
// WHATSAPP — CONFIRMAÇÃO DE AGENDAMENTO
// =====================================================

function obterTelefonePaciente(paciente) {
    if (!paciente) return "";

    return (
        paciente.telefone ||
        paciente.celular ||
        paciente.whatsapp ||
        paciente.telefone_celular ||
        ""
    );
}

function normalizarTelefoneWhatsApp(telefone) {
    let numero = String(telefone || "").replace(/\D/g, "");

    if (!numero) return "";

    // Para números brasileiros sem DDI, acrescenta 55.
    if (numero.length === 10 || numero.length === 11) {
        numero = "55" + numero;
    }

    return numero;
}

function formatarDataWhatsApp(dataHora) {
    const data = new Date(dataHora);

    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function formatarHoraWhatsApp(dataHora) {
    const data = new Date(dataHora);

    return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function obterNomeDentistaAgendamento(agendamento) {
    return (
        agendamento?.dentistas?.nome ||
        dentistas.find(d => String(d.id) === String(agendamento?.dentista_id))?.nome ||
        "Dentista"
    );
}

function obterPacienteAgendamento(agendamento) {
    return (
        agendamento?.pacientes ||
        pacientes.find(p => String(p.id) === String(agendamento?.paciente_id)) ||
        null
    );
}

function abrirWhatsAppAgendamento(agendamento) {
    const paciente = obterPacienteAgendamento(agendamento);
    const telefone = normalizarTelefoneWhatsApp(obterTelefonePaciente(paciente));

    if (!telefone) {
        mostrarMensagem(
            "O paciente não possui telefone/WhatsApp cadastrado.",
            true
        );
        return;
    }

    const nomePaciente = paciente?.nome || "Paciente";
    const nomeDentista = obterNomeDentistaAgendamento(agendamento);
    const data = formatarDataWhatsApp(agendamento.data_hora);
    const horario = formatarHoraWhatsApp(agendamento.data_hora);

    /*
     * Mensagem somente com caracteres comuns (sem emojis).
     * Isso evita o caractere de substituição "�" em ambientes
     * que estejam convertendo Unicode/UTF-8 incorretamente.
     */
    const mensagemWhatsApp =
`Olá, ${nomePaciente}!

Seu agendamento na Clínica Odontológica foi confirmado.

Data: ${data}
Horário: ${horario}
Dentista: ${nomeDentista}

Aguardamos você!`;

    const url =
        `https://wa.me/${telefone}?text=${encodeURIComponent(mensagemWhatsApp)}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

function criarBotaoWhatsApp(agendamento) {
    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "btn-whatsapp";
    botao.textContent = "📱 WhatsApp";
    botao.title = "Enviar confirmação do agendamento pelo WhatsApp";

    botao.addEventListener("click", () => {
        abrirWhatsAppAgendamento(agendamento);
    });

    return botao;
}


// =====================================================
// ALTERAR STATUS DO AGENDAMENTO
// =====================================================

async function alterarStatusAgendamento(
    id,
    novoStatus
) {

    try {

        const resposta = await fetch(
            `/agendamentos/${id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    status: novoStatus
                })
            }
        );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Não foi possível alterar o status."
            );

        }


        mostrarMensagem(
            "Status atualizado com sucesso!"
        );


        // Atualizar calendário
        await gerarCalendario();


        // Atualizar horários do dia
        if (dataSelecionadaAtual) {

            await mostrarHorarios(
                dataSelecionadaAtual
            );

        }


    } catch (erro) {

        console.error(
            "Erro ao alterar status:",
            erro
        );


        mostrarMensagem(
            erro.message,
            true
        );

    }

}

// =====================================================
// INICIAR SISTEMA
// =====================================================

iniciar();