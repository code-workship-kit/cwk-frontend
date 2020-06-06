import { verifyJWT } from '../utils/verifyJWT.js';

export function followModePlugin(rootDir, wsPort) {
  const scriptsToInsert = () => {
    window.__cwkFollowModeWs = new WebSocket(`ws://localhost:${wsPort}`);

    window.__cwkFollowModeWs.addEventListener('open', () => {
      const allCookies = document.cookie.split(';').map(cookie => {
        if (cookie) {
          return { [cookie.split('=')[0].trim()]: cookie.split('=')[1].trim() };
        }
        return {};
      });
      const participantCookie = allCookies.find(cookie => cookie.participant_name);

      if (participantCookie) {
        window.__cwkFollowModeWs.send(
          JSON.stringify({ type: 'authenticate', username: participantCookie.participant_name }),
        );
      }
    });

    window.__cwkFollowModeWs.addEventListener('message', e => {
      const { type, data } = JSON.parse(e.data);
      if (type === 'update-url') {
        const url = data;
        window.location.href = `${window.location.protocol}//${window.location.host}${url}`;
      }
    });
  };

  return {
    transform(context) {
      let rewrittenBody = context.body;
      const fromIFrame = context.header['sec-fetch-dest'] === 'iframe';
      const authToken = context.cookies.get('cwk_auth_token');
      const authed = verifyJWT(rootDir, authToken);

      // TODO: Admins don't follow, because the person who enabled follow mode is not stored
      // We should check the authed.username vs the one that enabled follow mode
      if (context.status === 200 && context.response.is('html') && !authed && !fromIFrame) {
        const scriptStr = scriptsToInsert.toString();
        const scriptBody = scriptStr
          .substring(scriptStr.indexOf('{') + 1, scriptStr.lastIndexOf('}'))
          .replace(/\${wsPort}/, wsPort);

        rewrittenBody = rewrittenBody.replace(
          '</body>',
          `
              <script>
                ${scriptBody}
              </script>
            </body>
          `,
        );
      }

      return { body: rewrittenBody };
    },
  };
}
