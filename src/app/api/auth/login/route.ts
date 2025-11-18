import { createServerClient } from "@supabase/ssr";
import { signInSchema } from "@/lib/validations/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

export async function POST(request: Request) {
  try {
    console.log("🔵 [API] Recebendo requisição de login...");

    const body = await request.json();
    const validatedData = signInSchema.parse(body);

    console.log("🔵 [API] Login para:", validatedData.email);

    const cookieStore = cookies();

    // Create Supabase client
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore errors
            }
          },
        },
      }
    );

    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      console.error("❌ [API] Erro no login:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!authData.session) {
      console.error("❌ [API] Sessão não criada");
      return NextResponse.json(
        { success: false, error: "Erro ao criar sessão" },
        { status: 500 }
      );
    }

    console.log("✅ [API] Login bem-sucedido:", authData.user?.email);
    console.log("🔑 [API] Session criada:", {
      access_token: authData.session.access_token.substring(0, 20) + "...",
      refresh_token: authData.session.refresh_token?.substring(0, 20) + "...",
    });

    // Verificar progresso do onboarding para redirecionar corretamente
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let redirectTo = "/dashboard";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "kyc_status, first_deposit_completed, wallet_configured, onboarding_completed"
        )
        .eq("id", user.id)
        .single();

      if (profile) {
        if (profile.kyc_status !== "approved") {
          redirectTo = "/kyc";
        } else if (!profile.first_deposit_completed) {
          redirectTo = "/deposit";
        } else if (!profile.wallet_configured) {
          redirectTo = "/wallet";
        }
      }
    }

    console.log("✅ [API] Retornando redirectTo:", redirectTo);

    const response = NextResponse.json({
      success: true,
      redirectTo,
    });

    // SETAR COOKIES MANUALMENTE NA RESPOSTA HTTP
    // Esta é a única forma garantida de funcionar no Next.js 15
    const maxAge = 60 * 60 * 24 * 7; // 7 days

    // Cookie principal com access token
    response.cookies.set("sb-access-token", authData.session.access_token, {
      path: "/",
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    // Cookie com refresh token
    if (authData.session.refresh_token) {
      response.cookies.set("sb-refresh-token", authData.session.refresh_token, {
        path: "/",
        maxAge,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
    }

    console.log("🍪 [API] Cookies de sessão setados manualmente na resposta");

    return response;
  } catch (error) {
    console.error("❌ [API] Erro no catch:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erro ao fazer login. Tente novamente." },
      { status: 500 }
    );
  }
}
