
import React, { useRef, useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon.tsx';
import { CheckIcon } from './icons/CheckIcon.tsx';
import Spinner from './Spinner.tsx';
import { analyzeReceipt } from '../services/geminiService.ts';
import { AnalyzedReceipt } from '../types.ts';

interface ReceiptScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (receipt: AnalyzedReceipt) => void;
}

const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalyzedReceipt | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera();
        }
        return () => stopCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, capturedImage]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' },
                audio: false 
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            setError("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageData);
                stopCamera();
                performAnalysis(imageData);
            }
        }
    };

    const performAnalysis = async (base64Image: string) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const data = base64Image.split(',')[1];
            const result = await analyzeReceipt(data, 'image/jpeg');
            setAnalysisResult(result);
        } catch (err: any) {
            setError("AI analysis failed. Please try again.");
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setError(null);
        startCamera();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                {/* Header */}
                <div className="p-6 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white">AI Receipt Scanner</h2>
                        <p className="text-xs text-slate-400">Capture invoices or receipts for instant bookkeeping</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Viewport */}
                <div className="flex-grow relative bg-black flex items-center justify-center overflow-hidden">
                    {!capturedImage ? (
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <img 
                            src={capturedImage} 
                            className="w-full h-full object-contain"
                            alt="Captured Receipt" 
                        />
                    )}

                    {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <Spinner className="w-12 h-12 text-teal-500" />
                            <p className="mt-4 text-teal-400 font-bold animate-pulse">Sipho is reading your receipt...</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute bottom-10 left-4 right-4 bg-red-500 text-white p-4 rounded-xl text-center shadow-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Result Area */}
                {analysisResult && (
                    <div className="bg-white dark:bg-slate-900 p-6 space-y-4 animate-slide-up">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Merchant</label>
                                <p className="font-bold text-slate-900 dark:text-white">{analysisResult.merchant}</p>
                            </div>
                            <div className="text-right">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Total</label>
                                <p className="font-mono font-bold text-teal-600">R {analysisResult.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t dark:border-slate-800 pt-4">
                            <span className="text-slate-500">Category: {analysisResult.suggestedCategory}</span>
                            <span className="text-slate-500">VAT: R {analysisResult.vatAmount.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div className="p-6 bg-slate-800/50 flex justify-center gap-4">
                    {!capturedImage ? (
                        <button 
                            onClick={handleCapture}
                            className="w-20 h-20 bg-white rounded-full border-8 border-slate-700 active:scale-90 transition-transform flex items-center justify-center"
                        >
                            <div className="w-12 h-12 bg-teal-500 rounded-full"></div>
                        </button>
                    ) : (
                        <div className="flex gap-4 w-full">
                            <button 
                                onClick={handleReset}
                                disabled={isAnalyzing}
                                className="flex-1 py-3 px-6 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 disabled:opacity-50"
                            >
                                Retake
                            </button>
                            {analysisResult && (
                                <button 
                                    onClick={() => onConfirm(analysisResult)}
                                    className="flex-1 py-3 px-6 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-500 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <CheckIcon className="w-5 h-5" /> Import Entry
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default ReceiptScannerModal;
