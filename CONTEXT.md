./components/chat-interface.tsx
338:7  Warning: React Hook useMemo has missing dependencies: 'refetchUsage' and 'user'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
./components/health-profile/HealthProfileQuestionnaireModal.tsx
58:9  Warning: The 'shouldShowQuestion' function makes the dependencies of useEffect Hook (at line 84) change on every render. To fix this, wrap the definition of 'shouldShowQuestion' in its own useCallback() Hook.  react-hooks/exhaustive-deps
./components/interactive-maps.tsx
284:22  Warning: The ref value 'popupRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'popupRef.current' to a variable inside the effect, and use that variable in the cleanup function.  react-hooks/exhaustive-deps
./components/interactive-stock-chart.tsx
314:7  Warning: React Hook useCallback has an unnecessary dependency: 'interval'. Either exclude it or remove the dependency array.  react-hooks/exhaustive-deps
440:8  Warning: React Hook useMemo has an unnecessary dependency: 'interval'. Either exclude it or remove the dependency array.  react-hooks/exhaustive-deps
590:33  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
663:35  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
./components/ui/form-component.tsx
