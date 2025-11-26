# Heron's Fountain - Interactive 3D Simulation

A stunning Three.js-based interactive simulation of Heron's Fountain, demonstrating the ancient Greek principle of fluid dynamics and air pressure invented by Hero of Alexandria (c. 62 CE).

**Live Demo**: [Coming Soon]

## 🏗️ Features

### Core Physics Simulation
- **Three Container System**: Top container (A - bowl), middle fountain basin (B - water supply), and bottom air chamber (C - air supply)
- **Real-time Water Flow**: Gravity-fed flow from A to C, air pressure-driven flow from B to A
- **Air Pressure Dynamics**: Pressure builds as water enters chamber C, driving the fountain effect
- **Particle Effects**: Realistic water droplets with gravity, collision detection, and fade-out effects
- **Water Surface Ripples**: Shader-based ripple effects on the fountain basin surface

### Interactive Controls
- **Flip System**: Press 'R' or click "Flip System" to swap containers A and C and restart the cycle
- **Reset**: Click "Reset" to restore initial conditions (75% water in basin)
- **Pause/Resume**: Press Space or click "Pause" to stop/start simulation
- **Flow Intensity Slider**: Adjust water flow rate from 0% to 100%
- **Camera Controls**: 
  - Left mouse: Rotate
  - Right mouse: Pan
  - Middle mouse/Scroll: Zoom
  - Smooth damping for natural movement

### Visual Features
- **Glass Containers**: Transparent blue-tinted containers with realistic materials and lighting
- **Real-time Status Display**: Live water level and pressure indicators with color coding
- **Smooth Animations**: Container flip animations, particle effects, and water level changes
- **Dynamic Lighting**: Ambient, directional, and point lights for realistic illumination
- **Shadow Mapping**: Soft shadows for enhanced depth perception

### Educational Information
- **Info Panel**: Press 'I' or '?' to view detailed information about Heron's Fountain
- **Historical Context**: Learn about Hero of Alexandria and the fountain's origins
- **How It Works**: Detailed explanation of the three-container system and pipe connections
- **Historical Significance**: Understanding of ancient engineering principles

## 🎮 Controls

| Action | Keyboard | Mouse/UI |
|--------|----------|----------|
| Flip System | R | "Flip System" button |
| Reset | - | "Reset" button |
| Pause/Resume | Space | "Pause" button |
| Camera Rotate | - | Left click + drag |
| Camera Pan | - | Right click + drag |
| Camera Zoom | - | Scroll wheel |
| Toggle Info | I or ? | - |
| Dev: Print Camera | \ | - |

## 🧠 How It Works

### The Three-Container System

1. **Container A (Bowl/Fountain Basin)**: 
   - Open-top container that receives the fountain stream
   - Water level starts at 75% full
   - Absorbs incoming particles and displays water surface

2. **Container B (Water Supply)**:
   - Airtight container that supplies water to the fountain
   - Connected to Container C via Pipe 2 (air transfer)
   - Connected to Container A via Pipe 3 (water delivery)

3. **Container C (Air Supply)**:
   - Airtight container that builds air pressure
   - Receives water from Container A via Pipe 1
   - Transfers pressurized air to Container B via Pipe 2

### The Three Pipes

- **Pipe 1 (P1)**: Drains water from Container A to the bottom of Container C
- **Pipe 2 (P2)**: Transfers pressurized air from the top of Container C to the top of Container B
- **Pipe 3 (P3)**: Carries water from the bottom of Container B to a nozzle in Container A

### The Cycle

1. **Initial State**: Container A is 75% full, B and C are empty
2. **Gravity Flow**: Water flows from A to C through Pipe 1
3. **Pressure Build-up**: As water enters C, air pressure increases
4. **Fountain Effect**: Pressurized air pushes on B, forcing water up through Pipe 3 into A
5. **Cycle Completion**: When A and C are empty, the system stops
6. **Flip to Reset**: Swapping A and C restarts the cycle

## 📁 File Structure

```
src/herons_fountain/
├── main.js          # Three.js scene setup, camera, controls, animation loop
├── fountain.js      # Physics simulation, containers, pipes, particle effects
├── ui.js            # User interface, status updates, info panel
├── reset.js         # Flip and reset functionality
└── README.md        # Detailed technical documentation

public/
└── heronfountain.html  # Main HTML entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open `heronfountain.html` in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🔧 Technical Details

### Technologies Used
- **Three.js**: 3D graphics rendering and scene management
- **OrbitControls**: Camera navigation with damping
- **MeshPhysicalMaterial**: Realistic glass and water materials with transparency
- **Custom Particle System**: Water droplet simulation with physics
- **Shader Materials**: Custom shaders for water surface ripples
- **Real-time Physics**: Simplified fluid dynamics with air pressure calculations

### Key Components

#### Physics Simulation
- Gravity-based particle system
- Collision detection for container boundaries
- Air pressure calculations based on water levels
- Flow rate calculations for pipe connections

#### Visual Effects
- Particle-based water droplets
- Shader-based water surface with ripple effects
- Dynamic lighting with shadows
- Smooth container flip animations

#### User Interface
- Real-time status indicators
- Color-coded water levels
- Interactive controls panel
- Educational info panel

## 🎯 Educational Value

This simulation demonstrates:
- **Heron's Principle**: Ancient Greek understanding of fluid dynamics
- **Air Pressure**: How compressed air can drive fluid flow
- **Conservation of Energy**: Energy transfer in closed systems
- **Real-time Physics Simulation**: Modern 3D graphics and physics concepts
- **Historical Engineering**: Ancient innovations that influenced modern science

Perfect for:
- Educational demonstrations in physics and engineering
- Understanding basic fluid mechanics
- Learning about ancient Greek engineering
- Interactive 3D visualization projects

## 📚 Historical Context

Heron's Fountain (also known as Hero's Fountain) was invented by **Hero of Alexandria** around 62 CE. Hero was a prominent mathematician and engineer in the Hellenistic period and is considered one of the greatest experimenters of antiquity.

The fountain appears to create perpetual motion but actually relies on the potential energy stored in the elevated water containers. This device demonstrates principles of pneumatics and hydraulics that were revolutionary for their time and influenced later developments in engineering and physics.

## 🐛 Known Issues

- None currently reported

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Hero of Alexandria for the original design
- Three.js community for the excellent 3D graphics library
- All contributors and testers

---

**Enjoy exploring the ancient art of fluid dynamics!** 🌊

