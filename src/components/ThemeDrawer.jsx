import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTheme } from '../theme/ThemeContext.jsx';
import Close from '@mui/icons-material/Close';

// Import the styles for the drawer. These classes define the overlay and slide
// behaviour for the panel.
import './ThemeDrawer.css';

// Accent palette colours used for generating random themes.
const ACCENT_COLORS = [
  'tomato',
  'red',
  'ruby',
  'crimson',
  'pink',
  'plum',
  'purple',
  'violet',
  'iris',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'jade',
  'green',
  'grass',
  'brown',
  'orange',
  'amber',
  'gold',
  'bronze',
  'gray',
  'sky',
];

/**
 * ThemeDrawer
 *
 * A slide‑out panel that lets the user pick a theme or generate a custom theme
 * using a prompt. The drawer is implemented using the Dialog primitive from
 * Radix【752883575232845†L43-L155】. It avoids dynamic injection of styles and
 * sanitises user input by never rendering arbitrary HTML.
 */
const ThemeDrawer = () => {
  const { theme, defaultThemes, myThemes, setTheme, addCustomTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('default');
  const [prompt, setPrompt] = useState('');
  const [fileName, setFileName] = useState('');

  // Generate a custom theme based on the prompt and optional file name. This
  // function uses a deterministic but random selection of accent colours. In a
  // real implementation you would call an external API and validate its
  // response thoroughly before storing it in state. Here we simply pick a
  // random accent and default to light appearance.
  const handleGenerateTheme = () => {
    // Basic validation: ensure prompt is not empty and not excessively long.
    const trimmed = prompt.trim();
    if (!trimmed || trimmed.length > 280) {
      alert('Please provide a brief description (max 280 characters)');
      return;
    }
    // Choose a random accent colour.
    const accent = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)];
    const newTheme = {
      name: `${trimmed.slice(0, 20)} Theme`,
      config: {
        appearance: 'light',
        accentColor: accent,
      },
    };
    addCustomTheme(newTheme);
    setPrompt('');
    setFileName('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Only store the name; do not read file contents to avoid potential XSS
      // injection. Actual file processing would occur server‑side.
      setFileName(file.name);
    }
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-overlay" />
      <Dialog.Content className="dialog-content" aria-label="Theme drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Themes</h2>
          <Dialog.Close asChild>
            <button
              aria-label="Close"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <Close sx={{ fontSize: 20 }} />
            </button>
          </Dialog.Close>
        </div>
        {/* Tab navigation */}
        <nav style={{ display: 'flex', marginTop: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('default')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: activeTab === 'default' ? 'var(--accent-a4)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Default
          </button>
          <button
            onClick={() => setActiveTab('my')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: activeTab === 'my' ? 'var(--accent-a4)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            My themes
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: activeTab === 'ai' ? 'var(--accent-a4)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            AI generator
          </button>
        </nav>
        <div>
          {activeTab === 'default' && (
            <div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {defaultThemes.map((t) => (
                  <li key={t.id} style={{ marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => setTheme(t)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid var(--gray-a5)',
                        borderRadius: '4px',
                        background: theme.id === t.id ? 'var(--accent-a3)' : 'var(--panel-1)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ flex: 1 }}>{t.name}</span>
                      {theme.id === t.id && <span style={{ fontSize: '0.75rem' }}>(active)</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeTab === 'my' && (
            <div>
              {myThemes.length === 0 ? (
                <p>You haven't created any themes yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {myThemes.map((t) => (
                    <li key={t.id} style={{ marginBottom: '0.5rem' }}>
                      <button
                        onClick={() => setTheme(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid var(--gray-a5)',
                          borderRadius: '4px',
                          background: theme.id === t.id ? 'var(--accent-a3)' : 'var(--panel-1)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ flex: 1 }}>{t.name}</span>
                        {theme.id === t.id && <span style={{ fontSize: '0.75rem' }}>(active)</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {activeTab === 'ai' && (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>
                Describe your brand's personality or upload a sample image to
                generate a new theme. The AI will suggest a colour accent and set
                the appearance to light.
              </p>
              <div style={{ marginBottom: '0.5rem' }}>
                <label>
                  <span style={{ display: 'block', marginBottom: '0.25rem' }}>Brand description</span>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--gray-a5)' }}
                    placeholder="e.g. Futuristic tech startup..."
                  />
                </label>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <label htmlFor="brand-file">
                  <span style={{ display: 'block', marginBottom: '0.25rem' }}>Upload brand asset (optional)</span>
                  <input
                    id="brand-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'block' }}
                  />
                </label>
                {fileName && <span style={{ fontSize: '0.75rem' }}>Selected: {fileName}</span>}
              </div>
              <button
                onClick={handleGenerateTheme}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--accent-9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Generate theme
              </button>
            </div>
          )}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export default ThemeDrawer;