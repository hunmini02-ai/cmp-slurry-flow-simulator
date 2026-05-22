# CMP Slurry Flow Simulator

Web-based CMP slurry flow simulator for a Fluid Mechanics term project.

## Topic

**CMP (Chemical Mechanical Polishing) Slurry Flow: Lubrication Theory**

The simulator visualizes pressure distribution, shear stress, and removal rate distribution between a wafer and polishing pad using a simplified Reynolds lubrication model.

## Main features

- Relative sliding speed, base gap, pad tilt, viscosity, density, shear-thinning index, and critical contact gap controls
- Newtonian and shear-thinning slurry comparison
- Pressure, shear stress, and removal-rate heatmaps
- Relative and fixed color-scale modes
- Lift force, max pressure, average removal rate, non-uniformity, and Reynolds number outputs
- Validation checks for lubrication-flow interpretation

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Build for deployment

```bash
npm run build
npm run preview
```

## Vercel deployment settings

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

## Suggested report appendix text

The web simulator was implemented using React and Vite. It solves a simplified Reynolds lubrication model on a two-dimensional grid and visualizes the resulting pressure distribution, shear stress, and Preston-type removal-rate distribution. The deployed simulator and source code are provided in the project repository.
