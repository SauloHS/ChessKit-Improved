import { usePlayersData } from "@/hooks/usePlayersData";
import { Grid2 as Grid, Typography } from "@mui/material";
import { gameAtom, gameEvalAtom } from "../../../states";
import { MoveClassification } from "@/types/enums";
import ClassificationRow from "./classificationRow";
import { useAtomValue } from "jotai";

export default function MovesClassificationsRecap() {
  const { white, black } = usePlayersData(gameAtom);
  const gameEval = useAtomValue(gameEvalAtom);

  if (!gameEval?.positions.length) return null;

  return (
    <Grid
      container
      justifyContent="center"
      alignItems="stretch"
      direction="column"
      rowGap={0.5}
      size={12}
      flexShrink={0}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        wrap="nowrap"
        size={12}
        px={1}
        pb={0.5}
      >
        <Typography flex={1} align="left" noWrap fontSize="0.8rem">
          {white.name}
        </Typography>

        <Typography flex={1} align="right" noWrap fontSize="0.8rem">
          {black.name}
        </Typography>
      </Grid>

      {sortedMoveClassfications.map((classification) => (
        <ClassificationRow
          key={classification}
          classification={classification}
        />
      ))}
    </Grid>
  );
}

export const sortedMoveClassfications = [
  MoveClassification.Brilliant,
  MoveClassification.Great,
  MoveClassification.Best,
  MoveClassification.Excellent,
  MoveClassification.Okay,
  MoveClassification.Book,
  MoveClassification.Inaccuracy,
  MoveClassification.Mistake,
  MoveClassification.Blunder,
];
