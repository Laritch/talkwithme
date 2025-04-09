import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const CurriculumBuilder = ({ curriculum, onChange }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [activeLecture, setActiveLecture] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [newLectureType, setNewLectureType] = useState('video');
  const [newLectureContent, setNewLectureContent] = useState('');

  // Add a new section
  const addSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection = {
      id: `section-${uuidv4()}`,
      title: newSectionTitle,
      description: '',
      lectures: []
    };

    onChange({
      ...curriculum,
      sections: [...curriculum.sections, newSection]
    });

    setNewSectionTitle('');
    setActiveSection(newSection.id);
  };

  // Add a new lecture to a section
  const addLecture = (sectionId) => {
    if (!newLectureTitle.trim()) return;

    const newLecture = {
      id: `lecture-${uuidv4()}`,
      title: newLectureTitle,
      description: '',
      type: newLectureType,
      content: newLectureContent,
      duration: 0,
      isPublished: false
    };

    const updatedSections = curriculum.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lectures: [...section.lectures, newLecture]
        };
      }
      return section;
    });

    onChange({
      ...curriculum,
      sections: updatedSections
    });

    setNewLectureTitle('');
    setNewLectureType('video');
    setNewLectureContent('');
    setActiveLecture(newLecture.id);
  };

  // Delete a section
  const deleteSection = (sectionId) => {
    const updatedSections = curriculum.sections.filter(section => section.id !== sectionId);

    onChange({
      ...curriculum,
      sections: updatedSections
    });

    if (activeSection === sectionId) {
      setActiveSection(null);
    }
  };

  // Delete a lecture
  const deleteLecture = (sectionId, lectureId) => {
    const updatedSections = curriculum.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lectures: section.lectures.filter(lecture => lecture.id !== lectureId)
        };
      }
      return section;
    });

    onChange({
      ...curriculum,
      sections: updatedSections
    });

    if (activeLecture === lectureId) {
      setActiveLecture(null);
    }
  };

  // Update section title
  const updateSectionTitle = (sectionId, title) => {
    const updatedSections = curriculum.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          title
        };
      }
      return section;
    });

    onChange({
      ...curriculum,
      sections: updatedSections
    });

    setEditingSection(null);
  };

  // Update lecture title
  const updateLectureTitle = (sectionId, lectureId, title) => {
    const updatedSections = curriculum.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          lectures: section.lectures.map(lecture => {
            if (lecture.id === lectureId) {
              return {
                ...lecture,
                title
              };
            }
            return lecture;
          })
        };
      }
      return section;
    });

    onChange({
      ...curriculum,
      sections: updatedSections
    });

    setEditingLecture(null);
  };

  // Move section up
  const moveSectionUp = (index) => {
    if (index === 0) return;

    const newSections = [...curriculum.sections];
    const temp = newSections[index];
    newSections[index] = newSections[index - 1];
    newSections[index - 1] = temp;

    onChange({
      ...curriculum,
      sections: newSections
    });
  };

  // Move section down
  const moveSectionDown = (index) => {
    if (index === curriculum.sections.length - 1) return;

    const newSections = [...curriculum.sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + 1];
    newSections[index + 1] = temp;

    onChange({
      ...curriculum,
      sections: newSections
    });
  };

  // Move lecture up
  const moveLectureUp = (sectionId, lectureIndex) => {
    if (lectureIndex === 0) return;

    const updatedSections = curriculum.sections.map(section => {
      if (section.id === sectionId) {
        const newLectures = [...section.lectures];
        const temp = newLectures[lectureIndex];
        newLectures[lectureIndex] = newLectures[lectureIndex - 1];
        newLectures[lectureIndex - 1] = temp;

        return {
          ...section,
          lectures: newLectures
        };
      }
      return section;
    });

    onChange({
      ...curriculum,
      sections: updatedSections
    });
  };

  // Move lecture down
  const moveLectureDown = (sectionId, lectureIndex) => {
    const section = curriculum.sections.find(s => s.id === sectionId);
    if (lectureIndex === section.lectures.length - 1) return;

    const updatedSections = curriculum.sections.map(section => {
      if (section.id === sectionId) {
        const newLectures = [...section.lectures];
        const temp = newLectures[lectureIndex];
        newLectures[lectureIndex] = newLectures[lectureIndex + 1];
        newLectures[lectureIndex + 1] = temp;

        return {
          ...section,
          lectures: newLectures
        };
      }
      return section;
    });

    onChange({
      ...curriculum,
      sections: updatedSections
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Course Curriculum</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Organize your course content into sections and lectures.
        </p>
      </div>

      {/* Course sections */}
      <div className="space-y-4">
        {curriculum.sections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Section Header */}
            <div
              className={`px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 cursor-pointer ${
                activeSection === section.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
            >
              <div className="flex-1">
                {editingSection === section.id ? (
                  <input
                    type="text"
                    className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                    value={section.title}
                    onChange={(e) => {
                      const updatedSections = curriculum.sections.map(s => {
                        if (s.id === section.id) {
                          return { ...s, title: e.target.value };
                        }
                        return s;
                      });
                      onChange({ ...curriculum, sections: updatedSections });
                    }}
                    onBlur={() => setEditingSection(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateSectionTitle(section.id, e.target.value);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      Section {sectionIndex + 1}:
                    </span>
                    <span
                      className="ml-2 text-gray-800 dark:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSection(section.id);
                      }}
                    >
                      {section.title}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSectionUp(sectionIndex);
                  }}
                  disabled={sectionIndex === 0}
                  className={`p-1 rounded-full ${
                    sectionIndex === 0
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Move section up"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSectionDown(sectionIndex);
                  }}
                  disabled={sectionIndex === curriculum.sections.length - 1}
                  className={`p-1 rounded-full ${
                    sectionIndex === curriculum.sections.length - 1
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Move section down"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${section.title}"?`)) {
                      deleteSection(section.id);
                    }
                  }}
                  className="p-1 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                  aria-label="Delete section"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Section Content (Lectures) */}
            {activeSection === section.id && (
              <div className="p-4">
                {section.lectures.length > 0 ? (
                  <ul className="space-y-3 mb-4">
                    {section.lectures.map((lecture, lectureIndex) => (
                      <li
                        key={lecture.id}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                      >
                        <div className="flex items-center flex-1">
                          <span className="w-6 text-gray-500 dark:text-gray-400">{lectureIndex + 1}.</span>
                          {editingLecture === lecture.id ? (
                            <input
                              type="text"
                              className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                              value={lecture.title}
                              onChange={(e) => {
                                const updatedSections = curriculum.sections.map(s => {
                                  if (s.id === section.id) {
                                    return {
                                      ...s,
                                      lectures: s.lectures.map(l => {
                                        if (l.id === lecture.id) {
                                          return { ...l, title: e.target.value };
                                        }
                                        return l;
                                      })
                                    };
                                  }
                                  return s;
                                });
                                onChange({ ...curriculum, sections: updatedSections });
                              }}
                              onBlur={() => setEditingLecture(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateLectureTitle(section.id, lecture.id, e.target.value);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <div className="flex items-center flex-1">
                              <span
                                className="ml-2 text-gray-800 dark:text-gray-200 flex-1"
                                onClick={() => setEditingLecture(lecture.id)}
                              >
                                {lecture.title}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {lecture.type === 'video' ? '📹' : lecture.type === 'quiz' ? '📝' : '📄'}
                                {lecture.type.charAt(0).toUpperCase() + lecture.type.slice(1)}
                                {lecture.duration > 0 && ` (${Math.floor(lecture.duration / 60)}:${String(lecture.duration % 60).padStart(2, '0')})`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-2">
                          <button
                            type="button"
                            onClick={() => moveLectureUp(section.id, lectureIndex)}
                            disabled={lectureIndex === 0}
                            className={`p-1 rounded-full ${
                              lectureIndex === 0
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            aria-label="Move lecture up"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => moveLectureDown(section.id, lectureIndex)}
                            disabled={lectureIndex === section.lectures.length - 1}
                            className={`p-1 rounded-full ${
                              lectureIndex === section.lectures.length - 1
                                ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            aria-label="Move lecture down"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${lecture.title}"?`)) {
                                deleteLecture(section.id, lecture.id);
                              }
                            }}
                            className="p-1 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20"
                            aria-label="Delete lecture"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
                    No lectures in this section. Add your first lecture below.
                  </p>
                )}

                {/* Add Lecture Form */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    placeholder="New lecture title"
                    value={newLectureTitle}
                    onChange={(e) => setNewLectureTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <select
                    value={newLectureType}
                    onChange={(e) => setNewLectureType(e.target.value)}
                    className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="quiz">Quiz</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => addLecture(section.id)}
                    disabled={!newLectureTitle.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add Lecture
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section Form */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="New section title"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
        />

        <button
          type="button"
          onClick={addSection}
          disabled={!newSectionTitle.trim()}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Add Section
        </button>
      </div>

      {/* Curriculum Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Tips for Course Curriculum</h4>
        <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Start with an introduction section to set expectations.</li>
          <li>Organize content logically from basic to advanced concepts.</li>
          <li>Keep lecture videos between 5-15 minutes for better engagement.</li>
          <li>Include practice exercises or quizzes to reinforce learning.</li>
          <li>End each section with a summary of key points.</li>
        </ul>
      </div>
    </div>
  );
};

export default CurriculumBuilder;
