# Getting started.

The NaN API is OpenAI-compatible. You only need two things, a **base URL** and an **API key**, and any tool or SDK that accepts those two fields works with NaN without touching anything else.

| Field               | Value                         |
| ------------------- | ----------------------------- |
| Base URL            | `https://api.nan.builders/v1` |
| API key             | yours, it starts with `sk-`   |
| Model to start with | `deepseek-v4-flash`           |

### Get your API key

You need a plan with credits: **nan\_member** (70€/mo, 7,000 credits per billing period) or Premium (200€/mo, 20,000). The 14,99€ NaN Community plan includes no credits: to call the models from it, or without a membership, buy a [credit pack](https://cloud.nan.builders/dashboard?buy=credits) first, and you can create a key once you have credits. Go to [cloud.nan.builders](https://cloud.nan.builders/), open your user settings and go to the **API Keys** section to generate yours.

The key is personal, non-transferable, and shown only once: copy it as soon as you generate it. If you lose it, nothing breaks, generate another one and delete the old one from the same panel.

> \[!WARNING] Do not paste it into your code
>
> A key pushed to a repository is found by a bot within minutes. Keep it in an environment variable and read it from there, like the examples on this page do.

### Keep it in an environment variable

```bash
# macOS and Linux
export NAN_API_KEY="sk-your-key"
```

```powershell
# Windows, PowerShell
$env:NAN_API_KEY = "sk-your-key"
```

That only lasts as long as the terminal does. To make it survive closing it, add the line to your `~/.zshrc`, your `~/.bashrc` or your PowerShell profile.

### Make your first call

```bash
curl https://api.nan.builders/v1/chat/completions \
  -H "Authorization: Bearer $NAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [{ "role": "user", "content": "Introduce yourself in one line." }]
  }'
```

If all goes well you get back a JSON and the model's text is in `choices[0].message.content`:

```json
{
  "id": "chatcmpl-...",
  "model": "deepseek-v4-flash",
  "choices": [
    { "index": 0, "message": { "role": "assistant", "content": "I am an open model..." } }
  ],
  "usage": { "prompt_tokens": 14, "completion_tokens": 23, "total_tokens": 37 }
}
```

You now have access to the cluster. Everything else is a variation on that same call.

### The same thing from your code

Use the official OpenAI SDK and change its `base_url`. There is no NaN library to install.

```python
# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["NAN_API_KEY"],
    base_url="https://api.nan.builders/v1",
)

resp = client.chat.completions.create(
    model="deepseek-v4-flash",
    messages=[{"role": "user", "content": "Introduce yourself in one line."}],
)
print(resp.choices[0].message.content)
```

```javascript
// npm install openai
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NAN_API_KEY,
  baseURL: 'https://api.nan.builders/v1',
});

const resp = await client.chat.completions.create({
  model: 'deepseek-v4-flash',
  messages: [{ role: 'user', content: 'Introduce yourself in one line.' }],
});
console.log(resp.choices[0].message.content);
```

There are more examples, including embeddings, speech and images, in [Examples](/docs/examples).

### Choose your model

`deepseek-v4-flash` is a good starting point, but it is neither the only one nor the best at everything. The full list, with what each one is good for, is in [Choose your model](/docs/choose-a-model).

And the list **your** key can actually use is always the one the API gives you:

```bash
curl https://api.nan.builders/v1/models \
  -H "Authorization: Bearer $NAN_API_KEY"
```

### Connect your editor or your agent

Cursor, Codex, VS Code, Cline, OpenCode, Zed and company are configured with those same two values. Each one asks for them somewhere different, and that is what [Set up your agent](/docs/agent-setup) collects, with one page per tool.

[Claude Code](/docs/claude-code) is the one exception, and it is not a matter of where the fields go: it speaks Anthropic's protocol, so it does not point at NaN directly. Its page has the two ways around that.

If you use OpenCode, Codex, Pi or droid, the [NaN CLI](/docs/nan-cli) configures them for you without editing anything.

## If something fails

Every error arrives in the same shape as OpenAI's: a JSON with `error.message`, `error.type` and a short `error.code` you can branch on in your code.

| Code  | What happened                                                                                                                | What to do                                                                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401` | The key is missing, misspelled or gone, **or it does not reach that model**                                                  | Check the `Authorization: Bearer ...` header. If the key works on other models, that model is not in your plan                                                   |
| `402` | You are out of credits: your plan's credits for this billing period and your credit packs are spent (`insufficient_balance`) | Buy a [credit pack](https://cloud.nan.builders/dashboard?buy=credits), or wait for your next billing period                                                      |
| `403` | Your plan does not reach that endpoint                                                                                       | Image generation needs inference membership                                                                                                                      |
| `404` | That model id does not exist                                                                                                 | Check the spelling in [Choose your model](/docs/choose-a-model) or with `GET /v1/models`                                                                         |
| `429` | Too many requests at once, or the `glm5.3` rolling window is full                                                            | Retry, waiting a little longer each time. If it is the `glm5.3` window, waiting seconds does not help: wait for the window to slide, or switch to `glm5.3-flash` |
| `5xx` | The failure is ours                                                                                                          | Retry; if it persists, say so in `#support`                                                                                                                      |

Retrying only makes sense for `429` and for `5xx`. A `401`, a `403` or a `404` will fail in exactly the same way until you change the request, and a `402` is not fixed by insisting: your plan's credits come back in full when your Stripe billing period starts, which is almost never the 1st, and a credit pack works right away. On the Gentle plan, which keeps a quota per model, the `402` is `monthly_cap_reached` and that model's counter also resets when your billing period starts.

The full detail, endpoint by endpoint, is in the [API reference](/docs/api).

**The limits, in short**

Two limits are per API key and apply to everything you call: requests per minute, and requests at once.

On top of those, some models carry one of their own: a tokens-per-minute ceiling on the big chat models, and a requests-per-minute one on `rerank`. `glm5.3` is not gated per minute at all, but by a rolling token window. Credits are not a limit of this kind: they are what the tokens are paid with. Image endpoints run on a budget separate from the models', and do not draw credits.

The current figures are at the end of [Models](/docs/models), which is where they are published so that no two versions of the same number go around.

## Usage metrics

The API can also tell you how much you have used: `GET /v1/usage` returns your own token usage (including cached input tokens) and billed credits per day and per model, with totals over the window you ask for. That window spans at most 90 days, and long ranges come back paginated: pass the `next_cursor` from one response back as `cursor` to get the next page. The response echoes the effective `start_date` and `end_date` it actually served, so you always know which window your totals cover. It also reports your current billing period, whatever window you ask for: your allowance, the credits used and remaining, and your pack credits. Every parameter is documented in the [API reference](/docs/api).

```bash
curl "https://api.nan.builders/v1/usage?start_date=2026-11-10&end_date=2026-11-30" \
  -H "Authorization: Bearer $NAN_API_KEY"
```

## Next steps

- [Choose your model](/docs/choose-a-model): which model to ask for each task, and how its id is spelled.
- [Set up your agent](/docs/agent-setup): Cursor, Claude Code, Codex, VS Code, Cline, OpenCode, Zed and the rest.
- [Gentle-AI](/docs/gentle-ai): what we recommend configuring on top, once you are connected.
- [Examples](/docs/examples): snippets ready to copy in Python, Node.js and curl.
- [API reference](/docs/api): every endpoint, field and error.
- Support: `#support` on Discord, technical questions only.