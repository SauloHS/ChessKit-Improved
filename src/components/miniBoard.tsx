import { Box } from "@mui/material";

interface Props {
  fen: string;
  size?: number | string;
  pieceSet?: string;
}

export default function MiniBoard({
  fen,
  size = 300,
  pieceSet = "staunty",
}: Props) {
  const boardPart = fen.split(" ")[0];
  const squares: (string | null)[] = [];

  for (const row of boardPart.split("/")) {
    for (const char of row) {
      if (/\d/.test(char)) {
        for (let i = 0; i < Number(char); i++) squares.push(null);
      } else {
        squares.push(char);
      }
    }
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        width: size,
        height: size,
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      {squares.map((char, index) => {
        const file = index % 8;
        const row = Math.floor(index / 8);
        const isLight = (file + (7 - row)) % 2 === 1;
        const code = char
          ? (char === char.toUpperCase() ? "w" : "b") + char.toUpperCase()
          : null;

        return (
          <Box
            key={index}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isLight ? "#ecdab9" : "#c5a076",
            }}
          >
            {code && (
              <Box
                component="img"
                src={`/piece/${pieceSet}/${code}.svg`}
                alt=""
                sx={{ width: "88%", height: "88%" }}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
