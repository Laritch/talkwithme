import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Simple Test App</h1>
      <p>If you're seeing this, the dev server is working correctly.</p>
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>,
  document.getElementById('root')
);
