// ============================================================================
// Metadata Display Functions
// ============================================================================

import { metaData, studyData } from './domElements.js';

export function displayStudyInfo(dataSet) {
    const studyMetadata = [
        { label: 'Patient Name', tag: 'x00100010' },
        { label: 'Patient ID', tag: 'x00100020' },
        { label: 'Study Date', tag: 'x00080020' },
        { label: 'Modality', tag: 'x00080060' },
        { label: 'Institution', tag: 'x00080080' },
    ];

    const html = studyMetadata.map(item => {
        try {
            const element = dataSet.elements[item.tag];
            if (element) {
                const value = dataSet.string(item.tag) || 'N/A';
                return `<div><strong>${item.label}:</strong> <span>${value}</span></div>`;
            }
        } catch (e) {
            return '';
        }
        return '';
    }).filter(Boolean).join('');

    studyData.innerHTML = html || '<div>No study information available</div>';
}

export function displayMetadata(dataSet) {
    const metadata = [
        { label: 'Instance Number', tag: 'x00200013' },
        { label: 'Rows', tag: 'x00280010' },
        { label: 'Columns', tag: 'x00280011' },
        { label: 'Slice Thickness', tag: 'x00180050' },
        { label: 'Slice Location', tag: 'x00201041' },
        { label: 'Image Position', tag: 'x00200032', format: formatImagePosition },
    ];

    let html = '';
    let imagePositionValue = null;
    
    metadata.forEach(item => {
        try {
            const element = dataSet.elements[item.tag];
            if (element) {
                let value = dataSet.string(item.tag) || 'N/A';
                
                if (item.tag === 'x00200032' && value !== 'N/A') {
                    imagePositionValue = value;
                }
                
                if (item.format && value !== 'N/A') {
                    value = item.format(value);
                }
                
                html += `<div><strong>${item.label}:</strong> <span>${value}</span></div>`;
            }
        } catch (e) {
            // Skip if tag doesn't exist
        }
    });
    
    if (imagePositionValue) {
        const interpretation = interpretImagePosition(imagePositionValue);
        html += `<div class="position-interpretation"><strong>Position Interpretation:</strong> <span>${interpretation}</span></div>`;
    }

    metaData.innerHTML = html || '<div>No metadata available</div>';
}

export function formatImagePosition(position) {
    const coords = position.split('\\');
    if (coords.length === 3) {
        const x = parseFloat(coords[0]).toFixed(2);
        const y = parseFloat(coords[1]).toFixed(2);
        const z = parseFloat(coords[2]).toFixed(2);
        return `X: ${x}, Y: ${y}, Z: ${z} mm`;
    }
    return position;
}

export function interpretImagePosition(position) {
    const coords = position.split('\\');
    if (coords.length !== 3) return 'Unable to interpret';
    
    const x = parseFloat(coords[0]);
    const y = parseFloat(coords[1]);
    const z = parseFloat(coords[2]);
    
    const interpretation = [];
    
    // X-axis (Left/Right)
    interpretation.push(Math.abs(x) > 1 ? (x < 0 ? "Patient's Left" : "Patient's Right") : "Center (L/R)");
    
    // Y-axis (Anterior/Posterior)
    interpretation.push(Math.abs(y) > 1 ? (y < 0 ? "Posterior (Back)" : "Anterior (Front)") : "Center (A/P)");
    
    // Z-axis (Inferior/Superior)
    interpretation.push(Math.abs(z) > 1 ? (z < 0 ? "Inferior (Feet)" : "Superior (Head)") : "Center (H/F)");
    
    return interpretation.join(' • ');
}

export function extractPixelSpacing(dataSet, state) {
    try {
        const spacingStr = dataSet.string('x00280030');
        if (spacingStr) {
            const spacing = spacingStr.split('\\').map(parseFloat);
            if (spacing.length === 2) {
                state.pixelSpacing = spacing;
                return;
            }
        }
    } catch (e) {
        // Use default if not available
    }
    state.pixelSpacing = [1, 1];
}
