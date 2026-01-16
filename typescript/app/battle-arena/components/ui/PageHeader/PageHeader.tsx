'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  ChatIcon, 
  TestTube01Icon, 
  IdentityCardIcon, 
  UploadSquare01Icon,
  Sword03Icon
} from '@hugeicons/core-free-icons';

interface NavigationItem {
  label: string;
  path: string;
}

interface PageHeaderProps {
  title: string;
  title2?: string;
  decalImageUrl?: string;
  leftButton?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  navigationItems?: NavigationItem[];
  isLoading?: boolean;
}

// Define all available navigation items
const ALL_NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Battle Arena', path: '/battle-arena' },
  { label: 'Test Page', path: '/battle-arena/battle-simulator' },
  { label: 'Create Card', path: '/battle-arena/unified-character-creator' },
  { label: 'Load Data', path: '/battle-arena/load-data' },
];

// Icon mapping for navigation items - using Map for O(1) lookup
const PATH_TO_ICON_MAP = new Map([
  ['/battle-arena', Sword03Icon],
  ['/battle-arena/battle-simulator', TestTube01Icon],
  ['/battle-arena/unified-character-creator', IdentityCardIcon],
  ['/battle-arena/load-data', UploadSquare01Icon],
]);

// Shared button styling
const NAV_BUTTON_CLASSES = 'flex items-center gap-1 sm:gap-2 ps-2 pe-2.5 py-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-900/5 transition-colors font-semibold text-xs sm:text-base';

// Shared title styling
const TITLE_CLASSES = 'font-display text-xl text-stone-950 sm:text-2xl md:text-5xl transition-all duration-300 ease-in-out';

/**
 * PageHeader component displays page title and navigation actions
 * Features responsive layout with navigation items on left/right and centered title
 */
export function PageHeader({
  title,
  title2,
  decalImageUrl,
  leftButton,
  navigationItems,
  isLoading = false,
}: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const defaultLeftButton = useMemo(() => leftButton || {
    label: 'Chat',
    onClick: () => router.push('/'),
    icon: (
      <HugeiconsIcon 
        icon={ChatIcon} 
        size={20} 
        className="text-current"
      />
    ),
  }, [leftButton, router]);

  // Get navigation items, excluding current page
  const availableItems = useMemo(() => 
    navigationItems || ALL_NAVIGATION_ITEMS.filter(item => item.path !== pathname),
    [navigationItems, pathname]
  );
  
  // Determine left and right side items based on current page
  // On simulator page: Battle goes to left, Simulator is excluded
  // On other pages: Simulator goes to left
  const { leftSideItem, rightSideItems } = useMemo(() => {
    const isSimulatorPage = pathname === '/battle-arena/battle-simulator';
    const leftPath = isSimulatorPage ? '/battle-arena' : '/battle-arena/battle-simulator';
    const leftSideItem = availableItems.find(item => item.path === leftPath);
    const rightSideItems = availableItems.filter(item => item.path !== leftPath);
    return { leftSideItem, rightSideItems };
  }, [availableItems, pathname]);
  
  // Icon lookup helper
  const getIconForPath = (path: string) => PATH_TO_ICON_MAP.get(path) || null;

  return (
    <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-3">
      <div className="max-w-7xl mx-auto relative">
        {/* Grid layout: left nav, centered title, right nav */}
        <div className="grid grid-cols-3 items-center">
          {/* Left Navigation - Back to Chat and Simulator */}
          <div className="flex justify-end items-center gap-1 sm:gap-2 min-w-0">
            <button
              onClick={defaultLeftButton.onClick}
              className={`${NAV_BUTTON_CLASSES} truncate`}
            >
              <span className="hidden sm:inline">{defaultLeftButton.icon}</span>
              <span>{defaultLeftButton.label}</span>
            </button>
            {leftSideItem && (
              <button
                onClick={() => router.push(leftSideItem.path)}
                className={`${NAV_BUTTON_CLASSES} whitespace-nowrap`}
              >
                {(() => {
                  const LeftIcon = getIconForPath(leftSideItem.path);
                  return LeftIcon ? (
                    <span className="hidden sm:inline">
                      <HugeiconsIcon 
                        icon={LeftIcon} 
                        size={20} 
                        className="text-current"
                      />
                    </span>
                  ) : null;
                })()}
                <span>{leftSideItem.label}</span>
              </button>
            )}
          </div>

          {/* Center - Page Title with Decal */}
          <div className="flex items-center justify-center min-w-0">
            <h1 
              key={`title-${pathname}`}
              className={TITLE_CLASSES}
            >
              {title}
            </h1>
            {decalImageUrl && (
              <img
                key={`${pathname}-${decalImageUrl}`}
                src={decalImageUrl}
                alt={title2 ? `${title} ${title2}` : title}
                className="pixel-art flex-shrink-0 mx-1 h-[clamp(2.5rem,5vw,5rem)] w-auto"
                style={{
                  animation: 'slideInFromTop 0.4s ease-out',
                }}
              />
            )}
            {title2 && (
              <h1 
                key={`title2-${pathname}`}
                className={TITLE_CLASSES}
              >
                {title2}
              </h1>
            )}
          </div>

          {/* Right Navigation - Create Character and Load Data */}
          <div className="flex flex-col items-start min-w-0 gap-1">
            {rightSideItems.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-start">
                {rightSideItems.map((item) => {
                  const IconComponent = getIconForPath(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`${NAV_BUTTON_CLASSES} whitespace-nowrap`}
                    >
                      {IconComponent && (
                        <span className="hidden sm:inline">
                          <HugeiconsIcon 
                            icon={IconComponent} 
                            size={20} 
                            className="text-current"
                          />
                        </span>
                      )}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {/* Loading Indicator - Only show when there are no navigation items to avoid clutter */}
            {isLoading && rightSideItems.length === 0 && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-[10px] xs:text-xs">Refreshing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
