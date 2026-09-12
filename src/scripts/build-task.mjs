#!/usr/bin/env zx
import { argv, quote, $ } from "zx";
import { releaseVersion } from "./release-version.mjs";
import { createSafariManifest } from "./safari-manifest.mjs";
import { execFileSync } from "node:child_process";

                                                              
if (process.platform === "win32") {
  $.shell = "cmd.exe";
  $.prefix = "";
  $.quote = quote;
}

                                                    
const target = argv.target;

if (!target) {
  console.error(
    chalk.red("Error: Please specify a target, e.g., --target=chrome")
  );
  process.exit(1);
}

                                                                                                      
const buildRoot = argv["output-root"] || "build";
const relativeBuildRoot = path.relative(process.cwd(), path.resolve(buildRoot));
if (
  relativeBuildRoot !== "build" &&
  !relativeBuildRoot.startsWith(`build${path.sep}`)
) {
  throw new Error(
    "Build output must stay inside this project's build directory."
  );
}
if (
  !["web", "chrome", "edge", "safari", "firefox", "thunderbird"].includes(
    target
  )
) {
  throw new Error("Unsupported build target");
}
const targetDir = path.join(buildRoot, target);

                  
const inDest = (file) => path.join(targetDir, file);

console.log(chalk.blue(`\n🚀 Starting build task for: ${chalk.bold(target)}`));

try {
                        
  await fs.remove(targetDir);

                                
  if (target === "edge") {
                                 
    const chromeDir = path.join(buildRoot, "chrome");
    if (!(await fs.pathExists(chromeDir))) {
      throw new Error(
        'Chrome build not found! Please run "pnpm build:chrome" first.'
      );
    }
    await fs.copy(chromeDir, targetDir);
    console.log(chalk.green("✅ Copied Chrome build to Edge."));
  } else {
                    
    process.env.BUILD_PATH = `./${targetDir}`;
    process.env.REACT_APP_CLIENT = target;
    process.env.FORCE_COLOR = "1";
    process.env.NODE_OPTIONS = [
      process.env.NODE_OPTIONS,
      "--disable-warning=DEP0176",
    ]
      .filter(Boolean)
      .join(" ");

    console.log(chalk.gray(`Running react-app-rewired build...`));
    await $`react-app-rewired build`;
  }

                     
  console.log(chalk.gray(`Running post-build cleanups...`));

                                                                            
                                   
                                                                            
  if (["chrome", "edge", "safari", "firefox", "thunderbird"].includes(target)) {
                                               
                                                             
                                              
                                                
                                      
    const collectJs = async (dirPath) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const out = [];
      for (const entry of entries) {
        const full = path.join(dirPath, entry.name);
        if (entry.isDirectory()) out.push(...(await collectJs(full)));
        else if (entry.name.endsWith(".js")) out.push(full);
      }
      return out;
    };
    const jsFiles = await collectJs(targetDir);
    let sanitizedCount = 0;
    for (const filePath of jsFiles) {
      const code = await fs.readFile(filePath, "utf8");
      const next = code
        .replaceAll(String.raw`new Function("return this")()`, "this")
        .replaceAll(String.raw`new Function('return this')()`, "this");
      if (next !== code) {
        await fs.writeFile(filePath, next);
        sanitizedCount += 1;
      }
    }
    console.log(
      chalk.gray("Store lint sanitize: patched " + sanitizedCount + " JS file(s).")
    );
  }

                                                                            
                                      
                                                                            
  if (["chrome", "edge", "safari"].includes(target)) {
                 
    await fs.remove(inDest("content.html"));
                                                                                            
    await fs.remove(inDest("captcha-bridge.html"));

                                            
    await fs.remove(inDest("manifest.firefox.json"));
    await fs.remove(inDest("manifest.thunderbird.json"));

    if (target === "safari") {
      await fs.copy(
        "src/safari/app-icon-1024.png",
        inDest("images/logo1024.png")
      );
      const manifestPath = inDest("manifest.json");
      const manifest = createSafariManifest(await fs.readJson(manifestPath));
      await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    }
  }

                                                                            
                                               
                                                                            
  if (["firefox", "thunderbird"].includes(target)) {
    await fs.remove(inDest("content.html"));
                                              
                                                    
    await fs.remove(inDest("captcha-bridge.html"));

    const specificManifest = inDest(`manifest.${target}.json`);
    const finalManifest = inDest("manifest.json");

    if (await fs.pathExists(specificManifest)) {
      await fs.move(specificManifest, finalManifest, { overwrite: true });
    }

                              
    const files = await fs.readdir(targetDir);
    for (const f of files) {
      if (f.startsWith("manifest.") && f !== "manifest.json") {
        await fs.remove(inDest(f));
      }
    }
  }

                                                                            
                 
                                                                            
  if (target === "web") {
                                
    const filesInDir = await fs.readdir(targetDir);
    for (const f of filesInDir) {
      if (f.startsWith("manifest") && f.endsWith(".json")) {
        await fs.remove(inDest(f));
      }
    }

    const { version } = await fs.readJson("package.json");
    await fs.writeFile(inDest("version.txt"), releaseVersion(version));
    console.log(
      chalk.green(`Version file generated: ${inDest("version.txt")}`)
    );
  }

  const { version: packageVersion } = await fs.readJson("package.json");
  const buildInfo = {
    version: releaseVersion(packageVersion),
    target,
    builtAt: new Date().toISOString(),
    revision: execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim(),
    workingTreeModified: Boolean(
      execFileSync("git", ["status", "--porcelain"], {
        encoding: "utf8",
      }).trim()
    ),
  };
  await fs.writeJson(inDest("release.json"), buildInfo, { spaces: 2 });
  console.log(
    chalk.green(`✅ Build task for [${target}] completed successfully!`)
  );
} catch (err) {
  console.error(chalk.red(`\n❌ Build failed for ${target}:`));
  console.error(err);
  process.exit(1);
}
