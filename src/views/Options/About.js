import { Box, CssBaseline, Stack, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Logo from "../../components/Logo";
import ProductIntroduction from "../../components/ProductIntroduction";
import { getProductCopy } from "../../config/productCopy";
import { useSetting } from "../../hooks/Setting";
import { siteDarkTheme, S } from "../../homepage/siteDarkTheme";
import SiteBackground from "../../homepage/SiteBackground";
import EngineTermsNav from "./EngineTermsNav";

export default function About() {
  const {
    setting: { uiLang },
  } = useSetting();
  const copy = getProductCopy(uiLang);
  return (
    <ThemeProvider theme={siteDarkTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: S.bg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <SiteBackground />
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "min(1000px, calc(100% - 32px))",
            mx: "auto",
            py: { xs: 3, sm: 5 },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Logo size={36} />
              <Box>
                <Typography
                  sx={{ color: S.text, fontSize: 19, fontWeight: 700 }}
                >
                  {copy.about}
                </Typography>
                <Typography sx={{ color: S.sub, fontSize: 13 }}>
                  v{process.env.REACT_APP_VERSION}
                </Typography>
              </Box>
            </Stack>
            <EngineTermsNav active="about" />
          </Stack>
          <Box sx={{ maxWidth: 880, mx: "auto", mt: { xs: 4, sm: 7 } }}>
            <Typography
              sx={{
                color: S.blue,
                fontSize: { xs: 18, sm: 22 },
                lineHeight: 1.7,
              }}
            >
              {copy.tagline}
            </Typography>
            <ProductIntroduction language={uiLang} headingComponent="h1" />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
