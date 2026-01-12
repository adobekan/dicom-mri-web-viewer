// ============================================================================
// MRI DICOM Viewer - Main Entry Point
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import { dicomImage } from './src/domElements.js';
import { setupFileUploadListeners } from './src/dicomLoader.js';
import { setupSeriesNavigationListeners } from './src/seriesManager.js';
import { setupKeyboardListener } from './src/imageInteraction.js';
import { setupMeasurementListeners } from './src/measurements.js';
import { setupViewControlListeners } from './src/viewControls.js';
import { setupExportListener } from './src/uiHelpers.js';

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

// Initialize cornerstone WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneWADOImageLoader.configure({ useWebWorkers: false });

// Enable cornerstone on the canvas element
cornerstone.enable(dicomImage);

// ============================================================================
// SETUP EVENT LISTENERS
// ============================================================================

function initializeApp() {
    setupFileUploadListeners();
    setupSeriesNavigationListeners();
    setupKeyboardListener();
    setupMeasurementListeners();
    setupViewControlListeners();
    setupExportListener();
    
    console.log('MRI DICOM Viewer initialized successfully');
}

// Initialize the application
initializeApp();