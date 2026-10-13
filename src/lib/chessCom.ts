import { ChessComGame } from "@/types/chessCom";
import { getPaddedNumber } from "./helpers";
import { LoadedGame } from "@/types/game";

export interface ChessComProfile {
  username: string;
  name?: string;
  avatar?: string;
  country?: string;
  followers?: number;
  joined?: number;
  last_online?: number;
  title?: string;
  url?: string;
  status?: string;
}

export interface ChessComRatingStat {
  last?: { rating?: number };
  record?: { win?: number; loss?: number; draw?: number };
}

export interface ChessComStats {
  chess_rapid?: ChessComRatingStat;
  chess_blitz?: ChessComRatingStat;
  chess_bullet?: ChessComRatingStat;
}

export interface ChessComMonthGame {
  id: string;
  pgn: string;
  white: { name: string; rating: number; title?: string; result?: string };
  black: { name: string; rating: number; title?: string; result?: string };
  endTime: number;
  timeClass: string;
  timeControl: string;
  url?: string;
}

const chessComPlayerUrl = (username: string) =>
  `https://api.chess.com/pub/player/${encodeURIComponent(
    username.trim().toLowerCase()
  )}`;

export const getChessComPlayerProfile = async (
  username: string,
  signal?: AbortSignal
): Promise<ChessComProfile | null> => {
  if (!username.trim()) return null;

  const res = await fetch(chessComPlayerUrl(username), { signal });
  if (res.status >= 400) return null;

  return res.json();
};

export const getChessComPlayerStats = async (
  username: string,
  signal?: AbortSignal
): Promise<ChessComStats | null> => {
  if (!username.trim()) return null;

  const res = await fetch(`${chessComPlayerUrl(username)}/stats`, { signal });
  if (res.status >= 400) return null;

  return res.json();
};

export const getChessComGamesByMonth = async (
  username: string,
  year: number,
  month: number,
  limit = 250,
  signal?: AbortSignal
): Promise<ChessComMonthGame[]> => {
  if (!username.trim()) return [];

  const res = await fetch(
    `${chessComPlayerUrl(username)}/games/${year}/${getPaddedNumber(month)}`,
    { signal }
  );
  if (res.status >= 400) return [];

  const data = await res.json();
  const games: ChessComGame[] = data?.games ?? [];

  return games
    .filter((game) => game.pgn && game.end_time)
    .sort((a, b) => b.end_time - a.end_time)
    .slice(0, limit)
    .map((game) => ({
      id: game.uuid || game.url?.split("/").pop() || game.id,
      pgn: game.pgn,
      white: {
        name: game.white?.username || "White",
        rating: game.white?.rating || 0,
        title: game.white?.title,
        result: game.white?.result,
      },
      black: {
        name: game.black?.username || "Black",
        rating: game.black?.rating || 0,
        title: game.black?.title,
        result: game.black?.result,
      },
      endTime: game.end_time,
      timeClass: game.time_class ?? "",
      timeControl: getGameTimeControl(game) ?? "",
      url: game.url,
    }));
};

export const getChessComUserRecentGames = async (
  username: string,
  signal?: AbortSignal
): Promise<LoadedGame[]> => {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const paddedMonth = getPaddedNumber(month);

  const res = await fetch(
    `https://api.chess.com/pub/player/${username}/games/${year}/${paddedMonth}`,
    { method: "GET", signal }
  );

  const data = await res.json();

  if (
    res.status >= 400 &&
    data.message !== "Date cannot be set in the future"
  ) {
    throw new Error("Error fetching games from Chess.com");
  }

  const games: ChessComGame[] = data?.games ?? [];

  if (games.length < 50) {
    const previousMonth = month === 1 ? 12 : month - 1;
    const previousPaddedMonth = getPaddedNumber(previousMonth);
    const yearToFetch = previousMonth === 12 ? year - 1 : year;

    const resPreviousMonth = await fetch(
      `https://api.chess.com/pub/player/${username}/games/${yearToFetch}/${previousPaddedMonth}`
    );

    const dataPreviousMonth = await resPreviousMonth.json();

    games.push(...(dataPreviousMonth?.games ?? []));
  }

  const gamesToReturn = games
    .filter((game) => game.pgn && game.end_time)
    .sort((a, b) => b.end_time - a.end_time)
    .slice(0, 50)
    .map(formatChessComGame);

  return gamesToReturn;
};

export const getChessComUserAvatar = async (
  username: string
): Promise<string | null> => {
  const usernameParam = encodeURIComponent(username.trim().toLowerCase());

  const res = await fetch(`https://api.chess.com/pub/player/${usernameParam}`);
  const data = await res.json();
  const avatarUrl = data?.avatar;

  return typeof avatarUrl === "string" ? avatarUrl : null;
};

const formatChessComGame = (data: ChessComGame): LoadedGame => {
  const result = data.pgn.match(/\[Result "(.*?)"]/)?.[1];
  const movesNb = data.pgn.match(/\d+?\. /g)?.length;

  return {
    id: data.uuid || data.url?.split("/").pop() || data.id,
    pgn: data.pgn || "",
    white: {
      name: data.white?.username || "White",
      rating: data.white?.rating || 0,
      title: data.white?.title,
    },
    black: {
      name: data.black?.username || "Black",
      rating: data.black?.rating || 0,
      title: data.black?.title,
    },
    result,
    timeControl: getGameTimeControl(data),
    date: data.end_time
      ? new Date(data.end_time * 1000).toLocaleDateString()
      : new Date().toLocaleDateString(),
    movesNb: movesNb ? movesNb * 2 : undefined,
    url: data.url,
  };
};

const getGameTimeControl = (game: ChessComGame): string | undefined => {
  const rawTimeControl = game.time_control;
  if (!rawTimeControl) return undefined;

  const [firstPart, secondPart] = rawTimeControl.split("+");
  if (!firstPart) return undefined;

  const timeControl = Number(firstPart);
  const increment = secondPart ? `+${secondPart}` : "";
  if (timeControl < 60) return `${timeControl}s${increment}`;

  if (timeControl < 3600) {
    const minutes = Math.floor(timeControl / 60);
    const seconds = timeControl % 60;

    return seconds
      ? `${minutes}m${getPaddedNumber(seconds)}s${increment}`
      : `${minutes}m${increment}`;
  }

  const hours = Math.floor(timeControl / 3600);
  const minutes = Math.floor((timeControl % 3600) / 60);
  return minutes
    ? `${hours}h${getPaddedNumber(minutes)}m${increment}`
    : `${hours}h${increment}`;
};
