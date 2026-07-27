'use client';

import { motion } from 'framer-motion';

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
}

interface SVGConnectorsProps {
  lines: Line[];
  width: number;
  height: number;
}

export default function SVGConnectors({ lines, width, height }: SVGConnectorsProps) {
  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <filter id="rough">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="2"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
        </filter>
      </defs>
      {lines.map((line, i) => {
        // Create a bezier curve path
        const midY = (line.y1 + line.y2) / 2;
        // Make the control points slightly random or bowed out for an organic "hanging wire" look
        const cp1x = line.x1;
        const cp1y = line.y1 + (line.y2 - line.y1) * 0.4;
        const cp2x = line.x2;
        const cp2y = line.y2 - (line.y2 - line.y1) * 0.4;
        
        // Base path
        const pathData1 = `M ${line.x1} ${line.y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${line.x2} ${line.y2}`;
        // Swayed path (control points shifted horizontally by 30px to simulate wind/physics)
        const pathData2 = `M ${line.x1} ${line.y1} C ${cp1x + 30} ${cp1y}, ${cp2x - 30} ${cp2y}, ${line.x2} ${line.y2}`;

        return (
          <g key={i}>
            {/* Shadow line */}
            <motion.path
              initial={{ d: pathData1 }}
              animate={{ d: [pathData1, pathData2, pathData1] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
              stroke="#000"
              strokeWidth="4"
              fill="none"
              opacity="0.2"
              transform="translate(4, 4)"
            />
            {/* Main line */}
            <motion.path
              initial={{ d: pathData1 }}
              animate={{ d: [pathData1, pathData2, pathData1] }}
              transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
              stroke={line.color ?? '#000'}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={line.dashed ? "12, 12" : undefined}
              filter="url(#rough)"
            />
            {/* Dot at target end */}
            <circle
              cx={line.x2}
              cy={line.y2}
              r="5"
              fill={line.color ?? '#000'}
              stroke="#000"
              strokeWidth="2"
            />
          </g>
        );
      })}
    </svg>
  );
}
