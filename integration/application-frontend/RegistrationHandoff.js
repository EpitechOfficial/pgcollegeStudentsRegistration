const registrationUrl = import.meta.env.VITE_REGISTRATION_PORTAL_URL || (import.meta.env.DEV
    ? 'http://localhost:5174/'
    : 'https://app.pgcollege.ui.edu.ng/newregistrationportal/');

export function openRegistrationPortal(token) {
    const destination = new URL(registrationUrl);
    if (destination.protocol !== 'https:' && !(destination.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(destination.hostname))) {
        return Promise.reject(new Error('The registration portal must use HTTPS.'));
    }
    if (typeof token !== 'string' || !token.trim()) return Promise.reject(new Error('Please sign in again.'));
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, '0')).join('');
    destination.pathname = `${destination.pathname.replace(/\/$/, '')}/auth/handoff`;
    destination.search = '';
    destination.hash = `handoff=${nonce}`;
    return new Promise((resolve, reject) => {
        let frame;
        let sent = false;
        let timeout;

        const finish = (error) => {
            window.removeEventListener('message', receive);
            clearTimeout(timeout);
            frame?.remove();
            token = '';
            if (error) reject(error); else resolve();
        };
        const receive = event => {
            if (!frame || event.source !== frame.contentWindow || event.origin !== destination.origin || event.data?.nonce !== nonce) return;
            if (event.data?.type === 'pgc:registration-ready' && !sent) {
                sent = true;
                frame.contentWindow.postMessage({ type: 'pgc:registration-token', nonce, token }, destination.origin);
            } else if (sent && event.data?.type === 'pgc:registration-complete') {
                sessionStorage.removeItem('userDetails');
                localStorage.removeItem('userDetails');
                finish();
                const dashboard = new URL(registrationUrl);
                dashboard.pathname = dashboard.pathname.replace(/\/$/, '') + '/dashboard';
                dashboard.search = ''; dashboard.hash = '';
                window.location.replace(dashboard.href);
            } else if (sent && event.data?.type === 'pgc:registration-failed') {
                finish(new Error(typeof event.data.message === 'string' ? event.data.message : 'The registration portal could not verify your session. Please sign in again.'));
            }
        };
        window.addEventListener('message', receive);
        frame = document.createElement('iframe');
        frame.hidden = true;
        frame.title = 'Connecting to registration portal';
        frame.src = destination.href;
        frame.referrerPolicy = 'no-referrer';
        document.body.appendChild(frame);
        timeout = setTimeout(() => finish(new Error('Unable to connect to the registration portal. Please try again.')), 60000);
    });
}
