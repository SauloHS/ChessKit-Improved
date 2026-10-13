import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Grid2 as Grid,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { Chess, Move } from "chess.js";
import Link from "next/link";
import Board from "@/components/board";
import { useEngine } from "@/hooks/useEngine";
import { engineNameAtom } from "@/sections/analysis/states";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Color, MoveClassification } from "@/types/enums";
import { CurrentPosition, PositionEval } from "@/types/eval";
import { getPositionWinPercentage } from "@/lib/engine/helpers/winPercentage";
import { PageTitle } from "@/components/pageTitle";

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

interface Step {
  san: string;
  uci: string;
  fen: string;
  from: string;
  to: string;
  classification?: MoveClassification;
  byEngine?: boolean;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// An engine eval carries no lines when the game has ended.
const hasLine = (evaluation: PositionEval | null): evaluation is PositionEval =>
  !!evaluation && evaluation.lines.length > 0;

const classify = (
  before: number,
  after: number,
  isWhiteMove: boolean,
  playedUci: string,
  bestUci?: string
): MoveClassification => {
  if (bestUci && playedUci === bestUci) return MoveClassification.Best;

  const diff = (after - before) * (isWhiteMove ? 1 : -1);
  if (diff < -20) return MoveClassification.Blunder;
  if (diff < -10) return MoveClassification.Mistake;
  if (diff < -5) return MoveClassification.Inaccuracy;
  if (diff < -2) return MoveClassification.Okay;
  return MoveClassification.Excellent;
};

export default function FreePlay() {
  const gameAtomLocal = useMemo(() => atom(new Chess()), []);
  const posAtomLocal = useMemo(() => atom<CurrentPosition>({}), []);
  const showIconAtom = useMemo(() => atom(true), []);

  const game = useAtomValue(gameAtomLocal);
  const setGame = useSetAtom(gameAtomLocal);
  const setPosition = useSetAtom(posAtomLocal);

  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);

  const [steps, setSteps] = useState<Step[]>([]);
  const [pos, setPos] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [engineReply, setEngineReply] = useState(false);
  const [depthInput, setDepthInput] = useState(14);
  const [delayInput, setDelayInput] = useState(2);
  const [status, setStatus] = useState("");

  const screenSize = useScreenSize();
  const isWide = useMediaQuery("(min-width:1000px)");

  const boardSize = useMemo(() => {
    if (!isWide) return Math.min(screenSize.width, 560);

    const railsWidth = window.innerWidth >= 1200 ? 724 : 634;
    return Math.min(
      Math.min(screenSize.width, 1600) - railsWidth,
      screenSize.height - 16
    );
  }, [screenSize, isWide]);

  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const engineMovePending = useRef(false);

  const depth = useMemo(() => {
    const value = Math.round(Number(depthInput));
    return Number.isFinite(value) ? Math.max(1, Math.min(30, value)) : 14;
  }, [depthInput]);

  const replyDelay = useMemo(() => {
    const value = Number(delayInput);
    return Number.isFinite(value) ? Math.max(0, Math.min(10, value)) : 0;
  }, [delayInput]);

  const evaluate = useCallback(
    async (fen: string): Promise<PositionEval | null> => {
      if (!engine?.getIsReady()) return null;
      return engine.evaluatePositionWithUpdate({
        fen,
        depth,
        multiPv: 2,
      });
    },
    [engine, depth]
  );

  const recordMove = useCallback(
    async (
      move: Move,
      uci: string,
      fen: string,
      beforeEval: PositionEval | null,
      byEngine: boolean
    ) => {
      const afterEval = await evaluate(fen);

      let classification: MoveClassification | undefined;
      if (hasLine(beforeEval) && hasLine(afterEval)) {
        classification = classify(
          getPositionWinPercentage(beforeEval),
          getPositionWinPercentage(afterEval),
          move.color === "w",
          uci,
          beforeEval.bestMove
        );
      }

      const update: CurrentPosition = { lastMove: move };
      if (hasLine(afterEval)) {
        update.eval = { ...afterEval, moveClassification: classification };
      }
      setPosition(update);

      const step: Step = {
        san: move.san,
        uci,
        fen,
        from: move.from,
        to: move.to,
        classification,
        byEngine,
      };
      setSteps((prev) => [...prev, step]);
      setPos((prev) => prev + 1);

      return afterEval;
    },
    [evaluate, setPosition]
  );

  // Plays the engine's best move in the given position.
  const playEngineMove = useCallback(
    async (fromGame: Chess, beforeEval: PositionEval | null) => {
      const res =
        beforeEval ?? (await evaluate(fromGame.fen()));
      if (!res?.bestMove) return null;

      const next = new Chess(fromGame.fen());
      const played = next.move({
        from: res.bestMove.slice(0, 2),
        to: res.bestMove.slice(2, 4),
        promotion: res.bestMove.length > 4 ? res.bestMove[4] : undefined,
      });
      if (!played) return null;

      engineMovePending.current = true;
      setGame(next);
      const afterEval = await recordMove(
        played,
        res.bestMove,
        next.fen(),
        res,
        true
      );
      return afterEval;
    },
    [evaluate, recordMove, setGame]
  );

  // Reacts to the user's own moves.
  const lastFenRef = useRef(game.fen());
  useEffect(() => {
    const fen = game.fen();
    if (fen === lastFenRef.current) return;
    lastFenRef.current = fen;

    // The engine's own move is recorded where it is played.
    if (engineMovePending.current) {
      engineMovePending.current = false;
      return;
    }

    const history = game.history({ verbose: true });
    const last = history.at(-1);
    if (!last) return;

    (async () => {
      setBusy(true);
      setStatus("Thinking…");

      const beforeFen = history.length > 1 ? history.at(-2)!.after : START_FEN;
      const beforeEval = await evaluate(beforeFen);

      // Keep the recorded line in sync when branching from an earlier position.
      setSteps((prev) => prev.slice(0, history.length - 1));
      setPos(history.length - 1);

      const afterEval = await recordMove(
        last,
        last.from + last.to + (last.promotion ?? ""),
        fen,
        beforeEval,
        false
      );

      setStatus("");

      if (engineReply && hasLine(afterEval) && !game.isGameOver()) {
        if (replyDelay > 0) {
          setStatus("Stockfish replies in a moment…");
          await wait(replyDelay * 1000);
        }
        setStatus("Stockfish is thinking…");
        await playEngineMove(game, null);
        setStatus("");
      }

      setBusy(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const playEngineNow = async () => {
    if (busy || !engine?.getIsReady()) return;
    setBusy(true);
    setStatus("Stockfish is thinking…");
    await playEngineMove(game, null);
    setStatus("");
    setBusy(false);
  };

  const undoMove = () => {
    if (busy || steps.length === 0) return;

    const next = new Chess();
    const target = steps.slice(0, -1);
    target.forEach((step) => next.move(step.san));

    setSteps(target);
    setPos(target.length - 1);
    setGame(next);
    lastFenRef.current = next.fen();
    setPosition({});
    setStatus("");
  };

  const newGame = () => {
    if (busy) return;
    const next = new Chess();
    setSteps([]);
    setPos(-1);
    setGame(next);
    lastFenRef.current = next.fen();
    setPosition({});
    setStatus("");
  };

  const goToStep = (index: number) => {
    if (busy || index < 0 || index >= steps.length) return;

    const next = new Chess();
    steps.slice(0, index + 1).forEach((step) => next.move(step.san));
    setGame(next);
    lastFenRef.current = next.fen();
    setPos(index);
    setPosition({
      lastMove: {
        from: steps[index].from,
        to: steps[index].to,
        san: steps[index].san,
        color: index % 2 === 0 ? "w" : "b",
      } as unknown as Move,
      eval: steps[index].classification
        ? ({ moveClassification: steps[index].classification } as PositionEval)
        : undefined,
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToStep(pos - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToStep(pos + 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, steps, busy]);

  return (
    <>
      <PageTitle title="ChessKit Improved — Free play" />

      <Grid
        container
        gap={1.5}
        wrap={isWide ? "nowrap" : "wrap"}
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
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
            order: { xs: 2, md: 1 },
            width: { xs: "100%", md: 280, lg: 320 },
            flexShrink: 0,
            p: { xs: 2, lg: 2.5 },
            overflowY: "auto",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 24,
              mb: 2,
            }}
          >
            Drag a piece to begin.
          </Typography>

          <Stack rowGap={1.6} sx={{ mt: 2 }}>
            <OptionRow label="Depth (1 to 30)">
              <TextField
                type="number"
                size="small"
                value={depthInput}
                onChange={(e) => setDepthInput(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 30 } }}
                sx={{ width: 90 }}
              />
            </OptionRow>

            <OptionRow label="Pause before reply (s)">
              <TextField
                type="number"
                size="small"
                value={delayInput}
                onChange={(e) => setDelayInput(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0, max: 10, step: 0.5 } }}
                sx={{ width: 90 }}
              />
            </OptionRow>

            <Stack direction="row" alignItems="center" gap={1}>
              <Checkbox
                size="small"
                checked={engineReply}
                onChange={(e) => setEngineReply(e.target.checked)}
                sx={{ p: 0.4 }}
              />
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                Stockfish replies to my moves
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              onClick={playEngineNow}
              disabled={busy || !engine?.getIsReady()}
              sx={{ textTransform: "none" }}
            >
              Stockfish plays now
            </Button>
          </Stack>

          <Typography
            sx={{ mt: 2, fontSize: 12, color: "text.secondary", minHeight: 18 }}
          >
            {status}
          </Typography>
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
          <Board
            id="FreePlayBoard"
            canPlay={!busy}
            gameAtom={gameAtomLocal}
            boardSize={boardSize}
            whitePlayer={{ name: "White" }}
            blackPlayer={{ name: "Black" }}
            boardOrientation={Color.White}
            currentPositionAtom={posAtomLocal}
            showBestMoveArrow={false}
            showPlayerMoveIconAtom={showIconAtom}
            showEvaluationBar={true}
          />

          <Stack
            direction="row"
            gap={1}
            sx={{ display: { xs: "flex", md: "none" }, width: "100%" }}
          >
            <MobileButton
              disabled={pos < 0}
              onClick={() => goToStep(pos - 1)}
            >
              ←
            </MobileButton>
            <MobileButton
              disabled={pos >= steps.length - 1}
              onClick={() => goToStep(pos + 1)}
            >
              →
            </MobileButton>
            <MobileButton disabled={busy || steps.length === 0} onClick={undoMove}>
              Undo
            </MobileButton>
            <MobileButton disabled={busy} onClick={newGame}>
              New game
            </MobileButton>
          </Stack>
        </Grid>

        <Grid
          sx={{
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
            order: { xs: 3, md: 3 },
            width: { xs: "100%", md: 330, lg: 380 },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: 1,
              borderColor: "divider",
              fontSize: 14,
            }}
          >
            Free play
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: { xs: 260, lg: 0 },
              overflowY: "auto",
              px: 1.5,
              py: 1.5,
              scrollbarWidth: "thin",
            }}
          >
            {steps.map((_step, i) => {
              if (i % 2 === 1) return null;
              return (
                <Stack key={i} direction="row" sx={{ mb: 0.25 }}>
                  <Box
                    sx={{
                      width: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      pr: 0.9,
                      fontSize: 11,
                      color: "text.secondary",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {Math.floor(i / 2) + 1}
                  </Box>
                  <FreeCell
                    step={steps[i]}
                    active={pos === i}
                    onClick={() => goToStep(i)}
                  />
                  {steps[i + 1] ? (
                    <FreeCell
                      step={steps[i + 1]}
                      active={pos === i + 1}
                      onClick={() => goToStep(i + 1)}
                    />
                  ) : (
                    <Box sx={{ flex: 1 }} />
                  )}
                </Stack>
              );
            })}
          </Box>

          <Stack direction="row" gap={1} sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={undoMove}
              disabled={busy || steps.length === 0}
              sx={{ textTransform: "none" }}
            >
              Undo
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={newGame}
              disabled={busy}
              sx={{ textTransform: "none" }}
            >
              New game
            </Button>
          </Stack>

          <Box
            component={Link}
            href="/"
            sx={{
              py: 1.2,
              fontSize: 12,
              color: "text.secondary",
              textAlign: "center",
              textDecoration: "none",
              borderTop: 1,
              borderColor: "divider",
              "&:hover": { color: "primary.main" },
            }}
          >
            ← Home
          </Box>
        </Grid>
      </Grid>
    </>
  );
}

function OptionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={1.5}
    >
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

function MobileButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      onClick={disabled ? undefined : onClick}
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
        fontSize: 14,
        color: "text.secondary",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: "background.paper",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
        "&:active": disabled ? undefined : { transform: "translateY(1px)" },
      }}
    >
      {children}
    </Box>
  );
}

function FreeCell({
  step,
  active,
  onClick,
}: {
  step: Step;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={0.5}
      onClick={onClick}
      sx={{
        flex: 1,
        minHeight: 32,
        px: 1.1,
        py: 0.7,
        borderRadius: 1.2,
        fontSize: 13,
        fontVariantNumeric: "tabular-nums",
        cursor: "pointer",
        color: active ? "#1a1206" : "inherit",
        background: active
          ? "linear-gradient(180deg, #eab87a, #c98b4b)"
          : "transparent",
        "&:hover": active
          ? undefined
          : { backgroundColor: "rgba(255,255,255,0.06)" },
      }}
    >
      <Box component="span">{step.san}</Box>
      {step.classification && (
        <Box
          component="img"
          src={`/icons/${step.classification}.png`}
          alt=""
          sx={{ width: 15, height: 15, objectFit: "contain", flexShrink: 0 }}
        />
      )}
    </Stack>
  );
}
