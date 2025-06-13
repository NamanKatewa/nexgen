import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const authPages = ["/login", "/register"];
  const isAuthPage = authPages.includes(pathname);

  const protectedRoutes = ["/dashboard", "/admin/dashboard", "/profile"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const decodeToken = (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = parts[1];
      if (!payload) return null;

      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  if (token) {
    const payload = decodeToken(token);

    if (payload && payload.status === "Inactive" && pathname !== "/inactive") {
      return NextResponse.redirect(new URL("/inactive", request.url));
    }

    if (payload && payload.status !== "Inactive" && pathname === "/inactive") {
      const dashboardUrl =
        payload.role === "Admin" ? "/admin/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(dashboardUrl, request.url));
    }
  }

  if (token && isAuthPage) {
    const payload = decodeToken(token);
    if (payload && payload.role) {
      if (payload.status !== "Inactive") {
        const dashboardUrl =
          payload.role === "Admin" ? "/admin/dashboard" : "/dashboard";
        return NextResponse.redirect(new URL(dashboardUrl, request.url));
      }
    }
  }

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = decodeToken(token);

    if (payload && payload.status === "Inactive") {
      return NextResponse.redirect(new URL("/inactive", request.url));
    }

    if (!payload || payload.role !== "Admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
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
