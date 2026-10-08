// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
    output: "server", // on-demand server rendering
    adapter: node({
        mode: 'standalone' // self-contained HTTP server, listening on a port apparently
    })
});