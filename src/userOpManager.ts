import EOAManager from "./eoaManager"
import { PrivateKeyAccount, http, createPublicClient, Hex, PublicClient, Address } from "viem"
import { sepolia } from "viem/chains"
import { UserOperation } from "./types/userop.types"
import { ERC4337EntryPoint } from "./entrypoint/entrypoint"
import {TransactionReceipt} from "viem/_types"
import { RPCHelper } from "./rpcHelper"
import { ContractError, NetworkError, TimeoutError, TransactionFailedError } from "./types/errors.types"

/**
 * UserOpManager manages the sending of user operations.
 * It acquires an EOA from the EOAManager, sends the user operation, and releases the EOA.
 * It also monitors the transaction status and retries if necessary.
 */
class UserOpManager {
	private eoaManager: EOAManager
	private entryPoint: ERC4337EntryPoint
	private eoaWaitTime: number
	private txWaitTime: number
	private publicClient: PublicClient
	private rpcHelper: RPCHelper
	private maxAttempts: number

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
	constructor(eoaManager: EOAManager, eoaWaitTime: number = 5000, txWaitTime:number = 120000, entryPoint: ERC4337EntryPoint, rpcHelper: RPCHelper, maxAttempts: number = 3) {
		this.eoaManager = eoaManager
		this.eoaWaitTime = eoaWaitTime
		this.txWaitTime = txWaitTime
		this.entryPoint = entryPoint
		this.rpcHelper = rpcHelper
		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http()
		})
		this.maxAttempts = maxAttempts
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
	 * Monitors the transaction status.
	 * @param hash The transaction hash.
	 * @returns A promise that resolves to the transaction receipt.
	 * @throws Error if the transaction receipt is not found within the timeout.
	 */
	private async monitorTransaction(hash: string): Promise<TransactionReceipt> {
		const startTime = Date.now()

		while(Date.now() - startTime < this.txWaitTime) {  // Continues until a receipt is found or timeout is reached
			try {
				const receipt: TransactionReceipt | null = await this.publicClient.getTransactionReceipt({ hash: hash as Hex })
				console.log("Transaction receipt:", receipt)
				if (receipt) {
					console.log("Transaction status:", receipt.status)
					return receipt
				}
	
				await this.delay(10000)
			} catch (error) {
				console.debug(`Failed to get transaction receipt for hash ${hash}: ${error}`)
			} finally {
				await this.delay(1000)
			}
		}

		throw new TimeoutError("Transaction timed out")
	}

	/**
	 * Monitors the transaction status and releases the EOA.
	 * @param userOp The user operation.
	 * @param hash The transaction hash.
	 * @param eoa The EOA.
	 * @param nonce The nonce of the EOA.
	 * @param attempt The attempt number.
	 * @returns A promise that resolves when the monitoring is complete.
	 */
	private async monitorAndReleaseEOA(userOp: UserOperation[], beneficiary: Address, hash: Hex, eoa: PrivateKeyAccount, nonce: number, attempt: number): Promise<void> {
		try {
			const receipt = await this.monitorTransaction(hash)
			if (receipt.status == "success") {
				console.log(`Transaction ${hash} succeeded`)
				console.debug(`Releasing EOA ${eoa.address} ...`)
				await this.eoaManager.releaseEOA(eoa)
			} else {
				console.log(`Transaction ${hash} failed`)
				// if the transaction fails, resubmit the transaction by incrementing the attempt immediately
				await this.submitUserOps(userOp, beneficiary, eoa, nonce, attempt + 1)
			}
		} catch (error: unknown) {
			if (error instanceof TimeoutError) {
				console.error(`Transaction ${hash} timed out. Resumbitting ...`)
				// if the transaction times out, resubmit the transaction by incrementing the attempt
				// it will use the same nonce and increased gas thereby dropping the previous transaction
				await this.submitUserOps(userOp, beneficiary, eoa, nonce, attempt + 1)
			} else {
				console.error(`An unknown error occurred while monitoring transaction ${hash}: ${error}`)
			}
		}
	}

	/**
	 * Submits the user operations to the entrypoint.
	 * Starts the monitoring and releasing of the EOA after the transaction is sent.
	 * @param userOps The user operations.
	 * @param beneficiary The address of the beneficiary.
	 * @param eoa The EOA.
	 * @param nonce The nonce of the EOA.
	 * @param attempt The attempt number.
	 * @returns A promise that resolves to the transaction hash.
	 * @throws Error if the transaction fails after 3 attempts.
	 */
	public async submitUserOps(userOps: UserOperation[], beneficiary: Address, eoa: PrivateKeyAccount, nonce: number, attempt: number): Promise<Hex> {
		if (attempt > this.maxAttempts) {
			await this.eoaManager.releaseEOA(eoa)
			throw new TransactionFailedError(`Transaction failed after ${this.maxAttempts} attempts`)
		}

		try {
			// we pass the attempt number as the gas multiplier
			// eg: if the attempt is 2, the gas will be multiplied by 2 for the better chance of success
			const hash = await this.entryPoint.handleOps(userOps, beneficiary, eoa, nonce, attempt)

			process.nextTick(() => {
				this.monitorAndReleaseEOA(userOps, beneficiary, hash, eoa, nonce, attempt)
			})

			return hash
		} catch (error) {
			await this.eoaManager.releaseEOA(eoa)
			if (error instanceof ContractError) {
				console.error(`Failed to submit user operation: ${error}`)
				throw Error("Failed to submit user operation")
			} else {
				console.error(`An unknown error occurred while submitting user operation: ${error}`)
				throw Error("An unknown error occurred while submitting user operation")
			}
		}
	}

	/**
	 * Handles a user operation.
	 * @param userOp The user operation.
	 * @param beneficiary The address of the beneficiary.
	 * @returns A promise that resolves to the transaction hash.
	 */
	public async handleUserOp(userOps: UserOperation[], beneficiary: Address): Promise<Hex> {
		try {
			const eoa = await this.eoaManager.acquireEOA(this.eoaWaitTime)
			const nonce = await this.rpcHelper.getTransactionCount(eoa.address)
			return await this.submitUserOps(userOps, beneficiary, eoa, nonce, 1)
		} catch (error) {
			if (error instanceof NetworkError) {
				console.error(`A network error occurred while handling user operation": ${error}`)
				throw Error("A network error occurred while handling user operation")
			} else if (error instanceof TimeoutError) {
				console.error("Timeout: No available EOAs")
				throw Error("Timeout: No available EOAs")
			} else {
				console.error(`error occurred while handling user operation: ${error}`)
				throw error
			}
		}
	}
}

export default UserOpManager
