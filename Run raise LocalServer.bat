@echo off
start chrome.exe "http://localhost:7000"
python -m http.server 7000
exit