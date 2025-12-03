export function isTokenExpired(token: string): boolean {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )

        const { exp } = JSON.parse(jsonPayload)

        if (!exp) return false

        // Check if token is expired (with 10s buffer)
        return Date.now() >= exp * 1000 - 10000
    } catch (error) {
        return true // Treat invalid tokens as expired
    }
}
