# Choose your model.

On NaN, switching models means changing one word. They are all called the same way, through the same endpoint and with the same request format: the only thing that changes is the value of the `model` field.

```json
{
  "model": "deepseek-v4-flash",
  "messages": [{ "role": "user", "content": "Hello" }]
}
```

That value is the **model id**, and it has to be spelled exactly. One dot too many or one hyphen too few and the API answers `404` with `model_not_found`. This page is the good list.

## Start here

If you do not know which one to pick, look for what you want to do in the first column.

| I want to                                   | Ask for                             | Why                                                                                                                                                   |
| ------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat or reason about something, plainly     | `deepseek-v4-flash`                 | It is the best general-purpose model on the cluster, and it reads images                                                                              |
| Drive a coding agent through long sessions  | `glm5.3`                            | It is built for that. One of the larger models: it uses credits faster                                                                                |
| The same, spending fewer credits            | `glm5.3-flash`                      | Same 1M context, at a fraction of the credits per token                                                                                               |
| Get an answer fast                          | `qwen3.8-flash`                     | Less depth, much less waiting                                                                                                                         |
| Hand the model an audio file directly       | `mimo-v2.6-flash`                   | It hears audio natively                                                                                                                               |
| Describe or analyze an image                | `deepseek-v4-flash`                 | Most chat models take images (not `glm5.3` or `deepseek-v4-pro`); this is the best. No chat model takes video: extract frames and send them as images |
| Try things without spending credits         | `gemma4`                            | It does not draw credits                                                                                                                              |
| Build a search engine or a RAG              | `qwen3-embedding` and then `rerank` | First you retrieve by similarity, then you reorder by relevance                                                                                       |
| Turn text into audio                        | `kokoro`                            | 67 voices, two of them Spanish                                                                                                                        |
| Transcribe audio                            | `whisper`                           | More than 99 languages, with automatic detection                                                                                                      |
| Generate or edit an image                   | `flux-2-klein`                      | Text to image and image to image                                                                                                                      |
| Generate an image with clean text rendering | `qwen-image-2.1`                    | Text to image                                                                                                                                         |

Weighing models by cost? The [community model guide](/model-guide) compares the credit rates of the chat models, task by task, with a simulator for your own token mix.

## Every model

| id                  | What for                                                          | Context | Accepts              | Billing                          |
| ------------------- | ----------------------------------------------------------------- | ------- | -------------------- | -------------------------------- |
| `deepseek-v4-flash` | General chat and reasoning                                        | 1M      | text · image         | credits                          |
| `glm5.3`            | Coding agents and long tasks                                      | 1M      | text                 | credits · larger model           |
| `glm5.3-flash`      | Coding agents, fewer credits                                      | 1M      | text · image         | credits                          |
| `qwen3.8-flash`     | Fast answers                                                      | 1M      | text · image         | credits                          |
| `mimo-v2.6-flash`   | The newest MiMo, omnimodal                                        | 1M      | text · image · audio | credits                          |
| `kimi-k3.1-pro`     | Frontier reasoning for agents and coding                          | 1M      | text · image         | credits · larger model           |
| `qwen3.8-max`       | The largest Qwen 3.8, hard reasoning                              | 1M      | text · image         | credits · larger model           |
| `deepseek-v4-pro`   | Large reasoning and coding model                                  | 1M      | text                 | credits · larger model           |
| `hy4`               | Agents and long documents, the lowest-priced of the larger models | 1M      | text · image         | credits · larger model           |
| `gemma4`            | Short tasks and testing                                           | 262K    | text · image         | no counter                       |
| `qwen3.6`           | Previous generation                                               | 262K    | text · image         | no counter                       |
| `qwen3-embedding`   | 4096-dimension vectors                                            | -       | text                 | no counter                       |
| `rerank`            | Reorder by relevance                                              | -       | text                 | no counter                       |
| `kokoro`            | Text to speech                                                    | -       | text                 | no counter                       |
| `whisper`           | Speech to text                                                    | -       | audio                | no counter                       |
| `flux-2-klein`      | Generate and edit images                                          | -       | text · image         | 100 requests/month               |
| `qwen-image-2.1`    | Generate images (text→image)                                      | -       | text                 | 100 requests/month (shared pool) |

The full spec sheets, with parameters, licenses and reasoning modes, are in [Models](/docs/models).

> **One pool of credits for every model**
> Inference and Premium include credits every billing period: 7,000 on Inference, 20,000 on Premium. Every model marked **credits** draws from that same pool, by its price per token (input, cached input and output), so there is no separate allowance per model. The ones marked **larger model** (`glm5.3`, `kimi-k3.1-pro`, `qwen3.8-max`, `deepseek-v4-pro`, `hy4`) are called the same way and use credits faster. The price of each model per 1M tokens is on its card at [cloud.nan.builders/tokens](https://cloud.nan.builders/tokens).
>
> When the pool is spent, requests draw from your [credit packs](https://cloud.nan.builders/dashboard?buy=credits). Without credits left, the answer is a **`402`** `insufficient_balance`, which a credit pack or your next billing period fixes and retrying does not. The Community plan and accounts without a membership include no credits: they can buy credit packs and use these models with them.

## How to read the ids

- **The id is not the commercial name.** The model its makers call "GLM 5.3 Flash" is `glm5.3-flash` here, lowercase, no spaces, and with the version dot.
- **`-flash` means fast**, not small or worse: these are variants optimized for latency.
- **The version dot counts.** `qwen3.6` and `qwen3.8-flash` are different models, and `mimo-v2.6-flash` carries its dot where it carries it.
- **Ids do not change meaning.** When we serve a new variant of a model we keep its id if the API is the same. `deepseek-v4-flash`, for instance, started reading images without changing its name.
- **Old ids are not switched off overnight.** `qwen3.6` still answers so that configurations already naming it do not break, but it is not what you want if you are starting today.

## What the billing column means

The billing column says how each model is paid for:

- **`credits`** draws from your plan's credits, then from your credit packs. The pool goes back to full when your billing period starts in Stripe, which is almost never the 1st. A cheaper model per token simply makes the same credits last longer.
- **`credits · larger model`** works the same way, but the model costs more per token, so the same work uses credits faster. `glm5.3` also has a token cap for each rolling 4-hour window, which is the one an intensive agent session hits first.
- **`no counter`** means the model does not draw credits, not that it is infinite: the requests-per-minute limits apply to all of them just the same.
- **`requests/month`** is the image budget: its own counter, which goes back to zero with the calendar month and does not touch your credits.

Credit packs come in 1,000, 5,000 and 25,000 credits, or any amount from 5€ to 1,000€; Inference and Premium members pay 5% less, and you can turn on automatic recharge. Without credits the API answers `402`, and the `glm5.3` window answers `429`: retrying right away does not fix either. The current limit figures are at the end of [Models](/docs/models).

## The list your key can use

This page is written by hand and the cluster moves. The definitive answer, filtered by what your key can actually call, comes from the API itself:

```bash
curl https://api.nan.builders/v1/models \
  -H "Authorization: Bearer $NAN_API_KEY"
```

If an id shows up there, it works. If it does not, you do not have it available, whatever you read somewhere else.

## Next steps

- [Set up your agent](/docs/agent-setup): where to put the id in Cursor, Claude Code, Codex, Cline, OpenCode or Zed.
- [Examples](/docs/examples): one complete call for each kind of model.
- [Models](/docs/models): the spec sheets, model by model.