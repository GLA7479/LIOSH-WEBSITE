/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // זמנית - כדי למנוע רענון אינסופי בפיתוח
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        // keep watch ignores as simple string globs to satisfy webpack schema
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/.cursor/**",
        ],
      };
      /**
       * React Fast Refresh נשען על שינויי רנטיים בזמן ריצה.
       * השבתת הפלאגין: אין Fast Refresh, אבל שמירת קבצים עדיין מרעננת את הדף (רענון מלא).
       * ראה: https://nextjs.org/docs/messages/fast-refresh-reload
       */
      if (!isServer && Array.isArray(config.plugins)) {
        config.plugins = config.plugins.filter((p) => {
          const n = p?.constructor?.name || "";
          return n !== "ReactRefreshWebpackPlugin";
        });
      }
    }
    return config;
  },
  // PWA support
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
