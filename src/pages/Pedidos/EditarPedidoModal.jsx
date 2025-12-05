// -----------------------------------------------------
//  EDITAR PEDIDO MODAL - VERSÃO COMPLETA e CORRIGIDA
// -----------------------------------------------------
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

  /* ---------------------------------------------------------
      LISTEN FIRESTORE
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
      FUNÇÃO QUE GARANTE QUE O PREÇO SEMPRE EXISTE
  --------------------------------------------------------- */
  const getRealPrice = (item) => {
    // Caso produto tenha tamanhos
    if (item.sizes && item.sizes.length > 0) {
      // pega o menor preço
      const prices = item.sizes.map(s => Number(s.price) || 0);
      return Math.min(...prices);
    }

    return (
      Number(item.price) ||
      Number(item.finalPrice) ||
      Number(item.originalPrice) ||
      Number(item.value) ||
      Number(item.unit_price) ||
      0
    );
  };


  /* ---------------------------------------------------------
      NORMALIZAÇÃO DE PRODUTOS E COMBOS
  --------------------------------------------------------- */
const TODOS = useMemo(() => {
  const categoriasAtivasIds = categorias.map((c) => c.id);

  return [...produtos, ...combos].map((item) => ({
    uid: item.id,
    id: item.id,
    name: item.name,
    price: getRealPrice(item),
    image: item.imageUrl || item.image || "",
    categoria: item.categoryId || (item.isCombo ? "combos" : null),
    active: item.active !== false,
    categoriaAtiva:
      item.isCombo ? true : categoriasAtivasIds.includes(item.categoryId),
  }));
}, [produtos, combos, categorias]);




  const getCategoryName = (catId) => {
    if (!catId) return "Sem categoria";
    if (catId === "combos") return "Combos";
    return categorias.find((c) => c.id === catId)?.name || "Sem categoria";
  };

  /* ---------------------------------------------------------
      SEPARAÇÃO ENTRE ITENS JÁ NO PEDIDO E DISPONÍVEIS
  --------------------------------------------------------- */
  const idsNoPedido = itens.map((i) => i.id);

  const itensDoPedido = itens;

const disponiveis = TODOS.filter(
  (p) =>
    p.active &&              // produto ativo
    p.categoriaAtiva &&      // categoria ativa
    !idsNoPedido.includes(p.id) &&
    p.name.toLowerCase().includes(search.toLowerCase())
);



  /* ---------------------------------------------------------
      FUNÇÕES DE EDIÇÃO
  --------------------------------------------------------- */
  const editarQtd = (id, delta) => {
    setItens((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
      )
    );
  };

  const removerDoPedido = (id) => {
    setItens((prev) => prev.filter((i) => i.id !== id));
  };

  const adicionarItem = (prod) => {
    setItens((prev) => [
      ...prev,
      {
        productId: prod.id,                 // 🔥 O PDV precisa disso
        id: prod.id,                        // mantém compatibilidade interna
        name: prod.name,
        qty: 1,
        price: prod.price,
        totalItem: prod.price * 1,          // 🔥 usado no PDV
        imageUrl: prod.image,               // 🔥 garante a imagem no PDV
        categoryId: prod.categoria || null,
        isCombo: prod.isCombo || false,
      },
    ]);
  };




  /* ---------------------------------------------------------
      SALVAR ALTERAÇÕES
  --------------------------------------------------------- */
  const salvar = () => {
    const total = itens.reduce((acc, i) => acc + (i.price * i.qty), 0);

    const itensCorrigidos = itens.map((i) => ({
      ...i,
      totalItem: i.price * i.qty,
    }));


    onSave({
      ...pedido,
      itens: itensCorrigidos,
      total,
    });


    onClose();
  };

  /* ---------------------------------------------------------
      RENDER
  --------------------------------------------------------- */
  return (
    <div className="editar-overlay">
      <div className="editar-modal">
        <button className="close-btn" onClick={onClose}>✕</button>

        <h2>Editar Pedido #{pedido.pedidoNumber}</h2>

        {/* BUSCA */}
        <div className="edit-top">
          <input
            type="text"
            className="search"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="contador">{itens.length} itens no pedido</div>
        </div>

        {/* ------------------------- */}
        {/*  SEÇÃO A — ITENS DO PEDIDO */}
        {/* ------------------------- */}

        <h3 className="sec-title">Itens do Pedido</h3>

        <div className="lista-produtos">
          {itensDoPedido.map((item) => {
            const ref = TODOS.find((p) => p.id === item.id);

            return (
              <div className="produto-row ativo" key={item.id}>
                <div className="thumb">
                  <img
                    src={ref?.image || item.imageUrl || "/placeholder.png"}
                    alt={item.name}
                  />

                </div>

                <div className="info">
                  <strong>{item.name}</strong>
                  <span>{item.qty}x</span>
                </div>

                <div className="preco">
                  R$ {(item.price * item.qty).toFixed(2).replace(".", ",")}
                </div>

                <div className="qty">
                  <button onClick={() => editarQtd(item.id, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => editarQtd(item.id, +1)}>+</button>
                </div>

                <button className="remove-btn" onClick={() => removerDoPedido(item.id)}>
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* ------------------------------- */}
        {/*  SEÇÃO B — ADICIONAR AO PEDIDO  */}
        {/* ------------------------------- */}

        <h3 className="sec-title">Adicionar ao Pedido</h3>

        <div className="lista-produtos">
          {disponiveis.map((prod) => (
            <div className="produto-row" key={prod.id}>
              <div className="thumb">
                <img src={prod.image} alt="" />
              </div>

              <div className="info">
                <strong>{prod.name}</strong>
                <span>{getCategoryName(prod.categoria)}</span>
              </div>

              <div className="preco">
                R$ {prod.price.toFixed(2).replace(".", ",")}
              </div>

              <button className="add-btn" onClick={() => adicionarItem(prod)}>
                +
              </button>
            </div>
          ))}
        </div>

        {/* BOTÃO SALVAR */}
        <div className="footer">
          <button className="salvar" onClick={salvar}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
