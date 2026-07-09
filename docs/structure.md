# Project Structure

This document describes the overall directory structure of the Sokuji project (up to ~4 levels deep). It is intended to help you quickly locate which files/directories to operate on before executing an instruction.

```
PROJ-SOKUJI/
├── docs/                           # Project documentation
│   ├── structure.md                # This file
│   └── spec/                       # Specification documents (SDD)
│       ├── components/             # Reusable UI component specs
│       ├── screens/                # Screen-level specs
│       ├── models/                 # Data model specs
│       ├── services/                # Business logic / external service specs
│       ├── themes/                 # Design system / styling specs
│       ├── repositories/           # Data access layer specs
│       └── providers/              # State management / context provider specs
│
├── src/                             # Shared React app source (Electron + Extension + Web)
│   ├── components/                 # Functional React components (TypeScript)
│   │   ├── Settings/
│   │   │   ├── AdvancedSettings/
│   │   │   ├── SimpleSettings/
│   │   │   ├── sections/
│   │   │   └── shared/
│   │   └── Subtitle/
│   │       └── surfaces/
│   ├── stores/                     # Zustand state management stores
│   ├── services/                   # Service layer (interfaces + implementations)
│   │   ├── clients/                 # AI provider client implementations
│   │   │   └── volcengine-ast2/
│   │   ├── interfaces/
│   │   ├── providers/               # Provider-specific configurations
│   │   └── worklets/
│   ├── lib/                         # Library modules (JS/TS)
│   │   ├── modern-audio/            # Web Audio API modules (JavaScript)
│   │   │   ├── gtcrn/
│   │   │   └── worklets/
│   │   ├── local-inference/
│   │   │   ├── engine/
│   │   │   └── workers/
│   │   ├── auth/
│   │   ├── bing-translator/
│   │   ├── config/
│   │   ├── edge-tts/
│   │   └── playback/
│   ├── contexts/                    # React Context providers
│   ├── layouts/
│   ├── routes/
│   ├── config/
│   ├── locales/                     # i18next translation files (per language)
│   ├── styles/
│   ├── types/
│   ├── utils/                       # Shared utilities incl. environment detection
│   └── assets/
│
├── webapp/                            # Sokuji wrapper web app (independent project, Firebase Hosting target)
│   └── src/
│       ├── screens/                  # Login, ModeSelect, SetupWizard, Session, Settings
│       ├── components/               # ModeCard, StepIndicator, ConversationRow, common/
│       ├── context/                  # OnboardingContext (mode/languages/devices)
│       ├── data/                     # Language option lists
│       └── styles/                   # Design tokens (mirrors docs/spec/themes/wrapper-webapp-tokens.md)
│
├── electron/                         # Electron-specific main process code
├── extension/                        # Browser extension specific code
│   ├── _locales/                    # Extension i18n messages (per locale)
│   ├── background/
│   ├── content/                     # Content scripts (Google Meet, Zoom, Teams, etc.)
│   ├── docs/
│   └── icons/
│
├── public/                           # Static public assets served by Vite
│   ├── assets/
│   ├── wasm/                        # WASM modules (VAD, ASR, TTS, ORT, etc.)
│   └── workers/
│
├── shared/                            # Code shared across Electron/Extension build targets
├── evals/                             # Evaluation harness for AI providers
│   ├── instructions/
│   ├── runner/
│   │   ├── audio/
│   │   ├── clients/
│   │   ├── core/
│   │   └── evaluation/
│   ├── schemas/
│   └── test-cases/
│
├── benchmark/                         # Benchmarking scripts/tools
├── model-packs/                        # Bundled local inference models
│   ├── asr/
│   └── tts/
├── resources/                          # Native resources (drivers, etc.)
│   └── drivers/
│       └── SokujiVirtualAudio.driver/
├── pkg-scripts/                        # Packaging helper scripts
├── scripts/                            # Repo-level utility scripts
├── screenshots/                        # Marketing/store screenshots
├── assets/                             # App icons/branding
├── .github/                            # GitHub Actions workflows
├── .signpath/                          # Code-signing configuration
│   └── artifact-configurations/
│
├── CLAUDE.md                           # AI agent guidance (this repo's rules)
├── package.json                        # Root (Electron/React) package manifest
├── vite.config.ts                      # Vite build configuration
├── tsconfig.json                       # TypeScript configuration
└── forge.config.js                     # Electron Forge packaging configuration
```

## Notes

- `src/` is the single source of truth shared by both the Electron desktop app and the browser extension.
- `extension/` and `electron/` only contain platform-specific glue code (manifest, background scripts, native device management).
- New specification documents must be added under `docs/spec/<category>/` following the categories defined in `CLAUDE.md`.
- Do not scan the entire repository tree for every instruction — consult this file first to identify the relevant directories/files.
