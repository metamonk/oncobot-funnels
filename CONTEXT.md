./components/interactive-stock-chart.tsx
589:33  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
662:35  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
Failed to compile.
./components/messages.tsx:588:19
Type error: Type '{}' is missing the following properties from type 'HealthProfilePromptDialogProps': open, onOpenChange
  586 |         
  587 |         {/* Automatic timed health profile prompt dialog */}
> 588 |         {user && <HealthProfilePromptDialog />}
      |                   ^
  589 |       </div>
  590 |     );
  591 |   },