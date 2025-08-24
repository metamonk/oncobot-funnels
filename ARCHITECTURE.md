Last Updated: 08/24/2025

Analysis: Understanding the System Architecture

You're partially correct, but let me clarify the complete picture of how the system works:

The Architecture Layers

1. Main Agentic Model (Grok/Claude/GPT)
	- This is the PRIMARY AI that users interact with in the chat interface
	- It receives user messages and decides when to call the clinical_trials tool
	- It orchestrates the overall conversation and composes responses
	- Lives in /app/api/search/route.ts
2. Clinical Trials Tool Layer
	- Entry point: /lib/tools/clinical-trials.ts
	- This is invoked BY the main model when it detects trial-related queries
	- Handles the mechanics of search execution
3. Conversational Intelligence (Our New Addition)
	- A SECONDARY AI system (uses GPT-4o-mini)
	- Purpose: Understand query intent WITH conversation context
	- Composes multiple search strategies intelligently
	- NOT the main chat model, but a specialized subsystem
4. Query Classification AI
	- Another SECONDARY AI (also GPT-4o-mini)
	- Already existed before our changes
	- Classifies queries and extracts entities
	- Falls back to simple classification if AI fails
5. Infrastructure Components
	- Cache Service: 30-minute TTL for trial results
	- Database: Permanent storage of messages and results
	- Search Executor: Calls ClinicalTrials.gov API
	- Location Service: Geographic filtering
	- Compression Service: Token optimization

The Flow

User Message → Main AI (Grok/Claude/GPT)
								↓ (decides to search trials)
					clinical_trials tool called
								↓
		[NEW] Conversational Intelligence AI
					(understands context, composes strategies)
								↓
					Query Classification AI
					(extracts entities, determines intent)
								↓
					Search Strategy Executor
					(runs composed strategies in parallel)
								↓
					Results back to Main AI
								↓
					Main AI composes final response to user

Key Insights

1. Multi-AI System: We have THREE AI systems working together:
	- Main conversational AI (Grok/Claude/GPT)
	- Conversational Intelligence AI (context understanding)
	- Query Classification AI (entity extraction)
2. The Main AI Doesn't "See" Implementation Details
	- It just calls the tool with a query
	- Our subsystems handle all the intelligence
	- Results are returned for the main AI to present
3. Layered Intelligence:
	- Main AI: General conversation, tool orchestration
	- Conversational AI: Understands "show me more" in context
	- Classification AI: Extracts "KRAS G12C", "Chicago", etc.
4. Your Understanding:
	- ✅ Correct: Main AI (Grok) orchestrates everything
	- ✅ Correct: Infrastructure pieces support execution
	- ⚠️ Clarification: The "Unified Query Processing" is a subsystem AI, not the main AI
	- ⚠️ Clarification: We have multiple AI layers, each with specific responsibilities

Why This Design Works

1. Separation of Concerns:
	- Main AI handles general conversation
	- Specialized AIs handle domain-specific understanding
	- Infrastructure handles execution
2. Fallback Resilience:
	- If Conversational Intelligence fails → uses standard routing
	- If Classification AI fails → uses simple classifier
	- Multiple layers of fallback ensure reliability
3. Context Preservation:
	- Conversation history informs specialized AI
	- But doesn't burden the main AI with implementation details
	- Clean abstraction boundaries

The beauty is that the main AI model (Grok/Claude/GPT) doesn't need to understand clinical trials
deeply - it just knows when to invoke the tool, and our specialized subsystems handle all the
intelligent processing of what "show me more" means in context.