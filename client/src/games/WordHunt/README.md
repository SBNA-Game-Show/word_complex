# Word Hunt

The source code for the **Word Hunt** game resides in this directory.

The playable game component should be implemented as `index.jsx`. After adding the component, follow the instructions in [`../README.md`](../README.md) to register the game and integrate it with the backend.

## Overview

**Word Hunt** is an interactive educational game that challenges players to read and analyze a passage while identifying words that belong to a specified part of speech, such as **nouns**, **verbs**, or **adjectives**. By combining reading comprehension with grammar practice, the game encourages players to examine the text carefully and make accurate selections.

Beyond grammar practice, Word Hunt is designed to strengthen cognitive skills by improving concentration, attention to detail, pattern recognition, and memory retention. As players progress through increasingly challenging passages, they reinforce their understanding of sentence structure, expand their vocabulary, and develop stronger language and reading comprehension skills.

To create an engaging learning experience, the game incorporates gamification features such as timed challenges, scoring, hints, progress tracking, and rewards. These mechanics encourage players to improve both their speed and accuracy while building confidence in their language abilities.

---

## Game Rules

* Each target word is allocated **5 seconds** of gameplay time.

* The total time available for a game is calculated as:

  ```text
  Total Time = Number of Target Words × 5 seconds
  ```

* Players must identify all target words before the timer expires.

* Players may **skip** a game at any time. A skipped game is marked as incomplete and no score is awarded.

* If a player completes the game before the allotted time expires, the **actual completion time** is recorded and can be used as the benchmark for future attempts on the same passage.

* If a passage does not contain any words matching the target part of speech, the game is skipped automatically and the player proceeds to the next activity.

* Each correctly identified word awards **10 base points**.

* There is **no penalty** for incorrect word selections.

* Hints are limited and are allocated based on the number of target words. **One hint is provided for every 10 target words** (rounded down).

* A game is considered complete only after all required target words have been successfully identified.

---

## Gameplay Flow

1. Load the passage and determine the target part of speech.
2. Identify all target words within the passage.
3. Calculate the total game time based on the number of target words.
4. Present the passage and start the countdown timer.
5. Allow the player to select words from the passage.
6. Validate each selection and update:

   * Score
   * Progress
   * Remaining time
   * Hint availability
7. End the game when:

   * All target words have been found,
   * The timer expires, or
   * The player chooses to skip the game.
8. Record the player's completion time, score, and earned coins before continuing to the next game.

---

## Scoring Logic

### Base Score

* Every correctly identified word awards **10 points**.
* Incorrect selections **do not** reduce the player's score.

### Hint Penalty

Using hints reduces the base score before any time-based multiplier is applied.

* Each hint deducts **25% of the current base score**.
* The base score cannot be reduced below **25% of its original value**.

### Time Bonus Multipliers

Players are rewarded for completing the game quickly.

| Completion Time                        | No Hints Used | Hints Used |
| -------------------------------------- | ------------: | ---------: |
| Within **25%** of the allotted time    |           ×10 |         ×8 |
| Within **50%** of the allotted time    |            ×5 |         ×4 |
| Within **75%** of the allotted time    |            ×3 |         ×2 |
| More than **75%** of the allotted time |            ×1 |         ×1 |

The final score is calculated by applying the appropriate multiplier to the adjusted base score.

### Coin Rewards

Coins are awarded based on the **final score**.

* Players earn **2 coins for every 20 points** in their final score.

For example:

| Final Score | Coins Awarded |
| ----------: | ------------: |
|          20 |             2 |
|          40 |             4 |
|          60 |             6 |
|         100 |            10 |

---

## Learning Objectives

Word Hunt is designed to help learners:

* Improve reading comprehension.
* Identify and classify parts of speech accurately.
* Develop grammatical awareness.
* Strengthen vocabulary through contextual learning.
* Improve concentration and attention to detail.
* Enhance memory retention and pattern recognition.
* Develop faster decision-making and reaction time in a timed environment.
* Build confidence in applying grammar concepts through interactive gameplay.
