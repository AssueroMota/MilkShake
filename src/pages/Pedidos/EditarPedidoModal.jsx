// src/pages/Pedidos/EditarPedidoModal.jsx
import React, { useEffect, useState, useMemo } from "react";
import "./EditarPedidoModal.scss";

import { listenProducts } from "../../services/products";
import { listenCombos } from "../../services/combos";
import { listenCategories } from "../../services/categories";

export default function EditarPedidoModal({ pedido, onClose, onSave }) {
  const SOMENTE_LEITURA = pedido.status === "finalizado";

  const [search, setSearch] = useState("");
  const [itens, setItens] = useState(pedido.itens || []);

  const [produtos, setProdutos] = useState([]);
  const [combos, setCombos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  /* 🔥 LISTENERS DO BACKEND */
  useEffect(() => {
    const unsub1 = listenProducts((list) =>
      setProdutos(list.filter((p) => p.active))
    );

    const unsub2 = listenCombos((list) =>
      setCombos(list.map((c) => ({ ...c, isCombo: true })))
    );

    const unsub3 = listenCategories((list) =>
      setCategorias(list.filter((c) => c.active))
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  /* 🔥 NORMALIZAR PRODUTOS */
  const TODOS = useMemo(() => {
    return [...produtos, ...combos].map((item) => ({
      id: item.id,
      name: item.name,
      price: item.finalPrice ?? item.price ?? item.originalPrice ?? 0,
      image: item.imageUrl || item.image || "",
      categoria: item.categoryId || (item.isCombo ? "combos" : null),
      isCombo: item.isCombo || false,
    }));
  }, [produtos, combos]);

  const getCategoryName = (catId) => {
    if (!catId) return "Sem categoria";
    if (catId === "combos") return "Combos";

    return categorias.find((c) => c.id === catId)?.name || "Sem categoria";
  };

  /* 🔍 Filtragem */
  const filtrados = useMemo(() => {
    return TODOS.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, TODOS]);

  /* 🔥 SELEÇÃO */
  const selecionado = (id) => itens.some((i) => i.id === id);

  const toggleItem = (prod) => {
    if (SOMENTE_LEITURA) return;

    if (selecionado(prod.id)) {
      setItens((prev) => prev.filter((i) => i.id !== prod.id));
    } else {
      setItens((prev) => [
        ...prev,
        { id: prod.id, name: prod.name, qty: 1, price: prod.price },
      ]);
    }
  };

  /* 🔥 EDITAR QUANTIDADE */
  const editarQtd = (id, delta) => {
    if (SOMENTE_LEITURA) return;

    setItens((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      )
    );
  };

  /* 🔥 SALVAR ALTERAÇÕES */
  const salvar = () => {
    if (SOMENTE_LEITURA) return;

    const total = itens.reduce((acc, i) => acc + i.qty * i.price, 0);

    onSave({
      ...pedido,
      itens,
      total,
    });
  };

  /* 🔥 REABRIR NO CAIXA (PDV) */
  const reenviarParaCaixa = () => {
    window.location.href = `/caixa?pedido=${pedido.id}`;
  };

  /* ====================================================== */

  return (
    <div className="editar-overlay">
      <div className="editar-modal">

        <button className="close-btn" onClick={onClose}>✕</button>

        {/* TÍTULO */}
        <h2>Pedido #{pedido.numeroSequencial || pedido.pedidoNumber || "?"}</h2>

        <p className="sub">
          {SOMENTE_LEITURA
            ? "Este pedido já foi finalizado. Apenas visualização."
            : "Selecione ou modifique itens deste pedido."}
        </p>

        {/* 🔄 BOTÃO REABRIR NO CAIXA */}
        {SOMENTE_LEITURA && (
          <div className="btn-container">
            <button className="btn-reabrir" onClick={reenviarParaCaixa}>
              Reabrir no Caixa (PDV)
            </button>
          </div>
        )}

        {/* Top bar */}
        <div className="edit-top">
          <input
            type="text"
            className="search"
            placeholder="Buscar produto..."
            value={search}
            disabled={SOMENTE_LEITURA}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="contador">
            {itens.length} selecionado{itens.length !== 1 && "s"}
          </div>
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="lista-produtos">
          {filtrados.map((prod) => {
            const ativo = selecionado(prod.id);
            const infoItem = itens.find((i) => i.id === prod.id);

            return (
              <div className={`produto-row ${ativo ? "ativo" : ""}`} key={prod.id}>

                <input
                  type="checkbox"
                  disabled={SOMENTE_LEITURA}
                  checked={ativo}
                  onChange={() => toggleItem(prod)}
                />

                <div className="thumb">
                  <img src={prod.image} alt={prod.name} />
                </div>

                <div className="info">
                  <strong>
                    {prod.name}
                    {infoItem?.qty ? ` (${infoItem.qty}x)` : ""}
                  </strong>
                  <span>{getCategoryName(prod.categoria)}</span>
                </div>

                <div className="preco">
                  R$ {prod.price.toFixed(2).replace(".", ",")}
                </div>

                {/* Quantidade */}
                {ativo && (
                  <div className="qty">
                    {SOMENTE_LEITURA ? (
                      <span className="qty-readonly">
                        Qtd: {infoItem?.qty}
                      </span>
                    ) : (
                      <>
                        <button onClick={() => editarQtd(prod.id, -1)}>-</button>
                        <span>{infoItem?.qty || 1}</span>
                        <button onClick={() => editarQtd(prod.id, +1)}>+</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER */}
        {!SOMENTE_LEITURA && (
          <div className="footer">
            <button className="btn salvar" onClick={salvar}>
              Salvar alterações
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
