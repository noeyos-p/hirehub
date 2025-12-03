import React from 'react';
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

const mockData = [
    { year: '2020', sales: 150, avgSalary: 4200, newSalary: 3200, employees: 120, avgAge: 32.5 },
    { year: '2021', sales: 180, avgSalary: 4400, newSalary: 3400, employees: 135, avgAge: 32.2 },
    { year: '2022', sales: 220, avgSalary: 4800, newSalary: 3600, employees: 160, avgAge: 31.8 },
    { year: '2023', sales: 280, avgSalary: 5200, newSalary: 3900, employees: 200, avgAge: 31.5 },
    { year: '2024', sales: 350, avgSalary: 5600, newSalary: 4200, employees: 240, avgAge: 31.2 },
    { year: '2025', sales: 420, avgSalary: 6000, newSalary: 4500, employees: 280, avgAge: 31.0 },
];

const CompanyCharts: React.FC = () => {
    const latest = mockData[mockData.length - 1];

    return (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mt-6">
            <h3 className="text-lg font-semibold mb-6">기업 분석</h3>

            {/* 상단: 요약 정보 (카드 형태) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-5 flex items-center space-x-4 border border-blue-100">
                    <div className="p-3 bg-white rounded-full text-blue-400 shadow-sm">
                        <UsersIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">총 사원 수</p>
                        <p className="text-2xl font-bold text-gray-800">{latest.employees}명</p>
                        <p className="text-xs text-blue-400 mt-1">▲ 전년 대비 16.7% 증가</p>
                    </div>
                </div>
                <div className="bg-orange-50 rounded-xl p-5 flex items-center space-x-4 border border-orange-100">
                    <div className="p-3 bg-white rounded-full text-orange-400 shadow-sm">
                        <UserGroupIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">평균 나이</p>
                        <p className="text-2xl font-bold text-gray-800">{latest.avgAge}세</p>
                        <p className="text-xs text-orange-400 mt-1">▼ 젊은 조직 문화</p>
                    </div>
                </div>
            </div>

            {/* 하단: 차트 3개 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-4">
                {/* 1. 매출액 */}
                <div className="h-[250px] sm:h-[300px]">
                    <h4 className="text-sm sm:text-md font-medium mb-4 text-center text-gray-700">매출액 (억원)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="year" fontSize={11} tickMargin={5} />
                            <YAxis fontSize={11} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                formatter={(value: number) => [`${value} 억원`, '매출액']}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Bar dataKey="sales" fill="#4F46E5" fillOpacity={0.4} barSize={20} radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="sales" stroke="#4F46E5" strokeWidth={2} dot={{ r: 3 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. 평균연봉 */}
                <div className="h-[250px] sm:h-[300px]">
                    <h4 className="text-sm sm:text-md font-medium mb-4 text-center text-gray-700">평균 연봉 (만원)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={mockData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

                {/* 3. 입사자 평균연봉 */}
                <div className="h-[250px] sm:h-[300px]">
                    <h4 className="text-sm sm:text-md font-medium mb-4 text-center text-gray-700">입사자 평균 연봉 (만원)</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={mockData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

            <p className="text-xs text-gray-400 text-right mt-6">* 2020~2025년 예상 추이 (임시 데이터)</p>
        </div>
    );
};

export default CompanyCharts;
