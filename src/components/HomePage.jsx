import React from 'react';
import { Box, Card, Flex, Button, Heading, Text } from '@radix-ui/themes';

/**
 * HomePage component
 *
 * Serves as the landing page for the demo. It showcases a few Radix UI
 * components laid out using the Box and Flex primitives. This file
 * intentionally keeps content simple—no dynamic scripting or unsanitised
 * markup is used, mitigating the risk of XSS【57602067266527†screenshot】. The
 * global header is rendered by App.jsx.
 */
const HomePage = () => {
  return (
    <Box p="4">
      <Heading as="h2" size="4" mb="3">
        Welcome to the Radix UI Demo
      </Heading>
      <Text as="p" size="3" mb="4">
        This page demonstrates a handful of primitives and components from
        Radix. Use the gear icon in the header to experiment with different
        colour themes and to generate your own.
      </Text>
      <Flex direction={{ initial: 'column', sm: 'row' }} gap="4">
        <Card size="2" style={{ flex: 1 }}>
          <Heading as="h3" size="3" mb="2">
            Accessible Primitives
          </Heading>
          <Text as="p" mb="3">
            Radix provides unstyled building blocks that are accessible and easy
            to compose. The Card, Flex and Box components you see here are
            examples of these primitives working together.
          </Text>
          <Button variant="surface">Learn more</Button>
        </Card>
        <Card size="2" style={{ flex: 1 }}>
          <Heading as="h3" size="3" mb="2">
            Theming Made Simple
          </Heading>
          <Text as="p" mb="3">
            Use the Theme component to apply a cohesive look and feel across
            your application. Our theme drawer lets you switch accent colours
            and appearances effortlessly.
          </Text>
          <Button>See colours</Button>
        </Card>
      </Flex>
    </Box>
  );
};

export default HomePage;