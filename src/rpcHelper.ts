import { createPublicClient, PublicClient, http, Hex, TransactionReceipt, Address } from "viem"
import { NetworkError } from "./types/errors.types"
import { getChain } from "./types/chain.types"

export class RPCHelper {
	private PublicClient: PublicClient

	constructor(chain: string) {
		this.PublicClient = createPublicClient({
			chain: getChain(chain),
			transport: http()
		})
	}

	public async getTransactionCount(address: Address): Promise<number> {
		try {
			const count = await this.PublicClient.getTransactionCount({address: address})
			return count
		} catch (error) {
			// viem.sh encapsulates the stack trace in the error message
			// here we print the complete error message and throw only the first line
			console.error(`Failed to get transaction count for address ${address}: ${error}`)
			const errorMessage = (error as Error).message.split("\n")[0]
			throw new NetworkError(`Failed to get transaction count: ${errorMessage}`)
		}
	}

	public async getTransactionReceipt(hash: Hex): Promise<TransactionReceipt> {
		try {
			const receipt = await this.PublicClient.getTransactionReceipt({hash: hash})
			return receipt
		} catch (error) {
			// viem.sh encapsulates the stack trace in the error message
			// here we print the complete error message and throw only the first line
			console.error(`Failed to get transaction receipt for hash ${hash}: ${error}`)
			const errorMessage = (error as Error).message.split("\n")[0]
			throw new NetworkError(`Failed to get transaction receipt: ${errorMessage}`)
		}
	}
}