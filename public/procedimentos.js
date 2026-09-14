(() => {
    const form = document.getElementById("formProcedimento");
    const formEditar = document.getElementById("formEditar");
    const nome = document.getElementById("nome");
    const descricao = document.getElementById("descricao");
    const pesquisa = document.getElementById("pesquisa");
    const lista = document.getElementById("listaProcedimentos");
    const contador = document.getElementById("contador");
    const mensagem = document.getElementById("mensagem");
    const btnLimpar = document.getElementById("btnLimpar");

    let procedimentos = [];

    function escapeHtml(valor) {
        return String(valor ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function mostrarMensagem(el, texto, tipo) {
        el.textContent = texto;
        el.className = `mensagem ${tipo}`;
        setTimeout(() => {
            el.className = "mensagem";
            el.textContent = "";
        }, 3500);
    }

    async function carregarProcedimentos() {
        try {
            const resposta = await fetch("/procedimentos");
            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível consultar os procedimentos.");
            procedimentos = Array.isArray(dados.procedimentos) ? dados.procedimentos : [];
            renderizar();
        } catch (erro) {
            lista.innerHTML = `<div class="vazio">❌ ${escapeHtml(erro.message)}</div>`;
            contador.textContent = "Erro ao consultar os procedimentos.";
        }
    }

    function renderizar() {
        const termo = pesquisa.value.trim().toLowerCase();

        if (!termo) {
            lista.innerHTML = '<div class="vazio">🔎 Pesquise um procedimento para visualizar os resultados.</div>';
            contador.textContent = "Faça uma pesquisa para visualizar os procedimentos.";
            return;
        }

        const encontrados = procedimentos.filter(p => {
            const nome = String(p.nome || "").toLowerCase();
            const descricao = String(p.descricao || "").toLowerCase();
            return nome.includes(termo) || descricao.includes(termo);
        });

        contador.textContent = `${encontrados.length} procedimento(s) encontrado(s).`;

        if (!encontrados.length) {
            lista.innerHTML = '<div class="vazio">Nenhum procedimento encontrado.</div>';
            return;
        }

        lista.innerHTML = encontrados.map(p => `
            <div class="item">
                <div>
                    <strong>${escapeHtml(p.nome)}</strong>
                    ${p.descricao ? `<small>${escapeHtml(p.descricao)}</small>` : ""}
                </div>
                <button class="btn-editar" type="button" onclick="editarProcedimento('${String(p.id)}')">✏️ Editar</button>
            </div>
        `).join("");
    }

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const nomeValor = nome.value.trim();
        const descricaoValor = descricao.value.trim();

        if (!nomeValor) {
            mostrarMensagem(mensagem, "Informe o tipo do procedimento.", "erro");
            nome.focus();
            return;
        }

        try {
            const resposta = await fetch("/procedimentos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nomeValor,
                    descricao: descricaoValor || null
                })
            });

            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível cadastrar o procedimento.");

            mostrarMensagem(mensagem, "Procedimento cadastrado com sucesso!", "sucesso");
            form.reset();
            await carregarProcedimentos();
            pesquisa.value = nomeValor;
            renderizar();
        } catch (erro) {
            mostrarMensagem(mensagem, erro.message, "erro");
        }
    });

    btnLimpar.addEventListener("click", () => {
        form.reset();
        mensagem.className = "mensagem";
        mensagem.textContent = "";
        nome.focus();
    });

    pesquisa.addEventListener("input", renderizar);

    window.editarProcedimento = (id) => {
        const procedimento = procedimentos.find(p => String(p.id) === String(id));
        if (!procedimento) return;

        document.getElementById("editarId").value = procedimento.id;
        document.getElementById("editarNome").value = procedimento.nome || "";
        document.getElementById("editarDescricao").value = procedimento.descricao || "";

        document.getElementById("mensagemEditar").className = "mensagem";
        document.getElementById("mensagemEditar").textContent = "";
        document.getElementById("modalEditar").classList.add("aberto");
        document.getElementById("modalEditar").setAttribute("aria-hidden", "false");
        document.getElementById("editarNome").focus();
    };

    window.fecharModal = () => {
        document.getElementById("modalEditar").classList.remove("aberto");
        document.getElementById("modalEditar").setAttribute("aria-hidden", "true");
    };

    formEditar.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        const id = document.getElementById("editarId").value;
        const nomeValor = document.getElementById("editarNome").value.trim();
        const descricaoValor = document.getElementById("editarDescricao").value.trim();
        const mensagemEditar = document.getElementById("mensagemEditar");

        if (!nomeValor) {
            mostrarMensagem(mensagemEditar, "Informe o tipo do procedimento.", "erro");
            return;
        }

        try {
            const resposta = await fetch(`/procedimentos/${encodeURIComponent(id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nomeValor,
                    descricao: descricaoValor || null
                })
            });

            const dados = await resposta.json().catch(() => ({}));
            if (!resposta.ok) throw new Error(dados.erro || "Não foi possível editar o procedimento.");

            mostrarMensagem(mensagemEditar, "Procedimento atualizado com sucesso!", "sucesso");
            await carregarProcedimentos();
            pesquisa.value = nomeValor;
            renderizar();
            setTimeout(fecharModal, 500);
        } catch (erro) {
            mostrarMensagem(mensagemEditar, erro.message, "erro");
        }
    });

    window.focarCadastro = () => {
        nome.focus();
        document.getElementById("cadastro").scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.getElementById("modalEditar").addEventListener("click", (evento) => {
        if (evento.target.id === "modalEditar") fecharModal();
    });

    carregarProcedimentos();
})();
