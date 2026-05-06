import React from "react";
import { createRoot } from "react-dom/client";
import CampusNotifications from "../../CampusNotifications.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CampusNotifications />
  </React.StrictMode>
);
