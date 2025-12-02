// src/pages/Caixa/Caixa.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Caixa.scss";

// SERVICES (Firestore)
import { listenCategories } from "../../services/categories";
import { listenProducts } from "../../services/products";
import { listenCombos } from "../../services/combos";
import {
  getPedidoById,
  finalizarPedidoExistente,
  createPedidoFinalizado,
} from "../../services/pedidos";

// IMAGEM NATIVA PARA CATEGORIA DE COMBOS
import comboImg from "../../assets/img/combos/combofamilia.png";
import ModalSelectSize from "./ModalSelectSize/ModalSelectSize";

/* ---------------------- HELPERS DE NÚMERO / MOEDA ---------------------- */

// Converte string "10,50" → 10.5
function parseBRNumber(str) {
  if (!str) return 0;
  const cleaned = String(str)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
}

// Formata para R$ 0,00
function formatCurrency(value) {
  const n = Number(value) || 0;
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Formatação de input de moeda
function formatCurrencyInput(str) {
  const onlyDigits = String(str).replace(/\D/g, "");
  if (!onlyDigits) return "";
  const int = parseInt(onlyDigits, 10);
  const cents = (int / 100).toFixed(2);
  return cents.replace(".", ",");
}

// Cupons mock (você poderá migrar para Firestore futuramente)
const COUPONS = {
  PROMO10: { type: "percent", value: 10, label: "10% OFF" },
  DESC5: { type: "value", value: 5, label: "R$ 5,00 OFF" },
};

const PAYMENT_LABELS = {
  pix: "PIX",
  money: "Dinheiro",
  debit: "Débito",
  credit: "Crédito",
};

// Categoria nativa: COMBOS
const NATIVE_COMBO_CATEGORY = {
  id: "native-combos",
  name: "Combos",
  imageUrl: comboImg,
};

export default function Caixa() {
  // Dados Firestore
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [combos, setCombos] = useState([]);

  // UI
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Carrinho
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");

  // Valores extras
  const [deliveryFeeInput, setDeliveryFeeInput] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [discountPercentInput, setDiscountPercentInput] = useState("");
  const [discountValueInput, setDiscountValueInput] = useState("");

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Estado do pedido
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pedidoId, setPedidoId] = useState(null);
  const [sizeModalProduct, setSizeModalProduct] = useState(null);

  /* -------------------------- FIRESTORE LISTEN -------------------------- */

  // Categorias
  useEffect(() => {
    const unsub = listenCategories((list) => {
      setCategories(list);
    });
    return () => unsub();
  }, []);

  /* ---------------------- FILTRAR SOMENTE CATEGORIAS ATIVAS ---------------------- */

  const activeCategories = useMemo(
    () => categories.filter((c) => c.active),
    [categories]
  );

  /* ---------------------- FILTRAR PRODUTOS ATIVOS + CATEGORIA ATIVA ---------------------- */

  useEffect(() => {
    const unsub = listenProducts((list) => {
      const filtered = list.filter((p) => {
        if (!p.active) return false;

        const cat =
          categories.find((c) => c.id === p.categoryId) ||
          categories.find((c) => c.name === p.category);

        return cat?.active;
      });

      setProducts(filtered);
    });

    return () => unsub();
  }, [categories]);

  /* ---------------------- FILTRAR COMBOS ATIVOS + CATEGORIA ATIVA + ITENS ATIVOS ---------------------- */

  useEffect(() => {
    const unsub = listenCombos((list) => {
      const filtered = list
        .filter((c) => c.active)
        .filter((combo) => {
          const cat = categories.find((x) => x.name === combo.category);
          if (!cat?.active) return false;

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

  /* ---------------------- CARREGAR PEDIDO EXISTENTE (EDITAR) ---------------------- */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("pedido");

    if (pid) carregarPedidoDoBackend(pid);
  }, []);

  async function carregarPedidoDoBackend(id) {
    const pedido = await getPedidoById(id);
    if (!pedido) return;

    setPedidoId(id);

    const itensConvertidos = pedido.itens.map((i) => ({
      id: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.qty,
      isCombo: i.isCombo || false,
      imageUrl: i.imageUrl || null,
      categoryId: i.categoryId || null,
    }));

    setCart(itensConvertidos);
    setNote(pedido.note || "");
  }

  /* ---------------------- CATEGORIAS NA UI ---------------------- */

  const finalCategories = useMemo(() => {
    return [...activeCategories, NATIVE_COMBO_CATEGORY];
  }, [activeCategories]);

  function handleSelectCategory(id) {
    if (selectedCategoryId === id) setSelectedCategoryId(null);
    else setSelectedCategoryId(id);
    setShowAllCategories(false);
  }

  const getCategoryById = (categoryId) =>
    categories.find((c) => c.id === categoryId) || null;

  /* ---------------------- NORMALIZAR PRODUTOS + COMBOS ---------------------- */

  const normalizedItems = useMemo(() => {
    const normProducts = products.map((p) => {
      let displayPrice = p.finalPrice ?? p.price ?? p.originalPrice ?? 0;

      if (p.sizes && p.sizes.length > 0) {
        const prices = p.sizes.map((s) => Number(s.price || 0));
        const min = Math.min(...prices);
        displayPrice = isNaN(min) ? 0 : min;
      }

      return {
        ...p,
        isCombo: false,
        displayPrice,
        imageDisplay: p.imageUrl || p.image,
      };
    });

    const normCombos = combos.map((c) => ({
      ...c,
      isCombo: true,
      displayPrice:
        c.finalPrice ?? c.price ?? c.originalPrice ?? 0,
      imageDisplay: c.imageUrl || c.image,
    }));

    return [...normProducts, ...normCombos];
  }, [products, combos]);


  /* ---------------------- FILTRAR ITENS EXIBIDOS NO PDV ---------------------- */

  const filteredItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const matchCategory =
        !selectedCategoryId ||
        String(item.categoryId) === String(selectedCategoryId) ||
        (selectedCategoryId === "native-combos" && item.isCombo) ||
        String(item.category) ===
        String(
          activeCategories.find((c) => c.id === selectedCategoryId)?.name
        );

      const matchSearch = String(item.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [normalizedItems, selectedCategoryId, searchTerm, activeCategories]);

  /* --------------------------- CARRINHO --------------------------- */

  function handleAddToCart(item) {
    // 🔹 Produto com múltiplos tamanhos → abre modal
    if (item.sizes && item.sizes.length > 1) {
      setSizeModalProduct(item);
      return;
    }

    // 🔹 Produto com apenas 1 tamanho → já entra com aquele tamanho
    if (item.sizes && item.sizes.length === 1) {
      const s = item.sizes[0];
      const cartId = `${item.id}-${s.size}`;

      setCart((prev) => {
        const existing = prev.find((p) => p.id === cartId);
        if (existing) {
          return prev.map((p) =>
            p.id === cartId ? { ...p, quantity: p.quantity + 1 } : p
          );
        }

        return [
          ...prev,
          {
            id: cartId,
            name: `${item.name} (${s.size})`,
            price: Number(s.price || 0),
            quantity: 1,
            size: s.size,
            categoryId: item.categoryId || null,
            isCombo: !!item.isCombo,
            imageUrl:
              item.imageDisplay || item.imageUrl || item.image || null,
          },
        ];
      });

      return;
    }

    // 🔹 Produto sem sizes (combo ou antigo)
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.displayPrice ?? item.price ?? 0,
          quantity: 1,
          categoryId: item.categoryId || null,
          isCombo: !!item.isCombo,
          imageUrl:
            item.imageDisplay || item.imageUrl || item.image || null,
        },
      ];
    });
  }

  function handleSelectSize(selectedSize) {
    const item = sizeModalProduct;
    if (!item) return;

    const cartId = `${item.id}-${selectedSize.size}`;

    setCart((prev) => {
      const existing = prev.find((p) => p.id === cartId);
      if (existing) {
        return prev.map((p) =>
          p.id === cartId ? { ...p, quantity: p.quantity + 1 } : p
        );
      }

      return [
        ...prev,
        {
          id: cartId,
          name: `${item.name} (${selectedSize.size})`,
          price: Number(selectedSize.price || 0),
          quantity: 1,
          size: selectedSize.size,
          categoryId: item.categoryId || null,
          isCombo: !!item.isCombo,
          imageUrl:
            item.imageDisplay || item.imageUrl || item.image || null,
        },
      ];
    });

    setSizeModalProduct(null);
  }

  function handleChangeQuantity(productId, delta) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function handleRemoveFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function handleClearCart() {
    setCart([]);
    setNote("");
  }

  /* --------------------------- CUPOM / DESCONTOS --------------------------- */

  function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      setAppliedCoupon(null);
      return;
    }

    const coupon = COUPONS[code];
    if (!coupon) {
      setAppliedCoupon(null);
      alert("Cupom inválido.");
      return;
    }

    setAppliedCoupon({ code, ...coupon });
  }

  /* --------------------------- CÁLCULO DOS TOTAIS --------------------------- */

  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price || 0) * item.quantity,
      0
    );

    const deliveryFee = parseBRNumber(deliveryFeeInput);
    const discountPercent = parseBRNumber(discountPercentInput);
    const discountValueManual = parseBRNumber(discountValueInput);

    const discountFromPercent = (subtotal * discountPercent) / 100;

    let couponDiscountValue = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        couponDiscountValue = (subtotal * appliedCoupon.value) / 100;
      } else {
        couponDiscountValue = appliedCoupon.value;
      }
    }

    const totalDiscounts =
      discountFromPercent +
      discountValueManual +
      couponDiscountValue;

    let total = subtotal + deliveryFee - totalDiscounts;
    if (total < 0) total = 0;

    return {
      subtotal,
      deliveryFee,
      discountPercent,
      discountFromPercent,
      discountValueManual,
      couponDiscountValue,
      totalDiscounts,
      total,
    };
  }, [
    cart,
    deliveryFeeInput,
    discountPercentInput,
    discountValueInput,
    appliedCoupon,
  ]);

  /* --------------------------- FINALIZAR VENDA --------------------------- */

  async function handleFinalizeSale() {
    setSaveError("");

    if (cart.length === 0) {
      alert("Carrinho vazio.");
      return;
    }

    if (!paymentMethod) {
      alert("Selecione a forma de pagamento.");
      return;
    }

    const payload = {
      itens: cart.map((i) => ({
        productId: i.id,
        name: i.name,
        qty: i.quantity,
        price: i.price,
        totalItem: i.price * i.quantity,
        isCombo: i.isCombo,
        categoryId: i.categoryId,
        imageUrl: i.imageUrl,
      })),
      note,
      paymentMethod,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      discountPercent: totals.discountPercent,
      discountFromPercent: totals.discountFromPercent,
      discountValueManual: totals.discountValueManual,
      coupon: appliedCoupon,
      couponDiscountValue: totals.couponDiscountValue,
      totalDiscounts: totals.totalDiscounts,
      total: totals.total,
    };

    try {
      setSaving(true);

      if (pedidoId) {
        await finalizarPedidoExistente(pedidoId, payload);
      } else {
        await createPedidoFinalizado({
          ...payload,
          status: "andamento",
          origin: "caixa",
        });
      }

      setLastSale({
        ...payload,
        id: Date.now(),
        createdAt: new Date(),
      });

      setShowReceipt(true);

      // limpa dados
      setCart([]);
      setPedidoId(null);
      setNote("");
      setDeliveryFeeInput("");
      setCouponInput("");
      setAppliedCoupon(null);
      setDiscountPercentInput("");
      setDiscountValueInput("");
      setPaymentMethod(null);
    } catch (err) {
      console.error(err);
      setSaveError("Erro ao finalizar venda.");
    } finally {
      setSaving(false);
    }
  }

  function handlePrintReceipt() {
    window.print();
  }

  function handleSelectSize(size) {
    const p = sizeModalProduct;

    setCart((prev) => [
      ...prev,
      {
        id: p.id + "-" + size.size,
        name: `${p.name} (${size.size})`,
        price: size.price,
        quantity: 1,
        size: size.size,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
      },
    ]);

    setSizeModalProduct(null);
  }


  /* ---------------------- RENDER ---------------------- */

  return (
    <div className="caixa-page">
      {/* COLUNA ESQUERDA */}
      <div className="caixa-left">
        {/* Busca */}
        <div className="caixa-search-row">
          <input
            className="caixa-search-input"
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <button
            className="btn-all-categories"
            onClick={() => setShowAllCategories((prev) => !prev)}>
            {showAllCategories ? "Fechar categorias" : "Ver todas categorias"}
          </button>
        </div>

        {/* Lista completa de categorias */}
        {showAllCategories && (
          <div className="caixa-category-list">
            {finalCategories.map((cat) => (
              <button
                key={cat.id}
                className={`category-list-item ${selectedCategoryId === cat.id ? "active" : ""
                  }`}
                onClick={() => handleSelectCategory(cat.id)}>
                <img src={cat.imageUrl || cat.image} alt={cat.name} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Carrossel de categorias */}
        {!showAllCategories && (
          <div className="caixa-category-carousel">
            <div className="carousel-track">
              {finalCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={`carousel-item ${selectedCategoryId === cat.id ? "active" : ""
                    }`}
                  onClick={() => handleSelectCategory(cat.id)}>
                  <div className="carousel-img-wrapper">
                    <img src={cat.imageUrl || cat.image} alt={cat.name} />
                  </div>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GRID DE PRODUTOS */}
        <div className="caixa-products-grid">
          {filteredItems.length === 0 ? (
            <div className="no-products">Nenhum produto encontrado.</div>
          ) : (
            filteredItems.map((item) => {
              const isInCart = cart.some((c) => c.id === item.id);
              const cat =
                item.categoryId && getCategoryById(item.categoryId);

              return (
                <button
                  key={item.id}
                  className={`product-card ${isInCart ? "added" : ""}`}
                  onClick={() => handleAddToCart(item)}>
                  <div className="product-image">
                    <img
                      src={
                        item.imageDisplay || item.imageUrl || item.image
                      }
                      alt={item.name}
                    />
                  </div>

                  <div className="product-info">
                    <h3>{item.name}</h3>

                    {/* {cat && (
                      <span className="product-category">{cat.name}</span>
                    )} */}

                    <span className="product-price">
                      {formatCurrency(item.displayPrice)}
                    </span>

                    {isInCart && (
                      <span className="product-added-tag">
                        Já no carrinho ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* COLUNA CENTRAL — PEDIDO ATUAL */}
      <div className="caixa-center">
        <div className="order-card">
          <h2>Pedido Atual</h2>

          <div className="order-items">
            {cart.length === 0 && (
              <p className="order-empty">Nenhum item adicionado</p>
            )}

            {cart.map((item) => (
              <div key={item.id} className="order-item-v2">
                <div className="order-item-header">
                  <div className="header-left">
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name} />
                    )}
                    <span className="item-title">{item.name}</span>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveFromCart(item.id)}>
                    ×
                  </button>
                </div>

                <div className="order-item-footer">
                  <div className="qty-box">
                    <button
                      onClick={() =>
                        handleChangeQuantity(item.id, -1)
                      }>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        handleChangeQuantity(item.id, +1)
                      }>
                      +
                    </button>
                  </div>

                  <span className="unit-price">
                    {formatCurrency(item.price)}
                  </span>

                  <span className="total-price">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <textarea
            className="order-notes"
            placeholder="Observações do pedido..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <button className="btn-clear-order" onClick={handleClearCart}>
            Limpar Carrinho
          </button>
        </div>
      </div>

      {/* COLUNA DIREITA — FINALIZAÇÃO */}
      <div className="caixa-right">
        <div className="checkout-card">
          <h2>Finalização</h2>

          <div className="checkout-section">
            <div className="checkout-row">
              <span>Subtotal:</span>
              <strong>{formatCurrency(totals.subtotal)}</strong>
            </div>

            <label className="checkout-field">
              <span>Taxa de Entrega (opcional)</span>
              <input
                type="text"
                placeholder="Ex: 5,00"
                value={deliveryFeeInput}
                onChange={(e) =>
                  setDeliveryFeeInput(
                    formatCurrencyInput(e.target.value)
                  )
                }
              />
            </label>

            <label className="checkout-field">
              <span>Cupom de Desconto</span>
              <div className="coupon-row">
                <input
                  type="text"
                  placeholder="Digite o cupom"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleApplyCoupon();
                    }
                  }}
                />
                <button
                  className="btn-apply-coupon"
                  onClick={handleApplyCoupon}>
                  Aplicar
                </button>
              </div>
              {appliedCoupon && (
                <small className="coupon-applied">
                  Cupom aplicado: <strong>{appliedCoupon.code}</strong>{" "}
                  ({appliedCoupon.label})
                </small>
              )}
            </label>

            <label className="checkout-field">
              <span>Desconto Manual (%)</span>
              <input
                type="text"
                placeholder="Ex: 10"
                value={discountPercentInput}
                onChange={(e) =>
                  setDiscountPercentInput(
                    e.target.value.replace(/[^\d]/g, "")
                  )
                }
              />
            </label>

            <label className="checkout-field">
              <span>Desconto Manual (R$)</span>
              <input
                type="text"
                placeholder="Ex: 5,00"
                value={discountValueInput}
                onChange={(e) =>
                  setDiscountValueInput(
                    formatCurrencyInput(e.target.value)
                  )
                }
              />
            </label>
          </div>

          {/* RESUMO DOS DESCONTOS */}
          <div className="checkout-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>

            <div className="summary-row">
              <span>Taxa de Entrega</span>
              <span>{formatCurrency(totals.deliveryFee)}</span>
            </div>

            {appliedCoupon && (
              <div className="summary-row discount">
                <span>Cupom ({appliedCoupon.code})</span>
                <span>
                  -{formatCurrency(totals.couponDiscountValue)}
                </span>
              </div>
            )}

            {totals.discountFromPercent > 0 && (
              <div className="summary-row discount">
                <span>Desc. %</span>
                <span>
                  -{formatCurrency(totals.discountFromPercent)}
                </span>
              </div>
            )}

            {totals.discountValueManual > 0 && (
              <div className="summary-row discount">
                <span>Desc. R$</span>
                <span>
                  -{formatCurrency(totals.discountValueManual)}
                </span>
              </div>
            )}

            <div className="summary-total-row">
              <span className="label">TOTAL FINAL:</span>
              <span className="value">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>

          {/* FORMAS DE PAGAMENTO */}
          <div className="checkout-payment">
            <span className="payment-title">Forma de Pagamento:</span>

            <div className="payment-grid">
              {["pix", "money", "debit", "credit"].map((pm) => (
                <button
                  key={pm}
                  className={`payment-btn ${paymentMethod === pm ? "selected" : ""
                    }`}
                  onClick={() => setPaymentMethod(pm)}>
                  {PAYMENT_LABELS[pm]}
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="caixa-error-message">{saveError}</div>
          )}

          <button
            className="btn-finish-sale"
            onClick={handleFinalizeSale}
            disabled={saving}>
            {saving ? "Finalizando..." : "Finalizar Venda"}
          </button>
        </div>
      </div>

      {/* RECIBO / NOTA */}
      {showReceipt && lastSale && (
        <div className="receipt-overlay">
          <div className="receipt-modal">
            <div className="receipt-paper">
              <h3>Milk Shake Mix</h3>
              <p>Caixa (PDV)</p>
              <p>
                Venda #{lastSale.id} —{" "}
                {lastSale.createdAt.toLocaleString("pt-BR")}
              </p>
              <hr />

              <div className="receipt-section">
                {lastSale.itens.map((item) => (
                  <div key={item.productId} className="receipt-item-row">
                    <span className="qty">{item.qty}x</span>
                    <span className="name">{item.name}</span>
                    <span className="price">
                      {formatCurrency(item.totalItem)}
                    </span>
                  </div>
                ))}
              </div>

              <hr />

              <div className="receipt-section">
                <div className="receipt-line">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastSale.subtotal)}</span>
                </div>

                <div className="receipt-line">
                  <span>Entrega</span>
                  <span>
                    {formatCurrency(lastSale.deliveryFee)}
                  </span>
                </div>

                {lastSale.coupon && (
                  <div className="receipt-line">
                    <span>Cupom</span>
                    <span>
                      -{formatCurrency(lastSale.couponDiscountValue)}
                    </span>
                  </div>
                )}

                {lastSale.discountFromPercent > 0 && (
                  <div className="receipt-line">
                    <span>Desc. %</span>
                    <span>
                      -{formatCurrency(lastSale.discountFromPercent)}
                    </span>
                  </div>
                )}

                {lastSale.discountValueManual > 0 && (
                  <div className="receipt-line">
                    <span>Desc. R$</span>
                    <span>
                      -{formatCurrency(lastSale.discountValueManual)}
                    </span>
                  </div>
                )}

                <div className="receipt-line total">
                  <span>TOTAL</span>
                  <span>{formatCurrency(lastSale.total)}</span>
                </div>

                <div className="receipt-line">
                  <span>Pagamento</span>
                  <span>
                    {PAYMENT_LABELS[lastSale.paymentMethod]}
                  </span>
                </div>
              </div>

              {lastSale.note && (
                <>
                  <hr />
                  <div className="receipt-section">
                    <span className="receipt-notes-label">
                      Observações:
                    </span>
                    <p className="receipt-notes">{lastSale.note}</p>
                  </div>
                </>
              )}

              <hr />

              <p className="receipt-footer">
                Obrigado pela preferência!
              </p>
            </div>

            <div className="receipt-actions">
              <p>Deseja imprimir o comprovante?</p>

              <div className="receipt-buttons">
                <button
                  className="btn-print"
                  onClick={handlePrintReceipt}>
                  Imprimir
                </button>

                <button
                  className="btn-close"
                  onClick={() => setShowReceipt(false)}>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {sizeModalProduct && (
        <ModalSelectSize
          open={true}
          product={sizeModalProduct}
          onClose={() => setSizeModalProduct(null)}
          onSelect={handleSelectSize}
        />
      )}




    </div>
  );
}
