./components/clinical-trials/eligibility-checker-modal.tsx:364:65
Type error: Expected 3-4 arguments, but got 2.
  362 |         
  363 |         // Perform eligibility assessment
> 364 |         const finalAssessment = await eligibilityCheckerService.assessEligibility(
      |                                                                 ^
  365 |           criteria,
  366 |           responseArray
  367 |         );