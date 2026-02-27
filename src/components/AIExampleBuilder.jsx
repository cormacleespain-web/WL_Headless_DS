import React, { useState, useRef, useEffect, Component } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Badge,
  Separator,
  TextField,
  TextArea,
  Avatar,
  Progress,
  Spinner,
  Link,
  Code,
  Strong,
  Em,
  Blockquote,
  ScrollArea,
  Inset,
  Kbd,
  Skeleton,
  Switch,
  Slider,
  Callout,
} from '@radix-ui/themes';

const COMPONENT_MAP = {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Badge,
  Separator,
  TextField: TextField.Root,
  TextArea,
  Avatar,
  Progress,
  Spinner,
  Link,
  Code,
  Strong,
  Em,
  Blockquote,
  ScrollArea,
  Inset,
  Kbd,
  Skeleton,
  Switch,
  Slider,
  Callout: Callout.Root,
};

/** Recursively render a UI tree node from the AI-generated JSON */
function renderNode(node) {
  if (node == null) return null;
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map((child, i) => <React.Fragment key={i}>{renderNode(child)}</React.Fragment>);

  const { component, props = {}, children } = node;
  const Component = COMPONENT_MAP[component];
  if (!Component) return <Text size="2" color="red">Unknown: {component}</Text>;

  const safeProps = { ...props };
  if (safeProps.style && typeof safeProps.style === 'object') {
    safeProps.style = { ...safeProps.style };
  }

  let childContent = children == null ? null : Array.isArray(children) ? children.map((c, i) => <React.Fragment key={i}>{renderNode(c)}</React.Fragment>) : renderNode(children);
  if (Component === Callout.Root && (typeof children === 'string' || (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string'))) {
    const text = typeof children === 'string' ? children : children[0];
    childContent = <Callout.Text>{text}</Callout.Text>;
  }
  return <Component {...safeProps}>{childContent}</Component>;
}

const API_URL = '/api/generate-page';

class PreviewErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Callout.Root color="orange" variant="soft" size="2">
          <Callout.Text>Preview could not be rendered. The generated structure may be invalid.</Callout.Text>
        </Callout.Root>
      );
    }
    return this.props.children;
  }
}

export default function AIExampleBuilder() {
  const [prompt, setPrompt] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tree, setTree] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function clearImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = prompt.trim();
    const hasPrompt = trimmed.length > 0;
    const hasImage = !!imageFile;
    if (!hasPrompt && !hasImage) {
      setError('Enter a description and/or upload an image of your design.');
      return;
    }
    setError(null);
    setTree(null);
    setLoading(true);
    try {
      let imageBase64 = null;
      let imageMimeType = null;
      if (imageFile) {
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const base64 = dataUrl?.split(',')[1];
            resolve(base64 || null);
          };
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
        imageMimeType = imageFile.type || 'image/jpeg';
      }
      const body = {
        prompt: hasPrompt ? trimmed : 'Create a page design that matches this image. Use our Radix UI component library and theme.',
        ...(imageBase64 && { imageBase64, imageMimeType }),
      };
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `Request failed (${res.status})`);
        return;
      }
      const content = data?.content;
      if (!content) {
        setError('No content returned');
        return;
      }
      const parsed = JSON.parse(content);
      if (!parsed || typeof parsed !== 'object') {
        setError('Invalid JSON from AI');
        return;
      }
      setTree(parsed);
    } catch (err) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box py="6" style={{ minHeight: 200 }}>
      <Flex direction="column" gap="4" style={{ maxWidth: 720 }}>
        <Heading size="5" weight="bold">AI Example Builder</Heading>
        <Text size="2" color="gray">
          Describe the page or component you want, or upload an image of your design. We’ll generate it using Radix UI and your local theme.
        </Text>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <TextArea
              placeholder="e.g. A sign-in card with email and password fields and a submit button"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={loading}
              style={{ width: '100%', resize: 'vertical' }}
            />
            <Flex gap="2" align="center" wrap="wrap">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
                aria-hidden
              />
              <Button
                type="button"
                variant="soft"
                size="2"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload design image
              </Button>
              {imageFile && (
                <Flex align="center" gap="2" style={{ flex: '1 1 auto', minWidth: 0 }}>
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-2)',
                      overflow: 'hidden',
                      background: 'var(--gray-a3)',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={imagePreviewUrl}
                      alt="Design reference"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                  <Text size="2" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {imageFile.name}
                  </Text>
                  <Button type="button" variant="ghost" color="gray" size="1" onClick={clearImage}>
                    Remove
                  </Button>
                </Flex>
              )}
            </Flex>
            <Button type="submit" disabled={loading} size="2">
              {loading ? (
                <Flex align="center" gap="2">
                  <Spinner size="1" />
                  Generating…
                </Flex>
              ) : (
                'Generate'
              )}
            </Button>
          </Flex>
        </form>

        {loading && (
          <Card size="2" style={{ padding: 48 }}>
            <Flex direction="column" align="center" gap="3">
              <Spinner size="3" />
              <Text size="2" color="gray">Building your design…</Text>
            </Flex>
          </Card>
        )}

        {error && !loading && (
          <Callout.Root color="red" variant="soft" size="2">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {tree && !loading && (
          <Box mt="4">
            <Text size="2" weight="bold" color="gray" style={{ display: 'block', marginBottom: 12 }}>Preview</Text>
            <PreviewErrorBoundary>
              <Card size="2" style={{ overflow: 'auto' }}>
                <Box p="4">
                  {renderNode(tree)}
                </Box>
              </Card>
            </PreviewErrorBoundary>
          </Box>
        )}
      </Flex>
    </Box>
  );
}
