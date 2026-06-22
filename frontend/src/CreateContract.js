import { useState } from 'react';
import { ethers } from 'ethers';


function CreateContract({ adresa, onContractCreated }) {
    // Definisanje stanja(parametre) za formu
    const [beneficiary, setBeneficiary] = useState("");
    const [interval, setInterval] = useState("");
    const [isRevocable, setIsRevocable] = useState(false);
    const [isBeneficiaryChangeable, setIsBeneficiaryChangeable] = useState(false);
    const [isMessageChangeable, setIsMessageChangeable] = useState(false);
    const [initialMessage, setInitialMessage] = useState(""); // inicijalna poruka

    async function createContract() {
    try {
        // automatski prebacujemo na Sepolia
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
        });

        // povezujemo se sa MetaMaskom
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // ucitavamo ABI iz json fajla
        const { CONTRACT_ABI } = await import('./contract.js');
        const bytecode = (await import('./contracts/DeadMansSwitch.json')).bytecode;

        // kreiramo factory i deployujemo
        const factory = new ethers.ContractFactory(CONTRACT_ABI, bytecode, signer);
        const contract = await factory.deploy(
            beneficiary,
            interval * 24 * 60 * 60,
            isRevocable,
            isBeneficiaryChangeable,
            isMessageChangeable
        );

                // ako je vlasnik uneo poruku, postavljamo je
        if (initialMessage) {
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
            const tx = await contract.updateMessage(initialMessage);
            await tx.wait();
        }

        await contract.waitForDeployment();
        const contractAddress = await contract.getAddress();
        console.log("Contract deployovan na:", contractAddress);
        onContractCreated(contractAddress);

    } catch (error) {
        console.log("Greška:", error);
    }
}

    return (
        // Forma za kreiranje ugovora
    <div>
        <h2>Kreiraj Dead Man's Switch</h2>
        
        <input 
            type="text" 
            placeholder="Adresa naslednika"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
        />
        
        <input 
            type="number" 
            placeholder="Interval u danima"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
        />
        
        <label>
            <input 
                type="checkbox"
                checked={isRevocable}
                onChange={(e) => setIsRevocable(e.target.checked)}
            />
            Ugovor može biti opozvan
        </label>
        
        <label>
            <input 
                type="checkbox"
                checked={isBeneficiaryChangeable}
                onChange={(e) => setIsBeneficiaryChangeable(e.target.checked)}
            />
            Naslednik može biti promenjen
        </label>

        <input
            type="text"
            placeholder="Poruka nasledniku (opciono)"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
        />
        
        <label>
            <input 
                type="checkbox"
                checked={isMessageChangeable}
                onChange={(e) => setIsMessageChangeable(e.target.checked)}
            />
            Poruka može biti promenjena
        </label>
        
        <button onClick={createContract}>Kreiraj ugovor</button>
    </div>
);

}

export default CreateContract;