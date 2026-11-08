# Steel City verified graphics route

Canonical playable source: `jussray/steel-city`, commit `58d6314e1389a626c34d4c09c33574cd338c94e6`.

`pittsburgh-night-skyline.jpg` is the extracted original clean Pittsburgh skyline artwork already embedded in the Steel City opening screen. The image is served as a real static asset in `site/games/steel-city/assets/` and used as the gameplay backdrop in WebGL and 2D fallback. This 2D key art is **not** equivalent to textured, animated or rigged 3D gameplay.

Run `node scripts/verify-steel-city-preview.mjs` in the `jussray/jussray` project with Playwright installed. This test checks the existing Games Hub, new joystick movement and camera-follow behavior in mobile viewport, and exact binary match between exported art and the embedded source.

Production Workers remain a separate release gate. Do not advertise or deploy without signed-in preview Playwright, exact-current-base CI, independent review and real hardware visual proof.
