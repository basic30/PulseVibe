// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwxKZSVy687iV26zw4Uu2N8-jLQOMo0HU",
    authDomain: "pulse-vibe-53ebb.firebaseapp.com",
    projectId: "pulse-vibe-53ebb",
    storageBucket: "pulse-vibe-53ebb.firebasestorage.app",
    messagingSenderId: "93642702141",
    appId: "1:93642702141:web:b278ba16a754def6969954",
    databaseURL: "https://pulse-vibe-53ebb-default-rtdb.asia-southeast1.firebasedatabase.app/",
    measurementId: "G-D365D3GWK3",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const apiKey = "AIzaSyA7k6glBajX2aK8yx49FhqDL43VesRIG64"; // YouTube API key
let player;
let currentIndex = 0;
let isPlaying = false;
let tempPlaylist = [];
let favoriteSongs = [];
let permanentPlaylist = [];
let userEmail = "";
let currentTrack = {}; // Store the currently playing track

// YouTube Player Initialization
function onYouTubeIframeAPIReady() {
    player = new YT.Player("hidden-player", {
        height: "0",
        width: "0",
        events: {
            onReady: () => console.log("YouTube Player is ready"),
            onStateChange: onPlayerStateChange,
        },
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updateMediaSession(); // Update notification controls
    } else if (event.data === YT.PlayerState.PAUSED) {
        isPlaying = false;
        updateMediaSession();
    } else if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
}

// Play Music
function playMusic(videoId, title = "Unknown Title", channel = "Unknown Channel") {
    currentTrack = { videoId, title, channel };
    player.loadVideoById(videoId);
    player.playVideo();
    document.getElementById("music-player").style.display = "block";
    updateMediaSession(); // Update notification when the track changes
}

// Play next/previous song
function playNext() {
    if (currentIndex < tempPlaylist.length - 1) {
        currentIndex++;
        const nextTrack = tempPlaylist[currentIndex];
        playMusic(nextTrack.videoId, nextTrack.title, nextTrack.channel);
    }
}

function playPrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        const previousTrack = tempPlaylist[currentIndex];
        playMusic(previousTrack.videoId, previousTrack.title, previousTrack.channel);
    }
}

// Add to favorites
function addToFavorites(videoId, title, channel) {
    if (!favoriteSongs.some((song) => song.videoId === videoId)) {
        favoriteSongs.push({ videoId, title, channel });
        saveUserData(); // Save to Firebase
        console.log("Added to favorites:", title);
    } else {
        alert("Song is already in your favorites.");
    }
}

// Save user data (favorites and playlist) to Firebase
async function saveUserData() {
    if (!userEmail) return;
    try {
        await db.collection("users").doc(userEmail).set({
            favorites: favoriteSongs,
            playlist: permanentPlaylist,
        });
        console.log("User data saved successfully!");
    } catch (error) {
        console.error("Error saving user data:", error);
    }
}

// Media Session API - Notification Controls
function updateMediaSession() {
    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title || "Unknown Title",
            artist: currentTrack.channel || "Unknown Channel",
            album: "Pulse Vibe",
            artwork: [
                { src: "https://via.placeholder.com/96", sizes: "96x96", type: "image/png" },
                { src: "https://via.placeholder.com/128", sizes: "128x128", type: "image/png" },
                { src: "https://via.placeholder.com/192", sizes: "192x192", type: "image/png" },
            ],
        });

        navigator.mediaSession.setActionHandler("play", () => {
            player.playVideo();
            isPlaying = true;
        });

        navigator.mediaSession.setActionHandler("pause", () => {
            player.pauseVideo();
            isPlaying = false;
        });

        navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
        navigator.mediaSession.setActionHandler("nexttrack", playNext);
        navigator.mediaSession.setActionHandler("seekforward", () => {
            const currentTime = player.getCurrentTime();
            player.seekTo(currentTime + 10); // Forward by 10 seconds
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => {
            const currentTime = player.getCurrentTime();
            player.seekTo(currentTime - 10); // Backward by 10 seconds
        });

        // Custom action for adding to favorites
        navigator.mediaSession.setActionHandler("custom", () => {
            addToFavorites(currentTrack.videoId, currentTrack.title, currentTrack.channel);
        });
    }
}

// Initialize (Fetch random music on load)
window.onload = () => {
    fetchRandomMusic();
};

// Fetch and display random music
async function fetchRandomMusic(query = "random music") {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.items) {
            displayMusic(data.items);
        } else {
            console.error("No music found.");
        }
    } catch (error) {
        console.error("Error fetching music:", error);
    }
}

// Display music (random or searched)
function displayMusic(videos) {
    const musicContainer = document.getElementById("random-music");
    musicContainer.innerHTML = ""; // Clear existing music items

    videos.forEach((video) => {
        const musicItem = document.createElement("div");
        musicItem.className = "music-item";
        musicItem.innerHTML = `
            <h3>${video.snippet.title}</h3>
            <p>Channel: ${video.snippet.channelTitle}</p>
            <button onclick="playMusic('${video.id.videoId}', '${video.snippet.title}', '${video.snippet.channelTitle}')">▶️ Play</button>
            <button onclick="addToFavorites('${video.id.videoId}', '${video.snippet.title}', '${video.snippet.channelTitle}')">❤️ Favorite</button>
        `;
        musicContainer.appendChild(musicItem);
    });
}
