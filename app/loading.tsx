'use client';

import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';

console.log('[DEBUG] loading.tsx module loaded');

setWasmUrl('/dotlottie-player.wasm');

console.log('[DEBUG] setWasmUrl called');

export default function Loading() {
    console.log('[DEBUG] Loading component function called');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <DotLottieReact
                src="/loading.json"
                loop
                autoplay
                style={{ width: 240, height: 240 }}
                dotLottieRefCallback={(dotLottie) => {
                    console.log('[DEBUG] dotLottieRefCallback fired, instance:', dotLottie);
                    if (dotLottie) {
                        dotLottie.addEventListener('load', () => console.log('[DEBUG] animation load event'));
                        dotLottie.addEventListener('loadError', (e: any) => console.log('[DEBUG] animation loadError event:', e));
                    }
                }}
            />
            <p className="text-gray-500 text-lg">Loading books...</p>
        </div>
    );
}