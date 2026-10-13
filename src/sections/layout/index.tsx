import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { PropsWithChildren, useMemo } from "react";
import NavBar from "./NavBar";
import { red } from "@mui/material/colors";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const ACCENT = "#81B64C";

const DARK = {
  bg: "#302E2B",
  surface: "#2F2D2A",
  surfaceRaised: "#403E3B",
  text: "#FFFFFF",
  textMuted: "#B7B6B5",
  border: "#4B4847",
};

const LIGHT = {
  bg: "#FBFBFB",
  surface: "#F1F1F1",
  surfaceRaised: "#E9E9E9",
  text: "#1D1D1D",
  textMuted: "#707070",
  border: "#D8D8D8",
};

export default function Layout({ children }: PropsWithChildren) {
  const [isDarkMode, setDarkMode] = useLocalStorage("useDarkMode", true);

  const theme = useMemo(() => {
    const t = isDarkMode ? DARK : LIGHT;

    return createTheme({
      palette: {
        mode: isDarkMode ? "dark" : "light",
        primary: {
          main: ACCENT,
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: t.surfaceRaised,
        },
        background: {
          default: t.bg,
          paper: t.surface,
        },
        text: {
          primary: t.text,
          secondary: t.textMuted,
        },
        divider: t.border,
        error: {
          main: red[400],
        },
      },
      shape: {
        borderRadius: 10,
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
      },
    });
  }, [isDarkMode]);

  if (isDarkMode === null) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavBar
        darkMode={isDarkMode}
        switchDarkMode={() => setDarkMode((val) => !val)}
      />
      <Box component="main" sx={{ margin: { xs: "1.5vh 2vw", md: "2vh 1vw" } }}>
        {children}
      </Box>
    </ThemeProvider>
  );
}
