import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BriefcaseIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  BriefcaseIcon as BriefcaseSolidIcon,
  ClipboardDocumentListIcon as ClipboardSolidIcon,
  ChatBubbleLeftRightIcon as ChatSolidIcon,
  UserIcon as UserSolidIcon
} from '@heroicons/react/24/solid';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
      label: '마이페이지',
      path: '/mypage',
      icon: UserIcon,
      iconSolid: UserSolidIcon
    }
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
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
              onClick={() => navigate(item.path)}
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
