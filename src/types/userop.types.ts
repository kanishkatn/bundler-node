import { Hex, hexToBigInt, isHex } from "viem"
import { InvalidUserOperationError } from "./errors.types"

/**
 * User Operation
 * 
 * Represents the structure of a user operation.
 */
export type UserOperation = {
    sender: string;
    nonce: bigint;
    initCode: string;
    callData: string;
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    paymasterAndData: string;
    signature: string;
}

/**
 * Parses a user operation.
 * @param userOp The user operation to be parsed.
 * @returns The parsed user operation.
 * @throws InvalidUserOperationError if the user operation is invalid.
 */
export function parseUserOperation(userOp: unknown): UserOperation {
	// TODO: This feels like an overkill. Check if we can use something that is similar to Go's reflection.
	if (typeof userOp !== "object" || userOp === null || Array.isArray(userOp)) {
		throw new Error("User operation must be an object")
	}

	const fieldCount = 11
	let inputFieldCount = 0
    
	const output: UserOperation = {
		sender: "",
		nonce: BigInt(0),
		initCode: "",
		callData: "",
		callGasLimit: BigInt(0),
		verificationGasLimit: BigInt(0),
		preVerificationGas: BigInt(0),
		maxFeePerGas: BigInt(0),
		maxPriorityFeePerGas: BigInt(0),
		paymasterAndData: "",
		signature: ""
	}
    
	for (const [key, value] of Object.entries(userOp)) {
		switch (key) {
		case "sender":
			if (!isHex(value)) {
				throw new InvalidUserOperationError("sender must be a hex")
			}
			output.sender = value as Hex
			break
    
		case "nonce":
			if (typeof value === "bigint") {
				output.nonce = value
			} else if (isHex(value)) {
				output.nonce = hexToBigInt(value as Hex)
			} else {
				throw new InvalidUserOperationError("nonce must be a bigint or a hex")
			}
			break
    
		case "initCode":
			if (!isHex(value)) {
				throw new InvalidUserOperationError("initCode must be a hex")
			}
			output.initCode = value
			break
    
		case "callData":
			if (!isHex(value)) {
				throw new InvalidUserOperationError("callData must be a hex")
			}
			output.callData = value
			break
    
		case "callGasLimit":
			if (typeof value === "bigint") {
				output.callGasLimit = value
			} else if (isHex(value)) {
				output.callGasLimit = hexToBigInt(value as Hex)
			} else {
				throw new InvalidUserOperationError("callGasLimit must be a bigint or a hex")
			}
			break
    
		case "verificationGasLimit":
			if (typeof value === "bigint") {
				output.verificationGasLimit = value
			} else if (isHex(value)) {
				output.verificationGasLimit = hexToBigInt(value as Hex)
			} else {
				throw new InvalidUserOperationError("verificationGasLimit must be a bigint or a hex")
			}
			break
    
		case "preVerificationGas":
			if (typeof value === "bigint") {
				output.preVerificationGas = value
			} else if (isHex(value)) {
				output.preVerificationGas = hexToBigInt(value as Hex)
			} else {
				throw new InvalidUserOperationError("preVerificationGas must be a bigint or a hex")
			}
			break
    
		case "maxFeePerGas":
			if (typeof value === "bigint") {
				output.maxFeePerGas = value
			} else if (isHex(value)) {
				output.maxFeePerGas = hexToBigInt(value as Hex)
			} else {
				throw new InvalidUserOperationError("maxFeePerGas must be a bigint or a hex")
			}
			break
    
		case "maxPriorityFeePerGas":
			if (typeof value === "bigint") {
				output.maxPriorityFeePerGas = value
			} else if (isHex(value)) {
				output.maxPriorityFeePerGas = hexToBigInt(value as Hex)
			} else {
				throw new InvalidUserOperationError("maxPriorityFeePerGas must be a bigint or a hex")
			}
			break
    
		case "paymasterAndData":
			if (!isHex(value)) {
				throw new InvalidUserOperationError("paymasterAndData must be a hex")
			}
			output.paymasterAndData = value
			break
    
		case "signature":
			if (!isHex(value)) {
				throw new InvalidUserOperationError("signature must be a string")
			}
			output.signature = value
			break
            
		default:
			throw new InvalidUserOperationError(`Unknown field ${key}`)
		}
		inputFieldCount++
	}

	if (inputFieldCount !== fieldCount) {
		throw new InvalidUserOperationError("Missing fields")
	}
    
	return output as UserOperation
}

