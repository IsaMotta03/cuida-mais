// Seleção dos elementos do DOM
const modalIdoso = document.getElementById('modal-container-idoso');
const btnAbrirIdoso = document.getElementById('abrir-modal-idoso');
const btnFecharIdoso = document.getElementById('fechar-modal-idoso');

// Função para abrir a modal
btnAbrirIdoso.addEventListener('click', () => modalIdoso.classList.add('visivel'));
btnFecharIdoso.addEventListener('click', ()=> modalIdoso.classList.remove('visivel'));
// Função para fechar a modal
const modalFamiliar = document.getElementById('modal-container-familiar');
const btnAbrirFamiliar = document.getElementById('abrir-modal-familiar');
const btnFecharFamiliar = document.getElementById('fechar-modal-familiar');

btnAbrirFamiliar.addEventListener('click', () => modalFamiliar.classList.add('visivel'));
btnFecharFamiliar.addEventListener('click', () => modalFamiliar.classList.remove('visivel'));

// Fechamento genérico ao clicar na máscara escura de qualquer modal
window.addEventListener('click', (evento) => {
  if (evento.target === modalIdoso) modalIdoso.classList.remove('visivel');
  if (evento.target === modalFamiliar) modalFamiliar.classList.remove('visivel');
});
//-------------------------------------------------------------------------------------------------
