// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/HelloWorld.sol";

contract HelloWorldTest is Test {
    HelloWorld public hello;

    function setUp() public {
        hello = new HelloWorld();
    }
    function testGreet() public {
        // Llamamos greet con "Alice"
        string memory salida = hello.greet("Alice");
        // AssertEq compara dos strings y falla si no coinciden
        assertEq(salida, "Hello, Alice!");
    }
}
