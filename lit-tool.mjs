import { exit } from "process";
import { getArgs, ex, greenLog, createDirs } from "./utils.mjs";

const args = getArgs();

const OPTION = args[0];

if (!OPTION || OPTION === '' || OPTION === '--help') {
    greenLog(`
    --reset: reset and rebuild
    `, true);
    exit();
}

if (OPTION === "--reset") {

    // ----- Cleaning up -----
    console.log(`==================== Clean up ====================\n`);

    // clean up everything
    greenLog("...removing package-lock.json");
    await ex(`rm -f package-lock.json`);

    greenLog("...removing yarn.lock");
    await ex(`rm -f yarn.lock`);

    greenLog("...clean all built files");
    await ex('yarn clean')

    greenLog("...deleting packages/wallet/node_modules");
    await ex(`rm -rf packages/wallet/node_modules`);

    greenLog("...deleting packages/wallet/yarn.lock");
    await ex(`rm -f packages/wallet/yarn.lock`);

    greenLog(`...using the original ethers/ethers.ts`);
    await ex(`cp packages/ethers/ethers.ts.original packages/ethers/src.ts/ethers.ts`);

    greenLog(`...using the original ethers/index.ts`);
    await ex(`cp packages/ethers/index.ts.original packages/ethers/src.ts/index.ts`);

    // ----- Backing up -----
    console.log(`==================== Back up ====================\n`);
    greenLog("...creating a recovery file for packages/wallet/index.ts");
    await ex(`cp packages/wallet/src.ts/index.ts packages/wallet/src.ts/index.ts.to-recover`);

    // get date time in format: 2021-09-01-12-00-00
    greenLog("...creating a backup and store it in index.baks folder");
    createDirs('packages/wallet/src.ts/index.baks');
    const date = new Date();
    const dateStr = date.toISOString().replace(/:/g, '-').replace(/\./g, '-').replace(/T/g, '-').replace(/Z/g, '');
    await ex(`cp packages/wallet/src.ts/index.ts packages/wallet/src.ts/index.baks/${dateStr}`);

    greenLog("...temporarily replace index.ts file with the original one");
    await ex(`cp packages/wallet/src.ts/index.original.ts packages/wallet/src.ts/index.ts`);

    greenLog("...temporarily replace wallet package.json with the original one");
    await ex(`cp packages/wallet/package.original.json packages/wallet/package.json`);
    
    // ----- Install & build -----
    console.log(`==================== Installation ====================\n`);
    greenLog("...installing dependencies from root");
    await ex('yarn')

    greenLog("...building all packages with original files");
    await ex('yarn build-all');

    // ----- Restoring files -----
    console.log(`==================== Restoration ====================\n`);
    greenLog("...restoring index.ts.to-recover to index.ts");
    await ex(`cp packages/wallet/src.ts/index.ts.to-recover packages/wallet/src.ts/index.ts`);
    await ex(`rm -f packages/wallet/src.ts/index.ts.to-recover`);

   
    greenLog("...building all packages with new index.ts");
    await ex('yarn build-all');
    
    greenLog("...restoring wallet package.json with package.current.json");
    await ex(`cp packages/wallet/package.current.json packages/wallet/package.json`);
    await ex(`cd packages/wallet && yarn`);

    greenLog(`...restoring to use ethers/ethers.ts.new`);
    await ex(`cp packages/ethers/ethers.ts.new packages/ethers/src.ts/ethers.ts`);

    greenLog(`...restoring to use ethers/index.ts.new`);
    await ex(`cp packages/ethers/index.ts.new packages/ethers/src.ts/index.ts`);

    greenLog(`...final rebuild`);
    await ex('yarn build-all')

    greenLog(`
        OK, now you can run the following commands:
            - node packages/wallet/pkptest.mjs
            - yarn auto-build

        RECOMMENDED: to run the above commands in separate terminals, while having
                     pkptest.mjs opened on one tab, and index.ts opened on another tab.
    `, true)

    exit();

}

exit();