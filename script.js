// Game state variables
let xp = 0;
let health = 100;
let gold = 50;
let currentWeapon = 0;
let fighting;
let monsterHealth;
let inventory = ["stick"];
let isAudioContextStarted = false; // New flag to track audio state

// Game data structures for locations, weapons, and monsters
const locations = [
    {
        name: "town square",
        "button text": ["Go to store", "Go to cave", "Fight dragon"],
        "button functions": [goStore, goCave, fightDragon],
        text: "You are in the town square. You must defeat the dragon that is preventing people from leaving the town. Where do you want to go? Use the buttons above."
    },
    {
        name: "store",
        "button text": ["Buy 10 health (10 gold)", "Buy weapon (30 gold)", "Go to town square"],
        "button functions": [buyHealth, buyWeapon, goTown],
        text: "You enter the store. What would you like to buy?"
    },
    {
        name: "cave",
        "button text": ["Fight slime", "Fight fanged beast", "Go to town square"],
        "button functions": [fightSlime, fightBeast, goTown],
        text: "You enter the cave. You see some monsters."
    },
    {
        name: "fight",
        "button text": ["Attack", "Dodge", "Run"],
        "button functions": [attack, dodge, goTown],
        text: "You are fighting a monster."
    },
    {
        name: "kill monster",
        "button text": ["Go to town square", "Go to town square", "Go to town square"],
        "button functions": [goTown, goTown, goTown],
        text: 'The monster screams "Arg!" as it dies. You gain experience points and find gold.'
    },
    {
        name: "lose",
        "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
        "button functions": [restart, restart, restart],
        text: "You die. &#x2620;"
    },
    {
        name: "win",
        "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
        "button functions": [restart, restart, restart],
        text: "You defeat the dragon! YOU WIN THE GAME! &#x1F389;"
    }
];

const weapons = [
    { name: 'stick', power: 5 },
    { name: 'dagger', power: 30 },
    { name: 'claw hammer', power: 50 },
    { name: 'sword', power: 100 }
];

const monsters = [
    {
        name: "slime",
        emoji: "🦠",
        level: 2,
        health: 15
    },
    {
        name: "fanged beast",
        emoji: "🐺",
        level: 8,
        health: 60
    },
    {
        name: "dragon",
        emoji: "🐉",
        level: 20,
        health: 300
    }
];

// DOM element selectors
const button1 = document.querySelector("#button1");
const button2 = document.querySelector("#button2");
const button3 = document.querySelector("#button3");
const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const battleScene = document.getElementById("battle-scene");
const playerEmoji = document.getElementById("player-emoji");
const monsterEmoji = document.getElementById("monster-emoji");
const playerHealthBar = document.getElementById("player-health-bar");
const monsterHealthBar = document.getElementById("monster-health-bar");
const backgroundCanvas = document.getElementById("background-canvas");
const backgroundCtx = backgroundCanvas.getContext("2d");

// Sound generation with Tone.js
const synth = new Tone.Synth().toDestination();
const blip = new Tone.MembraneSynth({
    "pitchDecay" : 0.008 ,
    "octaves" : 2 ,
    "oscillator" : { "type" : "sine" }
}).toDestination();
const hit = new Tone.MetalSynth({
    "frequency" : 100 ,
    "envelope" : { "attack" : 0.001 , "decay" : 0.2 , "sustain" : 0.1 , "release" : 0.1 } ,
    "harmonicity" : 3.1 ,
    "modulationIndex" : 1 ,
    "resonance" : 4000 ,
    "octaves" : 1.5
}).toDestination();
const victory = new Tone.Sequence(function(time, note){
    synth.triggerAttackRelease(note, "8n", time);
}, ["C4", "E4", "G4", "C5"]); // Removed .toDestination()
const defeat = new Tone.Sequence(function(time, note){
    synth.triggerAttackRelease(note, "8n", time);
}, ["C3", "B2", "Bb2", "A2"]); // Removed .toDestination()


function playTone(freq, type = "sine", duration = "8n") {
    const now = Tone.now();
    synth.oscillator.type = type;
    synth.triggerAttackRelease(freq, duration, now);
}

// Function to safely start the Tone.js audio context
function startAudio() {
    if (!isAudioContextStarted) {
        Tone.start();
        isAudioContextStarted = true;
    }
}

// Initial setup
// These handlers will be active until the first button is clicked.
button1.onclick = () => { startAudio(); goStore(); };
button2.onclick = () => { startAudio(); goCave(); };
button3.onclick = () => { startAudio(); fightDragon(); };


// Function to update the game's state based on a new location
function update(location) {
    if (isAudioContextStarted) {
        playTone("C5", "sine", "16n"); // Play a tone on screen transition
    }
    battleScene.style.display = "none";
    backgroundCanvas.style.display = "block";
    button1.innerText = location["button text"][0];
    button2.innerText = location["button text"][1];
    button3.innerText = location["button text"][2];
    button1.onclick = location["button functions"][0];
    button2.onclick = location["button functions"][1];
    button3.onclick = location["button functions"][2];
    text.innerHTML = location.text;
}

// This function draws the background for a given location
function drawBackground(scene) {
    backgroundCanvas.width = backgroundCanvas.parentElement.offsetWidth;
    backgroundCanvas.height = backgroundCanvas.parentElement.offsetHeight;
    backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    
    backgroundCtx.fillStyle = '#111'; // Default dark background
    backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    if (scene === "town square") {
        backgroundCtx.fillStyle = '#6b4d3e';
        backgroundCtx.fillRect(0, backgroundCanvas.height - 50, backgroundCanvas.width, 50);
        backgroundCtx.fillStyle = '#8b5e4c';
        backgroundCtx.fillRect(backgroundCanvas.width / 2 - 25, backgroundCanvas.height - 100, 50, 50);
        backgroundCtx.fillStyle = '#c0c0c0';
        backgroundCtx.fillRect(backgroundCanvas.width / 2 - 15, backgroundCanvas.height - 120, 30, 20);
        backgroundCtx.fillStyle = '#fff';
        backgroundCtx.font = '16px Press Start 2P';
        backgroundCtx.fillText('TOWN', backgroundCanvas.width / 2 - 30, backgroundCanvas.height - 130);
    } else if (scene === "store") {
        backgroundCtx.fillStyle = '#3a2d21';
        backgroundCtx.fillRect(0, backgroundCanvas.height - 50, backgroundCanvas.width, 50);
        backgroundCtx.fillStyle = '#4f3e30';
        backgroundCtx.fillRect(backgroundCanvas.width / 2 - 60, backgroundCanvas.height - 150, 120, 100);
        backgroundCtx.fillStyle = '#fff';
        backgroundCtx.font = '16px Press Start 2P';
        backgroundCtx.fillText('STORE', backgroundCanvas.width / 2 - 50, backgroundCanvas.height - 130);
    } else if (scene === "cave") {
        backgroundCtx.fillStyle = '#222';
        backgroundCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
        backgroundCtx.fillStyle = '#333';
        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, backgroundCanvas.height);
        backgroundCtx.lineTo(backgroundCanvas.width / 2, backgroundCanvas.height / 2);
        backgroundCtx.lineTo(backgroundCanvas.width, backgroundCanvas.height);
        backgroundCtx.closePath();
        backgroundCtx.fill();
    }
}

// This makes sure the canvas is responsive on resize
window.addEventListener('resize', () => {
    if (battleScene.style.display === "none") {
        drawBackground(locations[0].name);
    }
});

// Functions for game navigation
function goTown() {
    update(locations[0]);
    drawBackground("town square");
}

function goStore() {
    update(locations[1]);
    drawBackground("store");
}

function goCave() {
    update(locations[2]);
    drawBackground("cave");
}

function fightDragon() {
    fighting = 2; // Dragon is at index 2 in the monsters array
    goFight();
}

function buyHealth() {
    if (gold >= 10) {
        gold -= 10;
        health += 10;
        goldText.innerText = gold;
        healthText.innerText = health;
        text.innerText = "You bought 10 health. Your health is now " + health + ".";
        if (isAudioContextStarted) {
            playTone("E5", "square"); // Positive sound for buying
        }
    } else {
        text.innerText = "You don't have enough gold to buy health.";
        if (isAudioContextStarted) {
            playTone("C3", "sawtooth"); // Negative sound for not enough gold
        }
    }
}

function buyWeapon() {
    if (currentWeapon < weapons.length - 1) {
        if (gold >= 30) {
            gold -= 30;
            currentWeapon++;
            goldText.innerText = gold;
            let newWeapon = weapons[currentWeapon].name;
            text.innerText = "You now have a " + newWeapon + ".";
            inventory.push(newWeapon);
            text.innerText += " In your inventory you have: " + inventory.join(", ") + ".";
            if (isAudioContextStarted) {
                playTone("F#5", "triangle"); // Positive sound for buying
            }
        } else {
            text.innerText = "You do not have enough gold to buy a weapon.";
            if (isAudioContextStarted) {
                playTone("C3", "sawtooth"); // Negative sound
            }
        }
    } else {
        text.innerText = "You already have the most powerful weapon!";
        button2.innerText = "Sell weapon for 15 gold";
        button2.onclick = sellWeapon;
    }
}

function sellWeapon() {
    if (inventory.length > 1) {
        gold += 15;
        goldText.innerText = gold;
        let soldWeapon = inventory.shift();
        text.innerText = "You sold a " + soldWeapon + ".";
        text.innerText += " In your inventory you have: " + inventory.join(", ") + ".";
        if (isAudioContextStarted) {
            playTone("G4", "square"); // Sound for selling
        }
    } else {
        text.innerText = "Don't sell your only weapon!";
        if (isAudioContextStarted) {
            playTone("C3", "sawtooth");
        }
    }
}

// Functions for fighting
function fightSlime() {
    fighting = 0;
    goFight();
}

function fightBeast() {
    fighting = 1;
    goFight();
}

function goFight() {
    update(locations[3]); // Location 3 is the "fight" location
    monsterHealth = monsters[fighting].health;
    battleScene.style.display = "flex";
    backgroundCanvas.style.display = "none";
    
    // Set up initial battle visuals
    playerEmoji.innerHTML = "⚔️";
    monsterEmoji.innerHTML = monsters[fighting].emoji;
    document.getElementById("monster-name").innerText = monsters[fighting].name;
    updateBattleScene();
}

function updateBattleScene() {
    healthText.innerText = health;
    document.getElementById("monster-health-bar").style.width = (monsterHealth / monsters[fighting].health) * 100 + "%";
    document.getElementById("player-health-bar").style.width = (health / 100) * 100 + "%";
}

function attack() {
    text.innerText = "The " + monsters[fighting].name + " attacks.";
    text.innerText += " You attack it with your " + weapons[currentWeapon].name + ".";
    
    if (isAudioContextStarted) {
        blip.triggerAttackRelease("C4", "16n"); // Sound for player attack
    }
    
    health -= getMonsterAttackValue(monsters[fighting].level);
    if (isMonsterHit()) {
        monsterHealth -= weapons[currentWeapon].power + Math.floor(Math.random() * xp) + 1;
    } else {
        text.innerText += " You miss.";
    }
    
    if (health > 0) {
         // Use a slight delay for the monster's attack sound
        setTimeout(() => {
            if (isAudioContextStarted) {
                hit.triggerAttackRelease("E2", "8n");
            }
        }, 500);
    }
    
    updateBattleScene();
    
    if (health <= 0) {
        lose();
    } else if (monsterHealth <= 0) {
        if (fighting === 2) {
            winGame();
        } else {
            defeatMonster();
        }
    }
}

function getMonsterAttackValue(level) {
    const hit = (level * 5) - (Math.floor(Math.random() * xp));
    return hit > 0 ? hit : 0;
}

function isMonsterHit() {
    return Math.random() > .2 || health < 20;
}

function dodge() {
    text.innerText = "You dodge the attack from the " + monsters[fighting].name;
    if (isAudioContextStarted) {
        blip.triggerAttackRelease("G4", "16n"); // Sound for dodging
    }
}

function defeatMonster() {
    gold += Math.floor(monsters[fighting].level * 6.7);
    xp += monsters[fighting].level;
    goldText.innerText = gold;
    xpText.innerText = xp;
    update(locations[4]);
    if (isAudioContextStarted) {
        victory.start(); // Play victory jingle
    }
}

function lose() {
    update(locations[5]);
    if (isAudioContextStarted) {
        defeat.start(); // Play defeat jingle
    }
}

function winGame() {
    update(locations[6]);
    if (isAudioContextStarted) {
        victory.start(); // Play victory jingle
    }
}

function restart() {
    xp = 0;
    health = 100;
    gold = 50;
    currentWeapon = 0;
    inventory = ["stick"];
    goldText.innerText = gold;
    healthText.innerText = health;
    xpText.innerText = xp;
    goTown();
}
