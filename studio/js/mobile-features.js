cat > /mnt/user-data/outputs/mobile-features.txt << 'ENDOFFILE'
/**
 * Mobile Features Module
 * Camera integration, touch gestures, and mobile optimizations
 */

class MobileFeatures {
  constructor() {
    this.isMobile = this.detectMobile();
    this.hasCamera = false;
    this.stream = null;
    this.gestureHandlers = new Map();
    this.init();
  }

  init() {
    this.checkCameraAvailability();
    this.setupTouchGestures();
    console.log('Mobile Features initialized', { isMobile: this.isMobile, hasCamera: this.hasCamera });
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (window.innerWidth <= 768);
  }

  async checkCameraAvailability() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.hasCamera = true;
      }
    } catch (e) {
      this.hasCamera = false;
    }
  }

  async takePhoto(options = {}) {
    const {
      width = 1920,
      height = 1080,
      facingMode = 'environment'
    } = options;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: width },
          height: { ideal: height }
        }
      });

      return new Promise((resolve, reject) => {
        this.showCameraPreview(this.stream, (imageDataURL) => {
          this.stopCamera();
          resolve(imageDataURL);
        }, () => {
          this.stopCamera();
          reject(new Error('Camera capture cancelled'));
        });
      });

    } catch (e) {
      console.error('Camera error:', e);
      throw new Error(`Camera access denied: ${e.message}`);
    }
  }

  showCameraPreview(stream, onCapture, onCancel) {
    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.innerHTML = `
      <div class="camera-preview-container">
        <video id="cameraPreview" autoplay playsinline></video>
        <canvas id="cameraCanvas" style="display:none;"></canvas>
        <div class="camera-controls">
          <button class="btn camera-cancel" id="cameraCancel">
            ✕ Cancel
          </button>
          <button class="btn camera-capture" id="cameraCapture">
            📷 Capture
          </button>
          <button class="btn camera-switch" id="cameraSwitch">
            🔄 Flip
          </button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .camera-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.95);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .camera-preview-container {
        position: relative;
        width: 100%;
        max-width: 100vw;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      #cameraPreview {
        max-width: 100%;
        max-height: calc(100vh - 100px);
        object-fit: contain;
      }
      .camera-controls {
        position: absolute;
        bottom: 20px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 0 1rem;
      }
      .camera-capture {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        font-size: 2rem;
        background: #fff;
        color: #333;
      }
      .camera-cancel, .camera-switch {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        font-size: 1.5rem;
        background: rgba(255,255,255,0.2);
        color: #fff;
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);

    const video = document.getElementById('cameraPreview');
    video.srcObject = stream;

    let currentFacingMode = 'environment';

    document.getElementById('cameraCapture').addEventListener('click', () => {
      const canvas = document.getElementById('cameraCanvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageDataURL = canvas.toDataURL('image/png');
      
      document.body.removeChild(modal);
      document.head.removeChild(style);
      onCapture(imageDataURL);
    });

    document.getElementById('cameraCancel').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
      onCancel();
    });

    document.getElementById('cameraSwitch').addEventListener('click', async () => {
      this.stopCamera();
      currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: currentFacingMode }
        });
        video.srcObject = this.stream;
      } catch (e) {
        console.error('Failed to switch camera:', e);
      }
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  setupTouchGestures() {
    this.setupPinchZoom();
    this.setupSwipeGestures();
  }

  setupPinchZoom() {
    let initialDistance = 0;
    let currentScale = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDistance = this.getTouchDistance(e.touches);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getTouchDistance(e.touches);
        const scale = currentDistance / initialDistance;
        currentScale = Math.max(0.5, Math.min(3, scale));
        
        const target = e.target;
        this.triggerGestureEvent(target, 'pinchzoom', { scale: currentScale });
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
  }

  getTouchDistance(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  setupSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const minSwipeDistance = 50;

    const handleTouchStart = (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipe(e.target, touchStartX, touchStartY, touchEndX, touchEndY, minSwipeDistance);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  handleSwipe(target, startX, startY, endX, endY, minDistance) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    if (Math.abs(deltaX) > minDistance || Math.abs(deltaY) > minDistance) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          this.triggerGestureEvent(target, 'swiperight', { distance: deltaX });
        } else {
          this.triggerGestureEvent(target, 'swipeleft', { distance: Math.abs(deltaX) });
        }
      } else {
        if (deltaY > 0) {
          this.triggerGestureEvent(target, 'swipedown', { distance: deltaY });
        } else {
          this.triggerGestureEvent(target, 'swipeup', { distance: Math.abs(deltaY) });
        }
      }
    }
  }

  triggerGestureEvent(target, gestureType, detail) {
    const event = new CustomEvent(`mobile${gestureType}`, {
      bubbles: true,
      detail: detail
    });
    target.dispatchEvent(event);

    if (this.gestureHandlers.has(gestureType)) {
      const handlers = this.gestureHandlers.get(gestureType);
      handlers.forEach(handler => handler(detail, target));
    }
  }

  onGesture(gestureType, handler) {
    if (!this.gestureHandlers.has(gestureType)) {
      this.gestureHandlers.set(gestureType, []);
    }
    this.gestureHandlers.get(gestureType).push(handler);
  }

  offGesture(gestureType, handler) {
    if (this.gestureHandlers.has(gestureType)) {
      const handlers = this.gestureHandlers.get(gestureType);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  enableImageZoom(imageElement) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    this.onGesture('pinchzoom', (detail) => {
      scale = detail.scale;
      imageElement.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
    });

    imageElement.addEventListener('dblclick', () => {
      scale = 1;
      translateX = 0;
      translateY = 0;
      imageElement.style.transform = 'scale(1) translate(0, 0)';
    });
  }

  hapticFeedback(duration = 10) {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  isPortrait() {
    return window.innerHeight > window.innerWidth;
  }

  isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  onOrientationChange(callback) {
    window.addEventListener('orientationchange', callback);
    window.addEventListener('resize', callback);
  }

  getDeviceInfo() {
    return {
      isMobile: this.isMobile,
      hasCamera: this.hasCamera,
      isPortrait: this.isPortrait(),
      isLandscape: this.isLandscape(),
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      userAgent: navigator.userAgent,
      hasTouch: 'ontouchstart' in window,
      hasVibration: 'vibrate' in navigator
    };
  }
}

const mobileFeatures = new MobileFeatures();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileFeatures;
}
ENDOFFILE
echo "File created: mobile-features.txt"