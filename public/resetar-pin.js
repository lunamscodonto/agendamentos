const formNovoPin = document.getElementById("formNovoPin");
const novoPin = document.getElementById("pin");
const confirmarNovoPin = document.getElementById("confirmar");
const msgNovoPin = document.getElementById("msg");
const btnNovoPin = document.getElementById("btn");

[novoPin, confirmarNovoPin].forEach(campo => campo.addEventListener("input", () => {
    campo.value = campo.value.replace(/\D/g, "");
}));

function mostrarNovoPin(texto, tipo) {
    msgNovoPin.textContent = texto;
    msgNovoPin.className = `msg ${tipo}`;
    msgNovoPin.style.display = "block";
}

function obterAccessToken() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(location.search);
    return hash.get("access_token") || query.get("access_token") || "";
}

formNovoPin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const accessToken = obterAccessToken();
    const pin = novoPin.value;

    if (!accessToken) {
        return mostrarNovoPin("O link de recuperação é inválido ou expirou. Solicite um novo e-mail.", "erro");
    }

    if (!/^\d{4,12}$/.test(pin)) {
        return mostrarNovoPin("O PIN deve conter somente números, entre 4 e 12 dígitos.", "erro");
    }

    if (pin !== confirmarNovoPin.value) {
        return mostrarNovoPin("Os PINs não conferem.", "erro");
    }

    try {
        btnNovoPin.disabled = true;
        btnNovoPin.textContent = "Salvando...";

        const resposta = await fetch("/auth/atualizar-pin", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                access_token: accessToken,
                pin
            })
        });

        const texto = await resposta.text();
        const resultado = JSON.parse(texto);

        if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível atualizar o PIN.");

        formNovoPin.reset();
        mostrarNovoPin("PIN atualizado com sucesso! Você já pode entrar no sistema.", "sucesso");

        setTimeout(() => location.href = "login.html", 1200);
    } catch (erro) {
        mostrarNovoPin(erro.message, "erro");
    } finally {
        btnNovoPin.disabled = false;
        btnNovoPin.textContent = "Salvar novo PIN";
    }
});
