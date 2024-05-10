import { Address, http, parseGwei, PrivateKeyAccount, createWalletClient, Hex} from "viem"
import { sepolia } from "viem/chains"
import { UserOperation } from "../types/userop.types"

/**
 * Represents an entrypoint for interacting with an ERC4337 contract.
 */
export class ERC4337EntryPoint {
	private contractAddress: Address
	private contractABI: object[]
	// private publicClient: PublicClient
  
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
		// this.publicClient = createPublicClient({
		// 	chain: sepolia,
		// 	transport: http()
		// })
	}
  
	/**
	 * Submits a user operation to the ERC4337 contract.
	 * @param userOp The user operation to be submitted.
	 * @param beneficiary The address of the beneficiary.
	 * @param eoa The EOA (Externally Owned Account) used to sign the transaction.
	 * @returns A promise that resolves to the transaction hash.
	 */
	async submitUserOperation(
		userOp: UserOperation[],
		beneficiary: Address,
		eoa: PrivateKeyAccount,
		nonce: number,
	): Promise<Hex> {
		const args = {
			address: this.contractAddress as Address,
			abi: this.contractABI,
			functionName: "handleOps",
			args: [userOp, beneficiary],
			gas: 1000000n, // TODO: remove hardcoded value
			chain: sepolia, // TODO: remove hardcoded value
			nonce: nonce,
			maxFeePerGas: parseGwei("20"),
			maxPriorityFeePerGas: parseGwei("2"),
			account: eoa,
		}
		const walletClient = createWalletClient({account: eoa, transport: http(), chain: sepolia})
		
		try {
			// TODO: check if it is nice to have it here
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
  