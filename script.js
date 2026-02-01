// ==========================================
// VARIÁVEIS GLOBAIS (dados do sistema)
// ==========================================

let carrinho = [];
let itemSelecionado = null;
let taxaEntrega = 0; // CORREÇÃO: Criei a variável que faltava!

const VALOR_POR_KM = 2.00; // R$ 2,00 por km - fácil alterar depois

const categoriasComAdicionais = ["burguer", "dogs"];

const adicionaisDisponiveis = [
  { nome: "Bacon", preco: 7 },
  { nome: "Queijo", preco: 5 },
  { nome: "Ovo", preco: 3 }
];


document.addEventListener("DOMContentLoaded", () => {

  carregarCarrinho();
  
  // Buscar cardápio
  fetch("cardapio.json")
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar cardápio");
      return res.json();
    })
    .then(data => renderizarCardapio(data))
    .catch(err => {
      console.error("Erro:", err);
      alert("Não foi possível carregar o cardápio. Recarregue a página.");
    });

  // Event listeners
  document.getElementById("lista-carrinho").addEventListener("click", cliqueCarrinho);
  document.getElementById("finalizar").addEventListener("click", finalizarPedido);
  
  // CORREÇÃO: Event listener para calcular taxa quando digitar km
  document.getElementById("km").addEventListener("input", calcularTaxaEntrega);
  
  // CORREÇÃO: Event listeners do modal movidos para cá (dentro do DOMContentLoaded)
  document.getElementById("cancelar").addEventListener("click", fecharModal);
  document.getElementById("confirmar").addEventListener("click", confirmarAdicionais);
});

// ==========================================
// FUNÇÕES DO CARDÁPIO
// ==========================================

function renderizarCardapio(cardapio) {
  const container = document.getElementById("cardapio");

  for (const categoria in cardapio) {
    // CORREÇÃO: Verifica se é array válido
    if (!Array.isArray(cardapio[categoria])) continue;

    const secao = document.createElement("section");
    secao.className = "categoria";

    const titulo = document.createElement("h2");
    // MELHORIA: Nomes amigáveis para categorias
    titulo.textContent = formatarNomeCategoria(categoria);
    secao.appendChild(titulo);

    cardapio[categoria].forEach(item => {
      const card = criarCard(item);
      secao.appendChild(card);
    });

    container.appendChild(secao);
  }
}

function criarCard(item) {
  const card = document.createElement("div");
  card.className = "card";

  // MELHORIA: Template string mais organizada
  card.innerHTML = `
    <div class="card-img">📷 Foto</div>
    <div class="card-info">
      <h3>${item.nome}</h3>
      ${
        item.ingredientes
          ? `<p class="descricao">${item.ingredientes.join(", ")}</p>`
          : ""
      }
      <div class="card-footer">
        <div class="preco">R$ ${formatarPreco(item.preco)}</div>
        <button class="botao">Adicionar</button>
      </div>
    </div>
  `;

  // Evento de clique no botão
  card.querySelector(".botao").addEventListener("click", () => {
    if (item.temAdicionais) {
      abrirModal(item);
    } else {
      adicionarAoCarrinho(item, "", []);
    }
  });

  return card;
}

// ==========================================
// FUNÇÕES DO MODAL (Adicionais)
// ==========================================

function abrirModal(item) {
  itemSelecionado = item;

  document.getElementById("modal-titulo").textContent = item.nome;
  document.getElementById("modal-obs").value = "";

  const lista = document.getElementById("lista-adicionais");
  lista.innerHTML = "";

  adicionaisDisponiveis.forEach((a, i) => {
    const label = document.createElement("label");
    label.innerHTML = `
      <input type="checkbox" value="${i}">
      ${a.nome} (+R$ ${formatarPreco(a.preco)})
    `;
    lista.appendChild(label);
  });

  document.getElementById("modal-adicionais").classList.remove("hidden");
}

function fecharModal() {
  document.getElementById("modal-adicionais").classList.add("hidden");
  itemSelecionado = null;
}

function confirmarAdicionais() {
  if (!itemSelecionado) return; // Segurança
  
  const checks = document.querySelectorAll("#lista-adicionais input:checked");
  const adicionais = [...checks].map(c => adicionaisDisponiveis[c.value]);
  const obs = document.getElementById("modal-obs").value;

  adicionarAoCarrinho(itemSelecionado, obs, adicionais);
  fecharModal();
}

// ==========================================
// FUNÇÕES DO CARRINHO
// ==========================================

function adicionarAoCarrinho(item, observacao, adicionais = []) {
  const adicionaisTexto = adicionais.map(a => a.nome).join(", ");
  const precoAdicionais = adicionais.reduce((s, a) => s + a.preco, 0);
  const precoFinal = item.preco + precoAdicionais;

  // Verifica se já existe igual no carrinho (para agrupar)
  const existente = carrinho.find(i =>
    i.nome === item.nome &&
    i.observacao === observacao &&
    i.adicionaisTexto === adicionaisTexto
  );

  if (existente) {
    existente.qtd++;
  } else {
    carrinho.push({
      nome: item.nome,
      preco: precoFinal,
      precoUnitario: precoFinal, // Guarda preço unitário separado
      qtd: 1,
      observacao,
      adicionaisTexto
    });
  }

  atualizarCarrinho();
}

function atualizarCarrinho() {
  const lista = document.getElementById("lista-carrinho");
  const subtotalSpan = document.getElementById("subtotal");
  const totalSpan = document.getElementById("total");
  const taxaSpan = document.getElementById("taxa");

  lista.innerHTML = "";
  let subtotal = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = "<li style='text-align:center; color:#999; padding:20px;'>Carrinho vazio</li>";
  }

  carrinho.forEach((item, index) => {
    subtotal += item.preco * item.qtd;

    const li = document.createElement("li");
    li.innerHTML = `
      <div style="flex:1;">
        <strong>${item.qtd}x ${item.nome}</strong><br>
        ${item.adicionaisTexto ? `<small style="color:#666;">➕ ${item.adicionaisTexto}</small><br>` : ""}
        ${item.observacao ? `<small style="color:#c62828;">📝 ${item.observacao}</small>` : ""}
        <div style="margin-top:4px; font-size:13px; color:#666;">
          R$ ${formatarPreco(item.preco)} cada
        </div>
      </div>
      <div class="controles">
        <button data-acao="menos" data-index="${index}">−</button>
        <span style="font-weight:bold; min-width:20px; text-align:center;">${item.qtd}</span>
        <button data-acao="mais" data-index="${index}">+</button>
        <button class="lixeira" data-acao="remover" data-index="${index}">🗑️</button>
      </div>
    `;

    lista.appendChild(li);
  });

  // CORREÇÃO: Calcula totais corretamente agora
  const total = subtotal + taxaEntrega;
  
  subtotalSpan.textContent = formatarPreco(subtotal);
  taxaSpan.textContent = formatarPreco(taxaEntrega);
  totalSpan.textContent = formatarPreco(total);

  salvarCarrinho();
}

function cliqueCarrinho(e) {
  if (!e.target.dataset.acao) return;

  const acao = e.target.dataset.acao;
  const index = Number(e.target.dataset.index);

  if (!carrinho[index]) return;

  if (acao === "mais") {
    carrinho[index].qtd++;
  } else if (acao === "menos") {
    carrinho[index].qtd--;
    if (carrinho[index].qtd <= 0) {
      carrinho.splice(index, 1);
    }
  } else if (acao === "remover") {
    carrinho.splice(index, 1);
  }

  atualizarCarrinho();
}

// ==========================================
// FUNÇÕES DE ENTREGA
// ==========================================

function calcularTaxaEntrega() {
  const input = document.getElementById("km");
  const km = parseFloat(input.value);
  
  // Validação: se não for número ou for negativo
  if (isNaN(km) || km < 0) {
    taxaEntrega = 0;
  } else {
    taxaEntrega = km * VALOR_POR_KM;
  }
  
  atualizarCarrinho(); // Recalcula o total na tela
}

// ==========================================
// FINALIZAR PEDIDO
// ==========================================

function finalizarPedido() {
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio! Adicione alguns lanches primeiro. 🍔");
    return;
  }

  const inputKm = document.getElementById("km");
  const km = parseFloat(inputKm.value);
  
  if (!km || km <= 0) {
    alert("Por favor, informe a distância (km) para calcularmos a entrega!");
    inputKm.focus();
    return;
  }

  let mensagem = "🍔 *Pedido Aero Lanche*\n";
  mensagem += "───────────────────\n\n";
  
  let subtotal = 0;

  carrinho.forEach(item => {
    mensagem += `*${item.qtd}x ${item.nome}*\n`;
    mensagem += `💵 R$ ${formatarPreco(item.preco * item.qtd)}\n`;
    
    if (item.adicionaisTexto) {
      mensagem += `   ➕ Adicionais: ${item.adicionaisTexto}\n`;
    }
    if (item.observacao) {
      mensagem += `   📝 Obs: ${item.observacao}\n`;
    }
    mensagem += "\n";
    
    subtotal += item.preco * item.qtd;
  });

  mensagem += "───────────────────\n";
  mensagem += `*Subtotal:* R$ ${formatarPreco(subtotal)}\n`;
  mensagem += `*Entrega (${km.toFixed(1)}km):* R$ ${formatarPreco(taxaEntrega)}\n`;
  mensagem += `*TOTAL:* R$ ${formatarPreco(subtotal + taxaEntrega)}\n\n`;
  mensagem += "Obrigado pela preferência! 😊";

  if (!confirm("Deseja enviar o pedido pelo WhatsApp?\n\nTotal: R$ " + formatarPreco(subtotal + taxaEntrega))) {
    return;
  }

  const telefone = "5543991547109";
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  
  window.open(url, "_blank");

  carrinho = [];
  taxaEntrega = 0;
  inputKm.value = "";
  localStorage.removeItem("carrinho");
  atualizarCarrinho();
  
  // Feedback visual
  alert("Pedido enviado! Aguarde nosso contato. 📱");
}

// ==========================================
// UTILITÁRIOS (funções auxiliares)
// ==========================================

function formatarPreco(valor) {
  return valor.toFixed(2).replace(".", ",");
}

function formatarNomeCategoria(categoria) {
  const nomes = {
    "burguer": "🍔 Hambúrgueres",
    "dogs": "🌭 Cachorros-Quentes",
    "porcoes": "🍟 Porções",
    "bebidas": "🥤 Bebidas",
    "refrigerantes_600ml": "🧃 Refri 600ml",
    "cervejas": "🍺 Cervejas"
  };
  return nomes[categoria] || categoria.toUpperCase();
}

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function carregarCarrinho() {
  try {
    const salvo = localStorage.getItem("carrinho");
    if (salvo) {
      carrinho = JSON.parse(salvo);
      if (!Array.isArray(carrinho)) carrinho = [];
    }
  } catch (e) {
    console.error("Erro ao carregar carrinho:", e);
    carrinho = [];
  }
}