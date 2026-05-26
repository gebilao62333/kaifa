#!/bin/bash
cd /home/devbox/project/kaifa/frontend
rm -rf node_modules/.vite
node node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5173 --force
