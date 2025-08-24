"use client";

import { useState, useEffect } from "react";
import VaultCreation from "./VaultCreation";
import VaultList from "./VaultList";
import { publicClient } from "../lib/viem";
import { createWalletClient, custom } from "viem";
import { celoAlfajores } from "viem/chains";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [walletClient, setWalletClient] = useState<any>(null);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0.0000");

  // Nuevo: clave para revalidar hijos cuando cambie
  const [refreshKey, setRefreshKey] = useState(0);

  // Inicializa walletClient en cliente
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const wc = createWalletClient({
        chain: celoAlfajores,
        transport: custom((window as any).ethereum),
      });
      setWalletClient(wc);
    }
    setIsClient(true);
  }, []);

  // Conecta MetaMask, pide cuentas y lee balance
  async function onConnect() {
    if (!walletClient) {
      alert("Instala MetaMask u otra wallet compatible");
      return;
    }
    try {
      const [addr] = (await walletClient.request({
        method: "eth_requestAccounts",
        params: [],
      })) as string[];
      setAccount(addr);

      const balWei = await publicClient.getBalance({ address: addr });
      const bal = Number(balWei) / 1e18;
      setBalance(bal.toFixed(4));
      // Disparamos también un refresh inicial
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error("Error conectando wallet:", err);
    }
  }

  // Polling: cada 15s vuelve a leer balance y dispara refreshKey
  useEffect(() => {
    if (!account) return;
    const interval = setInterval(async () => {
      try {
        const balWei = await publicClient.getBalance({ address: account });
        const bal = Number(balWei) / 1e18;
        setBalance(bal.toFixed(4));
        setRefreshKey((k) => k + 1);
      } catch (err) {
        console.error("Error refrescando balance:", err);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [account]);

  // Mientras no se hidrate
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando DApp…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">
          Wallet Web3
        </h1>

        <button
          onClick={onConnect}
          disabled={!!account}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {account ? "Wallet Conectada" : "Conectar Wallet"}
        </button>

        {account && (
          <>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-mono break-all">
                {account}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-lg text-blue-900 font-bold">{balance} CELO</p>
            </div>
          </>
        )}

        <VaultCreation
          account={account}
          walletClient={walletClient}
          publicClient={publicClient}
          balance={balance}
          // Para que VaultCreation dispare revalidación tras tx
          onRefresh={() => setRefreshKey((k) => k + 1)}
        />
        <VaultList
          account={account}
          walletClient={walletClient}
          publicClient={publicClient}
          // Para que VaultList re-efectúe fetch al cambiar refreshKey
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
}
