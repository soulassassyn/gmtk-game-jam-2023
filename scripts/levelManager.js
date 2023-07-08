export class LevelManager {
    constructor(runtime) {
        this.runtime = runtime;
        this.heroWeaponDamage = 0;
        this.kilnHealth = 100;
        this.runOnce = false;
        this.levelState = {
            heroAttack: false,
            heroBuyWeapon: false,
            playerBuyClay: false,
            playerCraftPots: false,
            victory: false,
            lose: false,
        }
        this.playerInventory = {
            clay: {
                [this.runtime.potManager.clayTypes.EARTHENWARE]: 0,
                [this.runtime.potManager.clayTypes.STONEWARE]: 0,
                [this.runtime.potManager.clayTypes.PORCELAIN]: 0,
            },
            pots: [],
        };
        this.playerGems = 0;
        this.heroGems = 0;
    }

    update() {
        if (this.levelState.victory || this.levelState.lose) {
            
        }

        if (this.levelState.heroAttack) {
            if (!this.runOnce) {
                this.runOnce = true;
                this.heroAddAttackWaypoints();
            }
            this.heroAttack();
        }
    }

    heroAddAttackWaypoints() {
        const hero = this.runtime.objects.heroCharacter.getFirstInstance();
        const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
        const placementTiles = this.runtime.objects.placementTile.getAllInstances();
        const kiln = this.runtime.objects.kiln.getFirstInstance();

        // Sort placement tiles by attack order
        placementTiles.sort((a, b) => a.instVars.attackOrder - b.instVars.attackOrder);

        // Add welcome mat as first waypoint
        hero.behaviors.MoveTo.moveToPosition(welcomeMat.x, welcomeMat.y, false);

        // Add placement tiles as waypoints
        for (const placementTile of placementTiles) {
            const [x, y] = placementTile.getImagePoint(placementTile.instVars.attackPoint);
            hero.behaviors.MoveTo.moveToPosition(x, y, false);
        }

        // Add kiln as last waypoint
        hero.behaviors.MoveTo.moveToPosition(kiln.x, kiln.y, false);

        console.log(hero.behaviors.MoveTo.getWaypointCount());
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
