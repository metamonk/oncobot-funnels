./components/tool-invocation-list-view.tsx
1966:7  Warning: React Hook useCallback has a missing dependency: 'isStreaming'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
Failed to compile.
./components/clinical-trials.tsx:318:9
Type error: Property 'protocolSection' is missing in type 'import("/vercel/path0/lib/saved-trials/types").ClinicalTrial' but required in type 'import("/vercel/path0/lib/tools/clinical-trials/types").ClinicalTrial'.
  316 |         open={modalOpen}
  317 |         onOpenChange={setModalOpen}
> 318 |         trial={trial}
      |         ^
  319 |         healthProfile={healthProfile}
  320 |         onComplete={handleComplete}
  321 |       />