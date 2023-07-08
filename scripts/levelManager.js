export class LevelManager {
    constructor(runtime) {
        this.runtime = runtime;
        this.heroWeaponDamage = 6;
        this.kilnHealth = 100;
        this.runOnce = false;
        this.waypointCount = 0;
        this.waypointEL = null;
        this.heroAttackAnimationLength = 0.5;
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
        }

        if (this.levelState.heroBuyWeapon) {
            if (!this.runOnce) {
                this.runOnce = true;
                this.heroBuyWeapon();
            }
        }

        if (this.levelState.playerBuyClay) {
            this.playerBuyClay();
        }
    }

    heroAddAttackWaypoints() {
        const hero = this.runtime.objects.heroCharacter.getFirstInstance();
        const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
        const placementTiles = this.runtime.objects.placementTile.getAllInstances();
        const kiln = this.runtime.objects.kiln.getFirstInstance();

        // Sort placement tiles by attack order
        placementTiles.sort((a, b) => a.instVars.attackOrder - b.instVars.attackOrder);
        console.log(placementTiles);

        // Add welcome mat as first waypoint
        hero.behaviors.MoveTo.moveToPosition(welcomeMat.x, welcomeMat.y, false);

        // Add placement tiles as waypoints
        for (const placementTile of placementTiles) {
            const [x, y] = placementTile.getImagePoint(placementTile.instVars.attackPoint);
            hero.behaviors.MoveTo.moveToPosition(x, y, false);
        }

        // Add kiln as last waypoint
        hero.behaviors.MoveTo.moveToPosition(kiln.x, kiln.y, false);

        let totalWaypoints = hero.behaviors.MoveTo.getWaypointCount();

        // Add event listener for when hero arrives at a waypoint
        this.waypointEL = e => {
            console.log("waypointCount: " + this.waypointCount);
            if (this.waypointCount !== 0 && this.waypointCount !== totalWaypoints - 1) {
                console.log(placementTiles[this.waypointCount - 1]);
                if (placementTiles[this.waypointCount - 1].instVars.isOccupied) {
                    hero.behaviors.MoveTo.maxSpeed = 0;
                    const object = this.runtime.getInstanceByUid(placementTiles[this.waypointCount - 1].instVars.potUid);
                    this.heroAttack(object, hero);
                }
            }
            this.waypointCount++;
        };
        hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
    }

    heroAttack(object, hero) {
        hero.setAnimation("attack");
        object.behaviors.Sine.isEnabled = true;
        const animationendEL = e => {
            object.instVars.hp -= 1;
            this.heroWeaponDamage--;
            object.behaviors.Sine.isEnabled = false;
            hero.setAnimation("idle");
            // Broken pot
            if (object.instVars.hp <= 0) {
                hero.removeEventListener("animationend", animationendEL);
                object.setAnimation("broken");
                this.heroGems += object.instVars.gems;
                hero.behaviors.MoveTo.maxSpeed = 700;
            }
            // Broken sword
            if (this.heroWeaponDamage === 0) {
                hero.removeEventListener("animationend", animationendEL);
                hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
                hero.setAnimation("idle");
                this.levelState.heroAttack = false;
                object.behaviors.Sine.isEnabled = false;
                this.waypointCount = 0;
                const [x, y] = this.runtime.objects.shopCounter.getFirstInstance().getImagePoint(1);
                hero.behaviors.MoveTo.moveToPosition(x, y);
                hero.behaviors.MoveTo.maxSpeed = 700;
                this.waypointEL = e => {
                    this.runOnce = false;
                    this.levelState.heroBuyWeapon = true;
                    hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
                };
                hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
            // Attack again
            } else if (object.instVars.hp > 0) {
                hero.removeEventListener("animationend", animationendEL);
                this.heroAttack(object, hero);
            }
        };
        hero.addEventListener("animationend", animationendEL);
    }

    heroBuyWeapon() {
        const hero = this.runtime.objects.heroCharacter.getFirstInstance();
        hero.setAnimation("buySword");
        const animationendEL = e => {
            hero.setAnimation("idle");
            this.levelState.heroBuyWeapon = false;
            this.heroWeaponDamage = Math.floor(this.heroGems / 2);
            this.playerGems = this.heroGems;
            this.heroGems = 0;
            console.log("heroWeaponDamage: " + this.heroWeaponDamage);
            console.log("playerGems: " + this.playerGems);
            console.log("heroGems: " + this.heroGems);
            this.levelState.playerBuyClay = true;

            // Hero leaves the shop
            const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
            hero.behaviors.MoveTo.moveToPosition(welcomeMat.x, welcomeMat.y, false); 
            hero.behaviors.MoveTo.moveToPosition(955, 1220, false);
            hero.removeEventListener("animationend", animationendEL);
        };
        hero.addEventListener("animationend", animationendEL);
    }

    playerBuyClay() {
        const clayTrader = this.runtime.objects.clayTrader.getFirstInstance();
        const [x, y] = this.runtime.objects.shopCounter.getFirstInstance().getImagePoint(1);
        clayTrader.behaviors.MoveTo.moveToPosition(welcomeMat.x, welcomeMat.y, false); 
        clayTrader.behaviors.MoveTo.moveToPosition(x, y, false);
        clayTrader.behaviors.MoveTo.maxSpeed = 700;
        this.waypointEL = e => {

            clayTrader.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
        }
        clayTrader.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
    }

    playerCraftPots() {
        
    }

    advanceState() {
        
    }
}