export class LevelManager {
    constructor() {
        this.heroWeaponDamage = 0;
        this.kilnHealth = 100;
        this.levelState = 'HeroAttacking';
        this.playerInventory = {
            clay: {
                [ClayTypes.EARTHENWARE]: 0,
                [ClayTypes.STONEWARE]: 0,
                [ClayTypes.PORCELAIN]: 0,
            },
            pots: [],
        };
        this.playerGems = 0;
        this.heroGems = 0;
    }

    heroAttack() {
        
    }

    heroBuyWeapon() {
        
    }

    playerBuyClay(clayType, quantity) {
        
    }

    playerCraftPots() {
        
    }

    advanceState() {
        
    }
}
