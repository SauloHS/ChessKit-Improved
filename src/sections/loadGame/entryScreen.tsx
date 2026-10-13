import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import ChessComLookup from "./chessComLookup";

interface Props {
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
}

export default function EntryScreen({ onSelect }: Props) {
  const [mode, setMode] = useState<"pgn" | "chesscom">("chesscom");
  const [pgn, setPgn] = useState("");

  return (
    <Box
      sx={{
        maxWidth: 900,
        marginX: "auto",
        paddingX: { xs: 2, md: 4 },
        paddingY: { xs: 4, md: 6 },
      }}
    >
      <Typography
        component="h1"
        sx={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: { xs: 32, md: 44 },
          fontWeight: 400,
          letterSpacing: "-0.028em",
          lineHeight: 1,
          mb: 4,
        }}
      >
        ChessKit Improved
      </Typography>

      <Stack
        direction="row"
        gap={3.5}
        sx={{ mb: 3.5, borderBottom: 1, borderColor: "divider" }}
      >
        <ModeTab
          label="PGN"
          active={mode === "pgn"}
          onClick={() => setMode("pgn")}
        />
        <ModeTab
          label="Chess.com"
          active={mode === "chesscom"}
          onClick={() => setMode("chesscom")}
        />
      </Stack>

      {mode === "pgn" ? (
        <Stack rowGap={2} sx={{ maxWidth: 620 }}>
          <Typography
            component="label"
            sx={{
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Game PGN
          </Typography>
          <TextField
            multiline
            minRows={10}
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder="Paste the full PGN here, with headers and moves."
            sx={{
              "& textarea": {
                fontFamily:
                  "ui-monospace, 'JetBrains Mono', Consolas, monospace",
                fontSize: 13,
                lineHeight: 1.7,
              },
            }}
          />
          <Box>
            <Button
              variant="contained"
              size="large"
              disabled={!pgn.trim()}
              onClick={() => onSelect(pgn)}
              sx={{ textTransform: "none" }}
            >
              Start review
            </Button>
          </Box>
        </Stack>
      ) : (
        <ChessComLookup onSelect={onSelect} />
      )}
    </Box>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        pb: 1.4,
        color: active ? "text.primary" : "text.secondary",
        cursor: "pointer",
        transition: "color .2s",
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -1,
          height: 2,
          borderRadius: 2,
          bgcolor: "primary.main",
          transform: active ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform .3s",
        },
        "&:hover": { color: "text.primary" },
      }}
    >
      <Typography sx={{ fontSize: 14 }}>{label}</Typography>
    </Box>
  );
}
