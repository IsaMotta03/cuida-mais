document.addEventListener('DOMContentLoaded', () => {
    
    // --- BLOCO IDOSO ---
    const modalIdoso = document.getElementById('modal-container-idoso');
    const btnAbrirIdoso = document.getElementById('abrir-modal-idoso');
    const btnFecharIdoso = document.getElementById('fechar-modal-idoso');

    if (modalIdoso && btnAbrirIdoso && btnFecharIdoso) {
        btnAbrirIdoso.addEventListener('click', () => modalIdoso.classList.add('visivel'));
        btnFecharIdoso.addEventListener('click', () => modalIdoso.classList.remove('visivel'));
        
        window.addEventListener('click', (evento) => {
            if (evento.target === modalIdoso) modalIdoso.classList.remove('visivel');
        });
    }

    // --- BLOCO FAMILIAR (Usa a tag <dialog>) ---
    const modalFamiliar = document.getElementById('modalFamiliar');
    const btnAbrirFamiliar = document.getElementById('abrirModal');
    const btnFecharFamiliar = document.getElementById('fecharModal');

    if (modalFamiliar && btnAbrirFamiliar) {
        btnAbrirFamiliar.addEventListener('click', () => modalFamiliar.showModal());

        if (btnFecharFamiliar) {
            btnFecharFamiliar.addEventListener('click', () => modalFamiliar.close());
        }

        modalFamiliar.addEventListener('mousedown', (e) => {
            if (e.target === modalFamiliar) modalFamiliar.close();
        });

        const formFamiliar = modalFamiliar.querySelector('form');
        if (formFamiliar) {
            formFamiliar.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log("Dados familiar confirmados!");
                modalFamiliar.close();
            });
        }
    }

    // --- BLOCO CUIDADOR ---
    const modalCuidador = document.getElementById('modal-container-cuidador');
    const btnAbrirCuidador = document.getElementById('abrir-modal-cuidador');
    const btnFecharCuidador = document.getElementById('fechar-modal-cuidador');

    // Esta verificação impede que o erro de uma modal trave a outra
    if (modalCuidador && btnAbrirCuidador && btnFecharCuidador) {
        btnAbrirCuidador.addEventListener('click', () => {
            console.log("Abrindo modal cuidador");
            modalCuidador.classList.add('visivel');
        });

        btnFecharCuidador.addEventListener('click', () => {
            modalCuidador.classList.remove('visivel');
        });

        window.addEventListener('click', (e) => {
            if (e.target === modalCuidador) {
                modalCuidador.classList.remove('visivel');
            }
        });
    } else {
        console.warn("Elementos da modal Cuidador não encontrados no HTML.");
    }
});