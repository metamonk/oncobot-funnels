589:33  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
662:35  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
./components/markdown.tsx
306:8  Warning: React Hook useCallback has unnecessary dependencies: 'responseContext' and 'trackContentCopy'. Either exclude them or remove the dependency array. Outer scope values like 'trackContentCopy' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
488:8  Warning: React Hook useCallback has unnecessary dependencies: 'responseContext' and 'trackContentCopy'. Either exclude them or remove the dependency array. Outer scope values like 'trackContentCopy' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
./components/ui/form-component.tsx
1189:5  Warning: React Hook useCallback has a missing dependency: 'availableModels'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
1415:5  Warning: React Hook useCallback has a missing dependency: 'availableModels'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
1500:5  Warning: React Hook useCallback has a missing dependency: 'availableModels'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
Failed to compile.
./lib/tools/health-profile.ts:410:21
Type error: Cannot find name 'action'.
  408 |           data: {
  409 |             message: error instanceof Error ? error.message : 'An error occurred',
> 410 |             action: action
      |                     ^
  411 |           }
  412 |         });
  413 |         