import React, { useState, useCallback, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext.jsx';
import ThemeGeneratorPanel from './ThemeGeneratorPanel.jsx';
import EMEAOrgChart from './EMEAOrgChart.jsx';
import AIExampleBuilder from './AIExampleBuilder.jsx';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Card,
  Badge,
  Blockquote,
  Code,
  Separator,
  Switch,
  Slider,
  Progress,
  Avatar,
  Skeleton,
  Spinner,
  Kbd,
  Strong,
  Em,
  Quote,
  Link,
  Inset,
  IconButton,
  TextField,
  TextArea,
  Checkbox,
  Select,
  Tabs,
  Tooltip,
  ScrollArea,
  AspectRatio,
  Table,
  SegmentedControl,
  AlertDialog,
  Callout,
  Dialog,
  DropdownMenu,
  Popover,
  RadioGroup,
} from '@radix-ui/themes';
import Brush from '@mui/icons-material/Brush';
import Search from '@mui/icons-material/Search';
import Star from '@mui/icons-material/Star';
import Upload from '@mui/icons-material/Upload';
import Notifications from '@mui/icons-material/Notifications';
import MoreVert from '@mui/icons-material/MoreVert';
import Mail from '@mui/icons-material/Mail';
import MarkEmailRead from '@mui/icons-material/MarkEmailRead';
import BarChart from '@mui/icons-material/BarChart';
import Bookmark from '@mui/icons-material/Bookmark';
import Person from '@mui/icons-material/Person';
import CreditCard from '@mui/icons-material/CreditCard';
import Bolt from '@mui/icons-material/Bolt';
import Warning from '@mui/icons-material/Warning';
import Block from '@mui/icons-material/Block';
import Info from '@mui/icons-material/Info';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';

function Section({ title, docLink, children }) {
  return (
    <Box mb="8" id={title.toLowerCase().replace(/\s+/g, '-')}>
      <Flex align="center" gap="2" mb="3">
        <Heading size="6" weight="bold">{title}</Heading>
        {docLink && (
          <Link href={docLink} size="2" color="gray">View in docs</Link>
        )}
      </Flex>
      {children}
    </Box>
  );
}

function WidgetCard({ title, subtitle, children }) {
  return (
    <Card size="2" style={{ flex: '1 1 280px', minWidth: 'min(260px, 100%)' }}>
      <Flex justify="between" align="start" mb="2">
        <Box>
          <Heading size="4" weight="bold">{title}</Heading>
          {subtitle && <Text size="2" color="gray">{subtitle}</Text>}
        </Box>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <IconButton variant="ghost" size="1"><MoreVert sx={{ fontSize: 14 }} /></IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item>Edit</DropdownMenu.Item>
            <DropdownMenu.Item>Share</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
      {children}
    </Card>
  );
}

function DashboardExample() {
  const [plan, setPlan] = useState({ branding: false, marketing: true, web: false, app: false });
  const iconSx = { fontSize: 18 };
  const tokenCardStyle = {
    background: 'var(--wz-color-semantic-bg-surface, var(--color-panel))',
    border: '1px solid var(--wz-color-semantic-border-subtle, var(--gray-a5))',
    color: 'var(--wz-color-semantic-fg-default, inherit)',
  };
  return (
    <Box pt="5" pb="8" style={{ width: '100%', minWidth: 0 }}>
      {/* Top bar: search + actions — responsive, wraps on narrow viewports */}
      <Flex
        gap="4"
        align="center"
        mb="6"
        wrap="wrap"
        style={{ width: '100%' }}
      >
        <Box style={{ flex: '1 1 220px', minWidth: 0, maxWidth: 420 }}>
          <TextField.Root
            placeholder="Type to search…"
            size="2"
            style={{ width: '100%' }}
          >
            <TextField.Slot side="left">
              <Search sx={iconSx} />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        <Flex
          gap="2"
          align="center"
          wrap="wrap"
          style={{ flexShrink: 0 }}
        >
          <IconButton variant="ghost" size="2" aria-label="Bookmark">
            <Star sx={iconSx} />
          </IconButton>
          <IconButton variant="ghost" size="2" aria-label="Upload">
            <Upload sx={iconSx} />
          </IconButton>
          <IconButton variant="ghost" size="2" aria-label="Alerts">
            <Warning sx={iconSx} />
          </IconButton>
          <IconButton variant="ghost" size="2" aria-label="Notifications">
            <Notifications sx={iconSx} />
          </IconButton>
          <Avatar size="2" radius="full" fallback="U" alt="User" />
        </Flex>
      </Flex>

      {/* KPI cards — use theme semantic tokens when available */}
      <Flex gap="3" wrap="wrap" mb="6" style={{ width: '100%' }}>
        {[
          { icon: <Mail sx={iconSx} />, value: '$13.4k', label: 'Total Sales', change: '+38%', positive: true, tag: 'Last 6 months' },
          { icon: <BarChart sx={iconSx} />, value: '155K', label: 'Total Orders', change: '+22%', positive: true, tag: 'Last 4 months' },
          { icon: <BarChart sx={iconSx} />, value: '$89.34k', label: 'Total Profit', change: '-16%', positive: false, tag: 'Last One year' },
          { icon: <Bookmark sx={iconSx} />, value: '$1,200', label: 'Bookmarks', change: '+38%', positive: true, tag: 'Last 6 months' },
          { icon: <Person sx={iconSx} />, value: '42.4k', label: 'Customers', change: '+9.2%', positive: true, tag: 'Daily customers' },
        ].map((kpi, i) => (
          <Card key={i} size="2" style={{ flex: '1 1 160px', minWidth: 140, ...tokenCardStyle }}>
            <Flex direction="column" gap="2">
              <Flex align="center" gap="2">
                <Box style={{ color: 'var(--wz-color-semantic-brand-primary, var(--accent-11))' }}>{kpi.icon}</Box>
                <Badge size="1" color="gray" variant="soft">{kpi.tag}</Badge>
              </Flex>
              <Text size="6" weight="bold">{kpi.value}</Text>
              <Text size="2" color="gray">{kpi.label}</Text>
              <Text size="2" color={kpi.positive ? 'green' : 'red'}>{kpi.change}</Text>
            </Flex>
          </Card>
        ))}
      </Flex>

      {/* Row 2: Total Income, Report, Monthly campaign — stacks on narrow viewports */}
      <Flex gap="4" wrap="wrap" mb="6" style={{ width: '100%' }}>
        <WidgetCard title="Total Income" subtitle="Weekly report overview">
          <Box mt="3" style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
            {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
              <Box key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--accent-9)', borderRadius: 'var(--radius-2)', minWidth: 20 }} />
            ))}
          </Box>
          <Flex gap="2" mt="2" wrap="wrap">
            {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d, i) => <Text key={i} size="1" color="gray">{d}</Text>)}
          </Flex>
        </WidgetCard>
        <WidgetCard title="Report" subtitle="Weekly activity">
          <Flex direction="column" gap="3" mt="2">
            <Flex justify="between" align="center"><Flex align="center" gap="2"><Mail sx={iconSx} /> <Text>Income</Text></Flex><Flex align="center" gap="2"><Text weight="bold">$5,550</Text><Badge color="green" size="1">+2.34K</Badge></Flex></Flex>
            <Flex justify="between" align="center"><Flex align="center" gap="2"><CreditCard sx={iconSx} /> <Text>Expense</Text></Flex><Flex align="center" gap="2"><Text weight="bold">$3,520</Text><Badge color="red" size="1">-1.4K</Badge></Flex></Flex>
            <Flex justify="between" align="center"><Flex align="center" gap="2"><BarChart sx={iconSx} /> <Text>Profit</Text></Flex><Flex align="center" gap="2"><Text weight="bold">$2,350</Text><Badge color="green" size="1">+3.22K</Badge></Flex></Flex>
          </Flex>
        </WidgetCard>
        <WidgetCard title="Monthly campaign state" subtitle="7.58k Social Visitors">
          <Flex direction="column" gap="2" mt="2">
            {[{ icon: <Mail sx={iconSx} />, label: 'Emails', count: '14,250', pct: '0.3%' }, { icon: <MarkEmailRead sx={iconSx} />, label: 'Opened', count: '4,523', pct: '3.1%' }, { icon: <Bolt sx={iconSx} />, label: 'Clicked', count: '1,250', pct: '1.3%' }, { icon: <Notifications sx={iconSx} />, label: 'Subscribed', count: '750', pct: '9.8%' }, { icon: <Warning sx={iconSx} />, label: 'Errors', count: '20', pct: '1.5%' }, { icon: <Block sx={iconSx} />, label: 'Unsubscribed', count: '86', pct: '0.6%' }].map((r, i) => (
              <Flex key={i} justify="between" align="center"><Flex align="center" gap="2">{r.icon}<Text size="2">{r.label}</Text></Flex><Flex gap="2"><Text size="2">{r.count}</Text><Text size="2" color="gray">{r.pct}</Text></Flex></Flex>
            ))}
          </Flex>
        </WidgetCard>
      </Flex>

      {/* Row 3: Total Earning, Plan, Vehicles — stacks on narrow viewports */}
      <Flex gap="4" wrap="wrap" style={{ width: '100%' }}>
        <WidgetCard title="Total earning" subtitle="87% ^ +38%">
          <Flex gap="2" mt="3" style={{ alignItems: 'flex-end' }}>
            {[70, 85, 60, 90, 75, 88].map((v, i) => (
              <Box key={i} style={{ flex: 1, minWidth: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box style={{ height: 24, background: 'var(--accent-6)', borderRadius: 'var(--radius-1)' }} />
                <Box style={{ height: (100 - v) * 0.8, minHeight: 4, background: 'var(--accent-9)', borderRadius: 'var(--radius-1)' }} />
              </Box>
            ))}
          </Flex>
          <Flex justify="between" mt="3" align="center"><Text size="2" color="gray">$ Total revenue</Text><Badge color="green">+$250</Badge></Flex>
        </WidgetCard>
        <WidgetCard title="For Business Shark" subtitle="Choose a plan to get started">
          <Flex direction="column" gap="2" mt="2">
            {[
              { key: 'branding', label: 'Branding', price: '$60' },
              { key: 'marketing', label: 'Marketing', price: '$120' },
              { key: 'web', label: 'Web Development', price: '$250' },
              { key: 'app', label: 'App Development', price: '$320' },
            ].map(({ key, label, price }) => (
              <Flex key={key} justify="between" align="center">
                <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Checkbox checked={plan[key]} onCheckedChange={(c) => setPlan((p) => ({ ...p, [key]: c === true }))} />
                  {label}
                </Text>
                <Text weight="bold">{price}</Text>
              </Flex>
            ))}
            <Separator size="4" my="2" />
            <Flex justify="between"><Text size="2" color="gray">Taxes</Text><Text>$32</Text></Flex>
            <Flex justify="between"><Text weight="bold">Total amount</Text><Text weight="bold">$152</Text></Flex>
          </Flex>
        </WidgetCard>
        <WidgetCard title="Vehicles Condition">
          <Flex direction="column" gap="3" mt="2">
            {[{ label: 'Excellent', value: 55, sub: '12% increase', change: '+25%', color: 'orange' }, { label: 'Good', value: 20, sub: '24 vehicles', change: '+30%', color: 'green' }, { label: 'Average', value: 12, sub: '182 Tasks', change: '-15%', color: 'blue' }, { label: 'Bad', value: 7, sub: '9 vehicles', change: '+35%', color: 'orange' }, { label: 'Not Working', value: 4, sub: '3 vehicles', change: '-2%', color: 'gray' }].map((v, i) => (
              <Flex key={i} align="center" gap="3">
                <Progress value={v.value} color={v.color} style={{ width: 48, flexShrink: 0 }} size="1" />
                <Box style={{ flex: 1 }}>
                  <Text size="2" weight="bold">{v.value}%</Text>
                  <Text size="1" color="gray">{v.sub}</Text>
                </Box>
                <Badge size="1" color={v.change.startsWith('+') ? 'green' : 'red'} variant="soft">{v.change}</Badge>
              </Flex>
            ))}
          </Flex>
        </WidgetCard>
      </Flex>
    </Box>
  );
}

export default function Playground() {
  const [mainTab, setMainTab] = useState('examples');
  const [segment, setSegment] = useState('inbox');
  const [radioValue, setRadioValue] = useState('agree');
  const [selectValue, setSelectValue] = useState('');
  const [tabValue, setTabValue] = useState('account');
  const [themePanelOpen, setThemePanelOpen] = useState(true);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key?.toUpperCase() === 'T' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        const target = e.target?.closest?.('input, textarea, [contenteditable]');
        if (!target) setThemePanelOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Box style={{ minHeight: '100vh' }}>
      <ThemeGeneratorPanel
        open={themePanelOpen}
        onClose={() => setThemePanelOpen(false)}
      />
      {!themePanelOpen && (
        <Tooltip content="Open Theme Generator (T)">
          <IconButton
            size="3"
            variant="solid"
            color="accent"
            radius="full"
            className="theme-panel-fab"
            style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10 }}
            onClick={() => setThemePanelOpen(true)}
            aria-label="Open theme panel"
          >
            <Brush sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}

      {/* Content area: reserve right space for floating panel when open (panel width 340 + right 20) */}
      <Box style={{ paddingRight: themePanelOpen ? 360 : 0 }}>
        <Box p="6" style={{ maxWidth: 900, margin: '0 auto' }}>
          <Flex direction="column" align="center" gap="3" mb="8" style={{ textAlign: 'center' }}>
            <img
              src="/wizeline-logomark.png"
              alt="Brand logo"
              style={{ height: 48, width: 'auto', display: 'block' }}
            />
            <Heading size="8" weight="bold">The Foundation for your Design System</Heading>
            <Text size="4" color="gray" style={{ maxWidth: 560 }}>
              A set of beautifully designed components that you can customize, extend, and build on. Start here then make it your own. Open Source. Open Code.
            </Text>
          </Flex>

          <Tabs.Root value={mainTab} onValueChange={setMainTab}>
            <Tabs.List>
              <Tabs.Trigger value="examples">Examples</Tabs.Trigger>
              <Tabs.Trigger value="dashboard">Dashboard</Tabs.Trigger>
              <Tabs.Trigger value="emea-org-chart">EMEA Org Chart</Tabs.Trigger>
              <Tabs.Trigger value="playground">Playground</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="examples">
              <Box pt="5">
              {/* Alert Dialog */}
              <Section title="Alert Dialog" docLink="https://www.radix-ui.com/themes/docs/components/alert-dialog">
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button>Open</Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Title>Confirm action</AlertDialog.Title>
              <AlertDialog.Description>
                Are you sure you want to continue? This action cannot be undone.
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">Cancel</Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button color="red">Confirm</Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Section>

        {/* Theme tokens — semantic colors & typography (all use token colors for dark mode) */}
        <Section title="Theme tokens" docLink="">
          <Flex direction="column" gap="6">
            <Box>
              <Text size="2" weight="bold" style={{ marginBottom: 8, display: 'block', color: 'var(--wz-color-semantic-fg-muted)' }}>Semantic colors</Text>
              <Flex gap="2" wrap="wrap">
                {[
                  { label: 'fg.default', bg: 'var(--wz-color-semantic-bg-surface)', color: 'var(--wz-color-semantic-fg-default)' },
                  { label: 'fg.muted', bg: 'var(--wz-color-semantic-bg-surface)', color: 'var(--wz-color-semantic-fg-muted)' },
                  { label: 'fg.inverse', bg: 'var(--wz-color-semantic-fg-default)', color: 'var(--wz-color-semantic-fg-inverse)' },
                  { label: 'bg.canvas', bg: 'var(--wz-color-semantic-bg-canvas)', color: 'var(--wz-color-semantic-fg-default)', border: '1px solid var(--wz-color-semantic-border-subtle)' },
                  { label: 'bg.surface', bg: 'var(--wz-color-semantic-bg-surface)', color: 'var(--wz-color-semantic-fg-default)', border: '1px solid var(--wz-color-semantic-border-subtle)' },
                  { label: 'bg.surfaceAlt', bg: 'var(--wz-color-semantic-bg-surfaceAlt)', color: 'var(--wz-color-semantic-fg-default)', border: '1px solid var(--wz-color-semantic-border-subtle)' },
                  { label: 'border', bg: 'var(--wz-color-semantic-bg-surface)', color: 'var(--wz-color-semantic-fg-default)', border: '2px solid var(--wz-color-semantic-border-default)' },
                  { label: 'brand.primary', bg: 'var(--wz-color-semantic-brand-primary)', color: 'var(--wz-color-semantic-fg-inverse)' },
                  { label: 'brand.primaryStrong', bg: 'var(--wz-color-semantic-brand-primaryStrong)', color: 'var(--wz-color-semantic-fg-inverse)' },
                  { label: 'accent.blue', bg: 'var(--wz-color-semantic-accent-blueStrong)', color: 'var(--wz-color-semantic-fg-inverse)' },
                  { label: 'highlight.lime', bg: 'var(--wz-color-semantic-accent-highlightLime)', color: 'var(--wz-color-semantic-fg-default)' },
                ].map(({ label, bg, color, border }) => (
                  <Box key={label} style={{ padding: '8px 12px', borderRadius: 'var(--radius-2)', background: bg, color, border }}>
                    <Text size="1" weight="medium" style={{ color: 'inherit' }}>{label}</Text>
                  </Box>
                ))}
              </Flex>
            </Box>
            <Box>
              <Text size="2" weight="bold" style={{ marginBottom: 8, display: 'block', color: 'var(--wz-color-semantic-fg-muted)' }}>Typography (token-driven)</Text>
              <Flex direction="column" gap="3">
                <Box style={{ fontFamily: 'var(--wz-typography-hero-medium-font-family)', fontSize: 'var(--wz-typography-hero-medium-font-size)', lineHeight: 'var(--wz-typography-hero-medium-line-height)', fontWeight: 'var(--wz-typography-hero-medium-font-weight)', color: 'var(--wz-color-semantic-fg-default)' }}>Hero medium — 80px Space Mono</Box>
                <Box style={{ fontFamily: 'var(--wz-typography-title-large-font-family)', fontSize: 'var(--wz-typography-title-large-font-size)', lineHeight: 'var(--wz-typography-title-large-line-height)', color: 'var(--wz-color-semantic-fg-default)' }}>Title large — Page titles</Box>
                <Box style={{ fontFamily: 'var(--wz-typography-sectionTitle-mediumBold-font-family)', fontSize: 'var(--wz-typography-sectionTitle-mediumBold-font-size)', lineHeight: 'var(--wz-typography-sectionTitle-mediumBold-line-height)', fontWeight: 'var(--wz-typography-sectionTitle-mediumBold-font-weight)', color: 'var(--wz-color-semantic-fg-default)' }}>Section title medium bold — Card titles</Box>
                <Box style={{ fontFamily: 'var(--wz-typography-text-base-font-family)', fontSize: 'var(--wz-typography-text-base-font-size)', lineHeight: 'var(--wz-typography-text-base-line-height)', color: 'var(--wz-color-semantic-fg-default)' }}>Text base — Body content. Nunito Sans 16px.</Box>
                <Box style={{ fontFamily: 'var(--wz-typography-text-xSmall-font-family)', fontSize: 'var(--wz-typography-text-xSmall-font-size)', color: 'var(--wz-color-semantic-fg-muted)' }}>Text xSmall — Small links, disclaimer, legal</Box>
                <Box style={{ fontFamily: 'var(--wz-typography-accent-large-font-family)', fontSize: 'var(--wz-typography-accent-large-font-size)', letterSpacing: 'var(--wz-typography-accent-large-letter-spacing)', color: 'var(--wz-color-semantic-brand-primary)' }}>Accent large — Buttons, labels, tags</Box>
              </Flex>
            </Box>
          </Flex>
        </Section>

        {/* Aspect Ratio */}
        <Section title="Aspect Ratio" docLink="https://www.radix-ui.com/themes/docs/components/aspect-ratio">
          <Flex gap="6" wrap="wrap" align="flex-end">
            {[
              { label: '2:3', ratio: 2 / 3, width: 120 },
              { label: '1:1', ratio: 1, width: 180 },
              { label: '16:9', ratio: 16 / 9, width: 320 },
            ].map(({ label, ratio, width }) => (
              <Flex key={label} direction="column" gap="2" align="start">
                <Text size="2" weight="medium">{label}</Text>
                <Box style={{ width, borderRadius: 'var(--radius-2)', overflow: 'hidden', boxShadow: 'var(--shadow-2)', background: 'var(--accent-2)', color: 'var(--accent-11)' }}>
                  <AspectRatio ratio={ratio}>
                    <Flex align="center" justify="center" style={{ height: '100%', padding: 'var(--space-2)', textAlign: 'center' }}>
                      <Text size="2" weight="medium">{label} Ratio Example</Text>
                    </Flex>
                  </AspectRatio>
                </Box>
              </Flex>
            ))}
          </Flex>
        </Section>

        {/* Avatar */}
        <Section title="Avatar" docLink="https://www.radix-ui.com/themes/docs/components/avatar">
          <Flex gap="3" wrap="wrap">
            <Avatar size="1" radius="full" fallback="A" />
            <Avatar size="2" radius="full" fallback="B" />
            <Avatar size="3" radius="full" fallback="C" />
          </Flex>
        </Section>

        {/* Badge */}
        <Section title="Badge" docLink="https://www.radix-ui.com/themes/docs/components/badge">
          <Flex gap="2" wrap="wrap">
            <Badge variant="solid">Solid</Badge>
            <Badge color="gray" variant="soft">Soft</Badge>
            <Badge variant="surface">Surface</Badge>
            <Badge variant="outline">Outline</Badge>
          </Flex>
        </Section>

        {/* Blockquote */}
        <Section title="Blockquote" docLink="https://www.radix-ui.com/themes/docs/components/blockquote">
          <Blockquote>
            Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes near it in obstinacy.
          </Blockquote>
        </Section>

        {/* Button */}
        <Section title="Button" docLink="https://www.radix-ui.com/themes/docs/components/button">
          <Flex gap="2" wrap="wrap">
            <Button variant="solid">Solid</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="surface">Surface</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button disabled>Disabled</Button>
          </Flex>
        </Section>

        {/* Callout */}
        <Section title="Callout" docLink="https://www.radix-ui.com/themes/docs/components/callout">
          <Flex gap="6" wrap="wrap" style={{ width: '100%' }}>
            <Flex direction="column" gap="3" style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Text size="2" weight="bold" color="gray">Accent</Text>
              <Callout.Root variant="soft" size="2">
                <Callout.Icon>
                  <Info sx={{ fontSize: 18 }} />
                </Callout.Icon>
                <Callout.Text>Please <span style={{ textDecoration: 'underline' }}>upgrade</span> to the new version.</Callout.Text>
              </Callout.Root>
              <Callout.Root variant="surface" size="2">
                <Callout.Icon>
                  <Info sx={{ fontSize: 18 }} />
                </Callout.Icon>
                <Callout.Text>Please <span style={{ textDecoration: 'underline' }}>upgrade</span> to the new version.</Callout.Text>
              </Callout.Root>
              <Callout.Root variant="outline" size="2">
                <Callout.Icon>
                  <Info sx={{ fontSize: 18 }} />
                </Callout.Icon>
                <Callout.Text>Please <span style={{ textDecoration: 'underline' }}>upgrade</span> to the new version.</Callout.Text>
              </Callout.Root>
            </Flex>
            <Flex direction="column" gap="3" style={{ flex: '1 1 300px', minWidth: 0 }}>
              <Text size="2" weight="bold" color="gray">Gray</Text>
              <Callout.Root color="gray" variant="soft" size="2">
                <Callout.Icon>
                  <Info sx={{ fontSize: 18 }} />
                </Callout.Icon>
                <Callout.Text>Please <span style={{ textDecoration: 'underline' }}>upgrade</span> to the new version.</Callout.Text>
              </Callout.Root>
              <Callout.Root color="gray" variant="surface" size="2">
                <Callout.Icon>
                  <Info sx={{ fontSize: 18 }} />
                </Callout.Icon>
                <Callout.Text>Please <span style={{ textDecoration: 'underline' }}>upgrade</span> to the new version.</Callout.Text>
              </Callout.Root>
              <Callout.Root color="gray" variant="outline" size="2">
                <Callout.Icon>
                  <Info sx={{ fontSize: 18 }} />
                </Callout.Icon>
                <Callout.Text>Please <span style={{ textDecoration: 'underline' }}>upgrade</span> to the new version.</Callout.Text>
              </Callout.Root>
            </Flex>
          </Flex>
        </Section>

        {/* Card — glass-like sign-in (theme-aligned) + size/variant examples */}
        <Section title="Card" docLink="https://www.radix-ui.com/themes/docs/components/card">
          <Flex direction="column" gap="6">
            <Box className="glass-card" style={{ maxWidth: 380, padding: 'var(--space-5)' }}>
              <Flex direction="column" gap="4">
                <Heading size="5">Sign in</Heading>
                <Flex direction="column" gap="2">
                  <Text as="label" size="2" weight="medium">Email</Text>
                  <TextField.Root placeholder="Enter your email address" size="2" />
                </Flex>
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="center">
                    <Text as="label" size="2" weight="medium">Password</Text>
                    <Link href="#" size="2">Forgot password?</Link>
                  </Flex>
                  <TextField.Root type="password" placeholder="Enter your password" size="2" />
                </Flex>
                <Flex gap="3" mt="2">
                  <Button variant="outline" size="2" style={{ flex: 1 }}>Create an account</Button>
                  <Button size="2" style={{ flex: 1 }}>Sign in</Button>
                </Flex>
              </Flex>
            </Box>

            {/* Card size & variant examples — 3 sizes × 3 variants, responsive wrap */}
            <Flex direction="column" gap="4" style={{ width: '100%', minWidth: 0 }}>
              <Text size="2" weight="bold" color="gray">Size &amp; variant</Text>
              <Flex direction="column" gap="4" style={{ width: '100%', minWidth: 0 }}>
                {/* Column headers — same flex as card cells so they align when wrapped */}
                <Flex gap="4" align="center" wrap="wrap" style={{ width: '100%' }}>
                  <Box style={{ width: 72, flexShrink: 0 }} />
                  {['Surface', 'Classic'].map((label) => (
                    <Text key={label} size="2" weight="medium" style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 280 }}>{label}</Text>
                  ))}
                </Flex>
                {/* Size 1 */}
                <Flex gap="4" align="stretch" wrap="wrap" style={{ width: '100%' }}>
                  <Text size="2" color="gray" style={{ width: 72, flexShrink: 0, lineHeight: 'var(--line-height-2)', alignSelf: 'center' }}>Size 1</Text>
                  {['surface', 'classic'].map((variant) => (
                    <Card key={variant} size="1" variant={variant} style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 280, minHeight: 'auto' }}>
                      <Flex gap="3" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar size="1" radius="medium" fallback="EA" alt="Emily Adams" style={{ flexShrink: 0 }} />
                        <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Text size="1" color="gray" style={{ textTransform: 'capitalize' }}>{variant}</Text>
                          <Text size="1" weight="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Emily Adams</Text>
                          <Text size="1" color="gray" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>emily.adams@example.com</Text>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
                {/* Size 2 */}
                <Flex gap="4" align="stretch" wrap="wrap" style={{ width: '100%' }}>
                  <Text size="2" color="gray" style={{ width: 72, flexShrink: 0, lineHeight: 'var(--line-height-2)', alignSelf: 'center' }}>Size 2</Text>
                  {['surface', 'classic'].map((variant) => (
                    <Card key={variant} size="2" variant={variant} style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 280, minHeight: 'auto' }}>
                      <Flex gap="3" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar size="2" radius="medium" fallback="EA" alt="Emily Adams" style={{ flexShrink: 0 }} />
                        <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Text size="2" color="gray" style={{ textTransform: 'capitalize' }}>{variant}</Text>
                          <Text size="2" weight="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Emily Adams</Text>
                          <Text size="2" color="gray" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>emily.adams@example.com</Text>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
                {/* Size 3 */}
                <Flex gap="4" align="stretch" wrap="wrap" style={{ width: '100%' }}>
                  <Text size="2" color="gray" style={{ width: 72, flexShrink: 0, lineHeight: 'var(--line-height-2)', alignSelf: 'center' }}>Size 3</Text>
                  {['surface', 'classic'].map((variant) => (
                    <Card key={variant} size="3" variant={variant} style={{ flex: '1 1 200px', minWidth: 200, maxWidth: 280, minHeight: 'auto' }}>
                      <Flex gap="3" align="center" wrap="nowrap" style={{ minWidth: 0 }}>
                        <Avatar size="3" radius="medium" fallback="EA" alt="Emily Adams" style={{ flexShrink: 0 }} />
                        <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                          <Text size="3" color="gray" style={{ textTransform: 'capitalize' }}>{variant}</Text>
                          <Text size="3" weight="bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Emily Adams</Text>
                          <Text size="3" color="gray" style={{ wordBreak: 'break-word', overflow: 'hidden' }}>emily.adams@example.com</Text>
                        </Flex>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Section>

        {/* Checkbox */}
        <Section title="Checkbox" docLink="https://www.radix-ui.com/themes/docs/components/checkbox">
          <Flex direction="column" gap="6">
            {/* Checkbox variant & color grid — Classic / Surface / Soft × Accent / Gray / Disabled */}
            <Flex direction="column" gap="4">
              <Text size="2" weight="bold" color="gray">Variant &amp; color</Text>
              <Box style={{ overflowX: 'auto' }}>
                <Flex direction="column" gap="4" style={{ minWidth: 'max-content' }}>
                  {/* Column headers */}
                  <Flex gap="4" align="center">
                    <Box style={{ width: 80, flexShrink: 0 }} />
                    <Text size="2" weight="medium" style={{ width: 160, flexShrink: 0 }}>Accent</Text>
                    <Text size="2" weight="medium" style={{ width: 160, flexShrink: 0 }}>Gray</Text>
                    <Text size="2" weight="medium" style={{ width: 160, flexShrink: 0 }}>Disabled</Text>
                  </Flex>
                  {/* Classic row */}
                  <Flex gap="4" align="stretch">
                    <Text size="2" color="gray" style={{ width: 80, flexShrink: 0, lineHeight: 'var(--line-height-2)' }}>Classic</Text>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="classic" />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="classic" defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="classic" color="gray" />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="classic" color="gray" defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.7 }}>
                          <Checkbox variant="classic" disabled />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.7 }}>
                          <Checkbox variant="classic" disabled defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                  </Flex>
                  {/* Surface row */}
                  <Flex gap="4" align="stretch">
                    <Text size="2" color="gray" style={{ width: 80, flexShrink: 0, lineHeight: 'var(--line-height-2)' }}>Surface</Text>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="surface" />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="surface" defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="surface" color="gray" />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="surface" color="gray" defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.7 }}>
                          <Checkbox variant="surface" disabled />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.7 }}>
                          <Checkbox variant="surface" disabled defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                  </Flex>
                  {/* Soft row */}
                  <Flex gap="4" align="stretch">
                    <Text size="2" color="gray" style={{ width: 80, flexShrink: 0, lineHeight: 'var(--line-height-2)' }}>Soft</Text>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="soft" />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="soft" defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="soft" color="gray" />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <Checkbox variant="soft" color="gray" defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                    <Card size="2" variant="surface" style={{ width: 160, flexShrink: 0 }}>
                      <Flex direction="column" gap="3">
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.7 }}>
                          <Checkbox variant="soft" disabled />
                          Unchecked
                        </Text>
                        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.7 }}>
                          <Checkbox variant="soft" disabled defaultChecked />
                          Checked
                        </Text>
                      </Flex>
                    </Card>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Flex>
        </Section>

        {/* Code */}
        <Section title="Code" docLink="https://www.radix-ui.com/themes/docs/components/code">
          <Code>console.log('Hello, Radix!')</Code>
        </Section>

        {/* Dialog */}
        <Section title="Dialog" docLink="https://www.radix-ui.com/themes/docs/components/dialog">
          <Dialog.Root>
            <Dialog.Trigger>
              <Button>Open dialog</Button>
            </Dialog.Trigger>
            <Dialog.Content style={{ maxWidth: 400 }}>
              <Dialog.Title>Edit profile</Dialog.Title>
              <Dialog.Description>Make changes to your profile here.</Dialog.Description>
              <Flex direction="column" gap="3" mt="4">
                <TextField.Root placeholder="Name" />
                <TextField.Root placeholder="Email" />
                <Flex gap="3" justify="end" mt="2">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </Dialog.Close>
                  <Dialog.Close>
                    <Button>Save</Button>
                  </Dialog.Close>
                </Flex>
              </Flex>
            </Dialog.Content>
          </Dialog.Root>
        </Section>

        {/* Dropdown Menu — Solid / Soft × Accent / Gray */}
        <Section title="Dropdown Menu" docLink="https://www.radix-ui.com/themes/docs/components/dropdown-menu">
          <Flex direction="column" gap="4">
            {/* Column headers */}
            <Flex gap="6" align="center">
              <Box style={{ width: 56, flexShrink: 0 }} />
              <Text size="2" weight="medium" color="gray">Accent</Text>
              <Text size="2" weight="medium" color="gray">Gray</Text>
            </Flex>
            {/* Solid row */}
            <Flex gap="6" align="center">
              <Text size="2" color="gray" style={{ width: 56, flexShrink: 0 }}>Solid</Text>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="solid">
                    Options
                    <KeyboardArrowDown sx={{ fontSize: 14 }} style={{ marginLeft: 6 }} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item>New tab</DropdownMenu.Item>
                  <DropdownMenu.Item>New window</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item color="red">Delete</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="solid" color="gray">
                    Options
                    <KeyboardArrowDown sx={{ fontSize: 14 }} style={{ marginLeft: 6 }} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item>New tab</DropdownMenu.Item>
                  <DropdownMenu.Item>New window</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item color="red">Delete</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Flex>
            {/* Soft row */}
            <Flex gap="6" align="center">
              <Text size="2" color="gray" style={{ width: 56, flexShrink: 0 }}>Soft</Text>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="soft">
                    Options
                    <KeyboardArrowDown sx={{ fontSize: 14 }} style={{ marginLeft: 6 }} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item>New tab</DropdownMenu.Item>
                  <DropdownMenu.Item>New window</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item color="red">Delete</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="soft" color="gray">
                    Options
                    <KeyboardArrowDown sx={{ fontSize: 14 }} style={{ marginLeft: 6 }} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item>New tab</DropdownMenu.Item>
                  <DropdownMenu.Item>New window</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item color="red">Delete</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Flex>
          </Flex>
        </Section>

        {/* Heading / Text / Link / Em / Strong */}
        <Section title="Heading" docLink="https://www.radix-ui.com/themes/docs/components/heading">
          <Heading size="8" mb="2">The principles of the typographic craft</Heading>
          <Text size="3" color="gray">The goal of typography is to relate font size, line height, and line width in a proportional way.</Text>
        </Section>
        <Section title="Link" docLink="https://www.radix-ui.com/themes/docs/components/link">
          <Link href="#">Susan Kare</Link> is an American artist and graphic designer.
        </Section>
        <Section title="Em & Strong" docLink="https://www.radix-ui.com/themes/docs/components/em">
          <Text>Versions of the <Em>Lorem ipsum</Em> text have been used in typesetting. Remember to <Strong>stay positive</Strong>.</Text>
        </Section>

        {/* Icon Button */}
        <Section title="Icon Button" docLink="https://www.radix-ui.com/themes/docs/components/icon-button">
          <Flex gap="2">
            <IconButton variant="solid" radius="full" />
            <IconButton variant="soft" />
            <IconButton variant="outline" />
            <IconButton variant="ghost" />
          </Flex>
        </Section>

        {/* Inset */}
        <Section title="Inset" docLink="https://www.radix-ui.com/themes/docs/components/inset">
          <Inset side="all" clip="padding-box">
            <Box p="4" style={{ background: 'var(--gray-a3)' }}>
              <Text><Strong>Typography</Strong> is the art and technique of arranging type to make written language legible and appealing.</Text>
            </Box>
          </Inset>
        </Section>

        {/* Kbd */}
        <Section title="Kbd" docLink="https://www.radix-ui.com/themes/docs/components/kbd">
          <Text>Press <Kbd>⌘</Kbd> <Kbd>C</Kbd> to copy, or <Kbd>⌘</Kbd> <Kbd>D</Kbd> to toggle dark mode.</Text>
        </Section>

        {/* Popover */}
        <Section title="Popover" docLink="https://www.radix-ui.com/themes/docs/components/popover">
          <Popover.Root>
            <Popover.Trigger>
              <Button variant="soft">Comment</Button>
            </Popover.Trigger>
            <Popover.Content style={{ maxWidth: 280 }}>
              <Flex direction="column" gap="2">
                <Heading size="2">Leave a comment</Heading>
                <TextArea placeholder="Write something…" rows={3} />
                <Flex gap="2" justify="end">
                  <Popover.Close>
                    <Button variant="soft" color="gray">Cancel</Button>
                  </Popover.Close>
                  <Popover.Close>
                    <Button>Submit</Button>
                  </Popover.Close>
                </Flex>
              </Flex>
            </Popover.Content>
          </Popover.Root>
        </Section>

        {/* Progress */}
        <Section title="Progress" docLink="https://www.radix-ui.com/themes/docs/components/progress">
          <Progress value={65} style={{ width: 200 }} />
        </Section>

        {/* Quote */}
        <Section title="Quote" docLink="https://www.radix-ui.com/themes/docs/components/quote">
          <Quote>A man who would letterspace lower case would steal sheep, Frederic Goudy liked to say.</Quote>
        </Section>

        {/* Radio */}
        <Section title="Radio Group" docLink="https://www.radix-ui.com/themes/docs/components/radio-group">
          <RadioGroup.Root value={radioValue} onValueChange={setRadioValue}>
            <Flex direction="column" gap="2">
              <Text as="label" size="2"><RadioGroup.Item value="agree" /> Agree to Terms</Text>
              <Text as="label" size="2"><RadioGroup.Item value="disagree" /> Disagree</Text>
            </Flex>
          </RadioGroup.Root>
        </Section>

        {/* Scroll Area */}
        <Section title="Scroll Area" docLink="https://www.radix-ui.com/themes/docs/components/scroll-area">
          <ScrollArea style={{ width: 280, height: 120 }}>
            <Box p="2">
              <Text size="2">Three fundamental aspects of typography are legibility, readability, and aesthetics. Although in a non-technical sense "legible" and "readable" are often used synonymously, typographically they are separate but related concepts.</Text>
            </Box>
          </ScrollArea>
        </Section>

        {/* Select */}
        <Section title="Select" docLink="https://www.radix-ui.com/themes/docs/components/select">
          <Select.Root value={selectValue} onValueChange={setSelectValue}>
            <Select.Trigger placeholder="Choose a fruit…" style={{ minWidth: 160 }} />
            <Select.Content>
              <Select.Item value="apple">Apple</Select.Item>
              <Select.Item value="orange">Orange</Select.Item>
              <Select.Item value="banana">Banana</Select.Item>
            </Select.Content>
          </Select.Root>
        </Section>

        {/* Separator */}
        <Section title="Separator" docLink="https://www.radix-ui.com/themes/docs/components/separator">
          <Flex direction="column" gap="2" style={{ width: 200 }}>
            <Text size="2">Tools for building high-quality, accessible UI.</Text>
            <Separator size="4" />
            <Text size="2">Themes · Primitives · Icons · Colors</Text>
          </Flex>
        </Section>

        {/* Segmented Control */}
        <Section title="Segmented Control" docLink="https://www.radix-ui.com/themes/docs/components/segmented-control">
          <SegmentedControl.Root value={segment} onValueChange={setSegment}>
            <SegmentedControl.Item value="inbox">Inbox</SegmentedControl.Item>
            <SegmentedControl.Item value="sent">Sent</SegmentedControl.Item>
          </SegmentedControl.Root>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton" docLink="https://www.radix-ui.com/themes/docs/components/skeleton">
          <Card size="2" style={{ maxWidth: 320 }}>
            <Flex direction="column" gap="3">
              <Skeleton height="24px" width="60%" />
              <Skeleton height="20px" />
              <Skeleton height="20px" />
              <Skeleton height="32px" width="80px" />
            </Flex>
          </Card>
        </Section>

        {/* Slider */}
        <Section title="Slider" docLink="https://www.radix-ui.com/themes/docs/components/slider">
          <Slider defaultValue={[50]} style={{ width: 200 }} />
        </Section>

        {/* Spinner */}
        <Section title="Spinner" docLink="https://www.radix-ui.com/themes/docs/components/spinner">
          <Spinner size="3" />
        </Section>

        {/* Switch */}
        <Section title="Switch" docLink="https://www.radix-ui.com/themes/docs/components/switch">
          <Switch defaultChecked />
        </Section>

        {/* Table */}
        <Section title="Table" docLink="https://www.radix-ui.com/themes/docs/components/table">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Group</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              <Table.Row>
                <Table.Cell>Danilo Sousa</Table.Cell>
                <Table.Cell>danilo@example.com</Table.Cell>
                <Table.Cell>Developer</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>Zahra Ambessa</Table.Cell>
                <Table.Cell>zahra@example.com</Table.Cell>
                <Table.Cell>Admin</Table.Cell>
              </Table.Row>
            </Table.Body>
          </Table.Root>
        </Section>

        {/* Tabs */}
        <Section title="Tabs" docLink="https://www.radix-ui.com/themes/docs/components/tabs">
          <Tabs.Root value={tabValue} onValueChange={setTabValue}>
            <Tabs.List>
              <Tabs.Trigger value="account">Account</Tabs.Trigger>
              <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
            </Tabs.List>
            <Box pt="3">
              <Tabs.Content value="account">
                <Text size="2">Account settings and preferences.</Text>
              </Tabs.Content>
              <Tabs.Content value="documents">
                <Text size="2">Your documents and files.</Text>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Section>

        {/* TextField / TextArea */}
        <Section title="Text Field" docLink="https://www.radix-ui.com/themes/docs/components/text-field">
          <Flex direction="column" gap="2" style={{ maxWidth: 280 }}>
            <TextField.Root placeholder="Enter text…" />
            <TextArea placeholder="Multi-line placeholder…" rows={3} />
          </Flex>
        </Section>

        {/* Tooltip */}
        <Section title="Tooltip" docLink="https://www.radix-ui.com/themes/docs/components/tooltip">
          <Tooltip content="This is a tooltip">
            <Button variant="soft">Hover here</Button>
          </Tooltip>
        </Section>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="dashboard">
              <DashboardExample />
            </Tabs.Content>

            <Tabs.Content value="emea-org-chart">
              <Box pt="5">
                <EMEAOrgChart />
              </Box>
            </Tabs.Content>

            <Tabs.Content value="playground">
              <AIExampleBuilder />
            </Tabs.Content>
          </Tabs.Root>
        </Box>
      </Box>
    </Box>
  );
}
