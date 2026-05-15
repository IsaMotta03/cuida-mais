document.addEventListener('DOMContentLoaded', () => {

    // ─────────────────────────────────────────
    // UTILITÁRIOS
    // ─────────────────────────────────────────

    /** Calcula idade a partir de uma string de data (YYYY-MM-DD) */
    function calcularIdade(dataNasc) {
        if (!dataNasc) return null;
        const hoje = new Date();
        const nasc = new Date(dataNasc);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        return idade;
    }
    function avatarAleatorio(lista) {
    return lista[Math.floor(Math.random() * lista.length)];
    }

    /** Gera um ID aleatório estilo "89bz64" */
    function gerarId() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
        return id;
    }

    /** Atualiza o contador "X pessoas cadastradas" no cabeçalho */
    let totalPessoas = 0;
    function atualizarContador(delta) {
        totalPessoas += delta;
        const contador = document.querySelector('.titulos-cabecalho p');
        if (contador) {
            contador.textContent = `${totalPessoas} pessoa${totalPessoas !== 1 ? 's' : ''} cadastrada${totalPessoas !== 1 ? 's' : ''}`;
        }
    }

    /** Remove o estado vazio (ícone de sino + mensagem) de uma seção */
    function removerEstadoVazio(container) {
        container.querySelector('.icone-sino')?.remove();
        container.querySelector('h3')?.remove();
        container.querySelector('p:not(.btn-enviar-container)')?.remove();
    }

    // ─────────────────────────────────────────
    // BLOCO IDOSO
    // ─────────────────────────────────────────

    const modalIdoso    = document.getElementById('modal-container-idoso');
    const btnAbrirIdoso = document.getElementById('abrir-modal-idoso');
    const btnFecharIdoso = document.getElementById('fechar-modal-idoso');
    const secaoIdosos   = document.getElementById('idoso');

    // Cria o container de cards de idosos se ainda não existir
    let listaIdosos = secaoIdosos.querySelector('.lista-idosos');
    if (!listaIdosos) {
        listaIdosos = document.createElement('div');
        listaIdosos.className = 'lista-idosos';
        secaoIdosos.appendChild(listaIdosos);
    }

    if (modalIdoso && btnAbrirIdoso && btnFecharIdoso) {
        btnAbrirIdoso.addEventListener('click', () => modalIdoso.classList.add('visivel'));
        btnFecharIdoso.addEventListener('click', () => modalIdoso.classList.remove('visivel'));
        window.addEventListener('click', (e) => {
            if (e.target === modalIdoso) modalIdoso.classList.remove('visivel');
        });

        const formIdoso = modalIdoso.querySelector('.formulario');
        if (formIdoso) {
            formIdoso.addEventListener('submit', (e) => {
                e.preventDefault();

                // Coleta dados
                const nome        = formIdoso.querySelector('#nome').value.trim();
                const nascimento  = formIdoso.querySelector('#nascimento').value;
                const comorbidades = formIdoso.querySelector('#comorbidades').value.trim();

                if (!nome) return;

                const idade = calcularIdade(nascimento);
                const idadeTexto = idade !== null ? `${idade} anos (Idade)` : '';

                // Remove estado vazio na primeira vez
                removerEstadoVazio(secaoIdosos);

                // Monta tags de comorbidades
                const tagsHTML = comorbidades
                    ? comorbidades.split(',').map(c =>
                        `<span class="tag-comorbidade">${c.trim()}</span>`
                      ).join('')
                    : '';

                // Cria card
                const card = document.createElement('article');
                card.className = 'card-idoso';
                card.innerHTML = `
                    <div class="card-idoso-avatar">
                        <img src="assets/icons/idoso1.svg" alt="Avatar de ${nome}">
                    </div>
                    <div class="card-idoso-info">
                        <strong class="card-idoso-nome">${nome}</strong>
                        ${idadeTexto ? `<span class="card-idoso-idade">${idadeTexto}</span>` : ''}
                        ${tagsHTML ? `<div class="card-idoso-comorbidades"><span class="label-comorbidades">Comorbidades</span><div class="tags">${tagsHTML}</div></div>` : ''}
                    </div>
                `;

                listaIdosos.appendChild(card);
                atualizarContador(1);

                // Limpa e fecha
                formIdoso.reset();
                modalIdoso.classList.remove('visivel');
            });
        }
    }

    // ─────────────────────────────────────────
    // BLOCO CUIDADOR
    // ─────────────────────────────────────────

    const modalCuidador    = document.getElementById('modal-container-cuidador');
    const btnAbrirCuidador = document.getElementById('abrir-modal-cuidador');
    const btnFecharCuidador = document.getElementById('fechar-modal-cuidador');
    const secaoCuidadores  = document.getElementById('cuidador');

    let listaCuidadores = secaoCuidadores.querySelector('.lista-cuidadores');
    if (!listaCuidadores) {
        listaCuidadores = document.createElement('div');
        listaCuidadores.className = 'lista-cuidadores';
        secaoCuidadores.appendChild(listaCuidadores);
    }

    if (modalCuidador && btnAbrirCuidador && btnFecharCuidador) {
        btnAbrirCuidador.addEventListener('click', () => modalCuidador.classList.add('visivel'));
        btnFecharCuidador.addEventListener('click', () => modalCuidador.classList.remove('visivel'));
        window.addEventListener('click', (e) => {
            if (e.target === modalCuidador) modalCuidador.classList.remove('visivel');
        });

        const btnConfirmarCuidador = modalCuidador.querySelector('.btn-confirmar-cuidador');
        if (btnConfirmarCuidador) {
            btnConfirmarCuidador.addEventListener('click', () => {
                const nome       = modalCuidador.querySelector('#nome-cuidador').value.trim();
                const nascimento = modalCuidador.querySelector('#nascimento-cuidador').value;
                const turno      = modalCuidador.querySelector('#turno').value.trim();
                const dias       = modalCuidador.querySelector('#dias').value.trim();
                const cnh        = modalCuidador.querySelector('#cnh').value.trim();

                if (!nome) return;

                const idade = calcularIdade(nascimento);
                const idadeTexto = idade !== null ? `${idade} anos` : '';
                const idCuidador = gerarId();
                const temCnh = cnh ? 'Sim.' : 'Não.';

                removerEstadoVazio(secaoCuidadores);

                const card = document.createElement('article');
                card.className = 'card-cuidador';
                card.innerHTML = `
                    <div class="card-cuidador-topo">
                        <img src="${avatarAleatorio(['assets/icons/cuidador1.svg', 'assets/icons/cuidador2.svg'])}" alt="Avatar de ${nome}" class="card-cuidador-avatar">
                        <div class="card-cuidador-info">
                            <strong class="card-cuidador-nome">${nome}</strong>
                            ${idadeTexto ? `<span class="card-cuidador-idade">${idadeTexto}</span>` : ''}
                        </div>
                    </div>
                    <ul class="card-cuidador-detalhes">
                        ${turno ? `<li><span>Turno:</span> ${turno}</li>` : ''}
                        ${dias  ? `<li><span>Escala:</span> ${dias}</li>` : ''}
                        <li><span>Possui CNH?</span> ${temCnh}</li>
                    </ul>
                    <div class="card-cuidador-id">Id: ${idCuidador}</div>
                `;

                listaCuidadores.appendChild(card);
                atualizarContador(1);

                // Limpa campos e fecha
                modalCuidador.querySelector('#nome-cuidador').value = '';
                modalCuidador.querySelector('#nascimento-cuidador').value = '';
                modalCuidador.querySelector('#turno').value = '';
                modalCuidador.querySelector('#dias').value = '';
                modalCuidador.querySelector('#cnh').value = '';
                modalCuidador.querySelector('#cpf-cuidador').value = '';
                modalCuidador.querySelector('#tel-cuidador').value = '';
                modalCuidador.classList.remove('visivel');
            });
        }
    }

    // ─────────────────────────────────────────
    // BLOCO FAMILIAR
    // ─────────────────────────────────────────

    const modalFamiliar    = document.getElementById('modalFamiliar');
    const btnAbrirFamiliar = document.getElementById('abrirModal');
    const btnFecharFamiliar = document.getElementById('fecharModal');
    const secaoFamiliares  = document.getElementById('familiar');

    // Container de cards de familiares
    let listaFamiliares = secaoFamiliares.querySelector('.lista-familiares');
    if (!listaFamiliares) {
        listaFamiliares = document.createElement('div');
        listaFamiliares.className = 'lista-familiares';
        // Insere antes do footer de legenda
        secaoFamiliares.appendChild(listaFamiliares);
    }

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

                const nome       = formFamiliar.querySelector('#nome-familiar').value.trim();
                const parentesco = formFamiliar.querySelector('#parentesco-familiar').value.trim();
                const acesso     = formFamiliar.querySelector('#acesso-familiar').value.trim().toLowerCase();

                if (!nome) return;

                // Define cor da pílula: verde = administrador, azul = observador (default)
                const isAdmin = acesso.includes('admin');
                const classePilula = isAdmin ? 'familiar-admin' : 'familiar-observador';
                const acessoLabel  = isAdmin ? 'Administrador' : 'Observador';

                // Remove seção estática de exemplo se existir (avatar hardcoded)
                secaoFamiliares.querySelector('section')?.remove();

                const pilula = document.createElement('div');
                pilula.className = `card-familiar ${classePilula}`;
                pilula.innerHTML = `
                    <img src="${avatarAleatorio(['assets/icons/familiar1.svg', 'assets/icons/familiar2.svg', 'assets/icons/familiar3.svg'])}" alt="Avatar de ${nome}" class="card-familiar-avatar">
                    <div class="card-familiar-info">
                        <strong>${nome}</strong>
                        <span>${parentesco || acessoLabel}</span>
                    </div>
                `;

                listaFamiliares.appendChild(pilula);
                atualizarContador(1);

                formFamiliar.reset();
                modalFamiliar.close();
            });
        }
    }

});