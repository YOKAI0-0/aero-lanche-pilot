// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let carrinho = [];
let itemSelecionado = null;
let taxaEntrega = 0;
const VALOR_POR_KM = 2.00;
let cartOpen = false;
let touchStartY = 0;
let touchEndY = 0;

const adicionaisDisponiveis = [
  { nome: "Bacon", preco: 7 },
  { nome: "Queijo", preco: 5 },
  { nome: "Ovo", preco: 3 },
  { nome: "cebola", preco: 2},
{ nome: "tomate", preco: 2},
  {nome: "milho", preco: 2},
  {nome: "alface", preco: 2},
  {nome: "salsicha", preco: 2},
  {nome: "hamburguer", preco: 7},
  {nome: "calabresa", preco: 6},
  {nome: "frango desfiado", preco: 6},
  {nome: "presunto e queijo", preco: 4},
  {nome: "cheddar", preco:8},
  {nome:"catupiry", preco: 8}
  
];

// ==========================================
// INICIALIZAÇÃO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  carregarCarrinho();
  
  fetch("cardapio.json")
    .then(res => {
      if (!res.ok) throw new Error("Erro ao carregar cardápio");
      return res.json();
    })
    .then(data => {
      renderizarCardapio(data);
      atualizarBadges();
    })
    .catch(err => {
      console.error("Erro:", err);
      document.getElementById("cardapio").innerHTML = 
        "<p style='text-align:center;color:#666;'>Erro ao carregar cardápio. Recarregue a página.</p>";
    });

  // Event Listeners básicos
  document.getElementById("km").addEventListener("input", calcularTaxaEntrega);
  document.getElementById("cancelar").addEventListener("click", fecharModal);
  document.getElementById("confirmar").addEventListener("click", confirmarAdicionais);
  document.getElementById("finalizar").addEventListener("click", finalizarPedido);
  
  // Setup do carrinho mobile (só swipe para fechar, não para abrir)
  setupMobileCart();
});

// ==========================================
// CARRINHO MOBILE - SÓ POR TOQUE (SEM SCROLL)
// ==========================================
function setupMobileCart() {
  const cartHeader = document.querySelector('.cart-header');
  
  // Clique no header abre/fecha (só mobile)
  if (cartHeader) {
    cartHeader.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        toggleCart();
      }
    });
  }
  
  // Swipe down para fechar (dentro do carrinho)
  const cartSidebar = document.getElementById('cart-sidebar');
  
  cartSidebar.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, {passive: true});
  
  cartSidebar.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
    // Só fecha se arrastar para baixo e o carrinho estiver aberto
    if (touchEndY - touchStartY > 50 && cartOpen && window.innerWidth <= 900) {
      closeCart();
    }
  }, {passive: true});
}

function toggleCart() {
  if (window.innerWidth > 900) return;
  
  if (cartOpen) {
    closeCart();
  } else {
    openCart();
  }
}

function openCart() {
  if (window.innerWidth > 900) return;
  
  const cart = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  cart.classList.add('open');
  overlay.classList.add('show');
  cartOpen = true;
  
  // Previne scroll do body quando carrinho aberto
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const cart = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  cart.classList.remove('open');
  overlay.classList.remove('show');
  cartOpen = false;
  
  // Libera scroll do body
  document.body.style.overflow = '';
}

// ==========================================
// CARDÁPIO
// ==========================================
function renderizarCardapio(cardapio) {
  const container = document.getElementById("cardapio");

  for (const categoria in cardapio) {
    if (!Array.isArray(cardapio[categoria])) continue;

    const secao = document.createElement("section");
    secao.className = "categoria";

    const titulo = document.createElement("h2");
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
  card.dataset.nome = item.nome;
  
  const badge = document.createElement("div");
  badge.className = "item-quantidade";
  badge.style.display = 'none';
  badge.id = `badge-${item.nome.replace(/\s+/g, '-')}`;
  
  card.innerHTML = `
    <div class="card-img">${getEmoji(item.nome)}</div>
    <div class="card-info">
      <h3>${item.nome}</h3>
      ${item.ingredientes ? `<p class="descricao">${item.ingredientes.join(", ")}</p>` : ""}
      <div class="card-footer">
        <div class="preco">R$ ${formatarPreco(item.preco)}</div>
        <button class="botao" data-nome="${item.nome}">Adicionar</button>
      </div>
    </div>
  `;
  
  card.appendChild(badge);

  const botao = card.querySelector(".botao");
  botao.addEventListener("click", () => {
    darFeedbackBotao(botao);
    
    if (item.temAdicionais) {
      abrirModal(item);
    } else {
      adicionarAoCarrinho(item, "", []);
    }
  });

  return card;
}

function getEmoji(nome) {
  if (nome.toLowerCase().includes('burg')) return '🍔';
  if (nome.toLowerCase().includes('dog')) return '🌭';
  if (nome.toLowerCase().includes('batata')) return '🍟';
  if (nome.toLowerCase().includes('bebida') || nome.toLowerCase().includes('refri')) return '🥤';
  if (nome.toLowerCase().includes('cerveja')) return '🍺';
  return '🍽️';
}

function darFeedbackBotao(botao) {
  const textoOriginal = botao.textContent;
  
  botao.textContent = "✓ Adicionado!";
  botao.classList.add("added");
  
  const card = botao.closest('.card');
  if (card) {
    card.classList.add('added');
    setTimeout(() => card.classList.remove('added'), 500);
  }
  
  // Feedback no header do carrinho mobile
  if (window.innerWidth <= 900) {
    const header = document.querySelector('.cart-header');
    if (header) {
      header.style.background = '#e8f5e9';
      setTimeout(() => {
        header.style.background = '';
      }, 300);
    }
  }
  
  setTimeout(() => {
    botao.textContent = textoOriginal;
    botao.classList.remove("added");
  }, 1500);
}

// ==========================================
// MODAL ADICIONAIS
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
  if (!itemSelecionado) return;
  
  const checks = document.querySelectorAll("#lista-adicionais input:checked");
  const adicionais = [...checks].map(c => adicionaisDisponiveis[c.value]);
  const obs = document.getElementById("modal-obs").value;
  
  adicionarAoCarrinho(itemSelecionado, obs, adicionais);
  fecharModal();
}

// ==========================================
// CARRINHO & LÓGICA
// ==========================================
function adicionarAoCarrinho(item, observacao, adicionais = []) {
  const adicionaisTexto = adicionais.map(a => a.nome).join(", ");
  const precoAdicionais = adicionais.reduce((s, a) => s + a.preco, 0);
  const precoFinal = item.preco + precoAdicionais;

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
      qtd: 1,
      observacao,
      adicionaisTexto
    });
  }

  atualizarCarrinho();
  atualizarBadges();
  salvarCarrinho();
}

function atualizarCarrinho() {
  const lista = document.getElementById("lista-carrinho");
  const subtotalSpan = document.getElementById("subtotal");
  const totalSpan = document.getElementById("total");
  const taxaSpan = document.getElementById("taxa");

  lista.innerHTML = "";
  let subtotal = 0;

  if (carrinho.length === 0) {
    lista.innerHTML = "<li class='empty-cart'>Seu carrinho está vazio<br>Adicione itens do cardápio</li>";
  }

  carrinho.forEach((item, index) => {
    subtotal += item.preco * item.qtd;

    const li = document.createElement("li");
    li.innerHTML = `
      <div class="cart-item-info">
        <strong>${item.nome}</strong>
        ${item.adicionaisTexto ? `<div class="item-details">+ ${item.adicionaisTexto}</div>` : ""}
        ${item.observacao ? `<div class="item-details" style="color:#c62828;">Obs: ${item.observacao}</div>` : ""}
      </div>
      <div class="cart-item-controls">
        <div class="qtd-controls">
          <button class="qtd-btn" onclick="alterarQtd(${index}, -1)">−</button>
          <span class="qtd-value">${item.qtd}</span>
          <button class="qtd-btn" onclick="alterarQtd(${index}, 1)">+</button>
        </div>
        <span class="item-total">R$ ${formatarPreco(item.preco * item.qtd)}</span>
        <button class="remove-btn" onclick="removerItem(${index})">🗑️</button>
      </div>
    `;
    lista.appendChild(li);
  });

  const total = subtotal + taxaEntrega;
  
  subtotalSpan.textContent = formatarPreco(subtotal);
  taxaSpan.textContent = formatarPreco(taxaEntrega);
  totalSpan.textContent = formatarPreco(total);
  
  // Atualiza contadores
  const totalItens = carrinho.reduce((sum, item) => sum + item.qtd, 0);
  document.getElementById('header-cart-count').textContent = totalItens;
  document.getElementById('cart-count').textContent = 
    `${totalItens} item${totalItens !== 1 ? 's' : ''} • R$ ${formatarPreco(total)}`;
}

function alterarQtd(index, delta) {
  carrinho[index].qtd += delta;
  if (carrinho[index].qtd <= 0) {
    carrinho.splice(index, 1);
  }
  atualizarCarrinho();
  atualizarBadges();
  salvarCarrinho();
}

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
  atualizarBadges();
  salvarCarrinho();
}

function atualizarBadges() {
  const quantidades = {};
  
  carrinho.forEach(item => {
    quantidades[item.nome] = (quantidades[item.nome] || 0) + item.qtd;
  });
  
  document.querySelectorAll('.card').forEach(card => {
    const nome = card.dataset.nome;
    const badge = card.querySelector('.item-quantidade');
    const qtd = quantidades[nome] || 0;
    
    if (qtd > 0) {
      badge.textContent = qtd;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  });
}

function calcularTaxaEntrega() {
  const km = parseFloat(document.getElementById("km").value);
  taxaEntrega = (isNaN(km) || km < 0) ? 0 : km * VALOR_POR_KM;
  atualizarCarrinho();
}

// ==========================================
// FINALIZAR PEDIDO
// ==========================================
function finalizarPedido() {
  if (carrinho.length === 0) {
    alert("Adicione itens ao carrinho primeiro!");
    return;
  }
  
  const km = parseFloat(document.getElementById("km").value);
  if (!km || km <= 0) {
    alert("Informe a distância (km) para calcular a entrega!");
    document.getElementById("km").focus();
    if (window.innerWidth <= 900) openCart();
    return;
  }

  let mensagem = "🍔 *Pedido Aero Lanche*\n\n";
  let subtotal = 0;

  carrinho.forEach(item => {
    mensagem += `*${item.qtd}x ${item.nome}* - R$ ${formatarPreco(item.preco * item.qtd)}\n`;
    if (item.adicionaisTexto) mensagem += `   _Adicionais: ${item.adicionaisTexto}_\n`;
    if (item.observacao) mensagem += `   _Obs: ${item.observacao}_\n`;
    subtotal += item.preco * item.qtd;
  });

  mensagem += `\n*Subtotal:* R$ ${formatarPreco(subtotal)}`;
  mensagem += `\n*Entrega (${km}km):* R$ ${formatarPreco(taxaEntrega)}`;
  mensagem += `\n*TOTAL:* R$ ${formatarPreco(subtotal + taxaEntrega)}`;

  const telefone = "5543991547109";
  const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  
  if (confirm("Enviar pedido pelo WhatsApp?")) {
    window.open(url, "_blank");
    carrinho = [];
    taxaEntrega = 0;
    localStorage.removeItem("carrinho");
    document.getElementById("km").value = "";
    atualizarCarrinho();
    atualizarBadges();
    if (window.innerWidth <= 900) closeCart();
  }
}

// ==========================================
// UTILITÁRIOS
// ==========================================
function formatarPreco(valor) {
  return valor.toFixed(2).replace(".", ",");
}

function formatarNomeCategoria(cat) {
  const nomes = {
    "burguer": "🍔 Hamburgers",
    "dogs": "🌭 Hot Dogs",
    "porcoes": "🍟 Porções",
    "bebidas": "🥤 Bebidas",
    "refrigerantes_600ml": "🧃 Refri 600ml",
    "cervejas": "🍺 Cervejas"
  };
  return nomes[cat] || cat;
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
    carrinho = [];
  }
}

function scrollToCart() {
  if (window.innerWidth <= 900) {
    toggleCart();
  } else {
    document.getElementById('cart-sidebar').scrollIntoView({ behavior: 'smooth' });
  }
}

