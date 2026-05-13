// Seleção dos elementos do DOM
const modalIdoso = document.getElementById('modal-container-idoso');
const btnAbrirIdoso = document.getElementById('abrir-modal-idoso');
const btnFecharIdoso = document.getElementById('fechar-modal-idoso');

// Função para abrir a modal
btnAbrirIdoso.addEventListener('click', () => modalIdoso.classList.add('visivel'));
btnFecharIdoso.addEventListener('click', ()=> modalIdoso.classList.remove('visivel'));
// Função para fechar a modal

// Fechamento genérico ao clicar na máscara escura de qualquer modal
window.addEventListener('click', (evento) => {
  if (evento.target === modalIdoso) modalIdoso.classList.remove('visivel');
});
//-------------------------------------------------------------------------------------------------
// O ID aqui deve ser exatamente igual ao do botão no seu HTML
const modal = document.getElementById('modalFamiliar');
const btnAbrir = document.getElementById('abrirModal'); // Mudei de 'abrirModalFamiliar' para 'abrirModal'
const btnFechar = document.getElementById('fecharModal');

// Abre a modal
if (btnAbrir && modal) {
    btnAbrir.addEventListener('click', () => {
        modal.showModal();
    });
}

// Fecha no X
if (btnFechar && modal) {
    btnFechar.addEventListener('click', () => {
        modal.close();
    });
}

// Fecha ao clicar fora
modal.addEventListener('mousedown', (e) => {
    if (e.target === modal) {
        modal.close();
    }
});

// Previne o reload da página no submit
const form = modal.querySelector('form');
if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log("Dados confirmados!");
        modal.close();
    });
}