const formLogin = document.getElementById("formLogin");
const emailInput = document.getElementById("email");
const pinInput = document.getElementById("pin");
const mensagem = document.getElementById("msg");
const btnEntrar = document.getElementById("btnLogin");

function mostrarMensagem(texto, tipo = "erro") {
    if (!mensagem) return;
    mensagem.textContent = texto;
    mensagem.className = `msg ${tipo}`;
    mensagem.style.display = "block";
}

function esconderMensagem() {
    if (!mensagem) return;
    mensagem.style.display = "none";
}

function obterDestino() {
    const params = new URLSearchParams(window.location.search);
    const destino = params.get("redirect");

    // Aceita somente páginas HTML internas do sistema.
    if (destino && /^[a-zA-Z0-9_-]+\.html$/.test(destino)) {
        return destino;
    }

    // Após um login normal, abrir o painel principal.
    return "painel.html";
}

if (formLogin) {
    formLogin.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        esconderMensagem();

        const email = emailInput?.value.trim().toLowerCase() || "";
        const pin = pinInput?.value.trim() || "";

        if (!email || !pin) {
            mostrarMensagem("Informe o e-mail e o PIN.");
            return;
        }

        if (btnEntrar) {
            btnEntrar.disabled = true;
            btnEntrar.textContent = "Entrando...";
        }

        try {
            const resposta = await fetch("/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, pin })
            });

            const dados = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(
                    dados.erro || "Não foi possível realizar o login."
                );
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

            // Pequena confirmação antes de entrar no painel.
            mostrarMensagem("Login realizado com sucesso!", "sucesso");

            window.setTimeout(() => {
                window.location.replace(obterDestino());
            }, 150);

        } catch (erro) {
            console.error("Erro no login:", erro);
            mostrarMensagem(
                erro.message || "Erro ao realizar o login."
            );
        } finally {
            if (btnEntrar) {
                btnEntrar.disabled = false;
                btnEntrar.textContent = "Entrar";
            }
        }
    });
}
