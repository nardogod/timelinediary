'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { UserSettings, getSettingsByUserId, saveSettings, PRESET_COLORS, DEFAULT_SETTINGS, loadSettingsFromStorage, THEME_PRESETS } from '@/lib/settings';
import { Settings, Palette, Image, Type, Layout } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsManagerProps {
  userId: string;
  onSettingsChange?: () => void;
}

function SettingsManager({ userId, onSettingsChange }: SettingsManagerProps) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Tenta carregar do localStorage primeiro
    const stored = loadSettingsFromStorage(userId);
    return stored || getSettingsByUserId(userId);
  });
  const [activeTab, setActiveTab] = useState<'theme' | 'colors' | 'timeline' | 'profile' | 'events'>('theme');

  useEffect(() => {
    // Carrega settings ao montar
    const stored = loadSettingsFromStorage(userId);
    if (stored) {
      setSettings(stored);
    } else {
      setSettings(getSettingsByUserId(userId));
    }
  }, [userId]);

  const handleSave = useCallback(() => {
    const saved = saveSettings(userId, settings);
    setSettings(saved); // Atualiza estado local com settings salvos
    onSettingsChange?.(); // Notifica componente pai para recarregar settings
  }, [userId, settings, onSettingsChange]);

  const handleChange = useCallback((key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Personalizações
        </h3>
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-medium transition-colors"
        >
          Salvar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('theme')}
          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'theme' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          <Layout className="w-3 h-3 inline mr-1" />
          Tema
        </button>
        <button
          onClick={() => setActiveTab('colors')}
          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'colors' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          <Palette className="w-3 h-3 inline mr-1" />
          Cores
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'timeline' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          <Type className="w-3 h-3 inline mr-1" />
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'events' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          Eventos
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'profile' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
          }`}
        >
          <Image className="w-3 h-3 inline mr-1" />
          Perfil
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="space-y-4">
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-xs">Escolha o tema visual da sua timeline. O Tema 3 traz a mesma leveza da tela inicial (usuário não logado).</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  const preset = THEME_PRESETS.tema3;
                  setSettings(prev => ({
                    ...prev,
                    themeId: 'tema3',
                    backgroundColorGradient: preset.backgroundColorGradient,
                    animatedBackground: preset.animatedBackground,
                    animatedBackgroundColors: { ...preset.animatedBackgroundColors },
                    timelineLineColor: preset.timelineLineColor,
                    eventSimpleColor: preset.eventSimpleColor,
                    eventMediumColor: preset.eventMediumColor,
                    eventImportantColor: preset.eventImportantColor,
                  }));
                }}
                aria-pressed={settings.themeId === 'tema3'}
                aria-label="Usar Tema 3 (leve, como a tela inicial)"
                className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                  settings.themeId === 'tema3' ? 'border-white bg-slate-700/80 ring-2 ring-white/20' : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                }`}
              >
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/90 text-white">Leve</span>
                <div className="h-20 rounded-lg mb-3 overflow-hidden relative" style={{ background: THEME_PRESETS.tema3.backgroundColorGradient }}>
                  <div className="absolute inset-0 opacity-80" style={{
                    background: `radial-gradient(circle at 20% 30%, ${THEME_PRESETS.tema3.animatedBackgroundColors.color1}, transparent 50%), radial-gradient(circle at 80% 70%, ${THEME_PRESETS.tema3.animatedBackgroundColors.color2}, transparent 50%)`
                  }} />
                </div>
                <span className="text-white font-medium text-sm">Tema 3</span>
                <p className="text-slate-400 text-xs mt-0.5">Leve — fundo claro, bolhas suaves. Como a tela inicial.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const preset = THEME_PRESETS.tema1;
                  setSettings(prev => ({
                    ...prev,
                    themeId: 'tema1',
                    backgroundColorGradient: preset.backgroundColorGradient,
                    animatedBackground: preset.animatedBackground,
                    animatedBackgroundColors: { ...preset.animatedBackgroundColors },
                    timelineLineColor: preset.timelineLineColor,
                    eventSimpleColor: preset.eventSimpleColor,
                    eventMediumColor: preset.eventMediumColor,
                    eventImportantColor: preset.eventImportantColor,
                  }));
                }}
                aria-pressed={(settings.themeId ?? 'tema1') === 'tema1'}
                aria-label="Usar Tema 1 (padrão, azul escuro)"
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  (settings.themeId ?? 'tema1') === 'tema1' ? 'border-white bg-slate-700/80 ring-2 ring-white/20' : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                }`}
              >
                <div className="h-20 rounded-lg mb-3 overflow-hidden" style={{ background: THEME_PRESETS.tema1.backgroundColorGradient }} />
                <span className="text-white font-medium text-sm">Tema 1</span>
                <p className="text-slate-400 text-xs mt-0.5">Padrão — azul escuro, sem animação.</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const preset = THEME_PRESETS.tema2;
                  setSettings(prev => ({
                    ...prev,
                    themeId: 'tema2',
                    backgroundColorGradient: preset.backgroundColorGradient,
                    animatedBackground: preset.animatedBackground,
                    animatedBackgroundColors: { ...preset.animatedBackgroundColors },
                    timelineLineColor: preset.timelineLineColor,
                    eventSimpleColor: preset.eventSimpleColor,
                    eventMediumColor: preset.eventMediumColor,
                    eventImportantColor: preset.eventImportantColor,
                  }));
                }}
                aria-pressed={settings.themeId === 'tema2'}
                aria-label="Usar Tema 2 (tela inicial escuro, rosa e roxo)"
                className={`rounded-xl border-2 p-4 text-left transition-all relative ${
                  settings.themeId === 'tema2' ? 'border-white bg-slate-700/80 ring-2 ring-white/20' : 'border-slate-600 bg-slate-700/40 hover:border-slate-500'
                }`}
              >
                <div className="h-20 rounded-lg mb-3 overflow-hidden relative" style={{ background: THEME_PRESETS.tema2.backgroundColorGradient }}>
                  <div className="absolute inset-0 opacity-70" style={{
                    background: `radial-gradient(circle at 20% 30%, ${THEME_PRESETS.tema2.animatedBackgroundColors.color1}, transparent 45%), radial-gradient(circle at 80% 70%, ${THEME_PRESETS.tema2.animatedBackgroundColors.color2}, transparent 45%), radial-gradient(circle at 50% 50%, ${THEME_PRESETS.tema2.animatedBackgroundColors.color4}, transparent 50%)`
                  }} />
                </div>
                <span className="text-white font-medium text-sm">Tema 2</span>
                <p className="text-slate-400 text-xs mt-0.5">Escuro — rosa e roxo, bolhas. Tela inicial em dark.</p>
              </button>
            </div>
          </div>
        )}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Plano de Fundo</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_COLORS.backgrounds.map((bg) => (
                  <button
                    key={bg.value}
                    onClick={() => handleChange('backgroundColorGradient', bg.gradient)}
                    className={`h-12 rounded border-2 transition-all ${
                      settings.backgroundColorGradient === bg.gradient ? 'border-white scale-105' : 'border-slate-600'
                    }`}
                    style={{ background: bg.gradient }}
                    title={bg.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Fundo Animado</label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => handleChange('animatedBackground', 'none')}
                  className={`h-16 rounded border-2 transition-all flex items-center justify-center ${
                    settings.animatedBackground === 'none' ? 'border-white scale-105' : 'border-slate-600'
                  }`}
                  style={{ background: 'linear-gradient(to bottom right, #0f172a, #1e3a8a)' }}
                >
                  <span className="text-white text-xs">Sem Animação</span>
                </button>
                <button
                  onClick={() => handleChange('animatedBackground', 'bubbles')}
                  className={`h-16 rounded border-2 transition-all relative overflow-hidden ${
                    settings.animatedBackground === 'bubbles' ? 'border-white scale-105' : 'border-slate-600'
                  }`}
                  style={{ 
                    background: `radial-gradient(circle at top left, ${settings.animatedBackgroundColors?.color1 || DEFAULT_SETTINGS.animatedBackgroundColors.color1}, transparent 50%), radial-gradient(circle at bottom right, ${settings.animatedBackgroundColors?.color2 || DEFAULT_SETTINGS.animatedBackgroundColors.color2}, transparent 50%)`
                  }}
                >
                  <span className="text-white text-xs relative z-10 font-medium drop-shadow-lg">Bolhas</span>
                </button>
                <button
                  onClick={() => handleChange('animatedBackground', 'waves')}
                  className={`h-16 rounded border-2 transition-all relative overflow-hidden ${
                    settings.animatedBackground === 'waves' ? 'border-white scale-105' : 'border-slate-600'
                  }`}
                  style={{ 
                    background: `linear-gradient(45deg, ${settings.animatedBackgroundColors?.color1 || DEFAULT_SETTINGS.animatedBackgroundColors.color1}, ${settings.animatedBackgroundColors?.color2 || DEFAULT_SETTINGS.animatedBackgroundColors.color2}, ${settings.animatedBackgroundColors?.color3 || DEFAULT_SETTINGS.animatedBackgroundColors.color3})`
                  }}
                >
                  <span className="text-white text-xs relative z-10 font-medium drop-shadow-lg">Ondas</span>
                </button>
                <button
                  onClick={() => handleChange('animatedBackground', 'particles')}
                  className={`h-16 rounded border-2 transition-all relative overflow-hidden ${
                    settings.animatedBackground === 'particles' ? 'border-white scale-105' : 'border-slate-600'
                  }`}
                  style={{ 
                    background: `radial-gradient(circle at 30% 30%, ${settings.animatedBackgroundColors?.color3 || DEFAULT_SETTINGS.animatedBackgroundColors.color3}, transparent 50%), radial-gradient(circle at 70% 70%, ${settings.animatedBackgroundColors?.color4 || DEFAULT_SETTINGS.animatedBackgroundColors.color4}, transparent 50%)`
                  }}
                >
                  <span className="text-white text-xs relative z-10 font-medium drop-shadow-lg">Partículas</span>
                </button>
              </div>

              {/* Seletor de cores para fundo animado */}
              {settings.animatedBackground !== 'none' && (
                <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                  <label className="text-slate-300 text-xs font-medium mb-3 block">Personalizar Cores do Fundo</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 text-[10px] mb-1.5 block">
                        {settings.animatedBackground === 'bubbles' ? 'Cor 1 (Top Left)' : 
                         settings.animatedBackground === 'waves' ? 'Cor 1' : 'Cor 1 (20% 20%)'}
                      </label>
                      {/* Grid de cores */}
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {PRESET_COLORS.animatedColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleChange('animatedBackgroundColors', { 
                              ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                              color1: color.value 
                            })}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              (settings.animatedBackgroundColors?.color1 || DEFAULT_SETTINGS.animatedBackgroundColors.color1) === color.value ? 'border-white scale-110 ring-2 ring-white' : 'border-slate-600'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      {/* Color picker */}
                      <input
                        type="color"
                        value={(() => {
                          const currentColor = settings.animatedBackgroundColors?.color1 || DEFAULT_SETTINGS.animatedBackgroundColors.color1;
                          // Extrai hex de rgba se necessário
                          if (currentColor.startsWith('rgba')) {
                            const match = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                            if (match) {
                              const r = parseInt(match[1]).toString(16).padStart(2, '0');
                              const g = parseInt(match[2]).toString(16).padStart(2, '0');
                              const b = parseInt(match[3]).toString(16).padStart(2, '0');
                              return `#${r}${g}${b}`;
                            }
                          }
                          return currentColor.startsWith('#') ? currentColor : '#93c5fd';
                        })()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          // Converte hex para rgba com opacidade
                          const r = parseInt(hex.slice(1, 3), 16);
                          const g = parseInt(hex.slice(3, 5), 16);
                          const b = parseInt(hex.slice(5, 7), 16);
                          const rgba = `rgba(${r}, ${g}, ${b}, 0.4)`;
                          handleChange('animatedBackgroundColors', { 
                            ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                            color1: rgba 
                          });
                        }}
                        className="w-full h-8 rounded cursor-pointer"
                        title="Escolher cor personalizada"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] mb-1.5 block">
                        {settings.animatedBackground === 'bubbles' ? 'Cor 2 (Bottom Right)' : 
                         settings.animatedBackground === 'waves' ? 'Cor 2' : 'Cor 2 (80% 80%)'}
                      </label>
                      {/* Grid de cores */}
                      <div className="grid grid-cols-5 gap-1.5 mb-2">
                        {PRESET_COLORS.animatedColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleChange('animatedBackgroundColors', { 
                              ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                              color2: color.value 
                            })}
                            className={`w-8 h-8 rounded border-2 transition-all ${
                              (settings.animatedBackgroundColors?.color2 || DEFAULT_SETTINGS.animatedBackgroundColors.color2) === color.value ? 'border-white scale-110 ring-2 ring-white' : 'border-slate-600'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      {/* Color picker */}
                      <input
                        type="color"
                        value={(() => {
                          const currentColor = settings.animatedBackgroundColors?.color2 || DEFAULT_SETTINGS.animatedBackgroundColors.color2;
                          if (currentColor.startsWith('rgba')) {
                            const match = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                            if (match) {
                              const r = parseInt(match[1]).toString(16).padStart(2, '0');
                              const g = parseInt(match[2]).toString(16).padStart(2, '0');
                              const b = parseInt(match[3]).toString(16).padStart(2, '0');
                              return `#${r}${g}${b}`;
                            }
                          }
                          return currentColor.startsWith('#') ? currentColor : '#a7f3d0';
                        })()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          const r = parseInt(hex.slice(1, 3), 16);
                          const g = parseInt(hex.slice(3, 5), 16);
                          const b = parseInt(hex.slice(5, 7), 16);
                          const rgba = `rgba(${r}, ${g}, ${b}, 0.4)`;
                          handleChange('animatedBackgroundColors', { 
                            ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                            color2: rgba 
                          });
                        }}
                        className="w-full h-8 rounded cursor-pointer"
                        title="Escolher cor personalizada"
                      />
                    </div>
                    {(settings.animatedBackground === 'waves' || settings.animatedBackground === 'particles') && (
                      <>
                        <div>
                          <label className="text-slate-400 text-[10px] mb-1.5 block">
                            {settings.animatedBackground === 'waves' ? 'Cor 3' : 'Cor 3 (50% 50%)'}
                          </label>
                          {/* Grid de cores */}
                          <div className="grid grid-cols-5 gap-1.5 mb-2">
                            {PRESET_COLORS.animatedColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => handleChange('animatedBackgroundColors', { 
                                  ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                  color3: color.value 
                                })}
                                className={`w-8 h-8 rounded border-2 transition-all ${
                                  (settings.animatedBackgroundColors?.color3 || DEFAULT_SETTINGS.animatedBackgroundColors.color3) === color.value ? 'border-white scale-110 ring-2 ring-white' : 'border-slate-600'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          {/* Color picker */}
                          <input
                            type="color"
                            value={(() => {
                              const currentColor = settings.animatedBackgroundColors?.color3 || DEFAULT_SETTINGS.animatedBackgroundColors.color3;
                              if (currentColor.startsWith('rgba')) {
                                const match = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                if (match) {
                                  const r = parseInt(match[1]).toString(16).padStart(2, '0');
                                  const g = parseInt(match[2]).toString(16).padStart(2, '0');
                                  const b = parseInt(match[3]).toString(16).padStart(2, '0');
                                  return `#${r}${g}${b}`;
                                }
                              }
                              return currentColor.startsWith('#') ? currentColor : '#fbbf24';
                            })()}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const r = parseInt(hex.slice(1, 3), 16);
                              const g = parseInt(hex.slice(3, 5), 16);
                              const b = parseInt(hex.slice(5, 7), 16);
                              const rgba = `rgba(${r}, ${g}, ${b}, 0.4)`;
                              handleChange('animatedBackgroundColors', { 
                                ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                color3: rgba 
                              });
                            }}
                            className="w-full h-8 rounded cursor-pointer"
                            title="Escolher cor personalizada"
                          />
                        </div>
                        {settings.animatedBackground === 'particles' && (
                          <div>
                            <label className="text-slate-400 text-[10px] mb-1.5 block">Cor 4 (30% 70%)</label>
                            {/* Grid de cores */}
                            <div className="grid grid-cols-5 gap-1.5 mb-2">
                              {PRESET_COLORS.animatedColors.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => handleChange('animatedBackgroundColors', { 
                                    ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                    color4: color.value 
                                  })}
                                  className={`w-8 h-8 rounded border-2 transition-all ${
                                    (settings.animatedBackgroundColors?.color4 || DEFAULT_SETTINGS.animatedBackgroundColors.color4) === color.value ? 'border-white scale-110 ring-2 ring-white' : 'border-slate-600'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                            {/* Color picker */}
                            <input
                              type="color"
                              value={(() => {
                                const currentColor = settings.animatedBackgroundColors?.color4 || DEFAULT_SETTINGS.animatedBackgroundColors.color4;
                                if (currentColor.startsWith('rgba')) {
                                  const match = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                  if (match) {
                                    const r = parseInt(match[1]).toString(16).padStart(2, '0');
                                    const g = parseInt(match[2]).toString(16).padStart(2, '0');
                                    const b = parseInt(match[3]).toString(16).padStart(2, '0');
                                    return `#${r}${g}${b}`;
                                  }
                                }
                                return currentColor.startsWith('#') ? currentColor : '#c4b5fd';
                              })()}
                              onChange={(e) => {
                                const hex = e.target.value;
                                const r = parseInt(hex.slice(1, 3), 16);
                                const g = parseInt(hex.slice(3, 5), 16);
                                const b = parseInt(hex.slice(5, 7), 16);
                                const rgba = `rgba(${r}, ${g}, ${b}, 0.4)`;
                                handleChange('animatedBackgroundColors', { 
                                  ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                  color4: rgba 
                                });
                              }}
                              className="w-full h-8 rounded cursor-pointer"
                              title="Escolher cor personalizada"
                            />
                          </div>
                        )}
                      </>
                    )}
                    {settings.animatedBackground === 'bubbles' && (
                      <>
                        <div>
                          <label className="text-slate-400 text-[10px] mb-1.5 block">Cor 3 (Top Right)</label>
                          {/* Grid de cores */}
                          <div className="grid grid-cols-5 gap-1.5 mb-2">
                            {PRESET_COLORS.animatedColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => handleChange('animatedBackgroundColors', { 
                                  ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                  color3: color.value 
                                })}
                                className={`w-8 h-8 rounded border-2 transition-all ${
                                  (settings.animatedBackgroundColors?.color3 || DEFAULT_SETTINGS.animatedBackgroundColors.color3) === color.value ? 'border-white scale-110 ring-2 ring-white' : 'border-slate-600'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          {/* Color picker */}
                          <input
                            type="color"
                            value={(() => {
                              const currentColor = settings.animatedBackgroundColors?.color3 || DEFAULT_SETTINGS.animatedBackgroundColors.color3;
                              if (currentColor.startsWith('rgba')) {
                                const match = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                if (match) {
                                  const r = parseInt(match[1]).toString(16).padStart(2, '0');
                                  const g = parseInt(match[2]).toString(16).padStart(2, '0');
                                  const b = parseInt(match[3]).toString(16).padStart(2, '0');
                                  return `#${r}${g}${b}`;
                                }
                              }
                              return currentColor.startsWith('#') ? currentColor : '#fbbf24';
                            })()}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const r = parseInt(hex.slice(1, 3), 16);
                              const g = parseInt(hex.slice(3, 5), 16);
                              const b = parseInt(hex.slice(5, 7), 16);
                              const rgba = `rgba(${r}, ${g}, ${b}, 0.4)`;
                              handleChange('animatedBackgroundColors', { 
                                ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                color3: rgba 
                              });
                            }}
                            className="w-full h-8 rounded cursor-pointer"
                            title="Escolher cor personalizada"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px] mb-1.5 block">Cor 4 (Bottom Left)</label>
                          {/* Grid de cores */}
                          <div className="grid grid-cols-5 gap-1.5 mb-2">
                            {PRESET_COLORS.animatedColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => handleChange('animatedBackgroundColors', { 
                                  ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                  color4: color.value 
                                })}
                                className={`w-8 h-8 rounded border-2 transition-all ${
                                  (settings.animatedBackgroundColors?.color4 || DEFAULT_SETTINGS.animatedBackgroundColors.color4) === color.value ? 'border-white scale-110 ring-2 ring-white' : 'border-slate-600'
                                }`}
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          {/* Color picker */}
                          <input
                            type="color"
                            value={(() => {
                              const currentColor = settings.animatedBackgroundColors?.color4 || DEFAULT_SETTINGS.animatedBackgroundColors.color4;
                              if (currentColor.startsWith('rgba')) {
                                const match = currentColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                                if (match) {
                                  const r = parseInt(match[1]).toString(16).padStart(2, '0');
                                  const g = parseInt(match[2]).toString(16).padStart(2, '0');
                                  const b = parseInt(match[3]).toString(16).padStart(2, '0');
                                  return `#${r}${g}${b}`;
                                }
                              }
                              return currentColor.startsWith('#') ? currentColor : '#c4b5fd';
                            })()}
                            onChange={(e) => {
                              const hex = e.target.value;
                              const r = parseInt(hex.slice(1, 3), 16);
                              const g = parseInt(hex.slice(3, 5), 16);
                              const b = parseInt(hex.slice(5, 7), 16);
                              const rgba = `rgba(${r}, ${g}, ${b}, 0.4)`;
                              handleChange('animatedBackgroundColors', { 
                                ...(settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors), 
                                color4: rgba 
                              });
                            }}
                            className="w-full h-8 rounded cursor-pointer"
                            title="Escolher cor personalizada"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Cor da Linha</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.timelineLines.map((line) => (
                  <button
                    key={line.value}
                    onClick={() => handleChange('timelineLineColor', line.value)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      settings.timelineLineColor === line.value ? 'border-white scale-110' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: line.value }}
                    title={line.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Estilo da Linha</label>
              <div className="flex gap-2">
                {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleChange('timelineLineStyle', style)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      settings.timelineLineStyle === style ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {style === 'solid' ? 'Sólida' : style === 'dashed' ? 'Tracejada' : 'Pontilhada'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">
                Espessura: {settings.timelineLineWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={settings.timelineLineWidth}
                onChange={(e) => handleChange('timelineLineWidth', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Cor - Simples</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.eventColors.simple.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleChange('eventSimpleColor', color.value)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      settings.eventSimpleColor === color.value ? 'border-white scale-110' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Cor - Médio</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.eventColors.medium.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleChange('eventMediumColor', color.value)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      settings.eventMediumColor === color.value ? 'border-white scale-110' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">Cor - Importante</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.eventColors.important.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleChange('eventImportantColor', color.value)}
                    className={`w-10 h-10 rounded border-2 transition-all ${
                      settings.eventImportantColor === color.value ? 'border-white scale-110' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-xs font-medium mb-2 block">URL da Foto de Perfil</label>
              <input
                type="text"
                value={settings.avatarUrl}
                onChange={(e) => handleChange('avatarUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              />
              {settings.avatarUrl && (
                <img
                  src={settings.avatarUrl}
                  alt="Preview"
                  className="mt-2 w-16 h-16 rounded-full border-2 border-slate-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(SettingsManager);
