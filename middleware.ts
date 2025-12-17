import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedRoutes = ['/dashboard', '/bookings', '/messages', '/finance', '/admin', '/profile', '/settings', '/notifications'];
const authRoutes = ['/auth/login', '/auth/register'];

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('accessToken')?.value;
    const { pathname } = request.nextUrl;

    // Debug logging (remove in production)
    console.log(`[Middleware] Path: ${pathname}, Token exists: ${!!token}`);

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // 1. Gestion des routes protégées
    if (isProtectedRoute) {
        if (!token) {
            console.log('[Middleware] No token, redirecting to login');
            return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        try {
            // Vérification cryptographique du token (Edge runtime compatible)
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_dev_secret');
            await jwtVerify(token, secret);
            console.log('[Middleware] Token valid, proceeding');
            return NextResponse.next();
        } catch (error) {
            // Token invalide ou expiré
            console.log('[Middleware] Token invalid, clearing and redirecting');
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            response.cookies.delete('accessToken');
            return response;
        }
    }

    // 2. Redirection si déjà connecté
    if (isAuthRoute && token) {
        try {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_dev_secret');
            await jwtVerify(token, secret);
            console.log('[Middleware] Already authenticated, redirecting to profile');
            return NextResponse.redirect(new URL('/profile', request.url));
        } catch (error) {
            // Si token invalide sur page login, on laisse passer
            console.log('[Middleware] Invalid token on auth page, allowing access');
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
