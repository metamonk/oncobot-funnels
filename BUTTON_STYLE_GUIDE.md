# Button Style Guide for OncoBot v3

## Button Variant Usage

### Primary Actions (Default Variant)
Use the `default` variant (or no variant specification) for primary actions:
- Save/Submit buttons
- Continue/Next buttons in flows
- Primary CTAs

```tsx
<Button onClick={handleSave}>
  Save Settings
</Button>
```

### Secondary Actions (Outline Variant)
Use the `outline` variant for secondary actions:
- Cancel/Close buttons
- "Not Now" or defer actions
- Alternative options

```tsx
<Button variant="outline" onClick={handleCancel}>
  Not Now
</Button>
```

### Subtle Actions (Ghost Variant)
Use the `ghost` variant for tertiary or subtle actions:
- Development/testing buttons
- Icon-only buttons
- Less prominent actions

```tsx
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

### Special Consent Actions (Blue Override)
For critical consent-related actions, we use a blue color override on top of the default button:
- "I Agree & Continue" buttons
- Consent acceptance actions
- Privacy-related confirmations

```tsx
<Button 
  onClick={handleAccept}
  className="bg-blue-500 hover:bg-blue-600 text-white border-0"
>
  I Agree & Continue
</Button>
```

## Color Consistency

### Theme Colors
- **Primary actions**: Use theme's primary color (default button variant)
- **Blue accents**: Reserved for consent/privacy actions (`bg-blue-500`)
- **Destructive**: Red variants for dangerous actions
- **Ghost/Outline**: Inherit theme colors

### Dark Mode Support
All buttons should work seamlessly in both light and dark modes:
- Default variant adapts to theme
- Outline variant uses `border-border` 
- Ghost variant uses transparent backgrounds
- Blue overrides remain consistent across themes

## Size Guidelines

- **Default**: Standard buttons in forms and dialogs
- **sm**: Compact buttons in constrained spaces (settings, tables)
- **lg**: Prominent CTAs and hero sections
- **icon**: Square buttons with icons only

## Examples from Codebase

### Consent Dialog
```tsx
// Secondary action - defer consent
<Button variant="outline" onClick={onDecline}>
  Not Now
</Button>

// Primary consent action - special blue styling
<Button className="bg-blue-500 hover:bg-blue-600 text-white border-0">
  I Agree & Continue
</Button>
```

### Settings Panel
```tsx
// Standard save button
<Button variant="default" size="sm">
  Save Privacy Settings
</Button>

// Development tools - subtle
<Button variant="ghost" size="sm">
  Reset All Consents
</Button>
```

### Health Profile Flow
```tsx
// Navigation - secondary
<Button variant="outline" onClick={handlePrevious}>
  <ChevronLeft /> Previous
</Button>

// Progress - primary
<Button onClick={handleNext}>
  Next <ChevronRight />
</Button>

// Completion - primary with icon
<Button className="gap-2">
  <Check className="h-4 w-4" />
  Complete
</Button>
```

## Key Principles

1. **Consistency**: Use the same variant for similar actions across the app
2. **Hierarchy**: Primary > Secondary (outline) > Tertiary (ghost)
3. **Special Cases**: Blue styling only for consent/privacy critical actions
4. **Accessibility**: Ensure sufficient contrast in all themes
5. **Context**: Consider the button's context and importance in the flow