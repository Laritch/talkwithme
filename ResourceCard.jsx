import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import './ResourceCard.css';

/**
 * ResourceCard Component
 *
 * Displays a resource card with translated content
 */
const ResourceCard = ({ resource }) => {
  const { translate, currentLanguage } = useLanguage();
  const [translatedTitle, setTranslatedTitle] = useState(resource.title);
  const [translatedDescription, setTranslatedDescription] = useState(resource.description);
  const [translatedTags, setTranslatedTags] = useState(resource.tags || []);
  const [translatedViewBtn, setTranslatedViewBtn] = useState('View');
  const [translatedDownloadBtn, setTranslatedDownloadBtn] = useState('Download');
  const [isLoading, setIsLoading] = useState(false);

  // Translate content when language changes
  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage === 'en') {
        // No need to translate if language is English (assuming original is English)
        setTranslatedTitle(resource.title);
        setTranslatedDescription(resource.description);
        setTranslatedTags(resource.tags || []);
        setTranslatedViewBtn('View');
        setTranslatedDownloadBtn('Download');
        return;
      }

      setIsLoading(true);

      try {
        // Translate title, description, and button text
        const [title, description, viewBtn, downloadBtn] = await Promise.all([
          translate(resource.title),
          translate(resource.description),
          translate('View'),
          translate('Download')
        ]);

        setTranslatedTitle(title);
        setTranslatedDescription(description);
        setTranslatedViewBtn(viewBtn);
        setTranslatedDownloadBtn(downloadBtn);

        // Translate tags if they exist
        if (resource.tags && resource.tags.length > 0) {
          const translatedTagsPromises = resource.tags.map(tag => translate(tag));
          const translatedTagsResult = await Promise.all(translatedTagsPromises);
          setTranslatedTags(translatedTagsResult);
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Fallback to original content on error
        setTranslatedTitle(resource.title);
        setTranslatedDescription(resource.description);
        setTranslatedTags(resource.tags || []);
        setTranslatedViewBtn('View');
        setTranslatedDownloadBtn('Download');
      } finally {
        setIsLoading(false);
      }
    };

    translateContent();
  }, [resource, translate, currentLanguage]);

  // Format date based on current language
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(currentLanguage, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className={`resource-card ${isLoading ? 'loading' : ''}`}>
      {isLoading && <div className="loading-indicator">Translating...</div>}

      <div className="resource-card-header">
        <h3 className="resource-title">{translatedTitle}</h3>
        <div className="resource-type">{resource.type}</div>
      </div>

      <p className="resource-description">{translatedDescription}</p>

      {translatedTags.length > 0 && (
        <div className="resource-tags">
          {translatedTags.map((tag, index) => (
            <span key={index} className="resource-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="resource-footer">
        <div className="resource-author">{resource.author}</div>
        <div className="resource-date">{formatDate(resource.date)}</div>
      </div>

      <div className="resource-actions">
        <button className="resource-action-btn primary">
          {translatedViewBtn}
        </button>
        <button className="resource-action-btn">
          {translatedDownloadBtn}
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
