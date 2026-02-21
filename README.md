# Recipe AI

Recipe AI is a React Native mobile application built with Expo that identifies ingredients from a photo and generates complete, personalized recipes using AI. Users photograph whatever food they have available — a fridge shelf, a grocery bag, or ingredients laid out on a counter — and the app returns six recipe ideas. Selecting any recipe triggers a second AI call that produces a full, detailed recipe including quantities, step-by-step instructions, chef tips, and nutrition data. The complete recipe can then be exported and shared as a formatted PDF.

The app runs on Android and iOS from a single codebase. It uses the Groq API with the Llama 4 Scout model for both vision-based ingredient detection and text-based recipe generation.

---

<img src="asset/pic1.jpg" width="400" alt="addpic">

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [App Architecture](#app-architecture)
- [Screens](#screens)
- [AI Pipeline](#ai-pipeline)
- [PDF Export](#pdf-export)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Groq API Key Setup](#groq-api-key-setup)
  - [Running the App](#running-the-app)
- [Building for Distribution](#building-for-distribution)
  - [Build an APK](#build-an-apk)
  - [Build an AAB for Google Play](#build-an-aab-for-google-play)
- [Customisation](#customisation)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

### Image-Based Ingredient Detection

Users can take a photo directly through the in-app camera or select an existing image from the device gallery. The image is base64-encoded and sent to the Groq vision API alongside a structured prompt that instructs the model to act as a professional chef. The model returns a JSON object containing a flat array of detected ingredient names.

### Six AI-Generated Recipe Ideas

<img src="asset/pic2.jpg" width="400" alt="addpic">

Alongside the ingredient list, the initial API call returns exactly six recipe suggestions. Each suggestion includes a title, emoji, difficulty rating (Easy, Medium, or Hard), estimated time, and a one-sentence description. These are displayed on the Recipe List screen as animated cards that stagger into view on load.

### Full Recipe Generation

<img src="asset/pic3.jpg" width="400" alt="addpic">

When the user selects a recipe, a second Groq API call is made using only the recipe title and detected ingredient list as inputs. The model returns a complete recipe object containing prep time, cook time, serving size, difficulty, a full description, a structured ingredient list with amounts and units, numbered step-by-step cooking instructions, two to three chef tips, and per-serving nutrition data covering calories, protein, carbohydrates, and fat.

### PDF Export and Sharing

<img src="asset/pic4.jpg" width="400" alt="addpic">

From the Recipe Detail screen, users can download the full recipe as a styled PDF. The PDF is generated on-device using `expo-print`, which renders an HTML template into a PDF file. The file is then shared via the native share sheet using `expo-sharing`. The PDF includes all recipe sections — header with emoji and description, meta pills, ingredients, instructions, tips, and nutrition — in a clean, print-ready layout.

### Animated Dark UI

The app uses a dark theme throughout with a near-black base (`#0D0D0D`) and deep navy gradient backgrounds. Decorative radial orbs add visual depth on the Home screen. Recipe cards fade and slide into view with staggered delays using React Native's Animated API. The Find Recipes button and PDF download button use linear gradient fills. Loading states display a pulsing animated ring with a contextual status message.

### Difficulty Badges

Each recipe card and detail screen displays a colour-coded difficulty badge. Easy recipes display in green, Medium in amber, and Hard in red. Badge colours and backgrounds are defined centrally in `theme.js` and applied consistently across the Recipe List and Recipe Detail screens.

### Permission Handling

Camera and photo library permissions are requested at the point of use rather than on app launch. If permission is denied, a descriptive alert is shown directing the user to their device settings. Android permissions for `CAMERA` and `READ_MEDIA_IMAGES` are declared in `app.json`.

---

## Tech Stack
```
| Layer | Technology |
|---|---|
| Mobile framework | React Native 0.73.2 |
| Build toolchain | Expo SDK 50 |
| Language | JavaScript (ES2020) |
| Navigation | React Navigation 6 with Native Stack |
| AI model | Groq API — meta-llama/llama-4-scout-17b-16e-instruct |
| Image capture | expo-image-picker, expo-camera |
| PDF generation | expo-print |
| File sharing | expo-sharing |
| Animations | React Native Animated API, react-native-reanimated |
| Gesture handling | react-native-gesture-handler |
| Gradients | expo-linear-gradient |
| Safe area | react-native-safe-area-context |
| Cloud builds | Expo Application Services (EAS) |
```
---

## App Architecture

The application is a flat three-screen stack. There is no global state library. Data flows forward through React Navigation route params — the Home screen captures the image, sends it to the AI, and passes the results to the Recipe List screen via navigation params. The Recipe List screen passes the selected recipe title and ingredient list to the Recipe Detail screen, which makes its own AI call to fetch the full recipe.

All external API calls are encapsulated in `src/groqService.js`. The PDF generation logic is self-contained in `src/pdfService.js`. Screens import from these service files and do not make fetch calls directly.

```
HomeScreen
  User captures or selects a photo
  Photo is base64-encoded
  analyzeIngredientsAndGetRecipes() called
  Returns: { ingredients[], recipes[] }
  Navigates to RecipeListScreen with params
        |
        v
RecipeListScreen
  Displays ingredient banner with thumbnail
  Renders 6 RecipeCard components with stagger animation
  User taps a card
  Navigates to RecipeDetailScreen with recipeTitle + ingredients
        |
        v
RecipeDetailScreen
  getFullRecipe() called on mount
  Renders full recipe: hero, ingredients, steps, tips, nutrition
  generateAndSharePDF() triggered on button press
```

---

## Screens

### HomeScreen

The entry point of the application. Contains two action buttons — Camera and Gallery — which request permissions and invoke `expo-image-picker`. When an image is selected it fades in with an Animated transition. The Find Recipes button appears below the image preview and triggers the AI analysis. A pulsing loading ring with status text ("Scanning ingredients..." then "Almost ready!") is shown while the request is in flight. A Clear Photo link lets the user reset and pick a different image.

### RecipeListScreen

Receives `recipes`, `ingredients`, and `imageUri` via route params. Displays a banner at the top showing the captured image thumbnail alongside the comma-separated list of detected ingredients. Below that, six `RecipeCard` components are rendered in a `ScrollView`. Each card animates in with a fade and upward slide, staggered by 70ms per card. Each card shows the recipe emoji, title, description, difficulty badge, and estimated time. Tapping a card navigates to the detail screen.

### RecipeDetailScreen

Receives `recipeTitle`, `ingredients`, and `recipeBasic` via route params. On mount, calls `getFullRecipe()` and shows a loading state with the recipe emoji, title, and an activity indicator while the request completes. Once loaded, the recipe fades in and is displayed across several sections: a hero area with large emoji, title, description, and four meta pills (Prep, Cook, Serves, Level); an ingredients list with amounts highlighted in blue; numbered instruction steps with gradient-filled step-number badges; a gold-accented chef tips box; and a four-column nutrition grid showing calories, protein, carbs, and fat. A fixed bar at the bottom of the screen contains the Download Recipe PDF button.

---

## AI Pipeline

Both AI functions live in `src/groqService.js` and share a common `callGroq()` utility function.

### callGroq(messages, maxTokens)

Makes a POST request to `https://api.groq.com/openai/v1/chat/completions` with the `meta-llama/llama-4-scout-17b-16e-instruct` model at a temperature of 0.7. The response content is stripped of any markdown code fences using regex, then the first valid JSON object is extracted before being parsed. Any HTTP error, missing content, or JSON parse failure throws with a descriptive message that surfaces to the user via an Alert.

### analyzeIngredientsAndGetRecipes(base64Image, mimeType)

Sends a multimodal message containing the image as an inline base64 data URL and a structured text prompt. The prompt specifies the exact JSON schema to return, with an `ingredients` array of strings and a `recipes` array of exactly six objects each containing `id`, `title`, `emoji`, `difficulty`, `time`, and `description`. Max tokens is set to 1024.

### getFullRecipe(title, ingredients)

Sends a text-only message with the recipe title and the ingredient array joined as a comma-separated string. The prompt specifies a detailed JSON schema including `servings`, `prepTime`, `cookTime`, `difficulty`, `description`, a structured `ingredients` array with `amount`, `unit`, and `item` fields, a `steps` array with `number` and `instruction` fields, a `tips` array, and a `nutrition` object. The prompt requests six to ten steps and two to three tips. Max tokens is set to 2048 to accommodate the longer output.

---

## PDF Export

`src/pdfService.js` exports a single async function, `generateAndSharePDF(recipe)`, which constructs a self-contained HTML string from the recipe data and renders it to a PDF file.

The HTML layout includes a dark navy gradient header with the recipe emoji, title, and description; a white meta card with four columns for prep time, cook time, servings, and difficulty; an ingredients section using a two-column grid with blue left-border accents on each item; a numbered steps section; a gold-accented tips box rendered only when tips are present; and a four-column nutrition grid rendered only when nutrition data is present. A footer credits Recipe AI and Groq.

`expo-print`'s `printToFileAsync()` renders the HTML to a PDF stored in the app's temporary cache directory. `expo-sharing`'s `shareAsync()` opens the native share sheet with the MIME type set to `application/pdf`, allowing the user to save the file, send it via messaging apps, or open it in a PDF reader.

---

## Project Structure

```
RecipeAI_RN/
├── App.js                        Navigation root — GestureHandlerRootView, NavigationContainer, Stack.Navigator
├── app.json                      Expo config — app name, icons, permissions, EAS project ID
├── eas.json                      EAS build profiles — development, preview (APK), production (AAB)
├── package.json                  Dependencies and npm scripts
├── babel.config.js               Babel config with babel-preset-expo and reanimated plugin
├── assets/
│   ├── icon.png                  App icon (1024x1024)
│   ├── splash.png                Splash screen image
│   ├── adaptive-icon.png         Android adaptive icon foreground
│   └── favicon.png               Web favicon
└── src/
    ├── groqService.js            All Groq API calls — ingredient detection and recipe generation
    ├── pdfService.js             HTML-to-PDF generation and native share sheet
    ├── theme.js                  Color palette and difficulty badge definitions
    ├── HomeScreen.js             Image capture, gallery picker, loading state, navigation to RecipeList
    ├── RecipeListScreen.js       Ingredient banner, animated recipe card list, navigation to RecipeDetail
    └── RecipeDetailScreen.js     Full recipe display, PDF export button
```

---

## Getting Started

### Prerequisites

Ensure the following are installed before setting up the project.

- Node.js version 18 or higher. Download from https://nodejs.org and select the LTS release. Verify with `node --version`.
- npm version 9 or higher (included with Node.js).
- Expo Go installed on your physical device from the Play Store or App Store. This is the fastest way to run the app during development without a local build.
- A free Groq account and API key from https://console.groq.com.

For building APKs or AABs via EAS you will also need a free Expo account from https://expo.dev and the EAS CLI installed globally.

### Installation

Clone the repository and install dependencies.

```bash
git clone https://github.com/siv-the-programmer/RecipeAI_RN.git
cd RecipeAI_RN
npm install
```

### Groq API Key Setup

The API key is stored in `src/groqService.js`. Open that file in any text editor and locate the following line near the top:

```js
const GROQ_API_KEY = 'YOUR_GROQ_API_KEY_HERE';
```

Replace `YOUR_GROQ_API_KEY_HERE` with your actual Groq key. Keys begin with `gsk_`. Save the file.

To obtain a key: sign up at https://console.groq.com, click API Keys in the left sidebar, then click Create API Key. The key is shown only once, so copy it immediately.

Do not commit your API key to version control. Consider adding your local copy of `src/groqService.js` to `.gitignore`, or moving the key to a `.env` file with a library such as `react-native-dotenv` before pushing to a public repository.

### Running the App

Start the Metro development server:

```bash
npx expo start
```

A QR code will appear in the terminal. Scan it with the Expo Go app on Android, or with the native Camera app on iOS. The app will load on your device over your local network connection.

To open directly on a connected Android device or running emulator:

```bash
npm run android
```

To clear the Metro bundler cache if the app behaves unexpectedly after a dependency change:

```bash
npx expo start --clear
```

---

## Building for Distribution

EAS (Expo Application Services) handles cloud builds without requiring Android Studio or Xcode locally. All build profiles are defined in `eas.json`.

### Build an APK

An APK can be installed directly on any Android device without going through the Play Store. It is the fastest path to distributing the app for testing.

```bash
npm install -g eas-cli
eas login
eas init
npm run build:apk
```

`eas login` authenticates with your expo.dev account. `eas init` links the project to your account and writes the generated `projectId` into the `extra.eas` field in `app.json`. `npm run build:apk` triggers the `preview` build profile in `eas.json`, which produces an APK via the `android.buildType: "apk"` setting.

When the cloud build completes you will receive a download link for the `.apk` file. Open the link on any Android device to download and install it directly.

### Build an AAB for Google Play

```bash
npm run build:aab
```

This triggers the `production` build profile in `eas.json`, which produces an Android App Bundle (`.aab`). Upload the resulting file to Google Play Console under your app's release track.

---

## Customisation

| What to change | Where |
|---|---|
| AI model | `src/groqService.js` — change the `MODEL` constant |
| Number of recipe suggestions returned | `src/groqService.js` — edit the prompt text in `analyzeIngredientsAndGetRecipes` |
| AI temperature or response length | `src/groqService.js` — adjust `temperature` and the `maxTokens` arguments in each `callGroq` call |
| App colour palette | `src/theme.js` — edit the `colors` export |
| Difficulty badge colours | `src/theme.js` — edit the `difficulty` export |
| App name shown on device | `app.json` — change `expo.name` |
| Android package identifier | `app.json` — change `expo.android.package` |
| App icon and splash screen | Replace the files in `assets/` — the icon must be a 1024x1024 PNG with no transparency for the adaptive icon |
| PDF visual layout and styling | `src/pdfService.js` — edit the HTML template string and the inline CSS block |

---

## Troubleshooting

**App crashes immediately on launch**
Verify that the Groq API key is correctly pasted into `src/groqService.js`. Ensure there are no extra spaces, line breaks, or nested quote characters inside the string value.

**"Invalid API key" error when analyzing a photo**
Ensure the key begins with `gsk_`. Re-copy it directly from the Groq console at https://console.groq.com/keys to rule out clipboard issues.

**"Could not parse response. Please try again." error**
The Groq model returned a response that could not be parsed as valid JSON. This is intermittent and usually resolves on retry. If it fails consistently, the model may have changed its output format — check the raw response by adding a temporary `console.log(text)` before the `JSON.parse` call in `groqService.js`.

**Camera or gallery permission not granted**
Accept the permission prompt the first time the app requests it. If you previously denied it, go to your device Settings, locate the Recipe AI app under installed applications, open Permissions, and manually enable Camera and Photos or Media.

**PDF download does nothing or shows an error**
Ensure `expo-print` and `expo-sharing` are present in `node_modules` by running `npm install`, then restart the development server. On some Android devices, the native share sheet may appear empty if no compatible PDF reader or file manager app is installed.

**EAS build fails with "project not found"**
Run `eas whoami` to confirm you are authenticated. If the `projectId` in `app.json` still reads `YOUR_EAS_PROJECT_ID`, run `eas init` to have EAS generate and insert the correct value automatically.

**Expo Go shows "Something went wrong" on scan**
Stop the Metro server with Ctrl+C and restart it with the cache cleared:

```
npx expo start --clear
```

**Bundler error mentioning reanimated**
The `react-native-reanimated/plugin` entry in `babel.config.js` must be the last item in the `plugins` array. Confirm this matches the repository version, then restart Metro with `--clear`.

---

## License

This project is licensed under the GNU General Public License v3.0. See the `LICENSE` file in the repository root for the full terms.
