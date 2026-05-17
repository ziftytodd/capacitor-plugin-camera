export default {
  input: 'dist/esm/index.js',
  output: [
    {
      file: 'dist/plugin.js',
      format: 'iife',
      name: 'capacitorCameraPreview',
      globals: {
        '@capacitor/core': 'capacitorExports',
        'dynamsoft-camera-enhancer': 'dynamsoftCameraEnhancer',
        recordrtc: 'RecordRTC',
      },
      sourcemap: true,
      inlineDynamicImports: true,
    },
    {
      file: 'dist/plugin.cjs.js',
      format: 'cjs',
      sourcemap: true,
      inlineDynamicImports: true,
    },
  ],
  external: ['@capacitor/core', 'dynamsoft-camera-enhancer', 'recordrtc'],
};
