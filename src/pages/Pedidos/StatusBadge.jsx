import React, { useState, useRef, useEffect } from "react";
import "./StatusBadge.scss";

export default function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const statusList = [
    { id: "pendente", label: "Pendente" },
    { id: "preparando", label: "Preparando" },
    { id: "concluido", label: "Concluído" },
  ];

  const statusColors = {
    pendente: { bg: "#FEF3C7", color: "#B45309" },
    preparando: { bg: "#DBEAFE", color: "#1D4ED8" },
    concluido: { bg: "#D1FAE5", color: "#059669" },
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (open && ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="status-badge-wrapper" ref={ref}>
      <button
        className="status-badge"
        style={{
          background: statusColors[status].bg,
          color: statusColors[status].color,
        }}
        onClick={() => setOpen(!open)}
      >
        {statusColors[status]
          ? statusList.find((s) => s.id === status)?.label
          : "Status"}

        <span className="arrow"></span>
      </button>

      {open && (
        <div className="status-dropdown">
          <div className="dropdown-arrow" />
          {statusList.map((item) => (
            <div
              key={item.id}
              className="dropdown-item"
              onClick={() => {
                onChange(item.id);
                setOpen(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
