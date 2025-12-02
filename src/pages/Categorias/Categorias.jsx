import React, { useMemo, useState, useEffect } from "react";
import "./Categorias.scss";

// MODAIS
import ModalDelete from "./ModalDelete/ModalDelete.jsx";
import ModalDetails from "./ModalDetails/ModalDetails.jsx";
import ModalCategoryForm from "./ModalCategoryForm/ModalCategoryForm.jsx";

// SERVICES
import {
  listenCategories,
  updateCategory,
  deleteCategory,
} from "../../services/categories";

const Categorias = ({ searchQuery }) => {
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState("grid");

  // FILTROS
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  // MODAIS
  const [deleteModal, setDeleteModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [categoryFormModal, setCategoryFormModal] = useState(null);

  // 🔥 CARREGA CATEGORIAS EM TEMPO REAL
  useEffect(() => {
    const unsubscribe = listenCategories((list) => setCategories(list));
    return () => unsubscribe && unsubscribe();
  }, []);

  // 🔵 LISTA FINAL FILTRADA
  const filteredCategories = useMemo(() => {
    let list = [...categories];

    // FILTRO: status
    if (statusFilter !== "all") {
      list = list.filter((c) =>
        statusFilter === "active" ? c.active : !c.active
      );
    }

    // FILTRO: busca
    if (searchQuery?.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    // ORDENAÇÃO
    if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));

    return list;
  }, [categories, statusFilter, sortBy, searchQuery]);

  // 🔵 TOGGLE ATIVO / INATIVO
  const toggleStatus = async (id) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;

    const newActive = !cat.active;

    // Atualização otimista
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: newActive } : c))
    );

    try {
      await updateCategory(id, { active: newActive });
    } catch (err) {
      console.error(err);
      // volta ao valor anterior se der erro
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: cat.active } : c))
      );
    }
  };

  // 🔵 DELETE
  const handleDelete = async () => {
    try {
      await deleteCategory(deleteModal.id);

      setCategories((prev) =>
        prev.filter((c) => c.id !== deleteModal.id)
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir categoria.");
    }

    setDeleteModal(null);
  };

  // FORM — listener já atualiza sozinho
  const handleSaveCategory = () => {
    setCategoryFormModal(null);
  };

  return (
    <div className="categorias-page">

      {/* HEADER */}
      <div className="categorias-header">
        <h1>Categorias dos Itens da Loja</h1>

        <button
          className="btn-add"
          onClick={() =>
            setCategoryFormModal({ mode: "add", category: null })
          }
        >
          <span className="add-icon" />
          Adicionar Categoria
        </button>
      </div>

      {/* FILTROS */}
      <div className="categorias-filtros">
        <div className="filtro-item">
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativas</option>
            <option value="inactive">Inativas</option>
          </select>
        </div>

        <div className="filtro-item">
          <label>Ordenar por</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name-asc">Nome A-Z</option>
            <option value="name-desc">Nome Z-A</option>
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
        <div className="categorias-grid">
          {filteredCategories.map((c) => (
            <div
              key={c.id}
              className={`categoria-card ${!c.active ? "inativo-card" : ""}`}
            >
              <div className="categoria-img" onClick={() => setDetailsModal(c)}>
                <img src={c.imageUrl} alt={c.name} />
              </div>

              <div className="categoria-info">
                <h3>{c.name}</h3>

                <span className={`status ${c.active ? "ativo" : "inativo"}`}>
                  {c.active ? "Ativa" : "Inativa"}
                </span>
              </div>

              <div className="categoria-actions">
                <div className="categoria-actions-2">
                  <button
                    className="btn-editar"
                    onClick={() =>
                      setCategoryFormModal({ mode: "edit", category: c })
                    }
                  >
                    <span className="icon-editar" />
                    Editar
                  </button>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={c.active}
                      onChange={() => toggleStatus(c.id)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="categoria-actions-delete">
                  <button
                    className="btn-delete"
                    onClick={() => setDeleteModal(c)}
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
        <table className="categorias-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Status</th>
              <th style={{ width: "160px" }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredCategories.map((c) => (
              <tr key={c.id} className={!c.active ? "inativo-row" : ""}>
                <td className="td-categoria" onClick={() => setDetailsModal(c)}>
                  <img src={c.imageUrl} alt={c.name} />
                  <div>
                    <strong>{c.name}</strong>
                  </div>
                </td>

                <td>
                  <span className={`status ${c.active ? "ativo" : "inativo"}`}>
                    {c.active ? "Ativa" : "Inativa"}
                  </span>
                </td>

                <td className="td-actions">
                  <button
                    className="btn-editar"
                    onClick={() =>
                      setCategoryFormModal({ mode: "edit", category: c })
                    }
                  >
                    <span className="icon-editar" />
                    Editar
                  </button>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={c.active}
                      onChange={() => toggleStatus(c.id)}
                    />
                    <span className="slider"></span>
                  </label>

                  <button
                    className="btn-delete"
                    onClick={() => setDeleteModal(c)}
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
        <ModalDelete
          open={true}
          category={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={handleDelete}
        />
      )}

      {detailsModal && (
        <ModalDetails
          open={true}
          category={detailsModal}
          onClose={() => setDetailsModal(null)}
        />
      )}

      {categoryFormModal && (
        <ModalCategoryForm
          open={true}
          category={categoryFormModal.category}
          mode={categoryFormModal.mode}
          onClose={() => setCategoryFormModal(null)}
          onSave={handleSaveCategory}
        />
      )}

    </div>
  );
};

export default Categorias;
