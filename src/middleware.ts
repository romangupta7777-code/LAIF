import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const isLoggedIn = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isProtectedRoute =
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/goals") ||
        req.nextUrl.pathname.startsWith("/suggestions") ||
        req.nextUrl.pathname.startsWith("/profile") ||
        req.nextUrl.pathname.startsWith("/products")

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
