import { resolve } from 'path';

export default {
  base: './', // Use relative paths for assets
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        heronfountain: resolve(__dirname, 'heronfountain.html'),
      },
      output: {
        // Ensure consistent naming for debugging and AI access
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  resolve: {
    alias: {
      // Ensure consistent path resolution for Three.js modules
      '@': resolve(__dirname, 'src')
    }
  }
};

