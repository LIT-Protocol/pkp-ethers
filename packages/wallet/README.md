# PKP Wallet Signer

## Install

### Browser

https://www.npmjs.com/package/@lit-protocol/pkp-ethers.js

```javascript
yarn add @lit-protocol/pkp-ethers.js ethers
```

### NodeJS

https://www.npmjs.com/package/@lit-protocol/pkp-ethers.js-node

```javascript
yarn add @lit-protocol/pkp-ethers.js-node ethers
```

## Then

```js
import { PKPWallet } from "@lit-protocol/pkp-ethers.js";

const PKP_PUBKEY = "{YOUR PKP UNCOMPRESSED PUBLIC KEY}";

const CONTROLLER_AUTHSIG = await LitJsSdk.checkAndSignAuthMessage({
  chain: "mumbai",
});

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
console.log("signedTx:", signedTx);

// -- Send Transaction
const sentTx = await pkpWallet.sendTransaction(signedTx);
console.log("sentTx:", sentTx);

// -- Sign Message
const signedMsg = await pkpWallet.signMessage("Secret Message.. shh!");
console.log("signedMsg:", signedMsg);

// -- Verify Signed Messaage
const signMsgAddr = ethers.utils.verifyMessage(msg, signedMsg);

// --- (V3) Sign Typed Data
// Example from https://github.com/MetaMask/test-dapp/blob/main/src/index.js#L1033
const msgParamsV3 = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 80001,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
};
const { types: typesV3, domain: domainV3, primaryType: primaryTypeV3, message: messageV3 } = msgParamsV3;

// Remove EIP712Domain from types as recommended in https://github.com/ethers-io/ethers.js/issues/687
if (typesV3.EIP712Domain) {
  delete typesV3.EIP712Domain;
}

const signedTypedDataV3 = await pkpWallet._signTypedData(domainV3, typesV3, messageV3);
const signTypedDataV3Addr = ethers.utils.verifyTypedData(domainV3, typesV3, messageV3, signedTypedDataV3);
console.log('Signed typed data V3 verified?', signTypedDataV3Addr.toLowerCase() === (await pkpWallet.getAddress()).toLowerCase());

// -- (V4) Sign Typed Data
// Example from https://github.com/MetaMask/test-dapp/blob/main/src/index.js#L1155
const msgParamsV4 = {
  domain: {
    chainId: 80001,
    name: 'Ether Mail',
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    version: '1',
  },
  message: {
    contents: 'Hello, Bob!',
    from: {
      name: 'Cow',
      wallets: [
        '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
        '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
      ],
    },
    to: [
      {
        name: 'Bob',
        wallets: [
          '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
          '0xB0B0b0b0b0b0B000000000000000000000000000',
        ],
      },
    ],
  },
  primaryType: 'Mail',
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person[]' },
      { name: 'contents', type: 'string' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallets', type: 'address[]' },
    ],
  },
};
const { types: typesV4, domain: domainV4, primaryType: primaryTypeV4, message: messageV4 } = msgParamsV4;

// Remove EIP712Domain from types as recommended in https://github.com/ethers-io/ethers.js/issues/687
if (typesV4.EIP712Domain) {
  delete typesV4.EIP712Domain;
}

const signedTypedDataV4 = await pkpWallet._signTypedData(domainV4, typesV4, messageV4);

const signTypedDataV4Addr = ethers.utils.verifyTypedData(domainV4, typesV4, messageV4, signedTypedDataV4);

console.log('Signed typed data V4 verified?', signTypedDataV4Addr.toLowerCase() === (await pkpWallet.getAddress()).toLowerCase());

```
