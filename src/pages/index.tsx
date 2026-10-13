import Board from "@/sections/analysis/board";
import LeftRail from "@/sections/analysis/review/leftRail";
import MobileNav from "@/sections/analysis/review/mobileNav";
import RightRail from "@/sections/analysis/review/rightRail";
import { useReviewEngine } from "@/sections/analysis/review/useReviewEngine";
import {
  boardAtom,
  boardOrientationAtom,
  gameAtom,
  gameEvalAtom,
} from "@/sections/analysis/states";
import {
  Box,
  Grid2 as Grid,
  LinearProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import EngineSettingsButton from "@/sections/engineSettings/engineSettingsButton";
import { PageTitle } from "@/components/pageTitle";
import EntryScreen from "@/sections/loadGame/entryScreen";
import { useChessActions } from "@/hooks/useChessActions";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { Chess } from "chess.js";

export default function GameAnalysis() {
  const isWideLayout = useMediaQuery("(min-width:1000px)");

  const game = useAtomValue(gameAtom);
  const { setPgn: setGamePgn } = useChessActions(gameAtom);
  const { resetToStartingPosition } = useChessActions(boardAtom);
  const setEval = useSetAtom(gameEvalAtom);
  const setBoardOrientation = useSetAtom(boardOrientationAtom);

  const { isAnalyzing, evaluationProgress } = useReviewEngine();

  const headers = game.getHeaders();
  const isGameLoaded =
    game.history().length > 0 || (!!headers.White && headers.White !== "?");

  const handleSelectGame = useCallback(
    (pgn: string, orientation?: boolean) => {
      try {
        const parsed = new Chess();
        parsed.loadPgn(pgn);

        resetToStartingPosition(pgn);
        setEval(undefined);
        setGamePgn(pgn);
        setBoardOrientation(orientation ?? true);
      } catch (error) {
        console.error(error);
      }
    },
    [resetToStartingPosition, setEval, setGamePgn, setBoardOrientation]
  );

  if (!isGameLoaded) {
    return (
      <>
        <PageTitle title="ChessKit Improved" />
        <EntryScreen onSelect={handleSelectGame} />
        <EngineSettingsButton />
      </>
    );
  }

  const plateSx = {
    borderRadius: 2,
    border: 1,
    borderColor: "divider",
    backgroundColor: "background.paper",
    overflow: "hidden",
  } as const;

  return (
    <>
      <PageTitle title="ChessKit Improved — Review" />

      <Grid
        container
        gap={1.5}
        wrap={isWideLayout ? "nowrap" : "wrap"}
        justifyContent="center"
        alignItems="stretch"
        sx={{
          maxWidth: 1600,
          marginX: "auto",
          height: { md: "calc(100vh - 88px)" },
        }}
      >
        <Grid
          sx={{
            ...plateSx,
            order: { xs: 2, md: 1 },
            width: { xs: "100%", md: 280, lg: 320 },
            flexShrink: 0,
            p: { xs: 2, lg: 2.5 },
            overflowY: "auto",
          }}
        >
          <LeftRail />
        </Grid>

        <Grid
          size={{ xs: 12, md: "grow" }}
          sx={{
            order: { xs: 1, md: 2 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Board />
          <MobileNav />
        </Grid>

        <Grid
          sx={{
            ...plateSx,
            order: { xs: 3, md: 3 },
            width: { xs: "100%", md: 330, lg: 380 },
            flexShrink: 0,
            display: "flex",
            minHeight: 0,
          }}
        >
          <RightRail />
        </Grid>
      </Grid>

      <EngineSettingsButton />

      {isAnalyzing && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            backgroundColor: "rgba(8,7,10,0.72)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Box sx={{ width: 320, maxWidth: "80vw" }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, evaluationProgress))}
            />
          </Box>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Analyzing game… {Math.round(evaluationProgress)}%
          </Typography>
        </Box>
      )}
    </>
  );
}
