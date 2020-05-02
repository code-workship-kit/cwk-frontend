import commandLineArgs from 'command-line-args';
import fs from 'fs';
import glob from 'glob';
import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const { commandLineOptions, readCommandLineArgs } = require('es-dev-server');
const { readFileFromPath, writeFileToPathOnDisk } = require('@open-wc/create/dist/core.js');

// Fork from @open-wc/create to allow functions that return strings inside data obj
function processTemplate(_fileContent, data = {}) {
  let fileContent = _fileContent;

  Object.keys(data).forEach(key => {
    let replacement = data[key];
    if (typeof data[key] === 'function') {
      replacement = data[key]();
    }
    fileContent = fileContent.replace(new RegExp(`<%= ${key} %>`, 'g'), replacement);
  });
  return fileContent;
}

// Fork from @open-wc/create
// TODO: Use open-wc directly when https://github.com/open-wc/open-wc/pull/1469 is merged
function copyTemplates(fromGlob, toDir = process.cwd(), data = {}) {
  return new Promise(resolve => {
    glob(fromGlob, { dot: true }, (er, files) => {
      const resultFiles = [];
      files.forEach(filePath => {
        if (!fs.lstatSync(filePath).isDirectory()) {
          const fileContent = readFileFromPath(filePath);
          if (fileContent !== false) {
            const processed = processTemplate(fileContent, data);

            // find path write to (force / also on windows)
            const replace = path.join(fromGlob.replace(/\*/g, '')).replace(/\\(?! )/g, '/');
            const toPath = filePath.replace(replace, `${toDir}/`);

            // write file to path?
            resultFiles.push({ toPath, processed });
          }
        }
      });
      resolve(resultFiles);
    });
  });
}

export const scaffold = async opts => {
  const { workshop } = await import(path.resolve(process.cwd(), `.${opts.rootDir}/workshop.js`));
  const { participants, templateData } = workshop;

  participants.forEach(name => {
    copyTemplates(
      path.resolve(process.cwd(), `.${opts.rootDir}/template/**/*`),
      path.resolve(process.cwd(), `.${opts.rootDir}/participants/${name}`),
      {
        participantName: name,
        ...templateData,
      },
    ).then(files => {
      files.forEach(file => {
        writeFileToPathOnDisk(file.toPath, file.processed, {
          override: opts.force,
          ask: false,
        });
      });
    });
  });
};

export const scaffoldFiles = (opts = {}) => {
  let scaffoldConfig = {
    rootDir: '/',
    force: false,
    ...opts,
  };

  if (opts.argv) {
    const scaffoldDefinitions = [
      ...commandLineOptions,
      {
        name: 'force',
        alias: 'f',
        type: Boolean,
        description:
          'If set, it will (re-)scaffold for the participants and overwrite the current files without warning',
      },
    ];

    scaffoldConfig = {
      ...scaffoldConfig,
      ...commandLineArgs(scaffoldDefinitions, { argv: opts.argv }),
      ...readCommandLineArgs(opts.argv),
    };

    scaffoldConfig.rootDir = path.resolve('/', scaffoldConfig.rootDir);
  }

  scaffold(scaffoldConfig);
};
