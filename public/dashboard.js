const totalPacientes =
    document.getElementById("totalPacientes");

const totalHoje =
    document.getElementById("totalHoje");

const totalAtendidos =
    document.getElementById("totalAtendidos");

const atendimentosHoje =
    document.getElementById("atendimentosHoje");

const dataAtual =
    document.getElementById("dataAtual");

const btnAtualizar =
    document.getElementById("btnAtualizar");

const btnProximos =
    document.getElementById("btnProximos");

const cardProximos =
    document.getElementById("cardProximos");

const dataProximo =
    document.getElementById("dataProximo");

const proximosAtendimentos =
    document.getElementById("proximosAtendimentos");


function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


function inicioDoDia(data = new Date()) {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
}


function inicioDoProximoDia(data = new Date()) {
    const d = inicioDoDia(data);
    d.setDate(d.getDate() + 1);
    return d;
}


function inicioDoMes(data = new Date()) {
    const d = new Date(data);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}


function inicioDoProximoMes(data = new Date()) {
    const d = inicioDoMes(data);
    d.setMonth(d.getMonth() + 1);
    return d;
}


function formatarDataISO(data) {
    return data.toISOString();
}


function formatarDataBR(data) {
    return new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function obterTelefoneWhatsApp(telefone) {
    if (!telefone) return null;

    let numero = String(telefone).replace(/\D/g, "");

    if (!numero) return null;

    if (!numero.startsWith("55")) {
        numero = "55" + numero;
    }

    return numero;
}


function criarLinkWhatsApp(item) {
    const telefone = obterTelefoneWhatsApp(item.pacientes?.telefone);

    if (!telefone) return null;

    const data = new Date(item.data_hora);
    const nome = item.pacientes?.nome || "Paciente";
    const dataBR = formatarDataBR(data);
    const hora = data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
    });

    const mensagem =
        `Olá ${nome}!\n\n` +
        `Podemos confirmar seu atendimento de amanhã?\n\n` +
        `Data: ${dataBR}\n` +
        `Horário: ${hora}`;

    return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}


function textoStatus(status) {
    const nomes = {
        agendado: "Agendado",
        confirmado: "Confirmado",
        atendido: "Atendido",
        cancelado: "Cancelado",
        faltou: "Faltou"
    };

    return nomes[status] || status || "Agendado";
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


function atualizarDataTela() {

    const agora = new Date();

    dataAtual.textContent =
        agora.toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );
}


async function buscarPacientes() {

    const resposta =
        await fetch("/pacientes");

    const resultado =
        await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            resultado.erro ||
            "Não foi possível carregar os pacientes."
        );
    }

    return resultado.pacientes || [];
}


async function buscarAgendamentos(inicio, fim) {

    const url =
        `/agendamentos?data_inicio=${encodeURIComponent(
            formatarDataISO(inicio)
        )}&data_fim=${encodeURIComponent(
            formatarDataISO(fim)
        )}`;

    const resposta =
        await fetch(url);

    const resultado =
        await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            resultado.erro ||
            "Não foi possível carregar os agendamentos."
        );
    }

    return resultado.agendamentos || [];
}


async function carregarDashboard() {

    try {

        atualizarDataTela();

        atendimentosHoje.innerHTML =
            `<div class="estado">⏳ Carregando...</div>`;

        const agora = new Date();

        const inicioHoje =
            inicioDoDia(agora);

        const fimHoje =
            inicioDoProximoDia(agora);
        const [pacientes, hoje] =
            await Promise.all([
                buscarPacientes(),
                buscarAgendamentos(
                    inicioHoje,
                    fimHoje
                )
            ]);

        totalPacientes.textContent =
            pacientes.length;

        const hojeValidos =
            hoje.filter(
                item =>
                    item.status !==
                    "cancelado"
            );

        const atendidosHoje =
            hoje.filter(
                item =>
                    item.status ===
                    "atendido"
            );

        totalHoje.textContent =
            hojeValidos.length;

        totalAtendidos.textContent =
            atendidosHoje.length;

        renderizarAtendimentosHoje(hoje);

    } catch (erro) {

        console.error(
            "Erro no dashboard:",
            erro
        );

        if (atendimentosHoje) {
            atendimentosHoje.innerHTML = `
                <div class="estado erro">
                    ⚠️ ${escaparHTML(erro.message)}
                </div>
            `;
        }
    }
}


async function carregarProximosAtendimentos() {
    if (!proximosAtendimentos || !cardProximos) return;

    cardProximos.hidden = false;
    proximosAtendimentos.innerHTML = `<div class="estado">⏳ Carregando...</div>`;

    const agora = new Date();
    const inicioAmanha = inicioDoProximoDia(agora);
    const fimAmanha = inicioDoProximoDia(inicioAmanha);

    dataProximo.textContent =
        `Agenda de amanhã — ${formatarDataBR(inicioAmanha)}`;

    try {
        const agendamentos = await buscarAgendamentos(
            inicioAmanha,
            fimAmanha
        );

        renderizarProximosAtendimentos(agendamentos);
    } catch (erro) {
        console.error("Erro ao carregar próximos atendimentos:", erro);
        proximosAtendimentos.innerHTML = `
            <div class="estado erro">
                ⚠️ ${escaparHTML(erro.message)}
            </div>
        `;
    }
}


function renderizarProximosAtendimentos(agendamentos) {
    const lista = [...agendamentos]
        .filter(item => item.status !== "cancelado")
        .sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));

    if (!lista.length) {
        proximosAtendimentos.innerHTML = `
            <div class="sem-atendimentos">
                📭 Nenhum atendimento agendado para amanhã.
            </div>
        `;
        return;
    }

    const grupos = new Map();

    lista.forEach(item => {
        const id = item.dentista_id || item.dentistas?.id || item.dentistas?.nome || "sem-dentista";
        const nome = item.dentistas?.nome || "Dentista não informado";

        if (!grupos.has(id)) {
            grupos.set(id, { nome, itens: [] });
        }

        grupos.get(id).itens.push(item);
    });

    proximosAtendimentos.innerHTML = [...grupos.values()].map(grupo => `
        <div class="dentista-grupo">
            <div class="dentista-titulo">
                <span>🦷 ${escaparHTML(grupo.nome)}</span>
                <span class="dentista-qtd">${grupo.itens.length} atendimento${grupo.itens.length === 1 ? "" : "s"}</span>
            </div>

            <div class="dentista-lista">
                ${grupo.itens.map(item => {
                    const data = new Date(item.data_hora);
                    const hora = data.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    });
                    const paciente = item.pacientes?.nome || "Paciente não informado";
                    const procedimento = item.procedimentos?.nome || "Procedimento não informado";
                    const linkWhatsApp = criarLinkWhatsApp(item);

                    return `
                        <div class="consulta">
                            <div class="hora">${hora}</div>

                            <div class="dados">
                                <strong>👤 ${escaparHTML(paciente)}</strong>
                                <span>🩺 ${escaparHTML(procedimento)}</span>
                                ${linkWhatsApp ? "" : "<span class=\"telefone-indisponivel\">⚠️ Telefone não cadastrado</span>"}
                            </div>

                            ${linkWhatsApp
                                ? `<button type="button" class="confirmar-whatsapp" data-whatsapp-url="${escaparHTML(linkWhatsApp)}">💬 Confirmar atendimento</button>`
                                : `<button type="button" class="confirmar-whatsapp" disabled>💬 Confirmar atendimento</button>`
                            }

                            <div class="status ${escaparHTML(item.status || "agendado")}">
                                ${escaparHTML(textoStatus(item.status))}
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        </div>
    `).join("");

    proximosAtendimentos.querySelectorAll("[data-whatsapp-url]").forEach(botao => {
        botao.addEventListener("click", () => {
            window.open(botao.dataset.whatsappUrl, "_blank", "noopener,noreferrer");
        });
    });
}


function renderizarAtendimentosHoje(agendamentos) {
    if (!atendimentosHoje) return;

    const lista = [...agendamentos].sort(
        (a, b) => new Date(a.data_hora) - new Date(b.data_hora)
    );

    if (!lista.length) {
        atendimentosHoje.innerHTML = `<div class="sem-atendimentos">📭 Nenhum atendimento registrado para hoje.</div>`;
        return;
    }

    const grupos = new Map();
    lista.forEach(item => {
        const id = item.dentista_id || item.dentistas?.id || item.dentistas?.nome || "sem-dentista";
        const nome = item.dentistas?.nome || "Dentista não informado";
        if (!grupos.has(id)) grupos.set(id, { nome, itens: [] });
        grupos.get(id).itens.push(item);
    });

    atendimentosHoje.innerHTML = [...grupos.values()].map(grupo => `
        <div class="dentista-grupo">
            <div class="dentista-titulo">
                <span>🦷 ${escaparHTML(grupo.nome)}</span>
                <span class="dentista-qtd">${grupo.itens.length} atendimento${grupo.itens.length === 1 ? "" : "s"}</span>
            </div>
            <div class="dentista-lista">
                ${grupo.itens.map(item => {
                    const hora = new Date(item.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    const paciente = item.pacientes?.nome || "Paciente não informado";
                    const procedimento = item.procedimentos?.nome || "Procedimento não informado";
                    return `<div class="consulta">
                        <div class="hora">${hora}</div>
                        <div class="dados">
                            <strong>👤 ${escaparHTML(paciente)}</strong>
                            <span>🩺 ${escaparHTML(procedimento)}</span>
                        </div>
                        <div class="status ${escaparHTML(item.status || "agendado")}">${escaparHTML(textoStatus(item.status))}</div>
                    </div>`;
                }).join("")}
            </div>
        </div>
    `).join("");
}

btnAtualizar.addEventListener(
    "click",
    carregarDashboard
);


btnProximos.addEventListener(
    "click",
    carregarProximosAtendimentos
);


carregarDashboard();
