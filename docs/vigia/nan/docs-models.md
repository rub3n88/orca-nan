# Cluster Models.

Community models. All are accessed via the same OpenAI-compatible API
with the same `base URL`.

### glm5.3 - 753B MoE

Premium tier: callable only with a key on the GLM 5.3 premium membership. \~753B parameter MoE model, focused on coding and long-horizon agentic tasks. 1M token context. Text in, text out: it does not take images. Tool calling and reasoning (emits a reasoning trace). 3,000M token quota per member, and the counter goes back to zero when your billing period starts. Also capped at 400M tokens per rolling 4h window, which is the limit a heavy coding-agent run reaches first.

**text generation & chat · agentic coding**

- Type: MoE (\~753B total)
- Quantization: FP8
- Attention: Sparse attention
- Context: 1M tokens
- Input modalities: text
- Output modalities: text
- Allowance / billing period: 3,000M tokens / member
- Rolling 4h window: 400M tokens

**capabilities**

- Tool calling (function calling)
- Reasoning control (`reasoning_effort`: low · medium · high · max)
- Coding and long-horizon agentic tasks
- 1M token context
- Streaming generation (SSE)
- Requires the GLM 5.3 premium tier

### deepseek-v4-flash - 305B MoE

305B parameter MoE model, served as the Vision-Exp variant: it takes images as input. 1M token context. Tool calling and reasoning. 3B token monthly quota per member.

**text generation, chat & vision**

- Type: MoE (305B total)
- Quantization: FP8
- Context: 1M tokens
- Input modalities: text · image
- Output modalities: text
- Monthly quota: 3B tokens / member

**capabilities**

- Tool calling
- Reasoning mode (adaptive — not level-adjustable)
- Vision (image input)
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
- Reasoning control (`reasoning_effort`: low · medium · high · max)
- Vision (image input)
- 1M token context
- Streaming generation (SSE)

### qwen3.8-flash - 125B-6B

125B parameter MoE model (6B active), multimodal with vision, tool calling and reasoning on by default. 262K token context, the model's native window. 500M token monthly quota per member.

**text generation, chat & vision**

- Type: MoE (125B total · 6B active)
- Context: 262K tokens
- Max answer: 131K tokens
- Input modalities: text · image
- Output modalities: text
- Monthly quota: 500M tokens / member
- License: qwen-community-1.0

**capabilities**

- Tool calling (XML format)
- Reasoning mode (on by default)
- Vision (image input)
- 262K token context
- Streaming generation (SSE)

### mimo-v2.5 - 310B-15B

310B parameter MoE model (15B active), natively omnimodal with dedicated vision and audio encoders. 1M token context. Tool calling and reasoning. 1.0B token monthly quota per member. MIT license.

**omnimodal — text, vision & audio**

- Type: MoE (310B total · 15B active)
- Quantization: FP8
- Context: 1M tokens
- Max answer: 131K tokens
- Input modalities: text · image · audio
- Output modalities: text
- Monthly quota: 1.0B tokens / member
- License: MIT

**capabilities**

- Tool calling (function calling)
- Reasoning mode (recommended `max_tokens ≥ 300`)
- Vision (image input)
- Audio (audio input)
- 1M token context
- Streaming generation (SSE)

### mimo-v2.6-flash - omnimodal

The newest Xiaomi MiMo, natively omnimodal with vision and audio input. 1M token context. Tool calling and reasoning. Same limits as mimo-v2.5: 1.0B token monthly quota per member.

**omnimodal — text, vision & audio**

- Context: 1M tokens
- Input modalities: text · image · audio
- Output modalities: text
- Monthly quota: 1.0B tokens / member

**capabilities**

- Tool calling (function calling)
- Reasoning mode (recommended `max_tokens ≥ 300`)
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
- Reasoning control (`none` · low · medium · high · max)
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
- Reasoning control (`none` · low · medium · high · max)
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

Every chat model above thinks before it answers, and the reasoning trace
arrives separately from the answer, in `message.reasoning_content`. How much a
model is allowed to think is a request parameter, `reasoning_effort`, and each
model applies it differently — the table is the contract. A value a model
cannot apply is never an error.

| Model                                             | `reasoning_effort` values                         | What it does                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `glm5.3` · `glm5.3-flash`                         | `low`, `medium`, `high`, `max`                    | Fully controllable. Higher values let the model reason longer before it answers; `max` is the deepest.                                  |
| `qwen3.6`                                         | `none`, `minimal`, `low`, `medium`, `high`, `max` | `none` and `minimal` skip the reasoning phase entirely. The other four cap it: low 2,048, medium 8,192, high 16,384, max 32,768 tokens. |
| `gemma4`                                          | `none`, `minimal`, `low`, `medium`, `high`, `max` | Same as `qwen3.6`: off, or a reasoning budget between 2,048 and 32,768 tokens.                                                          |
| `deepseek-v4-flash`                               | any value (no effect)                             | The model decides per request how much to reason; the parameter never changes that.                                                     |
| `qwen3.8-flash` · `mimo-v2.5` · `mimo-v2.6-flash` | accepted, depth not adjustable                    | The parameter is accepted and never rejected, but these models manage their own reasoning depth.                                        |

With no parameter, every model uses its own default (reasoning on for
`qwen3.6` and `gemma4`, with a 16,384-token budget). More reasoning costs
latency and counts toward `max_tokens`; it never costs extra setup.

```bash
curl https://api.nan.builders/v1/chat/completions \
  -H "Authorization: Bearer $NAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm5.3-flash",
    "reasoning_effort": "low",
    "messages": [{"role": "user", "content": "Write a one-line summary of the CAP theorem."}]
  }'
```

## Reasoning-only stream limit.

Reasoning-heavy prompts can keep a model thinking for a long time before it
writes anything. When a streaming turn has produced only reasoning — no
`content`, no tool calls — for **60,000 reasoning characters** (roughly
15,000 tokens) or **420 seconds**, the platform closes the turn instead of
letting it run into a dead end: you receive `finish_reason: "length"` on an
empty delta, followed by a usage chunk.

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

The limit exists to bound a known failure mode of thinking models: they
occasionally plan without converging for 10–25 minutes and burn their whole
output budget with zero visible output. It sits above the largest legitimate
reasoning trace we have measured (\~44,000 characters) and below every
stalled run.

**rate limits per API key**

- Requests / min: 60 rpm
- Concurrent requests: per model — see the per-model limits below

**concurrent requests per model**

- glm5.3: 7 (base plan) · 10 (premium plan)
- glm5.3-flash: 7 (base plan) · 10 (premium plan)
- deepseek-v4-flash: 7 (base plan) · 10 (premium plan)
- qwen3.8-flash: 7 (base plan) · 10 (premium plan)
- mimo-v2.5: 5
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
- mimo-v2.5: 1.5M tpm
- mimo-v2.6-flash: 1.5M tpm
- qwen3.6: 1.5M tpm
- gemma4: 1.5M tpm

**requests / min per model**

- rerank: 1000 rpm