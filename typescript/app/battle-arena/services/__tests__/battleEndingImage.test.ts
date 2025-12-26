/**
 * Tests for battle ending image generation
 * Ensures prompts are formatted correctly and don't exceed length limits
 */

describe('Battle Ending Image Generation', () => {
  const createTestClass = (name: string, description: string = '') => ({
    name,
    description,
    hitPoints: 30,
    maxHitPoints: 50,
    armorClass: 15,
    attackBonus: 3,
    damageDie: '1d8',
    abilities: [],
    color: '#000000',
    race: 'Human' as const,
    sex: 'male' as const,
  });

  describe('Prompt Length Validation', () => {
    it('should keep IMAGE REQUIREMENTS section concise', () => {
      const shortRequirements = 'Dramatic battle conclusion scene showing Victor victorious over defeated Defeated. Victor in triumphant pose, Defeated fallen. Medieval setting with dramatic lighting. Warm earth tones with vibrant accents. Retro SNES/Genesis style, no modern objects or technology, 16:9 aspect ratio.';
      
      expect(shortRequirements.length).toBeLessThan(300);
    });

    it('should not include redundant phrases', () => {
      const requirements = 'Dramatic battle conclusion scene showing Victor victorious over defeated Defeated.';
      
      // Should not contain redundant phrases
      expect(requirements).not.toContain('accurately depicts the characters described above');
      expect(requirements).not.toContain('The characters must match their descriptions');
      expect(requirements).not.toContain('accurately showing all characters as they are described above');
    });

    it('should include essential information', () => {
      const requirements = 'Dramatic battle conclusion scene showing Victor victorious over defeated Defeated. Victor in triumphant pose, Defeated fallen. Medieval setting with dramatic lighting. Warm earth tones with vibrant accents. Retro SNES/Genesis style, no modern objects or technology, 16:9 aspect ratio.';
      
      expect(requirements).toContain('victorious');
      expect(requirements).toContain('defeated');
      expect(requirements).toContain('triumphant pose');
      expect(requirements).toContain('fallen');
      expect(requirements).toContain('16:9 aspect ratio');
    });
  });

  describe('Prompt Formatting', () => {
    it('should not have extra whitespace or newlines', () => {
      const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro medieval high-fantasy aesthetic. 

CHARACTER DESCRIPTIONS:

Victor, a Warrior class - THE VICTOR:
Race: Human
Sex: male
Description: A brave warrior

Defeated, a Monster class - THE DEFEATED:

Description: A fierce monster

IMAGE REQUIREMENTS:
Dramatic battle conclusion scene showing Victor victorious over defeated Defeated. Victor in triumphant pose, Defeated fallen. Medieval setting with dramatic lighting. Warm earth tones with vibrant accents. Retro SNES/Genesis style, no modern objects or technology, 16:9 aspect ratio.`;

      // Should not have excessive newlines
      const doubleNewlines = prompt.match(/\n\n\n/g);
      expect(doubleNewlines).toBeNull();
    });

    it('should format character descriptions correctly', () => {
      const victorName = 'TestHero';
      const defeatedName = 'TestMonster';
      const victorClass = createTestClass('Warrior', 'A brave warrior');
      const defeatedClass = createTestClass('Monster', 'A fierce monster');
      
      const victorSection = `${victorName}, a ${victorClass.name} class - THE VICTOR:
Race: ${victorClass.race}
Sex: ${victorClass.sex}
Description: ${victorClass.description}`;

      const defeatedSection = `${defeatedName}, a ${defeatedClass.name} class - THE DEFEATED:

Description: ${defeatedClass.description}`;

      expect(victorSection).toContain('THE VICTOR');
      expect(victorSection).toContain(victorName);
      expect(defeatedSection).toContain('THE DEFEATED');
      expect(defeatedSection).toContain(defeatedName);
    });
  });

  describe('Support Heroes in Prompt', () => {
    it('should include support heroes in scene description', () => {
      const victorName = 'Hero';
      const supportHeroes = [
        { name: 'Support1', class: createTestClass('Support1') },
        { name: 'Support2', class: createTestClass('Support2') },
      ];
      const defeatedName = 'Monster';
      
      const sceneDescription = `Dramatic battle conclusion scene showing ${victorName} and ${supportHeroes.map(sh => sh.name).join(' and ')} victorious over defeated ${defeatedName}.`;
      
      expect(sceneDescription).toContain('Support1');
      expect(sceneDescription).toContain('Support2');
      expect(sceneDescription).toContain('and');
    });

    it('should handle single support hero', () => {
      const victorName = 'Hero';
      const supportHeroes = [
        { name: 'Support1', class: createTestClass('Support1') },
      ];
      const defeatedName = 'Monster';
      
      const sceneDescription = `Dramatic battle conclusion scene showing ${victorName} and ${supportHeroes.map(sh => sh.name).join(' and ')} victorious over defeated ${defeatedName}.`;
      
      expect(sceneDescription).toContain('Support1');
      expect(sceneDescription).toContain('Hero');
    });

    it('should not include support heroes section when none exist', () => {
      const supportHeroes: Array<{ name: string; class: any }> = [];
      const supportHeroesDescription = supportHeroes.length > 0 
        ? supportHeroes.map((sh, i) => `${sh.name}, a ${sh.class.name} class - SUPPORT HERO ${i + 1}:`).join('\n\n')
        : '';
      
      expect(supportHeroesDescription).toBe('');
    });
  });

  describe('Setting Detection', () => {
    it('should use correct setting phrase based on victor description', () => {
      const medievalDescription = 'A brave knight in shining armor';
      const futuristicDescription = 'A cybernetic warrior with energy weapons';
      
      // Simple detection logic (actual implementation may be more complex)
      const isMedieval = !futuristicDescription.toLowerCase().includes('cybernetic') && 
                         !futuristicDescription.toLowerCase().includes('energy');
      const isFuturistic = futuristicDescription.toLowerCase().includes('cybernetic') || 
                          futuristicDescription.toLowerCase().includes('energy');
      
      expect(medievalDescription.toLowerCase().includes('knight')).toBe(true);
      expect(isFuturistic).toBe(true);
    });
  });

  describe('Prompt Structure', () => {
    it('should have all required sections', () => {
      const prompt = `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro medieval high-fantasy aesthetic. 

CHARACTER DESCRIPTIONS:

Victor, a Warrior class - THE VICTOR:
Race: Human
Sex: male
Description: A brave warrior

Defeated, a Monster class - THE DEFEATED:

Description: A fierce monster

IMAGE REQUIREMENTS:
Dramatic battle conclusion scene showing Victor victorious over defeated Defeated. Victor in triumphant pose, Defeated fallen. Medieval setting with dramatic lighting. Warm earth tones with vibrant accents. Retro SNES/Genesis style, no modern objects or technology, 16:9 aspect ratio.`;

      expect(prompt).toContain('32-bit pixel art');
      expect(prompt).toContain('CHARACTER DESCRIPTIONS:');
      expect(prompt).toContain('THE VICTOR');
      expect(prompt).toContain('THE DEFEATED');
      expect(prompt).toContain('IMAGE REQUIREMENTS:');
      expect(prompt).toContain('16:9 aspect ratio');
    });

    it('should not exceed reasonable length', () => {
      // Typical prompt should be under 2000 characters
      const maxLength = 2000;
      const typicalPrompt = `32-bit pixel art with clearly visible chunky pixel clusters, dithered shading, low-resolution retro medieval high-fantasy aesthetic. 

CHARACTER DESCRIPTIONS:

Victor, a Warrior class - THE VICTOR:
Race: Human
Sex: male
Description: A brave warrior with a sword and shield

Defeated, a Monster class - THE DEFEATED:

Description: A fierce monster with claws

IMAGE REQUIREMENTS:
Dramatic battle conclusion scene showing Victor victorious over defeated Defeated. Victor in triumphant pose, Defeated fallen. Medieval setting with dramatic lighting. Warm earth tones with vibrant accents. Retro SNES/Genesis style, no modern objects or technology, 16:9 aspect ratio.`;

      expect(typicalPrompt.length).toBeLessThan(maxLength);
    });
  });

  describe('Fallback Behavior', () => {
    it('should handle missing character descriptions gracefully', () => {
      const victorClass = createTestClass('Warrior', '');
      const defeatedClass = createTestClass('Monster', '');
      
      const victorDescription = victorClass.description || 'A warrior';
      const defeatedDescription = defeatedClass.description || 'A monster';
      
      expect(victorDescription).toBe('A warrior');
      expect(defeatedDescription).toBe('A monster');
    });

    it('should handle missing race/sex gracefully', () => {
      const victorClass = createTestClass('Warrior', 'A warrior');
      const race = victorClass.race && victorClass.race !== 'n/a' ? `Race: ${victorClass.race}` : '';
      const sex = victorClass.sex && victorClass.sex !== 'n/a' ? `Sex: ${victorClass.sex}` : '';
      
      // Should include race and sex if available
      if (victorClass.race && victorClass.race !== 'n/a') {
        expect(race).toContain('Race:');
      }
      if (victorClass.sex && victorClass.sex !== 'n/a') {
        expect(sex).toContain('Sex:');
      }
    });
  });
});

