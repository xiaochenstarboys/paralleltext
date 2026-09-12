#!/usr/bin/env zx
import { $, argv } from "zx";

   
          
                                                     
   
      
                                            
                                           
                                           
                                          
   

const rootDir = path.resolve(__dirname, "../..");
const versionType = argv._[0] || argv.type || "patch";

console.log(chalk.blue(`\n🚀 开始更新版本号...\n`));

try {
             
    const pkgPath = path.join(rootDir, "package.json");
    const pkg = await fs.readJSON(pkgPath);
    const oldVersion = pkg.version;

    console.log(chalk.gray(`当前版本: ${oldVersion}`));

                                     
                                            
    if (versionType === "set") {
        const newVersion = argv._[1];
        if (!newVersion) {
            console.error(chalk.red("❌ 错误: 请指定版本号，例如: pnpm version:set -- 2.1.0"));
            process.exit(1);
        }
        await $`npm version ${newVersion} --no-git-tag-version`;
    } else {
        await $`npm version ${versionType} --no-git-tag-version`;
    }

                 
    const updatedPkg = await fs.readJSON(pkgPath);
    const newVersion = updatedPkg.version;

    console.log(chalk.green(`✅ package.json 版本已更新: ${oldVersion} -> ${newVersion}\n`));

              
    console.log(chalk.blue(`📦 开始同步版本号到其他文件...\n`));
    await $`zx src/scripts/sync-version.mjs`;

    console.log(chalk.green.bold(`\n✨ 版本更新完成！新版本: ${newVersion}\n`));
    console.log(chalk.gray(`提示: 别忘了更新 CHANGELOG.md 并提交更改\n`));

} catch (err) {
    console.error(chalk.red("\n❌ 版本更新失败:"));
    console.error(err.message);
    process.exit(1);
}
