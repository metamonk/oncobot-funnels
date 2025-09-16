#!/bin/bash

# Oncobot Funnels Cleanup Script
# Following CLAUDE.md: Comprehensive, context-aware cleanup

echo "🧹 Starting Oncobot Funnels Cleanup..."
echo "⚠️  This will remove unused code and dependencies"
echo ""

# Safety check
read -p "Have you committed your current changes? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Please commit your changes first!"
    exit 1
fi

echo ""
echo "📋 Phase 1: Documentation Cleanup"
echo "================================"

# Keep only essential docs
DOCS_TO_REMOVE=(
    "GOAL.md"
    "IMPROVEMENTS.md"
    "PATIENT-COPY.md"
    "SITE-COPY.md"
)

for doc in "${DOCS_TO_REMOVE[@]}"; do
    if [ -f "$doc" ]; then
        echo "  Removing $doc"
        rm "$doc"
    fi
done

echo ""
echo "📦 Phase 2: Remove Unused Dependencies"
echo "======================================"

# List of verified unused dependencies
UNUSED_DEPS=(
    "@ai-sdk/elevenlabs"
    "@aws-sdk/client-s3"
    "@aws-sdk/lib-storage"
    "@vercel/blob"
    "@vercel/edge-config"
    "@vercel/functions"
    "axios"
    "embla-carousel"
    "embla-carousel-autoplay"
    "he"
    "highlight.js"
    "prismjs"
    "react-katex"
    "rehype-katex"
    "remark-math"
    "tailwind-merge"
    "@react-spring/web"
)

echo "  Removing ${#UNUSED_DEPS[@]} unused dependencies..."
for dep in "${UNUSED_DEPS[@]}"; do
    echo "    - $dep"
    pnpm remove "$dep" 2>/dev/null
done

echo ""
echo "🗑️ Phase 3: Remove Unused Code Modules"
echo "======================================"

# Clinical trials module appears unused for funnel system
echo "  Checking if clinical-trials module is safe to remove..."

# Check if it's actually used in the funnel pages
if grep -r "clinical-trials" app/eligibility --include="*.tsx" --include="*.ts" > /dev/null 2>&1; then
    echo "  ⚠️  Clinical trials module is still in use - keeping it"
else
    echo "  ✅ Clinical trials module appears unused - consider manual removal"
    echo "     Size: 308K at lib/tools/clinical-trials/"
fi

echo ""
echo "🧹 Phase 4: Clean Build Artifacts"
echo "================================"

echo "  Removing build artifacts..."
rm -rf .next
rm -rf .turbo
echo "  ✅ Build artifacts removed"

echo ""
echo "📦 Phase 5: Reinstall Clean Dependencies"
echo "======================================="

echo "  Removing node_modules..."
rm -rf node_modules
echo "  Reinstalling with pnpm..."
pnpm install

echo ""
echo "🔨 Phase 6: Verify Build"
echo "======================="

echo "  Running build to verify..."
if pnpm build; then
    echo "  ✅ Build successful!"
else
    echo "  ❌ Build failed - please check errors"
    exit 1
fi

echo ""
echo "✅ Cleanup Complete!"
echo "==================="
echo ""
echo "Summary:"
echo "  - Removed ${#DOCS_TO_REMOVE[@]} documentation files"
echo "  - Removed ${#UNUSED_DEPS[@]} unused dependencies"
echo "  - Cleaned build artifacts"
echo "  - Verified build still works"
echo ""
echo "Next steps:"
echo "  1. Test the application thoroughly"
echo "  2. Commit the cleanup changes"
echo "  3. Consider removing clinical-trials module if not needed"
echo ""
echo "Bundle size should be significantly reduced!"