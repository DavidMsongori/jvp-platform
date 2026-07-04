import React from "react";
import ReactDOM from "react-dom/client";

import "./styles/global.css";
import "./styles/variables.css";
import "./styles/utilities.css";
import "./styles/buttons.css";
import "./styles/section.css";

import { MemberProvider } from "./context/MemberContext";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MemberProvider>
      <App />
    </MemberProvider>
  </React.StrictMode>
);