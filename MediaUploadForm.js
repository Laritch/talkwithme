import { useState, useRef } from 'react';

const MediaUploadForm = ({ formData, onChange }) => {
  const [thumbnailPreview, setThumbnailPreview] = useState(formData.thumbnail ? URL.createObjectURL(formData.thumbnail) : null);
  const [videoPreview, setVideoPreview] = useState(formData.promotionalVideo ? URL.createObjectURL(formData.promotionalVideo) : null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState({ thumbnail: false, video: false });

  const thumbnailInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrors({
        ...errors,
        thumbnail: 'Please upload a valid image file (JPEG, PNG)'
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({
        ...errors,
        thumbnail: 'Image size should be less than 2MB'
      });
      return;
    }

    // Clear previous error
    if (errors.thumbnail) {
      setErrors({
        ...errors,
        thumbnail: ''
      });
    }

    // Simulate upload
    setUploading({ ...uploading, thumbnail: true });

    // Update preview
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(URL.createObjectURL(file));

    // Simulate API upload delay
    setTimeout(() => {
      onChange({
        ...formData,
        thumbnail: file
      });
      setUploading({ ...uploading, thumbnail: false });
    }, 1000);
  };

  // Handle promotional video upload
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setErrors({
        ...errors,
        video: 'Please upload a valid video file (MP4, MOV, AVI)'
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setErrors({
        ...errors,
        video: 'Video size should be less than 50MB'
      });
      return;
    }

    // Clear previous error
    if (errors.video) {
      setErrors({
        ...errors,
        video: ''
      });
    }

    // Simulate upload
    setUploading({ ...uploading, video: true });

    // Update preview
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(URL.createObjectURL(file));

    // Simulate API upload delay
    setTimeout(() => {
      onChange({
        ...formData,
        promotionalVideo: file
      });
      setUploading({ ...uploading, video: false });
    }, 2000);
  };

  // Handle removing thumbnail
  const handleRemoveThumbnail = () => {
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailPreview(null);

    onChange({
      ...formData,
      thumbnail: null
    });
  };

  // Handle removing video
  const handleRemoveVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);

    onChange({
      ...formData,
      promotionalVideo: null
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Course Media</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add visual elements to your course to attract and engage students.
        </p>
      </div>

      {/* Course Thumbnail */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Thumbnail <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a high-quality image that represents your course. Recommended size: 1280x720 pixels (16:9 ratio).
        </p>

        <div className="mt-3">
          {thumbnailPreview ? (
            <div className="relative">
              <img
                src={thumbnailPreview}
                alt="Course thumbnail preview"
                className="mt-2 max-w-full h-auto rounded-lg max-h-60 object-cover"
              />

              {uploading.thumbnail ? (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white">Uploading...</div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none"
                  aria-label="Remove thumbnail"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="thumbnail-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input
                        id="thumbnail-upload"
                        name="thumbnail-upload"
                        type="file"
                        className="sr-only"
                        ref={thumbnailInputRef}
                        onChange={handleThumbnailChange}
                        accept="image/jpeg,image/png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>

              {errors.thumbnail && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.thumbnail}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Promotional Video */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Promotional Video (Optional)
        </label>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Add a short video that gives students a preview of your course. Recommended length: 1-3 minutes.
        </p>

        <div className="mt-3">
          {videoPreview ? (
            <div className="relative">
              <video
                src={videoPreview}
                controls
                className="mt-2 max-w-full h-auto rounded-lg"
              />

              {uploading.video ? (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white">Uploading video...</div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none"
                  aria-label="Remove video"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label
                      htmlFor="video-upload"
                      className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                    >
                      <span>Upload a video</span>
                      <input
                        id="video-upload"
                        name="video-upload"
                        type="file"
                        className="sr-only"
                        ref={videoInputRef}
                        onChange={handleVideoChange}
                        accept="video/mp4,video/quicktime,video/x-msvideo"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP4, MOV, AVI up to 50MB
                  </p>
                </div>
              </div>

              {errors.video && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.video}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Tips for Course Media</h4>
        <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Use high-quality, well-lit images that clearly represent your course content.</li>
          <li>Your thumbnail should be engaging and include text that describes your course.</li>
          <li>For promotional videos, introduce yourself, explain what the course covers, and why students should take it.</li>
          <li>Speak clearly and enthusiastically in your promotional video.</li>
          <li>Avoid too many words on your thumbnail image – keep it clean and readable.</li>
        </ul>
      </div>
    </div>
  );
};

export default MediaUploadForm;
