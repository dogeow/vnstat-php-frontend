import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import type { Bootstrap } from "./types";

const bootstrap = window.__VNSTAT_BOOTSTRAP__ as Bootstrap | undefined;
const root = document.getElementById("app-root");

if (!bootstrap) {
  throw new Error("Missing vnStat bootstrap payload.");
}

if (!root) {
  throw new Error("Missing React mount node.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App bootstrap={bootstrap} />
  </React.StrictMode>
);
