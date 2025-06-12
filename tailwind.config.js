// ...existing config...

module.exports = {
  // ...existing config...
  theme: {
    extend: {
      // ...existing extends...
      animation: {
        'ping-slow': 'ping-large 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'ping-large': {
          '0%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '100%': {
            transform: 'scale(3)',
            opacity: '0',
          },
        },
      },
    },
  },
  // ...rest of config...
}