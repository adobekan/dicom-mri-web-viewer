// ============================================================================
// View Controls (Zoom, Brightness, Contrast)
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import { dicomImage, resetBtn, zoomIn, zoomOut, brightnessSlider, contrastSlider } from './domElements.js';
import { redrawAllMeasurements } from './measurements.js';
import { state } from './state.js';

export function resetView() {
    cornerstone.reset(dicomImage);
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
}

export function zoomInImage() {
    // Disable zoom if measurement mode is active or measurements exist
    if (state.measurementMode || (state.savedMeasurements && state.savedMeasurements.length > 0)) {
        return;
    }
    
    const viewport = cornerstone.getViewport(dicomImage);
    viewport.scale += 0.2;
    viewport.scale = Math.min(10, viewport.scale);
    cornerstone.setViewport(dicomImage, viewport);
}

export function zoomOutImage() {
    // Disable zoom if measurement mode is active or measurements exist
    if (state.measurementMode || (state.savedMeasurements && state.savedMeasurements.length > 0)) {
        return;
    }
    
    const viewport = cornerstone.getViewport(dicomImage);
    viewport.scale -= 0.2;
    viewport.scale = Math.max(0.1, viewport.scale);
    cornerstone.setViewport(dicomImage, viewport);
}

function adjustBrightness(e) {
    const viewport = cornerstone.getViewport(dicomImage);
    viewport.voi.windowCenter += parseFloat(e.target.value) / 10;
    cornerstone.setViewport(dicomImage, viewport);
}

function adjustContrast(e) {
    const viewport = cornerstone.getViewport(dicomImage);
    viewport.voi.windowWidth += parseFloat(e.target.value) / 10;
    viewport.voi.windowWidth = Math.max(1, viewport.voi.windowWidth);
    cornerstone.setViewport(dicomImage, viewport);
}

export function setupViewControlListeners() {
    resetBtn.addEventListener('click', resetView);
    zoomIn.addEventListener('click', zoomInImage);
    zoomOut.addEventListener('click', zoomOutImage);
    brightnessSlider.addEventListener('input', adjustBrightness);
    contrastSlider.addEventListener('input', adjustContrast);
}
