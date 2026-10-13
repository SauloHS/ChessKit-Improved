import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebounce } from "@/hooks/useDebounce";
import {
  getChessComGamesByMonth,
  getChessComPlayerProfile,
  getChessComPlayerStats,
  getChessComUserAvatar,
  ChessComMonthGame,
  ChessComRatingStat,
} from "@/lib/chessCom";
import {
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import MiniBoard from "@/components/miniBoard";

interface Props {
  onSelect: (pgn: string, boardOrientation?: boolean) => void;
}

const currentMonthValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function ChessComLookup({ onSelect }: Props) {
  const [rawStored, setStored] = useLocalStorage<string>(
    "chesscom-username",
    ""
  );
  const [username, setUsername] = useState("");
  const [month, setMonth] = useState(currentMonthValue());
  const [limit, setLimit] = useState(50);

  const recents = useMemo(
    () =>
      (typeof rawStored === "string" ? rawStored : "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [rawStored]
  );

  const debouncedUsername = useDebounce(username, 400);

  const { data: profile, isFetching: isProfileLoading } = useQuery({
    queryKey: ["CCProfile", debouncedUsername],
    enabled: !!debouncedUsername,
    queryFn: ({ signal }) =>
      getChessComPlayerProfile(debouncedUsername, signal),
    retry: 1,
  });

  const { data: stats } = useQuery({
    queryKey: ["CCStats", debouncedUsername],
    enabled: !!debouncedUsername,
    queryFn: ({ signal }) => getChessComPlayerStats(debouncedUsername, signal),
    retry: 1,
  });

  const { year, monthNumber } = useMemo(() => {
    const [y, m] = month.split("-");
    return { year: Number(y), monthNumber: Number(m) };
  }, [month]);

  const { data: games, isFetching: isGamesLoading } = useQuery({
    queryKey: ["CCGames", debouncedUsername, year, monthNumber, limit],
    enabled: !!debouncedUsername && !!year && !!monthNumber,
    queryFn: ({ signal }) =>
      getChessComGamesByMonth(
        debouncedUsername,
        year,
        monthNumber,
        limit,
        signal
      ),
    retry: 1,
  });

  const rememberUsername = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const updated = [
      trimmed,
      ...recents.filter((u) => u.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 8);

    setStored(updated.join(","));
  };

  const selectGame = (game: ChessComMonthGame) => {
    // boardOrientation is `true` when white is at the bottom.
    const orientation =
      debouncedUsername.toLowerCase() === game.white.name.toLowerCase();
    onSelect(game.pgn, orientation);
    rememberUsername(debouncedUsername);
  };

  return (
    <Stack rowGap={3}>
      <Box>
        <Typography
          component="label"
          sx={{
            display: "block",
            mb: 1,
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          Chess.com username
        </Typography>
        <TextField
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ItsSaulo"
          autoComplete="off"
          spellCheck={false}
          sx={{ maxWidth: 420 }}
        />
      </Box>

      {recents.length > 0 && (
        <Box>
          <Typography
            sx={{
              mb: 1.2,
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            Recent
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {recents.map((name) => (
              <RecentChip
                key={name}
                username={name}
                active={name.toLowerCase() === debouncedUsername.toLowerCase()}
                onClick={() => setUsername(name)}
                onRemove={() => {
                  const updated = recents.filter((u) => u !== name);
                  setStored(updated.join(","));
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {debouncedUsername && isProfileLoading && !profile && (
        <CircularProgress size={22} />
      )}

      {debouncedUsername && !isProfileLoading && !profile && (
        <Typography sx={{ color: "error.main", fontSize: 14 }}>
          Player not found. Check the username.
        </Typography>
      )}

      {profile && <PlayerCard profile={profile} stats={stats} />}

      {profile && (
        <Stack direction="row" alignItems="flex-end" gap={2} flexWrap="wrap">
          <Box>
            <Typography
              component="label"
              sx={{
                display: "block",
                mb: 0.6,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              Month
            </Typography>
            <TextField
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              size="small"
            />
          </Box>
          <Box>
            <Typography
              component="label"
              sx={{
                display: "block",
                mb: 0.6,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              Limit
            </Typography>
            <TextField
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              size="small"
              sx={{ width: 90 }}
              slotProps={{ htmlInput: { min: 1, max: 1000 } }}
            />
          </Box>
        </Stack>
      )}

      {debouncedUsername && isGamesLoading && (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={18} />
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Loading games…
          </Typography>
        </Stack>
      )}

      {games && games.length > 0 && (
        <Box>
          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            sx={{ mb: 2, pb: 1.2, borderBottom: 1, borderColor: "divider" }}
          >
            <Typography variant="h5" sx={{ fontWeight: 400 }}>
              Games found
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {debouncedUsername} · {games.length} games
            </Typography>
          </Stack>

          <Stack rowGap={1}>
            {games.slice(0, 40).map((game) => (
              <GameRow
                key={game.id}
                game={game}
                username={debouncedUsername}
                onSelect={() => selectGame(game)}
              />
            ))}
          </Stack>
        </Box>
      )}

      {games && games.length === 0 && !isGamesLoading && (
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
          No games found for that month.
        </Typography>
      )}
    </Stack>
  );
}

function RecentChip({
  username,
  active,
  onClick,
  onRemove,
}: {
  username: string;
  active: boolean;
  onClick: () => void;
  onRemove: () => void;
}) {
  const { data: avatar } = useQuery({
    queryKey: ["CCAvatar", username],
    queryFn: () => getChessComUserAvatar(username),
    staleTime: 1000 * 60 * 60,
  });

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      onClick={onClick}
      sx={{
        position: "relative",
        pl: 0.8,
        pr: 3,
        py: 0.8,
        borderRadius: 2,
        border: 1,
        borderColor: active ? "primary.main" : "divider",
        backgroundColor: "background.paper",
        cursor: "pointer",
        "&:hover": { borderColor: "text.secondary" },
      }}
    >
      <Avatar url={avatar} name={username} size={30} />
      <Typography sx={{ fontSize: 13 }}>{username}</Typography>
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          position: "absolute",
          right: 4,
          display: "flex",
          color: "text.secondary",
          "&:hover": { color: "text.primary" },
        }}
      >
        <Icon icon="mdi:close" height={14} />
      </Box>
    </Stack>
  );
}

function Avatar({
  url,
  name,
  size,
}: {
  url?: string | null;
  name: string;
  size: number;
}) {
  if (url) {
    return (
      <Box
        component="img"
        src={url}
        alt=""
        sx={{
          width: size,
          height: size,
          borderRadius: 1.5,
          objectFit: "cover",
          bgcolor: "rgba(0,0,0,0.35)",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
        fontFamily: "Georgia, serif",
        fontSize: size * 0.5,
        color: "text.secondary",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </Box>
  );
}

function PlayerCard({
  profile,
  stats,
}: {
  profile: {
    username: string;
    name?: string;
    avatar?: string;
    country?: string;
    followers?: number;
    joined?: number;
    last_online?: number;
    title?: string;
    url?: string;
  };
  stats?: {
    chess_rapid?: ChessComRatingStat;
    chess_blitz?: ChessComRatingStat;
    chess_bullet?: ChessComRatingStat;
  } | null;
}) {
  const countryCode = profile.country?.split("/").pop()?.toUpperCase();

  const metaBits = [
    countryCode,
    profile.followers !== undefined ? `${profile.followers} followers` : null,
    profile.joined
      ? `Member since ${new Date(profile.joined * 1000).toLocaleDateString(
          undefined,
          { month: "long", year: "numeric" }
        )}`
      : null,
    profile.last_online
      ? `Seen ${new Date(profile.last_online * 1000).toLocaleDateString()}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Stack direction="row" gap={2} alignItems="center">
        <Avatar url={profile.avatar} name={profile.username} size={68} />
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography
              sx={{
                fontFamily: "Georgia, serif",
                fontSize: 24,
                letterSpacing: "-0.02em",
              }}
            >
              {profile.name || profile.username}
            </Typography>
            {profile.title && (
              <Box
                sx={{
                  px: 0.8,
                  borderRadius: 1,
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                }}
              >
                {profile.title}
              </Box>
            )}
          </Stack>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            @{profile.username}
          </Typography>
        </Box>
      </Stack>

      {metaBits.length > 0 && (
        <Typography sx={{ mt: 2, fontSize: 13, color: "text.secondary" }}>
          {metaBits.join(" · ")}
        </Typography>
      )}

      <Stack direction="row" gap={1} sx={{ mt: 2 }} flexWrap="wrap">
        <RatingTile label="Rapid" stat={stats?.chess_rapid} />
        <RatingTile label="Blitz" stat={stats?.chess_blitz} />
        <RatingTile label="Bullet" stat={stats?.chess_bullet} />
      </Stack>
    </Box>
  );
}

function RatingTile({
  label,
  stat,
}: {
  label: string;
  stat?: ChessComRatingStat;
}) {
  const record = stat?.record;
  const recordText = record
    ? `W ${record.win ?? 0} · D ${record.draw ?? 0} · L ${record.loss ?? 0}`
    : "—";

  return (
    <Box
      sx={{
        flex: "1 1 120px",
        p: 1.5,
        borderRadius: 1.5,
        border: 1,
        borderColor: "divider",
        backgroundColor: "rgba(0,0,0,0.18)",
      }}
    >
      <Typography
        sx={{
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: "Georgia, serif",
          fontSize: 26,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {stat?.last?.rating ?? "—"}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
        {recordText}
      </Typography>
    </Box>
  );
}

function GameRow({
  game,
  username,
  onSelect,
}: {
  game: ChessComMonthGame;
  username: string;
  onSelect: () => void;
}) {
  const fen = useMemo(() => {
    try {
      const chess = new Chess();
      chess.loadPgn(game.pgn);
      return chess.fen();
    } catch {
      return undefined;
    }
  }, [game.pgn]);

  const isUserWhite = game.white.name.toLowerCase() === username.toLowerCase();
  const userResult = isUserWhite ? game.white.result : game.black.result;
  const resultLabel =
    userResult === "win"
      ? "Win"
      : userResult === "checkmated" ||
          userResult === "timeout" ||
          userResult === "resigned" ||
          userResult === "abandoned"
        ? "Loss"
        : userResult === "agreed" ||
            userResult === "repetition" ||
            userResult === "stalemate" ||
            userResult === "insufficient" ||
            userResult === "50move" ||
            userResult === "timevsinsufficient"
          ? "Draw"
          : "";

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={2}
      onClick={onSelect}
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        backgroundColor: "background.paper",
        cursor: "pointer",
        transition: "border-color .16s, transform .16s",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateX(2px)",
        },
      }}
    >
      {fen && <MiniBoard fen={fen} size={60} />}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <PlayerLine
          name={game.white.name}
          rating={game.white.rating}
          isUser={isUserWhite}
          color="w"
        />
        <PlayerLine
          name={game.black.name}
          rating={game.black.rating}
          isUser={!isUserWhite}
          color="b"
        />
        <Typography sx={{ mt: 0.7, fontSize: 12, color: "text.secondary" }}>
          {new Date(game.endTime * 1000).toLocaleDateString()} ·{" "}
          {game.timeClass || game.timeControl}
        </Typography>
      </Box>

      {resultLabel && (
        <Box
          sx={{
            px: 1.2,
            py: 0.3,
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            borderRadius: 999,
            border: 1,
            borderColor:
              resultLabel === "Win"
                ? "primary.main"
                : resultLabel === "Loss"
                  ? "error.main"
                  : "divider",
            color:
              resultLabel === "Win"
                ? "primary.main"
                : resultLabel === "Loss"
                  ? "error.main"
                  : "text.secondary",
          }}
        >
          {resultLabel}
        </Box>
      )}

      <Stack
        direction="row"
        alignItems="center"
        gap={0.5}
        sx={{
          display: { xs: "none", sm: "flex" },
          color: "text.secondary",
          whiteSpace: "nowrap",
        }}
      >
        <Typography sx={{ fontSize: 13 }}>Review</Typography>
        <Icon icon="mdi:arrow-right" height={16} />
      </Stack>
    </Stack>
  );
}

function PlayerLine({
  name,
  rating,
  isUser,
  color,
}: {
  name: string;
  rating: number;
  isUser: boolean;
  color: "w" | "b";
}) {
  return (
    <Stack direction="row" alignItems="center" gap={1}>
      <Box
        sx={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          bgcolor: color === "w" ? "#efece6" : "#2a2b2d",
          boxShadow:
            color === "b" ? "inset 0 0 0 1px rgba(255,255,255,0.4)" : "none",
        }}
      />
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: isUser ? 600 : 400,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
        {rating}
      </Typography>
    </Stack>
  );
}
