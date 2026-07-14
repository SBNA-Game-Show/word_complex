import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { warmUpProgressApi } from "./progress";
import "./App.css";

// Wake the (possibly cold) Render backend right away, so streak/stars are
// ready by the time the user signs in and reaches the launcher.
warmUpProgressApi();

// Render the app in the root element
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
