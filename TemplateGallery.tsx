"use client";

import { useState } from 'react';

export interface TemplateItem {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'education' | 'brainstorming' | 'planning';
  thumbnail: string;
  elements: any[]; // This would be your WhiteboardElement[] type
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: TemplateItem) => void;
  onClose: () => void;
}

export default function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Mock templates data
  const templates: TemplateItem[] = [
    {
      id: 'swot-analysis',
      name: 'SWOT Analysis',
      description: 'Analyze Strengths, Weaknesses, Opportunities, and Threats for your business or project.',
      category: 'business',
      thumbnail: '/templates/swot.png',
      elements: [
        {
          id: 'swot-title',
          type: 'text',
          x1: 400,
          y1: 50,
          text: 'SWOT ANALYSIS',
          color: '#333333',
        },
        {
          id: 'swot-rect-1',
          type: 'rectangle',
          x1: 150,
          y1: 150,
          x2: 450,
          y2: 350,
          color: '#4CAF50',
        },
        {
          id: 'swot-text-1',
          type: 'text',
          x1: 160,
          y1: 160,
          text: 'STRENGTHS',
          color: '#ffffff',
        },
        {
          id: 'swot-rect-2',
          type: 'rectangle',
          x1: 500,
          y1: 150,
          x2: 800,
          y2: 350,
          color: '#F44336',
        },
        {
          id: 'swot-text-2',
          type: 'text',
          x1: 510,
          y1: 160,
          text: 'WEAKNESSES',
          color: '#ffffff',
        },
        {
          id: 'swot-rect-3',
          type: 'rectangle',
          x1: 150,
          y1: 400,
          x2: 450,
          y2: 600,
          color: '#2196F3',
        },
        {
          id: 'swot-text-3',
          type: 'text',
          x1: 160,
          y1: 410,
          text: 'OPPORTUNITIES',
          color: '#ffffff',
        },
        {
          id: 'swot-rect-4',
          type: 'rectangle',
          x1: 500,
          y1: 400,
          x2: 800,
          y2: 600,
          color: '#FF9800',
        },
        {
          id: 'swot-text-4',
          type: 'text',
          x1: 510,
          y1: 410,
          text: 'THREATS',
          color: '#ffffff',
        }
      ],
    },
    {
      id: 'business-model-canvas',
      name: 'Business Model Canvas',
      description: 'Map out the building blocks of your business model in a structured way.',
      category: 'business',
      thumbnail: '/templates/business-model.png',
      elements: [
        {
          id: 'bmc-title',
          type: 'text',
          x1: 400,
          y1: 50,
          text: 'BUSINESS MODEL CANVAS',
          color: '#333333',
        },
        // Other canvas elements would be defined here
      ],
    },
    {
      id: 'customer-journey',
      name: 'Customer Journey Map',
      description: 'Visualize the customer experience across all touchpoints with your business.',
      category: 'business',
      thumbnail: '/templates/journey-map.png',
      elements: [],
    },
    {
      id: 'mind-map',
      name: 'Mind Map',
      description: 'Organize your thoughts and ideas in a visual, branching structure.',
      category: 'brainstorming',
      thumbnail: '/templates/mind-map.png',
      elements: [],
    },
    {
      id: 'kanban-board',
      name: 'Kanban Board',
      description: 'Visualize work progress with To Do, In Progress, and Done columns.',
      category: 'planning',
      thumbnail: '/templates/kanban.png',
      elements: [],
    },
    {
      id: 'lesson-plan',
      name: 'Lesson Plan',
      description: 'Structure educational content with learning objectives, activities, and assessments.',
      category: 'education',
      thumbnail: '/templates/lesson-plan.png',
      elements: [],
    },
    {
      id: 'feedback-grid',
      name: 'Feedback Grid',
      description: 'Collect and organize feedback into what worked well and what could be improved.',
      category: 'education',
      thumbnail: '/templates/feedback-grid.png',
      elements: [],
    },
    {
      id: 'project-roadmap',
      name: 'Project Roadmap',
      description: 'Plan and visualize project milestones, deliverables, and timelines.',
      category: 'planning',
      thumbnail: '/templates/roadmap.png',
      elements: [],
    },
    {
      id: 'brainstorm-canvas',
      name: 'Brainstorming Canvas',
      description: 'Generate and organize ideas with sections for problems, solutions, and actions.',
      category: 'brainstorming',
      thumbnail: '/templates/brainstorm.png',
      elements: [],
    },
  ];

  // Filter templates by category and search query
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'All Templates' },
    { id: 'business', name: 'Business' },
    { id: 'brainstorming', name: 'Brainstorming' },
    { id: 'planning', name: 'Planning' },
    { id: 'education', name: 'Education' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Template Gallery</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center mb-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-zinc-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No templates found. Try adjusting your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onSelectTemplate(template)}
                >
                  <div className="h-40 bg-zinc-100 flex items-center justify-center">
                    {template.thumbnail ? (
                      <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-zinc-400">[Template Preview]</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium">{template.name}</h3>
                    <p className="text-sm text-zinc-600 mt-1">{template.description}</p>
                    <div className="mt-2">
                      <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full">
                        {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-300 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => {}} // This could open blank canvas
            className="px-4 py-2 bg-zinc-800 text-white rounded-md"
          >
            Start with Blank Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
