import { CSI, COL_GAP, colors } from "./config";
import { colGrids, drops, HEIGHT, log, NUM_COLS } from "./simulation";

export function render() {
  const out: string[] = [CSI + "H"];
  let currentColor = "";
  const setColor = (c: string) => {
    if (c !== currentColor) {
      out.push(c);
      currentColor = c;
    }
  };

  let oldD = null;
  for (let r = 0; r < HEIGHT; r++) {
    const row1 = r + 1;

    for (let lc = 0; lc < NUM_COLS; lc++) {
      const ch = colGrids[lc]?.[r] ?? " ";
      const d = drops[lc] ?? null;
      let color = colors.dimGreen;

      if (d !== null && d.head >= 1) {
        if (JSON.stringify(d) !== JSON.stringify(oldD)) {
          log(JSON.stringify(d));
          oldD = { ...d };
        }
        if (d.phase === "drop") {
          const dist = d.head - row1;
          if (dist === 0) {
            color = colors.brightWhite;
          } else if (dist > 0 && dist <= d.len) {
            const ratio = dist / d.len;
            color =
              ratio < 0.25
                ? colors.brightGreen
                : ratio < 0.6
                  ? colors.green
                  : colors.dimGreen;
          }
        } else {
          const dist = d.contentBottom - r;
          if (dist === 0 && d.contentBottom < HEIGHT) {
            color = colors.brightWhite;
          } else if (dist > 0 && dist <= d.len) {
            const ratio = dist / d.len;
            color =
              ratio < 0.25
                ? colors.brightGreen
                : ratio < 0.6
                  ? colors.green
                  : colors.dimGreen;
          }
        }
      }

      if (ch === " " && color === colors.dimGreen) {
        setColor(colors.reset);
      } else {
        setColor(color);
      }
      out.push(ch);

      if (lc < NUM_COLS - 1) {
        setColor(colors.reset);
        out.push(" ".repeat(COL_GAP));
      }
    }

    out.push(colors.reset + CSI + "K");
    currentColor = "";
    if (r < HEIGHT - 1) out.push("\r\n");
  }

  process.stdout.write(out.join(""));
}
