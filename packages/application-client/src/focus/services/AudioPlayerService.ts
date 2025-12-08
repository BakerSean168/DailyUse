/**
 * AudioPlayerService - Ambient Sound Management
 * 
 * Manages ambient sounds and white noise for focus sessions:
 * - Built-in sounds (rain, cafe, ocean, forest, fireplace)
 * - Custom audio upload support
 * - Volume control and mixing
 * - Fade in/out effects
 * - Preset management
 */

export type SoundCategory = 'nature' | 'urban' | 'music' | 'noise';
export type SoundType = 'builtin' | 'custom';

export interface AmbientSound {
  id: string;
  name: string;
  type: SoundType;
  filePath: string;
  duration?: number; // seconds
  category: SoundCategory;
  thumbnail?: string;
  isFavorite: boolean;
}

export interface SoundSettings {
  autoPlayOnFocus: boolean;
  defaultSound?: string; // sound id
  volume: number; // 0-100
  fadeInDuration: number; // seconds
  fadeOutDuration: number; // seconds
  mixedSounds?: {
    soundId: string;
    volume: number;
  }[];
}

export interface SoundPreset {
  id: string;
  name: string;
  sounds: Array<{
    soundId: string;
    volume: number;
  }>;
  createdAt: Date;
  isFavorite: boolean;
}

interface PlayingSound {
  soundId: string;
  isPlaying: boolean;
  currentVolume: number;
}

interface CacheEntry<T> {
  result: T;
  timestamp: number;
}

/**
 * Built-in sounds library
 */
const BUILTIN_SOUNDS: AmbientSound[] = [
  {
    id: 'sound_rain',
    name: '雨声 (Rain)',
    type: 'builtin',
    filePath: '/sounds/rain.mp3',
    category: 'nature',
    isFavorite: false,
  },
  {
    id: 'sound_cafe',
    name: '咖啡馆 (Cafe)',
    type: 'builtin',
    filePath: '/sounds/cafe.mp3',
    category: 'urban',
    isFavorite: false,
  },
  {
    id: 'sound_ocean',
    name: '海浪 (Ocean)',
    type: 'builtin',
    filePath: '/sounds/ocean.mp3',
    category: 'nature',
    isFavorite: false,
  },
  {
    id: 'sound_forest',
    name: '森林 (Forest)',
    type: 'builtin',
    filePath: '/sounds/forest.mp3',
    category: 'nature',
    isFavorite: false,
  },
  {
    id: 'sound_fireplace',
    name: '火炉 (Fireplace)',
    type: 'builtin',
    filePath: '/sounds/fireplace.mp3',
    category: 'nature',
    isFavorite: false,
  },
  {
    id: 'sound_whitenoise',
    name: '白噪音 (White Noise)',
    type: 'builtin',
    filePath: '/sounds/white-noise.mp3',
    category: 'noise',
    isFavorite: false,
  },
];

/**
 * AudioPlayerService - Singleton service for ambient sound management
 */
export class AudioPlayerService {
  private static instance: AudioPlayerService;
  private cacheExpiry: number = 30 * 60 * 1000; // 30 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();

  private allSounds: Map<string, AmbientSound> = new Map();
  private customSounds: AmbientSound[] = [];
  private playingSounds: Map<string, PlayingSound> = new Map();
  private presets: Map<string, SoundPreset> = new Map();

  private settings: SoundSettings = {
    autoPlayOnFocus: false,
    volume: 50,
    fadeInDuration: 2,
    fadeOutDuration: 2,
  };

  // Events
  onSoundPlay: (sound: AmbientSound) => void = () => {};
  onSoundStop: (sound: AmbientSound) => void = () => {};
  onSoundPause: (sound: AmbientSound) => void = () => {};
  onVolumeChange: (volume: number) => void = () => {};
  onPresetCreate: (preset: SoundPreset) => void = () => {};

  private constructor() {
    this.initializeBuiltinSounds();
  }

  public static getInstance(): AudioPlayerService {
    if (!AudioPlayerService.instance) {
      AudioPlayerService.instance = new AudioPlayerService();
    }
    return AudioPlayerService.instance;
  }

  /**
   * Get all available sounds
   */
  public getAllSounds(): AmbientSound[] {
    const all: AmbientSound[] = [];
    this.allSounds.forEach((sound) => all.push(sound));
    return all.concat(this.customSounds);
  }

  /**
   * Get sounds by category
   */
  public getSoundsByCategory(category: SoundCategory): AmbientSound[] {
    return this.getAllSounds().filter((sound) => sound.category === category);
  }

  /**
   * Get built-in sounds
   */
  public getBuiltinSounds(): AmbientSound[] {
    return Array.from(this.allSounds.values()).filter((s) => s.type === 'builtin');
  }

  /**
   * Get custom sounds
   */
  public getCustomSounds(): AmbientSound[] {
    return [...this.customSounds];
  }

  /**
   * Get sound by ID
   */
  public getSound(soundId: string): AmbientSound | undefined {
    return this.allSounds.get(soundId) || this.customSounds.find((s) => s.id === soundId);
  }

  /**
   * Play a sound
   */
  public async play(soundId: string, volume?: number): Promise<void> {
    const sound = this.getSound(soundId);
    if (!sound) {
      throw new Error(`Sound not found: ${soundId}`);
    }

    const actualVolume = volume ?? this.settings.volume;

    // Store playing sound info
    this.playingSounds.set(soundId, {
      soundId,
      isPlaying: true,
      currentVolume: actualVolume,
    });

    this.onSoundPlay(sound);
    this.clearCache('playingSounds');
  }

  /**
   * Stop a sound
   */
  public async stop(soundId: string): Promise<void> {
    const sound = this.getSound(soundId);
    if (!sound) {
      return;
    }

    this.playingSounds.delete(soundId);
    this.onSoundStop(sound);
    this.clearCache('playingSounds');
  }

  /**
   * Pause a sound
   */
  public async pause(soundId: string): Promise<void> {
    const sound = this.getSound(soundId);
    if (!sound) {
      return;
    }

    const playingSound = this.playingSounds.get(soundId);
    if (playingSound) {
      playingSound.isPlaying = false;
    }

    this.onSoundPause(sound);
    this.clearCache('playingSounds');
  }

  /**
   * Resume a paused sound
   */
  public async resume(soundId: string): Promise<void> {
    const sound = this.getSound(soundId);
    if (!sound) {
      return;
    }

    const playingSound = this.playingSounds.get(soundId);
    if (playingSound) {
      playingSound.isPlaying = true;
    }

    this.onSoundPlay(sound);
    this.clearCache('playingSounds');
  }

  /**
   * Stop all sounds
   */
  public async stopAll(): Promise<void> {
    const soundIds = Array.from(this.playingSounds.keys());
    for (const soundId of soundIds) {
      await this.stop(soundId);
    }
  }

  /**
   * Set volume for a sound
   */
  public setVolume(soundId: string, volume: number): void {
    const playingSound = this.playingSounds.get(soundId);
    if (playingSound) {
      playingSound.currentVolume = Math.max(0, Math.min(100, volume));
      this.onVolumeChange(playingSound.currentVolume);
    }
  }

  /**
   * Set global volume
   */
  public setGlobalVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(100, volume));

    // Update all playing sounds
    this.playingSounds.forEach((sound) => {
      sound.currentVolume = this.settings.volume;
    });

    this.onVolumeChange(this.settings.volume);
    this.clearCache('settings');
  }

  /**
   * Get current settings
   */
  public getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  public updateSettings(settings: Partial<SoundSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.clearCache('settings');
  }

  /**
   * Add custom sound
   */
  public async addCustomSound(sound: AmbientSound): Promise<void> {
    // Check if sound ID already exists
    if (this.allSounds.has(sound.id) || this.customSounds.some((s) => s.id === sound.id)) {
      throw new Error(`Sound with ID already exists: ${sound.id}`);
    }

    this.customSounds.push(sound);
    this.clearCache('customSounds');
  }

  /**
   * Remove custom sound
   */
  public async removeCustomSound(soundId: string): Promise<void> {
    this.customSounds = this.customSounds.filter((s) => s.id !== soundId);
    await this.stop(soundId);
    this.clearCache('customSounds');
  }

  /**
   * Toggle favorite status
   */
  public toggleFavorite(soundId: string): void {
    const sound = this.getSound(soundId);
    if (sound) {
      sound.isFavorite = !sound.isFavorite;
      this.clearCache('favorites');
    }
  }

  /**
   * Get favorite sounds
   */
  public getFavoriteSounds(): AmbientSound[] {
    return this.getAllSounds().filter((s) => s.isFavorite);
  }

  /**
   * Create preset from current playing mix
   */
  public createPreset(presetName: string): SoundPreset {
    const sounds = Array.from(this.playingSounds.values()).map((ps) => ({
      soundId: ps.soundId,
      volume: ps.currentVolume,
    }));

    const preset: SoundPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      sounds,
      createdAt: new Date(),
      isFavorite: false,
    };

    this.presets.set(preset.id, preset);
    this.onPresetCreate(preset);
    this.clearCache('presets');
    return preset;
  }

  /**
   * Get all presets
   */
  public getPresets(): SoundPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Load preset
   */
  public async loadPreset(presetId: string): Promise<void> {
    const preset = this.presets.get(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    // Stop all current sounds
    await this.stopAll();

    // Play preset sounds
    for (const item of preset.sounds) {
      await this.play(item.soundId, item.volume);
    }
  }

  /**
   * Delete preset
   */
  public deletePreset(presetId: string): void {
    this.presets.delete(presetId);
    this.clearCache('presets');
  }

  /**
   * Get currently playing sounds
   */
  public getPlayingSounds(): AmbientSound[] {
    const playing: AmbientSound[] = [];
    this.playingSounds.forEach((_, soundId) => {
      const sound = this.getSound(soundId);
      if (sound) {
        playing.push(sound);
      }
    });
    return playing;
  }

  /**
   * Clear cache
   */
  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set cache expiry (in minutes)
   */
  public setCacheExpiry(minutes: number): void {
    this.cacheExpiry = minutes * 60 * 1000;
  }

  // ==================== Private Methods ====================

  private initializeBuiltinSounds(): void {
    BUILTIN_SOUNDS.forEach((sound) => {
      this.allSounds.set(sound.id, { ...sound });
    });
  }
}

export const audioPlayerService = AudioPlayerService.getInstance();
