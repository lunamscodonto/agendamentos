const form = document.getElementById("formUsuario");
const nome = document.getElementById("nome");
const pin = document.getElementById("pin");
const confirmarPin = document.getElementById("confirmarPin");
const mensagem = document.getElementById("mensagem");
const listaUsuarios = document.getElementById("listaUsuarios");
const btnSalvar = document.getElementById("btnSalvar");

function escaparHTML(valor) {
    return String(valor || "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[caractere]));
}

function somenteNumeros(campo) {
    campo.addEventListener("input", () => {
        campo.value = campo.value.replace(/\D/g, "");
    });
}

somenteNumeros(pin);
somenteNumeros(confirmarPin);

function alternarVisibilidade(campo) {
    campo.type = campo.type === "password" ? "text" : "password";
}

document.getElementById("mostrarPin").addEventListener("click", () => {
    alternarVisibilidade(pin);
});

document.getElementById("mostrarConfirmarPin").addEventListener("click", () => {
    alternarVisibilidade(confirmarPin);
});

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = "block";
}

function formatarData(data) {
    if (!data) return "";
    return new Date(data).toLocaleString("pt-BR");
}

async function carregarUsuarios() {
    try {
        const resposta = await fetch("/usuarios");
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível carregar os usuários.");
        }

        const usuarios = resultado.usuarios || [];

        if (!usuarios.length) {
            listaUsuarios.innerHTML = '<div class="vazio">Nenhum usuário cadastrado.</div>';
            return;
        }

        listaUsuarios.innerHTML = usuarios.map(usuario => `
            <div class="usuario">
                <div>
                    <strong>👤 ${escaparHTML(usuario.nome)}</strong><br>
                    <small>Cadastrado em ${escaparHTML(formatarData(usuario.criado_em))}</small>
                </div>
                <span class="badge">${usuario.ativo ? "● Ativo" : "○ Inativo"}</span>
            </div>
        `).join("");

    } catch (erro) {
        listaUsuarios.innerHTML =
            `<div class="vazio">⚠️ ${escaparHTML(erro.message)}</div>`;
    }
}

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensagem.style.display = "none";

    const nomeValor = nome.value.trim();
    const pinValor = pin.value.trim();
    const confirmarPinValor = confirmarPin.value.trim();

    if (!nomeValor) {
        return mostrarMensagem("Informe o nome do usuário.", "erro");
    }

    if (!/^\d+$/.test(pinValor)) {
        return mostrarMensagem("O PIN deve conter somente números.", "erro");
    }

    if (pinValor.length < 4) {
        return mostrarMensagem("O PIN deve ter pelo menos 4 números.", "erro");
    }

    if (pinValor !== confirmarPinValor) {
        return mostrarMensagem("Os PINs não conferem.", "erro");
    }

    try {
        btnSalvar.disabled = true;
        btnSalvar.textContent = "⏳ Salvando...";

        const resposta = await fetch("/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nomeValor,
                pin: pinValor
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível cadastrar o usuário.");
        }

        form.reset();
        mostrarMensagem("Usuário cadastrado com sucesso!", "sucesso");
        await carregarUsuarios();

    } catch (erro) {
        mostrarMensagem(erro.message, "erro");

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "💾 Cadastrar usuário";
    }
});

carregarUsuarios();
