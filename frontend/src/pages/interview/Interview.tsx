import React, { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
// import { useAuth } from '@clerk/clerk-react' // Will be used for authentication later
import Editor from '@monaco-editor/react'
import './Interview.css'

interface Message {
    type: string;
    content?: string;
    question?: string;
    questionIndex?: number;
    scores?: {
        technical?: number;
        communication?: number;
        problemSolving?: number;
    };
    followup?: {
        question: string;
        isThisTheEnd: boolean;
        forWhatQuestion: number;
    };
}

const Interview = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const preset = location.state?.preset;
    // const { getToken } = useAuth(); // Will be used for authentication later

    // WebSocket and interview state
    const [, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<string>('');
    const [interviewStarted, setInterviewStarted] = useState(false);
    const [isFollowup, setIsFollowup] = useState(false);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [, setMessages] = useState<Message[]>([]);

    // Answer input state
    const [answerText, setAnswerText] = useState('');
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
    const [scores, setScores] = useState<{technical?: number, communication?: number, problemSolving?: number} | null>(null);
    const [interviewComplete, setInterviewComplete] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [isReconnecting, setIsReconnecting] = useState(false);

    // Camera and tools state
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [activeToolTab, setActiveToolTab] = useState<'code' | 'whiteboard'>('code');
    const [codeContent, setCodeContent] = useState('');
    const [whiteboardContent, setWhiteboardContent] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('javascript');
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [interviewTimer, setInterviewTimer] = useState(0); // Timer in seconds
    const [timerStarted, setTimerStarted] = useState(false);

    // Interview control state
    const [interviewInitialized, setInterviewInitialized] = useState(false);
    const [startRequestSent, setStartRequestSent] = useState(false);

    // Speech recognition state
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const [speechText, setSpeechText] = useState('');

    // Text-to-speech state
    const [ttsSupported, setTtsSupported] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Camera diagnostics state
    const [cameraError, setCameraError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const heartbeatIntervalRef = useRef<number | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    const timerIntervalRef = useRef<number | null>(null);

    // Check for speech recognition support on component mount
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setSpeechSupported(true);
            const recognition = new SpeechRecognition();

            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setIsListening(true);
            };

            let lastFinalTranscript = '';

            recognition.onresult = (event: any) => {
                let finalTranscript = '';

                // Only process final results to prevent duplicates
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }

                // Only append if we have new final content
                if (finalTranscript && finalTranscript !== lastFinalTranscript) {
                    const newContent = finalTranscript.replace(lastFinalTranscript, '').trim();

                    if (newContent) {
                        console.log('📝 New speech content:', newContent);

                        // Append only the new content
                        setAnswerText(prev => {
                            const currentText = prev.trim();
                            return currentText ? `${currentText} ${newContent}` : newContent;
                        });

                        setSpeechText(prev => {
                            const currentSpeech = prev.trim();
                            return currentSpeech ? `${currentSpeech} ${newContent}` : newContent;
                        });

                        lastFinalTranscript = finalTranscript;
                    }
                }
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);

                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone access to use speech-to-text.');
                } else if (event.error === 'no-speech') {
                    console.log('No speech detected');
                } else {
                    console.error('Speech recognition error:', event.error);
                }
            };

            recognitionRef.current = recognition;
        } else {
            console.log('Speech recognition not supported');
            setSpeechSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Initialize text-to-speech
    useEffect(() => {
        const speechSynthesis = window.speechSynthesis;
        if (speechSynthesis) {
            setTtsSupported(true);
            console.log('✅ Text-to-speech supported');
        } else {
            console.log('❌ Text-to-speech not supported');
        }
    }, []);

    // Enhanced WebSocket connection with auto-reconnection
    const connectWebSocket = async (isReconnect = false) => {
        try {
            // Prevent multiple concurrent connections
            if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
                console.log('⚠️ WebSocket already connecting, skipping...');
                return;
            }

            // Close existing connection if open
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log('🔌 Closing existing WebSocket connection');
                wsRef.current.close();
            }

            // Clear any existing reconnection timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }

            if (isReconnect) {
                setIsReconnecting(true);
                console.log(`🔄 Reconnection attempt ${reconnectAttempt + 1}...`);
            } else {
                console.log('🆕 New WebSocket connection');
            }

            const wsUrl = `ws://localhost:4000/interview/${id}`;
            console.log('Connecting to WebSocket:', wsUrl);

            const websocket = new WebSocket(wsUrl);
            wsRef.current = websocket;
            setWs(websocket);

            // Handle connection open
            websocket.onopen = () => {
                console.log('WebSocket connected - waiting for server confirmation...');
                setIsConnected(true);
                setConnectionError(null);
                setReconnectAttempt(0);
                setIsReconnecting(false);

                // Start heartbeat to keep connection alive
                startHeartbeat(websocket);
            };

            // Handle incoming messages
            websocket.onmessage = (event) => {
                const message: Message = JSON.parse(event.data);
                console.log('Received message:', message);

                // Reset heartbeat on any message
                resetHeartbeat(websocket);

                setMessages(prev => [...prev, message]);
                setIsWaitingForResponse(false);

                // Handle different message types
                if (message.type === 'connected') {
                    console.log('Server confirmed connection - checking if interview should start...');

                    // Prevent multiple interview starts with multiple guards
                    if (!interviewStarted && !startRequestSent && !interviewInitialized) {
                        console.log('✅ Starting interview - all guards passed');
                        setStartRequestSent(true);
                        setInterviewInitialized(true);

                        setTimeout(() => {
                            if (websocket.readyState === WebSocket.OPEN) {
                                websocket.send(JSON.stringify({ type: 'startInterview' }));
                                setInterviewStarted(true);
                                startTimer();
                                console.log('🚀 Sent startInterview message');
                            } else {
                                console.log('❌ WebSocket not open, cannot send start message');
                                setStartRequestSent(false);
                            }
                        }, 100);
                    } else {
                        console.log('⏭️ Skipping interview start:', {
                            interviewStarted,
                            startRequestSent,
                            interviewInitialized
                        });
                    }
                } else if (message.type === 'question') {
                    setCurrentQuestion(message.question || '');
                    setQuestionIndex(message.questionIndex || 0);
                    setIsFollowup(false);
                } else if (message.type === 'followup') {
                    setCurrentQuestion(message.followup?.question || '');
                    setIsFollowup(true);
                } else if (message.type === 'interviewComplete') {
                    console.log('Interview completed');
                    setCurrentQuestion('Interview completed! Check your scores below.');
                    setInterviewComplete(true);

                    if (message.scores) {
                        setScores(message.scores);
                    }
                } else if (message.type === 'pong') {
                    console.log('Received heartbeat pong');
                }
            };

            // Handle connection close
            websocket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                setIsConnected(false);
                stopHeartbeat();

                // Reset interview flags on disconnect to allow fresh start on reconnect
                if (event.code !== 1000) { // Not a normal close
                    console.log('🔄 Connection lost, resetting interview flags for reconnection');
                    setStartRequestSent(false);
                    setInterviewInitialized(false);
                }

                // Don't reconnect if interview is complete or manually closed
                if (!interviewComplete && event.code !== 1000) {
                    scheduleReconnect();
                }
            };

            // Handle errors
            websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setIsConnected(false);
                stopHeartbeat();

                if (!interviewComplete) {
                    scheduleReconnect();
                }
            };

        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            if (!interviewComplete) {
                scheduleReconnect();
            }
        }
    };

    // Heartbeat mechanism to keep connection alive
    const startHeartbeat = (websocket: WebSocket) => {
        stopHeartbeat(); // Clear any existing heartbeat

        heartbeatIntervalRef.current = setInterval(() => {
            if (websocket.readyState === WebSocket.OPEN) {
                websocket.send(JSON.stringify({ type: 'ping' }));
                console.log('Sent heartbeat ping');
            }
        }, 30000); // Send ping every 30 seconds
    };

    const stopHeartbeat = () => {
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
    };

    const resetHeartbeat = (websocket: WebSocket) => {
        startHeartbeat(websocket);
    };

    // Auto-reconnection logic
    const scheduleReconnect = () => {
        if (isReconnecting) return; // Prevent multiple reconnection attempts

        const maxAttempts = 5;
        const baseDelay = 1000; // 1 second
        const maxDelay = 30000; // 30 seconds

        if (reconnectAttempt >= maxAttempts) {
            setConnectionError('Connection lost. Please refresh to retry.');
            setIsReconnecting(false);
            return;
        }

        // Exponential backoff with jitter
        const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttempt) + Math.random() * 1000,
            maxDelay
        );

        setReconnectAttempt(prev => prev + 1);
        setConnectionError(`Connection lost. Reconnecting in ${Math.round(delay / 1000)}s...`);

        reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket(true);
        }, delay);
    };

    // Timer functions
    const startTimer = () => {
        // Prevent multiple timer instances
        if (timerIntervalRef.current) {
            console.log('Timer already running, skipping start');
            return;
        }

        if (!timerStarted) {
            console.log('Starting timer...');
            setTimerStarted(true);
            setInterviewTimer(0);

            timerIntervalRef.current = window.setInterval(() => {
                setInterviewTimer(prev => {
                    const newValue = prev + 1;
                    console.log('Timer tick:', newValue);
                    return newValue;
                });
            }, 1000);

            console.log('Timer started with interval ID:', timerIntervalRef.current);
        }
    };

    const stopTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            console.log('Timer stopped');
        }
        setTimerStarted(false);
    };

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Speech recognition functions
    const startListening = () => {
        if (recognitionRef.current && speechSupported) {
            try {
                recognitionRef.current.start();
                console.log('Starting speech recognition...');
            } catch (error) {
                console.error('Error starting speech recognition:', error);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            console.log('Stopping speech recognition...');
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const clearSpeechText = () => {
        setSpeechText('');
        // Don't clear answer text as user might want to keep typed content
    };

    // Text-to-speech functions
    const speakText = (text: string) => {
        if (!ttsSupported || !text.trim()) return;

        // Stop any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        utterance.onstart = () => {
            setIsSpeaking(true);
            console.log('🔊 Started reading question');
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            console.log('🔇 Finished reading question');
        };

        utterance.onerror = () => {
            setIsSpeaking(false);
            console.error('❌ TTS error');
        };

        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    // Function to start the interview (for manual start if needed)
    // const startInterview = () => {
    //     if (wsRef.current && isConnected) {
    //         console.log('Starting interview...');
    //         wsRef.current.send(JSON.stringify({ type: 'startInterview' }));
    //         setInterviewStarted(true);
    //     }
    // };

    // Simple camera implementation like major websites (aesthetic only)
    const enableCamera = async () => {
        try {
            console.log('📹 Requesting camera access...');

            // Simple, reliable getUserMedia call
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            console.log('✅ Camera stream obtained');
            setCameraStream(stream);

            // Simple video element setup
            if (videoRef.current) {
                const video = videoRef.current;

                video.srcObject = stream;
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;

                video.onloadedmetadata = () => {
                    video.play().catch(console.error);
                    console.log('📺 Video playing');
                };
            }

            setCameraEnabled(true);
            setCameraError(null);
        } catch (error) {
            console.error('Camera error:', error);

            let errorMessage = 'Camera unavailable. ';
            if (error instanceof Error) {
                switch (error.name) {
                    case 'NotAllowedError':
                        errorMessage += 'Please allow camera access.';
                        break;
                    case 'NotFoundError':
                        errorMessage += 'No camera found.';
                        break;
                    case 'NotReadableError':
                        errorMessage += 'Camera in use by another app.';
                        break;
                    default:
                        errorMessage += 'Please check your camera.';
                }
            }

            setCameraEnabled(false);
            setCameraError(errorMessage);
        }
    };

    const disableCamera = () => {
        console.log('Disabling camera...');

        if (cameraStream) {
            cameraStream.getTracks().forEach(track => {
                track.stop();
                console.log('Camera track stopped:', track.kind);
            });
            setCameraStream(null);
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraEnabled(false);
        console.log('Camera disabled');
    };

    const toggleCamera = async () => {
        if (cameraEnabled) {
            disableCamera();
        } else {
            await enableCamera();
        }
    };

    // Whiteboard - fixed coordinate system approach
    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        setIsDrawing(true);

        const coords = getCanvasCoordinates(e);
        setLastPosition(coords);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Start a new path at this point
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);

        console.log('Start draw at:', coords.x, coords.y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const coords = getCanvasCoordinates(e);

        // Draw line from last position to current position
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        setLastPosition(coords);
        console.log('Draw to:', coords.x, coords.y);
    };

    const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
        if (e) e.preventDefault();
        setIsDrawing(false);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // End the current path
        ctx.beginPath();
        console.log('Stop drawing');
    };

    const clearWhiteboard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and reset canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Reset drawing context
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        console.log('Cleared whiteboard');
    };

    // Proper canvas setup with drawing context
    useEffect(() => {
        const timer = setTimeout(() => {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Set fixed canvas dimensions
                    canvas.width = 800;
                    canvas.height = 400;

                    // Setup drawing context properties
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.strokeStyle = '#2563eb';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.imageSmoothingEnabled = true;

                    console.log('Canvas ready:', canvas.width, 'x', canvas.height);
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const saveWhiteboardAsImage = () => {
        if (!canvasRef.current) return '';

        try {
            // Convert canvas to high-quality PNG data URL
            const dataURL = canvasRef.current.toDataURL('image/png', 1.0);
            console.log('💾 Whiteboard digitized:', {
                size: dataURL.length,
                format: 'PNG',
                compressed: false
            });
            return dataURL;
        } catch (error) {
            console.error('Error digitizing whiteboard:', error);
            return '';
        }
    };

    const saveWhiteboardAsCompressedImage = () => {
        if (!canvasRef.current) return '';

        try {
            // Convert canvas to compressed JPEG for smaller file size
            const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.8);
            console.log('📦 Whiteboard compressed:', {
                size: dataURL.length,
                format: 'JPEG',
                quality: '80%'
            });
            return dataURL;
        } catch (error) {
            console.error('Error compressing whiteboard:', error);
            return '';
        }
    };

    // Enhanced function to send answer with tools content
    const sendAnswer = () => {
        if (wsRef.current && isConnected && answerText.trim()) {
            const messageType = isFollowup ? 'followupAnswer' : 'questionAnswer';

            // Save whiteboard as compressed image data
            const whiteboardImageData = saveWhiteboardAsCompressedImage();

            // Prepare answer with additional content from tools
            const answerData = {
                type: messageType,
                content: answerText.trim(),
                codeContent: codeContent.trim() || null,
                whiteboardContent: whiteboardContent.trim() || null,
                whiteboardImage: whiteboardImageData || null,
                speechText: speechText.trim() || null,
                toolsUsed: {
                    code: codeContent.trim().length > 0,
                    whiteboard: !!whiteboardImageData,
                    speech: speechText.trim().length > 0
                }
            };

            console.log(`📤 Sending ${messageType} with tools:`, {
                textLength: answerData.content.length,
                hasCode: answerData.toolsUsed.code,
                hasWhiteboard: answerData.toolsUsed.whiteboard,
                hasSpeech: answerData.toolsUsed.speech
            });

            wsRef.current.send(JSON.stringify(answerData));

            // Clear inputs after sending
            setAnswerText('');
            setCodeContent('');
            setWhiteboardContent('');
            setSpeechText('');
            clearWhiteboard();
            if (isListening) stopListening();
            setIsWaitingForResponse(true);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendAnswer();
        }
    };

    // Auto-connect when component mounts (with single connection guard)
    useEffect(() => {
        // Prevent multiple connection attempts
        if (wsRef.current) {
            console.log('WebSocket already exists, skipping connection');
            return;
        }

        console.log('🔌 Initial WebSocket connection attempt');
        connectWebSocket();

        // Set a timeout to handle connection failures
        const connectionTimeout = setTimeout(() => {
            if (!isConnected) {
                setConnectionError('Connection timeout - please try again');
            }
        }, 10000); // 10 seconds timeout

        return () => {
            clearTimeout(connectionTimeout);
            stopHeartbeat();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close(1000, 'Component unmounting');
            }
            // Clean up camera and timer when component unmounts
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
            stopTimer();
        };
    }, []); // Empty dependency array ensures this only runs once

    // Clear timeout when connected
    useEffect(() => {
        if (isConnected) {
            setConnectionError(null);
        }
    }, [isConnected]);

    // Clean up timer when component unmounts or interview completes
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
                console.log('Timer cleanup on unmount');
            }
        };
    }, []);

    // Stop timer when interview is complete
    useEffect(() => {
        if (interviewComplete && timerStarted) {
            stopTimer();
        }
    }, [interviewComplete, timerStarted]);

    return (
        <div className="interview">
            <div className="interview-header">
                <h1>{preset?.type} Interview</h1>
                <div className="interview-meta">
                    <span>📚 Topic: {preset?.topic}</span>
                    <span>⏱️ Duration: {preset?.expectedDuration}</span>
                    <span>📊 Difficulty: {preset?.difficulty}</span>
                </div>
            </div>

            <div className="interview-content">
                {/* Left Side: Camera + Question */}
                <div className="interview-left">
                    {/* Status Bar */}
                    <div className="status-bar">
                        <span className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                        </span>
                        <div className="question-progress">
                            {questionIndex > 0 && (
                                <span className="question-counter">
                                    Question {questionIndex} {isFollowup ? '(Follow-up)' : ''}
                                </span>
                            )}
                            <span className="interview-timer">⏱️ {formatTime(interviewTimer)}</span>
                        </div>
                    </div>

                    {/* Camera Section */}
                    <div className="camera-section">
                        <div className="camera-header">
                            <h3 className="camera-title">📹 Video Feed</h3>
                            <div className="camera-controls">
                                <button
                                    className={`camera-btn ${cameraEnabled ? 'active' : ''}`}
                                    onClick={toggleCamera}
                                >
                                    {cameraEnabled ? '📹 On' : '📹 Off'}
                                </button>
                                <button className="camera-btn">⚙️</button>
                            </div>
                        </div>
                        <div className="camera-view">
                            {cameraEnabled ? (
                                <video
                                    ref={videoRef}
                                    className="camera-video"
                                    autoPlay
                                    playsInline
                                    muted
                                />
                            ) : cameraError ? (
                                <div className="camera-error">
                                    <div>❌ Camera Error</div>
                                    <div className="error-details">{cameraError}</div>
                                    <button
                                        className="retry-btn"
                                        onClick={() => {
                                            setCameraError(null);
                                            enableCamera();
                                        }}
                                    >
                                        🔄 Try Again
                                    </button>
                                </div>
                            ) : (
                                <div className="camera-placeholder">
                                    {/* Clean, minimal placeholder */}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question Section */}
                    <div className="question-section">
                        {currentQuestion ? (
                            <>
                                <div className="question-header">
                                    <div className="question-type">
                                        {isFollowup ? 'Follow-up Question:' : 'Question:'}
                                    </div>
                                    {ttsSupported && (
                                        <button
                                            className={`tts-btn ${isSpeaking ? 'speaking' : ''}`}
                                            onClick={() => isSpeaking ? stopSpeaking() : speakText(currentQuestion)}
                                            title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                                        >
                                            {isSpeaking ? '🔇 Stop' : '🔊 Listen'}
                                        </button>
                                    )}
                                </div>
                                <h2>{currentQuestion}</h2>
                            </>
                        ) : (
                            <h2>
                                {connectionError ? connectionError :
                                 !isConnected ? 'Connecting to interview...' :
                                 isConnected && !interviewStarted ? 'Starting interview...' :
                                 'Ready to start your interview!'
                                }
                            </h2>
                        )}
                    </div>

                    {/* Answer Input */}
                    {interviewStarted && currentQuestion && (
                        <div className="answer-section">
                            <div className="answer-header">
                                <h3 className="answer-label">Your Answer</h3>
                                <div className="speech-controls">
                                    {speechSupported ? (
                                        <>
                                            <button
                                                className={`speech-btn ${isListening ? 'listening' : ''}`}
                                                onClick={toggleListening}
                                                disabled={isWaitingForResponse}
                                                title={isListening ? 'Stop recording' : 'Start speech-to-text'}
                                            >
                                                {isListening ? '🎙️ Recording...' : '🎤 Speak'}
                                            </button>
                                            {speechText && (
                                                <button
                                                    className="speech-btn clear"
                                                    onClick={clearSpeechText}
                                                    title="Clear speech text"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <span className="speech-unsupported">🎤 Speech not supported</span>
                                    )}
                                </div>
                            </div>

                            <div className="answer-workspace">
                                <textarea
                                    value={answerText}
                                    onChange={(e) => setAnswerText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your answer or use speech-to-text..."
                                    className={`answer-input ${speechText ? 'speech-mode' : ''}`}
                                    disabled={isWaitingForResponse || isListening}
                                    readOnly={isListening}
                                    rows={4}
                                />
                                {isListening && (
                                    <div className="speech-indicator">
                                        <span className="listening-animation">🎤️</span>
                                        <span>Listening... Speak now</span>
                                    </div>
                                )}
                            </div>

                            <div className="answer-controls">
                                <div className="answer-controls-left">
                                    <button
                                        className="btn btn-primary"
                                        onClick={sendAnswer}
                                        disabled={!answerText.trim() || isWaitingForResponse}
                                    >
                                        {isWaitingForResponse ? 'Sending...' : 'Send Answer'}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setAnswerText('');
                                            setCodeContent('');
                                            setWhiteboardContent('');
                                            setSpeechText('');
                                            if (isListening) stopListening();
                                        }}
                                        disabled={isWaitingForResponse}
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="answer-controls-right">
                                    <span className="character-count">
                                        {answerText.length} chars
                                    </span>
                                    {speechText && (
                                        <span className="speech-status">
                                            📝 Speech captured
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Interview Results */}
                    {interviewComplete && (
                        <div className="scores-section">
                            <h3>Interview Results</h3>
                            {scores ? (
                                <div className="scores-grid">
                                    <div className="score-item">
                                        <div className="score-label">Technical Skills</div>
                                        <div className="score-value">{scores.technical || 'N/A'}/100</div>
                                    </div>
                                    <div className="score-item">
                                        <div className="score-label">Communication</div>
                                        <div className="score-value">{scores.communication || 'N/A'}/100</div>
                                    </div>
                                    <div className="score-item">
                                        <div className="score-label">Problem Solving</div>
                                        <div className="score-value">{scores.problemSolving || 'N/A'}/100</div>
                                    </div>
                                </div>
                            ) : (
                                <p>Calculating scores...</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side: Code/Whiteboard Tools */}
                <div className="interview-right">
                    <div className="tools-panel">
                        <div className="tools-header">
                            <h3 className="tools-title">Work Area</h3>
                            <div className="tools-tabs">
                                <button
                                    className={`tool-tab ${activeToolTab === 'code' ? 'active' : ''}`}
                                    onClick={() => setActiveToolTab('code')}
                                >
                                    💻 Code Editor
                                </button>
                                <button
                                    className={`tool-tab ${activeToolTab === 'whiteboard' ? 'active' : ''}`}
                                    onClick={() => setActiveToolTab('whiteboard')}
                                >
                                    🎨 Whiteboard
                                </button>
                            </div>
                        </div>

                        <div className="tools-content">
                            {activeToolTab === 'code' ? (
                                <div className="code-editor-container">
                                    <div className="editor-header">
                                        <select
                                            value={selectedLanguage}
                                            onChange={(e) => setSelectedLanguage(e.target.value)}
                                            className="language-select"
                                        >
                                            <option value="javascript">JavaScript</option>
                                            <option value="python">Python</option>
                                            <option value="java">Java</option>
                                            <option value="cpp">C++</option>
                                            <option value="csharp">C#</option>
                                            <option value="go">Go</option>
                                            <option value="rust">Rust</option>
                                            <option value="typescript">TypeScript</option>
                                        </select>
                                    </div>
                                    <Editor
                                        height="calc(100% - 40px)"
                                        language={selectedLanguage}
                                        theme="vs-dark"
                                        value={codeContent}
                                        onChange={(value) => setCodeContent(value || '')}
                                        options={{
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false,
                                            fontSize: 14,
                                            wordWrap: 'on',
                                            lineNumbers: 'on',
                                            glyphMargin: false,
                                            folding: false,
                                            lineDecorationsWidth: 0,
                                            lineNumbersMinChars: 1,
                                            automaticLayout: true,
                                            renderLineHighlight: 'none',
                                            overviewRulerBorder: false,
                                            hideCursorInOverviewRuler: true,
                                            scrollbar: {
                                                verticalScrollbarSize: 8,
                                                horizontalScrollbarSize: 8
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="whiteboard-container">
                                    <div className="whiteboard-header">
                                        <h4 className="whiteboard-title">Digital Whiteboard</h4>
                                        <div className="whiteboard-controls">
                                            <button
                                                className="whiteboard-btn"
                                                onClick={clearWhiteboard}
                                                type="button"
                                            >
                                                🗑️ Clear
                                            </button>
                                        </div>
                                    </div>
                                    <canvas
                                        ref={canvasRef}
                                        className="whiteboard-canvas"
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={stopDrawing}
                                        onMouseLeave={stopDrawing}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Interview