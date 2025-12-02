// src/pages/Pedidos/Pedidos.jsx
import React, { useEffect, useState } from "react";
import EditarPedidoModal from "./EditarPedidoModal.jsx";
import "./Pedidos.scss";
import StatusBadge from "./StatusBadge.jsx";

import {
  listenPedidos,
  updatePedidoStatus,
  updatePedidoCompleto,
  deletePedido
} from "../../services/pedidos";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [editingPedido, setEditingPedido] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState("abertos");
  const [busca, setBusca] = useState("");

  /* 🔥 Listener realtime */
  useEffect(() => {
    const unsub = listenPedidos(setPedidos);
    return () => unsub();
  }, []);

  /* ===================== Atualizar Status ===================== */
  const atualizarStatus = async (id, novoStatus) => {
    await updatePedidoStatus(id, novoStatus);
  };

  /* ===================== Enviar para Caixa ===================== */
  const irParaCaixa = async (pedido) => {
    await updatePedidoStatus(pedido.id, "finalizado");
    window.location.href = `/caixa?pedido=${pedido.id}`;
  };

  /* ===================== Deletar ===================== */
  const removerPedido = async (id) => {
    await deletePedido(id);
  };

  /* ===================== Salvar edição ===================== */
  const salvarEdicao = async (pedidoAtualizado) => {
    await updatePedidoCompleto(pedidoAtualizado);
    setEditingPedido(null);
  };

  /* ===================== FILTRO + BUSCA ===================== */

  const pedidosFiltrados = pedidos.filter((p, index) => {
    const numeroSequencial = String(index + 1).padStart(2, "0");
    const idCurto = p.id.substring(0, 7);

    const textoBusca = `
      ${p.id}
      ${idCurto}
      ${numeroSequencial}
      ${p.total}
      ${p.status}
      ${p.hora}
      ${p.itens.map((i) => `${i.qty}x ${i.name}`).join(" ")}
    `
      .toLowerCase()
      .trim();

    const buscaOK = textoBusca.includes(busca.toLowerCase());

    const statusOK =
      filtroStatus === "abertos"
        ? p.status !== "finalizado"
        : p.status === "finalizado";

    return buscaOK && statusOK;
  });

  /* ===================== RENDER ===================== */

  return (
    <div className="pedidos-container">
      <h1 className="titulo-pedidos">Pedidos</h1>

      {/* ========= FILTROS ========= */}
      <div className="filtros-top">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <select
          className="filtro-status"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="abertos">Abertos</option>
          <option value="fechados">Fechados</option>
        </select>
      </div>

      {/* CABEÇALHO */}
      <div className="pedidos-header">
        <div>Pedido</div>
        <div>Itens</div>
        <div>Total</div>
        <div>Horário</div>
        <div>Status</div>
        <div>Ações</div>
      </div>

      {pedidosFiltrados.length === 0 && (
        <p className="nenhum-pedido">Nenhum pedido encontrado.</p>
      )}

      {pedidosFiltrados.map((p, index) => {
        const numeroSequencial = String(index + 1).padStart(2, "0");

        return (
          <div className="pedido-row" key={p.id}>
            {/* Número do pedido */}
            <div>
              <strong># {numeroSequencial}</strong>
            </div>

            {/* Itens */}
            <div className="itens-col">
              {p.itens.map((i, idx) => (
                <div key={idx} className="item-line">
                  {i.qty}x {i.name}
                </div>
              ))}
            </div>

            {/* Total */}
            <div>
              <strong>
                R$ {Number(p.total).toFixed(2).replace(".", ",")}
              </strong>
            </div>

            {/* Horário */}
            <div>{p.hora}</div>

            {/* STATUS */}
            <div>
              <StatusBadge
                status={p.status}
                onChange={(novo) => atualizarStatus(p.id, novo)}
              />
            </div>

            {/* Ações */}
            <div className="acoes-col">
              <button
                className="btn icon editar"
                onClick={() =>
                  setEditingPedido({ ...p, numeroSequencial })
                }
              />

              {p.status === "solicitado" && (
                <button
                  className="btn icon aceitar"
                  onClick={() => atualizarStatus(p.id, "andamento")}
                />
              )}

              {p.status === "andamento" && (
                <button
                  className="btn icon caixa"
                  onClick={() => irParaCaixa(p)}
                />
              )}

              <button
                className="btn icon deletar"
                onClick={() => removerPedido(p.id)}
              />
            </div>
          </div>
        );
      })}

      {/* MODAL EDITAR */}
      {editingPedido && (
        <EditarPedidoModal
          pedido={editingPedido}
          onClose={() => setEditingPedido(null)}
          onSave={salvarEdicao}
        />
      )}
    </div>
  );
}
