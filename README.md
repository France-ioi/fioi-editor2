# fioi-editor2
An editor component based on angular.js and Ace.

Audio recording requires at least Chrome 21 or Firefox 17.

# Build instructions

Install jspm and the project's dependencies:

    npm install -g jspm
    jspm install

Build the distributed files:

    jspm bundle-sfx src/main.js dist/fioi-editor2.js
    jspm bundle-sfx --minify src/main.js dist/fioi-editor2.min.js
    jspm bundle-sfx --minify src/audio-worker.js dist/audio-worker.min.js
