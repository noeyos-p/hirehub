import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";

type BoardDto = { id: number; title: string; content: string; };

const EditMyPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<BoardDto>({ id: 0, title: "", content: "" });
  const [originalForm, setOriginalForm] = useState<BoardDto>({ id: 0, title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await myPageApi.getBoardDetail(id);
        setForm(data);
        setOriginalForm(data);
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
    if (!form.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!form.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      await myPageApi.updateBoard(id, {
        title: form.title.trim(),
        content: form.content.trim(),
      });
      alert("게시글이 수정되었습니다.");
      navigate("/myPage/MyPosts");
    } catch (e: any) {
      console.error("수정 실패:", e?.response || e);
      const msg = e?.response?.data?.message || "게시글 수정에 실패했습니다.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = form.title !== originalForm.title || form.content !== originalForm.content;

    if (hasChanges) {
      if (window.confirm('수정한 내용이 있습니다. 지금 나가면 취소됩니다. 나가시겠습니까?')) {
        navigate("/myPage/MyPosts");
      }
    } else {
      navigate("/myPage/MyPosts");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl lg:max-w-4xl mx-auto px-6 py-10">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">게시글 수정</h2>

      {/* 제목 */}
      <div className="mb-6">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="제목을 입력하세요"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          disabled={saving}
        />
      </div>

      {/* 내용 */}
      <div className="mb-6">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          내용
        </label>
        <textarea
          id="content"
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          placeholder="내용을 입력하세요"
          rows={8}
          className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black resize-none"
          disabled={saving}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-4 mt-6">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-4 py-2 disabled:opacity-50"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-gray-700 text-sm font-medium px-5 py-2 rounded-md transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#D6E4F0' }}
        >
          {saving ? '수정 중...' : '수정'}
        </button>
      </div>
    </div>
  );
};

export default EditMyPost;
