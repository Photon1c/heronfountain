export class UI {
    constructor() {
        this.elements = {
            containerA: document.getElementById('containerA'),
            containerB: document.getElementById('containerB'),
            containerC: document.getElementById('containerC'),
            pressure: document.getElementById('pressure')
        };
        
        this.lastStatus = null;
        this.createAboutPanel();
    }

    update(status) {
        if (!status || this.lastStatus === JSON.stringify(status)) {
            return;
        }

        this.lastStatus = JSON.stringify(status);

        // Update water levels
        this.elements.containerA.textContent = `${status.containerA}%`;
        this.elements.containerB.textContent = `${status.containerB}%`;
        this.elements.containerC.textContent = `${status.containerC}%`;
        this.elements.pressure.textContent = `${status.pressure}%`;

        // Update visual indicators
        this.updateVisualIndicators(status);
    }

    updateVisualIndicators(status) {
        // Update container A indicator
        this.updateElementColor(this.elements.containerA, status.containerA);
        
        // Update container B indicator
        this.updateElementColor(this.elements.containerB, status.containerB);
        
        // Update container C indicator
        this.updateElementColor(this.elements.containerC, status.containerC);
        
        // Update pressure indicator
        this.updateElementColor(this.elements.pressure, status.pressure);

        // Update system status
        this.updateSystemStatus(status.isActive);
    }

    updateElementColor(element, value) {
        // Color coding based on value
        let color;
        if (value >= 80) {
            color = '#4CAF50'; // Green
        } else if (value >= 50) {
            color = '#FF9800'; // Orange
        } else if (value >= 20) {
            color = '#FF5722'; // Red
        } else {
            color = '#9E9E9E'; // Gray
        }
        
        element.style.color = color;
    }

    updateSystemStatus(isActive) {
        const info = document.getElementById('info');
        
        if (isActive) {
            info.style.border = '2px solid #4CAF50';
            info.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
        } else {
            info.style.border = '2px solid #FF5722';
            info.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.3)';
        }
    }

    showMessage(message, type = 'info') {
        // Create temporary message
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: fadeInOut 2s ease-in-out;
        `;
        
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Add CSS animation
        if (!document.getElementById('message-animations')) {
            const style = document.createElement('style');
            style.id = 'message-animations';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        // Remove message after animation
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 2000);
    }

    showFlipAnimation() {
        this.showMessage('🔄 Flipping system...', 'info');
    }

    showResetAnimation() {
        this.showMessage('🔄 Resetting system...', 'info');
    }

    showSystemComplete() {
        this.showMessage('✅ System cycle complete! Press R to flip.', 'success');
    }

    createAboutPanel() {
        // Create info hint in bottom right
        const infoHint = document.createElement('div');
        infoHint.id = 'info-hint';
        infoHint.style.cssText = `
            position: fixed; right: 20px; bottom: 20px;
            background: rgba(20, 28, 46, 0.7); color: #aaddff;
            border: 1px solid #4a76a8; border-radius: 6px;
            padding: 8px 12px; font-size: 12px;
            pointer-events: none; z-index: 999;
            transition: opacity 0.3s ease;
        `;
        infoHint.textContent = 'Press I for info';
        document.body.appendChild(infoHint);
        this.infoHint = infoHint;

        // Create about panel
        const panel = document.createElement('div');
        panel.id = 'about-panel';
        panel.style.cssText = `
            position: fixed; right: 20px; bottom: 20px; width: 400px; max-height: 80vh;
            background: rgba(20, 28, 46, 0.96); color: #e6f2ff; border: 1px solid #4a76a8;
            border-radius: 10px; padding: 20px; box-shadow: 0 8px 24px rgba(0,0,0,0.35);
            font-size: 13px; line-height: 1.6; display: none; z-index: 1000;
            overflow-y: auto;
        `;
        panel.innerHTML = `
            <div style="font-weight:600; color:#aaddff; margin-bottom:12px; font-size:16px">About Heron's Fountain</div>
            
            <div style="margin-bottom:12px">
                <div style="font-weight:600; color:#aaddff; margin-bottom:6px">Origins</div>
                <div>
                    Heron's Fountain (also known as Heron's Aeolipile or Hero's Fountain) is a hydraulic device 
                    invented by the ancient Greek mathematician and engineer <strong>Hero of Alexandria</strong> 
                    (also known as Heron) around 62 CE. Hero was a prominent figure in the Hellenistic period 
                    and is considered one of the greatest experimenters of antiquity.
                </div>
            </div>

            <div style="margin-bottom:12px">
                <div style="font-weight:600; color:#aaddff; margin-bottom:6px">How It Works</div>
                <div>
                    The fountain consists of three containers: <strong>A</strong> (bowl/fountain basin), 
                    <strong>B</strong> (water supply), and <strong>C</strong> (air supply). Three pipes connect them:
                    <ul style="margin:8px 0; padding-left:20px">
                        <li><strong>P1</strong>: Drains water from A to the bottom of C</li>
                        <li><strong>P2</strong>: Transfers air from the top of C to the top of B</li>
                        <li><strong>P3</strong>: Carries water from the bottom of B to a nozzle in A</li>
                    </ul>
                    Containers B and C must be airtight, while A can be open. As water falls from A into C, 
                    it pressurizes the air in C, which pushes on the water in B, forcing water up through P3 
                    and creating a continuous fountain effect.
                </div>
            </div>

            <div style="margin-bottom:12px">
                <div style="font-weight:600; color:#aaddff; margin-bottom:6px">Historical Significance</div>
                <div>
                    This device demonstrates principles of pneumatics and hydraulics that were revolutionary 
                    for their time. Hero's work, including this fountain, influenced later developments in 
                    engineering and physics. The fountain appears to create perpetual motion, but actually 
                    relies on the potential energy stored in the elevated water containers.
                </div>
            </div>

            <div style="margin-top:12px; padding-top:12px; border-top:1px solid #4a76a8; opacity:0.85; font-size:11px">
                Press <strong>I</strong> or <strong>?</strong> to toggle this panel.
            </div>
        `;
        document.body.appendChild(panel);
        this.aboutPanel = panel;
    }

    toggleAbout() {
        if (!this.aboutPanel || !this.infoHint) return;
        const visible = this.aboutPanel.style.display === 'block';
        this.aboutPanel.style.display = visible ? 'none' : 'block';
        // Hide hint when panel is visible
        this.infoHint.style.opacity = visible ? '1' : '0';
    }

    toggleAbout() {
        if (!this.aboutPanel) return;
        const visible = this.aboutPanel.style.display === 'block';
        this.aboutPanel.style.display = visible ? 'none' : 'block';
    }
} 