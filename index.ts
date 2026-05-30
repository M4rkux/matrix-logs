import { CSI, colors } from "./src/config";
import { addLine, isPaused, pause, resume, resize, tick } from "./src/simulation";
import { render } from "./src/render";
import { excuses, prefixes } from "./src/excuses";
import { clearSession, getLastLogId, getLogsSince } from "./src/storage";
import { ReadStream } from "node:tty";
import { openSync } from "node:fs";

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

let pauseStartId = 0;

function togglePause() {
  if (!isPaused) {
    pauseStartId = getLastLogId();
    pause();
  } else {
    resume(getLogsSince(pauseStartId));
  }
}

const ttyFd = openSync("/dev/tty", "r+");
const keyboard = new ReadStream(ttyFd);
keyboard.setRawMode(true);
keyboard.resume();
keyboard.on("data", (chunk: Buffer) => {
  const key = chunk.toString();
  if (key === "p" || key === "P") togglePause();
  if (key === "+")                setFps(Math.min(MAX_FPS, fps + FPS_STEP));
  if (key === "-")                setFps(Math.max(MIN_FPS, fps - FPS_STEP));
  if (key === "0")                setFps(INITIAL_FPS);
  if (key === "\x03")             process.emit("SIGINT", "SIGINT");
});

function cleanup() {
  clearSession();
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

const INITIAL_FPS = 20;
const MIN_FPS = 5;
const MAX_FPS = 60;
const FPS_STEP = 5;
let fps = INITIAL_FPS;
let intervalId: ReturnType<typeof setInterval>;

function setFps(value: number) {
  fps = value;
  clearInterval(intervalId);
  intervalId = setInterval(loop, (1000 / fps) | 0);
}

function loop() {
  if (isPaused) return;
  tick();
  render();
}

intervalId = setInterval(loop, (1000 / fps) | 0);
