# Solution to Wordle

**Stop reading this if you don't want any spoilers to the game Wordle**

I made this for own research only. The result shows that it is possible to guess any of the answers in 6 guesses -- if you know the list of possible answers.

The (estimated) best first guess is **RAISE** if you only guess word that could be an answer. Otherwise, **SOARE** gives slightly better average. Go for **LEARN** if you are in hard-mode.

- Data coming from: https://www.reddit.com/r/wordle/comments/s4tcw8/a_note_on_wordles_word_list .
- Entropy is used to pick the guess that gives most evenly distributed result.
- No, I'm not adding any tools to help scrolling through the list.
