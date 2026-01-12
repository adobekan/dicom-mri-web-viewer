// ============================================================================
// Series and Slice Management
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import { state } from './state.js';
import { 
    dicomImage, seriesDescription, imageInfo,
    sliceNav, sliceSliderContainer, sliceSlider, sliceInfo,
    seriesSelect, firstSlice, prevSlice, nextSlice, lastSlice
} from './domElements.js';
import { displayMetadata, extractPixelSpacing } from './metadata.js';
import { enableImageInteractionOnce } from './imageInteraction.js';
import { clearMeasurements } from './measurements.js';

export async function loadSeries(seriesNumber) {
    state.currentSeries = seriesNumber;
    const seriesData = state.studySeriesMap.get(seriesNumber);
    
    if (!seriesData || seriesData.images.length === 0) return;

    clearMeasurements();
    
    seriesDescription.textContent = seriesData.description || '';

    state.currentSliceIndex = 0;
    await loadSlice(state.currentSliceIndex);

    setupSliceNavigation(seriesData.images.length);
    
    imageInfo.style.display = 'block';
    enableImageInteractionOnce();
}

export async function loadSlice(index) {
    const seriesData = state.studySeriesMap.get(state.currentSeries);
    if (!seriesData || index < 0 || index >= seriesData.images.length) return;

    state.currentSliceIndex = index;
    const imageData = seriesData.images[index];

    clearMeasurements();

    try {
        const image = await cornerstone.loadImage(imageData.imageId);
        cornerstone.displayImage(dicomImage, image);
        displayMetadata(imageData.dataSet);
        updateSliceInfo();
        extractPixelSpacing(imageData.dataSet, state);
    } catch (error) {
        console.error('Error loading slice:', error);
    }
}

function setupSliceNavigation(imageCount) {
    if (imageCount > 1) {
        sliceNav.style.display = 'flex';
        sliceSliderContainer.style.display = 'block';
        sliceSlider.max = imageCount - 1;
        sliceSlider.value = 0;
        
        document.getElementById('sliderMin').textContent = '1';
        document.getElementById('sliderMax').textContent = imageCount.toString();
        
        updateSliceInfo();
    } else {
        sliceNav.style.display = 'none';
        sliceSliderContainer.style.display = 'none';
    }
}

export function navigateToPreviousSlice() {
    if (state.currentSliceIndex > 0) {
        loadSlice(state.currentSliceIndex - 1);
    }
}

export function navigateToNextSlice() {
    const seriesData = state.studySeriesMap.get(state.currentSeries);
    if (seriesData && state.currentSliceIndex < seriesData.images.length - 1) {
        loadSlice(state.currentSliceIndex + 1);
    }
}

export function navigateToLastSlice() {
    const seriesData = state.studySeriesMap.get(state.currentSeries);
    if (seriesData) {
        loadSlice(seriesData.images.length - 1);
    }
}

function updateSliceInfo() {
    const seriesData = state.studySeriesMap.get(state.currentSeries);
    if (!seriesData) return;
    
    sliceInfo.textContent = `Slice ${state.currentSliceIndex + 1} / ${seriesData.images.length}`;
    sliceSlider.value = state.currentSliceIndex;
}

export function setupSeriesNavigationListeners() {
    seriesSelect.addEventListener('change', (e) => loadSeries(e.target.value));
    firstSlice.addEventListener('click', () => loadSlice(0));
    prevSlice.addEventListener('click', navigateToPreviousSlice);
    nextSlice.addEventListener('click', navigateToNextSlice);
    lastSlice.addEventListener('click', navigateToLastSlice);
    sliceSlider.addEventListener('input', (e) => loadSlice(parseInt(e.target.value)));
}
