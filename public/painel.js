(() => {
    const conteudo = document.getElementById("conteudo");
    const tituloPagina = document.getElementById("tituloPagina");
    const subtituloPagina = document.getElementById("subtituloPagina");
    const btnMenu = document.getElementById("btnMenu");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const btnSair = document.getElementById("btnSair");

    const subtitulos = {
        "Início": "Painel central do sistema",
        "Pacientes": "Cadastro, consulta e histórico de pacientes",
        "Agenda": "Agendamentos da clínica",
        "Profissionais": "Cadastro e gestão dos profissionais",
        "Retornos": "Controle de retornos",
        "Dashboard": "Indicadores da clínica",
        "Financeiro": "Controle financeiro",
        "Alertas": "Alertas e pendências",
        "Usuários": "Gestão de usuários"
    };

    function fecharMenuMobile() {
        sidebar?.classList.remove("aberto");
        overlay?.classList.remove("ativo");
    }

    function aplicarEstiloAoModulo(frame) {
        try {
            const doc = frame.contentDocument;
            if (!doc) return;

            const style = doc.createElement("style");
            style.textContent = `
                html, body {
                    margin: 0 !important;
                    min-height: 100% !important;
                    overflow-x: hidden !important;
                }

                /* O painel externo já possui cabeçalho e navegação. */
                .topo, .menu-principal {
                    display: none !important;
                }

                body {
                    padding: 0 !important;
                    background: transparent !important;
                }

                .container {
                    width: 100% !important;
                    max-width: none !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .card {
                    margin: 0 !important;
                }
            `;
            doc.head.appendChild(style);
        } catch (erro) {
            console.warn("Não foi possível ajustar o estilo do módulo:", erro);
        }
    }

    function carregarModulo(url, titulo) {
        if (!conteudo) return;

        if (tituloPagina) tituloPagina.textContent = titulo;
        if (subtituloPagina) {
            subtituloPagina.textContent =
                subtitulos[titulo] || "Módulo do sistema";
        }

        conteudo.innerHTML = `
            <div class="modulo-carregando">
                <div class="spinner">⏳</div>
                <strong>Carregando ${titulo}...</strong>
            </div>
        `;

        const frame = document.createElement("iframe");
        frame.className = "modulo-frame";
        frame.title = titulo;
        frame.src = url;
        frame.loading = "eager";

        frame.addEventListener("load", () => {
            aplicarEstiloAoModulo(frame);

            // Reaplica após um pequeno intervalo para páginas que adicionam
            // estilos dinamicamente.
            setTimeout(() => aplicarEstiloAoModulo(frame), 100);
        });

        frame.addEventListener("error", () => {
            conteudo.innerHTML = `
                <div class="modulo-erro">
                    <strong>Não foi possível carregar ${titulo}.</strong>
                    <p>Verifique o arquivo <b>${url}</b> e o console do navegador.</p>
                </div>
            `;
        });

        conteudo.innerHTML = "";
        conteudo.appendChild(frame);
        fecharMenuMobile();
    }

    function definirAtivo(botao) {
        document.querySelectorAll(".menu-item[data-url]").forEach(item => {
            item.classList.remove("ativo");
        });
        document.querySelectorAll(".atalho[data-url]").forEach(item => {
            item.classList.remove("ativo");
        });
        botao?.classList.add("ativo");
    }

    document.querySelectorAll(".menu-item[data-url]").forEach(botao => {
        botao.addEventListener("click", () => {
            definirAtivo(botao);
            carregarModulo(
                botao.dataset.url,
                botao.dataset.titulo || "Módulo"
            );
        });
    });

    document.querySelectorAll(".atalho[data-url]").forEach(botao => {
        botao.addEventListener("click", () => {
            const correspondente =
                document.querySelector(
                    `.menu-item[data-url="${CSS.escape(botao.dataset.url)}"]`
                );

            definirAtivo(correspondente || botao);
            carregarModulo(
                botao.dataset.url,
                botao.dataset.titulo || "Módulo"
            );
        });
    });

    btnMenu?.addEventListener("click", () => {
        sidebar?.classList.toggle("aberto");
        overlay?.classList.toggle("ativo");
    });

    overlay?.addEventListener("click", fecharMenuMobile);

    btnSair?.addEventListener("click", () => {
        localStorage.removeItem("msc_odonto_session");
        localStorage.removeItem("msc_odonto_usuario");
        window.location.replace("login.html");
    });

    // Início permanece como o conteúdo inicial do painel.
})();
