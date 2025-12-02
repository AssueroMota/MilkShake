import React, { useState, useEffect } from "react";
import "./ModalProductForm.scss";

const ModalProductForm = ({ open, product, mode, onClose, onSave, categories }) => {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    categoryName: "",
    active: true,
    description: "",
    image: null,
    preview: null,
    sizes: [{ size: "", price: "" }],
  });

  /* ========================================================
      CARREGAR PRODUTO AO EDITAR
  ======================================================== */
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        categoryId: product.categoryId || "",
        categoryName: product.category || "",
        active: product.active,
        description: product.description || "",
        image: null,
        preview: product.imageUrl || null,
        sizes: product.sizes?.length
          ? product.sizes.map((s) => ({
              size: s.size,
              price: String(s.price).replace(".", ","),
            }))
          : [{ size: "", price: "" }],
      });
    }
  }, [product]);

  if (!open) return null;

  /* ========================================================
      UPLOAD DE IMAGEM
  ======================================================== */
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  /* ========================================================
      FORMATAR PREÇO
  ======================================================== */
  const formatPriceInput = (value) => {
    let digits = value.replace(/\D/g, "");
    let float = (parseInt(digits, 10) / 100).toFixed(2);
    return float.replace(".", ",");
  };

  /* ========================================================
      SALVAR PRODUTO FINAL
  ======================================================== */
  const handleSubmit = (e) => {
    e.preventDefault();

    const finalSizes = form.sizes
      .filter((s) => s.size.trim() !== "" && s.price.trim() !== "")
      .map((s) => ({
        size: s.size,
        price: parseFloat(String(s.price).replace(",", ".")),
      }));

    onSave({
      name: form.name,
      categoryId: form.categoryId,
      category: form.categoryName,
      sizes: finalSizes,
      active: form.active,
      description: form.description,
      image: form.image,
      preview: form.preview,
    });
  };

  return (
    <div className="modal-overlay fade-in">
      <div className="modal-form slide-up">

        {/* ========================================================
            HEADER
        ======================================================== */}
        <div className="modal-form-header">
          <h2>{mode === "add" ? "Adicionar Produto" : "Editar Produto"}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* ========================================================
            FORM
        ======================================================== */}
        <form id="product-form" className="modal-form-body" onSubmit={handleSubmit}>

          {/* LEFT SIDE */}
          <div className="form-left">
            <div className="image-box">
              {form.preview ? (
                <img src={form.preview} alt="preview" />
              ) : (
                <span className="placeholder">Sem Imagem</span>
              )}

              <label className="btn-upload">
                Selecionar Imagem
                <input type="file" accept="image/*" onChange={onFileChange} />
              </label>
            </div>

            {/* STATUS */}
            <div className="switch-box">
              <label>Status</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, active: e.target.checked }))
                  }
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="form-right">

            {/* NOME */}
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* CATEGORIA */}
            <div className="form-group">
              <label>Categoria</label>
              <select
                value={form.categoryId}
                onChange={(e) => {
                  const id = e.target.value;
                  const cat = categories.find((c) => c.id === id);

                  setForm((prev) => ({
                    ...prev,
                    categoryId: id,
                    categoryName: cat?.name || "",
                  }));
                }}
                required
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TAMANHOS */}
            <div className="form-group">
              <label>Tamanhos e Preços</label>

              {form.sizes.map((item, index) => (
                <div key={index} className="sizes-row">

                  {/* TAMANHO */}
                  <input
                    type="text"
                    placeholder="Ex: 250ml"
                    value={item.size}
                    onChange={(e) => {
                      const newSizes = [...form.sizes];
                      newSizes[index].size = e.target.value;
                      setForm((prev) => ({ ...prev, sizes: newSizes }));
                    }}
                    required
                  />

                  {/* PREÇO */}
                  <input
                    type="text"
                    placeholder="Preço"
                    value={item.price}
                    onChange={(e) => {
                      const newSizes = [...form.sizes];
                      newSizes[index].price = formatPriceInput(e.target.value);
                      setForm((prev) => ({ ...prev, sizes: newSizes }));
                    }}
                    required
                  />

                  {/* REMOVE */}
                  <button
                    type="button"
                    className="remove-size"
                    onClick={() => {
                      const newSizes = form.sizes.filter((_, i) => i !== index);
                      setForm((prev) => ({ ...prev, sizes: newSizes }));
                    }}
                  >
                    X
                  </button>
                </div>
              ))}

              {/* ADD SIZE */}
              <button
                type="button"
                className="add-size"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    sizes: [...prev.sizes, { size: "", price: "" }],
                  }))
                }
              >
                + Adicionar Tamanho
              </button>
            </div>

            {/* DESCRIÇÃO */}
            <div className="form-group">
              <label>Descrição</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
          </div>
        </form>

        {/* ========================================================
            FOOTER
        ======================================================== */}
        <div className="modal-form-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>

          <button
            type="submit"
            form="product-form"
            className="btn-primary"
          >
            Salvar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalProductForm;
