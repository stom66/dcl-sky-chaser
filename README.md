## `dcl-sky-chaser`

# Sky Chaser

Built for Decentraland SDK7 with the new Auth-Server, Sky Chaser is a multiplayer game where players compete to catch the most escaping packages per round. Includes Weekly and AllTime leaderboards.

### Play it here: [skychaser.dcl.eth](https://play.decentraland.org/?realm=skychaser.dcl.eth)

![SkyChaser: how to Play](dcl/assets/images/ui/howToPlay.png)
---

## Contents

- [Repository Overview](#repository-overview)
- [Getting Started](#getting-started)
  - [Pre-requisites](#pre-requisites)
  - [Preview the DCL scene](#preview-the-dcl-scene)
- [License](#license)

---

## Repository Overview

This repository is split into the following folders:

- `/assets` - source assets and textures before being exported for the DCL scene
  - `/assets/fonts` - fonts used in the scene and accompanying media
  - `/assets/images` - source image assets, UI artwork, previews, and related media
  - `/assets/models` - source files for scene models, including `blend` files and full-resolution texture references
  - `/assets/spp` - Substance Painter project files
  - `/assets/textures` - source texture atlases and shared texture files used across the scene
- `/config` - supporting project configuration, such as import/export settings, UVPackMaster presets, and shader templates
- `/dcl` - the Decentraland SDK7 scene project to preview and deploy
  - `/dcl/assets` - all the models/textures/sprites/sfx used by the SDK codebase
    - `/dcl/assets/images` - images used by in-game Code, mostly `/ui` stuff
    - `/dcl/assets/models` - exported glTF models spawned via code
    - `/dcl/assets/sfx` - mp3/wav files used by the scene
    - `/dcl/assets/tex` - textures used for SDK-defined Materials (player beacon, particles)
  - `/dcl/src` - scene TypeScript source code
- `/docs` - extra information on relevant topics, eg asset creation
- `/reference` - screenshots, previs, and reference pictures used during asset creation
- `/scripts` - utility scripts
  - `/scripts/bash` - shell scripts for project tasks
  - `/scripts/blender` - Blender automation scripts

---

# Getting Started

## Pre-requisites

- **Previewing the scene**:

  - You will require the [Decentraland Creator Hub](https://decentraland.org/download/creator-hub/) to launch and host the scene.
  - You will require the [Decentraland Client](https://decentraland.org/download/) to join and view the scene.

## Preview the DCL scene

### First-time setup

1. Launch the Decentraland Creator Hub
1. Select the "Scenes" tab
1. Select "Import Scene"
1. Navigate to the repository folder and select the `dcl` folder inside it.

### Normal use

1. Launch the Decentraland Creator Hub
1. Select the scene from the home screen
1. Choose "Preview" at the top
1. This will fire up a local test server, and launch the Decentraland Client

---

## License

This work is licensed under the Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License. To view a copy of this license, visit <http://creativecommons.org/licenses/by-nc-nd/4.0/>, see the license included in this repository, or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
