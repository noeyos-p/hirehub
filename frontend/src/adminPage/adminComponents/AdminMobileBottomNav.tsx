import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    BriefcaseIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    MegaphoneIcon,
    ChatBubbleLeftRightIcon,
    StarIcon,
    DocumentDuplicateIcon,
    DocumentTextIcon,
    CreditCardIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline'; // Outline 아이콘
import {
    BriefcaseIcon as BriefcaseSolid,
    UserGroupIcon as UserGroupSolid,
    BuildingOfficeIcon as BuildingOfficeSolid,
    MegaphoneIcon as MegaphoneSolid,
    ChatBubbleLeftRightIcon as ChatBubbleSolid,
    StarIcon as StarSolid,
    DocumentDuplicateIcon as DocumentSolid,
    DocumentTextIcon as DocumentTextSolid,
    CreditCardIcon as CreditCardSolid,
    Squares2X2Icon
} from '@heroicons/react/24/solid'; // Solid 아이콘

const AdminMobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { name: "공고 관리", path: "job-management", icon: BriefcaseIcon, iconSolid: BriefcaseSolid },
        { name: "유저 관리", path: "user-management", icon: UserGroupIcon, iconSolid: UserGroupSolid },
        { name: "기업 관리", path: "company-management", icon: BuildingOfficeIcon, iconSolid: BuildingOfficeSolid },
        { name: "광고 관리", path: "ads-management", icon: MegaphoneIcon, iconSolid: MegaphoneSolid },
        { name: "댓글 관리", path: "comment-management", icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleSolid },
        { name: "리뷰 관리", path: "review-management", icon: StarIcon, iconSolid: StarSolid },
        { name: "게시판 관리", path: "board-management", icon: DocumentDuplicateIcon, iconSolid: DocumentSolid },
        { name: "이력서 관리", path: "resume-management", icon: DocumentTextIcon, iconSolid: DocumentTextSolid },
        { name: "실시간 상담", path: "live-support", icon: ChatBubbleLeftRightIcon, iconSolid: ChatBubbleSolid },
        { name: "결제 관리", path: "payment-management", icon: CreditCardIcon, iconSolid: CreditCardSolid },
    ];

    const isActive = (path: string) => location.pathname.includes(path);

    const handleNavigate = (path: string) => {
        navigate(`/admin/${path}`);
        setIsMenuOpen(false);
    };

    // 현재 활성화된 메뉴 찾기
    const activeItem = menuItems.find(item => isActive(item.path));

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom h-16 flex items-center justify-around px-2">
                {/* 1. 홈/대시보드 (공고 관리를 기본 홈으로 가정) */}
                <button
                    onClick={() => navigate('/admin/job-management')}
                    className="flex flex-col items-center justify-center flex-1 h-full"
                >
                    <BriefcaseIcon className={`w-6 h-6 mb-1 ${isActive('job-management') ? 'text-[#006AFF]' : 'text-gray-500'}`} />
                    <span className={`text-xs ${isActive('job-management') ? 'text-[#006AFF] font-bold' : 'text-gray-500'}`}>공고 관리</span>
                </button>

                {/* 2. 유저 관리 */}
                <button
                    onClick={() => navigate('/admin/user-management')}
                    className="flex flex-col items-center justify-center flex-1 h-full"
                >
                    <UserGroupIcon className={`w-6 h-6 mb-1 ${isActive('user-management') ? 'text-[#006AFF]' : 'text-gray-500'}`} />
                    <span className={`text-xs ${isActive('user-management') ? 'text-[#006AFF] font-bold' : 'text-gray-500'}`}>유저 관리</span>
                </button>

                {/* 3. 전체 메뉴 토글 버튼 */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center justify-center flex-1 h-full"
                >
                    <Bars3Icon className="w-6 h-6 mb-1 text-gray-500" />
                    <span className="text-xs text-gray-500">전체 메뉴</span>
                </button>
            </nav>

            {/* Bottom Sheet (전체 메뉴) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Sheet Content */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto animate-slideUp">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-gray-900">관리자 메뉴</h2>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-4 grid grid-cols-3 gap-4 pb-8">
                            {menuItems.map((item) => {
                                const active = isActive(item.path);
                                const Icon = active ? item.iconSolid : item.icon;

                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigate(item.path)}
                                        className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors gap-2"
                                    >
                                        <div className={`p-3 rounded-full ${active ? 'bg-blue-50 text-[#006AFF]' : 'bg-gray-100 text-gray-600'}`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className={`text-xs text-center ${active ? 'text-[#006AFF] font-bold' : 'text-gray-600'}`}>
                                            {item.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminMobileBottomNav;
