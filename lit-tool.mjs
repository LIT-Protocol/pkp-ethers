import { exit } from "process";
import { getArgs, greenLog, createDirs, childRunCommand, readJsonFile, writeFile, readFile, isLineCommented, redLog, spawnListener } from "./utils.mjs";

const args = getArgs();

const OPTION = args[0];

if (!OPTION || OPTION === '' || OPTION === '--help') {
    greenLog(`
    Usage: node lit-tool.mjs [OPTION]

        --help: show this help
        --reset: reset and rebuild
        --publish: public packages/wallet to npm
        --dev: run dev mode
    `, true);
    exit();
}

const config = await readJsonFile('packages/wallet/pub.config.json');

if (OPTION === "--reset") {

    // ----- Cleaning up -----
    console.log(`==================== Clean up ====================\n`);

    // clean up everything
    greenLog("...removing package-lock.json");
    await childRunCommand(`rm -f package-lock.json`);

    greenLog("...removing yarn.lock");
    await childRunCommand(`rm -f yarn.lock`);

    greenLog("...clean all built files");
    await childRunCommand('yarn clean')

    greenLog("...deleting packages/wallet/node_modules");
    await childRunCommand(`rm -rf packages/wallet/node_modules`);

    greenLog("...deleting packages/wallet/yarn.lock");
    await childRunCommand(`rm -f packages/wallet/yarn.lock`);

    greenLog(`...using the original ethers/ethers.ts`);
    await childRunCommand(`cp packages/ethers/ethers.ts.original packages/ethers/src.ts/ethers.ts`);

    greenLog(`...using the original ethers/index.ts`);
    await childRunCommand(`cp packages/ethers/index.ts.original packages/ethers/src.ts/index.ts`);

    // ----- Backing up -----
    console.log(`==================== Back up ====================\n`);
    greenLog("...creating a recovery file for packages/wallet/index.ts");
    await childRunCommand(`cp packages/wallet/src.ts/index.ts packages/wallet/src.ts/index.ts.to-recover`);

    // get date time in format: 2021-09-01-12-00-00
    greenLog("...creating a backup and store it in index.baks folder");
    createDirs('packages/wallet/src.ts/index.baks');
    const date = new Date();
    const dateStr = date.toISOString().replace(/:/g, '-').replace(/\./g, '-').replace(/T/g, '-').replace(/Z/g, '');
    await childRunCommand(`cp packages/wallet/src.ts/index.ts packages/wallet/src.ts/index.baks/${dateStr}`);

    greenLog("...temporarily replace index.ts file with the original one");
    await childRunCommand(`cp packages/wallet/src.ts/index.original.ts packages/wallet/src.ts/index.ts`);

    greenLog("...temporarily replace wallet package.json with the original one");
    await childRunCommand(`cp packages/wallet/package.original.json packages/wallet/package.json`);

    // ----- Install & build -----
    console.log(`==================== Installation ====================\n`);
    greenLog("...installing dependencies from root");
    await childRunCommand('yarn')

    greenLog("...building all packages with original files");
    await childRunCommand('yarn build-all');

    // ----- Restoring files -----
    console.log(`==================== Restoration ====================\n`);
    greenLog("...restoring index.ts.to-recover to index.ts");
    await childRunCommand(`cp packages/wallet/src.ts/index.ts.to-recover packages/wallet/src.ts/index.ts`);
    await childRunCommand(`rm -f packages/wallet/src.ts/index.ts.to-recover`);


    greenLog("...building all packages with new index.ts");
    await childRunCommand('yarn build-all');

    greenLog("...restoring wallet package.json with package.current.json");
    await childRunCommand(`cp packages/wallet/package.current.json packages/wallet/package.json`);
    await childRunCommand(`cd packages/wallet && yarn`);

    greenLog(`...restoring to use ethers/ethers.ts.new`);
    await childRunCommand(`cp packages/ethers/ethers.ts.new packages/ethers/src.ts/ethers.ts`);

    greenLog(`...restoring to use ethers/index.ts.new`);
    await childRunCommand(`cp packages/ethers/index.ts.new packages/ethers/src.ts/index.ts`);

    greenLog(`...final rebuild`);
    await childRunCommand('yarn build-all')

    greenLog(`
        OK, now you can run the following commands:
            - node packages/wallet/pkptest.mjs
            - yarn auto-build

        RECOMMENDED: to run the above commands in separate terminals, while having
                     pkptest.mjs opened on one tab, and index.ts opened on another tab.
    `, true)

    exit();

}

if (OPTION === '--publish') {
    const json = await readJsonFile('packages/wallet/package.json');

    // -- edit json based on config --
    config.delete.forEach((key) => {
        delete json[key];
    });
    json.keywords = config.keywords;
    json.description = config.description;
    json.author = config.author;

    // bump a patch version of json.version
    const version = json.version.split('.');
    version[2] = parseInt(version[2]) + 1;
    json.version = version.join('.');
    console.log(`New version: ${json.version}`);

    const indexTsPath = 'packages/wallet/src.ts/index.ts';
    // replace single quotes to double quotes
    const nodeImport = config.nodeImport.replaceAll("'", '"');
    const browserImport = config.browserImport.replaceAll("'", '"');

    async function writePackageJson(name) {
        json.name = name;
        // -- write json to file --
        await writeFile('packages/wallet/package.json', JSON.stringify(json, null, 4));
        await childRunCommand('cd packages/wallet && tsc --build ./tsconfig.json');
    }

    async function getStates() {
        const indexTs = await readFile(indexTsPath);
        const nodeCommentedOut = isLineCommented({ file: indexTs, line: nodeImport });
        const browserCommentedOut = isLineCommented({ file: indexTs, line: browserImport });
        console.log("nodeCommentedOut: ", nodeCommentedOut);
        console.log("browserCommentedOut: ", browserCommentedOut);

        return { indexTs, nodeCommentedOut, browserCommentedOut }
    }

    async function publish() {
        try {
            await childRunCommand(`yarn build-all`);
        } catch (e) {
            redLog("Some error occured while building, continuing anyway...");
        }
        await childRunCommand(`cd packages/wallet && npm publish`);
    }

    async function commentOutBothLines() {
        greenLog(`
            Commenting out both imports: 
            ----------------------------
            // ${nodeImport}
            // ${browserImport}
        `, true);

        // -- first, comment out both import lines --
        const { indexTs, nodeCommentedOut, browserCommentedOut } = await getStates();

        let newIndexTs;

        if (!nodeCommentedOut) {
            newIndexTs = indexTs.replace(nodeImport, `// ${nodeImport}`);
        }

        if (!browserCommentedOut) {
            newIndexTs = indexTs.replace(browserImport, `// ${browserImport}`);
        }

        try {
            await writeFile(indexTsPath, newIndexTs);
        } catch (e) {
            greenLog("both imports are alreaedy commented out, continuing...");
        }
    }

    async function enableNodeImport() {
        greenLog(`
            Uncomment node import line to build for node:
            --------------------------------------------
        `, true);

        const { indexTs, nodeCommentedOut } = await getStates();

        let newIndexTs;

        if (nodeCommentedOut) {
            newIndexTs = indexTs.replace(`// ${nodeImport}`, nodeImport);
        }

        await writeFile(indexTsPath, newIndexTs);
    }

    async function enableBrowserImport() {
        greenLog(`
            Uncomment browser import line to build for browser:
            --------------------------------------------
        `, true);

        const { indexTs, browserCommentedOut } = await getStates();

        let newIndexTs;

        if (browserCommentedOut) {
            newIndexTs = indexTs.replace(`// ${browserImport}`, browserImport);
        }

        await writeFile(indexTsPath, newIndexTs);
    }

    await commentOutBothLines();
    await enableNodeImport();
    await writePackageJson(config.name.node);
    await publish();

    await commentOutBothLines();
    await enableBrowserImport();
    await writePackageJson(config.name.browser);
    await publish();


    // -- revert to original state --
    await commentOutBothLines();
    await enableNodeImport();
    await writePackageJson(config.name.node);

    greenLog("All done! :D");
}

if (OPTION === '--dev') {
    console.log("Running in dev mode...");
    childRunCommand('nodemon packages/wallet/pkptest.mjs');
}

// exit();