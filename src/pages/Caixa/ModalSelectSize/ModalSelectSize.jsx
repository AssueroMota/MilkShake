// src/pages/Caixa/ModalSelectSize.jsx
import React from "react";
import "./ModalSelectSize.scss";

export default function ModalSelectSize({ open, product, onClose, onSelect }) {
  if (!open || !product) return null;

  return (
    <div className="select-size-overlay">
      <div className="select-size-box">
        {/* BOTÃO X */}
        <button className="close-x" onClick={onClose}>
          ×
        </button>

        <h2>Escolha o tamanho</h2>
        <p className="product-name">{product.name}</p>

        <div className="sizes-list">
          {product.sizes?.length > 0 ? (
            product.sizes.map((s, index) => (
              <button
                key={index}
                className="size-option"
                onClick={() => {
                  onSelect(s);   // devolve o tamanho pro Caixa.jsx
                }}
              >
                <span>{s.size}</span>
                <strong>
                  {Number(s.price || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </button>
            ))
          ) : (
            <p>Nenhum tamanho disponível</p>
          )}
        </div>
      </div>
    </div>
  );
}
