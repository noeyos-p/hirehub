import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { myPageApi } from "../../api/myPageApi";
import { commentApi } from "../../api/boardApi";
import type { MyPostItem } from "../../types/interface";
import { EyeIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

const MyPosts: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<MyPostItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  const fetchAllCommentCounts = async (postList: MyPostItem[]) => {
    const counts: Record<number, number> = {};

    await Promise.all(
      postList.map(async (post) => {
        try {
          const comments = await commentApi.getCommentsByBoardId(post.id);
          counts[post.id] = comments.length;
        } catch (err: any) {
          if (err.response?.status === 401 || err.response?.status === 404) {
            counts[post.id] = 0;
          } else {
            console.error(`게시글 ${post.id}의 댓글 조회 실패:`, err);
            counts[post.id] = 0;
          }
        }
      })
    );

    setCommentCounts(counts);
  };

  const fetchMine = async () => {
    try {
      setLoading(true);
      const data = await myPageApi.getMyPosts();
      const postList = Array.isArray(data) ? data : [];
      setPosts(postList);
      setSelectedIds([]);
      await fetchAllCommentCounts(postList);
    } catch (e) {
      console.error("내 게시물 불러오기 실패:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const handleCheckboxChange = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const allSelected = useMemo(
    () => posts.length > 0 && selectedIds.length === posts.length,
    [posts, selectedIds]
  );

  const handleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(posts.map((p) => p.id));
  };

  const handleEdit = (id: number) => {
    // ✅ 마이페이지 내부 라우트로 이동
    navigate(`/myPage/MyPosts/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`선택한 ${selectedIds.length}개 게시글을 삭제할까요?`)) return;

    try {
      setLoading(true);
      await Promise.all(selectedIds.map((id) => myPageApi.deleteBoard(id)));
      await fetchMine();
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl lg:max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">작성한 게시물</h2>
        <button
          onClick={handleSelectAll}
          className="text-sm text-gray-600 hover:text-gray-800"
          disabled={loading || posts.length === 0}
        >
          {allSelected ? "전체해제" : "전체선택"}
        </button>
      </div>

      <div className="space-y-5">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex justify-between border-b border-gray-200 pb-4"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-5 accent-blue-500"
                checked={selectedIds.includes(post.id)}
                onChange={() => handleCheckboxChange(post.id)}
                disabled={loading}
              />
              <div>
                {/* ✅ 제목 클릭 시 게시글 상세 페이지로 이동 */}
                <div
                  className="text-gray-900 font-semibold cursor-pointer hover:text-blue-600"
                  onClick={() => navigate(`/board/${post.id}`)}
                >
                  {post.title}
                </div>

                <div className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2 w-[600px]">
                  {post.content}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between">
              <button
                className="text-gray-700 text-sm px-4 py-1.5 rounded-md transition-colors"
                style={{ backgroundColor: '#D6E4F0' }}
                onClick={() => handleEdit(post.id)}
                disabled={loading}
              >
                수정하기
              </button>
              <div className="flex items-center space-x-3 mt-2">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <EyeIcon className="w-4 h-4" />
                  <span>{post.views ?? 0}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>{commentCounts[post.id] || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-sm text-gray-500">작성한 게시물이 없습니다.</div>
        )}
      </div>

      <div className="flex justify-end mt-6">
        <button
          className="text-red-500 hover:text-red-600 text-sm font-medium disabled:opacity-50"
          onClick={handleDelete}
          disabled={!selectedIds.length || loading}
        >
          삭제
        </button>
      </div>
    </div>
  );
};

export default MyPosts;
