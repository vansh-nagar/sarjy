'use client';

import { type ComponentProps, type CSSProperties, useMemo } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useAgentAudioVisualizerRadialAnimator } from '@/hooks/use-agent-audio-visualizer-radial';
import { type SarjyAgentState } from '@/hooks/use-agent-audio-visualizer-aura';

export const AgentAudioVisualizerRadialVariants = cva(
  [
    'relative flex items-center justify-center',
    '**:data-lk-index:bg-current/10',
    '**:data-lk-index:absolute **:data-lk-index:top-1/2 **:data-lk-index:left-1/2 **:data-lk-index:origin-bottom **:data-lk-index:-translate-x-1/2',
    '**:data-lk-index:rounded-full **:data-lk-index:transition-colors **:data-lk-index:duration-150 **:data-lk-index:ease-linear **:data-lk-index:data-[lk-highlighted=true]:bg-current',
    'has-data-[lk-state=connecting]:**:data-lk-index:duration-300',
    'has-data-[lk-state=initializing]:**:data-lk-index:duration-300',
    'has-data-[lk-state=listening]:**:data-lk-index:duration-300',
    'has-data-[lk-state=thinking]:animate-spin has-data-[lk-state=thinking]:[animation-duration:5s] has-data-[lk-state=thinking]:**:data-lk-index:bg-current',
  ],
  {
    variants: {
      size: {
        icon: ['h-[24px] gap-[2px]'],
        sm: ['h-[56px] gap-[4px]'],
        md: ['h-[112px] gap-[8px]'],
        lg: ['h-[224px] gap-[16px]'],
        xl: ['h-[448px] gap-[32px]'],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AgentAudioVisualizerRadialProps {
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  state?: SarjyAgentState;
  color?: `#${string}`;
  radius?: number;
  barCount?: number;
  /** Raw audio volume 0-1 */
  volume?: number;
  className?: string;
}

export function AgentAudioVisualizerRadial({
  size = 'md',
  state = 'connecting',
  color,
  radius,
  barCount,
  volume = 0,
  className,
  style,
  ...props
}: AgentAudioVisualizerRadialProps &
  ComponentProps<'div'> &
  VariantProps<typeof AgentAudioVisualizerRadialVariants>) {
  const _barCount = useMemo(() => {
    if (barCount) {
      return barCount;
    }
    switch (size) {
      case 'icon':
      case 'sm':
        return 12;
      default:
        return 24;
    }
  }, [barCount, size]);

  const sequencerInterval = useMemo(() => {
    switch (state) {
      case 'connecting':
      case 'listening':
        return 500;
      case 'thinking':
        return Infinity;
      default:
        return 1000;
    }
  }, [state, _barCount]);

  const distanceFromCenter = useMemo(() => {
    if (radius) {
      return radius;
    }
    switch (size) {
      case 'icon':
        return 6;
      case 'xl':
        return 128;
      case 'lg':
        return 64;
      case 'sm':
        return 16;
      case 'md':
      default:
        return 32;
    }
  }, [size, radius]);

  if (_barCount % 4 !== 0) {
    console.warn('barCount should be divisible by 4 for optimal visual results');
  }

  const highlightedIndices = useAgentAudioVisualizerRadialAnimator(
    state,
    _barCount,
    sequencerInterval,
  );

  // Simulate multiband volume for radial visualizer
  const bands = useMemo(() => {
    return Array.from({ length: _barCount }, (_, i) => {
      if (state !== "speaking") return 0;
      const jitter = Math.sin(i * 1.5) * 0.2 + 0.8;
      return Math.min(1, volume * jitter);
    });
  }, [volume, _barCount, state]);

  const dotSize = useMemo(() => {
    return (distanceFromCenter * Math.PI) / _barCount;
  }, [distanceFromCenter, _barCount]);

  return (
    <div
      data-lk-state={state}
      className={cn(AgentAudioVisualizerRadialVariants({ size }), 'relative', className)}
      style={{ ...style, color } as CSSProperties}
      {...props}
    >
      {bands.map((band, idx) => {
        const angle = (idx / _barCount) * Math.PI * 2;

        return (
          <div
            key={`${_barCount}-${idx}`}
            data-lk-state={state}
            className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2"
            style={{
              transformOrigin: 'center',
              transform: `rotate(${angle}rad) translateY(${distanceFromCenter}px)`,
            }}
          >
            <div
              data-lk-index={idx}
              data-lk-highlighted={highlightedIndices.includes(idx)}
              style={{
                width: dotSize,
                minHeight: dotSize,
                height:
                  state === "speaking"
                    ? `${dotSize * 10 * band}px`
                    : 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
