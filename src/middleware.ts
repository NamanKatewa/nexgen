import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const isTokenInvalid = !token || token === "undefined";

  const authPages = ["/login", "/register"];
  const isAuthPage = authPages.includes(pathname);

  const decodeToken = (token: string) => {
    try {
      const base64 = token.split(".")[1];
      if (!base64) return null;

      const json = Buffer.from(base64, "base64url").toString();
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const payload = isTokenInvalid ? null : decodeToken(token as string);

  const isKycRoute = pathname === "/dashboard/kyc";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");

  if (
    isTokenInvalid &&
    (isDashboardRoute || isAdminRoute || pathname === "/profile")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (payload?.status === "Inactive" && pathname !== "/inactive") {
    return NextResponse.redirect(new URL("/inactive", request.url));
  }

  if (payload?.status !== "Inactive" && pathname === "/inactive") {
    const redirectUrl =
      payload?.role === "Admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  if (!isTokenInvalid && isAuthPage) {
    if (payload?.role && payload?.status !== "Inactive") {
      const redirectUrl =
        payload.role === "Admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  if (isAdminRoute && payload?.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    isDashboardRoute &&
    !isKycRoute &&
    payload?.role !== "Admin" &&
    payload?.kyc_status !== "Approved"
  ) {
    return NextResponse.redirect(new URL("/dashboard/kyc", request.url));
  }

  if (
    isKycRoute &&
    (payload?.kyc_status === "Approved" || payload?.role === "Admin")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/inactive",
  ],
};
