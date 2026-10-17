import { Box, Stack, Typography, useMediaQuery } from "@mui/material";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { atomWithStorage, selectAtom } from "jotai/utils";
import { useEffect, useMemo, useState } from "react";
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
import { getLineWinPercentage } from "@/lib/engine/helpers/winPercentage";
import { LineEval } from "@/types/eval";

type Mood = "cheer" | "happy" | "calm" | "worried" | "sad" | "shocked";

const MOODS: Record<MoveClassification, Mood> = {
  [MoveClassification.Brilliant]: "cheer",
  [MoveClassification.Great]: "happy",
  [MoveClassification.Best]: "happy",
  [MoveClassification.Excellent]: "happy",
  [MoveClassification.Book]: "calm",
  [MoveClassification.Okay]: "calm",
  [MoveClassification.Forced]: "calm",
  [MoveClassification.Inaccuracy]: "worried",
  [MoveClassification.Mistake]: "sad",
  [MoveClassification.Blunder]: "shocked",
};

const LEADS: Record<MoveClassification, string[]> = {
  [MoveClassification.Book]: [
    "{m} is a theory move.",
    "{m} follows well-known theory.",
  ],
  [MoveClassification.Brilliant]: [
    "Wow! {m} is brilliant.",
    "Brilliant! {m} is a move most players would miss.",
  ],
  [MoveClassification.Great]: [
    "Great find! {m} is the only move that holds things together.",
    "{m} is the only good move here, and you found it.",
  ],
  [MoveClassification.Best]: [
    "{m} is the best move.",
    "Perfect. {m} is exactly what the engine wants.",
  ],
  [MoveClassification.Excellent]: [
    "Excellent. {m} is almost as good as the best move.",
    "Nice one. {m} keeps the position healthy.",
  ],
  [MoveClassification.Okay]: [
    "{m} is okay, but there was something sharper.",
    "{m} is playable, nothing more.",
  ],
  [MoveClassification.Inaccuracy]: [
    "{m} is a small inaccuracy.",
    "Careful. {m} lets some of the advantage slip.",
  ],
  [MoveClassification.Mistake]: [
    "{m} is a mistake.",
    "Ouch. {m} gives the opponent real chances.",
  ],
  [MoveClassification.Blunder]: [
    "{m} is a blunder.",
    "Oh no. {m} throws away a lot.",
  ],
  [MoveClassification.Forced]: [
    "{m} is forced.",
    "There was nothing else to play. {m} is forced.",
  ],
};

const PIECE_NAMES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
};

const WEAK_MOVES: MoveClassification[] = [
  MoveClassification.Okay,
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
];

const COSTLY_MOVES: MoveClassification[] = [
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
];

const COACH_NAME = "Coach Rook";
const START_TEXT = "Use the ← → arrows to begin.";
const GREETING = `Hi, I'm ${COACH_NAME}. I'll comment on every move as you go.`;

interface CoachInfo {
  moveClass?: MoveClassification;
  san?: string;
  captured?: string;
  promotion?: string;
  opening?: string;
  cp?: number;
  mate?: number;
  swing?: number;
  bestMove?: string;
}

const safeWinPercentage = (line?: LineEval) => {
  if (!line) return undefined;
  try {
    return getLineWinPercentage(line);
  } catch {
    return undefined;
  }
};

const sameCoachInfo = (a: CoachInfo, b: CoachInfo) =>
  (Object.keys(a) as (keyof CoachInfo)[]).every((key) => a[key] === b[key]);

const coachInfoAtom = selectAtom(
  currentPositionAtom,
  (position): CoachInfo => {
    const moveClass = position?.eval?.moveClassification;
    const move = position?.lastMove;
    const line = moveClass ? position?.eval?.lines?.[0] : undefined;
    const previousLine = moveClass ? position?.lastEval?.lines?.[0] : undefined;

    const after = safeWinPercentage(line);
    const before = safeWinPercentage(previousLine);
    const swing =
      after !== undefined && before !== undefined
        ? Math.round((after - before) * (move?.color === "b" ? -1 : 1))
        : undefined;

    return {
      moveClass,
      san: move?.san,
      captured: move?.captured,
      promotion: move?.promotion,
      opening: position?.eval?.opening || position?.opening,
      cp: line?.cp,
      mate: line?.mate,
      swing,
      bestMove: position?.lastEval?.bestMove,
    };
  },
  sameCoachInfo
);

const SPOKEN_PIECES: Record<string, string> = {
  N: "knight",
  B: "bishop",
  R: "rook",
  Q: "queen",
  K: "king",
};

const sanToSpeech = (san: string): string => {
  let text = san;
  let suffix = "";

  if (text.endsWith("#")) {
    suffix = ", checkmate";
    text = text.slice(0, -1);
  } else if (text.endsWith("+")) {
    suffix = ", check";
    text = text.slice(0, -1);
  }

  if (text.startsWith("O-O-O")) return `castles queenside${suffix}`;
  if (text.startsWith("O-O")) return `castles kingside${suffix}`;

  let promotion = "";
  const promotionMatch = text.match(/=([QRBN])$/);
  if (promotionMatch) {
    promotion = `, promoting to ${SPOKEN_PIECES[promotionMatch[1]]}`;
    text = text.slice(0, -2);
  }

  const piece = SPOKEN_PIECES[text[0]];
  if (piece) text = text.slice(1);

  const target = text.replace("x", " takes ").replace(/\s+/g, " ").trim();

  return `${piece ? `${piece} ` : ""}${target}${promotion}${suffix}`;
};

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const describeEvaluation = (info: CoachInfo): string | undefined => {
  if (info.mate !== undefined && info.mate !== 0) {
    return `${info.mate > 0 ? "White" : "Black"} has a forced mate in ${Math.abs(info.mate)}.`;
  }

  if (info.cp === undefined) return undefined;

  const leader = info.cp > 0 ? "White" : "Black";
  const size = Math.abs(info.cp);

  if (size < 25) return "The position is about equal.";
  if (size < 90) return `${leader} is slightly better.`;
  if (size < 250) return `${leader} is clearly better.`;
  return `${leader} is winning.`;
};

const buildComment = (
  info: CoachInfo,
  bestMoveSan: string | undefined,
  spoken: boolean
): string => {
  const { moveClass, san } = info;
  if (!moveClass || !san) return "";

  const say = (value: string) => (spoken ? sanToSpeech(value) : value);
  const variants = LEADS[moveClass];
  const seed = hashString(
    `${san}${moveClass}${info.cp ?? ""}${info.mate ?? ""}`
  );
  const parts = [variants[seed % variants.length].replace("{m}", say(san))];

  if (moveClass === MoveClassification.Book && info.opening) {
    parts.push(`This is the ${info.opening}.`);
  }

  if (san.endsWith("#")) {
    parts.push("And that is checkmate!");
  } else if (info.promotion) {
    parts.push(`It promotes to a ${PIECE_NAMES[info.promotion] ?? "piece"}.`);
  } else if (info.captured) {
    parts.push(`It takes the ${PIECE_NAMES[info.captured] ?? "piece"}.`);
  } else if (san.startsWith("O-O")) {
    parts.push("Castling brings your king to safety.");
  } else if (san.endsWith("+")) {
    parts.push("It gives check.");
  }

  if (bestMoveSan && WEAK_MOVES.includes(moveClass)) {
    parts.push(`${say(bestMoveSan)} was stronger.`);
  }

  if (
    info.swing !== undefined &&
    info.swing <= -8 &&
    COSTLY_MOVES.includes(moveClass)
  ) {
    parts.push(
      `That costs about ${-info.swing}${spoken ? " percent" : "%"} of your winning chances.`
    );
  }

  if (!san.endsWith("#")) {
    const evaluation = describeEvaluation(info);
    if (evaluation) parts.push(evaluation);
  }

  return parts.join(" ");
};

const pickVoice = (voices: SpeechSynthesisVoice[]) => {
  const english = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith("en")
  );

  return (
    english.find((voice) =>
      /natural|google|samantha|aria|jenny|daniel/i.test(voice.name)
    ) ??
    english.find((voice) => voice.default) ??
    english[0]
  );
};

const coachVoiceAtom = atomWithStorage("coachVoice", false);

export default function LeftRail() {
  const info = useAtomValue(coachInfoAtom);
  const { moveClass, bestMove: lastBestMove } = info;
  const board = useAtomValue(boardAtom);
  const setGame = useSetAtom(gameAtom);
  const setGameEval = useSetAtom(gameEvalAtom);
  const { resetToStartingPosition } = useChessActions(boardAtom);

  const fen = board.fen();
  const metrics = useMemo(() => computePositionMetrics(fen), [fen]);

  const bestMoveSan = useMemo(() => {
    if (!lastBestMove) return undefined;

    const before = board.history({ verbose: true }).at(-1)?.before;
    if (!before) return undefined;

    return moveLineUciToSan(before)(lastBestMove);
  }, [lastBestMove, board]);

  const comment = useMemo(
    () => (moveClass ? buildComment(info, bestMoveSan, false) : GREETING),
    [info, bestMoveSan, moveClass]
  );

  const spokenComment = useMemo(
    () => (moveClass ? buildComment(info, bestMoveSan, true) : ""),
    [info, bestMoveSan, moveClass]
  );

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

        <Coach
          mood={moveClass ? MOODS[moveClass] : "calm"}
          comment={comment}
          spokenComment={spokenComment}
        />
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

function Coach({
  mood,
  comment,
  spokenComment,
}: {
  mood: Mood;
  comment: string;
  spokenComment: string;
}) {
  const [voiceOn, setVoiceOn] = useAtom(coachVoiceAtom);
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (!supported || !voiceOn || !spokenComment) return;

    const synth = window.speechSynthesis;

    const timer = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(spokenComment);
      const voice = pickVoice(synth.getVoices());
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-US";
      }
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      synth.cancel();
      synth.speak(utterance);
    }, 350);

    return () => {
      clearTimeout(timer);
      synth.cancel();
      setSpeaking(false);
    };
  }, [supported, voiceOn, spokenComment]);

  return (
    <Stack direction="row" alignItems="flex-start" gap={1.4}>
      <CoachAvatar mood={mood} speaking={speaking} />

      <Box
        sx={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          px: 1.6,
          py: 1.2,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 18,
            left: -6,
            width: 10,
            height: 10,
            bgcolor: "background.paper",
            borderLeft: 1,
            borderBottom: 1,
            borderColor: "divider",
            transform: "rotate(45deg)",
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 0.5 }}
        >
          <Typography
            sx={{
              fontSize: 10,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "text.secondary",
            }}
          >
            {COACH_NAME}
          </Typography>

          {supported && (
            <Box
              component="button"
              type="button"
              onClick={() => setVoiceOn((value) => !value)}
              aria-pressed={voiceOn}
              aria-label={
                voiceOn ? "Turn coach voice off" : "Turn coach voice on"
              }
              title={voiceOn ? "Voice on" : "Voice off"}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                p: 0,
                border: 1,
                borderColor: voiceOn ? "primary.main" : "divider",
                borderRadius: 1.5,
                bgcolor: "transparent",
                color: voiceOn ? "primary.main" : "text.secondary",
                cursor: "pointer",
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                },
              }}
            >
              <svg
                viewBox="0 0 24 24"
                width={16}
                height={16}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" />
                {voiceOn ? (
                  <>
                    <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
                    <path d="M18 6.8a7.4 7.4 0 0 1 0 10.4" />
                  </>
                ) : (
                  <path d="m16 9.5 4.5 5m0-5-4.5 5" />
                )}
              </svg>
            </Box>
          )}
        </Stack>

        <Typography
          aria-live="polite"
          sx={{ fontSize: 14, lineHeight: 1.6, color: "text.primary" }}
        >
          {comment}
        </Typography>
      </Box>
    </Stack>
  );
}

function CoachAvatar({ mood, speaking }: { mood: Mood; speaking: boolean }) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const talking = speaking && !reduceMotion;

  const browLeft: Record<Mood, string> = {
    cheer: "M22.5 22.5q3.5-3 7 0",
    happy: "M22.5 24q3.5-2 7 0",
    calm: "M23 24.5h6.5",
    worried: "M22.5 26 29.5 23.2",
    sad: "M22.5 26.5 29.5 23",
    shocked: "M22.5 22q3.5-3.4 7 0",
  };

  const browRight: Record<Mood, string> = {
    cheer: "M34.5 22.5q3.5-3 7 0",
    happy: "M34.5 24q3.5-2 7 0",
    calm: "M34.5 24.5H41",
    worried: "M41.5 26 34.5 23.2",
    sad: "M41.5 26.5 34.5 23",
    shocked: "M34.5 22q3.5-3.4 7 0",
  };

  const mouth: Record<Mood, string> = {
    cheer: "M26.5 39q5.5 8.5 11 0z",
    happy: "M27 39.5q5 5 10 0",
    calm: "M28 40.5q4 1.5 8 0",
    worried: "M28 41.8q4-2.4 8 0",
    sad: "M27.5 43q4.5-4.6 9 0",
    shocked: "",
  };

  const closedEyes = mood === "cheer";

  return (
    <Box sx={{ flexShrink: 0, width: 56, height: 56 }}>
      <svg
        viewBox="0 0 64 64"
        width={56}
        height={56}
        role="img"
        aria-label={`${COACH_NAME} looks ${mood}`}
      >
        <circle cx={32} cy={32} r={32} fill="#81b64c" fillOpacity={0.28} />
        <path d="M6 64c2-13 12-17 26-17s24 4 26 17z" fill="#3b4a5a" />
        <path d="m26 47.5 6 8 6-8z" fill="#f4f1ea" />
        <path
          d="M14 59v-4.4h1.7v1.1h1.3v-1.1h1.5v1.1h1.3v-1.1H21.5V59z"
          fill="#e6c15a"
        />
        <rect x={28.5} y={40} width={7} height={9} rx={3} fill="#d9a57c" />
        <ellipse cx={32} cy={30} rx={13} ry={15} fill="#e9b98f" />
        <ellipse cx={19} cy={31} rx={2.2} ry={3.2} fill="#e0ad82" />
        <ellipse cx={45} cy={31} rx={2.2} ry={3.2} fill="#e0ad82" />
        <path
          d="M18.6 29c-1.4-11.5 6-17.2 13.4-17.2S46.8 17.5 45.4 29c-2.2-5.6-5.4-8.8-13.4-8.800S20.8 23.4 18.6 29z"
          fill="#3a2a22"
        />
        <g fill="none" stroke="#2b2b2b" strokeWidth={1.3}>
          <circle cx={26} cy={30.5} r={4.3} />
          <circle cx={38} cy={30.5} r={4.3} />
          <path d="M30.3 30.500h3.4" />
        </g>
        {closedEyes ? (
          <g fill="none" stroke="#222" strokeWidth={1.5} strokeLinecap="round">
            <path d="M23.5 31.500q2.5-3.2 5 0" />
            <path d="M35.5 31.500q2.5-3.2 5 0" />
          </g>
        ) : (
          <g fill="#222">
            <circle cx={26} cy={30.5} r={mood === "shocked" ? 2 : 1.4} />
            <circle cx={38} cy={30.5} r={mood === "shocked" ? 2 : 1.4} />
          </g>
        )}
        <g fill="none" stroke="#3a2a22" strokeWidth={1.5} strokeLinecap="round">
          <path d={browLeft[mood]} />
          <path d={browRight[mood]} />
        </g>
        {talking ? (
          <ellipse cx={32} cy={41} rx={3.4} ry={1.2} fill="#7a2d2d">
            <animate
              attributeName="ry"
              values="0.8;3.6;1.2;3;0.8"
              dur="0.5s"
              repeatCount="indefinite"
            />
          </ellipse>
        ) : mood === "shocked" ? (
          <ellipse cx={32} cy={41.5} rx={2.8} ry={3.8} fill="#7a2d2d" />
        ) : mood === "cheer" ? (
          <path d={mouth[mood]} fill="#7a2d2d" />
        ) : (
          <path
            d={mouth[mood]}
            fill="none"
            stroke="#7a2d2d"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        )}
        {mood === "cheer" && (
          <g fill="#f5c542">
            <path d="m52 10 1.3 3.4 3.4 1.3-3.4 1.300L52 19.400l-1.3-3.4-3.4-1.3 3.4-1.300z" />
            <path d="m11 14 .900 2.3 2.3.9-2.3.900L11 20.400l-.900-2.3-2.3-.900 2.3-.900z" />
          </g>
        )}
        {mood === "shocked" && (
          <path d="M49 18q3.5 4.5 0 7q-3.5-2.5 0-7z" fill="#7ec8ff" />
        )}
      </svg>
    </Box>
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
