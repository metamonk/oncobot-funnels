./components/ui/form-component.tsx:1164:57
Type error: Property 'split' does not exist on type 'never'.
  1162 |
  1163 |           if (moderationResult !== 'safe') {
> 1164 |             const [status, category] = moderationResult.split('\n');
       |                                                         ^
  1165 |             if (status === 'unsafe') {
  1166 |               console.warn('Unsafe image detected, category:', category);
  1167 |               toast.error(`Image content violates safety guidelines (${category}). Please choose different images.`);
Next.js build worker exited with code: 1 and signal: null