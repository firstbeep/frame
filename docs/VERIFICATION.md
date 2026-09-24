# Verification report

Observed on Windows x64 with Node 24.21.0, npm 11.19.0, 15.7 GiB RAM, NVIDIA RTX 4050 Laptop GPU, and Vulkan 1.4. The installed package and lockfile use `@qvac/sdk@0.19.1`.

| Check | Result |
| --- | --- |
| `npm run verify` | Requested `loadModel`, `unloadModel`, `completion`, `diffusion`, and `textToSpeech` exports reported as functions. `upscale` was also present. |
| `npm run doctor` | Real diffusion-only Bare worker started; RPC heartbeat passed with the configured 500,000 ms startup allowance. |
| `npm run setup` | Pinned SDXL 1.0 Q4_0 (3,940,010,720 bytes) and Real-ESRGAN (67,040,989 bytes) downloaded or reused; both SHA-256 hashes verified. A network interruption during SDXL download was resumed successfully. |
| `npm test` | Five tests passed: scene constraints, untouched RGB PNG export, portable board escaping/embedded image, nested RPC error details, and local server boundaries. |
| `npm run test:startup` | An intentional 1 ms RPC initialization timeout produced diagnostics; a fresh process started normally afterward. |
| `npm run smoke` | Real local `loadModel` → `diffusion` produced a 1024×1024 color product concept. A separate local `loadModel` → `upscale` produced a 4096×4096 PNG. Both models were unloaded. |
| Browser test, `FRAME_E2E=1 npm run test:ui` | Desktop/mobile layouts passed. The real browser clicked Render, observed a busy job and HTTP 409 for a concurrent job, waited for the image, downloaded the PNG, verified that over 10% of pixels had visible RGB channel separation, exported a self-contained crew board with notes, and reused the shot brief. Two tests passed. |

The smoke render took 45.25 seconds for generation on the tested GPU, plus 8.78 seconds to load the model. The browser render took 46.82 seconds for generation, plus 7.70 seconds for model loading. These are observations on this machine, not a speed promise.

The real browser screenshot is [studio.png](evidence/studio.png), with the exact generated [panel PNG](evidence/panel.png), [shot metadata](evidence/shot-notes.json), and a portable [crew board](evidence/crew-board.html). The screenshot has no synthetic placeholder image. Browser network requests in the test remained local. A full system network-disconnection test, other operating systems, CPU mode, and every possible GPU driver have not been tested.

The previous SD 2.1/monochrome evidence and timing remain in Git history but no longer describe the current app. Public hosting, X content, and the private Whop submission are audited separately in [REVIEWER-AUDIT.md](REVIEWER-AUDIT.md).
