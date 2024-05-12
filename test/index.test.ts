import request from "supertest"
import app from "../src/index"
import { Server } from "http"

describe.skip("Express Server", () => {
	jest.retryTimes(0)
	let server: Server

	beforeAll((done) => {
		const PORT = process.env.PORT || 3000
		server = app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`)
			done()
		})
	})

	afterAll((done) => {
		if (server) {
			server.close((err?: Error) => {
				if (err) {
					console.error("Error closing server:", err)
					done(err)
				} else {
					done()
				}
			})
		}
	})

	// This is a boilerplate test for the jrpc server
	// You'll need to modify the placeholder values with actual values for the selected network
	// TODO: This needs to be converted to integration test. Here are the steps
	// 1. Deploy a local ganache instance
	// 2. Fund the eoas with some ether
	// 3. Use biconomy example sdk to to create user operation and fund the scws
	// 4. Update the jsonRpcRequest with the actual values
	// 5. Send the user operation to the local ganache instance
	// 6. Check if the transactions are mined
	// 7. Check if the EOAs are released
	it("should respond correctly to a JSON-RPC \"eth_sendUserOperation\" request", async () => {
		const jsonRpcRequest1 = {
			jsonrpc: "2.0",
			method: "eth_sendUserOperation",
			params: [{
				"sender": "0xE640d9D651fb0B8bDf52112DcD7a0fb8c2C6daF7",
				"nonce": "0x3",
				"initCode": "0x",
				"callData": "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
				"callGasLimit": "0x33f9",
				"verificationGasLimit": "0xc501",
				"preVerificationGas": "0xe676",
				"maxFeePerGas": "0x54d1f079",
				"maxPriorityFeePerGas": "0x3b9aca00",
				"paymasterAndData": "0x",
				"signature": "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000041ef7de18ba1ad729fca51c8a36bb505fbf3b5a945426ab7937ab07a96517d75b3406900a2c5897ace9776c5f26c61e4f2d385792c32124a096ef4a5b10eb857431b00000000000000000000000000000000000000000000000000000000000000"
			}],
			id: 1,
		}

		const jsonRpcRequest2 = {
			jsonrpc: "2.0",
			method: "eth_sendUserOperation",
			params: [{
				"sender": "0xB2eb0BBfc1f8d1b0458d2228c7b021092d9113BB",
				"nonce": "0x2",
				"initCode": "0x",
				"callData": "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
				"callGasLimit": "0x33f9",
				"verificationGasLimit": "0xc501",
				"preVerificationGas": "0xe676",
				"maxFeePerGas": "0x54abe341",
				"maxPriorityFeePerGas": "0x3b9aca00",
				"paymasterAndData": "0x",
				"signature": "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000041c874089bae1758b454bcccb2e730a20650a7645d8cb6c9e309f2b9749014ceb93339d28b70de4efc74b67a0fe4ebf5595e90b470affd3d0afac9acdae9c019c11c00000000000000000000000000000000000000000000000000000000000000"
			}],
			id: 1,
		}

		const jsonRpcRequest3 = {
			jsonrpc: "2.0",
			method: "eth_sendUserOperation",
			params: [{
				"sender": "0x1C65F7328eCa12C1f91E95d7E320859CC12CBD7c",
				"nonce": "0x3",
				"initCode": "0x",
				"callData": "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
				"callGasLimit": "0x33f9",
				"verificationGasLimit": "0xc501",
				"preVerificationGas": "0xe676",
				"maxFeePerGas": "0x507cc4d2",
				"maxPriorityFeePerGas": "0x3b9aca00",
				"paymasterAndData": "0x",
				"signature": "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e000000000000000000000000000000000000000000000000000000000000004105453229176167f17a57f3fa57dcf9aac7f306536f6cd56fb4090aeb4a3df3de4b5a7a38849d2b0f84c321d052c2f766d390ba5439d109d262bc39a82012801e1c00000000000000000000000000000000000000000000000000000000000000"
			}],
			id: 1,
		}
		
		const promises = [
			request(app).post("/jsonrpc").send(jsonRpcRequest1).set("Content-Type", "application/json"),
			request(app).post("/jsonrpc").send(jsonRpcRequest2).set("Content-Type", "application/json"),
			request(app).post("/jsonrpc").send(jsonRpcRequest3).set("Content-Type", "application/json")
		]

		// out of the 3 requests, the first 2 should be successful and the last one should fail since we only have 2 EOAs
		const responses = await Promise.all(promises)
		responses.forEach((response, index) => {
			console.log(`response ${index + 1}`, response.body)
			if (index < 2) {
				expect(response.status).toBe(200)
				expect(response.body.txHash).toBeDefined()
			} else {
				expect(response.status).toBe(400)
				expect(response.body.error).toBeDefined()
			}
		})

		// wait until all the transactions are mined
		console.log("Waiting for transactions to be mined...")
		let continueLoop = true
		while(continueLoop) {
			const count = app.locals.userOpManager.getPendingTransactionCount()
			if (count === 0) {
				continueLoop = false
			} else {
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}

		// wait until all the EOAs are free
		console.log("Waiting for all EOAs to be free...")
		continueLoop = true
		while(continueLoop) {
			const availableEOAs = app.locals.eoaManager.availableEOAs()
			const totalEOAs = app.locals.eoaManager.totalEOAs()
			if (availableEOAs === totalEOAs) {
				continueLoop = false
			} else {
				await new Promise(resolve => setTimeout(resolve, 1000))
			}
		}
	})
})
