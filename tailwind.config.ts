import type { Config } from 'tailwindcss'

const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`

const config: Config = {
    content: [
        './src/**/*.{ts,tsx}',
        './dev/**/*.{html,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Role ramp — consumer (host) sets values via data-role on <html>.
                // Satellite dev sandbox mirrors the current host values in dev/tailwind.css.
                theme: {
                    50:  withAlpha('--theme-50'),
                    100: withAlpha('--theme-100'),
                    200: withAlpha('--theme-200'),
                    300: withAlpha('--theme-300'),
                    400: withAlpha('--theme-400'),
                    500: withAlpha('--theme-500'),
                    600: withAlpha('--theme-600'),
                    700: withAlpha('--theme-700'),
                    800: withAlpha('--theme-800'),
                    900: withAlpha('--theme-900'),
                    950: withAlpha('--theme-950'),
                },
                // Surface ladder (elevation) — slate ramp in the host.
                surface: {
                    0: withAlpha('--surface-0'),
                    1: withAlpha('--surface-1'),
                    2: withAlpha('--surface-2'),
                    3: withAlpha('--surface-3'),
                    4: withAlpha('--surface-4'),
                },
                // Text/ink hierarchy.
                ink: {
                    primary:   withAlpha('--text-primary'),
                    secondary: withAlpha('--text-secondary'),
                    tertiary:  withAlpha('--text-tertiary'),
                    inverse:   withAlpha('--text-inverse'),
                    disabled:  withAlpha('--text-disabled'),
                },
                // Border/edge tones.
                edge: {
                    subtle: withAlpha('--border-subtle'),
                    strong: withAlpha('--border-strong'),
                    focus:  withAlpha('--border-focus'),
                },
                // Brand tokens — occasionally referenced by table accents.
                brand: {
                    DEFAULT:  withAlpha('--brand'),
                    hover:    withAlpha('--brand-hover'),
                    muted:    withAlpha('--brand-muted'),
                    contrast: withAlpha('--brand-contrast'),
                    glow:     withAlpha('--brand-glow'),
                },
                // Semantic status tokens — same mapping as @edictus/ui.
                status: {
                    ok:                 withAlpha('--status-ok'),
                    'ok-muted':         withAlpha('--status-ok-muted'),
                    'ok-contrast':      withAlpha('--status-ok-contrast'),
                    warn:               withAlpha('--status-warn'),
                    'warn-muted':       withAlpha('--status-warn-muted'),
                    'warn-contrast':    withAlpha('--status-warn-contrast'),
                    late:               withAlpha('--status-late'),
                    'late-muted':       withAlpha('--status-late-muted'),
                    'late-contrast':    withAlpha('--status-late-contrast'),
                    pending:            withAlpha('--status-pending'),
                    'pending-muted':    withAlpha('--status-pending-muted'),
                    'pending-contrast': withAlpha('--status-pending-contrast'),
                    info:               withAlpha('--status-info'),
                    'info-muted':       withAlpha('--status-info-muted'),
                    'info-contrast':    withAlpha('--status-info-contrast'),
                },
            },
        },
    },
    plugins: [],
}

export default config
