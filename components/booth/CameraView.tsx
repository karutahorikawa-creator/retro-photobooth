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

      console.log('[capture]', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
        paused: video.paused,
        ended: video.ended,
        srcObject: !!video.srcObject,
      });

      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        console.error('[capture] video not ready — skipping frame');
        return '';
      }

      // Cap dimensions before pixel processing (avoids heavy loops on 4K camera feeds)
      const [tw, th] = getCaptureDimensions(video.videoWidth, video.videoHeight);

      const canvas = document.createElement('canvas');
      canvas.width = tw;
      canvas.height = th;

      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Step 1: draw the frame mirrored (selfie orientation) at target size.
      // We do NOT use ctx.filter here — Safari does not reliably apply
      // ctx.filter to drawImage(video) even in versions that expose the property.
      ctx.save();
      ctx.translate(tw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, tw, th);
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
      console.log('[capture] filter:', filter, '| size:', tw, '×', th, '| dataUrl prefix:', dataUrl.slice(0, 60));
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
