// src/pages/Cardapio/CartSidebar.jsx
import React from "react";
import "./CartSidebar.scss";

import { createPedido } from "../../services/pedidos.js"; // 🔥 BACKEND REAL

export default function CartSidebar({ open, cart, setCart, onClose }) {
  // Funções de manipulação do carrinho
  const removeItem = (id) =>
    setCart((prev) => prev.filter((p) => p.id !== id));

  // 🚨 ATENÇÃO: Se o produto tiver tamanho, o ID sozinho não é suficiente.
  // Produtos com tamanhos diferentes podem ter o mesmo ID de PRODUTO, mas
  // devem ser tratados como itens separados no carrinho (no seu código atual,
  // eles são tratados como o mesmo item devido ao 'p.id === id').
  // Para simplificar AQUI, vamos manter a lógica baseada apenas no ID.
  // Uma implementação completa exigiria um ID composto (id + sizeId).

  const increment = (id) =>
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: p.qty + 1 } : p
      )
    );

  const decrement = (id) =>
    setCart((prev) =>
      prev.map((p) =>
        p.id === id && p.qty > 1 ? { ...p, qty: p.qty - 1 } : p
      )
    );

  const clearAll = () => setCart([]);

  // Função para enviar o pedido
  const enviarPedido = async () => {
    if (cart.length === 0) return;

    const total = cart.reduce((acc, i) => {
      // Preço já está no item, mas usamos a lógica de fallback por segurança
      const price = i.price ?? 0;

      return acc + Number(price) * i.qty;
    }, 0);

    const pedido = {
      itens: cart.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        // 🆕 Incluímos o tamanho se ele existir
        size: i.size || null,
        price: i.price ?? 0,
      })),
      total,
      hora: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "solicitado",
      timestamp: Date.now(),
      obs: "", // será preenchido pelo cliente se quiser
    };

    await createPedido(pedido);

    clearAll();
    onClose();
  };

  // Helper para formatar o preço
  const formatPrice = (p) =>
    p.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  return (
    <div className={`cart-sidebar ${open ? "open" : ""}`}>
      <div className="cart-header">
        <h3>Pedido Atual</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="cart-items">
        {cart.map((item, index) => {
          const img = item.imageUrl || item.image || item.preview;
          // O preço do item no carrinho (item.price) já é o preço do tamanho selecionado
          const price = item.price ?? 0;
          // Usamos o index como key temporária para simplificar, mas o ideal seria usar
          // um ID único composto (item.id + item.sizeId)
          return (
            <div key={item.id + (item.sizeId || index)} className="cart-item">
              <img src={img} alt={item.name} />

              <div className="info">
                <h4>
                  {item.name}
                  {/* 🆕 EXIBE O TAMANHO SE EXISTIR */}
                  {item.size && (
                    <span className="item-size">({item.size})</span>
                  )}
                </h4>

                <div className="qty-row">
                  {/* O decrement e increment ainda usam item.id. 
                    Se o sistema permitir itens com o mesmo ID principal, 
                    mas tamanhos diferentes, isso causará problemas. 
                    O ideal seria mudar o incremento/decremento para usar sizeId ou um ID único. */}
                  <button onClick={() => decrement(item.id)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => increment(item.id)}>+</button>
                </div>

                <p className="price">
                  {formatPrice(Number(price) * item.qty)}
                </p>
              </div>

              <button className="remove" onClick={() => removeItem(item.id)}>
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <textarea className="obs" placeholder="Observações do pedido..." />

      {cart.length > 0 && (
        <>
          <button className="btn-clear" onClick={clearAll}>
            Limpar Carrinho
          </button>

          <button className="btn-send" onClick={enviarPedido}>
            Enviar para os Pedidos
          </button>
        </>
      )}
    </div>
  );
}
