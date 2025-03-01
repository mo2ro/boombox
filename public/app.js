let audioPlayer = new Audio();
let currentSong = null;
let isLooping = false;
let playlist = [];
let currentSongIndex = -1;

async function loadPlaylist() {
  const response = await fetch("/playlist");
  const data = await response.json();
  document.getElementById("folder-name").innerText =
    data.folderName || "Playlist";
  window.player = { folder: data.folderName };

  const playlistTable = document.getElementById("playlist");
  playlistTable.innerHTML = "";
  playlist = data.files;
  currentSongIndex = -1;

  if (playlist.length === 0) {
    playlistTable.innerHTML =
      '<tr><td colspan="4">No songs available</td></tr>';
    return;
  }

  playlist.forEach((song, index) => {
    const row = document.createElement("tr");
    const filePath = `/${player.folder}/${song}`;

    row.innerHTML = `
              <td><img src="default-cover.png" class="cover" data-src="${filePath}"></td>
              <td class="title">${song.replace(".mp3", "")}</td>
              <td class="artist">Unknown</td>
              <td class="duration">--:--</td>
          `;

    row.addEventListener("click", () => playSong(filePath, index, row));
    playlistTable.appendChild(row);

    fetchMetadata(filePath, row);
    fetchDuration(filePath, row);
  });
}

async function fetchMetadata(filePath, row) {
  try {
    const response = await fetch(filePath);
    const blob = await response.blob();

    jsmediatags.read(blob, {
      onSuccess: (tag) => {
        if (tag.tags.title)
          row.querySelector(".title").innerText = tag.tags.title;
        if (tag.tags.artist)
          row.querySelector(".artist").innerText = tag.tags.artist;

        if (tag.tags.picture) {
          let { data, format } = tag.tags.picture;
          let base64String = "";
          for (let i = 0; i < data.length; i++) {
            base64String += String.fromCharCode(data[i]);
          }
          let imageData = `data:${format};base64,${btoa(base64String)}`;
          row.querySelector(".cover").src = imageData;
        } else {
          row.querySelector(".cover").src = "default-cover.png";
        }
      },
      onError: (error) => {
        console.log("Metadata read error:", error);
      },
    });
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }
}

async function fetchDuration(filePath, row) {
  const audio = new Audio(filePath);

  audio.onloadedmetadata = function () {
    const durationInSeconds = audio.duration;
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    row.querySelector(".duration").innerText = `${minutes}:${
      seconds < 10 ? "0" + seconds : seconds
    }`;
  };

  // In case of errors
  audio.onerror = function () {
    row.querySelector(".duration").innerText = "--:--";
    console.error("Error loading audio file:", filePath);
  };
}
onkeydown = (e) => {
  if (e.key == " ") {
    togglePlay();
  }
};

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => togglePlay());
  navigator.mediaSession.setActionHandler("pause", () => togglePlay());
  navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());
  navigator.mediaSession.setActionHandler("nexttrack", () => nextSong());
}

function updateMediaSessionMetadata(title, artist, cover) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      artwork: [
        { src: cover, sizes: "96x96", type: "image/png" },
        { src: cover, sizes: "128x128", type: "image/png" },
        { src: cover, sizes: "192x192", type: "image/png" },
        { src: cover, sizes: "256x256", type: "image/png" },
        { src: cover, sizes: "384x384", type: "image/png" },
        { src: cover, sizes: "512x512", type: "image/png" },
      ],
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());
  }
}

function playSong(filePath, index, row) {
  if (currentSong === filePath) {
    togglePlay();
    return;
  }

  document
    .querySelectorAll("#playlist tr")
    .forEach((r) => r.classList.remove("playing"));

  row.classList.add("playing");

  currentSong = filePath;
  currentSongIndex = index;
  audioPlayer.src = filePath;
  audioPlayer.play();

  document.getElementById("current-title").innerText =
    row.querySelector(".title").innerText;
  document.getElementById("current-artist").innerText =
    row.querySelector(".artist").innerText;
  document.getElementById("current-cover").src =
    row.querySelector(".cover").src || "";
  document.getElementById("media-controls").classList.remove("hidden");

  document.querySelector("button[onclick='togglePlay()']").innerHTML =
    "<img src='/svg/pause.svg'></img>";
  document.title = "boombox - " + row.querySelector(".title").innerText;
  updateMediaSessionMetadata(
    row.querySelector(".title").innerText,
    row.querySelector(".artist").innerText,
    row.querySelector(".cover").src || ""
  );
  updateSeekBar();
}

setInterval(() => {
  document.querySelector("#seek-bar").max = audioPlayer.duration;
}, 500);

function togglePlay() {
  if (audioPlayer.paused) {
    audioPlayer.play();
    document.querySelector("button[onclick='togglePlay()']").innerHTML =
      "<img src='/svg/pause.svg'></img>";
  } else {
    audioPlayer.pause();
    document.querySelector("button[onclick='togglePlay()']").innerHTML =
      "<img src='/svg/play.svg'></img>";
  }
}

function toggleLoop() {
  isLooping = !isLooping;
  audioPlayer.loop = isLooping;
  if (isLooping) {
    document.querySelector(".low").style.filter = "invert(1)";
  } else {
    document.querySelector(".low").style.filter = "invert(0)";
  }
}

function prevSong() {
  if (currentSongIndex > 0) {
    const prevIndex = currentSongIndex - 1;
    playSong(
      `/${player.folder}/${playlist[prevIndex]}`,
      prevIndex,
      document.querySelector(`#playlist tr:nth-child(${prevIndex + 1})`)
    );
  } else {
    playSong(
      `/${player.folder}/${playlist[playlist.length - 1]}`,
      playlist.length,
      document.querySelector(`#playlist tr:nth-child(${playlist.length})`)
    );
  }
}

window.addEventListener("keydown", function () {
  if (event.keyCode == 32) {
    document.body.style.overflow = "hidden";
  }
});
window.addEventListener("keyup", function () {
  if (event.keyCode == 32) {
    document.body.style.overflow = "auto";
  }
});

function nextSong() {
  if (currentSongIndex < playlist.length - 1) {
    const nextIndex = currentSongIndex + 1;
    playSong(
      `/${player.folder}/${playlist[nextIndex]}`,
      nextIndex,
      document.querySelector(`#playlist tr:nth-child(${nextIndex + 1})`)
    );
  } else {
    playSong(
      `/${player.folder}/${playlist[0]}`,
      0,
      document.querySelector(`#playlist tr:nth-child(1)`)
    );
  }
}

onclick = () => {
  setTimeout(() => {
    document.querySelector("#seek-bar").max = audioPlayer.duration;
  }, 100);
};

document.getElementById("seek-bar").addEventListener("mousedown", () => {
  audioPlayer.muted = true;
});

document.getElementById("seek-bar").addEventListener("mouseup", () => {
  audioPlayer.muted = false;
});

audioPlayer.addEventListener("ended", nextSong);

function updateSeekBar() {
  const seekBar = document.getElementById("seek-bar");
  const time = document.getElementById("time")

  audioPlayer.ontimeupdate = function () {
    seekBar.value = audioPlayer.currentTime;
    time.innerText = `${Math.floor(audioPlayer.currentTime / 60)}:${(Math.floor(audioPlayer.currentTime % 60)).toString().padStart(2, "0")}`
  };

  seekBar.addEventListener("input", function () {
    audioPlayer.currentTime = seekBar.value;
  });
}

document.addEventListener("DOMContentLoaded", loadPlaylist);

setTimeout(() => {
  Array.from(document.querySelectorAll("*"))
    .filter((i) => i.hasAttribute("src"))
    .forEach((sc) => {
      if (sc.src.startsWith("https://codesandbox")) {
        sc.remove();
      }
    });
}, 100);
