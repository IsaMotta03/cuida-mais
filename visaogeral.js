'use strict';

/* =============================================
   visaogeral.js — Cuida+
============================================= */

function lerStorage(chave, fallback) {
    try {
        const raw = localStorage.getItem(chave);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
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
   CHIP DO IDOSO
============================================= */
function carregarChipIdoso() {
    const lista = lerStorage('cuida_idosos', []);
    const idoso = lista[0];

    const chipEl  = document.getElementById('chipIdoso');
    const nomeEl  = document.getElementById('chipIdosoNome');
    const idadeEl = document.getElementById('chipIdosoIdade');

    if (!idoso || !idoso.nome) { chipEl.hidden = true; return; }

    nomeEl.textContent = idoso.nome;

    if (idoso.nascimento) {
        const hoje = new Date(), nasc = new Date(idoso.nascimento);
        let idade = hoje.getFullYear() - nasc.getFullYear();
        const m = hoje.getMonth() - nasc.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
        idadeEl.textContent = `${idade} anos`;
    }

    chipEl.hidden = false;
}

/* =============================================
   CHECKLIST
============================================= */
const CHAVE_CHECKS = 'cuida_checks';

function carregarChecklist() {
    const checks = lerStorage(CHAVE_CHECKS, []);
    const lista  = document.getElementById('vg-checkLista');
    if (!lista) return;
    lista.innerHTML = '';
    checks.forEach(c => lista.appendChild(criarItemCheck(c)));
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
        </div>`;
    li.querySelector('.check-item__input').addEventListener('change', e => alternarCheck(check.id, e.target.checked));
    li.querySelector('.check-item__btn-remover').addEventListener('click', () => removerCheck(check.id));
    return li;
}

function alternarCheck(id, concluido) {
    const checks = lerStorage(CHAVE_CHECKS, []).map(c => c.id === id ? { ...c, concluido } : c);
    salvarStorage(CHAVE_CHECKS, checks);
    carregarChecklist();
}

function removerCheck(id) {
    const checks = lerStorage(CHAVE_CHECKS, []).filter(c => c.id !== id);
    salvarStorage(CHAVE_CHECKS, checks);
    carregarChecklist();
}

function atualizarContadoresCheck() {
    const checks = lerStorage(CHAVE_CHECKS, []);
    const total = checks.length, concluidas = checks.filter(c => c.concluido).length;
    const elTotal  = document.getElementById('vg-checkTotal');
    const elConc   = document.getElementById('vg-checkConcluidas');
    const elRepeat = document.getElementById('vg-checkTotalRepeat');
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
    document.getElementById('vg-modalCheck')?.classList.remove('visivel');
}

function salvarCheck() {
    const inputTexto = document.getElementById('vg-checkTexto');
    if (!inputTexto) return;
    const texto = inputTexto.value.trim();
    if (!texto) return;
    const checks = lerStorage(CHAVE_CHECKS, []);
    checks.push({ id: gerarId(), texto, concluido: false });
    salvarStorage(CHAVE_CHECKS, checks);
    fecharModalCheck();
    carregarChecklist();
}

/* =============================================
   MEDICAMENTOS
============================================= */
const CHAVE_MEDS = 'cuida_medicamentos';

function carregarMedicamentosGrid() {
    const meds  = lerStorage(CHAVE_MEDS, []);
    const grid  = document.getElementById('vg-medGrid');
    const vazio = document.getElementById('vg-medVazio');
    if (!grid) return;
    grid.innerHTML = '';
    if (meds.length === 0) { vazio.style.display = 'flex'; grid.style.display = 'none'; return; }
    vazio.style.display = 'none'; grid.style.display = 'grid';
    [...meds].reverse().forEach(med => {
        const chipsHTML = (med.horarios || []).map(h => `<span class="med-chip-horario med-chip-horario--card">${h}</span>`).join('');
        const card = document.createElement('div');
        card.className = 'med-card vg-med-card';
        card.innerHTML = `
            <div class="med-card-icone"><img src="./assets/icons/Pill.png" alt="Remédio" class="icone-med"></div>
            <div class="med-card-info">
                <strong class="med-card-nome">${escapeHtml(med.nome)}</strong>
                <span class="med-card-sub">Dosagem: ${escapeHtml(med.dosagem || '—')}</span>
                <span class="med-card-sub">Frequência: ${escapeHtml(med.recorrencia || '—')}</span>
                <div class="med-card-horarios">${chipsHTML}</div>
            </div>`;
        grid.appendChild(card);
    });
}

/* =============================================
   CONSULTAS
   Lê 'cuidamais_consultas', mostra próximas a partir de hoje.
============================================= */
const CHAVE_CONSULTAS = 'cuidamais_consultas';
const CATEGORIAS_COR = {
    emergencia: '#E07B7B', consulta: '#2E2E48', exame: '#80CEF4',
    consulta_rotina: '#E8C97A', exame_rotina: '#CBDD98',
};

function carregarConsultasVG() {
    const corpo = document.querySelector('.vg-consultas-corpo');
    if (!corpo) return;

    const todas = lerStorage(CHAVE_CONSULTAS, []).map(c => ({ ...c, data: new Date(c.data) }));
    const hoje  = new Date(); hoje.setHours(0, 0, 0, 0);

    const proximas = todas
        .filter(c => { const d = new Date(c.data); d.setHours(0,0,0,0); return d >= hoje; })
        .sort((a, b) =>
            new Date(a.data).setHours(a.hora, a.minuto) - new Date(b.data).setHours(b.hora, b.minuto)
        )
        .slice(0, 5);

    if (proximas.length === 0) {
        corpo.innerHTML = `
            <div class="vg-vazio">
                <img src="assets/icons/sino.svg" alt="Sino">
                <h3>Nenhuma consulta</h3>
                <p>Cadastre consultas para vê-las aqui.</p>
            </div>`;
        return;
    }

    corpo.innerHTML = '';
    proximas.forEach(c => {
        const cor    = CATEGORIAS_COR[c.categoria] || CATEGORIAS_COR.consulta;
        const dataFmt = new Date(c.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
        const item   = document.createElement('div');
        item.className = 'vg-consulta-item';
        item.innerHTML = `
            <span class="vg-consulta-cor" style="background:${cor}"></span>
            <div class="vg-consulta-info">
                <strong class="vg-consulta-nome">${escapeHtml(c.especialidade)}</strong>
                ${c.profissional ? `<span class="vg-consulta-sub">${escapeHtml(c.profissional)}</span>` : ''}
                ${c.hospital     ? `<span class="vg-consulta-sub">${escapeHtml(c.hospital)}</span>`     : ''}
            </div>
            <div class="vg-consulta-data">
                <span class="vg-consulta-dia">${dataFmt}</span>
                <span class="vg-consulta-hora">${escapeHtml(c.horarioLabel)}</span>
            </div>`;
        corpo.appendChild(item);
    });
}

/* =============================================
   INDICADORES DE SAÚDE
============================================= */
function carregarIndicadoresSaude() {
    const dadosSaude       = lerStorage('dados_saude_inputs', {});
    const corpoIndicadores = document.querySelector('.vg-indicadores-corpo');
    if (!corpoIndicadores) return;

    const pressao     = escapeHtml(dadosSaude.pressao     || '—');
    const glicose     = escapeHtml(dadosSaude.glicose     || '—');
    const temperatura = escapeHtml(dadosSaude.temperatura || '—');

    corpoIndicadores.innerHTML = `
        <div class="indicador-item-card indicador-item-card--topo indicador-card--batimentos">
            <div class="indicador-header"><span>🫀</span><span>Pressão Arterial</span></div>
            <div class="indicador-valor">${pressao} <span>mmHg</span></div>
        </div>
        <div class="indicador-item-card indicador-item-card--topo indicador-card--glicose">
            <div class="indicador-header"><span>🩸</span><span>Glicose</span></div>
            <div class="indicador-valor">${glicose} <span>mg/dL</span></div>
        </div>
        <div class="indicador-item-card indicador-card--colesterol">
            <div class="indicador-header"><span>🌡️</span><span>Temperatura</span></div>
            <div class="indicador-valor">${temperatura} <span>°C</span></div>
        </div>`;
}

/* =============================================
   RELATÓRIO: HUMOR + NOTAS
   Humor: exibe um card visual igual ao btn-humor-card do acompanhamento,
   mostrando apenas o humor selecionado.
============================================= */
const MAPA_HUMOR = {
    feliz:      { emoji: 'assets/icons/feliz.svg',      label: 'Feliz'      },
    neutro:     { emoji: 'assets/icons/neutro.svg',     label: 'Neutro'     },
    triste:     { emoji: 'assets/icons/triste.svg',     label: 'Triste'     },
    depressivo: { emoji: 'assets/icons/depressivo.svg', label: 'Depressivo' },
};

function carregarRelatorioSincronizado() {
    // ── Humor ──────────────────────────────────────
    const humorSalvo = lerStorage('relatorio_humor_atual', null);
    const elHumor    = document.getElementById('vg-relatorio-humor');

    if (elHumor) {
        const h = MAPA_HUMOR[humorSalvo];
        if (h) {
            // Card visual com o mesmo estilo de btn-humor-card.ativo
            elHumor.innerHTML = `
                <div class="vg-humor-card-ativo">
                    <img src="${h.emoji}" alt="${h.label}" onerror="this.style.display='none'">
                    <span>${h.label}</span>
                </div>`;
        } else {
            elHumor.innerHTML = `<span class="vg-humor-nao-registrado">— Não registrado</span>`;
        }
    }

    // ── Notas ──────────────────────────────────────
    const notas          = lerStorage('cuida_notas', lerStorage('cuida_notes', []));
    const containerNotas = document.getElementById('vg-lista-notas-painel');
    if (!containerNotas) return;
    containerNotas.innerHTML = '';

    if (notas.length === 0) {
        containerNotas.innerHTML = `<p class="vg-notas-vazio">Nenhuma nota ou observação registrada.</p>`;
        return;
    }

    [...notas].reverse().forEach(nota => {
        const div     = document.createElement('div');
        div.className = 'vg-nota-item-feed';
        const autor   = nota.autor ? `Por: ${escapeHtml(nota.autor)}` : 'Autor não informado';
        const dataStr = nota.data  ? new Date(nota.data).toLocaleDateString('pt-BR') : '';
        div.innerHTML = `
            <div class="nota-texto">${escapeHtml(nota.texto)}</div>
            <div class="nota-meta">
                <span><strong>${autor}</strong></span>
                <span>${dataStr}</span>
            </div>`;
        containerNotas.appendChild(div);
    });
}

/* =============================================
   INICIALIZAÇÃO
============================================= */
document.addEventListener('DOMContentLoaded', () => {
    carregarChipIdoso();
    carregarChecklist();
    carregarMedicamentosGrid();
    carregarIndicadoresSaude();
    carregarRelatorioSincronizado();
    carregarConsultasVG();

    document.getElementById('vg-btnAdicionarCheck')?.addEventListener('click', abrirModalCheck);
    document.getElementById('vg-btnFecharCheck')?.addEventListener('click', fecharModalCheck);
    document.getElementById('vg-btnSalvarCheck')?.addEventListener('click', salvarCheck);
    document.getElementById('vg-modalCheck')?.addEventListener('click', e => {
        if (e.target.id === 'vg-modalCheck') fecharModalCheck();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModalCheck(); });
});