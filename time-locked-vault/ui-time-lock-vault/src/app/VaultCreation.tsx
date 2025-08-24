// src/app/VaultCreation.tsx
"use client";

import { useState } from "react";
import { parseEther } from "viem";
import type { Abi, WalletClient, PublicClient } from "viem";
import { celoAlfajores } from "viem/chains";
import abiJson from "../../abi/TimeLockVaultFactory.json";
import { publicClient as defaultPublicClient } from "../lib/viem";
import { walletClient } from "../lib/viem";

const abi = abiJson.abi as Abi;
const FACTORY_ADDRESS = "0x6Dcbd404e62151Bea13e3670b231F5846AB1dA97";

type Props = {
  account?: string;
  walletClient: WalletClient | null;
  publicClient?: PublicClient;
  balance: string;
  onRefresh?: () => void;
};

export default function VaultCreation({
  account,
  walletClient,
  publicClient = defaultPublicClient,
  balance,
  onRefresh,
}: Props) {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function createVault() {
    if (!walletClient || !account) return;

    if (!amount || !duration) {
      alert("Debes ingresar monto y duración");
      return;
    }
    if (parseFloat(amount) > parseFloat(balance)) {
      alert("No tienes suficiente CELO");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Forzar red Alfajores
      const chainId = await walletClient.getChainId();
      if (chainId !== celoAlfajores.id) {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${celoAlfajores.id.toString(16)}` }],
        });
      }

      // 2. Parseo
      const parsedAmount = parseEther(amount);
      const parsedDuration = BigInt(duration);
      const nowTs = BigInt(Math.floor(Date.now() / 1000));
      const unlockTime = nowTs + parsedDuration;

      console.log("parsedAmount:", parsedAmount.toString());
      console.log("parsedDuration:", parsedDuration.toString(), "seconds");
      console.log("unlockTime:", unlockTime.toString());

      // 3. Simular
      const { request } = await publicClient.simulateContract({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi,
        functionName: "createVaultCelo",
        args: [unlockTime],
        account,
        value: parsedAmount,
      });

      // 4. Gas price y envío de tx
      const gasPrice = await publicClient.getGasPrice();
      const { hash } = await walletClient.writeContract({
        ...request,
        chain: celoAlfajores,
        gasPrice,
      });

      setTxHash(hash);
      onRefresh?.();
    } catch (error: any) {
      console.error("Error al crear bóveda:", error);
      const raw =
        error?.cause?.data?.message ||
        error?.shortMessage ||
        error?.message ||
        "Unknown error";
      alert("Revert/Fail: " + raw);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Inputs de monto y duración */}
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-lg text-blue-900 font-bold">
          Monto (CELO):
        </label>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ej. 1.5"
          className="px-3 py-2 border rounded-md text-lg text-blue-900"
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-lg text-blue-900 font-bold">
          Duración (segundos):
        </label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Ej. 60"
          className="px-3 py-2 border rounded-md text-lg text-blue-900"
        />
      </div>

      {/* Botón para crear bóveda */}
      <button
        onClick={createVault}
        disabled={isLoading}
        className={`w-full px-4 py-2 text-white rounded-md ${
          isLoading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isLoading ? "Creando bóveda..." : "Crear bóveda"}
      </button>

      {/* Feedback de transacción */}
      {txHash && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 font-medium">
            Transacción enviada
          </p>
          <p className="text-xs text-yellow-600 font-mono break-all">
            {txHash}
          </p>
        </div>
      )}
    </div>
  );
}
