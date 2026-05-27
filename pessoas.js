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
    // Insere antes do footer de legendas para manter a ordem visual correta
    const footerFamiliar = secaoFamiliares.querySelector('footer');
    if (footerFamiliar) {
        secaoFamiliares.insertBefore(listaFamiliares, footerFamiliar);
    } else {
        secaoFamiliares.appendChild(listaFamiliares);
    }
}

/* ==========================================================================
   AGORA SIM: Eventos para Abrir e Fechar o Modal
   ========================================================================== */
if (btnAbrirFamiliar && modalFamiliar) {
    btnAbrirFamiliar.addEventListener('click', () => {
        modalFamiliar.showModal(); // Abre o <dialog> de forma nativa
    });
}

if (btnFecharFamiliar && modalFamiliar) {
    btnFecharFamiliar.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que o formulário tente recarregar a página
        modalFamiliar.close(); // Fecha o <dialog> nativo
    });
}

function renderCardFamiliar(f) {
    const pilula = document.createElement('div');
    pilula.className = `card-familiar ${f.isAdmin ? 'familiar-admin' : 'familiar-observador'}`;
    pilula.innerHTML = `
        <img src="${f.avatar || 'assets/images/avatar.png'}" alt="Avatar de ${f.nome}" class="card-familiar-avatar">
        <div class="card-familiar-info">
            <strong>${f.nome}</strong>
            <span>${f.parentesco || (f.isAdmin ? 'Administrador' : 'Observador')}</span>
        </div>
    `;
    listaFamiliares.appendChild(pilula);
}

/* ==========================================================================
   NOVO: CAPTURA OS DADOS DO FORMULÁRIO E ADICIONA À TELA
   ========================================================================== */
const formularioFamiliar = modalFamiliar.querySelector('form.modal-caixa');

if (formularioFamiliar) {
    formularioFamiliar.addEventListener('submit', (e) => {
        e.preventDefault(); // Impede a página de recarregar e sumir os dados

        // 1. Pega os valores exatamente como estão nos IDs do HTML
        const nomeInput       = document.getElementById('nome-familiar').value.trim();
        const parentescoInput = document.getElementById('parentesco-familiar').value.trim();
        
        // .trim().toLowerCase() remove espaços e transforma tudo em minúsculo para facilitar a busca
        const acessoInput     = document.getElementById('acesso-familiar').value.trim().toLowerCase();

        // Validação básica para não salvar em branco
        if (!nomeInput) {
            alert('Por favor, digite o nome do familiar.');
            return;
        }

        // 2. LOGICA DA COR: Só será admin se a palavra digitada CONTIVER "admin". 
        // Se o usuário digitar "observador" ou "obs", vai dar 'false' e aplicará a cor azul.
        let ehAdmin = true;
        if (acessoInput.includes('observador') || acessoInput.includes('obs')) {
            ehAdmin = false;
        }

        // 3. Monta o objeto do novo familiar com o status correto
        const novoFamiliar = {
            id: `${Date.now()}`,
            nome: nomeInput,
            parentesco: parentescoInput,
            avatar: 'assets/images/avatar.png',
            isAdmin: ehAdmin // Passa o resultado da nossa verificação acima
        };

        // 4. Renderiza o novo card na tela na hora
        renderCardFamiliar(novoFamiliar);

        // 5. Salva no LocalStorage (caso a variável exista no seu projeto)
        if (typeof familiaresLS !== 'undefined') {
            familiaresLS.push(novoFamiliar);
            localStorage.setItem('cuida_familiares', JSON.stringify(familiaresLS));
        }

        // 6. Reseta os campos e fecha o modal de forma elegante
        formularioFamiliar.reset();
        modalFamiliar.close();
    });
}

// Renderiza familiares salvos ao carregar a página
if (typeof familiaresLS !== 'undefined' && familiaresLS.length > 0) {
    familiaresLS.forEach(renderCardFamiliar);
}
})