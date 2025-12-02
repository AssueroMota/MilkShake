import React, { useEffect, useMemo, useState } from "react";
import "./Produtos.scss";

// MODAIS
import ModalDelete from "./ModalDelete/ModalDelete";
import ModalDetails from "./ModalDetails/ModalDetails";
import ModalProductForm from "./ModalProductForm/ModalProductForm";

// SERVICES
import {
  listenProducts,
  deleteProduct,
  updateProduct,
  createProduct,
} from "../../services/products";

import { listenCategories } from "../../services/categories";
import { uploadImage } from "../../services/cloudinary";

const Produtos = ({ searchQuery }) => {
  const [products, setProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  // FILTROS
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  // MODAIS
  const [deleteModal, setDeleteModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [productFormModal, setProductFormModal] = useState(null);

  // 🔄 Produtos em tempo real
  useEffect(() => {
    const unsubscribe = listenProducts((list) => setProducts(list));
    return () => unsubscribe && unsubscribe();
  }, []);

  // 🔄 Categorias em tempo real
  useEffect(() => {
    const unsubscribe = listenCategories((list) => setDbCategories(list));
    return () => unsubscribe && unsubscribe();
  }, []);

  const categories = useMemo(() => {
    return ["Todas Categorias", ...dbCategories.map((c) => c.name)];
  }, [dbCategories]);

  /* =========================================================
      FUNÇÃO PARA PEGAR O MENOR PREÇO DO PRODUTO
  ========================================================= */
  const getMinPrice = (product) => {
    if (!product.sizes || product.sizes.length === 0) return 0;

    const prices = product.sizes.map((s) => s.price);
    return Math.min(...prices);
  };

  /* =========================================================
      FILTROS + ORDENAÇÃO
  ========================================================= */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Regra global: se categoria está inativa → produto também fica inativo
    list = list.map((p) => {
      const cat = dbCategories.find((c) => c.name === p.category);
      if (cat && cat.active === false) return { ...p, active: false };
      return p;
    });

    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      list = list.filter((p) =>
        statusFilter === "active" ? p.active : !p.active
      );
    }

    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }

    // 🟣 Ordenação por nome
    if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));

    // 🟡 Ordenação por menor preço
    if (sortBy === "price-asc")
      list.sort((a, b) => getMinPrice(a) - getMinPrice(b));

    if (sortBy === "price-desc")
      list.sort((a, b) => getMinPrice(b) - getMinPrice(a));

    return list;
  }, [products, dbCategories, categoryFilter, statusFilter, sortBy, searchQuery]);

  /* =========================================================
      ALTERAR STATUS
  ========================================================= */
  const toggleStatus = async (product) => {
    await updateProduct(product.id, { active: !product.active });
  };

  /* =========================================================
      REMOVER PRODUTO
  ========================================================= */
  const handleDelete = async () => {
    if (!deleteModal) return;
    await deleteProduct(deleteModal.id);
    setDeleteModal(null);
  };

  /* =========================================================
      SALVAR PRODUTO (COM TAMANHOS)
  ========================================================= */
  const handleSaveProduct = async (data) => {
    let imageUrl = productFormModal?.product?.imageUrl || null;
    let imagePublicId = productFormModal?.product?.imagePublicId || null;

    // Upload nova imagem
    if (data.image) {
      const uploaded = await uploadImage(data.image, "products");
      imageUrl = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const payload = {
      name: data.name,
      category: data.category,
      categoryId: data.categoryId,
      description: data.description,
      sizes: data.sizes, // 🔥 agora salvamos os tamanhos
      active: data.active,
      imageUrl,
      imagePublicId,
    };

    if (productFormModal.mode === "add") {
      await createProduct(payload);
    } else {
      await updateProduct(productFormModal.product.id, payload);
    }

    setProductFormModal(null);
  };

  /* =========================================================
      RENDER
  ========================================================= */
  return (
    <div className="produtos-page">
      {/* HEADER */}
      <div className="produtos-header">
        <h1>Produtos da Loja</h1>

        <button
          className="btn-add"
          onClick={() => setProductFormModal({ mode: "add", product: null })}
        >
          <span className="add-icon" />
          Adicionar Produto
        </button>
      </div>

      {/* FILTROS */}
      <div className="produtos-filtros">
        <div className="filtro-item">
          <label>Categoria</label>
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value === "Todas Categorias" ? "all" : e.target.value
              )
            }
          >
            {categories.map((c) => (
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
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>

        <div className="filtro-item">
          <label>Ordenar por</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
        <div className="produtos-grid">
          {filteredProducts.map((p) => {
            const minPrice = getMinPrice(p);

            return (
              <div
                key={p.id}
                className={`produto-card ${!p.active ? "inativo-card" : ""}`}
              >
                <div className="produto-img" onClick={() => setDetailsModal(p)}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} />}
                </div>

                <div className="produto-info">
                  <h3>{p.name}</h3>
                  <p className="categoria">{p.category}</p>

                  <p className="preco">
                    A partir de{" "}
                    {minPrice.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>

                  <span className={`status ${p.active ? "ativo" : "inativo"}`}>
                    {p.active ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="produto-actions">
                  <div className="produto-actions-2">
                    <button
                      className="btn-editar"
                      onClick={() =>
                        setProductFormModal({ mode: "edit", product: p })
                      }
                    >
                      <span className="icon-editar" /> Editar
                    </button>

                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={() => toggleStatus(p)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="produto-actions-delete">
                    <button
                      className="btn-delete"
                      onClick={() => setDeleteModal(p)}
                    >
                      <span className="icon-trash" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LISTA */}
      {viewMode === "list" && (
        <table className="produtos-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Tamanhos</th>
              <th>Status</th>
              <th style={{ width: "160px" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => {
              const minPrice = getMinPrice(p);

              return (
                <tr key={p.id} className={!p.active ? "inativo-row" : ""}>
                  <td className="td-produto" onClick={() => setDetailsModal(p)}>
                    {p.imageUrl && <img src={p.imageUrl} alt={p.name} />}
                    <div>
                      <strong>{p.name}</strong>
                      <span className="table-desc">{p.description}</span>
                    </div>
                  </td>

                  <td>{p.category}</td>

                  <td className="td-preco">
                    A partir de{" "}
                    {minPrice.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>

                  <td>
                    <span className={`status ${p.active ? "ativo" : "inativo"}`}>
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>

                  <td className="td-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn-editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductFormModal({ mode: "edit", product: p });
                      }}
                    >
                      <span className="icon-editar" /> Editar
                    </button>

                    <label className="switch" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={() => toggleStatus(p)}
                      />
                      <span className="slider"></span>
                    </label>

                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModal(p);
                      }}
                    >
                      <span className="icon-trash" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* MODAIS */}
      {deleteModal && (
        <ModalDelete
          open={true}
          product={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}

      {detailsModal && (
        <ModalDetails
          open={true}
          product={detailsModal}
          onClose={() => setDetailsModal(null)}
        />
      )}

      {productFormModal && (
        <ModalProductForm
          open={true}
          product={productFormModal.product}
          mode={productFormModal.mode}
          onClose={() => setProductFormModal(null)}
          onSave={handleSaveProduct}
          categories={dbCategories}
        />
      )}
    </div>
  );
};

export default Produtos;
