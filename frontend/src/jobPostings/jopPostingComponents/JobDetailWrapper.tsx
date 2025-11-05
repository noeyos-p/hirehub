import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import JobDetail from "./JobDetail";

const JobDetailWrapper: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  if (!jobId) return null;

  return (
    // ✅ 여기에 컨테이너 추가
      <JobDetail jobId={Number(jobId)} onBack={() => navigate(-1)} />
  );
};

export default JobDetailWrapper;