import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { IS_MAC } from "./ui/platform";
import "./styles/tokens.css";
import "./styles/surface.css";
import "./styles/app.css";

/* macOS：给 <html> 打标记，供 CSS 让出原生红黄绿三键的位置
   （见 app.css 的 html[data-os="mac"] 规则）。 */
if (IS_MAC) document.documentElement.dataset.os = "mac";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
