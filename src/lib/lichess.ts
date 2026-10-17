import { LineEval, PositionEval } from "@/types/eval";
import { sortLines } from "./engine/helpers/parseResults";
import {
  LichessError,
  LichessEvalBody,
  LichessGame,
  LichessResponse,
} from "@/types/lichess";
import { logErrorToSentry } from "./sentry";
import { formatUciPv } from "./chess";
import { LoadedGame } from "@/types/game";
import { openDB, DBSchema, IDBPDatabase } from "idb";

export const getLichessEval = async (
  fen: string,
  multiPv = 1
): Promise<PositionEval> => {
  try {
    const data = await fetchLichessEval(fen, multiPv);

    if ("error" in data) {
      if (data.error === LichessError.NotFound) {
        return {
          bestMove: "",
          lines: [],
        };
      }
      throw new Error(data.error);
    }

    const lines: LineEval[] = data.pvs.map((pv, index) => ({
      pv: formatUciPv(fen, pv.moves.split(" ")),
      cp: pv.cp,
      mate: pv.mate,
      depth: data.depth,
      multiPv: index + 1,
    }));

    lines.sort(sortLines);
    const isWhiteToPlay = fen.split(" ")[1] === "w";
    if (!isWhiteToPlay) lines.reverse();

    const bestMove = lines[0].pv[0];
    const linesToKeep = lines.slice(0, multiPv);

    return {
      bestMove,
      lines: linesToKeep,
    };
  } catch (error) {
    logErrorToSentry(error, { fen, multiPv });

    return {
      bestMove: "",
      lines: [],
    };
  }
};

export const getLichessUserRecentGames = async (
  username: string,
  signal?: AbortSignal
): Promise<LoadedGame[]> => {
  const res = await fetch(
    `https://lichess.org/api/games/user/${username}?until=${Date.now()}&max=50&pgnInJson=true&sort=dateDesc&clocks=true`,
    { method: "GET", headers: { accept: "application/x-ndjson" }, signal }
  );

  if (res.status >= 400) {
    throw new Error("Error fetching games from Lichess");
  }

  const rawData = await res.text();
  const games: LichessGame[] = rawData
    .split("\n")
    .filter((game) => game.length > 0)
    .map((game) => JSON.parse(game));

  return games.map(formatLichessGame);
};

const fetchLichessEval = async (
  fen: string,
  multiPv: number
): Promise<LichessResponse<LichessEvalBody>> => {
  try {
    const res = await fetch(
      `https://lichess.org/api/cloud-eval?fen=${fen}&multiPv=${multiPv}`,
      { method: "GET", signal: AbortSignal.timeout(500) }
    );

    const json = await res.json();
    return json;
  } catch (error) {
    const isTimeoutError =
      error instanceof Error && error.name === "TimeoutError";
    const isAbortError = error instanceof Error && error.name === "AbortError";

    if (!isTimeoutError && !isAbortError) {
      console.error(error);
    }

    return { error: LichessError.NotFound };
  }
};

export const fetchLichessGame = async (
  gameId: string,
  signal?: AbortSignal
): Promise<LichessResponse<string>> => {
  try {
    const res = await fetch(
      `https://lichess.org/game/export/${gameId}?pgnInJson=true&clocks=true`,
      { method: "GET", headers: { accept: "application/x-ndjson" }, signal }
    );

    if (res.status >= 400) {
      throw new Error(`Error fetching game ${gameId} from Lichess`);
    }

    const gameData: LichessGame = await res.json();
    return gameData.pgn;
  } catch (error) {
    console.error(error);

    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
};

const formatLichessGame = (data: LichessGame): LoadedGame => {
  return {
    id: data.id,
    pgn: data.pgn || "",
    white: {
      name: data.players.white.user?.name || "White",
      rating: data.players.white.rating,
      title: data.players.white.user?.title,
    },
    black: {
      name: data.players.black.user?.name || "Black",
      rating: data.players.black.rating,
      title: data.players.black.user?.title,
    },
    result: getGameResult(data),
    timeControl: `${Math.floor(data.clock?.initial / 60 || 0)}+${data.clock?.increment || 0}`,
    date: new Date(data.createdAt || data.lastMoveAt).toLocaleDateString(),
    movesNb: data.moves?.split(" ").length || 0,
    url: `https://lichess.org/${data.id}`,
  };
};

const getGameResult = (data: LichessGame): string => {
  if (data.status === "draw") return "1/2-1/2";

  if (data.winner) return data.winner === "white" ? "1-0" : "0-1";

  return "*";
};

export interface PuzzleRecord {
  id: string;
  fen: string;
  moves: string[];
  rating: number;
  popularity: number;
  plays: number;
  themes: string[];
  tb: string[];
}

export interface PuzzleImportProgress {
  readBytes: number;
  totalBytes: number;
  scanned: number;
  kept: number;
}

export interface PuzzleImportOptions {
  limit: number;
  minPopularity?: number;
  minPlays?: number;
  signal?: AbortSignal;
  onProgress?: (progress: PuzzleImportProgress) => void;
}

export interface RandomPuzzleParams {
  rating: number;
  theme?: string;
  excludeIds?: string[];
}

interface PuzzleDbSchema extends DBSchema {
  puzzles: {
    key: string;
    value: PuzzleRecord;
    indexes: { tb: string };
  };
}

const PUZZLE_BUCKET_SIZE = 100;
const PUZZLE_MIN_BUCKET = 3;
const PUZZLE_MAX_BUCKET = 33;
const PUZZLE_BATCH_SIZE = 1000;
const LICHESS_PUZZLE_DB_URL =
  "https://database.lichess.org/lichess_db_puzzle.csv.zst";
const ZSTD_DECODER_URL =
  "https://cdn.jsdelivr.net/npm/fzstd@0.1.1/umd/index.js";

interface ZstdDecoder {
  push: (chunk: Uint8Array, final?: boolean) => void;
}

interface ZstdLibrary {
  Decompress: new (
    ondata: (chunk: Uint8Array, final: boolean) => void
  ) => ZstdDecoder;
}

export type PuzzleErrorCode =
  | "CORS_BLOCKED"
  | "NETWORK_UNREACHABLE"
  | "HTTP_ERROR"
  | "DECODER_LOAD_FAILED"
  | "DECODER_MISSING"
  | "READ_FAILED"
  | "STORAGE_FAILED"
  | "NO_PUZZLES";

export class PuzzleImportError extends Error {
  code: PuzzleErrorCode;
  detail?: string;

  constructor(code: PuzzleErrorCode, message: string, detail?: string) {
    super(message);
    this.name = "PuzzleImportError";
    this.code = code;
    this.detail = detail;
  }
}

const describeError = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

let zstdPromise: Promise<ZstdLibrary> | null = null;

const getZstdGlobal = () =>
  (window as unknown as { fzstd?: ZstdLibrary }).fzstd;

const loadZstd = (): Promise<ZstdLibrary> => {
  if (zstdPromise) return zstdPromise;

  zstdPromise = new Promise<ZstdLibrary>((resolve, reject) => {
    const existing = getZstdGlobal();
    if (existing) {
      resolve(existing);
      return;
    }

    const script = document.createElement("script");
    script.src = ZSTD_DECODER_URL;
    script.async = true;
    script.onload = () => {
      const loaded = getZstdGlobal();
      if (loaded) {
        resolve(loaded);
        return;
      }
      reject(
        new PuzzleImportError(
          "DECODER_MISSING",
          "The zstd decoder loaded but did not register itself.",
          ZSTD_DECODER_URL
        )
      );
    };
    script.onerror = () =>
      reject(
        new PuzzleImportError(
          "DECODER_LOAD_FAILED",
          "Could not load the zstd decoder from the CDN. Check your connection or an ad blocker.",
          ZSTD_DECODER_URL
        )
      );
    document.head.appendChild(script);
  });

  zstdPromise.catch(() => {
    zstdPromise = null;
  });

  return zstdPromise;
};

let puzzleDbPromise: Promise<IDBPDatabase<PuzzleDbSchema>> | null = null;

const openPuzzleDb = () => {
  if (!puzzleDbPromise) {
    puzzleDbPromise = openDB<PuzzleDbSchema>("puzzles", 1, {
      upgrade(db) {
        const store = db.createObjectStore("puzzles", { keyPath: "id" });
        store.createIndex("tb", "tb", { multiEntry: true });
      },
    }).catch((error) => {
      puzzleDbPromise = null;
      throw error;
    });
  }

  return puzzleDbPromise;
};

const getPuzzleBucket = (rating: number) =>
  Math.min(
    PUZZLE_MAX_BUCKET,
    Math.max(PUZZLE_MIN_BUCKET, Math.floor(rating / PUZZLE_BUCKET_SIZE))
  );

const parsePuzzleHeader = (line: string): Record<string, number> => {
  const columns: Record<string, number> = {};
  line
    .trim()
    .split(",")
    .forEach((name, index) => {
      columns[name] = index;
    });
  return columns;
};

const parsePuzzleLine = (
  columns: Record<string, number>,
  line: string
): PuzzleRecord | null => {
  const parts = line.split(",");

  const id = parts[columns.PuzzleId];
  const fen = parts[columns.FEN];
  const moves = parts[columns.Moves]?.split(" ").filter(Boolean);
  const rating = Number(parts[columns.Rating]);
  const popularity = Number(parts[columns.Popularity]);
  const plays = Number(parts[columns.NbPlays]);
  const themes = parts[columns.Themes]?.split(" ").filter(Boolean) ?? [];

  if (!id || !fen || !moves || moves.length < 2) return null;
  if (!Number.isFinite(rating)) return null;

  const bucket = getPuzzleBucket(rating);

  return {
    id,
    fen,
    moves,
    rating,
    popularity: Number.isFinite(popularity) ? popularity : 0,
    plays: Number.isFinite(plays) ? plays : 0,
    themes,
    tb: ["any", ...themes].map((theme) => `${theme}:${bucket}`),
  };
};

export const getPuzzleCount = async (): Promise<number> => {
  const db = await openPuzzleDb();
  return db.count("puzzles");
};

export const clearPuzzles = async (): Promise<void> => {
  const db = await openPuzzleDb();
  await db.clear("puzzles");
};

const importPuzzleStream = async (
  stream: ReadableStream<Uint8Array>,
  isZstd: boolean,
  totalBytes: number,
  options: PuzzleImportOptions
): Promise<number> => {
  const {
    limit,
    minPopularity = 90,
    minPlays = 500,
    signal,
    onProgress,
  } = options;

  const zstd = isZstd ? await loadZstd() : null;
  const db = await openPuzzleDb();
  await db.clear("puzzles");

  const decoder = new TextDecoder();
  const reader = stream.getReader();

  let pending = "";
  let columns: Record<string, number> | null = null;
  let readBytes = 0;
  let scanned = 0;
  let kept = 0;
  let finished = false;
  let batch: PuzzleRecord[] = [];

  const decompressor = zstd
    ? new zstd.Decompress((chunk) => {
        pending += decoder.decode(chunk, { stream: true });
      })
    : null;

  const flush = async () => {
    if (batch.length === 0) return;

    const tx = db.transaction("puzzles", "readwrite");
    await Promise.all([
      ...batch.map((puzzle) => tx.store.put(puzzle)),
      tx.done,
    ]);
    batch = [];
  };

  const takeLines = (final: boolean) => {
    const lines = pending.split("\n");
    pending = final ? "" : (lines.pop() ?? "");
    return lines;
  };

  const processLines = (lines: string[]) => {
    for (const rawLine of lines) {
      const line = rawLine.endsWith("\r") ? rawLine.slice(0, -1) : rawLine;
      if (!line) continue;

      if (!columns) {
        columns = parsePuzzleHeader(line);
        continue;
      }

      scanned++;

      const puzzle = parsePuzzleLine(columns, line);
      if (!puzzle) continue;
      if (puzzle.popularity < minPopularity || puzzle.plays < minPlays) {
        continue;
      }

      batch.push(puzzle);
      kept++;

      if (kept >= limit) {
        finished = true;
        return;
      }
    }
  };

  try {
    while (!finished) {
      if (signal?.aborted) {
        throw new DOMException("Import cancelled", "AbortError");
      }

      const { done, value } = await reader.read();

      if (done) {
        if (decompressor) {
          decompressor.push(new Uint8Array(0), true);
        } else {
          pending += decoder.decode();
        }
        processLines(takeLines(true));
        break;
      }

      readBytes += value.length;

      if (decompressor) {
        decompressor.push(value);
      } else {
        pending += decoder.decode(value, { stream: true });
      }

      processLines(takeLines(false));

      if (batch.length >= PUZZLE_BATCH_SIZE) await flush();

      onProgress?.({ readBytes, totalBytes, scanned, kept });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    await flush();
    onProgress?.({ readBytes, totalBytes, scanned, kept });

    if (kept === 0) {
      throw new PuzzleImportError(
        "NO_PUZZLES",
        "No puzzles were found in this file. Make sure it is lichess_db_puzzle.csv or .csv.zst."
      );
    }

    return kept;
  } catch (error) {
    if (error instanceof PuzzleImportError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      throw new PuzzleImportError(
        "STORAGE_FAILED",
        "Not enough free storage on this device. Choose a smaller number of puzzles.",
        describeError(error)
      );
    }
    throw new PuzzleImportError(
      "READ_FAILED",
      "Reading the puzzle data failed.",
      describeError(error)
    );
  } finally {
    reader.cancel().catch(() => undefined);
  }
};

export const importLichessPuzzles = (
  file: File,
  options: PuzzleImportOptions
): Promise<number> =>
  importPuzzleStream(
    file.stream(),
    file.name.toLowerCase().endsWith(".zst"),
    file.size,
    options
  );

export const downloadLichessPuzzles = async (
  options: PuzzleImportOptions
): Promise<number> => {
  let response: Response;

  try {
    response = await fetch(LICHESS_PUZZLE_DB_URL, { signal: options.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    const reachable = await fetch(LICHESS_PUZZLE_DB_URL, {
      method: "HEAD",
      mode: "no-cors",
      signal: options.signal,
    })
      .then(() => true)
      .catch(() => false);

    if (reachable) {
      throw new PuzzleImportError(
        "CORS_BLOCKED",
        "Lichess is reachable, but it does not allow this site to download the file. Download lichess_db_puzzle.csv.zst to your phone and use Choose file instead.",
        describeError(error)
      );
    }

    throw new PuzzleImportError(
      "NETWORK_UNREACHABLE",
      "Could not reach database.lichess.org. Check your connection and try again.",
      describeError(error)
    );
  }

  if (!response.ok) {
    throw new PuzzleImportError(
      "HTTP_ERROR",
      "Lichess refused the download.",
      `HTTP ${response.status} ${response.statusText}`.trim()
    );
  }

  if (!response.body) {
    throw new PuzzleImportError(
      "READ_FAILED",
      "The download has no readable body in this browser.",
      "response.body is null"
    );
  }

  const totalBytes = Number(response.headers.get("content-length")) || 0;

  return importPuzzleStream(response.body, true, totalBytes, options);
};

export const getRandomPuzzle = async ({
  rating,
  theme = "any",
  excludeIds = [],
}: RandomPuzzleParams): Promise<PuzzleRecord | null> => {
  const db = await openPuzzleDb();
  let fallback: PuzzleRecord | null = null;

  for (let spread = 100; spread <= 1500; spread += 200) {
    const low = getPuzzleBucket(rating - spread);
    const high = getPuzzleBucket(rating + spread - 1);

    const keys: string[] = [];
    for (let bucket = low; bucket <= high; bucket++) {
      keys.push(`${theme}:${bucket}`);
    }

    const counts = await Promise.all(
      keys.map((key) => db.countFromIndex("puzzles", "tb", key))
    );
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total === 0) continue;

    for (let attempt = 0; attempt < 5; attempt++) {
      let offset = Math.floor(Math.random() * total);
      let keyIndex = 0;
      while (offset >= counts[keyIndex]) {
        offset -= counts[keyIndex];
        keyIndex++;
      }

      const tx = db.transaction("puzzles");
      let cursor = await tx.store.index("tb").openCursor(keys[keyIndex]);
      if (cursor && offset > 0) cursor = await cursor.advance(offset);

      const puzzle = cursor?.value;
      if (!puzzle) continue;

      fallback = puzzle;
      if (!excludeIds.includes(puzzle.id)) return puzzle;
    }
  }

  return fallback;
};
