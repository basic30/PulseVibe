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

// YouTube API Key
const apiKey = "AIzaSyA7k6glBajX2aK8yx49FhqDL43VesRIG64";

// Global Variables
let userEmail = "";
let player;
let currentIndex = 0;
let isPlaying = false;
let tempPlaylist = [];
let favoriteSongs = [];
let permanentPlaylist = [];
let currentTrack = {}; // Stores the currently playing track

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
    const searchIcon = document.getElementById("search-icon");
    const searchBox = document.getElementById("search-box");
    const searchButton = document.getElementById("search-button");
    const userPhoto = document.getElementById("user-photo");

    // Toggle Search Box
    searchIcon.addEventListener("click", () => {
        searchBox.style.display = searchBox.style.display === "block" ? "none" : "block";
        searchButton.style.display = searchBox.style.display;
        if (searchBox.style.display === "block") searchBox.focus();
    });

    // Handle Search
    searchButton.addEventListener("click", () => {
        const searchQuery = searchBox.value.trim();
        if (searchQuery) fetchRandomMusic(searchQuery);
        else alert("Please enter a search query.");
    });

    // User Photo Logout
    userPhoto.addEventListener("click", () => {
        if (userEmail) {
            const auth2 = gapi.auth2.getAuthInstance();
            auth2.signOut().then(() => {
                console.log("User signed out.");
                userEmail = "";
                userPhoto.src = "https://via.placeholder.com/40";
                alert("You have been logged out.");
            });
        } else {
            alert('Please sign in using the "Sign-In" button.');
        }
    });
});

// Google Sign-In Success Handler
function onSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();
    userEmail = profile.getEmail();
    document.getElementById("user-photo").src = profile.getImageUrl();
    alert(`Welcome, ${profile.getName()}!`);
    fetchRandomMusic(); // Load music after login
}

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

// Player State Changes
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        updateMediaSession();
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
    updateMediaSession();
}

// Play Next/Previous
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

// Fetch Music
async function fetchRandomMusic(query = "popular songs") {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${query}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.items) displayMusic(data.items);
        else console.error("No music found.");
    } catch (error) {
        console.error("Error fetching music:", error);
    }
}

// Display Music
function displayMusic(videos) {
    const musicContainer = document.getElementById("random-music");
    musicContainer.innerHTML = ""; // Clear previous results

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

// MediaSession API for Notifications
function updateMediaSession() {
    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title || "Unknown Title",
            artist: currentTrack.channel || "Unknown Channel",
            album: "Pulse Vibe",
            artwork: [
                { src: "https://via.placeholder.com/96", sizes: "96x96", type: "image/png" },
            ],
        });

        navigator.mediaSession.setActionHandler("play", () => player.playVideo());
        navigator.mediaSession.setActionHandler("pause", () => player.pauseVideo());
        navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
        navigator.mediaSession.setActionHandler("nexttrack", playNext);
    }
}

// Load Random Music on Page Load
window.onload = () => fetchRandomMusic();
