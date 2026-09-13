const formDentista = document.getElementById("formDentista");
const btnLimpar = document.getElementById("btnLimpar");
const listaDentistas = document.getElementById("listaDentistas");
const contador = document.getElementById("contador");
const pesquisa = document.getElementById("pesquisa");
const mensagem = document.getElementById("mensagem");

let dentistas = [];

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function mostrarMensagem(texto, tipo = "sucesso") {
    if (!mensagem) return;
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = "block";

    clearTimeout(window._timerMensagemDentistas);
    window._timerMensagemDentistas = setTimeout(() => {
        mensagem.style.display = "none";
    }, 4000);
}

function validarDadosObrigatorios(dados) {
    if (!dados.nome) return "Informe o nome completo.";
    if (!dados.cro) return "Informe o CRO.";
    if (!dados.especialidade) return "Informe a especialidade.";
    if (!dados.telefone) return "Informe o telefone.";
    if (!dados.email) return "Informe o e-mail.";

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email);
    if (!emailValido) return "Informe um e-mail válido.";

    return "";
}

async function carregarDentistas() {
    try {
        const resposta = await fetch("/dentistas", {
            cache: "no-store"
        });
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível carregar os profissionais.");
        }

        dentistas = resultado.dentistas || [];
        renderizarDentistas([]);
    } catch (erro) {
        console.error("Erro ao carregar dentistas:", erro);
        mostrarMensagem(erro.message || "Não foi possível carregar os profissionais.", "erro");
    }
}

function renderizarDentistas(lista) {
    if (!listaDentistas) return;

    const termo = pesquisa?.value.trim() || "";

    // Não mostra todos os profissionais ao abrir a página.
    // O card só apresenta um resultado depois que o usuário pesquisar.
    if (!termo) {
        contador.textContent = "Digite um nome ou CPF para pesquisar";
        listaDentistas.innerHTML = `
            <div class="estado-vazio">
                <div class="icone">🔎</div>
                <h3>Pesquise um profissional</h3>
                <p>Digite no campo de pesquisa para consultar o profissional desejado.</p>
            </div>
        `;
        return;
    }

    contador.textContent = `${lista.length} ${lista.length === 1 ? "profissional encontrado" : "profissionais encontrados"}`;

    if (!lista.length) {
        listaDentistas.innerHTML = `
            <div class="estado-vazio">
                <div class="icone">🔎</div>
                <h3>Nenhum profissional encontrado</h3>
                <p>Verifique o nome ou CPF informado.</p>
            </div>
        `;
        return;
    }

    listaDentistas.innerHTML = lista.map(dentista => `
        <div class="dentista-item">
            <div class="dentista-info">
                <strong>🦷 ${escaparHTML(dentista.nome)}</strong>
                <div><b>CRO:</b> ${escaparHTML(dentista.cro)}</div>
                <div><b>Especialidade:</b> ${escaparHTML(dentista.especialidade)}</div>
                <div><b>Telefone:</b> ${escaparHTML(dentista.telefone)}</div>
                <div><b>E-mail:</b> ${escaparHTML(dentista.email)}</div>
                ${dentista.observacoes ? `<div><b>Observações:</b> ${escaparHTML(dentista.observacoes)}</div>` : ""}
            </div>
            <div class="dentista-acoes">
                <span class="badge-ativo">● Ativo</span>
                <button type="button" class="btn-editar-dentista" data-id="${escaparHTML(dentista.id)}">✏️ Editar</button>
            </div>
        </div>
    `).join("");

    listaDentistas.querySelectorAll(".btn-editar-dentista").forEach(botao => {
        botao.addEventListener("click", () => abrirEdicao(botao.dataset.id));
    });
}

function normalizarBusca(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function aplicarPesquisa() {
    const termo = normalizarBusca(pesquisa?.value);

    if (!termo) {
        renderizarDentistas([]);
        return;
    }

    const termoCompacto = termo.replace(/[^a-z0-9]/g, "");

    const filtrados = dentistas.filter(dentista => {
        // A pesquisa fica restrita SOMENTE a nome e CPF.
        const nome = normalizarBusca(dentista.nome);
        const cpf = normalizarBusca(dentista.cpf);

        if (nome.includes(termo)) return true;

        if (cpf) {
            const cpfCompacto = cpf.replace(/[^a-z0-9]/g, "");
            if (termoCompacto && cpfCompacto.includes(termoCompacto)) return true;
        }

        return false;
    });

    renderizarDentistas(filtrados);
}

formDentista?.addEventListener("submit", async evento => {
    evento.preventDefault();

    const dados = {
        nome: document.getElementById("nome")?.value.trim() || "",
        cro: document.getElementById("cro")?.value.trim() || "",
        especialidade: document.getElementById("especialidade")?.value.trim() || "",
        telefone: document.getElementById("telefone")?.value.trim() || "",
        email: document.getElementById("email")?.value.trim().toLowerCase() || "",
        observacoes: document.getElementById("observacoes")?.value.trim() || ""
    };

    const erroValidacao = validarDadosObrigatorios(dados);
    if (erroValidacao) {
        mostrarMensagem(erroValidacao, "erro");
        return;
    }

    const botao = formDentista.querySelector('button[type="submit"]');
    const textoOriginal = botao?.textContent;

    try {
        if (botao) {
            botao.disabled = true;
            botao.textContent = "⏳ Salvando...";
        }

        const resposta = await fetch("/dentistas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível cadastrar o profissional.");
        }

        formDentista.reset();
        mostrarMensagem("Profissional cadastrado com sucesso!", "sucesso");
        await carregarDentistas();
    } catch (erro) {
        console.error("Erro ao cadastrar profissional:", erro);
        mostrarMensagem(erro.message, "erro");
    } finally {
        if (botao) {
            botao.disabled = false;
            botao.textContent = textoOriginal;
        }
    }
});

btnLimpar?.addEventListener("click", () => {
    formDentista?.reset();
});

pesquisa?.addEventListener("input", aplicarPesquisa);

const modal = document.getElementById("modalEditarDentista");
const formEdicao = document.getElementById("formEditarDentista");

function abrirModal() {
    modal?.classList.add("aberto");
    modal?.setAttribute("aria-hidden", "false");
}

function fecharModal() {
    modal?.classList.remove("aberto");
    modal?.setAttribute("aria-hidden", "true");
}

async function abrirEdicao(id) {
    try {
        const resposta = await fetch(`/dentistas/${encodeURIComponent(id)}`, {
            cache: "no-store"
        });
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.dentista) {
            throw new Error(resultado.erro || "Profissional não encontrado.");
        }

        const dentista = resultado.dentista;

        document.getElementById("editarDentistaId").value = dentista.id || "";
        document.getElementById("editarNome").value = dentista.nome || "";
        document.getElementById("editarCro").value = dentista.cro || "";
        document.getElementById("editarEspecialidade").value = dentista.especialidade || "";
        document.getElementById("editarTelefone").value = dentista.telefone || "";
        document.getElementById("editarEmail").value = dentista.email || "";
        document.getElementById("editarObservacoes").value = dentista.observacoes || "";

        abrirModal();
    } catch (erro) {
        console.error("Erro ao abrir edição:", erro);
        mostrarMensagem(erro.message, "erro");
    }
}

document.getElementById("fecharModalEditar")?.addEventListener("click", fecharModal);
document.getElementById("cancelarModalEditar")?.addEventListener("click", fecharModal);

modal?.addEventListener("click", evento => {
    if (evento.target === modal) fecharModal();
});

formEdicao?.addEventListener("submit", async evento => {
    evento.preventDefault();

    const id = document.getElementById("editarDentistaId").value;
    const dados = {
        nome: document.getElementById("editarNome").value.trim(),
        cro: document.getElementById("editarCro").value.trim(),
        especialidade: document.getElementById("editarEspecialidade").value.trim(),
        telefone: document.getElementById("editarTelefone").value.trim(),
        email: document.getElementById("editarEmail").value.trim().toLowerCase(),
        observacoes: document.getElementById("editarObservacoes").value.trim()
    };

    const erroValidacao = validarDadosObrigatorios(dados);
    if (erroValidacao) {
        mostrarMensagem(erroValidacao, "erro");
        return;
    }

    const botao = document.getElementById("btnSalvarEdicaoDentista");

    try {
        botao.disabled = true;
        botao.textContent = "⏳ Salvando...";

        const resposta = await fetch(`/dentistas/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível atualizar o profissional.");
        }

        fecharModal();
        mostrarMensagem("Profissional atualizado com sucesso!", "sucesso");
        await carregarDentistas();
    } catch (erro) {
        console.error("Erro ao editar profissional:", erro);
        mostrarMensagem(erro.message, "erro");
    } finally {
        botao.disabled = false;
        botao.textContent = "💾 Salvar alterações";
    }
});

carregarDentistas();
