import { CSI, colors } from "./src/config";
import { addLine, resize, tick } from "./src/simulation";
import { render } from "./src/render";
import { excuses, prefixes } from "./src/excuses";

let excuse = excuses[(Math.random() * excuses.length) | 0];
let prefix = prefixes[(Math.random() * prefixes.length) | 0];
const _error = console.error;
let oldArgs: string | null = null;
console.error = (...args: unknown[]) => {
  if (oldArgs !== JSON.stringify(args)) {
    excuse = excuses[(Math.random() * excuses.length) | 0];
    prefix = prefixes[(Math.random() * prefixes.length) | 0];
    oldArgs = JSON.stringify(args);
  }
  _error(...args, `\n— ${prefix}${excuse}`);
};

if (!process.stdout.isTTY) {
  console.error("stdout must be a TTY — pipe input, not output");
  process.exit(1);
}

process.stdout.write(colors.reset + CSI + "?25l" + CSI + "2J" + CSI + "H");
process.on("SIGWINCH", resize);

function cleanup() {
  process.stdout.write(colors.reset + CSI + "?25h" + CSI + "2J" + CSI + "H");
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

if (!process.stdin.isTTY) {
  const { createInterface } = await import("node:readline");
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on("line", addLine);
} else {
  const demo = [
    "matrix-logs: pipe any command here",
    "64 bytes from google.com: icmp_seq=1 ttl=116 time=11.2 ms",
    "64 bytes from google.com: icmp_seq=2 ttl=116 time=10.8 ms",
    "ping google.com | bun start",
    "journalctl -f | bun start",
  ];
  for (const line of demo) addLine(line);
}

const FPS = 20;
setInterval(
  () => {
    tick();
    render();
  },
  (1000 / FPS) | 0,
);
