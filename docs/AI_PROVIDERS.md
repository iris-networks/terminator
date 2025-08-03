# AI Providers Configuration

Terminator supports multiple AI providers. Choose one and set the corresponding environment variables in your `.env` file.

## Anthropic Claude

```bash
AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-20250514
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Getting an API Key:**
1. Sign up at [Anthropic Console](https://console.anthropic.com/)
2. Create an API key in your account settings
3. Add billing information to use the API

**Popular Models:**
- `claude-sonnet-4-20250514` - Latest Claude Sonnet 4 (recommended)
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet
- `claude-3-haiku-20240307` - Fast and cost-effective

## OpenAI GPT

```bash
AI_PROVIDER=openai
AI_MODEL=gpt-4o
OPENAI_API_KEY=your_openai_api_key
```

**Getting an API Key:**
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Create an API key in the API keys section
3. Add payment method for usage-based billing

**Popular Models:**
- `gpt-4o` - Latest GPT-4 Omni (recommended)
- `gpt-4o-mini` - Faster and cheaper variant
- `gpt-4-turbo` - Previous generation turbo model

## Google Gemini

```bash
AI_PROVIDER=google
AI_MODEL=gemini-1.5-pro
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
```

**Getting an API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Enable the Generative AI API in Google Cloud Console if needed

**Popular Models:**
- `gemini-1.5-pro` - Most capable model (recommended)
- `gemini-1.5-flash` - Faster variant
- `gemini-1.5-pro-002` - Latest version with improvements

## Ollama (Local)

For running models locally without API costs.

### Installation

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Windows:**
Download from [ollama.ai/download](https://ollama.ai/download)

### Setup

1. **Start Ollama service:**
```bash
ollama serve
```

2. **Pull a model (in another terminal):**
```bash
ollama pull llama3.1:8b
```

3. **Configure Terminator:**
```bash
AI_PROVIDER=ollama
AI_MODEL=llama3.1:8b
# No API key needed for local Ollama
```

**Popular Models:**
- `llama3.1:8b` - Good balance of performance and speed
- `llama3.1:70b` - Higher quality but slower
- `codellama` - Specialized for coding tasks
- `mistral` - Alternative option

**Note:** Make sure Ollama is running (`ollama serve`) before starting Terminator.

## OpenRouter

Access to multiple AI models through a single API.

```bash
AI_PROVIDER=openrouter
AI_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_API_KEY=your_openrouter_api_key
```

**Getting an API Key:**
1. Sign up at [OpenRouter](https://openrouter.ai/)
2. Create an API key in your account
3. Add credits to your account

**Popular Models:**
- `anthropic/claude-3.5-sonnet` - Claude via OpenRouter
- `openai/gpt-4o` - GPT-4 via OpenRouter  
- `google/gemini-pro-1.5` - Gemini via OpenRouter
- `meta-llama/llama-3.1-8b-instruct` - Open source option

Visit [OpenRouter Models](https://openrouter.ai/models) to see all available models and pricing.

## Troubleshooting

### Common Issues

**"Missing required environment variables"**
- Make sure your `.env` file is in the project root
- Double-check the environment variable names (case-sensitive)
- Restart the application after changing environment variables

**"Unsupported AI provider"**
- Check that `AI_PROVIDER` matches exactly: `anthropic`, `openai`, `google`, `ollama`, or `openrouter`
- No quotes needed around the value in `.env` file

**Ollama connection issues**
- Ensure Ollama is running: `ollama serve`
- Check if the model is installed: `ollama list`
- Try pulling the model again: `ollama pull <model-name>`

**API rate limits or quota exceeded**
- Check your account billing and usage on the provider's platform
- Consider switching to a different model or provider temporarily
- For development, Ollama provides unlimited local usage

---

**Previous:** [Project Architecture](./PROJECT_ARCHITECTURE.md) | **Next:** [API Reference](./API_REFERENCE.md)