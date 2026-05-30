import { CSI, COL_GAP, clr } from "./config";
import { colGrids, drops, HEIGHT, NUM_COLS } from "./simulation";

export function render() {
  const out: string[] = [CSI + "H"];
  let cur = "";
  const setC = (c: string) => {
    if (c !== cur) {
      out.push(c);
      cur = c;
    }
  };

  for (let r = 0; r < HEIGHT; r++) {
    const row1 = r + 1;

    for (let lc = 0; lc < NUM_COLS; lc++) {
      const ch = colGrids[lc]?.[r] ?? " ";
      const d = drops[lc] ?? null;
      let color = clr.dimGreen;

      if (d !== null && d.head >= 1) {
        if (d.phase === "drop") {
          const dist = d.head - row1;
          if (dist === 0) {
            color = clr.brightWhite;
          } else if (dist > 0 && dist <= d.len) {
            const ratio = dist / d.len;
            color =
              ratio < 0.25
                ? clr.brightGreen
                : ratio < 0.6
                  ? clr.green
                  : clr.dimGreen;
          }
        } else {
          const dist = d.contentBottom - r;
          if (dist === 0 && d.contentBottom < HEIGHT) {
            color = clr.brightWhite;
          } else if (dist > 0 && dist <= d.len) {
            const ratio = dist / d.len;
            color =
              ratio < 0.25
                ? clr.brightGreen
                : ratio < 0.6
                  ? clr.green
                  : clr.dimGreen;
          }
        }
      }

      if (ch === " " && color === clr.dimGreen) {
        setC(clr.reset);
      } else {
        setC(color);
      }
      out.push(ch);

      if (lc < NUM_COLS - 1) {
        setC(clr.reset);
        out.push(" ".repeat(COL_GAP));
      }
    }

    out.push(clr.reset + CSI + "K");
    cur = "";
    if (r < HEIGHT - 1) out.push("\r\n");
  }

  process.stdout.write(out.join(""));
}
