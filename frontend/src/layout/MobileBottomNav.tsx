import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import {
  BriefcaseIcon as BriefcaseSolidIcon,
  ClipboardDocumentListIcon as ClipboardSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  UserIcon as UserSolidIcon,
  CommandLineIcon as CommandLineSolidIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../hooks/useAuth';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const isAdmin = user?.email === 'admin@admin';

  // 관리자 페이지에서는 이 네비게이션을 숨김
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      label: '채용공고',
      path: '/jobPostings',
      icon: BriefcaseIcon,
      iconSolid: BriefcaseSolidIcon
    },
    {
      label: '자유게시판',
      path: '/board',
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardSolidIcon
    },
    {
      label: '실시간 채팅',
      path: '/mobile-chat',
      icon: ChatBubbleLeftRightIcon,
      iconSolid: ChatSolidIcon
    },
    {
      label: isAdmin ? '관리자' : '마이페이지',
      path: isAdmin ? '/admin' : '/mypage',
      icon: isAdmin ? CommandLineIcon : UserIcon,
      iconSolid: isAdmin ? CommandLineSolidIcon : UserSolidIcon
    }
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    // 마이페이지 클릭 시 로그인 체크
    if (path === '/mypage' && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    navigate(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = active ? item.iconSolid : item.icon;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
            >
              <Icon
                className={`w-6 h-6 mb-1 ${active ? 'text-gray-600' : 'text-gray-600'}`}
                style={active ? { color: '#006AFF' } : {}}
              />
              <span
                className={`text-xs ${active ? 'font-semibold' : ''} text-gray-600`}
                style={active ? { color: '#006AFF' } : {}}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
