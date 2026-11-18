export const APPLICATION_LOGIN_URL = import.meta.env.VITE_APPLICATION_LOGIN_URL || (import.meta.env.DEV
  ? 'http://localhost:5175/login'
  : 'https://app.pgcollege.ui.edu.ng/applicationfrontend/login')
