# EOAManager

The `EOAManager` is designed to handle the management of Externally Owned Accounts (EOAs). It initializes from a list of private keys, allows acquiring and releasing EOAs to ensure they are used efficiently without conflicts, and tracks their availability status.

## Features

- **Initialization from private keys**: Configures EOAs from a comma-separated list of private keys.
- **Acquire an EOA with timeout**: Safely acquire an EOA with timeout handling.
- **Release an EOA**: Return an EOA to the available pool after use.
- **Check availability**: Verify the availability status of any EOA.
- **Count available and total EOAs**: Report how many EOAs are available and the total number managed.

## Basic Usage

### Importing and Initializing

Import and initialize the `EOAManager` with your private keys:

```js
import EOAManager from 'path_to_EOAManager';

const eoas = "key1,key2,key3";  // Replace with your actual private keys
const manager = new EOAManager(eoas);
```

### Acquiring an EOA

To acquire an EOA, specify how long the system should try before timing out:

```js
async function acquireEOA() {
    try {
        const eoa = await manager.acquireEOA(5000);  // Timeout in milliseconds
        console.log("Acquired EOA:", eoa.address);
        return eoa;
    } catch (error) {
        console.error("Failed to acquire EOA:", error);
    }
}
```

### Releasing an EOA

After using an EOA, release it back to the pool:

```js
async function releaseEOA(eoa) {
    await manager.releaseEOA(eoa);
    console.log("EOA released:", eoa.address);
}
```

### Checking EOA Status

Retrieve the availability status and counts:

```js
// Check if an EOA is available
const isAvailable = manager.getEOAStatus(eoa.address);
console.log("Is EOA available?", isAvailable);

// Get available and total EOAs
const availableEOAs = manager.availableEOAs();
const totalEOAs = manager.totalEOAs();
console.log(`Available/Total EOAs: ${availableEOAs}/${totalEOAs}`);
```

