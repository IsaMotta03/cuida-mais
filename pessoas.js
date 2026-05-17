document.addEventListener('DOMContentLoaded', () => {

    // ─────────────────────────────────────────
    // UTILITÁRIOS
    // ─────────────────────────────────────────

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

    function gerarId() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';
        for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
        return id;
    }

    // ─────────────────────────────────────────
    // CONTADOR DE PESSOAS
    // ─────────────────────────────────────────

    let totalPessoas = 0;

    function atualizarContador(delta) {
        totalPessoas += delta;
        const contador = document.querySelector('.titulos-cabecalho p');
        if (contador) {
            contador.textContent = `${totalPessoas} pessoa${totalPessoas !== 1 ? 's' : ''} cadastrada${totalPessoas !== 1 ? 's' : ''}`;
        }
    }

    function removerEstadoVazio(container) {
        container.querySelector('.icone-sino')?.remove();
        container.querySelector('h3')?.remove();
        // Evita remover parágrafos dentro de botões ou formulários
        const p = container.querySelector('p:not(.btn-enviar-container)');
        if (p && !p.closest('form') && !p.closest('aside')) p.remove();
    }

    // ─────────────────────────────────────────
    // LOCALSTORAGE — chaves
    // ─────────────────────────────────────────

    const LS_IDOSOS     = 'cuida_idosos';
    const LS_CUIDADORES = 'cuida_cuidadores';
    const LS_FAMILIARES = 'cuida_familiares';

    function carregar(chave)       { try { return JSON.parse(localStorage.getItem(chave)) || []; } catch { return []; } }
    function salvar(chave, lista)  { localStorage.setItem(chave, JSON.stringify(lista)); }

    // Arrays em memória
    let idososLS     = carregar(LS_IDOSOS);
    let cuidadoresLS = carregar(LS_CUIDADORES);
    let familiaresLS = carregar(LS_FAMILIARES);

    // Inicializa contador com o total já persistido
    totalPessoas = idososLS.length + cuidadoresLS.length + familiaresLS.length;
    const contadorEl = document.querySelector('.titulos-cabecalho p');
    if (contadorEl) {
        contadorEl.textContent = `${totalPessoas} pessoa${totalPessoas !== 1 ? 's' : ''} cadastrada${totalPessoas !== 1 ? 's' : ''}`;
    }

    // ─────────────────────────────────────────
    // BLOCO IDOSO
    // ─────────────────────────────────────────

    const modalIdoso     = document.getElementById('modal-container-idoso');
    const btnAbrirIdoso  = document.getElementById('abrir-modal-idoso');
    const btnFecharIdoso = document.getElementById('fechar-modal-idoso');
    const secaoIdosos    = document.getElementById('idoso');

    let listaIdosos = secaoIdosos.querySelector('.lista-idosos');
    if (!listaIdosos) {
        listaIdosos = document.createElement('div');
        listaIdosos.className = 'lista-idosos';
        secaoIdosos.appendChild(listaIdosos);
    }

    function renderCardIdoso(idoso) {
        const tagsHTML = idoso.comorbidades
            ? idoso.comorbidades.split(',').map(c => `<span class="tag-comorbidade">${c.trim()}</span>`).join('')
            : '';
        const card = document.createElement('article');
        card.className = 'card-idoso';
        card.dataset.id = idoso.id;
        card.innerHTML = `
            <div class="card-idoso-avatar">
                <img src="assets/icons/idoso1.svg" alt="Avatar de ${idoso.nome}">
            </div>
            <div class="card-idoso-info">
                <strong class="card-idoso-nome">${idoso.nome}</strong>
                ${idoso.idadeTexto ? `<span class="card-idoso-idade">${idoso.idadeTexto}</span>` : ''}
                ${tagsHTML ? `<div class="card-idoso-comorbidades"><span class="label-comorbidades">Comorbidades</span><div class="tags">${tagsHTML}</div></div>` : ''}
            </div>
        `;
        listaIdosos.appendChild(card);
    }

    // Renderiza idosos salvos ao carregar a página
    if (idososLS.length > 0) {
        removerEstadoVazio(secaoIdosos);
        idososLS.forEach(renderCardIdoso);
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

                const nome         = formIdoso.querySelector('#nome').value.trim();
                const nascimento   = formIdoso.querySelector('#nascimento').value;
                const comorbidades = formIdoso.querySelector('#comorbidades').value.trim();
                const peso         = formIdoso.querySelector('#peso').value;
                const altura       = formIdoso.querySelector('#altura').value;

                if (!nome) return;

                const idade      = calcularIdade(nascimento);
                const idadeTexto = idade !== null ? `${idade} anos` : '';

                const novoIdoso = {
                    id: gerarId(),
                    nome,
                    nascimento,
                    comorbidades,
                    peso:   peso   ? Number(peso)   : null,
                    altura: altura ? Number(altura)  : null,
                    idadeTexto,
                };

                idososLS.push(novoIdoso);
                salvar(LS_IDOSOS, idososLS);

                removerEstadoVazio(secaoIdosos);
                renderCardIdoso(novoIdoso);
                atualizarContador(1);

                formIdoso.reset();
                modalIdoso.classList.remove('visivel');
            });
        }
    }

    // ─────────────────────────────────────────
    // BLOCO CUIDADOR
    // ─────────────────────────────────────────

    const modalCuidador     = document.getElementById('modal-container-cuidador');
    const btnAbrirCuidador  = document.getElementById('abrir-modal-cuidador');
    const btnFecharCuidador = document.getElementById('fechar-modal-cuidador');
    const secaoCuidadores   = document.getElementById('cuidador');

    let listaCuidadores = secaoCuidadores.querySelector('.lista-cuidadores');
    if (!listaCuidadores) {
        listaCuidadores = document.createElement('div');
        listaCuidadores.className = 'lista-cuidadores';
        secaoCuidadores.appendChild(listaCuidadores);
    }

    function renderCardCuidador(c) {
        const card = document.createElement('article');
        card.className = 'card-cuidador';
        card.innerHTML = `
            <div class="card-cuidador-topo">
                <img src="${c.avatar}" alt="Avatar de ${c.nome}" class="card-cuidador-avatar">
                <div class="card-cuidador-info">
                    <strong class="card-cuidador-nome">${c.nome}</strong>
                    ${c.idadeTexto ? `<span class="card-cuidador-idade">${c.idadeTexto}</span>` : ''}
                </div>
            </div>
            <ul class="card-cuidador-detalhes">
                ${c.turno ? `<li><span>Turno:</span> ${c.turno}</li>` : ''}
                ${c.dias  ? `<li><span>Escala:</span> ${c.dias}</li>`  : ''}
                <li><span>Possui CNH?</span> ${c.temCnh}</li>
            </ul>
            <div class="card-cuidador-id">Id: ${c.id}</div>
        `;
        listaCuidadores.appendChild(card);
    }

    // Renderiza cuidadores salvos ao carregar a página
    if (cuidadoresLS.length > 0) {
        removerEstadoVazio(secaoCuidadores);
        cuidadoresLS.forEach(renderCardCuidador);
    }

    // FIX: o modal de cuidador usa classe "modal-overlay-cuidador", não "modal-overlay".
    // O CSS existente controla visibilidade via .modal-overlay.visivel — precisamos
    // replicar esse comportamento usando display diretamente, pois a classe CSS é diferente.
    function abrirModalCuidador()  {
        if (!modalCuidador) return;
        modalCuidador.style.display = 'flex';
        modalCuidador.style.opacity = '1';
    }
    function fecharModalCuidador() {
        if (!modalCuidador) return;
        modalCuidador.style.display = 'none';
        modalCuidador.style.opacity = '0';
    }

    if (modalCuidador && btnAbrirCuidador && btnFecharCuidador) {
        btnAbrirCuidador.addEventListener('click', abrirModalCuidador);
        btnFecharCuidador.addEventListener('click', fecharModalCuidador);
        window.addEventListener('click', (e) => {
            if (e.target === modalCuidador) fecharModalCuidador();
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

                const idade      = calcularIdade(nascimento);
                const idadeTexto = idade !== null ? `${idade} anos` : '';
                const id         = gerarId();
                const temCnh     = cnh ? 'Sim.' : 'Não.';
                const avatar     = avatarAleatorio(['assets/icons/cuidador1.svg', 'assets/icons/cuidador2.svg']);

                const novoCuidador = { id, nome, nascimento, turno, dias, temCnh, idadeTexto, avatar };

                cuidadoresLS.push(novoCuidador);
                salvar(LS_CUIDADORES, cuidadoresLS);

                removerEstadoVazio(secaoCuidadores);
                renderCardCuidador(novoCuidador);
                atualizarContador(1);

                // Limpa campos
                ['#nome-cuidador','#nascimento-cuidador','#turno','#dias',
                 '#cnh','#cpf-cuidador','#tel-cuidador','#cod-cuidador'].forEach(sel => {
                    const el = modalCuidador.querySelector(sel);
                    if (el) el.value = '';
                });

                fecharModalCuidador();
            });
        }
    }

    // ─────────────────────────────────────────
    // BLOCO FAMILIAR
    // ─────────────────────────────────────────

    const modalFamiliar     = document.getElementById('modalFamiliar');
    const btnAbrirFamiliar  = document.getElementById('abrirModal');
    const btnFecharFamiliar = document.getElementById('fecharModal');
    const secaoFamiliares   = document.getElementById('familiar');

    let listaFamiliares = secaoFamiliares.querySelector('.lista-familiares');
    if (!listaFamiliares) {
        listaFamiliares = document.createElement('div');
        listaFamiliares.className = 'lista-familiares';
        secaoFamiliares.appendChild(listaFamiliares);
    }

    function renderCardFamiliar(f) {
        // Remove avatar estático hardcoded do HTML na primeira vez
        secaoFamiliares.querySelector('section')?.remove();

        const pilula = document.createElement('div');
        pilula.className = `card-familiar ${f.isAdmin ? 'familiar-admin' : 'familiar-observador'}`;
        pilula.innerHTML = `
            <img src="${f.avatar}" alt="Avatar de ${f.nome}" class="card-familiar-avatar">
            <div class="card-familiar-info">
                <strong>${f.nome}</strong>
                <span>${f.parentesco || (f.isAdmin ? 'Administrador' : 'Observador')}</span>
            </div>
        `;
        listaFamiliares.appendChild(pilula);
    }

    // Renderiza familiares salvos ao carregar a página
    if (familiaresLS.length > 0) {
        // Remove o bloco estático do HTML antes de renderizar os salvos
        secaoFamiliares.querySelector('section')?.remove();
        familiaresLS.forEach(renderCardFamiliar);
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

                const isAdmin = acesso.includes('admin');
                const avatar  = avatarAleatorio([
                    'assets/icons/familiar1.svg',
                    'assets/icons/familiar2.svg',
                    'assets/icons/familiar3.svg'
                ]);

                const novoFamiliar = { id: gerarId(), nome, parentesco, isAdmin, avatar };

                familiaresLS.push(novoFamiliar);
                salvar(LS_FAMILIARES, familiaresLS);

                renderCardFamiliar(novoFamiliar);
                atualizarContador(1);

                formFamiliar.reset();
                modalFamiliar.close();
            });
        }
    }

});