import { sepolia } from "viem/chains"

export function getChain(chain: string) {
	switch (chain) {
	case "sepolia":
		return sepolia
	default:
		throw new Error(`Unsupported chain ${chain}`)
	}
}