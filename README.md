# 🎬 FRAME

On-device shoot planner for small production teams — turn a brief into a natural-color concept frame, enlarge a selected image, and export a printable crew board with the QVAC SDK.

FRAME is for product photographers, filmmakers, and crews who need to agree on a shot before arriving on set. Describe an amber bottle in morning light, a café interior, or a campsite hero shot, choose the camera distance and lighting, then click **Render scene**. You get:

- 🖼️ A full-color concept frame generated locally with Stable Diffusion XL.
- 🔍 Optional 4× enlargement with Real-ESRGAN.
- 📋 A portable crew board with selected frames, shot titles, props, lighting notes, and action.

No cloud AI. No API keys. After installation and the one-time model download, inference uses local files and the crew board opens offline.

![FRAME with an actual QVAC-generated SDXL frame](docs/evidence/studio.png)

[Watch the real browser demo](docs/evidence/demo.webm) · [Example frame](docs/evidence/panel.png) · [Exported crew board](docs/evidence/crew-board.html)

## Features

- **A practical starting point.** Product, café, and outdoor shoot briefs include a scene description and editable crew notes.
- **Control the composition.** Choose wide, medium, or close-up camera distance; six lighting directions; wide, square, or portrait format; detail steps; and a reproducible seed.
- **Natural-color SDXL frames.** Save the original PNG without a monochrome filter. Sampling progress appears in the browser and terminal; the final image appears when generation finishes.
- **Optional 4× upscaling.** Enlarge an original frame with local Real-ESRGAN. Rendering works even when the upscaler has not been installed.
- **A reusable shot library.** Frames and JSON metadata persist locally. Reuse a brief, select shots in sequence, and export a self-contained HTML crew board for printing or saving as PDF.
- **Automatic first-run setup.** `npm start` downloads and verifies SDXL if needed. Interrupted downloads resume; cached models are SHA-256 checked and reused without network requests.
- **Visible job state.** Follow progress, reconnect after a refresh, or stop a render. Only one inference job runs at a time to limit memory use.
- **Local by design.** The app binds to `127.0.0.1`, serves its browser assets locally, and has no analytics or cloud inference calls.

## QVAC dependency

| | |
| --- | --- |
| SDK | [`@qvac/sdk`](https://www.npmjs.com/package/@qvac/sdk) |
| Version | **0.19.1**, pinned exactly in `package.json` and `package-lock.json` |
| Runtime | Node.js **≥ 22.17**, npm **≥ 10.9** |
| Inference | On-device, using the QVAC `sdcpp-generation` worker |
| Other runtime dependency | `pngjs@7.0.0` validates PNG output while preserving its color bytes |
| Development dependency | `@playwright/test@1.58.2` runs browser checks and records the real demo |

## SDK functions used

| QVAC function | Model / resource | What it does here |
| --- | --- | --- |
| `loadModel` | SDXL 1.0 Q4_0 or RealESRGAN_x4plus | Loads a verified local model file for the requested job |
| `diffusion` | SDXL 1.0 Q4_0 | Generates the scene PNG and reports sampling steps |
| `upscale` | RealESRGAN_x4plus | Enlarges an original frame by 4× |
| `unloadModel` | Active model | Releases the loaded model after the job |
| `heartbeat` | Local QVAC worker | Checks the worker connection before model loading |
| `close` | Local QVAC worker | Closes the SDK connection after the job |

These are the six SDK functions FRAME actually calls in [src/render.js](src/render.js). It uses local file paths instead of SDK registry constants; pinned sources and hashes are in [src/config.js](src/config.js). FRAME does not use `completion` or `textToSpeech`.

After installing dependencies, verify the installed SDK exports with:

```sh
npm run verify
# ✓ loadModel: function
# ✓ diffusion: function
# ✓ upscale: function
# ✓ unloadModel: function
# ✓ heartbeat: function
# ✓ close: function
# All 6 SDK functions used by FRAME are present (@qvac/sdk v0.19.1).
```

This checks exports and the SDK version. `npm run doctor` checks the real worker; `npm run smoke` tests actual image generation and upscaling.

## Install

**Prerequisites**

- Node.js ≥ 22.17 and npm ≥ 10.9 ([nodejs.org](https://nodejs.org/)).
- Windows x64: Vulkan 1.4 capable drivers and Microsoft Visual C++ 2015–2022 x64 runtime. Other hosts must meet [QVAC's system requirements](https://docs.qvac.tether.io/system-requirements/).
- For SDXL, plan for roughly 16 GB RAM, a capable GPU with around 6 GB VRAM, and 12 GB free storage. Windows with an RTX 4050 Laptop GPU was tested; other hardware may be slower.
- Internet for package installation and initial model downloads: SDXL is 3.94 GB; the optional upscaler adds 67 MB.

```sh
git clone https://github.com/firstbeep/frame.git
cd frame
npm install
```

Keep npm optional dependencies and install scripts enabled so QVAC's native packages install. Model weights are downloaded separately on first start and are excluded from Git.

## Run

```sh
npm start
```

On first start, FRAME downloads SDXL into `.cache/models/`, shows download progress, and verifies its SHA-256 hash before starting the server. Later starts verify the cached file without downloading it again. Wait for:

```text
Open http://127.0.0.1:3210
```

Open that address, click **Use shoot brief**, then **Render scene**. Try the supplied product brief first. Once the image appears, download the PNG, edit or reuse the brief, and render another shot. Select frames in shoot order, name the project, and click **Export printable board**. Open the downloaded HTML file to print or save as PDF.

To install the optional upscaler or prepare both models before going offline:

```sh
npm run setup
```

Then select an original frame and click **Upscale 4×**. The page detects completed setup automatically. You can run setup in a second terminal while the studio is open; run only one setup/download process at a time.

Images and shot metadata are saved in `outputs/`. **Stop render** terminates the active job; Ctrl+C stops the server. Each job loads and unloads its model to release memory afterward. On the previously tested RTX 4050, a 28-step square render took about 45 seconds for generation plus model loading; timing depends on hardware.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| First start is downloading for a while | SDXL is 3.94 GB. Wait for the local URL in the terminal. If interrupted, rerun `npm start`; partial downloads resume. |
| Download fails or the machine is offline | Complete `npm start` while connected once. For both models, run `npm run setup` before going offline. |
| Incorrect checksum | Move aside only the named damaged file under `.cache/models/`, then rerun setup. Completed downloads must match the pinned SHA-256. |
| RPC initialization timeout | Run `npm run doctor`. Check its full worker error, native optional packages, GPU drivers, and the Windows VC++ runtime. `qvac.config.json` allows 500,000 ms for startup; increasing it cannot fix a missing DLL or worker crash. |
| Vulkan / DLL error on Windows | Update GPU drivers and install the VC++ x64 runtime. The worker needs Vulkan even when using CPU inference. |
| Linux reports `libatomic.so.1` missing | Install your distribution's `libatomic1` package, then rerun `npm run doctor`. |
| Render disabled | Complete model setup. The page rechecks readiness automatically without clearing your brief. |
| Upscale disabled | Run `npm run setup`, select an original frame, and wait for any active job to finish. Upscaling an already enlarged frame is disabled. |
| GPU memory error or slow render | Close other GPU applications and try Wide with Draft detail. To try CPU mode in PowerShell: `$env:FRAME_DEVICE="cpu"; npm start`. CPU mode has not been validated here. |
| Port 3210 busy | Stop your previous FRAME server, or use `$env:PORT="3211"; npm start` in PowerShell (`PORT=3211 npm start` in a POSIX shell). Open the new port. |
| SDK verification says module not found | Run `npm install` before `npm run verify`. |

## How it works

```text
npm start → verify/download SDXL → local HTTP server

browser → POST /api/render → isolated job process
                              ├─ heartbeat() → local worker
                              ├─ loadModel() → SDXL from disk
                              ├─ diffusion() → progress + full-color PNG
                              └─ unloadModel() / close()

selected frame → POST /api/upscale → loadModel() → upscale() → 4× PNG
                                                    └─ unloadModel() / close()

selected frames + crew notes → embedded HTML crew board → print / save as PDF
```

[src/scene.js](src/scene.js) validates the brief and combines its visual description with camera and lighting choices. Crew notes stay separate from the image prompt. [src/server.js](src/server.js) manages jobs and saved frames; [public/board.js](public/board.js) builds the portable board. The worker imports only the diffusion plugin used by this app.

These images are planning references. Confirm real product details, text, scale, and lighting on set.

## Verification and demo

```sh
npm test                 # SDK exports, application checks, model download/cache checks
npm run doctor           # Real worker handshake
npm run setup            # Prepare both model files
npm run smoke            # Real SDXL generation + Real-ESRGAN 4× upscale
npm run test:startup     # Real timeout diagnostics and worker recovery
```

For browser checks:

```sh
npx playwright install chromium
npm run test:ui
```

To also run and record the real Render-button workflow, set `FRAME_E2E=1` before `npm run test:ui` (PowerShell: `$env:FRAME_E2E="1"`). This refreshes the screenshot, generated frame, metadata, and crew board under `docs/evidence/`; Playwright saves recordings in `test-results/`. The linked demo is a recording of that real workflow.

See [verification results](docs/VERIFICATION.md), [model provenance](docs/MODELS.md), and [the comparison with Tavern Master](docs/COMPARISON.md). No system-wide network-disconnection test or cross-platform GPU test is claimed.

## License

MIT — see [LICENSE](LICENSE). Model weights have their own [licenses and sources](docs/MODELS.md).

---

Built with [QVAC](https://qvac.tether.io/) — on-device AI for planning the next shoot. No API keys, no cloud inference.
