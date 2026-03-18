// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    // ✅ Skip all /api routes
    if (req.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.next();
    }
    // Your auth logic here...
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};