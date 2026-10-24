import { NextResponse } from "next/server";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://projectpilot-backend.vercel.app/api/v1"
).replace(/\/+$/, "");

function isQuickLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.QUICK_LOGIN_ENABLED === "true"
  );
}

export async function GET() {
  return NextResponse.json({
    enabled: isQuickLoginEnabled(),
  });
}

export async function POST(request: Request) {
  if (!isQuickLoginEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Quick login is disabled in this environment.",
        },
      },
      { status: 404 }
    );
  }

  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" },
      },
      { status: 400 }
    );
  }

  const role = body.role?.toUpperCase();
  let email = "";
  let password = "";

  switch (role) {
    case "STUDENT":
      email = process.env.QUICK_LOGIN_STUDENT_EMAIL || "";
      password = process.env.QUICK_LOGIN_STUDENT_PASSWORD || "";
      break;
    case "MENTOR":
      email = process.env.QUICK_LOGIN_MENTOR_EMAIL || "";
      password = process.env.QUICK_LOGIN_MENTOR_PASSWORD || "";
      break;
    case "ADMIN":
      email = process.env.QUICK_LOGIN_ADMIN_EMAIL || "";
      password = process.env.QUICK_LOGIN_ADMIN_PASSWORD || "";
      break;
    default:
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Role must be STUDENT, MENTOR, or ADMIN",
          },
        },
        { status: 400 }
      );
  }

  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "MISCONFIGURED_CREDENTIALS",
          message: `Credentials for role ${role} are not configured in .env.local.`,
        },
      },
      { status: 500 }
    );
  }

  // Forward the request to the real backend login endpoint
  try {
    const backendRes = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BACKEND_UNAVAILABLE",
          message:
            error instanceof Error ? error.message : "Failed to connect to backend",
        },
      },
      { status: 502 }
    );
  }
}
