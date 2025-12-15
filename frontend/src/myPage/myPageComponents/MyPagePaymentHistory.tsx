/* 전체 파일 구조 유지한 채 오류 부분만 정확히 수정 */

import React, { useEffect, useState } from "react";
import { payApi } from "../../api/payApi";
import { tokenApi } from "../../api/tokenApi";

import {
  CreditCardIcon,
  CalendarIcon,
  ArchiveBoxIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

interface PaymentItem {
  id: number;
  goodName: string;
  amount: number;
  payMethod?: string;
  createdAt: string;
}

interface TokenUsageItem {
  id: number;
  feature: string;
  description: string;
  amount: number;
  createdAt: string;
}

const MyPagePaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [usage, setUsage] = useState<TokenUsageItem[]>([]);
  const [myTokens, setMyTokens] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  // 🔥 feature 코드 → 사람이 읽기 쉬운 텍스트로 변환
  const featureLabel = (code: string) => {
    switch (code) {
      case "PAYMENT":
        return "토큰 충전";
      case "USE_AI_REVIEW":
        return "AI 리뷰";
      case "USE_JOBMATCHING":
        return "AI 매칭";
      case "USE_INTERVIEW_COACHING":
        return "면접 코칭";
      default:
        return code;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        // 🔹 결제 내역
        const payRes = await payApi.myPayments();
        setPayments(payRes.data);

        // 🔹 토큰 보유량
        const tokenRes = await tokenApi.myTokens();
        setMyTokens(
          tokenRes.data.balance ??
          tokenRes.data.tokenBalance ??
          tokenRes.data.tokens ??
          0
        );
        // 🔹 토큰 사용 내역
        const usageRes = await tokenApi.usage();
        setUsage(usageRes.data);

      } catch (err) {
        console.error("데이터 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px] py-8">

      {/* 현재 보유 토큰 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-10">
        <div className="flex items-center mb-4">
          <FireIcon className="w-7 h-7 text-[#006AFF] mr-2" />
          <h2 className="text-xl font-bold text-gray-900">현재 보유 HIRE 토큰</h2>
        </div>
        <p className="text-4xl font-extrabold text-[#006AFF]">{myTokens}개</p>
      </div>

      {/* 토큰 사용내역 */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-3">토큰 사용 내역</h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006AFF]"></div>
          </div>
        ) : usage.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ArchiveBoxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">토큰 사용 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">사용 일시</th>
                  <th className="px-6 py-4 font-medium">사용 기능</th>
                  <th className="px-6 py-4 font-medium">설명</th>
                  <th className="px-6 py-4 font-medium text-right">차감 토큰</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {usage.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {u.createdAt?.substring(0, 10) || '-'}
                        <span className="text-gray-400 mx-1">|</span>
                        {u.createdAt?.substring(11, 16) || '-'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {featureLabel(u.feature || '')}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">{u.description || '-'}</td>

                    {/* amount는 DB에 이미 부호가 있어 그대로 표시 */}
                    <td className={`px-6 py-4 text-right font-bold ${(u.amount || 0) > 0 ? "text-blue-600" : "text-red-500"}`}>
                      {(u.amount || 0) > 0 ? `+${u.amount || 0}개` : `${u.amount || 0}개`}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}
      </div>

      {/* 결제 내역 */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">결제 내역</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006AFF]"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ArchiveBoxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-lg">결제 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">

              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">결제 일시</th>
                  <th className="px-6 py-4 font-medium">상품명</th>
                  <th className="px-6 py-4 font-medium">결제 수단</th>
                  <th className="px-6 py-4 font-medium text-right">결제 금액</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {payments.map((item) => {
                  const tokenCount = parseInt((item.goodName || "0").replace(/[^0-9]/g, ""), 10) || 0;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                          {item.createdAt?.substring(0, 10) || '-'}
                          <span className="text-gray-400 mx-1">|</span>
                          {item.createdAt?.substring(11, 16) || '-'}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          토큰 {tokenCount || 0}개
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-gray-700">
                        {(item.payMethod || '').toUpperCase() === "KAKAOPAY" ? (
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                            카카오페이
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
                            카드 결제
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-bold text-gray-900">
                        {(item.amount || 0).toLocaleString()}원
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default MyPagePaymentHistory;

