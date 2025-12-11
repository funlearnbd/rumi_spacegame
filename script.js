const gameContainer = document.getElementById('game-container');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');

// --- Sound Setup (Requires audio tags in index.html to work) ---
const hitSound = document.getElementById('hit-sound'); // Used for collection
const gameMusic = document.getElementById('game-music');

function playSound(sound) {
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound play blocked:", e));
    }
}

// --- Game Variables and Player Size ---
let currentMass = 0; // Renamed score to mass for theme
const playerSpeed = 30; 
const gameHeight = gameContainer.offsetHeight;

let isGameOver = false;
let gameInterval;
let fallingObjects = [];

// Player properties
const initialPlayerSize = 70; // Starting size in px
let currentPlayerSize = initialPlayerSize;

// Collectibles (Everything is a collectible: stars, planets, smaller black holes)
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
    // Recalculate player position to stay within bounds
    playerX = Math.min(gameWidth - player.offsetWidth, Math.max(0, parseInt(player.style.left)));
    player.style.left = playerX + 'px'; 
});


// --- Player Movement (Left/Right) ---
document.addEventListener('keydown', (e) => {
    if (isGameOver) return;
    
    // Movement
    if (e.key === 'ArrowLeft') {
        playerX = Math.max(0, playerX - playerSpeed);
    } else if (e.key === 'ArrowRight') {
        playerX = Math.min(gameWidth - player.offsetWidth, playerX + playerSpeed);
    }
    player.style.left = playerX + 'px';
});


// --- Object Creation and Movement ---
function createObject() {
    const obj = document.createElement('div');
    obj.classList.add('collectible');
    
    // Set emoji and size
    obj.innerHTML = collectibleEmojis[Math.floor(Math.random() * collectibleEmojis.length)];
    
    // Value of collectible increases as the SMBH player grows
    const baseValue = 50;
    obj.value = baseValue + Math.floor(currentMass / 100); 

    const objSize = 30; // Collectibles are fixed size
    obj.style.fontSize = objSize + 'px';
    
    // Use dynamic gameWidth for spawning
    obj.style.left = Math.random() * (gameWidth - objSize) + 'px';
    gameContainer.appendChild(obj);
    fallingObjects.push(obj);

    // Speed increases as mass grows, making it harder to catch everything
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
        
        // --- Continuous Collision Check ---
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
        // Collection successful!
        clearInterval(moveInterval);
        obj.remove();
        fallingObjects = fallingObjects.filter(o => o !== obj);

        collectObject(obj);
    }
}

function collectObject(obj) {
    playSound(hitSound);
    currentMass += obj.value;
    scoreDisplay.textContent = `Mass: ${currentMass}`;
    
    // Grow the SMBH based on its new mass
    updatePlayerSize();
}

function updatePlayerSize() {
    // Determine the new size, growing slowly as mass increases
    const newSize = initialPlayerSize + Math.floor(currentMass / 200);
    
    // Only update if the size actually changes
    if (newSize > currentPlayerSize) {
        currentPlayerSize = newSize;
        player.style.fontSize = currentPlayerSize + 'px';
        
        // Game Over condition for reaching max playable size (e.g., 200px)
        if (currentPlayerSize > 200) {
            gameOver("MAXIMUM CONSUMPTION REACHED! You fill the screen!", true);
        }
    }
}


// --- Game Flow ---
function startGame() {
    gameMusic.play().catch(e => console.log("Music auto-play blocked.", e));

    // Initialize player as SMBH
    player.innerHTML = '⚫'; // Black Hole emoji
    player.style.fontSize = initialPlayerSize + 'px';
    player.style.left = (gameWidth / 2) + 'px';
    scoreDisplay.textContent = `Mass: ${currentMass}`;

    // Main object spawning loop
    gameInterval = setInterval(() => {
        createObject();
    }, 800); // Faster spawning for consumption theme
}

function gameOver(message, isWin = false) {
    isGameOver = true;
    clearInterval(gameInterval);
    gameMusic.pause();
    
    alert(`${message}\nFinal Mass: ${currentMass}`);
    location.reload(); 
}

// Start the game when the script loads
startGame();