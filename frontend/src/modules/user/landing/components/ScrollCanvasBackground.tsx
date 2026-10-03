import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 266;

export const ScrollCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const images: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
    const loadedFlags: boolean[] = new Array(TOTAL_FRAMES).fill(false);
    let loadedCount = 0;

    let currentFrame = 0;
    let targetFrame = 0;
    let activeImage: HTMLImageElement | null = null;
    let animFrameId: number;

    const getFramePath = (index: number) => {
      const paddedIndex = String(index).padStart(6, '0');
      return `/frames/frame_${paddedIndex}.png`;
    };

    const resizeCanvas = () => {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      if (activeImage) {
        renderFrame(activeImage);
      }
    };

    const renderFrame = (img: HTMLImageElement) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      activeImage = img;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      const imgAspect = imgWidth / imgHeight;
      const canvasAspect = canvasWidth / canvasHeight;

      let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

      if (canvasAspect > imgAspect) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgAspect;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        drawWidth = canvasHeight * imgAspect;
        drawHeight = canvasHeight;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    const findNearestLoadedFrame = (targetIndex: number) => {
      if (loadedFlags[targetIndex] && images[targetIndex]) {
        return images[targetIndex];
      }

      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const prev = targetIndex - offset;
        const next = targetIndex + offset;

        if (prev >= 0 && loadedFlags[prev] && images[prev]) return images[prev];
        if (next < TOTAL_FRAMES && loadedFlags[next] && images[next]) return images[next];
      }
      return null;
    };

    const updateScrollTarget = () => {
      const scrollTop = Math.max(
        0,
        window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
      );
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const maxScroll = Math.max(1, docHeight - window.innerHeight);
      const scrollFraction = Math.min(1, Math.max(0, scrollTop / maxScroll));
      targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
    };

    const animate = () => {
      currentFrame += (targetFrame - currentFrame) * 0.15;
      let frameIndex = Math.round(currentFrame);
      frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));

      const imgToDraw = findNearestLoadedFrame(frameIndex);
      if (imgToDraw) {
        renderFrame(imgToDraw);
      }

      animFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('wheel', updateScrollTarget, { passive: true });
    window.addEventListener('touchmove', updateScrollTarget, { passive: true });

    resizeCanvas();
    updateScrollTarget();

    // Load frame 1 immediately
    const img1 = new Image();
    img1.src = getFramePath(1);
    img1.onload = () => {
      images[0] = img1;
      loadedFlags[0] = true;
      loadedCount++;
      renderFrame(img1);
      preloadAllFrames();
    };
    img1.onerror = () => {
      preloadAllFrames();
    };

    animFrameId = requestAnimationFrame(animate);

    function preloadAllFrames() {
      const batchSize = 20;
      let currentIndex = 1;

      function loadNextBatch() {
        if (currentIndex > TOTAL_FRAMES) return;

        const end = Math.min(TOTAL_FRAMES, currentIndex + batchSize - 1);
        for (let i = currentIndex; i <= end; i++) {
          const arrayIdx = i - 1;
          if (images[arrayIdx]) continue;

          const img = new Image();
          img.src = getFramePath(i);

          const onComplete = () => {
            images[arrayIdx] = img;
            loadedFlags[arrayIdx] = true;
            loadedCount++;

            const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
            setLoadingProgress(percent);

            if (loadedCount >= TOTAL_FRAMES) {
              setIsLoaded(true);
            }
          };

          img.onload = onComplete;
          img.onerror = onComplete;
        }

        currentIndex = end + 1;
        setTimeout(loadNextBatch, 5);
      }

      loadNextBatch();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateScrollTarget);
      window.removeEventListener('wheel', updateScrollTarget);
      window.removeEventListener('touchmove', updateScrollTarget);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 block object-cover"
      />
      {!isLoaded && (
        <div
          className="fixed top-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 z-50 transition-all duration-150 pointer-events-none"
          style={{ width: `${loadingProgress}%` }}
        />
      )}
    </>
  );
};
