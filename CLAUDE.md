# CLAUDE.md: agent-sa

A Claude Code plugin. The deliverables are the skills in `skills/`, the engine in `scripts/` and the format in `scripts/lib/model.mjs`.

## Principles

- **One source of truth.** A fact lives in the engagement file. Skills never tell an agent to hand-write a deck, diagram or estimate; those come from `render`. If a skill needs something the engine lacks, change the engine.
- **The validator is the format.** `sa.mjs schema` prints from `model.mjs`, so documentation cannot drift. Do not restate the format in a skill.
- **Self-contained.** Nothing at run time depends on anything outside this repo. Sources are public URLs. `tests/plugin.test.mjs` enforces this and the public-language rules.
- **References hold only what an expert would not already know.** Measured evidence with denominators, traps, limits, conflicts between sources, and stated nulls. If agents already do it unprompted, do not write it down.

## Changing a skill

Run the task without the skill first and record what actually goes wrong, then write the minimum that fixes it. Re-run with the skill to confirm. Reading a skill cannot show whether it helps.

- Directory name, frontmatter `name` and the command stay equal.
- `description` states the capability; `when_to_use` holds the triggers. Neither reads as a procedure.
- Keep the body short and put the load-bearing instruction first. References sit one level deep and are linked from the body.
- Never write a dollar sign followed by a digit in a `SKILL.md`: argument substitution rewrites it, even inside code blocks.

## Changing the engine

Rule codes are stable because skills name them. Add a rule with a test that shows it firing, and keep it silent until the stage where its section is expected. Output is deterministic: no timestamps, no randomness.

```bash
npm test
```

## Releasing

The version lives in `.claude-plugin/plugin.json` and `package.json`. Bump both, then tag `vX.Y.Z`. The marketplace entry is pinned separately by tag and commit.

## Git

Never commit directly to `main`. Work on a feature branch or worktree, rebase onto latest and squash-merge.
