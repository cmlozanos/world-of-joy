# World of Joy - Fruit Collector 🌳

A 3D open-world fruit collection game built with Three.js, running entirely in the browser.

## Getting Started

### Requirements

- Python 3 (for the development server)
- A modern web browser with WebGL support

### Running the Game

```bash
make serve
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

To use a custom port:

```bash
make serve PORT=3000
```

### Stopping the Server

```bash
make stop
```

## How to Play

| Control | Action |
|---------|--------|
| **W/A/S/D** | Move character |
| **Arrow Keys** | Move character (alternative) |
| **Shift** | Hold to run |
| **Space** | Jump |
| **Mouse** | Look around |

### Objective

Explore the open world, find trees, and collect all the floating fruit near them!

## Project Structure

```
world-of-joy/
├── index.html              # Entry point
├── Makefile                 # Server commands
├── README.md               # This file
└── src/
    ├── main.js             # Game initialization and loop
    ├── engine/
    │   ├── InputManager.js # Keyboard and mouse input handling
    │   └── ThirdPersonCamera.js # Third-person camera controller
    ├── entities/
    │   ├── Character.js    # Player character model and animations
    │   └── FruitManager.js # Fruit spawning, animation, and collection
    ├── ui/
    │   └── HUD.js          # Score display and popups
    ├── world/
    │   └── World.js        # Terrain, trees, and environment generation
    └── styles/
        └── main.css        # Game UI styles
```

## Technical Details

- **Rendering**: Three.js (v0.160.0) loaded via CDN import maps
- **Character**: Procedurally built low-poly child model with walk/run/idle/jump animations
- **World**: Procedurally generated terrain with height variation, trees, rocks, bushes, flowers, and clouds
- **Camera**: Smooth third-person follow camera with mouse-controlled orbit
- **Physics**: Simple gravity, ground collision, and tree collision detection
