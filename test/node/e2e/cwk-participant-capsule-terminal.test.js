import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { startServer } from '../../../src/start-server.js';
import { aTimeout } from '../../utils/helpers.js';

const hostPort = 5000;
const host = `http://localhost:${hostPort}/`;
const testTimeout = 20000;
const baseCfg = {
  port: hostPort,
  logStartup: false,
  open: false,
};

describe('e2e: Participant Capsule Terminal', () => {
  context('', () => {
    let server;
    let wss;
    let watcher;
    let browser;

    beforeEach(async () => {});

    afterEach(async () => {
      // This may or may not alleviate premature close in CI?
      await aTimeout(100);
      if (browser) {
        await browser.close();
      }
      if (wss) {
        wss.close();
      }
      if (watcher) {
        watcher.close();
      }
      if (server) {
        await new Promise(resolve => {
          server.close(resolve);
        });
      }
    });

    it('creates cwk-participant-capsule-terminal instead of frontend for terminal target', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/terminal-node',
        target: 'terminal',
        targetOptions: {
          cmd: 'node index.js',
        },
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(`${host}test/utils/fixtures/terminal-node/participants/Joren/index.html`);

      const { capsuleTagName } = await page.evaluate(() => {
        return { capsuleTagName: document.body.lastElementChild.tagName.toLowerCase() };
      });

      expect(capsuleTagName).to.equal('cwk-participant-terminal-capsule');
    }).timeout(testTimeout);

    it('delegates terminal output to the capsule output', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/terminal-node',
        target: 'terminal',
        targetOptions: {
          cmd: 'node index.js',
        },
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(`${host}test/utils/fixtures/terminal-node/participants/Joren/index.html`);

      // Give websocket authentication some time
      await aTimeout(10);

      const filePath = path.resolve(
        process.cwd(),
        'test',
        'utils',
        'fixtures',
        'terminal-node',
        'participants',
        'Joren',
        'index.js',
      );
      fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8'));
      await aTimeout(100);

      const { entry } = await page.evaluate(() => {
        return {
          entry: document
            .querySelector('cwk-participant-terminal-capsule')
            .shadowRoot.querySelector('.entry').innerText,
        };
      });

      expect(entry).to.equal('Joren\n');
    }).timeout(testTimeout);

    it('accepts a terminalScript argument which is the script ran as a child process', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/terminal-node',
        target: 'terminal',
        targetOptions: {
          cmd: 'node custom.js',
        },
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(`${host}test/utils/fixtures/terminal-node/participants/Joren/index.html`);

      // Give websocket authentication some time
      await aTimeout(10);

      const filePath = path.resolve(
        process.cwd(),
        'test',
        'utils',
        'fixtures',
        'terminal-node',
        'participants',
        'Joren',
        'custom.js',
      );
      fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8'));
      await aTimeout(100);

      const { entry } = await page.evaluate(() => {
        return {
          entry: document
            .querySelector('cwk-participant-terminal-capsule')
            .shadowRoot.querySelector('.entry').innerText,
        };
      });

      expect(entry).to.equal('Foo\n');
    }).timeout(testTimeout);

    it('delegates capsule input to the terminal input', async () => {
      ({ server, wss, watcher } = await startServer({
        ...baseCfg,
        dir: './test/utils/fixtures/terminal-node',
        target: 'terminal',
        targetOptions: {
          cmd: 'node index.js',
        },
      }));

      browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(`${host}test/utils/fixtures/terminal-node/participants/Felix/index.html`);
      // Give websocket authentication some time
      await aTimeout(10);

      const filePath = path.resolve(
        process.cwd(),
        'test',
        'utils',
        'fixtures',
        'terminal-node',
        'participants',
        'Felix',
        'index.js',
      );
      fs.writeFileSync(filePath, fs.readFileSync(filePath, 'utf8'));

      await aTimeout(100);

      await page.evaluate(() => {
        const input = document
          .querySelector('cwk-participant-terminal-capsule')
          .shadowRoot.getElementById('terminal-input');

        input.value = 'Amsterdam';

        const form = document
          .querySelector('cwk-participant-terminal-capsule')
          .shadowRoot.querySelector('form');

        form.dispatchEvent(new Event('submit'));
      });
      await aTimeout(100);

      const { entries } = await page.evaluate(() => {
        return {
          entries: Array.from(
            document
              .querySelector('cwk-participant-terminal-capsule')
              .shadowRoot.querySelectorAll('.entry'),
          ).map(entry => entry.innerText),
        };
      });

      expect(entries).to.eql([
        'Where do you live?',
        'Amsterdam',
        'You are a citizen of Amsterdam\n',
      ]);
    }).timeout(testTimeout);
  });
});