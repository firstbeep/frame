# Verification report

Date: 2026-09-24. These are observed results, not a promise that every hardware/driver combination will behave identically.

## Device

- Windows x64, Node 24.21.0, npm 11.19.0.
- 15.7 GiB system RAM; NVIDIA GeForce RTX 4050 Laptop GPU.
- Vulkan device API 1.4.341 for NVIDIA; Intel UHD also present.
- `@qvac/sdk@0.19.1`, `@qvac/inference@0.19.1`, `pngjs@7.0.0`, committed npm lockfile.

## Observed passes

- Initial `npm install` completed; real native-worker `heartbeat()` passed using the diffusion-only worker.
- `npm run test:startup`: intentionally triggered a genuine RPC initialization timeout with a 1 ms allowance; the error included the troubleshooting guidance. A second process with the normal 120,000 ms allowance successfully started the worker afterward.
- Both model files downloaded and matched the SDK registry SHA-256 hashes. The SD download was interrupted around 70%; rerunning setup successfully resumed and completed it.
- `npm test`: four tests passed (input/resource bounds, monochrome conversion, nested RPC crash diagnostics, HTTP origin/host and file-path boundaries).
- `npm run smoke`: actual model load, 12-step 768×448 diffusion, and standalone 4× ESRGAN inference passed. The PNG dimensions were 768×448 and 3072×1792. Model memory and RPC worker were released after each operation.
- SD smoke-model load reported 4.55s and generation 5.36s, excluding Node/browser startup and post-processing. These are single-device observations.
- Browser layout tests passed at 1440×1080 and 390×844, without horizontal overflow, page JavaScript errors, or external browser requests. Tested with Chromium; the layout test also passed with installed Edge.
- Real browser test clicked Render scene, observed busy state, rejected a concurrent render with HTTP 409, waited for Panel ready, and downloaded a real PNG. 20-step generation reported 7.32s, with 4.38s model loading; the full browser test took 17.5s.
- `docs/evidence/studio.png` is an unmodified browser screenshot showing the genuine generated panel. The page's reveal animation was completed before capture.
- Started a real render, cancelled it through the HTTP endpoint, and confirmed the job became `cancelled` and the render slot was released.

## Clean-checkout reviewer run

Created a separate Git clone at `artifacts/reviewer-clean`, with no copied `node_modules`, model files, or outputs. On the same Windows machine:

1. `npm ci --no-audit --no-fund` installed all 209 locked packages successfully (npm's package download cache was available).
2. `npm run doctor` successfully started the clone's own diffusion worker.
3. `npm test` passed all four checks.
4. `npm run setup` independently downloaded both models from their upstream URLs and verified their hashes.
5. `npm run smoke` successfully loaded the clone's model files, generated a new panel, ran standalone 4× upscaling, and exited with code 0.

This verifies a clean checkout and dependency/model setup on the tested machine. It does not emulate a different operating system or a machine missing the documented native prerequisites. The reference panel and its exact generation metadata are saved as `docs/evidence/panel.png` and `docs/evidence/shot-notes.json`.

## Scope and limits

Models and packages require internet during setup. Browser requests were observed to remain local; a system-wide network-disconnection test has not been performed. Rendering uses absolute local model paths, not registry or cloud inference calls. macOS, Linux, CPU fallback, driver-less hardware, and the 30-minute watchdog have not been exercised here. No public GitHub repo, X post, or bounty submission has been made as part of this build.

The test suite separates fast checks from opt-in real inference. It does not fabricate a generated image or silently replace QVAC with a mock.
