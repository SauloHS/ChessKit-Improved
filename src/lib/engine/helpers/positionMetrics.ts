import { Chess, Color, PieceSymbol, Square, SQUARES } from "chess.js";

export interface SideMetrics {
  white: number;
  black: number;
}

export interface PositionMetrics {
  development: SideMetrics;
  tension: SideMetrics;
  mobility: SideMetrics;
  control: SideMetrics;
}

const HOME_SQUARES: { square: Square; type: PieceSymbol; color: Color }[] = [
  { square: "a1", type: "r", color: "w" },
  { square: "h1", type: "r", color: "w" },
  { square: "b1", type: "n", color: "w" },
  { square: "g1", type: "n", color: "w" },
  { square: "c1", type: "b", color: "w" },
  { square: "f1", type: "b", color: "w" },
  { square: "d1", type: "q", color: "w" },
  { square: "a8", type: "r", color: "b" },
  { square: "h8", type: "r", color: "b" },
  { square: "b8", type: "n", color: "b" },
  { square: "g8", type: "n", color: "b" },
  { square: "c8", type: "b", color: "b" },
  { square: "f8", type: "b", color: "b" },
  { square: "d8", type: "q", color: "b" },
];

export const getDevelopment = (fen: string): SideMetrics => {
  const board = new Chess(fen);
  const metrics: SideMetrics = { white: 0, black: 0 };

  for (const { square, type, color } of HOME_SQUARES) {
    const piece = board.get(square);
    if (piece?.type === type && piece.color === color) continue;

    if (color === "w") metrics.white += 1;
    else metrics.black += 1;
  }

  return metrics;
};

const withTurn = (fen: string, turn: Color): string => {
  const parts = fen.split(" ");
  parts[1] = turn;
  parts[3] = "-";
  return parts.join(" ");
};

const countCaptures = (fen: string): number => {
  const board = new Chess(fen);
  return board.moves({ verbose: true }).filter((move) => !!move.captured).length;
};

const countMobility = (fen: string): number => {
  const board = new Chess(fen);
  return board.moves({ verbose: true }).filter((move) => move.piece !== "p")
    .length;
};

const toWhiteBlack = (
  turn: Color,
  playerValue: number,
  opponentValue: number
): SideMetrics =>
  turn === "w"
    ? { white: playerValue, black: opponentValue }
    : { white: opponentValue, black: playerValue };

export const getTension = (fen: string): SideMetrics => {
  const turn = new Chess(fen).turn();
  const opponent = withTurn(fen, turn === "w" ? "b" : "w");
  return toWhiteBlack(turn, countCaptures(fen), countCaptures(opponent));
};

export const getMobility = (fen: string): SideMetrics => {
  const turn = new Chess(fen).turn();
  const opponent = withTurn(fen, turn === "w" ? "b" : "w");
  return toWhiteBlack(turn, countMobility(fen), countMobility(opponent));
};

export const getControl = (fen: string): SideMetrics => {
  const board = new Chess(fen);
  const metrics: SideMetrics = { white: 0, black: 0 };

  for (const square of SQUARES) {
    metrics.white += board.attackers(square, "w").length;
    metrics.black += board.attackers(square, "b").length;
  }

  return metrics;
};

export const computePositionMetrics = (fen: string): PositionMetrics => ({
  development: getDevelopment(fen),
  tension: getTension(fen),
  mobility: getMobility(fen),
  control: getControl(fen),
});
