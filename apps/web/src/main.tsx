import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import "./styles/globals.css";
import { initializeTelegram } from "./lib/telegram";

initializeTelegram();
const basePath = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><BrowserRouter basename={basePath}><App /></BrowserRouter></React.StrictMode>);
