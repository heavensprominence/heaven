import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import DashboardSidebar from '../components/DashboardSidebar';
import './BulkImport.css';

const BulkImport = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem('token');
    const fileInputRef = useRef(null);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [results, setResults] = useState(null);
    const [validation, setValidation] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.endsWith('.csv')) {
            setFile(droppedFile);
            setValidation(null);
            setResults(null);
        } else {
            alert('Please upload a CSV file');
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setValidation(null);
            setResults(null);
        }
    };

    const handleValidate = async () => {
        if (!file) return;
        
        setValidating(true);
        const formData = new FormData();
        formData.append('csvFile', file);
        
        try {
            const res = await axios.post('/api/shop/bulk/validate', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setValidation(res.data);
        } catch (err) {
            alert('Validation failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setValidating(false);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        const formData = new FormData();
        formData.append('csvFile', file);
        
        try {
            const res = await axios.post('/api/shop/bulk/upload', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data.results);
            setFile(null);
            fileInputRef.current.value = '';
        } catch (err) {
            alert('Upload failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = async () => {
        try {
            const res = await axios.get('/api/shop/bulk/template', {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bulk_listing_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download template');
        }
    };

    return (
        <div className="dashboard-with-sidebar">
            <DashboardSidebar type="seller" />
            <div className="dashboard-content">
                <div className="bulk-import">
                    <h1>📦 Bulk Listing Import</h1>
                <Link to="/seller/dashboard" className="back-link">← Back to Posts Dashboard</Link>
                    <p className="subtitle">Upload multiple listings at once using a CSV file</p>
                    
                    <div className="template-section">
                        <button onClick={downloadTemplate} className="template-btn">
                            📥 Download CSV Template
                        </button>
                        <p className="hint">Use this template to format your listings correctly</p>
                    </div>
                    
                    <div className="csv-format-info">
                        <h3>CSV Format Instructions</h3>
                        <table className="format-table">
                            <thead>
                                <tr><th>Column</th><th>Description</th><th>Example</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>type</td><td>mall, classifieds, auction, procurement</td><td>mall</td></tr>
                                <tr><td>title</td><td>Listing title (required)</td><td>Vintage Watch</td></tr>
                                <tr><td>description</td><td>Item description</td><td>Excellent condition...</td></tr>
                                <tr><td>category</td><td>Category slug</td><td>electronics</td></tr>
                                <tr><td>price</td><td>Price in dollars</td><td>99.99</td></tr>
                                <tr><td>quantity</td><td>Quantity available</td><td>5</td></tr>
                                <tr><td>duration</td><td>1day, 2weeks, 1year, forever</td><td>2weeks</td></tr>
                                <tr><td>store_name</td><td>Your store name (optional)</td><td>MyStore</td></tr>
                                <tr><td>allow_pickup</td><td>yes/no</td><td>yes</td></tr>
                                <tr><td>pickup_address</td><td>Street address for pickup</td><td>123 Main St</td></tr>
                                <tr><td>pickup_city</td><td>City</td><td>Toronto</td></tr>
                                <tr><td>pickup_state</td><td>State/Province</td><td>ON</td></tr>
                                <tr><td>pickup_zip</td><td>Postal code</td><td>M5V2T6</td></tr>
                                <tr><td>pickup_country</td><td>Country code</td><td>CA</td></tr>
                                <tr><td>location_city</td><td>Item location city</td><td>Toronto</td></tr>
                                <tr><td>location_state</td><td>Item location state</td><td>ON</td></tr>
                                <tr><td>location_country</td><td>Item location country</td><td>CA</td></tr>
                                <tr><td>weight_oz</td><td>Weight in ounces</td><td>16</td></tr>
                                <tr><td>length/width/height</td><td>Dimensions in inches</td><td>12</td></tr>
                                <tr><td>images</td>
                        <td>Comma-separated image URLs (Imgur, Google Drive, etc)</td>
                        <td>url1,url2</td>
                    </tr>
                    <tr>
                        <td>language_code</td>
                        <td>ISO language code (en, es, fr, etc.) - optional, auto-detected if blank</td>
                        <td>en</td>
                    </tr>
                    <tr>
                        <td>images</td>
                        <td>Comma-separated URLs (Imgur, Google Drive, etc.)</td>
                        <td>url1,url2</td></tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div 
                        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="upload-label">
                            <span className="upload-icon">📁</span>
                            <span>{file ? file.name : 'Click or drag CSV file here'}</span>
                        </label>
                        {file && <p className="file-size">Size: {(file.size / 1024).toFixed(2)} KB</p>}
                    </div>
                    
                    {file && (
                        <div className="action-buttons">
                            <button 
                                onClick={handleValidate} 
                                disabled={validating || uploading}
                                className="validate-btn"
                            >
                                {validating ? 'Validating...' : '🔍 Validate CSV'}
                            </button>
                            <button 
                                onClick={handleUpload} 
                                disabled={uploading || validating}
                                className="upload-btn"
                            >
                                {uploading ? 'Uploading...' : '📤 Upload Listings'}
                            </button>
                        </div>
                    )}
                    
                    {validation && (
                        <div className={`validation-result ${validation.valid ? 'valid' : 'invalid'}`}>
                            <h3>Validation Results</h3>
                            <p>Rows found: {validation.rowCount}</p>
                            {validation.warnings.length > 0 ? (
                                <ul className="warnings-list">
                                    {validation.warnings.slice(0, 10).map((w, i) => (
                                        <li key={i}>{w}</li>
                                    ))}
                                    {validation.warnings.length > 10 && (
                                        <li>...and {validation.warnings.length - 10} more</li>
                                    )}
                                </ul>
                            ) : (
                                <p className="success">✅ CSV is valid and ready to upload!</p>
                            )}
                        </div>
                    )}
                    
                    {results && (
                        <div className="upload-results">
                            <h3>Upload Results</h3>
                            <div className="results-stats">
                                <div className="stat">Total: {results.total}</div>
                                <div className="stat success">Success: {results.success}</div>
                                <div className="stat failed">Failed: {results.failed}</div>
                            </div>
                            {results.errors.length > 0 && (
                                <div className="errors-list">
                                    <h4>Errors:</h4>
                                    <ul>
                                        {results.errors.map((e, i) => (
                                            <li key={i}>Row {e.row}: {e.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {results.success > 0 && (
                                <p className="success-message">
                                    ✅ {results.success} listings imported successfully! 
                                    <Link to="/seller/dashboard">View in Dashboard →</Link>
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkImport;
