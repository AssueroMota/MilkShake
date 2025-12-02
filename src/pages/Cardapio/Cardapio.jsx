import React, { useState, useMemo, useEffect } from "react";
import "./Cardapio.scss";

import DetailsModal from "./DetailsModal.jsx";
import CartButton from "./CartButton.jsx";
import CartSidebar from "./CartSidebar.jsx";

// Serviços do backend
import { listenProducts } from "../../services/products";
import { listenCombos } from "../../services/combos";
import { listenCategories } from "../../services/categories";

// IMAGEM NATIVA DO COMBO
import comboImg from "../../assets/img/combos/combofamilia.png";

export default function Cardapio() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  /* ---------------- LISTENERS BACKEND ---------------- */

  // 🔥 Categorias (Admin controla ativo/inativo)
  useEffect(() => {
    const unsub = listenCategories((list) => setCategories(list));
    return () => unsub();
  }, []);

  /* ---------------- FILTRAR CATEGORIAS ATIVAS ---------------- */

  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.active);
  }, [categories]);

  /* ---------------- PRODUTOS ATIVOS E COM CATEGORIA ATIVA ---------------- */

  useEffect(() => {
    const unsub = listenProducts((list) => {
      const filtered = list.filter((p) => {
        if (!p.active) return false;

        // Descobre categoria do produto
        const cat =
          categories.find((c) => c.id === p.categoryId) ||
          categories.find((c) => c.name === p.category);

        if (!cat?.active) return false; // categoria inativa → produto some

        return true;
      });

      setProducts(filtered);
    });

    return () => unsub();
  }, [categories]);

  /* ---------------- COMBOS ATIVOS, COM CATEGORIA ATIVA E COM ITENS VÁLIDOS ---------------- */

  useEffect(() => {
    const unsub = listenCombos((list) => {
      const filtered = list
        .filter((c) => c.active) // combo preciso estar ativo
        .filter((combo) => {
          // categoria do combo precisa estar ativa
          const cat = categories.find((x) => x.name === combo.category);
          if (!cat?.active) return false;

          // todos os itens devem ser ativos
          const allItemsActive = combo.items.every((item) => {
            const prod = products.find((p) => p.id === item.id);
            return prod?.active;
          });

          return allItemsActive;
        })
        .map((c) => ({ ...c, isCombo: true }));

      setCombos(filtered);
    });

    return () => unsub();
  }, [categories, products]);

  /* ---------------- FUNÇÃO PARA PEGAR O MENOR PREÇO DO PRODUTO ---------------- */

  const getMinPrice = (item) => {
    // 1. Se for Combo, usa o preço final/original do Combo
    if (item.isCombo) return item.finalPrice || item.price || item.originalPrice || 0;
    
    // 2. Se for Produto, procura o menor preço nos 'sizes'
    if (!item.sizes || item.sizes.length === 0) return 0;

    const prices = item.sizes.map((s) => s.price);
    return Math.min(...prices);
  };


  /* ---------------- CATEGORIA NATIVA “COMBOS” (apenas se houver combos válidos) ---------------- */

  const nativeComboCategory =
    combos.length > 0
      ? {
          id: "native-combos",
          name: "Combos",
          imageUrl: comboImg,
        }
      : null;

  const finalCategories = nativeComboCategory
    ? [...activeCategories, nativeComboCategory]
    : [...activeCategories];

  /* ---------------- UNIFICA PRODUTOS E COMBOS (APLICA O MENOR PREÇO) ---------------- */

  const normalizedItems = useMemo(() => {
    return [...products, ...combos].map((item) => ({
      ...item,
      displayPrice: getMinPrice(item), // 🔥 AGORA USAMOS A FUNÇÃO getMinPrice
    }));
  }, [products, combos]);

  /* ---------------- FILTRAGEM DE ITENS ---------------- */

  const filteredItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const matchCategory =
        !selectedCategory ||

        // produtos por categoryId
        String(item.categoryId) === String(selectedCategory) ||

        // produtos por nome da categoria
        String(item.category) ===
          String(activeCategories.find((c) => c.id === selectedCategory)?.name) ||

        // combos quando clica em “Combos”
        (selectedCategory === "native-combos" && item.isCombo);

      const matchSearch =
        item.name?.toLowerCase().includes(search.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [normalizedItems, selectedCategory, search, activeCategories]);

  /* ---------------- CARRINHO ---------------- */

  const addToCart = (item, qty) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === item.id);

      if (exists) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, qty: p.qty + qty } : p
        );
      }

      return [...prev, { ...item, qty }];
    });

    setCartOpen(true);
  };

  /* ------------------------------------------------------------------- */

  return (
    <div className="cardapio-page">
      {/* HEADER */}
      <header className="cardapio-header">
        <div className="cardapio-header-text">
          <h1>Cardápio</h1>
          <p>Escolha uma categoria ou pesquise por um item específico.</p>
        </div>
      </header>

      {/* BUSCA */}
      <div className="cardapio-search-row">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* CATEGORIAS */}
      <section className="cardapio-section">
        <div className="section-header">
          <h2>Categorias</h2>
          {selectedCategory && (
            <button
              className="btn-clear-filter"
              onClick={() => setSelectedCategory(null)}
            >
              Limpar filtro
            </button>
          )}
        </div>

        <div className="categories-row">
          {finalCategories.map((cat) => (
            <button
              key={cat.id}
              className={`category-item ${
                selectedCategory === cat.id ? "active" : ""
              }`}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )
              }
            >
              <div className="category-thumb">
                <img src={cat.image || cat.imageUrl} alt={cat.name} />
              </div>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ITENS */}
      <section className="cardapio-section">
        <div className="section-header">
          <h2>Itens do cardápio</h2>
          <span className="items-count">{filteredItems.length} itens</span>
        </div>

        <div className="products-grid">
          {filteredItems.length === 0 ? (
            <p className="no-products">Nenhum item encontrado.</p>
          ) : (
            filteredItems.map((prod) => {
              const inCart = cart.some((c) => c.id === prod.id);
              // Verifica se é um produto com mais de 1 tamanho para exibir "A partir de"
              const isSizedProduct = prod.sizes && prod.sizes.length > 1;

              return (
                <article
                  key={prod.id}
                  className={`product-card ${inCart ? "in-cart" : ""}`}
                  onClick={() => setSelectedItem(prod)}
                >
                  <div className="product-media">
                    <img
                      src={prod.image || prod.imageUrl}
                      alt={prod.name}
                    />
                  </div>

                  <div className="product-body">
                    <h3>{prod.name}</h3>
                    <p className="description">{prod.description}</p>

                    <div className="product-footer">
                      <span className="price">
                        {isSizedProduct && "A partir de "}
                        {prod.displayPrice.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  </div>

                  {inCart && (
                    <div className="in-cart-badge">Já no carrinho ✓</div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* MODAL */}
      {selectedItem && (
        <DetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={addToCart}
        />
      )}

      {/* CARRINHO */}
      <CartButton
        count={cart.reduce((acc, item) => acc + item.qty, 0)}
        onClick={() => setCartOpen(true)}
      />

      <CartSidebar
        open={cartOpen}
        cart={cart}
        setCart={setCart}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
}