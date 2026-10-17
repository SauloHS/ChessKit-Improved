import { Box, Stack } from "@mui/material";
import { Icon } from "@iconify/react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  currentMoveIdxAtom,
  gameAtom,
} from "../states";
import { useChessActions } from "@/hooks/useChessActions";

export default function MobileNav() {
  const game = useAtomValue(gameAtom);
  const currentIdx = useAtomValue(currentMoveIdxAtom);
  const setOrientation = useSetAtom(boardOrientationAtom);
  const { goToMove } = useChessActions(boardAtom);

  const total = game.history().length;

  if (total === 0) return null;

  return (
    <Stack
      direction="row"
      gap={1}
      sx={{ display: { xs: "flex", md: "none" }, width: "100%" }}
    >
      <NavButton
        title="Flip board"
        onClick={() => setOrientation((value) => !value)}
      >
        <Icon icon="mdi:swap-vertical" height={20} />
      </NavButton>

      <NavButton
        title="Start"
        disabled={currentIdx <= 0}
        onClick={() => goToMove(0, game)}
      >
        <Icon icon="mdi:skip-backward" height={20} />
      </NavButton>

      <NavButton
        title="Previous move"
        disabled={currentIdx <= 0}
        onClick={() => goToMove(currentIdx - 1, game)}
      >
        <Icon icon="mdi:arrow-left" height={22} />
      </NavButton>

      <NavButton
        title="Next move"
        disabled={currentIdx >= total}
        onClick={() => goToMove(currentIdx + 1, game)}
      >
        <Icon icon="mdi:arrow-right" height={22} />
      </NavButton>

      <NavButton
        title="End"
        disabled={currentIdx >= total}
        onClick={() => goToMove(total, game)}
      >
        <Icon icon="mdi:skip-forward" height={20} />
      </NavButton>
    </Stack>
  );
}

function NavButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      title={title}
      onClick={disabled ? undefined : onClick}
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
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
