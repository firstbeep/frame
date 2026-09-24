# Comparison with the accepted Tavern Master project

Reference: [forthecentury3/tavern-master](https://github.com/forthecentury3/tavern-master/tree/135bfaaa4aa839155edc7465ec6db4acd34ce8a5), reviewed on 2026-09-24. The rejection text supplied for FRAME was only “Didnot met the requirement.” These are observable differences, not a confirmed explanation of the rejection.

| Area | Tavern Master | FRAME before this revision | Revision / decision |
| --- | --- | --- | --- |
| First run | `npm install`, then `npm start`; models download during startup | Separate model setup required; starting without it left rendering disabled | `npm start` now verifies/downloads SDXL automatically; optional upscaling remains a separate setup choice |
| README | Product introduction, features, dependency table, function table, install, run, troubleshooting, architecture, license | Combined dependency/call prose, long initial command sequence, and review history mixed with product documentation | Same main section order as the accepted project, written for FRAME's actual behavior |
| SDK verification | Checks the functions its NPC pipeline uses | Also checked completion and speech exports despite not using them | Checks exactly the six functions called by FRAME; real inference remains a separate test |
| Demo | Recorded browser demo under `docs/` | Screenshot, PNG, metadata, and HTML board | Added a real browser recording alongside refreshed evidence |
| Progress | Capability state and streamed generation output | Diffusion step progress and worker logs already present; setup readiness needed a refresh | Setup readiness updates automatically and preserves the draft |
| Independent capabilities | Separate portrait, story, and voice paths | Rendering and upscaling already separate, but setup downloaded both and the disabled upscale button lacked guidance | First start requires only SDXL; missing upscale has an explicit install hint |
| Model lifecycle | Keeps several models resident | Loads and unloads one model per job | Retained to limit idle memory use and preserve process-level cancellation; no instant-render promise |
| AI features | NPC completion, portrait diffusion, speech | Shoot diffusion and image upscaling | Retained FRAME's scope. Adding unused speech/completion would not demonstrate working functionality |
| Core submission properties | Pinned SDK, MIT license, local inference, public source | Those properties were already present | Kept SDK 0.19.1 and all existing dependency versions |

The reference does not establish that every accepted project must use all its AI capabilities, model constants, port, or memory strategy. FRAME's real calls are `loadModel`, `diffusion`, `upscale`, `unloadModel`, `heartbeat`, and `close`.

The private submission, current X post, applicant identity, and organizer-specific eligibility rules are outside this code comparison. See [the prior reviewer audit](REVIEWER-AUDIT.md) for the previously supplied checklist. Resubmission must use the published revision and a matching demo; local changes alone do not update GitHub or a submitted form.
