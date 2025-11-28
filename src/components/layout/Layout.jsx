import React, { useState } from "react";
import Sidebar from "../sidebar/SideBar";
import "./Layout.scss";
import Header from "../header/Header";

const Layout = ({ title, children }) => {
  const [searchQuery, setSearchQuery] = useState("");

// ajustei diversas coisas

  return (
    <div className="layout-container">
      <Sidebar />

      <div className="layout-content">
        <Header title={title} setSearchQuery={setSearchQuery} />

        <div className="layout-inner">
          {/* Clonamos children e injetamos a prop searchQuery */}
          {React.cloneElement(children, { searchQuery })}
        </div>
      </div>
    </div>
  );
};  

export default Layout;
