// script.js — improved for your HTML
const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");

const titleEl = document.getElementById("song-title");
const artistEl = document.getElementById("song-artist");
const coverImg = document.getElementById("cover-img");

const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");

const volumeSlider = document.getElementById("volume");
const muteBtn = document.getElementById("mute");

const autoplayCheck = document.getElementById("autoplay");

const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

const playlistEl = document.getElementById("playlist");
let tracks = Array.from(document.querySelectorAll(".track"));

let currentIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeatOne = false;

// helper: format seconds -> m:ss
function formatTime(sec = 0) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

// update range fill (visual)
function updateProgressFill() {
  // fallback colors if CSS var not accessible
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7c3aed";
  const percent = progress.value;
  progress.style.background = `linear-gradient(90deg, ${accent} ${percent}%, rgba(255,255,255,0.06) ${percent}%)`;
}

// load a track into the audio element and UI
function loadTrack(index, autoPlay = false) {
  if (!tracks[index]) return;
  currentIndex = index;

  const t = tracks[index];
  titleEl.textContent = t.dataset.title || "Untitled";
  artistEl.textContent = t.dataset.artist || "Unknown";
  coverImg.src = t.dataset.cover || "covers/default.jpg";
  audio.src = t.dataset.src;

  // active class
  tracks.forEach(x => x.classList.remove("active"));
  t.classList.add("active");

  // reset progress UI until metadata loads
  progress.value = 0;
  updateProgressFill();
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";

  if (autoPlay) playSong();
}

// play / pause
function playSong() {
  audio.play().then(() => {
    isPlaying = true;
    playBtn.textContent = "⏸️";
    coverImg.classList.add("playing");
  }).catch(err => {
    // autoplay might be blocked — just set UI
    isPlaying = false;
    playBtn.textContent = "▶️";
    console.warn("Playback failed:", err);
  });
}

function pauseSong() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = "▶️";
  coverImg.classList.remove("playing");
}

playBtn.addEventListener("click", () => {
  isPlaying ? pauseSong() : playSong();
});

// next / prev logic (respects shuffle)
function nextSong() {
  if (isShuffle) {
    let next;
    if (tracks.length <= 2) {
      next = (currentIndex + 1) % tracks.length;
    } else {
      do { next = Math.floor(Math.random() * tracks.length); } while (next === currentIndex);
    }
    loadTrack(next, true);
  } else {
    const next = (currentIndex + 1) % tracks.length;
    loadTrack(next, true);
  }
}

function prevSong() {
  if (isShuffle) {
    let prev = Math.floor(Math.random() * tracks.length);
    loadTrack(prev, true);
  } else {
    const prev = (currentIndex - 1 + tracks.length) % tracks.length;
    loadTrack(prev, true);
  }
}

nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

// playlist click
tracks.forEach((trackEl, i) => {
  trackEl.addEventListener("click", () => {
    loadTrack(i, true);
  });
});

// update time & progress while playing
audio.addEventListener("timeupdate", () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.value = percent;
  updateProgressFill();
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
});

// when metadata loads, show full duration
audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

// seek by progress range
progress.addEventListener("input", () => {
  if (!audio.duration || isNaN(audio.duration)) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
  updateProgressFill();
});

// volume + mute
// initial volume (respect slider default)
audio.volume = Number(volumeSlider.value ?? 1);

volumeSlider.addEventListener("input", () => {
  audio.volume = Number(volumeSlider.value);
  if (audio.volume === 0) {
    muteBtn.textContent = "🔇";
  } else {
    audio.muted = false;
    muteBtn.textContent = "🔊";
  }
});

muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  if (audio.muted) {
    muteBtn.textContent = "🔇";
  } else {
    muteBtn.textContent = "🔊";
  }
});

// autoplay checkbox influences behavior when a track ends
audio.addEventListener("ended", () => {
  if (isRepeatOne) {
    audio.currentTime = 0;
    playSong();
    return;
  }

  if (autoplayCheck.checked) {
    nextSong();
  } else {
    pauseSong();
  }
});

// shuffle & repeat toggles
shuffleBtn.addEventListener("click", () => {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
  shuffleBtn.textContent = isShuffle ? "Shuffle ✅" : "Shuffle";
});

repeatBtn.addEventListener("click", () => {
  isRepeatOne = !isRepeatOne;
  repeatBtn.classList.toggle("active", isRepeatOne);
  repeatBtn.textContent = isRepeatOne ? "Repeat One ✅" : "Repeat";
});

// init: load first track (do not autoplay automatically unless user checked)
loadTrack(0, false);

// Optional: if the user had autoplay on in markup, respect it at start
if (autoplayCheck.checked) {
  // try to autoplay, will likely be blocked until user gesture
  playSong();
}
