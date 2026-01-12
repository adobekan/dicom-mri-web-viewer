// ============================================================================
// UI Helper Functions
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import { loading, imageInfo, seriesInfo, controls, sliceNav, sliceSliderContainer, dicomImage, exportBtn } from './domElements.js';
import { state } from './state.js';

export function showLoading() {
    loading.style.display = 'block';
}

export function hideLoading() {
    loading.style.display = 'none';
}

export function hideAllInfo() {
    imageInfo.style.display = 'none';
    seriesInfo.style.display = 'none';
    controls.style.display = 'none';
    sliceNav.style.display = 'none';
    sliceSliderContainer.style.display = 'none';
}

export function exportToPNG() {
    try {
        // Get the canvas element from cornerstone
        const canvas = dicomImage.querySelector('canvas');
        if (!canvas) {
            alert('No image to export');
            return;
        }

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (!blob) {
                alert('Failed to export image');
                return;
            }

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const seriesName = state.currentSeries ? `series-${state.currentSeries}` : 'image';
            const sliceNum = state.currentSliceIndex + 1;
            link.download = `mri-${seriesName}-slice-${sliceNum}_${timestamp}.png`;
            
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
        }, 'image/png');
    } catch (error) {
        console.error('Export failed:', error);
        alert('Failed to export image: ' + error.message);
    }
}

export function setupExportListener() {
    exportBtn.addEventListener('click', exportToPNG);
}
