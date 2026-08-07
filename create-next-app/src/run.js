// @ts-check

/**
 * Promisified spawn wrapper.
 *
 * Always spawns with an argument array and shell:false so paths with spaces
 * and special characters are never an issue. stdin is closed ("ignore") so a
 * child process that unexpectedly prompts fails fast instead of hanging.
 * stdout/stderr are captured into a bounded buffer for error reporting.
 */

import { spawn } from "node:child_process";

const MAX_OUTPUT = 64 * 1024;

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string> }} [opts]
 * @returns {Promise<{ code: number, output: string }>}
 */
export function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    let output = "";
    /** @param {Buffer} chunk */
    const append = (chunk) => {
      output += chunk.toString();
      if (output.length > MAX_OUTPUT) output = output.slice(-MAX_OUTPUT);
    };
    child.stdout?.on("data", append);
    child.stderr?.on("data", append);

    child.on("error", (err) => {
      reject(Object.assign(err, { output }));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ code: 0, output });
      } else {
        reject(
          Object.assign(new Error(`${cmd} exited with code ${code}`), {
            code,
            output,
          }),
        );
      }
    });
  });
}
