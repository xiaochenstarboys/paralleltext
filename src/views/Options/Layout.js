import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import useMediaQuery from "@mui/material/useMediaQuery";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Navigator from "./Navigator";
import Header from "./Header";
import { useTheme } from "@mui/material/styles";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import { useI18n } from "../../hooks/I18n";

export async function fetchLatestVersion() {
  const versionUrls = [
    process.env.REACT_APP_VERSION_URL,
    process.env.REACT_APP_VERSION_URL_GITHUB,
  ].filter(Boolean);
  let lastError;

  for (const versionUrl of versionUrls) {
    try {
      const response = await fetch(`${versionUrl}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Version request failed: ${response.status}`);
      }
      return (await response.text()).trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No version URL configured");
}

   
                               
   
export default function Layout() {
  const navWidth = 256;                            
  const location = useLocation();
  const theme = useTheme();
                         
  const [open, setOpen] = useState(false);
                          
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  const i18n = useI18n();
  const [latestVersion, setLatestVersion] = useState("");

  useEffect(() => {
    fetchLatestVersion()
      .then((lv) => {
        const currentVersion = process.env.REACT_APP_VERSION;
        if (lv && currentVersion && lv !== currentVersion) {
          setLatestVersion(lv);
        }
      })
      .catch((err) => console.error("fetch version error:", err));
  }, []);

             
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

                                      
  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <Box>
      {                }
      <CssBaseline />
      {               }
      <Header onDrawerToggle={handleDrawerToggle} />

      <Box sx={{ display: "flex" }}>
        {             }
        <Box
          component="nav"
          sx={{ width: { sm: navWidth }, flexShrink: { sm: 0 } }}
        >
          {                                                    }
          <Navigator
            PaperProps={{ style: { width: navWidth } }}
            variant={isSm ? "permanent" : "temporary"}
            open={isSm ? true : open}
            onClose={handleDrawerToggle}
          />
        </Box>

        {                                                        }
        <Box component="main" sx={{ flex: 1, p: 2, width: "100%" }}>
          {latestVersion && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {i18n("version_warning")
                .replace("{0}", process.env.REACT_APP_VERSION)
                .replace("{1}", latestVersion)}
              <Link
                href={process.env.REACT_APP_RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {i18n("download_update")}
              </Link>
            </Alert>
          )}
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
