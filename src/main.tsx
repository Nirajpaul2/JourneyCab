import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./operations.css";
import "./brand.css";
const Operations = lazy(() => import("./components/Operations"));
const Tracking = lazy(() => import("./components/Tracking"));
const Privacy = lazy(() => import("./components/Privacy"));
const path = window.location.pathname.replace(/\/$/, "") || "/";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<p className="ops-login">Loading Aryan Tour and Travel…</p>}>
      {path === "/admin" ? (
        <Operations />
      ) : path === "/track" ? (
        <Tracking />
      ) : path === "/privacy" ? (
        <Privacy />
      ) : (
        <App />
      )}
    </Suspense>
  </React.StrictMode>,
);
