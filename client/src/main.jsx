import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { warmUpProgressApi } from "./progress";
import { installAdminAuthInterceptor } from "./auth/adminAuthInterceptor";
import "./App.css";

// Attach the admin's Firebase token to admin-only API calls (no change to the
// admin feature's own code). Install before anything can issue a fetch.
installAdminAuthInterceptor();

// Wake the (possibly cold) Render backend right away, so streak/stars are
// ready by the time the user signs in and reaches the launcher.
warmUpProgressApi();

// Render the app in the root element
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
