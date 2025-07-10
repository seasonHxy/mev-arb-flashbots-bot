import { ethers } from "ethers";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";
import { abi as IUniswapV2RouterABI } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import dotenv from "dotenv";

dotenv.config();

const ALCHEMY_HTTPS_URL = process.env.ALCHEMY_HTTPS_URL!;
const FLASHBOTS_RELAY = "https://relay.flashbots.net";
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

const ROUTER_ADDRESS = "0xYourUniswapRouterAddress";
const TOKEN_IN = "0xC02aaA39b223FE8D0a0e5C4F27eAD9083C756Cc2";
const TOKEN_OUT = "0xYourMemecoinAddress";
const RECEIVER = "0x000000000000000000000000000000000000dead";

const main = async () => {
  const provider = new ethers.providers.JsonRpcProvider(ALCHEMY_HTTPS_URL);
  const authSigner = ethers.Wallet.createRandom();
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  const flashbots = await FlashbotsBundleProvider.create(provider, authSigner, FLASHBOTS_RELAY);

  const router = new ethers.Contract(ROUTER_ADDRESS, IUniswapV2RouterABI, wallet);
  const path = [TOKEN_IN, TOKEN_OUT];
  const amountIn = ethers.utils.parseEther("1");
  const deadline = Math.floor(Date.now() / 1000 + 60 * 10);

  const tx = await router.populateTransaction.swapExactTokensForTokens(
    amountIn,
    0,
    path,
    RECEIVER,
    deadline
  );

  const blockNumber = await provider.getBlockNumber();

  const signedBundle = await flashbots.signBundle([
    {
      signer: wallet,
      transaction: {
        ...tx,
        gasLimit: 250_000,
        maxFeePerGas: ethers.utils.parseUnits("40", "gwei"),
        maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei"),
        chainId: 1,
        type: 2
      }
    }
  ]);

  const simulation = await flashbots.simulate(signedBundle, blockNumber + 1);
  if (simulation.firstRevert) {
    console.error("❌ Simulation failed:", simulation.firstRevert.error);
    return;
  }

  console.log("✅ Simulation OK, sending to Flashbots");
  const bundleResponse = await flashbots.sendRawBundle(signedBundle, blockNumber + 1);

  if (bundleResponse.error) {
    console.error("🚫 Bundle failed:", bundleResponse.error.message);
  } else {
    console.log("🚀 Bundle sent for block", blockNumber + 1);
  }
};

main().catch(console.error);
