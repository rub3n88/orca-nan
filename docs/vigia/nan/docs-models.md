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
- Reasoning mode (reasoning trace)
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
- Reasoning mode
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
- Reasoning mode
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
- Reasoning mode
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
- Reasoning mode
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

**rate limits per API key**

- Requests / min: 60 rpm
- Concurrent requests: per model — see the per-model limits below

**concurrent requests per model**

- glm5.3: 7 (base plan) · 10 (premium plan)
- glm5.3-flash: 7 (base plan) · 10 (premium plan)
- deepseek-v4-flash: 7 (base plan) · 10 (premium plan)
- qwen3.8-flash: 7 (base plan) · 10 (premium plan)
- mimo-v2.5: 5
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
- qwen3.6: 1.5M tpm
- gemma4: 1.5M tpm

**requests / min per model**

- rerank: 1000 rpm