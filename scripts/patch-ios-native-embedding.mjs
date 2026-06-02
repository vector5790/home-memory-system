import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const packagePath = path.join(root, "ios/App/CapApp-SPM/Package.swift");
const configPath = path.join(root, "ios/App/App/capacitor.config.json");

async function patchPackageSwift() {
  let source = await readFile(packagePath, "utf8");
  const ortDependency = '        .package(url: "https://github.com/microsoft/onnxruntime-swift-package-manager", exact: "1.24.2"),';
  const ortProduct = '                .product(name: "onnxruntime", package: "onnxruntime-swift-package-manager"),';

  if (!source.includes(ortDependency)) {
    source = source.replace(
      '        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.4"),',
      `        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.4"),\n${ortDependency}`,
    );
  }
  if (!source.includes(ortProduct)) {
    source = source.replace(
      '                .product(name: "Cordova", package: "capacitor-swift-pm"),',
      `                .product(name: "Cordova", package: "capacitor-swift-pm"),\n${ortProduct}`,
    );
  }
  await writeFile(packagePath, source);
}

async function patchCapacitorConfig() {
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const classes = Array.isArray(config.packageClassList) ? config.packageClassList : [];
  if (!classes.includes("HomeMemoryVisionPlugin")) {
    const insertAfter = classes.indexOf("FilesystemPlugin");
    classes.splice(insertAfter >= 0 ? insertAfter + 1 : classes.length, 0, "HomeMemoryVisionPlugin");
  }
  config.packageClassList = classes;
  await writeFile(configPath, `${JSON.stringify(config, null, "\t")}\n`);
}

await patchPackageSwift();
await patchCapacitorConfig();
console.log("Patched iOS native embedding package dependency and plugin registration.");
