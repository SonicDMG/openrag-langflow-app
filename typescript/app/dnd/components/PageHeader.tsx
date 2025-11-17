'use client';

import { useRouter, usePathname } from 'next/navigation';

interface BreadcrumbItem {
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
  breadcrumbs?: BreadcrumbItem[];
}

// Define all available pages for navigation
const ALL_PAGES: BreadcrumbItem[] = [
  { label: 'Battle', path: '/dnd' },
  { label: 'Test', path: '/dnd/test' },
  { label: 'Image Creator', path: '/dnd/character-image-creator' },
  { label: 'Create Character', path: '/dnd/create-character' },
  { label: 'Load Data', path: '/dnd/load-data' },
];

export function PageHeader({
  title,
  title2,
  decalImageUrl,
  leftButton,
  breadcrumbs,
}: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const defaultLeftButton = leftButton || {
    label: 'Back to Chat',
    onClick: () => router.push('/'),
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  };

  // Use provided breadcrumbs or generate from current path, excluding current page
  const displayBreadcrumbs = breadcrumbs || ALL_PAGES.filter(page => page.path !== pathname);

  return (
    <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-3">
      <div className="max-w-7xl mx-auto relative">
        {/* Grid layout to keep title centered - responsive */}
        <div className="grid grid-cols-3 items-center gap-2 sm:gap-3 md:gap-4">
          {/* Left Column - Back Button */}
          <div className="flex justify-start min-w-0">
            <button
              onClick={defaultLeftButton.onClick}
              className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="hidden sm:inline">{defaultLeftButton.icon}</span>
              <span className="font-semibold text-xs sm:text-base truncate">{defaultLeftButton.label}</span>
            </button>
          </div>

          {/* Center Column - Title with Decal Graphic */}
          <div className="flex items-center justify-center min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" style={{ fontFamily: 'serif', color: '#5C4033' }}>
              {title}
            </h1>
            {decalImageUrl && (
              <img
                src={decalImageUrl}
                alt={`${title} ${title2 || ''}`.trim()}
                className="flex-shrink-0 mx-1 sm:mx-2"
                style={{ 
                  imageRendering: 'pixelated',
                  height: 'clamp(2.5rem, 5vw, 5rem)', // Responsive: smaller on mobile, larger on desktop
                  width: 'auto'
                }}
              />
            )}
            {title2 && (
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate" style={{ fontFamily: 'serif', color: '#5C4033' }}>
                {title2}
              </h1>
            )}
          </div>

          {/* Right Column - Breadcrumb Navigation */}
          <div className="flex items-center justify-end min-w-0">
            {displayBreadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-wrap justify-end">
                {displayBreadcrumbs.map((item, index) => (
                  <div key={item.path} className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                    <button
                      onClick={() => router.push(item.path)}
                      className="text-gray-700 hover:text-gray-900 transition-colors font-semibold text-[10px] xs:text-xs sm:text-sm whitespace-nowrap"
                    >
                      {item.label}
                    </button>
                    {index < displayBreadcrumbs.length - 1 && (
                      <span className="text-gray-500 text-[10px] xs:text-xs sm:text-sm">•</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
