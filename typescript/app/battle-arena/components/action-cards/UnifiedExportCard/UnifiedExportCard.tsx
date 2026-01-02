'use client';

import { useState } from 'react';
import { exportMultipleCharactersToPDF, CharacterPDFExportOptions } from '../../../utils/data/pdfExport';

type ExportType = 'heroes' | 'monsters';
type ExportFormat = 'json' | 'pdf';
type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

interface UnifiedExportCardProps {
  type: ExportType;
  size?: 'normal' | 'compact';
}

export function UnifiedExportCard({ type, size = 'compact' }: UnifiedExportCardProps) {
  const [jsonStatus, setJsonStatus] = useState<ExportStatus>('idle');
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle');

  const isHeroes = type === 'heroes';
  const displayName = isHeroes ? 'Heroes' : 'Monsters';
  const apiEndpoint = isHeroes ? '/api/heroes' : '/api/monsters';

  const handleExportJSON = async () => {
    setJsonStatus('loading');
    try {
      const response = await fetch(`${apiEndpoint}/export-defaults`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to export default ${type}`);
      }

      const data = await response.json();
      console.log(`Exported ${data.count} default ${type} to ${data.path}`);
      setJsonStatus('success');
      
      alert(`✅ Successfully exported ${data.count} default ${type} to JSON!\n\nPath: ${data.path}\n\nRun 'npm run build' to use the updated defaults.`);
    } catch (error) {
      console.error(`Failed to export default ${type}:`, error);
      setJsonStatus('error');
      alert(error instanceof Error ? error.message : `Failed to export default ${type}. Please try again.`);
    } finally {
      setTimeout(() => setJsonStatus('idle'), 3000);
    }
  };

  const handleExportPDF = async () => {
    setPdfStatus('loading');
    try {
      const response = await fetch(`${apiEndpoint}/export-pdf`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to fetch ${type} for PDF export`);
      }

      const data = await response.json();
      const items = isHeroes ? data.heroes : data.monsters;
      
      if (!items || items.length === 0) {
        throw new Error(`No ${type} found to export`);
      }

      // Convert to PDF export format
      const itemsForPDF: CharacterPDFExportOptions[] = items.map((item: any) => ({
        playerClass: {
          name: item.name,
          hitPoints: item.hitPoints,
          maxHitPoints: item.maxHitPoints,
          armorClass: item.armorClass,
          attackBonus: item.attackBonus,
          damageDie: item.damageDie,
          abilities: item.abilities,
          description: item.description,
          color: item.color,
          class: item.class,
          meleeDamageDie: item.meleeDamageDie,
          rangedDamageDie: item.rangedDamageDie,
          race: item.race,
          sex: item.sex,
        },
        characterName: item.name,
        imageUrl: item.localImageUrl || item.imageUrl,
        characterType: item.class ? `${isHeroes ? 'Hero' : 'Monster'} - ${item.class}` : (isHeroes ? 'Hero' : 'Monster'),
        imagePrompt: item.imagePrompt,
        imageSetting: item.imageSetting,
      }));

      // Generate the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `All_${displayName}_${timestamp}.pdf`;
      
      await exportMultipleCharactersToPDF(itemsForPDF, {
        filename,
        footerText: '2025 OpenRAG - Battle Arena',
      });

      console.log(`Exported ${items.length} ${type} to PDF: ${filename}`);
      setPdfStatus('success');
      
      alert(`✅ Successfully exported ${items.length} ${type} to PDF!\n\nFilename: ${filename}\n\nThe PDF has been downloaded to your browser's download folder.`);
    } catch (error) {
      console.error(`Failed to export ${type} to PDF:`, error);
      setPdfStatus('error');
      alert(error instanceof Error ? error.message : `Failed to export ${type} to PDF. Please try again.`);
    } finally {
      setTimeout(() => setPdfStatus('idle'), 3000);
    }
  };

  const isCompact = size === 'compact';
  const cardWidth = isCompact ? 'w-48' : 'w-80';
  const cardHeight = isCompact ? 'h-80' : 'h-96';
  const iconSize = isCompact ? 'w-12 h-12' : 'w-16 h-16';
  const textSize = isCompact ? 'text-sm' : 'text-base';
  const titleSize = isCompact ? 'text-base' : 'text-xl';
  const buttonTextSize = isCompact ? 'text-xs' : 'text-sm';

  // Color scheme based on type
  const getColorScheme = () => {
    if (isHeroes) {
      return {
        gradient: 'from-blue-900/40 to-blue-950/40',
        border: 'border-blue-700/50 hover:border-blue-600',
        shadow: 'hover:shadow-blue-900/50',
        bg: 'bg-blue-800/30 group-hover:bg-blue-700/40',
        icon: 'text-blue-400 group-hover:text-blue-300',
        title: 'text-blue-200',
        text: 'text-blue-300/80',
        hover: 'from-blue-500/0 to-blue-600/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10',
      };
    }
    return {
      gradient: 'from-purple-900/40 to-purple-950/40',
      border: 'border-purple-700/50 hover:border-purple-600',
      shadow: 'hover:shadow-purple-900/50',
      bg: 'bg-purple-800/30 group-hover:bg-purple-700/40',
      icon: 'text-purple-400 group-hover:text-purple-300',
      title: 'text-purple-200',
      text: 'text-purple-300/80',
      hover: 'from-purple-500/0 to-purple-600/0 group-hover:from-purple-500/10 group-hover:to-purple-600/10',
    };
  };

  const colors = getColorScheme();

  // Get button status styling
  const getButtonStyle = (status: ExportStatus, baseColor: string) => {
    if (status === 'loading') {
      return 'bg-gray-600 cursor-wait opacity-75';
    }
    if (status === 'success') {
      return 'bg-green-700 hover:bg-green-600';
    }
    if (status === 'error') {
      return 'bg-red-700 hover:bg-red-600';
    }
    return `bg-${baseColor}-700 hover:bg-${baseColor}-600`;
  };

  const getButtonText = (format: ExportFormat, status: ExportStatus) => {
    if (status === 'loading') return 'Exporting...';
    if (status === 'success') return '✓ Exported!';
    if (status === 'error') return '✗ Failed';
    return format === 'json' ? '📄 Export JSON' : '📋 Export PDF';
  };

  const isAnyLoading = jsonStatus === 'loading' || pdfStatus === 'loading';

  return (
    <div
      className={`${cardWidth} ${cardHeight} bg-gradient-to-br ${colors.gradient} rounded-2xl border-2 ${colors.border} transition-all duration-300 hover:scale-105 hover:shadow-xl ${colors.shadow} flex flex-col items-center justify-center gap-4 p-6 group relative`}
    >
      {/* Icon */}
      <div className={`${iconSize} rounded-full ${colors.bg} flex items-center justify-center transition-colors`}>
        <svg 
          className={`${iconSize} ${colors.icon} transition-colors`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isAnyLoading ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              className="animate-spin origin-center"
            />
          ) : (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          )}
        </svg>
      </div>

      {/* Title and Description */}
      <div className="text-center">
        <h3 className={`${titleSize} font-bold ${colors.title} mb-1`}>
          Export {displayName}
        </h3>
        <p className={`${textSize} ${colors.text}`}>
          Save database to files
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 w-full px-1">
        <button
          onClick={handleExportJSON}
          disabled={isAnyLoading}
          className={`w-full px-4 py-3 ${getButtonStyle(jsonStatus, isHeroes ? 'blue' : 'purple')} text-white font-semibold rounded-lg border-2 border-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${buttonTextSize}`}
        >
          {getButtonText('json', jsonStatus)}
        </button>
        <button
          onClick={handleExportPDF}
          disabled={isAnyLoading}
          className={`w-full px-4 py-3 ${getButtonStyle(pdfStatus, isHeroes ? 'blue' : 'purple')} text-white font-semibold rounded-lg border-2 border-opacity-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${buttonTextSize}`}
        >
          {getButtonText('pdf', pdfStatus)}
        </button>
      </div>

      {/* Status Text */}
      <div className={`${textSize} ${colors.text} text-center min-h-[1.5rem]`}>
        {jsonStatus === 'loading' && 'Exporting to JSON...'}
        {pdfStatus === 'loading' && 'Generating PDF...'}
        {jsonStatus === 'success' && 'JSON export complete!'}
        {pdfStatus === 'success' && 'PDF download started!'}
        {jsonStatus === 'error' && 'JSON export failed'}
        {pdfStatus === 'error' && 'PDF export failed'}
        {!isAnyLoading && jsonStatus === 'idle' && pdfStatus === 'idle' && 'Choose export format'}
      </div>

      {/* Hover effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.hover} transition-all duration-300 pointer-events-none`} />
    </div>
  );
}

// Made with Bob