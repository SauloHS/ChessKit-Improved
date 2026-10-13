import { Link as MuiLink, SxProps, Theme } from "@mui/material";
import NextLink from "next/link";
import { ReactNode } from "react";

export default function NavLink({
  href,
  children,
  sx,
}: {
  href: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}) {
  const sxArray = Array.isArray(sx) ? sx : sx ? [sx] : [];

  return (
    <MuiLink
      component={NextLink}
      href={href}
      underline="none"
      color="inherit"
      sx={[{ width: "100%" }, ...sxArray]}
    >
      {children}
    </MuiLink>
  );
}
