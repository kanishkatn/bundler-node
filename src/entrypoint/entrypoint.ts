import { Address, http, PrivateKeyAccount, createWalletClient, Hex, PublicClient, Chain} from "viem"
import { UserOperation } from "../types/userop.types"
import { ContractError } from "../types/errors.types"
import { getChain } from "../types/chain.types"

/**
 * Represents an entrypoint for interacting with an ERC4337 contract.
 */
export class ERC4337EntryPoint {
	public contractAddress: Address
	public contractABI: object[]
	private publicClient: PublicClient
	private chain: Chain
  
	/**
	 * Creates an instance of ERC4337EntryPoint.
	 * @param contractAddress The address of the ERC4337 contract.
	 * @param contractABI The ABI (Application Binary Interface) of the ERC4337 contract.
	 */
	constructor(
		contractAddress: Address,
		contractABI: object[],
		chain: string,
		publicClient: PublicClient
	) {
		this.contractAddress = contractAddress
		this.contractABI = contractABI
		this.chain = getChain(chain)
		this.publicClient = publicClient
	}

	/**
	 * Gets the optimal gas for the transaction based on the gas multiplier.
	 * @param gas The estimated gas for the transaction.
	 * @param gasMultiplier The gas multiplier.
	 * @returns A promise that resolves to the optimal gas.
	 */
	private async getOptimalGas(gas: bigint, gasMultiplier: number): Promise<bigint> {
		// TODO: the multiplier logic here is temporary, mostly for the initial testing flow and should be replaced with a more sophisticated one
		// for example, ethereum expects a minimum multiplier of 1.10 (10% increase) for the gas limit
		// Maybe this could also increase maxFeePerGas and maxPriorityFeePerGas
		if (gasMultiplier < 1) {
			throw new Error("Gas multiplier must be greater than or equal to 1")
		}
		return gas * BigInt(gasMultiplier)
	}
  
	/**
	 * Submits a user operation to the ERC4337 contract.
	 * @param userOp The user operation to be submitted.
	 * @param eoa The EOA (Externally Owned Account) used to sign the transaction.
	 * @returns A promise that resolves to the transaction hash.
	 */
	async handleOps(
		userOp: UserOperation[],
		eoa: PrivateKeyAccount,
		nonce: number,
		gasMultiplier: number = 1
	): Promise<Hex> {
		try {
			const { maxFeePerGas, maxPriorityFeePerGas } = await this.publicClient.estimateFeesPerGas()
			const args = {
				address: this.contractAddress as Address,
				abi: this.contractABI,
				functionName: "handleOps",
				args: [userOp, eoa.address],
				gas: 0n,
				chain: this.chain, 
				nonce: nonce,
				maxFeePerGas: maxFeePerGas,
				maxPriorityFeePerGas: maxPriorityFeePerGas,
				account: eoa,
			}
			const baseGas = await this.publicClient.estimateContractGas(args)
			
			// get the optimal gas for the transaction based on the gas multiplier
			const gasLimit = await this.getOptimalGas(baseGas, gasMultiplier)
			args.gas = gasLimit
	
			const walletClient = createWalletClient({account: eoa, transport: http(), chain: this.chain})
			// TODO: check if it is nice to have it here. The requirement states that it isn't necessary to simulate the contract.
			// but it will increase the chances of not failing the transaction significantly
			// const {request} = await this.publicClient.simulateContract(args)
			// console.log("simulated contract", request)
			const txHash = await walletClient.writeContract(args)
			return txHash
		} catch (error: unknown) {
			// viem.sh encapsulates the stack trace in the error message
			// here we print the complete error message and throw only the first line
			if (error instanceof Error) {
				console.error(`Failed to submit user operation: ${(error as Error).message}`)
			}
			// cut the error message to the first line
			const errorMessage = (error as Error).message.split("\n")[0]
			throw new ContractError(`Failed to submit user operation: ${errorMessage}`)
		}
	}
}
  