import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/wallet/callback") {
    return NextResponse.next();
  }

  const isTokenInvalid = !token || token === "undefined";
  const isAuthPage = pathname === "/login" || pathname === "/register";

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

  const payload = isTokenInvalid ? null : decodeToken(token);

  const isKycRoute = pathname === "/dashboard/kyc";
  const isSubmittedRoute = pathname === "/dashboard/submitted";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedPage =
    isDashboardRoute || isAdminRoute || pathname === "/profile";

  if (isTokenInvalid && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const status = payload?.status;
  const role = payload?.role;
  const kycStatus = payload?.kyc_status;

  if (status === "Inactive" && pathname !== "/inactive") {
    return NextResponse.redirect(new URL("/inactive", request.url));
  }

  if (status !== "Inactive" && pathname === "/inactive") {
    return NextResponse.redirect(
      new URL(role === "Admin" ? "/admin/dashboard" : "/dashboard", request.url)
    );
  }

  if (!isTokenInvalid && isAuthPage && role && status !== "Inactive") {
    return NextResponse.redirect(
      new URL(role === "Admin" ? "/admin/dashboard" : "/dashboard", request.url)
    );
  }

  if (isAdminRoute && role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    isDashboardRoute &&
    !isKycRoute &&
    !isSubmittedRoute &&
    role !== "Admin" &&
    kycStatus !== "Approved"
  ) {
    return NextResponse.redirect(new URL("/dashboard/kyc", request.url));
  }

  if (isKycRoute && kycStatus === "Submitted") {
    return NextResponse.redirect(new URL("/dashboard/submitted", request.url));
  }

  if (isKycRoute && (kycStatus === "Approved" || role === "Admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isSubmittedRoute && (kycStatus === "Approved" || role === "Admin")) {
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
