const formReset = document.getElementById("formReset");
const emailReset = document.getElementById("email");
const msgReset = document.getElementById("msg");
const btnReset = document.getElementById("btn");

function mostrar(texto, tipo) {
    msgReset.textContent = texto;
    msgReset.className = `msg ${tipo}`;
    msgReset.style.display = "block";
}

formReset.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        btnReset.disabled = true;
        btnReset.textContent = "Enviando...";

        const resposta = await fetch("/auth/esqueci-pin", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ email: emailReset.value.trim().toLowerCase() })
        });

        const texto = await resposta.text();
        const resultado = JSON.parse(texto);

        if (!resposta.ok) throw new Error(resultado.erro || "Não foi possível enviar o e-mail.");

        mostrar(resultado.mensagem, "sucesso");
    } catch (erro) {
        mostrar(erro.message, "erro");
    } finally {
        btnReset.disabled = false;
        btnReset.textContent = "Enviar link de redefinição";
    }
});
