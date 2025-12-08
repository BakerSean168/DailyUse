// Focus Module - Public API

export { PomodoroService, pomodoroService } from './services/PomodoroService';
export type {
  PomodoroSession,
  PomodoroSettings,
  PomodoroPhase,
  SessionStatus,
} from './services/PomodoroService';

export { FocusModeService, focusModeService } from './services/FocusModeService';
export type { FocusModeState, FocusModeSettings } from './services/FocusModeService';

export { AudioPlayerService, audioPlayerService } from './services/AudioPlayerService';
export type {
  AmbientSound,
  SoundSettings,
  SoundPreset,
  SoundCategory,
  SoundType,
} from './services/AudioPlayerService';

export { FocusStatisticsService, focusStatisticsService, BadgeService, badgeService } from './services/FocusStatisticsService';
export type {
  FocusStatistics,
  TrendData,
  TimeDistribution,
  FocusReport,
  Badge,
  UserBadge,
} from './services/FocusStatisticsService';

export { RestReminderService, restReminderService } from './services/RestReminderService';
export type {
  RestReminder,
  ReminderSettings,
  RestRecord,
  WaterRecord,
  StretchExercise,
  ReminderType,
  StretchCategory,
  StretchIntensity,
} from './services/RestReminderService';

