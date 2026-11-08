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

## OFF BRIEF YouTube Channel

- Channel handle registered for the series: **@Offbriefchannel**
- Channel link: https://www.youtube.com/@Offbriefchannel
- Status: handle-derived URL saved as project reference; not independently verified against a live YouTube channel page.
- Video Studio: the channel link is available in the Final Cut header.
- OFF BRIEF identity: THE CREATIVE HOUSE — "Great ideas. Terrible timing."

## GitHub-hosting status — verified 2026-11-08

- The complete Vite site (including the original 5-second intro) builds successfully in GitHub Actions.
- [Most recent build / downloadable complete-site ZIP](https://github.com/thelaunchera/the-launch-era-crm/actions/runs/42473028818), artifact `off-brief-video-studio-complete-site`.
- GitHub Pages publishing is **not active yet**. The GitHub Actions job failed at `actions/configure-pages@v5`: "Get Pages site failed … Not Found". This is a repository-level Pages setting, not a Vite build error.
- The repository owner needs to open [Settings → Pages](https://github.com/thelaunchera/the-launch-era-crm/settings/pages), select **GitHub Actions** as the publishing source if the account plan permits Pages on private repositories, and rerun the existing workflow. Private source does not mean a public Pages site will be private.
- The complete in-app **Media Library** links to the nine Drive previews, both season folders, cast, show assets and YouTube channel without duplicating or publicly uploading originals.
- The new in-app **Backup & Move** tool saves browser-local storyboards, Final Cut clips, voices, split timings, transitions and generated video as a user-owned TAR download. The source AppDeploy domain must also have this same tool available before the user can export its existing saved data.
- The existing AppDeploy app is **not deleted**. Its upgrade to enable Backup & Move is temporarily blocked by the AppDeploy daily free-tier deployment limit until 2026-11-09T00:00Z. No local browser projects have been copied between domains yet.

## GitHub location / privacy / deployment
OFF BRIEF Video Studio is now stored in **the private The Launch Era repository**, in the `off-brief-video-studio/` folder on `main`. The existing CRM files were preserved. The public The Launch Era website repository only contains a project/channel reference under `docs/`; private scripts and original media were not published there. This is **not yet a GitHub Pages deployment**. The current production website remains the previously published Video Studio.

Browser IndexedDB data belongs to its original domain and device. Copying code does NOT carry existing browser-local projects, MP4s, voices, Sound tracks, split points, or transitions from AppDeploy. Keep the original AppDeploy Studio accessible until these assets are intentionally imported and QA-verified on the new domain.

Do not publish unfinished episodes or assume a browser-exported video has been reviewed without a real end-to-end test.

## Official soundtrack (user supplied 2026-11-08)

- `OFFBRIEF_Series_Background.mp3` — original 2:33 composition, loaded as an optional gentle looping episode bed (13% default volume). It is automatically silent during the official intro and comedy pause beats.
- `OFFBRIEF_Presentation_Sound.wav` — original 7.51-second cue, used as an optional five-second intro sound, starting **after F01–F02**. When enabled, it replaces the original intro video audio; original MP4 remains unmodified.
- Original audio files are also stored in OFF BRIEF Drive. The `.b64` files preserve the complete MP3 bytes and `scripts/restore-audio.mjs` verifies SHA-256 integrity before building.
- Open **Audio** in the editor, listen to each original, and tap **Add**. Each episode keeps separate audio settings. Other user-imported tracks and previously saved edits are preserved. No extra credits required.
- Rights: confirm the appropriate commercial-use license before publishing the audio as part of a public YouTube video; uploading a track does not by itself establish music rights.


## CHAPTER lettering — personalizable intro (2026-11-08)

The editor has a **Text** tool (mobile) and a **CHAPTER + number** control (desktop). The operator can type the word `CHAPTER` and an independent episode number, choose an effect for each line, change color/size/start delay, and position each line on the video by dragging with a finger. Available entrance animations: Pop up, Spin, Bounce, Zoom, Slide up, Slide from side, Flip, Typewriter, Fade, Shake, and None.

- On iPhone, tap **Text**, edit the two fields, tap **Preview animated intro**, then drag CHAPTER or the number directly over the video. Tap the text layers' selector if the intended one is hard to grab.
- The text is saved per episode in the existing local Final Cut IndexedDB record (`chapterTitles`); it is not applied to every chapter until selected.
- During final export, the same text-animation renderer is drawn into the video stream during the unchanged official five-second intro, after F01–F02, never during the cold open.
- No existing MP4, voice, transition, or audio file is modified. This is a non-destructive overlay.
- Source validation checked module JavaScript syntax and exercised drawing/clamping for 11 effects; a full browser export and the live Pages release are **not independently verified**.
