"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function Home() {
  const [year, setYear] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <main className="shell">
      <div className="shell-inner">
        {/* Header */}
        <header className="top-meta">
          <div className="brand">
            <div className="brand-name">QORSCEND</div>
            <div className="brand-sub">AI OPERATING LAYER FOR QUANTUM COMPUTING</div>
          </div>
          <div className="env-pill">
            <span className="env-dot"></span>
            <span>Labs &amp; research preview</span>
          </div>
        </header>

        <div className="layout-main">
          {/* Hero Section */}
          <section className="hero-block">
            <div className="hero-grid">
              <div className="hero-left">
                <div className="eyebrow">Software-first quantum platform</div>
                <h1 className="hero-title">
                  <span>The AI operating layer</span> for modern quantum teams.
                </h1>
                <p className="hero-sub">
                  Qorscend gives labs, startups and classrooms one place to work across frameworks and hardware without
                  rewriting circuits or fighting noisy output on every experiment.
                </p>
                <p className="hero-sub">
                  Convert code, compare real devices and clean results in a single flow. Less glue code, more time
                  running the ideas that actually move your research forward.
                </p>
                <div className="hero-tagline">Built for people who ship real quantum work</div>
                <div className="cta-row">
                  <Link href="/signup" className="btn btn-primary">
                    Start 7-day free trial
                  </Link>
                  <Link href="/signup" className="btn btn-ghost">
                    Enter dashboard
                  </Link>
                </div>
                <div className="hero-meta">
                  Full access during trial. Ideal for university labs, research groups and early quantum products.
                </div>
              </div>
              <div className="hero-right">
                <div className="hero-orbit-panel">
                  <div className="hero-orbit-inner">
                    <div className="hero-orbit-title">Quantum workspace snapshot</div>
                    <div className="hero-orbit-metric-row">
                      <div className="metric">
                        <div className="metric-label">Active frameworks</div>
                        <div className="metric-value">5</div>
                        <div className="metric-sub">Qiskit · Cirq · PennyLane · Braket · PyQuil</div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Live backends</div>
                        <div className="metric-value">18</div>
                        <div className="metric-sub">Queued, stable and experimental devices</div>
                      </div>
                    </div>
                    <div className="hero-orbit-bar">
                      <div className="hero-orbit-bar-fill"></div>
                    </div>
                    <div className="hero-orbit-foot">
                      One surface that understands your code, your hardware options and your measurement data.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Value Statement Section */}
          <section className="section">
            <h2 className="section-title">Standardizing the quantum development workflow</h2>
            <p className="section-body">
              Qorscend starts with three foundational modules designed for classrooms, research groups and startups.
              Each module removes a specific bottleneck in the path from idea to result, giving teams a consistent way
              to work across frameworks, providers and experiments.
            </p>
          </section>

          {/* Modules Section */}
          <section className="section">
            <h2 className="section-title">The first modules of the Qorscend Quantum Developer Cloud</h2>
            <div className="product-row">
              <article className="product-card">
                <div className="product-label">QCode Convert™</div>
                <div className="product-name">SDK-agnostic circuit translation.</div>
                <div className="product-line">
                  Instantly translate circuits across Qiskit, Cirq, PennyLane, Braket and PyQuil. Convert, optimize and
                  export without maintaining multiple versions of the same notebook.
                </div>
                <div className="product-foot">Solves SDK fragmentation and interoperability overhead.</div>
                <Link href="/qcode-convert" className="product-cta">
                  Try QCode Convert →
                </Link>
              </article>

              <article className="product-card">
                <div className="product-label">QBenchmark Live™</div>
                <div className="product-name">Live view of real quantum hardware.</div>
                <div className="product-line">
                  Compare queue times, error rates, device stability and backend performance across providers in
                  seconds, before running a single circuit.
                </div>
                <div className="product-foot">Solves backend selection uncertainty and wasted compute credits.</div>
                <Link href="/qbenchmark-live" className="product-cta">
                  Explore live benchmarks →
                </Link>
              </article>

              <article className="product-card">
                <div className="product-label">QData Clean™</div>
                <div className="product-name">Structured quantum results for analysis.</div>
                <div className="product-line">
                  Transform noisy output into clean CSV, JSON or Excel datasets ready for visualization or machine
                  learning pipelines.
                </div>
                <div className="product-foot">Solves messy measurement data and hours of manual cleanup.</div>
                <Link href="/qdata-clean" className="product-cta">
                  Clean your results →
                </Link>
              </article>
            </div>
          </section>

          {/* Workflow Section */}
          <section className="section">
            <h2 className="section-title">End-to-end quantum workflows</h2>
            <p className="section-body">
              Qorscend links the modules into a single, repeatable workflow:
              Convert → Benchmark → Run → Clean → Export.
            </p>
            <ul className="workflow-list">
              <li>Convert circuits between SDKs without rewriting code.</li>
              <li>Select hardware based on live backend conditions.</li>
              <li>Export structured results directly into analysis tools.</li>
            </ul>
            <div className="pill-row">
              <span className="pill">University labs</span>
              <span className="pill">Research groups</span>
              <span className="pill">Quantum startups</span>
              <span className="pill">Hackathon teams</span>
              <span className="pill">Classroom teaching</span>
            </div>
          </section>

          {/* Pain Points Section */}
          <section className="section">
            <h2 className="section-title">Solving three core problems in quantum development</h2>
            <ul className="pain-list">
              <li>
                <strong>SDK fragmentation.</strong> Every framework speaks a different language. Qorscend provides
                consistent translation across ecosystems.
              </li>
              <li>
                <strong>Hardware guesswork.</strong> Backend selection is often blind. Qorscend surfaces live device
                behavior before runs are queued.
              </li>
              <li>
                <strong>Noisy, unusable output.</strong> Quantum results are difficult to interpret. Qorscend structures
                and cleans data automatically.
              </li>
            </ul>
          </section>

          {/* Vision Section */}
          <section className="section section-vision">
            <h2 className="section-title">
              The future of <strong>QORSCEND</strong>
            </h2>
            <p className="section-body">
              The current modules are the foundation of a larger mission: building an intelligent software layer that
              makes quantum computing practical at scale. Two flagship systems define where Qorscend is going next.
            </p>
            <div className="vision-grid">
              {/* QuanAxis Card */}
              <div className="vision-card">
                <div className="vision-copy">
                  <h4>
                    <strong>QuanAxis™ — AI-Guided Quantum Intelligence</strong>
                  </h4>
                  <p>
                    <strong>The intelligence engine behind future quantum development.</strong>
                    QuanAxis is a next-generation AI system that understands quantum circuits at a structural level, not
                    just as lines of code.
                  </p>
                  <p>
                    <strong>Circuit understanding.</strong> It reads circuits semantically, spotting patterns, repeated
                    blocks and sensitive regions that are likely to amplify noise or fail on real devices.
                  </p>
                  <p>
                    <strong>Automatic optimization.</strong> Using search and learned heuristics, QuanAxis proposes
                    variants with fewer gates, reduced depth and lower noise sensitivity, tuned to specific hardware.
                  </p>
                  <p>
                    <strong>Backend-aware adaptation.</strong> By learning from QBenchmark Live, it reshapes circuits to
                    match the strengths and limitations of different platforms — ion traps, superconducting qubits,
                    neutral atoms and beyond.
                  </p>
                  <p>
                    <strong>AI co-creator.</strong> QuanAxis generates alternative circuit designs that pursue the same
                    goal via different pathways, giving experts a superhuman partner and helping new teams ship usable
                    circuits faster.
                  </p>
                  <p>
                    Over time, QuanAxis becomes the <strong>brain of Qorscend</strong>: shortening development cycles,
                    improving execution quality and turning every lab's history of experiments into a private
                    intelligence layer.
                  </p>
                </div>
                <div className="vision-media axis">
                  <div className="axis-node core"></div>
                  <div className="axis-node n1"></div>
                  <div className="axis-node n2"></div>
                  <div className="axis-node n3"></div>
                  <div className="axis-node n4"></div>

                  <div className="axis-link l1"></div>
                  <div className="axis-link l2"></div>
                  <div className="axis-link l3"></div>
                  <div className="axis-link l4"></div>

                  <div className="vision-media-label">Adaptive circuit intelligence graph</div>
                </div>
              </div>

              {/* QuanCore OS Card */}
              <div className="vision-card">
                <div className="vision-copy">
                  <h4>
                    <strong>QuanCore OS™ — Universal Quantum Abstraction Layer</strong>
                  </h4>
                  <p>
                    <strong>The operating system for a fragmented quantum landscape.</strong>
                    QuanCore OS is the backbone of the Qorscend ecosystem — a unified control layer that treats every
                    provider, simulator and tool as part of one coherent environment.
                  </p>
                  <p>
                    <strong>One interface for every backend.</strong> Teams write against a single, stable API while
                    QuanCore OS handles the translation to IBM, AWS Braket, Google, IonQ, Rigetti, OQC, Xanadu,
                    Honeywell, simulators and local tools.
                  </p>
                  <p>
                    <strong>Device-independent execution.</strong> Code is written once and executed anywhere. QuanCore
                    OS maps circuits to real hardware without developers worrying about SDK syntax or device quirks.
                  </p>
                  <p>
                    <strong>Intelligent routing.</strong> Using live data from QBenchmark Live, QuanCore OS chooses the
                    most appropriate device for each job based on speed, stability, cost and expected fidelity.
                  </p>
                  <p>
                    <strong>Platform for quantum apps.</strong> The layer is designed to host optimizers, simulators,
                    error-mitigation tools, visualisation apps and education packs — turning Qorscend into a true
                    quantum software ecosystem.
                  </p>
                  <p>
                    Together, these capabilities position QuanCore OS as the missing operating layer of quantum
                    computing: the software fabric that makes distributed quantum resources feel as simple as cloud
                    compute.
                  </p>
                </div>
                <div className="vision-media">
                  <div className="vision-media-symbol">CORE</div>
                  <div className="vision-media-ring"></div>
                  <div className="vision-media-label">Global backend routing surface</div>
                </div>
              </div>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="section final-cta">
            <h2 className="section-title">Talk with us about your quantum roadmap</h2>
            <p className="section-body">
              If you are running a lab, research group or early-stage quantum product, Qorscend can give your team a
              cleaner operating surface across frameworks and hardware. We can help map our tools to your stack and
              future plans.
            </p>
            <div className="final-cta-buttons">
              <Link href="/contact" className="btn btn-ghost">
                Contact us
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <span>© {year} QORSCEND. AI operating layer for the next decade of quantum tooling.</span>
            <span>Three modules today. A complete quantum software surface in development.</span>
          </footer>
        </div>
      </div>
    </main>
  )
}
