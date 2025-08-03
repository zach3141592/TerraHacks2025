import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, RotateCcw, CheckCircle, AlertCircle, Settings, Activity, Scan, Home, User, Mail, Lock, Eye, EyeOff, Clock, Heart, Circle, CheckCircle2, History, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import databaseService from './services/database';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || 'your-api-key-here');

const CONDITIONS = [
  { 
    id: 'cut', 
    label: 'Cut/Wound', 
    description: 'Open wounds, lacerations, scratches', 
    icon: '🩹',
    color: '#FF3B30'
  },
  { 
    id: 'bruise', 
    label: 'Bruise', 
    description: 'Contusions, black and blue marks', 
    icon: '🟣',
    color: '#5856D6'
  },
  { 
    id: 'mole', 
    label: 'Mole/Spot', 
    description: 'Skin spots, moles, unusual marks', 
    icon: '🔴',
    color: '#FF9500'
  },
  { 
    id: 'hives', 
    label: 'Hives/Rash', 
    description: 'Skin irritation, bumps, redness', 
    icon: '🔻',
    color: '#FF2D92'
  },
  { 
    id: 'phlegm', 
    label: 'Phlegm/Mucus', 
    description: 'Respiratory secretions', 
    icon: '💧',
    color: '#32D74B'
  }
];

function StatusBar() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="status-bar">
      <div className="status-left">
        <span>{time}</span>
      </div>
      <div className="status-right">
        <span>●●●●●</span>
        <span>📶</span>
        <span>100%</span>
        <span>🔋</span>
      </div>
    </div>
  );
}

function NavigationHeader({ onReset }) {
  return (
    <div className="nav-header">
      <div className="nav-header-content">
        <div className="app-title">
          <div className="app-icon">
            <img src="/logo.png" alt="DailyScan" className="logo-image-small" />
          </div>
          <h1>DailyScan</h1>
        </div>
        <div className="nav-actions">
          <button className="nav-button" onClick={onReset} title="New Scan">
            <RotateCcw size={16} />
          </button>
          <button className="nav-button" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CameraSection({ 
  cameraStream, 
  videoRef, 
  onStartCamera, 
  onCapturePhoto, 
  onFileUpload, 
  onDropPhoto,
  fileInputRef 
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      onDropPhoto(imageFile);
    }
  };

  return (
    <div 
      className={`camera-section fade-in ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="camera-container">
        {cameraStream ? (
          <>
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay
              playsInline
              muted
            />
            <div className="camera-overlay">
              <div className="viewfinder"></div>
            </div>
            <div className="capture-controls">
              <button className="capture-button" onClick={onCapturePhoto}>
                <Camera size={32} />
              </button>
            </div>
          </>
        ) : (
          <div className="camera-placeholder">
            <div className="camera-placeholder-icon">
              <Camera size={40} />
            </div>
            <h3>Camera Ready</h3>
            <p>Start scanning to analyze medical conditions</p>
            {dragOver && (
              <div className="drop-overlay">
                <Upload size={48} />
                <p>Drop your photo here</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="action-buttons">
        <button className="btn btn-primary" onClick={onStartCamera}>
          <Camera size={20} />
          Start Camera
        </button>
        <button 
          className="btn btn-secondary" 
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={20} />
          Upload Photo
        </button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,image/heic,image/heif"
        onChange={onFileUpload}
        style={{ display: 'none' }}
        multiple={false}
        capture="environment"
      />
    </div>
  );
}

function PhotoSection({ photo, onRetake }) {
  return (
    <div className="photo-section fade-in">
      <div className="photo-preview">
        <img src={photo} alt="Captured medical photo" />
      </div>
      
      <div className="action-buttons">
        <button className="btn btn-secondary" onClick={onRetake}>
          <RotateCcw size={20} />
          Retake Photo
        </button>
      </div>
    </div>
  );
}

function ConditionSelection({ conditions, selectedCondition, onSelect }) {
  return (
    <div className="condition-section slide-up">
      <h2 className="section-title">What type of condition is this?</h2>
      
      <div className="condition-grid">
        {conditions.map((condition) => (
          <button
            key={condition.id}
            className={`condition-card ${selectedCondition === condition.id ? 'selected' : ''}`}
            onClick={() => onSelect(condition.id)}
          >
            <span className="condition-icon">{condition.icon}</span>
            <div className="condition-label">{condition.label}</div>
            <div className="condition-description">{condition.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function VisualTimeline({ timelineText }) {
  const parseTimelineStages = (text) => {
    if (!text) return [];
    
    const lines = text.split('\n').filter(line => line.trim());
    const stages = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for stage patterns like "**Stage 1 (Days 1-3):** Description"
      const stageMatch = trimmedLine.match(/\*\*Stage\s+(\d+)\s*\(([^)]+)\):\*\*\s*(.*)/i);
      if (stageMatch) {
        stages.push({
          stage: parseInt(stageMatch[1]),
          duration: stageMatch[2],
          description: stageMatch[3] || ''
        });
      }
      // Also look for bullet points that might be stage descriptions
      else if (trimmedLine.startsWith('•') && stages.length > 0) {
        const lastStage = stages[stages.length - 1];
        if (!lastStage.description) {
          lastStage.description = trimmedLine.substring(1).trim();
        }
      }
    }
    
    // If no structured stages found, create a simple timeline
    if (stages.length === 0) {
      const timelineLines = lines.filter(line => line.trim() && !line.includes('Timeline') && !line.includes('TIMELINE'));
      if (timelineLines.length > 0) {
        stages.push({
          stage: 1,
          duration: 'Healing Period',
          description: timelineLines.join(' ')
        });
      }
    }
    
    return stages;
  };

  const stages = parseTimelineStages(timelineText);
  
  if (stages.length === 0) {
    return null;
  }

  return (
    <div className="visual-timeline">
      <div className="timeline-container">
        {stages.map((stage, index) => (
          <div key={stage.stage} className="timeline-stage">
            <div className="timeline-connector">
              <div className={`timeline-dot ${index === 0 ? 'active' : ''}`}>
                {index === 0 ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </div>
              {index < stages.length - 1 && <div className="timeline-line"></div>}
            </div>
            
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="stage-number">Stage {stage.stage}</span>
                <span className="stage-duration">{stage.duration}</span>
              </div>
              <div className="stage-description">
                {stage.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisSection({ result, onNewScan }) {
  const formatContent = (content) => {
    if (!content) return 'No information available.';
    
    // Convert bullet points to HTML list items
    const lines = content.split('\n').filter(line => line.trim());
    const hasListItems = lines.some(line => line.trim().startsWith('•'));
    
    if (hasListItems) {
      return (
        <ul>
          {lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('•')) {
              return <li key={index}>{trimmedLine.substring(1).trim()}</li>;
            } else if (trimmedLine.startsWith('**') && trimmedLine.includes(':**')) {
              // Handle stage formatting
              return (
                <div key={index} className="stage-item">
                  <div className="stage-title">{trimmedLine.replace(/\*\*/g, '')}</div>
                </div>
              );
            } else if (trimmedLine) {
              return <li key={index}>{trimmedLine}</li>;
            }
            return null;
          }).filter(Boolean)}
        </ul>
      );
    }
    
    // If no bullet points, return formatted text with line breaks
    return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />;
  };

  return (
    <div className="analysis-section slide-up">
      <h2 className="section-title">Analysis Results</h2>
      
      <div className="analysis-card">
        <h3>
          <Eye size={20} />
          Observations
        </h3>
        <div className="structured-content">
          {formatContent(result.abnormalities)}
        </div>
      </div>

      <div className="analysis-card">
        <h3>
          <Clock size={20} />
          Healing Timeline
        </h3>
        <VisualTimeline timelineText={result.timeline} />
        <div className="structured-content">
          {formatContent(result.timeline)}
        </div>
      </div>

      <div className="analysis-card">
        <h3>
          <Heart size={20} />
          Care Recommendations
        </h3>
        <div className="structured-content">
          {formatContent(result.tips)}
        </div>
      </div>

      <div className="alert alert-warning">
        <AlertCircle size={20} />
        <span>
          This analysis is for informational purposes only. Please consult a healthcare provider for proper medical advice.
        </span>
      </div>

      <div className="action-buttons">
        <button className="btn btn-primary" onClick={onNewScan}>
          <Activity size={20} />
          New Scan
        </button>
      </div>
    </div>
  );
}

function LoadingOverlay({ message }) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="spinner"></div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
}

function RecentScanCard({ scan, onView }) {
  const formatDate = (date) => {
    const now = new Date();
    const scanDate = new Date(date);
    const diffTime = Math.abs(now - scanDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return scanDate.toLocaleDateString();
  };

  const conditionIcon = CONDITIONS.find(c => c.id === scan.condition_type)?.icon || '📋';

  return (
    <div className="scan-card" onClick={() => onView(scan)}>
      <div className="scan-icon">
        {conditionIcon}
      </div>
      <div className="scan-content">
        <div className="scan-header">
          <span className="scan-type">{scan.conditionLabel}</span>
          <span className="scan-date">{formatDate(scan.date)}</span>
        </div>
        <div className="scan-preview">
          {scan.observations ? scan.observations.substring(0, 80) + '...' : 'Analysis completed'}
        </div>
      </div>
      <div className="scan-arrow">
        <Eye size={16} />
      </div>
    </div>
  );
}

function HomePage({ recentScans, isDatabaseLoading, onViewScan }) {
  return (
    <div className="page-content fade-in">
      <div className="welcome-section">
        <div className="welcome-header">
          <div className="welcome-icon">
            <img src="/logo.png" alt="DailyScan" className="logo-image-large" />
          </div>
          <h2>Welcome to DailyScan</h2>
          <p>AI-powered medical photo analysis for better health monitoring</p>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <Scan size={24} />
          </div>
          <h3>Quick Analysis</h3>
          <p>Get instant insights on cuts, bruises, moles, rashes, and more</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <Camera size={24} />
          </div>
          <h3>Easy Capture</h3>
          <p>Take photos with guided camera or upload existing images</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <CheckCircle size={24} />
          </div>
          <h3>Care Tips</h3>
          <p>Receive personalized healing recommendations and timelines</p>
        </div>
        
        <div className="feature-card">
          <div className="feature-icon">
            <AlertCircle size={24} />
          </div>
          <h3>Health Alerts</h3>
          <p>Get notified about concerning features that need medical attention</p>
        </div>
      </div>

      <div className="recent-section">
        <div className="recent-header">
          <h3>Recent Scans</h3>
          <div className="scan-count">
            <History size={16} />
            <span>{recentScans.length}</span>
          </div>
        </div>
        
        {isDatabaseLoading ? (
          <div className="loading-state">
            <div className="spinner-small"></div>
            <span>Loading recent scans...</span>
          </div>
        ) : recentScans.length > 0 ? (
          <div className="scans-list">
            {recentScans.map((scan) => (
              <RecentScanCard 
                key={scan.id} 
                scan={scan} 
                onView={onViewScan}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Activity size={48} />
            <p>No recent scans</p>
            <span>Start your first medical scan to see results here</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ onSignOut }) {
  return (
    <div className="page-content fade-in">
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={32} />
        </div>
        <h2>Your Profile</h2>
        <p>Manage your health monitoring preferences</p>
      </div>

      <div className="profile-section">
        <div className="profile-card">
          <h3>Scan History</h3>
          <div className="profile-stat">
            <span className="stat-number">0</span>
            <span className="stat-label">Total Scans</span>
          </div>
        </div>

        <div className="profile-card">
          <h3>Preferences</h3>
          <div className="preference-item">
            <span>Auto-save photos</span>
            <div className="toggle-switch">
              <input type="checkbox" id="autosave" />
              <label htmlFor="autosave"></label>
            </div>
          </div>
          <div className="preference-item">
            <span>Health notifications</span>
            <div className="toggle-switch">
              <input type="checkbox" id="notifications" defaultChecked />
              <label htmlFor="notifications"></label>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h3>About DailyScan</h3>
          <div className="info-item">
            <span>Version</span>
            <span>1.0.0</span>
          </div>
          <div className="info-item">
            <span>Privacy Policy</span>
            <span>→</span>
          </div>
          <div className="info-item">
            <span>Terms of Service</span>
            <span>→</span>
          </div>
          <div className="info-item" style={{ cursor: 'pointer' }} onClick={onSignOut}>
            <span>Sign Out</span>
            <span>→</span>
          </div>
        </div>
      </div>

      <div className="disclaimer-card">
        <AlertCircle size={20} />
        <p>DailyScan is for informational purposes only. Always consult healthcare professionals for medical advice.</p>
      </div>
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleInputChange = (field, value) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }));
    setLoginError(''); // Clear error when user types
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      setLoginError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simple validation - in real app this would be API call
      if (loginData.email.includes('@') && loginData.password.length >= 6) {
        onLogin();
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (err) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoginData({
      email: 'demo@dailyscan.com',
      password: 'password123'
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-logo">
            <img src="/logo.png" alt="DailyScan Logo" className="logo-image" />
          </div>
          <h1>Welcome to DailyScan</h1>
          <p>Sign in to access your medical photo analysis</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {loginError && (
            <div className="alert alert-error">
              <AlertCircle size={20} />
              {loginError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-container">
              <Mail size={20} className="input-icon" />
              <input
                id="email"
                type="email"
                value={loginData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                className="form-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <Lock size={20} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password"
                className="form-input"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid transparent', borderTop: '2px solid white' }}></div>
                Signing in...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Sign In
              </>
            )}
          </button>

          <div className="login-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary demo-button"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            <Activity size={20} />
            Try Demo Account
          </button>
        </form>

        <div className="login-footer">
          <div className="login-links">
            <a href="#" className="link">Forgot Password?</a>
            <span>•</span>
            <a href="#" className="link">Create Account</a>
          </div>
          
          <div className="login-disclaimer">
            <AlertCircle size={16} />
            <span>This app is for informational purposes only. Always consult healthcare professionals for medical advice.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomNavigation({ currentPage, onPageChange }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'scan', label: 'Scan', icon: Scan },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-content">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
            >
              <Icon size={24} className="nav-item-icon" />
              <span className="nav-item-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('scan'); // 'home', 'scan', 'profile'
  const [currentView, setCurrentView] = useState('camera');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const [isDatabaseLoading, setIsDatabaseLoading] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize database and load recent scans
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await databaseService.initialize();
        await loadRecentScans();
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError('Failed to initialize local database. Some features may not work properly.');
      } finally {
        setIsDatabaseLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  const loadRecentScans = useCallback(async () => {
    try {
      const scans = await databaseService.getRecentScans(10);
      setRecentScans(scans);
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    }
  }, []);

  const handleViewScan = useCallback((scan) => {
    // Convert stored scan data back to the format expected by the analysis view
    const analysisResult = {
      abnormalities: scan.observations,
      timeline: scan.timeline,
      tips: scan.recommendations
    };
    
    setAnalysisResult(analysisResult);
    setCurrentPage('scan');
    setCurrentView('analysis');
    
    // Reset photo and condition data since we're viewing a historical scan
    setCapturedPhoto(null);
    setSelectedCondition(scan.condition_type);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError('');
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions or upload a photo instead.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(photoDataUrl);
    setCurrentView('photo');
    stopCamera();
  }, [stopCamera]);

  const processImageFile = useCallback((file) => {
    if (file) {
      // Handle HEIC/HEIF files on iOS
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCapturedPhoto(e.target.result);
          setCurrentView('photo');
          stopCamera();
          setError(''); // Clear any previous errors
        };
        reader.onerror = () => {
          setError('Failed to read the image file. Please try a different photo.');
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please select a valid image file (JPG, PNG, HEIC, etc.)');
      }
    }
  }, [stopCamera]);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    processImageFile(file);
  }, [processImageFile]);

  const handleDropPhoto = useCallback((file) => {
    processImageFile(file);
  }, [processImageFile]);

  const analyzePhoto = useCallback(async () => {
    if (!capturedPhoto || !selectedCondition) {
      setError('Please select a condition type before analyzing.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const conditionInfo = CONDITIONS.find(c => c.id === selectedCondition);
      
      const prompt = `Analyze this medical photo of a ${conditionInfo.label.toLowerCase()}. Provide a concise, well-structured response with exactly three sections:

**OBSERVATIONS:**
- List 2-3 key visual observations in bullet points
- Note colors, size, texture, or concerning features
- Keep each point brief (1 sentence max)
- Be descriptive but not diagnostic

**HEALING TIMELINE:**
- Provide expected timeframe in clear stages
- Use format: "Stage 1 (Days 1-3): ...", "Stage 2 (Days 4-7): ..."
- Include total expected healing time
- Maximum 3 stages

**CARE RECOMMENDATIONS:**
- List 3-5 specific, actionable recommendations
- Use bullet points with clear instructions
- Focus on evidence-based care
- Include "See healthcare provider if..." warning

FORMATTING REQUIREMENTS:
- Use bold headers (**OBSERVATIONS:**, **HEALING TIMELINE:**, **CARE RECOMMENDATIONS:**)
- Use bullet points (•) for lists
- Keep responses concise and scannable
- No lengthy paragraphs
- Maximum 2-3 sentences per bullet point

IMPORTANT: Do not provide medical diagnoses. This is for informational purposes only.`;

      const base64Data = capturedPhoto.split(',')[1];
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      const sections = parseAnalysisResponse(text);
      setAnalysisResult(sections);
      setCurrentView('analysis');
      
      // Save scan to database
      try {
        await databaseService.saveScan({
          conditionType: selectedCondition,
          photoData: capturedPhoto,
          analysisResult: sections
        });
        // Reload recent scans to update the home page
        await loadRecentScans();
      } catch (dbError) {
        console.error('Failed to save scan to database:', dbError);
        // Don't show error to user as analysis was successful
      }
      
    } catch (err) {
      setError('Analysis failed. Please check your internet connection and try again.');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [capturedPhoto, selectedCondition]);

  const parseAnalysisResponse = (text) => {
    const sections = {
      abnormalities: '',
      timeline: '',
      tips: ''
    };

    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) continue;
      
      // Check for section headers (both with and without asterisks)
      const lowerLine = trimmedLine.toLowerCase();
      if (lowerLine.includes('observation') && lowerLine.includes(':')) {
        currentSection = 'abnormalities';
        continue;
      } else if (lowerLine.includes('timeline') && lowerLine.includes(':')) {
        currentSection = 'timeline';
        continue;
      } else if ((lowerLine.includes('care') || lowerLine.includes('recommendation')) && lowerLine.includes(':')) {
        currentSection = 'tips';
        continue;
      }
      
      // Process content lines for current section
      if (trimmedLine && currentSection) {
        let processedLine = trimmedLine;
        
        // Clean up bullet points and formatting
        processedLine = processedLine.replace(/^\*\*|\*\*$/g, ''); // Remove bold asterisks
        processedLine = processedLine.replace(/^[•\-\*]\s*/, '• '); // Normalize bullet points
        processedLine = processedLine.replace(/^Stage\s+(\d+)\s*\(([^)]+)\):\s*/i, '**Stage $1 ($2):** '); // Format timeline stages
        
        // Skip duplicate content or formatting-only lines
        if (processedLine.length > 3) {
          sections[currentSection] += (sections[currentSection] ? '\n' : '') + processedLine;
        }
      }
    }

    // Clean up any remaining formatting issues
    for (const key in sections) {
      sections[key] = sections[key]
        .replace(/\n\n+/g, '\n') // Remove multiple newlines
        .replace(/^\n|\n$/g, '')  // Remove leading/trailing newlines
        .trim();
    }

    return sections;
  };

  const resetApp = () => {
    setCapturedPhoto(null);
    setSelectedCondition('');
    setAnalysisResult(null);
    setError('');
    setCurrentView('camera');
    stopCamera();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (page === 'scan') {
      resetApp();
    } else {
      stopCamera();
    }
  };

  const handleRetakePhoto = () => {
    setCurrentView('camera');
    setSelectedCondition('');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app">
      <StatusBar />
      <NavigationHeader onReset={resetApp} />

      <main className="main-content">
        {currentPage === 'home' && (
        <HomePage 
          recentScans={recentScans} 
          isDatabaseLoading={isDatabaseLoading}
          onViewScan={handleViewScan}
        />
      )}
        
        {currentPage === 'profile' && <ProfilePage onSignOut={() => setIsAuthenticated(false)} />}
        
        {currentPage === 'scan' && (
          <>
            {error && (
              <div className="alert alert-error fade-in">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {currentView === 'camera' && (
              <CameraSection
                cameraStream={cameraStream}
                videoRef={videoRef}
                onStartCamera={startCamera}
                onCapturePhoto={capturePhoto}
                onFileUpload={handleFileUpload}
                onDropPhoto={handleDropPhoto}
                fileInputRef={fileInputRef}
              />
            )}

            {currentView === 'photo' && capturedPhoto && (
              <>
                <PhotoSection 
                  photo={capturedPhoto} 
                  onRetake={handleRetakePhoto} 
                />
                
                <ConditionSelection
                  conditions={CONDITIONS}
                  selectedCondition={selectedCondition}
                  onSelect={setSelectedCondition}
                />

                {selectedCondition && (
                  <div className="action-buttons slide-up">
                    <button 
                      className="btn btn-primary" 
                      onClick={analyzePhoto}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid transparent', borderTop: '2px solid white' }}></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Analyze Photo
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}

            {currentView === 'analysis' && analysisResult && (
              <>
                {capturedPhoto && (
                  <div className="photo-section">
                    <div className="photo-preview" style={{ maxWidth: '200px', margin: '0 auto' }}>
                      <img src={capturedPhoto} alt="Analyzed photo" />
                    </div>
                  </div>
                )}
                
                <AnalysisSection 
                  result={analysisResult} 
                  onNewScan={resetApp} 
                />
              </>
            )}
          </>
        )}
      </main>

      <BottomNavigation currentPage={currentPage} onPageChange={handlePageChange} />

      {isAnalyzing && (
        <LoadingOverlay message="Analyzing your photo..." />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}

export default App;