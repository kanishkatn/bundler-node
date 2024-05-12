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
	it.skip("should respond correctly to a JSON-RPC \"eth_sendUserOperation\" request", async () => {
		const jsonRpcRequest1 = {
			jsonrpc: "2.0",
			method: "eth_sendUserOperation",
			params: [{
				"sender": "0xE640d9D651fb0B8bDf52112DcD7a0fb8c2C6daF7",
				"nonce": "0x0",
				"initCode": "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5df20ffbc0000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000242ede3bc0000000000000000000000000f1100f2f877fc977ee2ac2f99dcb1c2b35a84bf800000000000000000000000000000000000000000000000000000000",
				"callData": "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
				"callGasLimit": "0x33f9",
				"verificationGasLimit": "0x4bc4b",
				"preVerificationGas": "0x156fe",
				"maxFeePerGas": "0x194929a1c0",
				"maxPriorityFeePerGas": "0x3b9aca00",
				"paymasterAndData": "0x",
				"signature": "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000041b5839c6e44d216a6742516eb1433e65ce5bc19c38e33d965fa6f05ef8ce88f813f09532d4508fe10d83079ac19f3f5470fab84de85823c142959b94194420e451b00000000000000000000000000000000000000000000000000000000000000"
			}],
			id: 1,
		}

		const jsonRpcRequest2 = {
			jsonrpc: "2.0",
			method: "eth_sendUserOperation",
			params: [{
				"sender": "0xB2eb0BBfc1f8d1b0458d2228c7b021092d9113BB",
				"nonce": "0x0",
				"initCode": "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5df20ffbc0000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000242ede3bc0000000000000000000000000faa3beedb24884146e199084355b4e9fa33da08600000000000000000000000000000000000000000000000000000000",
				"callData": "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
				"callGasLimit": "0x33f9",
				"verificationGasLimit": "0x4bc4b",
				"preVerificationGas": "0x156fe",
				"maxFeePerGas": "0x18f8f615a9",
				"maxPriorityFeePerGas": "0x3b9aca00",
				"paymasterAndData": "0x",
				"signature": "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e000000000000000000000000000000000000000000000000000000000000004104e1d4dae90f6c20ea947098738ca301c6a75ce9c0847700785b0fd5f6c3f5d37f1a03137b013d72cdd9ca5929df996fc131cb0f97ff091fc026bd29aefd7c8f1b00000000000000000000000000000000000000000000000000000000000000"
			}],
			id: 1,
		}

		const jsonRpcRequest3 = {
			jsonrpc: "2.0",
			method: "eth_sendUserOperation",
			params: [{
				"sender": "0x1C65F7328eCa12C1f91E95d7E320859CC12CBD7c",
				"nonce": "0x0",
				"initCode": "0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5df20ffbc0000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000242ede3bc00000000000000000000000007a5ace512ff00447807bc7a63c5aac2beed1758d00000000000000000000000000000000000000000000000000000000",
				"callData": "0x0000189a0000000000000000000000007a939a944974e759a8365682682be1bd94c8a6d900000000000000000000000000000000000000000000000000005af3107a400000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000",
				"callGasLimit": "0x33f9",
				"verificationGasLimit": "0x4bc4b",
				"preVerificationGas": "0x156fe",
				"maxFeePerGas": "0x1970e86943",
				"maxPriorityFeePerGas": "0x3b9aca00",
				"paymasterAndData": "0x",
				"signature": "0x00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000001c5b32f37f5bea87bdd5374eb2ac54ea8e00000000000000000000000000000000000000000000000000000000000000410b5be9acdfee08f8cfa7cec9d6fba280adec5d685eeca7e9c0218751d5a2211f1528e54bd946b2b6bc69d9acd538567b053f34cb9562680e66e07e962342358d1b00000000000000000000000000000000000000000000000000000000000000"
			}],
			id: 1,
		}
		
		const promises = [
			request(app).post("/jsonrpc").send(jsonRpcRequest1).set("Content-Type", "application/json"),
			request(app).post("/jsonrpc").send(jsonRpcRequest2).set("Content-Type", "application/json"),
			request(app).post("/jsonrpc").send(jsonRpcRequest3).set("Content-Type", "application/json")
		]

		const responses = await Promise.all(promises)
		responses.forEach((response, index) => {
			console.log(`response ${index + 1}`, response.body)
			expect(response.status).toBe(200)
			expect(response.body.txHash).toBeDefined()
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
