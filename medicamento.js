/* =============================================
   medicamento.js — Cuida+
   Lógica completa da página de Medicamentos
============================================= */

'use strict';

/* ── Ícones SVG inline por tipo de medicamento ── */

const pillIcon = '<img src="./assets/icons/Pill.png" alt="Remédio" class="icone-med">';

const ICONES_MED = {
  comprimido: pillIcon,
  capsula: pillIcon,
  injecao: pillIcon,
};

function getIcone(nome) {
  return pillIcon;
}

/* ── Armazenamento ── */
const STORAGE_KEY = 'cuida_medicamentos';

function carregarMedicamentos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function salvarMedicamentos(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

/* ── Estado global ── */
let medicamentos = carregarMedicamentos();

/* ── Referências DOM ── */
const estadoVazio        = document.getElementById('estadoVazio');
const gridMedicamentos   = document.getElementById('gridMedicamentos');
const contadorEl         = document.getElementById('contadorMedicamentos');
const areaConteudo       = document.getElementById('areaConteudo');

// Modal novo medicamento
const modalNovoMed       = document.getElementById('modalNovoMed');
const btnAbrirModalMed   = document.getElementById('btnAbrirModalMed');
const btnFecharModalMed  = document.getElementById('btnFecharModalMed');
const formNovoMed        = document.getElementById('formNovoMed');

// Drum
const drumHoras          = document.getElementById('drumHoras');
const drumMinutos        = document.getElementById('drumMinutos');
const drumPeriodo        = document.getElementById('drumPeriodo');
const btnAddHorario      = document.getElementById('btnAddHorario');
const horariosChips      = document.getElementById('horariosChips');

// Receita
const medReceitaInput    = document.getElementById('medReceita');
const receitaNomeEl      = document.getElementById('receitaNome');

// Modal comprovante
const modalComprovante   = document.getElementById('modalComprovante');
const btnFecharComp      = document.getElementById('btnFecharComprovante');
const formComprovante    = document.getElementById('formComprovante');
const compImagem         = document.getElementById('compImagem');
const compVideo          = document.getElementById('compVideo');
const compArquivoNome    = document.getElementById('compArquivoNome');

/* ── Horários temporários (durante preenchimento do form) ── */
let horariosTemp = [];

/* ══════════════════════════════════════════
   DRUM PICKER
══════════════════════════════════════════ */
function buildDrum() {
  // Horas 1–12
  for (let h = 1; h <= 12; h++) {
    const el = document.createElement('div');
    el.className = 'drum-item';
    el.dataset.val = String(h).padStart(2, '0');
    el.textContent = String(h).padStart(2, '0');
    drumHoras.appendChild(el);
  }
  // Minutos 00–59
  for (let m = 0; m < 60; m++) {
    const el = document.createElement('div');
    el.className = 'drum-item';
    el.dataset.val = String(m).padStart(2, '0');
    el.textContent = String(m).padStart(2, '0');
    drumMinutos.appendChild(el);
  }

  ativarDrum(drumHoras,   '09');
  ativarDrum(drumMinutos, '00');
  ativarDrum(drumPeriodo, 'AM');
}

function ativarDrum(col, valPadrao) {
  const items = col.querySelectorAll('.drum-item');

  function ativar(el) {
    items.forEach(i => i.classList.remove('ativo'));
    el.classList.add('ativo');
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Ativa padrão
  const def = [...items].find(i => i.dataset.val === valPadrao);
  if (def) ativar(def);

  items.forEach(item => {
    item.addEventListener('click', () => ativar(item));
  });

  // Scroll → atualiza ativo
  col.addEventListener('scroll', () => {
    const centro = col.scrollTop + col.clientHeight / 2;
    let melhor = null, menorDist = Infinity;
    items.forEach(item => {
      const dist = Math.abs((item.offsetTop + item.offsetHeight / 2) - centro);
      if (dist < menorDist) { menorDist = dist; melhor = item; }
    });
    if (melhor) ativar(melhor);
  }, { passive: true });
}

function lerHorarioAtual() {
  const h = drumHoras.querySelector('.ativo')?.dataset.val   || '09';
  const m = drumMinutos.querySelector('.ativo')?.dataset.val || '00';
  const p = drumPeriodo.querySelector('.ativo')?.dataset.val || 'AM';

  let horas = parseInt(h, 10);
  if (p === 'PM' && horas !== 12) horas += 12;
  if (p === 'AM' && horas === 12) horas = 0;

  return `${String(horas).padStart(2, '0')}:${m}`;
}

function renderChips() {
  horariosChips.innerHTML = '';
  if (horariosTemp.length === 0) {
    horariosChips.innerHTML = '<span class="med-horarios-vazio">Nenhum horário adicionado</span>';
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
    horariosChips.appendChild(chip);
  });
}

btnAddHorario.addEventListener('click', () => {
  const h = lerHorarioAtual();
  if (!horariosTemp.includes(h)) {
    horariosTemp.push(h);
    horariosTemp.sort();
    renderChips();
  }
});

/* ══════════════════════════════════════════
   RENDERIZAR GRID DE CARDS
══════════════════════════════════════════ */
function renderGrid() {
  const total = medicamentos.length;
  contadorEl.textContent = `${total} medicamento${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`;

  if (total === 0) {
    estadoVazio.style.display = '';          // restaura display padrão (flex herdado)
    gridMedicamentos.style.display = 'none'; // esconde o grid
    areaConteudo.style.alignItems    = 'center';
    areaConteudo.style.justifyContent = 'center';
    areaConteudo.style.padding       = '40px';
    areaConteudo.style.overflowY     = 'hidden';
    return;
  }

  estadoVazio.style.display    = 'none';  // esconde estado vazio
  gridMedicamentos.style.display = 'grid'; // mostra grid
  areaConteudo.style.alignItems    = 'flex-start';
  areaConteudo.style.justifyContent = 'flex-start';
  areaConteudo.style.padding       = '24px 30px';
  areaConteudo.style.overflowY     = 'auto';

  gridMedicamentos.innerHTML = '';

  medicamentos.forEach(med => {
    const card = document.createElement('div');
    card.className = 'med-card';
    card.dataset.id = med.id;

    const chipsHTML = (med.horarios || [])
      .map(h => `<span class="med-chip-horario med-chip-horario--card">${h}</span>`)
      .join('');

    card.innerHTML = `
      <div class="med-card-icone">${getIcone(med.nome)}</div>
      <div class="med-card-info">
        <strong class="med-card-nome">${med.nome}</strong>
        <span class="med-card-sub">Responsável: ${med.medico || '—'}</span>
        <span class="med-card-sub">Frequência: ${med.recorrencia || '—'}</span>
        <div class="med-card-horarios">${chipsHTML}</div>
      </div>
      <button class="med-btn-comprovante" data-id="${med.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.85)" stroke-width="2"><path d="M5 8h14M5 12h14M5 16h6"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>
        <span>Comprovante</span>
      </button>
    `;

    gridMedicamentos.appendChild(card);
  });

  // Delegação de eventos nos botões de comprovante
  gridMedicamentos.querySelectorAll('.med-btn-comprovante').forEach(btn => {
    btn.addEventListener('click', () => abrirModalComprovante(btn.dataset.id));
  });
}

/* ══════════════════════════════════════════
   MODAL NOVO MEDICAMENTO — ABRIR / FECHAR
══════════════════════════════════════════ */
function abrirModalMed() {
  formNovoMed.reset();
  horariosTemp = [];
  renderChips();
  receitaNomeEl.textContent = '';
  modalNovoMed.classList.add('visivel');
  document.getElementById('medNome').focus();
}

function fecharModalMed() {
  modalNovoMed.classList.remove('visivel');
}

btnAbrirModalMed.addEventListener('click', abrirModalMed);
btnFecharModalMed.addEventListener('click', fecharModalMed);
modalNovoMed.addEventListener('click', e => { if (e.target === modalNovoMed) fecharModalMed(); });

medReceitaInput.addEventListener('change', () => {
  receitaNomeEl.textContent = medReceitaInput.files[0]?.name || '';
});

/* ── Submit: novo medicamento ── */
formNovoMed.addEventListener('submit', e => {
  e.preventDefault();

  const nome = document.getElementById('medNome').value.trim();
  if (!nome) {
    document.getElementById('medNome').classList.add('campo-erro');
    document.getElementById('medNome').focus();
    return;
  }
  document.getElementById('medNome').classList.remove('campo-erro');

  const novo = {
    id:         Date.now().toString(),
    nome,
    dosagem:    document.getElementById('medDosagem').value.trim(),
    medico:     document.getElementById('medMedico').value.trim(),
    cid:        document.getElementById('medCid').value.trim(),
    recorrencia:document.getElementById('medRecorrencia').value || 'Uso contínuo',
    obs:        document.getElementById('medObs').value.trim(),
    horarios:   [...horariosTemp],
    comprovantes: [],
  };

  medicamentos.push(novo);
  salvarMedicamentos(medicamentos);
  renderGrid();
  fecharModalMed();
});

/* ══════════════════════════════════════════
   MODAL COMPROVANTE — ABRIR / FECHAR
══════════════════════════════════════════ */
function abrirModalComprovante(medId) {
  const med = medicamentos.find(m => m.id === medId);
  if (!med) return;

  document.getElementById('compMedId').value   = med.id;
  document.getElementById('compNome').value    = med.nome;
  document.getElementById('compDosagem').value = med.dosagem || '';
  document.getElementById('compObsComp').value = '';
  compArquivoNome.textContent = '';
  formComprovante.reset();
  // re-setar fields somente-leitura (reset limpa tudo)
  document.getElementById('compNome').value    = med.nome;
  document.getElementById('compDosagem').value = med.dosagem || '';

  modalComprovante.classList.add('visivel');
}

function fecharModalComprovante() {
  modalComprovante.classList.remove('visivel');
}

btnFecharComp.addEventListener('click', fecharModalComprovante);
modalComprovante.addEventListener('click', e => { if (e.target === modalComprovante) fecharModalComprovante(); });

[compImagem, compVideo].forEach(input => {
  input.addEventListener('change', () => {
    const arquivo = compImagem.files[0] || compVideo.files[0];
    compArquivoNome.textContent = arquivo ? arquivo.name : '';
  });
});

/* ── Submit: comprovante ── */
formComprovante.addEventListener('submit', e => {
  e.preventDefault();

  const medId = document.getElementById('compMedId').value;
  const med   = medicamentos.find(m => m.id === medId);
  if (!med) return;

  const comprovante = {
    dataHora:     new Date().toISOString(),
    obs:          document.getElementById('compObsComp').value.trim(),
    arquivoNome:  compImagem.files[0]?.name || compVideo.files[0]?.name || '',
  };

  med.comprovantes = med.comprovantes || [];
  med.comprovantes.push(comprovante);
  salvarMedicamentos(medicamentos);

  fecharModalComprovante();

  // Feedback visual no card
  const card = gridMedicamentos.querySelector(`[data-id="${medId}"]`);
  if (card) {
    const btn = card.querySelector('.med-btn-comprovante');
    btn.classList.add('med-btn-comprovante--ok');
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.9)" stroke-width="2.5"><path d="M5 13l4 4L19 7"/></svg>
      <span>Registrado</span>
    `;
    setTimeout(() => {
      btn.classList.remove('med-btn-comprovante--ok');
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.85)" stroke-width="2"><path d="M5 8h14M5 12h14M5 16h6"/><rect x="3" y="4" width="18" height="16" rx="2"/></svg>
        <span>Comprovante</span>
      `;
    }, 3000);
  }
});

/* ── Fechar modais com ESC ── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    fecharModalMed();
    fecharModalComprovante();
  }
});

/* ══════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════ */
buildDrum();
renderGrid();