'use client';

interface SusFilesLoaderProps {
  stage: 'loading' | 'granted' | 'denied';
}

export default function SusFilesLoader({ stage }: SusFilesLoaderProps) {
  const isGranted = stage === 'granted';

  return (
    <>
      <style>{`
        /* ─── PROGRESS BAR ──────────────────────────── */
        @keyframes sf-progress-loop {
          0%   { width: 0%; }
          100% { width: 90%; }
        }
        @keyframes sf-progress-fill {
          0%   { width: 0%; }
          100% { width: 100%; }
        }

        /* ─── STATUS LABELS ─────────────────────────── */
        @keyframes sf-statusCycle {
          0%, 5%    { opacity: 0; transform: translateY(5px); }
          12%, 30%  { opacity: 1; transform: translateY(0); }
          38%, 100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes sf-statusGranted {
          0%   { opacity: 0; transform: translateY(6px); }
          20%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* ─── FILE ──────────────────────────────────── */
        .sf-body {
          stroke-dasharray: 310;
          stroke-dashoffset: 0;
          animation: none;
        }
        .sf-body-loading {
          stroke-dashoffset: 310;
          animation: sf-drawBody 2.8s ease-out infinite;
        }
        @keyframes sf-drawBody {
          0%, 2%  { stroke-dashoffset: 310; }
          22%,100%{ stroke-dashoffset: 0; }
        }
        .sf-fold {
          stroke-dasharray: 42;
          stroke-dashoffset: 0;
        }
        .sf-fold-loading {
          stroke-dashoffset: 42;
          animation: sf-drawFold 2.8s ease-out infinite;
        }
        @keyframes sf-drawFold {
          0%, 8%  { stroke-dashoffset: 42; }
          22%,100%{ stroke-dashoffset: 0; }
        }
        .sf-ln {
          opacity: 0;
          animation: sf-lineIn 2.8s ease-out infinite;
        }
        .sf-ln-granted { opacity: 1; animation: none; }
        .sf-ln1 { animation-delay: 0.18s; }
        .sf-ln2 { animation-delay: 0.26s; }
        .sf-ln3 { animation-delay: 0.34s; }
        @keyframes sf-lineIn {
          0%, 6%  { opacity: 0; }
          20%,100%{ opacity: 1; }
        }

        /* ─── SCAN BRACKETS ─────────────────────────── */
        .sf-brk {
          opacity: 0;
          animation: sf-brkFlash 2.8s ease-in-out infinite;
        }
        .sf-brk2 { animation-delay: 0.06s; }
        .sf-brk3 { animation-delay: 0.12s; }
        .sf-brk4 { animation-delay: 0.18s; }
        @keyframes sf-brkFlash {
          0%,17%,50%,100% { opacity: 0; }
          21%, 46%        { opacity: 1; }
        }

        /* ─── SCAN BEAM ─────────────────────────────── */
        .sf-beam {
          opacity: 0;
          animation: sf-beamSweep 2.8s ease-in-out infinite;
        }
        @keyframes sf-beamSweep {
          0%, 17% { opacity: 0; transform: translateY(-28px); }
          21%     { opacity: 1; transform: translateY(-28px); }
          44%     { opacity: 1; transform: translateY(28px); }
          49%,100%{ opacity: 0; transform: translateY(28px); }
        }

        /* ─── SCAN DOTS ─────────────────────────────── */
        .sf-dots { animation: sf-dotsShow 2.8s ease-in-out infinite; }
        @keyframes sf-dotsShow {
          0%,17%,49%,100% { opacity: 0; }
          21%, 45%        { opacity: 1; }
        }
        .sf-dot  { animation: sf-blink 0.35s step-end infinite; }
        .sf-dot2 { animation: sf-blink 0.35s step-end 0.12s infinite; }
        .sf-dot3 { animation: sf-blink 0.35s step-end 0.24s infinite; }
        @keyframes sf-blink { 50% { opacity: 0; } }

        /* ─── CHECK RING ────────────────────────────── */
        .sf-ring {
          stroke-dasharray: 188;
          stroke-dashoffset: 188;
          opacity: 0;
          animation: sf-drawRing 2.8s ease-in-out infinite;
        }
        .sf-ring-granted {
          stroke-dasharray: 188;
          stroke-dashoffset: 0;
          opacity: 1;
          animation: none;
        }
        @keyframes sf-drawRing {
          0%, 47%  { stroke-dashoffset: 188; opacity: 0; }
          51%      { opacity: 1; }
          75%,100% { stroke-dashoffset: 0; opacity: 1; }
        }

        /* ─── CHECKMARK ─────────────────────────────── */
        .sf-check {
          stroke-dasharray: 54;
          stroke-dashoffset: 54;
          opacity: 0;
          animation: sf-drawCheck 2.8s ease-in-out infinite;
        }
        .sf-check-granted {
          stroke-dasharray: 54;
          stroke-dashoffset: 0;
          opacity: 1;
          animation: none;
        }
        @keyframes sf-drawCheck {
          0%, 50%  { stroke-dashoffset: 54; opacity: 0; }
          54%      { opacity: 1; }
          75%,100% { stroke-dashoffset: 0; opacity: 1; }
        }

        /* ─── PULSE ─────────────────────────────────── */
        .sf-pulse  { opacity: 0; transform-origin: 80px 65px; }
        .sf-pulse2 { opacity: 0; transform-origin: 80px 65px; }
        .sf-pulse-granted  { animation: sf-pulseOnce 0.8s ease-out forwards; transform-origin: 80px 65px; }
        .sf-pulse2-granted { animation: sf-pulseOnce 0.8s ease-out 0.28s forwards; transform-origin: 80px 65px; }
        @keyframes sf-pulseOnce {
          0%  { opacity: 1; transform: scale(1); }
          100%{ opacity: 0; transform: scale(2); }
        }

        /* ─── BADGE ─────────────────────────────────── */
        .sf-badge {
          opacity: 0;
          transform: scale(0) rotate(-12deg);
          transform-origin: 114px 26px;
        }
        .sf-badge-granted {
          animation: sf-badgePop 0.5s cubic-bezier(.22,1,.36,1) forwards;
          transform-origin: 114px 26px;
        }
        @keyframes sf-badgePop {
          0%   { opacity: 0; transform: scale(0) rotate(-12deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* ── Yellow header bar ── */}
        <div style={{
          background: '#F5F500',
          border: '4px solid #000',
          borderBottom: '4px solid #000',
          padding: '8px 24px',
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: '13px',
          letterSpacing: '0.08em',
          color: '#000',
          width: '280px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '4px 0px 0px #000, -4px 0px 0px #000',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="square">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          SUS FILES
        </div>

        {/* ── Main card ── */}
        <div style={{
          background: '#FAFAF5',
          border: '4px solid #000',
          boxShadow: '6px 6px 0px #000',
          width: '280px',
          padding: '28px 24px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
        }}>

          {/* ── SVG ── */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 130" width="160" height="130" aria-hidden="true">
            <defs>
              <clipPath id="sf-clip">
                <rect x="34" y="22" width="78" height="90" />
              </clipPath>
            </defs>

            {/* File group */}
            <path
              className={`sf-body ${!isGranted ? 'sf-body-loading' : ''}`}
              fill="#FAFAF5" stroke="#000" strokeWidth="3.5" strokeLinejoin="miter" strokeLinecap="square"
              d="M34,36 L34,108 L112,108 L112,36 L96,22 L34,22 Z"
            />
            <path fill="#F5F500" stroke="none" d="M96,22 L96,36 L112,36 Z" />
            <path
              className={`sf-fold ${!isGranted ? 'sf-fold-loading' : ''}`}
              fill="none" stroke="#000" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"
              d="M96,22 L96,36 L112,36"
            />
            <line className={`sf-ln sf-ln1 ${isGranted ? 'sf-ln-granted' : ''}`} x1="46" y1="58" x2="100" y2="58" stroke="#000" strokeWidth="2.5" strokeLinecap="square" />
            <line className={`sf-ln sf-ln2 ${isGranted ? 'sf-ln-granted' : ''}`} x1="46" y1="71" x2="94" y2="71"  stroke="#000" strokeWidth="2.5" strokeLinecap="square" />
            <line className={`sf-ln sf-ln3 ${isGranted ? 'sf-ln-granted' : ''}`} x1="46" y1="84" x2="80" y2="84"  stroke="#000" strokeWidth="2.5" strokeLinecap="square" />

            {/* Scan beam — only during loading */}
            {!isGranted && (
              <g clipPath="url(#sf-clip)">
                <line className="sf-beam" x1="26" y1="65" x2="126" y2="65"
                  stroke="#FF2D78" strokeWidth="3" strokeLinecap="square" opacity="0.85" />
              </g>
            )}

            {/* Scan brackets — only during loading */}
            {!isGranted && (<>
              <path className="sf-brk"       fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M26 38 L26 24 L42 24" />
              <path className="sf-brk sf-brk2" fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M120 24 L136 24 L136 38" />
              <path className="sf-brk sf-brk3" fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M26 94 L26 110 L42 110" />
              <path className="sf-brk sf-brk4" fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M120 110 L136 110 L136 94" />
            </>)}

            {/* Scan dots — only during loading */}
            {!isGranted && (
              <g className="sf-dots">
                <rect className="sf-dot"  x="65" y="120" width="6" height="6" fill="#000" />
                <rect className="sf-dot2" x="77" y="120" width="6" height="6" fill="#000" />
                <rect className="sf-dot3" x="89" y="120" width="6" height="6" fill="#000" />
              </g>
            )}

            {/* Check ring */}
            <circle
              className={isGranted ? 'sf-ring-granted' : 'sf-ring'}
              cx="80" cy="65" r="30"
              fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="square"
            />

            {/* Checkmark */}
            <path
              className={isGranted ? 'sf-check-granted' : 'sf-check'}
              d="M65 65 L75 77 L98 52"
              fill="none" stroke="#FF2D78" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter"
            />

            {/* Pulse rings — triggered on granted */}
            <circle className={isGranted ? 'sf-pulse-granted' : 'sf-pulse'}   cx="80" cy="65" r="40" fill="none" stroke="#000" strokeWidth="3" />
            <circle className={isGranted ? 'sf-pulse2-granted' : 'sf-pulse2'} cx="80" cy="65" r="40" fill="none" stroke="#F5F500" strokeWidth="3" />

            {/* Verified badge — appears on granted */}
            <g className={isGranted ? 'sf-badge-granted' : 'sf-badge'}>
              <rect x="100" y="16" width="28" height="20" fill="#F5F500" stroke="#000" strokeWidth="3" />
              <path d="M106 26 L111 31 L120 20" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
            </g>
          </svg>

          {/* Status text */}
          <div style={{ width: '100%', height: '18px', position: 'relative', overflow: 'hidden' }}>
            {isGranted ? (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Space Mono', monospace",
                fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                color: '#FF2D78',
                animation: 'sf-statusGranted 0.4s ease-out forwards',
              }}>
                ✓ ACCESS GRANTED
              </div>
            ) : (
              [
                { label: 'FILE DETECTED',  delay: '0s'   },
                { label: 'SCANNING....',   delay: '0.5s' },
                { label: 'VERIFYING....',  delay: '1.4s' },
              ].map(({ label, delay }) => (
                <div
                  key={label}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px', fontWeight: 700, letterSpacing: '2px',
                    color: '#000',
                    opacity: 0,
                    animation: `sf-statusCycle 2.8s ease-in-out ${delay} infinite`,
                  }}
                >
                  {label === 'SCANNING....' ? (
                    <><span style={{ color: '#FF2D78', marginRight: 4 }}>▶</span>{label}</>
                  ) : label}
                </div>
              ))
            )}
          </div>

          {/* Progress bar */}
          <div style={{
            width: '100%', height: '8px',
            border: '3px solid #000',
            background: '#fff', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: isGranted ? '#FF2D78' : '#F5F500',
              transition: isGranted ? 'width 0.4s ease-out' : undefined,
              animation: isGranted ? undefined : 'sf-progress-loop 2.8s cubic-bezier(.4,0,.6,1) infinite',
              width: isGranted ? '100%' : undefined,
            }} />
          </div>

        </div>
      </div>
    </>
  );
}
