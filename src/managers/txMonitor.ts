import EventEmitter from "events"
import { PublicClient, TransactionReceiptNotFoundError, TransactionReceipt, Hex } from "viem"

/**
 * TransactionMonitor monitors the status of a transaction.
 */
export class TransactionMonitor extends EventEmitter {
	private publicClient: PublicClient
	private txWaitTime: number

	/**
     * Creates an instance of TransactionMonitor.
     * @param publicClient The public client instance.
     * @param txWaitTime The time to wait for the transaction to be mined.
     * @returns A TransactionMonitor instance.
     */
	constructor(publicClient: PublicClient, txWaitTime: number) {
		super()
		this.publicClient = publicClient
		this.txWaitTime = txWaitTime
	}

	/**
     * Delays the execution of the function.
     * @param ms The delay in milliseconds.
     */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
     * Monitors the status of a transaction.
     * @param hash The hash of the transaction.
     * @emits TransactionMined The transaction has been mined.
     * @emits MonitoringError An error occurred while monitoring the transaction.
     * @emits TransactionTimedout The transaction timed out.
     */
	public async monitorTransaction(hash: Hex) {
		const startTime = Date.now()
		while (Date.now() - startTime < this.txWaitTime) {
			try {
				const receipt: TransactionReceipt | null = await this.publicClient.getTransactionReceipt({ hash })
				if (receipt) {
					this.emit("TransactionMined", hash, receipt)
					return
				}
			} catch (error: unknown) {
				if (!(error instanceof TransactionReceiptNotFoundError)) {
					this.emit("MonitoringError", hash, error)
					return
				}
				await this.delay(10000)
			}
		}
		this.emit("TransactionTimedout", hash)
	}
}