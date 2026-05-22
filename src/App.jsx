import React, { useMemo, useState } from "react";

export default function App() {
  const [speed, setSpeed] = useState(0.6); // m/s
  const [gapUm, setGapUm] = useState(30); // micrometer
  const [tiltX, setTiltX] = useState(-0.15); // mrad, negative = converging wedge for U > 0
  const [tiltY, setTiltY] = useState(0.0); // mrad
  const [mu, setMu] = useState(0.04); // Pa·s
  const [rho, setRho] = useState(1050); // kg/m3
  const [nIndex, setNIndex] = useState(1.0);
  const [contactGapUm, setContactGapUm] = useState(12);
  const [mode, setMode] = useState("newtonian");
  const [colorMode, setColorMode] = useState("relative");
  const [colorRef, setColorRef] = useState(null);

  const sim = useMemo(() => {
    return runSimulation({
      speed,
      gapUm,
      tiltX,
      tiltY,
      mu,
      rho,
      nIndex,
      contactGapUm,
      shearThinning: mode === "shear",
    });
  }, [speed, gapUm, tiltX, tiltY, mu, rho, nIndex, contactGapUm, mode]);

  const cards = [
    ["Max total pressure", `${format(sim.maxP / 1000)} kPa`],
    ["Max contact pressure", `${format(sim.maxContactP / 1000)} kPa`],
    ["Lift force", `${format(sim.lift)} N`],
    ["Avg. |q|", `${format(sim.avgFlowRate * 1e9)} mm²/s`],
    ["Avg. shear stress", `${format(sim.avgShear)} Pa`],
    ["Avg. removal rate", `${format(sim.avgRR)} arb.`],
    ["Non-uniformity", `${format(sim.nu)} %`],
    ["Re", `${format(sim.re)}`],
  ];

  const saveColorReference = () => {
    setColorRef({
      pressure: Math.max(sim.maxP, 1e-12),
      shear: Math.max(sim.maxShear, 1e-12),
      rr: Math.max(sim.maxRR, 1e-12),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm text-slate-400">Fluid Mechanics Term Project</p>
          <h1 className="text-3xl font-semibold tracking-tight">CMP Slurry Flow Simulator</h1>
          <p className="max-w-4xl text-slate-300">
            Reynolds lubrication model with optional shear-thinning viscosity and simplified asperity-contact pressure correction.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <Panel title="Input parameters">
            <Toggle value={mode} setValue={setMode} />
            <ColorToggle value={colorMode} setValue={setColorMode} hasReference={Boolean(colorRef)} />
            <button
              onClick={saveColorReference}
              className="mb-3 w-full rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Set current color reference
            </button>
            <ReferenceBox colorRef={colorRef} />
            <Slider label="Relative sliding speed U" value={speed} setValue={setSpeed} min={0.05} max={2.0} step={0.05} unit="m/s" />
            <Slider label="Base gap h₀" value={gapUm} setValue={setGapUm} min={8} max={100} step={1} unit="µm" />
            <Slider label="Pad tilt θx" value={tiltX} setValue={setTiltX} min={-0.5} max={0.5} step={0.01} unit="mrad" />
            <Slider label="Pad tilt θy" value={tiltY} setValue={setTiltY} min={-0.5} max={0.5} step={0.01} unit="mrad" />
            <Slider label="Slurry viscosity μ" value={mu} setValue={setMu} min={0.005} max={0.15} step={0.005} unit="Pa·s" />
            <Slider label="Slurry density ρ" value={rho} setValue={setRho} min={900} max={1400} step={10} unit="kg/m³" />
            <Slider label="Shear-thinning index n" value={nIndex} setValue={setNIndex} min={0.45} max={1.0} step={0.01} unit="" disabled={mode !== "shear"} />
            <Slider label="Critical contact gap" value={contactGapUm} setValue={setContactGapUm} min={5} max={40} step={1} unit="µm" />
          </Panel>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              {cards.map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg">
                  <div className="text-xs text-slate-400">{k}</div>
                  <div className="mt-1 text-xl font-semibold">{v}</div>
                </div>
              ))}
            </div>

            <StatusBar sim={sim} />

            <div className="grid gap-4 xl:grid-cols-3">
              <HeatMap
                title="Pressure distribution"
                subtitle="total pressure = fluid + contact"
                data={sim.pressure}
                unit="kPa"
                scale={1000}
                colorMode={colorMode}
                fixedMax={colorRef?.pressure}
              />
              <HeatMap
                title="Shear stress"
                subtitle="τ ≈ μeff U / h"
                data={sim.shear}
                unit="Pa"
                scale={1}
                colorMode={colorMode}
                fixedMax={colorRef?.shear}
              />
              <HeatMap
                title="Removal rate map"
                subtitle="RR = kp Ptotal U"
                data={sim.rr}
                unit="arb."
                scale={1}
                colorMode={colorMode}
                fixedMax={colorRef?.rr}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Panel title="Validation checks">
            <CheckRow label="Thin-gap condition" value={sim.epsilon < 0.01} detail={`ε = h₀/L = ${format(sim.epsilon)}`} />
            <CheckRow label="Low-Re lubrication trend" value={sim.re < 10} detail={`Re = ρUh₀/μ = ${format(sim.re)}`} />
            <CheckRow label="Flow-rate calculation" value={sim.avgFlowRate >= 0} detail={`avg |q| = ${format(sim.avgFlowRate * 1e9)} mm²/s`} />
            <CheckRow label="Positive gap profile" value={sim.rawMinGap > 0} detail={`raw min h = ${format(sim.rawMinGap * 1e6)} µm`} />
            <CheckRow label="Converging wedge for U direction" value={sim.isConverging} detail={sim.wedgeDetail} />
            <CheckRow label="Pressure generation" value={sim.maxFluidP > 1e-6 || sim.maxContactP > 1e-6} detail={sim.pressureDetail} />
          </Panel>

          <Panel title="Design interpretation">
            <p className="text-sm leading-6 text-slate-300">
              The simulator compares average removal rate and removal-rate non-uniformity. A smaller gap or higher speed can increase removal rate, but it can also amplify pressure peaks, contact contribution, and local over-polishing risk.
            </p>
            <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
              <p className="font-medium text-slate-100">Process-window message</p>
              <p className="mt-1">
                A condition with the largest average removal rate is not automatically the best condition. A safer window should keep sufficient average removal rate while limiting pressure peaks and removal-rate non-uniformity.
              </p>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  );
}

function runSimulation(params) {
  const N = 35;
  const L = 0.1;
  const dx = L / (N - 1);
  const dy = dx;
  const h0 = params.gapUm * 1e-6;
  const contactGap = params.contactGapUm * 1e-6;
  const thetaX = params.tiltX * 1e-3;
  const thetaY = params.tiltY * 1e-3;
  const slopeX = Math.tan(thetaX);
  const slopeY = Math.tan(thetaY);
  const U = params.speed;
  const V = 0;
  const mu0 = params.mu;
  const rho = params.rho;
  const K = mu0;
  const minNumericalGap = 2e-6;

  const p = Array.from({ length: N }, () => Array(N).fill(0));
  const h = Array.from({ length: N }, () => Array(N).fill(h0));
  const mue = Array.from({ length: N }, () => Array(N).fill(mu0));

  let minGap = Infinity;
  let rawMinGap = Infinity;
  let sumMuEff = 0;
  let muCount = 0;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const x = -L / 2 + i * dx;
      const y = -L / 2 + j * dy;
      const rawH = h0 + slopeX * x + slopeY * y;
      rawMinGap = Math.min(rawMinGap, rawH);
      const hij = Math.max(rawH, minNumericalGap);
      h[j][i] = hij;
      minGap = Math.min(minGap, hij);

      if (params.shearThinning) {
        const gamma = Math.max(U / hij, 1);
        const refGamma = 1000;
        mue[j][i] = Math.max(0.002, K * Math.pow(gamma / refGamma, params.nIndex - 1));
      }
      sumMuEff += mue[j][i];
      muCount += 1;
    }
  }

  const A = Array.from({ length: N }, () => Array(N).fill(0));
  const rhs = Array.from({ length: N }, () => Array(N).fill(0));

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      A[j][i] = Math.pow(h[j][i], 3) / (12 * mue[j][i]);
    }
  }

  for (let j = 1; j < N - 1; j++) {
    for (let i = 1; i < N - 1; i++) {
      const dhdx = (h[j][i + 1] - h[j][i - 1]) / (2 * dx);
      const dhdy = (h[j + 1][i] - h[j - 1][i]) / (2 * dy);
      rhs[j][i] = 0.5 * (U * dhdx + V * dhdy);
    }
  }

  const omega = 1.55;
  for (let iter = 0; iter < 900; iter++) {
    for (let j = 1; j < N - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        const ae = 0.5 * (A[j][i] + A[j][i + 1]) / (dx * dx);
        const aw = 0.5 * (A[j][i] + A[j][i - 1]) / (dx * dx);
        const an = 0.5 * (A[j][i] + A[j + 1][i]) / (dy * dy);
        const as = 0.5 * (A[j][i] + A[j - 1][i]) / (dy * dy);
        const ap = ae + aw + an + as;
        const newP = (ae * p[j][i + 1] + aw * p[j][i - 1] + an * p[j + 1][i] + as * p[j - 1][i] - rhs[j][i]) / ap;
        p[j][i] = Math.max(0, (1 - omega) * p[j][i] + omega * newP);
      }
    }
  }

  const maxFluidP = Math.max(...p.flat());
  const viscousPressureScale = Math.abs((mu0 * U * L) / Math.max(h0 * h0, minNumericalGap * minNumericalGap));
  const contactScale = 0.15 * Math.max(maxFluidP, viscousPressureScale, 1);

  // Depth-integrated lubrication flow rates per unit width:
  // qx = -h^3/(12 μeff) dp/dx + Uh/2
  // qy = -h^3/(12 μeff) dp/dy + Vh/2
  const qx = Array.from({ length: N }, () => Array(N).fill(0));
  const qy = Array.from({ length: N }, () => Array(N).fill(0));
  const qMag = Array.from({ length: N }, () => Array(N).fill(0));
  let sumFlowRate = 0;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const im = Math.max(i - 1, 0);
      const ip = Math.min(i + 1, N - 1);
      const jm = Math.max(j - 1, 0);
      const jp = Math.min(j + 1, N - 1);
      const dpdx = ip === im ? 0 : (p[j][ip] - p[j][im]) / ((ip - im) * dx);
      const dpdy = jp === jm ? 0 : (p[jp][i] - p[jm][i]) / ((jp - jm) * dy);
      const mobility = Math.pow(h[j][i], 3) / (12 * mue[j][i]);

      qx[j][i] = -mobility * dpdx + 0.5 * U * h[j][i];
      qy[j][i] = -mobility * dpdy + 0.5 * V * h[j][i];
      qMag[j][i] = Math.sqrt(qx[j][i] * qx[j][i] + qy[j][i] * qy[j][i]);
      sumFlowRate += qMag[j][i];
    }
  }

  const contact = Array.from({ length: N }, () => Array(N).fill(0));
  const pTotal = Array.from({ length: N }, () => Array(N).fill(0));
  const shear = Array.from({ length: N }, () => Array(N).fill(0));
  const rr = Array.from({ length: N }, () => Array(N).fill(0));

  let maxP = 0;
  let maxContactP = 0;
  let lift = 0;
  let sumRR = 0;
  let sumShear = 0;
  let count = 0;
  const kp = 1;

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const c = Math.max(0, (contactGap - h[j][i]) / contactGap);
      contact[j][i] = contactScale * c * c;
      pTotal[j][i] = p[j][i] + contact[j][i];
      shear[j][i] = mue[j][i] * U / h[j][i];
      rr[j][i] = kp * pTotal[j][i] * U / 1000;
      maxP = Math.max(maxP, pTotal[j][i]);
      maxContactP = Math.max(maxContactP, contact[j][i]);
      lift += pTotal[j][i] * dx * dy;
      sumRR += rr[j][i];
      sumShear += shear[j][i];
      count++;
    }
  }

  const avgRR = sumRR / count;
  const avgShear = sumShear / count;
  const avgFlowRate = sumFlowRate / count;
  let variance = 0;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      variance += Math.pow(rr[j][i] - avgRR, 2);
    }
  }
  const stdRR = Math.sqrt(variance / count);
  const nu = avgRR > 0 ? (stdRR / avgRR) * 100 : 0;
  const re = (rho * U * h0) / mu0;
  const epsilon = h0 / L;
  const maxShear = Math.max(...shear.flat());
  const maxRR = Math.max(...rr.flat());
  const avgMuEff = sumMuEff / muCount;

  const wedgeDriving = U * slopeX + V * slopeY;
  const isConverging = Math.abs(wedgeDriving) < 1e-12 ? false : wedgeDriving < 0;
  const wedgeDetail = Math.abs(wedgeDriving) < 1e-12
    ? "uniform gap: hydrodynamic pressure should be weak"
    : wedgeDriving < 0
      ? "converging gap along sliding direction"
      : "diverging gap: positive pressure is clipped by cavitation treatment";
  const pressureDetail = maxFluidP <= 1e-6 && maxContactP <= 1e-6
    ? "nearly zero pressure: try negative θx, smaller gap, or lower contact gap threshold"
    : `fluid max ${format(maxFluidP / 1000)} kPa, contact max ${format(maxContactP / 1000)} kPa`;

  return {
    pressure: pTotal,
    shear,
    rr,
    maxP,
    maxFluidP,
    maxContactP,
    maxShear,
    maxRR,
    lift,
    avgFlowRate,
    avgShear,
    avgRR,
    qx,
    qy,
    qMag,
    nu,
    re,
    epsilon,
    minGap,
    rawMinGap,
    avgMuEff,
    isConverging,
    wedgeDetail,
    pressureDetail,
  };
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Slider({ label, value, setValue, min, max, step, unit, disabled }) {
  return (
    <label className={`mb-4 block ${disabled ? "opacity-40" : ""}`}>
      <div className="mb-1 flex justify-between gap-4 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-medium text-slate-100">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </label>
  );
}

function Toggle({ value, setValue }) {
  return (
    <div className="mb-5 grid grid-cols-2 rounded-xl bg-slate-950 p-1 text-sm">
      <button
        onClick={() => setValue("newtonian")}
        className={`rounded-lg px-3 py-2 ${value === "newtonian" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
      >
        Newtonian
      </button>
      <button
        onClick={() => setValue("shear")}
        className={`rounded-lg px-3 py-2 ${value === "shear" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
      >
        Shear-thinning
      </button>
    </div>
  );
}

function ColorToggle({ value, setValue, hasReference }) {
  return (
    <div className="mb-3">
      <div className="mb-2 text-sm text-slate-300">Heatmap color scale</div>
      <div className="grid grid-cols-2 rounded-xl bg-slate-950 p-1 text-sm">
        <button
          onClick={() => setValue("relative")}
          className={`rounded-lg px-3 py-2 ${value === "relative" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
        >
          Relative
        </button>
        <button
          onClick={() => setValue("fixed")}
          className={`rounded-lg px-3 py-2 ${value === "fixed" ? "bg-cyan-500 text-slate-950" : "text-slate-300"}`}
        >
          Fixed
        </button>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Relative rescales each map. Fixed compares later cases with the saved reference{hasReference ? "." : "; save a reference first."}
      </p>
    </div>
  );
}

function ReferenceBox({ colorRef }) {
  return (
    <div className="mb-5 rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-400">
      {colorRef ? (
        <>
          <div className="font-medium text-slate-200">Saved fixed-scale reference</div>
          <div>Pressure: {format(colorRef.pressure / 1000)} kPa</div>
          <div>Shear: {format(colorRef.shear)} Pa</div>
          <div>RR: {format(colorRef.rr)} arb.</div>
        </>
      ) : (
        <div>No fixed-scale reference saved yet.</div>
      )}
    </div>
  );
}

function StatusBar({ sim }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
      <span className="font-medium text-slate-100">Current flow interpretation: </span>
      {sim.wedgeDetail}. Minimum gap used in solver: {format(sim.minGap * 1e6)} µm.
    </div>
  );
}

function HeatMap({ title, subtitle, data, unit, scale, colorMode, fixedMax }) {
  const flat = data.flat();
  const currentMin = Math.min(...flat);
  const currentMax = Math.max(...flat);
  const min = colorMode === "fixed" ? 0 : currentMin;
  const max = colorMode === "fixed" && fixedMax ? fixedMax : currentMax;
  const N = data.length;
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="shrink-0 text-xs text-slate-400">max {format(currentMax / scale)} {unit}</span>
      </div>
      <div className="grid aspect-square overflow-hidden rounded-xl border border-slate-800" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {data.map((row, j) =>
          row.map((v, i) => <div key={`${j}-${i}`} style={{ backgroundColor: colorMap(v, min, max) }} />)
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>min {format(currentMin / scale)} {unit}</span>
        <span>{colorMode === "fixed" && fixedMax ? `ref ${format(fixedMax / scale)} ${unit}` : "relative high"}</span>
      </div>
    </div>
  );
}

function CheckRow({ label, value, detail }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4 rounded-xl bg-slate-950 p-3">
      <div>
        <div className="text-sm font-medium text-slate-100">{label}</div>
        <div className="text-xs text-slate-400">{detail}</div>
      </div>
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${value ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
        {value ? "OK" : "Check"}
      </span>
    </div>
  );
}

function colorMap(v, min, max) {
  const denom = Math.max(max - min, 1e-30);
  const t = Math.max(0, Math.min(1, (v - min) / denom));
  const r = Math.round(25 + 225 * t);
  const g = Math.round(80 + 130 * (1 - Math.abs(t - 0.5) * 2));
  const b = Math.round(210 - 170 * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function format(x) {
  if (!Number.isFinite(x)) return "0";
  if (Math.abs(x) >= 1000) return x.toExponential(2);
  if (Math.abs(x) >= 100) return x.toFixed(0);
  if (Math.abs(x) >= 10) return x.toFixed(1);
  if (Math.abs(x) >= 1) return x.toFixed(2);
  if (Math.abs(x) >= 0.01) return x.toFixed(3);
  return x.toExponential(2);
}
