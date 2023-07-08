const PotTypes = {
    DECORATIVE: 'Decorative',
    REINFORCED: 'Reinforced',
    MAGIC: 'Magic',
};

const ClayTypes = {
    EARTHENWARE: 'Earthenware',
    STONEWARE: 'Stoneware',
    PORCELAIN: 'Porcelain',
};

const Sizes = {
    SMALL: 'Small',
    MEDIUM: 'Medium',
    LARGE: 'Large',
};

const basePotStats = {
    [PotTypes.DECORATIVE]: {
        [ClayTypes.EARTHENWARE]: { hp: 2, gems: 10 },
        [ClayTypes.STONEWARE]: { hp: 3, gems: 15 },
        [ClayTypes.PORCELAIN]: { hp: 1, gems: 20 },
    },
    [PotTypes.REINFORCED]: {
        [ClayTypes.EARTHENWARE]: { hp: 3, gems: 5 },
        [ClayTypes.STONEWARE]: { hp: 5, gems: 10 },
        // No porcelain for reinforced
    },
    [PotTypes.MAGIC]: {
        [ClayTypes.EARTHENWARE]: { hp: 1, gems: 20 },
        // No stoneware for magic
        [ClayTypes.PORCELAIN]: { hp: 1, gems: 40 },
    },
};

const sizeMultipliers = {
    [Sizes.SMALL]: 1,
    [Sizes.MEDIUM]: 2,
    [Sizes.LARGE]: 3,
};

function createPot(potType, clayType, size) {
    const baseStats = basePotStats[potType][clayType];
    const sizeMultiplier = sizeMultipliers[size];

    return {
        hp: baseStats.hp * sizeMultiplier,
        gems: baseStats.gems * sizeMultiplier,
        // Add any additional properties here
    };
}

const myPot = createPot(PotTypes.DECORATIVE, ClayTypes.EARTHENWARE, Sizes.SMALL);
console.log(myPot);