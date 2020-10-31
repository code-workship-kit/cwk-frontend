import path from 'path';
import fs from 'fs';

export function missingIndexHtmlPlugin(dir, target, mode) {
  return {
    name: 'missing-index-html-plugin',
    serve(ctx) {
      let rewrittenBody = ctx.body;

      if (ctx.path.endsWith('/index.html') || ctx.path.endsWith('/')) {
        const normalizedPath = ctx.path.endsWith('/') ? `${ctx.path}index.html` : ctx.path;

        // Case 1: root index.html
        if (
          (dir.split(process.cwd())[1] === path.dirname(normalizedPath) ||
            path.dirname(normalizedPath) === '/') &&
          !fs.existsSync(path.resolve(dir, 'index.html'))
        ) {
          rewrittenBody = `
            <head>
              <style>
                html, body {
                  padding: 0;
                  margin: 0;
                }
              </style>
            </head>
            <body></body>
          `;
        } else if (
          // Case 2: participant root index.html
          path.resolve(dir.split(process.cwd())[1], 'participants') ===
          path.dirname(path.dirname(normalizedPath))
        ) {
          const participantFolder = path.basename(path.dirname(normalizedPath));

          /**
           * For basic frontend with iframes, don't insert anything.
           *
           * Also don't insert anything if the file already exists
           * Checking for 404 status won't work, as this plugin is ran before static file middleware
           */
          if (
            !(target === 'frontend' && mode === 'iframe') &&
            !fs.existsSync(path.resolve(dir, 'participants', participantFolder, 'index.html'))
          ) {
            rewrittenBody = `
              <head>
                <style>
                  html, body {
                    margin: 0;
                    padding: 0;
                  }
                </style>
              </head>
              <body>
                <script type="module">
                  import { setCapsule } from 'code-workshop-kit/dist/components/setCapsule.js';
                  setCapsule('${participantFolder}', { target: '${target}' });
                </script>
              </body>
            `;
          }
        }
      }
      return rewrittenBody;
    },
  };
}