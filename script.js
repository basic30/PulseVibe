// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDwxKZSVy687iV26zw4Uu2N8-jLQOMo0HU",
    authDomain: "pulse-vibe-53ebb.firebaseapp.com",
    projectId: "pulse-vibe-53ebb",
    storageBucket: "pulse-vibe-53ebb.firebasestorage.app",
    messagingSenderId: "93642702141",
    appId: "1:93642702141:web:b278ba16a754def6969954",
    databaseURL: "https://pulse-vibe-53ebb-default-rtdb.asia-southeast1.firebasedatabase.app/",
    measurementId: "G-D365D3GWK3"
  };

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// DOM Elements
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const backBtn = document.getElementById("back-btn");
const songsContainer = document.getElementById("songs");
const favoritesContainer = document.getElementById("favorites");
const playlistContainer = document.getElementById("playlist");

let currentUser = null;
let player;

// YouTube API Key
const YOUTUBE_API_KEY = 'AIzaSyA7k6glBajX2aK8yx49FhqDL43VesRIG64';

// YouTube Player API
function onYouTubeIframeAPIReady() {
    // Initialize YouTube player without showing the video
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
            'autoplay': 1,
            'controls': 0, // Hide video controls
            'showinfo': 0, // Hide video information
            'modestbranding': 1, // Hide branding
            'rel': 0, // Disable related videos
            'iv_load_policy': 3 // Disable annotations
        },
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

// Fetch Random Songs using YouTube Data API
function fetchRandomSongs() {
    // Example of a random query or you can replace with any query like "random songs"
    const query = "popular songs"; 

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const songs = data.items.map(item => {
                return { title: item.snippet.title, videoId: item.id.videoId };
            });
            renderSongs(songs);
        })
        .catch(error => {
            console.error('Error fetching YouTube data:', error);
        });
}

// Render Songs
function renderSongs(songs) {
    songsContainer.innerHTML = "";
    songs.forEach((song) => {
        const div = document.createElement("div");
        div.textContent = song.title;
        const playBtn = document.createElement("button");
        playBtn.textContent = "Play Audio";
        playBtn.addEventListener("click", () => playSong(song.videoId));

        div.appendChild(playBtn);
        songsContainer.appendChild(div);
    });
}

// Play Song (Audio Only)
function playSong(videoId) {
    if (!currentUser) return alert("Please log in first!");

    player.loadVideoById(videoId);  // Loads the video but hides the video player
    alert("Playing song audio...");
}

// Add to Playlist
function addToPlaylist(song) {
    if (!currentUser) return alert("Please log in first!");

    db.ref(`users/${currentUser.uid}/playlist`).push(song)
        .then(() => alert(`${song.title} added to playlist.`))
        .catch(console.error);
}

// Add to Favorites
function addToFavorites(song) {
    if (!currentUser) return alert("Please log in first!");

    db.ref(`users/${currentUser.uid}/favorites`).push(song)
        .then(() => alert(`${song.title} added to favorites.`))
        .catch(console.error);
}

// Login
loginBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            currentUser = user;
            alert(`Welcome ${user.displayName}`);
            loginBtn.style.display = "none";
            logoutBtn.style.display = "block";
            fetchUserData(user.uid);
        })
        .catch((error) => {
            console.error(error);
        });
});

// Logout
logoutBtn.addEventListener("click", () => {
    auth.signOut()
        .then(() => {
            alert("You have logged out.");
            loginBtn.style.display = "block";
            logoutBtn.style.display = "none";
            favoritesContainer.innerHTML = "";
            playlistContainer.innerHTML = "";
            songsContainer.innerHTML = "";
        })
        .catch((error) => {
            console.error(error);
        });
});

// Fetch User Data
function fetchUserData(userId) {
    // Favorites
    db.ref(`users/${userId}/favorites`).on("value", (snapshot) => {
        const favorites = snapshot.val();
        renderFavorites(favorites);
    });

    // Playlist
    db.ref(`users/${userId}/playlist`).on("value", (snapshot) => {
        const playlist = snapshot.val();
        renderPlaylist(playlist);
    });
}

function renderFavorites(favorites) {
    favoritesContainer.innerHTML = "";
    if (!favorites) return;

    Object.values(favorites).forEach((song) => {
        const div = document.createElement("div");
        div.textContent = song.title;
        favoritesContainer.appendChild(div);
    });
}

function renderPlaylist(playlist) {
    playlistContainer.innerHTML = "";
    if (!playlist) return;

    Object.values(playlist).forEach((song) => {
        const div = document.createElement("div");
        div.textContent = song.title;
        playlistContainer.appendChild(div);
    });
}

// Search Functionality
searchBtn.addEventListener("click", () => {
    const query = searchInput.value;
    if (!query) return;

    // Simulate Search Results using YouTube API
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const results = data.items.map(item => ({
                title: item.snippet.title,
                videoId: item.id.videoId
            }));
            renderSongs(results);
            backBtn.style.display = "inline";
        })
        .catch(error => console.error(error));
});

backBtn.addEventListener("click", () => {
    fetchRandomSongs();
    backBtn.style.display = "none";
});

// Initial Load
fetchRandomSongs();
