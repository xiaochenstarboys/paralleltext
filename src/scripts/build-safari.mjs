#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { execFileSync } from "node:child_process";
import { releaseVersion } from "./release-version.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);
const { values } = parseArgs({
  options: {
    resources: { type: "string" },
    "project-location": { type: "string" },
    "bundle-identifier": {
      type: "string",
      default: "com.braintiktok.paralleltext",
    },
    "build-number": { type: "string", default: "1" },
    plan: { type: "boolean", default: false },
    help: { type: "boolean", default: false },
  },
});

async function main() {
  if (values.help) {
    console.log(
      "Create a macOS-only ParallelText Xcode project (run on a Mac with Xcode).\n" +
        "Options: --resources <built Safari directory> --project-location <new output directory>\n" +
        "         --bundle-identifier <registered app ID> --build-number <positive integer> --plan\n" +
        "Without a Mac: build:safari-output, then upload the Safari ZIP with App Store Connect's Safari Web Extension Packager.\n" +
        "This script creates a project; it does not sign, archive or submit an app."
    );
    return;
  }
  const identifier = values["bundle-identifier"];
  if (!/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(identifier))
    throw new Error("Invalid bundle identifier");
  if (!/^[1-9]\d{0,8}$/.test(values["build-number"]))
    throw new Error("Build number must be a positive integer");
  const source = path.resolve(root, values.resources || "build/safari");
  const destination = path.resolve(
    root,
    values["project-location"] || "build/safari-xcode"
  );
  const packageJson = JSON.parse(
    await fs.readFile(path.join(root, "package.json"), "utf8")
  );
  const args = [
    "safari-web-extension-packager",
    source,
    "--project-location",
    destination,
    "--app-name",
    "ParallelText",
    "--bundle-identifier",
    identifier,
    "--macos-only",
    "--swift",
    "--copy-resources",
    "--no-open",
    "--no-prompt",
  ];
  if (values.plan) {
    console.log(
      JSON.stringify(
        {
          version: packageJson.version,
          buildNumber: values["build-number"],
          source,
          destination,
          executable: "xcrun",
          args,
          signed: false,
          submitted: false,
        },
        null,
        2
      )
    );
    return;
  }
  if (process.platform !== "darwin") {
    throw new Error(
      "Local Xcode packaging requires macOS. On Windows, use build:safari-output and App Store Connect's Safari Web Extension Packager after enrolling in the Apple Developer Program."
    );
  }
  try {
    await fs.access(destination);
    throw new Error(
      "The output project already exists. Choose a new --project-location to preserve signing and native changes."
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
                                                                                      
  try {
    execFileSync("xcrun", ["--find", args[0]], { stdio: "pipe" });
  } catch {
    args[0] = "safari-web-extension-converter";                     
    execFileSync("xcrun", ["--find", args[0]], { stdio: "pipe" });
  }
  if (!values.resources) {
    execFileSync(
      process.execPath,
      [
        path.join(root, "node_modules/zx/build/cli.js"),
        path.join(root, "src/scripts/build-task.mjs"),
        "--target=safari",
      ],
      { cwd: root, stdio: "inherit" }
    );
  }
  const manifest = JSON.parse(
    await fs.readFile(path.join(source, "manifest.json"), "utf8")
  );
  if (manifest.side_panel || manifest.action?.default_popup !== "popup.html") {
    throw new Error(
      "Resources are not a Safari build; run build:safari-output first."
    );
  }
  if (manifest.version !== releaseVersion(packageJson.version)) {
    throw new Error("Safari resource version differs from package.json");
  }
  execFileSync("xcrun", args, { cwd: root, stdio: "inherit" });
  const projects = [];
  async function findProjects(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = path.join(directory, entry.name);
      if (entry.name.endsWith(".xcodeproj")) {
        projects.push(path.join(child, "project.pbxproj"));
      } else {
        await findProjects(child);
      }
    }
  }
  await findProjects(destination);
  if (projects.length !== 1) {
    throw new Error(
      "Expected one generated Xcode project; review the output before setting version fields."
    );
  }
  const project = projects[0];
  let text = await fs.readFile(project, "utf8");
  if (
    !/MARKETING_VERSION\s*=/.test(text) ||
    !/CURRENT_PROJECT_VERSION\s*=/.test(text)
  ) {
    throw new Error(
      "Generated project version fields changed; review the project manually before archiving."
    );
  }
  text = text
    .replace(
      /MARKETING_VERSION\s*=\s*[^;]+;/g,
      `MARKETING_VERSION = ${packageJson.version};`
    )
    .replace(
      /CURRENT_PROJECT_VERSION\s*=\s*[^;]+;/g,
      `CURRENT_PROJECT_VERSION = ${values["build-number"]};`
    );
  await fs.writeFile(project, text);
  console.log(
    `Created ${project}. Select your signing team, verify capabilities and export-compliance answers, then test and archive in Xcode.`
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
