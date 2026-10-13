import {
  Grid2 as Grid,
  Grid2Props as GridProps,
  Stack,
  Typography,
} from "@mui/material";
import { useAtomValue } from "jotai";
import { boardAtom, gameAtom, gameEvalAtom } from "../../states";
import MoveInfo from "./moveInfo";
import Opening from "./opening";
import EngineLines from "./engineLines";
import PositionMetrics from "./positionMetrics";

export default function AnalysisTab(props: GridProps) {
  const gameEval = useAtomValue(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const board = useAtomValue(boardAtom);

  const boardHistory = board.history();
  const gameHistory = game.history();

  const isGameOver =
    boardHistory.length > 0 &&
    (board.isCheckmate() ||
      board.isDraw() ||
      boardHistory.join() === gameHistory.join());

  return (
    <Grid
      container
      size={12}
      justifyContent="center"
      alignItems="center"
      direction="column"
      flexWrap="nowrap"
      rowGap={2}
      {...props}
      sx={props.hidden ? { display: "none" } : props.sx}
    >
      <Stack
        justifyContent="center"
        alignItems="center"
        rowGap={1}
        width="100%"
      >
        <MoveInfo />

        <Opening />

        {isGameOver && (
          <Typography align="center" fontSize="0.9rem" noWrap>
            Game is over
          </Typography>
        )}

        <PositionMetrics />
      </Stack>

      <EngineLines size={{ lg: gameEval ? undefined : 12 }} />
    </Grid>
  );
}
