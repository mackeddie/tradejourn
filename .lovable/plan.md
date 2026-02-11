

## Fix Win/Loss Distribution Chart Colors

**Problem:** The Win/Loss Distribution pie chart shows all segments in black because the CSS variables `--chart-profit` and `--chart-loss` referenced in the code don't exist. The Tailwind config maps `chart.profit` to `--success` and `chart.loss` to `--destructive`, but the inline `hsl(var(--chart-profit))` calls resolve to nothing (rendering as black).

**Solution:** Add `--chart-profit` and `--chart-loss` CSS custom properties to `src/index.css` in both light and dark themes, pointing them to the correct color values.

### Changes

**1. `src/index.css`** - Add missing CSS variables

In the `:root` block, add:
- `--chart-profit: 145 70% 45%;` (same as `--success`, green)
- `--chart-loss: 0 85% 60%;` (same as `--destructive`, red)

In the `.dark` block, add:
- `--chart-profit: 145 65% 50%;` (same as dark `--success`, green)
- `--chart-loss: 0 75% 55%;` (same as dark `--destructive`, red)

This will make:
- **Wins = Green**
- **Losses = Red**
- **Breakeven = Gray** (already works via `--muted-foreground`)

No other file changes needed -- the `Analytics.tsx` COLORS array already references these variables correctly.

