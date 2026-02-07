# Phase 8 — Hand Tracking & Audio

Status: in progress

## Goals
- Quest hand tracking interaction
- Spatial audio polish
- Isolated edits only

## Changes Applied
- `vr/index.html`: hub spatial audio + hand ray cursors, A-Frame 1.6.0
- `vr/weather-zone.html`: spatial audio + hand ray cursors, A-Frame 1.6.0
- `vr/wellness/index.html`: hand rays + audio tuning, billboard component, audio placeholders

## QA (Quest 3)
1. `/vr/` hub: hand rays select portals
2. Hub audio positional near emitters
3. `/vr/weather-zone.html`: hand rays click buttons
4. Weather audio positional
5. `/vr/wellness/`: hand rays click sphere/leaves
6. If custom audio is hosted, water/birds directional; chime on click

## Notes
- Audio needs user gesture (wellness start button)
- Wellness zone uses audio placeholders; replace with hosted audio files to enable sound.
