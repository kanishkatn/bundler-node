import { Hex } from "viem"
import { privateKeyToAccount, PrivateKeyAccount } from "viem/accounts"
import { EventEmitter } from "events"
import { Mutex } from "async-mutex"

/**
 * EOAStatus is a map of EOA addresses to their availability status.
 */
interface EOAStatus {
	[address: string]: boolean
}

/**
 * EOAManager manages the acquisition and release of EOAs.
 */
class EOAManager {
	private eoaAccounts: PrivateKeyAccount[] | null = null // List of EOAs
	private eoaStatus: EOAStatus = {} // Map of EOA addresses to their availability status
	private eoaEmitter = new EventEmitter() // Emitter for EOA availability
	private eoaMutex = new Mutex() // Mutex for EOA status

	constructor() {
		this.initializeEOAs()
	}

	/**
	 * Initializes the EOAs from the environment variable.
	 * @throws Error if EOAs environment variable is not set or less than 2 EOAs are set.
	 * @throws Error if invalid EOA is set.
	 */
	private initializeEOAs(): void {
		const eoasEnv = process.env.EOAS

		if (!eoasEnv) {
			throw new Error("EOAs environment variable is not set")
		}

		const privateKeys = eoasEnv.split(",")
		if (privateKeys.length < 2) {
			throw new Error("Need at least 2 EOAs")
		}

		this.eoaAccounts = privateKeys.map((key) => privateKeyToAccount(key as Hex))
		this.eoaAccounts.forEach((account) => {
			this.eoaStatus[account.address] = false
		})
	}

	/**
	 * Acquires an available EOA.
	 * @param timeoutMs The timeout in milliseconds.
	 * @returns A promise that resolves to the acquired EOA.
	 */
	public async acquireEOA(timeoutMs: number): Promise<PrivateKeyAccount> {
		if (!this.eoaAccounts) {
			throw new Error("EOAs are not initialized")
		}

		const startTime = Date.now()

		// Check if there is an available EOA, if so, acquire it.
		const availableEOA = this.eoaAccounts.find(
			(account) => !this.eoaStatus[account.address]
		)
		if (availableEOA) {
			await this.eoaMutex.acquire().then((release) => {
				this.eoaStatus[availableEOA.address] = true
				release()
			})
			return availableEOA
		}

		// Wait for an available EOA.
		const waitForEOA = new Promise<PrivateKeyAccount>((resolve, reject) => {
			const onEOAAvailable = (eoa: PrivateKeyAccount) => {
				this.eoaMutex.acquire().then((release) => {
					this.eoaStatus[eoa.address] = true
					release()
					resolve(eoa)
					this.eoaEmitter.off("eoa-available", onEOAAvailable)
				})
			}

			this.eoaEmitter.on("eoa-available", onEOAAvailable)

			setTimeout(() => {
				this.eoaEmitter.off("eoa-available", onEOAAvailable)
				reject(new Error("Timeout: No available EOAs"))
			}, timeoutMs - (Date.now() - startTime))
		})

		return await waitForEOA
	}

	/**
	 * Releases an EOA.
	 * @param eoa The EOA to release.
	 */
	public async releaseEOA(eoa: PrivateKeyAccount): Promise<void> {
		await this.eoaMutex.acquire().then((release) => {
			this.eoaStatus[eoa.address] = false
			release()
			this.eoaEmitter.emit("eoa-available", eoa)
		})
	}
}

export default EOAManager
