import { useState, useEffect } from 'react';
import { ethers } from 'ethers';


function ConnectWallet({ onConnect }) {
    const [adresa, setAdresa] = useState(null); // definisanje constante adrese korisnika

    // Provera da li je MetaMask vec povezan pri ucitavanju stranice
    useEffect(() => {
        async function checkConnection() {
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum); // proveravamo verziju MetaMaska
                const accounts = await provider.listAccounts(); // uzimamo listu povezanih naloga
                if (accounts.length > 0) {
                    const adresa = accounts[0].address; // uzimamo prvu adresu
                    setAdresa(adresa); // postavljamo adresu
                    onConnect(adresa); // prop za prosledjivanje parent-u
                }
            }
        }
        checkConnection();
    }, []); // prazan niz znaci da se izvrsava samo jednom pri ucitavanju

    // Funkcija za povezivanje sa Metamaskom
    async function connectWallet() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum); // proveravamo verziju MetaMaska
            const signer = await provider.getSigner(); // uzimanje potpisa korisnika
            const adresa = await signer.getAddress(); // uzimanje adrese korisnika
            setAdresa(adresa); // postavljamo adresu
            onConnect(adresa); // prop za prosledjivanje parent-u
        } catch (error) {
            console.log("Greška:", error);
        }
    }

    // Ukoliko je povezan sa Metamaskom, uspeli smo    
    if (adresa) {
        return <p>Povezan: {adresa}</p>;
    }

    return (
        // Dugme za povezivanje
        <button onClick={connectWallet}>Povezi novcanik</button>
    );
}

export default ConnectWallet;