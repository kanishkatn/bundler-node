import { sepolia } from "viem/chains"

/**
 * Gets the chain object.
 * @param chain The chain.
 * @returns The chain object.
 */
export function getChain(chain: string) {
	switch (chain) {
	case "sepolia":
		return sepolia
	default:
		throw new Error(`Unsupported chain ${chain}`)
	}
}