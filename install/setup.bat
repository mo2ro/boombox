@echo off
setlocal enabledelayedexpansion

set REPO_URL=https://github.com/mo2ro/boombox

for %%I in (%REPO_URL%) do set REPO_NAME=%%~nI

git clone %REPO_URL%

cd %REPO_NAME% || exit /b

npm install

node index.js
