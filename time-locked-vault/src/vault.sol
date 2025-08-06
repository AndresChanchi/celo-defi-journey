// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20 {
  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external returns (bool);

  function transfer(address to, uint256 amount) external returns (bool);
}

contract TimeLockVaultFactory {
  address public immutable owner;

  uint256 private nextVaultId;

  struct Vault {
    address creator;
    address token;
    uint256 amount;
    uint256 unlockTime;
    bool withdrawn;
  }

  mapping(uint256 => Vault) public vaults;
  mapping(address => uint256[]) public userVaults;

  constructor(address _owner){
    owner = _owner == address(0) ? msg.sender : _owner;
  }

  function createVaultCelo(
    uint256 _unlockTime
  ) external payable returns (uint256 newVaultId) {
    require(msg.value > 0, "No CELO sent");
    require(_unlockTime > block.timestamp, "Unlock time must be in future");

    uint256 vaultId = _storeVault(msg.sender, address(0), msg.value, _unlockTime);
    newVaultId = vaultId;
    return newVaultId;
  }

  function createVaultERC20(
    address token,
    uint256 amount,
    uint256 _unlockTime
) external returns (uint256 newVaultId) {
    require(token != address(0), "Invalid token address");
    require(amount > 0, "Amount must be > 0");
    require(_unlockTime > block.timestamp, "Unlock time must be in future");

    bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
    require(ok, "Token transfer failed");

    uint256 vaultId = _storeVault(msg.sender, token, amount, _unlockTime);
    newVaultId = vaultId;
}

  function _storeVault(
    address creator,
    address token,
    uint256 amount,
    uint256 _unlockTime
  ) private returns (uint256 vaultId) {
    vaultId = nextVaultId++;

    vaults[vaultId] = Vault ({
      creator: creator,
      token: token,
      amount: amount,
      unlockTime: _unlockTime,
      withdrawn: false
    });

    userVaults[creator].push(vaultId);

    return vaultId;
  }

  function withdraw(uint256 vaultId) external {
    Vault storage v = vaults[vaultId];

    require(v.creator != address(0), "Vault does not exist");
    require(msg.sender == v.creator, "Not vault creator");
    require(block.timestamp >= v.unlockTime, "Too early");
    require(!v.withdrawn, "Already withdrawn");

    v.withdrawn = true;
    if(v.token == address(0))
      {
        payable(v.creator).transfer(v.amount);
      }
      else{
        bool ok = IERC20(v.token).transfer(v.creator, v.amount);
        require(ok, "Token transfer failed");
      }
  }

  receive() external payable{
    revert("Use createVaultCelo()");
  }
}
