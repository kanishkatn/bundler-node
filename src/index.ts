import express from "express"
import bodyParser from "body-parser"

const app = express()
app.use(bodyParser.json())

app.post("/jsonrpc", (req, res) => {
	const { jsonrpc, method, params, id } = req.body
	try {
		if (jsonrpc !== "2.0") {
			throw new Error("Invalid Request")
		}
    
		if (method === "echo") {
			const result = params.message || "No message provided"
			return res.json({
				jsonrpc: "2.0",
				result,
				id,
			})
		}
    
		throw new Error("Method not found")
	} catch (error: unknown) {
		let errorCode = -32600
		let errorMessage = "Unknown error"

		if (error instanceof Error) {
			errorMessage = error.message
			if (error.message === "Method not found") {
				errorCode = -32601
			}
		}
		return res.status(400).json({
			jsonrpc: "2.0",
			error: { code: errorCode, message: errorMessage },
			id,
		})
	}
})

if (process.env.NODE_ENV !== "test") {
	const PORT = process.env.PORT || 3000
	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`)
	})
}

export default app