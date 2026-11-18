import { useMemo, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  MantineProvider,
  Modal,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Stepper,
  Text,
  ThemeIcon,
  Title,
  type MantineColorsTuple,
} from '@mantine/core'
import mfaOptions from './data/data.json'
import queensLogo from './assets/Queens-university-logo-horizontal-digital-rgb-full-colour-reverse-website.svg'
import './App.css'
import '@mantine/core/styles.css'

type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux'

type MfaOption = {
  id: string
  name: string
  vendor: string
  type: string
  free?: boolean
  platforms: string[]
  accountTypes: string[]
  availableMethods: string[]
  minimumVersions?: Partial<Record<Platform, string>>
  passkeyStorage?: 'synced' | 'device-bound' | 'hardware'
  verificationStatus?: 'needs-internal-confirmation'
  requiresSmartphone: boolean
  requiresInstallRights: boolean
  requiresHardwarePurchase?: boolean
  supportsPush: boolean
  supportsTotp: boolean
  supportsOfflineCodes: boolean
  supportsPasskeys: boolean
  recommendedRank: number
  availability: string
  setupUrl: string
  description: string
  productUrl?: string
  sourceUrl?: string
  iconUrl?: string
  storeUrls?: Partial<Record<Platform, string>>
}

const deviceChoices = [
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'Mac' },
  { value: 'linux', label: 'Linux' },
  { value: 'ios', label: 'iPhone' },
  { value: 'android', label: 'Android' },
]

const platformVersionChoices: Record<Platform, { value: string; label: string }[]> = {
  windows: [
    { value: 'windows-11', label: 'Windows 11' },
    { value: 'windows-10', label: 'Windows 10' },
    { value: 'windows-older', label: 'Windows 8.1 or earlier' },
    { value: 'unknown', label: "I don't know" },
  ],
  macos: [
    { value: 'macos-26', label: 'macOS Tahoe (26)' },
    { value: 'macos-15', label: 'macOS Sequoia (15)' },
    { value: 'macos-14', label: 'macOS Sonoma (14)' },
    { value: 'macos-13', label: 'macOS Ventura (13)' },
    { value: 'macos-12-or-older', label: 'macOS Monterey (12) or earlier' },
    { value: 'unknown', label: "I don't know" },
  ],
  linux: [
    { value: 'ubuntu-2404', label: 'Ubuntu 24.04 LTS' },
    { value: 'ubuntu-2204', label: 'Ubuntu 22.04 LTS' },
    { value: 'fedora-42', label: 'Fedora 42' },
    { value: 'debian-13', label: 'Debian 13' },
    { value: 'linux-other', label: 'Another Linux version' },
    { value: 'unknown', label: "I don't know" },
  ],
  ios: [
    { value: 'ios-26', label: 'iOS 26' },
    { value: 'ios-18', label: 'iOS 18' },
    { value: 'ios-17', label: 'iOS 17' },
    { value: 'ios-16', label: 'iOS 16' },
    { value: 'ios-15', label: 'iOS 15' },
    { value: 'ios-14-or-older', label: 'iOS 14 or earlier' },
    { value: 'unknown', label: "I don't know" },
  ],
  android: [
    { value: 'android-16', label: 'Android 16' },
    { value: 'android-15', label: 'Android 15' },
    { value: 'android-14', label: 'Android 14' },
    { value: 'android-13', label: 'Android 13' },
    { value: 'android-12', label: 'Android 12' },
    { value: 'android-11', label: 'Android 11' },
    { value: 'android-10', label: 'Android 10' },
    { value: 'android-9', label: 'Android 9' },
    { value: 'android-8-or-older', label: 'Android 8 or earlier' },
    { value: 'unknown', label: "I don't know" },
  ],
}

const accountChoices = [
  { value: 'employee', label: 'Employee' },
  { value: 'student', label: 'Student' },
  { value: 'retiree', label: 'Retiree' },
  { value: 'alumni', label: 'Alumni' },
]

const queensBlue: MantineColorsTuple = [
  '#e8eef5', '#c7d4e4', '#9fb4cf', '#7291b5', '#486f9c',
  '#234e7e', '#002452', '#001e46', '#00183a', '#00122e',
]
const queensGold: MantineColorsTuple = [
  '#fff9e6', '#fff0bd', '#ffe58f', '#ffda61', '#fbd03a',
  '#fac524', '#fabd0f', '#df9d00', '#ad7900', '#785300',
]

function formatType(type: string) {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function App() {
  const [activeStep, setActiveStep] = useState(0)
  const [device, setDevice] = useState<Platform | null>(null)
  const [deviceVersion, setDeviceVersion] = useState<string | null>(null)
  const [accountType, setAccountType] = useState<string | null>(null)
  const [optionIndex, setOptionIndex] = useState(0)
  const [guideOption, setGuideOption] = useState<MfaOption | null>(null)

  const availableOptions = useMemo(() => {
    return (mfaOptions as MfaOption[])
      .filter((option) => {
        const platformMatches = !device
          || option.platforms.includes(device)
          || option.platforms.includes('universal')
        const accountMatches = !accountType || option.accountTypes.includes(accountType)
        const minimumVersion = device ? option.minimumVersions?.[device] : undefined
        const selectedVersionIndex = device && deviceVersion
          ? platformVersionChoices[device].findIndex((version) => version.value === deviceVersion)
          : -1
        const minimumVersionIndex = device && minimumVersion
          ? platformVersionChoices[device].findIndex((version) => version.value === minimumVersion)
          : -1
        const versionMatches = !minimumVersion
          || !deviceVersion
          || deviceVersion === 'unknown'
          || minimumVersionIndex === -1
          || selectedVersionIndex <= minimumVersionIndex

        return platformMatches
          && accountMatches
          && versionMatches
          && option.verificationStatus !== 'needs-internal-confirmation'
      })
      .sort((a, b) => a.recommendedRank - b.recommendedRank)
  }, [device, deviceVersion, accountType])

  const currentOption = availableOptions[optionIndex]
  const getOptionUrl = (option: MfaOption) => device
    ? option.storeUrls?.[device] ?? option.productUrl ?? option.setupUrl
    : option.productUrl ?? option.setupUrl
  const currentOptionUrl = currentOption ? getOptionUrl(currentOption) : undefined
  const guideOptionUrl = guideOption ? getOptionUrl(guideOption) : undefined
  const deviceVersionLabel = device && deviceVersion
    ? platformVersionChoices[device].find((version) => version.value === deviceVersion)?.label
    : undefined
  const completed = activeStep === 2 && optionIndex >= availableOptions.length
  const progress = availableOptions.length
    ? Math.min((optionIndex / availableOptions.length) * 100, 100)
    : 0

  const continueToOptions = () => {
    setOptionIndex(0)
    setActiveStep(2)
  }

  const nextOption = () => setOptionIndex((index) => index + 1)

  const restart = () => {
    setActiveStep(0)
    setDevice(null)
    setDeviceVersion(null)
    setAccountType(null)
    setOptionIndex(0)
    setGuideOption(null)
  }

  return (
    <MantineProvider theme={{ primaryColor: 'queensBlue', colors: { queensBlue, queensGold } }}>
      <main className="app-shell">
        <header className="topbar">
          <a className="brand" href="https://www.queensu.ca/" aria-label="Queen's University home">
            <img className="brand-logo" src={queensLogo} alt="Queen's University" />
          </a>
          {/* <span className="topbar-note">QUEEN'S UNIVERSITY · MULTI-FACTOR AUTHENTICATION</span> */}
        </header>

        <section className="intro" id="top">
          {/* <div className="eyebrow"><span /> A better way to sign in</div> */}
          <Title order={1}>Choose an MFA method</Title>
          <Text className="intro-copy">
            Tell us which device you use and what type of account you have.<br/>We'll show you the available options.
          </Text>
        </section>

        <Card className="quiz-card" radius="xl" padding={0} withBorder>
          <div className="stepper-wrap">
            <Stepper active={activeStep} onStepClick={(step) => step < activeStep && setActiveStep(step)}>
              <Stepper.Step label="Device" description="Choose your device" />
              <Stepper.Step label="Account" description="Choose your account type" />
              <Stepper.Step label="Options" description="Review MFA methods" />
            </Stepper>
          </div>

          <Divider />

          <div className="quiz-content">
            {activeStep === 0 && (
              <Stack gap="lg">
                <div>
                  <Text className="question-kicker">STEP 1 OF 3</Text>
                  <Title order={2}>Which device will you use?</Title>
                  <Text className="question-hint">Choose the device you use to sign in to your Queen's account.</Text>
                </div>
                <SimpleGrid className="device-fields" cols={{ base: 1, sm: 2 }} spacing="md">
                  <Select
                    label="Device or operating system"
                    placeholder="Select a device"
                    data={deviceChoices}
                    value={device}
                    onChange={(value) => {
                      setDevice(value as Platform | null)
                      setDeviceVersion(null)
                    }}
                    size="md"
                    radius="md"
                    comboboxProps={{ withinPortal: false }}
                  />
                  <Select
                    label="Version"
                    placeholder={device ? 'Select a version' : 'Select a device first'}
                    data={device ? platformVersionChoices[device] : []}
                    value={deviceVersion}
                    onChange={setDeviceVersion}
                    disabled={!device}
                    size="md"
                    radius="md"
                    comboboxProps={{ withinPortal: false }}
                  />
                </SimpleGrid>
                <Text className="question-hint version-hint">
                  If you're unsure, select “I don't know.”
                </Text>
                <div className="step-actions">
                  <Button
                    size="md"
                    radius="md"
                    rightSection={<span aria-hidden="true">→</span>}
                    disabled={!device || !deviceVersion}
                    onClick={() => setActiveStep(1)}
                  >
                    Next
                  </Button>
                </div>
              </Stack>
            )}

            {activeStep === 1 && (
              <Stack gap="lg">
                <div>
                  <Text className="question-kicker">STEP 2 OF 3</Text>
                  <Title order={2}>Which type of Queen's account do you have?</Title>
                  <Text className="question-hint">Choose the role that applies to your account.</Text>
                </div>
                <Select
                  label="Account type"
                  placeholder="Select an account type"
                  data={accountChoices}
                  value={accountType}
                  onChange={setAccountType}
                  size="md"
                  radius="md"
                  comboboxProps={{ withinPortal: false }}
                />
                <div className="step-actions split-actions">
                  <Button variant="subtle" color="gray" size="md" onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button
                    size="md"
                    radius="md"
                    rightSection={<span aria-hidden="true">→</span>}
                    disabled={!accountType}
                    onClick={continueToOptions}
                  >
                    View MFA options
                  </Button>
                </div>
              </Stack>
            )}

            {activeStep === 2 && !completed && currentOption && (
              <Stack gap="lg">
                <div className="options-heading">
                  <div>
                    <Text className="question-kicker">STEP 3 OF 3</Text>
                    <Title order={2}>Available MFA methods</Title>
                  </div>
                  <Badge variant="light" color="queensBlue" size="lg" radius="sm">
                    {optionIndex + 1} of {availableOptions.length}
                  </Badge>
                </div>

                <Progress value={progress} size="xs" radius="xl" color="queensBlue" />

                <Card className="option-card" radius="lg" padding="xl" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <a
                      className="option-icon-link"
                      href={currentOptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${currentOption.name} official page`}
                    >
                      <span className="option-symbol" aria-hidden="true">
                        <span className="option-symbol-fallback">🛡️</span>
                        {currentOption.iconUrl && (
                          <img
                            src={currentOption.iconUrl}
                            alt=""
                            loading="lazy"
                            onError={(event) => event.currentTarget.remove()}
                          />
                        )}
                      </span>
                    </a>
                    <Badge
                      color="queensBlue"
                      variant="light"
                      radius="sm"
                    >
                      {currentOption.availability === 'recommended' ? 'Recommended' : formatType(currentOption.type)}
                    </Badge>
                  </Group>
                  <Text className="option-number">OPTION {optionIndex + 1}</Text>
                  <Title order={3}>{currentOption.name}</Title>
                  <Text className="option-vendor">by {currentOption.vendor}</Text>
                  <Text className="option-description">{currentOption.description}</Text>

                  <Group className="option-tags" gap="xs">
                    {currentOption.free !== undefined && (
                      <Badge variant="outline" color="gray" radius="sm">{currentOption.free ? 'Free' : 'Paid'}</Badge>
                    )}
                    {currentOption.availableMethods.includes('passkey') && <Badge variant="outline" color="gray" radius="sm">Passkeys</Badge>}
                    {currentOption.availableMethods.includes('totp') && <Badge variant="outline" color="gray" radius="sm">Authenticator codes</Badge>}
                    {currentOption.requiresHardwarePurchase && <Badge variant="outline" color="gray" radius="sm">Hardware required</Badge>}
                  </Group>

                  <Divider my="lg" />
                  <Group className="option-actions" justify="space-between">
                    <Button variant="subtle" color="gray" onClick={nextOption}>
                      Skip this option <span aria-hidden="true">→</span>
                    </Button>
                    <Button radius="md" onClick={() => setGuideOption(currentOption)}>
                      View setup instructions
                    </Button>
                  </Group>
                </Card>

                <Text className="account-context">
                  Options for your {accountChoices.find((item) => item.value === accountType)?.label.toLowerCase()} account on {deviceChoices.find((item) => item.value === device)?.label} ({deviceVersionLabel}).
                </Text>
              </Stack>
            )}

            {activeStep === 2 && !completed && !currentOption && (
              <Alert color="queensGold" title="No options available">
                No MFA methods are listed for this device. Contact ITS for assistance.
              </Alert>
            )}

            {completed && (
              <Stack className="complete-state" align="center" gap="md">
                <ThemeIcon size={64} radius="xl" variant="light" color="queensBlue" aria-hidden="true">
                  ✓
                </ThemeIcon>
                <Text className="question-kicker">COMPLETE</Text>
                <Title order={2}>You've reviewed all available methods.</Title>
                <Text className="complete-copy">
                  If you're unsure which method to use, contact ITS for advice.
                </Text>
                <Button radius="md" onClick={restart}>Review options again</Button>
              </Stack>
            )}
          </div>
        </Card>

        {/* <footer className="page-footer">
          <a href="https://www.queensu.ca/its/contact-us" target="_blank" rel="noopener noreferrer">
            Need help? Contact ITS.
          </a>
        </footer> */}

        <section className="comparison-section" aria-labelledby="comparison-title">
          <div className="comparison-heading">
            <div>
              <Text className="question-kicker">MFA METHODS</Text>
              <Title order={2} id="comparison-title">Compare available options</Title>
              <Text className="comparison-intro">
                Review the methods below. The list updates to match your device, version, and account selections above.
              </Text>
            </div>
            <Badge variant="light" color="queensBlue" size="lg" radius="sm">
              {availableOptions.length} {availableOptions.length === 1 ? 'method' : 'methods'}
            </Badge>
          </div>

          {availableOptions.length > 0 ? (
            <SimpleGrid className="comparison-grid" cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {availableOptions.map((option) => (
                <Card className="comparison-option" key={option.id} radius="lg" padding="lg" withBorder>
                  <Group justify="space-between" align="flex-start" mb="md">
                    <a
                      className="comparison-icon-link"
                      href={getOptionUrl(option)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${option.name} official page`}
                    >
                      <span className="comparison-icon" aria-hidden="true">
                        <span className="comparison-icon-fallback">🛡️</span>
                        {option.iconUrl && (
                          <img
                            src={option.iconUrl}
                            alt=""
                            loading="lazy"
                            onError={(event) => event.currentTarget.remove()}
                          />
                        )}
                      </span>
                    </a>
                    <Badge color="queensBlue" variant="light" radius="sm">
                      {option.availability === 'recommended' ? 'Recommended' : formatType(option.type)}
                    </Badge>
                  </Group>

                  <Title order={3}>{option.name}</Title>
                  <Text className="comparison-vendor">{option.vendor}</Text>
                  <Text className="comparison-description">{option.description}</Text>

                  <Group className="comparison-tags" gap="xs">
                    {option.free !== undefined && (
                      <Badge variant="outline" color="gray" radius="sm">{option.free ? 'Free' : 'Paid'}</Badge>
                    )}
                    {option.availableMethods.includes('passkey') && <Badge variant="outline" color="gray" radius="sm">Passkey</Badge>}
                    {option.availableMethods.includes('push') && <Badge variant="outline" color="gray" radius="sm">Push approval</Badge>}
                    {option.availableMethods.includes('totp') && <Badge variant="outline" color="gray" radius="sm">One-time codes</Badge>}
                    {option.requiresHardwarePurchase && <Badge variant="outline" color="gray" radius="sm">Hardware required</Badge>}
                  </Group>

                  <Divider my="md" />
                  <Text className="comparison-detail-label">Works on</Text>
                  <Text className="comparison-detail">
                    {option.platforms.includes('universal')
                      ? 'All devices'
                      : option.platforms.map((platform) => deviceChoices.find((choice) => choice.value === platform)?.label ?? platform).join(', ')}
                  </Text>
                  <Text className="comparison-detail-label">Eligible accounts</Text>
                  <Text className="comparison-detail">
                    {option.accountTypes.map((type) => accountChoices.find((choice) => choice.value === type)?.label ?? type).join(', ')}
                  </Text>
                  <a className="comparison-product-link" href={getOptionUrl(option)} target="_blank" rel="noopener noreferrer">
                    Product and setup information <span aria-hidden="true">↗</span>
                  </a>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Alert color="queensGold" title="No matching methods">
              Change your device, version, or account selection above, or contact ITS for help.
            </Alert>
          )}
        </section>

        <footer className="page-footer">
          <a href="https://www.queensu.ca/its/contact-us" target="_blank" rel="noopener noreferrer">
            Need help? Contact ITS.
          </a>
        </footer>

        <Modal
          opened={guideOption !== null}
          onClose={() => setGuideOption(null)}
          title="Setup instructions"
          centered
          radius="lg"
        >
          {guideOption && (
            <Stack gap="md">
              <div>
                <Text fw={700} size="lg">{guideOption.name}</Text>
                <Text c="dimmed" size="sm">{guideOption.description}</Text>
              </div>
              <Alert color="queensBlue" title="Queen's setup guide">
                Open the official product or setup information:
                {' '}<a href={guideOptionUrl} target="_blank" rel="noopener noreferrer">View {guideOption.name} information</a>.
              </Alert>
              <Group justify="flex-end">
                <Button variant="subtle" color="gray" onClick={() => setGuideOption(null)}>Close</Button>
                <Button onClick={() => { setGuideOption(null); nextOption() }}>
                  Next method <span aria-hidden="true">→</span>
                </Button>
              </Group>
            </Stack>
          )}
        </Modal>
      </main>
    </MantineProvider>
  )
}

export default App
