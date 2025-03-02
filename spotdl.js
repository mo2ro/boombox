const SpottyDL = require("spottydl");
(async () => {
  await SpottyDL.getTrack(
    "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
  ).then(async (results) => {
    let track = await SpottyDL.downloadTrack(results);
    console.log(track);
  });
})();
