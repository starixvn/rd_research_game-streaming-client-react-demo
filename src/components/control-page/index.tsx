import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const ControlPage = () => {
    const [socket, setSocket] = useState<Socket>();
    const [videoUrl, setVideoUrl] = useState<{ [key: string]: string }>({
        "720p": "",
        "240p": "",
    });
    const videoRef = useRef<HTMLVideoElement>(null);
    const [resolution, setResolution] = useState("720p");
    const [hls, setHls] = useState<Hls | null>(null);

    useEffect(() => {
        console.log("videoUrl", videoUrl);
        if (videoUrl[resolution] && Hls.isSupported()) {
            const hlsInstance = new Hls();
            hlsInstance.loadSource(videoUrl[resolution]);
            hlsInstance.attachMedia(videoRef.current!);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
                videoRef.current!.play();
                console.log(
                    "manifest parsed",
                    videoRef.current!.currentTime,
                    videoRef.current?.duration,
                );
            });
            setHls(hlsInstance);
        }
    }, [videoUrl, resolution]);
    const handleClickConnect = () => {
        const socket = io("https://game-streaming-service-demo.lumigame.com/");
        socket.on("connect", () => {
            console.log("connected");
        });
        socket.on("disconnect", () => {
            console.log("disconnected");
        });
        socket.on("syncVideo", (data) => {
            console.log("syncVideo", data);
            videoRef.current!.currentTime = data.currentTime;
        });
        socket.on("gameResult", (data) => {
            console.log(
                "gameResult",
                data as { videoUrl: { [key: string]: string } },
            );
            if (data && data.videoUrl && data.videoUrl) {
                setVideoUrl(data.videoUrl);
            }
        });
        socket.on("error", (data) => {
            console.log("error", data);
        });
        socket.on("joinGame", (data) => {
            console.log("joinGame", data);
            if (data && data.videoUrl && data.videoUrl["720p"]) {
                setVideoUrl(data.videoUrl);
            }
        });
        setSocket(socket);
    };
    const handleClickSyncVideo = () => {
        if (socket) {
            socket.emit("syncVideo", socket.id);
            console.log("currentTime", videoRef.current?.currentTime);
        }
    };
    const handleClickPauseVideo = () => {
        if (hls && videoRef.current) {
            console.log("stopLoad");
            videoRef.current!.pause();
        }
    };
    const handleClickPlayVideo = () => {
        if (hls && videoRef.current) {
            videoRef.current!.play();
        }
    };
    const handleClickDisconnect = () => {
        if (socket) {
            socket.disconnect();
        }
    };
    return (
        <>
            <div>
                <button onClick={handleClickConnect}>Connect</button>
                <button onClick={handleClickSyncVideo}>Sync Video</button>
                <button onClick={handleClickPauseVideo}>Pause</button>
                <button onClick={handleClickPlayVideo}>Play</button>
                <button onClick={() => setResolution("240p")}>240p</button>
                <button onClick={() => setResolution("720p")}>720p</button>
                <button onClick={handleClickDisconnect}>Disconnect</button>
            </div>
            <div>
                <video ref={videoRef}></video>
            </div>
        </>
    );
};

export default ControlPage;
