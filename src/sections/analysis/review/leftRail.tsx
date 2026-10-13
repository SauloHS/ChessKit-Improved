import { Box, Stack, Typography } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { Chess } from "chess.js";
import {
  boardAtom,
  currentPositionAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { computePositionMetrics } from "@/lib/engine/helpers/positionMetrics";
import { CLASSIFICATION_COLORS } from "@/constants";
import { MoveClassification } from "@/types/enums";
import { moveLineUciToSan } from "@/lib/chess";

const LABELS: Record<MoveClassification, string> = {
  [MoveClassification.Book]: "is a book move",
  [MoveClassification.Brilliant]: "is brilliant",
  [MoveClassification.Great]: "is the only good move",
  [MoveClassification.Best]: "is the best move",
  [MoveClassification.Excellent]: "is excellent",
  [MoveClassification.Okay]: "is an okay move",
  [MoveClassification.Inaccuracy]: "is an inaccuracy",
  [MoveClassification.Mistake]: "is a mistake",
  [MoveClassification.Blunder]: "is a blunder",
  [MoveClassification.Forced]: "is forced",
};

const START_TEXT = "Use the ← → arrows to begin.";

export default function LeftRail() {
  const position = useAtomValue(currentPositionAtom);
  const board = useAtomValue(boardAtom);
  const setGame = useSetAtom(gameAtom);
  const setGameEval = useSetAtom(gameEvalAtom);
  const { resetToStartingPosition } = useChessActions(boardAtom);

  const fen = board.fen();
  const metrics = useMemo(() => computePositionMetrics(fen), [fen]);

  const moveClass = position?.eval?.moveClassification;
  const lastMoveSan = position?.lastMove?.san;

  const bestMoveSan = useMemo(() => {
    const bestMove = position?.lastEval?.bestMove;
    if (!bestMove) return undefined;

    const before = board.history({ verbose: true }).at(-1)?.before;
    if (!before) return undefined;

    return moveLineUciToSan(before)(bestMove);
  }, [position, board]);

  const showBestMove =
    !!bestMoveSan &&
    !!moveClass &&
    ![
      MoveClassification.Best,
      MoveClassification.Book,
      MoveClassification.Brilliant,
      MoveClassification.Forced,
    ].includes(moveClass);

  const goHome = () => {
    setGame(new Chess());
    setGameEval(undefined);
    resetToStartingPosition();
  };

  return (
    <Stack rowGap={3} sx={{ height: "100%" }}>
      <Box
        onClick={goHome}
        sx={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.2,
          py: 0.7,
          fontSize: 12,
          color: "text.secondary",
          border: 1,
          borderColor: "divider",
          borderRadius: 1.5,
          cursor: "pointer",
          transition: "color .16s, border-color .16s",
          "&:hover": { color: "text.primary", borderColor: "text.secondary" },
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 6 9 12l5.5 6" />
        </svg>
        Home
      </Box>

      <Box sx={{ pb: 2.5, borderBottom: 1, borderColor: "divider" }}>
        {moveClass ? (
          <>
            <Stack direction="row" alignItems="center" gap={1.2} sx={{ mb: 1 }}>
              <Box
                component="img"
                src={`/icons/${moveClass}.png`}
                alt=""
                sx={{ width: 26, height: 26, objectFit: "contain" }}
              />
              <Typography
                sx={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 27,
                  letterSpacing: "-0.024em",
                  lineHeight: 1.16,
                  color: CLASSIFICATION_COLORS[moveClass],
                }}
              >
                {labelFor(moveClass)}
              </Typography>
            </Stack>

            <Typography
              sx={{ fontSize: 14, lineHeight: 1.62, color: "text.secondary" }}
            >
              {lastMoveSan} {LABELS[moveClass]}.
            </Typography>
          </>
        ) : (
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 27,
              letterSpacing: "-0.024em",
              lineHeight: 1.16,
            }}
          >
            {START_TEXT}
          </Typography>
        )}

        {showBestMove && (
          <Stack direction="row" alignItems="center" gap={0.8} sx={{ mt: 2 }}>
            <Box
              component="img"
              src="/icons/best.png"
              alt=""
              sx={{ width: 16, height: 16, objectFit: "contain" }}
            />
            <Typography sx={{ fontSize: 14 }}>
              {bestMoveSan} is better.
            </Typography>
          </Stack>
        )}
      </Box>

      <Stack rowGap={1.6}>
        <MetricBar label="Development" pair={metrics.development} />
        <MetricBar label="Tension & pressure" pair={metrics.tension} />
        <MetricBar label="Mobility" pair={metrics.mobility} />
        <MetricBar label="Control" pair={metrics.control} />
      </Stack>

      <Typography
        sx={{
          mt: "auto",
          fontSize: 12,
          lineHeight: 1.6,
          color: "text.secondary",
        }}
      >
        Drag a piece on the board to test another move in the current position.
      </Typography>
    </Stack>
  );
}

const labelFor = (moveClass: MoveClassification) =>
  moveClass.charAt(0).toUpperCase() + moveClass.slice(1);

function MetricBar({
  label,
  pair,
}: {
  label: string;
  pair: { white: number; black: number };
}) {
  const total = pair.white + pair.black;
  const ratio = total === 0 ? 0.5 : pair.white / total;

  return (
    <Box>
      <Typography
        sx={{
          mb: 0.8,
          fontSize: 10,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: 7,
          borderRadius: 999,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          background: "linear-gradient(180deg, #34353a, #232427)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,.6)",
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "50%",
            width: "1px",
            bgcolor: "primary.main",
            opacity: 0.5,
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            transformOrigin: "left center",
            transform: `scaleX(${ratio})`,
            background: "linear-gradient(180deg, #f4f1ea, #ddd8cd)",
            transition: "transform .32s cubic-bezier(.16,1,.3,1)",
          }}
        />
      </Box>
    </Box>
  );
}
