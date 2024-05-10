import { createPublicClient, PublicClient, http, Hex, TransactionReceipt, Address } from "viem"
import { sepolia } from "viem/chains"

export class RPCHelper {
	private PublicClient: PublicClient

	constructor() {
		this.PublicClient = createPublicClient({
			chain: sepolia,
			transport: http()
		})
	}

	public async getTransactionCount(address: Address): Promise<number> {
		try {
			const count = await this.PublicClient.getTransactionCount({address: address})
			return count
		} catch (error) {
			console.error(`Failed to get transaction count for address ${address}: ${error}`)
			throw Error("Failed to get transaction count")
		}
	}

	public async getTransactionReceipt(hash: Hex): Promise<TransactionReceipt> {
		try {
			const receipt = await this.PublicClient.getTransactionReceipt({hash: hash})
			return receipt
		} catch (error) {
			console.error(`Failed to get transaction receipt for hash ${hash}: ${error}`)
			throw Error("Failed to get transaction receipt")
		}
	}
}