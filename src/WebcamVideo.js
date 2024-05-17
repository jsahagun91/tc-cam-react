import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";

const WebcamStreamCapture = () => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const canvasRef = useRef(null);
    const [capturing, setCapturing] = useState(false);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [blockHeight, setBlockHeight] = useState("Waiting for data");

    useEffect(() => {
        const fetchBlockHeight = () => {
            fetch('https://mempool.space/api/blocks/tip/height')
                .then(response => response.json())
                .then(data => setBlockHeight(`${data}`))
                .catch(error => console.error('Error fetching block height:', error));
        };

        fetchBlockHeight();
        const interval = setInterval(fetchBlockHeight, 5000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (capturing) {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            const video = webcamRef.current.video;

            const draw = () => {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Draw the circle and block height text
                const boxWidth = 75;
                const boxHeight = 75;
                const boxX = canvas.width - boxWidth - 20;
                const boxY = 20;

                context.shadowColor = 'orange';
                context.shadowBlur = 4;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;

                context.strokeStyle = 'red';
                context.lineWidth = 4;
                context.beginPath();
                context.arc(boxX + boxWidth / 2, boxY + boxHeight / 2, boxWidth / 2, 0, 2 * Math.PI);
                context.stroke();

                context.shadowColor = 'transparent';

                context.fillStyle = 'transparent';
                context.beginPath();
                context.arc(boxX + boxWidth / 2, boxY + boxHeight / 2, (boxWidth / 2) - 4, 0, 2 * Math.PI);
                context.fill();

                context.fillStyle = 'white';
                context.font = 'bold 1rem Arial';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(blockHeight, boxX + boxWidth / 2, boxY + boxHeight / 2);

                requestAnimationFrame(draw);
            };

            draw();
        }
    }, [capturing, blockHeight]);

    const handleStartCaptureClick = useCallback(() => {
        setCapturing(true);
        const canvas = canvasRef.current;
        const stream = canvas.captureStream();
        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: "video/webm"
        });
        mediaRecorderRef.current.addEventListener(
            "dataavailable",
            handleDataAvailable
        );
        mediaRecorderRef.current.start();
    }, [setCapturing, mediaRecorderRef]);

    const handleDataAvailable = useCallback(
        ({ data }) => {
            if (data.size > 0) {
                setRecordedChunks((prev) => prev.concat(data));
            }
        },
        [setRecordedChunks]
    );

    const handleStopCaptureClick = useCallback(() => {
        mediaRecorderRef.current.stop();
        setCapturing(false);
    }, [mediaRecorderRef, setCapturing]);

    const handleDownload = useCallback(() => {
        if (recordedChunks.length) {
            const blob = new Blob(recordedChunks, {
                type: "video/webm"
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = "react-webcam-stream-capture.webm";
            a.click();
            window.URL.revokeObjectURL(url);
            setRecordedChunks([]);
        }
    }, [recordedChunks]);

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <Webcam audio={false} ref={webcamRef} style={{ width: "100%" }} />
            <canvas ref={canvasRef} width={640} height={480} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }} />
            <div style={{
                position: "absolute",
                bottom: "5%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "50px",
                height: "50px",
                borderWidth: "4px",
                borderColor: "orange",
                borderStyle: "solid",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div onClick={capturing ? handleStopCaptureClick : handleStartCaptureClick} style={{
                    width: "30px",
                    height: "30px",
                    borderWidth: "4px",
                    borderColor: "orange",
                    borderStyle: "solid",
                    borderRadius: "50%",
                    backgroundColor: capturing ? "red" : "orange",
                    cursor: "pointer"
                }}></div>
            </div>
            {recordedChunks.length > 0 && (
                <button onClick={handleDownload} style={{ position: "absolute", bottom: "20px", right: "20px" }}>
                    Download
                </button>
            )}
        </div>
    );
}

export default WebcamStreamCapture;
