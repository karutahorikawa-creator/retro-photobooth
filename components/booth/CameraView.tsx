'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { getFilterCSS } from '@/lib/filters';
import { getCaptureDimensions, applyPixelFilter } from '@/lib/image-filters';
import type { FilterName } from '@/types';

export interface CameraHandle {
  capturePhoto(): string; // returns dataURL
  stopCamera(): void;
}

interface Props {
  filter: FilterName;
  onReady?(): void;
  onError(msg: string): void;
}

const CameraView = forwardRef<CameraHandle, Props>(({ filter, onReady, onError }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Keep callback refs stable so the camera useEffect never re-runs due to prop identity changes.
  // If onError was a dep, every booth re-render would stop the camera and restart getUserMedia.
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onErrorRef.current = onError;
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play().catch(() => {});
            onReadyRef.current?.();
          };
        }
      } catch (err) {
        if (cancelled) return;
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          onErrorRef.current('Camera permission was denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError') {
          onErrorRef.current('No camera found on this device.');
        } else {
          onErrorRef.current('Could not access the camera. Please check your device and try again.');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    };
  }, []); // empty deps — camera starts once and lives until unmount

  useImperativeHandle(ref, () => ({
    capturePhoto() {
      const video = videoRef.current;
      if (!video) {
        console.error('[capture] no video element');
        return '';
      }

      const videoW = video.videoWidth;
      const videoH = video.videoHeight;

      console.log('[capture]', {
        videoWidth: videoW,
        videoHeight: videoH,
        sourceRatio: videoW && videoH ? (videoW / videoH).toFixed(3) : 'n/a',
        readyState: video.readyState,
        paused: video.paused,
        ended: video.ended,
        srcObject: !!video.srcObject,
      });

      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        videoW === 0 ||
        videoH === 0
      ) {
        console.error('[capture] video not ready — skipping frame');
        return '';
      }

      // Center-crop the camera frame to the strip slot ratio (4:3 landscape)
      // before scaling. This replicates the object-fit:cover crop that the live
      // preview shows, and guarantees the captured image is always 4:3 so the
      // strip compositor never stretches it into a different aspect ratio.
      const TARGET_RATIO = 4 / 3;
      const sourceRatio = videoW / videoH;

      let sx = 0, sy = 0, sw = videoW, sh = videoH;
      if (sourceRatio > TARGET_RATIO) {
        // Camera is wider than 4:3 (e.g. 16:9): crop left and right equally
        sw = Math.round(videoH * TARGET_RATIO);
        sx = Math.round((videoW - sw) / 2);
      } else if (sourceRatio < TARGET_RATIO) {
        // Camera is taller than 4:3 (e.g. iPad portrait 3:4): crop top and bottom equally
        sh = Math.round(videoW / TARGET_RATIO);
        sy = Math.round((videoH - sh) / 2);
      }

      // Cap canvas dimensions for pixel-processing performance (900 px wide max).
      // getCaptureDimensions now receives the 4:3-cropped size so returns 4:3 canvas dims.
      const [tw, th] = getCaptureDimensions(sw, sh);

      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;

      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Step 1: draw the frame mirrored (selfie orientation) at target size,
      // using the 9-arg drawImage to apply the center crop in one pass.
      // We do NOT use ctx.filter here — Safari does not reliably apply
      // ctx.filter to drawImage(video) even in versions that expose the property.
      ctx.save();
      ctx.translate(tw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, tw, th);
      ctx.restore();

      // Step 2: bake the selected filter via pixel manipulation.
      // getImageData / putImageData bypass ctx transforms and work identically
      // in Safari, Chrome, Firefox, and mobile WebKit.
      if (filter !== 'original') {
        const imageData = ctx.getImageData(0, 0, tw, th);
        applyPixelFilter(imageData, filter);
        ctx.putImageData(imageData, 0, 0);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      console.log('[capture] filter:', filter, '| canvas:', tw, '×', th, '| crop src:', sx, sy, sw, sh, '| dataUrl prefix:', dataUrl.slice(0, 60));
      return dataUrl;
    },

    stopCamera() {
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    },
  }), [filter]); // re-bind when filter changes so capturePhoto uses the latest

  const filterCSS = getFilterCSS(filter);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{
          transform: 'scaleX(-1)',
          filter: filterCSS || undefined,
        }}
      />
    </div>
  );
});

CameraView.displayName = 'CameraView';
export default CameraView;
