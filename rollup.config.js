import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import scss from 'rollup-plugin-scss';

export default {
  input: 'src/module.ts',
  output: {
    file: 'dist/module.js',
    format: 'es',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    resolve(),
    typescript(),
    scss({
      fileName: 'styles/seasons-and-stars.css',
      outputStyle: 'compressed',
      watch: 'src/styles',
      verbose: false, // Reduce log noise
    }),
    copy({
      targets: [
        { src: 'module.json', dest: 'dist' },
        { src: 'languages', dest: 'dist' },
        { src: 'calendars', dest: 'dist' },
        { src: 'templates', dest: 'dist' },
        { src: 'README.md', dest: 'dist' },
        { src: 'CHANGELOG.md', dest: 'dist' },
        { src: 'LICENSE', dest: 'dist' },
      ],
    }),
  ],
};
