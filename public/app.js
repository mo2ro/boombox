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
  playlistTable.innerHTML = ""; // Clear existing content
  playlist = data.files;
  currentSongIndex = -1; // Reset current song index

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
          row.querySelector(".cover").src = "default-cover.png"; // Fallback cover
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
function playSong(filePath, index, row) {
  if (currentSong === filePath) {
    togglePlay();
    return;
  }

  onkeydown = (e) => {
    if (e.key == " ") {
      togglePlay();
    }
  };
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

  updateSeekBar();
}

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
}

function prevSong() {
  if (currentSongIndex > 0) {
    const prevIndex = currentSongIndex - 1;
    playSong(
      `/${player.folder}/${playlist[prevIndex]}`,
      prevIndex,
      document.querySelector(`#playlist tr:nth-child(${prevIndex + 1})`)
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

  audioPlayer.ontimeupdate = function () {
    seekBar.value = audioPlayer.currentTime;
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
