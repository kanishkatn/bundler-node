import EOAManager from "./eoaManager"
import { PrivateKeyAccount, http, createPublicClient, Hex, PublicClient, Address } from "viem"
import { sepolia } from "viem/chains"
import { UserOperation } from "./types/userop.types"
import { ERC4337EntryPoint } from "./entrypoint/entrypoint"
import {TransactionReceipt} from "viem/_types"
import { RPCHelper } from "./rpcHelper"

/**
 * UserOpManager manages the sending of user operations.
 * It acquires an EOA from the EOAManager, sends the user operation, and releases the EOA.
 * It also monitors the transaction status and retries if necessary.
 * @param eoaManager The EOAManager instance.
 * @param waitTime The time to wait before releasing the EOA.
 * @param entryPoint The entrypoint instance.
 * @param rpcHelper The RPC helper instance.
 * @returns A UserOpManager instance.
 */
class UserOpManager {
	private eoaManager: EOAManager
	private entryPoint: ERC4337EntryPoint
	private waitTime: number
	private publicClient: PublicClient
	private rpcHelper: RPCHelper
	private maxAttempts: number

	/**
	 * Creates an instance of UserOpManager.
	 * @param eoaManager The EOAManager instance.
	 * @param waitTime The time to wait before releasing the EOA.
	 * @param entryPoint The entrypoint instance.
	 * @param rpcHelper The RPC helper instance.
	 * @param maxAttempts The maximum number of attempts to send the transaction.
	 * @returns A UserOpManager instance.
	 */
	constructor(eoaManager: EOAManager, waitTime: number = 1000, entryPoint: ERC4337EntryPoint, rpcHelper: RPCHelper, maxAttempts: number = 3) {
		this.eoaManager = eoaManager
		this.waitTime = waitTime
		this.entryPoint = entryPoint
		this.rpcHelper = rpcHelper
		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http()
		})
		this.maxAttempts = maxAttempts
	}

	/**
	 * Handles a user operation.
	 * @param userOp The user operation.
	 * @param beneficiary The address of the beneficiary.
	 * @returns A promise that resolves to the transaction hash.
	 */
	public async handleUserOp(userOps: UserOperation[], beneficiary: Address): Promise<Hex> {
		try {
			const eoa = await this.eoaManager.acquireEOA(this.waitTime)
			const nonce = await this.rpcHelper.getTransactionCount(eoa.address)
			return await this.submitUserOps(userOps, beneficiary, eoa, nonce, 1)
		} catch (error) {
			console.error("Error sending user operation:", error)
			throw Error("Error sending user operation")
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
			throw Error("Error sending user operation")
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
			console.error("Error sending user operation:", error)
			throw Error("Error sending user operation")
		}
	}

	/**
	 * Monitors the transaction status and releases the EOA.
	 * @param userOp The user operation.
	 * @param hash The transaction hash.
	 * @param eoa The EOA.
	 * @param nonce The nonce of the EOA.
	 * @param attempt The attempt number.
	 * @returns A promise that resolves when the EOA is released.
	 */
	private async monitorAndReleaseEOA(userOp: UserOperation[], beneficiary: Address, hash: Hex, eoa: PrivateKeyAccount, nonce: number, attempt: number): Promise<void> {
		try {
			const receipt = await this.monitorTransaction(hash)
			if (receipt.status == "success") {
				console.log("Transaction confirmed and successful")
			} else {
				console.log("Transaction failed. Retrying ...")
				// if the transaction fails, resubmit the transaction by incrementing the nonce and attempt
				await this.submitUserOps(userOp, beneficiary, eoa, nonce+1, attempt + 1)
			}
		} catch (error: unknown) {
			console.error(`Error monitoring transaction ${hash}: ${error}`)
			if (error instanceof Error && error.message == "Transaction timed out") {
				console.log("Transaction timed out. Resubmitting ...")
				// we'd need to replace the transaction if it is stuck in the mempool instead of resubmitting
				// hence, submitting the transaction with the same nonce and incremented attempt
				// since attempt is used as gas multiplier, it will increase the gas for the next transaction
				await this.submitUserOps(userOp, beneficiary, eoa, nonce, attempt + 1)
			}
		} finally {
			console.debug(`Releasing EOA ${eoa.address} ...`)
			await this.eoaManager.releaseEOA(eoa)
		}
	}

	/**
	 * Monitors the transaction status.
	 * @param hash The transaction hash.
	 * @returns A promise that resolves to the transaction receipt.
	 * @throws Error if the transaction receipt is not found within the timeout.
	 */
	private async monitorTransaction(hash: string): Promise<TransactionReceipt> {
		const timeoutMilliseconds = 120000
		const startTime = Date.now()

		while(Date.now() - startTime < timeoutMilliseconds) {  // Continues until a receipt is found or timeout is reached
			try {
				const receipt: TransactionReceipt | null = await this.publicClient.getTransactionReceipt({ hash: hash as Hex })
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

		throw new Error("Transaction timed out")
	}

	/**
	 * Delays the execution of the function.
	 * @param ms The delay in milliseconds.
	 * @returns A promise that resolves after the delay.
	 */
	private delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}
}

export default UserOpManager
