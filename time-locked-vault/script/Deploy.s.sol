// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/vault.sol";

contract DeployScript is Script {
    function run() external {
        // Lee clave privada como bytes32 (acepta hex sin 0x)
        bytes32 key = vm.envBytes32("PRIVATE_KEY");
        uint256 deployerKey = uint256(key);

        vm.startBroadcast(deployerKey);
        TimeLockVaultFactory factory = new TimeLockVaultFactory(address(0));
        vm.stopBroadcast();

        console.log("Factory deployed at:", address(factory));
    }
}

