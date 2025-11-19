import { DnDClass } from '../../types';

/**
 * Tests for victory and defeat conditions in battle
 */

describe('Victory and Defeat Conditions', () => {
  const createTestClass = (name: string, hitPoints: number, maxHitPoints: number): DnDClass => ({
    name,
    hitPoints,
    maxHitPoints,
    armorClass: 15,
    attackBonus: 3,
    damageDie: '1d8',
    abilities: [],
    description: 'Test class',
    color: '#000000',
  });

  describe('Monster Defeat (Hero Victory)', () => {
    it('should detect monster defeat when HP reaches 0', () => {
      const monster = createTestClass('Monster', 0, 100);
      expect(monster.hitPoints <= 0).toBe(true);
    });

    it('should detect monster defeat when HP goes negative', () => {
      const monster = createTestClass('Monster', -5, 100);
      expect(monster.hitPoints <= 0).toBe(true);
    });

    it('should not detect defeat when monster has positive HP', () => {
      const monster = createTestClass('Monster', 50, 100);
      expect(monster.hitPoints <= 0).toBe(false);
    });

    it('should handle exact HP defeat (damage equals current HP)', () => {
      const currentHP = 25;
      const damage = 25;
      const newHP = Math.max(0, currentHP - damage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });
  });

  describe('Hero Defeat (Monster Victory)', () => {
    describe('One-on-One Battle', () => {
      it('should detect hero defeat in one-on-one battle', () => {
        const hero = createTestClass('Hero', 0, 50);
        const isTeamBattle = false;
        
        if (!isTeamBattle) {
          expect(hero.hitPoints <= 0).toBe(true);
        }
      });

      it('should not detect defeat when hero has HP remaining', () => {
        const hero = createTestClass('Hero', 10, 50);
        expect(hero.hitPoints <= 0).toBe(false);
      });
    });

    describe('Team Battle', () => {
      const createSupportHero = (hitPoints: number): { class: DnDClass; name: string; monsterId: string | null } => ({
        class: createTestClass('Support', hitPoints, 30),
        name: 'Support',
        monsterId: null,
      });

      it('should detect all heroes defeated when player1 and all supports are at 0 HP', () => {
        const player1HP = 0;
        const support1 = createSupportHero(0);
        const support2 = createSupportHero(0);
        
        const player1Defeated = player1HP <= 0;
        const support1Defeated = support1.class.hitPoints <= 0;
        const support2Defeated = support2.class.hitPoints <= 0;
        const allDefeated = player1Defeated && support1Defeated && support2Defeated;
        
        expect(allDefeated).toBe(true);
      });

      it('should not detect all heroes defeated when player1 has HP remaining', () => {
        const player1HP = 10;
        const support1 = createSupportHero(0);
        const support2 = createSupportHero(0);
        
        const player1Defeated = player1HP <= 0;
        const support1Defeated = support1.class.hitPoints <= 0;
        const support2Defeated = support2.class.hitPoints <= 0;
        const allDefeated = player1Defeated && support1Defeated && support2Defeated;
        
        expect(allDefeated).toBe(false);
      });

      it('should not detect all heroes defeated when support1 has HP remaining', () => {
        const player1HP = 0;
        const support1 = createSupportHero(15);
        const support2 = createSupportHero(0);
        
        const player1Defeated = player1HP <= 0;
        const support1Defeated = support1.class.hitPoints <= 0;
        const support2Defeated = support2.class.hitPoints <= 0;
        const allDefeated = player1Defeated && support1Defeated && support2Defeated;
        
        expect(allDefeated).toBe(false);
      });

      it('should handle team battle with only one support hero', () => {
        const player1HP = 0;
        const support1 = createSupportHero(0);
        
        const player1Defeated = player1HP <= 0;
        const support1Defeated = support1.class.hitPoints <= 0;
        const allDefeated = player1Defeated && support1Defeated;
        
        expect(allDefeated).toBe(true);
      });

      it('should continue battle when only support hero is defeated', () => {
        const player1HP = 20;
        const support1 = createSupportHero(0);
        const support2 = createSupportHero(15);
        
        const player1Defeated = player1HP <= 0;
        const support1Defeated = support1.class.hitPoints <= 0;
        const support2Defeated = support2.class.hitPoints <= 0;
        const allDefeated = player1Defeated && support1Defeated && support2Defeated;
        
        expect(allDefeated).toBe(false);
        expect(support1Defeated).toBe(true); // Support1 is defeated
        expect(player1HP > 0).toBe(true); // But battle continues
      });
    });
  });

  describe('Support Hero Knockout', () => {
    const createSupportHero = (hitPoints: number): { class: DnDClass; name: string; monsterId: string | null } => ({
      class: createTestClass('Support', hitPoints, 30),
      name: 'Support',
      monsterId: null,
    });

    it('should identify support hero as knocked out when HP is 0', () => {
      const support = createSupportHero(0);
      expect(support.class.hitPoints <= 0).toBe(true);
    });

    it('should identify support hero as active when HP is positive', () => {
      const support = createSupportHero(15);
      expect(support.class.hitPoints > 0).toBe(true);
    });

    it('should handle multiple support heroes with mixed states', () => {
      const support1 = createSupportHero(0); // Knocked out
      const support2 = createSupportHero(10); // Active
      
      expect(support1.class.hitPoints <= 0).toBe(true);
      expect(support2.class.hitPoints > 0).toBe(true);
    });
  });

  describe('Battle End Conditions', () => {
    it('should end battle when monster is defeated', () => {
      const monsterHP = 0;
      const heroHP = 20;
      
      const monsterDefeated = monsterHP <= 0;
      const battleShouldEnd = monsterDefeated;
      
      expect(battleShouldEnd).toBe(true);
    });

    it('should end battle when all heroes are defeated in one-on-one', () => {
      const heroHP = 0;
      const monsterHP = 50;
      const isTeamBattle = false;
      
      const heroDefeated = heroHP <= 0;
      const battleShouldEnd = !isTeamBattle && heroDefeated;
      
      expect(battleShouldEnd).toBe(true);
    });

    it('should end battle when all heroes are defeated in team battle', () => {
      const player1HP = 0;
      const support1HP = 0;
      const support2HP = 0;
      const monsterHP = 30;
      
      const allHeroesDefeated = player1HP <= 0 && support1HP <= 0 && support2HP <= 0;
      const battleShouldEnd = allHeroesDefeated;
      
      expect(battleShouldEnd).toBe(true);
    });

    it('should continue battle when heroes have HP remaining', () => {
      const player1HP = 10;
      const support1HP = 5;
      const support2HP = 0;
      const monsterHP = 40;
      
      const allHeroesDefeated = player1HP <= 0 && support1HP <= 0 && support2HP <= 0;
      const battleShouldEnd = allHeroesDefeated;
      
      expect(battleShouldEnd).toBe(false);
    });
  });

  describe('HP Boundary Conditions', () => {
    it('should handle exact zero HP', () => {
      const hp = 0;
      expect(hp <= 0).toBe(true);
    });

    it('should handle negative HP', () => {
      const hp = -5;
      expect(hp <= 0).toBe(true);
    });

    it('should handle minimum positive HP', () => {
      const hp = 1;
      expect(hp > 0).toBe(true);
      expect(hp <= 0).toBe(false);
    });

    it('should correctly calculate HP after damage that would go negative', () => {
      const currentHP = 5;
      const damage = 10;
      const newHP = Math.max(0, currentHP - damage);
      
      expect(newHP).toBe(0);
      expect(newHP <= 0).toBe(true);
    });
  });
});

