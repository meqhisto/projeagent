import { auth } from "./auth.config";
import { NextResponse } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');
    const isPublicPage = req.nextUrl.pathname.startsWith('/public') || req.nextUrl.pathname.startsWith('/test-ui');
    const isApiAuth_or_Webhooks = req.nextUrl.pathname.startsWith('/api/auth') || req.nextUrl.pathname.startsWith('/api/webhooks');

    // Allow static files and next internals
    if (req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.includes('.')) {
        return;
    }

    // Allow API auth routes
    if (isApiAuth_or_Webhooks) {
        return;
    }

    // Redirect unauthenticated users to login
    if (!isLoggedIn && !isAuthPage && !isPublicPage) {
        let callbackUrl = req.nextUrl.pathname;
        if (req.nextUrl.search) {
            callbackUrl += req.nextUrl.search;
        }
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl));
    }

    // Redirect authenticated users away from login page
    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL('/', req.nextUrl));
    }

    return;
});

export const config = {
    matcher: ['/((?!api/auth|api/webhooks|_next/static|_next/image|favicon.ico).*)'],
};
