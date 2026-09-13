const form = document.getElementById("formUsuario");
const nome = document.getElementById("nome");
const email = document.getElementById("email");
const perfil = document.getElementById("perfil");
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
        window.usuariosCarregados = usuarios;

        if (!usuarios.length) {
            listaUsuarios.innerHTML = '<div class="vazio">Nenhum usuário cadastrado.</div>';
            return;
        }

        listaUsuarios.innerHTML = usuarios.map(usuario => `
            <div class="usuario">
                <div>
                    <strong>👤 ${escaparHTML(usuario.nome)}</strong><br>
                    <small>📧 ${escaparHTML(usuario.email || "")}</small><br>
                    <small>Perfil: ${escaparHTML(formatarPerfil(usuario.perfil))} · Cadastrado em ${escaparHTML(formatarData(usuario.criado_em))}</small>
                </div>
                <div class="usuario-acoes">
                    <span class="badge">${usuario.ativo ? "● Ativo" : "○ Inativo"}</span>
                    <button type="button" class="btn-editar" onclick="abrirEdicao('${String(usuario.auth_user_id || "").replace(/'/g, "\'")}')">✏️ Editar</button>
                </div>
            </div>
        `).join("");

    } catch (erro) {
        listaUsuarios.innerHTML =
            `<div class="vazio">⚠️ ${escaparHTML(erro.message)}</div>`;
    }
}


function formatarPerfil(perfil) {
    const mapa = {
        administrador: "Administrador",
        dentista: "Dentista",
        recepcao: "Recepção"
    };
    return mapa[String(perfil || "").toLowerCase()] || perfil || "Não informado";
}

function obterAccessToken() {
    const chaves = [
        "supabase.auth.token",
        "supabaseSession",
        "session",
        "usuarioSession",
        "authSession"
    ];

    for (const chave of chaves) {
        try {
            const valor = localStorage.getItem(chave) || sessionStorage.getItem(chave);
            if (!valor) continue;
            const obj = JSON.parse(valor);
            const token = obj?.access_token || obj?.session?.access_token || obj?.data?.session?.access_token;
            if (token) return token;
        } catch (_) {}
    }

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            const valor = localStorage.getItem(chave);
            if (!valor || !/session|auth|token/i.test(chave)) continue;
            try {
                const obj = JSON.parse(valor);
                const token = obj?.access_token || obj?.session?.access_token || obj?.data?.session?.access_token;
                if (token) return token;
            } catch (_) {}
        }
    } catch (_) {}

    return "";
}

async function carregarUsuarioLogado() {
    const nomeElemento = document.getElementById("nomeUsuarioLogado");
    if (!nomeElemento) return;

    let usuarioSalvo = null;
    let sessao = null;
    let nome = "";

    // =====================================================
    // 1. Recupera exatamente os dados salvos no LOGIN
    // =====================================================
    try {
        const textoUsuario = localStorage.getItem("msc_odonto_usuario");
        if (textoUsuario) {
            usuarioSalvo = JSON.parse(textoUsuario);
            nome = String(usuarioSalvo?.nome || "").trim();
        }
    } catch (erro) {
        console.warn("Não foi possível ler msc_odonto_usuario:", erro);
    }

    try {
        const textoSessao = localStorage.getItem("msc_odonto_session");
        if (textoSessao) {
            sessao = JSON.parse(textoSessao);
        }
    } catch (erro) {
        console.warn("Não foi possível ler msc_odonto_session:", erro);
    }

    // Mostra imediatamente o nome salvo pelo login.
    if (nome) {
        nomeElemento.textContent = nome;
    }

    const accessToken = sessao?.access_token || "";
    const authUserId = sessao?.user?.id || usuarioSalvo?.auth_user_id || "";
    const email = String(
        sessao?.user?.email ||
        usuarioSalvo?.email ||
        ""
    ).trim().toLowerCase();

    // =====================================================
    // 2. Confirma pelo backend
    // =====================================================
    if (accessToken) {
        try {
            const resposta = await fetch("/auth/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Accept": "application/json",
                    "Cache-Control": "no-cache"
                },
                cache: "no-store"
            });

            const resultado = await resposta.json().catch(() => ({}));

            if (resposta.ok && resultado.usuario) {
                const usuario = resultado.usuario;

                if (usuario.nome) {
                    nome = String(usuario.nome).trim();
                    nomeElemento.textContent = nome;
                }

                // Mantém os dados atualizados para os próximos módulos.
                try {
                    localStorage.setItem(
                        "msc_odonto_usuario",
                        JSON.stringify(usuario)
                    );
                } catch (_) {}

                return;
            }

            console.warn("Não foi possível obter /auth/me:", resultado);
        } catch (erro) {
            console.warn("Falha ao consultar /auth/me:", erro);
        }
    }

    // =====================================================
    // 3. Fallback: procura o usuário pelo ID/e-mail na lista
    // =====================================================
    try {
        const resposta = await fetch("/usuarios", {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Cache-Control": "no-cache"
            },
            cache: "no-store"
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (resposta.ok && Array.isArray(resultado.usuarios)) {
            const usuarioEncontrado = resultado.usuarios.find(usuario => {
                const mesmoId =
                    authUserId &&
                    String(usuario.auth_user_id || "") === String(authUserId);

                const mesmoEmail =
                    email &&
                    String(usuario.email || "").trim().toLowerCase() === email;

                return mesmoId || mesmoEmail;
            });

            if (usuarioEncontrado?.nome) {
                nome = String(usuarioEncontrado.nome).trim();
                nomeElemento.textContent = nome;

                try {
                    localStorage.setItem(
                        "msc_odonto_usuario",
                        JSON.stringify(usuarioEncontrado)
                    );
                } catch (_) {}

                return;
            }
        }
    } catch (erro) {
        console.warn("Falha ao procurar usuário em /usuarios:", erro);
    }

    // Se ainda não houver nome, usa o e-mail como último recurso.
    // Não deixa o cabeçalho preso em "Carregando...".
    if (!nome) {
        nomeElemento.textContent = email || "Usuário";
    }
}

function abrirEdicao(id) {
    const usuario = (window.usuariosCarregados || []).find(item => String(item.auth_user_id) === String(id));
    if (!usuario) {
        return mostrarMensagem("Não foi possível localizar este usuário.", "erro");
    }

    document.getElementById("editarId").value = usuario.auth_user_id || "";
    document.getElementById("editarNome").value = usuario.nome || "";
    document.getElementById("editarEmail").value = usuario.email || "";
    document.getElementById("editarPerfil").value = usuario.perfil || "";
    document.getElementById("editarAtivo").value = String(usuario.ativo !== false);

    const msg = document.getElementById("mensagemEdicao");
    msg.style.display = "none";
    document.getElementById("modalEditar").classList.add("aberto");
    document.getElementById("modalEditar").setAttribute("aria-hidden", "false");
}

function fecharEdicao() {
    document.getElementById("modalEditar").classList.remove("aberto");
    document.getElementById("modalEditar").setAttribute("aria-hidden", "true");
}

document.getElementById("btnCancelarEdicao")?.addEventListener("click", fecharEdicao);

document.getElementById("modalEditar")?.addEventListener("click", (evento) => {
    if (evento.target.id === "modalEditar") fecharEdicao();
});

document.getElementById("formEditarUsuario")?.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = document.getElementById("editarId").value;
    const nomeValor = document.getElementById("editarNome").value.trim();
    const perfilValor = document.getElementById("editarPerfil").value;
    const ativoValor = document.getElementById("editarAtivo").value === "true";
    const msg = document.getElementById("mensagemEdicao");
    const botao = document.getElementById("btnSalvarEdicao");

    if (!nomeValor) {
        msg.textContent = "Informe o nome do usuário.";
        msg.className = "mensagem erro";
        msg.style.display = "block";
        return;
    }

    try {
        botao.disabled = true;
        botao.textContent = "⏳ Salvando...";

        const resposta = await fetch(`/usuarios/${encodeURIComponent(id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome: nomeValor,
                perfil: perfilValor,
                ativo: ativoValor
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível editar o usuário.");
        }

        fecharEdicao();
        mostrarMensagem("Usuário atualizado com sucesso!", "sucesso");
        await carregarUsuarios();
    } catch (erro) {
        msg.textContent = erro.message;
        msg.className = "mensagem erro";
        msg.style.display = "block";
    } finally {
        botao.disabled = false;
        botao.textContent = "Salvar alterações";
    }
});

form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    mensagem.style.display = "none";

    const nomeValor = nome.value.trim();
    const emailValor = email.value.trim().toLowerCase();
    const perfilValor = perfil.value;
    const pinValor = pin.value.trim();
    const confirmarPinValor = confirmarPin.value.trim();

    if (!nomeValor) {
        return mostrarMensagem("Informe o nome do usuário.", "erro");
    }

    if (!emailValor || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValor)) {
        return mostrarMensagem("Informe um e-mail válido.", "erro");
    }

    if (!perfilValor) {
        return mostrarMensagem("Selecione o perfil do usuário.", "erro");
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
                email: emailValor,
                perfil: perfilValor,
                pin: pinValor
            })
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível cadastrar o usuário.");
        }

        form.reset();
        mostrarMensagem("Usuário cadastrado com sucesso! Verifique seu e-mail para ativação.", "sucesso");
        await carregarUsuarios();

    } catch (erro) {
        mostrarMensagem(erro.message, "erro");

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = "💾 Cadastrar usuário";
    }
});

carregarUsuarios();

carregarUsuarioLogado();
