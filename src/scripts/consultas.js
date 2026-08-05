// =============================================
//  Cuida+ — consultas.js
// =============================================

// --- Persistência ---
const LS_KEY = "cuidamais_consultas";

function salvarConsultas() {
  localStorage.setItem(LS_KEY, JSON.stringify(consultas));
}

function carregarConsultas() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((c) => ({
      ...c,
      data: new Date(c.data),
    }));
  } catch {
    return [];
  }
}

let consultas = carregarConsultas();

// Categorias e cores
const CATEGORIAS = {
  emergencia: { label: "Emergência", cor: "#E07B7B" },
  consulta: { label: "Consultas", cor: "#2E2E48" },
  exame: { label: "Exames", cor: "#80CEF4" },
  consulta_rotina: { label: "Consultas Rotina", cor: "#E8C97A" },
  exame_rotina: { label: "Exame Rotina", cor: "#CBDD98" },
};

function resolverCategoria(especialidade, isExame) {
  if (isExame) return "exame";
  const e = especialidade.toLowerCase();
  if (e.includes("emergên") || e.includes("urgên")) return "emergencia";
  if (e.includes("rotina") || e.includes("check")) return "consulta_rotina";
  return "consulta";
}

// =============================================
//  REFERÊNCIAS AO DOM
// =============================================
const areaConteudo = document.getElementById("area-conteudo");
const contagemEl = document.getElementById("contagem-consultas");
const mesAtualEl = document.getElementById("mes-atual");
const btnNovaConsulta = document.getElementById("btn-nova-consulta");
const btnMesAnterior = document.getElementById("btn-mes-anterior");
const btnMesProximo = document.getElementById("btn-mes-proximo");

const modalOverlay = document.getElementById("modal-nova-consulta");
const btnFecharModal = document.getElementById("btn-fechar-modal");
const btnConfirmar = document.getElementById("btn-confirmar-consulta");
const inputEspecialidade = document.getElementById("mc-especialidade");

// =============================================
//  ESTADO DA VIEW
// =============================================
let dataAtual = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let diaSelecionado = new Date();

// =============================================
//  CALENDÁRIO INLINE DA MODAL
// =============================================
let dataSelecionadaModal = new Date();
let mesCalendario = new Date(
  dataSelecionadaModal.getFullYear(),
  dataSelecionadaModal.getMonth(),
  1,
);

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function renderCalendarioModal() {
  const container = document.getElementById("mc-calendario");
  if (!container) return;

  const ano = mesCalendario.getFullYear();
  const mes = mesCalendario.getMonth();
  const nomeMes = mesCalendario.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const nomeMesFmt = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();

  let html = `
        <div class="cal-inline-header">
            <span class="cal-inline-mes">${nomeMesFmt}</span>
            <div class="cal-inline-nav">
                <button class="cal-inline-btn" id="cal-prev">&#8249;</button>
                <button class="cal-inline-btn" id="cal-next">&#8250;</button>
            </div>
        </div>
        <div class="cal-inline-grid">
            ${DIAS_SEMANA.map((d) => `<div class="cal-inline-diasemana">${d}</div>`).join("")}
    `;

  for (let i = 0; i < primeiroDia; i++) {
    html += `<div class="cal-inline-dia vazio"></div>`;
  }
  for (let d = 1; d <= totalDias; d++) {
    const esteD = new Date(ano, mes, d);
    const sel = dataSelecionadaModal.toDateString() === esteD.toDateString();
    html += `<div class="cal-inline-dia${sel ? " selecionado" : ""}" data-ts="${esteD.getTime()}">${d}</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll(".cal-inline-dia:not(.vazio)").forEach((el) => {
    el.addEventListener("click", () => {
      dataSelecionadaModal = new Date(parseInt(el.dataset.ts));
      renderCalendarioModal();
    });
  });

  document.getElementById("cal-prev").addEventListener("click", () => {
    mesCalendario = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth() - 1,
      1,
    );
    renderCalendarioModal();
  });
  document.getElementById("cal-next").addEventListener("click", () => {
    mesCalendario = new Date(
      mesCalendario.getFullYear(),
      mesCalendario.getMonth() + 1,
      1,
    );
    renderCalendarioModal();
  });
}

// =============================================
//  SELETOR DE HORÁRIO (drum)
// =============================================
function criarDrumCol(containerId, itens, valorInicial) {
  const col = document.getElementById(containerId);
  if (!col) return;
  col.innerHTML = itens
    .map(
      (v) =>
        `<div class="drum-item${v === valorInicial ? " ativo" : ""}" data-val="${v}">${v}</div>`,
    )
    .join("");
  col.querySelectorAll(".drum-item").forEach((el) => {
    el.addEventListener("click", () => {
      col
        .querySelectorAll(".drum-item")
        .forEach((x) => x.classList.remove("ativo"));
      el.classList.add("ativo");
    });
  });
}

function getDrumValor(containerId) {
  return (
    document.getElementById(containerId)?.querySelector(".drum-item.ativo")
      ?.dataset.val || null
  );
}

function iniciarDrum() {
  const horas = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  const minutos = Array.from({ length: 12 }, (_, i) =>
    String(i * 5).padStart(2, "0"),
  );
  const periodos = ["AM", "PM"];
  criarDrumCol("drum-hora", horas, "08");
  criarDrumCol("drum-min", minutos, "00");
  criarDrumCol("drum-periodo", periodos, "AM");
}

// =============================================
//  MODAL — abrir / fechar
// =============================================
function abrirModal() {
  dataSelecionadaModal = new Date();
  mesCalendario = new Date(
    dataSelecionadaModal.getFullYear(),
    dataSelecionadaModal.getMonth(),
    1,
  );
  [
    "mc-especialidade",
    "mc-profissional",
    "mc-hospital",
    "mc-endereco",
    "mc-cep",
    "mc-obs",
  ].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("mc-recorrente").checked = false;
  document.getElementById("mc-exame").checked = false;
  inputEspecialidade.classList.remove("campo-erro");
  renderCalendarioModal();
  iniciarDrum();
  modalOverlay.classList.add("visivel");
}

function fecharModal() {
  modalOverlay.classList.remove("visivel");
}

btnNovaConsulta.addEventListener("click", abrirModal);
btnFecharModal.addEventListener("click", fecharModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) fecharModal();
});

// =============================================
//  CONFIRMAR NOVA CONSULTA
// =============================================
btnConfirmar.addEventListener("click", () => {
  const especialidade = inputEspecialidade.value.trim();
  if (!especialidade) {
    inputEspecialidade.classList.add("campo-erro");
    inputEspecialidade.focus();
    return;
  }
  inputEspecialidade.classList.remove("campo-erro");

  const hora = getDrumValor("drum-hora") || "08";
  const min = getDrumValor("drum-min") || "00";
  const periodo = getDrumValor("drum-periodo") || "AM";
  const isExame = document.getElementById("mc-exame").checked;

  let h24 = parseInt(hora, 10);
  if (periodo === "PM" && h24 !== 12) h24 += 12;
  if (periodo === "AM" && h24 === 12) h24 = 0;

  const novaConsulta = {
    id: Date.now(),
    especialidade,
    profissional: document.getElementById("mc-profissional").value.trim(),
    hospital: document.getElementById("mc-hospital").value.trim(),
    endereco: document.getElementById("mc-endereco").value.trim(),
    cep: document.getElementById("mc-cep").value.trim(),
    obs: document.getElementById("mc-obs").value.trim(),
    data: new Date(
      dataSelecionadaModal.getFullYear(),
      dataSelecionadaModal.getMonth(),
      dataSelecionadaModal.getDate(),
    ),
    hora: h24,
    minuto: parseInt(min, 10),
    horarioLabel: `${hora}:${min} ${periodo}`,
    isExame,
    categoria: resolverCategoria(especialidade, isExame),
  };

  consultas.push(novaConsulta);
  salvarConsultas();

  dataAtual = new Date(
    novaConsulta.data.getFullYear(),
    novaConsulta.data.getMonth(),
    1,
  );
  diaSelecionado = new Date(novaConsulta.data);

  atualizarContagem();
  atualizarMesLabel();
  renderizarPaginaConsultas();
  fecharModal();
});

// =============================================
//  RENDERIZAÇÃO — lista de cards por dia
// =============================================
function renderizarPaginaConsultas() {
  const consultasMes = consultas.filter(
    (c) =>
      c.data.getFullYear() === dataAtual.getFullYear() &&
      c.data.getMonth() === dataAtual.getMonth(),
  );

  if (consultasMes.length === 0) {
    mostrarEstadoVazio();
    return;
  }

  // Dias únicos ordenados
  const diasComConsulta = [
    ...new Set(consultasMes.map((c) => c.data.getDate())),
  ].sort((a, b) => a - b);

  const diaNoMesAtual =
    diaSelecionado.getFullYear() === dataAtual.getFullYear() &&
    diaSelecionado.getMonth() === dataAtual.getMonth() &&
    diasComConsulta.includes(diaSelecionado.getDate());

  const diaVis = diaNoMesAtual ? diaSelecionado.getDate() : diasComConsulta[0];
  const idxAtual = diasComConsulta.indexOf(diaVis);
  const temAntes = idxAtual > 0;
  const temDepois = idxAtual < diasComConsulta.length - 1;

  // Consultas do dia ordenadas por horário
  const consultasDia = consultasMes
    .filter((c) => c.data.getDate() === diaVis)
    .sort((a, b) =>
      a.hora !== b.hora ? a.hora - b.hora : a.minuto - b.minuto,
    );

  const dataExibida = new Date(
    dataAtual.getFullYear(),
    dataAtual.getMonth(),
    diaVis,
  );
  const nomeDia = dataExibida.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const nomeDiaFmt = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1);

  // Gera os cards
  const cardsHtml = consultasDia
    .map((c) => {
      const cat = CATEGORIAS[c.categoria] || CATEGORIAS.consulta;
      const detalhe = [c.profissional, c.hospital].filter(Boolean).join(" · ");
      const horaInicio = c.horarioLabel.split(" ")[0];
      return `
            <div class="cal-item-wrapper">
                <div class="cal-item-horario">
                    <span class="hora-inicio">${horaInicio}</span>
                </div>
                <div class="consulta-card" style="background-color:${cat.cor}" title="${c.obs || ""}">
                    <div class="consulta-card__corpo">
                        <span class="consulta-card__nome">${c.especialidade}</span>
                        ${detalhe ? `<span class="consulta-card__detalhe">${detalhe}</span>` : ""}
                    </div>
                </div>
            </div>
        `;
    })
    .join("");

  areaConteudo.classList.add("com-consultas");
  areaConteudo.innerHTML = `
        <div class="calendario-dia">
            <div class="cal-dia-header">
                <button class="btn-dia" id="btn-dia-anterior" ${!temAntes ? "disabled" : ""} aria-label="Dia anterior">&#8249;</button>
                <div class="cal-dia-titulo">
                    <img src="../assets/icons/sino.svg" alt="" onerror="this.style.display='none'">
                    <span>${nomeDiaFmt}</span>
                </div>
                <button class="btn-dia" id="btn-dia-proximo" ${!temDepois ? "disabled" : ""} aria-label="Próximo dia">&#8250;</button>
            </div>
            <p class="cal-subtitulo">Consultas agendadas</p>
            <div class="cal-lista-corpo">
                ${cardsHtml}
            </div>
        </div>
    `;

  if (temAntes) {
    document
      .getElementById("btn-dia-anterior")
      .addEventListener("click", () => {
        diaSelecionado = new Date(
          dataAtual.getFullYear(),
          dataAtual.getMonth(),
          diasComConsulta[idxAtual - 1],
        );
        renderizarPaginaConsultas();
      });
  }
  if (temDepois) {
    document.getElementById("btn-dia-proximo").addEventListener("click", () => {
      diaSelecionado = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth(),
        diasComConsulta[idxAtual + 1],
      );
      renderizarPaginaConsultas();
    });
  }
}

function mostrarEstadoVazio() {
  areaConteudo.classList.remove("com-consultas");
  areaConteudo.innerHTML = `
        <article class="cartao-vazio">
            <img src="../assets/icons/sino.svg" alt="" class="icone-sino" onerror="this.style.display='none'">
            <h2>Nenhuma consulta agendada</h2>
            <p>Cadastre novas consultas pra receber notificações.</p>
        </article>
    `;
}

// =============================================
//  NAVEGAÇÃO DE MÊS
// =============================================
function atualizarMesLabel() {
  const label = dataAtual.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  mesAtualEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
}

function atualizarContagem() {
  const total = consultas.length;
  contagemEl.textContent =
    total === 0
      ? "0 consultas agendadas"
      : `${total} consulta${total > 1 ? "s" : ""} agendada${total > 1 ? "s" : ""}`;
}

function primeiroComConsultaNoMes(ano, mes) {
  const consultasMes = consultas.filter(
    (c) => c.data.getFullYear() === ano && c.data.getMonth() === mes,
  );
  if (consultasMes.length === 0) return new Date(ano, mes, 1);
  const menorDia = Math.min(...consultasMes.map((c) => c.data.getDate()));
  return new Date(ano, mes, menorDia);
}

btnMesAnterior.addEventListener("click", () => {
  dataAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - 1, 1);
  diaSelecionado = primeiroComConsultaNoMes(
    dataAtual.getFullYear(),
    dataAtual.getMonth(),
  );
  atualizarMesLabel();
  renderizarPaginaConsultas();
});

btnMesProximo.addEventListener("click", () => {
  dataAtual = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 1);
  diaSelecionado = primeiroComConsultaNoMes(
    dataAtual.getFullYear(),
    dataAtual.getMonth(),
  );
  atualizarMesLabel();
  renderizarPaginaConsultas();
});

// =============================================
//  INICIALIZAÇÃO
// =============================================
atualizarMesLabel();
atualizarContagem();

if (
  consultas.some(
    (c) =>
      c.data.getFullYear() === dataAtual.getFullYear() &&
      c.data.getMonth() === dataAtual.getMonth(),
  )
) {
  renderizarPaginaConsultas();
} else {
  mostrarEstadoVazio();
}

// Gaveta mobile
(function menuHamb() {
  const btn = document.getElementById("btnHamburguer");
  const gaveta = document.getElementById("gavetaMobile");
  const overlay = document.getElementById("overlayGaveta");
  const btnFechar = document.getElementById("btnFecharGaveta");
  if (!btn || !gaveta) return;

  function abrirGaveta() {
    gaveta.classList.add("aberta");
    overlay.classList.add("visivel");
    btn.classList.add("aberto");
    document.body.style.overflow = "hidden";
  }
  function fecharGaveta() {
    gaveta.classList.remove("aberta");
    overlay.classList.remove("visivel");
    btn.classList.remove("aberto");
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", abrirGaveta);
  btnFechar.addEventListener("click", fecharGaveta);
  overlay.addEventListener("click", fecharGaveta);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharGaveta();
  });
})();
