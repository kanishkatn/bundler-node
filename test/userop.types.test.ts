import { parseUserOperation } from "../src/types/userop.types"
import { InvalidUserOperationError } from "../src/types/errors.types"

describe("parseUserOperation", () => {
	test("should correctly parse a valid user operation", () => {
		const validUserOp = {
			sender: "0xabc123",
			nonce: "0x1",
			initCode: "0xdef456",
			callData: "0x789abc",
			callGasLimit: "0x10",
			verificationGasLimit: "0x20",
			preVerificationGas: "0x30",
			maxFeePerGas: "0x40",
			maxPriorityFeePerGas: "0x50",
			paymasterAndData: "0xabc789",
			signature: "0x123456"
		}

		const result = parseUserOperation(validUserOp)
		expect(result).toEqual({
			sender: "0xabc123",
			nonce: BigInt(1),
			initCode: "0xdef456",
			callData: "0x789abc",
			callGasLimit: BigInt(16),
			verificationGasLimit: BigInt(32),
			preVerificationGas: BigInt(48),
			maxFeePerGas: BigInt(64),
			maxPriorityFeePerGas: BigInt(80),
			paymasterAndData: "0xabc789",
			signature: "0x123456"
		})
	})

	test("should throw an error if user operation is not an object", () => {
		const notAnObjectInput = "not an object"
		expect(() => parseUserOperation(notAnObjectInput)).toThrow("User operation must be an object")
	})

	test("should throw an error if required fields are missing", () => {
		const incompleteUserOp = { sender: "0xabc123" }
		expect(() => parseUserOperation(incompleteUserOp)).toThrow(InvalidUserOperationError)
	})

	test("should throw an error if fields have invalid types", () => {
		const invalidTypesUserOp = {
			sender: 12345, // should be hex string
			nonce: "not a hex", // invalid hex
			initCode: "0xdef456",
			callData: "0x789abc",
			callGasLimit: "not a bigint", // invalid bigint or hex
			verificationGasLimit: "0x20",
			preVerificationGas: "0x30",
			maxFeePerGas: "0x40",
			maxPriorityFeePerGas: "0x50",
			paymasterAndData: "0xabc789",
			signature: "0x123456"
		}
		expect(() => parseUserOperation(invalidTypesUserOp)).toThrow(InvalidUserOperationError)
	})

	test("should throw an error if extra unknown fields are provided", () => {
		const userOpWithExtraField = {
			sender: "0xabc123",
			nonce: "0x1",
			initCode: "0xdef456",
			callData: "0x789abc",
			callGasLimit: "0x10",
			verificationGasLimit: "0x20",
			preVerificationGas: "0x30",
			maxFeePerGas: "0x40",
			maxPriorityFeePerGas: "0x50",
			paymasterAndData: "0xabc789",
			signature: "0x123456",
			extraField: "unexpected", // this field is not expected
		}
		expect(() => parseUserOperation(userOpWithExtraField)).toThrow(InvalidUserOperationError)
	})
})
