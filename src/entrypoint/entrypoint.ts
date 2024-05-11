import { Address, http, parseGwei, PrivateKeyAccount, createWalletClient, Hex, createPublicClient, PublicClient} from "viem"
import { sepolia } from "viem/chains"
import { UserOperation } from "../types/userop.types"

/**
 * Represents an entrypoint for interacting with an ERC4337 contract.
 */
export class ERC4337EntryPoint {
	public contractAddress: Address
	public contractABI: object[]
	private publicClient: PublicClient

	private baseMaxFeePerGas = parseGwei("20")
	private baseMaxPriorityFeePerGas = parseGwei("2")
  
	/**
	 * Creates an instance of ERC4337EntryPoint.
	 * @param contractAddress The address of the ERC4337 contract.
	 * @param contractABI The ABI (Application Binary Interface) of the ERC4337 contract.
	 */
	constructor(
		contractAddress: Address,
		contractABI: object[],
	) {
		this.contractAddress = contractAddress
		this.contractABI = contractABI
		this.publicClient = createPublicClient({
			chain: sepolia,
			transport: http()
		})
	}

	/**
	 * Gets the optimal gas for the transaction based on the gas multiplier.
	 * @param gas The estimated gas for the transaction.
	 * @param gasMultiplier The gas multiplier.
	 * @returns A promise that resolves to the optimal gas, maxFeePerGas, and maxPriorityFeePerGas.
	 */
	private async getOptimalGas(gas: bigint, gasMultiplier: number): Promise<[bigint, bigint, bigint]> {
		// TODO: the multiplier logic here is temporary, mostly for the initial testing flow and should be replaced with a more sophisticated one
		// for example, ethereum expects a minimum multiplier of 1.10 (10% increase) for the gas limit
		// Note: it does not work if we just increase the gasLimit on ropsten. 
		// It is necessary to increase the maxFeePerGas and the maxPriorityFeePerGas as well.
		const gasLimit = (gas * BigInt(gasMultiplier))/2n // TODO: remove test changes
		const maxFeePerGas = this.baseMaxFeePerGas * BigInt(gasMultiplier)
		const maxPriorityFeePerGas = this.baseMaxPriorityFeePerGas * BigInt(gasMultiplier)

		return [gasLimit, maxFeePerGas, maxPriorityFeePerGas]
	}
  
	/**
	 * Submits a user operation to the ERC4337 contract.
	 * @param userOp The user operation to be submitted.
	 * @param beneficiary The address of the beneficiary.
	 * @param eoa The EOA (Externally Owned Account) used to sign the transaction.
	 * @returns A promise that resolves to the transaction hash.
	 */
	async handleOps(
		userOp: UserOperation[],
		beneficiary: Address,
		eoa: PrivateKeyAccount,
		nonce: number,
		gasMultiplier: number = 1
	): Promise<Hex> {
		const args = {
			address: this.contractAddress as Address,
			abi: this.contractABI,
			functionName: "handleOps",
			args: [userOp, beneficiary],
			gas: 0n,
			chain: sepolia, // TODO: remove hardcoded value
			nonce: nonce,
			maxFeePerGas: this.baseMaxFeePerGas,
			maxPriorityFeePerGas: this.baseMaxPriorityFeePerGas,
			account: eoa,
		}
		const baseGas = await this.publicClient.estimateContractGas(args)
		
		// get the optimal gas for the transaction based on the gas multiplier
		const [gasLimit, maxFeePerGas, maxPriorityFeePerGas] = await this.getOptimalGas(baseGas, gasMultiplier)
		args.gas = gasLimit
		args.maxFeePerGas = maxFeePerGas
		args.maxPriorityFeePerGas = maxPriorityFeePerGas

		const walletClient = createWalletClient({account: eoa, transport: http(), chain: sepolia})
		
		try {
			// TODO: check if it is nice to have it here. The requirement states that it isn't necessary to simulate the contract
			// but it will increase the chances of not failing the transaction significantly
			// const {request} = await this.publicClient.simulateContract(args)
			// console.log("simulated contract", request)
			const txHash = await walletClient.writeContract(args)
			return txHash
		} catch (error) {
			console.error(`Failed to submit user operation: ${error}`)
			throw Error("Failed to submit user operation")
		}
	}
}
  