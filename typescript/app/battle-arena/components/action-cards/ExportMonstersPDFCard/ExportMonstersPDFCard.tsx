'use client';

import { useState } from 'react';
import { exportMultipleCharactersToPDF, CharacterPDFExportOptions } from '../../../utils/data/pdfExport';

interface ExportMonstersPDFCardProps {
  size?: 'normal' | 'compact';
}

export function ExportMonstersPDFCard({ size = 'compact' }: ExportMonstersPDFCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportStatus('idle');
    try {
      // Fetch monsters data from API
      const response = await fetch('/api/monsters/export-pdf');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch monsters for PDF export');
      }

      const data = await response.json();
      const monsters = data.monsters;
      
      if (!monsters || monsters.length === 0) {
        throw new Error('No monsters found to export');
      }

      // Convert monsters to PDF export format
      const monstersForPDF: CharacterPDFExportOptions[] = monsters.map((monster: any) => ({
        playerClass: {
          name: monster.name,
          hitPoints: monster.hitPoints,
          maxHitPoints: monster.maxHitPoints,
          armorClass: monster.armorClass,
          attackBonus: monster.attackBonus,
          damageDie: monster.damageDie,
          abilities: monster.abilities,
          description: monster.description,
          color: monster.color,
          class: monster.class,
          meleeDamageDie: monster.meleeDamageDie,
          rangedDamageDie: monster.rangedDamageDie,
          race: monster.race,
          sex: monster.sex,
        },
        characterName: monster.name,
        // Use local CDN URL if available, otherwise fall back to imageUrl
        imageUrl: monster.localImageUrl || monster.imageUrl,
        characterType: monster.class ? `Monster - ${monster.class}` : 'Monster',
        // Use actual prompt from metadata if available
        imagePrompt: monster.imagePrompt,
        imageSetting: monster.imageSetting,
      }));

      // Generate the PDF
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `All_Monsters_${timestamp}.pdf`;
      
      await exportMultipleCharactersToPDF(monstersForPDF, {
        filename,
        footerText: '2025 OpenRAG - Battle Arena',
      });

      console.log(`Exported ${monsters.length} monsters to PDF: ${filename}`);
      setExportStatus('success');
      
      // Show success message
      alert(`✅ Successfully exported ${monsters.length} monsters to PDF!\n\nFilename: ${filename}\n\nThe PDF has been downloaded to your browser's download folder.`);
    } catch (error) {
      console.error('Failed to export monsters to PDF:', error);
      setExportStatus('error');
      alert(error instanceof Error ? error.message : 'Failed to export monsters to PDF. Please try again.');
    } finally {
      setIsExporting(false);
      // Reset status after 3 seconds
      setTimeout(() => setExportStatus('idle'), 3000);
    }
  };

  const isCompact = size === 'compact';
  const cardWidth = isCompact ? 'w-48' : 'w-80';
  const cardHeight = isCompact ? 'h-64' : 'h-96';
  const iconSize = isCompact ? 'w-12 h-12' : 'w-16 h-16';
  const textSize = isCompact ? 'text-sm' : 'text-base';
  const titleSize = isCompact ? 'text-base' : 'text-xl';

  // Color scheme based on status
  const getColorScheme = () => {
    if (exportStatus === 'success') {
      return {
        gradient: 'from-green-900/40 to-green-950/40',
        border: 'border-green-700/50 hover:border-green-600',
        shadow: 'hover:shadow-green-900/50',
        bg: 'bg-green-800/30 group-hover:bg-green-700/40',
        icon: 'text-green-400 group-hover:text-green-300',
        title: 'text-green-200',
        text: 'text-green-300/80',
        hover: 'from-green-500/0 to-green-600/0 group-hover:from-green-500/10 group-hover:to-green-600/10',
      };
    }
    if (exportStatus === 'error') {
      return {
        gradient: 'from-red-900/40 to-red-950/40',
        border: 'border-red-700/50 hover:border-red-600',
        shadow: 'hover:shadow-red-900/50',
        bg: 'bg-red-800/30 group-hover:bg-red-700/40',
        icon: 'text-red-400 group-hover:text-red-300',
        title: 'text-red-200',
        text: 'text-red-300/80',
        hover: 'from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/10',
      };
    }
    return {
      gradient: 'from-orange-900/40 to-orange-950/40',
      border: 'border-orange-700/50 hover:border-orange-600',
      shadow: 'hover:shadow-orange-900/50',
      bg: 'bg-orange-800/30 group-hover:bg-orange-700/40',
      icon: 'text-orange-400 group-hover:text-orange-300',
      title: 'text-orange-200',
      text: 'text-orange-300/80',
      hover: 'from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10',
    };
  };

  const colors = getColorScheme();

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting}
      className={`${cardWidth} ${cardHeight} bg-gradient-to-br ${colors.gradient} rounded-2xl border-2 ${colors.border} transition-all duration-300 hover:scale-105 hover:shadow-xl ${colors.shadow} flex flex-col items-center justify-center gap-3 p-4 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative`}
    >
      {/* Icon */}
      <div className={`${iconSize} rounded-full ${colors.bg} flex items-center justify-center transition-colors`}>
        <svg 
          className={`${iconSize} ${colors.icon} transition-colors`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isExporting ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              className="animate-spin origin-center"
            />
          ) : exportStatus === 'success' ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7"
            />
          ) : exportStatus === 'error' ? (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          )}
        </svg>
      </div>

      {/* Text */}
      <div className="text-center">
        <h3 className={`${titleSize} font-bold ${colors.title} mb-1`}>
          {isExporting ? 'Exporting...' : exportStatus === 'success' ? 'Exported!' : exportStatus === 'error' ? 'Export Failed' : 'Export Monsters to PDF'}
        </h3>
        <p className={`${textSize} ${colors.text}`}>
          {isExporting ? 'Generating PDF...' : exportStatus === 'success' ? 'Check your downloads' : exportStatus === 'error' ? 'Please try again' : 'Download all monsters'}
        </p>
      </div>

      {/* Hover effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colors.hover} transition-all duration-300 pointer-events-none`} />
    </button>
  );
}

// Made with Bob