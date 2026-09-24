# Submission preparation

## Included in this project

- [x] Original application using real on-device inference.
- [x] `@qvac/sdk` exactly `0.19.1` in dependencies and lockfile.
- [x] `loadModel`, `diffusion`, and `upscale` calls exercised on a real device.
- [x] MIT license and README with project, features, SDK, install, run, and troubleshooting sections.
- [x] At least three local commits using the existing configured Git author.
- [x] Screenshot with actual generated output: `docs/evidence/studio.png`.

## Complete before submitting

- [ ] Create a **public** GitHub repository and push this Git history (do not squash it to one commit).
- [ ] Confirm your own Git identity is the author of the commits: `git log --format="%h %an <%ae> %s"`.
- [ ] Check the public README image renders, and follow the install steps from a fresh clone.
- [ ] Publish the X post below, replacing the placeholder with your real public repo URL, tagging **@qvac**, and attaching the screenshot or your recording.
- [ ] Submit the public GitHub URL, X post URL, screenshot, and description to the bounty.

Public repository creation, the X post, and bounty submission have **not** been performed by the local build. Nothing here claims organizer approval.

## Submission description

FRAME is an on-device cinematic pre-visualization and storyboard studio that turns scene descriptions into monochrome panels and upscales selected frames. It uses QVAC SDK 0.19.1's `loadModel`, `diffusion`, and `upscale`; all inference runs locally.

## X post draft

Built FRAME, a local cinematic pre-viz studio for filmmakers. Describe a scene → render a monochrome storyboard → upscale 4×. Powered by @qvac SDK 0.19.1. On-device inference, no cloud AI or API keys.

Repo: <YOUR_PUBLIC_GITHUB_REPO_URL>

## 15-second demo storyboard

Download the models and run one test before recording. Keep the app and terminal visible. Use Draft mode on a capable GPU.

- 0–3s: Enter a short scene and click Render scene.
- 3–11s: Show the actual diffusion steps in the local runtime drawer or terminal.
- 11–15s: Show the finished panel and PNG export.

If your device takes longer, use a clearly labeled time-lapse or a longer recording. Do not imply a fixed 15-second generation time, pretend an old image is newly generated, or describe localhost requests as zero HTTP requests. To demonstrate offline operation, complete setup, disconnect internet yourself, and record a fresh successful render.
