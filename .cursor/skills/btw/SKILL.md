---
name: btw
description: >-
  Handles “by the way” (/btw) side messages during an in-flight coding task:
  short, context-only answers without derailing the main work, mirroring Claude
  Code’s /btw side questions. Use when the user prefixes with /btw or BTW, says
  “by the way” mid-task, or drops a small fact or question without asking to
  cancel or replace the current task.
disable-model-invocation: false
---

# BTW — side questions without derailing the main task

This skill mirrors **Claude Code’s `/btw`** (side questions, v2.1.72+): quick, low-noise input **while something else is already in progress**, without treating the new message as a full redirect.

Reference: [Claude Code — Side questions with /btw](https://code.claude.com/docs/en/interactive-mode#side-questions-with-/btw)

## Invoking in Cursor

Cursor does not implement a separate sidebar agent for `/btw`; this file defines **how the agent should behave** when you send the same *kind* of message.

- **Explicit:** attach or mention the **btw** skill, or start the line with **`/btw`** / **`BTW:`** (plain text is enough—the agent follows this skill when it is in context).
- **To reduce noise in other chats:** add `disable-model-invocation: true` under the YAML frontmatter so the skill only loads when you attach it; leave it unset (default) for easier discovery from the description.

## When this applies

Treat the user’s message as **BTW-style** when they:

- Start with **`/btw`**, **`BTW:`**, **`btw`**, or **“by the way”** (or clearly signal an aside: “small correction”, “one more thing”, “forgot to mention”).
- Add a **single fact, constraint, or question** without asking to stop, undo, or replace the ongoing work.

If they explicitly **change direction** (“actually do X instead”, “stop”, “forget that”) — that is **not** BTW; follow the new instruction normally.

## What to do (agent behavior)

1. **Do not interrupt the main thread**  
   Keep the current task, plan, and in-progress work **active**. Do not reset todos or abandon the line of work unless the user clearly cancels it.

2. **Answer the BTW briefly**  
   Prefer a **short** acknowledgment + direct answer. No long preambles, no new large plans, no “here’s a full redesign” unless they asked for that in the BTW.

3. **Context-only, like Claude’s /btw**  
   Prefer information **already in the conversation or already visible in open files/context**.  
   - **Avoid new tool calls** for the BTW answer when reasonable (no file reads, searches, or shell “just to answer the aside”).  
   - If the answer **requires** new evidence, say in one or two sentences that you need a normal follow-up turn or permission to run tools—then **return to the main task** without waiting for a full detour.

4. **Ephemeral spirit**  
   Do not merge the BTW into a huge new spec. Treat it as a **small overlay**: integrate only what’s needed (e.g. one filename, one constraint) into the **existing** plan and continue.

5. **Single turn for the aside**  
   Answer the BTW once; do not open a long back-and-forth on the side topic unless the user continues that thread explicitly.

6. **Then continue the main work**  
   After the BTW block, **resume** the prior task (next tool call, next file, next step) unless the BTW forces a tiny adjustment—apply that adjustment and proceed.

## Contrast (quick)

| BTW (`/btw` style) | Normal new instruction |
| --- | --- |
| Small add-on or question mid-flight | Replaces or reprioritizes work |
| Minimal tools; mostly prior context | Tools and exploration as needed |
| Short answer; then continue | Full response to the new ask |

**vs subagent:** BTW = *full session context, minimal/no extra gathering*. Subagent (or a new task) = *go fetch / explore with tools in separate context*. If the user needs deep investigation, suggest they ask in a **dedicated** message or thread after the current chunk finishes.

## Example (tone + structure)

User (while you are mid-refactor): `btw the env var is FOO_BAR not FOO`

Response pattern:

- One line: acknowledge + correction (“Using **FOO_BAR** for env.”).
- Immediately continue the refactor step you were on; apply the correction wherever relevant.

Do **not** stop the refactor to write a long essay about environment variables unless they asked.
