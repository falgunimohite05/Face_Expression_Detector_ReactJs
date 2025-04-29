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
