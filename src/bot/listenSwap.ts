import { ethers } from "ethers";
import dotenv from "dotenv";
import { abi as IUniswapV2PairABI } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { abi as IUniswapV2RouterABI } from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import { FlashbotsBundleProvider } from "@flashbots/ethers-provider-bundle";

dotenv.config();

const ALCHEMY_WSS = process.env.ALCHEMY_WSS_URL!;
const ALCHEMY_HTTPS_URL = process.env.ALCHEMY_HTTPS_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const FLASHBOTS_RELAY = "https://relay.flashbots.net";

const provider = new ethers.WebSocketProvider(ALCHEMY_WSS);
const httpProvider = new ethers.JsonRpcProvider(ALCHEMY_HTTPS_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, httpProvider);
const authSigner = ethers.Wallet.createRandom();

const PEPE_WETH_PAIR = "0xYourMemecoinPairAddress";
const ROUTER_ADDRESS = "0xYourUniswapRouterAddress";
const TOKEN_IN = "0xC02aaA39b223FE8D0a0e5C4F27eAD9083C756Cc2";
const TOKEN_OUT = "0xYourMemecoinAddress";
const RECEIVER = "0x000000000000000000000000000000000000dead";

const pairContract = new ethers.Contract(PEPE_WETH_PAIR, IUniswapV2PairABI, provider);
const routerContract = new ethers.Contract(ROUTER_ADDRESS, IUniswapV2RouterABI, provider);
const routerSigner = new ethers.Contract(ROUTER_ADDRESS, IUniswapV2RouterABI, wallet);
const amountIn = ethers.parseEther("1");

let flashbots: FlashbotsBundleProvider;
(async () => {
  flashbots = await FlashbotsBundleProvider.create(httpProvider, authSigner, FLASHBOTS_RELAY);
})();

pairContract.on("Swap", async (...args) => {
  const event = args[args.length - 1];
  console.log("🔔 Swap detected! Block:", event.blockNumber);

  try {
    const path = [TOKEN_IN, TOKEN_OUT];
    const amountsOut = await routerContract.getAmountsOut(amountIn, path);
    const amountOut = amountsOut[amountsOut.length - 1];

    const reversePath = [TOKEN_OUT, TOKEN_IN];
    const amountsBack = await routerContract.getAmountsOut(amountOut, reversePath);
    const finalAmountBack = amountsBack[amountsBack.length - 1];

    const profit = Number(ethers.formatEther(finalAmountBack)) - 1;
    if (profit > 0.001) {
      console.log("💰 Arbitrage Detected! Est. Profit:", profit.toFixed(6), "WETH");

      const deadline = Math.floor(Date.now() / 1000 + 60 * 10);
      const tx = await routerSigner.populateTransaction.swapExactTokensForTokens(
        amountIn,
        0,
        path,
        RECEIVER,
        deadline
      );

      const blockNumber = await httpProvider.getBlockNumber();
      const signedBundle = await flashbots.signBundle([
        {
          signer: wallet,
          transaction: {
            ...tx,
            gasLimit: 250_000,
            maxFeePerGas: ethers.parseUnits("40", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
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

      console.log("✅ Simulation passed, sending bundle to Flashbots...");
      const response = await flashbots.sendRawBundle(signedBundle, blockNumber + 1);
      if (response.error) {
        console.error("🚫 Bundle failed:", response.error.message);
      } else {
        console.log("🚀 Bundle submitted for block", blockNumber + 1);
      }
    } else {
      console.log("📉 No arbitrage: round-trip < 1 ETH");
    }
  } catch (e) {
    console.log("⚠️ Simulation error:", (e as Error).message);
  }
});
