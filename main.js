// Playlist / Audio Nodes configuration
const playlist = [
    {
        title: "Original Master Node",
        artist: "Direct Master Audio",
        audio: "is-this-your-way.mp3",
        cover: "cover.jpg",
        mode: "original"
    },
    {
        title: "Vaporwave Lo-Fi Node",
        artist: "Slowed + Low-Pass FX",
        audio: "is-this-your-way.mp3",
        cover: "cover.jpg",
        mode: "vaporwave"
    },
    {
        title: "Cosmic Reverb Node",
        artist: "Delay + Spacious Echo",
        audio: "is-this-your-way.mp3",
        cover: "cover.jpg",
        mode: "reverb"
    },
    {
        title: "Sub-Bass Master Node",
        artist: "Extra Heavy Lows (+15dB)",
        audio: "is-this-your-way.mp3",
        cover: "cover.jpg",
        mode: "bassboost"
    }
];

let currentTrackIndex = 0;
let isPlaying = false;
let isMuted = false;
let isShuffle = false;
let isRepeat = false;

// Web Audio API Nodes
let audioContext;
let audioSource;
let analyser;
let biquadFilter;
let delayNode;
let delayFeedback;
let bassFilter;

// Three.js Scene Variables
let threeScene;
let threeCamera;
let threeRenderer;
let vinylMesh;
let faceMat;
let lightCrimson;
let lightPurple;

// Hologram and Particles Variables
let hologramMesh;
let hologramPoints;
let hologramGeom;
let originalHologramPositions;
let particlesMesh;
let particleCount = 1200;
let particlePositionsArray;

// Audio Smoothing (exponential dampening to prevent over-saturation / strobe)
let smoothedAmp = 0;
let smoothedBass = 0;
let smoothedTreble = 0;

// Interactive Target Parallax Rotations
let targetRotationX = 0;
let targetRotationY = 0;

// DOM Elements
const audio = document.getElementById("audio-element");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const volumeBtn = document.getElementById("volume-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const repeatBtn = document.getElementById("repeat-btn");
const bassBtn = document.getElementById("bass-btn");
const playerCard = document.querySelector(".player-card");
const vibeSelect = document.getElementById("vibe-select");
const chatMessagesBox = document.getElementById("chat-messages-box");
const chatInput = document.getElementById("chat-input");

// Time elements
const progressContainer = document.getElementById("progress-container");
const progressFill = document.getElementById("progress-fill");
const currentTimeLabel = document.getElementById("current-time");
const totalDurationLabel = document.getElementById("total-duration");

// Vault Lock elements
const vaultScreen = document.getElementById("vault-screen");
const passInput = document.getElementById("pass-input");
const vaultError = document.getElementById("vault-error");

// Simulated Chat Data for offline fallbacks
const simulatedUsers = ["cyber_phantom", "retro_surfer", "wave_rider", "neon_pulse", "lofi_coder", "pixel_punk"];

// Initialize page
window.addEventListener("DOMContentLoaded", () => {
    setupTimeGreeting();
    
    // Load Dark/Light Mode setting from localStorage
    const savedTheme = localStorage.getItem("theme_mode");
    const checkbox = document.getElementById("theme-toggle-checkbox");
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        if (checkbox) checkbox.checked = true;
    } else {
        document.body.classList.remove("light-mode");
        if (checkbox) checkbox.checked = false;
    }

    // Set layout aspect ratio theme
    updateAspectRatioTheme();

    setTimeout(() => {
        const intro = document.getElementById("intro");
        if (intro) {
            intro.style.opacity = "0";
            setTimeout(() => intro.style.display = "none", 1000);
        }
    }, 2500);

    setupParallax();

    // Event listeners
    if (passInput) {
        passInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") checkPasscode();
        });
    }
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendChatMessage();
        });
    }
});

// Setup Time Greeting
function setupTimeGreeting() {
    const hours = new Date().getHours();
    let greet = "Console Decryption Node";
    if (hours < 12) greet = "Morning Session Decryption";
    else if (hours < 18) greet = "Evening Premiere Decryption";
    else greet = "Midnight Session Decryption";
    
    const vaultHeaderP = document.querySelector(".vault-header p");
    if (vaultHeaderP) {
        vaultHeaderP.innerHTML = `${greet} &nbsp;|&nbsp; Secure Node`;
    }
}

// Setup 3D Camera Parallax Mouse Movements
function setupParallax() {
    const dust = document.querySelector(".parallax-dust");

    document.addEventListener("mousemove", (e) => {
        // Background Parallax dust
        const moveX = (e.clientX - window.innerWidth / 2) * -0.012;
        const moveY = (e.clientY - window.innerHeight / 2) * -0.012;
        if (dust) {
            dust.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }

        // Calculate card perspective rotations (tactile tilt)
        if (playerCard) {
            const rect = playerCard.getBoundingClientRect();
            const cardX = rect.left + rect.width / 2;
            const cardY = rect.top + rect.height / 2;

            const rotateY = (e.clientX - cardX) / 24;
            const rotateX = -(e.clientY - cardY) / 24;
            playerCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }

        // Calculate Three.js Target Camera tilts
        targetRotationY = (e.clientX - window.innerWidth / 2) * 0.0012;
        targetRotationX = (e.clientY - window.innerHeight / 2) * 0.0012;
    });

    document.addEventListener("mouseleave", () => {
        if (playerCard) {
            playerCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
        }
        targetRotationX = 0;
        targetRotationY = 0;
    });
}

// Passcode Validation
function checkPasscode() {
    const code = passInput.value.trim().toLowerCase();
    if (code === "kuppi") {
        vaultScreen.style.transform = "translateY(-100vh)";
        vaultScreen.style.opacity = "0";
        setTimeout(() => {
            vaultScreen.style.display = "none";
            document.getElementById("music-workspace").style.display = "grid";
            
            // Initialize Three.js backdrop
            initThreeEngine();
            // Load theme & sizing
            updateAspectRatioTheme();
        }, 1000);

        // Initialize Web Audio and load original mix
        initAudioEngine();
        loadTrack(0);
        togglePlay();

        // Load chat from REST API and start polling sync
        loadChat();
        setInterval(loadChat, 3000);

        setTimeout(() => addComment("Vault Admin", "System decrypted. Dynamic mix visualizer active! 🔓"), 1200);
    } else {
        vaultError.textContent = "DECRYPTION ERROR: Incorrect nickname credentials.";
        passInput.style.borderColor = "#ff3b3b";
        setTimeout(() => {
            passInput.style.borderColor = "var(--glass-border)";
            vaultError.textContent = "";
        }, 3000);
    }
}

// Initialize Web Audio API Nodes with advanced Routing
function initAudioEngine() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; 

    audioSource = audioContext.createMediaElementSource(audio);

    // 1. Vaporwave low-pass filter
    biquadFilter = audioContext.createBiquadFilter();
    biquadFilter.type = "lowpass";
    biquadFilter.frequency.value = 20000;

    // 2. Cosmic Reverb delay line
    delayNode = audioContext.createDelay(2.0);
    delayNode.delayTime.value = 0.0;
    
    delayFeedback = audioContext.createGain();
    delayFeedback.gain.value = 0.0;

    // Connect Reverb delay loop feedback
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);

    // 3. Bass Boost low-shelf filter
    bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 150;
    bassFilter.gain.value = 0;

    // Direct dry signal mixer path
    const dryGain = audioContext.createGain();
    dryGain.gain.value = 1.0;

    audioSource.connect(biquadFilter);
    
    // Split into Dry and Wet (reverb) paths
    biquadFilter.connect(dryGain);
    biquadFilter.connect(delayNode);
    
    dryGain.connect(bassFilter);
    delayNode.connect(bassFilter);
    
    // Connect to analyser
    bassFilter.connect(analyser);
    analyser.connect(audioContext.destination);
}

// Update aspect ratio CSS class & dynamic visualizer sizes
function updateAspectRatioTheme() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    
    document.body.classList.remove("theme-landscape", "theme-tablet", "theme-mobile");
    
    let activeTheme = "Landscape Gold";
    
    // Determine breakpoints
    if (aspect < 0.95 || width < 680) {
        document.body.classList.add("theme-mobile");
        activeTheme = "Cyber Purple";
        
        // Reposition 3D assets for mobile portrait spacing
        if (hologramMesh && vinylMesh) {
            hologramMesh.position.set(0, 1.8, -1.0);
            hologramPoints.position.copy(hologramMesh.position);
            vinylMesh.position.set(0, 1.8, -3.2);
            vinylMesh.scale.set(0.7, 0.7, 0.7);
        }
    } 
    else if ((aspect >= 0.95 && aspect <= 1.35) || width < 1050) {
        document.body.classList.add("theme-tablet");
        activeTheme = "Crimson Eclipse";
        
        // Reposition 3D assets for tablet square spacing
        if (hologramMesh && vinylMesh) {
            hologramMesh.position.set(0, 1.5, -0.8);
            hologramPoints.position.copy(hologramMesh.position);
            vinylMesh.position.set(0, 1.5, -2.8);
            vinylMesh.scale.set(0.85, 0.85, 0.85);
        }
    } 
    else {
        document.body.classList.add("theme-landscape");
        activeTheme = "Liquid Gold";
        
        // Reposition 3D assets for widescreen landscape layout
        if (hologramMesh && vinylMesh) {
            hologramMesh.position.set(2.0, 0.4, 0);
            hologramPoints.position.copy(hologramMesh.position);
            vinylMesh.position.set(-2.5, 0.5, 2.5);
            vinylMesh.scale.set(1.0, 1.0, 1.0);
        }
    }
    
    const themeBadge = document.getElementById("theme-badge");
    if (themeBadge) {
        themeBadge.textContent = activeTheme;
    }
}

// Light Mode Toggle Handler
function toggleLightMode() {
    const isLight = document.getElementById("theme-toggle-checkbox").checked;
    if (isLight) {
        document.body.classList.add("light-mode");
        localStorage.setItem("theme_mode", "light");
        addComment("System Theme", "Light Mode active. Frosted pearl aesthetics enabled. ☀️");
    } else {
        document.body.classList.remove("light-mode");
        localStorage.setItem("theme_mode", "dark");
        addComment("System Theme", "Dark Mode active. Obsidian cyber aesthetics enabled. 🌙");
    }
    
    // Regenerate procedural vinyl color
    updateVinylTexture(playlist[currentTrackIndex].cover);
}

// Initialize Three.js backdrop stage
function initThreeEngine() {
    const container = document.getElementById("three-container");
    if (!container || threeScene) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    threeScene = new THREE.Scene();

    threeCamera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    threeCamera.position.set(0, 1.2, 8.0);
    threeCamera.lookAt(0, 0.4, 0);

    threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    threeRenderer.setSize(width, height);
    threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(threeRenderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    threeScene.add(ambientLight);

    lightCrimson = new THREE.PointLight(0xff0844, 4, 30);
    lightCrimson.position.set(-6, 3, 2);
    threeScene.add(lightCrimson);

    lightPurple = new THREE.PointLight(0x7000ff, 4, 30);
    lightPurple.position.set(6, -3, 2);
    threeScene.add(lightPurple);

    // 1. Crystal Faceted Glass Orb Visualizer (High-render physical material)
    hologramGeom = new THREE.IcosahedronGeometry(1.5, 3);
    originalHologramPositions = hologramGeom.attributes.position.array.slice();

    const hologramMat = new THREE.MeshPhysicalMaterial({
        color: 0x7000ff,
        roughness: 0.12,
        metalness: 0.05,
        transmission: 0.6,
        ior: 1.45,
        thickness: 1.0,
        wireframe: false,
        transparent: true,
        opacity: 0.95,
        flatShading: true
    });

    hologramMesh = new THREE.Mesh(hologramGeom, hologramMat);
    threeScene.add(hologramMesh);

    // Glowing coordinate points overlay
    const pointMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.045,
        transparent: true,
        opacity: 0.65
    });
    hologramPoints = new THREE.Points(hologramGeom, pointMat);
    threeScene.add(hologramPoints);

    // 2. Floating 3D Vinyl Disc
    const recordGeom = new THREE.CylinderGeometry(1.4, 1.4, 0.06, 64);
    const sidesMat = new THREE.MeshStandardMaterial({ color: 0x070709, roughness: 0.5 });
    faceMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.08
    });

    const recordMaterials = [sidesMat, faceMat, sidesMat];
    vinylMesh = new THREE.Mesh(recordGeom, recordMaterials);
    vinylMesh.rotation.set(0.65, 0.25, 0);
    threeScene.add(vinylMesh);

    // 3. Dynamic Dust Particle vortex
    const pGeom = new THREE.BufferGeometry();
    particlePositionsArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 36;
        const radius = 1.0 + (i / particleCount) * 12.0;
        const height = (Math.random() - 0.5) * 4.0;

        particlePositionsArray[i * 3] = Math.cos(angle) * radius;
        particlePositionsArray[i * 3 + 1] = height;
        particlePositionsArray[i * 3 + 2] = Math.sin(angle) * radius;
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(particlePositionsArray, 3));
    const pMat = new THREE.PointsMaterial({
        color: 0xff0844,
        size: 0.035,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(pGeom, pMat);
    threeScene.add(particlesMesh);

    updateVinylTexture(playlist[currentTrackIndex].cover);
    animateThree();
}

// Procedural Vinyl Canvas Texture mapping
function updateVinylTexture(coverSrc) {
    if (!faceMat) return;

    const isLightMode = document.body.classList.contains("light-mode");
    const canvasTexture = document.createElement("canvas");
    canvasTexture.width = 512;
    canvasTexture.height = 512;
    const ctxTex = canvasTexture.getContext("2d");

    // Disc backdrop color depending on mode
    ctxTex.fillStyle = isLightMode ? "#f8f9fc" : "#09090c";
    ctxTex.fillRect(0, 0, 512, 512);

    const img = new Image();
    img.src = coverSrc;
    img.onload = () => {
        // Draw album cover inside center ring
        ctxTex.save();
        ctxTex.beginPath();
        ctxTex.arc(256, 256, 135, 0, Math.PI * 2);
        ctxTex.clip();
        ctxTex.drawImage(img, 121, 121, 270, 270);
        ctxTex.restore();

        // Boundary lines
        ctxTex.strokeStyle = isLightMode ? "rgba(0, 0, 0, 0.08)" : "#1b1b24";
        ctxTex.lineWidth = 4;
        ctxTex.beginPath();
        ctxTex.arc(256, 256, 135, 0, Math.PI * 2);
        ctxTex.stroke();

        // Spindle center hole
        ctxTex.fillStyle = isLightMode ? "#eaecee" : "#000000";
        ctxTex.beginPath();
        ctxTex.arc(256, 256, 14, 0, Math.PI * 2);
        ctxTex.fill();
        
        ctxTex.strokeStyle = isLightMode ? "rgba(0, 0, 0, 0.15)" : "#ff0844";
        ctxTex.lineWidth = 2;
        ctxTex.stroke();

        // Record grooving
        ctxTex.strokeStyle = isLightMode ? "rgba(0, 0, 0, 0.035)" : "rgba(255, 255, 255, 0.035)";
        ctxTex.lineWidth = 1;
        for (let r = 140; r < 250; r += 4) {
            ctxTex.beginPath();
            ctxTex.arc(256, 256, r, 0, Math.PI * 2);
            ctxTex.stroke();
        }

        const texture = new THREE.CanvasTexture(canvasTexture);
        faceMat.map = texture;
        faceMat.needsUpdate = true;
    };
    img.onerror = () => {
        ctxTex.fillStyle = isLightMode ? "#d49a00" : "#ff0844";
        ctxTex.beginPath();
        ctxTex.arc(256, 256, 135, 0, Math.PI * 2);
        ctxTex.fill();
        const texture = new THREE.CanvasTexture(canvasTexture);
        faceMat.map = texture;
        faceMat.needsUpdate = true;
    };
}

// Load track/mix profile
function loadTrack(index) {
    currentTrackIndex = index;
    const track = playlist[index];

    audio.src = track.audio;
    document.getElementById("track-title").textContent = track.title;
    document.getElementById("track-artist").textContent = track.artist;

    updateVinylTexture(track.cover);
    applyAudioNodeEffects(track.mode);

    // Update highlights in console deck
    const listItems = document.querySelectorAll(".playlist-item");
    listItems.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add("active");
            item.querySelector(".playlist-item-indicator").innerHTML = "⚡";
        } else {
            item.classList.remove("active");
            item.querySelector(".playlist-item-indicator").innerHTML = "▶";
        }
    });

    progressFill.style.width = "0%";
    currentTimeLabel.textContent = "0:00";
}

// Apply Web Audio profiles dynamically
function applyAudioNodeEffects(mode) {
    if (!audioContext) return;
    
    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    // Reset default chain states
    audio.playbackRate = 1.0;
    if (biquadFilter) biquadFilter.frequency.value = 20000;
    if (delayNode) delayNode.delayTime.value = 0.0;
    if (delayFeedback) delayFeedback.gain.value = 0.0;
    if (bassFilter) bassFilter.gain.value = 0;
    
    if (bassBtn) bassBtn.classList.remove("active");

    console.log("Applying audio node profile:", mode);

    if (mode === "original") {
        addComment("System Node", "Decrypted Master Node active. Direct pure mix.");
    } 
    else if (mode === "vaporwave") {
        audio.playbackRate = 0.88;
        biquadFilter.frequency.value = 1100;
        addComment("Vaporwave Deck", "Lo-Fi Deck Engaged. Playback slowed to 0.88x + Low-Pass active.");
    } 
    else if (mode === "reverb") {
        delayNode.delayTime.value = 0.38; 
        delayFeedback.gain.value = 0.55; 
        addComment("Reverb Node", "Cosmic Reverb Engaged. Spatial delay active.");
    } 
    else if (mode === "bassboost") {
        bassFilter.gain.value = 15; 
        if (bassBtn) bassBtn.classList.add("active");
        addComment("Sub-Bass Node", "Bass Boost Node active (+15dB Low-Shelf).");
    }
}

// Media controllers
function togglePlay() {
    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }

    if (isPlaying) {
        audio.pause();
        playBtn.innerHTML = "▶";
        playerCard.classList.remove("playing");
        isPlaying = false;
    } else {
        audio.play().then(() => {
            playBtn.innerHTML = "⏸";
            playerCard.classList.add("playing");
            isPlaying = true;
        }).catch(err => console.log("Play blocked:", err));
    }
}

function prevTrack() {
    let index = currentTrackIndex - 1;
    if (index < 0) index = playlist.length - 1;
    loadTrack(index);
    if (isPlaying) audio.play().catch(() => {});
}

function nextTrack() {
    let index = currentTrackIndex + 1;
    if (index >= playlist.length) index = 0;

    if (isShuffle) {
        index = Math.floor(Math.random() * playlist.length);
    }

    loadTrack(index);
    if (isPlaying) audio.play().catch(() => {});
}

// Seek bar event
progressContainer.addEventListener("click", (e) => {
    if (!audio.duration) return;
    const rect = progressContainer.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    audio.currentTime = percentage * audio.duration;
});

audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${progressPercent}%`;

    currentTimeLabel.textContent = formatTime(audio.currentTime);
    totalDurationLabel.textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } else {
        nextTrack();
    }
});

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Manual Bass Boost Overriding
function toggleBassBoost() {
    if (!bassFilter) return;
    if (bassFilter.gain.value > 0) {
        bassFilter.gain.value = 0;
        if (bassBtn) bassBtn.classList.remove("active");
        addComment("Audio Engine", "Bass Boost Deactivated.");
    } else {
        bassFilter.gain.value = 12;
        if (bassBtn) bassBtn.classList.add("active");
        addComment("Audio Engine", "Bass Boost Activated (+12dB Low-Shelf) 🔊");
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("active", isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle("active", isRepeat);
}

function toggleMute() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    volumeBtn.innerHTML = isMuted ? "🔇" : "🔊";
}

// WEBGL 3D ANIMATION RENDER LOOP
function animateThree() {
    requestAnimationFrame(animateThree);

    if (!threeScene || !threeRenderer) return;

    // Smooth camera tilt parallax
    threeCamera.position.x += (targetRotationY * 3.0 - threeCamera.position.x) * 0.05;
    threeCamera.position.y += ((1.2 + targetRotationX * 1.2) - threeCamera.position.y) * 0.05;
    threeCamera.lookAt(0, 0.4, 0);

    // Rotate vinyl disc if playing
    if (isPlaying && vinylMesh) {
        vinylMesh.rotation.y += 0.022;
    }

    // Capture frequency analyser spectrum
    let avgAmp = 0;
    let bassVal = 0;
    let trebleVal = 0;

    if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        avgAmp = sum / bufferLength;

        let bassSum = 0;
        for (let i = 0; i < 15; i++) bassSum += dataArray[i];
        bassVal = bassSum / 15;

        let trebleSum = 0;
        for (let i = 45; i < 64; i++) trebleSum += dataArray[i];
        trebleVal = trebleSum / 19;
    }

    const amplitudeRatio = avgAmp / 255;
    const bassRatio = bassVal / 255;
    const trebleRatio = trebleVal / 255;

    // Smooth audio measurements using linear interpolation (exponential dampening)
    smoothedAmp = THREE.MathUtils.lerp(smoothedAmp, amplitudeRatio, 0.1);
    smoothedBass = THREE.MathUtils.lerp(smoothedBass, bassRatio, 0.1);
    smoothedTreble = THREE.MathUtils.lerp(smoothedTreble, trebleRatio, 0.1);

    // Aspect ratio styling conditions
    const isLightMode = document.body.classList.contains("light-mode");
    const isLandscape = document.body.classList.contains("theme-landscape");
    const isTablet = document.body.classList.contains("theme-tablet");
    const isMobile = document.body.classList.contains("theme-mobile");

    // Dynamic Theme Color determination
    let themeColor = 0xff0844; // default crimson
    let themeColorSec = 0x7000ff; // default purple

    if (isLandscape) {
        themeColor = 0xffb700; // Gold
        themeColorSec = 0xff5500; // Orange
    } else if (isTablet) {
        themeColor = 0xff0844; // Crimson
        themeColorSec = 0x7000ff; // Purple
    } else if (isMobile) {
        themeColor = 0x00f0ff; // Cyan
        themeColorSec = 0x7000ff; // Violet
    }

    // Adjust light intensities smoothly to prevent flashing strobe
    if (lightCrimson && lightPurple) {
        lightCrimson.intensity = 2.0 + smoothedBass * 6.5;
        lightPurple.intensity = 2.0 + smoothedTreble * 6.5;

        lightCrimson.color.lerp(new THREE.Color(themeColor), 0.05);
        lightPurple.color.lerp(new THREE.Color(themeColorSec), 0.05);

        const time = Date.now() * 0.0006;
        lightCrimson.position.x = Math.cos(time * 0.8) * 8.0;
        lightCrimson.position.z = Math.sin(time * 0.8) * 8.0;
        
        lightPurple.position.x = -Math.cos(time * 0.5) * 8.0;
        lightPurple.position.z = -Math.sin(time * 0.5) * 8.0;
    }

    // Spin and color particles
    if (particlesMesh) {
        particlesMesh.rotation.y += 0.0007 + smoothedAmp * 0.005;
        const pScale = 1.0 + smoothedBass * 0.08;
        particlesMesh.scale.set(pScale, pScale, pScale);
        
        // Dynamic color shifting mapped to aspect-ratio themes
        particlesMesh.material.color.lerp(new THREE.Color(themeColor), 0.05);
    }

    // Orb visualizer mesh morphing
    if (hologramMesh && originalHologramPositions) {
        hologramMesh.rotation.y += 0.004 + smoothedTreble * 0.015;
        hologramMesh.rotation.x += 0.002;

        if (hologramPoints) {
            hologramPoints.rotation.copy(hologramMesh.rotation);
        }

        // Deform vertices organically based on audio waves
        const posAttr = hologramGeom.attributes.position;
        const positions = posAttr.array;
        const time = Date.now() * 0.0015;

        for (let i = 0; i < positions.length; i += 3) {
            const x = originalHologramPositions[i];
            const y = originalHologramPositions[i+1];
            const z = originalHologramPositions[i+2];

            const length = Math.sqrt(x*x + y*y + z*z);
            let waveOffset = Math.sin(x * 1.8 + time) * Math.cos(y * 1.8 + time) * 0.12;
            waveOffset += Math.sin(z * 3.5 - time * 1.5) * (smoothedBass * 0.4);

            const newLength = length + waveOffset;

            positions[i] = (x / length) * newLength;
            positions[i+1] = (y / length) * newLength;
            positions[i+2] = (z / length) * newLength;
        }

        posAttr.needsUpdate = true;
        hologramGeom.computeVertexNormals();

        // Smooth color shifts
        hologramMesh.material.color.lerp(new THREE.Color(themeColorSec), 0.05);
        
        // Bounce scale
        const scaleBase = 1.0 + smoothedBass * 0.18;
        hologramMesh.scale.set(scaleBase, scaleBase, scaleBase);
        if (hologramPoints) hologramPoints.scale.copy(hologramMesh.scale);

        // Adjust mesh physical opacity depending on dark/light backgrounds
        if (isLightMode) {
            hologramMesh.material.opacity = 0.22;
            hologramMesh.material.roughness = 0.25;
            hologramMesh.material.metalness = 0.75;
        } else {
            hologramMesh.material.opacity = 0.38;
            hologramMesh.material.roughness = 0.12;
            hologramMesh.material.metalness = 0.9;
        }
    }

    threeRenderer.render(threeScene, threeCamera);
}

// Synced Chat System with Backend API
function loadChat() {
    fetch("/api/chat")
        .then(res => {
            if (!res.ok) throw new Error("API Offline");
            return res.json();
        })
        .then(data => {
            chatMessagesBox.innerHTML = "";
            data.forEach(msg => {
                appendChatBubble(msg.user, msg.text, msg.user === "You");
            });
            scrollChatToBottom();
        })
        .catch(err => {
            console.warn("REST API Offline, using LocalStorage fallback:", err);
            loadChatFallback();
        });
}

// Local Fallback offline database
function loadChatFallback() {
    let chatHistory = JSON.parse(localStorage.getItem("vault_chat") || "[]");

    if (chatHistory.length === 0) {
        chatHistory = [
            { user: "system_terminal", text: "Welcome to Is ThIS YoUr WaY. The vault is decrypted offline.", time: "18:00" },
            { user: "kuppi_fan", text: "Wait... is this Rohit's offline vault?", time: "18:02" }
        ];
        localStorage.setItem("vault_chat", JSON.stringify(chatHistory));
    }

    chatMessagesBox.innerHTML = "";
    chatHistory.forEach(msg => {
        appendChatBubble(msg.user, msg.text, msg.user === "You");
    });
    scrollChatToBottom();
}

function appendChatBubble(username, text, isUser = false) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isUser ? 'user' : 'bot'}`;

    // Apply special styling for bot agent
    if (username === "@vault_agent") {
        bubble.className = "chat-bubble bot agent-bubble";
    }

    const userLabel = document.createElement("span");
    userLabel.className = "chat-user";
    userLabel.textContent = username;

    const textContent = document.createElement("span");
    textContent.className = "chat-text";
    textContent.textContent = text;

    bubble.appendChild(userLabel);
    bubble.appendChild(textContent);

    chatMessagesBox.appendChild(bubble);
    scrollChatToBottom();
}

function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    appendChatBubble("You", text, true);

    const payload = {
        user: "You",
        text: text
    };

    fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) throw new Error("API error");
        return res.json();
    })
    .then(data => {
        loadChat();
    })
    .catch(err => {
        console.warn("POST failed. Saving to offline storage:", err);
        let chatHistory = JSON.parse(localStorage.getItem("vault_chat") || "[]");
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        chatHistory.push({ user: "You", text: text, time: timeStr });
        localStorage.setItem("vault_chat", JSON.stringify(chatHistory));
        
        // Local simulation response
        setTimeout(() => {
            const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
            const reply = "Decryption server offline. Offline local chat loop active.";
            addComment(user, reply);
        }, 1500);
    });
}

function addComment(user, text) {
    const payload = { user: user, text: text };
    fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(loadChat)
    .catch(() => {
        let chatHistory = JSON.parse(localStorage.getItem("vault_chat") || "[]");
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatHistory.push({ user: user, text: text, time: timeStr });
        localStorage.setItem("vault_chat", JSON.stringify(chatHistory));
        loadChatFallback();
    });
}

function scrollChatToBottom() {
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
}

