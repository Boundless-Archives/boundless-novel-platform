import { NextResponse, type NextRequest } from "next/server";

/*
 * Passes the current path along as a request header so the root layout
 * (a server component, which can't see the URL) can tell which page is
 * being shown. The maintenance screen uses it to leave the sign-in pages
 * reachable, so an admin can still get in.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff2?)$).*)",
  ],
};
