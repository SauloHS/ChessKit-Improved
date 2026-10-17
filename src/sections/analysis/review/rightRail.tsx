import { Box, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { useAtomValue, useSetAtom } from "jotai";
import { MouseEvent, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  boardAtom,
  boardOrientationAtom,
  currentMoveIdxAtom,
  gameAtom,
  gameEvalAtom,
} from "../states";
import { useChessActions } from "@/hooks/useChessActions";
import { usePlayersData } from "@/hooks/usePlayersData";
import { CLASSIFICATION_COLORS } from "@/constants";
import { MoveClassification } from "@/types/enums";
import { boardHueAtom } from "@/components/board/states";

const COUNT_ORDER: MoveClassification[] = [
  MoveClassification.Book,
  MoveClassification.Brilliant,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Okay,
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
];

const HUES: { label: string; value: number }[] = [
  { label: "Wood", value: 0 },
  { label: "Amber", value: -30 },
  { label: "Olive", value: 45 },
  { label: "Green", value: 90 },
  { label: "Teal", value: 150 },
  { label: "Blue", value: 200 },
  { label: "Violet", value: 260 },
];

export default function RightRail() {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const currentIdx = useAtomValue(currentMoveIdxAtom);
  const { white, black } = usePlayersData(gameAtom);
  const { goToMove } = useChessActions(boardAtom);

  const setOrientation = useSetAtom(boardOrientationAtom);
  const boardHue = useAtomValue(boardHueAtom);
  const setBoardHue = useSetAtom(boardHueAtom);

  const [themeAnchor, setThemeAnchor] = useState<null | HTMLElement>(null);

  const history = useMemo(() => game.history(), [game]);

  const classifications = useMemo(
    () => history.map((_, i) => gameEval?.positions[i + 1]?.moveClassification),
    [history, gameEval]
  );

  const counts = useMemo(() => {
    const result = new Map<MoveClassification, [number, number]>();
    COUNT_ORDER.forEach((cls) => result.set(cls, [0, 0]));

    classifications.forEach((cls, i) => {
      if (!cls) return;
      const entry = result.get(cls);
      if (entry) entry[i % 2] += 1;
    });

    return result;
  }, [classifications]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (currentIdx < history.length) goToMove(currentIdx + 1, game);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentIdx > 0) goToMove(currentIdx - 1, game);
      } else if (event.key === "f" || event.key === "F") {
        setOrientation((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIdx, history.length, goToMove, game, setOrientation]);

  if (!gameEval || history.length === 0) return null;

  return (
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Box
        sx={{
          flexShrink: 0,
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          gap={1}
          flexWrap="wrap"
        >
          <PlayerDot color="w" />
          <Typography sx={{ fontSize: 14 }}>{white.name}</Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            vs
          </Typography>
          <PlayerDot color="b" />
          <Typography sx={{ fontSize: 14 }}>{black.name}</Typography>
        </Stack>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          px: 2.5,
          py: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <StatRow
          label="Accuracy"
          white={`${gameEval.accuracy.white.toFixed(0)}%`}
          black={`${gameEval.accuracy.black.toFixed(0)}%`}
        />
        {gameEval.estimatedElo && (
          <StatRow
            label="Estimated Elo"
            white={Math.round(gameEval.estimatedElo.white)}
            black={Math.round(gameEval.estimatedElo.black)}
          />
        )}
        {gameEval.acpl && (
          <StatRow
            label="ACPL"
            white={Math.round(gameEval.acpl.white)}
            black={Math.round(gameEval.acpl.black)}
          />
        )}

        <Box
          component="details"
          sx={{ mt: 1.5, borderTop: 1, borderColor: "divider", pt: 1.2 }}
        >
          <Box
            component="summary"
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1,
              fontSize: 10,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "text.secondary",
              cursor: "pointer",
              listStyle: "none",
              "&::-webkit-details-marker": { display: "none" },
            }}
          >
            Move classification
            <Icon icon="mdi:chevron-down" height={14} />
          </Box>

          {COUNT_ORDER.map((cls) => {
            const [w, b] = counts.get(cls) ?? [0, 0];
            return (
              <Stack
                key={cls}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ py: 0.4, fontSize: 12 }}
              >
                <Typography
                  sx={{ minWidth: 26, fontVariantNumeric: "tabular-nums" }}
                >
                  {w}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box
                    component="img"
                    src={`/icons/${cls}.png`}
                    alt=""
                    sx={{ width: 15, height: 15, objectFit: "contain" }}
                  />
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {cls.charAt(0).toUpperCase() + cls.slice(1)}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    minWidth: 26,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {b}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flexShrink: 0, px: 2, pt: 1.5, pb: 1.2 }}>
        <Readout
          moves={history}
          classifications={classifications}
          index={currentIdx - 1}
        />
        <Ribbon
          moves={history}
          classifications={classifications}
          index={currentIdx - 1}
          onSelect={(i) => goToMove(i + 1, game)}
        />
      </Box>

      <Box
        id="moves-panel"
        sx={{
          flex: 1,
          minHeight: { xs: 260, lg: 0 },
          overflowY: "auto",
          px: 1.5,
          pb: 1.5,
          scrollbarWidth: "thin",
        }}
      >
        {history.map((san, i) => {
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
              <MoveCell
                san={san}
                cls={classifications[i]}
                active={currentIdx - 1 === i}
                onClick={() => goToMove(i + 1, game)}
              />
              {history[i + 1] ? (
                <MoveCell
                  san={history[i + 1]}
                  cls={classifications[i + 1]}
                  active={currentIdx - 1 === i + 1}
                  onClick={() => goToMove(i + 2, game)}
                />
              ) : (
                <Box sx={{ flex: 1 }} />
              )}
            </Stack>
          );
        })}
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "44px 44px 1fr 1fr",
          gap: 1,
          p: 1.5,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <FooterButton
          title="Flip board (F)"
          onClick={() => setOrientation((v) => !v)}
        >
          <Icon icon="mdi:swap-vertical" height={18} />
        </FooterButton>

        <FooterButton
          title="Board theme"
          onClick={(e) => setThemeAnchor(e.currentTarget)}
          active={boardHue !== 0}
        >
          <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor">
            <path d="M4 4h8v8H4z" opacity=".85" />
            <path d="M12 12h8v8h-8z" opacity=".85" />
            <path d="M12 4h8v8h-8z" opacity=".32" />
            <path d="M4 12h8v8H4z" opacity=".32" />
          </svg>
        </FooterButton>

        <FooterButton
          title="Previous move (←)"
          disabled={currentIdx <= 0}
          onClick={() => goToMove(currentIdx - 1, game)}
        >
          <Icon icon="mdi:arrow-left" height={18} />
        </FooterButton>

        <FooterButton
          title="Next move (→)"
          disabled={currentIdx >= history.length}
          onClick={() => goToMove(currentIdx + 1, game)}
        >
          <Icon icon="mdi:arrow-right" height={18} />
        </FooterButton>

        <Menu
          anchorEl={themeAnchor}
          open={!!themeAnchor}
          onClose={() => setThemeAnchor(null)}
        >
          {HUES.map((hue) => (
            <MenuItem
              key={hue.label}
              selected={boardHue === hue.value}
              onClick={() => {
                setBoardHue(hue.value);
                setThemeAnchor(null);
              }}
              sx={{ fontSize: 13 }}
            >
              {hue.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Box
        component="a"
        href="/freeplay"
        sx={{
          flexShrink: 0,
          py: 1.2,
          fontSize: 12,
          letterSpacing: "0.04em",
          color: "text.secondary",
          textAlign: "center",
          textDecoration: "none",
          borderTop: 1,
          borderColor: "divider",
          transition: "color .16s",
          "&:hover": { color: "primary.main" },
        }}
      >
        Free play →
      </Box>
    </Stack>
  );
}

function PlayerDot({ color }: { color: "w" | "b" }) {
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: color === "w" ? "#efece6" : "#2a2b2d",
        boxShadow:
          color === "b" ? "inset 0 0 0 1px rgba(255,255,255,0.4)" : "none",
      }}
    />
  );
}

function StatRow({
  label,
  white,
  black,
}: {
  label: string;
  white: string | number;
  black: string | number;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "baseline",
        gap: 1.2,
        py: 0.8,
      }}
    >
      <Typography
        sx={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 23,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
        }}
      >
        {white}
      </Typography>
      <Typography
        sx={{
          fontSize: 10,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: "text.secondary",
          textAlign: "center",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 23,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.2,
          textAlign: "right",
        }}
      >
        {black}
      </Typography>
    </Box>
  );
}

function Readout({
  moves,
  classifications,
  index,
}: {
  moves: string[];
  classifications: (MoveClassification | undefined)[];
  index: number;
}) {
  if (index < 0 || index >= moves.length) {
    return (
      <Box
        sx={{
          minHeight: 17,
          mb: 1,
          fontSize: 12,
          color: "text.secondary",
        }}
      >
        Opening position
      </Box>
    );
  }

  const number = Math.floor(index / 2) + 1;
  const prefix = index % 2 === 0 ? `${number}.` : `${number}…`;
  const cls = classifications[index];

  return (
    <Stack
      direction="row"
      alignItems="baseline"
      gap={0.9}
      sx={{ minHeight: 17, mb: 1, fontSize: 12, color: "text.secondary" }}
    >
      <span>{prefix}</span>
      <Box component="span" sx={{ color: "text.primary" }}>
        {moves[index]}
      </Box>
      {cls && (
        <Box
          component="span"
          sx={{
            ml: "auto",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: CLASSIFICATION_COLORS[cls],
          }}
        >
          {cls}
        </Box>
      )}
    </Stack>
  );
}

function Ribbon({
  moves,
  classifications,
  index,
  onSelect,
}: {
  moves: string[];
  classifications: (MoveClassification | undefined)[];
  index: number;
  onSelect: (index: number) => void;
}) {
  const percent = moves.length === 0 ? 0 : ((index + 0.5) / moves.length) * 100;

  return (
    <Box
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const idx = Math.max(
          0,
          Math.min(moves.length - 1, Math.floor(ratio * moves.length))
        );
        onSelect(idx);
      }}
      sx={{
        position: "relative",
        p: 0.4,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        backgroundColor: "rgba(0,0,0,0.34)",
        cursor: "pointer",
      }}
    >
      <Stack sx={{ height: 18, gap: 0.25 }}>
        {[0, 1].map((lane) => (
          <Stack key={lane} direction="row" sx={{ flex: 1, gap: "1px" }}>
            {moves.map((san, i) =>
              i % 2 === lane ? (
                <Box
                  key={i}
                  title={san}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    borderRadius: "1px",
                    bgcolor:
                      (classifications[i] &&
                        CLASSIFICATION_COLORS[classifications[i]!]) ??
                      "divider",
                    opacity: classifications[i] ? 1 : 0.45,
                  }}
                />
              ) : null
            )}
          </Stack>
        ))}
      </Stack>

      <Box
        sx={{
          position: "absolute",
          top: 1,
          bottom: 1,
          left: `${percent}%`,
          width: 2,
          ml: "-1px",
          borderRadius: 2,
          bgcolor: "#f7e7cd",
          boxShadow: "0 0 0 1px rgba(0,0,0,.55)",
          pointerEvents: "none",
          transition: "left .18s cubic-bezier(.16,1,.3,1)",
        }}
      />
    </Box>
  );
}

function MoveCell({
  san,
  cls,
  active,
  onClick,
}: {
  san: string;
  cls?: MoveClassification;
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
        transition: "background-color .14s, color .14s",
        "&:hover": active
          ? undefined
          : { backgroundColor: "rgba(255,255,255,0.06)" },
      }}
    >
      <Box component="span">{san}</Box>
      {cls && (
        <Box
          component="img"
          src={`/icons/${cls}.png`}
          alt=""
          sx={{ width: 15, height: 15, objectFit: "contain", flexShrink: 0 }}
        />
      )}
    </Stack>
  );
}

function FooterButton({
  title,
  onClick,
  disabled,
  active,
  children,
}: {
  title: string;
  onClick: (e: MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      title={title}
      onClick={disabled ? undefined : onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 44,
        color: active ? "primary.main" : "text.secondary",
        border: 1,
        borderColor: active ? "primary.main" : "divider",
        borderRadius: 1.5,
        backgroundColor: "rgba(255,255,255,0.03)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        userSelect: "none",
        transition: "color .16s, border-color .16s, transform .1s",
        "&:hover": disabled ? undefined : { color: "text.primary" },
        "&:active": disabled ? undefined : { transform: "translateY(1px)" },
      }}
    >
      {children}
    </Box>
  );
}
