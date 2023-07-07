export function getDistance(x1, y1, x2, y2) {
	// return Math.sqrt((x2 - x1) * (x2 - x1) + ((y2 - y1) * (y2 - y1)));
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function clamp(value, range) {
	return Math.min(Math.max(value, range[0]), range[1]);
}

export function lerp(a, b, t) {
	return a + (b - a) * t;
}

export function convertRGB(r, g, b) {
	const newR = r / 255;
	const newG = g / 255;
	const newB = b / 255;
	return [newR, newG, newB];	
}

export function setScale(object, scale) {
	object.width = object.width * scale;
	object.height = object.height * scale;
}

export function convertToRadians(degrees) {
	return degrees * (Math.PI / 180);
}

export function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}

export function getRandomRange(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

export function findNearestEnemy(runtime, sourceX, sourceY, targetingDistance) {
	const enemies = [...runtime.objects.Enemies.getAllInstances(), ...runtime.objects.Bosses.getAllInstances()];
	let nearestEnemy = null;
	let minDistance = targetingDistance;

	for (const enemy of enemies) {
		const distance = getDistance(sourceX, sourceY, enemy.x, enemy.y);
		if (distance < minDistance) {
			nearestEnemy = enemy;
			minDistance = distance;
		}
	}
	return nearestEnemy;
}

export function universalMouseCoordinates(x, y) {
	// Layout size
	const layoutWidth = 3840;
	const layoutHeight = 2160;
	if (x <= layoutWidth && y <= layoutHeight) return [x, y];

	// Calculate offsets
	const offsetX = Math.floor(x / layoutWidth) * layoutWidth;
	const offsetY = Math.floor(y / layoutHeight) * layoutHeight;

	// Calculate mouse position relative to original layout
	const mouseOnOriginalX = x - offsetX;
	const mouseOnOriginalY = y - offsetY;

	if (x <= layoutWidth) return [x, mouseOnOriginalY];
	if (y <= layoutHeight) return [mouseOnOriginalX, y];
	return [mouseOnOriginalX, mouseOnOriginalY];
}

export function getWorldPosition(UIObject, coreObject) {
	// Layout size
	const viewportWidth = 3840;
	const viewportHeight = 2160;
	
	// Calculate UI object's position in the world
    const worldUiX = coreObject.x + UIObject.x - viewportWidth / 2;
    const worldUiY = coreObject.y + UIObject.y - viewportHeight / 2;

    return [worldUiX, worldUiY];
}


export function calculateCrit(damage, critChance, critDamage) {
	// Generate a random number between 0 and 1
	const randomNumber = Math.random();
  
	// Check if the randomNumber is less than or equal to the critChance
	if (randomNumber <= critChance) {
	  // If critChance successful, multiply damage by critDamage
	  return [damage * critDamage, true];
	} else {
	  // If not, return the regular damage
	  return [damage, false];
	}
  }

  export function findAngleOfImpact(runtime, impactObject){
    
	const self = runtime.loadoutManager.selectedCoreObject;
	// Coordinates of Point A
	const x1 = self.x;
	const y1 = self.y;

	// Coordinates of Point B
	const x2 = impactObject.x;
	const y2 = impactObject.y;

	// Calculate differences
	const delta_x = x2 - x1;
	const delta_y = y2 - y1;

	// Calculate angle in radians
	const angle_rad = Math.atan2(delta_y, delta_x);

	return angle_rad;
}

export function findAngleToTarget(hostObject, targetObject) {
	const deltaX = targetObject.x - hostObject.x;
	const deltaY = targetObject.y - hostObject.y;
	return Math.atan2(deltaY, deltaX);
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function chooseAttack(numberOfAttacks) {
    const attackNumber = Math.floor(Math.random() * numberOfAttacks) + 1;
    return attackNumber;
}