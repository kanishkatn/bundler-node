import request from "supertest"
import app from "../src/index"
import { Server } from "http"

describe("Express Server", () => {
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

	it("should respond correctly to a JSON-RPC \"echo\" request", async () => {
		const jsonRpcRequest = {
			jsonrpc: "2.0",
			method: "echo",
			params: { message: "Hello, World!" },
			id: 1,
		}

		const response = await request(app)
			.post("/jsonrpc")
			.send(jsonRpcRequest)
			.set("Content-Type", "application/json")

		expect(response.status).toBe(200)
		expect(response.body.jsonrpc).toBe("2.0")
		expect(response.body.result).toBe("Hello, World!")
		expect(response.body.id).toBe(1)
	})
})
