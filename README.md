# Postgraduate Registration Portal

## Backend authentication

Copy `.env.example` to `.env.local` to override the API base URL. The default is:

```env
VITE_API_BASE_URL=https://pgcollege.ui.edu.ng/registrationbackend/public/api
```

The `/api` suffix follows `base_url` in `New Registration Portal API.postman_collection.json`.
Restart Vite after changing environment variables. Production values must be present when building.

- Login: `POST /auth/login` with `{ numeration, password }`. Requires `{ success: true, token, user: { numeration, name, email } }`.
- Protected pages: `GET /auth/user` with `Authorization: Bearer <token>`. Unauthorized sessions are removed. Temporary failures offer Retry.
- Logout: `POST /auth/logout` revokes the token; local session data is cleared immediately, including when offline.
- Remember me stores the token and basic user profile in localStorage for at most 30 days. Otherwise sessionStorage is used. Backend token expiry always takes precedence. Passwords are never stored.
- Demo login: PG123 / pg@123 works during npm run dev without contacting the backend. Production builds disable demo login by default. Set VITE_ENABLE_DEMO_LOGIN=true explicitly for a preview build, or false to disable locally. Legacy sessions without a token remain invalid.
- Configure backend CORS to allow the frontend origin and JSON requests with the Authorization header. No frontend secrets are needed.

Only authentication is integrated in this pass. Dashboard/student documents and other services still use their existing data providers until connected individually. Password recovery uses `POST /auth/forgot-password` under the shared API base URL. `VITE_PASSWORD_RESET_URL` remains an optional endpoint override. Email is required; the optional application number is forwarded as `applicationNumber` (the collection documents email only). The UI shows a generic email confirmation to avoid disclosing account existence. Logout waits up to 10 seconds for token revocation and reports failures after local sign-out.

Validation:

```sh
npm run build
npm run lint
node --test checks/auth-recovery.test.mjs
```

---
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Course registration API

Backend sessions use the configured `VITE_API_BASE_URL` and bearer token for `courses/available`, `courses/registered`, `courses/status`, `courses/register`, `courses/confirm`, and `courses/print`. Course-specific URL environment variables are no longer used.

Saving sends the complete `course_ids` selection. Confirming saves first, then locks registration. Lock Up opens a SweetAlert confirmation with Review Courses, Proceed to Lock, and Cancel. Proceed locks the saved selection directly; unlocking is a Management action. Failed requests display backend messages and never fall back to demo courses. Local preview data is only used for an explicit demo login.

The supplied API documents a current-session print form, not historical form listings. The table uses `locked_date` for its date and maps the returned signatory details; missing passport and signature images are not fabricated. No production minimum-unit rule is assumed because the collection does not provide one.

Run `node --test checks/course-registration.test.mjs` for mocked contract checks against the collection examples.
