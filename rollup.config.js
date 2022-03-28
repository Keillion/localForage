import { terser } from 'rollup-plugin-terser';
import fs from 'fs/promises';

// https://rollupjs.org/guide/en/#configuration-files
export default async(commandLineArgs)=>{

  await fs.rm('./dist', { recursive: true, force: true });

  const terser_format = { 
    comments: function(node, comment){
      const text = comment.value;
      const type = comment.type;
      if (type == "comment2") {
        // multiline comment
        return false;
      }
    },  
  };
  // https://stackoverflow.com/questions/57360588/how-to-use-terser-with-webpack
  const plugin_terser_esnext = terser({ ecma: 6, format: terser_format }); // 8
  
  return [
    {
      input: "src/localforage.js",
      output: [
        // klocalforage.mjs
        // for rollup/webpack to compile together with other
        // or use in <script type="module">
        {
          file: "dist/klocalforage.mjs",
          format: "es",
          exports: "default",
          sourcemap: true,
          plugins: [
            { 
              // klocalforage.esm.js
              // for rollup/webpack to compile together with other, target browser
              // same as mjs, webpack 4 don't know mjs, so current we still set esm.js as package.json->browser

              // https://rollupjs.org/guide/en/#writebundle
              async writeBundle(options, bundle){
                await fs.copyFile('./dist/klocalforage.mjs', './dist/klocalforage.esm.js')
              }
            },
          ],
        },
        // klocalforage.min.mjs
        {
          file: "dist/klocalforage.min.mjs",
          format: "es",
          exports: "default",
          sourcemap: true,
          plugins: [
            plugin_terser_esnext,
            { 
              // klocalforage.esm.js
              // for rollup/webpack to compile together with other, target browser
              // same as mjs, webpack 4 don't know mjs, so current we still set esm.js as package.json->browser

              // https://rollupjs.org/guide/en/#writebundle
              async writeBundle(options, bundle){
                await fs.copyFile('./dist/klocalforage.min.mjs', './dist/klocalforage.esm.min.js')
              }
            },
          ],
        },
        // klocalforage.js
        // usage
        // <script src="klocalforage.js"
        {
          file: "dist/klocalforage.js",
          format: "umd",
          name: "KLocalforage",
          exports: "default",
          sourcemap: true,
        },
        // klocalforage.min.js
        {
          file: "dist/klocalforage.min.js",
          format: "umd",
          name: "KLocalforage",
          exports: "default",
          sourcemap: true,
          plugins: [
            plugin_terser_esnext,
          ],
        },
      ],
    },
  ]
};