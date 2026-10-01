import React from "react";
import { createRoot } from "react-dom/client";
import ClientApp from "./client.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClientApp />
  </React.StrictMode>,
);