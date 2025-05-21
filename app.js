const contractAddress = "0x1cd3d5C9302bEe9AEc8910a2C9df3B84BA63a4Ee";
let contractABI = null;
let loaded = false;

window.addEventListener("load", async () => {
    const response = await fetch("contractABI.json");
    contractABI = await response.json();
    loaded = true;
});

let web3;
let BN;
let contract;
let userAccount;
let tokenContract;
let tokenAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
let connected = false;
let isTransactionLoading = false;

async function connectWallet() {
    if (window.ethereum && loaded) {
        web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        userAccount = (await web3.eth.getAccounts())[0];
        contract = new web3.eth.Contract(contractABI, contractAddress);
        alert(`Connected to the wallet address: ${userAccount}`);

        tokenContract = new web3.eth.Contract([
            {
                "constant": false,
                "inputs": [
                    { "name": "spender", "type": "address" },
                    { "name": "amount", "type": "uint256" }
                ],
                "name": "approve",
                "outputs": [{ "name": "", "type": "bool" }],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ], tokenAddress);

        BN = web3.utils.BN;

        connected = true;
        document.querySelector('.contract-operation-container').style.display = "flex";

        const connectButton = document.querySelector('.connect-button');
        
        connectButton.innerHTML = 'Connected!';
        connectButton.disabled = true;


        await getCollateralBalance();
        await getLoanBalance();
        await getAvailableFunds();
        await getETHtoUSDCPrice();
        // await getAvailableAmountOfLoans();

    } else {
        alert("Please install MetaMask");
    }
}

async function depositETH() {
    try {
        toggleLoading();

        const depositAmount = document.querySelector('.deposit-input').value;
        await contract.methods.depositETH().send({
            from: userAccount, 
            value: web3.utils.toWei(depositAmount, "ether") 
        });
        alert("Collateral deposited successfully!");
        document.querySelector('.deposit-input').value = "";
        await getCollateralBalance();

        toggleLoading();
    } catch(error){
        console.log(error.message);
        toggleLoading();
    }
}

async function withdrawETH() {
    try{
        toggleLoading();

        const withdrawAmount = document.querySelector('.withdraw-input').value;
        await contract.methods.withdrawETH(web3.utils.toWei(withdrawAmount, "ether")).send({
            from: userAccount 
        });
        alert("Collateral withdrawn successfully!");
        document.querySelector('.withdraw-input').value = "";
        await getCollateralBalance();

        toggleLoading();
    } catch(error){
        toggleLoading();
    }
    
}


async function depositUSDC() {
    try {
        toggleLoading();

        const depositAmount = document.querySelector('.deposit-USDC-input').value;
        
        const decimals = 6;
        const amount = new BN(depositAmount).mul(new BN(10).pow(new BN(decimals)));

        await tokenContract.methods.approve(contractAddress, amount).send({ from: userAccount});

        await contract.methods.depositToken(amount).send({
            from: userAccount
        });
        alert("Collateral deposited successfully!");
        document.querySelector('.deposit-USDC-input').value = "";
        await getCollateralBalance();

        toggleLoading();
    } catch(error){
        console.log(error.message);
        toggleLoading();
    }
}

async function withdrawUSDC() {
    try{
        toggleLoading();

        const withdrawAmount = document.querySelector('.withdraw-USDC-input').value;

        const decimals = 6;
        const amount = new BN(withdrawAmount).mul(new BN(10).pow(new BN(decimals)));

        await contract.methods.withdrawToken(amount.toString()).send({
            from: userAccount 
        });
        alert("Collateral withdrawn successfully!");
        document.querySelector('.withdraw-USDC-input').value = "";
        await getCollateralBalance();

        toggleLoading();
    } catch(error){
        toggleLoading();
    }
    
}

async function borrowETH() {
    try{
        toggleLoading();
        const borrowAmount = document.querySelector('.borrow-input').value;

        await contract.methods.borrowETH(web3.utils.toWei(borrowAmount, "ether")).send({ from: userAccount });
        alert("Loan borrowed successfully!");
        document.querySelector('.borrow-input').value = "";
        await getLoanBalance();
        await getAvailableFunds();

        toggleLoading();
    } catch(error){
        toggleLoading();
    }
    
}

async function repayETH() {
    try{
        toggleLoading();
        const repayAmount = document.querySelector('.repay-input').value;
        await contract.methods.repayETH().send({ 
            from: userAccount, 
            value: web3.utils.toWei(repayAmount, "ether") 
        });
        alert("Loan repaid successfully!");
        document.querySelector('.repay-input').value = "";
        await getLoanBalance();
        await getAvailableFunds();
        toggleLoading();
    } catch(error){
        toggleLoading();
    }
    
}

async function fundETH(){
    try {
        toggleLoading();

        const fundAmount = document.querySelector('.fund-input').value;
        await contract.methods.fundETH().send({
            from: userAccount, 
            value: web3.utils.toWei(fundAmount, "ether") 
        });
        alert("Collateral funded successfully!");
        document.querySelector('.fund-input').value = "";

        await getAvailableFunds();

        toggleLoading();
    } catch(error){
        console.log(error.message);
        toggleLoading();
    }
}

async function fundToken() {
    try {
        toggleLoading();

        const fundAmount = document.querySelector('.fund-USDC-input').value;
        
        const decimals = 6;
        const amount = new BN(fundAmount).mul(new BN(10).pow(new BN(decimals)));

        await tokenContract.methods.approve(contractAddress, amount).send({ from: userAccount });

        await contract.methods.fundToken(amount).send({
            from: userAccount
        });
        alert("Collateral funded successfully!");
        document.querySelector('.fund-USDC-input').value = "";

        await getAvailableFunds();

        toggleLoading();
    } catch(error){
        console.log(error.message);
        toggleLoading();
    }
}


async function refundETH(){
    try {
        toggleLoading();

        const refundAmount = document.querySelector('.refund-input').value;
        await contract.methods.refundETH(web3.utils.toWei(refundAmount, "ether")).send({
            from: userAccount 
        });
        alert("ETH refunded successfully!");
        document.querySelector('.refund-input').value = "";

        await getAvailableFunds();

        toggleLoading();
    } catch(error){
        console.log(error.message);
        toggleLoading();
    }
}

async function refundToken() {
    try {
        toggleLoading();

        const refundAmount = document.querySelector('.refund-USDC-input').value;

        const decimals = 6;
        const amount = new BN(refundAmount).mul(new BN(10).pow(new BN(decimals)));

        await contract.methods.refundToken(amount.toString()).send({
            from: userAccount 
        });
        alert("USDC refunded successfully!");
        document.querySelector('.refund-USDC-input').value = "";

        await getAvailableFunds();

        toggleLoading();
    } catch(error){
        console.log(error.message);
        toggleLoading();
    }
}

async function borrowUSDC() {
    try{
        toggleLoading();
        const borrowAmount = document.querySelector('.borrow-USDC-input').value;

        const decimals = 6;
        const amount = new BN(borrowAmount).mul(new BN(10).pow(new BN(decimals)));

        await contract.methods.borrowToken(amount.toString()).send({
            from: userAccount 
        });
        alert("Loan borrowed successfully!");
        document.querySelector('.borrow-USDC-input').value = "";
        await getLoanBalance();
        await getAvailableFunds();

        toggleLoading();
    } catch(error){
        toggleLoading();
    }
    
}

async function repayUSDC() {
    try{
        toggleLoading();
        const repayAmount = document.querySelector('.repay-USDC-input').value;
        
        const decimals = 6;
        const amount = new BN(repayAmount).mul(new BN(10).pow(new BN(decimals)));

        await tokenContract.methods.approve(contractAddress, amount).send({ from: userAccount});

        await contract.methods.repayToken(amount).send({
            from: userAccount
        });

        alert("Loan repaid successfully!");
        document.querySelector('.repay-USDC-input').value = "";
        await getLoanBalance();
        await getAvailableFunds();
        toggleLoading();
    } catch(error){
        toggleLoading();
    }
    
}

async function getCollateralBalance(){

    try{
        const ethBalance = await contract.methods.getCollateralBalance(true).call({ 
            from: userAccount
        });
        document.querySelector('.collateral-balance-ETH').innerHTML = web3.utils.fromWei(ethBalance, "ether");

        const usdcBalance = await contract.methods.getCollateralBalance(false).call({ 
            from: userAccount
        });
        document.querySelector('.collateral-balance-USDC').innerHTML = Number(usdcBalance)/1000000;

    } catch(error){
        console.error(error);
    }
    
}

async function getLoanBalance() {

    try {
        const ethBalance = await contract.methods.getLoanBalance(true).call({ 
            from: userAccount
        });
        document.querySelector('.loan-balance-ETH').innerHTML = web3.utils.fromWei(ethBalance, "ether");

        const usdcBalance = await contract.methods.getLoanBalance(false).call({ 
            from: userAccount
        });
        document.querySelector('.loan-balance-USDC').innerHTML = Number(usdcBalance)/1000000;

    } catch(error){
        console.error(error);
    }
    
}

async function getAvailableFunds(){
    try {
        const ethBalance = await contract.methods.getContractETHBalance().call({ 
            from: userAccount
        });
        document.querySelector('.contract-balance-ETH').innerHTML = web3.utils.fromWei(ethBalance, "ether");

        const usdcBalance = await contract.methods.getContractUSDCBalance().call({ 
            from: userAccount
        });
        document.querySelector('.contract-balance-USDC').innerHTML = Number(usdcBalance)/1000000;

    } catch(error){
        console.error(error);
    }
}

async function getAvailableAmountOfLoans(){

    const price = await getETHtoUSDCPrice();

    const usdcAvailableFunds = await contract.methods.getContractUSDCBalance().call({ 
        from: userAccount
    });

    const ethCollateralBalance = await contract.methods.getCollateralBalance(true).call({ 
        from: userAccount
    });
    const usdcLoanAvailable =
        Number(usdcAvailableFunds) > Number(ethCollateralBalance) * price / 1000000000000;


    const ethAvailableFunds = await contract.methods.getContractETHBalance().call({ 
        from: userAccount
    });
    
    const usdcCollateralBalance = await contract.methods.getCollateralBalance(false).call({ 
        from: userAccount
    });
    const ethLoanAvailable = 
        Number(web3.utils.fromWei(ethAvailableFunds, "ether")) > Number(usdcCollateralBalance) / price / 1000000 
            ? Number(usdcCollateralBalance) / price / 1000000 
            : Number(web3.utils.fromWei(ethAvailableFunds, "ether"));

    
    document.querySelector('.available-loan-balance-USDC').innerHTML = ethLoanAvailable;
    document.querySelector('.available-loan-balance-USDC').innerHTML = usdcLoanAvailable;
    
}

async function getETHtoUSDCPrice(){
    const price = await contract.methods.getETHtoUSDCPrice().call({ 
        from: userAccount
    });

    document.querySelector('.ETH-to-USDC-price').innerHTML = price;
    
    return Number(price);
}

function toggleLoading(){
    isTransactionLoading = !isTransactionLoading;

    if(isTransactionLoading){
        document.querySelector('.app-container').inert = true;
        document.querySelector('.app-container').style.webkitFilter = "brightness(20%)";
        document.querySelector('.message-container').style.display = "flex";
    }

    else{
        document.querySelector('.app-container').inert = false;
        document.querySelector('.app-container').style.webkitFilter = "none";
        document.querySelector('.message-container').style.display = "none";
    }
}