// const registrationUrl = import.meta.env.VITE_REGISTRATION_PORTAL_URL || (import.meta.env.DEV
//     ? 'http://localhost:5174/'
//     : 'https://pgcollege-students-registration.vercel.app/');
const registrationUrl = 'https://pgcollege-students-registration.vercel.app/';

export function openRegistrationPortal(token) {
    const destination = new URL(registrationUrl);
    if (destination.protocol !== 'https:' && !(destination.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(destination.hostname))) {
        return Promise.reject(new Error('The registration portal must use HTTPS.'));
    }
    if (typeof token !== 'string' || !token.trim()) return Promise.reject(new Error('Please sign in again.'));
    destination.pathname = `${destination.pathname.replace(/\/$/, '')}/auth/handoff`;
    destination.search = '';
    destination.hash = `token=${encodeURIComponent(token.trim())}`;
    window.location.replace(destination.href);
    return Promise.resolve();
}
