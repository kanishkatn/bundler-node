import express from "express"
import bodyParser from "body-parser"
import { ERC4337EntryPoint } from "./entrypoint/entrypoint"
import { IENTRY_POINT_ABI } from "./entrypoint/entrypoint.abi"
import { RPCHelper } from "./rpcHelper"
import EOAManager from "./eoaManager"
import config from "../config.json"
import { Address, TimeoutError } from "viem"
import UserOpManager from "./userOpManager"
import { ContractError, InvalidUserOperationError, NetworkError } from "./types/errors.types"
import { parseUserOperation } from "./types/userop.types"

const app = express()
app.use(bodyParser.json())

// Initialise the modules
const entrypoint = new ERC4337EntryPoint(config.entrypointContract as Address, IENTRY_POINT_ABI)
const rpcHelper = new RPCHelper()
const eoaManager = new EOAManager(config.eoas)
const userOpManager = new UserOpManager(eoaManager, config.eoaWaitTimeMS, config.txWaitTimeMS, entrypoint, rpcHelper, config.maxAttempts)

app.locals.userOpManager = userOpManager
app.locals.beneficiary = config.beneficiary

app.post("/jsonrpc", async (req, res) => {
	const { jsonrpc, method, params, id } = req.body
	try {
		if (jsonrpc !== "2.0") {
			throw new Error("Invalid Request")
		}
    
		if (method === "eth_sendUserOperation") {
			if (!params || params.length < 1) {
				throw new InvalidUserOperationError("Invalid params")
			}
			const data = params[0]
			if (!data) {
				throw new InvalidUserOperationError("empty user operation")
			}

			const userOp = parseUserOperation(data)
			console.debug("userOp", userOp)

			const txHash = await userOpManager.handleUserOp([userOp], app.locals.beneficiary)
			return res.status(200).json({ jsonrpc: "2.0", txHash, id })
		}
    
		throw new Error("Method not found")
	} catch (error: unknown) {
		let errorCode = -32600
		let errorMessage = "Unknown error"

		switch (true) {
		case error instanceof NetworkError:
			errorMessage = `Network error: ${error.message}. Please try again later.`
			errorCode = -32603
			break
		case error instanceof TimeoutError:
			errorMessage = `Timeout error: ${error.message}. Please try again later.`
			errorCode = -32603
			break
		case error instanceof InvalidUserOperationError:
			errorMessage = `Invalid user operation: ${error.message}. Please check the user operation and try again.`
			errorCode = -32602
			break
		case error instanceof ContractError:
			errorMessage = `Contract error: ${error.message}. Please try again later.`
			errorCode = -32603
			break
		case error instanceof Error:
			errorMessage = `Internal error: ${(error as Error).message}. Please try again later.`
			if (error.message === "Method not found") {
				errorCode = -32601
			}
			break
		}

		return res.status(400).json({
			jsonrpc: "2.0",
			error: { code: errorCode, message: errorMessage },
			id,
		})
	}
})

if (process.env.NODE_ENV !== "test") {
	const PORT = config.server.port || 3000
	app.listen(PORT, () => {
		console.log(`${config.server.name} is running on http://localhost:${PORT}`)
	})
}

export default app