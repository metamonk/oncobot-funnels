🎯 Location Intelligence Test Queries

  Phase 1: Passive Location Detection

  These test if the agent uses detected coordinates from Vercel geolocation

  Standalone Queries:
  1. "What clinical trials are available near me?"
  2. "Show me trials I can participate in nearby"
  3. "Find cancer trials close to my location"
  4. "Are there any lung cancer studies recruiting patients near me?"
  5. "Which trials are within 50 miles of me?"

  Phase 2: Explicit Location Queries

  These test direct location parsing and metropolitan area expansion

  City-Specific:
  6. "What trials are available in Chicago?"
  7. "Show me clinical trials in Boston, MA"
  8. "Find studies recruiting in Los Angeles"
  9. "Are there trials in the San Francisco Bay Area?"
  10. "List trials available in Houston or Dallas"

  Metro Area Intelligence:
  11. "Find trials in the Chicago metropolitan area"
  12. "Show me studies in NYC and surrounding areas"
  13. "What trials are in suburbs near Boston?"

  Phase 3: Distance-Based Queries

  These test radius search and distance calculation

  14. "Show trials within 25 miles of Chicago"
  15. "Find studies within 100 miles of Boston, MA"
  16. "What trials are less than 2 hours drive from Seattle?"
  17. "Which cancer centers within 50 miles have trials?"

  Phase 4: Progressive Filtering (Follow-ups)

  These test location filtering on cached results

  Initial Query:
  18. "Find all phase 3 lung cancer trials"

  Follow-up Refinements:
  19. "Which of these are in California?"
  20. "Show me only the ones near Los Angeles"
  21. "Filter those to within 30 miles of me"
  22. "Now show the ones in the Bay Area instead"
  23. "Actually, which ones are closest to San Diego?"

  Phase 5: Complex Location Context

  These test multi-criteria searches with location

  24. "Find EGFR+ lung cancer trials near Boston or New York"
  25. "Show me immunotherapy trials within 100 miles that accept stage 3 patients"
  26. "What breast cancer trials in Chicago accept patients over 65?"
  27. "Find phase 2 trials near me for my specific cancer type"

  Phase 6: Specific Trial Location Queries

  These test location details for specific trials

  28. "Where is NCT05568550 being conducted?"
  29. "Which location for NCT05568550 is closest to me?"
  30. "How far is the nearest site for NCT05568550?"
  31. "Show me all locations for NCT05568550 within 200 miles"

  Phase 7: Comparative Location Queries

  These test ranking and comparison

  32. "Which trial is closest to me?"
  33. "Rank these trials by distance from Chicago"
  34. "Compare locations for my top 3 trial matches"
  35. "Which cities have the most trials for my condition?"

  Phase 8: Edge Cases & Intelligence Tests

  These test fallback behavior and error handling

  36. "Find trials near me" (when geolocation fails)
  37. "Show trials in Evanston" (suburb that should expand to Chicago metro)
  38. "What trials are in 60601?" (ZIP code query)
  39. "Find studies close to O'Hare airport"
  40. "Show trials between Chicago and Milwaukee"

  Phase 9: Memory & Context Persistence

  These test if location context is maintained

  Sequence:
  41. "I'm in Denver"
  42. "What lung cancer trials are available?"
  43. "Which of those are recruiting?"
  44. "Show me the closest one"
  45. "Are there any within walking distance of downtown?"

  Phase 10: Natural Language Variations

  These test query understanding flexibility

  46. "trials around here"
  47. "studies in my area"
  48. "cancer research near my home"
  49. "where can I get treatment nearby?"
  50. "closest trial to ZIP 02115"

  🔍 Expected Intelligent Behaviors

  The agent should demonstrate:

  1. Passive Location Usage: Automatically use detected coordinates when available
  2. Metro Area Expansion: Include surrounding cities (e.g., Evanston for Chicago)
  3. Distance Ranking: Sort results by proximity when location is known
  4. Progressive Filtering: Apply location filters to cached results efficiently
  5. Context Persistence: Remember location across related queries
  6. Graceful Degradation: Provide helpful responses when location is unavailable
  7. Multi-Location Handling: Process queries with multiple location criteria
  8. Precision Control: Respect radius constraints ("within X miles")
  9. Natural Language Understanding: Parse various ways of expressing location
  10. Smart Fallbacks: Suggest alternatives when no local trials exist

  📊 Success Metrics

  - Accuracy: Returns trials actually in specified locations
  - Completeness: Includes metro area trials when appropriate
  - Ranking: Closest trials appear first when coordinates available
  - Efficiency: Uses cached results for follow-up filtering
  - Context: Maintains location awareness across conversation
  - Token Optimization: Sends location summaries, not full location arrays
  - User Experience: Clear communication about location matching
  - Fallback Quality: Helpful suggestions when location detection fails