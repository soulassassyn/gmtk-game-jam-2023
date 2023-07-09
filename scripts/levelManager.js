export class LevelManager {
    constructor(runtime) {
        this.runtime = runtime;
        this.heroWeaponDamage = 6;
        this.kilnHealth = 10;
        this.kilnLevel = 1;

        this.kilnUpgradeCosts = {
            2: 40,
            3: 100,
        };

        this.runOnce = false;
        this.waypointCount = 0;
        this.waypointEL = null;
        this.heroAttackAnimationLength = 0.5;
        this.timerOn = false;
        this.startTime = 60;
        this.resetTime = 60;
        this.round = 1;

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

        this.clayShopUnlocks = {
            [this.runtime.potManager.clayTypes.EARTHENWARE]: true,
            [this.runtime.potManager.clayTypes.STONEWARE]: false,
            [this.runtime.potManager.clayTypes.PORCELAIN]: false,
        };

        this.playerInventory = {
            [this.runtime.potManager.clayTypes.EARTHENWARE]: 0,
            [this.runtime.potManager.clayTypes.STONEWARE]: 0,
            [this.runtime.potManager.clayTypes.PORCELAIN]: 0,
        };

        this.tempPot = {
            clayType: null,
            potType: null,
            size: null,
            name: null,
        }

        this.playerGems = 0;
        this.heroGems = 0;
    }

    resetRound() {
        this.runOnce = false;
        this.waypointCount = 0;
        this.waypointEL = null;
        this.timerOn = false;
        this.startTime = 60;
        this.levelState = {
            heroAttack: false,
            heroBuyWeapon: false,
            playerBuyClay: false,
            playerCraftPots: false,
            victory: false,
            lose: false,
        };
        this.clayShopTotals = {
            [this.runtime.potManager.clayTypes.EARTHENWARE]: 0,
            [this.runtime.potManager.clayTypes.STONEWARE]: 0,
            [this.runtime.potManager.clayTypes.PORCELAIN]: 0,
            totalGemCostAmount: 0,
        };
        this.tempPot = {
            clayType: null,
            potType: null,
            size: null,
            name: null,
        };
        this.runtime.globalVars.playerCraftPots = false;
        this.runtime.globalVars.currentSelection = "";
        this.runtime.globalVars.isItemSelected = false;

        this.runtime.layout.getLayer("UI").isVisible = false;
        this.runtime.layout.getLayer("UI").isInteractive = false;
        this.runtime.layout.getLayer("craftingMenu").isVisible = false;
        this.runtime.layout.getLayer("craftingMenu").isInteractive = false;
        this.runtime.layout.getLayer("clayTraderUI").isVisible = false;
        this.runtime.layout.getLayer("clayTraderUI").isInteractive = false;
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
                if (this.startTime <= 0) {
                    this.craftingMenu(false);
                    console.log(this.clayShopTotals);
                    this.resetRound();
                    console.log(this.clayShopTotals);
                    this.round++;
                    this.levelState.heroAttack = true;
                }
            }
        }
    }

    heroAddAttackWaypoints() {
        const hero = this.runtime.objects.heroCharacter.getFirstInstance();
        const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
        const placementTiles = this.runtime.objects.placementTile.getAllInstances();
        const kilns = this.runtime.objects.kiln.getAllInstances();
        let kiln;
        for (const k of kilns) {
            if (k.instVars.isMainKiln) {
                kiln = k;
            }
        }
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
                this.heroAttack(kiln, hero);
            }
            this.waypointCount++;
        };
        hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
    }

    heroAttack(object, hero) {
        hero.setAnimation("attack");
        this.runtime.callFunction("playSfx", 0);
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
                this.runtime.callFunction("playSfx", 2);
                hero.removeEventListener("animationend", animationendEL);
                hero.setAnimation("walk");
                object.setAnimation("broken");
                object.behaviors.Solid.isEnabled = false;

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
                hero.timeScale = 0;
                const heroSwordBreakCinematic = this.runtime.objects.cinematics.getFirstInstance();
                heroSwordBreakCinematic.setAnimation("swordBreak");
                let cinematic = this.runtime.layout.getLayer("cinematics");
                cinematic.isVisible = true;
                const animationendEL2 = e => {
                    cinematic.isVisible = false;
                    hero.timeScale = 1;
                    heroSwordBreakCinematic.removeEventListener("animationend", animationendEL2);
                };
                heroSwordBreakCinematic.addEventListener("animationend", animationendEL2);

                hero.removeEventListener("animationend", animationendEL);
                hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
                hero.setAnimation("walkBroken");
                this.levelState.heroAttack = false;
                object.behaviors.Sine.isEnabled = false;
                this.waypointCount = 0;
                const [x, y] = this.runtime.objects.shopCounter.getFirstInstance().getImagePoint(1);
                hero.behaviors.MoveTo.moveToPosition(x, y);
                hero.behaviors.MoveTo.maxSpeed = 700;
                this.waypointEL = e => {
                    this.levelState.heroBuyWeapon = true;
                    this.runOnce = false;
                    hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
                };
                hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
            }
            // Attack again
            if (this.heroWeaponDamage > 0 && object.instVars.hp > 0) {
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
        const swordPower = this.runtime.objects.swordPower.getFirstInstance();
        const plusGems = this.runtime.objects.plusGems.getFirstInstance();

        this.heroWeaponDamage = Math.floor(this.heroGems / 2);
        this.playerGems = this.heroGems;
        this.heroGems = 0;
        plusGems.text = `+${this.playerGems} Gems`;
        plusGems.isVisible = true;
        plusGems.behaviors.Tween.startTween("y", plusGems.y - 200, 3, "linear");
        plusGems.behaviors.Tween.startTween("opacity", 0, 3, "linear");
        swordPower.text = `+${this.heroWeaponDamage} Damage`;
        swordPower.isVisible = true;
        swordPower.behaviors.Tween.startTween("y", swordPower.y - 200, 3, "linear");
        swordPower.behaviors.Tween.startTween("opacity", 0, 3, "linear");
        
        hero.setAnimation("buySword");
        const animationendEL = e => {
            hero.setAnimation("walk");
            this.levelState.heroBuyWeapon = false;
            
            // Hero leaves the shop
            const welcomeMat = this.runtime.objects.welcomeMat.getFirstInstance();
            hero.behaviors.MoveTo.moveToPosition(welcomeMat.x, welcomeMat.y, false); 
            hero.behaviors.MoveTo.moveToPosition(905, 1351, false);
            hero.removeEventListener("animationend", animationendEL);
            
            this.waypointEL = e => {
                this.runOnce = false;
                this.levelState.playerBuyClay = true;
                plusGems.isVisible = false;
                plusGems.y = plusGems.y + 200;
                plusGems.opacity = 1;
                swordPower.isVisible = false;
                swordPower.y = swordPower.y + 200;
                swordPower.opacity = 1;
                hero.behaviors.MoveTo.removeEventListener("arrived", this.waypointEL);
            }
            hero.behaviors.MoveTo.addEventListener("arrived", this.waypointEL);
        };
        hero.addEventListener("animationend", animationendEL);
    }

    playerBuyClay() {
        this.runtime.callFunction("toggleClayTraderUIControls");
        const clayTraderCinematic = this.runtime.objects.cinematics.getFirstInstance();
        clayTraderCinematic.setAnimation("merchantEntrance");
        let clayTraderUI = this.runtime.layout.getLayer("clayTraderUI");
        let cinematic = this.runtime.layout.getLayer("cinematics");
        cinematic.isVisible = true;
        const animationendEL = e => {
            cinematic.isVisible = false;
            clayTraderUI.isVisible = true;
            clayTraderUI.isInteractive = true;
            clayTraderCinematic.removeEventListener("animationend", animationendEL);
        };
        clayTraderCinematic.addEventListener("animationend", animationendEL);
    }

    async adjustClayShopAmount(clayType, change) {
        const totalEarthen = this.runtime.objects.totalEarthen.getFirstInstance();
        const totalStoneware = this.runtime.objects.totalStone.getFirstInstance();
        const totalPorcelain = this.runtime.objects.totalPorcelain.getFirstInstance();
        const kilnLevelText = this.runtime.objects.kilnLevelText.getFirstInstance();
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
        } else if (clayType === "KilnUpgrade") {
            clayCost = this.kilnUpgradeCosts[this.kilnLevel + 1];
            if (this.playerGems < clayCost) return;
            if (this.kilnLevel === 3) return;
            if (this.kilnLevel === 1 && change === -1) return;
            kilnLevelText.text = `${this.kilnLevel + 1}`;
            return;
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

    resetClayShop() {
        const totalEarthen = this.runtime.objects.totalEarthen.getFirstInstance();
        const totalStoneware = this.runtime.objects.totalStone.getFirstInstance();
        const totalPorcelain = this.runtime.objects.totalPorcelain.getFirstInstance();
        const totalGemCost = this.runtime.objects.totalGemCost.getFirstInstance();

        this.clayShopTotals = {
            [this.runtime.potManager.clayTypes.EARTHENWARE]: 0,
            [this.runtime.potManager.clayTypes.STONEWARE]: 0,
            [this.runtime.potManager.clayTypes.PORCELAIN]: 0,
            totalGemCostAmount: 0,
        };

        totalEarthen.text = String(this.clayShopTotals[this.runtime.potManager.clayTypes.EARTHENWARE]);
        totalStoneware.text = String(this.clayShopTotals[this.runtime.potManager.clayTypes.STONEWARE]);
        totalPorcelain.text = String(this.clayShopTotals[this.runtime.potManager.clayTypes.PORCELAIN]);
        totalGemCost.text = String(this.clayShopTotals.totalGemCostAmount);
    }

    buyShop() {
        const clayTraderUI = this.runtime.layout.getLayer("clayTraderUI");
        this.runtime.callFunction("toggleClayTraderUIControls");
        clayTraderUI.isVisible = false;
        clayTraderUI.isInteractive = false;

        this.playerInventory[this.runtime.potManager.clayTypes.EARTHENWARE] += this.clayShopTotals[this.runtime.potManager.clayTypes.EARTHENWARE];
        this.playerInventory[this.runtime.potManager.clayTypes.STONEWARE] += this.clayShopTotals[this.runtime.potManager.clayTypes.STONEWARE];
        this.playerInventory[this.runtime.potManager.clayTypes.PORCELAIN] += this.clayShopTotals[this.runtime.potManager.clayTypes.PORCELAIN];
        this.playerGems -= this.clayShopTotals.totalGemCostAmount;

        this.resetClayShop();
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

        const timers = this.runtime.objects.buildTimer.getAllInstances();
        for (const timer of timers) {
            timer.text = timeString;
        }
    }

    craftingMenu(on = true) {
        if (on) {
            this.runtime.callFunction("toggleCraftingMenuController");
            this.runtime.callFunction("toggleControls");
            const craftingMenu = this.runtime.layout.getLayer("craftingMenu");
            this.setInventoryText();
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

    async craftPot(placementTile) {
        this.runtime.callFunction("toggleControls");
        const potInfo = this.runtime.potManager.createPot(this.tempPot.potType, this.tempPot.clayType, this.tempPot.size)
        this.playerInventory[this.tempPot.clayType] -= potInfo.cost;
        placementTile.instVars.isOccupied = true;
        const newPot = this.runtime.objects[this.tempPot.name].createInstance("interactive", placementTile.x, placementTile.y);
        placementTile.instVars.potUid = newPot.uid;
        newPot.behaviors.Solid.isEnabled = true;
        newPot.setAnimation("idle");
        newPot.y += newPot.height / 4;
        newPot.opacity = 0.25
        newPot.behaviors.Tween.startTween("scale", [1, 1], potInfo.time, "linear");
        const craftTime = newPot.behaviors.Tween.startTween("opacity", 1, potInfo.time, "linear");
        await craftTime.finished;
        this.tempPot = {
            clayType: null,
            potType: null,
            size: null,
            name: null,
        };
        this.runtime.callFunction("toggleControls");
    }

    setInventoryText() {
        const totalEarthen = this.runtime.objects.totalEarthen2.getFirstInstance();
        const totalStoneware = this.runtime.objects.totalStone2.getFirstInstance();
        const totalPorcelain = this.runtime.objects.totalPorcelain2.getFirstInstance();

        totalEarthen.text = String(this.playerInventory[this.runtime.potManager.clayTypes.EARTHENWARE]);
        totalStoneware.text = String(this.playerInventory[this.runtime.potManager.clayTypes.STONEWARE]);
        totalPorcelain.text = String(this.playerInventory[this.runtime.potManager.clayTypes.PORCELAIN]);
    }

    adjustInventoryAmount(clayType, change) {
        const totalEarthen = this.runtime.objects.totalEarthen2.getFirstInstance();
        const totalStoneware = this.runtime.objects.totalStone2.getFirstInstance();
        const totalPorcelain = this.runtime.objects.totalPorcelain2.getFirstInstance();

        if (this.playerInventory[clayType] < change) return;


        this.playerInventory[clayType] -= change;

        // Make sure the total doesn't go below zero
        this.playerInventory[clayType] = Math.max(this.playerInventory[clayType], 0);

        // Update the text of the clay objects
        totalEarthen.text = String(this.playerInventory[this.runtime.potManager.clayTypes.EARTHENWARE]);
        totalStoneware.text = String(this.playerInventory[this.runtime.potManager.clayTypes.STONEWARE]);
        totalPorcelain.text = String(this.playerInventory[this.runtime.potManager.clayTypes.PORCELAIN]);
    }
}