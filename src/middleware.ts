import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
    const isProtectedRoute =
        req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/goals") ||
        req.nextUrl.pathname.startsWith("/suggestions") ||
        req.nextUrl.pathname.startsWith("/profile") ||
        req.nextUrl.pathname.startsWith("/onboarding") ||
        req.nextUrl.pathname.startsWith("/schedule") ||
        req.nextUrl.pathname.startsWith("/wellness") ||
        req.nextUrl.pathname.startsWith("/analytics") ||
        req.nextUrl.pathname.startsWith("/automations") ||
        req.nextUrl.pathname.startsWith("/products")

    if (isProtectedRoute && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
