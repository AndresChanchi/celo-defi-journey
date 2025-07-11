// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/HelloWorld.sol";

contract DeployScript is Script {
    function run() external {
        // Inicia el broadcast: todo lo que esté entre start/stop se firma y envía
        vm.startBroadcast();
        // Despliega el contrato HelloWorld
        HelloWorld deployed = new HelloWorld();
        // Opcional: emite un log con la dirección desplegada
        console.log("Contrato desplegado en:", address(deployed));
        vm.stopBroadcast();
    }
}
