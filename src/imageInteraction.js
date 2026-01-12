// ============================================================================
// Image Interaction (Pan, Zoom, Coordinate Tracking)
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import { state } from './state.js';
import { dicomImage, coordinateOverlay, pixelCoords, realCoords, measureBtn } from './domElements.js';
import { handleMeasurementClick, redrawAllMeasurements } from './measurements.js';
import { navigateToPreviousSlice, navigateToNextSlice } from './seriesManager.js';

export function enableImageInteractionOnce() {
    if (state.interactionEnabled) return;
    
    enableImageInteraction();
    state.interactionEnabled = true;
}

function enableImageInteraction() {
    // Mouse wheel zoom
    dicomImage.addEventListener('wheel', handleMouseWheel);
    
    // Mouse coordinate tracking
    dicomImage.addEventListener('mousemove', handleMouseMove);
    dicomImage.addEventListener('mouseenter', () => coordinateOverlay.style.display = 'block');
    dicomImage.addEventListener('mouseleave', () => coordinateOverlay.style.display = 'none');
    
    // Pan and measurement click handling
    let isPanning = false;
    let startX, startY;
    
    dicomImage.addEventListener('mousedown', (e) => {
        if (state.measurementMode) {
            handleMeasurementClick(e);
            return;
        }
        
        isPanning = true;
        startX = e.clientX;
        startY = e.clientY;
        dicomImage.style.cursor = 'grabbing';
    });
    
    dicomImage.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const viewport = cornerstone.getViewport(dicomImage);
        viewport.translation.x += deltaX / viewport.scale;
        viewport.translation.y += deltaY / viewport.scale;
        cornerstone.setViewport(dicomImage, viewport);
        
        // Redraw measurements with new translation
        if (state.savedMeasurements && state.savedMeasurements.length > 0) {
            redrawAllMeasurements();
        }
        
        startX = e.clientX;
        startY = e.clientY;
    });
    
    dicomImage.addEventListener('mouseup', () => {
        isPanning = false;
        updateCursor();
    });
    
    dicomImage.addEventListener('mouseleave', () => {
        isPanning = false;
        dicomImage.style.cursor = 'default';
    });
    
    updateCursor();
}

function handleMouseMove(event) {
    const rect = dicomImage.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    try {
        const viewport = cornerstone.getViewport(dicomImage);
        const enabledElement = cornerstone.getEnabledElement(dicomImage);
        const image = enabledElement.image;
        
        if (image) {
            const imageX = Math.round((x - viewport.translation.x) / viewport.scale);
            const imageY = Math.round((y - viewport.translation.y) / viewport.scale);
            
            const realX = (imageX * state.pixelSpacing[1]).toFixed(2);
            const realY = (imageY * state.pixelSpacing[0]).toFixed(2);
            
            pixelCoords.textContent = `Pixel: (${imageX}, ${imageY})`;
            realCoords.textContent = `Position: (${realX}, ${realY}) mm`;
        }
    } catch (e) {
        // Ignore when image not loaded
    }
}

function handleMouseWheel(event) {
    event.preventDefault();
    
    // Disable zoom if measurement mode is active or measurements exist
    if (state.measurementMode || (state.savedMeasurements && state.savedMeasurements.length > 0)) {
        return;
    }
    
    const viewport = cornerstone.getViewport(dicomImage);
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    viewport.scale += delta;
    viewport.scale = Math.max(0.1, Math.min(10, viewport.scale));
    cornerstone.setViewport(dicomImage, viewport);
}

export function updateCursor() {
    dicomImage.style.cursor = state.measurementMode ? 'crosshair' : 'grab';
}

export function handleKeyboardNavigation(e) {
    if (!state.currentSeries) return;
    
    const seriesData = state.studySeriesMap.get(state.currentSeries);
    if (!seriesData) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
            e.preventDefault();
            navigateToNextSlice();
            break;
        case 'ArrowDown':
        case 'ArrowLeft':
            e.preventDefault();
            navigateToPreviousSlice();
            break;
        case 'Escape':
            if (state.measurementMode) {
                state.measurementMode = false;
                measureBtn.classList.remove('active');
                state.measurementPoints = [];
                updateCursor();
            }
            break;
    }
}

export function setupKeyboardListener() {
    document.addEventListener('keydown', handleKeyboardNavigation);
}
