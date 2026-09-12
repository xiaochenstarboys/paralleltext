import React from "react";
import ReactDOM from "react-dom/client";
import { SettingProvider } from "./hooks/Setting";
import { AlertProvider } from "./hooks/Alert";
import { ConfirmProvider } from "./hooks/Confirm";
import ThemeProvider from "./hooks/Theme";
import Popup from "./views/Popup";

                                            
globalThis.__KISS_CONTEXT__ = "popup";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {                                }
    <SettingProvider context="popup">
      <ThemeProvider>
        <AlertProvider>
          <ConfirmProvider>
            <Popup />
          </ConfirmProvider>
        </AlertProvider>
      </ThemeProvider>
    </SettingProvider>
  </React.StrictMode>
);
