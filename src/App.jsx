import React from 'react';
import Playground from './components/Playground.jsx';
import { ThemeProvider } from './theme/ThemeContext.jsx';
import { ErrorBoundary } from './ErrorBoundary.jsx';

/**
 * App component.
 * Wraps the UI in ThemeProvider; main content is the Playground (theme panel + examples).
 */
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1 }}>
            <Playground />
          </main>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;