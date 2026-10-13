import { useSetAtom } from "jotai";
import { boardOrientationAtom } from "../states";
import { useEffect } from "react";
import { ToolbarButton } from "@/components/ToolbarButton";
import { isTypingTarget } from "@/lib/helpers";

export default function FlipBoardButton() {
  const setBoardOrientation = useSetAtom(boardOrientationAtom);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e)) return;
      if (e.key === "f" || e.key === "F") {
        setBoardOrientation((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setBoardOrientation]);

  return (
    <ToolbarButton
      tooltip="Flip board"
      onClick={() => setBoardOrientation((prev) => !prev)}
      icon="eva:flip-fill"
    />
  );
}
