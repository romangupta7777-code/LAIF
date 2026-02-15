"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { initMixpanel, identify, trackPageView } from "@/lib/analytics"

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession()
    const pathname = usePathname()

    useEffect(() => {
        initMixpanel()
    }, [])

    useEffect(() => {
        if (session?.user?.id) {
            identify(session.user.id, {
                name: session.user.name || "",
                email: session.user.email || "",
            })
        }
    }, [session])

    useEffect(() => {
        if (pathname) {
            trackPageView(pathname)
        }
    }, [pathname])

    return <>{children}</>
}
