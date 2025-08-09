# Clinical Trials Tool Routing Guide

## Tool Selection Rules

### Use `clinical_trials_info` tool for:
- Questions about HOW to qualify or determine eligibility
- General questions about the clinical trial process
- Information about trial phases (Phase 1, 2, 3, 4)
- Questions about costs, insurance, or payment
- Safety concerns or risks of trials
- Patient rights and withdrawal procedures
- "How do I know if I qualify?"
- "What are clinical trials?"
- "Are trials safe?"
- "How do trials work?"
- ANY educational or informational query about trials

### Use `clinical_trials` tool for:
- SEARCHING for specific trials
- Finding trials for a specific condition
- Locating trials in a specific area
- Getting trial details for specific diseases
- "Find trials for [condition]"
- "Show me trials near [location]"
- "Are there trials for [disease]?"
- Actual trial discovery and matching

### Use `health_profile` tool for:
- Creating or updating health profiles
- Checking profile status
- Getting profile information

## Example Query Routing

| User Query | Tool to Use | Reason |
|------------|------------|---------|
| "How do I know if I qualify for a trial?" | clinical_trials_info | Informational/educational |
| "Find trials for lung cancer" | clinical_trials | Search request |
| "What are the phases of clinical trials?" | clinical_trials_info | Educational |
| "Are there trials near Chicago?" | clinical_trials | Search with location |
| "Is it safe to join a trial?" | clinical_trials_info | Safety information |
| "Show me KRAS G12C trials" | clinical_trials | Specific search |
| "How much do trials cost?" | clinical_trials_info | Cost information |
| "What are my rights as a participant?" | clinical_trials_info | Rights information |

## Important Notes

1. NEVER use clinical_trials for informational queries
2. ALWAYS use clinical_trials_info for "how", "what", "why" questions about trials
3. Profile-less users asking about "my" condition should be prompted to create a profile
4. The clinical_trials_info tool provides curated, authoritative content - not search results