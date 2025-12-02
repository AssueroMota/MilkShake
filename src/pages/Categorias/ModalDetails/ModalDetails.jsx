// ModalDetails.jsx
import React from "react";
import "./ModalDetails.scss";

const ModalDetails = ({ open, category, onClose }) => {
  if (!open || !category) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-details-card">

        <div className="details-header">
          <h2>Detalhes da Categoria</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="details-body">

          <div className="details-image">
            <img src={category.imageUrl} alt={category.name} />
          </div>

          <div className="details-info">
            <h3 className="details-title">{category.name}</h3>

            <p className="status-line">
              <strong>Status:</strong>
              <span
                className={`status-chip ${
                  category.active ? "active" : "inactive"
                }`}
              >
                {category.active ? "Ativa" : "Inativa"}
              </span>
            </p>
          </div>
        </div>

        <div className="details-footer">
          <button className="btn-close" onClick={onClose}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalDetails;
