import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";

// Render the app in the root element
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
