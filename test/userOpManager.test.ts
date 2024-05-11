import UserOpManager from "../src/userOpManager"
import EOAManager from "../src/eoaManager"
import { UserOperation } from "../src/types/userop.types"
import { ERC4337EntryPoint } from "../src/entrypoint/entrypoint"
import { IENTRY_POINT_ABI } from "../src/entrypoint/entrypoint.abi"
import { Address, hexToBigInt } from "viem"
import { RPCHelper } from "../src/rpcHelper"
import { exit } from "process"

describe("UserOpManager", () => {
	jest.retryTimes(0)

	let userOpManager: UserOpManager
	let eoaManager: EOAManager
	const eoas = {
		0: {
			privKey: "0x636ad8c3cccf3c3168a7a4a4229ce0f632a1214fe88bfba5934063f29866174c",
			address: "0xF1100f2f877Fc977eE2AC2f99DCB1C2b35a84bf8",
		},
		1: {
			privKey: "0x385c3c3db514cccd597d0b06f0bc51a5afab6c41599a091eddd3a2a4a09787ba",
			address: "0xfaa3Beedb24884146E199084355b4E9fA33Da086",
		},
	}
	const eoaTimeoutMs = 1000

	// To simulate a scenario of stuck txn, set txTimeoutMs to a low value
	const txTimeoutMs = 100000
	const entrypointContract = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
	const beneficiary = "0x7a939a944974e759a8365682682Be1BD94c8a6d9"
	const chain = "sepolia"
	const maxAttempts = 3

	beforeEach(() => {
		const eoaString = `${eoas[0].privKey},${eoas[1].privKey}`
		eoaManager = new EOAManager(eoaString)
		const entryPoint = new ERC4337EntryPoint(entrypointContract, IENTRY_POINT_ABI, chain)
		const rpcHelper = new RPCHelper(chain)
		userOpManager = new UserOpManager(eoaManager, eoaTimeoutMs,txTimeoutMs, entryPoint, rpcHelper, maxAttempts, chain)
	})

	it.skip("should send a user operation and return a transaction hash", async () => {
		// with
		const userOp: UserOperation = {
			sender: "0x49C82ae7e76fa4CDA761F14e1e9cEA0DD4868724",
			nonce: hexToBigInt("0xb"),
			initCode: "0x",
			callData: "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
			signature: "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000041051eb8dcf3d82e1f72a43e7e66491cc3f03b72e9e2a3f3b717acdb783c78bf626164803ec7b73189f065bf94461861a7856675a7065eb296b8dc4be299571a221c00000000000000000000000000000000000000000000000000000000000000",
			maxFeePerGas: hexToBigInt("0x23d6fc4b"),
			maxPriorityFeePerGas: hexToBigInt("0x23c31e77"),
			verificationGasLimit: hexToBigInt("0xef7c"),
			callGasLimit: hexToBigInt("0x33f9"),
			preVerificationGas: hexToBigInt("0xeab6"),
			paymasterAndData: "0x"
		}
		console.log("userOp", userOp)
		exit(0)

		// when
		const transactionHash = await userOpManager.handleUserOp([userOp], beneficiary)

		// then
		expect(typeof transactionHash).toBe("string")
		expect(transactionHash.length).toBeGreaterThan(0)

		// wait for the transaction to be mined
		await new Promise((resolve) => setTimeout(resolve, 100000))
		const eoaStatus = await eoaManager.getEOAStatus(eoas[0].address as Address)
		expect(eoaStatus).toBe(false)
	})
})