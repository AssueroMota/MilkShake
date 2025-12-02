// src/pages/Combos/ModalComboDetails.jsx
import React from "react";
import "./ModalComboDetails.scss";

const ModalComboDetails = ({ open, combo, onClose }) => {
  if (!open || !combo) return null;

  return (
    <div className="pcd-overlay" onClick={onClose}>
      <div
        className="pcd-card"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="pcd-header">
          <h2>Detalhes do Combo</h2>
          <button className="pcd-close-btn" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div className="pcd-body">

          {/* IMAGEM */}
          <div className="pcd-image">
            <img
              src={combo.imageUrl || combo.image || combo.preview}
              alt={combo.name}
            />
          </div>

          {/* INFORMAÇÕES */}
          <div className="pcd-info">

            <h3 className="pcd-title">{combo.name}</h3>

            <div className="pcd-info-group">
              <p>
                <strong>Categoria:</strong> {combo.category}
              </p>

              <p>
                <strong>Produtos Inclusos:</strong> {combo.items?.length || 0} itens
              </p>

              <p>
                <strong>Preço Original:</strong>{" "}
                {Number(combo.originalPrice || 0).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>

              <p className="pcd-price-final">
                <strong>Preço Final:</strong>{" "}
                <span>
                  {Number(combo.finalPrice || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </p>

              <p className="pcd-status-line">
                <strong>Status:</strong>
                <span
                  className={`pcd-status-chip ${
                    combo.active ? "pcd-active" : "pcd-inactive"
                  }`}
                >
                  {combo.active ? "Ativo" : "Inativo"}
                </span>
              </p>
            </div>

            <p className="pcd-description-title">Descrição</p>
            <p className="pcd-description-text">
              {combo.description || "Sem descrição"}
            </p>

          </div>
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="pcd-products">
          <h4>Produtos do Combo</h4>

          <ul>
            {combo.items?.map((item) => (
              <li key={item.id}>
                <img src={item.imageUrl || item.image} alt={item.name} />
                <span>{item.name}</span>

                <span className="pcd-item-price">
                  {Number(item.price || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* FOOTER */}
        <div className="pcd-footer">
          <button className="pcd-btn-close" onClick={onClose}>Fechar</button>
        </div>

      </div>
    </div>
  );
};

export default ModalComboDetails;
