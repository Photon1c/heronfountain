export class Reset {
    constructor(fountain, ui) {
        this.fountain = fountain;
        this.ui = ui;
        this.isAnimating = false;
    }

    flipSystem() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.ui.showFlipAnimation();
        
        // Perform the flip
        this.fountain.flipSystem();
        
        // Wait for animation to complete
        setTimeout(() => {
            this.isAnimating = false;
            this.ui.showMessage('✅ System flipped! Fountain will restart.', 'success');
        }, 1500);
    }

    resetSystem() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.ui.showResetAnimation();
        
        // Perform the reset
        this.fountain.resetSystem();
        
        // Wait for animation to complete
        setTimeout(() => {
            this.isAnimating = false;
            this.ui.showMessage('✅ System reset! Fountain will restart.', 'success');
        }, 1000);
    }

    // Check if system is complete and suggest flip
    checkSystemComplete() {
        const status = this.fountain.getStatus();
        
        if (!status.isActive && status.containerA === 0 && status.containerC === 0) {
            // System has completed a cycle
            setTimeout(() => {
                this.ui.showSystemComplete();
            }, 1000);
        }
    }
} 