export default {
  entry: 'src/index.ts',
  esm: {
    type: 'rollup',
    minify: false
  },
  cjs: {
    type: 'rollup',
    minify: false
  },
  umd: {
    name: 'BrowserSafeEval',
    minFile: false
  }
}