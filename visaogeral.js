'use strict';

/* =============================================
   visaogeral.js — Cuida+ (Versão Corrigida)
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

    const chipEl = document.getElementById('chipIdoso');
    const nomeEl = document.getElementById('chipIdosoNome');
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
   CHECKLIST (TAREFAS)
============================================= */
const CHAVE_CHECKS = 'cuida_checks';

function carregarChecklist() {
    const checks = lerStorage(CHAVE_CHECKS, []);
    const lista = document.getElementById('vg-checkLista');
    if (!lista) return;
    lista.innerHTML = '';
    checks.forEach(c => lista.appendChild(criarItemCheck(c)));
    atualizarContadoresCheck();
}

function criarItemCheck(check) {
    const li = document.createElement('li');
    li.className = `check-item${check.concluido ? ' check-item--concluido' : ''}`;
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
    const elTotal = document.getElementById('vg-checkTotal');
    const elConc = document.getElementById('vg-checkConcluidas');
    const elRepeat = document.getElementById('vg-checkTotalRepeat');
    if (elTotal) elTotal.textContent = total;
    if (elConc) elConc.textContent = concluidas;
    if (elRepeat) elRepeat.textContent = total;
}

function abrirModalCheck() {
    const inputTexto = document.getElementById('vg-checkTexto');
    if (inputTexto) inputTexto.value = '';
    document.getElementById('vg-modalCheck')?.classList.add('visivel');
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
   MEDICAMENTOS DIÁRIOS
============================================= */
const CHAVE_MEDS = 'cuida_medicamentos';
let horariosTemp = [];

function carregarMedicamentosGrid() {
    const meds = lerStorage(CHAVE_MEDS, []);
    const grid = document.getElementById('vg-medGrid');
    const vazio = document.getElementById('vg-medVazio');
    const conteudoLayout = document.getElementById('vg-medConteudo');
    const txtProgresso = document.getElementById('vg-med-txt-progresso');
    const circuloProgresso = document.getElementById('vg-medCirculoProgresso');
    
    if (!grid) return;
    grid.innerHTML = '';
    
    if (meds.length === 0) {
        vazio.style.display = 'flex';
        conteudoLayout.style.display = 'none';
        if (txtProgresso) txtProgresso.textContent = "0/0";
        if (circuloProgresso) circuloProgresso.style.background = `conic-gradient(#e2e8f0 0deg, #e2e8f0 360deg)`;
        return;
    }
    
    vazio.style.display = 'none';
    conteudoLayout.style.display = 'flex';
    
    let tomadosCount = 0;
    const hojeStr = new Date().toDateString();
    
    [...meds].reverse().forEach((med) => {
        const jaTomouHoje = (med.comprovantes || []).some(comp => new Date(comp.dataHora).toDateString() === hojeStr);
        if (jaTomouHoje) tomadosCount++;
        
        const card = document.createElement('div');
        card.className = `vg-med-card ${jaTomouHoje ? 'med-card--tomado-hoje' : ''}`;
        card.style.cursor = 'pointer';
        
        card.innerHTML = `
            <img src="./assets/icons/Pill.png" alt="Remédio" class="icone-med">
            <div class="med-card-info">
                <strong class="med-card-nome">${escapeHtml(med.nome)}</strong>
                <span class="med-card-sub">Dosagem: ${escapeHtml(med.dosagem || '—')}</span>
            </div>`;
            
        card.addEventListener('click', () => abrirModalComprovante(med));
        grid.appendChild(card);
    });

    if (txtProgresso) txtProgresso.textContent = `${tomadosCount}/${meds.length}`;
    if (circuloProgresso && meds.length > 0) {
        const graus = (tomadosCount / meds.length) * 360;
        circuloProgresso.style.background = `conic-gradient(#cbdd98 ${graus}deg, #f7fcff 0deg)`;
    }
}

function abrirModalComprovante(med) {
    document.getElementById('vg-compMedId').value = med.id || '';
    document.getElementById('vg-compNome').value = med.nome || '';
    document.getElementById('vg-compDosagem').value = med.dosagem || 'Não informada';
    document.getElementById('vg-compObsComp').value = '';
    document.getElementById('vg-compArquivoNome').textContent = '';
    document.getElementById('vg-compImagem').value = '';
    document.getElementById('vg-compVideo').value = '';
    document.getElementById('vg-modalComprovante')?.classList.add('visivel');
}

function fecharModalComprovante() {
    document.getElementById('vg-modalComprovante')?.classList.remove('visivel');
}

function salvarComprovante(e) {
    e.preventDefault();
    const medId = document.getElementById('vg-compMedId').value;
    if (!medId) return;

    let meds = lerStorage(CHAVE_MEDS, []);
    meds = meds.map(med => {
        if (med.id === medId) {
            med.comprovantes = med.comprovantes || [];
            med.comprovantes.push({
                dataHora: new Date().toISOString(),
                obs: document.getElementById('vg-compObsComp').value.trim(),
                arquivoNome: document.getElementById('vg-compImagem').files[0]?.name || document.getElementById('vg-compVideo').files[0]?.name || ""
            });
        }
        return med;
    });

    salvarStorage(CHAVE_MEDS, meds);
    fecharModalComprovante();
    carregarMedicamentosGrid();
}

/* =============================================
   MODAL: NOVO MEDICAMENTO (Lógica do Formulário)
============================================= */
function popularDrumCol(col, itens, valorPadrao) {
    if (!col) return;
    col.innerHTML = itens.map(v => `<div class="drum-item${v === valorPadrao ? ' ativo' : ''}" data-val="${v}">${v}</div>`).join('');
    col.querySelectorAll('.drum-item').forEach(el => {
        el.addEventListener('click', () => {
            col.querySelectorAll('.drum-item').forEach(x => x.classList.remove('ativo'));
            el.classList.add('ativo');
            // Correção de Scroll: 'nearest' impede a página inteira de tremer
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
    });
}

function buildDrum() {
    const horas = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutos = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
    popularDrumCol(document.getElementById('drumHoras'), horas, '09');
    popularDrumCol(document.getElementById('drumMinutos'), minutos, '00');
    popularDrumCol(document.getElementById('drumPeriodo'), ['AM', 'PM'], 'AM');
}

function getDrumValor(colId) {
    return document.getElementById(colId)?.querySelector('.drum-item.ativo')?.dataset.val || null;
}

function lerHorarioAtual() {
    const h = getDrumValor('drumHoras') || '09';
    const m = getDrumValor('drumMinutos') || '00';
    const p = getDrumValor('drumPeriodo') || 'AM';
    let horas = parseInt(h, 10);
    if (p === 'PM' && horas !== 12) horas += 12;
    if (p === 'AM' && horas === 12) horas = 0;
    return `${String(horas).padStart(2, '0')}:${m}`;
}

function renderChips() {
    const container = document.getElementById('horariosChips');
    if (!container) return;
    container.innerHTML = '';
    if (horariosTemp.length === 0) {
        container.innerHTML = '<span class="med-horarios-vazio">Nenhum horário adicionado</span>';
        return;
    }
    horariosTemp.forEach((h, idx) => {
        const chip = document.createElement('span');
        chip.className = 'med-chip-horario';
        chip.innerHTML = `${h} <button type="button" aria-label="Remover ${h}" data-idx="${idx}">×</button>`;
        chip.querySelector('button').addEventListener('click', () => {
            horariosTemp.splice(idx, 1);
            renderChips();
        });
        container.appendChild(chip);
    });
}

function abrirModalNovoMed() {
    document.getElementById('formNovoMed')?.reset();
    horariosTemp = [];
    renderChips();
    const receitaNomeEl = document.getElementById('receitaNome');
    if (receitaNomeEl) receitaNomeEl.textContent = '';
    buildDrum();
    document.getElementById('modalNovoMed')?.classList.add('visivel');
    document.getElementById('medNome')?.focus();
}

function fecharModalNovoMed() {
    document.getElementById('modalNovoMed')?.classList.remove('visivel');
}

/* =============================================
   CONSULTAS
============================================= */
const CHAVE_CONSULTAS = 'cuidamais_consultas';

function carregarConsultasVG() {
    const corpo = document.querySelector('.vg-consultas-corpo');
    if (!corpo) return;

    const todas = lerStorage(CHAVE_CONSULTAS, []).map(c => ({ ...c, data: new Date(c.data) }));
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

    const proximas = todas
        .filter(c => { const d = new Date(c.data); d.setHours(0, 0, 0, 0); return d >= hoje; })
        .sort((a, b) => new Date(a.data).setHours(a.hora, a.minuto) - new Date(b.data).setHours(b.hora, b.minuto))
        .slice(0, 3);

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
        const item = document.createElement('div');
        item.className = 'vg-consulta-item';
        item.innerHTML = `
            <div class="vg-consulta-cor">🩺</div>
            <div class="vg-consulta-info">
                <strong class="vg-consulta-nome">${escapeHtml(c.especialidade)}</strong>
                <span class="vg-consulta-sub">${escapeHtml(c.profissional || 'Médico não informado')}</span>
            </div>
            <div class="vg-consulta-data">
                <span class="vg-consulta-dia">${escapeHtml(c.horarioLabel.split(' ')[0] || '08:00')}</span>
                <span class="vg-consulta-hora">${escapeHtml(c.horarioLabel.split(' ')[1] || 'AM')}</span>
            </div>`;
        corpo.appendChild(item);
    });
}

/* =============================================
   INDICADORES DE SAÚDE
============================================= */
function carregarIndicadoresSaude() {
    const dadosSaude = lerStorage('dados_saude_inputs', {});
    const elPeso = document.getElementById('vg-ind-val-peso');
    const elGlicose = document.getElementById('vg-ind-val-glicose');
    const elTemperatura = document.getElementById('vg-ind-val-temperatura');

    if (elPeso && dadosSaude.peso) elPeso.textContent = `${dadosSaude.peso} Kg`;
    if (elGlicose && dadosSaude.glicose) elGlicose.textContent = dadosSaude.glicose;
    if (elTemperatura && dadosSaude.temperatura) elTemperatura.textContent = `${dadosSaude.temperatura} °C`;
}

/* =============================================
   RELATÓRIO: HUMOR + NOTAS
============================================= */
const MAPA_HUMOR = {
    feliz: { emoji: 'assets/icons/feliz.svg', label: 'Feliz' },
    neutro: { emoji: 'assets/icons/neutro.svg', label: 'Neutro' },
    triste: { emoji: 'assets/icons/triste.svg', label: 'Triste' },
    depressivo: { emoji: 'assets/icons/depressivo.svg', label: 'Depressivo' },
};

function carregarRelatorioSincronizado() {
    const humorSalvo = lerStorage('relatorio_humor_atual', null);
    const elHumor = document.getElementById('vg-relatorio-humor');

    if (elHumor) {
        const h = MAPA_HUMOR[humorSalvo];
        if (h) {
            elHumor.innerHTML = `
                <div class="vg-humor-card-ativo humor-${humorSalvo}" style="margin: 0; padding: 10px;">
                    <img src="${h.emoji}" alt="${h.label}" onerror="this.style.display='none'">
                    <span>${h.label}</span>
                </div>`;
        } else {
            elHumor.innerHTML = `<span class="vg-humor-nao-registrado" style="color: #afb9cf; font-size: 12px;">Não registrado</span>`;
        }
    }

    const notas = lerStorage('cuida_notas', lerStorage('cuida_notes', []));
    const containerNotas = document.getElementById('vg-lista-notas-painel');
    if (!containerNotas) return;
    containerNotas.innerHTML = '';

    if (notas.length === 0) {
        containerNotas.innerHTML = `<p class="vg-notas-vazio" style="font-size:12px; color:#b0b8c8; font-style:italic; padding-top:4px;">Nenhuma observação registrada.</p>`;
        return;
    }

    [...notas].reverse().forEach(nota => {
        const div = document.createElement('div');
        div.className = 'vg-nota-item-feed';
        const autor = nota.autor ? `Por: ${escapeHtml(nota.autor)}` : 'Autor não informado';
        const dataStr = nota.data ? new Date(nota.data).toLocaleDateString('pt-BR') : '';
        div.innerHTML = `
            <div class="nota-meta" style="font-size:11px; padding:3px 6px;">
                <span><strong>${autor}</strong></span>
                <span>${dataStr}</span>
            </div>
            <div class="nota-texto" style="font-size:12px; padding:4px 6px; max-height:65px;">${escapeHtml(nota.texto)}</div>`;
        containerNotas.appendChild(div);
    });
}

/* =============================================
   MENU HAMBÚRGUER 
============================================= */
function inicializarMenuHamb() {
  const btn      = document.getElementById('btnHamburguer');
  const gaveta   = document.getElementById('gavetaMobile');
  const overlay  = document.getElementById('overlayGaveta');
  const btnFechar = document.getElementById('btnFecharGaveta');

  if (!btn || !gaveta) return;

  function abrirGaveta() {
    gaveta.classList.add('aberta');
    if (overlay) overlay.classList.add('visivel');
    btn.classList.add('aberto');
    document.body.style.overflow = 'hidden';
  }

  function fecharGaveta() {
    gaveta.classList.remove('aberta');
    if (overlay) overlay.classList.remove('visivel');
    btn.classList.remove('aberto');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', abrirGaveta);
  btnFechar.addEventListener('click', fecharGaveta);
  if (overlay) overlay.addEventListener('click', fecharGaveta);
}

/* =============================================
   INICIALIZAÇÃO GERAL E EVENTOS GLOBAIS
============================================= */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Renderizar Painéis
    carregarChipIdoso();
    carregarChecklist();
    carregarMedicamentosGrid();
    carregarIndicadoresSaude();
    carregarRelatorioSincronizado();
    carregarConsultasVG();
    inicializarMenuHamb();

    // 2. Modais do Checklist
    document.getElementById('vg-btnAdicionarCheck')?.addEventListener('click', abrirModalCheck);
    document.getElementById('vg-btnFecharCheck')?.addEventListener('click', fecharModalCheck);
    document.getElementById('vg-btnSalvarCheck')?.addEventListener('click', salvarCheck);
    document.getElementById('vg-modalCheck')?.addEventListener('click', e => {
        if (e.target.id === 'vg-modalCheck') fecharModalCheck();
    });

    // 3. Modais do Registro de Medicamento
    document.getElementById('vg-btnAbrirModalMed')?.addEventListener('click', abrirModalNovoMed);
    document.getElementById('btnFecharModalMed')?.addEventListener('click', fecharModalNovoMed);
    document.getElementById('modalNovoMed')?.addEventListener('click', e => {
        if (e.target.id === 'modalNovoMed') fecharModalNovoMed();
    });

    document.getElementById('btnAddHorario')?.addEventListener('click', () => {
        const h = lerHorarioAtual();
        if (!horariosTemp.includes(h)) {
            horariosTemp.push(h);
            horariosTemp.sort();
            renderChips();
        }
    });

    document.getElementById('medReceita')?.addEventListener('change', (e) => {
        const receitaNomeEl = document.getElementById('receitaNome');
        if (receitaNomeEl) receitaNomeEl.textContent = e.target.files[0]?.name || "";
    });

    // Submeter Novo Medicamento
    document.getElementById('formNovoMed')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeInput = document.getElementById('medNome');
        const nome = nomeInput.value.trim();
        if (!nome) {
            nomeInput.classList.add('campo-erro');
            nomeInput.focus();
            return;
        }
        nomeInput.classList.remove('campo-erro');

        const meds = lerStorage(CHAVE_MEDS, []);
        meds.push({
            id: Date.now().toString(),
            nome,
            dosagem: document.getElementById('medDosagem').value.trim(),
            medico: document.getElementById('medMedico').value.trim(),
            cid: document.getElementById('medCid').value.trim(),
            recorrencia: document.getElementById('medRecorrencia').value || "Uso contínuo",
            obs: document.getElementById('medObs').value.trim(),
            horarios: [...horariosTemp],
            comprovantes: []
        });

        salvarStorage(CHAVE_MEDS, meds);
        carregarMedicamentosGrid();
        fecharModalNovoMed();
    });

    // 4. Modal Comprovante de Medicamento
    document.getElementById('vg-btnFecharComprovante')?.addEventListener('click', fecharModalComprovante);
    document.getElementById('vg-formComprovante')?.addEventListener('submit', salvarComprovante);
    document.getElementById('vg-modalComprovante')?.addEventListener('click', e => {
        if (e.target.id === 'vg-modalComprovante') fecharModalComprovante();
    });

    // Rastrear uploads
    const monitorarUploads = (idInput) => {
        document.getElementById(idInput)?.addEventListener('change', (e) => {
            const nome = e.target.files[0]?.name || '';
            const txtLabel = document.getElementById('vg-compArquivoNome');
            if (txtLabel && nome) txtLabel.textContent = `Selecionado: ${nome}`;
        });
    };
    monitorarUploads('vg-compImagem');
    monitorarUploads('vg-compVideo');

    // Fechar todos com ESC
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape') {
            fecharModalCheck();
            fecharModalNovoMed();
            fecharModalComprovante();
        } 
    });
});