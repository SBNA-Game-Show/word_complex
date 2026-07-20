import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./auth";
import RequireAdmin from "./components/RequireAdmin";
import { installAdminAuthInterceptor } from "./auth/adminAuthInterceptor";
import AdminPage from "./components/AdminPage";

// Vite dev serves this standalone entry for /admin, so it must be gated too
// (the built SPA gates /admin via App.jsx). AuthProvider gives RequireAdmin the
// current user; the interceptor attaches the admin token to admin API calls.
installAdminAuthInterceptor();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RequireAdmin>
        <AdminPage />
      </RequireAdmin>
    </AuthProvider>
  </React.StrictMode>
);
