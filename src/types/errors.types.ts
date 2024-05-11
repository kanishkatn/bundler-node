/**
 * NetworkError is thrown when a rpc request to the blockchain fails.
 */
export class NetworkError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "NetworkError"
	}
}

/**
 * TimeoutError is thrown when a tx or rpc request times out.
 */
export class TimeoutError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "TimeoutError"
	}
}

/**
 * TransactionFailedError is thrown when a transaction fails after few attempts.
 */
export class TransactionFailedError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "TransactionFailedError"
	}
}

/**
 * ContractError is thrown when a contract call fails.
 */
export class ContractError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ContractError"
	}
}