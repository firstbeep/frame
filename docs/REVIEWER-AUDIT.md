# Bounty requirement audit

This checks the requirements in the user-provided `REQ.txt` against observable code and the public repository. The organizer did not give us a specific rejection explanation, so the likely problems below are hypotheses, not a claimed rejection verdict.

| Requirement | Evidence and current state |
| --- | --- |
| Public GitHub repo | [firstbeep/frame](https://github.com/firstbeep/frame) is public. Push the current color release before using it as resubmission evidence. |
| At least three commits authored by the applicant | Public history had at least seven commits with GitHub author `firstbeep`; this local work also uses `firstbeep <firstwhopsdk@gmail.com>`. Check the published history after the push. |
| Open-source license | Root `LICENSE` is MIT and credits `firstbeep`. The earlier author name did not match the applicant. |
| README includes project, SDK version, features, installation, run, troubleshooting | Root `README.md` now does this. An earlier public version had stale SD 2.1/monochrome claims and broken Markdown after the test command. |
| SDK declared at 0.19.0+ | `package.json` and lockfile pin `@qvac/sdk` exactly `0.19.1`. |
| Calls `loadModel` and an allowed AI function | `src/render.js` runs `loadModel`, `diffusion`, and `upscale` in real local inference. It also unloads/closes the worker. `npm run verify` checks requested exported function names after install; export checks alone are not proof of inference. |
| Inference on device | Worker runs on the laptop with local model file paths after setup. There are no cloud AI APIs. The browser talks to localhost. The tested device completed real SDXL diffusion and Real-ESRGAN upscaling. |
| Working install and demo | `npm ci`, `npm run verify`, `npm run doctor`, `npm run setup`, `npm run smoke`, and the real browser render test were performed on Windows x64. A new reviewer machine still needs the documented native prerequisites and about 4 GB of model downloads. |
| Screenshot / recording with actual AI output | `docs/evidence/studio.png` and `docs/evidence/panel.png` are made from the real browser/QVAC test. A user-reported Whop live demo showed two separate pictures; we cannot inspect the private Whop submission here. |
| X post links repo and tags `@qvac` | The provided URL is [the X post](https://x.com/firshbeepxvft/status/2103024617602650199). X returned 403 to our read-only browser, so its text, link, tag, and attachments remain **unverified**. The X account handle differs from the GitHub handle, though the provided rules do not require them to match. |
| Submit repo URL, X URL, and one to two lines describing the app/functions | Only the user can confirm what the Whop form received. Use the revised description below when resubmitting. |

## Improvements made for the resubmission

The old app forced monochrome through its prompt, negative prompt, and PNG conversion. Those paths now preserve QVAC's natural-color output. A tested SDXL model replaces SD 2.1 for better product and location concepts. A shot title, crew notes, practical brief templates, reproducible seed, saved gallery, and printable crew board give a small production team something it can actually use. Setup resumes interrupted model downloads. A dedicated verifier prints the SDK export types immediately after `npm ci`, while `doctor`, `smoke`, and the browser test verify progressively more of the real runtime.

## Suggested Whop description

> FRAME is an offline shoot planner for product and location teams. It turns a shot brief into a natural-color concept frame, stores crew notes, and exports selected shots as a printable board. QVAC SDK 0.19.1 runs `loadModel`, `diffusion`, and optional `upscale` locally on the device.

The organizer may apply unpublished or discretionary criteria, so the visible checklist cannot explain three generic rejections with certainty. Preserve the exact rejection message if one becomes available. If the X post still shows the old monochrome build, attach a new color demo and use its URL for the next submission; the existing post can stay as history.
