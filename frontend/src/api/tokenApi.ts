import api from "./api";

export const tokenApi = {
  /** 🔥 토큰 사용 */
  use: async (amount: number, feature: string, description: string) => {
    try {
      const res = await api.post("/api/token/use", {
        amount,
        feature,
        description,
      });
      return res.data;
    } catch (err: any) {
      // 🔥 토큰 부족 시 (백엔드: 400 + "NOT_ENOUGH_TOKENS")
      if (
        err.response?.status === 400 &&
        err.response?.data?.message === "토큰이 부족합니다 토큰을 충전해주세요"
      ) {
        return "토큰이 부족합니다 토큰을 충전해주세요";
      }

      // 다른 에러는 그대로 던져서 기존 로직 유지
      throw err;
    }
  },

  /** 🔥 현재 보유 토큰 조회 */
  myTokens: async () => {
    return api.get("/api/token/my");
  },

  /** 🔥 토큰 사용 내역 조회 */
  usage: async () => {
    return api.get("/api/token/usage");
  },
};
