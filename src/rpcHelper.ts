import { PublicClient, Hex, TransactionReceipt, Address } from "viem"
import { NetworkError } from "./types/errors.types"

/**
 * RPCHelper provides helper functions for interacting with the RPC.
 */
export class RPCHelper {
	private PublicClient: PublicClient

	constructor(publicClient: PublicClient) {
		this.PublicClient = publicClient
	}

	/**
	 * Gets the transaction count for an address.
	 * @param address The address.
	 * @returns A promise that resolves to the transaction count.
	 */
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

	/**
	 * Gets the transaction receipt for a transaction hash.
	 * @param hash The transaction hash.
	 * @returns A promise that resolves to the transaction receipt.
	 */
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