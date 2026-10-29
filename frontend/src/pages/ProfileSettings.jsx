import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Save, LockKeyhole, Bell, UserRound } from 'lucide-react'
import api from '../api/axios'
import Sidebar from '../components/Sidebar'

export default function ProfileSettings() {
  const [profile, setProfile] = useState({ username: '', email: '' })
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
  })
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    in_app_notifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const [profileResponse, preferencesResponse] = await Promise.all([
          api.get('/users/me'),
          api.get('/settings/notifications'),
        ])

        if (!active) return

        setProfile({
          username: profileResponse.data.username || '',
          email: profileResponse.data.email || '',
        })
        setPreferences({
          email_notifications: preferencesResponse.data.email_notifications,
          in_app_notifications: preferencesResponse.data.in_app_notifications,
        })
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.detail || 'Could not load profile settings.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [])

  async function saveProfile(event) {
    event.preventDefault()
    setSavingProfile(true)

    try {
      const response = await api.patch('/settings/profile', {
        username: profile.username,
        email: profile.email,
      })
      setProfile({
        username: response.data.username,
        email: response.data.email,
      })
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setSavingPassword(true)

    try {
      const response = await api.post('/settings/change-password', passwords)
      toast.success(response.data.message || 'Password changed successfully.')
      setPasswords({ current_password: '', new_password: '' })
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function savePreferences(event) {
    event.preventDefault()
    setSavingPreferences(true)

    try {
      const response = await api.put('/settings/notifications', preferences)
      setPreferences({
        email_notifications: response.data.email_notifications,
        in_app_notifications: response.data.in_app_notifications,
      })
      toast.success('Notification preferences saved.')
    } catch (error) {
      toast.error(
        error.response?.data?.detail || 'Could not save notification preferences.',
      )
    } finally {
      setSavingPreferences(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  const cardClass =
    'rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="min-w-0 flex-1 p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Profile & Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your account details, password and notification preferences.
            </p>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading your settings...</p>
          ) : (
            <div className="space-y-6">
              <section className={cardClass}>
                <div className="mb-5 flex items-center gap-3">
                  <UserRound className="text-blue-600" size={23} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Profile information
                  </h2>
                </div>

                <form onSubmit={saveProfile} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      id="username"
                      className={inputClass}
                      minLength={3}
                      maxLength={50}
                      required
                      value={profile.username}
                      onChange={(event) =>
                        setProfile({ ...profile, username: event.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={inputClass}
                      required
                      value={profile.email}
                      onChange={(event) =>
                        setProfile({ ...profile, email: event.target.value })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save size={17} />
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </button>
                </form>
              </section>

              <section className={cardClass}>
                <div className="mb-5 flex items-center gap-3">
                  <LockKeyhole className="text-blue-600" size={23} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Change password
                  </h2>
                </div>

                <form onSubmit={changePassword} className="space-y-4">
                  <div>
                    <label htmlFor="current_password" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Current password
                    </label>
                    <input
                      id="current_password"
                      type="password"
                      autoComplete="current-password"
                      className={inputClass}
                      required
                      maxLength={128}
                      value={passwords.current_password}
                      onChange={(event) =>
                        setPasswords({
                          ...passwords,
                          current_password: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label htmlFor="new_password" className="mb-1.5 block text-sm font-medium text-gray-700">
                      New password (at least 8 characters)
                    </label>
                    <input
                      id="new_password"
                      type="password"
                      autoComplete="new-password"
                      className={inputClass}
                      required
                      minLength={8}
                      maxLength={128}
                      value={passwords.new_password}
                      onChange={(event) =>
                        setPasswords({
                          ...passwords,
                          new_password: event.target.value,
                        })
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <LockKeyhole size={17} />
                    {savingPassword ? 'Updating...' : 'Change password'}
                  </button>
                </form>
              </section>

              <section className={cardClass}>
                <div className="mb-5 flex items-center gap-3">
                  <Bell className="text-blue-600" size={23} />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Notification preferences
                  </h2>
                </div>

                <form onSubmit={savePreferences} className="space-y-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-blue-600"
                      checked={preferences.email_notifications}
                      onChange={(event) =>
                        setPreferences({
                          ...preferences,
                          email_notifications: event.target.checked,
                        })
                      }
                    />
                    <span>
                      <span className="block font-medium text-gray-800">
                        Email notifications
                      </span>
                      <span className="text-sm text-gray-500">
                        Save your preference for receiving email notifications.
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-blue-600"
                      checked={preferences.in_app_notifications}
                      onChange={(event) =>
                        setPreferences({
                          ...preferences,
                          in_app_notifications: event.target.checked,
                        })
                      }
                    />
                    <span>
                      <span className="block font-medium text-gray-800">
                        In-app notifications
                      </span>
                      <span className="text-sm text-gray-500">
                        Save your preference for notifications within WorkSphere.
                      </span>
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={savingPreferences}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save size={17} />
                    {savingPreferences ? 'Saving...' : 'Save preferences'}
                  </button>
                </form>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
