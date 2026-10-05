/**
 * Motion Spring CountUp - Vanilla JS Implementation
 * Spring physics:
 * damping = 20 + 40 * (1 / duration)
 * stiffness = 100 * (1 / duration)
 * 
 * Supports:
 * - IntersectionObserver viewport trigger (useInView equivalent)
 * - Spring physics with damping & stiffness
 * - Direction up/down
 * - Separator, prefix, suffix, and decimal precision auto-detection
 * - Callbacks: onStart, onEnd
 */

(function (global) {
  'use strict';

  function getDecimalPlaces(num) {
    if (typeof num !== 'number' || !isFinite(num)) return 0;
    const str = num.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals, 10) !== 0) {
        return decimals.length;
      }
    }
    return 0;
  }

  function formatNumber(val, maxDecimals, separator, prefix = '', suffix = '') {
    const hasDecimals = maxDecimals > 0;
    const options = {
      useGrouping: !!separator,
      minimumFractionDigits: hasDecimals ? maxDecimals : 0,
      maximumFractionDigits: hasDecimals ? maxDecimals : 0
    };

    let formatted = Intl.NumberFormat('en-US', options).format(val);
    if (separator) {
      formatted = formatted.replace(/,/g, separator);
    }
    return `${prefix}${formatted}${suffix}`;
  }

  function initCountUp(el, userOptions = {}) {
    if (!el) return null;

    // Parse attributes or options
    const rawTo = userOptions.to !== undefined 
      ? userOptions.to 
      : (el.dataset.to !== undefined ? parseFloat(el.dataset.to) : parseFloat(el.dataset.count || el.textContent.replace(/[^\d.-]/g, '') || 0));
    
    const rawFrom = userOptions.from !== undefined 
      ? userOptions.from 
      : (el.dataset.from !== undefined ? parseFloat(el.dataset.from) : 0);

    const direction = userOptions.direction || el.dataset.direction || 'up';
    const delay = userOptions.delay !== undefined 
      ? Number(userOptions.delay) 
      : (el.dataset.delay ? parseFloat(el.dataset.delay) : 0);

    const duration = userOptions.duration !== undefined 
      ? Number(userOptions.duration) 
      : (el.dataset.duration ? parseFloat(el.dataset.duration) : 2);

    const separator = userOptions.separator !== undefined 
      ? userOptions.separator 
      : (el.dataset.separator !== undefined ? el.dataset.separator : '');

    const prefix = userOptions.prefix !== undefined 
      ? userOptions.prefix 
      : (el.dataset.prefix || '');

    const suffix = userOptions.suffix !== undefined 
      ? userOptions.suffix 
      : (el.dataset.suffix || '');

    const startWhen = userOptions.startWhen !== undefined 
      ? userOptions.startWhen 
      : true;

    const once = userOptions.once !== undefined 
      ? userOptions.once 
      : true;

    const onStart = userOptions.onStart || null;
    const onEnd = userOptions.onEnd || null;

    const to = isNaN(rawTo) ? 0 : rawTo;
    const from = isNaN(rawFrom) ? 0 : rawFrom;

    const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

    // Spring constants matching Motion spring physics
    const safeDuration = Math.max(duration, 0.05);
    const damping = 20 + 40 * (1 / safeDuration);
    const stiffness = 100 * (1 / safeDuration);
    const mass = 1;

    const targetVal = direction === 'down' ? from : to;
    const initialVal = direction === 'down' ? to : from;

    let currentVal = initialVal;
    let velocity = 0;
    let rafId = null;
    let delayTimeout = null;
    let endTimeout = null;
    let isRunning = false;
    let hasTriggered = false;
    let startTime = 0;

    // Set initial text
    el.textContent = formatNumber(initialVal, maxDecimals, separator, prefix, suffix);

    function stepSpring(dt, elapsed) {
      const subSteps = 4;
      const subDt = Math.min(dt, 0.064) / subSteps;

      for (let i = 0; i < subSteps; i++) {
        const displacement = currentVal - targetVal;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * velocity;
        const acceleration = (springForce + dampingForce) / mass;

        velocity += acceleration * subDt;
        currentVal += velocity * subDt;
      }

      const diff = Math.abs(currentVal - targetVal);
      const threshold = maxDecimals > 0 ? 0.002 : 0.25;
      const isSettled = (diff < threshold && Math.abs(velocity) < 0.6) || (elapsed >= safeDuration && diff < 0.5);

      if (isSettled) {
        currentVal = targetVal;
        velocity = 0;
        el.textContent = formatNumber(currentVal, maxDecimals, separator, prefix, suffix);
        isRunning = false;
        if (typeof onEnd === 'function') {
          onEnd();
        }
        return false;
      }

      el.textContent = formatNumber(currentVal, maxDecimals, separator, prefix, suffix);
      return true;
    }

    let lastTime = 0;
    function loop(time) {
      if (!lastTime) {
        lastTime = time;
        startTime = time;
      }
      const dt = (time - lastTime) / 1000;
      const elapsed = (time - startTime) / 1000;
      lastTime = time;

      const continuing = stepSpring(dt, elapsed);
      if (continuing) {
        rafId = requestAnimationFrame(loop);
      }
    }

    function startAnimation() {
      if (isRunning) return;
      hasTriggered = true;
      isRunning = true;

      if (typeof onStart === 'function') {
        onStart();
      }

      delayTimeout = setTimeout(() => {
        lastTime = 0;
        startTime = 0;
        rafId = requestAnimationFrame(loop);
      }, delay * 1000);

      // Duration fallback safety
      endTimeout = setTimeout(() => {
        if (isRunning) {
          if (rafId) cancelAnimationFrame(rafId);
          currentVal = targetVal;
          el.textContent = formatNumber(currentVal, maxDecimals, separator, prefix, suffix);
          isRunning = false;
          if (typeof onEnd === 'function') onEnd();
        }
      }, (delay + safeDuration * 1.25) * 1000);
    }

    function reset() {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(delayTimeout);
      clearTimeout(endTimeout);
      isRunning = false;
      hasTriggered = false;
      currentVal = initialVal;
      velocity = 0;
      el.textContent = formatNumber(initialVal, maxDecimals, separator, prefix, suffix);
    }

    let observer = null;
    if (typeof IntersectionObserver !== 'undefined' && startWhen) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!hasTriggered) {
              startAnimation();
              if (once && observer) {
                observer.unobserve(el);
              }
            }
          } else if (!once && hasTriggered) {
            reset();
          }
        });
      }, { threshold: 0.15 });

      observer.observe(el);
    } else if (startWhen) {
      startAnimation();
    }

    return {
      start: startAnimation,
      reset,
      restart() {
        reset();
        startAnimation();
      },
      destroy() {
        if (rafId) cancelAnimationFrame(rafId);
        clearTimeout(delayTimeout);
        clearTimeout(endTimeout);
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      }
    };
  }

  function initAllCountUps(selector = '.count-up, [data-count], .stat-number') {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    elements.forEach(el => {
      if (!el._countUpInstance) {
        el._countUpInstance = initCountUp(el);
        instances.push(el._countUpInstance);
      }
    });
    return instances;
  }

  // Export to global scope
  global.initCountUp = initCountUp;
  global.initAllCountUps = initAllCountUps;

  // Auto initialize on DOM ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => initAllCountUps());
    } else {
      initAllCountUps();
    }
  }

})(typeof window !== 'undefined' ? window : this);
