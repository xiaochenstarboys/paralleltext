import React from "react";
import ReactDOM from "react-dom/client";
import Options from "./views/Options";
import { startWebDataSync } from "./modules/dataSync/client";

                                          
globalThis.__KISS_CONTEXT__ = "options";
startWebDataSync();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
