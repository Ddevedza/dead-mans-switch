import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from './contract.js';

// Ova komponenta ce biti prikazana nasledniku, omogucava mu da vidi stanje ugovora i preuzme nasledstvo
function BeneficiaryPortal({ adresa, contractAddress }) {
    const [timeLeft, setTimeLeft] = useState(null); // vreme do isteka
    const [balance, setBalance] = useState(null); // balans contracta
    const [triggered, setTriggered] = useState(false); // da li je switch okinut
    const [message, setMessage] = useState(null); // poruka od vlasnika

    // Ucitajmo podatke o ugovoru kada se komponenta ucita
    useEffect(() => {
        async function loadContractData() {
            const provider = new ethers.BrowserProvider(window.ethereum); // povezujemo se sa MetaMaskom
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider); // kreiramo instancu ugovora

            const time = await contract.timeUntilTrigger(); // vreme do isteka
            const bal = await contract.getBalance(); // balans contracta
            const trig = await contract.triggered(); // da li je switch okinut

            // Postavljamo podatke u stanje
            setTimeLeft(time.toString());
            setBalance(ethers.formatEther(bal));
            setTriggered(trig);
        }
        loadContractData();
    }, [contractAddress]);

    // Funkcija za formatiranje vremena u citljiv format
    function formatTime(seconds) {
        const secs = Number(seconds);
        const days = Math.floor(secs / 86400);
        const hours = Math.floor((secs % 86400) / 3600);
        const minutes = Math.floor((secs % 3600) / 60);
        return `${days} dana, ${hours} sati, ${minutes} minuta`;
    }

    // Funkcija koja odredjuje status ugovora
    function getStatus() {
        if (triggered && balance === "0.0") return "🔴 Opozvan";
        if (triggered) return "🔴 Okinut";
        return "🟢 Aktivan";
    }

    // Funkcija za okidanje switcha i primanje nasledstva
    async function triggerSwitch() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(); // potpisnik transakcije
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const tx = await contract.triggerSwitch(); // okidamo switch
            await tx.wait();

            setTriggered(true); // switch je okinut
            setBalance("0.0"); // balans je 0 nakon trigera
            alert("Nasledstvo primljeno!");
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Funkcija za citanje poruke od vlasnika nakon sto je switch okinut
    async function getMessage() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

            const msg = await contract.getMessage(); // citamo poruku
            setMessage(msg); // postavljamo poruku u stanje
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Renderujemo informacije o ugovoru i dugmad za naslednika
    return (
        <div>
            <h2>Naslednikov Portal</h2>
            <p>Adresa naslednika: {adresa}</p>
            <p>Adresa ugovora: {contractAddress}</p>
            <p>Vreme do isteka: {timeLeft ? formatTime(Number(timeLeft)) : "Učitava..."}</p>
            <p>Balans: {balance} ETH</p>
            <p>Status: {getStatus()}</p>

            {/* Dugme za okidanje switcha - prikazuje se samo ako je rok istekao */}
            {!triggered && timeLeft === "0" && (
                <button onClick={triggerSwitch}>Preuzmi nasledstvo</button>
            )}

            {/* Dugme za citanje poruke - prikazuje se samo ako je switch okinut */}
            {triggered && balance !== "0.0" && (
                <div>
                    <button onClick={getMessage}>Procitaj poruku</button>
                    {message && <p>Poruka: {message}</p>}
                </div>
            )}
        </div>
    );
}

export default BeneficiaryPortal;