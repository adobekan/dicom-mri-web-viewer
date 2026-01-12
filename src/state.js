// ============================================================================
// Application State Management
// ============================================================================

export const state = {
    studySeriesMap: new Map(), // Map of series number -> array of image IDs
    currentSeries: null,
    currentSliceIndex: 0,
    pixelSpacing: [1, 1], // Default pixel spacing [row, column] in mm
    measurementMode: false,
    measurementPoints: [],
    savedMeasurements: [], // Store measurements in image coordinates
    interactionEnabled: false
};

export function resetState() {
    state.studySeriesMap.clear();
    state.currentSeries = null;
    state.currentSliceIndex = 0;
    state.pixelSpacing = [1, 1];
    state.measurementMode = false;
    state.measurementPoints = [];
    state.savedMeasurements = [];
    state.interactionEnabled = false;
}
