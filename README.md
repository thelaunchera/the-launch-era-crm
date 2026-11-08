# OFF BRIEF Video Studio — Google Flow production source

Private source for The Launch Era / OFF BRIEF.

This copies the existing Vite Video Studio with original canonical scripts, editing, Sound, Split, transitions and verified universal intro. Final Cut prefers Google Flow; older Higgsfield boards remain reference links.

## Included
- src/canonical-production.js — original English scripts, camera, cast, actions, dialogue.
- src/flow-production.js — scene-specific prompts grounded in the canonical scripts.
- src/final-cut.js — finished MP4 editor with split, soundtrack, pauses, transitions.
- src/editor.js — legacy storyboard and voice production space.
- assets/intro/part-00.b64 … part-16.b64 — 5-second intro encoded in 17 separate blobs. The build verifies SHA256 and reconstructs the original binary.
- .github/workflows/deploy-pages.yml — ready for a dedicated repo configured to publish with GitHub Actions.

## Run & build
Install Node.js 22 and run: npm install, then npm run dev. To build: npm run build. The build reconstructs the original intro from its verified 17 pieces. Vite base='./' supports GitHub Pages project subpaths.

## Flow workflow
Select episode and F01–F10 scene, press Copy Flow scene prompt, and open https://flow.google.com. Use the approved original scene photo. Do not invent or alter Nia/Ruby's faces, wardrobe, speech, or actions. Name clips OFFBRIEF_S01E01_F01_A.mp4 (additional connected takes B and C), import the MP4 into that scene and edit using Split / Sound / Pauses. The approved existing intro belongs after the comedic cold open, never at 00:00. The owner may add an episode number pop-in to each intro as intended.

## Staging / privacy / limitations
This branch is a private staging copy in an existing private GitHub repository, NOT yet the final dedicated OFF BRIEF repository and NOT a live GitHub Pages deployment. The unrelated default branch stays untouched. Move this standalone source tree to a dedicated off-brief-video-studio repository before configuring Pages.

Browser IndexedDB data belongs to its original domain and device. Copying code does NOT carry existing browser-local projects, MP4s, voices, Sound tracks, split points, or transitions from AppDeploy. Keep the original AppDeploy Studio accessible until these assets are intentionally imported and QA-verified on the new domain.

Do not publish unfinished episodes or assume a browser-exported video has been reviewed without a real end-to-end test.
