import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, Settings, Download, Upload, Scissors, RefreshCw, 
  Layers, Check, ChevronDown, ChevronRight, Eye, EyeOff, Sparkles, 
  MessageSquare, Mic, Sliders, Type, Palette, Search, Plus, Trash2, 
  Film, X, Maximize2, SkipBack, SkipForward, ArrowRight, BookOpen, VolumeX,
  Move, Crop, Wand2, CheckCircle2, AlertCircle, FileText, FolderOpen, ExternalLink,
  Lock, Unlock, Edit2, PlayCircle, ZoomIn, ZoomOut, Bot, Zap
} from 'lucide-react';

export default function App() {
  // Navigation
  const [navTab, setNavTab] = useState('subs'); // 'home', 'subs', 'dub', 'voice'

  // App & Video State
  const [videos, setVideos] = useState([]);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);

  // Active video reference
  const activeVideo = videos.find(v => v.id === activeVideoId) || null;
  const subtitles = activeVideo?.subtitles || [];

  // ASR & OCR Settings
  const [asrEngine, setAsrEngine] = useState('gemini-audio'); // 'gemini-audio', 'pp-ocrv4', 'whisper'
  const [showOcrBox, setShowOcrBox] = useState(true);
  const [autoMerge, setAutoMerge] = useState(true);
  const [diarization, setDiarization] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(null);

  // Interactive Bounding Box Mode: 'ocr' or 'blur'
  const [dragMode, setDragMode] = useState('ocr');
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Crop Box for OCR (Normalized 0.0 - 1.0)
  const [cropBox, setCropBox] = useState({
    x_pct: 0.08,
    y_pct: 0.76,
    w_pct: 0.84,
    h_pct: 0.16
  });

  // AI Translation Settings
  const [aiProvider, setAiProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [aiModel, setAiModel] = useState('gemini-2.0-flash');
  const [targetLang, setTargetLang] = useState('Vietnamese');
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [characterProfiles, setCharacterProfiles] = useState('');
  const [translateProgress, setTranslateProgress] = useState(null);

  // Subtitle Typography & Styling & Interactive Position
  const [keyStatus, setKeyStatus] = useState(null);
  const [subStyle, setSubStyle] = useState({
    font_name: 'Arial',
    font_size: 26,
    color: '#FFE128',
    outline_color: '#000000',
    outline_width: 2,
    margin_v: 42,
    alignment: 2, // 2 = Bottom center
    pos_x_pct: 0.50, // 50% = Center horizontal
    pos_y_pct: 0.88, // 88% = Near bottom
    box_w_pct: 0.88  // Max width of subtitle bounding box
  });

  // Blur Subtitles / Subtitle Removal Settings
  const [blurBox, setBlurBox] = useState({
    enabled: true,
    sync_subtitles: true,
    type: 'blur', // 'blur' (Làm mờ Gauss siêu mạnh), 'box' (Băng đen điện ảnh), 'mosaic' (Pixelate)
    x_pct: 0.08,
    y_pct: 0.77,
    w_pct: 0.84,
    h_pct: 0.15,
    blur_radius: 38,
    opacity: 0.85,
    pad_top: 0,
    pad_bottom: 0,
    pad_left: 0,
    pad_right: 0
  });

  // Interactive Transform States (Move & 8-point Resizing for Blur & OCR Box)
  const [transformAction, setTransformAction] = useState(null); // 'move' | 'resize' | null
  const [resizeHandle, setResizeHandle] = useState(null); // 'tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'
  const [transformStart, setTransformStart] = useState(null);
  const [selectedBox, setSelectedBox] = useState('blur'); // 'blur' | 'ocr'

  // Video Color Filters
  const [colorFilter, setColorFilter] = useState('none');

  // TTS Settings
  const [selectedVoice, setSelectedVoice] = useState('vi-VN-HoaiMyNeural');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [autoFitDuration, setAutoFitDuration] = useState(true);
  const [isolateBgm, setIsolateBgm] = useState(true);
  const [bgmVolume, setBgmVolume] = useState(0.8);
  const [ttsVolume, setTtsVolume] = useState(1.3);
  const [ttsProgress, setTtsProgress] = useState(null);
  const [pronunciationRules, setPronunciationRules] = useState([
    { from: 'SpongeBob', to: 'sờ pon bóp' },
    { from: 'Rolls-Royce', to: 'rôn roi' },
    { from: 'iPhone', to: 'ai phon' }
  ]);

  // Track Collapse Toggles
  const [collapsedTracks, setCollapsedTracks] = useState({
    video: false,
    sub: false,
    voice: false
  });

  // UI Tabs & Modals
  const [leftTab, setLeftTab] = useState('subs'); // 'subs' (Phụ đề) or 'dub' (Thuyết minh)
  const [pipelineProgress, setPipelineProgress] = useState(null); // for 1-click Xử lý video
  const [activeRightTab, setActiveRightTab] = useState('subs'); // 'subs' (Danh sách phụ đề) or 'props' (Thuộc tính)
  const [propsSubTab, setPropsSubTab] = useState('style'); // 'style' (Kiểu) or 'pos' (Vị trí)
  const [dubSubTab, setDubSubTab] = useState('single'); // 'single' (Một giọng) or 'diarize' (Phân vai)
  const [filterSubMode, setFilterSubMode] = useState('all'); // 'all', 'untranslated', 'attention', 'no_audio'
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [timecodeInterval, setTimecodeInterval] = useState(0.2);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPronounceModal, setShowPronounceModal] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [languagePack, setLanguagePack] = useState({
    enabled: true,
    region: 'north',
    numbers: true,
    acronyms: true,
    foreign_names: true
  });
  const [pronounceRules, setPronounceRules] = useState([
    { source: 'Rolls-Royce Phantom', target: 'rôn roi phan tôm' },
    { source: 'AI', target: 'ây ai' },
    { source: 'CapCut', target: 'cáp cắt' }
  ]);
  const [newRuleSource, setNewRuleSource] = useState('');
  const [newRuleTarget, setNewRuleTarget] = useState('');
  const [testPronounceText, setTestPronounceText] = useState('Rolls-Royce Phantom đang chạy trên đường');
  const [testPronounceResult, setTestPronounceResult] = useState('');
  const [exportProgress, setExportProgress] = useState(null);
  const [exportedFileUrl, setExportedFileUrl] = useState(null);
  const [exportFilename, setExportFilename] = useState('');
  const [exportDir, setExportDir] = useState('');
  const [exportedData, setExportedData] = useState(null);
  const [previewExportedVideo, setPreviewExportedVideo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // VidLab AI Agent & Smart Sync States
  const [showAiAgentModal, setShowAiAgentModal] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentChatHistory, setAgentChatHistory] = useState([
    {
      role: 'assistant',
      text: 'Xin chào! Tôi là Trợ lý AI Studio (VidLab Built-in Agent). Tôi có thể giúp bạn tự động căn chỉnh khớp các câu thoại, chống dính voice, quét vét phân đoạn bỏ sót, hoặc tinh chỉnh bản dịch.'
    }
  ]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [isAligningAi, setIsAligningAi] = useState(false);
  const [recoverProgress, setRecoverProgress] = useState(null);

  // CapCut Timeline & Subtitle/Voice Editor States
  const [editingSub, setEditingSub] = useState(null);
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);
  const [trackMuted, setTrackMuted] = useState({ video: false, voice: false });
  const [trackLocked, setTrackLocked] = useState({ video: false, sub: false, voice: false });
  const [hideSubtitlesTrack, setHideSubtitlesTrack] = useState(false);
  const [showPosPreview, setShowPosPreview] = useState(false);
  const [exportBurnSubs, setExportBurnSubs] = useState(true);
  const [timelineHeight, setTimelineHeight] = useState(250);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoContainerRef = useRef(null);
  const timelineRef = useRef(null);
  const timelineScrollContainerRef = useRef(null);
  const wsRef = useRef(null);
  const activeAudioRef = useRef(null);
  const playedSubIdRef = useRef(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);

  // Timeline Height Drag-to-Resize Handler
  const handleTimelineResizeStart = (e) => {
    e.preventDefault();
    setIsResizingTimeline(true);
    const startY = e.clientY;
    const startH = timelineHeight;

    const onMouseMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newH = Math.min(520, Math.max(160, Math.round(startH + deltaY)));
      setTimelineHeight(newH);
    };

    const onMouseUp = () => {
      setIsResizingTimeline(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Timeline Mouse Wheel: Ctrl+Wheel to Zoom smoothly (1x - 25x), Normal Wheel for Horizontal Pan
  useEffect(() => {
    const container = timelineScrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.8 : -0.8;
        setZoomLevel(prev => {
          const next = Math.min(25, Math.max(1, +(prev + delta).toFixed(1)));
          return next;
        });
      } else if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Auto-scroll timeline to keep playhead visible
  useEffect(() => {
    if (isPlaying && timelineScrollContainerRef.current && timelineRef.current && duration > 0) {
      const container = timelineScrollContainerRef.current;
      const scrollWidth = timelineRef.current.scrollWidth;
      const playheadPx = (currentTime / duration) * scrollWidth;
      const viewLeft = container.scrollLeft;
      const viewWidth = container.clientWidth;

      if (playheadPx > viewLeft + viewWidth * 0.82 || playheadPx < viewLeft) {
        container.scrollTo({
          left: Math.max(0, playheadPx - viewWidth * 0.25),
          behavior: 'smooth'
        });
      }
    }
  }, [currentTime, isPlaying, duration]);

  // Sync cropBox & subStyle with activeVideo
  useEffect(() => {
    if (activeVideo?.crop_box) {
      setCropBox(activeVideo.crop_box);
    }
    if (activeVideo?.sub_style) {
      setSubStyle(prev => ({ ...prev, ...activeVideo.sub_style }));
    }
  }, [activeVideoId]);

  // WebSocket for Real-Time Backend Progress
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:8000/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ocr_progress') {
          setOcrProgress({ progress: data.progress, message: data.message });
          if (data.progress >= 1.0) {
            setTimeout(() => setOcrProgress(null), 1200);
          }
        } else if (data.type === 'ocr_complete') {
          setOcrProgress(null);
          setVideos(prev => prev.map(v => v.id === data.video_id ? { ...v, subtitles: data.subtitles, status: 'ocr_done' } : v));
        } else if (data.type === 'translate_progress') {
          setTranslateProgress({ progress: data.progress, message: data.message });
          if (data.progress >= 1.0) {
            setTimeout(() => setTranslateProgress(null), 1200);
          }
        } else if (data.type === 'translate_complete') {
          setTranslateProgress(null);
          setVideos(prev => prev.map(v => v.id === data.video_id ? { ...v, subtitles: data.subtitles, status: 'translated' } : v));
        } else if (data.type === 'tts_progress') {
          setTtsProgress({ progress: data.progress, message: data.message });
          if (data.progress >= 1.0) {
            setTimeout(() => setTtsProgress(null), 1200);
          }
        } else if (data.type === 'tts_complete') {
          setTtsProgress(null);
          setVideos(prev => prev.map(v => v.id === data.video_id ? { ...v, subtitles: data.subtitles, status: 'tts_done' } : v));
        } else if (data.type === 'export_progress') {
          setExportProgress({ progress: data.progress, message: data.message });
          if (data.progress >= 1.0) {
            setTimeout(() => setExportProgress(null), 1500);
          }
        } else if (data.type === 'export_complete') {
          setExportProgress(null);
          setExportedFileUrl(data.download_url);
          setExportedData({
            download_url: data.download_url,
            filename: data.filename,
            file_path: data.file_path,
            folder_path: data.folder_path,
            file_size_mb: data.file_size_mb
          });
        } else if (data.type === 'pipeline_progress') {
          setPipelineProgress({ progress: data.progress, message: data.message, step: data.step });
        } else if (data.type === 'pipeline_complete') {
          setPipelineProgress(null);
          setVideos(prev => prev.map(v => v.id === data.video_id ? { ...v, subtitles: data.subtitles, status: 'ready_for_export' } : v));
        } else if (data.type === 'pipeline_error') {
          setPipelineProgress(null);
          alert('Lỗi xử lý video tự động: ' + data.error);
        } else if (data.type === 'ocr_error') {
          setOcrProgress(null);
          alert('Lỗi nhận dạng: ' + data.error);
        } else if (data.type === 'translate_error') {
          setTranslateProgress(null);
          alert('Lỗi dịch thuật: ' + data.error);
        } else if (data.type === 'tts_error') {
          setTtsProgress(null);
          alert('Lỗi TTS: ' + data.error);
        } else if (data.type === 'export_error') {
          setExportProgress(null);
          alert('Lỗi xuất video: ' + data.error);
        } else if (data.type === 'recover_progress') {
          setRecoverProgress({ progress: data.progress, message: data.message });
        } else if (data.type === 'recover_complete') {
          setRecoverProgress(null);
          setVideos(prev => prev.map(v => v.id === data.video_id ? { ...v, subtitles: data.subtitles } : v));
          alert(`Đã quét vét & phục hồi thành công ${data.recovered_count} phân đoạn câu thoại bị bỏ sót!`);
        } else if (data.type === 'recover_error') {
          setRecoverProgress(null);
          alert('Lỗi quét vét phân đoạn thiếu: ' + data.error);
        }
      } catch (err) {
        console.error('WS error:', err);
      }
    };

    return () => ws.close();
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    fetch('/api/videos')
      .then(r => r.json())
      .then(data => {
        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          setActiveVideoId(data.active_video_id || data.videos[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Helper to resolve web playable audio URL
  const getSubAudioUrl = (sub) => {
    if (!sub) return null;
    if (sub.audio_url) return sub.audio_url;
    if (sub.audio_file) {
      const norm = sub.audio_file.replace(/\\/g, '/');
      const idx = norm.indexOf('/temp/');
      if (idx !== -1) return norm.substring(idx);
    }
    return null;
  };

  const playVoicePreview = (sub, e) => {
    if (e) e.stopPropagation();
    const url = getSubAudioUrl(sub);
    if (!url) return;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    const a = new Audio(url);
    activeAudioRef.current = a;
    setPlayingVoiceId(sub.id);
    a.play().catch(err => console.warn('Audio play prevented:', err));
    a.onended = () => {
      setPlayingVoiceId(null);
    };
  };

  // Time & Playback handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);

    if (trackMuted.video) {
      videoRef.current.muted = true;
    } else {
      videoRef.current.muted = false;
    }

    // Audio sync for TTS voiceover preview while playing video
    if (subtitles.length > 0 && !trackMuted.voice) {
      const curSub = subtitles.find(s => t >= s.start && t < s.end);
      if (curSub && (curSub.audio_file || curSub.audio_url)) {
        if (playedSubIdRef.current !== curSub.id) {
          playedSubIdRef.current = curSub.id;
          const url = getSubAudioUrl(curSub);
          if (url) {
            if (activeAudioRef.current) {
              try { activeAudioRef.current.pause(); } catch(e){}
            }
            const a = new Audio(url);
            activeAudioRef.current = a;
            setPlayingVoiceId(curSub.id);
            // Duck background video audio to 25% during voiceover
            if (!trackMuted.video && videoRef.current) videoRef.current.volume = 0.25;
            a.play().catch(err => console.warn(err));
            a.onended = () => {
              if (videoRef.current && !trackMuted.video) videoRef.current.volume = 1.0;
              setPlayingVoiceId(null);
            };
          }
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if (activeAudioRef.current) activeAudioRef.current.pause();
        videoRef.current.volume = 1.0;
        setPlayingVoiceId(null);
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (sec) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, sec));
      setCurrentTime(videoRef.current.currentTime);
      if (activeAudioRef.current) activeAudioRef.current.pause();
      playedSubIdRef.current = null;
      videoRef.current.volume = 1.0;
      setPlayingVoiceId(null);
    }
  };

  // Video Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const newVideo = await res.json();
      setVideos(prev => [...prev, newVideo]);
      setActiveVideoId(newVideo.id);
    } catch (err) {
      alert('Tải video thất bại: ' + err.message);
    }
  };

  // Interactive Drag-to-Draw Bounding Box on Video Canvas
  const handleOverlayMouseDown = (e) => {
    if (!videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yPct = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setIsDrawing(true);
    setDragStart({ x: xPct, y: yPct });
  };

  const handleOverlayMouseMove = (e) => {
    if (!videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();

    // 1. Interactive Move & Resize Handling
    if (transformAction && transformStart) {
      const deltaX = (e.clientX - transformStart.mouseX) / transformStart.rectW;
      const deltaY = (e.clientY - transformStart.mouseY) / transformStart.rectH;

      const updateTargetBox = (props) => {
        if (selectedBox === 'blur') {
          setBlurBox(prev => ({ ...prev, ...props }));
        } else {
          setCropBox(prev => ({ ...prev, ...props }));
        }
      };

      if (transformAction === 'move') {
        if (selectedBox === 'sub') {
          const deltaX = (e.clientX - transformStart.mouseX) / transformStart.rectW;
          const deltaY = (e.clientY - transformStart.mouseY) / transformStart.rectH;
          const newCenterX = Math.max(0.05, Math.min(0.95, +(transformStart.startX + deltaX).toFixed(3)));
          const newCenterY = Math.max(0.04, Math.min(0.96, +(transformStart.startY + deltaY).toFixed(3)));
          const newMarginV = Math.max(10, Math.round((1 - newCenterY) * transformStart.rectH));
          setSubStyle(prev => ({
            ...prev,
            pos_x_pct: newCenterX,
            pos_y_pct: newCenterY,
            margin_v: newMarginV
          }));
        } else {
          const newX = Math.max(0, Math.min(1 - transformStart.startW, transformStart.startX + deltaX));
          const newY = Math.max(0, Math.min(1 - transformStart.startH, transformStart.startY + deltaY));
          updateTargetBox({ x_pct: newX, y_pct: newY });
        }
      } else if (transformAction === 'resize') {
        if (selectedBox === 'sub') {
          const deltaX = (e.clientX - transformStart.mouseX) / transformStart.rectW;
          let newW = transformStart.startW;
          if (resizeHandle === 'r') {
            newW = Math.max(0.25, Math.min(0.98, +(transformStart.startW + deltaX * 2).toFixed(3)));
          } else if (resizeHandle === 'l') {
            newW = Math.max(0.25, Math.min(0.98, +(transformStart.startW - deltaX * 2).toFixed(3)));
          }
          setSubStyle(prev => ({ ...prev, box_w_pct: newW }));
        } else {
          const { startX, startY, startW, startH } = transformStart;
          let newX = startX;
          let newY = startY;
          let newW = startW;
          let newH = startH;

          if (resizeHandle.includes('r')) {
            newW = Math.max(0.04, Math.min(1 - startX, startW + deltaX));
          }
          if (resizeHandle.includes('l')) {
            const potW = startW - deltaX;
            if (potW >= 0.04 && startX + deltaX >= 0) {
              newX = startX + deltaX;
              newW = potW;
            }
          }
          if (resizeHandle.includes('b')) {
            newH = Math.max(0.03, Math.min(1 - startY, startH + deltaY));
          }
          if (resizeHandle.includes('t')) {
            const potH = startH - deltaY;
            if (potH >= 0.03 && startY + deltaY >= 0) {
              newY = startY + deltaY;
              newH = potH;
            }
          }
          updateTargetBox({ x_pct: newX, y_pct: newY, w_pct: newW, h_pct: newH });
        }
      }
      return;
    }

    // 2. Drag-to-draw new bounding box
    if (!isDrawing || !dragStart) return;
    const currentX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const currentY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const left = Math.min(dragStart.x, currentX);
    const top = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    if (dragMode === 'ocr') {
      setCropBox({ x_pct: left, y_pct: top, w_pct: width, h_pct: height });
    } else {
      setBlurBox(prev => ({ ...prev, x_pct: left, y_pct: top, w_pct: width, h_pct: height }));
    }
  };

  const handleOverlayMouseUp = () => {
    if (isDrawing && activeVideoId) {
      setIsDrawing(false);
      setDragStart(null);
      // Persist to activeVideo object
      setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, crop_box: cropBox } : v));
    }
    if (transformAction) {
      if (selectedBox === 'sub' && activeVideoId) {
        setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, sub_style: subStyle } : v));
        fetch('/api/video/sub-style', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_id: activeVideoId, sub_style: subStyle })
        }).catch(console.error);
      }
      setTransformAction(null);
      setResizeHandle(null);
      setTransformStart(null);
    }
  };

  // Direct Interactive Move Handler for Bounding Box & Subtitle Text
  const handleStartMove = (target, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    setTransformAction('move');
    setSelectedBox(target);

    if (target === 'sub') {
      const curX = subStyle.pos_x_pct !== undefined ? subStyle.pos_x_pct : 0.50;
      const curY = subStyle.pos_y_pct !== undefined ? subStyle.pos_y_pct : 0.88;
      const curW = subStyle.box_w_pct || 0.88;
      setTransformStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: curX,
        startY: curY,
        startW: curW,
        startH: 0.12,
        rectW: rect.width,
        rectH: rect.height
      });
      return;
    }

    const box = target === 'blur' ? blurBox : cropBox;
    setTransformStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: box.x_pct,
      startY: box.y_pct,
      startW: box.w_pct,
      startH: box.h_pct,
      rectW: rect.width,
      rectH: rect.height
    });
  };

  // Direct Interactive Resizing Handler
  const handleStartResize = (target, handle, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!videoContainerRef.current) return;
    const rect = videoContainerRef.current.getBoundingClientRect();
    setTransformAction('resize');
    setResizeHandle(handle);
    setSelectedBox(target);

    if (target === 'sub') {
      const curX = subStyle.pos_x_pct !== undefined ? subStyle.pos_x_pct : 0.50;
      const curY = subStyle.pos_y_pct !== undefined ? subStyle.pos_y_pct : 0.88;
      const curW = subStyle.box_w_pct || 0.88;
      setTransformStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        startX: curX,
        startY: curY,
        startW: curW,
        startH: 0.12,
        rectW: rect.width,
        rectH: rect.height
      });
      return;
    }

    const box = target === 'blur' ? blurBox : cropBox;
    setTransformStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: box.x_pct,
      startY: box.y_pct,
      startW: box.w_pct,
      startH: box.h_pct,
      rectW: rect.width,
      rectH: rect.height
    });
  };

  // Quick Preset Actions for Subtitle Removal Box
  const handlePresetBlur = (type) => {
    if (type === 'bottom_fit') {
      setBlurBox(prev => ({ ...prev, x_pct: 0.08, y_pct: 0.77, w_pct: 0.84, h_pct: 0.15 }));
    } else if (type === 'full_width') {
      setBlurBox(prev => ({ ...prev, x_pct: 0.0, w_pct: 1.0 }));
    } else if (type === 'zoom_in') {
      setBlurBox(prev => ({
        ...prev,
        x_pct: Math.max(0, prev.x_pct - 0.02),
        y_pct: Math.max(0, prev.y_pct - 0.015),
        w_pct: Math.min(1.0, prev.w_pct + 0.04),
        h_pct: Math.min(1.0, prev.h_pct + 0.03)
      }));
    } else if (type === 'zoom_out') {
      setBlurBox(prev => ({
        ...prev,
        x_pct: Math.min(0.4, prev.x_pct + 0.02),
        y_pct: Math.min(0.9, prev.y_pct + 0.015),
        w_pct: Math.max(0.1, prev.w_pct - 0.04),
        h_pct: Math.max(0.04, prev.h_pct - 0.03)
      }));
    }
  };

  // Check Gemini API Key
  const handleCheckApiKey = async () => {
    if (!apiKey) {
      alert("Vui lòng nhập API Key trước khi kiểm tra!");
      return;
    }
    setKeyStatus({ checking: true });
    try {
      const res = await fetch("/api/check-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey })
      });
      const data = await res.json();
      setKeyStatus(data);
    } catch (err) {
      setKeyStatus({ valid: false, error: err.message });
    }
  };

  // AI Smart Align & De-collide (Chống dính voice, tạo nhịp thở tự nhiên)
  const handleRunAiAlign = async () => {
    if (!activeVideoId || subtitles.length === 0) {
      alert('Chưa có câu phụ đề nào để căn chỉnh. Hãy nhận dạng hoặc thêm câu trước.');
      return;
    }
    setIsAligningAi(true);
    try {
      const res = await fetch('/api/ai/align-and-decollide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: activeVideoId, min_gap: 0.30, subtitles })
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: data.subtitles } : v));
        alert(data.message || 'Đã tự động căn chỉnh khớp các câu thoại và loại bỏ hoàn toàn dính chữ/chèn âm!');
      } else {
        alert('Lỗi căn chỉnh: ' + (data.error || 'Không xác định'));
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ: ' + err.message);
    } finally {
      setIsAligningAi(false);
    }
  };

  // AI Recover Missing Speech Intervals (Quét vét phân đoạn bỏ sót)
  const handleRunRecoverMissing = async () => {
    if (!activeVideoId) {
      alert('Vui lòng chọn hoặc tải video lên trước.');
      return;
    }
    setRecoverProgress({ progress: 0.1, message: 'Đang bắt đầu phân tích âm thanh VAD để tìm các câu thoại bị sót...' });
    try {
      const res = await fetch('/api/ai/recover-missing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          api_key: apiKey,
          target_language: targetLang
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setRecoverProgress(null);
        alert('Lỗi quét câu thiếu: ' + (err.error || res.statusText));
      }
    } catch (err) {
      setRecoverProgress(null);
      alert('Lỗi kết nối máy chủ: ' + err.message);
    }
  };

  // VidLab Built-in Agent Chat Copilot
  const handleSendAgentMessage = async (msg) => {
    const textToSend = (msg || agentPrompt).trim();
    if (!textToSend || !activeVideoId) return;
    setAgentChatHistory(prev => [...prev, { role: 'user', text: textToSend }]);
    setAgentPrompt('');
    setIsAgentThinking(true);
    try {
      const res = await fetch('/api/ai/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: activeVideoId, prompt: textToSend, api_key: apiKey })
      });
      const data = await res.json();
      if (data.subtitles) {
        setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: data.subtitles } : v));
      }
      setAgentChatHistory(prev => [...prev, { role: 'assistant', text: data.reply || 'Đã thực hiện xong lệnh của bạn.' }]);
      if (data.action === 'recover_trigger') {
        handleRunRecoverMissing();
      }
    } catch (err) {
      setAgentChatHistory(prev => [...prev, { role: 'assistant', text: 'Lỗi xử lý lệnh: ' + err.message }]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  // Trigger: Start OCR / Speech Recognition
  const handleStartOcr = async () => {
    if (!activeVideoId) return;
    setOcrProgress({ progress: 0.05, message: 'Đang khởi chạy nhận dạng...' });
    await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: activeVideoId,
        model: asrEngine,
        api_key: apiKey,
        crop_box: cropBox
      })
    });
  };

  // Trigger: Start Translation
  const handleStartTranslate = async () => {
    if (!activeVideoId || subtitles.length === 0) return;
    setTranslateProgress({ progress: 0.05, message: 'Đang kết nối AI dịch thuật...' });
    await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: activeVideoId,
        provider: aiProvider,
        api_key: apiKey,
        model: aiModel,
        style_key: selectedStyle,
        character_profiles: characterProfiles,
        target_language: targetLang
      })
    });
  };

  // 1-Click: Xử lý video tự động (Bóc băng -> Dịch -> Tạo giọng thuyết minh)
  const handleRunAutoPipeline = async () => {
    if (!activeVideoId) return;
    setPipelineProgress({ progress: 0.05, message: 'Đang khởi chạy toàn bộ quy trình AI...', step: 'init' });
    try {
      const res = await fetch('/api/pipeline/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          api_key: apiKey,
          target_language: targetLang,
          style_key: selectedStyle,
          character_profiles: characterProfiles,
          voice_id: selectedVoice,
          auto_fit: autoFitDuration
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setPipelineProgress(null);
        alert('Lỗi khởi chạy xử lý video: ' + (err.error || res.statusText));
      }
    } catch (e) {
      setPipelineProgress(null);
      alert('Không thể kết nối máy chủ: ' + e.message);
    }
  };

  // Helper: Auto-save subtitles to backend
  const saveSubtitlesToBackend = async (subsToSave) => {
    if (!activeVideoId || !subsToSave) return;
    try {
      await fetch('/api/subtitles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: activeVideoId, subtitles: subsToSave })
      });
    } catch (err) {
      console.warn('Lỗi tự động lưu phụ đề:', err);
    }
  };

  // Trigger: Start TTS Dubbing
  const handleStartTts = async () => {
    if (!activeVideoId || subtitles.length === 0) return;
    setTtsProgress({ progress: 0.05, message: 'Đang khởi chạy tạo giọng đọc AI thuyết minh...' });
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          voice_id: selectedVoice,
          pronunciation_rules: pronunciationRules,
          auto_fit: autoFitDuration,
          subtitles: subtitles
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setTtsProgress(null);
        alert('Lỗi tạo giọng: ' + (err.error || res.statusText));
      }
    } catch (e) {
      setTtsProgress(null);
      alert('Không thể kết nối đến máy chủ backend: ' + e.message);
    }
  };

  const handleOpenExportModal = async () => {
    setShowExportModal(true);
    setPreviewExportedVideo(false);
    if (activeVideoId) {
      try {
        const res = await fetch(`/api/export-defaults?video_id=${activeVideoId}`);
        if (res.ok) {
          const d = await res.json();
          if (!exportFilename) setExportFilename(d.default_filename);
          if (!exportDir) setExportDir(d.default_export_dir);
        }
      } catch (err) {
        console.warn('Error fetching export defaults:', err);
      }
    }
  };

  const handleOpenWindowsFolder = async (filePath, folderPath) => {
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_path: filePath, folder_path: folderPath })
      });
    } catch (err) {
      alert('Không thể mở thư mục: ' + err);
    }
  };

  // Trigger: Start Export Video
  const handleStartExport = async () => {
    if (!activeVideoId) return;
    setExportProgress({ progress: 0.05, message: 'Đang khởi động render video với FFmpeg...' });
    setExportedFileUrl(null);
    setExportedData(null);
    setPreviewExportedVideo(false);
    await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_id: activeVideoId,
        color_filter: colorFilter,
        sub_style: subStyle,
        blur_box: blurBox,
        isolate_bgm: isolateBgm,
        original_audio_vol: bgmVolume,
        tts_audio_vol: ttsVolume,
        burn_subtitles: exportBurnSubs && !hideSubtitlesTrack,
        custom_filename: exportFilename,
        custom_export_dir: exportDir,
        subtitles: subtitles
      })
    });
  };

  // Format seconds mm:ss.ms
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "00:00.0";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const selectedSub = subtitles.find(s => s.id === selectedSubId);

  // CapCut Voice & Subtitle Actions
  const handleOpenEditSubModal = (sub, e) => {
    if (e) e.stopPropagation();
    setSelectedSubId(sub.id);
    setEditingSub({ ...sub, voice_id: sub.voice_id || selectedVoice });
  };

  const handleGenerateSingleTts = async (sub, targetVoiceId = null) => {
    if (!activeVideoId || !sub) return;
    const vId = targetVoiceId || sub.voice_id || selectedVoice;
    setIsGeneratingSingle(true);
    try {
      const res = await fetch('/api/tts/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          sub_id: sub.id,
          text: sub.translated_text || sub.text,
          voice_id: vId,
          auto_fit: autoFitDuration
        })
      });
      const data = await res.json();
      if (data.success && data.subtitle) {
        setVideos(prev => prev.map(v => {
          if (v.id === activeVideoId) {
            return {
              ...v,
              subtitles: v.subtitles.map(s => s.id === sub.id ? data.subtitle : s)
            };
          }
          return v;
        }));
        if (editingSub && editingSub.id === sub.id) {
          setEditingSub(data.subtitle);
        }
        playVoicePreview(data.subtitle);
      } else {
        alert('Lỗi tạo giọng: ' + (data.error || 'Thất bại'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  const handleDeleteVoice = async (subId, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`Bạn có chắc chắn muốn xóa file giọng đọc câu #${subId}?`)) return;
    try {
      const res = await fetch('/api/subtitles/delete-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          sub_id: subId
        })
      });
      const data = await res.json();
      if (data.success) {
        setVideos(prev => prev.map(v => {
          if (v.id === activeVideoId) {
            return {
              ...v,
              subtitles: v.subtitles.map(s => s.id === subId ? { ...s, audio_file: null, audio_url: null } : s)
            };
          }
          return v;
        }));
        if (editingSub && editingSub.id === subId) {
          setEditingSub(prev => ({ ...prev, audio_file: null, audio_url: null }));
        }
      }
    } catch (err) {
      alert('Lỗi xóa voice: ' + err.message);
    }
  };

  const handleDeleteSub = async (subId, e) => {
    if (e) e.stopPropagation();
    if (!confirm(`Bạn có chắc muốn xóa hẳn câu phụ đề #${subId}?`)) return;
    try {
      const res = await fetch('/api/subtitles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          sub_id: subId
        })
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: data.subtitles } : v));
        if (editingSub && editingSub.id === subId) {
          setEditingSub(null);
        }
        if (selectedSubId === subId) {
          setSelectedSubId(null);
        }
      }
    } catch (err) {
      alert('Lỗi xóa câu: ' + err.message);
    }
  };

  const handleAddSub = async () => {
    if (!activeVideoId) return;
    const start = currentTime;
    const end = Math.min(duration || 9999, currentTime + 2.5);
    try {
      const res = await fetch('/api/subtitles/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: activeVideoId,
          start,
          end,
          text: 'Câu thoại mới',
          translated_text: 'Câu thoại mới'
        })
      });
      const data = await res.json();
      if (data.success && data.subtitles) {
        setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: data.subtitles } : v));
        if (data.subtitle) {
          setSelectedSubId(data.subtitle.id);
          setEditingSub(data.subtitle);
        }
      }
    } catch (err) {
      alert('Lỗi thêm câu mới: ' + err.message);
    }
  };

  const handleSplitSub = async () => {
    if (!activeVideoId || subtitles.length === 0) return;
    const curSub = subtitles.find(s => currentTime > s.start + 0.2 && currentTime < s.end - 0.2);
    if (!curSub) {
      alert('Vui lòng di chuyển con trỏ phát (Playhead) vào giữa một câu phụ đề để tách câu.');
      return;
    }
    const sub1 = { ...curSub, end: parseFloat(currentTime.toFixed(2)), audio_file: null, audio_url: null };
    const sub2 = {
      ...curSub,
      id: curSub.id + 0.5,
      start: parseFloat(currentTime.toFixed(2)),
      audio_file: null,
      audio_url: null
    };
    const updated = [];
    for (const s of subtitles) {
      if (s.id === curSub.id) {
        updated.push(sub1);
        updated.push(sub2);
      } else {
        updated.push(s);
      }
    }
    updated.sort((a, b) => a.start - b.start);
    updated.forEach((s, idx) => { s.id = idx + 1; });
    try {
      const res = await fetch('/api/subtitles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: activeVideoId, subtitles: updated })
      });
      const data = await res.json();
      if (data.success) {
        setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: updated } : v));
        setSelectedSubId(sub1.id);
      }
    } catch (err) {
      alert('Lỗi tách câu: ' + err.message);
    }
  };

  const handleSaveEditedSub = async () => {
    if (!editingSub || !activeVideoId) return;
    const updated = subtitles.map(s => s.id === editingSub.id ? editingSub : s);
    try {
      await fetch('/api/subtitles/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: activeVideoId, subtitles: updated })
      });
      setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: updated } : v));
      setEditingSub(null);
    } catch (err) {
      alert('Lỗi lưu phụ đề: ' + err.message);
    }
  };

  const currentSub = subtitles.find(s => currentTime >= s.start && currentTime <= s.end);

  const translatedCount = subtitles.filter(s => s.translated_text && s.translated_text.trim() !== '').length;
  const attentionCount = subtitles.filter(s => !s.translated_text || !s.audio_file).length;
  const noAudioCount = subtitles.filter(s => !s.audio_file && !s.audio_url).length;

  const filteredSubtitles = subtitles.filter(s => {
    // Mode filter
    if (filterSubMode === 'untranslated' && (s.translated_text && s.translated_text.trim() !== '' && s.translated_text !== s.text)) {
      return false;
    }
    if (filterSubMode === 'attention' && (s.translated_text && (s.audio_file || s.audio_url))) {
      return false;
    }
    if (filterSubMode === 'no_audio' && (s.audio_file || s.audio_url)) {
      return false;
    }
    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (s.text && s.text.toLowerCase().includes(q)) || 
           (s.translated_text && s.translated_text.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#141518] text-[#e0e1e6]">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-12 border-b border-[#24252a] bg-[#1a1b1f] flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center space-x-6">
          {/* Logo & Version */}
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f5a623] to-[#d48810] flex items-center justify-center font-black text-black text-sm shadow-md shadow-amber-500/20">
              EZ
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-extrabold tracking-tight text-white text-base">VietAnh Sub</span>
              <span className="text-[10px] bg-[#2d2e35] text-[#f5a623] px-1.5 py-0.5 rounded font-mono font-medium">STUDIO v2.2</span>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            <button 
              onClick={() => setNavTab('home')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${navTab === 'home' ? 'bg-[#25262c] text-white border border-[#3b3d47]' : 'text-[#8b8d97] hover:text-white'}`}
            >
              Trang chủ
            </button>
            <button 
              onClick={() => setNavTab('subs')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center space-x-1.5 ${navTab === 'subs' ? 'bg-[#25262c] text-[#f5a623] border border-[#f5a623]/40' : 'text-[#8b8d97] hover:text-white'}`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Phụ đề</span>
            </button>
            <button 
              onClick={() => setNavTab('dub')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition flex items-center space-x-1.5 ${navTab === 'dub' ? 'bg-[#25262c] text-[#f5a623] border border-[#f5a623]/40' : 'text-[#8b8d97] hover:text-white'}`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Thuyết minh</span>
            </button>
            <button 
              onClick={() => setShowVoicePicker(true)}
              className="px-3 py-1 text-xs font-medium rounded-md text-[#8b8d97] hover:text-white hover:bg-[#25262c]/60 flex items-center space-x-1.5 transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Đọc giọng</span>
            </button>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Video Selector Dropdown */}
          <div className="flex items-center space-x-1.5 bg-[#141518] px-2 py-1 rounded-md border border-[#2b2c32] text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shrink-0" />
            <select
              value={activeVideoId || ''}
              onChange={e => {
                const vid = e.target.value;
                setActiveVideoId(vid);
                setCurrentTime(0);
                if (videoRef.current) videoRef.current.currentTime = 0;
              }}
              className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer max-w-[200px] truncate"
              title="Chọn video để làm việc"
            >
              {videos.map(v => (
                <option key={v.id} value={v.id} className="bg-[#1a1b1f] text-white">
                  {v.title}
                </option>
              ))}
            </select>
          </div>

          {/* Open Video */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-3 py-1.5 text-xs bg-[#24252a] hover:bg-[#2f3036] text-[#c5c7ce] hover:text-white rounded-md border border-[#32333b] flex items-center space-x-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Nhập video</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="video/*" 
            className="hidden" 
          />

          {/* Export Video (Highlight Primary) */}
          <button
            onClick={handleOpenExportModal}
            className="px-4 py-1.5 bg-gradient-to-r from-[#f5a623] to-[#e09415] hover:from-[#f7b036] hover:to-[#e89d1e] text-black font-bold text-xs rounded-md flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            <span>Xuất video</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE: 3 COLUMNS */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. LEFT SIDEBAR PANEL (ezmaxsub Studio v2.2.2 Dual-Tab) */}
        <div className="w-[320px] bg-[#1a1b1f] border-r border-[#24252a] flex flex-col shrink-0 select-none">
          {/* Top Switcher Tabs: [Phụ đề] & [Thuyết minh] */}
          <div className="flex border-b border-[#24252a] bg-[#141518] shrink-0">
            <button
              onClick={() => setLeftTab('subs')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition ${
                leftTab === 'subs'
                  ? 'border-[#f5a623] text-[#f5a623] bg-[#1a1b1f]'
                  : 'border-transparent text-[#8b8d97] hover:text-white hover:bg-[#1a1b1f]/50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Phụ đề</span>
            </button>
            <button
              onClick={() => setLeftTab('dub')}
              className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center space-x-1.5 border-b-2 transition ${
                leftTab === 'dub'
                  ? 'border-[#f5a623] text-[#f5a623] bg-[#1a1b1f]'
                  : 'border-transparent text-[#8b8d97] hover:text-white hover:bg-[#1a1b1f]/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Thuyết minh</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {leftTab === 'subs' ? (
              <>
                {/* Section: Nhận dạng giọng nói / OCR */}
                <div className="p-3 border-b border-[#24252a]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f5a623] flex items-center space-x-1.5 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nhận dạng giọng nói & OCR</span>
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <label className="text-[11px] text-[#8b8d97] block mb-1">Mô hình nhận dạng (ASR Engine)</label>
                      <select 
                        value={asrEngine} 
                        onChange={e => setAsrEngine(e.target.value)}
                        className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none"
                      >
                        <option value="gemini-audio">Gemini Audio ASR (Siêu nhanh 10x - Khuyên dùng)</option>
                        <option value="pp-ocrv4">VietAnh OCR Pro (Quét Sub cứng bằng RapidOCR)</option>
                        <option value="ocr-lite">VietAnh OCR Lite (Quét sub nhanh)</option>
                        <option value="whisper">OpenAI Whisper ASR</option>
                      </select>
                    </div>

                    {/* OCR Toggles */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#c5c7ce]">Bật vùng OCR (Khung nét đứt)</span>
                        <input 
                          type="checkbox" 
                          checked={showOcrBox} 
                          onChange={e => setShowOcrBox(e.target.checked)}
                          className="accent-[#f5a623] w-4 h-4 cursor-pointer" 
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#c5c7ce]">Ghép câu tự động</span>
                        <input 
                          type="checkbox" 
                          checked={autoMerge} 
                          onChange={e => setAutoMerge(e.target.checked)}
                          className="accent-[#f5a623] w-4 h-4 cursor-pointer" 
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#c5c7ce]">Phân biệt người nói (Diarization)</span>
                        <input 
                          type="checkbox" 
                          checked={diarization} 
                          onChange={e => setDiarization(e.target.checked)}
                          className="accent-[#f5a623] w-4 h-4 cursor-pointer" 
                        />
                      </div>
                    </div>

                    {/* Box mode switch */}
                    <div className="pt-2 border-t border-[#24252a]">
                      <div className="flex items-center justify-between text-[11px] text-[#8b8d97] mb-1">
                        <span>Chế độ vẽ trên Video:</span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setDragMode('ocr')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${dragMode === 'ocr' ? 'bg-[#00d2ff] text-black' : 'bg-[#24252a] text-[#8b8d97]'}`}
                          >
                            OCR Box
                          </button>
                          <button
                            onClick={() => setDragMode('blur')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${dragMode === 'blur' ? 'bg-[#f5a623] text-black' : 'bg-[#24252a] text-[#8b8d97]'}`}
                          >
                            Blur Box
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Dịch thuật AI (LLM Context) */}
                <div className="p-3 border-b border-[#24252a]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#f5a623] flex items-center space-x-1.5 mb-2.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Dịch thuật AI (LLM Context)</span>
                  </span>

                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-[#8b8d97] block mb-1">Nhà cung cấp</label>
                        <select 
                          value={aiProvider} 
                          onChange={e => setAiProvider(e.target.value)}
                          className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none"
                        >
                          <option value="gemini">Gemini</option>
                          <option value="deepseek">DeepSeek</option>
                          <option value="openai">OpenAI ChatGPT</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-[#8b8d97] block mb-1">Ngôn ngữ đích</label>
                        <select 
                          value={targetLang} 
                          onChange={e => setTargetLang(e.target.value)}
                          className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none"
                        >
                          <option value="Vietnamese">Tiếng Việt</option>
                          <option value="English">Tiếng Anh</option>
                          <option value="Chinese">Tiếng Trung</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-[#8b8d97]">API Key</label>
                        <button
                          type="button"
                          onClick={handleCheckApiKey}
                          className="text-[10px] text-[#f5a623] hover:underline font-medium flex items-center space-x-1"
                        >
                          <span>Kiểm tra khóa</span>
                        </button>
                      </div>
                      <input 
                        type="password" 
                        value={apiKey} 
                        onChange={e => { 
                          const v = e.target.value; 
                          setApiKey(v); 
                          setKeyStatus(null); 
                          try { localStorage.setItem('gemini_api_key', v); } catch (e) {} 
                        }}
                        placeholder="Dán Gemini API Key từ AI Studio..."
                        className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none font-mono"
                      />
                      {keyStatus && (
                        <div className="mt-1.5 p-1.5 rounded text-[10px] leading-tight">
                          {keyStatus.checking ? (
                            <span className="text-[#f5a623]">Đang kiểm tra kết nối Google API...</span>
                          ) : keyStatus.valid ? (
                            <div className="text-[#10b981] bg-[#10b981]/10 p-1.5 rounded border border-[#10b981]/30">
                              <div className="font-bold flex items-center space-x-1">
                                <Check className="w-3 h-3" />
                                <span>Khóa hợp lệ! ({keyStatus.models?.length} model)</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[#e11d48] bg-[#e11d48]/10 p-1.5 rounded border border-[#e11d48]/30">
                              <span className="font-bold">Lỗi khóa: </span>
                              <span>{keyStatus.error}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-[#8b8d97] block mb-1">Phong cách dịch (Context Style)</label>
                      <select 
                        value={selectedStyle} 
                        onChange={e => setSelectedStyle(e.target.value)}
                        className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none"
                      >
                        <option value="default">Default (Phổ thông / Đời thường)</option>
                        <option value="co_trang">Phim Cổ Trang / Cung Đấu</option>
                        <option value="kiem_hiep">Phim Kiếm Hiệp / Tiên Hiệp</option>
                        <option value="xuyen_khong">Phim Xuyên Không / Hệ Thống</option>
                        <option value="hien_dai">Phim Hiện Đại / Đô Thị</option>
                        <option value="hai_huoc">Hài Hước / Hoạt Hình</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-[#8b8d97] block mb-1">Hồ sơ nhân vật (Character Glossary)</label>
                      <textarea 
                        rows={2}
                        value={characterProfiles}
                        onChange={e => setCharacterProfiles(e.target.value)}
                        placeholder="spongebob -> Bọt Biển (nam)&#10;mr. krabs -> Cua Đỏ (ông chủ)"
                        className="w-full bg-[#141518] border border-[#2b2c32] rounded p-1.5 text-[11px] text-white focus:border-[#f5a623] outline-none font-mono resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* BIG GOLD 1-CLICK ACTION BUTTON: [✨ Xử lý video ˅] */}
                <div className="p-3 border-b border-[#24252a] space-y-2">
                  <button
                    onClick={handleRunAutoPipeline}
                    disabled={!activeVideo || (pipelineProgress !== null)}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-[#f5a623] to-[#e09415] hover:from-[#f7b036] hover:to-[#e89d1e] text-black font-extrabold text-xs rounded-md shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition active:scale-95 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-black shrink-0" />
                    <span>{pipelineProgress ? `${pipelineProgress.message} (${Math.round((pipelineProgress.progress || 0) * 100)}%)` : '✨ Xử lý video ˅'}</span>
                  </button>

                  {/* Split Action Buttons: [Nhận dạng ˅] & [Dịch ˅] */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleStartOcr}
                      disabled={!activeVideo || (ocrProgress !== null)}
                      className="py-2 px-2.5 bg-[#24252a] hover:bg-[#2f313a] disabled:opacity-50 text-white font-semibold text-xs rounded border border-[#3b3d47] flex items-center justify-center space-x-1.5 transition active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" />
                      <span>{ocrProgress ? 'Đang nhận dạng...' : 'Nhận dạng ˅'}</span>
                    </button>

                    <button
                      onClick={handleStartTranslate}
                      disabled={!activeVideo || subtitles.length === 0 || (translateProgress !== null)}
                      className="py-2 px-2.5 bg-[#24252a] hover:bg-[#2f313a] disabled:opacity-50 text-white font-semibold text-xs rounded border border-[#3b3d47] flex items-center justify-center space-x-1.5 transition active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#00d2ff] ${translateProgress ? 'animate-spin' : ''}`} />
                      <span>{translateProgress ? 'Đang dịch...' : 'Dịch ˅'}</span>
                    </button>
                  </div>

                  {/* HOÀN TÁC ROW */}
                  <div className="pt-2 border-t border-[#24252a] flex items-center justify-between text-[11px] text-[#8b8d97]">
                    <span className="font-bold text-[10px] uppercase text-[#6b6e7a]">Hoàn tác:</span>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: v.subtitles.map(s => ({ ...s, audio_file: null, audio_url: null })) } : v));
                          alert('Đã hoàn tác và làm mới toàn bộ file âm thanh lồng tiếng!');
                        }}
                        className="px-2 py-0.5 rounded bg-[#24252a] hover:bg-[#2e3038] text-[#c5c7ce] text-[10px]"
                      >
                        Audio
                      </button>
                      <button
                        onClick={() => {
                          setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: v.subtitles.map(s => ({ ...s, translated_text: '' })) } : v));
                          alert('Đã hoàn tác toàn bộ bản dịch tiếng Việt!');
                        }}
                        className="px-2 py-0.5 rounded bg-[#24252a] hover:bg-[#2e3038] text-[#c5c7ce] text-[10px]"
                      >
                        Bản dịch
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn xóa sạch toàn bộ danh sách phụ đề hiện tại?')) {
                            setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: [] } : v));
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-[#24252a] hover:bg-rose-950/40 text-rose-400 text-[10px]"
                      >
                        Phụ đề
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: VIDLAB AI OPTIMIZER & SMART ALIGNMENT */}
                <div className="p-3 border-b border-[#24252a] bg-[#161820]/70 rounded-lg mx-2 my-2 border border-[#2e3240]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#00d2ff] flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#00d2ff]" />
                      <span>Tối ưu & Khớp thoại AI</span>
                    </span>
                    <span className="text-[9px] bg-[#00d2ff]/20 text-[#00d2ff] px-1.5 py-0.5 rounded font-mono font-bold">VidLab AI</span>
                  </div>
                  <p className="text-[10px] text-[#8b8d97] mb-2.5 leading-relaxed">
                    Khắc phục hiện tượng đọc dính câu, ngắt quãng, cân bằng nhịp thở tự nhiên (0.3s) và bổ sung đoạn thoại nhận diện thiếu.
                  </p>
                  <div className="space-y-1.5">
                    <button
                      onClick={handleRunAiAlign}
                      disabled={isAligningAi || subtitles.length === 0}
                      className="w-full py-1.5 px-2 bg-[#00d2ff]/15 hover:bg-[#00d2ff]/25 text-[#00d2ff] border border-[#00d2ff]/40 rounded text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isAligningAi ? 'animate-spin' : ''}`} />
                      <span>{isAligningAi ? 'Đang căn chỉnh & chống dính...' : '⚡ AI Khớp thoại (Chống dính & Đều nhịp)'}</span>
                    </button>
                    <button
                      onClick={handleRunRecoverMissing}
                      disabled={recoverProgress !== null || !activeVideo}
                      className="w-full py-1.5 px-2 bg-[#a855f7]/15 hover:bg-[#a855f7]/25 text-[#c084fc] border border-[#a855f7]/40 rounded text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <Search className={`w-3.5 h-3.5 ${recoverProgress ? 'animate-pulse' : ''}`} />
                      <span>{recoverProgress ? `Đang quét câu thiếu (${Math.round((recoverProgress.progress || 0) * 100)}%)...` : '🔍 AI Quét bổ sung câu bị bỏ lỡ'}</span>
                    </button>
                    <button
                      onClick={() => setShowAiAgentModal(true)}
                      className="w-full py-1.5 px-2 bg-[#f5a623]/15 hover:bg-[#f5a623]/25 text-[#f5a623] border border-[#f5a623]/40 rounded text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
                    >
                      <Bot className="w-3.5 h-3.5 text-[#f5a623]" />
                      <span>🤖 Mở Trợ lý AI Copilot (VidLab)</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* TAB 2: THUYẾT MINH & LỒNG TIẾNG */
              <div className="p-3 space-y-4 text-xs">
                {/* Sub-tabs: [Một giọng] / [Phân vai] */}
                <div className="flex bg-[#141518] p-0.5 rounded-lg border border-[#2b2c32]">
                  <button
                    onClick={() => setDubSubTab('single')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                      dubSubTab === 'single'
                        ? 'bg-[#25262c] text-[#f5a623] shadow-sm'
                        : 'text-[#8b8d97] hover:text-white'
                    }`}
                  >
                    Một giọng
                  </button>
                  <button
                    onClick={() => setDubSubTab('diarize')}
                    className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                      dubSubTab === 'diarize'
                        ? 'bg-[#25262c] text-[#f5a623] shadow-sm'
                        : 'text-[#8b8d97] hover:text-white'
                    }`}
                  >
                    Phân vai
                  </button>
                </div>

                {/* Giọng đọc đang chọn */}
                <div>
                  <label className="text-[11px] text-[#8b8d97] block mb-1.5 font-bold uppercase tracking-wider">
                    Giọng đọc hiện tại
                  </label>
                  <div className="bg-[#141518] border border-[#2b2c32] rounded-lg p-2.5 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0077ff] flex items-center justify-center text-black font-black text-xs">
                        {selectedVoice.includes('HoaiMy') ? 'HM' : selectedVoice.includes('NamMinh') ? 'NM' : 'CP'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <span>
                            {selectedVoice.includes('HoaiMy') ? 'Hoài My' : selectedVoice.includes('NamMinh') ? 'Nam Minh' : 'CapCut Voice'}
                          </span>
                          <span className="text-[9px] bg-[#00d2ff]/20 text-[#00d2ff] px-1 py-0.2 rounded font-sans font-bold">
                            CAPCUT
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8b8d97]">
                          {selectedVoice.includes('HoaiMy') ? 'Nữ - Truyền cảm / Kể chuyện' : 'Nam - Trầm ấm / Lôi cuốn'}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowVoicePicker(true)}
                      className="px-2.5 py-1 bg-[#24252a] hover:bg-[#2f313a] border border-[#3b3d47] text-white text-[11px] rounded transition"
                    >
                      Đổi giọng
                    </button>
                  </div>
                </div>

                {/* Tham số giọng đọc */}
                <div className="bg-[#141518] border border-[#2b2c32] rounded-lg p-3 space-y-3">
                  <h4 className="font-bold text-[#f5a623] text-[11px] uppercase tracking-wider">
                    Tham số giọng đọc
                  </h4>

                  {/* Auto-fit switch */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#c5c7ce] font-medium block">Tự động khớp thời lượng</span>
                      <span className="text-[10px] text-[#8b8d97]">Tự co dãn tốc độ thoại vừa khít video</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={autoFitDuration} 
                      onChange={e => setAutoFitDuration(e.target.checked)}
                      className="accent-[#f5a623] w-4 h-4 cursor-pointer" 
                    />
                  </div>

                  {/* Language Pack Button */}
                  <div className="pt-2 border-t border-[#24252a]">
                    <button
                      onClick={() => setShowPronounceModal(true)}
                      className="w-full py-1.5 px-2.5 bg-[#202228] hover:bg-[#2b2d35] border border-[#383b47] rounded text-white text-xs flex items-center justify-between transition"
                    >
                      <div className="flex items-center space-x-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#f5a623]" />
                        <span>Từ điển phát âm (Language Pack)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8b8d97]" />
                    </button>
                  </div>

                  {/* Isolate BGM Switch */}
                  <div className="pt-2 border-t border-[#24252a] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-[#f5a623]" />
                        <span className="text-xs text-[#c5c7ce] font-medium">Khử giọng cũ & Giữ nhạc nền</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isolateBgm} 
                        onChange={e => setIsolateBgm(e.target.checked)}
                        className="accent-[#f5a623] w-4 h-4 cursor-pointer" 
                      />
                    </div>
                    <p className="text-[10px] text-[#8b8d97] leading-tight">
                      Lọc bỏ giọng nhân vật cũ, bảo tồn trọn vẹn nhạc nền & âm thanh gốc.
                    </p>
                  </div>
                </div>

                {/* Big Button: Tạo giọng cho tất cả */}
                <button
                  onClick={handleStartTts}
                  disabled={!activeVideo || subtitles.length === 0 || (ttsProgress !== null)}
                  className="w-full py-2.5 bg-gradient-to-r from-[#f5a623] to-[#e09415] hover:from-[#f7b036] hover:to-[#e89d1e] text-black font-extrabold text-xs rounded-md shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition active:scale-95 disabled:opacity-50"
                >
                  <Volume2 className="w-4 h-4 text-black shrink-0" />
                  <span>{ttsProgress ? 'Đang tạo giọng đọc...' : '🎙 Tạo giọng cho tất cả ˅'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. CENTER MAIN WORKSPACE (Video Player & Interactive Overlay) */}
        <div className="flex-1 flex flex-col bg-[#0f1012] relative overflow-hidden">
          {/* Notification / Progress Banner */}
          {(() => {
            const currentProg = ocrProgress || translateProgress || ttsProgress || exportProgress;
            if (!currentProg) return null;
            const isDone = (currentProg.progress || 0) >= 1.0;
            return (
              <div className="bg-[#222328] border-b border-[#f5a623]/30 px-4 py-2 flex items-center justify-between z-10 text-xs animate-in fade-in">
                <div className="flex items-center space-x-2">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-[#f5a623] animate-spin shrink-0" />
                  )}
                  <span className={`font-medium ${isDone ? 'text-emerald-300' : 'text-white'}`}>
                    {currentProg.message}
                  </span>
                </div>
                <div className="w-48 bg-[#141518] rounded-full h-2 overflow-hidden border border-[#2b2c32] shrink-0">
                  <div 
                    className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-[#f5a623]'}`}
                    style={{ width: `${Math.min(100, Math.round((currentProg.progress || 0) * 100))}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Main Video Screen with Interactive Overlay */}
          <div className="flex-1 flex items-center justify-center relative p-4 select-none">
            {activeVideo ? (
              <div 
                ref={videoContainerRef}
                onMouseDown={handleOverlayMouseDown}
                onMouseMove={handleOverlayMouseMove}
                onMouseUp={handleOverlayMouseUp}
                className="relative max-h-full max-w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl flex items-center justify-center border border-[#24252a] cursor-crosshair"
              >
                <video
                  ref={videoRef}
                  src={activeVideo.url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={(e) => {
                    // Prevent toggle play when dragging
                    if (!isDrawing) togglePlay();
                  }}
                  className="w-full h-full object-contain pointer-events-auto"
                />

                {/* Interactive Bounding Box: [OCR Region] (Blue Dashed) */}
                {showOcrBox && cropBox && (
                  <div 
                    onMouseDown={(e) => handleStartMove('ocr', e)}
                    className="absolute border-2 border-dashed border-[#00d2ff] bg-[#00d2ff]/20 flex items-start justify-between p-1 z-10 transition-all duration-75 cursor-move group select-none shadow-lg"
                    style={{
                      left: `${cropBox.x_pct * 100}%`,
                      top: `${cropBox.y_pct * 100}%`,
                      width: `${cropBox.w_pct * 100}%`,
                      height: `${cropBox.h_pct * 100}%`,
                    }}
                  >
                    <span className="bg-[#00d2ff] text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow pointer-events-none flex items-center space-x-1">
                      <Move className="w-2.5 h-2.5" />
                      <span>OCR Region (Kéo để di chuyển)</span>
                    </span>
                    <span className="text-[9px] text-[#00d2ff] bg-black/70 px-1 rounded font-mono pointer-events-none">
                      {Math.round(cropBox.w_pct * 100)}% x {Math.round(cropBox.h_pct * 100)}%
                    </span>

                    {/* OCR 4 Corner Resize Handles */}
                    <div onMouseDown={(e) => handleStartResize('ocr', 'tl', e)} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#00d2ff] border border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform" />
                    <div onMouseDown={(e) => handleStartResize('ocr', 'tr', e)} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#00d2ff] border border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform" />
                    <div onMouseDown={(e) => handleStartResize('ocr', 'bl', e)} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#00d2ff] border border-white rounded-full cursor-nesw-resize hover:scale-125 transition-transform" />
                    <div onMouseDown={(e) => handleStartResize('ocr', 'br', e)} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#00d2ff] border border-white rounded-full cursor-nwse-resize hover:scale-125 transition-transform" />
                  </div>
                )}

                {/* Subtitle Blur / Removal Box (Amber Box with 8 Resize Handles) */}
                {blurBox.enabled && (!blurBox.sync_subtitles || currentSub) && (
                  <div
                    onMouseDown={(e) => handleStartMove('blur', e)}
                    className="absolute border-2 border-[#f5a623] cursor-move flex flex-col justify-between p-1 z-15 shadow-2xl group transition-all select-none"
                    style={{
                      left: `${blurBox.x_pct * 100}%`,
                      top: `${blurBox.y_pct * 100}%`,
                      width: `${blurBox.w_pct * 100}%`,
                      height: `${blurBox.h_pct * 100}%`,
                      backdropFilter: blurBox.type === 'box' 
                        ? 'blur(8px)' 
                        : blurBox.type === 'mosaic' 
                          ? 'blur(22px) contrast(160%)' 
                          : `blur(${blurBox.blur_radius || 38}px)`,
                      backgroundColor: blurBox.type === 'box' 
                        ? `rgba(0,0,0,${blurBox.opacity ?? 0.88})` 
                        : blurBox.type === 'mosaic' 
                          ? `rgba(0,0,0,${blurBox.opacity ?? 0.7})` 
                          : `rgba(0,0,0,${blurBox.opacity ?? 0.82})`
                    }}
                  >
                    {/* Top Header Controls Bar */}
                    <div className="flex items-center justify-between w-full pointer-events-none">
                      <div className="flex items-center space-x-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-[#f5a623] border border-[#f5a623]/40">
                        <Move className="w-2.5 h-2.5" />
                        <span>XÓA PHỤ ĐỀ GỐC</span>
                      </div>
                      <div className="flex items-center space-x-1 pointer-events-auto">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePresetBlur('zoom_out'); }}
                          className="w-4 h-4 bg-black/80 hover:bg-[#f5a623] text-white hover:text-black rounded text-[10px] font-bold flex items-center justify-center transition border border-[#3b3d47]"
                          title="Thu nhỏ khung"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePresetBlur('zoom_in'); }}
                          className="w-4 h-4 bg-black/80 hover:bg-[#f5a623] text-white hover:text-black rounded text-[10px] font-bold flex items-center justify-center transition border border-[#3b3d47]"
                          title="Phóng to khung"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handlePresetBlur('bottom_fit'); }}
                          className="px-1 py-0.5 bg-black/80 hover:bg-[#f5a623] text-white hover:text-black rounded text-[9px] font-bold transition border border-[#3b3d47]"
                          title="Đặt vừa vặn đáy màn hình"
                        >
                          Vừa đáy
                        </button>
                      </div>
                    </div>

                    <div className="text-center pointer-events-none">
                      <span className="text-[10px] text-white/40 font-mono tracking-widest uppercase">
                        {blurBox.type === 'box' ? '[BĂNG ĐEN CHE SUB]' : blurBox.type === 'mosaic' ? '[PIXELATE / MOSAIC]' : '[LÀM MỜ GAUSS ĐẬM]'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-[#f5a623]/80 font-mono pointer-events-none">
                      <span>Mờ: {blurBox.blur_radius || 38}px</span>
                      <span>Đậm: {Math.round((blurBox.opacity || 0.85) * 100)}%</span>
                    </div>

                    {/* 8-Point Interactive Resizing Handles */}
                    {/* Corners */}
                    <div onMouseDown={(e) => handleStartResize('blur', 'tl', e)} className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#f5a623] border-2 border-white rounded-full cursor-nwse-resize hover:scale-130 transition-transform shadow-md" title="Kéo góc trên-trái" />
                    <div onMouseDown={(e) => handleStartResize('blur', 'tr', e)} className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#f5a623] border-2 border-white rounded-full cursor-nesw-resize hover:scale-130 transition-transform shadow-md" title="Kéo góc trên-phải" />
                    <div onMouseDown={(e) => handleStartResize('blur', 'bl', e)} className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-[#f5a623] border-2 border-white rounded-full cursor-nesw-resize hover:scale-130 transition-transform shadow-md" title="Kéo góc dưới-trái" />
                    <div onMouseDown={(e) => handleStartResize('blur', 'br', e)} className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#f5a623] border-2 border-white rounded-full cursor-nwse-resize hover:scale-130 transition-transform shadow-md" title="Kéo góc dưới-phải" />
                    {/* Edges */}
                    <div onMouseDown={(e) => handleStartResize('blur', 't', e)} className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-[#f5a623] border border-white rounded-full cursor-ns-resize hover:scale-110 transition-transform shadow-md" title="Kéo cạnh trên" />
                    <div onMouseDown={(e) => handleStartResize('blur', 'b', e)} className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-[#f5a623] border border-white rounded-full cursor-ns-resize hover:scale-110 transition-transform shadow-md" title="Kéo cạnh dưới" />
                    <div onMouseDown={(e) => handleStartResize('blur', 'l', e)} className="absolute -left-1 top-1/2 -translate-y-1/2 h-6 w-2 bg-[#f5a623] border border-white rounded-full cursor-ew-resize hover:scale-110 transition-transform shadow-md" title="Kéo cạnh trái" />
                    <div onMouseDown={(e) => handleStartResize('blur', 'r', e)} className="absolute -right-1 top-1/2 -translate-y-1/2 h-6 w-2 bg-[#f5a623] border border-white rounded-full cursor-ew-resize hover:scale-110 transition-transform shadow-md" title="Kéo cạnh phải" />
                  </div>
                )}

                {/* Live Subtitle Preview Overlay & Direct Draggable Frame */}
                {(() => {
                  if (hideSubtitlesTrack) return null;
                  const isPreviewMode = showPosPreview && !isPlaying;
                  const displaySub = currentSub || (isPreviewMode ? (selectedSub || (subtitles.length > 0 ? subtitles[0] : null)) : null);
                  if (!displaySub) return null;

                  const posX = subStyle.pos_x_pct !== undefined ? subStyle.pos_x_pct : 0.50;
                  const posY = subStyle.pos_y_pct !== undefined ? subStyle.pos_y_pct : 0.88;
                  const boxW = subStyle.box_w_pct || 0.88;

                  return (
                    <div 
                      onMouseDown={(e) => handleStartMove('sub', e)}
                      className="absolute z-20 select-none cursor-move group transition-all"
                      style={{
                        left: `${posX * 100}%`,
                        top: `${posY * 100}%`,
                        width: `${boxW * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        fontFamily: subStyle.font_name,
                        fontSize: `${subStyle.font_size}px`,
                        color: subStyle.color,
                        textShadow: `
                          -${subStyle.outline_width}px -${subStyle.outline_width}px 0 ${subStyle.outline_color},  
                           ${subStyle.outline_width}px -${subStyle.outline_width}px 0 ${subStyle.outline_color},
                          -${subStyle.outline_width}px  ${subStyle.outline_width}px 0 ${subStyle.outline_color},
                           ${subStyle.outline_width}px  ${subStyle.outline_width}px 0 ${subStyle.outline_color},
                           0 2px 5px rgba(0,0,0,0.9)
                        `
                      }}
                      title="Click và giữ chuột để xê dịch vị trí dòng chữ bất kỳ đâu trên video"
                    >
                      {/* Interactive Bounding Frame on Hover / Active */}
                      <div className="absolute -inset-2 border-2 border-dashed border-[#f5a623]/40 group-hover:border-[#f5a623] group-hover:bg-[#f5a623]/10 rounded-lg pointer-events-none transition-all">
                        {/* Drag Handle Tag & Coordinates Badge */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#f5a623] text-black text-[9px] font-extrabold px-2 py-0.5 rounded shadow-lg flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                          <Move className="w-2.5 h-2.5 text-black" />
                          <span>Kéo để xê dịch chữ dịch</span>
                          <span className="font-mono bg-black/40 text-white px-1 rounded text-[8px]">
                            Y: {Math.round(posY * 100)}%
                          </span>
                        </div>

                        {/* Left & Right Width Resize Handles */}
                        <div 
                          onMouseDown={(e) => handleStartResize('sub', 'l', e)}
                          className="absolute -left-2 top-1/2 -translate-y-1/2 w-3.5 h-6 bg-[#f5a623] border-2 border-white rounded cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:scale-125 shadow-md"
                          title="Kéo sang trái/phải để thu hẹp hoặc mở rộng độ ngắt dòng chữ"
                        />
                        <div 
                          onMouseDown={(e) => handleStartResize('sub', 'r', e)}
                          className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-6 bg-[#f5a623] border-2 border-white rounded cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:scale-125 shadow-md"
                          title="Kéo sang trái/phải để thu hẹp hoặc mở rộng độ ngắt dòng chữ"
                        />
                      </div>

                      <div className="font-bold tracking-wide text-center leading-snug break-words px-2 pointer-events-none">
                        {displaySub.translated_text || displaySub.text}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-[#24252a] rounded-xl max-w-md">
                <Film className="w-12 h-12 text-[#42444e] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">Chưa có video nào trong dự án</h3>
                <p className="text-xs text-[#8b8d97] mb-4">Nhấp "Nhập video" để bắt đầu quy trình làm phụ đề & lồng tiếng</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#f5a623] hover:bg-[#e09415] text-black font-bold text-xs rounded-md shadow-lg active:scale-95 transition"
                >
                  Tải lên video mới
                </button>
              </div>
            )}
          </div>

          {/* 5. BOTTOM DOCK (CapCut Studio Multi-Track Timeline) */}
          <div 
            style={{ height: `${timelineHeight}px` }}
            className="bg-[#16171b] flex flex-col shrink-0 select-none relative transition-[height] duration-75"
          >
            {/* Timeline Resizing Grip Handle (Top Border) */}
            <div 
              onMouseDown={handleTimelineResizeStart}
              className={`h-2 w-full bg-[#1c1d22] hover:bg-[#f5a623] cursor-ns-resize transition flex items-center justify-center group shrink-0 border-t border-[#2a2c35] ${isResizingTimeline ? 'bg-[#f5a623]' : ''}`}
              title="Kéo chuột lên/xuống để mở rộng hoặc thu nhỏ độ cao Timeline"
            >
              <div className="w-16 h-1 bg-[#404352] group-hover:bg-black rounded-full transition-colors" />
            </div>

            {/* CapCut Top Action Toolbar */}
            <div className="h-9 border-b border-[#24252a] px-3 flex items-center justify-between text-xs bg-[#1a1b1f] shrink-0">
              <div className="flex items-center space-x-2.5">
                <button 
                  onClick={togglePlay} 
                  className="w-6 h-6 rounded bg-[#f5a623] hover:bg-[#e09415] text-black flex items-center justify-center transition active:scale-95 shadow-sm"
                  title="Phát / Tạm dừng (Space)"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                </button>
                <button onClick={() => seekTo(0)} title="Về đầu video" className="text-[#8b8d97] hover:text-white transition">
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <div className="font-mono text-[11px] text-white bg-[#141518] px-2 py-0.5 rounded border border-[#2b2c32]">
                  <span className="text-[#f5a623] font-bold">{formatTime(currentTime)}</span>
                  <span className="text-[#8b8d97]"> / {formatTime(duration)}</span>
                </div>

                <div className="h-4 w-px bg-[#2b2c32] mx-0.5" />

                {/* Quick Add / Split */}
                <button
                  type="button"
                  onClick={handleAddSub}
                  title="Thêm câu phụ đề & voice mới tại vị trí con trỏ phát"
                  className="flex items-center space-x-1 px-2 py-1 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-[11px] font-medium transition active:scale-95 border border-[#383a44]"
                >
                  <Plus className="w-3.5 h-3.5 text-[#f5a623]" />
                  <span>Thêm câu</span>
                </button>

                <button
                  type="button"
                  onClick={handleSplitSub}
                  title="Tách đôi câu phụ đề tại vị trí con trỏ (Split)"
                  className="flex items-center space-x-1 px-2 py-1 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-[11px] font-medium transition active:scale-95 border border-[#383a44]"
                >
                  <Scissors className="w-3.5 h-3.5 text-[#00d2ff]" />
                  <span>Tách câu</span>
                </button>

                {/* VidLab AI Alignment & Missing Dialogue Recovery */}
                <button
                  type="button"
                  onClick={() => setTrackMuted(p => ({ ...p, voice: !p.voice }))}
                  title={trackMuted.voice ? "Đang TẮT lồng tiếng - Bấm để BẬT lại giọng đọc AI" : "Đang BẬT lồng tiếng - Bấm để TẮT (Chỉ xem phụ đề & văn bản dịch)"}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold transition active:scale-95 border ${
                    trackMuted.voice 
                      ? 'bg-rose-950/50 text-rose-300 border-rose-700/60 shadow-sm' 
                      : 'bg-[#00d2ff]/15 text-[#00d2ff] hover:bg-[#00d2ff]/25 border-[#00d2ff]/40'
                  }`}
                >
                  {trackMuted.voice ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#00d2ff]" />}
                  <span>{trackMuted.voice ? '🔇 Tắt lồng tiếng (Chỉ hiện Sub)' : '🔊 Lồng tiếng: Bật'}</span>
                </button>
                <div className="h-4 w-[1px] bg-[#383a44] mx-1" />
                <button
                  type="button"
                  onClick={handleRunAiAlign}
                  disabled={isAligningAi || subtitles.length === 0}
                  title="AI tự động căn khớp thoại: Chống dính câu, giãn nhịp thở 0.3s, cân bằng tốc độ đọc tự nhiên"
                  className="flex items-center space-x-1 px-2.5 py-1 bg-[#00d2ff]/15 hover:bg-[#00d2ff]/25 text-[#00d2ff] rounded text-[11px] font-bold transition active:scale-95 border border-[#00d2ff]/40 disabled:opacity-50"
                >
                  <Zap className={`w-3.5 h-3.5 ${isAligningAi ? 'animate-spin' : ''}`} />
                  <span>{isAligningAi ? 'Đang căn khớp...' : '⚡ AI Khớp thoại (Chống dính)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunRecoverMissing}
                  disabled={recoverProgress !== null || !activeVideo}
                  title="AI quét các đoạn thoại video gốc bị bỏ lỡ chưa nhận diện được và dịch bổ sung"
                  className="flex items-center space-x-1 px-2.5 py-1 bg-[#a855f7]/15 hover:bg-[#a855f7]/25 text-[#c084fc] rounded text-[11px] font-bold transition active:scale-95 border border-[#a855f7]/40 disabled:opacity-50"
                >
                  <Search className={`w-3.5 h-3.5 ${recoverProgress ? 'animate-pulse' : ''}`} />
                  <span>{recoverProgress ? `Đang quét (${Math.round((recoverProgress.progress || 0) * 100)}%)...` : '🔍 AI Quét câu thiếu'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAiAgentModal(true)}
                  title="Mở Trợ lý AI Copilot (theo kiến trúc VidLab) để điều khiển và tối ưu toàn diện"
                  className="flex items-center space-x-1 px-2.5 py-1 bg-[#f5a623]/15 hover:bg-[#f5a623]/25 text-[#f5a623] rounded text-[11px] font-bold transition active:scale-95 border border-[#f5a623]/40"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>🤖 AI Copilot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackMuted(p => ({ ...p, voice: !p.voice }))}
                  title={trackMuted.voice ? "Đang TẮT lồng tiếng - Bấm để BẬT lại giọng đọc AI" : "Đang BẬT lồng tiếng - Bấm để TẮT (Chỉ xem phụ đề & văn bản dịch)"}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold transition active:scale-95 border ${
                    trackMuted.voice 
                      ? 'bg-rose-950/50 text-rose-300 border-rose-700/60 shadow-sm' 
                      : 'bg-[#00d2ff]/15 text-[#00d2ff] hover:bg-[#00d2ff]/25 border-[#00d2ff]/40'
                  }`}
                >
                  {trackMuted.voice ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#00d2ff]" />}
                  <span>{trackMuted.voice ? '🔇 Tắt lồng tiếng (Chỉ hiện Sub)' : '🔊 Lồng tiếng: Bật'}</span>
                </button>
                <div className="h-4 w-[1px] bg-[#383a44] mx-1" />

                {/* Selected Subtitle / Voice Controls */}
                {selectedSub && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditSubModal(selectedSub, e)}
                      title="Sửa lời thoại và chọn giọng đọc CapCut cho câu này"
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#f5a623]/20 hover:bg-[#f5a623]/35 text-[#f5a623] rounded text-[11px] font-bold transition active:scale-95 border border-[#f5a623]/50 animate-pulse"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>Sửa & Đổi giọng CapCut (#{selectedSub.id})</span>
                    </button>

                    {selectedSub.audio_file && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteVoice(selectedSub.id, e)}
                        title="Xóa âm thanh giọng đọc của câu này"
                        className="flex items-center space-x-1 px-2 py-1 bg-[#24252a] hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded text-[11px] font-medium transition active:scale-95 border border-rose-900/40"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Xóa voice</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSub(selectedSub.id, e)}
                      title="Xóa hẳn câu phụ đề này"
                      className="flex items-center space-x-1 px-2 py-1 bg-[#24252a] hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded text-[11px] font-medium transition active:scale-95 border border-rose-900/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa câu</span>
                    </button>
                  </>
                )}
              </div>

              {/* CapCut Continuous Zoom Controls: Slider + Buttons + Presets */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(1, +(prev - 1).toFixed(1)))}
                  title="Thu nhỏ timeline (Ctrl + Cuộn chuột xuống)"
                  className="p-1 text-[#8b8d97] hover:text-white hover:bg-[#25262c] rounded transition"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center space-x-1.5 bg-[#141518] px-2 py-0.5 rounded border border-[#2a2c35]">
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                    className="w-20 sm:w-28 h-1 accent-[#f5a623] bg-[#2d2e38] rounded cursor-pointer"
                    title={`Thu phóng Timeline: ${zoomLevel.toFixed(1)}x (Kéo để phóng to dãn chữ)`}
                  />
                  <span className="font-mono text-[10px] text-[#f5a623] w-9 text-center font-bold">
                    {zoomLevel.toFixed(1)}x
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(25, +(prev + 1).toFixed(1)))}
                  title="Phóng to timeline (Ctrl + Cuộn chuột lên)"
                  className="p-1 text-[#8b8d97] hover:text-white hover:bg-[#25262c] rounded transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  title="Vừa vặn toàn bộ video (Fit to screen)"
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition ${zoomLevel === 1.0 ? 'bg-[#f5a623] text-black font-bold border-[#f5a623]' : 'text-[#8b8d97] border-[#383a44] hover:text-white'}`}
                >
                  Fit
                </button>

                {/* Quick Zoom Multiplier Buttons */}
                {[2, 5, 10, 20].map(z => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setZoomLevel(z)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${Math.abs(zoomLevel - z) < 0.3 ? 'bg-[#f5a623] text-black font-bold' : 'text-[#8b8d97] hover:text-white hover:bg-[#24252a]'}`}
                  >
                    {z}x
                  </button>
                ))}
              </div>
            </div>

            {/* CapCut Studio Multi-Track Canvas */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Track Headers (Fixed width 125px) */}
              <div className="w-32 bg-[#141518] border-r border-[#24252a] flex flex-col shrink-0 select-none z-20">
                {/* Time Ruler Blank Header */}
                <div className="h-6 border-b border-[#24252a] flex items-center justify-between px-2 text-[9px] text-[#8b8d97] font-mono shrink-0">
                  <span>TRACKS</span>
                  <span>MUTE / LOCK</span>
                </div>

                {/* Track V1: Video */}
                <div className="h-8 border-b border-[#24252a] flex items-center justify-between px-2 text-xs bg-[#18191d] shrink-0">
                  <span className="font-bold text-[#8b8d97] flex items-center space-x-1">
                    <span className="px-1 py-0.2 bg-[#25262c] text-white rounded text-[9px] font-mono">V1</span>
                    <span className="text-[10px]">Video</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => setTrackMuted(p => ({ ...p, video: !p.video }))} 
                      className={`p-1 hover:text-white transition ${trackMuted.video ? 'text-rose-400' : 'text-[#8b8d97]'}`} 
                      title={trackMuted.video ? "Bật âm thanh gốc video" : "Tắt tiếng video gốc"}
                    >
                      {trackMuted.video ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button 
                      onClick={() => setTrackLocked(p => ({ ...p, video: !p.video }))} 
                      className={`p-1 hover:text-white transition ${trackLocked.video ? 'text-[#f5a623]' : 'text-[#8b8d97]'}`} 
                      title="Khóa track"
                    >
                      {trackLocked.video ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Track T1: Subtitles */}
                <div className="h-10 border-b border-[#24252a] flex items-center justify-between px-2 text-xs bg-[#18191d] shrink-0">
                  <span className="font-bold text-[#f5a623] flex items-center space-x-1">
                    <span className="px-1 py-0.2 bg-[#f5a623]/20 text-[#f5a623] rounded text-[9px] font-mono">T1</span>
                    <span className="text-[10px]">Phụ đề</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => setHideSubtitlesTrack(!hideSubtitlesTrack)} 
                      className={`p-1 hover:text-white transition ${hideSubtitlesTrack ? 'text-[#8b8d97]' : 'text-[#f5a623]'}`} 
                      title="Ẩn/Hiện phụ đề trên video"
                    >
                      {hideSubtitlesTrack ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button 
                      onClick={() => setTrackLocked(p => ({ ...p, sub: !p.sub }))} 
                      className={`p-1 hover:text-white transition ${trackLocked.sub ? 'text-[#f5a623]' : 'text-[#8b8d97]'}`} 
                      title="Khóa track"
                    >
                      {trackLocked.sub ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Track A1: Voice CapCut */}
                <div className="h-11 border-b border-[#24252a] flex items-center justify-between px-2 text-xs bg-[#18191d] shrink-0">
                  <span className="font-bold text-[#00d2ff] flex items-center space-x-1">
                    <span className="px-1 py-0.2 bg-[#00d2ff]/20 text-[#00d2ff] rounded text-[9px] font-mono">A1</span>
                    <span className="text-[10px]">Voice CapCut</span>
                  </span>
                  <div className="flex items-center space-x-1">
                    <button 
                      onClick={() => setTrackMuted(p => ({ ...p, voice: !p.voice }))} 
                      className={`p-1 hover:text-white transition ${trackMuted.voice ? 'text-rose-400' : 'text-[#00d2ff]'}`} 
                      title={trackMuted.voice ? "Bật tiếng đọc AI" : "Tắt tiếng đọc AI"}
                    >
                      {trackMuted.voice ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                    <button 
                      onClick={() => setTrackLocked(p => ({ ...p, voice: !p.voice }))} 
                      className={`p-1 hover:text-white transition ${trackLocked.voice ? 'text-[#f5a623]' : 'text-[#8b8d97]'}`} 
                      title="Khóa track"
                    >
                      {trackLocked.voice ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Tracks Scroll Canvas */}
              <div ref={timelineScrollContainerRef} className="flex-1 overflow-x-auto relative bg-[#0f1012]">
                <div 
                  ref={timelineRef}
                  style={{ width: `${Math.max(100, zoomLevel * 100)}%`, minWidth: '100%' }}
                  onClick={(e) => {
                    if (!timelineRef.current || duration <= 0) return;
                    const rect = timelineRef.current.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const newTime = Math.max(0, Math.min(duration, (clickX / rect.width) * duration));
                    seekTo(newTime);
                  }}
                  className="relative select-none pb-2 cursor-pointer min-h-full"
                >
                  {/* CapCut Time Ruler */}
                  <div className="h-6 border-b border-[#24252a] bg-[#141518] relative shrink-0">
                    {(() => {
                      const rulerStep = zoomLevel >= 15 ? 1 : zoomLevel >= 8 ? 2 : zoomLevel >= 4 ? 5 : zoomLevel >= 2 ? 10 : 15;
                      const count = Math.ceil(duration / rulerStep) + 1;
                      return Array.from({ length: count }).map((_, idx) => {
                        const sec = idx * rulerStep;
                        if (sec > duration) return null;
                        const pct = duration > 0 ? (sec / duration) * 100 : 0;
                        return (
                          <div key={sec} className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none" style={{ left: `${pct}%` }}>
                            <span className="text-[9px] font-mono text-[#787c8c] pl-0.5">
                              {rulerStep <= 2 ? `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}` : formatTime(sec).split('.')[0]}
                            </span>
                            <div className="w-px h-1.5 bg-[#3a3d4a]" />
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Playhead needle */}
                  {duration > 0 && (
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-[#f5a623] z-40 pointer-events-none"
                      style={{ left: `${(currentTime / duration) * 100}%` }}
                    >
                      <div className="w-3 h-3 -ml-1.25 bg-[#f5a623] rotate-45 shadow-md -mt-1" />
                    </div>
                  )}

                  {/* Track 1 Canvas: Video */}
                  <div className="h-8 border-b border-[#1f2026] relative bg-[#17181c] flex items-center px-2 shrink-0">
                    <div className="w-full h-6 rounded bg-[#20222a] border border-[#2b2d38] flex items-center px-2 text-[10px] text-[#787b8c] truncate">
                      {activeVideo ? `${activeVideo.title} (${Math.round(duration)}s)` : 'Trống'}
                    </div>
                  </div>

                  {/* Track 2 Canvas: Subtitles (T1) */}
                  <div className="h-10 border-b border-[#1f2026] relative bg-[#141518] shrink-0">
                    {subtitles.map(sub => {
                      if (duration <= 0) return null;
                      const leftPct = (sub.start / duration) * 100;
                      const widthPct = ((sub.end - sub.start) / duration) * 100;
                      const isSelected = selectedSubId === sub.id;
                      const isCurrent = currentTime >= sub.start && currentTime <= sub.end;

                      return (
                        <div
                          key={`sub-${sub.id}`}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedSubId(sub.id); 
                            seekTo(sub.start); 
                          }}
                          onDoubleClick={(e) => handleOpenEditSubModal(sub, e)}
                          title={`[#${sub.id}] (${sub.start.toFixed(1)}s - ${sub.end.toFixed(1)}s)\n${sub.translated_text || sub.text}\n• Click để nhảy tới\n• Click đúp để sửa lời & đổi giọng`}
                          className={`absolute top-1 bottom-1 rounded px-2 text-[10px] flex items-center transition border cursor-pointer select-none overflow-hidden ${
                            isSelected 
                              ? 'bg-[#f5a623] text-black border-white shadow-lg ring-2 ring-[#f5a623]/80 z-30 font-bold' 
                              : isCurrent
                              ? 'bg-[#f5a623]/30 text-[#f5a623] border-[#f5a623] z-20 font-medium'
                              : 'bg-[#22242b] text-[#d6d8e0] border-[#363946] hover:bg-[#2b2d37] hover:border-[#53576b]'
                          }`}
                          style={{ 
                            left: `${leftPct}%`, 
                            width: `${Math.max(1.4, widthPct)}%`,
                            minWidth: '22px'
                          }}
                        >
                          <div className="flex items-center space-x-1.5 w-full truncate">
                            <span className="font-mono text-[8.5px] opacity-75 shrink-0">#{sub.id}</span>
                            <span className="truncate select-none font-medium">{sub.translated_text || sub.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Track 3 Canvas: Voiceover (A1 - CapCut Voices) */}
                  <div className="h-11 border-b border-[#1f2026] relative bg-[#141518] shrink-0">
                    {subtitles.filter(s => s.audio_file || s.audio_url).map(sub => {
                      if (duration <= 0) return null;
                      const leftPct = (sub.start / duration) * 100;
                      const widthPct = ((sub.end - sub.start) / duration) * 100;
                      const isSelected = selectedSubId === sub.id;
                      const isPlaying = playingVoiceId === sub.id;
                      const voiceName = sub.voice_id 
                        ? (sub.voice_id.includes('de-thuong') ? 'Dễ Thương' 
                          : sub.voice_id.includes('anh-dung') ? 'Anh Dũng' 
                          : sub.voice_id.includes('chi-mai') ? 'Chi Mai' 
                          : sub.voice_id.includes('duy-bac') ? 'Duy Bắc' 
                          : 'Hoài My') 
                        : 'Voice';

                      return (
                        <div
                          key={`voice-${sub.id}`}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedSubId(sub.id); 
                            seekTo(sub.start); 
                          }}
                          onDoubleClick={(e) => handleOpenEditSubModal(sub, e)}
                          title={`[Voice #${sub.id}] [${voiceName}] (${((sub.end - sub.start)).toFixed(1)}s)\n${sub.translated_text || sub.text}\n• Click đúp để đổi giọng CapCut`}
                          className={`absolute top-1 bottom-1 rounded px-2 text-[9px] flex items-center justify-between transition group border cursor-pointer select-none overflow-hidden ${
                            isSelected 
                              ? 'bg-gradient-to-r from-[#00d2ff]/40 to-[#0077b6]/40 text-white border-[#f5a623] ring-2 ring-[#f5a623] shadow-lg z-30 font-bold' 
                              : isPlaying
                              ? 'bg-[#10b981]/30 text-[#10b981] border-[#10b981] animate-pulse z-20'
                              : 'bg-gradient-to-r from-[#00d2ff]/20 to-[#0096c7]/10 text-[#00d2ff] border-[#00d2ff]/50 hover:border-[#00d2ff] hover:bg-[#00d2ff]/25'
                          }`}
                          style={{ 
                            left: `${leftPct}%`, 
                            width: `${Math.max(1.8, widthPct)}%`,
                            minWidth: '28px'
                          }}
                        >
                          <div className="flex items-center space-x-1.5 truncate">
                            <Volume2 className={`w-2.5 h-2.5 shrink-0 ${isPlaying ? 'animate-bounce text-[#10b981]' : ''}`} />
                            
                            {/* Decorative CapCut waveform bars */}
                            <div className="hidden sm:flex items-center space-x-0.5 opacity-60 shrink-0">
                              <div className="w-0.5 h-2 bg-current rounded-full" />
                              <div className="w-0.5 h-3.5 bg-current rounded-full" />
                              <div className="w-0.5 h-1.5 bg-current rounded-full" />
                              <div className="w-0.5 h-3 bg-current rounded-full" />
                            </div>

                            <span className="font-mono text-[8px] opacity-75 shrink-0">#{sub.id}</span>
                            <span className="truncate font-medium">{voiceName}: {sub.translated_text || sub.text}</span>
                          </div>

                          {/* Quick Hover Controls */}
                          <div className="hidden group-hover:flex items-center space-x-0.5 shrink-0 ml-1">
                            <button
                              type="button"
                              onClick={(e) => playVoicePreview(sub, e)}
                              title="Nghe thử âm thanh"
                              className="p-0.5 hover:text-white bg-black/70 rounded"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditSubModal(sub, e)}
                              title="Đổi giọng CapCut"
                              className="p-0.5 hover:text-[#f5a623] bg-black/70 rounded"
                            >
                              <Mic className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteVoice(sub.id, e)}
                              title="Xóa voice này"
                              className="p-0.5 hover:text-rose-400 bg-black/70 rounded"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. RIGHT SIDEBAR PANEL (ezmaxsub Studio v2.2.2 Dual-Tab) */}
        <div className="w-[360px] bg-[#1a1b1f] border-l border-[#24252a] flex flex-col shrink-0 select-none">
          {/* Top Tabs: [Phụ đề] & [Thuộc tính] */}
          <div className="flex border-b border-[#24252a] bg-[#141518]">
            <button
              onClick={() => setActiveRightTab('subs')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
                activeRightTab === 'subs' 
                  ? 'border-[#f5a623] text-[#f5a623] bg-[#1a1b1f]' 
                  : 'border-transparent text-[#8b8d97] hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Phụ đề ({subtitles.length})</span>
            </button>
            <button
              onClick={() => setActiveRightTab('style')}
              className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
                activeRightTab === 'style' 
                  ? 'border-[#f5a623] text-[#f5a623] bg-[#1a1b1f]' 
                  : 'border-transparent text-[#8b8d97] hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Thuộc tính</span>
            </button>
          </div>

          {/* TAB 2: THUỘC TÍNH (PROPERTIES & STYLING & POSITION) */}
          {activeRightTab === 'style' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Sub-tabs: [Kiểu] & [Vị trí] */}
              <div className="flex bg-[#141518] p-1 border-b border-[#24252a] shrink-0">
                <button
                  onClick={() => setPropsSubTab('style')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                    propsSubTab === 'style'
                      ? 'bg-[#25262c] text-[#f5a623] shadow-sm'
                      : 'text-[#8b8d97] hover:text-white'
                  }`}
                >
                  Kiểu chữ & Bộ lọc
                </button>
                <button
                  onClick={() => setPropsSubTab('pos')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition ${
                    propsSubTab === 'pos'
                      ? 'bg-[#25262c] text-[#f5a623] shadow-sm'
                      : 'text-[#8b8d97] hover:text-white'
                  }`}
                >
                  Xóa sub & Vị trí
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
                {propsSubTab === 'style' ? (
                  <>
                    {/* 1. Kiểu chữ phụ đề */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] mb-2">
                        Kiểu chữ phụ đề (Subtitle Style)
                      </h4>
                      
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-[#8b8d97] block mb-1">Cỡ chữ (px)</label>
                            <input
                              type="number"
                              value={subStyle.font_size}
                              onChange={e => setSubStyle({ ...subStyle, font_size: parseInt(e.target.value) || 20 })}
                              className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-[#8b8d97] block mb-1">Phông chữ</label>
                            <select
                              value={subStyle.font_name}
                              onChange={e => setSubStyle({ ...subStyle, font_name: e.target.value })}
                              className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Montserrat">Montserrat</option>
                              <option value="Roboto">Roboto</option>
                              <option value="Impact">Impact</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-[#8b8d97] block mb-1">Màu chữ (Hex)</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={subStyle.color}
                              onChange={e => setSubStyle({ ...subStyle, color: e.target.value })}
                              className="w-7 h-7 rounded bg-transparent cursor-pointer border-0"
                            />
                            <input
                              type="text"
                              value={subStyle.color}
                              onChange={e => setSubStyle({ ...subStyle, color: e.target.value })}
                              className="flex-1 bg-[#141518] border border-[#2b2c32] rounded px-2 py-1 font-mono text-xs uppercase"
                            />
                          </div>
                        </div>

                        {/* Preset Badges */}
                        <div>
                          <label className="text-[11px] text-[#8b8d97] block mb-1">Mẫu kiểu chữ có sẵn</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { label: 'Vàng viền đen', color: '#FFE128', outline: '#000000' },
                              { label: 'Trắng viền đen', color: '#FFFFFF', outline: '#000000' },
                              { label: 'Xanh Neon', color: '#00FFFF', outline: '#000000' },
                              { label: 'Hồng Douyin', color: '#FF2A7A', outline: '#FFFFFF' },
                              { label: 'Cam Rực Rỡ', color: '#FF8800', outline: '#000000' },
                              { label: 'Xanh Lá', color: '#00E676', outline: '#000000' }
                            ].map((preset, i) => (
                              <button
                                key={i}
                                onClick={() => setSubStyle({ ...subStyle, color: preset.color, outline_color: preset.outline })}
                                className="p-1.5 rounded border border-[#2b2c32] bg-[#141518] hover:border-[#f5a623] text-center transition"
                              >
                                <span 
                                  className="font-bold text-[11px] block" 
                                  style={{ color: preset.color, textShadow: `0 0 2px ${preset.outline}` }}
                                >
                                  Aa
                                </span>
                                <span className="text-[9px] text-[#8b8d97] block mt-0.5 truncate">{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Outline Width */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#8b8d97]">Độ dày viền (Stroke):</span>
                            <span className="text-[#f5a623] font-bold font-mono">{subStyle.outline_width} px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="5"
                            step="1"
                            value={subStyle.outline_width}
                            onChange={e => setSubStyle({ ...subStyle, outline_width: parseInt(e.target.value) })}
                            className="w-full accent-[#f5a623] cursor-pointer"
                          />
                        </div>

                        {/* SECTION: VỊ TRÍ & XÊ DỊCH PHỤ ĐỀ */}
                        <div className="pt-2.5 border-t border-[#24252a] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] flex items-center space-x-1">
                              <Move className="w-3.5 h-3.5" />
                              <span>Vị trí & Xê dịch Phụ đề</span>
                            </span>
                            <span className="text-[9px] bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded font-mono font-bold">
                              X: {Math.round((subStyle.pos_x_pct ?? 0.50) * 100)}% | Y: {Math.round((subStyle.pos_y_pct ?? 0.88) * 100)}%
                            </span>
                          </div>

                          <div className="bg-[#141518] p-2 rounded border border-[#2b2c32] text-[10px] text-[#8b8d97] flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-base leading-none">💡</span>
                              <span>Kéo trực tiếp dòng chữ trên video</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPosPreview(!showPosPreview)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                showPosPreview
                                  ? 'bg-[#f5a623] text-black border-[#f5a623]'
                                  : 'bg-[#20222a] text-[#c5c7ce] hover:text-white border-[#3b3d48]'
                              }`}
                              title="Bật/Tắt hiển thị khung chữ mẫu khi tạm dừng video để dễ kéo xê dịch"
                            >
                              {showPosPreview ? '✓ Đang bật mẫu' : 'Bật mẫu căn'}
                            </button>
                          </div>

                          {/* Quick Position Presets */}
                          <div>
                            <label className="text-[10px] text-[#8b8d97] block mb-1">Vị trí nhanh (Presets):</label>
                            <div className="grid grid-cols-4 gap-1">
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_x_pct: 0.50, pos_y_pct: 0.88, margin_v: 42 }))}
                                className="py-1 px-1 bg-[#1c1d22] hover:bg-[#25262c] text-[#c5c7ce] hover:text-[#f5a623] rounded text-[10px] font-medium border border-[#2e303a] transition"
                              >
                                ⬇ Đáy (Chuẩn)
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_x_pct: 0.50, pos_y_pct: 0.50, margin_v: 180 }))}
                                className="py-1 px-1 bg-[#1c1d22] hover:bg-[#25262c] text-[#c5c7ce] hover:text-[#f5a623] rounded text-[10px] font-medium border border-[#2e303a] transition"
                              >
                                ↕ Giữa
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_x_pct: 0.50, pos_y_pct: 0.12, margin_v: 320 }))}
                                className="py-1 px-1 bg-[#1c1d22] hover:bg-[#25262c] text-[#c5c7ce] hover:text-[#f5a623] rounded text-[10px] font-medium border border-[#2e303a] transition"
                              >
                                ⬆ Đỉnh
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (blurBox) {
                                    const blurCenterY = +(blurBox.y_pct + blurBox.h_pct / 2).toFixed(3);
                                    setSubStyle(prev => ({ ...prev, pos_x_pct: 0.50, pos_y_pct: blurCenterY }));
                                  }
                                }}
                                className="py-1 px-1 bg-[#1c1d22] hover:bg-[#25262c] text-[#00d2ff] rounded text-[10px] font-medium border border-[#00d2ff]/40 transition"
                                title="Căn chữ nằm khớp ngay trong khung xóa mờ phụ đề cũ"
                              >
                                🎯 Khung mờ
                              </button>
                            </div>
                          </div>

                          {/* D-Pad Precision Step Shift */}
                          <div>
                            <div className="flex justify-between items-center text-[10px] text-[#8b8d97] mb-1">
                              <span>Tinh chỉnh từng bước:</span>
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_x_pct: 0.50 }))}
                                className="text-[#00d2ff] hover:underline"
                              >
                                Căn giữa X
                              </button>
                            </div>
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_x_pct: Math.max(0.08, +((prev.pos_x_pct ?? 0.5) - 0.02).toFixed(3)) }))}
                                className="px-2 py-1 bg-[#20222a] hover:bg-[#2a2d38] text-white rounded text-[11px] font-bold border border-[#353846] transition"
                                title="Nhích sang trái 2%"
                              >
                                ◄ Trái
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_y_pct: Math.max(0.05, +((prev.pos_y_pct ?? 0.88) - 0.02).toFixed(3)) }))}
                                className="px-2 py-1 bg-[#20222a] hover:bg-[#2a2d38] text-white rounded text-[11px] font-bold border border-[#353846] transition"
                                title="Nhích lên trên 2%"
                              >
                                ▲ Lên
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_y_pct: Math.min(0.96, +((prev.pos_y_pct ?? 0.88) + 0.02).toFixed(3)) }))}
                                className="px-2 py-1 bg-[#20222a] hover:bg-[#2a2d38] text-white rounded text-[11px] font-bold border border-[#353846] transition"
                                title="Nhích xuống dưới 2%"
                              >
                                ▼ Xuống
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubStyle(prev => ({ ...prev, pos_x_pct: Math.min(0.92, +((prev.pos_x_pct ?? 0.5) + 0.02).toFixed(3)) }))}
                                className="px-2 py-1 bg-[#20222a] hover:bg-[#2a2d38] text-white rounded text-[11px] font-bold border border-[#353846] transition"
                                title="Nhích sang phải 2%"
                              >
                                ► Phải
                              </button>
                            </div>
                          </div>

                          {/* Continuous Vertical Slider (Y) */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#8b8d97]">Vị trí dọc (Y - Lên / Xuống):</span>
                              <span className="text-[#f5a623] font-bold font-mono">{Math.round((subStyle.pos_y_pct ?? 0.88) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.05"
                              max="0.96"
                              step="0.01"
                              value={subStyle.pos_y_pct ?? 0.88}
                              onChange={e => setSubStyle({ ...subStyle, pos_y_pct: parseFloat(e.target.value) })}
                              className="w-full accent-[#f5a623] cursor-pointer"
                            />
                          </div>

                          {/* Continuous Horizontal Slider (X) */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#8b8d97]">Vị trí ngang (X - Trái / Phải):</span>
                              <span className="text-[#f5a623] font-bold font-mono">{Math.round((subStyle.pos_x_pct ?? 0.50) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.10"
                              max="0.90"
                              step="0.01"
                              value={subStyle.pos_x_pct ?? 0.50}
                              onChange={e => setSubStyle({ ...subStyle, pos_x_pct: parseFloat(e.target.value) })}
                              className="w-full accent-[#f5a623] cursor-pointer"
                            />
                          </div>

                          {/* Box Width Slider */}
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#8b8d97]">Độ rộng khung chữ (Max Width):</span>
                              <span className="text-[#f5a623] font-bold font-mono">{Math.round((subStyle.box_w_pct ?? 0.88) * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0.40"
                              max="0.98"
                              step="0.02"
                              value={subStyle.box_w_pct ?? 0.88}
                              onChange={e => setSubStyle({ ...subStyle, box_w_pct: parseFloat(e.target.value) })}
                              className="w-full accent-[#f5a623] cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Bộ lọc hậu phim (Video Color Filters) */}
                    <div className="pt-3 border-t border-[#24252a]">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] mb-2">
                        Bộ lọc hậu phim (Color Filter)
                      </h4>
                      <select
                        value={colorFilter}
                        onChange={e => setColorFilter(e.target.value)}
                        className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#f5a623]"
                      >
                        <option value="none">Gốc (Không áp dụng)</option>
                        <option value="cinematic">Cinematic (Điện ảnh sâu lắng)</option>
                        <option value="vivid">Rực rỡ (Tăng tương phản & màu sắc)</option>
                        <option value="warm">Ấm áp (Tone vàng ấm áp)</option>
                        <option value="cool">Mát lạnh (Tone xanh phim Âu Mỹ)</option>
                        <option value="vintage">Vintage (Cổ điển hoài niệm)</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* VỊ TRÍ & XÓA SUBTITLE REMOVAL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#f5a623] flex items-center space-x-1">
                          <Crop className="w-3.5 h-3.5" />
                          <span>Xóa phụ đề gốc (Subtitle Removal)</span>
                        </h4>
                        <span className="text-[9px] bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded font-bold">
                          8 Điểm Kéo
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-[#141518] p-2 rounded border border-[#24252a]">
                          <span className="text-[#c5c7ce] text-xs font-medium">Bật làm mờ phụ đề cũ</span>
                          <input
                            type="checkbox"
                            checked={blurBox.enabled}
                            onChange={e => setBlurBox({ ...blurBox, enabled: e.target.checked })}
                            className="accent-[#f5a623] w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between bg-[#141518] p-2 rounded border border-[#24252a]">
                          <div>
                            <span className="text-[#c5c7ce] text-xs font-medium block">Đồng bộ theo phụ đề</span>
                            <span className="text-[10px] text-[#8b8d97]">Chỉ làm mờ khi có thoại</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={blurBox.sync_subtitles}
                            onChange={e => setBlurBox({ ...blurBox, sync_subtitles: e.target.checked })}
                            className="accent-[#f5a623] w-4 h-4 cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-[#8b8d97] block mb-1">Kiểu che mờ phụ đề cũ</label>
                          <select
                            value={blurBox.type}
                            onChange={e => setBlurBox({ ...blurBox, type: e.target.value })}
                            className="w-full bg-[#141518] border border-[#2b2c32] rounded px-2 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none"
                          >
                            <option value="blur">Blur Gauss Siêu Mờ (Xóa sạch chữ - Khuyên dùng)</option>
                            <option value="box">Băng Đen Điện Ảnh (Solid Black Strip - Rạp phim)</option>
                            <option value="mosaic">Vỡ hạt Pixel (Mosaic / AI Inpainting)</option>
                          </select>
                        </div>

                        {/* Blur Strength Slider */}
                        {blurBox.type === 'blur' && (
                          <div>
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="text-[#8b8d97]">Độ mờ Gauss (Blur Intensity):</span>
                              <span className="text-[#f5a623] font-bold font-mono">{blurBox.blur_radius || 38} px</span>
                            </div>
                            <input
                              type="range"
                              min="15"
                              max="60"
                              step="1"
                              value={blurBox.blur_radius || 38}
                              onChange={e => setBlurBox({ ...blurBox, blur_radius: parseInt(e.target.value) })}
                              className="w-full accent-[#f5a623] cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] text-[#8b8d97] mt-0.5 font-mono">
                              <span>Nhẹ (15px)</span>
                              <span>Chuẩn (38px)</span>
                              <span>Cực mạnh (60px)</span>
                            </div>
                          </div>
                        )}

                        {/* Opacity Slider */}
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#8b8d97]">Độ đậm che phủ (Opacity):</span>
                            <span className="text-[#f5a623] font-bold font-mono">{Math.round((blurBox.opacity ?? 0.85) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.10"
                            max="1.0"
                            step="0.02"
                            value={blurBox.opacity ?? 0.85}
                            onChange={e => setBlurBox({ ...blurBox, opacity: parseFloat(e.target.value) })}
                            className="w-full accent-[#f5a623] cursor-pointer"
                          />
                        </div>

                        {/* Quick Position Presets */}
                        <div>
                          <label className="text-[11px] text-[#8b8d97] block mb-1.5">Vị trí & Kích thước nhanh</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => handlePresetBlur('bottom_fit')}
                              className="py-1.5 px-2 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-[11px] border border-[#3b3d47] transition flex items-center justify-center space-x-1"
                            >
                              <span>Vừa vặn đáy</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePresetBlur('full_width')}
                              className="py-1.5 px-2 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-[11px] border border-[#3b3d47] transition flex items-center justify-center space-x-1"
                            >
                              <span>Đầy chiều ngang</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePresetBlur('zoom_in')}
                              className="py-1 px-2 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-[11px] border border-[#3b3d47] transition"
                            >
                              Phóng to (+10%)
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePresetBlur('zoom_out')}
                              className="py-1 px-2 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-[11px] border border-[#3b3d47] transition"
                            >
                              Thu nhỏ (-10%)
                            </button>
                          </div>
                        </div>

                        {/* Margin Vertical Slider for Subtitles */}
                        <div className="pt-2 border-t border-[#24252a]">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#8b8d97]">Khoảng cách lề dưới phụ đề (Margin V):</span>
                            <span className="text-[#f5a623] font-bold font-mono">{subStyle.margin_v} px</span>
                          </div>
                          <input
                            type="range"
                            min="15"
                            max="120"
                            step="2"
                            value={subStyle.margin_v}
                            onChange={e => setSubStyle({ ...subStyle, margin_v: parseInt(e.target.value) })}
                            className="w-full accent-[#f5a623] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: SUBTITLE LIST TABLE */}
          {activeRightTab === 'subs' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Title & Count */}
              <div className="px-3 pt-3 pb-1 border-b border-[#24252a] flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#f5a623] flex items-center space-x-1.5">
                  <Type className="w-3.5 h-3.5" />
                  <span>DANH SÁCH PHỤ ĐỀ ({subtitles.length} phân đoạn)</span>
                </span>
              </div>

              {/* Search Bar */}
              <div className="p-2.5 border-b border-[#24252a] space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#8b8d97]" />
                  <input
                    type="text"
                    placeholder="Tìm câu phụ đề (gốc hoặc dịch)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-[#141518] border border-[#2b2c32] rounded pl-8 pr-2 py-1.5 text-xs text-white placeholder-[#555] outline-none focus:border-[#f5a623]"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 text-[10px]">
                  <button
                    onClick={() => setFilterSubMode('all')}
                    className={`px-2 py-0.5 rounded font-medium transition shrink-0 ${
                      filterSubMode === 'all'
                        ? 'bg-[#f5a623] text-black font-bold'
                        : 'bg-[#24252a] text-[#8b8d97] hover:text-white'
                    }`}
                  >
                    Tất cả ({subtitles.length})
                  </button>
                  <button
                    onClick={() => setFilterSubMode('untranslated')}
                    className={`px-2 py-0.5 rounded font-medium transition shrink-0 ${
                      filterSubMode === 'untranslated'
                        ? 'bg-[#00d2ff] text-black font-bold'
                        : 'bg-[#24252a] text-[#8b8d97] hover:text-white'
                    }`}
                  >
                    Chưa dịch ({subtitles.length - translatedCount})
                  </button>
                  <button
                    onClick={() => setFilterSubMode('attention')}
                    className={`px-2 py-0.5 rounded font-medium transition shrink-0 ${
                      filterSubMode === 'attention'
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-[#24252a] text-[#8b8d97] hover:text-white'
                    }`}
                  >
                    Cần chú ý ({attentionCount})
                  </button>
                  <button
                    onClick={() => setFilterSubMode('no_audio')}
                    className={`px-2 py-0.5 rounded font-medium transition shrink-0 ${
                      filterSubMode === 'no_audio'
                        ? 'bg-rose-500 text-white font-bold'
                        : 'bg-[#24252a] text-[#8b8d97] hover:text-white'
                    }`}
                  >
                    Thiếu audio ({noAudioCount})
                  </button>
                </div>

                {/* Status Dot Counters & Batch Helpers */}
                <div className="flex items-center justify-between text-[10px] text-[#8b8d97] pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-emerald-400 font-bold">{translatedCount} Đã dịch</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-amber-400 font-bold">{attentionCount} Chú ý</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <span className="text-rose-400 font-bold">{noAudioCount} Thiếu voice</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleStartTranslate}
                      disabled={subtitles.length === 0 || translateProgress !== null}
                      title="Dịch lại hoặc dịch những câu còn thiếu"
                      className="px-1.5 py-0.5 bg-[#24252a] hover:bg-[#2d2f38] text-[#00d2ff] rounded text-[10px] font-medium transition"
                    >
                      Dịch thiếu
                    </button>
                    <button
                      onClick={handleStartTts}
                      disabled={subtitles.length === 0 || ttsProgress !== null}
                      title="Tạo giọng đọc cho những câu chưa có voice"
                      className="px-1.5 py-0.5 bg-[#24252a] hover:bg-[#2d2f38] text-[#f5a623] rounded text-[10px] font-medium transition"
                    >
                      Tạo voice thiếu
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredSubtitles.map((sub) => {
                  const isCurrent = currentTime >= sub.start && currentTime <= sub.end;
                  const isSelected = selectedSubId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubId(sub.id);
                        seekTo(sub.start);
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#25262c] border-[#f5a623] ring-1 ring-[#f5a623] shadow-md'
                          : isCurrent 
                          ? 'bg-[#202127] border-[#f5a623]/60' 
                          : 'bg-[#141518] border-[#24252a] hover:border-[#383a44]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#8b8d97] font-mono mb-1.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-[#c5c7ce]">#{sub.id}</span>
                          {sub.voice_id && (
                            <span className="text-[9px] bg-[#00d2ff]/20 text-[#00d2ff] px-1 rounded font-sans">
                              {sub.voice_id.includes('de-thuong') ? 'Dễ Thương' 
                               : sub.voice_id.includes('anh-dung') ? 'Anh Dũng' 
                               : sub.voice_id.includes('chi-mai') ? 'Chi Mai' 
                               : sub.voice_id.includes('duy-bac') ? 'Duy Bắc' 
                               : 'Hoài My'}
                            </span>
                          )}
                        </div>
                        <span>{formatTime(sub.start)} ➔ {formatTime(sub.end)}</span>
                        {sub.audio_file || sub.audio_url ? (
                          <button
                            type="button"
                            onClick={(e) => playVoicePreview(sub, e)}
                            className={`flex items-center space-x-1 font-sans text-[10px] font-semibold px-2 py-0.5 rounded transition ${
                              playingVoiceId === sub.id 
                                ? 'bg-[#10b981] text-black shadow-md animate-pulse' 
                                : 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/35 border border-[#10b981]/30'
                            }`}
                            title="Bấm để nghe thử giọng đọc câu này"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>{playingVoiceId === sub.id ? 'Đang đọc...' : 'Nghe voice'}</span>
                          </button>
                        ) : (
                          <span className="text-rose-400 font-sans text-[10px]">Chưa có voice</span>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-2 font-sans">
                        <div>
                          <div className="flex items-center justify-between text-[9px] text-[#8b8d97] mb-0.5">
                            <span>Câu gốc (Video):</span>
                          </div>
                          <input
                            type="text"
                            value={sub.text || ''}
                            onChange={(e) => {
                              const newRaw = e.target.value;
                              const updated = subtitles.map(s => s.id === sub.id ? { ...s, text: newRaw } : s);
                              setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: updated } : v));
                            }}
                            onBlur={() => saveSubtitlesToBackend(subtitles)}
                            placeholder="Chưa có câu gốc..."
                            className="w-full bg-[#18191d] border border-[#272832] rounded px-2 py-1 text-xs text-[#a6a9b6] outline-none focus:border-[#00d2ff]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-[9px] text-[#f5a623] mb-0.5 font-medium">
                            <span>Lời dịch tiếng Việt (AI đọc):</span>
                            {sub.audio_duration && (
                              <span className="font-mono text-[#8b8d97] text-[8.5px]">Voice: {sub.audio_duration}s</span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={sub.translated_text || ''}
                            onChange={(e) => {
                              const newText = e.target.value;
                              const updated = subtitles.map(s => s.id === sub.id ? { ...s, translated_text: newText } : s);
                              setVideos(prev => prev.map(v => v.id === activeVideoId ? { ...v, subtitles: updated } : v));
                            }}
                            onBlur={() => saveSubtitlesToBackend(subtitles)}
                            placeholder="Chưa có bản dịch..."
                            className="w-full bg-[#1e2025] border border-[#2f313a] rounded px-2 py-1 text-xs text-[#f5a623] font-medium outline-none focus:border-[#f5a623]"
                          />
                        </div>
                      </div>

                      {/* CapCut Quick Actions on Subtitle Item */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#202127] text-[10px]">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditSubModal(sub, e)}
                            className="flex items-center space-x-1 text-[#00d2ff] hover:underline"
                            title="Sửa chi tiết thời gian & đổi giọng"
                          >
                            <Mic className="w-3 h-3" />
                            <span>Đổi giọng CapCut</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateSingleTts(sub, sub.voice_id || selectedVoice)}
                            className="flex items-center space-x-1 text-[#f5a623] hover:underline"
                            title="Tạo lại âm thanh ngay cho câu này"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Tạo voice câu này</span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
                          {sub.audio_file && (
                            <button
                              type="button"
                              onClick={(e) => handleDeleteVoice(sub.id, e)}
                              className="text-[#8b8d97] hover:text-rose-400 flex items-center space-x-0.5"
                              title="Xóa âm thanh"
                            >
                              <VolumeX className="w-3 h-3" />
                              <span>Xóa voice</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSub(sub.id, e)}
                            className="text-[#8b8d97] hover:text-rose-400 flex items-center space-x-0.5"
                            title="Xóa câu"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredSubtitles.length === 0 && (
                  <div className="text-center py-10 text-xs text-[#8b8d97]">
                    Chưa có câu phụ đề nào. Hãy nhấn nút "Nhận dạng" ở góc trái!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1f] border border-[#2b2c32] rounded-xl w-full max-w-lg p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#24252a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Download className="w-4 h-4 text-[#f5a623]" />
                <span>Xuất video thành phẩm</span>
              </h3>
              <button 
                onClick={() => { setShowExportModal(false); setPreviewExportedVideo(false); }} 
                className="text-[#8b8d97] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Output Settings: File name and Directory */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#2b2c32] space-y-2.5">
                <div>
                  <label className="text-[11px] font-medium text-[#8b8d97] block mb-1">Tên file xuất video (.mp4):</label>
                  <input
                    type="text"
                    value={exportFilename}
                    onChange={(e) => setExportFilename(e.target.value)}
                    placeholder="VD: Video_ThuyetMinh_LongTieng.mp4"
                    disabled={exportProgress !== null}
                    className="w-full bg-[#1a1b1f] border border-[#2b2c32] rounded px-2.5 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-[#8b8d97]">Thư mục lưu trên máy tính:</label>
                    <button
                      type="button"
                      onClick={() => handleOpenWindowsFolder(null, exportDir)}
                      className="text-[10px] text-[#f5a623] hover:underline flex items-center space-x-1"
                    >
                      <FolderOpen className="w-3 h-3" />
                      <span>Mở thư mục này</span>
                    </button>
                  </div>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={exportDir}
                      onChange={(e) => setExportDir(e.target.value)}
                      placeholder="VD: D:\dich AI\exports"
                      disabled={exportProgress !== null}
                      className="flex-1 bg-[#1a1b1f] border border-[#2b2c32] rounded px-2.5 py-1.5 text-xs text-[#c5c7ce] focus:border-[#f5a623] outline-none font-mono text-[11px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenWindowsFolder(null, exportDir)}
                      title="Mở thư mục này trong Windows Explorer"
                      className="px-2.5 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded border border-[#3b3d47] flex items-center transition"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#f5a623]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Render Summary Stats */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#2b2c32] space-y-1.5 text-[11px] text-[#8b8d97]">
                <div className="flex justify-between">
                  <span>Số câu phụ đề đốt vào video:</span>
                  <span className="text-white font-bold">{subtitles.length} câu</span>
                </div>
                <div className="flex justify-between">
                  <span>Số file voice thuyết minh AI:</span>
                  <span className="text-[#10b981] font-bold">{subtitles.filter(s => s.audio_file).length} file</span>
                </div>
                <div className="flex justify-between">
                  <span>Xóa phụ đề cũ (Blur Box):</span>
                  <span className="text-[#f5a623] font-bold">{blurBox.enabled ? 'Đang bật' : 'Tắt'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bộ lọc màu hậu phim:</span>
                  <span className="text-white font-bold uppercase">{colorFilter}</span>
                </div>
              </div>

              {/* Subtitle Burning Toggle in Export */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#2b2c32] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Type className="w-4 h-4 text-[#00d2ff]" />
                    <span className="text-xs font-bold text-white">Ghi chữ phụ đề vào khung hình (Burn Subtitles)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={exportBurnSubs}
                    onChange={(e) => setExportBurnSubs(e.target.checked)}
                    disabled={exportProgress !== null}
                    className="accent-[#00d2ff] w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-[#8b8d97] leading-relaxed">
                  {exportBurnSubs 
                    ? '✓ Tự động khắc chữ phụ đề tiếng Việt lên video theo đúng vị trí bạn đã kéo xê dịch.' 
                    : 'Chỉ xuất video kèm giọng lồng tiếng AI mà không khắc chữ phụ đề lên màn hình.'}
                </p>
              </div>

              {/* Audio & Vocal Separation Controls */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#2b2c32] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Volume2 className="w-4 h-4 text-[#f5a623]" />
                    <span className="text-xs font-bold text-white">Khử giọng cũ & Giữ nhạc nền (BGM)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isolateBgm}
                    onChange={(e) => setIsolateBgm(e.target.checked)}
                    disabled={exportProgress !== null}
                    className="accent-[#f5a623] w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-[#8b8d97] leading-relaxed">
                  {isolateBgm 
                    ? '✓ Tự động lọc bỏ giọng nhân vật cũ, giữ lại trọn vẹn nhạc nền và hiệu ứng âm thanh (SFX) của video gốc.'
                    : 'Giữ nguyên toàn bộ âm thanh gốc của video.'}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#24252a]">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8b8d97]">Nhạc nền video:</span>
                      <span className="font-mono text-[#f5a623] font-bold">{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.05"
                      value={bgmVolume}
                      onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                      disabled={exportProgress !== null}
                      className="w-full accent-[#f5a623] h-1.5 bg-[#24252a] rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-[#8b8d97]">Giọng đọc AI:</span>
                      <span className="font-mono text-[#10b981] font-bold">{Math.round(ttsVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={ttsVolume}
                      onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                      disabled={exportProgress !== null}
                      className="w-full accent-[#10b981] h-1.5 bg-[#24252a] rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Real-time Export Progress Bar or Error Alert */}
              {exportProgress && (
                <div className={`p-3 border rounded-lg space-y-2 ${exportProgress.progress < 0 ? 'bg-rose-950/20 border-rose-500/50' : 'bg-[#141518] border-[#f5a623]/30'}`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold flex items-center space-x-1.5 ${exportProgress.progress < 0 ? 'text-rose-400' : 'text-[#f5a623]'}`}>
                      {exportProgress.progress < 0 ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      <span className="break-all">{exportProgress.message}</span>
                    </span>
                    {exportProgress.progress >= 0 && (
                      <span className="font-mono text-white font-bold">
                        {Math.round((exportProgress.progress || 0) * 100)}%
                      </span>
                    )}
                  </div>
                  {exportProgress.progress >= 0 && (
                    <div className="w-full bg-[#1a1b1f] h-2.5 rounded-full overflow-hidden border border-[#2b2c32]">
                      <div 
                        className="h-full bg-gradient-to-r from-[#f5a623] to-[#10b981] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(5, Math.min(100, Math.round((exportProgress.progress || 0) * 100)))}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Export Completed Success Box */}
              {exportedData && (
                <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/40 rounded-xl space-y-3">
                  <div className="flex items-center space-x-2 text-[#10b981]">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Xuất video hoàn tất!</h4>
                      <p className="text-[11px] text-[#8b8d97]">Video đã được render sạch sẽ với đầy đủ phụ đề và lồng tiếng.</p>
                    </div>
                  </div>

                  <div className="bg-[#141518] p-2.5 rounded border border-[#24252a] text-[11px] space-y-1 font-mono text-[#c5c7ce]">
                    <div className="truncate"><span className="text-[#8b8d97]">File: </span>{exportedData.filename}</div>
                    <div><span className="text-[#8b8d97]">Dung lượng: </span><span className="text-white font-bold">{exportedData.file_size_mb} MB</span></div>
                    <div className="truncate" title={exportedData.folder_path}><span className="text-[#8b8d97]">Thư mục: </span>{exportedData.folder_path}</div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenWindowsFolder(exportedData.file_path, exportedData.folder_path)}
                      className="flex-1 py-2 px-3 bg-[#f5a623] hover:bg-[#e09415] text-black font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow transition active:scale-95"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Mở thư mục chứa video</span>
                    </button>

                    <a
                      href={exportedData.download_url}
                      download={exportedData.filename}
                      className="py-2 px-3 bg-[#24252a] hover:bg-[#2e3037] text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 border border-[#3b3d47] transition"
                    >
                      <Download className="w-4 h-4 text-[#10b981]" />
                      <span>Tải về máy</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setPreviewExportedVideo(!previewExportedVideo)}
                      className="py-2 px-3 bg-[#24252a] hover:bg-[#2e3037] text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-1.5 border border-[#3b3d47] transition"
                    >
                      <Play className="w-3.5 h-3.5 text-[#f5a623]" />
                      <span>{previewExportedVideo ? 'Ẩn xem' : 'Xem video'}</span>
                    </button>
                  </div>

                  {previewExportedVideo && (
                    <div className="pt-2">
                      <video 
                        src={exportedData.download_url} 
                        controls 
                        autoPlay
                        className="w-full max-h-56 rounded-lg border border-[#2b2c32] bg-black shadow"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#24252a]">
              <button
                onClick={() => { setShowExportModal(false); setPreviewExportedVideo(false); }}
                className="px-3.5 py-1.5 bg-[#24252a] hover:bg-[#2d2e35] text-white rounded text-xs transition"
              >
                Đóng
              </button>
              <button
                onClick={handleStartExport}
                disabled={exportProgress !== null && exportProgress.progress >= 0}
                className="px-4 py-1.5 bg-gradient-to-r from-[#f5a623] to-[#e09415] hover:from-[#f7b036] hover:to-[#e89d1e] text-black font-bold rounded text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
              >
                {exportProgress && exportProgress.progress >= 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xuất...</span>
                  </>
                ) : exportProgress && exportProgress.progress < 0 ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Thử xuất lại</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Bắt đầu xuất</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOICE PICKER MODAL */}
      {showVoicePicker && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1f] border border-[#2b2c32] rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#24252a] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#f5a623]" />
                <span>Kho giọng đọc AI (Edge-TTS & CapCut)</span>
              </h3>
              <button onClick={() => setShowVoicePicker(false)} className="text-[#8b8d97] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {[
                { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ)', engine: 'Edge TTS', desc: 'Truyền cảm, giọng đọc thuyết minh Bắc tự nhiên' },
                { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam)', engine: 'Edge TTS', desc: 'Trầm ấm, hào sảng, chuẩn phim tài liệu' },
                { id: 'capcut-de-thuong', name: 'Dễ Thương (Nữ CapCut)', engine: 'CapCut', desc: 'Giọng đọc Douyin/TikTok tươi trẻ' },
                { id: 'capcut-anh-dung', name: 'Anh Dũng (Nam CapCut)', engine: 'CapCut', desc: 'Kể chuyện kịch tính, review phim' },
                { id: 'capcut-chi-mai', name: 'Chi Mai (Nữ CapCut)', engine: 'CapCut', desc: 'Ngọt ngào, nhẹ nhàng' },
                { id: 'capcut-duy-bac', name: 'Duy Bắc (Nam Bắc)', engine: 'CapCut', desc: 'Giọng đọc nhanh, năng động' }
              ].map(voice => (
                <div
                  key={voice.id}
                  onClick={() => { setSelectedVoice(voice.id); setShowVoicePicker(false); }}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    selectedVoice === voice.id 
                      ? 'bg-[#25262c] border-[#f5a623]' 
                      : 'bg-[#141518] border-[#2b2c32] hover:border-[#3e404b]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{voice.name}</span>
                    <span className="text-[10px] bg-[#2b2c32] text-[#f5a623] px-1.5 py-0.5 rounded font-mono">
                      {voice.engine}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b8d97]">{voice.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#24252a]">
              <button
                onClick={() => setShowVoicePicker(false)}
                className="px-4 py-1.5 bg-[#24252a] text-white rounded text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGE PACK MODAL (TỪ ĐIỂN PHÁT ÂM) */}
      {showPronounceModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1f] border border-[#2b2c32] rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#24252a] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/40 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Từ điển phát âm (Language Pack)</span>
                    <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded font-mono font-bold">
                      ACTIVE
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8b8d97]">Chuẩn hóa đọc số, ngày tháng, tên riêng và quy tắc phát âm theo vùng miền.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPronounceModal(false)}
                className="text-[#8b8d97] hover:text-white p-1 rounded hover:bg-[#25262c] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Region & Pronunciation Rules */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#24252a] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#f5a623] uppercase tracking-wider">
                    Giọng vùng miền:
                  </label>
                  <select
                    value={languagePack.region}
                    onChange={(e) => setLanguagePack({ ...languagePack, region: e.target.value })}
                    className="bg-[#1a1b1f] border border-[#2b2c32] rounded px-2.5 py-1 text-xs text-white focus:border-[#f5a623] outline-none"
                  >
                    <option value="north">Miền Bắc (Hà Nội)</option>
                    <option value="south">Miền Nam (Sài Gòn)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-[#24252a]">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={languagePack.numbers}
                      onChange={(e) => setLanguagePack({ ...languagePack, numbers: e.target.checked })}
                      className="accent-[#f5a623] w-4 h-4"
                    />
                    <span className="text-[#c5c7ce]">Tự động đọc số, ngày tháng, tiền tệ chuẩn tiếng Việt</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={languagePack.acronyms}
                      onChange={(e) => setLanguagePack({ ...languagePack, acronyms: e.target.checked })}
                      className="accent-[#f5a623] w-4 h-4"
                    />
                    <span className="text-[#c5c7ce]">Mở rộng từ viết tắt phổ biến (vd: km/h, AI, VIP)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={languagePack.foreign_names}
                      onChange={(e) => setLanguagePack({ ...languagePack, foreign_names: e.target.checked })}
                      className="accent-[#f5a623] w-4 h-4"
                    />
                    <span className="text-[#c5c7ce]">Phiên âm tên riêng, nhân vật & thương hiệu nước ngoài</span>
                  </label>
                </div>
              </div>

              {/* Custom Word Replacement Table */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#24252a] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                    Bảng quy tắc thay thế từ ngữ tùy chỉnh:
                  </span>
                  <span className="text-[10px] text-[#8b8d97]">
                    {pronounceRules.length} quy tắc
                  </span>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                  {pronounceRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#1a1b1f] px-2.5 py-1 rounded border border-[#282a32]">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{rule.source}</span>
                        <span className="text-[#8b8d97]">➔</span>
                        <span className="text-[#f5a623] font-bold">{rule.target}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPronounceRules(pronounceRules.filter((_, i) => i !== idx))}
                        className="text-[#8b8d97] hover:text-rose-400 p-0.5 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new rule */}
                <div className="flex items-center space-x-2 pt-1 border-t border-[#24252a]">
                  <input
                    type="text"
                    placeholder="Từ gốc (vd: Rolls-Royce)"
                    value={newRuleSource}
                    onChange={(e) => setNewRuleSource(e.target.value)}
                    className="flex-1 bg-[#1a1b1f] border border-[#2b2c32] rounded px-2 py-1 text-xs text-white focus:border-[#f5a623] outline-none font-mono"
                  />
                  <span className="text-[#8b8d97]">➔</span>
                  <input
                    type="text"
                    placeholder="Phát âm (vd: rôn roi)"
                    value={newRuleTarget}
                    onChange={(e) => setNewRuleTarget(e.target.value)}
                    className="flex-1 bg-[#1a1b1f] border border-[#2b2c32] rounded px-2 py-1 text-xs text-white focus:border-[#f5a623] outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newRuleSource.trim() && newRuleTarget.trim()) {
                        setPronounceRules([...pronounceRules, { source: newRuleSource.trim(), target: newRuleTarget.trim() }]);
                        setNewRuleSource('');
                        setNewRuleTarget('');
                      }
                    }}
                    className="px-2.5 py-1 bg-[#f5a623] hover:bg-[#e09415] text-black font-bold text-xs rounded transition shrink-0"
                  >
                    + Thêm
                  </button>
                </div>
              </div>

              {/* Live Preview Test */}
              <div className="bg-[#141518] p-3 rounded-lg border border-[#24252a] space-y-2">
                <span className="text-[11px] font-bold text-white block">Thử phát âm trực tiếp:</span>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={testPronounceText}
                    onChange={(e) => setTestPronounceText(e.target.value)}
                    className="flex-1 bg-[#1a1b1f] border border-[#2b2c32] rounded px-2.5 py-1.5 text-xs text-white focus:border-[#f5a623] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      let processed = testPronounceText;
                      for (const r of pronounceRules) {
                        processed = processed.replace(new RegExp(r.source, 'gi'), r.target);
                      }
                      setTestPronounceResult(processed);
                      handleGenerateSingleTts({ id: 9999, start: 0, end: 5, translated_text: processed }, selectedVoice);
                    }}
                    className="px-3 py-1.5 bg-[#24252a] hover:bg-[#2d2e35] text-white border border-[#3b3d47] rounded text-xs flex items-center space-x-1.5 transition font-semibold"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[#f5a623]" />
                    <span>Nghe thử</span>
                  </button>
                </div>
                {testPronounceResult && (
                  <div className="text-[11px] text-[#10b981] font-mono">
                    Phiên âm: "{testPronounceResult}"
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#24252a]">
              <button
                type="button"
                onClick={() => setShowPronounceModal(false)}
                className="px-4 py-1.5 bg-[#f5a623] hover:bg-[#e09415] text-black font-bold rounded text-xs transition"
              >
                Lưu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAPCUT VOICE & SUBTITLE QUICK EDITOR MODAL */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1b1f] border border-[#2b2c32] rounded-xl w-full max-w-xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#24252a] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40 flex items-center justify-center shadow-sm">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Chỉnh sửa Voice & Lời thoại #{editingSub.id}</span>
                    <span className="text-[10px] bg-[#f5a623]/20 text-[#f5a623] px-2 py-0.5 rounded font-mono font-bold">
                      {((editingSub.end || 0) - (editingSub.start || 0)).toFixed(2)}s
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#8b8d97]">Sửa lời thoại, chọn giọng đọc CapCut và tạo lại âm thanh ngay lập tức.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingSub(null)} 
                className="text-[#8b8d97] hover:text-white p-1 rounded hover:bg-[#25262c] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Timing Inputs */}
              <div className="grid grid-cols-2 gap-3 bg-[#141518] p-3 rounded-lg border border-[#24252a]">
                <div>
                  <label className="text-[11px] text-[#8b8d97] block mb-1">Thời gian bắt đầu (giây):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingSub.start}
                    onChange={(e) => setEditingSub({ ...editingSub, start: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1a1b1f] border border-[#2b2c32] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#f5a623] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#8b8d97] block mb-1">Thời gian kết thúc (giây):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editingSub.end}
                    onChange={(e) => setEditingSub({ ...editingSub, end: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#1a1b1f] border border-[#2b2c32] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:border-[#f5a623] outline-none"
                  />
                </div>
              </div>

              {/* Original Text (Phim gốc) */}
              <div>
                <label className="text-[11px] text-[#8b8d97] block mb-1">Câu thoại gốc (Video):</label>
                <input
                  type="text"
                  value={editingSub.text || ''}
                  onChange={(e) => setEditingSub({ ...editingSub, text: e.target.value })}
                  placeholder="Nhập câu gốc trong video..."
                  className="w-full bg-[#141518] border border-[#2b2c32] rounded-lg p-2 text-xs text-[#a6a9b6] font-mono focus:border-[#00d2ff] outline-none"
                />
              </div>

              {/* Vietnamese Speech Text (AI reads this) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-[#f5a623]">Lời thoại tiếng Việt (AI sẽ đọc câu này):</label>
                  <span className="text-[10px] text-[#8b8d97]">{(editingSub.translated_text || '').length} ký tự</span>
                </div>
                <textarea
                  rows={2}
                  value={editingSub.translated_text || ''}
                  onChange={(e) => setEditingSub({ ...editingSub, translated_text: e.target.value })}
                  placeholder="Nhập nội dung lời thoại tiếng Việt..."
                  className="w-full bg-[#141518] border border-[#2b2c32] rounded-lg p-2.5 text-xs text-white focus:border-[#f5a623] outline-none resize-none"
                />
              </div>

              {/* Choose CapCut / Edge Voice */}
              <div>
                <label className="text-[11px] font-bold text-[#00d2ff] block mb-1.5 flex items-center space-x-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Chọn giọng đọc cho câu này (Kho giọng CapCut & Edge-TTS):</span>
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {[
                    { id: 'capcut-de-thuong', name: 'CapCut Dễ Thương (Nữ)', engine: 'CapCut', desc: 'Ngọt ngào, Douyin/TikTok vui tươi' },
                    { id: 'capcut-anh-dung', name: 'CapCut Anh Dũng (Nam)', engine: 'CapCut', desc: 'Mạnh mẽ, hùng hồn, review kịch tính' },
                    { id: 'capcut-chi-mai', name: 'CapCut Chi Mai (Nữ)', engine: 'CapCut', desc: 'Thuyết minh nhẹ nhàng, truyền cảm' },
                    { id: 'capcut-duy-bac', name: 'CapCut Duy Bắc (Nam)', engine: 'CapCut', desc: 'Giọng Bắc chuẩn, nhanh & năng động' },
                    { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My (Nữ)', engine: 'Edge-TTS', desc: 'Truyền cảm mượt mà, chuẩn phim bộ' },
                    { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh (Nam)', engine: 'Edge-TTS', desc: 'Trầm ấm, hào sảng, tài liệu lịch sử' },
                  ].map(v => (
                    <div
                      key={v.id}
                      onClick={() => setEditingSub({ ...editingSub, voice_id: v.id })}
                      className={`p-2 rounded-lg border cursor-pointer transition ${
                        (editingSub.voice_id || selectedVoice) === v.id
                          ? 'bg-[#00d2ff]/15 border-[#00d2ff] text-white shadow'
                          : 'bg-[#141518] border-[#24252a] hover:border-[#383a44] text-[#8b8d97]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-bold text-[11px] ${(editingSub.voice_id || selectedVoice) === v.id ? 'text-[#00d2ff]' : 'text-white'}`}>
                          {v.name}
                        </span>
                        <span className="text-[9px] px-1 bg-[#202127] rounded text-[#8b8d97] font-mono">{v.engine}</span>
                      </div>
                      <p className="text-[10px] leading-tight opacity-80">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-[#24252a] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {editingSub.audio_file || editingSub.audio_url ? (
                    <>
                      <button
                        type="button"
                        onClick={() => playVoicePreview(editingSub)}
                        className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-semibold transition ${
                          playingVoiceId === editingSub.id 
                            ? 'bg-[#10b981] text-black shadow animate-pulse' 
                            : 'bg-[#10b981]/20 text-[#10b981] hover:bg-[#10b981]/30 border border-[#10b981]/40'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{playingVoiceId === editingSub.id ? 'Đang đọc...' : 'Nghe thử'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteVoice(editingSub.id, e)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#24252a] hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded text-xs transition border border-rose-900/30"
                        title="Xóa file âm thanh câu này"
                      >
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Xóa voice</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-rose-400 text-[11px] italic">Chưa có âm thanh</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={isGeneratingSingle}
                    onClick={() => handleGenerateSingleTts(editingSub, editingSub.voice_id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00d2ff] to-[#0077b6] hover:from-[#33dcff] hover:to-[#0096c7] text-black font-bold rounded text-xs shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {isGeneratingSingle ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tạo giọng...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tạo lại giọng CapCut này</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedSub}
                    className="px-4 py-1.5 bg-[#f5a623] hover:bg-[#e09415] text-black font-bold rounded text-xs shadow transition active:scale-95"
                  >
                    Lưu & Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* VIDLAB AI AGENT COPILOT MODAL */}
      {showAiAgentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181a20] border border-[#2e3240] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#282a35] flex items-center justify-between bg-[#12141a]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f5a623] to-[#00d2ff] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-[#181a20] rounded-[6px] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-[#00d2ff]" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-white">VidLab AI Copilot</h3>
                    <span className="text-[10px] bg-[#00d2ff]/20 text-[#00d2ff] px-2 py-0.5 rounded-full font-mono font-semibold border border-[#00d2ff]/30">
                      OpenChatCut Core
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b8d97]">Trợ lý AI phân tích kịch bản, chỉnh khớp nhịp thoại và quét vét câu bỏ sót</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiAgentModal(false)}
                className="text-[#8b8d97] hover:text-white p-1 rounded-lg hover:bg-[#25262c] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Suggestion Chips */}
            <div className="px-4 py-2 bg-[#14151b] border-b border-[#242630] flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSendAgentMessage("Chỉnh khớp lại toàn bộ thoại và chống đọc dính chữ")}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#20222a] hover:bg-[#2a2d38] text-[#c5c7ce] border border-[#303340] hover:border-[#00d2ff]/50 transition flex items-center space-x-1"
              >
                <Zap className="w-3 h-3 text-[#00d2ff]" />
                <span>Chống đọc dính chữ & Căn nhịp thở</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendAgentMessage("Quét tìm các câu thoại bị bỏ sót chưa nhận diện")}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#20222a] hover:bg-[#2a2d38] text-[#c5c7ce] border border-[#303340] hover:border-[#a855f7]/50 transition flex items-center space-x-1"
              >
                <Search className="w-3 h-3 text-[#c084fc]" />
                <span>Quét câu thoại bị bỏ sót</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendAgentMessage("Kiểm tra tốc độ đọc tiếng Việt của các câu")}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#20222a] hover:bg-[#2a2d38] text-[#c5c7ce] border border-[#303340] hover:border-[#f5a623]/50 transition flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-[#f5a623]" />
                <span>Kiểm tra tốc độ đọc</span>
              </button>
            </div>

            {/* Chat History Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-[260px] max-h-[380px] bg-[#121318]">
              {agentChatHistory.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[#00d2ff]/20 text-white border border-[#00d2ff]/40' 
                        : 'bg-[#1e2029] text-[#e2e4e9] border border-[#2e313d]'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-bold opacity-70">
                      {msg.role === 'user' ? (
                        <span>Bạn</span>
                      ) : (
                        <div className="flex items-center space-x-1 text-[#00d2ff]">
                          <Bot className="w-3 h-3" />
                          <span>VidLab AI Copilot</span>
                        </div>
                      )}
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAgentThinking && (
                <div className="flex justify-start">
                  <div className="bg-[#1e2029] border border-[#2e313d] rounded-xl p-3 text-xs flex items-center space-x-2 text-[#8b8d97]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00d2ff]" />
                    <span>AI Copilot đang phân tích dự án & tối ưu timeline...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Tool Buttons Bar */}
            <div className="px-4 py-2 bg-[#161820] border-t border-[#262832] flex items-center justify-between text-xs">
              <span className="text-[#8b8d97] text-[11px] font-medium">Lệnh nhanh:</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={handleRunAiAlign}
                  disabled={isAligningAi || subtitles.length === 0}
                  className="px-2.5 py-1 bg-[#00d2ff]/15 hover:bg-[#00d2ff]/25 text-[#00d2ff] border border-[#00d2ff]/40 rounded text-[11px] font-bold flex items-center space-x-1 transition active:scale-95 disabled:opacity-50"
                >
                  <Zap className={`w-3 h-3 ${isAligningAi ? 'animate-spin' : ''}`} />
                  <span>{isAligningAi ? 'Đang căn khớp...' : '⚡ Khớp thoại & Chống dính'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRunRecoverMissing}
                  disabled={recoverProgress !== null || !activeVideo}
                  className="px-2.5 py-1 bg-[#a855f7]/15 hover:bg-[#a855f7]/25 text-[#c084fc] border border-[#a855f7]/40 rounded text-[11px] font-bold flex items-center space-x-1 transition active:scale-95 disabled:opacity-50"
                >
                  <Search className={`w-3 h-3 ${recoverProgress ? 'animate-pulse' : ''}`} />
                  <span>{recoverProgress ? 'Đang quét...' : '🔍 Quét bù câu thiếu'}</span>
                </button>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-[#12141a] border-t border-[#242630] flex items-center space-x-2">
              <input
                type="text"
                value={agentPrompt}
                onChange={e => setAgentPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendAgentMessage(); }}
                placeholder="Nhập yêu cầu: 'Chỉnh khớp câu', 'Kiểm tra đọc dính', 'Tìm câu chưa dịch'..."
                className="flex-1 bg-[#1a1c24] border border-[#2f3240] rounded-lg px-3 py-2 text-xs text-white placeholder-[#686b77] focus:border-[#00d2ff] outline-none"
              />
              <button
                type="button"
                onClick={() => handleSendAgentMessage()}
                disabled={isAgentThinking || !agentPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-[#00d2ff] to-[#0096c7] hover:from-[#33dcff] hover:to-[#00a8e8] text-black font-bold rounded-lg text-xs shadow-md transition active:scale-95 disabled:opacity-50 flex items-center space-x-1"
              >
                <span>Gửi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
