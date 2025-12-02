// src/pages/Produtos/ModalDetails.jsx
import React from "react";
import "./ModalDetails.scss";

const ModalDetails = ({ open, product, onClose }) => {
  if (!open || !product) return null;

  // Função para pegar menor preço
  const getMinPrice = () => {
    if (!product.sizes || product.sizes.length === 0) return null;
    return Math.min(...product.sizes.map((s) => s.price));
  };

  const minPrice = getMinPrice();

  return (
    <div className="pd-overlay">
      <div className="pd-card">

        {/* HEADER */}
        <div className="pd-header">
          <h2>Detalhes do Produto</h2>
          <button className="pd-close-btn" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div className="pd-body">

          {/* IMAGEM */}
          <div className="pd-image">
            <img src={product.imageUrl} alt={product.name} />
          </div>

          {/* INFO */}
          <div className="pd-info">

            <h3 className="pd-title">{product.name}</h3>

            <div className="pd-info-group">
              <p><strong>Categoria:</strong> {product.category}</p>

              {/* PREÇO MÍNIMO */}
              {minPrice !== null && (
                <p>
                  <strong>A partir de:</strong>{" "}
                  {minPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              )}

              {/* TAMANHOS */}
              <div className="pd-sizes-list">
                <p><strong>Tamanhos disponíveis:</strong></p>

                {product.sizes && product.sizes.length > 0 ? (
                  <ul>
                    {product.sizes.map((s, index) => (
                      <li key={index}>
                        {s.size} —{" "}
                        {s.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Sem tamanhos cadastrados.</p>
                )}
              </div>

              {/* STATUS */}
              <p className="pd-status-line">
                <strong>Status:</strong>
                <span
                  className={`pd-status-chip ${product.active ? "pd-active" : "pd-inactive"}`}
                >
                  {product.active ? "Ativo" : "Inativo"}
                </span>
              </p>
            </div>

            {/* DESCRIÇÃO */}
            <p className="pd-description-title">Descrição</p>
            <p className="pd-description-text">
              {product.description || "Sem descrição"}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="pd-footer">
          <button className="pd-btn-close" onClick={onClose}>Fechar</button>
        </div>

      </div>
    </div>
  );
};

export default ModalDetails;
