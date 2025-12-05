// src/pages/Pedidos/Pedidos.jsx
import React, { useState, useMemo, useEffect } from "react";
import "./Pedidos.scss";

import {
  listenPedidos,
  updatePedidoStatus,
  deletePedido,
  updatePedidoCompleto,
} from "../../services/pedidos";

import EditarPedidoModal from "./EditarPedidoModal";

/* ============================================================
   COMPONENTE DE STATUS
============================================================ */
function StatusBadge({ status }) {
  const map = {
    solicitado: { label: "Solicitado", color: "#6D28D9", bg: "#EDE9FE" },
    preparando: { label: "Preparando", color: "#3B82F6", bg: "#DBEAFE" },
    concluido: { label: "Concluído", color: "#10B981", bg: "#D1FAE5" },
    cancelado: { label: "Cancelado", color: "#EF4444", bg: "#FEE2E2" },
  };

  const st = map[status] || map["solicitado"];

  return (
    <span
      className="status-badge"
      style={{
        background: st.bg,
        color: st.color,
        padding: "4px 10px",
        borderRadius: "6px",
        fontWeight: 600,
        fontSize: "12px",
      }}
    >
      {st.label}
    </span>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */
export default function Pedidos() {
  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [pedidos, setPedidos] = useState([]);

  /* 🔥 LISTENER FIRESTORE */
  useEffect(() => {
    const unsub = listenPedidos((list) => {
      const ordenados = list.sort(
        (a, b) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setPedidos(ordenados);
    });

    return () => unsub();
  }, []);

  /* 🔧 MODAL */
  const [selectedPedido, setSelectedPedido] = useState(null);
  const abrirModal = (pedido) => setSelectedPedido(pedido);
  const fecharModal = () => setSelectedPedido(null);

  /* ============================================================
     SALVAR ALTERAÇÕES DO MODAL
  ============================================================ */
  const salvarEdicao = async (pedidoAtualizado) => {
    try {
      await updatePedidoCompleto(pedidoAtualizado);
      fecharModal();
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
    }
  };

  /* ============================================================
     FILTRO FINAL
  ============================================================ */
  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((p) => {
      const txt = search.toLowerCase();

      const matchSearch =
        String(p.pedidoNumber).includes(txt) ||
        p.itens
          ?.map((i) => `${i.qty}x ${i.name}`)
          .join(" ")
          .toLowerCase()
          .includes(txt);

      const matchStatus =
        statusFilter === "todos" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, pedidos]);

  /* ============================================================
     AÇÕES DOS BOTÕES
  ============================================================ */

  // ✔ Passar de solicitado → preparando
  const handleMarcarPreparando = async (pedido) => {
    await updatePedidoStatus(pedido.id, "preparando");
  };

  // ✔ Enviar para o Caixa PDV + marcar como concluído
  const handleEnviarParaCaixa = async (pedido) => {
    await updatePedidoStatus(pedido.id, "concluido");
    window.location.href = `/caixa?pedido=${pedido.id}`;
  };

  // ✔ Cancelar pedido
  const handleDelete = async (pedidoId) => {
    await deletePedido(pedidoId);
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="pedidos-container">
      <h1>Pedidos</h1>

      {/* TOPO */}
      <div className="pedidos-top-row">
        <div className="filtros-top">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar pedido..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select-pro"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="solicitado">Solicitado</option>
            <option value="preparando">Preparando</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="view-buttons">
          <button
            className={`view-btn grid ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <span className="icon grid-icon" />
          </button>

          <button
            className={`view-btn list ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <span className="icon list-icon" />
          </button>
        </div>
      </div>

      {/* ======================================================
          GRID MODE
      ====================================================== */}
      {viewMode === "grid" && (
        <div className="pedidos-grid">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="pedido-card">
              
              <div className="pedido-header">
                <h3># {pedido.pedidoNumber}</h3>
                <StatusBadge status={pedido.status} />
              </div>

<div className="pedido-itens">
  {pedido.itens.slice(0, 3).map((i, idx) => (
    <div className="item-row" key={idx}>
      {i.qty}x {i.name}
    </div>
  ))}

  {pedido.itens.length > 3 && (
    <div className="more-items">
      +{pedido.itens.length - 3} itens
    </div>
  )}
</div>


              <div className="pedido-info">
                <span className="hora">{pedido.hora}</span>
                <span className="total">
                  R$ {Number(pedido.total).toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="pedido-actions">
                <button
                  className="btn icon editar"
                  onClick={() => abrirModal(pedido)}
                />

                {pedido.status === "solicitado" && (
                  <button
                    className="btn icon aceitar"
                    onClick={() => handleMarcarPreparando(pedido)}
                  />
                )}

                <button
                  className="btn icon caixa"
                  onClick={() => handleEnviarParaCaixa(pedido)}
                />

                <button
                  className="btn icon deletar"
                  onClick={() => handleDelete(pedido.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================
          LIST MODE
      ====================================================== */}
      {viewMode === "list" && (
        <>
          <div className="pedidos-header">
            <span>N°</span>
            <span>Itens</span>
            <span>Total</span>
            <span>Hora</span>
            <span>Status</span>
            <span>Ações</span>
          </div>

          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="pedido-row">
              <div># {pedido.pedidoNumber}</div>

              <div>
                {pedido.itens
                  ?.map((i) => `${i.qty}x ${i.name}`)
                  .join(", ")}
              </div>

              <div>
                <strong>
                  R$ {Number(pedido.total).toFixed(2).replace(".", ",")}
                </strong>
              </div>

              <div>{pedido.hora}</div>

              <div>
                <StatusBadge status={pedido.status} />
              </div>

              <div className="acoes-col">
                <button
                  className="btn icon editar"
                  onClick={() => abrirModal(pedido)}
                />

                {pedido.status === "solicitado" && (
                  <button
                    className="btn icon aceitar"
                    onClick={() => handleMarcarPreparando(pedido)}
                  />
                )}

                <button
                  className="btn icon caixa"
                  onClick={() => handleEnviarParaCaixa(pedido)}
                />

                <button
                  className="btn icon deletar"
                  onClick={() => handleDelete(pedido.id)}
                />
              </div>
            </div>
          ))}
        </>
      )}

      {/* ======================================================
          MODAL
      ====================================================== */}
      {selectedPedido && (
        <EditarPedidoModal
          pedido={selectedPedido}
          onClose={fecharModal}
          onSave={salvarEdicao}
        />
      )}
    </div>
  );
}
