import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contract.js';

// Ova komponenta ce biti prikazana vlasniku nakon kreiranja ugovora, omogucava mu da se check-in i vidi osnovne informacije o ugovoru
function OwnerDashboard({ adresa, contractAddress }) {
    const [timeLeft, setTimeLeft] = useState(null); // vreme do isteka
    const [balance, setBalance] = useState(null); // balans contracta
    const [triggered, setTriggered] = useState(false); // da li je switch okinut
    const [depositAmount, setDepositAmount] = useState(""); // iznos za deposit

    const [isRevocable, setIsRevocable] = useState(false); // da li je ugovor opozivan
    const [isBeneficiaryChangeable, setIsBeneficiaryChangeable] = useState(false); // da li je naslednik promenljiv
    const [isMessageChangeable, setIsMessageChangeable] = useState(false); // da li je poruka promenljiva
    const [newMessage, setNewMessage] = useState(""); // nova poruka za ugovor
    const [newBeneficiary, setNewBeneficiary] = useState(""); // nova adresa naslednika

    const [isRevoked, setIsRevoked] = useState(false); // da li je ugovor opozvan

    // Ucitajmo podatke o ugovoru kada se komponenta ucita ili kada se promeni adresa ugovora
    useEffect(() => {
        async function loadContractData() {
            const provider = new ethers.BrowserProvider(window.ethereum); // povezujemo se sa MetaMaskom
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider); // kreiramo instancu ugovora

            const time = await contract.timeUntilTrigger(); // vreme do isteka
            const bal = await contract.getBalance(); // balans contracta
            const trig = await contract.triggered(); // da li je switch okinut

            const revocable = await contract.isRevocable(); // da li je ugovor opozivan
            const messageChangeable = await contract.isMessageChangeable(); // da li je poruka promenljiva
            const beneficiaryChangeable = await contract.isBeneficiaryChangeable(); // da li je naslednik promenljiv

            // Postavljamo dobijene vrednosti u stanje
            setIsRevocable(revocable);
            setIsMessageChangeable(messageChangeable);
            setIsBeneficiaryChangeable(beneficiaryChangeable);

            // Postavljamo podatke u stanje
            setTimeLeft(time.toString());
            setBalance(ethers.formatEther(bal));
            setTriggered(trig);
        }
        loadContractData();
    }, [contractAddress]);

    // Funkcija koja se poziva kada vlasnik klikne na check-in dugme
    async function checkIn() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
            
            const tx = await contract.checkIn();
            await tx.wait();
            
            const time = await contract.timeUntilTrigger();
            setTimeLeft(time.toString());
            
            alert("Check-in uspešan!");
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Funkcija za deponovanje sredstava u ugovor
    async function depositFunds() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const tx = await contract.depositFunds({ 
                value: ethers.parseEther(depositAmount)
            });
            await tx.wait();

            const bal = await contract.getBalance();
            setBalance(ethers.formatEther(bal));

            alert("Deposit uspešan!");
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Funkcija za promenu poruke ugovora
    async function updateMessage() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const tx = await contract.updateMessage(newMessage);
            await tx.wait();

            alert("Poruka uspešno promenjena!");
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Funkcija za promenu naslednika
    async function updateBeneficiary() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const tx = await contract.updateBeneficiary(newBeneficiary);
            await tx.wait();

            alert("Naslednik uspešno promenjen!");
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Funkcija za opozivanje ugovora
    async function revokeContract() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const tx = await contract.revokeContract();
            await tx.wait();

            setIsRevoked(true);
            alert("Ugovor uspešno opozvan!");
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Funkcija za formatiranje vremena u čitljiv format
    function formatTime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days} dana, ${hours} sati, ${minutes} minuta`;
    }

    return (
        <div>
            <h2>Vlasnikov Dashboard</h2>
            <p>Adresa: {adresa}</p>
            <p>Adresa ugovora: {contractAddress}</p>
            <p>Vreme do isteka: {timeLeft ? formatTime(Number(timeLeft)) : "Učitava..."}</p>
            <p>Balans: {balance} ETH</p>
            <p>Status: {isRevoked ? "🔴 Opozvan" : triggered ? "🔴 Okinut" : "🟢 Aktivan"}</p>
            <button onClick={checkIn}>Check-in</button>
            <input 
                type="number"
                placeholder="Iznos ETH"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button onClick={depositFunds}>Deponuj ETH</button>
            {isBeneficiaryChangeable && (
                <div>
                    <input
                        type="text"
                        placeholder="Nova adresa naslednika"
                        value={newBeneficiary}
                        onChange={(e) => setNewBeneficiary(e.target.value)}
                    />
                    <button onClick={updateBeneficiary}>Promeni naslednika</button>
                </div>
            )}
            {isMessageChangeable && (
                <div>
                    <input
                        type="text"
                        placeholder="Nova poruka"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button onClick={updateMessage}>Promeni poruku</button>
                </div>
            )}
            {isRevocable && (
                <button onClick={revokeContract}>Opozovi ugovor</button>
            )}
        </div>
    );
}

export default OwnerDashboard;