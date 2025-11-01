// src/page/AuthCallback.tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const qs = new URLSearchParams(search);
    const token = qs.get("token");
    const isNewUser = qs.get("isNewUser");
    const email = qs.get("email");
    const error = qs.get("error");

    console.log("🔑 OAuth 콜백 수신:", { 
      token: token ? token.substring(0, 20) + "..." : null, 
      isNewUser, 
      email, 
      error 
    });

    if (error) {
      console.error("❌ OAuth error:", error);
      navigate("/login?error=" + encodeURIComponent(error));
      return;
    }

    if (!token) {
      navigate("/login?error=missing_token");
      return;
    }

    // ✅ 토큰 저장
    localStorage.setItem("token", token);
    if (email) {
      localStorage.setItem("email", email);
    }

    console.log("✅ 토큰 저장 완료, isNewUser:", isNewUser);

    // ✅ 신규 사용자 여부로 분기
    if (isNewUser === "true") {
      console.log("🆕 신규 사용자 → 온보딩 페이지로 이동");
      // ⚠️ /signInfo로 이동 (온보딩 폼)
      navigate("/signInfo");
    } else {
      console.log("👤 기존 사용자 → 메인페이지로 이동");
      // 기존 사용자는 바로 홈으로
      navigate("/");
    }
  }, [search, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">로그인 처리 중...</p>
    </div>
  );
}