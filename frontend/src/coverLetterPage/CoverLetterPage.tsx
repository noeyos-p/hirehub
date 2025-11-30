import React, { useState, useEffect } from 'react';
import { SparklesIcon, DocumentTextIcon, ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { myPageApi } from '../api/myPageApi';
import api from '../api/api';
import type { ResumeItem } from '../types/interface';

type InputMode = 'text' | 'essay' | 'resume';

export default function CoverLetterPage() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [originalText, setOriginalText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // 이력서 목록 불러오기
  useEffect(() => {
    if (inputMode === 'resume' || inputMode === 'essay') {
      fetchResumes();
    }
  }, [inputMode]);

  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await myPageApi.getResumes({ page: 0, size: 100 });
      setResumes(response.content);
    } catch (error) {
      console.error('이력서 목록 불러오기 실패:', error);
      alert('이력서 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoadingResumes(false);
    }
  };

  // 이력서 선택 시 텍스트 추출
  const handleResumeSelect = async (resumeId: number) => {
    setSelectedResumeId(resumeId);
    try {
      const resume = await myPageApi.getResumeDetail(resumeId);

      console.log('📄 불러온 이력서 데이터:', resume);

      let text = '';

      // essayTitle과 essayTittle 둘 다 처리 (백엔드 필드명 불일치 대응)
      const essayTitle = resume.essayTitle ?? resume.essayTittle ?? '';
      const essayContent = resume.essayContent ?? '';

      // htmlContent 파싱 (학력, 경력 등의 정보가 여기 저장됨)
      let parsedData: any = null;
      if (resume.htmlContent) {
        try {
          parsedData = JSON.parse(resume.htmlContent);
          console.log('📦 htmlContent 파싱 결과:', parsedData);
        } catch (e) {
          console.error('❌ htmlContent 파싱 실패:', e);
        }
      }

      // 자기소개서만 모드
      if (inputMode === 'essay') {
        if (essayContent) {
          text = essayContent;
        } else {
          text = '자기소개서 내용이 없습니다.';
        }
        console.log('✅ 자기소개서만 모드 - 추출된 텍스트:', text.substring(0, 100));
      }
      // 이력서 전체 모드
      else if (inputMode === 'resume') {
        text = `제목: ${resume.title}\n\n`;

        if (essayTitle && essayContent) {
          text += `=== 자기소개서 ===\n`;
          text += `${essayTitle}\n\n`;
          text += `${essayContent}\n\n`;
        }

        // 학력 정보 (htmlContent 우선, 없으면 직접 필드)
        const educations = parsedData?.education ?? resume.educationDtos ?? [];
        console.log('🎓 학력 데이터:', educations, '길이:', educations.length);
        if (educations.length > 0) {
          text += `=== 학력 ===\n`;
          educations.forEach((edu: any) => {
            text += `${edu.name} | ${edu.major || ''} | ${edu.status}\n`;
          });
          text += '\n';
        }

        // 경력 정보 (htmlContent 우선, 없으면 직접 필드)
        const careers = parsedData?.career ?? resume.careerLevelDtos ?? (resume as any).careers ?? [];
        console.log('💼 경력 데이터:', careers, '길이:', careers.length);
        if (careers.length > 0) {
          text += `=== 경력 ===\n`;
          careers.forEach((career: any) => {
            text += `${career.companyName} | ${career.position}\n`;
            text += `${career.content || ''}\n\n`;
          });
        }

        // 자격증 (htmlContent 우선, 없으면 직접 필드)
        const certificates = parsedData?.certificate ?? resume.certificateDtos ?? [];
        console.log('📜 자격증 데이터:', certificates, '길이:', certificates.length);
        if (certificates.length > 0) {
          text += `=== 자격증 ===\n`;
          certificates.forEach((cert: any) => {
            text += `- ${cert.name}\n`;
          });
          text += '\n';
        }

        // 스킬 (htmlContent 우선, 없으면 직접 필드)
        const skills = parsedData?.skill ?? resume.skillDtos ?? [];
        console.log('⚡ 스킬 데이터:', skills, '길이:', skills.length);
        if (skills.length > 0) {
          text += `=== 기술 스택 ===\n`;
          text += skills.map((s: any) => s.name).join(', ');
          text += '\n\n';
        }

        // 언어 정보도 추가
        const languages = parsedData?.language ?? [];
        if (languages.length > 0) {
          text += `=== 언어 ===\n`;
          text += languages.map((lang: any) => lang.name).join(', ');
          text += '\n\n';
        }

        console.log('✅ 이력서 전체 모드 - 최종 텍스트 길이:', text.length, '글자');
        console.log('📝 최종 텍스트 내용:', text);
      }

      setOriginalText(text);
    } catch (error) {
      console.error('이력서 불러오기 실패:', error);
      alert('이력서를 불러오는데 실패했습니다.');
    }
  };

  const handleImprove = async () => {
    if (!originalText.trim()) {
      alert('자기소개서 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.post("/api/resume/ai-review", { content: originalText });
      console.log("🧠 AI 첨삭 결과:", res.data);

      setImprovedText(res.data.feedback || "첨삭 결과가 없습니다.");
    } catch (error: any) {
      console.error('❌ AI 첨삭 요청 실패:', error);
      alert('AI 첨삭 요청 중 오류가 발생했습니다: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setOriginalText('');
    setImprovedText('');
    setSelectedResumeId(null);
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setOriginalText('');
    setImprovedText('');
    setSelectedResumeId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-[55px]">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-10 h-10 text-[#006AFF] mr-2" />
            <h1 className="text-3xl font-bold text-gray-900">AI 자기소개서 수정</h1>
          </div>
          <p className="text-gray-600">
            AI가 당신의 자기소개서를 분석하고 더 나은 표현으로 개선해드립니다.
          </p>
        </div>

        {/* 입력 모드 선택 탭 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => handleModeChange('text')}
              className={`px-4 py-2 rounded-md font-medium transition text-sm ${
                inputMode === 'text'
                  ? 'bg-[#006AFF] text-white'
                  : 'text-gray-700 hover:text-[#006AFF]'
              }`}
            >
              <ClipboardDocumentIcon className="w-5 h-5 inline-block mr-1" />
              직접 입력
            </button>
            <button
              onClick={() => handleModeChange('essay')}
              className={`px-4 py-2 rounded-md font-medium transition text-sm ${
                inputMode === 'essay'
                  ? 'bg-[#006AFF] text-white'
                  : 'text-gray-700 hover:text-[#006AFF]'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline-block mr-1" />
              자기소개서만
            </button>
            <button
              onClick={() => handleModeChange('resume')}
              className={`px-4 py-2 rounded-md font-medium transition text-sm ${
                inputMode === 'resume'
                  ? 'bg-[#006AFF] text-white'
                  : 'text-gray-700 hover:text-[#006AFF]'
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 inline-block mr-1" />
              이력서 전체
            </button>
          </div>
        </div>

        {/* 이력서 선택 영역 (이력서/자소서 모드일 때만 표시) */}
        {(inputMode === 'resume' || inputMode === 'essay') && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {inputMode === 'essay' ? '자기소개서 선택' : '이력서 선택'}
            </h2>
            {loadingResumes ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006AFF]"></div>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>작성된 이력서가 없습니다.</p>
                <p className="text-sm mt-1">마이페이지에서 이력서를 먼저 작성해주세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((resume) => (
                  <button
                    key={resume.id}
                    onClick={() => handleResumeSelect(resume.id)}
                    className={`p-4 border rounded-lg text-left transition ${
                      selectedResumeId === resume.id
                        ? 'border-[#4E98FF] bg-[#00000]'
                        : 'border-gray-200 hover:border-[#4E98FF]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">{resume.title}</h3>
                          {resume.locked && (
                            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                              제출됨
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(resume.createAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedResumeId === resume.id && (
                        <CheckCircleIcon className="w-6 h-6 text-[#006AFF] flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 원본 자기소개서 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">
                {inputMode === 'text' ? '원본 자기소개서' :
                 inputMode === 'essay' ? '자기소개서 내용' : '이력서 내용'}
              </h2>
            </div>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder={
                inputMode === 'text'
                  ? '자기소개서 내용을 입력해주세요...'
                  : '위에서 이력서를 선택하면 내용이 자동으로 입력됩니다...'
              }
              readOnly={inputMode !== 'text'}
              className={`w-full h-96 p-4 border border-gray-300 rounded-lg resize-none ${
                inputMode !== 'text'
                  ? 'bg-gray-50 cursor-not-allowed focus:outline-none'
                  : 'focus:ring-2 focus:ring-[#006AFF] focus:border-transparent focus:outline-none'
              }`}
            />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {originalText.length} 글자
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  초기화
                </button>
                <button
                  onClick={handleImprove}
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#006AFF] text-white rounded-lg hover:bg-[#0055DD] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '분석 중...' : '수정하기'}
                </button>
              </div>
            </div>
          </div>

          {/* 개선된 자기소개서 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="w-6 h-6 text-gray-700 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">수정된 자기소개서</h2>
            </div>
            {improvedText ? (
              <>
                <div className="w-full h-96 p-4 rounded-lg bg-blue-50 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-gray-800">
                    {improvedText}
                  </pre>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {improvedText.length} 글자
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(improvedText)}
                    className="px-4 py-2 bg-[#006AFF] text-white rounded-lg hover:bg-green-700 transition"
                  >
                    복사하기
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <p>AI 수정 결과가 여기에 표시됩니다</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 사용 가이드 */}
        <div className="mt-8 bg-[#EFF4F8] border border-[#D6E4F0] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">사용 가이드</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>자기소개서 내용을 왼쪽 입력창에 작성하거나 붙여넣기 해주세요.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>"수정하기" 버튼을 클릭하면 AI가 자동으로 문장을 개선해드립니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>개선된 내용은 오른쪽에 표시되며, 복사하기 버튼으로 간편하게 복사할 수 있습니다.</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">-</span>
              <span>더 나은 결과를 위해 구체적이고 명확한 문장으로 작성해주세요.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
