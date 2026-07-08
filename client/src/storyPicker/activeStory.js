/**
 * activeStory.js
 * --------------
 * In-memory source of truth for the story the player picked for THIS session.
 *
 * Deliberately NOT persisted: the picker gates every session (see App.jsx), so a
 * fresh app load starts with no story and the player picks again. Keeping the
 * value here — rather than only in React state — lets non-React modules (the
 * per-game fetch services) read the chosen story at request time. Each browser
 * has its own copy, so two players on two stories never collide.
 */

let selectedStoryId = null;

export function getSelectedStoryId() {
  return selectedStoryId;
}

export function setSelectedStoryId(storyId) {
  selectedStoryId = storyId || null;
  return selectedStoryId;
}

export function clearSelectedStoryId() {
  selectedStoryId = null;
}
