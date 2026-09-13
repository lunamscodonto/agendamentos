const formLogin = document.getElementById("formLogin");
const nomeInput = document.getElementById("nome");
const pinInput = document.getElementById("pin");
const mensagem = document.getElementById("msg");
const btnEntrar = document.getElementById("btnLogin");

function mostrarMensagem(texto, tipo = "erro") {
    if (!mensagem) return;
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = "block";
}

function esconderMensagem() {
    if (!mensagem) return;
    mensagem.style.display = "none";
}

function obterDestino() {
    const params = new URLSearchParams(window.location.search);
    const destino = params.get("redirect");

    // Aceita apenas páginas internas do sistema.
    if (destino && /^[a-zA-Z0-9_-]+\.html$/.test(destino)) {
        return destino;
    }

    return "painel.html";
}

if (formLogin) {
    formLogin.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        esconderMensagem();

        const nome = nomeInput.value.trim();
        const pin = pinInput.value.trim();

        if (!nome || !pin) {
            mostrarMensagem("Informe o nome de usuário e o PIN.");
            return;
        }

        btnEntrar.disabled = true;
        const textoOriginal = btnEntrar.textContent;
        btnEntrar.textContent = "Entrando...";

        try {
            const resposta = await fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nome, pin })
            });

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(dados.erro || "Não foi possível realizar o login.");
            }

            if (!dados.session?.access_token) {
                throw new Error("Sessão de acesso não recebida.");
            }

            localStorage.setItem(
                "msc_odonto_session",
                JSON.stringify(dados.session)
            );

            localStorage.setItem(
                "msc_odonto_usuario",
                JSON.stringify(dados.usuario || {})
            );

            window.location.replace(obterDestino());

        } catch (erro) {
            mostrarMensagem(erro.message || "Erro ao realizar o login.");
        } finally {
            btnEntrar.disabled = false;
            btnEntrar.textContent = textoOriginal;
        }
    });
}
