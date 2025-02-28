const express = require("express");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "config.json");
const app = express();
const port = 3000;

let config = JSON.parse(fs.readFileSync(configPath, "utf8"));
app.use(
  config["playlist directory"].split(".")[1],
  express.static(path.join(__dirname, config["playlist directory"]))
);
console.log(config["playlist directory"].split(".")[1]);
app.use(express.static("public"));
app.use(express.json());

let dtpf = `${config["playlist directory"]}`;

console.log(dtpf);
const playlistDirectory = path.join(__dirname, dtpf);
const folderName = path.basename(playlistDirectory);

// Ensure the upload directory exists
if (!fs.existsSync(playlistDirectory)) {
  fs.mkdirSync(playlistDirectory, { recursive: true });
}

// Endpoint to get playlist filenames
app.get("/playlist", (req, res) => {
  fs.readdir(playlistDirectory, (err, files) => {
    if (err) {
      console.error("Error reading playlist folder:", err);
      return res.status(500).json({ error: "Failed to load playlist" });
    }

    const audioFiles = files.filter((file) => file.endsWith(".mp3"));
    res.json({ folderName, files: audioFiles });
  });
});

app.get("/styles.css", (req, res) => {
  res.sendFile(path.join(__dirname, "/themes/", config["theme path"]));
});

// Get Config
app.get("/api/config", (req, res) => {
  res.json(config);
});

// Update Config
app.post("/api/config", (req, res) => {
  try {
    config = req.body;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
    res.json({ success: true, message: "Config updated successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update config." });
  }
});

// Serve Settings Page
app.get("/settings", (req, res) => {
  res.sendFile(path.join(__dirname, "settings.html"));
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});
