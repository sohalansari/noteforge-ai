import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eef6ff',
                    100: '#d9eaff',
                    200: '#bcd9ff',
                    300: '#8ebeff',
                    400: '#5a99ff',
                    500: '#2f74ff',
                    600: '#1a55e0',
                    700: '#1644b5',
                    800: '#163c8f',
                    900: '#173571',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
            },
            boxShadow: {
                card: '0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
            },
        },
    },
    plugins: [],
} satisfies Config;