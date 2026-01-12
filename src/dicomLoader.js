// ============================================================================
// DICOM File Loading and Parsing
// ============================================================================

import * as cornerstone from 'cornerstone-core';
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import * as dicomParser from 'dicom-parser';
import { state } from './state.js';
import { 
    fileInput, folderInput, dicomImage, loading, 
    controls, imageInfo, seriesInfo, seriesSelect 
} from './domElements.js';
import { displayMetadata, displayStudyInfo } from './metadata.js';
import { loadSeries } from './seriesManager.js';
import { enableImageInteractionOnce } from './imageInteraction.js';
import { showLoading, hideLoading, hideAllInfo } from './uiHelpers.js';

export async function handleSingleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    showLoading();
    hideAllInfo();

    try {
        const arrayBuffer = await file.arrayBuffer();
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);
        
        displayMetadata(dataSet);
        
        const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
        const image = await cornerstone.loadImage(imageId);
        cornerstone.displayImage(dicomImage, image);
        
        controls.style.display = 'flex';
        imageInfo.style.display = 'block';
        
        enableImageInteractionOnce();
        
    } catch (error) {
        console.error('Error loading DICOM file:', error);
        alert('Error loading DICOM file. Please make sure the file is a valid DICOM (.dcm) file.');
    } finally {
        hideLoading();
    }
}

export async function handleFolderUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    showLoading();
    hideAllInfo();

    try {
        // Clear previous data
        state.studySeriesMap.clear();
        seriesSelect.innerHTML = '';
        
        // Filter DICOM files
        const dcmFiles = files.filter(file => file.name.toLowerCase().endsWith('.dcm'));
        
        if (dcmFiles.length === 0) {
            alert('No DICOM files found in the selected folder.');
            return;
        }

        // Process and organize files
        const fileDataArray = await Promise.all(dcmFiles.map(parseDicomFile));
        const validFiles = fileDataArray.filter(item => item !== null);
        
        // Group by series
        const seriesMap = groupFilesBySeries(validFiles);
        
        // Sort files within each series
        sortSeriesByInstanceNumber(seriesMap);
        
        // Load images and create image IDs
        await loadSeriesImages(seriesMap);
        
        // Display study metadata
        if (validFiles.length > 0) {
            displayStudyInfo(validFiles[0].dataSet);
        }
        
        // Populate series selector
        const firstSeries = populateSeriesSelector();
        
        // Load first series
        if (firstSeries) {
            seriesSelect.value = firstSeries;
            await loadSeries(firstSeries);
        }

        seriesInfo.style.display = 'block';
        controls.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading folder:', error);
        alert('Error loading DICOM files. Please check the console for details.');
    } finally {
        hideLoading();
    }
}

async function parseDicomFile(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);
        
        return {
            file,
            dataSet,
            seriesNumber: dataSet.string('x0020000e') || 'Unknown',
            seriesDescription: dataSet.string('x0008103e') || '',
            instanceNumber: parseInt(dataSet.string('x00200013') || '0'),
            path: file.webkitRelativePath || file.name
        };
    } catch (error) {
        console.error(`Error parsing ${file.name}:`, error);
        return null;
    }
}

function groupFilesBySeries(validFiles) {
    const seriesMap = new Map();
    
    validFiles.forEach(item => {
        if (!seriesMap.has(item.seriesNumber)) {
            seriesMap.set(item.seriesNumber, {
                description: item.seriesDescription,
                files: []
            });
        }
        seriesMap.get(item.seriesNumber).files.push(item);
    });
    
    return seriesMap;
}

function sortSeriesByInstanceNumber(seriesMap) {
    seriesMap.forEach(series => {
        series.files.sort((a, b) => a.instanceNumber - b.instanceNumber);
    });
}

async function loadSeriesImages(seriesMap) {
    for (const [seriesNumber, series] of seriesMap.entries()) {
        const imageIds = [];
        
        for (const item of series.files) {
            const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(item.file);
            imageIds.push({
                imageId,
                dataSet: item.dataSet,
                instanceNumber: item.instanceNumber
            });
        }
        
        state.studySeriesMap.set(seriesNumber, {
            description: series.description,
            images: imageIds
        });
    }
}

function populateSeriesSelector() {
    let firstSeries = null;
    let index = 1;
    
    for (const [seriesNumber, seriesData] of state.studySeriesMap.entries()) {
        const option = document.createElement('option');
        option.value = seriesNumber;
        option.textContent = `Series ${index} (${seriesData.images.length} slices)`;
        seriesSelect.appendChild(option);
        
        if (!firstSeries) firstSeries = seriesNumber;
        index++;
    }
    
    return firstSeries;
}

export function setupFileUploadListeners() {
    fileInput.addEventListener('change', handleSingleFile);
    folderInput.addEventListener('change', handleFolderUpload);
}
