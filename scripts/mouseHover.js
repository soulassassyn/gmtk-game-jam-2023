export class MouseHover {
    constructor(runtime, objectName, scaleUpFactor = 1.25, scaleDownFactor = 1, tweenDuration = 0.05, mouseObjectName = 'Mouse') {
        this.runtime = runtime;
        this.objectName = objectName;
        this.mouseObjectName = mouseObjectName;
        this.scaleUpFactor = scaleUpFactor;
        this.scaleDownFactor = scaleDownFactor;
        this.tweenDuration = tweenDuration;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.runtime.addEventListener("tick", () => this.checkMouseHover());
    }

    checkMouseHover() {
        const object = this.runtime.objects[this.objectName];
        const mouse = this.runtime.objects.Mouse;

        // Get the mouse position using getMousePosition()
        const [mouseX, mouseY] = mouse.getMousePosition();

        // Layout size
        const layoutWidth = 3840;
        const layoutHeight = 2160;

        // Calculate offsets
        const offsetX = Math.floor(mouseX / layoutWidth) * layoutWidth;
        const offsetY = Math.floor(mouseY / layoutHeight) * layoutHeight;

        // Calculate mouse position relative to original layout
        const mouseOnOriginalX = mouseX - offsetX;
        const mouseOnOriginalY = mouseY - offsetY;

        // Use a for loop to iterate over the instances
        const instances = object.getAllInstances();
        for (let i = 0; i < instances.length; i++) {
            const instance = instances[i];

            // Check if the instance has the 'isHover' variable and get its value
            const isHover = instance.instVars.hasOwnProperty('isHover') ? instance.instVars['isHover'] : true;

            if (isHover) {
                if (instance.containsPoint(mouseOnOriginalX, mouseOnOriginalY) || instance.containsPoint(mouseX, mouseY)) {
                    if (!instance.hovered) {
                        if (instance.instVars.isOpacity) {
                            const opacity = instance.instVars.hoverOpacity ? instance.instVars.hoverOpacity : 0.75;
                            instance.opacity = opacity;
                        }
                        instance.hovered = true;
                        const scaleAmountX = this.scaleUpFactor;
                        const scaleAmountY = this.scaleUpFactor;
                        instance.behaviors.Tween.startTween("scale", [scaleAmountX, scaleAmountY], this.tweenDuration, "linear");
                    }
                } else {
                    if (instance.hovered) {
                        if (instance.instVars.isOpacity) {
                            const opacity = instance.instVars.noHoverOpacity ? instance.instVars.noHoverOpacity : 0.55;
                            instance.opacity = opacity;
                        }
                        instance.hovered = false;
                        const scaleAmountX = this.scaleDownFactor;
                        const scaleAmountY = this.scaleDownFactor;
                        instance.behaviors.Tween.startTween("scale", [scaleAmountX, scaleAmountY], this.tweenDuration, "linear");
                    }
                }
            }
        }
    }
}