/* =============================================
   medicamento.js — Cuida+
============================================= */
"use strict";

const pillIcon =
  '<img src="./assets/icons/Pill.png" alt="Remédio" class="icone-med">';
function getIcone() {
  return pillIcon;
}

const STORAGE_KEY = "cuida_medicamentos";
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

let medicamentos = carregarMedicamentos();

const estadoVazio = document.getElementById("estadoVazio");
const gridMedicamentos = document.getElementById("gridMedicamentos");
const contadorEl = document.getElementById("contadorMedicamentos");
const areaConteudo = document.getElementById("areaConteudo");
const modalNovoMed = document.getElementById("modalNovoMed");
const btnAbrirModalMed = document.getElementById("btnAbrirModalMed");
const btnFecharModalMed = document.getElementById("btnFecharModalMed");
const formNovoMed = document.getElementById("formNovoMed");
const drumHoras = document.getElementById("drumHoras");
const drumMinutos = document.getElementById("drumMinutos");
const drumPeriodo = document.getElementById("drumPeriodo");
const btnAddHorario = document.getElementById("btnAddHorario");
const horariosChips = document.getElementById("horariosChips");
const medReceitaInput = document.getElementById("medReceita");
const receitaNomeEl = document.getElementById("receitaNome");
const modalComprovante = document.getElementById("modalComprovante");
const btnFecharComp = document.getElementById("btnFecharComprovante");
const formComprovante = document.getElementById("formComprovante");
const compImagem = document.getElementById("compImagem");
const compVideo = document.getElementById("compVideo");
const compArquivoNome = document.getElementById("compArquivoNome");

let horariosTemp = [];

/* ══════════════════════════════════════════
   DRUM — baseado na abordagem de consultas.js
   Sem padding, sem ghosts, sem snap complexo.
   Só popula itens e registra clique.
   O scroll nativo do browser posiciona os itens.
══════════════════════════════════════════ */
function popularDrumCol(col, itens, valorPadrao) {
  col.innerHTML = itens
    .map(
      (v) =>
        `<div class="drum-item${v === valorPadrao ? " ativo" : ""}" data-val="${v}">${v}</div>`,
    )
    .join("");

  col.querySelectorAll(".drum-item").forEach((el) => {
    el.addEventListener("click", () => {
      col
        .querySelectorAll(".drum-item")
        .forEach((x) => x.classList.remove("ativo"));
      el.classList.add("ativo");
      // centraliza o item clicado na coluna
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  });
}

function buildDrum() {
  const horas = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutos = Array.from({ length: 12 }, (_, i) =>
    String(i * 5).padStart(2, "0"),
  );

  popularDrumCol(drumHoras, horas, "09");
  popularDrumCol(drumMinutos, minutos, "00");
  popularDrumCol(drumPeriodo, ["AM", "PM"], "AM");
}

function getDrumValor(col) {
  return col.querySelector(".drum-item.ativo")?.dataset.val || null;
}

function lerHorarioAtual() {
  const h = getDrumValor(drumHoras) || "09";
  const m = getDrumValor(drumMinutos) || "00";
  const p = getDrumValor(drumPeriodo) || "AM";

  let horas = parseInt(h, 10);
  if (p === "PM" && horas !== 12) horas += 12;
  if (p === "AM" && horas === 12) horas = 0;

  return `${String(horas).padStart(2, "0")}:${m}`;
}

/* ══════════════════════════════════════════
   CHIPS DE HORÁRIO
══════════════════════════════════════════ */
function renderChips() {
  horariosChips.innerHTML = "";
  if (horariosTemp.length === 0) {
    horariosChips.innerHTML =
      '<span class="med-horarios-vazio">Nenhum horário adicionado</span>';
    return;
  }
  horariosTemp.forEach((h, idx) => {
    const chip = document.createElement("span");
    chip.className = "med-chip-horario";
    chip.innerHTML = `${h} <button type="button" aria-label="Remover ${h}" data-idx="${idx}">×</button>`;
    chip.querySelector("button").addEventListener("click", () => {
      horariosTemp.splice(idx, 1);
      renderChips();
    });
    horariosChips.appendChild(chip);
  });
}

btnAddHorario.addEventListener("click", () => {
  const h = lerHorarioAtual();
  if (!horariosTemp.includes(h)) {
    horariosTemp.push(h);
    horariosTemp.sort();
    renderChips();
  }
});

/* ══════════════════════════════════════════
   GRID DE CARDS
══════════════════════════════════════════ */
function renderGrid() {
  const total = medicamentos.length;
  contadorEl.textContent = `${total} medicamento${total !== 1 ? "s" : ""} cadastrado${total !== 1 ? "s" : ""}`;

  if (total === 0) {
    estadoVazio.style.display = "";
    gridMedicamentos.style.display = "none";
    areaConteudo.style.alignItems = "center";
    areaConteudo.style.justifyContent = "center";
    areaConteudo.style.padding = "40px";
    areaConteudo.style.overflowY = "hidden";
    return;
  }

  estadoVazio.style.display = "none";
  gridMedicamentos.style.display = "grid";
  areaConteudo.style.alignItems = "flex-start";
  areaConteudo.style.justifyContent = "flex-start";
  areaConteudo.style.padding = "24px 30px";
  areaConteudo.style.overflowY = "auto";

  gridMedicamentos.innerHTML = "";
  medicamentos.forEach((med) => {
    const card = document.createElement("div");
    card.className = "med-card";
    card.dataset.id = med.id;

    const chipsHTML = (med.horarios || [])
      .map(
        (h) =>
          `<span class="med-chip-horario med-chip-horario--card">${h}</span>`,
      )
      .join("");

    card.innerHTML = `
      <div class="med-card-icone">${getIcone()}</div>
      <div class="med-card-info">
        <strong class="med-card-nome">${med.nome}</strong>
        <span class="med-card-sub">Responsável: ${med.medico || "—"}</span>
        <span class="med-card-sub">Frequência: ${med.recorrencia || "—"}</span>
        <div class="med-card-horarios">${chipsHTML}</div>
      </div>
      <button class="med-btn-comprovante" data-id="${med.id}">
        <img src="assets/icons/Save.svg" width="36" height="36" alt="">
        <span>Comprovante</span>
      </button>
    `;
    gridMedicamentos.appendChild(card);
  });

  gridMedicamentos.querySelectorAll(".med-btn-comprovante").forEach((btn) => {
    btn.addEventListener("click", () => abrirModalComprovante(btn.dataset.id));
  });
}

/* ══════════════════════════════════════════
   MODAL NOVO MEDICAMENTO
══════════════════════════════════════════ */
function abrirModalMed() {
  formNovoMed.reset();
  horariosTemp = [];
  renderChips();
  receitaNomeEl.textContent = "";
  // Reconstrói o drum toda vez que o modal abre (igual a consultas.js)
  buildDrum();
  modalNovoMed.classList.add("visivel");
  document.getElementById("medNome").focus();
}

function fecharModalMed() {
  modalNovoMed.classList.remove("visivel");
}

btnAbrirModalMed.addEventListener("click", abrirModalMed);
btnFecharModalMed.addEventListener("click", fecharModalMed);
modalNovoMed.addEventListener("click", (e) => {
  if (e.target === modalNovoMed) fecharModalMed();
});
medReceitaInput.addEventListener("change", () => {
  receitaNomeEl.textContent = medReceitaInput.files[0]?.name || "";
});

formNovoMed.addEventListener("submit", (e) => {
  e.preventDefault();
  const nome = document.getElementById("medNome").value.trim();
  if (!nome) {
    document.getElementById("medNome").classList.add("campo-erro");
    document.getElementById("medNome").focus();
    return;
  }
  document.getElementById("medNome").classList.remove("campo-erro");

  medicamentos.push({
    id: Date.now().toString(),
    nome,
    dosagem: document.getElementById("medDosagem").value.trim(),
    medico: document.getElementById("medMedico").value.trim(),
    cid: document.getElementById("medCid").value.trim(),
    recorrencia:
      document.getElementById("medRecorrencia").value || "Uso contínuo",
    obs: document.getElementById("medObs").value.trim(),
    horarios: [...horariosTemp],
    comprovantes: [],
  });

  salvarMedicamentos(medicamentos);
  renderGrid();
  fecharModalMed();
});

/* ══════════════════════════════════════════
   MODAL COMPROVANTE
══════════════════════════════════════════ */
function abrirModalComprovante(medId) {
  const med = medicamentos.find((m) => m.id === medId);
  if (!med) return;
  document.getElementById("compMedId").value = med.id;
  document.getElementById("compNome").value = med.nome;
  document.getElementById("compDosagem").value = med.dosagem || "";
  compArquivoNome.textContent = "";
  formComprovante.reset();
  document.getElementById("compNome").value = med.nome;
  document.getElementById("compDosagem").value = med.dosagem || "";
  modalComprovante.classList.add("visivel");
}

function fecharModalComprovante() {
  modalComprovante.classList.remove("visivel");
}

btnFecharComp.addEventListener("click", fecharModalComprovante);
modalComprovante.addEventListener("click", (e) => {
  if (e.target === modalComprovante) fecharModalComprovante();
});

[compImagem, compVideo].forEach((input) => {
  input.addEventListener("change", () => {
    compArquivoNome.textContent =
      (compImagem.files[0] || compVideo.files[0])?.name || "";
  });
});

formComprovante.addEventListener("submit", (e) => {
  e.preventDefault();
  const medId = document.getElementById("compMedId").value;
  const med = medicamentos.find((m) => m.id === medId);
  if (!med) return;

  (med.comprovantes = med.comprovantes || []).push({
    dataHora: new Date().toISOString(),
    obs: document.getElementById("compObsComp").value.trim(),
    arquivoNome: compImagem.files[0]?.name || compVideo.files[0]?.name || "",
  });
  salvarMedicamentos(medicamentos);
  fecharModalComprovante();

  const card = gridMedicamentos.querySelector(`[data-id="${medId}"]`);
  if (card) {
    const btn = card.querySelector(".med-btn-comprovante");
    btn.classList.add("med-btn-comprovante--ok");
    btn.innerHTML = `<img src="assets/icons/Save.svg" width="22" height="22" alt=""><span>Registrado</span>`;
    setTimeout(() => {
      btn.classList.remove("med-btn-comprovante--ok");
      btn.innerHTML = `<img src="assets/icons/Save.svg" width="22" height="22" alt=""><span>Comprovante</span>`;
    }, 3000);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    fecharModalMed();
    fecharModalComprovante();
  }
});

/* ══════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════ */
renderGrid();

(function menuHamb() {
  const btn      = document.getElementById('btnHamburguer');
  const gaveta   = document.getElementById('gavetaMobile');
  const overlay  = document.getElementById('overlayGaveta');
  const btnFechar = document.getElementById('btnFecharGaveta');

  if (!btn || !gaveta) return; // segurança: sai se o HTML ainda não tiver a gaveta

  function abrirGaveta() {
    gaveta.classList.add('aberta');
    overlay.classList.add('visivel');
    btn.classList.add('aberto');
    document.body.style.overflow = 'hidden';
  }

  function fecharGaveta() {
    gaveta.classList.remove('aberta');
    overlay.classList.remove('visivel');
    btn.classList.remove('aberto');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', abrirGaveta);
  btnFechar.addEventListener('click', fecharGaveta);
  overlay.addEventListener('click', fecharGaveta);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharGaveta(); });
})();