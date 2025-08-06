// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/vault.sol"; // Asegúrate de que la ruta sea correcta

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        // Despliega el contrato TimeLockVaultFactory
        TimeLockVaultFactory deployed = new TimeLockVaultFactory(address(0));

        // Muestra la dirección del contrato desplegado
        console.log("TimeLockVaultFactory desplegado en:", address(deployed));

        vm.stopBroadcast();
    }
}

