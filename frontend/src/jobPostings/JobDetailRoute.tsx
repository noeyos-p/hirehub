import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import JobDetail from "./jopPostingComponents/JobDetail";

const JobDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const jobId = Number(id);
  if (!jobId || Number.isNaN(jobId)) {
    return (
      <div className="py-10 text-center text-red-600">
        잘못된 공고 ID 입니다.
        <button className="block mt-4 text-blue-600 underline" onClick={() => navigate(-1)}>
          뒤로가기
        </button>
      </div>
    );
  }

  return <JobDetail jobId={jobId} onBack={() => navigate(-1)} />;
};

export default JobDetailRoute;
