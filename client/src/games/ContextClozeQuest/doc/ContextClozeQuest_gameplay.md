# Context Cloze Quest: Gameplay and Scoring

> Last verified: 2026-07-21.

## Player objective

Restore the missing words in a story by dragging choices from the word bank into the correct blanks. Context before and after a blank should guide the choice.

## Menu options

### Language

- English
- Sanskrit

The choice controls both the story fields requested by the server and the font used for passage content.

### Word type

- Noun (`NOUN`)
- Verb (`VERB`)
- Adjective (`ADJ`)

Players may select multiple types, but the menu prevents deselecting the final remaining type.

### Difficulty

| Difficulty | Target blanks | Starting time |
| --- | ---: | ---: |
| Easy | 3 | 60 seconds |
| Medium | 6 | 90 seconds |
| Hard | 9 | 120 seconds |

The actual blank count can be smaller if the selected story does not have enough unique eligible words.

## Round flow

1. The player chooses settings and presses **Let's Play**.
2. The server generates a puzzle from the currently selected story.
3. The passage, blanks, and shuffled word bank appear and the timer starts.
4. The player drags words into blanks. Dropping a word outside a blank returns it to the bank. Dropping onto an occupied blank returns the previous word to the bank.
5. The player may use up to two hints.
6. **Submit Answer** first requires every blank to be filled.
7. A fully filled submission is scored and locked. **Reset Game** requests a newly randomized puzzle with the same menu choices; **Menu** returns to settings.

## Hints

Each hint targets the first blank that is both unsolved and not previously hinted. It reports the first character of that blank's answer through the scene character system.

- Maximum hints: 2 per round.
- Penalty: 25 points per consumed hint.
- A hint is not consumed if no useful target remains.

## Scoring

Definitions:

```text
answerScore = correct answers * 100
timeBonus = remaining seconds * 2, but only for a perfect answer
hintPenalty = hints used * 25
finalScore = max(0, answerScore + timeBonus - hintPenalty)
```

Examples:

| Result | Calculation | Final score |
| --- | --- | ---: |
| Easy, 3/3, 40 seconds left, no hints | `300 + 80` | 380 |
| Easy, 3/3, 40 seconds left, 1 hint | `300 + 80 - 25` | 355 |
| Medium, 5/6, 20 seconds left, no hints | `500 + 0` | 500 |

The displayed `Answer Score` is only the correct-answer portion. The feedback message shows the final score and applicable bonus/penalty.

`bestTime` sent to the server is elapsed time in milliseconds:

```text
(difficulty time limit - max(0, remaining time)) * 1000
```

## Completion and scene feedback

- Perfect submission emits `complete`.
- Incorrect completed submission emits `wrong`.
- Timer expiry emits `wrong` and displays a time-up message.
- A hint emits `hint` with the hint sentence.

## Score eligibility

A score is submitted only when all blanks are filled and `authUser.id` exists and `authUser.isGuest` is false. Both correct and incorrect completed submissions can be saved. Anonymous Firebase users are intentionally excluded even though they have an ID.

## Current edge cases

- Time expiry stops the timer but does not lock the board; submission remains possible with zero time bonus.
- The game can contain fewer blanks and choices than its difficulty label suggests.
- Answer matching is exact and case-sensitive on the client.
- The score is saved asynchronously; a save failure is logged to the browser console and does not change the displayed result.
- Resetting starts a fresh server-generated round; it does not restore the identical puzzle.

