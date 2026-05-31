import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const expectedModel = "vendor/models/home-memory/yolox-household-subject/model.onnx";

async function gitLsFiles(args) {
  const { stdout } = await execFileAsync("git", ["ls-files", ...args], {
    maxBuffer: 1024 * 1024,
  });
  return stdout.split(/\r?\n/).filter(Boolean);
}

async function main() {
  const trackedOnnx = await gitLsFiles(["*.onnx"]);
  const unexpected = trackedOnnx.filter((file) => file !== expectedModel);
  if (unexpected.length) {
    throw new Error(`Only ${expectedModel} may be tracked. Unexpected ONNX files: ${unexpected.join(", ")}`);
  }

  const trackedExpected = trackedOnnx.includes(expectedModel);
  const stagedExpected = (await gitLsFiles(["--stage", expectedModel])).length > 0;
  if (!trackedExpected && !stagedExpected) {
    throw new Error(`${expectedModel} must be tracked by Git. Replace this file in place for model updates.`);
  }

  console.log("Runtime model validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
