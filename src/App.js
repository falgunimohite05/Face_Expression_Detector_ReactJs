import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "./App.css";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectExpressions, setDetectExpressions] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [expression, setExpression] = useState(null);

  useEffect(() => {
    startVideo();
    loadModels();
  }, []);

  useEffect(() => {
    let interval;
    if (isDetecting) {
      interval = setInterval(detectFaces, 200);
    }
    return () => clearInterval(interval);
  }, [isDetecting, detectExpressions]);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        videoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Error accessing webcam:", err));
  };

  const loadModels = async () => {
    const MODEL_URL = '/models';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  };

  const detectFaces = async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) return;

    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    setFaceCount(detections.length);

    detections.forEach(detection => {
      const { x, y, width, height } = detection.detection.box;
      const expressions = detection.expressions;
      const [topExpression, confidence] = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
      const labelText = `${topExpression} (${(confidence * 100).toFixed(1)}%)`;

      // Draw bounding box
      context.beginPath();
      context.lineWidth = "3";
      context.strokeStyle = "lime";
      context.rect(x, y, width, height);
      context.stroke();

      // Draw label box just above the bounding box
      context.fillStyle = "lime";
      const textWidth = context.measureText(labelText).width;
      const textHeight = 20;

      context.fillRect(x, y - textHeight, textWidth + 10, textHeight);

      // Draw label text inside the label box
      context.fillStyle = "black";
      context.font = "16px Arial";
      context.fillText(labelText, x + 5, y - 5);
    });

    if (detectExpressions && detections.length > 0) {
      const topOverall = Object.entries(detections[0].expressions).sort((a, b) => b[1] - a[1])[0];
      setExpression(topOverall[0]);
    } else {
      setExpression(null);
    }
  };

  const toggleDetection = () => {
    setIsDetecting(prev => !prev);
  };

  const toggleExpressionDetection = () => {
    setDetectExpressions(prev => !prev);
  };

  const getBackgroundColor = () => {
    switch (expression) {
      case "happy":
        return "#d1f7c4";
      case "angry":
        return "#f9c0c0";
      case "sad":
        return "#c0d6f9";
      case "surprised":
        return "#fff3b0";
      default:
        return "white";
    }
  };

  return (
    <div className="App" style={{ backgroundColor: getBackgroundColor() }}>
      <h1>Face Detection & Expression Recognition</h1>
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="video-element"
          width="720"
          height="560"
        />
        <canvas ref={canvasRef} className="canvas-element" />
      </div>
      <div className="controls">
        <button onClick={toggleDetection} className={isDetecting ? "stop-btn" : "start-btn"}>
          {isDetecting ? "Stop Detection" : "Start Detection"}
        </button>
        <button onClick={toggleExpressionDetection} className="toggle-btn">
          {detectExpressions ? "Disable Expression Detection" : "Enable Expression Detection"}
        </button>
      </div>
      <div className="info">
        <p>Face Count: {faceCount}</p>
        <p>Top Expression: {expression ? expression : "None"}</p>
      </div>
    </div>
  );
}

export default App;



/*import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export default function FaceExpressionDetector() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [expression, setExpression] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [detectExpressions, setDetectExpressions] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [stream, setStream] = useState(null);
  const intervalRef = useRef(null);

  const expressionColors = {
    happy: '#e6ffed',
    sad: '#e0f0ff',
    angry: '#ffe0e0',
    surprised: '#fff8d9',
    neutral: '#f4f4f4',
    fearful: '#f8e8ff',
    disgusted: '#fde4d0'
  };

  const currentBg = detectExpressions && expressionColors[expression] ? expressionColors[expression] : '#f9f9f9';

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    const userStream = await navigator.mediaDevices.getUserMedia({ video: {} });
    videoRef.current.srcObject = userStream;
    setStream(userStream);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStream(null);
    }
    stopDetection();
  };

  const toggleDetection = () => {
    if (detecting) {
      stopDetection();
    } else {
      intervalRef.current = setInterval(detectFaces, 300);
      setDetecting(true);
    }
  };

  const stopDetection = () => {
    clearInterval(intervalRef.current);
    setDetecting(false);
    setExpression(null);
    setFaceCount(0);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const detectFaces = async () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) return;
  
    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();
  
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
  
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
  
    setFaceCount(detections.length);
  
    detections.forEach((detection) => {
      const box = detection.detection.box;
      const expressions = detection.expressions;
  
      // Get the top expression and score
      const [topExpression, confidence] = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
      const labelText = `${topExpression} (${(confidence * 100).toFixed(1)}%)`;
  
      // Draw bounding box
      context.beginPath();
      context.lineWidth = "3";
      context.strokeStyle = "lime";
      context.rect(box.x, box.y, box.width, box.height);
      context.stroke();
  
      // Draw label background
      context.fillStyle = "rgba(0, 0, 0, 0.7)";
      context.fillRect(box.x, box.y - 24, context.measureText(labelText).width + 12, 24);
  
      // Draw label text
      context.fillStyle = "white";
      context.font = "16px Arial";
      context.fillText(labelText, box.x + 6, box.y - 6);
    });
  
    if (detectExpressions && detections.length > 0) {
      const topOverall = Object.entries(detections[0].expressions).sort((a, b) => b[1] - a[1])[0];
      setExpression(topOverall[0]);
    } else {
      setExpression(null);
    }
  };
  
  
  

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 py-8 transition-all duration-300"
      style={{ backgroundColor: currentBg }}
    >
      <h1 className="text-4xl font-bold text-center mb-6">🎭 Face Expression Detector</h1>

      <div className="relative w-full max-w-3xl aspect-video rounded-xl shadow-lg border border-gray-300 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="absolute top-0 left-0 w-full h-full object-cover rounded-xl"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full rounded-xl"
        />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={startCamera}
          className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 font-semibold shadow-md"
        >
          📸 Start Camera
        </button>
        <button
          onClick={stopCamera}
          className="bg-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-800 font-semibold shadow-md"
        >
          🛑 Stop Camera
        </button>
        <button
          onClick={toggleDetection}
          className={`text-white px-6 py-3 rounded-full font-semibold shadow-md ${
            detecting ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {detecting ? '❌ Stop Detection' : '▶️ Start Detection'}
        </button>
        <button
          onClick={() => setDetectExpressions(!detectExpressions)}
          className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 font-semibold shadow-md"
        >
          {detectExpressions ? '😶 Disable Expression' : '😊 Enable Expression'}
        </button>
      </div>

      <div className="mt-10 text-center space-y-2">
        <p className="text-2xl font-semibold">👤 Faces Detected: {faceCount}</p>
        {detectExpressions && expression && (
          <p className="text-2xl">
            Expression: <span className="capitalize font-bold">{expression}</span>
          </p>
        )}
      </div>
    </div>
  );
}*/
