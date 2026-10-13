import { useAtomValue } from "jotai";
import {
  boardAtom,
  boardOrientationAtom,
  currentPositionAtom,
  gameAtom,
  showBestMoveArrowAtom,
  showPlayerMoveIconAtom,
} from "../states";
import { useMemo } from "react";
import { useScreenSize } from "@/hooks/useScreenSize";
import { Color } from "@/types/enums";
import Board from "@/components/board";
import { usePlayersData } from "@/hooks/usePlayersData";

export default function BoardContainer() {
  const screenSize = useScreenSize();
  const boardOrientation = useAtomValue(boardOrientationAtom);
  const showBestMoveArrow = useAtomValue(showBestMoveArrowAtom);
  const { white, black } = usePlayersData(gameAtom);

  const boardSize = useMemo(() => {
    const width = screenSize.width;
    const height = screenSize.height;
    const isWide =
      typeof window !== "undefined" && window.innerWidth >= 1000;

    if (!isWide) {
      return Math.min(width, 560);
    }

    // The board sits between two rails, plus the gaps between them.
    const railsWidth = window.innerWidth >= 1200 ? 724 : 634;
    const containerWidth = Math.min(width, 1600);
    return Math.min(containerWidth - railsWidth, height - 16);
  }, [screenSize]);

  return (
    <Board
      id="AnalysisBoard"
      boardSize={boardSize}
      canPlay={true}
      gameAtom={boardAtom}
      whitePlayer={white}
      blackPlayer={black}
      boardOrientation={boardOrientation ? Color.White : Color.Black}
      currentPositionAtom={currentPositionAtom}
      showBestMoveArrow={showBestMoveArrow}
      showPlayerMoveIconAtom={showPlayerMoveIconAtom}
      showEvaluationBar={true}
    />
  );
}
