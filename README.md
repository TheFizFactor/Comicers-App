[![comicers screenshot](assets/comicers_screenshot.webp)](https://comicers.org)

[![comicers.org](https://img.shields.io/badge/website-comicers.org-7048E8?style=flat-square)](https://comicers.org)
[![GitHub release](https://img.shields.io/github/v/release/TheFizFactor/Comicers-App?style=flat-square)](https://github.com/TheFizFactor/Comicers-App/releases)
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/TheFizFactor/Comicers-App/publish.yml?branch=main&style=flat-square)

Comicers is a modern, free, and open-source manga reader for desktop platforms. It provides a seamless reading experience with support for both local and online manga sources.

## Features

| Feature | Status | Description |
|---------|---------|-------------|
| Local Manga Import | ✅ | Import manga from your filesystem (zip files, image folders) |
| Online Manga Reading | ✅ | Read manga from popular websites through Tiyo plugin |
| Offline Reading | ✅ | Download chapters for offline access |
| Customizable Reader | ✅ | Multiple layouts and reading settings |
| Library Management | ✅ | Tagging and filtering system for large collections |
| Cross-Platform | ✅ | Available for Windows, macOS, and Linux |
| Dark/Light Mode | ✅ | Comfortable reading in any lighting condition |
| Reading Progress | ✅ | Automatic progress tracking and bookmarking |
| Batch Operations | ✅ | Download multiple chapters at once |

## Coming Soon

| Feature | Status | Description |
|---------|---------|-------------|
| Cloud Sync | 🔄 | Sync your library across devices |
| Reading Statistics | 🔄 | Track your reading habits and history |
| Custom Themes | 🔄 | Create and share custom reader themes |
| Advanced Search | 🔄 | Search across multiple sources simultaneously |

## Quick Start

1. Download from [comicers.org/download](https://comicers.org/download)
2. Install the Tiyo plugin from the Plugins tab
3. Start reading your favorite manga!

## Development

```bash
# Install dependencies
pnpm i

# Start development server
pnpm dev
```

## Technical Stack

- **Framework**: Electron + React
- **UI Components**: Radix UI + shadcn
- **State Management**: Recoil
- **Storage**: localStorage + user-data path
- **Plugin System**: Tiyo + aki-plugin-manager

## Content Sources

Comicers supports two types of content sources:
1. Local filesystem (zip files, image folders)
2. Online sources through the Tiyo plugin

For new content source requests or Tiyo-related inquiries, contact: fiz@comicers.com

## License

This project is licensed under the [Comicers License](LICENSE.txt) - see the LICENSE file for details.
