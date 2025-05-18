const contractAddress = "0xDD269379C82F1146824cf4BfdB87c263A8DF6806";
let contractABI = null;
let loaded = false;

window.addEventListener("load", async () => {
    const response = await fetch("contractABI.json");
    contractABI = await response.json();
    loaded = true;
});

let web3;
let contract;
let userAccount;
let connected = false;

async function connectWallet() {
    if (window.ethereum && loaded) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        userAccount = (await web3.eth.getAccounts())[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        alert(`Connected: ${userAccount} + ${ contract}`);
        console.log(contract.methods);
        connected = true;
        document.querySelector('.contract-operation-container').style.display = "flex";

        await getCollateralBalance();
        await getLoanBalance();
    } else {
        alert("Please install MetaMask");
    }
}

async function deposit() {
    try {
        const depositAmount = document.querySelector('.deposit-input').value;
        await contract.methods.deposit().send({
            from: userAccount, 
            value: web3.utils.toWei(depositAmount, "ether") 
        });
        alert("Deposited!");
        document.querySelector('.deposit-input').value = 0;
        await getCollateralBalance();
    } catch(error){
        console.log(error.message);
    }
}

async function withdraw() {
    const withdrawAmount = document.querySelector('.withdraw-input').value;
    await contract.methods.withdraw(web3.utils.toWei(withdrawAmount, "ether")).send({
         from: userAccount 
    });
    alert("Withdrew!");
    document.querySelector('.withdraw-input').value = 0;
    await getCollateralBalance();
}

async function borrow() {
    const borrowAmount = document.querySelector('.borrow-input').value;

    await contract.methods.borrow(web3.utils.toWei(borrowAmount, "ether")).send({ from: userAccount });
    alert("Borrowed!");
    document.querySelector('.borrow-input').value = 0;
    await getLoanBalance();
}

async function repay() {
    const repayAmount = document.querySelector('.repay-input').value;
    await contract.methods.repay().send({ 
        from: userAccount, 
        value: web3.utils.toWei(repayAmount, "ether") 
    });
    alert("Repaid Loan!");
    document.querySelector('.repay-input').value = 0;
    await getLoanBalance();
}

async function getCollateralBalance(){

    try{
        const balance = await contract.methods.getCollateralBalance().call({ 
            from: userAccount
        });
        document.querySelector('.collateral-balance').innerHTML = web3.utils.fromWei(balance, "ether");
    } catch(error){
        console.error(error);
    }
    
}

async function getLoanBalance() {
    const balance = await contract.methods.getLoanBalance().call({ 
        from: userAccount
    });
    document.querySelector('.loan-balance').innerHTML = web3.utils.fromWei(balance, "ether");
}