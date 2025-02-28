# Boombox

Play local files with a WebUI

## Installation

There aren't any releases currently, but you can clone the repository and run it from source:

    git clone https://github.com/mo2ro/boombox && cd boombox
    npm i
    node index.js

## Usage

When you run the server, your app will open on port 3000 by default. It will load any audio files from the directory "uploads" (also by default, configurable) and display them. The audio files will be played procedurally until the end where it repeats, but there are options to loop the current song.

### What can I configure?

The following aspects are (currently) editable:

- Stylesheet used (`string`)
- Directory to play music from (`string`)

Coming soon

- Mute tab on unfocus (`bool`)
- Add delay before playing next song (`bool`)

All settings can be edited manually from the config.json file or the WebUI by visiting /settings
