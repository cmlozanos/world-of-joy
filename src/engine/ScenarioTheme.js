import * as THREE from 'three';

const THEMES = {
    morning: {
        skyColor: 0x87ceeb,
        fogColor: 0x87ceeb,
        fogDensity: 0.0012,
        ambientColor: 0xffffff,
        ambientIntensity: 0.5,
        directionalColor: 0xfff4e0,
        directionalIntensity: 1.2,
        directionalPosition: new THREE.Vector3(50, 80, 30),
        hemisphereTop: 0x87ceeb,
        hemisphereBottom: 0x556b2f,
        hemisphereIntensity: 0.4,
    },
    forest: {
        skyColor: 0x3a6b3a,
        fogColor: 0x3a6b3a,
        fogDensity: 0.003,
        ambientColor: 0xccffcc,
        ambientIntensity: 0.35,
        directionalColor: 0xaaddaa,
        directionalIntensity: 0.8,
        directionalPosition: new THREE.Vector3(30, 50, 20),
        hemisphereTop: 0x4a8c4a,
        hemisphereBottom: 0x2d4a2d,
        hemisphereIntensity: 0.5,
    },
    sunset: {
        skyColor: 0xff7744,
        fogColor: 0xff8855,
        fogDensity: 0.0015,
        ambientColor: 0xffd4b2,
        ambientIntensity: 0.4,
        directionalColor: 0xff6622,
        directionalIntensity: 1.5,
        directionalPosition: new THREE.Vector3(10, 25, 60),
        hemisphereTop: 0xff8866,
        hemisphereBottom: 0x553322,
        hemisphereIntensity: 0.4,
    },
    misty: {
        skyColor: 0x8899aa,
        fogColor: 0x8899aa,
        fogDensity: 0.004,
        ambientColor: 0xccccdd,
        ambientIntensity: 0.45,
        directionalColor: 0xbbc4d0,
        directionalIntensity: 0.6,
        directionalPosition: new THREE.Vector3(40, 70, 40),
        hemisphereTop: 0x8899aa,
        hemisphereBottom: 0x445544,
        hemisphereIntensity: 0.35,
    },
    golden: {
        skyColor: 0xffcc44,
        fogColor: 0xffdd88,
        fogDensity: 0.001,
        ambientColor: 0xfff0cc,
        ambientIntensity: 0.6,
        directionalColor: 0xffbb00,
        directionalIntensity: 1.8,
        directionalPosition: new THREE.Vector3(20, 50, 50),
        hemisphereTop: 0xffdd66,
        hemisphereBottom: 0x887722,
        hemisphereIntensity: 0.5,
    },
    crystal: {
        skyColor: 0x1a1a3e,
        fogColor: 0x2a2a5e,
        fogDensity: 0.002,
        ambientColor: 0x8888ff,
        ambientIntensity: 0.35,
        directionalColor: 0xaaccff,
        directionalIntensity: 0.7,
        directionalPosition: new THREE.Vector3(30, 60, 30),
        hemisphereTop: 0x4444aa,
        hemisphereBottom: 0x222244,
        hemisphereIntensity: 0.4,
    },
    starry: {
        skyColor: 0x0a0a2e,
        fogColor: 0x111133,
        fogDensity: 0.0008,
        ambientColor: 0x6666aa,
        ambientIntensity: 0.3,
        directionalColor: 0xccccff,
        directionalIntensity: 0.5,
        directionalPosition: new THREE.Vector3(40, 80, 40),
        hemisphereTop: 0x222266,
        hemisphereBottom: 0x111122,
        hemisphereIntensity: 0.3,
    },
    aerial: {
        skyColor: 0x66ccff,
        fogColor: 0x88ddff,
        fogDensity: 0.0008,
        ambientColor: 0xffffff,
        ambientIntensity: 0.6,
        directionalColor: 0xffffff,
        directionalIntensity: 1.4,
        directionalPosition: new THREE.Vector3(50, 90, 30),
        hemisphereTop: 0x88ddff,
        hemisphereBottom: 0x44aa44,
        hemisphereIntensity: 0.5,
    },
};

export class ScenarioTheme {
    apply(themeName, scene, lights) {
        const theme = THEMES[themeName];
        if (!theme) return;

        scene.background = new THREE.Color(theme.skyColor);
        scene.fog = new THREE.FogExp2(theme.fogColor, theme.fogDensity);

        lights.ambient.color.setHex(theme.ambientColor);
        lights.ambient.intensity = theme.ambientIntensity;

        lights.directional.color.setHex(theme.directionalColor);
        lights.directional.intensity = theme.directionalIntensity;
        lights.directional.position.copy(theme.directionalPosition);

        lights.hemisphere.color.setHex(theme.hemisphereTop);
        lights.hemisphere.groundColor.setHex(theme.hemisphereBottom);
        lights.hemisphere.intensity = theme.hemisphereIntensity;
    }
}
