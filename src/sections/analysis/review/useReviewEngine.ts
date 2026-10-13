import { useCallback, useEffect } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEngine } from "@/hooks/useEngine";
import { usePlayersData } from "@/hooks/usePlayersData";
import { useGameDatabase } from "@/hooks/useGameDatabase";
import { getEvaluateGameParams } from "@/lib/chess";
import { useCurrentPosition } from "../hooks/useCurrentPosition";
import {
  engineDepthAtom,
  engineMultiPvAtom,
  engineNameAtom,
  engineWorkersNbAtom,
  evaluationProgressAtom,
  gameAtom,
  gameEvalAtom,
  savedEvalsAtom,
} from "../states";
import { SavedEvals } from "@/types/eval";

export const useReviewEngine = () => {
  const engineName = useAtomValue(engineNameAtom);
  const engine = useEngine(engineName);
  useCurrentPosition(engine);

  const engineWorkersNb = useAtomValue(engineWorkersNbAtom);
  const engineDepth = useAtomValue(engineDepthAtom);
  const engineMultiPv = useAtomValue(engineMultiPvAtom);
  const [evaluationProgress, setEvaluationProgress] = useAtom(
    evaluationProgressAtom
  );
  const { setGameEval, gameFromUrl } = useGameDatabase();
  const [gameEval, setEval] = useAtom(gameEvalAtom);
  const game = useAtomValue(gameAtom);
  const setSavedEvals = useSetAtom(savedEvalsAtom);
  const { white, black } = usePlayersData(gameAtom);

  const readyToAnalyse =
    engine?.getIsReady() && game.history().length > 0 && !evaluationProgress;

  const handleAnalyze = useCallback(async () => {
    const params = getEvaluateGameParams(game);
    if (
      !engine?.getIsReady() ||
      params.fens.length === 0 ||
      evaluationProgress
    ) {
      return;
    }

    const newGameEval = await engine.evaluateGame({
      ...params,
      depth: engineDepth,
      multiPv: engineMultiPv,
      setEvaluationProgress,
      playersRatings: {
        white: white?.rating,
        black: black?.rating,
      },
      workersNb: engineWorkersNb,
    });

    setEval(newGameEval);
    setEvaluationProgress(0);

    if (gameFromUrl) {
      setGameEval(gameFromUrl.id, newGameEval);
    }

    const gameSavedEvals: SavedEvals = params.fens.reduce((acc, fen, idx) => {
      acc[fen] = { ...newGameEval.positions[idx], engine: engineName };
      return acc;
    }, {} as SavedEvals);
    setSavedEvals((prev) => ({ ...prev, ...gameSavedEvals }));
  }, [
    engine,
    engineName,
    engineWorkersNb,
    game,
    engineDepth,
    engineMultiPv,
    evaluationProgress,
    setEvaluationProgress,
    setEval,
    gameFromUrl,
    setGameEval,
    setSavedEvals,
    white.rating,
    black.rating,
  ]);

  useEffect(() => {
    setEvaluationProgress(0);
  }, [engine, setEvaluationProgress]);

  useEffect(() => {
    if (!gameEval && readyToAnalyse) handleAnalyze();
  }, [gameEval, readyToAnalyse, handleAnalyze]);

  return {
    evaluationProgress,
    isAnalyzing: !!evaluationProgress,
    engineReady: !!engine?.getIsReady(),
  };
};
