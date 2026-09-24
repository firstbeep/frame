# FRAME — Cinematic Pre-Viz & Storyboard Studio

FRAME is a local desktop web app for filmmakers, set designers, and solo creators. Describe an action line or physical set, choose a camera distance and lighting direction, and develop a monochrome storyboard panel on your own computer.

## QVAC SDK: `@qvac/sdk` exactly `0.19.1`.** No API keys, cloud inference, remote fonts, or analytics. The interface opens in your browser; a Node.js server bound to `127.0.0.1` runs the native QVAC worker locally. It is not an Electron installer.

![FRAME running with a real locally generated image](docs/evidence/studio.png)

## Features

- Original, minimal cinematic interface with desktop and mobile layouts.
- Raw scene description plus wide, medium, or close-up camera direction.
- Noir, soft window light, and architectural lighting presets.
- Stable Diffusion 2.1 Q8 generation at 768×448 or 512×512.
- Repeatable seeds and 12/20/30-step quality choices.
- Actual diffusion step progress in the interface and terminal.
- Real-ESRGAN 4× upscaling through QVAC's standalone `upscale` function.
- Monochrome PNG export and JSON shot notes, including prompt, seed, settings, and timing.
- Persistent local storyboard, draft restoration, job reconnection, and stop-render control.
- Dedicated diffusion worker, extended RPC startup timeout, and actionable startup diagnostics.

Scene parsing is deterministic: the app normalizes whitespace and combines the description with the chosen camera and lighting directions. QVAC performs image generation and upscaling. A local PNG pass ensures genuinely monochrome exports. A prompt guides composition; it does not guarantee exact object placement or continuity between shots.

## QVAC integration

| SDK function | How FRAME uses it |
| --- | --- |
| `loadModel({ modelSrc, modelType, modelConfig })` | Loads a verified local SD 2.1 model or a standalone ESRGAN model using `sdcpp-generation`. |
| `diffusion({ modelId, prompt, ... })` | Produces the original panel; `progressStream` reports real sampling steps, `outputs` returns PNG bytes. |
| `upscale({ modelId, image, repeats: 1 })` | Performs one native 4× ESRGAN pass on the original panel. |
| `unloadModel({ modelId, clearStorage: false })` | Releases model memory in a `finally` block. |
| `heartbeat()` / `close()` | Verify the worker and clean up RPC resources. |

Implementation: [src/render.js](src/render.js). All these functions were checked against the installed **0.19.1** package and exercised by the real smoke test. `@qvac/inference` is supplied by the SDK's locked dependency tree; the custom worker uses its plugin registration API. No changes to `node_modules` are needed.

The SDK returns the final image, not intermediate preview frames. The progress bar reports actual denoising steps; a short reveal animation runs only after the genuine output arrives. Rendering is not guaranteed to finish in 15 seconds. Diffusion and upscaling timings depend on device, resolution, and quality.

## Requirements

- Node.js **22.17+** and npm **10.9+**; Node 24 LTS is recommended.
- Windows 10/11 x64, macOS 14+ (Apple Silicon recommended), or a supported Linux host. **Windows is the platform tested for this project.**
- Windows: current GPU drivers supporting **Vulkan 1.4** and Microsoft Visual C++ 2015–2022 Redistributable **x64**. QVAC requires Vulkan on Windows even with CPU inference.
- Recommended for this diffusion workload: **16 GB system RAM, 6 GB GPU VRAM**, and **8 GB free disk** for packages, models, and initial outputs. This is a practical recommendation, not a guarantee for every GPU.
- Internet for npm installation and the first model download (**2.39 GB** total). Rendering subsequently loads the files from disk.

See [QVAC system requirements](https://docs.qvac.tether.io/system-requirements/) for supported hosts. Update GPU drivers from NVIDIA, AMD, or Intel. Get the [Microsoft runtime from Microsoft](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist). Do not download DLLs from unofficial sites.

## Install — fresh reviewer setup

Download this repository as a ZIP and extract it, or clone its public GitHub URL. Open a terminal in the project directory containing `package.json`.

```sh
git clone https://github.com/firstbeep/frame.git
cd frame
node --version
npm --version
npm ci
npm run doctor
npm run setup
```

Run these in order. `npm ci` uses the committed lockfile and exact SDK version; do not omit optional dependencies or disable install scripts. `doctor` starts the real QVAC worker and tests its RPC handshake. `setup` downloads the two fixed model versions, reports progress, and verifies their SHA-256 hashes against the SDK 0.19.1 registry metadata. Interrupted downloads are kept as `.part` files and resume when you rerun setup. Existing completed models are reverified and reused.

Model weights live in `.cache/models/` and are intentionally excluded from Git. No Hugging Face account is needed for these downloads. The weights retain their upstream licenses; the app's MIT license does not relicense them. See [model provenance](docs/MODELS.md).

## Run

```sh
npm start
```

Open **http://127.0.0.1:3210**. Keep the terminal running.

1. Type a scene, or choose **Try a scene**.
2. Choose camera distance, lighting, frame size, quality, and seed.
3. Click **Render scene**. The terminal and local runtime drawer show real worker activity.
4. Select **Upscale 4×** for the selected original panel if desired.
5. Download **PNG** or **Shot notes**. Click a storyboard thumbnail to revisit it.

Press Ctrl+C in the server terminal to stop. Use **Stop render** to terminate only the active job. Completed panels persist in `outputs/`; thumbnails reload at startup. The app allows one inference job at a time to avoid competing for GPU memory. Upscaling an already upscaled panel is intentionally disabled.


## Offline use and privacy

Complete `npm ci` and `npm run setup` before leaving connectivity. Both model paths are local during rendering; FRAME does not call cloud AI or a model registry during inference. The browser communicates with the local server, so “offline” means **no internet required**, not zero localhost HTTP requests. Prompts, shot notes, and outputs stay on this computer. No network-disconnection test is claimed in the included verification report.

The server binds loopback only and rejects foreign origins and non-local Host headers. Do not expose it through a public tunnel. Prompts appear in locally saved shot notes; keep or delete those files as appropriate for your production.

## Tests

```sh
npm test
npm run test:startup
npm run smoke
```

`npm test` checks input validation, PNG conversion, RPC error reporting, and HTTP boundaries without needing model files. `npm run test:startup` deliberately triggers a real RPC timeout with a 1 ms allowance, checks that it is explained, and verifies startup recovery with the normal allowance. `npm run smoke` requires setup: it performs **real** `loadModel` → `diffusion` → `upscale`, saves both PNGs in `outputs/`, and exits nonzero on failure. It may take several minutes on slower machines. The smoke test does not substitute a fixture for AI output.

Optional browser tests:

```sh
npx playwright install chromium
npm run test:ui
```

To also exercise the Render button, worker, progress, and PNG download end to end:

```powershell
# Windows PowerShell
$env:FRAME_E2E = "1"
npm run test:ui
```

```sh
# macOS / Linux
FRAME_E2E=1 npm run test:ui
```

Browser tests create desktop/mobile screenshots in `artifacts/`. The real UI test refreshes `docs/evidence/studio.png`. See [verification results](docs/VERIFICATION.md) for tested hardware, results, and limits.

## Troubleshooting

### RPC initialization timeout (sometimes written “RCP initialization timeout”)

This means Node could not finish starting or connecting to the local Bare worker. It can mean a worker crash, not simply a slow machine.

1. Run `npm run doctor` and read the complete error, including `Caused by` and worker exit details. Keep the server terminal visible.
2. Confirm `node --version` is at least 22.17 and the architecture is supported. On Windows use x64 Node, install the official VC++ x64 runtime, and update GPU drivers. If available, `vulkaninfo --summary` should show Vulkan 1.4 support.
3. Run `npm ci` again in the extracted project directory. Do not use `--omit=optional`. The platform's Bare runtime/native packages must be installed. Check security-software quarantine history without disabling protection.
4. FRAME ships `qvac/worker.entry.mjs`, which registers only the diffusion addon. Keep that file in the checkout. Loading all SDK addons can introduce unrelated native-library failures.
5. The default startup allowance is **120,000 ms**, configured before the SDK is imported. If startup is actually slow, increase it:

```powershell
$env:QVAC_RPC_INIT_TIMEOUT_MS = "240000"
npm run doctor
npm start
```

```sh
QVAC_RPC_INIT_TIMEOUT_MS=240000 npm run doctor
QVAC_RPC_INIT_TIMEOUT_MS=240000 npm start
```

The environment variable takes precedence over `rpcInitTimeoutMs` in `qvac.config.json`. A longer timeout cannot repair missing DLLs, a corrupt native package, or a driver crash. No automatic repeated worker restart conceals such failures. Unset stale custom `QVAC_WORKER_PATH` or `QVAC_CONFIG_PATH` overrides if they point to another project.

### Other problems

| Symptom | Action |
| --- | --- |
| Models missing / Render disabled | Run `npm run setup` online, then refresh the page. |
| Setup says `terminated` or a network error | Rerun `npm run setup`; partial downloads resume. Check network/proxy access to Hugging Face and GitHub release downloads. |
| Checksum failure | A bad `.part` file is discarded automatically. Retry setup. For a corrupted completed model, move the named file aside and rerun. |
| GPU memory error or worker exits during render | Close other GPU apps, choose Square and Draft, or try CPU mode below. The application remains open; inspect its error and retry. |
| Render takes a long time | First model loading takes time. Inspect real steps in the terminal. CPU rendering can be much slower. Jobs have a 30-minute upper bound. |
| Port 3210 is busy | Stop the previous FRAME server or set `PORT=3211` and visit the corresponding URL. |
| A job continues after refreshing | The page reconnects to the active job. Use Stop render if it is no longer wanted. |
| Browser test cannot find Chromium | Run `npx playwright install chromium`; optionally set `PLAYWRIGHT_CHANNEL=msedge` to use installed Edge. |
| Cannot use `qvac doctor` | That is a separate CLI. FRAME's command is **`npm run doctor`** and needs no global QVAC CLI. |

CPU fallback (Windows still requires Vulkan):

```powershell
$env:FRAME_DEVICE = "cpu"
npm start
```

```sh
FRAME_DEVICE=cpu npm start
```

## License
[MIT](https://github.com/firstbeep/frame?tab=MIT-1-ov-file) 
