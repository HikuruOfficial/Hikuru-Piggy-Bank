// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol"; 
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
// Inheriting from OpenZeppelin's ReentrancyGuard
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

enum YieldMode {
    AUTOMATIC,
    VOID,
    CLAIMABLE
}

enum GasMode {
    VOID,
    CLAIMABLE 
}

interface IBlast{
    // configure
    function configureContract(address contractAddress, YieldMode _yield, GasMode gasMode, address governor) external;
    function configure(YieldMode _yield, GasMode gasMode, address governor) external;

    // base configuration options
    function configureClaimableYield() external;
    function configureClaimableYieldOnBehalf(address contractAddress) external;
    function configureAutomaticYield() external;
    function configureAutomaticYieldOnBehalf(address contractAddress) external;
    function configureVoidYield() external;
    function configureVoidYieldOnBehalf(address contractAddress) external;
    function configureClaimableGas() external;
    function configureClaimableGasOnBehalf(address contractAddress) external;
    function configureVoidGas() external;
    function configureVoidGasOnBehalf(address contractAddress) external;
    function configureGovernor(address _governor) external;
    function configureGovernorOnBehalf(address _newGovernor, address contractAddress) external;

    // claim yield
    function claimYield(address contractAddress, address recipientOfYield, uint256 amount) external returns (uint256);
    function claimAllYield(address contractAddress, address recipientOfYield) external returns (uint256);

    // claim gas
    function claimAllGas(address contractAddress, address recipientOfGas) external returns (uint256);
    function claimGasAtMinClaimRate(address contractAddress, address recipientOfGas, uint256 minClaimRateBips) external returns (uint256);
    function claimMaxGas(address contractAddress, address recipientOfGas) external returns (uint256);
    function claimGas(address contractAddress, address recipientOfGas, uint256 gasToClaim, uint256 gasSecondsToConsume) external returns (uint256);

    // read functions
    function readClaimableYield(address contractAddress) external view returns (uint256);
    function readYieldConfiguration(address contractAddress) external view returns (uint8);
    function readGasParams(address contractAddress) external view returns (uint256 etherSeconds, uint256 etherBalance, uint256 lastUpdated, GasMode);
}


contract HikuruPiggyBank is ERC721Holder, ERC1155Holder, ReentrancyGuard {
    using SafeERC20 for IERC20; 
    IBlast public constant BLAST = IBlast(0x4300000000000000000000000000000000000002);


    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event CreateTransaction(address indexed owner,uint256 indexed txIndex);
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransactions(address indexed owner, uint256 indexed txIndex);

    event ContractDeployed(address[] owners, uint256 numConfirmationsRequired);


    address[] private _owners;
    mapping(address => bool) private _isOwner;
    uint256 public numConfirmationsRequired; // for Transaction
    uint256 public numConfirmationsRequiredForNewOwner; // For New Owner

    /*
        transactionType
        - 0 -> Transfer Native
        - 1 -> Transfer ERC20
        - 2 -> Transfer ERC721
        - 2 -> Transfer ERC1155
    */

    enum TransactionType { Native, ERC20, ERC721, ERC1155 }

    struct Transaction {
        address to;
        bytes data;
        address creator;
        string comment;
        uint256 value;
    }


    struct Data {
        address to;
        bytes data;
        uint256 value;
    }


    // mapping from tx index => owner => bool
    mapping(uint256 => mapping(address => bool)) public isConfirmedTransaction;
    mapping(uint256 => Transaction[]) private transactions;
    mapping(uint256 => bool) private isTransactionsExecuted;
    mapping(uint256 => uint256) private countOfConfirmations;
    mapping (address => uint) newOwnerConfirmation;
    mapping (address => uint) removeOwnerConfirmation;
    mapping (address => mapping(address => bool)) isConfirmedNewOwner;
    mapping (address => mapping(address => bool)) isConfirmedRemoveOwner;
    uint256 transactionsCount;

    modifier onlyHikuruOwner() {
        require(_isOwner[msg.sender], "not owner");
        _;
    }

    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactionsCount, "tx does not exist");
        _;
    }

    modifier notExecuted(uint256 _txIndex) {
        require(!isTransactionsExecuted[_txIndex], "tx already executed");
        _;
    }

    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmedTransaction[_txIndex][msg.sender], "tx already confirmed");
        _;
    }

    constructor(address[] memory owners_, uint256 numConfirmationsRequired_) {
        require(owners_.length > 0, "owners required");
        require(
            numConfirmationsRequired_ > 0 &&
                numConfirmationsRequired_ < owners_.length, // should be less because creator can confirm trasaction which he create
            "invalid number of confirmations"
        );

        BLAST.configureClaimableYield();
        BLAST.configureClaimableGas(); 

        for (uint256 i = 0; i < owners_.length; i++) {
            _addOwner(owners_[i]);
        }

        numConfirmationsRequired = numConfirmationsRequired_;
        numConfirmationsRequiredForNewOwner = _owners.length - 1;
    }



    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }


    function claimYield(address recipient, uint256 amount) external onlyHikuruOwner {
        // allow only the owner to claim the yield
        BLAST.claimYield(address(this), recipient, amount);
    }

    function claimAllYield(address recipient) external onlyHikuruOwner {
        // allow only the owner to claim the yield
        BLAST.claimAllYield(address(this), recipient);
    }

    function claimMyContractsGas() external onlyHikuruOwner {
        // allow only the owner to claim the gas
        BLAST.claimAllGas(address(this), msg.sender);
    }

    function createTransaction(
        Data[] memory data,
        string memory comment
    ) public onlyHikuruOwner returns (uint256) {
        require(data.length>0, "data is empty");

        uint256 txIndex = transactionsCount;
        // Create a storage reference to the array in the mapping
        Transaction[] storage storedTransactions = transactions[txIndex];

        for (uint i = 0; i < data.length; i++) {
            // Create a new Transaction memory and fill it
            Transaction memory newTransaction = Transaction({
                to: data[i].to,
                data: data[i].data,
                creator: msg.sender,
                comment: comment,
                value: data[i].value
            });

            // Push the new transaction to the storage array
            storedTransactions.push(newTransaction);
        }

        // add to trasnactions
        transactions[txIndex]=storedTransactions;
        // increament count
        transactionsCount += 1;
        // make event
        emit CreateTransaction(msg.sender, txIndex);

        return txIndex;
    }


    function confirmTransaction(
        uint256 _txIndex
    ) public onlyHikuruOwner txExists(_txIndex) notExecuted(_txIndex) notConfirmed(_txIndex) {
        Transaction storage transaction = transactions[_txIndex][0];

        require(transaction.creator!=msg.sender && transaction.creator!=address(0), "You cant confirm transaction which you created!");
        
        isConfirmedTransaction[_txIndex][msg.sender] = true;
        countOfConfirmations[_txIndex]+=1;

        emit ConfirmTransaction(msg.sender, _txIndex);
        if(countOfConfirmations[_txIndex]>= numConfirmationsRequired){
            executeTransaction(_txIndex);
        }
    }

    function executeTransaction(uint256 _txIndex) private onlyHikuruOwner txExists(_txIndex) notExecuted(_txIndex) nonReentrant{
        // Assuming you have a 2D array of transactions
        Transaction[] storage txList = transactions[_txIndex];
        require(!isTransactionsExecuted[_txIndex], "transaction already executed");
        require(countOfConfirmations[_txIndex] >= numConfirmationsRequired, "cannot execute tx");

        isTransactionsExecuted[_txIndex] = true;

        for (uint i = 0; i < txList.length; i++) {
            Transaction memory transaction = txList[i];
            if(transaction.data.length == 0){
                (bool success, ) = transaction.to.call{value: transaction.value}("");
                require(success, "tx failed");
            }
            else{
                (bool success, ) = transaction.to.call(transaction.data);
                require(success, "Transaction failed");
            }
        }

        emit ExecuteTransactions(msg.sender, _txIndex);
    }

    function revokeConfirmation(
        uint256 _txIndex
    ) public onlyHikuruOwner txExists(_txIndex) notExecuted(_txIndex) {
        Transaction storage transaction = transactions[_txIndex][0];

        require(transaction.creator!=msg.sender && transaction.creator!=address(0), "tx not confirmed");

        isConfirmedTransaction[_txIndex][msg.sender] = false;
        countOfConfirmations[_txIndex] -= 1;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    
    function getTransaction(uint256 _txIndex)
        public
        view
        txExists(_txIndex)
        returns (Transaction[] memory transList, bool executed, uint256 numConfirmations)
    {
        require(_txIndex < transactionsCount, "Transaction index out of bounds");
        
        // Get the array of transactions at the given index
        Transaction[] memory txList = transactions[_txIndex];
        
        return (txList, isTransactionsExecuted[_txIndex], countOfConfirmations[_txIndex]);
    }


    function getOwners() public view returns (address[] memory) {
        return _owners;
    }

    function getLastTransactionId() public view returns (uint256) {
        if (transactionsCount == 0) {
            return 0; // Or revert if you prefer no transactions to be an error condition
        } else {
            return transactionsCount - 1;
        }
    }





    // New function to add owners
    function addOwner(address newOwner) public onlyHikuruOwner {
        require(newOwner != address(0), "Invalid new owner address");
        require(!_isOwner[newOwner], "Owner already exists");
        require(!isConfirmedNewOwner[newOwner][msg.sender], "Owner already confirmed by you");
        isConfirmedNewOwner[newOwner][msg.sender] = true;
    }

    function removeOwner(address ownerToRemove) public onlyHikuruOwner {
        require(_isOwner[ownerToRemove], "Not an owner");
        require(!isConfirmedRemoveOwner[ownerToRemove][msg.sender], "Owner already confirmed by you");
        isConfirmedRemoveOwner[ownerToRemove][msg.sender] = true;
    }

    function confirmAddNewOwner(address newOwner) public onlyHikuruOwner {
        require(newOwner != address(0), "Invalid new owner address");
        require(!_isOwner[newOwner], "Owner already exists");
        require(!isConfirmedNewOwner[newOwner][msg.sender], "Owner confirmed by you");

        isConfirmedNewOwner[newOwner][msg.sender] = true;
        newOwnerConfirmation[newOwner] += 1;

        if (newOwnerConfirmation[newOwner] >= numConfirmationsRequiredForNewOwner) {
            _addOwner(newOwner);
            _resetConfirmationStates(newOwner, true); // Reset confirmation states for all owners
        }
    }

    function confirmRemoveOwner(address ownerToRemove) public onlyHikuruOwner {
        require(_isOwner[ownerToRemove], "Not an owner");
        require(!isConfirmedRemoveOwner[ownerToRemove][msg.sender], "Owner confirmed by you");
        isConfirmedRemoveOwner[ownerToRemove][msg.sender] = true;
        removeOwnerConfirmation[ownerToRemove] += 1;

        if (removeOwnerConfirmation[ownerToRemove] >= numConfirmationsRequiredForNewOwner) {
            _removeOwner(ownerToRemove); // Use an internal function similar to _addOwner
            _resetConfirmationStates(ownerToRemove, false); // Reset confirmation states for all owners
        }
    }

    // Internal function to reset confirmation states
    function _resetConfirmationStates(address owner, bool isAdd) private {
        if (isAdd) {
            for (uint i = 0; i < _owners.length; i++) {
                isConfirmedNewOwner[owner][_owners[i]] = false;
            }
            newOwnerConfirmation[owner] = 0;
        } else {
            for (uint i = 0; i < _owners.length; i++) {
                isConfirmedRemoveOwner[owner][_owners[i]] = false;
            }
            removeOwnerConfirmation[owner] = 0;
        }
    }


    function _addOwner(address newOwner) private {
        require(newOwner != address(0), "Invalid new owner address");
        require(!_isOwner[newOwner], "Owner already exists");

        _isOwner[newOwner] = true;
        _owners.push(newOwner);
    }

    function _removeOwner(address ownerToRemove) private {
        require(_isOwner[ownerToRemove], "Not an owner");

        _isOwner[ownerToRemove] = false;

        // Find the owner to remove in the array and replace it with the last owner
        for (uint256 i = 0; i < _owners.length; i++) {
            if (_owners[i] == ownerToRemove) {
                _owners[i] = _owners[_owners.length - 1];
                break;
            }
        }
        _owners.pop(); // Remove the last element

        // Optionally, you might want to adjust numConfirmationsRequiredForNewOwner
        // For example, if you want it to always be one less than the number of owners
        if (_owners.length > 1) {
            numConfirmationsRequiredForNewOwner = _owners.length - 1;
        } else {
            numConfirmationsRequiredForNewOwner = 1;
        }
    }
}
