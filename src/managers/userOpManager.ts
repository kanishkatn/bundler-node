import EOAManager from "./eoaManager"
import { PrivateKeyAccount, Hex, PublicClient } from "viem"
import { UserOperation } from "../types/userop.types"
import { ERC4337EntryPoint } from "../entrypoint/entrypoint"
import {TransactionReceipt} from "viem/_types"
import { RPCHelper } from "../rpcHelper"
import { TimeoutError, TransactionFailedError } from "../types/errors.types"
import { TransactionMonitor } from "./txMonitor"

/**
 * Represents a transaction.
 * @property hash The transaction hash.
 * @property userOp The user operations.
 * @property eoa The EOA (Externally Owned Account) used to sign the transaction.
 * @property nonce The nonce of the EOA.
 * @property attempt The attempt number.
 */
interface Transaction {
	hash: Hex
	userOp: UserOperation[]
	eoa: PrivateKeyAccount
	nonce: number
	attempt: number
}

/**
 * UserOpManager manages the sending of user operations.
 * It acquires an EOA from the EOAManager, sends the user operation, and releases the EOA.
 * It also monitors the transaction status and retries if necessary.
 */
class UserOpManager {
	private eoaManager: EOAManager
	private entryPoint: ERC4337EntryPoint
	private eoaWaitTime: number
	private rpcHelper: RPCHelper
	private maxAttempts: number
	private monitor: TransactionMonitor
	private pendingTransactions = new Map<Hex, Transaction>()

	/**
	 * Creates an instance of UserOpManager.
	 * @param eoaManager The EOAManager instance.
	 * @param eoaWaitTime The time to wait for eoa to be acquired.
	 * @param txWaitTime The time to wait for the transaction to be mined.
	 * @param entryPoint The entrypoint instance.
	 * @param rpcHelper The RPC helper instance.
	 * @param maxAttempts The maximum number of attempts to send the transaction.
	 * @returns A UserOpManager instance.
	 */
	constructor(eoaManager: EOAManager,
		eoaWaitTime: number = 5000, 
		txWaitTime:number = 120000, 
		entryPoint: ERC4337EntryPoint, 
		rpcHelper: RPCHelper, 
		maxAttempts: number = 3,
		publicClient: PublicClient
	) {
		this.eoaManager = eoaManager
		this.eoaWaitTime = eoaWaitTime
		this.entryPoint = entryPoint
		this.rpcHelper = rpcHelper
		this.maxAttempts = maxAttempts
		this.monitor = new TransactionMonitor(publicClient, txWaitTime)

		// Set up event listeners
		this.monitor.on("TransactionMined", (hash: Hex, receipt: TransactionReceipt) => this.handleReceipt(hash, receipt))
		this.monitor.on("MonitoringError", (hash: Hex, error: Error) => this.handleMonitoringError(hash, error))
		this.monitor.on("TransactionTimedout", (hash: Hex) => this.handleTransactionTimeout(hash))
	}

	/**
	 * Delays the execution of the function.
	 * @param ms The delay in milliseconds.
	 * @returns A promise that resolves after the delay.
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Gets the number of pending transactions.
	 * @returns The number of pending transactions.
	 */
	public getPendingTransactionCount(): number {
		return this.pendingTransactions.size
	}

	/**
	 * Handles the receipt of the transaction. 
	 * If the transaction is successful, it releases the EOA.
	 * If the transaction fails, it retries the transaction.
	 * @param hash The transaction hash.
	 * @param receipt The transaction receipt.
	 */
	private async handleReceipt(hash: Hex, receipt: TransactionReceipt) {
		if (receipt.status == "success") {
			console.debug(`Transaction ${hash} succeeded`)
			const { eoa } = this.pendingTransactions.get(hash) as Transaction
			await this.eoaManager.releaseEOA(eoa)
		} else {
			console.debug(`Transaction ${hash} failed. Retrying ...`)
			await this.delay(30000)
			const { userOp, eoa, nonce, attempt } = this.pendingTransactions.get(hash) as Transaction
			await this.submitUserOps(userOp, eoa, nonce + 1, attempt + 1)
		}
		this.pendingTransactions.delete(hash)
	}

	/**
	 * Handles the unexpected monitoring error.
	 * @param hash The transaction hash.
	 * @param error The error.
	 * 
	 * TODO: What kind of error could occur here? We should handle it accordingly
	 */
	private async handleMonitoringError(hash: Hex, error: Error) {
		console.debug(`An error occurred while monitoring transaction ${hash}: ${error}`)
		this.delay(10000)
		this.monitor.monitorTransaction(hash)
	}

	/**
	 * Handles the transaction timeout.
	 * If the transaction times out, it retries the transaction with the same nonce.
	 * @param hash The transaction hash.
	 */
	private async handleTransactionTimeout(hash: Hex) {
		console.debug(`Transaction ${hash} timed out`)
		const { userOp, eoa, nonce, attempt } = this.pendingTransactions.get(hash) as Transaction
		this.pendingTransactions.delete(hash)
		await this.submitUserOps(userOp, eoa, nonce, attempt + 1)
	}

	/**
	 * Submits the user operations to the entrypoint.
	 * Starts the monitoring and releasing of the EOA after the transaction is sent.
	 * @param userOps The user operations.
	 * @param eoa The EOA.
	 * @param nonce The nonce of the EOA.
	 * @param attempt The attempt number.
	 * @returns A promise that resolves to the transaction hash.
	 * @throws Error if the transaction has been attempted more than the maximum number of attempts.
	 */
	private async submitUserOps(userOps: UserOperation[],
		eoa: PrivateKeyAccount, 
		nonce: number, 
		attempt: number,
	): Promise<Hex> {
		if (attempt > this.maxAttempts) {
			// TODO: if the tx is stuck, do not release the EOA
			// wait for the tx to be mined and then release the EOA
			// we maybe need another event listener for this?
			await this.eoaManager.releaseEOA(eoa)
			throw new TransactionFailedError(`Transaction failed after ${this.maxAttempts} attempts`)
		}

		try {
			// we pass the attempt number as the gas multiplier
			// eg: if the attempt is 2, the gas will be multiplied by 2 for the better chance of success
			const hash = await this.entryPoint.handleOps(userOps, eoa, nonce, attempt)
			this.pendingTransactions.set(hash, { hash, userOp: userOps, eoa, nonce, attempt })

			process.nextTick(() => {
				this.monitor.monitorTransaction(hash)
			})

			return hash
		} catch (error) {
			await this.eoaManager.releaseEOA(eoa)
			throw error
		}
	}

	/**
	 * Handles a user operation.
	 * @param userOp The user operation.
	 * @returns A promise that resolves to the transaction hash.
	 */
	public async handleUserOp(userOps: UserOperation[]): Promise<Hex> {
		try {
			const eoa = await this.eoaManager.acquireEOA(this.eoaWaitTime)
			const nonce = await this.rpcHelper.getTransactionCount(eoa.address)
			return await this.submitUserOps(userOps, eoa, nonce, 1)
		} catch (error) {
			if (error instanceof TimeoutError) {
				throw Error(`Timeout Error: ${error.message}`)
			} else {
				throw error
			}
		}
	}
}

export default UserOpManager
