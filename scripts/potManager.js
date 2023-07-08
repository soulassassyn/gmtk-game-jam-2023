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

        this.sizes = {
            SMALL: 'Small',
            MEDIUM: 'Medium',
            LARGE: 'Large',
        };
        
        this.basePotStats = {
            [PotTypes.DECORATIVE]: {
                [ClayTypes.EARTHENWARE]: { hp: 2, gems: 10, heat: 2, time: 2},
                [ClayTypes.STONEWARE]: { hp: 3, gems: 15, heat: 5, time: 3},
                [ClayTypes.PORCELAIN]: { hp: 1, gems: 20, heat: 7, time: 8},
            },
            [PotTypes.REINFORCED]: {
                [ClayTypes.EARTHENWARE]: { hp: 3, gems: 5, heat: 2, time: 3},
                [ClayTypes.STONEWARE]: { hp: 5, gems: 10, heat: 7, time: 5 },
                // No porcelain for reinforced
            },
            [PotTypes.MAGIC]: {
                [ClayTypes.EARTHENWARE]: { hp: 1, gems: 20, heat: 5, time: 4 },
                // No stoneware for magic
                [ClayTypes.PORCELAIN]: { hp: 1, gems: 40, heat: 10, time: 15 },
            },
        };
    
        this.sizeMultipliers = {
            [Sizes.SMALL]: 1,
            [Sizes.MEDIUM]: 2,
            [Sizes.LARGE]: 3,
        };
    }

    createPot(potType, clayType, size) {
        const baseStats = basePotStats[potType][clayType];
        const sizeMultiplier = sizeMultipliers[size];

        return {
            hp: baseStats.hp * sizeMultiplier,
            gems: baseStats.gems * sizeMultiplier,
            heat: baseStats.heat,
            time: baseStats.time * sizeMultiplier,
        };
    }
}

// const myPot = createPot(PotTypes.DECORATIVE, ClayTypes.EARTHENWARE, Sizes.SMALL);
// console.log(myPot);