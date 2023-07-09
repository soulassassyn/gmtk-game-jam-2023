// Import any other script files here, e.g.:
// import * as myModule from "./mymodule.js";

import { PotManager } from "./potManager.js";
import { LevelManager } from "./levelManager.js";
import { MouseHover } from "./mouseHover.js";

runOnStartup(async runtime =>
{
	// Code to run on the loading screen.
	// Note layouts, objects etc. are not yet available.

	const potManager = new PotManager(runtime);
	runtime.potManager = potManager;

	const levelManager = new LevelManager(runtime);
	runtime.levelManager = levelManager;
	
	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime)
{
	// Code to run just before 'On start of layout' on
	// the first layout. Loading has finished and initial
	// instances are created and available to use here.

	const mhNav = new MouseHover(runtime, "nav", 1.1, 1);
	runtime.mhNav = mhNav;

	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime)
{
	// Code to run every tick
}