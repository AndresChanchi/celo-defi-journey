// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/vault.sol";
import "./MockERC20.sol";

contract TimeLockVaultFactoryTest is Test {
    TimeLockVaultFactory public factory;
    address public bob = address(0x2);

    function setUp() public {
        factory = new TimeLockVaultFactory(address(0));
        vm.deal(bob, 10 ether);
        vm.deal(address(this), 10 ether);
    }

    receive() external payable {}

    function test_CeloVault_HappyPath() public {
        uint256 lockAmount = 1 ether;
        uint256 unlockTime = block.timestamp + 1 days;

        uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);

        (address creator, address token, uint256 amount, uint256 vaultUnlockTime, bool withdrawn) = factory.vaults(vaultId);
        assertEq(creator, address(this));
        assertEq(token, address(0));
        assertEq(amount, lockAmount);
        assertEq(vaultUnlockTime, unlockTime);
        assertEq(withdrawn, false);

        vm.warp(block.timestamp + 1 days + 1);

        uint256 balanceBefore = address(this).balance;
        factory.withdraw(vaultId);
        (,, , , withdrawn) = factory.vaults(vaultId);
        assertEq(withdrawn, true);

        uint256 balanceAfter = address(this).balance;
        assertEq(balanceAfter, balanceBefore + lockAmount);
    }

    function test_ERC20Vault_HappyPath() public {
        MockERC20 token = new MockERC20();
        uint256 lockAmount = 100 ether;
        uint256 unlockTime = block.timestamp + 1 days;

        token.approve(address(factory), lockAmount);
        uint256 vaultId = factory.createVaultERC20(address(token), lockAmount, unlockTime);

        (address creator, address vaultToken, uint256 amount,, bool withdrawn) = factory.vaults(vaultId);
        assertEq(creator, address(this));
        assertEq(vaultToken, address(token));
        assertEq(amount, lockAmount);
        assertEq(withdrawn, false);

        vm.warp(block.timestamp + 1 days + 1);
        factory.withdraw(vaultId);
        (,, , , withdrawn) = factory.vaults(vaultId);
        assertEq(withdrawn, true);
        assertEq(token.balanceOf(address(this)), 1000 ether); // Se ajusta según constructor
    }

    function test_CreateVaultWithZeroAmount() public {
        uint256 unlockTime = block.timestamp + 1 days;

        vm.expectRevert("No CELO sent");
        factory.createVaultCelo{value: 0}(unlockTime);
    }

    function test_CreateVaultWithPastUnlockTime() public {
      uint256 pastTime = 1;
      vm.expectRevert("Unlock time must be in future");
      factory.createVaultCelo{value: 1}(pastTime);
    }


    function test_WithdrawTooEarly() public {
        uint256 lockAmount = 1 ether;
        uint256 unlockTime = block.timestamp + 1 days;
        uint256 vaultId = factory.createVaultCelo{value: lockAmount}(unlockTime);

        vm.expectRevert("Too early");
        factory.withdraw(vaultId);
    }
}

