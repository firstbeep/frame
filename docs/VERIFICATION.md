# Verification report

## Accepted-project comparison revision — 2026-09-24

- `npm test`: all six SDK functions used by FRAME were present; all **nine** application/model-setup tests passed. New setup tests use a local HTTP server to check fresh downloads, resumed downloads, servers that ignore Range requests, bad hashes, damaged cached files, and verified cache reuse with an unreachable download URL.
- `npm run setup`: both existing SDXL and Real-ESRGAN files passed SHA-256 verification. A second full 4 GB download was unnecessary; the downloader's changed paths were exercised with local fixtures.
- `FRAME_E2E=1 npm run test:ui`: **three** browser tests passed. Playwright launched the server through `npm start`, including its automatic SDXL verification. Checks covered desktop/mobile layouts, a real SDXL render, concurrent-job rejection, original PNG and shot metadata, portable crew board export, brief reuse, and automatic setup readiness recovery with an unavailable optional upscaler.
- `npm run test:startup`: the intentional real RPC timeout and subsequent worker recovery both passed.
- `npm run smoke`: a fresh local SDXL render and Real-ESRGAN upscale both passed. PNG dimensions were checked as 1024×1024 and 4096×4096; both models were unloaded and their worker connections closed. Local output IDs: `13926973-85dd-462b-9d39-8ff0c11116ac` (render) and `2f0b4224-aa89-415a-8c61-4f7a09e81416` (upscale).
- The latest browser render produced a 1024×1024 PNG, with **53.35 seconds** of generation and **8.98 seconds** of model loading reported by QVAC. The screenshot, metadata, and crew board were refreshed from this run. The PNG matched the previous deterministic seed output.
- [demo.webm](evidence/demo.webm) is the unedited Playwright recording of the successful real render/board workflow. Setup-state transitions in the separate readiness test are simulated HTTP responses; the demo's diffusion output is real QVAC inference.

The original clean-clone and hardware observations below are retained as historical evidence, not represented as newly rerun installs. Current SDK verification covers only FRAME's actual functions; it no longer checks unused completion/speech exports.

## Previous verification

Observed on Windows x64 with Node 24.21.0, npm 11.19.0, 15.7 GiB RAM, NVIDIA RTX 4050 Laptop GPU, and Vulkan 1.4. The installed package and lockfile use `@qvac/sdk@0.19.1`.

| Check | Result |
| --- | --- |
| `npm run verify` | Requested `loadModel`, `unloadModel`, `completion`, `diffusion`, and `textToSpeech` exports reported as functions. `upscale` was also present. |
| `npm run doctor` | Real diffusion-only Bare worker started; RPC heartbeat passed with the configured 500,000 ms startup allowance. |
| `npm run setup` | Pinned SDXL 1.0 Q4_0 (3,940,010,720 bytes) and Real-ESRGAN (67,040,989 bytes) downloaded or reused; both SHA-256 hashes verified. A network interruption during SDXL download was resumed successfully. |
| `npm test` | The installed SDK export check and five tests passed: scene constraints, untouched RGB PNG export, portable board escaping/embedded image, nested RPC error details, and local server boundaries. |
| `npm run test:startup` | An intentional 1 ms RPC initialization timeout produced diagnostics; a fresh process started normally afterward. |
| `npm run smoke` | Real local `loadModel` → `diffusion` produced a 1024×1024 color product concept. A separate local `loadModel` → `upscale` produced a 4096×4096 PNG. Both models were unloaded. |
| Browser test, `FRAME_E2E=1 npm run test:ui` | Desktop/mobile layouts passed. The real browser clicked Render, observed a busy job and HTTP 409 for a concurrent job, waited for the image, downloaded the PNG, verified that over 10% of pixels had visible RGB channel separation, exported a self-contained crew board with notes, and reused the shot brief. Two tests passed. |

The smoke render took 45.25 seconds for generation on the tested GPU, plus 8.78 seconds to load the model. The browser render took 46.82 seconds for generation, plus 7.70 seconds for model loading. These are observations on this machine, not a speed promise.

In a clean clone at `artifacts/audit-install`, `npm install` installed 209 packages and resolved `@qvac/sdk@0.19.1`; `npm test` passed the SDK export check and all five application tests. `npm run doctor` completed a real worker handshake, and `npm run test:startup` confirmed diagnostic output and recovery after a deliberate 1 ms RPC timeout. In an earlier separate checkout, hash-verified model files were hard-linked from the main checkout to avoid repeating a 4 GB download; `npm run setup` reverified both hashes and `npm run smoke` completed a new SDXL render and a new 4× upscale. The main checkout performed the full SDXL download from the pinned URL, including an interrupted transfer that resumed successfully.

The real browser screenshot is [studio.png](evidence/studio.png), with the exact generated [panel PNG](evidence/panel.png), [shot metadata](evidence/shot-notes.json), and a portable [crew board](evidence/crew-board.html). The screenshot has no synthetic placeholder image. Browser network requests in the test remained local. A full system network-disconnection test, other operating systems, CPU mode, and every possible GPU driver have not been tested.

The previous SD 2.1/monochrome evidence and timing remain in Git history but no longer describe the current app. Public hosting, X content, and the private Whop submission are audited separately in [REVIEWER-AUDIT.md](REVIEWER-AUDIT.md).
