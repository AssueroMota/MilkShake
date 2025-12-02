import React, { useState, useMemo, useEffect } from "react";
import "./DetailsModal.scss";

export default function DetailsModal({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  // 🆕 Estado para armazenar o tamanho selecionado (apenas se for produto)
  const [selectedSize, setSelectedSize] = useState(null);

  // Imagem universal
  const img = item.imageUrl || item.image || item.preview;

  // Determina se o item é um produto com tamanhos
  const hasSizes = item.sizes && item.sizes.length > 0;

  // 🆕 Define o primeiro tamanho como padrão ao abrir, se houver tamanhos
  useEffect(() => {
    if (hasSizes && !selectedSize) {
      // Define o primeiro tamanho como o padrão
      setSelectedSize(item.sizes[0]);
    }
    // Se não tiver tamanhos, garante que selectedSize é null
    if (!hasSizes && selectedSize !== null) {
      setSelectedSize(null);
    }
  }, [item, hasSizes, selectedSize]);

  // 🆕 Preço base:
  // - Se um tamanho for selecionado, usa o preço desse tamanho.
  // - Se não, usa o preço universal do item (preço fixo de combo ou preço base).
  const basePrice = useMemo(() => {
    if (selectedSize) {
      return selectedSize.price;
    }

    // Preço universal (usado para combos ou produtos sem sizes)
    return (
      item.finalPrice ??
      item.price ??
      item.originalPrice ??
      item.displayPrice ?? // Preço mínimo do cardápio
      0
    );
  }, [item, selectedSize]);

  // Preço total a ser exibido no botão
  const totalButtonPrice = basePrice * qty;

  // Objeto do item a ser enviado para o carrinho
  const itemToCart = useMemo(() => {
    // Criamos uma cópia para não alterar o objeto 'item' original
    const cartItem = {
      ...item,
      price: basePrice // Garante que o item no carrinho tenha o preço correto
    };

    // Se um tamanho foi selecionado, adicionamos o nome e ID do tamanho ao item
    if (selectedSize) {
      cartItem.size = selectedSize.name;
      cartItem.sizeId = selectedSize.id;
    }

    return cartItem;
  }, [item, basePrice, selectedSize]);


  // Lógica de adicionar ao carrinho
  const handleAddToCart = () => {
    // Trava se for produto e nenhum tamanho foi selecionado (segurança)
    if (hasSizes && !selectedSize) return;

    onAdd(itemToCart, qty);
    onClose();
  };

  // formatação do preço em BRL
  const formatPrice = (p) => p.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


  return (
    <div className="details-overlay">
      <div className="details-modal">

        {/* BOTÃO FECHAR */}
        <button className="close-btn" onClick={onClose}>✕</button>

        {/* IMAGEM */}
        <div className="details-image">
          <img src={img} alt={item.name} />
        </div>

        {/* TÍTULO E DESCRIÇÃO */}
        <div className="details-info">
          <h2>{item.name}</h2>
          <p className="description">{item.description}</p>

          {/* SELEÇÃO DE VARIANTE DE TAMANHO */}
          {hasSizes && (
            <div className="size-selection">
              <h3>Escolha o tamanho:</h3>
              <div className="size-options">
                {item.sizes.map((size) => (
                  <button
                    key={size.name}
                    className={`size-btn ${selectedSize?.name === size.name ? "active" : ""
                      }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    <span className="size-name">{size.name}</span>
                    <span className="size-price">{formatPrice(size.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PREÇO DESTAQUE (Apenas se não houver tamanhos selecionáveis) */}
          {!hasSizes && (
            <div className="price-highlight">
              {formatPrice(basePrice)}
            </div>
          )}


          {/* QUANTIDADE */}
          <div className="qty-row">
            <button
              className="qty-btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
            >
              -
            </button>

            <span className="qty-number">{qty}</span>

            <button
              className="qty-btn"
              onClick={() => setQty(qty + 1)}
            >
              +
            </button>
          </div>

          {/* ADICIONAR AO CARRINHO */}
          <button
            className="btn-add"
            onClick={handleAddToCart}
            // Desabilita se for produto com tamanhos, mas nenhum selecionado
            disabled={hasSizes && !selectedSize}
          >
            Adicionar • {formatPrice(totalButtonPrice)}
          </button>
        </div>

      </div>
    </div>
  );
}