import React from "react";
import "./ModalComboDelete.scss";

const ModalComboDelete = ({ open, combo, onClose, onConfirm }) => {
  if (!open || !combo) return null;

  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div
        className="modal-delete slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <h2>Excluir Combo</h2>

        {/* MESSAGE */}
        <p>
          Tem certeza que deseja excluir o combo{" "}
          <strong>{combo.name}</strong>?
        </p>

        {/* PRODUCTS INFO */}
        {combo.items?.length > 0 && (
          <p className="info-small">
            Este combo contém <strong>{combo.items.length}</strong> produto
            {combo.items.length > 1 ? "s" : ""}.
          </p>
        )}

        {/* ACTIONS */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>

          <button
            className="btn-confirm"
            onClick={() => onConfirm(combo)}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalComboDelete;
