import { WebPlugin } from '@capacitor/core';
import type { PlayCallbackInfo } from 'dynamsoft-camera-enhancer';
import { CameraEnhancer } from 'dynamsoft-camera-enhancer';
import RecordRTC from 'recordrtc';

import type { CameraPreviewPlugin, ScanRegion } from './definitions';
import { EnumResolution } from './definitions';

type ImageCaptureConstructor = new (track: MediaStreamTrack) => {
  takePhoto(): Promise<Blob>;
};

CameraEnhancer.defaultUIElementURL = 'https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@3.3.9/dist/dce.ui.html';

export class CameraPreviewWeb extends WebPlugin implements CameraPreviewPlugin {
  private camera: CameraEnhancer | undefined;
  private container: HTMLElement | undefined;
  private region: ScanRegion | undefined;
  private recorder: RecordRTC | null | undefined;
  private hasMicrophone = false;
  async setDefaultUIElementURL(url: string): Promise<void> {
    CameraEnhancer.defaultUIElementURL = url;
  }

  async setElement(ele: HTMLElement): Promise<void> {
    this.container = ele;
  }

  saveFrame(): Promise<{ success: boolean }> {
    throw new Error('Method not implemented.');
  }

  async getOrientation(): Promise<{ orientation: 'PORTRAIT' | 'LANDSCAPE' }> {
    const portrait = window.matchMedia('(orientation: portrait)');
    if (portrait.matches) {
      return { orientation: 'PORTRAIT' };
    } else {
      return { orientation: 'LANDSCAPE' };
    }
  }

  async initialize(): Promise<void> {
    this.camera = await CameraEnhancer.createInstance();
    const camera = this.camera;
    this.camera.on('played', (playCallBackInfo: PlayCallbackInfo) => {
      this.notifyListeners('onPlayed', { resolution: playCallBackInfo.width + 'x' + playCallBackInfo.height });
      try {
        const canvas = camera
          .getUIElement()
          .getElementsByClassName('dce-video-container')[0]
          .getElementsByTagName('canvas')[0];
        if (canvas) {
          canvas.remove();
        }
      } catch (error) {
        console.log(error);
      }
    });
    if (this.container) {
      await this.camera.setUIElement(this.container);
    } else {
      await this.camera.setUIElement(CameraEnhancer.defaultUIElementURL);
      this.camera.getUIElement().getElementsByClassName('dce-btn-close')[0].remove();
      this.camera.getUIElement().getElementsByClassName('dce-sel-camera')[0].remove();
      this.camera.getUIElement().getElementsByClassName('dce-sel-resolution')[0].remove();
      this.camera.getUIElement().getElementsByClassName('dce-msg-poweredby')[0].remove();
    }
    this.camera.setVideoFit('cover');
    const portrait = window.matchMedia('(orientation: portrait)');
    portrait.addEventListener('change', () => {
      this.notifyListeners('onOrientationChanged', null);
    });
  }

  async getResolution(): Promise<{ resolution: string }> {
    if (this.camera) {
      const rsl = this.camera.getResolution();
      const resolution: string = rsl[0] + 'x' + rsl[1];
      return { resolution: resolution };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async setResolution(options: { resolution: number }): Promise<void> {
    if (this.camera) {
      const res = options.resolution;
      let width = 1280;
      let height = 720;
      if (res == EnumResolution.RESOLUTION_480P) {
        width = 640;
        height = 480;
      } else if (res == EnumResolution.RESOLUTION_720P) {
        width = 1280;
        height = 720;
      } else if (res == EnumResolution.RESOLUTION_1080P) {
        width = 1920;
        height = 1080;
      } else if (res == EnumResolution.RESOLUTION_2K) {
        width = 2560;
        height = 1440;
      } else if (res == EnumResolution.RESOLUTION_4K) {
        width = 3840;
        height = 2160;
      }
      await this.camera.setResolution(width, height);
      return;
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async getAllCameras(): Promise<{ cameras: string[] }> {
    if (this.camera) {
      const cameras = await this.camera.getAllCameras();
      const labels: string[] = [];
      cameras.forEach((camera) => {
        labels.push(camera.label);
      });
      return { cameras: labels };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async getSelectedCamera(): Promise<{ selectedCamera: string }> {
    if (this.camera) {
      const cameraInfo = this.camera.getSelectedCamera();
      return { selectedCamera: cameraInfo.label };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async selectCamera(options: { cameraID: string }): Promise<void> {
    if (this.camera) {
      const cameras = await this.camera.getAllCameras();
      for (const camera of cameras) {
        if (camera.label === options.cameraID) {
          await this.camera.selectCamera(camera);
          return;
        }
      }
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async setScanRegion(options: { region: ScanRegion }): Promise<void> {
    if (this.camera) {
      this.region = options.region;
      this.applyScanRegion();
    } else {
      throw new Error('Camera not initialized');
    }
  }

  applyScanRegion(): void {
    if (this.camera && this.region) {
      this.camera.setScanRegion({
        regionLeft: this.region.left,
        regionTop: this.region.top,
        regionRight: this.region.right,
        regionBottom: this.region.bottom,
        regionMeasuredByPercentage: this.region.measuredByPercentage,
      });
    }
  }

  async setZoom(options: { factor: number }): Promise<void> {
    if (this.camera) {
      await this.camera.setZoom(options.factor);
      return;
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async setFocus(options: { x: number; y: number }): Promise<void> {
    if (this.camera) {
      this.camera.setFocus({
        mode: 'manual',
        area: {
          centerPoint: { x: options.x.toString(), y: options.y.toString() },
        },
      });
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async toggleTorch(options: { on: boolean }): Promise<void> {
    if (this.camera) {
      try {
        if (options['on']) {
          await this.camera.turnOnTorch();
        } else {
          await this.camera.turnOffTorch();
        }
      } catch (e) {
        throw new Error('Torch unsupported');
      }
    }
  }

  async startCamera(): Promise<void> {
    if (this.camera) {
      await this.camera?.open(true);
      if (this.container && this.isSafari() === true) {
        const resetZoom = async () => {
          await this.camera?.setZoom(1.001);
          await this.camera?.setZoom(1.0);
        };
        setTimeout(resetZoom, 500);
      }
    } else {
      throw new Error('Camera not initialized');
    }
  }

  isSafari(): boolean {
    const u = navigator.userAgent.toLowerCase();
    if (u.indexOf('safari') > -1 && u.indexOf('chrome') === -1) {
      return true;
    } else {
      return false;
    }
  }

  async stopCamera(): Promise<void> {
    if (this.camera) {
      this.camera.close(true);
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async isOpen(): Promise<{ isOpen: boolean }> {
    if (this.camera) {
      return { isOpen: this.camera.isOpen() };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async takeSnapshot(options: { quality?: number }): Promise<{ base64: string }> {
    if (this.camera) {
      let desiredQuality = 85;
      if (options.quality) {
        desiredQuality = options.quality;
      }
      const dataURL = this.camera.getFrame().toCanvas().toDataURL('image/jpeg', desiredQuality);
      const base64 = dataURL.replace('data:image/jpeg;base64,', '');
      return { base64: base64 };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  async takeSnapshot2(options: { canvas: HTMLCanvasElement; maxLength?: number }): Promise<{ scaleRatio?: number }> {
    if (this.camera) {
      const canvas = options.canvas;
      let scaleRatio = 1.0;
      if (options.maxLength) {
        const res = (await this.getResolution()).resolution;
        const width = parseInt(res.split('x')[0]);
        const height = parseInt(res.split('x')[1]);
        let targetWidth = width;
        let targetHeight = height;
        if (width > options.maxLength || height > options.maxLength) {
          if (width > height) {
            targetWidth = options.maxLength;
            targetHeight = (options.maxLength / width) * height;
            scaleRatio = options.maxLength / width;
          } else {
            targetHeight = options.maxLength;
            targetWidth = (options.maxLength / height) * width;
            scaleRatio = options.maxLength / height;
          }
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const video = this.camera.getUIElement().getElementsByTagName('video')[0];
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          }
        } else {
          this.drawFullFrame(canvas);
        }
      } else {
        this.drawFullFrame(canvas);
      }
      return { scaleRatio: scaleRatio };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  drawFullFrame(canvas: HTMLCanvasElement): HTMLCanvasElement {
    const video = this.camera?.getUIElement().getElementsByTagName('video')[0];
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
    }
    return canvas;
  }

  async takePhoto(_options: { includeBase64?: boolean }): Promise<{ path?: string; base64?: string; blob?: Blob }> {
    void _options;
    if (this.camera) {
      const video = this.camera.getUIElement().getElementsByTagName('video')[0];
      const localStream: MediaStream = video.srcObject as MediaStream;
      if (localStream) {
        if ('ImageCapture' in window) {
          try {
            const ImageCapture = (window as Window & { ImageCapture?: ImageCaptureConstructor }).ImageCapture;
            if (!ImageCapture) {
              throw new Error('ImageCapture not supported');
            }
            console.log('ImageCapture supported');
            const track = localStream.getVideoTracks()[0];
            const imageCapture = new ImageCapture(track);
            const blob = await imageCapture.takePhoto();
            return { blob: blob };
          } catch (error) {
            console.log(error);
          }
        } else {
          console.log('ImageCapture not supported');
        }
      }
      this.camera.setScanRegion({
        regionLeft: 0,
        regionTop: 0,
        regionBottom: 100,
        regionRight: 100,
        regionMeasuredByPercentage: 1,
      });
      const base64 = this.removeDataURLHead(this.camera.getFrame().toCanvas().toDataURL('image/jpeg'));
      this.applyScanRegion();
      return { base64: base64 };
    } else {
      throw new Error('Camera not initialized');
    }
  }

  removeDataURLHead(dataURL: string): string {
    return dataURL.substring(dataURL.indexOf(',') + 1, dataURL.length);
  }

  async requestCameraPermission(): Promise<void> {
    const constraints = { video: true, audio: false };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const tracks = stream.getTracks();
    for (const track of tracks) {
      track.stop(); // stop the opened tracks
    }
  }

  async requestMicroPhonePermission(): Promise<void> {
    try {
      const constraints = { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const tracks = stream.getTracks();
      for (const track of tracks) {
        track.stop(); // stop the opened tracks
      }
      this.hasMicrophone = true;
    } catch (error) {
      this.hasMicrophone = false;
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    if (this.camera) {
      if (this.hasMicrophone) {
        const settings = this.camera.getVideoSettings();
        settings.audio = true;
        await this.camera.updateVideoSettings(settings);
      }
      const video = this.camera.getUIElement().getElementsByTagName('video')[0];
      this.recorder = new RecordRTC(video.srcObject as MediaStream, {
        type: 'video',
      });
      this.recorder.startRecording();
    } else {
      throw new Error('camera not initialized');
    }
  }

  async stopRecording(): Promise<{ blob: Blob }> {
    return new Promise<{ blob: Blob }>((resolve, reject) => {
      if (this.recorder) {
        const recorder = this.recorder;
        const stopRecordingCallback = () => {
          const blob = recorder.getBlob();
          recorder.destroy();
          this.recorder = null;
          resolve({ blob });
        };
        recorder.stopRecording(stopRecordingCallback);
      } else {
        reject('recorder not initialized');
      }
    });
  }

  async setLayout(options: { top: string; left: string; width: string; height: string }): Promise<void> {
    if (this.camera) {
      const ele = this.camera.getUIElement();
      if (options.top) {
        ele.style.top = options.top;
      }
      if (options.left) {
        ele.style.left = options.left;
      }
      if (options.width) {
        ele.style.width = options.width;
      }
      if (options.height) {
        ele.style.height = options.height;
      }
      ele.style.position = 'absolute';
    } else {
      throw new Error('Camera not initialized');
    }
  }
}
