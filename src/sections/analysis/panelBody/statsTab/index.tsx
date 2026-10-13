import { Stack } from "@mui/material";
import { useAtomValue } from "jotai";
import { gameEvalAtom } from "../../states";
import PlayersMetric from "../analysisTab/playersMetric";

export default function StatsPanel() {
  const gameEval = useAtomValue(gameEvalAtom);

  if (!gameEval) return null;

  return (
    <Stack rowGap={0.8} width="100%" alignItems="center">
      <PlayersMetric
        title="Accuracy"
        whiteValue={`${gameEval.accuracy.white.toFixed(1)} %`}
        blackValue={`${gameEval.accuracy.black.toFixed(1)} %`}
      />

      {gameEval.estimatedElo && (
        <PlayersMetric
          title="Game Rating"
          whiteValue={Math.round(gameEval.estimatedElo.white)}
          blackValue={Math.round(gameEval.estimatedElo.black)}
        />
      )}

      {gameEval.acpl && (
        <PlayersMetric
          title="ACPL"
          whiteValue={Math.round(gameEval.acpl.white)}
          blackValue={Math.round(gameEval.acpl.black)}
        />
      )}
    </Stack>
  );
}
