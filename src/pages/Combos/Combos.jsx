import React, { useMemo, useState, useEffect } from "react";
import "./Combos.scss";

// MODAIS
import ModalComboDelete from "./ModalComboDelete/ModalComboDelete.jsx";
import ModalComboDetails from "./ModalComboDetails/ModalComboDetails.jsx";
import ModalComboForm from "./ModalComboForm/ModalComboForm.jsx";

// SERVICES
import {
  listenCombos,
  createCombo,
  updateCombo,
  deleteCombo,
} from "../../services/combos";

import { listenProducts } from "../../services/products";
import { listenCategories } from "../../services/categories";
import { uploadImage } from "../../services/cloudinary";

const Combos = ({ searchQuery }) => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [viewMode, setViewMode] = useState("grid");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("bestseller");

  const [deleteModal, setDeleteModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [comboFormModal, setComboFormModal] = useState(null);

  // ===========================
  // 🔥 LISTEN EM TEMPO REAL — COMBOS
  // ===========================
  useEffect(() => {
    const unsub = listenCombos((list) => setCombos(list));
    return () => unsub && unsub();
  }, []);

  // 🔥 LISTEN PRODUTOS (para validar combos)
  useEffect(() => {
    const unsub = listenProducts((list) => setProducts(list));
    return () => unsub && unsub();
  }, []);

  // 🔥 LISTEN CATEGORIAS
  useEffect(() => {
    const unsub = listenCategories((list) => setCategories(list));
    return () => unsub && unsub();
  }, []);

  // ======================================
  // 🔵 SELECT DE CATEGORIAS (apenas ativas)
  // ======================================
  const comboCategories = useMemo(() => {
    return ["Todas as Categorias", ...categories.filter(c => c.active).map(c => c.name)];
  }, [categories]);


  // ======================================
  // 🔵 LISTA FILTRADA + REGRAS DE ACTIVE/INACTIVE
  // ======================================
  const filteredCombos = useMemo(() => {
    let list = [...combos];

    // 🔥 1. Se a categoria do combo está INATIVA → combo fica inativo
    list = list.map((combo) => {
      const cat = categories.find((c) => c.name === combo.category);
      if (cat && cat.active === false) {
        return { ...combo, active: false };
      }
      return combo;
    });

    // 🔥 2. Se QUALQUER item do combo estiver INATIVO → combo fica inativo
    list = list.map((combo) => {
      const hasInactiveItem = combo.items.some((item) => {
        const product = products.find((p) => p.id === item.id);
        return product && product.active === false;
      });

      if (hasInactiveItem) {
        return { ...combo, active: false };
      }

      return combo;
    });

    // Filtro por categoria
    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category === categoryFilter);
    }

    // Filtro por status
    if (statusFilter !== "all") {
      list = list.filter((c) =>
        statusFilter === "active" ? c.active : !c.active
      );
    }

    // Filtro por busca
    if (searchQuery?.trim()) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenação
    if (sortBy === "bestseller") {
      list.sort((a, b) => b.orders - a.orders);
    }
    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    }
    if (sortBy === "price-asc") {
      list.sort((a, b) => a.finalPrice - b.finalPrice);
    }
    if (sortBy === "price-desc") {
      list.sort((a, b) => b.finalPrice - a.finalPrice);
    }

    return list;
  }, [combos, products, categories, categoryFilter, statusFilter, sortBy, searchQuery]);

  // =============================
  // 🔵 STATUS
  // =============================
  const toggleStatus = async (combo) => {
    await updateCombo(combo.id, { active: !combo.active });
  };

  // =============================
  // 🔵 DELETE
  // =============================
  const handleDelete = async () => {
    if (!deleteModal) return;

    // Remove imagem do Cloudinary se tiver
    if (deleteModal.imagePublicId) {
      await fetch(`${import.meta.env.VITE_SERVER_URL}/delete-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: deleteModal.imagePublicId }),
      });
    }

    await deleteCombo(deleteModal.id);
    setDeleteModal(null);
  };

  // =============================
  // 🔵 ADD / EDIT (com Cloudinary)
  // =============================
  const handleSaveCombo = async (data) => {
    let imageUrl = comboFormModal?.combo?.imageUrl || null;
    let imagePublicId = comboFormModal?.combo?.imagePublicId || null;

    // Upload de nova imagem
    if (data.image) {
      if (imagePublicId) {
        await fetch(`${import.meta.env.VITE_SERVER_URL}/delete-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: imagePublicId }),
        });
      }

      const uploaded = await uploadImage(data.image, "combos");
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    // Preço original
    const originalPrice = data.items.reduce(
      (sum, item) => sum + item.price,
      0
    );

    // DESCONTO
    let discountAmount = 0;
    if (data.discountType === "percent") {
      discountAmount = (originalPrice * data.discountValue) / 100;
    } else if (data.discountType === "value") {
      discountAmount = data.discountValue;
    }

    let finalPrice = originalPrice - discountAmount;
    if (finalPrice < 0) finalPrice = 0;

    const payload = {
      name: data.name,
      category: data.category,
      description: data.description,
      active: data.active,
      discountType: data.discountType,
      discountValue: data.discountValue,
      items: data.items,
      originalPrice,
      finalPrice,
      imageUrl,
      imagePublicId,
      orders: data.orders || 0,
    };

    if (comboFormModal.mode === "add") {
      await createCombo(payload);
    } else {
      await updateCombo(comboFormModal.combo.id, payload);
    }

    setComboFormModal(null);
  };

  return (
    <div className="combos-page">
      {/* HEADER */}
      <div className="combos-header">
        <h1>Combos do Cardápio</h1>

        <button
          className="btn-add"
          onClick={() => setComboFormModal({ mode: "add", combo: null })}
        >
          <span className="add-icon" />
          Adicionar Combo
        </button>
      </div>

      {/* FILTROS */}
      <div className="combos-filtros">
        <div className="filtro-item">
          <label>Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value === "Todas as Categorias" ? "all" : e.target.value
              )
            }
          >
            {comboCategories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filtro-item">
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <div className="filtro-item">
          <label>Ordenar por</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="bestseller">Mais vendidos</option>
            <option value="name-asc">Nome A-Z</option>
            <option value="name-desc">Nome Z-A</option>
            <option value="price-asc">Preço menor-maior</option>
            <option value="price-desc">Preço maior-menor</option>
          </select>
        </div>

        <div className="view-buttons">
          <button
            className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <span className="grid-icon" />
          </button>

          <button
            className={`view-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <span className="list-icon" />
          </button>
        </div>
      </div>

      {/* GRID */}
      {viewMode === "grid" && (
        <div className="combos-grid">
          {filteredCombos.map((combo) => (
            <div
              key={combo.id}
              className={`combo-card ${!combo.active ? "inativo-card" : ""}`}
            >
              <div className="combo-img" onClick={() => setDetailsModal(combo)}>
                {combo.imageUrl && (
                  <img src={combo.imageUrl} alt={combo.name} />
                )}
              </div>

              <div className="combo-info">
                <h3>{combo.name}</h3>
                <p className="combo-desc">{combo.description}</p>

                <p className="combo-items">
                  <span className="dot" />
                  {combo.items.length} itens inclusos
                </p>

                <div className="combo-prices">
                  {combo.originalPrice !== combo.finalPrice && (
                    <span className="old-price">
                      De{" "}
                      {combo.originalPrice.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  )}

                  <span className="final-price">
                    Por{" "}
                    {combo.finalPrice.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <span
                  className={`status ${combo.active ? "ativo" : "inativo"}`}
                >
                  {combo.active ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="combo-actions">
                <div className="combo-actions-2">
                  <button
                    className="btn-editar"
                    onClick={() =>
                      setComboFormModal({ mode: "edit", combo })
                    }
                  >
                    <span className="icon-editar" />
                    Editar
                  </button>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={combo.active}
                      onChange={() => toggleStatus(combo)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="combo-actions-delete">
                  <button
                    className="btn-delete"
                    onClick={() => setDeleteModal(combo)}
                  >
                    <span className="icon-trash" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE */}
      {viewMode === "list" && (
        <table className="combos-table">
          <thead>
            <tr>
              <th>Combo</th>
              <th>Categoria</th>
              <th>Itens</th>
              <th>Preço</th>
              <th>Status</th>
              <th style={{ width: "180px" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredCombos.map((combo) => (
              <tr
                key={combo.id}
                className={!combo.active ? "inativo-row" : ""}
              >
                <td className="td-combo" onClick={() => setDetailsModal(combo)}>
                  {combo.imageUrl && (
                    <img src={combo.imageUrl} alt={combo.name} />
                  )}
                  <div>
                    <strong>{combo.name}</strong>
                    <span className="table-desc">{combo.description}</span>
                  </div>
                </td>

                <td>{combo.category}</td>
                <td>{combo.items.length} itens</td>

                <td className="td-preco">
                  <div className="price-wrapper">
                    {combo.originalPrice !== combo.finalPrice && (
                      <span className="old-price">
                        {combo.originalPrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    )}

                    <span className="final-price">
                      {combo.finalPrice.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </span>
                  </div>
                </td>

                <td>
                  <span
                    className={`status ${combo.active ? "ativo" : "inativo"}`}
                  >
                    {combo.active ? "Ativo" : "Inativo"}
                  </span>
                </td>

                <td className="td-actions">
                  <button
                    className="btn-editar"
                    onClick={() =>
                      setComboFormModal({ mode: "edit", combo })
                    }
                  >
                    <span className="icon-editar" />
                    Editar
                  </button>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={combo.active}
                      onChange={() => toggleStatus(combo)}
                    />
                    <span className="slider"></span>
                  </label>

                  <button
                    className="btn-delete"
                    onClick={() => setDeleteModal(combo)}
                  >
                    <span className="icon-trash" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* MODAIS */}
      {deleteModal && (
        <ModalComboDelete
          open={true}
          combo={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}

      {detailsModal && (
        <ModalComboDetails
          open={true}
          combo={detailsModal}
          onClose={() => setDetailsModal(null)}
        />
      )}

      {comboFormModal && (
        <ModalComboForm
          open={true}
          combo={comboFormModal.combo}
          mode={comboFormModal.mode}
          onClose={() => setComboFormModal(null)}
          onSave={handleSaveCombo}
          products={products}
          categories={categories.filter(c => c.active)}  // 👈 ENVIA APENAS AS ATIVAS E COMO OBJETO
        />
      )}
    </div>
  );
};

export default Combos;
