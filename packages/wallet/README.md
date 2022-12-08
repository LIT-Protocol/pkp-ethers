# PKP Wallet Signer

## Install

```javascript
// Environments:
// [Browser]
yarn add @lit-protocol/pkp-ethers.js ethers

// [Node]
yarn add @lit-protocol/pkp-ethers.js-node ethers
```

## Then

```js
import { PKPWallet } from '@lit-protocol/pkp-ethers.js';

const PKP_PUBKEY = '{YOUR PKP UNCOMPRESSED PUBLIC KEY}';

const CONTROLLER_AUTHSIG = await LitJsSdk.checkAndSignAuthMessage({ chain: 'mumbai' });

const pkpWallet = new PKPWallet({
    pkpPubKey: PKP_PUBKEY,
    controllerAuthSig: CONTROLLER_AUTHSIG,
    provider: "https://rpc-mumbai.maticvigil.com",
});

await pkpWallet.init();

const tx = {
    to: "0x1cD4147AF045AdCADe6eAC4883b9310FD286d95a",
    value: 0,
};

// -- Sign Transaction
const signedTx = await pkpWallet.signTransaction(tx);
console.log('signedTx:', signedTx);

// -- Send Transaction
// const sentTx = await pkpWallet.sendTransaction(signedTx);
// console.log("sentTx:", sentTx);

// -- Sign Message
const signedMsg = await pkpWallet.signMessage("Secret Message.. shh!");
console.log('signedMsg:', signedMsg);