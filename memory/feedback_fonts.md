---
name: Font stack preference
description: Use Poppins only — ignore Syne and DM Sans even if specs mention them
type: feedback
---

Always use Poppins tokens from lib/theme.ts (`fontDisplay`, `fontBody`, `fontBodyMedium`, `fontBodySemiBold`). Ignore any mention of Syne or DM Sans in prompts or design specs.

**Why:** CLAUDE.md defines Poppins as the only font family. User confirmed to ignore Syne/DM Sans for all future work.

**How to apply:** When a spec says "Syne Bold", use `fontDisplay` (Poppins_800ExtraBold). When it says "DM Sans", use `fontBody` (Poppins_400Regular). Never install or reference other font families.
