import api from "./api";

export const payApi = {
  /** 결제 검증 */
  verify: (data: { impUid: string }) =>
    api.post("/api/pay/verify", data),

  /** 관리자 전체 결제 조회 */
  getAdminPayments: () =>
    api.get("/api/admin/payments"),

  /** ⭐ 관리자 결제 검색 (email, status, dateFrom, dateTo 지원) */
  searchAdminPayments: (params: {
    email?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    api.get("/api/admin/payments/search", { params }),

  /** 🔥 마이페이지: 내 결제내역 */
  myPayments: () =>
    api.get("/api/payment/my"),

  /** 🔥 마이페이지: 내 토큰 보유량 */
  myTokens: () =>
    api.get("/api/token/my"),

  /** 🔥 토큰 구매 요청 */
  requestPayment: (data: any) =>
    api.post("/api/pay/request", data),
};
