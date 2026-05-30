export const CSI = "\x1b[";

export const DEBUG_SERVER_URL =
  process.env.DEBUG_SERVER_URL ?? "http://localhost:3000";

export const COL_GAP = 2;

export const INITIAL_FPS = 20;
export const MIN_FPS = 5;
export const MAX_FPS = 60;
export const FPS_STEP = 5;

export const colors = {
  brightWhite: CSI + "1;97m",
  brightGreen: CSI + "1;32m",
  green: CSI + "0;32m",
  dimGreen: CSI + "2;32m",
  reset: CSI + "0m",
};

export interface Drop {
  head: number;
  len: number;
  speed: number;
  timer: number;
  cursor: number;
  phase: "drop" | "scroll";
  scrollTicksLeft: number;
  contentBottom: number;
  line: string;
}
