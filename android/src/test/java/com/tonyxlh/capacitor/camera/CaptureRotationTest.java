package com.tonyxlh.capacitor.camera;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import android.view.Surface;
import androidx.exifinterface.media.ExifInterface;
import com.tonyxlh.capacitor.camera.CaptureRotation.Transform;
import org.junit.Test;

/**
 * Runs on the JVM: {@link CaptureRotation} touches no Android runtime API, and the Android
 * constants referenced here are compile-time ints that javac inlines.
 */
public class CaptureRotationTest {

    @Test
    public void rotationConstantsMatchSurface() {
        assertEquals(Surface.ROTATION_0, CaptureRotation.ROTATION_0);
        assertEquals(Surface.ROTATION_90, CaptureRotation.ROTATION_90);
        assertEquals(Surface.ROTATION_180, CaptureRotation.ROTATION_180);
        assertEquals(Surface.ROTATION_270, CaptureRotation.ROTATION_270);
    }

    @Test
    public void orientationConstantsMatchExifInterface() {
        assertEquals(ExifInterface.ORIENTATION_NORMAL, CaptureRotation.ORIENTATION_NORMAL);
        assertEquals(ExifInterface.ORIENTATION_FLIP_HORIZONTAL, CaptureRotation.ORIENTATION_FLIP_HORIZONTAL);
        assertEquals(ExifInterface.ORIENTATION_ROTATE_180, CaptureRotation.ORIENTATION_ROTATE_180);
        assertEquals(ExifInterface.ORIENTATION_FLIP_VERTICAL, CaptureRotation.ORIENTATION_FLIP_VERTICAL);
        assertEquals(ExifInterface.ORIENTATION_TRANSPOSE, CaptureRotation.ORIENTATION_TRANSPOSE);
        assertEquals(ExifInterface.ORIENTATION_ROTATE_90, CaptureRotation.ORIENTATION_ROTATE_90);
        assertEquals(ExifInterface.ORIENTATION_TRANSVERSE, CaptureRotation.ORIENTATION_TRANSVERSE);
        assertEquals(ExifInterface.ORIENTATION_ROTATE_270, CaptureRotation.ORIENTATION_ROTATE_270);
    }

    @Test
    public void uprightPhoneMapsToRotation0() {
        assertEquals(CaptureRotation.ROTATION_0, CaptureRotation.surfaceRotationForDeviceOrientation(0));
        assertEquals(CaptureRotation.ROTATION_0, CaptureRotation.surfaceRotationForDeviceOrientation(44));
        assertEquals(CaptureRotation.ROTATION_0, CaptureRotation.surfaceRotationForDeviceOrientation(315));
        assertEquals(CaptureRotation.ROTATION_0, CaptureRotation.surfaceRotationForDeviceOrientation(359));
    }

    @Test
    public void phoneRotatedClockwiseMapsToRotation270() {
        assertEquals(CaptureRotation.ROTATION_270, CaptureRotation.surfaceRotationForDeviceOrientation(45));
        assertEquals(CaptureRotation.ROTATION_270, CaptureRotation.surfaceRotationForDeviceOrientation(90));
        assertEquals(CaptureRotation.ROTATION_270, CaptureRotation.surfaceRotationForDeviceOrientation(134));
    }

    @Test
    public void upsideDownPhoneMapsToRotation180() {
        assertEquals(CaptureRotation.ROTATION_180, CaptureRotation.surfaceRotationForDeviceOrientation(135));
        assertEquals(CaptureRotation.ROTATION_180, CaptureRotation.surfaceRotationForDeviceOrientation(180));
        assertEquals(CaptureRotation.ROTATION_180, CaptureRotation.surfaceRotationForDeviceOrientation(224));
    }

    @Test
    public void phoneRotatedCounterClockwiseMapsToRotation90() {
        assertEquals(CaptureRotation.ROTATION_90, CaptureRotation.surfaceRotationForDeviceOrientation(225));
        assertEquals(CaptureRotation.ROTATION_90, CaptureRotation.surfaceRotationForDeviceOrientation(270));
        assertEquals(CaptureRotation.ROTATION_90, CaptureRotation.surfaceRotationForDeviceOrientation(314));
    }

    @Test
    public void degreesOutsideOneTurnAreNormalised() {
        assertEquals(CaptureRotation.ROTATION_0, CaptureRotation.surfaceRotationForDeviceOrientation(360));
        assertEquals(CaptureRotation.ROTATION_270, CaptureRotation.surfaceRotationForDeviceOrientation(450));
        assertEquals(CaptureRotation.ROTATION_90, CaptureRotation.surfaceRotationForDeviceOrientation(-90));
    }

    @Test
    public void normalOrientationIsLeftAlone() {
        assertTrue(CaptureRotation.transformForExifOrientation(CaptureRotation.ORIENTATION_NORMAL).isIdentity());
    }

    @Test
    public void unknownOrientationIsLeftAlone() {
        assertTrue(CaptureRotation.transformForExifOrientation(ExifInterface.ORIENTATION_UNDEFINED).isIdentity());
        assertTrue(CaptureRotation.transformForExifOrientation(0).isIdentity());
        assertTrue(CaptureRotation.transformForExifOrientation(9).isIdentity());
        assertTrue(CaptureRotation.transformForExifOrientation(-1).isIdentity());
    }

    @Test
    public void quarterTurnOrientationsRotateOnly() {
        assertTransform(CaptureRotation.ORIENTATION_ROTATE_90, 90, false, false);
        assertTransform(CaptureRotation.ORIENTATION_ROTATE_180, 180, false, false);
        assertTransform(CaptureRotation.ORIENTATION_ROTATE_270, 270, false, false);
    }

    @Test
    public void mirroredOrientationsFlipOnly() {
        assertTransform(CaptureRotation.ORIENTATION_FLIP_HORIZONTAL, 0, true, false);
        assertTransform(CaptureRotation.ORIENTATION_FLIP_VERTICAL, 0, false, true);
    }

    @Test
    public void diagonalOrientationsRotateAndMirror() {
        // Transpose is a reflection about the main diagonal: a quarter turn clockwise
        // followed by a horizontal mirror. Transverse is the same about the anti-diagonal.
        assertTransform(CaptureRotation.ORIENTATION_TRANSPOSE, 90, true, false);
        assertTransform(CaptureRotation.ORIENTATION_TRANSVERSE, 270, true, false);
    }

    private void assertTransform(int exifOrientation, int degrees, boolean flipX, boolean flipY) {
        Transform transform = CaptureRotation.transformForExifOrientation(exifOrientation);
        assertEquals("degrees for EXIF orientation " + exifOrientation, degrees, transform.degrees);
        assertEquals("flipX for EXIF orientation " + exifOrientation, flipX, transform.flipX);
        assertEquals("flipY for EXIF orientation " + exifOrientation, flipY, transform.flipY);
        assertFalse("EXIF orientation " + exifOrientation + " must change the pixels", transform.isIdentity());
    }
}
