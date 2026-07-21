/**
 * ADMIN PLAYWRIGHT TEST DATA:
 * AdminPage communicates with an external Python service and the Word Complex
 * Story Set API. These deterministic fixtures ensure Playwright never calls
 * either live service.
 */

export const MOCK_LEARN_STORIES = Object.freeze([
  {
    _id: "learn-story-1",
    storyTitle: "The Clever Crow",
  },
  {
    _id: "learn-story-2",
    storyTitle: "The Helpful Elephant",
  },
]);

export const MOCK_SANSKRIT_STORIES = Object.freeze([
  {
    _id: "sanskrit-story-1",
    english_title: "The Wise Deer",
    sanskrit_title: "बुद्धिमान् मृगः",
  },
  {
    _id: "sanskrit-story-2",
    english_title: "The Honest Farmer",
    sanskrit_title: "सत्यवादी कृषकः",
  },
]);

export const MOCK_TOKENIZED_STORIES = Object.freeze([
  {
    _id: "tokenized-story-1",
    storyTitle: "River Rescue",
    category: "Adventure",
    actors: ["Maya", "Kavi"],
    englishVersion: "Maya and Kavi worked together near the river.",
  },
  {
    _id: "tokenized-story-2",
    storyTitle: "The Moonlit Garden",
    category: "Nature",
    actors: ["Anaya"],
    englishVersion: "Anaya explored the garden beneath the moon.",
  },
  {
    _id: "tokenized-story-3",
    storyTitle: "The Honest Merchant",
    category: "Moral",
    actors: ["Ravi", "Merchant"],
    englishVersion: "Ravi returned what did not belong to him.",
  },
  {
    _id: "tokenized-story-4",
    storyTitle: "Mountain Friends",
    category: "Friendship",
    actors: ["Tara", "Dev"],
    englishVersion: "Tara and Dev helped each other climb safely.",
  },
  {
    _id: "tokenized-story-5",
    storyTitle: "The Fifth Story",
    category: "Wisdom",
    actors: ["Nila"],
    englishVersion: "Nila learned to listen before answering.",
  },
]);

export const MOCK_TOKENIZED_EDITOR_STORIES = Object.freeze([
  {
    _id: "editor-story-1",
    title: {
      englishversion: "River Rescue",
      sanskritversion: "नदीरक्षणम्",
    },
    category: "Adventure",
    actors: ["Maya", "Kavi"],
    englishVersion:
      "Maya and Kavi worked together to rescue a bird near the river.",
    storyMoral: "Teamwork helps solve difficult problems.",
    sanskritVersion: [
      "माया कविश्च नदीतीरे पक्षिणं रक्षितवन्तौ।",
      "सहकार्येण कठिनं कार्यं सिद्धम्।",
    ],
    transliteratedVersion: [
      "māyā kaviśca nadītīre pakṣiṇaṃ rakṣitavantau",
      "sahakāryeṇa kaṭhinaṃ kāryaṃ siddham",
    ],
    tokenized_english_version: [
      {
        text: "Maya",
        lemma: "Maya",
        pos: "NOUN",
        definition: "A character in the story.",
        synonyms: ["girl"],
        antonyms: [],
      },
      {
        text: "worked",
        lemma: "work",
        pos: "VERB",
        definition: "Performed an activity.",
        synonyms: ["laboured"],
        antonyms: ["rested"],
      },
    ],
    tokenized_sanskrit_version: [
      [
        {
          text: "माया",
          lemma: "माया",
          upos: "NOUN",
          xpos: "NNP",
          feats: "Case=Nom|Number=Sing",
          definition: "Maya",
        },
        {
          text: "रक्षितवती",
          lemma: "रक्ष्",
          upos: "VERB",
          xpos: "V",
          feats: "Tense=Past",
          definition: "protected",
        },
      ],
      [
        {
          text: "सहकार्यम्",
          lemma: "सहकार्य",
          upos: "NOUN",
          xpos: "NN",
          feats: "Case=Nom|Number=Sing",
          definition: "teamwork",
        },
      ],
    ],
    createdAt: "2026-07-10T14:00:00.000Z",
  },
  {
    _id: "editor-story-2",
    title: {
      englishVersion: "The Moonlit Garden",
      sanskritVersion: "चन्द्रप्रकाशितम् उद्यानम्",
    },
    category: "Nature",
    actors: ["Anaya"],
    englishVersion: "Anaya quietly explored the garden beneath the moon.",
    storyMoral: "Careful observation reveals hidden beauty.",
    sanskritVersion: ["अनया चन्द्रप्रकाशे उद्यानं दृष्टवती।"],
    transliteratedVersion: ["anayā candraprakāśe udyānaṃ dṛṣṭavatī"],
    tokenized_english_version: [
      {
        text: "garden",
        lemma: "garden",
        pos: "NOUN",
        definition: "A cultivated outdoor area.",
        synonyms: ["yard"],
        antonyms: [],
      },
    ],
    tokenized_sanskrit_version: [
      [
        {
          text: "उद्यानम्",
          lemma: "उद्यान",
          upos: "NOUN",
          xpos: "NN",
          feats: "Case=Acc|Number=Sing",
          definition: "garden",
        },
      ],
    ],
    createdAt: "2026-07-11T14:00:00.000Z",
  },
  {
    _id: "editor-story-3",
    title: {
      englishversion: "The Honest Merchant",
      sanskritversion: "सत्यवान् वणिक्",
    },
    category: "Moral",
    actors: ["Ravi", "Merchant"],
    englishVersion: "Ravi returned the merchant's missing bag.",
    storyMoral: "Honesty builds lasting trust.",
    sanskritVersion: ["रविः वणिजः नष्टं कोशं प्रत्यर्पितवान्।"],
    transliteratedVersion: ["raviḥ vaṇijaḥ naṣṭaṃ kośaṃ pratyarpitavān"],
    tokenized_english_version: [
      {
        text: "honest",
        lemma: "honest",
        pos: "ADJ",
        definition: "Truthful and sincere.",
        synonyms: ["truthful"],
        antonyms: ["dishonest"],
      },
    ],
    tokenized_sanskrit_version: [],
    createdAt: "2026-07-12T14:00:00.000Z",
  },
]);

export const MOCK_ADMIN_STORY_SETS = Object.freeze([
  {
    _id: "story-set-active",
    name: "Active E2E Set",
    storyIds: ["tokenized-story-1", "tokenized-story-2"],
    isActive: true,
  },
  {
    _id: "story-set-inactive",
    name: "Inactive E2E Set",
    storyIds: ["tokenized-story-3"],
    isActive: false,
  },
]);

async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * ADMIN API MOCKS:
 * Every endpoint used by AdminPage is intercepted here. Options allow tests to
 * exercise loading, success, empty, and failure paths independently.
 */
export async function mockAdminApis(page, options = {}) {
  const {
    learnStories = MOCK_LEARN_STORIES,
    learnStatus = 200,
    learnDelayMs = 0,

    sanskritStories = MOCK_SANSKRIT_STORIES,
    sanskritStatus = 200,
    sanskritDelayMs = 0,

    learnDownloadStatus = 200,
    learnDownloadMessage = "Learn story downloaded successfully.",

    sanskritDownloadStatus = 200,
    sanskritDownloadMessage = "Sanskrit story downloaded successfully.",

    learnMetadataStatus = 200,
    learnMetadataMessage = "LearnSanskrit metadata generated.",

    sanskritMetadataStatus = 200,
    sanskritMetadataMessage = "Samskrutam metadata generated.",

    uploadStatus = 200,
    uploadMessage = "E2E story uploaded successfully.",

    tokenizedStories = MOCK_TOKENIZED_STORIES,
    tokenizedStatus = 200,
    tokenizedDelayMs = 0,

    tokenizedEditorStories = MOCK_TOKENIZED_EDITOR_STORIES,
    tokenizedEditorStatus = 200,
    tokenizedEditorDelayMs = 0,
    tokenizedEditorPutStatus = 200,
    tokenizedEditorPutMessage = "Unable to update tokenized story.",

    storySets = MOCK_ADMIN_STORY_SETS,
    storySetsStatus = 200,
    storySetsDelayMs = 0,

    storySetCreateStatus = 201,
    storySetCreateMessage = "Story Set already exists.",
    storySetCreateDelayMs = 0,

    storySetActivateStatus = 200,
    storySetActivateMessage = "Failed to activate Story Set.",
    storySetActivateDelayMs = 0,

    storySetDeleteStatus = 200,
    storySetDeleteMessage = "Failed to delete Story Set.",
    storySetDeleteDelayMs = 0,
  } = options;

  const calls = {
    learnGetAll: 0,
    sanskritGetUnused: 0,
    learnDownload: 0,
    sanskritDownload: 0,
    learnMetadata: 0,
    sanskritMetadata: 0,
    upload: 0,
    storySetsGet: 0,

    lastLearnDownloadUrl: null,
    lastSanskritDownloadUrl: null,
    lastLearnMetadataBody: null,
    lastSanskritMetadataBody: null,
    lastUploadContentType: null,
    lastUploadBody: null,

    tokenizedGetAll: 0,
    tokenizedEditorGet: 0,
    tokenizedEditorPut: 0,
    lastTokenizedEditorPutId: null,
    lastTokenizedEditorPutBody: null,

    storySetsCreate: 0,
    storySetsActivate: 0,
    storySetsDelete: 0,

    lastStorySetCreateBody: null,
    lastStorySetActivateBody: null,
    lastStorySetDeleteId: null,
  };

  let createdStorySetNumber = 0;

  let currentStorySets = storySets.map((set) => ({
    ...set,
    storyIds: [...(set.storyIds ?? [])],
  }));

  let currentTokenizedEditorStories = tokenizedEditorStories.map((story) =>
    JSON.parse(JSON.stringify(story)),
  );

  await page.route("**/api/v1/python/getAll", async (route) => {
    calls.learnGetAll += 1;

    if (learnDelayMs > 0) {
      await delay(learnDelayMs);
    }

    await fulfillJson(
      route,
      learnStatus === 200
        ? {
            success: true,
            data: [
              {
                story_description: learnStories,
              },
            ],
          }
        : {
            success: false,
            message: "LearnSanskrit stories unavailable.",
          },
      learnStatus,
    );
  });

  await page.route("**/api/v1/python/getUnused", async (route) => {
    calls.sanskritGetUnused += 1;

    if (sanskritDelayMs > 0) {
      await delay(sanskritDelayMs);
    }

    await fulfillJson(
      route,
      sanskritStatus === 200
        ? {
            success: true,
            data: sanskritStories,
          }
        : {
            success: false,
            message: "Sanskrit stories unavailable.",
          },
      sanskritStatus,
    );
  });

  await page.route("**/api/v1/python/addNew?**", async (route) => {
    calls.learnDownload += 1;
    calls.lastLearnDownloadUrl = route.request().url();

    await fulfillJson(
      route,
      learnDownloadStatus === 200
        ? {
            success: true,
            data: {
              message: learnDownloadMessage,
            },
          }
        : {
            success: false,
            message: "Learn story download failed.",
          },
      learnDownloadStatus,
    );
  });

  await page.route("**/api/v1/python/addNewStory?**", async (route) => {
    calls.sanskritDownload += 1;
    calls.lastSanskritDownloadUrl = route.request().url();

    await fulfillJson(
      route,
      sanskritDownloadStatus === 200
        ? {
            success: true,
            data: {
              message: sanskritDownloadMessage,
            },
          }
        : {
            success: false,
            message: "Sanskrit story download failed.",
          },
      sanskritDownloadStatus,
    );
  });

  await page.route("**/api/v1/python/writeMeta", async (route) => {
    calls.learnMetadata += 1;

    try {
      calls.lastLearnMetadataBody = route.request().postDataJSON();
    } catch {
      calls.lastLearnMetadataBody = null;
    }

    await fulfillJson(
      route,
      learnMetadataStatus === 200
        ? {
            success: true,
            message: learnMetadataMessage,
          }
        : {
            success: false,
            message: "Learn metadata failed.",
          },
      learnMetadataStatus,
    );
  });

  await page.route("**/api/v1/python/writeMetaData", async (route) => {
    calls.sanskritMetadata += 1;

    try {
      calls.lastSanskritMetadataBody = route.request().postDataJSON();
    } catch {
      calls.lastSanskritMetadataBody = null;
    }

    await fulfillJson(
      route,
      sanskritMetadataStatus === 200
        ? {
            success: true,
            message: sanskritMetadataMessage,
          }
        : {
            success: false,
            message: "Sanskrit metadata failed.",
          },
      sanskritMetadataStatus,
    );
  });

  await page.route("**/api/v1/python/upload", async (route) => {
    calls.upload += 1;
    calls.lastUploadContentType =
      route.request().headers()["content-type"] ?? null;
    calls.lastUploadBody = route.request().postData() ?? "";

    await fulfillJson(
      route,
      uploadStatus === 200
        ? {
            success: true,
            result: {
              message: uploadMessage,
            },
          }
        : {
            success: false,
            message: "Upload failed.",
          },
      uploadStatus,
    );
  });

  await page.route("**/api/v1/python/getAllTokenized", async (route) => {
    calls.tokenizedGetAll += 1;

    if (tokenizedDelayMs > 0) {
      await delay(tokenizedDelayMs);
    }

    await fulfillJson(
      route,
      tokenizedStatus >= 200 && tokenizedStatus < 300
        ? {
            success: true,
            data: tokenizedStories,
          }
        : {
            success: false,
            message: "Failed to retrieve tokenized stories.",
          },
      tokenizedStatus,
    );
  });

  await page.route(
    /\/api\/v1\/stories\/tokenized(?:\/[^/?]+)?(?:\?.*)?$/,
    async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      const basePath = "/api/v1/stories/tokenized";
      const suffix = url.pathname.slice(basePath.length);

      if (method === "GET" && suffix === "") {
        calls.tokenizedEditorGet += 1;

        if (tokenizedEditorDelayMs > 0) {
          await delay(tokenizedEditorDelayMs);
        }

        await fulfillJson(
          route,
          tokenizedEditorStatus >= 200 && tokenizedEditorStatus < 300
            ? {
                success: true,
                data: currentTokenizedEditorStories,
              }
            : {
                success: false,
                message: "Tokenized editor stories unavailable.",
              },
          tokenizedEditorStatus,
        );

        return;
      }

      if (method === "PUT" && suffix.startsWith("/")) {
        calls.tokenizedEditorPut += 1;

        const storyId = decodeURIComponent(suffix.slice(1));
        calls.lastTokenizedEditorPutId = storyId;

        let body = null;
        try {
          body = request.postDataJSON();
        } catch {
          body = null;
        }

        calls.lastTokenizedEditorPutBody = body;

        if (tokenizedEditorPutStatus < 200 || tokenizedEditorPutStatus >= 300) {
          await fulfillJson(
            route,
            {
              success: false,
              message: tokenizedEditorPutMessage,
            },
            tokenizedEditorPutStatus,
          );

          return;
        }

        currentTokenizedEditorStories = currentTokenizedEditorStories.map(
          (story) =>
            story._id === storyId
              ? {
                  ...story,
                  ...body,
                }
              : story,
        );

        const updatedStory =
          currentTokenizedEditorStories.find(
            (story) => story._id === storyId,
          ) ?? null;

        await fulfillJson(
          route,
          {
            success: true,
            data: updatedStory,
          },
          tokenizedEditorPutStatus,
        );

        return;
      }

      await fulfillJson(
        route,
        {
          success: false,
          message: "Unhandled tokenized-editor test request.",
        },
        404,
      );
    },
  );

  await page.route(
    /\/api\/v1\/admin\/storySets(?:\/[^/?]+)?(?:\?.*)?$/,
    async (route) => {
      const request = route.request();
      const method = request.method();
      const url = new URL(request.url());

      const basePath = "/api/v1/admin/storySets";
      const suffix = url.pathname.slice(basePath.length);

      if (method === "GET" && suffix === "") {
        calls.storySetsGet += 1;

        if (storySetsDelayMs > 0) {
          await delay(storySetsDelayMs);
        }

        await fulfillJson(
          route,
          storySetsStatus >= 200 && storySetsStatus < 300
            ? {
                success: true,
                data: currentStorySets,
              }
            : {
                success: false,
                message: "Failed to load Story Sets",
              },
          storySetsStatus,
        );

        return;
      }

      if (method === "POST" && suffix === "") {
        calls.storySetsCreate += 1;

        let body = null;
        try {
          body = request.postDataJSON();
        } catch {
          body = null;
        }

        calls.lastStorySetCreateBody = body;

        if (storySetCreateDelayMs > 0) {
          await delay(storySetCreateDelayMs);
        }

        if (storySetCreateStatus < 200 || storySetCreateStatus >= 300) {
          await fulfillJson(
            route,
            {
              success: false,
              message: storySetCreateMessage,
            },
            storySetCreateStatus,
          );

          return;
        }

        createdStorySetNumber += 1;

        const createdSet = {
          _id: `story-set-created-${createdStorySetNumber}`,
          name: body?.name ?? "",
          storyIds: [...(body?.storyIds ?? [])],
          isActive: false,
        };

        currentStorySets = [createdSet, ...currentStorySets];

        await fulfillJson(
          route,
          {
            success: true,
            data: createdSet,
          },
          storySetCreateStatus,
        );

        return;
      }

      if (method === "PUT" && suffix === "/active") {
        calls.storySetsActivate += 1;

        let body = null;
        try {
          body = request.postDataJSON();
        } catch {
          body = null;
        }

        calls.lastStorySetActivateBody = body;

        if (storySetActivateDelayMs > 0) {
          await delay(storySetActivateDelayMs);
        }

        if (storySetActivateStatus < 200 || storySetActivateStatus >= 300) {
          await fulfillJson(
            route,
            {
              success: false,
              message: storySetActivateMessage,
            },
            storySetActivateStatus,
          );

          return;
        }

        currentStorySets = currentStorySets.map((set) => ({
          ...set,
          isActive: set._id === body?.setId,
        }));

        const activeSet =
          currentStorySets.find((set) => set._id === body?.setId) ?? null;

        await fulfillJson(
          route,
          {
            success: true,
            data: activeSet,
          },
          storySetActivateStatus,
        );

        return;
      }

      if (method === "DELETE" && suffix.startsWith("/")) {
        const setId = decodeURIComponent(suffix.slice(1));

        calls.storySetsDelete += 1;
        calls.lastStorySetDeleteId = setId;

        if (storySetDeleteDelayMs > 0) {
          await delay(storySetDeleteDelayMs);
        }

        if (storySetDeleteStatus < 200 || storySetDeleteStatus >= 300) {
          await fulfillJson(
            route,
            {
              success: false,
              message: storySetDeleteMessage,
            },
            storySetDeleteStatus,
          );

          return;
        }

        currentStorySets = currentStorySets.filter((set) => set._id !== setId);

        await fulfillJson(
          route,
          {
            success: true,
            data: null,
          },
          storySetDeleteStatus,
        );

        return;
      }

      await fulfillJson(
        route,
        {
          success: false,
          message: "Unhandled Story Set test request.",
        },
        404,
      );
    },
  );

  return calls;
}
