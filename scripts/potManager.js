export class PotManager {
    constructor(runtime) {
        this.runtime = runtime;
        
        this.potTypes = {
            DECORATIVE: 'Decorative',
            REINFORCED: 'Reinforced',
            MAGIC: 'Magic',
        };

        this.clayTypes = {
            EARTHENWARE: 'Earthenware',
            STONEWARE: 'Stoneware',
            PORCELAIN: 'Porcelain',
        };

        this.clayCosts = {
            EARTHENWARE: 5,
            STONEWARE: 10,
            PORCELAIN: 20,
        };

        this.sizes = {
            SMALL: 'Small',
            MEDIUM: 'Medium',
            LARGE: 'Large',
        };
        
        this.basePotStats = {
            [this.potTypes.DECORATIVE]: {
                [this.clayTypes.EARTHENWARE]: { hp: 2, gems: 10, heat: 2, time: 2, cost: 1, kiln: 1 },
                [this.clayTypes.STONEWARE]: { hp: 3, gems: 15, heat: 5, time: 3, cost: 1, kiln: 2 },
                [this.clayTypes.PORCELAIN]: { hp: 1, gems: 20, heat: 7, time: 8, cost: 1, kiln: 3 },
            },
            [this.potTypes.REINFORCED]: {
                [this.clayTypes.EARTHENWARE]: { hp: 3, gems: 5, heat: 2, time: 3, cost: 2, kiln: 1},
                [this.clayTypes.STONEWARE]: { hp: 5, gems: 10, heat: 7, time: 5, cost: 2, kiln: 3 },
                // No porcelain for reinforced
            },
            [this.potTypes.MAGIC]: {
                [this.clayTypes.EARTHENWARE]: { hp: 1, gems: 20, heat: 5, time: 4, cost: 2, kiln: 2 },
                // No stoneware for magic
                [this.clayTypes.PORCELAIN]: { hp: 1, gems: 40, heat: 10, time: 15, cost: 1, kiln: 3 },
            },
        };
    
        this.sizeMultipliers = {
            [this.sizes.SMALL]: 1,
            [this.sizes.MEDIUM]: 2,
            [this.sizes.LARGE]: 3,
        };
    }

    createPot(potType, clayType, size) {
        const baseStats = this.basePotStats[potType][clayType];
        const sizeMultiplier = this.sizeMultipliers[size];

        return {
            hp: baseStats.hp * sizeMultiplier,
            gems: baseStats.gems * sizeMultiplier,
            heat: baseStats.heat,
            time: baseStats.time * sizeMultiplier,
            cost: baseStats.cost * sizeMultiplier,
        };
    }
    
    clayInfo(clayType) {
        const upperClayType = clayType.toUpperCase();
        
        const info = [
            `Clay Type: ${clayType}`,
            `Clay Cost: ${this.clayCosts[upperClayType]}`,
        ].join('\n');

        return info;
    }

    potInfo(potType, clayType, size) {
        const baseStats = this.basePotStats[potType][clayType];
        const sizeMultiplier = this.sizeMultipliers[size];

        const info = [
            `HP: ${baseStats.hp * sizeMultiplier}`,
            `Gems Dropped: ${baseStats.gems * sizeMultiplier}`,
            `Clay Cost: ${baseStats.cost * sizeMultiplier}`,
            `Fire Time: ${baseStats.time * sizeMultiplier} sec`,
        ].join('\n');

        return info;
    }

    unlockInfo(potType, clayType, size) {
        const baseStats = this.basePotStats[potType][clayType];

        const info = [
            `Kiln Level ${baseStats.kiln} Required`,
        ].join('\n');

        return info;
    }
}

// const myPot = createPot(potTypes.DECORATIVE, clayTypes.EARTHENWARE, sizes.SMALL);