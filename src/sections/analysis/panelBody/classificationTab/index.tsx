import { Grid2 as Grid, Grid2Props as GridProps } from "@mui/material";
import MovesPanel from "./movesPanel";
import MovesClassificationsRecap from "./movesClassificationsRecap";

export default function ClassificationTab(props: GridProps) {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="stretch"
      direction="column"
      rowGap={1.5}
      wrap="nowrap"
      flexGrow={1}
      minHeight={0}
      size={12}
      {...props}
      sx={
        props.hidden ? { display: "none" } : { overflow: "hidden", ...props.sx }
      }
    >
      <MovesClassificationsRecap />

      <MovesPanel />
    </Grid>
  );
}
