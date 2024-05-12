# UserOpManager

The `UserOpManager` is a class that manages the sending of user operations to the ERC-4337 EntryPoint contract. It acquires an EOA (Externally Owned Account) from the `EOAManager`, sends the user operation, and releases the EOA. It also monitors the transaction status and retries if necessary.

## Features

- **Acquire and Release EOAs**: Manages EOAs efficiently to ensure no conflicts or resource starvation.
- **Transaction Monitoring**: Monitors the transaction status and retries if necessary
- **Error Handling**: Handles transaction failures and timeouts
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