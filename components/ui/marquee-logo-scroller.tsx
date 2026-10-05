import React from 'react';
import { cn } from '@/lib/utils';

// Define the type for individual logo props
export interface Logo {
  src?: string;
  alt?: string;
  name?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  gradient: {
    from: string;
    via: string;
    to: string;
  };
}

// Define the props for the main component
export interface MarqueeLogoScrollerProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  logos: Logo[];
  speed?: 'normal' | 'slow' | 'fast';
  direction?: 'left' | 'right';
  badge?: string;
}

/**
 * A responsive, self-contained, and infinitely scrolling marquee component.
 * It pauses on hover and uses shadcn/ui theme variables for styling.
 * This component includes its own CSS animation and does not require tailwind.config.js modifications.
 */
export const MarqueeLogoScroller = React.forwardRef<HTMLDivElement, MarqueeLogoScrollerProps>(
  (
    {
      title,
      description,
      logos,
      speed = 'normal',
      direction = 'left',
      badge = 'Official Partners',
      className,
      ...props
    },
    ref
  ) => {
    // Map speed prop to animation duration
    const durationMap = {
      normal: '40s',
      slow: '80s',
      fast: '15s',
    };
    const animationDuration = durationMap[speed] || '40s';
    const animationName = direction === 'right' ? 'marqueeRight' : 'marqueeLeft';

    return (
      <>
        {/* The @keyframes for the marquee animation are defined directly here for robustness. */}
        <style>{`
          @keyframes marqueeLeft {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          @keyframes marqueeRight {
            from { transform: translateX(-50%); }
            to { transform: translateX(0); }
          }
        `}</style>

        <section
          ref={ref}
          aria-label={title}
          className={cn(
            'w-full bg-background text-foreground rounded-2xl border overflow-hidden shadow-xl',
            className
          )}
          {...props}
        >
          {/* Header Section */}
          <div className="p-6 md:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-8 pb-6 md:pb-8 border-b items-end">
              <div>
                {badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                    {badge}
                  </div>
                )}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tighter text-balance">
                  {title}
                </h2>
              </div>
              <p className="text-muted-foreground self-start lg:justify-self-end text-balance text-sm sm:text-base leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Marquee Section */}
          <div
            className="w-full overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage:
                'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div
              className="flex w-max items-center gap-4 py-5 pr-4 hover:[animation-play-state:paused] transition-all duration-300 ease-in-out"
              style={{
                animation: `${animationName} ${animationDuration} linear infinite`,
              }}
            >
              {/* Render logos twice to create a seamless loop */}
              {[...logos, ...logos].map((logo, index) => (
                <div
                  key={index}
                  className="group relative h-24 w-44 shrink-0 flex items-center justify-center rounded-xl bg-secondary/70 border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.03]"
                  style={
                    {
                      '--from': logo.gradient.from,
                      '--via': logo.gradient.via,
                      '--to': logo.gradient.to,
                    } as React.CSSProperties
                  }
                >
                  {/* Gradient background revealed on hover */}
                  <div className="absolute inset-0 scale-150 opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-100 bg-gradient-to-br from-[var(--from)] via-[var(--via)] to-[var(--to)]" />

                  {/* Logo Display: Image or Custom Icon/Node */}
                  {logo.src ? (
                    <div className="relative z-10 flex items-center justify-center p-2 rounded-lg bg-white/95 group-hover:bg-white shadow-sm transition-all duration-300 group-hover:scale-105 w-[140px] h-14">
                      <img
                        src={logo.src}
                        alt={logo.alt || logo.name || 'Partner logo'}
                        className="max-h-full max-w-full object-contain filter group-hover:brightness-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white/95 group-hover:bg-white text-slate-900 shadow-sm transition-all duration-300 group-hover:scale-105 min-w-[130px] h-12">
                      {logo.icon}
                      <div className="text-left">
                        <span className="block font-black text-xs sm:text-sm tracking-tight leading-none text-slate-900">
                          {logo.name}
                        </span>
                        {logo.subtitle && (
                          <span className="block text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                            {logo.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }
);

MarqueeLogoScroller.displayName = 'MarqueeLogoScroller';
