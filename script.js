// ==========================================
// CONFIGURAÇÃO DOS ADICIONAIS - EDITE AQUI!
// ==========================================
const adicionaisDisponiveis = [
  { nome: "Bacon", preco: 7 },
  { nome: "Queijo", preco: 5 },
  { nome: "Ovo", preco: 3 },
  { nome: "Cebola", preco: 2 },
  { nome: "Tomate", preco: 2 },
  { nome: "Milho", preco: 2 },
  { nome: "Alface", preco: 2 },
  { nome: "Salsicha", preco: 2 },
  { nome: "Hambúrguer", preco: 7 },
  { nome: "Calabresa", preco: 6 },
  { nome: "Frango desfiado", preco: 6 },
  { nome: "Presunto e queijo", preco: 4 },
  { nome: "Cheddar", preco: 8 },
  { nome: "Catupiry", preco: 8 }
];

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

  document.getElementById("km").addEventListener("input", calcularTaxaEntrega);
  document.getElementById("cancelar").addEventListener("click", fecharModal);
  document.getElementById("confirmar").addEventListener("click", confirmarAdicionais);
  document.getElementById("finalizar").addEventListener("click", finalizarPedido);
  
  setupMobileCart();
});

// ==========================================
// CARRINHO MOBILE
// ==========================================
function setupMobileCart() {
  const cartHeader = document.querySelector('.cart-header');
  
  if (cartHeader) {
    cartHeader.addEventListener('click', (e) => {
      if (window.innerWidth <= 900) {
        toggleCart();
      }
    });
  }
  
  const cartSidebar = document.getElementById('cart-sidebar');
  
  cartSidebar.addEventListener('touchstart', (e) => {
    touchStartY = e.changedTouches[0].screenY;
  }, {passive: true});
  
  cartSidebar.addEventListener('touchend', (e) => {
    touchEndY = e.changedTouches[0].screenY;
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
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const cart = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  
  cart.classList.remove('open');
  overlay.classList.remove('show');
  cartOpen = false;
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
// MODAL COM QUANTIDADE DE ADICIONAIS
// ==========================================
function abrirModal(item) {
  itemSelecionado = item;
  document.getElementById("modal-titulo").textContent = item.nome;
  document.getElementById("modal-obs").value = "";
  
  const lista = document.getElementById("lista-adicionais");
  lista.innerHTML = "";
  
  adicionaisDisponiveis.forEach((adicional, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "adicional-item";
    itemDiv.dataset.index = index;
    itemDiv.dataset.preco = adicional.preco;
    
    itemDiv.innerHTML = `
      <div class="adicional-info">
        <span class="adicional-nome">${adicional.nome}</span>
        <span class="adicional-preco">+ R$ ${formatarPreco(adicional.preco)}</span>
      </div>
      <div class="adicional-controles">
        <button type="button" class="btn-qtd" onclick="alterarQtdAdicional(${index}, -1)">−</button>
        <span class="qtd-display" id="qtd-${index}">0</span>
        <button type="button" class="btn-qtd" onclick="alterarQtdAdicional(${index}, 1)">+</button>
      </div>
    `;
    
    lista.appendChild(itemDiv);
  });
  
  document.getElementById("modal-adicionais").classList.remove("hidden");
}

// Variável temporária para guardar quantidades do modal
let adicionaisTemp = {};

function alterarQtdAdicional(index, delta) {
  const display = document.getElementById(`qtd-${index}`);
  let qtd = parseInt(display.textContent) + delta;
  
  if (qtd < 0) qtd = 0;
  if (qtd > 10) qtd = 10; // Máximo 10 de cada
  
  display.textContent = qtd;
  adicionaisTemp[index] = qtd;
  
  // Feedback visual se > 0
  const itemDiv = display.closest('.adicional-item');
  if (qtd > 0) {
    itemDiv.classList.add('selecionado');
  } else {
    itemDiv.classList.remove('selecionado');
  }
}

function fecharModal() {
  document.getElementById("modal-adicionais").classList.add("hidden");
  itemSelecionado = null;
  adicionaisTemp = {}; // Limpa temporários
}

function confirmarAdicionais() {
  if (!itemSelecionado) return;
  
  const adicionaisSelecionados = [];
  
  // Pega todos os adicionais com quantidade > 0
  adicionaisDisponiveis.forEach((adicional, index) => {
    const qtd = parseInt(document.getElementById(`qtd-${index}`).textContent) || 0;
    
    if (qtd > 0) {
      adicionaisSelecionados.push({
        nome: adicional.nome,
        preco: adicional.preco,
        qtd: qtd
      });
    }
  });
  
  const obs = document.getElementById("modal-obs").value;
  
  adicionarAoCarrinho(itemSelecionado, obs, adicionaisSelecionados);
  fecharModal();
}

// ==========================================
// CARRINHO & LÓGICA ATUALIZADA
// ==========================================
function adicionarAoCarrinho(item, observacao, adicionais = []) {
  // NOVO: Formata texto dos adicionais com quantidade (ex: "2x Bacon")
  const adicionaisTexto = adicionais.map(a => 
    `${a.qtd}x ${a.nome}`
  ).join(", ");
  
  // NOVO: Calcula preço total dos adicionais considerando quantidade
  const precoAdicionais = adicionais.reduce((s, a) => s + (a.preco * a.qtd), 0);
  const precoFinal = item.preco + precoAdicionais;

  // Verifica se já existe igual (mesmo nome, mesma obs, mesmos adicionais)
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
      precoUnitario: precoFinal, // Preço já inclui adicionais
      qtd: 1,
      observacao,
      adicionaisTexto,
      adicionaisDetalhes: adicionais // Guarda detalhes para possível edição futura
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
        <strong>${item.qtd}x ${item.nome}</strong>
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
// FINALIZAR PEDIDO (ATUALIZADO)
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
    
    // NOVO: Mostra adicionais com quantidade bonitinho
    if (item.adicionaisTexto) {
      mensagem += `   _Extras: ${item.adicionaisTexto}_\n`;
    }
    if (item.observacao) {
      mensagem += `   _Obs: ${item.observacao}_\n`;
    }
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
