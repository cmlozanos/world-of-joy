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

Complete 8 timed rounds with different missions and visual themes!

| Round | Theme | Mission |
|-------|-------|--------|
| 1 | Pradera Matutina | Collect 8 fruits |
| 2 | Bosque Denso | Bounce on 5 trampolines |
| 3 | Valle del Atardecer | Collect 5 water bottles |
| 4 | Tierras Brumosas | Collect 10 fruits at top speed |
| 5 | Cuevas Cristalinas | Find 6 hidden gems |
| 6 | Cielo Estrellado | Catch 6 shooting stars |
| 7 | Alturas Celestiales | Pass through 8 sky rings |
| 8 | Hora Dorada | Collect 15 fruits |

Earn up to 3 stars per round based on how quickly you finish.

## Project Structure

```
world-of-joy/
├── index.html              # Entry point
├── Makefile                 # Server commands
├── README.md               # This file
└── src/
    ├── main.js             # Game initialization and loop
    ├── engine/
    │   ├── InputManager.js       # Keyboard input handling
    │   ├── MusicManager.js       # Procedural background music
    │   ├── ParticleSystem.js     # Particle effects (dust, sparkles)
    │   ├── RoundManager.js       # Round progression and mission logic
    │   ├── ScenarioTheme.js      # Visual themes per round
    │   ├── SoundManager.js       # Sound effects via Web Audio API
    │   ├── ThirdPersonCamera.js  # Third-person camera controller
    │   └── TouchControls.js      # Mobile virtual joystick and buttons
    ├── entities/
    │   ├── Character.js          # Player character model and animations
    │   ├── FruitManager.js       # Fruit spawning, animation, and collection
    │   ├── GemManager.js         # Hidden gems scattered in the world
    │   ├── ShootingStarManager.js # Falling stars with limited time to catch
    │   ├── SkyRingManager.js     # Floating rings to pass through
    │   ├── TrampolineManager.js  # Bounce pad spawning and physics
    │   ├── WaterBottleManager.js # Speed boost bottles
    │   └── Wildlife.js           # Butterflies, rabbits, and birds
    ├── ui/
    │   ├── Compass.js      # Directional compass to nearest fruit
    │   ├── HUD.js          # Score display, messages, and popups
    │   └── Minimap.js      # Minimap overlay
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
- **Rounds**: 8 timed missions with unique visual themes (sky, fog, lighting)
- **Mobile**: Touch controls with virtual joystick and action buttons
