import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AssistantProvider } from "./lib/assistant-context";
import { DataProvider } from "./lib/data-provider";
import "leaflet/dist/leaflet.css";
import "./index.css";
import "./i18n";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <DataProvider>
    <AssistantProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AssistantProvider>
  </DataProvider>,
);
