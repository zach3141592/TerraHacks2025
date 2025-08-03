# DailyScan - Medical Photo Analysis Assistant

A mobile-first web application that uses Google's Gemini AI to analyze medical photos and provide insights on cuts, bruises, moles, hives, and phlegm conditions.

## Features

- 📱 **Mobile-Optimized**: Designed specifically for mobile usage with responsive design
- 📸 **Camera Integration**: Capture photos directly from your device's camera
- 🔍 **AI Analysis**: Powered by Google's Gemini AI for intelligent photo analysis
- ⏱️ **Healing Timeline**: Get estimated recovery timelines for conditions
- 💡 **Healing Tips**: Receive evidence-based recommendations for faster healing
- 🎨 **Clean UI**: Elegant black and white design that's classy and simple

## Supported Conditions

- **Cuts/Wounds**: Open wounds, lacerations, scratches
- **Bruises**: Contusions, black and blue marks
- **Moles/Spots**: Skin spots, moles, unusual marks
- **Hives/Rash**: Skin irritation, bumps, redness
- **Phlegm/Mucus**: Respiratory secretions

## Setup Instructions

### 1. Clone and Install

```bash
cd dailyscan
npm install
```

### 2. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Configure Environment

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Edit the `.env` file and replace the placeholder with your actual API key:

```env
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

⚠️ **Important**: Never commit your actual API key to version control. The `.env` file is already added to `.gitignore` to protect your sensitive data.

### 4. Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

1. **Start Camera**: Tap "Start Camera" to access your device's camera
2. **Capture Photo**: Use the capture button to take a photo, or upload an existing image
3. **Select Condition**: Choose the type of condition you're analyzing
4. **Analyze**: Tap "Analyze Photo" to get AI-powered insights
5. **Review Results**: View identified observations, healing timeline, and care tips

## Mobile Access

For the best mobile experience:

1. Open the app in your mobile browser
2. Add to home screen for app-like experience:
   - **iOS**: Tap the share button → "Add to Home Screen"
   - **Android**: Tap the menu → "Add to Home Screen"

## Important Medical Disclaimer

⚠️ **This application is for informational purposes only and does not replace professional medical advice.**

- Always consult healthcare providers for proper diagnosis and treatment
- Seek immediate medical attention for serious injuries or concerning symptoms
- This tool is designed to supplement, not replace, professional medical care

## Technology Stack

- **Frontend**: React 19 with Vite
- **AI**: Google Gemini 1.5 Flash
- **Styling**: Custom CSS with mobile-first design
- **Icons**: Lucide React
- **Camera**: WebRTC/MediaDevices API

## Browser Compatibility

- **Chrome**: ✅ Full support
- **Safari**: ✅ Full support
- **Firefox**: ✅ Full support
- **Edge**: ✅ Full support

Camera access requires HTTPS in production.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── App.jsx          # Main application component
├── index.css        # Global styles and theme
├── main.jsx         # React app entry point
└── assets/          # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile devices
5. Submit a pull request

## Privacy & Security

- Photos are processed locally and sent only to Google's Gemini API
- No photos are stored permanently on our servers
- API calls are made directly from your browser
- Follow Google's AI usage policies and terms of service

## License

This project is for educational and personal use. Please ensure compliance with medical software regulations if using in professional settings.

## Support

For issues or questions:

1. Check that your API key is correctly configured
2. Ensure you have a stable internet connection
3. Verify camera permissions are granted
4. Try refreshing the page or restarting the browser

---

Built with ❤️ for better health monitoring and awareness.
