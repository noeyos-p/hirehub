import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/api";

type BoardDto = { id: number; title: string; content: string; };

const EditMyPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<BoardDto>({ id: 0, title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<BoardDto>(`/api/board/${id}`);
        setForm(data);
      } catch (e) {
        console.error("게시글 조회 실패:", e);
        alert("게시글을 불러올 수 없습니다.");
        navigate("/myPage/MyPosts");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/api/board/${id}`, {
        title: form.title,
        content: form.content,
      });
      alert("수정되었습니다.");
      navigate("/myPage/MyPosts");
    } catch (e: any) {
      console.error("수정 실패:", e?.response || e);
      const msg = e?.response?.data || "수정 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="px-6 py-10 text-gray-600">로딩 중...</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">게시글 수정</h2>

      <div className="space-y-4">
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <textarea
          className="w-full border rounded px-3 py-2 min-h-[260px] resize-y"
          placeholder="내용"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
          onClick={() => navigate(-1)}
          disabled={saving}
        >
          취소
        </button>
        <button
          className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default EditMyPost;
