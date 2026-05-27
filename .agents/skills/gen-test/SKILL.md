---
name: gen-test
description: Generate tests for a file or module following existing project conventions
disable-model-invocation: true
---

# Generate Tests

Generate unit tests for a given file or module.

## Arguments

The user provides a file path or module name.

## Conventions

- Test framework: `vitest` with `happy-dom` environment
- Test location: `tests/` directory
- File naming: `<module>.test.ts`
- Imports: relative paths (no `@/` alias)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myFunction } from '../src/mymodule'
```

## Workflow

1. Read the target file to understand its exports and behavior
2. Check if a test file already exists — if so, add missing tests rather than rewriting
3. Generate tests covering:
   - Happy path for each export
   - Error cases and edge cases
4. Run the tests with `npm test -- <path>`
5. Fix any failures
