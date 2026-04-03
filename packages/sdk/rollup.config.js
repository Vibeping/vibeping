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
      name: 'VibePing',
      sourcemap: true,
    },
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json', declaration: false }),
    terser(),
  ],
  external: ['web-vitals'],
};
