import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { providers } from "ethers";

let web3Modal;

function init() {
  if (typeof window === "undefined") return;
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc: {
            1: process.env.REACT_APP_RPC_URL,
            1337: process.env.REACT_APP_RPC_URL // localhost
          }
        }
      }
    }
  });
}

export async function connect() {
  try {
    if (!web3Modal) init();
    const instance = await web3Modal.connect();
    const provider = new providers.Web3Provider(instance);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address, instance };
  } catch (err) {
    console.error("connect error", err);
    throw err;
  }
}

export async function getReadOnlyProvider() {
  return new providers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
}

export function clearCachedProvider() {
  if (web3Modal) web3Modal.clearCachedProvider();
}



