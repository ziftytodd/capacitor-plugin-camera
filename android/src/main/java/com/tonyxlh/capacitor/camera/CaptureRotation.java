package com.tonyxlh.capacitor.camera;

/**
 * The two pure mappings the still-photo path needs: physical device orientation to the
 * Surface rotation CameraX stamps on a capture, and an EXIF orientation tag to the
 * rotate/flip that turns the stored pixels upright.
 *
 * <p>This class has no Android runtime dependency so it can be unit tested on the JVM.
 * The constants below mirror {@code android.view.Surface.ROTATION_*} and the EXIF
 * orientation values that {@code ExifInterface.ORIENTATION_*} also exposes;
 * {@code CaptureRotationTest} pins both sets against the real constants.
 */
public final class CaptureRotation {

    /** Mirrors {@code android.view.Surface.ROTATION_0}. */
    public static final int ROTATION_0 = 0;

    /** Mirrors {@code android.view.Surface.ROTATION_90}. */
    public static final int ROTATION_90 = 1;

    /** Mirrors {@code android.view.Surface.ROTATION_180}. */
    public static final int ROTATION_180 = 2;

    /** Mirrors {@code android.view.Surface.ROTATION_270}. */
    public static final int ROTATION_270 = 3;

    // EXIF orientation tag values (TIFF 6.0 tag 0x0112), as used by ExifInterface.
    public static final int ORIENTATION_NORMAL = 1;
    public static final int ORIENTATION_FLIP_HORIZONTAL = 2;
    public static final int ORIENTATION_ROTATE_180 = 3;
    public static final int ORIENTATION_FLIP_VERTICAL = 4;
    public static final int ORIENTATION_TRANSPOSE = 5;
    public static final int ORIENTATION_ROTATE_90 = 6;
    public static final int ORIENTATION_TRANSVERSE = 7;
    public static final int ORIENTATION_ROTATE_270 = 8;

    private CaptureRotation() {}

    /**
     * Maps the degrees reported by {@code OrientationEventListener} to a Surface rotation,
     * the way the CameraX guide does it: 315-45 to ROTATION_0, 45-135 to ROTATION_270,
     * 135-225 to ROTATION_180, 225-315 to ROTATION_90.
     *
     * <p>Callers must filter {@code OrientationEventListener.ORIENTATION_UNKNOWN} first and
     * keep their last value; degrees outside 0-359 are normalised rather than rejected.
     */
    public static int surfaceRotationForDeviceOrientation(int degrees) {
        int normalised = ((degrees % 360) + 360) % 360;
        if (normalised >= 45 && normalised < 135) {
            return ROTATION_270;
        }
        if (normalised >= 135 && normalised < 225) {
            return ROTATION_180;
        }
        if (normalised >= 225 && normalised < 315) {
            return ROTATION_90;
        }
        return ROTATION_0;
    }

    /**
     * The transform that turns pixels stored with the given EXIF orientation upright.
     * Unknown or undefined values map to the identity, so an unreadable tag never
     * mangles a photo.
     */
    public static Transform transformForExifOrientation(int exifOrientation) {
        switch (exifOrientation) {
            case ORIENTATION_FLIP_HORIZONTAL:
                return new Transform(0, true, false);
            case ORIENTATION_ROTATE_180:
                return new Transform(180, false, false);
            case ORIENTATION_FLIP_VERTICAL:
                return new Transform(0, false, true);
            case ORIENTATION_TRANSPOSE:
                return new Transform(90, true, false);
            case ORIENTATION_ROTATE_90:
                return new Transform(90, false, false);
            case ORIENTATION_TRANSVERSE:
                return new Transform(270, true, false);
            case ORIENTATION_ROTATE_270:
                return new Transform(270, false, false);
            default:
                return new Transform(0, false, false);
        }
    }

    /**
     * A clockwise rotation followed by a mirror on either axis, in that order - the order
     * {@code Matrix.postRotate} then {@code Matrix.postScale} applies them.
     */
    public static final class Transform {

        public final int degrees;
        public final boolean flipX;
        public final boolean flipY;

        Transform(int degrees, boolean flipX, boolean flipY) {
            this.degrees = degrees;
            this.flipX = flipX;
            this.flipY = flipY;
        }

        /** True when the stored pixels are already upright and must not be touched. */
        public boolean isIdentity() {
            return degrees == 0 && !flipX && !flipY;
        }
    }
}
