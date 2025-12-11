const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');

// --- Sound Setup ---
const hitSound = document.getElementById('suck-up-sound'); 
const ambientSound = document.getElementById('ambient-sound');
const gameMusic = document.getElementById('game-music');
let audioContextStarted = false; // Flag to track sound initialization

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        // The play() function is wrapped in a catch block because browsers sometimes block it.
        sound.play().catch(e => {
            if (e.name === 'NotAllowedError') {
                console.log("Audio play blocked. User interaction needed.");
            }
        });
    }
}

// --- Audio Initialization Function ---
function startAudio() {
    if (audioContextStarted) return;

    // Start background audio (often requires play() to be called inside a user event handler)
    ambientSound.play().catch(e => console.log("Ambient sound failed to start:", e));
    gameMusic.play().catch(e => console.log("Music failed to start:", e));

    audioContextStarted = true;
    console.log("Audio started successfully.");
}


// --- Game Variables and Player Size ---
let currentMass = 0; 
const playerSpeed = 30; 
const gameHeight = gameContainer.offsetHeight;

let isGameOver = false;
let gameInterval;
let fallingObjects = [];

const initialPlayerSize = 70; 
let currentPlayerSize = initialPlayerSize;

const collectibleEmojis = ['✨', '☄️', '💫', '🌑', '🌎', '🪐', '⚫']; 


// --- Dynamic Dimension Calculation (For responsiveness) ---
function getGameDimensions() {
    const rect = gameContainer.getBoundingClientRect();
    const gameWidth = rect.width;
    let playerX = parseInt(player.style.left) || rect.width / 2;
    return { gameWidth, playerX };
}

let { gameWidth, playerX } = getGameDimensions(); 

window.addEventListener('resize', () => {
    ({ gameWidth } = getGameDimensions());
    playerX = Math.min(gameWidth - player.offsetWidth, Math.max(0, parseInt(player.style.left)));
    player.style.left = playerX + 'px'; 
});


// --- DUAL CONTROL SETUP (KEYBOARD & TOUCH) ---

// 1. KEYBOARD CONTROLS (For Laptop/Desktop)
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    
    // Attempt to start audio on the first key press
    startAudio();

    // Movement logic
    if (e.key === 'ArrowLeft') {
        playerX = Math.max(0, playerX - playerSpeed);
    } else if (e.key === 'ArrowRight') {
        playerX = Math.min(gameWidth - player.offsetWidth, playerX + playerSpeed);
    }
    player.style.left = playerX + 'px';
});


// 2. TOUCH CONTROLS (For Phone/Tablet)
let touchX = 0; 

gameContainer.addEventListener('touchstart', (e) => {
    if (isGameOver) return;
    e.preventDefault();
    
    // Attempt to start audio on the first touch
    startAudio();

    touchX = e.touches[0].clientX;
});

gameContainer.addEventListener('touchmove', (e) => {
    if (isGameOver) return;
    e.preventDefault();

    const newTouchX = e.touches[0].clientX;
    const deltaX = newTouchX - touchX; 
    let newPlayerX = parseInt(player.style.left) + deltaX;

    // Constrain movement within the game boundaries
    newPlayerX = Math.max(0, newPlayerX);
    newPlayerX = Math.min(gameWidth - player.offsetWidth, newPlayerX);

    player.style.left = newPlayerX + 'px';
    playerX = newPlayerX;

    touchX = newTouchX; 
});
// --- END DUAL CONTROL SETUP ---


// --- Object Creation and Movement ---
function createObject() {
    const obj = document.createElement('div');
    obj.classList.add('collectible');
    
    obj.innerHTML = collectibleEmojis[Math.floor(Math.random() * collectibleEmojis.length)];
    
    const baseValue = 50;
    obj.value = baseValue + Math.floor(currentMass / 100); 

    const objSize = 30; 
    obj.style.fontSize = objSize + 'px';
    
    obj.style.left = Math.random() * (gameWidth - objSize) + 'px';
    gameContainer.appendChild(obj);
    fallingObjects.push(obj);

    const fallSpeed = 1.5 + (currentMass / 500); 
    let objY = 0;

    const moveInterval = setInterval(() => {
        if (isGameOver) {
            clearInterval(moveInterval);
            return;
        }
        
        objY += fallSpeed;
        obj.style.top = objY + 'px';
        
        // Check for boundary collision (Object missed)
        if (objY > gameHeight) {
            clearInterval(moveInterval);
            obj.remove();
            fallingObjects = fallingObjects.filter(o => o !== obj);
            return;
        }
        
        checkCollection(obj, moveInterval);
        
    }, 20);
    obj.moveInterval = moveInterval; 
}


// --- Collision Handler (Collection) ---
function checkCollection(obj, moveInterval) {
    const playerRect = player.getBoundingClientRect();
    const objRect = obj.getBoundingClientRect();

    if (
        objRect.bottom > playerRect.top &&
        objRect.top < playerRect.bottom &&
        objRect.right > playerRect.left &&
        objRect.left < playerRect.right
    ) {
        clearInterval(moveInterval);
        obj.remove();
        fallingObjects = fallingObjects.filter(o => o !== obj);

        collectObject(obj);
    }
}

function collectObject(obj) {
    playSound(hitSound); // Play the "suck up" sound on consumption
    currentMass += obj.value;
    scoreDisplay.textContent = `Mass: ${currentMass}`;
    
    updatePlayerSize();
}

function updatePlayerSize() {
    const newSize = initialPlayerSize + Math.floor(currentMass / 200);
    
    if (newSize > currentPlayerSize) {
        currentPlayerSize = newSize;
        player.style.fontSize = currentPlayerSize + 'px';
        
        if (currentPlayerSize > 200) {
            gameOver("MAXIMUM CONSUMPTION REACHED! You fill the screen!", true);
        }
    }
}


// --- Game Flow ---
function startGame() {
    // NOTE: We no longer auto-play audio here. It is triggered by the first user input (touch or keydown).

    // Initialize player as SMBH
    player.innerHTML = '⚫'; 
    player.style.fontSize = initialPlayerSize + 'px';
    player.style.left = (gameWidth / 2) + 'px';
    scoreDisplay.textContent = `Mass: ${currentMass}`;

    // Main object spawning loop
    gameInterval = setInterval(() => {
        createObject();
    }, 800); 
}

function gameOver(message, isWin = false) {
    isGameOver = true;
    clearInterval(gameInterval);
    gameMusic.pause();
    ambientSound.pause();
    
    alert(`${message}\nFinal Mass: ${currentMass}`);
    location.reload(); 
}

// Start the game when the script loads
startGame();