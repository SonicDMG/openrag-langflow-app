import jsPDF from 'jspdf';
import { Character, Ability, AttackAbility, HealingAbility, CardSetting } from '../../lib/types';
import { CARD_SETTINGS } from '../../lib/constants';

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
  playerClass: Character;
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
    this.yPosition += 6; // Reduced from 8 to tighten spacing
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

  /**
   * Add an image at a specific position (for two-column layouts)
   */
  async addImageAtPosition(url: string, x: number, y: number, maxWidth: number, maxHeight: number = 60): Promise<{ width: number; height: number }> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => {
          try {
            let imgWidth = img.width;
            let imgHeight = img.height;
            const aspectRatio = imgWidth / imgHeight;

            if (imgWidth > maxWidth) {
              imgWidth = maxWidth;
              imgHeight = imgWidth / aspectRatio;
            }
            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = imgHeight * aspectRatio;
            }

            this.doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
            resolve({ width: imgWidth, height: imgHeight });
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = reject;
        img.src = url;
      });
    } catch (error) {
      console.warn('Failed to load image for PDF:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Add text at a specific X position (for two-column layouts)
   */
  addTextAtX(text: string, x: number, fontSize: number = 11, color: [number, number, number] = [92, 64, 51]): void {
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(sanitizedText, x, this.yPosition);
    this.yPosition += 6;
  }

  /**
   * Add wrapped text at a specific X position with max width (for two-column layouts)
   */
  addWrappedTextAtX(
    text: string,
    x: number,
    maxWidth: number,
    fontSize: number,
    color: [number, number, number] = [92, 64, 51]
  ): number {
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'normal');
    const lines = this.doc.splitTextToSize(sanitizedText, maxWidth);
    lines.forEach((line: string) => {
      this.doc.text(line, x, this.yPosition);
      this.yPosition += fontSize * 0.5;
    });
    return lines.length;
  }

  /**
   * Add section heading at a specific X position (for two-column layouts)
   * Does NOT advance yPosition - caller must manage positioning
   */
  addSectionHeadingAtX(text: string, x: number, y: number, fontSize: number, color: [number, number, number] = [139, 111, 71]): void {
    const sanitizedText = sanitizeTextForPDF(text);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(color[0], color[1], color[2]);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(sanitizedText, x, y);
  }

  /**
   * Add a simple table with two columns (label and value)
   */
  addTable(data: Array<{ label: string; value: string }>, columns: number = 2): void {
    this.checkPageBreak(data.length * 6 + 10);
    
    const cellPadding = 2;
    const rowHeight = 6;
    const columnWidth = this.contentWidth / columns;
    
    // Draw table rows
    data.forEach((row, index) => {
      const columnIndex = index % columns;
      const rowIndex = Math.floor(index / columns);
      const x = this.margin + (columnIndex * columnWidth);
      const y = this.yPosition + (rowIndex * rowHeight);
      
      // Draw cell border
      this.doc.setDrawColor(139, 111, 71);
      this.doc.setLineWidth(0.1);
      this.doc.rect(x, y, columnWidth, rowHeight);
      
      // Add label (bold)
      this.doc.setFontSize(9);
      this.doc.setTextColor(92, 64, 51);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(row.label + ':', x + cellPadding, y + rowHeight - cellPadding);
      
      // Add value (normal)
      this.doc.setFont('helvetica', 'normal');
      const labelWidth = this.doc.getTextWidth(row.label + ': ');
      this.doc.text(row.value, x + cellPadding + labelWidth, y + rowHeight - cellPadding);
    });
    
    // Move Y position past the table
    const totalRows = Math.ceil(data.length / columns);
    this.yPosition += totalRows * rowHeight + 3;
  }

  /**
   * Add text with mixed font styles on the same line
   */
  addMixedStyleText(segments: Array<{ text: string; fontSize: number; bold?: boolean; color?: [number, number, number] }>): void {
    this.checkPageBreak(15);
    let xPosition = this.margin;
    
    segments.forEach((segment) => {
      const sanitizedText = sanitizeTextForPDF(segment.text);
      this.doc.setFontSize(segment.fontSize);
      this.doc.setTextColor(segment.color?.[0] || 92, segment.color?.[1] || 64, segment.color?.[2] || 51);
      this.doc.setFont('helvetica', segment.bold ? 'bold' : 'normal');
      this.doc.text(sanitizedText, xPosition, this.yPosition);
      xPosition += this.doc.getTextWidth(sanitizedText);
    });
    
    // Minimal spacing after mixed text (just enough for next line)
    this.yPosition += 6;
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

  // Title with type on same line
  const typeLabel = characterType || 'Character';
  
  const titleSegments = [
    { text: characterName, fontSize: 22, bold: true, color: [92, 64, 51] as [number, number, number] }
  ];
  
  if (typeLabel) {
    titleSegments.push({ text: ' - ', fontSize: 16, bold: false, color: [92, 64, 51] as [number, number, number] });
    titleSegments.push({ text: typeLabel, fontSize: 16, bold: false, color: [92, 64, 51] as [number, number, number] });
  }
  
  pdf.addMixedStyleText(titleSegments);

  // Description Section (no spacing after title)
  const description = playerClass.description || `A character named ${characterName}.`;
  pdf.addWrappedText(description, 10);
  pdf.addSpacing(4);

  // Image Generation Section
  if (imageUrl || imagePrompt || imageSetting) {
    // Section header above the two-column layout
    pdf.addSectionHeading('IMAGE GENERATION DETAILS', 13);
    pdf.addSpacing(-3); // Tighten space after heading
    
    const startY = pdf.getYPosition();
    const leftColumnX = pdf.getMargin();
    const rightColumnX = pdf.getMargin() + 75; // Start right column after image
    const rightColumnWidth = pdf['contentWidth'] - 80; // Width for right column text
    
    let imageHeight = 0;
    
    // Left column: Character Image
    if (imageUrl) {
      const imgDimensions = await pdf.addImageAtPosition(imageUrl, leftColumnX, startY, 70, 70);
      imageHeight = imgDimensions.height;
    }
    
    // Right column: Generation Details (no header, just content)
    if (imagePrompt || imageSetting) {
      pdf.setYPosition(startY); // Start at same Y as image
      
      if (imageSetting) {
        const settingConfig = CARD_SETTINGS[imageSetting as CardSetting];
        const settingName = settingConfig ? settingConfig.name : imageSetting;
        pdf.addTextAtX(`Setting/Theme: ${settingName}`, rightColumnX, 9);
        if (settingConfig) {
          pdf.addWrappedTextAtX(settingConfig.description, rightColumnX, rightColumnWidth, 8);
        }
        pdf.addSpacing(2);
      }
      
      if (imagePrompt) {
        pdf.addTextAtX('Generation Prompt:', rightColumnX, 9);
        pdf.addSpacing(1);
        pdf.addWrappedTextAtX(imagePrompt, rightColumnX, rightColumnWidth, 8);
      }
    }
    
    // Move Y position past the tallest column
    const detailsHeight = pdf.getYPosition() - startY;
    pdf.setYPosition(startY + Math.max(imageHeight, detailsHeight) + 8);
  }

  // Character Details & Statistics in a combined table
  pdf.addSectionHeading('CHARACTER DETAILS & STATISTICS', 13);
  pdf.addSpacing(-3); // Reduce space after heading to bring table closer
  const raceValue = playerClass.race && playerClass.race !== 'n/a' ? playerClass.race : 'n/a';
  const sexValue = playerClass.sex && playerClass.sex !== 'n/a' ? playerClass.sex : 'n/a';
  
  const tableData = [
    { label: 'Race', value: raceValue },
    { label: 'Sex', value: sexValue },
    { label: 'HP', value: `${playerClass.hitPoints}/${playerClass.maxHitPoints}` },
    { label: 'AC', value: `${playerClass.armorClass}` },
    { label: 'ATK', value: `+${playerClass.attackBonus}` },
    { label: 'DMG', value: playerClass.damageDie },
  ];

  if (playerClass.meleeDamageDie) {
    tableData.push({ label: 'Melee', value: playerClass.meleeDamageDie });
  }
  if (playerClass.rangedDamageDie) {
    tableData.push({ label: 'Ranged', value: playerClass.rangedDamageDie });
  }

  pdf.addTable(tableData, 2);
  pdf.addSpacing(5); // Add space after table before abilities

  // Abilities Section
  if (playerClass.abilities && playerClass.abilities.length > 0) {
    pdf.addSectionHeading('ABILITIES', 14);

    playerClass.abilities.forEach((ability) => {
      pdf.checkPageBreak(20);
      
      // Ability name (reduced font size from 12 to 10)
      const abilityType = ability.type === 'attack' ? 'Attack' : 'Healing';
      pdf.addText(`${ability.name} (${abilityType})`, 10, [92, 64, 51]);

      // Ability description (no spacing after name, tighter after description)
      if (ability.description) {
        const abilityDescLines = pdf.addWrappedText(ability.description, 9);
        pdf.addSpacing(abilityDescLines * 3); // Reduced from 4.5 to 3
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

      pdf.addSpacing(2); // Reduced from 3 to 2
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

    // Title with type on same line
    const typeLabel = characterType || 'Character';
    
    const titleSegments = [
      { text: characterName, fontSize: 22, bold: true, color: [92, 64, 51] as [number, number, number] }
    ];
    
    if (typeLabel) {
      titleSegments.push({ text: ' - ', fontSize: 16, bold: false, color: [92, 64, 51] as [number, number, number] });
      titleSegments.push({ text: typeLabel, fontSize: 16, bold: false, color: [92, 64, 51] as [number, number, number] });
    }
    
    pdf.addMixedStyleText(titleSegments);

    // Description Section (no spacing after title)
    const description = playerClass.description || `A character named ${characterName}.`;
    pdf.addWrappedText(description, 10);
    pdf.addSpacing(4);

    // Image Generation Section
    if (imageUrl || imagePrompt || imageSetting) {
      // Section header above the two-column layout
      pdf.addSectionHeading('IMAGE GENERATION DETAILS', 13);
      pdf.addSpacing(-3); // Tighten space after heading
      
      const startY = pdf.getYPosition();
      const leftColumnX = pdf.getMargin();
      const rightColumnX = pdf.getMargin() + 75; // Start right column after image
      const rightColumnWidth = pdf['contentWidth'] - 80; // Width for right column text
      
      let imageHeight = 0;
      
      // Left column: Character Image
      if (imageUrl) {
        const imgDimensions = await pdf.addImageAtPosition(imageUrl, leftColumnX, startY, 70, 70);
        imageHeight = imgDimensions.height;
      }
      
      // Right column: Generation Details (no header, just content)
      if (imagePrompt || imageSetting) {
        pdf.setYPosition(startY); // Start at same Y as image
        
        if (imageSetting) {
          const settingConfig = CARD_SETTINGS[imageSetting as CardSetting];
          const settingName = settingConfig ? settingConfig.name : imageSetting;
          pdf.addTextAtX(`Setting/Theme: ${settingName}`, rightColumnX, 9);
          if (settingConfig) {
            pdf.addWrappedTextAtX(settingConfig.description, rightColumnX, rightColumnWidth, 8);
          }
          pdf.addSpacing(2);
        }
        
        if (imagePrompt) {
          pdf.addTextAtX('Generation Prompt:', rightColumnX, 9);
          pdf.addSpacing(1);
          pdf.addWrappedTextAtX(imagePrompt, rightColumnX, rightColumnWidth, 8);
        }
      }
      
      // Move Y position past the tallest column
      const detailsHeight = pdf.getYPosition() - startY;
      pdf.setYPosition(startY + Math.max(imageHeight, detailsHeight) + 8);
    }

    // Character Details & Statistics in a combined table
    pdf.addSectionHeading('CHARACTER DETAILS & STATISTICS', 13);
    pdf.addSpacing(-3); // Reduce space after heading to bring table closer
    const raceValue = playerClass.race && playerClass.race !== 'n/a' ? playerClass.race : 'n/a';
    const sexValue = playerClass.sex && playerClass.sex !== 'n/a' ? playerClass.sex : 'n/a';
    
    const tableData = [
      { label: 'Race', value: raceValue },
      { label: 'Sex', value: sexValue },
      { label: 'HP', value: `${playerClass.hitPoints}/${playerClass.maxHitPoints}` },
      { label: 'AC', value: `${playerClass.armorClass}` },
      { label: 'ATK', value: `+${playerClass.attackBonus}` },
      { label: 'DMG', value: playerClass.damageDie },
    ];

    if (playerClass.meleeDamageDie) {
      tableData.push({ label: 'Melee', value: playerClass.meleeDamageDie });
    }
    if (playerClass.rangedDamageDie) {
      tableData.push({ label: 'Ranged', value: playerClass.rangedDamageDie });
    }

    pdf.addTable(tableData, 2);
    pdf.addSpacing(5); // Add space after table before abilities

    // Abilities Section
    if (playerClass.abilities && playerClass.abilities.length > 0) {
      pdf.addSectionHeading('ABILITIES', 14);

      playerClass.abilities.forEach((ability) => {
        pdf.checkPageBreak(20);
        
        const abilityType = ability.type === 'attack' ? 'Attack' : 'Healing';
        pdf.addText(`${ability.name} (${abilityType})`, 10, [92, 64, 51]);

        if (ability.description) {
          const abilityDescLines = pdf.addWrappedText(ability.description, 9);
          pdf.addSpacing(abilityDescLines * 3);
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

        pdf.addSpacing(2); // Reduced from 3 to 2
      });
    }
  }

  // Footer on last page
  pdf.addFooter(footerText);

  // Save the PDF
  const fileName = options?.filename || `Character_Sheets_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

/**
 * Generate a character PDF as a Blob for programmatic use (e.g., uploading to OpenRAG)
 *
 * @param options - Character data and export options
 * @returns Promise with PDF blob and filename
 *
 * @example
 * ```ts
 * const { blob, filename } = await generateCharacterPDFBlob({
 *   playerClass: myCharacter,
 *   characterName: "Gandalf",
 *   imageUrl: "/cdn/monsters/123/280x200.png",
 *   characterType: "Custom Hero"
 * });
 * // Use blob for uploading to services
 * ```
 */
export async function generateCharacterPDFBlob({
  playerClass,
  characterName,
  imageUrl,
  characterType,
  filename,
  footerText = '2025 OpenRAG',
  imagePrompt,
  imageSetting,
}: CharacterPDFExportOptions): Promise<{ blob: Blob; filename: string }> {
  const pdf = new PDFDocumentBuilder('portrait', 'a4');

  // Title with type on same line
  const typeLabel = characterType || 'Character';
  
  const titleSegments = [
    { text: characterName, fontSize: 22, bold: true, color: [92, 64, 51] as [number, number, number] }
  ];
  
  if (typeLabel) {
    titleSegments.push({ text: ' - ', fontSize: 16, bold: false, color: [92, 64, 51] as [number, number, number] });
    titleSegments.push({ text: typeLabel, fontSize: 16, bold: false, color: [92, 64, 51] as [number, number, number] });
  }
  
  pdf.addMixedStyleText(titleSegments);

  // Description Section (no spacing after title)
  const charDescription = playerClass.description || `A character named ${characterName}.`;
  pdf.addWrappedText(charDescription, 10);
  pdf.addSpacing(4);

  // Image Generation Section
  if (imageUrl || imagePrompt || imageSetting) {
    // Section header above the two-column layout
    pdf.addSectionHeading('IMAGE GENERATION DETAILS', 13);
    pdf.addSpacing(-3); // Tighten space after heading
    
    const startY = pdf.getYPosition();
    const leftColumnX = pdf.getMargin();
    const rightColumnX = pdf.getMargin() + 75; // Start right column after image
    const rightColumnWidth = pdf['contentWidth'] - 80; // Width for right column text
    
    let imageHeight = 0;
    
    // Left column: Character Image
    if (imageUrl) {
      const imgDimensions = await pdf.addImageAtPosition(imageUrl, leftColumnX, startY, 70, 70);
      imageHeight = imgDimensions.height;
    }
    
    // Right column: Generation Details (no header, just content)
    if (imagePrompt || imageSetting) {
      pdf.setYPosition(startY); // Start at same Y as image
      
      if (imageSetting) {
        const settingConfig = CARD_SETTINGS[imageSetting as CardSetting];
        const settingName = settingConfig ? settingConfig.name : imageSetting;
        pdf.addTextAtX(`Setting/Theme: ${settingName}`, rightColumnX, 9);
        if (settingConfig) {
          pdf.addWrappedTextAtX(settingConfig.description, rightColumnX, rightColumnWidth, 8);
        }
        pdf.addSpacing(2);
      }
      
      if (imagePrompt) {
        pdf.addTextAtX('Generation Prompt:', rightColumnX, 9);
        pdf.addSpacing(1);
        pdf.addWrappedTextAtX(imagePrompt, rightColumnX, rightColumnWidth, 8);
      }
    }
    
    // Move Y position past the tallest column
    const detailsHeight = pdf.getYPosition() - startY;
    pdf.setYPosition(startY + Math.max(imageHeight, detailsHeight) + 8);
  }

  // Character Details & Statistics in a combined table
  pdf.addSectionHeading('CHARACTER DETAILS & STATISTICS', 13);
  pdf.addSpacing(-3); // Reduce space after heading to bring table closer
  const raceValue = playerClass.race && playerClass.race !== 'n/a' ? playerClass.race : 'n/a';
  const sexValue = playerClass.sex && playerClass.sex !== 'n/a' ? playerClass.sex : 'n/a';
  
  const tableData = [
    { label: 'Race', value: raceValue },
    { label: 'Sex', value: sexValue },
    { label: 'HP', value: `${playerClass.hitPoints}/${playerClass.maxHitPoints}` },
    { label: 'AC', value: `${playerClass.armorClass}` },
    { label: 'ATK', value: `+${playerClass.attackBonus}` },
    { label: 'DMG', value: playerClass.damageDie },
  ];

  if (playerClass.meleeDamageDie) {
    tableData.push({ label: 'Melee', value: playerClass.meleeDamageDie });
  }
  if (playerClass.rangedDamageDie) {
    tableData.push({ label: 'Ranged', value: playerClass.rangedDamageDie });
  }

  pdf.addTable(tableData, 2);
  pdf.addSpacing(5); // Add space after table before abilities

  // Abilities Section
  if (playerClass.abilities && playerClass.abilities.length > 0) {
    pdf.addSectionHeading('ABILITIES', 14);

    playerClass.abilities.forEach((ability) => {
      pdf.checkPageBreak(20);
      
      // Ability name (reduced font size from 12 to 10)
      const abilityType = ability.type === 'attack' ? 'Attack' : 'Healing';
      pdf.addText(`${ability.name} (${abilityType})`, 10, [92, 64, 51]);

      // Ability description (no spacing after name, tighter after description)
      if (ability.description) {
        const abilityDescLines = pdf.addWrappedText(ability.description, 9);
        pdf.addSpacing(abilityDescLines * 3); // Reduced from 4.5 to 3
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

      pdf.addSpacing(2); // Reduced from 3 to 2
    });
  }

  // Footer
  pdf.addFooter(footerText);

  // Generate blob instead of downloading
  const blob = pdf.getDocument().output('blob');
  const fileName = filename || `${characterName.replace(/[^a-z0-9]/gi, '_')}_Character_Sheet.pdf`;
  
  return { blob, filename: fileName };
}

// Export the PDFDocumentBuilder class for advanced use cases
export { PDFDocumentBuilder };

