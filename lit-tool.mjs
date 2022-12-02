import { exit } from "process";
import { getArgs, ex, greenLog, createDirs } from "./utils.mjs";

const args = getArgs();

const OPTION = args[0];

if( ! OPTION || OPTION === '' || OPTION === '--help'){
    greenLog(`
    --reset: reset and rebuild
    `, true);
    exit();
}

if (OPTION === "--reset") {
    // clean up everything
    greenLog("...Removing yarn.lock");
    await ex(`rm -f package-lock.json`);
    await ex(`rm -f yarn.lock`);
    
    greenLog("...clean all built files");
    await ex('yarn clean')
    
    greenLog("...Deleting packages/wallet/node_modules");
    await ex(`rm -rf packages/wallet/node_modules`);
    await ex(`rm -f packages/wallet/yarn.lock`);

    await ex(`rm -rf packages/ethers/dist`)
    await ex(`cp -r packages/ethers/dist.bak packages/ethers/dist`);

    greenLog("...resetting packages/wallet/index.ts");
    await ex(`cp packages/wallet/src.ts/index.ts packages/wallet/src.ts/index.ts.to-recover`);

    // get date time in format: 2021-09-01-12-00-00
    createDirs('packages/wallet/src.ts/index.baks');
    const date = new Date();
    const dateStr = date.toISOString().replace(/:/g, '-').replace(/\./g, '-').replace(/T/g, '-').replace(/Z/g, '');
    await ex(`cp packages/wallet/src.ts/index.ts packages/wallet/src.ts/index.baks/index.ts.${dateStr}`);

    await ex(`cp packages/wallet/src.ts/index.ts.bak packages/wallet/src.ts/index.ts`);
    
    greenLog("...Installing dependencies from root");
    await ex('yarn')

    greenLog("...building all packages");
    await ex('yarn build-all');

    greenLog("...retoring index.ts.to-recover");
    await ex(`cp packages/wallet/src.ts/index.ts.to-recover packages/wallet/src.ts/index.ts`);
    await ex(`rm -f packages/wallet/src.ts/index.ts.to-recover`);

    greenLog("...building all packages with new index.ts");
    await ex('yarn build-all');

    greenLog("...building wallet package");
    await ex('cd packages/wallet && yarn add lit-js-sdk@1.2.24');
    await ex('cd packages/wallet && yarn add multiformats@10.0.2');
    await ex('cd packages/wallet && tsc --build ./tsconfig.json')
}


exit();