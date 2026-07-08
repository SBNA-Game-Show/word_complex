import {
  getSelectedStoryId,
  setSelectedStoryId,
  clearSelectedStoryId,
} from "./activeStory";

// The gate in App.jsx shows the story picker whenever getSelectedStoryId() is
// falsy, and lets the player through to the launcher once it returns an id.
// These tests cover that decision source directly (no DOM / no Playwright).

beforeEach(() => {
  clearSelectedStoryId();
});

describe("activeStory store (story picker gate behavior)", () => {
  it("starts with no story chosen, so the gate shows the picker", () => {
    expect(getSelectedStoryId()).toBeNull();
  });

  it("remembers the chosen story, so the gate lets the player through", () => {
    setSelectedStoryId("story-A");
    expect(getSelectedStoryId()).toBe("story-A");
  });

  it("setSelectedStoryId returns the stored value", () => {
    expect(setSelectedStoryId("story-B")).toBe("story-B");
  });

  it("a later pick overwrites the previous one (Change story flow)", () => {
    setSelectedStoryId("story-A");
    setSelectedStoryId("story-B");
    expect(getSelectedStoryId()).toBe("story-B");
  });

  it("clearing resets to no-story, so logout re-gates the picker", () => {
    setSelectedStoryId("story-A");
    clearSelectedStoryId();
    expect(getSelectedStoryId()).toBeNull();
  });

  it("treats empty / null input as no selection", () => {
    setSelectedStoryId("");
    expect(getSelectedStoryId()).toBeNull();
    setSelectedStoryId(null);
    expect(getSelectedStoryId()).toBeNull();
  });
});
