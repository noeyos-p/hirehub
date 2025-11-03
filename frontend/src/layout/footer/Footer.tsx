import { Headphones } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-white text-gray-700 py-3 border-t border-gray-200 flex justify-center">
      <div className="w-[1440px] px-[55px] flex items-center justify-between py-3 px-4">
        {/* 왼쪽 로고 + 회사 정보 */}
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <Link to="/">
          <img
            src="/HIREHUB_LOGO.PNG"
            alt="HireHub Logo"
            className="w-[117px] h-[33px] object-contain mr-[23px]"
          />
          </Link>
          <div>
            <h4 className="text-[16px] font-medium text-gray-500">(주)병아리 개발단</h4>
            <p className="text-[13px] text-gray-400">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </div>
        </div>

        {/* 오른쪽 고객 상담 센터 */}
        <div className="flex items-center space-x-2 group cursor-pointer">
          <Headphones className="w-5 h-5 text-black group-hover:text-[#006AFF] transition" />
          <a
            href="/chatBot"
            className="font-semibold text-[16px] text-black group-hover:text-[#006AFF] transition"
          >
            고객 상담 센터
          </a>
        </div>
      </div>
    </footer>
  );
}
