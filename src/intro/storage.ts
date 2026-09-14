const STORAGE_KEY = 'german-plus-intro-complete'

export function hasCompletedIntro(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroComplete(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // private mode / quota — intro may replay this session
  }
}
