import { Skeleton, Stack, Typography } from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, currentPositionAtom } from "../../states";
import { useMemo } from "react";
import { moveLineUciToSan } from "@/lib/chess";
import { MoveClassification } from "@/types/enums";
import Image from "next/image";
import PrettyMoveSan from "@/components/prettyMoveSan";
import { CLASSIFICATION_COLORS } from "@/constants";
import { capitalize } from "@/lib/helpers";

export default function MoveInfo() {
  const position = useAtomValue(currentPositionAtom);
  const board = useAtomValue(boardAtom);

  const bestMove = position?.lastEval?.bestMove;

  const bestMoveSan = useMemo(() => {
    if (!bestMove) return undefined;

    const lastPosition = board.history({ verbose: true }).at(-1)?.before;
    if (!lastPosition) return undefined;

    return moveLineUciToSan(lastPosition)(bestMove);
  }, [bestMove, board]);

  if (board.history().length === 0) return null;

  if (!bestMoveSan) {
    return (
      <Stack direction="row" alignItems="center" columnGap={5} marginTop={0.8}>
        <Skeleton
          variant="rounded"
          animation="wave"
          width={"12em"}
          sx={{ color: "transparent", maxWidth: "7vw" }}
        >
          <Typography align="center" fontSize="0.9rem">
            placeholder
          </Typography>
        </Skeleton>
      </Stack>
    );
  }

  const moveClassification = position.eval?.moveClassification;

  const showBestMoveLabel =
    moveClassification !== MoveClassification.Best &&
    moveClassification !== MoveClassification.Book &&
    moveClassification !== MoveClassification.Forced &&
    moveClassification !== MoveClassification.Brilliant &&
    moveClassification !== MoveClassification.Great;

  return (
    <Stack
      direction="column"
      alignItems="center"
      justifyContent="center"
      rowGap={0.7}
      marginTop={0.5}
      width="100%"
    >
      {moveClassification && (
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Image
            src={`/icons/${moveClassification}.png`}
            alt="move-icon"
            width={34}
            height={34}
            style={{
              maxWidth: "4vw",
              maxHeight: "4vw",
            }}
          />

          <Typography
            variant="h6"
            fontWeight={700}
            noWrap
            sx={{ color: CLASSIFICATION_COLORS[moveClassification] }}
          >
            {capitalize(moveClassification)}
          </Typography>
        </Stack>
      )}

      {moveClassification && (
        <PrettyMoveSan
          typographyProps={{
            fontSize: "0.9rem",
          }}
          san={position.lastMove?.san ?? ""}
          color={position.lastMove?.color ?? "w"}
          additionalText={" is " + moveClassificationLabels[moveClassification]}
        />
      )}

      {showBestMoveLabel && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Image
            src={"/icons/best.png"}
            alt="move-icon"
            width={16}
            height={16}
            style={{
              maxWidth: "3.5vw",
              maxHeight: "3.5vw",
            }}
          />
          <PrettyMoveSan
            typographyProps={{
              fontSize: "0.9rem",
            }}
            san={bestMoveSan}
            color={position.lastMove?.color ?? "w"}
            additionalText=" was the best move"
          />
        </Stack>
      )}
    </Stack>
  );
}

const moveClassificationLabels: Record<MoveClassification, string> = {
  [MoveClassification.Book]: "a book move",
  [MoveClassification.Forced]: "forced",
  [MoveClassification.Brilliant]: "brilliant !!",
  [MoveClassification.Great]: "the only good move !",
  [MoveClassification.Best]: "the best move",
  [MoveClassification.Excellent]: "excellent",
  [MoveClassification.Okay]: "an okay move",
  [MoveClassification.Inaccuracy]: "an inaccuracy",
  [MoveClassification.Mistake]: "a mistake",
  [MoveClassification.Blunder]: "a blunder",
};
