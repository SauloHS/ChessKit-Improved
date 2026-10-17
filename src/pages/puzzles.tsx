import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Grid2 as Grid,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Chess, Move } from "chess.js";
import Board from "@/components/board";
import { PageTitle } from "@/components/pageTitle";
import { useScreenSize } from "@/hooks/useScreenSize";
import {
  PuzzleImportProgress,
  PuzzleRecord,
  downloadLichessPuzzles,
  getPuzzleCount,
  getRandomPuzzle,
  importLichessPuzzles,
} from "@/lib/lichess";
import { playSoundFromMove } from "@/lib/sounds";
import { Color, MoveClassification } from "@/types/enums";
import { CurrentPosition, PositionEval } from "@/types/eval";

type Status =
  | "loading"
  | "empty"
  | "waiting"
  | "playing"
  | "wrong"
  | "solution"
  | "solved";

type Outcome = "win" | "loss" | "neutral";

interface PuzzleStats {
  rating: number;
  solved: number;
  failed: number;
  streak: number;
  seen: string[];
}

const puzzleStatsAtom = atomWithStorage<PuzzleStats>(
  "puzzleStats",
  { rating: 1500, solved: 0, failed: 0, streak: 0, seen: [] },
  undefined,
  { getOnInit: true }
);

const THEMES: { value: string; label: string }[] = [
  { value: "any", label: "Any theme" },
  { value: "mate", label: "Checkmate" },
  { value: "mateIn1", label: "Mate in 1" },
  { value: "mateIn2", label: "Mate in 2" },
  { value: "mateIn3", label: "Mate in 3" },
  { value: "fork", label: "Fork" },
  { value: "pin", label: "Pin" },
  { value: "skewer", label: "Skewer" },
  { value: "discoveredAttack", label: "Discovered attack" },
  { value: "doubleCheck", label: "Double check" },
  { value: "hangingPiece", label: "Hanging piece" },
  { value: "sacrifice", label: "Sacrifice" },
  { value: "deflection", label: "Deflection" },
  { value: "attraction", label: "Attraction" },
  { value: "backRankMate", label: "Back rank mate" },
  { value: "smotheredMate", label: "Smothered mate" },
  { value: "trappedPiece", label: "Trapped piece" },
  { value: "zugzwang", label: "Zugzwang" },
  { value: "promotion", label: "Promotion" },
  { value: "exposedKing", label: "Exposed king" },
  { value: "quietMove", label: "Quiet move" },
  { value: "xRayAttack", label: "X-ray attack" },
  { value: "intermezzo", label: "Intermezzo" },
  { value: "clearance", label: "Clearance" },
  { value: "interference", label: "Interference" },
  { value: "defensiveMove", label: "Defensive move" },
  { value: "capturingDefender", label: "Capturing defender" },
  { value: "opening", label: "Opening" },
  { value: "middlegame", label: "Middlegame" },
  { value: "endgame", label: "Endgame" },
  { value: "short", label: "Short puzzle" },
  { value: "long", label: "Long puzzle" },
  { value: "crushing", label: "Crushing" },
  { value: "advantage", label: "Advantage" },
  { value: "equality", label: "Equality" },
];

const LIMITS = [25000, 50000, 100000, 200000];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const applyUci = (chess: Chess, uci: string): Move =>
  chess.move({
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  });

const buildGame = (fen: string, ucis: string[]) => {
  const chess = new Chess(fen);
  let last: Move | undefined;
  for (const uci of ucis) last = applyUci(chess, uci);
  return { chess, last };
};

const nextRating = (
  rating: number,
  puzzleRating: number,
  won: boolean,
  played: number
) => {
  const expected = 1 / (1 + 10 ** ((puzzleRating - rating) / 400));
  const k = played < 30 ? 40 : 24;
  return Math.round(rating + k * ((won ? 1 : 0) - expected));
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function Puzzles() {
  const gameAtomLocal = useMemo(() => atom(new Chess()), []);
  const posAtomLocal = useMemo(() => atom<CurrentPosition>({}), []);
  const showIconAtom = useMemo(() => atom(true), []);

  const game = useAtomValue(gameAtomLocal);
  const setGame = useSetAtom(gameAtomLocal);
  const setPosition = useSetAtom(posAtomLocal);
  const [stats, setStats] = useAtom(puzzleStatsAtom);

  const [count, setCount] = useState<number | null>(null);
  const [version, setVersion] = useState(0);
  const [puzzle, setPuzzle] = useState<PuzzleRecord | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [delta, setDelta] = useState(0);
  const [theme, setTheme] = useState("any");
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<PuzzleImportProgress | null>(null);
  const [limit, setLimit] = useState(100000);
  const [error, setError] = useState("");

  const screenSize = useScreenSize();
  const isWide = useMediaQuery("(min-width:1000px)");

  const boardSize = useMemo(() => {
    if (!isWide) return Math.min(screenSize.width, 560);

    return Math.max(
      320,
      Math.min(screenSize.width - 420, screenSize.height - 110, 720)
    );
  }, [screenSize, isWide]);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const puzzleRef = useRef<PuzzleRecord | null>(null);
  const statusRef = useRef<Status>("loading");
  const indexRef = useRef(0);
  const tokenRef = useRef(0);
  const mistakeRef = useRef(false);
  const hintRef = useRef(false);
  const resultRef = useRef<Outcome | null>(null);
  const programmaticFenRef = useRef("");
  const lastFenRef = useRef(game.fen());
  const abortRef = useRef<AbortController | null>(null);

  const updateStatus = useCallback((next: Status) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const showGame = useCallback(
    (chess: Chess, lastMove?: Move) => {
      programmaticFenRef.current = chess.fen();
      setGame(chess);
      setPosition({ lastMove });
    },
    [setGame, setPosition]
  );

  const applyResult = useCallback(
    (result: Outcome) => {
      const current = puzzleRef.current;
      if (!current || resultRef.current) return;
      resultRef.current = result;

      const before = statsRef.current;
      const after =
        result === "neutral"
          ? before.rating
          : nextRating(
              before.rating,
              current.rating,
              result === "win",
              before.solved + before.failed
            );

      setOutcome(result);
      setDelta(after - before.rating);
      setStats((prev) => ({
        ...prev,
        rating: after,
        solved: prev.solved + (result === "loss" ? 0 : 1),
        failed: prev.failed + (result === "loss" ? 1 : 0),
        streak:
          result === "win"
            ? prev.streak + 1
            : result === "loss"
              ? 0
              : prev.streak,
      }));
    },
    [setStats]
  );

  const loadPuzzle = useCallback(
    async (themeKey: string) => {
      const token = ++tokenRef.current;
      updateStatus("loading");

      const next = await getRandomPuzzle({
        rating: statsRef.current.rating,
        theme: themeKey,
        excludeIds: statsRef.current.seen,
      });
      if (tokenRef.current !== token) return;

      if (!next) {
        puzzleRef.current = null;
        setPuzzle(null);
        updateStatus("empty");
        return;
      }

      puzzleRef.current = next;
      setPuzzle(next);
      indexRef.current = 0;
      mistakeRef.current = false;
      hintRef.current = false;
      resultRef.current = null;
      setOutcome(null);
      setDelta(0);
      setStats((prev) => ({
        ...prev,
        seen: [next.id, ...prev.seen].slice(0, 1000),
      }));

      showGame(new Chess(next.fen));
      updateStatus("waiting");

      await wait(600);
      if (tokenRef.current !== token) return;

      const { chess, last } = buildGame(next.fen, next.moves.slice(0, 1));
      indexRef.current = 1;
      showGame(chess, last);
      playSoundFromMove(last ?? null);
      updateStatus("playing");
    },
    [setStats, showGame, updateStatus]
  );

  useEffect(() => {
    getPuzzleCount()
      .then(setCount)
      .catch(() => {
        setCount(0);
        setError("Could not open the local puzzle database in this browser.");
      });
  }, [version]);

  useEffect(() => {
    if (!count) return;
    loadPuzzle(theme);
  }, [count, theme, version, loadPuzzle]);

  useEffect(() => {
    const fen = game.fen();
    if (fen === lastFenRef.current) return;
    lastFenRef.current = fen;
    if (fen === programmaticFenRef.current) return;

    const current = puzzleRef.current;
    if (!current || statusRef.current !== "playing") return;

    const last = game.history({ verbose: true }).at(-1);
    if (!last) return;

    const token = tokenRef.current;
    const uci = last.from + last.to + (last.promotion ?? "");
    const expected = current.moves[indexRef.current];

    if (uci === expected || game.isCheckmate()) {
      indexRef.current += 1;

      const classified: PositionEval = {
        lines: [],
        moveClassification: MoveClassification.Best,
      };
      setPosition({ lastMove: last, eval: classified });

      if (indexRef.current >= current.moves.length || game.isCheckmate()) {
        applyResult(
          mistakeRef.current ? "loss" : hintRef.current ? "neutral" : "win"
        );
        updateStatus("solved");
        return;
      }

      (async () => {
        updateStatus("waiting");
        await wait(450);
        if (tokenRef.current !== token) return;

        const { chess, last: reply } = buildGame(
          current.fen,
          current.moves.slice(0, indexRef.current + 1)
        );
        indexRef.current += 1;
        showGame(chess, reply);
        playSoundFromMove(reply ?? null);
        updateStatus("playing");
      })();
      return;
    }

    mistakeRef.current = true;
    applyResult("loss");

    const classified: PositionEval = {
      lines: [],
      moveClassification: MoveClassification.Blunder,
    };
    setPosition({ lastMove: last, eval: classified });
    updateStatus("wrong");

    (async () => {
      await wait(800);
      if (tokenRef.current !== token) return;

      const { chess, last: previous } = buildGame(
        current.fen,
        current.moves.slice(0, indexRef.current)
      );
      showGame(chess, previous);
      updateStatus("playing");
    })();
  }, [game, applyResult, setPosition, showGame, updateStatus]);

  const showHint = () => {
    const current = puzzleRef.current;
    if (!current || statusRef.current !== "playing") return;

    const expected = current.moves[indexRef.current];
    if (!expected) return;

    hintRef.current = true;
    setPosition((prev) => ({
      ...prev,
      lastEval: { bestMove: expected, lines: [] },
    }));
  };

  const showSolution = async () => {
    const current = puzzleRef.current;
    if (!current || statusRef.current !== "playing") return;

    applyResult("loss");
    updateStatus("solution");

    const token = tokenRef.current;
    for (let i = indexRef.current; i < current.moves.length; i++) {
      await wait(700);
      if (tokenRef.current !== token) return;

      const { chess, last } = buildGame(
        current.fen,
        current.moves.slice(0, i + 1)
      );
      indexRef.current = i + 1;
      showGame(chess, last);
      playSoundFromMove(last ?? null);
    }

    updateStatus("solved");
  };

  const runImport = async (task: (signal: AbortSignal) => Promise<number>) => {
    const controller = new AbortController();
    abortRef.current = controller;

    setImporting(true);
    setError("");
    setProgress(null);
    tokenRef.current++;

    try {
      await task(controller.signal);
      setShowImport(false);
    } catch (importError) {
      const cancelled =
        importError instanceof DOMException &&
        importError.name === "AbortError";
      setError(
        cancelled
          ? "Import cancelled."
          : importError instanceof Error
            ? importError.message
            : "Import failed."
      );
    } finally {
      abortRef.current = null;
      setImporting(false);
      setVersion((v) => v + 1);
    }
  };

  const handleDownload = () =>
    runImport((signal) =>
      downloadLichessPuzzles({ limit, signal, onProgress: setProgress })
    );

  const handleFile = (file: File) =>
    runImport((signal) =>
      importLichessPuzzles(file, { limit, signal, onProgress: setProgress })
    );

  const playerColor =
    puzzle?.fen.split(" ")[1] === "w" ? Color.Black : Color.White;
  const finished = status === "solved";
  const canMove = status !== "solved" && status !== "empty" && !!puzzle;

  const message = (() => {
    if (status === "loading") return "Loading puzzle…";
    if (status === "empty") return "No puzzles found for this theme.";
    if (status === "waiting") return "Opponent is moving…";
    if (status === "wrong") return "That's not it. Try again.";
    if (status === "solution") return "Showing the solution…";
    if (status === "solved") {
      if (outcome === "win") return "Puzzle solved!";
      if (outcome === "neutral") return "Solved with a hint.";
      return "Solved, but it counted as a miss.";
    }
    return `Your turn. Find the best move for ${
      playerColor === Color.White ? "White" : "Black"
    }.`;
  })();

  const importPanel = (
    <Stack
      rowGap={2}
      sx={{
        maxWidth: 560,
        marginX: "auto",
        p: 3,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Typography
        sx={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 24 }}
      >
        Import the Lichess puzzle database
      </Typography>

      <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
        Downloads the Lichess puzzle database straight into your browser and
        keeps a sample of it on this device. It stops as soon as it has enough
        puzzles, so it does not need the whole file. Nothing is uploaded
        anywhere.
      </Typography>

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
          Puzzles to keep
        </Typography>
        <Select
          size="small"
          value={limit}
          disabled={importing}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          {LIMITS.map((value) => (
            <MenuItem key={value} value={value}>
              {value.toLocaleString()}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Button
          variant="contained"
          disabled={importing}
          onClick={handleDownload}
          sx={{ textTransform: "none" }}
        >
          Download from Lichess
        </Button>

        <Button
          component="label"
          variant="outlined"
          disabled={importing}
          sx={{ textTransform: "none" }}
        >
          Choose file
          <input
            type="file"
            hidden
            accept=".csv,.zst"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) handleFile(file);
            }}
          />
        </Button>

        {importing && (
          <Button
            variant="outlined"
            onClick={() => abortRef.current?.abort()}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
        )}

        {!importing && count ? (
          <Button
            variant="text"
            onClick={() => setShowImport(false)}
            sx={{ textTransform: "none" }}
          >
            Back to puzzles
          </Button>
        ) : null}
      </Stack>

      {importing && progress && (
        <Stack rowGap={0.8}>
          <LinearProgress
            variant="determinate"
            value={Math.min(
              100,
              Math.max(
                (progress.kept / limit) * 100,
                progress.totalBytes
                  ? (progress.readBytes / progress.totalBytes) * 100
                  : 0
              )
            )}
          />
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {formatBytes(progress.readBytes)} downloaded
            {" · "}
            {progress.scanned.toLocaleString()} scanned
            {" · "}
            {progress.kept.toLocaleString()} kept
          </Typography>
        </Stack>
      )}

      {error && (
        <Typography sx={{ fontSize: 13, color: "error.main" }}>
          {error}
        </Typography>
      )}
    </Stack>
  );

  if (count === null) {
    return (
      <>
        <PageTitle title="ChessKit Improved — Puzzles" />
        <Typography sx={{ p: 3 }}>Loading…</Typography>
      </>
    );
  }

  if (count === 0 || showImport) {
    return (
      <>
        <PageTitle title="ChessKit Improved — Puzzles" />
        {importPanel}
      </>
    );
  }

  return (
    <>
      <PageTitle title="ChessKit Improved — Puzzles" />

      <Grid
        container
        gap={2}
        wrap={isWide ? "nowrap" : "wrap"}
        justifyContent="center"
        alignItems="flex-start"
        sx={{ maxWidth: 1200, marginX: "auto" }}
      >
        <Grid
          size={{ xs: 12, md: "auto" }}
          sx={{
            order: { xs: 1, md: 1 },
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          <Board
            id="PuzzleBoard"
            canPlay={canMove ? playerColor : false}
            gameAtom={gameAtomLocal}
            boardSize={boardSize}
            whitePlayer={
              playerColor === Color.White
                ? { name: "You", rating: stats.rating }
                : { name: "Opponent" }
            }
            blackPlayer={
              playerColor === Color.Black
                ? { name: "You", rating: stats.rating }
                : { name: "Opponent" }
            }
            boardOrientation={playerColor}
            currentPositionAtom={posAtomLocal}
            showBestMoveArrow={true}
            showPlayerMoveIconAtom={showIconAtom}
          />
        </Grid>

        <Grid
          size={{ xs: 12, md: "grow" }}
          sx={{
            order: { xs: 2, md: 2 },
            borderRadius: 2,
            border: 1,
            borderColor: "divider",
            backgroundColor: "background.paper",
            p: 2.5,
            minWidth: { md: 300 },
            maxWidth: { md: 380 },
          }}
        >
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 24,
              mb: 1.5,
            }}
          >
            Puzzles
          </Typography>

          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <StatCell label="Rating" value={stats.rating} />
            <StatCell label="Solved" value={stats.solved} />
            <StatCell label="Missed" value={stats.failed} />
            <StatCell label="Streak" value={stats.streak} />
          </Stack>

          <Typography sx={{ fontSize: 15, minHeight: 44 }}>
            {message}
          </Typography>

          {finished && puzzle && (
            <Stack rowGap={0.5} sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                Puzzle rating {puzzle.rating}
                {delta !== 0 && ` · you ${delta > 0 ? "+" : ""}${delta}`}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {puzzle.themes.join(", ")}
              </Typography>
              <Box
                component="a"
                href={`https://lichess.org/training/${puzzle.id}`}
                target="_blank"
                rel="noreferrer"
                sx={{ fontSize: 12, color: "primary.main" }}
              >
                Open on Lichess
              </Box>
            </Stack>
          )}

          <Stack rowGap={1.2} sx={{ mt: 1 }}>
            <Select
              size="small"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              fullWidth
            >
              {THEMES.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>

            <Stack direction="row" gap={1}>
              <Button
                fullWidth
                variant="outlined"
                onClick={showHint}
                disabled={status !== "playing"}
                sx={{ textTransform: "none" }}
              >
                Hint
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={showSolution}
                disabled={status !== "playing"}
                sx={{ textTransform: "none" }}
              >
                Solution
              </Button>
            </Stack>

            <Button
              fullWidth
              variant={finished ? "contained" : "outlined"}
              onClick={() => loadPuzzle(theme)}
              disabled={status === "loading"}
              sx={{ textTransform: "none" }}
            >
              Next puzzle
            </Button>

            <Button
              variant="text"
              onClick={() => setShowImport(true)}
              sx={{ textTransform: "none", color: "text.secondary" }}
            >
              Import another database ({count.toLocaleString()} stored)
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <Stack alignItems="center">
      <Typography sx={{ fontSize: 20, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
        {label}
      </Typography>
    </Stack>
  );
}
