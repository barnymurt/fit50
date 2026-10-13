/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 3 — the content engine editor imports Phase 1's
  // renderer templates (tools/content-engine/src/templates/...)
  // from a client component. Those templates are .tsx but use
  // .js extensions in their imports (ESM convention) because
  // tsx resolves .js → .ts when running scripts. Webpack
  // doesn't, so we teach it to.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias || {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    // The animate API route dynamically imports
    // @/ce-content-engine/animate, which transitively imports
    // render-slide.ts and react-dom/server. The dynamic import
    // is server-only at runtime but webpack's static check still
    // walks the import graph. The graph is sound — the route
    // is never reached from the client. Suppress the check.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /render-slide\.ts$/, message: /react-dom\/server/ },
    ];
    return config;
  },
};

export default nextConfig;
