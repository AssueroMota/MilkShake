import React, { useEffect, useMemo, useState } from "react";
import "./ModalComboForm.scss";

const ModalComboForm = ({
  open,
  combo,
  mode, // "add" | "edit"
  onClose,
  onSave,
  products = [],
  categories = [],
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0]?.name || "");

  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null); // imageUrl ou file preview

  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState(0);

  const [selectedProductIds, setSelectedProductIds] = useState([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // =========================================================
  // 🔧 Helper de preço base (usa tamanhos se tiver)
  // =========================================================
  const getBasePrice = (product) => {
    // Se tiver tamanhos (sizes), usamos o menor preço
    if (product.sizes && product.sizes.length > 0) {
      const prices = product.sizes.map((s) => Number(s.price || 0));
      const min = Math.min(...prices);
      return Number.isFinite(min) ? min : 0;
    }

    // Fallback: usa product.price se existir
    const value = Number(product.price || 0);
    return Number.isFinite(value) ? value : 0;
  };

  // ==========================================
  // 🔵 PRELOAD PARA EDITAR / ADICIONAR
  // ==========================================
  useEffect(() => {
    if (combo) {
      setName(combo.name || "");
      setCategory(combo.category || categories[0]?.name || "");
      setDescription(combo.description || "");
      setActive(combo.active ?? true);

      setPreview(combo.imageUrl || null);

      setDiscountType(combo.discountType || "none");
      setDiscountValue(combo.discountValue || 0);

      setSelectedProductIds(combo.items?.map((i) => i.id) || []);
      setImageFile(null);
    } else {
      // MODO ADD
      setName("");
      setCategory(categories[0]?.name || "");
      setDescription("");
      setActive(true);
      setPreview(null);
      setImageFile(null);
      setDiscountType("none");
      setDiscountValue(0);
      setSelectedProductIds([]);
    }
  }, [combo, categories]);

  if (!open) return null;

  // ==========================================
  // 🔵 Upload Preview
  // ==========================================
  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // ==========================================
  // 🔥 FILTRAR SOMENTE PRODUTOS ATIVOS
  //     (e que pertençam a categorias ativas)
  // ==========================================
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.active);

    // Só produtos de categorias presentes em `categories` (que já vêm só ativas)
    if (categories.length > 0) {
      list = list.filter((p) =>
        categories.some((c) => c.name === p.category)
      );
    }

    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [products, search, categoryFilter, categories]);

  const selectedItems = useMemo(
    () => products.filter((p) => selectedProductIds.includes(p.id)),
    [products, selectedProductIds]
  );

  // ==========================================
  // 🔵 CÁLCULO DE PREÇOS (usando getBasePrice)
  // ==========================================
  const { originalPrice, finalPrice, discountAmount } = useMemo(() => {
    const total = selectedItems.reduce(
      (sum, p) => sum + getBasePrice(p),
      0
    );

    let discount = 0;
    if (discountType === "percent") {
      discount = (total * Number(discountValue || 0)) / 100;
    } else if (discountType === "value") {
      discount = Number(discountValue || 0);
    }

    let final = total - discount;
    if (final < 0) final = 0;

    return {
      originalPrice: total,
      finalPrice: final,
      discountAmount: discount,
    };
  }, [selectedItems, discountType, discountValue]);

  // ==========================================
  // 🔵 TOGGLE PRODUTO
  // ==========================================
  const toggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id)
        ? prev.filter((pid) => pid !== id)
        : [...prev, id]
    );
  };

  // ==========================================
  // 🔵 SUBMIT
  // ==========================================
  const handleSubmit = (e) => {
    e?.preventDefault();

    if (!name.trim()) return alert("Informe o nome do combo.");
    if (!category.trim()) return alert("Selecione uma categoria.");
    if (!description.trim()) return alert("A descrição é obrigatória.");
    if (selectedItems.length === 0)
      return alert("Selecione pelo menos 1 produto.");

    onSave({
      name: name.trim(),
      category: category.trim(),
      description: description.trim(),
      active,
      items: selectedItems.map((i) => ({
        id: i.id,
        name: i.name,
        // salva o mesmo base price usado nos cálculos
        price: getBasePrice(i),
        image: i.imageUrl,
        category: i.category,
      })),

      discountType,
      discountValue:
        discountType === "none" ? 0 : Number(discountValue || 0),

      // Esses totais são só de referência (Combos.jsx recalcula também)
      totalOriginal: Number(originalPrice || 0),
      totalFinal: Number(finalPrice || 0),

      image: imageFile || null,
      preview,
    });
  };

  // ==========================================
  // 🔵 UI
  // ==========================================
  return (
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div
        className="modal-combo-form slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-form-header">
          <h2>{mode === "add" ? "Adicionar Combo" : "Editar Combo"}</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="modal-form-body">
          {/* LEFT */}
          <div className="form-left">
            <div className="image-box">
              {preview ? (
                <img src={preview} alt="preview combo" />
              ) : (
                <span className="placeholder">Sem imagem</span>
              )}

              <label className="btn-upload">
                Selecionar Imagem
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                />
              </label>
            </div>

            <div className="switch-box">
              <label>Status do combo</label>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="resume-box">
              <h4>Resumo de preços</h4>

              <p>
                <span>Total dos produtos:</span>
                <strong>
                  {originalPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </p>

              <p>
                <span>Desconto:</span>
                <strong>
                  {discountAmount > 0
                    ? discountType === "percent"
                      ? `${Number(discountValue || 0)}%`
                      : discountAmount.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                    : "Nenhum"}
                </strong>
              </p>

              <p className="resume-final">
                <span>Preço final do combo:</span>
                <strong>
                  {finalPrice.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="form-right">
            {/* NOME */}
            <div className="form-group">
              <label>Nome do Combo</label>
              <input
                type="text"
                placeholder="Ex: Combo Burger Deluxe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* CATEGORIA DO COMBO */}
            <div className="form-group">
              <label>Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIÇÃO */}
            <div className="form-group">
              <label>Descrição (obrigatória)</label>
              <input
                type="text"
                maxLength={140}
                placeholder="Resumo curto do combo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* DESCONTO */}
            <div className="discount-section">
              <label>Desconto do combo</label>

              <div className="discount-modes">
                <button
                  type="button"
                  className={`mode-btn ${
                    discountType === "none" ? "active" : ""
                  }`}
                  onClick={() => setDiscountType("none")}
                >
                  Sem desconto
                </button>

                <button
                  type="button"
                  className={`mode-btn ${
                    discountType === "percent" ? "active" : ""
                  }`}
                  onClick={() => setDiscountType("percent")}
                >
                  %
                </button>

                <button
                  type="button"
                  className={`mode-btn ${
                    discountType === "value" ? "active" : ""
                  }`}
                  onClick={() => setDiscountType("value")}
                >
                  R$
                </button>
              </div>

              {discountType === "percent" && (
                <div className="discount-input">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                  <span className="suffix">%</span>
                </div>
              )}

              {discountType === "value" && (
                <div className="discount-input">
                  <span className="prefix">R$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* PRODUTOS */}
            <div className="products-section">
              <div className="products-header">
                <label>Produtos do combo</label>

                <span className="badge-count">
                  {selectedItems.length} selecionado
                  {selectedItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* FILTROS */}
              <div className="products-filters">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="category-filter">
 <select
  value={categoryFilter}
  onChange={(e) => setCategoryFilter(e.target.value)}
>
  <option value="all">Todas categorias</option>

  {categories
    .filter((c) => c.active)        // 🔥 SOMENTE CATEGORIAS ATIVAS
    .map((c) => (
      <option key={c.id} value={c.name}>
        {c.name}
      </option>
    ))}
</select>
                </div>
              </div>

              {/* LISTA DE PRODUTOS */}
              <div className="products-list">
                {filteredProducts.map((p) => {
                  const checked = selectedProductIds.includes(p.id);
                  const price = getBasePrice(p);

                  return (
                    <label
                      key={p.id}
                      className={`product-item ${
                        checked ? "selected" : ""
                      }`}
                    >
                      <div className="left">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduct(p.id)}
                        />

                        <img src={p.imageUrl} alt={p.name} />

                        <div className="info">
                          <span className="name">{p.name}</span>
                          <span className="category">{p.category}</span>
                        </div>
                      </div>

                      <div className="right">
                        <span className="price">
                          {price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-form-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>

          <button className="btn-primary" onClick={handleSubmit}>
            Salvar Combo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalComboForm;
