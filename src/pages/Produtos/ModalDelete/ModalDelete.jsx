import React from "react";
import "./ModalDelete.scss";

const ModalDelete = ({ open, onClose, onConfirm, product }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-delete" onClick={(e) => e.stopPropagation()}>
        <h2>Excluir Produto</h2>

        <p>
          Tem certeza que deseja excluir <strong>{product?.name}</strong> do cardápio?
        </p>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="btn-confirm"
            onClick={() => onConfirm(product.id)}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDelete;
