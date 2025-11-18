"use client";

import { useEffect, useState } from "react";

export default function TestCookiesPage() {
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    setCookies(document.cookie);
  }, []);

  const handleLogin = async () => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "leonardovyguimaraes@gmail.com",
        password: "62845_Madhouse",
      }),
      credentials: "include",
    });

    const data = await response.json();
    console.log("Login response:", data);
    console.log("Cookies após login:", document.cookie);

    // Aguardar um pouco
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verificar novamente
    console.log("Cookies após 1s:", document.cookie);

    // Redirecionar
    if (data.redirectTo) {
      window.location.href = data.redirectTo;
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Teste de Cookies</h1>
      <div className="mb-4">
        <strong>Cookies atuais:</strong>
        <pre className="bg-gray-100 p-4 mt-2">{cookies || "Nenhum cookie"}</pre>
      </div>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Testar Login
      </button>
    </div>
  );
}
