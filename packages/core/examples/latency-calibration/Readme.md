# Players example

This example shows how device output latency may be compensated for, by lining up WebAudio beeps, noise bursts, or an orchestration sequence. Note that no session is created, instead the wall clock is used directly with an infinitely looping sequence.

## Usage

Edit `index.js` to add the `CLOUD_SYNC_ENDPOINT` for your cloud-sync server and select which type of audio sample you want to use by setting _one_ of the flags `USE_TONE`, `USE_NOISE`, `USE_SEQUENCE` to `true`.


```
npm install
npm run dev
```

After running the development server (`npm run dev`), browse to [localhost:8080](http://localhost:8080).


## Known Issues
* ...
