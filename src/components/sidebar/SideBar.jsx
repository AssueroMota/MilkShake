import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.scss";

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* BOTÃO HAMBÚRGUER (visível no mobile) */}
      <button className="hamburger-btn" onClick={() => setOpen(true)} />

      {/* OVERLAY ESCURO */}
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        {/* FECHAR MOBILE */}
        <button className="close-sidebar" onClick={() => setOpen(false)}>
          ✕
        </button>

        {/* LOGO */}
        <div className="sidebar-logo">
          <div className="logo-icon" />
          <span className="logo-text">Admin Panel</span>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
          <Link
            to="/caixa"
            onClick={() => setOpen(false)}
            className={isActive("/caixa") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon caixa-icon" />
            <span className="menu-text">Caixa (PDV)</span>
          </Link>

          <Link
            to="/cardapio"
            onClick={() => setOpen(false)}
            className={isActive("/cardapio") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon cardapio-icon" />
            <span className="menu-text">Cardápio</span>
          </Link>

          <Link
            to="/pedidos"
            onClick={() => setOpen(false)}
            className={isActive("/pedidos") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon pedidos-icon" />
            <span className="menu-text">Pedidos</span>
          </Link>

          <Link
            to="/produtos"
            onClick={() => setOpen(false)}
            className={isActive("/produtos") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon produtos-icon" />
            <span className="menu-text">Produtos</span>
          </Link>

          <Link
            to="/combos"
            onClick={() => setOpen(false)}
            className={isActive("/combos") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon combos-icon" />
            <span className="menu-text">Combos</span>
          </Link>

          <Link
            to="/categorias"
            onClick={() => setOpen(false)}
            className={isActive("/categorias") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon categorias-icon" />
            <span className="menu-text">Categorias</span>
          </Link>

          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className={isActive("/dashboard") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon dashboard-icon" />
            <span className="menu-text">Dashboard</span>
          </Link>

          {/* <Link
            to="/adicionais"
            onClick={() => setOpen(false)}
            className={isActive("/adicionais") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon adicionais-icon" />
            <span className="menu-text">Adicionais</span>
          </Link> */}

          {/* <Link
            to="/promocoes"
            onClick={() => setOpen(false)}
            className={isActive("/promocoes") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon promocoes-icon" />
            <span className="menu-text">Promoções</span>
          </Link> */}

          {/* <Link
            to="/configuracoes"
            onClick={() => setOpen(false)}
            className={isActive("/configuracoes") ? "menu-item active" : "menu-item"}
          >
            <span className="menu-icon config-icon" />
            <span className="menu-text">Configurações</span>
          </Link> */}

          <Link to="/" onClick={() => setOpen(false)} className="menu-item">
            <span className="menu-icon sair-icon" />
            <span className="menu-text">Sair</span>
          </Link>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
