import { Routes, Route, HashRouter, Navigate } from "react-router-dom";
import Setting from "./Setting";
import Rules from "./Rules";
import Layout from "./Layout";
import { SettingProvider } from "../../hooks/Setting";
import ThemeProvider from "../../hooks/Theme";
import { useEffect } from "react";
import { AlertProvider } from "../../hooks/Alert";
import { ConfirmProvider } from "../../hooks/Confirm";
import Tranbox from "./Tranbox";
import Engines from "./Engines";
import Favorites from "./Favorites";
import WordBook from "./WordBook";
import History from "./History";
import About from "./About";
import { runDataMigration } from "../../libs/storage";

   
                         
   
export default function Options() {
  useEffect(() => {
                                  
    runDataMigration();
  }, []);

  return (
    <SettingProvider context="options">
      <ThemeProvider>
        <AlertProvider>
          <ConfirmProvider>
            {                   }
            <HashRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {                                               }
                  <Route index element={<Navigate to="/engines" replace />} />
                  <Route path="setting" element={<Setting />} />
                  <Route path="tranbox" element={<Tranbox />} />
                </Route>
                {                                     }
                <Route path="/rules" element={<Rules />} />
                {                                    }
                <Route path="/engines" element={<Engines />} />
                {                                    }
                <Route path="/favorites" element={<Favorites />} />
                {                                    }
                <Route path="/words" element={<WordBook />} />
                {                                    }
                <Route path="/history" element={<History />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </HashRouter>
          </ConfirmProvider>
        </AlertProvider>
      </ThemeProvider>
    </SettingProvider>
  );
}
