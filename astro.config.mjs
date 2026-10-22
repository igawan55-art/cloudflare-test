// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { SITE_URL } from './src/lib/siteConfig.js';

const isBuildOrPreview =
    process.argv.includes('build') ||
    process.argv.includes('preview') ||
    Boolean(process.env.CF_PAGES);

// https://astro.build/config
export default defineConfig({
    site: SITE_URL,
    output: 'server',
    session: {
        driver: 'memory',
    },
    adapter: isBuildOrPreview
        ? cloudflare({
              imageService: 'passthrough',
              prerenderEnvironment: 'node',
          })
        : undefined,
});
