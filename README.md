# OncoBot

![OncoBot](/app/opengraph-image.png)

OncoBot is an AI-powered medical oncology assistant specializing in clinical trial search and matching for cancer patients. Built with compassion and cutting-edge technology, OncoBot helps patients navigate their cancer journey by finding relevant clinical trials and providing comprehensive health information.

## Core Features

### Clinical Trial Search & Matching

- **Personalized Trial Matching**: Find clinical trials that match your specific cancer type, stage, and molecular markers
- **Health Profile Integration**: Create a comprehensive health profile to get personalized trial recommendations
- **Location-Based Search**: Find trials near you with customizable distance filtering
- **Eligibility Analysis**: Get AI-powered analysis of trial eligibility based on your health profile
- **Real-Time Data**: Access up-to-date information from ClinicalTrials.gov

### Health Profile Management

- **Comprehensive Questionnaire**: Answer detailed questions about your cancer diagnosis, treatment history, and current health status
- **Molecular Marker Tracking**: Record genetic mutations and biomarkers for precise trial matching
- **Treatment History**: Document previous therapies to identify suitable next-line options
- **Performance Status**: Track ECOG performance status for eligibility assessment

### AI-Powered Assistance

- **Multiple AI Models**: Access various AI models including xAI's Grok, Anthropic's Claude, Google's Gemini, and OpenAI's GPT models
- **Conversational Interface**: Natural language interaction for easy information access
- **Memory System**: Remember your health information and preferences across conversations
- **Multi-Modal Support**: Upload medical documents and images for analysis

### Research & Information Tools

- **Medical Literature Search**: Find relevant academic papers and research studies
- **Web Search**: Access current medical information and news
- **Treatment Center Locator**: Find nearby cancer treatment centers and hospitals
- **Clinical Trial Site Mapping**: View trial locations on interactive maps

## Search Modes

- **Health**: Specialized mode for clinical trial search and health information
- **Web**: General medical information and research
- **Academic**: Access to peer-reviewed medical literature
- **Analysis**: Data visualization and interpretation tools
- **Memory**: Personal health information management

## Supported AI Models

### Free Models (Authentication Required)
- **xAI**: Grok 3 Mini, Grok 2 Vision
- **OpenAI**: GPT-4o Mini, GPT 4.1 Mini
- **Google**: Gemini 2.5 Flash
- **Groq**: Qwen 3 32B, Meta Llama 4

### Premium Models
- **xAI**: Grok 3, Grok 4
- **Anthropic**: Claude 4 Sonnet
- **OpenAI**: o4-mini, o3 (with reasoning capabilities)
- **Google**: Gemini 2.5 Pro

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - AI model integration
- [Shadcn/UI](https://ui.shadcn.com/) - UI components
- [ClinicalTrials.gov API](https://clinicaltrials.gov/data-api/api) - Clinical trial data
- [Better Auth](https://github.com/better-auth/better-auth) - Authentication
- [Drizzle ORM](https://orm.drizzle.team/) - Database management
- [Google Maps](https://developers.google.com/maps) - Location services

## Privacy & Security

- **HIPAA Considerations**: While OncoBot helps organize health information, always consult with healthcare providers for medical decisions
- **Data Protection**: Your health profile is securely stored and only accessible to you
- **No Medical Advice**: OncoBot provides information only and does not replace professional medical consultation

## Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmetamonk%2Foncobot-v3&env=XAI_API_KEY,OPENAI_API_KEY,ANTHROPIC_API_KEY,GROQ_API_KEY,GOOGLE_GENERATIVE_AI_API_KEY,DATABASE_URL,BETTER_AUTH_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GOOGLE_MAPS_API_KEY,OPENWEATHER_API_KEY&envDescription=API%20keys%20and%20configuration%20required%20for%20OncoBot%20to%20function)

## Local Development

### Prerequisites

1. Node.js 18+ and pnpm
2. PostgreSQL database
3. API keys for:
   - At least one AI provider (xAI, OpenAI, Anthropic, or Google)
   - Google Maps (for location services)
   - Authentication providers (GitHub, Google, or Twitter/X)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/metamonk/oncobot-v3.git
   cd oncobot-v3
   ```

2. Copy `.env.example` to `.env.local` and fill in your API keys:
   ```bash
   cp .env.example .env.local
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up the database:
   ```bash
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Docker Support

Run OncoBot using Docker:

```bash
docker compose up
```

Or build and run manually:

```bash
docker build -t oncobot .
docker run --env-file .env -p 3000:3000 oncobot
```

## Set OncoBot as Your Default Search Engine

1. **Open Chrome browser settings**:
   - Click the three dots in the upper right corner
   - Select "Settings"

2. **Navigate to search engine settings**:
   - Click "Search engine" in the left sidebar
   - Select "Manage search engines and site search"

3. **Add OncoBot**:
   - Click "Add" next to "Site search"
   - Search engine: `OncoBot`
   - Shortcut: `onco`
   - URL: `https://oncobot.app?q=%s`

4. **Set as default**:
   - Click the three dots next to OncoBot
   - Select "Make default"

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/metamonk/oncobot-v3/issues)
- **Discussions**: [GitHub Discussions](https://github.com/metamonk/oncobot-v3/discussions)

## Disclaimer

OncoBot is an information tool designed to help patients find clinical trials and access medical information. It does not provide medical advice, diagnoses, or treatment recommendations. Always consult with qualified healthcare professionals for medical decisions.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.