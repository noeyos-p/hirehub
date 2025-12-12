import React, { useEffect, useState } from "react";
import { payApi } from "../../api/payApi";

const AdminPaymentManagement: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    payApi.getAdminPayments()
      .then(res => setItems(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-6">결제 관리</h2>

      {items.length === 0 ? (
        <p className="text-gray-500">결제 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="border p-4 rounded-lg bg-white shadow-sm">
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
