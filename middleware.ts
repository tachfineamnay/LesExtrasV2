
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('accessToken')
    const { pathname } = request.nextUrl

    // Protected routes
    const protectedRoutes = ['/wall', '/dashboard', '/profile', '/admin']
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

    // Auth routes (redirect to wall if already logged in)
    const authRoutes = ['/auth/login', '/onboarding']
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    if (isProtectedRoute && !token) {
        const url = new URL('/auth/login', request.url)
        // Optional: Add redirect param to return after login
        // url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
    }

    if (isAuthRoute && token) {
        // Optional: Verify token validity via API if critical, but for middleware speed we usually just check existence
        // For now, if token exists, assume valid and redirect to wall
        return NextResponse.redirect(new URL('/wall', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
