import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <DotLottieReact
                src="public/loading.json"
                loop
                autoplay
                style={{ width: 240, height: 240 }}
            />
            <p className="text-gray-500 text-lg">Loading books...</p>
        </div>
    );
}