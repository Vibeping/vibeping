import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/vibeping.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/vibeping.umd.js',
      format: 'umd',
      name: 'vibeping',
      sourcemap: true,
      globals: {
        'web-vitals': 'webVitals',
      },
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      sourceMap: true,
    }),
    terser({
      compress: {
        passes: 2,
        pure_getters: true,
      },
      format: {
        comments: false,
      },
    }),
  ],
  external: ['web-vitals'],
};
