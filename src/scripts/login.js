const btnEntrar = document.getElementById('btnEntrar');
const emailInput = document.getElementById('emailInput');
const senhaInput = document.getElementById('senhaInput');
const msgErro = document.getElementById('msgErro');

btnEntrar.addEventListener('click', () => {
    if (emailInput.value === "" || senhaInput.value === "") {
        msgErro.textContent = 'Por favor, preencha todos os campos.';
        msgErro.style.display = 'block';
    } else {
        msgErro.style.display = 'none';
        window.location.href = 'visaogeral.html';
    }
})