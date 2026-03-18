# World of Joy 🌳

A 3D browser game built with Three.js featuring four modes: open-world exploration, word building, number operations, and road racing.

## Getting Started

### Requirements

- Python 3 (for the development server)
- A modern web browser with WebGL support

### Running the Game

```bash
make serve
```

Then open [http://localhost:9999](http://localhost:9999) in your browser.

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

### Modes

- `Explorador`: complete 8 timed rounds collecting fruits and other objects in the open world.
- `Palabras`: form words by collecting letters in order inside a room.
- `Números`: complete operations such as `2 + 2 = 4` by collecting the correct digits in order.
- `Racing`: drive a car along the road, collect fuel and nitro, reach the finish line, and discover educational roadside signs.

All gameplay modes include a visible button to return to the main menu.

### Objective

Complete missions with different visual themes and gameplay styles.

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
    ├── NumberGame.js       # Indoor numbers mode
    ├── RacingGame.js       # Road racing mode
    ├── engine/
    │   ├── InputManager.js       # Keyboard input handling
    │   ├── MusicManager.js       # Procedural background music
    │   ├── NumberRoundManager.js # Number mode progression and equations
    │   ├── ParticleSystem.js     # Particle effects (dust, sparkles)
    │   ├── RacingRoundManager.js # Racing mode progression and fail states
    │   ├── RoundManager.js       # Round progression and mission logic
    │   ├── ScenarioTheme.js      # Visual themes per round
    │   ├── SoundManager.js       # Sound effects via Web Audio API
    │   ├── ThirdPersonCamera.js  # Third-person camera controller
    │   └── TouchControls.js      # Mobile virtual joystick and buttons
    ├── entities/
    │   ├── Character.js          # Player character model and animations
    │   ├── FuelCanManager.js     # Fuel pickup spawning on the road
    │   ├── FruitManager.js       # Fruit spawning, animation, and collection
    │   ├── GemManager.js         # Hidden gems scattered in the world
    │   ├── NumberManager.js      # Number token spawning for operations
    │   ├── NitroCanManager.js    # Nitro boost pickups for racing mode
    │   ├── RaceMarkerManager.js  # Start and finish gates
    │   ├── RacingCar.js          # Car model and driving logic
    │   ├── RoadSignManager.js    # Educational roadside signs for racing
    │   ├── ShootingStarManager.js # Falling stars with limited time to catch
    │   ├── SkyRingManager.js     # Floating rings to pass through
    │   ├── TrampolineManager.js  # Bounce pad spawning and physics
    │   ├── WaterBottleManager.js # Speed boost bottles
    │   └── Wildlife.js           # Butterflies, rabbits, and birds
    ├── ui/
    │   ├── Compass.js      # Directional compass to nearest fruit
    │   ├── HUD.js          # Score display, messages, and popups
    │   ├── Minimap.js      # Minimap overlay
    │   ├── NumberHUD.js    # Number mode overlays and equation display
    │   └── WordHUD.js      # Word mode overlays and word display
    ├── world/
    │   └── World.js        # Terrain, trees, and environment generation
    └── styles/
        └── main.css        # Game UI styles
```

## Technical Details

- **Rendering**: Three.js (v0.160.0) loaded via CDN import maps
- **Character**: Procedurally built low-poly child model with walk/run/idle/jump animations
- **World**: Procedurally generated terrain with height variation, trees, rocks, bushes, flowers, clouds, and a looping road
- **Camera**: Smooth third-person follow camera with mouse-controlled orbit
- **Physics**: Simple gravity, ground collision, and tree collision detection
- **Rounds**: Explorer missions, word rounds, number operations, and road races with unique visual themes
- **Learning Layer**: Racing rounds now include colors, shapes, directions, safety signs, counting, and positive vocabulary cues
- **Mobile**: Touch controls with a fixed virtual joystick, smoother steering, and a shared card-based HUD style across modes
- **Wellbeing**: A gentle reminder appears after several minutes of play, and the app enforces a short break after a longer stretch to reduce compulsive play loops
- **Racing Focus**: Racing uses a cleaner road-first world profile with fewer distracting decorative elements and no explorer wildlife system
