import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface Props {
  onClose: () => void;
}

const CompanyInfoPopup: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 overflow-hidden animate-fadeIn">
        {/* 헤더 이미지 */}
        <div className="relative h-52 sm:h-64 bg-gray-900 text-white flex items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
            alt="Startup Team"
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight drop-shadow-md">
              🐣 (주)병아리 개발단
            </h2>
            <p className="text-sm text-gray-100 mt-1 font-light">
              Creative Minds. Innovative Code. Human-Centered Tech.
            </p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition"
          >
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-8 space-y-7 text-gray-800">
          {/* 소개 */}
          <div>
            <p className="text-lg font-semibold">
              "작은 병아리들의 상상력으로, 세상을 밝히는 기술을 만듭니다."
            </p>
            <p className="mt-3 text-gray-600 leading-relaxed">
              저희 <strong>(주)병아리 개발단</strong>은 창의적인 사고와 탄탄한 기술력을 기반으로,
              웹과 모바일 생태계 전반에서 혁신적인 서비스를 개발하는 팀입니다.
              <br />
              풀스택, 백엔드, 프론트엔드, 클라우드, 디자인 등
              각 분야의 전문가들이 한 팀으로 협력하며 미래를 만들어갑니다.
            </p>
          </div>

          {/* 팀 구성 */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">👩‍💻 팀 구성</h3>
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-gray-700">
              <li>
                <strong>단장</strong> — 박소연{" "}
                <span className="text-gray-500">(Fullstack / PM)</span>
              </li>
              <li>
                <strong>김효남</strong> — Backend / Java / API
              </li>
              <li>
                <strong>김민서</strong> — Frontend / UI·UX
              </li>
              <li>
                <strong>이강현</strong> — Web / DevOps
              </li>
              <li>
                <strong>임지윤</strong> — Frontend / QA
              </li>
            </ul>
          </div>

          {/* 기술 스택 */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              🛠 주요 기술 스택
            </h3>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                Java / Spring Boot
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                React / TypeScript
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                MySQL
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                AWS / Docker / Nginx
              </span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full">
                Tailwind CSS
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                OAuth2 / JWT
              </span>
            </div>
          </div>

          {/* 가치관 */}
          <div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">🌱 우리의 철학</h3>
            <p className="text-gray-600 leading-relaxed">
              우리는 코드 한 줄로 세상을 바꿀 수 있다고 믿습니다.
              <br />
              단순한 기능이 아닌, 사람을 위한 기술을 만들기 위해 끊임없이 배우고 도전합니다.
            </p>
          </div>

          {/* ✅ 회사 정보 (영문 주소 / 연락처 - compact ver) */}
          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">
              🏢 Company Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-[14px] text-gray-600 leading-relaxed">
              <p>
                <span className="font-medium text-gray-800">Address:</span>{" "}
                2F, 101 Teheran-ro, Gangnam-gu, Seoul
              </p>
              <p>
                <span className="font-medium text-gray-800">Tel:</span>{" "}
                +82 2-1234-5678
              </p>
              <p>
                <span className="font-medium text-gray-800">Fax:</span>{" "}
                +82 2-9876-5432
              </p>
              <p>
                <span className="font-medium text-gray-800">Email:</span>{" "}
                <a
                  href="mailto:hello@byeongaridev.com"
                  className="text-blue-600 hover:underline"
                >
                  hello@byeongaridev.com
                </a>
              </p>
              <p>
                <span className="font-medium text-gray-800">Website:</span>{" "}
                <a
                  href="https://byeongarigaebaldan.store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  byeongarigaebaldan.store
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="bg-gray-100 px-8 py-4 text-center text-sm text-gray-500">
          © 2025 (주)병아리 개발단 — All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoPopup;
