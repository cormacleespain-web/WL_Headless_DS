import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  TextField,
  Select,
  Avatar,
  Link,
  Button,
  Table,
  IconButton,
} from '@radix-ui/themes';
import Search from '@mui/icons-material/Search';
import FirstPage from '@mui/icons-material/FirstPage';
import LastPage from '@mui/icons-material/LastPage';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import ArrowUpward from '@mui/icons-material/ArrowUpward';

const iconSx = { fontSize: 18 };

const MOCK_PEOPLE = [
  { id: 1, name: 'John Doe', project: 'Dow Jones', role: 'User Experience', location: 'Barcelona', team: 'User Experience', avatar: null },
  { id: 2, name: 'Jane Smith', project: 'Acme Corp', role: 'Engineering', location: 'London', team: 'Platform', avatar: null },
  { id: 3, name: 'Alex Johnson', project: 'TechCo', role: 'Product', location: 'Berlin', team: 'Product', avatar: null },
  { id: 4, name: 'Maria Garcia', project: 'Dow Jones', role: 'Design', location: 'Madrid', team: 'Design', avatar: null },
  { id: 5, name: 'David Brown', project: 'Acme Corp', role: 'Engineering', location: 'Dublin', team: 'Backend', avatar: null },
];

const FILTER_OPTIONS = ['All', 'Dow Jones', 'Acme Corp', 'TechCo', 'User Experience', 'Engineering', 'Product', 'Design', 'Barcelona', 'London', 'Berlin', 'Madrid', 'Dublin', 'Platform', 'Backend'];

export default function EMEAOrgChart() {
  const [nameSearch, setNameSearch] = useState('');
  const [project, setProject] = useState('All');
  const [team, setTeam] = useState('All');
  const [location, setLocation] = useState('All');
  const [role, setRole] = useState('All');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const totalPages = 99;
  const totalPeople = 45;

  const wrapperStyles = {
    fontFamily: 'var(--wz-typography-text-base-font-family, var(--font-sans))',
    color: 'var(--wz-color-semantic-fg-default, inherit)',
  };

  const headingStyles = {
    fontFamily: 'var(--wz-typography-sectionTitle-largeBold-font-family)',
    fontSize: 'var(--wz-typography-sectionTitle-largeBold-font-size)',
    lineHeight: 'var(--wz-typography-sectionTitle-largeBold-line-height)',
    fontWeight: 'var(--wz-typography-sectionTitle-largeBold-font-weight)',
    color: 'var(--wz-color-semantic-fg-default)',
  };

  const subtitleStyles = {
    fontFamily: 'var(--wz-typography-sectionTitle-medium-font-family)',
    fontSize: 'var(--wz-typography-sectionTitle-medium-font-size)',
    lineHeight: 'var(--wz-typography-sectionTitle-medium-line-height)',
    color: 'var(--wz-color-semantic-fg-default)',
  };

  const descriptionStyles = {
    fontFamily: 'var(--wz-typography-text-base-font-family)',
    fontSize: 'var(--wz-typography-text-base-font-size)',
    lineHeight: 'var(--wz-typography-text-base-line-height)',
    color: 'var(--wz-color-semantic-fg-muted)',
  };

  const labelStyles = {
    fontFamily: 'var(--wz-typography-text-xSmall-font-family)',
    fontSize: 'var(--wz-typography-text-xSmall-font-size)',
    color: 'var(--wz-color-semantic-fg-muted)',
  };

  const linkStyles = {
    fontFamily: 'var(--wz-typography-accent-large-font-family)',
    fontSize: 'var(--wz-typography-accent-large-font-size)',
    letterSpacing: 'var(--wz-typography-accent-large-letter-spacing)',
    color: 'var(--wz-color-semantic-brand-primary)',
  };

  return (
    <Box style={wrapperStyles}>
      {/* Header */}
      <Box mb="5">
        <Heading size="6" weight="bold" style={headingStyles}>Who is Who</Heading>
        <Text as="p" size="3" style={subtitleStyles}>Directory</Text>
        <Text as="p" size="2" style={descriptionStyles} mt="1">
          Search by name or/and filter by several criteria
        </Text>
      </Box>

      {/* Filters — two columns */}
      <Flex gap="4" wrap="wrap" mb="4">
        <Flex direction="column" gap="1" style={{ flex: '1 1 200px', minWidth: 160 }}>
          <Text size="1" style={labelStyles}>Name</Text>
          <TextField.Root
            placeholder="Search by name…"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            size="2"
          >
            <TextField.Slot side="right">
              <Search sx={iconSx} style={{ color: 'var(--wz-color-semantic-fg-muted)' }} />
            </TextField.Slot>
          </TextField.Root>
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: '1 1 200px', minWidth: 160 }}>
          <Text size="1" style={labelStyles}>Project</Text>
          <Select.Root value={project} onValueChange={setProject} size="2">
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {FILTER_OPTIONS.filter((o) => ['All', 'Dow Jones', 'Acme Corp', 'TechCo'].includes(o)).map((opt) => (
                <Select.Item key={opt} value={opt}>{opt}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: '1 1 200px', minWidth: 160 }}>
          <Text size="1" style={labelStyles}>Team</Text>
          <Select.Root value={team} onValueChange={setTeam} size="2">
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {FILTER_OPTIONS.filter((o) => ['All', 'User Experience', 'Engineering', 'Product', 'Design', 'Platform', 'Backend'].includes(o)).map((opt) => (
                <Select.Item key={opt} value={opt}>{opt}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: '1 1 200px', minWidth: 160 }}>
          <Text size="1" style={labelStyles}>Location</Text>
          <Select.Root value={location} onValueChange={setLocation} size="2">
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {FILTER_OPTIONS.filter((o) => ['All', 'Barcelona', 'London', 'Berlin', 'Madrid', 'Dublin'].includes(o)).map((opt) => (
                <Select.Item key={opt} value={opt}>{opt}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
        <Flex direction="column" gap="1" style={{ flex: '1 1 200px', minWidth: 160 }}>
          <Text size="1" style={labelStyles}>Role</Text>
          <Select.Root value={role} onValueChange={setRole} size="2">
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {FILTER_OPTIONS.filter((o) => ['All', 'User Experience', 'Engineering', 'Product', 'Design'].includes(o)).map((opt) => (
                <Select.Item key={opt} value={opt}>{opt}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Flex>

      {/* Results count */}
      <Text as="p" size="1" style={descriptionStyles} mb="3">
        {totalPeople} people
      </Text>

      {/* Directory table */}
      <Box
        style={{
          border: '1px solid var(--wz-color-semantic-border-subtle, var(--gray-a5))',
          borderRadius: 'var(--radius-3, 8px)',
          overflow: 'hidden',
          background: 'var(--wz-color-semantic-bg-surface, var(--color-panel))',
        }}
      >
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>
                <Flex align="center" gap="1">
                  <ArrowUpward sx={{ fontSize: 14 }} style={{ color: 'var(--wz-color-semantic-fg-muted)' }} />
                  Name
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Project</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Location</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Team</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {MOCK_PEOPLE.map((person) => (
              <Table.Row key={person.id}>
                <Table.Cell>
                  <Flex align="center" gap="3">
                    <Avatar
                      size="2"
                      radius="full"
                      src={person.avatar}
                      fallback={person.name.slice(0, 2).toUpperCase()}
                    />
                    <Box>
                      <Text weight="bold" size="2" style={{ color: 'var(--wz-color-semantic-fg-default)' }}>
                        {person.name}
                      </Text>
                      <Link href="#" size="1" style={linkStyles}>More about me</Link>
                    </Box>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--wz-color-semantic-fg-default)' }}>{person.project}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--wz-color-semantic-fg-default)' }}>{person.role}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--wz-color-semantic-fg-default)' }}>{person.location}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" style={{ color: 'var(--wz-color-semantic-fg-default)' }}>{person.team}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination */}
      <Flex justify="end" align="center" gap="3" mt="4" wrap="wrap">
        <Text size="1" style={descriptionStyles}>
          Page {page} of {totalPages} | Go to Page
        </Text>
        <TextField.Root
          type="number"
          value={page}
          onChange={(e) => setPage(Math.max(1, Math.min(totalPages, Number(e.target.value) || 1)))}
          size="1"
          style={{ width: 56 }}
        />
        <Select.Root value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))} size="1">
          <Select.Trigger style={{ width: 72 }} />
          <Select.Content>
            {[10, 25, 50, 100].map((n) => (
              <Select.Item key={n} value={String(n)}>{n}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Flex gap="1">
          <IconButton
            variant="soft"
            size="1"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            aria-label="First page"
          >
            <FirstPage sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            variant="soft"
            size="1"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            variant="soft"
            size="1"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            variant="soft"
            size="1"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            aria-label="Last page"
          >
            <LastPage sx={{ fontSize: 18 }} />
          </IconButton>
        </Flex>
      </Flex>
    </Box>
  );
}
