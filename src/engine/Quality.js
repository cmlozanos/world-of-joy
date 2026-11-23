const STORAGE_KEY = 'world-of-joy-quality';
const DEFAULT_LIGHT = true;

export const quality = {
    light: DEFAULT_LIGHT,
    revision: 0,
    init() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'light' || saved === 'normal') this.light = saved === 'light';
        } catch (_) { /* Private/storage-disabled browsers still support the toggle. */ }
        const button = document.getElementById('global-quality-btn');
        const updateButton = () => {
            document.documentElement.classList.toggle('quality-light', this.light);
            button.setAttribute('aria-pressed', String(this.light));
            button.setAttribute('aria-label', this.light ? 'Activar gráficos normales' : 'Activar modo ligero');
            button.title = button.getAttribute('aria-label');
            // Inline vector works even when Android 5 has no modern emoji font.
            button.innerHTML = '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 32 32"><path d="M26 5C10 3 3 12 7 21c4 7 19 5 19-16Z" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="m5 28 16-16M11 22v-8m0 8h8" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
        };
        button.addEventListener('click', () => {
            this.light = !this.light;
            this.revision++;
            try { localStorage.setItem(STORAGE_KEY, this.light ? 'light' : 'normal'); } catch (_) {}
            updateButton();
        });
        updateButton();
    },
    apply(game) {
        const dark = (globalThis.window?.FamilyV2?.theme?.() ?? (globalThis.window?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark';
        // Scenario changes replace the background/fog; remember their unmodified values.
        if (game.appearanceBackground !== game.scene.background) {
            game.appearanceBackground = game.scene.background;
            game.dayBackground = game.scene.background?.clone();
            game.dayFog = game.scene.fog?.color.clone();
            game.appearanceTheme = null;
        }
        if (game.appearanceTheme !== dark) {
            game.appearanceTheme = dark;
            if (game.scene.background) game.scene.background.copy(dark ? game.dayBackground.clone().multiplyScalar(0.22) : game.dayBackground);
            if (game.scene.fog && game.dayFog) game.scene.fog.color.copy(dark ? game.dayFog.clone().multiplyScalar(0.22) : game.dayFog);
            for (const light of Object.values(game.lights || {})) {
                if (!light?.color) continue;
                light.userData.dayColor ??= light.color.clone();
                // ScenarioTheme reconfigures these lights before calling quality.apply.
                if (game.appearanceLightingScenario !== game.dayBackground) {
                    light.userData.dayColor.copy(light.color);
                    light.userData.dayIntensity = light.intensity;
                }
                light.color.copy(light.userData.dayColor);
                if (dark) light.color.lerp({r:0.45,g:0.62,b:0.95}, 0.35);
                light.intensity = light.userData.dayIntensity * (dark ? 0.72 : 1);
            }
            game.appearanceLightingScenario = game.dayBackground;
        }
        const revision = `${this.revision}:${game.scene.children.length}`;
        if (game.qualityRevision === revision) return;
        game.qualityRevision = revision;
        const qualityChanged = game.qualitySettingRevision !== this.revision;
        game.qualitySettingRevision = this.revision;
        const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        game.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.light ? 1 : (mobile ? 1.5 : 2)));
        game.renderer.shadowMap.enabled = !this.light;
        game.scene.traverse(object => {
            // Recompile the shadow define when toggling an already-rendered scene.
            // Merely stopping shadow-map updates can leave the previous shadow visible.
            if (object.isMesh && qualityChanged) {
                const materials = Array.isArray(object.material) ? object.material : [object.material];
                for (const material of materials) material.needsUpdate = true;
            }
            if (!object.isPointLight) return;
            if (object.userData.normalVisible === undefined) object.userData.normalVisible = object.visible;
            object.visible = this.light ? false : object.userData.normalVisible;
        });
    }
};
