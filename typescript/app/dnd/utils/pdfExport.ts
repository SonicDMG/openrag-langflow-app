import jsPDF from 'jspdf';
import { DnDClass, Ability, AttackAbility, HealingAbility, CardSetting } from '../types';
import { CARD_SETTINGS } from '../constants';

/**
 * Sanitize text for PDF export by removing or replacing problematic Unicode characters
 * This helps prevent encoding issues and GLYPH placeholders in PDFs
 */
function sanitizeTextForPDF(text: string): string {
  if (!text) return '';
  
  // Replace common problematic Unicode characters with ASCII equivalents
  return text
    // Replace various dash types with regular hyphen
    .replace(/[\u2013\u2014\u2015]/g, '-')
    // Replace various quote types with ASCII quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Replace ellipsis with three dots
    .replace(/\u2026/g, '...')
    // Replace non-breaking space with regular space
    .replace(/\u00A0/g, ' ')
    // Remove or replace other problematic Unicode characters
    // Keep only printable ASCII and common Latin-1 characters
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      // Allow ASCII printable (32-126) and common extended ASCII (160-255)
      // Also allow common Unicode ranges for accented characters
      if (
        (code >= 32 && code <= 126) || // ASCII printable
        (code >= 160 && code <= 255) || // Latin-1 Supplement
        (code >= 0x00C0 && code <= 0x024F) // Latin Extended
      ) {
        return char;
      }
      // Replace other characters with a safe fallback
      return '?';
    })
    .join('');
}

/**
 * Options for exporting a character to PDF
 */
export interface CharacterPDFExportOptions {
  /** The character class/stats data */
  playerClass: DnDClass;
  /** The character's name */
  characterName: string;
  /** Optional URL to the character image */
  imageUrl?: string;
  /** Character type label (e.g., "Hero", "Monster", "Custom Hero", "Custom Monster") */
  characterType?: string;
  /** Optional custom filename (defaults to character name) */
  filename?: string;
  /** Optional footer text (defaults to "2025 OpenRAG") */
  footerText?: string;
  /** Optional image generation prompt used to create the character image */
  imagePrompt?: string;
  /** Optional setting/theme used to create the character image */
  imageSetting?: string;
}

/**
 * Helper class for PDF document creation with consistent styling
 */
class PDFDocumentBuilder {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private yPosition: number;

  constructor(orientation: 'portrait' | 'landscape' = 'portrait', format: 'a4' | 'letter' = 'a4') {
    this.doc = new jsPDF({ orientation, unit: 'mm', format });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 15;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.yPosition = this.margin;
  }

  /**
   * Check if we need a new page and add one if necessary
   */
  checkPageBreak(requiredHeight: number): void {
    if (this.yPosition + requiredHeight > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.yPosition = this.margin;
    }
  }

  /**
   * Add text with word wrapping
   */
  addWrappedText(
    text: string,
    fontSize: number,
    maxWidth?: number,
    color: [number, number, number] = [92, 64, 51]
  ): number {
    const width = maxWidth || this.contentWidth;
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    const lines = this.doc.splitTextToSize(sanitizedText, width);
    lines.forEach((line: string) => {
      this.checkPageBreak(fontSize * 0.5);
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += fontSize * 0.5;
    });
    return lines.length;
  }

  /**
   * Add a heading
   */
  addHeading(text: string, fontSize: number = 24, color: [number, number, number] = [92, 64, 51]): void {
    this.checkPageBreak(10);
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(sanitizedText, this.margin, this.yPosition);
    this.yPosition += fontSize * 0.5 + 4;
  }

  /**
   * Add a subtitle
   */
  addSubtitle(text: string, fontSize: number = 12, color: [number, number, number] = [139, 111, 71]): void {
    this.checkPageBreak(8);
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text(sanitizedText, this.margin, this.yPosition);
    this.yPosition += fontSize * 0.5 + 4;
  }

  /**
   * Add a section heading
   */
  addSectionHeading(text: string, fontSize: number = 14, color: [number, number, number] = [139, 111, 71]): void {
    this.checkPageBreak(15);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.yPosition);
    this.yPosition += 8;
  }

  /**
   * Add an image from a URL
   */
  async addImage(url: string, maxWidth?: number, maxHeight: number = 60): Promise<void> {
    try {
      this.checkPageBreak(maxHeight + 5);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          try {
            const width = maxWidth || this.contentWidth;
            let imgWidth = img.width;
            let imgHeight = img.height;
            const aspectRatio = imgWidth / imgHeight;

            if (imgWidth > width) {
              imgWidth = width;
              imgHeight = imgWidth / aspectRatio;
            }
            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = imgHeight * aspectRatio;
            }

            const xPosition = this.margin + (this.contentWidth - imgWidth) / 2;
            this.doc.addImage(img, 'PNG', xPosition, this.yPosition, imgWidth, imgHeight);
            this.yPosition += imgHeight + 5;
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
    } catch (error) {
      console.warn('Failed to load image for PDF:', error);
    }
  }

  /**
   * Add a simple text line
   */
  addText(text: string, fontSize: number = 11, color: [number, number, number] = [92, 64, 51]): void {
    this.checkPageBreak(6);
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sanitizedText, this.margin, this.yPosition);
    this.yPosition += 6;
  }

  /**
   * Add spacing
   */
  addSpacing(amount: number): void {
    this.yPosition += amount;
  }

  /**
   * Add footer text
   */
  addFooter(text: string, color: [number, number, number] = [139, 111, 71]): void {
    const footerY = this.pageHeight - 10;
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(8);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sanitizedText, this.margin, footerY);
  }

  /**
   * Save the PDF with the given filename
   */
  save(filename: string): void {
    this.doc.save(filename);
  }

  /**
   * Get the underlying jsPDF document (for advanced use cases)
   */
  getDocument(): jsPDF {
    return this.doc;
  }

  /**
   * Get current margin (for advanced positioning)
   */
  getMargin(): number {
    return this.margin;
  }

  /**
   * Get current Y position (for advanced positioning)
   */
  getYPosition(): number {
    return this.yPosition;
  }

  /**
   * Set Y position (for advanced positioning)
   */
  setYPosition(y: number): void {
    this.yPosition = y;
  }

  /**
   * Add indented text (for lists/bullet points)
   */
  addIndentedText(text: string, indent: number = 5, fontSize: number = 9, color: [number, number, number] = [92, 64, 51]): void {
    this.checkPageBreak(5);
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sanitizedText, this.margin + indent, this.yPosition);
    this.yPosition += 5;
  }
}

/**
 * Export a character to PDF with all stats, image, name, description, and abilities
 * 
 * @param options - Character data and export options
 * @returns Promise that resolves when PDF is generated and downloaded
 * 
 * @example
 * ```ts
 * await exportCharacterToPDF({
 *   playerClass: myCharacter,
 *   characterName: "Gandalf",
 *   imageUrl: "/cdn/monsters/123/280x200.png",
 *   characterType: "Custom Hero"
 * });
 * ```
 */
export async function exportCharacterToPDF({
  playerClass,
  characterName,
  imageUrl,
  characterType,
  filename,
  footerText = '2025 OpenRAG',
  imagePrompt,
  imageSetting,
}: CharacterPDFExportOptions): Promise<void> {
  const pdf = new PDFDocumentBuilder('portrait', 'a4');

  // Title
  pdf.addHeading(characterName, 24);

  // Subtitle
  const typeLabel = characterType || 'Character';
  pdf.addSubtitle(typeLabel, 12);
  pdf.addSpacing(2);

  // Character Image
  if (imageUrl) {
    await pdf.addImage(imageUrl);
    pdf.addSpacing(3);
  }

  // Image Generation Details Section (if available)
  if (imagePrompt || imageSetting) {
    pdf.addSectionHeading('IMAGE GENERATION DETAILS', 14);
    
    if (imageSetting) {
      const settingConfig = CARD_SETTINGS[imageSetting as CardSetting];
      const settingName = settingConfig ? settingConfig.name : imageSetting;
      pdf.addText(`Setting/Theme: ${settingName}`, 10);
      if (settingConfig) {
        pdf.addText(`Description: ${settingConfig.description}`, 9);
      }
      pdf.addSpacing(2);
    }
    
    if (imagePrompt) {
      pdf.addText('Generation Prompt:', 10);
      pdf.addSpacing(1);
      const promptLines = pdf.addWrappedText(imagePrompt, 9);
      pdf.addSpacing(promptLines * 4.5);
    }
    
    pdf.addSpacing(3);
  }

  // Statistics Section
  pdf.addSectionHeading('STATISTICS', 14);
  
  const stats = [
    `HP: ${playerClass.hitPoints}/${playerClass.maxHitPoints}`,
    `AC: ${playerClass.armorClass}`,
    `ATK: +${playerClass.attackBonus}`,
    `DMG: ${playerClass.damageDie}`,
  ];

  if (playerClass.meleeDamageDie) {
    stats.push(`Melee: ${playerClass.meleeDamageDie}`);
  }
  if (playerClass.rangedDamageDie) {
    stats.push(`Ranged: ${playerClass.rangedDamageDie}`);
  }

  stats.forEach((stat) => {
    pdf.addText(stat, 11);
  });

  pdf.addSpacing(3);

  // Description Section
  pdf.addSectionHeading('DESCRIPTION', 14);
  const description = playerClass.description || `A character named ${characterName}.`;
  const descLines = pdf.addWrappedText(description, 10);
  pdf.addSpacing(descLines * 5 + 3);

  // Abilities Section
  if (playerClass.abilities && playerClass.abilities.length > 0) {
    pdf.addSectionHeading('ABILITIES', 14);

    playerClass.abilities.forEach((ability) => {
      pdf.checkPageBreak(25);
      
      // Ability name
      const abilityType = ability.type === 'attack' ? 'Attack' : 'Healing';
      pdf.addText(`${ability.name} (${abilityType})`, 12, [92, 64, 51]);
      pdf.addSpacing(1);

      // Ability description
      if (ability.description) {
        const abilityDescLines = pdf.addWrappedText(ability.description, 9);
        pdf.addSpacing(abilityDescLines * 4.5);
      }

      // Ability details
      const isAttack = ability.type === 'attack';
      const attackAbility = isAttack ? (ability as AttackAbility) : null;

      if (isAttack && attackAbility) {
        const details: string[] = [];
        details.push(`Damage: ${attackAbility.damageDice}`);
        if (attackAbility.bonusDamageDice) {
          details.push(`Bonus: ${attackAbility.bonusDamageDice}`);
        }
        details.push(`Attack Roll: ${attackAbility.attackRoll ? 'd20' : 'Automatic'}`);
        if (attackAbility.attacks && attackAbility.attacks > 1) {
          details.push(`Attacks: x${attackAbility.attacks}`);
        }

        details.forEach((detail) => {
          pdf.addIndentedText(`- ${detail}`, 5);
        });
      } else {
        const healingAbility = ability as HealingAbility;
        pdf.addIndentedText(`- Healing: ${healingAbility.healingDice}`, 5);
      }

      pdf.addSpacing(3);
    });
  }

  // Footer
  pdf.addFooter(footerText);

  // Save the PDF
  const fileName = filename || `${characterName.replace(/[^a-z0-9]/gi, '_')}_Character_Sheet.pdf`;
  pdf.save(fileName);
}

/**
 * Export multiple characters to a single PDF
 * 
 * @param characters - Array of character data to export
 * @param options - Optional export settings
 * @returns Promise that resolves when PDF is generated and downloaded
 */
export async function exportMultipleCharactersToPDF(
  characters: CharacterPDFExportOptions[],
  options?: {
    filename?: string;
    footerText?: string;
  }
): Promise<void> {
  const pdf = new PDFDocumentBuilder('portrait', 'a4');
  const footerText = options?.footerText || '2025 OpenRAG';

  for (let i = 0; i < characters.length; i++) {
    const { playerClass, characterName, imageUrl, characterType, imagePrompt, imageSetting } = characters[i];

    // Add page break between characters (except for the first one)
    if (i > 0) {
      pdf.getDocument().addPage();
      pdf.setYPosition(pdf.getMargin());
    }

    // Title
    pdf.addHeading(characterName, 24);

    // Subtitle
    const typeLabel = characterType || 'Character';
    pdf.addSubtitle(typeLabel, 12);
    pdf.addSpacing(2);

    // Character Image
    if (imageUrl) {
      await pdf.addImage(imageUrl);
      pdf.addSpacing(3);
    }

    // Image Generation Details Section (if available)
    if (imagePrompt || imageSetting) {
      pdf.addSectionHeading('IMAGE GENERATION DETAILS', 14);
      
      if (imageSetting) {
        const settingConfig = CARD_SETTINGS[imageSetting as CardSetting];
        const settingName = settingConfig ? settingConfig.name : imageSetting;
        pdf.addText(`Setting/Theme: ${settingName}`, 10);
        if (settingConfig) {
          pdf.addText(`Description: ${settingConfig.description}`, 9);
        }
        pdf.addSpacing(2);
      }
      
      if (imagePrompt) {
        pdf.addText('Generation Prompt:', 10);
        pdf.addSpacing(1);
        const promptLines = pdf.addWrappedText(imagePrompt, 9);
        pdf.addSpacing(promptLines * 4.5);
      }
      
      pdf.addSpacing(3);
    }

    // Statistics Section
    pdf.addSectionHeading('STATISTICS', 14);
    
    const stats = [
      `HP: ${playerClass.hitPoints}/${playerClass.maxHitPoints}`,
      `AC: ${playerClass.armorClass}`,
      `ATK: +${playerClass.attackBonus}`,
      `DMG: ${playerClass.damageDie}`,
    ];

    if (playerClass.meleeDamageDie) {
      stats.push(`Melee: ${playerClass.meleeDamageDie}`);
    }
    if (playerClass.rangedDamageDie) {
      stats.push(`Ranged: ${playerClass.rangedDamageDie}`);
    }

    stats.forEach((stat) => {
      pdf.addText(stat, 11);
    });

    pdf.addSpacing(3);

    // Description Section
    pdf.addSectionHeading('DESCRIPTION', 14);
    const description = playerClass.description || `A character named ${characterName}.`;
    const descLines = pdf.addWrappedText(description, 10);
    pdf.addSpacing(descLines * 5 + 3);

    // Abilities Section
    if (playerClass.abilities && playerClass.abilities.length > 0) {
      pdf.addSectionHeading('ABILITIES', 14);

      playerClass.abilities.forEach((ability) => {
        pdf.checkPageBreak(25);
        
        const abilityType = ability.type === 'attack' ? 'Attack' : 'Healing';
        pdf.addText(`${ability.name} (${abilityType})`, 12, [92, 64, 51]);
        pdf.addSpacing(1);

        if (ability.description) {
          const abilityDescLines = pdf.addWrappedText(ability.description, 9);
          pdf.addSpacing(abilityDescLines * 4.5);
        }

        const isAttack = ability.type === 'attack';
        const attackAbility = isAttack ? (ability as AttackAbility) : null;

        if (isAttack && attackAbility) {
          const details: string[] = [];
          details.push(`Damage: ${attackAbility.damageDice}`);
          if (attackAbility.bonusDamageDice) {
            details.push(`Bonus: ${attackAbility.bonusDamageDice}`);
          }
          details.push(`Attack Roll: ${attackAbility.attackRoll ? 'd20' : 'Automatic'}`);
          if (attackAbility.attacks && attackAbility.attacks > 1) {
            details.push(`Attacks: ×${attackAbility.attacks}`);
          }

          details.forEach((detail) => {
            pdf.addIndentedText(`- ${detail}`, 5);
          });
        } else {
          const healingAbility = ability as HealingAbility;
          pdf.addIndentedText(`- Healing: ${healingAbility.healingDice}`, 5);
        }

        pdf.addSpacing(3);
      });
    }
  }

  // Footer on last page
  pdf.addFooter(footerText);

  // Save the PDF
  const fileName = options?.filename || `Character_Sheets_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

// Export the PDFDocumentBuilder class for advanced use cases
export { PDFDocumentBuilder };

