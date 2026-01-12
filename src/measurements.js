// ============================================================================
// Measurement Tools
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import { state } from './state.js';
import { dicomImage, measurementOverlay, measureBtn, clearMeasureBtn, measurementResult } from './domElements.js';
import { updateCursor } from './imageInteraction.js';

export function toggleMeasurementMode() {
    state.measurementMode = !state.measurementMode;
    state.measurementPoints = [];
    
    if (state.measurementMode) {
        measureBtn.classList.add('active');
    } else {
        measureBtn.classList.remove('active');
    }
    
    updateCursor();
}

export function handleMeasurementClick(event) {
    const rect = dicomImage.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert canvas coordinates to image coordinates
    const viewport = cornerstone.getViewport(dicomImage);
    const imageX = (canvasX - viewport.translation.x) / viewport.scale;
    const imageY = (canvasY - viewport.translation.y) / viewport.scale;
    
    state.measurementPoints.push({ imageX, imageY, canvasX, canvasY });
    
    if (state.measurementPoints.length === 2) {
        saveMeasurement();
        redrawAllMeasurements();
        // Reset points for next measurement but keep overlay visible
        state.measurementPoints = [];
    } else {
        redrawAllMeasurements();
    }
}

function saveMeasurement() {
    if (state.measurementPoints.length !== 2) return;
    
    const p1 = state.measurementPoints[0];
    const p2 = state.measurementPoints[1];
    
    // Calculate real distance
    const dx = (p2.imageX - p1.imageX) * state.pixelSpacing[1];
    const dy = (p2.imageY - p1.imageY) * state.pixelSpacing[0];
    const realDistance = Math.sqrt(dx * dx + dy * dy);
    
    // Save measurement in image coordinates
    state.savedMeasurements.push({
        p1: { x: p1.imageX, y: p1.imageY },
        p2: { x: p2.imageX, y: p2.imageY },
        distance: realDistance
    });
    
    console.log('Saved measurement:', state.savedMeasurements[state.savedMeasurements.length - 1]);
}

export function redrawAllMeasurements() {
    measurementOverlay.innerHTML = '';
    
    const viewport = cornerstone.getViewport(dicomImage);
    
    // Draw all saved measurements
    state.savedMeasurements.forEach(measurement => {
        // Convert image coordinates to canvas coordinates
        const canvasP1 = {
            x: measurement.p1.x * viewport.scale + viewport.translation.x,
            y: measurement.p1.y * viewport.scale + viewport.translation.y
        };
        const canvasP2 = {
            x: measurement.p2.x * viewport.scale + viewport.translation.x,
            y: measurement.p2.y * viewport.scale + viewport.translation.y
        };
        
        drawMeasurementLine(canvasP1, canvasP2);
        drawMeasurementPoint(canvasP1.x, canvasP1.y);
        drawMeasurementPoint(canvasP2.x, canvasP2.y);
    });
    
    // Draw current measurement in progress
    if (state.measurementPoints.length === 1) {
        const p = state.measurementPoints[0];
        drawMeasurementPoint(p.canvasX, p.canvasY);
    }
    
    // Update result display
    if (state.savedMeasurements.length > 0) {
        const lastMeasurement = state.savedMeasurements[state.savedMeasurements.length - 1];
        measurementResult.textContent = `Distance: ${lastMeasurement.distance.toFixed(2)} mm`;
    state.savedMeasurements = [];
        measurementResult.style.display = 'block';
        clearMeasureBtn.style.display = 'inline-block';
    }
}

function drawMeasurementLine(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const line = document.createElement('div');
    line.className = 'measurement-line';
    const angle = Math.atan2(dy, dx);
    line.style.left = `${p1.x}px`;
    line.style.top = `${p1.y}px`;
    line.style.width = `${distance}px`;
    line.style.height = '4px';
    line.style.transform = `rotate(${angle}rad)`;
    line.style.backgroundColor = 'rgba(64, 224, 208, 0.9)';
    line.style.position = 'absolute';
    measurementOverlay.appendChild(line);
}

function drawMeasurementPoint(x, y) {
    const point = document.createElement('div');
    point.className = 'measurement-point';
    point.style.left = `${x}px`;
    point.style.top = `${y}px`;
    measurementOverlay.appendChild(point);
}

export function clearMeasurements() {
    measurementOverlay.innerHTML = '';
    state.measurementPoints = [];
    measurementResult.style.display = 'none';
    clearMeasureBtn.style.display = 'none';
    
    if (state.measurementMode) {
        state.measurementMode = false;
        measureBtn.classList.remove('active');
        updateCursor();
    }
}

export function setupMeasurementListeners() {
    measureBtn.addEventListener('click', toggleMeasurementMode);
    clearMeasureBtn.addEventListener('click', clearMeasurements);
}
