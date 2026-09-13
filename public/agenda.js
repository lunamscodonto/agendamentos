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

const duracaoInput =
    document.getElementById("duracao_minutos");

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
            procedimento.nome;

        procedimentoSelect.appendChild(option);

    });

}


// =====================================================
// CARREGAR AGENDAMENTOS DO MÊS
// =====================================================

async function carregarAgendamentosMes() {

    const primeiroDia =
        new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth(),
            1
        );


    const ultimoDia =
        new Date(
            dataAtual.getFullYear(),
            dataAtual.getMonth() + 1,
            1
        );


    const inicio =
        formatarISO(primeiroDia);


    const fim =
        formatarISO(ultimoDia);


    const resposta =
        await fetch(
            `/agendamentos?data_inicio=${encodeURIComponent(inicio)}&data_fim=${encodeURIComponent(fim)}`
        );


    const resultado =
        await resposta.json();


    agendamentos =
        resultado.agendamentos || [];

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

    dataSelecionada.textContent =
        formatarData(data);

    horarios.innerHTML = "";


    const inicio =
        new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );


    const fim =
        new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate() + 1
        );


    // Os agendamentos do mês já foram carregados por gerarCalendario().
    // Filtramos o dia diretamente no navegador para evitar problemas de
    // fuso horário nos limites data_inicio/data_fim da consulta ao banco.
    const agendamentosDia =
        agendamentos.filter(agendamento => {
            if (agendamento.status === "cancelado") {
                return false;
            }

            const dataAgendamento =
                new Date(agendamento.data_hora);

            return mesmoDia(data, dataAgendamento);
        });

const dentistaSelecionado =
    filtroDentista.value;


const agendamentosFiltrados =
    dentistaSelecionado
        ? agendamentosDia.filter(
            agendamento =>
                agendamento.dentista_id ===
                dentistaSelecionado
          )
        : agendamentosDia;


    // ---------------------------------------------
    // HORÁRIO DE FUNCIONAMENTO
    // ---------------------------------------------

    const inicioFuncionamento =
        8 * 60;

    const fimFuncionamento =
        18 * 60;


    // ---------------------------------------------
    // GERAR HORÁRIOS DE 30 EM 30 MINUTOS
    // ---------------------------------------------

    for (
        let minutos = inicioFuncionamento;
        minutos < fimFuncionamento;
        minutos += 30
    ) {

        const hora =
            Math.floor(
                minutos / 60
            );

        const minuto =
            minutos % 60;


        const horarioTexto =
            `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;


        const horarioData =
            new Date(
                data.getFullYear(),
                data.getMonth(),
                data.getDate(),
                hora,
                minuto
            );


        // -----------------------------------------
        // VERIFICAR SE EXISTE AGENDAMENTO
        // -----------------------------------------

        const agendamento =
    encontrarAgendamento(
        horarioData,
        agendamentosFiltrados
    );


        const elemento =
            document.createElement("div");


        elemento.className =
            "horario";


        const horaElemento =
            document.createElement("div");

        horaElemento.className =
            "hora";

        horaElemento.textContent =
            horarioTexto;


        elemento.appendChild(
            horaElemento
        );


        // -----------------------------------------
        // HORÁRIO OCUPADO
        // -----------------------------------------

        if (agendamento) {

            elemento.classList.add(
                "horario-ocupado"
            );


            const info =
                document.createElement("div");

            info.className =
                "agendamento-info";


            const nomePaciente =
                agendamento.pacientes?.nome
                || "Paciente";


            const nomeDentista =
                agendamento.dentistas?.nome
                || "Dentista";


            const nomeProcedimento =
                agendamento.procedimentos?.nome
                || "Procedimento";


            const duracao =
                Number(agendamento.duracao_minutos) ||
                30;
const status =
    agendamento.status || "agendado";


const statusTexto = {

    agendado: "🟡 Agendado",

    confirmado: "🔵 Confirmado",

    atendido: "🟢 Atendido",

    cancelado: "🔴 Cancelado",

    faltou: "⚫ Faltou"

}[status] || "🟡 Agendado";



            info.innerHTML = `
    <strong>
        ${escaparHTML(nomePaciente)}
    </strong>

    <small>
        ${escaparHTML(nomeProcedimento)}
        •
        ${escaparHTML(nomeDentista)}
        •
        ${duracao} min
    </small>

    <small>
        ${statusTexto}
    </small>
`;
const controleStatus =
    document.createElement("div");

controleStatus.style.display =
    "flex";

controleStatus.style.alignItems =
    "center";

controleStatus.style.gap =
    "8px";

controleStatus.style.marginTop =
    "8px";


const selectStatus =
    document.createElement("select");


selectStatus.style.padding =
    "6px";

selectStatus.style.borderRadius =
    "6px";

selectStatus.style.border =
    "1px solid #d1d5db";


const statusOpcoes = [

    {
        valor: "agendado",
        texto: "🟡 Agendado"
    },

    {
        valor: "confirmado",
        texto: "🔵 Confirmado"
    },

    {
        valor: "atendido",
        texto: "🟢 Atendido"
    },

    {
        valor: "faltou",
        texto: "⚫ Faltou"
    },

    {
        valor: "cancelado",
        texto: "🔴 Cancelado"
    }

];


statusOpcoes.forEach(opcao => {

    const option =
        document.createElement("option");

    option.value =
        opcao.valor;

    option.textContent =
        opcao.texto;


    if (
        opcao.valor === status
    ) {

        option.selected = true;

    }


    selectStatus.appendChild(
        option
    );

});


const botaoSalvarStatus =
    document.createElement("button");


botaoSalvarStatus.type =
    "button";

botaoSalvarStatus.textContent =
    "Salvar";


botaoSalvarStatus.style.padding =
    "6px 10px";


botaoSalvarStatus.style.fontSize =
    "12px";


botaoSalvarStatus.style.background =
    "#2563eb";


botaoSalvarStatus.style.color =
    "white";


botaoSalvarStatus.style.border =
    "none";


botaoSalvarStatus.style.borderRadius =
    "6px";


botaoSalvarStatus.style.cursor =
    "pointer";


botaoSalvarStatus.addEventListener(
    "click",
    async () => {

        await alterarStatusAgendamento(
            agendamento.id,
            selectStatus.value
        );

    }
);


controleStatus.appendChild(
    selectStatus
);


controleStatus.appendChild(
    botaoSalvarStatus
);


info.appendChild(
    controleStatus
);


            elemento.appendChild(
                info
            );


            const cancelar =
                document.createElement("button");


            cancelar.className =
                "btn-excluir";


            cancelar.textContent =
                "Cancelar";


            cancelar.addEventListener(
                "click",
                () =>
                    cancelarAgendamento(
                        agendamento.id
                    )
            );


            elemento.appendChild(
                cancelar
            );


            const whatsapp =
                document.createElement("button");

            whatsapp.type =
                "button";

            whatsapp.className =
                "btn-whatsapp-agendamento";

            whatsapp.textContent =
                "📱 WhatsApp";

            whatsapp.style.display = "block";
            whatsapp.style.width = "100%";
            whatsapp.style.marginTop = "8px";
            whatsapp.style.padding = "7px 10px";
            whatsapp.style.background = "#25D366";
            whatsapp.style.color = "white";
            whatsapp.style.border = "none";
            whatsapp.style.borderRadius = "6px";
            whatsapp.style.cursor = "pointer";
            whatsapp.style.fontSize = "12px";

            whatsapp.addEventListener(
                "click",
                () => enviarWhatsAppAgendamento(agendamento)
            );

            elemento.appendChild(
                whatsapp
            );

        }

        // -----------------------------------------
        // HORÁRIO LIVRE
        // -----------------------------------------

        else {

            elemento.classList.add(
                "horario-livre"
            );


            const info =
                document.createElement("div");

            info.className =
                "agendamento-info";


            info.innerHTML = `
                <strong>
                    Horário disponível
                </strong>

                <small>
                    Clique em Agendar para escolher
                    o procedimento.
                </small>
            `;


            elemento.appendChild(
                info
            );


            const botao =
                document.createElement("button");


            botao.className =
                "btn-agendar-hora";


            botao.textContent =
                "Agendar";


            botao.addEventListener(
                "click",
                () =>
                    abrirModal(
                        horarioData
                    )
            );


            elemento.appendChild(
                botao
            );

        }


        horarios.appendChild(
            elemento
        );

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
                Number(agendamento.duracao_minutos) ||
                30;


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

function existeAgendamentoNoDia(
    data
) {

    const dentistaSelecionado =
        filtroDentista.value;

    return agendamentos.some(
        agendamento => {

            // Registros cancelados não ocupam o calendário.
            const status =
                String(agendamento.status || "agendado")
                    .trim()
                    .toLowerCase();

            if (status === "cancelado") {
                return false;
            }

            // Só considera um agendamento válido quando ele possui
            // os vínculos básicos e uma data/hora válida. Isso evita
            // que registros incompletos/orfãos deixem uma bolinha
            // no calendário sem que exista um atendimento consultável.
            if (
                !agendamento.id ||
                !agendamento.paciente_id ||
                !agendamento.dentista_id ||
                !agendamento.procedimento_id ||
                !agendamento.data_hora
            ) {
                return false;
            }

            if (
                dentistaSelecionado &&
                String(agendamento.dentista_id) !==
                    String(dentistaSelecionado)
            ) {
                return false;
            }

            const dataAgendamento =
                new Date(agendamento.data_hora);

            if (Number.isNaN(dataAgendamento.getTime())) {
                return false;
            }

            return mesmoDia(
                data,
                dataAgendamento
            );

        }
    );

}


// =====================================================
// ABRIR MODAL
// =====================================================

function abrirModal(horario) {

    const agora = new Date();

    if (horario instanceof Date && horario.getTime() < agora.getTime()) {
        mostrarMensagem(
            "Não é possível realizar agendamento em data ou horário anterior ao momento atual.",
            true
        );

        return;
    }

    atualizarDataHoraMinima();

    modal.classList.add("aberto");

    dataHoraInput.value =
        formatarDateTimeLocal(horario);

    atualizarDataHoraMinima();

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
        `;

    }
);


// =====================================================
// IMPEDIR AGENDAMENTOS NO PASSADO
// =====================================================

function obterDataHoraMinima() {

    const agora = new Date();

    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");
    const hora = String(agora.getHours()).padStart(2, "0");
    const minuto = String(agora.getMinutes()).padStart(2, "0");

    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
}

function atualizarDataHoraMinima() {

    if (!dataHoraInput) {
        return;
    }

    dataHoraInput.min = obterDataHoraMinima();
}

atualizarDataHoraMinima();

setInterval(atualizarDataHoraMinima, 30000);

// =====================================================
// SALVAR AGENDAMENTO
// =====================================================

formAgendamento.addEventListener(
    "submit",
    async function (evento) {

        evento.preventDefault();

        // Não permite agendamento no passado, inclusive horário anterior
        // ao momento atual quando a data escolhida for hoje.
        const dataHoraSelecionada = new Date(dataHoraInput.value);

        if (
            !dataHoraInput.value ||
            isNaN(dataHoraSelecionada.getTime()) ||
            dataHoraSelecionada.getTime() < Date.now()
        ) {
            atualizarDataHoraMinima();

            mostrarMensagem(
                "Não é possível agendar uma data ou horário anterior ao momento atual.",
                true
            );

            return;
        }


        const pacienteSelecionado = pacientes.find(
            paciente =>
                String(paciente.id) ===
                String(pacienteSelect.value)
        );

        const dentistaSelecionado = dentistas.find(
            dentista =>
                String(dentista.id) ===
                String(dentistaSelect.value)
        );

        const dados = {

            paciente_id:
                pacienteSelect.value,

            dentista_id:
                dentistaSelect.value,

            procedimento_id:
                procedimentoSelect.value,

            data_hora:
                dataHoraInput.value,

            ...(duracaoInput?.value
                ? { duracao_minutos: Number(duracaoInput.value) }
                : {}),

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


const duracaoSelecionada =
    Number(duracaoInput?.value) ||
    Number(procedimentoSelecionado.duracao_minutos) ||
    30;


const fim =
    new Date(
        inicio.getTime() +
        duracaoSelecionada *
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
        `Este atendimento dura ${duracaoSelecionada} minutos e ultrapassa o horário de funcionamento da clínica.`,
        true
    );

    return;
}
        // Abre uma janela do WhatsApp a partir do clique do usuário.
        // Ela só recebe a mensagem depois que o agendamento for salvo.
        let janelaWhatsApp = null;

        if (pacienteSelecionado?.telefone) {
            janelaWhatsApp = window.open("about:blank", "_blank");
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


            // =====================================================
            // WHATSAPP — CONFIRMAÇÃO DO AGENDAMENTO
            // =====================================================
            if (janelaWhatsApp && pacienteSelecionado?.telefone) {
                const telefone = String(pacienteSelecionado.telefone)
                    .replace(/\D/g, "");

                const numeroWhatsApp = telefone.startsWith("55")
                    ? telefone
                    : `55${telefone}`;

                const dataAgendamento = new Date(dataHoraInput.value);
                const dataFormatada = dataAgendamento.toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "2-digit", year: "numeric" }
                );
                const horarioFormatado = dataAgendamento.toLocaleTimeString(
                    "pt-BR",
                    { hour: "2-digit", minute: "2-digit" }
                );

                const mensagemWhatsApp =
                    `Olá, ${pacienteSelecionado.nome}!\n\n` +
                    `Seu agendamento na Clínica Odontológica foi confirmado.\n\n` +
                    `Data: ${dataFormatada}\n` +
                    `Horário: ${horarioFormatado}\n` +
                    `Dentista: ${dentistaSelecionado?.nome || "Não informado"}\n\n` +
                    `Aguardamos você!`;

                const urlWhatsApp =
                    `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagemWhatsApp)}`;

                janelaWhatsApp.location.href = urlWhatsApp;
            } else if (janelaWhatsApp) {
                janelaWhatsApp.close();
            }

            mostrarMensagem(
                pacienteSelecionado?.telefone
                    ? "Agendamento criado! Abrindo WhatsApp..."
                    : "Agendamento criado com sucesso! O paciente não possui telefone cadastrado."
            );


            fecharModalAgenda();


            await gerarCalendario();


            if (dataSelecionadaAtual) {

                await mostrarHorarios(
                    dataSelecionadaAtual
                );

            }


        } catch (erro) {

            if (janelaWhatsApp && !janelaWhatsApp.closed) {
                janelaWhatsApp.close();
            }

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
// REENVIAR CONFIRMAÇÃO PELO WHATSAPP
// =====================================================

function enviarWhatsAppAgendamento(agendamento) {

    const paciente = agendamento.pacientes;
    const dentista = agendamento.dentistas;

    if (!paciente?.telefone) {
        mostrarMensagem(
            "O paciente não possui telefone cadastrado.",
            true
        );
        return;
    }

    const telefone = String(paciente.telefone)
        .replace(/\D/g, "");

    if (!telefone) {
        mostrarMensagem(
            "O telefone do paciente é inválido.",
            true
        );
        return;
    }

    const numeroWhatsApp =
        telefone.startsWith("55")
            ? telefone
            : `55${telefone}`;

    const dataAgendamento =
        new Date(agendamento.data_hora);

    const dataFormatada =
        dataAgendamento.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    const horarioFormatado =
        dataAgendamento.toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    const mensagemWhatsApp =
        `Olá, ${paciente.nome}!\n\n` +
        `Seu agendamento na Clínica Odontológica foi confirmado.\n\n` +
        `Data: ${dataFormatada}\n` +
        `Horário: ${horarioFormatado}\n` +
        `Dentista: ${dentista?.nome || "Não informado"}\n\n` +
        `Aguardamos você!`;

    const urlWhatsApp =
        `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagemWhatsApp)}`;

    window.open(
        urlWhatsApp,
        "_blank"
    );
}


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