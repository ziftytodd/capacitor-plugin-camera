import { WebPlugin } from '@capacitor/core';
import type { CameraPreviewPlugin, ScanRegion } from './definitions';
export declare class CameraPreviewWeb extends WebPlugin implements CameraPreviewPlugin {
    private camera;
    private container;
    private region;
    private recorder;
    private hasMicrophone;
    setDefaultUIElementURL(url: string): Promise<void>;
    setElement(ele: HTMLElement): Promise<void>;
    saveFrame(): Promise<{
        success: boolean;
    }>;
    getOrientation(): Promise<{
        orientation: 'PORTRAIT' | 'LANDSCAPE';
    }>;
    initialize(): Promise<void>;
    getResolution(): Promise<{
        resolution: string;
    }>;
    setResolution(options: {
        resolution: number;
    }): Promise<void>;
    getAllCameras(): Promise<{
        cameras: string[];
    }>;
    getSelectedCamera(): Promise<{
        selectedCamera: string;
    }>;
    selectCamera(options: {
        cameraID: string;
    }): Promise<void>;
    setScanRegion(options: {
        region: ScanRegion;
    }): Promise<void>;
    applyScanRegion(): void;
    setZoom(options: {
        factor: number;
    }): Promise<void>;
    setFocus(options: {
        x: number;
        y: number;
    }): Promise<void>;
    toggleTorch(options: {
        on: boolean;
    }): Promise<void>;
    startCamera(): Promise<void>;
    isSafari(): boolean;
    stopCamera(): Promise<void>;
    isOpen(): Promise<{
        isOpen: boolean;
    }>;
    takeSnapshot(options: {
        quality?: number;
    }): Promise<{
        base64: string;
    }>;
    takeSnapshot2(options: {
        canvas: HTMLCanvasElement;
        maxLength?: number;
    }): Promise<{
        scaleRatio?: number;
    }>;
    drawFullFrame(canvas: HTMLCanvasElement): HTMLCanvasElement;
    takePhoto(_options: {
        includeBase64?: boolean;
    }): Promise<{
        path?: string;
        base64?: string;
        blob?: Blob;
    }>;
    removeDataURLHead(dataURL: string): string;
    requestCameraPermission(): Promise<void>;
    requestMicroPhonePermission(): Promise<void>;
    startRecording(): Promise<void>;
    stopRecording(): Promise<{
        blob: Blob;
    }>;
    setLayout(options: {
        top: string;
        left: string;
        width: string;
        height: string;
    }): Promise<void>;
}
