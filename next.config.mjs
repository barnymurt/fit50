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
    return config;
  },
};

export default nextConfig;
