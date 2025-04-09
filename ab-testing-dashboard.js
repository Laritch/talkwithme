import React, { useState, useEffect } from 'react';
import {
  experimentManager,
  EXPERIMENT_TYPES,
  VARIATION_TYPES,
  expertMatchingExperiment,
  expertPresentationExperiment
} from '../../utils/ml/abTesting';

const ABTestingDashboard = () => {
  const [activeExperiments, setActiveExperiments] = useState({});
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [experimentResults, setExperimentResults] = useState(null);
  const [newExperimentType, setNewExperimentType] = useState(EXPERIMENT_TYPES.EXPERT_MATCHING);

  // Expert Matching experiment specific values
  const [matchingValues, setMatchingValues] = useState({
    controlWeights: {
      language: 0.4,
      expertise: 0.3,
      rating: 0.2,
      response_time: 0.1
    },
    treatmentWeights: {
      language: 0.3,
      expertise: 0.4,
      rating: 0.2,
      response_time: 0.1
    }
  });

  // Form values
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    distribution: { control: 0.5, treatment: 0.5 },
    targetUserSegment: 'all'
  });

  useEffect(() => {
    // Load all active experiments
    loadExperiments();
  }, []);

  const loadExperiments = () => {
    const experiments = experimentManager.getAllExperiments();
    setActiveExperiments(experiments);
  };

  const handleExperimentSelect = (experimentId) => {
    setSelectedExperiment(experimentId);

    // Load experiment results
    if (experimentId) {
      const results = experimentManager.getExperimentResults(experimentId);
      setExperimentResults(results);
    } else {
      setExperimentResults(null);
    }
  };

  const handleCreateExperiment = (e) => {
    e.preventDefault();

    let experimentId;

    if (newExperimentType === EXPERIMENT_TYPES.EXPERT_MATCHING) {
      experimentId = expertMatchingExperiment.createExperiment({
        name: formValues.name,
        description: formValues.description,
        controlAlgorithm: 'standard',
        controlWeights: matchingValues.controlWeights,
        treatmentAlgorithm: 'enhanced',
        treatmentWeights: matchingValues.treatmentWeights,
        distribution: {
          [VARIATION_TYPES.CONTROL]: formValues.distribution.control,
          [VARIATION_TYPES.TREATMENT]: formValues.distribution.treatment
        },
        targetUserSegment: formValues.targetUserSegment
      });
    } else if (newExperimentType === EXPERIMENT_TYPES.EXPERT_PRESENTATION) {
      experimentId = expertPresentationExperiment.createExperiment({
        name: formValues.name,
        description: formValues.description,
        controlLayout: 'standard',
        treatmentLayout: 'enhanced',
        distribution: {
          [VARIATION_TYPES.CONTROL]: formValues.distribution.control,
          [VARIATION_TYPES.TREATMENT]: formValues.distribution.treatment
        },
        targetUserSegment: formValues.targetUserSegment
      });
    }

    // Reload experiments
    loadExperiments();

    // Reset form
    setFormValues({
      name: '',
      description: '',
      distribution: { control: 0.5, treatment: 0.5 },
      targetUserSegment: 'all'
    });

    // Select the newly created experiment
    if (experimentId) {
      setSelectedExperiment(experimentId);
      const results = experimentManager.getExperimentResults(experimentId);
      setExperimentResults(results);
    }
  };

  const handleEndExperiment = (experimentId) => {
    experimentManager.endExperiment(experimentId);
    loadExperiments();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWeightChange = (variation, factor, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 1) return;

    setMatchingValues(prev => {
      const newWeights = { ...prev };
      newWeights[variation][factor] = numValue;
      return newWeights;
    });
  };

  const handleDistributionChange = (e) => {
    const control = parseFloat(e.target.value);
    setFormValues(prev => ({
      ...prev,
      distribution: {
        control: control,
        treatment: Math.round((1 - control) * 100) / 100
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">A/B Testing Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - Active Experiments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Active Experiments</h2>

          {Object.keys(activeExperiments).length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {Object.entries(activeExperiments).map(([id, experiment]) => (
                <li
                  key={id}
                  className={`py-3 cursor-pointer hover:bg-gray-50 ${selectedExperiment === id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleExperimentSelect(id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{experiment.name}</h3>
                      <p className="text-sm text-gray-600">{experiment.type}</p>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${experiment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {experiment.status}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          Created: {new Date(experiment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEndExperiment(id);
                      }}
                    >
                      End
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No active experiments
            </div>
          )}
        </div>

        {/* Middle Column - Selected Experiment Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Experiment Details</h2>

          {selectedExperiment ? (
            <div>
              <h3 className="font-medium text-xl mb-2">
                {activeExperiments[selectedExperiment]?.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeExperiments[selectedExperiment]?.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Type</h4>
                  <p>{activeExperiments[selectedExperiment]?.type}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Status</h4>
                  <p>{activeExperiments[selectedExperiment]?.status}</p>
                </div>
              </div>

              {activeExperiments[selectedExperiment]?.type === EXPERIMENT_TYPES.EXPERT_MATCHING && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Algorithm Weights</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded p-3">
                      <h5 className="font-medium text-sm mb-2">Control</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-600">Language:</span> {activeExperiments[selectedExperiment]?.variations.control.weights.language}</p>
                        <p><span className="text-gray-600">Expertise:</span> {activeExperiments[selectedExperiment]?.variations.control.weights.expertise}</p>
                        <p><span className="text-gray-600">Rating:</span> {activeExperiments[selectedExperiment]?.variations.control.weights.rating}</p>
                        <p><span className="text-gray-600">Response Time:</span> {activeExperiments[selectedExperiment]?.variations.control.weights.response_time}</p>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded p-3">
                      <h5 className="font-medium text-sm mb-2">Treatment</h5>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-600">Language:</span> {activeExperiments[selectedExperiment]?.variations.treatment.weights.language}</p>
                        <p><span className="text-gray-600">Expertise:</span> {activeExperiments[selectedExperiment]?.variations.treatment.weights.expertise}</p>
                        <p><span className="text-gray-600">Rating:</span> {activeExperiments[selectedExperiment]?.variations.treatment.weights.rating}</p>
                        <p><span className="text-gray-600">Response Time:</span> {activeExperiments[selectedExperiment]?.variations.treatment.weights.response_time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">
              Select an experiment to view details
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Results</h2>

          {selectedExperiment && experimentResults ? (
            <div>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lift</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Impressions</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.control.impressions}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.treatment.impressions}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">-</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Views</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.control.views}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.treatment.views}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">-</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">View Rate</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{(experimentResults.control.viewRate * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{(experimentResults.treatment.viewRate * 100).toFixed(2)}%</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-sm ${experimentResults.lift.viewRate > 0 ? 'text-green-600' : experimentResults.lift.viewRate < 0 ? 'text-red-600' : ''}`}>
                          {experimentResults.lift.viewRate > 0 ? '+' : ''}{experimentResults.lift.viewRate.toFixed(2)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Clicks</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.control.clicks}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.treatment.clicks}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">-</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Click Rate</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{(experimentResults.control.clickRate * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{(experimentResults.treatment.clickRate * 100).toFixed(2)}%</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-sm ${experimentResults.lift.clickRate > 0 ? 'text-green-600' : experimentResults.lift.clickRate < 0 ? 'text-red-600' : ''}`}>
                          {experimentResults.lift.clickRate > 0 ? '+' : ''}{experimentResults.lift.clickRate.toFixed(2)}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Actions</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.control.actions}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{experimentResults.treatment.actions}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">-</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Action Rate</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{(experimentResults.control.actionRate * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{(experimentResults.treatment.actionRate * 100).toFixed(2)}%</td>
                        <td className={`px-3 py-2 whitespace-nowrap text-sm ${experimentResults.lift.actionRate > 0 ? 'text-green-600' : experimentResults.lift.actionRate < 0 ? 'text-red-600' : ''}`}>
                          {experimentResults.lift.actionRate > 0 ? '+' : ''}{experimentResults.lift.actionRate.toFixed(2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-12">
              Select an experiment to view results
            </div>
          )}
        </div>
      </div>

      {/* Create New Experiment Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Experiment</h2>

        <form onSubmit={handleCreateExperiment}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experiment Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newExperimentType}
                onChange={(e) => setNewExperimentType(e.target.value)}
              >
                <option value={EXPERIMENT_TYPES.EXPERT_MATCHING}>Expert Matching Algorithm</option>
                <option value={EXPERIMENT_TYPES.EXPERT_PRESENTATION}>Expert Presentation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formValues.name}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formValues.description}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="2"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target User Segment
              </label>
              <select
                name="targetUserSegment"
                value={formValues.targetUserSegment}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                <option value="US">US Users</option>
                <option value="EU">EU Users</option>
                <option value="new">New Users</option>
                <option value="returning">Returning Users</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distribution (Control %)
              </label>
              <input
                type="range"
                value={formValues.distribution.control}
                onChange={handleDistributionChange}
                min="0"
                max="1"
                step="0.05"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Control: {Math.round(formValues.distribution.control * 100)}%</span>
                <span>Treatment: {Math.round(formValues.distribution.treatment * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Expert Matching Specific Fields */}
          {newExperimentType === EXPERIMENT_TYPES.EXPERT_MATCHING && (
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h3 className="font-medium mb-3">Matching Algorithm Weights</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-sm mb-2">Control Algorithm Weights</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Language Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.controlWeights.language}
                        onChange={(e) => handleWeightChange('controlWeights', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Expertise Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.controlWeights.expertise}
                        onChange={(e) => handleWeightChange('controlWeights', 'expertise', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Rating Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.controlWeights.rating}
                        onChange={(e) => handleWeightChange('controlWeights', 'rating', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Response Time Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.controlWeights.response_time}
                        onChange={(e) => handleWeightChange('controlWeights', 'response_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Treatment Algorithm Weights</h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Language Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.treatmentWeights.language}
                        onChange={(e) => handleWeightChange('treatmentWeights', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Expertise Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.treatmentWeights.expertise}
                        onChange={(e) => handleWeightChange('treatmentWeights', 'expertise', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Rating Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.treatmentWeights.rating}
                        onChange={(e) => handleWeightChange('treatmentWeights', 'rating', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        Response Time Weight
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={matchingValues.treatmentWeights.response_time}
                        onChange={(e) => handleWeightChange('treatmentWeights', 'response_time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <p><strong>Note:</strong> The treatment algorithm will dynamically adjust these weights based on query specificity.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ABTestingDashboard;
