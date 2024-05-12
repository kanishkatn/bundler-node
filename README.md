# Bundler Node

This is a minimal bundler node that is capable of accepting ERC-4337 UserOperations, executing them on a supported chain, and returning the transaction hash in response.

## Folder Structure
```
src
├── entrypoint
│   ├── entrypoint.ts
│   └── entrypoint.abi.ts
├── managers
│   ├── eoaManager.ts
│   └── userOpManager.ts
│   └── txMonitor.ts
├── types
│   ├── chain.types.ts
│   ├── errors.types.ts
│   └── userOp.types.ts
├──docs
│   ├──eoaManager.md
│   ├──userOpManager.md
├── index.js
└── rpcHelper.ts
```

`src/index.js`
This file contains an Express server that exposes the JSON-RPC API endpoint for executing UserOperations.

`src/entrypoint/`

`entrypoint.ts`
This file contains a wrapper that submits UserOperations to the EntryPoint contract by calling the handleOps method. It is responsible for executing the UserOperations on the blockchain.

`entrypoint.abi.ts`
This file contains the ABI (Application Binary Interface) of the EntryPoint contract, which is used for interacting with the contract.

`src/managers/`

`eoaManager.ts`
This module manages the Externally Owned Accounts (EOAs) used for sending actual blockchain transactions. It ensures that transactions are sent from at least two different EOAs and handles any stuck or failed transactions.

`userOpManager.ts`
This module manages the UserOperation submissions and retries. It is responsible for handling the execution of UserOperations and their lifecycle.

`txMonitor.ts`
This module monitors a txHash and emits the events accordingly.

`src/types/`

`chain.types.ts`
This file contains helper types to handle the supported blockchain chains.

`errors.types.ts`
This file defines the custom error types used throughout the application.

`userOp.types.ts`
This file defines the type for UserOperations.

`src/rpcHelper.ts`
This module contains a helper class (RPCHelper) that provides methods for making blockchain RPC calls. It abstracts the communication with the blockchain node and simplifies the process of querying blockchain data.

`docs`

Documentation on `UserOpManager` and `EOAManager`.

## API Documentation

The bundler node exposes the following JSON-RPC API endpoint:

`eth_sendUserOperation`

This API executes the incoming UserOperation on a selected chain and returns the transaction hash to the client.

Request:
```json
{
    "jsonrpc": "2.0",
    "method": "eth_sendUserOperation",
    "params": [{
				"sender": "0x",
				"nonce": "0x0",
				"initCode": "0x",
				"callData": "0x",
				"callGasLimit": "0x",
				"verificationGasLimit": "0x",
				"preVerificationGas": "0x",
				"maxFeePerGas": "0x",
				"maxPriorityFeePerGas": "0x",
				"paymasterAndData": "0x",
				"signature": "0x"
			}],
    "id": 1
}
```

Response:
```json
{
  "jsonrpc":"2.0",
  "txHash":"0x",
  "id":1
}
```

The API follows the JSON-RPC 2.0 specification.

## Running the node

### Environment

Node: v22.1.0

npm: 10.7.0

### Installation

```
npm i
```

### Build the node

```
npm run build
```

### Update the config
Update the `config.json` with eoas and entrypoint contract. Modify other values as necessary.

```json
{
    "server": {
        "name": "Bundler node",
        "port": 3000
    },
    "chain": "sepolia",
    "entrypointContract":"0x",
    "eoas": "0x,0x",
    "eoaWaitTimeMS": 5000,
    "txWaitTimeMS": 120000,
    "maxAttempts": 3
}
```

### Run the node
```
npm run start
```

or just run the dev server
```
npm run dev
```

## Testing the node

The project contains few testcases but it needs detailed integration tests. Here's how you can test it manually.

### Run the node

Run the node by following the instructions above.

### Obtain an userOp

Best way to get a user op is from the [playground repository](https://github.com/bcnmy/sdk-examples/tree/master). Once you have obtained the userOp for sepolia, send it to the node with curl

```curl
curl -X POST localhost:3000/jsonrpc \
-H "Content-Type: application/json" \
-d '{
    "jsonrpc": "2.0",
    "method": "eth_sendUserOperation",
    "params": [{
				"sender": "0x",
				"nonce": "0x0",
				"initCode": "0x",
				"callData": "0x",
				"callGasLimit": "0x",
				"verificationGasLimit": "0x",
				"preVerificationGas": "0x",
				"maxFeePerGas": "0x",
				"maxPriorityFeePerGas": "0x",
				"paymasterAndData": "0x",
				"signature": "0x"
			}],
    "id": 1
}'
```

If you'd like to use a test suite, please refer to `index.test.ts`. Replace the test there accordingly and remove `.skip()`.

## Further improvements

- Integration tests for `userOpManager.ts` and the bundler node.