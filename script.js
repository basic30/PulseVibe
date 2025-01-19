// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-firestore.js";

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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let user = null;

// DOM Elements
const profilePic = document.getElementById("profile-pic");
const logoutMenu = document.getElementById("logout-menu");
const logoutButton = document.getElementById("logout-button");
const searchButton = document.getElementById("search-button");
const searchInput = document.getElementById("search");
const musicList = document.getElementById("music-list");
const playlistDiv = document.getElementById("permanent-playlist");

// Update Profile UI
function updateProfileUI() {
    if (user) {
        profilePic.src = user.photoURL || "default-avatar.png"; // Fallback if no profile picture
        profilePic.style.display = "block";
        logoutMenu.style.display = "none";
    } else {
        profilePic.style.display = "none";
        logoutMenu.style.display = "none";
    }
}

// Listen for Authentication State Changes
onAuthStateChanged(auth, (currentUser) => {
    user = currentUser;
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        loadPlaylist();
    } else {
        localStorage.removeItem("user");
    }
    updateProfileUI();
});

// Sign In with Google
profilePic.addEventListener("click", async () => {
    if (user) {
        logoutMenu.style.display = logoutMenu.style.display === "none" ? "block" : "none";
    } else {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            user = result.user;
            updateProfileUI();
        } catch (error) {
            console.error("Error signing in:", error.message);
        }
    }
});

// Logout
logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        user = null;
        updateProfileUI();
    } catch (error) {
        console.error("Error signing out:", error.message);
    }
});

// Fetch Music from YouTube API
async function fetchMusic(query) {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
                query
            )}&maxResults=2&key=AIzaSyA7k6glBajX2aK8yx49FhqDL43VesRIG64`
        );
        const data = await response.json();
        displayMusic(data.items);
    } catch (error) {
        console.error("Error fetching music:", error.message);
    }
}

// Display Search Results
function displayMusic(videos) {
    musicList.innerHTML = ""; // Clear previous results

    videos.forEach((video) => {
        const musicItem = document.createElement("div");
        musicItem.className = "music-item";
        musicItem.innerHTML = `
            <h2>${video.snippet.title}</h2>
            <p>${video.snippet.channelTitle}</p>
        `;
        musicItem.onclick = () => addToPlaylist(video);
        musicList.appendChild(musicItem);
    });
}

// Add Video to Playlist in Firestore
async function addToPlaylist(video) {
    if (!user) {
        alert("Please sign in to save your playlist.");
        return;
    }

    try {
        const playlistRef = collection(db, "playlists", user.uid, "videos");
        await addDoc(playlistRef, {
            videoId: video.id.videoId,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails.default.url,
        });
        console.log("Video added to playlist.");
    } catch (error) {
        console.error("Error adding to playlist:", error.message);
    }
}

// Load Playlist from Firestore
function loadPlaylist() {
    if (!user) return;

    const playlistRef = collection(db, "playlists", user.uid, "videos");
    onSnapshot(playlistRef, (snapshot) => {
        playlistDiv.innerHTML = "";

        snapshot.forEach((doc) => {
            const video = doc.data();
            const div = document.createElement("div");
            div.className = "playlist-item";
            div.innerHTML = `
                <img src="${video.thumbnail}" alt="Thumbnail" />
                <h3>${video.title}</h3>
                <button onclick="removeFromPlaylist('${doc.id}')">Remove</button>
            `;
            div.onclick = () => playMusic(video);
            playlistDiv.appendChild(div);
        });
    });
}

// Remove Video from Firestore Playlist
async function removeFromPlaylist(videoId) {
    if (!user) return;

    try {
        const docRef = doc(db, "playlists", user.uid, "videos", videoId);
        await deleteDoc(docRef);
        console.log("Video removed from playlist.");
    } catch (error) {
        console.error("Error removing video:", error.message);
    }
}

// Search Button Event
searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (query) fetchMusic(query);
});

// Load Playlist on Page Load
window.onload = () => {
    user = JSON.parse(localStorage.getItem("user"));
    updateProfileUI();
    if (user) loadPlaylist();
};
