import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourseDetails, setCourseProgress } from '../../store/slices/coursesSlice';
import VideoPlayer from '../../components/video/VideoPlayer';

const CoursePlayer = ({ courseId }) => {
  const dispatch = useDispatch();
  const course = useSelector((state) => state.courses.currentCourse);
  const loading = useSelector((state) => state.courses.loading);
  const error = useSelector((state) => state.courses.error);

  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
  const [currentSectionIndex, setSectionIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [playerExpanded, setPlayerExpanded] = useState(false);

  // Fetch course details if not already loaded
  useEffect(() => {
    if (courseId && (!course || course.id !== courseId)) {
      dispatch(fetchCourseDetails(courseId));
    }
  }, [courseId, course, dispatch]);

  // Find the current lecture and section
  const currentSection = course?.sections?.[currentSectionIndex] || null;
  const currentLecture = currentSection?.lectures?.[currentLectureIndex] || null;

  // Handle video progress updates
  const handleTimeUpdate = (currentTime, duration) => {
    if (!currentLecture || !duration) return;

    const progress = Math.floor((currentTime / duration) * 100);
    setVideoProgress(progress);

    // Save progress to Redux every 10 seconds
    if (currentTime % 10 < 1) {
      saveCourseProgress(progress, currentTime);
    }
  };

  // Save course progress
  const saveCourseProgress = (progress, position) => {
    if (!course || !currentLecture) return;

    dispatch(
      setCourseProgress({
        courseId: course.id,
        progress,
        lastPosition: {
          sectionIndex: currentSectionIndex,
          lectureIndex: currentLectureIndex,
          position: position,
        },
      })
    );

    // In a real app, we would also save to the backend
    // saveProgressToBackend(course.id, currentLecture.id, progress, position);
  };

  // Handle video end
  const handleVideoEnded = () => {
    // Auto-advance to next lecture
    const nextLectureIndex = currentLectureIndex + 1;

    if (currentSection.lectures.length > nextLectureIndex) {
      // Move to next lecture in current section
      setCurrentLectureIndex(nextLectureIndex);
    } else {
      // Move to first lecture of next section
      const nextSectionIndex = currentSectionIndex + 1;

      if (course.sections.length > nextSectionIndex) {
        setSectionIndex(nextSectionIndex);
        setCurrentLectureIndex(0);
      } else {
        // Course completed
        saveCourseProgress(100, 0);
        // Show course completion UI
      }
    }
  };

  // Handle manual navigation to a lecture
  const navigateToLecture = (sectionIndex, lectureIndex) => {
    setSectionIndex(sectionIndex);
    setCurrentLectureIndex(lectureIndex);

    // Save the current progress before switching
    saveCourseProgress(videoProgress, 0);
  };

  // Toggle player expanded state
  const togglePlayerExpanded = () => {
    setPlayerExpanded(!playerExpanded);
  };

  if (loading) {
    return <div className="course-player-loading">Loading course content...</div>;
  }

  if (error) {
    return <div className="course-player-error">Error: {error}</div>;
  }

  if (!course) {
    return <div className="course-player-not-found">Course not found</div>;
  }

  return (
    <div className={`course-player ${playerExpanded ? 'expanded' : ''}`}>
      <div className="course-player-main">
        <div className="video-container">
          {currentLecture?.videoUrl ? (
            <VideoPlayer
              src={currentLecture.videoUrl}
              poster={currentLecture.thumbnail || course.thumbnail}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              startTime={course.lastPosition?.position || 0}
              className="main-player"
            />
          ) : (
            <div className="video-placeholder">
              No video available for this lecture
            </div>
          )}

          <button
            className="expand-button"
            onClick={togglePlayerExpanded}
            aria-label={playerExpanded ? 'Minimize player' : 'Maximize player'}
          >
            {playerExpanded ? 'Minimize' : 'Maximize'}
          </button>
        </div>

        <div className="lecture-info">
          <h2 className="lecture-title">{currentLecture?.title}</h2>
          <div className="lecture-progress">
            <div
              className="progress-bar"
              style={{ width: `${videoProgress}%` }}
              aria-valuenow={videoProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            />
            <span className="progress-text">{videoProgress}% complete</span>
          </div>
          <div className="lecture-description">
            {currentLecture?.description}
          </div>
        </div>
      </div>

      {!playerExpanded && (
        <div className="course-content-sidebar">
          <h3 className="content-title">Course Content</h3>
          <div className="sections-list">
            {course.sections.map((section, sIndex) => (
              <div
                key={`section-${sIndex}`}
                className={`course-section ${currentSectionIndex === sIndex ? 'active' : ''}`}
              >
                <div className="section-header">
                  <h4 className="section-title">{section.title}</h4>
                  <span className="section-lectures-count">
                    {section.lectures.length} lectures
                  </span>
                </div>

                <div className="section-lectures">
                  {section.lectures.map((lecture, lIndex) => (
                    <div
                      key={`lecture-${sIndex}-${lIndex}`}
                      className={`course-lecture ${
                        currentSectionIndex === sIndex &&
                        currentLectureIndex === lIndex
                          ? 'active'
                          : ''
                      }`}
                      onClick={() => navigateToLecture(sIndex, lIndex)}
                    >
                      <span className="lecture-icon">
                        {lecture.type === 'video' ? '📹' : '📄'}
                      </span>
                      <span className="lecture-title">
                        {lecture.title}
                      </span>
                      <span className="lecture-duration">
                        {lecture.duration}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
