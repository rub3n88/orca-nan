# Cluster Models.

Community models. All are accessed via the same OpenAI-compatible API
with the same `base URL`.

### glm5.3 - 753B MoE

Premium tier: callable only with a key on the GLM 5.3 premium membership. \~753B parameter MoE model, focused on coding and long-horizon agentic tasks. 1M token context. Multimodal: it takes images, audio and video as well as text. Tool calling and reasoning (emits a reasoning trace). 3,000M token quota per member, and the counter goes back to zero when your billing period starts. Also capped at 400M tokens per rolling 4h window, which is the limit a heavy coding-agent run reaches first.

**multimodal text generation & chat · agentic coding**

- Type: MoE (\~753B total)
- Quantization: NVFP4
- Attention: Sparse attention
- Context: 1M tokens
- Input modalities: text · image · audio · video
- Output modalities: text
- Allowance / billing period: 3,000M tokens / member
- Rolling 4h window: 400M tokens

**capabilities**

- Tool calling (function calling)
- Reasoning control (`reasoning_effort`: `minimal` to `max`; always reasons, `none` is applied as `minimal`) · [details](#controlling-reasoning)
- Vision (image input)
- Audio (audio input)
- Video (video input)
- Coding and long-horizon agentic tasks
- 1M token context
- Streaming generation (SSE)
- Requires the GLM 5.3 premium tier

### deepseek-v4-flash - 305B MoE

305B parameter MoE model, served as the Vision-Exp variant: it takes images as input. 1M token context. Tool calling and reasoning. 3B token monthly quota per member. Structured output: response\_format json\_object is supported (on api.nan.builders the prompt must contain the word JSON, otherwise it is rejected with a 400). json\_schema is accepted on non-streamed /chat/completions requests without tools: the answer is checked against your schema and, when it does not match, usually re-served by a provider that enforces it; an answer that could not be checked, or a miss the re-serve could not replace in time, is returned as is (validate it if your code depends on it). On api.nan.builders other json\_schema requests are rejected with a 400: streamed, with tools, on /responses, with n above 1, with a schema over 16 KB, not a valid JSON Schema, or one the gateway will not validate (a $ref outside the schema, $dynamicRef or $anchor, a nested $id, or too large once its $refs are inlined); on api.helmcode.com they are accepted. json\_object guarantees syntactically valid JSON only, not its shape: describe the schema in the prompt. For schema-constrained output in those other requests, use qwen3.6 or gemma4, where json\_schema with strict constrains fields, types and required keys; or, on this model, force one function tool whose parameters is your schema (see Examples). Your output budget is used exactly as sent (above 393216, its maximum, it is lowered to 393216), with reasoning on or off (max\_tokens and max\_completion\_tokens on /chat/completions, max\_output\_tokens on /responses). Reasoning tokens count inside that budget: with reasoning on, a small budget can be spent entirely on reasoning. On /chat/completions the answer then comes back with an empty content and finish\_reason "length" (the reasoning is in reasoning\_content, and usage.completion\_tokens\_details.reasoning\_tokens equals completion\_tokens; non-streamed calls also carry the response header x-nan-truncated-in-reasoning: true); on /responses the status is incomplete, with only a reasoning output item. Dense prompts can reason past 16k tokens. The reliable fix is reasoning off (reasoning\_effort "none" on /chat/completions, reasoning.effort "none" on /responses); a lower effort is a hint on this model, not a cap. Or give a generous budget and stream the answer.

**text generation, chat & vision**

- Type: MoE (305B total)
- Quantization: FP8
- Context: 1M tokens
- Input modalities: text · image
- Output modalities: text
- Monthly quota: 3B tokens / member

**capabilities**

- Tool calling
- Reasoning control (`reasoning_effort`: `none` turns it off · `minimal` to `max`) · [details](#controlling-reasoning)
- Vision (image input)
- JSON mode (`json_object`; on api.nan.builders the prompt must mention JSON) · `json_schema` on non-streamed chat without tools (on api.nan.builders the other cases, e.g. streamed, with tools or on /responses: 400)
- 1M token context
- Streaming generation (SSE)

### glm5.3-flash - 320B-18B

320B parameter MoE model (18B active), natively multimodal, with tool calling and reasoning. 1M token context. 2B token monthly quota per member. MIT license.

**multimodal text generation & chat**

- Type: MoE (320B total · 18B active)
- Quantization: FP8
- Context: 1M tokens
- Input modalities: text · image
- Output modalities: text
- Monthly quota: 2B tokens / member
- License: MIT

**capabilities**

- Tool calling (function calling)
- Reasoning control (`reasoning_effort`: `minimal` to `max`; always reasons, `none` is applied as `minimal`) · [details](#controlling-reasoning)
- Vision (image input)
- 1M token context
- Streaming generation (SSE)

### qwen3.8-flash - 125B-6B

125B parameter MoE model (6B active), multimodal with vision, tool calling and reasoning on by default. 1M token context (1,048,576 tokens). 500M token monthly quota per member.

**text generation, chat & vision**

- Type: MoE (125B total · 6B active)
- Context: 1M tokens
- Max answer: 131K tokens
- Input modalities: text · image
- Output modalities: text
- Monthly quota: 500M tokens / member
- License: qwen-community-1.0

**capabilities**

- Tool calling (XML format)
- Reasoning on by default (`reasoning_effort`: `none` turns it off · `minimal` to `max`) · [details](#controlling-reasoning)
- Vision (image input)
- 1M token context
- Streaming generation (SSE)

### mimo-v2.6-flash - omnimodal

The newest Xiaomi MiMo, natively omnimodal with vision and audio input. 1M token context. Tool calling and reasoning. 1.0B token monthly quota per member.

**omnimodal — text, vision & audio**

- Context: 1M tokens
- Input modalities: text · image · audio
- Output modalities: text
- Monthly quota: 1.0B tokens / member

**capabilities**

- Tool calling (function calling)
- Reasoning control (`reasoning_effort`: `none` turns it off · `low` to `max`; reasoning counts inside `max_tokens`) · [details](#controlling-reasoning)
- Vision (image input)
- Audio (audio input)
- 1M token context
- Streaming generation (SSE)

### gemma4 - 26B-A4B

26B parameter MoE model (4B active), multimodal with vision. Tool calling and reasoning.

**text generation & chat**

- Type: MoE (26B total · 4B active)
- Quantization: FP8
- Context: 262K tokens
- Sampling: temp=0.6, top\_p=0.95
- Reasoning: reasoning\_config={}

**capabilities**

- Tool calling (XML format)
- Reasoning control (`reasoning_effort`: `none` or `minimal` turns it off · `low` to `max`) · [details](#controlling-reasoning)
- Multimodal (vision / images)
- Streaming generation (SSE)

### qwen3.6 - 35B-A3B

The previous generation. 35B parameter MoE, multimodal, with tool calling and reasoning. It still answers so that configurations naming it keep working, but deepseek-v4-flash is what to start from today.

**text generation & chat**

- Type: MoE (35B total)
- Active per token: 3B
- Quantization: FP8
- Context: 262K tokens
- Speculative decoding: MTP → \~2x throughput
- Sampling: temp=0.6, top\_p=0.95
- Reasoning: reasoning\_config={}

**capabilities**

- Tool calling (XML format)
- Reasoning control (`reasoning_effort`: `none` or `minimal` turns it off · `low` to `max`) · [details](#controlling-reasoning)
- Multimodal (vision / images)
- Streaming generation (SSE)

### qwen3-embedding - 8B

Vector embedding model. MMTEB score 70.58 — top-tier open models. Supports 100+ languages including Spanish and code.

**vector embeddings**

- Dimension: 4096
- Precision: Float32 (CPU)
- RPM: 60
- Batch size: 32

**use cases**

- Cross-lingual similarity (ES↔EN: 0.915)
- Semantic search
- Text classification
- RAG / retrieval augmentation

### rerank - Qwen3-Reranker-8B

8B parameter reranking model (BF16). Reorders a list of documents by relevance to a query. Completes the RAG stack alongside qwen3-embedding: first retrieve top-K via embeddings, then rerank for precision. Supports 100+ languages including Spanish, code retrieval, and cross-lingual. Top-tier on MTEB reranking benchmarks.

**semantic reranking**

- Parameters: 8B
- Precision: BF16
- Endpoints: /v1/rerank · /v2/rerank
- Languages: 100+

**use cases**

- Reranking in RAG pipelines (embedding → rerank → LLM)
- Cross-lingual search (ES↔EN, etc.)
- Code retrieval
- Query-document relevance scoring

### kokoro - v1.0

82M parameter TTS with 67 voice packs. Sub-second latency on CPU.

**text-to-speech**

- Latency: < 1s
- Parameters: 82M
- RPM: 15

**available voices**

- af\_heart — English (female)
- ef\_dora — Spanish (female)
- em\_alex — Spanish (male)
- 67 voice packs total ([see full list](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md))

### whisper - large-v3

CPU-based STT with CTranslate2 and INT8. \~1x realtime. 99+ languages.

**speech-to-text**

- Size: \~3 GB (INT8)
- WER ES: \~3.2%
- RPM: 10

**capabilities**

- Audio-to-text transcription
- 99+ languages
- Automatic language detection
- OpenAI-compatible API

### known limitations

**File size limit — 25 MB**

Maximum size per request. Compressed formats (OGG/Opus, MP3) make better use of this limit than uncompressed WAV.

**Timeout — audios > 2 min duration**

Whisper processes on CPU at \~1x realtime. For audios longer than \~2 minutes, the proxy may return a `524` (timeout) error before transcription completes. Use compressed formats like **OGG/Opus** and split long files into ≤ 2 minute segments to avoid this.

**Recommended formats**

`OGG/Opus` and `MP3` — smaller files, same transcription quality. A 60-minute audio in OGG/Opus at 48 kbps takes \~20 MB vs \~550 MB in WAV.

### flux-2-klein

FLUX diffusion model for text-to-image and image-to-image. Compatible with OpenAI's Images API (/v1/images/generations and /v1/images/edits). Requires inference-tier membership.

**image generation**

- Type: Diffusion (FLUX)
- Modalities: text→image · image→image
- Resolution: 256–1536 px (multiples of 16)
- Images / request: 1–4 (n)
- Monthly quota: 100 requests / member

**capabilities**

- Text-to-image (`/v1/images/generations`)
- Image-to-image with up to 4 references (`/v1/images/edits`)
- Output as temporary URL (R2, \~60 min) or base64
- Reproducibility via `seed` and `guidance` control

### qwen-image-2.1

Qwen image model for text-to-image with strong prompt adherence and clean text rendering inside the image. Compatible with OpenAI's Images API (/v1/images/generations). Requires inference-tier membership.

**image generation**

- Type: Diffusion (Qwen-Image)
- Modalities: text→image
- Resolution: 512–1280 px (multiples of 16)
- Images / request: 1–4 (n)
- Monthly quota: 100 requests / member (shared with flux-2-klein)

**capabilities**

- Text-to-image (`/v1/images/generations`)
- Output as temporary URL (R2, \~60 min) or base64
- Reproducibility via `seed` (0–2147483647)

## Controlling reasoning.

Every chat model above reasons before it answers. The reasoning arrives
separately from the answer: in `message.reasoning_content` on Chat Completions,
as a `reasoning` output item on Responses. One parameter controls it, the same
on every model:

| API                                       | Parameter                    |
| ----------------------------------------- | ---------------------------- |
| Chat Completions (`/v1/chat/completions`) | `reasoning_effort`           |
| Responses (`/v1/responses`)               | `reasoning: {"effort": ...}` |

The values, from no reasoning to the deepest: `none`, `minimal`, `low`,
`medium`, `high`, `xhigh`, `max`.

**To turn reasoning off, send `none`.** That is the whole switch. It works on
every model except GLM, which cannot stop reasoning (see the table).

Code written for another provider keeps working: we also accept
`thinking: {"type": "disabled"}`, `reasoning: {"enabled": false}`,
`enable_thinking: false` and `chat_template_kwargs: {"enable_thinking": false}`,
at the top level of the body or inside `extra_body`. Each one means exactly
`none`. If a request carries both a value and one of these, the value wins.

| Model                     | Off switch (`none`)                                                                                      | The other values                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deepseek-v4-flash`       | Off. No reasoning tokens.                                                                                | `minimal` to `max` steer how much it reasons. They are hints the model follows, not hard caps.                                                                                                                                                     |
| `qwen3.8-flash`           | Off. No reasoning tokens.                                                                                | Reasoning is on by default; `minimal` to `max` steer its depth (hints, not caps).                                                                                                                                                                  |
| `mimo-v2.6-flash`         | Off. No reasoning tokens.                                                                                | `low`, `medium`, `high`, `max`. `minimal` is applied as `low` and `xhigh` as `max`.                                                                                                                                                                |
| `qwen3.6` · `gemma4`      | Off. `minimal` turns it off too.                                                                         | On Chat Completions they cap the reasoning phase: `low` 2,048, `medium` 8,192, `high` 16,384, `xhigh` and `max` 32,768 tokens. On Responses only on and off apply: any value but `none` or `minimal` reasons with the default 16,384-token budget. |
| `glm5.3` · `glm5.3-flash` | Not possible: GLM always reasons. `none` is applied as `minimal`, its shortest reasoning (a few tokens). | `minimal` to `max`; higher values reason longer before answering.                                                                                                                                                                                  |

With no parameter every model reasons (`qwen3.6` and `gemma4` with a
16,384-token budget). Reasoning costs latency. Use only the values listed here.
Any other value is passed through unchanged and is not part of this contract: depending
on the model it is rejected with a `400` or ignored.

Your output budget (`max_tokens` or `max_completion_tokens` on Chat Completions,
`max_output_tokens` on Responses) is used exactly as you send it on every model,
except above the model's maximum on two models, where it is lowered to that maximum: 131072 on `glm5.3-flash`, 393216 on `deepseek-v4-flash`.
Reasoning tokens are spent from that same budget.

**Empty answer with `finish_reason: "length"`?** With reasoning on, a small
budget can run out before the answer starts. On Chat Completions you get an empty `content` with
`finish_reason: "length"`, the reasoning in `message.reasoning_content`, and
`usage.completion_tokens_details.reasoning_tokens` equal to `completion_tokens`;
only the three together mean the budget ran out while reasoning, and a non-streamed call also carries the response header `x-nan-truncated-in-reasoning: true`.
On Responses the response has `status: "incomplete"` with `incomplete_details.reason: "max_output_tokens"`, only a `reasoning` output item and no message text, and `usage.output_tokens_details.reasoning_tokens` equals `output_tokens`.
On `deepseek-v4-flash` a dense prompt can reason past 16k tokens. If you only
need the answer, the reliable fix is to turn reasoning off: `reasoning_effort: "none"` on Chat Completions, `reasoning: {"effort": "none"}` on Responses (GLM cannot turn it off; `minimal` is its shortest).
With reasoning off the answer can still stop at the budget, with text, so the budget must fit the answer.
A lower effort usually reasons less, but on `deepseek-v4-flash` and `qwen3.8-flash` it is a hint, not a cap; only `qwen3.6` and `gemma4` cap it, on Chat Completions. For a hard cap on `qwen3.6`, `gemma4` and `qwen3.8-flash`, see [Capping reasoning with a token budget](#capping-reasoning-with-a-token-budget).
If you want the reasoning, give a generous budget and
[stream the answer](#long-outputs-stream-them).

```bash
curl https://api.nan.builders/v1/chat/completions \
  -H "Authorization: Bearer $NAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-flash",
    "reasoning_effort": "none",
    "messages": [{"role": "user", "content": "Write a one-line summary of the CAP theorem."}]
  }'
```

On Helmcode, use `https://api.helmcode.com/v1` as the base URL; everything else is identical.

With the OpenAI SDK, on Chat Completions and on Responses:

```python
# pip install openai
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["NAN_API_KEY"],
    base_url="https://api.nan.builders/v1",  # Helmcode: https://api.helmcode.com/v1
)

chat = client.chat.completions.create(
    model="deepseek-v4-flash",
    reasoning_effort="none",
    messages=[{"role": "user", "content": "Write a one-line summary of the CAP theorem."}],
)
print(chat.choices[0].message.content)

resp = client.responses.create(
    model="deepseek-v4-flash",
    reasoning={"effort": "none"},
    input="Write a one-line summary of the CAP theorem.",
)
print(resp.output_text)
```

If your version of the Python SDK does not know the parameter yet (it raises `TypeError: ... unexpected keyword argument`), send it through `extra_body`; it reaches the API exactly the same:

```python
chat = client.chat.completions.create(
    model="deepseek-v4-flash",
    extra_body={"reasoning_effort": "none"},
    messages=[{"role": "user", "content": "Write a one-line summary of the CAP theorem."}],
)
```

In Node, with the same names as the HTTP API:

```javascript
// npm install openai
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.NAN_API_KEY,
  baseURL: 'https://api.nan.builders/v1', // Helmcode: https://api.helmcode.com/v1
});

const chat = await client.chat.completions.create({
  model: 'deepseek-v4-flash',
  reasoning_effort: 'none',
  messages: [{ role: 'user', content: 'Write a one-line summary of the CAP theorem.' }],
});
console.log(chat.choices[0].message.content);

const resp = await client.responses.create({
  model: 'deepseek-v4-flash',
  reasoning: { effort: 'none' },
  input: 'Write a one-line summary of the CAP theorem.',
});
console.log(resp.output_text);
```

TypeScript: if your SDK version types the parameter as a union that lacks a value you send (for example `max`), add `// @ts-expect-error` on the line above it, or cast the params object. The API accepts every value in the table.

```typescript
const chat = await client.chat.completions.create({
  model: 'deepseek-v4-flash',
  reasoning_effort: 'max' as any, // older SDK types do not list 'max'
  messages: [{ role: 'user', content: 'Write a one-line summary of the CAP theorem.' }],
});
```

### Capping reasoning with a token budget.

On `qwen3.6`, `gemma4` and `qwen3.8-flash` you can also cap the reasoning
phase at a number of tokens, on Chat Completions. Send
`thinking_token_budget` or `thinking_budget`: they are two names for the same
parameter, so use whichever your code already sends. Each model
receives the name it reads. Put it at the top level of the body or inside
`extra_body`.

- An integer from `1` to `32768` caps reasoning at that many tokens. It is a
  hard cap: the model stops reasoning there and writes its answer.
- `0` turns reasoning off, like `reasoning_effort: "none"`.
- On NaN, a larger value (or one that is not an integer) is lowered to `32768`.

Send either a budget or `reasoning_effort`, not both: combined, the result
differs by model. On the other models a budget is not part of this contract
(depending on the model it is rejected with a `400` or ignored); use
`reasoning_effort` there. On Responses the budget is not guaranteed to apply;
use `reasoning: {"effort": ...}` there.

```bash
curl https://api.nan.builders/v1/chat/completions \
  -H "Authorization: Bearer $NAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3.8-flash",
    "thinking_budget": 2048,
    "messages": [{"role": "user", "content": "How many primes are there below 200?"}]
  }'
```

With the OpenAI SDK it goes through `extra_body`:

```python
chat = client.chat.completions.create(
    model="qwen3.8-flash",
    extra_body={"thinking_budget": 2048},
    messages=[{"role": "user", "content": "How many primes are there below 200?"}],
)
```

## Long outputs: stream them.

A request without `stream: true` returns nothing until the whole answer is ready, and it has to be ready within **120 seconds**. Past that, the connection is closed with a `524` (or an error a few seconds earlier), whatever the model. At `deepseek-v4-flash` speeds that is roughly 10,000 to 15,000 output tokens; slower models, and reasoning models that think before they answer, fit less.

If you ask for long outputs (a large `max_tokens`, long code files, agents that write whole documents), use `stream: true`. A stream has no total time limit while it keeps producing: tokens reach you as they are generated, however long the answer runs. The one exception is a turn that produces only reasoning for a long time, see the [reasoning-only stream limit](#reasoning-only-stream-limit) below. Every chat model supports streaming on both endpoints (`/v1/chat/completions` and `/v1/responses`).

## Reasoning-only stream limit.

Reasoning-heavy prompts can keep a model thinking for a long time before it writes anything. When a streaming turn has produced only reasoning — no `content`, no tool calls — for **420 seconds**, the platform closes the turn instead of letting it run into a dead end. A turn that is demonstrably thinking — it has already produced more than 45,000 reasoning characters — gets until **600 seconds**. The reasoning-character budget also scales with the size of your prompt: roughly 150,000 characters of headroom plus half the prompt's size in characters, capped at 300,000. When the platform closes the turn you receive `finish_reason: "length"` on an empty delta, followed by a usage chunk.

That usage chunk is an estimate of what the attempt consumed up to the cut
(prompt and reasoning tokens), marked `"estimated": true, "billed": false` —
turns closed this way are not charged against your quota — and carries a
`nan_truncation` marker so clients can tell this closure apart from a real
context-length cut. Request it with `stream_options: {"include_usage": true}`.

Two things worth knowing:

- The limit does not cap your output. The first visible token of content or
  any tool call disarms it for the rest of the turn: answers that write as
  they go are never cut, however long they run.
- If a turn closes this way, the model was still planning when it hit the
  ceiling. Lower `reasoning_effort` where the model supports it (table
  above), or restructure the prompt so the model starts writing early.

The limit exists to bound a known failure mode of thinking models: they occasionally plan without converging for 10–25 minutes and burn their whole output budget with zero visible output. The bounds sit above the reasoning traces of healthy converging turns in our production traffic, and only tighten when a stream is stuck.

**rate limits per API key**

- Requests / min: 60 rpm
- Concurrent requests: per model — see the per-model limits below

**concurrent requests per model**

- glm5.3: 7 (base plan) · 10 (premium plan)
- glm5.3-flash: 7 (base plan) · 10 (premium plan)
- deepseek-v4-flash: 7 (base plan) · 10 (premium plan)
- qwen3.8-flash: 7 (base plan) · 10 (premium plan)
- mimo-v2.6-flash: 5
- qwen3.6: 5
- gemma4: 5

Audio, embedding and rerank endpoints have no concurrency limit.

**glm5.3 · premium tier limits**

- Rolling 4h window: 400M tokens
- Allowance / billing period: 3,000M tokens
- Context window: 1M tokens
- Concurrent requests: 10

400M tokens per rolling 4 hours is the limit a heavy coding-agent run reaches first, well before the allowance. Once you hit it, glm5.3 requests are rejected until the window slides forward: it is a rolling window, not a daily reset. The allowance counter goes back to zero when your billing period starts, and if you upgrade part-way into a period that first allowance is prorated to the share of the period you paid for.

**tokens / min per model**

- deepseek-v4-flash: 1.5M tpm
- mimo-v2.6-flash: 1.5M tpm
- qwen3.6: 1.5M tpm
- gemma4: 1.5M tpm

**requests / min per model**

- rerank: 1000 rpm