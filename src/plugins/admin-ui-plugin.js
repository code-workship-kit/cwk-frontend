import { verifyJWT } from '../utils/verifyJWT.js';

export function adminUIPlugin(dir) {
  return {
    transform(context) {
      let rewrittenBody = context.body;
      const authToken = context.cookies.get('cwk_auth_token');
      const authed = verifyJWT(dir, authToken, context);
      if (
        context.path === '/node_modules/code-workshop-kit/dist/components/AdminSidebar.js' &&
        !authed
      ) {
        rewrittenBody = '';
      }
      return { body: rewrittenBody, transformCache: false };
    },
  };
}
