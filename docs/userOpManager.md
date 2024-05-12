# UserOpManager

`UserOpManager` is a class designed for managing and processing user operations from Externally Owned Accounts (EOAs). It coordinates the acquisition of EOAs from the `EOAManager`, submits user operations, monitors transaction statuses, and handles retries in case of failures or delays.

## Features

- **Acquire and Release EOAs**: Manages EOAs efficiently to ensure no conflicts or resource starvation.
- **Transaction Monitoring**: Monitors the status of blockchain transactions and handles retries if the transaction fails or times out.
- **Error Handling**: Implements robust error handling for timeouts and transaction failures, improving reliability.
- **Concurrency Management**: Handles operations asynchronously to improve throughput and reduce latency.

## Basic Usage

### Importing

First, import the UserOpManager from its location:

```js
import UserOpManager from './path_to_UserOpManager';
import EOAManager from './path_to_EOAManager';
import ERC4337EntryPoint from './path_to_ERC4337EntryPoint';
import RPCHelper from './path_to_RPCHelper';
```

### Initialization

Create instances of the required classes and initialize the UserOpManager:

```js
const eoas = "key1,key2,key3";
const eoaManager = new EOAManager(eoas);
const entryPoint = new ERC4337EntryPoint();
const rpcHelper = new RPCHelper();
const eoaWaitTime = 5000
const txWaitTime = 120000
const maxRetries = 3
const userOpManager = new UserOpManager(eoaManager, eoaWaitTime, txWaitTime, entryPoint, rpcHelper, maxRetries, "sepolia");
```

### Handling User Operations

Use the UserOpManager to handle user operations:

```js
const userOperations = [{...}]; // Define user operations

userOpManager.handleUserOp(userOperations)
    .then(hash => console.log('Transaction Hash:', hash))
    .catch(error => console.error('Error handling user operation:', error));
```

### Monitoring and Retries

The UserOpManager monitors each transaction and automatically retries up to a maximum number of attempts specified during initialization. This ensures that user operations are likely to succeed even in the face of network issues or other operational challenges.