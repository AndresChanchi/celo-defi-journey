// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract HelloWorld {
    address public owner;
    constructor() {
        owner = msg.sender;
    }
    function greet(string memory name) external pure returns (string memory) {
        return string(abi.encodePacked("Hello, ", name, "!"));
    }
}
