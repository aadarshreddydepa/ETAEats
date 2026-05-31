// Soft Luxury Operating System — Typography Tokens
// Editorial + product tone. Satoshi primary, General Sans / Neue Montreal / Inter fallbacks.

export const fontStack = {
  sans:    "'Lora', Georgia, ui-serif, serif",
  display: "'Lora', Georgia, ui-serif, serif",
  mono:    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const

export const typography = {
  fontFamily: {
    sans: ['Lora', 'Georgia', 'ui-serif', 'serif'],
  },

  // Editorial display — hero moments only
  displayXL: { fontSize: '56px', lineHeight: '60px', fontWeight: 600, letterSpacing: '-0.035em' },
  displayL:  { fontSize: '44px', lineHeight: '50px', fontWeight: 600, letterSpacing: '-0.03em'  },

  // Headings
  h1: { fontSize: '32px', lineHeight: '38px', fontWeight: 600, letterSpacing: '-0.022em' },
  h2: { fontSize: '24px', lineHeight: '30px', fontWeight: 600, letterSpacing: '-0.018em' },
  h3: { fontSize: '20px', lineHeight: '26px', fontWeight: 600, letterSpacing: '-0.012em' },
  h4: { fontSize: '17px', lineHeight: '24px', fontWeight: 600, letterSpacing: '-0.008em' },

  // Body
  bodyLg: { fontSize: '17px', lineHeight: '26px', fontWeight: 450, letterSpacing: '-0.003em' },
  body:   { fontSize: '15px', lineHeight: '22px', fontWeight: 450, letterSpacing: '0em'      },
  bodySm: { fontSize: '13px', lineHeight: '20px', fontWeight: 450, letterSpacing: '0.002em'  },

  // Utility
  caption: { fontSize: '12px', lineHeight: '16px', fontWeight: 500, letterSpacing: '0.005em' },
  label:   { fontSize: '11px', lineHeight: '14px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const },
  button:  { fontSize: '15px', lineHeight: '20px', fontWeight: 600, letterSpacing: '-0.005em' },
  mono:    { fontSize: '13px', lineHeight: '18px', fontWeight: 500, letterSpacing: '0em' },
} as const

export type Typography = typeof typography
