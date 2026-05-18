'use strict';

/* =============================================
   UTILITÁRIOS
   ============================================= */

/**
 * Lê um valor do localStorage e faz o parse de JSON.
 * Retorna `fallback` em caso de erro ou ausência.
 * @param {string} chave
 * @param {*} fallback
 */
function lerStorage(chave, fallback) {
    try {
        const raw = localStorage.getItem(chave);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

/**
 * Serializa e salva um valor no localStorage.
 * @param {string} chave
 * @param {*} valor
 */
function salvarStorage(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

/** Gera um ID único simples baseado em timestamp + random. */
function gerarId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* =============================================
   CHIP DO IDOSO (header)
   ============================================= */

/**
 * Tenta carregar o idoso cadastrado na área de Pessoas.
 * A chave usada em pessoas.js é 'cuida_idoso' (ajuste se diferente).
 * O objeto esperado: { nome, idade, foto? }
 */
function carregarChipIdoso() {
    const chave = 'cuida_idosos';
    const lista = lerStorage(chave, []);
    const idoso = lista[0]; // pega o primeiro cadastrado

    if (!idoso || !idoso.nome) return;

    const chipEl  = document.getElementById('chipIdoso');
    const nomeEl  = document.getElementById('chipIdosoNome');
    const idadeEl = document.getElementById('chipIdosoIdade');
    const fotoEl  = document.getElementById('chipIdosoFoto');

    nomeEl.textContent = idoso.nome;

    if (idoso.nascimento) {
        const hoje = new Date();
        const nasc = new Date(idoso.nascimento);
        const idade = hoje.getFullYear() - nasc.getFullYear();
        idadeEl.textContent = `${idade} anos`;
    }

    fotoEl.src = 'assets/icons/idoso1.svg';

    chipEl.hidden = false;
}

/* =============================================
   GALERIA DE FOTOS
   ============================================= */

const CHAVE_GALERIA = 'cuida_galeria';

function carregarGaleria() {
    const fotos = lerStorage(CHAVE_GALERIA, []);
    const grid  = document.getElementById('galeriaGrid');
    const vazio = document.getElementById('galeriaVazia');

    grid.innerHTML = '';

    const temFotos = fotos.length > 0;
    vazio.hidden = temFotos;
    grid.hidden  = !temFotos;

    fotos.forEach(foto => {
        grid.appendChild(criarItemGaleria(foto));
    });
}

/**
 * Cria um <li> com a foto e botão de remoção.
 * @param {{ id: string, src: string, alt: string }} foto
 */
function criarItemGaleria(foto) {
    const li  = document.createElement('li');
    li.className    = 'galeria-item';
    li.dataset.id   = foto.id;

    const img = document.createElement('img');
    img.src   = foto.src;
    img.alt   = foto.alt || 'Foto do acompanhamento';
    img.className = 'galeria-item__img';

    const btnRemover = document.createElement('button');
    btnRemover.className   = 'galeria-item__remover';
    btnRemover.textContent = '×';
    btnRemover.title       = 'Remover foto';
    btnRemover.setAttribute('aria-label', 'Remover foto');
    btnRemover.addEventListener('click', () => removerFoto(foto.id));

    li.append(img, btnRemover);
    return li;
}

function removerFoto(id) {
    const fotos = lerStorage(CHAVE_GALERIA, []).filter(f => f.id !== id);
    salvarStorage(CHAVE_GALERIA, fotos);
    carregarGaleria();
}

/** Converte File em base64 via FileReader. */
function lerArquivoComoBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

async function adicionarFoto(file) {
    if (!file) return;
    try {
        const src   = await lerArquivoComoBase64(file);
        const fotos = lerStorage(CHAVE_GALERIA, []);
        fotos.push({ id: gerarId(), src, alt: file.name });
        salvarStorage(CHAVE_GALERIA, fotos);
        carregarGaleria();
    } catch (err) {
        console.error('Erro ao adicionar foto:', err);
    }
}

function inicializarGaleria() {
    const btnAdicionar = document.getElementById('btnAdicionarFoto');
    const inputFoto    = document.getElementById('inputFoto');

    btnAdicionar.addEventListener('click', () => inputFoto.click());
    inputFoto.addEventListener('change', e => {
        const file = e.target.files[0];
        adicionarFoto(file);
        // Reseta o input para permitir re-upload do mesmo arquivo
        inputFoto.value = '';
    });

    carregarGaleria();
}

/* =============================================
   NOTAS
   ============================================= */

const CHAVE_NOTAS = 'cuida_notas';

function carregarNotas() {
    const notas = lerStorage(CHAVE_NOTAS, []);
    const lista = document.getElementById('notasLista');
    const vazio = document.getElementById('notasVazio');

    lista.innerHTML = '';

    if (notas.length === 0) {
        vazio.hidden = false;
        lista.hidden = true;
        return;
    }

    vazio.hidden = true;
    lista.hidden = false;

    notas.forEach(nota => {
        lista.appendChild(criarItemNota(nota));
    });
}

/**
 * @param {{ id: string, titulo: string, texto: string, autor: string }} nota
 */
function criarItemNota(nota) {
    const li = document.createElement('li');
    li.className  = 'nota-card';
    li.dataset.id = nota.id;

    li.innerHTML = `
        <header class="nota-card__cabecalho">
            <strong class="nota-card__titulo">${escapeHtml(nota.titulo)}</strong>
            <button class="nota-card__remover" title="Remover nota" aria-label="Remover nota">×</button>
        </header>
        <p class="nota-card__texto">${escapeHtml(nota.texto)}</p>
        <footer class="nota-card__rodape">– ${escapeHtml(nota.autor || 'Cuidador')}</footer>
    `;

    li.querySelector('.nota-card__remover')
      .addEventListener('click', () => removerNota(nota.id));

    return li;
}

function removerNota(id) {
    const notas = lerStorage(CHAVE_NOTAS, []).filter(n => n.id !== id);
    salvarStorage(CHAVE_NOTAS, notas);
    carregarNotas();
}

function abrirModalNota() {
    document.getElementById('notaTitulo').value = '';
    document.getElementById('notaTexto').value  = '';
    document.getElementById('notaAutor').value  = '';
    abrirModal('modalNota');
}

function salvarNota() {
    const titulo = document.getElementById('notaTitulo').value.trim();
    const texto  = document.getElementById('notaTexto').value.trim();
    const autor  = document.getElementById('notaAutor').value.trim();

    if (!titulo && !texto) return; // nada a salvar

    const notas = lerStorage(CHAVE_NOTAS, []);
    notas.push({ id: gerarId(), titulo: titulo || 'Sem título', texto, autor });
    salvarStorage(CHAVE_NOTAS, notas);

    fecharModal('modalNota');
    carregarNotas();
}

function inicializarNotas() {
    document.getElementById('btnAdicionarNota')
        .addEventListener('click', abrirModalNota);

    document.getElementById('btnFecharNota')
        .addEventListener('click', () => fecharModal('modalNota'));

    document.getElementById('btnSalvarNota')
        .addEventListener('click', salvarNota);

    carregarNotas();
}

/* =============================================
   CHECKLIST DIÁRIO
   ============================================= */

const CHAVE_CHECKS = 'cuida_checks';

function carregarChecklist() {
    const checks = lerStorage(CHAVE_CHECKS, []);
    const lista  = document.getElementById('checkLista');

    lista.innerHTML = '';

    checks.forEach(check => {
        lista.appendChild(criarItemCheck(check));
    });

    atualizarContadores();
}

/**
 * @param {{ id: string, texto: string, concluido: boolean }} check
 */
function criarItemCheck(check) {
    const li = document.createElement('li');
    li.className  = `check-item${check.concluido ? ' check-item--concluido' : ''}`;
    li.dataset.id = check.id;

    const labelId = `check-label-${check.id}`;

    li.innerHTML = `
        <label class="check-item__label" for="${labelId}">
            <input
                type="checkbox"
                id="${labelId}"
                class="check-item__input"
                ${check.concluido ? 'checked' : ''}
                aria-label="${escapeHtml(check.texto)}"
            >
            <span class="check-item__texto">${escapeHtml(check.texto)}</span>
        </label>
        <div class="check-item__acoes">
            <button class="check-item__btn-remover" title="Remover" aria-label="Remover tarefa">
                x
            </button>
        </div>
    `;

    li.querySelector('.check-item__input')
      .addEventListener('change', e => alternarCheck(check.id, e.target.checked));

    li.querySelector('.check-item__btn-remover')
      .addEventListener('click', () => removerCheck(check.id));

    return li;
}

function alternarCheck(id, concluido) {
    const checks = lerStorage(CHAVE_CHECKS, []).map(c =>
        c.id === id ? { ...c, concluido } : c
    );
    salvarStorage(CHAVE_CHECKS, checks);
    carregarChecklist();
}

function removerCheck(id) {
    const checks = lerStorage(CHAVE_CHECKS, []).filter(c => c.id !== id);
    salvarStorage(CHAVE_CHECKS, checks);
    carregarChecklist();
}

function atualizarContadores() {
    const checks     = lerStorage(CHAVE_CHECKS, []);
    const total      = checks.length;
    const concluidas = checks.filter(c => c.concluido).length;

    document.getElementById('checkTotal').textContent       = total;
    document.getElementById('checkConcluidas').textContent  = concluidas;
    document.getElementById('checkTotalRepeat').textContent = total;
}

function abrirModalCheck() {
    document.getElementById('checkTexto').value = '';
    abrirModal('modalCheck');
}

function salvarCheck() {
    const texto = document.getElementById('checkTexto').value.trim();
    if (!texto) return;

    const checks = lerStorage(CHAVE_CHECKS, []);
    checks.push({ id: gerarId(), texto, concluido: false });
    salvarStorage(CHAVE_CHECKS, checks);

    fecharModal('modalCheck');
    carregarChecklist();
}

function inicializarChecklist() {
    document.getElementById('btnAdicionarCheck')
        .addEventListener('click', abrirModalCheck);

    document.getElementById('btnFecharCheck')
        .addEventListener('click', () => fecharModal('modalCheck'));

    document.getElementById('btnSalvarCheck')
        .addEventListener('click', salvarCheck);

    carregarChecklist();
}

/* =============================================
   CONTROLE DE MODAIS
   ============================================= */

function abrirModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('visivel');
}

function fecharModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('visivel');
}

/** Fecha qualquer modal ao clicar fora do cartão. */
function inicializarFechamentoModais() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) fecharModal(overlay.id);
        });
    });

    // Fecha modal com Esc
    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape') return;
        document.querySelectorAll('.modal-overlay.visivel').forEach(overlay => {
            fecharModal(overlay.id);
        });
    });
}

/* =============================================
   SEGURANÇA: escapeHtml
   ============================================= */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* =============================================
   RELATÓRIO GERAL: IMC, HUMOR E SAÚDE
   ============================================= */

/**
 * Carrega peso e altura do localStorage (cuida_idosos),
 * calcula o IMC e exibe na tela com base na tabela de idosos.
 */
function calcularEExibirIMC() {
    const listaIdosos = lerStorage('cuida_idosos', []);
    
    // Pega o primeiro idoso cadastrado da lista
    const idoso = listaIdosos[0]; 

    if (!idoso || !idoso.peso || !idoso.altura) {
        document.getElementById('relatorioPeso').textContent = '--';
        document.getElementById('relatorioAltura').textContent = '--';
        document.getElementById('relatorioIMC').textContent = '--';
        document.getElementById('relatorioClassificacao').textContent = 'Dados incompletos';
        return;
    }

    const peso = parseFloat(idoso.peso);
    let altura = parseFloat(idoso.altura);
    
    // CORREÇÃO CRUCIAL: Se a altura estiver armazenada em centímetros (ex: 167),
    // converte para metros (ex: 1.67) para o cálculo correto do IMC
    if (altura > 3) {
        altura = altura / 100;
    }

    // Atualiza os dados textuais na tela de Acompanhamento de forma limpa
    document.getElementById('relatorioPeso').textContent = peso.toFixed(1);
    document.getElementById('relatorioAltura').textContent = altura.toFixed(2);

    // Cálculo correto do IMC: peso / (altura em metros)²
    const imc = peso / (altura * altura);
    document.getElementById('relatorioIMC').textContent = imc.toFixed(1);

    // Classificação baseada na tabela de idosos (OPAS/Lipschitz) que você estruturou
    let classificacao = "";
    if (imc <= 22) {
        classificacao = "Baixo Peso";
    } else if (imc > 22 && imc < 27) {
        classificacao = "Adequado (Eutrofia)";
    } else {
        classificacao = "Sobrepeso";
    }

    document.getElementById('relatorioClassificacao').textContent = classificacao;
}

/**
 * Gerencia a seleção exclusiva de humor (apenas um verde por vez)
 */
function inicializarSelecaoHumor() {
    const botoesHumor = document.querySelectorAll('.btn-humor-card');

    // Recupera se já havia um humor salvo para o dia atual no localstorage (opcional)
    const humorSalvo = lerStorage('relatorio_humor_atual', null);
    if (humorSalvo) {
        const btnAtivo = document.querySelector(`.btn-humor-card[data-humor="${humorSalvo}"]`);
        if (btnAtivo) btnAtivo.classList.add('ativo');
    }

    botoesHumor.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove o ativo de todos os outros botões do grupo
            botoesHumor.forEach(b => b.classList.remove('ativo'));
            
            // Adiciona ativo apenas no que foi clicado
            btn.classList.add('ativo');
            
            // Salva a escolha do usuário
            salvarStorage('relatorio_humor_atual', btn.getAttribute('data-humor'));
        });
    });
}

function inicializarAlteracaoStatusSaude() {
    const inputBatimentos = document.getElementById('saudeBatimentos');
    const inputGlicose = document.getElementById('saudeGlicose');
    const inputColesterol = document.getElementById('saudeColesterol');

    if (!inputBatimentos || !inputGlicose || !inputColesterol) return;

    // 1. Carrega os valores já salvos anteriormente para o usuário ver ao abrir a página
    const dadosSalvos = lerStorage('dados_saude_inputs', null);
    if (dadosSalvos) {
        if (dadosSalvos.batimentos) inputBatimentos.value = dadosSalvos.batimentos;
        if (dadosSalvos.glicose) inputGlicose.value = dadosSalvos.glicose;
        if (dadosSalvos.colesterol) inputColesterol.value = dadosSalvos.colesterol;
    }

    // 2. Função interna que captura os valores atuais e salva no localStorage
    function salvarValoresAtuais() {
        const dadosParaSalvar = {
            batimentos: inputBatimentos.value.trim(),
            glicose: inputGlicose.value.trim(),
            colesterol: inputColesterol.value.trim()
        };
        salvarStorage('dados_saude_inputs', dadosParaSalvar);
    }

    // 3. Salva automaticamente sempre que o usuário mudar o valor de qualquer campo
    inputBatimentos.addEventListener('change', salvarValoresAtuais);
    inputGlicose.addEventListener('change', salvarValoresAtuais);
    inputColesterol.addEventListener('change', salvarValoresAtuais);
    
    // Também salva se o usuário estiver digitando ativamente
    inputBatimentos.addEventListener('input', salvarValoresAtuais);
    inputGlicose.addEventListener('input', salvarValoresAtuais);
    inputColesterol.addEventListener('input', salvarValoresAtuais);
}
/* =============================================
   INICIALIZAÇÃO GERAL
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    carregarChipIdoso();
    inicializarGaleria();
    inicializarNotas();
    inicializarChecklist();
    inicializarFechamentoModais();
    inicializarSelecaoHumor();
    calcularEExibirIMC();
    inicializarAlteracaoStatusSaude();

});