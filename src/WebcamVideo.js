import Webcam from "react-webcam";
import React, { useState, useRef, useEffect, useCallback } from "react";

const WebcamStreamCapture = () => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
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

    const handleStartCaptureClick = useCallback(() => {
        setCapturing(true);
        mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
            mimeType: "video/webm"
        });
        mediaRecorderRef.current.addEventListener(
            "dataavailable",
            handleDataAvailable
        );
        mediaRecorderRef.current.start();
    }, [webcamRef, setCapturing, mediaRecorderRef]);

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
    }, [mediaRecorderRef, webcamRef, setCapturing]);

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

    const videoConstraints = {
        width: 390,
        height: 390,
        facingMode: "environment",
      };

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <Webcam audio={false} ref={webcamRef} videoConstraints={videoConstraints}/>
            <div style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                width: "55px",
                height: "55px",
                borderWidth: "4px",
                borderColor: "red",
                borderStyle: "solid",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 0 4px orange",
                color: "white",
                fontWeight: "800",
                fontSize: ".65rem",
                backgroundColor: "rgba(0, 0, 0, 0.5)"
            }}>
                {blockHeight}
            </div>
            <div style={{
                position: "absolute",
                bottom: "-25%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "45px",
                height: "45px",
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
            {/* {recordedChunks.length > 0 && (
                <button onClick={handleDownload} style={{ position: "absolute", bottom: "20px", right: "20px" }}>
                    Download
                </button>
            )} */}
        </div>
    )
}

export default WebcamStreamCapture;
