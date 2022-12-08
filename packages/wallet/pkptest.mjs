import { PKPWallet } from "ethers";
import { ethers } from "ethers";
import { pkpNft } from './pkp-nft.mjs';

/** ========== Configuration ========== */
const ADDRESS = '0x5B8A8d043f2235a29E4b063c20299050931832Dc';
const PKP_PUBKEY =
  '0x0439e24fbe3332dd2abe3073f663a58fc74674095e5834ebbe7a86fd52f1cbe54b8268d6426fbd66a6979d787b6848b750f3a64a6354da4616f93a3031f3d44e95';
const CONTROLLER_AUTHSIG = {"sig":"0x8c4b3b2a2f8f0b33ad8092719a604e94ffd2d938c115741e7155cdea3653fca75285ed2499ec1c6f60ab4b1e5e9fab2d4e6cf36abf32fe515d67de152736dfcd1b","derivedVia":"web3.eth.personal.sign","signedMessage":"localhost:3000 wants you to sign in with your Ethereum account:\n0x5B8A8d043f2235a29E4b063c20299050931832Dc\n\n\nURI: http://localhost:3000/\nVersion: 1\nChain ID: 80001\nNonce: McW3494o8EuALAzJn\nIssued At: 2022-12-06T18:09:09.646Z\nExpiration Time: 2022-12-13T18:09:09.644Z","address":"0x5B8A8d043f2235a29E4b063c20299050931832Dc"}

// -- TEST
const AMOUNT = 0; // 1 wei

// ----- Main -----
const pkpWallet = new PKPWallet({
    pkpPubKey: PKP_PUBKEY,
    controllerAuthSig: CONTROLLER_AUTHSIG,
    provider: "https://rpc-mumbai.maticvigil.com",
});

await pkpWallet.init();

// --- Test signTransaction and sendTransaction
const tx = {
    to: ADDRESS,
    value: AMOUNT, // 1 wei
    // value: ethers.utils.parseEther("0.000000000000000001"), // 1 wei
};

// const signedTx = await pkpWallet.signTransaction(tx);
// console.log('signedTx:', signedTx);

// const sentTx = await pkpWallet.sendTransaction(signedTx);
// console.log("sentTx:", sentTx);

// --- Test signMessage
const msg = "Secret Message.. shh!";
const signedMsg = await pkpWallet.signMessage(msg);
console.log('signedMsg:', signedMsg);

const signMsgAddr = ethers.utils.verifyMessage(msg, signedMsg);
console.log('Signed message verified?', signMsgAddr.toLowerCase() === (await pkpWallet.getAddress()).toLowerCase());

// --- Test _signTypedData for V3
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

// --- Test _signTypedData for V4
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

// -- contract call
const pkpSigner = pkpWallet;
const pkpProvider = pkpWallet.rpcProvider;

const contract = new ethers.Contract(pkpNft.address, pkpNft.abi, pkpSigner);

const tx2 = await contract.populateTransaction.mintNext(2, { value: 100000000000000 } );
console.log("tx2:", tx2);

const signedTx = await pkpSigner.signTransaction(tx2);
console.log("signedTx:", signedTx);

const sentTx = await pkpWallet.sendTransaction(signedTx);
console.log("sentTx:", sentTx);