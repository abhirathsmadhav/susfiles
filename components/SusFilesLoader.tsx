'use client';

interface SusFilesLoaderProps {
  stage: 'loading' | 'granted' | 'denied';
}

export default function SusFilesLoader({ stage }: SusFilesLoaderProps) {
  const isGranted = stage === 'granted';

  return (
    <>
      <style>{`
        /* ─── PROGRESS BAR ─────────────────── */
        @keyframes sf-progress-loop {
          0%   { width: 0%; }
          100% { width: 90%; }
        }

        /* ─── STATUS LABELS ────────────────── */
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

        /* ─── FILE ─────────────────────────── */
        .sf-body-loading {
          stroke-dasharray: 310;
          stroke-dashoffset: 310;
          animation: sf-drawBody 2.8s ease-out infinite;
        }
        .sf-body-done {
          stroke-dasharray: 310;
          stroke-dashoffset: 0;
        }
        @keyframes sf-drawBody {
          0%, 2%  { stroke-dashoffset: 310; }
          22%,100%{ stroke-dashoffset: 0; }
        }
        .sf-fold-loading {
          stroke-dasharray: 42;
          stroke-dashoffset: 42;
          animation: sf-drawFold 2.8s ease-out infinite;
        }
        .sf-fold-done { stroke-dasharray: 42; stroke-dashoffset: 0; }
        @keyframes sf-drawFold {
          0%, 8%  { stroke-dashoffset: 42; }
          22%,100%{ stroke-dashoffset: 0; }
        }
        .sf-ln { opacity: 0; animation: sf-lineIn 2.8s ease-out infinite; }
        .sf-ln-done { opacity: 1; animation: none; }
        .sf-ln1 { animation-delay: 0.18s; }
        .sf-ln2 { animation-delay: 0.26s; }
        .sf-ln3 { animation-delay: 0.34s; }
        @keyframes sf-lineIn {
          0%, 6%  { opacity: 0; }
          20%,100%{ opacity: 1; }
        }

        /* ─── BRACKETS / BEAM / DOTS ───────── */
        .sf-brk { opacity: 0; animation: sf-brkFlash 2.8s ease-in-out infinite; }
        .sf-brk2 { animation-delay: 0.06s; }
        .sf-brk3 { animation-delay: 0.12s; }
        .sf-brk4 { animation-delay: 0.18s; }
        @keyframes sf-brkFlash {
          0%,17%,50%,100% { opacity: 0; }
          21%, 46%        { opacity: 1; }
        }
        .sf-beam { opacity: 0; animation: sf-beamSweep 2.8s ease-in-out infinite; }
        @keyframes sf-beamSweep {
          0%, 17% { opacity: 0; transform: translateY(-28px); }
          21%     { opacity: 1; transform: translateY(-28px); }
          44%     { opacity: 1; transform: translateY(28px); }
          49%,100%{ opacity: 0; transform: translateY(28px); }
        }
        .sf-dots { animation: sf-dotsShow 2.8s ease-in-out infinite; }
        @keyframes sf-dotsShow {
          0%,17%,49%,100% { opacity: 0; }
          21%, 45%        { opacity: 1; }
        }
        .sf-dot  { animation: sf-blink 0.35s step-end infinite; }
        .sf-dot2 { animation: sf-blink 0.35s step-end 0.12s infinite; }
        .sf-dot3 { animation: sf-blink 0.35s step-end 0.24s infinite; }
        @keyframes sf-blink { 50% { opacity: 0; } }

        /* ─── RING + CHECK ─────────────────── */
        .sf-ring-loading {
          stroke-dasharray: 188; stroke-dashoffset: 188; opacity: 0;
          animation: sf-drawRing 2.8s ease-in-out infinite;
        }
        .sf-ring-done { stroke-dasharray: 188; stroke-dashoffset: 0; opacity: 1; animation: none; }
        @keyframes sf-drawRing {
          0%, 47%  { stroke-dashoffset: 188; opacity: 0; }
          51%      { opacity: 1; }
          75%,100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .sf-check-loading {
          stroke-dasharray: 54; stroke-dashoffset: 54; opacity: 0;
          animation: sf-drawCheck 2.8s ease-in-out infinite;
        }
        .sf-check-done { stroke-dasharray: 54; stroke-dashoffset: 0; opacity: 1; animation: none; }
        @keyframes sf-drawCheck {
          0%, 50%  { stroke-dashoffset: 54; opacity: 0; }
          54%      { opacity: 1; }
          75%,100% { stroke-dashoffset: 0; opacity: 1; }
        }

        /* ─── PULSE ────────────────────────── */
        .sf-pulse  { opacity: 0; transform-origin: 80px 65px; }
        .sf-pulse2 { opacity: 0; transform-origin: 80px 65px; }
        .sf-pulse-granted  { animation: sf-pulseOnce 0.8s ease-out forwards; transform-origin: 80px 65px; }
        .sf-pulse2-granted { animation: sf-pulseOnce 0.8s ease-out 0.28s forwards; transform-origin: 80px 65px; }
        @keyframes sf-pulseOnce {
          0%  { opacity: 1; transform: scale(1); }
          100%{ opacity: 0; transform: scale(2); }
        }

        /* ─── BADGE ────────────────────────── */
        .sf-badge { opacity: 0; transform: scale(0) rotate(-12deg); transform-origin: 114px 26px; }
        .sf-badge-granted {
          animation: sf-badgePop 0.5s cubic-bezier(.22,1,.36,1) forwards;
          transform-origin: 114px 26px;
        }
        @keyframes sf-badgePop {
          0%   { opacity: 0; transform: scale(0) rotate(-12deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        /* ─── RESPONSIVE CARD ──────────────── */
        .sf-card-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(280px, 88vw);
        }
        .sf-header {
          background: #F5F500;
          border: 4px solid #000;
          border-bottom: 4px solid #000;
          padding: 8px 24px;
          font-family: 'Archivo Black', sans-serif;
          font-size: clamp(11px, 3.5vw, 13px);
          letter-spacing: 0.08em;
          color: #000;
          width: 100%;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 4px 0px 0px #000, -4px 0px 0px #000;
        }
        .sf-card {
          background: #FAFAF5;
          border: 4px solid #000;
          box-shadow: 6px 6px 0px #000;
          width: 100%;
          padding: clamp(18px, 5vw, 28px) clamp(16px, 5vw, 24px) clamp(16px, 4vw, 22px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(14px, 4vw, 18px);
        }
        .sf-status {
          width: 100%;
          height: 18px;
          position: relative;
          overflow: hidden;
        }
        .sf-status-label {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: clamp(8px, 2.5vw, 10px);
          font-weight: 700;
          letter-spacing: 2px;
        }
        .sf-progbar-wrap {
          width: 100%;
          height: 8px;
          border: 3px solid #000;
          background: #fff;
          overflow: hidden;
        }
        .sf-progbar-fill-loop {
          height: 100%;
          background: #F5F500;
          animation: sf-progress-loop 2.8s cubic-bezier(.4,0,.6,1) infinite;
        }
        .sf-progbar-fill-done {
          height: 100%;
          background: #FF2D78;
          width: 100%;
          transition: width 0.4s ease-out;
        }
      `}</style>

      <div className="sf-card-wrap">

        {/* Header bar */}
        <div className="sf-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="square">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          SUS FILES
        </div>

        {/* Main card */}
        <div className="sf-card">

          {/* SVG — scales with card width via viewBox */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 160 130"
            style={{ width: '100%', maxWidth: '160px', height: 'auto' }}
            aria-hidden="true"
          >
            <defs>
              <clipPath id="sf-clip">
                <rect x="34" y="22" width="78" height="90" />
              </clipPath>
            </defs>

            {/* File body */}
            <path
              className={isGranted ? 'sf-body-done' : 'sf-body-loading'}
              fill="#FAFAF5" stroke="#000" strokeWidth="3.5" strokeLinejoin="miter" strokeLinecap="square"
              d="M34,36 L34,108 L112,108 L112,36 L96,22 L34,22 Z"
            />
            <path fill="#F5F500" stroke="none" d="M96,22 L96,36 L112,36 Z" />
            <path
              className={isGranted ? 'sf-fold-done' : 'sf-fold-loading'}
              fill="none" stroke="#000" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter"
              d="M96,22 L96,36 L112,36"
            />
            <line className={`sf-ln sf-ln1 ${isGranted ? 'sf-ln-done' : ''}`} x1="46" y1="58" x2="100" y2="58" stroke="#000" strokeWidth="2.5" strokeLinecap="square" />
            <line className={`sf-ln sf-ln2 ${isGranted ? 'sf-ln-done' : ''}`} x1="46" y1="71" x2="94" y2="71"  stroke="#000" strokeWidth="2.5" strokeLinecap="square" />
            <line className={`sf-ln sf-ln3 ${isGranted ? 'sf-ln-done' : ''}`} x1="46" y1="84" x2="80" y2="84"  stroke="#000" strokeWidth="2.5" strokeLinecap="square" />

            {/* Scan beam */}
            {!isGranted && (
              <g clipPath="url(#sf-clip)">
                <line className="sf-beam" x1="26" y1="65" x2="126" y2="65" stroke="#FF2D78" strokeWidth="3" strokeLinecap="square" opacity="0.85" />
              </g>
            )}

            {/* Brackets */}
            {!isGranted && (<>
              <path className="sf-brk"       fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M26 38 L26 24 L42 24" />
              <path className="sf-brk sf-brk2" fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M120 24 L136 24 L136 38" />
              <path className="sf-brk sf-brk3" fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M26 94 L26 110 L42 110" />
              <path className="sf-brk sf-brk4" fill="none" stroke="#F5F500" strokeWidth="3.5" strokeLinecap="square" d="M120 110 L136 110 L136 94" />
            </>)}

            {/* Scan dots */}
            {!isGranted && (
              <g className="sf-dots">
                <rect className="sf-dot"  x="65" y="120" width="6" height="6" fill="#000" />
                <rect className="sf-dot2" x="77" y="120" width="6" height="6" fill="#000" />
                <rect className="sf-dot3" x="89" y="120" width="6" height="6" fill="#000" />
              </g>
            )}

            {/* Ring */}
            <circle className={isGranted ? 'sf-ring-done' : 'sf-ring-loading'}
              cx="80" cy="65" r="30" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="square" />

            {/* Check */}
            <path className={isGranted ? 'sf-check-done' : 'sf-check-loading'}
              d="M65 65 L75 77 L98 52"
              fill="none" stroke="#FF2D78" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" />

            {/* Pulse */}
            <circle className={isGranted ? 'sf-pulse-granted' : 'sf-pulse'}   cx="80" cy="65" r="40" fill="none" stroke="#000" strokeWidth="3" />
            <circle className={isGranted ? 'sf-pulse2-granted' : 'sf-pulse2'} cx="80" cy="65" r="40" fill="none" stroke="#F5F500" strokeWidth="3" />

            {/* Badge */}
            <g className={isGranted ? 'sf-badge-granted' : 'sf-badge'}>
              <rect x="100" y="16" width="28" height="20" fill="#F5F500" stroke="#000" strokeWidth="3" />
              <path d="M106 26 L111 31 L120 20" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
            </g>
          </svg>

          {/* Status text */}
          <div className="sf-status">
            {isGranted ? (
              <div className="sf-status-label" style={{ color: '#FF2D78', animation: 'sf-statusGranted 0.4s ease-out forwards' }}>
                ✓ ACCESS GRANTED
              </div>
            ) : (
              [
                { label: 'FILE DETECTED', delay: '0s'   },
                { label: 'SCANNING....', delay: '0.5s' },
                { label: 'VERIFYING....', delay: '1.4s' },
              ].map(({ label, delay }) => (
                <div
                  key={label}
                  className="sf-status-label"
                  style={{
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
          <div className="sf-progbar-wrap">
            {isGranted
              ? <div className="sf-progbar-fill-done" />
              : <div className="sf-progbar-fill-loop" />
            }
          </div>

        </div>
      </div>
    </>
  );
}
