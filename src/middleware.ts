import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  const email = req.auth.user?.email ?? "";
  if (!email.endsWith("@manacacomunicacao.com.br")) {
    return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url));
  }
});

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|android-chrome-192x192.png|android-chrome-512x512.png|apple-touch-icon.png|favicon-16x16.png|favicon-32x32.png|placeholder.svg).*)",
  ],
};


