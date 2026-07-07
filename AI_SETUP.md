# AI Setup

ClosePilot includes backend AI endpoints for:

- lead copilot
- daily briefing
- follow-up messages
- manager insights
- sales coach
- proposal drafts
- conversation summaries
- pipeline analysis

Add `OPENAI_API_KEY` in Vercel to enable live AI. Optionally add `OPENAI_MODEL`.

Without OpenAI, the app uses deterministic rule-based fallback AI and labels responses as fallback/demo.

AI outputs are saved to Supabase `ai_outputs` when Supabase service config is present and the schema has been applied.
