import React, { useEffect, useState } from "react";
import { payApi } from "../../api/payApi";

const AdminPaymentManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 최초 전체 로딩
  const loadAll = () => {
    payApi.getAdminPayments()
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadAll();
  }, []);

  // 검색 실행
  const handleSearch = async () => {
    try {
      const res = await payApi.searchAdminPayments({
        email: email.trim() || undefined,
        status: status.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 검색 초기화
  const clearSearch = () => {
    setEmail("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
    loadAll();
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-6">결제 관리</h2>

      {/* 검색 UI */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          <input
            type="text"
            placeholder="이메일 검색"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">전체 상태</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FAILED">FAILED</option>
            <option value="PENDING">PENDING</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border px-3 py-2 rounded"
          />

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            검색
          </button>
        </div>

        <button
          onClick={clearSearch}
          className="mt-3 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
        >
          초기화
        </button>
      </div>

      {/* 결제 내역 출력 */}
      {items.length === 0 ? (
        <p className="text-gray-500">결제 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              className="border p-4 rounded-lg bg-white shadow-sm"
            >
              <p>유저: {it.userEmail}</p>
              <p>금액: {it.amount}원</p>
              <p>상태: {it.status}</p>
              <p>일시: {it.createdAt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentManagement;
