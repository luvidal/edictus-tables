// Mobile detection hook — inlined from the host's context/device.ts

import { useState, useEffect } from 'react'

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const mql = window.matchMedia('(max-width: 639px)')
        setIsMobile(mql.matches)
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    return isMobile
}
