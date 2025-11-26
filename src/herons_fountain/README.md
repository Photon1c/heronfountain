# Heron's Fountain Simulation

A Three.js-based interactive simulation of Heron's Fountain, demonstrating the ancient Greek principle of fluid dynamics and air pressure.

## 🏗️ Features

### Core Physics
- **Three Container System**: Top container (A), middle fountain basin (B), and bottom air chamber (C)
- **Real-time Water Flow**: Gravity-fed flow from A to C, air pressure-driven flow from C to B
- **Air Pressure Dynamics**: Pressure builds as water enters chamber C, driving the fountain
- **Particle Effects**: Realistic water droplets with gravity and fade-out effects

### Interactive Controls
- **Flip System**: Press 'R' or click "Flip System" to swap containers A and C
- **Reset**: Click "Reset" to restore initial conditions
- **Pause/Resume**: Press Space or click "Pause" to stop/start simulation
- **Camera Controls**: Mouse to rotate, scroll to zoom, smooth damping

### Visual Features
- **Glass Containers**: Transparent blue-tinted containers with realistic materials
- **Real-time Status**: Live water level and pressure indicators
- **Color-coded UI**: Visual feedback based on system state
- **Smooth Animations**: Container flip animations and particle effects

## 🎮 Controls

| Action | Keyboard | Mouse/UI |
|--------|----------|----------|
| Flip System | R | "Flip System" button |
| Reset | - | "Reset" button |
| Pause/Resume | Space | "Pause" button |
| Camera Rotate | - | Left click + drag |
| Camera Zoom | - | Scroll wheel |

## 🧠 How It Works

1. **Initial State**: Container A is full of water, B and C are empty
2. **Gravity Flow**: Water flows from A to C through Pipe 1
3. **Pressure Build-up**: As water enters C, air pressure increases
4. **Fountain Effect**: Pressurized air forces water from C to B through Pipe 2
5. **Cycle Completion**: When A and C are empty, the system stops
6. **Flip to Reset**: Swapping A and C restarts the cycle

## 📁 File Structure

```
src/herons_fountain/
├── main.js          # Three.js scene setup and animation loop
├── fountain.js      # Physics simulation and particle effects
├── ui.js           # User interface and status updates
├── reset.js        # Flip and reset functionality
└── README.md       # This documentation
```

## 🚀 Running the Simulation

1. Navigate to the project directory
2. Run `npm run dev`
3. Open `heronfountain.html` in your browser
4. Watch the fountain operate and experiment with the controls!

## 🔧 Technical Details

- **Three.js**: 3D graphics and scene management
- **OrbitControls**: Camera navigation
- **MeshPhysicalMaterial**: Realistic glass and water materials
- **Particle System**: Custom water droplet simulation
- **Real-time Physics**: Simplified fluid dynamics with air pressure

## 🎯 Educational Value

This simulation demonstrates:
- Heron's principle of fluid dynamics
- Air pressure and its effects on fluid flow
- Conservation of energy in closed systems
- Real-time physics simulation concepts

Perfect for educational demonstrations and understanding basic fluid mechanics! 