import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        bg:        'var(--bg)',
        surface:   'var(--surface)',
        surface2:  'var(--surface-2)',
        sunk:      'var(--surface-sunk)',

        // Primary (black CTA)
        primary:       'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-soft': 'var(--primary-soft)',
        'primary-dark': 'var(--primary-dark)',

        // Accents
        accent: {
          'powder-blue': 'var(--accent-powder-blue)',
          'soft-cream':  'var(--accent-soft-cream)',
          peach:         'var(--accent-peach)',
          'muted-mint':  'var(--accent-muted-mint)',
        },
        'accent-ink': {
          'powder-blue': 'var(--accent-powder-blue-ink)',
          'soft-cream':  'var(--accent-soft-cream-ink)',
          peach:         'var(--accent-peach-ink)',
          'muted-mint':  'var(--accent-muted-mint-ink)',
        },

        // Neutrals
        gray: {
          50:  'var(--gray-50)',
          100: 'var(--gray-100)',
          150: 'var(--gray-150)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
        },

        // Borders
        border:          'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',

        // Text
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary':  'var(--text-tertiary)',
        'text-muted':     'var(--text-muted)',
        'text-disabled':  'var(--text-disabled)',
        'text-on-dark':   'var(--text-on-dark)',

        // Semantic
        success:          'var(--success)',
        'success-bg':     'var(--success-bg)',
        'success-border': 'var(--success-border)',
        warning:          'var(--warning)',
        'warning-bg':     'var(--warning-bg)',
        'warning-border': 'var(--warning-border)',
        error:            'var(--error)',
        'error-bg':       'var(--error-bg)',
        'error-border':   'var(--error-border)',
        info:             'var(--info)',
        'info-bg':        'var(--info-bg)',
        'info-border':    'var(--info-border)',
      },
      borderRadius: {
        xs:   'var(--radius-xs)',
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        card: 'var(--radius-card)',
        hero: 'var(--radius-hero)',
        pill: 'var(--radius-pill)',
      },
      fontFamily: {
        sans:    ['var(--font-lora)', 'Lora', 'Georgia', 'ui-serif', 'serif'],
        display: ['var(--font-lora)', 'Lora', 'Georgia', 'ui-serif', 'serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['56px', { lineHeight: '60px', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-l':  ['44px', { lineHeight: '50px', letterSpacing: '-0.03em',  fontWeight: '600' }],
        'h1':         ['32px', { lineHeight: '38px', letterSpacing: '-0.022em', fontWeight: '600' }],
        'h2':         ['24px', { lineHeight: '30px', letterSpacing: '-0.018em', fontWeight: '600' }],
        'h3':         ['20px', { lineHeight: '26px', letterSpacing: '-0.012em', fontWeight: '600' }],
        'h4':         ['17px', { lineHeight: '24px', letterSpacing: '-0.008em', fontWeight: '600' }],
        'body-lg':    ['17px', { lineHeight: '26px', letterSpacing: '-0.003em' }],
        'body':       ['15px', { lineHeight: '22px', letterSpacing: '0em'      }],
        'body-sm':    ['13px', { lineHeight: '20px', letterSpacing: '0.002em'  }],
        'caption':    ['12px', { lineHeight: '16px', letterSpacing: '0.005em'  }],
        'label':      ['11px', { lineHeight: '14px', letterSpacing: '0.1em',  fontWeight: '600' }],
        'button':     ['15px', { lineHeight: '20px', letterSpacing: '-0.005em', fontWeight: '600' }],
      },
      spacing: {
        0.5: '2px',
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        7:  '28px',
        8:  '32px',
        9:  '36px',
        10: '40px',
        11: '44px',
        12: '48px',
        13: '52px',
        14: '56px',
        16: '64px',
        20: '80px',
        24: '96px',
      },
      boxShadow: {
        e0:    'none',
        e1:    'var(--shadow-e1)',
        e2:    'var(--shadow-e2)',
        e3:    'var(--shadow-e3)',
        cta:   'var(--shadow-cta)',
        modal: 'var(--shadow-modal)',
        nav:   'var(--shadow-nav)',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        enter:    'cubic-bezier(0.16, 1, 0.3, 1)',
        exit:     'cubic-bezier(0.7, 0, 0.84, 0)',
      },
      transitionDuration: {
        fast: '140ms',
        base: '220ms',
        slow: '320ms',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        fadeUp:  'fadeUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}

export default config
