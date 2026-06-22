const { expect } = require("chai"); // Chai je biblioteka za asertacije koja se koristi u testovima
const { ethers } = require("hardhat");

// Testovi za pametni ugovor DeadMansSwitch
describe("DeadMansSwitch", function () {
    let contract; // Promenljiva za instancu ugovora
    let vlasnik; // Promenljiva za vlasnika ugovora
    let naslednik; // Promenljiva za naslednika (beneficijara)

    // Pre svakog testa, deploy-ujemo novi ugovor i postavljamo vlasnika i naslednika
    beforeEach(async function () {
        [vlasnik, naslednik] = await ethers.getSigners(); // Dobijamo dva naloga: vlasnika i naslednika

        // Deploy-ujemo ugovor sa odgovarajućim parametrima
        const DeadMansSwitch = await ethers.getContractFactory("DeadMansSwitch");
        contract = await DeadMansSwitch.deploy(
            naslednik.address,  // beneficiary
            86400,              // 1 dan u sekundama
            true,               // isRevocable
            true,               // isBeneficiaryChangeable
            true                // isMessageChangeable
        );
        // Čekamo da se ugovor deploy-uje pre nego što nastavimo sa testovima
        await contract.waitForDeployment();
    });

    // Test koji proverava da li je vlasnik ispravno postavljen nakon deploy-a ugovora
    it("Vlasnik je ispravno postavljen", async function () {
        expect(await contract.owner()).to.equal(vlasnik.address); // Proveravamo da li je vlasnik ugovora ispravno postavljen na adresu vlasnika (vlasnik.address)
    });

    // Test koji proverava da li je naslednik ispravno postavljen nakon deploy-a ugovora
    it("Naslednik je ispravno postavljen", async function () {
    expect(await contract.beneficiary()).to.equal(naslednik.address); // Proveravamo da li je naslednik ugovora ispravno postavljen na adresu naslednika (naslednik.address)
    });

    // Test koji proverava da li vlasnik može da uradi check-in i da li se lastCheckIn ažurira
    it("Vlasnik moze da uradi check-in", async function () {
        await contract.connect(vlasnik).checkIn(); // Vlasnik obavlja check-in
        // proveravamo da li je lastCheckIn azuriran
        const lastCheckIn = await contract.lastCheckIn(); // Proveravamo da li je lastCheckIn veći od 0, što znači da je check-in uspešno obavljen
        expect(lastCheckIn).to.be.greaterThan(0); // Proveravamo da li je lastCheckIn veći od 0, što znači da je check-in uspešno obavljen
    });

    // Test koji proverava da li neko ko nije vlasnik može da uradi check-in i da li se transakcija odbija sa odgovarajućom porukom
    it("Neko ko nije vlasnik ne moze da uradi check-in", async function () {
    await expect(
        contract.connect(naslednik).checkIn() // Naslednik pokušava da obavi check-in, ali nije vlasnik
    ).to.be.revertedWith("Nije vlasnik"); 
    });

    // Test koji proverava da li naslednik može da okida switch pre roka i da li se transakcija odbija sa odgovarajućom porukom
    it("Naslednik ne moze okidati pre roka", async function () {
    await expect(
        contract.connect(naslednik).triggerSwitch()
    ).to.be.revertedWith("Nije naslednik");
    });

    // Test koji proverava da li naslednik može da okida switch nakon roka i da li se stanje ugovora ažurira na triggered
    it("Naslednik moze okidati nakon roka", async function () {
    // simuliramo protok od 1 dana + 1 sekunda
    await ethers.provider.send("evm_increaseTime", [86401]); // Povećavamo vreme na blockchainu za 1 dan i 1 sekund
    await ethers.provider.send("evm_mine"); // Mine-ujemo novi blok da bi se promene vremena primenile

    await contract.connect(naslednik).triggerSwitch();  
    expect(await contract.triggered()).to.equal(true); // Proveravamo da li je stanje ugovora ažurirano na triggered (true)
    });

    // Test koji proverava da li se ETH prenosi nasledniku nakon trigera i da li se balans naslednika povećava nakon trigera
    it("ETH se prenosi nasledniku nakon trigera", async function () {
    // vlasnik deponuje 1 ETH
    await contract.connect(vlasnik).depositFunds({ value: ethers.parseEther("1.0") });
    
    // simuliramo protok vremena
    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");

    // proveravamo balans naslednika pre trigera
    const balansPre = await ethers.provider.getBalance(naslednik.address);
    
    await contract.connect(naslednik).triggerSwitch();
    
    // proveravamo balans naslednika posle trigera
    const balansPostle = await ethers.provider.getBalance(naslednik.address);
    
    expect(balansPostle).to.be.greaterThan(balansPre);
    });

    // Test koji proverava da li vlasnik može da promeni naslednika ako je to dozvoljeno i da li se naslednik ažurira
    it("Promena naslednika nije moguca ako nije dozvoljeno", async function () {
    // deployujemo novi contract sa isBeneficiaryChangeable = false
    const DeadMansSwitch = await ethers.getContractFactory("DeadMansSwitch");
    const contractBezPromene = await DeadMansSwitch.deploy(
        naslednik.address,
        86400,
        true,
        false,  // isBeneficiaryChangeable = false
        true
    );
    await contractBezPromene.waitForDeployment();

    // pokušavamo da promenimo naslednika, ali očekujemo da se transakcija odbije sa odgovarajućom porukom
    await expect(
        contractBezPromene.connect(vlasnik).updateBeneficiary(vlasnik.address)
    ).to.be.revertedWith("Nije dozvoljena promena naslednika");

     });

    // proveravamo da se naslednik nije promenio nakon neuspešnog pokušaja promene
    it("Opoziv nije moguc ako nije dozvoljen", async function () {
    // deployujemo novi contract sa isRevocable = false
    const DeadMansSwitch = await ethers.getContractFactory("DeadMansSwitch");
    const contractBezOpoziva = await DeadMansSwitch.deploy(
        naslednik.address,
        86400,
        false,  // isRevocable = false
        true,
        true
    );
    await contractBezOpoziva.waitForDeployment();

    // pokušavamo da opozovemo ugovor, ali očekujemo da se transakcija odbije sa odgovarajućom porukom
    await expect(
        contractBezOpoziva.connect(vlasnik).revokeContract()
    ).to.be.revertedWith("Nije dozvoljeno raskidanje ugovora");
    });

    // Test koji proverava da li vlasnik može da opozove ugovor ako je to dozvoljeno i da li se stanje ugovora ažurira na revoked
    it("Niko ne moze nista raditi nakon trigera", async function () {
    // simuliramo protok vremena
    await ethers.provider.send("evm_increaseTime", [86401]);
    await ethers.provider.send("evm_mine");

    // naslednik okida switch
    await contract.connect(naslednik).triggerSwitch();

    // vlasnik ne moze da uradi check-in
    await expect(
        contract.connect(vlasnik).checkIn()
    ).to.be.revertedWith("Switch je vec okinut");

    // vlasnik ne moze da deponuje
    await expect(
        contract.connect(vlasnik).depositFunds({ value: ethers.parseEther("1.0") })
    ).to.be.revertedWith("Switch je vec okinut");
});


});