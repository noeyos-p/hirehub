import React, { useEffect, useState } from 'react';
import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { jobPostApi } from '../../api/jobPostApi';
import type { CompanyStatsResponse } from '../../types/interface';

interface CompanyChartsProps {
    companyId?: number;
}

const CompanyCharts: React.FC<CompanyChartsProps> = ({ companyId }) => {
    const [stats, setStats] = useState<CompanyStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                console.log("CompanyCharts fetching stats for companyId:", companyId);
                if (!companyId) {
                    setError("기업 정보를 찾을 수 없습니다.");
                    setLoading(false);
                    return;
                }
                const data = await jobPostApi.getCompanyStats(companyId);
                console.log("CompanyCharts fetched data:", data);
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch company stats:", err);
                setError("통계 데이터를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [companyId]);

    if (loading) return <div className="p-6 text-center text-gray-500">통계 로딩 중...</div>;
    if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
    if (!stats) return null;

    const { chartData, totalEmployees, currentAvgAge } = stats;

    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
            <h3 className="text-lg font-semibold mb-6">기업 분석</h3>

            {/* 상단: 요약 정보 (카드 형태) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-100 rounded-xl p-5 flex items-center space-x-4 border border-gray-200">
                    <div className="p-3 bg-white rounded-full text-gray-700 shadow-sm">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">총 사원 수</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {totalEmployees && totalEmployees > 0 ? `${totalEmployees.toLocaleString()}명` : "비공개"}
                        </p>
                    </div>
                </div>
                <div className="bg-gray-100 rounded-xl p-5 flex items-center space-x-4 border border-gray-200">
                    <div className="p-3 bg-white rounded-full text-gray-700 shadow-sm">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">평균 나이</p>
                        <p className="text-2xl font-bold text-gray-800">{currentAvgAge.toFixed(1)}세</p>
                    </div>
                </div>
            </div>

            {/* 하단: 차트 3개 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-4">
                {/* 1. 매출액 */}
                <div className="h-[250px] sm:h-[300px] flex flex-col">
                    <h4 className="text-sm sm:text-md font-medium mb-4 text-center text-gray-700">매출액 (억원)</h4>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" fontSize={11} tickMargin={5} />
                                <YAxis fontSize={11} tickFormatter={(value) => `${value}`} />
                                <Tooltip
                                    formatter={(value: number) => [`${value} 억원`, '매출액']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Bar dataKey="sales" fill="#818CF8" fillOpacity={0.4} barSize={20} radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="sales" stroke="#818CF8" strokeWidth={2} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. 평균연봉 */}
                <div className="h-[250px] sm:h-[300px] flex flex-col">
                    <h4 className="text-sm sm:text-md font-medium mb-4 text-center text-gray-700">평균 연봉 (만원)</h4>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" fontSize={11} tickMargin={5} />
                                <YAxis domain={['dataMin - 500', 'dataMax + 500']} fontSize={11} />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()} 만원`, '평균연봉']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Bar dataKey="avgSalary" fill="#EA580C" fillOpacity={0.4} barSize={20} radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="avgSalary" stroke="#EA580C" strokeWidth={2} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 3. 입사자 평균연봉 */}
                <div className="h-[250px] sm:h-[300px] flex flex-col">
                    <h4 className="text-sm sm:text-md font-medium mb-4 text-center text-gray-700">입사자 평균 연봉 (만원)</h4>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" fontSize={11} tickMargin={5} />
                                <YAxis domain={['dataMin - 500', 'dataMax + 500']} fontSize={11} />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()} 만원`, '입사자 연봉']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Bar dataKey="newSalary" fill="#16A34A" fillOpacity={0.4} barSize={20} radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="newSalary" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <p className="text-xs text-gray-400 text-right mt-6">* 더미 데이터입니다</p>
        </div>
    );
};

export default CompanyCharts;
