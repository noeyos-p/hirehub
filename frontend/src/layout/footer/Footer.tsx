import React, { useState } from "react";
import { Headphones } from "lucide-react";
import CompanyInfoPopup from "../../popUp/CompanyInfoPopup";

export default function Footer() {
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  return (
    <>
      <footer className="bg-white text-gray-700 py-3 border-t border-gray-200 flex justify-center">
        <div className="w-full max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] flex flex-col md:flex-row items-center justify-between py-3 gap-4 md:gap-0">
          {/* 왼쪽 로고 + 회사 정보 */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4 mb-0">
            <a href="/" className="flex-shrink-0">
              <img
                src="/HIREHUB_LOGO.PNG"
                alt="HireHub Logo"
                className="w-[90px] sm:w-[100px] md:w-[110px] lg:w-[117px] h-auto object-contain"
              />
            </a>

            <div className="text-center sm:text-left">
              {/* ✅ 회사명 클릭 시 팝업 열기 */}
              <button
                onClick={() => setShowCompanyInfo(true)}
                className="text-sm md:text-[15px] lg:text-[16px] font-medium text-gray-600 hover:text-[#006AFF] transition"
              >
                (주)병아리 개발단
              </button>

              {/* 저작권 문구 클릭해도 팝업 열림 */}
              <p
                onClick={() => setShowCompanyInfo(true)}
                className="text-xs md:text-[13px] text-gray-400 cursor-pointer hover:text-gray-600 transition"
              >
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>

          {/* 오른쪽 고객 상담 센터 */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 group cursor-pointer">
            <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover:text-[#006AFF] transition" />
            <a
              href="/chatBot"
              className="font-semibold text-sm sm:text-[15px] md:text-[16px] text-black group-hover:text-[#006AFF] transition whitespace-nowrap"
            >
              고객 상담 센터
            </a>
          </div>
        </div>
      </footer>

      {/* ✅ 팝업 표시 */}
      {showCompanyInfo && (
        <CompanyInfoPopup onClose={() => setShowCompanyInfo(false)} />
      )}
    </>
  );
}
