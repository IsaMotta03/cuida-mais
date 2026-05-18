'use strict';
 
/* =============================================
   visaogeral.js — Cuida+
   Lógica da página de Visão Geral
   Sincronizado com os dados do localStorage
============================================= */
 
/* ── Utilitários ── */
function lerStorage(chave, fallback) {
    try {
        const raw = localStorage.getItem(chave);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}
 
function salvarStorage(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}
 
function gerarId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
 
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
 
/* =============================================
   CHIP DO IDOSO NO CABEÇALHO
============================================= */
function carregarChipIdoso() {
    const lista = lerStorage('cuida_idosos', []);
    const idoso = lista[0];
 
    const chipEl  = document.getElementById('chipIdoso');
    const nomeEl  = document.getElementById('chipIdosoNome');
    const idadeEl = document.getElementById('chipIdosoIdade');
 
    if (!idoso || !idoso.nome) {
        chipEl.hidden = true;
        return;
    }
 
    nomeEl.textContent = idoso.nome;
 
    if (idoso.nascimento) {
        const hoje = new Date();
        const nasc = new Date(idoso.nascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        idadeEl.textContent = `${idade} anos`;
    }
 
    chipEl.hidden = false;
}
 
/* =============================================
   CHECKLIST DIÁRIO (lê/escreve cuida_checks)
============================================= */
const CHAVE_CHECKS = 'cuida_checks';
 
function carregarChecklist() {
    const checks = lerStorage(CHAVE_CHECKS, []);
    const lista  = document.getElementById('vg-checkLista');
    if (!lista) return;
 
    lista.innerHTML = '';
    checks.forEach(check => lista.appendChild(criarItemCheck(check)));
    atualizarContadoresCheck();
}
 
function criarItemCheck(check) {
    const li = document.createElement('li');
    li.className  = `check-item${check.concluido ? ' check-item--concluido' : ''}`;
    li.dataset.id = check.id;
    const labelId = `vg-check-${check.id}`;
 
    li.innerHTML = `
        <label class="check-item__label" for="${labelId}">
            <input type="checkbox" id="${labelId}" class="check-item__input"
                ${check.concluido ? 'checked' : ''} aria-label="${escapeHtml(check.texto)}">
            <span class="check-item__texto">${escapeHtml(check.texto)}</span>
        </label>
        <div class="check-item__acoes">
            <button class="check-item__btn-remover" title="Remover" aria-label="Remover tarefa">x</button>
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
 
function atualizarContadoresCheck() {
    const checks     = lerStorage(CHAVE_CHECKS, []);
    const total      = checks.length;
    const concluidas = checks.filter(c => c.concluido).length;
 
    const elTotal   = document.getElementById('vg-checkTotal');
    const elConc    = document.getElementById('vg-checkConcluidas');
    const elRepeat  = document.getElementById('vg-checkTotalRepeat');
 
    if (elTotal)  elTotal.textContent  = total;
    if (elConc)   elConc.textContent   = concluidas;
    if (elRepeat) elRepeat.textContent = total;
}
 
function abrirModalCheck() {
    const inputTexto = document.getElementById('vg-checkTexto');
    if (inputTexto) inputTexto.value = '';
    
    const modal = document.getElementById('vg-modalCheck');
    if (modal) modal.classList.add('visivel');
    
    if (inputTexto) inputTexto.focus();
}

function fecharModalCheck() {
    const modal = document.getElementById('vg-modalCheck');
    if (modal) modal.classList.remove('visivel');
}

function salvarCheck() {
    const inputTexto = document.getElementById('vg-checkTexto');
    if (!inputTexto) return;

    const texto = inputTexto.value.trim();
    if (!texto) return; // Não adiciona se estiver vazio

    // 1. Lê o que já existe no localStorage
    const checks = lerStorage(CHAVE_CHECKS, []);
    
    // 2. Adiciona a nova tarefa criada pelo modal da Visão Geral
    checks.push({ 
        id: gerarId(), 
        texto: texto, 
        concluido: false 
    });
    
    // 3. Salva de volta no localStorage
    salvarStorage(CHAVE_CHECKS, checks);
    
    // 4. Fecha o modal e atualiza a lista na tela na hora
    fecharModalCheck();
    carregarChecklist();
}
 
/* =============================================
   MEDICAMENTOS DIÁRIOS
============================================= */
const CHAVE_MEDS = 'cuida_medicamentos';
 
function carregarMedicamentosGrid() {
    const meds   = lerStorage(CHAVE_MEDS, []);
    const grid   = document.getElementById('vg-medGrid');
    const vazio  = document.getElementById('vg-medVazio');
    if (!grid) return;
 
    grid.innerHTML = '';
 
    if (meds.length === 0) {
        vazio.style.display = 'flex';
        grid.style.display = 'none';
        return;
    }
 
    vazio.style.display = 'none';
    grid.style.display = 'grid';
 
    const listaOrdenada = [...meds].reverse();
 
    listaOrdenada.forEach(med => {
        const chipsHTML = (med.horarios || [])
            .map(h => `<span class="med-chip-horario med-chip-horario--card">${h}</span>`)
            .join('');
 
        const card = document.createElement('div');
        card.className = 'med-card vg-med-card';
        card.innerHTML = `
            <div class="med-card-icone">
                <img src="./assets/icons/Pill.png" alt="Remédio" class="icone-med">
            </div>
            <div class="med-card-info">
                <strong class="med-card-nome">${escapeHtml(med.nome)}</strong>
                <span class="med-card-sub">Dosagem: ${escapeHtml(med.dosagem || '—')}</span>
                <span class="med-card-sub">Frequência: ${escapeHtml(med.recorrencia || '—')}</span>
                <div class="med-card-horarios">${chipsHTML}</div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* =============================================
   INDICADORES DE SAÚDE (Injeção Dinâmica da Foto)
============================================= */
function carregarIndicadoresSaude() {
    // Chave exata configurada no acompanhamentos.js
    const dadosSaude = lerStorage('dados_saude_inputs', { batimentos: '', glicose: '', colesterol: '' });
    const corpoIndicadores = document.querySelector('.vg-indicadores-corpo');
    
    if (!corpoIndicadores) return;

    // Resgata os valores individuais salvos ou define um traço se estiver vazio
    const bpm = dadosSaude.batimentos || '—';
    const glicose = dadosSaude.glicose || '—';
    const colesterol = dadosSaude.colesterol || '—';

    // Monta o conteúdo HTML aplicando exclusivamente as classes CSS do arquivo externo
    corpoIndicadores.innerHTML = `
        <div class="indicador-item-card indicador-item-card--topo indicador-card--batimentos">
            <div class="indicador-header">
                <span>❤️</span>
                <span>Batimentos</span>
            </div>
            <div class="indicador-valor">
                ${escapeHtml(bpm)} <span>bpm</span>
            </div>
        </div>

        <div class="indicador-item-card indicador-item-card--topo indicador-card--glicose">
            <div class="indicador-header">
                <span>🩸</span>
                <span>Glicose</span>
            </div>
            <div class="indicador-valor">
                ${escapeHtml(glicose)} <span>mg/dL</span>
            </div>
        </div>

        <div class="indicador-item-card indicador-card--colesterol">
            <div class="indicador-header">
                <span>🧪</span>
                <span>Colesterol Total</span>
            </div>
            <div class="indicador-valor">
                ${escapeHtml(colesterol)} <span>mg/dL</span>
            </div>
        </div>
    `;
}

function carregarRelatorioSincronizado() {
    // 1. Renderiza o Humor do Dia
    const humorSalvo = localStorage.getItem('cuida_humor_selecionado');
    const elHumor = document.getElementById('vg-relatorio-humor');
    
    const humores = [
        { emoji: '😢', texto: 'Triste' },
        { emoji: '🌤️', texto: 'Regular' },
        { emoji: '😊', texto: 'Bem' },
        { emoji: '😁', texto: 'Muito Bem' }
    ];

    if (elHumor) {
        if (humorSalvo !== null && humores[humorSalvo]) {
            const h = humores[humorSalvo];
            elHumor.innerHTML = `<span>${h.emoji}</span> <span>${h.texto}</span>`;
        } else {
            elHumor.innerHTML = `<span class="vg-notas-vazio">— Não registrado</span>`;
        }
    }

    // 2. Renderiza a lista de Notas
    const notas = lerStorage('cuida_notes', lerStorage('cuida_notas', [])); // Captura independente da variação da chave
    const containerNotas = document.getElementById('vg-lista-notas-painel');

    if (containerNotas) {
        containerNotas.innerHTML = '';

        if (notas.length === 0) {
            containerNotas.innerHTML = `<p class="vg-notas-vazio">Nenhuma nota ou observação registrada.</p>`;
            return;
        }

        // Exibe da mais nova para a mais antiga
        [...notas].reverse().forEach(nota => {
            const div = document.createElement('div');
            div.className = 'vg-nota-item-feed';
            
            const autor = nota.autor ? `Por: ${nota.autor}` : 'Autor não informado';
            const dataStr = nota.data ? new Date(nota.data).toLocaleDateString('pt-BR') : '';

            div.innerHTML = `
                <div class="nota-texto">${escapeHtml(nota.texto)}</div>
                <div class="nota-meta">
                    <span><strong>${escapeHtml(autor)}</strong></span>
                    <span>${dataStr}</span>
                </div>
            `;
            containerNotas.appendChild(div);
        });
    }
}
 
/* =============================================
   INICIALIZAÇÃO
============================================= */
document.addEventListener('DOMContentLoaded', () => {
    carregarChipIdoso();
    carregarChecklist();
    carregarMedicamentosGrid();
    if (typeof carregarIndicadoresSaude === 'function') {
        carregarIndicadoresSaude();
    }
    document.getElementById('vg-btnAdicionarCheck')
        ?.addEventListener('click', abrirModalCheck);
        
    document.getElementById('vg-btnFecharCheck')
        ?.addEventListener('click', fecharModalCheck);
        
    document.getElementById('vg-btnSalvarCheck')
        ?.addEventListener('click', salvarCheck);
 
    document.getElementById('vg-modalCheck')
        ?.addEventListener('click', e => {
            if (e.target.id === 'vg-modalCheck') fecharModalCheck();
        });
 
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') fecharModalCheck();
    });
});