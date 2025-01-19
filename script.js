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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const apiKey = 'AIzaSyA7k6glBajX2aK8yx49FhqDL43VesRIG64'; // Replace with your YouTube API key
let player;
let currentIndex = 0;
let isPlaying = false;
let tempPlaylist = [];
let favoriteSongs = [];
let permanentPlaylist = [];
let userEmail = '';

// Load YouTube IFrame API
function onYouTubeIframeAPIReady() {
    player = new YT.Player('hidden-player', {
        height: '0',
        width: '0',
        events: {
            onReady: () => console.log('YouTube Player is ready'),
            onStateChange: onPlayerStateChange,
        },
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNext();
    }
}

// Google Sign-In
function onSignIn(googleUser) {
    const profile = googleUser.getBasicProfile();
    userEmail = profile.getEmail();
    document.getElementById('user-photo').src = profile.getImageUrl();
    document.getElementById('user-photo').style.display = 'block';
    document.getElementById('logout-button').style.display = 'block';
    loadUserData();
}

function signOut() {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
        console.log('User signed out.');
        userEmail = '';
        document.getElementById('user-photo').style.display = 'none';
        document.getElementById('logout-button').style.display = 'none';
        clearUserData();
    });
}

// Load user data (favorites and playlist) from Firebase
async function loadUserData() {
    try {
        const userDoc = await db.collection('users').doc(userEmail).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            favoriteSongs = data.favorites || [];
            permanentPlaylist = data.playlist || [];
            updateFavoriteUI();
            updatePlaylistUI();
            console.log('User data loaded:', data);
        } else {
            console.log('No user data found, initializing empty data.');
            favoriteSongs = [];
            permanentPlaylist = [];
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Save user data (favorites and playlist) to Firebase
async function saveUserData() {
    try {
        await db.collection('users').doc(userEmail).set({
            favorites: favoriteSongs,
            playlist: permanentPlaylist,
        });
        console.log('User data saved successfully!');
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

function clearUserData() {
    favoriteSongs = [];
    permanentPlaylist = [];
    updateFavoriteUI();
    updatePlaylistUI();
}

// Fetch and display random music
async function fetchRandomMusic() {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=random&key=${apiKey}`);
        const data = await response.json();
        displayRandomMusic(data.items);
    } catch (error) {
        console.error('Error fetching random music:', error);
    }
}

function displayRandomMusic(videos) {
    const randomMusicContainer = document.getElementById('random-music');
    randomMusicContainer.innerHTML = '';
    videos.forEach((video) => {
        const musicItem = document.createElement('div');
        musicItem.innerHTML = `
            <h3>${video.snippet.title}</h3>
            <button onclick="addToFavorites('${video.id.videoId}', '${video.snippet.title}', '${video.snippet.channelTitle}')">❤️</button>
            <button onclick="addToPlaylist('${video.id.videoId}', '${video.snippet.title}', '${video.snippet.channelTitle}')">➕</button>
        `;
        randomMusicContainer.appendChild(musicItem);
    });
}

// Add to favorites
function addToFavorites(videoId, title, channel) {
    if (!favoriteSongs.some(song => song.videoId === videoId)) {
        favoriteSongs.push({ videoId, title, channel });
        saveUserData(); // Save to Firebase
        console.log('Added to favorites:', title);
    }
}

// Add to playlist
function addToPlaylist(videoId, title, channel) {
    if (!permanentPlaylist.some(song => song.videoId === videoId)) {
        permanentPlaylist.push({ videoId, title, channel });
        saveUserData(); // Save to Firebase
        console.log('Added to playlist:', title);
    }
}

// Play music
function playMusic(videoId) {
    player.loadVideoById(videoId);
    document.getElementById('music-player').style.display = 'block';
}

// Play next/previous song
function playNext() {
    if (currentIndex < tempPlaylist.length - 1) {
        currentIndex++;
        playMusic(tempPlaylist[currentIndex].videoId);
    }
}

function playPrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        playMusic(tempPlaylist[currentIndex].videoId);
    }
}

// Event listeners
document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search').value;
    fetchRandomMusic(query);
});

document.getElementById('logout-button').addEventListener('click', signOut);

// Initialize
window.onload = fetchRandomMusic;
