// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let user = null;
let player; // YouTube Player instance
let isPlaying = false;
let currentIndex = 0;

// YouTube Player Initialization
function onYouTubeIframeAPIReady() {
    player = new YT.Player('hidden-player', {
        height: '0',
        width: '0',
        events: {
            onReady: () => console.log('YouTube Player Ready'),
            onStateChange: onPlayerStateChange,
        },
    });
}

// Handle Player State Changes
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
}

// Fetch Music from YouTube API
async function fetchMusic(query) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=2&key=AIzaSyA7k6glBajX2aK8yx49FhqDL43VesRIG64`);
        const data = await response.json();
        displayMusic(data.items);
    } catch (error) {
        console.error('Error fetching music:', error);
    }
}

// Display Search Results
function displayMusic(videos) {
    const musicList = document.getElementById('music-list');
    musicList.innerHTML = ''; // Clear previous results

    videos.forEach((video) => {
        const musicItem = document.createElement('div');
        musicItem.className = 'music-item';
        musicItem.innerHTML = `
            <h2>${video.snippet.title}</h2>
            <p>${video.snippet.channelTitle}</p>
        `;
        musicItem.onclick = () => addToPlaylist(video);
        musicList.appendChild(musicItem);
    });
}

// Add a Video to the Firebase Playlist
async function addToPlaylist(video) {
    if (!user) {
        alert('Please sign in to save your playlist.');
        return;
    }

    try {
        const playlistRef = collection(db, 'playlists', user.uid, 'videos');
        await addDoc(playlistRef, {
            videoId: video.id.videoId,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails.default.url,
        });
        console.log('Video added to playlist');
    } catch (error) {
        console.error('Error adding to playlist:', error);
    }
}

// Play Selected Music
function playMusic(video) {
    player.loadVideoById(video.videoId);
    document.getElementById('current-track').textContent = video.title;
    document.getElementById('channel-logo').src = video.thumbnail;
    document.getElementById('music-player').style.display = 'flex';

    isPlaying = true;
    updatePlayPauseButton();
}

// Play the Next Track
function playNext() {
    if (currentIndex < playlist.length - 1) {
        currentIndex++;
        playMusic(playlist[currentIndex]);
    } else {
        console.log('End of playlist');
    }
}

// Play the Previous Track
function playPrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        playMusic(playlist[currentIndex]);
    }
}

// Update Play/Pause Button State
function updatePlayPauseButton() {
    const playPauseButton = document.getElementById('play-pause');
    playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
}

// Load Playlist from Firestore
function loadPlaylist() {
    if (!user) return;

    const playlistRef = collection(db, 'playlists', user.uid, 'videos');
    onSnapshot(playlistRef, (snapshot) => {
        const playlistDiv = document.getElementById('permanent-playlist');
        playlistDiv.innerHTML = '';

        snapshot.forEach((doc) => {
            const video = doc.data();
            const div = document.createElement('div');
            div.className = 'playlist-item';
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

// Remove a Video from the Firebase Playlist
async function removeFromPlaylist(videoId) {
    if (!user) return;

    try {
        const docRef = doc(db, 'playlists', user.uid, 'videos', videoId);
        await deleteDoc(docRef);
        console.log('Video removed from playlist');
    } catch (error) {
        console.error('Error removing video:', error);
    }
}

// Sign In with Google
document.getElementById('profile-pic').addEventListener('click', async () => {
    if (user) {
        document.getElementById('logout-menu').style.display = 'block';
    } else {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            user = result.user;
            localStorage.setItem('user', JSON.stringify(user));
            updateProfileUI();
        } catch (error) {
            console.error('Error signing in:', error);
        }
    }
});

// Logout
document.getElementById('logout-button').addEventListener('click', async () => {
    try {
        await signOut(auth);
        user = null;
        localStorage.removeItem('user');
        updateProfileUI();
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Update Profile UI
function updateProfileUI() {
    const profilePic = document.getElementById('profile-pic');
    const logoutMenu = document.getElementById('logout-menu');

    if (user) {
        profilePic.src = user.photoURL;
        profilePic.style.display = 'block';
        logoutMenu.style.display = 'none';
    } else {
        profilePic.style.display = 'none';
        logoutMenu.style.display = 'none';
    }
}

// Play/Pause Button Event
document.getElementById('play-pause').addEventListener('click', () => {
    if (isPlaying) {
        player.pauseVideo();
        isPlaying = false;
    } else {
        player.playVideo();
        isPlaying = true;
    }
    updatePlayPauseButton();
});

// Previous Button Event
document.getElementById('prev').addEventListener('click', playPrevious);

// Next Button Event
document.getElementById('next').addEventListener('click', playNext);

// Search Button Event
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search').value;
    if (query.trim()) {
        fetchMusic(query);
    }
});

// Load Playlist on Page Load
window.onload = () => {
    user = JSON.parse(localStorage.getItem('user'));
    updateProfileUI();
    loadPlaylist();
};
