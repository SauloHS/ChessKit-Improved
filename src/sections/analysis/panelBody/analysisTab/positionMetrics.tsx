import { useMemo } from "react";
import { useAtomValue } from "jotai";
import { Stack } from "@mui/material";
import { boardAtom } from "../../states";
import { computePositionMetrics } from "@/lib/engine/helpers/positionMetrics";
import PlayersMetric from "./playersMetric";

export default function PositionMetrics() {
  const board = useAtomValue(boardAtom);
  const fen = board.fen();

  const metrics = useMemo(() => computePositionMetrics(fen), [fen]);

  return (
    <Stack rowGap={0.8} alignItems="center" width="100%">
      <PlayersMetric
        title="Development"
        whiteValue={metrics.development.white}
        blackValue={metrics.development.black}
      />
      <PlayersMetric
        title="Tension & pressure"
        whiteValue={metrics.tension.white}
        blackValue={metrics.tension.black}
      />
      <PlayersMetric
        title="Mobility"
        whiteValue={metrics.mobility.white}
        blackValue={metrics.mobility.black}
      />
      <PlayersMetric
        title="Control"
        whiteValue={metrics.control.white}
        blackValue={metrics.control.black}
      />
    </Stack>
  );
}
