(async function () {
    const paginaAtual = (window.location.pathname.split("/").pop() || "painel.html").toLowerCase();

    if (paginaAtual === "login.html") return;

    let session = null;

    try {
        session = JSON.parse(localStorage.getItem("msc_odonto_session") || "null");
    } catch {
        session = null;
    }

    const accessToken = session?.access_token;

    if (!accessToken) {
        window.location.replace("login.html?redirect=" + encodeURIComponent(paginaAtual));
        return;
    }

    try {
        const resposta = await fetch("/auth/me", {
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        });

        if (!resposta.ok) {
            throw new Error("Sessão inválida");
        }

        const dados = await resposta.json();

        if (!dados.autenticado) {
            throw new Error("Usuário não autenticado");
        }

        localStorage.setItem(
            "msc_odonto_usuario",
            JSON.stringify(dados.usuario || {})
        );

    } catch (erro) {
        console.error("Falha ao verificar sessão:", erro);

        localStorage.removeItem("msc_odonto_session");
        localStorage.removeItem("msc_odonto_usuario");

        window.location.replace("login.html?redirect=" + encodeURIComponent(paginaAtual));
    }
})();
