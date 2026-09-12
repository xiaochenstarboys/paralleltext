#!/usr/bin/env zx
import { argv, chalk, fs, path } from "zx";
import zip from "bestzip";
import { releaseVersion } from "./release-version.mjs";

                                                                        
                                                                                             
const buildRoot = path.resolve(argv["output-root"] || "build");
const relativeRoot = path.relative(path.resolve("build"), buildRoot);
if (relativeRoot.startsWith("..") || path.isAbsolute(relativeRoot)) {
  throw new Error(
    "Archive input must stay inside this project's build directory."
  );
}
const targets = String(argv.target || "chrome,edge,firefox,thunderbird").split(
  ","
);
const allowedTargets = ["chrome", "edge", "safari", "firefox", "thunderbird"];
if (targets.some((target) => !allowedTargets.includes(target))) {
  throw new Error("Unsupported archive target");
}
const { version } = await fs.readJson("package.json");

                                                             
for (const target of targets) {
  const manifest = await fs.readJson(
    path.join(buildRoot, target, "manifest.json")
  );
  if (manifest.version !== releaseVersion(version)) {
    throw new Error(`${target}: manifest version does not match package.json`);
  }
}

for (const target of targets) {
  const cwd = path.join(buildRoot, target);
  const destination = path.join(buildRoot, `${target}.zip`);
  const temporary = path.join(buildRoot, `${target}.pending.zip`);
  try {
    await fs.remove(temporary);
    await zip({
      cwd,
      source: (await fs.readdir(cwd)).filter((name) => !name.startsWith(".")),
      destination: temporary,
    });
    await fs.move(temporary, destination, { overwrite: true });
    console.log(
      chalk.green(`Created ${destination} (manifest.json at ZIP root)`)
    );
  } finally {
    await fs.remove(temporary);
  }
}
