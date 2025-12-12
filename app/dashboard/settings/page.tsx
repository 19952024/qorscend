"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Bell, Shield, Palette, Database, Save, Eye, EyeOff, Key, Smartphone, Globe, Lock, Trash2, Download } from "lucide-react"
import { useAuth, authenticatedFetch } from "@/hooks/use-auth"
import { toast } from "sonner"

type SettingsSection = 'profile' | 'notifications' | 'security' | 'appearance' | 'data-privacy'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { theme: activeTheme, setTheme: setThemeProvider } = useTheme()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Profile state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [organization, setOrganization] = useState("")

  // Notification preferences
  const [notifEmail, setNotifEmail] = useState(false)
  const [notifPush, setNotifPush] = useState(false)
  const [jobCompletionAlerts, setJobCompletionAlerts] = useState(false)
  const [weeklyReports, setWeeklyReports] = useState(false)
  const [quietHours, setQuietHours] = useState('')

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark')
  const [colorScheme, setColorScheme] = useState('blue')
  const [compactMode, setCompactMode] = useState(false)
  const [showAnimations, setShowAnimations] = useState(true)

  // Tool-specific preferences
  const [autoSaveConversions, setAutoSaveConversions] = useState(false)
  const [liveBenchmarks, setLiveBenchmarks] = useState(false)
  const [autoProcessData, setAutoProcessData] = useState(false)
  const [defaultQuantumLibrary, setDefaultQuantumLibrary] = useState('')
  const [preferredChartType, setPreferredChartType] = useState('')

  // Data & Privacy
  const [dataCollection, setDataCollection] = useState(true)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [marketingCommunications, setMarketingCommunications] = useState(false)
  const [dataRetention, setDataRetention] = useState<'30-days' | '6-months' | '1-year' | 'forever'>('1-year')

  // Security
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)

  // Fetch user settings function
  const fetchUserSettings = async () => {
    try {
      setIsLoadingSettings(true)
      console.log('⚙️ Fetching user settings...')
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })
      
      console.log('📡 Settings response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Settings response:', data)
        
        if (data.success && data.data) {
          const settings = data.data
          
          // Set profile data
          setFirstName(settings.firstName || user?.name?.split(' ')[0] || '')
          setLastName(settings.lastName || user?.name?.split(' ').slice(1).join(' ') || '')
          setEmail(user?.email || '')
          setOrganization(settings.organization || '')
          
          // Set tool preferences
          if (settings.toolPreferences) {
            setAutoSaveConversions(settings.toolPreferences.autoSaveConversions ?? false)
            setLiveBenchmarks(settings.toolPreferences.liveBenchmarks ?? false)
            setAutoProcessData(settings.toolPreferences.autoProcessData ?? false)
            setDefaultQuantumLibrary(settings.toolPreferences.defaultQuantumLibrary || 'qiskit')
            setPreferredChartType(settings.toolPreferences.preferredChartType || 'line')
          }
          
          // Set appearance settings
          if (settings.appearance) {
            const appliedTheme = settings.appearance.theme || 'dark'
            setTheme(appliedTheme)
            try { setThemeProvider(appliedTheme as any) } catch {}
            setColorScheme(settings.appearance.colorScheme || 'blue')
            setCompactMode(settings.appearance.compactMode ?? false)
            setShowAnimations(settings.appearance.showAnimations ?? true)
          }
          
          // Set notification settings
          if (settings.notifications) {
            setNotifEmail(settings.notifications.email ?? false)
            setNotifPush(settings.notifications.push ?? false)
            setJobCompletionAlerts(settings.notifications.jobCompletionAlerts ?? false)
            setWeeklyReports(settings.notifications.weeklyReports ?? false)
            setQuietHours(settings.notifications.quietHours || '')
          }

          // Set data & privacy
          if (settings.dataPrivacy) {
            setDataCollection(settings.dataPrivacy.dataCollection ?? true)
            setAnalyticsEnabled(settings.dataPrivacy.analytics ?? true)
            setMarketingCommunications(settings.dataPrivacy.marketingCommunications ?? false)
            setDataRetention(settings.dataPrivacy.dataRetention || '1-year')
          }
          
          console.log('⚙️ Settings loaded successfully')
        }
      } else {
        console.log('⚠️ Settings API not available, showing empty state')
        setFirstName(user?.name?.split(' ')[0] || '')
        setLastName(user?.name?.split(' ').slice(1).join(' ') || '')
        setEmail(user?.email || '')
        setOrganization('')
        setAutoSaveConversions(false)
        setLiveBenchmarks(false)
        setAutoProcessData(false)
        setDefaultQuantumLibrary('qiskit')
        setPreferredChartType('line')
        setTheme('dark')
        setColorScheme('blue')
        setCompactMode(false)
        setShowAnimations(true)
        setNotifEmail(false)
        setNotifPush(false)
        setJobCompletionAlerts(false)
        setWeeklyReports(false)
        setQuietHours('')
      }
    } catch (error) {
      console.log('⚠️ Settings API error, showing empty state:', error)
      setFirstName(user?.name?.split(' ')[0] || '')
      setLastName(user?.name?.split(' ')?.slice(1)?.join(' ') || '')
      setEmail(user?.email || '')
      setOrganization('')
      setAutoSaveConversions(false)
      setLiveBenchmarks(false)
      setAutoProcessData(false)
      setDefaultQuantumLibrary('qiskit')
      setPreferredChartType('line')
      setTheme('dark')
      setColorScheme('blue')
      setCompactMode(false)
      setShowAnimations(true)
      setNotifEmail(false)
      setNotifPush(false)
      setJobCompletionAlerts(false)
      setWeeklyReports(false)
      setQuietHours('')
    } finally {
      setIsLoadingSettings(false)
    }
  }

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      setIsLoadingSessions(true)
      console.log('🔐 Fetching active sessions...')
      
      const response = await fetch('/api/settings/sessions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Sessions response:', data)
        
        if (data.success && data.data) {
          setActiveSessions(data.data)
          console.log('🔐 Sessions loaded successfully')
        }
      } else {
        console.log('⚠️ Sessions API not available, showing empty state')
        setActiveSessions([])
      }
    } catch (error) {
      console.log('⚠️ Sessions API error, showing empty state:', error)
      setActiveSessions([])
    } finally {
      setIsLoadingSessions(false)
    }
  }

  // Load initial values from backend
  useEffect(() => {
    if (user) {
      fetchUserSettings()
      fetchActiveSessions()
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      console.log('💾 Saving user settings...')
      
      const settingsPayload = {
        firstName,
        lastName,
        organization,
        toolPreferences: {
          autoSaveConversions,
          liveBenchmarks,
          autoProcessData,
          defaultQuantumLibrary,
          preferredChartType
        },
        appearance: {
          theme,
          colorScheme,
          compactMode,
          showAnimations
        },
        notifications: {
          email: notifEmail,
          push: notifPush,
          jobCompletionAlerts,
          weeklyReports,
          quietHours
        },
        dataPrivacy: {
          dataCollection,
          analytics: analyticsEnabled,
          marketingCommunications,
          dataRetention
        }
      }
      
      console.log('📤 Settings payload:', settingsPayload)
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify(settingsPayload)
      })
      
      console.log('📡 Save response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Save response:', data)
        
        if (data.success) {
          console.log('✅ Settings saved successfully')
          setHasChanges(false)
          
          // Update the user profile with new name if it changed
          if (user && (firstName !== user.name?.split(' ')[0] || lastName !== user.name?.split(' ').slice(1).join(' '))) {
            const newFullName = `${firstName} ${lastName}`.trim()
            if (newFullName && newFullName !== user.name) {
              updateUser({ name: newFullName })
            }
          }
          
          // Show success notification
          toast.success("Settings saved successfully!")
        } else {
          throw new Error(data.error || 'Failed to save settings')
        }
      } else {
        console.log('⚠️ Settings API not available, save failed')
        throw new Error('Settings API not available')
      }
    } catch (e: any) {
      console.error('💥 Error saving settings:', e)
      toast.error(e?.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = () => {
    setHasChanges(true)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      })

      if (response.ok) {
        alert('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }
    } catch (error: any) {
      alert(error.message || 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settings/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('qorscend_token')}`
        }
      })

      if (response.ok) {
        setActiveSessions(prev => prev.filter(session => session._id !== sessionId))
      } else {
        throw new Error('Failed to terminate session')
      }
    } catch (error: any) {
      console.error('💥 Error terminating session:', error)
      alert(error?.message || 'Failed to terminate session')
    }
  }

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
  return (
      <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>Manage your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-muted-foreground">Loading profile settings...</span>
                  </div>
                ) : (
                  <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => { setFirstName(e.target.value); handleInputChange() }} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => { setLastName(e.target.value); handleInputChange() }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                      <Input id="organization" placeholder="Enter your organization" value={organization} onChange={(e) => { setOrganization(e.target.value); handleInputChange() }} />
                </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Tool Preferences
                </CardTitle>
                <CardDescription>Configure default settings for QORSCEND tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-muted-foreground">Loading tool preferences...</span>
                  </div>
                ) : (
                  <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save conversions</Label>
                      <p className="text-sm text-muted-foreground">Automatically save QCode Convert results</p>
                    </div>
                    <Switch checked={autoSaveConversions} onCheckedChange={(v) => { setAutoSaveConversions(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Real-time benchmarks</Label>
                      <p className="text-sm text-muted-foreground">Enable live updates in QBenchmark Live</p>
                    </div>
                    <Switch checked={liveBenchmarks} onCheckedChange={(v) => { setLiveBenchmarks(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-process data</Label>
                      <p className="text-sm text-muted-foreground">Automatically clean uploaded data in QData Clean</p>
                    </div>
                    <Switch checked={autoProcessData} onCheckedChange={(v) => { setAutoProcessData(v); handleInputChange() }} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default quantum library</Label>
                        <Select value={defaultQuantumLibrary} onValueChange={(value) => { setDefaultQuantumLibrary(value); handleInputChange() }}>
                      <SelectTrigger>
                            <SelectValue placeholder="Select quantum library" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qiskit">Qiskit</SelectItem>
                        <SelectItem value="cirq">Cirq</SelectItem>
                        <SelectItem value="braket">Amazon Braket</SelectItem>
                        <SelectItem value="pennylane">PennyLane</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferred chart type</Label>
                        <Select value={preferredChartType} onValueChange={(value) => { setPreferredChartType(value); handleInputChange() }}>
                      <SelectTrigger>
                            <SelectValue placeholder="Select chart type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Configure how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={(v) => { setNotifEmail(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                    </div>
                    <Switch checked={notifPush} onCheckedChange={(v) => { setNotifPush(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Job completion alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when quantum jobs complete</p>
                    </div>
                    <Switch checked={jobCompletionAlerts} onCheckedChange={(v) => { setJobCompletionAlerts(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly reports</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly usage and performance reports</p>
                    </div>
                    <Switch checked={weeklyReports} onCheckedChange={(v) => { setWeeklyReports(v); handleInputChange() }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Schedule</CardTitle>
                <CardDescription>Set your preferred notification timing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quiet hours</Label>
                  <Select value={quietHours} onValueChange={(value) => { setQuietHours(value); handleInputChange() }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22:00-08:00">10:00 PM - 8:00 AM</SelectItem>
                      <SelectItem value="23:00-07:00">11:00 PM - 7:00 AM</SelectItem>
                      <SelectItem value="00:00-06:00">12:00 AM - 6:00 AM</SelectItem>
                      <SelectItem value="none">No quiet hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current password</Label>
                    <Input type="password" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>New password</Label>
                    <Input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm new password</Label>
                    <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <Button variant="outline" onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active login sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSessions ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-muted-foreground">Loading sessions...</span>
                  </div>
                ) : activeSessions.length > 0 ? (
                  activeSessions.map((session) => (
                    <div key={session._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                          <div className="font-medium">
                            {session.deviceInfo?.browser} on {session.deviceInfo?.os}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {session.isCurrent ? 'Active now' : 'Last active recently'}
                          </div>
                        </div>
                      </div>
                      {session.isCurrent ? (
                        <Badge variant="secondary">Current</Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTerminateSession(session._id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    No active sessions found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>Customize the look and feel of your QORSCEND interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingSettings ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-muted-foreground">Loading appearance settings...</span>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                      <Select value={theme} onValueChange={(v: any) => { setTheme(v); setThemeProvider(v); handleInputChange() }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color scheme</Label>
                    <Select value={colorScheme} onValueChange={(v) => { setColorScheme(v); handleInputChange() }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce spacing for a more compact layout</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={(v) => { setCompactMode(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth transitions and animations</p>
                    </div>
                    <Switch checked={showAnimations} onCheckedChange={(v) => { setShowAnimations(v); handleInputChange() }} />
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      case 'data-privacy':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>Manage your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Data collection</Label>
                      <p className="text-sm text-muted-foreground">Allow QORSCEND to collect usage data for improvements</p>
                    </div>
                    <Switch checked={dataCollection} onCheckedChange={(v) => { setDataCollection(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics</Label>
                      <p className="text-sm text-muted-foreground">Share anonymous analytics data</p>
                    </div>
                    <Switch checked={analyticsEnabled} onCheckedChange={(v) => { setAnalyticsEnabled(v); handleInputChange() }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing communications</Label>
                      <p className="text-sm text-muted-foreground">Receive marketing emails and updates</p>
                    </div>
                    <Switch checked={marketingCommunications} onCheckedChange={(v) => { setMarketingCommunications(v); handleInputChange() }} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Data retention</Label>
                    <Select value={dataRetention} onValueChange={(v: any) => { setDataRetention(v); handleInputChange() }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30-days">30 days</SelectItem>
                        <SelectItem value="6-months">6 months</SelectItem>
                        <SelectItem value="1-year">1 year</SelectItem>
                        <SelectItem value="forever">Forever</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy Policy</CardTitle>
                <CardDescription>Review our privacy policy and terms of service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    We respect your privacy and are committed to protecting your personal data. 
                    Our privacy policy explains how we collect, use, and safeguard your information.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View Privacy Policy</Button>
                    <Button variant="outline" size="sm">Terms of Service</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your QORSCEND account preferences and tool configurations.</p>
            </div>
            {hasChanges && (
              <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                Unsaved Changes
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Navigation */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant={activeSection === 'profile' ? 'default' : 'ghost'} 
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection === 'profile' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setActiveSection('profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button 
                  variant={activeSection === 'notifications' ? 'default' : 'ghost'} 
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection === 'notifications' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setActiveSection('notifications')}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button 
                  variant={activeSection === 'security' ? 'default' : 'ghost'} 
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection === 'security' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setActiveSection('security')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </Button>
                <Button 
                  variant={activeSection === 'appearance' ? 'default' : 'ghost'} 
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection === 'appearance' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setActiveSection('appearance')}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Appearance
                </Button>
                <Button 
                  variant={activeSection === 'data-privacy' ? 'default' : 'ghost'} 
                  className={`w-full justify-start transition-all duration-200 ${
                    activeSection === 'data-privacy' 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'hover:bg-gray-800/50 hover:text-white'
                  }`}
                  onClick={() => setActiveSection('data-privacy')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Data & Privacy
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {renderSectionContent()}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className={hasChanges ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" : ""}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
