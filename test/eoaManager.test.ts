import EOAManager from "../src/managers/eoaManager"

describe("EOAManager Tests", () => {
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
	const timeoutMs = 1000

	beforeEach(() => {
		const eoaString = `${eoas[0].privKey},${eoas[1].privKey}`
		eoaManager = new EOAManager(eoaString)
	})

	test("should initialize EOAs correctly", () => {
		expect(eoaManager).toBeDefined()
		expect(eoaManager.acquireEOA(timeoutMs)).resolves.toBeDefined()
	})

	test("should throw error if EOAs cannot be initialized", async () => {
		expect(() => {
			new EOAManager("")
		}).toThrow("Need at least 2 EOAs")
	})

	test("should throw error if less than 2 EOAs are set", async () => {
		const eoaString = eoas[0].privKey
		expect(() => {
			new EOAManager(eoaString)
		}).toThrow("Need at least 2 EOAs")
	})

	test("should throw error if invalid EOA is set", async () => {
		const eoaString = "invalidEOA1,invalidEOA2"
		expect(() => {
			new EOAManager(eoaString)
		}).toThrow("private key must be 32 bytes, hex or bigint, not string")
	})

	test("should get available EOA", async () => {
		const availableEOA = await eoaManager.acquireEOA(timeoutMs)
		expect(availableEOA).toBeDefined()
		expect(availableEOA.address).toBe(eoas[0].address)
	})

	test("should signal EOA release", async () => {
		const availableEOA = await eoaManager.acquireEOA(timeoutMs)
		expect(availableEOA).toBeDefined()
    
		await eoaManager.releaseEOA(availableEOA)
    
		const secondEOA = await eoaManager.acquireEOA(timeoutMs)
		expect(secondEOA).toBeDefined()
		expect(secondEOA.address).toBe(eoas[0].address)
	})

	test("should update eoa status correctly", async () => {
		const availableEOA = await eoaManager.acquireEOA(timeoutMs)
		expect(availableEOA).toBeDefined()
		expect(eoaManager.getEOAStatus(availableEOA.address)).toBe(true)
		await eoaManager.releaseEOA(availableEOA)
		expect(eoaManager.getEOAStatus(availableEOA.address)).toBe(false)
	})

	test("should timeout if no EOAs are available", async () => {
		const availableEOA1 = await eoaManager.acquireEOA(timeoutMs)
		expect(availableEOA1).toBeDefined()
		const availableEOA2 = await eoaManager.acquireEOA(timeoutMs)
		expect(availableEOA2).toBeDefined()
	
		const secondEOAPromise = eoaManager.acquireEOA(timeoutMs)
		await expect(secondEOAPromise).rejects.toThrow("No available EOAs")
	})

	test("should avoid deadlocks when signaling EOA release", async () => {
		const firstEOA = await eoaManager.acquireEOA(timeoutMs)
		const secondEOA = await eoaManager.acquireEOA(timeoutMs)

		const thirdEOA = eoaManager.acquireEOA(timeoutMs)

		jest.useFakeTimers()
		setTimeout(async () => {
			await eoaManager.releaseEOA(firstEOA)
		}, timeoutMs/2)
		jest.advanceTimersByTime(timeoutMs/2)

		// After releasing the EOA, ensure the third EOA can be acquired without deadlock
		await expect(thirdEOA).resolves.toBeDefined()
		jest.useRealTimers()
		await eoaManager.releaseEOA(secondEOA)
	})
})
