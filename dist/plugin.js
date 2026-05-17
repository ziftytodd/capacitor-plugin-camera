var capacitorCameraPreview = (function (exports, core, dynamsoftCameraEnhancer, RecordRTC) {
    'use strict';

    exports.EnumResolution = void 0;
    (function (EnumResolution) {
        EnumResolution[EnumResolution["RESOLUTION_AUTO"] = 0] = "RESOLUTION_AUTO";
        EnumResolution[EnumResolution["RESOLUTION_480P"] = 1] = "RESOLUTION_480P";
        EnumResolution[EnumResolution["RESOLUTION_720P"] = 2] = "RESOLUTION_720P";
        EnumResolution[EnumResolution["RESOLUTION_1080P"] = 3] = "RESOLUTION_1080P";
        EnumResolution[EnumResolution["RESOLUTION_2K"] = 4] = "RESOLUTION_2K";
        EnumResolution[EnumResolution["RESOLUTION_4K"] = 5] = "RESOLUTION_4K";
    })(exports.EnumResolution || (exports.EnumResolution = {}));

    const CameraPreview = core.registerPlugin('CameraPreview', {
        web: () => Promise.resolve().then(function () { return web; }).then((m) => new m.CameraPreviewWeb()),
    });

    dynamsoftCameraEnhancer.CameraEnhancer.defaultUIElementURL = 'https://cdn.jsdelivr.net/npm/dynamsoft-camera-enhancer@3.3.9/dist/dce.ui.html';
    class CameraPreviewWeb extends core.WebPlugin {
        constructor() {
            super(...arguments);
            this.hasMicrophone = false;
        }
        async setDefaultUIElementURL(url) {
            dynamsoftCameraEnhancer.CameraEnhancer.defaultUIElementURL = url;
        }
        async setElement(ele) {
            this.container = ele;
        }
        saveFrame() {
            throw new Error('Method not implemented.');
        }
        async getOrientation() {
            const portrait = window.matchMedia('(orientation: portrait)');
            if (portrait.matches) {
                return { orientation: 'PORTRAIT' };
            }
            else {
                return { orientation: 'LANDSCAPE' };
            }
        }
        async initialize() {
            this.camera = await dynamsoftCameraEnhancer.CameraEnhancer.createInstance();
            const camera = this.camera;
            this.camera.on('played', (playCallBackInfo) => {
                this.notifyListeners('onPlayed', { resolution: playCallBackInfo.width + 'x' + playCallBackInfo.height });
                try {
                    const canvas = camera
                        .getUIElement()
                        .getElementsByClassName('dce-video-container')[0]
                        .getElementsByTagName('canvas')[0];
                    if (canvas) {
                        canvas.remove();
                    }
                }
                catch (error) {
                    console.log(error);
                }
            });
            if (this.container) {
                await this.camera.setUIElement(this.container);
            }
            else {
                await this.camera.setUIElement(dynamsoftCameraEnhancer.CameraEnhancer.defaultUIElementURL);
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
        async getResolution() {
            if (this.camera) {
                const rsl = this.camera.getResolution();
                const resolution = rsl[0] + 'x' + rsl[1];
                return { resolution: resolution };
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async setResolution(options) {
            if (this.camera) {
                const res = options.resolution;
                let width = 1280;
                let height = 720;
                if (res == exports.EnumResolution.RESOLUTION_480P) {
                    width = 640;
                    height = 480;
                }
                else if (res == exports.EnumResolution.RESOLUTION_720P) {
                    width = 1280;
                    height = 720;
                }
                else if (res == exports.EnumResolution.RESOLUTION_1080P) {
                    width = 1920;
                    height = 1080;
                }
                else if (res == exports.EnumResolution.RESOLUTION_2K) {
                    width = 2560;
                    height = 1440;
                }
                else if (res == exports.EnumResolution.RESOLUTION_4K) {
                    width = 3840;
                    height = 2160;
                }
                await this.camera.setResolution(width, height);
                return;
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async getAllCameras() {
            if (this.camera) {
                const cameras = await this.camera.getAllCameras();
                const labels = [];
                cameras.forEach((camera) => {
                    labels.push(camera.label);
                });
                return { cameras: labels };
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async getSelectedCamera() {
            if (this.camera) {
                const cameraInfo = this.camera.getSelectedCamera();
                return { selectedCamera: cameraInfo.label };
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async selectCamera(options) {
            if (this.camera) {
                const cameras = await this.camera.getAllCameras();
                for (const camera of cameras) {
                    if (camera.label === options.cameraID) {
                        await this.camera.selectCamera(camera);
                        return;
                    }
                }
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async setScanRegion(options) {
            if (this.camera) {
                this.region = options.region;
                this.applyScanRegion();
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        applyScanRegion() {
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
        async setZoom(options) {
            if (this.camera) {
                await this.camera.setZoom(options.factor);
                return;
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async setFocus(options) {
            if (this.camera) {
                this.camera.setFocus({
                    mode: 'manual',
                    area: {
                        centerPoint: { x: options.x.toString(), y: options.y.toString() },
                    },
                });
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async toggleTorch(options) {
            if (this.camera) {
                try {
                    if (options['on']) {
                        await this.camera.turnOnTorch();
                    }
                    else {
                        await this.camera.turnOffTorch();
                    }
                }
                catch (e) {
                    throw new Error('Torch unsupported');
                }
            }
        }
        async startCamera() {
            var _a;
            if (this.camera) {
                await ((_a = this.camera) === null || _a === void 0 ? void 0 : _a.open(true));
                if (this.container && this.isSafari() === true) {
                    const resetZoom = async () => {
                        var _a, _b;
                        await ((_a = this.camera) === null || _a === void 0 ? void 0 : _a.setZoom(1.001));
                        await ((_b = this.camera) === null || _b === void 0 ? void 0 : _b.setZoom(1.0));
                    };
                    setTimeout(resetZoom, 500);
                }
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        isSafari() {
            const u = navigator.userAgent.toLowerCase();
            if (u.indexOf('safari') > -1 && u.indexOf('chrome') === -1) {
                return true;
            }
            else {
                return false;
            }
        }
        async stopCamera() {
            if (this.camera) {
                this.camera.close(true);
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async isOpen() {
            if (this.camera) {
                return { isOpen: this.camera.isOpen() };
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async takeSnapshot(options) {
            if (this.camera) {
                let desiredQuality = 85;
                if (options.quality) {
                    desiredQuality = options.quality;
                }
                const dataURL = this.camera.getFrame().toCanvas().toDataURL('image/jpeg', desiredQuality);
                const base64 = dataURL.replace('data:image/jpeg;base64,', '');
                return { base64: base64 };
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        async takeSnapshot2(options) {
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
                        }
                        else {
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
                    }
                    else {
                        this.drawFullFrame(canvas);
                    }
                }
                else {
                    this.drawFullFrame(canvas);
                }
                return { scaleRatio: scaleRatio };
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        drawFullFrame(canvas) {
            var _a;
            const video = (_a = this.camera) === null || _a === void 0 ? void 0 : _a.getUIElement().getElementsByTagName('video')[0];
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
        async takePhoto(_options) {
            if (this.camera) {
                const video = this.camera.getUIElement().getElementsByTagName('video')[0];
                const localStream = video.srcObject;
                if (localStream) {
                    if ('ImageCapture' in window) {
                        try {
                            const ImageCapture = window.ImageCapture;
                            if (!ImageCapture) {
                                throw new Error('ImageCapture not supported');
                            }
                            console.log('ImageCapture supported');
                            const track = localStream.getVideoTracks()[0];
                            const imageCapture = new ImageCapture(track);
                            const blob = await imageCapture.takePhoto();
                            return { blob: blob };
                        }
                        catch (error) {
                            console.log(error);
                        }
                    }
                    else {
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
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
        removeDataURLHead(dataURL) {
            return dataURL.substring(dataURL.indexOf(',') + 1, dataURL.length);
        }
        async requestCameraPermission() {
            const constraints = { video: true, audio: false };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const tracks = stream.getTracks();
            for (const track of tracks) {
                track.stop(); // stop the opened tracks
            }
        }
        async requestMicroPhonePermission() {
            try {
                const constraints = { video: false, audio: true };
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                const tracks = stream.getTracks();
                for (const track of tracks) {
                    track.stop(); // stop the opened tracks
                }
                this.hasMicrophone = true;
            }
            catch (error) {
                this.hasMicrophone = false;
                throw error;
            }
        }
        async startRecording() {
            if (this.camera) {
                if (this.hasMicrophone) {
                    const settings = this.camera.getVideoSettings();
                    settings.audio = true;
                    await this.camera.updateVideoSettings(settings);
                }
                const video = this.camera.getUIElement().getElementsByTagName('video')[0];
                this.recorder = new RecordRTC(video.srcObject, {
                    type: 'video',
                });
                this.recorder.startRecording();
            }
            else {
                throw new Error('camera not initialized');
            }
        }
        async stopRecording() {
            return new Promise((resolve, reject) => {
                if (this.recorder) {
                    const recorder = this.recorder;
                    const stopRecordingCallback = () => {
                        const blob = recorder.getBlob();
                        recorder.destroy();
                        this.recorder = null;
                        resolve({ blob });
                    };
                    recorder.stopRecording(stopRecordingCallback);
                }
                else {
                    reject('recorder not initialized');
                }
            });
        }
        async setLayout(options) {
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
            }
            else {
                throw new Error('Camera not initialized');
            }
        }
    }

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CameraPreviewWeb: CameraPreviewWeb
    });

    exports.CameraPreview = CameraPreview;

    return exports;

})({}, capacitorExports, dynamsoftCameraEnhancer, RecordRTC);
//# sourceMappingURL=plugin.js.map
