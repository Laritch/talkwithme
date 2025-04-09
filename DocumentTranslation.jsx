import React, { useState, useRef } from 'react';
import { translateText, LANGUAGES } from '../i18n/TranslationService';
import './DocumentTranslation.css';

/**
 * DocumentTranslation Component
 *
 * Allows users to upload and translate documents in various formats (PDF, DOCX, TXT)
 * Extracts text, translates it, and generates a downloadable translated version
 */
const DocumentTranslation = () => {
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('fr');
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translating, setTranslating] = useState(false);
  const [status, setStatus] = useState('');
  const [processedText, setProcessedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [translatedDocument, setTranslatedDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Accept file upload
  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();

    // Check if file format is supported
    if (!['pdf', 'docx', 'doc', 'txt', 'rtf', 'md'].includes(fileExtension)) {
      setStatus('Error: Unsupported file format. Please upload PDF, DOCX, TXT, RTF, or MD files.');
      return;
    }

    setFile(uploadedFile);
    setFileType(fileExtension);
    setStatus(`File loaded: ${uploadedFile.name}`);
    setTranslatedDocument(null);
    setProcessedText('');
    setTranslatedText('');
    setShowPreview(false);
  };

  // Extract text from file
  const extractTextFromFile = async (file) => {
    try {
      setStatus('Extracting text from document...');
      const formData = new FormData();
      formData.append('file', file);

      // For demo purposes, we'll simulate text extraction
      // In a real app, you would send the file to a backend service
      // that would use libraries like pdf.js, mammoth.js or similar
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

      // Simulate extracted text based on file type
      let extractedText;
      if (file.type.includes('pdf')) {
        extractedText = `This is simulated text extracted from a PDF document: ${file.name}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed euismod, nisl eget ultricies ultricies, nunc nisl ultricies nunc, eget ultricies nisl nisl eget ultricies.\n\nPellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`;
      } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        extractedText = `This is simulated text extracted from a Word document: ${file.name}.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Sed euismod, nisl eget ultricies ultricies, nunc nisl ultricies nunc, eget ultricies nisl nisl eget ultricies.\n\nPellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.`;
      } else {
        // For text files, read actual content
        const text = await file.text();
        extractedText = text;
      }

      setProcessedText(extractedText);
      setStatus('Text extracted successfully!');
      return extractedText;
    } catch (error) {
      console.error('Error extracting text:', error);
      setStatus('Error extracting text from document. Please try another file.');
      return null;
    }
  };

  // Handle document translation process
  const handleTranslateDocument = async () => {
    if (!file) {
      setStatus('Please upload a document first.');
      return;
    }

    setTranslating(true);
    setTranslationProgress(0);

    try {
      // Extract text if not already extracted
      let textToTranslate = processedText;
      if (!textToTranslate) {
        textToTranslate = await extractTextFromFile(file);
        if (!textToTranslate) {
          setTranslating(false);
          return;
        }
      }

      // Split text into paragraphs for progressive translation
      const paragraphs = textToTranslate.split('\n').filter(p => p.trim());
      let translatedParagraphs = [];

      // Translate each paragraph
      for (let i = 0; i < paragraphs.length; i++) {
        const result = await translateText(paragraphs[i], targetLanguage, sourceLanguage);
        translatedParagraphs.push(result.text);

        // Update progress
        const progress = Math.round(((i + 1) / paragraphs.length) * 100);
        setTranslationProgress(progress);
      }

      // Join translated paragraphs
      const fullTranslatedText = translatedParagraphs.join('\n');
      setTranslatedText(fullTranslatedText);

      // Generate a downloadable document
      generateTranslatedDocument(fullTranslatedText);

      setStatus('Document translation completed successfully!');
      setShowPreview(true);
    } catch (error) {
      console.error('Translation error:', error);
      setStatus('Error translating document. Please try again.');
    } finally {
      setTranslating(false);
      setTranslationProgress(100);
    }
  };

  // Generate a downloadable document
  const generateTranslatedDocument = (translatedText) => {
    let blob;
    let fileName;

    const originalFileName = file.name.split('.')[0];

    // Create different file types based on input type
    if (fileType === 'txt' || fileType === 'md') {
      // For text files, just create a text blob
      blob = new Blob([translatedText], { type: 'text/plain' });
      fileName = `${originalFileName}_${targetLanguage}.txt`;
    } else {
      // For other formats, create an HTML file that simulates the document
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Translated Document</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            .document-header { text-align: center; margin-bottom: 20px; }
            .document-content { white-space: pre-wrap; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="document-header">
            <h1>Translated Document</h1>
            <p>Original: ${file.name} | Target Language: ${LANGUAGES[targetLanguage]?.name || targetLanguage}</p>
          </div>
          <div class="document-content">${translatedText.replace(/\n/g, '<br>')}</div>
          <div class="footer">
            Translated using MultiLingua Translation Tool
          </div>
        </body>
        </html>
      `;

      blob = new Blob([htmlContent], { type: 'text/html' });
      fileName = `${originalFileName}_${targetLanguage}.html`;
    }

    const url = URL.createObjectURL(blob);
    setTranslatedDocument({ url, fileName });
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setFileType('');
    setTranslationProgress(0);
    setStatus('');
    setProcessedText('');
    setTranslatedText('');
    setTranslatedDocument(null);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="document-translation">
      <h2 className="document-translation-title">Document Translation</h2>
      <p className="document-translation-description">
        Upload and translate documents in various formats (PDF, DOCX, TXT, etc.)
      </p>

      {status && (
        <div className={`status-message ${status.includes('Error') ? 'error' : status.includes('completed') ? 'success' : 'info'}`}>
          {status}
        </div>
      )}

      <div className="document-settings">
        <div className="language-selector">
          <div className="language-select">
            <label>Source Language</label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              disabled={translating}
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="language-direction">→</div>

          <div className="language-select">
            <label>Target Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              disabled={translating}
            >
              {Object.entries(LANGUAGES)
                .filter(([code]) => code !== sourceLanguage)
                .map(([code, lang]) => (
                  <option key={code} value={code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="file-upload-container">
          <label className="file-upload-label">
            <span>Select Document</span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.rtf,.md"
              disabled={translating}
            />
          </label>

          {file && (
            <div className="file-info">
              <div className="file-name">{file.name}</div>
              <div className="file-size">{(file.size / 1024).toFixed(2)} KB</div>
            </div>
          )}
        </div>
      </div>

      <div className="document-actions">
        <button
          className="translate-btn"
          onClick={handleTranslateDocument}
          disabled={!file || translating}
        >
          {translating ? 'Translating...' : 'Translate Document'}
        </button>

        <button
          className="reset-btn"
          onClick={handleReset}
          disabled={translating}
        >
          Reset
        </button>
      </div>

      {translating && (
        <div className="translation-progress">
          <div className="progress-label">Translating document: {translationProgress}%</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${translationProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {(showPreview && translatedText) && (
        <div className="document-preview">
          <h3>Translation Preview</h3>
          <div className="preview-toggle">
            <button
              className={!showPreview ? 'active' : ''}
              onClick={() => setShowPreview(false)}
            >
              Hide Preview
            </button>
            <button
              className={showPreview ? 'active' : ''}
              onClick={() => setShowPreview(true)}
            >
              Show Preview
            </button>
          </div>
          <div className="preview-content">
            <pre>{translatedText}</pre>
          </div>
        </div>
      )}

      {translatedDocument && (
        <div className="download-section">
          <h3>Download Translated Document</h3>
          <p>Your document has been translated and is ready for download.</p>
          <a
            href={translatedDocument.url}
            download={translatedDocument.fileName}
            className="download-btn"
          >
            Download Translated Document
          </a>
          <p className="download-note">
            Note: For PDF and DOCX files, this is a simplified HTML version of the translated content.
            For a more accurate conversion, consider using our premium service.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentTranslation;
