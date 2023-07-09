export class LevelManager {
    constructor(runtime) {
        this.runtime = runtime;
        this.heroWeaponDamage = 6;
        this.kilnHealth = 10;
        this.kilnLevel = 1;
        this.runOnce = false;
        this.waypointCount = 0;
        this.waypointEL = null;
        this.heroAttackAnimationLength = 0.5;
        this.startTime = 60;
        this.resetTime = 60;

        this.levelState = {
            heroAttack: false,
            heroBuyWeapon: false,
            playerBuyClay: false,
            playerCraftPots: false,
            victory: false,
            lose: false,
        }

        this.clayShopTotals = {
            [this.runtime.potManager.clayTypes.EARTHENWARE]: 0,
            [this.runtime.potManager.clayTypes.STONEWARE]: 0,
            [this.runtime.potManager.clayTypes.PORCELAIN]: 0,
            totalGemCostAmount: 0,
        };

        this.playerInventory = {
            [this.runtime.potManager.clayTypes.EARTHENWARE]: 0,
            [this.runtime.potManager.clayTypes.STONEWARE]: 0,
            [this.runtime.potManager.clayTypes.PORCELAIN]: 0,
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
            if (!this.runOnce) {
                this.runOnce = true;
                this.playerBuyClay();
            }
        }

        if (this.levelState.playerCraftPots) {
            if (!this.runOnce) {
                this.runOnce = true;
                this.playerCraftPots();
            }

            if (this.timerOn) {
                this.startTime -= this.runtime.dt;
                this.craftingTimer();
            }
        }
    }

    heroAddAttackWaypoints() {
        const hero = this.runtime.objects.heroCharacter.getFirstInstance();
        const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
        const placementTiles = this.runtime.objects.placementTile.getAllInstances();
        const kiln = this.runtime.objects.kiln.getFirstInstance();
        hero.setAnimation("walk");

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

        let totalWaypoints = hero.behaviors.MoveTo.getWaypointCount();

        // Add event listener for when hero arrives at a waypoint
        this.waypointEL = e => {
            if (this.waypointCount !== 0 && this.waypointCount !== totalWaypoints - 1) {
                if (placementTiles[this.waypointCount - 1].instVars.isOccupied) {
                    hero.behaviors.MoveTo.maxSpeed = 0;
                    const object = this.runtime.getInstanceByUid(placementTiles[this.waypointCount - 1].instVars.potUid);
                    this.heroAttack(object, hero);
                }
            }
            if (this.waypointCount === totalWaypoints - 1) {
                hero.behaviors.MoveTo.maxSpeed = 0;
                const kiln = this.runtime.objects.kiln.getFirstInstance();
                this.heroAttack(kiln, hero);
            }
            this.waypointCount++;
        };
        hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
    }

    heroAttack(object, hero) {
        hero.setAnimation("attack");
        this.environmentDamage();
        object.behaviors.Sine.isEnabled = true;
        const animationendEL = e => {
            object.instVars.hp -= 1;
            this.heroWeaponDamage--;
            this.environmentDamage(false);
            object.behaviors.Sine.isEnabled = false;
            hero.setAnimation("idle");
            // Broken pot
            if (object.instVars.hp <= 0) {
                hero.removeEventListener("animationend", animationendEL);
                hero.setAnimation("walk");
                object.setAnimation("broken");

                const gem = this.runtime.objects.Gem.createInstance("interactive", object.x, object.y - 150);
                gem.height = gem.height * 0.5;
                gem.width = gem.width * 0.5;
                gem.behaviors.Tween.startTween("scale", [1, 1], 0.5, "linear");
                gem.behaviors.Tween.startTween("position", [gem.x, gem.y - 100], 0.5, "linear", { destroyOnComplete: true });

                this.heroGems += object.instVars.gems;
                hero.behaviors.MoveTo.maxSpeed = 700;
            }
            // Broken sword
            if (this.heroWeaponDamage === 0) {
                hero.removeEventListener("animationend", animationendEL);
                hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
                hero.setAnimation("walk");
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

    environmentDamage(on = true) {
        const grandpa = this.runtime.objects.grandpa.getFirstInstance();
        const playerCharacter = this.runtime.objects.playerCharacter.getFirstInstance();
        const enviroObjects = this.runtime.objects.FX_Interactive_Environment.getAllInstances();
        if (on) {
            this.runtime.callFunction("camShake");
            grandpa.setAnimation("scared");
            playerCharacter.setAnimation("scared");
            for (const object of enviroObjects) {
                object.behaviors.Sine.isEnabled = true;
                object.behaviors.Sine2.isEnabled = true;
                object.behaviors.Sine3.isEnabled = true;
            }
        } else {
            grandpa.setAnimation("idle");
            playerCharacter.setAnimation("idle");
            for (const object of enviroObjects) {
                object.behaviors.Sine.isEnabled = false;
                object.behaviors.Sine2.isEnabled = false;
                object.behaviors.Sine3.isEnabled = false;
            }
        }
    }

    heroBuyWeapon() {
        const hero = this.runtime.objects.heroCharacter.getFirstInstance();
        hero.setAnimation("buySword");
        const animationendEL = e => {
            hero.setAnimation("walk");
            this.levelState.heroBuyWeapon = false;
            this.heroWeaponDamage = Math.floor(this.heroGems / 2);
            this.playerGems = this.heroGems;
            this.heroGems = 0;
            
            // Hero leaves the shop
            const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
            hero.behaviors.MoveTo.moveToPosition(welcomeMat.x, welcomeMat.y, false); 
            hero.behaviors.MoveTo.moveToPosition(905, 1351, false);
            hero.removeEventListener("animationend", animationendEL);
            
            this.waypointEL = e => {
                this.runOnce = false;
                this.levelState.playerBuyClay = true;
                hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
            }
            hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
        };
        hero.addEventListener("animationend", animationendEL);
    }

    playerBuyClay() {
        this.runtime.callFunction("toggleClayTraderUIControls");
        const cinematicStandIn = this.runtime.objects.cinematics.getFirstInstance(); // Replace this with actual cinematic object
        cinematicStandIn.setAnimation("merchantEntrance");
        let clayTraderUI = this.runtime.layout.getLayer("clayTraderUI");
        let cinematic = this.runtime.layout.getLayer("cinematics");
        cinematic.isVisible = true;
        const animationendEL = e => {
            cinematic.isVisible = false;
            clayTraderUI.isVisible = true;
            clayTraderUI.isInteractive = true;
            cinematicStandIn.removeEventListener("animationend", animationendEL);
        };
        cinematicStandIn.addEventListener("animationend", animationendEL);
    }

    async adjustClayShopAmount(clayType, change) {
        const totalEarthen = this.runtime.objects.totalEarthen.getFirstInstance();
        const totalStoneware = this.runtime.objects.totalStone.getFirstInstance();
        const totalPorcelain = this.runtime.objects.totalPorcelain.getFirstInstance();
        const totalGemCost = this.runtime.objects.totalGemCost.getFirstInstance();
        const tempCostCheck = this.clayShopTotals.totalGemCostAmount
        let clayCost;

        if (clayType === this.runtime.potManager.clayTypes.EARTHENWARE) {
            clayCost = this.runtime.potManager.clayCosts.EARTHENWARE;
            if (this.clayShopTotals[clayType] === 0 && change === -1) return;
        } else if (clayType === this.runtime.potManager.clayTypes.STONEWARE) {
            clayCost = this.runtime.potManager.clayCosts.STONEWARE;
            if (this.clayShopTotals[clayType] === 0 && change === -1) return;
        } else if (clayType === this.runtime.potManager.clayTypes.PORCELAIN) {
            clayCost = this.runtime.potManager.clayCosts.PORCELAIN;
            if (this.clayShopTotals[clayType] === 0 && change === -1) return;
        }

        // Adjust the total amount and cost
        this.clayShopTotals.totalGemCostAmount += change * clayCost;
        if (this.clayShopTotals.totalGemCostAmount > this.playerGems) {
            this.clayShopTotals.totalGemCostAmount = tempCostCheck;
            const totalPlayerGems = this.runtime.objects.totalPlayerGems.getFirstInstance();
            const tweenState = totalPlayerGems.behaviors.Tween.startTween("opacity", 0, 0.2, "linear", { repeatCount: 5 });
            await tweenState.finished;
            totalPlayerGems.opacity = 1;
            return;
        }
        this.clayShopTotals[clayType] += change;

        // Make sure the total doesn't go below zero
        this.clayShopTotals[clayType] = Math.max(this.clayShopTotals[clayType], 0);
        this.clayShopTotals.totalGemCostAmount = Math.max(this.clayShopTotals.totalGemCostAmount, 0);

        // Update the text of the clay objects
        totalEarthen.text = String(this.clayShopTotals[this.runtime.potManager.clayTypes.EARTHENWARE]);
        totalStoneware.text = String(this.clayShopTotals[this.runtime.potManager.clayTypes.STONEWARE]);
        totalPorcelain.text = String(this.clayShopTotals[this.runtime.potManager.clayTypes.PORCELAIN]);
        totalGemCost.text = String(this.clayShopTotals.totalGemCostAmount);
    }

    buyShop() {
        const clayTraderUI = this.runtime.layout.getLayer("clayTraderUI");
        clayTraderUI.isVisible = false;
        clayTraderUI.isInteractive = false;

        this.playerInventory[this.runtime.potManager.clayTypes.EARTHENWARE] += this.clayShopTotals[this.runtime.potManager.clayTypes.EARTHENWARE];
        this.playerInventory[this.runtime.potManager.clayTypes.STONEWARE] += this.clayShopTotals[this.runtime.potManager.clayTypes.STONEWARE];
        this.playerInventory[this.runtime.potManager.clayTypes.PORCELAIN] += this.clayShopTotals[this.runtime.potManager.clayTypes.PORCELAIN];
        this.playerGems -= this.clayShopTotals.totalGemCostAmount;

        this.levelState.playerBuyClay = false;
        this.runOnce = false;
        this.levelState.playerCraftPots = true;
    }

    playerCraftPots() {
        this.runtime.globalVars.playerCraftPots = true;
        const UI = this.runtime.layout.getLayer("UI");
        UI.isVisible = true;
        UI.isInteractive = true;
        this.countdown();
    }

    async countdown() {
        const countdown = this.runtime.objects.centerCountdown.getFirstInstance();
        const textSizeController = this.runtime.objects.textSizeController.getFirstInstance();
        const textWidth = textSizeController.width;
        const textHeight = textSizeController.height;
        this.runtime.callFunction("toggleClayTraderUIControls");
        this.runtime.callFunction("toggleControls");

        countdown.text = "3";
        let tweenState = textSizeController.behaviors.Tween.startTween("scale", [0.1, 0.1], 1, "linear");
        await tweenState.finished;
        textSizeController.width = textWidth;
        textSizeController.height = textHeight;
        countdown.text = "2";
        tweenState = textSizeController.behaviors.Tween.startTween("scale", [0.1, 0.1], 1, "linear");
        await tweenState.finished;
        textSizeController.width = textWidth;
        textSizeController.height = textHeight;
        countdown.text = "1";
        tweenState = textSizeController.behaviors.Tween.startTween("scale", [0.1, 0.1], 1, "linear");
        await tweenState.finished;
        textSizeController.width = textWidth;
        textSizeController.height = textHeight;
        countdown.sizePt = 200;
        countdown.text = "POT LEGEND!";
        tweenState = textSizeController.behaviors.Tween.startTween("opacity", 0, 1, "linear");
        await tweenState.finished;
        this.runtime.callFunction("toggleControls");
        this.timerOn = true;
    }

    craftingTimer() {
        this.startTime = Math.max(this.startTime, 0);

        const minutes = Math.floor(this.startTime / 60);
        const seconds = Math.floor(this.startTime % 60);

        const timeString = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        this.runtime.objects.buildTimer.getFirstInstance().text = timeString;
    }

    craftingMenu(on = true) {
        if (on) {
            this.runtime.callFunction("toggleCraftingMenuController");
            this.runtime.callFunction("toggleControls");
            const craftingMenu = this.runtime.layout.getLayer("craftingMenu");
            craftingMenu.isVisible = true;
            craftingMenu.isInteractive = true;
        } else {
            this.runtime.callFunction("toggleCraftingMenuController");
            this.runtime.callFunction("toggleControls");
            const craftingMenu = this.runtime.layout.getLayer("craftingMenu");
            craftingMenu.isVisible = false;
            craftingMenu.isInteractive = false;
        }
    };

    adjustInventoryAmount(clayType, change) {
        const totalEarthen = this.runtime.objects.totalEarthen2.getFirstInstance();
        const totalStoneware = this.runtime.objects.totalStone2.getFirstInstance();
        const totalPorcelain = this.runtime.objects.totalPorcelain2.getFirstInstance();

        this.playerInventory[clayType] += change;

        // Make sure the total doesn't go below zero
        this.playerInventory[clayType] = Math.max(this.playerInventory[clayType], 0);

        // Update the text of the clay objects
        totalEarthen.text = String(this.playerInventory[this.runtime.potManager.clayTypes.EARTHENWARE]);
        totalStoneware.text = String(this.playerInventory[this.runtime.potManager.clayTypes.STONEWARE]);
        totalPorcelain.text = String(this.playerInventory[this.runtime.potManager.clayTypes.PORCELAIN]);
    }

    advanceState() {
        
    }
}