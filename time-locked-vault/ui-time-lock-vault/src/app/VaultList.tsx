"use client";

import { useEffect, useState } from "react";
import type { Abi, PublicClient, WalletClient, Address } from "viem";
import { decodeErrorResult } from "viem";
import { celoAlfajores } from "viem/chains";
import {
  FACTORY_ADDRESS,
  fornoClient, // usamos este client para lecturas/estimaciones
  CUSD_ADDRESS,
} from "../lib/viem";
import { vaultAbi } from "../lib/vaultAbi";

type Vault = {
  id: bigint;
  creator: string;
  token: string;
  amount: bigint;
  unlockTime: bigint;
  withdrawn: boolean;
};

type Props = {
  account?: Address;
  walletClient: WalletClient | null;
  publicClient: PublicClient; // sigue en Props por compatibilidad, pero no lo usamos aquí
  refreshKey?: number;
  onRefresh?: () => void;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function VaultList({
  account,
  walletClient,
  refreshKey = 0,
  onRefresh,
}: Props) {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<bigint | null>(null);
  const [error, setError] = useState<Record<string, string>>({});

  /** Levanta todas las bóvedas del usuario */
  useEffect(() => {
    if (!account) {
      setVaults([]);
      return;
    }
    setLoading(true);

    fornoClient
      .readContract({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi: vaultAbi as Abi,
        functionName: "userVaultsLength",
        args: [account],
      })
      .then(async (len) => {
        const length = len as bigint;
        if (length === BigInt(0)) {
          setVaults([]);
          return;
        }

        // 1) IDs
        const ids = await Promise.all(
          Array.from(
            { length: Number(length) },
            (_, i) =>
              fornoClient.readContract({
                chain: celoAlfajores,
                address: FACTORY_ADDRESS,
                abi: vaultAbi as Abi,
                functionName: "userVaults",
                args: [account, BigInt(i)],
              }) as Promise<bigint>,
          ),
        );

        // 2) Datos de cada vault
        const data = await Promise.all(
          ids.map((vaultId) =>
            fornoClient
              .readContract({
                chain: celoAlfajores,
                address: FACTORY_ADDRESS,
                abi: vaultAbi as Abi,
                functionName: "vaults",
                args: [vaultId],
              })
              .then((v: any) => {
                const [creator, token, amount, unlockTime, withdrawn] = v;
                return {
                  id: vaultId,
                  creator,
                  token,
                  amount,
                  unlockTime,
                  withdrawn,
                } as Vault;
              }),
          ),
        );

        setVaults(data);
      })
      .catch((err) => {
        console.error("Error al leer bóvedas:", err);
        setVaults([]);
      })
      .finally(() => setLoading(false));
  }, [account, refreshKey]);

  /** Retira TODO de una bóveda (con gas/gasPrice explícitos estilo cast) */
  async function withdrawVault(id: bigint) {
    if (!walletClient || !account) return;
    const vault = vaults.find((v) => v.id === id);
    if (!vault) return;

    const isOwner = vault.creator.toLowerCase() === account.toLowerCase();
    const unlocked = Number(vault.unlockTime) * 1000 <= Date.now();
    if (!isOwner) {
      alert("Solo el creador puede retirar esta bóveda.");
      return;
    }
    if (!unlocked) {
      alert("Aún no ha llegado el tiempo de desbloqueo.");
      return;
    }

    setWithdrawingId(id);
    setError((e) => ({ ...e, [id.toString()]: "" }));

    try {
      // Asegura red correcta
      const chainId = await walletClient.getChainId();
      if (chainId !== celoAlfajores.id) {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${celoAlfajores.id.toString(16)}` }],
        });
      }

      // --- Paso 1: dry-run (capturar revert reason)
      const raw = await fornoClient.call({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi: vaultAbi as Abi,
        functionName: "withdraw",
        args: [id],
        account,
        strict: false,
      });

      if (typeof raw === "string" && raw !== "0x") {
        try {
          const { args } = decodeErrorResult({
            abi: vaultAbi as Abi,
            data: raw,
          });
          const reason = String(args?.[0] || "Revert sin razón");
          setError((e) => ({ ...e, [id.toString()]: reason }));
          alert("No se pudo retirar:\n" + reason);
        } catch {
          setError((e) => ({
            ...e,
            [id.toString()]: "Revertido (sin razón legible)",
          }));
          alert("No se pudo retirar la bóveda.");
        }
        setWithdrawingId(null);
        return;
      }

      // --- Paso 2: estimar gas y gasPrice con el mismo RPC (Forno)
      const gas = await fornoClient.estimateContractGas({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi: vaultAbi as Abi,
        functionName: "withdraw",
        args: [id],
        account,
      });

      // pequeño colchón (10%) por si el estado cambia entre estimate y envío
      const gasWithBuffer = (gas * 110n) / 100n;

      const gasPrice = await fornoClient.getGasPrice();

      // --- Paso 3: enviar tx firmada por la cuenta conectada
      const txHash = await walletClient.writeContract({
        chain: celoAlfajores,
        address: FACTORY_ADDRESS,
        abi: vaultAbi as Abi,
        functionName: "withdraw",
        args: [id],
        account,
        gas: gasWithBuffer,
        gasPrice, // Celo usa legacy; esto replica el behavior de `cast send`
      });

      console.log("✅ Tx enviada:", txHash);
      onRefresh?.();
    } catch (err: any) {
      console.error("Error inesperado al retirar:", err);
      const msg =
        err?.shortMessage ||
        err?.cause?.shortMessage ||
        err?.message ||
        "Unknown error";
      setError((e) => ({ ...e, [id.toString()]: String(msg) }));
      alert("No se pudo retirar la bóveda:\n" + msg);
    } finally {
      setWithdrawingId(null);
    }
  }

  if (!account) {
    return (
      <p className="text-gray-600">Conecta tu wallet para ver tus bóvedas.</p>
    );
  }
  if (loading) {
    return <p className="text-gray-600">Cargando bóvedas…</p>;
  }
  if (vaults.length === 0) {
    return <p className="text-gray-600">No se encontraron bóvedas.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-lg text-blue-900">Mis Bóvedas</h2>
      {vaults.map((v) => {
        const isNative =
          (v.token || ZERO_ADDRESS).toLowerCase() === ZERO_ADDRESS;
        const isCusd =
          (v.token || "").toLowerCase() === (CUSD_ADDRESS || "").toLowerCase();
        const unlocked = Number(v.unlockTime) * 1000 <= Date.now();
        const key = v.id.toString();

        return (
          <div
            key={key}
            className="p-4 bg-white rounded-lg shadow-sm text-black"
          >
            <p>
              <strong>ID:</strong> {key}
            </p>
            <p>
              <strong>Token:</strong>{" "}
              {isNative ? "CELO" : isCusd ? "cUSD" : v.token}
            </p>
            <p>
              <strong>Monto:</strong> {format18(v.amount)}
            </p>
            <p>
              <strong>Desbloqueo:</strong>{" "}
              {new Date(Number(v.unlockTime) * 1000).toLocaleString()}
            </p>
            <p>
              <strong>Retirado:</strong> {v.withdrawn ? "Sí" : "No"}
            </p>

            {!v.withdrawn && unlocked && isOwner(v.creator, account) && (
              <button
                onClick={() => withdrawVault(v.id)}
                disabled={withdrawingId === v.id}
                className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {withdrawingId === v.id ? "Retirando…" : "Retirar todo"}
              </button>
            )}

            {error[key] && (
              <p className="text-red-600 mt-2 whitespace-pre-wrap">
                Error: {error[key]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Helpers */
function isOwner(creator: string, account: Address) {
  return creator.toLowerCase() === account.toLowerCase();
}

function format18(v: bigint) {
  const s = v.toString().padStart(19, "0");
  const int = s.slice(0, -18).replace(/^0+/, "") || "0";
  const fracRaw = s.slice(-18).replace(/0+$/, "");
  const frac = fracRaw.length ? `.${fracRaw.slice(0, 6)}` : "";
  return `${int}${frac}`;
}
