import React, { useState, useEffect } from "react";
import "./ModalCategoryForm.scss";

import { uploadImage } from "../../../services/cloudinary";
import { createCategory, updateCategory } from "../../../services/categories";

const ModalCategoryForm = ({ open, mode, category, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    active: true,
    imageFile: null,
    preview: null,
    oldPublicId: null,
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        active: category.active,
        preview: category.imageUrl,
        oldPublicId: category.imagePublicId,
        imageFile: null,
      });
    }
  }, [category]);

  if (!open) return null;

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      imageFile: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = category?.imageUrl || "";
    let imagePublicId = category?.imagePublicId || "";

    // 🔥 Enviar nova imagem SE o usuário trocar
    if (form.imageFile) {
      const uploaded = await uploadImage(form.imageFile, "categories");
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;

      console.log("⚠️ DEBUG: antiga", form.oldPublicId);
      console.log("⚠️ DEBUG: nova", imagePublicId);
    }

    const payload = {
      name: form.name,
      active: form.active,
      imageUrl,
      imagePublicId,
    };

    if (mode === "add") {
      await createCategory(payload);
    } else {
      await updateCategory(category.id, payload);
    }

    onClose();
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-form slide-up">

        <div className="modal-form-header">
          <h2>{mode === "add" ? "Adicionar Categoria" : "Editar Categoria"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="modal-form-body" onSubmit={handleSubmit}>

          <div className="form-left">

            <div className="image-box">
              {form.preview ? (
                <img src={form.preview} alt="" />
              ) : (
                <span className="placeholder">Sem Imagem</span>
              )}

              <label className="btn-upload">
                Selecionar Imagem
                <input type="file" accept="image/*" onChange={onFileChange} />
              </label>
            </div>

            <div className="switch-box">
              <label>Status</label>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, active: e.target.checked }))
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="form-right">
            <div className="form-group">
              <label>Nome da Categoria</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
              />
            </div>
          </div>

        </form>

        <div className="modal-form-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSubmit}>Salvar</button>
        </div>

      </div>
    </div>
  );
};

export default ModalCategoryForm;
